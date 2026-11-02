import { Section } from "@/components/ui";
import SectionIntro from "./SectionIntro";
import DreilaenderMap from "./DreilaenderMap";
import { getTranslations } from "next-intl/server";
import { getHomeT } from "./copy";
import { DRIVE_STAND } from "./bodenseeShore.js";
import { SECTION_Y } from "./row";

// Dreiländer-Service (Bibel §12.4 / Jury §3.1: the map of the Dreiländereck
// prototype plus the four country cards). Only what the site already
// promises: delivery and assembly in Austria; DE, CH and FL "clarified
// personally". No CHF fixed price, no travel times, no deposit claim until
// they are confirmed (Jury §6 question 8).
// Mobile (QA runde 1, P2-4): country cards as two columns with small text,
// region links without their teaser line (the teaser stays in the HTML from
// sm up) – the section was 2 600 px tall on a phone.
// R3 (page length): on phones the region links stand in two columns (no
// arrows, no teaser) instead of nine full-width rows; from sm the list.
// On /de it also carries the local landing pages (formerly RegionLinks) –
// the internal links from the homepage stay.
// Runde 2, Fix-Team P2 (seo P1-1): the region links lead only to INDEXED
// pages (regionLinks in homeLinks.js: doorway audit = robots = sitemap). The
// noindex city pages Bregenz, Dornbirn, Lindau, Friedrichshafen and St. Gallen
// are no longer linked from <main>; the six indexed region pages are.
// R5-USP (gesamtwerk P1-2): the region links left this chapter – the 11-card
// grid read like an SEO landing page. They are one compact line of links in
// the SEO block at the end of the page (SeoIntro.js, same regionLinks()).
const COUNTRIES = [
  { key: "at", code: "AT" },
  { key: "de", code: "DE" },
  { key: "ch", code: "CH" },
  { key: "li", code: "FL" },
];

export default async function DreilaenderService({ locale }) {
  const t = await getHomeT(locale);
  // B18: real shoreline + driving times – caption and description name the
  // sources (HomePage.region.*, übernommen 30.10.2026).
  const tr = await getTranslations({ locale, namespace: "HomePage.region" });
  const labels = {
    title: t("region.mapTitle"),
    desc: tr("mapDesc"),
    caption: tr("mapCaption", { stand: DRIVE_STAND }),
    driveTitle: tr("driveTitle"),
    // "{n}" stays a placeholder: DreilaenderMap fills in DRIVE_MIN per place.
    minutes: tr("driveMinutes", { n: "{n}" }),
    lake: t("region.lake"),
    countries: Object.fromEntries(COUNTRIES.map((c) => [c.key, t(`region.countries.${c.key}.name`)])),
  };

  return (
    <Section tone="band" labelledBy="home-region-title" spacing="none" className={SECTION_Y}>
      <SectionIntro id="home-region-title" eyebrow={t("region.eyebrow")} title={t("region.title")} lead={t("region.lead")} />

      <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-12 sm:gap-12 lg:grid-cols-12 lg:gap-grid">
        <div className="lg:col-span-7">
          <DreilaenderMap labels={labels} />
        </div>
        {/* QM shell-home r4 (200 % text): the two card columns stayed and
            "Deutschlan[d]", "progettazione" ran into the neighbour column. The
            columns now follow a container query in rem like the other home
            grids: two while the list is ≥ 18rem wide (every phone at 100 %),
            one with enlarged text; from lg always one (narrow side column). */}
        <div className="@container lg:col-span-4 lg:col-start-9">
        <ul className="grid grid-cols-1 content-start gap-x-5 gap-y-6 max-lg:@min-[18rem]:grid-cols-2 sm:gap-x-grid sm:gap-y-8">
          {COUNTRIES.map((c) => (
            <li key={c.key} className="border-t border-line-strong pt-3 sm:pt-4">
              <p className="tabular text-overline uppercase text-text-accent max-sm:hidden" aria-hidden="true">
                {c.code}
              </p>
              <h3 className="text-ui text-text [overflow-wrap:break-word] sm:mt-stack-s sm:text-title">{t(`region.countries.${c.key}.name`)}</h3>
              <p className="mt-2 text-small text-text-soft sm:text-body">{t(`region.countries.${c.key}.text`)}</p>
            </li>
          ))}
        </ul>
        </div>
      </div>

    </Section>
  );
}
