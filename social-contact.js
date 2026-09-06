/* MDC Ferretería · Contacto público, redes y reparaciones runtime */
(() => {
  const CONTACT = Object.freeze({
    name: 'Ferretería MDC',
    legalName: 'FERRETERIA MDC SPA',
    address: 'Rengo 1392, Linares, Región del Maule, Chile',
    whatsapp: '56979151979',
    whatsappDisplay: '+56 9 7915 1979',
    facebook: 'https://www.facebook.com/373141003495526',
    instagram: 'https://www.instagram.com/explore/locations/373141003495526/',
    maps: 'https://www.google.com/maps/search/?api=1&query=Ferreter%C3%ADa%20MDC%2C%20Rengo%201392%2C%20Linares%2C%20Chile',
    website: 'https://mdc-tienda.vercel.app/'
  });

  window.MDC_CONTACT = CONTACT;

  const icons = {
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.2.2-.3.4-.1.7.2.3.9 1.5 2 2.4 1.4 1.2 2.5 1.6 2.8 1.7.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.3 1.2Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.3v3h2.8v8h3.4Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>'
  };

  function patchWhatsappLinks(root = document) {
    root.querySelectorAll?.('a[href*="wa.me/"]').forEach(a => {
      try {
        const url = new URL(a.href, location.href);
        if (!/wa\.me$/i.test(url.hostname) && !/wa\.me/i.test(url.hostname)) return;
        const message = url.searchParams.get('text');
        a.href = `https://wa.me/${CONTACT.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
      } catch (_) {}
    });

    root.querySelectorAll?.('a, p, span').forEach(el => {
      if (el.childElementCount) return;
      if (el.textContent?.trim() === '+56 9 2068 8075') el.textContent = CONTACT.whatsappDisplay;
    });
  }

  function injectContactSocials() {
    if (document.querySelector('.mdc-social-contact')) return;
    const target = document.querySelector('#contacto .contact-inner') || document.querySelector('.footer');
    if (!target) return;

    const wrap = document.createElement('section');
    wrap.className = 'mdc-social-contact';
    wrap.setAttribute('aria-label', 'Canales oficiales de MDC Ferretería');
    wrap.innerHTML = `
      <div class="mdc-social-copy">
        <span>Conecta con MDC</span>
        <strong>Rengo 1392 · Linares</strong>
        <small>WhatsApp público: ${CONTACT.whatsappDisplay}</small>
      </div>
      <div class="mdc-social-links">
        <a class="mdc-social-link is-wa" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Hola MDC, quiero cotizar productos')}" target="_blank" rel="noopener" aria-label="WhatsApp MDC">${icons.whatsapp}<span>WhatsApp</span></a>
        <a class="mdc-social-link" href="${CONTACT.facebook}" target="_blank" rel="noopener" aria-label="Facebook MDC">${icons.facebook}<span>Facebook</span></a>
        <a class="mdc-social-link" href="${CONTACT.instagram}" target="_blank" rel="noopener" aria-label="Instagram ubicación MDC">${icons.instagram}<span>Instagram</span></a>
        <a class="mdc-social-link" href="${CONTACT.maps}" target="_blank" rel="noopener" aria-label="Ver MDC en Google Maps">${icons.map}<span>Cómo llegar</span></a>
      </div>`;
    target.appendChild(wrap);
  }

  function injectStructuredData() {
    if (document.getElementById('mdc-local-business-schema')) return;
    const schema = document.createElement('script');
    schema.id = 'mdc-local-business-schema';
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HardwareStore',
      name: CONTACT.name,
      legalName: CONTACT.legalName,
      url: CONTACT.website,
      telephone: CONTACT.whatsappDisplay,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Rengo 1392',
        addressLocality: 'Linares',
        addressRegion: 'Región del Maule',
        addressCountry: 'CL'
      },
      sameAs: [CONTACT.facebook, CONTACT.instagram],
      hasMap: CONTACT.maps
    });
    document.head.appendChild(schema);
  }

  function hasCatalog() {
    return typeof LiveCatalog !== 'undefined'
      && LiveCatalog.loaded
      && Array.isArray(LiveCatalog.products)
      && LiveCatalog.products.length > 0;
  }

  /*
   * Repara el contador cuando quedaron IDs antiguos guardados en localStorage.
   * El contador representa solo productos que la tienda realmente puede resolver.
   */
  function resolvedCart() {
    if (typeof getCart !== 'function') return [];
    const raw = getCart();
    if (!Array.isArray(raw)) return [];
    if (!hasCatalog()) return raw;
    return raw.filter(item => !!LiveCatalog.byId(item.id));
  }

  function resolvedCartCount() {
    return resolvedCart().reduce((sum, item) => sum + Math.max(0, Number(item.qty) || 0), 0);
  }

  function repairCartCounter() {
    const count = resolvedCartCount();
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      const visible = count > 0;
      el.textContent = visible ? String(count) : '';
      el.classList.toggle('is-visible', visible);
      el.hidden = !visible;
      el.style.display = visible ? '' : 'none';
      el.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }

  function pruneStaleCartWhenAuthoritative() {
    if (typeof LiveCatalog === 'undefined' || !LiveCatalog.loaded || LiveCatalog.source !== 'network') return;
    if (typeof getCart !== 'function') return;

    const raw = getCart();
    const valid = raw.filter(item => !!LiveCatalog.byId(item.id));
    if (valid.length === raw.length) return;

    try {
      localStorage.setItem('mdc-cart', JSON.stringify(valid));
    } catch (_) {}
  }

  function installCartRepair() {
    if (typeof cartCount === 'function') globalThis.cartCount = resolvedCartCount;
    if (typeof updateCartCount === 'function') globalThis.updateCartCount = repairCartCounter;

    const sync = () => {
      pruneStaleCartWhenAuthoritative();
      repairCartCounter();
    };

    sync();
    if (typeof LiveCatalog !== 'undefined' && typeof LiveCatalog.onChange === 'function') {
      LiveCatalog.onChange(sync);
    }
    window.addEventListener('storage', event => {
      if (event.key === 'mdc-cart') sync();
    });
  }

  /* Fuerza a la PWA instalada a comprobar la versión nueva del service worker. */
  function forceServiceWorkerUpdate() {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker
      .register('sw.js?v=6', { scope: './', updateViaCache: 'none' })
      .then(registration => registration.update().catch(() => null))
      .catch(() => null);
  }

  function boot() {
    patchWhatsappLinks();
    injectContactSocials();
    injectStructuredData();
    installCartRepair();
    forceServiceWorkerUpdate();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) patchWhatsappLinks(node);
        });
      }
      injectContactSocials();
      repairCartCounter();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();