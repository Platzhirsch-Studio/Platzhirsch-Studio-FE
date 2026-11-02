// src/lib/seo/llms.js
// Body of /llms.txt (llmstxt.org: one H1, a short summary, then H2 sections
// of `- [Title](url): description` links). Built by src/app/llms.txt/route.js
// from the live brand list; everything else is static.
//
// Rules (R1-seo / R2-seo):
// - Only pages that are index,follow. No noindex page is listed — that is
//   why Impressum and Datenschutz (noindex, follow) are not in "Optional".
// - LANDING_PAGES only when they pass the doorway audit (passesDoorwayAudit,
//   src/lib/seo/sitemap/doorwayAudit.js) — the same rule as the sitemap.
// - Ratgeber only from getIndexableRatgeber() (today [] → no section).
// - "Marken nach Kategorie" (R3): only indexable brand × category pages
//   (buildBrandCategories: >= 4 models since Runde 4 P5, no collision, not on the audit
//   list), for a few featured brands and their largest categories — the
//   complete list is in /sitemap-marken.xml. No counts (the page shows the
//   model count, the summary the entry count).
// - Kern-USP (Inhaber-Entscheidung Nr. 8, F6 28.10.2026) in the summary:
//   Handzeichnung → Raummodell → 3D → Rendering, in the wording of
//   Marktresearch/digital/features/usp-handzeichnung-designprozess.md.
// - Voice like the brand pages: no "exklusiv", "Premium", "führen" (R2-seo).
// - Descriptions are factual: no dealer claims, no superlatives (Claim-Guard;
//   a teaser that trips it is listed without description).
//
// Pure module (relative imports only), so node --test can load it
// (tests/unit/llms.test.mjs).
import { passesDoorwayAudit } from "./sitemap/doorwayAudit.js";
import { ratgeberLlmsSection } from "./sitemap/ratgeber.js";
import { BASE_URL } from "./sitemap/xml.js";
import { generateSlug } from "../slugify.js";
import { findClaims, verifiedDealersSentence } from "../legal/claims.js";
import { brandCategoryHref } from "../marken/brandCategory.js";
import { CAFE_PROFILE } from "./siteSchema.js";
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME, openingHoursLine } from "../site.js";

// GEO W3 (SEO-Team A, 31.10.2026): "Platzhirsch" alone matches other
// businesses in AI answers – one disambiguation line under the summary.
export const LLMS_DISAMBIGUATION = `Nicht zu verwechseln mit gleichnamigen Gastronomiebetrieben in anderen Orten; das Café im Haus ist das ${CAFE_PROFILE.name} in Lochau (${CAFE_PROFILE.url}).`;

// GEO W2/W4: facts, same statements as "Auf einen Blick" on the about page.
// Only documented facts: no founding year (neither repo, Impressum nor
// Firmenbuch entry give one), no showroom area (the 400 m² are as of 2019).
export const LLMS_FACTS = `## Fakten

- Wer: ${SITE_NAME} ist ein Einrichtungsstudio für Designermöbel und Interior Design mit eigenem Café im Haus. Betreiberin ist die ${LEGAL_NAME}.
- Wo: ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.region}, ${ADDRESS.country} – am Bodensee zwischen Bregenz und Lindau.
- Minotti Studio: Seit 2019 gibt es in Lochau das „Minotti Studio by Platzhirsch Home Living“ (Minotti-Pressemeldung zur Eröffnung).
- Leistungen: Einrichtungsplanung von Hand mit Raummodell, 3D-Planung und Rendering; Küchen mit Einbaugeräten; Bad & Wellness; Outdoor; Hotel & Objekt; Yacht-Interieur; Lieferung und Montage auf Wunsch.
- Sprachen der Beratung: Deutsch, Englisch, Italienisch und Französisch.
- Termin: im Showroom in Lochau oder beim Kunden vor Ort, Anfrage unter ${BASE_URL}/de/beratung.`;

// GEO W4: French and Italian entry points (the only AI citation so far was a
// French brand page). Paths as src/utils/routing.js; only pages that answer
// 200 in all four locales (checked on the dev server 31.10.2026).
export const LLMS_FR = `## Pages en français

- [Accueil](${BASE_URL}/fr): studio d’aménagement et mobilier design à Lochau, au bord du lac de Constance.
- [Minotti Studio by Platzhirsch Home Living](${BASE_URL}/fr/a-propos/marques/minotti): collections Minotti, planification et rendez-vous à Lochau.
- [Bain & bien-être](${BASE_URL}/fr/bad-wellness): salles de bain, saunas et spas, planifiés comme une pièce à vivre.
- [Électroménager encastrable](${BASE_URL}/fr/kuechengeraete): les appareils que nous intégrons dans la planification de la cuisine.
- [À propos](${BASE_URL}/fr/a-propos/platzhirsch): le studio, la méthode et le showroom à Lochau.
- [Contact](${BASE_URL}/fr/contact): adresse, horaires et demande de rendez-vous.`;

export const LLMS_IT = `## Pagine in italiano

- [Home](${BASE_URL}/it): studio d’arredamento e mobili di design a Lochau, sul Lago di Costanza.
- [Minotti Studio by Platzhirsch Home Living](${BASE_URL}/it/chi-siamo/marche/minotti): collezioni Minotti, progettazione e appuntamento a Lochau.
- [Bagno & benessere](${BASE_URL}/it/bad-wellness): bagni, saune e spa, progettati come un ambiente da vivere.
- [Elettrodomestici da incasso](${BASE_URL}/it/kuechengeraete): gli elettrodomestici che integriamo nella progettazione della cucina.
- [Chi siamo](${BASE_URL}/it/chi-siamo/platzhirsch): lo studio, il metodo e lo showroom a Lochau.
- [Contatto](${BASE_URL}/it/contatto): indirizzo, orari e richiesta di appuntamento.`;

// Brands whose category pages are listed in /llms.txt, in this order.
export const LLMS_FEATURED_BRANDS = Object.freeze(["minotti", "poliform", "rimadesio", "paola-lenti", "flos", "classicon"]);
export const LLMS_CATEGORIES_PER_BRAND = 4;

// Runde 4 P5 (seo P1-4): NAP-Block direkt unter dem Blockzitat – Name,
// Adresse, Telefon, E-Mail, Öffnungszeiten aus src/lib/site.js (dieselbe
// Quelle wie das LocalBusiness-JSON-LD, keine zweite Datenhaltung).
export const LLMS_NAP = [
  `- Adresse: ${SITE_NAME}, ${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.region}, ${ADDRESS.country}`,
  `- Telefon: ${PHONE_DISPLAY}`,
  `- E-Mail: ${EMAIL}`,
  `- Öffnungszeiten Showroom: ${openingHoursLine("de")}`,
  `- Café im Haus (${CAFE_PROFILE.name}, ${CAFE_PROFILE.url}): Telefon ${CAFE_PROFILE.telephone}, ${CAFE_PROFILE.openingLineDe}`,
].join("\n");

export const LLMS_HEADER = `# Platzhirsch Home Living

> Einrichtungsstudio mit Café für Designermöbel und Interior Design in Lochau, Vorarlberg (Österreich). Harald Menghin zeichnet Einrichtungen und Konzepte von Hand und baut Raummodelle; erst danach folgen 3D-Planung und fotorealistisches Rendering. Ausstellung und Beratung zu internationalen Designmarken wie Minotti, Poliform, Flos, Rimadesio und Paola Lenti.

${LLMS_NAP}

${LLMS_DISAMBIGUATION}

Arbeitsweise: Kennenlernen im Showroom oder beim Kunden, Aufnahme vor Ort (Räume, Licht, Klima; wenn das Projekt es braucht, auch ein, zwei Tage), Handzeichnung, Raummodell im Maßstab, 3D-Planung, fotorealistisches Rendering vor der Bestellung, Umsetzung. Platzhirsch Home Living zeigt eine kuratierte Auswahl an Designmarken für Wohnen, Küche, Outdoor und Beleuchtung, dazu Glasmosaik von Ezarri, und bietet persönliche Einrichtungsberatung und Interior Design in einer Ausstellung mit Café in Lochau am Bodensee; Lieferung und Montage auf Wunsch. ${verifiedDealersSentence()} Primärsprache ist Deutsch (de-AT); die deutschen Seiten sind maßgeblich (kanonisch).

## Hauptseiten

- [Startseite](${BASE_URL}/de): Überblick über Studio, Marken und Leistungen.
- [Produkte](${BASE_URL}/de/produkte): Designmöbel, Leuchten, Küchen und Outdoor nach Marke.
- [Marken](${BASE_URL}/de/ueber-uns/marken): Alle Designmarken, mit denen wir planen und beraten.
- [Einrichtungsberatung](${BASE_URL}/de/beratung): Persönliche Beratung und Einrichtungsplanung.
- [Über uns](${BASE_URL}/de/ueber-uns/platzhirsch): Studio, Philosophie und Ausstellung in Lochau.
- [Kontakt](${BASE_URL}/de/kontakt): Adresse, Öffnungszeiten und Terminanfrage.`;

// Impressum / Datenschutz are noindex (see sitemapEntries.js) → not listed.
export const LLMS_OPTIONAL = `## Optional

- [Aktuelles](${BASE_URL}/de/news): News und Neuigkeiten aus dem Studio.
- [Team](${BASE_URL}/de/ueber-uns/team): Das Team von Platzhirsch Home Living.
- [Harald Menghin](${BASE_URL}/de/ueber-uns/team/harald-menghin): Profil – Einrichtungen von Hand gezeichnet, Raummodell, dann 3D-Planung und Rendering.
- [Partner](${BASE_URL}/de/ueber-uns/partner): Partnerbetriebe und Kooperationen.
- [Presse](${BASE_URL}/de/ueber-uns/presse): Pressebereich.`;

const clean = (text) => (text && !findClaims(text, { locale: "de" }).length ? text : "");

export function buildBrandSection(brands) {
  const lines = (brands || [])
    .map((b) => (b?.name1 || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((name) => `- [${name}](${BASE_URL}/de/ueber-uns/marken/${generateSlug(name)})`)
    .join("\n");
  return lines ? `## Marken\n\n${lines}` : "";
}

/**
 * "## Regionen und Leistungen": LANDING_PAGES that pass the doorway audit,
 * then EXTRA_PAGES (registry of the sitemap), each path once. German only.
 */
export function buildPagesSection(landingPages = [], extraPages = []) {
  const seen = new Set();
  const lines = [];
  const add = (path, label, desc) => {
    if (!path || seen.has(path) || !passesDoorwayAudit(path)) return;
    seen.add(path);
    const d = clean(desc);
    lines.push(`- [${label}](${BASE_URL}/de${path})${d ? `: ${d}` : ""}`);
  };
  for (const page of landingPages) add(`/${page.slug}`, page.label, page.teaser);
  for (const page of extraPages) add(page.path, page.label, page.llms);
  return lines.length ? `## Regionen und Leistungen\n\n${lines.join("\n")}` : "";
}

/**
 * "## English pages" (Welle 2, Inhaber Nr. 13): pages that also exist in
 * English (`locales` contains "en" and an `en` line) – Yacht, Sofaplaner,
 * Ezarri, Hotel & Objekt, Architekten. Same claim filter as the German lines.
 */
export function buildEnglishSection(pages = []) {
  const seen = new Set();
  const lines = [];
  for (const page of pages) {
    if (!page?.en || !page.locales?.includes("en") || seen.has(page.path) || !passesDoorwayAudit(page.path)) continue;
    seen.add(page.path);
    const d = page.en.llms && !findClaims(page.en.llms, { locale: "en" }).length ? page.en.llms : "";
    lines.push(`- [${page.en.label}](${BASE_URL}/en${page.path})${d ? `: ${d}` : ""}`);
  }
  return lines.length ? `## English pages\n\n${lines.join("\n")}` : "";
}

/**
 * "## Marken nach Kategorie": indexable brand × category pages of the
 * featured brands, largest first, German labels.
 * @param {Array} summaries buildBrandCategories() results
 * @param {Record<string,string>} labels category key → German name
 */
export function buildBrandCategorySection(summaries, labels = {}, { featured = LLMS_FEATURED_BRANDS, perBrand = LLMS_CATEGORIES_PER_BRAND } = {}) {
  const bySlug = new Map((summaries || []).map((s) => [s.brandSlug, s]));
  const lines = [];
  for (const slug of featured) {
    const s = bySlug.get(slug);
    if (!s) continue;
    for (const c of s.categories.filter((x) => x.indexable).slice(0, perBrand)) {
      const href = brandCategoryHref(s.brand, c.slug, "de");
      const label = labels[c.key] || c.key;
      if (href && !findClaims(label, { locale: "de" }).length) lines.push(`- [${s.brand} ${label}](${BASE_URL}/de${href})`);
    }
  }
  return lines.length ? `## Marken nach Kategorie\n\n${lines.join("\n")}` : "";
}

/** Full /llms.txt body (ends with a newline). */
export function buildLlmsTxt({ brands = [], brandCategories = [], categoryLabels = {}, landingPages = [], extraPages = [], ratgeber = [] } = {}) {
  return (
    [
      LLMS_HEADER,
      LLMS_FACTS,
      buildBrandSection(brands),
      buildBrandCategorySection(brandCategories, categoryLabels),
      buildPagesSection(landingPages, extraPages),
      buildEnglishSection(extraPages),
      LLMS_FR,
      LLMS_IT,
      ratgeberLlmsSection(ratgeber),
      LLMS_OPTIONAL,
    ]
      .filter(Boolean)
      .join("\n\n") + "\n"
  );
}
