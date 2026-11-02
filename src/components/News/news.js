import { Card, CTABand, Heading, Section } from "@/components/ui";
import { publicNews } from "@/lib/news/withheldNews";
import { presentNews } from "@/lib/news/newsCopy";
import { ROUTES } from "@/utils/routing";
import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import NewsMore from "./NewsMore";
import { pastYearLast } from "./staleNews";
import { NEWS_GRID, NEWS_LIST_CONTAINER, NEWS_ROW, NEWS_SIZES } from "./newsRow";
import { displayTitle } from "./displayTitle";
import { reportNewsCopy } from "./copyCheck";
import { newsTypo } from "./newsTypo";

// Localized CMS text, German as fallback.
function localized(item, base, germanField, locale) {
  const value = locale !== "de" ? item?.[`${base}_${locale}`] : null;
  return (typeof value === "string" && value.trim()) || item?.[germanField] || "";
}

function excerpt(value, max = 160) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim()} …`;
}

function imageOf(item) {
  const path = item?.bild_anhagen || item?.artikel_table?.[0]?.bild_anhagen || item?.artikel_table?.[1]?.bild_anhagen;
  return path ? `/cms${path}` : null;
}

const STUDIO_HERO = "/Images/Cafe/cafe.jpg";
const STUDIO_HERO_ALT = {
  de: "Das Platzhirsch Café im Haus in Lochau: Holzwand, Sitzbänke und goldene Deckenleuchten",
  en: "The Platzhirsch Café in the Lochau house: timber wall, banquettes and golden ceiling lights",
  fr: "Le Platzhirsch Café dans la maison de Lochau : mur en bois, banquettes et plafonniers dorés",
  it: "Il Platzhirsch Café nella casa di Lochau: parete in legno, panche e lampade dorate a soffitto",
};

// News overview (server component). Withheld articles (UWG, see
// src/lib/news/withheldNews.js) never reach the list; the others are shown
// with defused advertising words (presentNews, src/lib/news/newsCopy.js).
// @param {Array} items     fetchNewsData()
// (The CMS news keyword image stays the OG image of the page only.)
const GridComponent = ({ items }) => {
  const { t, locale } = useInhalt("news");
  const common = useInhalt("common");
  const listed = publicNews(items);
  // Dev report on the RAW backoffice copy (what the editors must fix) …
  reportNewsCopy(listed);
  // … and the defused copy for the page (src/lib/news/newsCopy.js).
  // QM r3: posts dated by a past year in their headline move to the end (staleNews.js).
  const articles = pastYearLast(listed.map(presentNews), (item) => item?.name1);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: common.t("home"), href: "/" }, { label: t("title") }]}
        eyebrow={t("eyebrow")}
        title={t("h1")}
        lead={t("lead")}
        // QM content-legal r3: the CMS image was the same Eichholtz dining room as the
        // Beratung hero – the news "aus dem Studio in Lochau" open with the house itself
        // (own photo of the Platzhirsch Café, public/Images/Cafe/cafe.json).
        image={{ src: STUDIO_HERO, alt: STUDIO_HERO_ALT[locale] || STUDIO_HERO_ALT.de, quality: 60 }}
      />

      <Section tone="band" spacing="compact" labelledBy="news-list">
        <Heading id="news-list" level={2} className="sr-only">
          {t("listTitle")}
        </Heading>
        {articles.length === 0 ? (
          <p className="max-w-measure text-body text-text-soft">{t("empty")}</p>
        ) : (
          <div className={NEWS_LIST_CONTAINER}>
          <NewsMore
            step={9}
            showMoreLabel={t("showMore")}
            statusTemplate={t("shownOf")}
            className={NEWS_GRID}
          >
            {articles.map((item, index) => {
              const title = newsTypo(displayTitle(localized(item, "name", "name1", locale)), locale);
              const image = imageOf(item);
              return (
                // QM content-legal r2: the backoffice photos are small (≈ 150–460 px wide).
                // Full-width tiles on phones blew them up 4–7× in device pixels, and
                // nine posts in two columns (iPad hoch) left one tile alone. Below md the
                // list is a row list (newsRow.js, r3: phones title beside the photo, teaser
                // below; iPad hoch one list column), from lg three columns (3 × 3, no orphan).
                <Card
                  key={item.slug || index}
                  className={NEWS_ROW}
                  as="article"
                  href={`/news/${item.slug}`}
                  title={title}
                  text={newsTypo(excerpt(localized(item, "beschreibung", "beschreibung", locale)), locale)}
                  image={image ? { src: image, alt: "" } : undefined}
                  ratio="3/2"
                  headingLevel={3}
                  sizes={NEWS_SIZES}
                />
              );
            })}
          </NewsMore>
          </div>
        )}
      </Section>

      {/* QM r2: without the Leitsatz – "Nehmen Sie Platz." directly above "Neugierig
          auf die Ausstellung?" read as two headings in a row. */}
      <CTABand
        tone="raised"
        title={t("ctaTitle")}
        text={<p className="pt-2">{t("ctaText")}</p>}
        primary={{ href: ROUTES.beratung[locale] || ROUTES.beratung.de, label: common.t("termin") }}
      />
    </>
  );
};

export default GridComponent;
