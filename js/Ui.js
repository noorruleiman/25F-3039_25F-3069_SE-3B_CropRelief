/* UI.js - Presentation tier: renders role dashboards, photo compression, and toasts. */
class UI {
  static MAX_FILES = 3;
  static MAX_SIDE = 800;
  static toastTimer = null;

  static $(selector) {
    return document.querySelector(selector);
  }

  static esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  static userOf(id) {
    return Storage.get('users').find((u) => u.id === id) || {};
  }

  static compressPhotos(files) {
    return Promise.all(
      [...files].slice(0, this.MAX_FILES).map(
        (file) =>
          new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
              const scale = Math.min(1, this.MAX_SIDE / Math.max(img.width, img.height));
              const canvas = document.createElement('canvas');
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(url);
              resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => resolve(null);
            img.src = url;
          })
      )
    ).then((list) => list.filter(Boolean));
  }

  static badge(status) {
    return `<span class="badge s-${status.replace(/\s/g, '-').toLowerCase()}">${t(status)}</span>`;
  }

  static steps(status) {
    const flow = ['Submitted', 'Assigned', 'Surveyed', 'Verified', 'Approved'];
    const idx = status === 'Under appeal' ? 2 : flow.indexOf(status);
    if (idx < 0) return '';
    return `<ol class="steps">${flow
      .map((step, k) => `<li class="${k < idx ? 'done' : k === idx ? 'now' : ''}" title="${t(step)}"></li>`)
      .join('')}</ol>`;
  }

  static heroBanner(eyebrow, title, subtitle, kpis) {
    return `
      <section class="dash-hero">
        <div class="dash-hero-top">
          <div class="dash-hero-title">
            <span class="eyebrow">${this.esc(eyebrow)}</span>
            <h1>${this.esc(title)}</h1>
            <p>${this.esc(subtitle)}</p>
          </div>
          <div class="showcase-status"><span class="pulse-dot"></span> Live System</div>
        </div>
        <div class="dash-kpi-strip">
          ${kpis.map(([label, val]) => `<div class="glass-tile"><span>${t(label)}</span><b>${val}</b></div>`).join('')}
        </div>
      </section>`;
  }

  static card(title, body) {
    return `
      <section class="card">
        <div class="card-head"><h2>${t(title)}</h2></div>
        ${body}
      </section>`;
  }

  static table(heads, rows) {
    return `
      <div class="scroll">
        <table>
          <thead><tr>${heads.map((h) => `<th>${t(h)}</th>`).join('')}</tr></thead>
          <tbody>${rows.join('') || `<tr><td colspan="${heads.length}" class="muted">No records available</td></tr>`}</tbody>
        </table>
      </div>`;
  }

  static btn(act, cls, label, disabled = false) {
    return `<button type="button" class="btn ${cls}" data-act="${act}"${disabled ? ' disabled' : ''}>${t(label)}</button>`;
  }

  static thumbs(list) {
    return `<div class="thumbs">${(list || []).map((src) => `<img src="${src}" alt="evidence">`).join('')}</div>`;
  }

  static rs(amount) {
    return 'PKR ' + amount.toLocaleString();
  }

  static toast(msg, bad = false) {
    const el = this.$('#toast');
    el.textContent = msg;
    el.className = 'show' + (bad ? ' bad' : '');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.className = '';
    }, 3200);
  }

  static renderFarmer(u) {
    const plots = Storage.get('plots').filter((p) => p.farmerId === u.id);
    const events = Storage.get('events').filter((e) => e.active);
    const allReports = Storage.get('reports');
    const mine = allReports.filter((r) => r.farmerId === u.id);
    const drafts = Storage.get('drafts').filter((d) => d.farmerId === u.id).length;
    const totalPayout = mine.filter((r) => r.amount).reduce((sum, r) => sum + r.amount, 0);

    const reportForm = `<form data-form="report" class="grid" novalidate>
      <label>${t('Land plot')}<select name="plotId">${plots
        .map((p) => `<option value="${p.id}">${this.esc(p.khasra)} (${p.acres} ac, ${this.esc(p.district)}, ${p.zone})</option>`)
        .join('')}</select></label>
      <label>${t('Flood event')}<select name="eventId">${events
        .map((e) => `<option value="${e.id}">${this.esc(e.name)} — ${this.esc(e.district)} / ${e.zone}</option>`)
        .join('')}</select></label>
      <label>${t('Crop type')}<input name="crop" placeholder="Cotton / Rice"></label>
      <label>${t('Damaged acres')}<input name="acres" type="number" step="0.1" placeholder="4.0"></label>
      <label>${t('Damage %')}<input name="pct" type="number" placeholder="80"></label>
      <label>${t('Date')}<input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
      <label>${t('Photos (max 3)')}<input name="photo" type="file" accept="image/*" multiple></label>
      <button type="submit" class="btn primary">${t('Submit report')}</button>
    </form>
    <div class="draft-bar">
      <span class="muted">${t('Offline drafts waiting to sync')}: <b>${drafts}</b></span>
      ${drafts > 0 ? this.btn('sync', 'secondary', 'Sync drafts now') : ''}
    </div>`;

    const addPlotForm = `<form data-form="addplot" class="grid" novalidate>
      <label>${t('Khasra number')}<input name="khasra" placeholder="KH-209"></label>
      <label>${t('Acreage')}<input name="acres" type="number" step="0.1" placeholder="4.5"></label>
      <label>${t('District')}<select name="district"><option>Faisalabad</option><option>Lahore</option><option>Multan</option><option>Sargodha</option></select></label>
      <label>${t('Flood zone')}<select name="zone"><option>High</option><option>Medium</option><option>Low</option></select></label>
      <button type="submit" class="btn secondary">${t('Register plot')}</button>
    </form>`;

    const rows = mine.map(
      (r) => `<tr data-id="${r.id}">
        <td><strong>${r.id}</strong><br><span class="muted">${r.date}</span></td>
        <td>${this.esc(r.crop)}</td>
        <td>${r.acres} ac / ${r.pct}%</td>
        <td>${this.badge(r.status)}${this.steps(r.status)} ${r.amount ? '<div><strong>' + this.rs(r.amount) + '</strong></div>' : ''}</td>
        <td>${this.thumbs(r.photos)}</td>
        <td>${
          r.status === 'Rejected'
            ? this.esc(r.reason) + (r.appealed ? '' : ' <input name="reason" placeholder="Reason"> ' + this.btn('appeal', 'secondary', 'Appeal'))
            : '—'
        }</td>
      </tr>`
    );

    const sms = Notification.inbox(u.id)
      .map((m) => `<li><span>${this.esc(m.message)}</span><span class="muted">${m.at}</span></li>`)
      .join('');

    return (
      this.heroBanner('Farmer Portal', `Welcome, ${u.name}`, `CNIC: ${u.cnic || 'Registered'} · Registered Plots: ${plots.length}`, [
        ['Total reports', mine.length],
        ['In progress', mine.filter((r) => !['Approved', 'Rejected'].includes(r.status)).length],
        ['Approved', mine.filter((r) => r.status === 'Approved').length],
        ['Compensation', this.rs(totalPayout)]
      ]) +
      this.card('Report crop damage', reportForm) +
      this.card('My reports', this.table(['ID', 'Crop', 'Damage', 'Status', 'Photos', 'Notes'], rows)) +
      this.card('Add land plot', addPlotForm) +
      this.card('SMS inbox', `<ul class="sms-feed">${sms || '<li class="muted">No SMS notifications yet</li>'}</ul>`)
    );
  }

  static renderSurveyor(u) {
    const all = Storage.get('reports').filter((r) => r.surveyorId === u.id);
    const rows = all
      .filter((r) => r.status === 'Assigned')
      .map((r) => {
        const plot = Storage.get('plots').find((p) => p.id === r.plotId) || {};
        return `<tr data-id="${r.id}">
          <td><strong>${r.id}</strong></td>
          <td>${this.esc(this.userOf(r.farmerId).name)}</td>
          <td>${this.esc(plot.khasra)}, ${this.esc(plot.district)}<br><a class="map-link" href="https://www.google.com/maps?q=${this.esc(
            r.gps
          )}" target="_blank" rel="noopener">View GPS (${this.esc(r.gps)})</a></td>
          <td><input name="acres" type="number" step="0.1" placeholder="${t('Acreage')}"> <input name="pct" type="number" placeholder="%"> <input name="photo" type="file" accept="image/*" multiple></td>
          <td>${this.btn('survey', 'primary', 'Submit findings')}</td>
        </tr>`;
      });

    return (
      this.heroBanner('Field Operations', `Surveyor Workbench — ${u.name}`, 'Inspect assigned plots on-site and submit GPS-verified damage measurements.', [
        ['To survey', rows.length],
        ['Done', all.filter((r) => r.status !== 'Assigned').length]
      ]) + this.card('Assigned reports', this.table(['ID', 'Farmer', 'Location', 'Findings', 'Action'], rows))
    );
  }

  static renderOfficer() {
    const surveyors = Storage.get('users').filter((x) => x.role === 'surveyor' && x.active);
    const selectHtml = `<select name="surveyor"><option value="">Select surveyor...</option>${surveyors
      .map((s) => `<option value="${s.id}">${this.esc(s.name)}</option>`)
      .join('')}</select>`;
    const reasonHtml = '<input name="reason" placeholder="Reason">';
    const open = Storage.get('reports').filter((r) => r.status !== 'Approved');

    const rows = open
      .sort((a, b) => b.priority - a.priority)
      .map((r) => {
        const deskEligible = r.acres <= DamageReport.DESK_REVIEW_LIMIT;
        let actionHtml = '';
        if (r.status === 'Submitted') {
          actionHtml =
            selectHtml +
            this.btn('assign', 'secondary', 'Assign') +
            (deskEligible ? this.btn('verify', 'primary', 'Desk verify') + reasonHtml + this.btn('reject', 'danger', 'Reject') : '');
        }
        if (r.status === 'Surveyed' || r.status === 'Under appeal') {
          actionHtml =
            this.btn('verify', 'primary', 'Verify') +
            this.btn('resurvey', 'secondary', 'Re-survey') +
            reasonHtml +
            this.btn('reject', 'danger', 'Reject');
        }
        const farmer = this.userOf(r.farmerId);
        return `<tr data-id="${r.id}">
          <td><strong>${r.id}</strong></td>
          <td><b>${r.priority}</b></td>
          <td>${this.esc(farmer.name)}<br><span class="muted">${this.esc(farmer.cnic)}</span></td>
          <td>${r.acres} ac / ${r.pct}%${this.thumbs(r.photos)}</td>
          <td>${r.survey ? r.survey.acres + ' ac / ' + r.survey.pct + '%' + this.thumbs(r.survey.photos) : '—'}</td>
          <td>${this.badge(r.status)}</td>
          <td>${actionHtml || '<span class="muted">Awaiting survey</span>'}</td>
        </tr>`;
      });

    return (
      this.heroBanner(
        'Agriculture Department',
        'Claim Triage & Verification',
        'Claims ranked by Priority Score (Damage % × Zone Factor). Small claims ≤ 5 acres qualify for Desk Review.',
        [
          ['Pending', open.filter((r) => r.status === 'Submitted').length],
          ['To survey', open.filter((r) => r.status === 'Assigned').length],
          ['To decide', open.filter((r) => ['Surveyed', 'Under appeal'].includes(r.status)).length]
        ]
      ) + this.card('Reports', this.table(['ID', 'Priority', 'Farmer', 'Claimed', 'Surveyed', 'Status', 'Action'], rows))
    );
  }

  static renderDistrict() {
    const all = Storage.get('reports');
    const rows = all
      .filter((r) => r.status === 'Verified')
      .map((r) => {
        const amt = CompensationClaim.calculateAmount(r);
        return `<tr data-id="${r.id}">
          <td><strong>${r.id}</strong></td>
          <td>${this.esc(this.userOf(r.farmerId).name)}</td>
          <td>${this.esc(r.district)}</td>
          <td><strong>${this.rs(amt)}</strong></td>
          <td><input name="reason" placeholder="Reason">${this.btn('comp', 'primary', 'Approve compensation')}${this.btn('decline', 'danger', 'Decline')}</td>
        </tr>`;
      });

    const districtRows = [...new Set(all.map((r) => r.district))].map((d) => {
      const group = all.filter((r) => r.district === d);
      const approved = group.filter((r) => r.status === 'Approved');
      return `<tr><td><strong>${this.esc(d)}</strong></td><td>${group.length}</td><td>${approved.length}</td><td><strong>${this.rs(
        approved.reduce((sum, r) => sum + (r.amount || 0), 0)
      )}</strong></td></tr>`;
    });

    const totalPaid = all.filter((r) => r.status === 'Approved').reduce((sum, r) => sum + (r.amount || 0), 0);

    return (
      this.heroBanner('District Authority', 'Compensation Approval & District Analytics', 'Review verified loss assessments and authorize provincial relief disbursements.', [
        ['Verified', all.filter((r) => r.status === 'Verified').length],
        ['Approved', all.filter((r) => r.status === 'Approved').length],
        ['Compensation', this.rs(totalPaid)]
      ]) +
      this.card('Verified claims', this.table(['ID', 'Farmer', 'District', 'Compensation', 'Action'], rows)) +
      this.card('District damage report', this.table(['District', 'Reports', 'Approved', 'Compensation'], districtRows))
    );
  }

  static renderAdmin(currentAdmin) {
    const roles = ['farmer', 'surveyor', 'officer', 'district', 'admin'];
    const users = Storage.get('users').map((x) => {
      const isSelf = currentAdmin && x.id === currentAdmin.id;
      const statusHtml = x.active
        ? '<span class="status-pill-active"><span class="dot-active"></span>Active</span>'
        : '<span class="status-pill-inactive"><span class="dot-inactive"></span>Inactive</span>';
      return `<tr data-id="${x.id}">
        <td><strong>${this.esc(x.name)}</strong></td>
        <td><select name="role">${roles.map((r) => `<option${r === x.role ? ' selected' : ''}>${r}</option>`).join('')}</select> ${this.btn(
          'setrole',
          'secondary',
          'Save role'
        )}</td>
        <td>${x.mobile}</td>
        <td>${statusHtml}</td>
        <td>${this.btn('toggleuser', 'secondary', x.active ? 'Deactivate' : 'Activate', isSelf)}</td>
      </tr>`;
    });

    const events = Storage.get('events').map((e) => `<tr><td><strong>${this.esc(e.name)}</strong></td><td>${this.esc(e.district)}</td><td>${e.zone}</td></tr>`);
    const audit = Storage.get('audit')
      .slice(-12)
      .reverse()
      .map(
        (a) =>
          `<tr><td><strong>${a.reportId}</strong></td><td>${this.esc(a.action)}</td><td>${this.esc(this.userOf(a.by).name)}</td><td>${new Date(
            a.at
          ).toLocaleString()}</td></tr>`
      );

    const addUserForm = `<form data-form="adduser" class="grid" novalidate>
      <label>${t('Full name')}<input name="name"></label>
      <label>${t('Mobile number')}<input name="mobile"></label>
      <label>${t('Password')}<input name="password" type="password"></label>
      <label>Role<select name="role"><option>surveyor</option><option>officer</option><option>district</option><option>admin</option></select></label>
      <button type="submit" class="btn primary">${t('Add user')}</button>
    </form>`;

    const addEventForm = `<form data-form="addevent" class="grid" novalidate>
      <label>${t('Flood event')}<input name="name"></label>
      <label>${t('District')}<select name="district"><option>Faisalabad</option><option>Lahore</option><option>Multan</option><option>Sargodha</option></select></label>
      <label>${t('Flood zone')}<select name="zone"><option>High</option><option>Medium</option><option>Low</option></select></label>
      <button type="submit" class="btn primary">${t('Declare flood event')}</button>
    </form>`;

    return (
      this.heroBanner('System Administration', 'Users, Flood Zones & Audit Trail', 'Manage role-based access control, declared flood events, and system activity logs.', [
        ['Users', Storage.get('users').length],
        ['Active events', Storage.get('events').filter((e) => e.active).length],
        ['Reports', Storage.get('reports').length]
      ]) +
      this.card('Users', this.table(['Name', 'Role', 'Mobile', 'Status', 'Action'], users)) +
      this.card('Add user', addUserForm) +
      this.card('Flood zones', this.table(['Flood event', 'District', 'Flood zone'], events) + addEventForm) +
      this.card('Audit log', this.table(['ID', 'Action', 'User', 'Date'], audit))
    );
  }

  static render(u) {
    const views = {
      farmer: (user) => this.renderFarmer(user),
      surveyor: (user) => this.renderSurveyor(user),
      officer: () => this.renderOfficer(),
      district: () => this.renderDistrict(),
      admin: (user) => this.renderAdmin(user)
    };
    this.$('#who').textContent = `${u.name} (${u.role})`;
    this.$('#view').innerHTML = views[u.role](u);
    I18N.apply();
  }
}
