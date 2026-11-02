// src/components/BadWellness/badWellnessHub.js
// Lokal-SEO Bad & Wellness (31.10.2026): Suchbegriffe „whirlpool vorarlberg“,
// „whirlpool kaufen“, „sauna kaufen vorarlberg“ vor der Januar-Saison.
//
// Inhalt: Title/H1 „Whirlpool, Sauna & Bad in Vorarlberg“, zwei kurze
// Abschnitte (Whirlpool mit Aquavia Spa, Außensauna mit Starpool und Soleum)
// und die FAQ (Lieferung, Standort/Fundament, Elektroanschluss, Beratung) –
// die FAQ ersetzt auf /bad-wellness den Block seoGeo.faq.badWellness.
//
// Warum eine eigene Tabelle: badWellness.* in src/messages/*.json muss gleich
// der Vorschlagsdatei Marktresearch/digital/features/bad-wellness-messages.json
// und BW_TEXT bleiben (tests/unit/bad-wellness*.test.mjs). Diese Texte gelten,
// bis sie in die Messages übernommen werden (offener Punkt Integration).
//
// Regeln (tests/unit/bad-wellness-hub.test.mjs):
//   - Fakten nur aus src/lib/katalog/marken/{aquavia-spa,starpool,soleum}.js;
//     Zahlen (kg, V) stehen dort wörtlich in den Herstellerangaben,
//   - kein Händler-Wort: der Satz kommt aus dealerStatementList (claims.js),
//     in der FAQ über den Platzhalter {markenSatz},
//   - keine Superlative, Preise, Showroom-/Ausstellungs-Aussage (Nr. 19),
//     keine Heil- oder Wirkversprechen, keine Lieferzeiten, keine Fahrzeiten,
//   - Lieferung „auf Anfrage“ wie AREA_SERVED (src/lib/site.js).
// Server-only (nur BadWellnessPage.js liest sie). Keine "@/..."-Importe (node --test).

export const BW_HUB = {
  de: {
    meta: {
      title: "Whirlpool, Sauna & Bad in Vorarlberg | Platzhirsch",
      description:
        "Whirlpool kaufen, Außensauna oder Bad planen: mit Aquavia Spa, Starpool und Soleum, von Hand und in 3D geplant – aus Lochau am Bodensee.",
    },
    title: "Whirlpool, Sauna & Bad in Vorarlberg",
    whirlpool: {
      title: "Whirlpool kaufen in Vorarlberg",
      text: "Aquavia Spa aus Spanien baut Whirlpools in mehreren Linien – von der kompakten City Line über Premium und Aqualife bis zu den gefliesten Becken der Tiled Line. Viele Modelle sind für innen und außen geeignet, einige laut Hersteller auch für den Einbau. Dazu kommen Swimspas mit Gegenstromanlage und ein Kaltwasserbecken.",
      planung: "Mit Ihnen wählen wir Größe, Platzzahl und Aufstellung und planen Untergrund, Stromanschluss und Abdeckung gleich mit.",
      markeLink: "Aquavia Spa: Modelle ansehen",
      ratgeberLink: "Ratgeber: Whirlpool oder Swimspa im Garten planen",
    },
    sauna: {
      title: "Außensauna für Garten und Haus",
      text: "Für Garten oder Terrasse baut Starpool die Nature Sauna: die Nature Sauna personal für zu Hause wahlweise mit Elektroofen oder mit Holzofen samt Kamin, die Nature Soft Sauna mit milder Wärme in drei Größen. Soleum fertigt mit ELLIPSE ein Dampfbad für den Außenbereich – für Garten, Terrasse oder neben dem Pool, anschlussfertig mit Glas geliefert und mit Platz für vier Personen.",
      planung: "Im Haus planen wir Saunen, Dampfbäder und Wärmeliegen beider Marken in Ihren Wellnessraum ein.",
      starpoolLink: "Starpool: Modelle ansehen",
      soleumLink: "Soleum: Modelle ansehen",
      ratgeberLink: "Ratgeber: Sauna fürs Zuhause planen",
    },
    faq: {
      title: "Häufige Fragen zu Whirlpool und Sauna",
      items: [
        {
          q: "Liefern und montieren Sie Whirlpools und Saunen?",
          a: "Ja, auf Anfrage in Vorarlberg, Deutschland, der Schweiz und Liechtenstein. Vorher prüfen wir mit Ihnen Zufahrt, Einbringweg und Stellplatz; Maße und Gewichte stehen in den Herstellerangaben je Modell. Lieferung und Montage stimmen wir mit Installateur, Elektriker und Fliesenleger ab.",
        },
        {
          q: "Welchen Standort und welches Fundament braucht ein Whirlpool oder eine Außensauna?",
          a: "Einen ebenen, tragfähigen Untergrund mit Platz für Wartung und Abdeckung. Ein gefüllter Whirlpool ist schwer – der Aquavia Spa Serenity wiegt laut Hersteller gefüllt 1.687 kg. Auf Terrasse, Balkon oder Dach prüft eine Statikerin oder ein Statiker die Tragfähigkeit. Ob eine Bauanzeige oder Bewilligung nötig ist, klärt Ihre Gemeinde.",
        },
        {
          q: "Wer übernimmt den Elektroanschluss?",
          a: "Den Anschluss stellt ein befugter Elektrofachbetrieb her. Welche Spannung ein Modell braucht, steht in den Herstellerangaben – die Starpool Nature Sauna personal etwa ist für 400 V ausgelegt. Leitungsweg und Anschlusspunkt zeichnen wir in der Planung ein und stimmen sie mit dem Elektriker ab.",
        },
        {
          q: "Wo kann ich mich beraten lassen?",
          a: "Im persönlichen Gespräch in Lochau oder bei Ihnen vor Ort. Wir besprechen Raum, Modelle und Anschlüsse anhand von Plänen und Herstellerbildern und zeigen Ihnen den Bereich in 3D. {markenSatz}",
        },
      ],
    },
  },
  en: {
    meta: {
      title: "Hot tubs, saunas & bathrooms in Vorarlberg | Platzhirsch",
      description:
        "Buy a hot tub, plan an outdoor sauna or bathroom: with Aquavia Spa, Starpool and Soleum, drawn by hand and in 3D – from Lochau on Lake Constance.",
    },
    title: "Hot tubs, saunas & bathrooms in Vorarlberg",
    whirlpool: {
      title: "Buying a hot tub in Vorarlberg",
      text: "Aquavia Spa from Spain makes hot tubs in several lines – from the compact City Line through Premium and Aqualife to the tiled basins of the Tiled Line. Many models are suitable for indoor and outdoor use, some according to the manufacturer also for built-in installation. There are also swim spas with a counter-current system and a cold plunge.",
      planung: "Together with you we choose size, number of seats and placement, and plan the base, power supply and cover at the same time.",
      markeLink: "Aquavia Spa: view models",
      ratgeberLink: "Guide: planning a hot tub or swim spa in the garden",
    },
    sauna: {
      title: "Outdoor sauna for garden and home",
      text: "For the garden or terrace, Starpool makes the Nature Sauna: the Nature Sauna personal for the home with either an electric stove or a wood-burning stove with chimney, and the Nature Soft Sauna with mild heat in three sizes. Soleum makes ELLIPSE, an outdoor steam room for the garden, terrace or poolside, delivered ready to connect with its glazing and seating four.",
      planung: "Indoors, we plan saunas, steam rooms and heated loungers from both brands into your wellness room.",
      starpoolLink: "Starpool: view models",
      soleumLink: "Soleum: view models",
      ratgeberLink: "Guide: planning a sauna at home",
    },
    faq: {
      title: "Frequently asked questions about hot tubs and saunas",
      items: [
        {
          q: "Do you deliver and install hot tubs and saunas?",
          a: "Yes, on request in Vorarlberg, Germany, Switzerland and Liechtenstein. Beforehand we check access, the route in and the spot with you; dimensions and weights are in the manufacturer's data for each model. We coordinate delivery and installation with the plumber, electrician and tiler.",
        },
        {
          q: "What location and foundation does a hot tub or outdoor sauna need?",
          a: "A level, load-bearing base with room for maintenance and the cover. A filled hot tub is heavy – according to the manufacturer the Aquavia Spa Serenity weighs 1,687 kg when full. On a terrace, balcony or roof, a structural engineer checks the load capacity. Your municipality tells you whether a notification or permit is required.",
        },
        {
          q: "Who takes care of the electrical connection?",
          a: "The connection is made by a licensed electrical contractor. The voltage a model needs is in the manufacturer's data – the Starpool Nature Sauna personal, for example, is designed for 400 V. We draw the cable route and connection point into the plan and agree them with the electrician.",
        },
        {
          q: "Where can I get advice?",
          a: "In a personal meeting in Lochau or at your home. We discuss the room, models and connections using plans and manufacturer images and show you the area in 3D. {markenSatz}",
        },
      ],
    },
  },
  fr: {
    meta: {
      title: "Spa, sauna & salle de bain au Vorarlberg | Platzhirsch",
      description:
        "Acheter un spa, concevoir un sauna d’extérieur ou une salle de bain : avec Aquavia Spa, Starpool et Soleum, à la main et en 3D, depuis Lochau.",
    },
    title: "Spa, sauna & salle de bain au Vorarlberg",
    whirlpool: {
      title: "Acheter un spa au Vorarlberg",
      text: "Aquavia Spa, fabricant espagnol, propose des spas en plusieurs gammes – de la City Line compacte aux bassins carrelés de la Tiled Line, en passant par Premium et Aqualife. De nombreux modèles conviennent à l’intérieur comme à l’extérieur, certains, selon le fabricant, aussi à l’encastrement. S’y ajoutent des swim spas avec nage à contre-courant et un bassin d’eau froide.",
      planung: "Avec vous, nous choisissons la taille, le nombre de places et l’implantation, et prévoyons d’emblée le support, le raccordement électrique et la couverture.",
      markeLink: "Aquavia Spa : voir les modèles",
      ratgeberLink: "Guide : planifier un spa ou un swim spa au jardin",
    },
    sauna: {
      title: "Sauna d’extérieur pour le jardin et la maison",
      text: "Pour le jardin ou la terrasse, Starpool propose le Nature Sauna : le Nature Sauna personal pour la maison, avec poêle électrique ou poêle à bois et cheminée, et le Nature Soft Sauna à chaleur douce en trois tailles. Soleum fabrique ELLIPSE, un hammam d’extérieur pour le jardin, la terrasse ou le bord de piscine, livré prêt à raccorder avec son vitrage, pour quatre personnes.",
      planung: "À l’intérieur, nous intégrons saunas, hammams et lits chauffants des deux marques à votre espace bien-être.",
      starpoolLink: "Starpool : voir les modèles",
      soleumLink: "Soleum : voir les modèles",
      ratgeberLink: "Guide : planifier un sauna à la maison",
    },
    faq: {
      title: "Questions fréquentes sur le spa et le sauna",
      items: [
        {
          q: "Livrez-vous et installez-vous spas et saunas ?",
          a: "Oui, sur demande au Vorarlberg, en Allemagne, en Suisse et au Liechtenstein. Au préalable, nous vérifions avec vous l’accès, le passage et l’emplacement ; dimensions et poids figurent dans les données du fabricant pour chaque modèle. Nous coordonnons livraison et montage avec le plombier, l’électricien et le carreleur.",
        },
        {
          q: "Quel emplacement et quelle fondation pour un spa ou un sauna d’extérieur ?",
          a: "Un support plan et porteur, avec de la place pour l’entretien et la couverture. Un spa rempli est lourd : selon le fabricant, l’Aquavia Spa Serenity pèse 1 687 kg plein. Sur une terrasse, un balcon ou un toit, un ingénieur structure vérifie la capacité portante. Votre commune vous indique si une déclaration ou une autorisation est nécessaire.",
        },
        {
          q: "Qui se charge du raccordement électrique ?",
          a: "Le raccordement est réalisé par une entreprise d’électricité habilitée. La tension requise figure dans les données du fabricant – le Starpool Nature Sauna personal, par exemple, est conçu pour 400 V. Nous dessinons le tracé des câbles et le point de raccordement dans le plan et les convenons avec l’électricien.",
        },
        {
          q: "Où puis-je obtenir des conseils ?",
          a: "Lors d’un entretien personnel à Lochau ou chez vous. Nous parlons de la pièce, des modèles et des raccordements à l’aide de plans et d’images des fabricants, et vous montrons l’espace en 3D. {markenSatz}",
        },
      ],
    },
  },
  it: {
    meta: {
      title: "Idromassaggio, sauna e bagno in Vorarlberg | Platzhirsch",
      description:
        "Acquistare una vasca idromassaggio, progettare sauna da esterno o bagno: con Aquavia Spa, Starpool e Soleum, a mano e in 3D, da Lochau.",
    },
    title: "Idromassaggio, sauna e bagno in Vorarlberg",
    whirlpool: {
      title: "Acquistare una vasca idromassaggio in Vorarlberg",
      text: "Aquavia Spa, produttore spagnolo, realizza vasche idromassaggio in più linee – dalla compatta City Line, passando per Premium e Aqualife, fino alle vasche piastrellate della Tiled Line. Molti modelli sono adatti a interni ed esterni, alcuni secondo il produttore anche all’incasso. A questi si aggiungono swim spa con nuoto controcorrente e una vasca di acqua fredda.",
      planung: "Insieme a voi scegliamo dimensioni, numero di posti e collocazione, e progettiamo subito anche base, allacciamento elettrico e copertura.",
      markeLink: "Aquavia Spa: vedere i modelli",
      ratgeberLink: "Guida: progettare idromassaggio o swim spa in giardino",
    },
    sauna: {
      title: "Sauna da esterno per giardino e casa",
      text: "Per giardino o terrazza Starpool realizza la Nature Sauna: la Nature Sauna personal per la casa, con stufa elettrica o stufa a legna con camino, e la Nature Soft Sauna dal calore delicato in tre misure. Soleum realizza ELLIPSE, un bagno turco da esterno per giardino, terrazza o bordo piscina, fornito pronto per l’allacciamento con la vetrata, per quattro persone.",
      planung: "All’interno inseriamo saune, bagni turchi e lettini riscaldati di entrambi i marchi nel vostro ambiente benessere.",
      starpoolLink: "Starpool: vedere i modelli",
      soleumLink: "Soleum: vedere i modelli",
      ratgeberLink: "Guida: progettare una sauna in casa",
    },
    faq: {
      title: "Domande frequenti su idromassaggio e sauna",
      items: [
        {
          q: "Consegnate e montate vasche idromassaggio e saune?",
          a: "Sì, su richiesta in Vorarlberg, Germania, Svizzera e Liechtenstein. Prima verifichiamo con voi accesso, percorso di ingresso e posizione; misure e pesi sono nei dati del produttore per ogni modello. Coordiniamo consegna e montaggio con idraulico, elettricista e piastrellista.",
        },
        {
          q: "Quale posizione e quale fondazione servono per un idromassaggio o una sauna da esterno?",
          a: "Una base piana e portante, con spazio per manutenzione e copertura. Una vasca piena è pesante: secondo il produttore l’Aquavia Spa Serenity pesa 1687 kg piena. Su terrazza, balcone o tetto un ingegnere strutturista verifica la portata. Il vostro comune vi dice se serve una comunicazione o un permesso.",
        },
        {
          q: "Chi si occupa dell’allacciamento elettrico?",
          a: "L’allacciamento è eseguito da un’impresa elettrica abilitata. La tensione richiesta è nei dati del produttore – la Starpool Nature Sauna personal, per esempio, è progettata per 400 V. Disegniamo percorso dei cavi e punto di allacciamento nel progetto e li concordiamo con l’elettricista.",
        },
        {
          q: "Dove posso ricevere una consulenza?",
          a: "In un colloquio personale a Lochau o da voi. Parliamo di ambiente, modelli e allacciamenti con piante e immagini dei produttori e vi mostriamo lo spazio in 3D. {markenSatz}",
        },
      ],
    },
  },
};

/** Wert unter "a.b.c" (Punkt-Pfad) oder undefined. */
function pick(obj, key) {
  return String(key)
    .split(".")
    .reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

/** Text der Sprache, sonst Deutsch. */
export function hubText(locale, key) {
  const v = pick(BW_HUB[locale] || BW_HUB.de, key);
  if (v != null && v !== "") return v;
  return pick(BW_HUB.de, key) ?? "";
}
