import { Button, Eyebrow, Leitsatz, Section } from "@/components/ui";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { ROUTES } from "@/utils/routing";
import { ownCalendarActive, terminCtaPath } from "@/components/Booking/config";
import { terminLabel } from "@/lib/forms/terminLink";
import { getHomeT } from "./copy";
import { kernDisplay } from "./kern";
import { SECTION_Y } from "./row";

// Closing appointment CTA – the Peak-End of the page (Bibel W15, Jury §3.3).
// Hierarchy (QA runde 1, P2-3): overline on top, then ONE H2 that carries
// the Leitsatz "Nehmen Sie Platz." (Bodoni italic, the page's only centred
// line, once per page) and, as its second upright line, "Wir nehmen uns
// Zeit." – so screen readers hear the Leitsatz as part of the heading. Then
// text and the two actions. Light surface (band), not walnut – the page's
// dark surface is "Showroom & Café".
// Built here instead of with <CTABand>, whose Leitsatz sits above the
// overline as a separate paragraph.
export default async function ClosingCta({ locale }) {
  const t = await getHomeT(locale);
  return (
    <Section tone="band" labelledBy="home-cta-title" contained="text" spacing="none" className={SECTION_Y}>
      <div className="flex flex-col items-center text-center">
        <Eyebrow>{t("cta.eyebrow")}</Eyebrow>
        {/* QM shell-home r3/r4 (200 % text, IT "Accomodatevi."): the display
            sizes are capped by the viewport (globals.css), so the word fits;
            break-word only as the last resort (no hyphens:auto – WebKit broke
            without a hyphen). */}
        <h2 id="home-cta-title" className="mt-stack-s max-w-full text-text [overflow-wrap:break-word] [&_.text-display-l]:text-[length:min(var(--text-display-l),10.5vw)]">
          <Leitsatz as="span" size="l" className="block" />{" "}
          <span className="mt-2 block font-display text-display-m">{kernDisplay(t("cta.title"))}</span>
        </h2>
        <p className="mt-stack-m max-w-measure text-body text-text-soft">{t("cta.text")}</p>
        {/* QM shell-home r4 (desktop IT/FR): inside the 720 px text column the
            two buttons were squeezed to ~280 px and wrapped ("Prenotate un
            appuntamento", "+43 5574 / 46255"). From sm the row takes its
            max-content width (centred, it may be wider than the text column,
            up to the screen minus the gutters) and wraps button by button
            instead of wrapping the labels; the number never breaks. */}
        <div className="mt-stack-m flex w-full flex-col items-stretch gap-3 sm:w-max sm:max-w-[calc(100vw-2*var(--spacing-gutter,1.5rem))] sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          {/* Same word and target as the shell (QM shell-home r3, see Hero). */}
          <Button href={terminCtaPath(locale, ROUTES.beratung)} variant="primary" arrow>
            {ownCalendarActive() ? terminLabel(locale, { calendar: true }) : t("cta.primary")}
          </Button>
          <Button href={PHONE_HREF} variant="secondary">
            <span className="tabular">{t("cta.phone", { phone: PHONE_DISPLAY.replace(/ /g, "\u00a0") })}</span>
          </Button>
        </div>
      </div>
    </Section>
  );
}
