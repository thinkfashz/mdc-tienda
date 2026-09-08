/* MDC Ferretería · failsafe pasivo del splash */
(() => {
  const MAX_VISIBLE_MS = 1650;

  function forceRelease() {
    document.body?.classList.remove('mdc-splash-lock');
    document.querySelectorAll('.mdc-splash').forEach(node => {
      node.style.setProperty('animation', 'none', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
      node.style.setProperty('opacity', '0', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.remove();
    });
  }

  function scheduleFailsafe() {
    window.setTimeout(forceRelease, MAX_VISIBLE_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleFailsafe, { once: true });
  } else {
    scheduleFailsafe();
  }

  window.addEventListener('pageshow', () => window.setTimeout(forceRelease, MAX_VISIBLE_MS));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') window.setTimeout(forceRelease, MAX_VISIBLE_MS);
  });
})();
