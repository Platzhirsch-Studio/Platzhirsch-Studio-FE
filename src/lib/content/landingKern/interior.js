// src/lib/content/landingKern/interior.js – EN/FR/IT der Seite
// /<locale>/interior-design-vorarlberg. Mastertext: CONTENT in
// src/app/[locale]/interior-design-vorarlberg/page.js (Deutsch, bleibt dort).
// Nur Texte (mergeText in ./index.js). Die sieben Schritte wie /arbeitsweise,
// Hotel & Objekt ohne Referenzen und ohne Konditionen („auf Anfrage“),
// Liefergebiet nur „auf Wunsch“ (Inhaber-Entscheidung Nr. 3).

export const META = {
  en: {
    title: "Interior design in Vorarlberg – drawn by hand",
    description:
      "Interior planning in Vorarlberg: surveyed on site, drawn by hand, planned in 3D. Furniture, systems and lighting by international brands.",
    og: { eyebrow: "Interior design", title: "Interior design in Vorarlberg" },
  },
  fr: {
    title: "Design d’intérieur au Vorarlberg",
    description:
      "Aménagement intérieur au Vorarlberg : relevé sur place, dessin à la main, plan 3D. Meubles, systèmes et lumière de marques internationales.",
    og: { eyebrow: "Design d’intérieur", title: "Aménagement intérieur au Vorarlberg" },
  },
  it: {
    title: "Interior design in Vorarlberg – disegnato a mano",
    description:
      "Progettazione d’interni in Vorarlberg: rilievo sul posto, disegno a mano, progetto 3D. Arredi, sistemi e luce di marchi internazionali.",
    og: { eyebrow: "Interior design", title: "Interior design in Vorarlberg" },
  },
};

const EN = {
  banner: {
    title: "Interior design in Vorarlberg",
    alt: "Showroom of Platzhirsch Home Living in Lochau with sofas and armchairs",
    crumb: "Interior design Vorarlberg",
  },
  intro: {
    eyebrow: "Interior advice & planning",
    heading: "Rooms that suit you – down to the detail",
    paragraphs: [
      "A successful interior comes about when furniture, materials and light work together. At Platzhirsch Home Living in Lochau we accompany you from the first idea to the fully furnished room – for single rooms as well as for a whole flat or house.",
      "We look at your rooms on site, including light, routes and habits. From this, Harald Menghin draws an interior concept by hand and builds a room model. Then we plan in 3D with furniture, systems, lights and accessories by international design brands, and you see the result as a rendering before anything is ordered.",
    ],
    benefits: [
      "Concept drawn by hand, then planned in 3D",
      "One point of contact for the whole project",
      "Furniture, systems, lighting and accessories from one team",
      "Delivery and installation on request",
    ],
    imageAlt: "Open living space with glass-fronted cabinets, kitchen island and round pendant light",
  },
  brands: {
    eyebrow: "Brands for your overall concept",
    heading: "Furniture, systems and lighting from one team",
    items: [
      {
        imageAlt: "Rimadesio wall system with wood panels, shelves and sideboard in a living room",
        text: "Wall systems, shelving, sliding doors and room dividers in glass and aluminium – for rooms with a clear structure and plenty of storage, fitted precisely into the architecture.",
      },
      {
        imageAlt: "Flos floor lamp with a round light disc on a chrome tripod",
        text: "Light is part of every interior concept. Flos stands for iconic lights that structure rooms, create atmosphere and become design objects in their own right.",
      },
    ],
    cta: { label: "View all products" },
  },
  steps: {
    eyebrow: "How we work",
    heading: "From hand drawing to the finished room",
    items: [
      { title: "Getting to know you", text: "In the showroom with café or at your home. You tell us how you live." },
      { title: "On site", text: "We look at light, climate and routes. If your project needs it, for a day or two." },
      { title: "Hand drawing", text: "Harald Menghin sketches floor plan, perspectives and moods by hand." },
      { title: "Model", text: "A scale model of the room, to touch and rearrange together." },
      { title: "3D planning", text: "Exact dimensions, selected products and materials." },
      { title: "Rendering", text: "A photorealistic image of your room before anything is ordered." },
      { title: "Realisation", text: "Delivery, installation on request and support until you move in." },
    ],
    links: [
      { label: "How we work in detail" },
      { label: "Find your interior style" },
      { label: "View furniture in 3D & AR" },
      { label: "Furnishing hotels & commercial projects" },
    ],
  },
  objekt: {
    eyebrow: "Hotels, restaurants & commercial projects",
    heading: "Drawn for your guests.",
    text: "For hotel rooms, restaurants, bars, lobbies or offices, the process is the same as for a home. We spend time in your building before we plan, and think room series through from the start.",
    steps: [
      { title: "On site in your building", text: "Routes of guests and staff, light, noise and cleaning. If your project needs it, we also stay for a day or two." },
      { title: "Hand drawing", text: "Harald Menghin first draws rooms and public areas by hand." },
      { title: "Model of a sample room", text: "A scale model of the room on which you weigh up variants for the room series together with us." },
      { title: "3D planning of the room series", text: "Exact dimensions, products and materials, matched to the different room sizes." },
      { title: "Rendering before the order", text: "You see rooms and public areas photorealistically before anything is ordered. We discuss with you whether a built sample room makes sense." },
      { title: "Realisation", text: "Delivery and installation on request, coordinated with your operation and the trades involved." },
    ],
    contactLabel: "Straight to the studio in Lochau",
    contactNote: "Terms for hotels, restaurants and commercial projects on request.",
    cta: { label: "Enquire about a commercial project" },
  },
  gallery: [
    { alt: "Room with a glass sliding door, wall shelving and a designer light" },
    { alt: "Dining area with a chandelier, bookshelf and a view of the garden" },
    { alt: "Workplace with a desk and floor lamp in front of a large window front" },
  ],
  showroom: {
    heading: "Gather ideas – in our showroom",
    text: "In Lochau, just a few minutes from Bregenz, we show furniture, systems and lights by our brands. Book an appointment so that we can take enough time for your project.",
  },
  cta: {
    heading: "Let’s plan your interior concept",
    text: "Arrange a no-obligation consultation in our showroom in Lochau.",
  },
  faq: {
    heading: "Questions about interior planning",
    items: [
      { q: "For which projects do you offer interior advice?", a: "For single rooms as well as for complete flats and houses – from the living room, kitchen and dining area to the bedroom or workplace." },
      { q: "How does interior planning work?", a: "After a first conversation we look at your rooms on site. Harald Menghin draws the concept by hand and, if needed, builds a model. Then we plan in 3D, show you a rendering and make the selection with you in the showroom. We coordinate delivery and installation." },
      { q: "Do I need an appointment?", a: "You are welcome at any time during our opening hours (Tue–Fri 10 am–6 pm, Sat 10 am–2 pm). For interior planning we recommend an appointment so that we can take enough time for you." },
      { q: "What should I bring to the first appointment?", a: "Floor plans or room dimensions, photos of the rooms and – if you have them – pictures or ideas you like are helpful." },
      { q: "Can I include existing furniture in the concept?", a: "Yes. We are happy to take into account pieces you want to keep and plan the new interior to match." },
      { q: "Do you also plan lighting and accessories?", a: "Yes. For us, lights, rugs and accessories belong to every interior concept – they give the room atmosphere and character." },
      { q: "Do you also plan hotels, restaurants and commercial projects?", a: "Yes. The process is the same as for a home, extended by sample rooms and room series. We give terms for commercial projects on request." },
      { q: "Do you deliver and install outside Vorarlberg?", a: "Delivery and installation are available on request, including outside Vorarlberg. For projects in Germany, Switzerland and Liechtenstein, please get in touch with us directly." },
    ],
  },
};

const FR = {
  banner: {
    title: "Design d’intérieur au Vorarlberg",
    alt: "Showroom de Platzhirsch Home Living à Lochau avec canapés et fauteuils",
    crumb: "Design d’intérieur Vorarlberg",
  },
  intro: {
    eyebrow: "Conseil et conception d’intérieur",
    heading: "Des pièces qui vous ressemblent – jusque dans le détail",
    paragraphs: [
      "Un aménagement réussi naît quand meubles, matériaux et lumière s’accordent. Chez Platzhirsch Home Living à Lochau, nous vous accompagnons de la première idée à la pièce entièrement aménagée – pour une seule pièce comme pour un appartement ou une maison entière.",
      "Nous découvrons vos pièces sur place, lumière, circulations et habitudes comprises. Harald Menghin en tire un concept d’aménagement dessiné à la main et construit une maquette de la pièce. Ensuite, nous planifions en 3D avec des meubles, systèmes, luminaires et accessoires de marques de design internationales, et vous voyez le résultat en rendu avant toute commande.",
    ],
    benefits: [
      "Concept dessiné à la main, puis planifié en 3D",
      "Un seul interlocuteur pour tout le projet",
      "Meubles, systèmes, lumière et accessoires réunis",
      "Livraison et pose sur demande",
    ],
    imageAlt: "Espace de vie ouvert avec vitrines, îlot de cuisine et suspension ronde",
  },
  brands: {
    eyebrow: "Des marques pour votre concept",
    heading: "Meubles, systèmes et lumière réunis",
    items: [
      {
        imageAlt: "Système mural Rimadesio avec panneaux en bois, étagères et buffet dans un séjour",
        text: "Systèmes muraux, étagères, portes coulissantes et cloisons en verre et aluminium – pour des pièces à la structure claire, avec beaucoup de rangement, intégrés avec précision dans l’architecture.",
      },
      {
        imageAlt: "Lampadaire Flos avec disque lumineux rond sur trépied chromé",
        text: "La lumière fait partie de tout concept d’aménagement. Flos est synonyme de luminaires iconiques qui structurent l’espace, créent une ambiance et deviennent eux-mêmes objets de design.",
      },
    ],
    cta: { label: "Voir tous les produits" },
  },
  steps: {
    eyebrow: "Notre méthode",
    heading: "Du dessin à la main à la pièce terminée",
    items: [
      { title: "Faire connaissance", text: "Au showroom avec café ou chez vous. Vous nous racontez comment vous vivez." },
      { title: "Sur place", text: "Nous observons lumière, climat et circulations. Si votre projet le demande, pendant un ou deux jours." },
      { title: "Dessin à la main", text: "Harald Menghin esquisse à la main plan, perspectives et ambiances." },
      { title: "Maquette", text: "Une maquette de la pièce à l’échelle, à toucher et à réagencer ensemble." },
      { title: "Planification 3D", text: "Cotes exactes, produits et matériaux choisis." },
      { title: "Rendu", text: "Une image photoréaliste de votre pièce avant toute commande." },
      { title: "Réalisation", text: "Livraison, pose sur demande et accompagnement jusqu’à l’emménagement." },
    ],
    links: [
      { label: "Notre méthode en détail" },
      { label: "Trouver votre style d’intérieur" },
      { label: "Voir les meubles en 3D et en RA" },
      { label: "Aménager hôtels et projets professionnels" },
    ],
  },
  objekt: {
    eyebrow: "Hôtels, restaurants et projets professionnels",
    heading: "Dessiné pour vos hôtes.",
    text: "Pour les chambres d’hôtel, le restaurant, le bar, le lobby ou les bureaux, la méthode est la même que pour un logement. Nous passons du temps dans votre établissement avant de planifier et pensons les séries de chambres dès le départ.",
    steps: [
      { title: "Sur place, dans votre établissement", text: "Parcours des hôtes et du personnel, lumière, bruit et nettoyage. Si votre projet le demande, nous restons aussi un ou deux jours." },
      { title: "Dessin à la main", text: "Harald Menghin dessine d’abord à la main les chambres et les espaces communs." },
      { title: "Maquette d’une chambre témoin", text: "Une maquette à l’échelle sur laquelle vous comparez avec nous les variantes pour la série de chambres." },
      { title: "Planification 3D des séries de chambres", text: "Cotes exactes, produits et matériaux, adaptés aux différentes tailles de chambres." },
      { title: "Rendu avant la commande", text: "Vous voyez chambres et espaces communs de façon photoréaliste avant toute commande. Nous examinons avec vous l’intérêt d’une chambre témoin réalisée." },
      { title: "Réalisation", text: "Livraison et pose sur demande, coordonnées avec votre exploitation et les corps de métier concernés." },
    ],
    contactLabel: "Directement au studio à Lochau",
    contactNote: "Conditions pour l’hôtellerie, la restauration et les projets professionnels sur demande.",
    cta: { label: "Présenter un projet professionnel" },
  },
  gallery: [
    { alt: "Pièce avec porte coulissante en verre, étagère murale et luminaire design" },
    { alt: "Coin repas avec lustre, bibliothèque et vue sur le jardin" },
    { alt: "Poste de travail avec bureau et lampadaire devant une grande baie vitrée" },
  ],
  showroom: {
    heading: "Trouver des idées – dans notre showroom",
    text: "À Lochau, à quelques minutes de Bregenz, nous présentons meubles, systèmes et luminaires de nos marques. Prenez rendez-vous : nous pourrons ainsi consacrer à votre projet tout le temps nécessaire.",
  },
  cta: {
    heading: "Élaborons votre concept d’aménagement",
    text: "Prenez un rendez-vous de conseil sans engagement dans notre showroom à Lochau.",
  },
  faq: {
    heading: "Questions sur l’aménagement intérieur",
    items: [
      { q: "Pour quels projets proposez-vous un conseil d’aménagement ?", a: "Pour une seule pièce comme pour des appartements et des maisons complets – du séjour à la cuisine et à la salle à manger, jusqu’à la chambre ou au bureau." },
      { q: "Comment se déroule la conception de l’aménagement ?", a: "Après un premier échange, nous découvrons vos pièces sur place. Harald Menghin dessine le concept à la main et construit au besoin une maquette. Ensuite, nous planifions en 3D, vous montrons un rendu et faisons la sélection avec vous au showroom. Nous coordonnons la livraison et la pose." },
      { q: "Faut-il un rendez-vous ?", a: "Vous êtes les bienvenus à tout moment pendant nos heures d’ouverture (mar–ven 10 h–18 h, sam 10 h–14 h). Pour une conception d’aménagement, nous recommandons un rendez-vous afin de prendre le temps nécessaire pour vous." },
      { q: "Que faut-il apporter au premier rendez-vous ?", a: "Des plans ou les dimensions des pièces, des photos et – si vous en avez – des images ou des idées qui vous plaisent vous seront utiles." },
      { q: "Puis-je intégrer des meubles existants au concept ?", a: "Oui. Nous tenons volontiers compte des pièces que vous souhaitez garder et concevons le nouvel aménagement en conséquence." },
      { q: "Concevez-vous aussi l’éclairage et les accessoires ?", a: "Oui. Pour nous, luminaires, tapis et accessoires font partie de tout concept d’aménagement – ils donnent à la pièce son atmosphère et son caractère." },
      { q: "Concevez-vous aussi des hôtels, des restaurants et des projets professionnels ?", a: "Oui. La méthode est la même que pour un logement, complétée par des chambres témoins et des séries de chambres. Nous communiquons les conditions pour les projets professionnels sur demande." },
      { q: "Livrez-vous et posez-vous aussi hors du Vorarlberg ?", a: "La livraison et la pose sont possibles sur demande, y compris hors du Vorarlberg. Pour des projets en Allemagne, en Suisse et au Liechtenstein, contactez-nous directement." },
    ],
  },
};

const IT = {
  banner: {
    title: "Interior design in Vorarlberg",
    alt: "Showroom di Platzhirsch Home Living a Lochau con divani e poltrone",
    crumb: "Interior design Vorarlberg",
  },
  intro: {
    eyebrow: "Consulenza e progettazione d’interni",
    heading: "Ambienti che vi somigliano – fin nei dettagli",
    paragraphs: [
      "Un arredamento riuscito nasce quando arredi, materiali e luce dialogano. Da Platzhirsch Home Living a Lochau vi accompagniamo dalla prima idea all’ambiente arredato – per un singolo locale come per un intero appartamento o una casa.",
      "Vediamo i vostri spazi sul posto, compresi luce, percorsi e abitudini. Da qui Harald Menghin disegna a mano un concept d’arredo e costruisce un modello dell’ambiente. Poi progettiamo in 3D con arredi, sistemi, lampade e accessori di marchi di design internazionali, e vedete il risultato in un rendering prima di ordinare qualsiasi cosa.",
    ],
    benefits: [
      "Concept disegnato a mano, poi progettato in 3D",
      "Un unico interlocutore per tutto il progetto",
      "Arredi, sistemi, luce e accessori da un unico partner",
      "Consegna e montaggio su richiesta",
    ],
    imageAlt: "Living aperto con vetrine, isola della cucina e lampada a sospensione rotonda",
  },
  brands: {
    eyebrow: "Marchi per il vostro concept",
    heading: "Arredi, sistemi e luce da un unico partner",
    items: [
      {
        imageAlt: "Sistema a parete Rimadesio con pannelli in legno, mensole e madia in un living",
        text: "Sistemi a parete, librerie, porte scorrevoli e divisori in vetro e alluminio – per ambienti dalla struttura chiara e con molto contenimento, integrati con precisione nell’architettura.",
      },
      {
        imageAlt: "Lampada da terra Flos con disco luminoso rotondo su treppiede cromato",
        text: "La luce fa parte di ogni concept d’arredo. Flos è sinonimo di lampade iconiche che articolano gli spazi, creano atmosfera e diventano esse stesse oggetti di design.",
      },
    ],
    cta: { label: "Guardate tutti i prodotti" },
  },
  steps: {
    eyebrow: "Il nostro metodo",
    heading: "Dal disegno a mano all’ambiente finito",
    items: [
      { title: "Conoscersi", text: "Nello showroom con caffè o a casa vostra. Ci raccontate come vivete." },
      { title: "Sul posto", text: "Osserviamo luce, clima e percorsi. Se il vostro progetto lo richiede, anche per uno o due giorni." },
      { title: "Disegno a mano", text: "Harald Menghin schizza a mano pianta, prospettive e atmosfere." },
      { title: "Modello", text: "Un modello in scala dell’ambiente, da toccare e riorganizzare insieme." },
      { title: "Progetto 3D", text: "Misure esatte, prodotti e materiali scelti." },
      { title: "Rendering", text: "Un’immagine fotorealistica del vostro ambiente prima di ordinare qualsiasi cosa." },
      { title: "Realizzazione", text: "Consegna, montaggio su richiesta e assistenza fino al trasloco." },
    ],
    links: [
      { label: "Il nostro metodo nel dettaglio" },
      { label: "Trovate il vostro stile" },
      { label: "Guardate gli arredi in 3D e AR" },
      { label: "Arredare hotel e progetti contract" },
    ],
  },
  objekt: {
    eyebrow: "Hotel, ristorazione e contract",
    heading: "Disegnato per i vostri ospiti.",
    text: "Per camere d’hotel, ristorante, bar, lobby o ufficio vale lo stesso metodo di una casa. Passiamo del tempo nella vostra struttura prima di progettare e pensiamo le serie di camere fin dall’inizio.",
    steps: [
      { title: "Sul posto, nella vostra struttura", text: "Percorsi di ospiti e personale, luce, rumore e pulizia. Se il vostro progetto lo richiede, restiamo anche uno o due giorni." },
      { title: "Disegno a mano", text: "Harald Menghin disegna prima a mano camere e aree comuni." },
      { title: "Modello di una camera campione", text: "Un modello in scala su cui valutate con noi le varianti per la serie di camere." },
      { title: "Progetto 3D delle serie di camere", text: "Misure esatte, prodotti e materiali, adattati alle diverse dimensioni delle camere." },
      { title: "Rendering prima dell’ordine", text: "Vedete camere e aree comuni in modo fotorealistico prima di ordinare. Se abbia senso una camera campione costruita, lo valutiamo con voi." },
      { title: "Realizzazione", text: "Consegna e montaggio su richiesta, coordinati con la vostra attività e le imprese coinvolte." },
    ],
    contactLabel: "Direttamente in studio a Lochau",
    contactNote: "Condizioni per hotel, ristorazione e contract su richiesta.",
    cta: { label: "Presentate un progetto contract" },
  },
  gallery: [
    { alt: "Ambiente con porta scorrevole in vetro, libreria a parete e lampada di design" },
    { alt: "Zona pranzo con lampadario, libreria e vista sul giardino" },
    { alt: "Postazione di lavoro con scrivania e lampada da terra davanti a una grande vetrata" },
  ],
  showroom: {
    heading: "Raccogliere idee – nel nostro showroom",
    text: "A Lochau, a pochi minuti da Bregenz, presentiamo arredi, sistemi e lampade dei nostri marchi. Fissate un appuntamento, così possiamo dedicare al vostro progetto il tempo necessario.",
  },
  cta: {
    heading: "Progettiamo il vostro concept d’arredo",
    text: "Fissate un appuntamento di consulenza senza impegno nel nostro showroom a Lochau.",
  },
  faq: {
    heading: "Domande sulla progettazione d’interni",
    items: [
      { q: "Per quali progetti offrite consulenza d’arredo?", a: "Per singoli ambienti come per appartamenti e case completi – dal soggiorno alla cucina e alla zona pranzo, fino alla camera da letto o alla postazione di lavoro." },
      { q: "Come si svolge la progettazione d’interni?", a: "Dopo un primo colloquio vediamo i vostri spazi sul posto. Harald Menghin disegna il concept a mano e, se serve, costruisce un modello. Poi progettiamo in 3D, vi mostriamo un rendering e scegliamo con voi nello showroom. Coordiniamo consegna e montaggio." },
      { q: "Serve un appuntamento?", a: "Siete i benvenuti in qualsiasi momento durante i nostri orari di apertura (mar–ven 10–18, sab 10–14). Per una progettazione d’interni consigliamo un appuntamento, così possiamo dedicarvi il tempo necessario." },
      { q: "Cosa devo portare al primo appuntamento?", a: "Sono utili piante o misure degli ambienti, foto degli spazi e – se le avete – immagini o idee che vi piacciono." },
      { q: "Posso includere arredi esistenti nel concept?", a: "Sì. Teniamo volentieri conto dei pezzi che desiderate conservare e progettiamo il nuovo arredamento di conseguenza." },
      { q: "Progettate anche illuminazione e accessori?", a: "Sì. Per noi lampade, tappeti e accessori fanno parte di ogni concept d’arredo – danno all’ambiente atmosfera e carattere." },
      { q: "Progettate anche hotel, ristorazione e contract?", a: "Sì. Il metodo è lo stesso di una casa, completato da camere campione e serie di camere. Le condizioni per i progetti contract le comunichiamo su richiesta." },
      { q: "Consegnate e montate anche fuori dal Vorarlberg?", a: "Consegna e montaggio sono disponibili su richiesta, anche fuori dal Vorarlberg. Per progetti in Germania, Svizzera e Liechtenstein contattateci direttamente." },
    ],
  },
};

export const INTL = { en: EN, fr: FR, it: IT };
