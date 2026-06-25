import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
} from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

interface ServiceWorkerMessageEvent extends Event {
  data?: {
    type?: string;
  };
  source?: object | null;
}

interface ServiceWorkerExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface CatatZServiceWorkerGlobalScope extends WorkerGlobalScope, SerwistGlobalConfig {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  addEventListener: {
    (
      type: "message",
      listener: (event: ServiceWorkerMessageEvent) => void,
    ): void;
    (
      type: "activate",
      listener: (event: ServiceWorkerExtendableEvent) => void,
    ): void;
  };
  caches: CacheStorage;
  location: Location;
  skipWaiting: () => Promise<void>;
}

declare const self: CatatZServiceWorkerGlobalScope;

const appShellCache = "catatz-app-shell-v2";
const currentRuntimeCaches = new Set([appShellCache]);

const appShellStrategy = new CacheFirst({
  cacheName: appShellCache,
  plugins: [
    new CacheableResponsePlugin({ statuses: [0, 200] }),
    new ExpirationPlugin({
      maxEntries: 80,
      maxAgeSeconds: 30 * 24 * 60 * 60,
    }),
  ],
});

const networkOnlyStrategy = new NetworkOnly();

function isSameOrigin(url: URL) {
  return url.origin === self.location.origin;
}

function hasAuthSensitiveHeaders(request: Request) {
  // Browsers usually hide Cookie from service workers, but if auth/cookie headers
  // are observable for any request, that request is never routed to a cache.
  return request.headers.has("authorization") || request.headers.has("cookie");
}

function isAppShellAsset(url: URL) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/catatz.svg" ||
    url.pathname === "/catatz.png"
  );
}

const runtimeCaching: RuntimeCaching[] = [
  {
    method: "POST",
    matcher: ({ url }) => isSameOrigin(url),
    handler: networkOnlyStrategy,
  },
  {
    matcher: ({ request, url }) =>
      isSameOrigin(url) && request.method === "GET" && url.pathname.startsWith("/api/"),
    handler: networkOnlyStrategy,
  },
  {
    matcher: ({ request, url }) =>
      isSameOrigin(url) &&
      request.method === "GET" &&
      !hasAuthSensitiveHeaders(request) &&
      isAppShellAsset(url),
    handler: appShellStrategy,
  },
];

self.addEventListener("message", (event) => {
  // Only accept messages from clients controlled by this service worker
  if (!event.source) return;
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith("catatz-") &&
              !currentRuntimeCaches.has(cacheName),
          )
          .map((cacheName) => self.caches.delete(cacheName)),
      ),
    ),
  );
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// TEST 1: Buka app, matikan internet, refresh -> harus tampil cached page atau /offline.html
// TEST 2: Update kode, deploy ulang -> harus ada notif "update tersedia"
// TEST 3: Navigasi antar page saat offline -> app shell harus tetap jalan
// TEST 4: Submit form (transaksi baru) saat offline -> harus gagal gracefully dengan toast error
