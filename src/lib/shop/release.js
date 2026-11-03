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
// Rein, ohne "@/"-Importe (node --test).

const offen = (id, titel, zustaendig, hinweis) => Object.freeze({ id, titel, zustaendig, hinweis, erledigt: false, beleg: null, datum: null, durch: null });

export const SHOP_RELEASE = Object.freeze([
  // Rechtstexte (agb … datenschutz): ENTWURF in legal.js/legalTexte.js (Stand 02.11.2026, inhaltlich fertig,
  // status "entwurf") – Punkte bleiben offen bis zur Kanzlei-Freigabe.
  offen("agb", "AGB für den Onlinekauf (Accessoires)", "Kanzlei", "Entwurf (legal.js agb, Stand 2026-11-02), Kanzlei-Freigabe offen; Platzhalter: Zahlungsarten (Stripe-Konto/Showroom), Mitteilung Anhang II FAGG"),
  offen("widerrufsbelehrung", "Widerrufsbelehrung Fernabsatz (FAGG / §§ 312g, 355 BGB)", "Kanzlei", "Entwurf (Anhang I Teil A FAGG wörtlich, legal.js widerruf), Kanzlei-Freigabe offen"),
  offen("widerrufsformular", "Muster-Widerrufsformular (Anhang I Teil B FAGG / Anlage 2 EGBGB)", "Kanzlei", "Entwurf (Anhang I Teil B FAGG wörtlich, legal.js widerrufsformular), Kanzlei-Freigabe offen"),
  offen("versandbedingungen", "Versand- und Lieferbedingungen inkl. Lieferzeiten, Länder", "Kanzlei + Inhaber", "Entwurf in legal.js versand (übernimmt Lieferzeiten aus lieferzeit.js); Lieferzeit je Land/Bestand: src/lib/shop/lieferzeit.js (Entwurf, Stand 31.10.2026 – Prüfung durch Kanzlei offen; Freigabe je Eintrag, sonst liveBlockers lieferzeit:*)"),
  offen("datenschutz", "Datenschutz-Ergänzung Stripe, LetMeShip/Versanddienst, Bestelldaten", "Kanzlei", "Entwurf (legal.js datenschutz) – in die Datenschutzerklärung übernehmen; AV-Verträge Stripe/LetMeShip ablegen; Platzhalter: Firma/Anschrift LetMeShip"),
  offen("widerrufsfunktion", "Online-Rücktrittsfunktion „Vertrag widerrufen“ / „Widerruf bestätigen“ für Shop-Bestellungen (§ 13a FAGG, seit 01.10.2026)", "Kanzlei", "Gebaut am 02.11.2026: /de/shop/recht/widerruf-formular + /api/shop/widerruf (src/lib/shop/widerruf.js); Eingangsbestätigung über den Payments-Mailer (nur live, im Test keine Mail). Offen: Kanzlei prüft Ablauf und Wortlaut; URL = legalTexte.js WIDERRUF_URL"),
  offen("gewaehrleistung-mitteilung", "Harmonisierte Mitteilung zur Gewährleistung (§ 4 Abs 1 Z 12 FAGG, Anhang II) vor der Bestellung hervorgehoben", "Technik + Kanzlei", "Grafik laut Anhang II FAGG (RIS-PDF) einbinden; Platzhalter in AGB Punkt 10"),
  offen("vertragsbestaetigung", "Vertragsbestätigung per E-Mail mit AGB, Widerrufsbelehrung und Muster-Formular (§ 7 Abs 3 FAGG)", "Technik", "Entwurf src/lib/shop/orderMail.js; noch nicht an handlers.js/webhook.js angeschlossen"),
  offen("stripe-live", "Stripe-Konto verifiziert, Live-Schlüssel + Webhook-Geheimnis in der Server-Konfiguration", "Inhaber + Technik", "Live-Schlüssel und Webhook-Geheimnis (Namen: src/lib/payments/config.js); wird zusätzlich technisch geprüft"),
  offen("mail", "Mail-Dienst für Bestellbestätigung und Widerrufsbestätigung", "Technik", "PAYMENTS_MAIL_PROVIDER/…; wird zusätzlich technisch geprüft"),
  offen("versand", "Versandkosten/Länder: LetMeShip-Geschäftskonto, API-Zugang, Dienste, Paketprofile (Gewicht/Maße), Versicherung", "Inhaber", "src/lib/commerce/shipping/config.js"),
  offen("verpackung", "Verpackungs-Lizenzierung AT (VerpackVO, z. B. ARA) und DE (VerpackG, LUCID-Registrierung)", "Inhaber + Steuerberater", "Registrierungsnummern als Beleg"),
  // ust: Regeln liegen als ENTWURF in src/lib/shop/ust.js (20 %/10 % Bildband, Versand folgt der Ware/anteilig,
  // DE mit AT-USt bis OSS_AKTIV) – Entwurf, Stand 31.10.2026, Prüfung durch Steuerberater offen. Bleibt offen bis zum Beleg.
  offen("ust", "Umsatzsteuer für Lieferungen nach DE (OSS) und CH (Export/Zoll) geklärt", "Steuerberater", "Entwurf der Regeln: src/lib/shop/ust.js (Status entwurf, Stand 31.10.2026 – Prüfung durch Steuerberater offen) – zu bestätigen: 10 % Bildbände, Versand-Aufteilung, OSS_AKTIV/Lieferschwelle 10.000 € EU-weit (inkl. Möbel-Lieferungen an Private nach DE!); zusätzlich Live-Sperre ust:* aus ust.js ustOffen, bis FERNVERKAEUFE_EU_NETTO_CENT gefüllt; CH bleibt bis dahin 'nicht verfügbar'"),
  offen("insolvenzrecht", "Rücksprache Insolvenzrechtler zu Vorauszahlungen (vgl. Gutschein-Entscheidung)", "Insolvenzrechtler", "schriftliche Stellungnahme"),
  offen("preise", "Verkaufspreise je Produkt mit Stand ≤ 3 Monate (AT-Shop des Herstellers)", "Daten-Team + Inhaber", "preis.art verkaufspreis im Katalog; wird technisch geprüft (preisAktiv)"),
  offen("inhaber-ok", "Ausdrückliches Inhaber-OK zum Livegang", "Inhaber", "schriftlich, mit Datum"),
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Ist ein Punkt belegt erledigt? (erledigt + beleg + datum + durch) */
export const releaseItemDone = (x) => x?.erledigt === true && typeof x.beleg === "string" && x.beleg.trim().length > 3 && DATE_RE.test(x.datum || "") && typeof x.durch === "string" && x.durch.trim().length > 0;

/** Offene Punkte (Ids). */
export const releaseOpen = (list = SHOP_RELEASE) => list.filter((x) => !releaseItemDone(x)).map((x) => x.id);

/** true nur, wenn die Liste nicht leer ist und jeder Punkt belegt erledigt ist. */
export const releaseComplete = (list = SHOP_RELEASE) => Array.isArray(list) && list.length > 0 && releaseOpen(list).length === 0;
