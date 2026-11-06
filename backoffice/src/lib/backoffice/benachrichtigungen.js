// Glocke v2 (G-15, MASTER § 4): Mitteilungen in drei Reitern „Für mich · Team · System“, gruppiert nach
// Heute/Gestern/Älter, mit Lesezustand. Quellen:
//   Für mich  Freigaben (Register freigaben/index.js) · PH Aufgabe zugewiesen an mich (offen/in Arbeit) ·
//             Frappe „Notification Log“ (for_user = ich, Arten Assignment/Mention/Share)
//   Team      PH Aufgabe ohne Zuständigkeit (offen) – wer sie sieht, entscheidet das Leserecht
//   System    Frappe „Notification Log“ der Art Alert/Energy Point/Default (z. B. Kalkulation rot)
// Lesezustand: Notification Log über das Feld `read` in Frappe; Aufgaben und Freigaben haben dort kein
// Lesefeld – ihr „gelesen“ hält der Backoffice-Prozess je Benutzer (Mock: immer so; siehe Übergabe P0-7).
// Rechte: Mock- und Frappe-Client prüfen das Leserecht selbst (ohne Recht → Fehler → leere Liste).
// Reines Modul ohne Server-Importe (Client wird übergeben): die Glocke nutzt die Hilfsfunktionen im Browser,
// läuft unter node --test.

import { doctypeSlug } from "./format.js";

export const GLOCKE_TABS = ["fuer-mich", "team", "system"];
const ZONE = "Europe/Vienna";
const SYSTEM_ARTEN = new Set(["Alert", "Energy Point", "Default"]);

// ---------------------------------------------------------------- Lesezustand (Prozess) --

const G = globalThis;
function gelesenSpeicher() {
  if (!G.__phBoGlockeGelesen) G.__phBoGlockeGelesen = new Map();
  return G.__phBoGlockeGelesen;
}

/** IDs, die ein Benutzer im Backoffice als gelesen markiert hat (Aufgaben, Freigaben). */
export function gelesenFuer(user) {
  const m = gelesenSpeicher();
  if (!m.has(user)) m.set(user, new Set());
  return m.get(user);
}

// ---------------------------------------------------------------- Zeit und Gruppen --

function tagIso(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Datumsangabe aus Frappe ("2026-11-04 08:41:00" ohne Zone = Wiener Ortszeit) oder ISO → Date. */
export function alsDatum(wert) {
  if (!wert) return null;
  if (wert instanceof Date) return wert;
  const s = String(wert);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00`) : new Date(s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "heute" | "gestern" | "aelter" (Wiener Kalendertag). Ohne Zeit → "aelter". */
export function tagGruppe(wert, jetzt = new Date()) {
  const d = alsDatum(wert);
  if (!d) return "aelter";
  const t = tagIso(d);
  if (t >= tagIso(jetzt)) return "heute";
  const gestern = new Date(jetzt.getTime() - 86_400_000);
  return t === tagIso(gestern) ? "gestern" : "aelter";
}

/** Einträge eines Reiters → [{schluessel, eintraege}] in der Reihenfolge Heute, Gestern, Älter (leere entfallen). */
export function gruppiereNachTag(eintraege = [], jetzt = new Date()) {
  const g = { heute: [], gestern: [], aelter: [] };
  for (const e of eintraege) g[tagGruppe(e.zeit, jetzt)].push(e);
  return ["heute", "gestern", "aelter"].filter((k) => g[k].length).map((k) => ({ schluessel: k, eintraege: g[k] }));
}

/** Zähler-Pop nur bei Zunahme (G-15: 240 ms nur bei Zunahme). */
export function zaehlerSteigt(alt, neu) {
  return Number.isFinite(alt) && Number.isFinite(neu) && neu > alt;
}

/** Kurzer Stand-Schlüssel (SSE): ändert sich, wenn sich Anzahl oder IDs ändern. */
export function glockeStand(glocke) {
  const ids = GLOCKE_TABS.flatMap((t) => (glocke?.tabs?.[t] || []).map((e) => `${e.id}${e.gelesen ? "+" : ""}`));
  let h = 0;
  for (const z of ids.join("|")) h = (h * 31 + z.codePointAt(0)) >>> 0;
  return `${glocke?.anzahl ?? 0}-${h.toString(36)}`;
}

/** Fälligkeitstext einer Aufgabe ("fällig heute", "überfällig seit 02.11.", "fällig 05.11."). */
export function faelligText(faellig, jetzt = new Date()) {
  if (!faellig) return "ohne Fälligkeit";
  const d = alsDatum(faellig);
  if (!d) return "ohne Fälligkeit";
  const t = tagIso(d);
  const h = tagIso(jetzt);
  const kurz = new Intl.DateTimeFormat("de-AT", { timeZone: ZONE, day: "2-digit", month: "2-digit" }).format(d).replace(/\.?$/, ".");
  if (t === h) return "fällig heute";
  return t < h ? `überfällig seit ${kurz}` : `fällig ${kurz}`;
}

// ---------------------------------------------------------------- Laden --

async function sicher(fn, ersatz) {
  try {
    return await fn();
  } catch {
    return ersatz;
  }
}

function aufgabeZuEintrag(a, gelesen, jetzt) {
  const id = `aufgabe:${a.name}`;
  return {
    id,
    art: "aufgabe",
    titel: a.titel || a.name,
    hinweis: faelligText(a.faellig, jetzt) + (a.prioritaet === "Hoch" ? " · hohe Priorität" : ""),
    href: `/d/ph-aufgabe/${encodeURIComponent(a.name)}`,
    zeit: a.modified || a.faellig || null,
    gelesen: gelesen.has(id),
    dringend: a.prioritaet === "Hoch" || /^überfällig/.test(faelligText(a.faellig, jetzt)),
  };
}

function logZuEintrag(n) {
  const titel = String(n.subject || "").replace(/<[^>]*>/g, "").trim() || "Mitteilung";
  const href = n.document_type && n.document_name ? `/d/${doctypeSlug(n.document_type)}/${encodeURIComponent(n.document_name)}` : null;
  return { id: `log:${n.name}`, art: "mitteilung", titel, hinweis: n.from_user ? `von ${n.from_user}` : "", href, zeit: n.creation || null, gelesen: !!Number(n.read) };
}

/**
 * Glocke einer Sitzung laden. `freigaben` = bereits geladene Einträge aus freigaben/index.js (ladeFreigaben).
 * @returns {Promise<{anzahl:number, tabs:Record<"fuer-mich"|"team"|"system", Array<object>>, stand:string, fehler?:boolean}>}
 */
export async function ladeGlocke(client, session, { freigaben = [], jetzt = new Date(), limit = 12 } = {}) {
  const gelesen = gelesenFuer(session.user);
  const felder = ["name", "titel", "status", "faellig", "prioritaet", "modified"];
  const [meine, team, logs] = await Promise.all([
    sicher(() => client.getList("PH Aufgabe", { fields: felder, filters: [["zugewiesen_an", "=", session.user], ["status", "in", ["Offen", "In Arbeit"]]], orderBy: "faellig asc", limit }), []),
    sicher(() => client.getList("PH Aufgabe", { fields: felder, filters: [["zugewiesen_an", "is", "not set"], ["status", "=", "Offen"]], orderBy: "modified desc", limit: 8 }), []),
    // Notification Log gibt es nur in Frappe (Mock kennt den DocType nicht → leer).
    client.modus === "frappe"
      ? sicher(() => client.getList("Notification Log", { fields: ["name", "subject", "type", "document_type", "document_name", "from_user", "read", "creation"], filters: [["for_user", "=", session.user]], orderBy: "creation desc", limit: 20 }), [])
      : [],
  ]);
  const fuerMich = [
    ...freigaben.map((f) => ({ ...f, art: "freigabe", gelesen: gelesen.has(f.id) })),
    ...meine.map((a) => aufgabeZuEintrag(a, gelesen, jetzt)),
    ...logs.filter((n) => !SYSTEM_ARTEN.has(n.type)).map(logZuEintrag),
  ];
  const tabs = {
    "fuer-mich": fuerMich,
    team: team.map((a) => aufgabeZuEintrag(a, gelesen, jetzt)),
    system: logs.filter((n) => SYSTEM_ARTEN.has(n.type)).map(logZuEintrag),
  };
  const anzahl = fuerMich.filter((e) => !e.gelesen).length;
  const glocke = { anzahl, tabs };
  return { ...glocke, stand: glockeStand(glocke) };
}

/**
 * Als gelesen markieren. IDs „log:<name>“ → Frappe Notification Log.read = 1 (eigene Logs);
 * „aufgabe:…“/„freigabe:…“ → Prozess-Speicher je Benutzer.
 * @returns {Promise<{ok:true, anzahl:number}>}
 */
export async function markiereGelesen(client, session, ids = []) {
  const gelesen = gelesenFuer(session.user);
  let n = 0;
  for (const id of ids.slice(0, 100)) {
    const s = String(id || "");
    if (!/^(aufgabe|freigabe|log):[^\s]{1,200}$/.test(s)) continue;
    if (s.startsWith("log:")) {
      if (client.modus !== "frappe") continue;
      const ok = await sicher(async () => {
        await client.setValue("Notification Log", s.slice(4), "read", 1);
        return true;
      }, false);
      if (ok) n++;
    } else {
      gelesen.add(s);
      n++;
    }
  }
  return { ok: true, anzahl: n };
}

