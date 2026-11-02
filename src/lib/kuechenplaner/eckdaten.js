// src/lib/kuechenplaner/eckdaten.js
// Lead-Übergabe (Küchenplaner-Team): freiwillige Eckdaten für die Beratung,
// die der Plan selbst nicht enthält – Projektart, Zeitraum, Gerätewunsch und
// ob Grundriss/Fotos vorliegen. Sie gehen als EINE Zeile „Eckdaten: …“ mit der
// Planung in die Anfrage (Übergabe-Text bzw. Anfragetext), nie in den
// Teilen-Link. Keine personenbezogenen Daten, nur feste Werte (kein Freitext).
//
// Gerätemarken: die sechs Marken aus src/lib/kueche/geraete.js. Der Händlersatz
// kommt weiterhin nur aus dem Claim-Register (src/lib/legal/claims.js) – hier
// steht nur der Wunsch der Besucherin, keine Aussage über Platzhirsch.
// Budget: Bänder sind eine Inhaber-Entscheidung, darum BUDGET_AKTIV = false
// (die Oberfläche zeigt die Frage erst nach Freigabe der Bänder).
// Rein, ohne "@/"-Importe (node --test tests/unit/kp-lead-eckdaten.test.mjs).
import { GERAETE_MARKEN } from "../kueche/geraete.js";

export const PROJEKT = Object.freeze([
  Object.freeze({ k: "neubau", label: "Neubau" }),
  Object.freeze({ k: "renovierung", label: "Renovierung / Umbau" }),
  Object.freeze({ k: "anderes", label: "Anderes" }),
]);

export const ZEITRAUM = Object.freeze([
  Object.freeze({ k: "0-3", label: "in den nächsten 3 Monaten" }),
  Object.freeze({ k: "3-6", label: "in 3–6 Monaten" }),
  Object.freeze({ k: "6-12", label: "in 6–12 Monaten" }),
  Object.freeze({ k: "12+", label: "später als in 12 Monaten" }),
  Object.freeze({ k: "offen", label: "noch offen" }),
]);

/** Budget-Bänder (Vorschlag, NICHT freigegeben – Inhaber entscheidet). */
export const BUDGET_AKTIV = false;
export const BUDGET = Object.freeze([
  Object.freeze({ k: "bis-30", label: "bis 30.000 €" }),
  Object.freeze({ k: "30-60", label: "30.000–60.000 €" }),
  Object.freeze({ k: "60-100", label: "60.000–100.000 €" }),
  Object.freeze({ k: "ab-100", label: "über 100.000 €" }),
  Object.freeze({ k: "offen", label: "noch offen" }),
]);

/** Auswahl Gerätewunsch: { id, name } der sechs Gerätemarken. */
export const GERAETE_WAHL = Object.freeze(GERAETE_MARKEN.map((m) => Object.freeze({ id: m.id, name: m.name })));

/** Leerer Zustand. geraete: null = unberührt (dann zählt ein optionaler `hint`).
 *  ?geraet= wertet die Planer-Seite aus (Geräte-Anbindung, page.js), nicht dieses Modul. */
export const EMPTY_ECKDATEN = Object.freeze({ projekt: "", zeitraum: "", budget: "", geraete: null, unterlagen: false });

const keyOf = (list, k) => (list.some((o) => o.k === k) ? k : "");
const labelOf = (list, k) => list.find((o) => o.k === k)?.label || "";

/** Nur bekannte Werte behalten. */
export function normalizeEckdaten(e = {}, { hint = "" } = {}) {
  const raw = Array.isArray(e?.geraete) ? e.geraete : hint ? [hint] : [];
  const geraete = GERAETE_WAHL.filter((g) => raw.includes(g.id)).map((g) => g.id);
  return {
    projekt: keyOf(PROJEKT, e?.projekt),
    zeitraum: keyOf(ZEITRAUM, e?.zeitraum),
    budget: BUDGET_AKTIV ? keyOf(BUDGET, e?.budget) : "",
    geraete,
    unterlagen: e?.unterlagen === true,
  };
}

/**
 * Zeile(n) für Übergabe und Anfrage:
 *   ["Eckdaten: Projekt Neubau · Umsetzung in 3–6 Monaten · Gerätewunsch Gaggenau, BORA · Grundriss/Fotos vorhanden"]
 * Leer, solange nichts gewählt ist.
 */
export function eckdatenLines(e, opts) {
  const n = normalizeEckdaten(e, opts);
  const parts = [];
  if (n.projekt) parts.push(`Projekt ${labelOf(PROJEKT, n.projekt)}`);
  if (n.zeitraum) parts.push(`Umsetzung ${labelOf(ZEITRAUM, n.zeitraum)}`);
  if (n.budget) parts.push(`Budgetrahmen ${labelOf(BUDGET, n.budget)}`);
  if (n.geraete.length) parts.push(`Gerätewunsch ${n.geraete.map((id) => GERAETE_WAHL.find((g) => g.id === id).name).join(", ")}`);
  if (n.unterlagen) parts.push("Grundriss/Fotos vorhanden");
  return parts.length ? [`Eckdaten: ${parts.join(" · ")}`] : [];
}
