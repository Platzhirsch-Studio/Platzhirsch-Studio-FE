// src/lib/content/landingKern/swimspa.js – EN/FR/IT der Seite /<locale>/swim-spa.
// Mastertext: CONTENT in src/app/[locale]/swim-spa/page.js (Deutsch, bleibt dort).
// Nur Texte – Bilder, Thema und Linkziele kommen aus der deutschen Fassung
// (mergeText in ./index.js, gleiche Reihenfolge der Listen).
// Regeln wie im Deutschen: kein Händlerwort (Claim-Guard), Fakten nur aus dem
// Katalog (Aquavia Spa Swimspas: 400–600 × 230 × 138 cm), kein Preis, keine
// Lieferfrist, Lieferung „auf Wunsch/auf Anfrage“, Schweiz: Ausfuhr und Verzollung.

export const META = {
  en: {
    title: "Buy a swim spa in Vorarlberg",
    description:
      "Swim spa with counter-current for garden and home: Aquavia Spa, drawn by hand and planned in 3D in Lochau on Lake Constance. Delivery on request.",
    og: { eyebrow: "Swim spa", title: "Swim spas in Vorarlberg" },
  },
  fr: {
    title: "Acheter un swim spa au Vorarlberg",
    description:
      "Swim spa avec nage à contre-courant pour le jardin et la maison : Aquavia Spa, dessiné à la main et planifié en 3D à Lochau. Livraison sur demande.",
    og: { eyebrow: "Swim spa", title: "Swim spas au Vorarlberg" },
  },
  it: {
    title: "Acquistare una swim spa in Vorarlberg",
    description:
      "Swim spa con nuoto controcorrente per giardino e casa: Aquavia Spa, disegnata a mano e progettata in 3D a Lochau. Consegna su richiesta.",
    og: { eyebrow: "Swim spa", title: "Swim spa in Vorarlberg" },
  },
};

const EN = {
  processText:
    "Harald Menghin first draws the place for your swim spa by hand: pool, entry, routes, privacy screening and light. Then we plan in 3D with dimensions, base and connections, and you see garden or room as a rendering before anything is ordered.",
  banner: {
    title: "Buy a swim spa: swimming and relaxing in a few metres",
    lead: "Planned in Lochau on Lake Constance – for gardens and homes in Vorarlberg, on the German shore and in Switzerland.",
    alt: "Aquavia Spa Swimspa Amazon: on a wooden deck in the garden",
    crumb: "Swim spa",
  },
  facts: [
    { label: "Austria", value: "Delivery and installation on request, coordinated with electrician and plumber" },
    { label: "Germany", value: "No customs – Austria and Germany are both in the EU single market; delivery on request" },
    { label: "Switzerland", value: "Delivery on request; export and customs clearance are added – we explain the steps" },
  ],
  intro: {
    eyebrow: "Swim spa · Vorarlberg · Lake Constance",
    heading: "One pool that combines swimming and hot tub",
    paragraphs: [
      "A swim spa is a compact pool with a counter-current system: you swim against the current without the garden needing a full-length pool, and relax afterwards in the massage area. According to the manufacturer, the swim spas by Aquavia Spa from Cervera in Catalonia are 400 to 600 cm long and 230 cm wide – from the Amazon for four people with swimming and massage area, through the Duo with two separate pools and their own water temperature, to the Compact Pool and Sky for one person, also for indoors.",
      "At Platzhirsch Home Living in Lochau we plan the swim spa like a room: entry, routes, privacy screening, light and the furniture next to it are part of the plan from the start. Whether a garden in Bregenz, a plot on Lake Constance or a wellness room in the house: delivery and installation are available on request, in Germany, Switzerland and Liechtenstein on enquiry.",
    ],
    benefits: [
      "Swim spa placement drawn by hand, then planned in 3D",
      "Aquavia Spa: five swim spas from 400 to 600 cm in length, for outdoors and indoors",
      "Garden, terrace and living area planned by one team",
      "Delivery and installation on request, coordinated with electrician and plumber",
    ],
    imageAlt: "Aquavia Spa Swimspa Amazon: in a wood-panelled room, view from above",
  },
  steps: {
    eyebrow: "How your swim spa comes about",
    heading: "From the first idea to installation",
    items: [
      { title: "Consultation in Lochau", text: "We talk about swimming, relaxing and space, about placement outdoors, sunk into the ground or indoors – and compare the models using manufacturer documents and samples." },
      { title: "Drawn by hand", text: "Harald Menghin first draws garden or room by hand: pool, entry, routes, privacy screening and light. Then we plan it in 3D with exact dimensions." },
      { title: "Technology & trades", text: "Base, power supply, water inlet and drain go into the plan, and we coordinate them with electrician, plumber and, if needed, a structural engineer. What your site needs is settled at the appointment." },
      { title: "Delivery & installation", text: "Beforehand we check access and the route in – a swim spa is several metres long. We coordinate delivery and installation on request, in Germany and Switzerland on enquiry; for Switzerland, export and customs clearance are added." },
    ],
    links: [
      { label: "How we work in detail" },
      { label: "All swim spas in the catalogue" },
      { label: "Aquavia Spa: hot tubs and swim spas" },
      { label: "Buy a hot tub: outdoor hot tub and private spa" },
      { label: "Ezarri glass mosaic for pool and spa" },
      { label: "Outdoor and garden planning on Lake Constance" },
      { label: "Buying from Switzerland: export and customs clearance" },
      { label: "Care service for furniture and upholstery" },
    ],
  },
  gallery: [
    { alt: "Aquavia Spa Swimspa Duo: set into the ground in the garden" },
    { alt: "Aquavia Spa Swimspa Compact Pool: person swimming against the current" },
    { alt: "Aquavia Spa Swimspa Sky: on a wooden deck in the evening, view from above" },
  ],
  showroom: {
    heading: "Swim spa advice on Lake Constance",
    text: "Just a few minutes from Bregenz we show furniture and lights by international design brands. Swim spas we discuss at your appointment using manufacturer documents, samples and plans, and we show you your place in 3D. When you book, we tell you whether any models are currently on view, and which ones.",
  },
  cta: {
    heading: "Let’s plan your swim spa",
    text: "Arrange a no-obligation consultation in Lochau – or write to us where the pool is to go.",
  },
  faq: {
    heading: "Questions about swim spas",
    items: [
      { q: "What distinguishes a swim spa from a pool and a hot tub?", a: "A swim spa is shorter than a pool and has a counter-current system against which you swim on the spot. Many models also have a massage area with jets like a hot tub – in the Aquavia Spa Swimspa Duo, swimming and massage area are two separate pools with their own water temperature. Which model suits you is settled in conversation." },
      { q: "How much space does a swim spa need?", a: "According to the manufacturer, the Aquavia Spa swim spas measure 400 to 600 cm in length, 230 cm in width and 138 cm in height. Add room for entry, cover and maintenance and a level, load-bearing base. Whether the pool stands free, is partly sunk into the ground or stands indoors is planned with you – indoors, ventilation, moisture protection and the route in come into play." },
      { q: "Which connections does a swim spa need?", a: "Power, a water supply and a drain for emptying. The electrical connection is made by a licensed electrical contractor; the voltage a model needs is in the manufacturer’s data. We draw the cable route and the connection point into the plan – the details are agreed at the appointment with electrician and plumber." },
      { q: "Do you also deliver swim spas to Germany and Switzerland?", a: "Yes, on request – to Vorarlberg, Germany, Switzerland and Liechtenstein. Beforehand we check access and the route in. There are no customs between Austria and Germany; for Switzerland, export and customs clearance are added, and we describe the steps at platzhirsch.studio/en/einkaufen-aus-der-schweiz." },
      { q: "Can a swim spa be used all year round?", a: "Whether a model is designed for winter operation is in the manufacturer’s data – we go through this with you when choosing the model and plan the cover in from the start. For the outdoor furniture around the pool there is our winter service with collection, care and storage at platzhirsch.studio/en/outdoor-winterservice." },
      { q: "Who looks after care and maintenance?", a: "Water care and maintenance follow the manufacturer’s data for your model; suitable care kits and accessories are in the catalogue. For the upholstery, leather and wood of the furniture around the swim spa we offer a care service: platzhirsch.studio/en/pflege-service." },
    ],
  },
};

const FR = {
  processText:
    "Harald Menghin dessine d’abord à la main l’emplacement de votre swim spa : bassin, accès, circulations, protection des regards et lumière. Ensuite, nous planifions en 3D avec cotes, support et raccordements, et vous voyez le jardin ou la pièce en rendu avant toute commande.",
  banner: {
    title: "Acheter un swim spa : nager et se détendre sur quelques mètres",
    lead: "Planifié à Lochau, au bord du lac de Constance – pour les jardins et les maisons du Vorarlberg, de la rive allemande et de Suisse.",
    alt: "Aquavia Spa Swimspa Amazon : sur une terrasse en bois dans le jardin",
    crumb: "Swim spa",
  },
  facts: [
    { label: "Autriche", value: "Livraison et montage sur demande, coordonnés avec l’électricien et le plombier" },
    { label: "Allemagne", value: "Pas de douane : l’Autriche et l’Allemagne font partie du marché intérieur de l’UE ; livraison sur demande" },
    { label: "Suisse", value: "Livraison sur demande ; s’ajoutent l’exportation et le dédouanement, dont nous vous expliquons les étapes" },
  ],
  intro: {
    eyebrow: "Swim spa · Vorarlberg · Lac de Constance",
    heading: "Un bassin qui réunit natation et spa",
    paragraphs: [
      "Un swim spa est un bassin compact avec nage à contre-courant : vous nagez contre le courant sans que le jardin ait besoin d’une piscine en longueur, puis vous vous détendez dans la zone de massage. Selon le fabricant, les swim spas d’Aquavia Spa, de Cervera en Catalogne, mesurent 400 à 600 cm de long et 230 cm de large – de l’Amazon pour quatre personnes avec zone de nage et de massage, au Duo avec deux bassins séparés et chacun sa température d’eau, jusqu’aux Compact Pool et Sky pour une personne, aussi pour l’intérieur.",
      "Chez Platzhirsch Home Living à Lochau, nous planifions le swim spa comme une pièce : accès, circulations, protection des regards, lumière et le mobilier voisin en font partie dès le départ. Jardin à Bregenz, terrain au bord du lac de Constance ou espace bien-être dans la maison : livraison et montage sont possibles sur demande, en Allemagne, en Suisse et au Liechtenstein sur demande également.",
    ],
    benefits: [
      "Emplacement du swim spa dessiné à la main, puis planifié en 3D",
      "Aquavia Spa : cinq swim spas de 400 à 600 cm de long, pour l’extérieur et l’intérieur",
      "Jardin, terrasse et séjour conçus par un seul interlocuteur",
      "Livraison et montage sur demande, coordonnés avec l’électricien et le plombier",
    ],
    imageAlt: "Aquavia Spa Swimspa Amazon : dans une pièce lambrissée de bois, vue de dessus",
  },
  steps: {
    eyebrow: "Comment naît votre swim spa",
    heading: "De la première idée au montage",
    items: [
      { title: "Conseil à Lochau", text: "Nous parlons natation, détente et place disponible, implantation en extérieur, encastrée ou dans la maison – et comparons les modèles à l’aide de la documentation des fabricants et d’échantillons." },
      { title: "Dessiné à la main", text: "Harald Menghin dessine d’abord le jardin ou la pièce à la main : bassin, accès, circulations, protection des regards et lumière. Ensuite, nous planifions en 3D avec des cotes exactes." },
      { title: "Technique et corps de métier", text: "Support, alimentation électrique, arrivée et évacuation d’eau figurent dans le plan, et nous les coordonnons avec l’électricien, le plombier et, au besoin, un ingénieur structure. Ce dont votre emplacement a besoin se règle lors du rendez-vous." },
      { title: "Livraison et montage", text: "Au préalable, nous vérifions l’accès et le passage – un swim spa mesure plusieurs mètres de long. Nous coordonnons livraison et montage sur demande, en Allemagne et en Suisse sur demande également ; pour la Suisse s’ajoutent l’exportation et le dédouanement." },
    ],
    links: [
      { label: "Notre méthode en détail" },
      { label: "Tous les swim spas au catalogue" },
      { label: "Aquavia Spa : spas et swim spas" },
      { label: "Acheter un spa : spa extérieur et spa privé" },
      { label: "Mosaïque de verre Ezarri pour piscine et spa" },
      { label: "Aménagement extérieur et jardin au lac de Constance" },
      { label: "Acheter depuis la Suisse : exportation et dédouanement" },
      { label: "Service d’entretien pour meubles et revêtements" },
    ],
  },
  gallery: [
    { alt: "Aquavia Spa Swimspa Duo : encastré dans le sol du jardin" },
    { alt: "Aquavia Spa Swimspa Compact Pool : personne nageant à contre-courant" },
    { alt: "Aquavia Spa Swimspa Sky : sur une terrasse en bois le soir, vue de dessus" },
  ],
  showroom: {
    heading: "Conseil swim spa au bord du lac de Constance",
    text: "À quelques minutes de Bregenz, nous présentons des meubles et des luminaires de marques de design internationales. Les swim spas, nous en parlons lors du rendez-vous à l’aide de la documentation des fabricants, d’échantillons et de plans, et nous vous montrons votre emplacement en 3D. À la prise de rendez-vous, nous vous indiquons si des modèles sont actuellement visibles, et lesquels.",
  },
  cta: {
    heading: "Planifions votre swim spa",
    text: "Prenez un rendez-vous de conseil sans engagement à Lochau – ou écrivez-nous où le bassin doit prendre place.",
  },
  faq: {
    heading: "Questions sur le swim spa",
    items: [
      { q: "Qu’est-ce qui distingue un swim spa d’une piscine et d’un spa ?", a: "Un swim spa est plus court qu’une piscine et dispose d’une nage à contre-courant contre laquelle vous nagez sur place. Beaucoup de modèles ont en plus une zone de massage avec buses, comme un spa – sur l’Aquavia Spa Swimspa Duo, la zone de nage et la zone de massage sont deux bassins séparés avec chacun sa température d’eau. Le modèle qui vous convient se détermine lors de l’entretien." },
      { q: "Quelle place faut-il pour un swim spa ?", a: "Selon le fabricant, les swim spas d’Aquavia Spa mesurent 400 à 600 cm de long, 230 cm de large et 138 cm de haut. S’y ajoutent de la place pour l’accès, la couverture et l’entretien, ainsi qu’un support plan et porteur. Que le bassin soit posé, partiellement encastré ou installé dans la maison, nous le planifions avec vous – à l’intérieur s’ajoutent la ventilation, la protection contre l’humidité et le passage pour l’acheminement." },
      { q: "Quels raccordements faut-il pour un swim spa ?", a: "L’électricité, une arrivée d’eau et une évacuation pour la vidange. Le raccordement électrique est réalisé par une entreprise d’électricité habilitée ; la tension requise figure dans les données du fabricant. Nous dessinons le tracé des câbles et le point de raccordement dans le plan – les détails se règlent lors du rendez-vous avec l’électricien et le plombier." },
      { q: "Livrez-vous aussi des swim spas en Allemagne et en Suisse ?", a: "Oui, sur demande – au Vorarlberg, en Allemagne, en Suisse et au Liechtenstein. Au préalable, nous vérifions l’accès et le passage. Entre l’Autriche et l’Allemagne, il n’y a pas de douane ; pour la Suisse s’ajoutent l’exportation et le dédouanement, dont nous décrivons les étapes sur platzhirsch.studio/fr/einkaufen-aus-der-schweiz." },
      { q: "Un swim spa peut-il être utilisé toute l’année ?", a: "Si un modèle est conçu pour fonctionner en hiver figure dans les données du fabricant – nous en parlons avec vous au moment du choix du modèle et prévoyons la couverture dès le départ. Pour le mobilier d’extérieur autour du bassin, il y a notre service hivernal avec enlèvement, entretien et stockage sur platzhirsch.studio/en/outdoor-winterservice (en anglais)." },
      { q: "Qui s’occupe de l’entretien et de la maintenance ?", a: "Le traitement de l’eau et la maintenance suivent les données du fabricant de votre modèle ; des kits d’entretien et des accessoires adaptés figurent au catalogue. Pour les revêtements, le cuir et le bois des meubles autour du swim spa, nous proposons un service d’entretien : platzhirsch.studio/fr/pflege-service." },
    ],
  },
};

const IT = {
  processText:
    "Harald Menghin disegna prima a mano il posto per la vostra swim spa: vasca, ingresso, percorsi, schermatura e luce. Poi progettiamo in 3D con misure, base e allacciamenti, e vedete giardino o ambiente in un rendering prima di ordinare qualsiasi cosa.",
  banner: {
    title: "Acquistare una swim spa: nuotare e rilassarsi in pochi metri",
    lead: "Progettata a Lochau sul Lago di Costanza – per giardini e case in Vorarlberg, sulla sponda tedesca e in Svizzera.",
    alt: "Aquavia Spa Swimspa Amazon: su un deck in legno in giardino",
    crumb: "Swim spa",
  },
  facts: [
    { label: "Austria", value: "Consegna e montaggio su richiesta, coordinati con elettricista e idraulico" },
    { label: "Germania", value: "Nessuna dogana: Austria e Germania fanno parte del mercato interno UE; consegna su richiesta" },
    { label: "Svizzera", value: "Consegna su richiesta; si aggiungono esportazione e sdoganamento, di cui vi spieghiamo i passaggi" },
  ],
  intro: {
    eyebrow: "Swim spa · Vorarlberg · Lago di Costanza",
    heading: "Una vasca che unisce nuoto e idromassaggio",
    paragraphs: [
      "Una swim spa è una vasca compatta con nuoto controcorrente: nuotate contro la corrente senza che il giardino abbia bisogno di una piscina lunga, e poi vi rilassate nella zona idromassaggio. Secondo il produttore, le swim spa di Aquavia Spa di Cervera, in Catalogna, sono lunghe da 400 a 600 cm e larghe 230 cm – dalla Amazon per quattro persone con zona nuoto e zona massaggio, passando per la Duo con due vasche separate e temperatura dell’acqua indipendente, fino a Compact Pool e Sky per una persona, anche per interni.",
      "Da Platzhirsch Home Living a Lochau progettiamo la swim spa come un ambiente: ingresso, percorsi, schermatura, luce e gli arredi accanto fanno parte del progetto fin dall’inizio. Giardino a Bregenz, terreno sul Lago di Costanza o ambiente benessere in casa: consegna e montaggio sono disponibili su richiesta, in Germania, Svizzera e Liechtenstein su richiesta.",
    ],
    benefits: [
      "Posto per la swim spa disegnato a mano, poi progettato in 3D",
      "Aquavia Spa: cinque swim spa da 400 a 600 cm di lunghezza, per esterni e interni",
      "Giardino, terrazza e zona living progettati da un solo interlocutore",
      "Consegna e montaggio su richiesta, coordinati con elettricista e idraulico",
    ],
    imageAlt: "Aquavia Spa Swimspa Amazon: in una stanza rivestita in legno, vista dall’alto",
  },
  steps: {
    eyebrow: "Come nasce la vostra swim spa",
    heading: "Dalla prima idea al montaggio",
    items: [
      { title: "Consulenza a Lochau", text: "Parliamo di nuoto, relax e spazio disponibile, di collocazione all’aperto, incassata o in casa – e confrontiamo i modelli con la documentazione dei produttori e i campioni." },
      { title: "Disegnata a mano", text: "Harald Menghin disegna prima a mano giardino o ambiente: vasca, ingresso, percorsi, schermatura e luce. Poi progettiamo in 3D con misure esatte." },
      { title: "Tecnica e artigiani", text: "Base, alimentazione elettrica, carico e scarico dell’acqua entrano nel progetto e li coordiniamo con elettricista, idraulico e, se serve, con un ingegnere strutturista. Di cosa ha bisogno il vostro posto lo chiariamo all’appuntamento." },
      { title: "Consegna e montaggio", text: "Prima verifichiamo accesso e percorso di ingresso – una swim spa è lunga diversi metri. Coordiniamo consegna e montaggio su richiesta, in Germania e Svizzera su richiesta; per la Svizzera si aggiungono esportazione e sdoganamento." },
    ],
    links: [
      { label: "Il nostro metodo nel dettaglio" },
      { label: "Tutte le swim spa a catalogo" },
      { label: "Aquavia Spa: vasche idromassaggio e swim spa" },
      { label: "Acquistare un idromassaggio: vasca da esterno e spa privata" },
      { label: "Mosaico di vetro Ezarri per piscina e spa" },
      { label: "Progettazione outdoor e giardino sul Lago di Costanza" },
      { label: "Acquistare dalla Svizzera: esportazione e sdoganamento" },
      { label: "Servizio di cura per arredi e imbottiti" },
    ],
  },
  gallery: [
    { alt: "Aquavia Spa Swimspa Duo: incassata nel terreno in giardino" },
    { alt: "Aquavia Spa Swimspa Compact Pool: persona che nuota controcorrente" },
    { alt: "Aquavia Spa Swimspa Sky: su un deck in legno di sera, vista dall’alto" },
  ],
  showroom: {
    heading: "Consulenza swim spa sul Lago di Costanza",
    text: "A pochi minuti da Bregenz presentiamo arredi e lampade di marchi di design internazionali. Delle swim spa parliamo all’appuntamento con la documentazione dei produttori, i campioni e le piante, e vi mostriamo il vostro posto in 3D. Se e quali modelli sono visibili in questo momento ve lo diciamo quando fissate l’appuntamento.",
  },
  cta: {
    heading: "Progettiamo la vostra swim spa",
    text: "Fissate un appuntamento di consulenza senza impegno a Lochau – oppure scriveteci dove dovrà stare la vasca.",
  },
  faq: {
    heading: "Domande sulla swim spa",
    items: [
      { q: "Cosa distingue una swim spa da piscina e vasca idromassaggio?", a: "Una swim spa è più corta di una piscina e ha un sistema di nuoto controcorrente contro cui si nuota sul posto. Molti modelli hanno in più una zona massaggio con getti come una vasca idromassaggio – nella Aquavia Spa Swimspa Duo zona nuoto e zona massaggio sono due vasche separate con temperatura dell’acqua indipendente. Quale modello fa per voi lo chiariamo nel colloquio." },
      { q: "Quanto spazio serve per una swim spa?", a: "Secondo il produttore, le swim spa di Aquavia Spa misurano da 400 a 600 cm di lunghezza, 230 cm di larghezza e 138 cm di altezza. Si aggiungono spazio per ingresso, copertura e manutenzione e una base piana e portante. Se la vasca resta libera, viene parzialmente incassata o sta in casa lo progettiamo con voi – in casa si aggiungono ventilazione, protezione dall’umidità e percorso di ingresso." },
      { q: "Quali allacciamenti servono per una swim spa?", a: "Corrente, carico dell’acqua e uno scarico per lo svuotamento. L’allacciamento elettrico è eseguito da un’impresa elettrica abilitata; la tensione richiesta da un modello è nei dati del produttore. Disegniamo percorso dei cavi e punto di allacciamento nel progetto – i dettagli li concordiamo all’appuntamento con elettricista e idraulico." },
      { q: "Consegnate swim spa anche in Germania e in Svizzera?", a: "Sì, su richiesta – in Vorarlberg, Germania, Svizzera e Liechtenstein. Prima verifichiamo accesso e percorso di ingresso. Tra Austria e Germania non c’è dogana; per la Svizzera si aggiungono esportazione e sdoganamento, e i passaggi li descriviamo su platzhirsch.studio/it/einkaufen-aus-der-schweiz." },
      { q: "Una swim spa si può usare tutto l’anno?", a: "Se un modello è progettato per l’uso in inverno è nei dati del produttore – ne parliamo con voi nella scelta del modello e prevediamo la copertura fin dall’inizio. Per gli arredi outdoor intorno alla vasca c’è il nostro servizio invernale con ritiro, cura e deposito su platzhirsch.studio/en/outdoor-winterservice (in inglese)." },
      { q: "Chi si occupa di cura e manutenzione?", a: "Trattamento dell’acqua e manutenzione seguono i dati del produttore del vostro modello; kit di cura e accessori adatti sono a catalogo. Per imbottiti, pelle e legno degli arredi intorno alla swim spa offriamo un servizio di cura: platzhirsch.studio/it/pflege-service." },
    ],
  },
};

export const INTL = { en: EN, fr: FR, it: IT };
