// Static copy and facts for the "Bühne" prototype. Facts (address, phone,
// hours, brand list) mirror the live site's structured data in
// src/app/[locale]/layout.js. No dealer claims, prices or testimonials.

export const BASE = "/de/preview/buehne";

export const NOINDEX = { index: false, follow: false, googleBot: { index: false, follow: false } };

export const CONTACT = {
  street: "Landstraße 11",
  city: "6911 Lochau, Vorarlberg",
  tel: "+43 5574 46255",
  telHref: "tel:+43557446255",
  mail: "info@platzhirsch.studio",
  instagram: "https://www.instagram.com/platzhirsch.studio/",
  maps: "https://maps.google.com/?cid=10377983053407187294",
};

export const HOURS = [
  { days: "Di – Fr", time: "10:00 – 18:00" },
  { days: "Sa", time: "10:00 – 14:00" },
];

// Rooms for the scroll story. Images: existing files in public/Images.
export const ROOMS = [
  {
    id: "wohnen",
    num: "01",
    title: "Wohnen",
    kicker: "Ankommen",
    text: "Sofas, in die man sich fallen lässt, Tische, an denen man länger bleibt. Wir stellen Ihnen Räume zusammen – nicht Einzelstücke.",
    image: "/Images/Wohnen/bannerImage4.jpg",
    alt: "Helles Wohnzimmer mit großem Ecksofa, Sesseln und Couchtisch",
    link: { href: "/de/wohnzimmer-einrichten-vorarlberg", label: "Wohnen entdecken" },
  },
  {
    id: "kueche",
    num: "02",
    title: "Küche",
    kicker: "Zusammenkommen",
    text: "Die Küche ist der Ort, an dem ein Haus lebt. Wir planen sie mit Ihnen gemeinsam mit dem Essplatz und dem Wohnraum daneben.",
    image: "/Images/Kuche/bannerImageKuche1.jpg",
    alt: "Dunkle Küche mit weißer Kochinsel, hohen Schrankfronten und Fenster zum Garten",
    link: { href: "/de/kuechen-vorarlberg", label: "Küchen planen" },
  },
  {
    id: "schlafen",
    num: "03",
    title: "Schlafen",
    kicker: "Zur Ruhe kommen",
    text: "Gepolsterte Betten, ruhige Stoffe, warmes Licht. Ein Schlafzimmer, das am Abend leiser wird.",
    image: "/Images/Home/bannerImage-1.jpg",
    alt: "Schlafzimmer in dunklen Tönen mit gepolstertem Bett und großer Fensterfront",
    link: { href: "/de/produkte", label: "Betten im Katalog" },
  },
  {
    id: "outdoor",
    num: "04",
    title: "Outdoor",
    kicker: "Draußen sein",
    text: "Lounge und Tafel für Terrasse, Garten und Seegrundstück – wetterfest und so wohnlich wie drinnen.",
    image: "/Images/Outdoor/bannerImage5.jpg",
    alt: "Outdoor-Lounge mit gelben Kissen auf einer Terrasse über dem Meer",
    link: { href: "/de/produkte", label: "Outdoor im Katalog" },
  },
];

// Brands shown in the showroom (same list as the site's schema.org "brand").
// Wording rule: "in unserer Ausstellung", never "offizieller Händler".
export const BRANDS = [
  "Minotti",
  "Poliform",
  "Rimadesio",
  "Flos",
  "Paola Lenti",
  "Tom Dixon",
  "Eichholtz",
  "Gloster",
  "Tonon",
  "ClassiCon",
  "next125",
  "Tréca",
  "101 Copenhagen",
  "Tuuci",
  "Trapa",
  "Umbrosa",
  "solpuri",
];

export const FEATURED_BRANDS = [
  {
    name: "Minotti",
    line: "Minotti bei uns erleben",
    href: `${BASE}/marken/minotti`,
    image: "/Images/Home/orionMinoti.jpg",
    alt: "Dunkle Wohnlandschaft mit niedrigem Sofa und Holzpaneelen",
  },
  {
    name: "Poliform",
    line: "Küche und Wohnen aus einer Hand",
    href: "/de/ueber-uns/marken/poliform",
    image: "/Images/Home/Poliform-Kitchen.jpg",
    alt: "Offene Küche mit Holzinsel, Esstisch und Lederstühlen",
  },
  {
    name: "Rimadesio",
    line: "Regale, Türen, Systeme",
    href: "/de/ueber-uns/marken/rimadesio",
    image: "/Images/Home/Rimadesio-Modulor-1.jpg",
    alt: "Wandregal aus Nussholz mit Bücherborden und Sideboard",
  },
];

export const COUNTRIES = [
  { code: "AT", name: "Österreich", text: "Beratung im Showroom Lochau oder bei Ihnen vor Ort, Lieferung und Montage." },
  { code: "DE", name: "Deutschland", text: "Lindau, Allgäu und Nordufer: Lochau liegt direkt an der Grenze." },
  { code: "CH", name: "Schweiz", text: "Planung für Ostschweiz und St. Gallen, Abwicklung über die Grenze auf Anfrage." },
  { code: "FL", name: "Liechtenstein", text: "Projekte in Liechtenstein, von der ersten Skizze bis zur Montage." },
];
