/* MDC Ferretería · Detector de actualizaciones para PWA instalada */
(() => {
  const VERSION_KEY = 'mdc-installed-version-v1';
  const PENDING_KEY = 'mdc-pending-version-v1';
  const DISMISSED_KEY = 'mdc-dismissed-update-v1';
  const CHECK_MS = 120000;
  let lastCheckAt = 0;
  let pendingVersion = null;

  const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  function ensureStyles() {
    if (document.getElementById('mdc-app-update-style')) return;
    const style = document.createElement('style');
    style.id = 'mdc-app-update-style';
    style.textContent = `
      .mdc-update-sheet[hidden]{display:none!important}
      .mdc-update-sheet{position:fixed;inset:0;z-index:10000;display:grid;align-items:end;background:rgba(0,0,0,.54);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:14px}
      .mdc-update-card{width:min(100%,520px);margin:0 auto;padding:18px;border:1px solid rgba(255,255,255,.11);border-radius:24px;background:linear-gradient(180deg,#1b1b1b,#101010);box-shadow:0 28px 80px rgba(0,0,0,.58);color:#fff}
      .mdc-update-top{display:flex;gap:13px;align-items:center}.mdc-update-logo{width:52px;height:52px;object-fit:contain;border-radius:14px;background:#0b0b0b}.mdc-update-copy{min-width:0}.mdc-update-copy span{display:block;color:#ff8a34;font-size:10px;font-weight:850;letter-spacing:.12em;text-transform:uppercase}.mdc-update-copy b{display:block;margin-top:3px;font-size:18px;line-height:1.1}.mdc-update-copy small{display:block;margin-top:5px;color:#9d978f;font-size:11px}
      .mdc-update-text{margin:16px 0;color:#bdb7ae;font-size:12.5px;line-height:1.5}.mdc-update-actions{display:grid;grid-template-columns:.8fr 1.2fr;gap:9px}.mdc-update-actions button{min-height:48px;border:0;border-radius:14px;font:inherit;font-size:12px;font-weight:850}.mdc-update-later{background:rgba(255,255,255,.07);color:#ddd7cf}.mdc-update-now{background:linear-gradient(135deg,#ff7a1a,#ff9c52);color:#111}.mdc-update-now:disabled{opacity:.7}
      @media(min-width:821px){.mdc-update-sheet{align-items:center}}
    `;
    document.head.appendChild(style);
  }

  function getLogo() {
    return window.MDC_MEDIA?.logo || 'assets/logo-claro.png';
  }

  function read(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  async function fetchVersion() {
    const response = await fetch(`/api/version?ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data?.version ? String(data.version) : null;
  }

  function buildSheet() {
    let sheet = document.querySelector('.mdc-update-sheet');
    if (sheet) return sheet;

    sheet = document.createElement('div');
    sheet.className = 'mdc-update-sheet';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Actualización disponible');
    sheet.innerHTML = `
      <div class="mdc-update-card">
        <div class="mdc-update-top">
          <img class="mdc-update-logo" src="${getLogo()}" alt="MDC Ferretería">
          <div class="mdc-update-copy">
            <span>Nueva versión</span>
            <b>Actualización disponible</b>
            <small data-mdc-update-version></small>
          </div>
        </div>
        <p class="mdc-update-text">Hay una versión nueva de MDC Ferretería. Actualiza para recibir los últimos productos, correcciones y mejoras de la aplicación.</p>
        <div class="mdc-update-actions">
          <button type="button" class="mdc-update-later" data-mdc-update-later>Más tarde</button>
          <button type="button" class="mdc-update-now" data-mdc-update-now>Actualizar ahora</button>
        </div>
      </div>`;
    document.body.appendChild(sheet);

    sheet.querySelector('[data-mdc-update-later]').addEventListener('click', () => {
      if (pendingVersion) {
        try { sessionStorage.setItem(DISMISSED_KEY, pendingVersion); } catch (_) {}
      }
      sheet.hidden = true;
    });

    sheet.querySelector('[data-mdc-update-now]').addEventListener('click', applyUpdate);
    return sheet;
  }

  function showUpdate(version) {
    pendingVersion = version;
    const sheet = buildSheet();
    const short = version.slice(0, 8);
    const label = sheet.querySelector('[data-mdc-update-version]');
    if (label) label.textContent = `Versión ${short}`;
    sheet.hidden = false;
  }

  async function getLatestRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    let registration = await navigator.serviceWorker.getRegistration('./');
    if (!registration) {
      registration = await navigator.serviceWorker.register('sw.js?v=13', {
        scope: './',
        updateViaCache: 'none'
      });
    }
    return registration;
  }

  async function prepareLatestWorker() {
    const registration = await getLatestRegistration();
    if (!registration) return null;
    await registration.update().catch(() => null);
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    return registration;
  }

  async function applyUpdate() {
    if (!pendingVersion) return;
    const button = document.querySelector('[data-mdc-update-now]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Actualizando…';
    }

    write(PENDING_KEY, pendingVersion);

    try {
      const registration = await prepareLatestWorker();
      if (registration?.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (_) {}

    const next = new URL(location.href);
    next.searchParams.set('mdc_update', pendingVersion.slice(0, 8));

    let reloaded = false;
    const reload = () => {
      if (reloaded) return;
      reloaded = true;
      location.replace(next.toString());
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true });
    }
    window.setTimeout(reload, 900);
  }

  async function checkForUpdate({ force = false } = {}) {
    if (!isStandalone()) return;
    const now = Date.now();
    if (!force && now - lastCheckAt < 15000) return;
    lastCheckAt = now;

    try {
      const serverVersion = await fetchVersion();
      if (!serverVersion) return;

      const pending = read(PENDING_KEY);
      if (pending && pending === serverVersion) {
        write(VERSION_KEY, serverVersion);
        remove(PENDING_KEY);
      }

      const installedVersion = read(VERSION_KEY);
      if (!installedVersion) {
        write(VERSION_KEY, serverVersion);
        return;
      }

      if (installedVersion === serverVersion) return;

      let dismissed = null;
      try { dismissed = sessionStorage.getItem(DISMISSED_KEY); } catch (_) {}
      if (dismissed === serverVersion) return;

      showUpdate(serverVersion);
    } catch (_) {}
  }

  async function registerLatestWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    try { await prepareLatestWorker(); } catch (_) {}
  }

  function boot() {
    if (!isStandalone()) return;
    ensureStyles();
    buildSheet();
    registerLatestWorker().finally(() => checkForUpdate({ force: true }));

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate({ force: true });
    });
    window.addEventListener('online', () => checkForUpdate({ force: true }));
    window.setInterval(() => checkForUpdate(), CHECK_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
