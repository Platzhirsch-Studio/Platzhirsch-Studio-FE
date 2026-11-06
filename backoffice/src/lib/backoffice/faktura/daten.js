import "server-only";
// Lesefunktionen des Bereichs Faktura (10-konzept-faktura § 16.4): Listen, Akten, Kennzahlen, Zu tun, Budgets.
// Alles serverseitig über backoffice(session); Felder mit permlevel 1 und StB-Sperrfelder werden vor der
// Serialisierung entfernt (F-16). Q-L3: Listen ≤ 3 Aufrufe; Phase A lädt bis 500 Belege je Liste und blättert
// im Server (echte Server-Paginierung für große Mandanten: Übergabe B-FAK, offener Punkt).

import { requireRecht } from "../auth/dal.js";
import { backoffice } from "../frappe/index.js";
import { faehigkeiten } from "../faehigkeiten.js";
import { isoDatum } from "../format.js";
import { mockUeberschreibung } from "@/components/Backoffice/Faehigkeit";
import { FAKTURA, SCHALTER_IDS, schalterAn } from "./faehigkeiten.js";
import { fakturaRolle, bereinige } from "./rolle.js";
import { mahnvorschlag } from "./regeln.js";
import { anzahlungOhneRechnung } from "./zeilen.js";
import { MOCK_BUDGETS } from "../mock/seed/faktura.js";
import { api } from "./methoden.js";
import { stelleMockBestandSicher } from "./mock-bestand.js";

export const GRENZE = 500;

/** Sitzung, Recht, Client, Rolle, Schalter und „heute“ für eine Faktura-Seite. */
export async function fakturaKontext(pfad) {
  const session = await requireRecht("faktura", "read", pfad);
  const client = backoffice(session);
  stelleMockBestandSicher(client);
  const rolle = fakturaRolle(session);
  const stati = await faehigkeiten(session, SCHALTER_IDS, { katalog: FAKTURA, client, ueberschreibung: await mockUeberschreibung() });
  return { session, client, rolle, stati, schalter: schalterAn(stati), heute: isoDatum(new Date()) };
}

async function sicher(p, rueckfall) {
  try {
    return await p;
  } catch {
    return rueckfall;
  }
}

export async function alle(client, doctype, { fields = ["*"], filters, orderBy = "modified desc", limit = GRENZE } = {}) {
  return sicher(client.getList(doctype, { fields, filters, orderBy, limit }), []);
}

/** Vollständige Belege (inkl. Kindtabellen) für Listen, die Positionen/Zahlungsplan brauchen. */
export async function alleVoll(client, doctype, opts = {}) {
  const liste = await alle(client, doctype, { ...opts, fields: ["name"] });
  if (client.modus === "mock") return Promise.all(liste.map((x) => sicher(client.getDoc(doctype, x.name), null))).then((l) => l.filter(Boolean));
  return alle(client, doctype, opts);
}

export async function einstellungen(client) {
  return sicher(client.getDoc("PH Faktura Einstellungen", "PH Faktura Einstellungen"), {});
}

export async function mahnEinstellungen(client) {
  return sicher(client.getDoc("PH Mahnwesen Einstellungen", "PH Mahnwesen Einstellungen"), {});
}

/** Standardfirma oder null, wenn die Rolle PH Firma nicht lesen darf (Pflichtangaben prüft dann Frappe). */
export async function firma(client) {
  try {
    const l = await client.getList("PH Firma", { fields: ["*"], limit: 5 });
    return l.find((f) => Number(f.standard) === 1) || l[0] || {};
  } catch {
    return null;
  }
}

/** Beleg mit Verlauf; null, wenn nicht gefunden oder ohne Recht (404-gleich). */
export async function ladeBeleg(client, doctype, name, rolle) {
  try {
    const { doc, docinfo } = await client.getDocMitInfo(doctype, name);
    return { doc: bereinige(doc, rolle), docinfo };
  } catch (err) {
    if (err?.code === "not_found" || err?.code === "forbidden") return null;
    throw err;
  }
}

export async function kontaktVon(client, name) {
  if (!name) return {};
  return sicher(client.getDoc("PH Kontakt", name), {});
}

/** Mahnvorschlag (§ 5.16) aus gestellten Rechnungen + Mahnwesen-Einstellungen. */
export async function mahnbare(client, heute, rechnungen) {
  const me = await mahnEinstellungen(client);
  const re = rechnungen || (await alle(client, "PH Rechnung", { filters: [["docstatus", "=", 1]] }));
  return mahnvorschlag(re, { heute, karenzTage: Number(me.karenz_tage) || 7, mindestCent: Number(me.mindestbetrag_cent) || 1000, abstandTage: Number(me.abstand_tage) || 14 });
}

/** Daten für „Zu tun“ und Kennzahlen des Bereichsstarts (≤ 8 Aufrufe in einer Welle). */
export async function startDaten(client, rolle) {
  const [rechnungen, auftraege, angebote, er, bank, exporte, uva, gutschriften] = await Promise.all([
    alle(client, "PH Rechnung"),
    alleVoll(client, "PH Auftragsbestaetigung"),
    alle(client, "PH Angebot"),
    alle(client, "PH Eingangsrechnung"),
    rolle.darfBank ? alle(client, "PH Bankumsatz", { filters: [["status", "in", ["Offen", "Teilweise"]]] }) : [],
    alle(client, "PH Export Lauf"),
    alle(client, "PH UVA Auswertung"),
    alle(client, "PH Gutschrift"),
  ]);
  for (const a of auftraege) a.anzahlung_ohne_rechnung = anzahlungOhneRechnung(a);
  return { rechnungen, auftraege, angebote, er, bank, exporte, uva, gutschriften };
}

/** Budgets je Projekt für den Budget-Hinweis (Frappe: ph_projekte.api.projekt_kalkulation_v2). */
export async function budgets(client, projekte = []) {
  const namen = [...new Set(projekte.filter(Boolean))];
  if (!namen.length) return {};
  if (client.modus === "mock") {
    const titel = Object.fromEntries((await alle(client, "PH Projekt", { fields: ["name", "titel"] })).map((p) => [p.name, p.titel]));
    return Object.fromEntries(namen.filter((n) => MOCK_BUDGETS[n]).map((n) => [n, { ...MOCK_BUDGETS[n], titel: titel[n] || MOCK_BUDGETS[n].titel }]));
  }
  const out = {};
  for (const n of namen.slice(0, 6)) {
    const r = await api(client, "ph_projekte.api.projekt_kalkulation_v2", { projekt: n }, null);
    if (!r?.kostenarten) continue;
    out[n] = { titel: r.kopf?.titel || n, kostenarten: Object.fromEntries(r.kostenarten.map((k) => [k.kostenart, { budget_cent: k.budget_cent || 0, gebunden_cent: (k.ist_cent || 0) + (k.obligo_cent || 0) }])) };
  }
  return out;
}

/** Projekte für Auswahlfelder (Kostenzuordnung, Angebot anlegen). */
export async function projektAuswahl(client) {
  const l = await alle(client, "PH Projekt", { fields: ["name", "titel", "kunde_name", "status"], limit: 200 });
  return l.map((p) => ({ wert: p.name, titel: `${p.titel || p.name}`, unter: p.name }));
}

export async function kontaktAuswahl(client) {
  const l = await alle(client, "PH Kontakt", { fields: ["name", "titel", "vorname", "nachname", "firma", "ort", "email"], limit: 200 });
  return l.map((k) => ({ wert: k.name, titel: k.firma || [k.vorname, k.nachname].filter(Boolean).join(" ") || k.titel || k.name, unter: [k.name, k.ort].filter(Boolean).join(" · "), email: k.email || "" }));
}

/** Letzte gestellte Rechnung (Datumsregel B-04). */
export async function letzteRechnung(client) {
  const l = await alle(client, "PH Rechnung", { fields: ["name", "nummer", "datum"], filters: [["docstatus", "=", 1]], orderBy: "datum desc", limit: 50 });
  return l.sort((a, b) => String(b.datum).localeCompare(String(a.datum)))[0] || null;
}
