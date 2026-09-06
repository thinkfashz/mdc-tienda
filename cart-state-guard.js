/* MDC Ferretería · estado autoritativo del carrito */
(() => {
  const CART_KEY = 'mdc-cart';
  let boundToCatalog = false;
  let lastPaint = null;

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

  function paint(count) {
    const n = Math.max(0, Number(count) || 0);
    const visible = n > 0;
    if (lastPaint === n && document.querySelectorAll('[data-cart-count]').length) {
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        if (!visible) {
          el.textContent = '';
          el.hidden = true;
          el.classList.remove('is-visible');
          el.setAttribute('aria-hidden', 'true');
        }
      });
      return;
    }
    lastPaint = n;

    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = visible ? String(n) : '';
      el.hidden = !visible;
      el.classList.toggle('is-visible', visible);
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (!visible) el.style.display = 'none';
      else el.style.removeProperty('display');
    });
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

  function hardHideBeforeCatalog() {
    if (catalogReady()) return;
    paint(0);
  }

  function boot() {
    paint(0);
    installGlobalOverrides();

    const timer = window.setInterval(() => {
      hardHideBeforeCatalog();
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

    window.addEventListener('pageshow', () => reconcile());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reconcile();
    });

    const observer = new MutationObserver(() => {
      if (!catalogReady()) paint(0);
      else reconcile();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
