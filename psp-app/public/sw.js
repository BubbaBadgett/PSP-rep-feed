// Deliberately minimal: this app is live-data-driven (feed, orders, CRM),
// so there's nothing meaningful to serve fully offline. This exists mainly
// to satisfy Android's "installable PWA" requirement (a registered service
// worker with a fetch handler) and to keep the app shell available if the
// network blips mid-session. It does NOT precache hashed build assets —
// Vite renames those per-build, so instead this caches opportunistically as
// requests happen (stale-while-revalidate) rather than a fixed manifest.

const CACHE_NAME = "psp-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never intercept cross-origin (APIs, fonts CDN, etc.)

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
