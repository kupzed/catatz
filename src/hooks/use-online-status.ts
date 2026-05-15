"use client";

import { useEffect, useState } from "react";

function getOnlineStatus() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(getOnlineStatus);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    handleOnlineStatusChange();
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, []);

  return isOnline;
}
