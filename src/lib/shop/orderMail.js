// src/lib/shop/orderMail.js
// Vertragsbestätigung (Auftragsbestätigung) per E-Mail für Shop-Bestellungen
// (§ 7 Abs 3 FAGG). Angeschlossen seit 03.11.2026 (Inhaber-Entscheidung Nr. 46):
//   handlers.js  „bezahlen bei Abholung“ → sofort nach der Bestellung
//   webhook.js   Online-Zahlung → sobald Stripe „bezahlt“ meldet
// Versand über den Payments-Mailer (src/lib/payments/mailer.js). Regel
// (sendeVertragsbestaetigung): SHOP_MODE "live" → jeder Mailer; "test" → NUR
// ein Mock-Mailer (outbox/memory, nie "resend"), Betreff mit [TEST]. So lässt
// sich die Mail im Testlauf prüfen, ohne dass je eine echte Mail hinausgeht.
//
// Pflichten (Quellen):
//   § 7 Abs 3 FAGG – Bestätigung des geschlossenen Vertrags auf einem
//     dauerhaften Datenträger, spätestens bei Lieferung, mit allen
//     Informationen nach § 4 Abs 1 FAGG (u. a. Z 2 Unternehmer, Z 4
//     Gesamtpreis, Z 7 Liefer-/Zahlungsbedingungen, Z 8 Widerruf samt
//     Muster-Widerrufsformular und Rücktrittsfunktion § 13a, Z 11 Ausnahmen,
//     Z 12 Gewährleistung samt harmonisierter Mitteilung Anhang II).
//     https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008847
//   § 11 Abs 1 ECG – AGB so zur Verfügung stellen, dass der Nutzer sie
//     speichern und wiedergeben kann → AGB im Klartext in der Mail UND als
//     Textanhang (AGB, Widerrufsbelehrung mit Muster-Formular).
//     https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20001703
//   DE: § 312f Abs 2 BGB iVm Art. 246a EGBGB (gleicher Inhalt).
//     https://www.gesetze-im-internet.de/bgb/__312f.html
// Rein, ohne "@/"-Importe (node --test).
import { AGB, ANBIETER, ANSCHRIFT, WIDERRUFSFORMULAR, ausnahmenFuer, blocksText, platzhalterIn, versandbedingungen, widerrufsbelehrung } from "./legalTexte.js";
import { SHOP_LEGAL, legalOpen } from "./legal.js";
import { gewaehrleistungText } from "./gewaehrleistung.js";
import { mailHtml } from "../payments/mailer.js";

const euro = (cent) => `${(Math.round(Number(cent) || 0) / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const nameOf = (v) => (typeof v === "string" ? v : v && typeof v === "object" ? v.de || Object.values(v)[0] || "" : "");
const datum = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Vienna" });
};

/** Status des Textbausteins: "freigegeben", wenn alle Rechts-Slots wirksam freigegeben sind, sonst "entwurf". */
export const vertragsbestaetigungStatus = (legal = SHOP_LEGAL) => (legalOpen(legal).length === 0 ? "freigegeben" : "entwurf");

/**
 * Baut Betreff, Klartext, HTML und Anhänge der Vertragsbestätigung.
 * @param {object} order  Bestellung aus orderStore (handlers.js checkoutHandler)
 * @param {{ widerrufsUrl?: string|null, teillieferung?: boolean, test?: boolean }} [o]
 *   teillieferung: mehrere Waren getrennt geliefert → Gestaltungshinweis [1] lit c
 * @returns {{ status: "freigegeben"|"entwurf", betreff: string, text: string, html: string, anhaenge: Array<{ filename: string, contentType: string, content: Buffer }>, platzhalter: string[], enthaelt: string[] }}
 */
export function vertragsbestaetigung(order, { widerrufsUrl = null, teillieferung = false, test = false } = {}) {
  const o = order || {};
  const zeilen = Array.isArray(o.zeilen) ? o.zeilen : [];
  const s = o.summen || {};
  const abholung = o.lieferart === "abholung";
  const vorort = o.zahlung === "vorort";

  const posten = zeilen.map((z) => {
    const v = nameOf(z.varianteName);
    return `– ${z.menge} × ${[z.markeName, z.name].filter(Boolean).join(" ")}${v ? ` (${v})` : ""}: ${euro(z.summeCent ?? z.einzelCent * z.menge)}`;
  });
  const lieferung = abholung
    ? `Abholung im Showroom ${ANBIETER.marke}, ${ANSCHRIFT}. Wir melden uns per E-Mail, sobald Ihre Artikel abholbereit sind.`
    : `Versand nach ${[o.adresse?.strasse && `${o.adresse.strasse} ${o.adresse.hausnr || ""}`.trim(), [o.adresse?.plz, o.adresse?.ort].filter(Boolean).join(" "), o.adresse?.land].filter(Boolean).join(", ")}${o.versand?.versichert ? " (versichert)" : ""}.`;
  const zahlung = vorort ? "Zahlung bei Abholung im Showroom." : "Online bezahlt über Stripe.";

  const kategorien = zeilen.map((z) => z.kategorie).filter(Boolean);
  const ausnahmen = ausnahmenFuer(kategorien);
  const belehrung = widerrufsbelehrung({ variante: teillieferung ? "c" : "b", widerrufsUrl });
  const belehrungText = [blocksText(belehrung), ...(ausnahmen.length ? ["", "AUSSCHLUSS DES WIDERRUFSRECHTS", "", ...ausnahmen.map((x) => x.text)] : []), "", blocksText(WIDERRUFSFORMULAR)].join("\n");
  const agbText = blocksText(AGB);
  const versandText = abholung ? "" : blocksText(versandbedingungen());

  const kopf = [
    ...(test ? ["TESTMODUS: Diese Bestätigung stammt aus einem Testlauf. Es besteht kein Vertrag, es wurde nichts bezahlt.", ""] : []),
    `Guten Tag${o.kunde?.name ? ` ${o.kunde.name}` : ""},`,
    "",
    `vielen Dank für Ihre Bestellung. Hiermit nehmen wir sie an und bestätigen den Vertrag (Bestellnummer ${o.id || "–"}, bestellt am ${datum(o.angelegt)}).`,
    "",
    "IHRE BESTELLUNG",
    ...posten,
    `Versandkosten: ${euro(s.versandCent)}`,
    `Gesamtpreis: ${euro(s.gesamtCent)} (inkl. ${euro(s.mwstCent)} Umsatzsteuer)`,
    "",
    `Lieferung: ${lieferung}`,
    `Zahlung: ${zahlung}`,
    "",
    "VERKÄUFER",
    `${ANBIETER.firma} („${ANBIETER.marke}“), ${ANSCHRIFT}`,
    `Telefon ${ANBIETER.telefon} · E-Mail ${ANBIETER.email} · ${ANBIETER.fn}, ${ANBIETER.gericht} · UID ${ANBIETER.uid}`,
    "",
    gewaehrleistungText(),
    "Einzelheiten: AGB Punkt 10 (Verbrauchergewährleistungsgesetz).",
  ];
  const teile = [...kopf, "", "WIDERRUFSBELEHRUNG", belehrungText, "", "ALLGEMEINE GESCHÄFTSBEDINGUNGEN", agbText, ...(versandText ? ["", "VERSAND- UND LIEFERBEDINGUNGEN", versandText] : [])];
  const text = teile.join("\n");
  const html = mailHtml([...kopf.filter((l) => l !== ""), "Widerrufsbelehrung, Muster-Widerrufsformular und AGB finden Sie unten in dieser E-Mail und als Anhang.", "WIDERRUFSBELEHRUNG\n" + belehrungText, "ALLGEMEINE GESCHÄFTSBEDINGUNGEN\n" + agbText, ...(versandText ? ["VERSAND- UND LIEFERBEDINGUNGEN\n" + versandText] : [])]);
  const anhang = (filename, inhalt) => ({ filename, contentType: "text/plain; charset=utf-8", content: Buffer.from(inhalt, "utf8") });
  return {
    status: vertragsbestaetigungStatus(),
    betreff: `${test ? "[TEST] " : ""}Auftragsbestätigung ${o.id || ""} – ${ANBIETER.marke}`.replace(/\s+–/, " –").trim(),
    text,
    html,
    anhaenge: [anhang("AGB-Onlineshop.txt", agbText), anhang("Widerrufsbelehrung-und-Formular.txt", belehrungText), ...(versandText ? [anhang("Versandbedingungen.txt", versandText)] : [])],
    platzhalter: [...new Set([...platzhalterIn(belehrung), ...platzhalterIn(AGB)])].filter((p) => text.includes(p)),
    enthaelt: ["vertragsdaten", "anbieter", "gewaehrleistung", "gewaehrleistung-mitteilung", "widerrufsbelehrung", ...(ausnahmen.length ? ["ausnahmen"] : []), "widerrufsformular", "agb", ...(versandText ? ["versandbedingungen"] : [])],
  };
}

/** Alter Name (Entwurfsphase) – gleicher Inhalt. */
export const vertragsbestaetigungEntwurf = vertragsbestaetigung;

/** Darf dieser Mailer im Modus senden? live: jeder; test: nur Mock (nie resend/gesperrt); off: keiner. */
export function mailerErlaubt(mailer, mode) {
  if (!mailer || typeof mailer.send !== "function") return false;
  if (mode === "live") return true;
  if (mode !== "test") return false;
  return !["resend", "gesperrt"].includes(String(mailer.kind || ""));
}

/**
 * Vertragsbestätigung senden und den Mail-Status in der Bestellung vermerken.
 * @param {{ store: object, mailer?: object|null, now: () => number }} ctx  store = Shop-Store (bestellungen)
 * @param {object} order
 * @param {"off"|"test"|"live"} mode
 * @returns {Promise<{ status: "gesendet"|"nicht_gesendet"|"fehlgeschlagen", grund?: string }>}
 */
export async function sendeVertragsbestaetigung(ctx, order, mode) {
  const zeit = new Date(ctx.now()).toISOString();
  let ergebnis;
  if (!mailerErlaubt(ctx.mailer, mode)) {
    ergebnis = { status: "nicht_gesendet", grund: mode === "test" ? "testmodus-kein-mock-mailer" : "kein_mailer" };
  } else {
    const m = vertragsbestaetigung(order, { test: mode === "test" });
    try {
      const r = await ctx.mailer.send({ to: order.kunde.email, subject: m.betreff, text: m.text, html: m.html, attachments: m.anhaenge, tag: "shop-vertragsbestaetigung" });
      ergebnis = r?.ok === false ? { status: "fehlgeschlagen", grund: "mailer" } : { status: "gesendet", grund: ctx.mailer.kind || "mailer" };
    } catch (err) {
      console.error(`[shop] ${order.id}: vertragsbestaetigung ${err?.message || err}`);
      ergebnis = { status: "fehlgeschlagen", grund: "fehler" };
    }
  }
  const mail = { ...ergebnis, art: "vertragsbestaetigung", zeit, test: mode === "test" };
  await ctx.store.update("bestellungen", order.id, (x) => (x ? { ...x, mail } : x));
  console.info(`[shop] ${order.id}: vertragsbestaetigung ${mail.status}${mail.grund ? ` (${mail.grund})` : ""}`);
  return mail;
}
