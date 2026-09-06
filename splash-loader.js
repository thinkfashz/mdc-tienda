/* MDC Ferretería · Splash ultraligero y no bloqueante */
(() => {
  const MEDIA = Object.freeze({
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_520/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_360/v1788685315/mdc-truck.png'
  });

  window.MDC_MEDIA = MEDIA;

  const SESSION_KEY = 'mdc-premium-splash-v4';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const SPLASH_MS = reduceMotion ? 280 : 920;
  const HARD_FAILSAFE_MS = 1450;

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }

  function preconnect() {
    if (document.querySelector('link[data-mdc-cloudinary-preconnect]')) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://res.cloudinary.com';
    link.crossOrigin = 'anonymous';
    link.dataset.mdcCloudinaryPreconnect = '1';
    document.head.appendChild(link);
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
    loadCssOnce('marketplace-experience.css?v=2', 'mdc-marketplace');
    loadCssOnce('social-contact.css?v=2', 'mdc-contact');
    loadScriptOnce('marketplace-experience.js?v=2', 'mdc-marketplace-js');
    loadScriptOnce('social-contact.js?v=2', 'mdc-contact-js');
    loadScriptOnce('app-update.js?v=3', 'mdc-app-update');
  }

  function scheduleLayers() {
    const run = () => loadLayers();
    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 1200 });
    } else {
      window.setTimeout(run, 700);
    }
  }

  function ensureBrandStyle() {
    if (document.getElementById('mdc-premium-brand-style')) return;
    const style = document.createElement('style');
    style.id = 'mdc-premium-brand-style';
    style.textContent = `
      .nav-logo img.mdc-brand-logo,.footer-logo.mdc-brand-logo,.mobile-install-banner img.mdc-brand-logo{object-fit:contain!important;object-position:center!important}
      .nav-logo img.mdc-brand-logo{border-radius:0!important;background:transparent!important}
      .footer-logo.mdc-brand-logo{max-width:150px;height:auto}
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

  function dismissSplash(splash, immediate = false) {
    document.body?.classList.remove('mdc-splash-lock');
    const node = splash || document.querySelector('.mdc-splash');
    if (!node) return;
    node.classList.add('is-exiting');
    node.style.pointerEvents = 'none';
    if (immediate) {
      node.remove();
      return;
    }
    window.setTimeout(() => node.remove(), 220);
  }

  function buildSplash() {
    const splash = document.createElement('div');
    splash.className = 'mdc-splash';
    splash.dataset.startedAt = String(Date.now());
    splash.setAttribute('role', 'status');
    splash.setAttribute('aria-live', 'polite');
    splash.setAttribute('aria-label', 'Abriendo MDC Ferretería');

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
    copy.innerHTML = '<strong>Abriendo MDC</strong><span>Herramientas y materiales en Linares</span>';

    const badges = document.createElement('div');
    badges.className = 'mdc-splash-badges';
    badges.innerHTML = '<span>Marcas confiables</span><span>Stock actualizado</span><span>Despacho coordinado</span>';

    inner.append(logo, stage, copy, badges);
    splash.appendChild(inner);
    return splash;
  }

  function showSplash() {
    document.querySelectorAll('.mdc-splash').forEach(node => node.remove());
    document.body?.classList.remove('mdc-splash-lock');

    if (safeSessionGet(SESSION_KEY) === '1') return;
    safeSessionSet(SESSION_KEY, '1');

    let splash;
    try {
      splash = buildSplash();
      document.body.appendChild(splash);
    } catch (_) {
      return;
    }

    const exitTimer = window.setTimeout(() => dismissSplash(splash), SPLASH_MS);
    const hardTimer = window.setTimeout(() => dismissSplash(splash, true), HARD_FAILSAFE_MS);

    const cleanup = () => {
      clearTimeout(exitTimer);
      clearTimeout(hardTimer);
      dismissSplash(splash, true);
    };
    window.addEventListener('pagehide', cleanup, { once: true });
  }

  function recover() {
    const splash = document.querySelector('.mdc-splash');
    if (!splash) return;
    const startedAt = Number(splash.dataset.startedAt || 0);
    if (!startedAt || Date.now() - startedAt > HARD_FAILSAFE_MS) dismissSplash(splash, true);
  }

  function boot() {
    preconnect();
    loadScriptOnce('cart-state-guard.js?v=3', 'mdc-cart-state');
    ensureBrandStyle();
    setPremiumBrandImages();
    showSplash();
    scheduleLayers();
    window.addEventListener('load', setPremiumBrandImages, { once: true });
  }

  window.addEventListener('pageshow', recover);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover();
  });
  window.setTimeout(recover, HARD_FAILSAFE_MS + 100);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
