/** Center zoom on the visible map area when a mobile sheet covers its lower half. */
export function zoomFocus(width: number, height: number, sheetTop?: number): [number, number] {
  const visibleHeight = sheetTop === undefined ? height : Math.max(0, Math.min(height, sheetTop));
  return [width / 2, visibleHeight / 2];
}
