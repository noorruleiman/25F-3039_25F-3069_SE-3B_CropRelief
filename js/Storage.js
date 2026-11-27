/* Storage.js - Data persistence tier wrapping localStorage and demo seed data. */
class Storage {
  static get(key, fallback = []) {
    try {
      const value = JSON.parse(localStorage.getItem('cr_' + key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  static set(key, value) {
    localStorage.setItem('cr_' + key, JSON.stringify(value));
  }

  static push(key, item) {
    const list = this.get(key);
    list.push(item);
    this.set(key, list);
  }

  static nextId(prefix) {
    const seq = this.get('seq', 0) + 1;
    this.set('seq', seq);
    return prefix + seq;
  }

  static logAudit(reportId, action, by, note = '') {
    this.push('audit', {
      reportId,
      action,
      by,
      note,
      at: new Date().toISOString()
    });
  }

  /* Seeds initial demo accounts, land plots, flood events, and one surveyed report. */
  static seed(hashFn) {
    if (this.get('seeded', false)) return;
    const pw = hashFn('pass123');
    const makeUser = (id, role, name, mobile) => ({
      id,
      role,
      name,
      mobile,
      password: pw,
      active: true
    });

    this.set('users', [
      makeUser('U1', 'admin', 'Admin', '03000000000'),
      { ...makeUser('U2', 'farmer', 'Ali Khan', '03001111111'), cnic: '35202-1234567-1' },
      { ...makeUser('U6', 'farmer', 'Bilal Raza', '03001111112'), cnic: '36302-7894561-3' },
      makeUser('U3', 'surveyor', 'Sara Surveyor', '03002222222'),
      makeUser('U4', 'officer', 'Omar Agri Officer', '03003333333'),
      makeUser('U5', 'district', 'Dina District Officer', '03004444444')
    ]);

    this.set('plots', [
      { id: 'P1', farmerId: 'U2', khasra: '123/4', acres: 8, zone: 'High', district: 'Faisalabad' },
      { id: 'P2', farmerId: 'U6', khasra: '512/9', acres: 10, zone: 'High', district: 'Multan' }
    ]);

    this.set('events', [
      { id: 'E1', name: 'Flood 2026 - Faisalabad', zone: 'High', district: 'Faisalabad', active: true },
      { id: 'E2', name: 'Chenab Surge 2026 - Multan', zone: 'High', district: 'Multan', active: true }
    ]);

    this.set('reports', [
      {
        id: 'R1',
        farmerId: 'U6',
        plotId: 'P2',
        eventId: 'E2',
        crop: 'Cotton',
        acres: 8,
        pct: 85,
        zone: 'High',
        district: 'Multan',
        date: '2026-11-18',
        gps: '30.1575,71.5249',
        photos: [],
        status: 'Surveyed',
        priority: 255,
        surveyorId: 'U3',
        survey: { acres: 7.5, pct: 80, photos: [], gps: '30.1576,71.5250' },
        createdAt: new Date().toISOString()
      }
    ]);

    this.set('seq', 10);
    this.set('seeded', true);
  }
}
