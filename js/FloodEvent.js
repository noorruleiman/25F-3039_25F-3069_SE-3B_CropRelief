/* FloodEvent.js - UML Class: FloodEvent (Declared flood event per district/zone). */
class FloodEvent {
  constructor({ id, name, zone, district, active = true }) {
    this.eventId = id || Storage.nextId('E');
    this.id = this.eventId;
    this.name = name;
    this.zone = zone;
    this.district = district;
    this.active = active;
  }

  static declare(name, district, zone) {
    if (!name || !name.trim()) {
      return { ok: false, msg: 'Event name is required' };
    }
    const event = new FloodEvent({
      name: name.trim(),
      district,
      zone,
      active: true
    });
    Storage.push('events', {
      id: event.id,
      name: event.name,
      zone: event.zone,
      district: event.district,
      active: event.active
    });
    return { ok: true, msg: 'Flood event declared', event };
  }

  static findById(eventId) {
    const raw = Storage.get('events').find((e) => e.id === eventId);
    return raw ? new FloodEvent(raw) : null;
  }
}
