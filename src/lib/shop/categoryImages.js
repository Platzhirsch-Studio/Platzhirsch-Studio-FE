// Ambient photo (from /public/Images) for each shop category, used on the
// /produkte hub when the Produkte Kategorie CMS row has no image of its own —
// so every tile shows a fitting room shot instead of the same fallback banner.
// Keyed by category slug (the ProductsMenu keys in messages/*.json); each
// photo is used once, so no two tiles on the hub look alike.
const CATEGORY_IMAGES = {
  // Sofas & Sessel
  "sofas-couches": "/Images/Footer/detailed-room.jpg",
  "corner-sofas": "/Images/Home/secondAboutHome.jpg",
  "sleeper-sofas": "/Images/Home/orionMinoti.jpg",
  "chaise-longues-daybeds": "/Images/Home/inspiration.jpg",
  "armchairs-stools": "/Images/Home/bannerImage.jpg",
  "leather-sofas": "/Images/Newsletter/kontaktImage.jpg",
  // Stühle & Tische
  "dining-chairs": "/Images/Wohnen/bannerImage3.jpg",
  "bar-stools": "/Images/Kuche/bannerImageKuche3.jpg",
  "desk-chairs": "/Images/Arbeiten/bannerImageArbeiten1.jpg",
  "dining-tables": "/Images/Newsletter/indoor-dinner-space.jpg",
  // QM wm-fix3: grey.jpg/bannerImage10.jpg are the same photo with a white
  // wedge top right, and bannerImage4.jpg is the sofa room of "Sofas &
  // Couches" again – each replaced by a photo used nowhere else on the hub.
  "coffee-tables": "/Images/Home/aboutHome.jpg",
  "side-tables": "/Images/Wohnen/bannerImage1.jpg",
  // Schlafzimmer
  beds: "/Images/Home/bannerImage-1.jpg",
  "night-tables": "/Images/Home/bannerImage-2.jpg",
  wardrobes: "/Images/Wohnen/bannerImage6.jpg",
  bedwear: "/Images/Accessories/bannerImageAccessories3.jpg",
  // Aufbewahrung
  "sideboards-chests": "/Images/Home/bannerImage-4.jpg",
  shelves: "/Images/Wohnen/bannerImage7.jpg",
  "tv-low-units": "/Images/Home/slider/minotti-sofa-wohnzimmer.webp",
  "display-cabinets": "/Images/Footer/14.jpg",
  "small-furniture": "/Images/Wohnen/bannerImage9.jpg",
  // Outdoor
  "garden-tables": "/Images/Outdoor/bannerImage2.jpg",
  "garden-chairs": "/Images/Outdoor/bannerImage4.jpg",
  "lounge-furniture-daybeds": "/Images/Outdoor/bannerImage1.jpg",
  "sun-loungers": "/Images/Home/secondImage.jpg",
  parasols: "/Images/Outdoor/bannerImage5.jpg",
  heaters: "/Images/Newsletter/minotti-patio.jpg",
  // Wohnaccessoires
  lamps: "/Images/Licht/bannerImageLicht2.jpg",
  rugs: "/Images/Licht/bannerImageLicht1.jpg",
  decor: "/Images/Accessories/bannerImageAccessories1.jpg",
  mirrors: "/Images/UberUns/gold-vase.jpg",
  "kitchen-accessories": "/Images/Kuche/bannerImageKuche2.jpg",
  kitchen: "/Images/Home/Poliform-Kitchen.jpg",
  candles: "/Images/Accessories/bannerImageAccessories2.jpg",
};

// For a category the map above doesn't know yet (new in the CMS): rotate
// through a few neutral room shots rather than repeating one banner.
const GENERIC_IMAGES = [
  "/Images/Outdoor/bannerImage3.jpg",
  "/Images/Home/bannerImage-5.jpg",
  "/Images/Kontakt/poliform.webp",
  "/Images/Home/thidImage.jpg",
];

// Photos with a white border baked into one edge (wardrobes: ~9 % white
// stripe on the right). The tile shows them in a wider, left-anchored box
// inside its overflow-hidden frame, so the stripe falls outside – a CSS crop,
// the file itself stays unchanged.
const TRIM_RIGHT = new Set(["/Images/Wohnen/bannerImage6.jpg"]);

/** Class for the box around a tile photo (absolute, inside the overflow-hidden frame). */
export function categoryImageBoxClass(src) {
  return TRIM_RIGHT.has(src) ? "absolute inset-y-0 left-0 w-[110%]" : "absolute inset-0";
}

export function getCategoryImage(slug, index = 0) {
  return CATEGORY_IMAGES[slug] || GENERIC_IMAGES[index % GENERIC_IMAGES.length];
}
