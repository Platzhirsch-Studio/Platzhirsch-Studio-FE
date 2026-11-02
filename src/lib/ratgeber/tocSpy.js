// Scrollspy for the Ratgeber table of contents (TocSpy.js). Pure, no DOM.
/**
 * The section the reader is in: the last heading whose top has passed the
 * reading line; before the first heading none (null).
 * @param {Array<{id: string, top: number}>} tops viewport tops in document order
 * @param {number} line reading line in px from the top of the viewport
 * @param {{atEnd: boolean, viewport: number}} [end] page scrolled to the bottom + viewport height
 * @returns {string|null}
 */
export function activeTocId(tops, line, end = null) {
  let current = null;
  for (const t of tops || []) {
    if (Number.isFinite(t.top) && t.top <= line) current = t.id;
  }
  // QM content-legal r3 (iPad quer): at the end of the page the last sections can
  // never reach the reading line – then the last heading in view wins.
  if (end && end.atEnd) {
    for (const t of tops || []) if (Number.isFinite(t.top) && t.top < end.viewport) current = t.id;
  }
  return current;
}
