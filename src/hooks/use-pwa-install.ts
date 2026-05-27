"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const dismissedStorageKey = "catatz_pwa_dismissed";
const dismissCooldownMs = 7 * 24 * 60 * 60 * 1000;
export const pwaInstallAcceptedEvent = "catatz:pwa-install-accepted";

type InstallOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithMSStream extends Window {
  MSStream?: unknown;
}

export type UsePWAInstall = {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isIOSSafari: boolean;
  isMobile: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
  hasBeenDismissed: boolean;
  dismissedAt: Date | null;
};

function getDismissedAt() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(dismissedStorageKey);

  if (!storedValue) {
    return null;
  }

  const timestamp = Number(storedValue);

  if (Number.isNaN(timestamp)) {
    window.localStorage.removeItem(dismissedStorageKey);
    return null;
  }

  return new Date(timestamp);
}

function getDismissedState() {
  const dismissedAt = getDismissedAt();

  if (!dismissedAt) {
    return { dismissedAt: null, hasBeenDismissed: false };
  }

  const isStillDismissed =
    Date.now() - dismissedAt.getTime() < dismissCooldownMs;

  if (!isStillDismissed && typeof window !== "undefined") {
    window.localStorage.removeItem(dismissedStorageKey);
  }

  return {
    dismissedAt: isStillDismissed ? dismissedAt : null,
    hasBeenDismissed: isStillDismissed,
  };
}

function getInstalledStatus() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getDeviceState() {
  if (typeof window === "undefined") {
    return {
      isIOS: false,
      isIOSSafari: false,
      isMobile: false,
    };
  }

  const userAgent = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) &&
    !(window as WindowWithMSStream).MSStream;
  const isCriOS = /CriOS/.test(userAgent);
  const isFxiOS = /FxiOS/.test(userAgent);
  const isEdgiOS = /EdgiOS/.test(userAgent);
  const isSafari =
    /Safari/.test(userAgent) && !/Chrome|Chromium|Android/.test(userAgent);
  const isIOSSafari = isIOS && isSafari && !isCriOS && !isFxiOS && !isEdgiOS;
  const isMobile =
    isIOS || /Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return { isIOS, isIOSSafari, isMobile };
}

export function usePWAInstall(): UsePWAInstall {
  const promptEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceState, setDeviceState] = useState(getDeviceState);
  const [dismissState, setDismissState] = useState(getDismissedState);

  const dismissPrompt = useCallback(() => {
    const dismissedAt = new Date();

    window.localStorage.setItem(
      dismissedStorageKey,
      String(dismissedAt.getTime()),
    );
    setDismissState({ dismissedAt, hasBeenDismissed: true });
    setIsInstallable(false);
    promptEventRef.current = null;
  }, []);

  const promptInstall = useCallback(async () => {
    const promptEvent = promptEventRef.current;

    if (!promptEvent) {
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    promptEventRef.current = null;
    setIsInstallable(false);

    if (choice.outcome === "dismissed") {
      dismissPrompt();
    } else {
      window.localStorage.removeItem(dismissedStorageKey);
      setDismissState({ dismissedAt: null, hasBeenDismissed: false });
      window.dispatchEvent(new Event(pwaInstallAcceptedEvent));
    }
  }, [dismissPrompt]);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const initializeClientState = () => {
      setDeviceState(getDeviceState());
      setDismissState(getDismissedState());
      setIsInstalled(getInstalledStatus());
    };
    const handleInstalledStatusChange = () => {
      setIsInstalled(getInstalledStatus());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      const currentDismissState = getDismissedState();

      if (currentDismissState.hasBeenDismissed || getInstalledStatus()) {
        return;
      }

      promptEventRef.current = event as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      promptEventRef.current = null;
      window.localStorage.removeItem(dismissedStorageKey);
      setDismissState({ dismissedAt: null, hasBeenDismissed: false });
      setIsInstallable(false);
      setIsInstalled(true);
    };

    const timeoutId = window.setTimeout(initializeClientState, 0);

    standaloneQuery.addEventListener("change", handleInstalledStatusChange);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.clearTimeout(timeoutId);
      standaloneQuery.removeEventListener(
        "change",
        handleInstalledStatusChange,
      );
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return {
    ...deviceState,
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
    dismissedAt: dismissState.dismissedAt,
    hasBeenDismissed: dismissState.hasBeenDismissed,
  };
}
