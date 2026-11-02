// Static content of the "Galerie" prototype. Facts only from the live site
// (src/messages/de.json, layout JSON-LD) and the backoffice. No dealer claims,
// no invented references, prices or awards.

export const BASE = "/de/preview/galerie";

export const STUDIO = {
  name: "Platzhirsch Home Living",
  street: "Landstraße 11",
  city: "6911 Lochau",
  region: "Vorarlberg, Österreich",
  phone: "+43 5574 46255",
  phoneHref: "tel:+43557446255",
  email: "info@platzhirsch.studio",
  maps: "https://maps.google.com/?cid=10377983053407187294",
  hours: [
    ["Montag", "Ruhetag"],
    ["Dienstag – Freitag", "10 – 18 Uhr"],
    ["Samstag", "10 – 14 Uhr"],
  ],
};

// Live-site targets for links that leave the prototype.
export const SITE = {
  termin: "/de/beratung",
  kontakt: "/de/kontakt",
  marken: "/de/ueber-uns/marken",
  produkte: "/de/produkte",
  wohnen: "/de/wohnzimmer-einrichten-vorarlberg",
  kueche: "/de/kuechen-vorarlberg",
  interior: "/de/interior-design-vorarlberg",
  team: "/de/ueber-uns/team",
  news: "/de/news",
  impressum: "/de/impressum",
  datenschutz: "/de/datenschutz",
};

export const NAV = [
  { label: "Wohnen", href: `${BASE}#raeume` },
  { label: "Marken", href: `${BASE}#marken` },
  { label: "Das Haus", href: `${BASE}#haus` },
  { label: "Service", href: `${BASE}#service` },
];

export const IMAGES = {
  hero: { src: "/Images/Home/aboutHome.jpg", alt: "Weitläufiger Wohnraum mit hellen Sofas, Sesseln und einem langen Kamin vor einer Fensterfront" },
  intro: { src: "/Images/Wohnen/bannerImage9.jpg", alt: "Heller Raum mit Stehleuchte und Konsole vor einer Glaswand mit schwarzen Sprossen" },
  wohnen: { src: "/Images/Wohnen/bannerImage4.jpg", alt: "Wohnzimmer mit großem hellem Ecksofa, Sesseln und Couchtisch auf einem Teppich" },
  kueche: { src: "/Images/Kuche/bannerImageKuche1.jpg", alt: "Küche mit weißer Kochinsel, dunklen Hochschränken und großem Fenster" },
  outdoor: { src: "/Images/Outdoor/bannerImage3.jpg", alt: "Terrasse mit Loungemöbeln unter freiem Himmel, im Hintergrund Zypressen und Landschaft" },
  marken: { src: "/Images/Vernissage/minotti-wohnwelt.jpg", alt: "Wohnszene mit hellem Sofa und rundem Hocker in warmem Licht" },
  showroom: { src: "/Images/Home/secondAboutHome.jpg", alt: "Ausstellungsfläche mit dunkler Decke, Sofas und Sesseln in mehreren Wohnsituationen" },
  service: { src: "/Images/Outdoor/bannerImage4.jpg", alt: "Gedeckter Außentisch mit weißen Stühlen unter Pinien, dahinter das Meer" },
  termin: { src: "/Images/Wohnen/bannerImage2.jpg", alt: "Runder dunkler Esstisch mit Stuhl und einer kreisförmigen Pendelleuchte vor heller Wand" },
};

// Brand list for the typographic "Markenwelt". All are active brands in the
// backoffice. Wording elsewhere: "führen wir in der Ausstellung" – never
// "offizieller Händler".
export const BRANDS = [
  { name: "Minotti", origin: "Italien", href: `${BASE}/marken/minotti` },
  { name: "Poliform", origin: "Italien", slug: "poliform" },
  { name: "Rimadesio", origin: "Italien", slug: "rimadesio" },
  { name: "Flos", origin: "Italien", slug: "flos" },
  { name: "Paola Lenti", origin: "Italien", slug: "paola-lenti" },
  { name: "ClassiCon", origin: "Deutschland", slug: "classicon" },
  { name: "Tom Dixon", origin: "Großbritannien", slug: "tom-dixon" },
  { name: "Gloster", origin: "Großbritannien", slug: "gloster" },
  { name: "Tonon", origin: "Italien", slug: "tonon" },
].map((b) => ({ ...b, href: b.href || `${SITE.marken}/${b.slug}` }));

export const ROOMS = [
  { key: "wohnen", title: "Wohnen", text: "Sofas, Sessel, Tische und Licht – zusammengestellt wie in einem bewohnten Raum.", href: SITE.wohnen, image: IMAGES.wohnen },
  { key: "kueche", title: "Küche", text: "Planung von der ersten Skizze bis zur Montage, mit Blick auf das ganze Haus.", href: SITE.kueche, image: IMAGES.kueche },
  { key: "outdoor", title: "Outdoor", text: "Möbel für Terrasse, Garten und See, die Wind und Wetter standhalten.", href: SITE.produkte, image: IMAGES.outdoor },
];

// Dreiländer-Service: what the live site states today (delivery and assembly
// throughout Austria; projects in DE/CH on request). A CHF fixed price is a
// plan in the Masterkonzept, not an offer yet – so it is not promised here.
export const COUNTRIES = [
  { code: "AT", name: "Österreich", text: "Beratung in Lochau, Lieferung und Montage durch unser Team in ganz Österreich." },
  { code: "DE", name: "Deutschland", text: "Lindau und das bayerische Ufer liegen wenige Minuten entfernt. Projekte besprechen wir gerne persönlich." },
  { code: "CH", name: "Schweiz", text: "Lieferung, Verzollung und Montage klären wir für Ihr Projekt im Einzelnen." },
  { code: "FL", name: "Liechtenstein", text: "Für Projekte in Liechtenstein stimmen wir Lieferung und Montage individuell mit Ihnen ab." },
];
