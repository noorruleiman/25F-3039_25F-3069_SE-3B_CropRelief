/* AgricultureOfficer.js - UML Subclass: AgricultureOfficer (Surveyor assignment & claim verification). */
class AgricultureOfficer extends User {
  constructor(record) {
    super({ ...record, role: 'officer' });
    this.officeCode = 'AGRI-' + record.id;
  }

  assignReport(reportId, surveyorId) {
    if (!surveyorId) return { ok: false, msg: 'Choose a surveyor' };
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === reportId);
    if (!target) return { ok: false, msg: 'Report not found' };

    target.status = 'Assigned';
    target.surveyorId = surveyorId;
    Storage.set('reports', reports);

    Storage.logAudit(reportId, 'Assigned', this.id);
    Notification.send(target.farmerId, `Report ${reportId}: Assigned`);
    return { ok: true, msg: 'Surveyor assigned' };
  }

  verifyClaim(reportId) {
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === reportId);
    if (!target) return { ok: false, msg: 'Report not found' };

    if (!target.survey && (target.acres > DamageReport.DESK_REVIEW_LIMIT || !target.photos.length || !target.gps)) {
      return {
        ok: false,
        msg: 'Desk review is only for claims up to 5 acres with photo and GPS evidence; otherwise a survey is needed'
      };
    }

    target.status = 'Verified';
    Storage.set('reports', reports);

    Storage.logAudit(reportId, 'Verified', this.id);
    Notification.send(target.farmerId, `Report ${reportId}: Verified`);
    return { ok: true, msg: 'Claim verified' };
  }

  requestResurvey(reportId) {
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === reportId);
    if (!target || !target.survey) return { ok: false, msg: 'No survey to repeat' };

    target.status = 'Assigned';
    target.survey = null;
    Storage.set('reports', reports);

    Storage.logAudit(reportId, 'Re-survey requested', this.id);
    Notification.send(target.farmerId, `Report ${reportId}: Re-survey requested`);
    return { ok: true, msg: 'Re-survey requested' };
  }

  rejectClaim(reportId, reason) {
    if (!reason || !reason.trim()) return { ok: false, msg: 'A reason is required to reject' };
    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === reportId);
    if (!target) return { ok: false, msg: 'Report not found' };

    target.status = 'Rejected';
    target.reason = reason.trim();
    Storage.set('reports', reports);

    Storage.logAudit(reportId, 'Rejected', this.id, reason.trim());
    Notification.send(target.farmerId, `Report ${reportId}: Rejected`);
    return { ok: true, msg: 'Claim rejected' };
  }
}
