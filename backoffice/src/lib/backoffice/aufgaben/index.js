// Zu-tun-Register (MASTER G-11, Q-B4, C-02; Team P0-5b): eine Liste für „Zu tun“ auf jedem Bereichsstart und
// in der Zentrale. Jede Zeile ist eine Quelle: Symbol · Satz („3 Preise laufen ab“) · Zähler · genau ein Knopf.
//
// Bereiche legen ihre Quellen in aufgaben/<bereich>.js an (Default-Export: Array von Definitionen) und melden
// die Importzeile hier unten an P0-5/L0 – index.js setzt nur zusammen, kein Bereich schreibt hier.
//
// Definition je Quelle:
//   { id: "faktura.bank-offen",                      // „<bereich>.<name>“, eindeutig
//     bereich: "faktura",
//     icon: "Banknote",                               // Name aus components/Backoffice/icons.js
//     ton?: "cognac"|"eiche"|"salbei"|"see"|"messing"|"nuss"|"stein"|"ziegel",   // Fläche des Symbolkreises
//     satz: (n) => `${n} Umsätze warten auf Zuordnung`, // Satz mit Zahl (Texte aus <bereich>/texte.js)
//     unter?: string | (n) => string,                  // Nebenzeile 13 px
//     sichten?: ["mir", "team"],                       // Filter-Chips oben (Standard: beide)
//     recht?: { bereich, aktion },                     // wer die Zeile sieht (Standard: read im Bereich)
//     rang?: number,                                   // kleiner = weiter oben (Standard 100)
//     zaehle: async ({ session, client }) => number,   // 0 → Zeile entfällt
//     lade?: async ({ session, client }, limit) => [{ name, titel, href }],   // für Seiten „Alle“ (optional)
//     knopf: { titel: "Zuordnen", href: string | ({ session }) => string }
//          | { titel, action: "<server action id>" } } // Aktion über die Fachbereichs-Action (Client-Knopf)
// Ein Fehler oder Zeitlimit (8 s) einer Quelle trifft nur ihre Zeile („Konnte nicht geladen werden · Erneut“).
// Reines Modul (keine "@/"-Importe), läuft unter node --test.

import { darf } from "../auth/rechte.js";

/** Registrierte Bereichsdateien (Import-Zeilen trägt P0-5/L0 ein, sobald ein Bereich eine Datei liefert). */
export const ZUTUN_BEREICHE = {};

export const ZUTUN_ZEITLIMIT_MS = 8000;
export const SICHTEN = ["alle", "mir", "team"];
const ID = /^[a-z]+\.[a-z0-9-]{1,48}$/;

/** Alle Definitionen (flach, sortiert nach rang) aus einem Register { bereich: [def, …] }. */
export function alleQuellen(register = ZUTUN_BEREICHE) {
  return Object.entries(register)
    .flatMap(([bereich, liste]) => (liste || []).map((d) => ({ bereich, ...d })))
    .sort((a, b) => (a.rang ?? 100) - (b.rang ?? 100));
}

/** Konsistenz (Unit-Test): ID-Schlüssel, Präfix = Bereich, Pflichtteile, Dubletten, genau ein Knopf. */
export function pruefeQuellen(register = ZUTUN_BEREICHE) {
  const befunde = [];
  const ids = new Set();
  for (const d of alleQuellen(register)) befunde.push(...pruefeQuelle(d, ids));
  return befunde;
}

/** Prüfung einer einzelnen Definition (auch für Demo- und Fundament-Quellen). */
export function pruefeQuelle(d, ids = new Set()) {
  const b = [];
  if (!ID.test(d?.id || "")) b.push(`Zu tun: ID ungültig (${JSON.stringify(d?.id)})`);
  else if (d.bereich && !d.id.startsWith(`${d.bereich}.`) && !d.id.startsWith("fundament.")) b.push(`Zu tun ${d.id}: Präfix passt nicht zum Bereich ${d.bereich}`);
  if (d?.id && ids.has(d.id)) b.push(`Zu tun: ID doppelt (${d.id})`);
  if (d?.id) ids.add(d.id);
  if (typeof d?.satz !== "function") b.push(`Zu tun ${d?.id}: satz(n) fehlt`);
  if (typeof d?.zaehle !== "function") b.push(`Zu tun ${d?.id}: zaehle() fehlt`);
  if (!d?.knopf?.titel) b.push(`Zu tun ${d?.id}: knopf.titel fehlt`);
  else if (!d.knopf.href && !d.knopf.action) b.push(`Zu tun ${d?.id}: knopf braucht href oder action`);
  else if (d.knopf.href && d.knopf.action) b.push(`Zu tun ${d?.id}: knopf hat href und action (genau eins)`);
  if (d?.sichten && !d.sichten.every((s) => s === "mir" || s === "team")) b.push(`Zu tun ${d?.id}: sichten nur „mir“/„team“`);
  return b;
}

/** Quellen, die die Sitzung sehen darf, gefiltert nach Sicht („alle“ | „mir“ | „team“). */
export function sichtbareQuellen(quellen = [], { session, sicht = "alle" } = {}) {
  return quellen.filter((d) => {
    if (sicht !== "alle" && d.sichten && !d.sichten.includes(sicht)) return false;
    if (!session) return true;
    const r = d.recht || (d.bereich && d.bereich !== "fundament" ? { bereich: d.bereich, aktion: "read" } : null);
    return r ? darf(session, r.bereich, r.aktion || "read") : true;
  });
}

/** Promise mit Zeitlimit → { status: "ok", wert } | { status: "zeitlimit" } | { status: "fehler", fehler }. */
export async function mitZeitlimit(promise, ms = ZUTUN_ZEITLIMIT_MS) {
  let t;
  const zeit = new Promise((r) => {
    t = setTimeout(() => r({ status: "zeitlimit" }), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promise).then((wert) => ({ status: "ok", wert })), zeit]);
  } catch (fehler) {
    return { status: "fehler", fehler };
  } finally {
    clearTimeout(t);
  }
}

/** Zählt eine Quelle robust: nie werfen, Zahl ganzzahlig ≥ 0. */
export async function zaehleQuelle(def, ctx, { zeitlimitMs = ZUTUN_ZEITLIMIT_MS } = {}) {
  let p;
  try {
    p = def.zaehle(ctx);
  } catch (fehler) {
    return { status: "fehler", fehler };
  }
  const r = await mitZeitlimit(p, zeitlimitMs);
  if (r.status !== "ok") return r;
  const n = Number(r.wert);
  if (!Number.isFinite(n) || n < 0) return { status: "fehler", fehler: new Error("Zähler ungültig") };
  return { status: "ok", n: Math.floor(n) };
}

/** Darstellbare Zeile (serialisierbar) aus Definition + Zahl. */
export function zeileAus(def, n, ctx = {}) {
  const href = typeof def.knopf?.href === "function" ? def.knopf.href(ctx) : def.knopf?.href || null;
  return {
    id: def.id,
    icon: def.icon || "CheckSquare",
    ton: def.ton || "stein",
    satz: def.satz(n),
    unter: typeof def.unter === "function" ? def.unter(n) : def.unter || null,
    n,
    knopf: { titel: def.knopf?.titel, href, action: def.knopf?.action || null },
  };
}

const ENDZUSTAND = /erledigt|abgeschlossen|storniert|archiv|bezahlt|zugestellt|verworfen|abgelehnt|geschlossen|inaktiv|ausgelaufen|versendet$/i;

/** Heutiges Datum (Wien) als JJJJ-MM-TT. */
export function heuteIso(jetzt = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Vienna" }).format(jetzt);
}

/**
 * Generische Quellen für einen Bereich ohne eigene Startseite (BereichStart), nur aus echten Daten:
 *  1. fällige eigene Aufgaben (PH Aufgabe, Bezug auf DocTypes des Bereichs),
 *  2. je Liste mit Status: Einträge im ersten Ablaufschritt (z. B. „Neu“, „Offen“, „Entwurf“).
 * @param {{slug:string, doctypes:string[]}} bereich
 * @param {Array<{dt:string, meta:object, label:string, href:string}>} listen   nur Listen mit Leserecht
 * @param {{texte:object, aufgaben?:boolean, aufgabenHref?:string}} opt   texte = ZUTUN aus components/Backoffice/ZuTun/texte.js;
 *   aufgaben = Sitzung darf PH Aufgabe lesen (sonst entfällt Zeile 1); anzeige = Status-Anzeige (labels.anzeige)
 */
export function generischeQuellen(bereich, listen = [], { texte, aufgaben = false, anzeige = (x) => x, aufgabenHref = "/d/ph-aufgabe?status=Offen&f_zugewiesen_an=ich" } = {}) {
  const t = texte;
  const quellen = [];
  if (aufgaben) {
    quellen.push({
      id: `fundament.aufgaben-${bereich.slug}`,
      bereich: "fundament",
      icon: "CheckSquare",
      ton: "cognac",
      rang: 10,
      sichten: ["mir"],
      satz: t.aufgabenFaellig,
      unter: t.aufgabenFaelligUnter,
      zaehle: async ({ session, client }) => {
        if (!client || !session) return 0;
        const filters = [
          ["zugewiesen_an", "=", session.user],
          ["status", "in", ["Offen", "In Arbeit"]],
          ["faellig", "<=", heuteIso()],
        ];
        const fremd = bereich.doctypes.filter((d) => d !== "PH Aufgabe");
        if (bereich.slug !== "zentrale" && fremd.length) filters.push(["referenz_doctype", "in", fremd]);
        return client.count("PH Aufgabe", { filters });
      },
      knopf: { titel: t.ansehen, href: aufgabenHref },
    });
  }
  for (const l of listen) {
    const erster = (l.meta?.statusOptionen || []).find((s) => s && !ENDZUSTAND.test(s));
    if (!erster || l.dt === "PH Aufgabe") continue;
    quellen.push({
      id: `fundament.${bereich.slug}-${String(l.meta.slug || l.dt).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)}`,
      bereich: "fundament",
      icon: "Inbox",
      ton: "see",
      rang: 50,
      sichten: ["team"],
      satz: (n) => t.imStatus(l.label, n, anzeige(erster)),
      unter: t.imStatusUnter,
      zaehle: async ({ client }) => (client ? client.count(l.dt, { filters: [["status", "=", erster]] }) : 0),
      knopf: { titel: t.oeffnen, href: `${l.href}?status=${encodeURIComponent(erster)}` },
    });
  }
  return quellen;
}
