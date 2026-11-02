// src/lib/portal/tagebuch/konten.js — persönliche Team-Logins für das Projekt-Tagebuch.
//
// Statt eines gemeinsamen Team-Schlüssels (RAUM_TEAM_TOKEN, Abnahme Service T10,
// Prüfung Technik „Tagebuch“) meldet sich jede Mitarbeiterin und jeder
// Mitarbeiter mit eigenem Benutzernamen und Passwort an. Jede Prüfung und
// Veröffentlichung trägt damit die Kennung der Person (nachvollziehbar, wer eine
// Referenz veröffentlicht hat), und ein Konto lässt sich einzeln sperren.
//
// Rollen und Rechte:
//   "studio"    Referenz-Freigaben prüfen, veröffentlichen, ablehnen, zurückziehen;
//               Fotos aller Phasen hochladen und löschen.
//   "mitarbeit" Tagebücher sehen, Fotos aller Phasen hochladen und löschen;
//               KEINE Entscheidung über Referenzen (API 403).
//
// Quelle der Konten:
//   Produktion: TAGEBUCH_TEAM_KONTEN = JSON-Liste
//     [{ "id": "hmenghin", "name": "Harald Menghin", "rolle": "studio", "hash": "scrypt$…" }]
//     Hash erzeugen: node tools/tagebuch-team-hash.mjs <passwort>
//     Ohne Variable (oder ohne gültiges Konto): Team-Bereich aus (404), kein Fallback.
//     Mit dem Frappe-Adapter (TAGEBUCH_ADAPTER=frappe) übernimmt später die
//     Frappe-Rolle „Projekt Referenz Studio“ (tagebuch/README.md) diese Liste.
//   Entwicklung ohne Variable: zwei Demo-Konten (Mock), Hinweis auf der Login-Seite.
//
// Rein (nur node:crypto), ohne "server-only" und ohne "@/…": node --test lädt es direkt.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const ROLLEN = Object.freeze({
  studio: Object.freeze({ label: "Studio", rechte: Object.freeze(["tagebuch_sehen", "foto_team", "referenz_pruefen"]) }),
  mitarbeit: Object.freeze({ label: "Mitarbeit", rechte: Object.freeze(["tagebuch_sehen", "foto_team"]) }),
});

export const KONTO_ID = /^[a-z][a-z0-9._-]{2,31}$/;
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 };

/** Passwort-Hash im Format "scrypt$<salt base64url>$<hash base64url>". */
export function hashPasswort(passwort, salt = randomBytes(16)) {
  const h = scryptSync(String(passwort), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${Buffer.from(salt).toString("base64url")}$${h.toString("base64url")}`;
}

/** Konstantzeit-Vergleich gegen einen gespeicherten Hash. */
export function pruefePasswort(passwort, gespeichert) {
  const teile = String(gespeichert || "").split("$");
  if (teile.length !== 3 || teile[0] !== "scrypt" || typeof passwort !== "string" || !passwort || passwort.length > 256) return false;
  try {
    const salt = Buffer.from(teile[1], "base64url");
    const soll = Buffer.from(teile[2], "base64url");
    if (salt.length < 8 || soll.length !== SCRYPT.keylen) return false;
    const ist = scryptSync(passwort, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
    return timingSafeEqual(ist, soll);
  } catch {
    return false;
  }
}

// Demo-Konten nur außerhalb der Produktion. Feste Salze, damit der Hash pro
// Prozess gleich bleibt; die Passwörter stehen bewusst offen auf der Login-Seite.
export const DEV_KONTEN = Object.freeze([
  Object.freeze({ id: "studio.demo", name: "Studio Demo", rolle: "studio", passwort: "dev-studio-tagebuch" }),
  Object.freeze({ id: "team.demo", name: "Team Demo", rolle: "mitarbeit", passwort: "dev-team-tagebuch" }),
]);

let devCache = null;
function devKonten() {
  if (!devCache) devCache = DEV_KONTEN.map((k) => ({ id: k.id, name: k.name, rolle: k.rolle, hash: hashPasswort(k.passwort, Buffer.from(`ph-dev-${k.id}`)) }));
  return devCache;
}

/** Liest und prüft TAGEBUCH_TEAM_KONTEN. Ungültige Einträge werden ausgelassen (und gemeldet). */
export function parseKonten(roh, log = console) {
  if (!roh || !String(roh).trim()) return [];
  let liste;
  try {
    liste = JSON.parse(String(roh));
  } catch {
    log.error?.("[tagebuch] TAGEBUCH_TEAM_KONTEN ist kein gültiges JSON");
    return [];
  }
  if (!Array.isArray(liste)) return [];
  const gesehen = new Set();
  const out = [];
  for (const k of liste) {
    const id = String(k?.id || "").trim().toLowerCase();
    const ok = KONTO_ID.test(id) && !gesehen.has(id) && ROLLEN[k?.rolle] && /^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(String(k?.hash || ""));
    if (!ok) {
      log.error?.(`[tagebuch] Team-Konto ausgelassen (Kennung, Rolle oder Hash ungültig)`);
      continue;
    }
    gesehen.add(id);
    out.push({ id, name: String(k.name || id).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 60) || id, rolle: k.rolle, hash: String(k.hash) });
  }
  return out;
}

const istProduktion = (env) => env.NODE_ENV === "production";

/** Aktive Konten: aus der Variable, sonst (nur Entwicklung) die Demo-Konten. */
export function teamKonten(env = process.env) {
  const eigene = parseKonten(env.TAGEBUCH_TEAM_KONTEN);
  if (eigene.length) return eigene;
  return istProduktion(env) ? [] : devKonten();
}

export const teamLoginAktiv = (env = process.env) => teamKonten(env).length > 0;
export const teamDemoKonten = (env = process.env) => !istProduktion(env) && parseKonten(env.TAGEBUCH_TEAM_KONTEN).length === 0;

/** Anmeldung: { id, name, rolle } oder null. Unbekannte Kennung kostet gleich viel Zeit (Dummy-Hash). */
const DUMMY = hashPasswort("x", Buffer.from("ph-dummy-salt-00"));
export function anmelden(benutzer, passwort, env = process.env) {
  const id = String(benutzer || "").trim().toLowerCase();
  const konto = teamKonten(env).find((k) => k.id === id);
  const ok = pruefePasswort(String(passwort || ""), konto ? konto.hash : DUMMY);
  return konto && ok ? { id: konto.id, name: konto.name, rolle: konto.rolle } : null;
}

/** Konto zu einer Sitzung, mit der AKTUELLEN Rolle (gesperrt/entfernt = null). */
export function kontoVon(id, env = process.env) {
  const k = teamKonten(env).find((x) => x.id === id);
  return k ? { id: k.id, name: k.name, rolle: k.rolle } : null;
}

/** Recht prüfen; nimmt ein Konto ({ rolle }) oder eine Sitzung ({ teamRolle }). */
export function darf(team, recht) {
  const rolle = team?.teamRolle || team?.rolle;
  return Boolean(team && ROLLEN[rolle]?.rechte.includes(recht));
}
