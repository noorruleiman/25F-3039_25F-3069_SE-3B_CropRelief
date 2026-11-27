/* SurveyReport.js - UML Class: SurveyReport (On-site field surveyor findings). */
class SurveyReport {
  constructor({ acres, pct, photos = [], gps = '' }) {
    this.surveyId = Storage.nextId('S');
    this.verifiedAcreage = Number(acres);
    this.acres = this.verifiedAcreage;
    this.damagePercent = Number(pct);
    this.pct = this.damagePercent;
    this.photos = photos;
    this.gpsLocation = gps;
    this.gps = gps;
    this.surveyDate = new Date().toISOString();
  }

  validateGps(plotLocation) {
    return Boolean(this.gpsLocation && (!plotLocation || this.gpsLocation.includes(',')));
  }

  validate() {
    if (!(this.acres > 0)) return 'Verified acres must be above 0';
    if (!Number.isInteger(this.pct) || this.pct < 1 || this.pct > 100) return 'Damage % must be 1 to 100';
    if (!this.photos.length) return 'Add at least one photo';
    return null;
  }
}
