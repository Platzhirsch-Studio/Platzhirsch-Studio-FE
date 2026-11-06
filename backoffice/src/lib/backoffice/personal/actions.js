"use server";
// Server Actions des Bereichs Personal (Konzept § 13.3). Jede Action: Sitzung + Bereichsrecht + Rolle erneut prüfen,
// Eingaben prüfen, Rückgabe { ok, code?, message?, fehler? } – wirft nie. Mock-Pfad über methoden.js.
// Variante A (verzögerter Commit) plant über planeCommit (commit/aktionen/personal.js); Variante B speichert sofort
// und gibt den alten Wert für die Gegenaktion zurück. Keine Personendaten im Log.

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { planeCommit } from "@/lib/backoffice/commit/server";
import { kontext, ladeSlotDaten, ladeFaehigkeiten } from "./daten";
import { DT, M, aufruf, methode, abwesenheitAnlegen, mockBuchungSpeichern, mockStelleAnlegen, stelleAbleiten, pruefeAbwesenheit } from "./methoden";
import { darfBearbeiten, darfBewerbungen, darfEntscheiden, darfVertraulich, istLeitung, darfTeam, darfEinstellungenSchreiben } from "./rollen";
import { antragEntscheidbar, bewerbungsZug, selbstKorrigierbar, verlaengert } from "./regeln";
import { zeitMin } from "./zeit";
import { ONBOARDING, AUSTRITT, faelligAm } from "./onboarding";
import { plusTage } from "./zeit";
import { T } from "./texte";

const ABSAGE_MS = 10_000;

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message, fehler: err.detail?.feld ? { [err.detail.feld]: err.message } : undefined };
  console.error("[personal] Aktion fehlgeschlagen", err?.name || "Fehler");
  return { ok: false, code: "unavailable", message: T.fehler.allgemein };
}
const nein = (message = T.fehler.keinRecht, code = "forbidden") => ({ ok: false, code, message });
const ungueltig = (message, feld) => ({ ok: false, code: "invalid", message, fehler: feld ? { [feld]: message } : undefined });
const NAME = /^[A-Za-z0-9._@:/-]{1,140}$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const ZEIT = /^\d{1,2}:\d{2}(:\d{2})?$/;
const txt = (x, max = 500) => (typeof x === "string" ? x.trim().slice(0, max) : "");

/**
 * Nur Entwicklung: Der Commit-Dienst liegt prozessweit in globalThis und hält die Aktionsliste vom ersten Laden.
 * Kamen die Personal-Aktionen erst nach dem Start des Dev-Servers hinzu (kein Neustart erlaubt), kennt er sie nicht –
 * dann einmalig neu aufbauen lassen (geplante Absichten liegen im Store und bleiben erhalten).
 */
function commitDienstAuffrischen() {
  const G = globalThis;
  if (process.env.NODE_ENV === "production" || G.__phBoCommitPersonal || !G.__phBoCommit) return;
  G.__phBoCommitPersonal = true;
  delete G.__phBoCommit;
}

async function start() {
  commitDienstAuffrischen();
  const session = await requireSession();
  if (!darf(session, "personal", "read")) return { nein: nein() };
  return { ctx: await kontext(session) };
}

function rv(...pfade) {
  for (const p of ["/personal", ...pfade]) revalidatePath(p);
}

// ================================================================ Stempeln ==

/**
 * Stempeln: Kommen = Variante A (verzögert, Rückgabe token), Gehen = Variante B (sofort, Rückgabe für Gegenaktion).
 * @param {{zeitpunktClient?:string}} p
 */
export async function stempelnAction() {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!ctx.eigener) return nein(T.stempel.ohneMitarbeiter, "invalid");
    const offen = (await ctx.client.getList(DT.zeit, { fields: ["name", "kommen"], filters: [["mitarbeiter", "=", ctx.eigener.name], ["datum", "=", ctx.heute], ["status", "=", "Offen"]], limit: 1 }))[0];
    if (!offen) {
      const r = await planeCommit(ctx.session, { action: "personal.kommen", args: {}, schluessel: `kommen:${ctx.eigener.name}:${ctx.heute}`, objekt: { doctype: DT.ma, name: ctx.eigener.name }, titel: "Kommen" });
      return { ...r, art: "kommen" };
    }
    const r = await aufruf(ctx.client, M.stempeln, {});
    if (r?.ok === false) return { ok: false, code: "conflict", message: r.meldung };
    rv("/personal/meins", "/personal/meins/zeiten", "/personal/team");
    return { ok: true, art: "gehen", buchung: r.name, meldung: r.meldung, pause: r.pause_bestaetigen ? Number(r.pause_min) || 30 : 0 };
  } catch (err) {
    return fehler(err);
  }
}

/** Gegenaktion zu „Gehen“: Gehen leeren (Buchung wieder offen). */
export async function gehenZuruecknehmenAction({ buchung }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(buchung || "")) return ungueltig(T.fehler.allgemein);
    const b = await ctx.client.getDoc(DT.zeit, buchung);
    if (b.mitarbeiter !== ctx.eigener?.name && !istLeitung(ctx.rolle)) return nein();
    if (b.datum !== ctx.heute) return nein(T.fehler.nurHeute);
    if (ctx.client.modus === "frappe") await ctx.client.save(DT.zeit, { name: buchung, gehen: null, pause_min: 0 }, { modified: b.modified });
    else mockBuchungSpeichern(ctx.client, b, { gehen: "", pause_min: 0, pause_bestaetigt: 0 });
    rv("/personal/meins", "/personal/meins/zeiten", "/personal/team");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Pause bestätigen oder ändern (eigene Buchung heute oder Leitung). „Keine Pause“ ist nicht speicherbar. */
export async function pauseSetzenAction({ buchung, minuten }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(buchung || "")) return ungueltig(T.fehler.allgemein);
    const m = Math.round(Number(minuten));
    if (!Number.isFinite(m) || m < 0 || m > 240) return ungueltig(T.stempel.pauseMinuten, "minuten");
    const b = await ctx.client.getDoc(DT.zeit, buchung);
    const eigen = b.mitarbeiter === ctx.eigener?.name;
    if (!(eigen && b.datum === ctx.heute) && !istLeitung(ctx.rolle)) return nein();
    if (m === 0 && zeitMin(b.gehen) - zeitMin(b.kommen) > 360) return { ok: false, code: "invalid", message: T.stempel.pauseKeine, keinePause: true };
    const p = await methode(ctx.client, DT.zeit, buchung, "pause_bestaetigen", { pause_min: m });
    rv("/personal/meins", "/personal/meins/zeiten");
    return { ok: true, pause: Number(p) || m };
  } catch (err) {
    return fehler(err);
  }
}

/** Inline-Korrektur Kommen/Gehen/Pause: Selbstservice nur heute (E7), Leitung immer. Rückgabe alter Werte (Variante B). */
export async function buchungKorrigierenAction({ buchung, kommen, gehen, pause }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(buchung || "")) return ungueltig(T.fehler.allgemein);
    const b = await ctx.client.getDoc(DT.zeit, buchung);
    const eigen = b.mitarbeiter === ctx.eigener?.name;
    if (!istLeitung(ctx.rolle) && !(eigen && selbstKorrigierbar(b, ctx.heute))) return nein(T.fehler.nurHeute);
    const werte = {};
    if (kommen !== undefined) {
      if (!ZEIT.test(kommen)) return ungueltig("Uhrzeit im Format HH:MM", "kommen");
      werte.kommen = kommen.length === 5 ? `${kommen}:00` : kommen;
    }
    if (gehen !== undefined) {
      if (gehen && !ZEIT.test(gehen)) return ungueltig("Uhrzeit im Format HH:MM", "gehen");
      werte.gehen = gehen ? (gehen.length === 5 ? `${gehen}:00` : gehen) : "";
    }
    if (pause !== undefined) werte.pause_min = Math.max(0, Math.round(Number(pause) || 0));
    if (istLeitung(ctx.rolle) && !eigen) Object.assign(werte, { status: "Korrigiert", korrigiert_von: ctx.user });
    const alt = { kommen: String(b.kommen || "").slice(0, 5), gehen: String(b.gehen || "").slice(0, 5), pause: Number(b.pause_min) || 0 };
    let neu;
    if (ctx.client.modus === "frappe") neu = await ctx.client.save(DT.zeit, { name: buchung, ...werte, gehen: werte.gehen === "" ? null : werte.gehen }, { modified: b.modified });
    else neu = mockBuchungSpeichern(ctx.client, b, werte);
    rv("/personal/meins/zeiten", "/personal/team", `/personal/mitarbeiter/${b.mitarbeiter}`);
    return { ok: true, alt, neu: { kommen: String(neu.kommen || "").slice(0, 5), gehen: String(neu.gehen || "").slice(0, 5), pause: Number(neu.pause_min) || 0, dauer: Number(neu.dauer_min) || 0, status: neu.status } };
  } catch (err) {
    return fehler(err);
  }
}

/** Buchung nachtragen: Leitung (mit Notiz) oder eigene von heute. */
export async function buchungNachtragenAction({ mitarbeiter, datum, kommen, gehen, pause, art = "Arbeit", notiz }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    const ma = mitarbeiter || ctx.eigener?.name;
    if (!NAME.test(ma || "")) return ungueltig(T.fehler.allgemein);
    const eigen = ma === ctx.eigener?.name;
    if (!istLeitung(ctx.rolle) && !(eigen && datum === ctx.heute)) return nein(T.fehler.nurHeute);
    if (!DATUM.test(datum || "")) return ungueltig("Datum im Format TT.MM.JJJJ", "datum");
    if (!ZEIT.test(kommen || "")) return ungueltig("Uhrzeit im Format HH:MM", "kommen");
    if (gehen && !ZEIT.test(gehen)) return ungueltig("Uhrzeit im Format HH:MM", "gehen");
    if (istLeitung(ctx.rolle) && !eigen && !txt(notiz)) return ungueltig(T.team.notizPflicht, "notiz");
    const m = await ctx.client.getDoc(DT.ma, ma);
    const werte = { mitarbeiter: ma, mitarbeiter_name: m.titel, datum, kommen: `${kommen.slice(0, 5)}:00`, gehen: gehen ? `${gehen.slice(0, 5)}:00` : "", pause_min: Math.max(0, Number(pause) || 0), art: ["Arbeit", "Montage", "Fortbildung", "Zeitausgleich"].includes(art) ? art : "Arbeit", notiz: txt(notiz), quelle: "Desk", titel: `${m.titel} ${datum}`, naming_series: "PH-ZEIT-.YYYY.-.######" };
    let doc;
    if (ctx.client.modus === "frappe") doc = await ctx.client.insert(DT.zeit, { ...werte, gehen: werte.gehen || null });
    else doc = mockBuchungSpeichern(ctx.client, null, werte);
    rv("/personal/team", "/personal/meins/zeiten", `/personal/mitarbeiter/${ma}`);
    return { ok: true, name: doc.name, warnung: Number(doc.dauer_min) > 600 ? T.zeiten.azg : null };
  } catch (err) {
    return fehler(err);
  }
}

export async function gehenJetztAction({ buchung }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    if (!NAME.test(buchung || "")) return ungueltig(T.fehler.allgemein);
    await methode(ctx.client, DT.zeit, buchung, "gehen_jetzt", {});
    rv("/personal/team");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Korrektur beantragen (eigene Buchung, Vergangenheit): App-Methode korrektur_beantragen (A11d). */
export async function korrekturBeantragenAction({ buchung, kommen, gehen, pause, grund }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(buchung || "")) return ungueltig(T.fehler.allgemein);
    if (!txt(grund)) return ungueltig(T.zeiten.grundPflicht, "grund");
    const b = await ctx.client.getDoc(DT.zeit, buchung);
    if (b.mitarbeiter !== ctx.eigener?.name && !istLeitung(ctx.rolle)) return nein();
    const args = { buchung, kommen: kommen ? `${kommen.slice(0, 5)}:00` : null, gehen: gehen ? `${gehen.slice(0, 5)}:00` : null, pause_min: pause === "" || pause == null ? null : Number(pause), grund: txt(grund) };
    if (ctx.client.modus === "frappe") await aufruf(ctx.client, M.korrektur_beantragen, args);
    else await methode(ctx.client, DT.zeit, buchung, "korrektur_beantragen", args);
    rv("/personal/meins/zeiten", "/personal");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Korrektur entscheiden (Leitung). */
export async function korrekturEntscheidenAction({ buchung, bestaetigen }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    if (!NAME.test(buchung || "")) return ungueltig(T.fehler.allgemein);
    const s = await methode(ctx.client, DT.zeit, buchung, "korrektur_entscheiden", { bestaetigen: bestaetigen ? 1 : 0 });
    rv("/personal/team");
    return { ok: true, status: s };
  } catch (err) {
    return fehler(err);
  }
}

// ========================================================== Abwesenheit ==

/** Urlaub & Co. beantragen (eigene) oder für eine Person anlegen (Leitung). Krankenstand läuft über krankMeldenAction. */
export async function abwesenheitBeantragenAction({ mitarbeiter, art, von, bis, halbtags, vertretung, anmerkung }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    const ma = mitarbeiter || ctx.eigener?.name;
    if (!ma) return nein(T.stempel.ohneMitarbeiter, "invalid");
    const eigen = ma === ctx.eigener?.name;
    if (!eigen && !istLeitung(ctx.rolle)) return nein();
    const ARTEN = ["Urlaub", "Zeitausgleich", "Pflegefreistellung", "Sonderurlaub", "Fortbildung", "Berufsschule", "Unbezahlt"];
    if (!ARTEN.includes(art)) return ungueltig(T.fehler.allgemein, "art");
    if (!DATUM.test(von || "") || !DATUM.test(bis || "")) return ungueltig("Bitte einen Zeitraum wählen.", "von");
    const f = await ladeFaehigkeiten(ctx);
    const darfVertretung = istLeitung(ctx.rolle) || ctx.rolle === "sachbearbeitung" || f.vertretungSelbstservice.an;
    const werte = { mitarbeiter: ma, art, von, bis, halbtags: halbtags ? 1 : 0, vertretung: darfVertretung && NAME.test(vertretung || "") ? vertretung : "", begruendung: txt(anmerkung) };
    if (ctx.client.modus === "frappe") {
      const lokal = pruefeAbwesenheit(werte, []);
      if (lokal) return ungueltig(lokal.text, lokal.feld);
    }
    const doc = await abwesenheitAnlegen(ctx.client, { ...werte, naming_series: "PH-ABW-.YYYY.-.#####" });
    rv("/personal/meins", "/personal/meins/urlaub", "/personal/team");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

/** Krankmeldung (eigene; Leitung auch für andere). Überschneidung mit Urlaub: App unterbricht den Urlaub (UrlG § 5). */
export async function krankMeldenAction({ mitarbeiter, ab, bis }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    const ma = mitarbeiter || ctx.eigener?.name;
    if (!ma) return nein(T.stempel.ohneMitarbeiter, "invalid");
    if (ma !== ctx.eigener?.name && !istLeitung(ctx.rolle)) return nein();
    if (!DATUM.test(ab || "")) return ungueltig("Datum im Format TT.MM.JJJJ", "ab");
    if (bis && (!DATUM.test(bis) || bis < ab)) return ungueltig("Das Ende liegt vor dem Beginn.", "bis");
    const r = await aufruf(ctx.client, M.krank_melden, { von: ab, bis_voraussichtlich: bis || null, mitarbeiter: ma === ctx.eigener?.name ? null : ma, meldeweg: ma === ctx.eigener?.name ? "Selbstservice" : "Telefon" });
    rv("/personal/meins", "/personal/team");
    return { ok: true, name: r?.name, imUrlaub: Boolean(r?.urlaub_unterbrochen) };
  } catch (err) {
    return fehler(err);
  }
}

/** Krankmeldung: Bestätigung erhalten / gesund melden / verlängern (Variante A, 8 s). */
export async function krankSchrittAction({ name, schritt, datum }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    const k = await ctx.client.getDoc(DT.krank, name);
    const eigen = k.mitarbeiter === ctx.eigener?.name;
    if (schritt === "bestaetigung" && !istLeitung(ctx.rolle)) return nein();
    if (!eigen && !istLeitung(ctx.rolle)) return nein();
    const map = { bestaetigung: ["bestaetigung_erfasst", { datum: ctx.heute }], gesund: ["gesund_melden", { bis: datum }], verlaengern: ["verlaengern", { bis_voraussichtlich: datum }] };
    const [m, args] = map[schritt] || [];
    if (!m) return ungueltig(T.fehler.allgemein);
    if (schritt !== "bestaetigung" && !DATUM.test(datum || "")) return ungueltig("Datum im Format TT.MM.JJJJ", "datum");
    return planeCommit(ctx.session, { action: "personal.krank", args: { name, methode: m, args }, schluessel: `krank:${name}:${m}`, objekt: { doctype: DT.krank, name }, titel: T.krank[schritt === "bestaetigung" ? "bestaetigung" : schritt === "gesund" ? "gesund" : "verlaengern"] });
  } catch (err) {
    return fehler(err);
  }
}

/** Antrag entscheiden (Variante A): Genehmigen / Ablehnen (Pflichtgrund) / Stornieren. */
export async function antragAction({ name, aktion, grund }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(name || "") || !["Genehmigen", "Ablehnen", "Stornieren"].includes(aktion)) return ungueltig(T.fehler.allgemein);
    const a = await ctx.client.getDoc(DT.abw, name);
    const m = await ctx.client.getDoc(DT.ma, a.mitarbeiter).catch(() => null);
    const eigen = m?.user === ctx.user;
    if (aktion === "Stornieren") {
      const f = await ladeFaehigkeiten(ctx);
      const ok = (a.status === "Beantragt" && (eigen || istLeitung(ctx.rolle))) || (a.status === "Genehmigt" && (istLeitung(ctx.rolle) || (eigen && f.stornoGenehmigtSelbst.an && a.von > ctx.heute)));
      if (!ok) return nein(T.antrag.stornoGenehmigt);
    } else {
      const e = antragEntscheidbar(a, { rolle: ctx.rolle, user: ctx.user, mitarbeiterUser: m?.user });
      if (!e.darf) return nein(e.grund === "eigen" ? T.antrag.eigen : e.grund === "angelegt" ? T.antrag.angelegt : T.fehler.keinRecht);
      if (aktion === "Ablehnen" && txt(grund).length < 3) return ungueltig(T.antrag.grund, "grund");
    }
    return planeCommit(ctx.session, { action: "personal.antrag", args: { name, aktion, grund: txt(grund) }, schluessel: `antrag:${name}:${aktion}`, objekt: { doctype: DT.abw, name }, titel: `${aktion} von ${a.mitarbeiter_name}` });
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================ Stellen ==

export async function stelleAnlegenAction({ titel, kategorie, beschaeftigungsart, vorlage }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle) && ctx.rolle !== "admin") return nein();
    if (vorlage) {
      if (!NAME.test(vorlage)) return ungueltig(T.fehler.allgemein);
      const neu = await methode(ctx.client, DT.stelle, vorlage, "duplizieren", {});
      if (txt(titel)) await ctx.client.setValue(DT.stelle, neu, "titel", txt(titel, 140));
      rv("/personal/stellen");
      return { ok: true, name: neu };
    }
    if (!txt(titel)) return ungueltig("Bitte einen Titel eingeben.", "titel");
    if (!["Planung", "Verkauf", "Montage", "Verwaltung", "Lehre"].includes(kategorie)) return ungueltig("Bitte einen Bereich wählen.", "kategorie");
    const art = ["Vollzeit", "Teilzeit", "Vollzeit oder Teilzeit", "Lehre", "Praktikum", "Geringfuegig"].includes(beschaeftigungsart) ? beschaeftigungsart : "Vollzeit";
    const werte = { titel: txt(titel, 140), kategorie, beschaeftigungsart: art, entgelt_zeitraum: "Monat" };
    const doc = ctx.client.modus === "frappe" ? await ctx.client.insert(DT.stelle, werte) : mockStelleAnlegen(ctx.client, werte);
    rv("/personal/stellen");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

/** Formular-Speichern der Stellenakte (Formular onSpeichern): Mock leitet entgelt_vollstaendig/-text ab wie validate(). */
export async function stelleSpeichernAction({ name, modified, werte }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle) && ctx.rolle !== "admin") return nein();
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    const alt = await ctx.client.getDoc(DT.stelle, name);
    const sauber = { ...werte };
    for (const f of ["name", "slug", "status", "workflow_state", "entgelt_vollstaendig", "entgelt_text", "website_url", "besetzt_am", "besetzt_durch", "quelle", "sync_quelle", "kv_mindest_brutto_anzeige"]) delete sauber[f];
    if (!darfVertraulich(ctx.rolle)) delete sauber.notiz_intern;
    const voll = ctx.client.modus === "frappe" ? sauber : stelleAbleiten({ ...alt, ...sauber });
    const doc = await ctx.client.save(DT.stelle, { ...(ctx.client.modus === "frappe" ? sauber : voll), name }, { modified });
    rv("/personal/stellen", `/personal/stellen/${name}`);
    return { ok: true, name: doc.name, modified: doc.modified, doc };
  } catch (err) {
    return fehler(err);
  }
}

/** Workflow einer Stelle (Variante A). „Als besetzt schließen“ mit genau einer eingestellten Bewerbung → als_besetzt. */
export async function stelleWorkflowAction({ name, aktion, bewerbung }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    const tr = await ctx.client.getTransitions(DT.stelle, name).catch(() => []);
    if (!tr.some((t) => t.action === aktion)) return nein(aktion === "Wieder aktivieren" ? T.stellen.nurLeitungAktivieren : T.fehler.keinRecht);
    return planeCommit(ctx.session, { action: "personal.stelle-workflow", args: { name, aktion, bewerbung: NAME.test(bewerbung || "") ? bewerbung : null }, schluessel: `stelle:${name}:${aktion}`, objekt: { doctype: DT.stelle, name }, titel: T.stellen.aktion[aktion] || aktion });
  } catch (err) {
    return fehler(err);
  }
}

/** +60 Tage (Variante A), pausierte Stelle wird wieder aktiv (nur Leitung, Entgelt vollständig). */
export async function stelleVerlaengernAction({ name, tage = 60 }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    const s = await ctx.client.getDoc(DT.stelle, name);
    const bis = verlaengert(s, ctx.heute, Math.min(180, Math.max(1, Number(tage) || 60)));
    const r = await planeCommit(ctx.session, { action: "personal.stelle-verlaengern", args: { name, bis, aktivieren: s.status === "Pausiert" }, schluessel: `verlaengern:${name}`, objekt: { doctype: DT.stelle, name }, titel: T.stellen.verlaengern });
    return { ...r, bis };
  } catch (err) {
    return fehler(err);
  }
}

/** Dokumentmethoden der Stelle: duplizieren (B, Rückgängig löscht), website_cache_erneuern, pruefen. */
export async function stelleMethodeAction({ name, methode: m }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!NAME.test(name || "") || !["duplizieren", "website_cache_erneuern", "pruefen"].includes(m)) return ungueltig(T.fehler.allgemein);
    if (m !== "pruefen" && !darfBearbeiten(ctx.rolle)) return nein();
    const r = await methode(ctx.client, DT.stelle, name, m, {});
    rv("/personal/stellen");
    return { ok: true, ergebnis: r };
  } catch (err) {
    return fehler(err);
  }
}

/** Gegenaktion zu „Duplizieren“: Entwurf ohne Folgen löschen. */
export async function stelleEntwurfLoeschenAction({ name }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    const s = await ctx.client.getDoc(DT.stelle, name);
    if (s.status !== "Entwurf" || s.quelle !== "Duplikat") return nein();
    await ctx.client.delete(DT.stelle, name);
    rv("/personal/stellen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ============================================================ Bewerbungen ==

/** Board-Zug bzw. Akte-Knopf, der ein reiner Workflow ist (Variante A). */
export async function bewerbungWorkflowAction({ name, aktion, von, nach }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBewerbungen(ctx.rolle)) return nein();
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    const b = await ctx.client.getDoc(DT.bewerbung, name);
    const zug = von && nach ? bewerbungsZug(b.status, nach, ctx.rolle, { pseudonymisiert: Number(b.pseudonymisiert) }) : { art: "workflow", aktion, erlaubt: true };
    if (!zug || zug.art !== "workflow" && zug.art !== "zurueck" && zug.art !== "zurueckziehen") return ungueltig(T.fehler.allgemein);
    if (!zug.erlaubt) return nein(zug.grund === "leitung" ? T.bewerbung.nurLeitung : T.fehler.keinRecht);
    const tr = await ctx.client.getTransitions(DT.bewerbung, name).catch(() => []);
    const a = zug.aktion || aktion;
    if (!tr.some((t) => t.action === a)) return nein(T.fehler.keinRecht);
    return planeCommit(ctx.session, { action: "personal.bewerbung-workflow", args: { name, aktion: a }, schluessel: `bewerbung:${name}:${a}`, objekt: { doctype: DT.bewerbung, name }, titel: `${a} – ${b.vorname} ${b.nachname}`.trim() });
  } catch (err) {
    return fehler(err);
  }
}

/** Neue Bewerbung (Neu-Dialog § 5.5): Pflicht Nachname, Kontakt (E-Mail oder Telefon), Datenschutzinformation. */
export async function bewerbungAnlegenAction(p) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle)) return nein();
    const f = {};
    if (!txt(p?.nachname)) f.nachname = "Bitte den Nachnamen angeben.";
    const email = txt(p?.email, 140);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) f.email = "E-Mail-Adresse prüfen";
    if (!email && !txt(p?.telefon)) f.kontakt = T.bewerbung.feld.kontaktFehlt;
    if (!p?.datenschutz) f.datenschutz = T.bewerbung.feld.datenschutzPflicht;
    if (Object.keys(f).length) return { ok: false, code: "invalid", message: "Bitte die markierten Felder prüfen.", fehler: f };
    const stelle = NAME.test(p.stelle || "") ? p.stelle : "";
    const quelle = ["Website", "E-Mail", "Empfehlung", "AMS", "LinkedIn", "Sonstige"].includes(p.quelle) ? p.quelle : "E-Mail";
    const weg = ["Website-Formular", "E-Mail", "Post", "Persönlich"].includes(p.datenschutzWeg) ? p.datenschutzWeg : "E-Mail";
    const jetzt = `${ctx.heute} ${String(ctx.jetzt.getHours()).padStart(2, "0")}:${String(ctx.jetzt.getMinutes()).padStart(2, "0")}:00`;
    const st = stelle ? await ctx.client.getDoc(DT.stelle, stelle).catch(() => null) : null;
    const werte = {
      naming_series: "PH-BEW-.YYYY.-.#####", vorname: txt(p.vorname, 80), nachname: txt(p.nachname, 80), email, telefon: txt(p.telefon, 40), stelle, stelle_titel: st?.titel || "", initiativ: stelle ? 0 : 1, quelle,
      eingang: DATUM.test(p.eingang || "") ? `${p.eingang} 09:00:00` : jetzt, anrede: ["Frau", "Herr", "Divers"].includes(p.anrede) ? p.anrede : "", sprache: ["de", "en", "fr", "it"].includes(p.sprache) ? p.sprache : "de",
      verfuegbar_ab: DATUM.test(p.verfuegbar_ab || "") ? p.verfuegbar_ab : "", plz_ort: txt(p.plz_ort, 80), anschreiben: txt(p.anschreiben, 4000) ? `<p>${txt(p.anschreiben, 4000).replace(/</g, "&lt;")}</p>` : "",
      einwilligung_datenschutz: 1, datenschutzinfo_art: weg, datenschutzinfo_am: jetzt, zugewiesen_an: ctx.user, status: "Eingegangen", unterlagen: [],
      titel: `${txt(p.vorname)} ${txt(p.nachname)} – ${st?.titel || "Initiativbewerbung"}`.trim(),
    };
    const doc = await ctx.client.insert(DT.bewerbung, werte);
    ctx.client.kommentar?.(DT.bewerbung, doc.name, `Datenschutzinformation übermittelt per ${weg}`, "Info");
    if (p.eingangsbestaetigung && email) await methode(ctx.client, DT.bewerbung, doc.name, "eingang_bestaetigen", { per_mail: 1 }).catch(() => null);
    rv("/personal/bewerbungen");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

/** Duplikat-Hinweis: gleiche E-Mail bei nicht gelöschten Bewerbungen (nur Nummer + Status). */
export async function bewerbungDuplikatAction({ email }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBewerbungen(ctx.rolle) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || "")) return { ok: true, treffer: [] };
    const l = await ctx.client.getList(DT.bewerbung, { fields: ["name", "status"], filters: [["email", "=", email.trim()], ["pseudonymisiert", "=", 0]], limit: 5 });
    return { ok: true, treffer: l };
  } catch (err) {
    return fehler(err);
  }
}

/** Zuweisen (Variante B): Rückgabe des alten Werts. */
export async function bewerbungZuweisenAction({ name, user }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle)) return nein();
    if (!NAME.test(name || "") || (user && !NAME.test(user))) return ungueltig(T.fehler.allgemein);
    const b = await ctx.client.getDoc(DT.bewerbung, name);
    await ctx.client.setValue(DT.bewerbung, name, "zugewiesen_an", user || "");
    rv("/personal/bewerbungen", `/personal/bewerbungen/${name}`);
    return { ok: true, alt: b.zugewiesen_an || "" };
  } catch (err) {
    return fehler(err);
  }
}

/** Bewertung (permlevel 1, Leitung): Sterne, Eindruck, Gehaltsvorstellung, Notiz. */
export async function bewertungSpeichernAction({ name, bewertung, eindruck, gehaltsvorstellung_cent, notiz_intern }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    const w = {};
    if (bewertung !== undefined) w.bewertung = Math.min(1, Math.max(0, Number(bewertung) || 0));
    if (eindruck !== undefined) w.eindruck = txt(eindruck, 2000);
    if (gehaltsvorstellung_cent !== undefined) w.gehaltsvorstellung_cent = Math.max(0, Math.round(Number(gehaltsvorstellung_cent) || 0));
    if (notiz_intern !== undefined) w.notiz_intern = txt(notiz_intern, 4000);
    const b = await ctx.client.getDoc(DT.bewerbung, name);
    const doc = await ctx.client.save(DT.bewerbung, { name, ...w }, { modified: b.modified });
    return { ok: true, modified: doc.modified };
  } catch (err) {
    return fehler(err);
  }
}

/** Absage senden (Variante A, 10 s) – einzeln oder Serie. Nur Leitung. */
export async function absageAction({ namen, grund, versand }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein(T.bewerbung.absagenNurLeitung);
    const liste = (Array.isArray(namen) ? namen : []).filter((x) => NAME.test(x)).slice(0, 50);
    if (!liste.length) return ungueltig(T.fehler.allgemein);
    if (!T.absage.gruende.includes(grund)) return ungueltig(T.absage.grund, "grund");
    if (!T.absage.wege.includes(versand)) return ungueltig(T.absage.weg, "versand");
    return planeCommit(ctx.session, { action: "personal.absage", args: { namen: liste, grund, versand }, schluessel: `absage:${liste.join(",")}`, objekt: { doctype: DT.bewerbung, name: liste[0] }, titel: T.absage.senden, ms: ABSAGE_MS });
  } catch (err) {
    return fehler(err);
  }
}

/** Aufbewahrung verlängern (Variante B, Rückgabe alter Wert). Nur mit bestätigter Einwilligung. */
export async function aufbewahrungAction({ name, bis, bestaetigt }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    if (!bestaetigt) return ungueltig(T.akte.verlaengernCheck, "bestaetigt");
    if (!DATUM.test(bis || "") || bis <= ctx.heute) return ungueltig("Das Datum muss in der Zukunft liegen.", "bis");
    const b = await ctx.client.getDoc(DT.bewerbung, name);
    await methode(ctx.client, DT.bewerbung, name, "evidenz_verlaengern", { bis });
    rv(`/personal/bewerbungen/${name}`, "/personal/datenschutz");
    return { ok: true, alt: { evidenz: Number(b.einwilligung_evidenz) || 0, bis: b.einwilligung_evidenz_bis || "" } };
  } catch (err) {
    return fehler(err);
  }
}

/** Gegenaktion zur Aufbewahrung. */
export async function aufbewahrungZurueckAction({ name, alt }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle) || !NAME.test(name || "")) return nein();
    const b = await ctx.client.getDoc(DT.bewerbung, name);
    await ctx.client.save(DT.bewerbung, { name, einwilligung_evidenz: alt?.evidenz ? 1 : 0, einwilligung_evidenz_bis: alt?.bis || null }, { modified: b.modified });
    rv(`/personal/bewerbungen/${name}`, "/personal/datenschutz");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Daten endgültig löschen (Leitung, Tippfeld „löschen“). Räumt Gespräche mit auf (Mock; Frappe: Löschlauf A2). */
export async function bewerberDatenLoeschenAction({ namen, bestaetigung }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    if (String(bestaetigung || "").trim().toLowerCase() !== "löschen") return ungueltig(T.akte.tippe, "bestaetigung");
    const liste = (Array.isArray(namen) ? namen : []).filter((x) => NAME.test(x)).slice(0, 50);
    const ergebnisse = [];
    for (const name of liste) {
      try {
        await methode(ctx.client, DT.bewerbung, name, "unterlagen_loeschen", {});
        ergebnisse.push({ name, ok: true });
      } catch (err) {
        ergebnisse.push({ name, ok: false, message: err?.message });
      }
    }
    rv("/personal/bewerbungen", "/personal/datenschutz", ...liste.map((x) => `/personal/bewerbungen/${x}`));
    const fehl = ergebnisse.filter((e) => !e.ok);
    if (fehl.length === liste.length && liste.length) return { ok: false, code: "invalid", message: fehl[0].message || T.fehler.allgemein, ergebnisse };
    return { ok: true, ergebnisse };
  } catch (err) {
    return fehler(err);
  }
}

// ============================================================== Gespräche ==

export async function slotDatenAction({ von, bis }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBewerbungen(ctx.rolle) || !DATUM.test(von || "") || !DATUM.test(bis || "")) return nein();
    return { ok: true, ...(await ladeSlotDaten(ctx, { von, bis })) };
  } catch (err) {
    return fehler(err);
  }
}

/** Gespräch anlegen (§ 6.2): gespraech_anlegen setzt den Status (auch aus Eingegangen), optional Kalender. */
export async function gespraechAnlegenAction({ bewerbung, start: beginn, dauer, modus, ort, verantwortlich, kalender, weitere }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle)) return nein();
    if (!NAME.test(bewerbung || "")) return ungueltig(T.gespraech.bewerbung, "bewerbung");
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(beginn || "")) return ungueltig("Bitte eine Zeit wählen.", "start");
    if (!NAME.test(verantwortlich || "")) return ungueltig(T.gespraech.fuehrung, "verantwortlich");
    const g = await methode(ctx.client, DT.bewerbung, bewerbung, "gespraech_anlegen", { start: `${beginn}:00`, dauer_min: [30, 45, 60, 90].includes(Number(dauer)) ? Number(dauer) : 60, modus: T.gespraech.modi.includes(modus) ? modus : "Vor Ort", ort: txt(ort, 140), verantwortlich });
    if (txt(weitere)) await ctx.client.setValue(DT.gespraech, g, "weitere_teilnehmer", txt(weitere, 500)).catch(() => null);
    if (kalender) await methode(ctx.client, DT.gespraech, g, "kalender_eintragen", {}).catch(() => null);
    rv("/personal/bewerbungen", `/personal/bewerbungen/${bewerbung}`, "/personal/gespraeche");
    return { ok: true, name: g };
  } catch (err) {
    return fehler(err);
  }
}

/** Umplanen / bestätigt / Kalender (Variante B, Rückgabe alter Werte). */
export async function gespraechAendernAction({ name, start: beginn, bestaetigt, kalender }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle) || !NAME.test(name || "")) return nein();
    const g = await ctx.client.getDoc(DT.gespraech, name);
    if (beginn) {
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(beginn)) return ungueltig("Datum und Uhrzeit prüfen", "start");
      const s = new Date(beginn.replace(" ", "T"));
      const e = new Date(s.getTime() + (Number(g.dauer_min) || 60) * 60000);
      const p2 = (x) => String(x).padStart(2, "0");
      const fmt = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:00`;
      await ctx.client.save(DT.gespraech, { name, start: fmt(s), ende: fmt(e) }, { modified: g.modified });
    }
    if (bestaetigt) await ctx.client.setValue(DT.gespraech, name, "bestaetigt_am", `${ctx.heute} ${String(ctx.jetzt.getHours()).padStart(2, "0")}:${String(ctx.jetzt.getMinutes()).padStart(2, "0")}:00`);
    if (kalender) await methode(ctx.client, DT.gespraech, name, "kalender_eintragen", {});
    rv("/personal/gespraeche");
    return { ok: true, alt: { start: String(g.start).slice(0, 16) } };
  } catch (err) {
    return fehler(err);
  }
}

/** Termin absagen / Nicht erschienen (Variante A). */
export async function gespraechStatusAction({ name, status }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle) || !NAME.test(name || "") || !["Abgesagt", "Nicht erschienen"].includes(status)) return nein();
    return planeCommit(ctx.session, { action: "personal.gespraech-status", args: { name, status }, schluessel: `gespraech:${name}:${status}`, objekt: { doctype: DT.gespraech, name }, titel: status === "Abgesagt" ? T.gespraech.terminAbsagen : T.gespraech.nichtErschienen });
  } catch (err) {
    return fehler(err);
  }
}

/** Ergebnis erfassen (abschliessen): Angebot setzt die Bewerbung auf Angebot. */
export async function gespraechErgebnisAction({ name, ergebnis, naechster }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfBearbeiten(ctx.rolle) || !NAME.test(name || "")) return nein();
    if (!T.gespraech.ergebnisse.includes(ergebnis)) return ungueltig(T.gespraech.ergebnis, "ergebnis");
    if (ergebnis === "Angebot" && !istLeitung(ctx.rolle)) return nein(T.bewerbung.nurLeitung);
    await methode(ctx.client, DT.gespraech, name, "abschliessen", { ergebnis, naechster_schritt: txt(naechster, 140) });
    rv("/personal/gespraeche", "/personal/bewerbungen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ======================================================= Einstellen/Austritt ==

/** Einstellen (§ 6.3): ph_personal.einstellen ist atomar und idempotent (liefert vorhandene Personalakte). */
export async function einstellenAction({ bewerbung, eintritt, rolle, ausmass, wochenstunden, urlaub, benutzerMail, rollen = [], stelleSchliessen, onboarding = true }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  const teile = [];
  try {
    if (!istLeitung(ctx.rolle)) return nein(T.akte.einstellenNurLeitung);
    if (!NAME.test(bewerbung || "")) return ungueltig(T.fehler.allgemein);
    if (!DATUM.test(eintritt || "")) return ungueltig("Datum im Format TT.MM.JJJJ", "eintritt");
    const ROLLEN_I = ["Geschaeftsfuehrung", "Verkauf", "Planung", "Montage", "Verwaltung", "Lehrling"];
    if (!ROLLEN_I.includes(rolle)) return ungueltig(T.einstellen.rolle, "rolle");
    const b = await ctx.client.getDoc(DT.bewerbung, bewerbung);
    const ma = await methode(ctx.client, DT.bewerbung, bewerbung, "einstellen", {
      eintritt, rolle_intern: rolle, stelle_schliessen: stelleSchliessen ? 1 : 0, beschaeftigungsart: ["Vollzeit", "Teilzeit", "Geringfuegig", "Lehre", "Praktikum"].includes(ausmass) ? ausmass : "Vollzeit",
      wochenstunden: Number(wochenstunden) > 0 ? Number(wochenstunden) : null, urlaubsanspruch_tage: Number(urlaub) > 0 ? Number(urlaub) : null,
    });
    teile.push({ id: "akte", ok: true, text: T.einstellen.teil.akte(ma) }, { id: "status", ok: true, text: T.einstellen.teil.status });
    teile.push({ id: "stelle", ok: true, text: stelleSchliessen && b.stelle ? T.einstellen.teil.stelle : T.einstellen.teil.stelleOffen, neutral: !stelleSchliessen });
    // Zugang: Benutzer legt der Backoffice-Admin an (kein User-create im Bereich) → Aufgabe mit allen Angaben.
    const aufgaben = [];
    if (txt(benutzerMail)) aufgaben.push({ titel: `personal:zugang – Benutzer anlegen für ${b.vorname} ${b.nachname} (${txt(benutzerMail, 140)}; Rollen: ${["PH Personal Selbstservice", ...rollen.filter((r) => typeof r === "string")].join(", ")})`, faellig: plusTage(eintritt, -1) });
    if (onboarding) for (const v of ONBOARDING) aufgaben.push({ titel: `personal:onboarding – ${v.titel} (${b.vorname} ${b.nachname})${v.grundlage ? ` · ${v.grundlage}` : ""}`, faellig: faelligAm(v, eintritt, plusTage) });
    let angelegt = 0;
    for (const a of aufgaben) {
      try {
        await ctx.client.insert("PH Aufgabe", { titel: a.titel.slice(0, 140), faellig: a.faellig, status: "Offen", zugewiesen_an: ctx.user, referenz_doctype: DT.ma, referenz_name: ma, quelle: "workflow", naming_series: "PH-AUF-.YYYY.-.#####" });
        angelegt += 1;
      } catch {
        /* Aufgabe fehlgeschlagen → Teilschritt unten */
      }
    }
    if (txt(benutzerMail)) teile.push({ id: "benutzer", ok: angelegt > 0, text: T.einstellen.teil.benutzer });
    if (onboarding) teile.push({ id: "onboarding", ok: angelegt >= ONBOARDING.length, text: T.einstellen.teil.onboarding(Math.max(0, angelegt - (txt(benutzerMail) ? 1 : 0))) });
    rv("/personal/bewerbungen", `/personal/bewerbungen/${bewerbung}`, "/personal/team", "/personal/stellen");
    return { ok: true, mitarbeiter: ma, teile };
  } catch (err) {
    const f = fehler(err);
    return { ...f, teile };
  }
}

/** Austritt (§ 6.4): austritt_erfassen + Aufgaben (Zugang am Stichtag an Admin). Kein Undo. */
export async function austrittAction({ mitarbeiter, datum, grund, aufgaben = [] }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    if (!NAME.test(mitarbeiter || "")) return ungueltig(T.fehler.allgemein);
    if (!DATUM.test(datum || "")) return ungueltig("Datum im Format TT.MM.JJJJ", "datum");
    const m = await ctx.client.getDoc(DT.ma, mitarbeiter);
    if (m.eintritt && datum < m.eintritt) return ungueltig("Austritt liegt vor dem Eintritt.", "datum");
    await methode(ctx.client, DT.ma, mitarbeiter, "austritt_erfassen", { datum });
    if (txt(grund)) ctx.client.kommentar?.(DT.ma, mitarbeiter, `Austrittsgrund: ${txt(grund, 300)}`, "Comment");
    let angelegt = 0;
    for (const v of AUSTRITT.filter((x) => aufgaben.includes(x.id))) {
      try {
        await ctx.client.insert("PH Aufgabe", { titel: `personal:austritt – ${v.titel} (${m.titel})`.slice(0, 140), faellig: faelligAm(v, datum, plusTage), status: "Offen", zugewiesen_an: ctx.user, referenz_doctype: DT.ma, referenz_name: mitarbeiter, quelle: "workflow", naming_series: "PH-AUF-.YYYY.-.#####" });
        angelegt += 1;
      } catch {
        /* weiter */
      }
    }
    rv("/personal/team", `/personal/mitarbeiter/${mitarbeiter}`);
    return { ok: true, aufgaben: angelegt };
  } catch (err) {
    return fehler(err);
  }
}

/** Mitarbeiter anlegen (Neu-Dialog § 5.8). */
export async function mitarbeiterAnlegenAction({ vorname, nachname, rolle, eintritt, ausmass, wochenstunden, user }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!(istLeitung(ctx.rolle) || ctx.rolle === "admin" || ctx.rolle === "sachbearbeitung")) return nein();
    const f = {};
    if (!txt(vorname)) f.vorname = "Bitte den Vornamen angeben.";
    if (!txt(nachname)) f.nachname = "Bitte den Nachnamen angeben.";
    if (!["Geschaeftsfuehrung", "Verkauf", "Planung", "Montage", "Verwaltung", "Lehrling"].includes(rolle)) f.rolle = "Bitte eine Rolle wählen.";
    if (!DATUM.test(eintritt || "")) f.eintritt = "Datum im Format TT.MM.JJJJ";
    if (Object.keys(f).length) return { ok: false, code: "invalid", message: "Bitte die markierten Felder prüfen.", fehler: f };
    const doc = await ctx.client.insert(DT.ma, { naming_series: "PH-MA-.####", vorname: txt(vorname, 80), nachname: txt(nachname, 80), titel: `${txt(vorname)} ${txt(nachname)}`, rolle_intern: rolle, eintritt, status: "Aktiv", beschaeftigungsart: ausmass || "Vollzeit", wochenstunden: Number(wochenstunden) || null, user: NAME.test(user || "") ? user : "" });
    rv("/personal/team");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

/** Speichern der Einstellungen (Formular onSpeichern). */
export async function einstellungenSpeichernAction({ modified, werte }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!darfEinstellungenSchreiben(ctx.rolle)) return nein();
    const m = Number(werte?.loeschfrist_monate);
    if (werte && "loeschfrist_monate" in werte && (!Number.isFinite(m) || m < 6)) return ungueltig("Mindestens 6 Monate – GlBG § 15", "loeschfrist_monate");
    const doc = await ctx.client.save(DT.einst, { ...werte, name: DT.einst }, { modified });
    rv("/personal/einstellungen");
    return { ok: true, name: DT.einst, modified: doc.modified, doc };
  } catch (err) {
    return fehler(err);
  }
}

/** Generisches Speichern der Personalakte (Stammdaten) über Formular – permlevel-1-Felder nur für Leitung. */
export async function mitarbeiterSpeichernAction({ name, modified, werte }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!(istLeitung(ctx.rolle) || ctx.rolle === "admin" || ctx.rolle === "sachbearbeitung")) return nein();
    if (!NAME.test(name || "")) return ungueltig(T.fehler.allgemein);
    const w = { ...werte };
    for (const f of ["name", "titel", "bewerbung", "zugang_entzogen_am", "notfallkontakt_geloescht_am"]) delete w[f];
    if (!istLeitung(ctx.rolle)) for (const f of ["geburtsdatum", "privatadresse", "telefon_privat", "email_privat", "notfallkontakt_name", "notfallkontakt_telefon", "notfallkontakt_beziehung", "hinweise_vertraulich", "lohnverrechnung_personalnummer", "dokumente"]) delete w[f];
    if (w.wochenstunden != null && Number(w.wochenstunden) < 0) return ungueltig("Wochenstunden können nicht negativ sein", "wochenstunden");
    if (w.status === "Ausgetreten" && !w.austritt) return ungueltig("Für „Ausgetreten“ bitte das Austrittsdatum eintragen", "austritt");
    const doc = await ctx.client.save(DT.ma, { ...w, name }, { modified });
    rv(`/personal/mitarbeiter/${name}`, "/personal/team");
    return { ok: true, name, modified: doc.modified, doc };
  } catch (err) {
    return fehler(err);
  }
}

/** Sammel-Aktion Team › Buchungen: Pause 30 min bei „Erfasst“ ohne Pause und Brutto > 6 h (Leitung). */
export async function pauseSammelAction({ namen }) {
  const { ctx, nein: n } = await start();
  if (n) return n;
  try {
    if (!istLeitung(ctx.rolle)) return nein();
    let ok = 0;
    for (const name of (namen || []).filter((x) => NAME.test(x)).slice(0, 200)) {
      const b = await ctx.client.getDoc(DT.zeit, name).catch(() => null);
      if (!b || b.status === "Offen" || Number(b.pause_min) > 0 || zeitMin(b.gehen) - zeitMin(b.kommen) <= 360) continue;
      await methode(ctx.client, DT.zeit, name, "pause_bestaetigen", { pause_min: 30 });
      ok += 1;
    }
    rv("/personal/team");
    return { ok: true, anzahl: ok };
  } catch (err) {
    return fehler(err);
  }
}

/** Liste der Personen für Team-Ansichten (nur Rechte prüfen). */
export async function teamRechtAction() {
  const { ctx, nein: n } = await start();
  if (n) return n;
  return { ok: darfTeam(ctx.rolle), entscheiden: darfEntscheiden(ctx.rolle) };
}
