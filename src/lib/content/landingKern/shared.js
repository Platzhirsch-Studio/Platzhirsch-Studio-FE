// src/lib/content/landingKern/shared.js – EN/FR/IT der gemeinsamen Bausteine
// der Landingpages (src/components/Landing/copy.js: PROCESS_NOTE, PLANER,
// PROCESS_STEPS; dazu feste Linktexte aus parts.js und HandBridge).
//
// Mastertext ist das Deutsche in copy.js. Schrittnamen wie /arbeitsweise
// (src/lib/arbeitsweise/copy-intl.js STEPS). Anrede: EN neutral, FR vous,
// IT voi. „ein, zwei Tage“ nur als Bedingung („wenn Ihr Projekt es braucht“).
// Keine Preise, keine Konditionen (auf Anfrage), keine CAD/BIM-Zusage.
// Französische Leerzeichen setzt frenchTypography() beim Laden.
//
// Rein (keine "@/..."-Importe, kein React): node --test lädt es.
import { frenchTypography } from "../../hotel/content-intl.js";

const EN = {
  processNote: {
    eyebrow: "How we work",
    heading: "Drawn by hand, then planned in 3D.",
    text: "We get to know your rooms on site. Harald Menghin draws your concept by hand and builds a model. Then we plan in 3D, and you see your room photorealistically before anything is ordered.",
    vorOrt: "If your project needs it, we also stay on site for a day or two.",
    stepsLabel: "The seven steps",
    link: { href: "/arbeitsweise", label: "How we work: from hand drawing to rendering" },
  },
  steps: ["Getting to know you", "On site", "Hand drawing", "Model", "3D planning", "Rendering", "Realisation"],
  planer: {
    eyebrow: "For architects & planners",
    heading: "We are happy to plan together with you.",
    text: "Are you planning a house, a flat or a commercial project for your client? We add furniture, systems and lighting to your design and coordinate with you, not around you.",
    points: [
      {
        title: "Drawing and model for coordination",
        text: "Harald Menghin draws the interior concept by hand and, if needed, builds a room model. The model makes it quick to settle proportions and routes with your client; the 3D planning follows.",
      },
      {
        title: "Planning data via the product pages",
        text: "On the product pages you request dimensions, data sheets and planning data directly for each piece.",
        link: { href: "/produkte", label: "Go to the products" },
      },
      {
        title: "Samples and materials in the showroom",
        text: "You see fabrics, woods, surfaces and lights in the original in Lochau, gladly together with your client.",
      },
    ],
    contactLabel: "Straight to the studio",
    contactNote: "Terms for commercial projects and planners on request.",
    ctaLabel: "Enquire about working together",
    architektenLink: "Planning data and samples for architects",
  },
  objektHotelLink: "All about hotels & commercial projects",
  handBridge: {
    aria: "From hand drawing to rendering",
    planer: "Start online – Harald Menghin then draws your concept by hand. Only then do we plan in 3D and show you the room photorealistically.",
    feld: "Our process applies here too: we look at the place, Harald Menghin draws the concept by hand, then come 3D planning and rendering.",
    work: "How we work",
  },
  ezarriCredit: "Image: Ezarri, ezarri.com",
  ogFooter: "Drawn by hand, planned in 3D · Showroom & café in Lochau on Lake Constance",
  ogAltSuffix: "Lochau on Lake Constance",
};

const FR = {
  processNote: {
    eyebrow: "Notre méthode",
    heading: "Dessiné à la main, puis planifié en 3D.",
    text: "Nous découvrons vos pièces sur place. Harald Menghin dessine votre concept à la main et construit une maquette. Ensuite, nous planifions en 3D, et vous voyez votre pièce de façon photoréaliste avant toute commande.",
    vorOrt: "Si votre projet le demande, nous restons aussi un ou deux jours sur place.",
    stepsLabel: "Les sept étapes",
    link: { href: "/arbeitsweise", label: "Notre méthode : du dessin à la main au rendu" },
  },
  steps: ["Faire connaissance", "Sur place", "Dessin à la main", "Maquette", "Planification 3D", "Rendu", "Réalisation"],
  planer: {
    eyebrow: "Pour architectes et planificateurs",
    heading: "Nous concevons volontiers avec vous.",
    text: "Vous concevez une maison, un appartement ou un projet professionnel pour votre maître d’ouvrage ? Nous complétons votre plan avec le mobilier, les systèmes et la lumière, et nous nous coordonnons avec vous, jamais sans vous.",
    points: [
      {
        title: "Dessin et maquette pour se coordonner",
        text: "Harald Menghin dessine le concept d’aménagement à la main et construit au besoin une maquette de la pièce. Sur la maquette, proportions et circulations se clarifient rapidement avec le maître d’ouvrage ; la planification 3D suit.",
      },
      {
        title: "Données de plan via les pages produits",
        text: "Sur les pages produits, vous demandez dimensions, fiches techniques et données de plan directement pour chaque pièce.",
        link: { href: "/produkte", label: "Voir les produits" },
      },
      {
        title: "Échantillons et matériaux au showroom",
        text: "Tissus, bois, surfaces et luminaires se découvrent en vrai à Lochau, volontiers avec votre maître d’ouvrage.",
      },
    ],
    contactLabel: "Directement au studio",
    contactNote: "Conditions pour projets professionnels et planificateurs sur demande.",
    ctaLabel: "Proposer une collaboration",
    architektenLink: "Données de plan et échantillons pour architectes",
  },
  objektHotelLink: "Tout sur les hôtels et projets professionnels",
  handBridge: {
    aria: "Du dessin à la main au rendu",
    planer: "Commencez en ligne – Harald Menghin dessine ensuite votre concept à la main. C’est seulement après que nous planifions en 3D et vous montrons la pièce de façon photoréaliste.",
    feld: "Notre méthode s’applique ici aussi : nous découvrons le lieu, Harald Menghin dessine le concept à la main, puis viennent la planification 3D et le rendu.",
    work: "Notre méthode",
  },
  ezarriCredit: "Image : Ezarri, ezarri.com",
  ogFooter: "Dessiné à la main, planifié en 3D · Showroom & café à Lochau, lac de Constance",
  ogAltSuffix: "Lochau, lac de Constance",
};

const IT = {
  processNote: {
    eyebrow: "Il nostro metodo",
    heading: "Disegnato a mano, poi progettato in 3D.",
    text: "Conosciamo i vostri spazi sul posto. Harald Menghin disegna il vostro concept a mano e costruisce un modello. Poi progettiamo in 3D, e vedete il vostro ambiente in modo fotorealistico prima di ordinare qualsiasi cosa.",
    vorOrt: "Se il vostro progetto lo richiede, restiamo sul posto anche uno o due giorni.",
    stepsLabel: "I sette passi",
    link: { href: "/arbeitsweise", label: "Il nostro metodo: dal disegno a mano al rendering" },
  },
  steps: ["Conoscersi", "Sul posto", "Disegno a mano", "Modello", "Progetto 3D", "Rendering", "Realizzazione"],
  planer: {
    eyebrow: "Per architetti e progettisti",
    heading: "Progettiamo volentieri insieme a voi.",
    text: "State progettando una casa, un appartamento o un progetto contract per il vostro committente? Completiamo il vostro progetto con arredi, sistemi e luce e ci coordiniamo con voi, non alle vostre spalle.",
    points: [
      {
        title: "Disegno e modello per coordinarsi",
        text: "Harald Menghin disegna a mano il concept d’arredo e, se serve, costruisce un modello dell’ambiente. Sul modello proporzioni e percorsi si chiariscono rapidamente con il committente; poi segue il progetto 3D.",
      },
      {
        title: "Dati di progetto dalle pagine prodotto",
        text: "Nelle pagine prodotto richiedete misure, schede tecniche e dati di progetto direttamente per ogni pezzo.",
        link: { href: "/produkte", label: "Vai ai prodotti" },
      },
      {
        title: "Campioni e materiali nello showroom",
        text: "Tessuti, legni, superfici e lampade li vedete dal vero a Lochau, volentieri insieme al vostro committente.",
      },
    ],
    contactLabel: "Direttamente in studio",
    contactNote: "Condizioni per progetti contract e progettisti su richiesta.",
    ctaLabel: "Proponete una collaborazione",
    architektenLink: "Dati di progetto e campioni per architetti",
  },
  objektHotelLink: "Tutto su hotel e progetti contract",
  handBridge: {
    aria: "Dal disegno a mano al rendering",
    planer: "Iniziate online – Harald Menghin disegna poi il vostro concept a mano. Solo dopo progettiamo in 3D e vi mostriamo l’ambiente in modo fotorealistico.",
    feld: "Anche qui vale il nostro metodo: vediamo il luogo, Harald Menghin disegna il concept a mano, poi seguono progetto 3D e rendering.",
    work: "Il nostro metodo",
  },
  ezarriCredit: "Immagine: Ezarri, ezarri.com",
  ogFooter: "Disegnato a mano, progettato in 3D · Showroom & caffè a Lochau sul Lago di Costanza",
  ogAltSuffix: "Lochau sul Lago di Costanza",
};

export const SHARED_INTL = Object.freeze({ en: EN, fr: frenchTypography(FR), it: IT });

/** Gemeinsame Texte einer Sprache, null für Deutsch (dort gilt copy.js). */
export function sharedCopy(locale) {
  return SHARED_INTL[locale] || null;
}
