/* LandPlot.js - UML Class: LandPlot (Registered agricultural land parcel). */
class LandPlot {
  constructor({ id, farmerId, khasra, acres, zone, district }) {
    this.plotId = id || Storage.nextId('P');
    this.id = this.plotId;
    this.farmerId = farmerId;
    this.khasraNumber = khasra;
    this.khasra = khasra;
    this.acres = Number(acres);
    this.zone = zone;
    this.district = district;
  }

  getZone() {
    return new FloodZone(this.zone, `${this.district} ${this.zone} Zone`, this.zone);
  }

  static findById(plotId) {
    const raw = Storage.get('plots').find((p) => p.id === plotId);
    return raw ? new LandPlot(raw) : null;
  }
}
