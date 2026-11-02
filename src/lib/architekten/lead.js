// src/lib/architekten/lead.js – Anfrage der Seite /architekten über den
// bestehenden Lead-Mechanismus (/api/beratung_anfrage, beratungSchema,
// Herkunft-Block aus src/lib/forms/leadPayload.js). Keine neue API, keine
// neuen Backoffice-Felder: Büro, Phase, Muster und Bedarf stehen als Zeilen
// im Anfragetext; der Kontext (architekt | bautraeger | staging | muster)
// steht zusätzlich als eigene „Kontext:“-Zeile im Herkunft-Block (pageContext).
// Pure module (node --test), keine "@/"-Imports.

export const LEAD_URL = "/api/beratung_anfrage";
export const ANLIEGEN = Object.freeze(["architekt", "bautraeger", "staging", "muster"]);
export const MUSTER_IDS = Object.freeze(["stoff", "leder", "holz", "stein", "oberflaeche", "outdoor", "ezarri"]);
export const MUSTER_MAX = MUSTER_IDS.length;

// Kontext für den Herkunft-Block (Deutsch, Backoffice).
const CONTEXT_LINE = {
  architekt: "Fachweg: Architektur/Planung",
  bautraeger: "Fachweg: Bauträger (Musterwohnung/Ausstattungslinie)",
  staging: "Fachweg: Home-Staging",
  muster: "Fachweg: Architektur/Planung · Muster/Planungsdaten",
};

/** ?anliegen= / ?kontext= → bekannter Schlüssel oder null (kein Freitext aus der URL). */
export function anliegenFromParam(value) {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "home-staging" || v === "musterwohnung-auf-zeit") return "staging";
  if (v === "architektin" || v === "planer" || v === "planungsbuero") return "architekt";
  return ANLIEGEN.includes(v) ? v : null;
}

/** Herkunft-Kontextzeile für ein Anliegen. */
export function pageContextOf(anliegen) {
  return CONTEXT_LINE[anliegen] || CONTEXT_LINE.architekt;
}

/** Nur bekannte Muster-IDs, ohne Doppelte, in fester Reihenfolge. */
export function cleanMuster(list) {
  const set = new Set(Array.isArray(list) ? list.map(String) : []);
  return MUSTER_IDS.filter((id) => set.has(id));
}

const clip = (v, max) => {
  const s = String(v ?? "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

/**
 * Felder prüfen. → { feld: fehlerSchlüssel } (leer = gültig).
 * Schlüssel: required | choose | email | phone | bedarf.
 */
export function validateArchitekt(v) {
  const e = {};
  if (!ANLIEGEN.includes(v?.anliegen)) e.anliegen = "choose";
  if (!String(v?.projektart ?? "").trim()) e.projektart = "choose";
  if (!String(v?.phase ?? "").trim()) e.phase = "choose";
  if (String(v?.bedarf ?? "").trim().length < 10) e.bedarf = "bedarf";
  if (!String(v?.vorname ?? "").trim()) e.vorname = "required";
  if (!String(v?.nachname ?? "").trim()) e.nachname = "required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v?.email ?? "").trim())) e.email = "email";
  const tel = String(v?.telefon ?? "").trim();
  if (tel && !/^[0-9+\-()\s]{6,20}$/.test(tel)) e.telefon = "phone";
  return e;
}

/**
 * Payload für /api/beratung_anfrage (Feldnamen von beratungSchema).
 * @param v       Formularwerte { anliegen, buero, projektart, phase, bedarf, muster[], merkliste[], vorname, nachname, email, telefon }
 * @param labels  { anliegen: label des gewählten Anliegens, musterLabels: {id: label}, lines: FORM.lines }
 */
export function buildArchitektPayload(v, { anliegenLabel, musterLabels = {}, lines }) {
  const L = lines;
  const text = [L.kontext];
  if (String(v.buero ?? "").trim()) text.push(`${L.buero}: ${clip(v.buero, 200)}`);
  text.push(`${L.phase}: ${clip(v.phase, 100)}`);
  const muster = cleanMuster(v.muster).map((id) => musterLabels[id] || id);
  if (muster.length) text.push(`${L.muster}: ${muster.join(", ")}`);
  const merk = (Array.isArray(v.merkliste) ? v.merkliste : []).map((n) => clip(n, 140)).filter(Boolean).slice(0, 50);
  if (merk.length) text.push(`${L.merkliste}: ${merk.join(", ")}`);
  text.push("", `${L.bedarf}:`, clip(v.bedarf, 8000));
  return {
    bei_meiner_anfrage_geht_es_um: clip(anliegenLabel, 200),
    das_projekt_soll_verwirklicht_werden: clip(v.projektart, 200),
    bitte_beschreiben_sie_ihr_vorhaben: text.join("\n"),
    vorname: clip(v.vorname, 100),
    nachname: clip(v.nachname, 100),
    email: String(v.email ?? "").trim(),
    telefon: String(v.telefon ?? "").trim(),
  };
}

/**
 * Feste Ansprechperson aus dem Team-Datensatz (fetchTeamData): nur eine
 * Person, deren Rolle im Backoffice ausdrücklich Architekten, Objekt, Projekt
 * oder B2B nennt. Sonst null → die Seite nennt nur die Rolle, keinen Namen.
 */
export function pickContact(team) {
  const list = Array.isArray(team) ? team : [];
  const m = list.find((p) => p?.status === "Aktiv" && /architekt|objekt|projekt|b2b|contract|bauträger|bautraeger/i.test(String(p?.role || "")));
  return m ? { name: String(m.title || ""), role: String(m.role), email: m.email ? String(m.email) : null } : null;
}
