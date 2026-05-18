"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const isProduction = process.env.NODE_ENV === "production";
const developmentCachePrefixes = ["serwist", "catatz"];

export interface ServiceWorkerState {
  isUpdateAvailable: boolean;
  triggerUpdate: () => void;
}

async function cleanupDevelopmentServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(registrations.map((registration) => registration.unregister()));

  if (!("caches" in window)) {
    return;
  }

  const cacheNames = await window.caches.keys();
  const staleCacheNames = cacheNames.filter((cacheName) =>
    developmentCachePrefixes.some((prefix) => cacheName.startsWith(prefix)),
  );

  await Promise.all(
    staleCacheNames.map((cacheName) => window.caches.delete(cacheName)),
  );
}

export function useServiceWorkerRegistration(): ServiceWorkerState {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const triggerUpdate = useCallback(() => {
    const waitingWorker = registrationRef.current?.waiting;

    if (!waitingWorker) {
      return;
    }

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (!isProduction) {
      cleanupDevelopmentServiceWorkers().catch((error: unknown) => {
        console.warn("[pwa] Development service worker cleanup failed", error);
      });
      return;
    }

    let isMounted = true;
    let isReloading = false;

    const markWaitingWorker = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        setIsUpdateAvailable(true);
      }
    };

    const handleControllerChange = () => {
      if (isReloading) {
        return;
      }

      isReloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        if (!isMounted) {
          return;
        }

        registrationRef.current = registration;
        markWaitingWorker(registration);

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              setIsUpdateAvailable(true);
            }
          });
        });
      })
      .catch((error: unknown) => {
        console.error("[pwa] Service worker registration failed", error);
      });

    return () => {
      isMounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return { isUpdateAvailable, triggerUpdate };
}
