const CACHE_NAME = "armstrong-v4";

const DAY_STICKER_FILES = [
  "dumbbell-3d-orange.png",
  "bench-3d-orange.png",
  "kettlebell-3d-orange.png",
  "weight-plate-3d-orange.png",
  "jump-rope-3d-orange.png",
  "medicine-ball-3d-orange.png",
];

const IMAGE_PATH_PREFIXES = ["/images/", "/icons/"];
const IMAGE_HOSTS = new Set([
  "raw.githubusercontent.com",
  "res.cloudinary.com",
]);

function scopePath() {
  const scope = self.registration.scope;
  try {
    const url = new URL(scope);
    return url.pathname.replace(/\/$/, "") || "";
  } catch {
    return "";
  }
}

function assetUrl(path) {
  const base = scopePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function installAssets() {
  return [
    assetUrl("/app/"),
    assetUrl("/manifest.json"),
    assetUrl("/icons/favicon-32.png"),
    assetUrl("/icons/apple-touch-icon.png"),
    assetUrl("/icons/icon-192.png"),
    assetUrl("/icons/icon-512.png"),
    assetUrl("/icons/icon-maskable-512.png"),
    ...DAY_STICKER_FILES.map((file) =>
      assetUrl(`/images/day-stickers/${file}`),
    ),
  ];
}

function isCacheableImage(request) {
  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    return IMAGE_PATH_PREFIXES.some((prefix) => url.pathname.includes(prefix));
  }

  return IMAGE_HOSTS.has(url.hostname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(installAssets())),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (isCacheableImage(event.request)) {
    event.respondWith(
      caches
        .open(CACHE_NAME)
        .then(async (cache) => {
          const cached = await cache.match(event.request);
          if (cached) {
            return cached;
          }

          const response = await fetch(event.request);
          if (response.ok) {
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => fetch(event.request)),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }

        return clients.openWindow(assetUrl("/app/"));
      }),
  );
});
