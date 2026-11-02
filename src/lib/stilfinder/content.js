// src/lib/stilfinder/content.js
// Editorial texts of the Moodboard PDF, per style profile plus shared chapters.
//
// AI Act Art. 50: these texts were drafted with the help of an AI system and
// are assigned to a profile by fixed rules (no AI at request time). The PDF
// labels them on every text page and in the notes chapter (KI_NOTE).
// Rules (Rechtspaket, Design-Bibel §1/§14): no superlatives, no dealer or
// partner claims, no prices, no promises on delivery or stock. Measures are
// marked as guide values ("Richtwerte").
// Plain module, no imports: node --test loads it directly.

export const KI_NOTE =
  "Die Texte dieser Präsentation wurden mit Unterstützung eines KI-Systems verfasst und Ihrem Stilprofil nach festen Regeln zugeordnet (keine KI-Auswertung Ihrer Person). Sie sind Anregungen für Ihr Gespräch mit uns, keine Zusagen zu Ausführung, Lieferung oder Preis.";

export const KI_SHORT = "Texte KI-gestützt";

export const ROOM_ORDER = ["wohnen", "essen", "kueche", "schlafen", "outdoor"];

export const ROOM_META = {
  wohnen: { title: "Wohnen", overline: "Raum 01" },
  essen: { title: "Essen", overline: "Raum 02" },
  kueche: { title: "Küche", overline: "Raum 03" },
  schlafen: { title: "Schlafen", overline: "Raum 04" },
  outdoor: { title: "Outdoor", overline: "Raum 05" },
};

// Shared room tips – guide values that apply to every profile.
export const ROOM_TIPS = {
  wohnen: [
    ["Abstand Sofa – Couchtisch", "40–45 cm: nah genug zum Abstellen, weit genug für die Beine."],
    ["Teppich", "Alle vorderen Füße der Sitzgruppe stehen auf dem Teppich. Lieber eine Nummer größer."],
    ["Laufwege", "Mindestens 80 cm, entlang der Hauptwege besser 90 cm."],
  ],
  essen: [
    ["Platz je Person", "60–70 cm Tischkante, bei Armlehnstühlen eher 70 cm."],
    ["Rund um den Tisch", "Etwa 90 cm bis zur Wand, damit Stühle zurückgeschoben werden können."],
    ["Pendelleuchte", "Unterkante 60–70 cm über der Tischplatte, gedimmt warmweiß."],
  ],
  kueche: [
    ["Arbeitshöhe", "Etwa 10–15 cm unter dem angewinkelten Ellbogen. Wir messen sie im Termin mit Ihnen aus."],
    ["Durchgang", "Zwischen Zeilen oder Insel und Zeile 100–120 cm, bei zwei Kochenden eher 120 cm."],
    ["Barhocker", "Sitzhöhe etwa 25–30 cm unter der Tresenkante, 60 cm Breite je Platz."],
  ],
  schlafen: [
    ["Seitlich vom Bett", "60–70 cm frei, damit man bequem aufstehen und das Bett beziehen kann."],
    ["Nachttisch", "Oberkante etwa auf Höhe der Matratze oder wenige Zentimeter darüber."],
    ["Schrank", "Vor offenen Schranktüren 80–90 cm Bewegungsraum."],
  ],
  outdoor: [
    ["Zonen", "Essen, Liegen und Schatten wie drinnen als eigene Bereiche planen."],
    ["Schirm", "Der Schatten wandert: Schirmgröße etwa 1 m größer als die Fläche darunter wählen."],
    ["Wetter", "Kissen mit schnell trocknender Füllung, über den Winter trocken und belüftet lagern."],
  ],
};

export const CARE = [
  ["Holz", "Mit leicht feuchtem, gut ausgewrungenem Tuch in Faserrichtung wischen. Geöltes Holz ein- bis zweimal im Jahr nachölen. Untersetzer und Filzgleiter schützen vor Ringen und Kratzern. Direkte Sonne verändert den Farbton, gleichmäßig wechselnde Deko vermeidet helle Flecken."],
  ["Naturstein", "Säure (Zitrone, Wein, Essig) sofort aufnehmen. Neutrale Pflegemittel, keine Scheuermilch. Imprägnierung je nach Stein und Nutzung alle ein bis drei Jahre prüfen lassen."],
  ["Textil und Leder", "Regelmäßig absaugen, Flecken tupfen statt reiben. Kissen aufschütteln und wenden, damit sich die Füllung gleichmäßig setzt. Leder vor Heizung und Sonne schützen und je nach Gerbung pflegen."],
  ["Metall und Glas", "Lackiertes Metall mit mildem Seifenwasser, Messing nach Wunsch polieren oder Patina zulassen. Glas mit weichem Tuch, ohne Ammoniak bei Spiegeln mit Facette."],
  ["Draußen", "Teak darf vergrauen oder wird mit Teakschutz im Ton gehalten. Geflecht mit klarem Wasser abspülen. Stoffe vor dem Winter trocknen, nicht in Folie luftdicht verpacken."],
];

export const PLANNING = [
  ["Grundriss mitbringen", "Ein Plan mit Maßen oder ein Foto mit Maßband ist ideal. Fensterhöhen, Heizkörper und Steckdosen gleich mit notieren."],
  ["Fotos vom Raum", "Bei Tageslicht und am Abend: So sehen wir, wie Licht und Farbe tatsächlich wirken."],
  ["Lieblingsstücke", "Was bleibt? Ein Erbstück, ein Bild, ein Teppich: Wir planen das Neue um das Vorhandene herum."],
  ["Zeitrahmen", "Gibt es einen Einzugstermin? Lieferzeiten hängen von Hersteller, Bezug und Ausführung ab, wir klären sie pro Stück."],
  ["Budgetrahmen", "Eine grobe Spanne hilft, die richtigen Stücke zu zeigen. Ein Angebot erstellen wir erst, wenn Maße und Ausführung feststehen."],
  ["Muster", "Stoffe, Hölzer und Steine wirken bei Ihnen zu Hause anders als bei uns. Nach Möglichkeit geben wir Muster zum Ausprobieren mit."],
];

export const LIGHT_LAYERS = [
  ["Grundlicht", "Gleichmäßig und blendfrei, gern indirekt über Decke oder Wand. Dimmbar, damit der Raum am Abend leiser wird."],
  ["Zonenlicht", "Über dem Esstisch, am Lesesessel, an der Arbeitsplatte: Licht dort, wo etwas passiert."],
  ["Akzentlicht", "Ein Bild, eine Nische, ein Pflanzentopf. Wenige Lichtpunkte machen einen Raum tief."],
];

export const PROFILE_CONTENT = {
  ruhe: {
    introTitle: "Ein Zuhause, das durchatmet.",
    intro: [
      "Ihre Antworten erzählen von Räumen, in denen nichts drängt. Von tiefen Sofas, auf denen man den Abend verliert, von Stoffen, die man im Vorbeigehen berührt, und von Farben, die sich zurücknehmen, damit das Licht vom See die Hauptrolle spielt.",
      "Italienische Ruhe ist keine Leere. Sie entsteht aus wenigen, sehr gut gemachten Stücken, aus großzügigen Proportionen und aus Materialien, die mit den Jahren schöner werden. Auf den folgenden Seiten haben wir Ihre Palette, Ihre Materialien und Stücke aus unserem Katalog Raum für Raum zusammengestellt.",
    ],
    traits: [
      ["Proportion", "Niedrig und breit statt hoch und schmal. Sitzflächen mit Tiefe, Tische mit ruhigen Kanten."],
      ["Haptik", "Bouclé, Leinen, gewaschene Wolle: Oberflächen, die man spürt, bevor man sie sieht."],
      ["Atmosphäre", "Gedämpft, warm, sehr hell am Tag und fast kerzenhell am Abend."],
    ],
    // QA Runde 2, P2.3: one source for the 60/30/10 graphic and its text.
    // Palette indices; {t} = tone names. Text of each role follows its tones.
    colorRoles: {
      base: [[0, 1], "{t} tragen Wände, Böden und große Polster."],
      companion: [[2], "{t} gibt Teppichen und Vorhängen Tiefe."],
      accent: [[3, 4], "{t} erscheinen nur in Linien: ein Tischgestell, ein Bilderrahmen, eine Leuchte."],
    },
    colorClose: "So bleibt der Raum hell und wirkt trotzdem geerdet.",
    materials: {
      holz: ["Eiche geräuchert oder gebürstet, Nussbaum in matten Ölen. Breite Dielen beruhigen große Flächen.", ["Eiche geräuchert", "Eiche natur geölt", "Nussbaum matt"]],
      stein: ["Travertin mit offenen oder gespachtelten Poren, warmer Kalkstein. Lieber eine große Platte als viele kleine Stücke.", ["Travertin", "Kalkstein", "Sandstein geschliffen"]],
      textil: ["Bouclé, Leinen, Kaschmir-Mischungen und dichte Wollteppiche in Ton-in-Ton-Abstufungen.", ["Bouclé", "Leinen", "Wolle", "Kaschmir-Plaid"]],
      metall: ["Bronze und dunkel brüniertes Messing, sparsam: als Fuß, als Griff, als dünne Linie.", ["Bronze matt", "Messing brüniert"]],
    },
    rooms: {
      wohnen: "Ein großes, niedriges Sofa ist der Anker. Daneben ein Sessel mit anderem Bezug in derselben Farbfamilie und ein Couchtisch aus Stein oder Holz. Der Teppich fasst alles zu einer Insel.",
      essen: "Ein langer Tisch mit massiver Platte, Stühle mit Polster, ein Licht, das tief hängt. Hier sitzt man lange, also zählt der Sitzkomfort mehr als die Silhouette.",
      kueche: "Ruhige Fronten ohne sichtbare Griffe, eine durchgehende Steinplatte und offene Fächer nur dort, wo schöne Dinge stehen. Die Küche gehört zum Wohnraum und soll auch so aussehen.",
      schlafen: "Ein gepolstertes Bett mit weichem Kopfteil, Bettwäsche aus Leinen, Nachttische mit Schublade statt offener Ablage. Wenig Möbel, viel Stoff.",
      outdoor: "Draußen setzt sich drinnen fort: tiefe Lounge-Möbel, Teppich für die Terrasse, Stein und Holz in denselben Tönen wie im Wohnraum.",
    },
    combos: [
      ["Die Abendinsel", "Sofa, Teppich und ein kleiner Tisch in drei Nuancen derselben Farbe: Ton in Ton wirkt ruhig und doch reich.", ["wohnen:0", "wohnen:2", "wohnen:3"]],
      ["Tafel für lange Abende", "Massive Platte, gepolsterte Stühle, gedimmtes Licht. Dazu ein Stück aus dem Wohnraum, das die Farbe aufnimmt.", ["essen:0", "essen:1", "wohnen:1"]],
      ["Leise Übergänge", "Schlafraum und Terrasse teilen dieselben Materialien. So entsteht ein Haus aus einem Guss.", ["schlafen:0", "outdoor:0", "schlafen:1"]],
    ],
    light: "Warmweiß um 2.700 K, am Abend auf 2.200 K gedimmt. Viele niedrige Lichtquellen statt eines hellen Deckenlichts.",
  },
  warm: {
    introTitle: "Klarheit mit Wärme.",
    intro: [
      "Ihre Antworten verbinden zwei Dinge, die oft getrennt gedacht werden: klare Formen und echte Wärme. Sie mögen Holz, das man sieht, Leder, das Patina bekommen darf, und Keramik mit kleinen Unregelmäßigkeiten.",
      "Der Esstisch ist bei Ihnen mehr als ein Möbel. Er ist der Ort, an dem Gäste bleiben. Darum beginnen wir auf den folgenden Seiten bei Material und Farbe und führen Sie dann Raum für Raum zu Stücken aus unserem Katalog, die zu dieser Haltung passen.",
    ],
    traits: [
      ["Form", "Klare Silhouetten mit weichen Kanten. Gestelle aus Holz, sichtbare Verbindungen."],
      ["Material", "Nussbaum, Cognac-Leder, Wolle und Keramik. Echte Oberflächen, die altern dürfen."],
      ["Atmosphäre", "Gesellig, hell, mit warmen Inseln aus Licht am Abend."],
    ],
    colorRoles: {
      base: [[0], "{t} ist die Grundfläche für Wände und große Textilien."],
      companion: [[1, 2], "{t} kommen über Möbel und Leder in den Raum."],
      accent: [[3, 4], "{t} setzen die Akzente: ein einzelnes Polster, Pflanzen, Leuchten, Bilderrahmen, Stuhlbeine."],
    },
    colorClose: "So wirkt der Raum warm, ohne schwer zu werden.",
    materials: {
      holz: ["Nussbaum und Eiche in warmen Ölen, gern mit sichtbarer Maserung. Massivholz an den Stellen, die man berührt.", ["Nussbaum geölt", "Eiche natur", "Esche"]],
      // QA Runde 2, P2.4 d: warm stones only (no grey terrazzo next to cognac and oat)
      stein: ["Travertin und warmer Kalkstein mit lebendiger Zeichnung. Terrazzo nur mit warmer, beiger oder terrakottafarbener Körnung. In der Küche gern eine helle, matte Oberfläche.", ["Travertin", "Kalkstein", "Terrazzo warm"]],
      textil: ["Wolle, Leinen und Leder in Cognac. Teppiche mit Struktur, Polster mit Webbild.", ["Wollbouclé", "Leinen", "Cognac-Leder", "Filz"]],
      metall: ["Schwarz, Bronze, gebürstetes Messing. Dazu Opalglas bei Leuchten für ein weiches Licht.", ["Schwarz matt", "Messing gebürstet", "Opalglas"]],
    },
    rooms: {
      wohnen: "Ein Sofa mit Holzgestell oder Lederbezug, ein Sessel als Lieblingsplatz, Beistelltische, die man verschieben kann. Keramik und Bücher bringen das Persönliche.",
      essen: "Das Herz des Hauses: ein Tisch aus Holz, unterschiedliche Stühle in einer Linie, darüber eine Leuchte, die selbst ein Objekt ist.",
      kueche: "Holzfronten oder Fronten in Hafer, eine helle Arbeitsplatte, offene Borde für Keramik. Barhocker machen die Insel zum Treffpunkt.",
      schlafen: "Ein Bett mit Holz- oder Stoffkopfteil, Leinen in Hafer und Oliv, eine Leseleuchte auf jeder Seite.",
      outdoor: "Teak und Seil, ein langer Tisch unter Bäumen oder einer Pergola, Kissen in Oliv und Cognac.",
    },
    combos: [
      ["Der Tisch für alle", "Holztisch, Stühle in einer Linie, darüber ein Licht als Skulptur. Ein Stück aus dem Wohnraum hält die Farbe.", ["essen:0", "essen:1", "wohnen:1"]],
      ["Der Lieblingsplatz", "Sessel, kleiner Tisch und ein Licht: Die Leseecke ist ein eigener Raum im Raum.", ["wohnen:0", "wohnen:2", "schlafen:2"]],
      ["Von innen nach außen", "Dieselben warmen Töne am Esstisch drinnen und auf der Terrasse.", ["outdoor:0", "outdoor:1", "essen:2"]],
    ],
    light: "Warmweiß 2.700 K. Pendelleuchten mit weich streuendem Schirm aus Opalglas, Stoff oder Kokon über dem Tisch, dazu Tischleuchten auf Sideboard und Fensterbank.",
  },
  see: {
    introTitle: "Draußen ist Ihr schönstes Zimmer.",
    intro: [
      "Ihre Antworten führen nach draußen: zu einer Terrasse, auf der der Tag mit Kaffee beginnt und mit dem letzten Licht über dem Wasser endet. Sie leben mit dem Wetter und wollen Möbel, die das auch können.",
      "Seeterrasse bedeutet, dass drinnen und draußen eine Sprache sprechen: Kalk, Seenebel und Teak, Geflecht und wetterfeste Stoffe. Auf den folgenden Seiten finden Sie Ihre Palette, die passenden Materialien und Stücke aus unserem Katalog, vom Wohnzimmer bis zum Sonnenschirm.",
    ],
    traits: [
      ["Offenheit", "Wenige, leichte Möbel, viel Fläche. Durchblicke bleiben frei."],
      ["Material", "Teak, Geflecht, Outdoor-Stoffe und Naturstein, die Sonne und Regen aushalten."],
      ["Atmosphäre", "Hell und luftig, mit dem See als Farbgeber und dem Abendlicht als Höhepunkt."],
    ],
    colorRoles: {
      base: [[0, 1], "{t} sind die großen Flächen, drinnen wie draußen."],
      companion: [[2, 3], "{t} begleiten in Kissen, Glas, Holz und Geflecht."],
      accent: [[4], "{t} bleibt für Gestelle, Leuchten und Pflanzgefäße."],
    },
    colorClose: "So bleibt der Blick frei für den See.",
    materials: {
      holz: ["Teak, Iroko und helle, geölte Eiche. Draußen darf Holz silbergrau werden, drinnen bleibt es warm.", ["Teak", "Eiche hell geölt", "Iroko"]],
      stein: ["Naturstein mit rauer, rutschfester Oberfläche für draußen, drinnen hell und matt.", ["Quarzit", "Kalkstein geflammt", "Feinsteinzeug"]],
      textil: ["Outdoor-Stoffe aus lösungsgefärbtem Garn, Seil und Geflecht, drinnen Leinen und Baumwolle.", ["Outdoor-Stoff", "Seilgeflecht", "Leinen"]],
      metall: ["Pulverbeschichtetes Aluminium und Edelstahl, matt und in Schiefer oder Kalk.", ["Aluminium pulverbeschichtet", "Edelstahl gebürstet"]],
    },
    rooms: {
      wohnen: "Ein helles, modulares Sofa, Beistelltische aus Holz oder Geflecht und ein Teppich mit Struktur. Der Blick nach draußen bestimmt die Ausrichtung.",
      essen: "Ein Tisch, der auch draußen stehen könnte, Stühle mit Geflecht oder Seil. Im Sommer wandert das Essen auf die Terrasse.",
      kueche: "Helle Fronten, robuste Arbeitsplatte, viel Licht. Wer gern draußen kocht, plant eine Außenküche gleich mit.",
      schlafen: "Leinen in Kalk und Seenebel, ein Bett mit Stoff oder hellem Holz, Vorhänge, die das Morgenlicht weich machen.",
      outdoor: "Lounge, Liegen, Essplatz und Schatten als eigene Zonen. Dazu Licht für den Abend und Kissen, die schnell trocknen.",
    },
    combos: [
      ["Die Abendterrasse", "Lounge, Liege und Schirm: Ein Platz für den Nachmittag und einer für den Sonnenuntergang.", ["outdoor:0", "outdoor:1", "outdoor:3"]],
      ["Sommerküche", "Essplatz drinnen und draußen in denselben Tönen, damit der Umzug im Mai leichtfällt.", ["essen:0", "essen:1", "outdoor:2"]],
      ["Das helle Wohnzimmer", "Modulares Sofa, Teppich und ein Stück Geflecht holen die Terrasse nach innen.", ["wohnen:0", "wohnen:1", "wohnen:2"]],
    ],
    light: "Tagsüber Tageslicht, abends 2.700 K. Draußen akkubetriebene Leuchten und blendfreie Wegebeleuchtung, damit der See sichtbar bleibt.",
  },
  salon: {
    introTitle: "Mehr Geschichte, mehr Gefühl.",
    intro: [
      "Ihre Antworten zeigen Freude an Räumen mit Persönlichkeit: Samt, der das Licht schluckt, Messing, das es zurückwirft, ein Spiegel mit Patina und ein Bett, in dem man versinkt. Sie scheuen keine Kontraste, solange alles zusammen ein Fest ergibt.",
      "Ein Salon entsteht durch Schichten: Farben, Stoffe, Glanz und Geschichten. Auf den folgenden Seiten sortieren wir diese Schichten, von Ihrer Palette über Materialien bis zu Stücken aus unserem Katalog für jeden Raum.",
    ],
    traits: [
      ["Kontrast", "Hell und dunkel, matt und glänzend, weich und hart: Spannung ist gewollt."],
      ["Material", "Samt, Messing, Marmor, Spiegelglas und Seide."],
      ["Atmosphäre", "Abendlich, gesellig, mit warmem Glanz und tiefen Farben."],
    ],
    colorRoles: {
      base: [[0], "{t} hält den Raum hell, auf Wänden, Böden und großen Flächen."],
      companion: [[2, 3], "{t} sind die großen Gefühle, auf einem Sofa, einem Samtvorhang oder einer Wand."],
      accent: [[1, 4], "{t} setzen Lichtpunkte und geben Halt, in Rahmen, Leuchten und Gestellen."],
    },
    colorClose: "So bleibt der Salon festlich, ohne zu überladen.",
    materials: {
      holz: ["Dunkle Hölzer mit Glanz, Nussbaum, gebeizte Eiche, gern mit Intarsien oder Profil.", ["Nussbaum poliert", "Eiche dunkel gebeizt", "Wurzelholz"]],
      stein: ["Marmor mit kräftiger Zeichnung, im Bad und auf Tischen. Ein Stück mit Charakter genügt.", ["Marmor Calacatta", "Verde Alpi", "Rosso Levanto"]],
      textil: ["Samt, Seide, Jacquard und schwere Vorhänge. Bettwäsche mit Glanz.", ["Samt", "Seide", "Jacquard"]],
      metall: ["Messing poliert oder mit Patina, Spiegelglas und Rauchglas.", ["Messing", "Spiegelglas", "Bronze"]],
    },
    rooms: {
      wohnen: "Ein Sofa mit Samtbezug, zwei Sessel im Gespräch, ein Couchtisch mit Glanz und ein großer Spiegel, der das Licht verdoppelt.",
      essen: "Ein Tisch mit Steinplatte oder dunklem Holz, Stühle mit Samt, ein Kronleuchter oder eine Pendelleuchte aus Glas und Messing.",
      kueche: "Dunkle Fronten mit Messingdetails, Marmor mit Zeichnung, Barhocker mit Polster. Die Küche darf Abendgarderobe tragen.",
      schlafen: "Ein Bett mit hohem Polsterkopfteil, Bettwäsche aus Seide oder Satin, Nachttische mit Glanz und eine Duftkerze.",
      // QA Runde 3, P2.5: text matches the pieces (black wrought iron, light cushions)
      outdoor: "Auch draußen mit Haltung: Schmiedeeisen in Schwarz, helle Polster wie ein Salonsofa, Kissen in Smaragd oder Bordeaux und ein großer Schirm für den Abend.",
    },
    combos: [
      ["Der Salon am Abend", "Sofa und Sessel aus dem Wohnraum, dazu ein Stück aus dem Schlafzimmer: Glanz und Tiefe im Wechsel.", ["wohnen:0", "wohnen:1", "schlafen:2"]],
      ["Dinner mit Glanz", "Tisch, gepolsterte Stühle, ein Licht als Mittelpunkt.", ["essen:0", "essen:1", "essen:2"]],
      ["Das Schlafzimmer als Rückzug", "Polsterbett mit hohem Kopfteil, ein Nachttisch mit Glanz und ein Stück aus dem Wohnraum.", ["schlafen:0", "schlafen:1", "wohnen:2"]],
    ],
    light: "Sehr warm, 2.200–2.700 K, dimmbar. Kerzen und Tischleuchten wichtiger als Deckenlicht. Messing und Spiegel verstärken jede Lichtquelle.",
  },
  klar: {
    introTitle: "Wenig, aber genau.",
    intro: [
      "Ihre Antworten zeigen einen Sinn für Präzision. Sie mögen Linien, die aufgehen, Ordnung, die nicht auffällt, und Stücke, die genug Raum um sich herum haben, damit man sie wirklich sieht.",
      "Klare Linie heißt nicht kühl. Es heißt, dass jedes Stück einen Grund hat. Auf den folgenden Seiten zeigen wir Ihnen Palette, Materialien und Stücke aus unserem Katalog, die diese Genauigkeit teilen, und wie man sie mit Licht und Textil wohnlich macht.",
    ],
    traits: [
      ["Linie", "Grafische Silhouetten, schmale Profile, exakte Fugen."],
      ["Material", "Glas, Aluminium, matter Lack und Beton, ergänzt durch ein warmes Element."],
      ["Atmosphäre", "Konzentriert, hell, mit Licht als Gestaltungsmittel."],
    ],
    colorRoles: {
      base: [[0], "{t} ist die Fläche für Wand und Decke."],
      companion: [[1, 2], "{t} kommen über Möbel und Stauraum."],
      accent: [[3, 4], "{t} setzen die Linien, mit Bronze als der einen warmen Ausnahme: ein Tisch, eine Leuchte, ein Griff."],
    },
    colorClose: "So bleibt der Raum ruhig und genau.",
    materials: {
      holz: ["Eiche in hellem oder schwarzem Furnier, sehr gleichmäßig. Als warmer Gegenpol zu Glas und Metall.", ["Eiche furniert", "Eiche schwarz gebeizt"]],
      stein: ["Beton, Feinsteinzeug in großen Formaten, dunkler Basalt. Fugen so wenige wie möglich.", ["Beton", "Basalt", "Feinsteinzeug"]],
      textil: ["Dichte Wollstoffe, Filz, glattes Leder. Struktur statt Muster.", ["Wollfilz", "Leder glatt", "Mohair"]],
      metall: ["Aluminium eloxiert, Stahl schwarz, Rauchglas und Bronze als Akzent.", ["Aluminium", "Stahl schwarz", "Rauchglas"]],
    },
    rooms: {
      wohnen: "Ein Sofa mit klarer Kontur, ein Regal oder Lowboard mit Glas und Metall, ein Teppich mit Struktur. Stauraum bis unter die Decke, damit der Rest leer bleibt.",
      essen: "Ein Tisch mit schlankem Gestell, Stühle mit grafischer Silhouette, eine Leuchte als Linie über der Platte.",
      kueche: "Grifflose Fronten, eine durchgehende Arbeitsplatte, alles hinter Türen. Ein Bord aus Metall oder Glas für das Wenige, das sichtbar bleibt.",
      schlafen: "Ein Bett mit niedrigem Kopfteil, ein Schrank mit Glas- oder Lackfronten, ein Nachttisch aus Metall.",
      outdoor: "Aluminium und Glas auch draußen, klare Rechtecke, Sonnenschirm in Graphit. Bepflanzung in einer Art.",
    },
    combos: [
      ["Die präzise Wand", "Regal, Lowboard und Leuchte als eine Komposition aus Linien.", ["wohnen:0", "wohnen:1", "wohnen:3"]],
      ["Der Tisch als Grafik", "Schlankes Gestell, grafische Stühle, eine Leuchte als Strich darüber.", ["essen:0", "essen:1", "essen:2"]],
      ["Ruhe hinter Türen", "Schrank, Bett und Nachttisch in einem Farbton: Ordnung, die man nicht sieht.", ["schlafen:0", "schlafen:1", "schlafen:2"]],
    ],
    light: "Neutralweiß 3.000 K für Arbeit und Küche, 2.700 K im Wohnen. Lineare Leuchten, indirektes Licht in Fugen und Nischen.",
  },
};

/**
 * A personal sentence for the introduction from the optional form answers
 * (QA Runde 1, P2.8: replaces the paragraph that repeated the profile text).
 */
export function personalLine({ projektLabel, regionLabel } = {}, { roomsPage, planningPage } = {}) {
  const pages = roomsPage && planningPage ? ` Ab Seite ${roomsPage} finden Sie zu jedem Raum Richtwerte für die Planung, auf Seite ${planningPage}, was Sie zum ersten Termin mitbringen können.` : "";
  if (projektLabel && regionLabel) return `Sie planen: ${projektLabel}, in ${regionLabel === "Andere Region" ? "Ihrer Region" : regionLabel}.${pages}`;
  if (projektLabel) return `Sie planen: ${projektLabel}.${pages}`;
  if (regionLabel && regionLabel !== "Andere Region") return `Ihr Zuhause liegt in ${regionLabel}, wir sind in Lochau am Bodensee gut erreichbar.${pages}`;
  return `Erzählen Sie uns beim Termin, für welchen Raum Sie planen. Dann wird aus diesem Moodboard ein Plan.${pages}`;
}

// 60 – 30 – 10 (QA Runde 2, P2.3): graphic and text come from colorRoles.
export const COLOR_SHARES = [
  ["base", 60, "Grundfläche", "Wände, Böden, große Polster"],
  ["companion", 30, "Begleiter", "Möbel, Teppiche, Vorhänge"],
  ["accent", 10, "Akzent", "Linien, Licht, Details"],
];

const joinNames = (names) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} und ${names.at(-1)}` : names[0] || "");

/** [{ key, pct, title, desc, tones: [{name, hex}], sentence }] for one profile. */
export function colorRoles(content, palette) {
  return COLOR_SHARES.map(([key, pct, title, desc]) => {
    const [idx, text] = content.colorRoles[key];
    const tones = idx.map((i) => palette[i]).filter(Boolean);
    return { key, pct, title, desc, tones, sentence: text.replace("{t}", joinNames(tones.map((t) => t.name))) };
  });
}

/** The paragraph of the "Wie viel wovon?" page, from the same roles as the graphic. */
export function colorUseText(content, palette) {
  return [...colorRoles(content, palette).map((r) => r.sentence), content.colorClose].filter(Boolean).join(" ");
}
