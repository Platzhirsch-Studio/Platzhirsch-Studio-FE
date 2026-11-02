// src/lib/katalog/marken/quooker.js – Quooker (Quooker Österreich GmbH, Klagenfurt)
// Stand 31.10.2026. Anleitung: qa-screenshots/wellness/produkte/ANLEITUNG-MARKEN.md
//
// Quellen: nur die offizielle Herstellerseite quooker.at (Seiten laden Inhalte per
// Skript → wie ein normaler Besucher in Playwright, Standard-Chromium, ohne
// gefälschten User-Agent geöffnet; robots.txt Crawl-delay beachtet).
// Umfang (Nr. 24): alle 12 Armaturen der Kollektion (Menü „Unsere Wasserhähne“),
// die drei Kochendwasser-Reservoire PRO3/COMBI/COMBI+ und der CUBE.
// Oberflächen und Reservoir je Armatur als `ausfuehrungen` (laut Konfigurator
// quooker.at/configurator, 31.10.2026), Varianten im Detail beim Hersteller.
// Webshop-Zubehör, Ersatz- und Serviceteile sind keine eigenen Einträge
// (Begründung je URL: qa-screenshots/wellness/produkte/vollstaendigkeit-quooker.md).
//
// Preise (Nr. 26): „ab“-Angaben der Armaturen-Übersicht auf quooker.at (je Armatur,
// System mit Reservoir PRO3 laut Konfigurator). Die Preise auf quooker.at sind
// Endpreise inkl. MwSt. – gegengeprüft: Scale Control R (€ 245) und CUBE (€ 1.200)
// stehen im Konfigurator und im Webshop mit Zusatz „inkl. MwSt.“ mit gleichem Betrag.
// Reservoire ohne Preis (der Hersteller nennt nur Aufpreise im Konfigurator, keinen
// Einzelpreis). Die Preisliste zum Herunterladen (quooker.at/service/preisliste) war
// am 31.10.2026 ohne Datei-Link – nicht verwendet.
//
// Bilder: unverändert aus dem Bild-CDN der Herstellerseite (images.eu.ctfassets.net,
// Originaldatei ohne die Zuschnitt-Parameter w/h der Seite) bzw. statische Datei der
// Seite (COMBI). Motiv unverändert, einheitlich ≤ 1600 px lange Kante, WebP q82 (tools/images/optimize-katalog.mjs).
// Quelle je Bild: docs/bildquellen/QUELLEN.md, Abschnitt „Katalog Quooker“.
// Bewusst nicht übernommen: Werbe-Absolute der Herstellertexte („perfekt“,
// „meistverkauft“, „ikonisch“), Kundenbewertungen, Aussagen zu Einsparungen.

const STAND = "2026-10-31";
const T = (de, en, fr, it) => Object.freeze({ de, en, fr, it });
const DIR = "/Images/Wellness/produkte/quooker/";
const bild = (file, width, height, alt, quelleUrl, typ = "freisteller") =>
  Object.freeze({ src: `${DIR}${file}`, width, height, alt, quelleUrl, abgerufen: STAND, typ });
const mass = (key, wert) => Object.freeze({ key, wert });

const AT = "https://www.quooker.at";
const RESERVOIRE = `${AT}/reservoire`;
const CUBE_SEITE = `${AT}/reservoire/cube`;
const CUBE_SHOP = `${AT}/refills-and-parts/cube-and-accessories/cube`;
const konfig = (tap) => `${AT}/configurator?tap=${tap}`;
const hahn = (s) => `${AT}/wasserhahn/${s}`;

// ---------------------------------------------------------------- Ausführungen
const OBERFLAECHEN = {
  chrom: T("Verchromt glänzend", "Polished chrome", "Chromé brillant", "Cromato lucido"),
  edelstahl: T("Voll-Edelstahl", "Solid stainless steel", "Inox massif", "Acciaio inox massiccio"),
  schwarz: T("Schwarz", "Black", "Noir", "Nero"),
  gunmetal: "Gunmetal",
  "kupfer-rose": T("Kupfer Rosé", "Rose copper", "Cuivre rosé", "Rame rosé"),
  "messing-patina": T("Messing Patina", "Patinated brass", "Laiton patiné", "Ottone patinato"),
  gold: T("Gold", "Gold", "Or", "Oro"),
};
/** Gruppe „Oberfläche“; standard = Voreinstellung im Konfigurator, deren Freisteller gezeigt wird. */
const oberflaeche = (ids, standard, standardBild) =>
  Object.freeze({
    gruppe: T("Oberfläche", "Finish", "Finition", "Finitura"),
    optionen: Object.freeze(
      ids.map((id) =>
        Object.freeze({ id, name: OBERFLAECHEN[id], ...(id === standard ? { standard: true, bilder: Object.freeze([`${DIR}${standardBild}`]) } : {}) })
      )
    ),
  });
const RESERVOIR_GRUPPE = Object.freeze({
  gruppe: T("Kochendwasser-Reservoir", "Boiling-water tank", "Réservoir d’eau bouillante", "Serbatoio acqua bollente"),
  optionen: Object.freeze([
    Object.freeze({ id: "pro3", name: "PRO3", standard: true }),
    Object.freeze({ id: "combi", name: "COMBI" }),
    Object.freeze({ id: "combi-plus", name: "COMBI+" }),
  ]),
});
const CUBE_ZUBEHOER = Object.freeze([
  Object.freeze({
    slug: "quooker-cube",
    hinweis: T(
      "Ergänzt die Armatur um gekühltes stilles und prickelndes Wasser",
      "Adds chilled still and sparkling water to the tap",
      "Ajoute de l’eau fraîche plate et pétillante au robinet",
      "Aggiunge al rubinetto acqua fredda liscia e frizzante"
    ),
  }),
]);

// ---------------------------------------------------------------- gemeinsame Merkmale
const M = {
  allInOne: T(
    "Warmes, kaltes und 100 °C kochendes Wasser aus einem Hahn; mit dem CUBE zusätzlich gekühltes stilles und prickelndes Wasser",
    "Hot, cold and 100 °C boiling water from one tap; with the CUBE also chilled still and sparkling water",
    "Eau chaude, froide et bouillante à 100 °C d’un seul robinet ; avec le CUBE, également eau fraîche plate et pétillante",
    "Acqua calda, fredda e bollente a 100 °C da un unico rubinetto; con il CUBE anche acqua fredda liscia e frizzante"
  ),
  einzeln: T(
    "Separater Hahn für 100 °C kochendes Wasser neben der vorhandenen Mischbatterie; mit dem CUBE optional gekühltes stilles und prickelndes Wasser",
    "Separate tap for 100 °C boiling water next to the existing mixer tap; optionally chilled still and sparkling water with the CUBE",
    "Robinet séparé pour l’eau bouillante à 100 °C à côté du mitigeur existant ; en option eau fraîche plate et pétillante avec le CUBE",
    "Rubinetto separato per acqua bollente a 100 °C accanto al miscelatore esistente; opzionale acqua fredda liscia e frizzante con il CUBE"
  ),
  twin: T(
    "Set aus Hahn für 100 °C kochendes Wasser und passender Quooker-Mischbatterie für warmes und kaltes Wasser; mit dem CUBE optional gekühltes stilles und prickelndes Wasser",
    "Set of a 100 °C boiling-water tap and a matching Quooker mixer tap for hot and cold water; optionally chilled still and sparkling water with the CUBE",
    "Ensemble d’un robinet d’eau bouillante à 100 °C et d’un mitigeur Quooker assorti pour l’eau chaude et froide ; en option eau fraîche plate et pétillante avec le CUBE",
    "Set composto da rubinetto per acqua bollente a 100 °C e miscelatore Quooker coordinato per acqua calda e fredda; opzionale acqua fredda liscia e frizzante con il CUBE"
  ),
  ring: T(
    "Kindersicherer Bedienring: für kochendes Wasser zweimal drücken und dann drehen",
    "Child-safe control ring: press twice and then turn for boiling water",
    "Bague de commande sécurité enfants : appuyer deux fois puis tourner pour l’eau bouillante",
    "Ghiera di comando a prova di bambino: per l’acqua bollente premere due volte e poi ruotare"
  ),
  system: T(
    "System aus Armatur auf der Arbeitsplatte und mindestens einem Reservoir im Spülenunterschrank (PRO3, COMBI oder COMBI+)",
    "System of a tap on the worktop and at least one tank in the sink cabinet (PRO3, COMBI or COMBI+)",
    "Système composé du robinet sur le plan de travail et d’au moins un réservoir sous l’évier (PRO3, COMBI ou COMBI+)",
    "Sistema composto da rubinetto sul piano di lavoro e almeno un serbatoio nel mobile sotto il lavello (PRO3, COMBI o COMBI+)"
  ),
  ab: T(
    "Die Ab-Angabe des Herstellers bezieht sich auf das System mit Reservoir PRO3",
    "The manufacturer’s “from” figure refers to the system with the PRO3 tank",
    "La mention « à partir de » du fabricant s’entend pour le système avec réservoir PRO3",
    "L’indicazione «a partire da» del produttore si riferisce al sistema con serbatoio PRO3"
  ),
  konfigurator: T(
    "Im Konfigurator des Herstellers zusätzlich wählbar: Nordic Seifenspender, Lastenwechsler, Scale Control R",
    "Also selectable in the manufacturer’s configurator: Nordic soap dispenser, load switch, Scale Control R",
    "Également au choix dans le configurateur du fabricant : pompe à savon Nordic, commutateur de charge, Scale Control R",
    "Selezionabili anche nel configuratore del produttore: dispenser di sapone Nordic, commutatore di carico, Scale Control R"
  ),
  flex: T(
    "Ausziehbarer Schlauch für Spülen, Reinigen und Befüllen; laut Hersteller gibt der Schlauch nie kochendes Wasser ab",
    "Pull-out hose for rinsing, cleaning and filling; according to the manufacturer the hose never dispenses boiling water",
    "Douchette extractible pour rincer, nettoyer et remplir ; selon le fabricant, elle ne délivre jamais d’eau bouillante",
    "Doccetta estraibile per sciacquare, pulire e riempire; secondo il produttore non eroga mai acqua bollente"
  ),
};

// Nr. 34 (31.10.2026): quooker.at zeigt Shop-Preise inkl. MwSt., keine UVP → „Herstellerpreis ab“.
// zusatz: sichtbarer Bezug des Armaturen-Preises (siehe Merkmal M.ab).
const uvp = (uvpAb, quelle, zusatz) => Object.freeze({ art: "uvp-ab", bezeichnung: "herstellerpreis", uvpAb, stand: STAND, quelle, ...(zusatz ? { zusatz } : {}) });
const SYSTEMPREIS_PRO3 = T("Systempreis mit Reservoir PRO3", "System price with PRO3 tank", "Prix du système avec réservoir PRO3", "Prezzo del sistema con serbatoio PRO3");

/** Eintrag einer Armatur (alle Fakten von Armaturen-Seite + Konfigurator). */
function armatur({ s, tap, name, serie, kurz, merkmale, ab, finishes, standard, bilder }) {
  return Object.freeze({
    slug: `quooker-${s}`,
    marke: "quooker",
    bereich: "kueche",
    kategorie: "armatur-kochendwasser",
    name,
    serie,
    kurz,
    merkmale: Object.freeze([...merkmale, M.ring, M.system, M.konfigurator, M.ab]),
    bilder: Object.freeze(bilder),
    ausfuehrungen: Object.freeze([oberflaeche(finishes, standard, bilder[0].src.slice(DIR.length)), RESERVOIR_GRUPPE]),
    zubehoer: CUBE_ZUBEHOER,
    herstellerUrl: hahn(s),
    quellen: Object.freeze([hahn(s), konfig(tap), RESERVOIRE]),
    stand: STAND,
    preis: uvp(ab, hahn(s), SYSTEMPREIS_PRO3),
  });
}

const ALLE6 = ["chrom", "edelstahl", "schwarz", "gunmetal", "kupfer-rose", "messing-patina"];
const ALLE7 = [...ALLE6, "gold"];
const CHROM_EDEL = ["chrom", "edelstahl"];

/** @type {import("../schema.js").KatalogMarke} */
export const MARKE = Object.freeze({
  slug: "quooker",
  name: "Quooker",
  welt: "kuechengeraete",
  herstellerUrl: "https://www.quooker.at/",
  // Händlersatz nur über den Claim-Guard (dealerStatement); hier nur der Schalter.
  dealer: true,
  stand: STAND,
  looks: Object.freeze([
    Object.freeze({
      id: "kueche-flex-round",
      titel: T("Flex Round in einer hellen Küche", "Flex Round in a bright kitchen", "Flex Round dans une cuisine claire", "Flex Round in una cucina luminosa"),
      bild: bild(
        "quooker-flex-round-2.webp", 1600, 900,
        T("Quooker Flex Round verchromt an einer Spüle mit Holzregalen und Keramik", "Quooker Flex Round in chrome at a sink with wooden shelves and ceramics", "Quooker Flex Round chromé sur un évier, étagères en bois et céramiques", "Quooker Flex Round cromato su un lavello con mensole in legno e ceramiche"),
        hahn("flex-round"), "ambiente"
      ),
      produkte: Object.freeze(["quooker-flex-round"]),
    }),
    Object.freeze({
      id: "unterschrank-combi-cube",
      titel: T("COMBI und CUBE im Spülenunterschrank", "COMBI and CUBE in the sink cabinet", "COMBI et CUBE sous l’évier", "COMBI e CUBE nel mobile sotto il lavello"),
      bild: bild(
        "quooker-cube-2.webp", 1600, 1151,
        T("Quooker COMBI und CUBE mit CO₂-Zylinder nebeneinander im geöffneten Spülenunterschrank", "Quooker COMBI and CUBE with CO₂ cylinder side by side in the open sink cabinet", "Quooker COMBI et CUBE avec cylindre de CO₂ côte à côte sous l’évier ouvert", "Quooker COMBI e CUBE con cilindro di CO₂ affiancati nel mobile sotto il lavello aperto"),
        CUBE_SEITE, "detail"
      ),
      produkte: Object.freeze(["quooker-combi", "quooker-cube"]),
    }),
  ]),
});

/** @type {import("../schema.js").KatalogProdukt[]} */
export const PRODUKTE = Object.freeze([
  // ---------------------------------------------------------------- Flex
  armatur({
    s: "flex-round", tap: "flex-round", name: "Flex Round", serie: "Flex", ab: 1395, finishes: ALLE6, standard: "chrom",
    kurz: T(
      "All-in-One-Armatur mit rundem Auslauf und ausziehbarem Schlauch. Liefert warmes, kaltes und 100 °C kochendes Wasser, mit dem CUBE auch gekühltes stilles und prickelndes Wasser.",
      "All-in-one tap with a round spout and pull-out hose. It delivers hot, cold and 100 °C boiling water, and with the CUBE also chilled still and sparkling water.",
      "Robinet tout-en-un à bec rond et douchette extractible. Il délivre de l’eau chaude, froide et bouillante à 100 °C, et avec le CUBE de l’eau fraîche plate et pétillante.",
      "Rubinetto all-in-one con bocca tonda e doccetta estraibile. Eroga acqua calda, fredda e bollente a 100 °C, con il CUBE anche acqua fredda liscia e frizzante."
    ),
    merkmale: [M.allInOne, M.flex],
    bilder: [
      bild("quooker-flex-round-1.webp", 500, 500, T("Quooker Flex Round verchromt mit schwarzem Schlauch, freigestellt", "Quooker Flex Round in chrome with black hose, cut-out", "Quooker Flex Round chromé avec flexible noir, détouré", "Quooker Flex Round cromato con tubo nero, scontornato"), konfig("flex-round")),
      bild("quooker-flex-round-2.webp", 1600, 900, T("Quooker Flex Round verchromt an einer Spüle mit Holzregalen und Keramik", "Quooker Flex Round in chrome at a sink with wooden shelves and ceramics", "Quooker Flex Round chromé sur un évier, étagères en bois et céramiques", "Quooker Flex Round cromato su un lavello con mensole in legno e ceramiche"), hahn("flex-round"), "ambiente"),
      bild("quooker-flex-round-3.webp", 1600, 1600, T("Quooker Flex Round: ein Glas wird mit Wasser gefüllt, Küche mit weißen Fliesen", "Quooker Flex Round: a glass being filled with water, kitchen with white tiles", "Quooker Flex Round : un verre rempli d’eau, cuisine carrelée blanche", "Quooker Flex Round: un bicchiere riempito d’acqua, cucina con piastrelle bianche"), hahn("flex-round"), "ambiente"),
    ],
  }),
  armatur({
    s: "flex-square", tap: "flex-square", name: "Flex Square", serie: "Flex", ab: 1395, finishes: ALLE6, standard: "chrom",
    kurz: T(
      "All-in-One-Armatur mit eckigem Auslauf und ausziehbarem Schlauch. Liefert warmes, kaltes und 100 °C kochendes Wasser, mit dem CUBE auch gekühltes stilles und prickelndes Wasser.",
      "All-in-one tap with a square spout and pull-out hose. It delivers hot, cold and 100 °C boiling water, and with the CUBE also chilled still and sparkling water.",
      "Robinet tout-en-un à bec carré et douchette extractible. Il délivre de l’eau chaude, froide et bouillante à 100 °C, et avec le CUBE de l’eau fraîche plate et pétillante.",
      "Rubinetto all-in-one con bocca squadrata e doccetta estraibile. Eroga acqua calda, fredda e bollente a 100 °C, con il CUBE anche acqua fredda liscia e frizzante."
    ),
    merkmale: [M.allInOne, M.flex],
    bilder: [
      bild("quooker-flex-square-1.webp", 500, 500, T("Quooker Flex Square verchromt mit schwarzem Schlauch, freigestellt", "Quooker Flex Square in chrome with black hose, cut-out", "Quooker Flex Square chromé avec flexible noir, détouré", "Quooker Flex Square cromato con tubo nero, scontornato"), konfig("flex-square")),
      bild("quooker-flex-square-2.webp", 1143, 1600, T("Quooker Flex Square verchromt an einer Spüle mit hellblauen Fliesen und blauen Fronten", "Quooker Flex Square in chrome at a sink with light blue tiles and blue fronts", "Quooker Flex Square chromé sur un évier, carrelage bleu clair et façades bleues", "Quooker Flex Square cromato su un lavello con piastrelle azzurre e frontali blu"), hahn("flex-square"), "ambiente"),
    ],
  }),
  // ---------------------------------------------------------------- Fusion
  armatur({
    s: "fusion-round", tap: "fusion-round", name: "Fusion Round", serie: "Fusion", ab: 1395, finishes: ALLE7, standard: "chrom",
    kurz: T(
      "All-in-One-Armatur mit rundem Auslauf im modernen Design. Liefert warmes, kaltes und 100 °C kochendes Wasser, mit dem CUBE auch gekühltes stilles und prickelndes Wasser.",
      "All-in-one tap with a round spout in a modern design. It delivers hot, cold and 100 °C boiling water, and with the CUBE also chilled still and sparkling water.",
      "Robinet tout-en-un à bec rond au design moderne. Il délivre de l’eau chaude, froide et bouillante à 100 °C, et avec le CUBE de l’eau fraîche plate et pétillante.",
      "Rubinetto all-in-one con bocca tonda dal design moderno. Eroga acqua calda, fredda e bollente a 100 °C, con il CUBE anche acqua fredda liscia e frizzante."
    ),
    merkmale: [M.allInOne],
    bilder: [
      bild("quooker-fusion-round-1.webp", 500, 500, T("Quooker Fusion Round verchromt, freigestellt", "Quooker Fusion Round in chrome, cut-out", "Quooker Fusion Round chromé, détouré", "Quooker Fusion Round cromato, scontornato"), konfig("fusion-round")),
      bild("quooker-fusion-round-2.webp", 1600, 1600, T("Quooker Fusion Round verchromt an einer Spüle mit Granit-Arbeitsplatte und grüner Wand", "Quooker Fusion Round in chrome at a sink with granite worktop and green wall", "Quooker Fusion Round chromé sur un évier, plan en granit et mur vert", "Quooker Fusion Round cromato su un lavello con piano in granito e parete verde"), hahn("fusion-round"), "ambiente"),
      bild("quooker-fusion-round-3.webp", 1600, 1200, T("Quooker Fusion Round: kochendes Wasser wird in einen Messbecher gefüllt", "Quooker Fusion Round: boiling water being poured into a measuring jug", "Quooker Fusion Round : eau bouillante versée dans un verre doseur", "Quooker Fusion Round: acqua bollente versata in una caraffa graduata"), hahn("fusion-round"), "ambiente"),
    ],
  }),
  armatur({
    s: "fusion-square", tap: "fusion-square", name: "Fusion Square", serie: "Fusion", ab: 1395, finishes: ALLE7, standard: "chrom",
    kurz: T(
      "All-in-One-Armatur mit eckigem Auslauf im modernen Design. Liefert warmes, kaltes und 100 °C kochendes Wasser, mit dem CUBE auch gekühltes stilles und prickelndes Wasser.",
      "All-in-one tap with a square spout in a modern design. It delivers hot, cold and 100 °C boiling water, and with the CUBE also chilled still and sparkling water.",
      "Robinet tout-en-un à bec carré au design moderne. Il délivre de l’eau chaude, froide et bouillante à 100 °C, et avec le CUBE de l’eau fraîche plate et pétillante.",
      "Rubinetto all-in-one con bocca squadrata dal design moderno. Eroga acqua calda, fredda e bollente a 100 °C, con il CUBE anche acqua fredda liscia e frizzante."
    ),
    merkmale: [M.allInOne],
    bilder: [
      bild("quooker-fusion-square-1.webp", 500, 500, T("Quooker Fusion Square verchromt, freigestellt", "Quooker Fusion Square in chrome, cut-out", "Quooker Fusion Square chromé, détouré", "Quooker Fusion Square cromato, scontornato"), konfig("fusion-square")),
      bild("quooker-fusion-square-2.webp", 1600, 1600, T("Quooker Fusion Square verchromt an einer Edelstahlspüle mit dunkler Arbeitsplatte", "Quooker Fusion Square in chrome at a stainless steel sink with dark worktop", "Quooker Fusion Square chromé sur un évier inox, plan de travail sombre", "Quooker Fusion Square cromato su un lavello in acciaio con piano scuro"), hahn("fusion-square"), "ambiente"),
      bild("quooker-fusion-square-3.webp", 1600, 1600, T("Quooker Fusion Square: eine Frau füllt eine Glasschale mit Wasser", "Quooker Fusion Square: a woman filling a glass bowl with water", "Quooker Fusion Square : une femme remplit un bol en verre", "Quooker Fusion Square: una donna riempie una ciotola di vetro"), hahn("fusion-square"), "ambiente"),
    ],
  }),
  // ---------------------------------------------------------------- Front
  armatur({
    s: "front", tap: "front-square", name: "Front", serie: "Front", ab: 1570, finishes: ["edelstahl", "schwarz", "gunmetal", "kupfer-rose"], standard: "edelstahl",
    kurz: T(
      "All-in-One-Armatur mit vorn am Auslauf angebrachtem Bediengriff für warmes und kaltes Wasser. Liefert zusätzlich 100 °C kochendes Wasser, mit dem CUBE auch gekühltes stilles und prickelndes Wasser.",
      "All-in-one tap with the hot and cold control mounted at the front of the spout. It also delivers 100 °C boiling water, and with the CUBE chilled still and sparkling water.",
      "Robinet tout-en-un dont la commande eau chaude/froide se trouve à l’avant du bec. Il délivre aussi de l’eau bouillante à 100 °C, et avec le CUBE de l’eau fraîche plate et pétillante.",
      "Rubinetto all-in-one con comando per acqua calda e fredda sulla parte anteriore della bocca. Eroga anche acqua bollente a 100 °C, con il CUBE acqua fredda liscia e frizzante."
    ),
    merkmale: [
      M.allInOne,
      T(
        "Bediengriff vorn am Auslauf; laut Hersteller bleibt die Hand dadurch von der Auslassöffnung entfernt",
        "Control handle at the front of the spout; according to the manufacturer this keeps the hand away from the outlet",
        "Poignée de commande à l’avant du bec ; selon le fabricant, la main reste ainsi éloignée de la sortie d’eau",
        "Maniglia di comando sulla parte anteriore della bocca; secondo il produttore la mano resta lontana dall’uscita"
      ),
    ],
    bilder: [
      bild("quooker-front-1.webp", 500, 500, T("Quooker Front in Voll-Edelstahl, freigestellt", "Quooker Front in solid stainless steel, cut-out", "Quooker Front en inox massif, détouré", "Quooker Front in acciaio inox massiccio, scontornato"), konfig("front-square")),
      bild("quooker-front-2.webp", 1600, 900, T("Quooker Front in Edelstahl: eine Kanne wird an einer Spüle vor gelber Wand gefüllt", "Quooker Front in stainless steel: a jug being filled at a sink in front of a yellow wall", "Quooker Front en inox : une carafe remplie sur un évier devant un mur jaune", "Quooker Front in acciaio: una caraffa riempita a un lavello davanti a una parete gialla"), hahn("front"), "ambiente"),
      bild("quooker-front-3.webp", 1600, 1600, T("Quooker Front in Edelstahl an einer Arbeitsplatte in Rosa mit zwei Gläsern", "Quooker Front in stainless steel on a pink worktop with two glasses", "Quooker Front en inox sur un plan de travail rose avec deux verres", "Quooker Front in acciaio su un piano rosa con due bicchieri"), hahn("front"), "ambiente"),
    ],
  }),
  // ---------------------------------------------------------------- Classic Fusion
  armatur({
    s: "classic-fusion-round", tap: "classic-fusion-round", name: "Classic Fusion Round", serie: "Classic Fusion", ab: 1615, finishes: ["chrom", "edelstahl", "messing-patina"], standard: "chrom",
    kurz: T(
      "All-in-One-Armatur mit rundem Auslauf im klassischen Design und seitlichem Hebel. Liefert warmes, kaltes und 100 °C kochendes Wasser, mit dem CUBE auch gekühltes stilles und prickelndes Wasser.",
      "All-in-one tap with a round spout in a classic design and a side lever. It delivers hot, cold and 100 °C boiling water, and with the CUBE also chilled still and sparkling water.",
      "Robinet tout-en-un à bec rond au design classique, avec levier latéral. Il délivre de l’eau chaude, froide et bouillante à 100 °C, et avec le CUBE de l’eau fraîche plate et pétillante.",
      "Rubinetto all-in-one con bocca tonda dal design classico e leva laterale. Eroga acqua calda, fredda e bollente a 100 °C, con il CUBE anche acqua fredda liscia e frizzante."
    ),
    merkmale: [M.allInOne],
    bilder: [
      bild("quooker-classic-fusion-round-1.webp", 500, 500, T("Quooker Classic Fusion Round verchromt, freigestellt", "Quooker Classic Fusion Round in chrome, cut-out", "Quooker Classic Fusion Round chromé, détouré", "Quooker Classic Fusion Round cromato, scontornato"), konfig("classic-fusion-round")),
      bild("quooker-classic-fusion-round-2.webp", 1600, 1600, T("Quooker Classic Fusion Round verchromt vor einer Terrazzo-Rückwand in einer Küche mit roter Wand", "Quooker Classic Fusion Round in chrome against a terrazzo splashback in a kitchen with a red wall", "Quooker Classic Fusion Round chromé devant une crédence en terrazzo, cuisine au mur rouge", "Quooker Classic Fusion Round cromato davanti a un paraschizzi in terrazzo, cucina con parete rossa"), hahn("classic-fusion-round"), "ambiente"),
    ],
  }),
  armatur({
    s: "classic-fusion-square", tap: "classic-fusion-square", name: "Classic Fusion Square", serie: "Classic Fusion", ab: 1615, finishes: ["chrom", "edelstahl", "messing-patina"], standard: "edelstahl",
    kurz: T(
      "All-in-One-Armatur mit eckigem Auslauf im klassischen Design und seitlichem Hebel. Liefert warmes, kaltes und 100 °C kochendes Wasser, mit dem CUBE auch gekühltes stilles und prickelndes Wasser.",
      "All-in-one tap with a square spout in a classic design and a side lever. It delivers hot, cold and 100 °C boiling water, and with the CUBE also chilled still and sparkling water.",
      "Robinet tout-en-un à bec carré au design classique, avec levier latéral. Il délivre de l’eau chaude, froide et bouillante à 100 °C, et avec le CUBE de l’eau fraîche plate et pétillante.",
      "Rubinetto all-in-one con bocca squadrata dal design classico e leva laterale. Eroga acqua calda, fredda e bollente a 100 °C, con il CUBE anche acqua fredda liscia e frizzante."
    ),
    merkmale: [M.allInOne],
    bilder: [
      bild("quooker-classic-fusion-square-1.webp", 500, 500, T("Quooker Classic Fusion Square in Voll-Edelstahl, freigestellt", "Quooker Classic Fusion Square in solid stainless steel, cut-out", "Quooker Classic Fusion Square en inox massif, détouré", "Quooker Classic Fusion Square in acciaio inox massiccio, scontornato"), konfig("classic-fusion-square")),
      bild("quooker-classic-fusion-square-2.webp", 1600, 1600, T("Quooker Classic Fusion Square in Edelstahl an einer Doppelspüle vor heller Marmorwand", "Quooker Classic Fusion Square in stainless steel at a double sink in front of a light marble wall", "Quooker Classic Fusion Square en inox sur un évier double devant un mur en marbre clair", "Quooker Classic Fusion Square in acciaio su un lavello doppio davanti a una parete in marmo chiaro"), konfig("classic-fusion-square"), "ambiente"),
    ],
  }),
  // ---------------------------------------------------------------- Single Taps
  armatur({
    s: "classic-nordic-round-single-tap", tap: "classic-nordic-round-single-tap", name: "Classic Nordic Round Single Tap", serie: "Classic Nordic", ab: 1440, finishes: CHROM_EDEL, standard: "chrom",
    kurz: T(
      "Separater Kochendwasser-Hahn im klassischen, runden Design, der eine vorhandene Mischbatterie ergänzt. Mit dem CUBE optional auch gekühltes stilles und prickelndes Wasser.",
      "Separate boiling-water tap in a classic round design that complements an existing mixer tap. Optionally also chilled still and sparkling water with the CUBE.",
      "Robinet d’eau bouillante séparé au design classique et rond, en complément d’un mitigeur existant. En option, eau fraîche plate et pétillante avec le CUBE.",
      "Rubinetto separato per acqua bollente dal design classico e tondo, a complemento di un miscelatore esistente. Opzionale anche acqua fredda liscia e frizzante con il CUBE."
    ),
    merkmale: [M.einzeln],
    bilder: [
      bild("quooker-classic-nordic-round-single-tap-1.webp", 500, 500, T("Quooker Classic Nordic Round Single Tap verchromt, freigestellt", "Quooker Classic Nordic Round Single Tap in chrome, cut-out", "Quooker Classic Nordic Round Single Tap chromé, détouré", "Quooker Classic Nordic Round Single Tap cromato, scontornato"), konfig("classic-nordic-round-single-tap")),
      bild("quooker-classic-nordic-round-single-tap-2.webp", 1600, 900, T("Quooker Classic Nordic Round Single Tap verchromt neben einer Mischbatterie, grüne Fliesen", "Quooker Classic Nordic Round Single Tap in chrome next to a mixer tap, green tiles", "Quooker Classic Nordic Round Single Tap chromé à côté d’un mitigeur, carrelage vert", "Quooker Classic Nordic Round Single Tap cromato accanto a un miscelatore, piastrelle verdi"), hahn("classic-nordic-round-single-tap"), "ambiente"),
    ],
  }),
  armatur({
    s: "nordic-round-single-tap", tap: "nordic-round-single-tap", name: "Nordic Round Single Tap", serie: "Nordic", ab: 1220, finishes: CHROM_EDEL, standard: "chrom",
    kurz: T(
      "Separater Kochendwasser-Hahn im runden Design, der eine vorhandene Mischbatterie ergänzt. Mit dem CUBE optional auch gekühltes stilles und prickelndes Wasser.",
      "Separate boiling-water tap in a round design that complements an existing mixer tap. Optionally also chilled still and sparkling water with the CUBE.",
      "Robinet d’eau bouillante séparé au design rond, en complément d’un mitigeur existant. En option, eau fraîche plate et pétillante avec le CUBE.",
      "Rubinetto separato per acqua bollente dal design tondo, a complemento di un miscelatore esistente. Opzionale anche acqua fredda liscia e frizzante con il CUBE."
    ),
    merkmale: [M.einzeln],
    bilder: [
      bild("quooker-nordic-round-single-tap-1.webp", 500, 500, T("Quooker Nordic Round Single Tap verchromt, freigestellt", "Quooker Nordic Round Single Tap in chrome, cut-out", "Quooker Nordic Round Single Tap chromé, détouré", "Quooker Nordic Round Single Tap cromato, scontornato"), konfig("nordic-round-single-tap")),
      bild("quooker-nordic-round-single-tap-2.webp", 1600, 900, T("Quooker Nordic Round Single Tap verchromt neben einer Mischbatterie an einer Doppelspüle, rosa Fliesen", "Quooker Nordic Round Single Tap in chrome next to a mixer tap at a double sink, pink tiles", "Quooker Nordic Round Single Tap chromé à côté d’un mitigeur sur un évier double, carrelage rose", "Quooker Nordic Round Single Tap cromato accanto a un miscelatore su un lavello doppio, piastrelle rosa"), hahn("nordic-round-single-tap"), "ambiente"),
    ],
  }),
  armatur({
    s: "nordic-square-single-tap", tap: "nordic-square-single-tap", name: "Nordic Square Single Tap", serie: "Nordic", ab: 1220, finishes: CHROM_EDEL, standard: "edelstahl",
    kurz: T(
      "Separater Kochendwasser-Hahn im eckigen Design, der eine vorhandene Mischbatterie ergänzt. Mit dem CUBE optional auch gekühltes stilles und prickelndes Wasser.",
      "Separate boiling-water tap in a square design that complements an existing mixer tap. Optionally also chilled still and sparkling water with the CUBE.",
      "Robinet d’eau bouillante séparé au design carré, en complément d’un mitigeur existant. En option, eau fraîche plate et pétillante avec le CUBE.",
      "Rubinetto separato per acqua bollente dal design squadrato, a complemento di un miscelatore esistente. Opzionale anche acqua fredda liscia e frizzante con il CUBE."
    ),
    merkmale: [M.einzeln],
    bilder: [
      bild("quooker-nordic-square-single-tap-1.webp", 500, 500, T("Quooker Nordic Square Single Tap in Voll-Edelstahl, freigestellt", "Quooker Nordic Square Single Tap in solid stainless steel, cut-out", "Quooker Nordic Square Single Tap en inox massif, détouré", "Quooker Nordic Square Single Tap in acciaio inox massiccio, scontornato"), konfig("nordic-square-single-tap")),
      bild("quooker-nordic-square-single-tap-2.webp", 1600, 1200, T("Quooker Nordic Square Single Tap in Edelstahl: ein Topf wird neben einer Mischbatterie gefüllt", "Quooker Nordic Square Single Tap in stainless steel: a pot being filled next to a mixer tap", "Quooker Nordic Square Single Tap en inox : une casserole remplie à côté d’un mitigeur", "Quooker Nordic Square Single Tap in acciaio: una pentola riempita accanto a un miscelatore"), konfig("nordic-square-single-tap"), "ambiente"),
    ],
  }),
  // ---------------------------------------------------------------- Twintaps
  armatur({
    s: "nordic-round-twintaps", tap: "nordic-round-twin-tap", name: "Nordic Round Twintaps", serie: "Nordic", ab: 1470, finishes: CHROM_EDEL, standard: "edelstahl",
    kurz: T(
      "Set aus separatem Kochendwasser-Hahn und optisch passender Quooker-Mischbatterie im runden Design. Mit dem CUBE optional auch gekühltes stilles und prickelndes Wasser.",
      "Set of a separate boiling-water tap and a matching Quooker mixer tap in a round design. Optionally also chilled still and sparkling water with the CUBE.",
      "Ensemble d’un robinet d’eau bouillante séparé et d’un mitigeur Quooker assorti au design rond. En option, eau fraîche plate et pétillante avec le CUBE.",
      "Set composto da rubinetto separato per acqua bollente e miscelatore Quooker coordinato dal design tondo. Opzionale anche acqua fredda liscia e frizzante con il CUBE."
    ),
    merkmale: [M.twin],
    bilder: [
      bild("quooker-nordic-round-twintaps-1.webp", 500, 500, T("Quooker Nordic Round Twintaps in Voll-Edelstahl: Kochendwasser-Hahn und Mischbatterie, freigestellt", "Quooker Nordic Round Twintaps in solid stainless steel: boiling-water tap and mixer tap, cut-out", "Quooker Nordic Round Twintaps en inox massif : robinet d’eau bouillante et mitigeur, détourés", "Quooker Nordic Round Twintaps in acciaio inox massiccio: rubinetto acqua bollente e miscelatore, scontornati"), konfig("nordic-round-twin-tap")),
      bild("quooker-nordic-round-twintaps-2.webp", 1500, 843, T("Quooker Nordic Round Twintaps in Edelstahl an einer Spüle unter einem Fenster", "Quooker Nordic Round Twintaps in stainless steel at a sink below a window", "Quooker Nordic Round Twintaps en inox sur un évier sous une fenêtre", "Quooker Nordic Round Twintaps in acciaio su un lavello sotto una finestra"), hahn("nordic-round-twintaps"), "ambiente"),
    ],
  }),
  armatur({
    s: "nordic-square-twintaps", tap: "nordic-square-twin-tap", name: "Nordic Square Twintaps", serie: "Nordic", ab: 1470, finishes: CHROM_EDEL, standard: "chrom",
    kurz: T(
      "Set aus separatem Kochendwasser-Hahn und optisch passender Quooker-Mischbatterie im eckigen Design. Mit dem CUBE optional auch gekühltes stilles und prickelndes Wasser.",
      "Set of a separate boiling-water tap and a matching Quooker mixer tap in a square design. Optionally also chilled still and sparkling water with the CUBE.",
      "Ensemble d’un robinet d’eau bouillante séparé et d’un mitigeur Quooker assorti au design carré. En option, eau fraîche plate et pétillante avec le CUBE.",
      "Set composto da rubinetto separato per acqua bollente e miscelatore Quooker coordinato dal design squadrato. Opzionale anche acqua fredda liscia e frizzante con il CUBE."
    ),
    merkmale: [M.twin],
    bilder: [
      bild("quooker-nordic-square-twintaps-1.webp", 500, 500, T("Quooker Nordic Square Twintaps verchromt: Kochendwasser-Hahn und Mischbatterie, freigestellt", "Quooker Nordic Square Twintaps in chrome: boiling-water tap and mixer tap, cut-out", "Quooker Nordic Square Twintaps chromés : robinet d’eau bouillante et mitigeur, détourés", "Quooker Nordic Square Twintaps cromati: rubinetto acqua bollente e miscelatore, scontornati"), konfig("nordic-square-twin-tap")),
      bild("quooker-nordic-square-twintaps-2.webp", 1600, 900, T("Quooker Nordic Square Twintaps verchromt: eine Frau an der Spüle einer hellen Küche", "Quooker Nordic Square Twintaps in chrome: a woman at the sink of a bright kitchen", "Quooker Nordic Square Twintaps chromés : une femme à l’évier d’une cuisine claire", "Quooker Nordic Square Twintaps cromati: una donna al lavello di una cucina luminosa"), hahn("nordic-square-twintaps"), "ambiente"),
    ],
  }),
  // ---------------------------------------------------------------- Reservoire
  Object.freeze({
    slug: "quooker-pro3",
    marke: "quooker",
    bereich: "kueche",
    kategorie: "armatur-kochendwasser",
    name: "PRO3",
    serie: "Kochendwasser-Reservoir",
    kurz: T(
      "Kochendwasser-Reservoir für den Spülenunterschrank mit 3 Litern sofort kochendem Wasser. Laut Hersteller das Standard-Reservoir für Wohnhäuser; es benötigt einen Warmwasseranschluss.",
      "Boiling-water tank for the sink cabinet with 3 litres of instant boiling water. According to the manufacturer the standard tank for homes; it requires a hot-water connection.",
      "Réservoir d’eau bouillante pour le meuble sous évier, avec 3 litres d’eau bouillante instantanée. Selon le fabricant, le réservoir standard pour la maison ; il nécessite un raccordement à l’eau chaude.",
      "Serbatoio per acqua bollente da installare sotto il lavello, con 3 litri di acqua bollente istantanea. Secondo il produttore il serbatoio standard per la casa; richiede un allacciamento all’acqua calda."
    ),
    merkmale: Object.freeze([
      T("Reservoirinhalt 3 Liter bei 100 °C", "Capacity 3 litres at 100 °C", "Contenance 3 litres à 100 °C", "Capacità 3 litri a 100 °C"),
      "1600 W · 230 V · Stand-by 10 W",
      T("Aktivkohlefilter; Aufheizzeit im Durchschnitt 10 Minuten", "Activated carbon filter; average heat-up time 10 minutes", "Filtre à charbon actif ; temps de chauffe moyen 10 minutes", "Filtro a carboni attivi; tempo di riscaldamento medio 10 minuti"),
      T("Leitungsdruck 2–6 bar, max. Druck 8 bar; Aufhängebügel verfügbar", "Supply pressure 2–6 bar, max. pressure 8 bar; mounting bracket available", "Pression d’alimentation 2–6 bar, pression max. 8 bar ; support de fixation disponible", "Pressione di rete 2–6 bar, pressione max. 8 bar; staffa di sospensione disponibile"),
      T("Ohne Energielabel: laut Hersteller gibt es keine EU-Energielabel-Richtlinie für Kochendwasser-Reservoire", "No energy label: according to the manufacturer there is no EU energy label regulation for boiling-water tanks", "Sans étiquette énergie : selon le fabricant, il n’existe pas de directive européenne pour les réservoirs d’eau bouillante", "Senza etichetta energetica: secondo il produttore non esiste una direttiva UE per i serbatoi di acqua bollente"),
    ]),
    masse: Object.freeze([mass("durchmesser", "153 mm"), mass("hoehe", "467 mm"), mass("nische", "Gesamthöhe ≥ 550 mm")]),
    bilder: Object.freeze([
      bild("quooker-pro3-1.webp", 1280, 1280, T("Quooker Reservoir PRO3 in Edelstahl mit rotem Deckel, freigestellt", "Quooker PRO3 tank in stainless steel with red lid, cut-out", "Réservoir Quooker PRO3 en inox à couvercle rouge, détouré", "Serbatoio Quooker PRO3 in acciaio con coperchio rosso, scontornato"), konfig("fusion-round")),
      bild("quooker-pro3-2.webp", 1143, 1600, T("Quooker PRO3 im geöffneten Spülenunterschrank unter einer Armatur", "Quooker PRO3 in the open sink cabinet below a tap", "Quooker PRO3 dans le meuble sous évier ouvert, sous un robinet", "Quooker PRO3 nel mobile sotto il lavello aperto, sotto un rubinetto"), hahn("fusion-round"), "detail"),
    ]),
    zubehoer: CUBE_ZUBEHOER,
    herstellerUrl: RESERVOIRE,
    quellen: Object.freeze([RESERVOIRE, konfig("fusion-round")]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "quooker-combi",
    marke: "quooker",
    bereich: "kueche",
    kategorie: "armatur-kochendwasser",
    name: "COMBI",
    serie: "Kochendwasser-Reservoir",
    kurz: T(
      "Kochendwasser-Reservoir mit 7 Litern kochendem Wasser oder 15 Litern Warmwasser (60 °C). Benötigt keinen Warmwasseranschluss und ersetzt laut Hersteller Boiler oder Durchlauferhitzer in der Küche.",
      "Boiling-water tank with 7 litres of boiling water or 15 litres of hot water (60 °C). It needs no hot-water connection and, according to the manufacturer, replaces a boiler or instantaneous water heater in the kitchen.",
      "Réservoir d’eau bouillante de 7 litres d’eau bouillante ou 15 litres d’eau chaude (60 °C). Il ne nécessite pas de raccordement à l’eau chaude et remplace, selon le fabricant, le chauffe-eau de la cuisine.",
      "Serbatoio con 7 litri di acqua bollente o 15 litri di acqua calda (60 °C). Non richiede allacciamento all’acqua calda e, secondo il produttore, sostituisce lo scaldabagno in cucina."
    ),
    merkmale: Object.freeze([
      T("Reservoirinhalt 7 Liter bei 100 °C, 15 Liter bei 60 °C, 27 Liter bei 40 °C", "Capacity 7 litres at 100 °C, 15 litres at 60 °C, 27 litres at 40 °C", "Contenance 7 litres à 100 °C, 15 litres à 60 °C, 27 litres à 40 °C", "Capacità 7 litri a 100 °C, 15 litri a 60 °C, 27 litri a 40 °C"),
      "2200 W · 230 V · Stand-by 10 W",
      T("Energieeffizienzklasse A", "Energy efficiency class A", "Classe d’efficacité énergétique A", "Classe di efficienza energetica A"),
      T("Aktivkohlefilter; Aufheizzeit im Durchschnitt 20 Minuten", "Activated carbon filter; average heat-up time 20 minutes", "Filtre à charbon actif ; temps de chauffe moyen 20 minutes", "Filtro a carboni attivi; tempo di riscaldamento medio 20 minuti"),
      T("Leitungsdruck 2–6 bar, max. Druck 8 bar; Aufhängebügel verfügbar", "Supply pressure 2–6 bar, max. pressure 8 bar; mounting bracket available", "Pression d’alimentation 2–6 bar, pression max. 8 bar ; support de fixation disponible", "Pressione di rete 2–6 bar, pressione max. 8 bar; staffa di sospensione disponibile"),
    ]),
    masse: Object.freeze([mass("durchmesser", "200 mm"), mass("hoehe", "472 mm"), mass("nische", "Gesamthöhe ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("quooker-combi-1.webp", 301, 300, T("Quooker Reservoir COMBI in Edelstahl mit rotem Deckel, freigestellt", "Quooker COMBI tank in stainless steel with red lid, cut-out", "Réservoir Quooker COMBI en inox à couvercle rouge, détouré", "Serbatoio Quooker COMBI in acciaio con coperchio rosso, scontornato"), RESERVOIRE),
      bild("quooker-combi-2.webp", 1451, 1600, T("Quooker COMBI im geöffneten Spülenunterschrank unter einer Armatur", "Quooker COMBI in the open sink cabinet below a tap", "Quooker COMBI dans le meuble sous évier ouvert, sous un robinet", "Quooker COMBI nel mobile sotto il lavello aperto, sotto un rubinetto"), CUBE_SEITE, "detail"),
    ]),
    zubehoer: CUBE_ZUBEHOER,
    herstellerUrl: RESERVOIRE,
    quellen: Object.freeze([RESERVOIRE, konfig("fusion-round")]),
    stand: STAND,
  }),
  Object.freeze({
    slug: "quooker-combi-plus",
    marke: "quooker",
    bereich: "kueche",
    kategorie: "armatur-kochendwasser",
    name: "COMBI+",
    serie: "Kochendwasser-Reservoir",
    kurz: T(
      "Kochendwasser-Reservoir mit 7 Litern kochendem Wasser und unbegrenzt warmem Wasser (60 °C), thermostatisch geregelt. Benötigt einen Warmwasseranschluss und überbrückt laut Hersteller die Wartezeit auf warmes Mischwasser.",
      "Boiling-water tank with 7 litres of boiling water and unlimited hot water (60 °C), thermostatically controlled. It requires a hot-water connection and, according to the manufacturer, removes the wait for hot mixed water.",
      "Réservoir de 7 litres d’eau bouillante et d’eau chaude illimitée (60 °C), à régulation thermostatique. Il nécessite un raccordement à l’eau chaude et supprime, selon le fabricant, l’attente d’eau chaude au mitigeur.",
      "Serbatoio con 7 litri di acqua bollente e acqua calda illimitata (60 °C), a regolazione termostatica. Richiede un allacciamento all’acqua calda e, secondo il produttore, elimina l’attesa dell’acqua calda miscelata."
    ),
    merkmale: Object.freeze([
      T("Reservoirinhalt 7 Liter bei 100 °C; Warmwasser bei 60 °C und 40 °C unbegrenzt (Durchschnittswerte)", "Capacity 7 litres at 100 °C; hot water at 60 °C and 40 °C unlimited (average values)", "Contenance 7 litres à 100 °C ; eau chaude à 60 °C et 40 °C illimitée (valeurs moyennes)", "Capacità 7 litri a 100 °C; acqua calda a 60 °C e 40 °C illimitata (valori medi)"),
      T("Thermostatische Temperaturregelung", "Thermostatic temperature control", "Régulation thermostatique de la température", "Regolazione termostatica della temperatura"),
      "2200 W · 230 V · Stand-by 10 W",
      T("Aktivkohlefilter; Aufheizzeit im Durchschnitt 20 Minuten", "Activated carbon filter; average heat-up time 20 minutes", "Filtre à charbon actif ; temps de chauffe moyen 20 minutes", "Filtro a carboni attivi; tempo di riscaldamento medio 20 minuti"),
      T("Leitungsdruck 2–6 bar, max. Druck 8 bar; Aufhängebügel verfügbar", "Supply pressure 2–6 bar, max. pressure 8 bar; mounting bracket available", "Pression d’alimentation 2–6 bar, pression max. 8 bar ; support de fixation disponible", "Pressione di rete 2–6 bar, pressione max. 8 bar; staffa di sospensione disponibile"),
    ]),
    masse: Object.freeze([mass("durchmesser", "200 mm"), mass("hoehe", "472 mm"), mass("nische", "Gesamthöhe ≥ 580 mm")]),
    bilder: Object.freeze([
      bild("quooker-combi-plus-1.webp", 301, 300, T("Quooker Reservoir COMBI+ in Edelstahl mit rotem Deckel, freigestellt (gleiche Abbildung wie COMBI)", "Quooker COMBI+ tank in stainless steel with red lid, cut-out (same image as COMBI)", "Réservoir Quooker COMBI+ en inox à couvercle rouge, détouré (même image que COMBI)", "Serbatoio Quooker COMBI+ in acciaio con coperchio rosso, scontornato (stessa immagine del COMBI)"), RESERVOIRE),
    ]),
    zubehoer: CUBE_ZUBEHOER,
    herstellerUrl: RESERVOIRE,
    quellen: Object.freeze([RESERVOIRE, `${AT}/tanks/combi-plus`, konfig("fusion-round")]),
    stand: STAND,
  }),
  // ---------------------------------------------------------------- CUBE
  Object.freeze({
    slug: "quooker-cube",
    marke: "quooker",
    bereich: "kueche",
    kategorie: "armatur-kochendwasser",
    name: "CUBE",
    serie: "Kaltwasser-Reservoir",
    kurz: T(
      "Kaltwasser-Reservoir für den Spülenunterschrank, das die Quooker-Armatur um gekühltes stilles und prickelndes Wasser ergänzt. Ein CO₂-Zylinder reicht laut Hersteller für etwa 60 Liter prickelndes Wasser.",
      "Cold-water unit for the sink cabinet that adds chilled still and sparkling water to the Quooker tap. According to the manufacturer one CO₂ cylinder lasts for about 60 litres of sparkling water.",
      "Réservoir d’eau froide pour le meuble sous évier, qui ajoute de l’eau fraîche plate et pétillante au robinet Quooker. Selon le fabricant, un cylindre de CO₂ suffit pour environ 60 litres d’eau pétillante.",
      "Serbatoio per acqua fredda da installare sotto il lavello, che aggiunge al rubinetto Quooker acqua fredda liscia e frizzante. Secondo il produttore un cilindro di CO₂ basta per circa 60 litri di acqua frizzante."
    ),
    merkmale: Object.freeze([
      T("Installation im Spülenunterschrank vor oder neben dem Kochendwasser-Reservoir", "Installed in the sink cabinet in front of or next to the boiling-water tank", "Installation sous l’évier, devant ou à côté du réservoir d’eau bouillante", "Installazione sotto il lavello, davanti o accanto al serbatoio dell’acqua bollente"),
      T("Wasserart über den Bedienring der Armatur: Leuchtring blinkt blau bei prickelndem, leuchtet blau bei stillem Wasser", "Water type chosen via the tap’s control ring: the light ring flashes blue for sparkling and shines blue for still water", "Type d’eau choisi via la bague du robinet : l’anneau lumineux clignote en bleu pour l’eau pétillante, reste bleu pour l’eau plate", "Tipo di acqua tramite la ghiera del rubinetto: l’anello luminoso lampeggia blu per l’acqua frizzante, resta blu per quella liscia"),
      T("Geliefert mit einem CO₂-Zylinder; Filterwechsel laut Hersteller etwa alle 12 Monate", "Supplied with one CO₂ cylinder; filter change about every 12 months according to the manufacturer", "Livré avec un cylindre de CO₂ ; changement du filtre environ tous les 12 mois selon le fabricant", "Fornito con un cilindro di CO₂; cambio filtro circa ogni 12 mesi secondo il produttore"),
      T("Aktivkohle- und Hohlfaserfilter (optional)", "Activated carbon and hollow-fibre filter (optional)", "Filtre à charbon actif et à fibres creuses (en option)", "Filtro a carboni attivi e a fibre cave (opzionale)"),
      "220–240 V · 100 W · Stand-by 5 W",
      T("Leitungsdruck 2–4 bar; eigene Steckdose im Spülenunterschrank nötig", "Supply pressure 2–4 bar; a separate socket in the sink cabinet is required", "Pression d’alimentation 2–4 bar ; prise dédiée sous l’évier nécessaire", "Pressione di rete 2–4 bar; necessaria una presa dedicata sotto il lavello"),
      T("Kompatibel mit Quooker-Systemen ab Baujahr Oktober 2017 (Seriennummer laut Hersteller-FAQ)", "Compatible with Quooker systems built from October 2017 (serial number per manufacturer FAQ)", "Compatible avec les systèmes Quooker fabriqués depuis octobre 2017 (numéro de série selon la FAQ du fabricant)", "Compatibile con i sistemi Quooker prodotti da ottobre 2017 (numero di serie secondo le FAQ del produttore)"),
    ]),
    masse: Object.freeze([mass("hoehe", "500 mm"), mass("breite", "223 mm (153 mm ohne CO₂-Zylinder)"), mass("tiefe", "340 mm (270 mm ohne CO₂-Zylinder)")]),
    bilder: Object.freeze([
      bild("quooker-cube-1.webp", 1600, 1600, T("Quooker CUBE mit CO₂-Zylinder, freigestellt", "Quooker CUBE with CO₂ cylinder, cut-out", "Quooker CUBE avec cylindre de CO₂, détouré", "Quooker CUBE con cilindro di CO₂, scontornato"), konfig("fusion-round")),
      bild("quooker-cube-2.webp", 1600, 1151, T("Quooker CUBE neben dem Reservoir COMBI im geöffneten Spülenunterschrank", "Quooker CUBE next to the COMBI tank in the open sink cabinet", "Quooker CUBE à côté du réservoir COMBI sous l’évier ouvert", "Quooker CUBE accanto al serbatoio COMBI nel mobile sotto il lavello aperto"), CUBE_SEITE, "detail"),
    ]),
    herstellerUrl: CUBE_SEITE,
    quellen: Object.freeze([CUBE_SEITE, RESERVOIRE, CUBE_SHOP, konfig("fusion-round")]),
    stand: STAND,
    preis: uvp(1200, CUBE_SHOP),
  }),
]);
