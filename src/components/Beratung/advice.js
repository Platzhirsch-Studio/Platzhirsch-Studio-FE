import { Eyebrow, Heading, Media, Section } from "@/components/ui";
import SmartLink from "@/components/ui/SmartLink";
import PageHeader from "@/components/UberUns/PageHeader";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import KiLabel from "@/components/Yacht/KiLabel";
import { withoutLangNote } from "./t1Copy";

// Beratung: page opening (with a jump to the enquiry form) and the seven
// process steps as an ordered list – typographic, no stock photos, no gold
// badges (Bibel §2 P3, §4). Server components.

/**
 * @param {string} [heroImage] OG image from the CMS consultation keywords
 * @param {string} formId      id of the form section ("#…" jump target)
 */
// Fix-Runde 1 (F3, r1-ux-conversion P1-1/P1-5): on phones the opening is
// short – no photo, no jump button – so step 1 of the form starts in the first
// screen. The photo stays the LCP image from 1024 px (on phones `sizes` asks
// for the smallest file, so the hidden image costs almost nothing). One
// sentence on the core USP (Inhaber-Entscheidung Nr. 8) with a link to
// /arbeitsweise in the visitor's language (Rat 9,5 A1).
// QM content-legal: the box is 4:5 but the photos are landscape (≈ 4:3 to 3:2),
// object-cover scales them by height – the visible 480 px column needs about
// 1.8× that width, or the picture is upscaled 1.5–1.7× (report: download.jpg
// served at 452–537 px for a 480 × 600 box). The slot widths × 1.8.
// QM content-legal r3 (iPad hoch): from 768 px the photo follows the text at full
// column width (3:2) – the iPad got the bare phone opening before.
const IMAGE_SIZES_DESKTOP =
  "(min-width: 1440px) 940px, (min-width: 1280px) calc(76vw - 150px), (min-width: 1024px) calc(90vw - 108px), (min-width: 768px) calc(100vw - 96px), 16px";

// r8-leads (ux P1-2): heading, lead and picture follow the context of the
// request (?thema=yacht → yacht interior …, lib/forms/beratungContext.js
// headerTopic). Pictures: only images the site already shows on its own
// pages (own showroom/kitchen/outdoor photos, the Ezarri reference image under
// the Ezarri dealer permission with source line, the yacht concept rendering
// WITH its caption "Visualisierung (Rendering)" – no AI image, 03.11.2026). Objekt and Architektur keep the
// general picture: there is no own hotel or office project to show.
// Runde 4 (ux P1): the core USP in one line for phones (Inhaber-Entscheidung Nr. 8).
const PHONE_USP = {
  de: "Von Hand gezeichnet, dann in 3D geplant.",
  en: "Drawn by hand, then planned in 3D.",
  fr: "Dessiné à la main, puis planifié en 3D.",
  it: "Disegnato a mano, poi progettato in 3D.",
};

const TOPIC_IMAGES = {
  kueche: { src: "/Images/Kuche/bannerImageKuche1.jpg" },
  sofa: { src: "/Images/Wohnen/bannerImage4.jpg" },
  outdoor: { src: "/Images/Outdoor/bannerImage1.jpg" },
  ezarri: { src: "/ezarri/allgemein/anw-azur-50-iris-mosaic-ezarri-pool-1-1600.webp", source: true },
  // 03.11.2026 (Inhaber, KI-Bilder raus): the Blender rendering (v2, renders.json kiGeneriert: false)
  // with the caption "Visualisierung (Rendering)" – the former v1 file was an AI image.
  yacht: { src: "/labs/yacht/daycruiser-seelicht-kabine-v2-1200.webp", render: true },
};

/**
 * @param {string} [topic] headerTopic() of the request context (null = general)
 */
export function BeratungHeader({ heroImage, formId = "anfrage", topic = null }) {
  const { t, locale } = useInhalt("beratung");
  const common = useInhalt("common");
  const ctx = topic && t(`context.${topic}.title`) ? topic : null;
  const picture = ctx ? TOPIC_IMAGES[ctx] : null;
  const imageSrc = picture?.src || heroImage || "/Images/Home/download.jpg";
  const imageAlt = picture ? t(`context.alt.${ctx}`) : t("heroAlt");
  return (
    <PageHeader
      breadcrumbs={[{ label: common.t("home"), href: "/" }, { label: t("eyebrow") }]}
      eyebrow={t("eyebrow")}
      title={ctx ? t(`context.${ctx}.title`) : t("title")}
      lead={
        <>
          {/* Phones: the intro sentence gives way to the form (step 1 asks the same). */}
          <span className="max-md:hidden">{ctx ? t(`context.${ctx}.lead`) : t("lead")} </span>
          {/* Runde 4 (ux P1, iPhone 13): one short line on phones, the full USP from lg. */}
          <span className="max-md:hidden">{t("usp")} </span>
          <span className="md:hidden">{PHONE_USP[locale] || PHONE_USP.de} </span>
          {/* Rat 9,5 A1 (UX7): /arbeitsweise exists in all four languages – the
              link stays in the visitor's language, without "(in German)". */}
          <SmartLink href="/arbeitsweise" className="whitespace-nowrap text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
            {withoutLangNote(t("uspLink"))}
          </SmartLink>
          {/* Jump to the form: desktop only, inside the lead so phones get no
              empty action row (the form follows directly). */}
          <span className="mt-stack-m hidden md:flex">
            <a
              href={`#${formId}`}
              className="ph-press inline-flex min-h-13 items-center justify-center gap-2 bg-action px-7 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover"
            >
              {t("toForm")}
            </a>
          </span>
        </>
      }
      // Phones: no bottom padding and no row gap for the (hidden) photo column.
      // Runde 4 (ux P1, iPhone 13 with cookie bar): less top space, smaller
      // H1, no eyebrow (it repeats the breadcrumb), so the first wizard option
      // – or the preselected one (BeratungClient puts it first) – is visible
      // above 500 px on the first visit.
      // QM content-legal r2 (iPad quer, 200 % text): in the half column next to the
      // photo "Einrichtungsberatung" is wider than the column and broke hard
      // ("Einrichtungsberatu / ng"). The title carries a soft hyphen at the
      // compound joint (hyphenateTitle) – manual hyphens on every width use it
      // only when the word does not fit: "Einrichtungs- / beratung".
      // QM r3 (iPad hoch): the short phone opening only below 768 px.
      className="[&_h1]:hyphens-manual max-md:pt-2 max-md:pb-0 max-md:[&_.grid]:mt-3 max-md:[&_.grid]:gap-y-0 max-md:[&_h1]:text-[length:min(2rem,var(--ph-h1-cap,100vw))] max-md:[&_h1]:leading-[1.15] max-md:[&_.grid_p.uppercase]:hidden max-md:[&_.grid_h1+*]:mt-3 md:max-lg:pb-12!"
      media={
        <div className="hidden md:block">
          <Media
            src={imageSrc}
            alt={imageAlt}
            ratio="3/2"
            className="lg:ml-auto lg:aspect-[4/5] lg:max-h-[min(600px,calc(100svh-220px))]"
            sizes={IMAGE_SIZES_DESKTOP}
            quality={50}
            preload
            fetchPriority="high"
          >
            {picture?.render && <KiLabel ki={false} className="absolute bottom-3 left-3" />}
            {picture?.source && (
              <span className="absolute bottom-0 right-0 bg-ink-deep/80 px-2 py-1 text-small text-paper">{t("context.imageSource")}</span>
            )}
          </Media>
        </div>
      }
    />
  );
}

// QM r2: a point that qualifies the step ("wenn Ihr Projekt es braucht, …") is a
// condition, not a deliverable – it is set as a line, not as a chip.
const QUALIFIER = /^(wenn|if|si|se)\s/i;

const FeaturesSection = () => {
  const { t, raw } = useInhalt("beratung");
  const steps = raw("steps") || [];

  return (
    // QM content-legal r4 (desktop, 200 % text): the rem section padding doubled to a
    // 350 px empty band – capped at its 1440 px size; the two columns follow the
    // container in rem (56 rem ≈ 900 px at 100 %), so with large text the heading
    // takes the full width instead of a 330 px column („Hand-/zeich-/nung“).
    <Section tone="band" labelledBy="beratung-process" className="py-[min(var(--spacing-section),176px)]!">
      <div className="@container/proc">
      <div className="grid grid-cols-1 gap-y-10 gap-x-grid lg:@min-[56rem]/proc:grid-cols-12">
        {/* Optik QA: on the page grid like the form above (xl:col-start-2 pushed it 84 px in). */}
        <div className="min-w-0 hyphens-manual wrap-break-word lg:@min-[56rem]/proc:col-span-4">
          <div className="lg:@min-[56rem]/proc:sticky lg:top-28">
            <Eyebrow className="mb-stack-s">{t("processEyebrow")}</Eyebrow>
            <Heading id="beratung-process" level={2}>
              {t("processTitle")}
            </Heading>
            <p className="mt-5 max-w-measure text-body text-text-soft">{t("processText")}</p>
          </div>
        </div>

        {/* Motion: the steps arrive one after another (12 px, max 4 steps, transform only). */}
        <ol className="min-w-0 reveal-group border-t border-line-strong [--reveal-y:12px] lg:@min-[56rem]/proc:col-span-7 lg:@min-[56rem]/proc:col-start-6">
          {steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-b border-line py-8 sm:grid-cols-[4rem_minmax(0,1fr)]">
              <span aria-hidden="true" className="tabular text-title text-text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              {/* QM r3 (Zoom 200 %): minmax(0,1fr) + min-w-0 – long words wrap instead of running past the edge. */}
              <div className="min-w-0 hyphens-auto wrap-break-word">
                <h3 className="text-title text-text">{step.title}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{step.text}</p>
                {/* QM r2: short points stay chips; a qualifying sentence ("wenn Ihr Projekt
                    es braucht, auch ein, zwei Tage") wrapped to two lines and was wider
                    than the other chips – it follows as a plain line, same list. */}
                {Array.isArray(step.points) && step.points.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {step.points.map((point) => (
                      <li
                        key={point}
                        className={QUALIFIER.test(point) ? "basis-full text-small text-text-soft" : "max-w-full border border-line px-3 py-1 text-small text-text"}
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
      </div>
    </Section>
  );
};

export default FeaturesSection;
