"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { publicPath } from "@/lib/publicPath";

const INITIAL_ROTATION: [number, number] = [25, -15];

export function InsightsGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = new AbortController();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const projection = geoOrthographic().clipAngle(90).precision(0.7);
    const graticule = geoGraticule10();
    let countries: FeatureCollection | null = null;
    let rotation: [number, number] = [...INITIAL_ROTATION];
    let animationFrame = 0;
    let lastDrawTime = performance.now();
    let inView = true;
    let hovered = false;
    let dragging = false;
    let dragStart: { pointerId: number; x: number; y: number; rotation: [number, number] } | null = null;

    const draw = () => {
      if (!countries) return;
      const size = canvas.getBoundingClientRect().width;
      if (size < 1) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const pixels = Math.max(1, Math.round(size * pixelRatio));
      if (canvas.width !== pixels || canvas.height !== pixels) {
        canvas.width = pixels;
        canvas.height = pixels;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, size, size);
      projection.translate([size / 2, size / 2]).scale(size * 0.472).rotate(rotation);
      const renderPath = geoPath(projection, context);

      context.beginPath();
      renderPath({ type: "Sphere" });
      context.fillStyle = "#f4f0e4";
      context.fill();

      context.beginPath();
      renderPath(graticule);
      context.strokeStyle = "rgba(109, 135, 120, 0.28)";
      context.lineWidth = Math.max(0.65, size / 800);
      context.stroke();

      context.fillStyle = "#91a18d";
      context.strokeStyle = "#f7f1e3";
      context.lineWidth = Math.max(0.8, size / 610);
      context.lineJoin = "round";
      for (const country of countries.features) {
        context.beginPath();
        renderPath(country);
        context.fill();
        context.stroke();
      }

      context.beginPath();
      renderPath({ type: "Sphere" });
      context.strokeStyle = "rgba(52, 91, 75, 0.72)";
      context.lineWidth = Math.max(1, size / 460);
      context.stroke();
    };

    const tick = (time: number) => {
      const elapsed = Math.min(50, time - lastDrawTime);
      if (elapsed >= 32 && countries && inView && !reducedMotion.matches && !hovered && !dragging && !document.hidden) {
        rotation = [(rotation[0] + elapsed * 0.0015) % 360, rotation[1]];
        lastDrawTime = time;
        draw();
      } else if (elapsed >= 32 && (reducedMotion.matches || hovered || dragging || document.hidden)) {
        lastDrawTime = time;
      }
      animationFrame = requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(draw);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) draw();
    }, { threshold: 0.05 });
    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);

    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      dragStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, rotation: [...rotation] };
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add("is-dragging");
    };
    const pointerMove = (event: PointerEvent) => {
      if (!dragStart || dragStart.pointerId !== event.pointerId) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      rotation = [dragStart.rotation[0] + dx * 0.24, Math.max(-45, Math.min(45, dragStart.rotation[1] - dy * 0.18))];
      draw();
    };
    const endDrag = (event: PointerEvent) => {
      if (!dragStart || dragStart.pointerId !== event.pointerId) return;
      dragStart = null;
      dragging = false;
      canvas.classList.remove("is-dragging");
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const pointerEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovered = true;
    };
    const pointerLeave = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovered = false;
    };
    const motionChanged = () => draw();

    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerenter", pointerEnter);
    canvas.addEventListener("pointerleave", pointerLeave);
    reducedMotion.addEventListener("change", motionChanged);

    fetch(publicPath("/data/insights-atlas/world-globe-data.geojson"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Globe data failed with ${response.status}`);
        return response.json() as Promise<FeatureCollection>;
      })
      .then((data) => {
        countries = data;
        draw();
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.warn(error);
      });
    animationFrame = requestAnimationFrame(tick);

    return () => {
      controller.abort();
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      canvas.removeEventListener("pointerenter", pointerEnter);
      canvas.removeEventListener("pointerleave", pointerLeave);
      reducedMotion.removeEventListener("change", motionChanged);
    };
  }, []);

  return <span className={`insights-globe-disc${ready ? " is-live" : ""}`}>
    <Image className="insights-globe-fallback" src={publicPath("/data/insights-atlas/world-globe.svg")} alt="" width={640} height={640} loading="eager" unoptimized />
    <canvas ref={canvasRef} className="insights-globe-canvas" />
  </span>;
}
