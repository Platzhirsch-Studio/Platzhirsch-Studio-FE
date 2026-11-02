// Küchenplaner – Merkplätze A/B als reine Funktionen (Fix 3, QA Feinschliff P2-3/P3-5).
// Die Komponente VariantCompare hält nur Speicher und Anzeige; die Regeln stehen hier
// und sind per node --test prüfbar.

export const VARIANT_IDS = ["a", "b"];
export const other = (id) => (id === "a" ? "b" : "a");

const okSlot = (s) => (s && typeof s.k === "string" && typeof s.at === "number" ? { k: s.k, at: s.at } : null);

/** Gespeicherter Text → { a, b }; Unbrauchbares wird zu null (nie ein Fehler). */
export function parseSlots(raw) {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { a: okSlot(v?.a), b: okSlot(v?.b) };
  } catch {
    return { a: null, b: null };
  }
}

/**
 * „Variante id öffnen“. Ist die Gegenseite leer (sie zeigt die aktuelle Planung live)
 * und weicht die aktuelle Planung von der zu öffnenden ab, wird die aktuelle Planung
 * zuerst auf der Gegenseite gemerkt – sie geht sonst verloren (P2-3).
 * Rückgabe: { slots, kept } – kept = id der automatisch gemerkten Seite oder null.
 */
export function openVariant(slots, id, currentCode, now = Date.now()) {
  const target = slots[id];
  if (!target) return { slots, kept: null };
  const o = other(id);
  if (!slots[o] && currentCode && currentCode !== target.k) {
    return { slots: { ...slots, [o]: { k: currentCode, at: now } }, kept: o };
  }
  return { slots, kept: null };
}
