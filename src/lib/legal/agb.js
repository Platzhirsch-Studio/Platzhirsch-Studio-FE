// src/lib/legal/agb.js — Allgemeine Geschäftsbedingungen (öffentliche Fassung).
//
// Eine Quelle für die Seite /[locale]/agb, den Kanzlei-Bericht
// (Platzhirsch-Status/berichte/AGB-KANZLEI-2026-11-02.md) und den Test
// tests/unit/agb-bereiche.test.mjs. Deutsch ist die verbindliche Fassung;
// EN/FR/IT zeigen den deutschen Text mit Hinweis (Legal/GermanOnlyNotice.js).
//
// Gliederung (Inhaber, 02.11.2026 – B2B und B2C durchgehend getrennt):
//   Teil I   Allgemein – gilt für alle Verträge
//   Teil II  Verbraucherinnen und Verbraucher (KSchG, FAGG, VGG)
//   Teil III Unternehmer (UGB, ABGB)
//   Teil IV  Besondere Bedingungen je Geschäftsbereich; sie gehen I–III vor
//
// Inhaber-Entscheidungen vom 02.11.2026 (inhaber-entscheidungen.md Nr. 37, 38):
//   - Vertragspartnerin ist die MW Immobilienverwaltungs GmbH (Impressum
//     Variante A), nicht eine künftige Gesellschaft.
//   - Gerichtsstand immer Wien: vereinbart für Unternehmer; für Verbraucher
//     gelten die gesetzlichen Gerichtsstände (§ 14 KSchG, Art. 18 EuGVVO).
//   - So weit zulässig zugunsten der GmbH, getrennt nach B2C und B2B;
//     KSchG-Grenzen (§§ 6, 9, 10 KSchG, § 879 Abs 3 ABGB) eingehalten,
//     Grenzfälle als Lücke für die Kanzlei.
//
// Regeln für den Text:
//   - Firmendaten nur aus src/lib/site.js; FN, Gericht und UID wie im
//     Impressum (src/components/Impressum/impressum.js, Test prüft Gleichheit).
//   - Keine erfundenen Zahlen: nur gesetzliche Fristen und Sätze
//     (14 Tage FAGG, zwei Jahre VGG, 4 % ABGB, 9,2 Prozentpunkte UGB) und die
//     Inhaber-Vorgabe „sechs Monate“ (Verjährung B2B, Teil III § 6). Alles
//     Unternehmerische heißt „laut Angebot“ oder „nach tatsächlichem Aufwand“.
//   - Lücken für die Kanzlei („[Kanzlei: …]“) gibt es seit dem 03.11.2026
//     nicht mehr: Der Inhaber meldet die Freigabe durch die Kanzlei
//     (Entscheidung Nr. 40); die 15 Lücken sind mit zurückhaltenden
//     Standardformulierungen geschlossen, dokumentiert zur Bestätigung in
//     Platzhirsch-Status/berichte/AGB-KANZLEI-2026-11-02.md (Stand 03.11.2026).
//     kanzleiLuecken() muss leer bleiben (Test); die Seite zeigt eine Lücke
//     weiter neutral („wird ergänzt“), falls je wieder eine entsteht.
//   - Widerrufsbelehrung außerhalb des Onlineshops: eigener Text
//     src/lib/legal/widerruf.js, Seite /widerruf (Entscheidung Nr. 39).
//   - „[Verbraucher]“ / „[Unternehmer]“ markieren in Teil IV Sätze, die nur
//     für die eine Gruppe gelten; die Seite hebt sie hervor.
//   - Keine Markennamen, keine Händler- oder Partneraussagen (claims.js).
//
// Rein: nur relative Importe (node --test).
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME, SITE_URL } from "../site.js";

/** „freigegeben“ seit 03.11.2026 (Inhaber: „AGB zur Kanzlei – alle geprüft und freigegeben“); vorher „entwurf“. */
export const AGB_STATUS = "freigegeben";
export const AGB_STAND = "2026-11-03";
export const AGB_TITLE = "Allgemeine Geschäftsbedingungen";
export const AGB_PATH = "/agb";

// Registerdaten wörtlich wie src/components/Impressum/impressum.js (REGISTER).
export const AGB_ANBIETER = Object.freeze({
  firma: LEGAL_NAME,
  marke: SITE_NAME,
  anschrift: `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`,
  fn: "FN 443753 d",
  gericht: "Landesgericht Feldkirch",
  uid: "ATU70035339",
  telefon: PHONE_DISPLAY,
  email: EMAIL,
  web: SITE_URL.replace(/^https?:\/\//, ""),
});

const A = AGB_ANBIETER;

// ------------------------------------------------------------------ Teil I

const TEIL_I = [
  {
    id: "i1",
    num: "§ 1",
    title: "Vertragspartnerin, Geltung, Aufbau",
    blocks: [
      `1.1 Vertragspartnerin ist die ${A.firma} („wir“, „${A.marke}“), ${A.anschrift}, ${A.fn}, ${A.gericht}, UID ${A.uid}, Telefon ${A.telefon}, E-Mail ${A.email}.`,
      "1.2 Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge, die Sie mit uns über Waren und Leistungen schließen: Möbel und Einrichtung, Küchen nach Maß, Küchen- und Elektrogeräte, Bad, Wellness, Whirlpool, Swim Spa und Sauna, Planung und Interior Design, Outdoor und Yacht-Interieur, den Onlineshop für Accessoires und Gutscheine – im Showroom, per E-Mail, Telefon oder Videoberatung und online.",
      "1.3 Aufbau. Teil I gilt für alle Verträge. Teil II gilt nur für Verbraucherinnen und Verbraucher, Teil III nur für Unternehmer im Sinne des § 1 KSchG. Teil IV enthält besondere Bedingungen je Geschäftsbereich; sie gehen den Teilen I bis III vor, soweit sie davon abweichen. Sätze in Teil IV, die nur für eine Gruppe gelten, sind mit [Verbraucher] oder [Unternehmer] gekennzeichnet.",
      "1.4 Abweichende oder ergänzende Bedingungen des Kunden gelten nur, wenn wir ihnen schriftlich zustimmen.",
      "1.5 Rechtsnachfolge. Wird unser Geschäftsbetrieb oder ein Geschäftsbereich auf eine andere Gesellschaft übertragen, gehen laufende Verträge mit allen Rechten und Pflichten auf diese Rechtsnachfolgerin über (§ 38 UGB). Wir informieren Sie schriftlich über den Übergang. Sie können dem Übergang binnen drei Monaten ab dieser Mitteilung widersprechen (§ 38 Abs 2 UGB); dann bleibt Ihr Vertrag mit uns bestehen. Ihre gesetzlichen Rechte gegen uns als bisherige Vertragspartnerin bleiben unberührt (§ 1409 ABGB).",
    ],
  },
  {
    id: "i2",
    num: "§ 2",
    title: "Angebote, Vertragsschluss, Sprache",
    blocks: [
      "2.1 Darstellungen auf unserer Website, in Katalogen, auf Social Media, in Merklisten und Planungswerkzeugen sind keine verbindlichen Angebote, sondern eine Einladung, eine Anfrage zu stellen. Eine Anfrage verpflichtet Sie zu nichts.",
      "2.2 Angebote erstellen wir schriftlich (Papier oder E-Mail/PDF). Ihre Gültigkeit steht im Angebot. Preise, Modelle und Materialien der Hersteller können sich ändern; nach Ablauf bestätigen wir ein Angebot gern neu.",
      "2.3 Der Vertrag kommt zustande, wenn Sie und wir die Auftragsbestätigung unterschreiben, wenn Sie unser Angebot schriftlich oder per E-Mail annehmen oder wenn wir Ihnen die Ware übergeben. Bei Verträgen per E-Mail, Telefon oder Video bestätigen wir den Vertrag auf einem dauerhaften Datenträger (§ 7 FAGG). Für den Onlineshop gilt Teil IV § 7.",
      "2.4 Änderungen und Ergänzungen des Vertrags halten wir schriftlich fest; E-Mail genügt. Für Verbraucher gilt Teil II § 1.2, für Unternehmer Teil III § 1.3.",
      "2.5 Vertragssprache ist Deutsch. Fassungen in anderen Sprachen dienen der Information; maßgeblich ist die deutsche Fassung.",
    ],
  },
  {
    id: "i3",
    num: "§ 3",
    title: "Preise, Zahlung, Anzahlung",
    blocks: [
      "3.1 Preise sind in Euro angegeben, sofern nicht ausdrücklich ein Preis in Schweizer Franken vereinbart ist (Teil IV § 10). Ob sie die Umsatzsteuer enthalten, regeln Teil II § 2 und Teil III § 2.",
      "3.2 Lieferung, Montage, Aufmaß, Entsorgung von Verpackung oder Altware und Einlagerung sind nur im Preis enthalten, wenn Angebot oder Auftragsbestätigung dies ausdrücklich ausweisen. Sonst nennen wir diese Kosten vor Vertragsschluss gesondert.",
      "3.3 Der Preis ist bei Lieferung bzw. Übergabe fällig; bei Leistungen mit Montage oder Abnahme ist der Restbetrag bei Abnahme fällig. Ein abweichender Zahlungsplan steht im Angebot.",
      "3.4 Eine Anzahlung schulden Sie nur, wenn das Angebot sie vorsieht; Höhe und Fälligkeit stehen dort. Sieht das Angebot eine Anzahlung vor, beträgt sie höchstens die Hälfte des Auftragswerts und ist mit der Auftragsbestätigung fällig; sie wird auf den Preis angerechnet, der Restbetrag ist nach § 3.3 fällig. Näheres in Teil IV § 9.",
      "3.5 Sie zahlen per Überweisung oder im Showroom mit Karte; im Onlineshop über den dort genannten Zahlungsdienstleister (Teil IV § 7). Für die Nutzung einer Zahlungsart verlangen wir kein zusätzliches Entgelt.",
      "3.6 Zahlungsverzug. Geraten Sie mit einer fälligen Zahlung in Verzug, dürfen wir noch offene Lieferungen und Leistungen zurückhalten und, nach schriftlicher Nachfrist, vom Vertrag zurücktreten (§ 918 ABGB). Verzugszinsen und Kosten: Teil II § 3 und Teil III § 3.",
    ],
  },
  {
    id: "i4",
    num: "§ 4",
    title: "Lieferung, Termine, höhere Gewalt, Hersteller",
    blocks: [
      "4.1 Liefer- und Montagetermine sind unverbindlich, sofern wir sie nicht schriftlich ausdrücklich als Fixtermin bezeichnet haben. Die voraussichtliche Lieferzeit steht im Angebot bzw. in der Auftragsbestätigung; nach Bestätigung durch den Hersteller nennen wir Ihnen den konkreten Termin. Für Verbraucher gilt ergänzend Teil II § 4.1.",
      "4.2 Höhere Gewalt und Störungen der Lieferkette. Ereignisse, die wir nicht zu vertreten haben – etwa Streik, Aussperrung, Naturereignisse, Epidemien, behördliche Maßnahmen, Krieg, Energie- und Rohstoffmangel, Ausfall von Transportwegen, Betriebsstörungen bei Herstellern oder Vorlieferanten –, verlängern die Lieferzeit um die Dauer der Behinderung zuzüglich einer angemessenen Anlaufzeit. Wir informieren Sie unverzüglich und nennen einen neuen Termin. Dauert die Behinderung unabsehbar lange an, können beide Seiten vom noch nicht erfüllten Teil des Vertrags zurücktreten; geleistete Zahlungen für diesen Teil erstatten wir.",
      `4.3 Herstellerverzug, Nichtbelieferung, Herstellerinsolvenz. Liefert ein Hersteller oder Vorlieferant verspätet, gar nicht oder wird er insolvent, ohne dass wir das zu vertreten haben, haben wir diesen Umstand nicht zu vertreten. Wir informieren Sie unverzüglich und bieten Ihnen, soweit möglich, eine gleichwertige Alternative an. Nehmen Sie die Alternative nicht an oder gibt es keine, dürfen beide Seiten vom betroffenen Teil des Vertrags zurücktreten; geleistete Zahlungen für diesen Teil erstatten wir unverzüglich. Unser Rücktrittsrecht besteht nur, wenn wir die Nichtbelieferung nicht zu vertreten haben, Sie unverzüglich informiert und Ihnen die Alternative oder die Erstattung angeboten haben; gesetzliche Ansprüche wegen eines Verzugs, den wir zu vertreten haben, bleiben unberührt.`,
      "4.4 Änderungen durch den Hersteller. Hersteller können Modelle, Materialien, Bezüge, Farben, Maße oder technische Details im Rahmen der Produktpflege ändern. Solche Änderungen sind zulässig, soweit sie geringfügig, sachlich gerechtfertigt und für Sie zumutbar sind und die Gebrauchstauglichkeit und das Erscheinungsbild nicht wesentlich verändern; darüber hinausgehende Änderungen gelten nur mit Ihrer Zustimmung.",
      "4.5 Teillieferungen sind zulässig, wenn sie Ihnen zumutbar sind und keine zusätzlichen Kosten verursachen. Bei Küchen und Einbauten ist die Montage erst nach Lieferung aller wesentlichen Teile geschuldet.",
      "4.6 Annahmeverzug. Nehmen Sie die Ware zum vereinbarten Termin nicht an oder fehlen die bauseitigen Voraussetzungen (§ 5), dürfen wir die Ware bei uns oder bei einer Spedition auf Ihre Kosten einlagern. Kosten für Lagerung, vergebliche Anfahrt und Mehraufwand berechnen wir laut Angebot, sonst nach tatsächlichem Aufwand. Mit dem Annahmeverzug geht die Gefahr des zufälligen Untergangs und der Verschlechterung auf Sie über (§ 1419 ABGB). Für Verbraucher gilt ergänzend Teil II § 4.3.",
      "4.7 Versicherung. Lagern Sie Ware bei Dritten ein oder beauftragen Sie selbst ein Transportunternehmen, sorgen Sie für eine ausreichende Versicherung gegen Transport- und Lagerschäden; wir haften für diese Dritten nicht.",
      "4.8 Transportschäden zeigen Sie bitte sofort bei der Übernahme auf dem Lieferschein an und melden sie uns. Für Unternehmer gilt § 377 UGB (Teil III § 4.3); für Verbraucher ist das eine Bitte zur leichteren Abwicklung, keine Voraussetzung ihrer Rechte.",
    ],
  },
  {
    id: "i5",
    num: "§ 5",
    title: "Ihre Mitwirkung, bauseitige Voraussetzungen, andere Gewerke",
    blocks: [
      "5.1 Sie sorgen rechtzeitig für alles, was in Ihrem Bereich liegt: freie Zufahrt und Zugang (Parkmöglichkeit, Aufzug oder ausreichend breite Treppenhäuser und Türen), richtige Maße und Pläne, fachgerecht hergestellte Anschlüsse für Strom, Wasser, Abwasser, Abluft und gegebenenfalls Gas an der im Installationsplan vorgesehenen Stelle, ausreichende Tragfähigkeit von Böden, Wänden, Decken und Fundamenten, erforderliche behördliche Bewilligungen und Zustimmungen (etwa von Vermietern oder Miteigentümern) sowie die Anwesenheit einer berechtigten Person beim Termin.",
      "5.2 Angaben, Maße und Pläne, die Sie, Ihr Architekturbüro, Ihre Baufirma oder Ihre Gewerke liefern, sind für uns verbindlich. Für Abweichungen, Mehrkosten und Schäden, die auf unrichtigen oder unvollständigen Angaben beruhen, haften wir nicht; Mehrkosten gehen zu Ihren Lasten. Unsere Warnpflicht nach § 1168a ABGB bleibt unberührt.",
      "5.3 Andere Gewerke. Elektro-, Gas-, Wasser- und Sanitärinstallationen, Bauarbeiten, Statik, Gartenbau, Werft- und Sattlerarbeiten führen allein befugte Fachbetriebe aus. Beauftragen Sie diese Betriebe selbst, sind sie Ihre eigenen Vertragspartner; wir haften nicht für deren Leistung, auch dann nicht, wenn wir den Betrieb empfohlen oder Termine mit ihm abgestimmt haben. Solche Arbeiten sind nur unsere Leistung, wenn das Angebot sie ausdrücklich enthält; dann gilt § 1313a ABGB.",
      "5.4 Koordination. Übernehmen wir die Koordination anderer Gewerke, umfasst das die Abstimmung von Terminen, Lieferfenstern und Gestaltung. Sie ist keine Bauleitung, keine örtliche Bauaufsicht, keine Bauführung und keine Koordination im Sinne des Bauarbeitenkoordinationsgesetzes; diese Aufgaben übernimmt ein von Ihnen beauftragter befugter Baumeister oder Planer bzw. Sie als Bauherrin oder Bauherr.",
    ],
  },
  {
    id: "i6",
    num: "§ 6",
    title: "Beschaffenheit, Muster, Naturmaterial, Visualisierungen, Beratung",
    blocks: [
      "6.1 Naturmaterialien. Holz, Furnier, Leder, Naturstein, Keramik und Textilien sind Naturprodukte oder von Hand verarbeitete Materialien. Abweichungen in Farbe, Maserung, Struktur, Narbung und Glanz gegenüber Mustern, Fotos und Ausstellungsstücken, das Arbeiten von Holz bei wechselnder Luftfeuchtigkeit, Nachdunkeln oder Ausbleichen durch Licht, Sitzspiegel und nachlassende Polsterhärte im üblichen Umfang sowie Farbabweichungen zwischen Stoffmuster und Lieferung (Färbepartien, Chargen) sind materialtypisch und vertragsgemäß.",
      "6.2 Muster und Bildschirm. Farben auf der Website, in Katalogen, Visualisierungen und Planungswerkzeugen hängen von Gerät, Druck und Licht ab. Maßgeblich ist das Originalmuster; Abweichungen gegenüber Bildschirm- und Druckdarstellungen sind kein Mangel.",
      "6.3 Visualisierungen, Renderings, 3D-Modelle und Planungsbilder zeigen Wirkung und Proportion. Sie sind unverbindlich; Farben, Materialwirkung, Lichtstimmung und Details können vom Original abweichen. Verbindlich sind nur Maße, Modelle und Ausführungen in der Auftragsbestätigung.",
      "6.4 Beratung. Unsere Beratung bezieht sich auf Gestaltung, Funktion und Materialwahl der angebotenen Waren und Leistungen. Für die bauphysikalische, statische, brandschutz- oder haustechnische Eignung Ihres Gebäudes, Bootes oder Grundstücks übernehmen wir keine Gewähr, soweit die Prüfung nicht ausdrücklich beauftragt ist; dafür ziehen Sie befugte Fachleute bei.",
      "6.5 Für Verbraucher gilt: Besonderheiten eines konkreten Stücks (etwa eine bestimmte Steinplatte, ein Ausstellungsstück mit Gebrauchsspuren) gelten als vereinbart, wenn wir Sie vor Vertragsschluss eigens darauf hingewiesen haben und Sie ausdrücklich und gesondert zugestimmt haben (§ 6 Abs 1 VGG).",
    ],
  },
  {
    id: "i7",
    num: "§ 7",
    title: "Eigentumsvorbehalt",
    blocks: [
      "7.1 Die Ware bleibt bis zur vollständigen Bezahlung aller Forderungen aus dem jeweiligen Vertrag unser Eigentum. Bis dahin dürfen Sie sie nicht verkaufen, verpfänden oder zur Sicherheit übereignen. Bei Pfändung oder sonstigem Zugriff Dritter informieren Sie uns bitte sofort und weisen auf unser Eigentum hin.",
      "7.2 Werden Waren fest in ein Gebäude eingebaut (etwa Küchen, Einbaumöbel, Steinplatten), bleiben unsere Zahlungsansprüche davon unberührt. Soweit Teile durch den Einbau unselbständige Bestandteile des Gebäudes werden und unser Eigentumsvorbehalt dadurch erlischt (§§ 294 ff. ABGB), bleibt der volle Preis geschuldet; der Montage von Vorbehaltsware vor vollständiger Bezahlung stimmen wir nur unter dieser Voraussetzung zu. Bewegliche Teile wie Geräte, Leuchten und lose Möbel bleiben bis zur vollständigen Bezahlung Vorbehaltsware.",
      "7.3 Bei Lieferung in die Schweiz wirkt der Eigentumsvorbehalt nur mit Eintragung im Eigentumsvorbehaltsregister an Ihrem Wohnsitz (Art. 715 ZGB). Sie stimmen der Eintragung zu, wenn wir sie verlangen. Im Übrigen gilt Teil IV § 10.",
      "7.4 Für Unternehmer gilt ergänzend Teil III § 7.",
    ],
  },
  {
    id: "i8",
    num: "§ 8",
    title: "Haftung – gemeinsame Regeln",
    blocks: [
      "8.1 Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit, für Personenschäden sowie nach dem Produkthaftungsgesetz. Die weiteren Regeln stehen in Teil II § 6 (Verbraucher) und Teil III § 6 (Unternehmer).",
      "8.2 Wir haften nicht für Schäden und Mängel, die darauf beruhen, dass Sie oder Dritte Waren selbst montieren oder anschließen, sie unsachgemäß nutzen, Bedienungs-, Pflege- oder Wartungsanleitungen des Herstellers nicht beachten, eigenmächtig Änderungen oder Reparaturen vornehmen oder unrichtige Angaben zu Maßen, Anschlüssen, Tragfähigkeit oder Nutzung machen (§ 5.2).",
      "8.3 Mitverschulden. Haben Sie oder Personen, für die Sie einzustehen haben, zu einem Schaden beigetragen, mindert sich unser Ersatz entsprechend (§ 1304 ABGB).",
      "8.4 Bei Montagearbeiten (etwa Bohren in Wände, Böden und Decken) haften wir für Schäden an Leitungen nur, wenn wir sie nach den uns vorgelegten Plänen oder bei gebotener Sorgfalt erkennen konnten.",
      "8.5 Vertragsstrafen, Pönalen oder pauschalierter Schadenersatz zu unseren Lasten schulden wir nur, wenn sie ausdrücklich und schriftlich vereinbart sind.",
    ],
  },
  {
    id: "i9",
    num: "§ 9",
    title: "Datenschutz, Referenzen",
    blocks: [
      `9.1 Wie wir personenbezogene Daten verarbeiten, steht in unserer Datenschutzerklärung unter ${A.web}/datenschutz.`,
      "9.2 Referenzen. Fotos Ihres Projekts, Ihren Namen oder den Namen Ihres Unternehmens verwenden wir als Referenz nur, wenn Sie dem ausdrücklich und gesondert zugestimmt haben (Zustimmungsfeld in der Auftragsbestätigung oder gesonderte Erklärung). Die Zustimmung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.",
    ],
  },
  {
    id: "i10",
    num: "§ 10",
    title: "Anwendbares Recht, Schlussbestimmungen",
    blocks: [
      "10.1 Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts (CISG) und der Verweisungsnormen des internationalen Privatrechts. Für Verbraucher mit gewöhnlichem Aufenthalt in einem anderen Staat gilt Teil II § 8.1.",
      "10.2 Gerichtsstand: Teil II § 8 (Verbraucher) und Teil III § 9 (Unternehmer).",
      "10.3 Ist eine Bestimmung dieser AGB unwirksam, bleiben die übrigen wirksam. Was an die Stelle der unwirksamen Bestimmung tritt, regeln Teil II § 9.1 und Teil III § 10.1.",
      "10.4 Änderungen dieser AGB gelten nur für Verträge, die nach der Änderung geschlossen werden. Es gilt die Fassung, die zum Zeitpunkt Ihres Vertragsschlusses auf unserer Website abrufbar ist; frühere Fassungen archivieren wir und stellen sie Ihnen auf Wunsch zur Verfügung.",
    ],
  },
];

// ------------------------------------------------------------------ Teil II

const TEIL_II = [
  {
    id: "ii1",
    num: "§ 1",
    title: "Geltung, Zusagen",
    blocks: [
      "1.1 Dieser Teil gilt für Verbraucherinnen und Verbraucher im Sinne des § 1 KSchG. Er geht Teil I vor, soweit er davon abweicht. Rechte, die Ihnen das KSchG, das FAGG oder das VGG zwingend einräumen, werden durch diese AGB nicht eingeschränkt.",
      "1.2 Zusagen unserer Mitarbeiterinnen und Mitarbeiter sind auch mündlich wirksam (§ 10 Abs 3 KSchG). Wir nehmen sie in die Auftragsbestätigung auf, damit beide Seiten Klarheit haben; bitte prüfen Sie die Auftragsbestätigung darauf.",
    ],
  },
  {
    id: "ii2",
    num: "§ 2",
    title: "Preise",
    blocks: [
      "2.1 Alle Preise sind Endpreise in Euro einschließlich der gesetzlichen österreichischen Umsatzsteuer, sofern nicht ausdrücklich ein Preis in Schweizer Franken vereinbart ist (Teil IV § 10).",
      "2.2 Der Preis der Auftragsbestätigung ist fest, wenn die Lieferung innerhalb von zwei Monaten nach Vertragsschluss erfolgen soll (§ 6 Abs 2 Z 4 KSchG). Für spätere Liefertermine gilt: Erhöht oder senkt der Hersteller, der Frachtführer oder eine Behörde nach Vertragsschluss nachweislich die Einkaufspreise, Frachten, Zölle oder Abgaben für die bestellte Ware, ohne dass wir das beeinflussen können, ändert sich der Preis für noch nicht gelieferte Teile im selben Umfang – nach oben wie nach unten (§ 6 Abs 1 Z 5 KSchG). Wir teilen Ihnen die Änderung schriftlich mit und legen sie auf Verlangen offen. Übersteigt eine Erhöhung ein Zehntel des vereinbarten Preises, können Sie binnen vierzehn Tagen ab der Mitteilung vom Vertrag zurücktreten; geleistete Zahlungen erstatten wir dann unverzüglich.",
    ],
  },
  {
    id: "ii3",
    num: "§ 3",
    title: "Zahlungsverzug, Aufrechnung, Sicherheiten",
    blocks: [
      "3.1 Bei Zahlungsverzug schulden Sie die gesetzlichen Verzugszinsen von 4 % pro Jahr (§ 1000 Abs 1 ABGB) sowie die notwendigen und zweckentsprechenden Mahn- und Inkassokosten, soweit sie in einem angemessenen Verhältnis zur Forderung stehen (§ 1333 Abs 2 ABGB), nach tatsächlichem Aufwand.",
      "3.2 Sie dürfen mit Gegenforderungen aufrechnen, wenn wir zahlungsunfähig sind oder wenn Ihre Gegenforderung mit Ihrer Verbindlichkeit in rechtlichem Zusammenhang steht, gerichtlich festgestellt oder von uns anerkannt ist (§ 6 Abs 1 Z 8 KSchG). Ihr Recht, bei Mängeln einen angemessenen Teil des Preises zurückzubehalten (§ 1052 ABGB), bleibt unberührt.",
      "3.3 Wird nach Vertragsschluss über Ihr Vermögen ein Insolvenzverfahren eröffnet, richtet sich die weitere Erfüllung des Vertrags nach der Insolvenzordnung (§ 21 IO). Wird ein Insolvenzantrag mangels kostendeckenden Vermögens abgewiesen oder bleiben Sie mit einer fälligen Zahlung trotz schriftlicher Nachfrist in Verzug, dürfen wir noch offene Lieferungen von einer Vorauszahlung oder Sicherheit abhängig machen und, wenn sie trotz weiterer Nachfrist nicht geleistet wird, vom Vertrag zurücktreten (§ 918 ABGB). Ihre Rechte aus § 3.2 bleiben unberührt.",
    ],
  },
  {
    id: "ii4",
    num: "§ 4",
    title: "Lieferung, Gefahrübergang",
    blocks: [
      "4.1 Die im Angebot bzw. in der Auftragsbestätigung genannte Lieferzeit gilt Ihnen gegenüber als vereinbart; nennen wir Ihnen nach der Bestätigung des Herstellers einen konkreten Termin, gilt dieser. Die Lieferzeit verlängert sich nur in den Fällen von Teil I § 4.2 und § 4.3 sowie um die Zeit, in der bauseitige Voraussetzungen fehlen (Teil I § 5). Ist keine Lieferzeit vereinbart, gilt die gesetzliche Lieferfrist (§ 7a KSchG). Rücktritt wegen Verzugs setzt eine angemessene Nachfrist voraus; Ihre Rechte nach § 7a Abs 2 KSchG bleiben unberührt.",
      "4.2 Liefern wir oder ein von uns beauftragtes Transportunternehmen, geht die Gefahr erst mit der Übergabe an Sie oder an eine von Ihnen benannte Person (nicht den Beförderer) über, bei Lieferung mit Montage mit Abschluss der Montage (§ 7b KSchG). Bei Abholung geht die Gefahr mit der Übergabe an Sie oder Ihre Beauftragten über.",
      "4.3 Bei Annahmeverzug (Teil I § 4.6) können Sie nachweisen, dass Sie das Hindernis nicht zu vertreten haben oder dass uns ein geringerer Aufwand entstanden ist.",
    ],
  },
  {
    id: "ii5",
    num: "§ 5",
    title: "Gewährleistung",
    blocks: [
      "5.1 Es gilt das gesetzliche Gewährleistungsrecht: das Verbrauchergewährleistungsgesetz (VGG) bei Waren und die §§ 922 ff. ABGB bei sonstigen Leistungen.",
      "5.2 Wir leisten Gewähr für Mängel, die bei Übergabe vorliegen und innerhalb von zwei Jahren ab Übergabe hervorkommen (§ 10 Abs 1 VGG). Kommt ein Mangel innerhalb eines Jahres ab Übergabe hervor, wird vermutet, dass er schon bei Übergabe bestand (§ 11 VGG). Mängel, die auf einer von uns oder unseren Erfüllungsgehilfen unsachgemäß ausgeführten Montage beruhen, sind ebenfalls Mängel (§ 8 VGG).",
      "5.3 Sie können zunächst zwischen Verbesserung (Reparatur) und Austausch wählen, es sei denn, die gewählte Abhilfe ist unmöglich oder für uns, verglichen mit der anderen, mit einem unverhältnismäßig hohen Aufwand verbunden (§ 12 Abs 2 VGG). Wählen Sie die Verbesserung und stellen wir damit den mangelfreien Zustand her, verlängert sich die Gewährleistungsfrist einmal um ein Jahr (§ 10 Abs 2a VGG); darüber informieren wir Sie vor der Abhilfe (§ 12 Abs 2a VGG). Preisminderung oder Vertragsauflösung können Sie unter den Voraussetzungen des § 12 Abs 4 VGG verlangen; bei einem geringfügigen Mangel ist die Auflösung ausgeschlossen (§ 12 Abs 5 VGG). Die Abhilfe erfolgt dort, wo sich die Ware bestimmungsgemäß befindet, ohne Kosten für Sie.",
      "5.4 Kein Mangel sind übliche Abnutzung und Verschleiß, Schäden aus den in Teil I § 8.2 genannten Gründen sowie die materialtypischen Eigenschaften nach Teil I § 6; Besonderheiten eines konkreten Stücks gelten nur unter den Voraussetzungen von Teil I § 6.5 als vereinbart.",
      "5.5 Herstellergarantien gelten zusätzlich zur gesetzlichen Gewährleistung und schränken sie nicht ein. Inhalt, Dauer und Garantiegeber nennen wir Ihnen schriftlich, wenn uns der Hersteller die Garantie bestätigt hat.",
      `5.6 Bitte melden Sie Mängel an ${A.email} oder telefonisch unter ${A.telefon}. Ihre Rechte hängen nicht davon ab, dass Sie den Mangel innerhalb einer bestimmten Frist melden.`,
    ],
  },
  {
    id: "ii6",
    num: "§ 6",
    title: "Haftung",
    blocks: [
      "6.1 Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit, für Personenschäden sowie nach dem Produkthaftungsgesetz (Teil I § 8.1).",
      "6.2 Für Sachschäden, die wir oder unsere Erfüllungsgehilfen leicht fahrlässig verursachen, haften wir nicht (§ 6 Abs 1 Z 9 KSchG). Das gilt nicht für Schäden an der Sache, die Gegenstand des Vertrags ist, und nicht für die Verletzung wesentlicher Vertragspflichten, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags erst ermöglicht und auf deren Einhaltung Sie vertrauen dürfen; insoweit haften wir auch bei leichter Fahrlässigkeit, begrenzt auf den vertragstypischen, vorhersehbaren Schaden. Ihre Gewährleistungsrechte bleiben unberührt.",
      "6.3 Die Beweislast richtet sich nach dem Gesetz (§ 1298 ABGB); eine Verkürzung der gesetzlichen Verjährung von Schadenersatzansprüchen vereinbaren wir mit Verbrauchern nicht.",
    ],
  },
  {
    id: "ii7",
    num: "§ 7",
    title: "Rücktrittsrecht im Fernabsatz, Storno",
    blocks: [
      "7.1 Schließen Sie einen Vertrag nur über Fernkommunikationsmittel (Onlineshop, E-Mail, Telefon, Video) oder außerhalb unserer Geschäftsräume (etwa bei Ihnen zu Hause beim Aufmaß), können Sie binnen 14 Tagen ohne Angabe von Gründen zurücktreten (§ 11 FAGG). Die Frist beginnt bei Waren mit dem Tag, an dem Sie oder eine von Ihnen benannte Person (nicht der Beförderer) die Ware bzw. die letzte Teillieferung in Besitz nehmen, bei Dienstleistungen mit Vertragsschluss. Für Verträge, die im Showroom geschlossen werden, besteht kein gesetzliches Rücktrittsrecht.",
      "7.2 Kein Rücktrittsrecht besteht insbesondere bei Waren, die nach Ihren Vorgaben angefertigt oder eindeutig auf Ihre persönlichen Bedürfnisse zugeschnitten werden – Maß- und Sonderanfertigungen, Möbel in gewählten Maßen, Bezügen, Hölzern oder Farben, Küchen, Einbauten, Platten nach Maß (§ 18 Abs 1 Z 3 FAGG), und zwar auch dann, wenn mit der Herstellung noch nicht begonnen wurde; bei Dienstleistungen, die auf Ihr ausdrückliches Verlangen vor Ablauf der Frist vollständig erbracht wurden, wenn Sie bestätigt haben, dass Sie damit Ihr Rücktrittsrecht verlieren (§ 18 Abs 1 Z 1 FAGG); bei versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nach Entfernen der Versiegelung nicht zur Rückgabe geeignet sind (§ 18 Abs 1 Z 5 FAGG). Auf den Ausschluss weisen wir Sie vor Vertragsschluss gesondert hin.",
      `7.3 Den Rücktritt erklären Sie per E-Mail an ${A.email}, per Brief oder mit dem Muster-Widerrufsformular; im Onlineshop zusätzlich über die dort genannte Funktion. Wir erstatten alle Zahlungen einschließlich der Standard-Lieferkosten binnen 14 Tagen ab Zugang Ihres Rücktritts mit demselben Zahlungsmittel; wir dürfen die Erstattung zurückhalten, bis wir die Ware zurückerhalten haben oder Sie die Rücksendung nachgewiesen haben. Für einen Wertverlust haften Sie nur, wenn er auf einen zur Prüfung der Beschaffenheit nicht notwendigen Umgang zurückgeht. Die unmittelbaren Kosten der Rücksendung tragen Sie; bei Waren, die nicht auf dem normalen Postweg zurückgesendet werden können, werden sie auf höchstens etwa den Betrag geschätzt, der im Angebot bzw. in der Auftragsbestätigung für die Lieferung an Sie ausgewiesen ist. Wurde solche Ware bei einem außerhalb unserer Geschäftsräume geschlossenen Vertrag schon bei Vertragsschluss zu Ihnen geliefert, holen wir sie auf unsere Kosten ab (§ 15 FAGG). Die vollständige Widerrufsbelehrung mit dem Muster-Widerrufsformular finden Sie unter ${A.web}/widerruf; für Bestellungen im Onlineshop gilt dessen Widerrufsbelehrung (Teil IV § 7).`,
      "7.4 Verlangen Sie ausdrücklich, dass wir mit einer Planung vor Ablauf der Rücktrittsfrist beginnen, und treten Sie dann zurück, zahlen Sie den anteiligen Betrag für die bis dahin erbrachte Leistung (§ 16 FAGG).",
      `7.5 Storno außerhalb eines gesetzlichen Rücktrittsrechts. Eine Bestellung können Sie bis zu Ihrer Freigabe nach Teil IV § 1.3 bzw. § 2.3 kostenlos zurückziehen. Danach lässt sich der Vertrag nur einvernehmlich auflösen; wir berechnen dann den uns tatsächlich entstandenen Aufwand, insbesondere Stornokosten des Herstellers sowie erbrachte Planungs- und Transportleistungen. Den Nachweis eines geringeren Aufwands können Sie jederzeit führen. Als Aufwand gelten insbesondere die vom Hersteller bestätigten Stornokosten, bereits erbrachte Planungs-, Aufmaß- und Transportleistungen nach Teil IV sowie von uns bezahlte Fremdleistungen; wir belegen ihn Ihnen auf Verlangen. Einen Pauschalbetrag für das Storno vereinbaren wir mit Verbrauchern nicht; ein im Einzelfall vereinbartes Reugeld unterliegt dem richterlichen Mäßigungsrecht (§ 7 KSchG, § 1336 Abs 2 ABGB).`,
    ],
  },
  {
    id: "ii8",
    num: "§ 8",
    title: "Günstigkeitsprinzip, Gerichtsstand, Streitbeilegung",
    blocks: [
      "8.1 Haben Sie Ihren gewöhnlichen Aufenthalt in einem anderen Staat, bleibt Ihnen der Schutz der zwingenden Bestimmungen des Rechts dieses Staates erhalten, soweit sie für Sie günstiger sind (Art. 6 Abs 2 Rom-I-VO); für Kunden in Deutschland betrifft das insbesondere die §§ 305 ff., 312 ff., 355 ff. und 474 ff. BGB.",
      `8.2 Für Verbraucherinnen und Verbraucher gelten die gesetzlichen Gerichtsstände; eine Gerichtsstandsvereinbarung treffen wir mit Ihnen nicht. Haben Sie Wohnsitz, gewöhnlichen Aufenthalt oder Beschäftigungsort in Österreich, können wir Sie nur bei dem dafür zuständigen Gericht klagen (§ 14 KSchG). Wohnen Sie in einem anderen EU-Staat, können Sie uns in Österreich oder an Ihrem Wohnsitz klagen, wir Sie nur an Ihrem Wohnsitz (Art. 17 und 18 EuGVVO); für Wohnsitz in der Schweiz gelten Art. 15 und 16 des Lugano-Übereinkommens. Haben Sie Ihren Wohnsitz in Liechtenstein oder in einem anderen Staat außerhalb der Europäischen Union und der Schweiz, richtet sich die Zuständigkeit nach der Jurisdiktionsnorm und den anwendbaren Staatsverträgen; auch dann treffen wir keine Gerichtsstandsvereinbarung mit Ihnen. Die in Teil III § 9 nur mit Unternehmern vereinbarte Zuständigkeit der Gerichte in Wien erstreckt sich nicht auf Verbraucherinnen und Verbraucher.`,
      `8.3 Beschwerden richten Sie bitte an ${A.email} oder ${A.telefon}; wir bemühen uns, jedes Anliegen direkt mit Ihnen zu lösen. Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und haben uns dazu auch nicht verpflichtet (§ 19 AStG). Eine Plattform der Europäischen Union zur Online-Streitbeilegung besteht nicht mehr.`,
    ],
  },
  {
    id: "ii9",
    num: "§ 9",
    title: "Teilunwirksamkeit",
    blocks: ["9.1 Ist eine Bestimmung dieser AGB Ihnen gegenüber unwirksam, tritt an ihre Stelle das Gesetz; die übrigen Bestimmungen bleiben wirksam."],
  },
];

// ------------------------------------------------------------------ Teil III

const TEIL_III = [
  {
    id: "iii1",
    num: "§ 1",
    title: "Geltung, Rangfolge, Form",
    blocks: [
      "1.1 Dieser Teil gilt für Unternehmer im Sinne des § 1 KSchG (etwa Hotels, Gastronomie, Bauträger, Architektur- und Planungsbüros, Firmen). Er geht Teil I vor, soweit er davon abweicht.",
      "1.2 Rangfolge: (1) Projektvertrag oder Verhandlungsprotokoll, (2) Auftragsbestätigung mit Leistungsverzeichnis, (3) Teil IV, (4) Teil III, (5) Teil I. Einkaufs- oder Auftragsbedingungen des Kunden werden auch dann nicht Vertragsinhalt, wenn wir ihnen nicht ausdrücklich widersprechen oder vorbehaltlos liefern.",
      "1.3 Mündliche Nebenabreden, Zusagen und nachträgliche Änderungen gelten nur, wenn wir sie schriftlich bestätigen; E-Mail genügt.",
    ],
  },
  {
    id: "iii2",
    num: "§ 2",
    title: "Preise",
    blocks: [
      "2.1 Preise verstehen sich netto zuzüglich Umsatzsteuer, wenn das Angebot sie so ausweist; sonst sind sie Endpreise.",
      "2.2 Erhöhen Hersteller, Frachtführer oder Behörden nach Vertragsschluss nachweislich ihre Preise, Frachten oder Abgaben, dürfen wir den Preis für noch nicht gelieferte Teile im selben Umfang anpassen; Senkungen geben wir im selben Umfang weiter.",
    ],
  },
  {
    id: "iii3",
    num: "§ 3",
    title: "Zahlung, Sicherheiten, Aufrechnung, Abtretung",
    blocks: [
      "3.1 Bei Zahlungsverzug schulden Sie Verzugszinsen von 9,2 Prozentpunkten über dem Basiszinssatz (§ 456 UGB), die gesetzliche Pauschale für Betreibungskosten (§ 458 UGB) und darüber hinaus die tatsächlich entstandenen Mahn-, Inkasso- und Rechtsverfolgungskosten.",
      "3.2 Bestehen nach Vertragsschluss berechtigte Zweifel an Ihrer Zahlungsfähigkeit – etwa durch Zahlungsverzug, eine negative Bonitätsauskunft, Exekutionen oder einen Insolvenzantrag –, dürfen wir noch offene Lieferungen und Leistungen von einer Vorauszahlung oder einer Sicherheit (Bankgarantie) abhängig machen und bis dahin zurückhalten. Leisten Sie sie nicht innerhalb angemessener Nachfrist, dürfen wir vom Vertrag zurücktreten; unsere Ansprüche aus Teil II § 7.5 sinngemäß (Stornokosten, erbrachte Leistungen) bleiben bestehen.",
      "3.3 Sie dürfen nur mit Forderungen aufrechnen, die wir anerkannt haben oder die rechtskräftig festgestellt sind. Ein Zurückbehaltungsrecht wegen Mängeln oder Gegenforderungen steht Ihnen nicht zu.",
      "3.4 Ansprüche gegen uns dürfen Sie nur mit unserer schriftlichen Zustimmung an Dritte abtreten.",
    ],
  },
  {
    id: "iii4",
    num: "§ 4",
    title: "Lieferung, Termine, Gefahrübergang, Rüge",
    blocks: [
      "4.1 Liefertermine sind verbindlich nur, wenn sie schriftlich als Fixtermin bezeichnet sind. Verzögerungen aus Ihrer Sphäre (fehlende Baufreiheit, Pläne, Freigaben, Zufahrt, Anschlüsse) verschieben alle Termine entsprechend; Wartezeiten und Mehrfahrten berechnen wir nach tatsächlichem Aufwand. Vertragsstrafen wegen Verzugs schulden wir nur bei ausdrücklicher schriftlicher Vereinbarung (Teil I § 8.5).",
      "4.2 Die Gefahr geht mit Übergabe an das Transportunternehmen, bei Lieferung durch uns mit dem Abladen an der Lieferadresse und bei Montage mit der Abnahme über (§ 429 ABGB). Für auf der Baustelle oder bei Ihnen gelagerte Ware tragen Sie ab Anlieferung das Risiko von Diebstahl und Beschädigung durch Dritte und sorgen für Versicherung und Bewachung.",
      "4.3 Sie untersuchen die Ware bei Übernahme und rügen Mängel unverzüglich schriftlich, versteckte Mängel unverzüglich nach Entdeckung (§ 377 UGB); sonst verlieren Sie Gewährleistungs-, Schadenersatz- und Irrtumsansprüche wegen des Mangels.",
      "4.4 Abnahme. Nach Fertigstellung, auch von Teilen (etwa je Zimmer oder Wohnung), erfolgt eine förmliche Abnahme. Nehmen Sie die Leistung in Gebrauch oder übergeben Sie sie an Dritte, gilt sie als abgenommen. Unwesentliche Mängel berechtigen nicht zur Verweigerung der Abnahme.",
    ],
  },
  {
    id: "iii5",
    num: "§ 5",
    title: "Gewährleistung",
    blocks: [
      "5.1 Es gelten die §§ 922 ff. ABGB mit folgenden Abweichungen: Die Gewährleistungsfrist beträgt ein Jahr ab Übergabe bzw. Abnahme. Die Vermutung des § 924 ABGB ist ausgeschlossen; Sie haben zu beweisen, dass der Mangel bei Übergabe vorlag.",
      "5.2 Wir wählen zwischen Verbesserung und Austausch. Preisminderung oder Wandlung kommen erst in Betracht, wenn Verbesserung und Austausch fehlschlagen, unmöglich oder für Sie unzumutbar sind.",
      "5.3 Kein Mangel sind übliche Abnutzung und Verschleiß, die Umstände nach Teil I § 8.2 sowie die materialtypischen Eigenschaften und Abweichungen nach Teil I § 6; diese gelten als vertragsgemäß vereinbart.",
      `5.4 Gewerbliche oder öffentliche Nutzung (Hotel, Gastronomie, Objekt, Außenbereich mit Publikumsverkehr) müssen Sie bei Bestellung bekannt geben; wir weisen dann auf die Eignung laut Hersteller hin. Ohne Angabe schulden wir nur die Eignung für die private Wohnnutzung. Verkaufen Sie die Ware an Verbraucher weiter oder bauen Sie sie für Verbraucher ein (etwa als Bauträger), bleibt Ihr gesetzlicher Rückgriff nach § 933b ABGB von der Fristverkürzung in § 5.1 unberührt; er verjährt zwei Monate nach Erfüllung Ihrer eigenen Gewährleistungspflicht und ist spätestens fünf Jahre nach unserer Übergabe ausgeschlossen (§ 933b Abs 2 ABGB).`,
      "5.5 Herstellergarantien geben wir weiter, soweit der Hersteller sie uns schriftlich bestätigt; eigene Garantien übernehmen wir nicht.",
    ],
  },
  {
    id: "iii6",
    num: "§ 6",
    title: "Haftung",
    blocks: [
      "6.1 Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit, für Personenschäden sowie nach dem Produkthaftungsgesetz (Teil I § 8.1). Im Übrigen ist die Haftung für leichte Fahrlässigkeit ausgeschlossen.",
      "6.2 Nicht ersetzt werden Folgeschäden, entgangener Gewinn, Betriebsunterbrechung, Produktionsausfall, Nutzungsausfall, Finanzierungskosten, Verzögerungsschäden Dritter und Ansprüche Dritter gegen Sie, außer bei Vorsatz oder krass grober Fahrlässigkeit.",
      "6.3 Unsere Haftung ist der Höhe nach mit dem Netto-Auftragswert des betroffenen Vertrags begrenzt.",
      "6.4 Schadenersatzansprüche gegen uns verjähren sechs Monate ab Kenntnis von Schaden und Schädiger, spätestens mit Ablauf der gesetzlichen Frist. Das Vorliegen von Verschulden, grober Fahrlässigkeit und der Schadenshöhe haben Sie zu beweisen; § 1298 ABGB gilt nicht.",
      "6.5 Für die Leistungen anderer Gewerke, Subunternehmer, Werften, Sattlereien oder Transportunternehmen, die Sie selbst beauftragt haben, haften wir nicht (Teil I § 5.3).",
    ],
  },
  {
    id: "iii7",
    num: "§ 7",
    title: "Erweiterter Eigentumsvorbehalt",
    blocks: [
      `7.1 Der Eigentumsvorbehalt (Teil I § 7) sichert alle Forderungen aus der Geschäftsbeziehung. Eine Weiterveräußerung ist nur mit unserer Zustimmung im ordentlichen Geschäftsgang zulässig; die Forderung aus der Weiterveräußerung treten Sie schon jetzt in Höhe unserer offenen Forderung an uns ab, vermerken die Abtretung in Ihren Büchern (Buchvermerk) und verständigen den Drittschuldner auf unser Verlangen (§ 452 ABGB). Solange Sie Ihre Zahlungspflichten erfüllen, dürfen Sie die abgetretene Forderung im eigenen Namen einziehen; bei Zahlungsverzug dürfen wir diese Ermächtigung widerrufen und die Abtretung offenlegen.`,
    ],
  },
  {
    id: "iii8",
    num: "§ 8",
    title: "Vertraulichkeit, Pläne",
    blocks: [
      "8.1 Angebote, Pläne, Preise und Kalkulationen sind vertraulich und dürfen Dritten nicht zugänglich gemacht werden. Nutzungsrechte an Planungen: Teil IV § 5.3. Referenzen nur mit Zustimmung: Teil I § 9.2.",
    ],
  },
  {
    id: "iii9",
    num: "§ 9",
    title: "Gerichtsstand",
    blocks: [
      "9.1 Für alle Streitigkeiten aus oder im Zusammenhang mit dem Vertrag wird das sachlich zuständige Gericht in Wien als allein zuständiges Gericht vereinbart (§ 104 JN). Wir dürfen Sie auch an Ihrem allgemeinen Gerichtsstand klagen.",
      "9.2 Mit Unternehmern mit Sitz in der Schweiz gilt diese Vereinbarung nach Art. 23 des Lugano-Übereinkommens; wir halten sie in der Auftragsbestätigung schriftlich fest. Für Unternehmer mit Sitz in Liechtenstein gilt sie, soweit das dortige Recht sie anerkennt.",
    ],
  },
  {
    id: "iii10",
    num: "§ 10",
    title: "Teilunwirksamkeit",
    blocks: ["10.1 Ist eine Bestimmung dieser AGB Ihnen gegenüber unwirksam, tritt an ihre Stelle eine wirksame Regelung, die dem wirtschaftlichen Zweck der unwirksamen am nächsten kommt; die übrigen Bestimmungen bleiben wirksam."],
  },
];

// ------------------------------------------------------------------ Teil IV

export const AGB_BEREICHE = Object.freeze([
  {
    id: "b1",
    num: "§ 1",
    key: "moebel",
    title: "Möbel und Einrichtung",
    lead: "Kauf von Möbeln, Leuchten, Teppichen und Einrichtungsgegenständen, auf Wunsch mit Lieferung und Montage.",
    blocks: [
      "1.1 Gegenstand ist der Kauf der in der Auftragsbestätigung beschriebenen Waren. Lieferung und Montage sind nur geschuldet, wenn sie dort ausgewiesen sind (Teil I § 3.2).",
      "1.2 Maß- und Sonderanfertigungen sind Waren, die nach Ihren Vorgaben hergestellt oder auf Ihre Bedürfnisse zugeschnitten werden: Möbel in gewählten Maßen, Bezügen, Ledern, Farben, Hölzern oder Modulkombinationen, Teppiche in Sondergröße, Platten nach Maß. [Verbraucher] Für sie besteht im Fernabsatz kein Rücktrittsrecht (Teil II § 7.2).",
      "1.3 Freigabe. Vor der Bestellung beim Hersteller erhalten Sie eine Bestellübersicht mit Modell, Maßen, Bezug oder Material, Ausführung und voraussichtlichem Liefertermin. Mit Ihrer Freigabe (Unterschrift oder E-Mail) wird die Ausführung verbindlich. Änderungswünsche nach Freigabe setzen wir um, soweit der Hersteller es zulässt; Mehrkosten und Terminverschiebungen teilen wir Ihnen vorher mit, und sie gelten nur mit Ihrer Zustimmung.",
      "1.4 Naturmaterialien, Muster und Chargen: Teil I § 6. Besonderheiten eines konkreten Stücks bestätigen Sie gesondert.",
      "1.5 Lieferzeit und Lieferarten stehen im Angebot (Abholung, Lieferung frei Bordsteinkante, Lieferung in die Wohnung, Lieferung mit Montage). Sie sorgen bis zum Termin für freien Zugang (Teil I § 5.1); wir nennen Ihnen vorab die Maße großer Teile. Montage führen wir selbst oder durch von uns ausgewählte Partnerbetriebe aus; dafür bleiben wir Ihre Vertragspartnerin (§ 1313a ABGB).",
      "1.6 Ausstellungsstücke und Abverkaufsware verkaufen wir mit einer Zustandsbeschreibung (Gebrauchsspuren, fehlende Teile). Für die dort beschriebenen Merkmale leisten wir keine Gewähr, wenn Sie der Beschreibung vor Vertragsschluss ausdrücklich und gesondert zugestimmt haben; für alle anderen Mängel gilt die gesetzliche Gewährleistung in voller Länge.",
    ],
  },
  {
    id: "b2",
    num: "§ 2",
    key: "kuechen",
    title: "Küchen nach Maß",
    lead: "Planung, Aufmaß, Lieferung und Montage einer Küche als Werklieferungsvertrag.",
    blocks: [
      "2.1 Gegenstand ist die Planung, Lieferung und – wenn beauftragt – Montage einer Küche nach dem freigegebenen Plan (Werklieferungsvertrag, §§ 1165 ff. ABGB). Geräte, Arbeitsplatten, Armaturen und Zubehör sind nur Vertragsinhalt, wenn sie im Angebot stehen.",
      "2.2 Aufmaß. Für Küchen nehmen wir das Aufmaß vor Ort selbst oder durch einen Partner vor; Kosten laut Angebot. Arbeiten wir auf Ihren Wunsch mit Maßen, Plänen oder Angaben, die Sie, Ihr Architekturbüro oder Ihre Baufirma liefern, sind diese Angaben verbindlich (Teil I § 5.2).",
      "2.3 Freigabe der Planung. Vor der Bestellung erhalten Sie die Ausführungsplanung (Grundriss, Ansichten, Geräte- und Installationsplan, Material- und Frontenliste). Mit Ihrer Freigabe (Unterschrift oder E-Mail) werden Planung und Ausführung verbindlich; Planungsabweichungen, die Sie bei der Freigabe erkennen konnten, gelten als vereinbart. Änderungswünsche nach Freigabe behandeln wir wie Teil IV § 1.3.",
      "2.4 Bauseitige Voraussetzungen. Bis zum vereinbarten Montagetermin sorgen Sie dafür, dass der Raum montagebereit ist: Böden verlegt, Wände trocken, verputzt und gestrichen, Fenster eingebaut, Raum beheizbar und trocken, Anschlüsse für Strom, Wasser, Abwasser, Abluft und gegebenenfalls Gas nach unserem Installationsplan an der richtigen Stelle hergestellt, Leitungsverläufe in Wänden und Böden markiert oder durch Pläne belegt, Zufahrt und Zugang frei, eine berechtigte Person anwesend. Elektro-, Gas- und Wasserinstallationen, die über das Anschließen an vorhandene, fachgerecht hergestellte Anschlüsse hinausgehen, führen allein befugte Fachbetriebe aus (Teil I § 5.3).",
      "2.5 Ist die Montage aus Gründen, die in Ihrem Bereich liegen, nicht möglich, vereinbaren wir einen neuen Termin; Kosten der vergeblichen Anfahrt, Einlagerung und des Mehraufwands tragen Sie laut Angebot, sonst nach tatsächlichem Aufwand (Teil I § 4.6). Die Montage ist erst nach Lieferung aller wesentlichen Teile geschuldet.",
      "2.6 Abnahme. Nach der Montage gehen wir die Küche gemeinsam mit Ihnen durch und halten sichtbare Mängel in einem Übergabeprotokoll fest; der Restbetrag ist mit der Abnahme fällig. Unwesentliche Mängel berechtigen nicht zur Verweigerung der Abnahme; sie werden im Protokoll festgehalten und von uns behoben. [Unternehmer] Nutzen Sie die Küche, gilt sie als abgenommen. [Verbraucher] Das Protokoll dient der Beweissicherung; Ihre Gewährleistungsrechte für später entdeckte Mängel bleiben unberührt.",
      "2.7 Mängelrüge. Mängel melden Sie uns bitte schriftlich mit Beschreibung und Foto. [Unternehmer] Es gilt § 377 UGB (Teil III § 4.3).",
    ],
  },
  {
    id: "b3",
    num: "§ 3",
    key: "geraete",
    title: "Küchen- und Elektrogeräte",
    lead: "Kauf von Einbau- und Standgeräten, mit oder ohne Küche.",
    blocks: [
      "3.1 Gegenstand ist der Kauf der in der Auftragsbestätigung genannten Geräte. Einbau und Anschluss sind nur geschuldet, wenn sie dort ausgewiesen sind.",
      "3.2 Der Anschluss von Geräten an Strom, Gas, Wasser und Abwasser über das Anstecken an eine vorhandene, fachgerechte Steckdose hinaus erfolgt allein durch befugte Fachbetriebe. Beauftragen Sie diese selbst, sind sie Ihre Vertragspartner; Schäden aus unsachgemäßem Anschluss sind kein Mangel der Geräte.",
      "3.3 Herstellergarantien gelten zusätzlich zur gesetzlichen Gewährleistung (Teil II § 5.5, Teil III § 5.5). Für die Abwicklung einer Garantie wenden Sie sich an den Garantiegeber oder an uns; wir unterstützen Sie dabei.",
      "3.4 Technische Angaben der Hersteller (Maße, Anschlusswerte, Energieklasse) geben wir weiter, wie der Hersteller sie veröffentlicht. Beachten Sie bitte die Bedienungs- und Pflegeanleitung des Herstellers; Schäden durch Missachtung sind kein Mangel (Teil I § 8.2).",
      "3.5 Wird mit dem Gerät ein Altgerät zurückgenommen oder entsorgt, steht das im Angebot; sonst ist es nicht Vertragsinhalt.",
    ],
  },
  {
    id: "b4",
    num: "§ 4",
    key: "wellness",
    title: "Bad, Wellness, Whirlpool, Swim Spa, Sauna",
    lead: "Kauf und Lieferung von Whirlpools, Swim Spas, Saunen, Dampfbädern, Badmöbeln und Armaturen.",
    blocks: [
      "4.1 Gegenstand ist der Kauf und die Lieferung der in der Auftragsbestätigung genannten Anlagen und Waren. Aufstellung, Anschluss und Inbetriebnahme sind nur geschuldet, wenn sie dort ausgewiesen sind.",
      "4.2 Bauseitige Voraussetzungen. Sie sorgen auf Ihre Kosten für das tragfähige, ebene Fundament bzw. die Statik des Aufstellorts, für Strom-, Wasser- und Abwasseranschlüsse nach den Herstellervorgaben, für Entlüftung und Feuchtigkeitsschutz in Innenräumen, für die Zufahrt und den Transportweg (einschließlich Kran, wenn nötig) und für erforderliche behördliche Bewilligungen. Die Herstellervorgaben stellen wir Ihnen vor der Lieferung zur Verfügung. Elektro- und Sanitärinstallationen führen allein befugte Fachbetriebe aus (Teil I § 5.3). Mehrkosten aus fehlenden oder unrichtigen bauseitigen Voraussetzungen gehen zu Ihren Lasten.",
      "4.3 Inbetriebnahme. Ist die Inbetriebnahme beauftragt, führen wir oder ein vom Hersteller benannter Servicepartner sie nach Herstellung der bauseitigen Anschlüsse durch und weisen Sie ein. Die Einweisung bestätigen Sie auf dem Übergabeprotokoll.",
      "4.4 Betrieb, Wasserpflege, Wartung. Betrieb, Wasserpflege, Reinigung, Filterwechsel und regelmäßige Wartung nach der Anleitung des Herstellers sind Ihre Sache. Schäden durch falsche Wasserwerte, unzureichende Pflege, ungeeignete Pflegemittel, Betrieb ohne Wasser oder ohne Strom sind kein Mangel.",
      "4.5 Frost. Außen aufgestellte Anlagen müssen bei Frostgefahr entweder ununterbrochen in Betrieb bleiben oder nach Herstellervorgabe fachgerecht entleert und winterfest gemacht werden. Frostschäden aus unterbliebener oder unsachgemäßer Winterfestmachung sind kein Mangel.",
      "4.6 Naturmaterialien wie Holz in Saunen und Naturstein im Bad: Teil I § 6.",
    ],
  },
  {
    id: "b5",
    num: "§ 5",
    key: "planung",
    title: "Planungsservice, Interior Design, Lichtplanung",
    lead: "Beratung, Raum- und Einrichtungsplanung, Lichtplanung und Koordination als eigene Leistung.",
    blocks: [
      "5.1 Gegenstand und Umfang der Planungsleistung (etwa Konzept, Grundriss, Möblierungsplan, Material- und Farbkonzept, Lichtplanung, Visualisierungen, Bemusterung, Abstimmungstermine) stehen im Angebot. Nicht genannte Leistungen sind nicht geschuldet. Eine erste Beratung und ein erster Vorschlag sind kostenlos, soweit das Angebot nichts anderes sagt.",
      "5.2 Honorar. Das Planungshonorar steht im Angebot. Ob und in welchem Umfang wir es bei einer anschließenden Beauftragung von Waren anrechnen, steht ebenfalls dort. Beauftragen Sie nach der Planung keine Waren, schulden Sie das Planungshonorar laut Angebot.",
      "5.3 Nutzungsrechte. Pläne, Handzeichnungen, Renderings, 3D-Modelle, Visualisierungen und Konzepte bleiben unser geistiges Eigentum. Mit vollständiger Bezahlung des Honorars erhalten Sie das Recht, sie für das beauftragte Projekt zu nutzen. Eine Weitergabe an Dritte, insbesondere an andere Anbieter oder Mitbewerber zur Umsetzung, eine Vervielfältigung oder eine Nutzung für andere Projekte ist nur mit unserer schriftlichen Zustimmung zulässig.",
      "5.4 Freigabe. Pläne gelten mit Ihrer schriftlichen Freigabe (Unterschrift oder E-Mail) als vereinbart; Planungsabweichungen, die bei der Freigabe erkennbar waren, gelten als genehmigt. Visualisierungen und Renderings sind unverbindlich (Teil I § 6.3).",
      "5.5 Mitwirkung. Sie stellen uns Pläne, Maße, Anschlusspläne, Statikangaben und Bewilligungen Ihres Bauvorhabens zur Verfügung und benennen eine entscheidungsbefugte Ansprechperson. Für Planungen, die auf unrichtigen oder unvollständigen Angaben beruhen, haften wir nicht; Mehraufwand aus Änderungen Ihrer Vorgaben berechnen wir laut Angebot, sonst nach tatsächlichem Aufwand. Die Eignung des Gebäudes (Statik, Bauphysik, Brandschutz, Haustechnik) prüfen befugte Fachleute (Teil I § 6.4).",
      "5.6 Koordination anderer Gewerke ist Termin- und Gestaltungsabstimmung, keine Bauleitung und keine Bauaufsicht (Teil I § 5.4). Die anderen Gewerke bleiben Ihre Vertragspartner; für deren Leistungen haften wir nicht (Teil I § 5.3).",
      "5.7 [Verbraucher] Rücktritt im Fernabsatz: Teil II § 7.1 und § 7.4.",
    ],
  },
  {
    id: "b6",
    num: "§ 6",
    key: "outdoor",
    title: "Outdoor, Garten und Yacht-Interieur",
    lead: "Outdoor-Möbel, Beschattung und Licht im Freien, Ausstattung von Booten und Yachten.",
    blocks: [
      "6.1 Für den Kauf von Outdoor-Möbeln, Schirmen, Leuchten und Textilien gilt Teil IV § 1, für Konzept und Koordination Teil IV § 5.",
      "6.2 Witterung. Outdoor-Materialien sind für den Einsatz im Freien ausgelegt, altern aber durch Sonne, Regen, Frost, Pollen und Wasserhärte: Ausbleichen, Patina auf Metall und Holz, Vergrauen von Teak, Kalk- und Wasserflecken, Verfärbungen durch Pflanzen sind materialtypisch und kein Mangel. Schutzhüllen, Pflege und Winterlagerung nach Herstellerangaben sind Ihre Sache, sofern Sie nicht einen Pflege- oder Lagerdienst gesondert beauftragen.",
      "6.3 Garten. Gartenplanung, Gartenbau, Mauern, Wege, Terrassen, Pool- und Beckenbau, Bewässerung und Elektroinstallationen im Freien erbringen befugte Partnerbetriebe (Landschaftsgärtnerei, Baumeister, Elektrotechnik, Poolbau) mit eigenem Vertrag mit Ihnen. Bauleitung, Bauaufsicht und die Koordination nach dem Bauarbeitenkoordinationsgesetz liegen bei diesen Partnern bzw. bei Ihnen als Bauherrin oder Bauherr (Teil I § 5.4).",
      "6.4 Yacht-Interieur. Wir liefern lose Ausstattung und Oberflächen: Polster, Kissen, Textilien, Deckmöbel, lose Leuchten und Accessoires sowie Gestaltungskonzepte. Eingriffe in Struktur, Elektrik, Gas, Wasser oder Stabilität des Bootes sowie fest eingebaute Teile führt allein eine Werft oder ein befugter Bootsbau- oder Bootselektrikbetrieb aus; Polster- und Persenningarbeiten eine Bootssattlerei. Diese Betriebe sind Ihre eigenen Vertragspartner; wir stimmen Gestaltung, Maße und Termine mit ihnen ab und haften nicht für ihr Werk. Für die Eignung von Materialien an Bord gelten die Angaben der Hersteller; Sie teilen uns Einsatzzweck und Einsatzgebiet (Süßwasser, Salzwasser) vor der Bestellung mit.",
    ],
  },
  {
    id: "b7",
    num: "§ 7",
    key: "onlineshop",
    title: "Onlineshop für Accessoires",
    lead: "Kauf von Accessoires über unseren Onlineshop mit Versand oder Abholung im Showroom.",
    blocks: [
      "7.1 Für Bestellungen im Onlineshop gelten ergänzend die Allgemeinen Geschäftsbedingungen für den Onlineshop, die Widerrufsbelehrung mit Muster-Widerrufsformular, die Versand- und Lieferbedingungen und die Datenschutz-Ergänzung für den Onlineshop. Sie sind im Bestellvorgang und in der Auftragsbestätigung verlinkt und gehen bei Abweichungen diesen AGB vor. Sobald der Onlineshop geöffnet ist, finden Sie sie auch unter dem Link am Ende dieses Abschnitts.",
      "7.2 Im Onlineshop kommt der Vertrag erst mit unserer Auftragsbestätigung per E-Mail zustande; die Eingangsbestätigung ist noch keine Annahme. Mit Klick auf „Zahlungspflichtig bestellen“ geben Sie ein verbindliches Angebot ab (§ 8 Abs 2 FAGG).",
      "7.3 Online bezahlen Sie über den im Bestellvorgang genannten Zahlungsdienstleister; welche Zahlungsarten möglich sind, sehen Sie spätestens zu Beginn des Bestellvorgangs (§ 8 Abs 3 FAGG). Versandkosten werden vor Abgabe der Bestellung angezeigt. Bei Abholung im Showroom fallen keine Versandkosten an.",
      "7.4 [Verbraucher] Bei Bestellungen im Onlineshop haben Sie das gesetzliche Rücktrittsrecht von 14 Tagen (Teil II § 7); Ausnahmen, Fristbeginn und Rücksendung regelt die Widerrufsbelehrung des Onlineshops.",
    ],
  },
  {
    id: "b8",
    num: "§ 8",
    key: "gutscheine",
    title: "Gutscheine",
    lead: "Wertgutscheine für Showroom und Onlineshop.",
    blocks: [
      "8.1 Für Erwerb, Gültigkeit, Einlösung und Ausstellerin unserer Gutscheine gelten die Gutscheinbedingungen; sie gehen bei Abweichungen diesen AGB vor.",
      "8.2 Ausstellerin ist die auf dem Gutschein genannte Gesellschaft. [Verbraucher] Gutscheine, die per Anfrage und Rechnung oder online erworben werden, sind Fernabsatzverträge; das Rücktrittsrecht nach Teil II § 7 besteht, solange der Gutschein nicht eingelöst ist.",
      "8.3 Eine Barauszahlung des Guthabens ist ausgeschlossen, soweit das Gesetz nichts anderes vorsieht.",
    ],
  },
  {
    id: "b9",
    num: "§ 9",
    key: "anzahlung",
    title: "Anzahlungen",
    lead: "Wann wir eine Anzahlung verlangen und wie sie behandelt wird.",
    blocks: [
      "9.1 Eine Anzahlung schulden Sie nur, wenn das Angebot sie vorsieht; Höhe und Fälligkeit stehen dort („Anzahlung laut Angebot“). Sie wird auf den Kaufpreis bzw. das Honorar angerechnet.",
      `9.2 Treten Sie oder wir berechtigt vom Vertrag zurück oder löst sich der Vertrag auf, ohne dass Sie das zu vertreten haben, erstatten wir die Anzahlung; bei einvernehmlicher Auflösung verrechnen wir den Aufwand nach Teil II § 7.5 bzw. Teil III § 3.2. Die Anzahlung ist weder Angeld noch Reugeld (§§ 908, 909 ABGB); sie verfällt nicht, sondern wird nur mit dem nachgewiesenen Aufwand verrechnet und im Übrigen erstattet. Die Bestellung beim Hersteller lösen wir erst nach Eingang einer vereinbarten Anzahlung aus; leisten Sie sie trotz schriftlicher Nachfrist nicht, dürfen wir vom Vertrag zurücktreten (Teil I § 3.6).`,
      "9.3 Für Lieferungen in die Schweiz und nach Liechtenstein gilt Teil IV § 10.4.",
    ],
  },
  {
    id: "b10",
    num: "§ 10",
    key: "ausland",
    title: "Lieferung nach Deutschland, in die Schweiz und nach Liechtenstein",
    lead: "Was bei Lieferadressen außerhalb Österreichs dazukommt.",
    blocks: [
      "10.1 Ob und zu welchen Bedingungen wir an eine Adresse außerhalb Österreichs liefern oder montieren, steht im Angebot. Liefertermine ins Ausland sind unverbindlich, sofern sie nicht schriftlich als Fixtermin vereinbart sind (Teil I § 4.1).",
      "10.2 Deutschland. Bei Lieferung nach Deutschland enthalten die Preise die jeweils anwendbare Umsatzsteuer, wie im Angebot ausgewiesen. [Verbraucher] Es gelten zusätzlich die zwingenden Verbraucherschutzvorschriften des deutschen Rechts, soweit sie für Sie günstiger sind (Teil II § 8.1).",
      "10.3 Schweiz und Liechtenstein. Eine Lieferung in die Schweiz oder nach Liechtenstein ist eine Ausfuhr aus der Europäischen Union. Zum vereinbarten Preis kommen die Verzollung, die schweizerische Einfuhrsteuer und die Gebühren des Spediteurs für die Verzollung hinzu; Sie sind Importeurin oder Importeur und bezahlen diese Abgaben beim Empfang oder auf Rechnung des Spediteurs, soweit das Angebot nicht ausdrücklich einen Preis einschließlich Verzollung nennt. Holen Sie die Ware in Lochau selbst ab und führen Sie sie aus, erstatten wir die österreichische Umsatzsteuer nach Eingang der zollamtlichen Ausfuhrbestätigung nach den gesetzlichen Voraussetzungen; die Abgaben bei der Einfuhr tragen Sie.",
      "10.4 Bei Lieferung in die Schweiz und nach Liechtenstein ist der gesamte Preis vor der Auslieferung fällig (Teil I § 7.3, Art. 715 ZGB).",
      "10.5 Ein in Schweizer Franken vereinbarter Preis ist in Franken zu zahlen, ein in Euro vereinbarter Preis in Euro; Bank- und Umrechnungskosten Ihrer Bank tragen Sie. Montagetermine in der Schweiz vereinbaren wir mit dem im Angebot genannten Vorlauf, weil Monteure vorab bei den Behörden gemeldet werden müssen.",
      "10.6 [Verbraucher] Haben Sie Ihren gewöhnlichen Aufenthalt in der Schweiz oder in Liechtenstein, bleibt der Schutz zwingender Vorschriften Ihres Aufenthaltsstaats unberührt, soweit er anwendbar ist; Gerichtsstände: Teil II § 8.2.",
    ],
  },
]);

/** Die vier Teile in Lesereihenfolge. */
export const AGB_TEILE = Object.freeze([
  { id: "teil-i", num: "Teil I", title: "Allgemeine Bestimmungen für alle Verträge", sections: Object.freeze(TEIL_I) },
  { id: "teil-ii", num: "Teil II", title: "Verbraucherinnen und Verbraucher", lead: "Gilt nur für Verträge mit Verbraucherinnen und Verbrauchern (§ 1 KSchG).", sections: Object.freeze(TEIL_II) },
  { id: "teil-iii", num: "Teil III", title: "Unternehmer", lead: "Gilt nur für Verträge mit Unternehmern (§ 1 KSchG).", sections: Object.freeze(TEIL_III) },
  { id: "teil-iv", num: "Teil IV", title: "Besondere Bedingungen je Geschäftsbereich", lead: "Gehen den Teilen I bis III vor, soweit sie davon abweichen.", sections: AGB_BEREICHE },
]);

/** Alle Bereichs-Schlüssel (Test: jeder Bereich vorhanden). */
export const AGB_BEREICH_KEYS = Object.freeze(AGB_BEREICHE.map((b) => b.key));

/** Verweise aus Teil IV auf andere Rechtstexte (Seite verlinkt nur, was erreichbar ist). */
export const AGB_VERWEISE = Object.freeze({
  onlineshop: { key: "onlineshop", path: "/shop/recht/agb", label: "Rechtstexte des Onlineshops" },
  gutscheine: { key: "gutscheine", path: "/gutscheinbedingungen", label: "Gutscheinbedingungen" },
  datenschutz: { path: "/datenschutz", label: "Datenschutzerklärung" },
});

const KANZLEI_RE = /\[Kanzlei: ([^\]]+)\]/g;

/** Alle Absätze eines Abschnitts als Strings. */
export function sectionTexts(section) {
  return (section.blocks || []).flatMap((b) => (typeof b === "string" ? [b] : b?.ul || []));
}

/** Alle Abschnitte aller Teile, flach. */
export function agbSections() {
  return AGB_TEILE.flatMap((t) => t.sections);
}

/** Gesamter Wortlaut (alle Teile) als ein String – für Tests und Prüfungen. */
export function agbText() {
  return AGB_TEILE.flatMap((t) => [t.title, t.lead || "", ...t.sections.flatMap((s) => [s.title, s.lead || "", ...sectionTexts(s)])]).join("\n");
}

/** Lücken für die Kanzlei: [{ teil, id, num, title, text }] – seit 03.11.2026 leer (Test prüft null Lücken). */
export function kanzleiLuecken() {
  const out = [];
  for (const teil of AGB_TEILE) {
    for (const s of teil.sections) {
      for (const t of sectionTexts(s)) {
        for (const m of t.matchAll(KANZLEI_RE)) out.push({ teil: teil.num, id: s.id, num: s.num, title: s.title, text: m[1] });
      }
    }
  }
  return out;
}

/**
 * Zerlegt einen Absatz in Teile für die Anzeige:
 *   { t: "text", text } | { t: "mark", mark: "Verbraucher"|"Unternehmer" } | { t: "luecke", text }
 */
export function splitInline(text) {
  const parts = [];
  const re = /\[(Verbraucher|Unternehmer)\]|\[Kanzlei: ([^\]]+)\]/g;
  let last = 0;
  for (const m of String(text).matchAll(re)) {
    if (m.index > last) parts.push({ t: "text", text: text.slice(last, m.index) });
    if (m[1]) parts.push({ t: "mark", mark: m[1] });
    else parts.push({ t: "luecke", text: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: "text", text: text.slice(last) });
  return parts;
}

/** Stand als deutsches Datum (TT.MM.JJJJ). */
export function agbStandDe(iso = AGB_STAND) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
