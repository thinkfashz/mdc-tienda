/* MDC Ferretería · Mobile App Shell */
(() => {
  const MOBILE_MAX = 820;
  const WA = "56920688075";

  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.3 1.2Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5-5l2.2 2.2-2.8 2.8-2.2-2.2a4 4 0 0 0 5 5l-8.5 8.5a2.1 2.1 0 0 0 3 3l8.5-8.5a4 4 0 0 0 5-5l-2.2 2.2-2.8-2.8z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-9 12h8l-1 8 9-12h-8z"/></svg>',
    build: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 9h.01M12 9h.01M16 9h.01"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 2 2.3z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  function currentFile() {
    const file = location.pathname.split("/").pop() || "index.html";
    return file || "index.html";
  }

  function isHome() {
    return currentFile() === "index.html" || location.pathname === "/";
  }

  function injectBottomNav() {
    if (document.querySelector(".app-bottom-nav")) return;

    const file = currentFile();
    const active = file === "catalogo.html" || file === "producto.html"
      ? "catalog"
      : file === "carrito.html" || file === "checkout.html"
        ? "cart"
        : "home";

    const nav = document.createElement("nav");
    nav.className = "app-bottom-nav";
    nav.setAttribute("aria-label", "Navegación principal móvil");
    nav.innerHTML = `
      <a class="app-nav-item ${active === "home" ? "is-active" : ""}" href="index.html" aria-label="Inicio">
        ${icons.home}<span>Inicio</span>
      </a>
      <a class="app-nav-item ${active === "catalog" ? "is-active" : ""}" href="catalogo.html" aria-label="Catálogo">
        ${icons.catalog}<span>Catálogo</span>
      </a>
      <a class="app-nav-item ${active === "cart" ? "is-active" : ""}" href="carrito.html" aria-label="Carrito">
        ${icons.cart}<span>Carrito</span><span class="app-nav-cart-count" data-cart-count>0</span>
      </a>
      <a class="app-nav-item" href="https://wa.me/${WA}?text=${encodeURIComponent("Hola MDC, necesito ayuda con una compra")}" target="_blank" rel="noopener" aria-label="WhatsApp">
        ${icons.wa}<span>WhatsApp</span>
      </a>`;

    document.body.appendChild(nav);
    if (typeof updateCartCount === "function") updateCartCount();
  }

  function searchFormMarkup(value = "") {
    return `
      <form class="mobile-search-form" action="catalogo.html" method="get" role="search">
        ${icons.search}
        <input name="q" type="search" autocomplete="off" inputmode="search" value="${String(value).replaceAll('"', '&quot;')}" placeholder="Buscar taladro, cable, cemento..." aria-label="Buscar productos">
        <button class="mobile-search-submit" type="submit" aria-label="Buscar">${icons.arrow}</button>
      </form>`;
  }

  function injectHomeTools() {
    if (!isHome() || document.querySelector(".mobile-app-tools")) return;
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const tools = document.createElement("section");
    tools.className = "mobile-app-tools";
    tools.setAttribute("aria-label", "Accesos rápidos");
    tools.innerHTML = `
      ${searchFormMarkup()}
      <div class="mobile-quick-grid">
        <a class="mobile-quick-link" href="catalogo.html?cat=herramientas">${icons.tool}<span>Herramientas</span></a>
        <a class="mobile-quick-link" href="catalogo.html?cat=electricos">${icons.bolt}<span>Eléctricos</span></a>
        <a class="mobile-quick-link" href="catalogo.html?cat=construccion">${icons.build}<span>Construcción</span></a>
        <a class="mobile-quick-link" href="https://wa.me/${WA}?text=${encodeURIComponent("Hola MDC, quiero cotizar materiales")}" target="_blank" rel="noopener">${icons.phone}<span>Cotizar</span></a>
      </div>`;

    hero.insertAdjacentElement("afterend", tools);
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function applyCatalogSearch(query) {
    const q = normalizeText(query);
    const grid = document.getElementById("catalog-grid");
    if (!grid || typeof LiveCatalog === "undefined" || typeof renderProducts !== "function" || !LiveCatalog.loaded) return;

    if (!q) return;

    const list = LiveCatalog.products.filter(p => {
      const haystack = normalizeText([
        p.nombre,
        p.marca,
        p.catNombre,
        p.sku,
        p.barcode,
        p.desc,
      ].join(" "));
      return haystack.includes(q);
    });

    renderProducts(grid, list);
    const pager = document.getElementById("pager");
    if (pager) pager.hidden = true;
    const empty = document.getElementById("catalog-empty");
    if (empty) empty.hidden = list.length > 0;
  }

  function injectCatalogSearch() {
    if (currentFile() !== "catalogo.html" || document.querySelector(".mobile-catalog-search")) return;
    const head = document.querySelector(".catalog-head");
    if (!head) return;

    const params = new URLSearchParams(location.search);
    const initialQ = params.get("q") || "";
    const wrap = document.createElement("div");
    wrap.className = "mobile-catalog-search";
    wrap.innerHTML = searchFormMarkup(initialQ);
    head.insertAdjacentElement("afterend", wrap);

    const form = wrap.querySelector("form");
    const input = wrap.querySelector("input");

    form.addEventListener("submit", event => {
      const q = input.value.trim();
      if (!q) return;
      event.preventDefault();
      const next = new URL(location.href);
      next.searchParams.set("q", q);
      history.replaceState(null, "", next.pathname + next.search);
      applyCatalogSearch(q);
      input.blur();
    });

    let timer = null;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = input.value.trim();
        if (q) {
          applyCatalogSearch(q);
        } else {
          const next = new URL(location.href);
          next.searchParams.delete("q");
          history.replaceState(null, "", next.pathname + next.search);
          location.reload();
        }
      }, 220);
    });

    const run = () => {
      if (initialQ) applyCatalogSearch(initialQ);
    };

    if (typeof LiveCatalog !== "undefined") {
      if (LiveCatalog.loaded) run();
      else {
        const stop = LiveCatalog.onChange(() => {
          run();
          if (initialQ && LiveCatalog.loaded) stop();
        });
      }
      LiveCatalog.onChange(() => {
        const q = input.value.trim();
        if (q) applyCatalogSearch(q);
      });
    }
  }

  function injectCatalogSearchStyle() {
    if (document.getElementById("mobile-catalog-search-style")) return;
    const style = document.createElement("style");
    style.id = "mobile-catalog-search-style";
    style.textContent = `
      .mobile-catalog-search{display:none}
      @media(max-width:${MOBILE_MAX}px){
        .mobile-catalog-search{display:block;margin:0 0 14px}
      }`;
    document.head.appendChild(style);
  }

  let deferredInstallPrompt = null;

  function injectInstallBanner() {
    if (document.querySelector(".mobile-install-banner")) return;
    const banner = document.createElement("div");
    banner.className = "mobile-install-banner";
    banner.innerHTML = `
      <img src="assets/logo-claro.png" alt="MDC">
      <div class="mobile-install-copy"><b>Instalar MDC</b><span>Acceso rápido como una app</span></div>
      <div class="mobile-install-actions">
        <button type="button" data-install-dismiss>Ahora no</button>
        <button type="button" class="install-primary" data-install-app>Instalar</button>
      </div>`;
    document.body.appendChild(banner);

    banner.querySelector("[data-install-dismiss]").addEventListener("click", () => {
      banner.classList.remove("is-visible");
      sessionStorage.setItem("mdc-install-dismissed", "1");
    });

    banner.querySelector("[data-install-app]").addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      banner.classList.remove("is-visible");
    });
  }

  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      if (sessionStorage.getItem("mdc-install-dismissed") === "1") return;
      const banner = document.querySelector(".mobile-install-banner");
      if (banner && window.innerWidth <= MOBILE_MAX) banner.classList.add("is-visible");
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      document.querySelector(".mobile-install-banner")?.classList.remove("is-visible");
    });
  }

  function configureMobileMeta() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && !viewport.content.includes("viewport-fit")) {
      viewport.content += ", viewport-fit=cover";
    }

    const metas = [
      ["theme-color", "#090909"],
      ["mobile-web-app-capable", "yes"],
      ["apple-mobile-web-app-capable", "yes"],
      ["apple-mobile-web-app-status-bar-style", "black-translucent"],
      ["apple-mobile-web-app-title", "MDC Ferretería"],
    ];

    for (const [name, content] of metas) {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement("meta");
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    }
  }

  function setupServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js?v=2").catch(err => {
        console.warn("MDC service worker no disponible:", err);
      });
    }, { once: true });
  }

  function setupNetworkState() {
    const update = () => {
      document.documentElement.dataset.network = navigator.onLine ? "online" : "offline";
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
  }

  function boot() {
    configureMobileMeta();
    injectCatalogSearchStyle();
    injectBottomNav();
    injectHomeTools();
    injectCatalogSearch();
    injectInstallBanner();
    setupInstallPrompt();
    setupServiceWorker();
    setupNetworkState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
