/* DistrictOfficer.js - UML Subclass: DistrictOfficer (Compensation payout & district analytics). */
class DistrictOfficer extends User {
  constructor(record) {
    super({ ...record, role: 'district' });
    this.district = record.district || 'Punjab';
  }

  approveCompensation(reportId) {
    const report = DamageReport.findById(reportId);
    if (!report) return { ok: false, msg: 'Report not found' };
    const claim = new CompensationClaim(report);
    return claim.approve(this.id);
  }

  declineCompensation(reportId, reason) {
    const report = DamageReport.findById(reportId);
    if (!report) return { ok: false, msg: 'Report not found' };
    const claim = new CompensationClaim(report);
    return claim.reject(reason, this.id);
  }

  generateReport(district) {
    const all = Storage.get('reports').filter((r) => !district || r.district === district);
    const approved = all.filter((r) => r.status === 'Approved');
    return {
      district: district || 'All Districts',
      totalReports: all.length,
      approvedCount: approved.length,
      totalCompensation: approved.reduce((sum, r) => sum + (r.amount || 0), 0)
    };
  }
}
