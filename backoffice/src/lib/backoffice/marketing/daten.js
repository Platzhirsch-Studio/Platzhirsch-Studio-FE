// Bereich Marketing – Lesefunktionen für die Seiten (10-konzept-marketing § 9.1, § 13.3 daten.js). Nur Server.
// Liest über backoffice(session) (Mock oder Frappe), Feldlisten statt „*“ in Listen, Fehler je Teilabfrage als Wert
// (Q-E1: Kachel „Nicht geladen“ statt Vollbildfehler). Im Mock wird der fachliche Seed einmal nachgezogen, falls die
// laufende Datenbank älter ist als der Bereichs-Seed (kein Neustart des Dev-Servers nötig).
import "server-only";

import { requireDocRecht, requireSession } from "../auth/dal.js";
import { backoffice, ladeMeta } from "../frappe/index.js";
import { darfDoc } from "../auth/rechte.js";
import { mockUeberschreibung } from "../../../components/Backoffice/Faehigkeit.js";
import nachlauf, { EINST, SEED_MARKE, SEED_VERSION } from "../mock/seed/marketing.js";
import { kurzform, marketingFaehigkeiten } from "./faehigkeiten.js";
import { istLeitung, istMarketing } from "./rollen.js";
import * as M from "./methoden.js";
import { alsDatum, bereitschaft, eventHeute, isoTag, kampagneSignal, monatAusSlug, personenAus, plaetze, plusTage, tageZwischen, wochenStart, stundenSeit, liste } from "./regeln.js";
import { ZUTUN } from "./texte.js";
import { druckHref } from "../druck/index.js";
import { DEMO_BENUTZER } from "../auth/mockUsers.js";

export const SEITE = 25;

/** Anzeigename einer Benutzer-Adresse (Mock: Demo-Benutzer ohne Rollenzusatz; sonst Teil vor dem @). */
export function personName(email) {
  const u = DEMO_BENUTZER.find((x) => x.email === email);
  return u ? u.name.replace(/s*(.*)$/, "") : String(email || "").split("@")[0];
}

/** Mock: fachlichen Seed einmal nachziehen (laufende Datenbank aus der Zeit vor B-MAR). */
export function mockNachzug(client) {
  if (client?.modus !== "mock") return;
  const db = client.db?.db;
  if (!db) return;
  const e = db.get(EINST)?.get(EINST);
  if (e?.[SEED_MARKE] === SEED_VERSION) return;
  nachlauf(db, { naechste: (p) => client.naechsteNummer(p) });
  // Nummernkreise hinter den Seed-Bestand setzen (PH-NL-2026-006, PH-KAM-2026-0006, PH-SOC-2026-0014).
  for (const [p, n] of [["PH-NL-2026-", 6], ["PH-KAM-2026-", 6], ["PH-SOC-2026-", 14]]) if ((client.db.zaehler?.get?.(p) || 0) < n) client.db.zaehler?.set?.(p, n);
}

/** Fehler einer Teilabfrage als Wert statt Absturz. */
export async function sicher(promise, ersatz = null) {
  try {
    return { ok: true, wert: await promise };
  } catch (err) {
    return { ok: false, wert: ersatz, code: err?.code || "unavailable", message: err?.message || "" };
  }
}

/**
 * Sitzung, Client, Recht, Fähigkeiten und Einstellungen für eine Marketing-Seite.
 * Ohne Sitzung → Login, ohne DocType-Recht → /kein-zugriff.
 */
export async function marketingKontext({ pfad, doctype = "PH Newsletter Ausgabe", aktion = "read" }) {
  const session = await requireSession(pfad);
  const client = backoffice(session);
  mockNachzug(client);
  const meta = await ladeMeta(client, doctype);
  await requireDocRecht(meta, aktion, pfad);
  const [faehig, einst, testmodus] = await Promise.all([
    marketingFaehigkeiten(session, { client, ueberschreibung: await mockUeberschreibung() }),
    M.einstellungen(client),
    M.testmodus(client),
  ]);
  return { session, client, mock: client.modus === "mock", meta, leitung: istLeitung(session), team: istMarketing(session), faehig, an: kurzform(faehig), einst, testmodus, darf: (dt, a = "read") => darfDocName(client, session, dt, a) };
}

async function darfDocName(client, session, doctype, aktion) {
  try {
    return darfDoc(session, await ladeMeta(client, doctype), aktion);
  } catch {
    return false;
  }
}

const heute = (client) => (client?.jetzt ? client.jetzt() : new Date());

// ------------------------------------------------------------------------------------------------ Übersicht

/** „Zu tun“ (§ 2.1): Leitung = Freigaben, Gutschein fällig, Uhrzeit fehlt, Kanzlei offen; Mitarbeiter = eigene Aufgaben. */
export async function zuTun(ctx) {
  const { client, session, leitung } = ctx;
  const zeilen = [];
  const jetzt = heute(client);
  const [ausgaben, wartend, social, empfehlungen, events, reisen, kampagnen] = await Promise.all([
    client.getList("PH Newsletter Ausgabe", { fields: ["name", "slug", "status", "owner", "modified", "betreff"], filters: [["status", "in", ["Freigabe", "Entwurf"]]], limit: 20 }).catch(() => []),
    M.wartendeSocial(client).catch(() => new Set()),
    client.getList("PH Social Beitrag", { fields: ["name", "titel", "status", "datum_geplant", "zustaendig", "modified"], filters: [["status", "in", ["Entwurf", "Geplant"]]], limit: 100 }).catch(() => []),
    client.getList("PH Empfehlung", { fields: ["name", "code", "empfehler_name", "status"], filters: [["status", "=", "Gutschein faellig"]], limit: 20 }).catch(() => []),
    client.getList("PH Event", { fields: ["name", "titel", "status", "datum", "uhrzeit_von"], filters: [["status", "in", ["Geplant", "Offen", "Ausgebucht"]]], limit: 20 }).catch(() => []),
    client.getList("PH Kundenreise", { fields: ["name", "titel", "werbung", "status"], limit: 20 }).catch(() => []),
    client.getList("PH Kampagne", { fields: ["name", "titel", "status", "zustaendig", "zeitraum_von", "zeitraum_bis"], filters: [["status", "=", "Aktiv"]], limit: 20 }).catch(() => []),
  ]);
  if (leitung) {
    for (const a of ausgaben.filter((x) => x.status === "Freigabe")) zeilen.push({ id: `nl-${a.name}`, ton: "orange", icon: "Mail", satz: ZUTUN.ausgabeFreigabe(`Ausgabe ${monatAusSlug(a.slug)}`, personName(a.owner)), zeit: a.modified, knoepfe: [{ titel: ZUTUN.knopf.ansehen, href: `/marketing/newsletter/${encodeURIComponent(a.name)}` }, { titel: ZUTUN.knopf.freigeben, href: `/marketing/newsletter/${encodeURIComponent(a.name)}?dialog=freigeben`, primaer: true }] });
    for (const s of social.filter((x) => wartend.has(x.name))) zeilen.push({ id: `soc-${s.name}`, ton: "orange", icon: "Share2", satz: ZUTUN.socialFreigabe(s.titel), zeit: s.modified, knoepfe: [{ titel: ZUTUN.knopf.freigeben, href: `/marketing/social/${encodeURIComponent(s.name)}?dialog=freigeben`, primaer: true }] });
    for (const e of empfehlungen) zeilen.push({ id: `emp-${e.name}`, ton: "orange", icon: "Gift", satz: ZUTUN.gutscheinFaellig(e.empfehler_name), knoepfe: [{ titel: ZUTUN.knopf.gutschein, href: `/marketing/empfehlungen/${encodeURIComponent(e.name)}` }] });
    const kanzleiOffen = reisen.filter((r) => Number(r.werbung) && r.status !== "Aktiv").length;
    if (kanzleiOffen && !Number(ctx.einst?.kanzlei_fusszeilen_freigegeben || 0)) zeilen.push({ id: "kanzlei", ton: "grau", icon: "Shield", satz: ZUTUN.kanzleiOffen(kanzleiOffen), knoepfe: [{ titel: ZUTUN.knopf.einstellungen, href: "/marketing/einstellungen" }] });
  } else {
    const meine = await M.freigabeAufgaben(client).catch(() => []);
    for (const t of meine.filter((x) => /zurückgegeben/i.test(x.description || "") && (x.allocated_to === session.user || !x.allocated_to))) zeilen.push({ id: `zr-${t.name}`, ton: "orange", icon: "Undo2", satz: String(t.description || "").replace(/<[^>]*>/g, ""), knoepfe: [{ titel: ZUTUN.knopf.oeffnen, href: t.reference_type === "PH Social Beitrag" ? `/marketing/social/${encodeURIComponent(t.reference_name)}` : `/marketing/newsletter/${encodeURIComponent(t.reference_name)}` }] });
  }
  for (const e of events) {
    const tg = tageZwischen(jetzt, e.datum);
    if (e.status === "Geplant" && !e.uhrzeit_von && tg != null && tg >= 0 && tg <= 21) zeilen.push({ id: `uhr-${e.name}`, ton: "orange", icon: "Clock", satz: ZUTUN.uhrzeitFehlt(e.titel), knoepfe: [{ titel: ZUTUN.knopf.eintragen, href: `/marketing/events/${encodeURIComponent(e.name)}?tab=eckdaten`, primaer: leitung }] });
    if (["Offen", "Ausgebucht"].includes(e.status) && tg === 1) {
      const voll = await client.getDoc("PH Event", e.name).catch(() => null);
      if (voll) zeilen.push({ id: `morgen-${e.name}`, ton: "blau", icon: "Printer", satz: ZUTUN.eventMorgen(e.titel, plaetze(voll).belegt), knoepfe: [{ titel: ZUTUN.knopf.drucken, href: druckHref("PH Event", e.name, "PH Event Teilnehmerliste") }] });
    }
  }
  for (const s of social.filter((x) => x.status === "Geplant" && x.datum_geplant === isoTag(jetzt) && (leitung || x.zustaendig === session.user))) zeilen.push({ id: `heute-${s.name}`, ton: "blau", icon: "Share2", satz: ZUTUN.heuteGeplant(s.titel), knoepfe: [{ titel: ZUTUN.knopf.markieren, href: `/marketing/social/${encodeURIComponent(s.name)}?dialog=veroeffentlicht` }] });
  for (const k of kampagnen) {
    const sig = kampagneSignal(k, jetzt);
    if (sig?.art === "vorbei" && leitung) zeilen.push({ id: `kv-${k.name}`, ton: "grau", icon: "Megaphone", satz: `Kampagne „${k.titel}“ – Zeitraum beendet`, knoepfe: [{ titel: ZUTUN.knopf.oeffnen, href: `/marketing/kampagnen/${encodeURIComponent(k.name)}` }] });
  }
  return zeilen;
}

/** Vier Kennzahlen (§ 2.1, § 5). Ohne Daten null („–“ mit „Noch keine Werte“). */
export async function startKennzahlen(client) {
  const jetzt = heute(client);
  const vormonat = isoTag(plusTage(jetzt, -30));
  const [aktiv, aktivVorher, unbestaetigt, events, beitraege] = await Promise.all([
    sicher(client.count("PH Newsletter Abo", { filters: [["status", "=", "Aktiv"]] })),
    sicher(client.count("PH Newsletter Abo", { filters: [["status", "in", ["Aktiv", "Abgemeldet"]], ["creation", "<", `${vormonat} 00:00:00`]] })),
    sicher(client.count("PH Newsletter Abo", { filters: [["status", "=", "Angemeldet unbestaetigt"], ["angemeldet_am", "<", isoDatumZeitMinus(jetzt, 48)]] })),
    sicher(client.getList("PH Event", { fields: ["name", "titel", "datum", "status", "kapazitaet", "uhrzeit_von"], filters: [["status", "in", ["Offen", "Ausgebucht"]], ["datum", ">=", isoTag(jetzt)]], orderBy: "datum asc", limit: 1 })),
    sicher(client.count("PH Social Beitrag", { filters: [["datum_geplant", "between", [isoTag(wochenStart(jetzt)), isoTag(plusTage(wochenStart(jetzt), 6))]], ["status", "!=", "Verworfen"]] })),
  ]);
  let naechstes = null;
  if (events.ok && events.wert[0]) naechstes = await client.getDoc("PH Event", events.wert[0].name).catch(() => null);
  return {
    aktiv: aktiv.ok ? aktiv.wert : null,
    vormonat: aktiv.ok && aktivVorher.ok ? aktiv.wert - aktivVorher.wert : null,
    unbestaetigt: unbestaetigt.ok ? unbestaetigt.wert : null,
    event: naechstes ? { name: naechstes.name, titel: naechstes.titel, ...plaetze(naechstes) } : null,
    beitraege: beitraege.ok ? beitraege.wert : null,
  };
}

function isoDatumZeitMinus(d, stunden) {
  const x = new Date(d.getTime() - stunden * 3600000);
  return `${isoTag(x)} ${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}:00`;
}

/** Karten der Übersicht: nächste Ausgabe, diese Woche (Social + Events), nächstes Event. */
export async function startKarten(client) {
  const jetzt = heute(client);
  const mo = wochenStart(jetzt);
  const so = plusTage(mo, 6);
  const [ausgaben, social, events] = await Promise.all([
    client.getList("PH Newsletter Ausgabe", { fields: ["name", "slug", "status", "betreff", "versand_geplant", "empfaenger_anzahl", "versandbereit", "sprache"], filters: [["status", "in", ["Entwurf", "Freigabe", "Geplant", "Wird versendet"]]], orderBy: "slug asc", limit: 10 }).catch(() => []),
    client.getList("PH Social Beitrag", { fields: ["name", "titel", "kanal", "format", "status", "datum_geplant", "uhrzeit_geplant", "bild"], filters: [["datum_geplant", "between", [isoTag(mo), isoTag(so)]], ["status", "!=", "Verworfen"]], orderBy: "datum_geplant asc", limit: 20 }).catch(() => []),
    client.getList("PH Event", { fields: ["name", "titel", "datum", "status", "uhrzeit_von", "kapazitaet"], filters: [["status", "in", ["Geplant", "Offen", "Ausgebucht"]], ["datum", ">=", isoTag(jetzt)]], orderBy: "datum asc", limit: 6 }).catch(() => []),
  ]);
  const naechsteAusgabe = ausgaben.find((a) => a.sprache !== "en") || ausgaben[0] || null;
  let ausgabeDoc = null;
  if (naechsteAusgabe) ausgabeDoc = await client.getDoc("PH Newsletter Ausgabe", naechsteAusgabe.name).catch(() => null);
  const wartend = await M.wartendeSocial(client).catch(() => new Set());
  const woche = [
    ...social.map((s) => ({ art: "social", name: s.name, titel: s.titel, datum: s.datum_geplant, zeit: s.uhrzeit_geplant, kanal: s.kanal, status: s.status, wartet: wartend.has(s.name) })),
    ...events.filter((e) => e.datum >= isoTag(mo) && e.datum <= isoTag(so)).map((e) => ({ art: "event", name: e.name, titel: e.titel, datum: e.datum, zeit: e.uhrzeit_von, status: e.status })),
  ].sort((a, b) => String(a.datum).localeCompare(String(b.datum)));
  const evOffen = events.find((e) => ["Offen", "Ausgebucht"].includes(e.status)) || events[0] || null;
  const evDoc = evOffen ? await client.getDoc("PH Event", evOffen.name).catch(() => null) : null;
  return {
    ausgabe: ausgabeDoc ? { ...ausgabeDoc, bereit: bereitschaft(ausgabeDoc.bloecke || []) } : null,
    naechsterMonat: monatAusSlug(`${jetzt.getFullYear()}-${String(jetzt.getMonth() + 2 > 12 ? 1 : jetzt.getMonth() + 2).padStart(2, "0")}`),
    woche,
    event: evDoc ? { ...evDoc, plaetze: plaetze(evDoc), heute: eventHeute(evDoc, jetzt) } : null,
  };
}

/** Mehr Zahlen (lazy): Abos je Woche (12 Wochen), Abos nach Quelle (Top 4 + Sonstige), Einwilligungen nach Zweck. */
export async function mehrZahlen(client) {
  const jetzt = heute(client);
  const [abos, einw] = await Promise.all([
    client.getList("PH Newsletter Abo", { fields: ["name", "status", "quelle", "angemeldet_am", "doi_bestaetigt_am"], limit: 5000 }),
    client.getList("PH Einwilligung", { fields: ["name", "zweck", "status"], limit: 5000 }),
  ]);
  const wochen = [];
  for (let i = 11; i >= 0; i--) {
    const von = plusTage(wochenStart(jetzt), -7 * i);
    const bis = plusTage(von, 7);
    wochen.push({ label: `${String(von.getDate()).padStart(2, "0")}.${String(von.getMonth() + 1).padStart(2, "0")}.`, wert: abos.filter((a) => { const d = alsDatum(a.angemeldet_am); return d && d >= von && d < bis; }).length });
  }
  const jeQuelle = new Map();
  for (const a of abos.filter((x) => x.status === "Aktiv")) jeQuelle.set(a.quelle || "sonstige", (jeQuelle.get(a.quelle || "sonstige") || 0) + 1);
  const quellen = [...jeQuelle].sort((a, b) => b[1] - a[1]);
  const top = quellen.slice(0, 4).map(([q, n]) => ({ label: q, wert: n }));
  const rest = quellen.slice(4).reduce((s, [, n]) => s + n, 0);
  if (rest) top.push({ label: "sonstige", wert: rest });
  const jeZweck = new Map();
  for (const w of einw.filter((x) => x.status === "Bestaetigt")) jeZweck.set(w.zweck, (jeZweck.get(w.zweck) || 0) + 1);
  const dreissig = abos.filter((a) => { const d = alsDatum(a.angemeldet_am); return d && tageZwischen(d, jetzt) <= 30; });
  const quote = dreissig.length ? Math.round((dreissig.filter((a) => a.doi_bestaetigt_am).length / dreissig.length) * 100) : null;
  return { wochen, quellen: top, zwecke: [...jeZweck].sort((a, b) => b[1] - a[1]).map(([z, n]) => ({ label: z, wert: n })), quote };
}

/** Erste Schritte (0 Ausgaben, 0 Events, 0 Beiträge) – Zustand aus den Daten. */
export async function ersteSchritte(client) {
  const [a, e, s] = await Promise.all([client.count("PH Newsletter Ausgabe", {}), client.count("PH Event", {}), client.count("PH Social Beitrag", {})].map((p) => p.catch(() => 1)));
  return { zeigen: a + e + s === 0, ausgabe: a > 0, event: e > 0, beitrag: s > 0 };
}

// ------------------------------------------------------------------------------------------------ Newsletter

export async function ausgabenListe(client, { status = [], jahr, q } = {}) {
  const filters = [];
  if (status.length) filters.push(["status", "in", status]);
  if (jahr) filters.push(["slug", "like", `${jahr}-%`]);
  const orFilters = q ? [["titel", "like", `%${q}%`], ["betreff", "like", `%${q}%`], ["slug", "like", `%${q}%`], ["name", "like", `%${q}%`]] : undefined;
  const [zeilen, alle] = await Promise.all([
    client.getList("PH Newsletter Ausgabe", { fields: ["name", "slug", "titel", "betreff", "status", "versand_geplant", "versendet_am", "empfaenger_anzahl", "gesendet", "fehler", "sprache", "kampagne", "zielgruppe"], filters, orFilters, orderBy: "slug desc", limit: 200 }),
    client.getList("PH Newsletter Ausgabe", { fields: ["name", "status", "slug"], limit: 500 }),
  ]);
  const ende = new Set(["Versendet", "Abgebrochen"]);
  zeilen.sort((a, b) => Number(ende.has(a.status)) - Number(ende.has(b.status)) || String(b.slug).localeCompare(String(a.slug)));
  const zaehler = {};
  for (const a of alle) zaehler[a.status] = (zaehler[a.status] || 0) + 1;
  return { zeilen, zaehler, gesamt: alle.length, slugs: alle.map((a) => a.slug), jahre: [...new Set(alle.map((a) => String(a.slug).slice(0, 4)).filter((j) => /^\d{4}$/.test(j)))].sort().reverse() };
}

export async function ausgabeAkte(client, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Newsletter Ausgabe", name);
  const [events, kampagnen, segmente, interessen, protokoll, nachbarn] = await Promise.all([
    client.getList("PH Event", { fields: ["name", "titel", "datum", "status"], orderBy: "datum desc", limit: 30 }).catch(() => []),
    client.getList("PH Kampagne", { fields: ["name", "titel", "status"], filters: [["status", "!=", "Beendet"]], limit: 50 }).catch(() => []),
    client.getList("PH Segment", { fields: ["name", "titel", "zweck", "status"], filters: [["status", "=", "Aktiv"], ["zweck", "=", "newsletter"]], limit: 50 }).catch(() => []),
    client.getList("PH Interesse", { fields: ["name", "interesse"], filters: [["aktiv", "=", 1]], orderBy: "sortierung asc", limit: 50 }).catch(() => []),
    M.versandProtokoll(client, name).catch(() => []),
    client.getList("PH Newsletter Ausgabe", { fields: ["name", "slug"], orderBy: "slug desc", limit: 200 }).catch(() => []),
  ]);
  const testmails = (docinfo?.comments || []).filter((c) => /^Testmail an /.test(String(c.content || "").replace(/<[^>]*>/g, "")));
  const i = nachbarn.findIndex((n) => n.name === name);
  return { doc, docinfo, events, kampagnen, segmente, interessen, protokoll, letzteTestmail: doc._letzte_testmail || testmails[0]?.creation || null, vorher: nachbarn[i + 1]?.name || null, nachher: nachbarn[i - 1]?.name || null };
}

// ------------------------------------------------------------------------------------------------ Empfänger

export async function personenListe(client, { status = [], zweck, quelle, sprache, q, seite = 1, groesse = SEITE } = {}) {
  const [abos, einw] = await Promise.all([
    client.getList("PH Newsletter Abo", { fields: ["name", "email", "titel", "status", "sprache", "quelle", "kontakt", "anrede_name", "angemeldet_am", "doi_gesendet_am", "doi_erinnert_am", "doi_bestaetigt_am", "letzte_zustellung", "altbestand_ohne_doi"], limit: 5000 }),
    client.getList("PH Einwilligung", { fields: ["name", "email", "zweck", "status", "kanal", "kontakt"], limit: 5000 }),
  ]);
  const kontaktNamen = [...new Set([...abos, ...einw].map((x) => x.kontakt).filter(Boolean))];
  const kontakte = kontaktNamen.length ? await client.getList("PH Kontakt", { fields: ["name", "vorname", "nachname", "email", "nicht_kontaktieren"], filters: [["name", "in", kontaktNamen]], limit: 500 }).catch(() => []) : [];
  const km = new Map(kontakte.map((k) => [k.name, k]));
  let personen = personenAus({ abos, einwilligungen: einw, kontakte: [] }).map((p) => {
    const k = km.get(p.abo?.kontakt || p.einwilligungen[0]?.kontakt);
    return { ...p, kontakt: k || null, name: p.abo?.anrede_name || p.abo?.titel || (k ? [k.vorname, k.nachname].filter(Boolean).join(" ") : "") };
  });
  const zaehler = {};
  for (const p of personen) {
    const s = p.abo ? (Number(p.abo.altbestand_ohne_doi || 0) ? "Altbestand" : p.abo.status) : "ohne";
    zaehler[s] = (zaehler[s] || 0) + 1;
  }
  if (status.length) personen = personen.filter((p) => p.abo && status.includes(Number(p.abo.altbestand_ohne_doi || 0) ? "Altbestand" : p.abo.status));
  if (zweck) personen = personen.filter((p) => p.zwecke.includes(zweck));
  if (quelle) personen = personen.filter((p) => (p.abo?.quelle || p.quelle) === quelle);
  if (sprache) personen = personen.filter((p) => p.abo?.sprache === sprache);
  if (q) {
    const s = q.toLowerCase();
    personen = personen.filter((p) => p.email.includes(s) || String(p.name).toLowerCase().includes(s));
  }
  const jetzt = heute(client);
  personen.sort((a, b) => (b.abo?.angemeldet_am || "").localeCompare(a.abo?.angemeldet_am || ""));
  const gesamt = personen.length;
  const start = (Math.max(1, seite) - 1) * groesse;
  return {
    zeilen: personen.slice(start, start + groesse).map((p) => ({ ...p, stunden: p.abo?.status === "Angemeldet unbestaetigt" ? stundenSeit(p.abo.angemeldet_am, jetzt) : null })),
    gesamt,
    zaehler,
  };
}

export async function einwilligungenListe(client, { status = [], zweck, kanal, q } = {}) {
  const filters = [];
  if (status.length) filters.push(["status", "in", status]);
  if (zweck) filters.push(["zweck", "=", zweck]);
  if (kanal) filters.push(["kanal", "=", kanal]);
  const orFilters = q ? [["email", "like", `%${q}%`], ["titel", "like", `%${q}%`]] : undefined;
  const [zeilen, alle] = await Promise.all([
    client.getList("PH Einwilligung", { fields: ["name", "email", "zweck", "status", "kanal", "textversion", "zeitpunkt", "doi_bestaetigt_am", "widerrufen_am", "erteilung_beleg", "kontakt"], filters, orFilters, orderBy: "zeitpunkt desc", limit: 500 }),
    client.getList("PH Einwilligung", { fields: ["status"], limit: 5000 }),
  ]);
  const zaehler = {};
  for (const w of alle) zaehler[w.status] = (zaehler[w.status] || 0) + 1;
  return { zeilen, zaehler, gesamt: alle.length };
}

export async function personAkte(client, email) {
  const e = String(email || "").toLowerCase();
  const [abo, einw, versand, reise, events, empf] = await Promise.all([
    client.getDocMitInfo("PH Newsletter Abo", e).catch(() => null),
    client.getList("PH Einwilligung", { fields: ["name", "zweck", "status", "kanal", "textversion", "zeitpunkt", "doi_bestaetigt_am", "widerrufen_am", "widerruf_kanal", "erteilung_beleg", "kontakt", "sprache", "quelle"], filters: [["email", "=", e]], orderBy: "zeitpunkt desc", limit: 100 }).catch(() => []),
    client.getList("PH Newsletter Versand", { fields: ["name", "ausgabe", "status", "gesendet_am", "zugestellt_am", "grund"], filters: [["email", "=", e]], orderBy: "gesendet_am desc", limit: 50 }).catch(() => []),
    client.getList("PH Reise Versand", { fields: ["name", "reise", "status", "gesendet_am", "geplant_am", "grund"], filters: [["empfaenger", "=", e]], orderBy: "geplant_am desc", limit: 50 }).catch(() => []),
    client.getList("PH Event", { fields: ["name", "titel", "datum", "status"], limit: 100 }).catch(() => []),
    client.getList("PH Empfehlung", { fields: ["name", "code", "status", "empfehler_email", "empfohlen_email"], orFilters: [["empfehler_email", "=", e], ["empfohlen_email", "=", e]], limit: 20 }).catch(() => []),
  ]);
  const eventZeilen = [];
  for (const ev of events) {
    const d = await client.getDoc("PH Event", ev.name).catch(() => null);
    for (const a of d?.anmeldungen || []) if (String(a.email).toLowerCase() === e) eventZeilen.push({ event: ev.name, titel: ev.titel, datum: ev.datum, status: a.status, personen: a.personen });
  }
  const kontaktName = abo?.doc?.kontakt || einw.find((w) => w.kontakt)?.kontakt || "";
  const kontakt = kontaktName ? await client.getDoc("PH Kontakt", kontaktName).catch(() => null) : null;
  if (!abo && !einw.length && !eventZeilen.length) return null;
  return { email: e, abo: abo?.doc || null, docinfo: abo?.docinfo || { comments: [], versions: [] }, einwilligungen: einw, versand, reise, events: eventZeilen, empfehlungen: empf, kontakt: kontakt ? { name: kontakt.name, titel: kontakt.kunde_name || [kontakt.vorname, kontakt.nachname].filter(Boolean).join(" ") || kontakt.name, nicht_kontaktieren: kontakt.nicht_kontaktieren } : null };
}

export async function interessenListe(client) {
  return client.getList("PH Interesse", { fields: ["name", "interesse"], filters: [["aktiv", "=", 1]], orderBy: "sortierung asc", limit: 50 }).catch(() => []);
}

// ------------------------------------------------------------------------------------------------ Events

export async function eventsListe(client, { status = [], art, jahr, q } = {}) {
  const filters = [];
  if (status.length) filters.push(["status", "in", status]);
  if (art) filters.push(["art", "=", art]);
  if (jahr) filters.push(["datum", "between", [`${jahr}-01-01`, `${jahr}-12-31`]]);
  const orFilters = q ? [["titel", "like", `%${q}%`], ["name", "like", `%${q}%`]] : undefined;
  const [kopf, alle] = await Promise.all([
    client.getList("PH Event", { fields: ["name"], filters, orFilters, orderBy: "datum asc", limit: 200 }),
    client.getList("PH Event", { fields: ["status", "datum"], limit: 500 }),
  ]);
  const docs = (await Promise.all(kopf.map((k) => client.getDoc("PH Event", k.name).catch(() => null)))).filter(Boolean);
  const jetzt = heute(client);
  const ende = new Set(["Durchgefuehrt", "Abgesagt"]);
  docs.sort((a, b) => Number(ende.has(a.status)) - Number(ende.has(b.status)) || (ende.has(a.status) ? String(b.datum).localeCompare(String(a.datum)) : String(a.datum).localeCompare(String(b.datum))));
  const zaehler = {};
  for (const e of alle) zaehler[e.status] = (zaehler[e.status] || 0) + 1;
  return { zeilen: docs.map(({ anmeldungen, einladungen: _e, ...e }) => ({ ...e, plaetze: plaetze({ ...e, anmeldungen }), heute: eventHeute(e, jetzt) })), zaehler, gesamt: alle.length, jahre: [...new Set(alle.map((e) => String(e.datum).slice(0, 4)))].sort().reverse() };
}

export async function eventAkte(client, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Event", name);
  const [vorlagen, kampagnen, alle] = await Promise.all([
    client.getList("PH Mail Vorlage", { fields: ["name", "betreff", "art"], filters: [["art", "=", "Event"]], limit: 50 }).catch(() => []),
    client.getList("PH Kampagne", { fields: ["name", "titel"], limit: 50 }).catch(() => []),
    client.getList("PH Event", { fields: ["name", "datum"], orderBy: "datum asc", limit: 200 }).catch(() => []),
  ]);
  const i = alle.findIndex((e) => e.name === name);
  return { doc, docinfo, plaetze: plaetze(doc), heute: eventHeute(doc, heute(client)), vorlagen, kampagnen, vorher: alle[i - 1]?.name || null, nachher: alle[i + 1]?.name || null };
}

// ------------------------------------------------------------------------------------------------ Social

export async function socialListe(client, { von, bis, kanaele = [], status = [], zustaendig, q } = {}) {
  const filters = [];
  if (von && bis) filters.push(["datum_geplant", "between", [von, bis]]);
  if (kanaele.length) filters.push(["kanal", "in", kanaele]);
  if (zustaendig) filters.push(["zustaendig", "=", zustaendig]);
  const orFilters = q ? [["titel", "like", `%${q}%`], ["name", "like", `%${q}%`]] : undefined;
  const [zeilen, wartend, events] = await Promise.all([
    client.getList("PH Social Beitrag", { fields: ["name", "titel", "kanal", "format", "status", "datum_geplant", "uhrzeit_geplant", "bild", "bildquelle_freigabe", "alt_text", "zustaendig", "kampagne", "reichweite", "saves", "klicks", "board"], filters, orFilters, orderBy: "datum_geplant asc", limit: 500 }),
    M.wartendeSocial(client).catch(() => new Set()),
    von && bis ? client.getList("PH Event", { fields: ["name", "titel", "datum", "uhrzeit_von", "uhrzeit_bis", "status"], filters: [["datum", "between", [von, bis]], ["status", "!=", "Abgesagt"]], limit: 50 }).catch(() => []) : [],
  ]);
  const mitWarten = zeilen.map((z) => ({ ...z, anzeigeStatus: z.status === "Entwurf" && wartend.has(z.name) ? "Wartet" : z.status }));
  return { zeilen: status.length ? mitWarten.filter((z) => status.includes(z.anzeigeStatus)) : mitWarten, events };
}

export async function socialAkte(client, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Social Beitrag", name);
  const [wartend, kampagnen, marken, alle] = await Promise.all([
    M.wartendeSocial(client).catch(() => new Set()),
    client.getList("PH Kampagne", { fields: ["name", "titel"], filters: [["status", "!=", "Beendet"]], limit: 50 }).catch(() => []),
    client.getList("PH Marke", { fields: ["name"], limit: 100 }).catch(() => []),
    client.getList("PH Social Beitrag", { fields: ["name", "datum_geplant"], orderBy: "datum_geplant asc", limit: 500 }).catch(() => []),
  ]);
  const i = alle.findIndex((x) => x.name === name);
  return { doc, docinfo, wartet: wartend.has(name), kampagnen, marken: marken.map((m) => m.name), vorher: alle[i - 1]?.name || null, nachher: alle[i + 1]?.name || null };
}

// ------------------------------------------------------------------------------------------------ Kampagnen

export async function kampagnenListe(client, { status = [], kanal, jahr, zustaendig, q } = {}) {
  const filters = [];
  if (status.length) filters.push(["status", "in", status]);
  if (kanal) filters.push(["kanal", "=", kanal]);
  if (zustaendig) filters.push(["zustaendig", "=", zustaendig]);
  if (jahr) filters.push(["zeitraum_von", "between", [`${jahr}-01-01`, `${jahr}-12-31`]]);
  const orFilters = q ? [["titel", "like", `%${q}%`], ["name", "like", `%${q}%`]] : undefined;
  const [kopf, alle] = await Promise.all([
    client.getList("PH Kampagne", { fields: ["name"], filters, orFilters, orderBy: "zeitraum_von desc", limit: 200 }),
    client.getList("PH Kampagne", { fields: ["status", "zeitraum_von"], limit: 500 }),
  ]);
  const docs = (await Promise.all(kopf.map((k) => client.getDoc("PH Kampagne", k.name).catch(() => null)))).filter(Boolean);
  const zaehler = {};
  for (const k of alle) zaehler[k.status] = (zaehler[k.status] || 0) + 1;
  const jetzt = heute(client);
  return { zeilen: docs.map((k) => ({ ...k, signal: kampagneSignal(k, jetzt) })), zaehler, jahre: [...new Set(alle.map((k) => String(k.zeitraum_von).slice(0, 4)))].sort().reverse() };
}

export async function kampagneAkte(client, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Kampagne", name);
  const [zaehlung, anfragen, kontaktpunkte, inhalte] = await Promise.all([
    sicher(M.anfragenZaehlen(client, name)),
    client.getList("PH Anfrage", { fields: ["name", "titel", "status", "eingang", "vorname", "nachname", "art"], filters: [["ph_marketing_kampagne", "=", name]], orderBy: "eingang desc", limit: 50 }).catch(() => []),
    client.getList("PH Kampagne Kontaktpunkt", { fields: ["name", "art", "zeit", "email", "referenz_doctype", "referenz_name"], filters: [["kampagne", "=", name]], orderBy: "zeit desc", limit: 50 }).catch(() => []),
    Promise.all([
      client.getList("PH Newsletter Ausgabe", { fields: ["name", "slug", "status"], filters: [["kampagne", "=", name]], limit: 20 }).catch(() => []),
      client.getList("PH Social Beitrag", { fields: ["name", "titel", "status", "kanal"], filters: [["kampagne", "=", name]], limit: 20 }).catch(() => []),
      client.getList("PH Event", { fields: ["name", "titel", "status", "datum"], filters: [["kampagne", "=", name]], limit: 20 }).catch(() => []),
    ]),
  ]);
  return { doc, docinfo, zaehlung: zaehlung.ok ? zaehlung.wert : null, stand: new Date(), anfragen, kontaktpunkte, inhalte: { ausgaben: inhalte[0], social: inhalte[1], events: inhalte[2] } };
}

// ------------------------------------------------------------------------------------------------ Empfehlungen

export async function empfehlungenListe(client, { status = [], q } = {}) {
  const filters = [];
  if (status.length) filters.push(["status", "in", status]);
  const orFilters = q ? [["code", "like", `%${q}%`], ["empfehler_name", "like", `%${q}%`], ["empfohlen_name", "like", `%${q}%`]] : undefined;
  const [zeilen, alle] = await Promise.all([
    client.getList("PH Empfehlung", { fields: ["name", "code", "status", "empfehler_name", "empfehler_email", "empfohlen_name", "auftrag", "code_gesendet_am", "creation"], filters, orFilters, orderBy: "creation desc", limit: 200 }),
    client.getList("PH Empfehlung", { fields: ["status"], limit: 500 }),
  ]);
  const zaehler = {};
  for (const e of alle) zaehler[e.status] = (zaehler[e.status] || 0) + 1;
  const mitFakten = await Promise.all(zeilen.map(async (z) => ({ ...z, fakten: z.auftrag ? await M.auftragFakten(client, z.auftrag) : null })));
  mitFakten.sort((a, b) => Number(b.status === "Gutschein faellig") - Number(a.status === "Gutschein faellig"));
  return { zeilen: mitFakten, zaehler, gesamt: alle.length };
}

export async function empfehlungAkte(client, code) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Empfehlung", code);
  const fakten = await M.auftragFakten(client, doc.auftrag);
  const auftraege = await client.getList("PH Auftragsbestaetigung", { fields: ["name", "kunde_name", "status"], orderBy: "datum desc", limit: 30 }).catch(() => []);
  return { doc, docinfo, fakten, auftraege };
}

// ------------------------------------------------------------------------------------------------ Zielgruppen, Reisen, Vorlagen

export async function segmenteListe(client, { status = [] } = {}) {
  const kopf = await client.getList("PH Segment", { fields: ["name"], filters: status.length ? [["status", "in", status]] : [], orderBy: "modified desc", limit: 100 });
  return (await Promise.all(kopf.map((k) => client.getDoc("PH Segment", k.name).catch(() => null)))).filter(Boolean);
}

export async function reisenListe(client, { status = [], grundlage, werbung, q } = {}) {
  const kopf = await client.getList("PH Kundenreise", { fields: ["name"], orderBy: "titel asc", limit: 100 });
  let docs = (await Promise.all(kopf.map((k) => client.getDoc("PH Kundenreise", k.name).catch(() => null)))).filter(Boolean);
  const vorlagen = new Map((await client.getList("PH Mail Vorlage", { fields: ["name", "html"], limit: 200 }).catch(() => [])).map((v) => [v.name, v.html]));
  const zaehler = {};
  for (const r of docs) zaehler[r.status] = (zaehler[r.status] || 0) + 1;
  if (status.length) docs = docs.filter((r) => status.includes(r.status));
  if (grundlage) docs = docs.filter((r) => Number(r[`grundlage_${grundlage.toLowerCase()}`] || 0));
  if (werbung === "ja") docs = docs.filter((r) => Number(r.werbung));
  if (werbung === "nein") docs = docs.filter((r) => !Number(r.werbung));
  if (q) docs = docs.filter((r) => String(r.titel).toLowerCase().includes(q.toLowerCase()));
  return { zeilen: docs, vorlagen, zaehler, gesamt: kopf.length };
}

export async function reiseAkte(client, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Kundenreise", name);
  const [vorlagen, events, protokoll, alle] = await Promise.all([
    client.getList("PH Mail Vorlage", { fields: ["name", "betreff", "html", "art"], filters: [["art", "=", "Kundenreise"]], limit: 50 }).catch(() => []),
    client.getList("PH Event", { fields: ["name", "titel", "datum"], limit: 50 }).catch(() => []),
    M.reiseProtokoll(client, name).catch(() => []),
    client.getList("PH Kundenreise", { fields: ["name"], orderBy: "titel asc", limit: 100 }).catch(() => []),
  ]);
  const i = alle.findIndex((r) => r.name === name);
  return { doc, docinfo, vorlagen, events, protokoll, vorlageHtml: vorlagen.find((v) => v.name === doc.vorlage)?.html || "", vorher: alle[i - 1]?.name || null, nachher: alle[i + 1]?.name || null };
}

export async function vorlagenListe(client) {
  return client.getList("PH Mail Vorlage", { fields: ["name", "vorlage_id", "betreff", "art", "sprache", "stand", "fusszeile"], orderBy: "vorlage_id asc", limit: 200 });
}

// ------------------------------------------------------------------------------------------------ Einblicke, Berichte

export async function einblicke(client, { tage = 30 } = {}) {
  const jetzt = heute(client);
  const von = isoTag(plusTage(jetzt, -tage));
  const tageListe = await client.getList("PH Einblick Tag", { fields: ["name", "datum", "status", "besuche", "seiten_json"], filters: [["datum", ">=", von]], orderBy: "datum asc", limit: 400 });
  const seiten = new Map();
  for (const t of tageListe) {
    let s = [];
    try {
      s = JSON.parse(t.seiten_json || "[]");
    } catch {
      s = [];
    }
    for (const z of s) {
      const a = seiten.get(z.pfad) || { pfad: z.pfad, besuche: 0, tage: 0, scrollSumme: 0, ziele: 0 };
      a.besuche += Number(z.besuche || 0);
      a.tage += 1;
      a.scrollSumme += Number(z.scroll || 0);
      a.ziele += Number(z.ziele || 0);
      seiten.set(z.pfad, a);
    }
  }
  const top = [...seiten.values()].map((s) => ({ ...s, scroll: s.tage ? Math.round(s.scrollSumme / s.tage) : 0 })).sort((a, b) => b.besuche - a.besuche).slice(0, 12);
  const heat = [];
  for (let i = 59; i >= 0; i--) {
    const d = isoTag(plusTage(jetzt, -i));
    const t = tageListe.find((x) => x.datum === d);
    heat.push({ datum: d, besuche: t ? Number(t.besuche || 0) : null, status: t?.status || null });
  }
  return { tage: tageListe.length, besuche: top.reduce((s, x) => s + x.besuche, 0), top, heat };
}

/** Berichte: Frappe über getReport, Mock aus den Daten berechnet (gleiche Spalten). */
export async function bericht(client, slug, { von, bis } = {}) {
  if (client.modus !== "mock") {
    const namen = { "newsletter-entwicklung": "PH Newsletter-Entwicklung", "kampagnen-roi": "PH Kampagnen-ROI", "einwilligungen-nach-zweck": "PH Einwilligungen nach Zweck", "event-auslastung": "PH Event-Auslastung", "social-redaktionsplan": "PH Social Redaktionsplan", "top-seiten": "PH Top-Seiten (Einblicke)" };
    const r = await client.getReport(namen[slug], { von, bis });
    return { spalten: r.columns || [], zeilen: r.result || [] };
  }
  if (slug === "newsletter-entwicklung") {
    const abos = await client.getList("PH Newsletter Abo", { fields: ["status", "angemeldet_am", "abgemeldet_am"], limit: 5000 });
    const monate = new Map();
    for (const a of abos) {
      const m = String(a.angemeldet_am || "").slice(0, 7);
      if (m) (monate.get(m) || monate.set(m, { monat: m, neu: 0, abgemeldet: 0 }).get(m)).neu += 1;
      const ab = String(a.abgemeldet_am || "").slice(0, 7);
      if (ab) (monate.get(ab) || monate.set(ab, { monat: ab, neu: 0, abgemeldet: 0 }).get(ab)).abgemeldet += 1;
    }
    return { spalten: [{ fieldname: "monat", label: "Monat" }, { fieldname: "neu", label: "Neue Anmeldungen", fieldtype: "Int" }, { fieldname: "abgemeldet", label: "Abmeldungen", fieldtype: "Int" }], zeilen: [...monate.values()].sort((a, b) => a.monat.localeCompare(b.monat)).map((z) => ({ ...z, monat: monatAusSlug(z.monat) })) };
  }
  if (slug === "kampagnen-roi") {
    const ks = await client.getList("PH Kampagne", { fields: ["name", "titel", "kanal", "status", "budget_cent", "ausgaben_cent", "klicks_gesamt", "anfragen_gesamt", "waehrung"], limit: 200 });
    const out = [];
    for (const k of ks) {
      let gewonnen = 0;
      try {
        gewonnen = await client.count("PH Anfrage", { filters: [["ph_marketing_kampagne", "=", k.name], ["status", "=", "Gewonnen"]] });
      } catch {
        gewonnen = 0;
      }
      out.push({ kampagne: k.titel, kanal: k.kanal, waehrung: k.waehrung || "EUR", budget_cent: k.budget_cent || 0, kosten_belegt_cent: null, kosten_gemeldet_cent: k.ausgaben_cent || 0, klicks: k.klicks_gesamt || 0, anfragen: k.anfragen_gesamt || 0, gewonnen });
    }
    return { spalten: [{ fieldname: "kampagne", label: "Kampagne" }, { fieldname: "kanal", label: "Kanal" }, { fieldname: "budget_cent", label: "Budget", fieldtype: "Currency" }, { fieldname: "kosten_belegt_cent", label: "Kosten belegt (netto)", fieldtype: "Currency" }, { fieldname: "kosten_gemeldet_cent", label: "Kosten gemeldet", fieldtype: "Currency" }, { fieldname: "klicks", label: "Klicks", fieldtype: "Int" }, { fieldname: "anfragen", label: "Anfragen", fieldtype: "Int" }, { fieldname: "gewonnen", label: "Gewonnen", fieldtype: "Int" }], zeilen: out };
  }
  if (slug === "einwilligungen-nach-zweck") {
    const w = await client.getList("PH Einwilligung", { fields: ["zweck", "status"], limit: 5000 });
    const m = new Map();
    for (const x of w) {
      const z = m.get(x.zweck) || { zweck: x.zweck, bestaetigt: 0, offen: 0, widerrufen: 0, abgelaufen: 0 };
      z[{ Bestaetigt: "bestaetigt", Offen: "offen", Widerrufen: "widerrufen", Abgelaufen: "abgelaufen" }[x.status] || "offen"] += 1;
      m.set(x.zweck, z);
    }
    return { spalten: [{ fieldname: "zweck", label: "Zweck" }, { fieldname: "bestaetigt", label: "Bestätigt", fieldtype: "Int" }, { fieldname: "offen", label: "Offen", fieldtype: "Int" }, { fieldname: "widerrufen", label: "Widerrufen", fieldtype: "Int" }, { fieldname: "abgelaufen", label: "Abgelaufen", fieldtype: "Int" }], zeilen: [...m.values()] };
  }
  if (slug === "event-auslastung") {
    const ev = await eventsListe(client, {});
    return { spalten: [{ fieldname: "event", label: "Event" }, { fieldname: "datum", label: "Datum" }, { fieldname: "kapazitaet", label: "Plätze", fieldtype: "Int" }, { fieldname: "belegt", label: "Personen", fieldtype: "Int" }, { fieldname: "warteliste", label: "Warteliste", fieldtype: "Int" }, { fieldname: "da", label: "Da", fieldtype: "Int" }], zeilen: ev.zeilen.map((e) => ({ event: e.titel, datum: e.datum, kapazitaet: e.kapazitaet || null, belegt: e.plaetze.belegt, warteliste: e.plaetze.warteliste, da: e.plaetze.da })) };
  }
  if (slug === "social-redaktionsplan") {
    const s = await client.getList("PH Social Beitrag", { fields: ["titel", "kanal", "format", "status", "datum_geplant", "reichweite", "saves", "klicks"], orderBy: "datum_geplant asc", limit: 500 });
    return { spalten: [{ fieldname: "datum_geplant", label: "Datum" }, { fieldname: "titel", label: "Beitrag" }, { fieldname: "kanal", label: "Kanal" }, { fieldname: "status", label: "Status" }, { fieldname: "reichweite", label: "Reichweite", fieldtype: "Int" }, { fieldname: "saves", label: "Saves", fieldtype: "Int" }, { fieldname: "klicks", label: "Klicks", fieldtype: "Int" }], zeilen: s };
  }
  if (slug === "top-seiten") {
    const e = await einblicke(client, { tage: 30 });
    return { spalten: [{ fieldname: "pfad", label: "Seite" }, { fieldname: "besuche", label: "Besuche", fieldtype: "Int" }, { fieldname: "tage", label: "Tage mit Daten", fieldtype: "Int" }, { fieldname: "scroll", label: "Scrolltiefe Ø", fieldtype: "Percent" }, { fieldname: "ziele", label: "Ziele", fieldtype: "Int" }], zeilen: e.top };
  }
  return null;
}

/** Sperrtage/Werbefenster aus den Einstellungen für Regeln im Client. */
export function fensterAus(einst = {}) {
  return { wochentage: liste(einst.werbung_wochentage, ["2", "3", "4"]).map(Number), sperrtage: liste(einst.sperrtage, ["12-24", "12-25", "12-26", "12-31", "01-01"]) };
}
