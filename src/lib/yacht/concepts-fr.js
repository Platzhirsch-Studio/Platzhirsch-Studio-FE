// Französische Ebene über dem Yacht-Ansichtsmodell (src/lib/yacht/model.js →
// buildConcepts) für /fr/yacht-interior (01.11.2026). Gleiche Form wie
// concepts-en.js (MODEL, ZONES, CONCEPTS, RENDERS); Produkte, Eignung und
// Regeln bleiben in concepts.json/renders.json (Mastertext Deutsch).
// Produkt-IDs (Schlüssel) sind Herstellernamen und bleiben unverändert.
// Französische Typografie: frenchTypography() beim Laden. Reines Modul.
import { frenchTypography } from "./typography.js";

const MODEL = {
  kiLabel: "Visualisation de concept générée par IA",
  renderLabel: "Visualisation (rendu 3D)",
  badge: "Exemple de concept – pas un projet client",
  eignungShort: {
    "aussen-marine-hersteller": "Extérieur · le fabricant cite le yachting",
    "aussen-katalog": "Extérieur · selon catalogue",
    "innen-lose": "Intérieur · équipement mobile",
  },
  eignungRule: {
    "aussen-marine-hersteller":
      "Le fabricant cite un usage marin ou yachting pour sa marque en général. L’utilisation de ce modèle à bord, sa fixation et son poids sont clarifiés par écrit avec le fabricant et le chantier naval avant le devis.",
    "aussen-katalog":
      "Indiqué pour l’extérieur dans le catalogue. Pour hangar à bateaux, ponton, terrasse sur le lac et terrasse de bateau-maison. À bord uniquement après accord écrit du fabricant.",
    "innen-lose": "Mobilier d’intérieur. Uniquement sous le pont, posé librement, au sec, pas dans les pièces humides. Aucune fixation par Platzhirsch.",
  },
  openZoneException: {
    "In Vitro Unplugged": "Lampe rechargeable mobile à la place d’amarrage – pas pendant la navigation.",
  },
  renderNotes: {
    "segelyacht-nordwind-deck": "Le gréement est simplifié sur l’image.",
  },
};

const ZONES = {
  deck: { label: "Pont et cockpit", short: "Pont", text: "Coussins de cockpit, table, ombrage, mobilier de pont mobile." },
  flybridge: { label: "Flybridge", short: "Flybridge", text: "Bains de soleil, lounge, bar, parasol – le salon à ciel ouvert." },
  salon: { label: "Salon", short: "Salon", text: "Coussins d’assise, housses, rideaux, lampes rechargeables, plaids." },
  kabine: { label: "Cabine", short: "Cabine", text: "Surmatelas de couchette, linge de lit, couvertures, liseuse." },
  bad: { label: "Salle d’eau", short: "Salle d’eau", text: "Serviettes, textiles, rangement – uniquement mobile et résistant à l’humidité." },
  badeplattform: { label: "Plateforme de bain", short: "Plateforme", text: "En sortant de l’eau : serviettes, tapis, coussin de bain de soleil à la poupe." },
  bootshaus: { label: "Ponton et hangar à bateaux", short: "Ponton", text: "À terre, pas à bord : lounge, ombrage, chaleur à la place d’amarrage. Représenté dans le modèle 3D par un ponton à côté du bateau." },
};

const CONCEPTS = {
  "runabout-mahagoni": {
    boatType: "Runabout en bois du lac de Constance",
    length: "8⁠–⁠10 m",
    area: "Lac de Constance",
    title: "Acajou et lin",
    motto: "Une soirée sur le lac où seul le bois brille.",
    mood: "Lumière du soir sur le Pfänder, bois verni, cuir crème, un plaid pour le retour. Classique, calme, sans touches de chrome.",
    palette: [
      ["Acajou verni", "Coque, pont"],
      ["Cuir ivoire", "Coussins"],
      ["Vert lac", "Accent des coussins"],
      ["Laiton brossé", "Ferrures, en simple filet"],
      ["Crépuscule", "Fond, nuit"],
    ],
    materials: [
      ["Acajou verni", "Existant, restauré par le chantier", "Travaux sur le bois uniquement par le chantier ou un charpentier de marine"],
      ["Similicuir nautique ivoire", "Banquette et coussin de bain de soleil", "Réalisé par le sellier nautique ; demander la fiche technique UV et inflammabilité"],
      ["Toile acrylique teinte dans la masse", "Taud, coussins", "Couleur selon le nuancier, fiche technique du fabricant"],
      ["Plaid en cachemire", "Mobile, rangé au sec après la sortie", "Textile d’intérieur"],
    ],
    zones: {
      deck: "Nouveaux coussins d’assise et de dossier en ivoire avec passepoil vert lac ; taud dans le ton du bois.",
      badeplattform: "Coussin de bain de soleil sur le capot moteur (si le bateau le permet), un set de serviettes dans le coffre.",
      bootshaus: "Un lounge sur le ponton pour l’arrivée – le vrai projet de mobilier avec les runabouts.",
    },
    products: {
      Luberon: ["Plaid pour la sortie du soir", "Textile d’intérieur : uniquement mobile, rangé au sec après la sortie"],
      "In Vitro Unplugged": ["Lampe rechargeable pour la soirée à la place d’amarrage", "Mobile, pas pendant la navigation ; vérifier l’indice de protection sur la fiche technique"],
      "JAZZ lounger": ["Bain de soleil sur le ponton", null],
      "Versa UX": ["Ombrage sur le ponton", "Ancrage au sol par une entreprise spécialisée"],
      "Bleau Round Side Table": ["Table d’appoint sur le ponton", null],
    },
    sattler: ["Prise de mesures et fabrication des coussins d’assise et de dossier", "Taud dans le ton du bois"],
    werft: ["Vernissage du bois", "Points de fixation des coussins", "Validation du poids"],
  },
  "daycruiser-seelicht": {
    boatType: "Day cruiser du lac de Constance avec cabine",
    length: "9⁠–⁠12 m",
    area: "Lac de Constance",
    title: "Lumière du lac",
    motto: "Crique de baignade le jour, cabine la nuit – un seul concept de couleurs pour les deux.",
    mood: "Lin clair, teck couleur sable, une touche de vert lac. Lumière de midi sur l’eau, lumière chaude sous le pont le soir.",
    palette: [
      ["Papier", "Coussins, housses"],
      ["Teck naturel", "Pont, table"],
      ["Lin", "Rideaux, coussins"],
      ["Lac", "Accent"],
      ["Encre", "Passepoils, inscriptions"],
    ],
    materials: [
      ["Teck", "Existant dans le cockpit et sur la plateforme de bain", "Entretien par le chantier"],
      ["Tissu d’extérieur clair", "Coussins de cockpit et de bain de soleil", "Réalisé par le sellier, mousse à cellules ouvertes"],
      ["Tissu d’extérieur aspect lin", "Coussins du salon", "Housses amovibles"],
      ["Satin de coton", "Linge de lit de la couchette avant", "Textile d’intérieur"],
    ],
    zones: {
      deck: "Coussins de cockpit clairs avec passepoil foncé, une housse de table, des tables d’appoint mobiles au port.",
      badeplattform: "Set de serviettes, coussin de bain de soleil à la poupe.",
      salon: "Coussins d’assise regarnis, un plaid, une lampe rechargeable sur la table.",
      kabine: "Surmatelas de couchette sur mesure, linge de lit, couverture.",
      bad: "Serviettes et rangement mobile.",
    },
    products: {
      "Bleau Stacking Side Table": ["Table d’appoint dans le cockpit (uniquement au port)", "Empilable ; à ranger pendant la navigation"],
      Wadi: ["Tapis d’extérieur dans le cockpit à la place d’amarrage", "Convenir avec le chantier des propriétés antidérapantes"],
      "Bellhop Unplugged": ["Lampe de table rechargeable", null],
      'Libra "Throw"': ["Plaid", null],
      "Matratzenauflage Riviera": ["Surmatelas sur la couchette", "Forme de la couchette : demander une taille sur mesure au fabricant"],
      "Laken aus Baumwollsatin": ["Linge de lit", null],
      Moltrasio: ["Couverture", null],
    },
    sattler: ["Coussins de cockpit et de bain de soleil", "Regarnissage des coussins du salon", "Matelas de couchette d’après gabarit"],
    werft: ["Entretien du teck", "Fixations", "Électricité (aucun éclairage fixe par Platzhirsch)"],
  },
  "segelyacht-nordwind": {
    boatType: "Voilier",
    length: "12⁠–⁠16 m",
    area: "Lac de Constance et Adriatique",
    title: "Vent du nord",
    motto: "Calme sous le pont, à l’épreuve des intempéries sur le pont – des textiles qui supportent la gîte et l’humidité.",
    mood: "Gris-bleu froid, blanc laine, bois brossé. Nordique et épuré – chaque chose a sa place et rien ne glisse.",
    palette: [
      ["Blanc laine", "Coussins"],
      ["Gris fjord", "Housses"],
      ["Chêne clair", "Boiseries existantes"],
      ["Bleu tempête", "Coussins, taud"],
      ["Pierre", "Rideaux"],
    ],
    materials: [
      ["Tissu d’ameublement nautique gris-bleu", "Banquettes du salon", "Sellier, housses à fermeture éclair"],
      ["Mousse froide avec drainage", "Coussins de cockpit", "Sellier"],
      ["Laine et cachemire", "Plaids mobiles", "Garder au sec"],
      ["Satin de coton", "Cabine arrière", "Textile d’intérieur"],
    ],
    zones: {
      deck: "Coussins de cockpit avec drainage, capote de descente et bimini dans le ton du taud (sellier).",
      salon: "Banquettes regarnies, coussins, rideaux aux hublots, une lampe rechargeable à centre de gravité bas.",
      kabine: "Cabine du propriétaire et cabine invités : surmatelas, linge de lit, couvertures.",
      bad: "Serviettes, rangement, rien de fragile.",
    },
    products: {
      "Bon Jour Unplugged": ["Lampe de table rechargeable (uniquement au port ou au mouillage)", "Fixer ou ranger pendant la navigation"],
      'Andersen "Throw"': ["Plaid", null],
      "Matratzenauflage Seine": ["Surmatelas de couchette", "Demander une taille sur mesure"],
      Snow: ["Linge de lit", null],
      "Region - decor": ["Couverture ou coussin", null],
      "Bleau Stacking Side Table": ["Table d’appoint au mouillage", "Pas sous voile ; à ranger"],
    },
    sattler: ["Coussins de cockpit", "Housses du salon", "Capote de descente, bimini, taud"],
    werft: ["Gréement et accastillage", "Fixations", "Électricité"],
  },
  "motoryacht-riviera": {
    boatType: "Yacht à moteur en Méditerranée",
    length: "20⁠–⁠30 m",
    area: "Adriatique / Méditerranée",
    title: "Soir sur la Riviera",
    motto: "Le flybridge comme terrasse, le salon comme séjour – comme chez soi au bord du lac, mais au bord de la mer.",
    mood: "Sable, terre cuite et tabac. Des lounges d’extérieur moelleux en haut, l’art de vivre italien dans le salon, du satin de coton dans la cabine du propriétaire.",
    palette: [
      ["Sable", "Coussins du lounge"],
      ["Terre cuite", "Coussins, accent du tapis"],
      ["Tabac", "Bois, cuir"],
      ["Noyer", "Mobilier du salon"],
      ["Papier", "Linge de lit, couvertures"],
    ],
    materials: [
      ["Tressage et tissu d’extérieur", "Lounge du flybridge", "Confirmer avec le fabricant l’usage à bord pour chaque modèle"],
      ["Teck", "Pont arrière (existant)", "Chantier"],
      ["Tissus d’ameublement, bouclette, cuir", "Salon", "Uniquement à l’intérieur ; mobilier mobile une fois poids et fixation validés par le chantier"],
      ["Satin de coton, cachemire", "Cabine du propriétaire", "Textile d’intérieur"],
    ],
    zones: {
      flybridge: "Canapé lounge, table à manger et bains de soleil issus de collections d’extérieur ; ombrage uniquement en accord avec le chantier.",
      deck: "Pont arrière : table à manger avec chaises, tapis, lampes rechargeables.",
      salon: "Canapé, table basse, tapis et plaids de la collection intérieure – mobiles, fixés par le chantier.",
      kabine: "Cabine du propriétaire avec linge de lit, couvertures, surmatelas.",
      bad: "Serviettes et textiles.",
      badeplattform: "Bains de soleil et serviettes pour le moment beach club à la poupe.",
    },
    products: {
      "Portofino Outdoor Sofa": ["Canapé lounge", null],
      "Portofino Outdoor Table": ["Table à manger", null],
      Baia: ["Bain de soleil", null],
      "Bleau Barstool": ["Tabouret au bar du flybridge", null],
      Asira: ["Tapis d’extérieur sur le pont arrière", "Convenir avec le chantier des propriétés antidérapantes"],
      "In Vitro Unplugged": ["Lampe rechargeable pour la soirée", null],
      "Bleau Double Sun Lounge": ["Bain de soleil double à la poupe", null],
      "Lido (Sofas)": ["Assise dans le salon – collection Lido, canapé ou fauteuil", "Poids et fixation par le chantier"],
      "Libra Coffee Table": ["Table basse", "Fixée par le chantier"],
      Wisp: ["Tapis", "Propriétés antidérapantes"],
      Cachemire: ["Plaid", null],
      'Freeman "Duvet"': ["Couette pour la cabine du propriétaire", null],
      "Laken aus Baumwollsatin": ["Linge de lit", null],
      "Matratzenauflage Riviera": ["Surmatelas", "Demander une taille sur mesure"],
    },
    sattler: ["Coussins de bain de soleil sur le pont avant", "Housses des assises fixes", "Biminis et taud"],
    werft: ["Validation du poids et de la stabilité", "Fixation du mobilier sur le pont et dans le salon", "Fixation du parasol et du bimini", "Électricité, éclairage fixe"],
  },
  "bootshaus-ufer": {
    boatType: "Bateau-maison et hangar à bateaux",
    length: "Hangar à bateaux avec ponton, bateau-maison comme habitat flottant",
    area: "Rive du lac de Constance",
    title: "Sur la rive",
    motto: "Là où dort le bateau, la soirée commence : lounge, chaleur et lumière au bord de l’eau.",
    mood: "Bois, pierre, lumière sur l’eau. De larges lounges, une grande table, de la chaleur pour les longues soirées de septembre.",
    palette: [
      ["Mélèze patiné", "Façade, ponton"],
      ["Pierre", "Coussins"],
      ["Teck", "Table"],
      ["Lac", "Coussins, accent"],
      ["Encre profonde", "Acier, nuit"],
    ],
    materials: [
      ["Teck et aluminium", "Table, bains de soleil", "Extérieur selon catalogue"],
      ["Tissu d’extérieur", "Coussins du lounge", "Housses amovibles ; ranger au sec en hiver"],
      ["Tressage", "Baldaquin, fauteuils", "Extérieur selon catalogue"],
      ["Chêne, peau de mouton", "Intérieur du bateau-maison", "Mobilier d’intérieur, uniquement à l’intérieur"],
    ],
    zones: {
      deck: "Ponton et terrasse : lounge, table à manger, parasol, chauffage.",
      salon: "Intérieur du bateau-maison : table à manger, fauteuils, tapis, lampes rechargeables.",
      kabine: "Un coin nuit comme dans un petit appartement.",
      badeplattform: "Marches vers l’eau : bain de soleil, serviettes, une lampe.",
    },
    products: {
      "PLATEAU Arrangement A1": ["Groupe lounge sur la terrasse", null],
      "CHARLIE Teak Dining Table": ["Table à manger au bord de l’eau", null],
      Ketch: ["Élément lounge", null],
      "Belvedere Canopy": ["Bain de soleil à baldaquin", null],
      "Eclipsum UX": ["Parasol", "Ancrage par une entreprise spécialisée"],
      "Dome Pendant": ["Chauffage", "Raccordement électrique par un électricien"],
      "IC F1 Outdoor H 1350 mm": ["Lampadaire d’extérieur", "Raccordement par un électricien"],
      "FOXX Lounger": ["Bain de soleil au bord de l’eau", null],
      "Arc Dining Table, Ø120 - Coffee Black Oak": ["Table à manger du bateau-maison", null],
      "Toe Armchair, Flat - Sheepskin": ["Fauteuil", null],
      "Tatou Floor": ["Lampadaire", "Uniquement à l’intérieur, raccordement secteur"],
    },
    sattler: ["Coussins pour les banquettes fixes du hangar à bateaux (si souhaité)"],
    werft: ["Bateau-maison : structure, électricité et gaz uniquement par le chantier ou une entreprise spécialisée"],
    gartenbau: ["Conception du jardin et exécution par des entreprises habilitées ; Platzhirsch coordonne les dates"],
  },
};

const RENDERS = {
  "runabout-mahagoni-deck": [
    "Acajou et lin – cockpit",
    "Cockpit d’un runabout classique en acajou avec une banquette ivoire matelassée dans la longueur et passepoil foncé, un volant en bois et un plancher en teck, derrière un lac calme dans la lumière du soir",
  ],
  "runabout-mahagoni-steg": [
    "Acajou et lin – ponton",
    "Bain de soleil en bois avec coussin crème et parasol en tissu couleur sable sur un ponton en bois, lac calme et rive boisée dans une chaude lumière du soir",
  ],
  "daycruiser-seelicht-cockpit": [
    "Lumière du lac – cockpit",
    "Cockpit couvert d’un day cruiser avec un canapé d’angle blanc sur socle en bois, deux fauteuils blancs, des coussins à carreaux vert pétrole, une table en bois et un tapis clair, au-delà le lac avec une petite ville et son clocher sous un ciel couvert",
  ],
  "daycruiser-seelicht-kabine": [
    "Lumière du lac – cabine",
    "Cabine d’un day cruiser avec un lit double en linge blanc, un chemin de lit gris-vert, un coussin à carreaux vert pétrole et une tête de lit capitonnée foncée devant une paroi en chêne clair, deux lampes de chevet, un étroit bandeau de fenêtres et un tapis clair sur un plancher en bois dans la lumière du soir",
  ],
  "daycruiser-seelicht-salon": [
    "Lumière du lac – salon",
    "Salon d’un day cruiser avec un canapé blanc sur socle en bois clair, des coussins à carreaux vert pétrole, deux fauteuils blancs sur piètement en inox, une table basse ronde claire et un tapis blanc, un large bandeau de fenêtres donnant sur le lac et une paroi en chêne clair à droite à la lumière du jour",
  ],
  "segelyacht-nordwind-salon": [
    "Vent du nord – salon",
    "Salon d’un voilier avec une banquette en U gris-bleu, des coussins blanc laine et une table à manger en bois clair, lumière par les hublots de coque et de pont",
  ],
  "segelyacht-nordwind-deck": [
    "Vent du nord – sur le pont",
    "Pont d’un voilier au coucher du soleil avec pont en teck, coussins bleu pétrole et clairs devant le mât, une baie calme en arrière-plan",
  ],
  "motoryacht-riviera-flybridge": [
    "Soir sur la Riviera – flybridge",
    "Lounge couvert sur le flybridge d’un yacht à moteur avec un canapé d’angle blanc crème, deux fauteuils sur piètement en bois foncé, des coussins à carreaux terre cuite, une table en bois et un tapis terre cuite, au-delà un lac calme et des collines dans la lumière brumeuse du soir",
  ],
  "motoryacht-riviera-salon": [
    "Soir sur la Riviera – salon",
    "Salon d’un yacht à moteur avec un canapé blanc crème sur socle foncé, des coussins à carreaux terre cuite, deux fauteuils sur piètement en inox, une table basse ronde et un tapis rose terre cuite, un long bandeau de fenêtres donnant sur le quai et des boiseries foncées à droite dans la lumière du soir",
  ],
  "motoryacht-riviera-kabine": [
    "Soir sur la Riviera – cabine du propriétaire",
    "Cabine du propriétaire d’un yacht à moteur avec un lit double en linge blanc sur un sommier foncé, un chemin de lit et un coussin terre cuite, une tête de lit capitonnée devant une paroi en bois foncé, deux lampes de chevet et un étroit bandeau de fenêtres, un tapis clair sur un plancher brun-rouge",
  ],
  "bootshaus-ufer-terrasse": [
    "Sur la rive – terrasse",
    "Hangar à bateaux moderne en bois sur un lac de montagne au crépuscule, une terrasse avec un lounge bas gris pierre, une lumière chaude dans l’intérieur ouvert, des sommets enneigés sur la rive opposée",
  ],
  "bootshaus-ufer-wohnraum": [
    "Sur la rive – séjour",
    "Séjour d’un bateau-maison avec un canapé gris, deux fauteuils recouverts de peaux de mouton et une table d’appoint ronde, des baies vitrées toute hauteur donnant sur un lac lisse comme un miroir",
  ],
};

/** Französische Ebene (gleiche Form wie die englische in concepts-en.js). */
export const LAYER_FR = Object.freeze(
  frenchTypography({ model: MODEL, zones: ZONES, concepts: CONCEPTS, renders: RENDERS })
);
