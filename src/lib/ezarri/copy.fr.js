// src/lib/ezarri/copy.fr.js – textes français de la Ezarri-Welt (01.11.2026).
//
// Inhaber-Auftrag 01.11.2026: Ezarri-Welt auch auf Französisch (Romandie und
// Frankreich). Mastertext ist copy.js (Deutsch), gegengelesen mit copy.en.js;
// dieselben Export-Namen und dieselbe Struktur wie copy.en.js, damit Seiten
// nur die Quelle tauschen (ezCopy(locale) in lang.js). Fakten nur aus copy.js
// (Herstellerangaben „selon Ezarri“), keine Preise, keine Superlative.
//
// Händler-Aussage: dieselben zwei Schalter wie copy.js (EZARRI_PUBLIC und der
// Eintrag "ezarri" in src/lib/legal/claims.js); Satz und Titelwort kommen aus
// claims.js (dealerStatement, DEALER_TITLE_WORD).
//
// Werkzeuge (Konfigurator, Rechner, Custom Mix, Anfrage) gibt es auf Französisch
// noch nicht: Links dorthin führen zur englischen Fassung und sagen es im Label
// („en anglais“), Seiten nur auf Deutsch sagen „en allemand“.
//
// Französische Typografie (geschütztes Leerzeichen vor : ; ? ! %, in « ») steht
// direkt im Quelltext (kein Wrapper, damit Client-Komponenten einzelne Exporte
// tree-shaken laden können); Test: tests/unit/ezarri-welt-fr-it.test.mjs.
//
// Rein: keine Pakete, keine "@/"-Aliase. Server, Client und node --test.
import { DEALER_TITLE_WORD, dealerStatement, isVerifiedDealerBrand } from "../legal/claims.js";
import { ezarriDealerClaimVisible } from "./config.js";

/** Ligne neutre tant qu’aucune déclaration de revendeur ne peut être affichée. */
export const NEUTRAL_CLAIM = "Mosaïque de verre Ezarri – conseil et échantillons à Lochau";

/** Déclaration de revendeur (seulement si attestée ET activée), sinon null. */
export function dealerClaim(isPublic) {
  const visible = isPublic === undefined ? ezarriDealerClaimVisible() : ezarriDealerClaimVisible(isPublic);
  if (!visible || !isVerifiedDealerBrand("ezarri")) return null;
  return dealerStatement("ezarri", "fr") || null;
}

/** Mot du titre issu de la déclaration de revendeur, null tant qu’elle ne peut être affichée. */
export function dealerTitleWord(isPublic) {
  return dealerClaim(isPublic) ? DEALER_TITLE_WORD.fr : null;
}

/** Ligne dans l’encadré de la marque : déclaration de revendeur ou ligne neutre. */
export function dealerLine(isPublic) {
  return dealerClaim(isPublic) ?? NEUTRAL_CLAIM;
}

export const STUDIO = Object.freeze({
  ort: "Café-showroom, Landstraße 11, 6911 Lochau, Autriche",
  muster: "Nous commandons les échantillons pour votre rendez-vous.",
  laender: "Livraison si vous le souhaitez : autour du lac de Constance, dans la région des trois frontières et, sur demande, au-delà. Pour la Suisse s’ajoutent l’exportation et le dédouanement.",
  schweizHref: "/einkaufen-aus-der-schweiz",
});

export const NAV = Object.freeze({
  label: "Mosaïque de verre Ezarri",
  items: [
    { href: "/ezarri", label: "Aperçu", exact: true },
    { href: "/ezarri/mosaike", label: "Mosaïques" },
    { href: "/ezarri/kollektionen", label: "Collections" },
    { href: "/ezarri/galerie", label: "Galerie" },
    { href: "/ezarri/konfigurator", label: "Configurateur" },
    { href: "/ezarri/rechner", label: "Calculateur" },
    { href: "/ezarri/technik", label: "Technique" },
  ],
  muster: { href: "/ezarri/anfrage?art=muster", label: "Demander des échantillons" },
});

export const LINKS = Object.freeze({
  konfigurator: "/ezarri/konfigurator",
  rechner: "/ezarri/rechner",
  customMix: "/ezarri/custom-mix",
  anfrage: "/ezarri/anfrage",
  muster: (ids = []) => `/ezarri/anfrage?art=muster${ids.length ? `&ref=${ids.map(encodeURIComponent).join(",")}` : ""}`,
  // Page de conseil française (src/utils/routing.js : beratung → conseil).
  beratung: "/conseil?thema=ezarri",
  katalog: "/ezarri/anfrage?art=muster&thema=katalog",
  outdoor: "/outdoor-gartenplanung",
  kueche: "/kuechen-vorarlberg",
  interior: "/interior-design-vorarlberg",
  merkliste: "/liste-de-souhaits",
});

export const HUB = Object.freeze({
  crumb: "Mosaïque de verre Ezarri",
  eyebrow: "Ezarri · mosaïque en verre recyclé",
  title: "Mosaïque de verre Ezarri pour piscine, salle de bains et spa",
  lead: (st) =>
    `${st.mosaike} mosaïques dans ${st.kollektionen} collections, plus Safe-Steps et pièces spéciales – classées selon ce que vous verrez au final : lieu, couleur de l’eau, surface. Concevez votre bassin dans le navigateur et découvrez les échantillons chez nous à Lochau.`,
  description: (st) =>
    `Mosaïque de verre Ezarri pour piscine, bain, spa et cuisine : ${st.mosaike} mosaïques, ${st.kollektionen} collections, configurateur 3D, échantillons et conseil à Lochau.`,
  heroAlt: "Piscine en Ezarri Celestite, mosaïque de verre turquoise",
  primary: { label: "Concevoir votre bassin", sub: "3D dans le navigateur · sans inscription" },
  secondary: "Demander des échantillons",
  weiche: {
    eyebrow: "Utilisation",
    title: "Où poser la mosaïque ?",
    text: "Selon les fiches techniques, presque toutes les mosaïques Ezarri conviennent aux murs, aux piscines et aux espaces bien-être, à l’intérieur comme à l’extérieur. Sous chaque domaine figurent le nombre de mosaïques adaptées et le nombre de celles qu’Ezarri montre dans des projets de ce type.",
  },
  kachel: (n, mitBild) => [`${n} mosaïques adaptées`, mitBild ? `${mitBild} avec photo de projet` : null].filter(Boolean).join(" · "),
  wasser: {
    eyebrow: "Couleur de l’eau",
    title: "Quelle couleur aura votre eau ?",
    text: "La mosaïque détermine l’aspect de l’eau. Le blanc la fait paraître bleu ciel, le gris et le noir plutôt comme un lac de montagne. L’attribution provient d’Ezarri et dépend aussi de la hauteur d’eau et de la lumière du soleil.",
    alle: "Toutes les couleurs d’eau comparées",
  },
  kollektionen: {
    eyebrow: "Gamme",
    title: (st) => `${st.kollektionen}\u00a0collections et ${st.sonderanfertigungen}\u00a0lignes sur mesure`,
    alle: "Toutes les collections",
  },
  konfigurator: {
    eyebrow: "Configurateur",
    title: "Votre bassin, votre mélange",
    text: "Vos propres dimensions, jusqu’à quatre mosaïques mélangées, sept couleurs de joint, heure du jour et éclairage subaquatique. Le configurateur calcule les quantités au fur et à mesure.",
    link: "Ouvrir le configurateur",
    rechner: "Calculer la quantité",
    customMix: "Votre propre mélange ou motif (en anglais)",
  },
  technik: { eyebrow: "Technique", title: "Poser, entretenir, se documenter" },
  marke: {
    eyebrow: "La marque",
    text: "Ezarri fabrique de la mosaïque de verre à Lazkao (Gipuzkoa, Espagne). Selon Ezarri, le verre est composé à 100 % de verre recyclé, confirmé selon ISO 14021 ; la mosaïque finie en contient au moins 96 %, le reste étant des colorants et les points de collage (JointPoint).",
    website: "Site web d’Ezarri",
  },
  gastgeber: {
    eyebrow: "Café-showroom à Lochau",
    title: "Prendre la mosaïque en main",
    text: "Le verre paraît différent à la lumière du jour et à l’écran. Apportez vos plans ou vos photos, nous disposons les échantillons sur la table – avec vue sur le lac de Constance.",
    termin: "Demander un rendez-vous",
  },
  // Bloc USP (Inhaber-Entscheidung Nr. 8) : seul le vrai matériel comme travail de Harald.
  usp: {
    eyebrow: "Planifier avec Platzhirsch",
    title: "Votre piscine, d’abord dessinée à la main.",
    text: "La mosaïque ne révèle son effet qu’à la lumière et sur place. Nous venons voir votre piscine ou votre salle de bains. Harald Menghin dessine à la main motifs, dégradés de couleur et transitions. Ensuite, nous planifions en 3D et vous montrons un rendu avec les couleurs Ezarri avant toute commande.",
    arbeitsweise: "Notre façon de travailler",
    licht: "Voir le soleil sur le bassin (en allemand)",
  },
  teaserAlt: "Piscine privée en mosaïque de verre Ezarri",
  schweiz: "Acheter depuis la Suisse",
  oeffnet: "(ouvre ezarri.com)",
  referenzen: (n) => `${n} références`,
});

/**
 * Domaines d’utilisation (§3.2). Mêmes ids, filtres et images que copy.js ;
 * seuls les textes sont en français. Les liens vers des pages en allemand le disent.
 */
export const WELTEN = Object.freeze([
  {
    id: "pool",
    label: "Piscine",
    title: "Mosaïque de verre pour piscines",
    seoTitle: "Mosaïque de verre pour piscine, lac de Constance",
    description: "Mosaïque Ezarri pour piscine : choisir la couleur de l’eau, Safe-Steps antidérapants, Corner et Cove pour les arêtes. Échantillons à Lochau.",
    lead: "Dans une piscine, la couleur ne suffit pas : le joint, la résistance au glissement des marches et des bords, des angles nets. Vous voyez ici ce qui compte et les mosaïques qu’Ezarri destine aux piscines.",
    filter: { einsatz: ["pool"] },
    galerie: ["pool-privat", "pool-oeffentlich"],
    bild: { galerie: "anw-6-terrazzo-teal-50-ezarri-mosaics-pool-home", alt: "Piscine intérieure étroite avec vue sur la mer, bassin en Ezarri Terrazzo Teal 50" },
    hinweise: [
      ["Joint", "Pour les piscines, Ezarri recommande un joint époxy de classe RG. Selon Ezarri, les joints au ciment doivent être refaits après environ 5 à 6 ans."],
      ["Marches et bord", "Pour les marches, les banquettes et le bord du bassin, il existe des versions Safe antidérapantes avec des valeurs testées selon DIN EN 16165."],
      ["Arêtes", "Les pièces Corner encadrent les arêtes extérieures, les pièces Cove forment la gorge entre mur et sol."],
      ["Couleur de l’eau", "Les mosaïques claires rendent l’eau lumineuse et turquoise, les foncées lui donnent un aspect profond et naturel."],
    ],
    platzhirsch: { title: "Piscine, terrasse et jardin en un seul projet", text: "Piscine, mobilier, ombrage et lumière doivent former un tout. Nous planifions le concept extérieur et nous coordonnons avec les entreprises spécialisées que vous mandatez.", href: "/outdoor-gartenplanung", label: "Aménagement extérieur" },
  },
  {
    id: "wellness",
    label: "Spa",
    title: "Mosaïque de verre pour bien-être et spa",
    seoTitle: "Mosaïque de verre pour bien-être, sauna et spa",
    description: "Mosaïque de verre Ezarri pour bains à remous, hammams et spas : surfaces, résistance au glissement et joints en un coup d’œil. Échantillons à Lochau.",
    lead: "Bain à remous, hammam, douche de spa : ici, la mosaïque habille des surfaces courbes, sous l’eau et dans la vapeur. Selon Ezarri, le verre n’absorbe pas l’eau et résiste aux produits de nettoyage courants.",
    filter: { einsatz: ["wellness"] },
    galerie: ["wellness"],
    bild: { galerie: "anw-alexande-gold-carrara-gold-mosaic-spa-wellness-ezarri-4", alt: "Hammam avec banquette, murs en mosaïque de verre sombre à tesselles dorées, Ezarri Carrara Gold 25" },
    hinweise: [
      ["Courbes", "Selon Ezarri, le collage par points (JointPoint) suit aussi des rayons serrés, par exemple sur les banquettes et les bains à remous."],
      ["Sol", "Les sols mouillés exigent une version antidérapante. Les valeurs figurent sur chaque page de mosaïque."],
      ["Lumière", "Les surfaces nacrées et métalliques réagissent fortement à la lumière. Regardez-les sur échantillon, pas seulement à l’écran."],
    ],
    platzhirsch: { title: "Planifier le bien-être chez soi", text: "De l’espace spa à la salle de repos : nous planifions ensemble mobilier, lumière et matériaux.", href: "/interior-design-vorarlberg", label: "Design d’intérieur" },
  },
  {
    id: "bad",
    label: "Salle de bains",
    title: "Mosaïque de verre pour salle de bains et douche",
    seoTitle: "Mosaïque de verre pour salle de bains et douche",
    description: "Mosaïque de verre Ezarri pour douches, murs de salle de bains et sols de douche : versions antidérapantes, formats, joints. Échantillons à Lochau.",
    lead: "Dans la salle de bains, la mosaïque intervient là où les grands carreaux atteignent leurs limites : dans la pente d’une douche à l’italienne, dans les niches et sur les courbes. Pour le sol de douche, choisissez une version antidérapante.",
    filter: { einsatz: ["bad"] },
    galerie: ["bad"],
    bild: { galerie: "anw-ezarri-mosaics-gemma-collection-lace-25", alt: "Salle de bains aux murs courbes, douche ouverte et baignoire îlot, entièrement en Ezarri Lace 25 vert clair" },
    hinweise: [
      ["Sol de douche", "Les petits formats suivent la pente. Les versions Safe antidérapantes sont prévues pour les sols mouillés."],
      ["Joint", "La couleur du joint change beaucoup l’effet. Dans le configurateur, vous pouvez essayer les sept couleurs de joint."],
    ],
    platzhirsch: { title: "Planifier toute la salle de bains", text: "Mosaïque, mobilier, robinetterie et lumière dans un seul concept – nous en discutons au showroom de Lochau.", href: "/interior-design-vorarlberg", label: "Design d’intérieur" },
  },
  {
    id: "kueche",
    label: "Cuisine",
    title: "Mosaïque de verre pour la cuisine",
    seoTitle: "Mosaïque de verre en crédence de cuisine",
    description: "Mosaïque de verre Ezarri en crédence de cuisine : surfaces, couleurs et formats en un coup d’œil. Planification de cuisine et échantillons à Lochau.",
    lead: "En crédence derrière la plaque de cuisson et l’évier, la mosaïque de verre se nettoie facilement. Métal, nacre et aspects pierre mats posent leurs propres accents entre les façades et le plan de travail.",
    filter: { einsatz: ["kueche"] },
    galerie: ["kueche"],
    bild: { galerie: "anw-perla-hexa-mosaic-iridescent-collection-ezarri-kitchen", alt: "Cuisine claire avec îlot, murs en mosaïque nacrée blanche Ezarri Perla Hexa" },
    hinweise: [
      ["Surface", "Les crédences sont généralement étroites et longues. Le calculateur indique la quantité en cartons."],
      ["Accord", "Choisissez la mosaïque en même temps que la façade et le plan de travail, échantillons côte à côte."],
    ],
    platzhirsch: { title: "Cuisine et crédence d’un seul plan", text: "Nous planifions des cuisines à Lochau et accordons la crédence aux façades et au plan de travail.", href: "/kuechen-vorarlberg", label: "Conception de cuisine" },
  },
  {
    id: "fassade",
    label: "Façade",
    title: "Mosaïque de verre pour façades et murs extérieurs",
    seoTitle: "Mosaïque de verre pour façades et murs extérieurs",
    description: "Mosaïque de verre Ezarri pour murs extérieurs et façades : indications des fiches techniques, formats et couleurs. Planification avec votre façadier.",
    lead: "Selon les fiches techniques, les collections Ezarri conviennent aux murs et aux plafonds, à l’intérieur comme à l’extérieur, sur des surfaces régulières et irrégulières. Ezarri n’a pas publié de photos de projets de façades. C’est pourquoi nous montrons un mur intérieur entièrement habillé et les indications des fiches techniques.",
    filter: { einsatz: ["wand-innen-aussen"] },
    galerie: [],
    bild: { galerie: "anw-moonstone-hexa-mosaic-gemma-collection-ezarri-espacio", alt: "Pièce avec une large ouverture, murs et embrasure entièrement habillés en Ezarri Moonstone Hexa" },
    hinweise: [
      ["Planification", "Le support, la colle et le joint sont définis par votre façadier. Nous fournissons la mosaïque, les fiches techniques et les échantillons."],
      ["Gel et lumière", "Selon Ezarri, le verre n’absorbe pratiquement pas d’eau (absorption d’eau de 0,1 % selon la fiche technique) et ne se décolore pas."],
    ],
    platzhirsch: { title: "Maison et jardin en un seul projet", text: "Façade, terrasse et piscine : nous planifions le concept extérieur avec mobilier, ombrage et lumière.", href: "/outdoor-gartenplanung", label: "Aménagement extérieur" },
  },
]);

export const WASSER = Object.freeze({
  crumb: "Couleur de l’eau",
  eyebrow: "Couleur de l’eau",
  title: "Quelle couleur aura votre eau ?",
  seoTitle: "Couleur de piscine : comment la mosaïque teinte l’eau",
  description: "Six couleurs d’eau côte à côte, du bleu ciel au lac de montagne, avec les mosaïques Ezarri correspondantes et des photos de projets réalisés.",
  lead: "L’eau n’a pas de couleur propre ; elle la prend du bassin. Ezarri attribue ses mosaïques à six effets d’eau. L’intensité de l’effet dépend de la hauteur d’eau, de la position du soleil et de l’environnement.",
  texte: {
    himmelblau: "Mosaïques blanches et très claires. L’eau paraît lumineuse, claire et légèrement bleue.",
    tuerkisblau: "Tons bleu clair et turquoise. La couleur classique des piscines, surtout dans les zones peu profondes.",
    blau: "Tons bleu moyen à foncé. Plus la mosaïque est foncée, plus le bleu paraît profond.",
    gruen: "Selon Ezarri, les tons beige, sable et rose donnent à l’eau un vert transparent.",
    graugruen: "Les mosaïques grises donnent à l’eau un gris aux reflets bleus ou verts.",
    natur: "Mosaïques noires et vert foncé. L’eau ressemble à un lac de montagne ou à une rivière.",
  },
  quelle: "Attribution des couleurs d’eau : Ezarri (filtre de la galerie et FAQ), état au 28.10.2026.",
  zahlen: {
    title: "Mosaïques et projets par couleur d’eau",
    caption: "Nombre de mosaïques et de photos de projets par effet d’eau selon Ezarri",
    wirkung: "Effet d’eau",
    mosaike: "Mosaïques",
    projekte: "Photos de projets",
  },
});

export const KOLLEKTIONEN = Object.freeze({
  crumb: "Collections",
  eyebrow: "Gamme",
  title: "Collections",
  seoTitle: "Collections Ezarri : Premium, Classic, Custom",
  description: (st) =>
    `Les ${st.kollektionen} collections Ezarri et ${st.sonderanfertigungen} lignes sur mesure : Gea, Zen, Iridescent, Niebla, Lisa et d’autres. Formats, surfaces, fiches techniques.`,
  lead: "Premium, Classic et Custom : chaque collection a ses propres surfaces et formats. Pour les lignes sur mesure, Ezarri produit le mélange ou le motif de votre projet.",
  sonder: "Sur mesure",
  sonderN: (n) => (n === 1 ? "1 ligne sur mesure" : `${n} lignes sur mesure`),
  linien: {
    Premium: "Aspects pierre, nacre, métal, or et verre phosphorescent.",
    Classic: "Les couleurs de base pour piscines, unies ou en mélange prêt à poser.",
    Custom: "Vos propres mélanges, motifs imprimés et pixelisés, dégradés.",
  },
  custom: "Cette collection est un service. Le mélange ou le motif est réalisé pour votre projet.",
  customLink: "Planifier votre propre mélange (en anglais)",
  alt: "Fiches techniques de collections antérieures",
  altHinweis: "Ezarri ne présente plus ces collections sur son site. Fiche technique : Ezarri, ezarri.com",
  konfigurator: "Ouvrir dans le configurateur",
  datenblatt: "Fiche technique (PDF, en anglais)",
  datenblattVon: (name) => `${name} – fiche technique (PDF, en anglais)`,
  ausfuehrungen: "Safe-Steps, Corner et Cove",
  anwendung: "Exemple d’utilisation",
  anwendungen: "Exemples d’utilisation",
  anwendungsbild: (name) => `Ezarri ${name}, photo d’utilisation`,
  beispiel: (name) => `Ezarri ${name}, exemple`,
  projektMit: (name) => `Projet avec Ezarri ${name}`,
  mosaike: "Mosaïques",
  fakten: "Selon la fiche technique",
  formate: "Formats",
  formateCaption: (name) => `Formats de la collection ${name} selon la fiche technique`,
  spalten: { format: "Format", stein: "Tesselle", blatt: "Plaque", dicke: "Épaisseur", verklebung: "Assemblage" },
  patternFarben: (n) => `${n} couleurs`,
  patternAlt: (name, n) => `Ezarri ${name}, motif à ${n} couleurs`,
  leerService: "Ezarri ne montre pas de références individuelles pour ce service. Nous planifions le mélange avec vous –",
  herstellerTitel: "Ezarri décrit la collection",
  muster: "Demander des échantillons",
  service: {
    "custom-mix": "Votre propre mélange (outil en anglais)",
    "custom-pixel": "Demander une mosaïque pixel d’après votre image",
    "custom-printed": "Planifier un motif imprimé avec nous",
    "standard-printed": "Choisir des motifs imprimés avec nous",
    "standard-pixel": "Choisir des motifs pixel avec nous",
    patterns: "Choisir des motifs avec nous",
    "fading-out": "Planifier un dégradé avec nous",
  },
  h1: (name) => `${name} – mosaïque de verre Ezarri`,
  metaTitle: (name, linie) => `Ezarri ${name} – mosaïque de verre ${linie}`.replace(/\s+/g, " ").trim(),
});

export const MOSAIKE = Object.freeze({
  crumb: "Mosaïques",
  eyebrow: "Toutes les mosaïques",
  title: "Mosaïques",
  seoTitle: "Mosaïque de verre Ezarri : toutes les mosaïques",
  description: "Filtrez toutes les mosaïques Ezarri par utilisation, couleur de l’eau, couleur, format et collection. Comparer, enregistrer, demander un échantillon.",
  lead: "Filtrez par effet d’eau, couleur, format et photos de projets. Comparez jusqu’à quatre mosaïques et enregistrez votre sélection.",
  suche: "Nom ou code",
  sucheLabel: "Rechercher",
  filter: "Filtres",
  mehrFilter: "Plus de filtres",
  anwenden: "Appliquer les filtres",
  zuruecksetzen: "Supprimer tous les filtres",
  treffer: (n) => (n === 1 ? "1 mosaïque" : `${n} mosaïques`),
  weitere: (n) => `Charger ${n} de plus`,
  seite: (p, ps) => `Page ${p} sur ${ps}`,
  leer: {
    title: "Aucune mosaïque ne correspond à tous les filtres",
    text: "Retirez un filtre, cherchez une couleur proche – ou demandez-nous. Nous trouverons la mosaïque qui vous convient.",
    aehnlich: "Chercher une couleur proche",
    anfrage: "Laissez-nous chercher pour vous",
  },
  farbe: { label: "Choisir une couleur", hinweis: "Trié par proximité avec la couleur choisie", entfernen: "Retirer la couleur" },
  safe: "Antidérapantes uniquement",
  spezial: "Avec Corner ou Cove",
  sortNaehe: "par proximité de couleur",
  filterKnopf: (n) => (n ? `Filtres (${n})` : "Filtres"),
  filterTitel: "Filtrer les mosaïques",
  anzeigen: (n) => (n === 1 ? "Afficher 1 mosaïque" : `Afficher ${n} mosaïques`),
  schliessen: "Fermer les filtres",
  projektbild: { legend: "Photo de projet", hinweis: "Mosaïques qu’Ezarri montre dans des projets de ce type." },
  eignung:
    "Selon les fiches techniques, presque toutes les mosaïques Ezarri conviennent aux murs et aux sols, aux piscines et aux espaces bien-être, à l’intérieur comme à l’extérieur, donc aussi aux salles de bains et aux cuisines. Pour les sols mouillés et les marches, choisissez « Antidérapantes uniquement ».",
  weitereArten: (n) => `${n} Safe-Steps et pièces spéciales sous « Type »`,
  alleArten: "Afficher aussi les Safe-Steps et pièces spéciales",
  sortLabel: "Trier",
  sortierung: [
    { id: "empfohlen", label: "Recommandé" },
    { id: "name", label: "Nom A–Z" },
    { id: "kollektion", label: "Collection" },
    { id: "hell", label: "Couleur claire → foncée" },
  ],
});

export const KARTE = Object.freeze({
  imWasser: "Dans l’eau :",
  vergleichen: "Comparer",
  verglichen: "Dans la comparaison",
  merken: (name) => `Enregistrer : Ezarri ${name}`,
  vollerVergleich: "4 mosaïques au maximum dans la comparaison",
});

export const VERGLEICH = Object.freeze({
  crumb: "Comparaison",
  title: "Comparer des mosaïques",
  seoTitle: "Comparer des mosaïques Ezarri",
  leiste: (n) => `Comparaison (${n})`,
  oeffnen: "Voir la comparaison",
  leeren: "Vider la comparaison",
  leer: "Dans l’aperçu des mosaïques, choisissez jusqu’à quatre mosaïques avec « Comparer ».",
  zurUebersicht: "Vers l’aperçu des mosaïques",
  unterschied: "différent",
  gleich: "identique",
  nurUnterschiede: "Afficher uniquement les différences",
  entfernen: (name) => `Retirer ${name} de la comparaison`,
  konfigurator: "Ce mélange dans le configurateur",
  muster: "Demander tous les échantillons",
  nichtMischbar: "Selon Ezarri, au moins une mosaïque ne peut pas être mélangée.",
  zeilen: {
    kollektion: "Collection",
    format: "Format",
    oberflaeche: "Surface",
    wasser: "Effet d’eau",
    rutsch: "Résistance au glissement",
    spezial: "Corner / Cove",
    blatt: "Plaque",
    steine: "Tesselles par plaque",
    m2karton: "m² par carton",
    kgm2: "kg par m²",
    einsatz: "Utilisation",
    mischbar: "Mélangeable dans le configurateur",
  },
});

export const DETAIL = Object.freeze({
  preis: "Prix sur demande",
  preisHinweis: "Nous vous indiquons le prix avec la quantité, le mode de livraison et le délai.",
  muster: "Demander des échantillons",
  konfigurator: "Voir dans le configurateur",
  rechner: "Calculer la quantité",
  merken: "Enregistrer",
  gemerkt: "Enregistré",
  ausfuehrungen: "Versions",
  formate: "Format",
  safe: "Antidérapant",
  spezial: "Pièces spéciales",
  aufDieserSeite: "sur cette page",
  massTitle: "Dimensions de la plaque",
  massLegende: (stein, fuge) => `Une tesselle ${stein}, joint ${fuge}. Dessin pas à l’échelle à l’écran.`,
  fakten: "Données techniques",
  verpackung: "Conditionnement",
  luecke: "non indiqué par Ezarri",
  rutschKorrigiert: "Dans la fiche technique, les valeurs pieds nus et chaussé sont inversées ; elles sont attribuées correctement ici.",
  aehnlich: "Mosaïques similaires",
  passtZu: "De la même collection :",
  projekte: "Projets avec cette mosaïque",
  verlegung: "Pose en piscine",
  datenblatt: "Fiche technique de la collection",
  ezarriSeite: "Page produit chez Ezarri",
  fuge: "Joint recommandé",
  labels: {
    code: "Code",
    kollektion: "Collection",
    linie: "Ligne",
    typ: "Type",
    format: "Format",
    stein: "Tesselle",
    blatt: "Plaque",
    steine: "Tesselles par plaque",
    dicke: "Épaisseur",
    fugeMm: "Largeur de joint",
    oberflaeche: "Surface",
    farbe: "Couleur",
    einsatz: "Utilisation",
    wasser: "Effet d’eau",
    rutschBarfuss: "Pieds nus (DIN EN 16165 A)",
    rutschSchuh: "Chaussé (DIN EN 16165 B)",
    rutschPendel: "Pendule (UNE-EN 16165 C)",
    blattKarton: "Plaques par carton",
    m2Karton: "m² par carton",
    m2Palette: "m² par palette",
    kgm2: "Poids",
    mischbar: "Mélangeable",
  },
  mischbarJa: "oui, mélangeable dans le configurateur",
  mischbarNein: "non, sélectionnable seule dans le configurateur",
  lautEzarri: "selon Ezarri",
  keinBild: "Aucune image disponible chez Ezarri",
  ohneSeite: "(chez Ezarri, pas encore de page propre ici)",
  blattmass: "Format de plaque",
  verpackungCaption: "Conditionnement par format",
  verpackungSpalten: { format: "Format", blatt: "Plaques/carton", m2: "m²/carton", palette: "m²/palette", kg: "kg/m²" },
  datenblattPdf: (name) => `Fiche technique de la collection ${name ?? ""} (PDF, en anglais)`.replace(/\s+\(/, " ("),
  video: (name) => `Vidéo de ${name} sur YouTube`,
  oeffnetEzarri: "(ouvre ezarri.com)",
  oeffnetYoutube: "(ouvre youtube.com)",
  stand: "état au",
  herstellerTitel: "D’après Ezarri",
  lead: ({ name, kollektion, fmt, oberflaeche, wasser, others }) =>
    [
      `${name} est une mosaïque de verre de la collection Ezarri ${kollektion}${fmt ? `, ici en version ${fmt}` : ""}${oberflaeche ? `, surface : ${oberflaeche}` : ""}.`,
      wasser ? `Effet d’eau selon Ezarri : ${wasser}.` : null,
      others.length ? `La même famille existe aussi en ${others.join(", ")}.` : null,
    ]
      .filter(Boolean)
      .join(" "),
  metaDescription: ({ name, code, kollektion, facts }) => `Mosaïque de verre Ezarri ${name} (${code}), collection ${kollektion}. ${facts ? `${facts}. ` : ""}Échantillons et conseil à Lochau.`,
  metaFormat: (fmt) => `format ${fmt}`,
  metaWasser: (w) => `effet d’eau ${w}`,
  heading: { typ: "Mosaïque", kollektion: (name) => `collection ${name}` },
});

export const MISCHUNG = Object.freeze({
  title: "Mélange selon Ezarri",
  balken: "Parts du mélange",
  ohneSeite: "pas de page produit propre chez Ezarri",
  quelle: "Recette : Ezarri, page produit",
  quelleKonfigurator: "Recette : Ezarri, configurateur (page produit incomplète)",
  quelleLink: "Voir chez Ezarri",
  konfigurator: "Ce mélange dans le configurateur",
  konfiguratorFertig: "Mélange prêt à poser dans le configurateur",
  konfiguratorHinweis: "Le configurateur démarre avec cette recette. Vous pouvez y modifier les parts.",
  muster: "Demander des échantillons des couleurs individuelles",
  nurFertig: "Sélectionnable uniquement comme mélange prêt à poser dans le configurateur",
  zeile: "Mélange",
});

export const GALERIE = Object.freeze({
  crumb: "Galerie",
  eyebrow: "Projets en mosaïque Ezarri",
  title: "Galerie",
  seoTitle: "Projets en mosaïque de verre Ezarri : galerie",
  description: "Plus de 1 000 photos de projets en mosaïque de verre Ezarri : piscines, spas, salles de bains et cuisines. Filtres par utilisation, eau et collection.",
  lead: "Photos de projets d’Ezarri, chacune avec la mosaïque utilisée.",
  diesesMosaik: (name) => `Mosaïque : ${name}`,
  filterTitel: "Filtrer la galerie",
  einsatz: [
    { id: "pool-privat", label: "Piscine privée" },
    { id: "pool-oeffentlich", label: "Piscine publique et hôtel" },
    { id: "wellness", label: "Bien-être et spa" },
    { id: "bad", label: "Salle de bains" },
    { id: "kueche", label: "Cuisine" },
  ],
  anzeigen: (n) => (n === 1 ? "Afficher 1 photo" : `Afficher ${n} photos`),
  laedt: "Chargement …",
  videos: {
    link: (n) => `Vidéos (${n})`,
    title: "Vidéos produits d’Ezarri",
    text: "De courts films sur des mosaïques individuelles, pas sur des projets. Ils s’ouvrent sur YouTube.",
  },
  video: "Regarder la vidéo sur YouTube",
  videoHinweis: "Ouvre youtube.com dans un nouvel onglet.",
  oeffnen: "Agrandir la photo",
  schliessen: "Fermer",
  vor: "Photo suivante",
  zurueck: "Photo précédente",
  leer: "Aucune photo de projet pour ces filtres.",
  treffer: (n) => (n === 1 ? "1 photo de projet" : `${n} photos de projets`),
});

export const TECHNIK = Object.freeze({
  crumb: "Technique",
  eyebrow: "Technique",
  title: "Informations techniques et pose",
  seoTitle: "Mosaïque Ezarri : technique, pose, entretien",
  description: "JointPoint, pose selon le type de bassin, entretien, questions fréquentes et toutes les fiches techniques et certificats Ezarri en PDF.",
  lead: "Informations du fabricant Ezarri, résumées avec nos propres mots. La pose est réalisée par une entreprise de carrelage spécialisée.",
  bereiche: [
    { href: "/ezarri/technik/jointpoint", title: "JointPoint", text: "Comment les tesselles tiennent ensemble sans papier ni filet." },
    { href: "/ezarri/technik/verlegung", title: "Pose", text: "Étapes selon le type de bassin : béton, acier, polystyrène, polypropylène, polyester." },
    { href: "/ezarri/technik/pflege", title: "Entretien", text: "Nettoyage, calcaire, résidus de joint, produits chimiques." },
    { href: "/ezarri/technik/fragen", title: "Questions fréquentes", text: "18 réponses, du matériau au délai de livraison." },
    { href: "/ezarri/technik/downloads", title: "Téléchargements", text: "Fiches techniques, certificats et garantie en PDF." },
    { href: "/ezarri/rechner", title: "Calculateur de mosaïque", text: "m², cartons, colle et joint pour votre bassin." },
  ],
  fachbetrieb: "La pose est réalisée par une entreprise de carrelage spécialisée. Nous fournissons la mosaïque, les fiches techniques et les échantillons et coordonnons les dates.",
});

export const JOINTPOINT = Object.freeze({
  crumb: "JointPoint",
  title: "JointPoint : des points de colle, ni papier ni filet",
  seoTitle: "Ezarri JointPoint expliqué",
  description: "Comment JointPoint assemble les tesselles Ezarri : collage par points, 92 % du dos libre, selon Ezarri jusqu’à 25 % de temps de pose en moins.",
  lead: "Pour de nombreuses mosaïques, du papier sur la face ou un filet au dos maintient les tesselles ensemble. Ezarri relie plutôt les tesselles par de petits points de collage souples sur les bords.",
  punkte: [
    ["Plus de surface de collage", "Selon Ezarri, 92 % du dos reste libre pour la colle. Ni papier ni filet ne se trouvent entre la tesselle et la colle."],
    ["Pose plus rapide", "Selon Ezarri, jusqu’à 25 % de temps de pose en moins qu’avec des mosaïques sur papier, car aucun papier n’est à retirer."],
    ["Souple", "La plaque suit les courbes, par exemple sur les marches, les banquettes et les bains à remous, et se découpe facilement."],
    ["Humidité", "Selon Ezarri, les points ne gonflent pas à l’humidité, ne rétrécissent pas et ne cassent pas."],
  ],
  grafik: {
    title: "Le dos en comparaison",
    netz: "Filet : des fibres entre la tesselle et la colle",
    papier: "Papier : face collée, à retirer",
    joint: "JointPoint : points sur les bords, dos libre",
  },
});

/** Pose selon le type de bassin. Source : ezarri.com/en/installation et sous-pages, 28.10.2026. */
export const VERLEGUNG = Object.freeze({
  crumb: "Pose",
  title: "Pose selon le type de bassin",
  seoTitle: "Poser une mosaïque de verre en piscine : étapes",
  description: "Poser la mosaïque de verre Ezarri : étapes pour bassins en béton, acier, polystyrène, polypropylène et polyester, d’après le fabricant.",
  lead: "Choisissez votre type de bassin. Les étapes résument le guide de pose d’Ezarri. Votre carreleur choisit la colle et le joint selon les fiches techniques des fabricants.",
  waehlen: "Type de bassin",
  hinweisKelle: "Dans le guide de pose pour le béton, Ezarri indique une spatule crantée de 6 mm ; dans la FAQ, une spatule crantée de 3 mm. Votre carreleur suit la fiche technique de la colle.",
  typen: [
    {
      id: "beton",
      label: "Béton",
      schritte: [
        ["Préparer le support", "Plan, propre, porteur et sec : humidité résiduelle inférieure à 3 %."],
        ["Choisir la colle", "Colle cimentaire de classe C2TE au minimum (EN 12004)."],
        ["Appliquer la colle", "Étaler uniformément à la spatule crantée, 6 mm selon le guide de pose."],
        ["Poser les plaques", "Mettre en place les plaques JointPoint et les presser."],
        ["Aligner", "Redresser les joints avec une taloche en caoutchouc."],
        ["Choisir le joint", "Joint époxy de classe RG. En alternative, un joint ciment de qualité CG2, qui doit être refait selon Ezarri après environ 5 à 6 ans."],
        ["Jointoyer", "Faire pénétrer avec une raclette en caoutchouc souple, retirer l’excédent."],
        ["Nettoyer", "Nettoyer à l’eau avec une taloche éponge."],
        ["Nettoyage final", "Après 24 heures, nettoyer à nouveau avec un nettoyant de fin de chantier."],
      ],
    },
    {
      id: "stahl",
      label: "Acier galvanisé",
      schritte: [
        ["Étancher les parois", "Appliquer des membranes d’étanchéité autocollantes sur les parois en acier."],
        ["Étancher les joints des parois", "Fermer les joints avec une bande étanche et une colle adaptée."],
        ["Étancher le fond", "Poser des membranes sur toute la dalle béton avec un recouvrement de 5 cm et coller les recouvrements."],
        ["Jonction fond-paroi", "Étancher avec la même bande souple et la même colle."],
        ["Étancher les pièces à sceller", "Raccorder skimmers, projecteurs et buses à la membrane avec un mastic spécial."],
        ["Poser la mosaïque", "Avec la colle et le joint recommandés, comme pour un bassin en béton."],
      ],
    },
    {
      id: "polystyrol",
      label: "Polystyrène",
      schritte: [
        ["Étancher le bassin", "Poser une membrane d’étanchéité adaptée avec un recouvrement de 5 cm."],
        ["Fermer les recouvrements", "Coller avec le produit recommandé par Ezarri."],
        ["Étancher les pièces à sceller", "Raccorder skimmers, projecteurs et buses à la membrane avec du mastic."],
        ["Poser la mosaïque", "Avec la colle et le joint recommandés."],
      ],
    },
    {
      id: "polypropylen",
      label: "Polypropylène",
      schritte: [
        ["Étancher les parois", "Appliquer des membranes d’étanchéité autocollantes sur les parois."],
        ["Étancher les joints des parois", "Avec une bande étanche et une colle adaptée."],
        ["Étancher le fond", "Poser des membranes sur la dalle béton avec un recouvrement de 5 cm et coller les recouvrements."],
        ["Jonction fond-paroi", "Avec la même bande souple et la même colle."],
        ["Étancher les pièces à sceller", "Raccorder skimmers, projecteurs et buses avec du mastic."],
        ["Poser la mosaïque", "Avec la colle et le joint recommandés."],
      ],
    },
    {
      id: "polyester",
      label: "Polyester",
      schritte: [
        ["Poncer", "Poncer toute la surface du bassin."],
        ["Dépoussiérer", "Retirer la poussière de ponçage et les salissures à l’acétone."],
        ["Choisir la colle", "Colle à base de résine réactive polyuréthane ou époxy, qui absorbe les mouvements."],
        ["Appliquer la colle", "Étaler avec une spatule crantée de 3 mm."],
        ["Poser les plaques", "Mettre en place avec JointPoint et presser."],
        ["Jointoyer", "Avec un joint époxy."],
        ["Nettoyage final", "Après 24 heures, nettoyer à nouveau avec un nettoyant de fin de chantier."],
      ],
    },
  ],
  schritte: "Étapes",
  quelle: "Étapes d’après le guide de pose d’Ezarri (ezarri.com/en/installation), résumées avec nos propres mots.",
});

export const PFLEGE = Object.freeze({
  crumb: "Entretien",
  title: "Entretenir la mosaïque de verre",
  seoTitle: "Nettoyer et entretenir la mosaïque de verre",
  description: "Nettoyer la mosaïque de verre : résidus de joint, calcaire, produits de piscine, salle de bains et découpe. Conseils d’après les thèmes d’Ezarri.",
  lead: "Le verre est dense et facile à entretenir. La plupart des questions portent sur le joint et les résidus de pose. Testez toujours d’abord un nettoyant sur une zone peu visible et suivez les instructions des fabricants de nettoyants et de joints.",
  themen: [
    ["Retirer les résidus d’époxy", "Les résidus frais s’enlèvent à l’eau avec une taloche éponge. Le voile durci s’élimine avec un nettoyant époxy indiqué par le fabricant du joint."],
    ["Pourquoi un joint époxy", "Les joints époxy sont denses et résistent mieux aux produits chimiques de piscine que les joints ciment. Selon Ezarri, les joints ciment en piscine doivent être refaits après environ 5 à 6 ans."],
    ["Éliminer le calcaire", "Décoller les cernes de calcaire à la ligne d’eau avec un nettoyant acide adapté, puis bien rincer à l’eau. Le joint doit être compatible avec le nettoyant."],
    ["Produits chimiques et verre", "Selon Ezarri, le verre résiste aux produits d’entretien de piscine courants et convient à l’électrolyse au sel. Le joint est généralement la partie la plus sensible."],
    ["Résidus de joint ciment", "Après durcissement, éliminer le voile de ciment avec un nettoyant adapté. Ne pas rayer ni récurer le verre."],
    ["Remplir la piscine", "Une piscine en mosaïque n’est remplie qu’une fois la colle et le joint durcis selon les indications de leurs fabricants."],
    ["Nettoyer la salle de bains", "Un nettoyant doux et un chiffon souple suffisent. Les produits abrasifs et la laine d’acier rayent les surfaces comme la nacre ou le métal."],
    ["Découper la mosaïque", "Les plaques JointPoint se séparent entre les tesselles. Les tesselles individuelles se coupent à la pince à mosaïque de verre."],
  ],
  quelle: "Thèmes d’après la rubrique entretien d’Ezarri (ezarri.com/en/maintenance-of-mosaic). Les textes sont notre résumé, pas des textes du fabricant.",
});

/** 18 questions, réponses rédigées par nos soins. Faits : ezarri.com (28.10.2026). */
export const FRAGEN = Object.freeze({
  crumb: "Questions fréquentes",
  title: "Questions fréquentes sur la mosaïque Ezarri",
  seoTitle: "Mosaïque de verre Ezarri : questions fréquentes",
  description: "Matériau, verre recyclé, JointPoint, couleur de l’eau, colle et joint, délai de livraison et achat : réponses sur la mosaïque de verre Ezarri.",
  liste: [
    ["Qu’est-ce que JointPoint ?", "Le procédé d’Ezarri pour assembler les tesselles : de petits points de collage souples sur les bords au lieu du papier ou du filet. Selon Ezarri, 92 % du dos reste ainsi libre pour la colle."],
    ["Pourquoi JointPoint convient-il aux piscines et aux spas ?", "Parce que rien ne se trouve entre la tesselle et la colle. Selon Ezarri, il fait gagner jusqu’à 25 % de temps de pose par rapport au papier et résiste à l’humidité et aux produits chimiques."],
    ["De quoi le verre est-il fait ?", "Selon Ezarri, de 100 % de verre recyclé comme matière première, confirmé selon ISO 14021. La mosaïque finie contient au moins 96 % de verre post-consommation, le reste étant des colorants et les points de collage."],
    ["Que dit le certificat environnemental ?", "L’autodéclaration selon ISO 14021 atteste la part recyclée. Vous trouverez le PDF sous Téléchargements."],
    ["Où la mosaïque est-elle produite ?", "À Lazkao (Gipuzkoa, Espagne), où se trouvent aussi la production et l’entrepôt central. Ezarri cite des sites logistiques à Castellón, Sassuolo et Miami."],
    ["Tout est-il fabriqué en Espagne ?", "Selon Ezarri, oui : toutes les mosaïques viennent de Lazkao. Environ 70 % de la production part à l’exportation."],
    ["Combien de temps dure une mosaïque en piscine ?", "Selon Ezarri, le verre n’absorbe pas l’eau, est chimiquement inerte et résiste aux variations de température. Bien posé, il ne se décolore pas. Le joint est la partie qui demande de l’entretien."],
    ["Comment la mosaïque influence-t-elle la couleur de l’eau ?", "Le blanc donne une eau bleu ciel à turquoise, le beige et le rose un vert transparent, le gris un gris aux reflets bleus ou verts, le noir et le vert foncé un ton de lac de montagne. Le bleu foncé rend l’eau plus profonde. Plus d’informations sous Couleur de l’eau."],
    ["Comment se fait la pose ?", "Support lisse, propre et sec, colle souple C2TE, presser et aligner les plaques, jointoyer à l’époxy, retirer les résidus. Les étapes selon le type de bassin figurent sous Pose."],
    ["Quelles colles et quels joints ?", "Colle au minimum C2TE selon EN 12004. Comme joint, Ezarri recommande l’époxy (RG), en alternative un joint ciment de qualité (CG2)."],
    ["Peut-on poser de la mosaïque sur un bassin en polyester ou préfabriqué ?", "Oui, avec une colle élastique à base de résine réactive (époxy ou polyuréthane) qui absorbe les mouvements. La surface est poncée au préalable."],
    ["Combien de temps dure un joint ciment en piscine ?", "Selon Ezarri, environ 5 à 6 ans ; il faut ensuite refaire les joints. Les joints époxy durent plus longtemps."],
    ["Pourquoi des carreaux se décollent-ils en piscine ?", "Le plus souvent à cause d’une mauvaise préparation du support, d’une colle inadaptée ou de papier et de filet entre la tesselle et la colle. Avec JointPoint, rien ne se trouve entre les deux."],
    ["Quel est le délai de livraison ?", "Selon Ezarri, 95 % des mosaïques sont disponibles en stock et les commandes sont préparées en 24 à 48 heures. Nous vous indiquons la date de livraison à Lochau ou chez vous avec le devis."],
    ["Quels formats existe-t-il ?", "Carré 25 mm et 50 mm, Hexa de 33,4 × 33,4 mm, plus les pièces spéciales Corner et Cove. Les formats de chaque mosaïque figurent sur sa page."],
    ["Où voir des échantillons ?", "Chez nous, au café-showroom de Lochau. Choisissez jusqu’à six mosaïques, nous commandons les échantillons pour votre rendez-vous."],
    ["Acheter de la mosaïque Ezarri chez nous", "Ezarri ne vend pas directement aux particuliers. Chez Platzhirsch, vous obtenez conseil, échantillons, calcul des quantités et devis. Envoyez-nous votre sélection ou un lien du configurateur."],
    ["La disponibilité est-elle visible en ligne ?", "Ezarri n’affiche le stock que sur son propre site. Nous vérifions la quantité pour votre projet avec le devis."],
  ],
});

export const DOWNLOADS = Object.freeze({
  crumb: "Téléchargements",
  title: "Fiches techniques et certificats",
  seoTitle: "Fiches techniques et certificats Ezarri (PDF)",
  description: "Toutes les fiches techniques Ezarri par collection, ISO 9001, ISO 14021 et la garantie en PDF. Catalogues sur demande auprès de notre showroom.",
  lead: "Les PDF proviennent d’Ezarri. Les fiches techniques sont en anglais.",
  datenblaetter: "Fiches techniques par collection",
  zertifikate: "Certificats et garantie",
  alt: "Fiches techniques de collections antérieures",
  altHinweis: "Ezarri ne présente plus ces collections sur son site.",
  kataloge: { title: "Catalogues", text: "Ezarri ne remet ses huit catalogues (dont Pool & Home, Gea, Terrazzo, Gold, Aquarelle, Gemma) que sur demande.", link: "Demander un catalogue (en anglais)" },
  quelleLink: "Original chez Ezarri",
  zertifikatListe: [
    { datei: "calidad_de_ISO9001.pdf", title: "Management de la qualité ISO 9001", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/calidad/de/ISO9001.pdf" },
    { datei: "medioambientales_de_ISO-14021.pdf", title: "ISO 14021, part de verre recyclé", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/medioambientales/de/ISO-14021.pdf" },
    { datei: "certificaciones_garantia-mosaicos_Ezarri_-_Warranty_on_mosaics_-_EN-2025.pdf", title: "Garantie sur les mosaïques (2025)", sprache: "englisch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/garantia-mosaicos/Ezarri%20-%20Warranty%20on%20mosaics%20-%20EN-2025.pdf" },
  ],
});

export const SCHLUSS = Object.freeze({
  title: "Voir les échantillons, planifier le bassin",
  text: "Au café-showroom de Lochau, nous disposons les mosaïques côte à côte et calculons la quantité pour votre projet.",
  primary: "Demander un rendez-vous",
  secondary: "Demander des échantillons",
});

/** Libellés de type, surface, etc. (affichage, pas d’ids de filtre). */
export const TYP_LABEL = Object.freeze({ mosaik: "Mosaïque", "safe-step": "Safe-Step, antidérapant", corner: "Corner, angle extérieur", cove: "Cove, gorge intérieure" });
export const LINIE_LABEL = Object.freeze({ Premium: "Premium", Classic: "Classic", Custom: "Custom" });

/** Textes alternatifs (concept §6.3). */
export const alt = {
  mosaik: (name, format, oberflaeche) => ["Ezarri " + name, format ? `mosaïque de verre ${format}` : "mosaïque de verre", oberflaeche].filter(Boolean).join(", "),
  anwendung: (name, wasser) => [name ? `Projet avec Ezarri ${name}` : "Projet en mosaïque de verre Ezarri", wasser].filter(Boolean).join(", "),
};
