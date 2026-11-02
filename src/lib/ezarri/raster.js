// src/lib/ezarri/raster.js – vollständige letzte Rasterzeile im Dreierraster (QM r2:
// „Standard Pixel Mosaic“ stand allein neben zwei leeren Spalten).
// Raster ab lg mit 6 Spuren: normal belegt eine Kachel 2 Spuren (3 je Zeile).
// Rest 2 → die letzten zwei Kacheln je 3 Spuren; Rest 1 → die letzten vier
// Kacheln je 3 Spuren (zwei Zeilen à zwei). So endet jede Zeile bündig.
// Rein (keine Imports): Server- und Client-Komponenten, node --test.

/** Spurbreite (2 oder 3 von 6) der Kachel i bei n Kacheln. */
export function spurenDreier(i, n) {
  const rest = n % 3;
  if (rest === 2 && i >= n - 2) return 3;
  if (rest === 1 && n >= 4 && i >= n - 4) return 3;
  return 2;
}

/** Tailwind-Klasse (statisch ausgeschrieben, damit der Scanner sie findet). */
export function spurKlasseDreier(i, n) {
  return spurenDreier(i, n) === 3 ? "lg:col-span-3" : "lg:col-span-2";
}

// QM r4 (ipad-hoch, phone-quer): im Zweierraster (sm bis lg) stand bei ungerader Anzahl die
// letzte Kachel allein neben einer leeren Spalte (Fosfo, Mix, Standard Pixel Mosaic). Sie
// läuft dort über beide Spalten; ab lg gilt weiter spurKlasseDreier.

/** Läuft die Kachel i bei n Kacheln im Zweierraster über beide Spalten? */
export function breitImZweier(i, n) {
  return n % 2 === 1 && i === n - 1;
}

/** Spurklassen für Zweier- (sm) und Dreierraster (lg, 6 Spuren). */
export function spurKlasse(i, n) {
  return `${breitImZweier(i, n) ? "sm:col-span-2 " : ""}${spurKlasseDreier(i, n)}`;
}

/**
 * Einsatz-Kacheln der Ezarri-Startseite (Container „weiche“, QM r4): einspaltig bei großer
 * Schrift (< 18 rem), zwei Spalten (die letzte Kachel einer ungeraden Anzahl über beide),
 * ab 32 rem drei je Zeile in 6 Spuren (Rest bündig wie spurenDreier), ab 64 rem alle in
 * einer Reihe. `box` hält die breiten Kacheln gleich hoch wie die übrigen (Seitenverhältnis).
 */
export function weicheRaster(i, n) {
  const zwei = breitImZweier(i, n);
  const drei = spurenDreier(i, n) === 3;
  return {
    li: [zwei ? "@[18rem]/weiche:col-span-2" : "", drei ? "@lg/weiche:col-span-3" : "@lg/weiche:col-span-2", "@5xl/weiche:col-span-1"].filter(Boolean).join(" "),
    box: [zwei ? "@[18rem]/weiche:aspect-[2/1]" : "", drei ? "@lg/weiche:aspect-[3/2]" : "@lg/weiche:aspect-square", "@5xl/weiche:aspect-square"].filter(Boolean).join(" "),
    breit: zwei || drei,
  };
}

// QM r4 (Kollektionsseite, Mosaik-Raster im Container „mos“: 1 / 2 / 3 / 4 Spalten ab 0 / 18 /
// 34 / 62 rem): die letzte Zeile endet bündig – eine Musteranfrage-Kachel füllt die freien
// Zellen; geht die Zeile auf, ist sie in dieser Breite ausgeblendet. Klassen statisch.
// Index = Anzahl freier Zellen (0 = Zeile voll → ausgeblendet).
const FUELL = {
  2: ["@[18rem]/mos:hidden", "@[18rem]/mos:block @[18rem]/mos:col-span-1"],
  3: ["@[34rem]/mos:hidden", "@[34rem]/mos:block @[34rem]/mos:col-span-1", "@[34rem]/mos:block @[34rem]/mos:col-span-2"],
  4: ["@[62rem]/mos:hidden", "@[62rem]/mos:block @[62rem]/mos:col-span-1", "@[62rem]/mos:block @[62rem]/mos:col-span-2", "@[62rem]/mos:block @[62rem]/mos:col-span-3"],
};

/** Freie Zellen der letzten Zeile bei n Kacheln und `spalten` Spalten (0 = Zeile voll). */
export function freieZellen(n, spalten) {
  const rest = n % spalten;
  return rest === 0 ? 0 : spalten - rest;
}

/** Klassen der Füllkachel bei n Kacheln (einspaltig nie sichtbar). */
export function fuellKlasse(n) {
  return ["hidden", ...[2, 3, 4].map((s) => FUELL[s][freieZellen(n, s)])].join(" ");
}

/** Projektbild-Band nach so vielen Kacheln: Vielfaches von 12 → volle Zeilen bei 1–4 Spalten. */
export const BAND_NACH = 12;
