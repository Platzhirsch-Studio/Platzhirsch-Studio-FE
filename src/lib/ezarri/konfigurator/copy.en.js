// src/lib/ezarri/konfigurator/copy.en.js – English texts of the configurator (Welle 2).
//
// Same export names and structure as ./copy.js (German source). Own texts:
// "you", facts instead of adjectives, no superlatives, no prices.
// Manufacturer information is given as "according to Ezarri". British English.
//
// Pure: no imports. Server, client and node --test.

export const SEITE = Object.freeze({
  crumb: "Configurator",
  eyebrow: "Ezarri · configurator",
  title: "Design your pool",
  lead: "Choose mosaic, blend, grout and pool shape and see the water with it – in 3D, in the browser, without signing up.",
  metaTitle: "Pool mosaic configurator for Ezarri glass mosaic | Platzhirsch",
  metaDescription: "Design a pool in 3D: your own size and shape, every Ezarri mosaic, blends, grouts, water and light. With quantities, print sheet and sample request in Lochau.",
  hinweisFarbe: "Screen colours are an approximation. Glass looks different in daylight and under water – look at the samples before you decide.",
  hinweisMessung: "Tile colours measured from Ezarri's product images; gloss and reflection according to the Ezarri configurator.",
  hinweisDaten: "Quantities are an estimate (Ezarri factors, 10 % reserve). The binding quantity is determined by your tiler from the site measurement.",
  hinweisVerlegung: "Installation is carried out by a specialist tiling firm.",
  linkUngueltig: "The link did not contain a valid design. We are showing the starting design.",
});

export const TABS = Object.freeze([
  { id: "mosaik", label: "Mosaic" },
  { id: "becken", label: "Pool" },
  { id: "wasser", label: "Water & light" },
  { id: "mengen", label: "Quantities" },
]);

export const MODI_LABEL = Object.freeze({
  mosaik: { label: "One mosaic", sub: "a single Ezarri reference" },
  mix: { label: "Your own blend", sub: "up to 4 mosaics with shares" },
  rezept: { label: "Ezarri blend", sub: "ready-made recipes, changeable" },
  pattern: { label: "Motif grid", sub: "20 Ezarri patterns, 2⁠–⁠3 colours" },
});

export const SZENEN_LABEL = Object.freeze({
  pool: "Pool",
  whirlpool: "Hot tub",
  bad: "Shower & bathroom",
  kueche: "Kitchen splashback",
});

export const FORM_LABEL = Object.freeze({
  rechteck: "Rectangle",
  radius: "Rounded corners",
  rund: "Rounded ends",
  l: "L-shape",
  kreis: "Round",
  quadrat: "Square",
  nische: "Shower niche",
  rueckwand: "Wall area",
});

export const TREPPE_LABEL = Object.freeze({
  roemisch: "Roman steps",
  eck: "Corner steps",
  voll: "Full width",
  keine: "No steps",
});

export const RAND_LABEL = Object.freeze({
  skimmer: { label: "Skimmer", sub: "water approx. 15 cm below the edge" },
  ueberlauf: { label: "Overflow gutter", sub: "water up to the edge, gutter all round" },
  infinity: { label: "Infinity edge", sub: "water flows over on the deep side" },
});

export const FORMAT_LABEL = Object.freeze({ 25: "25 mm", 50: "50 mm", hexa: "Hexa" });

export const WASSER_LABEL = Object.freeze({
  bewegt: "Moving",
  ruhig: "Still",
  leer: "Empty",
});

export const WASSERTON_LABEL = Object.freeze({
  klar: { label: "Clear", sub: "chlorine or salt system, well filtered" },
  naturpool: { label: "Natural pool", sub: "biologically filtered, greener" },
  salz: { label: "Sea water", sub: "slightly cooler in tone" },
});

export const ZEIT_LABEL = Object.freeze({ morgen: "Morning", mittag: "Midday", abend: "Evening", nacht: "Night" });

export const LED_LABEL = Object.freeze({ aus: "Off", weiss: "White", warm: "Warm white", blau: "Blue", tuerkis: "Turquoise" });

export const LAGE_LABEL = Object.freeze({
  bahnen: "Lane markings on the floor",
  wasserlinie: "Band at the waterline",
  stufen: "Step edges",
});

export const KAMERA_LABEL = Object.freeze({
  uebersicht: "Overview",
  treppe: "Steps",
  wasserlinie: "Waterline",
  unterwasser: "Under water",
  vogel: "From above",
  nah: "Close-up",
});

export const MASSE_LABEL = Object.freeze({
  pool: { l: "Length", b: "Width", tFlach: "Shallow depth", tTief: "Deep depth" },
  whirlpool: { l: "Diameter or side", b: "Width", tTief: "Water depth" },
  bad: { l: "Width of the back wall", b: "Depth of the niche", tTief: "Tiling height" },
  kueche: { l: "Width", tTief: "Height between worktop and wall cabinet" },
});

export const KANAL_NAMEN = Object.freeze(["Base", "Motif", "Accent"]);

export const HINWEIS_MIX = Object.freeze({
  allein: "According to Ezarri, this mosaic cannot be blended. It now stands on its own.",
  voll: "A blend has at most 4 mosaics.",
  vorhanden: "This mosaic is already in the blend.",
  nichtMischbar: "cannot be blended according to Ezarri – on its own only",
});

export const AKTIONEN = Object.freeze({
  muster: "Request samples",
  musterSub: "for your appointment in Lochau",
  angebot: "Request a quote",
  rechner: "Calculate exactly",
  teilen: "Share link",
  kopiert: "Link copied",
  drucken: "Print sheet or save as PDF",
  merken: "Save to wishlist",
  gemerkt: "Saved to wishlist",
  neu: "Start again",
  neuFrage: "Reset all settings?",
  rueck: "Undo",
  vor: "Redo",
  vorher: "Keep as “before”",
  vergleich: "Before / after",
  vergleichEnde: "End comparison",
  drei: "View in 3D",
  zwei: "2D top view",
  ar: "View in your own garden (AR)",
});

/** Sentences for the live summary (aria-live). */
export function zusammenfassung({ szene, becken, mixText, fugeName, formatLabel }) {
  const m = (v) => String(v);
  const ort =
    szene === "pool"
      ? `Pool ${m(becken.l)} × ${m(becken.b)} m, depth ${m(becken.tFlach)} to ${m(becken.tTief)} m`
      : szene === "whirlpool"
        ? `Hot tub ${m(becken.l)} m`
        : szene === "bad"
          ? `Shower niche ${m(becken.l)} × ${m(becken.b)} m, ${m(becken.tTief)} m high`
          : `Kitchen splashback ${m(becken.l)} × ${m(becken.tTief)} m`;
  return `${ort}. ${mixText}. Format ${formatLabel}, grout ${fugeName}.`;
}
