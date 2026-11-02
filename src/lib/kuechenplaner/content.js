// src/lib/kuechenplaner/content.js – Seitentexte von /<locale>/kuechenplaner
// (DE, EN, FR, IT; Sprachen seit 01.11.2026): Metadaten, Kopf, Leitfaden mit
// FAQ, Hinweise unter dem Werkzeug, Querverweise, JSON-LD-Funktionsliste.
// Die Oberfläche des Planers übersetzen die Wörterbücher in ./copy/.
//
// Deutsch ist der Mastertext (Wortlaut wie bisher in page.js und PlanerGuide.js).
// Regeln wie dort: nur Funktionen, die der Planer hat (catalog.js, checks.js,
// druck/); Zahlen der Prüfung aus norms.js (RULES), nicht aus dem Text; keine
// Preise, keine Superlative, kein Händlerwort (Gerätemarken nur „einplanen“).
// Französisch mit normalen Leerzeichen – frenchTypography() beim Laden;
// Italienisch in der Höflichkeitsform „voi“.
//
// Rein, ohne "@/"-Importe (node --test).
import { frenchTypography } from "../hotel/content-intl.js";
import { RULES } from "./norms.js";
import { MAX_FREE_WALLS } from "./room.js";

export const PATH = "/kuechenplaner";
export const KP_PAGE_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

const A1 = RULES.aisleOne.value;
const A2 = RULES.aisleTwo.value;
const MARKEN = "Gaggenau, Miele, V-ZUG, BORA, Liebherr und Quooker";

const DE = {
  meta: {
    title: "Küchenplaner online: Küche in 3D planen | Platzhirsch Home Living",
    description: "Küche online in 3D planen: Raum mit Dachschräge, Module per Drag & Drop, Ergonomie-Prüfung und Stückliste. Danach von Hand weitergeplant in Lochau.",
    ogTitle: "Küchenplaner online in 3D",
    imageAlt: "Küchenplaner: L-Küche im Grundriss mit Modulen und Maßen",
    appName: "Küchenplaner",
    browser: "Aktueller Browser mit JavaScript",
    features: [
      "Grundformen Zeile, L-Form, U-Form, zweizeilig, Insel und Halbinsel oder freie Raumform",
      "Fenster, Türen, Anschlüsse und Dachschräge",
      "Module per Drag & Drop im 60-cm- oder 55-cm-Raster (SMS)",
      "Fronten, Farben und Arbeitsplatten in der 3D-Ansicht",
      "Prüfung von Laufwegen, Arbeitsdreieck, Arbeitshöhe und Kollisionen mit Quellenangabe",
      "Stückliste, Druckansicht als PDF, Variantenvergleich und Teilen-Link",
    ],
  },
  header: {
    eyebrow: "Küchenplaner",
    title: "Ihre Küche, in 3D geplant.",
    lead: "Raum zeichnen, Module an die Wand ziehen, Material wählen – der Planer prüft Abstände und Laufwege.",
    leadMore: "Die Feinplanung machen wir persönlich mit Ihnen.",
    hand: "Online starten – Harald Menghin zeichnet Ihr Konzept danach von Hand.",
  },
  bridge: {
    label: "Von der Handzeichnung zum Rendering",
    text: "Online starten – Harald Menghin zeichnet Ihr Konzept anschließend von Hand. Erst danach planen wir in 3D und zeigen Ihnen den Raum fotorealistisch.",
    arbeitsweise: "So arbeiten wir",
    licht: "Licht in Ihrer Küche ansehen",
    studio: "Küchenplanung im Studio",
  },
  notes: {
    priceShown: "Der Preisrahmen ist ein unverbindlicher Richtwert und kein Angebot.",
    priceHidden: "Der Planer zeigt keine Preise. Einen Richtpreis nennen wir Ihnen persönlich nach Beratung und Aufmaß.",
    line: "„Italienische Premiumküche“ beschreibt nur eine Gestaltungsrichtung und ist keine Planung oder Preisangabe eines Herstellers. Ergonomie-Werte sind Richtwerte mit Quelle; Gerätemaße ohne Herstellerquelle sind als fehlend markiert.",
    local: "Die Planung wird nur in Ihrem Browser berechnet.",
    liveBefore: "Erst wenn Sie „Planung anfragen“ absenden, übertragen wir Ihre Angaben – siehe",
    privacy: "Datenschutzerklärung",
    test: "Der Planer sendet und speichert nichts; Ihre Angaben verlassen diesen Browser nicht. Für die Planung mit uns teilen Sie den Link oder vereinbaren einen Termin.",
    textures: "Materialbilder: CC0-Texturen von ambientCG bzw. im Browser erzeugt.",
  },
  guide: {
    title: "So planen Sie Ihre Küche online",
    intro: "Der Küchenplaner führt in fünf Schritten von der Raumform zur Stückliste. Er ersetzt kein Aufmaß, zeigt Ihnen aber früh, was in Ihren Raum passt und wo es eng wird.",
    steps: [
      { t: "Raum", d: `Grundform wählen – Zeile, L-Form, U-Form, zweizeilig, Zeile mit Insel oder Halbinsel – oder eine freie Raumform mit bis zu ${MAX_FREE_WALLS} Wänden zeichnen. Fenster, Türen, Heizkörper, Wasser-, Abluft- und Herdanschluss sowie eine Dachschräge mit Kniestock und Neigung eintragen.` },
      { t: "Möbel", d: "Unterschränke, Hochschränke, Hängeschränke, Insel und Gerätemodule per Drag & Drop an die Wand ziehen – wahlweise im 60-cm-Raster (EU) oder im 55-cm-Raster nach Schweizer SMS-Norm." },
      { t: "Material", d: "Fronten, Farben, Arbeitsplatte und Kante wählen; die 3D-Ansicht zeigt die Wirkung im Raum." },
      { t: "Prüfen", d: `Der Planer prüft Laufwege (${A1} cm für eine, ${A2} cm für zwei Personen), das Arbeitsdreieck, die Arbeitshöhe nach Körpergröße, den Abstand der Dunstabzugshaube und Kollisionen mit Türen und Dachschräge. Jeder Richtwert nennt seine Quelle; Planungsannahmen ohne Quelle sind als solche markiert.` },
      { t: "Ergebnis", d: "Stückliste, Grundriss mit Maßketten und Wandansichten als Druckansicht oder PDF; zwei Varianten nebeneinander vergleichen und die Planung per Link teilen." },
    ],
    studioTitle: "Vom Online-Plan zur Küche aus Lochau",
    studioText: `Der Online-Plan ist ein Anfang. Im Studio in Lochau zeichnet Harald Menghin Ihre Küche von Hand weiter: Wege, Arbeitsdreieck, Stauraum und Licht. Danach planen wir sie in 3D mit exakten Maßen und Anschlüssen, und Sie vergleichen Fronten, Arbeitsplatten und Oberflächen im Termin anhand von Mustern. Einbaugeräte von ${MARKEN} planen wir von Anfang an mit ein.`,
    links: [
      { key: "studio", label: "Küchenplanung im Studio in Lochau", href: "/kuechen-vorarlberg" },
      { key: "geraete", label: "Einbaugeräte, die wir einplanen", href: "/kuechengeraete" },
      { key: "ratgeber", label: "Ratgeber: Was kostet eine Designerküche?", href: "/ratgeber/was-kostet-eine-designerkueche" },
      { key: "termin", label: "Termin im Studio vereinbaren", href: "/beratung" },
    ],
    faqTitle: "Häufige Fragen zum Küchenplaner",
    faq: [
      { q: "Brauche ich für den Küchenplaner eine Anmeldung?", a: "Nein. Der Küchenplaner läuft im Browser, ohne Anmeldung und ohne Installation. Die Planung wird nur in Ihrem Browser berechnet." },
      { q: "Kann ich eine Küche mit Dachschräge planen?", a: "Ja. Im Schritt „Raum“ legen Sie für eine Wand Kniestockhöhe und Neigung der Dachschräge fest. Ragt ein Hoch- oder Hängeschrank in die Schräge, meldet die Prüfung eine Kollision." },
      { q: "Wie genau ist die Online-Planung?", a: "Der Planer rechnet mit Rastermaßen und Richtwerten aus Herstellerunterlagen und Fachquellen. Er ersetzt kein Aufmaß: Wände, Anschlüsse und Gerätenischen prüfen wir vor Ort, bevor etwas bestellt wird." },
      { q: "Wie geht es nach der Online-Planung weiter?", a: "Geben Sie uns den Link zu Ihrer Planung oder bringen Sie die Druckansicht zum Termin mit. Im Studio in Lochau zeichnet Harald Menghin Ihre Küche von Hand weiter; danach folgen die Planung in 3D, die Auswahl der Materialien anhand von Mustern und auf Wunsch Lieferung und Montage." },
    ],
  },
  crumbs: { overview: "Planen & Erleben" },
};

const EN = {
  meta: {
    title: "3D kitchen planner: design your kitchen online",
    description: "Design your kitchen online in 3D: room with sloped ceiling, units by drag & drop, ergonomics check and parts list. Then refined by hand in Lochau.",
    ogTitle: "Online 3D kitchen planner",
    imageAlt: "Kitchen planner: L-shaped kitchen in the floor plan with units and dimensions",
    appName: "Kitchen planner",
    browser: "Current browser with JavaScript",
    features: [
      "Layouts: single wall, L-shape, U-shape, galley, island and peninsula, or a custom room shape",
      "Windows, doors, connections and sloped ceiling",
      "Units by drag & drop on a 60 cm or 55 cm grid (SMS)",
      "Fronts, colours and worktops in the 3D view",
      "Check of aisles, work triangle, worktop height and collisions, with sources",
      "Parts list, print view as PDF, variant comparison and share link",
    ],
  },
  header: {
    eyebrow: "Kitchen planner",
    title: "Your kitchen, planned in 3D.",
    lead: "Draw the room, drag units to the wall, choose materials – the planner checks clearances and aisles.",
    leadMore: "We do the detailed planning with you in person.",
    hand: "Start online – Harald Menghin then draws your concept by hand.",
  },
  bridge: {
    label: "From hand drawing to rendering",
    text: "Start online – Harald Menghin then draws your concept by hand. Only after that do we plan in 3D and show you the room photorealistically.",
    arbeitsweise: "How we work",
    licht: "See the light in your kitchen",
    studio: "Kitchen planning at the studio",
  },
  notes: {
    priceShown: "The price range is a non-binding guide value and not a quote.",
    priceHidden: "The planner does not show prices. We give you a guide price in person after consultation and site survey.",
    line: "“Italian premium kitchen” only describes a design direction and is not a manufacturer’s plan or price. Ergonomic values are guide values with sources; appliance dimensions without a manufacturer source are marked as missing.",
    local: "Your plan is calculated only in your browser.",
    liveBefore: "Only when you send “Request a planning consultation” do we transmit your details – see the",
    privacy: "privacy policy",
    test: "The planner neither sends nor stores anything; your details do not leave this browser. To plan with us, share the link or book an appointment.",
    textures: "Material images: CC0 textures from ambientCG or generated in the browser.",
  },
  guide: {
    title: "How to plan your kitchen online",
    intro: "The kitchen planner takes you in five steps from the room shape to the parts list. It does not replace a site survey, but it shows you early on what fits in your room and where space gets tight.",
    steps: [
      { t: "Room", d: `Choose a layout – single wall, L-shape, U-shape, galley, single wall with island or peninsula – or draw a custom room shape with up to ${MAX_FREE_WALLS} walls. Add windows, doors, radiators, water, exhaust and cooker connections, as well as a sloped ceiling with knee wall and pitch.` },
      { t: "Units", d: "Drag base units, tall units, wall units, island and appliance units to the wall – on a 60 cm grid (EU) or a 55 cm grid to the Swiss SMS standard." },
      { t: "Materials", d: "Choose fronts, colours, worktop and edge; the 3D view shows the effect in the room." },
      { t: "Check", d: `The planner checks aisles (${A1} cm for one person, ${A2} cm for two), the work triangle, the worktop height for your height, the extractor hood clearance and collisions with doors and the sloped ceiling. Every guide value names its source; planning assumptions without a source are marked as such.` },
      { t: "Result", d: "Parts list, dimensioned floor plan and wall elevations as a print view or PDF; compare two variants side by side and share the plan via a link." },
    ],
    studioTitle: "From the online plan to a kitchen from Lochau",
    studioText: "The online plan is a beginning. At the studio in Lochau, Harald Menghin continues drawing your kitchen by hand: circulation, work triangle, storage and light. We then plan it in 3D with exact dimensions and connections, and you compare fronts, worktops and surfaces using samples at your appointment. We plan built-in appliances from Gaggenau, Miele, V-ZUG, BORA, Liebherr and Quooker from the outset.",
    links: [
      { key: "studio", label: "Kitchen planning at the studio in Lochau", href: "/kuechen-vorarlberg" },
      { key: "geraete", label: "Built-in appliances we plan with", href: "/kuechengeraete" },
      { key: "termin", label: "Book an appointment at the studio", href: "/beratung" },
    ],
    faqTitle: "Frequently asked questions about the kitchen planner",
    faq: [
      { q: "Do I need to register to use the kitchen planner?", a: "No. The kitchen planner runs in your browser, without registration or installation. Your plan is calculated only in your browser." },
      { q: "Can I plan a kitchen with a sloped ceiling?", a: "Yes. In the “Room” step you set the knee wall height and pitch of the slope for one wall. If a tall or wall unit extends into the slope, the check reports a collision." },
      { q: "How accurate is the online plan?", a: "The planner works with grid dimensions and guide values from manufacturer documents and specialist sources. It does not replace a site survey: we check walls, connections and appliance niches on site before anything is ordered." },
      { q: "What happens after the online plan?", a: "Send us the link to your plan or bring the print view to your appointment. At the studio in Lochau, Harald Menghin continues drawing your kitchen by hand; this is followed by planning in 3D, choosing materials from samples and, if you wish, delivery and installation." },
    ],
  },
  crumbs: { overview: null },
};

const FR = {
  meta: {
    title: "Planificateur de cuisine 3D en ligne",
    description: "Concevez votre cuisine en 3D en ligne : sous-pente, modules en glisser-déposer, contrôle ergonomique et nomenclature, puis dessin à la main à Lochau.",
    ogTitle: "Planificateur de cuisine 3D",
    imageAlt: "Planificateur de cuisine : cuisine en L sur le plan, avec modules et cotes",
    appName: "Planificateur de cuisine",
    browser: "Navigateur récent avec JavaScript",
    features: [
      "Formes linéaire, en L, en U, parallèle, îlot et péninsule, ou forme de pièce libre",
      "Fenêtres, portes, raccordements et sous-pente",
      "Modules en glisser-déposer sur une trame de 60 cm ou de 55 cm (SMS)",
      "Façades, couleurs et plans de travail dans la vue 3D",
      "Vérification des passages, du triangle d’activité, de la hauteur de travail et des collisions, avec sources",
      "Nomenclature, version imprimable en PDF, comparaison de variantes et lien de partage",
    ],
  },
  header: {
    eyebrow: "Planificateur de cuisine",
    title: "Votre cuisine, conçue en 3D.",
    lead: "Dessinez la pièce, placez les modules contre le mur, choisissez les matériaux – le planificateur vérifie distances et passages.",
    leadMore: "Nous réalisons la conception détaillée avec vous, en personne.",
    hand: "Commencez en ligne – Harald Menghin dessine ensuite votre concept à la main.",
  },
  bridge: {
    label: "Du dessin à la main au rendu",
    text: "Commencez en ligne – Harald Menghin dessine ensuite votre concept à la main. Ce n’est qu’après que nous concevons en 3D et vous montrons la pièce de façon photoréaliste.",
    arbeitsweise: "Notre façon de travailler",
    licht: "Voir la lumière dans votre cuisine",
    studio: "Conception de cuisine au studio",
  },
  notes: {
    priceShown: "La fourchette de prix est une valeur indicative sans engagement et non une offre.",
    priceHidden: "Le planificateur n’affiche pas de prix. Nous vous indiquons un prix indicatif en personne, après conseil et relevé sur place.",
    line: "« Cuisine italienne haut de gamme » désigne uniquement une orientation stylistique ; il ne s’agit ni du projet ni du prix d’un fabricant. Les valeurs d’ergonomie sont des valeurs indicatives avec source ; les cotes d’appareils sans source du fabricant sont signalées comme manquantes.",
    local: "Le projet est calculé uniquement dans votre navigateur.",
    liveBefore: "Ce n’est qu’à l’envoi de « Demander une étude du projet » que nous transmettons vos données – voir la",
    privacy: "déclaration de confidentialité",
    test: "Le planificateur n’envoie ni n’enregistre rien ; vos données ne quittent pas ce navigateur. Pour concevoir avec nous, partagez le lien ou prenez rendez-vous.",
    textures: "Images des matériaux : textures CC0 d’ambientCG ou générées dans le navigateur.",
  },
  guide: {
    title: "Concevoir sa cuisine en ligne, étape par étape",
    intro: "Le planificateur vous mène en cinq étapes de la forme de la pièce à la nomenclature. Il ne remplace pas un relevé sur place, mais il vous montre tôt ce qui tient dans votre pièce et où l’espace devient juste.",
    steps: [
      { t: "Pièce", d: `Choisissez une forme – linéaire, en L, en U, parallèle, linéaire avec îlot ou péninsule – ou dessinez une pièce libre jusqu’à ${MAX_FREE_WALLS} murs. Ajoutez fenêtres, portes, radiateurs, arrivée d’eau, évacuation et raccordement de cuisson, ainsi qu’une sous-pente avec jambette et inclinaison.` },
      { t: "Meubles", d: "Faites glisser éléments bas, colonnes, éléments hauts, îlot et modules d’appareils contre le mur – sur une trame de 60 cm (UE) ou de 55 cm selon la norme suisse SMS." },
      { t: "Matériaux", d: "Choisissez façades, couleurs, plan de travail et chant ; la vue 3D montre l’effet dans la pièce." },
      { t: "Vérifier", d: `Le planificateur vérifie les passages (${A1} cm pour une personne, ${A2} cm pour deux), le triangle d’activité, la hauteur de travail selon votre taille, la distance de la hotte et les collisions avec les portes et la sous-pente. Chaque valeur indicative cite sa source ; les hypothèses de conception sans source sont signalées comme telles.` },
      { t: "Résultat", d: "Nomenclature, plan coté et élévations en version imprimable ou en PDF ; comparez deux variantes côte à côte et partagez le projet par lien." },
    ],
    studioTitle: "Du plan en ligne à la cuisine de Lochau",
    studioText: "Le plan en ligne est un début. Au studio de Lochau, Harald Menghin poursuit le dessin de votre cuisine à la main : circulations, triangle d’activité, rangements et lumière. Nous la concevons ensuite en 3D avec des cotes et raccordements exacts, et vous comparez façades, plans de travail et surfaces sur échantillons lors du rendez-vous. Nous intégrons dès le départ les appareils encastrables de Gaggenau, Miele, V-ZUG, BORA, Liebherr et Quooker.",
    links: [
      { key: "studio", label: "Conception de cuisine au studio de Lochau", href: "/kuechen-vorarlberg" },
      { key: "geraete", label: "Les appareils encastrables que nous intégrons", href: "/kuechengeraete" },
      { key: "termin", label: "Prendre rendez-vous au studio", href: "/beratung" },
    ],
    faqTitle: "Questions fréquentes sur le planificateur de cuisine",
    faq: [
      { q: "Faut-il s’inscrire pour utiliser le planificateur de cuisine ?", a: "Non. Le planificateur fonctionne dans le navigateur, sans inscription ni installation. Le projet est calculé uniquement dans votre navigateur." },
      { q: "Puis-je concevoir une cuisine sous pente ?", a: "Oui. À l’étape « Pièce », vous définissez pour un mur la hauteur de la jambette et l’inclinaison de la pente. Si une colonne ou un élément haut empiète sur la pente, la vérification signale une collision." },
      { q: "Quelle est la précision du projet en ligne ?", a: "Le planificateur calcule avec des cotes de trame et des valeurs indicatives tirées de documents de fabricants et de sources spécialisées. Il ne remplace pas un relevé : nous vérifions murs, raccordements et niches d’appareils sur place avant toute commande." },
      { q: "Que se passe-t-il après le projet en ligne ?", a: "Envoyez-nous le lien de votre projet ou apportez la version imprimable au rendez-vous. Au studio de Lochau, Harald Menghin poursuit le dessin de votre cuisine à la main ; suivent la conception en 3D, le choix des matériaux sur échantillons et, sur demande, la livraison et le montage." },
    ],
  },
  crumbs: { overview: null },
};

const IT = {
  meta: {
    title: "Configuratore cucina 3D online",
    description: "Progettate la vostra cucina online in 3D: stanza in mansarda, moduli con drag & drop, verifica ergonomica e distinta. Poi disegno a mano a Lochau.",
    ogTitle: "Configuratore di cucine 3D",
    imageAlt: "Configuratore di cucine: cucina a L in pianta con moduli e misure",
    appName: "Configuratore di cucine",
    browser: "Browser aggiornato con JavaScript",
    features: [
      "Forme lineare, a L, a U, parallela, con isola e con penisola, oppure forma libera della stanza",
      "Finestre, porte, allacciamenti e soffitto inclinato",
      "Moduli con drag & drop su modulo da 60 cm o da 55 cm (SMS)",
      "Frontali, colori e piani di lavoro nella vista 3D",
      "Verifica di passaggi, triangolo di lavoro, altezza di lavoro e collisioni, con fonti",
      "Distinta, versione stampabile in PDF, confronto tra varianti e link di condivisione",
    ],
  },
  header: {
    eyebrow: "Configuratore di cucine",
    title: "La vostra cucina, progettata in 3D.",
    lead: "Disegnate la stanza, trascinate i moduli sulla parete, scegliete i materiali – il configuratore verifica distanze e passaggi.",
    leadMore: "La progettazione di dettaglio la facciamo di persona con voi.",
    hand: "Iniziate online – poi Harald Menghin disegna il vostro concept a mano.",
  },
  bridge: {
    label: "Dal disegno a mano al rendering",
    text: "Iniziate online – poi Harald Menghin disegna il vostro concept a mano. Solo dopo progettiamo in 3D e vi mostriamo lo spazio in modo fotorealistico.",
    arbeitsweise: "Come lavoriamo",
    licht: "Vedere la luce nella vostra cucina",
    studio: "Progettazione cucina in studio",
  },
  notes: {
    priceShown: "La fascia di prezzo è un valore indicativo non vincolante e non un’offerta.",
    priceHidden: "Il configuratore non mostra prezzi. Un prezzo indicativo ve lo comunichiamo di persona dopo consulenza e rilievo in loco.",
    line: "«Cucina italiana di fascia alta» descrive solo un indirizzo stilistico e non è un progetto né un prezzo di un produttore. I valori ergonomici sono indicativi e con fonte; le misure degli apparecchi senza fonte del produttore sono contrassegnate come mancanti.",
    local: "Il progetto viene calcolato solo nel vostro browser.",
    liveBefore: "Solo quando inviate «Richiedere la progettazione» trasmettiamo i vostri dati – si veda la nostra",
    privacy: "informativa sulla privacy",
    test: "Il configuratore non invia né salva nulla; i vostri dati non lasciano questo browser. Per progettare con noi condividete il link o fissate un appuntamento.",
    textures: "Immagini dei materiali: texture CC0 di ambientCG o generate nel browser.",
  },
  guide: {
    title: "Come progettare la cucina online",
    intro: "Il configuratore vi guida in cinque fasi dalla forma della stanza alla distinta. Non sostituisce il rilievo in loco, ma vi mostra subito che cosa entra nella vostra stanza e dove lo spazio si stringe.",
    steps: [
      { t: "Stanza", d: `Scegliete una forma – lineare, a L, a U, parallela, lineare con isola o con penisola – oppure disegnate una stanza di forma libera fino a ${MAX_FREE_WALLS} pareti. Inserite finestre, porte, termosifoni, attacco acqua, scarico aria e allacciamento del piano cottura, oltre a un soffitto inclinato con muretto e inclinazione.` },
      { t: "Mobili", d: "Trascinate sulla parete basi, colonne, pensili, isola e moduli per elettrodomestici – su modulo da 60 cm (UE) o da 55 cm secondo la norma svizzera SMS." },
      { t: "Materiali", d: "Scegliete frontali, colori, piano di lavoro e bordo; la vista 3D mostra l’effetto nello spazio." },
      { t: "Verifica", d: `Il configuratore verifica i passaggi (${A1} cm per una persona, ${A2} cm per due), il triangolo di lavoro, l’altezza di lavoro in base alla statura, la distanza della cappa e le collisioni con porte e soffitto inclinato. Ogni valore indicativo cita la sua fonte; le ipotesi progettuali senza fonte sono contrassegnate come tali.` },
      { t: "Risultato", d: "Distinta, pianta quotata e prospetti in versione stampabile o PDF; confrontate due varianti affiancate e condividete il progetto con un link." },
    ],
    studioTitle: "Dal progetto online alla cucina da Lochau",
    studioText: "Il progetto online è un inizio. Nello studio di Lochau, Harald Menghin continua a disegnare la vostra cucina a mano: percorsi, triangolo di lavoro, contenimento e luce. Poi la progettiamo in 3D con misure e allacciamenti esatti, e all’appuntamento confrontate frontali, piani di lavoro e superfici su campioni. Gli elettrodomestici da incasso di Gaggenau, Miele, V-ZUG, BORA, Liebherr e Quooker li prevediamo fin dall’inizio.",
    links: [
      { key: "studio", label: "Progettazione cucina nello studio di Lochau", href: "/kuechen-vorarlberg" },
      { key: "geraete", label: "Gli elettrodomestici da incasso che prevediamo", href: "/kuechengeraete" },
      { key: "termin", label: "Fissare un appuntamento in studio", href: "/beratung" },
    ],
    faqTitle: "Domande frequenti sul configuratore di cucine",
    faq: [
      { q: "Serve una registrazione per usare il configuratore di cucine?", a: "No. Il configuratore funziona nel browser, senza registrazione e senza installazione. Il progetto viene calcolato solo nel vostro browser." },
      { q: "Posso progettare una cucina in mansarda?", a: "Sì. Nella fase «Stanza» stabilite per una parete l’altezza del muretto e l’inclinazione del soffitto. Se una colonna o un pensile sporge nell’inclinazione, la verifica segnala una collisione." },
      { q: "Quanto è preciso il progetto online?", a: "Il configuratore calcola con misure modulari e valori indicativi tratti da documentazione dei produttori e fonti specialistiche. Non sostituisce il rilievo: pareti, allacciamenti e nicchie degli elettrodomestici li verifichiamo in loco prima di ordinare." },
      { q: "Che cosa succede dopo il progetto online?", a: "Inviateci il link al vostro progetto o portate la versione stampabile all’appuntamento. Nello studio di Lochau, Harald Menghin continua a disegnare la vostra cucina a mano; seguono la progettazione in 3D, la scelta dei materiali su campioni e, su richiesta, consegna e montaggio." },
    ],
  },
  crumbs: { overview: null },
};

const COPY = { de: DE, en: EN, fr: frenchTypography(FR), it: IT };

/** Seitentexte einer Sprache, sonst null (→ notFound). */
export function kpPageCopy(locale) {
  return COPY[locale] || null;
}
