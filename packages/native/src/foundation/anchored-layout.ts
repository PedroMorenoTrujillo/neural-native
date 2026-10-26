interface Viewport { width: number; height: number; }
interface Anchor extends Viewport { x: number; y: number; }
interface Insets { top: number; right: number; bottom: number; left: number; }

/** Place a popup inside the visible window, including its keyboard and safe edges. */
export function anchoredLayout(
  view: Viewport, anchor: Anchor, minimumWidth: number, gap: number,
  keyboardTop?: number, insets: Insets = { top: 0, right: 0, bottom: 0, left: 0 },
) {
  const leftEdge = Math.min(view.width / 2, Math.max(16, insets.left));
  const rightEdge = Math.max(leftEdge, view.width - Math.max(16, insets.right));
  const topEdge = Math.min(view.height / 2, Math.max(16, insets.top));
  const bottomEdge = Math.max(topEdge, Math.min(
    view.height - Math.max(16, insets.bottom),
    keyboardTop === undefined ? view.height : keyboardTop - 16,
  ));
  const spacing = Math.max(0, gap);
  // An obscured trigger cannot anchor a popup below the visible region.
  const anchorTop = Math.min(bottomEdge, Math.max(topEdge, anchor.y));
  const anchorBottom = Math.min(bottomEdge, Math.max(topEdge, anchor.y + anchor.height));
  const below = Math.max(0, bottomEdge - anchorBottom - spacing);
  const above = Math.max(0, anchorTop - topEdge - spacing);
  const opensBelow = below >= 160 || below >= above;
  const width = Math.min(Math.max(0, minimumWidth, anchor.width), rightEdge - leftEdge);
  const height = Math.min(320, opensBelow ? below : above);
  return {
    left: Math.max(leftEdge, Math.min(anchor.x, rightEdge - width)), width,
    top: opensBelow ? Math.max(topEdge, Math.min(anchorBottom + spacing, bottomEdge - height)) : null,
    bottom: opensBelow ? null : view.height - anchorTop + spacing,
    height,
  };
}
