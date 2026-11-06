"use server";
// Server Actions Bereich Shop (10-konzept-shop § 15.3, § 6.3 Aktionsmatrix). Jede Action: Sitzung + Recht erneut,
// Vorbedingung erneut (nie nur der Client), Rückgabe { ok, code, message, ergebnis? } – wirft nie.
// Klassen: Undo (verzögerter Commit 8 s über planeCommit) · Geld/Bestätigung/Feldwert/Sofort (direkt).
// Mock-Pfad: shop/backend.js bildet jede ph_shop-Methode auf der Mock-Datenbank nach.

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/dal.js";
import { backoffice } from "../frappe/index.js";
import { istBackofficeError } from "../frappe/errors.js";
import { planeCommit } from "../commit/server.js";
import { faehigkeit } from "../faehigkeiten.js";
import { methode, aufruf, workflow } from "./backend.js";
import { offen, erstattungGesperrt, fremdwaehrung, VERBOTENE_BACKOFFICE_KANAELE } from "./geld.js";
import { istLeitung, istGF, darfSchreiben, darfEinstellungen } from "./rechte.js";
import { stornoErlaubt } from "./primaer.js";
import { steuerfallOffen } from "./naechsterSchritt.js";
import { steuerfallVermerk } from "./mockWirkung.js";
import { SHOP } from "./faehigkeiten.js";
import { emailTipp } from "./emailTipp.js";
import { T, mailKurz } from "./texte.js";
import { cent } from "../format.js";
import { prueflisteFuer } from "./pruefliste.js";

const G = globalThis;
const NEIN = (code, message) => ({ ok: false, code, message });

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message };
  console.error("[shop] Aktion fehlgeschlagen", err?.name || "Fehler");
  return { ok: false, code: "unavailable", message: "Das hat nicht geklappt. Bitte erneut versuchen." };
}

async function sitzung({ schreiben = true } = {}) {
  const session = await getSession();
  if (!session) return { nein: NEIN("auth", "Bitte neu anmelden.") };
  if (schreiben && !darfSchreiben(session) && !istGF(session)) return { nein: NEIN("forbidden", "Keine Berechtigung im Shop.") };
  return { session, client: backoffice(session) };
}

const NAME = /^[A-Za-z0-9_. -]{3,80}$/;
const gueltigerName = (n) => typeof n === "string" && NAME.test(n);

function aktualisiere(pfad) {
  try {
    revalidatePath("/shop", "layout");
    if (pfad) revalidatePath(pfad);
  } catch {
    // außerhalb einer Anfrage ohne Wirkung
  }
}

/** Idempotenz (Q-A10): gleicher Schlüssel → gleiches Ergebnis, kein zweiter Beleg. */
async function einmal(schluessel, fn) {
  if (!schluessel) return fn();
  G.__phShopIdem ||= new Map();
  const m = G.__phShopIdem;
  const jetzt = Date.now();
  for (const [k, v] of m) if (jetzt - v.t > 10 * 60_000) m.delete(k);
  if (m.has(schluessel)) return m.get(schluessel).p;
  const p = fn();
  m.set(schluessel, { p, t: jetzt });
  const r = await p;
  if (!r?.ok) m.delete(schluessel);
  return r;
}

// ------------------------------------------------------------------ Undo-Aktionen --

/**
 * planeCommit mit einem Wiederholversuch: Der Commit-Dienst ist je Prozess zwischengespeichert (globalThis); nach einem
 * Hot-Reload kennt er neu eingetragene Bereichs-Aktionen nicht. Dann einmal neu aufbauen lassen (Tokens liegen im
 * Sitzungs-Store, nicht im Dienst). Im Betrieb (ohne Hot-Reload) greift das nie. Befund an P0-3 im Übergabeprotokoll.
 */
async function plane(session, opts) {
  try {
    return await planeCommit(session, opts);
  } catch (err) {
    if (!(err instanceof TypeError) || !/nicht registriert/.test(String(err.message))) throw err;
    delete G.__phBoCommit;
    return planeCommit(session, opts);
  }
}

/** Aktion-ID → DocType, Methode, Vorbedingung (doc, ctx) → Fehlertext | null, Toast-Text. */
const UNDO = {
  packen: { dt: "PH Bestellung", m: "packen", vor: (b, c) => (b.status !== "bezahlt" || b.lieferart !== "versand" ? "Packen nur für bezahlte Versandbestellungen." : steuerfallOffen(b) && !c.leitung ? "Steuerfall klären (Leitung)." : null), toast: (b) => T.toast.gepackt(b.name) },
  abholbereit: { dt: "PH Bestellung", m: "abholbereit_melden", vor: (b) => (b.lieferart !== "abholung" || !["bezahlt", "reserviert"].includes(b.status) ? "Abholbereit nur aus bezahlt oder reserviert." : offen(b) > 0 ? T.kanbanVerboten.erstZahlung : null), toast: (b) => T.toast.abholbereit(b.name) },
  uebergeben: { dt: "PH Bestellung", m: "abgeholt_melden", vor: (b) => (b.status !== "abholbereit" ? "Übergeben nur aus „Abholbereit“." : offen(b) > 0 ? T.kanbanVerboten.erstZahlung : null), toast: (b) => T.toast.uebergeben(b.name, b.kunde_name) },
  abschliessen: { dt: "PH Bestellung", m: "abschliessen", vor: (b) => (!["versendet", "abgeholt"].includes(b.status) ? "Abschließen nur aus versendet oder abgeholt." : null), toast: (b) => T.toast.abgeschlossen(b.name) },
  bestaetigung: { dt: "PH Bestellung", m: "bestaetigung_senden", vor: (b) => (!b.kunde_email ? "Keine E-Mail-Adresse." : null), toast: (b) => T.toast.bestaetigung(b.name) },
  "zahlungslink-senden": { dt: "PH Bestellung", m: "zahlungslink_senden", vor: (b) => (b.status !== "offen" ? "Zahlungslink nur bei offenen Bestellungen." : null), toast: (b) => T.toast.zahlungslink(cent(offen(b)), mailKurz(b.kunde_email)) },
  "zahlungslink-neu": { dt: "PH Bestellung", m: "zahlungslink_erstellen", args: { senden: 1 }, vor: (b) => (!["offen", "fehlgeschlagen", "checkout_fehler", "abgelaufen"].includes(b.status) ? "Zahlungslink nur bei offenen Bestellungen." : null), toast: (b) => T.toast.zahlungslink(cent(offen(b)), mailKurz(b.kunde_email)) },
  abholcode: { dt: "PH Bestellung", m: "abholcode_erneut_senden", vor: (b) => (b.status !== "abholbereit" ? "Nur bei abholbereiten Bestellungen." : null), toast: (b) => T.toast.abholcode(b.name) },
  versendet: { dt: "PH Bestellung", m: "versendet_melden", vor: (b) => (!["versandbereit", "bezahlt"].includes(b.status) ? "Versendet nur aus versandbereit oder bezahlt." : null), toast: (b) => T.toast.versendet(b.name), argsAus: (a) => ({ awb: String(a?.awb || "").slice(0, 60), carrier: String(a?.carrier || "").slice(0, 40), benachrichtigen: 1 }) },
  "teilstorno-unbezahlt": { dt: "PH Bestellung", m: "positionen_stornieren", vor: (b) => (Number(b.betrag_bezahlt_cent || 0) > 0 ? "Bezahlte Bestellung – Teilerstattung über die Leitung." : null), toast: (b) => `Teilstorno ${b.name}`, argsAus: (a) => ({ zeilen: zeilenPruefen(a?.zeilen), grund: String(a?.grund || "").slice(0, 140) }) },
  ersatz: { dt: "PH Bestellung", m: "ersatzlieferung_anlegen", vor: () => null, toast: (b) => T.toast.ersatz(b.name), argsAus: (a) => ({ zeilen: zeilenPruefen(a?.zeilen), grund: String(a?.grund || "").slice(0, 140), lieferart: ["versand", "abholung"].includes(a?.lieferart) ? a.lieferart : undefined }), pflicht: (a) => (!String(a?.grund || "").trim() ? "Bitte einen Grund angeben." : null) },
  "widerruf-erfassen": { dt: "PH Bestellung", m: "widerruf_anlegen", vor: (b) => (!["versendet", "abgeholt", "abgeschlossen"].includes(b.status) ? "Widerruf erst nach Versand oder Abholung – vorher stornieren." : null), toast: (b) => T.toast.widerrufAngelegt(b.name), argsAus: (a) => ({ kanal: ["Brief", "Telefon", "Showroom", "E-Mail"].includes(a?.kanal) ? a.kanal : "E-Mail", text: String(a?.text || "").slice(0, 2000) }) },
  "widerruf-bestaetigen": { dt: "PH Widerruf", m: "bestaetigung_senden", vor: (w) => (w.status !== "Eingegangen" ? "Bestätigung ist schon gesendet." : null), toast: (w) => T.toast.eingangsbestaetigung(w.name) },
  "retoure-anlegen": { dt: "PH Widerruf", m: "retoure_anlegen", vor: (w) => (!w.bestellung ? "Erst einer Bestellung zuordnen." : w.retoure ? "Retoure ist schon angelegt." : null), toast: (w) => T.toast.retoureAngelegt(w.name) },
  "ware-erhalten": { dt: "PH Widerruf", m: "ware_erhalten", vor: (w) => (w.status !== "Ware erwartet" && w.status !== "Bestaetigt" ? "Ware wird nicht erwartet." : null), toast: (w) => T.toast.wareErhalten(w.name) },
  "retoure-eingang": { dt: "PH Retoure", m: "eingegangen", vor: (r) => (!["Angekuendigt", "Label gesendet", "Unterwegs"].includes(r.status) ? "Eingang ist schon gebucht." : null), toast: (r) => T.toast.retoureEingang(r.name) },
  "pdf-senden": { dt: "PH Gutschein", m: "pdf_senden", vor: (g) => (!g.pdf ? "Code liegt nicht mehr im Klartext vor – „Ersetzen“ erzeugt einen neuen." : null), toast: (g) => T.toast.pdfSenden(g.name) },
  "gutschein-mail": { dt: "PH Gutschein Bestellung", m: "codes_erneut_senden", vor: (k) => (k.status !== "bezahlt" ? "Nur bezahlte Gutscheinkäufe." : null), toast: (k) => T.toast.gutscheinMail(k.name) },
  "anzahlung-link": { dt: "PH Anzahlung", m: "link_senden", vor: (a) => (!["offen", "fehlgeschlagen", "zahlung_ausstehend"].includes(a.status) ? "Nur offene Anzahlungen." : null), toast: (a) => T.toast.anzahlungLink(a.name) },
};

function zeilenPruefen(z) {
  if (!z || typeof z !== "object") return undefined;
  const out = {};
  for (const [k, v] of Object.entries(z)) if (/^\d{1,3}$/.test(k) && Number.isInteger(Number(v)) && Number(v) > 0 && Number(v) < 10_000) out[k] = Number(v);
  return out;
}

/**
 * Undo-Aktion vormerken (verzögerter Commit 8 s). Rückgabe { ok, token, ms, objekt, text }.
 * @param {{aktion:string, name:string, args?:object}} p
 */
export async function vormerkenAction({ aktion, name, args } = {}) {
  const { session, client, nein } = await sitzung();
  if (nein) return nein;
  try {
    if (!gueltigerName(name)) return NEIN("invalid", "Unvollständige Angaben.");
    const leitung = istLeitung(session);
    if (aktion === "direkt-uebergeben" || aktion === "zurueck-offen") {
      const b = await client.getDoc("PH Bestellung", name);
      if (aktion === "direkt-uebergeben") {
        if (!["bezahlt", "abholbereit"].includes(b.status) || b.lieferart !== "abholung") return NEIN("invalid", "Direkt übergeben nur bei Abholungen.");
        if (offen(b) > 0) return NEIN("invalid", T.kanbanVerboten.erstZahlung);
        if (args?.ohneCode && args?.ausweis !== true) return NEIN("invalid", "Ohne Abholcode: Ausweis prüfen und bestätigen.");
        const r = await plane(session, { action: "shop.direkt-uebergeben", args: { doctype: "PH Bestellung", name, kommentar: args?.ohneCode ? "Übergabe ohne Code, Ausweis geprüft" : "" }, schluessel: `direkt:${name}`, objekt: { doctype: "PH Bestellung", name }, titel: `Übergeben ${name}` });
        return r.ok ? { ...r, text: T.toast.uebergeben(name, b.kunde_name) } : r;
      }
      if (!leitung) return NEIN("forbidden", T.nurLeitung);
      if (!["fehlgeschlagen", "checkout_fehler", "abgelaufen"].includes(b.status)) return NEIN("invalid", "Zurück auf Offen nur aus fehlgeschlagen, fehlerhaft oder abgelaufen.");
      const r = await plane(session, { action: "shop.workflow", args: { doctype: "PH Bestellung", name, aktion: "Zurück auf Offen" }, schluessel: `offen:${name}`, objekt: { doctype: "PH Bestellung", name }, titel: `Zurück auf Offen ${name}` });
      return r.ok ? { ...r, text: T.toast.zurueckOffen(name) } : r;
    }
    if (aktion === "uebergeben" && args?.ohneCode) {
      if (args?.ausweis !== true) return NEIN("invalid", "Ohne Abholcode: Ausweis prüfen und bestätigen.");
      return vormerkenAction({ aktion: "direkt-uebergeben", name, args });
    }
    const def = UNDO[aktion];
    if (!def) return NEIN("invalid", "Unbekannte Aktion.");
    const doc = await client.getDoc(def.dt, name);
    if (def.dt === "PH Bestellung" && fremdwaehrung(doc) && ["zahlungslink-senden", "zahlungslink-neu"].includes(aktion)) return NEIN("invalid", T.baender.fremd);
    const grund = def.vor(doc, { leitung }) || def.pflicht?.(args);
    if (grund) return NEIN("invalid", grund);
    const methodenArgs = def.argsAus ? def.argsAus(args) : def.args || {};
    const r = await plane(session, {
      action: "shop.methode",
      args: { doctype: def.dt, name, methode: def.m, args: methodenArgs, pfad: pfadFuer(def.dt, name) },
      schluessel: `${aktion}:${name}`,
      objekt: { doctype: def.dt, name },
      titel: `${aktionTitel(aktion)} ${name}`,
    });
    return r.ok ? { ...r, text: def.toast(doc) } : r;
  } catch (err) {
    return fehler(err);
  }
}

function aktionTitel(a) {
  return { packen: "Packen", abholbereit: "Abholbereit melden", uebergeben: "Übergeben", abschliessen: "Abschließen", bestaetigung: "Bestätigung", versendet: "Versendet melden" }[a] || "Aktion";
}

function pfadFuer(dt, name) {
  const basis = { "PH Bestellung": "/shop/bestellungen", "PH Widerruf": "/shop/widerrufe", "PH Retoure": "/shop/retouren", "PH Gutschein": "/shop/gutscheine", "PH Gutschein Bestellung": "/shop/gutscheinkaeufe", "PH Anzahlung": "/shop/anzahlungen", "PH Zahlung": "/shop/zahlungen" }[dt];
  return basis ? `${basis}/${encodeURIComponent(name)}` : "/shop";
}

/** Massenaktion: je zulässige Bestellung einen Commit vormerken; übersprungene mit Grund (Q-C10). */
export async function massenVormerkenAction({ aktion, namen } = {}) {
  if (!Array.isArray(namen) || namen.length > 50 || !UNDO[aktion]) return NEIN("invalid", "Unvollständige Angaben.");
  const geplant = [];
  const skip = [];
  for (const name of namen) {
    const r = await vormerkenAction({ aktion, name });
    if (r.ok) geplant.push({ name, token: r.token, ms: r.ms, objekt: r.objekt });
    else skip.push({ name, grund: r.message });
  }
  return { ok: true, geplant, skip };
}

// --------------------------------------------------------------- Sofort / Geld / Bestätigung --

const SOFORT = {
  // Bestellung
  "zahlung-erfassen": async ({ client, session, name, a }) => {
    const b = await client.getDoc("PH Bestellung", name);
    if (fremdwaehrung(b)) return NEIN("invalid", T.baender.fremd);
    if (b.status === "zahlung_ausstehend" && !istLeitung(session)) return NEIN("forbidden", "Stripe-Zahlung unterwegs – nur die Leitung erfasst hier eine Zahlung.");
    if (b.status === "abholbereit" && offen(b) > 0) return NEIN("invalid", "Noch nicht verfügbar – an der Kassa kassieren.");
    const kanal = a.kanal || "Ueberweisung";
    if (VERBOTENE_BACKOFFICE_KANAELE.includes(kanal) || kanal !== "Ueberweisung") return NEIN("invalid", "Bar und Karte nur an der Kassa.");
    const betrag = Number(a.betrag_cent);
    if (!Number.isInteger(betrag) || betrag <= 0 || betrag > offen(b)) return NEIN("invalid", `Betrag zwischen 0,01 € und ${cent(offen(b))}.`);
    if (!String(a.referenz || "").trim()) return NEIN("invalid", "Referenz angeben (Verwendungszweck oder Bankreferenz).");
    return { name: await methode(client, "PH Bestellung", name, "zahlung_erfassen", { kanal: "Ueberweisung", betrag_cent: betrag, referenz: String(a.referenz).slice(0, 140) }) };
  },
  "gutschein-einloesen": async ({ client, name, a }) => {
    const b = await client.getDoc("PH Bestellung", name);
    if (fremdwaehrung(b)) return NEIN("invalid", T.baender.fremd);
    const p = await aufruf(client, "ph_shop.api.backoffice.check_voucher", { code: String(a.code || "") });
    if (!p?.ok) return NEIN("invalid", `Gutschein ${p?.fehler || "nicht gültig"}.`);
    const max = Math.min(Number(p.rest_cent), offen(b));
    const betrag = Number(a.betrag_cent) || max;
    if (betrag <= 0 || betrag > max) return NEIN("invalid", `Höchstens ${cent(max)}.`);
    return await methode(client, "PH Bestellung", name, "gutschein_einloesen", { code: String(a.code), betrag_cent: betrag });
  },
  stornieren: async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    const b = await client.getDoc("PH Bestellung", name);
    if (!stornoErlaubt(b.status)) return NEIN("invalid", "Aus diesem Status nicht stornierbar – Widerruf erfassen.");
    if (!String(a.grund || "").trim()) return NEIN("invalid", "Bitte einen Grund wählen.");
    let erstatten = a.erstatten === false ? 0 : 1;
    if (erstatten && Number(b.betrag_bezahlt_cent) > 0) {
      const sperre = await geldSperre(client, session, b);
      if (sperre) {
        if (sperre.code === "bar" && a.ohneErstattung) erstatten = 0;
        else return NEIN("invalid", sperre.text);
      }
    }
    return await methode(client, "PH Bestellung", name, "stornieren", { grund: String(a.grund).slice(0, 140), erstatten, betrag_cent: a.betrag_cent ? Number(a.betrag_cent) : undefined });
  },
  teilerstatten: async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    const b = await client.getDoc("PH Bestellung", name);
    const sperre = await geldSperre(client, session, b);
    if (sperre) return NEIN("invalid", sperre.text);
    if (!String(a.grund || "").trim()) return NEIN("invalid", "Bitte einen Grund wählen.");
    const m = a.teilstorno ? "positionen_stornieren" : "teilerstatten";
    return await methode(client, "PH Bestellung", name, m, { zeilen: zeilenPruefen(a.zeilen) || {}, versand_cent: Number(a.versand_cent) || 0, kulanz_cent: Number(a.kulanz_cent) || 0, grund: String(a.grund).slice(0, 140), art: a.art });
  },
  geprueft: async ({ client, session, name }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    return await workflow(client, "PH Bestellung", name, "Als geprüft übernehmen");
  },
  "risiko-geprueft": async ({ client, name, a, doctype }) => methode(client, doctype === "PH Zahlung" ? "PH Zahlung" : "PH Bestellung", name, "radar_geprueft", { notiz: String(a.notiz || "").slice(0, 200) }),
  "uebergabe-zuruecknehmen": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (String(a.grund || "").trim().length < 5) return NEIN("invalid", "Grund mit mindestens 5 Zeichen.");
    return await methode(client, "PH Bestellung", name, "abholung_zuruecknehmen", { grund: String(a.grund).slice(0, 200) });
  },
  rechnung: async ({ client, session, name }) => {
    const f = await faehigkeit(session, "shop.rechnung", { katalog: SHOP, client });
    if (!f.an) return NEIN("unavailable", "Noch nicht verfügbar – Rechnung in Faktura erstellen.");
    const b = await client.getDoc("PH Bestellung", name);
    if (!["versendet", "abgeholt", "abgeschlossen"].includes(b.status)) return NEIN("invalid", "Rechnung frühestens ab Versand oder Übergabe.");
    return await methode(client, "PH Bestellung", name, "rechnung_erstellen", {});
  },
  "steuerfall-geklaert": async ({ client, session, name }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    const b = await client.getDoc("PH Bestellung", name);
    await client.setValue("PH Bestellung", name, "notiz_intern", steuerfallVermerk(b.notiz_intern, session.name || session.user));
    if (typeof client.kommentar === "function") await client.kommentar("PH Bestellung", name, "Steuerfall geklärt – Packen frei", "Comment");
    return { ok: true };
  },
  // Zahlung
  rueckerstatten: async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    const z = await client.getDoc("PH Zahlung", name);
    if (["Bar", "Karte extern", "Stripe Terminal"].includes(z.kanal)) return NEIN("invalid", T.kassa.auszahlen);
    if (!String(a.grund || "").trim()) return NEIN("invalid", "Bitte einen Grund wählen.");
    const rest = Number(z.betrag_cent) - Number(z.erstattet_cent || 0);
    const betrag = Number(a.betrag_cent);
    if (!Number.isInteger(betrag) || betrag <= 0 || betrag > rest) return NEIN("invalid", `Betrag zwischen 0,01 € und ${cent(rest)}.`);
    return await methode(client, "PH Zahlung", name, "rueckerstatten", { betrag_cent: betrag, grund: String(a.grund).slice(0, 140) });
  },
  freigeben: async ({ client, session, name }) => {
    if (!istGF(session)) return NEIN("forbidden", T.nurGF);
    return await methode(client, "PH Zahlung", name, "erstattung_freigeben", {});
  },
  "freigabe-ablehnen": async ({ client, session, name, a }) => {
    if (!istGF(session)) return NEIN("forbidden", T.nurGF);
    if (String(a.grund || "").trim().length < 5) return NEIN("invalid", "Grund mit mindestens 5 Zeichen.");
    return await methode(client, "PH Zahlung", name, "erstattung_ablehnen", { grund: String(a.grund).slice(0, 200) });
  },
  "ankuendigung-stornieren": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (!String(a.grund || "").trim()) return NEIN("invalid", "Bitte einen Grund angeben.");
    return await methode(client, "PH Zahlung", name, "ankuendigung_stornieren", { grund: String(a.grund).slice(0, 200) });
  },
  "als-bezahlt": async ({ client, name }) => {
    const z = await client.getDoc("PH Zahlung", name);
    if (z.docstatus !== 0 || z.status !== "Angekuendigt") return NEIN("invalid", "Nur angekündigte, nicht gebuchte Zahlungen.");
    if (client.modus === "mock") {
      const zeile = client.tabelle("PH Zahlung").get(name);
      Object.assign(zeile, { status: "Bezahlt", docstatus: 1 });
      return { ok: true };
    }
    return await client.submit("PH Zahlung", name);
  },
  "auszahlung-zuordnen": async ({ client, name, a }) => methode(client, "PH Zahlung", name, "auszahlung_zuordnen", { auszahlung: String(a.auszahlung || "").slice(0, 80) }),
  // Gutschein
  "gutschein-sperren": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (!String(a.grund || "").trim()) return NEIN("invalid", "Bitte einen Grund angeben.");
    return await methode(client, "PH Gutschein", name, "sperren", { grund: String(a.grund).slice(0, 140), sperrgrund_art: T.gruende.sperren.includes(a.sperrgrund_art) ? a.sperrgrund_art : "Sonstiges" });
  },
  "gutschein-entsperren": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (!String(a.grund || "").trim()) return NEIN("invalid", "Bitte einen Grund angeben.");
    return await methode(client, "PH Gutschein", name, "entsperren", { grund: String(a.grund).slice(0, 140) });
  },
  "gutschein-ersetzen": async ({ client, session, name }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    return await methode(client, "PH Gutschein", name, "ersetzen", {});
  },
  "einloesung-zuruecknehmen": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (String(a.grund || "").trim().length < 5) return NEIN("invalid", "Grund mit mindestens 5 Zeichen.");
    return await aufruf(client, "ph_shop.api.backoffice.cancel_voucher_redemption", { gutschein: name, beleg_doctype: String(a.beleg_doctype || ""), beleg: String(a.beleg || ""), grund: String(a.grund).slice(0, 200) });
  },
  gueltigkeit: async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(a.gueltig_bis || ""))) return NEIN("invalid", "Datum im Format TT.MM.JJJJ.");
    return await client.setValue("PH Gutschein", name, "gueltig_bis", a.gueltig_bis);
  },
  "kauf-erstatten": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (!String(a.grund || "").trim()) return NEIN("invalid", "Bitte einen Grund angeben.");
    return await methode(client, "PH Gutschein Bestellung", name, "erstatten", { grund: String(a.grund).slice(0, 140), betrag_cent: Number(a.betrag_cent) || undefined });
  },
  // Anzahlung
  "doppelte-erstatten": async ({ client, session, name }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    return await methode(client, "PH Anzahlung", name, "doppelte_erstatten", {});
  },
  // Widerruf / Retoure
  "widerruf-erstatten": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    const w = await client.getDoc("PH Widerruf", name);
    if (!w.bestellung) return NEIN("invalid", "Erst einer Bestellung zuordnen.");
    if (w.status !== "Ware erhalten" && !a.nachweis) return NEIN("invalid", "Ware noch nicht da – Absendenachweis hochladen oder Eingang buchen.");
    const b = await client.getDoc("PH Bestellung", w.bestellung);
    const sperre = await geldSperre(client, session, b);
    if (sperre) return NEIN("invalid", sperre.text);
    const zeilen = zeilenPruefen(a.zeilen) || {};
    const zahlungen = await client.getList("PH Zahlung", { fields: ["name", "kanal", "art"], filters: [["bezug", "=", b.name], ["art", "=", "Eingang"]], limit: 20 });
    const voll = (b.positionen || []).every((p) => Number(zeilen[String(p.idx)] || 0) >= Number(p.menge) - Number(p.zurueck_menge || 0));
    // E10: Vollwiderruf + genau eine unbare Zahlung → PH Widerruf.erstatten; sonst positionsgenau über teilerstatten.
    if (voll && zahlungen.length === 1 && String(zahlungen[0].kanal).startsWith("Stripe")) {
      return await methode(client, "PH Widerruf", name, "erstatten", { betrag_cent: Number(a.betrag_cent) || undefined, grund: `Widerruf ${name}` });
    }
    const r = await methode(client, "PH Bestellung", b.name, "teilerstatten", { zeilen, versand_cent: Number(a.versand_cent) || 0, grund: `Widerruf ${name}`, art: "Teilerstattung" });
    if (typeof client.kommentar === "function") await client.kommentar("PH Widerruf", name, `Erstattung über die Bestellung ${b.name} gebucht`, "Comment");
    return { ...r, ueberBestellung: true };
  },
  "widerruf-ablehnen": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (String(a.grund || "").trim().length < 5) return NEIN("invalid", "Grund mit mindestens 5 Zeichen.");
    if (a.grundArt === "Frist überschritten" && !a.fristErlaubt) return NEIN("invalid", "„Frist überschritten“ nur mit bekannter Zustellung und nachweisbarer Belehrung.");
    return await methode(client, "PH Widerruf", name, "ablehnen", { grund: String(a.grund).slice(0, 500) });
  },
  zustelldatum: async ({ client, name }) => {
    const w = await client.getDoc("PH Widerruf", name);
    if (!w.bestellung) return NEIN("invalid", "Nicht zugeordnet.");
    const ls = await client.getList("PH Lieferschein", { fields: ["zugestellt_am"], filters: [["bestellung", "=", w.bestellung]], orderBy: "zugestellt_am desc", limit: 1 }).catch(() => []);
    const tag = String(ls[0]?.zugestellt_am || "").slice(0, 10);
    if (!tag) return NEIN("invalid", "Keine Zustellung in der Sendungsverfolgung.");
    return await client.setValue("PH Widerruf", name, "erhalten_am", tag);
  },
  "widerruf-zuordnen": async ({ client, name, a }) => {
    if (!gueltigerName(a.bestellung)) return NEIN("invalid", "Bestellung wählen.");
    await client.getDoc("PH Bestellung", a.bestellung);
    return await client.setValue("PH Widerruf", name, { bestellung: a.bestellung, zugeordnet: 1 });
  },
  "pruefung-abschliessen": async ({ client, session, name, a }) => {
    const r = await client.getDoc("PH Retoure", name);
    if (r.status !== "Eingegangen") return NEIN("invalid", "Erst den Eingang buchen.");
    const wm = Math.max(Number(a.wertminderung_cent) || 0, 0);
    if (wm > 0 && !a.belehrungBestaetigt) return NEIN("invalid", "Ohne Belehrung keine Wertminderung (§ 15 FAGG).");
    if (wm > 0 && !istLeitung(session)) return NEIN("forbidden", "Wertminderung setzt die Leitung.");
    const basis = (r.positionen || []).length ? Number(a.basis_cent || r.erstattungsbetrag_cent || 0) : Number(r.erstattungsbetrag_cent || 0);
    const betrag = Math.max(basis - wm, 0);
    // B3/A4: Betrag explizit speichern, bevor die Prüfung abgeschlossen wird.
    await client.setValue("PH Retoure", name, { wertminderung_cent: wm, erstattungsbetrag_cent: betrag });
    await methode(client, "PH Retoure", name, "pruefung_abschliessen", {});
    return { erstattungsbetrag_cent: betrag };
  },
  "retoure-erstatten": async ({ client, session, name }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    const r = await client.getDoc("PH Retoure", name);
    if (r.status !== "Geprueft") return NEIN("invalid", "Erst die Prüfung abschließen.");
    const b = await client.getDoc("PH Bestellung", r.bestellung);
    const sperre = await geldSperre(client, session, b);
    if (sperre) return NEIN("invalid", sperre.text);
    return await methode(client, "PH Retoure", name, "erstatten", { grund: `Retoure ${name}` });
  },
  "retoure-ablehnen": async ({ client, session, name, a }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    if (String(a.grund || "").trim().length < 5) return NEIN("invalid", "Grund mit mindestens 5 Zeichen.");
    return await methode(client, "PH Retoure", name, "ablehnen", { grund: String(a.grund).slice(0, 500) });
  },
  // Stripe
  "ereignis-erneut": async ({ client, session, name }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    const e = await client.getDoc("PH Stripe Ereignis", name);
    if (!["fehler", "ignoriert"].includes(e.status)) return NEIN("invalid", "Nur bei Fehler oder ignorierten Ereignissen.");
    return await methode(client, "PH Stripe Ereignis", name, "erneut_verarbeiten", {});
  },
  abgleichen: async ({ client, session, name }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    return await methode(client, "PH Stripe Auszahlung", name, "abgleichen", {});
  },
  "schluessel-pruefen": async ({ client, session }) => {
    if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
    return await methode(client, "PH Stripe Einstellungen", "PH Stripe Einstellungen", "pruefen", {});
  },
};

async function geldSperre(client, session, b) {
  const [zahlungen, rechnungen, gs] = await Promise.all([
    client.getList("PH Zahlung", { fields: ["name", "kanal", "art"], filters: [["bezug", "=", b.name]], limit: 50 }).catch(() => []),
    client.getList("PH Rechnung", { fields: ["name", "status", "docstatus"], filters: [["bestellung", "=", b.name]], limit: 5 }).catch(() => []),
    faehigkeit(session, "shop.gutschrift", { katalog: SHOP, client }),
  ]);
  return erstattungGesperrt(b, { zahlungen, rechnungen, gutschriftHook: gs.an });
}

/**
 * Sofort-, Geld- und Bestätigungsaktionen (Dialog davor). Idempotent über `idempotency`.
 * @param {{aktion:string, name:string, doctype?:string, args?:object, idempotency?:string}} p
 */
export async function aktionAction({ aktion, name, doctype, args = {}, idempotency } = {}) {
  const { session, client, nein } = await sitzung({ schreiben: !["freigeben", "freigabe-ablehnen"].includes(aktion) });
  if (nein) return nein;
  const fn = SOFORT[aktion];
  if (!fn || (aktion !== "schluessel-pruefen" && !gueltigerName(name))) return NEIN("invalid", "Unvollständige Angaben.");
  return einmal(idempotency ? `${session.user}:${aktion}:${name}:${idempotency}` : null, async () => {
    try {
      const r = await fn({ client, session, name, doctype, a: args || {} });
      if (r && r.ok === false) return r;
      aktualisiere();
      return { ok: true, ergebnis: r ?? null };
    } catch (err) {
      return fehler(err);
    }
  });
}

/** Mehrere Sofort-Aktionen nacheinander (Erneut verarbeiten, Abgleichen, Sammel-Storno S8). */
export async function massenAktionAction({ aktion, namen = [], args = {} } = {}) {
  if (!Array.isArray(namen) || namen.length > 50 || !SOFORT[aktion]) return NEIN("invalid", "Unvollständige Angaben.");
  const ergebnisse = [];
  for (const name of namen) ergebnisse.push({ name, ...(await aktionAction({ aktion, name, args })) });
  return { ok: true, ergebnisse };
}

// ------------------------------------------------------------------ Lesend --

/** Erstattungsvorschau (S3/S9, lesend). */
export async function erstattungVorschauAction({ name, zeilen, versand_cent = 0, kulanz_cent = 0 } = {}) {
  const { client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  if (!gueltigerName(name)) return NEIN("invalid", "Unvollständige Angaben.");
  try {
    return { ok: true, ergebnis: await methode(client, "PH Bestellung", name, "erstattung_vorschau", { zeilen: zeilenPruefen(zeilen) || {}, versand_cent: Number(versand_cent) || 0, kulanz_cent: Number(kulanz_cent) || 0 }) };
  } catch (err) {
    return fehler(err);
  }
}

/** Gutschein prüfen (S2), Rate-Limit 10/min je Sitzung. Code nie im Log, Antwort ohne Klartext. */
export async function gutscheinPruefenAction({ code } = {}) {
  const { session, client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  G.__phShopRate ||= new Map();
  const k = session.user;
  const jetzt = Date.now();
  const liste = (G.__phShopRate.get(k) || []).filter((t) => jetzt - t < 60_000);
  if (liste.length >= 10) return NEIN("rate_limited", "Zu viele Prüfungen – bitte eine Minute warten.");
  G.__phShopRate.set(k, [...liste, jetzt]);
  const c = String(code || "").replace(/[\s-]/g, "").toUpperCase();
  if (c.length < 4 || c.length > 40) return NEIN("invalid", "Code unvollständig.");
  try {
    const r = await aufruf(client, "ph_shop.api.backoffice.check_voucher", { code: c });
    if (!r?.ok) return NEIN("invalid", `Gutschein ${r?.fehler || "nicht gefunden"}.`);
    return { ok: true, ergebnis: { name: r.name, rest_cent: r.rest_cent, wert_cent: r.wert_cent, art: r.art, gueltig_bis: r.gueltig_bis, test: r.test, letzte4: r.code_letzte4 } };
  } catch (err) {
    return fehler(err);
  }
}

/** Produktsuche (ph_sortiment, nur aktive Produkte mit Preis). */
export async function produktSucheAction({ q } = {}) {
  const { client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  const t = String(q || "").trim().slice(0, 60);
  try {
    const orFilters = t ? [["titel", "like", `%${t}%`], ["marke", "like", `%${t}%`], ["ean", "like", `%${t}%`], ["hersteller_artikelnr", "like", `%${t}%`]] : undefined;
    const zeilen = await client.getList("PH Produkt", { fields: ["name", "titel", "marke", "ean", "aktueller_preis_cent", "preisart", "bild_hauptbild", "slug", "status"], filters: [["status", "in", ["Aktiv", "Geprueft"]]], orFilters, limit: 8 });
    return { ok: true, ergebnis: zeilen.map((p) => ({ name: p.name, titel: p.titel || p.name, marke: p.marke || "", ean: p.ean || "", preis_cent: Number(p.aktueller_preis_cent) || 0, aufAnfrage: !Number(p.aktueller_preis_cent) || p.preisart === "Auf Anfrage", bild: typeof p.bild_hauptbild === "string" && p.bild_hauptbild.startsWith("/") ? p.bild_hauptbild : "", slug: p.slug || "" })) };
  } catch (err) {
    return fehler(err);
  }
}

/** Kontaktsuche (ph_crm). */
export async function kontaktSucheAction({ q } = {}) {
  const { client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  const t = String(q || "").trim().slice(0, 60);
  if (t.length < 2) return { ok: true, ergebnis: [] };
  try {
    const zeilen = await client.getList("PH Kontakt", { fields: ["name", "vorname", "nachname", "firma", "email", "telefon", "ort", "plz", "strasse"], orFilters: [["nachname", "like", `%${t}%`], ["vorname", "like", `%${t}%`], ["email", "like", `%${t}%`], ["firma", "like", `%${t}%`], ["telefon", "like", `%${t}%`]], limit: 6 });
    return { ok: true, ergebnis: zeilen.map((k) => ({ name: k.name, anzeige: [k.vorname, k.nachname].filter(Boolean).join(" ") || k.firma || k.name, email: k.email || "", telefon: k.telefon || "", ort: k.ort || "", plz: k.plz || "", strasse: k.strasse || "" })) };
  } catch (err) {
    return fehler(err);
  }
}

/** Bestellsuche (Zahlung erfassen ab Liste, Gutschein anrechnen): nur offene Beträge. */
export async function bestellSucheAction({ q } = {}) {
  const { client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  const t = String(q || "").trim().slice(0, 60);
  try {
    const zeilen = await client.getList("PH Bestellung", { fields: ["name", "kunde_name", "gesamt_cent", "offen_cent", "betrag_bezahlt_cent", "status"], filters: [["status", "in", ["offen", "reserviert", "abholbereit"]]], orFilters: t ? [["name", "like", `%${t}%`], ["kunde_name", "like", `%${t}%`]] : undefined, limit: 8 });
    return { ok: true, ergebnis: zeilen.filter((b) => offen(b) > 0).map((b) => ({ name: b.name, kunde: b.kunde_name, offen_cent: offen(b), status: b.status })) };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Anlegen --

/**
 * Telefonbestellung / Showroom-Reservierung (§ 4.3). Immer senden=0; Mail bzw. Zahlungslink als Undo-Commit danach.
 */
export async function bestellungAnlegenAction({ modus, kunde, positionen, lieferart, adresse, versand_cent, notiz_kunde, notiz_intern, idempotency } = {}) {
  const { session, client, nein } = await sitzung();
  if (nein) return nein;
  const showroom = modus === "showroom";
  const k = kunde || {};
  const fehlerFeld = {};
  if (!String(k.name || "").trim()) fehlerFeld.kunde = "Kunde wählen oder anlegen.";
  const tipp = emailTipp(k.email);
  if (!k.email) fehlerFeld.email = T.dialoge.ohneEmailFehler;
  else if (!tipp.gueltig) fehlerFeld.email = tipp.fehler;
  const pos = Array.isArray(positionen) ? positionen.slice(0, 30) : [];
  if (!pos.length) fehlerFeld.positionen = "Mindestens ein Produkt wählen.";
  const la = showroom ? "abholung" : lieferart === "abholung" ? "abholung" : "versand";
  if (la === "versand" && (!adresse?.strasse || !adresse?.plz || !adresse?.ort)) fehlerFeld.adresse = "Lieferadresse vollständig angeben.";
  if (la === "versand" && adresse?.land === "CH") fehlerFeld.adresse = "Versand in die Schweiz wird nicht angeboten – Abholung möglich.";
  if (Object.keys(fehlerFeld).length) return { ok: false, code: "invalid", message: "Bitte die markierten Felder prüfen.", fehler: fehlerFeld };
  return einmal(idempotency ? `${session.user}:neu:${idempotency}` : null, async () => {
    try {
      // Preis = Sortimentspreis; nur die Leitung ändert ihn (serverseitig erneut gelesen).
      const leitung = istLeitung(session);
      const geprueft = [];
      for (const p of pos) {
        const menge = Math.max(Math.min(Number(p.menge) || 1, 99), 1);
        let preis = Number(p.einzel_cent) || 0;
        let bez = String(p.bezeichnung || "").slice(0, 140);
        if (p.produkt) {
          const prod = await client.getDoc("PH Produkt", p.produkt).catch(() => null);
          if (prod) {
            if (!leitung || !preis) preis = Number(prod.aktueller_preis_cent) || 0;
            bez = prod.titel || bez;
          }
        }
        if (preis <= 0) return NEIN("invalid", "Preis auf Anfrage – Leitung fragen.");
        geprueft.push({ produkt: p.produkt || "", bezeichnung: bez, marke: String(p.marke || "").slice(0, 60), menge, einzel_cent: preis, bild: typeof p.bild === "string" && p.bild.startsWith("/") ? p.bild : "", slug: String(p.slug || "").slice(0, 80) });
      }
      const r = await aufruf(client, "ph_shop.api.backoffice.create_phone_order", {
        kunde: { name: String(k.name).slice(0, 120), email: String(k.email).trim().slice(0, 140), telefon: String(k.telefon || "").slice(0, 40) },
        positionen: geprueft, lieferart: la, adresse: la === "versand" ? { strasse: adresse.strasse, hausnr: adresse.hausnr || "", plz: adresse.plz, ort: adresse.ort, land: adresse.land || "AT" } : null,
        versand_cent: la === "versand" ? Math.max(Number(versand_cent) || 0, 0) : 0, notiz_kunde: String(notiz_kunde || "").slice(0, 500), kontakt: k.kontakt || undefined,
        bestellart: showroom ? "Showroom" : "Telefon", zahlungslink: showroom ? 0 : 1, senden: 0, sprache: "de", idempotency_key: idempotency ? `shop:neu:${idempotency}` : undefined,
      });
      const name = r?.name || r;
      if (notiz_intern) await client.setValue("PH Bestellung", name, "notiz_intern", String(notiz_intern).slice(0, 1000)).catch(() => {});
      const b = await client.getDoc("PH Bestellung", name);
      const plan = await plane(session, {
        action: "shop.methode",
        args: { doctype: "PH Bestellung", name, methode: showroom ? "bestaetigung_senden" : "zahlungslink_senden", args: {}, pfad: pfadFuer("PH Bestellung", name) },
        schluessel: `neu-senden:${name}`,
        objekt: { doctype: "PH Bestellung", name },
        titel: showroom ? `Reservierungsbestätigung ${name}` : `Zahlungslink ${name}`,
      });
      aktualisiere();
      return { ok: true, ergebnis: { name, gesamt_cent: b.gesamt_cent }, commit: plan.ok ? { token: plan.token, ms: plan.ms, objekt: plan.objekt, text: showroom ? T.toast.reservierung(mailKurz(b.kunde_email)) : T.toast.zahlungslink(cent(b.gesamt_cent), mailKurz(b.kunde_email)) } : null };
    } catch (err) {
      return fehler(err);
    }
  });
}

/** Gutschein ohne Verkauf (S5, Leitung): Art fest Mehrzweck, Grund Pflicht. Code nur in dieser Antwort. */
export async function gutscheinOhneVerkaufAction({ wert_cent, grund, motiv, empfaenger, grusstext, kaeufer_name, kaeufer_email, senden_an, test, idempotency } = {}) {
  const { session, client, nein } = await sitzung();
  if (nein) return nein;
  if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitungVerkauf);
  const w = Number(wert_cent);
  if (!Number.isInteger(w) || w <= 0) return { ok: false, code: "invalid", message: "Wert wählen.", fehler: { wert: "Wert wählen." } };
  if (!String(grund || "").trim()) return { ok: false, code: "invalid", message: "Grund angeben.", fehler: { grund: "Grund angeben." } };
  return einmal(idempotency ? `${session.user}:s5:${idempotency}` : null, async () => {
    try {
      const r = await aufruf(client, "ph_shop.api.backoffice.issue_voucher", { wert_cent: w, art: "Mehrzweck", motiv: ["schlicht", "seelicht", "geweih"].includes(motiv) ? motiv : "schlicht", empfaenger: String(empfaenger || "").slice(0, 80), grusstext: String(grusstext || "").slice(0, 300), kaeufer_name: String(kaeufer_name || "").slice(0, 120), kaeufer_email: String(kaeufer_email || "").slice(0, 140), grund: String(grund).slice(0, 140), senden_an: String(senden_an || "").slice(0, 140) || undefined, test: test ? 1 : 0, idempotency_key: idempotency ? `shop:s5:${idempotency}` : undefined });
      aktualisiere();
      return { ok: true, ergebnis: r };
    } catch (err) {
      return fehler(err);
    }
  });
}

// ------------------------------------------------------------------ Feldwerte --

const FELDER = {
  "PH Bestellung": ["zugewiesen_an", "notiz_intern", "abholung_bis"],
  "PH Zahlung": ["notiz"],
  "PH Stripe Auszahlung": ["hinweis", "datum_bank"],
  "PH Anzahlung": ["link_gueltig_bis"],
  "PH Widerruf": ["notiz_intern"],
  "PH Retoure": ["hinweis"],
  "PH Gutschein": ["empfaenger", "grusstext", "motiv"],
};

/** Feldwert sofort speichern (Klasse Feldwert, Variante B). Rückgabe alter Wert für „Rückgängig“. */
export async function feldwertAction({ doctype, name, feld, wert } = {}) {
  const { session, client, nein } = await sitzung();
  if (nein) return nein;
  if (!FELDER[doctype]?.includes(feld) || !gueltigerName(name)) return NEIN("invalid", "Dieses Feld ist hier nicht änderbar.");
  try {
    const alt = await client.getDoc(doctype, name);
    if (doctype === "PH Bestellung" && feld === "abholung_bis" && !["reserviert", "abholbereit"].includes(alt.status)) return NEIN("invalid", "Abholfrist nur bei Reservierung oder Abholbereit.");
    if (doctype === "PH Anzahlung" && !["offen", "fehlgeschlagen"].includes(alt.status)) return NEIN("invalid", "Nur solange die Anzahlung offen ist.");
    if (doctype === "PH Gutschein" && alt.pdf) return NEIN("invalid", "Die PDF ist schon erzeugt – Motiv und Text sind fest.");
    if (doctype === "PH Bestellung" && feld === "zugewiesen_an" && wert && !/^[^@\s]+@[^@\s]+$/.test(String(wert))) return NEIN("invalid", "Person wählen.");
    void session;
    await client.setValue(doctype, name, feld, wert === null ? "" : String(wert).slice(0, 2000));
    aktualisiere();
    return { ok: true, ergebnis: { alt: alt[feld] ?? "" } };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Einstellungen --

const EINST_FELDER = {
  shop: ["testmodus_mail_an", "abholung_frist_tage", "reservierung_frist_tage", "auto_abschliessen_tage", "zahlungslink_gueltig_stunden", "versand_pauschale_at_cent", "versand_pauschale_de_cent", "versand_frei_ab_cent", "oss_aktiv", "gutschein_gueltig_jahre", "gutschein_min_cent", "gutschein_max_cent", "rechtstexte_status"],
  stripe: ["vier_augen_ab_cent", "auszahlung_abgleich_tage", "simulation", "testmodus"],
};

/** Einstellungen speichern (⌘S). `shop_modus` nie enthalten (E18). */
export async function einstellungenSpeichernAction({ art, werte } = {}) {
  const { session, client, nein } = await sitzung();
  if (nein) return nein;
  if (!istLeitung(session) || !darfEinstellungen(session)) return NEIN("forbidden", T.nurLeitung);
  const erlaubt = EINST_FELDER[art];
  if (!erlaubt || !werte || typeof werte !== "object") return NEIN("invalid", "Unvollständige Angaben.");
  const dt = art === "stripe" ? "PH Stripe Einstellungen" : "PH Shop Einstellungen";
  const sauber = {};
  for (const [k, v] of Object.entries(werte)) if (erlaubt.includes(k)) sauber[k] = v;
  if ("auto_abschliessen_tage" in sauber) {
    const t = Number(sauber.auto_abschliessen_tage);
    if (t !== 0 && t < 28) return { ok: false, code: "invalid", message: "Bitte prüfen.", fehler: { auto_abschliessen_tage: "Mindestens 28 Tage plus Laufzeit (0 = aus)." } };
  }
  if ("rechtstexte_status" in sauber && !["kanzlei-offen", "entwurf", "freigegeben"].includes(sauber.rechtstexte_status)) return NEIN("invalid", "Unbekannter Stand.");
  try {
    const alt = await client.getDoc(dt, dt);
    if (client.modus === "mock") Object.assign(client.tabelle(dt).get(dt), sauber);
    else await client.save(dt, { name: dt, ...sauber }, { modified: alt.modified });
    aktualisiere("/shop/einstellungen");
    return { ok: true, ergebnis: { alt: Object.fromEntries(Object.keys(sauber).map((k) => [k, alt[k]])) } };
  } catch (err) {
    return fehler(err);
  }
}

/** Live schalten bzw. zurück auf Test (Undo 8 s). */
export async function shopModusAction({ ziel } = {}) {
  const { session, client, nein } = await sitzung();
  if (nein) return nein;
  if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
  try {
    if (ziel === "live") {
      const liste = await prueflisteFuer(client);
      const offenP = liste.filter((x) => !x.ok);
      if (offenP.length) return NEIN("invalid", `Prüfliste offen: ${offenP.map((x) => x.titel).join(", ")}.`);
      if (client.modus === "mock") client.tabelle("PH Shop Einstellungen").get("PH Shop Einstellungen").shop_modus = "live";
      else await client.setValue("PH Shop Einstellungen", "PH Shop Einstellungen", "shop_modus", "live");
      aktualisiere("/shop/einstellungen");
      return { ok: true };
    }
    if (ziel === "test") {
      const r = await plane(session, { action: "shop.modus-test", args: { doctype: "PH Shop Einstellungen", name: "PH Shop Einstellungen" }, schluessel: "modus-test", objekt: { doctype: "PH Shop Einstellungen", name: "PH Shop Einstellungen" }, titel: "Zurück auf Test" });
      return r.ok ? { ...r, text: T.toast.modusTest } : r;
    }
    return NEIN("invalid", "Unbekanntes Ziel.");
  } catch (err) {
    return fehler(err);
  }
}

/** StB-Freigabe der USt-Regeln als Kommentar (bis A15). */
export async function ustFreigabeAction({ datum, kanzlei } = {}) {
  const { session, client, nein } = await sitzung();
  if (nein) return nein;
  if (!istLeitung(session)) return NEIN("forbidden", T.nurLeitung);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(datum || "")) || String(kanzlei || "").trim().length < 3) return NEIN("invalid", "Datum und Kanzlei angeben.");
  try {
    await client.kommentar("PH Shop Einstellungen", "PH Shop Einstellungen", `USt-Freigabe Steuerberater: ${String(kanzlei).slice(0, 120)} am ${datum.split("-").reverse().join(".")}`, "Comment");
    aktualisiere("/shop/einstellungen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Absendenachweis (PDF/JPG ≤ 10 MB) an den Widerruf. */
export async function nachweisHochladenAction(formData) {
  const { client, nein } = await sitzung();
  if (nein) return nein;
  const name = String(formData?.get?.("widerruf") || "");
  const datei = formData?.get?.("datei");
  if (!gueltigerName(name) || !datei || typeof datei.arrayBuffer !== "function") return NEIN("invalid", "Datei wählen.");
  if (datei.size > 10 * 1024 * 1024) return NEIN("invalid", "Datei zu groß (max. 10 MB).");
  if (!/\.(pdf|jpe?g)$/i.test(datei.name || "") || !/^(application\/pdf|image\/jpeg)$/.test(datei.type || "")) return NEIN("invalid", "Nur PDF oder JPG.");
  try {
    const inhalt = new Uint8Array(await datei.arrayBuffer());
    await client.uploadFile({ doctype: "PH Widerruf", name, dateiname: String(datei.name).slice(0, 120), inhalt, privat: true });
    await client.kommentar("PH Widerruf", name, `Absendenachweis vom ${new Date().toLocaleDateString("de-AT")}`, "Comment");
    aktualisiere();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ Packtisch (Abholung) --

/** Abholcode nachschlagen (§ 9.2, `api.get_pickup_status`). */
export async function abholungSuchenAction({ code } = {}) {
  const { client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  const c = String(code || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (c.length !== 6) return NEIN("invalid", "Abholcode hat 6 Zeichen.");
  try {
    const r = await aufruf(client, "ph_shop.api.get_pickup_status", { code: c });
    if (!r?.gefunden) return NEIN("not_found", "Kein Abholcode gefunden.");
    return { ok: true, ergebnis: r };
  } catch (err) {
    return fehler(err);
  }
}

/** Abholung ohne Code: Name oder Bestellnummer (nur abholbereite). */
export async function abholungOhneCodeAction({ q } = {}) {
  const { client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  const t = String(q || "").trim().slice(0, 60);
  if (t.length < 2) return { ok: true, ergebnis: [] };
  try {
    const zeilen = await client.getList("PH Bestellung", { fields: ["name", "kunde_name", "status", "gesamt_cent", "betrag_bezahlt_cent", "offen_cent", "abholung_bis"], filters: [["status", "=", "abholbereit"]], orFilters: [["name", "like", `%${t}%`], ["kunde_name", "like", `%${t}%`]], limit: 8 });
    return { ok: true, ergebnis: zeilen.map((b) => ({ name: b.name, kunde_name: b.kunde_name, offen_cent: offen(b), abholung_bis: b.abholung_bis })) };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------ CSV --

const CSV_FELDER = {
  bestellungen: ["name", "angelegt", "kunde_name", "kunde_email", "status", "lieferart", "bestellart", "gesamt_cent", "betrag_bezahlt_cent", "offen_cent", "adresse_land"],
  zahlungen: ["name", "zeitpunkt", "art", "kanal", "status", "betrag_cent", "erstattet_cent", "bezug_doctype", "bezug", "stripe_auszahlung"],
  gutscheine: ["name", "code_letzte4", "status", "wert_cent", "rest_cent", "kanal_ausgabe", "ausgegeben_am", "gueltig_bis"],
  kaeufe: ["name", "erstellt", "kaeufer_name", "anzahl", "betrag_cent", "summe_cent", "status"],
  widerrufe: ["name", "eingegangen_am", "kanal", "kunde_name", "bestellung", "status", "erstattung_bis", "erstattungsbetrag_cent"],
  retouren: ["name", "angekuendigt_am", "bestellung", "widerruf", "weg", "status", "erstattungsbetrag_cent", "wertminderung_cent"],
  anzahlungen: ["name", "erstellt", "auftrag_referenz", "betrag_cent", "status", "link_gueltig_bis", "bezahlt_am"],
  ereignisse: ["name", "empfangen_am", "typ", "status", "bezug", "versuche"],
  auszahlungen: ["name", "datum_erwartet", "status", "betrag_cent", "brutto_cent", "gebuehren_cent", "differenz_cent"],
};

/** CSV der gefilterten Liste (nur mit Export-Recht; keine Codes, kein ip_hash). Beträge in Euro. */
export async function csvAction({ liste, params = {} } = {}) {
  const { session, client, nein } = await sitzung({ schreiben: false });
  if (nein) return nein;
  const { darf } = await import("../auth/rechte.js");
  const { LISTEN, wendeAn } = await import("./ansichten.js");
  if (!darf(session, "shop", "export") && !istGF(session)) return NEIN("forbidden", "Kein Export-Recht.");
  const def = LISTEN[liste];
  const felder = CSV_FELDER[liste];
  if (!def || !felder) return NEIN("invalid", "Unbekannte Liste.");
  try {
    const roh = await client.getList(def.doctype, { fields: ["*"], limit: 2000 });
    const p = Object.fromEntries(Object.entries(params || {}).map(([k, v]) => [k, String(v)]));
    const r = wendeAn(liste, roh, { ...p, seite: "1", groesse: "100" }, { leitung: istLeitung(session), user: session.user });
    const zelle = (k, v) => {
      let t = v === null || v === undefined ? "" : k.endsWith("_cent") ? (Number(v) / 100).toFixed(2).replace(".", ",") : String(v);
      if (/^[=+\-@]/.test(t) && !k.endsWith("_cent")) t = `'${t}`;
      return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const kopf = felder.map((f) => f.replace(/_cent$/, " (EUR)")).join(";");
    const text = [kopf, ...r.alleGefiltert.map((d) => felder.map((f) => zelle(f, d[f])).join(";"))].join("\n");
    console.info("[shop] CSV-Export", liste, r.alleGefiltert.length, "Zeilen");
    return { ok: true, ergebnis: text };
  } catch (err) {
    return fehler(err);
  }
}
