/* MDC Ferretería — catálogo resiliente para producción */
const API = "https://mdc-app-dun.vercel.app/api/public";
const CATALOG_SNAPSHOT = "catalog.snapshot.json";
const CATALOG_CACHE_KEY = "mdc-catalog-cache-v1";
const CATALOG_TIMEOUT_MS = 7000;

const FALLBACK_IMG = "assets/p-herramientas.png";

const CAT_IMG = {
  herramientas: "assets/p-herramientas.png",
  electricidad: "assets/p-cable.png",
  electricos: "assets/p-cable.png",
  materiales: "assets/p-cemento.png",
  construccion: "assets/p-cemento.png",
  plomeria: "assets/p-llaves.png",
  pintura: "assets/p-pintura.png",
  "ferreteria general": "assets/p-amoladora.png",
};

function catImg(catSlug, catName) {
  const s = String(catSlug || catName || "").toLowerCase();
  for (const k of Object.keys(CAT_IMG)) {
    if (s.includes(k)) return CAT_IMG[k];
  }
  return FALLBACK_IMG;
}

function normalizeImage(value, catSlug, catName) {
  const img = String(value || "").trim();
  if (!img) return catImg(catSlug, catName);
  if (/^(https?:\/\/|\/|\.\/|\.\.\/|assets\/|productos\/)/i.test(img)) return img;
  return catImg(catSlug, catName);
}

function finiteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalize(input) {
  const p = input && typeof input === "object" ? input : {};
  const category = p.category && typeof p.category === "object" ? p.category : null;
  const catSlug = category && category.slug ? String(category.slug) : String(p.cat || "ferreteria");
  const catName = category && category.name ? String(category.name) : String(p.catNombre || "Ferretería general");
  const rawStock = p.stock;
  const rawMinStock = p.minStock;

  /*
   * El slug es la identidad pública estable del producto.
   * backendId conserva el ID real de Prisma para sincronización/checkout.
   * Así el carrito no depende de CUIDs que pueden cambiar entre importaciones.
   */
  const stableId = String(p.slug || p.id || p.sku || "");
  const backendId = String(p.id || stableId);

  return {
    id: stableId,
    backendId,
    slug: String(p.slug || stableId),
    nombre: String(p.name || p.nombre || "Producto MDC"),
    marca: String(p.brand || p.marca || catName || "MDC"),
    cat: catSlug,
    catNombre: catName,
    precio: Math.max(0, Math.round(finiteNumber(p.price ?? p.precio, 0))),
    precioAntes: p.compareAtPrice != null || p.precioAntes != null
      ? Math.max(0, Math.round(finiteNumber(p.compareAtPrice ?? p.precioAntes, 0)))
      : null,
    stock: rawStock == null ? null : Math.max(0, Math.floor(finiteNumber(rawStock, 0))),
    minStock: rawMinStock == null ? null : Math.max(0, Math.floor(finiteNumber(rawMinStock, 0))),
    unit: String(p.unit || "pieza"),
    img: normalizeImage(p.imageUrl || p.img, catSlug, catName),
    desc: String(p.description || p.desc || ""),
    sku: String(p.sku || ""),
    barcode: String(p.barcode || ""),
    featured: !!p.featured,
    updatedAt: p.updatedAt || null,
    _raw: p,
  };
}

const CLP = n => "$" + Math.round(finiteNumber(n, 0)).toLocaleString("es-CL");

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHTML(value).replaceAll("`", "&#096;");
}

async function fetchJson(url, timeoutMs = CATALOG_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }

    if (!res.ok) {
      const error = new Error((data && data.error) || `HTTP ${res.status}`);
      error.status = res.status;
      error.code = data && data.code ? data.code : null;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}

function readCatalogCache() {
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.products) || !parsed.products.length) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function writeCatalogCache(products) {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      products,
    }));
  } catch (_) {
    /* la tienda sigue operativa aunque localStorage esté bloqueado */
  }
}

function updateCatalogModeUI(source) {
  const live = source === "network";
  document.documentElement.dataset.catalogSource = source || "unavailable";

  document.querySelectorAll(".live-dot").forEach(dot => {
    dot.title = live
      ? "Inventario conectado en vivo"
      : "Modo respaldo: stock final se confirma al realizar el pedido";
    if (live) {
      dot.style.removeProperty("background");
      dot.style.removeProperty("animation");
    } else {
      dot.style.background = "#facc15";
      dot.style.animation = "none";
    }
  });
}

const LiveCatalog = {
  products: [],
  loaded: false,
  loading: null,
  listeners: [],
  source: "init",
  isLive: false,
  lastSyncAt: null,
  error: null,

  _notify() {
    this.listeners.forEach(fn => {
      try { fn(this); } catch (err) { console.error("Catalog listener error:", err); }
    });
  },

  _setProducts(rawProducts, source) {
    const normalized = (rawProducts || [])
      .map(normalize)
      .filter(p => p.id && p.nombre && p.precio >= 0);

    this.products = normalized;
    this.source = source;
    this.isLive = source === "network";
    this.lastSyncAt = new Date().toISOString();
    this.loaded = true;
    updateCatalogModeUI(source);
    this._notify();
    return normalized;
  },

  async load({ force = false } = {}) {
    if (this.loaded && !force) return this.products;
    if (this.loading && !force) return this.loading;

    this.loading = (async () => {
      this.error = null;

      try {
        const data = await fetchJson(`${API}/catalog?pageSize=100`);
        if (!data || !Array.isArray(data.products)) {
          throw new Error("Respuesta de catálogo inválida");
        }

        writeCatalogCache(data.products);
        return this._setProducts(data.products, "network");
      } catch (err) {
        this.error = err;
        console.warn("Catálogo en vivo no disponible. Activando recuperación:", err);
      }

      const cached = readCatalogCache();
      if (cached && cached.products.length) {
        return this._setProducts(cached.products, "cache");
      }

      try {
        const snapshot = await fetchJson(`${CATALOG_SNAPSHOT}?v=1`, 4000);
        if (!snapshot || !Array.isArray(snapshot.products) || !snapshot.products.length) {
          throw new Error("Snapshot de catálogo inválido");
        }
        return this._setProducts(snapshot.products, "snapshot");
      } catch (snapshotError) {
        console.error("No se pudo cargar el snapshot del catálogo:", snapshotError);
        this.error = snapshotError;
        return this._setProducts([], "unavailable");
      }
    })();

    try {
      return await this.loading;
    } finally {
      this.loading = null;
    }
  },

  onChange(fn) {
    if (typeof fn === "function" && !this.listeners.includes(fn)) this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== fn);
    };
  },

  async refreshStock(ids) {
    if (!this.isLive || !Array.isArray(ids) || !ids.length) return null;

    try {
      const requestedProducts = ids
        .map(id => this.byId(id))
        .filter(Boolean);
      const backendIds = [...new Set(requestedProducts.map(p => p.backendId || p.id).filter(Boolean))];
      if (!backendIds.length) return null;

      const qs = `?ids=${encodeURIComponent(backendIds.join(","))}`;
      const data = await fetchJson(`${API}/stock${qs}`, 5000);
      if (!data || !data.stock) return null;

      let changed = false;
      for (const p of this.products) {
        const s = data.stock[p.backendId] || data.stock[p.id];
        if (!s) continue;

        const nextStock = s.stock == null ? p.stock : Math.max(0, Math.floor(finiteNumber(s.stock, 0)));
        const nextPrice = s.price == null ? p.precio : Math.max(0, Math.round(finiteNumber(s.price, p.precio)));

        if (nextStock !== p.stock || nextPrice !== p.precio) {
          p.stock = nextStock;
          p.precio = nextPrice;
          changed = true;
        }
      }

      this.lastSyncAt = new Date().toISOString();
      if (changed) this._notify();
      return data.stock;
    } catch (err) {
      console.warn("No se pudo refrescar stock; se conserva el último estado conocido.", err);
      return null;
    }
  },

  byId(id) {
    const key = String(id);
    return this.products.find(p => p.id === key || p.backendId === key || p.slug === key || (p.sku && p.sku === key));
  },
};

/* ---------- carrito persistente ---------- */
function getCart() {
  try {
    const value = JSON.parse(localStorage.getItem("mdc-cart") || "[]");
    return Array.isArray(value)
      ? value.filter(i => i && i.id && Number.isFinite(Number(i.qty)) && Number(i.qty) > 0)
          .map(i => ({ id: String(i.id), qty: Math.max(1, Math.floor(Number(i.qty))) }))
      : [];
  } catch (_) {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem("mdc-cart", JSON.stringify(cart));
  } catch (_) {
    /* checkout por WhatsApp permanece disponible */
  }
  updateCartCount();
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.classList.toggle("is-visible", n > 0);
  });
}

function addToCart(id, qty = 1) {
  const product = LiveCatalog.byId(id);
  if (!product) {
    toast("Producto no disponible");
    return false;
  }
  if (product.stock === 0) {
    toast("Producto sin stock");
    return false;
  }

  const safeQty = Math.max(1, Math.floor(finiteNumber(qty, 1)));
  const cart = getCart();
  const stableId = product.id;
  const found = cart.find(i => i.id === stableId || i.id === product.backendId);
  const currentQty = found ? found.qty : 0;
  const maxQty = product.stock == null ? 99 : product.stock;
  const nextQty = Math.min(maxQty, currentQty + safeQty);

  if (found) {
    found.id = stableId;
    found.qty = nextQty;
  } else {
    cart.push({ id: stableId, qty: nextQty });
  }

  saveCart(cart);
  toast(product.stock == null ? "Agregado · stock por confirmar" : "Agregado al carrito");
  return true;
}

function setQty(id, qty) {
  const product = LiveCatalog.byId(id);
  let cart = getCart();
  const safeQty = Math.floor(finiteNumber(qty, 0));
  const candidateIds = product ? [product.id, product.backendId] : [String(id)];

  if (safeQty <= 0 || (product && product.stock === 0)) {
    cart = cart.filter(i => !candidateIds.includes(i.id));
  } else {
    const item = cart.find(i => candidateIds.includes(i.id));
    if (item) {
      const maxQty = product && product.stock != null ? product.stock : 99;
      item.id = product ? product.id : item.id;
      item.qty = Math.min(maxQty, safeQty);
    }
  }

  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

/* ---------- render ---------- */
function stockBadge(stock, minStock) {
  if (stock == null) return `<span class="stock-badge stock-low">Stock por confirmar</span>`;
  if (stock <= 0) return `<span class="stock-badge stock-out">Sin stock</span>`;
  if (minStock != null && stock <= minStock) return `<span class="stock-badge stock-low">¡Últimas ${stock}!</span>`;
  return `<span class="stock-badge stock-ok">Stock: ${stock}</span>`;
}

function productCard(p) {
  const a = document.createElement("a");
  const canOrder = p.stock == null || p.stock > 0;
  a.className = "prod reveal";
  a.href = `producto.html?id=${encodeURIComponent(p.id)}`;
  a.innerHTML = `
    ${p.precioAntes && p.precioAntes > p.precio ? `<span class="prod-badge">Oferta</span>` : ""}
    <div class="prod-img">
      <img src="${escapeAttr(p.img)}" alt="${escapeAttr(p.nombre)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
    </div>
    <div class="prod-body">
      <p class="prod-marca">${escapeHTML(p.marca)}</p>
      <h3 class="prod-nombre">${escapeHTML(p.nombre)}</h3>
      ${stockBadge(p.stock, p.minStock)}
      <div class="prod-foot">
        <div class="prod-precio"><b>${CLP(p.precio)}</b></div>
        ${canOrder ? `
        <button class="prod-add" aria-label="Agregar ${escapeAttr(p.nombre)} al carrito" data-add="${escapeAttr(p.id)}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>` : ""}
      </div>
    </div>`;
  return a;
}

function renderProducts(container, list) {
  if (!container) return;
  container.innerHTML = "";

  if (!Array.isArray(list) || !list.length) {
    container.innerHTML = `<p class="empty-inline">No hay productos disponibles por ahora.</p>`;
    return;
  }

  list.forEach(p => container.appendChild(productCard(p)));

  if (!container.dataset.catalogEventsBound) {
    container.addEventListener("click", event => {
      const btn = event.target.closest("[data-add]");
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      addToCart(btn.dataset.add);
    });
    container.dataset.catalogEventsBound = "1";
  }

  updateCartCount();
}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = String(msg || "");
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2200);
}

updateCartCount();

/* ---------- capa visual premium + app shell ---------- */
(() => {
  if (!document.querySelector('link[data-mdc-premium]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'premium-mobile.css?v=3';
    css.dataset.mdcPremium = '1';
    document.head.appendChild(css);
  }

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = 'manifest.webmanifest?v=2';
    document.head.appendChild(manifest);
  }

  if (!document.querySelector('script[data-mdc-mobile-shell]')) {
    const shell = document.createElement('script');
    shell.src = 'mobile-shell.js?v=3';
    shell.async = true;
    shell.dataset.mdcMobileShell = '1';
    document.head.appendChild(shell);
  }
})();
