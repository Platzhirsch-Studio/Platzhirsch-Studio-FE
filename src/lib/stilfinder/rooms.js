// src/lib/stilfinder/rooms.js
// Which catalogue products the PDF shows per room.
//
// 1. CURATOR_PICKS (QA Runde 1, P1.4 e): per profile and room a hand-picked
//    start list (backoffice docnames, `name`), checked against palette and
//    image on 27.10.2026. They win over the algorithm as long as the product
//    is active in the catalogue.
// 2. ROOM_SLOTS: every slot is "<Marke>|<kategorie>,<kategorie>" (Frappe
//    doctype "Produkte New": `marken`, `kategories`). Slots fill the rest in
//    order, one product each; later slots are fallbacks. Seeded (mulberry32),
//    so one answer code gives one PDF.
// Rules (P1.4 a/d): the first piece of a room (the room hero) is always a
// main piece (HERO_CATEGORIES); accessories never lead and appear at most once
// per room; pure filler (chopstick holders, lazy susans, umbrella bases …) is
// never chosen; no product appears twice in the document.
// Products are always read live from the backoffice – nothing here is a
// product claim, only a selection rule. Plain module, no imports.

export const PER_ROOM = 4;
/** Key of the spare lamp candidates in roomCandidates() (not a room). */
export const LIGHT_KEY = "licht";
// Candidates per room beyond PER_ROOM: replacements when an image is missing
// or fails the image/colour check (build.js).
export const ALTERNATES = 12;

export const HERO_CATEGORIES = {
  wohnen: ["sofas-couches", "lounge-furniture-daybeds"],
  essen: ["dining-tables"],
  kueche: ["kitchen"],
  schlafen: ["beds"],
  outdoor: ["lounge-furniture-daybeds", "sofas-couches", "garden-tables"],
};

export const ACCESSORY_CATEGORIES = ["kitchen-accessories", "accessories", "decor", "candles", "bedwear"];
// Small things that are not furniture at all: never in the PDF. QA Runde 2,
// P1.1 b: bed feet, legs, glides and mattresses (Tréca lists them as "beds")
// are parts, not pieces – their pictures show a whole bed, the link a foot.
export const FILLER_NAME = /chopstick|lazy susan|candle ?holder|\bholders?\b|umbrosa bases|parasol base|schirmfu|coaster|untersetzer|ceiling plate|\bkabel\b|ersatz|spare part|füße|fuesse|\bfeet\b|\blegs?\b|\bbeine?\b|gleiter|kufen|matratz|mattress|topper/i;

// QA Runde 2, P1.1 c: a room hero must also be NAMED like the hero category
// (a "beds" row may be a headboard, a foot or a mattress). Many beds carry
// only a model name ("Curtis", "Jacqueline"), so the rule is: a name that
// says "part" (HERO_NAME_DENY) is never a hero unless it also says "bed"
// (HERO_NAME). Rooms without an entry only check the category.
export const HERO_NAME = {
  schlafen: /bett|\bbed\b|bed frame|bed set|kopfteil|headboard|liegesystem/i,
};
export const HERO_NAME_DENY = {
  // QA Runde 3, P2.3: the dining hero seats at least four – no bistro, bar,
  // side or square tables (Declan Square is a two-person bistro table). The
  // catalogue has no width field, so the name decides.
  essen: /bistro|\bbar\b|counter|\bside\b|square|\bø\s?[4-9]\d\b|\b(?:60|70|80|90)\s?(?:x|cm)/i,
  schlafen: /füße|fuesse|\bfeet\b|\blegs?\b|\bbeine?\b|matratz|mattress|topper|auflage|kissen|pillow|duvet|decke|plaid|gleiter|kufen/i,
};

// QA Runde 2, P2.4 b: the kitchen selection only from kitchen pieces.
// Feinschliff P3.2: no kitchen accessories (BUTLER Tray as "Küchenstück")
// and no dining or bistro tables (Jean Table, Declan Square) in the kitchen;
// the bedroom only takes bedroom pieces (no lounge chair, no side table).
// Better two large frames than one piece from another room.
export const ROOM_ALLOWED = {
  kueche: ["kitchen", "bar-stools", "lamps"],
  schlafen: ["beds", "night-tables", "wardrobes", "mirrors", "textiles", "bedwear", "lamps"],
};
// Feinschliff P3.2: trays are tableware, never a room piece (any room).
export const TRAY_NAME = /\btrays?\b|tablett|serving board|servierbrett/i;

// QA Runde 2, P2.4 a: style breaks per profile (rattan dining table and teak
// in the Parisian salon …). Matched against brand + name.
export const PROFILE_EXCLUDE = {
  salon: /rattan|wicker|geflecht|\bteak\b|\brope\b|seil|tiago|somerly|colony|rowlan/i,
  klar: /rattan|wicker|geflecht|\bteak\b|\brope\b|seil/i,
};

const nameOf = (p) => `${p?.produkt_name || ""} ${p?.name || ""}`;

/** Room hero rule: hero category AND (where defined) a hero name. */
export function isHeroFor(room, category, name) {
  if (!(HERO_CATEGORIES[room] || []).includes(category)) return false;
  const n = String(name || "");
  if (HERO_NAME[room]?.test(n)) return true;
  return !HERO_NAME_DENY[room]?.test(n);
}

// QA Runde 2, P1.2: one piece per family and document. "Nightstand
// Nottingham Left/Right", "Drop Chandelier - Brass (5m)" / "Drop Chandelier,
// Mini - Bronze (5m)" and "Komfy 2/3 seater sofa" are one family each.
const FAMILY_DROP = [
  /\([^)]*\)/g, // (…)
  /\b\d+(?:[.,]\d+)?\s?(?:cm|mm|m)\b/g, // sizes
  /ø\s?\d+\S*/g,
  /\b\d+\s?x\s?\d+\b/g,
  /\b\d+[\s-]?(?:seater|sitzer)\b/g,
  /\b(?:left|right|links|rechts|mini|small|medium|large|xl|xs|s|m|l|set of \d+)\b/g,
  /\b(?:brass|bronze|white|black|natural|nature|grey|gray|gold|silver|nickel|chrome|beige|sand|anthracite|oak|walnut|teak|messing|weiß|schwarz)\b/g,
];
// Type words around the model name ("Sofa Bleecker" / "Chair Bleecker",
// "Westside Sofa" / "Westside Soft", "Koki" / "Koki Wire - Outdoor"): the
// family is the first word that is not a type word.
const TYPE_WORDS = new Set(
  (
    "sofa sofas soft couch chair chairs armchair lounge lounger daybed table tables dining side coffee bar counter stool stools hocker " +
    "lamp lampe pendant suspension chandelier ceiling floor wall mirror spiegel nightstand nachttisch kopfteil bett bed frame set " +
    "outdoor indoor home living wire globe round square rectangular rect high low the with incl and of seat back cushion sun double " +
    "liegesystem cabinet console sideboard shelf shelves desk bench bank stacking modular arrangement system wardrobe schrank " +
    "bedspread plaid rug teppich vase parasol umbrella wood no"
  ).split(" "),
);
export function familyKey(brand, name) {
  let n = String(name || "").toLowerCase();
  n = n.split(/,| - | – /)[0];
  for (const re of FAMILY_DROP) n = n.replace(re, " ");
  n = n.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const words = n.split(" ");
  const i = words.findIndex((w) => w.length > 2 && !/^\d+$/.test(w) && !TYPE_WORDS.has(w));
  // a number right after the model word belongs to it ("Taraxacum 88")
  const model = i < 0 ? n : /^\d+$/.test(words[i + 1] || "") ? `${words[i]} ${words[i + 1]}` : words[i];
  return `${String(brand || "")
    .toLowerCase()
    .trim()}|${model}`;
}

// Catalogue entries whose first picture is a campaign photo without the
// product (QA Runde 1, P1.4: "Soft Stone Sofa" shows a man on rocks,
// "Corker" a house). Re-check when the backoffice pictures change.
export const CAMPAIGN_ONLY = /^(soft stone sofa|corker)/i;

// QA Runde 3, P2.3: the visible part of a room shows at most one piece per
// category (the hero counts) and at most two pieces per brand.
export const MAX_PER_BRAND = 2;
// Order of the bedroom: bed → night table → lamp/mirror → wardrobe.
export const ROOM_SEQUENCE = {
  schlafen: ["beds", "night-tables", "lamps", "mirrors", "bedwear", "side-tables", "armchairs-stools", "wardrobes"],
};
// Small pieces photographed in a room scene fill only a corner of the
// picture (Cypris Mirror: a blue armchair and a tree stump): as a selection
// picture only cut-outs.
export const SMALL_IN_SCENE = ["mirrors", "decor", "candles", "kitchen-accessories", "bedwear"];

export const isAccessory = (category) => ACCESSORY_CATEGORIES.includes(String(category || "").toLowerCase());

export const ROOM_SLOTS = {
  ruhe: {
    wohnen: ["Minotti|sofas-couches", "Minotti|armchairs-stools", "Poliform|coffee-tables", "Flos|lamps", "Paola Lenti|rugs", "Rimadesio|side-tables,coffee-tables"],
    essen: ["Minotti|dining-tables", "Minotti|dining-chairs", "Poliform|dining-chairs", "Flos|lamps", "Poliform|dining-tables", "Rimadesio|sideboards-chests"],
    kueche: ["Poliform|kitchen", "ClassiCon|bar-stools", "Flos|lamps"],
    schlafen: ["Minotti|beds", "Minotti|night-tables", "Flos|lamps", "Poliform|wardrobes", "Rimadesio|wardrobes", "Rimadesio|mirrors"],
    outdoor: ["Paola Lenti|lounge-furniture-daybeds", "Paola Lenti|garden-tables", "Umbrosa|parasols", "Tuuci|sun-loungers", "Solpuri|garden-chairs", "Paola Lenti|sun-loungers"],
  },
  warm: {
    wohnen: ["ClassiCon|sofas-couches", "ClassiCon|armchairs-stools", "101 Copenhagen|side-tables", "101 Copenhagen|lamps", "Desalto|coffee-tables", "Flos|lamps"],
    essen: ["Desalto|dining-tables", "101 Copenhagen|dining-chairs", "Flos|lamps", "ClassiCon|dining-chairs", "101 Copenhagen|dining-tables", "Desalto|dining-chairs"],
    kueche: ["Poliform|kitchen", "ClassiCon|bar-stools", "Flos|lamps", "101 Copenhagen|lamps"],
    schlafen: ["Treca|beds", "ClassiCon|mirrors", "101 Copenhagen|lamps", "Treca|night-tables", "Treca|bedwear"],
    outdoor: ["Solpuri|garden-tables", "Solpuri|garden-chairs", "Desalto|garden-chairs", "Tuuci|sun-loungers", "Desalto|garden-tables", "Umbrosa|parasols"],
  },
  see: {
    wohnen: ["Paola Lenti|sofas-couches", "Paola Lenti|rugs", "Desalto|coffee-tables", "Flos|lamps", "Desalto|side-tables", "101 Copenhagen|armchairs-stools"],
    essen: ["Paola Lenti|dining-tables", "Paola Lenti|dining-chairs", "Flos|lamps", "Desalto|small-furniture", "Desalto|dining-chairs", "101 Copenhagen|decor"],
    kueche: ["Poliform|kitchen", "ClassiCon|bar-stools", "Flos|lamps"],
    schlafen: ["Paola Lenti|beds", "Treca|beds", "Treca|night-tables", "Flos|lamps", "Alonpi|bedwear"],
    outdoor: ["Solpuri|lounge-furniture-daybeds", "Tuuci|sun-loungers", "Sifas|garden-tables", "Umbrosa|parasols", "Tuuci|garden-chairs", "Sifas|lounge-furniture-daybeds"],
  },
  salon: {
    wohnen: ["Eichholtz|sofas-couches", "Eichholtz|armchairs-stools", "ClassiCon|coffee-tables", "Flos|lamps", "ClassiCon|mirrors", "Eichholtz|coffee-tables"],
    essen: ["Eichholtz|dining-tables", "Eichholtz|dining-chairs", "Flos|lamps", "Minotti|sideboards-chests", "101 Copenhagen|lamps", "Eichholtz|lamps"],
    kueche: ["Poliform|kitchen", "Eichholtz|bar-stools", "Flos|lamps", "Eichholtz|lamps"],
    schlafen: ["Treca|beds", "Eichholtz|night-tables", "Eichholtz|mirrors", "Flos|lamps", "Alonpi|bedwear", "Eichholtz|lamps"],
    outdoor: ["Sifas|lounge-furniture-daybeds", "Umbrosa|parasols", "Paola Lenti|garden-tables", "Sifas|garden-chairs", "Paola Lenti|lounge-furniture-daybeds", "Sifas|garden-tables"],
  },
  klar: {
    wohnen: ["Poliform|sofas-couches", "Rimadesio|shelves", "Flos|lamps", "Desalto|coffee-tables", "ClassiCon|side-tables", "Rimadesio|tv-low-units,sideboards-chests"],
    // Abnahme Runde 3, Restliste 2: Flos lamps are thin lines on white (< 8 %),
    // so the dining room also draws on sideboards and small furniture
    essen: ["Rimadesio|dining-tables", "Desalto|dining-chairs", "Flos|lamps", "Rimadesio|dining-chairs", "Desalto|dining-tables", "Rimadesio|sideboards-chests,display-cabinets", "Desalto|small-furniture"],
    kueche: ["Poliform|kitchen", "ClassiCon|bar-stools", "Flos|lamps"],
    schlafen: ["Poliform|beds", "Rimadesio|night-tables", "Flos|lamps", "Rimadesio|mirrors", "Rimadesio|wardrobes", "Poliform|wardrobes"],
    outdoor: ["Desalto|garden-tables", "Desalto|garden-chairs", "Tuuci|sun-loungers", "Umbrosa|parasols", "Tuuci|garden-chairs"],
  },
};

// Hand-picked start lists (docnames). Checked visually against the profile
// palette; order = order in the PDF (first = room hero).
export const CURATOR_PICKS = {
  ruhe: {
    wohnen: ["Connery", "Angie", "Lisière"],
    essen: ["Linha Fina", 'Leslie "Dining"'],
    // QA Runde 3, P2.6: one kitchen hero per profile, Phoenix only here
    kueche: ["Phoenix"],
    schlafen: ["Curtis", 'Lou "Nightstand"'],
    outdoor: ["Frame Outdoor Sofa", "Filo", "Portofino Outdoor Table"],
  },
  warm: {
    wohnen: ["Lota Sofa", "Munich Lounge Chair"],
    essen: ["Arc Dining Table, L250 - H35mm - Coffee Black Oak", "Brutus Dining Chair - Natural Oak", "Clay Wood"],
    kueche: ["Harp", "Bar Stool No. 2"],
    // QA Runde 2, P1.1 a: a real bed (olive headboard, checked on the contact sheet)
    // QA Runde 3, P2.3: Cypris Mirror dropped (the mirror is tiny in its scene)
    schlafen: ["Kopfteil Chloé", "Drop Chandelier - Brass (5m)"],
    outdoor: ["CHARLIE Teak Dining Table", "BASKET Dining Chair incl. Seat Back Cushion"],
  },
  see: {
    wohnen: ["All-Time", "Lisière", "Elsie Armchair", "Kanji Side Table"],
    essen: ["Kanji Table", "Charlotte", "Mia"],
    kueche: ["Artex Pro"],
    schlafen: ["Bett Adonis", "Nachttisch Joséphine"],
    outdoor: ["BOXX Arrangement C", "Bleau Sand Sun Lounge", "Coco Dining table", "Hips Side table Ø45cm"],
  },
  salon: {
    wohnen: ["Sofa Bleecker", "Chair Elisha"],
    // QA Runde 3, P2.3: a long marble table instead of the bistro table Declan
    essen: ["Dining Table Bodega Rectangular", "Dining Chair Aiden"],
    // QA Runde 2, P2.4 b/c: dark indoor kitchen (not the outdoor kitchen), no console
    // QA Runde 3, P2.6: dark marble kitchen instead of the light Phoenix
    kueche: ["Alea Pro", "Bar Stool Dorland"],
    // P1.1 a: bordeaux velvet bed instead of a bed foot
    schlafen: ["Kopfteil Club Prestige", "Nightstand Nottingham Left", "Mirror Aldrin"],
    // P2.4 a: wrought iron instead of teak
    outdoor: ["Kross 3 seater sofa", "Kalife Daybed with curtains"],
  },
  klar: {
    // Rialto (sideboard) would block its family sibling Rialto Comodini
    wohnen: ["Westside Sofa", "Abacus living"],
    essen: ["Flat", "Calum - Home"],
    kueche: ["Twelve", "Triton Bar Stool"],
    schlafen: ["Jacqueline", "Rialto (Rialto Comodini)", "Senzafine Wardrobe"],
    outdoor: ["Mac - Outdoor", "Koki Wire - Outdoor", "Bleau Sun Lounge"],
  },
};

// Lamp for the light page per profile (docname), before the seeded spares.
// Feinschliff P3.1: the lamp matches the light text of the profile
// (content.js `light`): Warme Moderne speaks of soft pendants over the
// table → Taraxacum; Klare Linie of linear lights → Belt. A pick is reserved
// for the light page, so no room takes it first.
export const LIGHT_PICKS = {
  salon: ["Chandelier Maranello"],
  warm: ["Taraxacum 88 Suspension 1"],
  klar: ["Belt Fabric Copper Brown Casambi 2000mm"],
};
// Spare lamps (and the curate.js fallback) prefer lamps whose name fits the
// light text; without a match any fitting lamp stays allowed.
export const LIGHT_MATCH = {
  warm: /taraxacum|opal|fabric|stoff|suspension|pendant|pendel|glo-?ball|skygarden/i,
  klar: /\bbelt\b|linear|\bline\b|strip|\baim\b|infra-?structure|tight light|arrangements/i,
  salon: /chandelier|kronleuchter|maranello|crystal|kristall|brass|messing/i,
};
/** Does a lamp (row or item) fit the light text of the profile? */
export const lightFits = (profileKey, p) => !LIGHT_MATCH[profileKey] || LIGHT_MATCH[profileKey].test(`${p?.produkt_name || ""} ${p?.name || ""}`);

/** All brands one profile needs (fetch once per brand). */
export function brandsFor(profileKey) {
  const set = new Set();
  for (const slots of Object.values(ROOM_SLOTS[profileKey] || {})) for (const s of slots) set.add(s.split("|")[0]);
  return [...set];
}

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(str) {
  let h = 2166136261;
  for (const ch of String(str)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const usable = (p) => p?.status === "Aktiv" && p.path_field && p.kategories && p.bild_anhangen?.[0]?.bild_anhangen && !FILLER_NAME.test(nameOf(p)) && !CAMPAIGN_ONLY.test(String(p.produkt_name || p.name || "").trim());

/** usable() plus the profile's style exclusions and the room's allowed categories. */
export function fitsRoom(p, profileKey, room) {
  if (!usable(p)) return false;
  const ex = PROFILE_EXCLUDE[profileKey];
  if (ex && ex.test(`${p.marken || ""} ${nameOf(p)}`)) return false;
  // QA Runde 3: an outdoor lamp (Captain Flint Outdoor, Mayday Outdoor) has
  // no place in the kitchen or on the light page. Abnahme Runde 3, P3.5: nor
  // the portable lantern In Vitro Unplugged (a red outdoor lantern on the
  // light page of Warme Moderne) and the In Vitro family (Flos outdoor lanterns)
  if (room !== "outdoor" && p.kategories === "lamps" && /outdoor|garden|bollard|unplugged|in vitro/i.test(nameOf(p))) return false;
  if (p.kategories === "kitchen-accessories" || TRAY_NAME.test(nameOf(p))) return false;
  const allowed = ROOM_ALLOWED[room];
  return !allowed || allowed.includes(p.kategories);
}

/**
 * roomCandidates(profileKey, productsByBrand, seed) →
 *   { wohnen: [row, …], … }   ordered candidates per room: the first PER_ROOM
 *   are the selection, up to ALTERNATES more are replacements.
 * Rules: index 0 is a hero category, max. one accessory among the first
 * PER_ROOM, no product in two rooms.
 */
export function roomCandidates(profileKey, productsByBrand, seed = 1) {
  const rand = rng(seed);
  const used = new Set();
  const families = new Set();
  const byName = new Map();
  for (const rows of Object.values(productsByBrand || {})) for (const p of rows || []) if (usable(p)) byName.set(p.name, p);
  const fam = (p) => familyKey(p.marken, p.produkt_name || p.name);
  // the families of all curator picks are reserved for them, so an earlier
  // room's slot cannot take a sibling (e.g. a Drop Chandelier in another
  // colour) and push the hand-picked piece out
  const pickNames = new Set([...Object.values(CURATOR_PICKS[profileKey] || {}).flat(), ...(LIGHT_PICKS[profileKey] || [])]);
  const reserved = new Set(
    [...pickNames]
      .map((n) => byName.get(n))
      .filter(Boolean)
      .map(fam),
  );
  const free = (p) => !used.has(p.name) && !families.has(fam(p)) && (pickNames.has(p.name) || !reserved.has(fam(p)));
  const out = {};
  for (const [room, slots] of Object.entries(ROOM_SLOTS[profileKey] || {})) {
    const list = [];
    const roomPicks = new Set(CURATOR_PICKS[profileKey]?.[room] || []);
    const take = (p) => {
      used.add(p.name);
      families.add(fam(p));
      list.push(p);
    };
    // curator picks first (only usable, fitting, not used yet – also no family twice)
    for (const name of CURATOR_PICKS[profileKey]?.[room] || []) {
      const p = byName.get(name);
      if (p && fitsRoom(p, profileKey, room) && free(p)) take(p);
    }
    // slot pools, each slot one product per round (round robin = variety)
    const pools = slots.map((slot) => {
      const [brand, cats] = slot.split("|");
      const allowed = cats.split(",");
      // a curator pick of another room stays reserved for that room
      return (productsByBrand[brand] || []).filter((p) => fitsRoom(p, profileKey, room) && allowed.includes(p.kategories) && (!pickNames.has(p.name) || roomPicks.has(p.name)));
    });
    const max = PER_ROOM + ALTERNATES;
    for (let round = 0; round < 6 && list.length < max; round++) {
      for (const pool of pools) {
        if (list.length >= max) break;
        const open = pool.filter(free);
        if (!open.length) continue;
        take(open[Math.floor(rand() * open.length)]);
      }
    }
    out[room] = arrange(list, room);
  }
  // QA Runde 3, P2.4: spare lamps for the light page (lamp brands of the
  // profile's slots), so it never stays empty when the rooms use all lamps
  const lampBrands = [
    ...new Set(
      Object.values(ROOM_SLOTS[profileKey] || {})
        .flat()
        .filter((s) => s.split("|")[1].split(",").includes("lamps"))
        .map((s) => s.split("|")[0]),
    ),
  ];
  const lamps = lampBrands.flatMap((b) => (productsByBrand[b] || []).filter((p) => p.kategories === "lamps" && fitsRoom(p, profileKey, LIGHT_KEY) && free(p)));
  const licht = [];
  // hand-picked light-page lamp first (QA Runde 2 praised Maranello in the salon)
  for (const name of LIGHT_PICKS[profileKey] || []) {
    const p = byName.get(name);
    if (p && fitsRoom(p, profileKey, LIGHT_KEY) && free(p)) {
      used.add(p.name);
      families.add(fam(p));
      licht.push(p);
    }
  }
  // P3.1: lamps that fit the light text first, the rest as fallback
  const spare = [];
  while (lamps.length) spare.push(lamps.splice(Math.floor(rand() * lamps.length), 1)[0]);
  spare.sort((a, b) => Number(lightFits(profileKey, b)) - Number(lightFits(profileKey, a)));
  while (spare.length && licht.length < 6) {
    const p = spare.shift();
    if (!free(p)) continue;
    used.add(p.name);
    families.add(fam(p));
    licht.push(p);
  }
  out[LIGHT_KEY] = licht;
  return out;
}

/** Hero first, max. one accessory in the visible PER_ROOM, rest keeps order. */
// One bed per bedroom (two headboards side by side read as a catalogue).
export const ROOM_SINGLE = { schlafen: ["beds"] };
export const isSingle = (room, category) => (ROOM_SINGLE[room] || []).includes(category);

/** Category rank in a room with a fixed order (schlafen), else 0. */
export const seqRank = (room, category) => {
  const seq = ROOM_SEQUENCE[room];
  if (!seq) return 0;
  const i = seq.indexOf(category);
  return i < 0 ? seq.length : i;
};

/**
 * May `next` join the visible part `visible` of a room? (QA Runde 3, P2.3)
 * One per category, max. MAX_PER_BRAND per brand, max. one accessory and
 * never as the first piece. Works on backoffice rows and on items.
 */
export function fitsVisible(visible, next, maxPerBrand = MAX_PER_BRAND) {
  const cat = (x) => x.kategories ?? x.category;
  const brand = (x) => String(x.marken ?? x.brand ?? "").toLowerCase();
  const c = cat(next);
  if (visible.some((v) => cat(v) === c)) return false;
  if (visible.filter((v) => brand(v) === brand(next)).length >= maxPerBrand) return false;
  if (isAccessory(c) && (!visible.length || visible.some((v) => isAccessory(cat(v))))) return false;
  return true;
}

export function arrange(list, room) {
  const rows = [...list];
  const heroIdx = rows.findIndex((p) => isHeroFor(room, p.kategories, nameOf(p)));
  if (heroIdx > 0) rows.unshift(rows.splice(heroIdx, 1)[0]);
  const visible = [];
  const later = [];
  for (const p of rows) {
    if (visible.length < PER_ROOM && fitsVisible(visible, p)) visible.push(p);
    else later.push(p);
  }
  // bedroom order after the hero (stable sort)
  const [hero, ...rest] = visible;
  rest.sort((a, b) => seqRank(room, a.kategories) - seqRank(room, b.kategories));
  return [...(hero ? [hero] : []), ...rest, ...later];
}

/**
 * selectRooms(profileKey, productsByBrand, seed) →
 *   { wohnen: [row, …], essen: […], … }   (raw backoffice rows, max PER_ROOM each)
 */
export function selectRooms(profileKey, productsByBrand, seed = 1) {
  const { [LIGHT_KEY]: _lamps, ...all } = roomCandidates(profileKey, productsByBrand, seed);
  return Object.fromEntries(Object.entries(all).map(([room, list]) => [room, list.slice(0, PER_ROOM)]));
}
