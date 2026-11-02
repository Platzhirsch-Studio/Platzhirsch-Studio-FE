// src/components/Katalog/galerieDoppel.js
// Optik-QA Runde 3 (01.11.2026): Produkte mit Konfigurator zeigen das Bild der
// gewählten Ausführung in der Vorschau. Liegen dieselben Bilder zusätzlich als
// Ansichten unter dem Hauptbild, stand dasselbe Motiv dreimal auf der Seite
// (z. B. BORA CKA2: Hauptbild, Ansicht, Vorschau). Pure Helfer, ohne React.

/** Alle Bild-src, die eine Ausführungsoption des Produkts als Vorschau nutzt. */
export function konfigBildSrcs(p) {
  const out = new Set();
  for (const g of p?.ausfuehrungen || []) {
    for (const o of g?.optionen || []) {
      for (const b of o?.bilder || []) {
        const s = typeof b === "string" ? b : b?.src;
        if (s) out.add(s);
      }
    }
  }
  return out;
}

/**
 * Ansichten ohne die Bilder, die der Konfigurator ohnehin zeigt. Das Hauptbild
 * bleibt immer (es wird separat gerendert und hier nicht übergeben).
 * `startSrc`: Bild, das die Vorschau beim Laden zeigt (konfiguratorDaten().start) –
 * haben die Optionen keine eigenen Bilder, ist das der erste Freisteller (Agape Cenote).
 * @param {{src: string}[]} ansichten weitere Ansichten unter dem Hauptbild
 * @param {object} p Produkt
 * @param {string} [startSrc]
 */
export function ohneKonfigDoppel(ansichten, p, startSrc) {
  const s = konfigBildSrcs(p);
  if (startSrc) s.add(startSrc);
  if (!s.size) return ansichten;
  return ansichten.filter((b) => !s.has(b?.src));
}
