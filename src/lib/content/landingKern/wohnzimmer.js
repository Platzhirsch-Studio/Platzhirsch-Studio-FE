// src/lib/content/landingKern/wohnzimmer.js – EN/FR/IT der Seite
// /<locale>/wohnzimmer-einrichten-vorarlberg. Mastertext: CONTENT in
// src/app/[locale]/wohnzimmer-einrichten-vorarlberg/page.js (Deutsch).
// Nur Texte (mergeText in ./index.js). Minotti und Poliform nur als Marken
// im Sortiment (keine Händleraussage); der Sofaplaner-Link ohne Markennamen
// (gilt mit und ohne Minotti-Zustimmung, src/lib/sofaplaner/consent.js).

export const META = {
  en: {
    title: "Living room design in Vorarlberg",
    description:
      "Designer sofas, armchairs and living concepts by Minotti, Poliform and other brands – planned in person in our showroom in Lochau on Lake Constance.",
    og: { eyebrow: "Living", title: "Furnishing your living room in Vorarlberg" },
  },
  fr: {
    title: "Aménager son séjour au Vorarlberg",
    description:
      "Canapés design, fauteuils et concepts de séjour de Minotti, Poliform et d’autres marques – conçus avec vous dans notre showroom de Lochau.",
    og: { eyebrow: "Séjour", title: "Aménager son séjour au Vorarlberg" },
  },
  it: {
    title: "Arredare il soggiorno in Vorarlberg",
    description:
      "Divani di design, poltrone e concept living di Minotti, Poliform e altri marchi – progettati di persona nel nostro showroom a Lochau.",
    og: { eyebrow: "Living", title: "Arredare il soggiorno in Vorarlberg" },
  },
};

const EN = {
  processText:
    "Before we suggest a sofa, Harald Menghin draws your living room by hand: seating, sightlines and light. Then we plan in 3D and show you a rendering before anything is ordered.",
  banner: {
    title: "Furnishing your living room in Vorarlberg",
    alt: "Living room with a light corner sofa, coffee table and armchairs",
    crumb: "Living room Vorarlberg",
  },
  intro: {
    eyebrow: "Living concepts on Lake Constance",
    heading: "A living room you love coming home to",
    paragraphs: [
      "The living room is where you relax, welcome guests and spend time with your family. At Platzhirsch Home Living in Lochau we plan living rooms that fit your everyday life – with designer sofas, armchairs, tables, lights and rugs by international brands.",
      "Whether a generous sofa landscape, an open living and dining area or a quiet reading corner: we match furniture, materials and light so that individual pieces become a coherent whole.",
    ],
    benefits: [
      "Try out sofas and armchairs in the showroom",
      "Compare fabrics, leathers and surfaces in the original",
      "Furniture, lights and rugs from a single source",
      "Delivery and installation on request",
    ],
    imageAlt: "Spacious living room with grey sofas and a view of the greenery",
  },
  brands: {
    eyebrow: "Our living brands",
    heading: "Designer sofas and armchairs that last",
    items: [
      {
        imageAlt: "White Minotti corner sofa in a living room with a dark wood wall",
        text: "Italian sofas and armchairs with generous proportions, fine fabrics and crafted precision – modular sofa landscapes that adapt to your room.",
      },
      {
        imageAlt: "Poliform armchairs and coffee tables in a bright living room",
        text: "Clear lines and timeless elegance – from sofas and armchairs to tables and wall units that come together in a calm, harmonious whole.",
      },
    ],
    cta: { label: "View all sofas" },
  },
  steps: {
    eyebrow: "How your living room comes about",
    heading: "From the idea to the finished room",
    items: [
      { title: "Consultation in the showroom", text: "We talk about your room, your habits and your style – and show you suitable sofas, armchairs and tables." },
      { title: "Planning the room", text: "We plan the layout, sizes and routes so that the living room feels open and works well every day." },
      { title: "Materials & details", text: "You choose fabrics, leathers, colours and surfaces – complemented by lights, rugs and accessories." },
      { title: "Delivery & installation", text: "We coordinate delivery and assembly so that your new living room ends up exactly as it was planned." },
    ],
    links: [
      { label: "How we work: from hand drawing to rendering" },
      { label: "Plan a sofa from modules" },
      { label: "Find your interior style" },
      { label: "Guide: what does a Minotti sofa cost?" },
    ],
  },
  gallery: [
    { alt: "Living room with a fireplace, armchairs and a round rug" },
    { alt: "Illuminated glass display cabinet with decoration next to a floor lamp" },
    { alt: "Side tables in glass and brass in front of a concrete wall" },
  ],
  showroom: {
    heading: "Try out sofas – right on Lake Constance",
    text: "In our showroom in Lochau, just a few minutes from Bregenz, you can try out sofas and armchairs and compare materials. Drop in – or book an appointment for a detailed consultation.",
  },
  cta: {
    heading: "Let’s plan your new living room",
    text: "Arrange a no-obligation consultation in our showroom in Lochau.",
  },
  faq: {
    heading: "Questions about furnishing a living room",
    items: [
      { q: "Can I try out sofas and armchairs before buying?", a: "Yes. In our showroom in Lochau you can try out many models and compare fabrics, leathers and surfaces directly." },
      { q: "Which brands do you offer for the living room?", a: "Among others Minotti and Poliform, as well as other international design brands for furniture, lights and accessories. In the consultation we work out together which combination suits your room." },
      { q: "Do I need an appointment for a consultation?", a: "You are welcome at any time during our opening hours (Tue–Fri 10 am–6 pm, Sat 10 am–2 pm). For detailed planning we recommend an appointment so that we can take enough time for you." },
      { q: "Do you also plan the complete living room?", a: "Yes. We match sofas, armchairs, tables, lights, rugs and accessories – on request together with the dining area and kitchen." },
      { q: "What should I bring to the consultation?", a: "The dimensions of your room or a floor plan, photos of your current furnishings and – if you have them – pictures you like are helpful." },
      { q: "How long does delivery take?", a: "That depends on the brand, model and version. We give you the specific time frame as soon as your selection is settled." },
      { q: "Do you deliver and install outside Vorarlberg?", a: "Delivery and installation are available on request, including outside Vorarlberg. For projects in Germany, Switzerland and Liechtenstein, please get in touch with us directly." },
    ],
  },
};

const FR = {
  processText:
    "Avant de vous proposer un canapé, Harald Menghin dessine votre séjour à la main : places assises, perspectives et lumière. Ensuite, nous planifions en 3D et vous montrons un rendu avant toute commande.",
  banner: {
    title: "Aménager son séjour au Vorarlberg",
    alt: "Séjour avec canapé d’angle clair, table basse et fauteuils",
    crumb: "Séjour Vorarlberg",
  },
  intro: {
    eyebrow: "Concepts de séjour au lac de Constance",
    heading: "Un séjour où il fait bon rentrer",
    paragraphs: [
      "Le séjour est la pièce où vous vous détendez, recevez vos invités et passez du temps en famille. Chez Platzhirsch Home Living à Lochau, nous concevons des séjours adaptés à votre quotidien – avec des canapés design, des fauteuils, des tables, des luminaires et des tapis de marques internationales.",
      "Grand canapé modulable, séjour et salle à manger ouverts ou coin lecture paisible : nous accordons meubles, matériaux et lumière pour que des pièces isolées forment un ensemble cohérent.",
    ],
    benefits: [
      "Essayer canapés et fauteuils au showroom",
      "Comparer tissus, cuirs et surfaces en vrai",
      "Meubles, luminaires et tapis d’un seul interlocuteur",
      "Livraison et pose sur demande",
    ],
    imageAlt: "Grand séjour avec canapés gris et vue sur la verdure",
  },
  brands: {
    eyebrow: "Nos marques pour le séjour",
    heading: "Des canapés et fauteuils design qui durent",
    items: [
      {
        imageAlt: "Canapé d’angle Minotti blanc dans un séjour avec mur en bois sombre",
        text: "Canapés et fauteuils italiens aux proportions généreuses, aux tissus raffinés et à la précision artisanale – des compositions modulables qui s’adaptent à votre pièce.",
      },
      {
        imageAlt: "Fauteuils et tables basses Poliform dans un séjour lumineux",
        text: "Lignes claires et élégance intemporelle – des canapés et fauteuils aux tables et murs de rangement qui composent un ensemble calme et harmonieux.",
      },
    ],
    cta: { label: "Voir tous les canapés" },
  },
  steps: {
    eyebrow: "Comment naît votre séjour",
    heading: "De l’idée à la pièce terminée",
    items: [
      { title: "Conseil au showroom", text: "Nous parlons de votre pièce, de vos habitudes et de votre style – et vous montrons canapés, fauteuils et tables adaptés." },
      { title: "Planification de la pièce", text: "Nous planifions disposition, dimensions et circulations, pour que le séjour paraisse ouvert et fonctionne bien au quotidien." },
      { title: "Matériaux et détails", text: "Vous choisissez tissus, cuirs, couleurs et surfaces – complétés par luminaires, tapis et accessoires." },
      { title: "Livraison et pose", text: "Nous coordonnons livraison et montage, pour que votre nouveau séjour soit exactement tel qu’il a été planifié." },
    ],
    links: [
      { label: "Notre méthode : du dessin à la main au rendu" },
      { label: "Planifier un canapé modulable" },
      { label: "Trouver votre style d’intérieur" },
      { label: "Guide : combien coûte un canapé Minotti ?" },
    ],
  },
  gallery: [
    { alt: "Séjour avec cheminée, fauteuils et tapis rond" },
    { alt: "Vitrine éclairée avec décoration à côté d’un lampadaire" },
    { alt: "Tables d’appoint en verre et laiton devant un mur en béton" },
  ],
  showroom: {
    heading: "Essayer les canapés – au bord du lac de Constance",
    text: "Dans notre showroom de Lochau, à quelques minutes de Bregenz, vous pouvez essayer canapés et fauteuils et comparer les matériaux. Passez nous voir – ou prenez rendez-vous pour un conseil approfondi.",
  },
  cta: {
    heading: "Concevons votre nouveau séjour",
    text: "Prenez un rendez-vous de conseil sans engagement dans notre showroom à Lochau.",
  },
  faq: {
    heading: "Questions sur l’aménagement du séjour",
    items: [
      { q: "Puis-je essayer canapés et fauteuils avant d’acheter ?", a: "Oui. Dans notre showroom de Lochau, vous pouvez essayer de nombreux modèles et comparer directement tissus, cuirs et surfaces." },
      { q: "Quelles marques proposez-vous pour le séjour ?", a: "Notamment Minotti et Poliform, ainsi que d’autres marques de design internationales pour les meubles, les luminaires et les accessoires. Lors de l’entretien conseil, nous déterminons ensemble la combinaison qui convient à votre pièce." },
      { q: "Faut-il un rendez-vous pour le conseil ?", a: "Vous êtes les bienvenus à tout moment pendant nos heures d’ouverture (mar–ven 10 h–18 h, sam 10 h–14 h). Pour une planification détaillée, nous recommandons un rendez-vous afin de prendre le temps nécessaire pour vous." },
      { q: "Concevez-vous aussi le séjour complet ?", a: "Oui. Nous accordons canapés, fauteuils, tables, luminaires, tapis et accessoires – sur demande avec la salle à manger et la cuisine." },
      { q: "Que faut-il apporter au rendez-vous ?", a: "Les dimensions de votre pièce ou un plan, des photos de l’aménagement actuel et – si vous en avez – des images qui vous plaisent vous seront utiles." },
      { q: "Combien de temps faut-il jusqu’à la livraison ?", a: "Cela dépend de la marque, du modèle et de l’exécution. Nous vous indiquons le délai concret dès que votre choix est arrêté." },
      { q: "Livrez-vous et posez-vous aussi hors du Vorarlberg ?", a: "La livraison et la pose sont possibles sur demande, y compris hors du Vorarlberg. Pour des projets en Allemagne, en Suisse et au Liechtenstein, contactez-nous directement." },
    ],
  },
};

const IT = {
  processText:
    "Prima di proporvi un divano, Harald Menghin disegna a mano il vostro soggiorno: sedute, assi visivi e luce. Poi progettiamo in 3D e vi mostriamo un rendering prima di ordinare qualsiasi cosa.",
  banner: {
    title: "Arredare il soggiorno in Vorarlberg",
    alt: "Soggiorno con divano angolare chiaro, tavolino e poltrone",
    crumb: "Soggiorno Vorarlberg",
  },
  intro: {
    eyebrow: "Concept living sul Lago di Costanza",
    heading: "Un soggiorno in cui tornare volentieri",
    paragraphs: [
      "Il soggiorno è l’ambiente in cui vi rilassate, accogliete gli ospiti e passate il tempo con la famiglia. Da Platzhirsch Home Living a Lochau progettiamo soggiorni su misura della vostra quotidianità – con divani di design, poltrone, tavoli, lampade e tappeti di marchi internazionali.",
      "Che sia un ampio divano componibile, una zona living e pranzo aperta o un tranquillo angolo lettura: armonizziamo arredi, materiali e luce, perché i singoli pezzi diventino un insieme coerente.",
    ],
    benefits: [
      "Provare divani e poltrone nello showroom",
      "Confrontare tessuti, pelli e superfici dal vero",
      "Arredi, lampade e tappeti da un unico partner",
      "Consegna e montaggio su richiesta",
    ],
    imageAlt: "Ampio soggiorno con divani grigi e vista sul verde",
  },
  brands: {
    eyebrow: "I nostri marchi per il living",
    heading: "Divani e poltrone di design che restano",
    items: [
      {
        imageAlt: "Divano angolare Minotti bianco in un soggiorno con parete in legno scuro",
        text: "Divani e poltrone italiani dalle proporzioni generose, con tessuti pregiati e precisione artigianale – composizioni modulari che si adattano al vostro ambiente.",
      },
      {
        imageAlt: "Poltrone e tavolini Poliform in un soggiorno luminoso",
        text: "Linee pulite ed eleganza senza tempo – da divani e poltrone a tavoli e pareti attrezzate che si uniscono in un insieme calmo e armonioso.",
      },
    ],
    cta: { label: "Guardate tutti i divani" },
  },
  steps: {
    eyebrow: "Come nasce il vostro soggiorno",
    heading: "Dall’idea all’ambiente finito",
    items: [
      { title: "Consulenza nello showroom", text: "Parliamo del vostro ambiente, delle vostre abitudini e del vostro stile – e vi mostriamo divani, poltrone e tavoli adatti." },
      { title: "Progettazione dell’ambiente", text: "Progettiamo disposizione, dimensioni e percorsi, perché il soggiorno risulti aperto e funzioni bene ogni giorno." },
      { title: "Materiali e dettagli", text: "Scegliete tessuti, pelli, colori e superfici – completati da lampade, tappeti e accessori." },
      { title: "Consegna e montaggio", text: "Coordiniamo consegna e montaggio, perché il vostro nuovo soggiorno sia esattamente come è stato progettato." },
    ],
    links: [
      { label: "Il nostro metodo: dal disegno a mano al rendering" },
      { label: "Progettate un divano a moduli" },
      { label: "Trovate il vostro stile" },
      { label: "Guida: quanto costa un divano Minotti?" },
    ],
  },
  gallery: [
    { alt: "Soggiorno con camino, poltrone e tappeto rotondo" },
    { alt: "Vetrina illuminata con decorazioni accanto a una lampada da terra" },
    { alt: "Tavolini in vetro e ottone davanti a una parete in cemento" },
  ],
  showroom: {
    heading: "Provare i divani – sul Lago di Costanza",
    text: "Nel nostro showroom a Lochau, a pochi minuti da Bregenz, potete provare divani e poltrone e confrontare i materiali. Passate a trovarci – oppure fissate un appuntamento per una consulenza approfondita.",
  },
  cta: {
    heading: "Progettiamo il vostro nuovo soggiorno",
    text: "Fissate un appuntamento di consulenza senza impegno nel nostro showroom a Lochau.",
  },
  faq: {
    heading: "Domande sull’arredamento del soggiorno",
    items: [
      { q: "Posso provare divani e poltrone prima dell’acquisto?", a: "Sì. Nel nostro showroom a Lochau potete provare molti modelli e confrontare direttamente tessuti, pelli e superfici." },
      { q: "Quali marchi proponete per il soggiorno?", a: "Tra gli altri Minotti e Poliform, oltre ad altri marchi di design internazionali per arredi, lampade e accessori. Quale combinazione si adatta al vostro ambiente lo chiariamo insieme durante la consulenza." },
      { q: "Serve un appuntamento per la consulenza?", a: "Siete i benvenuti in qualsiasi momento durante i nostri orari di apertura (mar–ven 10–18, sab 10–14). Per una progettazione dettagliata consigliamo un appuntamento, così possiamo dedicarvi il tempo necessario." },
      { q: "Progettate anche il soggiorno completo?", a: "Sì. Armonizziamo divani, poltrone, tavoli, lampade, tappeti e accessori – su richiesta insieme a zona pranzo e cucina." },
      { q: "Cosa devo portare alla consulenza?", a: "Sono utili le misure del vostro ambiente o una pianta, foto dell’arredamento attuale e – se le avete – immagini che vi piacciono." },
      { q: "Quanto tempo ci vuole per la consegna?", a: "Dipende da marchio, modello ed esecuzione. Vi indichiamo i tempi concreti non appena la vostra scelta è definita." },
      { q: "Consegnate e montate anche fuori dal Vorarlberg?", a: "Consegna e montaggio sono disponibili su richiesta, anche fuori dal Vorarlberg. Per progetti in Germania, Svizzera e Liechtenstein contattateci direttamente." },
    ],
  },
};

export const INTL = { en: EN, fr: FR, it: IT };
