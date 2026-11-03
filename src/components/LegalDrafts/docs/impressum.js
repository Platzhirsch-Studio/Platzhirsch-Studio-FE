// Impressum – Anwalts-Vorschau.
// Text: Marktresearch/recht/04-impressum-pflichtangaben.md, Abschnitt 5,
// Variante A (MW Immobilienverwaltungs GmbH, heute), word for word.
// Address, phone, e-mail and social profiles from src/lib/site.js; register
// data from the same draft (see ../company.js).
import { DOMAIN, EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, REGISTER, SITE_NAME, SOCIAL_LINE, STREET_LINE } from "../company";
import { LEGAL_NAME } from "@/lib/site";

// Belegte Unternehmensangaben (02.11.2026), wörtlich wie auf der Live-Seite
// src/components/Impressum/impressum.js (CHAMBER, SHAREHOLDERS, REGISTER.purpose).
// Die Komponente lässt sich in node --test nicht laden (JSX), deshalb stehen die
// Werte hier noch einmal; Änderungen zuerst dort, dann hier nachziehen.
const BELEGT = {
  kammer: "Mitglied der Wirtschaftskammer Vorarlberg: Fachgruppe Gastronomie, Landesgruppe Elektro- und Einrichtungsfachhandel",
  kammerQuelle: "WKO Firmen A–Z, Eintrag MW Immobilienverwaltungs GmbH, abgerufen am 30.10.2026",
  beteiligungen: "Beteiligungsverhältnisse: Susanne Messmer 50 %, Andreas Wegscheider 50 %",
  beteiligungenQuelle: "firmenabc.at (Creditreform/Firmenbuch), vom Inhaber übermittelt am 30.10.2026",
};

const IMPRESSUM = {
  slug: "impressum",
  title: "Impressum",
  navLabel: "Impressum",
  livePath: "/impressum",
  lead: "Impressum mit allen Pflichtangaben nach ECG, UGB und Offenlegung nach MedienG – Variante A für den heutigen Rechtsträger. Stand 02.11.2026: belegte Unternehmensangaben (Kammer, Beteiligungen, Gegenstand) eingetragen; offen sind nur noch Angaben, die das Unternehmen oder die Kanzlei liefert.",
  sources: ["Marktresearch/recht/04-impressum-pflichtangaben.md, Abschnitt 5 (Variante A) und Abschnitt 1 (Ist-Analyse)", "Marktresearch/recht/00-rechtspaket-uebersicht.md, W1 (Hausnummer), W14 (Vertragspartner)"],
  version: "Informationen nach § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch (UGB) und Offenlegung nach § 25 Mediengesetz (MedienG)",
  knownErrors: [
    { id: "I1", title: "Sitz und Anschrift", text: "Live steht „Sitz: Landstraße 11, 6911 Lochau“. Sitz ist die Gemeinde laut Firmenbuch (Lochau), die Straße gehört zur Anschrift (§ 14 UGB, § 5 Abs 1 Z 2 ECG). Die Hausnummer 11 entspricht dem Firmenbuch (FN 443753 d); die Vorschau liest sie aus src/lib/site.js." },
    { id: "I2", title: "Drei Pflichtangaben fehlen live", text: "WKO-Mitgliedschaft (Kammer/Fachgruppen), Hinweis auf die Gewerbeordnung mit Zugang (RIS) und die Offenlegung nach § 25 MedienG." },
    { id: "I3", title: "Firmenbuchgericht und Werbetexte", text: "Live steht nur „Feldkirch“ statt „Landesgericht Feldkirch“; Werbe- und Fülltexte rund um die Pflichtangaben sollen entfallen (04, Abschn. 1)." },
  ],
  sections: [
    {
      id: "anbieter",
      num: "1",
      title: "Anbieter und Medieninhaber",
      source: "04, Abschn. 5, Variante A",
      blocks: [
        { address: [REGISTER.legalName, `Geschäftsbezeichnung: ${SITE_NAME}`, STREET_LINE] },
        { label: "Hinweis zur Vorschau", note: "Die Anschrift kommt aus src/lib/site.js. Der Entwurf nannte Hausnummer 11 mit dem Vermerk, das Unternehmen müsse sie bestätigen; maßgeblich ist bis zu einer Änderung die Firmenbuchadresse (Rechtspaket 00, W1). [vom Unternehmen zu bestätigen: amtliche Adresse bei der Gemeinde Lochau]" },
      ],
    },
    {
      id: "kontakt",
      num: "2",
      title: "Kontakt",
      source: "04, Abschn. 5, Variante A",
      blocks: [{ address: [`Telefon: [${PHONE_DISPLAY}](${PHONE_HREF})`, `E-Mail: [${EMAIL}](${EMAIL_HREF})`] }],
    },
    {
      id: "unternehmensdaten",
      num: "3",
      title: "Unternehmensdaten",
      source: "04, Abschn. 5, Variante A",
      blocks: [
        {
          ul: [
            `Rechtsform: ${REGISTER.legalForm}`,
            `Sitz: ${REGISTER.seat}`,
            `Firmenbuchnummer: ${REGISTER.fn}`,
            `Firmenbuchgericht: ${REGISTER.court}`,
            `UID-Nummer: ${REGISTER.uid} [vom Unternehmen auszufüllen: Gültigkeit per MIAS/FinanzOnline bestätigen]`,
            `Geschäftsführung: ${REGISTER.managers} (jeweils selbständig vertretungsbefugt) [vom Unternehmen auszufüllen: Vertretungsregel laut Firmenbuch bestätigen]`,
          ],
        },
      ],
    },
    {
      id: "gegenstand",
      num: "4",
      title: "Unternehmensgegenstand",
      source: "04, Abschn. 5, Variante A",
      blocks: ["Einrichtungsfachhandel, Gastgewerbe (Café), Immobilienverwaltung (laut Firmenbuchauszug; so auch auf der Live-Seite /impressum)."],
    },
    {
      id: "gewerberecht",
      num: "5",
      title: "Gewerberecht und Aufsicht",
      source: "04, Abschn. 5, Variante A; Abschn. 2.1–2.3",
      blocks: [
        {
          ul: [
            "Gewerbeberechtigungen laut WKO Firmen A–Z (30.10.2026): Einrichtungsfachhandel (Berufszweig Einrichtungsfachhandel) und Gastgewerbe (Berufszweig Kaffeehäuser), Standort 6911 Lochau",
            `${BELEGT.kammer} (Quelle: ${BELEGT.kammerQuelle})`,
            "Anwendbare Rechtsvorschriften: Gewerbeordnung 1994, abrufbar unter [www.ris.bka.gv.at](https://www.ris.bka.gv.at)",
            `Gewerbebehörde/Aufsichtsbehörde: ${REGISTER.authority}`,
            "[Nur falls zutreffend: Berufsbezeichnung … , verliehen in Österreich]",
          ],
        },
        { note: "Falls die MW GmbH das reglementierte Gewerbe Immobilientreuhänder ausübt, verlangt das Dienstleistungsgesetz Angaben zur Berufshaftpflichtversicherung – das betrifft die Immobilienverwaltung, nicht die Einrichtungs-Website. [anwaltlich prüfen, ob die MW GmbH dieses Gewerbe hat]" },
      ],
    },
    {
      id: "offenlegung",
      num: "6",
      title: "Offenlegung nach § 25 MedienG",
      source: "04, Abschn. 5, Variante A; Abschn. 2.4",
      blocks: [
        {
          ul: [
            `Medieninhaber: ${LEGAL_NAME}, Sitz ${REGISTER.seat} (Angaben siehe oben)`,
            `${BELEGT.beteiligungen} (Quelle: ${BELEGT.beteiligungenQuelle}) [vom Unternehmen zu bestätigen: Treuhandverhältnisse oder stille Beteiligungen – keine bzw. welche]`,
            "Grundlegende Richtung (Blattlinie): Information über die Produkte, Marken, Planungs- und Serviceleistungen von Platzhirsch Home Living sowie Einrichtungs- und Kaufratgeber für Kundinnen und Kunden in Österreich, Deutschland, der Schweiz und Liechtenstein.",
          ],
        },
        { note: "Empfehlung des Entwurfs: „große“ Offenlegung, weil Ratgeber- und Regionsseiten über reine Eigenwerbung hinausgehen können. [anwaltlich prüfen]" },
      ],
    },
    {
      id: "geltungsbereich",
      num: "7",
      title: "Geltungsbereich",
      source: "04, Abschn. 5, Variante A",
      blocks: [`Dieses Impressum gilt für ${DOMAIN} sowie für unsere Profile auf ${SOCIAL_LINE} und für unseren Newsletter. [vom Unternehmen auszufüllen: weitere Profile, z. B. Pinterest, YouTube, WhatsApp Business]`],
    },
    {
      id: "streitbeilegung",
      num: "8",
      title: "Streitbeilegung",
      source: "04, Abschn. 5, Variante A; Abschn. 2.6",
      blocks: [
        "[Option 1 – empfohlen] Wir sind bereit, an Verfahren zur alternativen Streitbeilegung vor der [Schlichtung für Verbrauchergeschäfte, www.verbraucherschlichtung.at / Internet Ombudsstelle, www.ombudsstelle.at] teilzunehmen. [anwaltlich prüfen, Stelle wählen]",
        "[Option 2] Wir sind weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        { note: "Kein Link auf die OS-Plattform der EU: seit 20.07.2025 abgeschaltet (VO (EU) 2024/3228; Rechtspaket 00, W4)." },
      ],
    },
    {
      id: "preisangaben",
      num: "9",
      module: true,
      title: "Preisangaben",
      source: "04, Abschn. 5, Variante A",
      blocks: ["[Erst aktivieren, wenn Preise online stehen] Alle Preise in Euro inklusive der gesetzlichen Umsatzsteuer. Liefer- und Montagekosten sind nicht enthalten, sofern nicht ausdrücklich angegeben; sie werden vor Vertragsabschluss genannt. Für Kundinnen und Kunden in der Schweiz und in Liechtenstein siehe [Seite Schweiz/Liechtenstein]."],
    },
    {
      id: "markenhinweis",
      num: "10",
      title: "Markenhinweis",
      source: "04, Abschn. 5, Variante A",
      blocks: ["Die genannten Marken- und Produktnamen sind Marken ihrer jeweiligen Inhaber. Ihre Nennung beschreibt Produkte, die in unserer Ausstellung gezeigt oder über uns bezogen werden können. Sie bedeutet keine Partnerschaft oder Vertragshändlerschaft, soweit diese nicht ausdrücklich angegeben ist. [anwaltlich prüfen; ClassiCon als belegter Händlereintrag darf genannt werden]"],
    },
    {
      id: "bildnachweise",
      num: "11",
      title: "Bildnachweise",
      source: "04, Abschn. 5, Variante A",
      blocks: ["[vom Unternehmen auszufüllen aus dem Bildregister: Fotografen, Herstellerfreigaben, Stockbilder]"],
    },
    {
      id: "dsa",
      num: "12",
      module: true,
      title: "Kontaktstelle nach Art. 11 und 12 DSA",
      source: "04, Abschn. 5, Variante A; Abschn. 2.5",
      blocks: [
        "[Vorbereitet, inaktiv bis Launch KI-Raumplaner/Bewertungen] **Kontaktstelle nach Art. 11 und 12 DSA:** dsa@platzhirsch.studio (Deutsch, Englisch) – [vom Unternehmen auszufüllen]",
        { note: "Wird mit öffentlich angezeigten Bewertungen, Galerie-Funktionen oder gespeicherten Kundenfotos (KI-Raumplaner, Upload) relevant: Speicherung von Informationen im Auftrag des Nutzers = Hostingdienst (Art. 3 lit g iii DSA). [anwaltlich prüfen, ob eine bloß kurzfristige Verarbeitung zur Bildberechnung schon „Hosting“ ist]" },
      ],
    },
    {
      id: "variante-b",
      num: "13",
      title: "Variante B – Handels-GmbH (nach Ausgliederung)",
      source: "04, Abschn. 5, Variante B",
      draftOnly: true,
      blocks: [
        "Wie Variante A, mit diesen Änderungen:",
        {
          ul: [
            `Anbieter und Medieninhaber: **[Firmenwortlaut, z. B. Platzhirsch Home Living GmbH]**, ${STREET_LINE}`,
            "FN [vom Unternehmen auszufüllen], Landesgericht Feldkirch; UID [vom Unternehmen auszufüllen]",
            "Geschäftsführung, Gesellschafter mit Anteilen [vom Unternehmen auszufüllen; bei Gesellschafter-GmbHs deren Gesellschafter ebenfalls nennen, § 25 Abs 2 MedienG]",
            "Unternehmensgegenstand: Handel mit Möbeln, Küchen, Leuchten, Outdoor-Möbeln und Wohnaccessoires; Einrichtungsplanung; Lieferung und Montage",
            "Gewerbe: Handelsgewerbe [ggf. weitere], WKO Vorarlberg, Sparte Handel, [Landesgremium]",
            `**Neuer Absatz „Verbundene Angebote“:** „Das Platzhirsch Café (platzhirsch.cafe) wird von der ${REGISTER.legalName}, ${STREET_LINE}, ${REGISTER.fn}, betrieben.“`,
            "Barrierefreiheit: Link auf `/barrierefreiheit` (Konformitätsinformation nach § 14 BaFG), sofern keine Kleinstunternehmen-Ausnahme",
            "Shop-Sprachen: Impressum, AGB, Widerrufsbelehrung in allen Sprachen, in denen verkauft wird (FAGG § 4)",
          ],
        },
        { label: "Rechtspaket 00, W14", note: "Bis zur Eintragung der Handels-GmbH ist die MW Immobilienverwaltungs GmbH Vertragspartnerin. Variante B erst mit Eintragung, FN und UID verwenden." },
      ],
    },
  ],
};

export default IMPRESSUM;
