/* MDC Ferretería · Integridad de catálogo y carrito */
(() => {
  const CART_KEY = 'mdc-cart';
  const CATALOG_CACHE_KEY = 'mdc-catalog-cache-v1';
  const SNAPSHOT_URL = 'catalog.snapshot.json';

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

  function catalogReady() {
    return typeof LiveCatalog !== 'undefined'
      && LiveCatalog.loaded
      && Array.isArray(LiveCatalog.products)
      && LiveCatalog.products.length > 0;
  }

  function validCart() {
    if (!catalogReady()) return [];
    return rawCart().filter(item => !!LiveCatalog.byId(item.id));
  }

  function persistCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
  }

  function reconcileCart({ persist = true } = {}) {
    if (!catalogReady()) {
      paintCount(0);
      return [];
    }

    const original = rawCart();
    const valid = original.filter(item => !!LiveCatalog.byId(item.id));

    if (persist && (valid.length !== original.length || valid.some((item, i) => item.id !== original[i]?.id || item.qty !== original[i]?.qty))) {
      persistCart(valid);
    }

    paintCount(valid.reduce((sum, item) => sum + item.qty, 0));
    return valid;
  }

  function paintCount(count) {
    const n = Math.max(0, Number(count) || 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      const visible = n > 0;
      el.textContent = visible ? String(n) : '';
      el.classList.toggle('is-visible', visible);
      el.hidden = !visible;
      el.style.display = visible ? '' : 'none';
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }

  function installCounterBindings() {
    globalThis.cartCount = () => validCart().reduce((sum, item) => sum + item.qty, 0);
    globalThis.updateCartCount = () => reconcileCart({ persist: true });
  }

  async function fetchCurrentSnapshot() {
    try {
      const response = await fetch(`${SNAPSHOT_URL}?integrity=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return Array.isArray(data?.products) && data.products.length ? data.products : null;
    } catch (_) {
      try {
        const response = await fetch(SNAPSHOT_URL, { cache: 'reload', headers: { Accept: 'application/json' } });
        if (!response.ok) return null;
        const data = await response.json();
        return Array.isArray(data?.products) && data.products.length ? data.products : null;
      } catch (_) {
        return null;
      }
    }
  }

  function replaceStaleCatalogCache(products) {
    try {
      localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        products
      }));
    } catch (_) {}
  }

  async function preferDeployedCatalog() {
    if (typeof LiveCatalog === 'undefined') return;

    try {
      if (!LiveCatalog.loaded && typeof LiveCatalog.load === 'function') await LiveCatalog.load();
    } catch (_) {}

    // Si la API real está conectada, esa es la fuente autoritativa.
    if (LiveCatalog.source === 'network' && catalogReady()) {
      reconcileCart({ persist: true });
      return;
    }

    // Si la API está caída, el snapshot incluido en ESTE deploy es más confiable
    // que un catálogo arbitrariamente viejo guardado en localStorage.
    const snapshotProducts = await fetchCurrentSnapshot();
    if (snapshotProducts && typeof LiveCatalog._setProducts === 'function') {
      replaceStaleCatalogCache(snapshotProducts);
      LiveCatalog._setProducts(snapshotProducts, 'snapshot');
    }

    reconcileCart({ persist: true });

    // Fuerza a pantallas ya renderizadas (carrito) a reflejar la limpieza inmediatamente.
    try {
      if (typeof renderCart === 'function') renderCart();
    } catch (_) {}
  }

  function bind() {
    paintCount(0);
    installCounterBindings();

    if (typeof LiveCatalog !== 'undefined' && typeof LiveCatalog.onChange === 'function') {
      LiveCatalog.onChange(() => reconcileCart({ persist: true }));
    }

    window.addEventListener('storage', event => {
      if (event.key === CART_KEY) reconcileCart({ persist: true });
    });

    preferDeployedCatalog();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();