/* MDC Ferretería · PWA robusta para app instalada */
const CACHE = "mdc-store-shell-v6";
const CACHE_PREFIX = "mdc-store-shell-";

const CORE = [
  "./",
  "./index.html",
  "./catalogo.html",
  "./producto.html",
  "./carrito.html",
  "./checkout.html",
  "./styles.css",
  "./premium-mobile.css",
  "./marketplace-experience.css",
  "./social-contact.css",
  "./splash-loader.css",
  "./app.js",
  "./mobile-shell.js",
  "./marketplace-experience.js",
  "./social-contact.js",
  "./splash-loader.js",
  "./catalog.snapshot.json",
  "./manifest.webmanifest",
  "./assets/logo-claro.png",
  "./assets/p-herramientas.png",
  "./assets/p-taladro.png",
  "./assets/p-amoladora.png",
  "./assets/p-cemento.png",
  "./assets/p-cable.png",
  "./assets/p-pintura.png",
  "./assets/p-metalcon.png",
  "./assets/p-llaves.png",
  "./assets/truck.jpeg",
  "./assets/welder.jpeg",
  "./assets/letrero.jpeg",
  "./assets/logo-metal.jpeg"
];

function sameOrigin(request) {
  try {
    return new URL(request.url).origin === self.location.origin;
  } catch (_) {
    return false;
  }
}

function canonicalUrl(input) {
  const url = new URL(typeof input === "string" ? input : input.url, self.location.origin);
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function cacheMatchIgnoringVersion(request) {
  const cache = await caches.open(CACHE);
  return cache.match(request, { ignoreSearch: true });
}

async function cachePutCanonical(request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(CACHE);
  await cache.put(canonicalUrl(request), response.clone());
  return response;
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Un recurso opcional nunca debe impedir instalar/actualizar toda la PWA.
    await Promise.all(CORE.map(async url => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(canonicalUrl(url), response);
      } catch (_) {
        // El resto del shell continúa instalándose.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || !sameOrigin(req)) return;

  const url = new URL(req.url);
  const path = url.pathname;

  // Navegación: red primero, shell local como respaldo.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        await cachePutCanonical(req, fresh);
        return fresh;
      } catch (_) {
        return (await cacheMatchIgnoringVersion(req))
          || (await cacheMatchIgnoringVersion(new Request(new URL("./index.html", self.location).toString())))
          || Response.error();
      }
    })());
    return;
  }

  // El snapshot es crítico para que la app instalada muestre productos sin API.
  // Red primero para mantenerlo fresco; cache local si no hay conexión.
  if (path.endsWith("/catalog.snapshot.json")) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        await cachePutCanonical(req, fresh);
        return fresh;
      } catch (_) {
        return (await cacheMatchIgnoringVersion(req)) || Response.error();
      }
    })());
    return;
  }

  // JS/CSS/imágenes: sirve instantáneo desde cache ignorando ?v=...
  // y actualiza en segundo plano cuando hay conexión.
  event.respondWith((async () => {
    const cached = await cacheMatchIgnoringVersion(req);
    const refresh = fetch(req)
      .then(async response => {
        if (response.ok) await cachePutCanonical(req, response);
        return response;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(refresh);
      return cached;
    }

    const fresh = await refresh;
    return fresh || Response.error();
  })());
});
