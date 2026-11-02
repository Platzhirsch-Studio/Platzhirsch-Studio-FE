// /fr/yacht-interior und /it/yacht-interior – Seitentexte (01.11.2026).
// Übersetzt aus der deutschen Fassung (src/app/[locale]/yacht-interior/page.js,
// CONTENT = Mastertext), gegengelesen mit der englischen (content-en.js).
// FR für Romandie und Frankreich (Sie-Form „vous“), IT für Tessin und Italien
// (Höflichkeitsform „voi“). Dieselben Regeln wie DE/EN
// (Marktresearch/29-geschaeftsfeld-yacht-interior.md §8): keine Superlative,
// keine Händler- oder Partneraussagen, kein „certifié marine“, keine Preise,
// keine erfundenen Referenzen, keine Namen von Werften oder Sattlern.
// Begriffe: Bootssattler = FR sellier nautique / IT tappezziere nautico;
// Werft = FR chantier naval / IT cantiere; Winterlager = FR hivernage /
// IT rimessaggio invernale; Einwassern = FR remise à l’eau / IT rimessa in
// acqua; Bootshaus = FR hangar à bateaux / IT rimessa (wie Hotel & Objekt);
// lose Ausstattung = FR équipement mobile / IT arredo mobile.
// Französische Typografie setzt frenchTypography() beim Laden – im Quelltext
// stehen normale Leerzeichen. Reines Modul (node --test).
import { frenchTypography } from "./typography.js";

// SEO: Titel + „ | Platzhirsch“ ≤ 60, Description 120–150 (clampDescription schneidet nichts ab).
const META_FR_SRC = {
  title: "Intérieurs de yacht au lac de Constance",
  description:
    "Intérieur de yacht au lac de Constance : pont, salon, cabines et hangar à bateaux, dessinés à la main. Coussins du sellier nautique. Visite à bord.",
};

const META_IT_SRC = {
  title: "Interni per yacht sul lago di Costanza",
  description:
    "Interni per yacht sul lago di Costanza: coperta, salone, cabine e rimessa, disegnati a mano. Cuscini dal tappezziere nautico. Sopralluogo a bordo.",
};

const FR = {
  hero: {
    crumb: "Intérieurs de yacht",
    eyebrow: "Bateaux · Yachts · Hangars à bateaux",
    title: "Intérieurs de yacht au lac de Constance",
    motto: "Prenez place – à bord.",
    lead: "Vivre au bord du lac, et à bord aussi. Nous concevons le cockpit, le pont, le salon et les cabines de votre bateau – ainsi que votre hangar à bateaux – avec du mobilier d’extérieur, des tissus et de la lumière.",
    secondary: { href: "#werfthalle", label: "Voir le bateau en 3D" },
    usp: "Nous venons à bord. Harald Menghin dessine le concept à la main, puis suivent la planification 3D et le rendu.",
  },
  intro: {
    eyebrow: "Vivre à bord a ses propres règles",
    heading: "Entre l’art du sellier et le concept de design",
    paragraphs: [
      "Peu de place, beaucoup de soleil, de l’humidité – et chaque kilo compte. Nous apportons à bord notre expérience de l’aménagement intérieur et extérieur : un concept pour les couleurs, les tissus, les coussins, la lumière et l’équipement mobile, adapté à votre bateau et à votre style.",
      "La prise de mesures, la fabrication et le montage sont confiés à des entreprises spécialisées – un sellier nautique et votre chantier naval. Nous coordonnons les travaux avec eux, pour que conception et savoir-faire s’accordent.",
    ],
    rules: [
      { name: "Poids", text: "Chaque kilo compte. Nous indiquons les poids avec le devis, le chantier naval les valide." },
      { name: "Humidité et soleil", text: "À l’extérieur, uniquement ce que le fabricant prévoit pour l’extérieur. Les textiles d’intérieur restent sous le pont, au sec." },
      { name: "Mouvement", text: "Ce qui est mobile doit tenir en place : rangé avant de partir ou fixé par le chantier naval." },
    ],
  },
  werfthalle: {
    eyebrow: "Le hangar du chantier",
    heading: "Parcourez votre bateau, espace par espace",
    text: "En hivernage, le bateau est à terre et accessible. Choisissez un type de bateau et une zone : la caméra s’y rend ; pour le salon, la cabine et la salle d’eau, le pont s’ouvre en coupe. À côté, nos propositions pour cette zone.",
    note: "Le modèle 3D est un schéma, pas votre bateau. Les meubles y apparaissent sous forme de volumes simplifiés, dans les couleurs du concept – aucune reproduction de meubles de designer. Les vrais produits figurent à côté, avec l’image du fabricant.",
    initial: "motoryacht-riviera",
  },
  concepts: {
    eyebrow: "Exemples de concepts",
    heading: "Du runabout au hangar à bateaux",
    text: "Chaque concept : une ligne directrice, un univers de couleurs, des matériaux et des produits de notre assortiment, zone par zone. Des exemples – pas des projets clients.",
    aiNote:
      "Les images des exemples de concepts sont des visualisations de concept. Une partie est calculée avec Blender et légendée « Visualisation (rendu 3D) » ; les autres sont générées par IA (art. 50 du règlement européen sur l’IA) : créées sur notre propre ordinateur à Lochau et signalées comme images IA sur l’image et dans leurs métadonnées. Elles montrent une ambiance – pas de bateaux réels, pas de projets clients, pas de produits de notre assortiment. Les images de produits proviennent des fabricants.",
  },
  materials: {
    eyebrow: "Échantillons et matériaux",
    heading: "Faits pour le soleil, l’eau et le vent",
    text: "À bord, les exigences ne sont pas celles d’un salon. Pour chaque produit, nous vérifions ce que le fabricant indique pour un usage en extérieur et à bord. Tissus, échantillons de teck et finitions se voient et se touchent en vrai – dans notre showroom ou directement à bord.",
    items: [
      { swatch: "teak", name: "Teck", text: "Robuste et agréable sous les pieds. Sans huile, il prend avec le temps une teinte gris argenté." },
      { swatch: "weave", name: "Toile acrylique teinte dans la masse", text: "Très bonne tenue des couleurs, séchage rapide. Les valeurs figurent sur la fiche technique du fabricant." },
      { swatch: "foam", name: "Mousse à cellules ouvertes", text: "Laisse l’eau s’écouler – pour les coussins de cockpit et de bain de soleil." },
      { swatch: "leather", name: "Similicuir nautique", text: "Facile d’entretien pour les banquettes. Nous demandons les données UV et d’inflammabilité sous forme de fiche technique." },
      { swatch: "steel", name: "Inox et aluminium", text: "Pour les structures et les ferrures. Alliage et finition adaptés à votre plan d’eau sont définis avec le fabricant et le chantier naval." },
      { swatch: "linen", name: "Lin et satin de coton", text: "Pour le salon et la cabine. Textiles d’intérieur – sous le pont et au sec." },
    ],
  },
  course: {
    eyebrow: "Cap sur l’hivernage",
    heading: "De septembre à la remise à l’eau",
    text: "Le meilleur moment pour un nouvel intérieur est l’hivernage : conception et fabrication avancent pendant que le bateau est à terre. Contactez-nous tôt, pour que le sellier nautique et le chantier naval puissent planifier les travaux. Mobilier de pont, textiles et hangars à bateaux sont aussi possibles en saison.",
    months: ["Sept", "Oct", "Nov", "Déc", "Janv", "Févr", "Mars", "Avr"],
    items: [
      { from: 0, to: 1, when: "Septembre – octobre", title: "Premier échange", us: "Rendez-vous, photos et plans existants", sattler: "–", werft: "Place d’hivernage" },
      { from: 2, to: 2, when: "Novembre", title: "Visite à bord", us: "Usage, style et zones", sattler: "Prise de mesures et gabarits", werft: "Accès, indications sur les fixations et le poids" },
      { from: 2, to: 3, when: "Novembre – décembre", title: "Concept", us: "Univers de couleurs, matériaux et liste de produits par zone – avec une répartition claire des rôles", sattler: "Faisabilité des coussins", werft: "Validation du poids et de la stabilité" },
      { from: 3, to: 4, when: "Décembre – janvier", title: "Échantillons", us: "Échantillons au showroom de Lochau ou à bord, commande de l’équipement mobile", sattler: "Choix du tissu et de la mousse avec fiches techniques", werft: "–" },
      { from: 4, to: 6, when: "Janvier – mars", title: "Fabrication", us: "Coordination des dates, préparation de la livraison", sattler: "Coussins, taud, bimini", werft: "Vernis, bois, points de fixation, électricité" },
      { from: 6, to: 7, when: "Mars – avril", title: "Montage et remise à l’eau", us: "Remise de l’équipement mobile", sattler: "Ajustage des coussins", werft: "Montage, perçages, réception" },
    ],
  },
  roles: {
    eyebrow: "Qui fait quoi",
    heading: "Trois intervenants, des rôles distincts",
    text: "Nous concevons et livrons l’équipement. Tout ce qui touche à la sécurité et à la technique de votre bateau reste du ressort du chantier naval. Nous le précisons par écrit dans chaque devis.",
    columns: [
      { title: "Platzhirsch", items: ["Concept, couleurs, tissus", "Meubles, textiles, lampes rechargeables, accessoires", "Livraison de l’équipement mobile", "Coordination des dates avec le sellier et le chantier"] },
      { title: "Sellier nautique", items: ["Prise de mesures et gabarits", "Coussins, housses, taud et bimini", "Choix du tissu et de la mousse avec fiches techniques", "Ajustage des coussins à bord"] },
      { title: "Chantier naval", items: ["Interventions sur la structure et la coque", "Électricité, gaz, ventilation", "Perçages et fixations", "Validation du poids et de la stabilité"] },
    ],
  },
  brands: {
    eyebrow: "Marques de notre assortiment",
    heading: "Choisies pour l’extérieur et le bord de l’eau",
    text: "Nous ne recommandons que des collections que le fabricant prévoit pour l’usage concerné. Avant chaque devis, nous vérifions par écrit avec le fabricant si un modèle peut être utilisé à bord.",
    groups: [
      {
        title: "Sur le pont",
        items: [
          { name: "Paola Lenti", slug: "paola-lenti", text: "Mobilier d’extérieur, tapis et ses propres tissus d’extérieur – le fabricant présente aussi des projets dans le yachting." },
          { name: "Tuuci", slug: "tuuci", text: "Mobilier d’extérieur de la collection Bleau. Tuuci cite les environnements marins et le yachting comme domaine d’utilisation de la marque ; parasols sur demande." },
        ],
      },
      {
        title: "Sous le pont – mobile et au sec",
        items: [
          { name: "Minotti", slug: "minotti", featured: ["Lido (Sofas)", "Libra Coffee Table"], text: "Canapés, tables, tapis et textiles de la collection intérieure pour le salon – posés librement et fixés par le chantier naval." },
          { name: "Flos", slug: "flos", text: "Lampes rechargeables, comme Bellhop ou Bon Jour Unplugged – sans raccordement fixe." },
          { name: "Treca", slug: "treca", text: "Surmatelas. Pour les couchettes, nous demandons des dimensions sur mesure au fabricant." },
          { name: "Alonpi", slug: "alonpi", text: "Linge de lit, couvertures et plaids pour la cabine et le salon." },
        ],
      },
      {
        title: "Hangar à bateaux, ponton et terrasse sur le lac",
        items: [
          { name: "Solpuri", slug: "solpuri", text: "Mobilier d’extérieur : tables, chaises, lounge et bains de soleil." },
          { name: "Umbrosa", slug: "umbrosa", text: "Parasols et voiles d’ombrage de Belgique." },
          { name: "Heatsail", slug: "heatsail", text: "De la chaleur pour les soirées au bord de l’eau – pour prolonger la saison." },
          { name: "Poliform", slug: "poliform", text: "Modèles d’extérieur comme le lounge Ketch pour la terrasse et le hangar à bateaux." },
          { name: "Sifas", slug: "sifas", text: "Mobilier d’extérieur, daybeds et lounges pour la terrasse et le ponton." },
          { name: "Livintwist", slug: "livintwist", text: "Bains de soleil et baldaquins d’extérieur tressés." },
        ],
      },
    ],
  },
  area: {
    eyebrow: "Plan d’eau",
    heading: "Au lac de Constance – et en Méditerranée",
    regions: [
      {
        title: "Lac de Constance",
        text: "Ports et lieux d’hivernage sur les rives autrichienne, allemande et suisse – de Lochau, Bregenz et Hard à Lindau et Friedrichshafen, Rorschach et Romanshorn. Nous convenons des visites à bord directement avec vous.",
      },
      {
        title: "Méditerranée",
        text: "Votre bateau est amarré sur l’Adriatique ou sur une autre côte de la Méditerranée ? Nous discutons volontiers de la conception et des échantillons à Lochau. La livraison et le montage sur place sont définis individuellement pour chaque projet.",
      },
    ],
    showroom: "Notre showroom, Landstraße 11, 6911 Lochau, se trouve directement au bord du lac de Constance, là où se rejoignent l’Autriche, l’Allemagne et la Suisse. Du mardi au vendredi de 10 h à 18 h, le samedi de 10 h à 14 h – pour un conseil sur votre bateau, nous vous recommandons de prendre rendez-vous.",
  },
  cta: {
    heading: "Rendez-vous à bord ou au showroom",
    text: "Parlez-nous de votre bateau ou de votre hangar à bateaux. Nous venons au port ou sur le lieu d’hivernage – ou vous nous rendez visite à Lochau pour voir tissus et matériaux en vrai.",
    primaryLabel: "Demander un rendez-vous",
    mailSubject: "Demande – intérieur de yacht",
    href: "/conseil?thema=yacht",
  },
  trade: {
    eyebrow: "Pour les professionnels du nautisme",
    heading: "Chantier, sellier, skipper : ensemble sur un même bateau",
    text: "Beaucoup de projets ne commencent pas chez le propriétaire, mais chez vous – en hivernage, lors de la prise de mesures ou à la remise du bateau. Nous apportons la conception, des marques de notre assortiment et le showroom de Lochau. Le savoir-faire et la technique restent de votre ressort.",
    paths: [
      { title: "Chantiers navals", text: "Un propriétaire souhaite un nouvel intérieur lors d’un refit ? Nous fournissons concept et équipement mobile. Interventions, fixations et validation du poids et de la stabilité restent chez votre chantier.", subject: "Collaboration chantier naval – intérieur de yacht", label: "Écrire en tant que chantier" },
      { title: "Selliers nautiques", text: "Vous réalisez coussins, taud et bimini. Nous définissons avec le propriétaire l’univers de couleurs et le choix des tissus – prise de mesures, gabarits et fabrication restent chez vous.", subject: "Collaboration sellier nautique – intérieur de yacht", label: "Écrire en tant que sellier" },
      { title: "Skippers et gestion de yachts", text: "Vous gérez un bateau pour son propriétaire, au lac de Constance ou en Méditerranée ? Nous convenons avec vous des rendez-vous à bord ; conception et échantillons, à Lochau ou en visio.", subject: "Skipper / gestion de yacht – intérieur de yacht", label: "Convenir d’un rendez-vous" },
    ],
  },
  schema: {
    serviceName: "Intérieurs de yachts et de bateaux",
    serviceType: "Aménagement et décoration intérieure de bateaux, de yachts et de hangars à bateaux",
    description:
      "Conception et aménagement du pont, du salon, des cabines et des hangars à bateaux avec du mobilier d’extérieur, des tissus et de la lumière. Prise de mesures, fabrication et montage par des selliers nautiques et des chantiers navals ; Platzhirsch coordonne les dates.",
    areaServed: ["Lac de Constance", "Vorarlberg", "Bavière", "Bade-Wurtemberg", "Suisse orientale", "Méditerranée"],
    alternateName: ["Intérieur de yacht", "Aménagement de bateau", "Yacht Interior Design"],
    audience: ["Propriétaires de bateaux et de yachts", "Chantiers navals", "Selliers nautiques"],
  },
  faq: {
    name: "yacht-faq",
    heading: "Questions sur l’intérieur de yacht et les coussins de bateau",
    items: [
      {
        q: "Fabriquez-vous vous-mêmes les coussins de bateau ?",
        a: "Non. Nous prenons en charge la conception et le conseil en tissus et en couleurs. La prise de mesures et la fabrication des coussins sont confiées à un sellier nautique de la région. Nous coordonnons les dates et précisons dans le devis qui fournit quelle prestation.",
      },
      {
        q: "Quel tissu et quelle mousse conviennent aux coussins de bateau ?",
        a: "Pour le cockpit et le pont, le plus souvent une toile acrylique teinte dans la masse ou un similicuir nautique, sur une mousse à cellules ouvertes qui laisse l’eau s’écouler. Sous le pont, le lin et le satin de coton conviennent aussi, à condition de rester au sec. Les valeurs de résistance aux UV, de tenue des couleurs et d’inflammabilité figurent sur la fiche technique du fabricant – nous la demandons avant le devis et choisissons tissu et mousse avec le sellier nautique. Les échantillons se voient au showroom de Lochau ou à bord.",
      },
      {
        q: "À quels bateaux s’adresse l’offre ?",
        a: "Surtout aux bateaux à moteur et aux voiliers avec cabine ou flybridge, tels qu’on les trouve sur le lac de Constance et en Méditerranée, ainsi qu’aux hangars à bateaux. Parlez-nous aussi d’autres bateaux – nous vous dirons franchement si nous pouvons vous aider.",
      },
      {
        q: "Travaillez-vous aussi pour des chantiers navals et des selliers nautiques ?",
        a: "Oui. Lorsqu’un propriétaire souhaite une conception pour le salon, les cabines ou le pont, nous prenons en charge le concept, le conseil en couleurs et en tissus et l’équipement mobile – avec une liste de produits indiquant les poids et les données des fabricants. La prise de mesures, la fabrication, le montage et toute intervention sur le bateau restent de votre ressort. Nous venons volontiers vous voir au chantier ou sur le lieu d’hivernage.",
      },
      {
        q: "Quel est le meilleur moment pour un nouvel intérieur ?",
        a: "L’hivernage, de novembre à février. Le bateau est alors à terre, et il reste du temps pour la conception et la fabrication avant la remise à l’eau au printemps. Contactez-nous tôt, pour que le sellier et le chantier puissent planifier les travaux. Pour le mobilier de pont, les textiles et les hangars à bateaux, c’est aussi possible en saison.",
      },
      {
        q: "Combien coûte un nouvel intérieur pour mon bateau ?",
        a: "Cela dépend de la taille du bateau, du nombre de zones et des produits choisis – c’est pourquoi nous ne donnons pas de prix forfaitaires. Après la visite à bord, vous recevez un devis écrit pour le concept et l’équipement mobile. Les coussins et les travaux sur le bateau sont proposés séparément par le sellier nautique et le chantier naval ; le devis précise qui fournit quelle prestation.",
      },
      {
        q: "Installez-vous aussi des meubles fixes à bord ?",
        a: "Les interventions sur la structure, l’électricité, le gaz ou la ventilation, ainsi que les perçages et les fixations, sont toujours réalisés par le chantier naval. Nous nous concentrons sur la conception et l’équipement mobile. Ainsi, la responsabilité de la technique de votre bateau reste entre de bonnes mains.",
      },
      {
        q: "Les meubles et les tissus conviennent-ils à un usage à bord ?",
        a: "Nous ne choisissons que des produits que le fabricant prévoit pour l’extérieur, et nous vérifions avec lui, avant le devis, si un modèle peut être utilisé à bord. Les données sur le poids, l’entretien et les propriétés des matériaux vous sont remises avec le devis.",
      },
      {
        q: "Puis-je utiliser des meubles Minotti sur mon bateau ?",
        a: "Sous le pont, oui : canapés, tables, tapis et textiles de la collection intérieure, posés librement, fixés par le chantier naval et au sec. Pour le pont et le cockpit, seules entrent en ligne de compte les collections que le fabricant prévoit pour l’extérieur. Avant le devis, nous vérifions par écrit avec le fabricant si un modèle peut être utilisé à bord. L’effet des meubles Minotti sur un yacht est illustré par le projet de référence Custom Line Navetta 42 présenté sur cette page – il n’a pas été aménagé par Platzhirsch.",
      },
      {
        q: "Le bateau en 3D sur cette page est-il mon bateau ?",
        a: "Non. Le modèle 3D est un schéma pour plusieurs types de bateaux. Il montre les zones à bord et ce que nous y proposons. Les meubles y apparaissent sous forme de volumes simplifiés ; les vrais produits sont montrés avec l’image du fabricant. Pour votre bateau, nous commençons par une visite à bord.",
      },
      {
        q: "Les images des exemples de concepts sont-elles de vrais projets ?",
        a: "Non. Ce sont des visualisations de concept – en partie calculées avec Blender (légende « Visualisation (rendu 3D) »), en partie générées par IA et signalées comme telles. Elles montrent une ambiance – pas de bateaux réels, pas de projets clients, pas de produits de notre assortiment. Nous ne montrons de vraies photos qu’avec l’accord écrit des propriétaires.",
      },
      {
        q: "Concevez-vous aussi le hangar à bateaux, le ponton et le jardin au bord du lac ?",
        a: "Oui. Pour le hangar à bateaux, le ponton, la terrasse sur le lac et le jardin, nous associons l’aménagement à notre conception extérieure. La conception du jardin et l’exécution sont confiées à des entreprises habilitées, par exemple des paysagistes ; nous les coordonnons pour vous.",
      },
      {
        q: "Vous occupez-vous aussi de bateaux en Méditerranée ?",
        a: "Oui, volontiers. Nous discutons de la conception et des échantillons à Lochau ou en visio. L’organisation de la livraison et du montage à la place d’amarrage est définie individuellement pour chaque projet.",
      },
    ],
  },
};

const IT = {
  hero: {
    crumb: "Interni per yacht",
    eyebrow: "Barche · Yacht · Rimesse",
    title: "Interni per yacht sul lago di Costanza",
    motto: "Accomodatevi – a bordo.",
    lead: "Vivere il lago, anche a bordo. Progettiamo pozzetto, coperta, salone e cabine della vostra barca – e la vostra rimessa – con arredi outdoor, tessuti e luce.",
    secondary: { href: "#werfthalle", label: "Guardate la barca in 3D" },
    usp: "Veniamo a bordo. Harald Menghin disegna il concept a mano, poi seguono la progettazione 3D e il rendering.",
  },
  intro: {
    eyebrow: "Una barca è uno spazio abitativo con regole proprie",
    heading: "Tra arte della tappezzeria e progetto di design",
    paragraphs: [
      "Poco spazio, tanto sole, umidità – e ogni chilo conta. Portiamo a bordo la nostra esperienza nell’arredamento d’interni e outdoor: un concept per colori, tessuti, cuscini, luce e arredo mobile, adatto alla vostra barca e al vostro stile.",
      "Rilievo delle misure, realizzazione e montaggio sono affidati ad aziende specializzate – un tappezziere nautico e il vostro cantiere. Coordiniamo i lavori con loro, perché progetto e artigianato vadano d’accordo.",
    ],
    rules: [
      { name: "Peso", text: "Ogni chilo conta. Indichiamo i pesi con l’offerta, il cantiere li approva." },
      { name: "Umidità e sole", text: "All’esterno solo ciò che il produttore prevede per l’esterno. I tessili per la casa restano sottocoperta e all’asciutto." },
      { name: "Movimento", text: "Ciò che è mobile deve stare fermo: riposto prima della navigazione o fissato dal cantiere." },
    ],
  },
  werfthalle: {
    eyebrow: "Il capannone del cantiere",
    heading: "Percorrete la vostra barca, ambiente per ambiente",
    text: "Nel rimessaggio invernale la barca è a terra e liberamente accessibile. Scegliete un tipo di barca e una zona: la telecamera si sposta lì, e per salone, cabina e bagno la coperta viene sezionata. Accanto trovate ciò che proponiamo per quella zona.",
    note: "Il modello 3D è uno schema, non la vostra barca. Gli arredi vi compaiono come forme semplificate nei colori del concept – nessuna riproduzione di mobili di design. I prodotti reali li vedete accanto, con l’immagine del produttore.",
    initial: "motoryacht-riviera",
  },
  concepts: {
    eyebrow: "Concept di esempio",
    heading: "Dal runabout alla rimessa",
    text: "Ogni concept ha un motto, una palette di colori, materiali e prodotti del nostro assortimento, zona per zona. Sono esempi – non progetti di clienti.",
    aiNote:
      "Le immagini dei concept di esempio sono visualizzazioni concettuali. Una parte è realizzata in rendering con Blender e porta la didascalia «Visualizzazione (rendering)»; le altre sono generate con l’IA (art. 50 del Regolamento UE sull’IA): create sul nostro computer a Lochau e contrassegnate come immagini IA sull’immagine e nei dati dell’immagine. Mostrano un’atmosfera – non barche reali, non progetti di clienti e non prodotti del nostro assortimento. Le immagini dei prodotti provengono dai produttori.",
  },
  materials: {
    eyebrow: "Campioni e materiali",
    heading: "Fatti per sole, acqua e vento",
    text: "A bordo valgono requisiti diversi rispetto al soggiorno. Per ogni prodotto verifichiamo le indicazioni del produttore sull’uso all’aperto e a bordo. Tessuti, campioni di teak e finiture li vedete e toccate dal vero – nel nostro showroom o direttamente a bordo.",
    items: [
      { swatch: "teak", name: "Teak", text: "Robusto e piacevole sotto i piedi. Senza olio, col tempo diventa grigio argento." },
      { swatch: "weave", name: "Tessuto acrilico tinto in massa", text: "Colori molto stabili, asciuga rapidamente. I valori sono nella scheda tecnica del produttore." },
      { swatch: "foam", name: "Espanso a cellule aperte", text: "Lascia defluire l’acqua – per i cuscini del pozzetto e dei prendisole." },
      { swatch: "leather", name: "Similpelle nautica", text: "Di facile manutenzione, per le sedute. I dati su UV e infiammabilità li richiediamo come scheda tecnica." },
      { swatch: "steel", name: "Acciaio inox e alluminio", text: "Per strutture e ferramenta. Lega e finitura per le vostre acque le definiamo con produttore e cantiere." },
      { swatch: "linen", name: "Lino e raso di cotone", text: "Per salone e cabina. Tessili per la casa – sottocoperta e all’asciutto." },
    ],
  },
  course: {
    eyebrow: "Rotta sul rimessaggio invernale",
    heading: "Da settembre alla rimessa in acqua",
    text: "Il momento migliore per nuovi interni è il rimessaggio invernale: progettazione e realizzazione procedono mentre la barca è a terra. Contattateci per tempo, così tappezziere nautico e cantiere possono pianificare i lavori. Arredi di coperta, tessili e rimesse sono possibili anche durante la stagione.",
    months: ["Set", "Ott", "Nov", "Dic", "Gen", "Feb", "Mar", "Apr"],
    items: [
      { from: 0, to: 1, when: "Settembre – ottobre", title: "Primo colloquio dopo la stagione", us: "Appuntamento, foto e piani esistenti", sattler: "–", werft: "Posto nel rimessaggio invernale" },
      { from: 2, to: 2, when: "Novembre", title: "Sopralluogo a bordo", us: "Uso, stile e zone", sattler: "Rilievo delle misure e sagome", werft: "Accesso, indicazioni su fissaggi e peso" },
      { from: 2, to: 3, when: "Novembre – dicembre", title: "Concept", us: "Palette di colori, materiali e lista prodotti per zona – con una chiara ripartizione di chi fa cosa", sattler: "Fattibilità dei cuscini", werft: "Approvazione di peso e stabilità" },
      { from: 3, to: 4, when: "Dicembre – gennaio", title: "Campioni", us: "Campioni nello showroom di Lochau o a bordo, ordine dell’arredo mobile", sattler: "Scelta di tessuto ed espanso con schede tecniche", werft: "–" },
      { from: 4, to: 6, when: "Gennaio – marzo", title: "Realizzazione", us: "Coordinare le date, preparare la consegna", sattler: "Cuscini, telo copribarca, bimini", werft: "Vernice, legno, punti di fissaggio, impianto elettrico" },
      { from: 6, to: 7, when: "Marzo – aprile", title: "Montaggio e rimessa in acqua", us: "Consegna dell’arredo mobile", sattler: "Adattamento dei cuscini", werft: "Montaggio, forature, collaudo" },
    ],
  },
  roles: {
    eyebrow: "Chi fa cosa",
    heading: "Tre attori, ruoli ben distinti",
    text: "Noi progettiamo e forniamo l’arredo. Tutto ciò che riguarda la sicurezza e la tecnica della vostra barca resta al cantiere. Lo mettiamo per iscritto in ogni offerta.",
    columns: [
      { title: "Platzhirsch", items: ["Concept, colori, tessuti", "Mobili, tessili, lampade a batteria, accessori", "Consegna dell’arredo mobile", "Coordinamento delle date con tappezziere e cantiere"] },
      { title: "Tappezziere nautico", items: ["Rilievo delle misure e sagome", "Cuscini, rivestimenti, telo copribarca e bimini", "Scelta di tessuto ed espanso con schede tecniche", "Adattamento dei cuscini a bordo"] },
      { title: "Cantiere", items: ["Interventi su struttura e scafo", "Impianto elettrico, gas, ventilazione", "Forature e fissaggi", "Approvazione di peso e stabilità"] },
    ],
  },
  brands: {
    eyebrow: "Marchi del nostro assortimento",
    heading: "Scelti per l’esterno e per l’acqua",
    text: "Consigliamo solo collezioni che il produttore prevede per l’uso specifico. Prima di ogni offerta chiariamo per iscritto con il produttore se un modello può essere usato a bordo.",
    groups: [
      {
        title: "In coperta",
        items: [
          { name: "Paola Lenti", slug: "paola-lenti", text: "Arredi outdoor, tappeti e tessuti outdoor propri – il produttore mostra anche progetti nel settore dello yachting." },
          { name: "Tuuci", slug: "tuuci", text: "Arredi outdoor della collezione Bleau. Tuuci indica gli ambienti marini e lo yachting come campo d’impiego del marchio; ombrelloni su richiesta." },
        ],
      },
      {
        title: "Sottocoperta – mobile e all’asciutto",
        items: [
          { name: "Minotti", slug: "minotti", featured: ["Lido (Sofas)", "Libra Coffee Table"], text: "Divani, tavoli, tappeti e tessili della collezione indoor per il salone – appoggiati liberamente e fissati dal cantiere." },
          { name: "Flos", slug: "flos", text: "Lampade a batteria come Bellhop o Bon Jour Unplugged – senza allacciamento fisso." },
          { name: "Treca", slug: "treca", text: "Topper per materassi. Per le cuccette chiediamo al produttore misure speciali." },
          { name: "Alonpi", slug: "alonpi", text: "Biancheria da letto, coperte e plaid per cabina e salone." },
        ],
      },
      {
        title: "Rimessa, pontile e terrazza sul lago",
        items: [
          { name: "Solpuri", slug: "solpuri", text: "Arredi outdoor: tavoli, sedie, lounge e lettini." },
          { name: "Umbrosa", slug: "umbrosa", text: "Ombrelloni e vele ombreggianti dal Belgio." },
          { name: "Heatsail", slug: "heatsail", text: "Calore per le serate in riva all’acqua – così la stagione dura di più." },
          { name: "Poliform", slug: "poliform", text: "Modelli outdoor come il lounge Ketch per terrazza e rimessa." },
          { name: "Sifas", slug: "sifas", text: "Arredi outdoor, daybed e lounge per terrazza e pontile." },
          { name: "Livintwist", slug: "livintwist", text: "Lettini outdoor e canopy in intreccio." },
        ],
      },
    ],
  },
  area: {
    eyebrow: "Acque di casa",
    heading: "Di casa sul lago di Costanza – e in navigazione nel Mediterraneo",
    regions: [
      {
        title: "Lago di Costanza",
        text: "Porti e rimessaggi sulle sponde austriaca, tedesca e svizzera – da Lochau, Bregenz e Hard fino a Lindau e Friedrichshafen, Rorschach e Romanshorn. I sopralluoghi a bordo li concordiamo direttamente con voi.",
      },
      {
        title: "Mediterraneo",
        text: "La vostra barca è ormeggiata sull’Adriatico o su un’altra costa del Mediterraneo? Progettazione e campioni li discutiamo volentieri a Lochau. Consegna e montaggio sul posto li definiamo individualmente per ogni progetto.",
      },
    ],
    showroom: "Il nostro showroom si trova in Landstraße 11, 6911 Lochau, direttamente sul lago di Costanza, dove si incontrano Austria, Germania e Svizzera. Da martedì a venerdì 10–18, sabato 10–14 – per una consulenza sulla vostra barca vi consigliamo di fissare un appuntamento.",
  },
  cta: {
    heading: "Appuntamento a bordo o nello showroom",
    text: "Raccontateci della vostra barca o della vostra rimessa. Veniamo in porto o al rimessaggio – oppure venite a trovarci a Lochau e vedete tessuti e materiali dal vero.",
    primaryLabel: "Richiedete un appuntamento",
    mailSubject: "Richiesta interni per yacht",
    href: "/consulenza?thema=yacht",
  },
  trade: {
    eyebrow: "Per i professionisti della nautica",
    heading: "Cantiere, tappezziere, skipper: insieme su una barca",
    text: "Molti progetti non iniziano dall’armatore, ma da voi – nel rimessaggio, durante il rilievo o alla consegna. Noi portiamo progettazione, marchi del nostro assortimento e lo showroom di Lochau. Artigianato e tecnica restano a voi.",
    paths: [
      { title: "Cantieri", text: "Un armatore desidera nuovi interni in occasione del refit? Forniamo concept e arredo mobile. Interventi, fissaggi e l’approvazione di peso e stabilità restano al vostro cantiere.", subject: "Collaborazione cantiere – interni per yacht", label: "Scriveteci come cantiere" },
      { title: "Tappezzieri nautici", text: "Realizzate cuscini, teli copribarca e bimini. Noi definiamo con l’armatore la palette di colori e la scelta dei tessuti – rilievo, sagome e realizzazione restano a voi.", subject: "Collaborazione tappezziere nautico – interni per yacht", label: "Scriveteci come tappezziere" },
      { title: "Skipper e yacht management", text: "Seguite una barca per conto dell’armatore – sul lago di Costanza o nel Mediterraneo? Concordiamo con voi gli appuntamenti a bordo; progettazione e campioni li discutiamo a Lochau o in videochiamata.", subject: "Skipper / yacht management – interni per yacht", label: "Concordate un appuntamento" },
    ],
  },
  schema: {
    serviceName: "Interni per yacht e barche",
    serviceType: "Progettazione e arredamento d’interni di barche, yacht e rimesse",
    description:
      "Progettazione e arredamento di coperta, salone, cabine e rimesse con arredi outdoor, tessuti e luce. Rilievo, realizzazione e montaggio sono affidati a tappezzieri nautici e cantieri; Platzhirsch coordina le date.",
    areaServed: ["Lago di Costanza", "Vorarlberg", "Baviera", "Baden-Württemberg", "Svizzera orientale", "Mediterraneo"],
    alternateName: ["Interni per yacht", "Arredamento nautico", "Yacht Interior Design"],
    audience: ["Armatori di barche e yacht", "Cantieri", "Tappezzieri nautici"],
  },
  faq: {
    name: "yacht-faq",
    heading: "Domande su interni per yacht e cuscini nautici",
    items: [
      {
        q: "Realizzate voi i cuscini per la barca?",
        a: "No. Ci occupiamo della progettazione e della consulenza su tessuti e colori. Rilievo e realizzazione dei cuscini sono affidati a un tappezziere nautico della zona. Coordiniamo le date e indichiamo nell’offerta chi fornisce quale prestazione.",
      },
      {
        q: "Quale tessuto e quale espanso sono adatti ai cuscini della barca?",
        a: "Per pozzetto e coperta di solito tessuto acrilico tinto in massa o similpelle nautica, su espanso a cellule aperte che lascia defluire l’acqua. Sottocoperta vanno bene anche lino e raso di cotone, purché restino all’asciutto. I valori di resistenza ai raggi UV, solidità del colore e infiammabilità si trovano nella scheda tecnica del produttore – la richiediamo prima dell’offerta e scegliamo tessuto ed espanso insieme al tappezziere nautico. I campioni li vedete nello showroom di Lochau o a bordo.",
      },
      {
        q: "Per quali barche è pensata l’offerta?",
        a: "Soprattutto per barche a motore e barche a vela con cabina o flybridge, come sono diffuse sul lago di Costanza e nel Mediterraneo, oltre che per le rimesse. Contattateci anche per altre barche – vi diremo onestamente se possiamo aiutarvi.",
      },
      {
        q: "Lavorate anche per cantieri e tappezzieri nautici?",
        a: "Sì. Se un armatore desidera un progetto per salone, cabine o coperta, ci occupiamo di concept, consulenza su colori e tessuti e arredo mobile – con una lista prodotti che riporta pesi e dati del produttore. Rilievo, realizzazione, montaggio e ogni intervento sulla barca restano a voi. Veniamo volentieri a trovarvi in cantiere o al rimessaggio.",
      },
      {
        q: "Qual è il momento migliore per nuovi interni?",
        a: "Il rimessaggio invernale, da novembre a febbraio. La barca è allora a terra, e fino alla rimessa in acqua in primavera c’è tempo per progettazione e realizzazione. Contattateci per tempo, così tappezziere e cantiere possono pianificare i lavori. Per arredi di coperta, tessili e rimesse si può anche durante la stagione.",
      },
      {
        q: "Quanto costano nuovi interni per la mia barca?",
        a: "Dipende dalle dimensioni della barca, dal numero di zone e dai prodotti scelti – per questo non indichiamo prezzi forfettari. Dopo il sopralluogo a bordo ricevete un’offerta scritta per concept e arredo mobile. Cuscini e lavori sulla barca sono offerti separatamente dal tappezziere nautico e dal cantiere; nell’offerta è indicato chi fornisce quale prestazione.",
      },
      {
        q: "Installate anche mobili fissi a bordo?",
        a: "Gli interventi su struttura, impianto elettrico, gas o ventilazione, così come forature e fissaggi, li esegue sempre il cantiere. Noi ci concentriamo su progettazione e arredo mobile. Così la responsabilità per la tecnica della vostra barca resta nelle mani giuste.",
      },
      {
        q: "Mobili e tessuti sono adatti all’uso a bordo?",
        a: "Scegliamo solo prodotti che il produttore prevede per l’esterno e, prima dell’offerta, chiariamo con il produttore se un modello può essere usato a bordo. I dati su peso, manutenzione e caratteristiche dei materiali li ricevete con l’offerta.",
      },
      {
        q: "Posso usare mobili Minotti sulla mia barca?",
        a: "Sottocoperta sì: divani, tavoli, tappeti e tessili della collezione indoor, appoggiati liberamente, fissati dal cantiere e all’asciutto. Per coperta e pozzetto entrano in considerazione solo collezioni che il produttore prevede per l’esterno. Prima dell’offerta chiariamo per iscritto con il produttore se un modello può essere usato a bordo. Come appaiono i mobili Minotti su uno yacht lo mostra il progetto di riferimento Custom Line Navetta 42 su questa pagina – non è stato arredato da Platzhirsch.",
      },
      {
        q: "La barca in 3D su questa pagina è la mia barca?",
        a: "No. Il modello 3D è uno schema per diversi tipi di barca. Mostra quali zone ci sono a bordo e cosa vi proponiamo. Gli arredi compaiono come forme semplificate; i prodotti reali li vedete con l’immagine del produttore. Per la vostra barca iniziamo con un sopralluogo a bordo.",
      },
      {
        q: "Le immagini dei concept di esempio sono progetti reali?",
        a: "No. Sono visualizzazioni concettuali – in parte realizzate in rendering con Blender (didascalia «Visualizzazione (rendering)»), in parte generate con l’IA e contrassegnate come tali. Mostrano un’atmosfera – non barche reali, non progetti di clienti e non prodotti del nostro assortimento. Foto reali le mostriamo solo con il consenso scritto degli armatori.",
      },
      {
        q: "Progettate anche rimessa, pontile e giardino sul lago?",
        a: "Sì. Per rimessa, pontile, terrazza sul lago e giardino abbiniamo l’arredo alla nostra progettazione outdoor. La progettazione del giardino e l’esecuzione sono affidate ad aziende abilitate, ad esempio del settore giardinaggio e paesaggistica; le coordiniamo per voi.",
      },
      {
        q: "Seguite anche barche nel Mediterraneo?",
        a: "Sì, volentieri. Progettazione e campioni li discutiamo a Lochau o in videochiamata. Come organizzare consegna e montaggio all’ormeggio lo definiamo individualmente per ogni progetto.",
      },
    ],
  },
};

export const META_FR = Object.freeze(frenchTypography(META_FR_SRC));
export const META_IT = Object.freeze(META_IT_SRC);
export const CONTENT_FR = frenchTypography(FR);
export const CONTENT_IT = IT;

/** Seitentexte und Metadaten der neuen Sprachen. */
export const YACHT_INTL = Object.freeze({
  fr: { meta: META_FR, content: CONTENT_FR },
  it: { meta: META_IT, content: CONTENT_IT },
});
