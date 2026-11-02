// src/lib/content/landingKern/kueche.js – EN/FR/IT der Seite
// /<locale>/kuechen-vorarlberg. Mastertext: CONTENT in
// src/app/[locale]/kuechen-vorarlberg/page.js (Deutsch, bleibt dort).
// Nur Texte – Bilder, Slugs, Thema und Linkziele kommen aus der deutschen
// Fassung (mergeText in ./index.js, gleiche Reihenfolge der Listen).
// Regeln wie im Deutschen: Poliform und next125 nur als Marken, mit denen wir
// PLANEN (keine Ausstellungs- oder Händleraussage), Gerätemarken ohne
// Händlerwort, kein Preis, keine Lieferfrist, Lieferung „auf Wunsch“.

export const META = {
  en: {
    title: "Kitchen studio in Vorarlberg",
    description:
      "Designer kitchens from Lochau, drawn by hand: Poliform, next125 and appliances by Gaggenau, Miele and BORA. Delivery and installation on request.",
    og: { eyebrow: "Kitchen planning", title: "Designer kitchens in Vorarlberg" },
  },
  fr: {
    title: "Studio de cuisines au Vorarlberg",
    description:
      "Cuisines design à Lochau, dessinées à la main : Poliform, next125, électroménager Gaggenau, Miele et BORA. Livraison et pose sur demande.",
    og: { eyebrow: "Conception de cuisine", title: "Cuisines design au Vorarlberg" },
  },
  it: {
    title: "Studio cucine in Vorarlberg",
    description:
      "Cucine di design da Lochau, disegnate a mano: Poliform, next125 ed elettrodomestici Gaggenau, Miele e BORA. Consegna e montaggio su richiesta.",
    og: { eyebrow: "Progettazione cucine", title: "Cucine di design in Vorarlberg" },
  },
};

const EN = {
  processText:
    "Harald Menghin first draws your kitchen by hand: routes, work triangle, storage and light. Then we plan it in 3D with exact dimensions and connections, and you see fronts, worktop and lighting as a rendering before anything is ordered.",
  banner: {
    title: "Kitchen studio in Vorarlberg: designer kitchens from Lochau",
    lead: "Planned in person in Lochau on Lake Constance – tailored to your room, your everyday life and the living area next to it.",
    alt: "Designer kitchen with a white island and dark tall units",
    crumb: "Kitchens Vorarlberg",
  },
  intro: {
    eyebrow: "Kitchen studio on Lake Constance",
    heading: "Designer kitchens that fit your life",
    paragraphs: [
      "The kitchen has long been more than a place to work – it is the heart of the home. At Platzhirsch Home Living in Lochau we plan kitchens that combine function and design: with brands such as Poliform and next125, high-quality materials and a plan tailored to your room and your everyday life.",
      "Whether a new build in Bregenz, an older house in Dornbirn or a flat on Lake Constance – we accompany you from the first idea to the fully installed kitchen.",
    ],
    benefits: [
      "Kitchen planning drawn by hand, then in 3D",
      "Compare fronts, worktops and materials from brands such as Poliform and next125 at your appointment",
      "Kitchen and living area planned by one team",
      "Delivery and installation on request",
    ],
    imageAlt: "Modern designer kitchen with an island and an open living area",
  },
  brands: {
    eyebrow: "Kitchen brands we plan with",
    heading: "International kitchen brands, planned in person",
    items: [
      {
        imageAlt: "Poliform kitchen",
        text: "Italian kitchens with clear architecture, wood surfaces and integrated appliances – for open-plan kitchens where cooking and living merge.",
      },
      {
        imageAlt: "next125 kitchen",
        text: "German precision with a wide choice of materials and colours – from concrete and ceramic fronts to warm oak surfaces, combined individually.",
      },
    ],
    cta: { label: "View all kitchens" },
  },
  steps: {
    eyebrow: "How your kitchen comes about",
    heading: "From the first idea to installation",
    items: [
      { title: "Consultation in Lochau", text: "We get to know you, your room and your habits – and compare fronts, worktops and surfaces with you using samples." },
      { title: "Drawn by hand", text: "Harald Menghin first draws your kitchen by hand: routes, work triangle, storage and light. Then we plan it in 3D with exact dimensions and connections." },
      { title: "Materials & details", text: "Together you choose surfaces, colours and fittings – down to the last handle and the interior lighting." },
      { title: "Delivery & installation", text: "We coordinate delivery and installation so that your kitchen ends up exactly as it was planned." },
    ],
    links: [
      { label: "How we work in detail" },
      { label: "Kitchen planner: pre-plan your kitchen online" },
      { label: "See the light in your kitchen" },
      { label: "Guide: what does a designer kitchen cost?" },
      { label: "Taps and fittings by Dornbracht" },
      { label: "Plan an outdoor kitchen for garden and terrace" },
    ],
  },
  gallery: [
    { alt: "Kitchen with a white island and dark tall units" },
    { alt: "Kitchen with concrete fronts and an oak wall" },
    { alt: "Open kitchen with a walnut island and dining table" },
  ],
  showroom: {
    heading: "Kitchen planning right on Lake Constance",
    text: "Just a few minutes from Bregenz we show furniture and lights by international design brands. For your kitchen planning we recommend booking an appointment – then we take enough time and have the right samples ready.",
  },
  cta: {
    heading: "Let’s plan your new kitchen",
    text: "Arrange a no-obligation consultation in our showroom in Lochau.",
  },
  faq: {
    heading: "Questions about kitchen planning",
    items: [
      { q: "Which kitchen brands do you plan with?", a: "For kitchens we plan with Poliform and next125, among others. In the consultation we work out together which brand suits your project better." },
      { q: "How does kitchen planning at Platzhirsch work?", a: "After a first conversation in the showroom, we plan your kitchen based on your room dimensions and wishes. Then you choose fronts, worktops, appliances and details together with us. Finally, we coordinate delivery and installation." },
      { q: "Can I plan my kitchen online first?", a: "Yes. With the kitchen planner at platzhirsch.studio/en/kuechenplaner you lay out the floor plan and units yourself, in 2D and 3D. If you then plan with us, Harald Menghin continues your kitchen by hand, and we check dimensions and connections on site." },
      { q: "Do I need an appointment for a consultation?", a: "You are welcome at any time during our opening hours (Tue–Fri 10 am–6 pm, Sat 10 am–2 pm). For detailed kitchen planning we recommend an appointment so that we can take enough time for you." },
      { q: "How long does it take from planning to the finished kitchen?", a: "That depends on the brand, the design and the scope of your project. We give you a binding time frame as soon as the planning is settled." },
      { q: "Do you also plan kitchens for renovations and older buildings?", a: "Yes. Whether new build, renovation or older building – we adapt the planning to the structural conditions and take connections, sloping ceilings or unusual room shapes into account." },
      { q: "Are the appliances included in the planning?", a: "Yes. Oven, hob, extractor, fridge and dishwasher are integrated into the planning from the start, so that technology and design fit together. We plan in appliances by Gaggenau, Miele, V-ZUG, BORA, Liebherr and Quooker – delivered and installed by us." },
      { q: "Can I compare fronts and materials before planning?", a: "Yes. At your consultation in Lochau you compare fronts, worktops and surfaces using samples. When you book your appointment, we are happy to tell you whether any kitchens are currently on display, and which ones." },
      { q: "What should I bring to the first consultation?", a: "A floor plan or the dimensions of your room, photos of the current situation and – if you have them – ideas or pictures you like are helpful." },
      { q: "Do you also plan the living and dining area around the kitchen?", a: "Yes. Alongside kitchens we plan with furniture, lights and accessories by international design brands and can plan kitchen, dining area and living area as one overall concept." },
      { q: "Do you deliver and install outside Vorarlberg?", a: "Delivery and installation are available on request, including outside Vorarlberg. For projects in Germany, Switzerland and Liechtenstein, please get in touch with us directly." },
    ],
  },
};

const FR = {
  processText:
    "Harald Menghin dessine d’abord votre cuisine à la main : circulations, triangle d’activité, rangements et lumière. Ensuite, nous la planifions en 3D avec des cotes et des raccordements exacts, et vous voyez façades, plan de travail et lumière en rendu avant toute commande.",
  banner: {
    title: "Studio de cuisines au Vorarlberg : cuisines design de Lochau",
    lead: "Conçue avec vous à Lochau, au bord du lac de Constance – adaptée à votre pièce, à votre quotidien et à l’espace de vie voisin.",
    alt: "Cuisine design avec îlot blanc et colonnes sombres",
    crumb: "Cuisines Vorarlberg",
  },
  intro: {
    eyebrow: "Studio de cuisines au lac de Constance",
    heading: "Des cuisines design à l’image de votre vie",
    paragraphs: [
      "La cuisine est depuis longtemps plus qu’un lieu de travail – c’est le cœur de la maison. Chez Platzhirsch Home Living à Lochau, nous concevons des cuisines qui allient fonction et design : avec des marques comme Poliform et next125, des matériaux de qualité et une planification adaptée à votre pièce et à votre quotidien.",
      "Construction neuve à Bregenz, maison ancienne à Dornbirn ou appartement au bord du lac de Constance – nous vous accompagnons de la première idée à la cuisine entièrement posée.",
    ],
    benefits: [
      "Cuisine dessinée à la main, puis planifiée en 3D",
      "Comparer façades, plans de travail et matériaux de marques comme Poliform et next125 lors du rendez-vous",
      "Cuisine et séjour conçus par un seul interlocuteur",
      "Livraison et pose sur demande",
    ],
    imageAlt: "Cuisine design moderne avec îlot et séjour ouvert",
  },
  brands: {
    eyebrow: "Marques de cuisine avec lesquelles nous concevons",
    heading: "Des marques internationales, une conception personnelle",
    items: [
      {
        imageAlt: "Cuisine Poliform",
        text: "Cuisines italiennes à l’architecture claire, aux surfaces en bois et à l’électroménager intégré – pour des cuisines ouvertes où cuisiner et vivre se rejoignent.",
      },
      {
        imageAlt: "Cuisine next125",
        text: "Précision allemande et grand choix de matériaux et de couleurs – des façades en béton et en céramique aux surfaces chaleureuses en chêne, à combiner librement.",
      },
    ],
    cta: { label: "Voir toutes les cuisines" },
  },
  steps: {
    eyebrow: "Comment naît votre cuisine",
    heading: "De la première idée à la pose",
    items: [
      { title: "Conseil à Lochau", text: "Nous apprenons à vous connaître, vous, votre pièce et vos habitudes – et comparons avec vous façades, plans de travail et surfaces à l’aide d’échantillons." },
      { title: "Dessinée à la main", text: "Harald Menghin dessine d’abord votre cuisine à la main : circulations, triangle d’activité, rangements et lumière. Ensuite, nous la planifions en 3D avec des cotes et des raccordements exacts." },
      { title: "Matériaux et détails", text: "Ensemble, vous choisissez surfaces, couleurs et équipements – jusqu’à la dernière poignée et à l’éclairage intérieur." },
      { title: "Livraison et pose", text: "Nous coordonnons la livraison et la pose, pour que votre cuisine soit exactement telle qu’elle a été planifiée." },
    ],
    links: [
      { label: "Notre méthode en détail" },
      { label: "Planificateur de cuisine : préparer sa cuisine en ligne" },
      { label: "Voir la lumière dans votre cuisine" },
      { label: "Guide : combien coûte une cuisine design ?" },
      { label: "Robinetterie Dornbracht" },
      { label: "Concevoir une cuisine d’extérieur pour jardin et terrasse" },
    ],
  },
  gallery: [
    { alt: "Cuisine avec îlot blanc et colonnes sombres" },
    { alt: "Cuisine aux façades en béton et mur en chêne" },
    { alt: "Cuisine ouverte avec îlot en noyer et table à manger" },
  ],
  showroom: {
    heading: "Concevoir sa cuisine au bord du lac de Constance",
    text: "À quelques minutes de Bregenz, nous présentons des meubles et des luminaires de marques de design internationales. Pour la conception de votre cuisine, nous vous recommandons de prendre rendez-vous – nous prenons alors le temps nécessaire et préparons les échantillons adaptés.",
  },
  cta: {
    heading: "Concevons votre nouvelle cuisine",
    text: "Prenez un rendez-vous de conseil sans engagement dans notre showroom à Lochau.",
  },
  faq: {
    heading: "Questions sur la conception de cuisine",
    items: [
      { q: "Avec quelles marques de cuisine travaillez-vous ?", a: "Pour les cuisines, nous concevons notamment avec Poliform et next125. Lors de l’entretien conseil, nous déterminons ensemble la marque qui convient le mieux à votre projet." },
      { q: "Comment se déroule la conception d’une cuisine chez Platzhirsch ?", a: "Après un premier échange au showroom, nous planifions votre cuisine d’après les dimensions de votre pièce et vos souhaits. Ensuite, vous choisissez avec nous façades, plans de travail, électroménager et détails. Pour finir, nous coordonnons la livraison et la pose." },
      { q: "Puis-je d’abord planifier ma cuisine en ligne ?", a: "Oui. Avec le planificateur de cuisine sur platzhirsch.studio/fr/kuechenplaner, vous dessinez vous-même le plan et les linéaires, en 2D et en 3D. Si vous poursuivez ensuite avec nous, Harald Menghin reprend votre cuisine à la main, et nous vérifions cotes et raccordements sur place." },
      { q: "Faut-il un rendez-vous pour le conseil ?", a: "Vous êtes les bienvenus à tout moment pendant nos heures d’ouverture (mar–ven 10 h–18 h, sam 10 h–14 h). Pour une conception de cuisine détaillée, nous recommandons un rendez-vous afin de prendre le temps nécessaire pour vous." },
      { q: "Combien de temps faut-il entre la conception et la cuisine terminée ?", a: "Cela dépend de la marque, de l’exécution et de l’ampleur de votre projet. Nous vous indiquons un délai ferme dès que la planification est arrêtée." },
      { q: "Concevez-vous aussi des cuisines pour des rénovations et des bâtiments anciens ?", a: "Oui. Construction neuve, transformation ou bâtiment ancien – nous adaptons la planification aux contraintes du bâti et tenons compte des raccordements, des sous-pentes ou des formes de pièce particulières." },
      { q: "L’électroménager est-il intégré à la conception ?", a: "Oui. Four, plaque de cuisson, hotte, réfrigérateur et lave-vaisselle sont intégrés dès le départ, pour que technique et design s’accordent. Nous prévoyons des appareils Gaggenau, Miele, V-ZUG, BORA, Liebherr et Quooker – livraison et pose par nos soins." },
      { q: "Puis-je comparer façades et matériaux avant la conception ?", a: "Oui. Lors du rendez-vous à Lochau, vous comparez façades, plans de travail et surfaces à l’aide d’échantillons. À la prise de rendez-vous, nous vous indiquons volontiers si des cuisines sont actuellement exposées, et lesquelles." },
      { q: "Que faut-il apporter au premier rendez-vous ?", a: "Un plan ou les dimensions de votre pièce, des photos de la situation actuelle et – si vous en avez – des idées ou des images qui vous plaisent vous seront utiles." },
      { q: "Concevez-vous aussi le séjour et la salle à manger autour de la cuisine ?", a: "Oui. Outre les cuisines, nous concevons avec des meubles, des luminaires et des accessoires de marques de design internationales et pouvons penser cuisine, coin repas et séjour comme un ensemble." },
      { q: "Livrez-vous et posez-vous aussi hors du Vorarlberg ?", a: "La livraison et la pose sont possibles sur demande, y compris hors du Vorarlberg. Pour des projets en Allemagne, en Suisse et au Liechtenstein, contactez-nous directement." },
    ],
  },
};

const IT = {
  processText:
    "Harald Menghin disegna prima la vostra cucina a mano: percorsi, triangolo di lavoro, contenimento e luce. Poi la progettiamo in 3D con misure e allacciamenti esatti, e vedete ante, piano di lavoro e luce in un rendering prima di ordinare qualsiasi cosa.",
  banner: {
    title: "Studio cucine in Vorarlberg: cucine di design da Lochau",
    lead: "Progettata di persona a Lochau sul Lago di Costanza – su misura del vostro ambiente, della vostra quotidianità e della zona living accanto.",
    alt: "Cucina di design con isola bianca e colonne scure",
    crumb: "Cucine Vorarlberg",
  },
  intro: {
    eyebrow: "Studio cucine sul Lago di Costanza",
    heading: "Cucine di design che si adattano alla vostra vita",
    paragraphs: [
      "La cucina è da tempo più di un luogo di lavoro – è il cuore della casa. Da Platzhirsch Home Living a Lochau progettiamo cucine che uniscono funzione e design: con marchi come Poliform e next125, materiali di qualità e un progetto pensato per il vostro ambiente e la vostra quotidianità.",
      "Nuova costruzione a Bregenz, casa d’epoca a Dornbirn o appartamento sul Lago di Costanza – vi accompagniamo dalla prima idea alla cucina montata.",
    ],
    benefits: [
      "Cucina disegnata a mano, poi progettata in 3D",
      "Confrontare all’appuntamento ante, piani di lavoro e materiali di marchi come Poliform e next125",
      "Cucina e zona living progettate da un unico interlocutore",
      "Consegna e montaggio su richiesta",
    ],
    imageAlt: "Cucina di design moderna con isola e zona living aperta",
  },
  brands: {
    eyebrow: "Marchi di cucine con cui progettiamo",
    heading: "Marchi internazionali, un progetto personale",
    items: [
      {
        imageAlt: "Cucina Poliform",
        text: "Cucine italiane dall’architettura chiara, con superfici in legno ed elettrodomestici integrati – per cucine aperte in cui cucinare e vivere si fondono.",
      },
      {
        imageAlt: "Cucina next125",
        text: "Precisione tedesca con un’ampia scelta di materiali e colori – dalle ante in cemento e ceramica alle calde superfici in rovere, da combinare liberamente.",
      },
    ],
    cta: { label: "Guardate tutte le cucine" },
  },
  steps: {
    eyebrow: "Come nasce la vostra cucina",
    heading: "Dalla prima idea al montaggio",
    items: [
      { title: "Consulenza a Lochau", text: "Conosciamo voi, il vostro ambiente e le vostre abitudini – e confrontiamo con voi ante, piani di lavoro e superfici sui campioni." },
      { title: "Disegnata a mano", text: "Harald Menghin disegna prima la vostra cucina a mano: percorsi, triangolo di lavoro, contenimento e luce. Poi la progettiamo in 3D con misure e allacciamenti esatti." },
      { title: "Materiali e dettagli", text: "Insieme scegliete superfici, colori e dotazioni – fino all’ultima maniglia e all’illuminazione interna." },
      { title: "Consegna e montaggio", text: "Coordiniamo consegna e montaggio, perché alla fine la vostra cucina sia esattamente come è stata progettata." },
    ],
    links: [
      { label: "Il nostro metodo nel dettaglio" },
      { label: "Planner cucina: progettate la cucina online" },
      { label: "Guardate la luce nella vostra cucina" },
      { label: "Guida: quanto costa una cucina di design?" },
      { label: "Rubinetteria Dornbracht" },
      { label: "Progettare una cucina outdoor per giardino e terrazza" },
    ],
  },
  gallery: [
    { alt: "Cucina con isola bianca e colonne scure" },
    { alt: "Cucina con ante in cemento e parete in rovere" },
    { alt: "Cucina aperta con isola in noce e tavolo da pranzo" },
  ],
  showroom: {
    heading: "Progettare la cucina sul Lago di Costanza",
    text: "A pochi minuti da Bregenz presentiamo arredi e lampade di marchi di design internazionali. Per la progettazione della vostra cucina conviene fissare un appuntamento – così ci prendiamo il tempo necessario e prepariamo i campioni giusti.",
  },
  cta: {
    heading: "Progettiamo la vostra nuova cucina",
    text: "Fissate un appuntamento di consulenza senza impegno nel nostro showroom a Lochau.",
  },
  faq: {
    heading: "Domande sulla progettazione della cucina",
    items: [
      { q: "Con quali marchi di cucine progettate?", a: "Per le cucine progettiamo tra l’altro con Poliform e next125. Quale marchio si adatta meglio al vostro progetto lo chiariamo insieme durante la consulenza." },
      { q: "Come si svolge la progettazione della cucina da Platzhirsch?", a: "Dopo un primo colloquio nello showroom progettiamo la vostra cucina in base alle misure dell’ambiente e ai vostri desideri. Poi scegliete con noi ante, piani di lavoro, elettrodomestici e dettagli. Infine coordiniamo consegna e montaggio." },
      { q: "Posso progettare prima la cucina online?", a: "Sì. Con il planner cucina su platzhirsch.studio/it/kuechenplaner impostate da soli pianta e composizioni, in 2D e 3D. Se poi progettate con noi, Harald Menghin prosegue la vostra cucina a mano, e verifichiamo misure e allacciamenti sul posto." },
      { q: "Serve un appuntamento per la consulenza?", a: "Siete i benvenuti in qualsiasi momento durante i nostri orari di apertura (mar–ven 10–18, sab 10–14). Per una progettazione dettagliata della cucina consigliamo un appuntamento, così possiamo dedicarvi il tempo necessario." },
      { q: "Quanto tempo passa dalla progettazione alla cucina finita?", a: "Dipende da marchio, esecuzione e dimensioni del vostro progetto. Vi indichiamo i tempi in modo vincolante non appena il progetto è definito." },
      { q: "Progettate cucine anche per ristrutturazioni ed edifici d’epoca?", a: "Sì. Nuova costruzione, ristrutturazione o edificio d’epoca – adattiamo il progetto alle condizioni costruttive e teniamo conto di allacciamenti, mansarde o forme particolari degli ambienti." },
      { q: "Gli elettrodomestici sono inclusi nella progettazione?", a: "Sì. Forno, piano cottura, cappa, frigorifero e lavastoviglie sono integrati nel progetto fin dall’inizio, perché tecnica e design siano coerenti. Prevediamo elettrodomestici Gaggenau, Miele, V-ZUG, BORA, Liebherr e Quooker – consegna e montaggio a cura nostra." },
      { q: "Posso confrontare ante e materiali prima della progettazione?", a: "Sì. All’appuntamento di consulenza a Lochau confrontate ante, piani di lavoro e superfici sui campioni. Se e quali cucine sono esposte in questo momento ve lo diciamo volentieri quando fissate l’appuntamento." },
      { q: "Cosa devo portare al primo appuntamento?", a: "Sono utili una pianta o le misure del vostro ambiente, foto della situazione attuale e – se le avete – idee o immagini che vi piacciono." },
      { q: "Progettate anche la zona living e pranzo intorno alla cucina?", a: "Sì. Oltre alle cucine progettiamo con arredi, lampade e accessori di marchi di design internazionali e possiamo progettare cucina, zona pranzo e living come un unico concept." },
      { q: "Consegnate e montate anche fuori dal Vorarlberg?", a: "Consegna e montaggio sono disponibili su richiesta, anche fuori dal Vorarlberg. Per progetti in Germania, Svizzera e Liechtenstein contattateci direttamente." },
    ],
  },
};

export const INTL = { en: EN, fr: FR, it: IT };
