import { LinkArrow, Section, SmartLink } from "@/components/ui";
import { brandHref, featuredBrands, displayBrandName, featuredRank, withSiteBrands } from "@/lib/content/brands";
import { generateSlug } from "@/lib/slugify";
import { ROUTES } from "@/utils/routing";
import SectionIntro from "./SectionIntro";
import { softBrandName } from "./brandBreak";
import SubIntro, { SUB_BLOCK } from "./SubIntro";
import { getHomeT } from "./copy";
import { SECTION_Y } from "./row";

// Brands as a typographic list (Bibel §9 card-brand: name in Bodoni ≥ 32 px,
// origin, NO logo; Jury §3.1/§3.4: "gezeigt", never "geführt"; no logo as
// seal). Replaces the logo wall and the marquee. Every name links to its
// brand page – the same crawlable brand links the old wall and hero had.
// Data: active brands of the Marken doctype, search-demand order first
// (lib/content/brands.js); without backend the featured list stands alone.
// Origin (herkunftsland) is German CMS text, so it is shown on /de only.
const MAX = 12;
// B12 (page length): embedded on phones the first 8 names (4 rows); the other
// 4 links stay in the HTML and show from 640 px; "Alle … Marken" is one tap.
// (Tailwind needs the literal class: max-sm:[&:nth-child(n+9)]:hidden.)
// Manufacturer spelling where the CMS name differs (QA runde 1, P3-4).
const SPELLING = { next125: "next125" };
const brandSpelling = (name) => SPELLING[String(name).toLowerCase()] || name;

// B12 (31.10.2026, Startseite ≤ 9 Kapitel): `embedded` = the brands as the
// foot block of the chapter "Sechs Stücke" (CuratedSelection: pieces and
// their manufacturers in one chapter) – H3 head (SubIntro), same list, same
// links, same note. Standalone only when the selection has no products
// (backend down), so the brand links never disappear.
export default async function BrandList({ locale, brands, embedded = false }) {
  const t = await getHomeT(locale);
  const base = ROUTES.marken[locale] || ROUTES.marken.de;

  const active = withSiteBrands(brands || [], locale).filter((b) => b?.status === "Aktiv" && b?.name1);
  const list = active.length
    ? [...active]
        .sort((a, b) => featuredRank(a.name1) - featuredRank(b.name1))
        .slice(0, MAX)
        .map((b) => ({ name: brandSpelling(displayBrandName(b.name1)), slug: generateSlug(b.name1), href: b.href, origin: locale === "de" ? b.herkunftsland || null : null }))
    : featuredBrands(locale).map((b) => ({ ...b, name: brandSpelling(b.name), origin: null }));

  const all = <LinkArrow href={base}>{active.length ? t("brands.all", { count: active.length }) : t("brands.allShort")}</LinkArrow>;
  // QM shell-home r3 (200 % text, iPhone 15 + desktop): the column count
  // follows a container query in REM instead of the viewport – with enlarged
  // text the rem doubles, so the list drops to 2 or 1 columns instead of
  // breaking "Min/otti" mid-word or laying "Deutschland" over "Ezarri".
  // At 100 %: 2 columns on every phone (SE: 335 px ≥ 18rem), 3 from ≈ 1024 px.
  const items = (
    <div className={`${embedded ? "mt-4 sm:mt-8" : "mt-8 sm:mt-12 lg:mt-12"} @container`}>
    <ul className="grid grid-cols-1 gap-x-5 border-t border-line @min-[18rem]:grid-cols-2 sm:gap-x-grid @min-[52rem]:grid-cols-3">
      {list.map((b) => (
        <li key={b.slug} className={`border-b border-line${embedded ? " max-sm:[&:nth-child(n+9)]:hidden" : ""}`}>
          <SmartLink
            href={brandHref(b, base)}
            className="group flex min-h-14 flex-col justify-center gap-0.5 py-2 text-text sm:min-h-20 sm:flex-row sm:flex-wrap sm:content-center sm:items-baseline sm:justify-between sm:gap-x-4 sm:py-4"
          >
            <span className="break-words font-display text-display-m underline decoration-transparent decoration-1 underline-offset-8 transition-colors duration-(--duration-micro) group-hover:decoration-current">
              {/* QM shell-home r5: soft hyphens – a long name breaks with a visible hyphen under WCAG text spacing instead of mid-word (brandBreak.js). */}
              {softBrandName(b.name)}
            </span>
            {b.origin && <span className="text-small text-text-soft">{b.origin}</span>}
          </SmartLink>
        </li>
      ))}
    </ul>
    </div>
  );
  const note = <p className="mt-4 text-small sm:mt-6 text-text-soft">{t("brands.note")}</p>;

  if (embedded) {
    return (
      <div className={SUB_BLOCK} data-home-brands="">
        <SubIntro id="home-brands-title" title={t("brands.title")} lead={t("brands.lead")} aside={all} />
        {items}
        {note}
      </div>
    );
  }
  return (
    <Section labelledBy="home-brands-title" spacing="none" className={SECTION_Y} data-home-brands="">
      <SectionIntro id="home-brands-title" eyebrow={t("brands.eyebrow")} title={t("brands.title")} lead={t("brands.lead")} aside={all} />
      {items}
      {note}
    </Section>
  );
}
