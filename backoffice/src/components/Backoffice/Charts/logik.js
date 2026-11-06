// Reine Rechenlogik der Diagramme und der Kennzahl-Zahl (ohne JSX, ohne React) –
// testbar mit node --test (tests/unit/backoffice-grundbausteine.test.mjs).
// Zahlen werden mit Punkt als Tausendertrennung formatiert (Q-A4: „1.234,50 €“),
// nicht mit dem geschützten Leerzeichen, das de-AT in neueren ICU-Ständen liefert.

const GANZ = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const DEZIMAL = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });
const EURO = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const EURO_GANZ = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const MINUS = "−";

function mitMinus(text) {
  return text.replace(/^-/, MINUS);
}

/** Bekannte Formate (serialisierbar, darum Text statt Funktion – Client-Grenze). */
export const FORMATE = ["zahl", "dezimal", "cent", "cent-rund", "prozent"];

/**
 * Wert → Anzeigetext. `art`: zahl (1.234) · dezimal (1.234,5) · cent (Cent → 1.234,50 €) ·
 * cent-rund (Cent → 1.235 €) · prozent (12,5 %). Ungültig → „–“.
 */
export function formatiere(wert, art = "zahl") {
  if (wert === null || wert === undefined || wert === "" || Number.isNaN(Number(wert))) return "–";
  const n = Number(wert);
  switch (art) {
    case "cent":
      return `${mitMinus(EURO.format(n / 100))} €`;
    case "cent-rund":
      return `${mitMinus(EURO_GANZ.format(Math.round(n / 100)))} €`;
    case "prozent":
      return `${mitMinus(DEZIMAL.format(n))} %`;
    case "dezimal":
      return mitMinus(DEZIMAL.format(n));
    default:
      return mitMinus(GANZ.format(n));
  }
}

/**
 * Soll gezählt werden? Nur bei echter Zahländerung, und nicht, wenn sich der angezeigte
 * Wert um mehr als 4 Stellen ändert (dann Direktwechsel + Hervorhebung, 04 §3.7).
 * @returns {"nein"|"zaehlen"|"direkt"}
 */
export function wechselArt(von, nach, art = "zahl") {
  if (typeof von !== "number" || typeof nach !== "number" || !Number.isFinite(von) || !Number.isFinite(nach)) return "nein";
  if (von === nach) return "nein";
  const teiler = art === "cent" || art === "cent-rund" ? 100 : 1;
  const differenz = Math.abs(nach - von) / teiler;
  return differenz >= 10000 ? "direkt" : "zaehlen";
}

/** Skala für Balken: Max, Min (≤ 0), Lage der Nulllinie in Prozent von unten. */
export function skala(werte) {
  const zahlen = werte.map((w) => Number(w) || 0);
  const max = Math.max(0, ...zahlen);
  const min = Math.min(0, ...zahlen);
  const spanne = max - min || 1;
  return { max, min, spanne, nullLinie: min < 0 ? (-min / spanne) * 100 : 0 };
}

/**
 * Balkengeometrie in Prozent der Zeichenfläche (Kopfraum für Werte: `nutzbar`).
 * Positive Balken stehen auf der Nulllinie, negative hängen darunter.
 */
export function balkenGeometrie(werte, nutzbar = 82) {
  const s = skala(werte);
  const nullPos = (s.nullLinie / 100) * nutzbar;
  return werte.map((w) => {
    const n = Number(w) || 0;
    const hoehe = (Math.abs(n) / s.spanne) * nutzbar;
    return { wert: n, negativ: n < 0, unten: n < 0 ? nullPos - hoehe : nullPos, hoehe: n === 0 ? 0 : Math.max(0.8, hoehe) };
  });
}

/** Welche Balken bekommen eine Wertbeschriftung: alle bis 8, sonst nur Maximum und letzter. */
export function beschriftete(werte, grenze = 8) {
  const n = werte.length;
  if (n <= grenze) return new Set(werte.map((_, i) => i));
  const zahlen = werte.map((w) => Number(w) || 0);
  const maxI = zahlen.indexOf(Math.max(...zahlen));
  return new Set([maxI, n - 1]);
}

/**
 * Linienpunkte in Prozent (x mittig in gleich breiten Spalten, y mit Kopfraum).
 * Mehrere Serien teilen sich eine Skala (`max` von außen).
 */
export function linienPunkte(werte, max, kopfraum = 22) {
  const n = werte.length;
  const m = max > 0 ? max : 1;
  return werte.map((w, i) => ({ x: ((i + 0.5) / n) * 100, y: 100 - ((Number(w) || 0) / m) * (100 - kopfraum) - 2 }));
}

/** SVG-Pfad aus Punkten; `flaeche` schließt nach unten. */
export function pfad(punkte, flaeche = false) {
  if (!punkte.length) return "";
  const d = punkte.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  if (!flaeche) return d;
  return `${d} L${punkte[punkte.length - 1].x.toFixed(2)},100 L${punkte[0].x.toFixed(2)},100 Z`;
}

/**
 * Donut-Segmente (Umfang 100): Anteil in Prozent, Start (für Stagger), Strich mit 2-Punkt-Lücke
 * nur bei mehr als einem Teil. Höchstens 5 Teile (03 §8.15); mehr → „Weitere“ zusammengefasst.
 */
export function donutSegmente(teile, maxTeile = 5) {
  let liste = teile.map((t) => ({ ...t, wert: Math.max(0, Number(t.wert) || 0) }));
  if (liste.length > maxTeile) {
    const rest = liste.slice(maxTeile - 1).reduce((a, t) => a + t.wert, 0);
    liste = [...liste.slice(0, maxTeile - 1), { label: "Weitere", wert: rest }];
  }
  const summe = liste.reduce((a, t) => a + t.wert, 0);
  let start = 0;
  const luecke = liste.filter((t) => t.wert > 0).length > 1 ? 1.2 : 0;
  return {
    summe,
    segmente: liste.map((t, i) => {
      const anteil = summe > 0 ? (t.wert / summe) * 100 : 0;
      const seg = { ...t, index: i, anteil, start, strich: Math.max(0, anteil - luecke) };
      start += anteil;
      return seg;
    }),
  };
}

/** Prozent für die Legende: 12,5 % (eine Nachkommastelle, unter 1 % „< 1 %“). */
export function prozentText(anteil) {
  if (anteil > 0 && anteil < 1) return "< 1 %";
  return `${DEZIMAL.format(Math.round(anteil * 10) / 10)} %`;
}

/** Sparkline-Punkte in Pixeln (feste Größe, 2 px Rand). */
export function sparkPunkte(werte, breite, hoehe) {
  const zahlen = werte.map((w) => Number(w) || 0);
  const max = Math.max(...zahlen);
  const min = Math.min(0, ...zahlen);
  const spanne = max - min || 1;
  const n = zahlen.length;
  return zahlen.map((w, i) => ({ x: (i / Math.max(1, n - 1)) * (breite - 6) + 3, y: hoehe - 3 - ((w - min) / spanne) * (hoehe - 6) }));
}

/** Fortschritt einer Zielkennzahl in Prozent (0–100). */
export function zielAnteil(wert, ziel) {
  const w = Number(wert);
  const z = Number(ziel);
  if (!Number.isFinite(w) || !Number.isFinite(z) || z <= 0) return 0;
  return Math.max(0, Math.min(100, (w / z) * 100));
}

/**
 * Trendfarbe nach Bedeutung, nicht Richtung (03 §8.14): Umsatz ↑ gut, Überfällig ↑ schlecht.
 * @param {"auf"|"ab"|"gleich"} richtung
 * @param {"hoch"|"niedrig"|"neutral"} [gut]  welche Richtung gut ist; ohne Angabe: auf = gut
 * @returns {"gut"|"schlecht"|"neutral"}
 */
export function trendBewertung(richtung, gut = "hoch") {
  if (richtung !== "auf" && richtung !== "ab") return "neutral";
  if (gut === "neutral") return "neutral";
  const positiv = (richtung === "auf") === (gut === "hoch");
  return positiv ? "gut" : "schlecht";
}
