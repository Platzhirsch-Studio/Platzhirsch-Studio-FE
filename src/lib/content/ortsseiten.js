// src/lib/content/ortsseiten.js
// AP-3 (SEO-Umsetzung B, 31.10.2026): eigener, ortsbezogener Text je
// Stadtseite (/de/designermoebel-<ort>) – Grundlage qa-screenshots/seo-sistrix/
// 01-keyword-karte.md (Gruppe 2: „möbel {ort}“, „möbelhaus {ort}“,
// „designermöbel {ort}“) und 02-massnahmen.md (H2-Gerüst, ≥ 350 Wörter Unikat).
//
// Regeln (Doorway-Audit src/lib/seo/sitemap/doorwayAudit.js, Inhaber Nr. 3, 8, 19):
// - Kein Ortstausch-Gerüst: jeder Ort hat eigene Abschnitte, eigene Fragen.
// - Nur Fakten, die im Code bzw. in Marktresearch schon belegt sind; Quelle je
//   Ort in `quellen` (nur intern, wird nicht angezeigt). Fahrzeiten nur grob,
//   wie in REGION_FACTS / regionen.js. Lieferung und Montage „auf Wunsch“ bzw.
//   „auf Anfrage“, keine Preise, keine Superlative.
// - Keine erfundenen Projekte, Referenzen oder Kundenzitate. `projekte` bleibt
//   leer, bis ein Projekt aus src/lib/content/projekte.js (PROJEKTE) mit
//   Kundenfreigabe zu diesem Ort gehört; ein leeres Feld rendert nichts.
// - Bad & Wellness: Planung ja, aber keine Aussage, dass Produkte im Showroom
//   stehen (Nr. 19, eigener Bereich erst ab Sommer 2027).
// - Interne Links nur auf indexierbare Seiten (HTTP 200, index; kein Entwurf wie
//   /einkaufen-aus-der-schweiz, /outdoor-gartenplanung oder ein Ratgeber-Entwurf).
// - Nur Deutsch, wie die Stadtseiten selbst (EN/FR/IT → 404).
//
// Pure module (no imports), so node --test can load it.

export const ORTSSEITEN_DATE = "2026-10-31";

/**
 * @typedef {{ heading: string, paragraphs: string[] }} OrtBlock
 * @typedef {{ href: string, label: string }} OrtLink
 * @typedef {{ q: string, a: string }} OrtFaq
 * @typedef {{ eyebrow: string, heading: string, blocks: OrtBlock[], links: OrtLink[],
 *   projekte: { href: string, label: string }[], faq: OrtFaq[], keywords: string[], quellen: string[] }} OrtText
 */

/** @type {Record<string, OrtText>} */
export const ORTSSEITEN = Object.freeze({
  "/designermoebel-bregenz": {
    keywords: ["möbel bregenz", "möbelhaus bregenz", "designermöbel bregenz", "einrichtungshaus bregenz"],
    eyebrow: "Möbel für Bregenz",
    heading: "Möbel und Designermöbel für Bregenz – gleich hinter der Stadtgrenze",
    blocks: [
      {
        heading: "Ein Einrichtungshaus in Lochau statt einer Fahrt ins Land",
        paragraphs: [
          "Wer in Bregenz Möbel sucht, muss für Designermöbel nicht weit fahren. Lochau liegt an der Seestraße zwischen Bregenz und Lindau, unser Showroom an der Landstraße 11 ist vom Bregenzer Zentrum rund 5 Minuten entfernt. Der kurze Weg verändert die Art, wie Sie einkaufen: Sie müssen nicht an einem Tag entscheiden.",
          "Viele Entscheidungen beim Einrichten brauchen einen zweiten Blick. Kommen Sie zuerst zum Schauen, ein zweites Mal mit Maßen und Fotos und ein drittes Mal, wenn es um Stoffe, Leder und Holzoberflächen geht. Mit dem Rad geht das über den Bodensee-Radweg am Ufer, ohne Parkplatzsuche in der Stadt.",
        ],
      },
      {
        heading: "Stadtwohnung, Altbau oder Haus am Hang",
        paragraphs: [
          "Bregenz hat sehr unterschiedliche Wohnlagen. In der Innenstadt und in Vorkloster sind es oft Wohnungen mit Treppenhaus, Lift und begrenzter Stellfläche. Dort klären wir vor der Bestellung, ob ein Sofa am Stück durch Tür und Stiegenhaus passt oder besser in Elementen kommt. In Rieden, in Fluh und am Pfänderhang stehen eher Häuser mit großen Fenstern und Blick über den See. Dort planen wir Licht, Blendung und Sitzrichtung mit, damit der Platz am Fenster auch am Abend funktioniert.",
          "Weil Sie nur wenige Minuten entfernt wohnen, kommen wir für Aufmaß und Lichtplanung zu Ihnen. Harald Menghin skizziert das Konzept danach von Hand, dann folgt die 3D-Planung.",
        ],
      },
      {
        heading: "Mehr als ein Raum: Küche, Bad und Wohnen aus einer Planung",
        paragraphs: [
          "Wenn Sie in Bregenz umbauen oder neu einziehen, betrifft das selten nur das Wohnzimmer. Wir planen Küche, Wohn- und Essbereich zusammen, damit Materialien und Farben zusammenpassen. Auch Bad und Wellness planen wir mit, die Produkte zeigen wir dafür in der Beratung, nicht in der Ausstellung. Der Einkauf bleibt innerhalb Österreichs: ohne Zoll und mit österreichischer Rechnung.",
        ],
      },
    ],
    links: [
      { href: "/kuechen-vorarlberg", label: "Küchenplanung in Vorarlberg" },
      { href: "/interior-design-vorarlberg", label: "Interior Design in Vorarlberg" },
      { href: "/bad-wellness", label: "Bad & Wellness planen" },
      { href: "/ueber-uns/marken/minotti", label: "Minotti Studio by Platzhirsch Home Living" },
      { href: "/arbeitsweise", label: "So arbeiten wir: Skizze, Modell, 3D" },
    ],
    projekte: [],
    faq: [
      {
        q: "Gibt es in der Nähe von Bregenz ein Möbelhaus für Designermöbel?",
        a: "Unser Showroom liegt in Lochau an der Landstraße 11, rund 5 Minuten vom Bregenzer Zentrum. Dort zeigen wir Möbel, Leuchten und Accessoires internationaler Designmarken, darunter das Minotti Studio by Platzhirsch Home Living.",
      },
      {
        q: "Kann ich mehrmals vorbeikommen, bevor ich mich entscheide?",
        a: "Ja. Gerade aus Bregenz ist der Weg kurz. Viele Fragen zu Stoff, Farbe oder Maß lassen sich beim zweiten Besuch mit Mustern und Fotos besser beantworten.",
      },
      {
        q: "Passt ein großes Sofa in meine Wohnung in der Innenstadt?",
        a: "Das klären wir vor der Bestellung. Wir messen Tür, Stiegenhaus und Lift und prüfen, ob das Modell am Stück oder in Elementen geliefert wird.",
      },
    ],
    quellen: [
      "REGION_FACTS /designermoebel-bregenz (Fahrzeit, Radweg, Wohnlagen)",
      "Marktresearch/02-marktanalyse.md §3 (Bregenz 5 min)",
      "regionen.js Vorarlberg-Hinweis (ohne Zoll, österreichische Rechnung)",
      "Inhaber Nr. 3 (Lieferung/Montage auf Wunsch), Nr. 8 (Handzeichnung, vor Ort), Nr. 19 (kein Wellness im Showroom)",
    ],
  },

  "/designermoebel-dornbirn": {
    keywords: ["möbel dornbirn", "möbelhaus dornbirn", "designmöbel dornbirn", "einrichtung dornbirn"],
    eyebrow: "Möbel für Dornbirn",
    heading: "Möbel und Einrichtung für Dornbirn: vom Rohbau bis zur Leuchte",
    blocks: [
      {
        heading: "Zwanzig Minuten über die A14",
        paragraphs: [
          "Von Dornbirn nach Lochau fahren Sie rund 20 Minuten über die Rheintalautobahn A14 Richtung Bregenz, das sind etwa 15 Kilometer. Mit dem Zug fahren Sie bis Bregenz und von dort weiter Richtung Lindau. Weil die Fahrt etwas länger ist als aus Bregenz, lohnt sich ein Termin: Dann liegen Stoffe, Oberflächen und Unterlagen bereit, wenn Sie ankommen.",
        ],
      },
      {
        heading: "Wer in Dornbirn baut, plant die Möbel früh mit",
        paragraphs: [
          "Wer in Dornbirn neu baut oder saniert, sollte an den Zeitpunkt denken. Sobald der Grundriss steht, lassen sich Küche, Einbauschränke, Steckdosen und Licht auf die Möbel abstimmen. Wer erst nach dem Einzug plant, muss sich oft nach fertigen Anschlüssen richten.",
          "Ob Haus in Hatlerdorf, Wohnung in Rohrbach oder Hanglage in Oberdorf und Haselstauden: Wir sehen uns die Räume vor Ort an. Harald Menghin zeichnet das Konzept von Hand, bei Bedarf entsteht ein kleines Modell, danach die 3D-Planung mit fotorealistischem Bild. So sehen Sie den Raum, bevor etwas bestellt wird.",
        ],
      },
      {
        heading: "Designmöbel, Licht und Küche aus einer Hand",
        paragraphs: [
          "Im Showroom in Lochau zeigen wir Sofas, Tische, Betten und Leuchten internationaler Designmarken, darunter das Minotti Studio by Platzhirsch Home Living. Für Licht haben wir unter anderem Leuchten von Tom Dixon und Flos in der Auswahl. Die Küche planen wir in denselben Materialien und Farben wie den Wohnbereich, Einbaugeräte von Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker planen wir direkt mit ein.",
          "Italienische Designmöbel werden häufig erst nach Ihrer Bestellung gefertigt. Wer zum Einzug fertig sein will, sollte die Lieferzeit in den Bauzeitplan aufnehmen. Lieferung und Montage in Dornbirn gibt es auf Wunsch.",
        ],
      },
    ],
    links: [
      { href: "/kuechen-vorarlberg", label: "Küchenstudio in Vorarlberg" },
      { href: "/kuechengeraete", label: "Einbaugeräte, die wir einplanen" },
      { href: "/architekten", label: "Für Architekten und Bauträger" },
      { href: "/interior-design-vorarlberg", label: "Interior Design in Vorarlberg" },
      { href: "/arbeitsweise", label: "Von der Handzeichnung zum Rendering" },
    ],
    projekte: [],
    faq: [
      {
        q: "Ist Platzhirsch ein Möbelhaus für Dornbirn?",
        a: "Wir sind ein Einrichtungshaus mit Showroom in Lochau, rund 20 Minuten von Dornbirn über die A14. Wir planen Wohnräume, Küchen und Licht und kommen für das Aufmaß zu Ihnen.",
      },
      {
        q: "Kann ich zur Beratung die Pläne meines Architekten mitbringen?",
        a: "Ja, gern. Mit Grundriss und Ansichten können wir Küche, Einbauten und Möbel früh auf die Anschlüsse und das Licht abstimmen.",
      },
      {
        q: "Wie früh sollte ich die Möbel für einen Neubau bestellen?",
        a: "Viele Designmöbel werden auf Bestellung gefertigt. Planen Sie die Lieferzeit in den Bauzeitplan ein und sprechen Sie uns an, sobald der Grundriss steht.",
      },
    ],
    quellen: [
      "REGION_FACTS /designermoebel-dornbirn (20 min, 15 km, A14, Zug über Bregenz, Rohbau, Ortsteile, Tom Dixon)",
      "Marktresearch/02-marktanalyse.md §3 (Dornbirn 20 min)",
      "Ratgeber lieferzeiten-italienische-designmoebel (Fertigung auf Bestellung) – nicht verlinkt, Entwurf",
      "Inhaber Nr. 3, Nr. 8, Nr. 24 (Einbaugeräte)",
    ],
  },

  "/designermoebel-lindau": {
    keywords: ["möbel lindau", "möbelhaus lindau", "designermöbel lindau"],
    eyebrow: "Möbel für Lindau",
    heading: "Möbel und Designermöbel für Lindau – fünf Minuten über die Grenze",
    blocks: [
      {
        heading: "Über die Landstraße nach Lochau",
        paragraphs: [
          "Lochau grenzt an Bayern. Von Lindau sind es rund 5 Minuten, etwa 6 bis 8 Kilometer, am See entlang. Wer über die Landstraße fährt, braucht keine österreichische Vignette, denn die gilt nur auf Autobahnen und Schnellstraßen. Aus Reutin, Zech oder Aeschach sind Sie damit schnell bei uns, auch für einen kurzen zweiten Besuch mit Stoffmustern oder Maßen.",
        ],
      },
      {
        heading: "Einkaufen in Österreich, wohnen in Bayern",
        paragraphs: [
          "Österreich und Deutschland gehören zum EU-Binnenmarkt, Zölle fallen nicht an. Den Unterschied macht die Umsatzsteuer: Holen Sie die Möbel selbst in Lochau ab, gilt die österreichische Umsatzsteuer. Liefern wir nach Deutschland, gelten die EU-Regeln für Lieferungen an Privatpersonen. Bei einer Küche mit Montage ist es wieder anders, weil dann Lieferung und Einbau zusammen bewertet werden. Wie es bei Ihrem Einkauf aussieht, klären wir vor dem Angebot.",
        ],
      },
      {
        heading: "Insel, Uferlage, Ferienwohnung",
        paragraphs: [
          "In Lindau ist der Weg ins Haus oft die eigentliche Frage. Auf der Insel klären wir Zufahrt und Ladestelle vorab, in Bad Schachen und Hoyren stehen Häuser mit Garten und Seezugang. Deshalb fragen wir früh nach Zufahrt, Treppen und Türbreiten und klären die Lieferung für Ihre Adresse auf Anfrage.",
          "Wer am See wohnt, verbringt viel Zeit draußen. In der Ausstellung zeigen wir auch Outdoor-Möbel und Sonnenschirme, damit Terrasse und Wohnraum zueinander passen. Für Wohnungen, die nur zeitweise bewohnt werden, lohnt sich ein pflegeleichter Bezug und eine Planung, die den Winter mitdenkt.",
          "Und weil Sie nur wenige Minuten entfernt sind, kommen wir zum Aufmaß zu Ihnen, Harald Menghin skizziert das Konzept von Hand, danach folgt die 3D-Planung.",
        ],
      },
    ],
    links: [
      { href: "/wohnzimmer-einrichten-vorarlberg", label: "Wohnzimmer einrichten" },
      { href: "/kuechen-vorarlberg", label: "Küchen planen in Lochau" },
      { href: "/ueber-uns/marken/minotti", label: "Minotti Studio by Platzhirsch Home Living" },
      { href: "/dreilaender-rechner", label: "Dreiländer-Rechner: Fahrzeit und Einkauf" },
      { href: "/arbeitsweise", label: "Unsere Arbeitsweise" },
    ],
    projekte: [],
    faq: [
      {
        q: "Gibt es ein Möbelhaus für Designermöbel nahe Lindau?",
        a: "Unser Showroom liegt in Lochau, rund 5 Minuten von Lindau am See entlang. Dort zeigen wir Möbel, Leuchten, Outdoor-Möbel und Accessoires internationaler Designmarken.",
      },
      {
        q: "Gelten für eine Küche mit Montage andere Steuerregeln als für Möbel?",
        a: "Ja. Bei einer Küche, die wir liefern und einbauen, werden Lieferung und Montage zusammen betrachtet. Welche Umsatzsteuer gilt, klären wir vor dem Angebot für Ihren Fall.",
      },
      {
        q: "Planen Sie auch Terrasse und Garten am See?",
        a: "Ja. Wir planen Outdoor-Möbel, Sonnenschirme und Stoffe passend zum Wohnraum und berücksichtigen dabei Sonne, Wind und den Winter.",
      },
    ],
    quellen: [
      "REGION_FACTS /designermoebel-lindau (5 min, 6–8 km, keine Vignette, Ortsteile, Insel, Outdoor)",
      "Marktresearch/02-marktanalyse.md §3 (Lindau 5 min)",
      "Marktresearch/18 Abschnitt 5 (Abholung = österr. USt, Lieferung = EU-Fernverkauf, Küche mit Montage abweichend; wie Konstanz-Seite)",
      "Inhaber Nr. 3 (Lieferung auf Anfrage), Nr. 8",
    ],
  },

  "/designermoebel-st-gallen": {
    keywords: ["möbel st. gallen", "möbelhaus st. gallen", "designermöbel st. gallen"],
    eyebrow: "Möbel für St. Gallen",
    heading: "Möbel und Designermöbel für St. Gallen – ein Einkauf über die Grenze",
    blocks: [
      {
        heading: "Von St. Gallen an den Bodensee",
        paragraphs: [
          "Von St. Gallen nach Lochau fahren Sie 30 bis 40 Minuten, je nach Verkehr, das sind etwa 40 bis 45 Kilometer. Die Strecke führt über St. Margrethen und die Grenze bei Höchst, dann an Bregenz vorbei. Für einen Einrichtungstag reicht ein halber Tag: Beratung im Showroom, Stoffe und Oberflächen im Original, danach ein Kaffee im Haus.",
        ],
      },
      {
        heading: "Zwei Wege in die Schweiz",
        paragraphs: [
          "Für Schweizer Kundinnen und Kunden ist nicht die Fahrt die wichtigste Frage, sondern der Weg der Ware. Es gibt zwei Möglichkeiten. Sie nehmen die Möbel selbst mit, melden sie an der Grenze zur Ausfuhr an und erhalten die österreichische Umsatzsteuer zurück, sobald die Ausfuhr bestätigt ist. Oder wir liefern auf Anfrage mit einer Spedition: Sie meldet die Ausfuhr in Österreich und die Einfuhr in der Schweiz an, die Schweizer MWST und die Gebühr der Spedition bezahlen Sie beim Empfang.",
          "Welcher Weg passt, hängt von Grösse und Menge ab. Ein Sessel passt ins Auto, eine Wohnlandschaft oder eine Küche nicht. Das besprechen wir vor dem Kauf.",
        ],
      },
      {
        heading: "Stockwerkeigentum, Lift und Treppenhaus",
        paragraphs: [
          "In St. Gallen wohnen viele in Stockwerkeigentum, etwa am Rosenberg, in Rotmonten oder in St. Georgen. Dort entscheidet oft der Lift, ob ein Sofa am Stück ins Haus kommt. Bringen Sie deshalb die Masse von Lift, Treppenhaus und Wohnungstür mit, und fragen Sie bei der Verwaltung nach, ob für die Lieferung ein Termin reserviert werden muss.",
          "Arbeiten Sie mit einem Architekturbüro, planen wir gern auf dessen Grundlagen. Harald Menghin skizziert das Einrichtungskonzept von Hand, danach folgt die 3D-Planung.",
        ],
      },
    ],
    links: [
      { href: "/interior-design-vorarlberg", label: "Interior Design und Einrichtungsplanung" },
      { href: "/ratgeber/moebel-aus-oesterreich-in-die-schweiz", label: "Ratgeber: Möbel aus Österreich in die Schweiz" },
      { href: "/dreilaender-rechner", label: "Dreiländer-Rechner" },
      { href: "/architekten", label: "Für Architekten und Bauträger" },
      { href: "/ueber-uns/marken/minotti", label: "Minotti Studio by Platzhirsch Home Living" },
    ],
    projekte: [],
    faq: [
      {
        q: "Lohnt sich die Fahrt von St. Gallen für Designermöbel?",
        a: "Das hängt von Ihrem Vorhaben ab. Für die Planung mehrerer Räume sehen Sie in Lochau Möbel, Stoffe und Oberflächen im Original. Den Weg der Ware in die Schweiz klären wir vor dem Kauf.",
      },
      {
        q: "Kann ich die Möbel selbst über die Grenze bringen?",
        a: "Ja. Sie melden die Ware an der Grenze zur Ausfuhr an und erhalten die österreichische Umsatzsteuer zurück, sobald die Ausfuhr bestätigt ist. Bei der Einfuhr in die Schweiz fällt die Schweizer MWST an.",
      },
      {
        q: "Was muss ich bei Stockwerkeigentum vor der Lieferung klären?",
        a: "Masse von Lift, Treppenhaus und Türen sowie die Regeln der Verwaltung, etwa ob der Lift für die Lieferung reserviert werden muss.",
      },
    ],
    quellen: [
      "REGION_FACTS /designermoebel-st-gallen (30–40 min, 40–45 km, St. Margrethen–Höchst, Spedition Weg B, Stockwerkeigentum, Quartiere, Liftmasse)",
      "src/lib/ch/content.js WEGE (Weg A Selbstausfuhr + USt-Rückerstattung, Weg B Spedition)",
      "Marktresearch/02-marktanalyse.md §3 (St. Gallen 30–40 min); Café im Haus (Inhaber Nr. 17)",
      "Inhaber Nr. 3 (Lieferung auf Anfrage), Nr. 8",
    ],
  },

  "/designermoebel-konstanz": {
    keywords: ["möbel konstanz", "möbelhaus konstanz", "designermöbel konstanz"],
    eyebrow: "Möbel für Konstanz",
    heading: "Möbel und Designermöbel für Konstanz: ein Tag am anderen Seeufer",
    blocks: [
      {
        heading: "Rund um den See oder mit der Fähre",
        paragraphs: [
          "Eine Brücke über den Bodensee gibt es nicht. Von Konstanz nach Lochau fahren Sie rund eine Stunde, entweder am deutschen Nordufer entlang oder mit der Autofähre von Konstanz nach Meersburg und weiter über Friedrichshafen und Lindau. Die Fähre macht die Fahrt zu einem Teil des Tages: Sie kommen ausgeruht an und können die Rückfahrt am Ufer planen.",
        ],
      },
      {
        heading: "Warum sich die Strecke lohnen kann",
        paragraphs: [
          "Für ein einzelnes Kissen fährt niemand eine Stunde. Anders ist es, wenn Sie eine Wohnung in der Altstadt neu einrichten, ein Haus am Seerhein beziehen oder den Wohnbereich mit Küche und Terrasse zusammen planen. Dann hilft es, Sofa, Wandsystem, Leuchten und Outdoor-Möbel an einem Ort nebeneinander zu sehen. In Lochau sind das unter anderem das Minotti Studio by Platzhirsch Home Living und Wohnsysteme von Rimadesio.",
          "Damit sich die Fahrt lohnt, vereinbaren Sie am besten vorher einen Termin. Schicken Sie uns Grundriss, Fotos und, falls vorhanden, die Pläne Ihres Architekten. Dann liegen beim Besuch passende Stoffe und Oberflächen bereit.",
        ],
      },
      {
        heading: "Mitnehmen oder liefern lassen",
        paragraphs: [
          "Wenn Sie gekaufte Möbel selbst mitnehmen, fahren Sie am besten über das deutsche Ufer zurück. So bleibt die Ware im EU-Binnenmarkt, und es gibt keine Zollformalitäten. Bei Abholung in Lochau gilt die österreichische Umsatzsteuer, bei einer Lieferung nach Deutschland gelten die EU-Regeln. Lieferung und Montage am westlichen Bodensee klären wir für Ihre Adresse auf Anfrage.",
          "Für Altbauwohnungen fragen wir früh nach Treppenhaus und Zugang. Harald Menghin skizziert das Konzept von Hand, danach folgt die 3D-Planung, bevor etwas bestellt wird.",
        ],
      },
    ],
    links: [
      { href: "/ueber-uns/marken/minotti", label: "Minotti Studio by Platzhirsch Home Living" },
      { href: "/interior-design-vorarlberg", label: "Interior Design und Einrichtungsplanung" },
      { href: "/wohnzimmer-einrichten-vorarlberg", label: "Wohnzimmer einrichten" },
      { href: "/termin", label: "Termin für einen Einrichtungstag" },
      { href: "/dreilaender-rechner", label: "Dreiländer-Rechner: Fahrzeit ab Lochau" },
    ],
    projekte: [],
    faq: [
      {
        q: "Wo finde ich von Konstanz aus ein Möbelhaus mit Minotti?",
        a: "Das Minotti Studio by Platzhirsch Home Living liegt in Lochau am Ostufer des Bodensees, rund eine Stunde von Konstanz über das Nordufer oder mit der Fähre Konstanz–Meersburg.",
      },
      {
        q: "Soll ich vor dem Besuch Unterlagen schicken?",
        a: "Ja, das hilft. Mit Grundriss, Fotos und Plänen bereiten wir passende Stoffe und Oberflächen vor, damit sich die Fahrt lohnt.",
      },
      {
        q: "Welche Strecke nehme ich mit gekauften Möbeln im Auto?",
        a: "Am besten über das deutsche Ufer. Dann bleibt die Ware im EU-Binnenmarkt, und Zollformalitäten entfallen.",
      },
    ],
    quellen: [
      "Konstanz-Seite Kopfkommentar: Marktresearch/02 §3 (60 min), 04 (keine Brücke, Fähre), 18 §5 (USt)",
      "regionen.js (rund eine Stunde um den See oder mit der Fähre Konstanz–Meersburg)",
      "Konstanz-FAQ (über das deutsche Ufer zurück, EU-Binnenmarkt)",
      "Inhaber Nr. 3, Nr. 8, Nr. 22 (Minotti-Wortlaut); Rimadesio nur als Marke in der Ausstellung",
    ],
  },
});

/** Ortstext einer Stadtseite oder null (Seiten ohne eigenen Text rendern nichts). */
export function ortText(path) {
  return ORTSSEITEN[path] || null;
}

/** Sichtbarer Text eines Ortsblocks (für Wortzahl- und Ähnlichkeitsprüfung). */
export function ortPlainText(entry) {
  if (!entry) return "";
  return [
    entry.heading,
    ...entry.blocks.flatMap((b) => [b.heading, ...b.paragraphs]),
    ...entry.faq.flatMap((f) => [f.q, f.a]),
  ].join(" ");
}

export const wordCount = (text) => String(text || "").split(/\s+/).filter(Boolean).length;
