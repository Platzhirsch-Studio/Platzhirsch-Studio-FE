// Kennzahlen und Chart-Daten der Zentrale – alles aus getList/count, nichts
// aus Reports, damit es im Mock wie gegen Frappe gleich läuft. Der Aktivitätsstrom
// kommt aus ph_core.api.aktivitaet.recent_activity (phCore, Mock gleich aufgebaut). Jede Kennzahl
// fängt ihren Fehler selbst (fehlender DocType → "–"), das Dashboard rendert immer.
// Reines Modul (Client wird übergeben).

import { doctypeSlug, isoDatum } from "./format.js";
import { darfDoc } from "./auth/rechte.js";
import { ladeMeta } from "./frappe/index.js";
import { phCore } from "./frappe/core.js";

async function sicher(fn, fallback = null) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function wochenstart(d) {
  const x = new Date(d);
  const tag = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - tag);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function kennzahlen(client, session, heute = new Date()) {
  const h = isoDatum(heute);
  const ws = wochenstart(heute);
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  const defs = [
    { id: "anfragen", titel: "Offene Anfragen", doctype: "PH Anfrage", filters: [["status", "in", ["Neu", "Qualifiziert"]]], href: "/d/ph-anfrage?status=Neu,Qualifiziert" },
    { id: "termine", titel: "Termine heute", doctype: "PH Termin", filters: [["start", "between", [h, h]], ["status", "in", ["Unbestaetigt", "Bestaetigt"]]], href: `/d/ph-termin?von=${h}&bis=${h}` },
    { id: "bestellungen", titel: "Offene Bestellungen", doctype: "PH Bestellung", filters: [["status", "in", ["offen", "zahlung_ausstehend", "bezahlt", "versandbereit", "abholbereit", "pruefen"]]], href: "/d/ph-bestellung?status=offen,zahlung_ausstehend,bezahlt,versandbereit,abholbereit" },
    { id: "posten", titel: "Offene Posten", doctype: "PH Rechnung", filters: [["status", "in", ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"]]], href: "/d/ph-rechnung?status=Gestellt,Teilbezahlt,Ueberfaellig,Gemahnt", summe: "offen_cent" },
    { id: "montagen", titel: "Montagen diese Woche", doctype: "PH Montageauftrag", filters: [["start", "between", [isoDatum(ws), isoDatum(we)]], ["status", "not in", ["Abgebrochen"]]], href: `/d/ph-montageauftrag?von=${isoDatum(ws)}&bis=${isoDatum(we)}` },
    { id: "service", titel: "Offene Servicefälle", doctype: "PH Servicefall", filters: [["status", "not in", ["Erledigt", "Geschlossen", "Abgelehnt"]]], href: "/d/ph-servicefall" },
  ];
  return Promise.all(
    defs.map(async (d) => {
      const meta = await sicher(() => ladeMeta(client, d.doctype));
      if (!meta || !darfDoc(session, meta, "read")) return { ...d, wert: null, sichtbar: false };
      const wert = await sicher(() => client.count(d.doctype, { filters: d.filters }));
      let summeCent = null;
      if (d.summe) {
        const zeilen = await sicher(() => client.getList(d.doctype, { fields: [d.summe], filters: d.filters, limit: 1000 }), []);
        summeCent = zeilen.reduce((a, z) => a + (Number(z[d.summe]) || 0), 0);
      }
      return { ...d, wert, summeCent, sichtbar: true };
    })
  );
}

/** Anfragen je Kalenderwoche (letzte 8 Wochen). */
export async function anfragenJeWoche(client, session, heute = new Date(), wochen = 8) {
  const meta = await sicher(() => ladeMeta(client, "PH Anfrage"));
  if (!meta || !darfDoc(session, meta, "read")) return null;
  const start = wochenstart(heute);
  start.setDate(start.getDate() - 7 * (wochen - 1));
  const zeilen = await sicher(() => client.getList("PH Anfrage", { fields: ["eingang"], filters: [["eingang", ">=", isoDatum(start)]], limit: 5000 }), []);
  const punkte = [];
  for (let i = 0; i < wochen; i++) {
    const von = new Date(start);
    von.setDate(start.getDate() + i * 7);
    const bis = new Date(von);
    bis.setDate(von.getDate() + 7);
    const n = zeilen.filter((z) => {
      const d = new Date(String(z.eingang).replace(" ", "T"));
      return d >= von && d < bis;
    }).length;
    punkte.push({ label: `KW ${kw(von)}`, wert: n });
  }
  return punkte;
}

function kw(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - tag);
  const jahrStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - jahrStart) / 86400000 + 1) / 7);
}

/** Umsatz (bezahlte Eingänge aus PH Zahlung) je Monat, letzte 6 Monate, in Cent. */
export async function umsatzJeMonat(client, session, heute = new Date(), monate = 6) {
  const meta = await sicher(() => ladeMeta(client, "PH Zahlung"));
  if (!meta || !darfDoc(session, meta, "read")) return null;
  const start = new Date(heute.getFullYear(), heute.getMonth() - (monate - 1), 1);
  const zeilen = await sicher(
    () => client.getList("PH Zahlung", { fields: ["zeitpunkt", "betrag_cent", "art", "status"], filters: [["zeitpunkt", ">=", isoDatum(start)], ["status", "=", "Bezahlt"], ["art", "=", "Eingang"]], limit: 5000 }),
    []
  );
  const namen = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
  const punkte = [];
  for (let i = 0; i < monate; i++) {
    const m = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const summe = zeilen
      .filter((z) => {
        const d = new Date(String(z.zeitpunkt).replace(" ", "T"));
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      })
      .reduce((a, z) => a + (Number(z.betrag_cent) || 0), 0);
    punkte.push({ label: `${namen[m.getMonth()]} ${String(m.getFullYear()).slice(2)}`, wert: summe });
  }
  return punkte;
}

export async function meineAufgaben(client, session, limit = 8) {
  const meta = await sicher(() => ladeMeta(client, "PH Aufgabe"));
  if (!meta || !darfDoc(session, meta, "read")) return [];
  return sicher(
    () => client.getList("PH Aufgabe", { fields: ["name", "titel", "status", "faellig", "prioritaet", "referenz_doctype", "referenz_name"], filters: [["zugewiesen_an", "=", session.user], ["status", "in", ["Offen", "In Arbeit"]]], orderBy: "faellig asc", limit }),
    []
  );
}

const AKTIV_DOCTYPES = ["PH Anfrage", "PH Termin", "PH Projekt", "PH Bestellung", "PH Rechnung", "PH Servicefall", "PH Lieferschein", "PH Aufgabe"];

/**
 * Aktivitätsstrom roh aus ph_core.api.aktivitaet.recent_activity (Frappe) bzw. mock/core.js –
 * mehrere Ereignisse je Dokument möglich, neueste zuerst.
 * @param {{limit?:number, bereiche?:string[]}} [opts]
 * @returns {Promise<import("./frappe/core.js").PhAktivitaet[]>}
 */
export async function aktivitaetsStrom(client, session, { limit = 30, bereiche } = {}) {
  return phCore(client.modus).recentActivity({ limit, bereiche }, { client, session });
}

/** ph_core-Ereignis → Zeile der Zentrale (bisherige Schlüssel + art/zusammenfassung/vonName/href). */
export function ereignisZuZeile(e) {
  return {
    doctype: e.doctype,
    name: e.name,
    titel: e.titel || e.name,
    status: e.status ?? null,
    modified: e.zeit,
    von: e.benutzer,
    vonName: e.benutzer_name || e.benutzer,
    art: e.art,
    zusammenfassung: e.zusammenfassung,
    bereich: e.bereich || null,
    slug: doctypeSlug(e.doctype),
    href: `/d/${doctypeSlug(e.doctype)}/${encodeURIComponent(e.name)}`,
  };
}

/** Rückfall ohne ph_core: letzte Änderungen per getList über AKTIV_DOCTYPES (je 5, zusammen sortiert). */
async function aktivitaetPerListe(client, session, limit) {
  const alle = [];
  await Promise.all(
    AKTIV_DOCTYPES.map(async (dt) => {
      const meta = await sicher(() => ladeMeta(client, dt));
      if (!meta || !darfDoc(session, meta, "read")) return;
      const zeilen = await sicher(() => client.getList(dt, { fields: ["name", meta.title_field || "name", "status", "modified", "modified_by"], orderBy: "modified desc", limit: 5 }), []);
      for (const z of zeilen) alle.push({ doctype: dt, name: z.name, titel: z[meta.title_field] || z.name, status: z.status, modified: z.modified, von: z.modified_by, vonName: z.modified_by, art: "Geaendert", zusammenfassung: "Geändert", bereich: null, slug: meta.slug, href: `/d/${meta.slug}/${encodeURIComponent(z.name)}` });
    })
  );
  return alle.sort((a, b) => String(b.modified).localeCompare(String(a.modified))).slice(0, limit);
}

/**
 * Letzte Änderungen für die Zentrale: ein Aufruf recent_activity, je Dokument nur das neueste
 * Ereignis (eindeutige Listenschlüssel doctype-name). Fällt ph_core aus → getList-Rückfall.
 */
export async function aktivitaet(client, session, limit = 12) {
  let roh;
  try {
    roh = await aktivitaetsStrom(client, session, { limit: Math.min(100, limit * 4) });
  } catch {
    return aktivitaetPerListe(client, session, limit);
  }
  const gesehen = new Set();
  const out = [];
  for (const e of roh) {
    const k = `${e.doctype}::${e.name}`;
    if (gesehen.has(k)) continue;
    gesehen.add(k);
    out.push(ereignisZuZeile(e));
    if (out.length >= limit) break;
  }
  return out;
}

/** Offene Aufgaben für die Glocke (Anzahl + die nächsten drei). */
export async function benachrichtigungen(client, session) {
  const aufgaben = await meineAufgaben(client, session, 3);
  const anzahl = await sicher(() => client.count("PH Aufgabe", { filters: [["zugewiesen_an", "=", session.user], ["status", "in", ["Offen", "In Arbeit"]]] }), aufgaben.length);
  return { anzahl: anzahl ?? 0, eintraege: aufgaben.map((a) => ({ titel: a.titel, hinweis: `fällig ${a.faellig}`, href: `/d/ph-aufgabe/${encodeURIComponent(a.name)}` })) };
}
