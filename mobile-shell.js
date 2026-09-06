/* MDC Ferretería · Mobile App Shell */
(() => {
  const MOBILE_MAX = 820;
  const WA = '56979151979';
  let deferredInstallPrompt = null;

  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>',
    catalog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.3 1.2Z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/></svg>'
  };

  function currentFile() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function isStandalone() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  }

  function injectBottomNav() {
    if (window.innerWidth > MOBILE_MAX || document.querySelector('.app-bottom-nav')) return;
    const file = currentFile();
    const active = file === 'catalogo.html' || file === 'producto.html'
      ? 'catalog'
      : file === 'carrito.html' || file === 'checkout.html'
        ? 'cart'
        : 'home';

    const nav = document.createElement('nav');
    nav.className = 'app-bottom-nav';
    nav.setAttribute('aria-label', 'Navegación principal móvil');
    nav.innerHTML = `
      <a class="app-nav-item ${active === 'home' ? 'is-active' : ''}" href="index.html">${icons.home}<span>Inicio</span></a>
      <a class="app-nav-item ${active === 'catalog' ? 'is-active' : ''}" href="catalogo.html">${icons.catalog}<span>Catálogo</span></a>
      <a class="app-nav-item ${active === 'cart' ? 'is-active' : ''}" href="carrito.html">${icons.cart}<span>Carrito</span><span class="app-nav-cart-count" data-cart-count hidden></span></a>
      <a class="app-nav-item" href="https://wa.me/${WA}?text=${encodeURIComponent('Hola MDC, necesito ayuda con una compra')}" target="_blank" rel="noopener">${icons.wa}<span>WhatsApp</span></a>`;
    document.body.appendChild(nav);
    try { globalThis.updateCartCount?.(); } catch (_) {}
  }

  function injectSearch() {
    if (window.innerWidth > MOBILE_MAX) return;
    const file = currentFile();
    if (file !== 'index.html' && file !== 'catalogo.html') return;
    if (document.querySelector('.mobile-shell-search')) return;

    const target = file === 'catalogo.html'
      ? document.querySelector('.catalog-head')
      : document.querySelector('.hero');
    if (!target) return;

    const params = new URLSearchParams(location.search);
    const wrap = document.createElement('div');
    wrap.className = 'mobile-shell-search';
    wrap.innerHTML = `
      <form class="mobile-search-form" action="catalogo.html" method="get" role="search">
        ${icons.search}
        <input name="q" type="search" value="${String(params.get('q') || '').replaceAll('"','&quot;')}" placeholder="Buscar taladro, cable, cemento..." aria-label="Buscar productos">
        <button class="mobile-search-submit" type="submit">Buscar</button>
      </form>`;
    target.insertAdjacentElement('afterend', wrap);
  }

  function injectInstallBanner() {
    if (isStandalone() || document.querySelector('.mobile-install-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'mobile-install-banner';
    banner.innerHTML = `
      <img src="assets/logo-claro.png" alt="MDC">
      <div class="mobile-install-copy"><b>Instalar MDC</b><span>Acceso rápido como una app</span></div>
      <div class="mobile-install-actions">
        <button type="button" data-install-dismiss>Ahora no</button>
        <button type="button" class="install-primary" data-install-app>Instalar</button>
      </div>`;
    document.body.appendChild(banner);

    banner.querySelector('[data-install-dismiss]')?.addEventListener('click', () => {
      banner.classList.remove('is-visible');
      try { sessionStorage.setItem('mdc-install-dismissed', '1'); } catch (_) {}
    });

    banner.querySelector('[data-install-app]')?.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      banner.classList.remove('is-visible');
    });
  }

  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      let dismissed = false;
      try { dismissed = sessionStorage.getItem('mdc-install-dismissed') === '1'; } catch (_) {}
      if (!dismissed && window.innerWidth <= MOBILE_MAX) {
        document.querySelector('.mobile-install-banner')?.classList.add('is-visible');
      }
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      document.querySelector('.mobile-install-banner')?.classList.remove('is-visible');
    });
  }

  function configureMeta() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && !viewport.content.includes('viewport-fit')) viewport.content += ', viewport-fit=cover';
    const metas = [
      ['theme-color', '#090909'],
      ['mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
      ['apple-mobile-web-app-title', 'MDC Ferretería']
    ];
    for (const [name, content] of metas) {
      if (document.querySelector(`meta[name="${name}"]`)) continue;
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  function setupServiceWorker() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js?v=10', { scope: './', updateViaCache: 'none' }).catch(() => null);
    }, { once: true });
  }

  function setupNetworkState() {
    const sync = () => document.documentElement.toggleAttribute('data-offline', !navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
  }

  function boot() {
    configureMeta();
    injectBottomNav();
    injectSearch();
    setupInstallPrompt();
    setupServiceWorker();
    setupNetworkState();

    const late = () => injectInstallBanner();
    if ('requestIdleCallback' in window) requestIdleCallback(late, { timeout: 1600 });
    else window.setTimeout(late, 900);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
