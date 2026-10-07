# Platzhirsch Home Living – SEO / UX / Engineering overhaul, implementation report

Date: 2026-10-06 · Branch: `feature/seo-ux-overhaul` (from `develop`) · Status: implemented locally, **not committed, not deployed**.
Albanian version: `02-implementation-report.sq.md`.

## 1. Where the site stands (baseline)

| Signal | Finding |
|---|---|
| Visibility (SISTRIX, DE/AT) | ≈ 0. 52 ranking keywords in Germany, visibility index peaked at 0.045 in 2021. Ranking URLs are old `/de/produkte/{brand}` and `/de/produkte/{brand}/{product}` pages. |
| Competitors in the SERPs | For "minotti" (AT): m-studio.at, kramerundkramer.at, moebelfirst.de, seipp.com, wohnsinnspreise.at. For "designermöbel" (AT): kare.at, wohndesign-maierhofer.at, ambientedirect.com, boconcept.com, connox.at. Platzhirsch does not appear. |
| Live site vs. `develop` | Production (`main`) still runs the old site with 3,517 sitemap URLs, 3,209 of them product URLs under `/{locale}/produkte/{brand}/…`. In `develop` every one of those URLs answered **404** – the biggest single risk of the relaunch. |
| Technical SEO in `develop` | Solid foundation already present (canonical + hreflang helper, sitemap index, robots, JSON-LD graph, `next/font`). Gaps: homepage H1 came from a CMS field and was hidden until JS ran; local landing pages were `noindex`, unlinked from the sitemap and still bypassed by the legacy redirects; brand pages had an untrimmed German bio as meta description and `og:description` "Learn more about undefined"; CMS fields could overwrite canonicals; EN/FR/IT product pages fell back to German CMS titles/descriptions (duplicate titles across locales); an untranslated news article crashed its EN/FR/IT URL with HTTP 500. |
| Privacy | Google Maps and Street View iframes loaded before consent although the cookie banner lists Maps as opt-in; every consent click reloaded the page; preconnects to Google before consent. |
| Accessibility | Gold accent (#d1b250) used for small text on white = 2.0:1 contrast (fails WCAG AA); language switcher was a hover-toggling `div` (broken on touch tablets, unreachable by keyboard); hamburger/close/social buttons without names; product-inquiry form labels not associated with inputs; carousel without pause control. |
| Engineering | ~20 dead files (old pages, unused components, a second i18n config, a root client layout polling cookies every 500 ms), stray "/" rendered on the homepage, unguarded `JSON.parse` of `localStorage.cart` that could white-screen the site, no fetch timeouts (a dev render once took 4.7 min on a stalled backend). |

Measurement caveat: the server on port 3100 that earlier audits used is a **development** server (unminified React, devtools). All performance numbers below come from a real `next build` + `next start`.

## 2. What was changed

### 2.1 Reclaim the old rankings (P0)
- **Legacy catalogue URLs now 308 instead of 404** (`src/lib/seo/legacyProductRedirects.js`, wired into `produkte/[category]/page.js` and `produkte/[category]/[product]/page.js`):
  - `/{locale}/produkte/{brand}` → brand page `/{locale}/…/marken/{brand}` (works for `/en/products/…`, `/fr/produits/…`, `/it/prodotti/…` too).
  - `/{locale}/produkte/{brand}/{old-slug}` → the old "Produkte" record is fetched from the production backoffice (still online) to get name + brand, the new catalogue is searched for the same product, and the visitor lands on `/produkte/{category}/{path_field}`. If the product no longer exists, the brand page is the fallback, so the link equity still lands on the right entity.
  - A valid product under a wrong category segment now redirects to its canonical URL instead of 404.
- Legacy local-intent URLs (`/exklusive-kuechen-vorarlberg`, `/interior-design-beratung-planung-vorarlberg`, `/wohnkonzepte-wohnzimmer-vorarlberg`) now point at the dedicated landing pages (`next.config.js`).

### 2.2 On-page SEO
- **Homepage H1** is now a static, server-rendered line in the hero ("Designermöbel & Interior Design in Vorarlberg", translated), visible on every slide. Slide brand names are no longer `h2` (react-slick clones each slide, which produced ~15 duplicate headings). The About section's CMS headline became the first `h2`.
- **Local landing pages** (`/de/kuechen-vorarlberg`, `/de/designermoebel-bregenz`, `/de/moebel-bodensee`, `/de/interior-design-vorarlberg`, `/de/wohnzimmer-einrichten-vorarlberg`): `index,follow`, added to `sitemap-static.xml`, JSON-LD `WebPage` + `BreadcrumbList` + `FAQPage`, Open Graph, shorter title for the interior-design page.
- **Brand pages**: meta description trimmed to snippet length (`toMetaDescription`), `og:description`/`og:image alt` fixed, unknown brands `noindex`.
- **Product pages**: EN/FR/IT titles and descriptions now prefer the localized product text over the German CMS meta (no more identical titles across locales). Brand label links to the brand page.
- **News**: article pages no longer crash when a translation is missing (German headline fallback for `<title>` and `<h1>`); teaser regex bug (`/s+/` stripped the letter "s") fixed; hub `<title>` now actually uses the CMS title.
- **Canonicals** can no longer be overwritten by a CMS URL field on beratung, kontakt, news, karriere, marken, partner, presse, team. Breadcrumb JSON-LD no longer emits `…/de/de`.
- **Translated URLs**: `/en/beratung`, `/fr/kontakt`, `/it/merkliste`, `/fr/news` etc. now 308 to the canonical translated URL instead of serving a duplicate (middleware `src/proxy.js`).
- Home metadata fallback (CMS down) now still carries canonical, hreflang and robots. About page H1 is descriptive instead of the bare word "PLATZHIRSCH". The 404 page has a real H1 and links to products, brands and contact.
- `/[locale]/[slug]` exports `revalidate = 3600` and only prerenders slugs it actually serves.

### 2.3 Privacy and consent
- `ConsentEmbed` gates Google Maps (contact page) and Street View (about page) behind the existing "Google Maps" opt-in, with a one-click "load map" placeholder; consent saved elsewhere (banner) is picked up live through a `ph-consent-change` event.
- Cookie banner: no more `window.location.reload()`; the choice is applied in place (Consent Mode update, GA load when granted). Settings modal is a real `role="dialog"` with close button and Escape; "show preferences" is a button; Accept and Reject have equal visual weight; the bar is more compact on phones and no longer injects an `<h3>` into every page outline.
- Removed the preconnect/dns-prefetch to Google that fired before consent.

### 2.4 UX, accessibility, conversion
- Design token `--color-gold-text` (#8a6d1f, ≈4.9:1 on white) for eyebrows/labels on light backgrounds; `#d1b250` stays for buttons, borders and dark panels. Global `:focus-visible` outline and `scroll-padding-top` so anchors don't land under the fixed header.
- Navbar: language switcher is a real button (`aria-expanded`, opens on click, no hover-toggle bug on touch tablets), Escape closes menus/drawer/search, mega menus open on keyboard focus, hamburger and drawer close button labelled and 44 px, drawer is a labelled `dialog`, desktop nav is a `<nav>` landmark, search input labelled, logo alt is meaningful, wishlist link announces its count, **tap-to-call in the mobile header**, "All products" link inside the mobile products accordion, Outdoor card links to the Outdoor group, `prefetch={true}` removed from every nav link.
- Brand page: dark showroom panel now offers **Book a consultation** (primary), **phone** and e-mail instead of a single `mailto:`; nested `<main>`/`<header>` replaced with `<section>`/`<div>`.
- Product page: **phone CTA** next to "Request consultation"; brand name links to the brand page.
- Contact page: "directions" link is always visible (was hover-only); marker image decorative.
- Hero carousel: pause/play control (WCAG 2.2.2), slide CTA has real link text, the 300 ms `setInterval` DOM polling is gone (tab order fixed via `afterChange`).
- Product-inquiry form: every label associated with its input (`htmlFor`/`id`), `autocomplete` on name/e-mail/address fields, focus ring in brand colour.
- Footer and consent bar moved out of `<main>`; browser scroll restoration re-enabled (Back no longer jumps to the top of catalogue pages).

### 2.5 Engineering hygiene
- Fetch timeouts (15 s) on the product, brand, layout and homepage fetchers.
- `JSON.parse(localStorage.cart)` guarded; corrupted values are dropped instead of crashing the app.
- Stray "/" on the homepage removed; the 355 KB CSS background image of the benefits section goes through `next/image` now.
- Dead code removed: `produkte/pageold.js`, `components/Unusable/page.js`, `i18n/request.js`, `i18n/routing.js`, `app/ClientLayout.js`, 14 unused components (old banners, Outdoor/Wohnen pages, itemsgrid, services, work with its syntax error, vernissage section), 4 unused flag PNGs. The expired Vernissage popup (last show 2026-09-04) is no longer mounted; the component stays for the next event.
- `*.log` ignored by git. New translation keys in all four `messages/*.json`.

### 2.6 Homepage redesign (requested mid-session)
Keyword data (SISTRIX, monthly clicks): "minotti" AT 500, "poliform" AT 350, "designermöbel" AT 200 / CH 300 / IT ("mobili di design") 300, "einrichtungshaus" AT 40, "interior design vorarlberg" 20, "küchenstudio vorarlberg" 20; search intent for "designermöbel" is **do + visit**. The homepage therefore leads with brands and the showroom, not with a brand slideshow.

New section order (all new sections are server components, no carousel JavaScript on the homepage any more):
1. **Hero** (`Home/Hero.js`): full-bleed Minotti image with left gradient, eyebrow, H1 "Designermöbel, Küchen & Interior Design in Vorarlberg", subline, primary CTA *Beratungstermin vereinbaren*, secondary *Marken entdecken*, trust row (35+ brands · showroom Lochau · delivery AT/DE/CH) and the seven strongest brand names as links above the fold.
2. **Brand wall** (`Home/BrandWall.js`): 12 logos from the Marken doctype (Minotti, Poliform, Rimadesio, Flos, Paola Lenti, Tom Dixon, ClassiCon, Treca, Eichholtz, Gloster, Tonon, Next125 first), each a link to its brand page, "all 36 brands" link. Replaces the autoplaying react-slick logo marquee in the About section.
3. **Category tiles** (`Home/CategoryTiles.js`): six product worlds with live product counts (sofas, beds, dining tables, kitchens, lighting, outdoor lounge) linking into `/produkte/[category]`.
4. About (CMS text, unchanged copy), trending products, benefits.
5. **Regions & services** (`Home/RegionLinks.js`, German only): the five local landing pages as cards plus the service area (Lochau · Bregenz · Dornbirn · Feldkirch · Lindau · Friedrichshafen · St. Gallen · Vaduz).
6. News teaser.
7. **Showroom CTA** (`Home/ShowroomCta.js`): CMS eyebrow + CTA, phone button, and an `<address>` card with street, hours, appointment note and a *Route planen* link. Replaces `Home/choice.js` (CSS-generated button text, no address).

Removed from the repo: `Home/banner.js` (react-slick hero), `Home/choice.js`; the About section lost its slick marquee. Design language kept: Montserrat, ink `#30373e`, gold `#d1b250` (buttons/dark panels) and `#8a6d1f` (text on white), 3 px radii, editorial whitespace, 4/3 image tiles.

### 2.7 Visual identity and motion (second design round, requested mid-session)
- **Display typeface**: Bodoni Moda (via `next/font`, self-hosted, variable with optical sizes) for the H1 and all homepage section titles; Montserrat stays for UI and body. The high-contrast Italian serif is the typography of the brands on the floor (Minotti, Poliform, Flos), which is why it reads as *this* showroom and not as a template. Exposed as the `font-display` utility; design tokens `stone` (#ece8e1), `bone` (#f7f5f1), `walnut`, `gold`, `gold-text`, `ink` live in `globals.css` `@theme`.
- **Motion, three devices only, all CSS and all off under `prefers-reduced-motion`**: (1) one page-load entrance — hero text settles up while the photograph eases from a 6 % zoom; (2) scroll-driven section reveals using the CSS `animation-timeline: view()` (no JavaScript, no IntersectionObserver; browsers without it show the content statically); (3) a slow typographic band of all 36 brand names in Bodoni above the logo wall, paused on hover/focus. Hover states: category photos scale 3 %, logos switch from grey to colour.
- **Homepage structure**: full-bleed hero (H1, lead sentence, two CTAs, trust row, seven brand links) → brand band + logo wall → category spread (one 2×2 feature tile, five 4:3 tiles, no gaps) → About (CMS) → trending products → benefits → **editorial SEO block with FAQ** → regions (DE) → news → showroom section on the same limestone surface as the other full-width sections (address, hours, route, phone).
- **Content for the four markets** (`src/lib/content/homeSeo.js`): a two-paragraph editorial text and a four-question FAQ per language, written around the SISTRIX clusters — brand terms, "designermöbel" (AT/CH), "mobili di design" (IT), and the local set (Vorarlberg, Bodensee, Bregenz, Lindau, Ostschweiz). Only facts already stated on the site are used (36 brands, address, hours, planning, delivery and assembly in AT·DE·CH). The FAQ is also emitted as `FAQPage` JSON-LD.
- **Lead capture without forms** (owner's choice: no extra forms): a phone-only sticky bar with *Call* and *Book a consultation* that appears after the first screen; hero CTAs; phone on brand and product pages; the showroom section with route link.
- **Bugs found by screenshot review**: the About section's entrance transform pushed the mobile layout viewport to 441 px (horizontal scroll on every phone) — fixed (vertical entrance, `overflow-x: clip` on `<main>`); muted text at 60–75 % opacity on limestone failed contrast — raised; the category grid left an orphan tile — regridded.

### 2.8 Footer, inner-page headers and keyword content (third round)
- **Footer** (`Reusable/Footer.js`, all pages): ink surface, display-face headings, a keyword-carrying tagline ("Einrichtungshaus für Designermöbel, Designerküchen und Leuchten am Bodensee …"), two conversion buttons (consultation, phone), then four columns — Showroom (address, hours, e-mail, route, social), Brands (10 brand pages), Product worlds (8 category pages), Service & regions (consultation, contact, about, newsletter, the five German landing pages, café) — and the legal row. Footer headings are `h2` (no more `h3` after `h1`).
- **Catalogue headers** (`Reusable/breadcrumbBar.js`): limestone header with a semantic breadcrumb (`<nav>`/`<ol>`, `aria-current`), the title in Bodoni and an intro sentence identical to the meta description — hub and every category page now carry it.
- **Content-page headers** (`Reusable/singlePageSlider.js`, 13 pages: Beratung, Kontakt, Team, News, landing pages …): bottom-left text over a gradient, display-face H1, semantic breadcrumb, no entrance animation.
- **Product and brand pages**: H1 and section titles in the display face (brand name no longer forced uppercase).
- **Keywords from SISTRIX (DE, monthly clicks)**: designermöbel 1,550 · designer sofa 1,350 · einrichtungshaus 1,250 · interior design (AT) 1,250 · esstisch design 500 · minotti sofa 450 · luxus sofa 400 · design gartenmöbel 400 · innenarchitekt (AT) 300 · designerleuchten 250 · designerbetten 150 · designerküchen 150. Applied as:
  - German category `<title>`/description per key (`shopSeoCopy.js`): "Designer Sofas in Vorarlberg – Sofas & Couches | …", "Designerbetten …", "Designerküchen …", "Designerleuchten …", "Design Esstische …", "Design Gartenmöbel & Loungemöbel …" etc., with the three strongest brands of the category in the description.
  - Beratung page fallback metadata now targets the *interior design* cluster: "Interior Design & Einrichtungsberatung in Vorarlberg" with Innenarchitektur in the description (CMS values still win when set).
  - Footer tagline and homepage SEO block use *Einrichtungshaus*, *Designermöbel*, *Designerküchen*, *Leuchten*, *Bodensee*, *Vorarlberg*; brand terms are carried by the brand links on every page.

### 2.9 Language switch (owner reported an error when changing language)
Reproduced with an automated browser (Puppeteer against the dev server) on 19 start pages × every other language = 57 switches, collecting the final URL, `<html lang>`, 404 state and console errors.
- Every switch lands on the right translated URL with the right `lang` (e.g. `/de/produkte/beds` → `/en/products/beds`, `/en/about-us/brands/minotti` → `/it/chi-siamo/marche/minotti`, `/de/news` → `/fr/nouvelles`).
- **The reported error**: on every switch the dev overlay showed React's *"Encountered a script tag while rendering React component"*. Cause: the Google Consent Mode default was an inline `<script>` (no data-block type) in the `[locale]` layout; a locale switch re-mounts that layout on the client and React re-creates the script element. Fix: the consent default now runs from `Cookies/cookiecomponent.js` (`ensureGtag`) right before gtag.js is requested — no Google tag loads before consent anyway, so the behaviour is unchanged and the layout carries no raw `<script>` any more. JSON-LD scripts (`type="application/ld+json"`) are data blocks and never triggered it.
- Also fixed in the switcher: the five German-only landing pages now switch to the target language's homepage instead of a 404; the query string (`?marke=`, `?q=`) is kept across a switch.
- Result after the fix: 57 switches, 0 console errors, 0 wrong languages, 0 404s.

### 2.10 Bug sweep (50 pages, 4 languages, key interactions)
Automated browser run against the dev server: 50 URLs (German, English, French, Italian; hub, categories, products, brands, collection, news article, landing pages, legal pages, deliberate 404s) plus interactions (accept cookies, live search, wishlist, mobile menu, Escape, sticky call bar, horizontal overflow).
- All pages 200 (the two deliberate 404s return 404), exactly one `<h1>` each, no failed requests, no console or JavaScript errors — except one:
- **Product pages logged a React hydration error** (pre-existing): the CMS description is rich text containing `<p>` tags and was rendered inside a `<p>` element. A `<p>` inside a `<p>` is invalid HTML, the browser closes the outer one and the server HTML no longer matches React's tree. Fixed in `ShopCatalog/productInfoTabs.js` (container is a `<div>` now). Re-checked on three product pages in two languages: clean.
- Interactions: cookie consent saves without reload and the bar disappears; search "minotti" returns results; wishlist stores the item; mobile menu opens and closes with Escape; sticky call bar appears after scrolling; mobile layout width exactly 390 px.

### 2.11 Code review (security, logic, edge cases) and responsive sweep
Three independent reviews of the full change set (security, correctness, duplication) plus an automated responsive sweep (9 widths from 320 to 1920 px × 12 pages = 108 renders).

**Security (fixed)**
- The legacy-URL resolver could be used to fan out uncached backend requests (any spelling of a brand slug + any old slug → up to N search calls, no cache). Now: exact brand slug only, slug shape validated, at most two search queries, both cached for 24 h; the backoffice lookup is cached 24 h.
- URL segment was interpolated raw into a server log line → JSON-encoded.
- `cookieConsent` cookie now carries `secure` on https (banner and map opt-in).
- 13 pages still emitted JSON-LD through a raw `<script>` without `<` escaping (stored XSS if a CMS value contained `</script>`) → all use the escaping `JsonLd` component now.
- CMS rich text rendered as HTML (product and collection descriptions) is now reduced to an allowlist on the server (`sanitizeCmsHtml`: p/br/strong/em/ul/ol/li/a with safe hrefs; script/iframe/event handlers removed).
- The CMS-defined homepage CTA link is accepted only as a site-relative path.
- Consent: re-granting analytics in the same session now actually sends "granted"; withdrawing deletes the `_ga`/`_ga_*` cookies.
- Verified fine: no open redirects (all targets start with `/{locale}` + route constants + slugified data), no SSRF (constant hosts + `encodeURIComponent`), no Google request before consent, cookie JSON parsing guarded, headers unchanged.

**Logic and edge cases (fixed)**
- Hero zoom overflowed the section for 1.6 s on load → `overflow-hidden`.
- Closing the cookie dialog with Escape/backdrop without a choice hid the consent bar for the whole SPA session → the compact bar stays until a choice is saved.
- Footer "privacy settings" opened the compact bar instead of the dialog (and could stack two bars) → opens the dialog directly.
- Map opt-in and the banner could diverge ("save selection" overwrote the map consent) → the banner listens to the consent event.
- The mobile call bar covered the footer's legal links → footer reserves space on phones.
- During a brand-backend outage every legacy URL became a soft 404 → the error now propagates (retriable 500, not de-indexing).
- The resolver could 308 permanently to a *similar* product of the same brand → exact name match only, otherwise the brand page.
- Category page: meta description and visible intro named different brands → one `topBrandsOf()` for both.
- Keyboard: mega menus opened on focus but never closed on blur → close when focus leaves trigger and panel; the Products trigger got `aria-haspopup`/`aria-expanded`.
- Verified fine: no redirect loops, no SSR `window` access, all translation keys exist in 4 languages, deleted files are not imported anywhere, next-intl `pathnames` map matches the real folders, sitemap/landing pages consistent.

**Duplication (consolidated now)**
- `src/lib/site.js` is the single source for phone, e-mail, address, directions URL and social links (the phone number was typed in 12 files, in two formats; the contact page used `tel:` with spaces). Header, footer, mobile bar, showroom section, brand pages, product actions, landing pages and contact page read from it.
- `src/lib/content/brands.js` (featured brands with slugs, ranked by slug so CMS spellings like "Tréca"/"Treca" can't drop a brand) feeds the hero, the brand wall and the footer; `src/lib/content/landingPages.js` feeds the footer, the regions block, the sitemap and the language switcher (four lists before, two of them with "keep in sync" comments).
- Theme tokens `night` and `ink-deep` replace the raw hex overlays/backgrounds in the new components; the one gold-on-white link on the landing pages uses `gold-text`.
- Three copy-paste route bugs fixed: wishlist path checked the contact route, the About page checked the partner route, and the news-article breadcrumb pointed at `/fr/news` instead of `/fr/nouvelles`.
- Content conflict fixed: the regions block claimed Schüller kitchens, the kitchen landing page names only next125 and Poliform.
- Seven unreferenced files removed (`lib/baseUrl.js`, `utils/routeMap.js`, `utils/getRoute.js`, `utils/getPathbyLocale.js`, `utils/getProductKeyword.js`, `api/Keywords/fetchProductsKeywords.js`, `components/Marken/marken.js`); nine unused translation keys removed from all four languages.

**Duplication (backlog, documented by the audit, not changed)**
- 14 page files each define their own `getBaseUrl()`/`get…PageUrl()` switch and "Home"/"Produkte" breadcrumb ternaries (68 `locale === "it" ?` chains in 21 files); the helpers `localeUrl`/`hreflangAlternates`/`ROUTES` already exist.
- Open Graph locale `de_DE` vs `de_AT` and `inLanguage` `en` vs `en-US` differ between pages → one `OG_LOCALE`/`IN_LANGUAGE` module.
- 9 near-identical `lib/api/Keywords/*` fetchers → one `fetchPageKeywords(doctype)`.
- ~290 inline `#30373e` and ~290 `#d1b250` classes in older components although the tokens exist; two button styles (new sentence-case vs old uppercase) → a shared button class map.
- 18 whole translation namespaces no component loads (left over from deleted components).

**Responsive sweep**
- No horizontal scroll at any of the 9 widths on any of the 12 pages.
- Two overflows found and fixed: the category-group header on the catalogue hub at 320 px (now wraps) and the e-mail address in the landing-page showroom column at 1024 px (now breaks).
- Remaining small tap targets (under 32 px) are pre-existing: breadcrumb links (16 px tall text), react-slick gallery dots (20 px) on brand pages, thumbnail arrows (28 px) on product pages. Lighthouse's own tap-target audit passes; enlarging the slick dots is a one-line CSS follow-up.

### 2.12 Browser audit follow-up (owner's Claude-extension report, 2026-10-07)

The owner ran the site through a browser agent that clicked every page and sent back a prioritised list. Findings were triaged into three groups; this section covers the code-level group. The remaining two (invalid or already fixed; needs owner material) are in §4/§5.

**Content claims replaced with facts (all four languages)**
- `Benefits.service1/2/4` promised "free premium delivery", "certified technicians" and a "lifetime quality guarantee" — none of which is documented. Replaced with verifiable USPs: delivery and assembly by the own team in AT/DE/CH, planning to measure, original pieces in the showroom.
- Brand pages' eyebrow "Exklusiv in Österreich" → "Im Showroom in Lochau" (exclusivity is a dealer-contract claim we cannot verify).
- Contact form: "Willkommen zurück!" (makes no sense for a first visit) → "Schreiben Sie uns"; "Hauptsitz" → "Showroom Lochau".
- Italian: "CASA" / "Casa" as the home label in the navbar and in 19 breadcrumb files → "Home" (the Italian web convention).

**Navigation**
- Product mega menu: "Küchen" (kitchen, kitchen accessories) and "Licht" (lamps) are groups of their own, no longer buried under "Wohnaccessoires". Outdoor keeps index 4, so the `#group-5` anchor still works.
- Language switcher: the options are real links (`<a hreflang href>`), so the crawler sees them and middle-click / long-press work. The target URL is computed per page, including dynamic routes (product, brand, article) via a longest-prefix match on `ROUTES` — before, `/en/produkte/beds` only worked through the middleware's 308. The list closes with a 250 ms grace period so the pointer can travel from the trigger into the list (the audit's "dropdown closes before I can click").

**Product data as displayed**
- Product names: import suffixes "(Sofas)", "(Sofas 2)", "(Variant)" are stripped for display in cards, detail page, related products and the homepage (`cleanProductName`; slugs untouched).
- Brand names: "Schueller" → "Schüller", "Treca" → "Tréca" (`displayBrandName`, used on product cards, product page and the brand page H1).
- Product description: paragraphs of `mehr_beschreibung` that repeat `beschreibung` (≥ 60 % shared words) are dropped — the audit saw the same manufacturer text twice on most products.
- Category label on the product page (breadcrumb, chip, "back" link, footer): the CMS category name via `fetchKategorien`, so "sofas-couches" no longer surfaces as a raw slug. Fallback: the old localisation table, then a humanised slug.
- Hub meta descriptions no longer name Cassina (not a brand of the house) — Rimadesio instead.
- Homepage "trending" block: newest Minotti products first instead of alphabetical.

**Conversion**
- "Beratung anfragen" on a product page links to the consultation wizard with `?produkt=<brand> <name>`; the wizard's message field starts with "Anfrage zu: …" so the visitor never has to say which piece. `BeratungClient` reads it with `useSearchParams` inside a `<Suspense>` boundary.
- Catalogue: 24 products per "show more" step (was 12); filter options with zero products are hidden unless selected, and a filter with a single option disappears (it decides nothing).
- Product gallery: arrows 44 px (were 28 px, below the touch-target minimum); the main image is 4:3 on phones and square from `lg` up, so the title and price area come into view without scrolling.

**Animation robustness**
- `FadeInView`: after 1.2 s the content is forced visible regardless of the IntersectionObserver (the audit found the team, brand grid and consultation steps blank in automation and at some zoom levels), and stagger delays are capped at 600 ms (the brand grid's `index × 70 ms` added up to ~3 s of blank cards).

**Smaller**
- News article title length for the meta title: 58 → 65 characters.
- Language switch did not navigate on click (owner report after the merge): the header closes every menu when focus lands outside a menu root, and the language list (desktop) and the mobile drawer were not marked as roots. The mousedown on an option focused it, the list unmounted, and the click never fired — on desktop since the options became links, on mobile also before. Fixed by marking the language wrapper as a menu root and exempting the mobile drawer; verified with real pointer/touch clicks on 4 desktop and 3 mobile pages (all land on the localised URL, query string kept).
- Homepage hero on phones and tablets (owner report): the section had a fixed 600 px height while headline + lead + CTAs + trust row need more, so the block overflowed upward under the fixed header and the H1 was cut off at 360–768 px. The hero now has a minimum height instead of a fixed one, the H1 is 36 px on phones (was 41.6 px) and 56 px on tablets; verified with screenshots at 360, 390, 430, 768 and 1024 px.

**Verified on the owner's dev server (port 3001)**: no console or page errors on home, category, product, consultation (with `?produkt=`), brand (Schüller), team, Italian products, French home; the wizard's textarea is pre-filled after two steps; language links resolve to localised URLs on 6 route types; 0 FadeInView blocks invisible after 2 s on the brand, news and home pages.

## 3. Verification

- `next build`: **success** (7,560 static pages, ~2 min).
- Redirects on the production build (port 3200):

| URL | Result |
|---|---|
| `/de/produkte/minotti` | 308 → `/de/ueber-uns/marken/minotti` |
| `/de/produkte/solpuri/classic-esstisch-tables-solpuri` | 308 → `/de/ueber-uns/marken/solpuri` (product no longer in the new catalogue → brand fallback) |
| `/en/products/rimadesio` | 308 → `/en/about-us/brands/rimadesio` |
| `/en/beratung` | 308 → `/en/consultation` |
| `/fr/news` | 308 → `/fr/nouvelles` |
| `/de/kuechen-vorarlberg` | 200, `index,follow`, FAQPage + WebPage + BreadcrumbList JSON-LD |
| `/de/nonexistent` | 404 |

- Homepage: exactly one `<h1>`, section headings `h2`, no Google requests before consent.
- Product page EN: English title and description (was German).

- Lighthouse 13, mobile emulation, local `next build` + `next start`, median of runs. "Before" = this branch before the homepage redesign (old react-slick hero); the untouched `develop` build was not measured separately. (Earlier figures taken on port 3100 were from a *development* server and are not comparable.)

| Page | Perf before → after | A11y | Best practices | SEO | LCP before → after | TBT before → after |
|---|---|---|---|---|---|---|
| Home `/de` | 57 → **83** | 96 → 100¹ | 100 | 100 | 5.3 s → 4.5 s | 860 ms → **130 ms** |
| Brand `/de/ueber-uns/marken/minotti` | 80 → **83** | 96 → **100** | 100 | 100 | 4.0 s → 4.2 s | 290 ms → **100 ms** |
| Catalogue hub `/de/produkte` | 84 → **88** | 96 → 100¹ | 100 | 100 | 4.1 s → 3.8 s | 190 ms → **100 ms** |
| Category `/de/produkte/beds` | 86 → 84 | 94 → 100¹ | 100 | 100 | 3.6 s → 4.2 s | 220 ms → **160 ms** |

¹ The final run still reported two accessibility findings (an invalid `<dl>` in the new showroom card, and 60 %-opacity muted text at 3.9:1); both were fixed right after the measurement, which is what the confirmation run in section 3.1 verifies.

Remaining LCP (≈4 s on a throttled 4G mobile profile) is the hero photo itself; next steps are a smaller mobile crop (`<picture>`/art direction) and serving the hero as AVIF.

### 3.1 Confirmation run (final build, after the design rounds 2.6–2.8)

| Page | Perf | A11y | Best practices | SEO | LCP | TBT |
|---|---|---|---|---|---|---|
| Home `/de` (new hero, brand band, category spread, SEO block, footer) | 78 | **100** | 100 | 100 | 5.0 s | 210 ms |
| Category `/de/produkte/beds` (new header, footer) | 78 | **100** | 100 | 100 | 4.7 s | 250 ms |
| Consultation `/de/beratung` | 79 | 96 | 100 | 100 | 4.8 s | 160 ms |

Mobile horizontal overflow check (390 px): 0 elements wider than the viewport on home and category pages. The remaining LCP is the full-bleed hero photograph on a throttled 4G profile; a dedicated mobile crop and AVIF are the next step.

All static chunks of the final build return 200, the homepage ships no carousel JavaScript, and the redirects above were re-verified on the same server.

- ESLint: the repository already failed on `develop` with `react-hooks/set-state-in-effect` errors (React Compiler rule shipped with Next 16's config, e.g. `productGallery.js`, `CartContext.js`). No new rule violations were introduced; the build does not run ESLint.

## 4. Decisions the owner should confirm

1. **Landing pages are now indexable.** Their copy was marked "placeholder, check before indexing" in the code. Facts used (Landstraße 9, Tue–Fri 10–18, Sat 10–14, delivery across Austria, brand list) match the footer and the rest of the site, but please read the five pages once.
2. **Brand claims**: pages say "bei Platzhirsch" / "Händler" in titles for Minotti, Poliform, Tonon, Next125, Paola Lenti. Confirm these are authorised dealerships before launch (not changed here).
3. **Address**: code and schema use *Landstraße 9*; the old live footer shows *Landstraße 11*. Google Business Profile, Impressum and schema must match.
4. **NEW_API_SERVER** is not set in `.env.local`, so the catalogue reads from the internal dev instance `10.30.70.201:8000`. It must point at the production backend before deploy.
5. **Product schema has no `offers`** (no published prices). Search Console will show "not eligible for rich results" warnings on products; that is expected unless prices or "price on request" offers are added.
6. Vernissage popup is unmounted (event over). Remount in `client-layout.js` for the next event.
7. **Audit findings that are not defects** (browser-agent report, 2026-10-07): "sticky header hides the breadcrumb" (it has `scroll-padding-top`), "no hreflang" (present on every page), "Merkliste form asks for address" (the backend API `anfrage_produkt` requires country/city/address — removing fields needs a backend change), "news dates missing" (the CMS has none), "cookie banner reappears" (only while no choice is stored).

## 5. What is still open (next sprint, by impact)

1. **Deploy** `develop` + this branch to production: the old URLs only recover once the 308s are live. Then in Search Console: submit `sitemap.xml`, request indexing for the 5 landing pages and the 10 top brand pages, watch "Page with redirect".
2. **Brand-dealer content** for AT/DE/CH/IT: each top brand page needs 300–500 words of own text per language (showroom pieces, services, "Minotti Händler Vorarlberg / Bodensee / Ostschweiz"), plus a local section (Lochau, Bregenz, Dornbirn, Lindau, St. Gallen). This is the main lever against m-studio.at, kramerundkramer.at and the German dealers.
3. **Google Business Profile**: hours, photos, products, posts; the site now links to it via `hasMap`.
4. **Core Web Vitals**: the remaining JS weight is react-slick (hero, about, brand page, gallery) and the 1,150-line client navbar. Next steps: CSS scroll-snap hero without react-slick, split the navbar (server-rendered links + small client islands), `useLocale()` instead of `usePathname()` in the 15 components that are client-only for the locale.
5. Remaining a11y items: cookie detail toggles are still `<span onClick>`; product tabs lack arrow-key navigation; mobile drawer has no focus trap.
6. Collection pages and the About page have no JSON-LD yet; news article URLs stay `/fr/news/…` while the hub is `/fr/nouvelles` (consistent but worth unifying).
7. Backlinks: brand manufacturers' dealer locators (Minotti, Poliform, Rimadesio, Flos …) should link to the brand pages; local directories (WKO, Herold, Vorarlberg Tourismus).
8. **Owner material the audit asks for** (cannot be invented): project/reference photos with one paragraph each; an "Ausstellungsstücke" page with pieces and prices; "ab"-price ranges per category; Google reviews (link or widget consent); team roles and direct contacts; per-brand showroom collections and photos; FR/IT translations of the dealer blocks in the CMS; delivery and customs facts for DE/CH; WhatsApp number or booking tool for showroom appointments; the "below products" USP texts in the CMS.
