/* auth.js - login, OTP check, registration, plot addition, session. */
const Auth = {
  OTP: '1234', // simulated SMS one-time password
  hash(text) {
    let h = 5381;
    for (const c of text) h = (h * 33) ^ c.charCodeAt(0);
    return String(h >>> 0);
  },
  validMobile: (m) => /^03\d{9}$/.test(m),
  login(mobile, password, otp) {
    if (!this.validMobile(mobile)) return { ok: false, msg: 'Enter a valid mobile number (03XXXXXXXXX)' };
    const user = Storage.get('users').find((x) => x.mobile === mobile);
    if (!user || user.password !== this.hash(password)) return { ok: false, msg: 'Invalid mobile number or password' };
    if (!user.active) return { ok: false, msg: 'This account is deactivated' };
    if (otp !== this.OTP) return { ok: false, msg: 'Invalid OTP' };
    sessionStorage.setItem('cr_session', user.id);
    return { ok: true };
  },
  /* Creates a farmer (with land plot) or, for admins, any other role. */
  register(d, role = 'farmer') {
    const users = Storage.get('users');
    if (!d.name || !d.name.trim()) return { ok: false, msg: 'Name is required' };
    if (!this.validMobile(d.mobile)) return { ok: false, msg: 'Enter a valid mobile number (03XXXXXXXXX)' };
    if (!d.password || d.password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters' };
    if (users.some((x) => x.mobile === d.mobile)) return { ok: false, msg: 'Mobile number already registered' };
    if (role === 'farmer') {
      if (!/^\d{5}-\d{7}-\d$/.test(d.cnic)) return { ok: false, msg: 'CNIC must look like 35202-1234567-1' };
      if (users.some((x) => x.cnic === d.cnic)) return { ok: false, msg: 'CNIC already registered' };
      if (!d.khasra || !(Number(d.acres) > 0)) return { ok: false, msg: 'Khasra number and acreage (> 0) are required' };
    }
    const id = Storage.nextId('U');
    users.push({ id, role, name: d.name.trim(), mobile: d.mobile, cnic: d.cnic, password: this.hash(d.password), active: true });
    Storage.set('users', users);
    if (role === 'farmer') {
      Storage.push('plots', {
        id: Storage.nextId('P'),
        farmerId: id,
        khasra: d.khasra.trim(),
        acres: Number(d.acres),
        zone: d.zone,
        district: d.district || 'Faisalabad'
      });
    }
    return { ok: true, msg: 'Account created' };
  },
  addPlot(farmerId, d) {
    if (!d.khasra || !d.khasra.trim() || !(Number(d.acres) > 0)) {
      return { ok: false, msg: 'Khasra number and acreage (> 0) are required' };
    }
    const exists = Storage.get('plots').some((p) => p.khasra.toLowerCase() === d.khasra.trim().toLowerCase() && p.district === d.district);
    if (exists) return { ok: false, msg: 'This Khasra plot is already registered in ' + d.district };
    Storage.push('plots', {
      id: Storage.nextId('P'),
      farmerId,
      khasra: d.khasra.trim(),
      acres: Number(d.acres),
      zone: d.zone,
      district: d.district
    });
    return { ok: true, msg: 'New land plot registered' };
  },
  setRole(id, role) {
    const us = Storage.get('users');
    const target = us.find((x) => x.id === id);
    if (!target) return { ok: false, msg: 'User not found' };
    target.role = role;
    Storage.set('users', us);
    return { ok: true, msg: 'Role updated' };
  },
  current() {
    const id = sessionStorage.getItem('cr_session');
    return Storage.get('users').find((x) => x.id === id) || null;
  },
  logout() {
    sessionStorage.removeItem('cr_session');
  }
};