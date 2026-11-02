// src/lib/forms/pathContext.js
// Page context of the Termin links in header, mobile menu and CTA bar
// (contextForPath, withContext) plus the small URL text cleaner (cleanText).
// Tempo-Runde Shell (qa-screenshots/tempo/shell.md): split out of
// beratungContext.js, which re-exports all of it unchanged. The shell islands
// (Navbar/HeaderCta, DesktopNav, MobileMenu, Reusable/MobileCtaBar) are on
// every page and only need this part – the wizard logic (topics, prefill,
// Wunschtermin, ≈ 3 KB gzip) now loads with /beratung and the forms only.
// Pure logic, no "@/..." imports (node --test imports it directly).

// ?ort=: city pages (/designermoebel-<slug>) → visible place name. Unknown
// slugs are ignored, so no free text from the URL lands in the message.
export const CITY_NAMES = Object.freeze({
  appenzell: "Appenzell",
  arlberg: "Arlberg",
  bregenz: "Bregenz",
  dornbirn: "Dornbirn",
  feldkirch: "Feldkirch",
  friedrichshafen: "Friedrichshafen",
  kempten: "Kempten",
  konstanz: "Konstanz",
  liechtenstein: "Liechtenstein",
  lindau: "Lindau",
  ravensburg: "Ravensburg",
  rheintal: "Rheintal",
  "st-gallen": "St. Gallen",
});

// Path of the current page (without locale) → context for the Termin links
// of header and mobile CTA bar (ux P1-1). First segment decides.
const PATH_TOPICS = [
  [/^yacht-interior$/, "yacht"],
  [/^kuechen/, "kueche"],
  [/^kuechenplaner$/, "kueche"],
  [/^outdoor/, "outdoor"],
  [/^ezarri/, "ezarri"],
  // Bad & Wellness (Inhaber-Entscheidungen Nr. 19–21): header link keeps the topic.
  [/^bad-wellness$/, "wellness"],
  // Welle 2: Hotel & Objekt and the architects' page keep their topic.
  [/^hotel-objekt$/, "hotel"],
  [/^architekten$/, "architekt"],
  // Runde 5 (ux P2-6): no "Neubau" preselection from the interior page.
  [/^interior-design/, "interior"],
  // r8-leads (ux P1-3): tools and product pages keep their context too.
  [/^sofaplaner$/, "sofa"],
  [/^wohnzimmer-einrichten/, "sofa"],
];

// Tool pages: ?planer= (first message line "Anfrage aus der 3D-Ansicht" …).
const PATH_PLANERS = [
  [/^3d-ansicht$/, "3d"],
  [/^stil-finder$/, "stil-finder"],
  [/^sofaplaner$/, "sofaplaner"],
  [/^bodensee-licht$/, "bodensee-licht"],
  [/^dreilaender-rechner$/, "dreilaender"],
];

// Rat 9,5 A12 (UX9, R6 P2-1): brand pages /ueber-uns/marken/<slug> (and the
// localized paths) → ?produkt=<Marke>. The slug is the CMS name in ASCII;
// the few names it cannot spell come from this table, else title case
// ("paola-lenti" → "Paola Lenti"). A page may name it exactly with
// data-termin-produkt (Navbar/HeaderCta.js reads it after hydration).
const BRAND_BASES = ["ueber-uns/marken", "about-us/brands", "a-propos/marques", "chi-siamo/marche"];
const BRAND_NAMES = Object.freeze({
  treca: "Tréca",
  schueller: "Schüller",
  "brand-van-egmond": "Brand van Egmond",
  classicon: "ClassiCon",
  next125: "next125",
  "b-b-italia": "B&B Italia",
  "de-sede": "de Sede",
});

/** "paola-lenti" → "Paola Lenti" (only [a-z0-9-] slugs, else null). */
export function brandName(slug) {
  const s = String(slug || "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,58}$/.test(s)) return null;
  if (BRAND_NAMES[s]) return BRAND_NAMES[s];
  return s
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * contextForPath("/yacht-interior") → { thema: "yacht" };
 * contextForPath("/sofaplaner") → { thema: "sofa", planer: "sofaplaner" };
 * contextForPath("/3d-ansicht") → { planer: "3d" };
 * contextForPath("/produkte/lamps/lamps-2097-18") → { produktSeite: true };
 * contextForPath("/designermoebel-st-gallen") → { ort: "st-gallen" };
 * contextForPath("/ueber-uns/marken/paola-lenti") → { produkt: "Paola Lenti" }; else {}.
 */
export function contextForPath(pathname) {
  const segments = String(pathname || "")
    .split(/[?#]/)[0]
    .split("/")
    .filter(Boolean)
    .map((x) => x.toLowerCase());
  const first = segments[0] || "";
  if (!first) return {};
  const out = {};
  const topic = PATH_TOPICS.find(([re]) => re.test(first));
  if (topic) out.thema = topic[1];
  const planer = PATH_PLANERS.find(([re]) => re.test(first));
  if (planer) out.planer = planer[1];
  // Product pages /produkte/<kategorie>/<produkt>: the slugs are ids
  // ("lamps-2097-18"), so the name comes from the page itself – the flag tells
  // the header link (Navbar/HeaderCta.js) to read it from the H1.
  if (first === "produkte" && segments[2]) out.produktSeite = true;
  // Brand page (exactly base + slug; collections below it keep the brand too).
  const base = `${segments[0] || ""}/${segments[1] || ""}`;
  if (BRAND_BASES.includes(base) && segments[2]) {
    const name = brandName(segments[2]);
    if (name) out.produkt = name;
  }
  if (Object.keys(out).length) return out;
  const city = first.startsWith("designermoebel-") ? first.slice("designermoebel-".length) : null;
  return city && CITY_NAMES[city] ? { ort: city } : {};
}

/** "/beratung" + { thema: "yacht" } → "/beratung?thema=yacht" (no query when empty). */
export function withContext(href, ctx = {}) {
  const q = new URLSearchParams();
  // Rat 9,5 B2: plan and ideenboard (tool hand-over) travel on to /termin too.
  for (const k of ["thema", "planer", "ort", "rolle", "produkt", "land", "wert", "plan", "ideenboard"]) if (ctx[k]) q.set(k, ctx[k]);
  const s = q.toString();
  return s ? `${href}${href.includes("?") ? "&" : "?"}${s}` : href;
}

// Visible free text from the URL: no control characters, no markup, short.
export function cleanText(v, max = 200) {
  const s = String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}
