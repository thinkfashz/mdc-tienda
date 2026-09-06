/* MDC Ferretería · Mobile App Shell */
(() => {
  const MOBILE_MAX = 820;
  const WA = '56979151979';
  const API_PUBLIC = 'https://mdc-app-dun.vercel.app/api/public';
  const CONSENT_KEY = 'mdc-consent-v1';
  const ANALYTICS_SESSION_KEY = 'mdc-analytics-session-v1';
  let deferredInstallPrompt = null;
  let pageviewSent = false;

  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.3 1.2Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></svg>'
  };

  function currentFile() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  function injectBottomNav() {
    if (window.innerWidth > MOBILE_MAX || document.querySelector('.app-bottom-nav')) return;
    const file = currentFile();
    const active = file === 'catalogo.html' || file === 'producto.html'
      ? 'catalog'
      : file === 'carrito.html' || file === 'checkout.html'
        ? 'cart'
        : 'home';

    const nav = document.createElement('nav');
    nav.className = 'app-bottom-nav';
    nav.setAttribute('aria-label', 'Navegación principal móvil');
    nav.innerHTML = `
      <a class="app-nav-item ${active === 'home' ? 'is-active' : ''}" href="index.html">${icons.home}<span>Inicio</span></a>
      <a class="app-nav-item ${active === 'catalog' ? 'is-active' : ''}" href="catalogo.html">${icons.catalog}<span>Catálogo</span></a>
      <a class="app-nav-item ${active === 'cart' ? 'is-active' : ''}" href="carrito.html">${icons.cart}<span>Carrito</span><span class="app-nav-cart-count" data-cart-count hidden></span></a>
      <a class="app-nav-item" href="https://wa.me/${WA}?text=${encodeURIComponent('Hola MDC, necesito ayuda con una compra')}" target="_blank" rel="noopener">${icons.wa}<span>WhatsApp</span></a>`;
    document.body.appendChild(nav);
    try { globalThis.updateCartCount?.(); } catch (_) {}
  }

  function injectSearch() {
    if (window.innerWidth > MOBILE_MAX) return;
    const file = currentFile();
    if (file !== 'index.html' && file !== 'catalogo.html') return;
    if (document.querySelector('.mobile-shell-search')) return;

    const target = file === 'catalogo.html'
      ? document.querySelector('.catalog-head')
      : document.querySelector('.hero');
    if (!target) return;

    const params = new URLSearchParams(location.search);
    const wrap = document.createElement('div');
    wrap.className = 'mobile-shell-search';
    wrap.innerHTML = `
      <form class="mobile-search-form" action="catalogo.html" method="get" role="search">
        ${icons.search}
        <input name="q" type="search" value="${String(params.get('q') || '').replaceAll('"','&quot;')}" placeholder="Buscar taladro, cable, cemento..." aria-label="Buscar productos">
        <button class="mobile-search-submit" type="submit">Buscar</button>
      </form>`;
    target.insertAdjacentElement('afterend', wrap);
  }

  function injectInstallBanner() {
    if (isStandalone() || document.querySelector('.mobile-install-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'mobile-install-banner';
    banner.innerHTML = `
      <img src="assets/logo-claro.png" alt="MDC">
      <div class="mobile-install-copy"><b>Instalar MDC</b><span>Acceso rápido como una app</span></div>
      <div class="mobile-install-actions">
        <button type="button" data-install-dismiss>Ahora no</button>
        <button type="button" class="install-primary" data-install-app>Instalar</button>
      </div>`;
    document.body.appendChild(banner);

    banner.querySelector('[data-install-dismiss]')?.addEventListener('click', () => {
      banner.classList.remove('is-visible');
      try { sessionStorage.setItem('mdc-install-dismissed', '1'); } catch (_) {}
    });

    banner.querySelector('[data-install-app]')?.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      banner.classList.remove('is-visible');
    });
  }

  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      let dismissed = false;
      try { dismissed = sessionStorage.getItem('mdc-install-dismissed') === '1'; } catch (_) {}
      if (!dismissed && window.innerWidth <= MOBILE_MAX) {
        document.querySelector('.mobile-install-banner')?.classList.add('is-visible');
      }
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      document.querySelector('.mobile-install-banner')?.classList.remove('is-visible');
    });
  }

  function configureMeta() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && !viewport.content.includes('viewport-fit')) viewport.content += ', viewport-fit=cover';
    const metas = [
      ['theme-color', '#090909'],
      ['mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
      ['apple-mobile-web-app-title', 'MDC Ferretería']
    ];
    for (const [name, content] of metas) {
      if (document.querySelector(`meta[name="${name}"]`)) continue;
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  function setupServiceWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js?v=12', { scope: './', updateViaCache: 'none' }).catch(() => null);
    }, { once: true });
  }

  function setupNetworkState() {
    const sync = () => document.documentElement.toggleAttribute('data-offline', !navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
  }

  function readConsent() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function saveConsent(analytics) {
    const consent = {
      essential: true,
      analytics: Boolean(analytics),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(consent)); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('mdc:consent-updated', { detail: consent })); } catch (_) {}
    return consent;
  }

  function ensureConsentStyles() {
    if (document.getElementById('mdc-consent-styles')) return;
    const style = document.createElement('style');
    style.id = 'mdc-consent-styles';
    style.textContent = `
      .mdc-consent[hidden]{display:none!important}.mdc-consent{position:fixed;inset:0;z-index:90000;display:grid;align-items:end;padding:14px;background:rgba(0,0,0,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
      .mdc-consent-card{width:min(100%,610px);margin:0 auto;padding:18px;border-radius:26px;border:1px solid rgba(255,255,255,.11);background:linear-gradient(180deg,rgba(27,27,27,.98),rgba(12,12,12,.98));box-shadow:0 28px 90px rgba(0,0,0,.62);color:#fff}
      .mdc-consent-top{display:flex;gap:13px;align-items:flex-start}.mdc-consent-logo{width:58px;height:58px;flex:0 0 auto;object-fit:contain;border-radius:16px;background:#090909;padding:5px}.mdc-consent-copy{min-width:0}.mdc-consent-kicker{color:#ff8730;font-size:9px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.mdc-consent h2{margin:4px 0 7px;font-size:19px;line-height:1.08}.mdc-consent p{margin:0;color:#b9b2a9;font-size:12px;line-height:1.52}
      .mdc-consent-details{margin:14px 0;padding:12px 13px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.065);display:grid;gap:8px}.mdc-consent-row{display:flex;gap:9px;align-items:flex-start;color:#c9c2b9;font-size:11px;line-height:1.4}.mdc-consent-dot{width:7px;height:7px;margin-top:4px;border-radius:50%;background:#ff7a1a;box-shadow:0 0 0 4px rgba(255,122,26,.09);flex:0 0 auto}
      .mdc-consent-actions{display:grid;grid-template-columns:.92fr 1.08fr;gap:9px;margin-top:14px}.mdc-consent-actions button{min-height:49px;border:0;border-radius:15px;font:inherit;font-size:12px;font-weight:850;cursor:pointer}.mdc-consent-essential{background:rgba(255,255,255,.075);color:#eee8e0}.mdc-consent-accept{background:linear-gradient(135deg,#ff7412,#ff9b45);color:#13100d;box-shadow:0 8px 24px rgba(255,112,0,.2)}
      .mdc-privacy-link{margin-left:10px;border:0;background:transparent;color:inherit;opacity:.64;font:inherit;font-size:11px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.mdc-privacy-link:hover{opacity:1}
      @media(min-width:821px){.mdc-consent{align-items:center}.mdc-consent-card{padding:22px}.mdc-consent h2{font-size:22px}}
      @media(max-width:390px){.mdc-consent{padding:9px}.mdc-consent-card{padding:15px;border-radius:22px}.mdc-consent-actions{grid-template-columns:1fr}.mdc-consent-logo{width:50px;height:50px}}
    `;
    document.head.appendChild(style);
  }

  function getAnalyticsSessionId() {
    try {
      let id = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (id) return id;
      id = globalThis.crypto?.randomUUID?.() || `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(ANALYTICS_SESSION_KEY, id);
      return id;
    } catch (_) {
      return null;
    }
  }

  function sendAnalytics(event, metadata = null) {
    const consent = readConsent();
    if (!consent?.analytics) return;

    const payload = JSON.stringify({
      event,
      path: `${location.pathname}${location.search}`.slice(0, 300),
      sessionId: getAnalyticsSessionId(),
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
      metadata,
    });

    const url = `${API_PUBLIC}/analytics`;
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }
    } catch (_) {}

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => null);
  }

  function trackPageView() {
    if (pageviewSent || !readConsent()?.analytics) return;
    pageviewSent = true;
    sendAnalytics('pageview', {
      standalone: isStandalone(),
      online: navigator.onLine,
    });
  }

  function buildConsent() {
    let sheet = document.querySelector('.mdc-consent');
    if (sheet) return sheet;

    sheet = document.createElement('div');
    sheet.className = 'mdc-consent';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Preferencias de privacidad');
    sheet.innerHTML = `
      <div class="mdc-consent-card">
        <div class="mdc-consent-top">
          <img class="mdc-consent-logo" src="${window.MDC_MEDIA?.logo || 'assets/logo-claro.png'}" alt="MDC Ferretería">
          <div class="mdc-consent-copy">
            <span class="mdc-consent-kicker">Privacidad y rendimiento</span>
            <h2>Tu tienda rápida, con tus preferencias claras</h2>
            <p>Usamos almacenamiento local y caché esenciales para mantener el carrito, recordar la app y acelerar el catálogo. Si aceptas, también registramos estadísticas anónimas para saber qué partes del sitio funcionan mejor.</p>
          </div>
        </div>
        <div class="mdc-consent-details">
          <div class="mdc-consent-row"><span class="mdc-consent-dot"></span><span><b>Esenciales:</b> carrito, preferencias de la app, caché y funcionamiento offline.</span></div>
          <div class="mdc-consent-row"><span class="mdc-consent-dot"></span><span><b>Estadísticas opcionales:</b> páginas visitadas y sesión anónima. No guardamos IP ni información sensible.</span></div>
        </div>
        <div class="mdc-consent-actions">
          <button type="button" class="mdc-consent-essential" data-consent-essential>Solo esenciales</button>
          <button type="button" class="mdc-consent-accept" data-consent-accept>Aceptar estadísticas</button>
        </div>
      </div>`;
    document.body.appendChild(sheet);

    sheet.querySelector('[data-consent-essential]')?.addEventListener('click', () => {
      saveConsent(false);
      sheet.hidden = true;
    });
    sheet.querySelector('[data-consent-accept]')?.addEventListener('click', () => {
      saveConsent(true);
      sheet.hidden = true;
      trackPageView();
    });

    return sheet;
  }

  function openConsent(force = false) {
    ensureConsentStyles();
    const existing = readConsent();
    if (existing && !force) {
      trackPageView();
      return;
    }
    buildConsent().hidden = false;
  }

  function injectPrivacyLink() {
    const footer = document.querySelector('.footer');
    if (!footer || footer.querySelector('.mdc-privacy-link')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mdc-privacy-link';
    button.textContent = 'Privacidad';
    button.addEventListener('click', () => openConsent(true));
    footer.appendChild(button);
  }

  function setupConsent() {
    ensureConsentStyles();
    buildConsent();
    injectPrivacyLink();

    if (readConsent()) {
      trackPageView();
      return;
    }

    const show = () => openConsent(false);
    document.addEventListener('mdc:splash-complete', show, { once: true });
    window.setTimeout(show, 3400);
  }

  function boot() {
    configureMeta();
    injectBottomNav();
    injectSearch();
    setupInstallPrompt();
    setupServiceWorker();
    setupNetworkState();
    setupConsent();

    const late = () => injectInstallBanner();
    if ('requestIdleCallback' in window) requestIdleCallback(late, { timeout: 1800 });
    else window.setTimeout(late, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
