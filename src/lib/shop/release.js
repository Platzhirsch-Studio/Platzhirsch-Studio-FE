// src/lib/shop/release.js
// Freigabe-Checkliste des Onlineshops der Accessoire-Welt (Inhaber-
// Entscheidung Nr. 29 vom 31.10.2026, Marktresearch/digital/teamleiter/
// inhaber-entscheidungen.md). SHOP_MODE=live wirkt NUR, wenn JEDER Punkt
// erledigt ist UND einen Beleg (Dokument/Fundstelle) und ein Datum hat –
// sonst fällt der Modus auf "off" zurück (mode.js, Test: tests/unit/shop.test.mjs).
//
// Pflege: Punkt erst auf erledigt: true setzen, wenn der Beleg vorliegt;
// beleg = wo der Nachweis liegt (Datei, Mail vom …, Vertrag Nr. …),
// datum = JJJJ-MM-TT, durch = wer bestätigt hat. Nie vorab ankreuzen.
// Die technischen Voraussetzungen (Stripe-Live-Schlüssel, Mail-Dienst)
// prüft mode.js zusätzlich zur Laufzeit aus der Server-Umgebung.
//
// Stand 03.11.2026 (Inhaber-Entscheidung Nr. 46 „Onlineshop mit echter Zahlung
// und Gutscheinverkauf – Erlaubnis erteilt“; Sperre „Insolvenzrechtler zuerst“
// vom Inhaber aufgehoben): Rechtstexte, Widerrufsfunktion, Vertragsbestätigung,
// Gewährleistungs-Mitteilung und Inhaber-OK belegt erledigt. Offen bleiben die
// Punkte, die nur Inhaber/Steuerberater liefern können (Liste mit Umgebungs-
// variablen: Platzhirsch-Status/berichte/SHOP-LIVE-2026-11-03.md).
// Rein, ohne "@/"-Importe (node --test).

const PROTOKOLL = "Marktresearch/digital/teamleiter/inhaber-entscheidungen.md";
const BERICHT = "Platzhirsch-Status/berichte/SHOP-LIVE-2026-11-03.md";
const INHABER = "Inhaber (Chat 03.11.2026)";
const KANZLEI = "Kanzlei laut Inhaber (Chat 03.11.2026)";
const TECHNIK = "Technik (03.11.2026), Inhaber-Auftrag Nr. 46";

const offen = (id, titel, zustaendig, hinweis) => Object.freeze({ id, titel, zustaendig, hinweis, erledigt: false, beleg: null, datum: null, durch: null });
const erledigt = (id, titel, zustaendig, hinweis, { beleg, durch, datum = "2026-11-03" }) => Object.freeze({ id, titel, zustaendig, hinweis, erledigt: true, beleg, datum, durch });

export const SHOP_RELEASE = Object.freeze([
  // Rechtstexte: Wortlaut legal.js/legalTexte.js, status "freigegeben" seit 03.11.2026.
  erledigt("agb", "AGB für den Onlinekauf (Accessoires)", "Kanzlei", "legal.js agb, Stand 2026-11-03; Zahlungsarten (Stripe-Checkout, Showroom vor Ort) und Gewährleistungs-Mitteilung eingetragen", {
    beleg: `Entscheidungen Nr. 40, 45, 46 (${PROTOKOLL}); src/lib/shop/legalTexte.js AGB`,
    durch: KANZLEI,
  }),
  erledigt("widerrufsbelehrung", "Widerrufsbelehrung Fernabsatz (FAGG / §§ 312g, 355 BGB)", "Kanzlei", "Anhang I Teil A FAGG wörtlich, legal.js widerruf; allgemeine Belehrung /widerruf (src/lib/legal/widerruf.js, Nr. 39)", {
    beleg: `Entscheidungen Nr. 39, 45, 46 (${PROTOKOLL}); src/lib/shop/legalTexte.js widerrufsbelehrung()`,
    durch: KANZLEI,
  }),
  erledigt("widerrufsformular", "Muster-Widerrufsformular (Anhang I Teil B FAGG / Anlage 2 EGBGB)", "Kanzlei", "Anhang I Teil B FAGG wörtlich, legal.js widerrufsformular", {
    beleg: `Entscheidungen Nr. 39, 45, 46 (${PROTOKOLL}); src/lib/shop/legalTexte.js WIDERRUFSFORMULAR`,
    durch: KANZLEI,
  }),
  offen("versandbedingungen", "Versand- und Lieferbedingungen inkl. Lieferzeiten, Länder", "Inhaber", "Text freigegeben (legal.js versand, 03.11.2026). OFFEN: Lieferzeit je Land/Bestand in src/lib/shop/lieferzeit.js (Vorschläge, Freigabe je Eintrag durch den Inhaber mit Datum und Beleg; bis dahin liveBlockers lieferzeit:*)"),
  erledigt("datenschutz", "Datenschutz-Ergänzung Stripe, LetMeShip/Versanddienst, Bestelldaten", "Kanzlei", "legal.js datenschutz, Stand 2026-11-03. Noch einzutragen durch den Inhaber (Nr. 41): Firma/Anschrift LetMeShip (PLATZHALTER.letmeship) – bis dahin liveBlockers recht:datenschutz; AV-Verträge Stripe/LetMeShip ablegen", {
    beleg: `Entscheidungen Nr. 40, 41, 46 (${PROTOKOLL}); src/lib/shop/legalTexte.js DATENSCHUTZ_SHOP`,
    durch: KANZLEI,
  }),
  erledigt("widerrufsfunktion", "Online-Rücktrittsfunktion „Vertrag widerrufen“ / „Widerruf bestätigen“ für Shop-Bestellungen (§ 13a FAGG, seit 01.10.2026)", "Kanzlei", "Gebaut am 02.11.2026: /de/shop/recht/widerruf-formular + /api/shop/widerruf (src/lib/shop/widerruf.js); Eingangsbestätigung über den Payments-Mailer (live jeder Mailer, test nur Mock); auch ohne Bestellnummer nutzbar (Nr. 39); URL = legalTexte.js WIDERRUF_URL", {
    beleg: `Entscheidungen Nr. 39, 45, 46 (${PROTOKOLL}); src/lib/shop/widerruf.js`,
    durch: KANZLEI,
  }),
  erledigt("gewaehrleistung-mitteilung", "Harmonisierte Mitteilung zur Gewährleistung (§ 4 Abs 1 Z 12 FAGG, Anhang II) vor der Bestellung hervorgehoben", "Technik + Kanzlei", "Eigener Textblock src/lib/shop/gewaehrleistung.js (kein fremdes PDF): im Warenkorb hervorgehoben vor dem Bestellknopf (ShopCart data-shop-gewaehrleistung), in AGB Punkt 10 und in der Vertragsbestätigung. Wortlaut-Abgleich mit dem amtlichen Muster: Kanzlei (siehe Bericht)", {
    beleg: `src/lib/shop/gewaehrleistung.js, src/components/Shop/ShopCart.js; Entscheidung Nr. 46 (${PROTOKOLL}); ${BERICHT}`,
    durch: TECHNIK,
  }),
  erledigt("vertragsbestaetigung", "Vertragsbestätigung per E-Mail mit AGB, Widerrufsbelehrung und Muster-Formular (§ 7 Abs 3 FAGG)", "Technik", "src/lib/shop/orderMail.js angeschlossen: Abholung mit Zahlung vor Ort → handlers.js sofort; Online-Zahlung → webhook.js bei „bezahlt“. Inhalt: Vertragsdaten, Verkäufer, Gewährleistungs-Mitteilung, Widerrufsbelehrung + Muster-Formular, AGB, Versandbedingungen (auch als Textanhang). Test: nur Mock-Mailer, Betreff [TEST]", {
    beleg: `src/lib/shop/orderMail.js, handlers.js, webhook.js; tests/unit/shop-rechtstexte.test.mjs; Entscheidung Nr. 46 (${PROTOKOLL})`,
    durch: TECHNIK,
  }),
  offen("stripe-live", "Stripe-Konto verifiziert, Live-Schlüssel + Webhook-Geheimnis in der Server-Konfiguration", "Inhaber + Technik", "Live-Geheimschlüssel (sk_live_…) und Webhook-Geheimnis, optional Zahlungsarten-Konfiguration pmc_… (Variablennamen: src/lib/payments/config.js, Liste im Bericht SHOP-LIVE-2026-11-03.md); wird zusätzlich technisch geprüft (technik:stripe-live-schluessel)"),
  offen("mail", "Mail-Dienst für Bestellbestätigung und Widerrufsbestätigung", "Inhaber + Technik", "PAYMENTS_MAIL_PROVIDER=resend, PAYMENTS_MAIL_API_KEY, PAYMENTS_MAIL_FROM (+ AVV Resend); wird zusätzlich technisch geprüft (technik:mail-dienst)"),
  offen("versand", "Versandkosten/Länder: LetMeShip-Geschäftskonto, API-Zugang, Dienste, Paketprofile (Gewicht/Maße), Versicherung", "Inhaber", "LETMESHIP_API_ID, LETMESHIP_API_PASSWORD, LETMESHIP_ENV=live (src/lib/commerce/shipping/letmeship.js); Paketprofile geprueft: true nach Messung (src/lib/shop/paketprofile.js)"),
  offen("verpackung", "Verpackungs-Lizenzierung AT (VerpackVO, z. B. ARA) und DE (VerpackG, LUCID-Registrierung)", "Inhaber + Steuerberater", "Registrierungsnummern als Beleg"),
  // ust: Regeln liegen als ENTWURF in src/lib/shop/ust.js (20 %/10 % Bildband, Versand folgt der Ware/anteilig,
  // DE mit AT-USt bis OSS_AKTIV) – Entwurf, Stand 31.10.2026, Prüfung durch Steuerberater offen. Bleibt offen bis zum Beleg.
  offen("ust", "Umsatzsteuer für Lieferungen nach DE (OSS) und CH (Export/Zoll) geklärt", "Steuerberater", "Entwurf der Regeln: src/lib/shop/ust.js (Status entwurf, Stand 31.10.2026 – Prüfung durch Steuerberater offen) – zu bestätigen: 10 % Bildbände, Versand-Aufteilung, OSS_AKTIV/Lieferschwelle 10.000 € EU-weit (inkl. Möbel-Lieferungen an Private nach DE!), Gutschein als Mehrzweckgutschein; zusätzlich Live-Sperre ust:* aus ust.js ustOffen, bis FERNVERKAEUFE_EU_NETTO_CENT gefüllt; CH bleibt bis dahin 'nicht verfügbar'"),
  erledigt("insolvenzrecht", "Rücksprache Insolvenzrechtler zu Vorauszahlungen (vgl. Gutschein-Entscheidung)", "Inhaber", "Sperre „Insolvenzrechtler zuerst“ vom Inhaber am 03.11.2026 aufgehoben (Nr. 46); eine schriftliche Stellungnahme liegt im Projekt nicht vor – Entscheidung und Verantwortung beim Inhaber", {
    beleg: `Entscheidung Nr. 46 (${PROTOKOLL})`,
    durch: INHABER,
  }),
  offen("preise", "Verkaufspreise je Produkt mit Stand ≤ 3 Monate (AT-Shop des Herstellers)", "Daten-Team + Inhaber", "preis.art verkaufspreis im Katalog; wird technisch geprüft (preisAktiv); Inhaber bestätigt Stand vor dem Livegang"),
  erledigt("inhaber-ok", "Ausdrückliches Inhaber-OK zum Livegang", "Inhaber", "„Onlineshop mit echter Zahlung und Gutscheinverkauf – Erlaubnis erteilt“ (03.11.2026)", {
    beleg: `Entscheidung Nr. 46 (${PROTOKOLL})`,
    durch: INHABER,
  }),
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Ist ein Punkt belegt erledigt? (erledigt + beleg + datum + durch) */
export const releaseItemDone = (x) => x?.erledigt === true && typeof x.beleg === "string" && x.beleg.trim().length > 3 && DATE_RE.test(x.datum || "") && typeof x.durch === "string" && x.durch.trim().length > 0;

/** Offene Punkte (Ids). */
export const releaseOpen = (list = SHOP_RELEASE) => list.filter((x) => !releaseItemDone(x)).map((x) => x.id);

/** Erledigte Punkte (Ids). */
export const releaseDone = (list = SHOP_RELEASE) => list.filter((x) => releaseItemDone(x)).map((x) => x.id);

/** true nur, wenn die Liste nicht leer ist und jeder Punkt belegt erledigt ist. */
export const releaseComplete = (list = SHOP_RELEASE) => Array.isArray(list) && list.length > 0 && releaseOpen(list).length === 0;
