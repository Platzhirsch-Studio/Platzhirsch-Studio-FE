// Freigabe-Register (G-15, Q-C7, MASTER § 4): ein Muster für alle Vier-Augen-Freigaben – Glocke
// („Für mich“), Zentrale „Braucht deine Antwort“ und Bereichslisten zeigen dieselben Einträge.
//
// Bereiche legen ihre Arten in freigaben/<bereich>.js an (Default-Export: Array von Definitionen) und
// melden die Importzeile hier unten an P0-7/L0 – index.js setzt nur zusammen, kein Bereich schreibt hier.
//
// Definition je Art:
//   { art: "faktura.eingangsrechnung",            // „<bereich>.<name>“, eindeutig
//     bereich: "faktura", titel: "Eingangsrechnung",
//     geldwirksam: true,                           // → Bestätigen-Dialog mit Betrag und `folge`
//     folge?: "Die Rechnung wird zur Zahlung freigegeben.",
//     recht?: { bereich, aktion },                 // wer freigeben darf (Standard: Leitung des Bereichs)
//     laden: async (session, client) => [{ name, titel, objekt:{titel, href}, antragsteller:{user, name},
//                                         betragCent?, grund?, zeit, token }],
//     freigeben: async (session, client, { name, token }) => void,     // Backend-Methode (Mock-Pfad im Client)
//     ablehnen:  async (session, client, { name, grund }) => void }
// `token` (z. B. `modified`) schützt vor Doppel-Freigaben: stimmt er nicht mehr, meldet der Client „conflict“.
// Reines Modul (keine "@/"-Importe), läuft unter node --test.

import { darf } from "../auth/rechte.js";

/** Registrierte Bereichsdateien (Import-Zeilen trägt P0-7/L0 ein, sobald ein Bereich eine Datei liefert). */
export const FREIGABE_BEREICHE = {};

const ART = /^[a-z]+\.[a-z0-9-]{1,40}$/;
export const GRUND_MIN = 5;
export const GRUND_MAX = 500;
export const ABLEHNEN_VERZOEGERUNG_MS = 8000;

/** Alle Definitionen (flach) aus einem Register { bereich: [def, …] }. */
export function alleFreigabeArten(register = FREIGABE_BEREICHE) {
  return Object.entries(register).flatMap(([bereich, liste]) => (liste || []).map((d) => ({ bereich, ...d })));
}

/** Konsistenz (Unit-Test): Art-Schlüssel, Präfix = Bereich, Pflichtfunktionen, Dubletten. */
export function pruefeFreigaben(register = FREIGABE_BEREICHE) {
  const befunde = [];
  const arten = new Set();
  for (const d of alleFreigabeArten(register)) {
    if (!ART.test(d.art || "")) befunde.push(`Freigabe: Art ungültig (${JSON.stringify(d.art)})`);
    else if (!d.art.startsWith(`${d.bereich}.`)) befunde.push(`Freigabe ${d.art}: Präfix passt nicht zum Bereich ${d.bereich}`);
    if (arten.has(d.art)) befunde.push(`Freigabe: Art doppelt (${d.art})`);
    arten.add(d.art);
    if (!d.titel) befunde.push(`Freigabe ${d.art}: titel fehlt`);
    for (const f of ["laden", "freigeben", "ablehnen"]) if (typeof d[f] !== "function") befunde.push(`Freigabe ${d.art}: ${f}() fehlt`);
    if (typeof d.geldwirksam !== "boolean") befunde.push(`Freigabe ${d.art}: geldwirksam (true/false) fehlt`);
  }
  return befunde;
}

/** Leitungsrecht: „cancel“ haben nur Leitung, GF und System Manager (auth/rechte.js). */
export const LEITUNGS_AKTION = "cancel";

/** Darf die Sitzung diese Art freigeben? Standard: Leitung des Bereichs. */
export function darfFreigeben(session, def) {
  const r = def.recht || {};
  return darf(session, r.bereich || def.bereich, r.aktion || LEITUNGS_AKTION);
}

/** Eigener Antrag? (Vier Augen: dann gesperrt mit Satz, Q-C7) */
export function istEigenerAntrag(eintrag, session) {
  const u = String(eintrag?.antragsteller?.user || "").toLowerCase();
  return !!u && u === String(session?.user || "").toLowerCase();
}

/** Ablehngrund prüfen → null (in Ordnung) oder Fehlertext. */
export function pruefeGrund(grund) {
  const g = String(grund ?? "").trim();
  if (g.length < GRUND_MIN) return `Bitte einen Grund mit mindestens ${GRUND_MIN} Zeichen angeben.`;
  if (g.length > GRUND_MAX) return `Der Grund ist zu lang (höchstens ${GRUND_MAX} Zeichen).`;
  return null;
}

/** Roh-Eintrag einer Art → serialisierbarer Glocken-/Listeneintrag. */
export function normalisiereEintrag(def, roh, session) {
  const eigen = istEigenerAntrag(roh, session);
  return {
    id: `freigabe:${def.art}:${roh.name}`,
    art: "freigabe",
    freigabeArt: def.art,
    name: String(roh.name),
    titel: roh.titel || def.titel,
    hinweis: def.titel,
    objekt: roh.objekt?.href ? { titel: String(roh.objekt.titel || roh.name), href: String(roh.objekt.href) } : null,
    href: roh.objekt?.href || null,
    antragsteller: roh.antragsteller ? { user: String(roh.antragsteller.user || ""), name: String(roh.antragsteller.name || roh.antragsteller.user || "") } : null,
    betragCent: Number.isFinite(roh.betragCent) ? roh.betragCent : null,
    grund: roh.grund ? String(roh.grund).slice(0, 400) : "",
    zeit: roh.zeit || null,
    token: roh.token ? String(roh.token) : "",
    geldwirksam: !!def.geldwirksam,
    folge: def.folge || "",
    eigen,
  };
}

/**
 * Offene Freigaben, die diese Sitzung bearbeiten darf (eigene Anträge erscheinen gesperrt).
 * Eine fehlerhafte Art blendet nur sich selbst aus (Glocke ist Komfort, nie Blocker).
 */
export async function ladeFreigaben(session, client, { register = FREIGABE_BEREICHE } = {}) {
  const out = [];
  for (const def of alleFreigabeArten(register)) {
    if (!darfFreigeben(session, def)) continue;
    try {
      const liste = await def.laden(session, client);
      for (const roh of liste || []) if (roh?.name) out.push(normalisiereEintrag(def, roh, session));
    } catch {
      // diese Art bleibt aus
    }
  }
  return out.sort((a, b) => String(b.zeit || "").localeCompare(String(a.zeit || "")));
}

function finde(register, art) {
  return alleFreigabeArten(register).find((d) => d.art === art) || null;
}

/**
 * Freigeben (Server Action ruft das auf, nachdem sie die Sitzung geprüft hat).
 * @returns {Promise<{ok:true}|{ok:false, code:string, message:string}>}
 */
export async function fuehreFreigabeAus(session, client, { art, name, token }, { register = FREIGABE_BEREICHE } = {}) {
  const def = finde(register, art);
  if (!def) return { ok: false, code: "not_found", message: "Diese Freigabe gibt es nicht mehr." };
  if (!darfFreigeben(session, def)) return { ok: false, code: "forbidden", message: "Für diese Freigabe fehlt das Recht." };
  const offen = await def.laden(session, client);
  const roh = (offen || []).find((r) => String(r.name) === String(name));
  if (!roh) return { ok: false, code: "conflict", message: "Die Freigabe wurde bereits bearbeitet." };
  if (istEigenerAntrag(roh, session)) return { ok: false, code: "forbidden", message: "Eigener Antrag – zweite Person nötig." };
  if (roh.token && token && String(roh.token) !== String(token)) return { ok: false, code: "conflict", message: "Der Antrag wurde inzwischen geändert. Bitte neu ansehen." };
  await def.freigeben(session, client, { name: roh.name, token: roh.token });
  return { ok: true };
}

/** Ablehnen mit Pflichtgrund. */
export async function fuehreAblehnungAus(session, client, { art, name, grund }, { register = FREIGABE_BEREICHE } = {}) {
  const fehler = pruefeGrund(grund);
  if (fehler) return { ok: false, code: "invalid", message: fehler };
  const def = finde(register, art);
  if (!def) return { ok: false, code: "not_found", message: "Diese Freigabe gibt es nicht mehr." };
  if (!darfFreigeben(session, def)) return { ok: false, code: "forbidden", message: "Für diese Freigabe fehlt das Recht." };
  const offen = await def.laden(session, client);
  const roh = (offen || []).find((r) => String(r.name) === String(name));
  if (!roh) return { ok: false, code: "conflict", message: "Die Freigabe wurde bereits bearbeitet." };
  if (istEigenerAntrag(roh, session)) return { ok: false, code: "forbidden", message: "Eigener Antrag – zweite Person nötig." };
  await def.ablehnen(session, client, { name: roh.name, grund: String(grund).trim() });
  return { ok: true };
}
