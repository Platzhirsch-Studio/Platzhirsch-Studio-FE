// src/lib/shop/orderMail.js
// ENTWURF der Vertragsbestätigung (Auftragsbestätigung) per E-Mail für
// Shop-Bestellungen. NUR TEXTBAU – versendet nichts, ist nirgends
// angeschlossen (handlers.js setzt weiter mail.status "nicht_gesendet").
// Anschluss erst, wenn release.js "vertragsbestaetigung" und "mail" erledigt
// sind und die Rechtstexte freigegeben wurden.
//
// Pflichten (Quellen):
//   § 7 Abs 3 FAGG – Bestätigung des geschlossenen Vertrags auf einem
//     dauerhaften Datenträger, spätestens bei Lieferung, mit allen
//     Informationen nach § 4 Abs 1 FAGG (u. a. Z 2 Unternehmer, Z 4
//     Gesamtpreis, Z 7 Liefer-/Zahlungsbedingungen, Z 8 Widerruf samt
//     Muster-Widerrufsformular und Rücktrittsfunktion § 13a, Z 11 Ausnahmen,
//     Z 12 Gewährleistung).
//     https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008847
//   § 11 Abs 1 ECG – AGB so zur Verfügung stellen, dass der Nutzer sie
//     speichern und wiedergeben kann → AGB im Klartext in der Mail.
//     https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20001703
//   DE: § 312f Abs 2 BGB iVm Art. 246a EGBGB (gleicher Inhalt).
//     https://www.gesetze-im-internet.de/bgb/__312f.html
// Rein, ohne "@/"-Importe (node --test).
import { AGB, ANBIETER, ANSCHRIFT, WIDERRUFSFORMULAR, ausnahmenFuer, blocksText, platzhalterIn, widerrufsbelehrung } from "./legalTexte.js";

const euro = (cent) => `${(Math.round(Number(cent) || 0) / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const nameOf = (v) => (typeof v === "string" ? v : v && typeof v === "object" ? v.de || Object.values(v)[0] || "" : "");
const datum = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Vienna" });
};

/**
 * Baut Betreff und Klartext der Vertragsbestätigung.
 * @param {object} order  Bestellung aus orderStore (handlers.js checkoutHandler)
 * @param {{ widerrufsUrl?: string|null, teillieferung?: boolean }} [o]
 *   teillieferung: mehrere Waren getrennt geliefert → Gestaltungshinweis [1] lit c
 * @returns {{ status: "entwurf", betreff: string, text: string, platzhalter: string[], enthaelt: string[] }}
 */
export function vertragsbestaetigungEntwurf(order, { widerrufsUrl = null, teillieferung = false } = {}) {
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

  const teile = [
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
    "GEWÄHRLEISTUNG",
    "Es gilt das gesetzliche Gewährleistungsrecht (zwei Jahre ab Übergabe, Verbrauchergewährleistungsgesetz). Einzelheiten: AGB Punkt 10.",
    "",
    "WIDERRUFSBELEHRUNG",
    blocksText(belehrung),
    ...(ausnahmen.length ? ["", "Ausschluss des Widerrufsrechts:", ...ausnahmen.map((x) => x.text)] : []),
    "",
    blocksText(WIDERRUFSFORMULAR),
    "",
    "ALLGEMEINE GESCHÄFTSBEDINGUNGEN",
    blocksText(AGB),
  ];
  const text = teile.join("\n");
  return {
    status: "entwurf",
    betreff: `Auftragsbestätigung ${o.id || ""} – ${ANBIETER.marke}`.trim(),
    text,
    platzhalter: [...new Set([...platzhalterIn(belehrung), ...platzhalterIn(AGB)])].filter((p) => text.includes(p)),
    enthaelt: ["vertragsdaten", "anbieter", "gewaehrleistung", "widerrufsbelehrung", ...(ausnahmen.length ? ["ausnahmen"] : []), "widerrufsformular", "agb"],
  };
}
