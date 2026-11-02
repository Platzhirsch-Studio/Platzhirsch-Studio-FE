// Sofaplaner – eigene, neutrale Modul-Typen (Release-Rat R2, neuland P0-1).
//
// Planungsgrößen von Platzhirsch Home Living in Rastermaßen, KEIN bestimmtes
// Herstellermodell und keine Herstellerdaten: drei Sitzgewohnheiten (klassisch,
// Lounge, tief) mit je Ecke, Sitz (Mittelelement), Endelement mit Armlehne,
// Chaiselongue, Hocker und zwei festen Sofas. Gleiches Rohformat wie die
// Recherchedateien, damit normalize.js, templates.js und die Planlogik
// unverändert bleiben. Konkrete Modelle zeigen wir im Showroom.
//
// Raster: Sitzbreite R je Platz, Armlehne A, Tiefe D. Endelemente = n·R + A,
// Ecke = D × D, Chaiselongue = R + A breit und D + 65 tief, Hocker = R × (R − 10).

const ARM = 15;

function typ({ slug, name, typ, R, D, H, SH, outdoor = false }) {
  const el = (code, name, art, w, d, h, extra = {}) => ({
    code,
    name,
    art,
    breite_cm: w,
    tiefe_cm: d,
    hoehe_cm: h,
    sitzhoehe_cm: SH,
    sitztiefe_cm: art === "hocker" ? null : Math.round(D * 0.6),
    sitzmodul_cm: R,
    ...extra,
  });
  return {
    name,
    slug,
    hersteller: "Platzhirsch Home Living (Planungstyp)",
    designer: null,
    jahr: null,
    typ,
    quellen: [],
    masseinheit: "cm",
    hinweis_masse: `Rastermaße für die Planung (Sitz ${R} cm, Tiefe ${D} cm, Armlehne ${ARM} cm). Die Maße des gewählten Modells bestätigen wir im Showroom.`,
    rechte: "Eigene Planungstypen von Platzhirsch Home Living, keine Herstellerdaten.",
    outdoor,
    elemente: [
      el("ECKE", "Ecke", "ecke", D, D, H, { ausrichtung: ["SX", "DX"] }),
      el("SITZ-1", `Sitz, 1 Platz (${R} cm)`, "mittelelement", R, D, H),
      el("SITZ-2", `Sitz, 2 Plätze (${2 * R} cm)`, "mittelelement", 2 * R, D, H),
      el("ENDE-1-SX", `Endelement 1 Platz, Armlehne links`, "anbau-links", R + ARM, D, H),
      el("ENDE-1-DX", `Endelement 1 Platz, Armlehne rechts`, "anbau-rechts", R + ARM, D, H),
      el("ENDE-2-SX", `Endelement 2 Plätze, Armlehne links`, "anbau-links", 2 * R + ARM, D, H),
      el("ENDE-2-DX", `Endelement 2 Plätze, Armlehne rechts`, "anbau-rechts", 2 * R + ARM, D, H),
      el("CHAISE-SX", "Chaiselongue, Armlehne links", "chaiselongue", R + ARM, D + 65, H, { ausrichtung: ["SX"] }),
      el("CHAISE-DX", "Chaiselongue, Armlehne rechts", "chaiselongue", R + ARM, D + 65, H, { ausrichtung: ["DX"] }),
      el("HOCKER", "Hocker", "hocker", R, R - 10, SH),
      el("SOFA-2", "Sofa, 2 Plätze", "sofa", 2 * R + 2 * ARM, D, H),
      el("SOFA-3", "Sofa, 3 Plätze", "sofa", 3 * R + 2 * ARM, D, H),
    ],
    rueckenoptionen: ["Rückenhöhe und Kissen nach Modell, Auswahl im Showroom"],
    armlehnenoptionen: [`Armlehne ${ARM} cm (Planungsmaß), schmaler oder breiter je nach Modell`],
    fuesse_sockel: [{ teil: "Sockel oder Füße", material: "nach Modell, Auswahl im Showroom" }],
    bezuege: { kategorien: ["Stoff", "Leder"], bezugsart: "Stoffe und Leder zeigen wir im Showroom an Mustern." },
    fehlend: [],
  };
}

export const NEUTRAL_FILES = [
  [
    "klassisch.js",
    typ({
      slug: "typ-klassisch",
      name: "Klassisch",
      typ: "Aufrecht sitzen, höherer Rücken, kompakte Tiefe – für Wohnzimmer mit Gespräch und Lesen",
      R: 90,
      D: 95,
      H: 84,
      SH: 44,
    }),
  ],
  [
    "lounge.js",
    typ({
      slug: "typ-lounge",
      name: "Lounge",
      typ: "Entspannt sitzen, mittlere Tiefe, niedriger Rücken – für Fernsehen und lange Abende",
      R: 100,
      D: 110,
      H: 74,
      SH: 41,
    }),
  ],
  [
    "tief.js",
    typ({
      slug: "typ-tief",
      name: "Tief & niedrig",
      typ: "Anlehnen und liegen, große Sitztiefe, flacher Rücken – für großzügige, offene Räume",
      R: 110,
      D: 125,
      H: 66,
      SH: 38,
    }),
  ],
];

export const NEUTRAL_DEFAULT = "typ-lounge";
