// Shared layout for the local landing pages (/de/kuechen-vorarlberg,
// /de/designermoebel-lindau, /de/designermoebel-liechtenstein, …). Each page
// only supplies its `content` (texts, photos, brands, FAQ); the design lives
// here once. German only; static copy in the page files until a CMS doctype.
//
// Neuauftritt (Design-Bibel §4–§10): light hero with the photo below the text,
// asymmetric 12-column sections, cards without frame or shadow, ONE dark
// (walnut) surface = showroom facts, FAQ as <details>, closing band with the
// Leitsatz. Server component only. Metadata and JSON-LD are unchanged.
// Docs: Marktresearch/digital/redesign/landingpages.md
import Image from "next/image";
import JsonLd from "@/components/Reusable/JsonLd";
import { Horizon, LinkArrow, Media, Section, cx } from "@/components/ui";
import { MAX_TITLE, SITE_URL, deOnlyMetadata, ogLocale } from "@/lib/seo/pageMetadata";
import { isRegionPath, regionRobots } from "@/lib/seo/sitemap/doorwayAudit";
import { graph, IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import { ROUTES } from "@/utils/routing";
import { localizeAlt, localeLink, sharedCopy } from "@/lib/content/landingKern";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { cleanGallery, heroImage, imageOverrides, isBlocked } from "./imagery";
import StudioSchema from "./schema/StudioSchema";
import { CITY_COORDS } from "./schema/StadtMap";
import { ortText } from "@/lib/content/ortsseiten";
import { LINK_EASE, staggerStyle } from "./motionLanding";
import { PAGE_HY, bindAbbreviations, fitHeading } from "./typoLanding";

/**
 * Rat 9,5 B7: Studio-Grafik für Seiten, deren Hero-Foto (noch) nicht freigegeben
 * ist – Küchen: L-Zeile; Stadtseiten: Kartenausschnitt mit der Linie nach Lochau.
 * Seiten mit gezeigtem Foto bekommen keine Grafik.
 */
export function schemaKindFor(path) {
  // Outdoor-Küche (02.11.2026): dieselbe Küchen-Grafik, solange kein eigenes Foto da ist.
  if (path === "/kuechen-vorarlberg" || path === "/outdoor-kueche") return "kueche";
  if (CITY_COORDS[path]) return "stadt";
  return null;
}
import {
  ARROW_INLINE,
  BrandGroups,
  CheckList,
  FaqSection,
  LandingGallery,
  LandingClosing,
  LandingHero,
  ObjektSection,
  PlanerBlock,
  ProcessNote,
  SectionHead,
  ShowroomFacts,
  breadcrumbNode,
  isSwiss,
  landingCrumbs,
  landingTermin,
  useLandingCopy,
} from "./parts";

// Metadata for a landing page. German-only pages (hreflang only de +
// x-default: the other locales 404 on purpose). Indexable by default — these pages target the
// local queries the site needs most (Küchen Vorarlberg, Möbel Bodensee, …);
// pass `index: false` to pull one out again.
// Region pages (/designermoebel-*) take their robots from the doorway audit
// (regionRobots() in src/lib/seo/sitemap/doorwayAudit.js, R3-landing): fewer
// than 4 own facts → "noindex, follow" and, by the same rule, not in the
// sitemap or /llms.txt, so robots and sitemap always agree. A page goes back
// into the index only when real facts are added and its count is raised
// there. `index: false` still wins over a passing audit.
// og:locale: the site-wide map (ogLocale, R6-landing-inhalt) for the German
// landing pages, i.e. de_AT. Region pages for a Swiss or German audience keep
// the audience variant (QM P3-5: de_CH / de_DE, as their content.inLanguage
// says); `locale` overrides both.
const AUDIENCE_OG_LOCALE = {
  "/designermoebel-liechtenstein": "de_CH",
  "/designermoebel-st-gallen": "de_CH",
  "/designermoebel-appenzell": "de_CH",
  "/designermoebel-rheintal": "de_CH",
  "/designermoebel-lindau": "de_DE",
  "/designermoebel-konstanz": "de_DE",
  "/designermoebel-friedrichshafen": "de_DE",
  "/designermoebel-ravensburg": "de_DE",
  "/designermoebel-kempten": "de_DE",
};

// F6 (28.10.2026): built by deOnlyMetadata() (src/lib/seo/pageMetadata.js) –
// hreflang de + x-default, og:image = the page's typographic card (OG_CARDS,
// opengraph-image.js next to page.js; no unreleased photo), title ≤ 65 and
// description ≤ 165 characters. The suffix shrinks before the title is cut.
export function landingMetadata({ path, title, description, index = true, locale }) {
  const og = { locale: locale || AUDIENCE_OG_LOCALE[path] || ogLocale("de") };
  return deOnlyMetadata({
    path,
    title: titleWithSuffix(title),
    ogTitle: title,
    description,
    robots: isRegionPath(path) ? { index: index && regionRobots(path).index, follow: true } : { index, follow: true },
    ogLocale: og.locale,
  });
}

/** "<title> | Platzhirsch Home Living", shorter suffix (or none) when > 65. */
export function titleWithSuffix(title) {
  for (const suffix of [" | Platzhirsch Home Living", " | Platzhirsch", ""]) {
    if (`${title}${suffix}`.length <= MAX_TITLE) return `${title}${suffix}`;
  }
  return title;
}

// Region facts (Bibel §10.2, QM P2-4) – ONLY what the page copy already states
// and sources (see the page files' comments). No currency, no delivery or price
// promise. A page can pass its own `content.facts`; that wins.
const PAGE_FACTS = {
  "/designermoebel-lindau": [
    { label: "Entfernung", value: "Wenige Kilometer, direkt hinter der Grenze" },
    { label: "Zoll", value: "Keiner – Österreich und Deutschland liegen im EU-Binnenmarkt" },
    { label: "Lieferung nach Lindau", value: "Klären wir persönlich für Ihre Adresse" },
  ],
  "/designermoebel-liechtenstein": [
    { label: "Fahrzeit ab Vaduz", value: "Rund 40 Minuten, je nach Verkehr" },
    { label: "Zoll- und MWST-Gebiet", value: "Schweiz – 8,1 % MWST bei der Einfuhr" },
    { label: "Lieferung und Montage", value: "Klären wir persönlich vor dem Kauf" },
  ],
};

// Date line under legal/tax statements until "Recht & Texte" has signed them
// off (QM P2-6). Shown below the steps section.
const STEPS_AS_OF = {
  "/designermoebel-liechtenstein": "10/2026",
};

// WebPage + BreadcrumbList (own node, same items as the visible trail via
// src/lib/seo/breadcrumbs.js – seo P2-5) + FAQPage for one landing page. German; de-AT unless
// the page targets German or Swiss visitors (`content.inLanguage`).
// `primaryImageOfPage` follows the photo actually shown (image register).
function landingSchema(content, path, hero = { src: content.banner.image }) {
  // landing-kern (01.11.2026): EN/FR/IT-Fassungen tragen `content.locale` (src/lib/content/landingKern).
  const locale = content.locale || "de";
  const url = `${SITE_URL}/${locale}${path}`;
  const crumbs = breadcrumbNode(landingCrumbs(content.banner.crumb, content.banner.trail, false, locale), url, locale);
  return graph(
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: content.banner.title,
      inLanguage: locale !== "de" ? IN_LANGUAGE[locale] || locale : content.inLanguage || "de-AT",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      primaryImageOfPage: `${SITE_URL}${hero.src}`,
      breadcrumb: { "@id": crumbs["@id"] },
    },
    crumbs,
    content.faq?.items?.length
      ? {
          "@type": "FAQPage",
          "@id": `${url}#faq`,
          mainEntity: content.faq.items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }
      : null
  );
}

/**
 * Optional block for an affordable stone kitchen line (partner Binni), only
 * rendered when a page supplies `content.stoneLine` WITH `origin`.
 * Legal (Bibel §14, GP): the line is never called "italienisch" and never
 * shown without its country of manufacture – so no origin, no block.
 * Shape: { eyebrow, heading, text, origin, points?, image?, imageAlt?, cta?: {href,label} }
 */
function StoneLine({ data, swiss }) {
  const l = useLandingCopy(swiss);
  if (!data?.heading || !data?.origin) return null;
  return (
    <Section tone="surface" labelledBy="stone-line-title">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className={cx(data.image ? "lg:col-span-6" : "lg:col-span-7")}>
          <SectionHead id="stone-line-title" eyebrow={data.eyebrow} title={data.heading} text={data.text} />
          <p className="mt-stack-m text-small text-text-soft">
            <span className="text-overline uppercase text-text-accent">{l("origin")}</span>{" "}
            <span className="text-text">{data.origin}</span>
          </p>
          <CheckList items={data.points} className="mt-stack-m max-w-text" />
          {data.cta?.href && (
            <LinkArrow href={data.cta.href} className="mt-stack-m">
              {data.cta.label}
            </LinkArrow>
          )}
        </div>
        {data.image && (
          <Media
            src={data.image}
            alt={data.imageAlt}
            ratio="4/5"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="reveal lg:col-span-5 lg:col-start-8"
          />
        )}
      </div>
    </Section>
  );
}

/**
 * AP-3 (31.10.2026): eigener Ortstext einer Stadtseite aus src/lib/content/
 * ortsseiten.js – H2 + Abschnitte (H3), Querverweise und, sobald es sie gibt,
 * freigegebene Projekte aus diesem Ort. Ohne Eintrag rendert nichts.
 */
function OrtSection({ data }) {
  if (!data?.blocks?.length) return null;
  return (
    <Section tone="raised" labelledBy="ort-title" data-ort-text="">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <SectionHead id="ort-title" eyebrow={data.eyebrow} title={data.heading} />
        </div>
        <div className="space-y-stack-m lg:col-span-7 lg:col-start-6">
          {data.blocks.map((block) => (
            <div key={block.heading}>
              <h3 className="text-title text-text">{fitHeading(block.heading)}</h3>
              <div className="mt-stack-s max-w-measure space-y-4 text-body text-text">
                {block.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{bindAbbreviations(paragraph)}</p>
                ))}
              </div>
            </div>
          ))}
          {data.projekte?.length > 0 && (
            <ul className="space-y-2" data-ort-projekte="">
              {data.projekte.map((p) => (
                <li key={p.href}>
                  <LinkArrow href={p.href}>{p.label}</LinkArrow>
                </li>
              ))}
            </ul>
          )}
          {data.links?.length > 0 && (
            <p className="flex flex-wrap gap-x-8 gap-y-1" data-ort-links="">
              {data.links.map((link) => (
                <LinkArrow key={link.href} href={link.href} className={ARROW_INLINE}>
                  {link.label}
                </LinkArrow>
              ))}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}

// beforeClosing (QM R3): Abschnitt vor dem Abschluss-CTA (Ortsseiten: Vertragshändler-Block).
export default function LandingPage({ content: pageContent, path, beforeClosing = null }) {
  // AP-3: the place's own FAQ comes first, then the page's FAQ (one FAQPage).
  const ort = ortText(path);
  const content = ort?.faq?.length && pageContent.faq
    ? { ...pageContent, faq: { ...pageContent.faq, items: [...ort.faq, ...pageContent.faq.items] } }
    : pageContent;
  const { banner, intro, brands, steps, gallery = [], showroom, cta, faq } = content;
  const swiss = isSwiss(content);
  const l = useLandingCopy(swiss);
  const locale = content.locale || "de";
  const intl = locale !== "de" ? sharedCopy(locale) : null;
  // Image register (imagery.js): no foreign place, no broken file, no hero
  // twice on the page (QM P1-1, P1-2, P2-3).
  const heroRaw = heroImage(path, banner.image, banner.alt);
  const hero = intl ? { ...heroRaw, alt: localizeAlt(content, heroRaw.src, heroRaw.src === banner.image ? banner.alt : heroRaw.alt) } : heroRaw;
  const override = imageOverrides(path);
  const introSrc = override.intro?.src || intro.image;
  const introAlt = intl ? localizeAlt(content, introSrc, override.intro?.src ? override.intro.alt : intro.imageAlt) : override.intro?.alt || intro.imageAlt;
  // The hero src stays in the register for JSON-LD even when the hero is typographic
  // (released: false) – only a SHOWN hero blocks the same file as intro.
  const introImage = introSrc && !isBlocked(introSrc) && !(hero.show && introSrc === hero.src) ? introSrc : null;
  const introNative = Boolean(introImage && override.intro?.src === introImage && override.intro.width && override.intro.height);
  const galleryAlt = Object.fromEntries(gallery.map((img) => [img.src, img.alt]));
  const images = cleanGallery(gallery, hero.src, override.gallery)
    .filter((img) => img.src !== introImage)
    .map((img) => (intl ? { ...img, alt: localizeAlt(content, img.src, galleryAlt[img.src] || img.alt) } : img));
  const facts = content.facts || PAGE_FACTS[path];
  const asOf = STEPS_AS_OF[path];
  // ux P1-1: every appointment button carries the page's topic and place.
  // Rat 9,5 B1: Ziel UND Wort aus dem zentralen Terminhelfer (Kalender → „Termin wählen“).
  const termin = landingTermin({ thema: content.thema, ort: content.ort }, locale);
  const appointmentHref = termin.href;
  const schemaKind = hero.show ? null : schemaKindFor(path);

  return (
    <div className={PAGE_HY}>
      {path && <JsonLd data={landingSchema(content, path, hero)} />}

      <LandingHero
        title={banner.title}
        lead={banner.lead}
        image={hero.show ? hero.src : null}
        alt={hero.alt}
        crumb={banner.crumb}
        trail={banner.trail}
        facts={facts}
        swiss={swiss}
        appointmentHref={appointmentHref}
        primaryLabel={termin.label}
        write={termin.write}
        schema={schemaKind ? <StudioSchema kind={schemaKind} path={path} locale={locale} swiss={swiss} /> : null}
      />

      {/* Intro — text in columns 1–6, photo offset in 8–12 (asymmetric, §6) */}
      <Section tone="surface" labelledBy="intro-title" className="pt-0!">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-6">
            <SectionHead id="intro-title" eyebrow={intro.eyebrow} title={intro.heading} />
            <div className="mt-stack-m max-w-measure space-y-4 text-body text-text">
              {intro.paragraphs.map((paragraph) => (
                <p key={paragraph}>{bindAbbreviations(paragraph)}</p>
              ))}
            </div>
            <CheckList items={intro.benefits} className="mt-stack-m" />
            <p className="mt-stack-m text-body text-text-soft">
              {l("callAlt")}{" "}
              <a
                href={PHONE_HREF}
                className={cx("whitespace-nowrap text-text underline decoration-line-strong underline-offset-4 hover:decoration-current tabular", LINK_EASE)}
              >
                {PHONE_DISPLAY}
              </a>
            </p>
          </div>
          {introImage && introNative && (
            // Rat 9,5 A6: freigegebenes Foto im eigenen Seitenverhältnis, kein Zuschnitt.
            <div
              // QM R1 (iPad hoch): bis lg volle Spaltenbreite – 32 rem linksbündig ließ rechts eine große leere Fläche.
              className="reveal relative overflow-hidden bg-linen lg:col-span-6 lg:col-start-7 lg:mt-24 lg:self-start"
              style={{ aspectRatio: `${override.intro.width} / ${override.intro.height}` }}
              data-landing-intro-image=""
            >
              <Image src={introImage} alt={introAlt} fill sizes="(min-width: 1440px) 616px, (min-width: 1024px) 46vw, (min-width: 640px) 512px, 100vw" className="object-contain" />
            </div>
          )}
          {introImage && !introNative && (
            <Media
              src={introImage}
              alt={introAlt}
              ratio="4/5"
              // Querformat-Quelle im 4:5-Rahmen (cover): ~1,9× Rahmenbreite anfordern (Optik-QA: sonst 1,6–2× hochskaliert).
              sizes="(min-width: 1440px) 1000px, (min-width: 1024px) 68vw, (min-width: 640px) 800px, 190vw"
              // Optik-QA 01.11.2026: 4:5 über die volle Breite war am Handy quer / iPad hoch
              // 900–1000 px hoch – zwischen sm und lg höchstens 26rem breit (Format bleibt).
              // QM R1 (iPad hoch): zwischen sm und lg volle Breite im Querformat 3:2 statt 26 rem
              // linksbündig im 4:5-Rahmen (rechts blieb eine leere Fläche). Ab lg wieder 4:5 rechts.
              className="reveal sm:aspect-3/2 lg:col-span-5 lg:col-start-8 lg:mt-24 lg:aspect-4/5"
            />
          )}
        </div>
      </Section>

      <OrtSection data={ort} />

      {/* Brands — "in unserer Ausstellung", no logos, no dealer formula (§14).
          Typographic until the image register records a written release for
          the manufacturers' press photos (§7.1, QM P2-5); `brand.image` stays
          in the content and comes back once released. */}
      {brands?.items?.length > 0 && (
        <Section tone="band" labelledBy="brands-title">
          <SectionHead id="brands-title" eyebrow={brands.eyebrow} title={brands.heading} />
          <div className="mt-stack-m">
            <BrandGroups groups={[{ items: brands.items }]} cols={brands.items.length > 2 ? 3 : 2} locale={locale} />
          </div>
          {brands.cta?.href && (
            <LinkArrow href={brands.cta.href} className="mt-stack-m">
              {brands.cta.label}
            </LinkArrow>
          )}
        </Section>
      )}

      <StoneLine data={content.stoneLine} swiss={swiss} />

      {/* Steps — the page's one Horizontlinie, then numbered columns */}
      {steps?.items?.length > 0 && (
        <Section tone="surface" labelledBy="steps-title">
          <SectionHead id="steps-title" eyebrow={steps.eyebrow} title={steps.heading} />
          <Horizon className="mt-stack-m" />
          <ol className="mt-stack-m grid grid-cols-1 gap-x-8 gap-y-10 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-4">
            {steps.items.map((step, index) => (
              <li key={step.title} className="reveal" style={staggerStyle(index, 4)}>
                <span aria-hidden="true" className="font-display text-display-m text-text-soft tabular">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-stack-s text-title text-text">{fitHeading(step.title)}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{step.text}</p>
              </li>
            ))}
          </ol>
          {/* Querverweise nach den Schritten: Arbeitsweise (Kern-USP) und passende Planer. */}
          {steps.links?.length > 0 && (
            <p className="mt-stack-m flex flex-wrap gap-x-8 gap-y-1" data-steps-links="">
              {steps.links.map((link) => (
                <LinkArrow key={link.href} href={link.href} className={ARROW_INLINE}>
                  {link.label}
                </LinkArrow>
              ))}
            </p>
          )}
          {asOf && (
            <p className="mt-stack-m text-small text-text-soft tabular">
              {l("asOf")}: {asOf}
            </p>
          )}
        </Section>
      )}

      {/* Kern-USP on every landing/region page (gesamtwerk P1-4). Pages that
          already show the seven steps in full set `process: false`. */}
      {content.process !== false && <ProcessNote text={content.processText} swiss={swiss} copy={intl ? { ...intl.processNote, steps: intl.steps } : null} />}

      {/* Optik-QA: nach dem Band der Arbeitsweise (ProcessNote) braucht die Galerie
          eigenen Abstand nach oben – sonst klebt das erste Foto an der Bandkante. */}
      <LandingGallery images={images} label={banner.title} className={content.process !== false ? "pt-section" : undefined} />

      <ObjektSection data={intl && content.objekt ? { ...content.objekt, ctaHref: `${ROUTES.beratung[locale]}?thema=objekt` } : content.objekt} />

      {content.planer && (
        <PlanerBlock
          text={content.planer.text}
          ort={content.ort}
          swiss={swiss}
          tone={content.objekt ? "surface" : "band"}
          {...(intl
            ? {
                copy: {
                  ...intl.planer,
                  architektenLink: localeLink({ href: "/architekten", label: intl.planer.architektenLink }, locale).label,
                  points: intl.planer.points.map((p) => (p.link ? { ...p, link: { ...p.link, href: ROUTES.produkte[locale] } } : p)),
                },
                beratungBase: ROUTES.beratung[locale],
                architektenHref: localeLink({ href: "/architekten", label: "" }, locale).href,
              }
            : {})}
        />
      )}

      <ShowroomFacts heading={showroom.heading} text={showroom.text} swiss={swiss} />

      <FaqSection faq={faq} swiss={swiss} />

      {beforeClosing}

      <LandingClosing heading={cta.heading} text={cta.text} swiss={swiss} appointmentHref={appointmentHref} primaryLabel={termin.label} write={termin.write} secondary={intl ? { href: ROUTES.kontakt[locale], label: l("contact") } : undefined} />
    </div>
  );
}
