/* MDC Ferretería — capa de datos en vivo desde el inventario del dashboard */
const API = "https://mdc-app-dun.vercel.app/api/public";

const FALLBACK_IMG = "assets/p-herramientas.png";

/* Mapa de imagen de respaldo por categoría cuando el producto no tiene foto */
const CAT_IMG = {
  "herramientas": "assets/p-herramientas.png",
  "electricidad": "assets/p-cable.png",
  "electricos": "assets/p-cable.png",
  "materiales": "assets/p-cemento.png",
  "construccion": "assets/p-cemento.png",
  "plomeria": "assets/p-llaves.png",
  "pintura": "assets/p-pintura.png",
  "ferreteria general": "assets/p-amoladora.png",
};

function catImg(catSlug, catName) {
  const s = (catSlug || catName || "").toLowerCase();
  for (const k of Object.keys(CAT_IMG)) {
    if (s.includes(k)) return CAT_IMG[k];
  }
  return FALLBACK_IMG;
}

function normalize(p) {
  return {
    id: p.id,
    nombre: p.name,
    marca: p.brand || (p.category ? p.category.name : "MDC"),
    cat: p.category ? p.category.slug : "ferreteria",
    catNombre: p.category ? p.category.name : "Ferretería general",
    precio: Math.round(p.price || 0),
    stock: p.stock || 0,
    minStock: p.minStock || 0,
    unit: p.unit || "pieza",
    img: p.imageUrl || catImg(p.category ? p.category.slug : "", p.category ? p.category.name : ""),
    desc: p.description || "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    featured: !!p.featured,
    updatedAt: p.updatedAt,
    _raw: p,
  };
}

const CLP = n => "$" + Math.round(n).toLocaleString("es-CL");

/* estado global del catálogo en vivo */
const LiveCatalog = {
  products: [],
  loaded: false,
  listeners: [],

  async load() {
    try {
      const res = await fetch(`${API}/catalog?pageSize=100`, { cache: "no-store" });
      const data = await res.json();
      this.products = (data.products || []).map(normalize);
      this.loaded = true;
    } catch (e) {
      console.error("No se pudo cargar el catálogo:", e);
      this.products = [];
      this.loaded = true;
    }
    this.listeners.forEach(fn => fn());
    return this.products;
  },

  onChange(fn) { this.listeners.push(fn); },

  /* stock en vivo por ids — devuelve mapa id -> {stock, price} */
  async refreshStock(ids) {
    try {
      const qs = ids && ids.length ? `?ids=${ids.join(",")}` : "";
      const res = await fetch(`${API}/stock${qs}`, { cache: "no-store" });
      const data = await res.json();
      let changed = false;
      for (const p of this.products) {
        const s = data.stock[p.id];
        if (s && (s.stock !== p.stock || s.price !== p.precio)) {
          p.stock = s.stock;
          p.precio = Math.round(s.price || p.precio);
          changed = true;
        }
      }
      if (changed) this.listeners.forEach(fn => fn());
      return data.stock;
    } catch { return null; }
  },

  byId(id) { return this.products.find(p => p.id === id); },
};

/* ---------- carrito (localStorage) — igual que antes ---------- */
function getCart() {
  try { return JSON.parse(localStorage.getItem("mdc-cart") || "[]"); }
  catch { return []; }
}
function saveCart(c) {
  localStorage.setItem("mdc-cart", JSON.stringify(c));
  updateCartCount();
}
function cartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }
function updateCartCount() {
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.classList.toggle("is-visible", n > 0);
  });
}
function addToCart(id, qty = 1) {
  const cart = getCart();
  const found = cart.find(i => i.id === id);
  if (found) found.qty += qty;
  else cart.push({ id, qty });
  saveCart(cart);
  toast("Agregado al carrito");
}
function setQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter(i => i.id !== id);
  else {
    const it = cart.find(i => i.id === id);
    if (it) it.qty = qty;
  }
  saveCart(cart);
}
function clearCart() { saveCart([]); }

/* ---------- render ---------- */
function stockBadge(stock, minStock) {
  if (stock <= 0) return `<span class="stock-badge stock-out">Sin stock</span>`;
  if (stock <= (minStock || 0)) return `<span class="stock-badge stock-low">¡Últimas ${stock}!</span>`;
  return `<span class="stock-badge stock-ok">Stock: ${stock}</span>`;
}

function productCard(p) {
  const a = document.createElement("a");
  a.className = "prod reveal";
  a.href = `producto.html?id=${p.id}`;
  a.innerHTML = `
    ${p.precioAntes ? `<span class="prod-badge">Oferta</span>` : ""}
    <div class="prod-img">
      <img src="${p.img}" alt="${p.nombre}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
    </div>
    <div class="prod-body">
      <p class="prod-marca">${p.marca}</p>
      <h3 class="prod-nombre">${p.nombre}</h3>
      ${stockBadge(p.stock, p.minStock)}
      <div class="prod-foot">
        <div class="prod-precio">
          <b>${CLP(p.precio)}</b>
        </div>
        ${p.stock > 0 ? `
        <button class="prod-add" aria-label="Agregar ${p.nombre} al carrito" data-add="${p.id}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </button>` : ""}
      </div>
    </div>`;
  return a;
}

function renderProducts(container, list) {
  if (!container) return;
  container.innerHTML = "";
  if (!list.length) {
    container.innerHTML = `<p class="empty-inline">No hay productos disponibles por ahora.</p>`;
    return;
  }
  list.forEach(p => container.appendChild(productCard(p)));
  container.addEventListener("click", e => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    addToCart(btn.dataset.add);
  });
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
  t.textContent = msg;
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2200);
}

updateCartCount();