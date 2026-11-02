// Reine Helfer für MixKachel (Mosaikfeld aus Mischungstönen). Keine Imports, läuft in node --test.

/** Gewichtete Tonliste [[hex, gewicht]] aus Mischungsanteilen × Tönen je Mosaik. */
export function mixToene(mix) {
  const out = [];
  for (const { anteil = 0, toene = [] } of mix || []) {
    const summe = toene.reduce((s, [, w]) => s + (w || 0), 0) || 1;
    for (const [hex, w] of toene) out.push([hex, (anteil * (w || 0)) / summe]);
  }
  return out.filter(([hex, w]) => /^#[0-9a-f]{3,8}$/i.test(String(hex)) && w > 0);
}

/** Steinfarben für ein Raster, deterministisch (LCG, Seed 4711). */
export function mixRaster(toene, n, seed = 4711) {
  const total = toene.reduce((s, [, w]) => s + w, 0);
  if (!total) return [];
  let x = seed >>> 0;
  const rnd = () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: n }, () => {
    let r = rnd() * total;
    for (const [hex, w] of toene) if ((r -= w) <= 0) return hex;
    return toene[toene.length - 1][0];
  });
}
