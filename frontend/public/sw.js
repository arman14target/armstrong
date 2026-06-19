const CACHE_NAME = "armstrong-v3";

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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        assetUrl("/app/"),
        assetUrl("/manifest.json"),
        assetUrl("/icons/favicon-32.png"),
        assetUrl("/icons/apple-touch-icon.png"),
        assetUrl("/icons/icon-192.png"),
        assetUrl("/icons/icon-512.png"),
        assetUrl("/icons/icon-maskable-512.png"),
      ]),
    ),
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
