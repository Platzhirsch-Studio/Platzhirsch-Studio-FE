// English layer over the yacht view model (src/lib/yacht/model.js →
// buildConcepts) for /en/yacht-interior. Welle 2, team EN-Yacht-Sofa, 29.10.2026.
// The German data (concepts.json, renders.json) stay the single source of
// products, eligibility and rules; this file only carries the English wording
// of the same facts, keyed by concept, zone, product and render id. Anything
// without an English entry keeps its German text (the unit test
// tests/unit/yacht-en.test.mjs fails if a visible field is still German).
// Pure module (only relative imports), so node --test can load it.
// 01.11.2026: also the hub for FR/IT (concepts-fr.js, concepts-it.js) –
// localizeConcepts(concepts, "fr"|"it") uses the same logic as English.
import { LAYER_FR } from "./concepts-fr.js";
import { LAYER_IT } from "./concepts-it.js";

export const MODEL_EN = Object.freeze({
  kiLabel: "AI-generated concept visualisation",
  renderLabel: "Visualisation (rendering)",
  badge: "Example concept – not a client project",
  eignungShort: {
    "aussen-marine-hersteller": "Outdoor · maker names yachting",
    "aussen-katalog": "Outdoor · per catalogue",
    "innen-lose": "Indoor · loose furnishing",
  },
  eignungRule: {
    "aussen-marine-hersteller":
      "The maker names marine or yachting use for its brand in general. Use of this model on board, fixing and weight are clarified in writing with the maker and the yard before the quotation.",
    "aussen-katalog":
      "Listed as outdoor in the catalogue. For boathouse, jetty, lake terrace and houseboat terrace. On board only after written approval by the maker.",
    "innen-lose": "Home furnishing. Only below deck, loose, kept dry, not in wet areas. No fixing by Platzhirsch.",
  },
  openZoneException: {
    "In Vitro Unplugged": "Loose battery lamp at the berth – not while under way.",
  },
  renderNotes: {
    "segelyacht-nordwind-deck": "The rig is simplified in the image.",
  },
});

/** Zone names and general zone texts (concepts.json → zonen). */
export const ZONES_EN = Object.freeze({
  deck: { label: "Deck & cockpit", short: "Deck", text: "Cockpit cushions, table, shade, loose deck furniture." },
  flybridge: { label: "Flybridge", short: "Flybridge", text: "Sun cushions, lounge, bar, parasol – the living room under open sky." },
  salon: { label: "Saloon", short: "Saloon", text: "Seat cushions, covers, curtains, battery lamps, throws." },
  kabine: { label: "Cabin", short: "Cabin", text: "Berth topper, bed linen, blankets, reading light." },
  bad: { label: "Bathroom", short: "Bathroom", text: "Towels, textiles, storage – loose and damp-resistant only." },
  badeplattform: { label: "Bathing platform", short: "Platform", text: "Arriving from the water: towels, mat, sun cushion at the stern." },
  bootshaus: { label: "Jetty & boathouse", short: "Jetty", text: "Ashore, not on board: lounge, shade, warmth at the berth. Shown in the 3D model as a jetty next to the boat." },
});

/** Boat type kickers on the concept tabs. */
/** Boat type names (also in src/lib/yacht/ui.js → kicker). */
export const KICKER_EN = Object.freeze({
  runabout: "Runabout",
  daycruiser: "Day cruiser",
  segelyacht: "Sailing yacht",
  motoryacht: "Motor yacht",
  hausboot: "Houseboat",
  superyacht: "Superyacht",
});

/**
 * Per concept: the same fields as concepts.json, in English. Arrays follow the
 * German order (farbwelt, materialien, sattler, werft, gartenbau); products are
 * keyed by product id: [role, note|null].
 */
export const CONCEPTS_EN = Object.freeze({
  "runabout-mahagoni": {
    boatType: "Lake Constance wooden runabout",
    length: "8–10 m",
    area: "Lake Constance",
    title: "Mahogany and linen",
    motto: "An evening on the lake where only the wood shines.",
    mood: "Evening light over the Pfänder, varnished wood, cream leather, a throw for the trip home. Classic, quiet, no chrome highlights.",
    palette: [
      ["Varnished mahogany", "Hull, deck"],
      ["Ivory leather", "Cushions"],
      ["Lake green", "Cushion accent"],
      ["Brushed brass", "Fittings, as a line only"],
      ["Dusk", "Background, night"],
    ],
    materials: [
      ["Varnished mahogany", "Existing, restored by the yard", "Woodwork by the yard or boatbuilder only"],
      ["Ivory marine faux leather", "Bench seat and sun cushion", "Made by the marine upholsterer; obtain UV and flammability data sheet"],
      ["Solution-dyed acrylic", "Boat cover, cushions", "Colour from the sample case, maker's data sheet"],
      ["Cashmere throw", "Loose, kept dry after the trip", "Home textile"],
    ],
    zones: {
      deck: "New seat and back cushions in ivory with lake-green piping; boat cover in the tone of the wood.",
      badeplattform: "Sun cushion on the engine hatch (where the boat allows for it), a towel set in the stowage locker.",
      bootshaus: "A lounge on the jetty for arriving – the real furniture project with runabouts.",
    },
    products: {
      Luberon: ["Throw for the evening trip", "Home textile: loose only, kept dry after the trip"],
      "In Vitro Unplugged": ["Battery lamp for the evening at the berth", "Loose, not while under way; check the protection rating on the data sheet"],
      "JAZZ lounger": ["Lounger on the jetty", null],
      "Versa UX": ["Shade on the jetty", "Ground anchoring by a specialist"],
      "Bleau Round Side Table": ["Side table on the jetty", null],
    },
    sattler: ["Measuring and making seat and back cushions", "Boat cover in the tone of the wood"],
    werft: ["Varnishing the wood", "Fixing points for the cushions", "Weight approval"],
  },
  "daycruiser-seelicht": {
    boatType: "Lake Constance day cruiser with cabin",
    length: "9–12 m",
    area: "Lake Constance",
    title: "Lake light",
    motto: "A bathing bay by day, a cabin by night – one colour concept for both.",
    mood: "Pale linen, sand-coloured teak, a touch of lake green. Midday light on the water, warm light below deck in the evening.",
    palette: [
      ["Paper", "Cushions, covers"],
      ["Natural teak", "Deck, table"],
      ["Linen", "Curtains, cushions"],
      ["Lake", "Accent"],
      ["Ink", "Piping, lettering"],
    ],
    materials: [
      ["Teak", "Existing in cockpit and on the bathing platform", "Care by the yard"],
      ["Pale outdoor fabric", "Cockpit and sun cushions", "Made by the upholsterer, open-cell foam"],
      ["Linen-look outdoor fabric", "Saloon cushions", "Removable covers"],
      ["Cotton sateen", "Bed linen in the forward berth", "Home textile"],
    ],
    zones: {
      deck: "Pale cockpit cushions with dark piping, a table cover, loose side tables in harbour.",
      badeplattform: "Towel set, sun cushion at the stern.",
      salon: "Seat cushions newly covered, a throw, a battery lamp on the table.",
      kabine: "Made-to-measure berth topper, bed linen, blanket.",
      bad: "Towels and loose storage.",
    },
    products: {
      "Bleau Stacking Side Table": ["Side table in the cockpit (in harbour only)", "Stackable; stow while under way"],
      Wadi: ["Outdoor rug in the cockpit at the berth", "Agree slip resistance with the yard"],
      "Bellhop Unplugged": ["Battery table lamp", null],
      'Libra "Throw"': ["Throw", null],
      "Matratzenauflage Riviera": ["Topper on the berth", "Berth shape: ask the maker for a made-to-measure size"],
      "Laken aus Baumwollsatin": ["Bed linen", null],
      Moltrasio: ["Blanket", null],
    },
    sattler: ["Cockpit and sun cushions", "Re-covering the saloon cushions", "Berth mattress from a template"],
    werft: ["Teak care", "Fixings", "Electrics (no fixed lights by Platzhirsch)"],
  },
  "segelyacht-nordwind": {
    boatType: "Sailing yacht",
    length: "12–16 m",
    area: "Lake Constance and the Adriatic",
    title: "North wind",
    motto: "Calm below deck, weatherproof on deck – textiles that cope with heel and damp.",
    mood: "Cool grey-blue, wool white, brushed wood. Nordic and pared back – everything has its place and nothing slides.",
    palette: [
      ["Wool white", "Cushions"],
      ["Fjord grey", "Covers"],
      ["Light oak", "Existing joinery"],
      ["Storm blue", "Cushions, boat cover"],
      ["Stone", "Curtains"],
    ],
    materials: [
      ["Grey-blue marine upholstery fabric", "Saloon benches", "Upholsterer, zipped covers"],
      ["Cold foam with drainage", "Cockpit cushions", "Upholsterer"],
      ["Wool and cashmere", "Loose throws", "Keep dry"],
      ["Cotton sateen", "Aft cabin", "Home textile"],
    ],
    zones: {
      deck: "Cockpit cushions with drainage, sprayhood and bimini in the tone of the boat cover (upholsterer).",
      salon: "Benches newly covered, cushions, curtains at the windows, a battery lamp with a low centre of gravity.",
      kabine: "Owner's and guest cabin: berth toppers, bed linen, blankets.",
      bad: "Towels, storage, nothing breakable.",
    },
    products: {
      "Bon Jour Unplugged": ["Battery table lamp (in harbour or at anchor only)", "Secure or stow while under way"],
      'Andersen "Throw"': ["Throw", null],
      "Matratzenauflage Seine": ["Berth topper", "Ask for a made-to-measure size"],
      Snow: ["Bed linen", null],
      "Region - decor": ["Blanket or cushion", null],
      "Bleau Stacking Side Table": ["Side table at anchor", "Not under sail; stow away"],
    },
    sattler: ["Cockpit cushions", "Saloon covers", "Sprayhood, bimini, boat cover"],
    werft: ["Rig and deck fittings", "Fixings", "Electrics"],
  },
  "motoryacht-riviera": {
    boatType: "Mediterranean motor yacht",
    length: "20–30 m",
    area: "Adriatic / Mediterranean",
    title: "Riviera evening",
    motto: "The flybridge as a terrace, the saloon as a living room – as at home by the lake, only by the sea.",
    mood: "Sand, terracotta and tobacco. Soft outdoor lounges above, Italian living in the saloon, cotton sateen in the owner's cabin.",
    palette: [
      ["Sand", "Lounge cushions"],
      ["Terracotta", "Cushions, rug accent"],
      ["Tobacco", "Wood, leather"],
      ["Walnut", "Saloon furniture"],
      ["Paper", "Bed linen, blankets"],
    ],
    materials: [
      ["Outdoor weave and fabric", "Flybridge lounge", "Confirm use on board with the maker for each model"],
      ["Teak", "Aft deck (existing)", "Yard"],
      ["Upholstery fabrics, bouclé, leather", "Saloon", "Indoors only; loose furniture once the yard has approved weight and securing"],
      ["Cotton sateen, cashmere", "Owner's cabin", "Home textile"],
    ],
    zones: {
      flybridge: "Lounge sofa, dining table and loungers from outdoor collections; shade only in agreement with the yard.",
      deck: "Aft deck: dining table with chairs, rug, battery lamps.",
      salon: "Sofa, coffee table, rug and throws from the living collection – loose, secured by the yard.",
      kabine: "Owner's cabin with bed linen, blankets, berth toppers.",
      bad: "Towels and textiles.",
      badeplattform: "Loungers and towels for the beach-club moment at the stern.",
    },
    products: {
      "Portofino Outdoor Sofa": ["Lounge sofa", null],
      "Portofino Outdoor Table": ["Dining table", null],
      Baia: ["Sun lounger", null],
      "Bleau Barstool": ["Bar stool at the flybridge bar", null],
      Asira: ["Outdoor rug on the aft deck", "Agree slip resistance with the yard"],
      "In Vitro Unplugged": ["Battery lamp for the evening", null],
      "Bleau Double Sun Lounge": ["Double lounger at the stern", null],
      "Lido (Sofas)": ["Seating in the saloon – Lido collection, sofa or armchair", "Weight and securing by the yard"],
      "Libra Coffee Table": ["Coffee table", "Secured by the yard"],
      Wisp: ["Rug", "Slip resistance"],
      Cachemire: ["Throw", null],
      'Freeman "Duvet"': ["Duvet for the owner's cabin", null],
      "Laken aus Baumwollsatin": ["Bed linen", null],
      "Matratzenauflage Riviera": ["Mattress topper", "Ask for a made-to-measure size"],
    },
    sattler: ["Sun cushions on the foredeck", "Covers for the built-in seats", "Biminis and boat cover"],
    werft: ["Approving weight and stability", "Securing furniture on deck and in the saloon", "Fixing parasol and bimini", "Electrics, fixed lighting"],
  },
  "bootshaus-ufer": {
    boatType: "Houseboat and boathouse",
    length: "Boathouse with jetty, houseboat as a floating home",
    area: "Lake Constance shore",
    title: "By the shore",
    motto: "Where the boat sleeps, the evening begins: lounge, warmth and light by the water.",
    mood: "Wood, stone, light on the water. Wide lounges, a large table, warmth for the long evenings in September.",
    palette: [
      ["Weathered larch", "Façade, jetty"],
      ["Stone", "Cushions"],
      ["Teak", "Table"],
      ["Lake", "Cushions, accent"],
      ["Deep ink", "Steel, night"],
    ],
    materials: [
      ["Teak and aluminium", "Table, loungers", "Outdoor per catalogue"],
      ["Outdoor fabric", "Lounge cushions", "Removable covers; store dry in winter"],
      ["Weave", "Canopy, armchairs", "Outdoor per catalogue"],
      ["Oak, sheepskin", "Houseboat interior", "Home furnishings, indoors only"],
    ],
    zones: {
      deck: "Jetty and terrace: lounge, dining table, parasol, heater.",
      salon: "Houseboat interior: dining table, armchairs, rug, battery lamps.",
      kabine: "A sleeping area as in a small flat.",
      badeplattform: "Steps into the water: lounger, towels, a lamp.",
    },
    products: {
      "PLATEAU Arrangement A1": ["Lounge group on the terrace", null],
      "CHARLIE Teak Dining Table": ["Dining table by the water", null],
      Ketch: ["Lounge element", null],
      "Belvedere Canopy": ["Canopy lounger", null],
      "Eclipsum UX": ["Parasol", "Anchoring by a specialist"],
      "Dome Pendant": ["Heater", "Electrical connection by an electrician"],
      "IC F1 Outdoor H 1350 mm": ["Outdoor floor lamp", "Connection by an electrician"],
      "FOXX Lounger": ["Lounger at the water's edge", null],
      "Arc Dining Table, Ø120 - Coffee Black Oak": ["Dining table in the houseboat", null],
      "Toe Armchair, Flat - Sheepskin": ["Armchair", null],
      "Tatou Floor": ["Floor lamp", "Indoors only, mains connection"],
    },
    sattler: ["Cushions for built-in benches in the boathouse (if wanted)"],
    werft: ["Houseboat: structure, electrics and gas by the yard or a specialist only"],
    gartenbau: ["Garden planning and the work itself by licensed specialists; Platzhirsch coordinates the dates"],
  },
});

/** Concept images: [title, alt] by render id (renders.json; since 03.11.2026 only the Blender renderings are shown). */
export const RENDERS_EN = Object.freeze({
  "runabout-mahagoni-deck": [
    "Mahogany and linen – cockpit",
    "Cockpit of a classic mahogany runabout with an ivory, lengthwise quilted bench seat with dark piping, a wooden steering wheel and teak floor, a calm lake in the evening light behind",
  ],
  "runabout-mahagoni-steg": [
    "Mahogany and linen – jetty",
    "Wooden lounger with a cream cushion and a parasol in sand-coloured fabric on a wooden jetty, a calm lake and wooded shore in warm evening light",
  ],
  "daycruiser-seelicht-cockpit": [
    "Lake light – cockpit",
    "Covered cockpit of a day cruiser with a white corner sofa on a wooden base, two white armchairs, petrol-green check cushions, a wooden table and a pale rug, the lake beyond with a lakeside town and church tower under an overcast sky",
  ],
  "daycruiser-seelicht-kabine": [
    "Lake light – cabin",
    "Cabin of a day cruiser with a double bed in white linen, a grey-green bed runner, a petrol-green check cushion and a dark upholstered headboard against pale oak panelling, two bedside lamps, a narrow band of windows and a pale rug on a wooden floor in the evening light",
  ],
  "daycruiser-seelicht-salon": [
    "Lake light – saloon",
    "Saloon of a day cruiser with a white sofa on a pale wooden base, petrol-green check cushions, two white armchairs on stainless-steel frames, a round pale coffee table and a white rug, a wide band of windows looking out on the lake and pale oak panelling on the right in daylight",
  ],
  "segelyacht-nordwind-salon": [
    "North wind – saloon",
    "Saloon of a sailing yacht with a U-shaped bench in blue-grey, wool-white cushions and a dining table in pale wood, light through hull and deck windows",
  ],
  "segelyacht-nordwind-deck": [
    "North wind – on deck",
    "Deck of a sailing yacht at sunset with teak decking, petrol-blue and pale cushions in front of the mast, a calm bay in the background",
  ],
  "motoryacht-riviera-flybridge": [
    "Riviera evening – flybridge",
    "Covered lounge on the flybridge of a motor yacht with a cream-white corner sofa, two armchairs on dark wooden frames, terracotta check cushions, a wooden table and a terracotta rug, a still lake with hills beyond in hazy evening light",
  ],
  "motoryacht-riviera-salon": [
    "Riviera evening – saloon",
    "Saloon of a motor yacht with a cream-white sofa on a dark base, terracotta check cushions, two armchairs on stainless-steel frames, a round coffee table and a dusty terracotta rug, a long band of windows onto the harbour wall and dark wood panelling on the right in the evening light",
  ],
  "motoryacht-riviera-kabine": [
    "Riviera evening – owner's cabin",
    "Owner's cabin of a motor yacht with a double bed in white linen on a dark bed base, a terracotta bed runner and cushion, an upholstered headboard against dark wood panelling, two bedside lamps and a narrow band of windows, a pale rug on a red-brown wooden floor",
  ],
  "bootshaus-ufer-terrasse": [
    "By the shore – terrace",
    "Modern wooden boathouse on a mountain lake at dusk, a terrace with a low stone-grey lounge, warm light in the open interior, snow-capped peaks on the far shore",
  ],
  "bootshaus-ufer-wohnraum": [
    "By the shore – living room",
    "Living room of a houseboat with a grey sofa, two armchairs with sheepskin throws and a round side table, floor-to-ceiling windows onto a mirror-still lake",
  ],
});

const pair = (arr, i) => (Array.isArray(arr) ? arr[i] : undefined);

// 01.11.2026: FR/IT dazu. Dieselbe Logik für alle Übersetzungsebenen
// (EN hier, FR in concepts-fr.js, IT in concepts-it.js); jede Ebene hat die
// Form { model, zones, concepts, renders }.
const LAYER_EN = Object.freeze({ model: MODEL_EN, zones: ZONES_EN, concepts: CONCEPTS_EN, renders: RENDERS_EN });
export const YACHT_CONCEPT_LAYERS = Object.freeze({ en: LAYER_EN, fr: LAYER_FR, it: LAYER_IT });
/**
 * QM r2: Produktnamen, die im Katalog deutsch beschreibend heißen (Gattung + Modellname), in der
 * Seitensprache – der Modellname bleibt unverändert. Modellnamen (Riviera) werden nie übersetzt; Minotti-Daten bleiben unverändert.
 */
export const PRODUCT_NAMES = Object.freeze({
  en: { "Matratzenauflage Riviera": "Riviera mattress topper" },
  fr: { "Matratzenauflage Riviera": "Surmatelas Riviera" },
  it: { "Matratzenauflage Riviera": "Topper Riviera" },
});

/** Produkt-Basis je Sprache (wie src/utils/routing.js ROUTES.produkte). */
const PRODUCT_BASE = Object.freeze({ de: "/produkte", en: "/products", fr: "/produits", it: "/prodotti" });

/** Product path in a locale: /produkte/… → /products|/produits|/prodotti/… (next-intl adds the prefix). */
export function productPathFor(path, locale) {
  return String(path || "").replace(/^\/produkte(?=\/|$)/, PRODUCT_BASE[locale] || PRODUCT_BASE.de);
}

/** English product path: /produkte/… → /products/… (next-intl adds /en). */
export function productPathEn(path) {
  return productPathFor(path, "en");
}

function imageIn(img, layer) {
  const r = layer.renders[img.id];
  return {
    ...img,
    title: r ? r[0] : img.title,
    alt: r ? r[1] : img.alt,
    label: img.kiGenerated === false ? layer.model.renderLabel : layer.model.kiLabel,
    note: layer.model.renderNotes[img.id] || (img.note ? img.note : null),
  };
}

/**
 * One concept view (buildConcepts) in a translated layer. Products are rebuilt
 * once and shared between `products` and `zones[].products`, like the German views.
 */
export function localizeConcept(c, locale) {
  const layer = YACHT_CONCEPT_LAYERS[locale];
  const t = layer?.concepts[c.id];
  if (!t) return c;
  const productsById = new Map();
  const productIn = (p) => {
    const key = `${p.id}|${p.zone}`;
    if (productsById.has(key)) return productsById.get(key);
    const [role, hint] = t.products?.[p.id] || [p.role, p.note];
    const exception = layer.model.openZoneException[p.id] && ["deck", "flybridge", "badeplattform"].includes(p.zone);
    const out = {
      ...p,
      name: PRODUCT_NAMES[locale]?.[p.id] ?? p.name,
      path: productPathFor(p.path, locale),
      href: String(p.href || "").replace(/^\/de\/produkte(?=\/|$)/, `/${locale}${PRODUCT_BASE[locale]}`),
      role,
      note: exception ? layer.model.openZoneException[p.id] : hint ?? null,
      eignungLabel: layer.model.eignungShort[p.eignung] || p.eignungLabel,
      eignungRule: layer.model.eignungRule[p.eignung] || p.eignungRule,
    };
    productsById.set(key, out);
    return out;
  };
  const images = c.images.map((i) => imageIn(i, layer));
  const imgById = new Map(images.map((i) => [i.id, i]));
  return {
    ...c,
    boatType: t.boatType ?? c.boatType,
    length: t.length ?? c.length,
    area: t.area ?? c.area,
    title: t.title ?? c.title,
    motto: t.motto ?? c.motto,
    mood: t.mood ?? c.mood,
    palette: c.palette.map((p, i) => ({ ...p, name: pair(t.palette?.[i], 0) ?? p.name, rolle: pair(t.palette?.[i], 1) ?? p.rolle })),
    materials: c.materials.map((m, i) => ({
      ...m,
      name: pair(t.materials?.[i], 0) ?? m.name,
      einsatz: pair(t.materials?.[i], 1) ?? m.einsatz,
      hinweis: pair(t.materials?.[i], 2) ?? m.hinweis,
    })),
    zones: c.zones.map((z) => {
      const meta = layer.zones[z.id];
      return {
        ...z,
        label: meta?.label ?? z.label,
        short: meta?.short ?? z.short,
        general: meta?.text ?? z.general,
        text: t.zones?.[z.id] ?? meta?.text ?? z.text,
        products: z.products.map(productIn),
        images: z.images.map((i) => imgById.get(i.id) || imageIn(i, layer)),
      };
    }),
    products: c.products.map(productIn),
    images,
    sattler: t.sattler ?? c.sattler,
    werft: t.werft ?? c.werft,
    gartenbau: t.gartenbau ?? c.gartenbau,
    badge: layer.model.badge,
  };
}

/** One concept view in English (kept for existing callers and tests). */
export function conceptEn(c) {
  return localizeConcept(c, "en");
}

/** All concept views for a locale (en/fr/it translated, anything else unchanged). */
export function localizeConcepts(concepts, locale) {
  return YACHT_CONCEPT_LAYERS[locale] ? concepts.map((c) => localizeConcept(c, locale)) : concepts;
}
