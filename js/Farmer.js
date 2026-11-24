/* Farmer.js - UML Subclass: Farmer (Registration, plot management, reporting, appeals). */
class Farmer extends User {
  constructor(record) {
    super({ ...record, role: 'farmer' });
    this.cnic = record.cnic || '';
    this.language = I18N.lang();
  }

  static register(data) {
    const users = Storage.get('users');
    if (!data.name || !data.name.trim()) return { ok: false, msg: 'Name is required' };
    if (!User.validMobile(data.mobile)) return { ok: false, msg: 'Enter a valid mobile number (03XXXXXXXXX)' };
    if (!data.password || data.password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters' };
    if (users.some((u) => u.mobile === data.mobile)) return { ok: false, msg: 'Mobile number already registered' };
    if (!/^\d{5}-\d{7}-\d$/.test(data.cnic)) return { ok: false, msg: 'CNIC must look like 35202-1234567-1' };
    if (users.some((u) => u.cnic === data.cnic)) return { ok: false, msg: 'CNIC already registered' };
    if (!data.khasra || !(Number(data.acres) > 0)) {
      return { ok: false, msg: 'Khasra number and acreage (> 0) are required' };
    }

    const id = Storage.nextId('U');
    users.push({
      id,
      role: 'farmer',
      name: data.name.trim(),
      mobile: data.mobile,
      cnic: data.cnic,
      password: User.hash(data.password),
      active: true
    });
    Storage.set('users', users);

    const plot = new LandPlot({
      farmerId: id,
      khasra: data.khasra.trim(),
      acres: Number(data.acres),
      zone: data.zone,
      district: data.district || 'Faisalabad'
    });
    Storage.push('plots', {
      id: plot.id,
      farmerId: plot.farmerId,
      khasra: plot.khasra,
      acres: plot.acres,
      zone: plot.zone,
      district: plot.district
    });

    return { ok: true, msg: 'Account created' };
  }

  addPlot(data) {
    if (!data.khasra || !data.khasra.trim() || !(Number(data.acres) > 0)) {
      return { ok: false, msg: 'Khasra number and acreage (> 0) are required' };
    }
    const duplicate = Storage.get('plots').some(
      (p) => p.khasra.toLowerCase() === data.khasra.trim().toLowerCase() && p.district === data.district
    );
    if (duplicate) {
      return { ok: false, msg: 'This Khasra plot is already registered in ' + data.district };
    }

    const plot = new LandPlot({
      farmerId: this.id,
      khasra: data.khasra.trim(),
      acres: Number(data.acres),
      zone: data.zone,
      district: data.district
    });
    Storage.push('plots', {
      id: plot.id,
      farmerId: plot.farmerId,
      khasra: plot.khasra,
      acres: plot.acres,
      zone: plot.zone,
      district: plot.district
    });
    return { ok: true, msg: 'New land plot registered' };
  }

  submitReport(reportData, isOnline = navigator.onLine) {
    const report = new DamageReport({ ...reportData, farmerId: this.id });
    return report.submit(isOnline);
  }

  trackStatus(reportId) {
    const r = DamageReport.findById(reportId);
    return r ? r.status : 'Not found';
  }

  submitAppeal(reportId, reason) {
    const appeal = new Appeal(reportId, reason);
    return appeal.submit(this.id);
  }
}
