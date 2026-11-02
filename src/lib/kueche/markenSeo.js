// src/lib/kueche/markenSeo.js
// Kaufwort-Texte der sechs Gerätemarken für /<locale>/kuechengeraete/marke/<marke>
// (Seite 1): Titel-Kaufwort, Description, Intro mit konkretem Nutzen, Weg in den
// Küchenplaner und FAQ je Marke und Sprache. Eingehängt in
// src/components/Katalog/katalogRoutes.js (Metadaten) und KatalogListe.js (Seite).
//
// Regeln (geprüft in tests/unit/kueche-marken-seo.test.mjs):
// - Händlerwort NUR aus dem Claim-Guard: markenSeoTitel() bekommt das Wort als
//   Parameter (dealerTitleWord, src/lib/legal/claims.js); steht keines zu, fällt
//   der Zusatz weg. In den Texten hier kein Händler-/Partner-/offiziell-Wort.
// - Keine Preise und keine Preisspannen: „Was kostet …?“ wird mit Modell,
//   Ausstattung und Angebot im Termin beantwortet.
// - Keine Aussage, dass Geräte im Showroom stehen: Ansehen nur „im Termin“.
// - Modellbezeichnungen nur, wenn sie im Herstellerkatalog stehen
//   (src/lib/katalog/marken/<marke>.js; der Test prüft die Namen in MODELLE).
// - Keine Superlative, keine erfundenen Fakten. Sie-Form (IT: voi).
// - Schweiz (V-ZUG): kein Link auf /einkaufen-aus-der-schweiz, solange die Seite
//   ein Entwurf (noindex) ist – wie src/lib/content/ortsMarken.js; stattdessen der
//   freigegebene Ratgeber (nur Deutsch), keine Service-Aussage für die Schweiz.
// Rein, ohne "@/"-Importe (node --test).

export const MARKEN_SEO_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Ratgeber zum Einkauf aus der Schweiz (freigegeben, nur Deutsch). */
export const CH_RATGEBER_PATH = "/ratgeber/moebel-aus-oesterreich-in-die-schweiz";
export const CH_RATGEBER_LOCALES = Object.freeze(["de"]);

/** Modellnamen, die in den Texten vorkommen – je Marke; der Test prüft sie gegen den Katalog. */
export const MODELLE = Object.freeze({
  quooker: Object.freeze(["COMBI", "COMBI+", "PRO3", "CUBE", "Fusion Round", "Flex Round", "Nordic Round Single Tap", "Front"]),
  bora: Object.freeze(["BORA X Pure", "BORA S Pure", "BORA M Pure", "BORA X BO", "BORA Basic"]),
  "v-zug": Object.freeze(["Combair V4000 60", "CombiSteamer V6000 45", "CookTop V4000 I604", "AdoraSpülen V4000 V"]),
  liebherr: Object.freeze(["Monolith Kühlschrank", "ECBNe BioFresh NoFrost", "Vinidor Einbau-Weintemperierschrank", "GrandCru Einbau-Weinklimaschrank"]),
  miele: Object.freeze([]),
  gaggenau: Object.freeze([]),
});

const f = Object.freeze;
const faq = (...items) => f(items.map(([q, a]) => f({ q, a })));

/* ------------------------------------------------------------------ Quooker */
const QUOOKER = f({
  de: f({
    kaufwort: "Quooker kaufen in Vorarlberg",
    description: "Quooker Kochend-Wasserhahn kaufen: Fusion, Flex, Nordic, Front mit COMBI-, PRO3- oder CUBE-Reservoir – eingeplant und montiert in Lochau.",
    intro: "Ein Quooker liefert 100 °C kochendes Wasser direkt aus der Armatur; mit dem CUBE kommen gekühltes stilles und prickelndes Wasser dazu. Im Katalog stehen die All-in-One-Armaturen Fusion, Flex und Nordic, der separate Kochendwasser-Hahn Front und die Reservoirs COMBI, COMBI+ und PRO3 für den Spülenunterschrank. Wir planen Armatur, Reservoir und Anschluss zusammen mit Ihrer Spüle ein.",
    planer: "Im Küchenplaner nehmen Sie den Quooker als Gerätemodul mit Katalogmaßen in Ihre Planung auf.",
    planerLabel: "Quooker im Küchenplaner einplanen",
    faqTitle: "Häufige Fragen zu Quooker",
    faq: faq(
      ["Was kostet ein Quooker?", "Der Preis hängt von der Armatur, vom Reservoir (COMBI, COMBI+ oder PRO3) und davon ab, ob ein CUBE für gekühltes Wasser dazukommt. Ein Angebot erhalten Sie im Termin, abgestimmt auf Spüle und Anschlüsse."],
      ["Welche Quooker-Armaturen gibt es?", "All-in-One-Armaturen mit rundem oder eckigem Auslauf (Fusion, Flex mit ausziehbarem Schlauch, Nordic) sowie den separaten Kochendwasser-Hahn Front, der eine vorhandene Mischbatterie ergänzt. Welche Form zu Ihrer Spüle passt, klären wir in der Planung."],
      ["Wo kann ich einen Quooker ansehen?", "Vereinbaren Sie einen Termin in Lochau: Dort gehen wir Modelle, Oberflächen, Reservoir und den Anschluss an Ihrer Spüle gemeinsam durch."],
      ["Wer baut den Quooker ein?", "Reservoir, Anschluss und Armatur planen wir mit Ihrer Küche; Lieferung und Montage übernehmen wir aus einer Hand. Im Küchenplaner können Sie den Quooker schon vorab einplanen."]
    ),
  }),
  en: f({
    kaufwort: "Buy a Quooker in Vorarlberg",
    description: "Buy a Quooker boiling-water tap: Fusion, Flex, Nordic, Front with COMBI, PRO3 or CUBE tank – planned into your kitchen and installed in Lochau.",
    intro: "A Quooker delivers 100 °C boiling water straight from the tap; with the CUBE it also provides chilled still and sparkling water. The catalogue lists the all-in-one taps Fusion, Flex and Nordic, the separate boiling-water tap Front and the COMBI, COMBI+ and PRO3 tanks for the sink cabinet. We plan tap, tank and connections together with your sink.",
    planer: "In the kitchen planner you add the Quooker to your plan as an appliance unit with catalogue dimensions.",
    planerLabel: "Plan a Quooker in the kitchen planner",
    faqTitle: "Frequently asked questions about Quooker",
    faq: faq(
      ["How much does a Quooker cost?", "The price depends on the tap, the tank (COMBI, COMBI+ or PRO3) and whether a CUBE for chilled water is added. You receive a quote at your appointment, matched to your sink and connections."],
      ["Which Quooker taps are available?", "All-in-one taps with a round or square spout (Fusion, Flex with pull-out hose, Nordic) and the separate boiling-water tap Front, which complements an existing mixer. Which shape suits your sink is settled during planning."],
      ["Where can I see a Quooker?", "Book an appointment in Lochau: there we go through models, finishes, tank and the connection at your sink together."],
      ["Who installs the Quooker?", "We plan tank, connections and tap with your kitchen; delivery and installation come from one source. You can add the Quooker to your plan in the kitchen planner beforehand."]
    ),
  }),
  fr: f({
    kaufwort: "Acheter un Quooker au Vorarlberg",
    description: "Acheter un robinet d’eau bouillante Quooker : Fusion, Flex, Nordic, Front avec réservoir COMBI, PRO3 ou CUBE – intégré et installé à Lochau.",
    intro: "Un Quooker fournit de l’eau bouillante à 100 °C directement au robinet ; avec le CUBE s’ajoutent de l’eau fraîche plate et pétillante. Le catalogue comprend les robinets tout-en-un Fusion, Flex et Nordic, le robinet d’eau bouillante séparé Front et les réservoirs COMBI, COMBI+ et PRO3 pour le meuble sous évier. Nous intégrons robinet, réservoir et raccordements avec votre évier.",
    planer: "Dans le planificateur de cuisine, vous ajoutez le Quooker à votre projet comme module d’appareil aux cotes du catalogue.",
    planerLabel: "Intégrer un Quooker dans le planificateur",
    faqTitle: "Questions fréquentes sur Quooker",
    faq: faq(
      ["Combien coûte un Quooker ?", "Le prix dépend du robinet, du réservoir (COMBI, COMBI+ ou PRO3) et de l’ajout éventuel d’un CUBE pour l’eau fraîche. Vous recevez une offre lors du rendez-vous, adaptée à votre évier et à vos raccordements."],
      ["Quels robinets Quooker existent ?", "Des robinets tout-en-un à bec rond ou carré (Fusion, Flex avec douchette extractible, Nordic) et le robinet d’eau bouillante séparé Front, qui complète un mitigeur existant. La forme adaptée à votre évier se décide lors de la conception."],
      ["Où puis-je voir un Quooker ?", "Prenez rendez-vous à Lochau : nous y passons ensemble en revue modèles, finitions, réservoir et raccordement à votre évier."],
      ["Qui installe le Quooker ?", "Nous planifions réservoir, raccordements et robinet avec votre cuisine ; livraison et montage sont assurés d’une seule main. Vous pouvez déjà intégrer le Quooker dans le planificateur de cuisine."]
    ),
  }),
  it: f({
    kaufwort: "Comprare un Quooker nel Vorarlberg",
    description: "Comprare un rubinetto per acqua bollente Quooker: Fusion, Flex, Nordic, Front con serbatoio COMBI, PRO3 o CUBE – progettato e montato a Lochau.",
    intro: "Un Quooker eroga acqua bollente a 100 °C direttamente dal rubinetto; con il CUBE si aggiungono acqua fredda naturale e frizzante. A catalogo trovate i rubinetti tutto in uno Fusion, Flex e Nordic, il rubinetto separato per acqua bollente Front e i serbatoi COMBI, COMBI+ e PRO3 per il sottolavello. Progettiamo rubinetto, serbatoio e allacciamenti insieme al vostro lavello.",
    planer: "Nel configuratore di cucine inserite il Quooker nel progetto come modulo apparecchio con le misure di catalogo.",
    planerLabel: "Inserire un Quooker nel configuratore",
    faqTitle: "Domande frequenti su Quooker",
    faq: faq(
      ["Quanto costa un Quooker?", "Il prezzo dipende dal rubinetto, dal serbatoio (COMBI, COMBI+ o PRO3) e dall’eventuale CUBE per l’acqua fredda. Ricevete un’offerta all’appuntamento, in base a lavello e allacciamenti."],
      ["Quali rubinetti Quooker esistono?", "Rubinetti tutto in uno con bocca tonda o squadrata (Fusion, Flex con doccetta estraibile, Nordic) e il rubinetto separato per acqua bollente Front, che integra un miscelatore esistente. La forma adatta al vostro lavello la definiamo in fase di progetto."],
      ["Dove posso vedere un Quooker?", "Fissate un appuntamento a Lochau: lì esaminiamo insieme modelli, finiture, serbatoio e allacciamento al vostro lavello."],
      ["Chi monta il Quooker?", "Serbatoio, allacciamenti e rubinetto li progettiamo con la vostra cucina; consegna e montaggio li curiamo noi. Nel configuratore di cucine potete inserire il Quooker già in anticipo."]
    ),
  }),
});

/* ------------------------------------------------------------------ BORA */
const BORA = f({
  de: f({
    kaufwort: "BORA Kochfeldabzug kaufen in Vorarlberg",
    description: "BORA Kochfeld mit Abzug kaufen: X Pure, S Pure, M Pure, Basic, Classic und Pro – beraten, in Ihre Küche eingeplant und montiert in Lochau.",
    intro: "Bei BORA sitzt der Dunstabzug im Kochfeld und zieht den Kochdunst nach unten ab – ohne Haube über Kochinsel oder Zeile. Im Katalog finden Sie die Kochfeldabzüge BORA X Pure, S Pure, M Pure und Basic, die Systeme Classic und Pro sowie den Backofen BORA X BO. Abluft oder Umluft, Nischenmaß und Arbeitsplatte planen wir mit.",
    planer: "Im Küchenplaner setzen Sie ein BORA Kochfeld als Gerätemodul mit Katalogmaßen in Zeile oder Kochinsel ein.",
    planerLabel: "BORA im Küchenplaner einplanen",
    faqTitle: "Häufige Fragen zu BORA",
    faq: faq(
      ["Was kostet ein BORA Kochfeld?", "Der Preis hängt vom System (X Pure, S Pure, M Pure, Basic, Classic oder Pro), von der Breite und von Abluft oder Umluft ab. Ein Angebot erhalten Sie im Termin, abgestimmt auf Ihre Küchenplanung."],
      ["Wo kann ich BORA X Pure ansehen?", "Im Termin in Lochau gehen wir BORA X Pure und die anderen Systeme mit Ihnen durch und klären, welches zu Ihrer Kochinsel oder Zeile passt."],
      ["Abluft oder Umluft – was passt zu meiner Küche?", "Beides ist bei BORA möglich. Was sinnvoll ist, hängt von Außenwand, Leitungsweg und Lage des Kochfelds ab – das klären wir in der Planung, bevor etwas bestellt wird."],
      ["Wie plane ich ein BORA Kochfeld ein?", "Starten Sie im Küchenplaner mit Ihrem Grundriss und setzen Sie das Kochfeld als Gerätemodul ein; Nische, Unterschrank und Anschlüsse stimmen wir danach gemeinsam ab."]
    ),
  }),
  en: f({
    kaufwort: "Buy a BORA extractor hob in Vorarlberg",
    description: "Buy a BORA cooktop with integrated extractor: X Pure, S Pure, M Pure, Basic, Classic and Pro – planned into your kitchen and installed in Lochau.",
    intro: "With BORA the extractor sits in the cooktop and draws cooking vapour downwards – no hood above the island or run. The catalogue lists the cooktop extractors BORA X Pure, S Pure, M Pure and Basic, the Classic and Pro systems and the BORA X BO oven. We plan exhaust or recirculation, niche size and worktop with you.",
    planer: "In the kitchen planner you place a BORA cooktop as an appliance unit with catalogue dimensions in a run or an island.",
    planerLabel: "Plan BORA in the kitchen planner",
    faqTitle: "Frequently asked questions about BORA",
    faq: faq(
      ["How much does a BORA cooktop cost?", "The price depends on the system (X Pure, S Pure, M Pure, Basic, Classic or Pro), the width and on exhaust or recirculation. You receive a quote at your appointment, matched to your kitchen plan."],
      ["Where can I see the BORA X Pure?", "At your appointment in Lochau we go through the BORA X Pure and the other systems with you and settle which suits your island or run."],
      ["Exhaust or recirculation – which suits my kitchen?", "BORA offers both. What makes sense depends on the outer wall, the duct route and the position of the cooktop – we settle this in planning, before anything is ordered."],
      ["How do I plan a BORA cooktop?", "Start in the kitchen planner with your floor plan and place the cooktop as an appliance unit; niche, base unit and connections are then coordinated together."]
    ),
  }),
  fr: f({
    kaufwort: "Acheter une table BORA aspirante",
    description: "Acheter une table BORA à aspiration intégrée : X Pure, S Pure, M Pure, Basic, Classic et Pro – intégrée à votre cuisine et installée à Lochau.",
    intro: "Chez BORA, l’aspiration est intégrée à la table de cuisson et évacue les vapeurs vers le bas – sans hotte au-dessus de l’îlot ou de la ligne. Le catalogue comprend les tables à aspiration BORA X Pure, S Pure, M Pure et Basic, les systèmes Classic et Pro ainsi que le four BORA X BO. Évacuation ou recyclage, cote de niche et plan de travail font partie de notre conception.",
    planer: "Dans le planificateur de cuisine, vous placez une table BORA comme module d’appareil aux cotes du catalogue, en ligne ou sur l’îlot.",
    planerLabel: "Intégrer BORA dans le planificateur",
    faqTitle: "Questions fréquentes sur BORA",
    faq: faq(
      ["Combien coûte une table de cuisson BORA ?", "Le prix dépend du système (X Pure, S Pure, M Pure, Basic, Classic ou Pro), de la largeur et du mode évacuation ou recyclage. Vous recevez une offre lors du rendez-vous, adaptée à votre projet de cuisine."],
      ["Où puis-je voir la BORA X Pure ?", "Lors du rendez-vous à Lochau, nous passons en revue avec vous la BORA X Pure et les autres systèmes et déterminons lequel convient à votre îlot ou à votre ligne."],
      ["Évacuation ou recyclage : que choisir pour ma cuisine ?", "BORA propose les deux. Le choix dépend du mur extérieur, du cheminement de la gaine et de la position de la table – nous le fixons lors de la conception, avant toute commande."],
      ["Comment intégrer une table BORA à mon projet ?", "Commencez dans le planificateur de cuisine avec votre plan et placez la table comme module d’appareil ; niche, meuble bas et raccordements sont ensuite coordonnés ensemble."]
    ),
  }),
  it: f({
    kaufwort: "Comprare un piano BORA aspirante",
    description: "Comprare un piano BORA con aspirazione integrata: X Pure, S Pure, M Pure, Basic, Classic e Pro – progettato nella vostra cucina e montato a Lochau.",
    intro: "In BORA l’aspirazione è integrata nel piano cottura e porta i vapori verso il basso – senza cappa sopra l’isola o la linea. A catalogo trovate i piani aspiranti BORA X Pure, S Pure, M Pure e Basic, i sistemi Classic e Pro e il forno BORA X BO. Espulsione o ricircolo, misura della nicchia e piano di lavoro li progettiamo con voi.",
    planer: "Nel configuratore di cucine inserite un piano BORA come modulo apparecchio con le misure di catalogo, in linea o sull’isola.",
    planerLabel: "Inserire BORA nel configuratore",
    faqTitle: "Domande frequenti su BORA",
    faq: faq(
      ["Quanto costa un piano cottura BORA?", "Il prezzo dipende dal sistema (X Pure, S Pure, M Pure, Basic, Classic o Pro), dalla larghezza e da espulsione o ricircolo. Ricevete un’offerta all’appuntamento, in base al progetto della vostra cucina."],
      ["Dove posso vedere il BORA X Pure?", "All’appuntamento a Lochau esaminiamo con voi il BORA X Pure e gli altri sistemi e stabiliamo quale si adatta alla vostra isola o linea."],
      ["Espulsione o ricircolo: che cosa va bene per la mia cucina?", "BORA offre entrambe le soluzioni. Che cosa conviene dipende da parete esterna, percorso del condotto e posizione del piano – lo definiamo in fase di progetto, prima di ordinare."],
      ["Come inserisco un piano BORA nel progetto?", "Iniziate nel configuratore di cucine con la vostra pianta e inserite il piano come modulo apparecchio; nicchia, base e allacciamenti li coordiniamo poi insieme."]
    ),
  }),
});

/* ------------------------------------------------------------------ V-ZUG */
const VZUG = f({
  de: f({
    kaufwort: "V-ZUG kaufen in Vorarlberg",
    description: "V-ZUG kaufen: Combair-Backöfen, CombiSteamer, CookTop-Kochfelder und Kühlgeräte des Schweizer Herstellers – eingeplant und montiert in Lochau.",
    intro: "V-ZUG ist ein Schweizer Hersteller von Einbaugeräten. Im Katalog stehen die Backöfen Combair, die Dampfgarer CombiSteamer, die Induktionskochfelder CookTop, Kühl- und Gefriergeräte sowie die Geschirrspüler AdoraSpülen. Lochau liegt am Bodensee nahe der Schweizer Grenze; der Küchenplaner kennt neben dem 60-cm-Raster auch das 55-cm-Raster nach Schweizer SMS-Norm.",
    ch: "Was beim Einkauf aus der Schweiz zu beachten ist, erklärt unser Ratgeber.",
    chLabel: "Ratgeber: Möbel aus Österreich in die Schweiz einführen",
    planer: "Im Küchenplaner nehmen Sie V-ZUG-Geräte als Gerätemodule mit Katalogmaßen in Ihre Planung auf – wahlweise im 55-cm-Raster.",
    planerLabel: "V-ZUG im Küchenplaner einplanen",
    faqTitle: "Häufige Fragen zu V-ZUG",
    faq: faq(
      ["Was kostet ein V-ZUG-Gerät?", "Der Preis hängt von Gerät, Baureihe (V2000, V4000, V6000) und Ausstattung ab. Ein Angebot erhalten Sie im Termin, abgestimmt auf Ihre Küchenplanung."],
      ["Ich wohne in der Schweiz – kann ich bei Ihnen planen?", "Ja. Lochau liegt nahe der Grenze; für Küchen im Schweizer Maß planen wir im 55-cm-Raster nach SMS-Norm. Zoll und Einfuhr erklärt unser Ratgeber zum Einkauf aus der Schweiz."],
      ["Wo kann ich V-ZUG-Geräte ansehen?", "Im Termin in Lochau gehen wir Combair, CombiSteamer, CookTop und die Kühlgeräte mit Ihnen durch und klären, welche Geräte zu Ihrer Küche passen."],
      ["Wie plane ich V-ZUG-Geräte ein?", "Starten Sie im Küchenplaner mit Ihrem Grundriss und setzen Sie die Geräte als Module ein; Nischen, Fronten und Anschlüsse stimmen wir danach gemeinsam ab."]
    ),
  }),
  en: f({
    kaufwort: "Buy V-ZUG in Vorarlberg",
    description: "Buy V-ZUG: Combair ovens, CombiSteamer, CookTop hobs and refrigeration from the Swiss manufacturer – planned and installed in Lochau.",
    intro: "V-ZUG is a Swiss manufacturer of built-in appliances. The catalogue lists the Combair ovens, the CombiSteamer steam ovens, the CookTop induction hobs, refrigerators and freezers and the AdoraSpülen dishwashers. Lochau lies on Lake Constance close to the Swiss border; the kitchen planner offers the 55 cm grid to the Swiss SMS standard as well as the 60 cm grid.",
    planer: "In the kitchen planner you add V-ZUG appliances to your plan as appliance units with catalogue dimensions – on the 55 cm grid if you wish.",
    planerLabel: "Plan V-ZUG in the kitchen planner",
    faqTitle: "Frequently asked questions about V-ZUG",
    faq: faq(
      ["How much does a V-ZUG appliance cost?", "The price depends on the appliance, the series (V2000, V4000, V6000) and the features. You receive a quote at your appointment, matched to your kitchen plan."],
      ["I live in Switzerland – can I plan with you?", "Yes. Lochau lies close to the border; for kitchens in Swiss dimensions we plan on the 55 cm grid to the SMS standard. We go through the steps for a purchase from Switzerland with you at your appointment."],
      ["Where can I see V-ZUG appliances?", "At your appointment in Lochau we go through Combair, CombiSteamer, CookTop and the refrigeration appliances with you and settle which suit your kitchen."],
      ["How do I plan V-ZUG appliances?", "Start in the kitchen planner with your floor plan and place the appliances as units; niches, fronts and connections are then coordinated together."]
    ),
  }),
  fr: f({
    kaufwort: "Acheter V-ZUG au Vorarlberg",
    description: "Acheter V-ZUG : fours Combair, CombiSteamer, tables CookTop et froid du fabricant suisse – intégrés et installés à Lochau (lac de Constance).",
    intro: "V-ZUG est un fabricant suisse d’appareils encastrables. Le catalogue comprend les fours Combair, les fours vapeur CombiSteamer, les tables à induction CookTop, les réfrigérateurs et congélateurs ainsi que les lave-vaisselle AdoraSpülen. Lochau se trouve au bord du lac de Constance, près de la frontière suisse ; le planificateur de cuisine propose, outre la trame de 60 cm, la trame de 55 cm selon la norme suisse SMS.",
    planer: "Dans le planificateur de cuisine, vous ajoutez les appareils V-ZUG à votre projet comme modules aux cotes du catalogue – au choix sur la trame de 55 cm.",
    planerLabel: "Intégrer V-ZUG dans le planificateur",
    faqTitle: "Questions fréquentes sur V-ZUG",
    faq: faq(
      ["Combien coûte un appareil V-ZUG ?", "Le prix dépend de l’appareil, de la série (V2000, V4000, V6000) et de l’équipement. Vous recevez une offre lors du rendez-vous, adaptée à votre projet de cuisine."],
      ["J’habite en Suisse : puis-je concevoir ma cuisine avec vous ?", "Oui. Lochau est proche de la frontière ; pour les cuisines aux cotes suisses, nous travaillons sur la trame de 55 cm selon la norme SMS. Nous passons en revue avec vous les étapes d’un achat depuis la Suisse lors du rendez-vous."],
      ["Où puis-je voir les appareils V-ZUG ?", "Lors du rendez-vous à Lochau, nous passons en revue avec vous Combair, CombiSteamer, CookTop et les appareils de froid et déterminons lesquels conviennent à votre cuisine."],
      ["Comment intégrer les appareils V-ZUG à mon projet ?", "Commencez dans le planificateur de cuisine avec votre plan et placez les appareils comme modules ; niches, façades et raccordements sont ensuite coordonnés ensemble."]
    ),
  }),
  it: f({
    kaufwort: "Comprare V-ZUG nel Vorarlberg",
    description: "Comprare V-ZUG: forni Combair, CombiSteamer, piani CookTop e freddo del produttore svizzero – progettati e montati a Lochau, sul lago di Costanza.",
    intro: "V-ZUG è un produttore svizzero di elettrodomestici da incasso. A catalogo trovate i forni Combair, i forni a vapore CombiSteamer, i piani a induzione CookTop, frigoriferi e congelatori e le lavastoviglie AdoraSpülen. Lochau si trova sul lago di Costanza, vicino al confine svizzero; il configuratore di cucine offre, oltre al modulo da 60 cm, il modulo da 55 cm secondo la norma svizzera SMS.",
    planer: "Nel configuratore di cucine inserite gli apparecchi V-ZUG nel progetto come moduli con le misure di catalogo – a scelta sul modulo da 55 cm.",
    planerLabel: "Inserire V-ZUG nel configuratore",
    faqTitle: "Domande frequenti su V-ZUG",
    faq: faq(
      ["Quanto costa un apparecchio V-ZUG?", "Il prezzo dipende dall’apparecchio, dalla serie (V2000, V4000, V6000) e dalla dotazione. Ricevete un’offerta all’appuntamento, in base al progetto della vostra cucina."],
      ["Abito in Svizzera: posso progettare con voi?", "Sì. Lochau è vicina al confine; per cucine a misura svizzera progettiamo sul modulo da 55 cm secondo la norma SMS. I passaggi per un acquisto dalla Svizzera li vediamo insieme all’appuntamento."],
      ["Dove posso vedere gli apparecchi V-ZUG?", "All’appuntamento a Lochau esaminiamo con voi Combair, CombiSteamer, CookTop e gli apparecchi per il freddo e stabiliamo quali si adattano alla vostra cucina."],
      ["Come inserisco gli apparecchi V-ZUG nel progetto?", "Iniziate nel configuratore di cucine con la vostra pianta e inserite gli apparecchi come moduli; nicchie, frontali e allacciamenti li coordiniamo poi insieme."]
    ),
  }),
});

/* ------------------------------------------------------------------ Liebherr */
const LIEBHERR = f({
  de: f({
    kaufwort: "Liebherr Kühlschrank kaufen",
    description: "Liebherr Kühlschrank kaufen: Einbau- und Unterbaugeräte, Kühl-Gefrierkombinationen, BioFresh, Monolith, Weinklima – eingeplant und montiert in Lochau.",
    intro: "Liebherr steht im Katalog für Kühlen, Gefrieren und Weinklima: Einbau- und Unterbaukühlschränke, Kühl-Gefrierkombinationen mit BioFresh und NoFrost, die Monolith-Geräte sowie die Weinschränke Vinidor und GrandCru. Nischenmaß, Türanschlag und Front planen wir mit Ihrer Küche ab.",
    planer: "Im Küchenplaner setzen Sie Kühl- und Gefriergeräte von Liebherr als Gerätemodule mit Katalogmaßen in Ihre Hochschrankzeile ein.",
    planerLabel: "Liebherr im Küchenplaner einplanen",
    faqTitle: "Häufige Fragen zu Liebherr",
    faq: faq(
      ["Was kostet ein Liebherr Kühlschrank?", "Der Preis hängt von Bauform (Einbau, Unterbau, Monolith), Nischenhöhe und Ausstattung wie BioFresh oder NoFrost ab. Ein Angebot erhalten Sie im Termin, abgestimmt auf Ihre Küchenplanung."],
      ["Welcher Liebherr Kühlschrank passt in meine Küche?", "Das richtet sich nach Nischenhöhe, Türanschlag und danach, ob Sie Kühlen und Gefrieren getrennt oder als Kombination möchten. Im Katalog finden Sie die Baureihen Pure, Plus, Prime und Peak; die Auswahl treffen wir in der Planung."],
      ["Wo kann ich Liebherr Geräte ansehen?", "Im Termin in Lochau gehen wir die Kühl-, Gefrier- und Weinklimageräte mit Ihnen durch und klären, welche Geräte zu Ihrer Küche passen."],
      ["Wie plane ich einen Liebherr Kühlschrank ein?", "Starten Sie im Küchenplaner mit Ihrem Grundriss und setzen Sie das Kühlgerät als Modul in die Hochschrankzeile; Nische, Front und Anschluss stimmen wir danach gemeinsam ab."]
    ),
  }),
  en: f({
    kaufwort: "Buy a Liebherr refrigerator",
    description: "Buy a Liebherr refrigerator: built-in and under-counter, fridge-freezers with BioFresh, Monolith and wine cabinets – planned and installed in Lochau.",
    intro: "In the catalogue Liebherr stands for cooling, freezing and wine storage: built-in and under-counter refrigerators, fridge-freezers with BioFresh and NoFrost, the Monolith appliances and the Vinidor and GrandCru wine cabinets. We plan niche size, door hinge side and front with your kitchen.",
    planer: "In the kitchen planner you place Liebherr refrigerators and freezers as appliance units with catalogue dimensions in your tall-unit run.",
    planerLabel: "Plan Liebherr in the kitchen planner",
    faqTitle: "Frequently asked questions about Liebherr",
    faq: faq(
      ["How much does a Liebherr refrigerator cost?", "The price depends on the type (built-in, under-counter, Monolith), the niche height and features such as BioFresh or NoFrost. You receive a quote at your appointment, matched to your kitchen plan."],
      ["Which Liebherr refrigerator fits my kitchen?", "That depends on niche height, hinge side and whether you want cooling and freezing separately or combined. The catalogue lists the Pure, Plus, Prime and Peak series; we make the choice during planning."],
      ["Where can I see Liebherr appliances?", "At your appointment in Lochau we go through the refrigeration, freezer and wine appliances with you and settle which suit your kitchen."],
      ["How do I plan a Liebherr refrigerator?", "Start in the kitchen planner with your floor plan and place the appliance as a unit in the tall-unit run; niche, front and connection are then coordinated together."]
    ),
  }),
  fr: f({
    kaufwort: "Acheter un réfrigérateur Liebherr",
    description: "Acheter un réfrigérateur Liebherr : encastrable ou sous plan, combinés avec BioFresh, Monolith, caves à vin – intégré et installé à Lochau.",
    intro: "Au catalogue, Liebherr couvre le froid, la congélation et la conservation du vin : réfrigérateurs encastrables et sous plan, combinés réfrigérateur-congélateur avec BioFresh et NoFrost, appareils Monolith ainsi que caves à vin Vinidor et GrandCru. Cote de niche, sens d’ouverture et façade font partie de notre conception.",
    planer: "Dans le planificateur de cuisine, vous placez les réfrigérateurs et congélateurs Liebherr comme modules aux cotes du catalogue dans votre ligne de colonnes.",
    planerLabel: "Intégrer Liebherr dans le planificateur",
    faqTitle: "Questions fréquentes sur Liebherr",
    faq: faq(
      ["Combien coûte un réfrigérateur Liebherr ?", "Le prix dépend du type (encastrable, sous plan, Monolith), de la hauteur de niche et d’équipements comme BioFresh ou NoFrost. Vous recevez une offre lors du rendez-vous, adaptée à votre projet de cuisine."],
      ["Quel réfrigérateur Liebherr convient à ma cuisine ?", "Cela dépend de la hauteur de niche, du sens d’ouverture et du choix entre froid et congélation séparés ou combinés. Le catalogue comprend les séries Pure, Plus, Prime et Peak ; le choix se fait lors de la conception."],
      ["Où puis-je voir les appareils Liebherr ?", "Lors du rendez-vous à Lochau, nous passons en revue avec vous les appareils de froid, de congélation et les caves à vin et déterminons lesquels conviennent à votre cuisine."],
      ["Comment intégrer un réfrigérateur Liebherr à mon projet ?", "Commencez dans le planificateur de cuisine avec votre plan et placez l’appareil comme module dans la ligne de colonnes ; niche, façade et raccordement sont ensuite coordonnés ensemble."]
    ),
  }),
  it: f({
    kaufwort: "Comprare un frigorifero Liebherr",
    description: "Comprare un frigorifero Liebherr: da incasso e sottopiano, combinati con BioFresh, Monolith e cantinette – progettato e montato a Lochau.",
    intro: "A catalogo Liebherr copre freddo, congelazione e conservazione del vino: frigoriferi da incasso e sottopiano, frigocongelatori con BioFresh e NoFrost, gli apparecchi Monolith e le cantinette Vinidor e GrandCru. Misura della nicchia, senso di apertura e frontale li progettiamo con la vostra cucina.",
    planer: "Nel configuratore di cucine inserite frigoriferi e congelatori Liebherr come moduli apparecchio con le misure di catalogo nella linea delle colonne.",
    planerLabel: "Inserire Liebherr nel configuratore",
    faqTitle: "Domande frequenti su Liebherr",
    faq: faq(
      ["Quanto costa un frigorifero Liebherr?", "Il prezzo dipende dal tipo (incasso, sottopiano, Monolith), dall’altezza della nicchia e da dotazioni come BioFresh o NoFrost. Ricevete un’offerta all’appuntamento, in base al progetto della vostra cucina."],
      ["Quale frigorifero Liebherr va bene per la mia cucina?", "Dipende dall’altezza della nicchia, dal senso di apertura e dalla scelta tra freddo e congelazione separati o combinati. A catalogo trovate le serie Pure, Plus, Prime e Peak; la scelta la facciamo in fase di progetto."],
      ["Dove posso vedere gli apparecchi Liebherr?", "All’appuntamento a Lochau esaminiamo con voi frigoriferi, congelatori e cantinette e stabiliamo quali si adattano alla vostra cucina."],
      ["Come inserisco un frigorifero Liebherr nel progetto?", "Iniziate nel configuratore di cucine con la vostra pianta e inserite l’apparecchio come modulo nella linea delle colonne; nicchia, frontale e allacciamento li coordiniamo poi insieme."]
    ),
  }),
});

/* ------------------------------------------------------------------ Miele */
const MIELE = f({
  de: f({
    kaufwort: "Miele kaufen in Vorarlberg",
    description: "Miele Einbaugeräte kaufen: Backöfen, Dampfgarer, Kochfelder, Dunstabzüge, Geschirrspüler und Kühlgeräte – eingeplant und montiert in Lochau.",
    intro: "Miele deckt im Katalog die ganze Küche ab: Backöfen und Dampfgarer, Kochfelder mit und ohne Abzug, Dunstabzüge, Geschirrspüler, Kühl- und Gefriergeräte, Weinklimaschränke und Kaffeevollautomaten. Wir stimmen die Geräte auf Fronten, Nischen und Anschlüsse Ihrer Küche ab.",
    planer: "Im Küchenplaner nehmen Sie Miele-Geräte als Gerätemodule mit Katalogmaßen in Ihre Planung auf.",
    planerLabel: "Miele im Küchenplaner einplanen",
    faqTitle: "Häufige Fragen zu Miele",
    faq: faq(
      ["Was kostet eine Küche mit Miele-Geräten?", "Der Preis hängt von Anzahl und Art der Geräte, von Baureihe und Ausstattung ab. Ein Angebot erhalten Sie im Termin, abgestimmt auf Ihre Küchenplanung."],
      ["Welche Miele-Geräte planen Sie ein?", "Backöfen, Dampfgarer, Kompaktgeräte, Kochfelder, Dunstabzüge, Geschirrspüler, Kühl- und Gefriergeräte, Weinklimaschränke und Kaffeevollautomaten – alle Geräte aus dem Katalog auf dieser Seite."],
      ["Wo kann ich Miele-Geräte ansehen?", "Im Termin in Lochau gehen wir die Geräte mit Ihnen durch und klären, welche Kombination zu Ihrer Küche und Ihrer Art zu kochen passt."],
      ["Wie plane ich Miele-Geräte ein?", "Starten Sie im Küchenplaner mit Ihrem Grundriss und setzen Sie die Geräte als Module ein; Nischen, Fronten und Anschlüsse stimmen wir danach gemeinsam ab."]
    ),
  }),
  en: f({
    kaufwort: "Buy Miele in Vorarlberg",
    description: "Buy Miele built-in appliances: ovens, steam ovens, hobs, extractors, dishwashers and refrigeration – planned into your kitchen, installed in Lochau.",
    intro: "In the catalogue Miele covers the whole kitchen: ovens and steam ovens, hobs with and without extractor, cooker hoods, dishwashers, refrigerators and freezers, wine cabinets and built-in coffee machines. We match the appliances to the fronts, niches and connections of your kitchen.",
    planer: "In the kitchen planner you add Miele appliances to your plan as appliance units with catalogue dimensions.",
    planerLabel: "Plan Miele in the kitchen planner",
    faqTitle: "Frequently asked questions about Miele",
    faq: faq(
      ["How much does a kitchen with Miele appliances cost?", "The price depends on the number and type of appliances, the series and the features. You receive a quote at your appointment, matched to your kitchen plan."],
      ["Which Miele appliances do you plan with?", "Ovens, steam ovens, compact appliances, hobs, extractors, dishwashers, refrigerators and freezers, wine cabinets and coffee machines – all appliances from the catalogue on this page."],
      ["Where can I see Miele appliances?", "At your appointment in Lochau we go through the appliances with you and settle which combination suits your kitchen and the way you cook."],
      ["How do I plan Miele appliances?", "Start in the kitchen planner with your floor plan and place the appliances as units; niches, fronts and connections are then coordinated together."]
    ),
  }),
  fr: f({
    kaufwort: "Acheter Miele au Vorarlberg",
    description: "Acheter des appareils encastrables Miele : fours, fours vapeur, tables, hottes, lave-vaisselle et froid – intégrés et installés à Lochau.",
    intro: "Au catalogue, Miele couvre toute la cuisine : fours et fours vapeur, tables avec ou sans aspiration, hottes, lave-vaisselle, réfrigérateurs et congélateurs, caves à vin et machines à café encastrables. Nous accordons les appareils aux façades, niches et raccordements de votre cuisine.",
    planer: "Dans le planificateur de cuisine, vous ajoutez les appareils Miele à votre projet comme modules aux cotes du catalogue.",
    planerLabel: "Intégrer Miele dans le planificateur",
    faqTitle: "Questions fréquentes sur Miele",
    faq: faq(
      ["Combien coûte une cuisine avec des appareils Miele ?", "Le prix dépend du nombre et du type d’appareils, de la série et de l’équipement. Vous recevez une offre lors du rendez-vous, adaptée à votre projet de cuisine."],
      ["Quels appareils Miele intégrez-vous ?", "Fours, fours vapeur, appareils compacts, tables de cuisson, hottes, lave-vaisselle, réfrigérateurs et congélateurs, caves à vin et machines à café – tous les appareils du catalogue de cette page."],
      ["Où puis-je voir les appareils Miele ?", "Lors du rendez-vous à Lochau, nous passons en revue les appareils avec vous et déterminons quelle combinaison convient à votre cuisine et à votre façon de cuisiner."],
      ["Comment intégrer les appareils Miele à mon projet ?", "Commencez dans le planificateur de cuisine avec votre plan et placez les appareils comme modules ; niches, façades et raccordements sont ensuite coordonnés ensemble."]
    ),
  }),
  it: f({
    kaufwort: "Comprare Miele nel Vorarlberg",
    description: "Comprare elettrodomestici da incasso Miele: forni, forni a vapore, piani, cappe, lavastoviglie e freddo – progettati e montati a Lochau.",
    intro: "A catalogo Miele copre tutta la cucina: forni e forni a vapore, piani cottura con e senza aspirazione, cappe, lavastoviglie, frigoriferi e congelatori, cantinette e macchine da caffè da incasso. Accordiamo gli apparecchi a frontali, nicchie e allacciamenti della vostra cucina.",
    planer: "Nel configuratore di cucine inserite gli apparecchi Miele nel progetto come moduli con le misure di catalogo.",
    planerLabel: "Inserire Miele nel configuratore",
    faqTitle: "Domande frequenti su Miele",
    faq: faq(
      ["Quanto costa una cucina con apparecchi Miele?", "Il prezzo dipende dal numero e dal tipo di apparecchi, dalla serie e dalla dotazione. Ricevete un’offerta all’appuntamento, in base al progetto della vostra cucina."],
      ["Quali apparecchi Miele inserite nel progetto?", "Forni, forni a vapore, apparecchi compatti, piani cottura, cappe, lavastoviglie, frigoriferi e congelatori, cantinette e macchine da caffè – tutti gli apparecchi del catalogo in questa pagina."],
      ["Dove posso vedere gli apparecchi Miele?", "All’appuntamento a Lochau esaminiamo gli apparecchi con voi e stabiliamo quale combinazione si adatta alla vostra cucina e al vostro modo di cucinare."],
      ["Come inserisco gli apparecchi Miele nel progetto?", "Iniziate nel configuratore di cucine con la vostra pianta e inserite gli apparecchi come moduli; nicchie, frontali e allacciamenti li coordiniamo poi insieme."]
    ),
  }),
});

/* ------------------------------------------------------------------ Gaggenau */
const GAGGENAU = f({
  de: f({
    kaufwort: "Gaggenau kaufen in Vorarlberg",
    description: "Gaggenau kaufen: Backöfen, Dampfbacköfen, Flex-Induktionskochfelder, Kühl- und Weinklimageräte – in Ihre Küche eingeplant und montiert in Lochau.",
    intro: "Gaggenau-Geräte sind für die Einbauplanung gedacht: Backöfen in 60 und 76 cm Breite, Dampfbacköfen, Flex-Induktionskochfelder – auch mit integriertem Lüftungssystem –, Gaskochfelder, Dunstabzüge, Geschirrspüler, Kühl- und Gefriergeräte sowie Weinklimaschränke. Geräteflucht, Nischen und Anschlüsse planen wir mit Ihrer Küche ab.",
    planer: "Im Küchenplaner nehmen Sie Gaggenau-Geräte als Gerätemodule mit Katalogmaßen in Ihre Planung auf.",
    planerLabel: "Gaggenau im Küchenplaner einplanen",
    faqTitle: "Häufige Fragen zu Gaggenau",
    faq: faq(
      ["Was kostet eine Küche mit Gaggenau-Geräten?", "Der Preis hängt von Anzahl und Art der Geräte, von Serie, Breite und Ausstattung ab. Ein Angebot erhalten Sie im Termin, abgestimmt auf Ihre Küchenplanung."],
      ["Welche Gaggenau-Geräte planen Sie ein?", "Backöfen, Dampfbacköfen, Kompaktgeräte, Induktions- und Gaskochfelder, Kochfelder mit integriertem Lüftungssystem, Dunstabzüge, Geschirrspüler, Kühl- und Gefriergeräte und Weinklimaschränke – alle Geräte aus dem Katalog auf dieser Seite."],
      ["Wo kann ich Gaggenau-Geräte ansehen?", "Im Termin in Lochau gehen wir die Geräte mit Ihnen durch und klären, welche Kombination zu Ihrer Küche und Ihrer Art zu kochen passt."],
      ["Wie plane ich Gaggenau-Geräte ein?", "Starten Sie im Küchenplaner mit Ihrem Grundriss und setzen Sie die Geräte als Module ein; Geräteflucht, Nischen und Anschlüsse stimmen wir danach gemeinsam ab."]
    ),
  }),
  en: f({
    kaufwort: "Buy Gaggenau in Vorarlberg",
    description: "Buy Gaggenau: ovens, combi-steam ovens, flex induction cooktops, refrigeration and wine cabinets – planned into your kitchen and installed in Lochau.",
    intro: "Gaggenau appliances are made for built-in planning: ovens 60 and 76 cm wide, combi-steam ovens, flex induction cooktops – also with integrated ventilation –, gas cooktops, extractors, dishwashers, refrigerators and freezers and wine cabinets. We plan the appliance line-up, niches and connections with your kitchen.",
    planer: "In the kitchen planner you add Gaggenau appliances to your plan as appliance units with catalogue dimensions.",
    planerLabel: "Plan Gaggenau in the kitchen planner",
    faqTitle: "Frequently asked questions about Gaggenau",
    faq: faq(
      ["How much does a kitchen with Gaggenau appliances cost?", "The price depends on the number and type of appliances, the series, the width and the features. You receive a quote at your appointment, matched to your kitchen plan."],
      ["Which Gaggenau appliances do you plan with?", "Ovens, combi-steam ovens, compact appliances, induction and gas cooktops, cooktops with integrated ventilation, extractors, dishwashers, refrigerators and freezers and wine cabinets – all appliances from the catalogue on this page."],
      ["Where can I see Gaggenau appliances?", "At your appointment in Lochau we go through the appliances with you and settle which combination suits your kitchen and the way you cook."],
      ["How do I plan Gaggenau appliances?", "Start in the kitchen planner with your floor plan and place the appliances as units; appliance line-up, niches and connections are then coordinated together."]
    ),
  }),
  fr: f({
    kaufwort: "Acheter Gaggenau au Vorarlberg",
    description: "Acheter Gaggenau : fours, fours vapeur combinés, tables à induction flex, froid et caves à vin – intégrés à votre cuisine et installés à Lochau.",
    intro: "Les appareils Gaggenau sont conçus pour l’encastrement : fours de 60 et 76 cm de large, fours vapeur combinés, tables à induction flex – aussi avec ventilation intégrée –, tables gaz, hottes, lave-vaisselle, réfrigérateurs et congélateurs ainsi que caves à vin. Alignement des appareils, niches et raccordements font partie de notre conception.",
    planer: "Dans le planificateur de cuisine, vous ajoutez les appareils Gaggenau à votre projet comme modules aux cotes du catalogue.",
    planerLabel: "Intégrer Gaggenau dans le planificateur",
    faqTitle: "Questions fréquentes sur Gaggenau",
    faq: faq(
      ["Combien coûte une cuisine avec des appareils Gaggenau ?", "Le prix dépend du nombre et du type d’appareils, de la série, de la largeur et de l’équipement. Vous recevez une offre lors du rendez-vous, adaptée à votre projet de cuisine."],
      ["Quels appareils Gaggenau intégrez-vous ?", "Fours, fours vapeur combinés, appareils compacts, tables à induction et gaz, tables avec ventilation intégrée, hottes, lave-vaisselle, réfrigérateurs et congélateurs et caves à vin – tous les appareils du catalogue de cette page."],
      ["Où puis-je voir les appareils Gaggenau ?", "Lors du rendez-vous à Lochau, nous passons en revue les appareils avec vous et déterminons quelle combinaison convient à votre cuisine et à votre façon de cuisiner."],
      ["Comment intégrer les appareils Gaggenau à mon projet ?", "Commencez dans le planificateur de cuisine avec votre plan et placez les appareils comme modules ; alignement, niches et raccordements sont ensuite coordonnés ensemble."]
    ),
  }),
  it: f({
    kaufwort: "Comprare Gaggenau nel Vorarlberg",
    description: "Comprare Gaggenau: forni, forni combinati a vapore, piani a induzione flex, freddo e cantinette – progettati nella vostra cucina e montati a Lochau.",
    intro: "Gli apparecchi Gaggenau sono pensati per la progettazione da incasso: forni larghi 60 e 76 cm, forni combinati a vapore, piani a induzione flex – anche con aspirazione integrata –, piani a gas, cappe, lavastoviglie, frigoriferi e congelatori e cantinette per vino. Allineamento degli apparecchi, nicchie e allacciamenti li progettiamo con la vostra cucina.",
    planer: "Nel configuratore di cucine inserite gli apparecchi Gaggenau nel progetto come moduli con le misure di catalogo.",
    planerLabel: "Inserire Gaggenau nel configuratore",
    faqTitle: "Domande frequenti su Gaggenau",
    faq: faq(
      ["Quanto costa una cucina con apparecchi Gaggenau?", "Il prezzo dipende dal numero e dal tipo di apparecchi, dalla serie, dalla larghezza e dalla dotazione. Ricevete un’offerta all’appuntamento, in base al progetto della vostra cucina."],
      ["Quali apparecchi Gaggenau inserite nel progetto?", "Forni, forni combinati a vapore, apparecchi compatti, piani a induzione e a gas, piani con aspirazione integrata, cappe, lavastoviglie, frigoriferi e congelatori e cantinette – tutti gli apparecchi del catalogo in questa pagina."],
      ["Dove posso vedere gli apparecchi Gaggenau?", "All’appuntamento a Lochau esaminiamo gli apparecchi con voi e stabiliamo quale combinazione si adatta alla vostra cucina e al vostro modo di cucinare."],
      ["Come inserisco gli apparecchi Gaggenau nel progetto?", "Iniziate nel configuratore di cucine con la vostra pianta e inserite gli apparecchi come moduli; allineamento, nicchie e allacciamenti li coordiniamo poi insieme."]
    ),
  }),
});

/** Texte je Marke (Slug wie src/lib/katalog/marken/) und Sprache. */
export const MARKEN_SEO = f({ quooker: QUOOKER, bora: BORA, "v-zug": VZUG, liebherr: LIEBHERR, miele: MIELE, gaggenau: GAGGENAU });

export const MARKEN_SEO_SLUGS = f(Object.keys(MARKEN_SEO));

/** Texte einer Marke in einer Sprache, sonst null (andere Marken/Welten: generische Seite). */
export function markenSeo(slug, locale) {
  return MARKEN_SEO[slug]?.[locale] || null;
}

/** Ortsangabe im Titel je Sprache („… in Lochau“). */
const ORT = f({ de: "in Lochau", en: "in Lochau", fr: "à Lochau", it: "a Lochau" });

/**
 * Titel ohne Hausmarke: „Quooker kaufen in Vorarlberg – Händler in Lochau“.
 * `haendlerWort` kommt vom Claim-Guard (dealerTitleWord); leer → nur das Kaufwort.
 * Der Aufrufer hängt " | Platzhirsch" an und kürzt mit fitTitle (≤ 60).
 */
export function markenSeoTitel(slug, locale, haendlerWort = "") {
  const e = markenSeo(slug, locale);
  if (!e) return "";
  const w = String(haendlerWort || "").trim();
  return w ? `${e.kaufwort} – ${w} ${ORT[locale] || ORT.de}` : e.kaufwort;
}

/** Ratgeber-Link zum Einkauf aus der Schweiz, nur wo Text und Ratgeber vorhanden sind. */
export function chRatgeberLink(slug, locale) {
  const e = markenSeo(slug, locale);
  if (!e?.ch || !CH_RATGEBER_LOCALES.includes(locale)) return null;
  return { href: CH_RATGEBER_PATH, label: e.chLabel, text: e.ch };
}
