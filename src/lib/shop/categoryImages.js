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
  "coffee-tables": "/Images/Footer/grey.jpg",
  "side-tables": "/Images/Wohnen/bannerImage1.jpg",
  // Schlafzimmer
  beds: "/Images/Home/bannerImage-1.jpg",
  "night-tables": "/Images/Home/bannerImage-2.jpg",
  wardrobes: "/Images/Wohnen/bannerImage6.jpg",
  bedwear: "/Images/Accessories/bannerImageAccessories3.jpg",
  // Aufbewahrung
  "sideboards-chests": "/Images/Home/bannerImage-4.jpg",
  shelves: "/Images/Wohnen/bannerImage7.jpg",
  "tv-low-units": "/Images/Wohnen/bannerImage4.jpg",
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
  rugs: "/Images/Wohnen/bannerImage10.jpg",
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

export function getCategoryImage(slug, index = 0) {
  return CATEGORY_IMAGES[slug] || GENERIC_IMAGES[index % GENERIC_IMAGES.length];
}
