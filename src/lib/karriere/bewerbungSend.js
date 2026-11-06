// src/lib/karriere/bewerbungSend.js – Umschaltung alt/ph der Bewerbung (Gruppe "bewerbung").
//   ph mit Zugang  → Formular auf der Stellenseite, Versand über sendBewerbungPh (bewerbung.js)
//   ph ohne Zugang → kein Formular (nichts landet still im falschen System), Route 503 not_configured
//   alt            → kein Formular, die Seite zeigt den bisherigen Weg (E-Mail); Route 503 not_available
// Rein (relative Importe; fetch wird übergeben).
import { phCall, resolveBackend } from "../backend/config.js";
import { sendBewerbungPh } from "./bewerbung.js";

/** true, wenn die Stellenseite das Online-Formular zeigt. */
export function bewerbungOnline(env = process.env) {
  const t = resolveBackend("bewerbung", env);
  return t.generation === "ph" && Boolean(t.ph);
}

/**
 * @returns {Promise<{ ok: true, referenz, unterlagen, fehlend, generation: "ph" } | { ok: false, code, generation }>}
 */
export async function sendBewerbung(data, dateien, { env = process.env, fetchImpl = globalThis.fetch, leadRef = null } = {}) {
  const t = resolveBackend("bewerbung", env);
  if (t.generation !== "ph") return { ok: false, code: "not_available", generation: "alt" };
  if (!t.ph) return { ok: false, code: "not_configured", generation: "ph" };
  const r = await sendBewerbungPh(data, dateien, { cfg: t.ph, phCall, fetchImpl, leadRef });
  return { ...r, generation: "ph" };
}
