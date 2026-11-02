import { Button, Eyebrow, Heading, Media, Section } from "@/components/ui";
import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import { portraitsOf, withPortraits } from "./portraits";
import { cardFormat } from "./teamCopy";
import HaraldKapitel from "./HaraldKapitel";
import { houseTrail, MENU_PAGE } from "@/lib/seo/breadcrumbs";
import { ROUTES } from "@/utils/routing";

// Team page opening + "Wer wir sind" (server component).
// The opening shows a face (QA Runde 1, P2-5: no shelf photo): the first team
// member with an own portrait. Without one it falls back to the showroom.
// @param {Array} [team] fetchTeamData()
/** Visible trail of the team page = BreadcrumbList items (menu: Das Haus › Team). */
export function teamTrail(locale = "de") {
  return houseTrail(locale, MENU_PAGE.team[locale] || "Team", ROUTES.platzhirsch[locale] || ROUTES.platzhirsch.de);
}

export default function Team({ team }) {
  const { t, raw } = useInhalt("team");
  const common = useInhalt("common");
  // Runde 2 (seo): the trail follows the menu – Startseite › Das Haus › Team
  // (same items as the BreadcrumbList in team/page.js via teamTrail()).
  const locale = common.locale || "de";
  // Rat 9,5 (A5, gesamtwerk M5): no double portrait. A member portrait opens
  // the page only while the grid shows text cards (cardFormat "text"); once
  // every member has a portrait, the grid shows them and the opening falls
  // back to the showroom.
  const portrait = cardFormat(withPortraits(team)) === "text" ? portraitsOf(team)[0] : null;
  const heroImage = portrait
    ? { src: portrait.src, alt: t("heroPortraitAlt", { name: portrait.name }), position: "object-[50%_20%]" }
    : { src: "/Images/UberUns/livingroom-view.jpg", alt: t("heroAlt") };

  // Design-Jury P2-19: the portrait gets its caption – name and the released
  // role (inhalt.team.roles), nothing invented; without a role only the name.
  const portraitRole = portrait ? (raw("roles") || {})[portrait.name] : "";
  const portraitCaption = portrait?.name ? [portrait.name, portraitRole].filter(Boolean).join(" · ") : null;

  return (
    <>
      <PageHeader
        breadcrumbs={teamTrail(locale)}
        eyebrow={t("eyebrow")}
        title={t("title")}
        lead={t("lead")}
        image={heroImage}
        caption={portraitCaption}
      >
        {/* Design-Fix (Jury P2-19): the page's content CTA (same label and target
            as the closing CTABand) fills the empty column under the lead. */}
        <Button href={ROUTES.beratung[locale] || ROUTES.beratung.de} variant="primary" arrow>
          {common.t("termin")}
        </Button>
      </PageHeader>

      {/* Rat 9,5 (A5): Harald Menghin above the grid (Kern-USP, Entscheidung Nr. 8). */}
      <HaraldKapitel locale={locale} />

      <Section tone="band" labelledBy="team-intro">
        <div className="grid grid-cols-1 gap-y-12 gap-x-grid lg:grid-cols-12 lg:items-center">
          <div className="reveal order-2 lg:order-1 lg:col-span-5">
            <Media
              src="/Images/Team/dark-table.jpg"
              alt={t("introAlt")}
              ratio="4/5"
              sizes="(min-width: 1440px) 520px, (min-width: 1024px) 38vw, 100vw"
            />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
            <Eyebrow className="mb-stack-s">{t("introEyebrow")}</Eyebrow>
            <Heading id="team-intro" level={2}>
              {t("introTitle")}
            </Heading>
            <div className="mt-stack-m space-y-4 text-body text-text-soft">
              {(raw("introText") || []).map((paragraph, i) => (
                <p key={i} className="max-w-measure">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
