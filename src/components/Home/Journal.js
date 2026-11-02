import { Card, LinkArrow, Section, SmartLink } from "@/components/ui";
import { getIndexableRatgeber } from "@/lib/ratgeber";
import { RATGEBER_PATH } from "@/lib/ratgeber/schema";
import { generateSlug } from "@/lib/slugify";
import { balanceQuotes, displayTitle } from "@/lib/news/displayTitle";
import { ROUTES } from "@/utils/routing";
import SectionIntro from "./SectionIntro";
import ScrollRow from "./ScrollRow";
import SeoIntro from "./SeoIntro";
import { getHomeT } from "./copy";
import { ROW_ITEM, ROW_MOBILE, ROW_REVEAL, SECTION_Y, scrollLabels } from "./row";

// News & Ratgeber (server component, replaces the client BlogSection).
// News: the latest posts of the News doctype, linked like before
// (/news/<slug> – the route that exists in every locale).
// Ratgeber: German only and ONLY released articles (getIndexableRatgeber –
// sitemap/navigation rule of the Ratgeber team); today that list is empty,
// so the column appears automatically once the first article is released.
const NEWS_MAX = 3;
const RATGEBER_MAX = 3;
// Teaser length (R3, page length: 160 → 120 characters, cut at a word end).
const TEASER_MAX = 120;

const localized = (post, field, locale) => {
  if (field === "title") return (locale !== "de" && post?.[`name_${locale}`]) || post?.name1 || "";
  return (locale !== "de" && post?.[`beschreibung_${locale}`]) || post?.beschreibung || "";
};

// Cut at a word boundary, never inside a word (QA runde 1, P3-5).
function shorten(text, max) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:–-]+$/, "")} …`;
}

// QM shell-home r3: backoffice titles came in capitals ("CLASSICON – …",
// "VERNISSAGE: …") and teasers with straight quotes ("Birds) next to
// typographic ones in the title. Display only: the casing rule of the news
// pages (displayTitle) and typographic quotes/apostrophes in both.
// QM shell-home r5: a date never breaks between day and month ("Freitag, 4. /
// September") – no-break space after a day number with a dot before a word.
const typo = (text, locale) =>
  balanceQuotes(String(text), locale)
    .replace(/(\p{L})'(\p{L})/gu, "$1’$2")
    .replace(/(\b\d{1,2}\.) (?=\p{Lu})/gu, "$1 ");

// B12 (31.10.2026, Startseite 13 → 9 Kapitel): SEO text, FAQ and the region
// line are the foot of this chapter (SeoIntro embedded, a nested section)
// instead of a chapter of their own. Without posts and articles the SEO block
// stands alone with its own band.
export default async function Journal({ locale, news }) {
  const t = await getHomeT(locale);
  const posts = (news || []).filter((p) => p?.name1).slice(0, NEWS_MAX);
  const ratgeber = locale === "de" ? getIndexableRatgeber().slice(0, RATGEBER_MAX) : [];
  if (posts.length === 0 && ratgeber.length === 0) return <SeoIntro locale={locale} />;

  return (
    <Section labelledBy="home-journal-title" spacing="none" className={SECTION_Y}>
      <SectionIntro
        id="home-journal-title"
        eyebrow={t("journal.eyebrow")}
        title={t("journal.title")}
        aside={
          // B12 (page length): on phones "Zum Ratgeber" stands next to "Alle
          // Neuigkeiten" instead of a row of its own under the news.
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <LinkArrow href={ROUTES.news[locale] || ROUTES.news.de}>{t("journal.allNews")}</LinkArrow>
            {ratgeber.length > 0 && (
              <span className="sm:hidden">
                <LinkArrow href={RATGEBER_PATH.replace(/^\/de/, "")}>{t("journal.allRatgeber")}</LinkArrow>
              </span>
            )}
          </div>
        }
      />

      {posts.length > 0 && (
        // Mobile: scroll-snap row like the rooms, with visible buttons (R3).
        // QM shell-home r3 (iPad hoch): three posts stood 2 + 1 – they get three
        // columns once the row is 40rem wide (container query).
        <div className="mt-6 @container sm:mt-12 lg:mt-12">
        <ScrollRow
          id="home-journal-list"
          label={t("journal.eyebrow")}
          labels={scrollLabels(t)}
          className={`${ROW_MOBILE} ${ROW_REVEAL} ${posts.length === 3 ? "sm:grid-cols-2 @min-[40rem]:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"} sm:gap-x-grid sm:gap-y-12`}
        >
          {posts.map((post) => {
            const img = post.bild_anhagen || post.artikel_table?.[0]?.bild_anhagen;
            const text = localized(post, "text", locale);
            return (
              // QM shell-home r5 (iPad hoch, three ~230 px columns): the teaser is three lines on every width.
              <li key={post.name || post.name1} className={`${ROW_ITEM} w-[72vw] max-w-80 [&_p]:line-clamp-3`}>
                <Card
                  as="article"
                  href={`/news/${generateSlug(post.name1)}`}
                  title={displayTitle(typo(localized(post, "title", locale), locale))}
                  text={text ? typo(shorten(text, TEASER_MAX), locale) : undefined}
                  image={img ? { src: `/cms${img}`, alt: "" } : undefined}
                  ratio="3/2"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 72vw"
                />
              </li>
            );
          })}
        </ScrollRow>
        </div>
      )}

      {ratgeber.length > 0 && (
        // Phones (prüfung-technik P1, Höhenbudget <main> < 9 000 px): since the
        // first Ratgeber articles were released (Nr. 13) the list added ~400 px.
        // Below 640 px only the heading with "Zum Ratgeber" stays in one row;
        // the article list (still in the HTML) shows from sm up.
        // B12: on phones the whole block folds away (heading and list stay in
        // the HTML); "Zum Ratgeber" sits in the chapter head instead.
        <div className="max-sm:hidden sm:mt-16">
          <h3 className="text-title text-text">{t("journal.ratgeberTitle")}</h3>
          <ul className="mt-6 border-t border-line">
            {ratgeber.map((a) => (
              <li key={a.slug} className="border-b border-line">
                <SmartLink
                  href={`${RATGEBER_PATH.replace(/^\/de/, "")}/${a.slug}`}
                  className="flex min-h-11 flex-col gap-1 py-4 text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                >
                  <span className="text-overline uppercase text-text-soft">{a.rubrik}</span>
                  <span className="text-ui">{a.heading || a.title}</span>
                </SmartLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 max-sm:hidden">
            <LinkArrow href={RATGEBER_PATH.replace(/^\/de/, "")}>{t("journal.allRatgeber")}</LinkArrow>
          </div>
        </div>
      )}
      <SeoIntro locale={locale} embedded />
    </Section>
  );
}
