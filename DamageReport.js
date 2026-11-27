/* DamageReport.js - UML Class: DamageReport (Core claim entity, priority scoring, duplicate check, offline queue). */
class DamageReport {
  static DESK_REVIEW_LIMIT = 5; // Small claims <= 5 acres qualify for desk verification

  constructor(data) {
    this.reportId = data.id || Storage.nextId('R');
    this.id = this.reportId;
    this.farmerId = data.farmerId;
    this.plotId = data.plotId;
    this.eventId = data.eventId;
    this.cropType = data.crop;
    this.crop = data.crop;
    this.damagedAcreage = Number(data.acres);
    this.acres = this.damagedAcreage;
    this.damagePercent = Number(data.pct);
    this.pct = this.damagePercent;
    this.reportDate = data.date || new Date().toISOString().slice(0, 10);
    this.date = this.reportDate;
    this.gpsLocation = data.gps;
    this.gps = data.gps;
    this.photos = data.photos || [];
    this.status = data.status || 'Submitted';
    this.zone = data.zone || 'Low';
    this.district = data.district || '';
    this.priorityScore = data.priority ?? this.calculatePriority(FloodZone.factorFor(this.zone));
    this.priority = this.priorityScore;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  calculatePriority(zoneFactor) {
    return this.pct * (zoneFactor || 1);
  }

  static isDuplicate(plotId, eventId) {
    return Storage.get('reports').find((r) => r.plotId === plotId && r.eventId === eventId) || null;
  }

  validate(plot, event) {
    if (!plot) return 'Select a land plot';
    if (!event || !event.active || event.zone !== plot.zone || event.district !== plot.district) {
      return "No declared flood event matching this plot's district and flood zone";
    }
    if (!this.photos || this.photos.length < 1) return 'Add at least one photo (maximum 3)';
    if (!this.crop || !this.crop.trim()) return 'Crop type is required';
    if (!(this.acres > 0) || this.acres > plot.acres) {
      return `Damaged acres must be above 0 and at most ${plot.acres}`;
    }
    if (!Number.isInteger(this.pct) || this.pct < 1 || this.pct > 100) {
      return 'Damage % must be a whole number from 1 to 100';
    }
    return null;
  }

  saveDraft() {
    const drafts = Storage.get('drafts');
    if (drafts.length >= 20) {
      return { ok: false, msg: 'Draft limit (20) reached' };
    }
    drafts.push({
      farmerId: this.farmerId,
      plotId: this.plotId,
      eventId: this.eventId,
      crop: this.crop,
      acres: this.acres,
      pct: this.pct,
      date: this.date,
      gps: this.gps,
      photos: this.photos
    });
    Storage.set('drafts', drafts);
    return { ok: true, msg: 'Offline: saved as draft, will submit automatically when online' };
  }

  submit(online = navigator.onLine) {
    const plot = LandPlot.findById(this.plotId);
    const event = FloodEvent.findById(this.eventId);
    const error = this.validate(plot, event);
    if (error) return { ok: false, msg: error };

    if (!online) {
      return this.saveDraft();
    }

    const duplicate = DamageReport.isDuplicate(this.plotId, this.eventId);
    if (duplicate) {
      return {
        ok: false,
        msg: `Duplicate blocked: report ${duplicate.id} already exists for this plot and flood event`
      };
    }

    this.zone = plot.zone;
    this.district = plot.district;
    this.priorityScore = this.calculatePriority(plot.getZone().getFactor());
    this.priority = this.priorityScore;

    Storage.push('reports', {
      id: this.id,
      farmerId: this.farmerId,
      plotId: this.plotId,
      eventId: this.eventId,
      crop: this.crop,
      acres: this.acres,
      pct: this.pct,
      zone: this.zone,
      district: this.district,
      date: this.date,
      gps: this.gps,
      photos: this.photos,
      status: 'Submitted',
      priority: this.priority,
      createdAt: this.createdAt
    });

    Storage.logAudit(this.id, 'Submitted', this.farmerId);
    Notification.send(this.farmerId, `Report ${this.id} submitted. Priority score ${this.priority}.`);
    return { ok: true, msg: `Report ${this.id} submitted` };
  }

  static syncDrafts() {
    const drafts = Storage.get('drafts');
    Storage.set('drafts', []);
    return drafts.filter((draft) => new DamageReport(draft).submit(true).ok).length;
  }

  static findById(reportId) {
    return Storage.get('reports').find((r) => r.id === reportId) || null;
  }
}
