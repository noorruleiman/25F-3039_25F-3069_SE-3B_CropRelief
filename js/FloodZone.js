/* FloodZone.js - UML Class: FloodZone (Risk level and priority factor). */
class FloodZone {
  static FACTORS = { High: 3, Medium: 2, Low: 1 };

  constructor(zoneId, name, level) {
    this.zoneId = zoneId;
    this.name = name;
    this.level = level;
  }

  getFactor() {
    return FloodZone.FACTORS[this.level] || 1;
  }

  static factorFor(level) {
    return FloodZone.FACTORS[level] || 1;
  }
}
