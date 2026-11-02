// src/lib/agent/clean.js – Claim-Schutz für ALLE Werkzeug-Ausgaben.
//
// Texte aus dem Backoffice (Marken-, Kollektions-, Kategorienamen) laufen
// ungeprüft in die Antworten. Damit kein Assistent von uns eine Händler-
// Aussage oder einen Superlativ „lernt“, prüft scrub() jeden String mit dem
// Claim-Guard der Website (src/lib/legal/claims.js – dieselbe Regel wie Lint,
// check:claims und legal.spec.js). Erlaubt sind Händler-Aussagen nur zu
// Marken im Claim-Register (heute ClassiCon; Ezarri, sobald der Eintrag dort
// steht – Inhaber-Entscheidung Nr. 7). Ein Satz mit Verstoß wird entfernt,
// nicht umformuliert (nichts erfinden).
// URLs, IDs und Zahlen bleiben unangetastet.
// Rein: node --test lädt es direkt.
import { findClaims, splitSentences } from "../legal/claims.js";

const SKIP_KEYS = new Set(["url", "href", "image", "directions", "appointment", "appointment_url", "confirm_preview_url", "quelle", "samples", "id", "key", "email", "phone"]);

/** Einen Text prüfen: Sätze mit Händler-/Superlativ-Fund fallen weg. */
export function scrubText(text) {
  if (typeof text !== "string" || !text.trim()) return text;
  if (!findClaims(text).length) return text;
  const kept = splitSentences(text)
    .map((s) => s.text)
    .filter((s) => s.trim() && !findClaims(s).length);
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

/** Tiefe Kopie mit geprüften Strings. */
export function scrub(value, key = "") {
  if (typeof value === "string") return SKIP_KEYS.has(key) ? value : scrubText(value);
  if (Array.isArray(value)) return value.map((v) => scrub(v, key));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrub(v, k);
    return out;
  }
  return value;
}

/** Alle Funde in einem beliebigen Wert (für Tests und das Log). */
export function claimFindings(value) {
  const texts = [];
  const walk = (v) => {
    if (typeof v === "string") texts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(value);
  return texts.flatMap((t) => findClaims(t));
}
