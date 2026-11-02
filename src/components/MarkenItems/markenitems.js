// Brand page (/ueber-uns/marken/[title], all four locales) – Neuauftritt.
// Server Component: everything a crawler needs is in the HTML, no carousel JS.
// Design-Bibel §10.2 "Marke": name as H1, origin (place and year), pieces in
// the showroom, the formula "<Marke> in unserer Ausstellung in Lochau", NO
// dealer seal. Dealer wordings from the backoffice only pass through
// resolveShowroomText() (ClassiCon only, see showroomText.js).
//
// QA Runde 1 (qa-screenshots/neuauftritt/marken/feedback.md):
// - P1-1 prose only in the page language, missing blocks are left out
// - P1-2 no public placeholders ("Foto folgt", "Porträt folgt")
// - P2-1/2 images take their real aspect ratio, room image only ≥ 1600 px
// - P2-3/4 category list with gap + count at the name, mobile scroll rows,
//   shortened story and category list (<details>, content stays in the HTML)
// - P2-5 voice filter (hasVoiceViolation) on lead, story, design approach, craft
// Runde 2: design approach as a plain paragraph (no quote, no founder caption),
// craft only with a source, claim filter (perfekt*, „in ganz Österreich“ …).
// - P2-7 alt = CMS alt_text or "{brand} – Raumansicht", credit only in figcaption
import Image from "next/image";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import PlanLinks, { featureOn } from "@/components/Reusable/PlanLinks";
import { brandPlanLinks } from "@/lib/crossSell";
import BrandTile from "./brandTile";
import { glueDash } from "@/components/ShopCatalog/copy";
import { staggerStyle } from "@/components/ShopCatalog/motion";
import { typoQuotes } from "@/lib/shop/format";
import { Monogram } from "@/components/Brand";
import {
  Badge,
  Breadcrumbs,
  Button,
  CTABand,
  Card,
  Container,
  Eyebrow,
  Grid,
  Heading,
  Lead,
  Leitsatz,
  LinkArrow,
  Section,
} from "@/components/ui";
import { ROUTES } from "@/utils/routing";
import { PHONE_DISPLAY, PHONE_HREF, EMAIL, EMAIL_HREF, ADDRESS, SITE_URL } from "@/lib/site";
import { displayBrandName } from "@/lib/content/brands";
import { formatCollectionName, collectionPath } from "@/lib/marken/collections";
import JsonLd from "@/components/Reusable/JsonLd";
import { generateSlug } from "@/lib/slugify";
import { brandGuide } from "@/lib/content/brandGuides";
import { minottiBodensee } from "@/lib/marken/minottiBodensee";
import { ownCalendarActive } from "@/components/Booking/config";
import { faqPageSchema } from "@/lib/seo/faqSchema";
import { makeTr, uniqueLinks, withoutRepeatedParagraphs, withoutSentence } from "./copy";
import { dealerStudio } from "@/lib/legal/claims";
import { withContext } from "@/lib/forms/beratungContext";
import { cleanCraftEntries, cleanProse, isVerifiedDealer, resolveShowroomText } from "@/lib/legal/manufacturerText";
import { buildBrandCategories, brandCategoryHref, brandCategorySlug } from "@/lib/marken/brandCategory";
import { withoutNonProducts } from "@/lib/marken/brandCategoryAudit";
import {
  brandFacts,
  brandImageSet,
  brandIntro,
  brandStory,
  catalogHref,
  formatFounders,
  groupProductsByCategory,
  headlineCategories,
  localized,
  localizedCraft,
  showroomPiecesFor,
} from "./brandData";

// How many category chapters show product tiles (3 each = one row of the
// 3-column grid, Bibel §6: max. 3 columns).
const CHAPTERS_WITH_TILES = 4;
const TILES_PER_CHAPTER = 3;
// Category list: the first ones visible, the rest behind "Alle n Kategorien".
const VISIBLE_CATEGORIES = 6;
// Story: the first paragraphs visible, the rest behind "Weiterlesen".
const VISIBLE_PARAGRAPHS = 2;
// Hero photos at least this wide (w/h) run across the full width above the text.
const WIDE_HERO_RATIO = 1.6;

// Construction placeholders ("Foto folgt", monogram instead of a portrait)
// are never public: only in development AND only on request
// (PH_SHOW_PLACEHOLDERS=1, e.g. for the styleguide) – QA Runde 1, P1-2.
const SHOW_PLACEHOLDERS = process.env.NODE_ENV !== "production" && process.env.PH_SHOW_PLACEHOLDERS === "1";

// Vertical rhythm: compact on phones (page length, QA P2-4), Bibel scale from md.
const SECTION_Y = "py-12 md:py-section";
// Phones show the first chapters only; the rest stay in the HTML and are
// reachable through the category list (QA P2-4: page ≤ 9,000 px at 393 px).
const CHAPTERS_ON_PHONE = 2;

/**
 * Manufacturer image, uncropped (Jury §3.1, licence) in a box of its OWN
 * aspect ratio – no linen bars. `minRatio` is the tallest format allowed
 * (Bibel §6); the box never gets taller than 80 % of the viewport.
 */
// bleed: below lg the picture runs edge to edge (QM wm-fix3: a wide hero was
// only ~320×140 px on a phone) – same uncropped image, the caption stays on the gutter.
// maxPx (QM wm-r4): upper width in CSS px – the full-width hero never shows a
// manufacturer file larger than 0.8 × its own pixel width (≤ 1.6× on Retina).
function BrandFigure({ image, alt, credit, minRatio = 0.8, fallbackRatio = 1.5, sizes, preload = false, className = "", bleed = false, maxPx = null }) {
  const ratio = image.ratio ? Math.max(image.ratio, minRatio) : fallbackRatio;
  const r = Number(ratio.toFixed(4));
  const maxWidth = maxPx ? `min(calc(80svh * ${r}), ${maxPx}px)` : `calc(80svh * ${r})`;
  return (
    <figure className={`${bleed ? "max-lg:-mx-gutter" : ""} ${className}`}>
      <div className="relative w-full overflow-hidden bg-linen" style={{ aspectRatio: String(r), maxWidth }}>
        <Image src={image.src} alt={alt} fill sizes={sizes} preload={preload || undefined} className="object-contain" />
      </div>
      <figcaption className={`mt-2 text-small text-text-soft ${bleed ? "max-lg:px-gutter" : ""}`}>{credit}</figcaption>
    </figure>
  );
}

function CategoryLinks({ items, locale, brandName, indexable, topLine = true }) {
  // Own hairline per column (top line on the first row of each layout),
  // 32 px column gap, count in brackets right at its own name (QA P2-3).
  // Indexable brand × category combinations link to their own page (R3,
  // internal links for "Minotti Sofas"), the rest to the filtered catalogue.
  return (
    <ul className="grid grid-cols-1 @min-[40rem]/page:grid-cols-2 @min-[40rem]/page:gap-x-grid @7xl/page:grid-cols-3">
      {items.map((c) => (
        <li
          key={c.key}
          className={`border-b border-line ${topLine ? "first:border-t @min-[40rem]/page:nth-2:border-t @7xl/page:nth-3:border-t" : ""}`}
        >
          <a
            href={`/${locale}${
              indexable?.has(brandCategorySlug(c.key)) ? brandCategoryHref(brandName, c.key, locale) : catalogHref(locale, c.key, brandName)
            }`}
            className="flex min-h-12 items-center py-2 pr-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
          >
            <span>
              {c.label} <span className="tabular text-small text-text-soft">({c.count})</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function categoryList(labels, locale) {
  const items = labels.filter(Boolean);
  if (!items.length) return "";
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
  } catch {
    return items.join(", ");
  }
}

export default async function BrandPage({ marke, locale = "de", kategorien = [], collections = [], products = [] }) {
  const t = await getTranslations({ locale, namespace: "marken" });
  const tr = makeTr(t, locale, "marken");

  const brand = displayBrandName(marke.name1);
  const facts0 = brandFacts(marke, locale, brand);
  const { country, founded } = facts0;
  const allowDealer = isVerifiedDealer(marke.name1);

  // Prose: page language only, cleaned (P1-1, P2-5).
  const intro = brandIntro(marke, locale, tr, facts0);
  const story = brandStory(marke, locale);
  const approach = cleanProse(localized(marke, "desing_approach", locale), { allowDealer });
  const craft = cleanCraftEntries(localizedCraft(marke.craft_disciplines, locale), { allowDealer });
  const founders = formatFounders(marke.grunder, locale);

  const { hero: heroImage, story: storyImage, room: roomImage } = await brandImageSet(marke);
  const credit = tr("imageCredit", { brand });
  const altFor = (img, key) => img?.alt || tr(key, { brand });

  const chapters = groupProductsByCategory(products, kategorien, locale);
  // Same decision as robots and sitemap of the brand × category pages.
  const indexableCategories = new Set(
    (buildBrandCategories(withoutNonProducts(products), { [marke.name1]: collections })[0]?.categories || [])
      .filter((c) => c.indexable)
      .map((c) => c.slug)
  );
  const pieces = showroomPiecesFor(marke.name1, products, locale);
  const showroom = resolveShowroomText(
    marke,
    locale,
    { title: tr("showroomNeutralTitle", { brand: "{brand}" }), text: tr("showroomNeutralText", { brand: "{brand}" }) },
    brand
  );

  const markenPath = ROUTES.marken[locale] || ROUTES.marken.de;
  // R5 (ux P2): Termin link with brand context (?produkt=Minotti → first
  // message line "Anfrage zu: Minotti", src/lib/forms/beratungContext.js).
  const beratungPath = withContext(ROUTES.beratung[locale] || ROUTES.beratung.de, { produkt: brand });
  const overline = [country, founded && tr("since", { year: founded })].filter(Boolean).join(" · ");

  const facts = [
    country && { label: tr("factOrigin"), value: country },
    founded && { label: tr("factFounded"), value: founded, tabular: true },
    founders.text && { label: founders.count > 1 ? tr("factFounders") : tr("factFounder"), value: founders.text },
    chapters.total > 0 && { label: tr("factCatalog"), value: tr("factCatalogValue", { count: chapters.total }), tabular: true },
    // Phones: the category count is already in "Alle n Kategorien" (P2-4).
    chapters.list.length > 0 && { label: tr("factCategories"), value: String(chapters.list.length), tabular: true, phone: false },
  ].filter(Boolean);

  // R5 (seo P2-10): H1 = brand + its main categories ("Minotti" / "Sofas,
  // Sessel und Tische") – no dealer or showroom claim, only catalogue facts.
  // Rat 9,5 A8: by product count (≥ 5 pieces, at most 3), not by catalogue order.
  const h1Categories = categoryList(headlineCategories(chapters.list).map((c) => c.label), locale);
  const tiled = chapters.list.filter((c) => c.items.length > 0).slice(0, CHAPTERS_WITH_TILES);
  const visibleCategories = chapters.list.slice(0, VISIBLE_CATEGORIES);
  const moreCategories = chapters.list.slice(VISIBLE_CATEGORIES);
  const storyVisible = story.slice(0, VISIBLE_PARAGRAPHS);
  const storyMore = story.slice(VISIBLE_PARAGRAPHS);
  // Design-Ansatz (Backoffice „desing_approach“): beschreibender Herstellertext,
  // KEIN Zitat. Kein <blockquote>, keine Anführungszeichen, keine Gründer als
  // Urheber – die Gründer stehen nur in der Faktenleiste (Runde 2, recht P0-1:
  // erfundene Zitatzuschreibung, § 2 UWG, § 43 ABGB).
  const approachLabel = t.has("designApproach") ? t("designApproach") : "Design-Ansatz";
  const approachBlock = (className = "") => (
    <div className={`border-t border-line pt-4 ${className}`} data-brand-approach="">
      <p className="max-w-measure text-body text-text-soft">
        <span className="font-medium text-text">{approachLabel}{locale === "fr" ? " :" : ":"}</span> {approach}
      </p>
    </div>
  );
  // QM wm-r4: wide hero photo → full width above the text (see the hero).
  const wideHero = Boolean(heroImage?.ratio && heroImage.ratio >= WIDE_HERO_RATIO);
  const heroActions = (
    <div className="mt-stack-m flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Button href={beratungPath} variant="primary" arrow>
        {tr("ctaAppointment")}
      </Button>
      <Button href="#stuecke" variant="secondary">
        {tr("ctaPieces")}
      </Button>
    </div>
  );
  const askHref = `${EMAIL_HREF}?subject=${encodeURIComponent(tr("piecesAskSubject", { brand }))}`;

  // SEO-Team A (AP-1/AP-7, GEO W7, 31.10.2026): own, citable prose + FAQ for
  // the priority brands (src/lib/content/brandGuides.js). Dealer sentences in
  // it come only from the Claim-Guard; H1 "<Marke> bei Platzhirsch in Lochau"
  // (Minotti: studio name from the claim register).
  const brandSlug = generateSlug(marke.name1);
  const guide = brandGuide(brandSlug, locale, brand);
  const guideCategoryLinks = guide
    ? chapters.list
        .filter((c) => indexableCategories.has(brandCategorySlug(c.key)))
        .slice(0, 3)
        .map((c) => ({ href: "/" + locale + brandCategoryHref(marke.name1, c.key, locale), label: brand + " " + c.label }))
    : [];
  // QM wm-r4: every target once per page. The "Planen & Erleben" band
  // (PlanLinks, DE) already carries the Sofaplaner, 3D/AR and "So arbeiten
  // wir"; the Bodensee list only keeps what neither list above shows
  // (Ratgeber, Schweiz, Sofaplaner and Termin stood two to three times).
  const planLinks = brandPlanLinks({ locale, brand: marke.name1, on: featureOn() });
  const planHrefs = planLinks.length ? [...planLinks.map((l) => l.href), "/arbeitsweise"] : [];
  const guideLinks = guide ? uniqueLinks([...guideCategoryLinks, ...guide.links], planHrefs) : [];
  const pageUrl = SITE_URL + "/" + locale + markenPath + "/" + brandSlug;
  const guideSourceHost = guide?.sourceUrl ? guide.sourceUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") : "";
  // „Minotti am Bodensee“ (nur Minotti, nur DE): Studio-Satz aus dem Claim-Guard,
  // Adresse aus site.js, Wege zu Sofaplaner, Termin, Ratgebern und Yacht-Interieur.
  const bodensee0 = minottiBodensee({ slug: brandSlug, locale, calendar: ownCalendarActive(), on: featureOn() });
  const bodensee = bodensee0 && {
    ...bodensee0,
    links: uniqueLinks(
      bodensee0.links.filter((l) => !(guideLinks.length > 0 && l.id === "termin")),
      [...planHrefs, ...guideLinks.map((l) => l.href)]
    ),
  };
  // Eine FAQ-Liste (sichtbar + ein FAQPage-Knoten): Leitfaden-Fragen + Bodensee-Frage.
  const faqItems = [...(guide?.faq || []), ...(bodensee?.faq || [])];
  // QM wm-fix4: the studio sentence stands once – in "Im Showroom" (with the
  // evidence link); the guide section keeps its own sentences around it.
  const studioSentence = dealerStudio(brandSlug, locale)?.statement || "";
  const shownInShowroom = studioSentence && String(showroom.text || "").includes(studioSentence) ? studioSentence : "";

  return (
    // R6-produkt-perf: product tiles (BrandTile) and the category list are
    // plain <a href="/{locale}/…">; this wrapper turns their clicks into
    // client navigation and prefetches on hover/focus (one listener).
    <LinkDelegate className="bg-surface text-text">
      {/* R6-produkt-perf (Fix): no Suspense boundary here – React 19 outlines large boundaries into a hidden <div id="S:0"> after </main>, so without JS the content was missing. */}
      <>
        {/* ------------------------------------------------------------ */}
        {/* HERO – text beside the image (manufacturer image uncropped,    */}
        {/* Jury §3.1), never text on the image.                           */}
        {/* ------------------------------------------------------------ */}
        <Section spacing="none" labelledBy="brand-title" className="pt-8 pb-12 md:pt-12 md:pb-16 lg:pb-20">
          <Breadcrumbs
            items={[
              { label: t.has("breadcrumbHome") ? t("breadcrumbHome") : "Home", href: "/" },
              { label: t.has("breadcrumbBrands") ? t("breadcrumbBrands") : "Marken", href: markenPath },
              { label: brand },
            ]}
          />
          {/* QM wm-r4: a wide hero photo (≥ 1.6:1, e.g. the Minotti panorama) no
              longer sits as a small flat strip beside a four-line H1 (iPad
              landscape, desktop): H1 across the full width, below it the photo
              over 8 columns (capped at 0.8 × its pixel width) with lead and
              buttons beside it. Phones keep the photo first. Columns from the
              page container's 64 rem, so 200 % text size stacks. */}
          <div className={`mt-8 grid grid-cols-1 gap-8 @5xl/page:mt-12 @5xl/page:grid-cols-12 @5xl/page:gap-grid ${wideHero ? "@5xl/page:items-end" : "@5xl/page:items-center"}`}>
            <div className={wideHero ? "@5xl/page:col-span-12" : "@5xl/page:col-span-5"}>
              {overline && <Eyebrow className="mb-stack-s">{overline}</Eyebrow>}
              <Heading id="brand-title" level={1} className="break-words max-sm:text-[length:min(var(--text-display-l),12vw)]">
                {guide?.h1 || brand}
                {/* the space keeps the accessible name "Minotti Sofas …" */}
                {h1Categories && " "}
                {h1Categories && (
                  <span className="mt-stack-s block font-sans text-title text-text-soft">{h1Categories}</span>
                )}
              </Heading>
              {intro && !wideHero && <Lead className="mt-stack-m">{intro}</Lead>}
              {!wideHero && heroActions}
            </div>
            {heroImage && (
              <BrandFigure
                className={wideHero ? "order-first @5xl/page:order-none @5xl/page:col-span-8" : "order-first @5xl/page:order-none @5xl/page:col-span-7"}
                bleed
                image={heroImage}
                alt={altFor(heroImage, "altHero")}
                credit={credit}
                minRatio={0.8}
                fallbackRatio={1.5}
                preload
                maxPx={wideHero && heroImage.width ? Math.round(heroImage.width * 0.8) : null}
                sizes={wideHero ? "(min-width: 1440px) 860px, (min-width: 1024px) 64vw, 100vw" : "(min-width: 1280px) 760px, (min-width: 1024px) 56vw, 100vw"}
              />
            )}
            {wideHero && (
              <div className="@5xl/page:col-span-4 @5xl/page:pb-8">
                {intro && <Lead>{intro}</Lead>}
                {heroActions}
              </div>
            )}
          </div>
        </Section>

        {/* ------------------------------------------------------------ */}
        {/* FAKTENZEILE                                                    */}
        {/* ------------------------------------------------------------ */}
        {facts.length > 0 && (
          <Container as="section" aria-label={tr("factsLabel")}>
            {/* QM wm-fix4: phone columns are at least 9rem – two columns at normal
                size, one at 200 % text size (labels were split „HERKUN|FT“). */}
            <dl className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,9rem),1fr))] border-t border-line @3xl/page:grid-cols-3 @3xl/page:border-b @5xl/page:grid-cols-5">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className={`min-w-0 break-words hyphens-auto border-b border-line py-5 pr-4 @3xl/page:border-b-0 lg:py-6 ${f.phone === false ? "hidden md:block" : ""}`}
                >
                  <dt className="text-overline uppercase text-text-soft">{f.label}</dt>
                  <dd className={`mt-2 text-ui text-text ${f.tabular ? "tabular" : ""}`}>{f.value}</dd>
                </div>
              ))}
            </dl>
          </Container>
        )}

        {/* QM wm-r4: the pieces come right after hero and facts – before, six
            screens of prose stood between the hero and the first product photo
            (Minotti). All text stays in the HTML below. */}
        {/* ------------------------------------------------------------ */}
        {/* PRODUKTLISTE NACH KATEGORIE                                    */}
        {/* ------------------------------------------------------------ */}
        {chapters.list.length > 0 && (
          <Section tone="raised" spacing="none" labelledBy="brand-catalog" id="stuecke" className={`scroll-mt-24 ${SECTION_Y}`}>
            <div className="grid grid-cols-1 gap-8 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
              <div className="@5xl/page:col-span-5">
                <Eyebrow className="mb-stack-s">{tr("catalogEyebrow")}</Eyebrow>
                <Heading id="brand-catalog" level={2}>
                  {tr("catalogTitle", { brand })}
                </Heading>
                <Lead tone="soft" className="mt-stack-m hidden sm:block">
                  {tr("catalogLead")}
                </Lead>
              </div>
              <nav aria-label={tr("catalogNav", { brand })} className="@5xl/page:col-span-7">
                <CategoryLinks items={visibleCategories} locale={locale} brandName={marke.name1} indexable={indexableCategories} />
                {moreCategories.length > 0 && (
                  <details className="ph-accordion">
                    <summary className="flex min-h-12 cursor-pointer items-center gap-2 border-b border-line py-2 text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                      {tr("categoriesAll", { count: chapters.list.length })}
                    </summary>
                    <CategoryLinks items={moreCategories} locale={locale} brandName={marke.name1} indexable={indexableCategories} topLine={false} />
                  </details>
                )}
              </nav>
            </div>

            {tiled.map((c, i) => (
              <div key={c.key} className={`mt-10 lg:mt-24 ${i >= CHAPTERS_ON_PHONE ? "hidden sm:block" : ""}`}>
                <div className="mb-6 flex flex-col gap-2 border-t border-line pt-6 sm:flex-row sm:items-end sm:justify-between">
                  <Heading level={3}>{c.label}</Heading>
                  <LinkArrow href={catalogHref(locale, c.key, marke.name1)}>
                    {tr("catalogAll", { category: c.label, brand })}
                  </LinkArrow>
                </div>
                {/* Phones: one native scroll-snap row (66 % cards, the next one
                    peeks in); from 640 px the three pieces stand in one row
                    (QM wm-r4: in two columns the third stood alone, iPad portrait). */}
                <ul
                  role="list"
                  aria-label={tr("chapterLabel", { category: c.label, brand })}
                  className="reveal-group -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-4 overflow-x-auto px-gutter pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-grid sm:overflow-visible sm:px-0 sm:pb-0"
                >
                  {c.items.slice(0, TILES_PER_CHAPTER).map((p, i) => (
                    <li key={p.slug} className="w-[66%] shrink-0 snap-start sm:w-auto" style={staggerStyle(i)}>
                      <BrandTile
                        as="article"
                        locale={locale}
                        href={p.href}
                        image={{ src: p.image, alt: p.alt }}
                        hoverImage={p.hoverImage ? { src: p.hoverImage } : undefined}
                        brand={brand}
                        name={typoQuotes(p.name, locale)}
                        headingLevel={4}
                        /* 4:5 frames, landscape manufacturer photos (object-cover): ~2× frame width (QM 01.11.2026). */
                        sizes="(min-width: 1024px) 66vw, (min-width: 640px) 100vw, 132vw"
                      />
                    </li>
                  ))}
                </ul>
                {/* After 6 tiles a full-width room image (Bibel §6) – only for
                    files that are really ≥ 1600 px wide and ≥ 16:9 (QA P2-2). */}
                {i === 1 && roomImage && (
                  <BrandFigure
                    className="mt-12 lg:mt-24"
                    image={roomImage}
                    alt={altFor(roomImage, "altHero")}
                    credit={credit}
                    minRatio={16 / 9}
                    sizes="(min-width: 1440px) 1280px, 100vw"
                  />
                )}
              </div>
            ))}
          </Section>
        )}

        {/* ------------------------------------------------------------ */}
        {/* GUT ZU WISSEN – eigene Sachtexte (brandGuides.js)              */}
        {/* ------------------------------------------------------------ */}
        {guide && (
          <Section spacing="none" className="py-12 md:py-16" labelledBy="brand-guide" data-brand-guide={brandSlug}>
            <div className="grid grid-cols-1 gap-8 md:gap-12 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
              <div className="@5xl/page:col-span-7">
                <Eyebrow className="mb-stack-s">{tr("guideEyebrow")}</Eyebrow>
                {/* QM wm-r4: the first section stays open; the others are disclosure
                    rows (title visible, text one tap away, still in the HTML) –
                    seven display blocks in a row read as a wall of text. */}
                {guide.sections.slice(0, 1).map((sec) => (
                  <div key={sec.title}>
                    <Heading id="brand-guide" level={2}>
                      {sec.title}
                    </Heading>
                    <div className="mt-stack-m flex flex-col gap-4 text-body text-text-soft">
                      {withoutSentence(sec.paragraphs, shownInShowroom).map((p, k) => (
                        <p key={k} className="max-w-measure">
                          {glueDash(p)}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {guide.sections.length > 1 && (
                  <div className="mt-10 border-t border-line">
                    {guide.sections.slice(1).map((sec) => (
                      <details key={sec.title} className="ph-accordion border-b border-line">
                        <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3">
                          <Heading level={3} size="title">
                            {sec.title}
                          </Heading>
                          <Plus aria-hidden="true" className="ph-accordion__icon size-5 shrink-0 text-text-soft" strokeWidth={1.5} />
                        </summary>
                        <div className="flex flex-col gap-4 pb-6 text-body text-text-soft">
                          {withoutSentence(sec.paragraphs, shownInShowroom).map((p, k) => (
                            <p key={k} className="max-w-measure">
                              {glueDash(p)}
                            </p>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                {guideSourceHost && (
                  <p className="mt-6 max-w-measure text-small text-text-soft">
                    {tr("guideSource")}{" "}
                    <a
                      href={guide.sourceUrl}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current"
                    >
                      {guideSourceHost}
                      <span className="sr-only"> ({tr("showroomEvidenceNewTab")})</span>
                    </a>
                  </p>
                )}
              </div>
              {guideLinks.length > 0 && (
                <nav aria-labelledby="brand-guide-links" className="@5xl/page:col-span-4 @5xl/page:col-start-9 @5xl/page:self-start">
                  <h2 id="brand-guide-links" className="text-overline uppercase text-text-soft">
                    {tr("guideLinksTitle", { brand })}
                  </h2>
                  <ul className="mt-stack-s border-t border-line">
                    {guideLinks.map((link) => (
                      <li key={link.href} className="border-b border-line">
                        <a
                          href={link.href}
                          hrefLang={link.hrefLang}
                          className="flex min-h-12 items-center py-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                    <li className="border-b border-line">
                      <a
                        href={`/${locale}${beratungPath}`}
                        className="flex min-h-12 items-center py-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                      >
                        {tr("guideAppointment", { brand })}
                      </a>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </Section>
        )}

        {/* ------------------------------------------------------------ */}
        {/* MINOTTI AM BODENSEE (nur Minotti, nur DE)                      */}
        {/* ------------------------------------------------------------ */}
        {bodensee && (
          <Section tone="raised" spacing="none" className="py-12 md:py-16" labelledBy="brand-bodensee" data-brand-bodensee="">
            <div className="grid grid-cols-1 gap-8 md:gap-12 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
              <div className="@5xl/page:col-span-7">
                <Heading id="brand-bodensee" level={2}>
                  {bodensee.title}
                </Heading>
                <div className="mt-stack-m flex flex-col gap-4 text-body text-text-soft">
                  {withoutRepeatedParagraphs(bodensee.paragraphs, guide?.sections?.flatMap((s) => s.paragraphs)).map((p, k) => (
                    <p key={k} className="max-w-measure">
                      {glueDash(p)}
                    </p>
                  ))}
                </div>
                <dl className="mt-stack-m border-t border-line pt-4 text-body">
                  <dt className="text-overline uppercase text-text-soft">{bodensee.address.label}</dt>
                  {bodensee.address.lines.map((line) => (
                    <dd key={line} className="mt-1 text-text">
                      {line}
                    </dd>
                  ))}
                </dl>
              </div>
              <nav aria-label={bodensee.title} className="@5xl/page:col-span-4 @5xl/page:col-start-9 @5xl/page:self-start">
                <ul className="border-t border-line">
                  {bodensee.links.map((link) => (
                    <li key={link.id} className="border-b border-line" data-bodensee-link={link.id}>
                      <a
                        href={link.href}
                        className="flex min-h-12 items-center py-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </Section>
        )}

        {/* ------------------------------------------------------------ */}
        {/* DIE MARKE                                                      */}
        {/* ------------------------------------------------------------ */}
        {(story.length > 0 || approach) && (
          <Section spacing="none" className={storyImage ? SECTION_Y : "py-12 md:py-16"} labelledBy="brand-story">
            <div className="grid grid-cols-1 gap-8 md:gap-12 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
              <div className={storyImage ? "@5xl/page:col-span-6 xl:@5xl/page:col-span-5" : story.length > 0 ? "@5xl/page:col-span-7" : "@5xl/page:col-span-12"}>
                <Eyebrow className="mb-stack-s">{tr("storyEyebrow")}</Eyebrow>
                <Heading id="brand-story" level={2}>
                  {tr("storyTitle", { brand })}
                </Heading>
                {storyVisible.length > 0 && (
                  <div className="mt-stack-m flex flex-col gap-4 text-body text-text-soft">
                    {storyVisible.map((p, i) => (
                      <p key={i} className="max-w-measure">
                        {p}
                      </p>
                    ))}
                  </div>
                )}
                {storyMore.length > 0 && (
                  <details className="ph-accordion mt-4 border-b border-line">
                    <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                      {tr("readMore")}
                    </summary>
                    <div className="flex flex-col gap-4 pt-2 pb-6 text-body text-text-soft">
                      {storyMore.map((p, i) => (
                        <p key={i} className="max-w-measure">
                          {p}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
                {approach && storyImage && approachBlock("mt-stack-m")}
              </div>
              {/* Without a story image the design approach stands right as the
                  counterweight (Abnahme Marken, Restliste 1): text flush on columns 1–7. */}
              {approach && !storyImage && (
                approachBlock(story.length > 0 ? "@5xl/page:col-span-4 @5xl/page:col-start-9 @5xl/page:self-end" : "@5xl/page:col-span-7")
              )}
              {storyImage && (
                <BrandFigure
                  className="@5xl/page:col-span-6 @5xl/page:col-start-7 xl:@5xl/page:col-span-5 xl:@5xl/page:col-start-8"
                  image={storyImage}
                  alt={altFor(storyImage, "altScene")}
                  credit={credit}
                  minRatio={0.78}
                  sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
                />
              )}
            </div>
          </Section>
        )}

        {/* ------------------------------------------------------------ */}
        {/* KOLLEKTIONEN (internal links to the collection pages)         */}
        {/* ------------------------------------------------------------ */}
        {collections.length > 0 && (
          <Section labelledBy="brand-collections" spacing="compact">
            <Heading id="brand-collections" level={2} className="mb-stack-m">
              {tr("collectionsTitle", { brand })}
            </Heading>
            <Grid as="ul" cols={3} role="list">
              {collections.map((collection) => {
                const name = formatCollectionName(collection.name);
                return (
                  <li key={collection.name}>
                    <Card
                      href={collectionPath(locale, marke.name1, collection.name)}
                      title={name}
                      image={collection.image ? { src: `/cmx${collection.image}`, alt: `${brand} ${name}` } : undefined}
                      ratio="3/2"
                      footer={t.has("productCount") ? t("productCount", { count: collection.produkt_count || 0 }) : null}
                    />
                  </li>
                );
              })}
            </Grid>
          </Section>
        )}

        {/* ------------------------------------------------------------ */}
        {/* HANDWERK (CMS craft disciplines, page language only)          */}
        {/* ------------------------------------------------------------ */}
        {craft.length > 0 && (
          <Section labelledBy="brand-craft" spacing="none" className="py-12 md:py-20">
            {t.has("craftEyebrow") && <Eyebrow className="mb-stack-s">{t("craftEyebrow")}</Eyebrow>}
            <Heading id="brand-craft" level={2} className="mb-stack-m">
              {t.has("craftTitle") ? t("craftTitle") : brand}
            </Heading>
            <Grid as="ul" cols={2} role="list">
              {craft.map((item, i) => (
                <li key={i} className="border-t border-line pt-4 md:pt-6">
                  {item.eyeline && (
                    <Eyebrow tone="soft" className="mb-stack-s">
                      {item.eyeline}
                    </Eyebrow>
                  )}
                  <Heading level={3}>{item.title}</Heading>
                  <p className="mt-3 max-w-measure text-body text-text-soft">{item.text}</p>
                </li>
              ))}
            </Grid>
          </Section>
        )}

        {/* Planen & Erleben (Inhaber-Entscheidung Nr. 9): Minotti → Sofaplaner,
            Küchenmarke → Küchenplaner, Ezarri → Ezarri-Welt, alle → 3D/AR. DE only. */}
        <PlanLinks links={planLinks} />

        {/* ------------------------------------------------------------ */}
        {/* IM SHOWROOM + ANSPRECHPERSON                                   */}
        {/* ------------------------------------------------------------ */}
        <Section tone="band" spacing="none" className={SECTION_Y} labelledBy="brand-showroom">
          <div className="grid grid-cols-1 gap-8 md:gap-12 @5xl/page:grid-cols-12 @5xl/page:gap-grid">
            <div className="@5xl/page:col-span-6">
              <Eyebrow className="mb-stack-s">{tr("piecesEyebrow")}</Eyebrow>
              <Heading id="brand-showroom" level={2}>
                {showroom.title}
              </Heading>
              <p className="mt-stack-m max-w-measure text-body text-text">{showroom.text}</p>
              {/* Inhaber-Entscheidung Nr. 22: Beleg der Studio-Aussage (Minotti-Pressemeldung),
                  URL aus dem Claim-Register (src/lib/legal/claims.js). */}
              {showroom.evidenceUrl && (
                <p className="mt-4 max-w-measure text-body">
                  <a
                    href={showroom.evidenceUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current"
                  >
                    {tr("showroomEvidenceLink", { brand })}
                    <span className="sr-only"> ({tr("showroomEvidenceNewTab")})</span>
                  </a>
                </p>
              )}
              <p className="mt-4 max-w-measure text-body text-text-soft">{tr("piecesText", { brand })}</p>

              {pieces.length > 0 ? (
                <Grid as="ul" cols={2} role="list" className="reveal-group mt-stack-m">
                  {pieces.map((p, i) => (
                    <li key={p.slug} style={staggerStyle(i, 2)}>
                      <BrandTile
                        locale={locale}
                        href={p.href}
                        image={{ src: p.image, alt: p.alt }}
                        brand={brand}
                        name={typoQuotes(p.name, locale)}
                        badge={<Badge>{tr("piecesBadge")}</Badge>}
                        sizes="(min-width: 1024px) 44vw, (min-width: 640px) 100vw, 200vw"
                      />
                    </li>
                  ))}
                </Grid>
              ) : SHOW_PLACEHOLDERS ? (
                <div
                  role="img"
                  aria-label={`${tr("photoPending")}: ${tr("photoPendingText", { brand })}`}
                  className="mt-stack-m flex aspect-[3/2] max-w-md items-center justify-center bg-linen p-6 text-center"
                >
                  <p className="text-small text-text-soft" aria-hidden="true">
                    {tr("photoPending")}
                    <br />
                    {tr("photoPendingText", { brand })}
                  </p>
                </div>
              ) : (
                <LinkArrow href={askHref} className="mt-4">
                  {tr("piecesAsk")}
                </LinkArrow>
              )}
            </div>

            <aside aria-labelledby="brand-contact" className="@5xl/page:col-span-5 @5xl/page:col-start-8">
              <Eyebrow as="h3" id="brand-contact" className="mb-stack-s">
                {tr("contactEyebrow")}
              </Eyebrow>
              {/* Text only until a real portrait with consent exists (QA P1-2). */}
              <div className="flex items-start gap-5">
                {SHOW_PLACEHOLDERS && (
                  <div
                    className="flex size-24 shrink-0 items-center justify-center bg-linen text-ink sm:size-28"
                    role="img"
                    aria-label={tr("contactPortrait")}
                  >
                    <Monogram size={44} decorative />
                  </div>
                )}
                <div>
                  <p className="text-title text-text">{tr("contactName")}</p>
                  <p className="mt-1 text-small text-text-soft">{tr("contactRole")}</p>
                </div>
              </div>
              <dl className="mt-stack-m grid grid-cols-1 gap-4 border-t border-line-strong pt-6 text-body">
                <div>
                  <dt className="text-overline uppercase text-text-soft">{tr("addressLabel")}</dt>
                  <dd className="mt-1">
                    {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}
                  </dd>
                </div>
                <div>
                  <dt className="text-overline uppercase text-text-soft">{tr("phoneLabel")}</dt>
                  <dd>
                    <a href={PHONE_HREF} className="tabular inline-flex min-h-11 items-center underline decoration-line-strong underline-offset-4 hover:decoration-current">
                      {PHONE_DISPLAY}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-overline uppercase text-text-soft">{tr("emailLabel")}</dt>
                  <dd>
                    <a href={EMAIL_HREF} className="inline-flex min-h-11 items-center break-all underline decoration-line-strong underline-offset-4 hover:decoration-current">
                      {EMAIL}
                    </a>
                  </dd>
                </div>
              </dl>
              {marke.firmenlink && (
                <LinkArrow href={marke.firmenlink} className="mt-4">
                  {tr("manufacturerWebsite", { brand })}
                </LinkArrow>
              )}
            </aside>
          </div>
        </Section>

        {/* ------------------------------------------------------------ */}
        {/* FAQ (sichtbar + FAQPage aus denselben Einträgen)               */}
        {/* ------------------------------------------------------------ */}
        {faqItems.length > 0 && (
          <Section spacing="none" className="py-12 md:py-16" labelledBy="brand-faq" data-brand-faq="">
            <JsonLd data={faqPageSchema(pageUrl, locale, faqItems)} />
            <div className="grid gap-y-8 gap-x-grid @5xl/page:grid-cols-12">
              {/* QM wm-fix3: four columns from xl (three broke „Häufige / Fragen / zu Minotti“ into three lines). */}
              <Heading id="brand-faq" level={2} className="text-balance @5xl/page:col-span-5 xl:@5xl/page:col-span-4">
                {tr("faqTitle", { brand })}
              </Heading>
              {/* QM wm-r4: questions as disclosure rows – the answers (each with the
                  studio name) stood open one below the other; they stay in the
                  HTML for the FAQPage node. */}
              <div className="border-t border-line-strong @5xl/page:col-span-7 @5xl/page:col-start-6">
                {faqItems.map((it) => (
                  <details key={it.q} className="ph-accordion border-b border-line">
                    <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4">
                      <h3 className="text-title text-text">{it.q}</h3>
                      <Plus aria-hidden="true" className="ph-accordion__icon size-5 shrink-0 text-text-soft" strokeWidth={1.5} />
                    </summary>
                    <p className="max-w-measure pb-6 text-body text-text-soft">{it.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Section>
        )}

        {/* ------------------------------------------------------------ */}
        {/* SCHLUSS – Leitsatz + Termin                                     */}
        {/* ------------------------------------------------------------ */}
        {/* Optik-Runde (01.11.2026): wie die Produktseite – der Leitsatz IST die
            H2, die zweite Zeile ein Instrument-Lead (keine zwei Display-Zeilen
            übereinander, QA P3-5). */}
        <CTABand
          id="brand-cta"
          tone="raised"
          title={<Leitsatz as="span" size="m" className="block pb-2" />}
          text={
            <>
              <p className="text-lead text-text">{tr("ctaTitle", { brand })}</p>
              <p className="mt-2">{tr("ctaText")}</p>
            </>
          }
          primary={{ href: beratungPath, label: tr("ctaAppointment") }}
          secondary={{ href: PHONE_HREF, label: PHONE_DISPLAY }}
        />

        <Container className="pb-12">
          <p className="max-w-measure border-t border-line pt-6 text-small text-text-soft">{tr("legalNote", { brand })}</p>
        </Container>
      </>
    </LinkDelegate>
  );
}
