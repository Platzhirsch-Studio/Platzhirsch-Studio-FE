// src/components/LegalDrafts/liveStatus.js — Live-Status aller Rechtstexte.
// Eine Liste für Freigabe-Cockpit, Tests und Übergabe. Reine Daten, nur
// relative Importe (node --test, tests/unit/recht-freigabe.test.mjs).
//
// Kanzlei-Freigabe der Rechtstexte: Inhaber-Entscheidung Nr. 11 vom
// 29.10.2026 (Marktresearch/digital/teamleiter/inhaber-entscheidungen.md).
// „Freigegeben“ heißt: der Wortlaut ist anwaltlich geprüft. Live geht ein Text
// nur, wenn er außerdem keine offenen Unternehmensangaben mehr hat – fehlende
// Fakten werden NIE geschätzt. Was der Inhaber noch wörtlich einträgt, steht
// in Marktresearch/digital/teamleiter/freigaben-recht.md.

export const LEGAL_APPROVAL = Object.freeze({
  lawyerApproved: true,
  approvedAt: "2026-10-29",
  approvedBy: "Kanzlei",
  source: "Inhaber-Entscheidung Nr. 11 (Marktresearch/digital/teamleiter/inhaber-entscheidungen.md)",
});

/**
 * state:
 *   "live"        freigegeben und öffentlich
 *   "wartet"      Wortlaut freigegeben, aber Unternehmensangaben offen → nicht öffentlich
 *   "ohne-seite"  Wortlaut freigegeben, es gibt (noch) keine öffentliche Seite
 */
export const LEGAL_TEXTS = Object.freeze([
  {
    id: "impressum",
    title: "Impressum",
    livePath: "/impressum",
    state: "live",
    file: "src/components/Impressum/impressum.js",
    ownerFills: "BLATTLINIE wörtlich eintragen; bis dahin fehlt nur diese Zeile (Kammer aus WKO Firmen A–Z und Beteiligungsverhältnisse eingetragen am 30.10.2026)",
  },
  {
    id: "datenschutz",
    title: "Datenschutzerklärung",
    livePath: "/datenschutz",
    state: "live",
    file: "src/components/Datenschutz/datenschutz.js",
    ownerFills:
      "inkl. Concierge, Upload, Kundenportal, E-Mail-Versand, Bewerbungen. Online-Zahlung (Stripe) erscheint erst, wenn die Kaufstrecke live ist; AV-Verträge (Anthropic, Resend, Hoster) vor dem Livegang ablegen",
  },
  {
    id: "portal-datenschutz",
    title: "Datenschutz im Kundenportal (Art. 13 DSGVO)",
    livePath: "/portal/datenschutz",
    state: "live",
    file: "src/app/[locale]/portal/datenschutz/page.js, Fristen und Empfänger in src/lib/portal/privacy.js",
    ownerFills:
      "Speicherfristen (Sprachnotizen, Feedback, Konto) und Empfänger bestätigen, danach OWNER_CONFIRMED = true; Wortlaut ist Teil der freigegebenen Datenschutzerklärung (Abschnitt Kundenportal), die Fristen sind Unternehmensangaben",
  },
  {
    id: "cookies",
    title: "Cookie-Banner und Einwilligung",
    livePath: "/datenschutz#cookies",
    state: "live",
    file: "src/lib/legal/services.js (Register), src/components/Cookies",
    ownerFills: "Google-Ads-Abschnitt erst mit Ads-Kennung und Marketing-Schalter",
  },
  {
    // Inhaber 03.11.2026 (Entscheidung Nr. 46): Gutscheinverkauf online erlaubt; Firmenwortlaut
    // MW Immobilienverwaltungs GmbH (Nr. 38) eingetragen → WITHDRAWAL_STATUS „freigegeben“.
    id: "widerruf",
    title: "Widerrufsbelehrung für Gutscheine",
    livePath: "/gutscheine#widerrufsbelehrung",
    state: "live",
    file: "src/lib/commerce/withdrawalText.js (WITHDRAWAL_STATUS)",
    ownerFills: "Keine offenen Angaben; sichtbar, sobald VOUCHER_MODE=stripe auf dem Server wirkt (Stripe-Schlüssel + Mail-Dienst)",
  },
  {
    // Inhaber 03.11.2026 (Entscheidung Nr. 46): 7 Felder eingetragen (voucherTermsFields.js, Belege je Feld)
    // → TERMS_STATUS „freigegeben“; Steuerberater bestätigt „Mehrzweckgutschein“ noch (SHOP-LIVE-2026-11-03.md).
    id: "gutscheinbedingungen",
    title: "Gutscheinbedingungen",
    livePath: "/gutscheinbedingungen",
    state: "live",
    file: "src/lib/commerce/voucherTerms.js (TERMS_STATUS), Felder in voucherTermsFields.js",
    ownerFills: "Keine offenen Felder; Seite öffentlich, sobald VOUCHER_MODE (anfrage|stripe) auf dem Server gesetzt ist; Steuerberater bestätigt Mehrzweckgutschein",
  },
  {
    // Inhaber 02.11.2026: AGB je Geschäftsbereich mit eigener Seite /agb
    // (Teil I Allgemein, II Verbraucher, III Unternehmer, IV Bereiche).
    // Inhaber 03.11.2026 (Entscheidung Nr. 40): „AGB zur Kanzlei – alle geprüft
    // und freigegeben“ → AGB_STATUS „freigegeben“, die 15 Lücken mit
    // Standardformulierungen geschlossen (Bestätigung der Kanzlei ausständig).
    id: "agb",
    title: "Allgemeine Geschäftsbedingungen",
    livePath: "/agb",
    state: "live",
    file: "src/lib/legal/agb.js (Seite src/app/[locale]/agb/page.js; Kanzlei-Vorschau der Vorfassung: LegalDrafts/docs/agb.js)",
    ownerFills: "15 Standardformulierungen (Stand 03.11.2026) in Platzhirsch-Status/berichte/AGB-KANZLEI-2026-11-02.md von der Kanzlei bestätigen lassen; Werte „höchstens die Hälfte“ (Anzahlung), „ein Zehntel“ (Preisanpassung) und Verbraucherschlichtung „nein“ sind Annahmen",
  },
  {
    // Inhaber 03.11.2026 (Entscheidung Nr. 39): Widerrufsbelehrung für Verträge
    // außerhalb des Onlineshops (Fernabsatz und Außergeschäftsraum, FAGG).
    id: "widerrufsbelehrung",
    title: "Widerrufsbelehrung (außerhalb des Onlineshops)",
    livePath: "/widerruf",
    state: "live",
    file: "src/lib/legal/widerruf.js (Seite src/app/[locale]/widerruf/page.js; Online-Formular /shop/recht/widerruf-formular bei SHOP_MODE test/live)",
    ownerFills: "Keine offenen Angaben; Wortlaut neu (03.11.2026), Prüfpunkt Rücksendekosten nicht paketfähiger Ware (Schätzung = Lieferkosten laut Angebot) in AGB-KANZLEI-2026-11-02.md",
  },
  {
    // Rat 9,5 B13: freiwillige Information mit nur geprüften Aussagen (Prüfergebnis,
    // bekannte Einschränkungen, Kontakt, Marktüberwachung). Wortlaut zur Prüfung an
    // die Kanzlei (Marktresearch/recht/07-dse-ergaenzungen-rat95.md).
    id: "barrierefreiheit",
    title: "Information zur Barrierefreiheit",
    livePath: "/barrierefreiheit",
    state: "live",
    // nicht Teil der Kanzlei-Freigabe Nr. 11: Wortlaut liegt der Kanzlei zur Prüfung vor
    wording: "kanzlei-offen",
    file: "src/app/[locale]/barrierefreiheit/page.js, Daten in src/lib/legal/barrierefreiheit.js (Gerüst der Kanzlei: LegalDrafts/docs/barrierefreiheit.js)",
    ownerFills: "Unternehmensgröße (Kleinstunternehmer-Ausnahme BaFG) und betroffene Dienstleistungen bestätigen, sobald online verkauft oder gebucht wird; jede neue Prüfung in PRUEFUNG eintragen",
  },
]);

export const LEGAL_STATE_LABEL = Object.freeze({
  live: "freigegeben, live",
  wartet: "freigegeben, wartet auf Angaben",
  "ohne-seite": "freigegeben, keine Live-Seite",
});

export function legalLiveRows(texts = LEGAL_TEXTS) {
  return texts.map((t) => ({ ...t, label: t.wording === "kanzlei-offen" ? "live, Wortlaut zur Prüfung bei der Kanzlei" : LEGAL_STATE_LABEL[t.state] || t.state }));
}
