// src/components/Katalog/looksLayout.js – Raster und Produktnamen für „Ganze Räume ansehen“
// (LooksBlock). QM R3 Küche/Bad/Outdoor, 02.11.2026. Pure, ohne "@/"-Imports (node --test).
//
// Raster: Querformate standen in 4:5-Rahmen als Letterbox mit großen Leinenflächen oben und
// unten neben schmal gerahmten Hochformaten. Jetzt bekommt jedes Bild einen Rahmen nach
// seinem Format: im Hochformat-Raster (Mehrheit hoch) Hochformate 4:5 in einer Spalte,
// Querformate 8:5 über zwei Spalten – ab sm ergeben beide dieselbe Zeilenhöhe
// (½ · 5/4 = 1 · 5/8). grid-flow-dense füllt Lücken. Bilder selbst bleiben unverändert
// (object-contain).

const istHoch = (b) => Boolean(b?.width && b?.height && b.width / b.height < 0.9);
const ar = (b) => (b?.width && b?.height ? b.width / b.height : null);
// QM R4: Abweichung, bis zu der ein Bild seinen Rahmen ab sm füllt (object-cover, mittig) statt
// mit Leinenbalken daneben zu stehen. 2:3-Raumfotos im 2:3-Rahmen, 3:4 (−11 %) ebenso.
export const LOOK_TOLERANZ = 0.15;

/**
 * Raster der Raumbilder. QM R4 (02.11.2026): Hochformate (meist 2:3) standen in 4:5-Rahmen mit
 * ~28 px Leinenbalken links und rechts. Jetzt:
 *  - am Handy (eine Spalte) und beim einzelnen Raum: Rahmen im Seitenverhältnis des Fotos
 *    (`aspect-(--look-ar)`, style `{"--look-ar": "w / h"}`) – keine Balken, kein Beschnitt;
 *  - ab sm im Hochformat-Raster: Hochformat 2:3, Querformat 4:3 über zwei Spalten (gleiche
 *    Zeilenhöhe: ½ · 3/2 = 1 · 3/4). Liegt das Foto innerhalb LOOK_TOLERANZ am Rahmen, füllt es
 *    ihn (object-cover), sonst bleibt es ganz sichtbar (object-contain).
 * @param {Array<{width?: number, height?: number}>} bilder
 * @returns {{ hoch: boolean, ul: string, zellen: Array<{ li: string, rahmen: string, bild: string, style: object|undefined, sizes: string, einzelRahmen: string, einzelFigur: string }> }}
 */
export function lookRaster(bilder = []) {
  const hoch = bilder.filter(istHoch).length * 2 >= bilder.length;
  const zellen = bilder.map((b) => {
    const h = istHoch(b);
    const a = ar(b);
    const style = a ? { "--look-ar": `${b.width} / ${b.height}` } : undefined;
    const basis = a ? "aspect-(--look-ar)" : h ? "aspect-2/3" : "aspect-3/2";
    const passt = (ziel) => (a && Math.abs(a / ziel - 1) <= LOOK_TOLERANZ ? "object-cover" : "object-cover sm:object-contain");
    const einzel = { einzelRahmen: basis, einzelFigur: h ? "lg:col-span-5" : "lg:col-span-7" };
    if (!hoch) return { li: "", rahmen: `${basis} sm:aspect-3/2`, bild: passt(3 / 2), style, sizes: "(min-width: 1024px) 45vw, 100vw", ...einzel };
    if (h) return { li: "", rahmen: `${basis} sm:aspect-2/3`, bild: passt(2 / 3), style, sizes: "(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw", ...einzel };
    return { li: "sm:col-span-2", rahmen: `${basis} sm:aspect-4/3`, bild: passt(4 / 3), style, sizes: "(min-width: 1024px) 62vw, 100vw", ...einzel };
  });
  return { hoch, ul: hoch ? "grid-flow-dense sm:grid-cols-2 lg:grid-cols-3" : "lg:grid-cols-2", zellen };
}

/**
 * Anzeigename eines Produkts im Raum: fremde Marke vorangestellt; gleichnamige Produkte der
 * Marke (Memory Spiegel/Armatur/WC …) tragen die Kategorie in Klammern.
 * @param {{slug: string, name: string, marke: string, kategorie?: string}} x
 * @param {{ markeName: string, markenName?: string, sortiment?: Array<{slug: string, name: string}>, kategorie: (k: string) => string }} o
 * @returns {string}
 */
export function lookName(x, { markeName, markenName, sortiment = [], kategorie }) {
  const anzeige = markenName === markeName ? x.name : `${markenName || x.marke} ${x.name}`;
  const doppelt = sortiment.some((y) => y.slug !== x.slug && y.name === x.name);
  return doppelt && x.kategorie ? `${anzeige} (${kategorie(x.kategorie)})` : anzeige;
}
