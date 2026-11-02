// src/lib/ezarri/copy.en.js – English texts of the Ezarri world (Welle 2, team EN-Ezarri).
//
// Same export names and structure as copy.js (German source); pages pick the
// set via ezCopy(locale) in lang.js. Own texts by Platzhirsch, translated from
// copy.js; facts come from Ezarri's website (ezarri.com/en) and data sheets
// (as of 28.10.2026) and are given as manufacturer information ("according to
// Ezarri"). Voice as in the design bible: "you", facts instead of adjectives,
// no superlatives, no "luxury", no prices (only "on request"). British English
// like src/messages/en.json.
//
// Dealer statement: the same two switches as in copy.js (EZARRI_PUBLIC and the
// "ezarri" entry in src/lib/legal/claims.js). Sentence and title word come from
// claims.js (dealerStatement, DEALER_TITLE_WORD) – the one place lint and
// check:claims know; only the article is corrected here ("a Ezarri" → "an Ezarri").
//
// Pure: no packages, no "@/" aliases. Server, client and node --test.
import { DEALER_TITLE_WORD, dealerStatement, isVerifiedDealerBrand } from "../legal/claims.js";
import { ezarriDealerClaimVisible } from "./config.js";

/** Neutral line while no dealer statement may be shown. */
export const NEUTRAL_CLAIM = "Ezarri glass mosaic – advice and samples in Lochau";

/** Dealer statement (only when on record AND switched on), else null. */
export function dealerClaim(isPublic) {
  const visible = isPublic === undefined ? ezarriDealerClaimVisible() : ezarriDealerClaimVisible(isPublic);
  if (!visible || !isVerifiedDealerBrand("ezarri")) return null;
  return dealerStatement("ezarri", "en").replace(/\ba (?=[AEIOU])/, "an ") || null;
}

/** Title word from the dealer statement, null while it may not be shown. */
export function dealerTitleWord(isPublic) {
  return dealerClaim(isPublic) ? DEALER_TITLE_WORD.en : null;
}

/** Line in the brand box: dealer statement or neutral line. */
export function dealerLine(isPublic) {
  return dealerClaim(isPublic) ?? NEUTRAL_CLAIM;
}

export const STUDIO = Object.freeze({
  ort: "Showroom café, Landstraße 11, 6911 Lochau, Austria",
  muster: "We order the samples for your appointment.",
  laender: "Delivery on request: around Lake Constance, in the border region of Austria, Germany and Switzerland, and beyond on request. For Switzerland, export and customs clearance are added.",
  schweizHref: "/einkaufen-aus-der-schweiz",
});

export const NAV = Object.freeze({
  label: "Ezarri glass mosaic",
  items: [
    { href: "/ezarri", label: "Overview", exact: true },
    { href: "/ezarri/mosaike", label: "Mosaics" },
    { href: "/ezarri/kollektionen", label: "Collections" },
    { href: "/ezarri/galerie", label: "Gallery" },
    { href: "/ezarri/konfigurator", label: "Configurator" },
    { href: "/ezarri/rechner", label: "Calculator" },
    { href: "/ezarri/technik", label: "Technical" },
  ],
  muster: { href: "/ezarri/anfrage?art=muster", label: "Request samples" },
});

export const LINKS = Object.freeze({
  konfigurator: "/ezarri/konfigurator",
  rechner: "/ezarri/rechner",
  customMix: "/ezarri/custom-mix",
  anfrage: "/ezarri/anfrage",
  muster: (ids = []) => `/ezarri/anfrage?art=muster${ids.length ? `&ref=${ids.map(encodeURIComponent).join(",")}` : ""}`,
  // English consultation page (src/utils/routing.js: beratung → consultation).
  beratung: "/consultation?thema=ezarri",
  katalog: "/ezarri/anfrage?art=muster&thema=katalog",
  outdoor: "/outdoor-gartenplanung",
  kueche: "/kuechen-vorarlberg",
  interior: "/interior-design-vorarlberg",
  merkliste: "/wishlist",
});

export const HUB = Object.freeze({
  crumb: "Ezarri glass mosaic",
  eyebrow: "Ezarri · glass mosaic made from recycled glass",
  title: "Ezarri glass mosaic for pools, bathrooms and spas",
  lead: (st) =>
    `${st.mosaike} mosaics in ${st.kollektionen} collections, plus Safe-Steps and special pieces – sorted by what you will see in the end: place, water colour, surface. Design your pool in the browser and see the samples with us in Lochau.`,
  description: (st) =>
    `Ezarri glass mosaic for pools, bathrooms, spas and kitchens: ${st.mosaike} mosaics in ${st.kollektionen} collections, 3D configurator, quantity calculator, samples and advice in Lochau.`,
  heroAlt: "Pool with Ezarri Celestite, turquoise glass mosaic",
  primary: { label: "Design your pool", sub: "3D in the browser · no sign-up" },
  secondary: "Request samples",
  weiche: {
    eyebrow: "Application",
    title: "Where will the mosaic go?",
    text: "According to the data sheets, almost all Ezarri mosaics are suitable for walls, pools and wellness areas, indoors and outdoors. Under each area you can see how many mosaics are suitable and how many Ezarri shows in projects of this kind.",
  },
  kachel: (n, mitBild) => [`${n} suitable mosaics`, mitBild ? `${mitBild} with project photo` : null].filter(Boolean).join(" · "),
  wasser: {
    eyebrow: "Water colour",
    title: "What colour will your water be?",
    text: "The mosaic decides how the water looks. White makes it appear sky blue, grey and black more like a mountain lake. The assignment comes from Ezarri and also depends on water depth and sunlight.",
    alle: "All water colours side by side",
  },
  kollektionen: {
    eyebrow: "Range",
    title: (st) => `${st.kollektionen}\u00a0collections and ${st.sonderanfertigungen}\u00a0made-to-order lines`,
    alle: "All collections",
  },
  konfigurator: {
    eyebrow: "Configurator",
    title: "Your pool, your blend",
    text: "Your own dimensions, up to four mosaics blended, seven grout colours, time of day and underwater light. The configurator works out the quantities as you go.",
    link: "Open the configurator",
    rechner: "Calculate quantity",
    customMix: "Your own blend or motif",
  },
  technik: { eyebrow: "Technical", title: "Installation, care, reference" },
  marke: {
    eyebrow: "The brand",
    text: "Ezarri makes glass mosaic in Lazkao (Gipuzkoa, Spain). According to Ezarri, the glass is 100 % recycled glass, confirmed under ISO 14021; the finished mosaic contains at least 96 %, the rest being colourants and the bonding points (JointPoint).",
    website: "Ezarri website",
  },
  gastgeber: {
    eyebrow: "Showroom café in Lochau",
    title: "Hold the mosaic in your hand",
    text: "Glass looks different in daylight than on a screen. Bring plans or photos, and we will lay the samples out on the table – with a view of Lake Constance.",
    termin: "Request an appointment",
  },
  // Core USP block (Inhaber-Entscheidung Nr. 8): only real material as Harald's work.
  usp: {
    eyebrow: "Planning with Platzhirsch",
    title: "Your pool, first drawn by hand.",
    text: "Mosaic only shows its effect in the light and on site. We look at your pool or bathroom where it is. Harald Menghin draws patterns, colour gradients and transitions by hand. Then we plan in 3D and show you a rendering with the Ezarri colours before anything is ordered.",
    arbeitsweise: "How we work",
    licht: "See the sun on the pool (in German)",
  },
  teaserAlt: "Private pool with Ezarri glass mosaic",
  schweiz: "Buying from Switzerland",
  oeffnet: "(opens ezarri.com)",
  referenzen: (n) => `${n} references`,
});

/**
 * Application worlds (§3.2). Same ids, filters and curated images as copy.js;
 * only the texts are English. Links to German-only pages say so.
 */
export const WELTEN = Object.freeze([
  {
    id: "pool",
    label: "Pool",
    title: "Glass mosaic for pools",
    seoTitle: "Pool glass mosaic in Vorarlberg & on Lake Constance",
    description: "Ezarri pool mosaic: choose the water colour, slip-resistant Safe-Steps, Corner and Cove for edges. Samples and advice in Lochau.",
    lead: "In a pool, more than colour counts: grout, slip resistance on steps and edges, clean corners. Here you can see what matters and the mosaics Ezarri intends for pools.",
    filter: { einsatz: ["pool"] },
    galerie: ["pool-privat", "pool-oeffentlich"],
    bild: { galerie: "anw-6-terrazzo-teal-50-ezarri-mosaics-pool-home", alt: "Narrow indoor pool with a view of the sea, basin in Ezarri Terrazzo Teal 50" },
    hinweise: [
      ["Grout", "For pools, Ezarri recommends an epoxy grout of class RG. According to Ezarri, cement grouts need renewing after about 5–6 years."],
      ["Steps and edge", "For steps, benches and the pool edge there are slip-resistant Safe versions with tested values under DIN EN 16165."],
      ["Edges", "Corner pieces frame outside edges, Cove pieces form the cove between wall and floor."],
      ["Water colour", "Light mosaics make the water bright and turquoise, dark ones make it look deep and natural."],
    ],
    platzhirsch: { title: "Pool, terrace and garden as one project", text: "Pool, furniture, shade and light should work together. We plan the outdoor concept and coordinate with the specialist firms you commission.", href: "/outdoor-gartenplanung", label: "Outdoor planning" },
  },
  {
    id: "wellness",
    label: "Spa",
    title: "Glass mosaic for wellness and spa",
    seoTitle: "Glass mosaic for wellness, sauna and spa",
    description: "Ezarri glass mosaic for hot tubs, steam rooms and spas: surfaces, slip resistance and grouts at a glance. Samples and advice in Lochau.",
    lead: "Hot tub, steam room, spa shower: here the mosaic covers curved surfaces, under water and in steam. According to Ezarri, glass absorbs no water and resists common cleaning agents.",
    filter: { einsatz: ["wellness"] },
    galerie: ["wellness"],
    bild: { galerie: "anw-alexande-gold-carrara-gold-mosaic-spa-wellness-ezarri-4", alt: "Steam room with bench, walls in dark glass mosaic with gold tiles, Ezarri Carrara Gold 25" },
    hinweise: [
      ["Curves", "According to Ezarri, the point bonding (JointPoint) also follows tight radii, for example on benches and hot tubs."],
      ["Floor", "Wet floors need a slip-resistant version. The values are on every mosaic page."],
      ["Light", "Mother-of-pearl and metal surfaces react strongly to light. Look at them as a sample, not only on screen."],
    ],
    platzhirsch: { title: "Planning wellness at home", text: "From the spa area to the relaxation room: we plan furniture, light and materials together.", href: "/interior-design-vorarlberg", label: "Interior design" },
  },
  {
    id: "bad",
    label: "Bathroom",
    title: "Glass mosaic for bathrooms and showers",
    seoTitle: "Glass mosaic for bathroom & shower, slip-resistant",
    description: "Ezarri glass mosaic for showers, bathroom walls and shower floors: slip-resistant versions, formats, grouts. Samples and advice in Lochau.",
    lead: "In the bathroom, mosaic works where large tiles reach their limits: in the fall of a walk-in shower, in niches and on curves. For the shower floor, choose a slip-resistant version.",
    filter: { einsatz: ["bad"] },
    galerie: ["bad"],
    bild: { galerie: "anw-ezarri-mosaics-gemma-collection-lace-25", alt: "Bathroom with curved walls, open shower and freestanding bath, all in light green Ezarri Lace 25" },
    hinweise: [
      ["Shower floor", "Small formats follow the fall. Slip-resistant Safe versions are intended for wet floors."],
      ["Grout", "The grout colour changes the effect a great deal. In the configurator you can try all seven grout colours."],
    ],
    platzhirsch: { title: "Planning the whole bathroom", text: "Mosaic, furniture, fittings and light in one concept – we discuss the design in the showroom in Lochau.", href: "/interior-design-vorarlberg", label: "Interior design" },
  },
  {
    id: "kueche",
    label: "Kitchen",
    title: "Glass mosaic for kitchens",
    seoTitle: "Glass mosaic kitchen splashback",
    description: "Ezarri glass mosaic as a kitchen splashback: surfaces, colours and formats at a glance. Kitchen planning and samples in Lochau.",
    lead: "As a splashback behind hob and sink, glass mosaic is easy to clean. Metal, mother-of-pearl and matt stone looks set their own accents between fronts and worktop.",
    filter: { einsatz: ["kueche"] },
    galerie: ["kueche"],
    bild: { galerie: "anw-perla-hexa-mosaic-iridescent-collection-ezarri-kitchen", alt: "Light kitchen with island, walls in white mother-of-pearl mosaic Ezarri Perla Hexa" },
    hinweise: [
      ["Area", "Splashbacks are usually narrow and long. The calculator gives the quantity in boxes."],
      ["Matching", "Choose the mosaic together with front and worktop, with the samples side by side."],
    ],
    platzhirsch: { title: "Kitchen and splashback from one plan", text: "We plan kitchens in Lochau and match the splashback to fronts and worktop.", href: "/kuechen-vorarlberg", label: "Kitchen planning" },
  },
  {
    id: "fassade",
    label: "Façade",
    title: "Glass mosaic for façades and exterior walls",
    seoTitle: "Glass mosaic for façades and exterior walls",
    description: "Ezarri glass mosaic for exterior walls and façades: information from the data sheets, formats and colours. Planning with your façade contractor.",
    lead: "According to the data sheets, the Ezarri collections are suitable for walls and ceilings indoors and outdoors, on regular and irregular surfaces. Ezarri has not published project photos of façades. That is why we show a fully clad interior wall and the information from the data sheets.",
    filter: { einsatz: ["wand-innen-aussen"] },
    galerie: [],
    bild: { galerie: "anw-moonstone-hexa-mosaic-gemma-collection-ezarri-espacio", alt: "Room with a wide opening, walls and reveal fully clad in Ezarri Moonstone Hexa" },
    hinweise: [
      ["Planning", "Substrate, adhesive and grout are specified by your façade contractor. We supply mosaic, data sheets and samples."],
      ["Frost and light", "According to Ezarri, glass absorbs practically no water (water absorption 0.1 % per data sheet) and does not fade."],
    ],
    platzhirsch: { title: "House and garden as one project", text: "Façade, terrace and pool: we plan the outdoor concept with furniture, shade and light.", href: "/outdoor-gartenplanung", label: "Outdoor planning" },
  },
]);

export const WASSER = Object.freeze({
  crumb: "Water colour",
  eyebrow: "Water colour",
  title: "What colour will your water be?",
  seoTitle: "Choosing a pool colour: how mosaic colours the water",
  description: "Six water colours side by side, from sky blue to mountain lake, with matching Ezarri mosaics and project photos.",
  lead: "Water has no colour of its own; it takes it from the pool. Ezarri assigns its mosaics to six water effects. How strong the effect is depends on water depth, the position of the sun and the surroundings.",
  texte: {
    himmelblau: "White and very light mosaics. The water looks bright, clear and slightly blue.",
    tuerkisblau: "Light blue and turquoise tones. The classic pool colour, especially in shallow areas.",
    blau: "Medium to dark blue tones. The darker the mosaic, the deeper the blue looks.",
    gruen: "According to Ezarri, beige, sand and pink tones make the water look transparent green.",
    graugruen: "Grey mosaics give the water a grey with blue or green hints.",
    natur: "Black and dark green mosaics. The water looks like a mountain lake or a river.",
  },
  quelle: "Water colour assignment: Ezarri (gallery filter and FAQ), as of 28.10.2026.",
  zahlen: {
    title: "Mosaics and projects per water colour",
    caption: "Number of mosaics and project photos per water effect according to Ezarri",
    wirkung: "Water effect",
    mosaike: "Mosaics",
    projekte: "Project photos",
  },
});

export const KOLLEKTIONEN = Object.freeze({
  crumb: "Collections",
  eyebrow: "Range",
  title: "Collections",
  seoTitle: "Ezarri collections: Premium, Classic, Custom",
  description: (st) =>
    `All ${st.kollektionen} Ezarri collections and ${st.sonderanfertigungen} made-to-order lines: Gea, Zen, Iridescent, Niebla, Lisa and more. Formats, surfaces and data sheets at a glance.`,
  lead: "Premium, Classic and Custom: each collection has its own surfaces and formats. For the made-to-order lines, Ezarri produces the blend or motif for your project.",
  sonder: "Made to order",
  sonderN: (n) => (n === 1 ? "1 made-to-order line" : `${n} made-to-order lines`),
  linien: {
    Premium: "Stone looks, mother-of-pearl, metal, gold and glow-in-the-dark glass.",
    Classic: "The basic colours for pools, plain or as a ready-made blend.",
    Custom: "Your own blends, printed and pixel motifs, gradients.",
  },
  custom: "This collection is a service. The blend or motif is made for your project.",
  customLink: "Plan your own blend",
  alt: "Data sheets of earlier collections",
  altHinweis: "Ezarri no longer lists these collections on its website. Data sheet: Ezarri, ezarri.com",
  konfigurator: "Open in the configurator",
  datenblatt: "Data sheet (PDF, English)",
  datenblattVon: (name) => `${name} – data sheet (PDF, English)`,
  ausfuehrungen: "Safe-Steps, Corner and Cove",
  anwendung: "Application example",
  anwendungen: "Application examples",
  anwendungsbild: (name) => `Ezarri ${name}, application photo`,
  beispiel: (name) => `Ezarri ${name}, example`,
  projektMit: (name) => `Project with Ezarri ${name}`,
  mosaike: "Mosaics",
  fakten: "According to the data sheet",
  formate: "Formats",
  formateCaption: (name) => `Formats of the ${name} collection according to the data sheet`,
  spalten: { format: "Format", stein: "Tile", blatt: "Sheet", dicke: "Thickness", verklebung: "Bonding" },
  patternFarben: (n) => `${n} colours`,
  patternAlt: (name, n) => `Ezarri ${name}, pattern with ${n} colours`,
  leerService: "Ezarri shows no individual references for this service. We plan the blend with you –",
  herstellerTitel: "Ezarri describes the collection",
  muster: "Request samples",
  service: {
    "custom-mix": "Your own blend in the mixer",
    "custom-pixel": "Request a pixel mosaic from your own image",
    "custom-printed": "Plan a printed motif with us",
    "standard-printed": "Choose printed motifs with us",
    "standard-pixel": "Choose pixel motifs with us",
    patterns: "Choose patterns with us",
    "fading-out": "Plan a gradient with us",
  },
  h1: (name) => `${name} – glass mosaic by Ezarri`,
  metaTitle: (name, linie) => `Ezarri ${name} – ${linie} glass mosaic`.replace(/\s+/g, " ").trim(),
});

export const MOSAIKE = Object.freeze({
  crumb: "Mosaics",
  eyebrow: "All mosaics",
  title: "Mosaics",
  seoTitle: "Ezarri glass mosaic: all mosaics with filters",
  description: "Filter all Ezarri mosaics by application, water colour, colour, format and collection. Compare, save, request samples.",
  lead: "Filter by water effect, colour, format and project photos. Compare up to four mosaics and save your selection.",
  suche: "Name or code",
  sucheLabel: "Search",
  filter: "Filters",
  mehrFilter: "More filters",
  anwenden: "Apply filters",
  zuruecksetzen: "Remove all filters",
  treffer: (n) => (n === 1 ? "1 mosaic" : `${n} mosaics`),
  weitere: (n) => `Load ${n} more`,
  seite: (p, ps) => `Page ${p} of ${ps}`,
  leer: {
    title: "No mosaic matches all filters",
    text: "Remove a filter, look for a similar colour – or ask us. We will find the right mosaic for you.",
    aehnlich: "Find a similar colour",
    anfrage: "Let us look for you",
  },
  farbe: { label: "Choose a colour", hinweis: "Sorted by similarity to the chosen colour", entfernen: "Remove colour" },
  safe: "Slip-resistant only",
  spezial: "With Corner or Cove",
  sortNaehe: "by colour similarity",
  filterKnopf: (n) => (n ? `Filters (${n})` : "Filters"),
  filterTitel: "Filter mosaics",
  anzeigen: (n) => (n === 1 ? "Show 1 mosaic" : `Show ${n} mosaics`),
  schliessen: "Close filters",
  projektbild: { legend: "Project photo from", hinweis: "Mosaics that Ezarri shows in projects of this kind." },
  eignung:
    "According to the data sheets, almost all Ezarri mosaics are suitable for walls and floors, pools and wellness areas, indoors and outdoors, and so also for bathrooms and kitchens. For wet floors and steps, choose “Slip-resistant only”.",
  weitereArten: (n) => `${n} Safe-Steps and special pieces under “Type”`,
  alleArten: "Also show Safe-Steps and special pieces",
  sortLabel: "Sort",
  sortierung: [
    { id: "empfohlen", label: "Recommended" },
    { id: "name", label: "Name A–Z" },
    { id: "kollektion", label: "Collection" },
    { id: "hell", label: "Colour light → dark" },
  ],
});

export const KARTE = Object.freeze({
  imWasser: "In water:",
  vergleichen: "Compare",
  verglichen: "In comparison",
  merken: (name) => `Save: Ezarri ${name}`,
  vollerVergleich: "At most 4 mosaics in the comparison",
});

export const VERGLEICH = Object.freeze({
  crumb: "Comparison",
  title: "Compare mosaics",
  seoTitle: "Compare Ezarri mosaics",
  leiste: (n) => `Comparison (${n})`,
  oeffnen: "View comparison",
  leeren: "Clear comparison",
  leer: "On the mosaic overview, choose up to four mosaics with “Compare”.",
  zurUebersicht: "To the mosaic overview",
  unterschied: "different",
  gleich: "same",
  nurUnterschiede: "Show differences only",
  entfernen: (name) => `Remove ${name} from the comparison`,
  konfigurator: "This blend in the configurator",
  muster: "Request samples of all",
  nichtMischbar: "According to Ezarri, at least one mosaic cannot be blended.",
  zeilen: {
    kollektion: "Collection",
    format: "Format",
    oberflaeche: "Surface",
    wasser: "Water effect",
    rutsch: "Slip resistance",
    spezial: "Corner / Cove",
    blatt: "Sheet",
    steine: "Tiles per sheet",
    m2karton: "m² per box",
    kgm2: "kg per m²",
    einsatz: "Application",
    mischbar: "Blendable in the configurator",
  },
});

export const DETAIL = Object.freeze({
  preis: "Price on request",
  preisHinweis: "We give you the price with quantity, delivery route and delivery time.",
  muster: "Request samples",
  konfigurator: "View in the configurator",
  rechner: "Calculate quantity",
  merken: "Save",
  gemerkt: "Saved",
  ausfuehrungen: "Versions",
  formate: "Format",
  safe: "Slip-resistant",
  spezial: "Special pieces",
  aufDieserSeite: "on this page",
  massTitle: "Sheet dimensions",
  massLegende: (stein, fuge) => `One tile ${stein}, joint ${fuge}. Drawing not to scale on screen.`,
  fakten: "Technical data",
  verpackung: "Packaging",
  luecke: "not stated by Ezarri",
  rutschKorrigiert: "In the data sheet, the barefoot and shoe values are entered the wrong way round; they are assigned correctly here.",
  aehnlich: "Similar mosaics",
  passtZu: "From the same collection:",
  projekte: "Projects with this mosaic",
  verlegung: "Installation in pools",
  datenblatt: "Collection data sheet",
  ezarriSeite: "Product page at Ezarri",
  fuge: "Recommended grout",
  labels: {
    code: "Code",
    kollektion: "Collection",
    linie: "Line",
    typ: "Type",
    format: "Format",
    stein: "Tile",
    blatt: "Sheet",
    steine: "Tiles per sheet",
    dicke: "Thickness",
    fugeMm: "Joint width",
    oberflaeche: "Surface",
    farbe: "Colour",
    einsatz: "Application",
    wasser: "Water effect",
    rutschBarfuss: "Barefoot (DIN EN 16165 A)",
    rutschSchuh: "Shod (DIN EN 16165 B)",
    rutschPendel: "Pendulum (UNE-EN 16165 C)",
    blattKarton: "Sheets per box",
    m2Karton: "m² per box",
    m2Palette: "m² per pallet",
    kgm2: "Weight",
    mischbar: "Blendable",
  },
  // Lines that are inline text in the German page (mosaike/[referenz]/page.js).
  mischbarJa: "yes, blendable in the configurator",
  mischbarNein: "no, only selectable on its own in the configurator",
  lautEzarri: "according to Ezarri",
  keinBild: "No image available from Ezarri",
  ohneSeite: "(at Ezarri, no page of its own here yet)",
  blattmass: "Sheet size",
  verpackungCaption: "Packaging per format",
  verpackungSpalten: { format: "Format", blatt: "Sheets/box", m2: "m²/box", palette: "m²/pallet", kg: "kg/m²" },
  datenblattPdf: (name) => `Collection data sheet ${name ?? ""} (PDF, English)`.replace(/\s+\(/, " ("),
  video: (name) => `Video of ${name} on YouTube`,
  oeffnetEzarri: "(opens ezarri.com)",
  oeffnetYoutube: "(opens youtube.com)",
  stand: "as of",
  herstellerTitel: "From Ezarri",
  lead: ({ name, kollektion, fmt, oberflaeche, wasser, others }) =>
    [
      `${name} is a glass mosaic from the Ezarri ${kollektion} collection${fmt ? `, here in the ${fmt} version` : ""}${oberflaeche ? `, ${oberflaeche} surface` : ""}.`,
      wasser ? `Water effect according to Ezarri: ${wasser}.` : null,
      others.length ? `The same family is also available as ${others.join(", ")}.` : null,
    ]
      .filter(Boolean)
      .join(" "),
  metaDescription: ({ name, code, kollektion, facts }) => `Ezarri ${name} (${code}) glass mosaic from the ${kollektion} collection. ${facts ? `${facts}. ` : ""}Samples and advice in Lochau.`,
  metaFormat: (fmt) => `${fmt} format`,
  metaWasser: (w) => `water effect ${w}`,
  heading: { typ: "Mosaic", kollektion: (name) => `${name} collection` },
});

export const MISCHUNG = Object.freeze({
  title: "Blend according to Ezarri",
  balken: "Shares of the blend",
  ohneSeite: "no product page of its own at Ezarri",
  quelle: "Recipe: Ezarri, product page",
  quelleKonfigurator: "Recipe: Ezarri, configurator (product page incomplete)",
  quelleLink: "View at Ezarri",
  konfigurator: "This blend in the configurator",
  konfiguratorFertig: "Ready-made blend in the configurator",
  konfiguratorHinweis: "The configurator starts with this recipe. You can change the shares there.",
  muster: "Request samples of the single colours",
  nurFertig: "Only selectable as a ready-made blend in the configurator",
  zeile: "Blend",
});

export const GALERIE = Object.freeze({
  crumb: "Gallery",
  eyebrow: "Projects with Ezarri mosaic",
  title: "Gallery",
  seoTitle: "Projects with Ezarri glass mosaic: gallery",
  description: "Over 1,000 project photos with Ezarri glass mosaic: pools, spas, bathrooms and kitchens. Filter by application, water colour and collection.",
  lead: "Project photos by Ezarri, each with the mosaic used.",
  diesesMosaik: (name) => `Mosaic: ${name}`,
  filterTitel: "Filter the gallery",
  einsatz: [
    { id: "pool-privat", label: "Private pool" },
    { id: "pool-oeffentlich", label: "Public pool and hotel" },
    { id: "wellness", label: "Wellness and spa" },
    { id: "bad", label: "Bathroom" },
    { id: "kueche", label: "Kitchen" },
  ],
  anzeigen: (n) => (n === 1 ? "Show 1 photo" : `Show ${n} photos`),
  laedt: "Loading …",
  videos: {
    link: (n) => `Videos (${n})`,
    title: "Product videos by Ezarri",
    text: "Short films about individual mosaics, not projects. They open on YouTube.",
  },
  video: "Watch the video on YouTube",
  videoHinweis: "Opens youtube.com in a new tab.",
  oeffnen: "View photo large",
  schliessen: "Close",
  vor: "Next photo",
  zurueck: "Previous photo",
  leer: "There are no project photos for these filters.",
  treffer: (n) => (n === 1 ? "1 project photo" : `${n} project photos`),
});

export const TECHNIK = Object.freeze({
  crumb: "Technical",
  eyebrow: "Technical",
  title: "Technical information and installation",
  seoTitle: "Ezarri glass mosaic: technical data, installation, care",
  description: "JointPoint, installation by pool type, care, frequently asked questions and all Ezarri data sheets as PDF.",
  lead: "Manufacturer information from Ezarri, summarised in our own words. Installation is carried out by a specialist tiling firm.",
  bereiche: [
    { href: "/ezarri/technik/jointpoint", title: "JointPoint", text: "How the tiles hold together without paper or mesh." },
    { href: "/ezarri/technik/verlegung", title: "Installation", text: "Steps by pool type: concrete, steel, polystyrene, polypropylene, polyester." },
    { href: "/ezarri/technik/pflege", title: "Care", text: "Cleaning, limescale, grout residue, chemicals." },
    { href: "/ezarri/technik/fragen", title: "Frequently asked questions", text: "18 answers, from material to delivery time." },
    { href: "/ezarri/technik/downloads", title: "Downloads", text: "Data sheets, certificates and warranty as PDF." },
    { href: "/ezarri/rechner", title: "Mosaic calculator", text: "m², boxes, adhesive and grout for your pool." },
  ],
  fachbetrieb: "Installation is carried out by a specialist tiling firm. We supply mosaic, data sheets and samples and coordinate dates.",
});

export const JOINTPOINT = Object.freeze({
  crumb: "JointPoint",
  title: "JointPoint: bonding points instead of paper and mesh",
  seoTitle: "Ezarri JointPoint explained",
  description: "How JointPoint holds Ezarri mosaic tiles together: point bonding, 92 % free back surface, according to Ezarri up to 25 % faster to install.",
  lead: "With many mosaics, paper on the front or a mesh on the back holds the tiles together. Ezarri instead joins the tiles with small, flexible bonding points at the edges.",
  punkte: [
    ["More bonding surface", "According to Ezarri, 92 % of the back stays free for the adhesive. No paper or mesh lies between tile and adhesive."],
    ["Faster to install", "According to Ezarri, up to 25 % less installation time than with paper-faced mosaics, because no paper has to be removed."],
    ["Flexible", "The sheet follows curves, for example on steps, benches and hot tubs, and is easy to cut."],
    ["Moisture", "According to Ezarri, the points do not expand with moisture, do not shrink and do not break."],
  ],
  grafik: {
    title: "The back compared",
    netz: "Mesh: fibres lie between tile and adhesive",
    papier: "Paper: front glued, must be removed",
    joint: "JointPoint: points at the edges, back free",
  },
});

/** Installation by pool type. Source: ezarri.com/en/installation and sub-pages, 28.10.2026. */
export const VERLEGUNG = Object.freeze({
  crumb: "Installation",
  title: "Installation by pool type",
  seoTitle: "Installing glass mosaic in a pool: steps by pool type",
  description: "Installing Ezarri glass mosaic: steps for concrete, steel, polystyrene, polypropylene and polyester pools according to the manufacturer.",
  lead: "Choose your pool type. The steps summarise Ezarri's installation guide. Your tiler chooses adhesive and grout according to the manufacturers' data sheets.",
  waehlen: "Pool type",
  hinweisKelle: "In the installation guide for concrete, Ezarri states a 6 mm notched trowel; in the FAQ, a 3 mm notched trowel. Your tiler follows the adhesive's data sheet.",
  typen: [
    {
      id: "beton",
      label: "Concrete",
      schritte: [
        ["Prepare the substrate", "Level, clean, load-bearing and dry: residual moisture below 3 %."],
        ["Choose the adhesive", "Cementitious adhesive of at least class C2TE (EN 12004)."],
        ["Apply the adhesive", "Spread evenly with a notched trowel, 6 mm according to the installation guide."],
        ["Lay the sheets", "Place the JointPoint sheets and press them down."],
        ["Align", "Straighten the joints with a rubber float."],
        ["Choose the grout", "Epoxy grout of class RG. Alternatively a high-quality cement grout CG2, which according to Ezarri needs renewing after about 5–6 years."],
        ["Grout", "Work in with a soft rubber float, remove the excess."],
        ["Clean", "Clean with water and a sponge float."],
        ["Final clean", "After 24 hours, clean again with a post-construction cleaner."],
      ],
    },
    {
      id: "stahl",
      label: "Galvanised steel",
      schritte: [
        ["Waterproof the walls", "Apply self-adhesive waterproofing membranes to the steel walls."],
        ["Seal the wall joints", "Close the joints with waterproof tape and a suitable adhesive."],
        ["Waterproof the floor", "Apply membranes to the whole concrete slab, overlapping by 5 cm, and bond the overlaps."],
        ["Floor-to-wall junction", "Seal with the same flexible tape and adhesive."],
        ["Seal the fittings", "Connect skimmers, lights and nozzles to the membrane with a special sealant."],
        ["Lay the mosaic", "With the recommended adhesive and grout, as for a concrete pool."],
      ],
    },
    {
      id: "polystyrol",
      label: "Polystyrene",
      schritte: [
        ["Waterproof the pool", "Lay a suitable waterproofing membrane, overlapping by 5 cm."],
        ["Close the overlaps", "Bond with the product recommended by Ezarri."],
        ["Seal the fittings", "Connect skimmers, lights and nozzles to the membrane with sealant."],
        ["Lay the mosaic", "With the recommended adhesive and grout."],
      ],
    },
    {
      id: "polypropylen",
      label: "Polypropylene",
      schritte: [
        ["Waterproof the walls", "Apply self-adhesive waterproofing membranes to the walls."],
        ["Seal the wall joints", "With waterproof tape and a suitable adhesive."],
        ["Waterproof the floor", "Apply membranes to the concrete slab, overlapping by 5 cm, and bond the overlaps."],
        ["Floor-to-wall junction", "With the same flexible tape and adhesive."],
        ["Seal the fittings", "Connect skimmers, lights and nozzles with sealant."],
        ["Lay the mosaic", "With the recommended adhesive and grout."],
      ],
    },
    {
      id: "polyester",
      label: "Polyester",
      schritte: [
        ["Sand", "Sand the whole pool surface."],
        ["Remove dust", "Remove sanding dust and dirt with acetone."],
        ["Choose the adhesive", "Reactive resin adhesive based on polyurethane or epoxy that absorbs movement."],
        ["Apply the adhesive", "Spread with a 3 mm notched trowel."],
        ["Lay the sheets", "Place with JointPoint and press down."],
        ["Grout", "With epoxy grout."],
        ["Final clean", "After 24 hours, clean again with a post-construction cleaner."],
      ],
    },
  ],
  schritte: "Steps",
  quelle: "Steps according to Ezarri's installation guide (ezarri.com/en/installation), summarised in our own words.",
});

export const PFLEGE = Object.freeze({
  crumb: "Care",
  title: "Caring for glass mosaic",
  seoTitle: "Cleaning and caring for glass mosaic",
  description: "Cleaning glass mosaic: grout residue, limescale, pool chemicals, bathroom and cutting. Guidance based on Ezarri's care topics.",
  lead: "Glass is dense and easy to care for. Most questions concern the grout and residue from installation. Always test cleaners on an inconspicuous area first and follow the cleaner and grout manufacturers' instructions.",
  themen: [
    ["Removing epoxy residue", "Fresh residue can be removed with water and a sponge float. Cured haze is removed with an epoxy cleaner specified by the grout manufacturer."],
    ["Why epoxy grout", "Epoxy grouts are dense and more resistant to pool chemicals than cement grouts. According to Ezarri, cement grouts in pools need renewing after about 5–6 years."],
    ["Removing limescale", "Loosen limescale rings at the waterline with a suitable acidic cleaner, then rinse well with water. The grout must be suitable for the cleaner."],
    ["Chemicals and glass", "According to Ezarri, the glass resists common pool care products and is suitable for salt electrolysis. The grout is usually the more sensitive part."],
    ["Cement grout residue", "After curing, remove cement haze with a cement haze remover. Do not scratch or scour the glass."],
    ["Filling the pool", "A pool with mosaic is only filled once adhesive and grout have cured according to their manufacturers."],
    ["Cleaning bathrooms", "A mild cleaning agent and a soft cloth are enough. Scouring agents and steel wool scratch surfaces such as mother-of-pearl or metal."],
    ["Cutting mosaic", "JointPoint sheets can be divided between the tiles. Single tiles are cut with glass mosaic nippers."],
  ],
  quelle: "Topics based on Ezarri's care section (ezarri.com/en/maintenance-of-mosaic). The texts are our summary, not manufacturer texts.",
});

/** 18 questions, own answers. Facts from ezarri.com/en/faqs (28.10.2026). */
export const FRAGEN = Object.freeze({
  crumb: "Frequently asked questions",
  title: "Frequently asked questions about Ezarri glass mosaic",
  seoTitle: "Ezarri glass mosaic: frequently asked questions",
  description: "Material, recycled glass, JointPoint, water colour, adhesive and grout, delivery time and buying: answers about Ezarri glass mosaic.",
  liste: [
    ["What is JointPoint?", "Ezarri's way of joining the tiles: small flexible bonding points at the edges instead of paper or mesh. According to Ezarri, 92 % of the back stays free for the adhesive."],
    ["Why is JointPoint suitable for pools and spas?", "Because nothing lies between tile and adhesive. According to Ezarri, it saves up to 25 % installation time compared with paper and resists moisture and chemicals."],
    ["What is the glass made of?", "According to Ezarri, 100 % recycled glass as raw material, confirmed under ISO 14021. The finished mosaic contains at least 96 % post-consumer glass, the rest being colourants and the bonding points."],
    ["What does the environmental certificate say?", "The self-declaration under ISO 14021 confirms the recycled content. You will find the PDF under Downloads."],
    ["Where is it produced?", "In Lazkao (Gipuzkoa, Spain), which is also home to production and the central warehouse. Ezarri names logistics sites in Castellón, Sassuolo and Miami."],
    ["Is everything made in Spain?", "According to Ezarri, yes: all mosaics come from Lazkao. About 70 % of production is exported."],
    ["How long does mosaic last in a pool?", "According to Ezarri, glass absorbs no water, is chemically inert and resists temperature changes. Installed correctly, it does not fade. The grout is the part that needs care."],
    ["How does the mosaic affect the water colour?", "White gives sky blue to turquoise water, beige and pink a transparent green, grey a grey with blue or green hints, black and dark green a mountain-lake tone. Dark blue makes the water look deeper. More under Water colour."],
    ["How is it installed?", "Smooth, clean, dry substrate, flexible C2TE adhesive, press the sheets down and align them, grout with epoxy, remove residue. The steps by pool type are under Installation."],
    ["Which adhesives and grouts?", "Adhesive of at least C2TE under EN 12004. As grout, Ezarri recommends epoxy (RG), alternatively a high-quality cement grout (CG2)."],
    ["Can mosaic go on polyester or prefabricated pools?", "Yes, with an elastic reactive resin adhesive (epoxy or polyurethane) that absorbs movement. The surface is sanded first."],
    ["How long does a cement grout last in a pool?", "According to Ezarri, about 5–6 years; then the pool needs regrouting. Epoxy grouts last longer."],
    ["Why do tiles come loose in pools?", "Usually because of poor substrate preparation, the wrong adhesive, or paper and mesh between tile and adhesive. With JointPoint, nothing lies in between."],
    ["How long does delivery take?", "According to Ezarri, 95 % of the mosaics are available from stock and orders are prepared within 24–48 hours. We give you the delivery date to Lochau or to you with the quote."],
    ["Which formats are there?", "Square 25 mm and 50 mm, Hexa at 33.4 × 33.4 mm, plus the special pieces Corner and Cove. The formats of each mosaic are on its mosaic page."],
    ["Where can I see samples?", "With us in the showroom café in Lochau. Choose up to six mosaics, and we will order the samples for your appointment."],
    ["How to buy Ezarri mosaic from us", "Ezarri does not sell directly to private customers. At Platzhirsch you get advice, samples, a quantity calculation and a quote. Send us your selection or a configurator link."],
    ["Is availability shown online?", "Ezarri shows stock only on its own website. We check the quantity for your project with the quote."],
  ],
});

export const DOWNLOADS = Object.freeze({
  crumb: "Downloads",
  title: "Data sheets and certificates",
  seoTitle: "Ezarri data sheets and certificates (PDF)",
  description: "All Ezarri data sheets by collection, ISO 9001, ISO 14021 and warranty as PDF. Catalogues on request.",
  lead: "The PDFs come from Ezarri. The data sheets are in English.",
  datenblaetter: "Data sheets by collection",
  zertifikate: "Certificates and warranty",
  alt: "Data sheets of earlier collections",
  altHinweis: "Ezarri no longer lists these collections on its website.",
  kataloge: { title: "Catalogues", text: "Ezarri only releases its eight catalogues (including Pool & Home, Gea, Terrazzo, Gold, Aquarelle, Gemma) on request.", link: "Request a catalogue" },
  quelleLink: "Original at Ezarri",
  zertifikatListe: [
    { datei: "calidad_de_ISO9001.pdf", title: "ISO 9001 quality management", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/calidad/de/ISO9001.pdf" },
    { datei: "medioambientales_de_ISO-14021.pdf", title: "ISO 14021 recycled content", sprache: "deutsch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/medioambientales/de/ISO-14021.pdf" },
    { datei: "certificaciones_garantia-mosaicos_Ezarri_-_Warranty_on_mosaics_-_EN-2025.pdf", title: "Warranty on mosaics (2025)", sprache: "englisch", quelle: "https://www.ezarri.com/media/pdf/area-tecnica/certificaciones/garantia-mosaicos/Ezarri%20-%20Warranty%20on%20mosaics%20-%20EN-2025.pdf" },
  ],
});

export const SCHLUSS = Object.freeze({
  title: "See samples, plan your pool",
  text: "In the showroom café in Lochau we lay the mosaics side by side and work out the quantity for your project.",
  primary: "Request an appointment",
  secondary: "Request samples",
});

/** Labels for type, surface etc. (display, not filter ids). */
export const TYP_LABEL = Object.freeze({ mosaik: "Mosaic", "safe-step": "Safe-Step, slip-resistant", corner: "Corner, outside edge", cove: "Cove, inside cove" });
export const LINIE_LABEL = Object.freeze({ Premium: "Premium", Classic: "Classic", Custom: "Custom" });

/** Alt texts (concept §6.3). */
export const alt = {
  mosaik: (name, format, oberflaeche) => ["Ezarri " + name, format ? `glass mosaic ${format}` : "glass mosaic", oberflaeche].filter(Boolean).join(", "),
  anwendung: (name, wasser) => [name ? `Project with Ezarri ${name}` : "Project with Ezarri glass mosaic", wasser].filter(Boolean).join(", "),
};
