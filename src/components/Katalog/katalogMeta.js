// src/components/Katalog/katalogMeta.js
// Reine Helfer für die Snippets der Katalogseiten (katalogRoutes.js).
// Rein, ohne "@/"-Importe (node --test: tests/unit/katalog-meta.test.mjs).
//
// Qualität 01.11.2026 (Crawl):
// - Marken und Kategorien, die es in mehreren Welten gibt (Dornbracht,
//   „armatur“ unter /bad-wellness und /kuechengeraete), hatten in allen vier
//   Sprachen denselben <title>. weltTitel() hängt dann den Weltnamen an.
// - Kurzbeschreibungen der Produkte unter 70 Zeichen ergaben zu dünne
//   Meta-Descriptions. produktBeschreibung() ergänzt dann einen vorhandenen,
//   übersetzten Satz (kein neuer Text, keine neuen Fakten).
import { META_DESCRIPTION_MAX, clampDescription } from "../../lib/seo/pageMetadata.js";

export const TITEL_MAX = 60;
export const BESCHREIBUNG_MIN = 70;

/**
 * Titel einer Marken-/Kategorieseite ohne Hausmarke.
 * @param {{ basis: string, name: string, welt: string, seitenText?: string, mehrereWelten: boolean, max?: number }} o
 *   basis = "Dornbracht – Produkte", name = "Dornbracht", welt = "Bad & Wellness"
 */
export function weltTitel({ basis, name, welt, seitenText = "", mehrereWelten, max = TITEL_MAX }) {
  if (!mehrereWelten || !welt) return basis + seitenText;
  const lang = `${basis} – ${welt}${seitenText}`;
  // Zu lang: das generische „Produkte“ fällt weg, Weltname und Seitenzahl bleiben.
  return lang.length <= max ? lang : `${name} – ${welt}${seitenText}`;
}

/** Letzter Satz eines Textes ("A. B." → "B."). */
export function letzterSatz(text) {
  const saetze = String(text || "").trim().split(/(?<=[.!?])\s+/u);
  return saetze[saetze.length - 1] || "";
}

/**
 * Meta-Description eines Produkts: die Kurzbeschreibung, gekürzt wie in
 * buildPageMetadata (ganze Sätze ≤ 150). Bleiben weniger als BESCHREIBUNG_MIN
 * Zeichen (kurzer Text, oder nur der erste Satz passt), kommt ein Satz aus
 * `zusatz` dazu (Text oder Liste, in Reihenfolge): der erste, mit dem das
 * Ergebnis zwischen `min` und `max` Zeichen liegt, sonst das längste, das passt.
 */
export function produktBeschreibung(kurz, zusatz, min = BESCHREIBUNG_MIN, max = META_DESCRIPTION_MAX) {
  const k = clampDescription(String(kurz || ""), max);
  if (k.length >= min) return k;
  const basis = k ? (/[.!?…]$/u.test(k) ? k : `${k}.`) : "";
  let best = k;
  for (const raw of [zusatz].flat()) {
    const z = String(raw || "").replace(/\s+/g, " ").trim();
    if (!z) continue;
    const d = basis ? `${basis} ${z}` : z;
    if (d.length > max) continue;
    if (d.length >= min) return d;
    if (d.length > best.length) best = d;
  }
  return best;
}
