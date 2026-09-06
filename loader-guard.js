/* MDC Ferretería · watchdog independiente del splash */
(() => {
  const MAX_VISIBLE_MS = 3000;
  const seen = new WeakSet();

  function ensureCartGuard() {
    if (document.querySelector('script[data-mdc-cart-guard]')) return;
    const script = document.createElement('script');
    script.src = `cart-state-guard.js?v=${Date.now()}`;
    script.defer = true;
    script.dataset.mdcCartGuard = '1';
    document.head.appendChild(script);
  }

  function release(node = null) {
    document.body?.classList.remove('mdc-splash-lock');
    const targets = node ? [node] : [...document.querySelectorAll('.mdc-splash')];
    targets.forEach(splash => {
      if (!splash || !splash.isConnected) return;
      splash.classList.add('is-exiting');
      splash.style.pointerEvents = 'none';
      splash.style.visibility = 'hidden';
      splash.style.opacity = '0';
      window.setTimeout(() => splash.remove(), 120);
    });
  }

  function armSplash(splash) {
    if (!splash || seen.has(splash)) return;
    seen.add(splash);
    window.setTimeout(() => release(splash), MAX_VISIBLE_MS);
  }

  function scan() {
    document.querySelectorAll('.mdc-splash').forEach(armSplash);
    if (!document.querySelector('.mdc-splash')) {
      document.body?.classList.remove('mdc-splash-lock');
    }
  }

  function boot() {
    ensureCartGuard();
    scan();

    const observer = new MutationObserver(() => scan());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('pageshow', scan);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scan();
    });

    // Segunda garantía por si un WebView restaura un DOM antiguo.
    window.setInterval(scan, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
