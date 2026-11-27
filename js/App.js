/* App.js - Application bootstrapper and delegated DOM event controller (zero inline handlers). */
Storage.seed(User.hash);
const currentUser = User.current();
const isLoginPage = document.body.dataset.page === 'login';

if (!isLoginPage && !currentUser) location.href = 'index.html';
if (isLoginPage && currentUser) location.href = 'dashboard.html';

let simulatedOffline = false;
let gpsCoords = '31.4504,73.1350'; // Default fallback coordinates: Faisalabad
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((pos) => {
    gpsCoords = pos.coords.latitude.toFixed(4) + ',' + pos.coords.longitude.toFixed(4);
  });
}

const isOnline = () => navigator.onLine && !simulatedOffline;

const refresh = () => {
  const activeUser = User.current();
  if (!isLoginPage && activeUser) UI.render(activeUser);
  I18N.apply();
};

const finish = (result) => {
  UI.toast(result.msg, !result.ok);
  if (result.ok) refresh();
  return result;
};

const rowVal = (row, name) => {
  const el = row.querySelector(`[name=${name}]`);
  return el ? el.value : '';
};

const formHandlers = {
  login: (d) => {
    const res = User.login(d.mobile.trim(), d.password, d.otp.trim());
    if (res.ok) location.href = 'dashboard.html';
    else UI.toast(res.msg, true);
  },
  register: (d, form) => {
    const res = Farmer.register(d);
    UI.toast(res.ok ? 'Registered. Please login.' : res.msg, !res.ok);
    if (res.ok) {
      form.reset();
      actions.toggle();
    }
  },
  addplot: (d, form) => {
    if (finish(currentUser.addPlot(d)).ok) form.reset();
  },
  report: (d, form) =>
    UI.compressPhotos(form.elements.photo.files).then((photos) => {
      const res = currentUser.submitReport(
        {
          plotId: d.plotId,
          eventId: d.eventId,
          crop: d.crop,
          acres: Number(d.acres),
          pct: Number(d.pct),
          date: d.date,
          gps: gpsCoords,
          photos
        },
        isOnline()
      );
      if (finish(res).ok) form.reset();
    }),
  adduser: (d, form) => {
    if (finish(currentUser.createOfficialUser(d)).ok) form.reset();
  },
  addevent: (d, form) => {
    if (finish(currentUser.updateFloodZones(d.name, d.district, d.zone)).ok) form.reset();
  }
};

const actions = {
  toggle: () => {
    ['login-form', 'register-form'].forEach((id) => {
      const f = document.getElementById(id);
      f.hidden = !f.hidden;
    });
  },
  net: () => {
    simulatedOffline = !simulatedOffline;
    const btn = document.getElementById('net-toggle');
    if (btn) {
      btn.innerHTML = simulatedOffline
        ? '<span class="net-indicator offline"></span> Offline'
        : '<span class="net-indicator online"></span> Online';
      btn.classList.toggle('offline-on', simulatedOffline);
    }
    if (!simulatedOffline) {
      const synced = DamageReport.syncDrafts();
      UI.toast(synced ? `Back online: ${synced} draft(s) synced` : 'Back online');
      refresh();
    } else {
      UI.toast('Simulated Offline Mode ON — reports save as local drafts');
    }
  },
  sync: () => {
    if (!isOnline()) return UI.toast('Switch to Online mode first to sync drafts', true);
    const synced = DamageReport.syncDrafts();
    UI.toast(synced ? `${synced} draft(s) submitted` : 'No drafts to sync');
    refresh();
  },
  lang: () => {
    I18N.toggle();
    refresh();
  },
  logout: () => {
    User.logout();
    location.href = 'index.html';
  },
  assign: (id, row) => finish(currentUser.assignReport(id, rowVal(row, 'surveyor'))),
  survey: (id, row) =>
    UI.compressPhotos(row.querySelector('[name=photo]').files).then((photos) =>
      finish(currentUser.submitFindings(id, Number(rowVal(row, 'acres')), Number(rowVal(row, 'pct')), photos, gpsCoords))
    ),
  verify: (id) => finish(currentUser.verifyClaim(id)),
  resurvey: (id) => finish(currentUser.requestResurvey(id)),
  reject: (id, row) => finish(currentUser.rejectClaim(id, rowVal(row, 'reason'))),
  comp: (id) => finish(currentUser.approveCompensation(id)),
  decline: (id, row) => finish(currentUser.declineCompensation(id, rowVal(row, 'reason'))),
  appeal: (id, row) => finish(currentUser.submitAppeal(id, rowVal(row, 'reason'))),
  setrole: (id, row) => finish(currentUser.setUserRole(id, rowVal(row, 'role'))),
  toggleuser: (id) => finish(currentUser.manageUsers(id, 'toggle'))
};

document.addEventListener('submit', (e) => {
  const handler = formHandlers[e.target.dataset.form];
  if (!handler) return;
  e.preventDefault();
  handler(Object.fromEntries(new FormData(e.target)), e.target);
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn || !actions[btn.dataset.act]) return;
  const row = btn.closest('[data-id]');
  actions[btn.dataset.act](row ? row.dataset.id : null, row);
});

window.addEventListener('online', () => {
  if (!simulatedOffline) {
    const synced = DamageReport.syncDrafts();
    if (synced) {
      UI.toast(synced + ' draft(s) submitted');
      refresh();
    }
  }
});

refresh();
