// src/lib/shop/dedupe.js – no imports, so node:test can load it directly.
// Backoffice duplicates (QM R3-produkt P2-1: "Torii" 3x, "Side"/"Tape" 2x on
// /produkte/sofas-couches, each with the identical main picture): the same
// piece entered several times under different path_fields. Listings show it
// once – the first entry wins, so the backoffice order stays. Only brand +
// name + main image together count as "the same piece": two products that
// merely share a name (Reeves lounge vs. semi-round, no picture yet) stay
// separate. The duplicate product pages keep working; cleaning up the
// backoffice rows themselves is R7.
export function dedupeKey(p) {
  if (!p?.image || !p?.name) return null;
  const norm = (v) => String(v || "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
  return `${norm(p.brand)}|${norm(p.name)}|${p.image}`;
}

export function dedupeShopProducts(products) {
  const seen = new Set();
  return (products || []).filter((p) => {
    const key = dedupeKey(p);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
