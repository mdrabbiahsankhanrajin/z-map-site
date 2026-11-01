/**
 * Convert a logical page index into the first page visible in a physical spread.
 * Cover and back-cover pages stay isolated; interior pages are paired.
 */
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
