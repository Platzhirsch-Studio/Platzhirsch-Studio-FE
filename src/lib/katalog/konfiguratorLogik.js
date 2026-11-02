// src/lib/katalog/konfiguratorLogik.js
// Winzige, importfreie Logik der Konfigurator-Insel (Client-Bundle klein halten).
// Arbeitet auf den Daten aus konfiguratorDaten() (ausfuehrung.js):
//   { gruppen: [{ name, optionen: [{ id, name, code, farbe, bild }] }], start, standard, ratio }

/** Option einer Gruppe zur Auswahl. */
export const gewaehlteOption = (daten, auswahl, gi) => daten.gruppen[gi]?.optionen.find((o) => o.id === auswahl[gi]) || null;

/** Vorschaubild: zuletzt geänderte Gruppe (falls Bild), sonst erste Gruppe mit Bild, sonst Start. */
export function vorschau(daten, auswahl, zuletzt = null) {
  if (zuletzt != null) {
    const b = gewaehlteOption(daten, auswahl, zuletzt)?.bild;
    if (b) return b;
  }
  for (let i = 0; i < daten.gruppen.length; i++) {
    const b = gewaehlteOption(daten, auswahl, i)?.bild;
    if (b) return b;
  }
  return daten.start;
}

/**
 * QM R1: Bild nur aus einer gewählten Option (ohne Rückfall auf das Startbild). Die
 * Vorschau erscheint nur, wenn es eines gibt und es nicht schon das Hauptbild der Seite
 * ist (BORA CKA2: dasselbe Freisteller-Bild stand zweimal untereinander; Agape Cenote:
 * die „Vorschau der gewählten Ausführung“ änderte sich bei keiner Farbe).
 * @param {string|null} [hauptSrc] src des Hauptbilds der Produktseite
 */
export function optionsVorschau(daten, auswahl, zuletzt = null, hauptSrc = null) {
  let b = zuletzt != null ? gewaehlteOption(daten, auswahl, zuletzt)?.bild : null;
  for (let i = 0; !b && i < daten.gruppen.length; i++) b = gewaehlteOption(daten, auswahl, i)?.bild || null;
  return b && b.src !== hauptSrc ? b : null;
}

/**
 * Name + Code ohne doppelte Klammer (QM R3): „Standard (Edelstahl) · CKA2“ statt
 * „Standard (Edelstahl) (CKA2)“, sonst „All Black (CKA2AB)“.
 */
export function mitCode(name, code) {
  if (!code || String(name).includes(code)) return name;
  return /\)\s*$/u.test(name) ? `${name} · ${code}` : `${name} (${code})`;
}

/**
 * QM R1/R3: Zusammenfassung immer als Zeilenliste [{ name, wert }] – auch bei nur einer
 * Gruppe („Ausführung: All Black (CKA2AB)“ statt des Satzes „Gewählt: … (…) (…)“).
 */
export function auswahlZeilen(daten, auswahl) {
  return daten.gruppen
    .map((g, i) => {
      const o = gewaehlteOption(daten, auswahl, i);
      if (!o) return null;
      return { name: g.name, wert: mitCode(o.name, o.code) };
    })
    .filter(Boolean);
}

/**
 * Hinweistext ohne den ersten Satz, wenn der mit demselben Wort beginnt wie der
 * Vorschau-Text („Vorschau der gewählten Ausführung. Alle …“ → „Alle …“) – für
 * Produkte ohne Vorschaubild (QM R1).
 */
export function ohneVorschauSatz(hinweis, vorschauText) {
  if (typeof hinweis !== "string") return hinweis;
  // QM R3: „Vorschau: {auswahl}“ – Satzzeichen am ersten Wort zählen nicht mit.
  const wort = String(vorschauText || "").trim().split(/\s+/u)[0].replace(/\p{P}+$/u, "");
  if (!wort || !hinweis.startsWith(wort)) return hinweis;
  const rest = hinweis.replace(/^[^.!?]*[.!?]\s*/u, "");
  return rest || hinweis;
}

/** „Basis: Eiche · Front-Paneel: Blau (RAL 5024)“ */
export function auswahlLabel(daten, auswahl) {
  return daten.gruppen
    .map((g, i) => {
      const o = gewaehlteOption(daten, auswahl, i);
      if (!o) return null;
      return `${g.name}: ${o.name}${o.code && !o.name.includes(o.code) ? ` (${o.code})` : ""}`;
    })
    .filter(Boolean)
    .join(" · ");
}

/** Neue Auswahl nach Klick (unveränderlich). */
export const waehle = (auswahl, gi, id) => auswahl.map((x, i) => (i === gi ? id : x));

/**
 * Pfeiltasten in einer Radiogruppe (WAI-ARIA): Rechts/Unten → nächste,
 * Links/Oben → vorige (umlaufend), Pos1/Ende → erste/letzte. Sonst null.
 */
export function naechsterIndex(key, i, n) {
  if (key === "ArrowRight" || key === "ArrowDown") return (i + 1) % n;
  if (key === "ArrowLeft" || key === "ArrowUp") return (i - 1 + n) % n;
  if (key === "Home") return 0;
  if (key === "End") return n - 1;
  return null;
}

