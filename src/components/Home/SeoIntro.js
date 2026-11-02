import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { Accordion, Section, SmartLink } from "@/components/ui";
import { homeSeo } from "@/lib/content/homeSeo";
import MoreText from "./MoreText";
import { SUB_BLOCK } from "./SubIntro";
import { getHomeT, r7Copy } from "./copy";
import { regionLinks } from "./homeLinks";

// Editorial SEO text + FAQ of the homepage (content per locale in
// src/lib/content/homeSeo.js, unchanged). The FAQ is native <details>
// (Accordion): readable without JS and by crawlers; the same items are
// emitted as FAQPage JSON-LD by the page – keep both in sync by using
// homeSeo() only.
// R5-USP (gesamtwerk P1-2, bewusst geändert): the second half of the page no
// longer reads like an SEO landing page. This block moved to the END of the
// page (right before the closing "Nehmen Sie Platz.", so the page still ends
// with that sentence), on a quiet, compact surface:
//  - the long keyword H2 in the title role (Instrument, not Bodoni display);
//  - the text clamped to its first paragraph on every width, the rest opens
//    with "Weiterlesen" (all paragraphs stay in the HTML);
//  - the FAQ stays closed (answers in the HTML and in the FAQPage JSON-LD);
//  - the region links (formerly an 11-card grid in the Dreiländer chapter)
//    are ONE compact line of text links (DE only, indexed pages only –
//    regionLinks in homeLinks.js, same rule as sitemap and llms.txt).
// B12 (31.10.2026, Startseite 13 → 9 Kapitel): `embedded` = the foot of the
// journal chapter (Journal.js) – a nested <section> with the same H2, text,
// FAQ and region line, on the journal's surface instead of its own band.
// The order of the labelled sections still ends "home-seo-title",
// "home-cta-title". Standalone (own raised band) only when the journal has
// no posts (backend down), so SEO text and FAQ never disappear.
export default async function SeoIntro({ locale, embedded = false }) {
  const content = homeSeo(locale);
  // QM shell-home r5 (FR, laptop): "… lac de Constance / : studio …" – the
  // French space before : ; ! ? is a narrow no-break space (display only; the
  // FAQPage JSON-LD keeps the source text).
  const fr = (text) => (locale === "fr" ? String(text).replace(/ ([:;!?])/g, "\u202f$1") : text);
  const [t, tHome] = await Promise.all([getTranslations({ locale, namespace: "Home" }), getHomeT(locale)]);
  const paragraph = (text) => (
    <p key={text.slice(0, 40)} className="max-w-measure text-body text-text-soft">
      {fr(text)}
    </p>
  );
  const regions = locale === "de" ? regionLinks() : [];

  const Wrap = embedded ? EmbeddedSection : Section;
  const wrapProps = embedded ? {} : { tone: "raised", spacing: "none", className: "border-t border-line py-6 sm:py-12 lg:py-14" };
  return (
    <Wrap labelledBy="home-seo-title" data-home-seo="" {...wrapProps}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-grid">
        <div className="lg:col-span-6">
          <h2 id="home-seo-title" className="text-title text-balance text-text">
            {fr(content.title)}
          </h2>
          <div className="mt-4">
            <MoreText id="home-seo-text" more={tHome("seo.more")} less={tHome("seo.less")} everywhere>
              {content.paragraphs.map(paragraph)}
            </MoreText>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          {/* The whole FAQ folds into one row (questions and answers stay in
              the HTML and in the FAQPage JSON-LD). */}
          <details className="group border-y border-line" data-home-faq="">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 [&::-webkit-details-marker]:hidden">
              <h3 className="text-ui font-medium text-text">
                {t("faqTitle")} <span className="tabular text-text-soft">({content.faq.length})</span>
              </h3>
              <ChevronDown aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0 text-text-soft transition-transform duration-(--duration-ui) ease-quiet group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <Accordion
              className="pb-2"
              name="home-faq"
              items={content.faq.map((item, i) => ({ id: `home-faq-${i + 1}`, title: fr(item.q), content: fr(item.a), open: false }))}
            />
          </details>
        </div>
      </div>

      {regions.length > 0 && (
        // QM shell-home r3: below lg the FAQ row (border-y) stands right above –
        // a second hairline left an empty band between two lines.
        <nav aria-labelledby="home-regions-title" className="mt-6 sm:mt-10 lg:border-t lg:border-line lg:pt-4" data-home-regions="">
          <h3 id="home-regions-title" className="text-overline uppercase text-text-soft">
            {r7Copy(locale).regionsHeading}
          </h3>
          {/* ph-dotlist: separators never start or end a line (QM r2) */}
          <ul className="ph-dotlist mt-1 gap-y-1 text-small text-text">
            {regions.map((page) => (
              <li key={page.path}>
                <SmartLink
                  href={page.path}
                  className="inline-flex min-h-6 items-center underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                >
                  {/* the heading already says "Designermöbel": the place names carry the line */}
                  {page.label.replace(/^Designermöbel\s+/, "")}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </Wrap>
  );
}

/** Nested section inside the journal chapter (B12): rule on top, no own surface. */
function EmbeddedSection({ labelledBy, children, ...rest }) {
  return (
    <section aria-labelledby={labelledBy} className={SUB_BLOCK} {...rest}>
      {children}
    </section>
  );
}
