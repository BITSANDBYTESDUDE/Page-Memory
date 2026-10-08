const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

export function calculateReadingProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const safeScrollY = Number.isFinite(scrollY) ? Math.max(scrollY, 0) : 0;
  const safeScrollHeight = Number.isFinite(scrollHeight) ? Math.max(scrollHeight, 0) : 0;
  const safeViewportHeight = Number.isFinite(viewportHeight) ? Math.max(viewportHeight, 0) : 0;
  const maximumScroll = Math.max(safeScrollHeight - safeViewportHeight, 0);

  if (maximumScroll === 0) {
    return 0;
  }

  return clamp(safeScrollY / maximumScroll, 0, 1);
}
