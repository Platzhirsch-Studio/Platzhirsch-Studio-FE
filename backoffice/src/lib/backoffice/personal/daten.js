import "server-only";
// Datenschicht des Bereichs Personal (Konzept § 13.4): lädt über backoffice(session), maskiert Abwesenheiten
// (sichtbarkeit.js) und entfernt permlevel-1-Felder je Rolle VOR der Rückgabe an Seiten und Client.
// Mock und Frappe laufen über dieselben Aufrufe; ph_personal-Methoden über methoden.js.
// Simulation (nur Mock außerhalb Produktion): ?sim=leer | ?sim=fehler für Leer-/Fehlerzustände der Abnahme.

import { backoffice } from "@/lib/backoffice/frappe";
import { BackofficeError, istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { faehigkeiten } from "@/lib/backoffice/faehigkeiten";
import { mockUeberschreibung } from "@/components/Backoffice/Faehigkeit";
import { isoDatum } from "@/lib/backoffice/format";
import nachsaat, { istGesaet } from "@/lib/backoffice/mock/seed/personal";
import { rng, tage } from "@/lib/backoffice/mock/seed/basis";
import { PERSONAL } from "./faehigkeiten";
import { DT, M, aufruf, methode } from "./methoden";
import { personalRolle, darfArtSehen, darfVertraulich, darfBewerbungen, istLeitung, darfEntscheiden } from "./rollen";
import { maskiereAbwesenheit, krankAlsAbwesenheit } from "./sichtbarkeit";
import { artText, statusText } from "./status";
import { antragEntscheidbar, aufBoard, gueltigInfo, kartenKennzeichen, loeschfristInfo, OFFENE_BEWERBUNG, OHNE_ENTSCHEIDUNG_TAGE, teamStaerke, teamsVon, entgeltVollstaendig } from "./regeln";
import { iso, konto, monatsTage, plusTage, tageZwischen, urlaubskonto, wochenStartIso, zeitMin, istSumme, nettoMin, minutenVon, relativTage, kurzDatum, zeitraumText, monatName } from "./zeit";
import { T } from "./texte";

export const SEITE_GROESSE = 25;

// ------------------------------------------------------------- Kontext --

/** Kontext einer Seite/Action: Client, Rolle, eigener Mitarbeiter, heute, Simulation. */
export async function kontext(session, sp = {}) {
  const client = backoffice(session);
  sichereMockSeed(client);
  const sim = client.modus !== "frappe" && process.env.NODE_ENV !== "production" && ["leer", "fehler"].includes(sp?.sim) ? sp.sim : null;
  const jetzt = client.jetzt ? client.jetzt() : new Date();
  const rolle = personalRolle(session);
  let eigener = null;
  try {
    const l = await client.getList(DT.ma, { fields: ["name", "titel", "vorname", "nachname", "status", "rolle_intern", "wochenstunden", "urlaubsanspruch_tage", "eintritt", "team_verkauf", "team_planung", "team_montage", "beschaeftigungsart"], filters: [["user", "=", session.user]], limit: 1 });
    eigener = l[0] || null;
  } catch {
    eigener = null;
  }
  return { client, session, rolle, user: session.user, eigener, heute: iso(jetzt), jetzt, sim };
}

/** Mock: läuft der Dev-Server mit einer Datenbank von vor dem B-PER-Seed (kein Neustart erlaubt), einmalig nachsäen. */
function sichereMockSeed(client) {
  if (client?.modus === "frappe" || !client?.db?.db || istGesaet(client.db.db)) return;
  nachsaat(client.db.db, { rng: rng(4711), tage, naechste: (p) => client.naechsteNummer(p) });
}

function simuliere(ctx) {
  if (ctx.sim === "fehler") throw new BackofficeError("unavailable", "Daten gerade nicht erreichbar.");
}
export const istLeer = (ctx) => ctx.sim === "leer";

export function alsFehler(err) {
  if (istBackofficeError(err)) return { code: err.code, message: err.message };
  console.error("[personal]", err?.name || err);
  return { code: "unavailable", message: "Daten gerade nicht erreichbar." };
}

/** Lädt sicher: { ok, daten } oder { ok:false, fehler } – für Kacheln mit eigenem Fehlerblock. */
export async function sicher(fn) {
  try {
    return { ok: true, daten: await fn() };
  } catch (err) {
    return { ok: false, fehler: alsFehler(err) };
  }
}

/**
 * Fähigkeiten als { konten, saldoLaufenderMonat, teamSelbstservice, … } → {an, erwartet, grund, ersatz}.
 * Mock: Cookie ph_bo_faehigkeiten überstimmt (QA-Lauf „alle an/aus“ ohne Neustart).
 */
export async function ladeFaehigkeiten(ctx) {
  const ids = Object.keys(PERSONAL);
  const r = await faehigkeiten(ctx.session, ids, { katalog: PERSONAL, client: ctx.client, ueberschreibung: await mockUeberschreibung() });
  const out = {};
  for (const id of ids) {
    const kurz = id.replace(/^personal\./, "").replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const s = r?.[id];
    out[kurz] = { an: Boolean(s?.an), erwartet: Boolean(s?.erwartet), grund: s?.grund || null, ersatz: s?.ersatz || null };
  }
  return out;
}

// ------------------------------------------------------------- Personen --

const MA_FELDER = ["name", "titel", "vorname", "nachname", "status", "user", "rolle_intern", "eintritt", "austritt", "team_verkauf", "team_planung", "team_montage", "beschaeftigungsart", "wochenstunden", "urlaubsanspruch_tage", "foto", "bewerbung"];

export async function ladeMitarbeiterListe(ctx, { alle = false } = {}) {
  if (istLeer(ctx)) return [];
  const filters = alle ? [] : [["status", "in", ["Aktiv", "Karenz"]]];
  return ctx.client.getList(DT.ma, { fields: MA_FELDER, filters, orderBy: "nachname asc", limit: 500 });
}

/** Benutzer → Anzeigename (aus Mitarbeitern, sonst Teil vor „@“). */
export async function namenMap(ctx) {
  const map = new Map();
  try {
    const l = await ctx.client.getList(DT.ma, { fields: ["user", "titel"], filters: [["user", "is", "set"]], limit: 500 });
    for (const m of l) if (m.user) map.set(m.user, m.titel);
  } catch {
    /* ohne Leserecht: nur Kurzform */
  }
  return (u) => (u ? map.get(u) || (/^website@/.test(u) ? "Website" : String(u).split("@")[0]) : "");
}

/** Personen für Gesprächsführung/Zuständig: Benutzer mit Personal-Rollen (Mock: Demo-Benutzer), sonst Mitarbeiter mit Benutzer. */
export async function ladePersonen(ctx) {
  try {
    const u = await ctx.client.getList("User", { fields: ["name", "full_name"], filters: [["enabled", "=", 1], ["user_type", "=", "System User"]], limit: 200 });
    const sauber = u.filter((x) => !/^(Administrator|Guest)$/.test(x.name)).map((x) => ({ wert: x.name, titel: String(x.full_name || x.name).replace(/\s*\(.*\)$/, "") }));
    if (sauber.length) return sauber.sort((a, b) => a.titel.localeCompare(b.titel));
  } catch {
    /* Rückfall unten */
  }
  const l = await ctx.client.getList(DT.ma, { fields: ["user", "titel"], filters: [["user", "is", "set"], ["status", "=", "Aktiv"]], limit: 200 }).catch(() => []);
  return l.map((m) => ({ wert: m.user, titel: m.titel }));
}

// ------------------------------------------------------- Abwesenheiten --

/**
 * Abwesenheiten + Krankmeldungen im Zeitraum, maskiert nach § 1.2. `mitarbeiter` schränkt ein.
 * Krankmeldungen lädt nur, wer sie lesen darf (Leitung, GF, die Person selbst) – für alle anderen erscheinen sie
 * maskiert als „abwesend“ über die Server-Sitzung (Mock) bzw. gar nicht (Frappe-Rechte; Teamkalender folgt A11a).
 */
export async function ladeAbwesenheiten(ctx, { von, bis, mitarbeiter = null, status = ["Beantragt", "Genehmigt"], teamSelbstservice = false, mitKrank = true } = {}) {
  if (istLeer(ctx)) return [];
  simuliere(ctx);
  const f = [["status", "in", status], ["von", "<=", bis], ["bis", ">=", von]];
  if (mitarbeiter) f.push(["mitarbeiter", "=", mitarbeiter]);
  const felder = ["name", "mitarbeiter", "mitarbeiter_name", "art", "status", "von", "bis", "halbtags", "begruendung", "vertretung", "ablehnungsgrund", "owner", "beantragt_von", "genehmigt_von", "genehmigt_am", "creation"];
  const liste = await ctx.client.getList(DT.abw, { fields: felder, filters: f, orderBy: "von asc", limit: 1000 });
  let krank = [];
  if (mitKrank) {
    const kf = [["status", "in", ["Gemeldet", "Bestaetigt", "Beendet"]], ["von", "<=", bis]];
    if (mitarbeiter) kf.push(["mitarbeiter", "=", mitarbeiter]);
    try {
      const roh = await ctx.client.getList(DT.krank, { fields: ["name", "mitarbeiter", "mitarbeiter_name", "status", "von", "bis", "bis_offen", "bis_voraussichtlich", "arbeitsunfall", "notiz", "meldeweg"], filters: kf, limit: 500 });
      krank = roh.map((k) => krankAlsAbwesenheit(k, bis)).filter((k) => k.bis >= von);
      // Selbstservice liest nur die eigenen; fremde kommen (maskiert) nur mit Teamkalender.
    } catch {
      // Ohne Leserecht (Sachbearbeitung, Admin): Teamkalender liefert Krankmeldungen nur als „abwesend“.
      if (ctx.rolle && ctx.rolle !== "selbst") {
        const tk = await aufruf(ctx.client, M.teamkalender, { start: von, end: bis }).catch(() => []);
        const ma = await ladeMitarbeiterListe(ctx).catch(() => []);
        krank = (tk || [])
          .filter((e) => e.quelle === "krank" || (!e.name && e.art === "abwesend"))
          .map((e) => ({ name: `tk-${e.mitarbeiter_name}-${e.von}`, quelle: "krank", mitarbeiter: ma.find((m) => m.titel === e.mitarbeiter_name)?.name || e.mitarbeiter_name, mitarbeiter_name: e.mitarbeiter_name, art: "abwesend", von: e.von, bis: plusTage(String(e.bis).slice(0, 10), -1), status: "Genehmigt" }))
          .filter((k) => (!mitarbeiter || k.mitarbeiter === mitarbeiter) && k.bis >= von);
      }
    }
  }
  const opt = { rolle: ctx.rolle, eigenerMitarbeiter: ctx.eigener?.name, teamSelbstservice };
  return [...liste.map((a) => maskiere(a, opt)), ...krank.map((k) => maskiere(k, opt))].filter(Boolean);
}

function maskiere(a, opt) {
  const m = maskiereAbwesenheit(a, opt);
  if (!m) return null;
  if (!m.maskiert && !m.eigen && !darfArtSehen(opt.rolle)) return null;
  // Vertretung/Begründung nur für Leitung/GF und die Person selbst (§ 1.2)
  return m;
}

/** Wer ist heute weg (für Teamstärke/Heute im Haus), Art nur für Berechtigte. */
async function heuteWeg(ctx) {
  return ladeAbwesenheiten(ctx, { von: ctx.heute, bis: ctx.heute, status: ["Genehmigt"] });
}

// ------------------------------------------------------------- Stempel --

/** Stempelzustand des eigenen Mitarbeiters: offene Buchung heute, „heute bisher“. */
export async function ladeStempel(ctx) {
  const ma = ctx.eigener;
  if (!ma) return { mitarbeiter: null };
  const heute = await ctx.client.getList(DT.zeit, { fields: ["name", "kommen", "gehen", "pause_min", "status", "datum", "pause_bestaetigt"], filters: [["mitarbeiter", "=", ma.name], ["datum", "=", ctx.heute]], orderBy: "kommen asc", limit: 20 });
  const offen = heute.find((b) => !b.gehen) || null;
  const jetztMin = minutenVon(ctx.jetzt);
  return {
    mitarbeiter: { name: ma.name, titel: ma.titel, vorname: ma.vorname, wochenstunden: Number(ma.wochenstunden) || 38.5 },
    offen: offen ? { name: offen.name, kommen: String(offen.kommen).slice(0, 5) } : null,
    erstesKommen: heute[0] ? String(heute[0].kommen).slice(0, 5) : null,
    bisherMin: istSumme(heute, jetztMin),
    abgeschlossenMin: istSumme(heute.filter((b) => b.gehen)),
    stand: ctx.jetzt.toISOString(),
  };
}

// ------------------------------------------------------------ Übersicht --

/** Zu erledigen (§ 5.1): Zeilen nach Fälligkeit, Rollen beachtet. Auch für die Zentrale nutzbar. */
export async function ladeZuErledigen(ctx) {
  if (istLeer(ctx)) return [];
  simuliere(ctx);
  const c = ctx.client;
  const zeilen = [];
  const L = istLeitung(ctx.rolle);
  const name = await namenMap(ctx);
  const mitarbeiter = await ladeMitarbeiterListe(ctx);
  const maUser = new Map(mitarbeiter.map((m) => [m.name, m.user]));

  if (darfEntscheiden(ctx.rolle)) {
    const antraege = await ladeAbwesenheiten(ctx, { von: plusTage(ctx.heute, -60), bis: plusTage(ctx.heute, 400), status: ["Beantragt"], mitKrank: false });
    const genehmigt = await ladeAbwesenheiten(ctx, { von: ctx.heute, bis: plusTage(ctx.heute, 400), status: ["Genehmigt", "Beantragt"] });
    for (const a of antraege) {
      const m = mitarbeiter.find((x) => x.name === a.mitarbeiter);
      const team = m ? teamsVon(m)[0] : null;
      const st = team ? teamStaerke(team, mitarbeiter, genehmigt.filter((g) => g.name !== a.name), a.von) : null;
      const ent = antragEntscheidbar(a, { rolle: ctx.rolle, user: ctx.user, mitarbeiterUser: maUser.get(a.mitarbeiter) });
      zeilen.push({
        id: `antrag:${a.name}`, art: "antrag", faellig: a.von, icon: "CalendarDays", ton: "eiche",
        titel: T.zeilen.antrag({ ...a, artText: artText(a.art) }),
        unter: [a.vertretung ? T.zeilen.vertretung(mitarbeiter.find((x) => x.name === a.vertretung)?.titel || a.vertretung) : null, st ? T.zeilen.teamStaerke(T.team.teams[team], Math.max(0, st.da - 1), st.gesamt) : null].filter(Boolean).join(" · "),
        warn: st ? st.da - 1 < st.gesamt / 2 : false,
        antrag: { name: a.name, mitarbeiter_name: a.mitarbeiter_name, art: a.art, von: a.von, bis: a.bis },
        entscheidbar: ent,
      });
    }
  }
  if (L || ctx.rolle === "gf") {
    const krank = await c.getList(DT.krank, { fields: ["name", "mitarbeiter_name", "von", "status"], filters: [["status", "=", "Gemeldet"]], limit: 20 }).catch(() => []);
    for (const k of krank) zeilen.push({ id: `krank:${k.name}`, art: "krank", faellig: k.von, icon: "Info", ton: "stein", titel: T.zeilen.krank(k.mitarbeiter_name, kurzDatum(k.von)), unter: statusText("krank", k.status), krank: { name: k.name } });
  }
  if (darfBewerbungen(ctx.rolle)) {
    const neu = await c.getList(DT.bewerbung, { fields: ["name", "eingang"], filters: [["status", "=", "Eingegangen"]], orderBy: "eingang asc", limit: 100 });
    if (neu.length) zeilen.push({ id: "bewerbungen:neu", art: "sichten", faellig: String(neu[0].eingang).slice(0, 10), icon: "Inbox", ton: "cognac", titel: T.zeilen.neueBew(neu.length), unter: T.uebersicht.aelteste(relativTage(neu[0].eingang, ctx.heute)), href: `/personal/bewerbungen/${encodeURIComponent(neu[0].name)}?modus=sichten`, knopf: T.zeilen.knopf.sichten });
    const morgen = plusTage(ctx.heute, 1);
    const gsp = await c.getList(DT.gespraech, { fields: ["name", "bewerber", "bewerbung", "start", "modus", "status"], filters: [["status", "=", "Geplant"], ["start", "<=", `${morgen} 23:59:59`]], orderBy: "start asc", limit: 20 });
    for (const g of gsp) {
      const vorbei = String(g.start) < `${ctx.heute} ${String(ctx.jetzt.getHours()).padStart(2, "0")}:${String(ctx.jetzt.getMinutes()).padStart(2, "0")}`;
      const tag = String(g.start).slice(0, 10);
      zeilen.push(
        vorbei
          ? { id: `gespraech:${g.name}`, art: "ergebnis", faellig: tag, icon: "MessageSquare", ton: "see", titel: T.zeilen.ergebnisOffen(g.bewerber), unter: `${kurzDatum(tag)} ${String(g.start).slice(11, 16)} · ${g.modus}`, href: `/personal/gespraeche?panel=${encodeURIComponent(g.name)}&datum=${tag}`, knopf: T.zeilen.knopf.ergebnis }
          : { id: `gespraech:${g.name}`, art: "gespraech", faellig: tag, icon: "Calendar", ton: "see", titel: T.zeilen.gespraech(g.bewerber, `${relativTage(tag, ctx.heute)} ${String(g.start).slice(11, 16)}`), unter: g.modus, href: `/personal/bewerbungen/${encodeURIComponent(g.bewerbung)}`, knopf: T.zeilen.knopf.oeffnen }
      );
    }
    const alt = await c.getList(DT.bewerbung, { fields: ["name", "vorname", "nachname", "eingang"], filters: [["status", "in", OFFENE_BEWERBUNG], ["eingang", "<", `${plusTage(ctx.heute, -OHNE_ENTSCHEIDUNG_TAGE)} 00:00:00`]], limit: 20 });
    if (L) for (const b of alt) zeilen.push({ id: `alt:${b.name}`, art: "alt", faellig: String(b.eingang).slice(0, 10), icon: "Hourglass", ton: "eiche", titel: T.zeilen.ohneEntscheidung(`${b.vorname} ${b.nachname}`.trim(), tageZwischen(String(b.eingang).slice(0, 10), ctx.heute)), href: `/personal/bewerbungen/${encodeURIComponent(b.name)}`, knopf: T.zeilen.knopf.oeffnen });
  }
  if (L) {
    const offen = await c.getList(DT.zeit, { fields: ["name", "mitarbeiter_name", "datum", "kommen"], filters: [["status", "=", "Offen"], ["datum", "<", ctx.heute]], orderBy: "datum desc", limit: 30 });
    for (const z of offen) zeilen.push({ id: `gehen:${z.name}`, art: "gehen", faellig: z.datum, icon: "Clock", ton: "eiche", titel: T.zeilen.gehenFehlt(z.mitarbeiter_name, relativTage(z.datum, ctx.heute)), unter: `Kommen ${String(z.kommen).slice(0, 5)}`, buchung: { name: z.name, datum: z.datum, kommen: String(z.kommen).slice(0, 5) }, knopf: T.zeilen.knopf.nachtragen });
    const korr = await c.getList(DT.zeit, { fields: ["name", "mitarbeiter_name", "mitarbeiter", "datum", "kommen", "gehen", "pause_min", "korrektur_kommen", "korrektur_gehen", "korrektur_pause_min", "korrektur_grund"], filters: [["korrektur_status", "=", "Beantragt"]], limit: 30 }).catch(() => []);
    for (const z of korr) zeilen.push({ id: `korrektur:${z.name}`, art: "korrektur", faellig: z.datum, icon: "Pencil", ton: "see", titel: T.zeilen.korrektur(z.mitarbeiter_name, kurzDatum(z.datum)), unter: `${String(z.kommen).slice(0, 5)}–${String(z.gehen || "").slice(0, 5)} → ${String(z.korrektur_kommen || z.kommen).slice(0, 5)}–${String(z.korrektur_gehen || "").slice(0, 5)} · ${z.korrektur_grund || ""}`, korrektur: { name: z.name } });
    const stellen = await c.getList(DT.stelle, { fields: ["name", "titel", "status", "gueltig_bis"], filters: [["status", "in", ["Aktiv", "Pausiert"]], ["gueltig_bis", "is", "set"]], limit: 100 });
    for (const s of stellen) {
      const g = gueltigInfo(s, ctx.heute);
      if (!g) continue;
      if (s.status === "Aktiv" && g.rest <= 7) zeilen.push({ id: `stelle:${s.name}`, art: "stelle", faellig: s.gueltig_bis, icon: "Hourglass", ton: "eiche", titel: T.zeilen.stelleLaeuft(s.titel, relativTage(s.gueltig_bis, ctx.heute)), stelle: { name: s.name }, knopf: T.zeilen.knopf.verlaengern });
      if (s.status === "Pausiert" && g.rest < 0) zeilen.push({ id: `stelle:${s.name}`, art: "stelle", faellig: s.gueltig_bis, icon: "Hourglass", ton: "eiche", titel: T.zeilen.stellePausiert(s.titel), stelle: { name: s.name, pausiert: true }, knopf: T.zeilen.knopf.verlaengern });
    }
    const bald = plusTage(ctx.heute, 14);
    for (const m of mitarbeiter) {
      if (m.eintritt > ctx.heute && m.eintritt <= bald) zeilen.push({ id: `eintritt:${m.name}`, art: "eintritt", faellig: m.eintritt, icon: "UserPlus", ton: "salbei", titel: T.zeilen.eintritt(m.titel, relativTage(m.eintritt, ctx.heute)), href: `/personal/mitarbeiter/${encodeURIComponent(m.name)}?tab=stammdaten`, knopf: T.zeilen.knopf.oeffnen });
      if (m.austritt && m.austritt >= ctx.heute && m.austritt <= bald) zeilen.push({ id: `austritt:${m.name}`, art: "austritt", faellig: m.austritt, icon: "LogOut", ton: "stein", titel: T.zeilen.austritt(m.titel, relativTage(m.austritt, ctx.heute)), href: `/personal/mitarbeiter/${encodeURIComponent(m.name)}`, knopf: T.zeilen.knopf.oeffnen });
    }
  }
  void name;
  // Vorrang je Art (Konzept § 5.1: Anträge und Krankmeldungen oben), innerhalb nach Fälligkeit.
  const RANG = { krank: 0, antrag: 1, sichten: 2, gespraech: 3, gehen: 4, korrektur: 5, ergebnis: 6, stelle: 7, alt: 8, eintritt: 9, austritt: 9 };
  return zeilen.sort((a, b) => (RANG[a.art] ?? 9) - (RANG[b.art] ?? 9) || String(a.faellig).localeCompare(String(b.faellig)));
}

/** Höchstens 4 Kennzahlen (§ 5.1, Q-B4). Heute abwesend: Aufteilung nach Art nur Leitung/GF. */
export async function ladeKennzahlen(ctx) {
  if (istLeer(ctx)) return { stellen: 0, ohneEntgelt: 0, offeneBew: 0, aelteste: null, abwesend: 0, abwesendArten: null, loeschFaellig: null, naechsteFrist: null };
  simuliere(ctx);
  const c = ctx.client;
  const aktive = await c.getList(DT.stelle, { fields: ["name", "kv_mindest_brutto_cent", "entgelt_zeitraum", "kollektivvertrag", "ueberzahlung", "ueberzahlung_text", "status"], filters: [["status", "=", "Aktiv"]], limit: 200 });
  const out = { stellen: aktive.length, ohneEntgelt: aktive.filter((s) => !entgeltVollstaendig(s)).length };
  if (darfBewerbungen(ctx.rolle)) {
    const offen = await c.getList(DT.bewerbung, { fields: ["name", "eingang"], filters: [["status", "in", OFFENE_BEWERBUNG]], orderBy: "eingang asc", limit: 500 });
    out.offeneBew = offen.length;
    out.aelteste = offen[0] ? relativTage(offen[0].eingang, ctx.heute) : null;
  }
  const weg = await heuteWeg(ctx);
  const personen = new Set(weg.map((w) => w.mitarbeiter));
  out.abwesend = personen.size;
  if (darfArtSehen(ctx.rolle)) {
    const arten = {};
    for (const w of weg) arten[w.art] = (arten[w.art] || 0) + 1;
    out.abwesendArten = arten;
  }
  if (istLeitung(ctx.rolle)) {
    const fristen = await c.getList(DT.bewerbung, { fields: ["name", "loeschfrist", "einwilligung_evidenz", "einwilligung_evidenz_bis", "pseudonymisiert"], filters: [["pseudonymisiert", "=", 0], ["loeschfrist", "is", "set"]], limit: 1000 });
    const infos = fristen.map((b) => loeschfristInfo(b, ctx.heute)).filter((i) => i.datum);
    out.loeschFaellig = infos.filter((i) => i.zustand === "faellig").length;
    const kommend = infos.filter((i) => i.rest >= 0).sort((a, b) => a.rest - b.rest)[0];
    out.naechsteFrist = kommend ? relativTage(kommend.datum, ctx.heute) : null;
  }
  return out;
}

/** Heute im Haus (Leitung, GF): Zustand ohne Uhrzeiten (E9, ArbVG § 96a). */
export async function ladeHeuteImHaus(ctx) {
  if (istLeer(ctx)) return [];
  simuliere(ctx);
  const ma = (await ladeMitarbeiterListe(ctx)).filter((m) => m.status === "Aktiv" && m.eintritt <= ctx.heute);
  const buchungen = await ctx.client.getList(DT.zeit, { fields: ["mitarbeiter", "gehen"], filters: [["datum", "=", ctx.heute]], limit: 500 });
  const weg = await heuteWeg(ctx);
  return ma.map((m) => {
    const w = weg.find((x) => x.mitarbeiter === m.name);
    const b = buchungen.filter((x) => x.mitarbeiter === m.name);
    const zustand = w ? "abwesend" : b.some((x) => !x.gehen) ? "imHaus" : b.length ? "gegangen" : "keine";
    return { name: m.name, titel: m.titel, zustand, bis: w && !w.bis_offen ? w.bis : null, art: w && !w.maskiert ? w.art : null };
  });
}

/** Bewerbungen nach Quelle (nur ≥ 20 in 90 Tagen, § 5.1). */
export async function ladeQuellen(ctx) {
  if (istLeer(ctx) || !darfBewerbungen(ctx.rolle)) return { n: 0, punkte: [] };
  const l = await ctx.client.getList(DT.bewerbung, { fields: ["quelle"], filters: [["eingang", ">=", `${plusTage(ctx.heute, -90)} 00:00:00`]], limit: 2000 });
  const z = {};
  for (const b of l) z[b.quelle || "Sonstige"] = (z[b.quelle || "Sonstige"] || 0) + 1;
  return { n: l.length, punkte: Object.entries(z).sort((a, b) => b[1] - a[1]).map(([label, wert]) => ({ label, wert })) };
}

/** Kürzlich: letzte Änderungen an Bewerbungen und Anträgen, Personen statt Nummern, ohne permlevel 1. */
export async function ladeKuerzlich(ctx) {
  if (istLeer(ctx)) return [];
  const name = await namenMap(ctx);
  const out = [];
  if (darfBewerbungen(ctx.rolle)) {
    const b = await ctx.client.getList(DT.bewerbung, { fields: ["name", "vorname", "nachname", "stelle_titel", "status", "modified", "modified_by", "pseudonymisiert"], filters: [["pseudonymisiert", "=", 0]], orderBy: "modified desc", limit: 6 });
    for (const x of b) out.push({ id: x.name, wer: name(x.modified_by), text: `${`${x.vorname} ${x.nachname}`.trim()}${x.stelle_titel ? ` (${x.stelle_titel})` : ""} · ${statusText("bewerbung", x.status)}`, zeit: x.modified, href: `/personal/bewerbungen/${encodeURIComponent(x.name)}` });
  }
  if (darfEntscheiden(ctx.rolle)) {
    const a = await ctx.client.getList(DT.abw, { fields: ["name", "mitarbeiter_name", "art", "status", "von", "bis", "modified", "modified_by"], orderBy: "modified desc", limit: 4 });
    for (const x of a) out.push({ id: x.name, wer: name(x.modified_by), text: `${x.mitarbeiter_name} · ${artText(x.art)} ${zeitraumText(x.von, x.bis)} · ${statusText("abwesenheit", x.status)}`, zeit: x.modified, href: "/personal/team?ansicht=antraege" });
  }
  return out.sort((a, b) => String(b.zeit).localeCompare(String(a.zeit))).slice(0, 6);
}

// -------------------------------------------------------- Mein Bereich --

/** Eigene Abwesenheiten (+ Krankmeldungen), neueste zuerst. */
export async function ladeEigeneAbwesenheiten(ctx, { limit = 100 } = {}) {
  if (!ctx.eigener || istLeer(ctx)) return [];
  simuliere(ctx);
  const a = await ctx.client.getList(DT.abw, { fields: ["name", "art", "status", "von", "bis", "halbtags", "ablehnungsgrund", "genehmigt_von", "genehmigt_am", "vertretung", "begruendung"], filters: [["mitarbeiter", "=", ctx.eigener.name]], orderBy: "von desc", limit });
  const k = await ctx.client.getList(DT.krank, { fields: ["name", "status", "von", "bis", "bis_offen", "bis_voraussichtlich"], filters: [["mitarbeiter", "=", ctx.eigener.name], ["status", "!=", "Storniert"]], orderBy: "von desc", limit: 20 }).catch(() => []);
  const name = await namenMap(ctx);
  return [...a.map((x) => ({ ...x, quelle: "abw", entschiedenVon: name(x.genehmigt_von) })), ...k.map((x) => ({ ...krankAlsAbwesenheit(x, x.bis || x.bis_voraussichtlich || ctx.heute), quelle: "krank", bis_voraussichtlich: x.bis_voraussichtlich }))].sort((x, y) => String(y.von).localeCompare(String(x.von)));
}

/** Diese Woche: je Tag Netto bzw. „läuft“/„–“. */
export async function ladeWoche(ctx) {
  if (!ctx.eigener) return [];
  const mo = wochenStartIso(ctx.heute);
  const tageListe = Array.from({ length: 7 }, (_, i) => plusTage(mo, i));
  const b = await ctx.client.getList(DT.zeit, { fields: ["datum", "kommen", "gehen", "pause_min"], filters: [["mitarbeiter", "=", ctx.eigener.name], ["datum", "between", [mo, tageListe[6]]]], limit: 100 });
  const jetztMin = minutenVon(ctx.jetzt);
  return tageListe.map((d) => {
    const l = b.filter((x) => x.datum === d);
    return { datum: d, laeuft: d === ctx.heute && l.some((x) => !x.gehen), min: l.length ? istSumme(l, d === ctx.heute ? jetztMin : null) : null };
  });
}

/** Konto (nur mit Fähigkeit konten): Saldo Vormonat + Urlaub. Frappe: ph_personal-Methoden; Mock: zeit.js. */
export async function ladeKonto(ctx, ma = ctx.eigener) {
  if (!ma) return null;
  const vm = new Date(ctx.jetzt.getFullYear(), ctx.jetzt.getMonth() - 1, 1);
  const jahr = vm.getFullYear();
  const monat = vm.getMonth() + 1;
  if (ctx.client.modus === "frappe") {
    const [mu, uk] = await Promise.all([aufruf(ctx.client, M.monatsuebersicht, { mitarbeiter: ma.name, jahr, monat }), aufruf(ctx.client, M.urlaubskonto, { mitarbeiter: ma.name })]);
    return { monat: monatName(monat), saldoMin: Number(mu?.saldo_min ?? mu?.saldo) || 0, urlaub: { rest: Number(uk?.rest ?? uk?.verfuegbar) || 0, jahr: ctx.jetzt.getFullYear() } };
  }
  const tageM = monatsTage(jahr, monat);
  const [b, a] = await Promise.all([
    ctx.client.getList(DT.zeit, { fields: ["datum", "kommen", "gehen", "pause_min"], filters: [["mitarbeiter", "=", ma.name], ["datum", "between", [tageM[0], tageM.at(-1)]]], limit: 200 }),
    ctx.client.getList(DT.abw, { fields: ["art", "status", "von", "bis", "halbtags"], filters: [["mitarbeiter", "=", ma.name]], limit: 200 }),
  ]);
  const kr = await ctx.client.getList(DT.krank, { fields: ["name", "mitarbeiter", "status", "von", "bis", "bis_offen", "bis_voraussichtlich"], filters: [["mitarbeiter", "=", ma.name], ["status", "!=", "Storniert"]], limit: 50 }).catch(() => []);
  const k = konto({ buchungen: b, abwesenheiten: [...a, ...kr.map((x) => krankAlsAbwesenheit(x, tageM.at(-1)))], wochenstunden: ma.wochenstunden, von: tageM[0], bis: tageM.at(-1) });
  const u = urlaubskonto({ anspruch: Number(ma.urlaubsanspruch_tage) || 25, abwesenheiten: a, jahr: ctx.jetzt.getFullYear() });
  return { monat: monatName(monat), saldoMin: k.saldo, urlaub: { rest: u.rest, jahr: ctx.jetzt.getFullYear() } };
}

// ------------------------------------------------------------- Monat --

/** Monatstabelle (Meine Zeiten / Personalakte): Tage mit Buchungen und Abwesenheiten, Summen. */
export async function ladeMonat(ctx, maName, jahr, monat, { mitKonto = false, wochenstunden = 38.5 } = {}) {
  simuliere(ctx);
  const tageM = monatsTage(jahr, monat);
  const [b, abw] = await Promise.all([
    istLeer(ctx) ? [] : ctx.client.getList(DT.zeit, { fields: ["name", "datum", "kommen", "gehen", "pause_min", "dauer_min", "art", "status", "notiz", "korrigiert_von", "korrigiert_am", "pause_bestaetigt", "korrektur_status", "azg_verstoesse", "quelle", "modified"], filters: [["mitarbeiter", "=", maName], ["datum", "between", [tageM[0], tageM.at(-1)]]], orderBy: "kommen asc", limit: 400 }),
    ladeAbwesenheiten(ctx, { von: tageM[0], bis: tageM.at(-1), mitarbeiter: maName, status: ["Genehmigt", "Beantragt"] }),
  ]);
  const name = await namenMap(ctx);
  const jetztMin = minutenVon(ctx.jetzt);
  const tage = tageM.map((d) => ({
    datum: d,
    buchungen: b.filter((x) => x.datum === d).map((x) => ({ ...x, kommen: String(x.kommen || "").slice(0, 5), gehen: String(x.gehen || "").slice(0, 5), netto: nettoMin(x, d === ctx.heute && !x.gehen ? jetztMin : null), korrigiertVon: name(x.korrigiert_von) })),
    abwesenheit: abw.find((a) => a.von <= d && a.bis >= d) || null,
  }));
  const gestern = plusTage(ctx.heute, -1);
  const istBisGestern = istSumme(b.filter((x) => x.datum <= gestern && x.gehen));
  const summe = { ist: istSumme(b.filter((x) => x.gehen)), istBisGestern };
  if (mitKonto) {
    const bis = tageM.at(-1) < ctx.heute ? tageM.at(-1) : null;
    if (bis) Object.assign(summe, konto({ buchungen: b, abwesenheiten: abw.map((a) => ({ ...a, art: a.maskiert ? "abwesend" : a.art })), wochenstunden, von: tageM[0], bis }));
  }
  return { jahr, monat, tage, summe, leer: b.length === 0 };
}

// ------------------------------------------------------------- Stellen --

const STELLE_LISTE = ["name", "titel", "status", "kategorie", "beschaeftigungsart", "kv_mindest_brutto_cent", "entgelt_zeitraum", "kollektivvertrag", "ueberzahlung", "ueberzahlung_text", "gueltig_bis", "veroeffentlicht", "modified", "website_url"];

export async function ladeStellen(ctx, { status = null } = {}) {
  if (istLeer(ctx)) return { zeilen: [], zaehler: {} };
  simuliere(ctx);
  const alle = await ctx.client.getList(DT.stelle, { fields: STELLE_LISTE, orderBy: "modified desc", limit: 500 });
  const bew = darfBewerbungen(ctx.rolle) ? await ctx.client.getList(DT.bewerbung, { fields: ["stelle", "status"], filters: [["pseudonymisiert", "=", 0]], limit: 5000 }) : [];
  const zaehler = {};
  for (const s of alle) zaehler[s.status] = (zaehler[s.status] || 0) + 1;
  const zeilen = alle
    .filter((s) => !status || status.includes(s.status))
    .map((s) => ({ ...s, bewerbungen: bew.filter((b) => b.stelle === s.name).length, neu: bew.filter((b) => b.stelle === s.name && b.status === "Eingegangen").length, entgeltOk: entgeltVollstaendig(s), gueltig: gueltigInfo(s, ctx.heute) }));
  return { zeilen, zaehler };
}

export async function ladeStelle(ctx, name) {
  simuliere(ctx);
  const { doc, docinfo } = await ctx.client.getDocMitInfo(DT.stelle, name);
  const s = { ...doc };
  if (!darfVertraulich(ctx.rolle)) delete s.notiz_intern;
  const transitions = await ctx.client.getTransitions(DT.stelle, name).catch(() => []);
  const bew = darfBewerbungen(ctx.rolle) ? await ctx.client.getList(DT.bewerbung, { fields: ["name", "vorname", "nachname", "status", "eingang", "quelle", "zugewiesen_an", "pseudonymisiert"], filters: [["stelle", "=", name]], orderBy: "eingang desc", limit: 200 }) : [];
  return { stelle: s, docinfo, transitions, bewerbungen: bew };
}

// ---------------------------------------------------------- Bewerbungen --

const PERMLEVEL1_BEWERBUNG = ["bewertung", "eindruck", "gehaltsvorstellung", "gehaltsvorstellung_cent", "notiz_intern", "angebot_brutto_cent", "angebot_zeitraum"];
const BEW_LISTE = ["name", "vorname", "nachname", "status", "stelle", "stelle_titel", "initiativ", "eingang", "quelle", "zugewiesen_an", "email", "loeschfrist", "einwilligung_evidenz", "einwilligung_evidenz_bis", "pseudonymisiert", "entschieden_am", "modified", "sprache", "anrede", "absage_versand", "unterlagen_geloescht_am"];

/**
 * Anzahl Unterlagen je Bewerbung. Mock: aus dem Datensatz. Frappe: ein Aufruf auf die Kindtabelle
 * (PH Bewerbung Unterlage, parent) – kein Laden je Datensatz (Q-L3); ohne Recht null (Anzeige entfällt).
 */
async function anhangZahlen(ctx, liste) {
  if (ctx.client.modus !== "frappe") return Promise.all(liste.map((b) => ctx.client.getDoc(DT.bewerbung, b.name).then((d) => (d.unterlagen || []).length).catch(() => 0)));
  try {
    const kinder = await ctx.client.getList("PH Bewerbung Unterlage", { fields: ["parent"], filters: [["parent", "in", liste.map((b) => b.name)], ["parenttype", "=", DT.bewerbung]], limit: 10000 });
    return liste.map((b) => kinder.filter((k) => k.parent === b.name).length);
  } catch {
    return liste.map(() => null);
  }
}

/** Board/Liste: Bewerbungen mit nächstem Gespräch, Kennzeichen, Anhangzahl. */
export async function ladeBewerbungen(ctx, { stelle, zustaendig, quelle, q } = {}) {
  if (istLeer(ctx)) return [];
  simuliere(ctx);
  const f = [];
  if (stelle) f.push(stelle === "initiativ" ? ["initiativ", "=", 1] : ["stelle", "=", stelle]);
  if (zustaendig) f.push(zustaendig === "ich" ? ["zugewiesen_an", "=", ctx.user] : ["zugewiesen_an", "=", zustaendig]);
  if (quelle) f.push(["quelle", "=", quelle]);
  const or = q ? [["vorname", "like", `%${q}%`], ["nachname", "like", `%${q}%`], ["name", "like", `%${q}%`], ["email", "like", `%${q}%`]] : undefined;
  const liste = await ctx.client.getList(DT.bewerbung, { fields: BEW_LISTE, filters: f, orFilters: or, orderBy: "eingang desc", limit: 1000 });
  const docs = await anhangZahlen(ctx, liste);
  const gsp = await ctx.client.getList(DT.gespraech, { fields: ["name", "bewerbung", "start", "modus", "status", "verantwortlich"], filters: [["status", "=", "Geplant"]], orderBy: "start asc", limit: 500 });
  const name = await namenMap(ctx);
  return liste.map((b, i) => {
    const naechstes = gsp.find((g) => g.bewerbung === b.name && String(g.start) >= `${ctx.heute} 00:00`) || null;
    const voll = { ...b, unterlagen: Array.from({ length: docs[i] }) };
    return {
      ...b,
      person: Number(b.pseudonymisiert) ? T.akte.geloescht(kurzDatum(b.unterlagen_geloescht_am)) : `${b.vorname || ""} ${b.nachname || ""}`.trim(),
      anhaenge: docs[i],
      naechstes,
      kennzeichen: kartenKennzeichen(voll, { naechstesGespraech: naechstes, heute: ctx.heute, jetzt: ctx.jetzt }),
      zustaendigName: name(b.zugewiesen_an),
      aufBoard: aufBoard(b, ctx.heute),
      frist: loeschfristInfo(b, ctx.heute),
      alterTage: tageZwischen(String(b.eingang).slice(0, 10), ctx.heute),
    };
  });
}

/** Bewerberakte: Datensatz (permlevel 1 nur für Leitung/GF), Gespräche, Stelle, Einstellungen, Sichtungsfolge. */
export async function ladeBewerbung(ctx, name) {
  simuliere(ctx);
  const { doc, docinfo } = await ctx.client.getDocMitInfo(DT.bewerbung, name);
  const b = { ...doc };
  if (!darfVertraulich(ctx.rolle)) for (const f of PERMLEVEL1_BEWERBUNG) delete b[f];
  const [gespraeche, stelle, einst, eingegangen, offeneDerStelle] = await Promise.all([
    ctx.client.getList(DT.gespraech, { fields: ["name", "start", "ende", "dauer_min", "status", "modus", "ort", "verantwortlich", "ergebnis", "naechster_schritt", "kalender_event", "bestaetigt_am", ...(darfVertraulich(ctx.rolle) ? ["bewertung", "notiz"] : [])], filters: [["bewerbung", "=", name]], orderBy: "start desc", limit: 50 }),
    b.stelle ? ctx.client.getDoc(DT.stelle, b.stelle).catch(() => null) : null,
    ctx.client.getDoc(DT.einst, DT.einst).catch(() => ({})),
    ctx.client.getList(DT.bewerbung, { fields: ["name"], filters: [["status", "=", "Eingegangen"]], orderBy: "eingang asc", limit: 200 }),
    b.stelle ? ctx.client.getList(DT.bewerbung, { fields: ["name", "vorname", "nachname", "email", "sprache", "anrede"], filters: [["stelle", "=", b.stelle], ["status", "in", OFFENE_BEWERBUNG], ["name", "!=", name]], limit: 100 }) : [],
  ]);
  const nm = await namenMap(ctx);
  return {
    bewerbung: b,
    docinfo: { ...docinfo, comments: (docinfo?.comments || []).map((k) => ({ ...k, wer: nm(k.owner) })) },
    gespraeche: gespraeche.map((g) => ({ ...g, verantwortlichName: nm(g.verantwortlich) })),
    stelle: stelle ? { name: stelle.name, titel: stelle.titel, status: stelle.status } : null,
    einst: { loeschfrist_monate: Number(einst.loeschfrist_monate) || 7, absage_text: einst.absage_text || "" },
    sichtung: eingegangen.map((x) => x.name),
    offeneDerStelle,
    zustaendigName: nm(b.zugewiesen_an),
  };
}

// ------------------------------------------------------------ Gespräche --

export async function ladeGespraeche(ctx, { von, bis, status } = {}) {
  if (istLeer(ctx)) return { gespraeche: [], abwesend: [] };
  simuliere(ctx);
  const f = [["start", "between", [`${von} 00:00:00`, `${bis} 23:59:59`]]];
  if (status) f.push(["status", "in", status]);
  const g = await ctx.client.getList(DT.gespraech, { fields: ["name", "bewerbung", "bewerber", "stelle", "start", "ende", "dauer_min", "status", "modus", "ort", "verantwortlich", "ergebnis", "naechster_schritt", "kalender_event", "bestaetigt_am", "weitere_teilnehmer", ...(darfVertraulich(ctx.rolle) ? ["bewertung", "notiz"] : [])], filters: f, orderBy: "start asc", limit: 500 });
  const nm = await namenMap(ctx);
  const stellen = await ctx.client.getList(DT.stelle, { fields: ["name", "titel"], limit: 500 });
  const ma = await ladeMitarbeiterListe(ctx);
  const wer = new Set(g.map((x) => x.verantwortlich));
  const abw = (await ladeAbwesenheiten(ctx, { von, bis, status: ["Genehmigt"] })).filter((a) => wer.has(ma.find((m) => m.name === a.mitarbeiter)?.user));
  return {
    gespraeche: g.map((x) => ({ ...x, verantwortlichName: nm(x.verantwortlich), stelleTitel: stellen.find((s) => s.name === x.stelle)?.titel || "" })),
    abwesend: abw.map((a) => ({ ...a, user: ma.find((m) => m.name === a.mitarbeiter)?.user })),
  };
}

/** Rohdaten für das Slotraster: geplante Gespräche + Abwesenheiten der möglichen Gesprächsführungen. */
export async function ladeSlotDaten(ctx, { von, bis }) {
  const g = await ctx.client.getList(DT.gespraech, { fields: ["name", "start", "ende", "dauer_min", "status", "verantwortlich"], filters: [["status", "=", "Geplant"], ["start", "between", [`${von} 00:00:00`, `${bis} 23:59:59`]]], limit: 500 });
  const ma = await ladeMitarbeiterListe(ctx);
  const abw = await ladeAbwesenheiten(ctx, { von, bis, status: ["Genehmigt", "Beantragt"] });
  return { gespraeche: g, abwesenheiten: abw.map((a) => ({ name: a.name, von: a.von, bis: a.bis, user: ma.find((m) => m.name === a.mitarbeiter)?.user || null })) };
}

// ----------------------------------------------------------------- Team --

/** Teamkalender: Personen × Tage mit Ist und Bändern (maskiert). */
export async function ladeTeam(ctx, { von, bis }) {
  simuliere(ctx);
  const ma = (await ladeMitarbeiterListe(ctx)).filter((m) => m.eintritt <= bis);
  const [b, abw] = await Promise.all([
    istLeer(ctx) ? [] : ctx.client.getList(DT.zeit, { fields: ["name", "mitarbeiter", "datum", "kommen", "gehen", "pause_min", "status"], filters: [["datum", "between", [von, bis]]], limit: 5000 }),
    ladeAbwesenheiten(ctx, { von, bis }),
  ]);
  const jetztMin = minutenVon(ctx.jetzt);
  const zeilen = ma.map((m) => {
    const mb = b.filter((x) => x.mitarbeiter === m.name);
    const tageMap = {};
    for (const x of mb) {
      const t = tageMap[x.datum] || (tageMap[x.datum] = { min: 0, laeuft: false, offen: false });
      t.min += nettoMin(x, x.datum === ctx.heute && !x.gehen ? jetztMin : null);
      if (!x.gehen) {
        if (x.datum === ctx.heute) t.laeuft = true;
        else t.offen = true;
      }
    }
    return { name: m.name, titel: m.titel, teams: teamsVon(m), status: m.status, tage: tageMap, ist: istSumme(mb.filter((x) => x.gehen)), baender: abw.filter((a) => a.mitarbeiter === m.name) };
  });
  const staerke = ["verkauf", "planung", "montage"].map((t) => ({ team: t, ...teamStaerke(t, ma, abw.filter((a) => a.status === "Genehmigt"), ctx.heute) })).filter((x) => x.gesamt > 0);
  return { zeilen, staerke };
}

/** Anträge (Beantragt zuerst, dann jüngst entschiedene) mit Entscheidbarkeit und Teamstärke. */
export async function ladeAntraege(ctx) {
  if (istLeer(ctx)) return [];
  simuliere(ctx);
  const ma = await ladeMitarbeiterListe(ctx);
  const maUser = new Map(ma.map((m) => [m.name, m.user]));
  const offen = await ladeAbwesenheiten(ctx, { von: plusTage(ctx.heute, -90), bis: plusTage(ctx.heute, 400), status: ["Beantragt"], mitKrank: false });
  const krank = darfArtSehen(ctx.rolle) ? await ctx.client.getList(DT.krank, { fields: ["name", "mitarbeiter", "mitarbeiter_name", "status", "von", "bis", "bis_offen", "bis_voraussichtlich"], filters: [["status", "in", ["Gemeldet", "Bestaetigt"]]], limit: 50 }).catch(() => []) : [];
  const genehmigt = await ladeAbwesenheiten(ctx, { von: ctx.heute, bis: plusTage(ctx.heute, 400), status: ["Genehmigt"] });
  const nm = await namenMap(ctx);
  return [
    ...offen.map((a) => {
      const m = ma.find((x) => x.name === a.mitarbeiter);
      const team = m ? teamsVon(m)[0] : null;
      const st = team ? teamStaerke(team, ma, [...genehmigt, a], a.von) : null;
      return { ...a, typ: "antrag", vertretungName: a.vertretung ? ma.find((x) => x.name === a.vertretung)?.titel : null, team, staerke: st, entscheidbar: antragEntscheidbar(a, { rolle: ctx.rolle, user: ctx.user, mitarbeiterUser: maUser.get(a.mitarbeiter) }), angelegtVon: nm(a.owner) };
    }),
    ...krank.map((k) => ({ ...krankAlsAbwesenheit(k, k.bis || k.bis_voraussichtlich || ctx.heute), typ: "krank", bis_voraussichtlich: k.bis_voraussichtlich })),
  ].sort((a, b) => String(a.von).localeCompare(String(b.von)));
}

/** Buchungen-Liste (Monat, Filter Status). */
export async function ladeBuchungen(ctx, { von, bis, status, mitarbeiter } = {}) {
  if (istLeer(ctx)) return [];
  simuliere(ctx);
  const f = [["datum", "between", [von, bis]]];
  if (status?.length) f.push(["status", "in", status]);
  if (mitarbeiter) f.push(["mitarbeiter", "=", mitarbeiter]);
  const l = await ctx.client.getList(DT.zeit, { fields: ["name", "mitarbeiter", "mitarbeiter_name", "datum", "kommen", "gehen", "pause_min", "dauer_min", "art", "status", "pause_bestaetigt", "korrektur_status", "azg_verstoesse", "quelle"], filters: f, orderBy: "datum desc", limit: 1000 });
  return l.map((x) => ({ ...x, kommen: String(x.kommen || "").slice(0, 5), gehen: String(x.gehen || "").slice(0, 5), netto: x.gehen ? nettoMin(x) : null }));
}

// ---------------------------------------------------------- Personalakte --

const VERTRAULICH = ["geburtsdatum", "privatadresse", "telefon_privat", "email_privat", "notfallkontakt_name", "notfallkontakt_telefon", "notfallkontakt_beziehung", "hinweise_vertraulich", "lohnverrechnung_personalnummer", "dokumente"];

export async function ladeMitarbeiter(ctx, name) {
  simuliere(ctx);
  const { doc, docinfo } = await ctx.client.getDocMitInfo(DT.ma, name);
  const m = { ...doc };
  if (!darfVertraulich(ctx.rolle) && m.user !== ctx.user) for (const f of VERTRAULICH) delete m[f];
  const offene = await ctx.client.count(DT.zeit, { filters: [["mitarbeiter", "=", name], ["status", "=", "Offen"]] }).catch(() => 0);
  return { mitarbeiter: m, docinfo, offeneBuchungen: offene };
}

// ------------------------------------------------------------ Datenschutz --

export async function ladeLoeschfristen(ctx, { ansicht = "offen", horizont = 30 } = {}) {
  if (istLeer(ctx)) return { zeilen: [], kennzahlen: { faellig: 0, in14: 0, aufbewahrung: 0, geloescht: 0 } };
  simuliere(ctx);
  const alle = await ctx.client.getList(DT.bewerbung, { fields: ["name", "vorname", "nachname", "stelle_titel", "status", "entschieden_am", "loeschfrist", "einwilligung_evidenz", "einwilligung_evidenz_bis", "pseudonymisiert", "unterlagen_geloescht_am"], filters: [["status", "in", ["Abgesagt", "Zurueckgezogen", "Eingestellt"]]], orderBy: "loeschfrist asc", limit: 5000 });
  const docs = await anhangZahlen(ctx, alle);
  const z = alle.map((b, i) => ({ ...b, unterlagen: docs[i], info: loeschfristInfo(b, ctx.heute) }));
  const jahr = ctx.heute.slice(0, 4);
  const kennzahlen = {
    faellig: z.filter((x) => x.info.zustand === "faellig" && x.status !== "Eingestellt").length,
    in14: z.filter((x) => x.info.zustand === "laeuft" && x.info.rest <= 14 && x.status !== "Eingestellt").length,
    aufbewahrung: z.filter((x) => Number(x.einwilligung_evidenz) && !Number(x.pseudonymisiert)).length,
    geloescht: z.filter((x) => Number(x.pseudonymisiert) && String(x.unterlagen_geloescht_am).startsWith(jahr)).length,
  };
  const sicht = {
    offen: (x) => !Number(x.pseudonymisiert) && x.status !== "Eingestellt" && x.info.zustand !== "offen" && (x.info.zustand === "faellig" || x.info.rest <= horizont),
    aufbewahrung: (x) => Number(x.einwilligung_evidenz) && !Number(x.pseudonymisiert),
    geloescht: (x) => Number(x.pseudonymisiert),
    alle: (x) => x.status !== "Eingestellt",
  }[ansicht] || (() => true);
  return { zeilen: z.filter(sicht).map((x) => (Number(x.pseudonymisiert) || ansicht === "geloescht" ? { ...x, vorname: "", nachname: "" } : x)), kennzahlen };
}

// -------------------------------------------------------------- Berichte --

/** Bewerbungsstatistik: je Stelle Eingänge, Gespräche, Angebote, Eingestellt, Abgesagt, Quote (– bei n < 5). */
export async function berichtBewerbungsstatistik(ctx, { von, bis } = {}) {
  const l = await ctx.client.getList(DT.bewerbung, { fields: ["stelle", "stelle_titel", "status", "quelle", "gespraech_am", "angebot_am"], filters: [["eingang", "between", [`${von} 00:00:00`, `${bis} 23:59:59`]]], limit: 5000 });
  const g = new Map();
  for (const b of l) {
    const k = b.stelle_titel || "Initiativbewerbung";
    const z = g.get(k) || { stelle: k, eingang: 0, gespraech: 0, angebot: 0, eingestellt: 0, abgesagt: 0 };
    z.eingang += 1;
    if (b.gespraech_am) z.gespraech += 1;
    if (b.angebot_am || ["Angebot", "Eingestellt"].includes(b.status)) z.angebot += 1;
    if (b.status === "Eingestellt") z.eingestellt += 1;
    if (b.status === "Abgesagt") z.abgesagt += 1;
    g.set(k, z);
  }
  return [...g.values()].map((z) => ({ ...z, quote: z.eingang < 5 ? null : Math.round((z.eingestellt / z.eingang) * 100) })).sort((a, b) => b.eingang - a.eingang);
}

/** Monatsstunden (nur mit Fähigkeit konten). */
export async function berichtMonatsstunden(ctx, { jahr, monat }) {
  const ma = await ladeMitarbeiterListe(ctx);
  const tageM = monatsTage(jahr, monat);
  const bis = tageM.at(-1) < ctx.heute ? tageM.at(-1) : plusTage(ctx.heute, -1);
  const [b, a] = await Promise.all([
    ctx.client.getList(DT.zeit, { fields: ["mitarbeiter", "datum", "kommen", "gehen", "pause_min"], filters: [["datum", "between", [tageM[0], bis]]], limit: 10000 }),
    ladeAbwesenheiten(ctx, { von: tageM[0], bis, status: ["Genehmigt"] }),
  ]);
  return ma.filter((m) => m.eintritt <= bis).map((m) => {
    const k = konto({ buchungen: b.filter((x) => x.mitarbeiter === m.name), abwesenheiten: a.filter((x) => x.mitarbeiter === m.name), wochenstunden: m.wochenstunden, von: tageM[0], bis });
    return { person: m.titel, soll: k.soll, ist: k.ist, angerechnet: k.angerechnet, saldo: k.saldo };
  });
}

/** Abwesenheitstage je Person und Art im Jahr (nur mit konten; Krank-Spalte nur Leitung/GF). */
export async function berichtAbwesenheiten(ctx, { jahr }) {
  const ma = await ladeMitarbeiterListe(ctx, { alle: true });
  const a = await ladeAbwesenheiten(ctx, { von: `${jahr}-01-01`, bis: `${jahr}-12-31`, status: ["Genehmigt"] });
  return ma.map((m) => {
    const z = { person: m.titel, urlaub: 0, za: 0, fortbildung: 0, sonstige: 0, krank: 0 };
    for (const x of a.filter((y) => y.mitarbeiter === m.name)) {
      let n = 0;
      for (let d = x.von > `${jahr}-01-01` ? x.von : `${jahr}-01-01`; d <= (x.bis < `${jahr}-12-31` ? x.bis : `${jahr}-12-31`); d = plusTage(d, 1)) if (![0, 6].includes(new Date(`${d}T12:00:00`).getDay())) n += 1;
      const k = x.art === "Urlaub" ? "urlaub" : x.art === "Zeitausgleich" ? "za" : x.art === "Fortbildung" || x.art === "Berufsschule" ? "fortbildung" : x.art === "Krankenstand" ? "krank" : "sonstige";
      z[k] += n;
    }
    if (!darfArtSehen(ctx.rolle)) delete z.krank;
    return z;
  }).filter((z) => z.urlaub + z.za + z.fortbildung + z.sonstige + (z.krank || 0) > 0);
}

// --------------------------------------------------------- Einstellungen --

export async function ladeEinstellungen(ctx) {
  try {
    return await ctx.client.getDoc(DT.einst, DT.einst);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") return {};
    throw err;
  }
}

export { isoDatum, zeitMin };
