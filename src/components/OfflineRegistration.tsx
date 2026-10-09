"use client";

import { useEffect } from "react";
import { publicPath } from "@/lib/publicPath";

export function OfflineRegistration() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BASE_PATH && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(publicPath("/sw.js")).catch(() => {
        // The online site remains usable when offline caching is unavailable.
      });
    }
  }, []);
  return null;
}
