/* reporting.js - damage reports, priority score, duplicate check, offline drafts. */
const Reporting = {
  ZONE_FACTOR: { High: 3, Medium: 2, Low: 1 },
  priority(pct, zone) {
    return pct * (this.ZONE_FACTOR[zone] || 1);
  },
  isDuplicate(plotId, eventId) {
    return Storage.get('reports').some((r) => r.plotId === plotId && r.eventId === eventId);
  },
  validate(d, plot, event) {
    if (!plot) return 'Select a land plot';
    if (!event || !event.active || event.zone !== plot.zone || event.district !== plot.district) {
      return "No declared flood event matching this plot's district and flood zone";
    }
    if (!d.photos || d.photos.length < 1) return 'Add at least one photo (maximum 3)';
    if (!d.crop || !d.crop.trim()) return 'Crop type is required';
    if (!(d.acres > 0) || d.acres > plot.acres) return `Damaged acres must be above 0 and at most ${plot.acres}`;
    if (!Number.isInteger(d.pct) || d.pct < 1 || d.pct > 100) return 'Damage % must be a whole number from 1 to 100';
    return null;
  },
  submit(d, online = navigator.onLine) {
    const plot = Storage.get('plots').find((p) => p.id === d.plotId);
    const event = Storage.get('events').find((e) => e.id === d.eventId);
    const error = this.validate(d, plot, event);
    if (error) return { ok: false, msg: error };

    if (!online) {
      const drafts = Storage.get('drafts');
      if (drafts.length >= 20) return { ok: false, msg: 'Draft limit (20) reached' };
      drafts.push(d);
      Storage.set('drafts', drafts);
      return { ok: true, msg: 'Offline: saved as draft, will submit automatically when online' };
    }

    const dup = Storage.get('reports').find((r) => r.plotId === d.plotId && r.eventId === d.eventId);
    if (dup) return { ok: false, msg: `Duplicate blocked: report ${dup.id} already exists for this plot and flood event` };

    const report = {
      ...d,
      id: Storage.nextId('R'),
      zone: plot.zone,
      district: plot.district,
      date: d.date || new Date().toISOString().slice(0, 10),
      status: 'Submitted',
      priority: this.priority(d.pct, plot.zone),
      createdAt: new Date().toISOString()
    };
    Storage.push('reports', report);
    Workflow.log(report.id, 'Submitted', d.farmerId);
    Notify.send(d.farmerId, `Report ${report.id} submitted. Priority score ${report.priority}.`);
    return { ok: true, msg: `Report ${report.id} submitted` };
  },
  syncDrafts() {
    const drafts = Storage.get('drafts');
    Storage.set('drafts', []);
    return drafts.filter((d) => this.submit(d, true).ok).length;
  }
};