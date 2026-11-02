// Küchenplaner – Katalog (Grundformen, Module, Oberflächen, Preistabelle).
//
// Reine Daten, auf Server und Client nutzbar. Das Backoffice (Frappe) hat
// heute weder Küchenmodule noch ein Preisfeld; die Seite holt den Katalog
// deshalb über den Adapter in ./server/store.js, der diese Datei als
// Standard nimmt und eine lokale Überschreibung aus .data/kuechenplaner/
// catalog.json einmischt. Späterer Frappe-Doctype: siehe
// Marktresearch/digital/features/kuechenplaner.md.
//
// Pro-Ausbau (27.10.2026): vollständiger, markenneutraler Modulkatalog.
// Breiten sind Rastermaße (Neff-Planungsratgeber: 10- und 15-cm-Raster,
// EN 1116 60 cm, SMS 55 cm), Gerätenischen aus Herstellerangaben – Quellen in
// src/lib/kuechenplaner/norms.js. Es gibt KEINE Gerätemodelle und KEINE
// Herstellerpreise; wo ein Maß nur ein Platzhalter ist, steht `measure: "fehlt"`.
//
// ALLE PREISE SIND PLATZHALTER. Sie sind Beispielwerte, damit die Rechnung
// sichtbar wird, und müssen vom Inhaber festgelegt werden, bevor die Seite
// öffentlich geht: [Preis vom Inhaber festzulegen].

export const PRICE_PLACEHOLDER_NOTE = "[Preis vom Inhaber festzulegen]";
// QM R2 P2-1: Zahlen erscheinen nur bei placeholder: false (release.js → pricesPublic).
export const PRICE_LABEL = "Richtwert";

/**
 * Grundformen. `walls` = Wände mit Zeilen (a = Rückwand, b = links, c = rechts).
 * `room` = sichtbare Seitenwände. `frei` = Raum aus beliebigen Wänden (Polygon).
 */
export const SHAPES = {
  zeile: { label: "Zeile", walls: ["a"], island: false, hint: "Eine Wand, kompakt", side: { left: false, right: false } },
  l: { label: "L-Form", walls: ["a", "b"], island: false, hint: "Über Eck, viel Fläche", side: { left: true, right: false } },
  u: { label: "U-Form", walls: ["a", "b", "c"], island: false, hint: "Drei Wände, kurze Wege", side: { left: true, right: true } },
  zweizeilig: { label: "Zweizeilig", walls: ["b", "c"], island: false, hint: "Zwei Zeilen gegenüber", side: { left: true, right: true } },
  insel: { label: "Zeile + Insel", walls: ["a"], island: true, hint: "Offen, kommunikativ", side: { left: false, right: false } },
  halbinsel: { label: "Zeile + Halbinsel", walls: ["a"], island: true, peninsula: true, hint: "Insel an der Wand", side: { left: true, right: false } },
  frei: { label: "Freie Raumform", walls: [], island: false, free: true, hint: "Wände frei zeichnen", side: { left: false, right: false } },
};
export const SHAPE_ORDER = ["zeile", "l", "u", "zweizeilig", "insel", "halbinsel", "frei"];

/** Raster: 60 cm (EU, EN 1116) oder 55 cm (Schweiz, SMS – früher SINK). */
export const RASTER = {
  60: { label: "60-cm-Raster (EU)", widths: [30, 45, 60, 90, 120] },
  55: { label: "55-cm-Raster (CH, SMS)", widths: [27.5, 41.25, 55, 82.5, 110] },
};

export const LIMITS = {
  wall: { min: 150, max: 800, step: 5 },
  freeWall: { min: 40, max: 1200, step: 5 },
  angle: { min: 45, max: 270, step: 5 },
  height: { min: 230, max: 320, step: 5 },
  islandLen: { min: 120, max: 400, step: 5 },
  islandDepth: { min: 80, max: 130, step: 5 },
  overhang: { min: 0, max: 40, step: 5 },
  aisle: { min: 90, max: 160, step: 5 },
  islandShift: { min: -200, max: 200, step: 5 },
  body: { min: 140, max: 210, step: 1 },
  plinth: { min: 6, max: 20, step: 1 },
  knee: { min: 60, max: 250, step: 5 },
  slopeDeg: { min: 15, max: 60, step: 1 },
  upGap: { min: 45, max: 70, step: 1 },
};

/** Korpushöhen (cm, ohne Sockel und Platte). Herstellerabhängig – gängige Stufen. */
export const CARCASS_HEIGHTS = [72, 78];

// Breitenlisten. EU: 10- und 15-cm-Raster (Neff, Quelle norms.js), CH: Vielfache von 55.
const EU_BASE = [30, 40, 45, 50, 60, 80, 90, 100, 120];
const CH_BASE = [27.5, 41.25, 55, 82.5, 110];
const EU_UP = [30, 40, 45, 50, 60, 80, 90, 100, 120];
const NARROW = [15, 20, 30];

/**
 * Module. `kind`: base = Unterschrank-Höhe, tall = Hochschrank, upper = Hängeschrank.
 * `units`: Rasterfaktoren für Vorschläge (alt), `eu`/`ch`: erlaubte Breiten in cm.
 * `opts`: Optionen (Schlüssel → { label, values: { code: label }, def }).
 * `clear`: Öffnungsraum vor der Front in cm (Auszüge/Türen) für die Kollisionsprüfung.
 */
export const MODULES = {
  unterschrank: {
    label: "Unterschrank (Auszüge)", name: "Unterschrank", short: "US", kind: "base", code: "u", wall: true,
    units: [0.5, 0.75, 1, 1.5, 2], eu: EU_BASE, ch: CH_BASE, clear: 55, group: "Unterschränke",
    opts: { f: { label: "Front", def: "3", values: { 3: "3 Auszüge", 2: "2 Auszüge", 4: "4 Auszüge", 1: "1 Auszug + Innenauszug", t: "Tür + Fachboden", s: "Schublade + Tür" } } },
  },
  eckschrank: {
    label: "Eckschrank", name: "Eckschrank", short: "EK", kind: "base", code: "e", wall: true,
    units: [1.5, 2], eu: [90, 100, 110, 120], ch: [82.5, 110], clear: 55, group: "Unterschränke",
    opts: { m: { label: "Eckauszug", def: "l", values: { l: "LeMans (Schwenkauszug)", k: "Karussell (L-Eckschrank 90/90)", b: "Blindecke mit Fachboden" } } },
  },
  flaschen: {
    label: "Flaschenauszug", name: "Flaschenauszug", short: "FA", kind: "base", code: "n",
    eu: NARROW, ch: NARROW, clear: 55, group: "Unterschränke",
  },
  muell: {
    label: "Abfallsammler-Auszug", name: "Abfallsammler", short: "AS", kind: "base", code: "m",
    eu: [40, 45, 50, 60], ch: [41.25, 55], clear: 55, group: "Unterschränke",
  },
  regal: {
    label: "Offenes Regal (Unterschrank)", name: "Regal unten", short: "RU", kind: "base", code: "r",
    eu: [15, 20, 30, 40, 45, 60], ch: [15, 20, 27.5, 41.25, 55], clear: 0, group: "Unterschränke",
  },
  passstueck: {
    label: "Passstück / Blende", name: "Passstück", short: "PS", kind: "base", code: "p", free: true,
    eu: [3, 5, 7.5, 10, 15], ch: [3, 5, 7.5, 10, 15], clear: 0, group: "Blenden",
  },
  spuele: {
    label: "Spülenschrank", name: "Spüle", short: "SP", kind: "base", code: "s", wall: true, appliance: "spuele",
    units: [1, 1.5], eu: [60, 80, 90, 100, 120], ch: [55, 82.5, 110], clear: 55, group: "Geräte unten",
    opts: { b: { label: "Becken", def: "1", values: { 1: "Einzelbecken", 5: "1½ Becken", 2: "Doppelbecken" } } },
  },
  geschirrspueler: {
    label: "Geschirrspüler integriert", name: "Geschirrspüler", short: "GS", kind: "base", code: "g", wall: true, appliance: "geschirrspueler",
    units: [1], eu: [45, 60], ch: [55], clear: 60, group: "Geräte unten",
  },
  kochfeld: {
    label: "Kochfeldschrank", name: "Kochfeld", short: "KF", kind: "base", code: "k", wall: false, appliance: "kochfeld",
    units: [1, 1.5], eu: [60, 80, 90, 100, 120], ch: [55, 82.5, 110], clear: 55, group: "Geräte unten",
    opts: {
      k: { label: "Kochfeld", def: "i", values: { i: "Induktion", f: "Flächeninduktion", g: "Gas" } },
      a: { label: "Abzug", def: "a", values: { a: "Automatisch", f: "Flachschirm im Hängeschrank", w: "Wandhaube (Esse)", m: "Muldenlüfter im Kochfeld", i: "Inselhaube", d: "Deckenlüfter", n: "ohne Abzug" } },
    },
  },
  backofenus: {
    label: "Backofen unter der Arbeitsplatte", name: "Backofen unten", short: "BU", kind: "base", code: "bu", appliance: "backofen",
    eu: [60], ch: [55], clear: 55, group: "Geräte unten",
  },
  weinkuehler: {
    label: "Weinkühler (Unterbau)", name: "Weinkühler", short: "WK", kind: "base", code: "w", appliance: "weinkuehler",
    eu: [30, 45, 60], ch: [55], clear: 50, group: "Geräte unten", measure: "fehlt",
  },
  hochschrank: {
    label: "Hochschrank (Vorrat)", name: "Hochschrank", short: "HS", kind: "tall", code: "h",
    units: [0.75, 1], eu: [30, 40, 45, 50, 60], ch: [41.25, 55], clear: 55, group: "Hochschränke",
    opts: {
      f: { label: "Front", def: "4", values: { 4: "2 Auszüge + 2 Türen", 2: "2 Türen", i: "Türen mit Innenauszügen" } },
      h: { label: "Türanschlag", def: "r", values: { r: "rechts", l: "links" } },
    },
  },
  apotheker: {
    label: "Apothekerschrank (Hochauszug)", name: "Apotheker", short: "AP", kind: "tall", code: "a",
    eu: [20, 30, 40], ch: [27.5, 41.25], clear: 60, group: "Hochschränke",
  },
  backofen: {
    label: "Geräte-Hochschrank (Backofen)", name: "Backofen", short: "BO", kind: "tall", code: "o", appliance: "backofen",
    units: [1], eu: [60], ch: [55], clear: 55, group: "Hochschränke",
    opts: { g: { label: "Geräte", def: "1", values: { 1: "Backofen", d: "Backofen + Dampfgarer (kompakt)", m: "Backofen + Mikrowelle (kompakt)", w: "Backofen + Wärmeschublade", 2: "zwei Backöfen" } } },
  },
  kuehlschrank: {
    label: "Kühl-Hochschrank (integriert)", name: "Kühlschrank", short: "KS", kind: "tall", code: "f", appliance: "kuehlschrank",
    units: [1], eu: [60], ch: [55], clear: 60, group: "Hochschränke",
    opts: {
      k: { label: "Gerät", def: "k", values: { k: "Kühl-Gefrier-Kombination (Nische 178)", v: "Vollraum-Kühlschrank (Nische 178)", g: "Gefrierschrank (Nische 178)", 1: "Kühlschrank (Nische 122) + Schrank" } },
      h: { label: "Türanschlag", def: "r", values: { r: "rechts", l: "links" } },
    },
  },
  sidebyside: {
    label: "Side-by-Side (Kühl + Gefrier)", name: "Side-by-Side", short: "SBS", kind: "tall", code: "z", appliance: "kuehlschrank",
    eu: [91, 120], ch: [110], clear: 70, group: "Hochschränke",
    opts: { s: { label: "Ausführung", def: "i", values: { i: "integriert (2 Nischen 178)", f: "freistehend, Edelstahl" } } },
    measureNote: "Freistehend: Breite modellabhängig (91 cm ist ein Platzhalter, Gerätemaß fehlt).",
  },
  weinklima: {
    label: "Weinklimaschrank (Hochschrank)", name: "Weinklima", short: "WS", kind: "tall", code: "q", appliance: "weinkuehler",
    eu: [60], ch: [55], clear: 60, group: "Hochschränke", measure: "fehlt",
  },
  // ---- Hängeschränke (eigene Ebene, wenn eine Wand auf „eigene“ steht) ----
  haengeschrank: {
    label: "Hängeschrank", name: "Hängeschrank", short: "HG", kind: "upper", code: "wh",
    eu: EU_UP, ch: CH_BASE, clear: 40, group: "Hängeschränke",
    opts: { f: { label: "Front", def: "t", values: { t: "Tür", k: "Klappe", g: "Glastür", o: "offen" } } },
  },
  wandbord: {
    label: "Wandbord / Nischenregal", name: "Wandbord", short: "WB", kind: "upper", code: "wb",
    eu: [30, 45, 60, 90, 120, 150, 180], ch: [55, 110, 165], clear: 0, group: "Hängeschränke",
  },
  luefterhs: {
    label: "Hängeschrank mit Flachschirmhaube", name: "Haubenschrank", short: "HH", kind: "upper", code: "wl",
    eu: [60, 90], ch: [55, 82.5], clear: 40, group: "Hängeschränke",
  },
  luecke: {
    label: "Lücke (frei)", name: "Lücke", short: "–", kind: "upper", code: "wx", free: true,
    eu: [15, 30, 45, 60, 90], ch: [27.5, 55, 82.5], clear: 0, group: "Hängeschränke",
  },
};

export const MODULE_ORDER = Object.keys(MODULES).filter((k) => MODULES[k].kind !== "upper");
export const UPPER_ORDER = Object.keys(MODULES).filter((k) => MODULES[k].kind === "upper");
export const MODULE_GROUPS = ["Unterschränke", "Geräte unten", "Hochschränke", "Blenden"];

const cmFormat = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 2 });
/** Zentimeter im deutschen Format („41,25“). */
export function fmtCm(n) {
  return cmFormat.format(n);
}

/** Linien. Ohne Markenlogo, ohne Herstellerplanung, ohne Herstellerpreis. */
export const LINES = {
  binni: {
    label: "Steinküche (Partner Binni)",
    tagline: "Naturstein, robust, klare Linien",
    note: "Linie mit Steinplatten unseres Partners Binni. Ausführung und Preis klären wir im Gespräch.",
  },
  milano: {
    label: "Italienische Premiumküche",
    tagline: "Schattenfuge, Wangen, hohe Fronten",
    note: "Gestaltungsrichtung zur Orientierung – keine Planung oder Preisangabe eines Herstellers, kein Markenlogo.",
  },
};

export const FRONT_FINISHES = {
  matt: { label: "Lack matt" },
  glanz: { label: "Lack glänzend" },
  holz: { label: "Holzfurnier" },
  keramik: { label: "Keramik" },
  glas: { label: "Lackglas" },
  fenix: { label: "Fenix (Nanotech-Matt)" },
};

export const FRONT_COLORS = {
  matt: {
    kreide: { label: "Kreideweiß", hex: "#ebe7df" },
    kaschmir: { label: "Kaschmir", hex: "#cbbfae" },
    salbei: { label: "Salbei", hex: "#949d89" },
    graphit: { label: "Graphit", hex: "#3d3f42" },
    nacht: { label: "Nachtschwarz", hex: "#1f1f21" },
  },
  glanz: {
    polar: { label: "Polarweiß", hex: "#f1f0ec" },
    sand: { label: "Sand", hex: "#d6ccbb" },
    tiefblau: { label: "Tiefblau", hex: "#2c3a47" },
    schwarz: { label: "Schwarz", hex: "#151618" },
  },
  holz: {
    nuss: { label: "Nussbaum", hex: "#ffffff", texture: "front-nuss" },
    eiche: { label: "Eiche natur", hex: "#e8dccb", texture: "holz" },
    raeucher: { label: "Eiche geräuchert", hex: "#8f7357", texture: "holz" },
  },
  keramik: {
    calacatta: { label: "Weiß marmoriert", hex: "#ffffff", texture: "marmor" },
    beton: { label: "Beton hell", hex: "#d9d5ce", texture: "keramik" },
    basalt: { label: "Basalt", hex: "#55575a", texture: "quarz" },
  },
  glas: {
    perle: { label: "Perlweiß", hex: "#e9e6e0" },
    bronze: { label: "Bronze", hex: "#6b5a49" },
    rauch: { label: "Rauchgrau", hex: "#4a4d50" },
  },
  fenix: {
    weiss: { label: "Weiß", hex: "#e7e5df" },
    lehm: { label: "Lehm", hex: "#a8998a" },
    grau: { label: "Grau", hex: "#7c7d7b" },
    schwarz: { label: "Schwarz", hex: "#1c1d1e" },
  },
};

export const GRIPS = {
  grifflos: { label: "Grifflos (Gola-Griffmulde)" },
  push: { label: "Push-to-open (ohne Griff)" },
  leiste: { label: "Griffleiste (Profil)" },
  stange: { label: "Stangengriff" },
};

export const GRIP_COLORS = {
  alu: { label: "Aluminium", hex: "#c9cbcd", metal: 1, rough: 0.32 },
  schwarz: { label: "Schwarz matt", hex: "#202122", metal: 0.4, rough: 0.55 },
  messing: { label: "Messing gebürstet", hex: "#b89a5e", metal: 1, rough: 0.35 },
};

/**
 * Arbeitsplatten. `thickness` (cm) = Standard, `mm` = übliche Stärken je Material
 * (12–60 mm; Verfügbarkeit je Lieferant prüfen). `texture` = CC0-PBR-Satz aus
 * public/labs/kuechenplaner/ oder `proc:*` = im Browser erzeugt (ohne Download).
 */
export const WORKTOPS = {
  marmor: { label: "Marmor", thickness: 3, mm: [20, 30, 40, 60], roughness: 0.18, tile: 1.6, texture: "marmor", stone: true },
  granit: { label: "Granit", thickness: 3, mm: [20, 30, 40], roughness: 0.22, tile: 0.5, texture: "proc:granit", stone: true },
  quarz: { label: "Quarzkomposit", thickness: 2, mm: [12, 20, 30], roughness: 0.3, tile: 0.6, texture: "quarz", stone: true },
  keramik: { label: "Keramik / Sinterstein", thickness: 1.2, mm: [12, 20], roughness: 0.35, tile: 1.2, texture: "keramik", stone: true },
  edelstahl: { label: "Edelstahl", thickness: 4, mm: [12, 20, 40], roughness: 0.32, tile: 0.8, texture: "proc:edelstahl", metal: true },
  holz: { label: "Massivholz", thickness: 4, mm: [27, 40, 60], roughness: 0.6, tile: 1.4, texture: "holz" },
};

export const EDGES = {
  gerade: { label: "Gerade Kante" },
  fase: { label: "Fase 2 mm" },
  rund: { label: "Gerundet (R 5 mm)" },
  gehrung: { label: "Gehrung (40 mm Ansicht)" },
};

export const SINK_MOUNTS = {
  aufliegend: { label: "Aufliegend" },
  flach: { label: "Flächenbündig" },
  unterbau: { label: "Unterbau (Kante sichtbar)" },
};

export const SPLASHES = {
  platte: { label: "Wie Arbeitsplatte" },
  glas: { label: "Glas in Frontfarbe" },
  edelstahl: { label: "Edelstahl" },
  keine: { label: "Keine (Wandfarbe)" },
};

export const PANELS = {
  keine: { label: "Keine Wangen" },
  front: { label: "Wangen in Frontfarbe" },
  platte: { label: "Wangen aus Arbeitsplatte" },
};

/** Öffnungen und Anschlüsse im Raum. Maße in cm, Standardwerte als Startpunkt. */
export const OPENINGS = {
  fenster: { label: "Fenster", short: "F", b: 120, y: 100, h: 120 },
  tuer: { label: "Tür", short: "T", b: 90, y: 0, h: 210 },
  heizung: { label: "Heizkörper", short: "HK", b: 80, y: 15, h: 60 },
  steckdose: { label: "Steckdose", short: "SD", b: 8, y: 110, h: 8 },
  wasser: { label: "Wasseranschluss", short: "W", b: 10, y: 50, h: 10 },
  abluft: { label: "Abluft (Mauerkasten)", short: "AL", b: 15, y: 210, h: 15 },
  starkstrom: { label: "Herdanschluss (Starkstrom)", short: "ST", b: 8, y: 60, h: 8 },
};

export const TEXTURE_BASE = "/labs/kuechenplaner";

/**
 * Preistabelle – PLATZHALTER/BEISPIELWERTE in EUR inkl. MwSt. [Preis vom Inhaber festzulegen].
 * modules: [von, bis] je Modul bei einer Rasterbreite (60 bzw. 55 cm), skaliert linear mit der Breite.
 * worktopPerM: [von, bis] je Laufmeter. appliances: [von, bis] je Gerät.
 * lineFactor: Faktor je Linie. frontFactor / gripFactor: Aufschlag je Ausführung.
 */
export const PRICE_TABLE = {
  placeholder: true,
  currency: "EUR",
  modules: {
    unterschrank: [450, 700],
    eckschrank: [500, 800],
    flaschen: [450, 700],
    muell: [450, 700],
    regal: [200, 350],
    passstueck: [60, 120],
    spuele: [400, 600],
    geschirrspueler: [150, 250],
    kochfeld: [420, 650],
    backofenus: [300, 450],
    weinkuehler: [150, 250],
    hochschrank: [900, 1400],
    apotheker: [1000, 1500],
    backofen: [850, 1300],
    kuehlschrank: [800, 1200],
    sidebyside: [700, 1100],
    weinklima: [700, 1100],
    haengeschrank: [280, 420],
    wandbord: [80, 160],
    luefterhs: [300, 450],
    luecke: [0, 0],
    inselProM: [900, 1400],
  },
  worktopPerM: {
    marmor: [900, 1500],
    granit: [700, 1200],
    quarz: [500, 900],
    keramik: [700, 1200],
    edelstahl: [800, 1400],
    holz: [350, 650],
  },
  appliances: {
    kochfeld: [600, 2500],
    spuele: [300, 900],
    geschirrspueler: [600, 1400],
    backofen: [700, 2500],
    kuehlschrank: [900, 2800],
    weinkuehler: [900, 2600],
  },
  lineFactor: { binni: 1, milano: 2.4 },
  frontFactor: { matt: 1, glanz: 1.15, holz: 1.25, keramik: 1.5, glas: 1.35, fenix: 1.2 },
  gripFactor: { grifflos: 1.08, push: 1.04, leiste: 1, stange: 1 },
  montage: [0.08, 0.12],
  roundTo: 500,
};

export function rasterWidths(raster) {
  return (RASTER[raster] || RASTER[60]).widths;
}

/** Erlaubte Breiten eines Moduls (cm) im gewählten Raster. */
export function moduleWidths(type, raster) {
  const m = MODULES[type];
  if (!m) return [];
  const list = raster === 55 ? m.ch : m.eu;
  if (list) return list;
  return m.units.map((u) => Math.round(u * raster * 100) / 100);
}

/** Standardbreite eines Moduls: Rasterbreite, sonst die nächste erlaubte. */
export function defaultWidth(type, raster) {
  const ws = moduleWidths(type, raster);
  if (ws.includes(raster)) return raster;
  return ws.reduce((best, w) => (Math.abs(w - raster) < Math.abs(best - raster) ? w : best), ws[0]);
}

export const DEFAULT_CATALOG = {
  version: 2,
  source: "repo-default",
  priceTable: PRICE_TABLE,
};
