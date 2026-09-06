/* MDC Ferretería · Marketplace Experience
   Capa progresiva para Home, Catálogo y Producto.
   No reemplaza la lógica de inventario: la complementa. */
(() => {
  const FAVORITES_KEY = 'mdc-favorites-v1';
  const RECENTS_KEY = 'mdc-recents-v1';
  const MAX_RECENTS = 10;
  const WA = '56920688075';
  const MEDIA = {
    logo: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685244/mdc-premium-logo.png',
    truck: 'https://res.cloudinary.com/disghf6xc/image/upload/v1788685315/mdc-truck.png'
  };

  const icons = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.7 6.8-4M8.6 13.3l6.8 4"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8-2.2-2.2a4 4 0 0 0 5 5l-8.5 8.5a2.1 2.1 0 0 0 3 3l8.5-8.5a4 4 0 0 0 5-5l-2.2 2.2-2.8-2.8z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-9 12h8l-1 8 9-12h-8z"/></svg>',
    build: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>',
    paint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2 3 13l8 8L22 10 14 2Z"/><path d="m7 13 4 4M14 6l4 4"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l2-6h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></svg>',
    delivery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.4-4.2A8 8 0 1 1 21 15Z"/></svg>'
  };

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const currentFile = () => location.pathname.split('/').pop() || 'index.html';
  const isHome = () => currentFile() === 'index.html' || location.pathname === '/';

  function safeRead(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* no-op */ }
  }

  function favorites() {
    const list = safeRead(FAVORITES_KEY, []);
    return Array.isArray(list) ? list.map(String) : [];
  }

  function isFavorite(id) {
    return favorites().includes(String(id));
  }

  function toggleFavorite(id) {
    const key = String(id || '');
    if (!key) return false;
    const set = new Set(favorites());
    const next = !set.has(key);
    if (next) set.add(key); else set.delete(key);
    safeWrite(FAVORITES_KEY, [...set]);
    refreshFavoriteUI();
    document.dispatchEvent(new CustomEvent('mdc:favorites-changed', { detail: { id: key, favorite: next } }));
    if (typeof toast === 'function') toast(next ? 'Guardado en favoritos' : 'Eliminado de favoritos');
    return next;
  }

  function addRecent(id) {
    const key = String(id || '');
    if (!key) return;
    const list = safeRead(RECENTS_KEY, []);
    const normalized = Array.isArray(list) ? list.map(String).filter(Boolean) : [];
    const next = [key, ...normalized.filter(x => x !== key)].slice(0, MAX_RECENTS);
    safeWrite(RECENTS_KEY, next);
  }

  function getRecentProducts() {
    if (typeof LiveCatalog === 'undefined') return [];
    const ids = safeRead(RECENTS_KEY, []);
    if (!Array.isArray(ids)) return [];
    return ids.map(id => LiveCatalog.byId(id)).filter(Boolean);
  }

  function discountFor(p) {
    if (!p || !p.precioAntes || p.precioAntes <= p.precio || p.precioAntes <= 0) return 0;
    return Math.max(1, Math.round((1 - p.precio / p.precioAntes) * 100));
  }

  function productIdFromCard(card) {
    try {
      const href = card.getAttribute('href') || '';
      const url = new URL(href, location.href);
      return url.searchParams.get('id') || '';
    } catch (_) {
      return '';
    }
  }

  function decorateProductCards(root = document) {
    root.querySelectorAll?.('.prod').forEach(card => {
      if (card.dataset.marketDecorated === '1') {
        const id = productIdFromCard(card);
        const fav = card.querySelector('[data-market-fav]');
        if (fav) fav.classList.toggle('is-favorite', isFavorite(id));
        return;
      }

      const id = productIdFromCard(card);
      if (!id) return;
      card.dataset.marketDecorated = '1';
      const media = card.querySelector('.prod-img');
      if (!media) return;

      const fav = document.createElement('button');
      fav.type = 'button';
      fav.className = 'market-fav-btn';
      fav.dataset.marketFav = id;
      fav.setAttribute('aria-label', 'Guardar producto en favoritos');
      fav.innerHTML = icons.heart;
      fav.classList.toggle('is-favorite', isFavorite(id));
      media.appendChild(fav);

      const p = typeof LiveCatalog !== 'undefined' ? LiveCatalog.byId(id) : null;
      const discount = discountFor(p);
      if (discount && !media.querySelector('.market-discount')) {
        const badge = document.createElement('span');
        badge.className = 'market-discount';
        badge.textContent = `-${discount}%`;
        media.appendChild(badge);
      }

      if (p?.precioAntes && p.precioAntes > p.precio) {
        const price = card.querySelector('.prod-precio');
        if (price && !price.querySelector('.market-old-price')) {
          const old = document.createElement('span');
          old.className = 'market-old-price';
          old.textContent = typeof CLP === 'function' ? CLP(p.precioAntes) : `$${p.precioAntes}`;
          price.prepend(old);
        }
      }
    });
  }

  function refreshFavoriteUI() {
    document.querySelectorAll('[data-market-fav]').forEach(btn => {
      btn.classList.toggle('is-favorite', isFavorite(btn.dataset.marketFav));
      btn.setAttribute('aria-pressed', isFavorite(btn.dataset.marketFav) ? 'true' : 'false');
    });
  }

  function categoryIcon(slug) {
    const s = String(slug || '').toLowerCase();
    if (s.includes('elect')) return icons.bolt;
    if (s.includes('constru')) return icons.build;
    if (s.includes('pint') || s.includes('ferreteria')) return icons.paint;
    return icons.tool;
  }

  function categoryList() {
    if (typeof LiveCatalog === 'undefined') return [];
    const map = new Map();
    LiveCatalog.products.forEach(p => {
      if (p.cat && !map.has(p.cat)) map.set(p.cat, p.catNombre || p.cat);
    });
    return [...map.entries()].slice(0, 8);
  }

  function makeRailCard(p) {
    const a = document.createElement('a');
    a.className = 'market-rail-card';
    a.href = `producto.html?id=${encodeURIComponent(p.id)}`;
    const discount = discountFor(p);
    a.innerHTML = `
      <div class="market-rail-media">
        <img src="${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.src='assets/p-herramientas.png'">
        ${discount ? `<span class="market-rail-discount">-${discount}%</span>` : ''}
      </div>
      <div class="market-rail-copy">
        <span>${esc(p.marca || p.catNombre || 'MDC')}</span>
        <b>${esc(p.nombre)}</b>
        <strong>${typeof CLP === 'function' ? CLP(p.precio) : `$${p.precio}`}</strong>
      </div>`;
    return a;
  }

  function renderHomeMarketplace() {
    if (!isHome() || typeof LiveCatalog === 'undefined' || !LiveCatalog.loaded) return;

    let shell = document.querySelector('.market-home-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'market-home-shell';
      const hero = document.querySelector('.hero');
      (hero || document.querySelector('.nav'))?.insertAdjacentElement('afterend', shell);
    }

    const cats = categoryList();
    const offers = LiveCatalog.products
      .filter(p => discountFor(p) > 0)
      .sort((a, b) => discountFor(b) - discountFor(a))
      .slice(0, 8);
    const picks = LiveCatalog.products.filter(p => p.featured).slice(0, 8);
    const recommended = (offers.length ? offers : (picks.length ? picks : LiveCatalog.products.slice(0, 8)));
    const recents = getRecentProducts().slice(0, 8);

    shell.innerHTML = `
      <section class="market-status-card" aria-label="Estado de atención">
        <div class="market-status-logo"><img src="${MEDIA.logo}" alt="MDC"></div>
        <div class="market-status-copy">
          <span><i></i> Atención en Linares</span>
          <b>Compra rápido. Coordina retiro o despacho.</b>
        </div>
        <a href="https://wa.me/${WA}?text=${encodeURIComponent('Hola MDC, necesito ayuda con una compra')}" target="_blank" rel="noopener" aria-label="Hablar por WhatsApp">${icons.chevron}</a>
      </section>

      <section class="market-block market-category-block">
        <div class="market-block-head">
          <div><span>Categorías</span><h2>Encuentra lo que necesitas</h2></div>
          <a href="catalogo.html">Ver todo</a>
        </div>
        <div class="market-category-rail">
          ${cats.map(([slug, name]) => `
            <a class="market-category-pill" href="catalogo.html?cat=${encodeURIComponent(slug)}">
              <span>${categoryIcon(slug)}</span><b>${esc(name)}</b>
            </a>`).join('')}
        </div>
      </section>

      <section class="market-delivery-card">
        <div class="market-delivery-copy">
          <span>Despacho coordinado</span>
          <h2>Tu compra, lista para seguir avanzando.</h2>
          <p>Confirma disponibilidad, retiro o despacho directamente con MDC.</p>
          <a href="catalogo.html">Explorar catálogo ${icons.chevron}</a>
        </div>
        <img src="${MEDIA.truck}" alt="Camión de reparto MDC" loading="lazy">
      </section>

      <section class="market-block market-recommendations">
        <div class="market-block-head">
          <div><span>${offers.length ? 'Ofertas' : 'Selección MDC'}</span><h2>${offers.length ? 'Precios que conviene mirar' : 'Recomendados para tu proyecto'}</h2></div>
          <a href="catalogo.html">Ver catálogo</a>
        </div>
        <div class="market-product-rail" data-market-recommended></div>
      </section>

      <section class="market-block market-recents" ${recents.length ? '' : 'hidden'}>
        <div class="market-block-head">
          <div><span>Historial</span><h2>Vistos recientemente</h2></div>
        </div>
        <div class="market-product-rail" data-market-recents></div>
      </section>`;

    const recommendedRail = shell.querySelector('[data-market-recommended]');
    recommended.forEach(p => recommendedRail?.appendChild(makeRailCard(p)));
    const recentRail = shell.querySelector('[data-market-recents]');
    recents.forEach(p => recentRail?.appendChild(makeRailCard(p)));
  }

  function injectHeroAppStatus() {
    if (!isHome()) return;
    const inner = document.querySelector('.hero-inner');
    if (!inner || inner.querySelector('.market-hero-status')) return;
    const status = document.createElement('div');
    status.className = 'market-hero-status';
    status.innerHTML = `
      <span>${icons.store}<b>Retiro en tienda</b></span>
      <span>${icons.delivery}<b>Despacho coordinado</b></span>`;
    inner.appendChild(status);
  }

  function decoratePdp() {
    if (currentFile() !== 'producto.html' || typeof LiveCatalog === 'undefined') return;
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return;
    const product = LiveCatalog.byId(id);
    const grid = document.querySelector('.pdp-grid');
    if (!product || !grid) return;

    addRecent(product.id);

    const media = grid.querySelector('.pdp-media');
    if (media && !media.querySelector('.market-pdp-actions')) {
      const actions = document.createElement('div');
      actions.className = 'market-pdp-actions';
      actions.innerHTML = `
        <button type="button" class="market-circle-action" data-market-fav="${esc(product.id)}" aria-label="Guardar en favoritos">${icons.heart}</button>
        <button type="button" class="market-circle-action" data-market-share aria-label="Compartir producto">${icons.share}</button>`;
      media.appendChild(actions);
    }

    const info = grid.querySelector('.pdp-info');
    if (info && !info.querySelector('.market-seller-card')) {
      const seller = document.createElement('section');
      seller.className = 'market-seller-card';
      seller.innerHTML = `
        <div class="market-seller-title"><img src="${MEDIA.logo}" alt="MDC"><div><span>Vendido por</span><b>MDC Ferretería · Linares</b></div></div>
        <div class="market-seller-features">
          <span>${icons.store}<b>Retiro</b><small>Sujeto a confirmación</small></span>
          <span>${icons.delivery}<b>Despacho</b><small>Linares y alrededores</small></span>
          <span>${icons.message}<b>Asesoría</b><small>Compra asistida</small></span>
        </div>`;
      const perks = info.querySelector('.pdp-perks');
      if (perks) perks.replaceWith(seller); else info.appendChild(seller);
    }

    if (!document.querySelector('.market-pdp-sticky')) {
      const bar = document.createElement('div');
      bar.className = 'market-pdp-sticky';
      const canOrder = product.stock == null || product.stock > 0;
      bar.innerHTML = `
        <div><span>${product.stock == null ? 'Stock por confirmar' : product.stock > 0 ? 'Disponible' : 'Sin stock'}</span><b>${typeof CLP === 'function' ? CLP(product.precio) : `$${product.precio}`}</b></div>
        <button type="button" ${canOrder ? '' : 'disabled'} data-market-add-sticky>${canOrder ? 'Agregar al carrito' : 'Consultar'}</button>`;
      document.body.appendChild(bar);
    } else {
      const bar = document.querySelector('.market-pdp-sticky');
      const canOrder = product.stock == null || product.stock > 0;
      const price = bar.querySelector('b');
      const status = bar.querySelector('span');
      const btn = bar.querySelector('[data-market-add-sticky]');
      if (price) price.textContent = typeof CLP === 'function' ? CLP(product.precio) : `$${product.precio}`;
      if (status) status.textContent = product.stock == null ? 'Stock por confirmar' : product.stock > 0 ? 'Disponible' : 'Sin stock';
      if (btn) {
        btn.disabled = !canOrder;
        btn.textContent = canOrder ? 'Agregar al carrito' : 'Consultar';
      }
    }

    refreshFavoriteUI();
  }

  async function shareCurrentProduct() {
    const product = typeof LiveCatalog !== 'undefined'
      ? LiveCatalog.byId(new URLSearchParams(location.search).get('id'))
      : null;
    const data = {
      title: product?.nombre || document.title,
      text: product ? `${product.nombre} en MDC Ferretería` : 'MDC Ferretería',
      url: location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(location.href);
        if (typeof toast === 'function') toast('Enlace copiado');
      }
    } catch (_) { /* cancelación del usuario */ }
  }

  function bindGlobalEvents() {
    document.addEventListener('click', event => {
      const fav = event.target.closest('[data-market-fav]');
      if (fav) {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(fav.dataset.marketFav);
        return;
      }

      const share = event.target.closest('[data-market-share]');
      if (share) {
        event.preventDefault();
        shareCurrentProduct();
        return;
      }

      const sticky = event.target.closest('[data-market-add-sticky]');
      if (sticky) {
        event.preventDefault();
        const existing = document.getElementById('add-btn');
        if (existing) existing.click();
        else {
          const id = new URLSearchParams(location.search).get('id');
          if (id && typeof addToCart === 'function') addToCart(id, 1);
        }
      }
    });
  }

  function observeDynamicUI() {
    const observer = new MutationObserver(mutations => {
      let relevant = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes?.length) { relevant = true; break; }
      }
      if (!relevant) return;
      decorateProductCards(document);
      decoratePdp();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function catalogEnhancements() {
    if (currentFile() !== 'catalogo.html') return;
    const head = document.querySelector('.catalog-head');
    if (!head || document.querySelector('.market-catalog-intro')) return;
    const intro = document.createElement('div');
    intro.className = 'market-catalog-intro';
    intro.innerHTML = `
      <span>${icons.store}<b>Retiro coordinado</b></span>
      <span>${icons.delivery}<b>Despacho local</b></span>
      <span>${icons.message}<b>Asesoría MDC</b></span>`;
    head.appendChild(intro);
  }

  function runWhenCatalogReady() {
    if (typeof LiveCatalog === 'undefined') return;
    const render = () => {
      decorateProductCards(document);
      renderHomeMarketplace();
      decoratePdp();
      catalogEnhancements();
    };

    if (LiveCatalog.loaded) render();
    LiveCatalog.onChange(render);
    if (!LiveCatalog.loaded) LiveCatalog.load().catch(() => null);
  }

  function boot() {
    bindGlobalEvents();
    observeDynamicUI();
    injectHeroAppStatus();
    catalogEnhancements();
    runWhenCatalogReady();
    window.addEventListener('storage', event => {
      if (event.key === FAVORITES_KEY) refreshFavoriteUI();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();