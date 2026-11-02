// src/lib/content/landingKern/outdoorKueche.js – EN/FR/IT der Seite
// /<locale>/outdoor-kueche. Mastertext: CONTENT in
// src/app/[locale]/outdoor-kueche/page.js (Deutsch, bleibt dort).
// Nur Texte – Bilder, Thema und Linkziele kommen aus der deutschen Fassung
// (mergeText in ./index.js, gleiche Reihenfolge der Listen).
// Regeln wie im Deutschen: markenneutral (kein Outdoor-Küchen-Hersteller im
// Katalog), Liebherr nur als Gerät ohne Händlerwort, keine Preise, keine
// Lieferfrist, Lieferung „auf Wunsch“, Schweiz mit Ausfuhr und Verzollung,
// Anschlüsse durch befugte Installateure und Elektriker (wie ./outdoor.js),
// kein Showroom-Versprechen für Outdoor-Küchen (Muster im Termin).

export const META = {
  en: {
    title: "Outdoor kitchens in Vorarlberg",
    description:
      "Outdoor kitchens made to measure, drawn by hand in Lochau, Lake Constance: grill, hob, sink and cooling for garden and terrace. Delivery on request.",
    og: { eyebrow: "Outdoor kitchen", title: "Outdoor kitchens on Lake Constance" },
  },
  fr: {
    title: "Cuisine d’extérieur au Vorarlberg",
    description:
      "Cuisines d’extérieur sur mesure, dessinées à la main à Lochau : grill, plaque, évier et froid pour jardin et terrasse. Livraison et pose sur demande.",
    og: { eyebrow: "Cuisine d’extérieur", title: "Cuisines d’extérieur au lac de Constance" },
  },
  it: {
    title: "Cucine outdoor in Vorarlberg",
    description:
      "Cucine outdoor su misura, disegnate a mano a Lochau: grill, piano cottura, lavello e frigorifero per giardino e terrazza. Consegna su richiesta.",
    og: { eyebrow: "Cucina outdoor", title: "Cucine outdoor sul Lago di Costanza" },
  },
};

const LIEBHERR_ALT = {
  en: "Wooden outdoor kitchen on a roof terrace with an open Liebherr outdoor refrigerator",
  fr: "Cuisine d’extérieur en bois sur un toit-terrasse avec un réfrigérateur d’extérieur Liebherr ouvert",
  it: "Cucina da esterno in legno su una terrazza sul tetto con un frigorifero da esterno Liebherr aperto",
};
const LIEBHERR_SRC = "/Images/Wellness/produkte/liebherr/liebherr-outdoor-kuehlschrank-2.webp";

const EN = {
  processText:
    "Harald Menghin first draws your outdoor kitchen by hand: position in relation to the house, routes to the indoor kitchen, worktops, sun and wind. Then we plan it in 3D with exact dimensions and connections, and you see carcass, worktop and appliances as a rendering before anything is ordered.",
  banner: {
    title: "Outdoor kitchen planning: made-to-measure outdoor kitchens on Lake Constance",
    lead: "Cooking in the garden and on the terrace – planned in Lochau, tailored to your plot, your guests and the weather by the lake.",
    alt: "Wooden outdoor kitchen on a roof terrace with an open outdoor refrigerator",
    crumb: "Outdoor kitchen",
    trail: [{ label: "Outdoor & pool" }],
  },
  intro: {
    eyebrow: "Outdoor kitchens from Lochau",
    heading: "Garden kitchen, outdoor kitchen, open-air kitchen: cooking under the open sky",
    paragraphs: [
      "An outdoor kitchen turns the terrace into a second dining room: grill, hob, sink and cooling right where you spend the summer anyway. At Platzhirsch Home Living in Lochau we plan outdoor kitchens made to measure – with materials that cope with rain, sun and frost, and with a plan that fits house, garden and indoor kitchen.",
      "Whether a garden kitchen in Vorarlberg, a roof terrace on Lake Constance or a lakeside plot in Switzerland: we accompany you from the first hand drawing to the installed kitchen and coordinate the connections with the specialist firms you commission.",
    ],
    benefits: [
      "Outdoor kitchen drawn by hand, then planned in 3D",
      "Compare outdoor materials and surfaces at your appointment using samples",
      "Grill, hob, sink and cooling planned in from the start",
      "Delivery and installation on request, in Switzerland with export and customs clearance",
    ],
    imageAlt: LIEBHERR_ALT.en,
  },
  steps: {
    eyebrow: "How your outdoor kitchen comes about",
    heading: "From the hand drawing to the first barbecue evening",
    items: [
      { title: "Consultation in Lochau", text: "We get to know your plot and your habits: how many guests, how often, where is the sun in the evening? You also compare outdoor materials using samples." },
      { title: "Drawn by hand", text: "Harald Menghin first draws your outdoor kitchen by hand: position, worktops, routes to the indoor kitchen, sun and wind. Then we plan it in 3D with exact dimensions and connections." },
      { title: "Materials & appliances", text: "Together you choose carcass, worktop and fronts for outdoor use as well as grill, hob, sink and cooling – down to the storage for crockery and the gas bottle." },
      { title: "Connections & installation", text: "Water, power and gas are laid by licensed installers and electricians you commission; we coordinate the dates and take care of delivery and installation of the kitchen." },
    ],
    links: [
      { label: "How we work in detail" },
      { label: "Kitchen planner: prepare units and dimensions online" },
      { label: "Outdoor planning: terrace, shade and light" },
      { label: "Winter service for outdoor furniture" },
      { label: "See the position of the sun on your terrace" },
      { label: "Liebherr outdoor refrigerator in the catalogue" },
    ],
  },
  gallery: [],
  showroom: {
    heading: "Planning outdoor kitchens on Lake Constance",
    text: "Just a few minutes from Bregenz we show furniture and lights by international design brands. For your outdoor kitchen we recommend booking an appointment – then we take time and have samples of worktops, fronts and outdoor surfaces ready.",
  },
  cta: {
    heading: "Let’s plan your outdoor kitchen",
    text: "Arrange a no-obligation consultation in Lochau – or prepare units and dimensions in the kitchen planner.",
  },
  faq: {
    heading: "Questions about outdoor kitchens",
    items: [
      { q: "How does planning an outdoor kitchen at Platzhirsch work?", a: "After a first conversation, Harald Menghin draws your outdoor kitchen by hand: position in relation to the house, worktops, routes to the indoor kitchen, sun and wind. Then we plan it in 3D with exact dimensions and connections. After that you choose materials and appliances, and finally we coordinate delivery and installation." },
      { q: "Which materials are suitable for an outdoor kitchen?", a: "Outdoors, rain, sun, temperature changes and frost matter. Stainless steel, ceramic and natural stone are common for worktops, powder-coated aluminium, stainless steel or teak for carcass and fronts. Which combination suits your location by the lake, in the sun or in the wind is something we settle in the consultation; we follow the manufacturers’ information on outdoor suitability." },
      { q: "Which appliances belong in an outdoor kitchen?", a: "Usually a grill, plus hob, sink and cooling depending on use – for example an integrated outdoor refrigerator by Liebherr. We plan in grill and appliances from the start so that dimensions, storage and connections fit together. Water, power and gas are laid by licensed installers and electricians." },
      { q: "Can I pre-plan my outdoor kitchen online first?", a: "Yes. The kitchen planner at platzhirsch.studio/en/kuechenplaner is built for indoor kitchens, but it is well suited to preparing the length, units and workflows of your outdoor kitchen. If you then plan with us, Harald Menghin continues the outdoor kitchen by hand, and we check dimensions and connections on site." },
      { q: "Do you deliver outdoor kitchens to Germany and Switzerland?", a: "Delivery and installation are available on request: on Lake Constance, in the border triangle and further afield on enquiry. For Switzerland, export and customs clearance are added; we go through the process with you before you buy." },
      { q: "What happens to the outdoor kitchen in winter?", a: "An outdoor kitchen made of weather-resistant materials stays outside. Before the frost, water pipes are drained, appliances are prepared according to the manufacturer’s instructions and the kitchen is covered; the details are part of your plan. For outdoor furniture, cushions and parasols we offer a winter service with collection, care and storage." },
    ],
  },
  imageAlts: { [LIEBHERR_SRC]: LIEBHERR_ALT.en },
};

const FR = {
  processText:
    "Harald Menghin dessine d’abord votre cuisine d’extérieur à la main : position par rapport à la maison, circulations vers la cuisine intérieure, plans de travail, soleil et vent. Ensuite, nous la planifions en 3D avec des cotes et des raccordements exacts, et vous voyez caisson, plan de travail et appareils en rendu avant toute commande.",
  banner: {
    title: "Concevoir une cuisine d’extérieur : cuisines d’extérieur sur mesure au lac de Constance",
    lead: "Cuisiner au jardin et sur la terrasse – conçu à Lochau, adapté à votre terrain, à vos invités et au climat du lac.",
    alt: "Cuisine d’extérieur en bois sur un toit-terrasse avec un réfrigérateur d’extérieur ouvert",
    crumb: "Cuisine d’extérieur",
    trail: [{ label: "Extérieur & piscine" }],
  },
  intro: {
    eyebrow: "Cuisines d’extérieur de Lochau",
    heading: "Cuisine de jardin, cuisine d’extérieur, cuisine en plein air : cuisiner à ciel ouvert",
    paragraphs: [
      "Une cuisine d’extérieur fait de la terrasse une seconde salle à manger : grill, plaque de cuisson, évier et froid là où vous passez de toute façon l’été. Chez Platzhirsch Home Living à Lochau, nous concevons des cuisines d’extérieur sur mesure – avec des matériaux qui supportent pluie, soleil et gel, et une planification qui s’accorde à la maison, au jardin et à la cuisine intérieure.",
      "Cuisine de jardin au Vorarlberg, toit-terrasse au lac de Constance ou terrain au bord du lac en Suisse : nous vous accompagnons du premier dessin à la main jusqu’à la cuisine posée et coordonnons les raccordements avec les entreprises spécialisées que vous mandatez.",
    ],
    benefits: [
      "Cuisine d’extérieur dessinée à la main, puis planifiée en 3D",
      "Comparer matériaux et surfaces pour l’extérieur lors du rendez-vous, à l’aide d’échantillons",
      "Grill, plaque de cuisson, évier et froid prévus dès le départ",
      "Livraison et pose sur demande, en Suisse avec exportation et dédouanement",
    ],
    imageAlt: LIEBHERR_ALT.fr,
  },
  steps: {
    eyebrow: "Comment naît votre cuisine d’extérieur",
    heading: "Du dessin à la main à la première soirée barbecue",
    items: [
      { title: "Conseil à Lochau", text: "Nous apprenons à connaître votre terrain et vos habitudes : combien d’invités, à quelle fréquence, où est le soleil le soir ? Vous comparez aussi les matériaux pour l’extérieur à l’aide d’échantillons." },
      { title: "Dessinée à la main", text: "Harald Menghin dessine d’abord votre cuisine d’extérieur à la main : position, plans de travail, circulations vers la cuisine intérieure, soleil et vent. Ensuite, nous la planifions en 3D avec des cotes et des raccordements exacts." },
      { title: "Matériaux et appareils", text: "Ensemble, vous choisissez caisson, plan de travail et façades pour l’extérieur ainsi que grill, plaque de cuisson, évier et froid – jusqu’au rangement pour la vaisselle et la bouteille de gaz." },
      { title: "Raccordements et pose", text: "L’eau, l’électricité et le gaz sont raccordés par des installateurs et électriciens habilités que vous mandatez ; nous coordonnons les dates et assurons la livraison et la pose de la cuisine." },
    ],
    links: [
      { label: "Notre méthode en détail" },
      { label: "Planificateur de cuisine : préparer linéaires et cotes en ligne" },
      { label: "Aménagement extérieur : terrasse, ombrage et lumière" },
      { label: "Hivernage du mobilier d’extérieur" },
      { label: "Voir la course du soleil sur votre terrasse" },
      { label: "Réfrigérateur d’extérieur Liebherr dans le catalogue" },
    ],
  },
  gallery: [],
  showroom: {
    heading: "Concevoir sa cuisine d’extérieur au lac de Constance",
    text: "À quelques minutes de Bregenz, nous présentons des meubles et des luminaires de marques de design internationales. Pour votre cuisine d’extérieur, nous vous recommandons de prendre rendez-vous – nous prenons alors le temps nécessaire et préparons des échantillons de plans de travail, de façades et de surfaces pour l’extérieur.",
  },
  cta: {
    heading: "Concevons votre cuisine d’extérieur",
    text: "Prenez un rendez-vous de conseil sans engagement à Lochau – ou préparez linéaires et cotes dans le planificateur de cuisine.",
  },
  faq: {
    heading: "Questions sur la cuisine d’extérieur",
    items: [
      { q: "Comment se déroule la conception d’une cuisine d’extérieur chez Platzhirsch ?", a: "Après un premier échange, Harald Menghin dessine votre cuisine d’extérieur à la main : position par rapport à la maison, plans de travail, circulations vers la cuisine intérieure, soleil et vent. Ensuite, nous la planifions en 3D avec des cotes et des raccordements exacts. Vous choisissez alors matériaux et appareils, et pour finir nous coordonnons la livraison et la pose." },
      { q: "Quels matériaux conviennent à une cuisine d’extérieur ?", a: "Dehors comptent la pluie, le soleil, les variations de température et le gel. Pour les plans de travail, on utilise couramment l’acier inoxydable, la céramique et la pierre naturelle ; pour le caisson et les façades, l’aluminium thermolaqué, l’acier inoxydable ou le teck. La combinaison adaptée à votre emplacement au bord du lac, au soleil ou au vent se décide lors du conseil ; nous suivons les indications des fabricants sur l’aptitude à l’extérieur." },
      { q: "Quels appareils trouve-t-on dans une cuisine d’extérieur ?", a: "Le plus souvent un grill, puis selon l’usage une plaque de cuisson, un évier et du froid – par exemple un réfrigérateur d’extérieur intégrable Liebherr. Nous prévoyons grill et appareils dès le départ, pour que cotes, rangements et raccordements s’accordent. L’eau, l’électricité et le gaz sont raccordés par des installateurs et électriciens habilités." },
      { q: "Puis-je d’abord préparer ma cuisine d’extérieur en ligne ?", a: "Oui. Le planificateur de cuisine sur platzhirsch.studio/fr/kuechenplaner est conçu pour les cuisines intérieures, mais il convient bien pour préparer la longueur, les linéaires et les usages de votre cuisine d’extérieur. Si vous poursuivez ensuite avec nous, Harald Menghin reprend la cuisine d’extérieur à la main, et nous vérifions cotes et raccordements sur place." },
      { q: "Livrez-vous des cuisines d’extérieur en Allemagne et en Suisse ?", a: "La livraison et la pose sont possibles sur demande : au lac de Constance, dans la région des trois frontières et au-delà sur demande. Pour la Suisse s’ajoutent l’exportation et le dédouanement ; nous passons en revue le déroulement avec vous avant l’achat." },
      { q: "Que devient la cuisine d’extérieur en hiver ?", a: "Une cuisine d’extérieur en matériaux résistants aux intempéries reste dehors. Avant le gel, on vidange les conduites d’eau, on prépare les appareils selon les indications du fabricant et on couvre la cuisine ; les détails font partie de votre planification. Pour le mobilier d’extérieur, les coussins et les parasols, nous proposons un service d’hivernage avec enlèvement, entretien et stockage." },
    ],
  },
  imageAlts: { [LIEBHERR_SRC]: LIEBHERR_ALT.fr },
};

const IT = {
  processText:
    "Harald Menghin disegna prima la vostra cucina outdoor a mano: posizione rispetto alla casa, percorsi verso la cucina interna, piani di lavoro, sole e vento. Poi la progettiamo in 3D con misure e allacciamenti esatti, e vedete struttura, piano di lavoro ed elettrodomestici in un rendering prima di ordinare qualsiasi cosa.",
  banner: {
    title: "Progettare la cucina outdoor: cucine da esterno su misura sul Lago di Costanza",
    lead: "Cucinare in giardino e in terrazza – progettata a Lochau, su misura del vostro terreno, dei vostri ospiti e del clima del lago.",
    alt: "Cucina da esterno in legno su una terrazza sul tetto con un frigorifero da esterno aperto",
    crumb: "Cucina outdoor",
    trail: [{ label: "Outdoor & piscina" }],
  },
  intro: {
    eyebrow: "Cucine outdoor da Lochau",
    heading: "Cucina da giardino, cucina da esterno, cucina outdoor: la cucina a cielo aperto",
    paragraphs: [
      "Una cucina outdoor trasforma la terrazza in una seconda sala da pranzo: grill, piano cottura, lavello e frigorifero là dove d’estate passate comunque il tempo. Da Platzhirsch Home Living a Lochau progettiamo cucine da esterno su misura – con materiali che sopportano pioggia, sole e gelo, e con un progetto adatto a casa, giardino e cucina interna.",
      "Cucina da giardino in Vorarlberg, terrazza sul tetto sul Lago di Costanza o terreno sul lago in Svizzera: vi accompagniamo dal primo disegno a mano alla cucina montata e coordiniamo gli allacciamenti con le imprese specializzate che incaricate.",
    ],
    benefits: [
      "Cucina outdoor disegnata a mano, poi progettata in 3D",
      "Confrontare all’appuntamento materiali e superfici per l’esterno sui campioni",
      "Grill, piano cottura, lavello e frigorifero previsti fin dall’inizio",
      "Consegna e montaggio su richiesta, in Svizzera con esportazione e sdoganamento",
    ],
    imageAlt: LIEBHERR_ALT.it,
  },
  steps: {
    eyebrow: "Come nasce la vostra cucina outdoor",
    heading: "Dal disegno a mano alla prima grigliata",
    items: [
      { title: "Consulenza a Lochau", text: "Conosciamo il vostro terreno e le vostre abitudini: quanti ospiti, quanto spesso, dov’è il sole la sera? Inoltre confrontate i materiali per l’esterno sui campioni." },
      { title: "Disegnata a mano", text: "Harald Menghin disegna prima la vostra cucina da esterno a mano: posizione, piani di lavoro, percorsi verso la cucina interna, sole e vento. Poi la progettiamo in 3D con misure e allacciamenti esatti." },
      { title: "Materiali ed elettrodomestici", text: "Insieme scegliete struttura, piano di lavoro e ante per l’esterno, oltre a grill, piano cottura, lavello e frigorifero – fino allo spazio per stoviglie e bombola del gas." },
      { title: "Allacciamenti e montaggio", text: "Acqua, corrente e gas sono allacciati da installatori ed elettricisti abilitati che incaricate voi; noi coordiniamo le date e curiamo consegna e montaggio della cucina." },
    ],
    links: [
      { label: "Il nostro metodo nel dettaglio" },
      { label: "Planner cucina: preparare composizioni e misure online" },
      { label: "Progettazione outdoor: terrazza, ombreggiatura e luce" },
      { label: "Rimessaggio invernale per arredi da esterno" },
      { label: "Guardate la posizione del sole sulla vostra terrazza" },
      { label: "Frigorifero da esterno Liebherr nel catalogo" },
    ],
  },
  gallery: [],
  showroom: {
    heading: "Progettare la cucina outdoor sul Lago di Costanza",
    text: "A pochi minuti da Bregenz presentiamo arredi e lampade di marchi di design internazionali. Per la vostra cucina outdoor conviene fissare un appuntamento – così ci prendiamo il tempo necessario e prepariamo campioni di piani di lavoro, ante e superfici per l’esterno.",
  },
  cta: {
    heading: "Progettiamo la vostra cucina outdoor",
    text: "Fissate un appuntamento di consulenza senza impegno a Lochau – oppure preparate composizioni e misure nel planner cucina.",
  },
  faq: {
    heading: "Domande sulla cucina outdoor",
    items: [
      { q: "Come si svolge la progettazione di una cucina outdoor da Platzhirsch?", a: "Dopo un primo colloquio Harald Menghin disegna la vostra cucina da esterno a mano: posizione rispetto alla casa, piani di lavoro, percorsi verso la cucina interna, sole e vento. Poi la progettiamo in 3D con misure e allacciamenti esatti. Quindi scegliete materiali ed elettrodomestici, infine coordiniamo consegna e montaggio." },
      { q: "Quali materiali sono adatti a una cucina da esterno?", a: "All’aperto contano pioggia, sole, sbalzi di temperatura e gelo. Per i piani di lavoro sono comuni acciaio inox, ceramica e pietra naturale, per struttura e ante alluminio verniciato a polvere, acciaio inox o teak. Quale combinazione si adatta alla vostra posizione sul lago, al sole o al vento lo chiariamo durante la consulenza; seguiamo le indicazioni dei produttori sull’idoneità all’esterno." },
      { q: "Quali elettrodomestici servono in una cucina outdoor?", a: "Di solito un grill, poi a seconda dell’uso piano cottura, lavello e frigorifero – per esempio un frigorifero da esterno da incasso Liebherr. Grill ed elettrodomestici li prevediamo fin dall’inizio, perché misure, spazio e allacciamenti siano coerenti. Acqua, corrente e gas sono allacciati da installatori ed elettricisti abilitati." },
      { q: "Posso preparare prima la cucina outdoor online?", a: "Sì. Il planner cucina su platzhirsch.studio/it/kuechenplaner è pensato per cucine interne, ma si presta bene a preparare lunghezza, composizioni e flussi della vostra cucina da esterno. Se poi progettate con noi, Harald Menghin prosegue la cucina outdoor a mano, e verifichiamo misure e allacciamenti sul posto." },
      { q: "Consegnate cucine outdoor anche in Germania e in Svizzera?", a: "Consegna e montaggio sono disponibili su richiesta: sul Lago di Costanza, nella regione dei tre confini e oltre su richiesta. Per la Svizzera si aggiungono esportazione e sdoganamento; esaminiamo con voi la procedura prima dell’acquisto." },
      { q: "Cosa succede alla cucina outdoor in inverno?", a: "Una cucina da esterno in materiali resistenti alle intemperie resta fuori. Prima del gelo si svuotano le tubazioni dell’acqua, si preparano gli elettrodomestici secondo le indicazioni del produttore e si copre la cucina; i dettagli fanno parte del vostro progetto. Per arredi da esterno, cuscini e ombrelloni offriamo un servizio di rimessaggio invernale con ritiro, cura e deposito." },
    ],
  },
  imageAlts: { [LIEBHERR_SRC]: LIEBHERR_ALT.it },
};

export const INTL = { en: EN, fr: FR, it: IT };
