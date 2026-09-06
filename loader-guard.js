/* MDC Ferretería · watchdog del splash */
(() => {
  const MAX_VISIBLE_MS = 1700;
  let observer = null;

  function ensureCartGuard() {
    if (document.querySelector('script[data-mdc-cart-guard]')) return;
    const script = document.createElement('script');
    script.src = 'cart-state-guard.js?v=5';
    script.defer = true;
    script.dataset.mdcCartGuard = '1';
    document.head.appendChild(script);
  }

  function releaseNode(splash) {
    if (!splash?.isConnected) return;
    splash.classList.add('is-exiting');
    splash.style.pointerEvents = 'none';
    splash.style.visibility = 'hidden';
    splash.style.opacity = '0';
    document.body?.classList.remove('mdc-splash-lock');
    window.setTimeout(() => splash.remove(), 80);
  }

  function guardNode(splash) {
    if (!splash) return;
    const startedAt = Number(splash.dataset.startedAt || Date.now());
    const age = Math.max(0, Date.now() - startedAt);
    const remaining = Math.max(0, MAX_VISIBLE_MS - age);
    window.setTimeout(() => releaseNode(splash), remaining);
  }

  function releaseStale() {
    document.querySelectorAll('.mdc-splash').forEach(splash => {
      const startedAt = Number(splash.dataset.startedAt || 0);
      if (!startedAt || Date.now() - startedAt >= MAX_VISIBLE_MS) releaseNode(splash);
    });
  }

  function boot() {
    ensureCartGuard();
    releaseStale();

    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.matches('.mdc-splash')) guardNode(node);
          node.querySelectorAll?.('.mdc-splash').forEach(guardNode);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.setTimeout(() => {
      releaseStale();
      observer?.disconnect();
      observer = null;
    }, MAX_VISIBLE_MS + 1200);

    window.addEventListener('pageshow', releaseStale);
    window.addEventListener('error', releaseStale, true);
    window.addEventListener('unhandledrejection', releaseStale);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') releaseStale();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
