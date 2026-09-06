/* MDC Ferretería · watchdog liviano del splash */
(() => {
  const MAX_VISIBLE_MS = 1700;
  let observer = null;

  function ensureCartGuard() {
    if (document.querySelector('script[data-mdc-cart-guard]')) return;
    const script = document.createElement('script');
    script.src = 'cart-state-guard.js?v=3';
    script.defer = true;
    script.dataset.mdcCartGuard = '1';
    document.head.appendChild(script);
  }

  function release() {
    document.body?.classList.remove('mdc-splash-lock');
    document.querySelectorAll('.mdc-splash').forEach(splash => {
      splash.classList.add('is-exiting');
      splash.style.pointerEvents = 'none';
      splash.style.visibility = 'hidden';
      splash.style.opacity = '0';
      window.setTimeout(() => splash.remove(), 100);
    });
  }

  function boot() {
    ensureCartGuard();
    release();

    /* Solo se observa durante el arranque: nunca queda un observer o intervalo permanente. */
    observer = new MutationObserver(() => {
      if (document.querySelector('.mdc-splash')) {
        window.setTimeout(release, MAX_VISIBLE_MS);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.setTimeout(() => {
      release();
      observer?.disconnect();
      observer = null;
    }, 3200);

    window.addEventListener('pageshow', release);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
