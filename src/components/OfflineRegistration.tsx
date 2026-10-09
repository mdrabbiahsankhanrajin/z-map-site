"use client";

import { useEffect } from "react";
import { publicPath } from "@/lib/publicPath";

export function OfflineRegistration() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_BASE_PATH || !("serviceWorker" in navigator)) return;
    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    const register = () => {
      navigator.serviceWorker.register(publicPath("/sw.js")).catch(() => {
        // The online site remains usable when offline caching is unavailable.
      });
    };
    const schedule = () => {
      // Give the map's first render and visible tiles priority on slower phones.
      timerId = setTimeout(() => {
        if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(register, { timeout: 5000 });
        else register();
      }, 3500);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);
  return null;
}
