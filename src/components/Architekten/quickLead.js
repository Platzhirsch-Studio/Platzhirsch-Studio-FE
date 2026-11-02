// Rat 9,5 B10 (ux 6): Anfrage der Seite /architekten in zwei Stufen.
// Stufe 1 – vier Pflichtfelder: Büro oder Firma, Vor- und Nachname, E-Mail,
// Vorhaben in einem Satz. Stufe 2 „Details ergänzen“ (freiwillig): Anliegen
// (Standard: Planung für ein Projekt des Büros), Projektart, Projektphase,
// Telefon, Merkliste.
//
// Baut auf src/lib/architekten/lead.js auf (unverändert, nur gelesen): gleicher
// Lead-Weg /api/beratung_anfrage. beratungSchema braucht vorname + nachname
// und eine Projektart → Name am letzten Leerzeichen geteilt (mindestens zwei
// Teile), Projektart ohne Angabe „nicht angegeben“; eine leere Phase steht
// nicht als leere Zeile im Anfragetext.
// Reines Modul (keine "@/..."-Importe): tests/unit/rat95-t3-formulare.test.mjs.
import { ANLIEGEN, buildArchitektPayload } from "../../lib/architekten/lead.js";

export const ARCH_QUICK_TEXT = Object.freeze({
  de: {
    name: "Vor- und Nachname",
    vorhaben: "Ihr Vorhaben in einem Satz",
    details: "Details ergänzen",
    detailsHint: "Freiwillig: Anliegen, Projektart, Phase und Telefon helfen uns bei der ersten Antwort.",
    notGiven: "nicht angegeben",
    errors: { nameBoth: "Bitte geben Sie Vor- und Nachnamen an, zum Beispiel Anna Muster." },
  },
  en: {
    name: "First and last name",
    vorhaben: "Your project in one sentence",
    details: "Add details",
    detailsHint: "Optional: request type, project type, phase and phone help us with our first reply.",
    notGiven: "not specified",
    errors: { nameBoth: "Please enter both first and last name, for example Anna Smith." },
  },
});

export const archQuickText = (locale) => ARCH_QUICK_TEXT[locale] || ARCH_QUICK_TEXT.de;

/** Pflichtfelder (Fokus-Reihenfolge) und geprüfte Detailfelder. */
export const ARCH_REQUIRED = Object.freeze(["buero", "name", "email", "bedarf"]);
export const ARCH_DETAILS = Object.freeze(["anliegen", "projektart", "phase", "telefon"]);
export const ARCH_ORDER = Object.freeze([...ARCH_REQUIRED, ...ARCH_DETAILS]);
export const DEFAULT_ANLIEGEN = "architekt";

const trim = (v) => String(v ?? "").trim();

/** "Anna Maria Muster" → { vorname: "Anna Maria", nachname: "Muster" }; ein Teil → null. */
export function splitName(value) {
  const parts = trim(value).split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return { vorname: parts.slice(0, -1).join(" "), nachname: parts[parts.length - 1] };
}

/**
 * Felder prüfen → { feld: fehlerSchlüssel } (leer = gültig).
 * Schlüssel wie lead.js (required | choose | email | phone | bedarf) plus nameBoth.
 */
export function validateArchQuick(v) {
  const e = {};
  if (!trim(v?.buero)) e.buero = "required";
  const name = trim(v?.name);
  if (!name) e.name = "required";
  else if (!splitName(name)) e.name = "nameBoth";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trim(v?.email))) e.email = "email";
  if (trim(v?.bedarf).length < 10) e.bedarf = "bedarf";
  if (trim(v?.anliegen) && !ANLIEGEN.includes(v.anliegen)) e.anliegen = "choose";
  const tel = trim(v?.telefon);
  if (tel && !/^[0-9+\-()\s]{6,20}$/.test(tel)) e.telefon = "phone";
  return e;
}

/** Hat die zweite Stufe einen Fehler? Dann klappt sie auf. */
export const archDetailsHaveError = (errors) => ARCH_DETAILS.some((k) => errors[k]);

/**
 * Payload für /api/beratung_anfrage. `opts` wie buildArchitektPayload plus
 * `anliegenLabels` (FORM.anliegen.options) und `notGiven`.
 */
export function buildArchQuickPayload(v, { anliegenLabels, musterLabels, lines, notGiven }) {
  const anliegen = ANLIEGEN.includes(v.anliegen) ? v.anliegen : DEFAULT_ANLIEGEN;
  const n = splitName(v.name) || { vorname: trim(v.name), nachname: "" };
  const payload = buildArchitektPayload(
    { ...v, ...n, anliegen, projektart: trim(v.projektart) || notGiven },
    { anliegenLabel: anliegenLabels[anliegen], musterLabels, lines },
  );
  const emptyPhase = `${lines.phase}:`;
  const text = payload.bitte_beschreiben_sie_ihr_vorhaben
    .split("\n")
    .filter((line) => line.trim() !== emptyPhase)
    .join("\n");
  return { ...payload, bitte_beschreiben_sie_ihr_vorhaben: text };
}
