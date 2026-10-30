"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type PreviewPage = { src: string; label: string; alt: string };
type Turn = { from: number; to: number; direction: "next" | "previous" };

export function spreadAnchor(index: number, pageCount: number) {
  const lastIndex = Math.max(0, pageCount - 1);
  if (index <= 0) return 0;
  if (index >= lastIndex) return lastIndex;
  if (index === 1) return 1;
  return index % 2 === 0 ? index : index - 1;
}

export function spreadAnchors(pageCount: number) {
  const lastIndex = Math.max(0, pageCount - 1);
  const anchors = lastIndex > 0 ? [0, 1] : [0];
  for (let index = 2; index < lastIndex; index += 2) anchors.push(index);
  if (lastIndex > 1) anchors.push(lastIndex);
  return anchors;
}

export function spreadPages(index: number, pageCount: number) {
  const lastIndex = Math.max(0, pageCount - 1);
  const isOpen = index > 0 && index < lastIndex;
  if (!isOpen) return { left: null, right: index };
  if (index === 1) return { left: null, right: 1 };
  if (index % 2 !== 0) return { left: index - 1, right: index };
  return { left: index, right: index + 1 < lastIndex ? index + 1 : null };
}

export function PassportBookPreview({ pages, pageIndex, mode, onPageChange }: { pages: PreviewPage[]; pageIndex: number; mode: "fit" | "actual"; onPageChange: (index: number) => void }) {
  const safeIndex = Math.max(0, Math.min(pageIndex, Math.max(0, pages.length - 1)));
  const [displayedIndex, setDisplayedIndex] = useState(safeIndex);
  const [turn, setTurn] = useState<Turn | null>(null);
  const displayedRef = useRef(safeIndex);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (safeIndex === displayedRef.current) return;
    let finishTimer = 0;
    const startTimer = window.setTimeout(() => {
      const staysOnCurrentSpread = spreadAnchor(safeIndex, pages.length) === spreadAnchor(displayedRef.current, pages.length);
      if (mode === "actual" || staysOnCurrentSpread || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
  }, [safeIndex, mode, pages.length]);

  const visibleIndex = Math.min(displayedIndex, Math.max(0, pages.length - 1));
  const visiblePage = pages[visibleIndex];
  const fromPage = turn ? pages[turn.from] : undefined;
  const toPage = turn ? pages[turn.to] : undefined;
  const renderedIndex = turn ? turn.to : visibleIndex;
  const lastPageIndex = Math.max(0, pages.length - 1);
  const isOpenSpread = renderedIndex > 0 && renderedIndex < lastPageIndex;
  const { left: leftPageIndex, right: rightPageIndex } = spreadPages(renderedIndex, pages.length);
  const leftPage = leftPageIndex === null ? undefined : pages[leftPageIndex];
  const rightPage = rightPageIndex === null ? pages[renderedIndex] ?? visiblePage : pages[rightPageIndex] ?? visiblePage;
  const isInsideBackCover = isOpenSpread && rightPageIndex === null;

  function changePage(direction: -1 | 1) {
    if (turn) return;
    const anchors = spreadAnchors(pages.length);
    const currentAnchor = spreadAnchor(displayedRef.current, pages.length);
    const currentPosition = Math.max(0, anchors.indexOf(currentAnchor));
    const nextPosition = Math.max(0, Math.min(anchors.length - 1, currentPosition + direction));
    const nextIndex = anchors[nextPosition];
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
    className={`passport-flipbook ${isOpenSpread ? "is-spread" : renderedIndex === 0 ? "is-cover" : "is-back-cover"}`}
    role="group"
    aria-label={`Interactive passport preview. ${pages[safeIndex]?.label ?? visiblePage.label}, page ${safeIndex + 1} of ${pages.length}. Swipe or use the arrow keys to change pages.`}
    tabIndex={0}
    onKeyDown={handleKeyDown}
    onPointerDown={handlePointerDown}
    onPointerUp={finishPointer}
    onPointerCancel={finishPointer}
  >
    <span className="passport-cover-shell" aria-hidden="true" />
    <span className="passport-page-block passport-page-block-left" aria-hidden="true" />
    <span className="passport-page-block passport-page-block-right" aria-hidden="true" />
    {isOpenSpread && <div className={`passport-page-left${leftPage ? "" : " is-inside-cover"}`} aria-hidden="true">
      {leftPage && <Image src={leftPage.src} alt="" width={900} height={1260} unoptimized />}
    </div>}
    <div className={`passport-page-base${isInsideBackCover ? " is-inside-cover" : ""}`}>
      <Image src={rightPage.src} alt={turn ? "" : rightPage.alt} width={900} height={1260} priority={safeIndex === 0} unoptimized />
    </div>
    {turn && fromPage && toPage && <div className={`passport-turning-sheet is-${turn.direction}`} aria-hidden="true">
      <span className="passport-sheet-face passport-sheet-front"><Image src={turn.direction === "next" ? fromPage.src : toPage.src} alt="" width={900} height={1260} unoptimized /></span>
      <span className="passport-sheet-face passport-sheet-back"><Image src={turn.direction === "next" ? toPage.src : fromPage.src} alt="" width={900} height={1260} unoptimized /></span>
    </div>}
    <span className="passport-book-gutter" aria-hidden="true" />
    <span className="passport-book-stitch" aria-hidden="true" />
    <span className="passport-swipe-hint" aria-hidden="true">Swipe the page</span>
  </div>;
}
