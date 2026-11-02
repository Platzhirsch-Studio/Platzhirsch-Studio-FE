// src/lib/ezarri/konfigurator/safe-varianten.js – Safe-Ausführungen, die Ezarri nur als
// Variante derselben Produktseite führt (QM Runde 1, P1-2).
//
// ezarri.com verlinkt „25mm Safe“ / „50mm Safe“ oft nicht als eigene Seite, sondern als
// `…/<ref>?as-25` bzw. `…/<ref>-50?as-50` (gleiches Produktfoto, Oberfläche Safe Steps).
// references.json (Team A) hat diese Links in `varianten`, aber keinen eigenen Datensatz.
// Diese Funktion leitet daraus je Variante einen Eintrag ab:
//   id      "<basis>-safe" (25 mm) bzw. "<basis>-50-safe" (50 mm), wie Ezarris eigene Safe-Seiten
//   basis   Referenz-ID der Produktseite (Foto, Farbe, Kollektion, Anfrage)
//   format  "25mm" | "50mm"
//   quelle  die Ezarri-URL der Variante (mit ?as-…)
// Kaputte Ezarri-Links (Slug „de?as-25“ auf grit/limestone) werden übersprungen, ebenso
// Varianten, für die es schon eine eigene Referenz gibt.
//
// Rein (keine Imports): Team A (Welt) und Team C (Rechner) können dieselbe Ableitung
// nutzen, damit Welt, Rechner und Konfigurator dieselbe Liste zeigen.
// Stand der Prüfung 28.10.2026: 55 Varianten (Doku ezarri-konfigurator.md §2).

const SAFE_GRUPPEN = new Set(["Anti-Rutsch", "Anti-slip"]);

/**
 * @param {Array<{id:string, varianten?:Array<{gruppe:string,label:string,slug:string,url?:string}>}>} referenzen
 * @returns {Array<{id:string, basis:string, format:"25mm"|"50mm", label:string, quelle:string}>}
 */
export function safeVarianten(referenzen) {
  const ids = new Set(referenzen.map((r) => r.id));
  const out = new Map();
  for (const r of referenzen) {
    for (const v of r.varianten || []) {
      if (!SAFE_GRUPPEN.has(v.gruppe) || !v.slug || !v.slug.includes("?as-")) continue;
      const [basisSlug, q] = v.slug.split("?");
      const fmt = /50/.test(q) || /50/.test(v.label) ? "50mm" : "25mm";
      // Fotos/Daten: bevorzugt die verlinkte Produktseite, sonst die Seite, die verlinkt
      const basis = ids.has(basisSlug) ? basisSlug : null;
      if (!basis && basisSlug.length < 3) continue; // kaputter Slug („de“)
      const quelleRef = basis || r.id;
      const stamm = (basis || basisSlug).replace(/[-_](25|50)$/, "");
      const id = fmt === "50mm" ? `${stamm}-50-safe` : `${stamm}-safe`;
      if (ids.has(id) || out.has(id)) continue;
      out.set(id, { id, basis: quelleRef, format: fmt, label: v.label, quelle: v.url || `https://www.ezarri.com/de/${v.slug}` });
    }
  }
  return [...out.values()];
}
