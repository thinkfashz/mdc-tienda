/* MDC Ferretería · PWA rápida para app instalada */
const CACHE = "mdc-store-shell-v12";
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
  "./loader-guard.js",
  "./cart-state-guard.js",
  "./app-integrity.js",
  "./app-update.js",
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
  "./assets/p-llaves.png"
];

function sameOrigin(request) {
  try { return new URL(request.url).origin === self.location.origin; }
  catch (_) { return false; }
}

function canonicalUrl(input) {
  const url = new URL(typeof input === "string" ? input : input.url, self.location.origin);
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function cacheMatch(request) {
  const cache = await caches.open(CACHE);
  return cache.match(request, { ignoreSearch: true });
}

async function cachePut(request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(CACHE);
  await cache.put(canonicalUrl(request), response.clone());
  return response;
}

async function fetchAndCache(request, cacheMode = "no-store") {
  const response = await fetch(request, { cache: cacheMode });
  if (response.ok) await cachePut(request, response);
  return response;
}

async function staleWhileRevalidate(request, event) {
  const cached = await cacheMatch(request);
  const refresh = fetchAndCache(request).catch(() => null);
  if (event) event.waitUntil(refresh);
  if (cached) return cached;
  return (await refresh) || Response.error();
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(async url => {
      const response = await fetch(url, { cache: "reload" });
      if (response.ok) await cache.put(canonicalUrl(url), response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || !sameOrigin(req)) return;

  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/api/version") {
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cached = await cacheMatch(req);
      const refresh = fetchAndCache(req).catch(() => null);
      event.waitUntil(refresh);
      return cached
        || (await refresh)
        || (await cacheMatch(new Request(new URL("./index.html", self.location).toString())))
        || Response.error();
    })());
    return;
  }

  if (path.endsWith("/catalog.snapshot.json") || /\.(?:js|css|webmanifest)$/i.test(path)) {
    event.respondWith(staleWhileRevalidate(req, event));
    return;
  }

  event.respondWith((async () => {
    const cached = await cacheMatch(req);
    if (cached) return cached;
    try { return await fetchAndCache(req, "default"); }
    catch (_) { return Response.error(); }
  })());
});
