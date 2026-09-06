/* MDC Ferretería · watchdog independiente del splash */
(() => {
  const MAX_VISIBLE_MS = 3600;

  function release() {
    document.body?.classList.remove('mdc-splash-lock');
    document.querySelectorAll('.mdc-splash').forEach(node => {
      node.classList.add('is-exiting');
      node.style.pointerEvents = 'none';
      window.setTimeout(() => node.remove(), 180);
    });
  }

  function arm() {
    window.setTimeout(release, MAX_VISIBLE_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm, { once: true });
  else arm();

  window.addEventListener('pageshow', arm);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') arm();
  });
})();
