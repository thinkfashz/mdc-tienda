/* MDC Ferretería · estado autoritativo del carrito sin polling pesado */
(() => {
  const CART_KEY = 'mdc-cart';
  let boundToCatalog = false;
  let attempts = 0;
  let bootTimer = 0;

  function rawCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(item => item && item.id && Number.isFinite(Number(item.qty)) && Number(item.qty) > 0)
        .map(item => ({ id: String(item.id), qty: Math.max(1, Math.floor(Number(item.qty))) }));
    } catch (_) {
      return [];
    }
  }

  function persist(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
  }

  function catalogReady() {
    try {
      return typeof LiveCatalog !== 'undefined'
        && LiveCatalog.loaded === true
        && Array.isArray(LiveCatalog.products);
    } catch (_) {
      return false;
    }
  }

  function setBadge(el, count) {
    const n = Math.max(0, Number(count) || 0);
    const visible = n > 0;
    el.textContent = visible ? String(n) : '';
    el.hidden = !visible;
    el.classList.toggle('is-visible', visible);
    el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (!visible) el.style.display = 'none';
    else el.style.removeProperty('display');
  }

  function paint(count) {
    document.querySelectorAll('[data-cart-count]').forEach(el => setBadge(el, count));
  }

  function validCart() {
    if (!catalogReady()) return [];
    const original = rawCart();
    if (!LiveCatalog.products.length) return [];

    const valid = original.filter(item => {
      try { return !!LiveCatalog.byId(item.id); } catch (_) { return false; }
    });

    if (valid.length !== original.length) persist(valid);
    return valid;
  }

  function reconcile() {
    if (!catalogReady()) {
      paint(0);
      return 0;
    }
    const valid = validCart();
    const count = valid.reduce((sum, item) => sum + item.qty, 0);
    paint(count);
    return count;
  }

  function bindCatalog() {
    if (boundToCatalog) return true;
    try {
      if (typeof LiveCatalog === 'undefined') return false;
      if (typeof LiveCatalog.onChange === 'function') LiveCatalog.onChange(reconcile);
      boundToCatalog = true;
      return true;
    } catch (_) {
      return false;
    }
  }

  function installGlobalOverrides() {
    try {
      globalThis.cartCount = () => catalogReady()
        ? validCart().reduce((sum, item) => sum + item.qty, 0)
        : 0;
      globalThis.updateCartCount = reconcile;
    } catch (_) {}
  }

  function waitForCatalog() {
    attempts += 1;
    installGlobalOverrides();

    if (bindCatalog() && catalogReady()) {
      reconcile();
      return;
    }

    paint(0);
    if (attempts < 30) bootTimer = window.setTimeout(waitForCatalog, 140);
  }

  function boot() {
    paint(0);
    installGlobalOverrides();
    waitForCatalog();

    window.addEventListener('storage', event => {
      if (event.key === CART_KEY) reconcile();
    });
    window.addEventListener('pageshow', reconcile);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reconcile();
    });
    document.addEventListener('mdc:cart-changed', reconcile);

    window.setTimeout(() => {
      if (bootTimer) clearTimeout(bootTimer);
      bindCatalog();
      reconcile();
    }, 4500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
