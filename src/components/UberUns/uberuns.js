import { houseCrumb } from "./houseCrumb";
import { Button, CTABand, Eyebrow, Heading, Leitsatz, LinkArrow, Media, Section } from "@/components/ui";
import { staggerStyle } from "@/components/ShopCatalog/motion";
import { ROUTES } from "@/utils/routing";
import { DIRECTIONS_URL } from "@/lib/site";
import PageHeader from "./PageHeader";
import Ausstellung from "./austellung";
import useInhalt from "./inhalt/useInhalt";
import { portraitsOf } from "@/components/Team/portraits";
import { ABOUT_USP } from "./uspCopy";
import { softHyphens } from "./softHyphens";

// „Das Haus“ (Bibel §10.2): Showroom, Café, Team mit Gesichtern,
// Öffnungszeiten, Anfahrt. Server component – all copy is in the HTML.
// One display H1 (descriptive, SEO), one band surface, no walnut surface
// (the legacy footer is dark), one primary action (closing CTA).
// @param {string} title  descriptive H1 (SEO)
// @param {Array} [team]  fetchTeamData() – a real face for the team teaser
// @param {React.ReactNode} [children]  extra blocks before the closing CTA
//   (SEO-Team A: facts block „Auf einen Blick“ + FAQ, rendered by the page)
export default function UberUnsPage({ title, team, children }) {
  const { t, raw, locale } = useInhalt("about");
  const common = useInhalt("common");
  const gallery = raw("gallery") || [];
  // Team teaser shows a person (QA Runde 1, P2-5), not a kitchen. Second
  // portrait when there is one, so it differs from the team page opening.
  const portraits = portraitsOf(team);
  const teamPortrait = portraits[1] || portraits[0];
  const usp = ABOUT_USP[locale] || ABOUT_USP.de;

  const breadcrumbs = [
    { label: common.t("home"), href: "/" },
    houseCrumb(common.locale || "de", { link: false }),
    { label: "Platzhirsch" },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        breadcrumbSchema
        eyebrow={t("eyebrow")}
        title={title}
        lead={t("lead")}
        image={{ src: "/Images/UberUns/livingroom-view.jpg", alt: t("heroAlt") }}
      />

      {/* Intro: who we are – the indexable "about" text */}
      <Section labelledBy="about-intro">
        {/* QM wm-r4: text and photo side by side from 48 rem (iPad portrait): stacked,
            the 1080 px Tom Dixon photo filled 738 px on a 2× screen and looked soft.
            Page-container columns, so 200 % text size stays one column. */}
        <div className="grid grid-cols-1 gap-y-12 gap-x-grid @3xl/page:grid-cols-12 @3xl/page:items-center">
          <div className="@3xl/page:col-span-7 @5xl/page:col-span-6 xl:@5xl/page:col-start-2 xl:@5xl/page:col-span-5">
            <Eyebrow className="mb-stack-s">{t("introEyebrow")}</Eyebrow>
            <Heading id="about-intro" level={2}>
              {softHyphens(t("introTitle"))}
            </Heading>
            <div className="mt-stack-m space-y-4 text-body text-text-soft">
              {(raw("introText") || []).map((paragraph, i) => (
                <p key={i} className="max-w-measure">
                  {softHyphens(paragraph)}
                </p>
              ))}
            </div>
          </div>
          <div className="reveal mx-auto w-full max-w-sm @3xl/page:col-span-5 @3xl/page:col-start-8 @3xl/page:max-w-none">
            <Media
              src="/Images/UberUns/tomdixon.webp"
              alt={t("introAlt")}
              ratio="4/5"
              sizes="(min-width: 1440px) 520px, (min-width: 768px) 38vw, 384px"
            />
          </div>
        </div>
      </Section>

      {/* Kern-USP (Runde 2, gesamtwerk P1-4): Harald zeichnet von Hand. Typografisch,
          ohne Bild (echtes Material steht aus). /arbeitsweise nur Deutsch → auf
          EN/FR/IT mit hreflang="de" und Sprachhinweis im Linktext. */}
      <Section labelledBy="about-usp" className="pt-0!" data-process-note="">
        <div className="grid grid-cols-1 gap-y-6 gap-x-grid border-t border-line pt-stack-m @5xl/page:grid-cols-12">
          <div className="@5xl/page:col-span-5 xl:@5xl/page:col-start-2 xl:@5xl/page:col-span-4">
            <Eyebrow className="mb-stack-s">{usp.eyebrow}</Eyebrow>
            <Heading id="about-usp" level={2}>
              {usp.title}
            </Heading>
          </div>
          <div className="@5xl/page:col-span-6 @5xl/page:col-start-7">
            <p className="max-w-measure text-body text-text-soft">{softHyphens(usp.text)}</p>
            <LinkArrow href="/arbeitsweise" className="mt-stack-s" {...(locale === "de" ? {} : { locale: "de", hrefLang: "de" })}>
              {usp.link}
            </LinkArrow>
          </div>
        </div>
      </Section>

      {/* Showroom & café */}
      <Section tone="band" labelledBy="about-house">
        <div className="grid grid-cols-1 gap-y-8 gap-x-grid @5xl/page:grid-cols-12">
          <div className="@5xl/page:col-span-5 xl:@5xl/page:col-start-2 xl:@5xl/page:col-span-4">
            <Eyebrow className="mb-stack-s">{t("houseEyebrow")}</Eyebrow>
            <Heading id="about-house" level={2}>
              {softHyphens(t("houseTitle"))}
            </Heading>
          </div>
          <div className="space-y-4 text-body text-text-soft @5xl/page:col-span-6 @5xl/page:col-start-7">
            {(raw("houseText") || []).map((paragraph, i) => (
              <p key={i} className="max-w-measure">
                {softHyphens(paragraph)}
              </p>
            ))}
            <LinkArrow href={ROUTES.marken[locale] || ROUTES.marken.de}>{t("brandsLink")}</LinkArrow>
          </div>
        </div>
        {/* Phones/tablets: two side by side, the third across (QA Runde 1, P2-10).
            QM wm-r4: every frame 3:2 = the photos' own format – no crop, and
            living.jpg (1024 px) is no longer blown up to fill a 4:5 frame
            (~1.5× on iPad/Retina). */}
        <ul className="mt-16 grid grid-cols-2 gap-grid lg:mt-20 @5xl/page:grid-cols-3">
          {[
            "/Images/UberUns/living.jpg",
            "/Images/UberUns/gold-vase.jpg",
            "/Images/UberUns/grey-vase.jpg",
          ].map((src, i) => (
            <li key={src} className={i === 2 ? "reveal col-span-2 @5xl/page:col-span-1" : "reveal"} style={staggerStyle(i)}>
              <Media
                src={src}
                alt={gallery[i] || ""}
                ratio="3/2"
                sizes={i === 2 ? "(min-width: 1440px) 420px, (min-width: 1024px) 30vw, 100vw" : "(min-width: 1440px) 420px, (min-width: 1024px) 30vw, 50vw"}
              />
            </li>
          ))}
        </ul>
      </Section>

      {/* Visit: hours, address, 360° view */}
      <Ausstellung />

      {/* Team teaser */}
      {/* Same surface as the visit block above: no second top padding
          (QA Runde 1, P3-7: ~200 px of empty paper on phones). */}
      <Section labelledBy="about-team" className="pt-0!">
        {/* QM wm-r4: the CMS portraits are only ~350 px – at 384–420 px (half the
            iPad width, a third of the desktop) they were soft and left half the row
            empty. Now a small portrait (160 px, ≈ its own resolution on a 2× screen)
            beside the text, one row on every width from 640 px. */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start @5xl/page:mx-auto @5xl/page:max-w-4xl">
          {teamPortrait && (
            <div className="reveal w-40 shrink-0">
              <Media
                src={teamPortrait.src}
                alt={t("teamPortraitAlt", { name: teamPortrait.name })}
                ratio="4/5"
                imgClassName="object-[50%_20%]"
                sizes="200px"
              />
            </div>
          )}
          <div className="min-w-0">
            <Eyebrow className="mb-stack-s">{t("teamEyebrow")}</Eyebrow>
            <Heading id="about-team" level={2}>
              {t("teamTitle")}
            </Heading>
            <p className="mt-stack-m max-w-measure text-body text-text-soft">{t("teamText")}</p>
            <div className="mt-stack-m">
              <Button href={ROUTES.team[locale] || ROUTES.team.de} variant="secondary" arrow>
                {t("teamLink")}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {children}

      {/* Optik-Runde (01.11.2026): wie die Produktseite – der Leitsatz IST die
          H2, die zweite Zeile ein Instrument-Lead (keine zwei Display-Zeilen
          übereinander, QA P3-5); „raised“ trennt das Band vom Footer. */}
      <CTABand
        tone="raised"
        title={<Leitsatz as="span" size="m" className="block pb-2" />}
        text={
          <>
            <p className="text-lead text-text">{common.t("closingTitle")}</p>
            <p className="mt-2">{common.t("closingText")}</p>
          </>
        }
        primary={{ href: ROUTES.beratung[locale] || ROUTES.beratung.de, label: common.t("termin") }}
        secondary={{ href: DIRECTIONS_URL, label: common.t("route") }}
      />
    </>
  );
}

