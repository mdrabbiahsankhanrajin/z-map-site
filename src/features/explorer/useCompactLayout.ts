import { useSyncExternalStore } from "react";

const compactQuery = "(max-width: 1060px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(compactQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(compactQuery).matches;
}

export function useCompactLayout() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
