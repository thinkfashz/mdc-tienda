/* MDC Ferretería · Gaussian Splash v20 · navegación + sonido de camión */
(() => {
  const MEDIA = Object.freeze({
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_620/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/f_auto,q_auto,w_360/v1788685315/mdc-truck.png'
  });

  const API_ORIGIN = 'https://mdc-app-dun.vercel.app';
  const FIRST_HOME_KEY = 'mdc-premium-splash-v20';
  const SKIP_ARRIVAL_KEY = 'mdc-nav-skip-arrival-v20';
  const SOUND_KEY = 'mdc-truck-sound-enabled-v1';
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const INITIAL_DISPLAY_MS = reduceMotion ? 360 : 2850;
  const ARRIVAL_DISPLAY_MS = reduceMotion ? 180 : 720;
  const NAV_DISPLAY_MS = reduceMotion ? 260 : 980;
  const HARD_PAD_MS = reduceMotion ? 260 : 850;

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
  let navigationTimer = 0;
  let booted = false;
  let navigating = false;

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

  function safeLocalGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeLocalSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function soundEnabled() {
    return safeLocalGet(SOUND_KEY) !== '0';
  }

  /*
    Sonido generado con Web Audio: no descarga MP3, no añade peso ni dependencia.
    Los navegadores permiten el sonido en los cambios iniciados por toque/clic.
  */
  function playTruckSound() {
    if (!soundEnabled()) return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      const ctx = new AudioContextCtor();
      if (ctx.state === 'suspended') ctx.resume().catch(() => null);
      const now = ctx.currentTime;
      const end = now + 0.92;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.085, now + 0.045);
      master.gain.setValueAtTime(0.078, now + 0.58);
      master.gain.exponentialRampToValueAtTime(0.0001, end);
      master.connect(ctx.destination);

      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(235, now);
      engineFilter.frequency.linearRampToValueAtTime(330, now + 0.55);
      engineFilter.Q.value = 0.8;
      engineFilter.connect(master);

      const engineGain = ctx.createGain();
      engineGain.gain.value = 0.34;
      engineGain.connect(engineFilter);

      const engine = ctx.createOscillator();
      engine.type = 'sawtooth';
      engine.frequency.setValueAtTime(54, now);
      engine.frequency.exponentialRampToValueAtTime(82, now + 0.56);
      engine.frequency.exponentialRampToValueAtTime(64, end);
      engine.connect(engineGain);

      const subGain = ctx.createGain();
      subGain.gain.value = 0.14;
      subGain.connect(engineFilter);

      const sub = ctx.createOscillator();
      sub.type = 'square';
      sub.frequency.setValueAtTime(27, now);
      sub.frequency.exponentialRampToValueAtTime(41, now + 0.56);
      sub.frequency.exponentialRampToValueAtTime(32, end);
      sub.connect(subGain);

      const noiseBuffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 0.78)), ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i += 1) noiseData[i] = (Math.random() * 2 - 1) * 0.55;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 420;
      noiseFilter.Q.value = 0.65;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.018, now);
      noiseGain.gain.linearRampToValueAtTime(0.045, now + 0.55);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, end);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);

      engine.start(now);
      sub.start(now);
      noise.start(now);
      engine.stop(end);
      sub.stop(end);
      noise.stop(end);

      window.setTimeout(() => ctx.close().catch(() => null), 1150);
    } catch (_) {}
  }

  window.MDC_TRUCK_SOUND = Object.freeze({
    play: playTruckSound,
    setEnabled(enabled) {
      safeLocalSet(SOUND_KEY, enabled ? '1' : '0');
    },
    isEnabled: soundEnabled
  });

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
    loadScriptOnce('app-update.js?v=20', 'mdc-app-update');
    loadScriptOnce('app-integrity.js?v=3', 'mdc-app-integrity');
  }

  function scheduleSecondaryLayers() {
    const run = () => loadSecondaryLayers();
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1200 });
    else window.setTimeout(run, 500);
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
      if (typeof LiveCatalog !== 'undefined' && typeof LiveCatalog.load === 'function') LiveCatalog.load().catch(() => null);
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
    if (!navigating) setStatus(catalogReady ? 'Catálogo listo' : 'Entrando a MDC');
    node.classList.add('is-exiting');
    node.style.setProperty('pointer-events', 'none', 'important');
    finishTimer = window.setTimeout(forceRemoveSplash, reduceMotion ? 20 : 220);
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

  function buildSplash(status = 'Preparando catálogo', mode = 'arrival') {
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
    forceRemoveSplash();
    document.documentElement.classList.remove('mdc-splash-done');
    catalogReady = false;
    currentDisplayMs = Math.max(120, Number(duration) || ARRIVAL_DISPLAY_MS);
    currentHardMs = currentDisplayMs + HARD_PAD_MS;
    activeSplash = buildSplash(status, mode);
    if (mode === 'navigation') activeSplash.style.setProperty('pointer-events', 'auto', 'important');
    document.body.appendChild(activeSplash);
    startedAt = performance.now();
    startedWallAt = Date.now();
    setProgress(0.025);

    if (catalogAware) {
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
    }

    rafId = requestAnimationFrame(tick);
    hardTimer = window.setTimeout(forceRemoveSplash, currentHardMs);
    return true;
  }

  function navigationIdentity(urlLike) {
    try {
      const url = new URL(urlLike, location.href);
      return `${url.origin}${normalizedPath(url.pathname)}${url.search}`;
    } catch (_) {
      return '';
    }
  }

  function markSkipArrival(url) {
    safeSessionSet(SKIP_ARRIVAL_KEY, JSON.stringify({
      destination: navigationIdentity(url),
      at: Date.now()
    }));
  }

  function consumeSkipArrival() {
    const raw = safeSessionGet(SKIP_ARRIVAL_KEY);
    if (!raw) return false;
    safeSessionRemove(SKIP_ARRIVAL_KEY);
    try {
      const payload = JSON.parse(raw);
      return Date.now() - Number(payload.at || 0) < 8000
        && payload.destination === navigationIdentity(location.href);
    } catch (_) {
      return false;
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

  function prefetchDestination(url) {
    try {
      fetch(url.href, {
        method: 'GET',
        cache: 'force-cache',
        credentials: 'same-origin',
        headers: { 'X-MDC-Prefetch': 'navigation' }
      }).catch(() => null);
    } catch (_) {}
  }

  function handleInternalNavigation(event) {
    const url = getInternalNavigation(event);
    if (!url) return;
    event.preventDefault();
    if (navigating) return;

    navigating = true;
    markSkipArrival(url);
    prefetchDestination(url);
    playTruckSound();
    startSplash({
      duration: NAV_DISPLAY_MS,
      status: 'Cargando sección',
      catalogAware: false,
      mode: 'navigation'
    });

    navigationTimer = window.setTimeout(() => {
      location.assign(url.href);
    }, NAV_DISPLAY_MS + (reduceMotion ? 20 : 70));
  }

  function showArrivalSplash() {
    if (consumeSkipArrival()) {
      document.documentElement.classList.add('mdc-splash-done');
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
      duration: ARRIVAL_DISPLAY_MS,
      status: 'Abriendo sección',
      catalogAware: true,
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
    showArrivalSplash();
    warmCriticalAssets();
    scheduleSecondaryLayers();
    document.addEventListener('click', handleInternalNavigation, false);
    window.addEventListener('load', setPremiumBrandImages, { once: true });
  }

  window.addEventListener('pagehide', () => {
    if (navigationTimer) window.clearTimeout(navigationTimer);
    navigationTimer = 0;
    forceRemoveSplash();
  });

  window.addEventListener('pageshow', event => {
    navigating = false;
    if (event.persisted) {
      startSplash({
        duration: ARRIVAL_DISPLAY_MS,
        status: 'Volviendo a MDC',
        catalogAware: false,
        mode: 'arrival'
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
