// Bodensee-Licht (N4) – Sonnenhöhe → Lichtstärke, Farbtemperatur, Himmel.
// Reine Funktionen ohne three.js, damit jede Szene (Küchenplaner, Ezarri-Pool,
// Portal-Planung, Arbeitsweise) dieselben Werte bekommt.
//
// Physikalische Grundlage (vereinfacht, für Darstellung, nicht für Lichtplanung):
//  - Luftmasse nach Kasten & Young (1989), direkte Strahlung nach Meinel (1976):
//    I/I0 = 0,7^(AM^0,678). Normiert auf Zenit = 1.
//  - Farbtemperatur der direkten Sonne: ≈ 2.000 K am Horizont bis ≈ 5.500 K
//    ab ca. 45° Höhe (Tageslicht D55). Kelvin → sRGB nach Tanner Helland.
//  - Phasen: goldene Stunde −4° … 6°, blaue Stunde −6° … −4°,
//    nautische Dämmerung bis −12°, darunter Nacht (Kunstlicht).
//
// Presets: Sobald src/lib/three/lightPresets.js existiert (Wachstumsrat 3D §3.3),
// kann eine Szene ihre Basiswerte über `basis` übergeben; ohne Angabe gelten
// die eigenen Werte unten (LICHT_BASIS).

export const LICHT_BASIS = {
  sonneMax: 3.2, // Intensität DirectionalLight bei Zenitsonne (three.js, physicallyCorrect)
  himmelMax: 0.9, // HemisphereLight am hellen Tag
  himmelNacht: 0.04,
  hdriMax: 1.0, // environmentIntensity am Tag
  hdriNacht: 0.05,
  kunstlicht: 1.0, // Pendelleuchten 2.700 K, wenn es dunkel ist
};

export const K_MIN = 2000;
export const K_MAX = 5500;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Relative Luftmasse (Kasten & Young) für scheinbare Höhe in Grad. */
export function luftmasse(hoehe) {
  if (hoehe <= -1) return Infinity;
  const z = 90 - Math.max(hoehe, -0.9);
  return 1 / (Math.cos((z * Math.PI) / 180) + 0.50572 * (96.07995 - z) ** -1.6364);
}

/** Direkte Sonne relativ zur Zenitsonne (0 … 1), weich ausgeblendet am Horizont. */
export function sonnenStaerke(hoehe) {
  if (hoehe <= -0.833) return 0;
  const am = luftmasse(Math.min(hoehe, 90));
  const meinel = 0.7 ** (am ** 0.678) / 0.7;
  return clamp(meinel, 0, 1) * smooth(-0.833, 3, hoehe);
}

/** Farbtemperatur der direkten Sonne in Kelvin (2.000 … 5.500). */
export function farbtemperatur(hoehe) {
  if (hoehe <= 0) return K_MIN;
  const t = clamp(hoehe / 45, 0, 1);
  return Math.round(K_MIN + (K_MAX - K_MIN) * Math.sqrt(t) * (0.6 + 0.4 * t));
}

/** Kelvin → { r, g, b } (0 … 1, sRGB) nach Tanner Helland (1.000–40.000 K). */
export function kelvinZuRgb(kelvin) {
  const t = clamp(kelvin, 1000, 40000) / 100;
  let r;
  let g;
  let b;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * (t - 60) ** -0.1332047592;
    g = 288.1221695283 * (t - 60) ** -0.0755148492;
    b = 255;
  }
  return { r: clamp(r, 0, 255) / 255, g: clamp(g, 0, 255) / 255, b: clamp(b, 0, 255) / 255 };
}

export function rgbZuHex({ r, g, b }) {
  const h = (v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Tageszeit-Phase zur Sonnenhöhe. */
export function phase(hoehe) {
  if (hoehe >= 6) return { id: "tag", name: "Tageslicht" };
  if (hoehe >= -0.833) return { id: "gold", name: "goldene Stunde" };
  if (hoehe >= -4) return { id: "gold", name: "Abend- bzw. Morgenrot" };
  if (hoehe >= -6) return { id: "blau", name: "blaue Stunde" };
  if (hoehe >= -12) return { id: "daemmerung", name: "Dämmerung" };
  return { id: "nacht", name: "Nacht" };
}

/** Himmelsfarben oben/Horizont (für Fallback-Grafik und HemisphereLight). */
export function himmelsfarben(hoehe) {
  // Stützstellen: Nacht, blaue Stunde, Horizontsonne, Vormittag, Mittag
  const stuetzen = [
    { h: -18, oben: [0.03, 0.04, 0.08], horizont: [0.05, 0.06, 0.1] },
    { h: -6, oben: [0.12, 0.17, 0.32], horizont: [0.36, 0.33, 0.45] },
    { h: 0, oben: [0.3, 0.42, 0.62], horizont: [0.98, 0.62, 0.38] },
    { h: 10, oben: [0.38, 0.56, 0.82], horizont: [0.92, 0.84, 0.74] },
    { h: 40, oben: [0.35, 0.56, 0.86], horizont: [0.8, 0.86, 0.92] },
  ];
  const x = clamp(hoehe, -18, 40);
  let i = 0;
  while (i < stuetzen.length - 2 && x > stuetzen[i + 1].h) i++;
  const a = stuetzen[i];
  const b = stuetzen[i + 1];
  const t = (x - a.h) / (b.h - a.h);
  const mix = (p, q) => p.map((v, k) => v + (q[k] - v) * t);
  const [ro, go, bo] = mix(a.oben, b.oben);
  const [rh, gh, bh] = mix(a.horizont, b.horizont);
  return { oben: rgbZuHex({ r: ro, g: go, b: bo }), horizont: rgbZuHex({ r: rh, g: gh, b: bh }) };
}

/**
 * Alle Lichtwerte für eine Sonnenhöhe.
 * → { sonne: { an, intensitaet, kelvin, farbe }, himmel: { intensitaet, oben, horizont },
 *     hdriBelichtung, kunstlicht: { an, intensitaet }, phase, schatten }
 */
export function lichtWerte(hoehe, basis = LICHT_BASIS) {
  const b = { ...LICHT_BASIS, ...basis };
  const staerke = sonnenStaerke(hoehe);
  const kelvin = farbtemperatur(hoehe);
  // Himmel: am Tag hell, in der Dämmerung bis −12° abklingend
  const himmelAnteil = 0.08 + 0.92 * smooth(-12, 12, hoehe);
  const dunkel = 1 - smooth(-7, 1, hoehe); // 0 am Tag … 1 nachts
  const farben = himmelsfarben(hoehe);
  return {
    sonne: {
      an: staerke > 0.001,
      intensitaet: b.sonneMax * staerke,
      kelvin,
      farbe: rgbZuHex(kelvinZuRgb(kelvin)),
      staerke,
    },
    himmel: { intensitaet: b.himmelNacht + (b.himmelMax - b.himmelNacht) * himmelAnteil, ...farben },
    hdriBelichtung: b.hdriNacht + (b.hdriMax - b.hdriNacht) * himmelAnteil,
    kunstlicht: { an: dunkel > 0.35, intensitaet: b.kunstlicht * dunkel },
    phase: phase(hoehe),
    // Kein Schatten von unten: unter dem Horizont wirft die Sonne keinen
    schatten: staerke > 0.01,
  };
}
