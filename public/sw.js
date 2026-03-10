const CACHE_NAME = "jurnal-guru-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Skip non-GET dan request ke API/Redis/Cloudinary
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("upstash.io") ||
    event.request.url.includes("cloudinary.com") ||
    event.request.url.includes("fonnte.com")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => {
        // Fallback ke index.html untuk SPA routing
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});