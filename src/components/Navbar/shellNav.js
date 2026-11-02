// Information architecture of the shell ("Raum zuerst", Design-Bibel §10.1):
//   Wohnen · Küche · Bad · Schlafen · Outdoor & Pool · Marken · Planen & Erleben · Das Haus
//   (Inhaber-Entscheidung Nr. 9 + Usability-Gutachten 3.1, integration.md;
//   „Bad“ als eigener Punkt: Inhaber 31.10.2026)
// Pure functions, no React: the header, the mobile menu and the footer all
// build their links from here, so a route exists in exactly one place.
//
// All hrefs are WITHOUT locale prefix (next-intl Link adds it). Absolute URLs
// (café, route planner) stay external.

import { ROUTES, productsPath } from "@/utils/routing";
import { brandHref, featuredBrands } from "@/lib/content/brands";
import { LANDING_PAGE_SLUGS } from "@/lib/content/landingPages";
import { EXTRA_PAGES } from "@/lib/seo/sitemap/extraPages";
import deOnly from "@/lib/seo/deOnlyRedirects.cjs";
import { DIRECTIONS_URL } from "@/lib/site";
import { findActiveRoom, isCurrent, isGermanOnlyPath, translatePathWith } from "./navMatch";
import { enabledFeatures, featuresFor } from "@/lib/features";
import { ezarriInNavigation, ezarriPath } from "@/lib/ezarri/config";
import { showroomMode } from "@/lib/showroom/config";
import { withContext } from "@/lib/forms/beratungContext";
import { referralPagePublic } from "@/lib/kundenbetreuung/empfehlung";
// Shop-Texte server-only (nicht im Client-Messages-Budget); kein Katalog-Import.
import { startCopy } from "@/lib/shop/startCopy";

// Route matching lives in ./navMatch.js (client islands import it directly).
export { findActiveRoom, isCurrent };

export const CAFE_URL = "https://platzhirsch.cafe/";

const route = (key, locale) => ROUTES[key]?.[locale] || ROUTES[key]?.de;

// Sprach-Integration 01.11.2026: Menütexte der neu übersetzten Seiten, für die
// es keinen Shell-Schlüssel gibt. Serverseitig hier statt in src/messages
// (Client-Budget ≤ 35 KB, FR liegt an der Grenze). Gleiche Namen wie auf den
// Seiten selbst (Stil-Finder: stilfinder/intl ui.name; Küchenplaner: Seitentitel;
// Dreiländer-Rechner: dreilaender/copy-intl name; Wohnzimmer: landingKern META).
const INTL_NAV = Object.freeze({
  en: { kuechenplaner: "Kitchen planner", stilfinder: "Style Finder", dreilaender: "Three-country calculator", wohnzimmer: "Living room design" },
  fr: { kuechenplaner: "Planificateur de cuisine", stilfinder: "Test de style", dreilaender: "Calculateur trois pays", wohnzimmer: "Aménager son séjour" },
  it: { kuechenplaner: "Configuratore cucina", stilfinder: "Test di stile", dreilaender: "Calcolatore tre Paesi", wohnzimmer: "Arredare il soggiorno" },
});
/** Menütext in `locale` (DE: undefined → features.js-Text bzw. deutscher Text). */
export const intlNavLabel = (locale, key) => INTL_NAV[locale]?.[key];

// Category keys that decide which room a ProductsMenu group belongs to.
// Keys are identical in every locale, titles are not.
const ROOM_OF_KEY = {
  beds: "sleeping",
  "night-tables": "sleeping",
  wardrobes: "sleeping",
  bedwear: "sleeping",
  kitchen: "kitchen",
  "kitchen-accessories": "kitchen",
  "garden-tables": "outdoor",
  "garden-chairs": "outdoor",
  "lounge-furniture-daybeds": "outdoor",
  "sun-loungers": "outdoor",
  parasols: "outdoor",
  heaters: "outdoor",
};

// Herstellerkatalog im Menü (Inhaber 31.10.2026: Bad, Whirlpools & Swimspas,
// Marken). Schlanke Tabelle statt Import von src/lib/katalog: die Markendateien
// (zusammen mehrere MB) kämen sonst mit dem Layout in JEDE Seite.
// tests/unit/nav-katalog.test.mjs gleicht sie mit dem Katalog ab (nur
// Kategorien/Marken mit Produkten, Namen wie MARKE.name, Reihenfolge wie
// markenMitProdukten). Kategorien: [Katalog-Schlüssel, Shell-Label-Schlüssel].
const KATALOG_BASE = { "bad-wellness": "/bad-wellness", kuechengeraete: "/kuechengeraete", accessoires: "/accessoires" };
const katalogKategoriePath = (key) => `/bad-wellness/kategorie/${key}`;
export const NAV_KATALOG = Object.freeze({
  bath: [
    ["waschtisch", "nav.catWashbasins"],
    ["badewanne", "nav.catBathtubs"],
    ["armatur", "nav.catTaps"],
    ["dusche", "nav.catShowers"],
    ["spiegel", "nav.catMirrors"],
    ["badmoebel", "nav.catBathFurniture"],
    ["handtuchwaermer", "nav.catTowelWarmers"],
  ],
  wellness: [
    ["sauna", "nav.catSaunas"],
    ["dampfbad", "nav.catSteamBaths"],
    ["infrarot", "nav.catInfrared"],
    ["waermeliege", "nav.catHeatedLoungers"],
    ["ruheliege", "nav.catRestLoungers"],
    ["floating", "nav.catFloating"],
  ],
  spa: [
    ["whirlpool", "nav.catWhirlpools"],
    ["swimspa", "nav.catSwimspas"],
    ["cold-plunge", "nav.catColdPlunge"],
  ],
  // [slug, Name] je Welt – Reihenfolge wie markenMitProdukten(welt).
  marken: {
    kuechengeraete: [
      ["gaggenau", "Gaggenau"],
      ["miele", "Miele"],
      ["v-zug", "V-ZUG"],
      ["bora", "BORA"],
      ["liebherr", "Liebherr"],
      ["quooker", "Quooker"],
      ["dornbracht", "Dornbracht"],
    ],
    "bad-wellness": [
      ["agape", "Agape"],
      ["dornbracht", "Dornbracht"],
      ["antoniolupi", "antoniolupi"],
      ["starpool", "Starpool"],
      ["soleum", "Soleum"],
      ["fabio-alemanno", "Fabio Alemanno"],
      ["aquavia-spa", "Aquavia Spa"],
      ["naggura", "Naggura"],
    ],
    // Flos und Tom Dixon stehen mit ihren Markenseiten bei „Wohnen“.
    accessoires: [
      ["baobab-collection", "Baobab Collection"],
      ["riedel", "Riedel"],
      ["cire-trudon", "Cire Trudon"],
      ["zalto", "Zalto"],
      ["assouline", "Assouline"],
      ["kahler", "Kähler"],
      ["lyngby-porcelaen", "Lyngby Porcelæn"],
      ["spiegelau", "Spiegelau"],
      ["nachtmann", "Nachtmann"],
    ],
  },
});

// Menüpunkt „Shop“ (Accessoires-Shop, /accessoires): Abteilungen →
// Hauptkategorie-Seite. Statische Kopie von navShopTabelle() aus
// src/lib/shop/shopStart.js (gleicher Grund wie NAV_KATALOG: keine
// Markendateien im Layout); tests/unit/shop-startseite.test.mjs gleicht ab.
export const NAV_SHOP = Object.freeze([
  ["duft", "/accessoires/kategorie/duftkerze"],
  ["glas", "/accessoires/kategorie/glas"],
  ["buecher", "/accessoires/kategorie/bildband"],
  ["keramik", "/accessoires/kategorie/vase"],
  ["leuchten", "/accessoires/kategorie/tragbare-leuchte"],
  ["parfum", "/accessoires/kategorie/parfum"],
  ["wohnen", "/accessoires/kategorie/wohnaccessoire"],
  ["geschenke", "/accessoires/kategorie/geschenkset"],
]);

function roomOfGroup(group) {
  for (const item of group.items || []) {
    if (ROOM_OF_KEY[item.key]) return ROOM_OF_KEY[item.key];
  }
  return "living";
}

// German-only pages (the other locales 404 there). Language links on these
// pages lead to the other locale's home page instead. R6-shell-perf: every
// first segment whose page.js 404s outside "de" belongs here –
// tests/unit/r6-shell-perf.test.mjs scans src/app/[locale] and fails when one
// is missing (Projekte, Schweiz-Hub and the commerce pages were).
const GERMAN_ONLY_FIRST_SEGMENTS = new Set([
  // Sprach-Integration 01.11.2026: Küchen, Interior Design und Wohnzimmer gibt
  // es in allen vier Sprachen – nur Landingpages, die deOnlyRedirects.cjs noch
  // als „nur Deutsch“ führt (Regionsseiten, Möbel Bodensee), stehen hier.
  ...LANDING_PAGE_SLUGS.filter((slug) => deOnly.DE_ONLY_EXACT.includes(slug)),
  // Pages with `locales` (Yacht, Sofaplaner, Küchenplaner …) are multilingual.
  ...EXTRA_PAGES.filter((p) => !p.locales).map((p) => p.path.replace(/^\//, "")),
  // Welle 2 (Inhaber 29.10.2026, Nr. 13): "<segment>@en" = German AND English.
  // The language switch keeps the path for DE ↔ EN and leads FR/IT to their
  // home page. navMatch.isGermanOnlyPath. Sprach-Integration 01.11.2026: Yacht,
  // Sofaplaner, Ezarri-Welt, Architekten und Pflege-Service sind viersprachig;
  // nur die Ezarri-Werkzeuge Custom Mix und Anfrage bleiben DE/EN (FR/IT → 308
  // auf /en, deOnlyRedirects.cjs FR_IT_TO_EN_EZARRI_TOOLS).
  ...deOnly.FR_IT_TO_EN_EZARRI_TOOLS.map((tool) => `ezarri/${tool}@en`),
  // Hotel & Objekt: seit 01.11.2026 in allen vier Sprachen (Inhaber) – nicht mehr hier,
  // der Sprachumschalter behält den Pfad (vorher "hotel-objekt@en").
  // Newsletter-Archiv nur Deutsch (EN/FR/IT = 404); /newsletter selbst ist mehrsprachig.
  "newsletter/archiv",
  // Sprach-Integration 01.11.2026: outdoor-gartenplanung und
  // einkaufen-aus-der-schweiz sind viersprachig (nicht mehr hier).
  "ratgeber",
  "projekte",
  "gutscheine",
  "gutscheinbedingungen",
  "atelierverkauf",
  "adventsabend",
  "bewerten",
  "portal",
  "upload",
  "preview",
  // Inhaber-Entscheidung Nr. 9: ehemalige Labs-Seiten mit festen URLs (German only).
  // Sprach-Integration 01.11.2026: leistungen, kuechenplaner, stil-finder und
  // dreilaender-rechner sind viersprachig (nicht mehr hier).
  "3d-ansicht",
  "concierge",
  "arbeitsweise", // new German-only page of a parallel team (r6-shell-perf scan)
  "ki-assistenten", // N3 Platzhirsch für KI-Assistenten (German-only page, r6-shell-perf scan)
  "bodensee-licht", // N4 Bodensee-Licht (German-only page, r6-shell-perf scan)
]);

/** First path segments of German-only pages (handed to the client islands). */
/** Hängt den Küchengeräte-Link an die erste Küchen-Produktspalte (oder legt eine an). */
function withKitchenAppliances(columns, link, fallbackTitle) {
  if (!columns.length) return [{ title: fallbackTitle, links: [link] }];
  const [first, ...rest] = columns;
  return [{ ...first, links: [...(first.links || []), link] }, ...rest];
}

export function germanOnlySegments() {
  return [...GERMAN_ONLY_FIRST_SEGMENTS];
}

export function isGermanOnly(pathname = "/") {
  return isGermanOnlyPath(pathname, germanOnlySegments());
}

/**
 * The same page in another language. `pathname` has no locale prefix
 * ("/products/beds"); the result has none either.
 */
export function translatePath(pathname, from, to) {
  return translatePathWith(pathname, from, to, germanOnlySegments());
}

/**
 * A column with a single link ("Licht" → "Leuchten") makes the mega panel look
 * gappy. Fold it into its neighbour (the next one, or the previous one if it
 * is last): "Licht & Wohnaccessoires" with "Leuchten" first.
 */
function mergeLoneColumns(columns) {
  if (columns.length < 2) return columns;
  const out = [];
  let carry = null;
  columns.forEach((col, i) => {
    const current = carry ? { title: [carry.title, col.title].filter(Boolean).join(" & "), links: [...carry.links, ...col.links] } : col;
    carry = null;
    if (current.links.length === 1 && i < columns.length - 1) carry = current;
    else if (current.links.length === 1 && out.length) {
      const prev = out.pop();
      out.push({ title: [prev.title, current.title].filter(Boolean).join(" & "), links: [...prev.links, ...current.links] });
    } else out.push(current);
  });
  return out;
}

/**
 * Rooms of the main navigation with their mega-menu content.
 * @param {object} opts
 * @param {string} opts.locale
 * @param {Array} opts.groups      ProductsMenu.groups (raw messages)
 * @param {string[]|null} opts.activeCategoryKeys  categories with products; null = backend unreachable → show all
 * @param {(key: string) => string} opts.c  shell copy
 * @param {Array} [opts.features]  linked features (src/lib/features.js,
 *   default: navFeatures() – switches on, target page delivered)
 * @param {boolean} [opts.concierge]  KI-Concierge usable (navbar.js passes
 *   conciergeInMenu() from src/lib/concierge – live only with ANTHROPIC_API_KEY,
 *   R4 technik P2-6 / neuland P1-7). Default true keeps the plain data
 *   function testable without the server-only concierge config.
 */
export function buildRooms({
  locale,
  groups = [],
  activeCategoryKeys = null,
  c,
  features = navFeatures(),
  concierge = true,
  ratgeber = true,
  empfehlen = referralPagePublic(),
}) {
  const active = activeCategoryKeys ? new Set(activeCategoryKeys) : null;
  const hub = productsPath(locale);
  const isDe = locale === "de";

  // Bucket the product groups into rooms, keep the original group index
  // (the hub /produkte anchors its sections as #group-<index + 1>).
  const buckets = { living: [], kitchen: [], sleeping: [], outdoor: [] };
  groups.forEach((group, index) => {
    const items = (group.items || []).filter((item) => !active || active.has(item.key));
    if (!items.length) return;
    buckets[roomOfGroup(group)].push({
      title: group.title,
      anchor: `group-${index + 1}`,
      links: items.map((item) => ({ label: item.label, href: productsPath(locale, item.key) })),
    });
  });

  const has = (key) => !active || active.has(key);
  // R5 (ux P2): "Beratung & Termin" keeps the context of the page it is
  // opened on (?thema=, ?planer=, ?ort=, ?produkt=) – `context` tells the
  // islands (DesktopNav, MobileMenu) to add it client-side via useTerminContext
  // (HeaderCta.js, same helper as the header "Termin" button).
  const consultation = { label: c("nav.consultation"), href: route("beratung", locale), context: true };
  // Same link inside a room: never decides which room is "active". Rooms set
  // their own topic, so no page context there.
  const sharedConsultation = { label: consultation.label, href: consultation.href, shared: true };
  // R4 ux P1-5: inside a room the wizard starts with that room's topic
  // (topic keys of the wizard, src/lib/forms/beratungContext.js STEP1_KEYS).
  const roomConsultation = (thema) => ({ ...sharedConsultation, href: withContext(consultation.href, { thema }) });
  const roomHub = (key) => (has(key) ? { href: productsPath(locale, key) } : { href: hub, shared: true });

  // Linked features by id (switch on, target page delivered, page exists in
  // this language). German menu texts come from features.js; the showroom tour
  // (four languages) is labelled through the shell copy.
  const feat = Object.fromEntries(featuresFor(locale, features).map((f) => [f.id, f]));
  const featLink = (id, opts = {}) => {
    const f = feat[id];
    if (!f) return [];
    return [{ label: opts.label || f.nav, href: opts.href || f.href, ...(opts.shared ? { shared: true } : {}) }];
  };

  const rooms = [];

  if (buckets.living.length) {
    // Usability 3.1: tools where the task is – Sofaplaner and Stil-Finder
    // under "Wohnen" (primary place; repeated, `shared`, in "Planen & Erleben").
    // Welle 2: the Sofaplaner also exists in English (features.js locales).
    const ideas = [
      ...featLink("sofaplaner", isDe ? {} : { label: c("nav.sofaplaner") }),
      ...featLink("stilfinder", isDe ? {} : { label: intlNavLabel(locale, "stilfinder") }),
    ];
    rooms.push({
      id: "living",
      label: c("nav.living"),
      intro: c("nav.livingIntro"),
      // The whole catalogue belongs to no room: `shared` keeps "Wohnen" from
      // being marked active on /produkte (QA P2-4).
      all: { label: c("nav.livingAll"), href: hub, shared: true },
      columns: [
        ...mergeLoneColumns(buckets.living.map(({ title, links }) => ({ title, links }))),
        ...(ideas.length ? [{ title: c("nav.ideasGroup"), links: ideas }] : []),
      ],
      extra: [{ label: isDe ? "Wohnzimmer einrichten" : intlNavLabel(locale, "wohnzimmer"), href: "/wohnzimmer-einrichten-vorarlberg" }],
    });
  }

  if (buckets.kitchen.length || isDe) {
    rooms.push({
      id: "kitchen",
      label: c("nav.kitchen"),
      intro: c("nav.kitchenIntro"),
      all: { label: c("nav.kitchenAll"), ...roomHub("kitchen") },
      // Redaktionelle Seite (Marken, Ablauf, FAQ) – auch für den aktiven Raum auf /kuechengeraete/*.
      extra: [{ label: c("nav.kitchenAppliancesAbout"), href: "/kuechengeraete" }],
      columns: [
        // Inhaber 31.10.2026: Küchengeräte gehören links zu den Küchen-Produkten, nicht zur Planung.
        ...withKitchenAppliances(buckets.kitchen.map(({ title, links }) => ({ title, links })), {
          label: c("nav.kitchenAppliances"),
          // Inhaber 31.10.2026: der Menüklick führt zur Produktliste (Ansicht wie „Küchen“);
          // die redaktionelle Seite /kuechengeraete ist von der Liste aus verlinkt.
          href: "/kuechengeraete/produkte",
        }, c("nav.kitchen")),
        {
          title: c("nav.planning"),
          links: [
            // Sprach-Integration 01.11.2026: Küchen-Seite und Küchenplaner viersprachig.
            { label: c("nav.kitchenPlanning"), href: "/kuechen-vorarlberg" },
            ...featLink("kuechenplaner", isDe ? {} : { label: intlNavLabel(locale, "kuechenplaner") }),
            roomConsultation("kueche"),
          ],
        },
      ],
    });
  }

  // Inhaber 31.10.2026: „Bad“ als eigener Hauptpunkt nach „Küche“ (Seiten in
  // allen vier Sprachen). Links auf die Kategorieseiten des Herstellerkatalogs
  // (NAV_KATALOG unten); Whirlpools & Swimspas stehen unter „Outdoor & Pool“.
  const katLinks = (rows) => rows.map(([key, labelKey]) => ({ label: c(labelKey), href: katalogKategoriePath(key) }));
  rooms.push({
    id: "bath",
    label: c("nav.bath"),
    intro: c("nav.bathIntro"),
    all: { label: c("nav.bathAll"), href: "/bad-wellness/produkte" },
    columns: [
      { title: c("nav.bathGroup"), links: katLinks(NAV_KATALOG.bath) },
      { title: c("nav.wellnessGroup"), links: katLinks(NAV_KATALOG.wellness) },
      { title: c("nav.planning"), links: [{ label: c("nav.bathPlanning"), href: "/bad-wellness" }, roomConsultation("bad")] },
    ],
  });

  if (buckets.sleeping.length) {
    rooms.push({
      id: "sleeping",
      label: c("nav.sleeping"),
      intro: c("nav.sleepingIntro"),
      all: { label: c("nav.sleepingAll"), ...roomHub("beds") },
      columns: buckets.sleeping.map(({ title, links }) => ({ title, links })),
    });
  }

  // "Outdoor & Pool" (Usability 3.1): Ezarri glass mosaic for pool, bath and
  // wellness gets its fixed place next to the outdoor furniture – only when
  // the Ezarri world is public (EZARRI_PUBLIC leads, Gesamturteil W10).
  const pool =
    feat.ezarri
      ? [
          { label: c("nav.ezarri"), href: ezarriPath() },
          { label: c("nav.ezarriMosaics"), href: ezarriPath("mosaike") },
          { label: c("nav.ezarriPool"), href: ezarriPath("pool") },
        ]
      : [];
  // Bad & Wellness (Inhaber-Entscheidungen Nr. 19–21, page in all four
  // languages): primary place in "Pool, Bad & Wellness"; without the Ezarri
  // group it goes to the room's planning column. The top-level label stays
  // unchanged (header width, tests/unit/nav-ueberlappung.test.mjs).
  const badWellness = { label: c("nav.badWellness"), href: "/bad-wellness" };
  // Inhaber 31.10.2026: Menü wie „Küche“ ordnen – links Produkte, dann Pool,
  // Bad & Wellness, rechts die Planung (Pool-Konfigurator ist ein Planungswerkzeug).
  const poolConfigurator = feat.ezarri ? [{ label: c("nav.ezarriConfigurator"), href: ezarriPath("konfigurator") }] : [];
  if (buckets.outdoor.length || isDe) {
    const anchor = buckets.outdoor[0]?.anchor;
    rooms.push({
      id: "outdoor",
      label: pool.length ? c("nav.outdoorPool") : c("nav.outdoor"),
      // Below 1440 px only "Outdoor" is visible (WCAG 1.4.12 at 1280 px, like "Planen").
      ...(pool.length ? { navShort: c("nav.outdoor") } : {}),
      intro: pool.length ? c("nav.outdoorPoolIntro") : c("nav.outdoorIntro"),
      all: { label: c("nav.outdoorAll"), href: anchor ? `${hub}#${anchor}` : hub },
      columns: [
        ...buckets.outdoor.map(({ title, links }) => ({ title, links })),
        // Inhaber 31.10.2026: Bad & Wellness hat den eigenen Punkt „Bad“; hier
        // bleiben Pool (Ezarri) und – getrennt – Whirlpools & Swimspas.
        ...(pool.length ? [{ title: c("nav.poolGroup"), links: pool }] : []),
        { title: c("nav.spaGroup"), links: katLinks(NAV_KATALOG.spa) },
        {
          title: c("nav.planning"),
          // R4 ux P1-3 (Inhaber-Entscheidung Nr. 9: every feature is a fixed
          // part of the site and linked in the menu): the garden/terrace
          // planning page is listed here, its primary place. The page itself
          // decides its robots (noindex until the legal review); a menu link
          // to a noindex,follow page is a navigation choice, not an SEO error.
          links: [
            ...featLink("outdoor", { label: isDe ? "Garten & Terrasse planen" : c("nav.outdoorPlanning") }),
            ...poolConfigurator,
            // Wellness-Link (shared: entscheidet nicht über den aktiven Raum, das tut „Bad“).
            { ...badWellness, shared: true },
            roomConsultation("outdoor"),
          ],
        },
      ],
    });
  }

  // Accessoires-Shop (Inhaber 31.10.2026: „echtes Webshop-Gefühl“): eigener,
  // klar als Shop erkennbarer Punkt vor „Marken“. Kopfzeilen-Label kurz
  // („Shop“ – bei 1280 und 1440 px bleiben nur ≈ 65 px Luft zur Suche), der
  // volle Name „Accessoires · Shop“ steht als `title` im Panel und im
  // Mobilmenü. Die Markenlinks sind dieselben wie unter „Marken“; weil dieser
  // Raum zuerst kommt, ist auf /accessoires/* „Shop“ aktiv (findActiveRoom).
  {
    const sc = startCopy(locale);
    rooms.push({
      id: "shop",
      label: sc.navLabel,
      title: sc.navTitle,
      intro: sc.navIntro,
      all: { label: sc.navAll, href: "/accessoires" },
      columns: [
        { title: sc.navKategorien, links: NAV_SHOP.map(([id, href]) => ({ label: sc.abteilung[id], href })) },
        {
          title: sc.navEntdecken,
          links: [
            { label: sc.navAlleProdukte, href: "/accessoires/produkte" },
            { label: sc.navSuche, href: "/accessoires/suche" },
            { label: sc.navCafe, href: CAFE_URL, external: true },
          ],
        },
        { title: c("nav.brands"), links: NAV_KATALOG.marken.accessoires.map(([slug, name]) => ({ label: name, href: `${KATALOG_BASE.accessoires}/marke/${slug}` })) },
      ],
      compact: true,
    });
  }

  const brandBase = route("marken", locale);
  // Inhaber 31.10.2026: „Die Marken gehören in die Navbar ‚Marken‘“ – gruppiert
  // nach Welt. Wohnen = Backoffice-Marken (FEATURED_BRANDS, eigene Markenseiten);
  // Küche, Bad & Wellness, Accessoires = Markenseiten des Herstellerkatalogs
  // (NAV_KATALOG.marken). next125 (Küchen) steht bei „Küche & Geräte“, Ezarri
  // (Glasmosaik für Pool, Bad und Wellness) bei „Bad & Wellness“. Kompakte
  // Zeilen (room.compact), damit das Panel auch bei 1280 × 720 nicht überläuft.
  const featured = featuredBrands(locale).map((b) => ({ slug: b.slug, label: b.name, href: brandHref(b, brandBase) }));
  const pick = (slugs) => featured.filter((b) => slugs.includes(b.slug)).map(({ label, href }) => ({ label, href }));
  const katalogBrands = (welt) => NAV_KATALOG.marken[welt].map(([slug, name]) => ({ label: name, href: `${KATALOG_BASE[welt]}/marke/${slug}` }));
  const KITCHEN_FEATURED = ["next125"];
  const BATH_FEATURED = ["ezarri"];
  rooms.push({
    id: "brands",
    label: c("nav.brands"),
    intro: c("nav.brandsIntro"),
    all: { label: c("nav.brandsAll"), href: brandBase },
    columns: [
      { title: c("nav.living"), links: featured.filter((b) => !KITCHEN_FEATURED.includes(b.slug) && !BATH_FEATURED.includes(b.slug)).map(({ label, href }) => ({ label, href })) },
      { title: c("nav.brandsKitchen"), links: [...pick(KITCHEN_FEATURED), ...katalogBrands("kuechengeraete")] },
      { title: c("nav.badWellness"), links: [...katalogBrands("bad-wellness"), ...pick(BATH_FEATURED)] },
      { title: c("nav.brandsAccessories"), links: katalogBrands("accessoires") },
    ],
    compact: true,
  });

  // "Planen & Erleben" (Inhaber-Entscheidung Nr. 9) replaces "Leistungen" and
  // the former Labs item. r7-p1 (ux P2-3): three groups, max. 7 entries each –
  //   "Beraten & planen": advice, the hand-drawn design process (Kern-USP
  //     Nr. 8), Interior, Hotel/Gastronomie/Objekt (ux P1-2, #objekt), Yacht;
  //   "Online planen & ansehen": the customer tools and the showroom tour;
  //   "Service für Kunden": Portal (direct to the login, seo P2-9), Upload
  //     (info entry only), KI-Concierge, Dreiländer-Rechner.
  // Tools whose primary place is a room panel are `shared` here.
  // The id stays "services" (footer column, tests).
  // Welle 2 (Inhaber 29.10.2026): Hotel & Objekt has its own page (DE/EN), Yacht
  // also in English, and the Ratgeber is released (German only; which articles
  // are index,follow is decided per article in the Ratgeber data – 01.11.2026:
  // 14 of 15, the Whirlpool draft stays noindex).
  // Inhaber 01.11.2026: Hotel & Objekt exists in all four languages – every
  // locale links its own /<locale>/hotel-objekt (before: FR/IT → /en/hotel-objekt).
  const hotelObjektHref = "/hotel-objekt";
  const advice = [
    consultation,
    ...(isDe ? [{ label: c("nav.process"), href: "/arbeitsweise" }] : []),
    // Sprach-Integration 01.11.2026: Interior Design in allen vier Sprachen.
    { label: c("nav.interior"), href: "/interior-design-vorarlberg" },
    { label: c("nav.hotelObjekt"), href: hotelObjektHref },
    ...featLink("yacht", { label: c("nav.yacht") }),
    ...(isDe && ratgeber ? [{ label: c("nav.guide"), href: "/ratgeber" }] : []),
  ];
  // Sprach-Integration 01.11.2026: Küchenplaner, Sofaplaner und Stil-Finder auch
  // in EN/FR/IT (featuresFor; Menütexte serverseitig, INTL_NAV). Bodensee-Licht und
  // 3D-Ansicht bleiben nur Deutsch – featLink liefert sie nur dort.
  const online = [
    ...featLink("kuechenplaner", { shared: true, label: intlNavLabel(locale, "kuechenplaner") }),
    ...featLink("sofaplaner", { shared: true, label: isDe ? undefined : c("nav.sofaplaner") }),
    ...featLink("stilfinder", { shared: true, label: intlNavLabel(locale, "stilfinder") }),
    ...featLink("licht"),
    ...featLink("arviewer"),
    // r8-leads (seo P1-3): the showroom tour (noindex, nofollow) is not in the
    // menu; it is linked in context (Leistungen, Startseite).
  ];
  const service = isDe
    ? [
        ...featLink("portal", { label: c("nav.portal"), href: "/portal/login" }),
        // R4 ux P1-3 (Entscheidung Nr. 9): the phone upload service page is
        // in the menu again – only while its switch is on (featLink: switch
        // NEXT_PUBLIC_FEATURE_UPLOAD, page delivered); otherwise only Outdoor.
        ...featLink("upload"),
        // Only when the concierge really answers (ANTHROPIC_API_KEY set),
        // otherwise the entry led to a "not available" page.
        ...(concierge ? featLink("concierge") : []),
        ...featLink("dreilaender"),
        // Service Nr. 4 (Inhaber 29.10.2026): care service and subscription
        // for leather, fabric and wood (page DE/EN, noindex until prices and
        // terms are released – a navigation choice, like Outdoor).
        ...featLink("pflege", { label: c("nav.pflegeService") }),
        // Welle 2: the Ratgeber is released (Inhaber 29.10.2026) and linked
        // under "Beraten & planen" (F5 Runde 1 no longer applies).
      ]
    : [];
  // Dreiländer-Rechner und Pflege-Service gibt es seit 01.11.2026 in allen vier
  // Sprachen: featLink liefert sie, wo features.js die Sprache führt.
  if (!isDe) {
    service.push(
      ...featLink("dreilaender", { label: intlNavLabel(locale, "dreilaender") }),
      ...featLink("pflege", { label: c("nav.pflegeService") }),
    );
  }
  rooms.push({
    id: "services",
    label: c("nav.plan"),
    navShort: c("nav.planShort"),
    intro: c("nav.planIntro"),
    // Sprach-Integration 01.11.2026: /leistungen in allen vier Sprachen.
    all: { label: c("nav.planAll"), href: "/leistungen" },
    columns: [
      { title: c("nav.adviceGroup"), links: advice },
      ...(online.length ? [{ title: c("nav.onlineGroup"), links: online }] : []),
      ...(service.length ? [{ title: c("nav.serviceGroup"), links: service }] : []),
    ],
  });

  rooms.push({
    id: "house",
    label: c("nav.house"),
    intro: c("nav.houseIntro"),
    all: { label: c("nav.houseAll"), href: route("platzhirsch", locale) },
    columns: [
      {
        title: c("nav.houseGroup"),
        links: [
          { label: c("nav.about"), href: route("platzhirsch", locale) },
          { label: c("nav.team"), href: route("team", locale) },
          { label: c("nav.career"), href: route("karriere", locale) },
          { label: c("nav.press"), href: route("presse", locale) },
          { label: c("nav.partners"), href: route("partner", locale) },
          { label: c("nav.news"), href: route("news", locale) },
        ],
      },
      {
        title: c("nav.visitGroup"),
        links: [
          { label: c("nav.contact"), href: route("kontakt", locale) },
          { label: c("nav.directions"), href: DIRECTIONS_URL, external: true },
          { label: c("nav.cafe"), href: CAFE_URL, external: true },
          { label: c("nav.newsletter"), href: "/newsletter" },
          // Welle 2 (Empfehlungsprogramm): only while the page is delivered
          // (terms released or EMPFEHLUNG_PUBLIC=1; development shows it).
          ...(empfehlen ? [{ label: c("nav.empfehlen"), href: "/empfehlen" }] : []),
        ],
      },
      {
        // Welle 2: Hotel & Objekt (primary place "Planen & Erleben", shared
        // here) and Architekten & Bauträger (DE/EN, FR/IT 404).
        title: c("nav.businessGroup"),
        links: [
          { label: c("nav.hotelObjekt"), href: hotelObjektHref, shared: true },
          // Sprach-Integration 01.11.2026: Architekten in allen vier Sprachen.
          { label: c("nav.architekten"), href: "/architekten" },
        ],
      },
    ],
  });

  // Safety net (r8-leads, seo P1-3): no menu link ever leads to a noindex page.
  return rooms.map((room) => ({
    ...room,
    columns: room.columns
      .map((col) => ({ ...col, links: col.links.filter((l) => !NAV_NOINDEX.has(String(l.href).split(/[?#]/)[0])) }))
      .filter((col) => col.links.length),
  }));
}

// Pages the menu must never link (seo P1-3). R4 ux P1-3: Outdoor-
// Gartenplanung and the upload service page left this list (Entscheidung
// Nr. 9 – in the menu, legal gaps solved on the page, not by hiding); the
// showroom tour stays out until a real recording exists.
export const NAV_NOINDEX = new Set(["/showroom"]);

/**
 * Features the menu links: switch on (src/lib/features.js) and the target page
 * is delivered – Ezarri only with EZARRI_PUBLIC, the showroom tour only when
 * its page is not "off" (production without a real recording → 404, no link).
 */
export function navFeatures({ raw, nodeEnv, ezarri = ezarriInNavigation(), showroom = showroomMode() !== "off" } = {}) {
  return enabledFeatures({ ...(raw ? { raw } : {}), ...(nodeEnv ? { nodeEnv } : {}), available: { ezarri, showroom } });
}
