// src/components/ShopCatalog/gridSpan.js – rein, ohne Importe (node:test).
// QM wm-r4: no tile alone beside an empty half row.

/** Two-column range: an odd group opens with one tile across both columns. */
export function spanTile(count, index) {
  return index === 0 && count % 2 === 1;
}

/**
 * Three-column groups with 3n+2 entries: the entry with the widest picture
 * (≥ 1.7:1, no cut-out) spans two columns, so the last row has no hole. Its
 * frame is 3:1 – the same height as the 3:2 tiles beside it.
 * @param {Array<{id: string, image?: {width?: number, height?: number}}>} entries
 * @param {Record<string, string>} [cutouts] ids shown as cut-outs (never wide)
 * @returns {string|null} id of the wide entry
 */
export function spanEntry(entries, cutouts = {}) {
  const list = Array.isArray(entries) ? entries : [];
  if (list.length < 5 || list.length % 3 !== 2) return null;
  const wide = list
    .filter((b) => b?.image?.width && b.image.height && !cutouts[b.id])
    .map((b) => ({ id: b.id, r: b.image.width / b.image.height }))
    .filter((x) => x.r >= 1.7)
    .sort((a, b) => b.r - a.r)[0];
  return wide ? wide.id : null;
}
