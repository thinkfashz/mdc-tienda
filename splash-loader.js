/* MDC Ferretería · Gaussian Splash con precarga real */
(() => {
  const MEDIA = Object.freeze({
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_620/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_360/v1788685315/mdc-truck.png'
  });
  const API_ORIGIN = 'https://mdc-app-dun.vercel.app';

  window.MDC_MEDIA = MEDIA;

  const SESSION_KEY = 'mdc-premium-splash-v6';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const MIN_VISIBLE_MS = reduceMotion ? 900 : 2850;
  const TARGET_VISIBLE_MS = reduceMotion ? 1100 : 3000;
  const HARD_FAILSAFE_MS = reduceMotion ? 1500 : 3800;
  let activeSplash = null;
  let startedAt = 0;
  let dismissed = false;
  let catalogReady = false;

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
    loadCssOnce('marketplace-experience.css?v=3', 'mdc-marketplace');
    loadCssOnce('social-contact.css?v=2', 'mdc-contact');
    loadScriptOnce('marketplace-experience.js?v=3', 'mdc-marketplace-js');
    loadScriptOnce('social-contact.js?v=2', 'mdc-contact-js');
    loadScriptOnce('app-update.js?v=4', 'mdc-app-update');
    loadScriptOnce('app-integrity.js?v=2', 'mdc-app-integrity');
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

    fetch('catalog.snapshot.json?v=4', { cache: 'force-cache', headers: { Accept: 'application/json' } }).catch(() => null);
  }

  function setStatus(text) {
    const el = activeSplash?.querySelector('[data-mdc-splash-status]');
    if (el) el.textContent = text;
  }

  function dismissSplash(immediate = false) {
    if (dismissed) return;
    dismissed = true;
    const node = activeSplash || document.querySelector('.mdc-splash');
    document.body?.classList.remove('mdc-splash-lock');
    if (!node) return;
    node.classList.add('is-exiting');
    node.style.pointerEvents = 'none';
    if (immediate) {
      node.remove();
      activeSplash = null;
      return;
    }
    window.setTimeout(() => {
      node.remove();
      activeSplash = null;
    }, 340);
  }

  function maybeDismiss() {
    if (!activeSplash || dismissed) return;
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_VISIBLE_MS) {
      window.setTimeout(maybeDismiss, MIN_VISIBLE_MS - elapsed);
      return;
    }
    if (catalogReady || elapsed >= TARGET_VISIBLE_MS) dismissSplash(false);
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
    copy.innerHTML = '<strong>MDC Ferretería</strong><span data-mdc-splash-status>Preparando catálogo, imágenes y tienda</span>';

    const hint = document.createElement('div');
    hint.className = 'mdc-splash-hint';
    hint.textContent = 'Linares · Región del Maule';

    inner.append(logo, stage, copy, hint);
    splash.appendChild(inner);
    return splash;
  }

  function showSplash() {
    document.querySelectorAll('.mdc-splash').forEach(node => node.remove());
    document.body?.classList.remove('mdc-splash-lock');
    if (safeSessionGet(SESSION_KEY) === '1') return false;
    safeSessionSet(SESSION_KEY, '1');

    dismissed = false;
    catalogReady = false;
    try {
      activeSplash = buildSplash();
      startedAt = Date.now();
      document.body.appendChild(activeSplash);
    } catch (_) {
      activeSplash = null;
      return false;
    }

    document.addEventListener('mdc:catalog-ready', () => {
      catalogReady = true;
      setStatus('Catálogo listo · terminando de preparar la tienda');
      maybeDismiss();
    }, { once: true });

    try {
      if (typeof LiveCatalog !== 'undefined' && LiveCatalog.loaded && LiveCatalog.products?.length) {
        catalogReady = true;
      }
    } catch (_) {}

    window.setTimeout(maybeDismiss, TARGET_VISIBLE_MS);
    window.setTimeout(() => dismissSplash(true), HARD_FAILSAFE_MS);
    window.addEventListener('pagehide', () => dismissSplash(true), { once: true });
    return true;
  }

  function recover() {
    const splash = document.querySelector('.mdc-splash');
    if (!splash) return;
    const age = Date.now() - Number(splash.dataset.startedAt || 0);
    if (!Number.isFinite(age) || age > HARD_FAILSAFE_MS) dismissSplash(true);
  }

  function boot() {
    preconnect();
    ensureBrandStyle();
    setPremiumBrandImages();
    const shown = showSplash();

    /* Durante el splash se descarga lo importante; no se espera hasta después. */
    loadLayers();
    warmCriticalAssets();

    if (!shown) {
      const later = () => warmCriticalAssets();
      if ('requestIdleCallback' in window) requestIdleCallback(later, { timeout: 600 });
      else window.setTimeout(later, 250);
    }

    window.addEventListener('load', setPremiumBrandImages, { once: true });
  }

  window.addEventListener('pageshow', recover);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
  window.setTimeout(recover, HARD_FAILSAFE_MS + 120);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
