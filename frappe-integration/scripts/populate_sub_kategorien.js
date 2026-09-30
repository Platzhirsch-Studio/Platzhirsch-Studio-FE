// One-off maintenance script: populates the "Sub Kategorie" doctype with a
// curated subcategory set for every one of the 31 Produkte Kategorie rows
// (the 30 navbar leaf categories + kitchen). Text-only (no image), scoped to
// its parent via the `kategorie` Link field, translated de/en/fr/it.
//
// category_key is prefixed with the parent key ("<parent>--<subtype>") since
// it's the doctype's unique autoname field and several subtypes (round,
// wall-mounted, extendable, ...) repeat across different parent categories.
//
// Run: node --env-file=.env.local frappe-integration/scripts/populate_sub_kategorien.js

const SERVER = process.env.NEW_API_SERVER;
const API_KEY = process.env.NEW_API_KEY;
const API_SECRET = process.env.NEW_API_SECRET;
const DOCTYPE = "Sub Kategorie";

if (!SERVER || !API_KEY || !API_SECRET) {
  console.error("Missing NEW_API_SERVER / NEW_API_KEY / NEW_API_SECRET.");
  process.exit(1);
}

const headers = {
  Authorization: `token ${API_KEY}:${API_SECRET}`,
  "Content-Type": "application/json",
};

// parentCategoryKey -> [ [subtypeKey, de, en, fr, it], ... ]
const SUBCATEGORIES = {
  "sofas-couches": [
    ["2-seater", "2-Sitzer", "2-Seater", "2 places", "2 posti"],
    ["3-seater", "3-Sitzer", "3-Seater", "3 places", "3 posti"],
    ["sectional", "Wohnlandschaft", "Sectional", "Canapé modulable", "Divano componibile"],
    ["xl-large", "XL / Großformat", "XL / Oversized", "XL / Grand format", "XL / Grandi dimensioni"],
  ],
  "corner-sofas": [
    ["left-facing", "Longchair links", "Left-Facing", "Méridienne gauche", "Chaise longue sinistra"],
    ["right-facing", "Longchair rechts", "Right-Facing", "Méridienne droite", "Chaise longue destra"],
    ["u-shaped", "U-Form", "U-Shaped", "En U", "A U"],
  ],
  "sleeper-sofas": [
    ["pull-out", "Ausziehbar", "Pull-Out", "Convertible à tiroir", "Estraibile"],
    ["click-clack", "Click-Clack", "Click-Clack", "Click-Clack", "Click-Clack"],
    ["daybed-convertible", "Bettfunktion Daybed", "Daybed Convertible", "Daybed convertible", "Daybed convertibile"],
  ],
  "chaise-longues-daybeds": [
    ["left-arm", "Armlehne links", "Left Arm", "Accoudoir gauche", "Bracciolo sinistro"],
    ["right-arm", "Armlehne rechts", "Right Arm", "Accoudoir droit", "Bracciolo destro"],
    ["freestanding", "Freistehend", "Freestanding", "Autoportant", "A libera installazione"],
  ],
  "armchairs-stools": [
    ["armchair", "Sessel", "Armchair", "Fauteuil", "Poltrona"],
    ["lounge-chair", "Loungesessel", "Lounge Chair", "Fauteuil lounge", "Poltrona lounge"],
    ["stool", "Hocker", "Stool", "Tabouret", "Sgabello"],
    ["pouf", "Pouf / Ottoman", "Pouf / Ottoman", "Pouf", "Pouf"],
  ],
  "leather-sofas": [
    ["2-seater", "2-Sitzer", "2-Seater", "2 places", "2 posti"],
    ["3-seater", "3-Sitzer", "3-Seater", "3 places", "3 posti"],
    ["corner", "Eckvariante", "Corner", "Angle", "Angolare"],
  ],
  "dining-chairs": [
    ["with-armrests", "Mit Armlehne", "With Armrests", "Avec accoudoirs", "Con braccioli"],
    ["without-armrests", "Ohne Armlehne", "Without Armrests", "Sans accoudoirs", "Senza braccioli"],
    ["upholstered", "Gepolstert", "Upholstered", "Rembourré", "Imbottita"],
    ["wood", "Holz", "Wood", "Bois", "Legno"],
  ],
  "bar-stools": [
    ["fixed-height", "Feste Höhe", "Fixed Height", "Hauteur fixe", "Altezza fissa"],
    ["adjustable-height", "Höhenverstellbar", "Adjustable Height", "Hauteur réglable", "Altezza regolabile"],
    ["with-backrest", "Mit Rückenlehne", "With Backrest", "Avec dossier", "Con schienale"],
    ["without-backrest", "Ohne Rückenlehne", "Without Backrest", "Sans dossier", "Senza schienale"],
  ],
  "desk-chairs": [
    ["fixed", "Starr", "Fixed", "Fixe", "Fisso"],
    ["swivel", "Drehbar", "Swivel", "Pivotant", "Girevole"],
    ["ergonomic", "Ergonomisch", "Ergonomic", "Ergonomique", "Ergonomico"],
  ],
  "dining-tables": [
    ["fixed", "Fest", "Fixed", "Fixe", "Fisso"],
    ["extendable", "Ausziehbar", "Extendable", "Extensible", "Allungabile"],
    ["round", "Rund", "Round", "Rond", "Rotondo"],
    ["rectangular", "Rechteckig", "Rectangular", "Rectangulaire", "Rettangolare"],
  ],
  "coffee-tables": [
    ["round", "Rund", "Round", "Rond", "Rotondo"],
    ["rectangular", "Rechteckig", "Rectangular", "Rectangulaire", "Rettangolare"],
    ["nesting", "Satztische", "Nesting", "Tables gigognes", "Tavolini a incastro"],
    ["height-adjustable", "Höhenverstellbar", "Height-Adjustable", "Hauteur réglable", "Altezza regolabile"],
  ],
  "side-tables": [
    ["round", "Rund", "Round", "Rond", "Rotondo"],
    ["square", "Quadratisch", "Square", "Carré", "Quadrato"],
    ["nesting-set", "Satz-Set", "Nesting Set", "Set gigogne", "Set a incastro"],
  ],
  beds: [
    ["single", "Einzelbett", "Single", "Lit simple", "Letto singolo"],
    ["double", "Doppelbett", "Double", "Lit double", "Letto matrimoniale"],
    ["boxspring", "Boxspringbett", "Box Spring", "Lit boxspring", "Letto boxspring"],
    ["bunk", "Etagenbett", "Bunk Bed", "Lit superposé", "Letto a castello"],
  ],
  "night-tables": [
    ["with-drawer", "Mit Schublade", "With Drawer", "Avec tiroir", "Con cassetto"],
    ["open-shelf", "Offenes Fach", "Open Shelf", "Étagère ouverte", "Mensola aperta"],
    ["wall-mounted", "Wandmontiert", "Wall-Mounted", "Mural", "A parete"],
    ["freestanding", "Freistehend", "Freestanding", "Autoportant", "A libera installazione"],
  ],
  wardrobes: [
    ["sliding-door", "Schiebetür", "Sliding Door", "Porte coulissante", "Anta scorrevole"],
    ["hinged-door", "Drehtür", "Hinged Door", "Porte battante", "Anta a battente"],
    ["walk-in", "Begehbar", "Walk-In", "Dressing", "Cabina armadio"],
    ["corner", "Eckschrank", "Corner", "Angle", "Angolare"],
  ],
  "sideboards-chests": [
    ["sideboard", "Sideboard", "Sideboard", "Buffet", "Madia"],
    ["chest-of-drawers", "Kommode", "Chest of Drawers", "Commode", "Cassettiera"],
    ["highboard", "Highboard", "Highboard", "Highboard", "Highboard"],
    ["buffet", "Buffetschrank", "Buffet", "Bahut", "Credenza"],
  ],
  shelves: [
    ["wall-mounted", "Wandmontiert", "Wall-Mounted", "Mural", "A parete"],
    ["freestanding", "Freistehend", "Freestanding", "Autoportant", "A libera installazione"],
    ["modular", "Modular", "Modular", "Modulable", "Modulare"],
    ["bookshelf", "Bücherregal", "Bookshelf", "Bibliothèque", "Libreria"],
  ],
  "tv-low-units": [
    ["wall-mounted", "Wandmontiert", "Wall-Mounted", "Mural", "A parete"],
    ["freestanding", "Freistehend", "Freestanding", "Autoportant", "A libera installazione"],
    ["with-drawers", "Mit Schubladen", "With Drawers", "Avec tiroirs", "Con cassetti"],
    ["open", "Offen", "Open", "Ouvert", "Aperto"],
  ],
  "display-cabinets": [
    ["glass-front", "Glasfront", "Glass Front", "Façade vitrée", "Fronte in vetro"],
    ["open", "Offen", "Open", "Ouvert", "Aperto"],
    ["corner", "Eckvitrine", "Corner", "Angle", "Angolare"],
    ["wall-mounted", "Wandmontiert", "Wall-Mounted", "Mural", "A parete"],
  ],
  "small-furniture": [
    ["bench", "Bank", "Bench", "Banc", "Panca"],
    ["ottoman", "Pouf", "Ottoman", "Pouf", "Pouf"],
    ["trolley", "Servierwagen", "Trolley", "Chariot", "Carrello"],
    ["stand", "Ständer", "Stand", "Support", "Supporto"],
  ],
  "garden-tables": [
    ["fixed", "Fest", "Fixed", "Fixe", "Fisso"],
    ["extendable", "Ausziehbar", "Extendable", "Extensible", "Allungabile"],
    ["round", "Rund", "Round", "Rond", "Rotondo"],
    ["rectangular", "Rechteckig", "Rectangular", "Rectangulaire", "Rettangolare"],
  ],
  "garden-chairs": [
    ["stackable", "Stapelbar", "Stackable", "Empilable", "Impilabile"],
    ["with-armrests", "Mit Armlehne", "With Armrests", "Avec accoudoirs", "Con braccioli"],
    ["folding", "Klappbar", "Folding", "Pliable", "Pieghevole"],
    ["swivel", "Drehbar", "Swivel", "Pivotant", "Girevole"],
  ],
  "lounge-furniture-daybeds": [
    ["lounge-chair", "Loungesessel", "Lounge Chair", "Fauteuil lounge", "Poltrona lounge"],
    ["lounge-sofa", "Loungesofa", "Lounge Sofa", "Canapé lounge", "Divano lounge"],
    ["daybed", "Daybed", "Daybed", "Daybed", "Daybed"],
    ["modular-set", "Modul-Set", "Modular Set", "Set modulable", "Set modulare"],
  ],
  "sun-loungers": [
    ["adjustable-backrest", "Verstellbare Rückenlehne", "Adjustable Backrest", "Dossier réglable", "Schienale regolabile"],
    ["with-wheels", "Mit Rollen", "With Wheels", "Avec roulettes", "Con ruote"],
    ["stackable", "Stapelbar", "Stackable", "Empilable", "Impilabile"],
    ["double", "Doppelliege", "Double", "Double", "Doppio"],
  ],
  parasols: [
    ["round", "Rund", "Round", "Rond", "Rotondo"],
    ["square", "Quadratisch", "Square", "Carré", "Quadrato"],
    ["cantilever", "Ampelschirm", "Cantilever", "Parasol déporté", "Ombrellone a braccio"],
    ["center-post", "Mittelstockschirm", "Center-Post", "Mât central", "Palo centrale"],
    ["wall-mounted", "Wandschirm", "Wall-Mounted", "Mural", "A parete"],
  ],
  lamps: [
    ["ceiling", "Deckenleuchte", "Ceiling", "Plafonnier", "Lampada da soffitto"],
    ["wall", "Wandleuchte", "Wall", "Applique", "Lampada da parete"],
    ["floor", "Stehleuchte", "Floor", "Lampadaire", "Lampada da terra"],
    ["table", "Tischleuchte", "Table", "Lampe de table", "Lampada da tavolo"],
    ["pendant", "Pendelleuchte", "Pendant", "Suspension", "Lampada a sospensione"],
    ["chandelier", "Kronleuchter", "Chandelier", "Lustre", "Lampadario"],
  ],
  rugs: [
    ["hand-knotted", "Handgeknüpft", "Hand-Knotted", "Noué main", "Annodato a mano"],
    ["machine-made", "Maschinell gefertigt", "Machine-Made", "Fabriqué en machine", "Realizzato a macchina"],
    ["round", "Rund", "Round", "Rond", "Rotondo"],
    ["outdoor", "Outdoor", "Outdoor", "Extérieur", "Outdoor"],
  ],
  decor: [
    ["candles", "Kerzen", "Candles", "Bougies", "Candele"],
    ["cushions", "Kissen", "Cushions", "Coussins", "Cuscini"],
    ["throws", "Decken", "Throws", "Plaids", "Plaid"],
    ["vases", "Vasen", "Vases", "Vases", "Vasi"],
  ],
  mirrors: [
    ["wall-mirror", "Wandspiegel", "Wall Mirror", "Miroir mural", "Specchio da parete"],
    ["floor-mirror", "Standspiegel", "Floor Mirror", "Miroir sur pied", "Specchio da terra"],
    ["round", "Rund", "Round", "Rond", "Rotondo"],
    ["rectangular", "Rechteckig", "Rectangular", "Rectangulaire", "Rettangolare"],
  ],
  "kitchen-accessories": [
    ["utensils", "Küchenutensilien", "Utensils", "Ustensiles", "Utensili"],
    ["storage", "Aufbewahrung", "Storage", "Rangement", "Contenitori"],
    ["organizers", "Organizer", "Organizers", "Organiseurs", "Organizzatori"],
    ["cutting-boards", "Schneidebretter", "Cutting Boards", "Planches à découper", "Taglieri"],
  ],
  kitchen: [
    ["fitted-kitchen", "Einbauküche", "Fitted Kitchen", "Cuisine équipée", "Cucina componibile"],
    ["kitchen-island", "Kochinsel", "Kitchen Island", "Îlot central", "Isola cucina"],
    ["modular", "Modular", "Modular", "Modulable", "Modulare"],
    ["compact", "Kompaktküche", "Compact", "Compacte", "Compatta"],
  ],
};

async function main() {
  let created = 0;
  let failed = 0;

  for (const [parentKey, rows] of Object.entries(SUBCATEGORIES)) {
    for (const [subKey, de, en, fr, it] of rows) {
      const category_key = `${parentKey}--${subKey}`;
      const res = await fetch(`${SERVER}/api/resource/${encodeURIComponent(DOCTYPE)}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          doctype: DOCTYPE,
          category_key,
          kategorie: parentKey,
          name_de: de,
          name_en: en,
          name_fr: fr,
          name_it: it,
        }),
      });
      if (res.ok) {
        created++;
      } else {
        failed++;
        console.error(`FAILED "${category_key}": ${res.status} ${await res.text()}`);
      }
    }
  }

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
