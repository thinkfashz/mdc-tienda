/* MDC Ferretería · Gaussian Splash v21 · navegación fluida sin sonido */
(() => {
  const MEDIA = Object.freeze({
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_620/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_360/v1788685315/mdc-truck.png'
  });

  const API_ORIGIN = 'https://mdc-app-dun.vercel.app';
  const FIRST_HOME_KEY = 'mdc-premium-splash-v21';
  const NAV_PENDING_KEY = 'mdc-nav-arrival-v21';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const INITIAL_DISPLAY_MS = reduceMotion ? 360 : 2850;
  const NAV_ARRIVAL_MS = reduceMotion ? 150 : 480;
  const DIRECT_ARRIVAL_MS = reduceMotion ? 120 : 360;
  const HARD_PAD_MS = reduceMotion ? 220 : 650;

  window.MDC_MEDIA = MEDIA;

  let activeSplash = null;
  let startedAt = 0;
  let startedWallAt = 0;
  let currentDisplayMs = INITIAL_DISPLAY_MS;
  let currentHardMs = INITIAL_DISPLAY_MS + HARD_PAD_MS;
  let catalogReady = false;
  let rafId = 0;
  let finishTimer = 0;
  let hardTimer = 0;
  let booted = false;
  let completionSent = false;

  function normalizedPath(pathname) {
    const clean = String(pathname || '/').replace(/\/+$/, '') || '/';
    return clean.endsWith('/index.html') ? clean.slice(0, -10) || '/' : clean;
  }

  function isHome() {
    return normalizedPath(location.pathname) === '/';
  }

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }

  function safeSessionRemove(key) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }

  function preconnectOrigin(href, key) {
    if (document.querySelector(`link[data-mdc-preconnect="${key}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = 'anonymous';
    link.dataset.mdcPreconnect = key;
    document.head.appendChild(link);
  }

  function preconnect() {
    preconnectOrigin('https://res.cloudinary.com', 'cloudinary');
    preconnectOrigin(API_ORIGIN, 'backend');
  }

  function loadScriptOnce(src, dataName) {
    if (document.querySelector(`script[data-${dataName}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.setAttribute(`data-${dataName}`, '1');
    document.head.appendChild(script);
  }

  function loadCssOnce(href, dataName) {
    if (document.querySelector(`link[data-${dataName}]`)) return;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = href;
    css.setAttribute(`data-${dataName}`, '1');
    document.head.appendChild(css);
  }

  function loadSecondaryLayers() {
    loadCssOnce('marketplace-experience.css?v=4', 'mdc-marketplace');
    loadCssOnce('social-contact.css?v=3', 'mdc-contact');
    loadScriptOnce('marketplace-experience.js?v=4', 'mdc-marketplace-js');
    loadScriptOnce('social-contact.js?v=3', 'mdc-contact-js');
    loadScriptOnce('app-update.js?v=21', 'mdc-app-update');
    loadScriptOnce('app-integrity.js?v=3', 'mdc-app-integrity');
  }

  function scheduleSecondaryLayers() {
    const run = () => loadSecondaryLayers();
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1200 });
    else window.setTimeout(run, 420);
  }

  function ensureBrandStyle() {
    if (document.getElementById('mdc-premium-brand-style')) return;
    const style = document.createElement('style');
    style.id = 'mdc-premium-brand-style';
    style.textContent = `
      .nav-logo img.mdc-brand-logo,.footer-logo.mdc-brand-logo,.mobile-install-banner img.mdc-brand-logo{object-fit:contain!important;object-position:center!important}
      .nav-logo img.mdc-brand-logo{border-radius:0!important;background:transparent!important}
      .footer-logo.mdc-brand-logo{max-width:170px;height:auto}
    `;
    document.head.appendChild(style);
  }

  function setPremiumBrandImages() {
    document.querySelectorAll('.nav-logo img, .footer-logo, .mobile-install-banner img').forEach(img => {
      if (img.src !== MEDIA.logo) img.src = MEDIA.logo;
      img.alt = 'MDC Ferretería';
      img.classList.add('mdc-brand-logo');
    });
  }

  function image(src, className, alt = '', priority = 'auto') {
    const img = document.createElement('img');
    img.src = src;
    img.className = className;
    img.alt = alt;
    img.decoding = 'async';
    img.loading = 'eager';
    try { img.fetchPriority = priority; } catch (_) {}
    img.draggable = false;
    img.addEventListener('error', () => { img.hidden = true; }, { once: true });
    return img;
  }

  function warmImage(src) {
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = src;
    } catch (_) {}
  }

  function warmCriticalAssets() {
    [MEDIA.logo, MEDIA.truck, 'assets/p-taladro.png', 'assets/p-amoladora.png', 'assets/p-cemento.png', 'assets/p-cable.png'].forEach(warmImage);
    try {
      if (typeof LiveCatalog !== 'undefined' && typeof LiveCatalog.load === 'function') {
        LiveCatalog.load().catch(() => null);
      }
    } catch (_) {}
    fetch('catalog.snapshot.json?v=6', {
      cache: 'force-cache',
      headers: { Accept: 'application/json' }
    }).catch(() => null);
  }

  function setStatus(text) {
    const el = activeSplash?.querySelector('[data-mdc-splash-status]');
    if (el) el.textContent = text;
  }

  function clearRuntime() {
    if (rafId) cancelAnimationFrame(rafId);
    if (finishTimer) window.clearTimeout(finishTimer);
    if (hardTimer) window.clearTimeout(hardTimer);
    rafId = 0;
    finishTimer = 0;
    hardTimer = 0;
  }

  function announceComplete() {
    if (completionSent) return;
    completionSent = true;
    try { document.dispatchEvent(new CustomEvent('mdc:splash-complete')); } catch (_) {}
  }

  function forceRemoveSplash() {
    clearRuntime();
    document.body?.classList.remove('mdc-splash-lock');
    document.documentElement.classList.add('mdc-splash-done');
    document.querySelectorAll('.mdc-splash').forEach(node => {
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
      node.remove();
    });
    activeSplash = null;
    announceComplete();
  }

  function setProgress(value) {
    const node = activeSplash;
    if (!node?.isConnected) return;
    const progress = Math.min(1, Math.max(0.025, Number(value) || 0.025));
    const bar = node.querySelector('.mdc-splash-bar-mask');
    const stage = node.querySelector('.mdc-splash-stage');
    const truck = node.querySelector('.mdc-splash-truck');
    if (bar) bar.style.transform = `scaleX(${progress})`;
    if (stage && truck) {
      const travel = Math.max(0, stage.clientWidth - truck.offsetWidth);
      truck.style.transform = `translate3d(${Math.round(travel * progress)}px,0,0)`;
    }
    node.style.setProperty('--mdc-progress', String(progress));
  }

  function finishSplash() {
    const node = activeSplash;
    if (!node?.isConnected) {
      forceRemoveSplash();
      return;
    }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    setProgress(1);
    if (node.dataset.mode === 'initial') setStatus(catalogReady ? 'Catálogo listo' : 'Entrando a MDC');
    node.classList.add('is-exiting');
    node.style.setProperty('pointer-events', 'none', 'important');
    finishTimer = window.setTimeout(forceRemoveSplash, reduceMotion ? 20 : 170);
  }

  function tick(now) {
    if (!activeSplash?.isConnected) return;
    const elapsed = Math.max(0, now - startedAt);
    const progress = Math.min(1, elapsed / Math.max(1, currentDisplayMs));
    setProgress(progress);
    if (progress >= 1) {
      finishSplash();
      return;
    }
    rafId = requestAnimationFrame(tick);
  }

  function buildSplash(status = 'Abriendo MDC', mode = 'arrival') {
    const splash = document.createElement('div');
    splash.className = 'mdc-splash';
    splash.dataset.startedAt = String(Date.now());
    splash.dataset.mode = mode;
    splash.setAttribute('role', 'status');
    splash.setAttribute('aria-live', 'polite');
    splash.setAttribute('aria-label', 'Preparando MDC Ferretería');

    const inner = document.createElement('div');
    inner.className = 'mdc-splash-inner';
    const logo = image(MEDIA.logo, 'mdc-splash-logo', 'MDC Ferretería', 'high');

    const stage = document.createElement('div');
    stage.className = 'mdc-splash-stage';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = '<div class="mdc-splash-track"><div class="mdc-splash-bar-mask"></div></div>';

    const truck = document.createElement('div');
    truck.className = 'mdc-splash-truck';
    truck.appendChild(image(MEDIA.truck, 'mdc-splash-truck-body', '', 'high'));
    truck.insertAdjacentHTML('beforeend', '<span class="mdc-wheel rear"></span><span class="mdc-wheel front"></span>');
    stage.appendChild(truck);

    const copy = document.createElement('div');
    copy.className = 'mdc-splash-copy';
    copy.innerHTML = `<strong>MDC Ferretería</strong><span data-mdc-splash-status>${status}</span>`;

    const hint = document.createElement('div');
    hint.className = 'mdc-splash-hint';
    hint.textContent = 'Linares · Región del Maule';

    inner.append(logo, stage, copy, hint);
    splash.appendChild(inner);
    return splash;
  }

  function startSplash({ duration, status, catalogAware = false, mode = 'arrival' }) {
    clearRuntime();
    document.querySelectorAll('.mdc-splash').forEach(node => node.remove());
    document.documentElement.classList.remove('mdc-splash-done');
    completionSent = false;
    catalogReady = false;
    currentDisplayMs = Math.max(100, Number(duration) || DIRECT_ARRIVAL_MS);
    currentHardMs = currentDisplayMs + HARD_PAD_MS;
    activeSplash = buildSplash(status, mode);
    document.body.appendChild(activeSplash);
    startedAt = performance.now();
    startedWallAt = Date.now();
    setProgress(0.025);

    if (catalogAware) {
      document.addEventListener('mdc:catalog-ready', () => {
        catalogReady = true;
        if (mode === 'initial') setStatus('Catálogo listo');
      }, { once: true });
      try {
        if (typeof LiveCatalog !== 'undefined' && LiveCatalog.loaded && LiveCatalog.products?.length) {
          catalogReady = true;
          if (mode === 'initial') setStatus('Catálogo listo');
        }
      } catch (_) {}
    }

    rafId = requestAnimationFrame(tick);
    hardTimer = window.setTimeout(forceRemoveSplash, currentHardMs);
  }

  function navigationIdentity(urlLike) {
    try {
      const url = new URL(urlLike, location.href);
      return `${url.origin}${normalizedPath(url.pathname)}${url.search}`;
    } catch (_) {
      return '';
    }
  }

  function sameDocumentHashNavigation(url) {
    return url.origin === location.origin
      && normalizedPath(url.pathname) === normalizedPath(location.pathname)
      && url.search === location.search
      && Boolean(url.hash)
      && url.hash !== location.hash;
  }

  function getInternalNavigation(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download')) return null;
    if (anchor.target && anchor.target.toLowerCase() !== '_self') return null;
    const raw = String(anchor.getAttribute('href') || '').trim();
    if (!raw || raw.startsWith('#') || /^(?:mailto:|tel:|sms:|javascript:)/i.test(raw)) return null;
    let url;
    try { url = new URL(anchor.href, location.href); } catch (_) { return null; }
    if (url.origin !== location.origin || sameDocumentHashNavigation(url)) return null;
    return url;
  }

  /*
   * Importante: no bloqueamos el click ni esperamos un timer antes de navegar.
   * Solo marcamos el destino. La pantalla con el camión se muestra al llegar,
   * mientras el nuevo documento ya está montado. Así desaparece el tirón de ~1 s.
   */
  function markNavigationArrival(event) {
    const url = getInternalNavigation(event);
    if (!url) return;
    safeSessionSet(NAV_PENDING_KEY, JSON.stringify({
      destination: navigationIdentity(url),
      at: Date.now()
    }));
  }

  function consumeNavigationArrival() {
    const raw = safeSessionGet(NAV_PENDING_KEY);
    if (!raw) return false;
    safeSessionRemove(NAV_PENDING_KEY);
    try {
      const payload = JSON.parse(raw);
      return Date.now() - Number(payload.at || 0) < 10000
        && payload.destination === navigationIdentity(location.href);
    } catch (_) {
      return false;
    }
  }

  function showArrivalSplash() {
    if (consumeNavigationArrival()) {
      startSplash({
        duration: NAV_ARRIVAL_MS,
        status: 'Cargando sección',
        catalogAware: false,
        mode: 'navigation'
      });
      return;
    }

    const firstHome = isHome() && safeSessionGet(FIRST_HOME_KEY) !== '1';
    if (firstHome) {
      safeSessionSet(FIRST_HOME_KEY, '1');
      startSplash({
        duration: INITIAL_DISPLAY_MS,
        status: 'Preparando catálogo',
        catalogAware: true,
        mode: 'initial'
      });
      return;
    }

    startSplash({
      duration: DIRECT_ARRIVAL_MS,
      status: 'Abriendo MDC',
      catalogAware: false,
      mode: 'arrival'
    });
  }

  function recover() {
    const splash = document.querySelector('.mdc-splash');
    if (!splash) return;
    const age = Date.now() - Number(splash.dataset.startedAt || startedWallAt || 0);
    if (!Number.isFinite(age) || age >= currentHardMs) forceRemoveSplash();
  }

  function boot() {
    if (booted) return;
    booted = true;
    preconnect();
    ensureBrandStyle();
    setPremiumBrandImages();
    document.addEventListener('click', markNavigationArrival, false);
    showArrivalSplash();
    warmCriticalAssets();
    scheduleSecondaryLayers();
    window.addEventListener('load', setPremiumBrandImages, { once: true });
  }

  window.addEventListener('pagehide', forceRemoveSplash);
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      startSplash({
        duration: NAV_ARRIVAL_MS,
        status: 'Volviendo a MDC',
        catalogAware: false,
        mode: 'navigation'
      });
    } else {
      recover();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
  window.addEventListener('error', recover, true);
  window.addEventListener('unhandledrejection', recover);

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
