// src/lib/hotel/content-intl.js – FR- und IT-Fassung der Seite /<locale>/hotel-objekt.
//
// Inhaber-Entscheidung 01.11.2026: Hotel & Objekt auch auf Französisch und
// Italienisch (vorher 308 → /en). Übersetzt aus der deutschen Fassung
// (src/lib/hotel/content.js, Mastertext), gegengelesen mit der englischen.
// Dieselben Regeln wie dort: keine Superlative, Preise, Fristzusagen oder
// erfundenen Referenzen; Händler-Satz NUR aus dem Claim-Register (wird in
// content.js eingesetzt); Minotti nur „in unserer Ausstellung“.
// Begriffe wie auf den übrigen FR/IT-Seiten (Arbeitsweise, Landing-Messages):
// FR maquette, rendu, espace client, chambre témoin; IT modello, rendering,
// portale clienti, camera campione; IT in der Höflichkeitsform „voi“.
// Backoffice-Felder (messageTitle(s), messageLabels) bleiben DEUTSCH wie bei EN.
// Links auf Seiten ohne FR/IT-Fassung: `lang: "en"` bzw. `deOnly` (Arlberg),
// jeweils mit Hinweis im Label. Ezarri und Yacht sind seit 01.11.2026 viersprachig.
// Französische Typografie (geschütztes Leerzeichen vor : ; ? ! und in « »)
// setzt frenchTypography() beim Laden – im Quelltext stehen normale Leerzeichen.
//
// Reines Modul (keine "@/..."-Importe, kein React): node --test lädt es.

const NNBSP = " "; // schmales geschütztes Leerzeichen (vor ; ! ?)
const NBSP = " "; // geschütztes Leerzeichen (vor : und in « »)

/** Französische Leerzeichen-Regeln auf einen String. */
export function frenchSpacing(text) {
  return String(text)
    .replace(/ ([;!?])/g, `${NNBSP}$1`)
    .replace(/ :(?=\s|$)/g, `${NBSP}:`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`);
}

/** frenchSpacing() auf alle Strings eines Objekts (Kopie). */
export function frenchTypography(value) {
  if (typeof value === "string") return frenchSpacing(value);
  if (Array.isArray(value)) return value.map(frenchTypography);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frenchTypography(v)]));
  return value;
}

// Backoffice: deutsche Labels und Themen-Zeilen (wie EN), siehe inquiry.js.
const BACKOFFICE = {
  messageTitle: "[Anfrage Hotel & Objekt]",
  messageTitles: { hotel: "[Anfrage Hotel & Objekt]", chalet: "[Anfrage Chalet & Ferienwohnung]" },
  messageLabels: { haus: "Haus", ort: "Ort", art: "Art", zimmer: "Zimmer/Einheiten", bereiche: "Bereiche", zeitfenster: "Zeitfenster", rolle: "Rolle", firma: "Firma", nachricht: "Nachricht" },
};

const FR = {
  meta: {
    title: "Aménagement d’hôtels, lac de Constance & Alpes",
    description:
      "Aménager hôtels, chalets et restaurants : dessin à la main, maquette, 3D, chambre témoin, mobilier, lumière, mosaïque Ezarri, pose hors saison.",
    ogEyebrow: "Hôtels · Chalets · Restaurants",
    ogTitle: "Hôtels & projets",
    ogLine: "Dessiné à la main. Aménagé pour vos hôtes.",
  },
  hero: {
    crumb: "Hôtels & projets",
    eyebrow: "Hôtels · Chalets · Restaurants",
    title: "Aménager des hôtels au lac de Constance et dans les Alpes",
    lead: "Pour les établissements du Vorarlberg, de l’Arlberg et du pourtour du lac de Constance, nous concevons chambres, lobby, restaurant, spa et terrasse. Harald Menghin dessine le concept à la main, puis suivent maquette, planification 3D et rendu.",
    primary: "Présenter votre projet",
    facts: [
      { label: "Pour", value: "Hôtels, chalets, appartements de vacances, restaurants et bars" },
      { label: "Sur place", value: "Visite de l’établissement, si votre projet le demande aussi un ou deux jours" },
      { label: "Un seul interlocuteur", value: "Pour tout l’intérieur, avec une répartition claire des corps de métier" },
    ],
  },
  services: {
    eyebrow: "Prestations",
    heading: "De la chambre à la terrasse sur le lac",
    text: "Nous prenons en charge la conception et l’équipement mobile. Les agencements fixes, la pose et les installations techniques sont confiés à des entreprises spécialisées avec lesquelles nous nous coordonnons.",
    items: [
      { id: "zimmer", name: "Chambres et suites", text: "Canapés, fauteuils, tables, luminaires, rideaux, tapis et accessoires. Les têtes de lit et les armoires sont réalisées par un menuisier ; nous accordons matériaux et couleurs." },
      { id: "lobby", name: "Lobby et réception", text: "La première impression de votre établissement : mobilier lounge, lumière, tapis et accents. Le comptoir de réception est réalisé par un menuisier d’après le projet commun." },
      { id: "restaurant", name: "Restaurant et bar", text: "Chaises et tables pour le service quotidien, bar lounge et lumière en scénarios. La cuisine professionnelle est conçue par votre bureau spécialisé ; nous coordonnons les interfaces." },
      { id: "spa", name: "Spa et piscine en mosaïque Ezarri", text: "Mosaïque de verre Ezarri pour piscine, hammam et douches, avec bains de soleil, textiles et lumière. La pose est assurée par une entreprise spécialisée.", link: { href: "/ezarri", label: "Mosaïque de verre Ezarri" }, more: { href: "/bad-wellness", label: "Espaces spa et salles de soins" } },
      { id: "outdoor", name: "Terrasse, rooftop et jardin", text: "Mobilier d’extérieur, parasols et lumière pour terrasse sur le lac, toit-terrasse et abords de piscine. Le jardin et l’exécution sont confiés à des entreprises habilitées ; nous coordonnons.", link: { href: "/outdoor-gartenplanung", label: "Extérieur et jardin" } },
      { id: "yacht", name: "Bateau de l’hôtel, ponton et hangar à bateaux", text: "Pour les établissements au bord du lac avec leur propre bateau ou hangar : rembourrages, tissus et équipement mobile avec un sellier nautique et le chantier naval, comme pour nos intérieurs de yacht.", link: { href: "/yacht-interior", label: "Intérieurs de yacht" } },
    ],
  },
  chalets: {
    id: "chalets",
    eyebrow: "Chalets & appartements de vacances",
    heading: "Aménagés clés en main, prêts pour vos hôtes",
    text: "Pour les propriétaires et les loueurs de l’Arlberg, du lac de Constance et du Vorarlberg : nous aménageons entièrement votre chalet ou votre appartement de vacances et le remettons prêt à habiter ou prêt à louer, même si vous n’êtes pas sur place.",
    regions: [
      { name: "Arlberg", text: "Lech, Zürs, Warth, St. Anton et St. Christoph" },
      { name: "Lac de Constance", text: "Bregenz, Lochau, Lindau et les rives allemande et suisse" },
      { name: "Vorarlberg", text: "Bregenzerwald, Montafon, Kleinwalsertal et vallée du Rhin" },
    ],
    items: [
      { name: "Séjour, chambres, cuisine", text: "Meubles, lits, luminaires et cuisine issus d’une même planification, assez robustes pour des hôtes qui se succèdent." },
      { name: "Salle de bains et spa en mosaïque Ezarri", text: "Mosaïque de verre Ezarri pour douche, hammam, bain à remous ou piscine. La pose est assurée par une entreprise spécialisée." },
      { name: "Terrasse et extérieur", text: "Mobilier d’extérieur, parasols et lumière pour balcon, terrasse et jardin, avec des conseils pour l’hivernage." },
      { name: "Textiles et équipement", text: "Rideaux, tapis, linge de lit, plaids, coussins et accessoires, accordés au concept." },
      { name: "Remise des clés", text: "Montage, inventaire et consignes d’entretien pour votre location ou votre gérance. Prêt à habiter ou prêt à louer, comme convenu." },
    ],
    note: "Vous habitez en Allemagne, en Suisse ou plus loin ? Planification, échantillons et validations se font aussi par vidéo et dans l’espace client.",
    cta: { href: "#anfrage-chalet", label: "Demande pour un chalet ou un appartement" },
  },
  process: {
    eyebrow: "Déroulement",
    heading: "De la visite sur place à la pose entre deux saisons",
    text: "Les projets hôteliers ont des dates fixes. C’est pourquoi nous planifions à rebours à partir du jour où arrivent vos hôtes, et nous consignons qui livre quoi, et quand.",
    steps: [
      { title: "Visite sur place", text: "Nous apprenons à connaître votre établissement : les espaces, la lumière au fil de la journée, le climat, les circulations des hôtes et le fonctionnement du service. Si votre projet le demande, nous restons aussi un ou deux jours sur place." },
      { title: "Dessin à la main", text: "Harald Menghin esquisse à la main plan, perspectives et ambiances – pour le lobby, la restauration et une chambre type." },
      { title: "Maquette", text: "Une maquette des espaces à l’échelle, comme la connaissent les promoteurs. Sur la maquette, vous réglez avec votre équipe proportions et circulations avant la planification numérique." },
      { title: "Planification 3D", text: "La planification numérique avec cotes exactes, produits et matériaux. Sur demande, en accord avec votre architecte." },
      { title: "Rendu", text: "Des images photoréalistes des espaces avant toute commande. Vous donnez votre avis dans l’espace client, aussi par message vocal." },
      { title: "Chambre témoin", text: "Une chambre ou une suite est entièrement aménagée à l’avance, dans votre établissement. Vous la testez avec votre équipe et vos habitués avant de commander en série." },
      { title: "Liste et offre", text: "Chaque pièce avec quantité, dimensions, matériau, justificatifs du fabricant et délai de livraison. Sur cette base naît l’offre pour l’équipement mobile." },
      { title: "Pose entre deux saisons", text: "Livraison selon le plan d’étage, montage du mobilier et réception pièce par pièce – entre deux saisons ou avant l’ouverture. Ensuite, nous restons là pour les réassorts et les remplacements." },
    ],
    note: "De nombreux meubles rembourrés ont des délais de livraison de plusieurs mois. En montagne, la pose se fait généralement entre deux saisons, au bord du lac souvent en hiver. Parlez-nous-en donc tôt.",
    link: { href: "/arbeitsweise", label: "Notre méthode : du dessin à la main au rendu" },
  },
  sampleRoom: {
    eyebrow: "Chambre témoin",
    heading: "D’abord une chambre, ensuite la série",
    text: "Dans la chambre témoin, les erreurs de dimensions, de lumière ou de revêtements apparaissent dans une seule pièce – et non dans toutes. Votre équipe vérifie circulations et nettoyage, vos habitués disent ce qu’ils ressentent.",
    points: [
      "Une chambre ou une suite dans votre établissement, entièrement aménagée",
      "Tissus, bois, finitions et luminaires à voir au préalable en original, dans notre showroom de Lochau",
      "Les modifications entrent dans la liste avant la commande en série",
    ],
  },
  roles: {
    eyebrow: "Qui fait quoi",
    heading: "Un seul interlocuteur, des responsabilités claires",
    text: "Pour chaque prestation, l’offre indique qui la fournit et avec qui vous concluez le contrat.",
    taskLabel: "Prestation",
    whoLabel: "Qui",
    rows: [
      { task: "Concept, dessin à la main, maquette, planification 3D, rendu, chambre témoin", who: "Platzhirsch" },
      { task: "Mobilier, luminaires, tapis, tissus, extérieur et accessoires", who: "Platzhirsch" },
      { task: "Mosaïque de verre pour piscine et spa (Ezarri)", who: "Platzhirsch livre, une entreprise spécialisée pose" },
      { task: "Agencements comme la réception, les têtes de lit, les armoires", who: "Menuisiers de la région, en coordination avec nous" },
      { task: "Cuisine professionnelle, ventilation, électricité, concept de protection incendie", who: "Vos bureaux spécialisés et votre architecte" },
      { task: "Direction des travaux", who: "Votre architecte ou le maître d’ouvrage – nous nous coordonnons avec lui" },
    ],
  },
  quality: {
    eyebrow: "Pour un usage intensif",
    heading: "Ce qui compte à l’hôtel",
    text: "Un canapé de lobby sert du matin au soir. Pour chaque pièce de la liste, nous obtenons les justificatifs auprès du fabricant. Les valeurs requises pour votre établissement sont fixées par votre concept de protection incendie.",
    items: [
      { name: "Protection incendie", text: "Rapports d’essai du fabricant pour les rembourrages, par exemple selon EN 1021-1 et -2 (cigarette et allumette), et pour les tissus de rideaux et muraux la classe de matériau appropriée." },
      { name: "Résistance à l’usure", text: "Résistance à l’abrasion des tissus de revêtement (Martindale) et solidité à la lumière selon la fiche technique. Pour les sièges et les tables à usage professionnel, la norme d’essai du fabricant, par exemple EN 16139 et EN 15372." },
      { name: "Réassort", text: "Avant la commande, nous vérifions combien de temps un modèle reste disponible et recommandons des housses amovibles et de rechange pour les rembourrages très sollicités." },
      { name: "Entretien", text: "Chaque projet est accompagné de consignes d’entretien pour votre service d’étage : nettoyage, taches, hivernage du mobilier d’extérieur." },
      { name: "Zones humides et pieds nus", text: "Pour la piscine et le spa, nous choisissons une mosaïque avec la résistance à la glissance requise pour votre zone – selon la fiche technique du fabricant." },
    ],
    note: "Nous ne planifions qu’avec des modèles pour lesquels le fabricant peut fournir les justificatifs nécessaires. Les certificats sont délivrés par les fabricants et les organismes d’essai, pas par nous.",
  },
  brands: {
    eyebrow: "Marques et matériaux",
    heading: "De notre assortiment, pour votre établissement",
    text: "S’y ajoutent des chaises à usage professionnel, des marques d’extérieur et des luminaires de notre assortiment. Dans notre exposition à Lochau, vous découvrez en original des meubles de Minotti, ClassiCon et d’autres fabricants.",
    ezarriCaption: "Mosaïque de verre Ezarri dans une piscine. Une image du fabricant, pas un projet de Platzhirsch.",
    ezarriAlt: "Piscine en mosaïque de verre bleu clair Ezarri, collection Niebla",
    ezarriCredit: "Image : Ezarri, ezarri.com",
    ezarriNote: "Sur son propre site, Ezarri présente des projets hôteliers du fabricant.",
    ezarriLink: { href: "https://www.ezarri.com/fr", label: "Vers le site d’Ezarri" },
  },
  references: {
    eyebrow: "Projets",
    heading: "Établissements que nous avons aménagés",
    text: "Nous ne montrons que des projets dont les hôtes ont accepté la publication par écrit.",
  },
  area: {
    eyebrow: "Zone d’intervention",
    heading: "De Lochau au lac et à la montagne",
    text: "Le lac de Constance avec ses rives autrichienne, allemande et suisse, le Vorarlberg avec le Bregenzerwald et le Montafon, l’Arlberg avec Lech, Zürs et St. Anton, le Liechtenstein et la Suisse orientale. Livraison et montage sont définis pour chaque projet.",
  },
  form: {
    id: "anfrage",
    eyebrow: "Demande de projet",
    heading: "Parlez-nous de votre établissement",
    text: "Quelques indications suffisent. Nous revenons personnellement vers vous avec une proposition de visite sur place ou de rendez-vous au showroom.",
    required: "Les champs marqués * sont nécessaires à votre demande.",
    optional: "(facultatif)",
    fields: {
      haus: "Nom de l’établissement",
      ort: "Lieu",
      art: "Type d’établissement",
      zimmer: "Chambres ou unités",
      zimmerHint: "Un nombre approximatif suffit.",
      bereiche: "Quels espaces ?",
      zeitfenster: "Calendrier",
      zeitfensterHint: "Pour quand l’aménagement doit-il être prêt ?",
      rolle: "Votre rôle",
      vorname: "Prénom",
      nachname: "Nom",
      firma: "Entreprise",
      email: "E-mail",
      telefon: "Téléphone",
      nachricht: "Message",
      nachrichtHint: "Par exemple rénovation, ouverture, saison ou ce qui est déjà décidé.",
    },
    choose: "Veuillez choisir",
    art: [
      { value: "hotel", label: "Hôtel" },
      { value: "chalet", label: "Chalet ou appartements de vacances" },
      { value: "apartment", label: "Résidence d’appartements" },
      { value: "gastro", label: "Restaurant, bar ou café" },
      { value: "anderes", label: "Autre" },
    ],
    bereiche: [
      { value: "zimmer", label: "Chambres et suites" },
      { value: "lobby", label: "Lobby et réception" },
      { value: "restaurant", label: "Restaurant et bar" },
      { value: "spa", label: "Spa et piscine" },
      { value: "outdoor", label: "Terrasse et extérieur" },
      { value: "boot", label: "Bateau ou hangar à bateaux" },
    ],
    zeitfenster: [
      { value: "6", label: "Dans les 6 prochains mois" },
      { value: "12", label: "Dans 6 à 12 mois" },
      { value: "24", label: "Dans 12 à 24 mois" },
      { value: "offen", label: "Plus tard ou pas encore défini" },
    ],
    rolle: [
      { value: "eigentuemer", label: "Propriétaire ou exploitant" },
      { value: "architektur", label: "Architecture ou planification" },
      { value: "entwicklung", label: "Promotion immobilière" },
      { value: "andere", label: "Autre" },
    ],
    errors: {
      haus: "Veuillez indiquer le nom de l’établissement.",
      ort: "Veuillez indiquer le lieu.",
      art: "Veuillez choisir le type d’établissement.",
      zimmer: "Veuillez indiquer un nombre entre 1 et 2000.",
      zeitfenster: "Veuillez choisir un calendrier.",
      vorname: "Veuillez indiquer votre prénom.",
      nachname: "Veuillez indiquer votre nom.",
      email: "Veuillez vérifier l’adresse e-mail, par exemple nom@exemple.com.",
      emailMissing: "Veuillez indiquer votre adresse e-mail.",
      telefon: "Veuillez vérifier le numéro de téléphone (6 à 20 chiffres).",
      server: "Veuillez vérifier cette indication.",
    },
    summaryTitle: "Veuillez vérifier vos indications",
    send: "Envoyer la demande",
    sending: "Envoi en cours …",
    successTitle: "Demande reçue",
    success: "Merci, {name}. Votre demande pour {haus} nous est bien parvenue. Nous revenons personnellement vers vous.",
    again: "Nouvelle demande",
    termin: { label: "Demander plutôt un rendez-vous", text: "Au showroom de Lochau, chez vous sur place ou par vidéo." },
    ...BACKOFFICE,
    placeChalet: "dans un chalet ou un appartement de vacances",
    pageContext: "Seite: Hotel & Objekt (FR)",
  },
  faq: {
    name: "hotel-faq",
    heading: "Questions sur l’aménagement d’hôtels et de restaurants",
    items: [
      { q: "Aménagez-vous un hôtel entièrement ?", a: "Nous concevons tout l’intérieur et livrons l’équipement mobile : mobilier, luminaires, tapis, tissus, extérieur et mosaïque de verre. Les agencements fixes, la pose et les installations techniques sont réalisés par des entreprises spécialisées que nous coordonnons. Vous avez ainsi un seul interlocuteur pour l’intérieur, et chaque prestation est entre les mains d’un spécialiste." },
      { q: "Assurez-vous la direction des travaux ?", a: "Non. La direction des travaux reste chez votre architecte ou le maître d’ouvrage. Nous coordonnons avec eux et avec les entreprises spécialisées les dates, la livraison et le montage de l’aménagement." },
      { q: "Pourquoi Harald Menghin dessine-t-il à la main ?", a: "Un dessin à la main montre tôt l’effet recherché d’un espace, sans se perdre dans les détails. Avec la maquette, proportions et circulations se règlent rapidement avec votre équipe. Ensuite, nous planifions en 3D et vous montrons des images photoréalistes avant toute commande." },
      { q: "Le mobilier est-il adapté aux hôtels et testé au feu ?", a: "Pour les hôtels, nous ne planifions qu’avec des modèles pour lesquels le fabricant peut fournir les justificatifs nécessaires, par exemple des essais des rembourrages selon EN 1021-1 et -2 et la résistance à l’abrasion des revêtements. Les valeurs requises pour votre établissement sont fixées par votre concept de protection incendie. Les justificatifs figurent dans la liste jointe à l’offre." },
      { q: "Que signifie « B1 » pour le mobilier hôtelier ?", a: "B1 selon DIN 4102 est une classe allemande de matériaux de construction, par exemple pour les tissus de rideaux ou les revêtements muraux. En Autriche s’applique la classification européenne selon EN 13501-1, en lien avec la directive OIB 2 ; en Suisse, ce sont les prescriptions de protection incendie AEAI. Les meubles rembourrés se composent de plusieurs matériaux et sont testés comme un tout, le plus souvent selon EN 1021. Nous clarifions avec votre spécialiste en protection incendie quel justificatif s’applique à quelle pièce." },
      { q: "Qu’est-ce qu’une chambre témoin, et cela en vaut-il la peine ?", a: "Dans la chambre témoin, une chambre est entièrement aménagée à l’avance. Vous, votre équipe et vos habitués la testez avant la commande en série. Les erreurs de dimensions, de lumière ou de revêtements apparaissent ainsi dans une seule chambre, et non dans toutes." },
      { q: "Quand devrions-nous commencer ?", a: "Le plus tôt possible. De nombreux meubles rembourrés ont des délais de livraison de plusieurs mois ; en montagne, la pose se fait généralement entre deux saisons, au bord du lac souvent en hiver. Nous planifions à rebours à partir de la date d’arrivée de vos hôtes." },
      { q: "Pouvons-nous aménager par étapes ?", a: "Oui. De nombreux établissements commencent par la terrasse ou le bar, puis renouvellent chambres et lobby. Nous concevons le concept d’ensemble de sorte que chaque étape paraisse aboutie en elle-même." },
      { q: "Aidez-vous pour les demandes de subventions ?", a: "Nous fournissons une liste des coûts par espace, que vous pouvez utiliser pour une demande. De nombreux programmes exigent que la demande soit déposée avant l’attribution des commandes. La décision revient à l’organisme de financement. Nous ne donnons pas de conseil en matière de subventions, de fiscalité ou de droit ; veuillez coordonner la demande avec votre banque." },
      { q: "Livrez-vous aussi en Allemagne, au Liechtenstein et en Suisse ?", a: "Livraison et montage sont définis pour chaque projet. Pour le Liechtenstein et la Suisse, le dédouanement en fait partie. Les détails et les coûts figurent dans l’offre." },
      { q: "Aménagez-vous aussi un seul appartement de vacances ou un chalet ?", a: "Oui, de l’appartement de vacances individuel au chalet, avec cuisine, textiles et accessoires. Nous le remettons prêt à habiter, même si vous n’êtes pas sur place." },
    ],
  },
  showroom: {
    heading: "Voir les matériaux, prendre place",
    text: "Tissus, bois, finitions, luminaires et mosaïque de verre sont à voir chez nous en original. Venez avec votre équipe – pour les rendez-vous de projet, merci de convenir d’une date.",
  },
  closing: {
    heading: "Un rendez-vous pour votre établissement",
    text: "Au showroom avec café à Lochau, chez vous sur place ou par vidéo. Apportez plans, photos et votre calendrier.",
    primary: "Demander un rendez-vous",
    secondary: "Contact",
  },
  schema: {
    serviceName: "Aménagement d’hôtels et de restaurants",
    serviceType: "Aménagement intérieur d’hôtels, de chalets, d’appartements de vacances et de restaurants",
    description:
      "Concept avec dessin à la main, maquette, planification 3D et rendu, chambre témoin, livraison et montage de l’équipement mobile pour hôtels et restaurants ; agencements fixes et pose par des entreprises spécialisées coordonnées.",
    areaServed: ["Vorarlberg", "Tyrol", "Bavière", "Bade-Wurtemberg", "Liechtenstein", "Canton de Saint-Gall", "Canton de Thurgovie"],
  },
};

const IT = {
  meta: {
    title: "Arredamento per hotel, Lago di Costanza e Alpi",
    description:
      "Arredare hotel, chalet e ristoranti: disegno a mano, modello, 3D e camera campione, arredi, luce e mosaico Ezarri, montaggio tra due stagioni.",
    ogEyebrow: "Hotel · Chalet · Ristoranti",
    ogTitle: "Hotel & progetti",
    ogLine: "Disegnato a mano. Arredato per i vostri ospiti.",
  },
  hero: {
    crumb: "Hotel & progetti",
    eyebrow: "Hotel · Chalet · Ristoranti",
    title: "Arredare hotel sul Lago di Costanza e nelle Alpi",
    lead: "Per strutture in Vorarlberg, sull’Arlberg e attorno al Lago di Costanza progettiamo camere, lobby, ristorante, spa e terrazza. Harald Menghin disegna il concept a mano, poi seguono modello, progetto 3D e rendering.",
    primary: "Presentate il vostro progetto",
    facts: [
      { label: "Per", value: "Hotel, chalet, appartamenti per vacanze, ristoranti e bar" },
      { label: "Sul posto", value: "Sopralluogo nella struttura, se il progetto lo richiede anche uno o due giorni" },
      { label: "Un unico referente", value: "Per tutti gli interni, con una chiara ripartizione dei lavori" },
    ],
  },
  services: {
    eyebrow: "Servizi",
    heading: "Dalla camera alla terrazza sul lago",
    text: "Ci occupiamo della progettazione e dell’arredo mobile. Arredi fissi, posa e impianti sono affidati a imprese specializzate con cui ci coordiniamo.",
    items: [
      { id: "zimmer", name: "Camere e suite", text: "Divani, poltrone, tavoli, lampade, tende, tappeti e accessori. Testate del letto e armadi li realizza un falegname; noi coordiniamo materiali e colori." },
      { id: "lobby", name: "Lobby e reception", text: "Il primo impatto della vostra struttura: arredi lounge, luce, tappeti e accenti. Il banco della reception lo realizza un falegname sul progetto condiviso." },
      { id: "restaurant", name: "Ristorante e bar", text: "Sedie e tavoli per il servizio quotidiano, bar lounge e luce per scenari diversi. La cucina professionale la progetta il vostro specialista; noi coordiniamo le interfacce." },
      { id: "spa", name: "Spa e piscina con mosaico Ezarri", text: "Mosaico di vetro Ezarri per piscina, bagno turco e docce, con lettini, tessili e luce. La posa è affidata a un’impresa specializzata.", link: { href: "/ezarri", label: "Mosaico di vetro Ezarri" }, more: { href: "/bad-wellness", label: "Spa e sale trattamenti" } },
      { id: "outdoor", name: "Terrazza, rooftop e giardino", text: "Arredi da esterno, ombrelloni e luce per terrazza sul lago, terrazza sul tetto e zona piscina. Giardino ed esecuzione sono affidati a imprese abilitate; noi coordiniamo.", link: { href: "/outdoor-gartenplanung", label: "Outdoor e giardino" } },
      { id: "yacht", name: "Barca dell’hotel, pontile e rimessa", text: "Per strutture sul lago con barca o rimessa propria: imbottiti, tessuti e arredo mobile insieme a un tappezziere nautico e al cantiere, come per i nostri interni di yacht.", link: { href: "/yacht-interior", label: "Interni per yacht" } },
    ],
  },
  chalets: {
    id: "chalets",
    eyebrow: "Chalet & appartamenti per vacanze",
    heading: "Arredati chiavi in mano, pronti per gli ospiti",
    text: "Per proprietari e locatori sull’Arlberg, sul Lago di Costanza e in Vorarlberg: arrediamo completamente il vostro chalet o appartamento per vacanze e lo consegniamo pronto da abitare o pronto da affittare, anche se non siete sul posto.",
    regions: [
      { name: "Arlberg", text: "Lech, Zürs, Warth, St. Anton e St. Christoph" },
      { name: "Lago di Costanza", text: "Bregenz, Lochau, Lindau e le sponde tedesca e svizzera" },
      { name: "Vorarlberg", text: "Bregenzerwald, Montafon, Kleinwalsertal e valle del Reno" },
    ],
    items: [
      { name: "Soggiorno, notte, cucina", text: "Mobili, letti, lampade e cucina da un unico progetto, abbastanza robusti per ospiti che si alternano." },
      { name: "Bagno e spa con mosaico Ezarri", text: "Mosaico di vetro Ezarri per doccia, bagno turco, vasca idromassaggio o piscina. La posa è affidata a un’impresa specializzata." },
      { name: "Terrazza e outdoor", text: "Arredi da esterno, ombrelloni e luce per balcone, terrazza e giardino, con indicazioni per il rimessaggio invernale." },
      { name: "Tessili e dotazione", text: "Tende, tappeti, biancheria da letto, plaid, cuscini e accessori, coordinati con il concept." },
      { name: "Consegna", text: "Montaggio, inventario e istruzioni di cura per la vostra locazione o amministrazione. Pronto da abitare o pronto da affittare, come concordato." },
    ],
    note: "Vivete in Germania, in Svizzera o più lontano? Progettazione, campioni e approvazioni si gestiscono anche in videochiamata e nel portale clienti.",
    cta: { href: "#anfrage-chalet", label: "Richiesta per chalet o appartamento" },
  },
  process: {
    eyebrow: "Processo",
    heading: "Dal sopralluogo al montaggio tra due stagioni",
    text: "I progetti alberghieri hanno date fisse. Per questo pianifichiamo a ritroso dal giorno in cui arrivano i vostri ospiti e mettiamo per iscritto chi consegna cosa, e quando.",
    steps: [
      { title: "Sopralluogo", text: "Conosciamo la vostra struttura: spazi, luce nell’arco della giornata, clima, percorsi degli ospiti e flussi del servizio. Se il progetto lo richiede, restiamo anche uno o due giorni sul posto." },
      { title: "Disegno a mano", text: "Harald Menghin schizza a mano pianta, prospettive e atmosfere – per lobby, ristorazione e una camera tipo." },
      { title: "Modello", text: "Un modello in scala degli spazi, come lo conoscono i promotori immobiliari. Sul modello chiarite con il vostro team proporzioni e percorsi prima della progettazione digitale." },
      { title: "Progetto 3D", text: "La progettazione digitale con misure esatte, prodotti e materiali. Su richiesta coordinata con il vostro architetto." },
      { title: "Rendering", text: "Immagini fotorealistiche degli spazi prima di ordinare qualsiasi cosa. Il vostro feedback lo date nel portale clienti, anche con un messaggio vocale." },
      { title: "Camera campione", text: "Una camera o una suite viene arredata completamente in anticipo, nella vostra struttura. La testate con il vostro team e gli ospiti abituali prima dell’ordine in serie." },
      { title: "Lista e offerta", text: "Ogni pezzo con quantità, misure, materiale, attestazioni del produttore e tempi di consegna. Ne nasce l’offerta per l’arredo mobile." },
      { title: "Montaggio tra due stagioni", text: "Consegna piano per piano, montaggio degli arredi mobili e verifica stanza per stanza – tra due stagioni o prima dell’apertura. Poi restiamo a disposizione per riordini e sostituzioni." },
    ],
    note: "Molti imbottiti hanno tempi di consegna di diversi mesi. In montagna si monta di solito tra una stagione e l’altra, sul lago spesso in inverno. Parlatecene quindi per tempo.",
    link: { href: "/arbeitsweise", label: "Il nostro metodo: dal disegno a mano al rendering" },
  },
  sampleRoom: {
    eyebrow: "Camera campione",
    heading: "Prima una camera, poi la serie",
    text: "Nella camera campione gli errori di misure, luce o rivestimenti emergono in una sola stanza – non in tutte. Il vostro team verifica percorsi e pulizia, gli ospiti abituali dicono come ci si sente.",
    points: [
      "Una camera o una suite nella vostra struttura, arredata completamente",
      "Tessuti, legni, superfici e lampade da vedere prima dal vero, nel nostro showroom di Lochau",
      "Le modifiche entrano nella lista prima dell’ordine in serie",
    ],
  },
  roles: {
    eyebrow: "Chi fa cosa",
    heading: "Un unico referente, competenze chiare",
    text: "Nell’offerta è indicato, per ogni prestazione, chi la fornisce e con chi stipulate il contratto.",
    taskLabel: "Prestazione",
    whoLabel: "Chi",
    rows: [
      { task: "Concept, disegno a mano, modello, progetto 3D, rendering, camera campione", who: "Platzhirsch" },
      { task: "Mobili, lampade, tappeti, tessuti, outdoor e accessori", who: "Platzhirsch" },
      { task: "Mosaico di vetro per piscina e spa (Ezarri)", who: "Platzhirsch fornisce, un’impresa specializzata posa" },
      { task: "Arredi fissi come reception, testate del letto, armadi", who: "Falegnami della regione, coordinati con noi" },
      { task: "Cucina professionale, ventilazione, impianto elettrico, piano antincendio", who: "I vostri progettisti specializzati e il vostro architetto" },
      { task: "Direzione lavori", who: "Il vostro architetto o il committente – ci coordiniamo con lui" },
    ],
  },
  quality: {
    eyebrow: "Per l’uso continuo",
    heading: "Cosa conta in hotel",
    text: "Un divano nella lobby è in uso dalla mattina alla sera. Per ogni pezzo della lista richiediamo le attestazioni al produttore. Quali valori servono alla vostra struttura lo stabilisce il vostro piano antincendio.",
    items: [
      { name: "Antincendio", text: "Rapporti di prova del produttore per gli imbottiti, ad esempio secondo EN 1021-1 e -2 (sigaretta e fiammifero), e per tessuti da tenda e da parete la classe di reazione al fuoco adatta." },
      { name: "Resistenza all’usura", text: "Valori di abrasione dei tessuti di rivestimento (Martindale) e solidità alla luce da scheda tecnica. Per sedute e tavoli a uso contract, la norma di prova del produttore, ad esempio EN 16139 ed EN 15372." },
      { name: "Riordini", text: "Prima dell’ordine verifichiamo per quanto tempo un modello resta disponibile e consigliamo rivestimenti sfoderabili e di ricambio per gli imbottiti più sollecitati." },
      { name: "Cura", text: "Ogni progetto include istruzioni di cura per il vostro housekeeping: pulizia, macchie, rimessaggio invernale degli arredi da esterno." },
      { name: "Zone bagnate e a piedi nudi", text: "Per piscina e spa scegliamo mosaici con la resistenza allo scivolamento richiesta dalla vostra zona – secondo la scheda tecnica del produttore." },
    ],
    note: "Progettiamo solo con modelli per cui il produttore può fornire le attestazioni necessarie. I certificati li rilasciano i produttori e gli enti di prova, non noi.",
  },
  brands: {
    eyebrow: "Marchi e materiali",
    heading: "Dal nostro assortimento, per la vostra struttura",
    text: "A questi si aggiungono sedute contract, marchi outdoor e lampade del nostro assortimento. Nella nostra esposizione a Lochau vedete dal vero mobili di Minotti, ClassiCon e di altri produttori.",
    ezarriCaption: "Mosaico di vetro Ezarri in una piscina. Un’immagine del produttore, non un progetto di Platzhirsch.",
    ezarriAlt: "Piscina con mosaico di vetro Ezarri azzurro chiaro, collezione Niebla",
    ezarriCredit: "Immagine: Ezarri, ezarri.com",
    ezarriNote: "Sul proprio sito Ezarri mostra progetti alberghieri del produttore.",
    // ezarri.com hat keine italienische Fassung (/it → Fehlerseite, geprüft 01.11.2026).
    ezarriLink: { href: "https://www.ezarri.com/en", label: "Al sito di Ezarri (in inglese)" },
  },
  references: {
    eyebrow: "Progetti",
    heading: "Strutture che abbiamo arredato",
    text: "Mostriamo solo progetti i cui padroni di casa hanno acconsentito per iscritto alla pubblicazione.",
  },
  area: {
    eyebrow: "Area di intervento",
    heading: "Da Lochau al lago e alle montagne",
    text: "Il Lago di Costanza con le sponde austriaca, tedesca e svizzera, il Vorarlberg con Bregenzerwald e Montafon, l’Arlberg con Lech, Zürs e St. Anton, il Liechtenstein e la Svizzera orientale. Consegna e montaggio si definiscono per ogni progetto.",
  },
  form: {
    id: "anfrage",
    eyebrow: "Richiesta di progetto",
    heading: "Raccontateci della vostra struttura",
    text: "Bastano poche indicazioni. Vi ricontattiamo personalmente con una proposta per un sopralluogo o un incontro in showroom.",
    required: "I campi con * ci servono per la richiesta.",
    optional: "(facoltativo)",
    fields: {
      haus: "Nome della struttura",
      ort: "Località",
      art: "Tipo di struttura",
      zimmer: "Camere o unità",
      zimmerHint: "Basta un numero indicativo.",
      bereiche: "Quali ambienti?",
      zeitfenster: "Tempistica",
      zeitfensterHint: "Entro quando dovrebbe essere tutto arredato?",
      rolle: "Il vostro ruolo",
      vorname: "Nome",
      nachname: "Cognome",
      firma: "Azienda",
      email: "E-mail",
      telefon: "Telefono",
      nachricht: "Messaggio",
      nachrichtHint: "Ad esempio ristrutturazione, apertura, stagione o ciò che è già deciso.",
    },
    choose: "Selezionate",
    art: [
      { value: "hotel", label: "Hotel" },
      { value: "chalet", label: "Chalet o appartamenti per vacanze" },
      { value: "apartment", label: "Casa di appartamenti" },
      { value: "gastro", label: "Ristorante, bar o caffè" },
      { value: "anderes", label: "Altro" },
    ],
    bereiche: [
      { value: "zimmer", label: "Camere e suite" },
      { value: "lobby", label: "Lobby e reception" },
      { value: "restaurant", label: "Ristorante e bar" },
      { value: "spa", label: "Spa e piscina" },
      { value: "outdoor", label: "Terrazza e outdoor" },
      { value: "boot", label: "Barca o rimessa per barche" },
    ],
    zeitfenster: [
      { value: "6", label: "Nei prossimi 6 mesi" },
      { value: "12", label: "Tra 6 e 12 mesi" },
      { value: "24", label: "Tra 12 e 24 mesi" },
      { value: "offen", label: "Più avanti o ancora da definire" },
    ],
    rolle: [
      { value: "eigentuemer", label: "Proprietario o gestore" },
      { value: "architektur", label: "Architettura o progettazione" },
      { value: "entwicklung", label: "Sviluppo immobiliare" },
      { value: "andere", label: "Altro" },
    ],
    errors: {
      haus: "Indicate il nome della struttura.",
      ort: "Indicate la località.",
      art: "Selezionate il tipo di struttura.",
      zimmer: "Indicate un numero tra 1 e 2000.",
      zeitfenster: "Selezionate una tempistica.",
      vorname: "Indicate il vostro nome.",
      nachname: "Indicate il vostro cognome.",
      email: "Verificate l’indirizzo e-mail, ad esempio nome@esempio.com.",
      emailMissing: "Indicate il vostro indirizzo e-mail.",
      telefon: "Verificate il numero di telefono (da 6 a 20 cifre).",
      server: "Verificate questo dato.",
    },
    summaryTitle: "Verificate i vostri dati",
    send: "Invia la richiesta",
    sending: "Invio in corso …",
    successTitle: "Richiesta ricevuta",
    success: "Grazie, {name}. La vostra richiesta per {haus} ci è arrivata. Vi ricontatteremo personalmente.",
    again: "Nuova richiesta",
    termin: { label: "Richiedete piuttosto un appuntamento", text: "Nello showroom di Lochau, da voi sul posto o in videochiamata." },
    ...BACKOFFICE,
    placeChalet: "in uno chalet o in un appartamento per vacanze",
    pageContext: "Seite: Hotel & Objekt (IT)",
  },
  faq: {
    name: "hotel-faq",
    heading: "Domande sull’arredamento di hotel e ristoranti",
    items: [
      { q: "Arredate un hotel per intero?", a: "Progettiamo tutti gli interni e forniamo l’arredo mobile: mobili, lampade, tappeti, tessuti, outdoor e mosaico di vetro. Arredi fissi, posa e impianti sono realizzati da imprese specializzate che coordiniamo noi. Così per gli interni avete un unico referente, e ogni lavoro è nelle mani di uno specialista." },
      { q: "Vi occupate della direzione lavori?", a: "No. La direzione lavori resta al vostro architetto o al committente. Con lui e con le imprese specializzate coordiniamo date, consegna e montaggio dell’arredamento." },
      { q: "Perché Harald Menghin disegna a mano?", a: "Un disegno a mano mostra presto l’effetto che uno spazio deve avere, senza perdersi nei dettagli. Insieme al modello, proporzioni e percorsi si chiariscono rapidamente con il vostro team. Poi progettiamo in 3D e vi mostriamo immagini fotorealistiche prima di ordinare qualsiasi cosa." },
      { q: "I mobili sono adatti agli hotel e testati per la reazione al fuoco?", a: "Per gli hotel progettiamo solo con modelli per cui il produttore può fornire le attestazioni necessarie, ad esempio prove degli imbottiti secondo EN 1021-1 e -2 e valori di abrasione dei rivestimenti. Quali valori servono alla vostra struttura lo stabilisce il vostro piano antincendio. Le attestazioni sono riportate nella lista allegata all’offerta." },
      { q: "Che cosa significa «B1» per i mobili d’albergo?", a: "B1 secondo DIN 4102 è una classe tedesca per materiali da costruzione, ad esempio tessuti da tenda o rivestimenti murali. In Austria vale la classificazione europea secondo EN 13501-1 insieme alla direttiva OIB 2, in Svizzera valgono le prescrizioni antincendio AICAA. I mobili imbottiti sono composti da più materiali e vengono testati nel loro insieme, per lo più secondo EN 1021. Chiariamo con il vostro progettista antincendio quale attestazione vale per quale pezzo." },
      { q: "Che cos’è una camera campione e conviene?", a: "Nella camera campione una camera viene arredata completamente in anticipo. Voi, il vostro team e gli ospiti abituali la testate prima dell’ordine in serie. Così errori di misure, luce o rivestimenti emergono in una sola camera e non in tutte." },
      { q: "Quando dovremmo iniziare?", a: "Il prima possibile. Molti imbottiti hanno tempi di consegna di diversi mesi, e in montagna si monta di solito tra una stagione e l’altra, sul lago spesso in inverno. Pianifichiamo a ritroso dalla data in cui arrivano i vostri ospiti." },
      { q: "Possiamo arredare a tappe?", a: "Sì. Molte strutture iniziano con la terrazza o il bar e poi rinnovano camere e lobby. Progettiamo il concept complessivo in modo che ogni tappa risulti compiuta in sé." },
      { q: "Ci aiutate con le domande di contributo?", a: "Forniamo una lista con i costi per ambiente, che potete usare per una domanda. Molti programmi richiedono che la domanda sia presentata prima dell’affidamento degli incarichi. Sul contributo decide l’ente erogatore. Non offriamo consulenza su contributi, fisco o questioni legali; concordate la domanda con la vostra banca." },
      { q: "Consegnate anche in Germania, Liechtenstein e Svizzera?", a: "Consegna e montaggio si definiscono per ogni progetto. Per il Liechtenstein e la Svizzera è compreso lo sdoganamento. Dettagli e costi sono indicati nell’offerta." },
      { q: "Arredate anche singoli appartamenti per vacanze o uno chalet?", a: "Sì, dal singolo appartamento per vacanze allo chalet, con cucina, tessili e accessori. Consegniamo pronto da abitare, anche se non siete sul posto." },
    ],
  },
  showroom: {
    heading: "Vedere i materiali, prendere posto",
    text: "Tessuti, legni, superfici, lampade e mosaico di vetro li vedete da noi dal vero. Portate il vostro team – per incontri di progetto, su appuntamento.",
  },
  closing: {
    heading: "Un appuntamento per la vostra struttura",
    text: "Nello showroom con caffè a Lochau, da voi sul posto o in videochiamata. Portate piante, foto e la vostra tempistica.",
    primary: "Richiedete un appuntamento",
    secondary: "Contatto",
  },
  schema: {
    serviceName: "Arredamento per hotel e ristorazione",
    serviceType: "Arredamento di hotel, chalet, appartamenti per vacanze e ristoranti",
    description:
      "Concept con disegno a mano, modello, progetto 3D e rendering, camera campione, consegna e montaggio dell’arredo mobile per hotel e ristoranti; arredi fissi e posa a cura di imprese specializzate coordinate.",
    areaServed: ["Vorarlberg", "Tirolo", "Baviera", "Baden-Württemberg", "Liechtenstein", "Cantone di San Gallo", "Cantone di Turgovia"],
  },
};

/**
 * FR- und IT-Texte; `dealer(locale, withEzarri)` liefert den Händler-Satz aus
 * dem Claim-Register (content.js), damit dieses Modul keine Liste doppelt führt.
 * @param {(locale: string, withEzarri: boolean) => string} dealer
 */
export function intlHotelCopy(dealer) {
  const withDealer = (copy, locale) => ({
    ...copy,
    brands: { eyebrow: copy.brands.eyebrow, heading: copy.brands.heading, dealer: dealer(locale, true), dealerNoEzarri: dealer(locale, false), ...copy.brands },
  });
  // Typografie vor dem Händler-Satz: der Satz kommt unverändert aus dem Register.
  return { fr: withDealer(frenchTypography(FR), "fr"), it: withDealer(IT, "it") };
}
