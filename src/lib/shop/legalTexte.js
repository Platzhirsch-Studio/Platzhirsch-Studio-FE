// src/lib/shop/legalTexte.js
// Wortlaut der fünf Rechts-Slots des Onlineshops (legal.js): AGB,
// Widerrufsbelehrung, Muster-Widerrufsformular, Versandbedingungen,
// Datenschutz-Abschnitt Shop. Dazu der Textbaustein für die
// Vertragsbestätigung per E-Mail (orderMail.js).
//
// STATUS: ENTWURF von KI-Agenten (31.10.2026, Inhaber-Entscheidung vom
// 31.10.2026: Agenten entwerfen alles). Kanzlei-Durchsicht empfohlen. Kein
// Text ist "freigegeben" – legal.js setzt status "entwurf", damit
// liveBlockers (mode.js) und die Freigabe-Checkliste (release.js) ehrlich
// bleiben. SHOP_MODE bleibt unverändert.
//
// Regeln:
//   - Firmendaten NUR aus vorhandenen Quellen: src/lib/site.js (Name,
//     Anschrift, Telefon, E-Mail, Web) und src/components/Impressum/
//     impressum.js (REGISTER: FN, Gericht, UID). Der Test
//     tests/unit/shop-rechtstexte.test.mjs prüft, dass FN/UID hier und im
//     Impressum gleich sind. Fehlendes = sichtbarer PLATZHALTER (unten).
//   - Widerrufsbelehrung und Muster-Widerrufsformular WÖRTLICH nach
//     FAGG Anhang I Teil A und B in der Fassung BGBl. I Nr. 59/2026
//     (Verbraucherrechts-Änderungsgesetz 2026, für Verträge nach dem
//     30.09.2026), abgerufen am 31.10.2026:
//     https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20008847
//     Gewählte Gestaltungshinweise: [1] lit b (Kaufvertrag) bzw. lit c
//     (getrennte Lieferung mehrerer Waren, nur in der Vertragsbestätigung
//     bei tatsächlicher Teillieferung), [2] Firmendaten, [3] erster Satz
//     (Rücktrittsfunktion nach § 13a FAGG ist Pflicht bei Online-Verträgen),
//     [4] ja (wir holen nicht ab), [5] lit a Rücksendung, lit b nach
//     VORSCHLAEGE.ruecksendekosten, lit c ja, [6] entfällt (keine Dienstleistung).
//   - Textformat: Block = String (Absatz) | { h } (Überschrift) | { ul: [] }
//     (Liste) | { note } (interne Anmerkung für Kanzlei/Inhaber – NIE in
//     Mail oder Kundenansicht ohne Entwurfsmarker).
//   - Platzhalter haben immer die Form "[PLATZHALTER: …]" (platzhalterIn()).
// Rein, ohne "@/"-Importe (node --test).
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME, SITE_URL } from "../site.js";
import { LIEFERZEIT, lieferzeitFreigegeben } from "./lieferzeit.js";

export const LEGAL_TEXT_STAND = "2026-10-31";
export const LEGAL_TEXT_HINWEIS = "Entwurf von KI-Agenten, Kanzlei-Durchsicht empfohlen";

// Registerdaten wörtlich aus src/components/Impressum/impressum.js (REGISTER),
// dort aus Firmenbuch/Impressum-Entwurf Marktresearch/recht/04 Variante A.
// Nicht aus impressum.js importiert, weil das eine React-Komponente mit
// "@/"-Importen ist; Gleichheit sichert der Unit-Test.
export const ANBIETER = Object.freeze({
  firma: LEGAL_NAME,
  marke: SITE_NAME,
  strasse: ADDRESS.street,
  plz: ADDRESS.postalCode,
  ort: ADDRESS.city,
  land: ADDRESS.country,
  telefon: PHONE_DISPLAY,
  email: EMAIL,
  web: SITE_URL,
  fn: "FN 443753 d",
  gericht: "Landesgericht Feldkirch",
  uid: "ATU70035339",
});

const A = ANBIETER;
export const ANSCHRIFT = `${A.strasse}, ${A.plz} ${A.ort}, ${A.land}`;
/** Gestaltungshinweis [2] Anhang I Teil A FAGG: Name, Anschrift, Telefonnummer, E-Mail-Adresse. */
export const ANBIETER_ZEILE = `${A.firma}, „${A.marke}“, ${ANSCHRIFT}, Telefon ${A.telefon}, E-Mail ${A.email}`;

/**
 * Offene Angaben, die NICHT aus den Quellen hervorgehen. Der Inhaber (bzw.
 * Technik/Kanzlei) ersetzt sie; solange einer im Text steht, darf der Slot
 * nicht freigegeben werden (Test: platzhalterIn).
 */
export const PLATZHALTER = Object.freeze({
  widerrufsfunktion: "[PLATZHALTER: Internetadresse der Online-Rücktrittsfunktion „Vertrag widerrufen“ für Shop-Bestellungen nach § 13a FAGG – für PH-S-Bestellungen noch nicht gebaut]",
  zahlungsartenOnline: "[PLATZHALTER: im Stripe-Konto aktivierte Zahlungsarten, z. B. Kredit-/Debitkarte, Apple Pay, Google Pay, eps]",
  zahlungsartenShowroom: "[PLATZHALTER: im Showroom bei Abholung akzeptierte Zahlungsarten, z. B. Bankomatkarte, Kreditkarte, bar]",
  versanddienste: "[PLATZHALTER: über LetMeShip tatsächlich gebuchte Paketdienste, z. B. Österreichische Post, DHL, DPD, GLS, UPS]",
  letmeship: "[PLATZHALTER: Firma und Anschrift des Versandvermittlers LetMeShip laut Vertrag bzw. Auftragsverarbeitungsvertrag]",
  gewaehrleistungsMitteilung: "[PLATZHALTER: harmonisierte Mitteilung zum gesetzlichen Gewährleistungsrecht laut Anhang II FAGG (grafisches Muster, im RIS nur als PDF) – vor Livegang einbinden]",
});

/**
 * Vorschläge der Agenten für Inhaber-Entscheidungen. Rechtlich zulässig
 * gewählt, aber geschäftliche Entscheidung des Inhabers – im Text stehen sie
 * ohne Platzhalter, damit der Entwurf lesbar ist; Liste im Bericht.
 */
export const VORSCHLAEGE = Object.freeze({
  // § 6 Abs 1 Z 1 KSchG: Annahmefrist darf nicht unangemessen lang/unbestimmt sein.
  annahmefristWerktage: 2,
  // Abholfrist bei „bezahlen bei Abholung“; danach Rücktritt nur nach Nachfrist (§ 918 ABGB).
  abholfristTage: 14,
  nachfristTage: 14,
  // Anhang I Teil A Gestaltungshinweis [5] lit b: "kunde" = Sie tragen die
  // unmittelbaren Kosten, "wir" = wir tragen sie. Alle Shop-Artikel sind paketfähig.
  ruecksendekosten: "kunde",
  // Transportschaden: Bitte um Meldung binnen … Tagen (keine Voraussetzung für Rechte).
  schadenMeldungTage: 7,
});

const RIS = (nr) => `https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=${nr}`;
/** Fundstellen, auf die sich die Texte stützen (in Code-Kommentaren und Notizen zitiert). */
export const QUELLEN = Object.freeze({
  FAGG: RIS("20008847"),
  VGG: RIS("20011654"),
  KSchG: RIS("10002462"),
  ECG: RIS("20001703"),
  ABGB: RIS("10001622"),
  BAO: RIS("10003940"),
  AStG: RIS("20009242"),
  UGB: RIS("10001702"),
  RomI: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32008R0593",
  EuGVVO: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32012R1215",
  ODR_Aufhebung: "https://eur-lex.europa.eu/eli/reg/2024/3228/oj",
  DSGVO: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32016R0679",
  BGB_312j: "https://www.gesetze-im-internet.de/bgb/__312j.html",
  BGB_312g: "https://www.gesetze-im-internet.de/bgb/__312g.html",
  EuGH_C249_21: "https://curia.europa.eu/juris/liste.jsf?num=C-249/21",
  WKO_VGG: "https://www.wko.at/oe/gewerberecht/vgg-fristen-beweislast-warenkauf-ab-2022",
});

// ---------------------------------------------------------------- Widerruf

// Gestaltungshinweis [1] Anhang I Teil A FAGG (wörtlich).
const FRIST_BEGINN = Object.freeze({
  b: ", an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.",
  c: ", an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat.",
});

// Gestaltungshinweis [5] lit b (wörtlich).
const RUECKSENDEKOSTEN_TEXT = Object.freeze({
  wir: "Wir tragen die Kosten der Rücksendung der Waren.",
  kunde: "Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.",
});

/**
 * Muster-Widerrufsbelehrung, Anhang I Teil A FAGG, wörtlich und ausgefüllt.
 * @param {{ variante?: "b"|"c", ruecksendekosten?: "kunde"|"wir", widerrufsUrl?: string|null }} [o]
 *   variante c nur, wenn mehrere Waren einer Bestellung getrennt geliefert werden.
 */
export function widerrufsbelehrung({ variante = "b", ruecksendekosten = VORSCHLAEGE.ruecksendekosten, widerrufsUrl = null } = {}) {
  const url = widerrufsUrl || PLATZHALTER.widerrufsfunktion;
  return [
    { h: "Widerrufsrecht" },
    "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.",
    `Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag${FRIST_BEGINN[variante] || FRIST_BEGINN.b}`,
    // [2] Name, Anschrift, Telefon, E-Mail; [3] erster Textbaustein (§ 13a FAGG).
    `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${ANBIETER_ZEILE}) mittels einer eindeutigen Erklärung (z. B. mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Sie können Ihr Widerrufsrecht auch online unter ${url} ausüben. Wenn Sie diese Online-Funktion nutzen, übermitteln wir Ihnen auf einem dauerhaften Datenträger (z. B. durch eine E-Mail) unverzüglich eine Eingangsbestätigung mit Informationen zum Inhalt der Widerrufserklärung sowie dem Datum und der Uhrzeit ihres Eingangs.`,
    "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
    { h: "Folgen des Widerrufs" },
    // [4] wir bieten keine Abholung an → Zurückbehaltungsrecht (§ 14 FAGG).
    "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.",
    // [5] lit a (Rücksendung an uns), lit b, lit c.
    `Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns (${A.firma}, Showroom ${A.marke}, ${ANSCHRIFT}) zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.`,
    RUECKSENDEKOSTEN_TEXT[ruecksendekosten] || RUECKSENDEKOSTEN_TEXT.kunde,
    "Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.",
  ];
}

/**
 * Ausnahmen vom Widerrufsrecht, die in diesem Shop vorkommen können
 * (§ 18 Abs 1 FAGG; § 4 Abs 1 Z 11 FAGG verlangt die Information).
 *   Z 5 versiegelte Hygiene-/Gesundheitswaren nach Entsiegelung → Parfum
 *       (Kategorie "parfum", z. B. Trudon Eau de Parfum). DE: § 312g Abs 2 Nr 3 BGB.
 *   Z 3 Waren nach Kundenspezifikation/personalisiert → derzeit NICHT
 *       angeboten (kein Gravur-/Personalisierungsartikel im Katalog), daher
 *       nicht in den Text aufgenommen. Kommt das, hier ergänzen.
 * Kerzen, Raumduft, Glas und Bücher fallen NICHT unter Z 5.
 */
export const WIDERRUF_AUSNAHMEN = Object.freeze([
  Object.freeze({
    id: "versiegelt-hygiene",
    fundstelle: "§ 18 Abs 1 Z 5 FAGG; DE § 312g Abs 2 Nr 3 BGB",
    kategorien: Object.freeze(["parfum"]),
    text: "Das Widerrufsrecht besteht nicht bei Verträgen über Waren, die versiegelt geliefert werden und aus Gründen des Gesundheitsschutzes oder aus Hygienegründen nicht zur Rückgabe geeignet sind, sofern deren Versiegelung nach der Lieferung entfernt wurde. In unserem Shop betrifft das Parfums (z. B. Eau de Parfum), die in versiegelter Verpackung geliefert werden. Solange die Versiegelung unversehrt ist, können Sie auch diese Waren widerrufen.",
  }),
]);

export const ausnahmenFuer = (kategorien = []) => WIDERRUF_AUSNAHMEN.filter((x) => x.kategorien.some((k) => kategorien.includes(k)));

const AUSNAHMEN_BLOCKS = [
  { h: "Ausschluss des Widerrufsrechts" },
  ...WIDERRUF_AUSNAHMEN.map((x) => x.text),
  { note: "§ 18 Abs 1 Z 5 FAGG nur für Parfum angewendet. Kanzlei prüfen: ob die Cellophan-Folie der Hersteller als „Versiegelung“ gilt (EuGH 27.3.2019, C-681/17 slewo: Kriterium Gesundheits-/Hygienegrund) und ob einzelne Raumdüfte erfasst sein sollen. Z 3 (personalisierte Waren) entfällt mangels solcher Artikel." },
  { note: "Review 31.10.2026 – Kanzlei prüfen: Die Belehrung vor der Bestellung nutzt Gestaltungshinweis [1] lit b, die Versandbedingungen (Punkt 4) erlauben aber Teillieferungen; erst die Vertragsbestätigung wählt lit c. Da die Belehrung vor Vertragsschluss den Fristbeginn richtig nennen muss (§ 4 Abs 1 Z 8 FAGG), entweder Teillieferungen ausschließen oder lit c bei mehreren Waren schon im Warenkorb verwenden." },
];

/** Muster-Widerrufsformular, Anhang I Teil B FAGG, wörtlich und ausgefüllt. */
export const WIDERRUFSFORMULAR = Object.freeze([
  { h: "Muster-Widerrufsformular" },
  "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück)",
  {
    ul: [
      `An ${A.firma}, ${ANSCHRIFT}, E-Mail ${A.email}:`,
      "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)",
      "Bestellt am (*)/erhalten am (*)",
      "Name des/der Verbraucher(s)",
      "Anschrift des/der Verbraucher(s)",
      "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
      "Datum",
    ],
  },
  "(*) Unzutreffendes streichen.",
]);

// ---------------------------------------------------------------- AGB

const V = VORSCHLAEGE;

/**
 * AGB Onlineshop (Accessoires) für Verbraucher in AT und DE (Versand) sowie
 * Abholung im Showroom (auch CH). Geprüft gegen § 6 KSchG (keine Klauseln
 * nach Abs 1 Z 1, 5, 9, Abs 2 Z 1, 4, Abs 3 Transparenzgebot), § 9 KSchG/
 * § 3 VGG (Gewährleistung zwingend), § 10 Abs 3 KSchG (keine Schriftform-
 * klausel), § 14 KSchG (Gerichtsstand), Art. 6 Rom-I-VO.
 */
export const AGB = Object.freeze([
  `Allgemeine Geschäftsbedingungen für den Onlineshop von ${A.marke} · Fassung vom 31.10.2026 (Entwurf)`,

  { h: "1. Vertragspartner und Geltungsbereich" },
  `1.1 Vertragspartner ist die ${A.firma} („wir“, „${A.marke}“), ${ANSCHRIFT}, ${A.fn}, ${A.gericht}, UID ${A.uid}, Telefon ${A.telefon}, E-Mail ${A.email}.`,
  `1.2 Diese AGB gelten für Kaufverträge, die Sie über unseren Onlineshop auf ${A.web.replace(/^https?:\/\//, "")} schließen – mit Versand oder mit Abholung im Showroom. Für Einkäufe im Showroom, Planungs-, Liefer- und Montageaufträge gelten gesonderte Bedingungen.`,
  "1.3 Der Onlineshop richtet sich an Verbraucherinnen und Verbraucher. Abweichende Bedingungen der Kundin oder des Kunden werden nicht Vertragsinhalt.",
  { note: "Keine Schriftformklausel für Nebenabreden (§ 10 Abs 3 KSchG). Ausschluss abweichender Kundenbedingungen ist zulässig." },

  { h: "2. Bestellvorgang und Vertragsschluss" },
  "2.1 Die Darstellung der Artikel im Onlineshop ist noch kein verbindliches Angebot, sondern eine Aufforderung, bei uns zu bestellen.",
  "2.2 Bestellvorgang: Sie legen Artikel in den Warenkorb, wählen Versand (Lieferland Österreich oder Deutschland) oder Abholung im Showroom, geben Ihre Daten ein und sehen vor dem Absenden eine Zusammenfassung mit Artikeln, Gesamtpreis inklusive Umsatzsteuer, Versandkosten und Lieferzeit. Bis dahin können Sie alle Angaben prüfen und Eingabefehler über die Felder und die Schaltflächen im Warenkorb korrigieren (§ 10 Abs 1 ECG).",
  "2.3 Mit Klick auf die Schaltfläche „Zahlungspflichtig bestellen“ geben Sie ein verbindliches Angebot zum Kauf der Artikel im Warenkorb ab (§ 8 Abs 2 FAGG; DE § 312j Abs 3 BGB). Das gilt auch, wenn Sie „bezahlen bei Abholung“ gewählt haben: Auch dann ist Ihre Bestellung ein verbindlicher Kauf; nur die Zahlung erfolgt erst im Showroom.",
  "2.4 Den Eingang Ihrer Bestellung bestätigen wir unverzüglich auf der Bestätigungsseite und per E-Mail (Eingangsbestätigung, § 10 Abs 2 ECG). Die Eingangsbestätigung ist noch keine Annahme Ihres Angebots.",
  `2.5 Der Vertrag kommt zustande, wenn wir Ihr Angebot mit einer Auftragsbestätigung per E-Mail annehmen. Wir nehmen an oder lehnen ab spätestens ${V.annahmefristWerktage} Werktage nach Eingang Ihrer Bestellung. Lehnen wir ab oder melden wir uns in dieser Frist nicht, sind Sie nicht mehr gebunden; eine bereits geleistete Zahlung erstatten wir unverzüglich, spätestens binnen 14 Tagen, über dasselbe Zahlungsmittel.`,
  { note: `Annahmefrist ${V.annahmefristWerktage} Werktage = Vorschlag (§ 6 Abs 1 Z 1 KSchG: nicht unangemessen lang, bestimmt). Werktage = Montag bis Freitag außer gesetzliche Feiertage in Österreich. Bei Stripe wird die Zahlung schon bei der Bestellung eingezogen; deshalb die Erstattungszusage. Review 31.10.2026 – Kanzlei prüfen: Zieht Stripe sofort ein (capture), kann das Einziehen selbst als Annahme gelten (konkludent, § 864 Abs 1 ABGB); dann ist Punkt 2.5 widersprüchlich. Alternativen: Stripe nur autorisieren (capture_method manual) und erst mit der Auftragsbestätigung einziehen, oder Annahme ausdrücklich mit Zahlungsabschluss.` },
  "2.6 Vertragssprache ist Deutsch. Wir speichern den Vertragstext (Bestelldaten und diese AGB) und senden ihn Ihnen mit der Auftragsbestätigung auf einem dauerhaften Datenträger (E-Mail) zu (§ 7 Abs 3 FAGG). Ihre Bestellung können Sie außerdem über den Link auf der Bestätigungsseite einsehen.",

  { h: "3. Abholung im Showroom" },
  `3.1 Statt Versand können Sie „Abholung im Showroom“ wählen (${A.marke}, ${ANSCHRIFT}). Das ist auch für Kundinnen und Kunden aus der Schweiz möglich; einen Versand in die Schweiz bieten wir derzeit nicht an.`,
  `3.2 Bei Abholung können Sie online bezahlen oder „bezahlen bei Abholung“ wählen. Im zweiten Fall halten wir die Artikel nach unserer Auftragsbestätigung für Sie bereit und informieren Sie per E-Mail, sobald sie abholbereit sind. Sie bezahlen bei der Abholung mit ${PLATZHALTER.zahlungsartenShowroom}.`,
  `3.3 Bitte holen Sie die Artikel innerhalb von ${V.abholfristTage} Tagen nach unserer Mitteilung „abholbereit“ während der Öffnungszeiten ab. Holen Sie nicht ab, können wir Ihnen eine Nachfrist von ${V.nachfristTage} Tagen setzen und nach deren Ablauf vom Vertrag zurücktreten (§ 918 ABGB). Weitere Kosten berechnen wir Ihnen dafür nicht.`,
  { note: `Abholfrist ${V.abholfristTage} + Nachfrist ${V.nachfristTage} Tage = Vorschlag. Rücktritt nur über die gesetzliche Nachfristsetzung – kein vertragliches Rücktrittsrecht ohne sachlichen Grund (§ 6 Abs 2 Z 1 KSchG), keine Stornogebühr oder Vertragsstrafe vorgesehen. Auch bei Abholung bleibt es ein Fernabsatzvertrag (Abschluss ausschließlich online): Widerrufsrecht ab Besitzübernahme im Showroom.` },
  "3.4 Ihr Widerrufsrecht (Punkt 7) gilt auch bei Abholung; die Frist beginnt mit dem Tag, an dem Sie die Ware im Showroom übernehmen.",

  { h: "4. Preise und Versandkosten" },
  "4.1 Alle Preise sind Gesamtpreise in Euro einschließlich der gesetzlichen Umsatzsteuer (§ 4 Abs 1 Z 4 FAGG, § 9 PrAG; DE § 3 PAngV). Den enthaltenen Steuerbetrag weisen wir in der Zusammenfassung vor der Bestellung und auf der Rechnung aus.",
  "4.2 Versandkosten berechnen wir anhand von Lieferland, Gewicht und Maßen der Pakete und der Versicherung der Sendung; sie werden im Warenkorb vor Abgabe der Bestellung angezeigt und sind im Gesamtpreis enthalten. Bei Abholung im Showroom fallen keine Versandkosten an. Einzelheiten: Versand- und Lieferbedingungen.",
  "4.3 Es gilt der Preis zum Zeitpunkt Ihrer Bestellung. Ändern sich Preis oder Versandkosten, bevor Sie bestellen, zeigen wir Ihnen die neue Summe an und Sie bestätigen neu.",

  { h: "5. Zahlung" },
  `5.1 Online bezahlen Sie über den Zahlungsdienstleister Stripe (Stripe Payments Europe, Limited, Irland) mit ${PLATZHALTER.zahlungsartenOnline}. Welche Zahlungsarten möglich sind, sehen Sie spätestens zu Beginn des Bestellvorgangs (§ 8 Abs 3 FAGG; DE § 312j Abs 1 BGB). Ihre Zahlungsdaten gibt Stripe nicht an uns weiter.`,
  "5.2 Bei Online-Zahlung ist der Gesamtpreis mit Abschluss des Bezahlvorgangs fällig. Bei „bezahlen bei Abholung“ ist er bei Übergabe im Showroom fällig.",
  "5.3 Für die Nutzung einer Zahlungsart verlangen wir kein zusätzliches Entgelt.",
  { note: "Kein Zahlungsmittelentgelt: § 27 Abs 6 ZaDiG 2018 / DE § 270a BGB. Zahlungsarten müssen vor dem Bestellvorgang genannt werden – Platzhalter aus dem Stripe-Dashboard füllen." },

  { h: "6. Lieferung" },
  "6.1 Wir liefern an Adressen in Österreich und Deutschland. In die Schweiz und in andere Länder liefern wir derzeit nicht; Abholung im Showroom ist möglich.",
  "6.2 Die Lieferzeit geben wir je Lieferland in der Zusammenfassung vor der Bestellung an. Ist keine Lieferzeit vereinbart, liefern wir ohne unnötigen Aufschub, spätestens 30 Tage nach Vertragsschluss (§ 7a KSchG).",
  "6.3 Ist ein Artikel nach Vertragsschluss nicht lieferbar, informieren wir Sie unverzüglich. Ihre Rechte nach dem Gesetz (etwa Rücktritt nach Setzung einer angemessenen Nachfrist und Erstattung bereits bezahlter Beträge) bleiben unberührt.",
  "6.4 Einzelheiten zu Versand, Teillieferungen und Transportschäden regeln die Versand- und Lieferbedingungen.",

  { h: "7. Widerrufsrecht" },
  "7.1 Als Verbraucherin oder Verbraucher haben Sie bei Bestellungen im Onlineshop ein gesetzliches Widerrufsrecht von 14 Tagen. Belehrung, Ausnahmen und Muster-Widerrufsformular finden Sie in der Widerrufsbelehrung, die Sie auch mit der Auftragsbestätigung erhalten.",
  `7.2 Sie können den Widerruf per Brief, per E-Mail an ${A.email}, mit dem Muster-Widerrufsformular oder über die Schaltfläche „Vertrag widerrufen“ erklären (${PLATZHALTER.widerrufsfunktion}).`,

  { h: "8. Gefahrübergang" },
  "8.1 Bei Versand geht die Gefahr des Verlusts oder der Beschädigung der Ware erst auf Sie über, wenn die Ware an Sie oder an eine von Ihnen bestimmte, vom Beförderer verschiedene Person abgeliefert wird (§ 7b KSchG; DE § 475 Abs 2 BGB). Bei Abholung geht die Gefahr mit der Übergabe im Showroom über.",

  { h: "9. Eigentumsvorbehalt" },
  "9.1 Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.",

  { h: "10. Gewährleistung" },
  "10.1 Es gilt das gesetzliche Gewährleistungsrecht. Für Verbraucherinnen und Verbraucher gilt das Verbrauchergewährleistungsgesetz (VGG) in der für Verträge ab 1. Oktober 2026 geltenden Fassung (BGBl. I Nr. 60/2026).",
  "10.2 Wir leisten Gewähr für jeden Mangel, der bei Übergabe der Ware vorliegt und innerhalb von zwei Jahren nach diesem Zeitpunkt hervorkommt (§ 10 Abs 1 VGG). Kommt ein Mangel innerhalb eines Jahres nach Übergabe hervor, wird vermutet, dass er schon bei Übergabe vorlag (§ 11 Abs 1 VGG). Ihre Rechte verjähren drei Monate nach Ablauf der Gewährleistungsfrist (§ 28 Abs 1 VGG).",
  "10.3 Ist die Ware mangelhaft, können Sie zunächst zwischen Verbesserung (Reparatur) und Austausch wählen, es sei denn, die gewählte Abhilfe wäre unmöglich oder für uns, verglichen mit der anderen, mit einem unverhältnismäßig hohen Aufwand verbunden (§ 12 Abs 2 VGG). Wählen Sie die Verbesserung und stellen wir damit den mangelfreien Zustand her, verlängert sich die Gewährleistungsfrist einmal um ein Jahr (§ 10 Abs 2a VGG). Vor der Abhilfe informieren wir Sie über dieses Wahlrecht und die mögliche Verlängerung (§ 12 Abs 2a VGG). Verbesserung oder Austausch erfolgen in angemessener Frist und ohne Kosten für Sie (§ 13 Abs 1 VGG).",
  "10.4 Preisminderung oder Vertragsauflösung können Sie unter den Voraussetzungen des § 12 Abs 4 VGG verlangen; bei einem geringfügigen Mangel ist die Vertragsauflösung ausgeschlossen (§ 12 Abs 5 VGG).",
  "10.5 Bitte melden Sie Mängel an " + A.email + " oder telefonisch unter " + A.telefon + ". Gewährleistungsrechte sind nicht davon abhängig, dass Sie den Mangel innerhalb einer bestimmten Frist melden.",
  "10.6 Wohnen Sie in Deutschland, gelten zusätzlich die zwingenden Vorschriften des deutschen Kaufrechts (§§ 434 ff., 474 ff. BGB), soweit sie für Sie günstiger sind (Punkt 13).",
  PLATZHALTER.gewaehrleistungsMitteilung,
  { note: `VGG-Novelle BGBl. I Nr. 60/2026 (Warenreparaturrichtlinie-Umsetzungsgesetz): § 10 Abs 2a, § 12 Abs 2a, § 13 Abs 1a in Kraft 1.10.2026, für Verträge nach dem 30.9.2026 (§ 29 Abs 4 VGG), RIS ${QUELLEN.VGG}; deckt sich mit src/content/ratgeber (WKO Stand 30.09.2026). Keine Rügeobliegenheit für Verbraucher. § 4 Abs 1 Z 12 FAGG verlangt die harmonisierte Mitteilung laut Anhang II „in hervorgehobener Weise“ → Grafik einbinden (Platzhalter).` },

  { h: "11. Herstellergarantien" },
  "11.1 Gibt ein Hersteller eine Garantie, gilt sie zusätzlich zur Gewährleistung und schränkt Ihre gesetzlichen Rechte nicht ein. Inhalt, Dauer und Garantiegeber nennen wir Ihnen, wenn uns der Hersteller die Garantie schriftlich bestätigt hat.",
  { note: "Haltbarkeitsgarantie > 2 Jahre: harmonisierte Kennzeichnung nach Anhang III FAGG (§ 4 Abs 1 Z 12a). Derzeit keine solche Garantie im Shop bekannt." },

  { h: "12. Haftung" },
  "12.1 Wir haften nach den gesetzlichen Bestimmungen. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.",
  { note: "Bewusst keine Haftungsbeschränkung: § 6 Abs 1 Z 9 KSchG (Personenschäden, grobe Fahrlässigkeit) und für DE-Verbraucher § 309 Nr 7 BGB/Kardinalpflichten – eine Klausel, die beide Rechtsordnungen besteht, bringt bei Accessoires kaum Nutzen." },

  { h: "13. Anwendbares Recht und Gerichtsstand" },
  "13.1 Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts. Haben Sie als Verbraucherin oder Verbraucher Ihren gewöhnlichen Aufenthalt in einem anderen Staat, bleibt Ihnen der Schutz der zwingenden Bestimmungen des Rechts dieses Staates erhalten (Art. 6 Abs 2 Rom-I-VO).",
  "13.2 Haben Sie Ihren Wohnsitz, gewöhnlichen Aufenthalt oder Ort der Beschäftigung in Österreich, können wir Sie nur bei dem dort zuständigen Gericht klagen (§ 14 KSchG). Wohnen Sie in einem anderen EU-Staat, können Sie uns in Österreich oder an Ihrem Wohnsitz klagen; wir können Sie nur an Ihrem Wohnsitz klagen (Art. 18 EuGVVO).",

  { h: "14. Beschwerden und Streitbeilegung" },
  `14.1 Bei Fragen oder Beschwerden wenden Sie sich bitte an ${A.email} oder ${A.telefon}. Wir bemühen uns, jedes Anliegen direkt mit Ihnen zu lösen.`,
  { note: `Neutral formuliert: Das Impressum enthält bewusst keine Angabe zur Teilnahme an einer Verbraucherschlichtung (§ 19 AStG, Entscheidung Inhaber; impressum.js). Erklärt der Inhaber die Bereitschaft, hier Schlichtungsstelle ergänzen (AStG ${QUELLEN.AStG}). Kein Link zur EU-OS-Plattform: ODR-VO aufgehoben mit Wirkung 20.07.2025 durch VO (EU) 2024/3228 (${QUELLEN.ODR_Aufhebung}). DE: Hinweispflicht § 36 VSBG erst ab mehr als 10 Beschäftigten – prüfen. Review 31.10.2026: Unabhängig davon verlangt § 19 Abs 3 AStG nach einer ungelösten Beschwerde eine Mitteilung auf dauerhaftem Datenträger, ob wir an einem AS-Verfahren teilnehmen (Kanzlei: Prozess/Textbaustein für den Kundendienst).` },

  { h: "15. Schlussbestimmungen" },
  "15.1 Ist eine Bestimmung dieser AGB unwirksam, bleiben die übrigen wirksam. An die Stelle der unwirksamen Bestimmung tritt die gesetzliche Regelung.",
  "15.2 Es gilt die Fassung dieser AGB, die zum Zeitpunkt Ihrer Bestellung auf unserer Website abrufbar ist. Spätere Änderungen gelten nicht für bereits geschlossene Verträge.",
  { note: "Keine Ersetzungsklausel „dem Zweck möglichst nahe“ (Transparenzgebot § 6 Abs 3 KSchG). Keine einseitige Änderung laufender Verträge (§ 6 Abs 2 Z 3 KSchG)." },
]);

// ---------------------------------------------------------------- Versand

/** Lieferzeit-Zeilen aus src/lib/shop/lieferzeit.js (einzige Quelle; keine Zahlen hier). */
export function lieferzeitZeilen(config = LIEFERZEIT) {
  const land = { AT: "Österreich", DE: "Deutschland" };
  const out = [];
  for (const [code, z] of Object.entries(config.versand || {})) {
    const e = z.lager;
    const frei = lieferzeitFreigegeben(e);
    const wert = Number.isInteger(e?.min) && Number.isInteger(e?.max) ? `${e.min}–${e.max} Werktage` : "wird vor der Bestellung im Warenkorb angegeben";
    out.push(`${land[code] || code}, sofort lieferbare Artikel: ${wert}${frei ? "" : " [Entwurf – Wert aus lieferzeit.js, noch nicht freigegeben]"}`);
  }
  out.push("Artikel, die wir beim Hersteller bestellen: Die Lieferzeit nennen wir Ihnen im Warenkorb vor Abgabe der Bestellung; ohne Angabe gilt Punkt 3.2.");
  return out;
}

export function versandbedingungen(config = LIEFERZEIT) {
  return [
    `Versand- und Lieferbedingungen des Onlineshops von ${A.marke} · Stand 31.10.2026 (Entwurf)`,
    { h: "1. Liefergebiet" },
    "1.1 Wir versenden an Lieferadressen in Österreich und Deutschland.",
    "1.2 In die Schweiz und in andere Länder versenden wir derzeit nicht (Zoll- und Umsatzsteuerfragen sind noch offen). Sie können Ihre Bestellung aber im Showroom abholen – auch mit Wohnsitz in der Schweiz.",
    `1.3 Abholung: ${A.marke}, ${ANSCHRIFT}, zu den Öffnungszeiten des Showrooms. Wir informieren Sie per E-Mail, sobald Ihre Artikel abholbereit sind.`,
    { note: "§ 8 Abs 3 FAGG / § 312j Abs 1 BGB: Lieferbeschränkungen spätestens bei Beginn des Bestellvorgangs angeben – im Warenkorb steht „Schweiz – derzeit nicht verfügbar“ (copy.js countries.CH)." },

    { h: "2. Versandkosten und Versanddienst" },
    `2.1 Wir versenden über den Versandvermittler LetMeShip mit ${PLATZHALTER.versanddienste}.`,
    "2.2 Die Versandkosten berechnen wir im Warenkorb live anhand von Lieferland, Lieferadresse, Gewicht und Maßen der Pakete. Sie sehen den Betrag vor Abgabe der Bestellung; er ist im angezeigten Gesamtpreis enthalten (inklusive Umsatzsteuer). Weitere Versandkosten fallen nicht an.",
    "2.3 Jede Sendung ist versichert; Versicherungswert ist der Warenwert. Zerbrechliche Artikel (z. B. Glas) verpacken wir besonders geschützt.",
    "2.4 Bei Abholung im Showroom fallen keine Versandkosten an.",

    { h: "3. Lieferzeit" },
    "3.1 Die Lieferzeit wird in der Zusammenfassung unmittelbar vor der Bestellung angezeigt. Sie beginnt mit dem Vertragsschluss (Auftragsbestätigung); Werktage sind Montag bis Freitag außer gesetzliche Feiertage in Österreich. Derzeit gelten:",
    { ul: lieferzeitZeilen(config) },
    "3.2 Ist keine Lieferzeit angegeben, liefern wir ohne unnötigen Aufschub, spätestens 30 Tage nach Vertragsschluss (§ 7a KSchG).",
    "3.3 Duftkerzen versenden wir bei großer Hitze unter Umständen einige Tage später, damit sie nicht schmelzen. Die angegebene Lieferzeit bleibt davon unberührt; können wir sie nicht einhalten, melden wir uns vorher bei Ihnen.",
    { note: "Lieferzeiten NICHT hier gepflegt, sondern in src/lib/shop/lieferzeit.js (LIEFERZEIT, Entwurf). Freigabe dort; dieser Text übernimmt die Werte automatisch. Rechtsgrundlagen: § 4 Abs 1 Z 7 FAGG, § 7a KSchG, Art. 246a § 1 Abs 1 Nr 7 EGBGB." },

    { h: "4. Teillieferungen" },
    "4.1 Sind nicht alle Artikel einer Bestellung zugleich versandbereit, können wir in Teilen liefern, wenn Ihnen das zumutbar ist. Zusätzliche Versandkosten entstehen Ihnen dadurch nicht. Wir informieren Sie per E-Mail über jede Teilsendung.",
    "4.2 Bei getrennter Lieferung beginnt die Widerrufsfrist erst, wenn Sie die letzte Ware in Besitz genommen haben.",

    { h: "5. Transportschäden" },
    `5.1 Ist ein Paket bei der Zustellung sichtbar beschädigt, lassen Sie den Schaden bitte vom Zusteller bestätigen oder notieren Sie ihn bei der Übernahme. Bemerken Sie einen Schaden (z. B. Glasbruch) erst beim Auspacken, melden Sie ihn bitte möglichst innerhalb von ${V.schadenMeldungTage} Tagen an ${A.email}, am besten mit Fotos von Ware, Verpackung und Versandetikett, und bewahren Sie die Verpackung bis zur Klärung auf.`,
    "5.2 Das ist eine Bitte, damit wir den Schaden beim Versanddienst und der Versicherung schnell geltend machen können. Ihre gesetzlichen Rechte (Gewährleistung, Gefahrübergang erst bei Ablieferung an Sie) hängen davon nicht ab. Wir liefern Ersatz oder erstatten den Kaufpreis.",
    { note: "Keine Rügefrist für Verbraucher (§ 7b KSchG, VGG zwingend; DE § 475 Abs 2 BGB). Meldefrist nur als Bitte formuliert." },
  ];
}

// ---------------------------------------------------------------- Datenschutz

export const DATENSCHUTZ_SHOP = Object.freeze([
  { h: "Onlineshop: Bestellung, Zahlung und Versand" },
  `Verantwortlich ist die ${A.firma}, ${ANSCHRIFT}, E-Mail ${A.email}.`,
  { h: "Welche Daten" },
  "Name, E-Mail-Adresse, Telefonnummer (freiwillig), Lieferadresse und Lieferland, bestellte Artikel, Preise, Versandkosten, Lieferart, Zahlungsart und Zahlungsstatus, Bestellnummer, Sendungsdaten (Paketdienst, Sendungsnummer), Zeitpunkt der Bestellung sowie Ihre Erklärungen zum Vertrag (z. B. Widerruf).",
  { h: "Zwecke und Rechtsgrundlagen" },
  {
    ul: [
      "Abwicklung Ihrer Bestellung, Zahlung, Versand oder Abholung, Kundenkommunikation zur Bestellung, Widerruf und Gewährleistung: Vertragserfüllung (Art. 6 Abs 1 lit b DSGVO).",
      "Aufbewahrung von Buchhaltungs- und Rechnungsdaten: rechtliche Verpflichtung (Art. 6 Abs 1 lit c DSGVO iVm § 132 BAO und § 212 UGB).",
      "Weitergabe von E-Mail-Adresse und Telefonnummer an den Paketdienst für die Zustellankündigung und Rückfragen bei der Zustellung: berechtigtes Interesse an einer reibungslosen Zustellung (Art. 6 Abs 1 lit f DSGVO).",
      "Schutz vor Missbrauch und Betrug im Bezahlvorgang: berechtigtes Interesse (Art. 6 Abs 1 lit f DSGVO).",
    ],
  },
  { note: "Kanzlei prüfen: Weitergabe der E-Mail an den Paketdienst – in DE teils nur mit Einwilligung vertreten. Technisch übergibt webhook.js heute E-Mail und Telefon an LetMeShip (ziel.email/telefon). Alternative: nur mit Häkchen oder gar nicht." },
  { h: "Empfänger" },
  {
    ul: [
      "Stripe Payments Europe, Limited, 1 Grand Canal Street Lower, Dublin 2, Irland – Abwicklung der Online-Zahlung. Kartendaten und andere Zahlungsdaten geben Sie direkt bei Stripe ein; sie erreichen unseren Server nicht. Stripe verarbeitet Daten teils als eigener Verantwortlicher (z. B. Betrugs- und Geldwäscheprävention). Eine Übermittlung an Stripe, Inc. (USA) stützt sich auf den Angemessenheitsbeschluss zum EU-US Data Privacy Framework bzw. Standardvertragsklauseln (Art. 45, 46 DSGVO).",
      `Versandvermittler LetMeShip (${PLATZHALTER.letmeship}) und der von uns gewählte Paketdienst (${PLATZHALTER.versanddienste}) – Name, Lieferadresse, E-Mail und Telefonnummer, Paketgewicht und -maße zur Erstellung und Zustellung der Sendung.`,
      "Unser E-Mail-Versanddienst für Eingangs- und Auftragsbestätigung (siehe Abschnitt E-Mail-Versand dieser Datenschutzerklärung), unser Hosting-Anbieter sowie unsere Steuerberatung im Rahmen der Buchhaltung.",
    ],
  },
  { note: "Stripe-Angaben aus dem DSE-Entwurf (src/components/LegalDrafts/docs/datenschutz.js, Marktresearch/recht/02). DPF-Zertifizierung von Stripe, Inc. vor Freigabe prüfen (dataprivacyframework.gov). AV-Verträge mit Stripe (DPA) und LetMeShip ablegen (release.js „datenschutz“)." },
  { h: "Speicherdauer" },
  "Bestell-, Rechnungs- und Zahlungsdaten bewahren wir sieben Jahre auf, gerechnet ab dem Ende des Kalenderjahres der Bestellung (§ 132 Abs 1 BAO, § 212 UGB), bei laufenden Verfahren auch länger. Daten, die wir nur für Versand und Kommunikation benötigen (z. B. Telefonnummer, Sendungsdaten), löschen wir nach Ablauf der Gewährleistungsfrist und der Verjährung (zwei Jahre plus drei Monate ab Übergabe, gegebenenfalls ein Jahr länger nach einer Verbesserung; §§ 10, 28 VGG), soweit sie nicht Teil der Buchhaltungsunterlagen sind.",
  { h: "Pflicht zur Angabe" },
  "Name, E-Mail-Adresse und – bei Versand – die Lieferadresse brauchen wir für den Vertrag. Ohne sie können wir Ihre Bestellung nicht annehmen. Die Telefonnummer ist freiwillig.",
  { h: "Ihre Rechte" },
  "Sie haben die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde, insbesondere bei der Österreichischen Datenschutzbehörde oder der Aufsichtsbehörde des EU-Staats, in dem Sie wohnen (Art. 77 DSGVO). Einzelheiten und Kontakt: übrige Abschnitte dieser Datenschutzerklärung.",
]);

// ---------------------------------------------------------------- Helfer

/** Alle Texte je Slot-Id (legal.js). */
export function slotTexte(config = LIEFERZEIT) {
  return {
    agb: AGB,
    widerruf: [...widerrufsbelehrung(), ...AUSNAHMEN_BLOCKS],
    widerrufsformular: WIDERRUFSFORMULAR,
    versand: versandbedingungen(config),
    datenschutz: DATENSCHUTZ_SHOP,
  };
}

const PLATZHALTER_RE = /\[PLATZHALTER:[^\]]*\]/g;

/** Strings eines Blocks (Notizen ausgenommen, wenn mitNotizen false). */
function blockStrings(b, mitNotizen) {
  if (typeof b === "string") return [b];
  if (!b || typeof b !== "object") return [];
  if (b.h) return [b.h];
  if (Array.isArray(b.ul)) return b.ul;
  if (b.note) return mitNotizen ? [b.note] : [];
  return [];
}

/** Platzhalter, die in Blocks vorkommen (eindeutig, in Reihenfolge). */
export function platzhalterIn(blocks) {
  const out = [];
  for (const b of blocks || []) for (const s of blockStrings(b, true)) for (const m of s.match(PLATZHALTER_RE) || []) if (!out.includes(m)) out.push(m);
  return out;
}

/** Klartext für E-Mail (ohne interne Notizen). */
export function blocksText(blocks) {
  const lines = [];
  for (const b of blocks || []) {
    if (typeof b === "string") lines.push(b, "");
    else if (b?.h) lines.push(b.h.toUpperCase(), "");
    else if (Array.isArray(b?.ul)) lines.push(...b.ul.map((x) => `– ${x}`), "");
  }
  return lines.join("\n").trim();
}

/** Hinweis für EN/FR/IT: Übersetzung folgt, verbindlich ist der deutsche Text. */
export const LANG_HINWEIS = Object.freeze({
  de: null,
  en: "Translation to follow – the German text below applies.",
  fr: "Traduction à venir – le texte allemand ci-dessous fait foi.",
  it: "Traduzione in arrivo – fa fede il testo tedesco qui sotto.",
});
