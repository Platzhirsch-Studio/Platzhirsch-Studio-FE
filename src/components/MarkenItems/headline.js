// Pure helper of the brand page (no imports), so node --test can load it.
/**
 * Rat 9,5 A8 (T6): categories named in the brand H1 – only the brand's main
 * categories by product count (at least `min` pieces, at most `max`),
 * largest first. Tréca (80 beds) → "Betten …", never a side category first.
 * When no category reaches `min`, the largest ones (at most `max`) are named.
 * @param {Array<{label:string,count:number}>} list groupProductsByCategory().list
 */
export function headlineCategories(list = [], { min = 5, max = 3 } = {}) {
  const byCount = [...(list || [])].filter((c) => c?.count > 0).sort((a, b) => b.count - a.count);
  const main = byCount.filter((c) => c.count >= min);
  return (main.length ? main : byCount).slice(0, max);
}
