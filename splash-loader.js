/* MDC Ferretería · Gaussian Splash v18 · progreso único y desmontaje determinista */
(() => {
  const MEDIA = Object.freeze({
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_620/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_360/v1788685315/mdc-truck.png'
  });
  const API_ORIGIN = 'https://mdc-app-dun.vercel.app';
  const SESSION_KEY = 'mdc-premium-splash-v9';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const DISPLAY_MS = reduceMotion ? 360 : 2850;
  const HARD_FAILSAFE_MS = reduceMotion ? 700 : 3650;

  window.MDC_MEDIA = MEDIA;

  let activeSplash = null;
  let startedAt = 0;
  let startedWallAt = 0;
  let catalogReady = false;
  let rafId = 0;
  let finishTimer = 0;
  let hardTimer = 0;
  let booted = false;

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

  function loadSecondaryLayers() {
    loadCssOnce('marketplace-experience.css?v=4', 'mdc-marketplace');
    loadCssOnce('social-contact.css?v=3', 'mdc-contact');
    loadScriptOnce('marketplace-experience.js?v=4', 'mdc-marketplace-js');
    loadScriptOnce('social-contact.js?v=3', 'mdc-contact-js');
    loadScriptOnce('app-update.js?v=18', 'mdc-app-update');
    loadScriptOnce('app-integrity.js?v=3', 'mdc-app-integrity');
  }

  function scheduleSecondaryLayers() {
    const run = () => loadSecondaryLayers();
    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 1200 });
    } else {
      window.setTimeout(run, 500);
    }
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
    setStatus(catalogReady ? 'Catálogo listo' : 'Entrando a MDC');
    node.classList.add('is-exiting');
    node.style.setProperty('pointer-events', 'none', 'important');
    finishTimer = window.setTimeout(forceRemoveSplash, reduceMotion ? 20 : 220);
  }

  function tick(now) {
    if (!activeSplash?.isConnected) return;
    const elapsed = Math.max(0, now - startedAt);
    const progress = Math.min(1, elapsed / DISPLAY_MS);
    setProgress(progress);

    if (progress >= 1) {
      finishSplash();
      return;
    }

    rafId = requestAnimationFrame(tick);
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
    document.documentElement.classList.remove('mdc-splash-done');

    if (!isHome() || safeSessionGet(SESSION_KEY) === '1') {
      document.documentElement.classList.add('mdc-splash-done');
      return false;
    }

    safeSessionSet(SESSION_KEY, '1');
    catalogReady = false;
    activeSplash = buildSplash();
    document.body.appendChild(activeSplash);
    startedAt = performance.now();
    startedWallAt = Date.now();
    setProgress(0.025);

    document.addEventListener('mdc:catalog-ready', () => {
      catalogReady = true;
      setStatus('Catálogo listo');
    }, { once: true });

    try {
      if (typeof LiveCatalog !== 'undefined' && LiveCatalog.loaded && LiveCatalog.products?.length) {
        catalogReady = true;
        setStatus('Catálogo listo');
      }
    } catch (_) {}

    rafId = requestAnimationFrame(tick);
    hardTimer = window.setTimeout(forceRemoveSplash, HARD_FAILSAFE_MS);
    return true;
  }

  function recover() {
    const splash = document.querySelector('.mdc-splash');
    if (!splash) return;
    const age = Date.now() - Number(splash.dataset.startedAt || startedWallAt || 0);
    if (!Number.isFinite(age) || age >= HARD_FAILSAFE_MS) forceRemoveSplash();
  }

  function boot() {
    if (booted) return;
    booted = true;
    preconnect();
    ensureBrandStyle();
    setPremiumBrandImages();
    showSplash();
    warmCriticalAssets();
    scheduleSecondaryLayers();
    window.addEventListener('load', setPremiumBrandImages, { once: true });
  }

  window.addEventListener('pagehide', forceRemoveSplash, { once: true });
  window.addEventListener('pageshow', event => {
    if (event.persisted) forceRemoveSplash();
    else recover();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
  window.addEventListener('error', recover, true);
  window.addEventListener('unhandledrejection', recover);

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
})();
