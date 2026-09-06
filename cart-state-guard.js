/* MDC Ferretería · estado autoritativo del carrito */
(() => {
  const CART_KEY = 'mdc-cart';
  let boundToCatalog = false;

  function rawCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(item => item && item.id && Number.isFinite(Number(item.qty)) && Number(item.qty) > 0)
        .map(item => ({
          id: String(item.id),
          qty: Math.max(1, Math.floor(Number(item.qty)))
        }));
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
    const text = visible ? String(n) : '';

    if (el.textContent !== text) el.textContent = text;
    if (el.hidden === visible) el.hidden = !visible;
    if (el.classList.contains('is-visible') !== visible) {
      el.classList.toggle('is-visible', visible);
    }
    if (el.getAttribute('aria-hidden') !== (visible ? 'false' : 'true')) {
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }
    if (!visible) {
      if (el.style.display !== 'none') el.style.display = 'none';
    } else if (el.style.display === 'none') {
      el.style.removeProperty('display');
    }
  }

  function paint(count) {
    document.querySelectorAll('[data-cart-count]').forEach(el => setBadge(el, count));
  }

  function validCart() {
    if (!catalogReady()) return [];
    const original = rawCart();
    const valid = original.filter(item => {
      try { return !!LiveCatalog.byId(item.id); } catch (_) { return false; }
    });

    const changed = valid.length !== original.length
      || valid.some((item, index) => item.id !== original[index]?.id || item.qty !== original[index]?.qty);
    if (changed) persist(valid);
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
      if (typeof LiveCatalog.onChange === 'function') {
        LiveCatalog.onChange(() => reconcile());
      }
      boundToCatalog = true;
      return true;
    } catch (_) {
      return false;
    }
  }

  function installGlobalOverrides() {
    try {
      globalThis.cartCount = () => {
        if (!catalogReady()) return 0;
        return validCart().reduce((sum, item) => sum + item.qty, 0);
      };
      globalThis.updateCartCount = () => reconcile();
    } catch (_) {}
  }

  function boot() {
    paint(0);
    installGlobalOverrides();

    const timer = window.setInterval(() => {
      if (!catalogReady()) paint(0);
      installGlobalOverrides();
      if (bindCatalog() && catalogReady()) {
        reconcile();
        window.clearInterval(timer);
      }
    }, 120);

    window.setTimeout(() => {
      window.clearInterval(timer);
      bindCatalog();
      reconcile();
    }, 12000);

    window.addEventListener('storage', event => {
      if (event.key === CART_KEY) reconcile();
    });
    window.addEventListener('pageshow', reconcile);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reconcile();
    });

    const observer = new MutationObserver(() => reconcile());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
