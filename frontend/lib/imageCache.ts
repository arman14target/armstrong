const IMAGE_CACHE_NAME = "armstrong-images-v1";

const blobUrlBySource = new Map<string, string>();

function canUseImageCache(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

async function readCachedBlobUrl(url: string): Promise<string | undefined> {
  if (!canUseImageCache()) {
    return undefined;
  }

  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const response = await cache.match(url);
    if (!response) {
      return undefined;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    blobUrlBySource.set(url, blobUrl);
    return blobUrl;
  } catch {
    return undefined;
  }
}

async function fetchAndCache(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    return url;
  }

  if (canUseImageCache()) {
    try {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      await cache.put(url, response.clone());
    } catch {
      // Cache write is best-effort.
    }
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  blobUrlBySource.set(url, blobUrl);
  return blobUrl;
}

/** Return a blob URL when cached; otherwise the original URL. */
export function peekCachedImageSrc(url: string): string | undefined {
  return blobUrlBySource.get(url);
}

/** Resolve an image through the persistent Cache API (and in-memory blob URLs). */
export async function getCachedImageSrc(url: string): Promise<string> {
  if (!url || typeof window === "undefined") {
    return url;
  }

  const fromMemory = peekCachedImageSrc(url);
  if (fromMemory) {
    return fromMemory;
  }

  const fromCache = await readCachedBlobUrl(url);
  if (fromCache) {
    return fromCache;
  }

  try {
    return await fetchAndCache(url);
  } catch {
    return url;
  }
}

export function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map((url) => getCachedImageSrc(url).then(() => undefined)),
  ).then(() => undefined);
}
