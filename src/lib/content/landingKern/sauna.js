// src/lib/content/landingKern/sauna.js – EN/FR/IT der Seite /<locale>/sauna-kaufen.
// Mastertext: CONTENT in src/app/[locale]/sauna-kaufen/page.js (Deutsch, bleibt dort).
// Nur Texte – Bilder, Thema und Linkziele kommen aus der deutschen Fassung
// (mergeText in ./index.js, gleiche Reihenfolge der Listen).
// Regeln wie im Deutschen: kein Händlerwort (Claim-Guard), Fakten nur aus dem
// Katalog (Starpool Saunen/Nature Sauna/Infrarot/Dampfbad, Soleum ELLIPSE und
// Liegen, Fabio Alemanno Liegen), keine Wirkversprechen, kein Preis, keine
// Lieferfrist, Lieferung „auf Wunsch/auf Anfrage“, Schweiz: Ausfuhr und Verzollung.

export const META = {
  en: {
    title: "Buy a sauna in Vorarlberg",
    description:
      "Sauna for the home, outdoor sauna or infrared cabin with Starpool, drawn by hand and planned in 3D in Lochau on Lake Constance. Delivery on request.",
    og: { eyebrow: "Sauna · Private spa", title: "Saunas in Vorarlberg" },
  },
  fr: {
    title: "Acheter un sauna au Vorarlberg",
    description:
      "Sauna pour la maison, sauna d’extérieur ou cabine infrarouge avec Starpool, dessiné à la main et planifié en 3D à Lochau. Livraison sur demande.",
    og: { eyebrow: "Sauna · Spa privé", title: "Saunas au Vorarlberg" },
  },
  it: {
    title: "Acquistare una sauna in Vorarlberg",
    description:
      "Sauna per la casa, sauna da esterno o cabina a infrarossi con Starpool, disegnata a mano e progettata in 3D a Lochau. Consegna su richiesta.",
    og: { eyebrow: "Sauna · Spa privata", title: "Saune in Vorarlberg" },
  },
};

const EN = {
  processText:
    "Harald Menghin first draws your sauna room by hand: cabin, rest area, shower, routes and light. Then we plan in 3D with exact dimensions and connections, and you see wood, glass and light as a rendering before anything is ordered.",
  banner: {
    title: "Buy a sauna in Vorarlberg: a sauna for the home, planned on Lake Constance",
    lead: "Saunas for house and garden – drawn by hand in Lochau, for Vorarlberg, the German shore of Lake Constance and Switzerland.",
    alt: "Starpool Classic Sauna: light wood cabin with panoramic window and round sauna stove",
    crumb: "Buy a sauna",
  },
  facts: [
    { label: "Austria", value: "Delivery and installation on request, coordinated with electrician and plumber" },
    { label: "Germany", value: "No customs – Austria and Germany are both in the EU single market; delivery on request" },
    { label: "Switzerland", value: "Delivery on request; export and customs clearance are added – we explain the steps" },
  ],
  intro: {
    eyebrow: "Sauna · Vorarlberg · Lake Constance",
    heading: "A sauna that fits house and garden",
    paragraphs: [
      "A sauna at home is a room of its own: cabin, rest area, shower and light have to fit together, plus ventilation and power. At Platzhirsch Home Living in Lochau we therefore plan the sauna like any other room – first by hand, then in 3D – and coordinate delivery and installation with electrician and plumber. The cabin is made by the manufacturer.",
      "We plan with saunas by Starpool from Ziano di Fiemme in Trentino: Finnish saunas in several collections for indoors, the Nature Sauna for garden and terrace – with either an electric stove or a wood-burning stove with chimney – plus infrared cabins, steam rooms and Ice Bath. For the rest area there are heated loungers by Soleum from Pregarten in Upper Austria and by Fabio Alemanno; Soleum also makes ELLIPSE, a steam room for outdoors.",
    ],
    benefits: [
      "Sauna room drawn by hand, then planned in 3D",
      "Starpool: Finnish saunas, Nature Sauna outdoor sauna, infrared cabins and steam rooms",
      "Sauna, rest area and living area planned by one team",
      "Delivery and installation on request, coordinated with electrician and plumber",
    ],
    imageAlt: "Starpool Nature Sauna personal: dark outdoor sauna on a terrace",
  },
  steps: {
    eyebrow: "How your sauna comes about",
    heading: "From the first idea to installation",
    items: [
      { title: "Consultation in Lochau", text: "We talk about use, space and placement – in the house or in the garden – and compare sauna, infrared cabin and steam room as well as woods and glass using manufacturer documents and samples." },
      { title: "Drawn by hand", text: "Harald Menghin first draws your sauna room by hand: cabin, rest area, shower, routes and light. Then we plan it in 3D with exact dimensions." },
      { title: "Technology & trades", text: "Power supply, ventilation, water for the shower and, for outdoor saunas, foundation and chimney go into the plan, and we coordinate them with electrician, plumber and manufacturer. What your room needs is settled at the appointment." },
      { title: "Delivery & installation", text: "The cabin comes from the manufacturer; we coordinate delivery and installation on request – in Germany and Switzerland on enquiry. For Switzerland, export and customs clearance are added." },
    ],
    links: [
      { label: "How we work in detail" },
      { label: "All saunas in the catalogue" },
      { label: "Starpool: saunas, steam rooms and infrared" },
      { label: "Soleum: steam room and heated loungers" },
      { label: "Bath & wellness: all brands" },
      { label: "Ezarri glass mosaic for the wellness area" },
      { label: "Buying from Switzerland: export and customs clearance" },
      { label: "Care service for furniture and upholstery" },
    ],
  },
  gallery: [
    { alt: "Starpool Glamour Sauna: cabin in black-waxed fir with bench and stove" },
    { alt: "Starpool Shade Sauna: sauna with wooden slat screens in a living room" },
    { alt: "Starpool Nature Soft Sauna: dark outdoor cabin with glass front in a garden" },
  ],
  showroom: {
    heading: "Sauna advice on Lake Constance",
    text: "Just a few minutes from Bregenz we show furniture and lights by international design brands. Saunas we discuss at your appointment using manufacturer documents, wood and glass samples and plans, and we show you your room in 3D. When you book, we tell you whether any cabins are currently on view, and which ones.",
  },
  cta: {
    heading: "Let’s plan your sauna",
    text: "Arrange a no-obligation consultation in Lochau – or write to us where the sauna is to go.",
  },
  faq: {
    heading: "Questions about buying a sauna",
    items: [
      { q: "How does sauna planning at Platzhirsch work?", a: "In a first conversation we settle use, space and placement. Harald Menghin draws your sauna room by hand, then we plan in 3D with dimensions, ventilation and connections. You choose cabin, woods, glass and stove using manufacturer documents and samples. The cabin is made by the manufacturer; we coordinate delivery and installation with the trades." },
      { q: "Sauna in the house: what does the room need?", a: "The cabin needs a level floor, room to open the door and for the stove, ventilation and a power supply; a rest area and a shower nearby complete the room. Basement, bathroom and attic each have their own requirements for ceiling height and moisture protection – what your room needs is settled at the appointment and with the manufacturer." },
      { q: "Outdoor sauna in the garden: what should I consider?", a: "A level, load-bearing foundation, a power supply and, for a wood-burning stove, a chimney. The Starpool Nature Sauna personal comes with either an electric stove or a wood-burning stove with chimney; for the electric stove the manufacturer states 400 V. Your municipality tells you whether a building notification or permit is required." },
      { q: "Who takes care of the electrical connection?", a: "The connection is made by a licensed electrical contractor. The voltage and fusing a stove needs are in the manufacturer’s data for the model. We draw the cable route and the connection point into the plan – the details are agreed at the appointment with the electrician." },
      { q: "Do you also deliver saunas to Germany and Switzerland?", a: "Yes, on request – to Vorarlberg, Germany, Switzerland and Liechtenstein. There are no customs between Austria and Germany. For Switzerland, export and customs clearance are added; we describe the steps at platzhirsch.studio/en/einkaufen-aus-der-schweiz and are happy to go through them with you." },
      { q: "Sauna, infrared cabin or steam room?", a: "A Finnish sauna works with dry heat from the stove, a soft sauna according to the manufacturer with milder heat, an infrared cabin warms with emitters, a steam room with moist heat. Starpool makes all three kinds of cabin, Soleum with ELLIPSE a steam room for outdoors. What suits your room and your use is discussed at the appointment – we do not describe health effects; the manufacturers provide that information." },
    ],
  },
};

const FR = {
  processText:
    "Harald Menghin dessine d’abord votre espace sauna à la main : cabine, espace repos, douche, circulations et lumière. Ensuite, nous planifions en 3D avec des cotes et des raccordements exacts, et vous voyez bois, verre et lumière en rendu avant toute commande.",
  banner: {
    title: "Acheter un sauna au Vorarlberg : un sauna pour la maison, planifié au lac de Constance",
    lead: "Saunas pour la maison et le jardin – dessinés à la main à Lochau, pour le Vorarlberg, la rive allemande du lac de Constance et la Suisse.",
    alt: "Starpool Classic Sauna : cabine en bois clair avec baie panoramique et poêle rond",
    crumb: "Acheter un sauna",
  },
  facts: [
    { label: "Autriche", value: "Livraison et montage sur demande, coordonnés avec l’électricien et le plombier" },
    { label: "Allemagne", value: "Pas de douane : l’Autriche et l’Allemagne font partie du marché intérieur de l’UE ; livraison sur demande" },
    { label: "Suisse", value: "Livraison sur demande ; s’ajoutent l’exportation et le dédouanement, dont nous vous expliquons les étapes" },
  ],
  intro: {
    eyebrow: "Sauna · Vorarlberg · Lac de Constance",
    heading: "Un sauna adapté à la maison et au jardin",
    paragraphs: [
      "Un sauna à la maison est une pièce à part entière : cabine, espace repos, douche et lumière doivent s’accorder, avec la ventilation et l’électricité. Chez Platzhirsch Home Living à Lochau, nous planifions donc le sauna comme toute autre pièce – d’abord à la main, puis en 3D – et coordonnons livraison et montage avec l’électricien et le plombier. La cabine est fabriquée chez le fabricant.",
      "Nous planifions avec les saunas de Starpool, de Ziano di Fiemme dans le Trentin : saunas finlandais en plusieurs collections pour l’intérieur, le Nature Sauna pour le jardin et la terrasse – avec poêle électrique ou poêle à bois et cheminée –, ainsi que des cabines infrarouges, des hammams et l’Ice Bath. Pour l’espace repos s’ajoutent des lits chauffants de Soleum, de Pregarten en Haute-Autriche, et de Fabio Alemanno ; Soleum fabrique aussi ELLIPSE, un hammam d’extérieur.",
    ],
    benefits: [
      "Espace sauna dessiné à la main, puis planifié en 3D",
      "Starpool : saunas finlandais, sauna d’extérieur Nature Sauna, cabines infrarouges et hammams",
      "Sauna, espace repos et séjour conçus par un seul interlocuteur",
      "Livraison et montage sur demande, coordonnés avec l’électricien et le plombier",
    ],
    imageAlt: "Starpool Nature Sauna personal : sauna d’extérieur sombre sur une terrasse",
  },
  steps: {
    eyebrow: "Comment naît votre sauna",
    heading: "De la première idée au montage",
    items: [
      { title: "Conseil à Lochau", text: "Nous parlons usage, place et implantation – dans la maison ou au jardin – et comparons sauna, cabine infrarouge et hammam ainsi que bois et verre à l’aide de la documentation des fabricants et d’échantillons." },
      { title: "Dessiné à la main", text: "Harald Menghin dessine d’abord votre espace sauna à la main : cabine, espace repos, douche, circulations et lumière. Ensuite, nous planifions en 3D avec des cotes exactes." },
      { title: "Technique et corps de métier", text: "Alimentation électrique, ventilation, eau pour la douche et, pour les saunas d’extérieur, fondation et cheminée figurent dans le plan, et nous les coordonnons avec l’électricien, le plombier et le fabricant. Ce dont votre pièce a besoin se règle lors du rendez-vous." },
      { title: "Livraison et montage", text: "La cabine vient du fabricant ; nous coordonnons livraison et montage sur demande – en Allemagne et en Suisse sur demande également. Pour la Suisse s’ajoutent l’exportation et le dédouanement." },
    ],
    links: [
      { label: "Notre méthode en détail" },
      { label: "Tous les saunas au catalogue" },
      { label: "Starpool : saunas, hammams et infrarouge" },
      { label: "Soleum : hammam et lits chauffants" },
      { label: "Salle de bain et bien-être : toutes les marques" },
      { label: "Mosaïque de verre Ezarri pour l’espace bien-être" },
      { label: "Acheter depuis la Suisse : exportation et dédouanement" },
      { label: "Service d’entretien pour meubles et revêtements" },
    ],
  },
  gallery: [
    { alt: "Starpool Glamour Sauna : cabine en sapin ciré noir avec banc et poêle" },
    { alt: "Starpool Shade Sauna : sauna à panneaux de lattes en bois dans un salon" },
    { alt: "Starpool Nature Soft Sauna : cabine extérieure sombre à façade vitrée dans un jardin" },
  ],
  showroom: {
    heading: "Conseil sauna au bord du lac de Constance",
    text: "À quelques minutes de Bregenz, nous présentons des meubles et des luminaires de marques de design internationales. Les saunas, nous en parlons lors du rendez-vous à l’aide de la documentation des fabricants, d’échantillons de bois et de verre et de plans, et nous vous montrons votre pièce en 3D. À la prise de rendez-vous, nous vous indiquons si des cabines sont actuellement visibles, et lesquelles.",
  },
  cta: {
    heading: "Planifions votre sauna",
    text: "Prenez un rendez-vous de conseil sans engagement à Lochau – ou écrivez-nous où le sauna doit prendre place.",
  },
  faq: {
    heading: "Questions sur l’achat d’un sauna",
    items: [
      { q: "Comment se déroule la planification d’un sauna chez Platzhirsch ?", a: "Lors d’un premier entretien, nous précisons l’usage, la place et l’implantation. Harald Menghin dessine votre espace sauna à la main, puis nous planifions en 3D avec cotes, ventilation et raccordements. Vous choisissez cabine, bois, verre et poêle à l’aide de la documentation des fabricants et d’échantillons. La cabine est fabriquée chez le fabricant ; nous coordonnons livraison et montage avec les corps de métier." },
      { q: "Sauna dans la maison : que doit offrir la pièce ?", a: "La cabine a besoin d’un sol plan, de place pour ouvrir la porte et pour le poêle, d’une ventilation et d’une alimentation électrique ; un espace repos et une douche à proximité complètent la pièce. Cave, salle de bain ou combles ont chacun leurs exigences de hauteur sous plafond et de protection contre l’humidité – ce dont votre pièce a besoin se règle lors du rendez-vous et avec le fabricant." },
      { q: "Sauna d’extérieur au jardin : à quoi faut-il penser ?", a: "Une fondation plane et porteuse, une alimentation électrique et, pour un poêle à bois, une cheminée. Le Starpool Nature Sauna personal existe avec poêle électrique ou avec poêle à bois et cheminée ; pour le poêle électrique, le fabricant indique 400 V. Votre commune vous indique si une déclaration ou une autorisation est nécessaire." },
      { q: "Qui se charge du raccordement électrique ?", a: "Le raccordement est réalisé par une entreprise d’électricité habilitée. La tension et la protection requises par un poêle figurent dans les données du fabricant pour le modèle. Nous dessinons le tracé des câbles et le point de raccordement dans le plan – les détails se règlent lors du rendez-vous avec l’électricien." },
      { q: "Livrez-vous aussi des saunas en Allemagne et en Suisse ?", a: "Oui, sur demande – au Vorarlberg, en Allemagne, en Suisse et au Liechtenstein. Entre l’Autriche et l’Allemagne, il n’y a pas de douane. Pour la Suisse s’ajoutent l’exportation et le dédouanement ; nous décrivons les étapes sur platzhirsch.studio/fr/einkaufen-aus-der-schweiz et les parcourons volontiers avec vous." },
      { q: "Sauna, cabine infrarouge ou hammam ?", a: "Un sauna finlandais fonctionne avec la chaleur sèche du poêle, un soft sauna, selon le fabricant, avec une chaleur plus douce, une cabine infrarouge chauffe par des émetteurs, un hammam par la chaleur humide. Starpool propose les trois types de cabine, Soleum avec ELLIPSE un hammam d’extérieur. Ce qui convient à votre pièce et à votre usage se discute lors du rendez-vous – nous ne décrivons pas d’effets sur la santé ; ces indications viennent des fabricants." },
    ],
  },
};

const IT = {
  processText:
    "Harald Menghin disegna prima a mano il vostro ambiente sauna: cabina, zona relax, doccia, percorsi e luce. Poi progettiamo in 3D con misure e allacciamenti esatti, e vedete legno, vetro e luce in un rendering prima di ordinare qualsiasi cosa.",
  banner: {
    title: "Acquistare una sauna in Vorarlberg: una sauna per la casa, progettata sul Lago di Costanza",
    lead: "Saune per casa e giardino – disegnate a mano a Lochau, per il Vorarlberg, la sponda tedesca del Lago di Costanza e la Svizzera.",
    alt: "Starpool Classic Sauna: cabina in legno chiaro con vetrata panoramica e stufa rotonda",
    crumb: "Acquistare una sauna",
  },
  facts: [
    { label: "Austria", value: "Consegna e montaggio su richiesta, coordinati con elettricista e idraulico" },
    { label: "Germania", value: "Nessuna dogana: Austria e Germania fanno parte del mercato interno UE; consegna su richiesta" },
    { label: "Svizzera", value: "Consegna su richiesta; si aggiungono esportazione e sdoganamento, di cui vi spieghiamo i passaggi" },
  ],
  intro: {
    eyebrow: "Sauna · Vorarlberg · Lago di Costanza",
    heading: "Una sauna adatta a casa e giardino",
    paragraphs: [
      "Una sauna in casa è un ambiente a sé: cabina, zona relax, doccia e luce devono essere coerenti, insieme a ventilazione e corrente. Da Platzhirsch Home Living a Lochau progettiamo quindi la sauna come ogni altro ambiente – prima a mano, poi in 3D – e coordiniamo consegna e montaggio con elettricista e idraulico. La cabina viene realizzata dal produttore.",
      "Progettiamo con le saune di Starpool di Ziano di Fiemme, in Trentino: saune finlandesi in più collezioni per interni, la Nature Sauna per giardino e terrazza – con stufa elettrica oppure stufa a legna con camino – e inoltre cabine a infrarossi, bagni turchi e Ice Bath. Per la zona relax si aggiungono lettini riscaldati di Soleum, di Pregarten in Alta Austria, e di Fabio Alemanno; Soleum realizza anche ELLIPSE, un bagno turco da esterno.",
    ],
    benefits: [
      "Ambiente sauna disegnato a mano, poi progettato in 3D",
      "Starpool: saune finlandesi, sauna da esterno Nature Sauna, cabine a infrarossi e bagni turchi",
      "Sauna, zona relax e zona living progettate da un solo interlocutore",
      "Consegna e montaggio su richiesta, coordinati con elettricista e idraulico",
    ],
    imageAlt: "Starpool Nature Sauna personal: sauna da esterno scura su una terrazza",
  },
  steps: {
    eyebrow: "Come nasce la vostra sauna",
    heading: "Dalla prima idea al montaggio",
    items: [
      { title: "Consulenza a Lochau", text: "Parliamo di uso, spazio e collocazione – in casa o in giardino – e confrontiamo sauna, cabina a infrarossi e bagno turco, oltre a legni e vetro, con la documentazione dei produttori e i campioni." },
      { title: "Disegnata a mano", text: "Harald Menghin disegna prima a mano il vostro ambiente sauna: cabina, zona relax, doccia, percorsi e luce. Poi progettiamo in 3D con misure esatte." },
      { title: "Tecnica e artigiani", text: "Alimentazione elettrica, ventilazione, acqua per la doccia e, per le saune da esterno, fondazione e camino entrano nel progetto e li coordiniamo con elettricista, idraulico e produttore. Di cosa ha bisogno il vostro ambiente lo chiariamo all’appuntamento." },
      { title: "Consegna e montaggio", text: "La cabina arriva dal produttore; coordiniamo consegna e montaggio su richiesta – in Germania e Svizzera su richiesta. Per la Svizzera si aggiungono esportazione e sdoganamento." },
    ],
    links: [
      { label: "Il nostro metodo nel dettaglio" },
      { label: "Tutte le saune a catalogo" },
      { label: "Starpool: saune, bagni turchi e infrarossi" },
      { label: "Soleum: bagno turco e lettini riscaldati" },
      { label: "Bagno e benessere: tutti i marchi" },
      { label: "Mosaico di vetro Ezarri per la zona benessere" },
      { label: "Acquistare dalla Svizzera: esportazione e sdoganamento" },
      { label: "Servizio di cura per arredi e imbottiti" },
    ],
  },
  gallery: [
    { alt: "Starpool Glamour Sauna: cabina in abete cerato nero con panca e stufa" },
    { alt: "Starpool Shade Sauna: sauna con schermature a listelli in legno in un soggiorno" },
    { alt: "Starpool Nature Soft Sauna: cabina esterna scura con fronte in vetro in giardino" },
  ],
  showroom: {
    heading: "Consulenza sauna sul Lago di Costanza",
    text: "A pochi minuti da Bregenz presentiamo arredi e lampade di marchi di design internazionali. Delle saune parliamo all’appuntamento con la documentazione dei produttori, campioni di legno e vetro e le piante, e vi mostriamo il vostro ambiente in 3D. Se e quali cabine sono visibili in questo momento ve lo diciamo quando fissate l’appuntamento.",
  },
  cta: {
    heading: "Progettiamo la vostra sauna",
    text: "Fissate un appuntamento di consulenza senza impegno a Lochau – oppure scriveteci dove dovrà stare la sauna.",
  },
  faq: {
    heading: "Domande sull’acquisto di una sauna",
    items: [
      { q: "Come si svolge la progettazione della sauna da Platzhirsch?", a: "In un primo colloquio chiariamo uso, spazio e collocazione. Harald Menghin disegna il vostro ambiente sauna a mano, poi progettiamo in 3D con misure, ventilazione e allacciamenti. Cabina, legni, vetro e stufa li scegliete con la documentazione dei produttori e i campioni. La cabina viene realizzata dal produttore; consegna e montaggio li coordiniamo con gli artigiani." },
      { q: "Sauna in casa: cosa deve offrire l’ambiente?", a: "La cabina ha bisogno di un pavimento piano, di spazio per aprire la porta e per la stufa, di ventilazione e di un allacciamento elettrico; una zona relax e una doccia vicine completano l’ambiente. Cantina, bagno o sottotetto hanno ciascuno le proprie esigenze di altezza e protezione dall’umidità – di cosa ha bisogno il vostro ambiente lo chiariamo all’appuntamento e con il produttore." },
      { q: "Sauna da esterno in giardino: a cosa fare attenzione?", a: "Una fondazione piana e portante, un allacciamento elettrico e, con stufa a legna, un camino. La Starpool Nature Sauna personal esiste con stufa elettrica oppure con stufa a legna e camino; per la stufa elettrica il produttore indica 400 V. Il vostro comune vi dice se serve una comunicazione o un permesso edilizio." },
      { q: "Chi si occupa dell’allacciamento elettrico?", a: "L’allacciamento è eseguito da un’impresa elettrica abilitata. Tensione e protezione richieste da una stufa sono nei dati del produttore del modello. Disegniamo percorso dei cavi e punto di allacciamento nel progetto – i dettagli li concordiamo all’appuntamento con l’elettricista." },
      { q: "Consegnate saune anche in Germania e in Svizzera?", a: "Sì, su richiesta – in Vorarlberg, Germania, Svizzera e Liechtenstein. Tra Austria e Germania non c’è dogana. Per la Svizzera si aggiungono esportazione e sdoganamento; i passaggi li descriviamo su platzhirsch.studio/it/einkaufen-aus-der-schweiz e li vediamo volentieri insieme a voi." },
      { q: "Sauna, cabina a infrarossi o bagno turco?", a: "Una sauna finlandese lavora con il calore secco della stufa, una soft sauna secondo il produttore con un calore più mite, una cabina a infrarossi scalda con emettitori, un bagno turco con calore umido. Starpool realizza tutti e tre i tipi di cabina, Soleum con ELLIPSE un bagno turco da esterno. Cosa si adatta al vostro ambiente e al vostro uso lo discutiamo all’appuntamento – non descriviamo effetti sulla salute; queste indicazioni le danno i produttori." },
    ],
  },
};

export const INTL = { en: EN, fr: FR, it: IT };
