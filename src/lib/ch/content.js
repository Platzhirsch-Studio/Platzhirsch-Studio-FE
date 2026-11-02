// Texte des Schweiz-Hubs /de/einkaufen-aus-der-schweiz (de-CH: "ss" statt "ß").
// Grundlage: Marktresearch/18-schweiz-recht-steuer-logistik.md (Bericht 18) und
// der geprüfte Ratgeber-Entwurf Marktresearch/content/ratgeber/
// moebel-aus-oesterreich-in-die-schweiz.md (Prüfvermerk 26.10.2026).
//
// Regel: Jede gerenderte Aussage hat eine Quelle (`src`, Schlüssel in SOURCES).
// Stellen ohne Beleg tragen `pruefen: "<was fehlt>"` und werden von visible()
// NICHT gerendert – sie stehen nur hier und in Marktresearch/digital/redesign/
// schweiz-hub.md für Steuerberater und Zollspediteur.
// Nicht erlaubt: Wörter aus FORBIDDEN (Test r5-schweiz), Händler-Behauptungen,
// Superlative, Preise von Platzhirsch, Montagezusagen in der Schweiz.

export const PATH = "/einkaufen-aus-der-schweiz";
export const AS_OF = "26.10.2026";

export const SOURCES = {
  bazgZoll: { label: "BAZG: Aufhebung der Industriezölle (Januar 2024)", url: "https://www.bazg.admin.ch/de/aufhebung-industriezolle-januar-2024" },
  mazars: { label: "Forvis Mazars: Aufhebung der Industriezölle", url: "https://www.forvismazars.com/ch/de/services/steuern/mehrwertsteuern/aufhebung-der-industriezoelle" },
  bazgFrei: { label: "BAZG: Wertfreigrenze 150 Franken", url: "https://www.bazg.admin.ch/de/wertfreigrenze-mehrwertsteuer-einreise-150-franken" },
  bazgBemessung: { label: "BAZG: Bemessungsgrundlage der Einfuhrsteuer", url: "https://www.bazg.admin.ch/de/bemessungsgrundlagen-einfuhrsteuer-mwst-mehrwertsteuergesetz" },
  wkoExport: { label: "WKO: Touristenexport", url: "https://www.wko.at/aussenwirtschaft/exporthandbuch/touristenexport" },
  wkoVlbg: { label: "WKO Vorarlberg: Zollstellen und Touristenexport (Stand 01.07.2025)", url: "https://www.wko.at/vlbg/handel/oeffnungszeiten-zollstellen.pdf" },
  ihk: { label: "IHK Hochrhein-Bodensee: MWST-Merkblatt Schweiz (Stand 01/2026)", url: "https://www.ihk.de/blueprint/servlet/resource/blob/6952624/415a2f67fa31d7190d93fe7b892baaee/een-mwst-merkblatt-2026-neu-data.pdf" },
  weka: { label: "WEKA: Montagelieferung in die Schweiz", url: "https://www.weka.ch/themen/finanzen-controlling/mehrwertsteuer/mwst-international/article/montagelieferung-korrekte-versteuerung-von-lieferungen-in-die-schweiz/" },
  wkoEntsendung: { label: "WKO: Meldepflicht laut Entsendegesetz Schweiz", url: "https://www.wko.at/aussenwirtschaft/exporthandbuch/meldepflicht-laut-entsendegesetz-schweiz" },
  pue: { label: "Preisüberwacher: Newsletter 1/2019 (Verzollungskosten)", url: "https://www.preisueberwacher.admin.ch/dam/pue/de/dokumente/newsletter/Newsletter%2001_19.pdf.download.pdf/Newsletter_01_19_d.pdf" },
  post: { label: "Post CH: Importverzollung", url: "https://www.post.ch/de/empfangen/importverzollung" },
  pwc: { label: "PwC: Liechtensteinische MWST-Sätze", url: "https://www.pwc.ch/de/insights/steuern/erhoehung-der-liechtensteinischen-mwst-saetze.html" },
  ecb: { label: "EZB: Euro-Referenzkurs CHF", url: "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-chf.en.html" },
};

/** Nur belegte Einträge (ohne `pruefen`). */
export const visible = (items) => (items || []).filter((i) => i && !i.pruefen);

export const BANNER = {
  title: "Entwurf, Freigabe durch Steuerberater/Zollspediteur offen",
  text: "Diese Seite fasst öffentlich zugängliche Regeln zusammen und ist keine Steuer-, Zoll- oder Rechtsberatung. Massgebend sind die Angaben von BAZG und WKO.",
};

export const HERO = {
  eyebrow: "Für Kundinnen und Kunden aus der Schweiz",
  title: "Einkaufen aus der Schweiz",
  lead: "Möbel sind bei der Einfuhr in die Schweiz seit 2024 zollfrei, es fällt die Schweizer MWST von 8,1 % an. Die österreichische USt von 20 % entfällt bei Lieferung in die Schweiz oder wird nach bestätigter Ausfuhr erstattet.",
  facts: [
    { label: "Zoll auf Möbel", value: "Keiner seit 01.01.2024, die Zollanmeldung bleibt Pflicht", src: ["bazgZoll", "mazars"] },
    { label: "Schweizer MWST", value: "8,1 % auf Ware und Transport bis zu Ihnen", src: ["bazgFrei", "bazgBemessung"] },
    { label: "Österreichische USt", value: "20 %, entfällt bei Lieferung oder wird nach bestätigter Ausfuhr erstattet", src: ["wkoExport"] },
  ],
};

export const WEGE = {
  heading: "Zwei Wege über die Grenze",
  text: "Welcher Weg passt, hängt vor allem von der Grösse des Stücks ab. Wie Ihr Einkauf über die Grenze kommt, besprechen wir vor dem Kauf mit Ihnen.",
  items: [
    {
      id: "a",
      title: "Weg A: Sie holen selbst ab",
      lead: "Sie kaufen in Lochau, laden ein und bringen die Ware selbst über die Grenze. Die österreichische USt erhalten Sie zurück, sobald die Ausfuhr bestätigt ist.",
      points: [
        { text: "Wohnsitz ausserhalb der EU, zum Beispiel in der Schweiz, eingetragen im Pass oder Ausweis. Ein zusätzlicher Wohnsitz in der EU schliesst die Erstattung aus.", src: ["wkoExport"] },
        { text: "Rechnungsbetrag über 75 € je österreichischem Geschäft und Tag.", src: ["wkoExport"] },
        { text: "Die Ware verlässt die EU innerhalb von drei Monaten.", src: ["wkoExport"] },
        { text: "Die vom Zoll bestätigte Ausfuhrbescheinigung (Formular U34 oder Bestätigung auf der Rechnung) ist innerhalb von sechs Monaten zurück beim Geschäft.", src: ["wkoExport"] },
        { text: "Die Ware reist in Ihrem persönlichen Reisegepäck. Eine Versendung durch eine Spedition ist auf diesem Weg nicht möglich.", src: ["wkoVlbg"] },
        { text: "In der Schweiz melden Sie die Ware an und bezahlen die 8,1 % MWST, am Schalter oder vorab in der App QuickZoll.", src: ["bazgFrei"] },
        { text: "Ob ein Anhänger oder ein gemieteter Transporter noch als Reisegepäck gilt.", pruefen: "keine Quelle (Ratgeber-Prüfvermerk Nr. 4), mit Zoll klären" },
        { text: "Wie Platzhirsch die Rückerstattung abwickelt (selbst oder über einen Dienstleister mit Gebühr).", pruefen: "Entscheidung Inhaber/Steuerberater offen" },
      ],
      zoll: {
        heading: "Ausfuhr bestätigen lassen",
        items: [
          { name: "Lustenau/Au", hours: "Mo–So 0–24 Uhr", src: ["wkoVlbg"] },
          { name: "Höchst/St. Margrethen (Strasse)", hours: "Mo–Fr 8–16 Uhr", src: ["wkoVlbg"] },
          { name: "Tisis/Schaanwald (Liechtenstein)", hours: "Zeiten widersprüchlich", pruefen: "Bericht 18: Mo–Fr 7.30–16.30, Ratgeber-Prüfung: Mo–Fr 7.30–18, Sa 10–18" },
        ],
        note: "Laut WKO Vorarlberg können sich die Zeiten kurzfristig ändern. Ohne Bestätigung der Ausfuhr gibt es keine Erstattung.",
      },
      fit: "Leuchten, Accessoires, Beistelltische, Stühle. Ein grosses Sofa passt selten in einen Kombi.",
    },
    {
      id: "b",
      title: "Weg B: Lieferung per Spedition, Sie sind Importeur",
      lead: "Eine Spedition bringt die Möbel zu Ihnen. Bei nachgewiesener Ausfuhr enthält die Rechnung aus Österreich keine österreichische USt.",
      points: [
        { text: "Die Spedition meldet die Ausfuhr in Österreich und die Einfuhr in der Schweiz an.", src: ["ihk"] },
        { text: "Die 8,1 % MWST und die Verzollungsgebühr der Spedition bezahlen Sie beim Empfang oder auf deren Rechnung.", src: ["ihk"] },
        { text: "Die MWST wird auf den Preis plus die Kosten bis zum Bestimmungsort berechnet, etwa Transport und Versicherung.", src: ["bazgBemessung"] },
        { text: "Für Verzollungsgebühren veröffentlichen Speditionen in der Regel keine Preislisten; der Preisüberwacher hat 2019 die fehlende Transparenz für Privatkunden kritisiert. Lassen Sie sich die Gebühr vorab nennen.", src: ["pue"] },
        { text: "Öffentlich ist nur der Tarif der Post für Pakete aus der EU: CHF 13 plus 3 % des Warenwerts, höchstens CHF 70, ohne MWST. Eine Speditionssendung läuft nicht über diesen Tarif.", src: ["post"] },
        { text: "Rechtsgrundlage der Ausfuhrlieferung (§ 7 UStG 1994) als Quelle auf der Seite.", pruefen: "Quelle ergänzen (Ratgeber-Prüfvermerk)" },
      ],
      fit: "Sofas, Esstische, Betten, Sideboards: alles, was geliefert und aufgestellt, aber nicht eingebaut wird.",
    },
  ],
};

export const EINBAU = {
  heading: "Küchen und Einbauten: andere Regeln",
  paragraphs: [
    { text: "Bei einer Küche, einem Einbauschrank oder einer Ankleide mit Montage reicht Weg B in der Regel nicht. Steuerlich kann das eine werkvertragliche Lieferung sein, mit Ort der Leistung in der Schweiz; dann muss sich der ausländische Anbieter in der Schweiz für die MWST registrieren.", src: ["weka", "ihk"] },
    { text: "Wer in der Schweiz Küchen einbaut, muss seine Mitarbeitenden vor dem Einsatz melden. Die Arbeit darf frühestens acht Tage nach der Meldung beginnen.", src: ["wkoEntsendung"] },
    { text: "Solche Projekte besprechen wir einzeln. Diese Seite und der Rechner gelten nur für lose Möbel und Leuchten.", own: true },
  ],
};

export const ABLAUF = {
  heading: "Ablauf von Kauf bis Einfuhr",
  steps: [
    { title: "Vor dem Kauf", a: "Wir besprechen, ob Sie selbst abholen.", b: "Wir besprechen Lieferung, Spedition und wer die Einfuhr anmeldet.", own: true },
    { title: "Rechnung", a: "Rechnung über 75 €; die österreichische USt wird nach bestätigter Ausfuhr erstattet.", b: "Rechnung ohne österreichische USt, mit dem Hinweis «zzgl. 8,1 % CH-MWST und Verzollungsgebühr beim Empfang».", src: ["wkoExport", "ihk"] },
    { title: "Ausfuhr aus Österreich", a: "Der österreichische Zoll bestätigt die Ausfuhr (U34 oder Rechnung), zum Beispiel in Lustenau/Au.", b: "Die Spedition meldet die Ausfuhr an.", src: ["wkoExport", "wkoVlbg"] },
    { title: "Einfuhr in die Schweiz", a: "Sie melden die Ware an und bezahlen 8,1 % MWST, am Schalter oder in QuickZoll.", b: "Die Spedition meldet die Einfuhr auf Sie an; Sie bezahlen MWST und Gebühr.", src: ["bazgFrei", "ihk"] },
    { title: "Abschluss", a: "Die bestätigte Ausfuhrbescheinigung ist innerhalb von sechs Monaten zurück beim Geschäft.", b: "Die Ware ist bei Ihnen; die Ausfuhr ist über die Spedition nachgewiesen.", src: ["wkoExport"] },
  ],
};

export const RECHNER = {
  heading: "Was kostet ein Stück in Franken?",
  text: "Geben Sie den österreichischen Preis inklusive 20 % USt ein. Der Rechner zeigt beide Wege mit dem aktuellen EZB-Kurs. Verzollungsgebühr und eigener Transport sind Schätzungen aus öffentlichen Angaben, keine Preise von Platzhirsch.",
  example: "Voreingestellt ist ein Rechenbeispiel (25’000 € Bruttopreis), kein Preis eines bestimmten Modells.",
  notes: [
    "Nicht enthalten: Weg C (verzollter Endpreis in Franken) sowie Küchen und Einbauten mit Montage.",
    "Wie viel der Preis im Vergleich zu einem Kauf in der Schweiz ausmacht, hängt vom dortigen Verkaufspreis ab. Dazu gibt es keine verlässlichen öffentlichen Listen, deshalb nennen wir keine Zahl.",
  ],
};

export const FAQ = {
  name: "schweiz-faq",
  heading: "Fragen zum Einkauf aus der Schweiz",
  items: [
    { q: "Muss ich auf Möbel aus Österreich Zoll bezahlen?", a: "Nein. Seit dem 1. Januar 2024 sind Industriegüter wie Möbel bei der Einfuhr in die Schweiz zollfrei. Sie bezahlen die Schweizer MWST von 8,1 %. Angemeldet werden muss die Ware trotzdem.", src: ["bazgZoll", "mazars"] },
    { q: "Bekomme ich die österreichische USt zurück, wenn ich liefern lasse?", a: "Bei einer Lieferung in die Schweiz wird sie bei nachgewiesener Ausfuhr gar nicht erst berechnet. Eine Erstattung im Nachhinein gibt es nur, wenn Sie die Ware selbst ausführen.", src: ["wkoExport", "wkoVlbg"] },
    { q: "Kann ich den Kauf auf mehrere Personen aufteilen, um unter CHF 150 zu bleiben?", a: "Nein. Ein einzelner Gegenstand über CHF 150 ist laut BAZG immer mehrwertsteuerpflichtig, unabhängig von der Zahl der Personen.", src: ["bazgFrei"] },
    { q: "Welcher Grenzübergang passt für Selbstabholer?", a: "Lustenau/Au: Dort bestätigt der österreichische Zoll die Ausfuhr laut WKO Vorarlberg rund um die Uhr. Höchst/St. Margrethen ist Montag bis Freitag von 8 bis 16 Uhr besetzt.", src: ["wkoVlbg"] },
    { q: "Mit welchem Kurs rechnet der Zoll?", a: "Beträge in Euro rechnet der Zoll zum Devisenkurs (Verkauf) des Vortags in Franken um. Unser Rechner zeigt den EZB-Referenzkurs, deshalb sind kleine Abweichungen möglich.", src: ["bazgBemessung", "ecb"] },
    { q: "Gilt das auch für Liechtenstein?", a: "Liechtenstein gehört zum Schweizer Zollgebiet und hat ebenfalls 8,1 % MWST. Für Monteure gelten dort eigene Meldeverfahren.", src: ["pwc"] },
    { q: "Liefert Platzhirsch selbst in die Schweiz?", a: "", pruefen: "Speditionsangebote fehlen (Bericht 18, Abschn. 10), Antwort erst nach Inhaber-Entscheidung" },
    { q: "Wie viel spare ich gegenüber einem Kauf in der Schweiz?", a: "", pruefen: "Schweizer Listenpreise nicht verifiziert (Bericht 18, Abschn. 8.1) – nicht beantworten" },
  ],
};

export const SHOWROOM = {
  heading: "Vor dem Kauf persönlich klären",
  text: "In unserem Showroom in Lochau sehen Sie Möbel, Leuchten und Accessoires im Original. Wie Ihr Einkauf über die Grenze kommt, besprechen wir vor dem Kauf mit Ihnen.",
};

export const CLOSING = {
  heading: "Termin für die Beratung",
  text: "Bringen Sie, wenn möglich, Masse oder einen Grundriss mit. Fragen zu Ausfuhr und Einfuhr klären wir vor dem Kauf.",
};
