"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { ExpressionSpecification, FilterSpecification, StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import type { FeatureCollection } from "geojson";
import type { Place } from "@/features/explorer/state";
import { resolveWorldPlaceId } from "@/data/worldPlaces";
import { themes, type ThemeId } from "@/features/explorer/themes";
import countries from "@/data/countries.json";
import { publicPath } from "@/lib/publicPath";
import { zoomFocus } from "./zoomFocus";


type Props = {
  scope: "world" | "districts" | "regions";
  places: Place[];
  sourceUrl?: string;
  overview?: Place;
  selectedIds: string[];
  activeId: string | null;
  theme: ThemeId;
  onSelect: (id: string) => void;
};

const grid: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    ...Array.from({ length: 11 }, (_, index) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: Array.from({ length: 73 }, (_, step) => [-180 + step * 5, -50 + index * 10]) },
    })),
    ...Array.from({ length: 13 }, (_, index) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: Array.from({ length: 29 }, (_, step) => [-180 + index * 30, -70 + step * 5]) },
    })),
  ],
};

function perspectiveCamera(scope: Props["scope"], mobile: boolean) {
  if (scope === "world") return { pitch: mobile ? 32 : 46, bearing: mobile ? -8 : -14 };
  return { pitch: mobile ? 24 : 38, bearing: mobile ? -4 : -8 };
}

function mapPadding(mobile: boolean, selected = false) {
  return mobile
    ? { top: 100, right: 28, bottom: Math.max(Math.round(window.innerHeight * 0.34), 280) + 22, left: 28 }
    : { top: 65, right: selected ? 330 : 55, bottom: 65, left: 55 };
}

function fitOverview(map: MapLibreMap, scope: Props["scope"], places: Place[], overview: Place | undefined, mobile: boolean, perspective: boolean) {
  if (scope === "world") return;
  const camera = perspective ? perspectiveCamera(scope, mobile) : { pitch: 0, bearing: 0 };
  const bounds = scope === "regions" && overview?.bounds ? overview.bounds : places.reduce<[number, number, number, number]>((box, place) => {
    if (!place.bounds) return box;
    return [Math.min(box[0], place.bounds[0]), Math.min(box[1], place.bounds[1]), Math.max(box[2], place.bounds[2]), Math.max(box[3], place.bounds[3])];
  }, [Infinity, Infinity, -Infinity, -Infinity]);
  if (bounds.every(Number.isFinite) && bounds[2] - bounds[0] < 180) map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
    padding: mapPadding(mobile), maxZoom: scope === "regions" ? 7.5 : mobile ? 5.4 : 7, ...camera, duration: 0,
  });
  else if (scope === "regions" && overview && mobile) map.jumpTo({
    center: [overview.center[0], overview.center[1]], padding: mapPadding(mobile), ...camera,
  });
}

function mapStyle(scope: Props["scope"], theme: ThemeId, sourceUrl?: string): StyleSpecification {
  const palette = themes[theme];
  return {
    version: 8,
    sources: {
      graticule: { type: "geojson", data: grid },
      ...(scope === "districts"
        ? { "bd-terrain": { type: "raster" as const, tiles: [publicPath("/data/bd-terrain-hi/{z}/{x}/{y}.webp")], tileSize: 512, minzoom: 3, maxzoom: 6, attribution: "Natural Earth I; tiles by maps.black (CC0)" } }
        : { "world-terrain": { type: "raster" as const, tiles: [publicPath("/data/world-terrain/{z}/{x}/{y}.webp")], tileSize: 512, minzoom: 0, maxzoom: 4, attribution: "Natural Earth I; tiles by maps.black (CC0)" } }),
      ...(scope === "districts" ? {
        context: { type: "geojson" as const, data: publicPath("/data/bd-context.geojson") },
        rivers: { type: "geojson" as const, data: publicPath("/data/bd-rivers.geojson") },
      } : {}),
      places: {
        type: "geojson",
        data: sourceUrl ?? (scope === "world" ? publicPath("/data/world.geojson") : publicPath("/data/bd-districts.geojson")),
        promoteId: "id",
      },
      ...(scope === "world" ? { "palestine-outline": { type: "geojson" as const, data: publicPath("/data/palestine-outline.geojson") } } : {}),
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": palette.ocean } },
      ...(scope !== "districts" ? [{ id: "world-terrain" as const, type: "raster" as const, source: "world-terrain", paint: { "raster-opacity": 1, "raster-fade-duration": 0, "raster-contrast": 0.24, "raster-saturation": 0.34, "raster-brightness-max": 0.82 } }] : []),
      { id: "graticule", type: "line", source: "graticule", paint: { "line-color": "#f7f1dc", "line-opacity": 0.19, "line-width": 0.55 } },
      ...(scope === "districts" ? [
        { id: "context-land" as const, type: "fill" as const, source: "context", paint: { "fill-color": palette.land, "fill-opacity": 0.93 } },
        { id: "bd-terrain" as const, type: "raster" as const, source: "bd-terrain", paint: { "raster-opacity": 1, "raster-fade-duration": 0, "raster-contrast": 0.22, "raster-saturation": 0.22, "raster-brightness-max": 0.82 } },
        { id: "context-tone" as const, type: "fill" as const, source: "context", paint: { "fill-color": ["match", ["get", "id"], "BGD", "#0a5738", "IND", "#9b6e38", "MMR", "#37634a", "NPL", "#64714f", "BTN", "#4e6f52", "#4d6951"] as ExpressionSpecification, "fill-opacity": 0.28 } },
        { id: "bd-tint" as const, type: "fill" as const, source: "context", filter: ["==", ["get", "id"], "BGD"] as FilterSpecification, paint: { "fill-color": "#07452e", "fill-opacity": 0.35 } },
        { id: "context-line" as const, type: "line" as const, source: "context", paint: { "line-color": "#163f34", "line-width": 1.15, "line-opacity": 0.72 } },
      ] : []),
      { id: "places-fill", type: "fill", source: "places", paint: { "fill-color": palette.land, "fill-opacity": 0.08, "fill-antialias": false } },
      ...(scope === "districts" ? [
        { id: "bd-rivers" as const, type: "line" as const, source: "rivers", maxzoom: 6.15, paint: { "line-color": "#247ea6", "line-opacity": 0.4, "line-width": 0.7 } },
        { id: "district-line-casing" as const, type: "line" as const, source: "places", paint: { "line-color": "#214934", "line-opacity": 0.36, "line-width": 1.1 } },
      ] : []),
      {
        id: "selected-depth", type: "fill-extrusion", source: "places",
        filter: ["==", ["get", "id"], ""],
        paint: {
          "fill-extrusion-color": palette.selected,
          "fill-extrusion-height": scope === "world"
            ? ["interpolate", ["linear"], ["zoom"], 0.8, 420000, 2.6, 100000, 5.5, 10000]
            : ["interpolate", ["linear"], ["zoom"], 1.5, 120000, 5, 12000, 8, 2200, 11, 600],
          "fill-extrusion-opacity": 0.44,
        },
      },
      ...(scope === "world" ? [{ id: "country-line-shadow" as const, type: "line" as const, source: "places", paint: { "line-color": "#153b2f", "line-width": 1.9, "line-opacity": ["case", ["in", ["get", "id"], ["literal", ["ISR", "PSX"]]], 0, 0.38] as ExpressionSpecification } }] : []),
      { id: "places-line", type: "line", source: "places", paint: { "line-color": palette.line, "line-width": scope === "world" ? 1.4 : 1.15, "line-opacity": scope === "world" ? ["case", ["in", ["get", "id"], ["literal", ["ISR", "PSX"]]], 0, 1] : 0.83 } },
      { id: "selected-outline-casing", type: "line", source: "places", filter: ["==", ["get", "id"], ""], paint: { "line-color": "#fff9df", "line-width": 4, "line-opacity": 0.96 } },
      { id: "selected-outline", type: "line", source: "places", filter: ["==", ["get", "id"], ""], paint: { "line-color": "#135641", "line-width": 2.2, "line-opacity": 1 } },
      ...(scope === "districts" ? [
        { id: "bd-border-casing" as const, type: "line" as const, source: "context", filter: ["==", ["get", "id"], "BGD"] as FilterSpecification, maxzoom: 6.05, paint: { "line-color": "#17432d", "line-width": 3.2, "line-opacity": 0.75 } },
        { id: "bd-border" as const, type: "line" as const, source: "context", filter: ["==", ["get", "id"], "BGD"] as FilterSpecification, maxzoom: 6.05, paint: { "line-color": "#fff8dc", "line-width": 1.1, "line-opacity": 0.7 } },
      ] : []),
      ...(scope === "world" ? [{ id: "palestine-outline" as const, type: "line" as const, source: "palestine-outline", paint: { "line-color": palette.line, "line-width": 1.2 } }] : []),
    ],
  };
}

export function MapAdapter({ scope, places, sourceUrl, overview, selectedIds, activeId, theme, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const labelsRef = useRef<Array<{ remove: () => void }>>([]);
  const selectRef = useRef(onSelect);
  const initialFocus = useRef(true);
  const initialActiveId = useRef(activeId);
  const perspectiveRef = useRef(false);
  const lastViewportMobile = useRef<boolean | null>(null);
  const [viewportMobile, setViewportMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 1060);
  const [perspective, setPerspective] = useState(false);
  const [viewControlsOpen, setViewControlsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { perspectiveRef.current = perspective; }, [perspective]);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let resizeObserver: ResizeObserver | undefined;
    async function start() {
      try {
        const { Map, Marker, Popup, setWorkerUrl } = await import("maplibre-gl");
        if (disposed || !container.current) return;
        setWorkerUrl(publicPath("/maplibre/maplibre-gl-worker.mjs"));
        const mobile = window.innerWidth <= 1060;
        lastViewportMobile.current = mobile;
        const camera = { pitch: 0, bearing: 0 };
        const map = new Map({
          container: container.current,
          style: mapStyle(scope, "atlas", sourceUrl),
          center: scope === "world" ? (mobile ? [82, 22] : [12, 20]) : scope === "regions" && overview ? [overview.center[0], overview.center[1]] : [90.3, 23.8],
          zoom: scope === "world" ? (mobile ? 2.6 : 1.2) : scope === "regions" ? overview?.bounds && overview.bounds[2] - overview.bounds[0] >= 180 ? (mobile ? 2.1 : 2.5) : 3 : (mobile ? 4.8 : 6.2),
          minZoom: scope === "world" ? 0.8 : scope === "regions" ? 1.5 : 4.5,
          maxZoom: scope === "world" ? 5.5 : scope === "districts" ? 6.3 : 11,
          maxBounds: scope === "districts" ? [[65, 3], [107, 39]] : undefined,
          ...camera,
          maxPitch: 60,
          canvasContextAttributes: { antialias: true },
          attributionControl: false,
        });
        mapRef.current = map;
        const hoverLabel = new Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "atlas-map-tooltip" });
        map.on("load", () => {
          fitOverview(map, scope, places, overview, mobile, perspectiveRef.current);
          if (scope === "districts") {
            const nearby = [
              ...countries.filter((item) => ["BGD", "NPL", "BTN", "MMR"].includes(item.id)).map((item) => ({ name: item.name, id: item.id, center: item.center })),
              { name: "India", id: "IND", center: [87.6, 26] },
              { name: "Bay of Bengal", id: "SEA", center: [89.9, 21] },
            ];
            for (const country of nearby) {
              const element = document.createElement("span");
              element.className = `map-country-label${country.id === "BGD" ? " is-home" : ""}${country.id === "SEA" ? " is-water" : ""}`;
              element.textContent = country.name;
              element.setAttribute("aria-hidden", "true");
              map.on("zoom", () => { element.style.display = map.getZoom() > 6.3 || mobile && ["NPL", "BTN"].includes(country.id) ? "none" : ""; });
              if (mobile && ["NPL", "BTN"].includes(country.id)) element.style.display = "none";
              labelsRef.current.push(new Marker({ element, anchor: "center" }).setLngLat(country.center as [number, number]).addTo(map));
            }
          } else if (scope === "world") {
            const names: Record<string, string> = { USA: "United States", BRA: "Brazil", ZAF: "South Africa", IND: "India", CHN: "China", RUS: "Russia", AUS: "Australia", BGD: "Bangladesh" };
            for (const country of countries.filter((item) => item.id in names)) {
              const element = document.createElement("span");
              element.className = `map-country-label is-world${country.id === "BGD" ? " is-home" : ""}`;
              element.textContent = names[country.id];
              element.setAttribute("aria-hidden", "true");
              if (country.id === "BGD") {
                const update = () => { element.style.display = map.getZoom() < 3 ? "none" : ""; };
                map.on("zoom", update);
                update();
              }
              labelsRef.current.push(new Marker({ element, anchor: "center" }).setLngLat(country.center as [number, number]).addTo(map));
            }
          }
          setReady(true);
          const choosePlace = (event: { features?: Array<{ properties: { id?: unknown } }> }) => {
            const id = event.features?.[0]?.properties?.id;
            if (typeof id === "string") selectRef.current(scope === "world" ? resolveWorldPlaceId(id) : id);
          };
          map.on("click", "places-fill", choosePlace);
          map.on("click", "selected-depth", choosePlace);
          const showLabel = (event: { features?: Array<{ properties: { id?: unknown } }>; lngLat: { lng: number; lat: number } }) => {
            const id = event.features?.[0]?.properties?.id;
            const place = typeof id === "string" ? places.find((item) => item.id === (scope === "world" ? resolveWorldPlaceId(id) : id)) : undefined;
            if (place) hoverLabel.setLngLat(event.lngLat).setText(place.displayName ?? place.name).addTo(map);
          };
          for (const layer of ["places-fill", "selected-depth"]) {
            if (window.matchMedia("(hover: hover)").matches) map.on("mousemove", layer, showLabel);
            map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; hoverLabel.remove(); });
          }
        });
        map.on("error", () => setError(true));
        resizeObserver = new ResizeObserver(() => {
          map.resize();
          const nextMobile = window.innerWidth <= 1060;
          if (lastViewportMobile.current !== nextMobile) {
            lastViewportMobile.current = nextMobile;
            setViewportMobile(nextMobile);
          }
        });
        resizeObserver.observe(container.current);
      } catch {
        setError(true);
      }
    }
    void start();
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      labelsRef.current.forEach((label) => label.remove());
      labelsRef.current = [];
      mapRef.current?.getCanvas().style.removeProperty("cursor");
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [places, scope, sourceUrl, overview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const camera = perspectiveCamera(scope, viewportMobile);
    map.easeTo({ pitch: perspective ? camera.pitch : 0, bearing: perspective ? camera.bearing : 0, duration: reducedMotion ? 0 : 650 });
    map.setLayoutProperty("selected-depth", "visibility", perspective ? "visible" : "none");
  }, [perspective, ready, scope, viewportMobile]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || activeId) return;
    fitOverview(map, scope, places, overview, viewportMobile, perspectiveRef.current);
  }, [viewportMobile, ready, activeId, scope, places, overview]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const palette = themes[theme];
    const featureId: ExpressionSpecification = scope === "world"
      ? ["case", ["==", ["get", "id"], "ISR"], "PSX", ["get", "id"]]
      : ["get", "id"];
    map.setPaintProperty("ocean", "background-color", palette.ocean);
    map.setPaintProperty("selected-depth", "fill-extrusion-color", palette.selected);
    map.setPaintProperty("selected-depth", "fill-extrusion-opacity", 0.44);
    map.setFilter("selected-depth", activeId === "PSX" && scope === "world"
      ? ["in", ["get", "id"], ["literal", ["ISR", "PSX"]]]
      : ["==", ["get", "id"], activeId ?? ""]);
    for (const layer of ["selected-outline-casing", "selected-outline"]) map.setFilter(layer, activeId === "PSX" && scope === "world"
      ? ["in", ["get", "id"], ["literal", ["ISR", "PSX"]]]
      : ["==", ["get", "id"], activeId ?? ""]);
    if (scope === "districts") map.setPaintProperty("bd-terrain", "raster-opacity", theme === "ink" ? 0.18 : theme === "dusk" ? 0.42 : 1);
    else map.setPaintProperty("world-terrain", "raster-opacity", theme === "ink" ? 0.22 : theme === "dusk" ? 0.42 : 1);
    if (scope === "districts") {
      map.setPaintProperty("context-land", "fill-color", palette.land);
      map.setPaintProperty("context-land", "fill-opacity", 0.93);
      map.setPaintProperty("context-line", "line-color", palette.line);
      map.setPaintProperty("context-tone", "fill-opacity", theme === "ink" || theme === "dusk" ? 0.04 : 0.28);
      map.setPaintProperty("bd-tint", "fill-opacity", theme === "ink" || theme === "dusk" ? 0.04 : 0.35);
      map.setPaintProperty("bd-rivers", "line-opacity", 0.4);
      map.setPaintProperty("district-line-casing", "line-opacity", 0.36);
    }
    map.setPaintProperty("graticule", "line-opacity", 0.19);
    const selectedLine: ExpressionSpecification = ["==", featureId, activeId ?? ""];
    map.setPaintProperty("places-line", "line-color", scope === "districts"
      ? ["interpolate", ["linear"], ["zoom"], 5, ["case", selectedLine, palette.selected, "#f5f0d8"], 6.3, ["case", selectedLine, palette.selected, "#a8baa7"]] as unknown as ExpressionSpecification
      : ["case", selectedLine, palette.selected, palette.line] as ExpressionSpecification);
    if (scope === "world") {
      map.setPaintProperty("palestine-outline", "line-color", activeId === "PSX" ? palette.selected : palette.line);
      map.setPaintProperty("palestine-outline", "line-width", activeId === "PSX" ? 2.6 : 1.2);
    }
    map.setPaintProperty("places-line", "line-width", scope === "districts"
      ? ["interpolate", ["linear"], ["zoom"], 5, ["case", selectedLine, 2.2, 0.9], 6.3, ["case", selectedLine, 2.2, 0.7]] as unknown as ExpressionSpecification
      : ["case", selectedLine, scope === "world" ? 2.8 : 2.2, scope === "world" ? 1.2 : 0.9] as ExpressionSpecification);
    const regionalColors = scope === "districts"
      ? ["#dce5bf", "#cbdcb9", "#e7dfb6", "#c5d9c5", "#dfd4b0"]
      : ["#d9e5b2", "#afcfa8", "#e9d7a2", "#b9d9cf", "#e8bd9a"];
    const regionalColor = ["match", featureId,
      ...places.flatMap((place, index) => [place.id, regionalColors[index % regionalColors.length]]),
      palette.land,
    ] as unknown as ExpressionSpecification;
    const worldColor: ExpressionSpecification = ["match", ["get", "continent"],
      "Africa", "#dfc899", "Asia", "#bdd49f", "Europe", "#d4d6a7",
      "North America", "#a9d4b3", "South America", "#c5d79e",
      "Oceania", "#e7bd9d", "Antarctica", "#e4e9dd", palette.land,
    ];
    map.setPaintProperty("places-fill", "fill-color", [
      "case",
      ["==", featureId, activeId ?? ""], palette.selected,
      ["in", featureId, ["literal", selectedIds]], palette.visited,
      theme === "ink" || theme === "dusk" ? palette.land : scope === "world" ? worldColor : regionalColor,
    ]);
    map.setPaintProperty("places-fill", "fill-opacity", [
      "case", ["==", featureId, activeId ?? ""], scope === "world" ? 0.32 : scope === "districts" ? 0.2 : 0.32,
      ["in", featureId, ["literal", selectedIds]], 0.62,
      theme === "ink" || theme === "dusk" ? 0.48 : scope === "districts" ? 0.025 : 0.06,
    ]);
  }, [theme, selectedIds, activeId, ready, scope, places]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (initialFocus.current) {
      initialFocus.current = false;
      if (activeId === initialActiveId.current) return;
    }
    const place = places.find((item) => item.id === activeId);
    if (!place) return;
    const map = mapRef.current;
    const padding = mapPadding(viewportMobile, true);
    const camera = perspectiveRef.current ? perspectiveCamera(scope, viewportMobile) : { pitch: 0, bearing: 0 };
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
    const bounds = place.bounds;
    if (bounds?.length === 4 && bounds.every(Number.isFinite) && bounds[2] > bounds[0] && bounds[3] > bounds[1] && bounds[2] - bounds[0] < 180) {
      map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], { padding, maxZoom: scope === "world" ? 5.2 : scope === "regions" ? 9 : 6.7, ...camera, duration });
    } else {
      map.flyTo({ center: [place.center[0], place.center[1]], zoom: scope === "world" ? 2.6 : 8, padding, ...camera, duration });
    }
  }, [activeId, places, ready, scope, viewportMobile]);

  function zoomBy(step: number) {
    const map = mapRef.current;
    const canvas = container.current;
    if (!map || !canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const sheetTop = viewportMobile
      ? canvas.closest(".explorer-layout")?.querySelector(".detail-panel")?.getBoundingClientRect().top
      : undefined;
    const point = zoomFocus(bounds.width, bounds.height, sheetTop === undefined ? undefined : sheetTop - bounds.top);
    map.easeTo({ zoom: Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), map.getZoom() + step)), around: map.unproject(point), duration: 250 });
  }

  return (
    <div className="map-frame">
      <div className="map-canvas" ref={container} role="img" aria-label={scope === "world" ? "Interactive world map; use the adjacent searchable list for keyboard access" : scope === "regions" ? "Interactive map of country regions; use the adjacent searchable list for keyboard access" : "Interactive map of Bangladesh districts; use the adjacent searchable list for keyboard access"} />
      {!ready && !error && <div className="map-state" role="status"><span>Loading map boundaries</span><small>Local atlas data</small></div>}
      {error && <div className="map-state map-error">Map unavailable. Search and select places in the list.</div>}
      <div className="map-zoom" aria-label="Map zoom controls">
        <button type="button" onClick={() => zoomBy(1)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(-1)} aria-label="Zoom out">−</button>
      </div>
      {scope !== "world" && <div className="map-depth-control">
        <button className="map-view-trigger" type="button" aria-expanded={viewControlsOpen} aria-controls="map-view-options" onClick={() => setViewControlsOpen((current) => !current)}>View <span aria-hidden="true">{viewControlsOpen ? "−" : "+"}</span></button>
        <div id="map-view-options" className={`map-view-options ${viewControlsOpen ? "is-open" : ""}`}>
          <div className="map-view-switch" role="group" aria-label="Map perspective">
            <button type="button" className={!perspective ? "is-on" : ""} aria-pressed={!perspective} onClick={() => setPerspective(false)}>Flat</button>
            <button type="button" className={perspective ? "is-on" : ""} aria-pressed={perspective} onClick={() => setPerspective(true)}>Tilt</button>
          </div>
        </div>
        {perspective && <small>Illustrative depth</small>}
      </div>}
    </div>
  );
}
