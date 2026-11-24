/* User.js - UML Base Class: User (Authentication, password hashing, OTP, session). */
class User {
  static DEMO_OTP = '1234';

  constructor({ id, name, mobile, password, role, active = true }) {
    this.userId = id;
    this.id = id;
    this.name = name;
    this.mobile = mobile;
    this.passwordHash = password;
    this.role = role;
    this.active = active;
  }

  static hash(text) {
    let h = 5381;
    for (const ch of text) h = (h * 33) ^ ch.charCodeAt(0);
    return String(h >>> 0);
  }

  static validMobile(mobile) {
    return /^03\d{9}$/.test(mobile);
  }

  static login(mobile, password, otp) {
    if (!this.validMobile(mobile)) {
      return { ok: false, msg: 'Enter a valid mobile number (03XXXXXXXXX)' };
    }
    const record = Storage.get('users').find((u) => u.mobile === mobile);
    if (!record || record.password !== this.hash(password)) {
      return { ok: false, msg: 'Invalid mobile number or password' };
    }
    if (!record.active) {
      return { ok: false, msg: 'This account is deactivated' };
    }
    if (otp !== this.DEMO_OTP) {
      return { ok: false, msg: 'Invalid OTP' };
    }
    sessionStorage.setItem('cr_session', record.id);
    return { ok: true, user: this.hydrate(record) };
  }

  logout() {
    sessionStorage.removeItem('cr_session');
  }

  static logout() {
    sessionStorage.removeItem('cr_session');
  }

  static current() {
    const id = sessionStorage.getItem('cr_session');
    const record = Storage.get('users').find((u) => u.id === id);
    return record ? this.hydrate(record) : null;
  }

  static hydrate(record) {
    switch (record.role) {
      case 'farmer':
        return new Farmer(record);
      case 'surveyor':
        return new FieldSurveyor(record);
      case 'officer':
        return new AgricultureOfficer(record);
      case 'district':
        return new DistrictOfficer(record);
      case 'admin':
        return new Administrator(record);
      default:
        return new User(record);
    }
  }
}
