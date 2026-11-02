// Stellentexte Französisch – Übersetzung von stellen.de.js (gleiche Struktur,
// gleiche Schlüssel, gleiche Reihenfolge). Regeln wie dort (GlBG § 9):
// Titel inklusiv mit „(h/f/d)“, neutrale Formulierungen, keine Superlative,
// keine zusätzlichen Angaben gegenüber dem deutschen Original.
// Rein: keine Pakete, keine "@/"-Aliase.

export const BIETEN = [
  "Lieu de travail au studio d’aménagement intérieur de Lochau, Landstraße 11, au bord du lac de Constance",
  "Travail avec les marques de design internationales de notre showroom",
  "Collaboration au sein d’une équipe réunissant design d’intérieur, conception, conseil et montage – des projets d’un seul interlocuteur",
];

export const STELLEN = {
  "cad-planer": {
    title: "Dessinateur·rice CAO (h/f/d)",
    bereich: "Conception",
    beschreibung:
      "Vous transformez des concepts d’aménagement, de cuisine et de salle de bains en plans précis – du relevé de mesures jusqu’aux plans d’exécution et de montage. Vous travaillez en étroite collaboration avec le design d’intérieur, la vente et le montage.",
    aufgaben: [
      "Établir des plans, des élévations et des plans de détail pour cuisines, salles de bains et meubles",
      "Transposer des projets issus de croquis et de maquettes en plans CAO et en vues 3D",
      "Effectuer les relevés de mesures sur place chez la clientèle et vérifier les conditions d’installation",
      "Élaborer les plans d’exécution et de montage pour le montage et les corps de métier concernés",
      "Assurer la coordination avec les fabricants, les fournisseurs et l’équipe de montage",
    ],
    profil: [
      "Formation ou études achevées en technique du bâtiment, aménagement intérieur, menuiserie ou architecture d’intérieur, ou qualification équivalente",
      "Connaissances d’Archicad et/ou d’AutoCAD",
      "Vision dans l’espace et méthode de travail précise",
      "Compréhension des matériaux, des constructions et des conditions d’installation",
      "Plaisir à collaborer avec la conception, la vente et le montage",
    ],
  },
  innenarchitekt: {
    title: "Architecte d’intérieur (h/f/d)",
    bereich: "Design d’intérieur",
    beschreibung:
      "Avec nos clientes et clients, vous développez des concepts pour des espaces de vie, des cuisines et des salles de bains, et vous accompagnez les projets de la première idée jusqu’à la remise.",
    aufgaben: [
      "Conseiller sur l’espace, les matériaux, la lumière et le mobilier",
      "Concevoir des concepts d’aménagement à l’aide de croquis, de maquettes et de visualisations 3D",
      "Sélectionner meubles, matériaux et surfaces dans l’assortiment de nos marques",
      "Préparer présentations, plans et offres en collaboration avec la vente",
      "Assurer la coordination avec la conception CAO, le montage et les corps de métier concernés",
    ],
    profil: [
      "Études ou formation achevées en architecture d’intérieur ou en design d’intérieur, ou qualification équivalente",
      "Expérience dans la conception d’espaces de vie, de cuisines ou de salles de bains",
      "Sens des proportions, des matériaux et des couleurs",
      "Maîtrise des logiciels de CAO et de visualisation",
      "Plaisir à conseiller et à échanger avec la clientèle",
    ],
  },
  verkaeufer: {
    title: "Conseiller·ère de vente en aménagement intérieur (h/f/d)",
    bereich: "Vente et conseil",
    beschreibung:
      "Vous conseillez les visiteuses et visiteurs de notre showroom à Lochau et les accompagnez de la première question jusqu’à la commande.",
    aufgaben: [
      "Accueillir et conseiller la clientèle dans le showroom",
      "Présenter les meubles, luminaires et accessoires de nos marques de design",
      "Établir des offres et des confirmations de commande",
      "Assurer la coordination avec le design d’intérieur, la conception et le montage pour la livraison et l’installation",
      "Entretenir le showroom et suivre la clientèle après l’achat",
    ],
    profil: [
      "Formation commerciale achevée ou expérience dans la vente, de préférence dans le secteur du meuble ou de l’aménagement intérieur",
      "Intérêt pour le design, les matériaux et l’habitat",
      "Présentation aimable et plaisir au contact avec la clientèle",
      "Méthode de travail structurée et fiable",
      "Maîtrise des logiciels de bureautique courants",
    ],
  },
  "monteur-tischler": {
    title: "Monteur·euse avec apprentissage de menuisier·ère (h/f/d)",
    bereich: "Montage",
    beschreibung:
      "Vous montez des cuisines, des meubles encastrés et des meubles design chez nos clientes et clients et, grâce à votre formation de menuisier·ère, vous garantissez une exécution soignée et ajustée avec précision.",
    aufgaben: [
      "Montage de cuisines, de meubles encastrés et de meubles design chez la clientèle",
      "Travaux d’ajustement sur place sur les meubles et les éléments encastrés",
      "Lire et mettre en œuvre les plans de montage et d’exécution",
      "Contrôler les livraisons et documenter le montage",
      "Assurer la coordination avec la conception et les autres corps de métier sur le chantier",
    ],
    profil: [
      "Apprentissage de menuisier·ère achevé",
      "Expérience dans le montage de meubles ou de cuisines",
      "Méthode de travail soignée et compréhension des plans d’exécution",
      "Contact aimable avec la clientèle sur place",
      "Esprit d’équipe et fiabilité",
      "Permis B (obligatoire), permis C apprécié",
    ],
  },
  monteur: {
    title: "Monteur·euse (h/f/d)",
    bereich: "Montage",
    beschreibung:
      "Vous livrez et montez des meubles, des luminaires et des éléments de cuisine chez nos clientes et clients, au sein de l’équipe de montage.",
    aufgaben: [
      "Livraison et montage de meubles, de luminaires et d’éléments de cuisine",
      "Participation au montage de cuisines et de meubles encastrés",
      "Protection des pièces chez la clientèle et élimination des emballages",
      "Contrôler la marchandise et signaler les dommages ou les pièces manquantes",
      "Collaboration avec les menuisières et menuisiers, la conception et la vente",
    ],
    profil: [
      "Habileté manuelle et expérience dans le montage ; une formation dans un métier manuel est un atout",
      "Manipulation soigneuse des meubles et des surfaces délicates",
      "Présentation aimable auprès de la clientèle",
      "Esprit d’équipe et fiabilité",
      "Permis B (obligatoire), permis C apprécié",
    ],
  },
  fliesenleger: {
    title: "Carreleur·euse (h/f/d)",
    bereich: "Salle de bains et bien-être",
    beschreibung:
      "Au sein de notre équipe de montage, vous posez des carreaux et des dalles dans des salles de bains, des cuisines et des espaces bien-être que nous concevons avec nos clientes et clients.",
    aufgaben: [
      "Poser des carreaux muraux et de sol, des dalles et des mosaïques",
      "Préparer les supports, réaliser l’étanchéité et les joints",
      "Mettre en œuvre les plans de pose en salle de bains, en cuisine et dans les espaces bien-être",
      "Assurer la coordination avec la conception, l’installation sanitaire et le montage sur le chantier",
      "Exécuter avec soin les raccords et les détails",
    ],
    profil: [
      "Apprentissage de carreleur·euse achevé ou qualification équivalente",
      "Expérience dans la pose de carreaux et de dalles",
      "Méthode de travail précise et sens des finitions soignées",
      "Esprit d’équipe et fiabilité",
    ],
  },
  installateur: {
    title: "Installateur·rice sanitaire et chauffage (h/f/d)",
    bereich: "Technique du bâtiment",
    beschreibung:
      "Au sein de notre équipe de montage, vous installez les équipements sanitaires et de chauffage dans les salles de bains, les cuisines et les espaces bien-être que nous concevons et réalisons.",
    aufgaben: [
      "Installer des appareils sanitaires, de la robinetterie et des conduites",
      "Monter et raccorder des composants de chauffage",
      "Raccorder les appareils de cuisine à l’eau et aux eaux usées",
      "Mettre en œuvre les plans d’installation en coordination avec la conception et les carreleuses et carreleurs",
      "Mise en service, contrôle de fonctionnement et documentation",
    ],
    profil: [
      "Apprentissage achevé en technique d’installation et du bâtiment (sanitaire et chauffage) ou qualification équivalente",
      "Expérience dans l’installation sanitaire et de chauffage",
      "Méthode de travail soignée et autonome",
      "Esprit d’équipe et contact aimable avec la clientèle",
    ],
  },
  elektroplaner: {
    title: "Concepteur·rice en installations électriques (h/f/d)",
    bereich: "Conception",
    beschreibung:
      "Au sein de notre équipe de conception, vous concevez l’installation électrique et l’éclairage pour cuisines, salles de bains et espaces de vie, et les coordonnez avec le design d’intérieur et le montage.",
    aufgaben: [
      "Concevoir les installations électriques, les raccordements et les solutions d’éclairage pour la cuisine, la salle de bains et l’espace de vie",
      "Établir les plans électriques et d’éclairage",
      "Assurer la coordination avec le design d’intérieur, la conception CAO et notre équipe de montage",
      "Vérifier les raccordements des appareils et les prescriptions techniques des fabricants",
      "Accompagner la mise en œuvre sur le chantier",
    ],
    profil: [
      "Formation achevée en électrotechnique (p. ex. HTL, lycée technique supérieur autrichien, ou apprentissage complété par une formation continue) ou qualification équivalente",
      "Expérience dans la conception électrique en construction résidentielle ou en aménagement intérieur",
      "Connaissance des normes et prescriptions en vigueur (ÖVE/ÖNORM)",
      "Connaissances d’Archicad et/ou d’AutoCAD",
      "Méthode de travail précise et plaisir à travailler en équipe",
    ],
  },
};
