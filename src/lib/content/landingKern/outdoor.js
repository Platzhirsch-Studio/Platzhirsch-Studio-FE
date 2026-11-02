// src/lib/content/landingKern/outdoor.js – EN/FR/IT der Seite
// /<locale>/outdoor-gartenplanung. Mastertext: CONTENT in
// src/app/[locale]/outdoor-gartenplanung/page.js (Deutsch, bleibt dort; die
// Icons der Bausteine kommen von dort, mergeText in ./index.js).
//
// RECHT (Marktresearch/30-geschaeftsfeld-outdoor-gartenplanung.md, Abschnitt 8;
// § 94 Z 24, § 99 Abs 1 GewO): Die deutsche Bedeutung bleibt in jeder Sprache
// gleich – Platzhirsch hat nur die Handelsgewerbe-Berechtigung. Darum:
//   - KEINE Bauleitung/Bauaufsicht, kein Generalunternehmer, keine Garten- oder
//     Landschaftsplanung als eigene Leistung („site management“, „direction des
//     travaux“, „direzione lavori“ stehen nur bei den befugten Betrieben);
//   - Gartenplan und Ausführung: befugte Fachbetriebe; Bauleitung: befugter
//     Baumeister (österreichischer Begriff, in Klammern beibehalten);
//   - der Kunde beauftragt jeden Betrieb DIREKT, eigene Angebote; wir
//     koordinieren nur Termine und Lieferungen;
//   - Behördenwege übernehmen wir nicht; Gesetzesverweise (§ 19 Vorarlberger
//     Baugesetz, § 24 GNL, BauKG) bleiben mit Originalnamen stehen.
// Die Seite bleibt noindex bis zur Rechtsprüfung – in allen Sprachen.

export const META = {
  en: {
    title: "Garden furniture & outdoor on Lake Constance",
    description:
      "Outdoor concept with furniture, shade and lighting from Lochau. Garden design and works by licensed firms – we coordinate the dates.",
    og: { eyebrow: "Garden · Terrace · Pool", title: "Outdoor and garden projects on Lake Constance" },
  },
  fr: {
    title: "Mobilier de jardin et extérieur, lac de Constance",
    description:
      "Concept extérieur avec mobilier, ombrage et lumière, depuis Lochau. Jardin et travaux par des entreprises habilitées – nous coordonnons les dates.",
    og: { eyebrow: "Jardin · Terrasse · Piscine", title: "Projets extérieurs au lac de Constance" },
  },
  it: {
    title: "Arredo giardino e outdoor sul Lago di Costanza",
    description:
      "Concept outdoor con arredi, ombreggiatura e luce da Lochau. Progetto del giardino e lavori a cura di imprese abilitate – coordiniamo noi le date.",
    og: { eyebrow: "Giardino · Terrazza · Piscina", title: "Progetti outdoor sul Lago di Costanza" },
  },
};

const EN = {
  hero: {
    alt: "Outdoor armchair and sofa with light cushions on a gravel terrace with a wide view",
    crumb: "Outdoor planning",
    trail: [{ label: "Outdoor & pool" }],
    eyebrow: "Furniture · Shade · Light · Garden",
    title: "Outdoor planning & garden projects on Lake Constance",
    lead: "Your garden as a living space under the open sky. We design the outdoor concept with furniture, shade and lighting and coordinate it with licensed specialist firms for landscaping, pool and technical services – with one point of contact for your whole project.",
  },
  intro: {
    eyebrow: "Outdoor concept, one point of contact",
    heading: "Your outdoor space, all of a piece",
    paragraphs: [
      "A beautiful outdoor space is the work of many trades: earthworks, walls and paving, planting, water, electrics, shade – and finally the furniture that turns it all into a living space. So that it feels all of a piece, we start with the picture you want to see at the end: the evening on the terrace, the view of the lake, the place for family and guests.",
      "From this we develop your outdoor concept with furniture, shade and lighting. Garden design and works are carried out by licensed landscaping firms, and site management, where needed, by a licensed master builder (Baumeister). You commission each firm directly – we coordinate the dates and deliveries and keep the overall picture in view.",
    ],
    points: [
      "Outdoor concept with furniture, shade and lighting",
      "One point of contact – we coordinate dates with the firms you commission",
      "Garden design and works by licensed firms, site management by a licensed master builder",
      "3D visualisation of your terrace with furniture, parasols and lighting",
      "For gardens, terraces, roof terraces and lakeside plots – private as well as for hotels and restaurants",
    ],
  },
  services: {
    eyebrow: "Services",
    heading: "From the first design to the summer evening",
    text: "Seven building blocks, one concept. Each building block states who carries it out – so that it is clear from the start who is responsible for what.",
    closingEyebrow: "Your project",
    closingText: "We clarify which building blocks your garden needs in the first conversation – in the showroom café in Lochau or at your home.",
    items: [
      {
        title: "Garden design",
        text: "Planting, paths, walls, water and irrigation. The garden plan is drawn up by a licensed landscaping firm; we contribute the design concept and the furniture planning and present everything together.",
        by: "Garden plan & works: licensed landscaping firm",
      },
      {
        title: "Terrace design",
        text: "How big must the terrace be so that the dining table and lounge fit? We plan zones, paths and furniture and agree paving and materials with the specialist firm – natural stone, wood or ceramic.",
        by: "Furniture planning: Platzhirsch · Paving & substructure: specialist firm",
      },
      {
        title: "Outdoor kitchen",
        text: "Cooking and grilling under the open sky: we plan the position, worktops and workflows together with you. Water, power and gas connections are laid by licensed installers and electricians.",
        by: "Concept: Platzhirsch · Connections: licensed installers & electricians",
      },
      {
        title: "Shade",
        text: "Parasols and shade sails for terrace, pool and garden – suited to the position of the sun and the wind. Foundations and ground anchors for large parasols, as well as pergolas and louvred roofs, are handled by licensed firms, if needed with structural calculations by the master builder.",
        by: "Parasols & installation: Platzhirsch · Foundations: specialist firm or master builder",
      },
      {
        title: "Lighting",
        text: "Light is what turns the garden into a living space in the evening: lights for the table, paths and plants, plus warmth for cool evenings. Hard-wired cables are laid by an electrician.",
        by: "Lighting concept & lights: Platzhirsch · Electrics: electrician",
      },
      {
        title: "Outdoor furniture",
        text: "Lounge, dining table, loungers and accessories by international design brands. You see fabrics and materials in the original in the showroom – we take care of delivery and installation.",
        by: "Selection, delivery & installation: Platzhirsch",
      },
      {
        title: "Care & storage",
        text: "So that cushions, parasols and furniture stay beautiful for many years: care and storage for outdoor furniture and parasols on request. We agree the scope with you.",
        by: "Furniture & parasols: Platzhirsch · Garden maintenance: specialist firm",
      },
    ],
  },
  roles: {
    eyebrow: "One point of contact",
    heading: "One point of contact for all trades",
    text: "A garden or terrace project needs several specialist firms. You still have one point of contact: we coordinate dates and deliveries, keep a shared schedule and make sure the furniture is in place in time for the start of the season.",
    columns: [
      {
        title: "Platzhirsch",
        subtitle: "Your point of contact",
        items: [
          "Outdoor concept with furniture, shade and lighting",
          "3D visualisation and sample selection in the showroom",
          "Coordination of dates and deliveries with the specialist firms",
          "Delivery and installation of furniture, parasols and lights",
          "Care and storage on request",
        ],
      },
      {
        title: "Licensed specialist firms",
        subtitle: "Landscaping, electrics, plumbing",
        items: [
          "Garden plan and planting",
          "Paths, walls, terrace paving",
          "Ponds, swimming ponds, irrigation",
          "Electricity, water and gas connections",
          "Garden maintenance",
        ],
      },
      {
        title: "Licensed master builder (Baumeister)",
        subtitle: "Where structural elements are added",
        items: [
          "Site management and construction supervision",
          "Structural calculations, e.g. for retaining walls, pools and foundations",
          "Building notification or building permit application",
          "Site coordination under the Austrian BauKG (or an external coordinator)",
        ],
      },
    ],
    note: "You commission each specialist firm directly and receive a separate quote from each one. Our quote sets out in writing what we supply and which services other firms take on.",
  },
  season: {
    eyebrow: "Process & season",
    heading: "Plan in winter, enjoy in summer",
    text: "Garden works start as soon as the ground is free of frost. Design furniture often has a delivery time of several weeks. That is why it pays to plan in autumn and winter – then everything is ready in spring.",
    items: [
      {
        when: "November – December",
        title: "First conversation & survey",
        text: "We get to know your property: wishes, use, position of the sun, view, budget range. Gladly in the showroom café in Lochau or at your home.",
      },
      {
        when: "January – February",
        title: "Concept & sample selection",
        text: "Outdoor concept and 3D visualisation, fabrics and materials in the showroom. The garden plan is drawn up by the specialist firm; each firm sends its own quote.",
      },
      {
        when: "March – May",
        title: "Realisation",
        text: "The specialist firms build in the right order – earthworks, cables and pipes, walls and paving, planting, lighting. The furniture comes last, usually in April or May.",
      },
      {
        when: "June – August",
        title: "Enjoy",
        text: "Your garden is ready for long evenings. We remain your point of contact for additional purchases, care and questions about furniture and parasols.",
      },
      {
        when: "September – October",
        title: "Autumn & storage",
        text: "Planting season for the garden and a second window for works. Care and storage of cushions, parasols and furniture over the winter on request.",
      },
    ],
    highlight: "Rule of thumb: whatever should be ready for the start of the season in spring should be decided by the end of January.",
  },
  gallery: [
    { alt: "Outdoor lounge with sofa, yellow cushions and coffee table on a terrace overlooking the sea" },
    { alt: "Wooden outdoor dining table with woven chairs on a terrace with plants" },
    { alt: "Outdoor lounge with sofa, armchairs and wooden coffee tables in front of a white perforated wall" },
  ],
  brands: {
    eyebrow: "Brands from our range",
    heading: "Made for outdoors",
    text: "We only recommend collections that the manufacturer intends for outdoor use. In the showroom we discuss which models suit your location by the lake, in the sun or in the wind.",
    groups: [
      {
        title: "Furniture",
        items: [
          { text: "Outdoor collection with sofas, armchairs and tables for terrace and lounge." },
          { text: "Outdoor furniture and its own outdoor fabrics in many colours." },
          { text: "Outdoor furniture with teak as the central material – for dining table, lounge and loungers." },
          { text: "Durable outdoor furniture: tables, chairs, lounge and loungers." },
        ],
      },
      {
        title: "Shade, warmth & light",
        items: [
          { text: "Parasols for terrace, pool and garden – also in large formats." },
          { text: "Parasols and shade sails from Belgium for terrace and garden." },
          { text: "Warmth for the evening on the terrace – so that the season lasts longer." },
          { text: "Lights from Italy, including models for outdoor use." },
        ],
      },
    ],
  },
  care: {
    eyebrow: "Care & storage",
    heading: "So that it lasts many summers",
    text: "Outdoor furniture is made for the weather – with a little care it stays beautiful for many years. We offer this service on request; scope, dates and costs are agreed with you individually.",
    items: [
      { name: "Spring set-up", text: "We set up furniture, cushions and parasols again for the start of the season." },
      { name: "Autumn take-down", text: "Dismantling and collection in October, before frost and damp arrive." },
      { name: "Cleaning & inspection", text: "Cleaning of cushions and parasol canopies, inspection of parasol mechanisms and heaters." },
      { name: "Storage", text: "Dry, ventilated storage over the winter and return delivery in spring." },
    ],
  },
  cta: {
    heading: "Discuss your garden project",
    text: "Tell us about your garden, your terrace or your lakeside plot. Photos, plans and dimensions help us prepare – the first conversation is without obligation.",
    primaryLabel: "Discuss your garden project",
    mailSubject: "Garden project",
    showroom: "Showroom & café: Landstraße 11, 6911 Lochau, Austria · Tue–Fri 10 am–6 pm, Sat 10 am–2 pm",
  },
  schema: {
    serviceName: "Outdoor concept and coordination of the trades",
    serviceType: "Design of terraces and gardens with outdoor furniture, shade and lighting",
    description:
      "Outdoor concept with furniture, shade and lighting, 3D visualisation and coordination of dates with the specialist firms commissioned by the customer. Garden design and works by licensed specialist firms, site management by a licensed master builder.",
    areaServed: ["Vorarlberg", "Lake Constance", "Bavaria", "Baden-Württemberg", "Eastern Switzerland", "Liechtenstein"],
  },
  faq: {
    heading: "Frequently asked questions about garden and terrace",
    items: [
      {
        q: "Do you also take on site management?",
        a: "Not ourselves. Site management and construction supervision are handled, where needed, by a licensed master builder (Baumeister), and the garden works by a licensed landscaping firm. We are your point of contact: we design the outdoor concept and coordinate the dates with the specialist firms you commission.",
      },
      {
        q: "With whom do I sign the contracts?",
        a: "With each specialist firm directly. You receive separate quotes – from us for concept, furniture, parasols, lights and installation, from the specialist firms for garden, construction and technical services. So you know exactly who provides which service and is accountable for it.",
      },
      {
        q: "When should I start planning?",
        a: "Ideally in autumn or winter. Garden works usually start in March, when the ground is free of frost, and design furniture often has a delivery time of several weeks. Whatever should be ready for the start of the season should therefore be decided by the end of January.",
      },
      {
        q: "Do I need a permit for a pool, pergola or wall?",
        a: "Often, yes. In Vorarlberg, for example, swimming pools, retaining walls and open pergolas generally have to be notified (§ 19 Vorarlberger Baugesetz, the Vorarlberg Building Act); on Lake Constance, a permit under nature conservation law may also be required within the 500 m shore zone (§ 24 GNL). The specialist firm or master builder clarifies this case by case with the municipality and the authorities – we do not handle dealings with the authorities.",
      },
      {
        q: "What does an outdoor project cost?",
        a: "That depends heavily on size and scope – from a new terrace with furniture to the whole garden. In the first conversation we set a budget range; after that you receive a separate quote from us and from each specialist firm.",
      },
      {
        q: "Do you also work in Germany, Switzerland and Liechtenstein?",
        a: "Furniture, parasols and concept: gladly, please get in touch. For garden and construction works, local specialist firms are advisable, because each country has its own building and trade rules. We clarify individually how to organise your project.",
      },
      {
        q: "Do you store outdoor furniture over the winter?",
        a: "On request: for outdoor furniture and parasols we offer care and storage – from taking down in autumn to setting up in spring. Scope, dates and costs are agreed with you individually.",
      },
    ],
  },
  imageAlts: {
    "/Images/Outdoor/bannerImage2.jpg": "Wooden dining table with woven chairs on a terrace with bamboo and plants",
    "/Images/Outdoor/bannerImage1.jpg": "Outdoor lounge with sofa, armchairs and wooden coffee tables in front of a white perforated wall",
    "/Images/UberUns/white-sofas.jpg": "Two light outdoor loungers with woven frames on a round rug in the greenery",
  },
  bridgeLinks: ["Pool with Ezarri glass mosaic", "Sun on terrace and pool", "Hot tub & cold plunge in the garden", "Boathouse, jetty and boat"],
};

const FR = {
  hero: {
    alt: "Fauteuil et canapé d’extérieur aux coussins clairs sur une terrasse en gravier avec vue dégagée",
    crumb: "Aménagement extérieur",
    trail: [{ label: "Extérieur & piscine" }],
    eyebrow: "Mobilier · Ombrage · Lumière · Jardin",
    title: "Aménagement extérieur et projets de jardin au lac de Constance",
    lead: "Votre jardin comme espace de vie à ciel ouvert. Nous concevons le concept extérieur avec mobilier, ombrage et lumière et le coordonnons avec des entreprises habilitées pour le paysagisme, la piscine et la technique – avec un seul interlocuteur pour tout votre projet.",
  },
  intro: {
    eyebrow: "Concept extérieur, un seul interlocuteur",
    heading: "Un extérieur pensé d’un seul geste",
    paragraphs: [
      "Un bel extérieur naît du travail de nombreux corps de métier : terrassement, murs et revêtements, plantations, eau, électricité, ombrage – et, pour finir, le mobilier qui fait de l’ensemble un espace de vie. Pour que tout paraisse pensé d’un seul geste, nous partons de l’image que vous souhaitez voir à la fin : la soirée sur la terrasse, la vue sur le lac, la place pour la famille et les invités.",
      "Nous en tirons votre concept extérieur avec mobilier, ombrage et lumière. Le plan du jardin et les travaux sont confiés à des entreprises de paysagisme habilitées, et la direction des travaux, si nécessaire, à un maître d’œuvre habilité (Baumeister). Vous mandatez directement chaque entreprise – nous coordonnons les dates et les livraisons et gardons la vue d’ensemble.",
    ],
    points: [
      "Concept extérieur avec mobilier, ombrage et lumière",
      "Un seul interlocuteur – nous coordonnons les dates avec les entreprises que vous mandatez",
      "Plan du jardin et travaux par des entreprises habilitées, direction des travaux par un maître d’œuvre habilité",
      "Visualisation 3D de votre terrasse avec mobilier, parasols et lumière",
      "Pour jardins, terrasses, toits-terrasses et terrains au bord du lac – particuliers comme hôtels et restaurants",
    ],
  },
  services: {
    eyebrow: "Prestations",
    heading: "De la première esquisse au soir d’été",
    text: "Sept éléments, un concept. Pour chaque élément, nous indiquons qui le réalise – pour qu’il soit clair dès le départ qui est responsable de quoi.",
    closingEyebrow: "Votre projet",
    closingText: "Les éléments dont votre jardin a besoin, nous les définissons lors du premier échange – au café du showroom à Lochau ou chez vous.",
    items: [
      {
        title: "Plan du jardin",
        text: "Plantations, chemins, murs, eau et arrosage. Le plan du jardin est établi par une entreprise de paysagisme habilitée ; nous apportons le concept d’aménagement et le plan du mobilier et présentons le tout ensemble.",
        by: "Plan et travaux du jardin : entreprise de paysagisme",
      },
      {
        title: "Aménagement de la terrasse",
        text: "Quelle taille doit avoir la terrasse pour accueillir table à manger et salon ? Nous planifions zones, circulations et mobilier et accordons revêtement et matériaux avec l’entreprise spécialisée – pierre naturelle, bois ou céramique.",
        by: "Plan du mobilier : Platzhirsch · Revêtement et support : entreprise spécialisée",
      },
      {
        title: "Cuisine d’extérieur",
        text: "Cuisiner et griller à ciel ouvert : nous planifions avec vous l’emplacement, les plans de travail et les usages. Les raccordements d’eau, d’électricité et de gaz sont réalisés par des installateurs et électriciens habilités.",
        by: "Concept : Platzhirsch · Raccordements : installateurs et électriciens habilités",
      },
      {
        title: "Ombrage",
        text: "Parasols et voiles d’ombrage pour terrasse, piscine et jardin – adaptés à la course du soleil et au vent. Fondations et ancrages au sol pour les grands parasols ainsi que pergolas et toits à lames sont confiés à des entreprises habilitées, au besoin avec calcul statique du maître d’œuvre.",
        by: "Parasols et montage : Platzhirsch · Fondations : entreprise spécialisée ou maître d’œuvre",
      },
      {
        title: "Lumière",
        text: "C’est la lumière qui fait du jardin un espace de vie le soir : luminaires pour la table, les chemins et les plantes, et de la chaleur pour les soirées fraîches. Les câbles fixes sont posés par un électricien.",
        by: "Concept lumière et luminaires : Platzhirsch · Électricité : électricien",
      },
      {
        title: "Mobilier d’extérieur",
        text: "Salon, table à manger, bains de soleil et accessoires de marques de design internationales. Tissus et matériaux se découvrent en vrai au showroom – livraison et montage sont assurés par nos soins.",
        by: "Sélection, livraison et montage : Platzhirsch",
      },
      {
        title: "Entretien et hivernage",
        text: "Pour que coussins, parasols et mobilier restent beaux pendant de longues années : entretien et hivernage du mobilier d’extérieur et des parasols sur demande. Nous définissons l’étendue avec vous.",
        by: "Mobilier et parasols : Platzhirsch · Entretien du jardin : entreprise spécialisée",
      },
    ],
  },
  roles: {
    eyebrow: "Un seul interlocuteur",
    heading: "Un interlocuteur pour tous les corps de métier",
    text: "Un projet de jardin ou de terrasse demande plusieurs entreprises spécialisées. Vous n’avez pourtant qu’un interlocuteur : nous coordonnons dates et livraisons, tenons un calendrier commun et veillons à ce que le mobilier soit en place pour le début de la saison.",
    columns: [
      {
        title: "Platzhirsch",
        subtitle: "Votre interlocuteur",
        items: [
          "Concept extérieur avec mobilier, ombrage et lumière",
          "Visualisation 3D et choix des échantillons au showroom",
          "Coordination des dates et livraisons avec les entreprises spécialisées",
          "Livraison et montage du mobilier, des parasols et des luminaires",
          "Entretien et hivernage sur demande",
        ],
      },
      {
        title: "Entreprises spécialisées habilitées",
        subtitle: "Paysagisme, électricité, installations",
        items: [
          "Plan du jardin et plantations",
          "Chemins, murs, revêtements de terrasse",
          "Bassins, étangs de baignade, arrosage",
          "Raccordements électricité, eau et gaz",
          "Entretien du jardin",
        ],
      },
      {
        title: "Maître d’œuvre habilité (Baumeister)",
        subtitle: "Dès que des ouvrages de construction s’ajoutent",
        items: [
          "Direction et surveillance des travaux",
          "Calcul statique, par ex. pour murs de soutènement, piscines et fondations",
          "Déclaration de travaux ou demande de permis de construire",
          "Coordination de chantier selon la loi autrichienne BauKG (ou coordinateur externe)",
        ],
      },
    ],
    note: "Vous mandatez directement chaque entreprise spécialisée et recevez de chacune son propre devis. Notre devis précise par écrit ce que nous fournissons et les prestations prises en charge par d’autres entreprises.",
  },
  season: {
    eyebrow: "Déroulement et saison",
    heading: "Planifier en hiver, profiter en été",
    text: "Les travaux de jardin commencent dès que le sol est hors gel. Le mobilier design demande souvent plusieurs semaines de livraison. C’est pourquoi il vaut la peine de planifier en automne et en hiver – tout est alors prêt au printemps.",
    items: [
      {
        when: "Novembre – décembre",
        title: "Premier échange et relevé",
        text: "Nous découvrons votre terrain : souhaits, usages, course du soleil, vue, enveloppe budgétaire. Volontiers au café du showroom à Lochau ou chez vous.",
      },
      {
        when: "Janvier – février",
        title: "Concept et échantillons",
        text: "Concept extérieur et visualisation 3D, tissus et matériaux au showroom. Le plan du jardin est établi par l’entreprise spécialisée ; chaque entreprise envoie son propre devis.",
      },
      {
        when: "Mars – mai",
        title: "Réalisation",
        text: "Les entreprises spécialisées interviennent dans le bon ordre – terrassement, réseaux, murs et revêtements, plantations, lumière. Le mobilier arrive en dernier, le plus souvent en avril ou en mai.",
      },
      {
        when: "Juin – août",
        title: "Profiter",
        text: "Votre jardin est prêt pour les longues soirées. Nous restons votre interlocuteur pour les achats complémentaires, l’entretien et les questions sur le mobilier et les parasols.",
      },
      {
        when: "Septembre – octobre",
        title: "Automne et hivernage",
        text: "Saison de plantation pour le jardin et seconde fenêtre de travaux. Entretien et hivernage des coussins, parasols et meubles pendant l’hiver sur demande.",
      },
    ],
    highlight: "Règle pratique : ce qui doit être prêt pour le début de la saison au printemps devrait être décidé d’ici fin janvier.",
  },
  gallery: [
    { alt: "Salon d’extérieur avec canapé, coussins jaunes et table basse sur une terrasse face à la mer" },
    { alt: "Table à manger d’extérieur en bois avec chaises tressées sur une terrasse végétalisée" },
    { alt: "Salon d’extérieur avec canapé, fauteuils et tables basses en bois devant un mur blanc ajouré" },
  ],
  brands: {
    eyebrow: "Marques de notre assortiment",
    heading: "Conçu pour l’extérieur",
    text: "Nous ne recommandons que des collections que le fabricant destine à l’extérieur. Au showroom, nous voyons avec vous quels modèles conviennent à votre emplacement au bord du lac, au soleil ou au vent.",
    groups: [
      {
        title: "Mobilier",
        items: [
          { text: "Collection d’extérieur avec canapés, fauteuils et tables pour la terrasse et le salon." },
          { text: "Mobilier d’extérieur et tissus d’extérieur propres en de nombreuses couleurs." },
          { text: "Mobilier d’extérieur avec le teck comme matériau central – pour table à manger, salon et bains de soleil." },
          { text: "Mobilier d’extérieur durable : tables, chaises, salon et bains de soleil." },
        ],
      },
      {
        title: "Ombre, chaleur et lumière",
        items: [
          { text: "Parasols pour terrasse, piscine et jardin – également en grands formats." },
          { text: "Parasols et voiles d’ombrage de Belgique pour terrasse et jardin." },
          { text: "De la chaleur pour la soirée sur la terrasse – pour que la saison dure plus longtemps." },
          { text: "Luminaires d’Italie, dont des modèles pour l’extérieur." },
        ],
      },
    ],
  },
  care: {
    eyebrow: "Entretien et hivernage",
    heading: "Pour en profiter de nombreux étés",
    text: "Le mobilier d’extérieur est fait pour les intempéries – avec un peu d’entretien, il reste beau de longues années. Nous proposons ce service sur demande ; étendue, dates et coûts sont définis individuellement avec vous.",
    items: [
      { name: "Installation au printemps", text: "Nous remettons en place meubles, coussins et parasols pour le début de la saison." },
      { name: "Démontage en automne", text: "Démontage et enlèvement en octobre, avant l’arrivée du gel et de l’humidité." },
      { name: "Nettoyage et contrôle", text: "Nettoyage des coussins et des toiles de parasol, contrôle des mécanismes de parasol et des chauffages." },
      { name: "Hivernage", text: "Stockage au sec et ventilé pendant l’hiver, puis nouvelle livraison au printemps." },
    ],
  },
  cta: {
    heading: "Parler de votre projet de jardin",
    text: "Parlez-nous de votre jardin, de votre terrasse ou de votre terrain au bord du lac. Photos, plans et dimensions nous aident à préparer l’échange – le premier rendez-vous est sans engagement.",
    primaryLabel: "Parler de votre projet de jardin",
    mailSubject: "Projet de jardin",
    showroom: "Showroom & café : Landstraße 11, 6911 Lochau, Autriche · mar–ven 10 h–18 h, sam 10 h–14 h",
  },
  schema: {
    serviceName: "Concept extérieur et coordination des corps de métier",
    serviceType: "Aménagement de terrasses et de jardins avec mobilier d’extérieur, ombrage et lumière",
    description:
      "Concept extérieur avec mobilier, ombrage et lumière, visualisation 3D et coordination des dates avec les entreprises spécialisées mandatées par le client. Plan du jardin et travaux par des entreprises habilitées, direction des travaux par un maître d’œuvre habilité.",
    areaServed: ["Vorarlberg", "Lac de Constance", "Bavière", "Bade-Wurtemberg", "Suisse orientale", "Liechtenstein"],
  },
  faq: {
    heading: "Questions fréquentes sur le jardin et la terrasse",
    items: [
      {
        q: "Assurez-vous aussi la direction des travaux ?",
        a: "Pas nous-mêmes. La direction et la surveillance des travaux sont assurées, si nécessaire, par un maître d’œuvre habilité (Baumeister), et les travaux de jardin par une entreprise de paysagisme habilitée. Nous sommes votre interlocuteur : nous concevons le concept extérieur et coordonnons les dates avec les entreprises spécialisées que vous mandatez.",
      },
      {
        q: "Avec qui dois-je signer les contrats ?",
        a: "Avec chaque entreprise spécialisée directement. Vous recevez des devis séparés – de notre part pour le concept, le mobilier, les parasols, les luminaires et le montage, de la part des entreprises spécialisées pour le jardin, la construction et la technique. Vous savez ainsi exactement qui fournit quelle prestation et en répond.",
      },
      {
        q: "Quand faut-il commencer à planifier ?",
        a: "Idéalement en automne ou en hiver. Les travaux de jardin commencent généralement en mars, quand le sol est hors gel, et le mobilier design demande souvent plusieurs semaines de livraison. Ce qui doit être prêt pour le début de la saison devrait donc être décidé d’ici fin janvier.",
      },
      {
        q: "Faut-il une autorisation pour une piscine, une pergola ou un mur ?",
        a: "Souvent, oui. Au Vorarlberg, par exemple, piscines, murs de soutènement et pergolas ouvertes sont en règle générale soumis à déclaration (§ 19 Vorarlberger Baugesetz, loi sur la construction du Vorarlberg) ; au bord du lac de Constance, une autorisation au titre de la protection de la nature peut s’y ajouter dans la bande riveraine de 500 m (§ 24 GNL). L’entreprise spécialisée ou le maître d’œuvre le clarifie au cas par cas avec la commune et l’administration – nous ne nous chargeons pas des démarches administratives.",
      },
      {
        q: "Combien coûte un projet extérieur ?",
        a: "Cela dépend fortement de la taille et de l’ampleur – de la nouvelle terrasse avec mobilier au jardin entier. Lors du premier échange, nous fixons une enveloppe budgétaire ; vous recevez ensuite un devis séparé de notre part et de chaque entreprise spécialisée.",
      },
      {
        q: "Travaillez-vous aussi en Allemagne, en Suisse et au Liechtenstein ?",
        a: "Mobilier, parasols et concept : volontiers, contactez-nous. Pour les travaux de jardin et de construction, il est préférable de faire appel à des entreprises locales, car chaque pays a ses propres règles en matière de construction et d’activité professionnelle. Nous définissons au cas par cas comment organiser votre projet.",
      },
      {
        q: "Assurez-vous l’hivernage du mobilier d’extérieur ?",
        a: "Sur demande : pour le mobilier d’extérieur et les parasols, nous proposons entretien et hivernage – du démontage en automne à l’installation au printemps. Étendue, dates et coûts sont définis individuellement avec vous.",
      },
    ],
  },
  imageAlts: {
    "/Images/Outdoor/bannerImage2.jpg": "Table à manger en bois avec chaises tressées sur une terrasse avec bambous et plantes",
    "/Images/Outdoor/bannerImage1.jpg": "Salon d’extérieur avec canapé, fauteuils et tables basses en bois devant un mur blanc ajouré",
    "/Images/UberUns/white-sofas.jpg": "Deux bains de soleil clairs tressés sur un tapis rond dans la verdure",
  },
  bridgeLinks: ["Piscine en mosaïque de verre Ezarri", "Le soleil sur la terrasse et le bassin", "Spa et bain froid au jardin", "Hangar à bateaux, ponton et bateau"],
};

const IT = {
  hero: {
    alt: "Poltrona e divano da esterno con cuscini chiari su una terrazza in ghiaia con vista aperta",
    crumb: "Progettazione outdoor",
    trail: [{ label: "Outdoor & piscina" }],
    eyebrow: "Arredi · Ombra · Luce · Giardino",
    title: "Progettazione outdoor e progetti giardino sul Lago di Costanza",
    lead: "Il vostro giardino come spazio abitativo a cielo aperto. Progettiamo il concept outdoor con arredi, ombreggiatura e luce e lo coordiniamo con imprese abilitate per giardinaggio, piscina e impianti – con un unico interlocutore per tutto il vostro progetto.",
  },
  intro: {
    eyebrow: "Concept outdoor, un unico interlocutore",
    heading: "Il vostro esterno, come un unico insieme",
    paragraphs: [
      "Un bell’esterno nasce dal lavoro di molte imprese: movimento terra, muri e pavimentazioni, piantumazione, acqua, impianto elettrico, ombreggiatura – e alla fine gli arredi che trasformano tutto in uno spazio da vivere. Perché il risultato appaia come un unico insieme, partiamo dall’immagine che volete vedere alla fine: la sera in terrazza, la vista sul lago, il posto per la famiglia e gli ospiti.",
      "Da qui sviluppiamo il vostro concept outdoor con arredi, ombreggiatura e luce. Progetto del giardino e lavori sono affidati a imprese di giardinaggio e paesaggistica abilitate, la direzione dei lavori, dove necessario, a un costruttore abilitato (Baumeister). Incaricate direttamente ogni impresa – noi coordiniamo date e consegne e teniamo d’occhio l’insieme.",
    ],
    points: [
      "Concept outdoor con arredi, ombreggiatura e luce",
      "Un unico interlocutore – coordiniamo le date con le imprese da voi incaricate",
      "Progetto del giardino e lavori a cura di imprese abilitate, direzione dei lavori a cura di un costruttore abilitato",
      "Visualizzazione 3D della vostra terrazza con arredi, ombrelloni e luce",
      "Per giardini, terrazze, terrazze sul tetto e terreni sul lago – privati come hotel e ristorazione",
    ],
  },
  services: {
    eyebrow: "Servizi",
    heading: "Dal primo schizzo alla sera d’estate",
    text: "Sette elementi, un concept. Per ogni elemento indichiamo chi lo esegue – perché sia chiaro fin dall’inizio chi è responsabile di cosa.",
    closingEyebrow: "Il vostro progetto",
    closingText: "Di quali elementi ha bisogno il vostro giardino lo chiariamo nel primo colloquio – nel caffè dello showroom a Lochau o da voi.",
    items: [
      {
        title: "Progetto del giardino",
        text: "Piantumazione, vialetti, muri, acqua e irrigazione. Il progetto del giardino è redatto da un’impresa di giardinaggio e paesaggistica abilitata; noi apportiamo il concept e la progettazione degli arredi e presentiamo tutto insieme.",
        by: "Progetto e lavori del giardino: impresa di giardinaggio e paesaggistica",
      },
      {
        title: "Progettazione della terrazza",
        text: "Quanto deve essere grande la terrazza perché ci stiano tavolo da pranzo e lounge? Progettiamo zone, percorsi e arredi e concordiamo pavimentazione e materiali con l’impresa – pietra naturale, legno o ceramica.",
        by: "Progettazione arredi: Platzhirsch · Pavimentazione e sottofondo: impresa specializzata",
      },
      {
        title: "Cucina da esterno",
        text: "Cucinare e grigliare a cielo aperto: progettiamo con voi posizione, piani di lavoro e flussi. Gli allacciamenti di acqua, corrente e gas sono eseguiti da installatori ed elettricisti abilitati.",
        by: "Concept: Platzhirsch · Allacciamenti: installatori ed elettricisti abilitati",
      },
      {
        title: "Ombreggiatura",
        text: "Ombrelloni e vele ombreggianti per terrazza, piscina e giardino – adatti alla posizione del sole e al vento. Fondazioni e ancoraggi a terra per grandi ombrelloni, così come pergole e coperture a lamelle, sono affidati a imprese abilitate, se necessario con calcolo statico del costruttore.",
        by: "Ombrelloni e montaggio: Platzhirsch · Fondazioni: impresa specializzata o costruttore",
      },
      {
        title: "Luce",
        text: "È la luce a fare del giardino uno spazio da vivere la sera: lampade per tavolo, vialetti e piante, e calore per le serate fresche. I cavi fissi sono posati da un elettricista.",
        by: "Concept luce e lampade: Platzhirsch · Impianto elettrico: elettricista",
      },
      {
        title: "Arredi da esterno",
        text: "Lounge, tavolo da pranzo, lettini e accessori di marchi di design internazionali. Tessuti e materiali li vedete dal vero nello showroom – consegna e montaggio li curiamo noi.",
        by: "Scelta, consegna e montaggio: Platzhirsch",
      },
      {
        title: "Cura e rimessaggio",
        text: "Perché cuscini, ombrelloni e arredi restino belli per molti anni: cura e rimessaggio di arredi da esterno e ombrelloni su richiesta. L’entità la concordiamo con voi.",
        by: "Arredi e ombrelloni: Platzhirsch · Manutenzione del giardino: impresa specializzata",
      },
    ],
  },
  roles: {
    eyebrow: "Un unico interlocutore",
    heading: "Un interlocutore per tutte le imprese",
    text: "Un progetto di giardino o di terrazza richiede diverse imprese specializzate. Voi avete comunque un unico interlocutore: coordiniamo date e consegne, teniamo un calendario comune e facciamo in modo che gli arredi siano al loro posto per l’inizio della stagione.",
    columns: [
      {
        title: "Platzhirsch",
        subtitle: "Il vostro interlocutore",
        items: [
          "Concept outdoor con arredi, ombreggiatura e luce",
          "Visualizzazione 3D e scelta dei campioni nello showroom",
          "Coordinamento di date e consegne con le imprese specializzate",
          "Consegna e montaggio di arredi, ombrelloni e lampade",
          "Cura e rimessaggio su richiesta",
        ],
      },
      {
        title: "Imprese specializzate abilitate",
        subtitle: "Giardinaggio e paesaggistica, impianti elettrici, idraulica",
        items: [
          "Progetto del giardino e piantumazione",
          "Vialetti, muri, pavimentazioni della terrazza",
          "Laghetti, biopiscine, irrigazione",
          "Allacciamenti elettrici, idrici e del gas",
          "Manutenzione del giardino",
        ],
      },
      {
        title: "Costruttore abilitato (Baumeister)",
        subtitle: "Dove si aggiungono opere edili",
        items: [
          "Direzione e sorveglianza dei lavori",
          "Calcolo statico, ad es. per muri di sostegno, piscine e fondazioni",
          "Comunicazione dei lavori o domanda di permesso di costruire",
          "Coordinamento del cantiere ai sensi della legge austriaca BauKG (o coordinatore esterno)",
        ],
      },
    ],
    note: "Incaricate direttamente ogni impresa specializzata e ricevete da ciascuna un proprio preventivo. Cosa forniamo noi e quali prestazioni assumono altre imprese lo mettiamo per iscritto nel nostro preventivo.",
  },
  season: {
    eyebrow: "Svolgimento e stagione",
    heading: "Progettare in inverno, godersi l’estate",
    text: "I lavori in giardino iniziano non appena il terreno non è più gelato. Gli arredi di design hanno spesso tempi di consegna di diverse settimane. Per questo conviene progettare in autunno e in inverno – così in primavera è tutto pronto.",
    items: [
      {
        when: "Novembre – dicembre",
        title: "Primo colloquio e rilievo",
        text: "Conosciamo il vostro terreno: desideri, utilizzo, posizione del sole, vista, budget indicativo. Volentieri nel caffè dello showroom a Lochau o da voi.",
      },
      {
        when: "Gennaio – febbraio",
        title: "Concept e campionatura",
        text: "Concept outdoor e visualizzazione 3D, tessuti e materiali nello showroom. Il progetto del giardino è redatto dall’impresa specializzata; ogni impresa invia il proprio preventivo.",
      },
      {
        when: "Marzo – maggio",
        title: "Realizzazione",
        text: "Le imprese specializzate lavorano nell’ordine giusto – movimento terra, linee e tubazioni, muri e pavimentazioni, piantumazione, luce. Gli arredi arrivano per ultimi, di solito ad aprile o maggio.",
      },
      {
        when: "Giugno – agosto",
        title: "Godersi il giardino",
        text: "Il vostro giardino è pronto per le lunghe serate. Restiamo il vostro interlocutore per acquisti successivi, cura e domande su arredi e ombrelloni.",
      },
      {
        when: "Settembre – ottobre",
        title: "Autunno e rimessaggio",
        text: "Stagione di piantumazione per il giardino e seconda finestra per i lavori. Cura e rimessaggio di cuscini, ombrelloni e arredi durante l’inverno su richiesta.",
      },
    ],
    highlight: "Regola pratica: ciò che deve essere pronto per l’inizio della stagione in primavera andrebbe deciso entro fine gennaio.",
  },
  gallery: [
    { alt: "Lounge da esterno con divano, cuscini gialli e tavolino su una terrazza con vista sul mare" },
    { alt: "Tavolo da pranzo da esterno in legno con sedie intrecciate su una terrazza con piante" },
    { alt: "Lounge da esterno con divano, poltrone e tavolini in legno davanti a una parete bianca traforata" },
  ],
  brands: {
    eyebrow: "Marchi del nostro assortimento",
    heading: "Fatti per l’esterno",
    text: "Consigliamo solo collezioni che il produttore prevede per l’esterno. Quali modelli si adattano alla vostra posizione sul lago, al sole o al vento, ne parliamo nello showroom.",
    groups: [
      {
        title: "Arredi",
        items: [
          { text: "Collezione outdoor con divani, poltrone e tavoli per terrazza e lounge." },
          { text: "Arredi da esterno e tessuti outdoor propri in molti colori." },
          { text: "Arredi da esterno con il teak come materiale centrale – per tavolo da pranzo, lounge e lettini." },
          { text: "Arredi da esterno durevoli: tavoli, sedie, lounge e lettini." },
        ],
      },
      {
        title: "Ombra, calore e luce",
        items: [
          { text: "Ombrelloni per terrazza, piscina e giardino – anche in grandi formati." },
          { text: "Ombrelloni e vele ombreggianti dal Belgio per terrazza e giardino." },
          { text: "Calore per la sera in terrazza – perché la stagione duri più a lungo." },
          { text: "Lampade dall’Italia, tra cui modelli per l’esterno." },
        ],
      },
    ],
  },
  care: {
    eyebrow: "Cura e rimessaggio",
    heading: "Perché duri molte estati",
    text: "Gli arredi da esterno sono fatti per le intemperie – con un po’ di cura restano belli per molti anni. Offriamo questo servizio su richiesta; entità, date e costi li concordiamo individualmente con voi.",
    items: [
      { name: "Allestimento in primavera", text: "Rimettiamo al loro posto arredi, cuscini e ombrelloni per l’inizio della stagione." },
      { name: "Smontaggio in autunno", text: "Smontaggio e ritiro in ottobre, prima che arrivino gelo e umidità." },
      { name: "Pulizia e controllo", text: "Pulizia di cuscini e teli degli ombrelloni, controllo dei meccanismi degli ombrelloni e dei riscaldatori." },
      { name: "Rimessaggio", text: "Deposito asciutto e ventilato durante l’inverno e riconsegna in primavera." },
    ],
  },
  cta: {
    heading: "Parliamo del vostro progetto di giardino",
    text: "Raccontateci del vostro giardino, della vostra terrazza o del vostro terreno sul lago. Foto, piante e misure ci aiutano a prepararci – il primo colloquio è senza impegno.",
    primaryLabel: "Parliamo del vostro giardino",
    mailSubject: "Progetto giardino",
    showroom: "Showroom & caffè: Landstraße 11, 6911 Lochau, Austria · mar–ven 10–18, sab 10–14",
  },
  schema: {
    serviceName: "Concept outdoor e coordinamento delle imprese",
    serviceType: "Progettazione di terrazze e giardini con arredi da esterno, ombreggiatura e luce",
    description:
      "Concept outdoor con arredi, ombreggiatura e luce, visualizzazione 3D e coordinamento delle date con le imprese specializzate incaricate dal cliente. Progetto del giardino e lavori a cura di imprese abilitate, direzione dei lavori a cura di un costruttore abilitato.",
    areaServed: ["Vorarlberg", "Lago di Costanza", "Baviera", "Baden-Württemberg", "Svizzera orientale", "Liechtenstein"],
  },
  faq: {
    heading: "Domande frequenti su giardino e terrazza",
    items: [
      {
        q: "Vi occupate anche della direzione dei lavori?",
        a: "No, non noi. Direzione e sorveglianza dei lavori sono affidate, dove necessario, a un costruttore abilitato (Baumeister), i lavori in giardino a un’impresa di giardinaggio e paesaggistica abilitata. Noi siamo il vostro interlocutore: progettiamo il concept outdoor e coordiniamo le date con le imprese specializzate che incaricate.",
      },
      {
        q: "Con chi stipulo i contratti?",
        a: "Direttamente con ogni impresa specializzata. Ricevete preventivi separati – da noi per concept, arredi, ombrelloni, lampade e montaggio, dalle imprese specializzate per giardino, opere edili e impianti. Così sapete esattamente chi fornisce quale prestazione e ne risponde.",
      },
      {
        q: "Quando conviene iniziare a progettare?",
        a: "Meglio in autunno o in inverno. I lavori in giardino iniziano di solito a marzo, quando il terreno non è più gelato, e gli arredi di design hanno spesso tempi di consegna di diverse settimane. Ciò che deve essere pronto per l’inizio della stagione andrebbe quindi deciso entro fine gennaio.",
      },
      {
        q: "Serve un’autorizzazione per piscina, pergola o muro?",
        a: "Spesso sì. In Vorarlberg, ad esempio, piscine, muri di sostegno e pergole aperte sono di norma soggetti a comunicazione (§ 19 Vorarlberger Baugesetz, legge edilizia del Vorarlberg); sul Lago di Costanza, nella fascia costiera di 500 m, può aggiungersi un’autorizzazione ai sensi della tutela della natura (§ 24 GNL). Lo chiarisce caso per caso l’impresa specializzata o il costruttore con il comune e le autorità – le pratiche presso le autorità non le seguiamo noi.",
      },
      {
        q: "Quanto costa un progetto outdoor?",
        a: "Dipende molto da dimensioni ed entità – dalla nuova terrazza con arredi all’intero giardino. Nel primo colloquio definiamo un budget indicativo; poi ricevete un preventivo separato da noi e da ogni impresa specializzata.",
      },
      {
        q: "Lavorate anche in Germania, Svizzera e Liechtenstein?",
        a: "Arredi, ombrelloni e concept: volentieri, contattateci. Per i lavori in giardino e le opere edili conviene affidarsi a imprese locali, perché ogni paese ha le proprie regole edilizie e professionali. Come organizzare al meglio il vostro progetto lo chiariamo caso per caso.",
      },
      {
        q: "Fate il rimessaggio invernale degli arredi da esterno?",
        a: "Su richiesta: per arredi da esterno e ombrelloni offriamo cura e rimessaggio – dallo smontaggio in autunno all’allestimento in primavera. Entità, date e costi li concordiamo individualmente con voi.",
      },
    ],
  },
  imageAlts: {
    "/Images/Outdoor/bannerImage2.jpg": "Tavolo da pranzo in legno con sedie intrecciate su una terrazza con bambù e piante",
    "/Images/Outdoor/bannerImage1.jpg": "Lounge da esterno con divano, poltrone e tavolini in legno davanti a una parete bianca traforata",
    "/Images/UberUns/white-sofas.jpg": "Due lettini chiari intrecciati su un tappeto rotondo nel verde",
  },
  bridgeLinks: ["Piscina con mosaico di vetro Ezarri", "Il sole su terrazza e vasca", "Idromassaggio e vasca fredda in giardino", "Rimessa per barche, pontile e barca"],
};

export const INTL = { en: EN, fr: FR, it: IT };
