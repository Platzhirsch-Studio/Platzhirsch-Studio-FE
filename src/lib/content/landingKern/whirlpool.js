// src/lib/content/landingKern/whirlpool.js – EN/FR/IT der Seite
// /<locale>/whirlpool-kaufen. Mastertext: CONTENT in
// src/app/[locale]/whirlpool-kaufen/page.js (Deutsch, bleibt dort).
// Nur Texte – Bilder, Thema und Linkziele kommen aus der deutschen Fassung
// (mergeText in ./index.js, gleiche Reihenfolge der Listen).
// Regeln wie im Deutschen: kein Händlerwort (der Satz kommt aus dem Claim-Guard),
// Fakten nur aus dem Katalog (Aquavia Spa, Starpool Air Bath), kein Preis,
// keine Lieferfrist, Lieferung „auf Wunsch/auf Anfrage“, Schweiz: Ausfuhr und
// Verzollung (Wortlaut wie src/lib/ezarri/copy.en/fr/it.js `laender`).

export const META = {
  en: {
    title: "Buy a hot tub in Vorarlberg",
    description:
      "Outdoor hot tub or private spa with Aquavia Spa, drawn by hand and planned in 3D in Lochau on Lake Constance. Delivery to AT, DE and CH on request.",
    og: { eyebrow: "Hot tub · Private spa", title: "Hot tubs in Vorarlberg" },
  },
  fr: {
    title: "Acheter un spa au Vorarlberg",
    description:
      "Spa extérieur ou spa privé avec Aquavia Spa, dessiné à la main et planifié en 3D à Lochau, au lac de Constance. Livraison en Suisse sur demande.",
    og: { eyebrow: "Spa · Spa privé", title: "Spas au Vorarlberg" },
  },
  it: {
    title: "Acquistare una vasca idromassaggio in Vorarlberg",
    description:
      "Idromassaggio da esterno o spa privata con Aquavia Spa, disegnata a mano e progettata in 3D a Lochau sul Lago di Costanza. Consegna su richiesta.",
    og: { eyebrow: "Idromassaggio · Spa privata", title: "Vasche idromassaggio in Vorarlberg" },
  },
};

const EN = {
  processText:
    "Harald Menghin first draws the place for your hot tub by hand: footprint, routes, privacy screening, light and the furniture next to it. Then we plan in 3D with dimensions, base and connections, and you see the terrace or spa room as a rendering before anything is ordered.",
  banner: {
    title: "Buy a hot tub in Vorarlberg: outdoor hot tub and private spa",
    lead: "Planned in Lochau on Lake Constance – for gardens, terraces and homes in the border region of Austria, Germany and Switzerland.",
    alt: "Aquavia Spa Serenity Hot Tub: on a terrace",
    crumb: "Buy a hot tub",
  },
  facts: [
    { label: "Austria", value: "Delivery and installation on request, coordinated with electrician and plumber" },
    { label: "Germany", value: "No customs – Austria and Germany are both in the EU single market; delivery on request" },
    { label: "Switzerland", value: "Delivery on request; export and customs clearance are added – we explain the steps" },
  ],
  intro: {
    eyebrow: "Hot tub · Vorarlberg · Lake Constance",
    heading: "A hot tub that fits garden and home",
    paragraphs: [
      "A hot tub in the garden or a private spa in the house is more than a tub: it needs a load-bearing base, power and water, room for the cover and for maintenance – and a place where you like to sit. At Platzhirsch Home Living in Lochau we therefore plan the hot tub like a room: with terrace, privacy screening, light and the furniture next to it.",
      "We plan with hot tubs by Aquavia Spa from Cervera in Catalonia – for indoors and outdoors, built-in or with overflow, plus swim spas and a cold plunge – and with the Air Bath hot tub by Starpool from Trentino. Whether a garden in Dornbirn, a terrace on Lake Constance or a house in the Rhine valley: delivery and installation are available on request, in Germany, Switzerland and Liechtenstein on enquiry.",
    ],
    benefits: [
      "Hot tub placement drawn by hand, then planned in 3D",
      "Aquavia Spa: hot tubs for indoors, outdoors and built-in, swim spas and cold plunge",
      "Terrace, garden and living area planned by one team",
      "Delivery and installation on request, coordinated with electrician and plumber",
    ],
    imageAlt: "Aquavia Spa Capri Hot Tub: set into a wooden platform in an indoor room",
  },
  steps: {
    eyebrow: "How your hot tub place comes about",
    heading: "From the first idea to installation",
    items: [
      { title: "Consultation in Lochau", text: "We talk about use, number of seats and placement – indoors or outdoors – and compare models, cabinets and covers using manufacturer documents and samples." },
      { title: "Drawn by hand", text: "Harald Menghin first draws the terrace or spa room by hand: footprint, routes, privacy screening and light. Then we plan it in 3D with exact dimensions." },
      { title: "Technology & trades", text: "Base, power supply, water inlet and drain go into the plan, and we coordinate them with electrician, plumber and, if needed, a structural engineer. What your site needs is settled at the appointment." },
      { title: "Delivery & installation", text: "Beforehand we check access and the route in. We coordinate delivery and installation on request – in Austria, Germany and Switzerland on enquiry; for Switzerland, export and customs clearance are added." },
    ],
    links: [
      { label: "How we work in detail" },
      { label: "Aquavia Spa: hot tubs in the catalogue" },
      { label: "All hot tubs in the catalogue" },
      { label: "Swim spa: swimming and relaxing in a few metres" },
      { label: "Ezarri glass mosaic for pool and spa" },
      { label: "Buying from Switzerland: export and customs clearance" },
      { label: "Winter service for outdoor furniture" },
      { label: "Care service for furniture and upholstery" },
    ],
  },
  gallery: [
    { alt: "Aquavia Spa Serenity Hot Tub: on a terrace, close-up view" },
    { alt: "Aquavia Spa Swimspa Amazon: on a wooden deck in the garden" },
    { alt: "Starpool Air Bath: hot tub on an outdoor terrace" },
  ],
  showroom: {
    heading: "Hot tub advice on Lake Constance",
    text: "Just a few minutes from Bregenz we show furniture and lights by international design brands. Hot tubs we discuss at your appointment using manufacturer documents, samples and plans, and we show you your place in 3D. When you book, we tell you whether any models are currently on view, and which ones.",
  },
  cta: {
    heading: "Let’s plan your hot tub",
    text: "Arrange a no-obligation consultation in Lochau – or write to us where the hot tub is to go.",
  },
  faq: {
    heading: "Questions about buying a hot tub",
    items: [
      { q: "How does hot tub planning at Platzhirsch work?", a: "In a first conversation we settle use, number of seats and placement. Harald Menghin draws your place by hand, then we plan in 3D with dimensions, base and connections. You choose model and equipment using manufacturer documents and samples. Finally, we coordinate delivery and installation with the trades." },
      { q: "Hot tub indoors or outdoors – what should I consider?", a: "Outdoors a hot tub needs a level, load-bearing base, room for the cover and maintenance, and access for delivery. On a terrace, balcony or roof a structural engineer checks the load capacity; your municipality tells you whether a building notification is required. Indoors, ventilation, moisture protection, a floor drain and the route in come into play. What your site needs is settled at the appointment." },
      { q: "Which connections does a hot tub need?", a: "Power, a water supply and a drain for emptying. The electrical connection is made by a licensed electrical contractor; the voltage a model needs is in the manufacturer’s data. We draw the cable route and the connection point into the plan – the details are agreed at the appointment with electrician and plumber." },
      { q: "Do you also deliver hot tubs to Germany and Switzerland?", a: "Yes, on request – to Vorarlberg, Germany, Switzerland and Liechtenstein. There are no customs between Austria and Germany. For Switzerland, export and customs clearance are added; we describe the steps at platzhirsch.studio/en/einkaufen-aus-der-schweiz and are happy to go through them with you." },
      { q: "Can an outdoor hot tub be used in winter?", a: "Whether a model is designed for winter operation and how it is shut down is in the manufacturer’s data – we go through this with you when choosing the model. A suitable cover is part of the plan from the start. For the outdoor furniture around the hot tub there is our winter service with collection, care and storage at platzhirsch.studio/en/outdoor-winterservice." },
      { q: "Who looks after care and maintenance?", a: "Water care and maintenance follow the manufacturer’s data for your model; suitable care kits and accessories are in the catalogue. For the upholstery, leather and wood of the furniture around the hot tub we offer a care service: platzhirsch.studio/en/pflege-service." },
    ],
  },
};

const FR = {
  processText:
    "Harald Menghin dessine d’abord à la main l’emplacement de votre spa : emprise, circulations, protection des regards, lumière et le mobilier voisin. Ensuite, nous planifions en 3D avec cotes, support et raccordements, et vous voyez la terrasse ou l’espace spa en rendu avant toute commande.",
  banner: {
    title: "Acheter un spa au Vorarlberg : spa extérieur et spa privé",
    lead: "Planifié à Lochau, au bord du lac de Constance – pour jardins, terrasses et maisons de la région des trois frontières : Autriche, Allemagne et Suisse.",
    alt: "Aquavia Spa Serenity Hot Tub : sur une terrasse",
    crumb: "Acheter un spa",
  },
  facts: [
    { label: "Autriche", value: "Livraison et montage sur demande, coordonnés avec l’électricien et le plombier" },
    { label: "Allemagne", value: "Pas de douane : l’Autriche et l’Allemagne font partie du marché intérieur de l’UE ; livraison sur demande" },
    { label: "Suisse", value: "Livraison sur demande ; s’ajoutent l’exportation et le dédouanement, dont nous vous expliquons les étapes" },
  ],
  intro: {
    eyebrow: "Spa · Vorarlberg · Lac de Constance",
    heading: "Un spa adapté au jardin et à la maison",
    paragraphs: [
      "Un spa au jardin ou un spa privé dans la maison est plus qu’un bassin : il lui faut un support porteur, l’électricité et l’eau, de la place pour la couverture et l’entretien – et un endroit où l’on aime s’asseoir. Chez Platzhirsch Home Living à Lochau, nous planifions donc le spa comme une pièce : avec la terrasse, la protection des regards, la lumière et le mobilier voisin.",
      "Nous planifions avec les spas d’Aquavia Spa, de Cervera en Catalogne – pour l’intérieur et l’extérieur, à encastrer ou à débordement, ainsi que des swim spas et un bassin d’eau froide – et avec le spa Air Bath de Starpool, du Trentin. Jardin à Dornbirn, terrasse au bord du lac de Constance ou maison dans la vallée du Rhin : livraison et montage sont possibles sur demande, en Allemagne, en Suisse et au Liechtenstein sur demande également.",
    ],
    benefits: [
      "Emplacement du spa dessiné à la main, puis planifié en 3D",
      "Aquavia Spa : spas pour l’intérieur, l’extérieur et l’encastrement, swim spas et bassin d’eau froide",
      "Terrasse, jardin et séjour conçus par un seul interlocuteur",
      "Livraison et montage sur demande, coordonnés avec l’électricien et le plombier",
    ],
    imageAlt: "Aquavia Spa Capri Hot Tub : encastré dans une estrade en bois dans une pièce intérieure",
  },
  steps: {
    eyebrow: "Comment naît l’emplacement de votre spa",
    heading: "De la première idée au montage",
    items: [
      { title: "Conseil à Lochau", text: "Nous parlons usage, nombre de places et implantation – intérieur ou extérieur – et comparons modèles, habillages et couvertures à l’aide de la documentation des fabricants et d’échantillons." },
      { title: "Dessiné à la main", text: "Harald Menghin dessine d’abord la terrasse ou l’espace spa à la main : emprise, circulations, protection des regards et lumière. Ensuite, nous planifions en 3D avec des cotes exactes." },
      { title: "Technique et corps de métier", text: "Support, alimentation électrique, arrivée et évacuation d’eau figurent dans le plan, et nous les coordonnons avec l’électricien, le plombier et, au besoin, un ingénieur structure. Ce dont votre emplacement a besoin se règle lors du rendez-vous." },
      { title: "Livraison et montage", text: "Au préalable, nous vérifions l’accès et le passage. Nous coordonnons livraison et montage sur demande – en Autriche, en Allemagne et en Suisse sur demande ; pour la Suisse s’ajoutent l’exportation et le dédouanement." },
    ],
    links: [
      { label: "Notre méthode en détail" },
      { label: "Aquavia Spa : les spas au catalogue" },
      { label: "Tous les spas au catalogue" },
      { label: "Swim spa : nager et se détendre sur quelques mètres" },
      { label: "Mosaïque de verre Ezarri pour piscine et spa" },
      { label: "Acheter depuis la Suisse : exportation et dédouanement" },
      { label: "Service hivernal pour le mobilier d’extérieur" },
      { label: "Service d’entretien pour meubles et revêtements" },
    ],
  },
  gallery: [
    { alt: "Aquavia Spa Serenity Hot Tub : sur une terrasse, vue rapprochée" },
    { alt: "Aquavia Spa Swimspa Amazon : sur une terrasse en bois dans le jardin" },
    { alt: "Starpool Air Bath : spa sur une terrasse extérieure" },
  ],
  showroom: {
    heading: "Conseil spa au bord du lac de Constance",
    text: "À quelques minutes de Bregenz, nous présentons des meubles et des luminaires de marques de design internationales. Les spas, nous en parlons lors du rendez-vous à l’aide de la documentation des fabricants, d’échantillons et de plans, et nous vous montrons votre emplacement en 3D. À la prise de rendez-vous, nous vous indiquons si des modèles sont actuellement visibles, et lesquels.",
  },
  cta: {
    heading: "Planifions votre spa",
    text: "Prenez un rendez-vous de conseil sans engagement à Lochau – ou écrivez-nous où le spa doit prendre place.",
  },
  faq: {
    heading: "Questions sur l’achat d’un spa",
    items: [
      { q: "Comment se déroule la planification d’un spa chez Platzhirsch ?", a: "Lors d’un premier entretien, nous précisons l’usage, le nombre de places et l’implantation. Harald Menghin dessine votre emplacement à la main, puis nous planifions en 3D avec cotes, support et raccordements. Vous choisissez le modèle et l’équipement à l’aide de la documentation des fabricants et d’échantillons. Pour finir, nous coordonnons livraison et montage avec les corps de métier." },
      { q: "Spa intérieur ou extérieur : à quoi faut-il penser ?", a: "À l’extérieur, un spa a besoin d’un support plan et porteur, de place pour la couverture et l’entretien, et d’un accès pour la livraison. Sur une terrasse, un balcon ou un toit, un ingénieur structure vérifie la capacité portante ; votre commune vous indique si une déclaration de travaux est nécessaire. À l’intérieur s’ajoutent la ventilation, la protection contre l’humidité, un siphon de sol et le passage pour l’acheminement. Ce dont votre emplacement a besoin se règle lors du rendez-vous." },
      { q: "Quels raccordements faut-il pour un spa ?", a: "L’électricité, une arrivée d’eau et une évacuation pour la vidange. Le raccordement électrique est réalisé par une entreprise d’électricité habilitée ; la tension requise figure dans les données du fabricant. Nous dessinons le tracé des câbles et le point de raccordement dans le plan – les détails se règlent lors du rendez-vous avec l’électricien et le plombier." },
      { q: "Livrez-vous aussi des spas en Allemagne et en Suisse ?", a: "Oui, sur demande – au Vorarlberg, en Allemagne, en Suisse et au Liechtenstein. Entre l’Autriche et l’Allemagne, il n’y a pas de douane. Pour la Suisse s’ajoutent l’exportation et le dédouanement ; nous décrivons les étapes sur platzhirsch.studio/fr/einkaufen-aus-der-schweiz et les parcourons volontiers avec vous." },
      { q: "Un spa extérieur peut-il être utilisé en hiver ?", a: "Si un modèle est conçu pour fonctionner en hiver et comment l’hiverner figure dans les données du fabricant – nous en parlons avec vous au moment du choix du modèle. Une couverture adaptée fait partie du plan dès le départ. Pour le mobilier d’extérieur autour du spa, il y a notre service hivernal avec enlèvement, entretien et stockage sur platzhirsch.studio/en/outdoor-winterservice (en anglais)." },
      { q: "Qui s’occupe de l’entretien et de la maintenance ?", a: "Le traitement de l’eau et la maintenance suivent les données du fabricant de votre modèle ; des kits d’entretien et des accessoires adaptés figurent au catalogue. Pour les revêtements, le cuir et le bois des meubles autour du spa, nous proposons un service d’entretien : platzhirsch.studio/fr/pflege-service." },
    ],
  },
};

const IT = {
  processText:
    "Harald Menghin disegna prima a mano il posto per la vostra vasca idromassaggio: ingombro, percorsi, schermatura, luce e gli arredi accanto. Poi progettiamo in 3D con misure, base e allacciamenti, e vedete terrazza o ambiente spa in un rendering prima di ordinare qualsiasi cosa.",
  banner: {
    title: "Acquistare una vasca idromassaggio in Vorarlberg: idromassaggio da esterno e spa privata",
    lead: "Progettata a Lochau sul Lago di Costanza – per giardini, terrazze e case nella regione dei tre confini: Austria, Germania e Svizzera.",
    alt: "Aquavia Spa Serenity Hot Tub: su una terrazza",
    crumb: "Acquistare un idromassaggio",
  },
  facts: [
    { label: "Austria", value: "Consegna e montaggio su richiesta, coordinati con elettricista e idraulico" },
    { label: "Germania", value: "Nessuna dogana: Austria e Germania fanno parte del mercato interno UE; consegna su richiesta" },
    { label: "Svizzera", value: "Consegna su richiesta; si aggiungono esportazione e sdoganamento, di cui vi spieghiamo i passaggi" },
  ],
  intro: {
    eyebrow: "Idromassaggio · Vorarlberg · Lago di Costanza",
    heading: "Una vasca idromassaggio adatta a giardino e casa",
    paragraphs: [
      "Una vasca idromassaggio in giardino o una spa privata in casa è più di una vasca: ha bisogno di una base portante, di corrente e acqua, di spazio per copertura e manutenzione – e di un posto in cui ci si siede volentieri. Da Platzhirsch Home Living a Lochau progettiamo quindi l’idromassaggio come un ambiente: con terrazza, schermatura, luce e gli arredi accanto.",
      "Progettiamo con le vasche idromassaggio di Aquavia Spa di Cervera, in Catalogna – per interni ed esterni, a incasso o a sfioro, oltre a swim spa e a una vasca di acqua fredda – e con l’idromassaggio Air Bath di Starpool, dal Trentino. Giardino a Dornbirn, terrazza sul Lago di Costanza o casa nella valle del Reno: consegna e montaggio sono disponibili su richiesta, in Germania, Svizzera e Liechtenstein su richiesta.",
    ],
    benefits: [
      "Posto per l’idromassaggio disegnato a mano, poi progettato in 3D",
      "Aquavia Spa: vasche idromassaggio per interni, esterni e a incasso, swim spa e vasca di acqua fredda",
      "Terrazza, giardino e zona living progettati da un solo interlocutore",
      "Consegna e montaggio su richiesta, coordinati con elettricista e idraulico",
    ],
    imageAlt: "Aquavia Spa Capri Hot Tub: incassata in una pedana in legno in un ambiente interno",
  },
  steps: {
    eyebrow: "Come nasce il posto per il vostro idromassaggio",
    heading: "Dalla prima idea al montaggio",
    items: [
      { title: "Consulenza a Lochau", text: "Parliamo di uso, numero di posti e collocazione – all’interno o all’esterno – e confrontiamo modelli, pannellature e coperture con la documentazione dei produttori e i campioni." },
      { title: "Disegnato a mano", text: "Harald Menghin disegna prima a mano la terrazza o l’ambiente spa: ingombro, percorsi, schermatura e luce. Poi progettiamo in 3D con misure esatte." },
      { title: "Tecnica e artigiani", text: "Base, alimentazione elettrica, carico e scarico dell’acqua entrano nel progetto e li coordiniamo con elettricista, idraulico e, se serve, con un ingegnere strutturista. Di cosa ha bisogno il vostro posto lo chiariamo all’appuntamento." },
      { title: "Consegna e montaggio", text: "Prima verifichiamo accesso e percorso di ingresso. Coordiniamo consegna e montaggio su richiesta – in Austria, Germania e Svizzera su richiesta; per la Svizzera si aggiungono esportazione e sdoganamento." },
    ],
    links: [
      { label: "Il nostro metodo nel dettaglio" },
      { label: "Aquavia Spa: le vasche idromassaggio a catalogo" },
      { label: "Tutte le vasche idromassaggio a catalogo" },
      { label: "Swim spa: nuotare e rilassarsi in pochi metri" },
      { label: "Mosaico di vetro Ezarri per piscina e spa" },
      { label: "Acquistare dalla Svizzera: esportazione e sdoganamento" },
      { label: "Servizio invernale per gli arredi outdoor" },
      { label: "Servizio di cura per arredi e imbottiti" },
    ],
  },
  gallery: [
    { alt: "Aquavia Spa Serenity Hot Tub: su una terrazza, vista ravvicinata" },
    { alt: "Aquavia Spa Swimspa Amazon: su un deck in legno in giardino" },
    { alt: "Starpool Air Bath: vasca idromassaggio su una terrazza all’aperto" },
  ],
  showroom: {
    heading: "Consulenza idromassaggio sul Lago di Costanza",
    text: "A pochi minuti da Bregenz presentiamo arredi e lampade di marchi di design internazionali. Delle vasche idromassaggio parliamo all’appuntamento con la documentazione dei produttori, i campioni e le piante, e vi mostriamo il vostro posto in 3D. Se e quali modelli sono visibili in questo momento ve lo diciamo quando fissate l’appuntamento.",
  },
  cta: {
    heading: "Progettiamo la vostra vasca idromassaggio",
    text: "Fissate un appuntamento di consulenza senza impegno a Lochau – oppure scriveteci dove dovrà stare l’idromassaggio.",
  },
  faq: {
    heading: "Domande sull’acquisto di una vasca idromassaggio",
    items: [
      { q: "Come si svolge la progettazione di un idromassaggio da Platzhirsch?", a: "In un primo colloquio chiariamo uso, numero di posti e collocazione. Harald Menghin disegna il vostro posto a mano, poi progettiamo in 3D con misure, base e allacciamenti. Modello e dotazione li scegliete con la documentazione dei produttori e i campioni. Infine coordiniamo consegna e montaggio con gli artigiani." },
      { q: "Idromassaggio all’interno o all’esterno: a cosa fare attenzione?", a: "All’aperto una vasca idromassaggio ha bisogno di una base piana e portante, di spazio per copertura e manutenzione e di un accesso per la consegna. Su terrazza, balcone o tetto un ingegnere strutturista verifica la portata; il vostro comune vi dice se serve una comunicazione edilizia. In casa si aggiungono ventilazione, protezione dall’umidità, scarico a pavimento e percorso di ingresso. Di cosa ha bisogno il vostro posto lo chiariamo all’appuntamento." },
      { q: "Quali allacciamenti servono per una vasca idromassaggio?", a: "Corrente, carico dell’acqua e uno scarico per lo svuotamento. L’allacciamento elettrico è eseguito da un’impresa elettrica abilitata; la tensione richiesta da un modello è nei dati del produttore. Disegniamo percorso dei cavi e punto di allacciamento nel progetto – i dettagli li concordiamo all’appuntamento con elettricista e idraulico." },
      { q: "Consegnate vasche idromassaggio anche in Germania e in Svizzera?", a: "Sì, su richiesta – in Vorarlberg, Germania, Svizzera e Liechtenstein. Tra Austria e Germania non c’è dogana. Per la Svizzera si aggiungono esportazione e sdoganamento; i passaggi li descriviamo su platzhirsch.studio/it/einkaufen-aus-der-schweiz e li vediamo volentieri insieme a voi." },
      { q: "Un idromassaggio da esterno si può usare in inverno?", a: "Se un modello è progettato per l’uso in inverno e come si mette a riposo è nei dati del produttore – ne parliamo con voi nella scelta del modello. Una copertura adatta fa parte del progetto fin dall’inizio. Per gli arredi outdoor intorno alla vasca c’è il nostro servizio invernale con ritiro, cura e deposito su platzhirsch.studio/en/outdoor-winterservice (in inglese)." },
      { q: "Chi si occupa di cura e manutenzione?", a: "Trattamento dell’acqua e manutenzione seguono i dati del produttore del vostro modello; kit di cura e accessori adatti sono a catalogo. Per imbottiti, pelle e legno degli arredi intorno all’idromassaggio offriamo un servizio di cura: platzhirsch.studio/it/pflege-service." },
    ],
  },
};

export const INTL = { en: EN, fr: FR, it: IT };
