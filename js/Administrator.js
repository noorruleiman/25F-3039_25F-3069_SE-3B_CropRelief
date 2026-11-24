/* Administrator.js - UML Subclass: Administrator (User accounts, roles, flood zones). */
class Administrator extends User {
  constructor(record) {
    super({ ...record, role: 'admin' });
    this.adminCode = 'ADM-' + record.id;
  }

  createOfficialUser(data) {
    const users = Storage.get('users');
    if (!data.name || !data.name.trim()) return { ok: false, msg: 'Name is required' };
    if (!User.validMobile(data.mobile)) return { ok: false, msg: 'Enter a valid mobile number (03XXXXXXXXX)' };
    if (!data.password || data.password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters' };
    if (users.some((u) => u.mobile === data.mobile)) return { ok: false, msg: 'Mobile number already registered' };

    const id = Storage.nextId('U');
    users.push({
      id,
      role: data.role || 'surveyor',
      name: data.name.trim(),
      mobile: data.mobile,
      password: User.hash(data.password),
      active: true
    });
    Storage.set('users', users);
    return { ok: true, msg: 'Account created' };
  }

  manageUsers(targetUserId, action) {
    if (action === 'toggle') {
      if (targetUserId === this.id) {
        return { ok: false, msg: 'Cannot deactivate your own account' };
      }
      const users = Storage.get('users');
      const target = users.find((u) => u.id === targetUserId);
      if (!target) return { ok: false, msg: 'User not found' };
      target.active = !target.active;
      Storage.set('users', users);
      return { ok: true, msg: 'User updated' };
    }
    return { ok: false, msg: 'Unsupported action' };
  }

  setUserRole(targetUserId, role) {
    const users = Storage.get('users');
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return { ok: false, msg: 'User not found' };
    target.role = role;
    Storage.set('users', users);
    return { ok: true, msg: 'Role updated' };
  }

  updateFloodZones(name, district, zone) {
    return FloodEvent.declare(name, district, zone);
  }
}
