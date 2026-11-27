/* CompensationClaim.js - UML Class: CompensationClaim (Relief payout calculation & decision). */
class CompensationClaim {
  static RATE_PER_ACRE = 20000; // Government relief rate per acre (PKR)

  constructor(report) {
    this.claimId = Storage.nextId('C');
    this.report = report;
    const assessed = report.survey || { acres: report.acres, pct: report.pct };
    this.approvedAmount = Math.round(assessed.acres * (assessed.pct / 100) * CompensationClaim.RATE_PER_ACRE);
    this.status = report.status;
    this.decisionDate = new Date().toISOString();
  }

  static calculateAmount(report) {
    const assessed = report.survey || { acres: report.acres, pct: report.pct };
    return Math.round(assessed.acres * (assessed.pct / 100) * CompensationClaim.RATE_PER_ACRE);
  }

  approve(officerId) {
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === this.report.id);
    if (!target) return { ok: false, msg: 'Report not found' };

    target.status = 'Approved';
    target.amount = this.approvedAmount;
    Storage.set('reports', reports);

    Storage.logAudit(target.id, 'Compensation approved', officerId, 'Rs ' + this.approvedAmount);
    Notification.send(target.farmerId, `Report ${target.id}: Approved (PKR ${this.approvedAmount.toLocaleString()})`);
    return { ok: true, msg: 'Compensation approved: Rs ' + this.approvedAmount.toLocaleString() };
  }

  reject(reason, officerId) {
    if (!reason || !reason.trim()) {
      return { ok: false, msg: 'A reason is required to decline' };
    }
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === this.report.id);
    if (!target) return { ok: false, msg: 'Report not found' };

    target.status = 'Rejected';
    target.reason = 'Compensation declined: ' + reason.trim();
    Storage.set('reports', reports);

    Storage.logAudit(target.id, 'Compensation declined', officerId, reason.trim());
    Notification.send(target.farmerId, `Report ${target.id}: Rejected`);
    return { ok: true, msg: 'Compensation declined' };
  }
}
