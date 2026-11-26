/* workflow.js - assignment, survey, verification, compensation, appeal. Each returns {ok, msg}. */
const Workflow = {
  RATE_PER_ACRE: 20000, // government rate (demo value)
  DESK_REVIEW_LIMIT: 5, // acres
  log(reportId, action, by, note = '') {
    Storage.push('audit', { reportId, action, by, note, at: new Date().toISOString() });
  },
  update(id, patch, action, by, note) {
    const reports = Storage.get('reports');
    const r = reports.find((x) => x.id === id);
    if (!r) return null;
    Object.assign(r, patch);
    Storage.set('reports', reports);
    this.log(id, action, by, note);
    Notify.send(r.farmerId, `Report ${id}: ${patch.status || action}`); // FR13
    return r;
  },
  get(id) {
    return Storage.get('reports').find((x) => x.id === id);
  },
  assign(id, surveyorId, by) {
    if (!surveyorId) return { ok: false, msg: 'Choose a surveyor' };
    this.update(id, { status: 'Assigned', surveyorId }, 'Assigned', by);
    return { ok: true, msg: 'Surveyor assigned' };
  },
  submitSurvey(id, acres, pct, by, photos = [], gps = '') {
    if (!(acres > 0)) return { ok: false, msg: 'Verified acres must be above 0' };
    if (!Number.isInteger(pct) || pct < 1 || pct > 100) return { ok: false, msg: 'Damage % must be 1 to 100' };
    if (!photos.length) return { ok: false, msg: 'Add at least one photo' };
    this.update(id, { status: 'Surveyed', survey: { acres, pct, photos, gps } }, 'Surveyed', by);
    return { ok: true, msg: 'Findings submitted' };
  },
  decide(id, action, reason, by) {
    const r = this.get(id);
    if (action === 'verify') {
      if (!r.survey && (r.acres > this.DESK_REVIEW_LIMIT || !r.photos.length || !r.gps)) {
        return { ok: false, msg: 'Desk review is only for claims up to 5 acres with photo and GPS evidence; otherwise a survey is needed' };
      }
      this.update(id, { status: 'Verified' }, 'Verified', by);
      return { ok: true, msg: 'Claim verified' };
    }
    if (action === 'resurvey') {
      if (!r.survey) return { ok: false, msg: 'No survey to repeat' };
      this.update(id, { status: 'Assigned', survey: null }, 'Re-survey requested', by);
      return { ok: true, msg: 'Re-survey requested' };
    }
    if (!reason || !reason.trim()) return { ok: false, msg: 'A reason is required to reject' };
    this.update(id, { status: 'Rejected', reason: reason.trim() }, 'Rejected', by, reason);
    return { ok: true, msg: 'Claim rejected' };
  },
  approveCompensation(id, by) {
    const r = this.get(id);
    const s = r.survey || { acres: r.acres, pct: r.pct };
    const amount = Math.round(s.acres * (s.pct / 100) * this.RATE_PER_ACRE);
    this.update(id, { status: 'Approved', amount }, 'Compensation approved', by, 'Rs ' + amount);
    return { ok: true, msg: 'Compensation approved: Rs ' + amount.toLocaleString() };
  },
  declineCompensation(id, reason, by) {
    if (!reason || !reason.trim()) return { ok: false, msg: 'A reason is required to decline' };
    this.update(id, { status: 'Rejected', reason: 'Compensation declined: ' + reason.trim() }, 'Compensation declined', by, reason);
    return { ok: true, msg: 'Compensation declined' };
  },
  appeal(id, reason, by) {
    const r = this.get(id);
    if (r.appealed) return { ok: false, msg: 'This claim was already appealed once' };
    if (!reason || !reason.trim()) return { ok: false, msg: 'Enter a reason for the appeal' };
    this.update(id, { status: 'Under appeal', appealed: true }, 'Appeal submitted', by, reason);
    return { ok: true, msg: 'Appeal submitted' };
  }
};