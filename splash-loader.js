/* MDC Ferretería · Splash premium 2s · Assets servidos por Cloudinary */
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

  const SESSION_KEY = 'mdc-premium-splash-v2';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const SPLASH_MS = reduceMotion ? 650 : 2000;

  function loadMarketplaceLayer() {
    if (!document.querySelector('link[data-mdc-marketplace]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'marketplace-experience.css?v=1';
      css.dataset.mdcMarketplace = '1';
      document.head.appendChild(css);
    }

    if (!document.querySelector('script[data-mdc-marketplace]')) {
      const script = document.createElement('script');
      script.src = 'marketplace-experience.js?v=1';
      script.defer = true;
      script.dataset.mdcMarketplace = '1';
      document.head.appendChild(script);
    }
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
      .footer-logo.mdc-brand-logo{
        max-width:150px;
        height:auto;
      }
    `;
    document.head.appendChild(style);
  }

  function setPremiumBrandImages() {
    document.querySelectorAll('.nav-logo img, .footer-logo, .mobile-install-banner img').forEach(img => {
      img.src = MEDIA.logo;
      img.alt = 'MDC Ferretería';
      img.classList.add('mdc-brand-logo');
    });
  }

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) { /* no-op */ }
  }

  function image(src, className, alt = '') {
    const img = document.createElement('img');
    img.src = src;
    img.className = className;
    img.alt = alt;
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('error', () => img.hidden = true, { once: true });
    return img;
  }

  function animateTruck(splash) {
    if (reduceMotion) return;
    const stage = splash.querySelector('.mdc-splash-stage');
    const truck = splash.querySelector('.mdc-splash-truck');
    if (!stage || !truck || !truck.animate) return;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const travel = Math.max(0, stage.clientWidth - truck.clientWidth - 4);
      truck.animate([
        { transform: 'translate3d(-8px, 0, 0)' },
        { transform: `translate3d(${travel}px, 0, 0)` }
      ], {
        duration: 1720,
        delay: 130,
        easing: 'cubic-bezier(.16,.72,.2,1)',
        fill: 'forwards'
      });
    }));
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
    if (safeSessionGet(SESSION_KEY) === '1') return;
    if (document.querySelector('.mdc-splash')) return;

    safeSessionSet(SESSION_KEY, '1');
    const splash = buildSplash();
    document.body.classList.add('mdc-splash-lock');
    document.body.appendChild(splash);
    animateTruck(splash);

    const exitTimer = window.setTimeout(() => {
      splash.classList.add('is-exiting');
      document.body.classList.remove('mdc-splash-lock');
    }, SPLASH_MS);

    const removeTimer = window.setTimeout(() => {
      splash.remove();
    }, SPLASH_MS + 380);

    window.addEventListener('pagehide', () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
      document.body.classList.remove('mdc-splash-lock');
    }, { once: true });
  }

  function boot() {
    loadMarketplaceLayer();
    ensureBrandStyle();
    setPremiumBrandImages();
    showSplash();

    // Conserva la marca premium aunque otras capas re-rendericen header/footer/banner.
    const observer = new MutationObserver(() => setPremiumBrandImages());
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 7000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
