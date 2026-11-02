import { getImageProps } from "next/image";
import { preload } from "react-dom";
import { getTranslations } from "next-intl/server";
import { Button, Eyebrow, Lead, LinkArrow } from "@/components/ui";
import { ADDRESS, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { ROUTES } from "@/utils/routing";
import { ownCalendarActive, terminCtaPath } from "@/components/Booking/config";
import { terminLabel } from "@/lib/forms/terminLink";
import { getHomeT } from "./copy";
import { kernDisplay } from "./kern";
import { splitPhrases } from "./heroPhrases";
import WowStage from "@/components/Wow/WowStage";
import WowCoda from "@/components/Wow/WowCoda";
import hs from "./home.module.css";

// Hero of the homepage (Bibel §10.2, §12.1 "Seelicht", Jury §3.1/§3.2).
// Server component, 0 KB JS. The photo is an own showroom image (Lochau) and
// the LCP element, never faded or zoomed in (W12, §8.2 "LCP-Bild sofort voll
// deckend").
//
// LCP on phones (R3-startseite, budget ≤ 2.0 s on a throttled Pixel 7): with
// sizes="100vw" a 393–412 px phone at DPR 2.6–3 picked the 1200 w file
// (≈ 42 KB AVIF q75). Art direction via getImageProps + <picture> (Next docs
// "Art direction"): below 640 px a density srcset at quality 50 – 750 w as
// "1x" (≈ 9 KB AVIF) and 1080 w as "2x" (≈ 16 KB AVIF; R3 fix, QA P3-1: on
// DPR 2–3 phones the 750 px file was upscaled; +7 KB ≈ +35 ms at 1.6 Mbit/s).
// A phone never gets 1200/1920. From 640 px the responsive srcset at
// quality 75 as before. Both candidates are preloaded with
// media-scoped <link rel="preload"> (react-dom preload – what next/image's
// `preload` does internally, which cannot handle <picture>), and the <img>
// has fetchPriority="high" + loading="eager". The box keeps its aspect ratio
// before the image arrives → CLS 0. Text stands BESIDE the photo on paper, not on it → contrast is
// ink on paper (11.37:1), no gradient needed.
// Seelicht (4 light moods chosen by the server per time of day in Lochau)
// needs the photo shoot (§7, day 1); until then one image.
//
// Layout (QA runde 1, P1-1 / P2-5): DOM order = mobile order, so the first
// phone viewport always holds an action:
//   overline → H1 → primary + secondary action → photo → lead → info line.
// From lg the grid moves the lead above the actions in the left column and
// puts the compact info line (hours · address · phone) right under the
// buttons, above the fold at 1440×900; the photo fills the right half.
// The lead is plain text, so the visual reordering does not change the
// focus order.
//
// H1: the Bibel line "Italienisches Wohnen am Bodensee." plus – inside the
// same H1, visible – the previous SEO headline (Slider.headline, per locale:
// "Designermöbel, Küchen & Interior Design in Vorarlberg"), so the keyword
// signal of the old H1 is kept. A real space between the two spans keeps the
// text content readable ("…Bodensee. Designermöbel…").
// Wow hero "Pause" (Marktresearch/digital/features/wow-spezifikation.md): the
// image field becomes the line → model → light → room stage. Default ON in
// every environment (Inhaber-Entscheidung Nr. 9, 28.10.2026); NEXT_PUBLIC_WOW_HERO=0
// switches it off at build time. Switched off, this hero is byte for byte the
// previous one (A/B control); the preload logic below serves both.
export const WOW_HERO = (process.env.NEXT_PUBLIC_WOW_HERO ?? "1") !== "0";
// Wow layout (push round 1, Antreiber awwwards #1, Wächter #1/#5): the stage
// comes first – on phones full width right under the header (16:10, fully in
// the first viewport, above the cookie banner), H1 in display-m; from xl the
// text keeps columns 1–5 and the stage takes 6–12 up to the right viewport
// edge (1024–1279 px: 6 + 6 columns, so the buttons do not wrap).
// Push round 2 (Wächter #1, spec §8.2 Nr. 8): DOM order H1 → actions →
// lead → info → stage, so keyboard and screen reader reach "Termin wählen" before the four
// stage switches; on phones the stage is moved to the top only visually
// (order-first), from lg the grid places it on the right. From lg the text
// column sits above the stage layer (relative z-1): the horizon of the photo
// runs on under the H1 (WowStage .reach).
// Push r3 (Wächter #3): on an iPhone 15 Pro (393 × 659 with the browser bars)
// the cookie banner starts at 514 px, so stage + H1 + "Termin wählen" must end
// by 500 px: phones get a 2:1 stage frame, no overline (the H1 already says
// "am Bodensee"), the SEO line in text-small and tighter steps; the closing
// line "Erst die Linie. Dann Ihr Raum." (WowCoda) follows the actions.
// Push r4 (awwwards #3/#4, luxus-cd #4): phones get a 16:10 photo without the
// bar under it and no top margin on the H1 (still ≤ 500 px); from xl the
// text keeps columns 1–4 and the stage takes 5–12 up to the right viewport
// edge (≈ 64 % of 1440 px instead of 56 %); the desktop image sizes follow
// the stage (r3: "50vw" made a 1× screen pick the 750 w file for an 813 px
// frame).
// Runde 2, Fix-Team P2 (ux P1-7, P2-5): the Kern-USP (Inhaber-Entscheidung
// Nr. 8, "Harald Menghin zeichnet … von Hand … Modell … 3D") stands in the
// first viewport (text: HomePage.hero.lead, delivered by the i18n team).
// Desktop: it is the lead between H1 and actions (USP + place).
// Phones: the lead is hidden (display: none) and the USP sentence stands in
// the coda right under "Termin wählen", merged with "Erst die Linie. Dann Ihr
// Raum." and the link "Unsere Arbeitsweise" – one block, then the info line:
// two levels under the CTA. The image credit sits small on the photo
// (WowStage figcaption). Each copy is display: none on the other viewport, so
// a screen reader meets the USP once.
// Switched off, every class below is
// the previous one.
const L = WOW_HERO
  ? {
      head: "px-gutter pt-3 sm:pt-5 lg:relative lg:z-[1] lg:col-span-6 lg:row-start-1 lg:px-0 lg:pt-16 xl:col-span-4",
      h1: "mt-stack-s max-sm:mt-0 hyphens-manual",
      // QM shell-home 01.11.2026: display-l only from 1440 px – in the 4-column
      // text slot at 1280/1366 px it broke "Von Hand / gezeichnet, / am / Bodensee."
      // and pushed "Termin anfragen" below the first view.
      title: "block font-display text-display-m text-text sm:text-display-l lg:text-display-m min-[1440px]:text-display-l",
      cta: "px-gutter pt-3 sm:pt-stack-m lg:col-span-6 lg:row-start-3 lg:px-0 xl:col-span-4",
      lead: "px-gutter pt-stack-m max-sm:hidden lg:col-span-5 lg:row-start-2 lg:px-0 xl:col-span-4",
      eyebrow: "max-sm:hidden",
      sub: "mt-1.5 block font-sans text-small font-medium text-text-soft sm:mt-stack-s sm:text-lead",
      info: "px-gutter pt-stack-m lg:col-span-6 lg:row-start-4 lg:self-start lg:px-0 lg:pb-2 xl:col-span-4",
      // QM shell-home r3 (iPad quer): the stage is a PORTRAIT box (585 × 684)
      // with object-cover, so the painted photo is box height × 1.67 ≈ 1 140
      // CSS px – "56vw" fetched a 668 px slot (3.4× upscaled at DPR 2). The
      // sizes name the painted width: ≈ 100vw at 1024–1279, ≈ 82vw from 1280.
      sizes: "(min-width: 1280px) 82vw, (min-width: 1024px) 100vw, 100vw",
    }
  : {
      head: "px-gutter pt-6 lg:col-span-6 lg:row-start-1 lg:px-0 lg:pt-16",
      title: "block font-display text-display-l text-text lg:text-display-xl",
      cta: "px-gutter pt-stack-m lg:col-span-6 lg:row-start-3 lg:px-0",
      info: "px-gutter pt-stack-m lg:col-span-6 lg:row-start-4 lg:self-start lg:px-0 lg:pb-2",
      eyebrow: undefined,
      sub: "mt-stack-s block font-sans text-lead font-medium text-text-soft",
      h1: "mt-stack-s hyphens-manual",
      lead: "px-gutter pt-stack-m lg:col-span-5 lg:row-start-2 lg:px-0",
      sizes: "(min-width: 1024px) 50vw, 100vw",
    };

// QM shell-home r3: phrases of the H1 stay together (heroPhrases.js).
function keepPhrases(text, locale) {
  return splitPhrases(text, locale).map((part, i) => (
    <span key={i} className={part.keep ? "@min-[20rem]:whitespace-nowrap" : undefined}>
      {kernDisplay(part.text)}
    </span>
  ));
}

const HERO_IMAGE = "/Images/Home/aboutHome.jpg";
const MOBILE_MAX = 639; // px, below Tailwind's `sm`
const MOBILE_1X = 750; // both widths are in next.config deviceSizes
const MOBILE_2X = 1080;

function heroImage(alt) {
  const common = { src: HERO_IMAGE, alt, fill: true };
  const desktop = getImageProps({ ...common, quality: 75, sizes: L.sizes }).props;
  const mobile = getImageProps({ ...common, quality: 50, sizes: "100vw" }).props;
  // The 750 w entry of the generated srcset (deviceSizes contain 750).
  const candidates = String(mobile.srcSet)
    .split(", ")
    .map((c) => c.trim().split(" "));
  const pick = (w) => candidates.find(([, d]) => d === `${w}w`)?.[0];
  const mobileUrl = pick(MOBILE_1X) || mobile.src;
  const mobileUrl2x = pick(MOBILE_2X);
  const mobileSrcSet = mobileUrl2x ? `${mobileUrl} 1x, ${mobileUrl2x} 2x` : `${mobileUrl} 1x`;
  // sizes/srcSet of the mobile props are replaced by the density candidates.
  const mobileImg = { ...mobile, src: mobileUrl, srcSet: mobileSrcSet, sizes: undefined };
  return { desktop, mobileImg, mobileUrl, mobileSrcSet };
}

export default async function Hero({ locale }) {
  const t = await getHomeT(locale);
  const tSlider = await getTranslations({ locale, namespace: "Slider" });
  // USP (HomePage.hero.lead, text by the i18n team P1): desktop the whole
  // lead, phones its first sentence (the hand drawing) in the coda.
  const lead = t("hero.lead");
  const uspPhone = String(lead).split(/(?<=[.?])\s+/)[0];
  const img = heroImage(t("hero.imageAlt"));
  preload(img.mobileUrl, { as: "image", imageSrcSet: img.mobileSrcSet, media: `(max-width: ${MOBILE_MAX}px)`, fetchPriority: "high" });
  preload(img.desktop.src, {
    as: "image",
    imageSrcSet: img.desktop.srcSet,
    imageSizes: img.desktop.sizes,
    media: `(min-width: ${MOBILE_MAX + 1}px)`,
    fetchPriority: "high",
  });

  return (
    <section aria-labelledby="home-hero-title" className="bg-surface text-text">
      {/* QM shell-home r3 (gross 1920, laptop 1280): the stage spans the text
          rows, so a tall stage stretched every row (≈ 150 px between sub line
          and lead, 140 px before the actions) and pushed "Termin" under the
          cookie bar at 1280 × 800. A fifth row (1fr) now takes the extra
          height below the info line; the text rows keep their own height. */}
      <div className={`${hs.heroGrid} mx-auto grid w-full max-w-page grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-x-grid lg:px-gutter`}>
        {/* 1 · Overline + H1. Mobile: one-line overline (place only) and
            display-l, so the actions stay in the first viewport (375×667). */}
        <div className={`${L.head} ${hs.heroHead} @container`}>
          <Eyebrow className={`${L.eyebrow || ""} [text-wrap:balance]`}>
            <span className="sm:hidden">{t("hero.eyebrowShort")}</span>
            <span className="hidden sm:inline">{t("hero.eyebrow")}</span>
          </Eyebrow>
          <h1 id="home-hero-title" className={L.h1}>
            <span className={L.title}>{keepPhrases(t("hero.title"), locale)}</span>{" "}
            <span className={L.sub}>{String(tSlider("headline")).replace(/ & /g, " & ")}</span>
          </h1>
        </div>

        {/* 2 · The one primary action of the first view + secondary link. */}
        <div className={`${L.cta} ${hs.heroCta}`}>
          {/* Technik R7: labels never break inside the button/link (IT
              "Richiedete un appuntamento" wrapped and was cut off on the
              desktop); when both do not fit side by side, the link moves to
              the next line instead (flex-wrap). Phones keep the full-width
              button, which may wrap there. */}
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
            {/* QM shell-home r3: one word, one target with header, footer, mobile
                menu and CTA bar – with the own calendar "Termin wählen" → /termin
                (terminLink.js), otherwise "Termin anfragen" → /beratung. */}
            <Button
              href={terminCtaPath(locale, ROUTES.beratung)}
              arrow
              className="w-full sm:w-auto sm:whitespace-nowrap"
              {...(WOW_HERO ? { "data-wow-cta": "" } : {})}
            >
              {ownCalendarActive() ? terminLabel(locale, { calendar: true }) : t("hero.cta")}
            </Button>
            <LinkArrow href="#haus" className="sm:whitespace-nowrap">{t("hero.secondary")}</LinkArrow>
          </div>
        </div>
        {/* 2b · Wow, phones only: "Erst die Linie. Dann Ihr Raum." + USP sentence + "Unsere Arbeitsweise" (from 640 px: lead + stage caption). */}
        {WOW_HERO ? <WowCoda locale={locale} usp={uspPhone} /> : null}

        {/* 3 · Photo – mobile after the actions (3:2), desktop the right half,
            full height of the text column. */}
        {WOW_HERO ? null : (
          <div className="relative mt-stack-m aspect-[3/2] bg-linen lg:col-span-6 lg:col-start-7 lg:row-span-5 lg:row-start-1 lg:mt-0 lg:aspect-auto lg:min-h-[34rem]">
            <picture>
              <source media={`(min-width: ${MOBILE_MAX + 1}px)`} srcSet={img.desktop.srcSet} sizes={img.desktop.sizes} />
              <img {...img.mobileImg} alt={t("hero.imageAlt")} loading="eager" fetchPriority="high" decoding="async" className="object-cover" />
            </picture>
          </div>
        )}

        {/* 4 · Lead – mobile below the photo, desktop between H1 and actions. */}
        <div className={L.lead}>
          <Lead tone="soft" data-hero-usp="">
            {lead}
          </Lead>
        </div>

        {/* 5 · Info line: where and how to reach us. R5-USP (gesamtwerk P1-2):
            the opening hours stand ONCE on the page, in the house chapter
            ("Showroom & Café", anchor #haus = the secondary link above) –
            no longer here as well. Address and phone side by side. */}
        {/* QM shell-home r3: a container (rem-based query) instead of a fixed
            two-column grid – with 200 % text the query width doubles, so the
            pair stacks instead of "Landstraße 11" running into the number
            (WCAG 1.4.4). The phone link takes its 44 px target as padding
            around ONE text line (py-3 -my-3), so number and address share the
            same baseline on every device (iPad: was 3–7 px lower), and its
            focus ring is drawn inside that padding, clear of the label. */}
        <div className={`${L.info} @container`}>
          <dl className="grid grid-cols-1 gap-x-5 gap-y-3 border-y border-line py-4 @min-[20rem]:grid-cols-2 sm:gap-grid sm:py-5 lg:flex lg:flex-wrap lg:gap-x-8 lg:gap-y-3 lg:py-4">
            <div>
              <dt className="text-overline uppercase text-text-soft">{t("hero.addressLabel")}</dt>
              <dd className="mt-1 text-ui text-text lg:text-small">
                <span className="whitespace-nowrap">{ADDRESS.street},</span>{" "}
                <span className="whitespace-nowrap">
                  {ADDRESS.postalCode} {ADDRESS.city}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-overline uppercase text-text-soft">{t("hero.phoneLabel")}</dt>
              <dd className="mt-1 text-ui lg:text-small">
                <a
                  href={PHONE_HREF}
                  className="tabular -mx-3 -my-3 inline-block whitespace-nowrap px-3 py-3 text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current focus-visible:shadow-none! focus-visible:[outline-offset:-0.6875rem]!"
                >
                  {PHONE_DISPLAY}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        {/* 6 · Wow stage – LAST in the DOM: after H1 and actions (focus order,
            Wächter #1) and after lead and info line, so a streamed first
            chunk never paints the text rows without the lead (desktop CLS).
            On phones shown first (order-first), from lg on the right (see L). */}
        {WOW_HERO ? (
          <WowStage
            img={img}
            alt={t("hero.imageAlt")}
            locale={locale}
            className={`${hs.heroStage} order-first lg:order-none lg:col-span-6 lg:col-start-7 lg:row-span-5 lg:row-start-1 lg:min-h-[34rem] xl:col-span-8 xl:col-start-5`}
          />
        ) : null}
      </div>
    </section>
  );
}
