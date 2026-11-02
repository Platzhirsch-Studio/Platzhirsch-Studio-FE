import { Card, CTABand, Eyebrow, Grid, Heading, LinkArrow, Media, Section } from "@/components/ui";
import { ROUTES } from "@/utils/routing";
import { generateSlug } from "@/lib/slugify";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { displayTitle } from "@/components/News/displayTitle";
import { newsTypo } from "@/components/News/newsTypo";
import { NEWS_GRID, NEWS_GRID_TWO, NEWS_LIST_CONTAINER, NEWS_ROW, NEWS_ROW_WIDE, NEWS_SIZES, NEWS_SIZES_WIDE } from "@/components/News/newsRow";

const hasText = (value) => typeof value === "string" && value.trim() !== "";

// Localized CMS text: `${base}_${locale}` for en/fr/it, German as fallback
// (German lives in `germanField`, e.g. name1 / beschreibung).
function localizedText(data, base, germanField, locale) {
  if (locale !== "de" && hasText(data?.[`${base}_${locale}`])) return data[`${base}_${locale}`];
  return data?.[germanField] || "";
}

// Product sections of the article in the page's language. The CMS keeps one
// table per language (artikel_table, artikel_table_en/_fr/_it); a translated
// row may leave image/name/brand empty, so those fall back to the German row
// at the same position. No translated table → the German one.
function localizedSections(data, locale) {
  const german = Array.isArray(data?.artikel_table) ? data.artikel_table : [];
  const translated = locale !== "de" ? data?.[`artikel_table_${locale}`] : null;
  if (!Array.isArray(translated) || translated.length === 0) return german;
  return translated.map((row, index) => {
    const base = german[index] || {};
    const merged = { ...base };
    for (const [key, value] of Object.entries(row || {})) {
      if (value !== null && value !== undefined && value !== "") merged[key] = value;
    }
    return merged;
  });
}

// Article body (server component).
// `moreNews`: the latest other public articles, built on the server
// (src/app/[locale]/news/[title]/page.js) — [{ title, description, image, link }].
// `withheld`: ended promotion (UWG, src/lib/news/withheldNews.js) – the body
// with prices and discounts is NOT rendered, only the notice.
// The lead photo lives in the article opening (newsItemBanner.js, QM r3 desktop).
const ArticleDetail = ({ data, moreNews = [], withheld = false }) => {
  const { t, locale } = useInhalt("news");
  const common = useInhalt("common");
  const newsHref = ROUTES.news[locale] || ROUTES.news.de;

  const title = displayTitle(localizedText(data, "name", "name1", locale));
  const description = localizedText(data, "beschreibung", "beschreibung", locale);
  const sections = withheld ? [] : localizedSections(data, locale).filter((s) => s?.artikel_name || s?.bild_anhagen);

  return (
    <>
      {withheld ? (
        <Section spacing="compact" contained="text" labelledBy="news-ended">
          <div className="border-l-2 border-line-strong pl-6">
            <Heading id="news-ended" level={2} size="title">
              {t("endedTitle")}
            </Heading>
            <p className="mt-stack-s max-w-measure text-body text-text-soft">{t("endedText")}</p>
            <LinkArrow href={newsHref} className="mt-4">
              {t("allNews")}
            </LinkArrow>
          </div>
        </Section>
      ) : (
        hasText(description) && (
          // QM r3: the text follows the opening closely, on the page's left edge
          // (header, „Weitere Beiträge“ and footer share it – the centred 560 px
          // column jumped in from the side on iPad and desktop).
          <Section spacing="compact" as="div" className="pt-2! md:pt-4!">
            <div>
            <div className="max-w-measure space-y-5 text-body text-text">
              {description
                .split(/\n\s*\n/)
                .filter(hasText)
                .map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {newsTypo(paragraph.trim(), locale)}
                  </p>
                ))}
            </div>
            </div>
          </Section>
        )
      )}

      {sections.length > 0 && (
        <Section tone="band" labelledBy="news-products">
          <Eyebrow className="mb-stack-s">{t("inArticle")}</Eyebrow>
          <Heading id="news-products" level={2} className="sr-only">
            {t("inArticle")}
          </Heading>
          {/* Motion: products arrive one after another (reveal-group, transform only). */}
          <Grid as="ul" cols={2} className="reveal-group mt-8 gap-y-14">
            {sections.map((artikel, index) => (
              <li key={`${artikel?.artikel_name || "row"}-${index}`} className="flex flex-col">
                {artikel?.bild_anhagen && (
                  // Manufacturer images: uncropped on linen (Jury §3.1).
                  <Media
                    src={`/cms${artikel.bild_anhagen}`}
                    alt={[artikel?.unternehmen, artikel?.artikel_name].filter(Boolean).join(", ") || title}
                    ratio="3/2"
                    fit="contain"
                    sizes="(min-width: 1440px) 640px, (min-width: 640px) 48vw, 100vw"
                  />
                )}
                {artikel?.unternehmen && (
                  <p className="mt-4 text-overline uppercase text-text-accent">{artikel.unternehmen}</p>
                )}
                {artikel?.artikel_name && <h3 className="mt-2 text-title text-text">{artikel.artikel_name}</h3>}
                {hasText(artikel?.beschreibung) && (
                  <p className="mt-2 max-w-measure text-body text-text-soft">{newsTypo(artikel.beschreibung.split("\n")[0], locale)}</p>
                )}
                {artikel?.unternehmen && (
                  <LinkArrow
                    href={`${ROUTES.marken[locale] || ROUTES.marken.de}/${generateSlug(artikel.unternehmen)}`}
                    className="mt-2"
                  >
                    {artikel.unternehmen}
                  </LinkArrow>
                )}
              </li>
            ))}
          </Grid>
        </Section>
      )}

      {moreNews.length > 0 && (
        <Section labelledBy="news-more">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Heading id="news-more" level={2}>
              {t("moreTitle")}
            </Heading>
            <LinkArrow href={newsHref}>{t("allNews")}</LinkArrow>
          </div>
          {/* QM content-legal r2: two tiles of 544 px blew the ≈ 300 px backoffice photos
              up 1.8×. Same card as the news list: row list below md, from md the
              columns of the list (a third each). */}
          {/* QM r3: two posts → two columns of row cards from lg (no empty third column). */}
          <div className={`mt-10 ${NEWS_LIST_CONTAINER}`}>
          <ul className={`reveal-group ${moreNews.length === 2 ? NEWS_GRID_TWO : NEWS_GRID}`}>
            {moreNews.map((item) => (
              <li key={item.link}>
                <Card
                  className={moreNews.length === 2 ? NEWS_ROW_WIDE : NEWS_ROW}
                  href={item.link}
                  title={newsTypo(displayTitle(item.title), locale)}
                  text={newsTypo(item.description, locale)}
                  image={item.image ? { src: item.image, alt: "" } : undefined}
                  ratio="3/2"
                  sizes={moreNews.length === 2 ? NEWS_SIZES_WIDE : NEWS_SIZES}
                />
              </li>
            ))}
          </ul>
          </div>
        </Section>
      )}

      {/* QM r3: one heading only (the Leitsatz above it made two in a row). */}
      <CTABand
        tone="raised"
        title={t("ctaTitle")}
        text={<p className="pt-2">{t("ctaText")}</p>}
        primary={{ href: ROUTES.beratung[locale] || ROUTES.beratung.de, label: common.t("termin") }}
      />
    </>
  );
};

export default ArticleDetail;
