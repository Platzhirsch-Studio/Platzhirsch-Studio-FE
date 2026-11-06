// Reine Logik der Shell v2 (browser- und node-tauglich, Unit-Test): Palette (Präfixe, Betrag,
// Datensatz-Kontext) und Speicherschlüssel des Erstbesuchs.
import { TEXTE } from "./texte.js";

export const PRAEFIXE = [">", "/", "#", "@", "?"];
const BETRAG = /^-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$|^-?\d+,\d{1,2}$/;

/** Eingabe zerlegen: { praefix, text, betrag } – Präfix nur am Anfang, gefolgt vom Suchtext. */
export function zerlegeEingabe(roh) {
  const s = String(roh || "");
  const p = PRAEFIXE.find((x) => s.startsWith(x));
  const text = (p ? s.slice(1) : s).trimStart();
  const betrag = BETRAG.test(text.trim()) && /[,.]/.test(text) ? text.trim() : null;
  return { praefix: p || null, text, betrag };
}

/** Gruppen nach Präfix filtern (Gruppentitel wie /api/suche: Bereiche, Aktionen, Datensätze; Hilfe aus /hilfe/inhalt). */
export function filtereGruppen(gruppen, praefix) {
  if (!praefix) return gruppen;
  const nur = { ">": ["Aktionen"], "/": ["Bereiche"], "#": ["Datensätze"], "@": ["Datensätze"], "?": [TEXTE.gruppeHilfe] }[praefix] || [];
  return gruppen
    .filter((g) => nur.includes(g.titel))
    .map((g) => (praefix === "@" ? { ...g, titel: TEXTE.praefixe["@"], eintraege: g.eintraege.filter((e) => /^(Kontakt|Mitarbeiter|Bewerbung)\b/.test(e.hinweis || "")) } : g))
    .filter((g) => g.eintraege.length);
}

/** Datensatz-Kontext aus der Route /d/<slug>/<name>. */
export function datensatzAusPfad(pfad) {
  const m = String(pfad || "").match(/^\/d\/([a-z0-9-]+)\/([^/?#]+)$/);
  if (!m || m[2] === "neu") return null;
  return { slug: m[1], name: decodeURIComponent(m[2]) };
}

/** Speicherschlüssel des Erstbesuch-Bands (G-27): Route ohne Query, Kleinbuchstaben, je Benutzer-Hash. */
export function erstbesuchSchluessel(benutzerHash, route) {
  const r = String(route || "/").split(/[?#]/)[0].toLowerCase() || "/";
  return `ph-bo:${benutzerHash || "anonym"}:erstbesuch:${r}`;
}
