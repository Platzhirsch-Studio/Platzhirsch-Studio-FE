// Aktionen der Bestellungsakte: Primär / Sekundär / Menü „⋯“ je Status × Zahlungsweg × Geld (10-konzept-shop § 5.1,
// § 6.3 Aktionsmatrix) und Bänder im Kopf (§ 5.1 „Bänder“). Eine Funktion, parametrisiert getestet. Rein.
// Ergebnis nur Daten (IDs, Texte, Sperrgründe) – die Oberfläche ordnet jeder ID genau ein Muster zu.

import { offen, erstattungGesperrt, fremdwaehrung, offeneErstattung } from "./geld.js";
import { risikoOffen, streitOffen, risikoStufe, statusInfo } from "./status.js";
import { steuerfallOffen } from "./naechsterSchritt.js";
import { abschliessenAb, heute as heuteIso, tageBis, tagVon } from "./fristen.js";
import { T } from "./texte.js";

/**
 * Katalog: id → { titel, icon, klasse, leitung?, gefaehrlich? }.
 * Klassen (§ 3.2): undo · feldwert · geld · bestaetigung · zweiklick · sofort · dialog · link · kassa
 */
export const AKTIONEN = Object.freeze({
  packen: { titel: "Packen", icon: "Package", klasse: "undo", methode: "packen" },
  abholbereit: { titel: "Abholbereit melden", icon: "ShoppingBag", klasse: "undo", methode: "abholbereit_melden" },
  uebergeben: { titel: "Übergeben", icon: "CheckCheck", klasse: "undo", methode: "abgeholt_melden" },
  "direkt-uebergeben": { titel: "Direkt übergeben", icon: "CheckCheck", klasse: "bestaetigung" },
  versendet: { titel: "Versendet melden", icon: "Truck", klasse: "dialog", methode: "versendet_melden" },
  abschliessen: { titel: "Abschließen", icon: "Check", klasse: "undo", methode: "abschliessen" },
  "abschliessen-jetzt": { titel: "Jetzt abschließen", icon: "Check", klasse: "undo", methode: "abschliessen" },
  bestaetigung: { titel: "Bestellbestätigung senden", icon: "Mail", klasse: "undo", methode: "bestaetigung_senden" },
  "zahlungslink-senden": { titel: "Zahlungslink erneut senden", icon: "Mail", klasse: "undo", methode: "zahlungslink_senden" },
  "zahlungslink-neu": { titel: "Neuen Zahlungslink senden", icon: "Mail", klasse: "undo", methode: "zahlungslink_erstellen" },
  abholcode: { titel: "Abholcode erneut senden", icon: "Mail", klasse: "undo", methode: "abholcode_erneut_senden" },
  "zahlung-erfassen": { titel: "Überweisung erfassen", icon: "Banknote", klasse: "geld" },
  "gutschein-einloesen": { titel: "Gutschein einlösen", icon: "Ticket", klasse: "geld" },
  stornieren: { titel: "Stornieren & erstatten", icon: "CircleSlash", klasse: "geld", leitung: true, gefaehrlich: true },
  "stornieren-ohne": { titel: "Stornieren", icon: "CircleSlash", klasse: "bestaetigung", leitung: true, gefaehrlich: true },
  erstatten: { titel: "Erstatten …", icon: "Undo2", klasse: "geld", leitung: true },
  teilstorno: { titel: "Teilstorno …", icon: "Minus", klasse: "dialog" },
  ersatz: { titel: "Ersatz liefern", icon: "RotateCcw", klasse: "dialog" },
  "widerruf-erfassen": { titel: "Widerruf erfassen", icon: "Undo2", klasse: "dialog" },
  reklamation: { titel: "Reklamation an Service", icon: "Wrench", klasse: "link" },
  rechnung: { titel: "Rechnung erstellen …", icon: "FileText", klasse: "bestaetigung" },
  geprueft: { titel: "Als geprüft übernehmen", icon: "BadgeCheck", klasse: "dialog", leitung: true },
  "zurueck-offen": { titel: "Zurück auf Offen", icon: "RotateCcw", klasse: "undo", leitung: true },
  "risiko-geprueft": { titel: "Risiko geprüft", icon: "ShieldAlert", klasse: "feldwert" },
  "uebergabe-zuruecknehmen": { titel: "Übergabe zurücknehmen", icon: "Undo2", klasse: "bestaetigung", leitung: true },
  "an-die-kassa": { titel: "An der Kassa kassieren", icon: "Receipt", klasse: "kassa" },
  "kunde-informieren": { titel: "Kunde informieren: Ware liegt bereit", icon: "Mail", klasse: "link" },
  "stripe-oeffnen": { titel: "Im Stripe-Dashboard öffnen", icon: "ArrowUpRight", klasse: "link" },
  "steuerfall-geklaert": { titel: "Steuerfall geklärt", icon: "Check", klasse: "feldwert", leitung: true },
  email: { titel: "E-Mail schreiben", icon: "Mail", klasse: "link" },
  drucken: { titel: "Drucken", icon: "Printer", klasse: "link" },
  kundenakte: { titel: "Kundenakte", icon: "User", klasse: "link" },
  "zahlung-oeffnen": { titel: "Zahlung öffnen", icon: "Wallet", klasse: "link" },
});

const STORNO_ERLAUBT = new Set(["offen", "zahlung_ausstehend", "reserviert", "bezahlt", "versandbereit", "abholbereit", "pruefen", "fehlgeschlagen", "checkout_fehler"]);

/** Darf aus diesem Status storniert werden (E7)? */
export function stornoErlaubt(status) {
  return STORNO_ERLAUBT.has(status);
}

function a(id, extra = {}) {
  const k = AKTIONEN[id];
  return { id, titel: k.titel, icon: k.icon, klasse: k.klasse, leitung: !!k.leitung, gefaehrlich: !!k.gefaehrlich, ...extra };
}

/**
 * Aktionen einer Bestellung.
 * @param {object} b  Bestellung
 * @param {{leitung?:boolean, zahlungen?:object[], rechnungen?:object[], lieferscheine?:object[], heute?:string,
 *   faehigkeiten?:Record<string, boolean>, schreiben?:boolean}} ctx
 * @returns {{primaer:object|null, sekundaer:object[], menue:object[]}}
 */
export function bestellAktionen(b, ctx = {}) {
  const leitung = !!ctx.leitung;
  const f = ctx.faehigkeiten || {};
  const h = ctx.heute || heuteIso();
  const o = offen(b);
  const s = b.status;
  const telefon = b.bestellart === "Telefon";
  const fremd = fremdwaehrung(b);
  const sperre = erstattungGesperrt(b, { zahlungen: ctx.zahlungen || [], rechnungen: ctx.rechnungen || [], gutschriftHook: !!f.gutschrift });
  const geldGrund = fremd ? T.baender.fremd : null;

  let primaer = null;
  const sek = [];
  const menue = [];

  const nurLeitung = (x) => (leitung ? x : { ...x, deaktiviert: true, grund: T.nurLeitung });
  const storno = () => {
    if (!stornoErlaubt(s)) return null;
    const bezahlt = Number(b.betrag_bezahlt_cent || 0) > 0;
    const x = a(bezahlt ? "stornieren" : "stornieren-ohne");
    if (bezahlt && sperre) return nurLeitung({ ...x, deaktiviert: true, grund: sperre.text, sperre: sperre.code });
    return nurLeitung(x);
  };
  const geld = (id, extra = {}) => (geldGrund ? a(id, { deaktiviert: true, grund: geldGrund, ...extra }) : a(id, extra));
  const ab = abschliessenAb(b, ctx.lieferscheine || []);
  const abschliessenFrei = !ab || tageBis(ab, h) >= 0;

  switch (s) {
    case "offen":
      if (telefon) {
        primaer = a("zahlungslink-senden");
        sek.push(geld("zahlung-erfassen"), geld("gutschein-einloesen"));
        menue.push(a("teilstorno"));
      } else {
        sek.push(a("zahlungslink-neu"));
      }
      break;
    case "zahlung_ausstehend":
      sek.push(a("stripe-oeffnen", { deaktiviert: !b.payment_intent, grund: b.payment_intent ? undefined : "Keine Stripe-Zahlung hinterlegt" }));
      menue.push(nurLeitung(a("zahlung-erfassen", { titel: "Zahlung erfassen", hinweis: "Stripe-Zahlung angekündigt – doppelte Buchung möglich" })));
      break;
    case "reserviert":
      if (o > 0) {
        primaer = a("an-die-kassa");
        sek.push(geld("zahlung-erfassen"), geld("gutschein-einloesen"), a("kunde-informieren"));
        menue.push(a("teilstorno"));
      } else primaer = a("abholbereit");
      break;
    case "bezahlt":
      if (b.lieferart === "versand") {
        const steuer = steuerfallOffen(b);
        primaer = steuer && !leitung ? a("packen", { deaktiviert: true, grund: "Steuerfall klären (Leitung)" }) : a("packen");
        sek.push(a("versendet", { titel: "Versendet melden (ohne Lieferschein)" }));
        if (steuer) menue.push(nurLeitung(a("steuerfall-geklaert")));
      } else {
        primaer = a("abholbereit");
        sek.push(a("direkt-uebergeben"));
      }
      menue.push(a("ersatz"));
      break;
    case "versandbereit":
      primaer = a("versendet");
      break;
    case "abholbereit":
      if (o > 0) {
        primaer = a("an-die-kassa");
        sek.push(geld("gutschein-einloesen"));
      } else {
        primaer = a("uebergeben");
        sek.push(a("abholcode"));
      }
      break;
    case "versendet":
    case "abgeholt":
      primaer = abschliessenFrei ? a("abschliessen") : null;
      sek.push(rechnungAktion(b, f), a("widerruf-erfassen"));
      if (!abschliessenFrei) menue.push(a("abschliessen-jetzt", { hinweis: `Widerrufsfrist läuft bis ${datumKurz(ab)}` }));
      menue.push(a("ersatz"), a("reklamation"), nurLeitung(a("erstatten", { titel: "Teilerstattung / Kulanz …" })));
      if (s === "abgeholt") menue.push(nurLeitung(a("uebergabe-zuruecknehmen")));
      break;
    case "abgeschlossen":
      if ((b.rechnung_uid || Number(b.rechnungswunsch) === 1) && !(ctx.rechnungen || []).length) sek.push(rechnungAktion(b, f));
      menue.push(a("widerruf-erfassen"), a("reklamation"), nurLeitung(a("erstatten", { titel: "Kulanz …" })));
      break;
    case "pruefen":
      primaer = nurLeitung(a("geprueft"));
      menue.push(a("zahlung-oeffnen"), a("stripe-oeffnen", { deaktiviert: !b.payment_intent, grund: b.payment_intent ? undefined : "Keine Stripe-Zahlung hinterlegt" }));
      break;
    case "fehlgeschlagen":
    case "checkout_fehler":
    case "abgelaufen":
      primaer = nurLeitung(a("zurueck-offen"));
      if (telefon) sek.push(a("zahlungslink-neu"));
      if (s === "abgelaufen" && offeneErstattung(b) > 0) menue.push(nurLeitung(a("erstatten")));
      break;
    case "storniert":
      if (offeneErstattung(b) > 0) primaer = sperre?.code === "bar" ? a("an-die-kassa", { titel: T.kassa.auszahlen, variante: "erstattung" }) : nurLeitung(sperre ? { ...a("erstatten"), deaktiviert: true, grund: sperre.text } : a("erstatten"));
      sek.push(a("zahlung-oeffnen"));
      break;
    default:
      sek.push(a("zahlung-oeffnen"));
  }

  // Teilerstattung bezahlter, nicht versendeter Bestellungen (Leitung)
  if (["bezahlt", "versandbereit", "abholbereit"].includes(s) && Number(b.betrag_bezahlt_cent || 0) > 0) menue.push(nurLeitung(sperre ? { ...a("erstatten", { titel: "Teilerstattung …" }), deaktiviert: true, grund: sperre.text } : a("erstatten", { titel: "Teilerstattung …" })));
  const st = storno();
  if (st && s !== "pruefen") menue.push(st);
  if (s === "pruefen" && st) sek.push(st);
  if (risikoOffen(b)) sek.unshift(a("risiko-geprueft"));
  if (b.mail_status === "fehlgeschlagen" || ["reserviert", "bezahlt", "versandbereit", "abholbereit", "offen"].includes(s)) menue.push(a("bestaetigung"));
  menue.push(a("email"), a("drucken"), a("kundenakte", { deaktiviert: !b.kontakt, grund: b.kontakt ? undefined : "Kein Kontakt verknüpft" }));
  if (b.payment_intent && !menue.some((x) => x.id === "stripe-oeffnen") && !sek.some((x) => x.id === "stripe-oeffnen")) menue.push(a("stripe-oeffnen"));

  // Schreibrecht fehlt (Logistik/GF lesend): alles deaktiviert bis auf Links
  const nurLesen = ctx.schreiben === false;
  const sperreLesen = (x) => (x && nurLesen && x.klasse !== "link" ? { ...x, deaktiviert: true, grund: "Nur lesend" } : x);
  return { primaer: sperreLesen(primaer), sekundaer: sek.filter(Boolean).map(sperreLesen), menue: dedupe(menue.filter(Boolean)).map(sperreLesen) };
}

function rechnungAktion(b, f) {
  if (f.rechnung) return a("rechnung");
  return a("rechnung", { deaktiviert: true, grund: "Noch nicht verfügbar – Rechnung in Faktura erstellen", ersatzHref: "/faktura" });
}

function dedupe(liste) {
  const seen = new Set();
  return liste.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

function datumKurz(iso) {
  const t = tagVon(iso);
  return t ? `${t.slice(8, 10)}.${t.slice(5, 7)}.` : "–";
}

/**
 * Bänder der Bestellungsakte (§ 5.1) in Reihenfolge nach Schwere. Höchstens eines sichtbar (MASTER Q-B6), Rest als „+n Hinweis“.
 * @returns {Array<{id:string, ton:"gefahr"|"warnung"|"info"|"neutral", text:string, aktion?:string}>}
 */
export function bestellBaender(b, ctx = {}) {
  const fmt = ctx.cent || ((c) => `${(Number(c || 0) / 100).toFixed(2)} €`);
  const out = [];
  const zs = ctx.zahlungen || [];
  const h = ctx.heute || heuteIso();
  if (b.status === "pruefen") out.push({ id: "pruefen", ton: "gefahr", text: T.baender.pruefen(fmt(b.gesamt_cent), fmt(b.betrag_bezahlt_cent)), aktion: "geprueft" });
  const streit = zs.find((z) => streitOffen(z) || z.dispute_status === "lost");
  if (streit) {
    if (streit.dispute_status === "lost") out.push({ id: "streit", ton: "gefahr", text: T.baender.streitVerloren, aktion: "stripe-oeffnen" });
    else out.push({ id: "streit", ton: "gefahr", text: T.baender.streit(fmt(streit.dispute_betrag_cent || streit.betrag_cent), datumKurz(streit.dispute_frist)), aktion: "stripe-oeffnen" });
  }
  if (risikoOffen(b)) out.push({ id: "risiko", ton: "warnung", text: T.baender.risiko(risikoStufe(b.radar_risk_level)), aktion: "risiko-geprueft" });
  if (steuerfallOffen(b) && b.status === "bezahlt") out.push({ id: "steuerfall", ton: "warnung", text: T.baender.steuerfall, aktion: "steuerfall-geklaert" });
  if ((b.rechnung_uid || Number(b.rechnungswunsch) === 1) && ["versendet", "abgeholt", "abgeschlossen"].includes(b.status) && !(ctx.rechnungen || []).length) out.push({ id: "rechnung", ton: "warnung", text: T.baender.rechnungFehlt, aktion: "rechnung" });
  const anf = zs.find((z) => z.status === "Erstattung angefordert");
  if (anf) out.push({ id: "freigabe", ton: "neutral", text: T.baender.freigabe(fmt(anf.erstattung_angefordert_cent || anf.betrag_cent), datumKurz(anf.erstattung_angefordert_am)) });
  if (b.status === "storniert" && offeneErstattung(b) > 0) out.push({ id: "storno-offen", ton: "warnung", text: T.baender.stornoErstattungOffen(fmt(offeneErstattung(b))), aktion: "erstatten" });
  if (b.status === "abgelaufen" && offeneErstattung(b) > 0) out.push({ id: "abgelaufen-bezahlt", ton: "warnung", text: T.baender.abgelaufenBezahlt(fmt(offeneErstattung(b))), aktion: "erstatten" });
  if (["fehlgeschlagen", "checkout_fehler"].includes(b.status)) out.push({ id: "fehlgeschlagen", ton: "warnung", text: T.baender.fehlgeschlagen, aktion: "zurueck-offen" });
  if (b.mail_status === "fehlgeschlagen") out.push({ id: "mail", ton: "warnung", text: T.baender.mailFehlgeschlagen, aktion: "bestaetigung" });
  if (["reserviert", "abholbereit"].includes(b.status) && b.abholung_bis && tageBis(b.abholung_bis, h) > 0) out.push({ id: "abholfrist", ton: "warnung", text: T.baender.abholfristUeber(datumKurz(b.abholung_bis)) });
  if (fremdwaehrung(b)) out.push({ id: "fremd", ton: "warnung", text: T.baender.fremd });
  if (b.status === "offen" && (b.bestellart || "Online") === "Online") out.push({ id: "checkout", ton: "info", text: T.baender.checkoutOffen, aktion: "zahlungslink-neu" });
  if (b.status === "zahlung_ausstehend") out.push({ id: "unterwegs", ton: "info", text: T.baender.unterwegs });
  if (["storniert", "erstattet", "widerrufen"].includes(b.status) && !out.some((x) => x.id === "storno-offen")) {
    const letzter = [...(b.verlauf || [])].reverse().find((v) => v.status === b.status);
    out.push({ id: "ende", ton: "neutral", text: T.baender.endzustand(statusInfo("PH Bestellung", b.status, b).anzeige, letzter ? datumKurz(letzter.zeit) : "–") + (letzter?.von ? ` · ${letzter.von}` : "") });
  }
  return out;
}
