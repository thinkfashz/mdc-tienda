/* MDC Ferretería · Splash premium robusto */
(() => {
  const MEDIA = Object.freeze({
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685315/mdc-truck.png',
    bar: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685459/mdc-progress-bar.png',
    loading: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685584/mdc-loading-text.png',
    subtitle: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685611/mdc-subtitle.png',
    wheel: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685625/mdc-wheel.png',
    brands: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685635/mdc-badge-brands.png',
    stock: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685647/mdc-badge-stock.png',
    delivery: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685660/mdc-badge-delivery.png',
  });

  window.MDC_MEDIA = MEDIA;

  const SESSION_KEY = 'mdc-premium-splash-v3';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const SPLASH_MS = reduceMotion ? 520 : 2000;
  const HARD_FAILSAFE_MS = 3400;

  function loadScriptOnce(src, dataName) {
    if (document.querySelector(`script[data-${dataName}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.setAttribute(`data-${dataName}`, '1');
    document.head.appendChild(script);
  }

  function loadLayers() {
    if (!document.querySelector('link[data-mdc-marketplace]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'marketplace-experience.css?v=1';
      css.dataset.mdcMarketplace = '1';
      document.head.appendChild(css);
    }
    if (!document.querySelector('link[data-mdc-contact]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'social-contact.css?v=1';
      css.dataset.mdcContact = '1';
      document.head.appendChild(css);
    }

    loadScriptOnce('marketplace-experience.js?v=1', 'mdc-marketplace');
    loadScriptOnce('social-contact.js?v=1', 'mdc-contact');
    loadScriptOnce('app-integrity.js?v=2', 'mdc-integrity');
    loadScriptOnce('app-update.js?v=2', 'mdc-app-update');
  }

  function ensureBrandStyle() {
    if (document.getElementById('mdc-premium-brand-style')) return;
    const style = document.createElement('style');
    style.id = 'mdc-premium-brand-style';
    style.textContent = `
      .nav-logo img.mdc-brand-logo,
      .footer-logo.mdc-brand-logo,
      .mobile-install-banner img.mdc-brand-logo{
        object-fit:contain !important;
        object-position:center !important;
      }
      .nav-logo img.mdc-brand-logo{
        border-radius:0 !important;
        background:transparent !important;
      }
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

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }

  function image(src, className, alt = '') {
    const img = document.createElement('img');
    img.src = src;
    img.className = className;
    img.alt = alt;
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('error', () => { img.hidden = true; }, { once: true });
    return img;
  }

  function dismissSplash(splash, immediate = false) {
    if (!splash) splash = document.querySelector('.mdc-splash');
    document.body?.classList.remove('mdc-splash-lock');
    if (!splash) return;

    if (immediate) {
      splash.remove();
      return;
    }

    splash.classList.add('is-exiting');
    window.setTimeout(() => splash.remove(), 360);
  }

  function animateTruck(splash) {
    if (reduceMotion) return;
    try {
      const stage = splash.querySelector('.mdc-splash-stage');
      const truck = splash.querySelector('.mdc-splash-truck');
      if (!stage || !truck || typeof truck.animate !== 'function') return;

      requestAnimationFrame(() => requestAnimationFrame(() => {
        try {
          const travel = Math.max(0, stage.clientWidth - truck.clientWidth - 4);
          truck.animate([
            { transform: 'translate3d(-8px,0,0)' },
            { transform: `translate3d(${travel}px,0,0)` }
          ], {
            duration: 1720,
            delay: 130,
            easing: 'cubic-bezier(.16,.72,.2,1)',
            fill: 'forwards'
          });
        } catch (_) {}
      }));
    } catch (_) {}
  }

  function buildTruck() {
    const truck = document.createElement('div');
    truck.className = 'mdc-splash-truck';
    truck.setAttribute('aria-hidden', 'true');
    truck.append(
      image(MEDIA.truck, 'mdc-splash-truck-body'),
      image(MEDIA.wheel, 'mdc-splash-wheel rear'),
      image(MEDIA.wheel, 'mdc-splash-wheel front')
    );
    return truck;
  }

  function buildSplash() {
    const splash = document.createElement('div');
    splash.className = 'mdc-splash';
    splash.dataset.startedAt = String(Date.now());
    splash.setAttribute('role', 'status');
    splash.setAttribute('aria-live', 'polite');
    splash.setAttribute('aria-label', 'Cargando MDC Ferretería');

    const inner = document.createElement('div');
    inner.className = 'mdc-splash-inner';
    const logo = image(MEDIA.logo, 'mdc-splash-logo', 'MDC Ferretería');

    const stage = document.createElement('div');
    stage.className = 'mdc-splash-stage';
    stage.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'mdc-splash-track';
    const mask = document.createElement('div');
    mask.className = 'mdc-splash-bar-mask';
    mask.append(image(MEDIA.bar, 'mdc-splash-bar-art'));
    track.append(mask);
    stage.append(track, buildTruck());

    const loading = image(MEDIA.loading, 'mdc-splash-loading-text', 'Cargando catálogo…');
    const subtitle = image(MEDIA.subtitle, 'mdc-splash-subtitle', 'Las mejores herramientas más cerca de ti');
    const badges = document.createElement('div');
    badges.className = 'mdc-splash-badges';
    badges.setAttribute('aria-hidden', 'true');
    badges.append(
      image(MEDIA.brands, 'mdc-splash-badge'),
      image(MEDIA.stock, 'mdc-splash-badge'),
      image(MEDIA.delivery, 'mdc-splash-badge')
    );

    inner.append(logo, stage, loading, subtitle, badges);
    splash.append(inner);
    return splash;
  }

  function showSplash() {
    const stale = document.querySelector('.mdc-splash');
    if (stale) dismissSplash(stale, true);
    if (safeSessionGet(SESSION_KEY) === '1') {
      document.body?.classList.remove('mdc-splash-lock');
      return;
    }

    let splash;
    try {
      safeSessionSet(SESSION_KEY, '1');
      splash = buildSplash();
      document.body.classList.add('mdc-splash-lock');
      document.body.appendChild(splash);
    } catch (_) {
      document.body?.classList.remove('mdc-splash-lock');
      return;
    }

    // Los temporizadores se arman ANTES de cualquier animación para garantizar salida.
    const exitTimer = window.setTimeout(() => dismissSplash(splash, false), SPLASH_MS);
    const hardTimer = window.setTimeout(() => dismissSplash(splash, true), HARD_FAILSAFE_MS);

    animateTruck(splash);

    const cleanupOnHide = () => {
      clearTimeout(exitTimer);
      clearTimeout(hardTimer);
      dismissSplash(splash, true);
    };
    window.addEventListener('pagehide', cleanupOnHide, { once: true });
  }

  function recoverFromFrozenSplash() {
    const splash = document.querySelector('.mdc-splash');
    if (!splash) {
      document.body?.classList.remove('mdc-splash-lock');
      return;
    }
    const startedAt = Number(splash.dataset.startedAt || 0);
    if (!startedAt || Date.now() - startedAt > HARD_FAILSAFE_MS) dismissSplash(splash, true);
  }

  function boot() {
    ensureBrandStyle();
    setPremiumBrandImages();
    showSplash();

    // Carga lógica secundaria después de asegurar la salida del loader.
    window.setTimeout(loadLayers, 80);

    const observer = new MutationObserver(() => setPremiumBrandImages());
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 7000);
  }

  window.addEventListener('pageshow', recoverFromFrozenSplash);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recoverFromFrozenSplash();
  });
  window.setTimeout(recoverFromFrozenSplash, HARD_FAILSAFE_MS + 250);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
