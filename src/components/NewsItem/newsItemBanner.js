import { ROUTES } from "@/utils/routing";
import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { displayTitle } from "@/components/News/displayTitle";
import { newsTypo } from "@/components/News/newsTypo";
import Image from "next/image";
import { articleDate, leadLayout, splitKicker } from "./leadImage";

// QM content-legal r3 (desktop/iPad): the lead photo stands in the header's photo
// column (H1 left, photo right from 1024 px) instead of floating beside the first
// paragraph (235 px picture, 280 px ragged text column). Never wider than the
// file, own aspect ratio; files ≤ 1200 px go out as they are (no srcset that the
// phone reads as a 3× upscale). Below 1024 px it follows the H1 at full text width
// at most. LCP image.
function LeadPhoto({ lead }) {
  const { width, aspect, direct } = leadLayout(lead.size);
  return (
    <div className="relative max-w-full overflow-hidden bg-linen @5xl/page:ml-auto" style={{ width: `${width}px`, aspectRatio: aspect }}>
      <Image
        src={lead.src}
        alt=""
        fill
        unoptimized={direct}
        sizes={`min(${width}px, 100vw)`}
        quality={75}
        preload
        className="object-cover"
      />
    </div>
  );
}

// Article opening (server component): breadcrumb, overline, H1 in a text column.
// QM content-legal r3: the lead photo no longer stands alone under the H1 (a
// 480 × 320 box, left-aligned in empty space, 3–8× upscaled) – it sits in the
// article text at its real size (newsitem.js, leadImage.js). A short brand
// before " – " is the small first line of the H1 ("FLOS" / "Ausdrucksstarke
// Leuchten-Designs"), and a REAL publication date is shown (never the
// migration date, newsDates()).
// @param {string} title   localized headline (German fallback)
// @param {string} slug    article slug (/news/<slug>)
// @param {boolean} [withheld] ended promotion (UWG) – overline "Archiv"
// @param {string|null} [published] ISO date from newsDates()
// @param {{src: string, size: object|null}|null} [lead] lead photo with its real size
const NewsItemBanner = ({ title, slug, withheld = false, published = null, lead = null }) => {
  const { t, locale } = useInhalt("news");
  const common = useInhalt("common");
  const shown = newsTypo(displayTitle(title), locale);
  const parts = splitKicker(shown);
  const date = articleDate(published, locale);

  return (
    <PageHeader
      // QM r3: page width – the left edge of header, text and „Weitere Beiträge“ is one line.
      className="pb-6! md:pb-8!"
      media={lead ? <LeadPhoto lead={lead} /> : undefined}
      breadcrumbs={[
        { label: common.t("home"), href: "/" },
        { label: t("title"), href: ROUTES.news[locale] || ROUTES.news.de },
        // Short last crumb: the full headline broke into two lines on phones.
        { label: t("articleCrumb"), href: `/news/${slug}` },
      ]}
      eyebrow={withheld ? t("endedEyebrow") : t("articleEyebrow")}
      kicker={parts ? parts[0] : undefined}
      title={parts ? parts[1] : shown}
      lead={date ? <time dateTime={published}>{date}</time> : undefined}
    />
  );
};

export default NewsItemBanner;
