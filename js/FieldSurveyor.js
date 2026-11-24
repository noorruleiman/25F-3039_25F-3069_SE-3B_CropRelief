/* FieldSurveyor.js - UML Subclass: FieldSurveyor (Assigned inspections & survey findings). */
class FieldSurveyor extends User {
  constructor(record) {
    super({ ...record, role: 'surveyor' });
    this.employeeId = record.id;
    this.district = record.district || 'Punjab';
  }

  viewAssigned() {
    return Storage.get('reports').filter((r) => r.surveyorId === this.id && r.status === 'Assigned');
  }

  submitFindings(reportId, acres, percent, photos = [], gps = '') {
    const survey = new SurveyReport({ acres, pct: percent, photos, gps });
    const validationError = survey.validate();
    if (validationError) return { ok: false, msg: validationError };

    const reports = Storage.get('reports');
    const target = reports.find((r) => r.id === reportId);
    if (!target) return { ok: false, msg: 'Report not found' };

    target.status = 'Surveyed';
    target.survey = {
      surveyId: survey.surveyId,
      acres: survey.acres,
      pct: survey.pct,
      photos: survey.photos,
      gps: survey.gps
    };
    Storage.set('reports', reports);

    Storage.logAudit(reportId, 'Surveyed', this.id);
    Notification.send(target.farmerId, `Report ${reportId}: Surveyed`);
    return { ok: true, msg: 'Findings submitted' };
  }
}
