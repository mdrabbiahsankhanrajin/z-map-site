"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type PreviewPage = { src: string; label: string; alt: string };
type Turn = { from: number; to: number; direction: "next" | "previous" };

export function PassportBookPreview({ pages, pageIndex, mode, onPageChange }: { pages: PreviewPage[]; pageIndex: number; mode: "fit" | "actual"; onPageChange: (index: number) => void }) {
  const safeIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const [displayedIndex, setDisplayedIndex] = useState(safeIndex);
  const [turn, setTurn] = useState<Turn | null>(null);
  const displayedRef = useRef(safeIndex);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (safeIndex === displayedRef.current) return;
    let finishTimer = 0;
    const startTimer = window.setTimeout(() => {
      if (mode === "actual" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        displayedRef.current = safeIndex;
        setDisplayedIndex(safeIndex);
        setTurn(null);
        return;
      }
      const nextTurn: Turn = { from: displayedRef.current, to: safeIndex, direction: safeIndex > displayedRef.current ? "next" : "previous" };
      setTurn(nextTurn);
      finishTimer = window.setTimeout(() => {
        displayedRef.current = safeIndex;
        setDisplayedIndex(safeIndex);
        setTurn(null);
      }, 680);
    }, 0);
    return () => { window.clearTimeout(startTimer); window.clearTimeout(finishTimer); };
  }, [safeIndex, mode]);

  const visibleIndex = Math.min(displayedIndex, Math.max(0, pages.length - 1));
  const visiblePage = pages[visibleIndex];
  const fromPage = turn ? pages[turn.from] : undefined;
  const toPage = turn ? pages[turn.to] : undefined;
  const leftPageIndex = turn ? Math.max(0, turn.to - 1) : Math.max(0, visibleIndex - 1);
  const leftPage = pages[leftPageIndex];

  function changePage(direction: -1 | 1) {
    if (turn) return;
    const nextIndex = Math.max(0, Math.min(pages.length - 1, displayedRef.current + direction));
    if (nextIndex !== displayedRef.current) onPageChange(nextIndex);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") { event.preventDefault(); changePage(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); changePage(1); }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || turn || mode === "actual") return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    dragRef.current = null;
    event.currentTarget.classList.remove("is-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.15) changePage(dx < 0 ? 1 : -1);
  }

  if (!visiblePage) return <div className="passport-flipbook passport-flipbook-empty" aria-hidden="true"><div><span>ATLAS</span><strong>Your marked places will appear here.</strong></div></div>;
  if (mode === "actual") return <Image className="passport-active-page" src={pages[safeIndex]?.src ?? visiblePage.src} alt={pages[safeIndex]?.alt ?? visiblePage.alt} width={900} height={1260} unoptimized />;

  return <div
    className={`passport-flipbook ${visibleIndex === 0 ? "is-cover" : "is-spread"}`}
    role="group"
    aria-label={`Interactive passport preview. ${pages[safeIndex]?.label ?? visiblePage.label}, page ${safeIndex + 1} of ${pages.length}. Swipe or use the arrow keys to change pages.`}
    tabIndex={0}
    onKeyDown={handleKeyDown}
    onPointerDown={handlePointerDown}
    onPointerUp={finishPointer}
    onPointerCancel={finishPointer}
  >
    {visibleIndex > 0 && leftPage && <div className="passport-page-left" aria-hidden="true">
      <Image src={leftPage.src} alt="" width={900} height={1260} unoptimized />
    </div>}
    <div className="passport-page-stack" aria-hidden="true" />
    <div className="passport-page-stack passport-page-stack-two" aria-hidden="true" />
    <div className="passport-page-base">
      <Image src={(turn ? toPage : visiblePage)?.src ?? visiblePage.src} alt={turn ? "" : visiblePage.alt} width={900} height={1260} priority={safeIndex === 0} unoptimized />
    </div>
    {turn && fromPage && toPage && <div className={`passport-turning-sheet is-${turn.direction}`} aria-hidden="true">
      <span className="passport-sheet-face passport-sheet-front"><Image src={turn.direction === "next" ? fromPage.src : toPage.src} alt="" width={900} height={1260} unoptimized /></span>
      <span className="passport-sheet-face passport-sheet-back"><Image src={turn.direction === "next" ? toPage.src : fromPage.src} alt="" width={900} height={1260} unoptimized /></span>
    </div>}
    <span className="passport-book-gutter" aria-hidden="true" />
    <span className="passport-swipe-hint" aria-hidden="true">Swipe the page</span>
  </div>;
}
