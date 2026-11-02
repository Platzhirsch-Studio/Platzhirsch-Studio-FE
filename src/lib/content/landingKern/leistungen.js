// src/lib/content/landingKern/leistungen.js – Texte der Übersicht
// /<locale>/leistungen („Planen & Erleben“) in DE, EN, FR und IT.
// DE = die bisherigen Texte aus src/components/Labs/Hub/LabsHub.js (Master);
// die Kartentexte der Werkzeuge kommen auf Deutsch aus src/lib/features.js,
// hier stehen nur ihre Übersetzungen (FEATURES je Sprache, nach Feature-id).
// Regeln: keine Preise („auf Anfrage“), KI als KI gekennzeichnet (AI Act),
// „Richtwert, keine Steuerberatung“ wörtlich, Werkzeuge ohne eigene
// Sprachfassung im Titel als deutsch/englisch gekennzeichnet (./index.js).
// Rein (keine "@/..."-Importe): node --test lädt es.

export const META = {
  de: {
    title: "Planen & Erleben – Leistungen und Planer online",
    // Beschreibung mit dem Sofaplaner-Namen setzt page.js (SOURCE_COPY), wie bisher.
  },
  en: {
    title: "Plan & explore – services and online planners",
    description:
      "Advice, hand drawing, 3D planning: kitchen planner, sofa planner, style finder, 3D and AR view and services from Platzhirsch Home Living in Lochau.",
    schema: "Advice, hand drawing, 3D planning and digital tools from Platzhirsch Home Living in Lochau.",
    ogAlt: "Platzhirsch tools: kitchen planner, sofa planner and 3D view",
  },
  fr: {
    title: "Planifier & découvrir – services et outils en ligne",
    description:
      "Conseil, dessin à la main, plan 3D : planificateurs de cuisine et de canapé, test de style, vue 3D et RA et services de Platzhirsch à Lochau.",
    schema: "Conseil, dessin à la main, planification 3D et outils numériques de Platzhirsch Home Living à Lochau.",
    ogAlt: "Outils Platzhirsch : planificateur de cuisine, de canapé et vue 3D",
  },
  it: {
    title: "Progettare & scoprire – servizi e planner online",
    description:
      "Consulenza, disegno a mano, progetto 3D: planner cucina e divano, test dello stile, vista 3D e AR e servizi di Platzhirsch Home Living a Lochau.",
    schema: "Consulenza, disegno a mano, progetto 3D e strumenti digitali di Platzhirsch Home Living a Lochau.",
    ogAlt: "Strumenti Platzhirsch: planner cucina, planner divano e vista 3D",
  },
};

/** Texte des Hubs (LabsHub). `advice` in der Reihenfolge von LabsHub ADVICE. */
export const HUB = {
  de: {
    eyebrow: "Leistungen",
    title: "Planen & Erleben",
    lead: "Beratung im Showroom in Lochau, Planung von Hand und in 3D",
    leadMore: " – und digitale Werkzeuge, mit denen Sie vorab starten. Verbindlich planen wir gemeinsam mit Ihnen",
    personal: "Lieber persönlich?",
    request: "Beratung anfragen",
    areas: "Bereiche",
    uspTitle: "Beraten & planen",
    uspText:
      "Harald Menghin zeichnet Einrichtungen und Konzepte von Hand und baut Raummodelle. Erst danach folgen 3D-Planung und fotorealistisches Rendering. Wenn Ihr Projekt es braucht, sind wir auch ein, zwei Tage vor Ort.",
    closingText:
      "Die Werkzeuge ersetzen keine Beratung. Preise, Maße und Lieferzeiten klären wir im Gespräch – im Showroom an der Landstraße 11 in Lochau oder per Telefon.",
    advice: [
      { label: "Beratung & Termin", text: "Im Showroom mit Café in Lochau oder bei Ihnen zu Hause." },
      { label: "Unsere Arbeitsweise", text: "Von der Handzeichnung über das Modell zum Rendering." },
      { label: "Interior Design", text: "Raumkonzepte für Haus, Wohnung und Objekt." },
      { label: "Küchenplanung", text: "Planung im Studio, mit Aufmaß und Montage auf Wunsch." },
      { label: "Hotel & Objekt", text: "Hotels, Chalets und Gastronomie, mit Montage im Saisonfenster." },
      { label: "Architekten & Bauträger", text: "Planungsdaten, Muster und eine Projektanfrage für Ihr Büro." },
      { label: "Ratgeber", text: "Was kostet ein Minotti-Sofa, was eine Küche, wie kommen Möbel in die Schweiz." },
    ],
    outdoor: { label: "Garten & Terrasse planen", text: "Outdoor-Konzept mit Möbeln, Beschattung und Licht." },
    heroAlts: [
      "Küchenplaner: L-Küche im Grundriss mit Modulen und Maßen",
      "Sofaplaner: Ecksofa im Grundriss eines Raums mit Maßen",
      "3D-Ansicht: Beispielmodell eines Sessels mit eingeblendeten Maßen",
    ],
  },
  en: {
    eyebrow: "Services",
    title: "Plan & explore",
    lead: "Advice in the showroom in Lochau, planning by hand and in 3D",
    leadMore: " – and digital tools to get you started beforehand. We finalise the binding plan together with you",
    personal: "Prefer to talk in person?",
    request: "Request a consultation",
    areas: "Sections",
    uspTitle: "Advice & planning",
    uspText:
      "Harald Menghin draws interiors and concepts by hand and builds room models. Only then do 3D planning and photorealistic rendering follow. If your project needs it, we also come on site for a day or two.",
    closingText:
      "The tools do not replace a consultation. We clarify prices, dimensions and delivery times in conversation – in the showroom at Landstraße 11 in Lochau or by phone.",
    advice: [
      { label: "Consultation & appointment", text: "In the showroom with café in Lochau or at your home." },
      { label: "How we work", text: "From hand drawing via the model to the rendering." },
      { label: "Interior design", text: "Room concepts for houses, flats and commercial projects." },
      { label: "Kitchen planning", text: "Planning in the studio, with measuring and installation on request." },
      { label: "Hotels & commercial projects", text: "Hotels, chalets and restaurants, with installation in the off-season window." },
      { label: "Architects & developers", text: "Planning data, samples and a project enquiry for your office." },
      { label: "Guides", text: "What a Minotti sofa costs, what a kitchen costs, how furniture gets to Switzerland." },
    ],
    outdoor: { label: "Plan your garden & terrace", text: "Outdoor concept with furniture, shade and lighting." },
    heroAlts: [
      "Kitchen planner: L-shaped kitchen in the floor plan with modules and dimensions",
      "Sofa planner: corner sofa in the floor plan of a room with dimensions",
      "3D view: sample model of an armchair with dimensions shown",
    ],
  },
  fr: {
    eyebrow: "Services",
    title: "Planifier & découvrir",
    lead: "Conseil au showroom de Lochau, conception à la main et en 3D",
    leadMore: " – et des outils numériques pour commencer en amont. La planification définitive se fait avec vous",
    personal: "Vous préférez un échange en personne ?",
    request: "Demander un conseil",
    areas: "Rubriques",
    uspTitle: "Conseiller & concevoir",
    uspText:
      "Harald Menghin dessine aménagements et concepts à la main et construit des maquettes. C’est seulement ensuite que viennent la planification 3D et le rendu photoréaliste. Si votre projet le demande, nous venons aussi un ou deux jours sur place.",
    closingText:
      "Les outils ne remplacent pas un conseil. Nous clarifions prix, dimensions et délais de livraison de vive voix – au showroom, Landstraße 11 à Lochau, ou par téléphone.",
    advice: [
      { label: "Conseil et rendez-vous", text: "Au showroom avec café à Lochau ou chez vous." },
      { label: "Notre méthode", text: "Du dessin à la main au rendu, en passant par la maquette." },
      { label: "Design d’intérieur", text: "Concepts pour maisons, appartements et projets professionnels." },
      { label: "Conception de cuisine", text: "Conception au studio, relevé de cotes et pose sur demande." },
      { label: "Hôtels et projets professionnels", text: "Hôtels, chalets et restaurants, avec pose hors saison." },
      { label: "Architectes et promoteurs", text: "Données de plan, échantillons et demande de projet pour votre bureau." },
      { label: "Guides", text: "Prix d’un canapé Minotti, d’une cuisine, livraison de meubles en Suisse." },
    ],
    outdoor: { label: "Aménager jardin et terrasse", text: "Concept extérieur avec mobilier, ombrage et lumière." },
    heroAlts: [
      "Planificateur de cuisine : cuisine en L sur le plan avec modules et cotes",
      "Planificateur de canapé : canapé d’angle sur le plan d’une pièce avec cotes",
      "Vue 3D : modèle d’exemple d’un fauteuil avec cotes affichées",
    ],
  },
  it: {
    eyebrow: "Servizi",
    title: "Progettare & scoprire",
    lead: "Consulenza nello showroom a Lochau, progettazione a mano e in 3D",
    leadMore: " – e strumenti digitali con cui iniziare prima. Il progetto vincolante lo definiamo insieme a voi",
    personal: "Preferite parlarne di persona?",
    request: "Richiedete una consulenza",
    areas: "Sezioni",
    uspTitle: "Consulenza & progetto",
    uspText:
      "Harald Menghin disegna a mano arredi e concept e costruisce modelli degli ambienti. Solo dopo seguono progetto 3D e rendering fotorealistico. Se il vostro progetto lo richiede, veniamo anche sul posto per uno o due giorni.",
    closingText:
      "Gli strumenti non sostituiscono la consulenza. Prezzi, misure e tempi di consegna li chiariamo a voce – nello showroom in Landstraße 11 a Lochau o al telefono.",
    advice: [
      { label: "Consulenza e appuntamento", text: "Nello showroom con caffè a Lochau o a casa vostra." },
      { label: "Il nostro metodo", text: "Dal disegno a mano al rendering, passando per il modello." },
      { label: "Interior design", text: "Concept per case, appartamenti e progetti contract." },
      { label: "Progettazione cucine", text: "Progetto in studio, con rilievo misure e montaggio su richiesta." },
      { label: "Hotel e contract", text: "Hotel, chalet e ristorazione, con montaggio fuori stagione." },
      { label: "Architetti e costruttori", text: "Dati di progetto, campioni e una richiesta di progetto per il vostro studio." },
      { label: "Guide", text: "Quanto costa un divano Minotti, quanto una cucina, come arrivano i mobili in Svizzera." },
    ],
    outdoor: { label: "Progettare giardino e terrazza", text: "Concept outdoor con arredi, ombreggiatura e luce." },
    heroAlts: [
      "Planner cucina: cucina a L in pianta con moduli e misure",
      "Planner divano: divano angolare nella pianta di un ambiente con misure",
      "Vista 3D: modello di esempio di una poltrona con le misure",
    ],
  },
};

/** Gruppen (src/lib/features.js FEATURE_GROUPS) je Sprache. */
export const GROUPS = {
  en: {
    planen: { label: "Plan online", intro: "Tools to prepare your project. Start online – Harald Menghin then draws your concept by hand." },
    erleben: { label: "Explore", intro: "See furniture, rooms and worlds before they arrive at your home." },
    service: { label: "Service", intro: "Short paths between you and the team in Lochau." },
    fachleute: { label: "For specialists", intro: "For AI assistants and developers: catalogue, showroom and way of working, machine-readable." },
  },
  fr: {
    planen: { label: "Planifier en ligne", intro: "Des outils pour préparer votre projet. Commencez en ligne – Harald Menghin dessine ensuite votre concept à la main." },
    erleben: { label: "Découvrir", intro: "Voir meubles, pièces et univers avant qu’ils n’arrivent chez vous." },
    service: { label: "Service", intro: "Des échanges simples entre vous et l’équipe de Lochau." },
    fachleute: { label: "Pour les professionnels", intro: "Pour assistants IA et développeurs : catalogue, showroom et méthode, lisibles par machine." },
  },
  it: {
    planen: { label: "Progettare online", intro: "Strumenti per preparare il vostro progetto. Iniziate online – Harald Menghin disegna poi il vostro concept a mano." },
    erleben: { label: "Scoprire", intro: "Guardate arredi, ambienti e mondi prima che arrivino da voi." },
    service: { label: "Servizio", intro: "Percorsi brevi tra voi e il team di Lochau." },
    fachleute: { label: "Per professionisti", intro: "Per assistenti IA e sviluppatori: catalogo, showroom e metodo, leggibili dalle macchine." },
  },
};

// Kartentexte je Feature-id. `visual` = Beschreibung der gezeichneten Grafik
// (aria-label in FeatureVisual), `alt` = Bildtext, `credit` = Quellenangabe.
// sofaplaner: Titel aus sourceCopyFor(locale) (consent.js), Text ohne Marke –
// stimmt mit und ohne Minotti-Zustimmung.
export const FEATURES = {
  en: {
    kuechenplaner: { title: "Kitchen planner", summary: "Lay out a single-line, L- or U-shaped kitchen in the floor plan, choose fronts and worktops and view the result in 3D.", note: "Prices on request. We do the detailed planning with you in person.", alt: "Kitchen planner: L-shaped kitchen in the floor plan with modules and dimensions" },
    sofaplaner: { summary: "Step by step to your own combination: choose a sofa type, adjust the modules, check the dimensions in the floor plan.", alt: "Sofa planner: corner sofa of three elements in the floor plan of a room, with dimensions" },
    stilfinder: { title: "Style finder", summary: "Six picture questions on room, material, colour and light – ending with your style profile with colour palette, brands and mood board.", visual: "drawn colour palettes" },
    licht: { title: "Lake Constance light", summary: "The real position of the sun for your location, window direction, date and time – in the kitchen and by the pool, with a light sheet to print.", visual: "drawn path of the sun above the horizon" },
    arviewer: { title: "View in 3D & AR", summary: "Rotate furniture in 3D, show dimensions and use your phone to place it at full size in your own room.", note: "Selected pieces from our range.", visual: "drawn cube with dimension lines on a floor grid", ownAlt: "3D view: armchair as a 3D sample model with dimensions shown, width 101 cm and height 117 cm" },
    showroom: { title: "Showroom tour", summary: "The exhibition in Lochau as a tour: view the stations, click on pieces, save them or request an appointment.", visual: "drawn floor plan with six stations" },
    yacht: { title: "Yacht interiors", summary: "Interiors for boats and boathouses on Lake Constance – with concept worlds and the boat in 3D.", alt: "Yacht interior: drawn boat on the evening lake" },
    outdoor: { title: "Outdoor & garden", summary: "Your garden as a living space: outdoor concept with furniture, shade and lighting, coordinated with licensed specialist firms for landscaping, pool and technical services.", visual: "drawn contour lines" },
    ezarri: { title: "Ezarri glass mosaic", summary: "Glass mosaic by Ezarri for bathroom, pool and wellness: range, tile overview and configurator.", alt: "Pool with Ezarri Celestite, turquoise glass mosaic", credit: "Image: Ezarri, ezarri.com" },
    dreilaender: { title: "Three-country calculator", summary: "Map of the border region with driving times and an estimate calculator for buying from Switzerland, Liechtenstein and Germany.", note: "Estimate only, not tax advice.", alt: "Three-country calculator: map with Lochau and places in four countries" },
    concierge: { title: "AI concierge", summary: "Ask about our range, brands and showroom – an AI answers and hands over to a person on request.", note: "You are chatting with an AI. No binding prices or delivery commitments.", alt: "AI concierge: sample conversation about a sofa, labelled as AI" },
    upload: { title: "Send photos by phone", summary: "After your enquiry, scan the QR code and send photos, a room video or plans to us directly from your phone.", visual: "drawn phone with camera viewfinder and three photos on their way to the studio" },
    portal: { title: "My Platzhirsch", summary: "Your project in one place: appointments, documents, messages, your room in 3D and the trades – sign-in by link, without a password.", visual: "drawn project folder with tabs and a key" },
    pflege: { title: "Care service", summary: "Leather, fabric and wood: a care appointment at your home, one-off or yearly as a subscription. Prices on request.", visual: "drawn armchair with a care cloth and a drop of care product" },
    agent: { title: "For AI assistants", summary: "Catalogue, showroom and way of working readable for AI assistants (MCP) – with an appointment request that you confirm yourself.", visual: "drawn connections between catalogue, showroom and appointment" },
  },
  fr: {
    kuechenplaner: { title: "Planificateur de cuisine", summary: "Placer une cuisine linéaire, en L ou en U sur le plan, choisir façades et plans de travail et voir le résultat en 3D.", note: "Prix sur demande. La planification détaillée se fait avec vous, en personne.", alt: "Planificateur de cuisine : cuisine en L sur le plan avec modules et cotes" },
    sofaplaner: { summary: "Pas à pas vers votre propre composition : choisir un type de canapé, ajuster les modules, vérifier les dimensions sur le plan.", alt: "Planificateur de canapé : canapé d’angle de trois éléments sur le plan d’une pièce, avec cotes" },
    stilfinder: { title: "Test de style", summary: "Six questions en images sur la pièce, la matière, la couleur et la lumière – avec à la fin votre profil de style, palette de couleurs, marques et planche d’ambiance.", visual: "palettes de couleurs dessinées" },
    licht: { title: "Lumière du lac de Constance", summary: "La position réelle du soleil pour votre lieu, l’orientation de vos fenêtres, la date et l’heure – en cuisine et au bord de la piscine, avec une fiche lumière à imprimer.", visual: "course du soleil dessinée au-dessus de l’horizon" },
    arviewer: { title: "Voir en 3D et en RA", summary: "Faire pivoter des meubles en 3D, afficher les dimensions et les placer en taille réelle dans votre pièce avec le téléphone.", note: "Pièces choisies de notre assortiment.", visual: "cube dessiné avec lignes de cote sur une grille au sol", ownAlt: "Vue 3D : fauteuil en modèle d’exemple 3D avec cotes affichées, largeur 101 cm et hauteur 117 cm" },
    showroom: { title: "Visite du showroom", summary: "L’exposition de Lochau en visite : voir les étapes, cliquer sur les pièces, les enregistrer ou demander un rendez-vous.", visual: "plan dessiné avec six étapes" },
    yacht: { title: "Intérieurs de yacht", summary: "Aménagement de bateaux et de hangars à bateaux au lac de Constance – avec des univers de concept et le bateau en 3D.", alt: "Intérieur de yacht : bateau dessiné sur le lac, le soir" },
    outdoor: { title: "Extérieur et jardin", summary: "Votre jardin comme espace de vie : concept extérieur avec mobilier, ombrage et lumière, coordonné avec des entreprises habilitées pour le paysagisme, la piscine et la technique.", visual: "courbes de niveau dessinées" },
    ezarri: { title: "Mosaïque de verre Ezarri", summary: "Mosaïque de verre Ezarri pour salle de bains, piscine et bien-être : gamme, aperçu des carreaux et configurateur.", alt: "Piscine en Ezarri Celestite, mosaïque de verre turquoise", credit: "Image : Ezarri, ezarri.com" },
    dreilaender: { title: "Calculateur des trois pays", summary: "Carte de la région des trois frontières avec temps de trajet et calculateur de valeur indicative pour un achat depuis la Suisse, le Liechtenstein et l’Allemagne.", note: "Valeur indicative, pas de conseil fiscal.", alt: "Calculateur des trois pays : carte avec Lochau et des localités de quatre pays" },
    concierge: { title: "Concierge IA", summary: "Poser des questions sur l’assortiment, les marques et le showroom – une IA répond et transmet à une personne sur demande.", note: "Vous écrivez avec une IA. Aucun prix ni délai de livraison contractuel.", alt: "Concierge IA : exemple de conversation sur un canapé, signalé comme IA" },
    upload: { title: "Envoyer des photos par téléphone", summary: "Après votre demande, scannez le code QR et envoyez-nous photos, vidéo de la pièce ou plans directement depuis votre téléphone.", visual: "téléphone dessiné avec viseur et trois photos en route vers le studio" },
    portal: { title: "Mon Platzhirsch", summary: "Votre projet en un seul endroit : rendez-vous, documents, messages, votre pièce en 3D et les corps de métier – connexion par lien, sans mot de passe.", visual: "dossier de projet dessiné avec onglets et clé" },
    pflege: { title: "Service d’entretien", summary: "Cuir, tissu et bois : un rendez-vous d’entretien chez vous, ponctuel ou annuel par abonnement. Prix sur demande.", visual: "fauteuil dessiné avec chiffon et goutte de produit d’entretien" },
    agent: { title: "Pour assistants IA", summary: "Catalogue, showroom et méthode lisibles par les assistants IA (MCP) – avec une demande de rendez-vous que vous confirmez vous-même.", visual: "liaisons dessinées entre catalogue, showroom et rendez-vous" },
  },
  it: {
    kuechenplaner: { title: "Planner cucina", summary: "Disponete in pianta una cucina lineare, a L o a U, scegliete ante e piani di lavoro e guardate il risultato in 3D.", note: "Prezzi su richiesta. Il progetto di dettaglio lo facciamo di persona con voi.", alt: "Planner cucina: cucina a L in pianta con moduli e misure" },
    sofaplaner: { summary: "Passo dopo passo verso la vostra composizione: scegliete il tipo di divano, adattate i moduli, verificate le misure in pianta.", alt: "Planner divano: divano angolare di tre elementi nella pianta di un ambiente, con misure" },
    stilfinder: { title: "Test dello stile", summary: "Sei domande per immagini su ambiente, materiale, colore e luce – alla fine il vostro profilo di stile con palette di colori, marchi e moodboard.", visual: "palette di colori disegnate" },
    licht: { title: "Luce del Lago di Costanza", summary: "La vera posizione del sole per il vostro luogo, l’orientamento delle finestre, la data e l’ora – in cucina e in piscina, con una scheda luce da stampare.", visual: "traiettoria del sole disegnata sopra l’orizzonte" },
    arviewer: { title: "Vedere in 3D e AR", summary: "Ruotate gli arredi in 3D, visualizzate le misure e collocateli a grandezza naturale nel vostro ambiente con lo smartphone.", note: "Pezzi selezionati del nostro assortimento.", visual: "cubo disegnato con quote su una griglia a pavimento", ownAlt: "Vista 3D: poltrona come modello 3D di esempio con le misure, larghezza 101 cm e altezza 117 cm" },
    showroom: { title: "Tour dello showroom", summary: "L’esposizione di Lochau come tour: guardate le tappe, cliccate sui pezzi, salvateli o richiedete un appuntamento.", visual: "pianta disegnata con sei tappe" },
    yacht: { title: "Interni per yacht", summary: "Arredamento per barche e rimesse sul Lago di Costanza – con mondi di concept e la barca in 3D.", alt: "Interni per yacht: barca disegnata sul lago al tramonto" },
    outdoor: { title: "Outdoor e giardino", summary: "Il vostro giardino come spazio abitativo: concept outdoor con arredi, ombreggiatura e luce, coordinato con imprese abilitate per giardinaggio, piscina e impianti.", visual: "curve di livello disegnate" },
    ezarri: { title: "Mosaico di vetro Ezarri", summary: "Mosaico di vetro Ezarri per bagno, piscina e wellness: gamma, panoramica delle tessere e configuratore.", alt: "Piscina in Ezarri Celestite, mosaico di vetro turchese", credit: "Immagine: Ezarri, ezarri.com" },
    dreilaender: { title: "Calcolatore dei tre paesi", summary: "Mappa della regione dei tre confini con tempi di percorrenza e un calcolatore indicativo per acquisti da Svizzera, Liechtenstein e Germania.", note: "Valore indicativo, non è una consulenza fiscale.", alt: "Calcolatore dei tre paesi: mappa con Lochau e località di quattro paesi" },
    concierge: { title: "Concierge IA", summary: "Fate domande su assortimento, marchi e showroom – risponde un’IA, che su richiesta passa la conversazione a una persona.", note: "State scrivendo con un’IA. Nessun prezzo o impegno di consegna vincolante.", alt: "Concierge IA: esempio di conversazione su un divano, contrassegnato come IA" },
    upload: { title: "Inviare foto dallo smartphone", summary: "Dopo la vostra richiesta, scansionate il codice QR e inviateci foto, video dell’ambiente o piante direttamente dallo smartphone.", visual: "smartphone disegnato con mirino e tre foto in viaggio verso lo studio" },
    portal: { title: "Il mio Platzhirsch", summary: "Il vostro progetto in un unico posto: appuntamenti, documenti, messaggi, il vostro ambiente in 3D e le imprese – accesso tramite link, senza password.", visual: "cartella di progetto disegnata con schede e chiave" },
    pflege: { title: "Servizio di cura", summary: "Pelle, tessuto e legno: un appuntamento di cura a casa vostra, singolo o annuale in abbonamento. Prezzi su richiesta.", visual: "poltrona disegnata con panno e una goccia di prodotto per la cura" },
    agent: { title: "Per assistenti IA", summary: "Catalogo, showroom e metodo leggibili dagli assistenti IA (MCP) – con una richiesta di appuntamento che confermate voi stessi.", visual: "collegamenti disegnati tra catalogo, showroom e appuntamento" },
  },
};
