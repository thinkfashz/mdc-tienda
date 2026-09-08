/* MDC Ferretería · Gaussian Splash robusto y no bloqueante */
(() => {
  const MEDIA = Object.freeze({
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_620/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_360/v1788685315/mdc-truck.png'
  });
  const API_ORIGIN = 'https://mdc-app-dun.vercel.app';
  const SESSION_KEY = 'mdc-premium-splash-v8';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const MIN_VISIBLE_MS = reduceMotion ? 100 : 520;
  const TARGET_VISIBLE_MS = reduceMotion ? 180 : 920;
  const HARD_FAILSAFE_MS = reduceMotion ? 350 : 1450;

  window.MDC_MEDIA = MEDIA;

  let activeSplash = null;
  let startedAt = 0;
  let catalogReady = false;
  let dismissTimer = 0;
  let hardTimer = 0;

  function isHome() {
    const path = location.pathname.replace(/\/+$/, '');
    return path === '' || path === '/' || path.endsWith('/index.html');
  }

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
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

  function loadLayers() {
    loadCssOnce('marketplace-experience.css?v=4', 'mdc-marketplace');
    loadCssOnce('social-contact.css?v=3', 'mdc-contact');
    loadScriptOnce('marketplace-experience.js?v=4', 'mdc-marketplace-js');
    loadScriptOnce('social-contact.js?v=3', 'mdc-contact-js');
    loadScriptOnce('app-update.js?v=16', 'mdc-app-update');
    loadScriptOnce('app-integrity.js?v=3', 'mdc-app-integrity');
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
    ['assets/p-taladro.png', 'assets/p-amoladora.png', 'assets/p-cemento.png', 'assets/p-cable.png'].forEach(warmImage);
    try {
      if (typeof LiveCatalog !== 'undefined' && typeof LiveCatalog.load === 'function') {
        LiveCatalog.load().catch(() => null);
      }
    } catch (_) {}
    fetch('catalog.snapshot.json?v=5', { cache: 'force-cache', headers: { Accept: 'application/json' } }).catch(() => null);
  }

  function setStatus(text) {
    const el = activeSplash?.querySelector('[data-mdc-splash-status]');
    if (el) el.textContent = text;
  }

  function clearTimers() {
    if (dismissTimer) window.clearTimeout(dismissTimer);
    if (hardTimer) window.clearTimeout(hardTimer);
    dismissTimer = 0;
    hardTimer = 0;
  }

  function forceRemoveSplash() {
    clearTimers();
    document.body?.classList.remove('mdc-splash-lock');
    document.querySelectorAll('.mdc-splash').forEach(node => {
      node.style.setProperty('animation', 'none', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
      node.style.setProperty('opacity', '0', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.remove();
    });
    activeSplash = null;
  }

  function dismissSplash() {
    const node = activeSplash;
    if (!node?.isConnected) {
      forceRemoveSplash();
      return;
    }

    node.style.setProperty('animation', 'none', 'important');
    node.style.setProperty('pointer-events', 'none', 'important');
    node.style.setProperty('opacity', '0', 'important');
    node.style.setProperty('visibility', 'hidden', 'important');
    node.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    node.style.setProperty('backdrop-filter', 'none', 'important');
    node.classList.add('is-exiting');
    document.body?.classList.remove('mdc-splash-lock');

    dismissTimer = window.setTimeout(forceRemoveSplash, 190);
  }

  function maybeDismiss() {
    if (!activeSplash?.isConnected) return;
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_VISIBLE_MS) {
      dismissTimer = window.setTimeout(maybeDismiss, MIN_VISIBLE_MS - elapsed);
      return;
    }
    if (catalogReady || elapsed >= TARGET_VISIBLE_MS) dismissSplash();
  }

  function buildSplash() {
    const splash = document.createElement('div');
    splash.className = 'mdc-splash';
    splash.dataset.startedAt = String(Date.now());
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
    copy.innerHTML = '<strong>MDC Ferretería</strong><span data-mdc-splash-status>Preparando catálogo</span>';

    const hint = document.createElement('div');
    hint.className = 'mdc-splash-hint';
    hint.textContent = 'Linares · Región del Maule';

    inner.append(logo, stage, copy, hint);
    splash.appendChild(inner);
    return splash;
  }

  function showSplash() {
    forceRemoveSplash();
    if (!isHome() || safeSessionGet(SESSION_KEY) === '1') return false;
    safeSessionSet(SESSION_KEY, '1');

    catalogReady = false;
    activeSplash = buildSplash();
    startedAt = Date.now();
    document.body.appendChild(activeSplash);

    hardTimer = window.setTimeout(forceRemoveSplash, HARD_FAILSAFE_MS);
    dismissTimer = window.setTimeout(maybeDismiss, TARGET_VISIBLE_MS);

    document.addEventListener('mdc:catalog-ready', () => {
      catalogReady = true;
      setStatus('Catálogo listo');
      maybeDismiss();
    }, { once: true });

    try {
      if (typeof LiveCatalog !== 'undefined' && LiveCatalog.loaded && LiveCatalog.products?.length) {
        catalogReady = true;
        maybeDismiss();
      }
    } catch (_) {}

    window.addEventListener('pagehide', forceRemoveSplash, { once: true });
    return true;
  }

  function recover() {
    const splash = document.querySelector('.mdc-splash');
    if (!splash) return;
    const age = Date.now() - Number(splash.dataset.startedAt || 0);
    if (!Number.isFinite(age) || age >= HARD_FAILSAFE_MS) forceRemoveSplash();
  }

  function boot() {
    preconnect();
    ensureBrandStyle();
    setPremiumBrandImages();
    showSplash();

    /* Precarga en paralelo: nunca condiciona la salida del splash. */
    loadLayers();
    warmCriticalAssets();

    window.addEventListener('load', setPremiumBrandImages, { once: true });
  }

  window.addEventListener('pageshow', recover);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
  window.addEventListener('error', recover, true);
  window.addEventListener('unhandledrejection', recover);
  window.setTimeout(recover, HARD_FAILSAFE_MS + 100);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
