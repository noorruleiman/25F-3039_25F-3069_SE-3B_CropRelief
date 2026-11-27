/* Appeal.js - UML Class: Appeal (One-time farmer appeal against a rejected claim). */
class Appeal {
  constructor(reportId, reason) {
    this.appealId = Storage.nextId('A');
    this.reportId = reportId;
    this.reason = reason;
    this.status = 'Under appeal';
  }

  submit(farmerId) {
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === this.reportId);
    if (!target) return { ok: false, msg: 'Report not found' };
    if (target.appealed) return { ok: false, msg: 'This claim was already appealed once' };
    if (!this.reason || !this.reason.trim()) return { ok: false, msg: 'Enter a reason for the appeal' };

    target.status = 'Under appeal';
    target.appealed = true;
    target.appealId = this.appealId;
    Storage.set('reports', reports);

    Storage.logAudit(target.id, 'Appeal submitted', farmerId, this.reason.trim());
    Notification.send(target.farmerId, `Report ${target.id}: Under appeal`);
    return { ok: true, msg: 'Appeal submitted' };
  }

  decide(accepted, officerId) {
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === this.reportId);
    if (!target) return { ok: false, msg: 'Report not found' };

    target.status = accepted ? 'Verified' : 'Rejected';
    Storage.set('reports', reports);
    Storage.logAudit(target.id, accepted ? 'Appeal accepted' : 'Appeal rejected', officerId);
    return { ok: true, msg: accepted ? 'Appeal accepted' : 'Appeal rejected' };
  }
}
