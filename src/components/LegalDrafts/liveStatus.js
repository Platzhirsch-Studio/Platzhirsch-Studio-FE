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
    id: "widerruf",
    title: "Widerrufsbelehrung für Gutscheine",
    livePath: null,
    state: "wartet",
    file: "src/lib/commerce/withdrawalText.js (WITHDRAWAL_STATUS)",
    ownerFills: "Firmenwortlaut der ausgebenden Gesellschaft (wie Gutscheinbedingungen Feld 1); Kaufstrecke ist ohnehin aus",
  },
  {
    id: "gutscheinbedingungen",
    title: "Gutscheinbedingungen",
    livePath: "/gutscheinbedingungen",
    state: "wartet",
    file: "src/lib/commerce/voucherTerms.js (TERMS_STATUS), Felder in voucherTermsFields.js",
    ownerFills: "7 Felder in TERMS_OWNER_FIELDS; bis dahin bleibt TERMS_STATUS „entwurf“ und die Seite 404",
  },
  {
    id: "agb",
    title: "Allgemeine Geschäftsbedingungen",
    livePath: null,
    state: "ohne-seite",
    file: "src/components/LegalDrafts/docs/agb.js",
    ownerFills: "Firma der Handels-GmbH, Fristen, Anzahlung, Lieferzeiten u. a. ([vom Unternehmen auszufüllen] in der Vorschau); heute verkauft die Website nichts online",
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
