import { useTranslations } from "next-intl";
import { Eyebrow, Heading, LinkArrow, Section, cx } from "@/components/ui";
import ImageSlot from "@/components/Arbeitsweise/ImageSlot";
import { MEDIA, RATIO } from "@/lib/arbeitsweise/media";
import { HARALD, haraldNote, processLink } from "./teamCopy";
import { PROFILE_LOCALES, profilePath } from "./haraldProfil";

// Rat 9,5 (A5, gesamtwerk M5): the person the brand turns on stands ABOVE the
// team grid – name as H2, the released USP text (Showroom.abschnitte.haraldText,
// Inhaber-Entscheidung Nr. 8), the order of the planning, "Designs, die leben."
// in Bodoni italic, links to /arbeitsweise and to his profile.
// The 4:5 portrait slot is MEDIA.portrait (tools/arbeitsweise/import.mjs):
// invisible while empty (ImageSlot returns null) – then the text spans the
// row on its own, no empty half. No title or role until confirmed.
// Server component.
export default function HaraldKapitel({ locale = "de" }) {
  const t = useTranslations("Showroom.abschnitte");
  const tl = useTranslations("Arbeitsweise.closing");
  // Texte: inhalt.team.harald.* (übernommen 30.10.2026).
  const th = useTranslations("inhalt.team.harald");
  const c = { eyebrow: th("eyebrow"), steps: th.raw("steps"), stepsLabel: th("stepsLabel"), profile: th("profile") };
  const text = t.has("haraldText") ? t("haraldText") : haraldNote(locale);
  const line = tl.has("line") ? tl("line") : "";
  const portrait = MEDIA.portrait;
  const hasPortrait = Boolean(portrait?.src);
  return (
    <Section tone="surface" spacing="compact" labelledBy="team-harald" data-team-harald="">
      <div className={cx("grid grid-cols-1 gap-y-10 gap-x-grid", hasPortrait && "lg:grid-cols-12 lg:items-center")}>
        {hasPortrait && (
          <ImageSlot
            slot={portrait}
            kind=""
            ratio={RATIO.portrait}
            locale={locale}
            sizes="(min-width: 1440px) 430px, (min-width: 1024px) 34vw, 100vw"
            className="lg:col-span-5"
          />
        )}
        <div className={cx(hasPortrait ? "lg:col-span-6 lg:col-start-7" : "lg:grid lg:grid-cols-12 lg:gap-x-grid")}>
          <div className={hasPortrait ? undefined : "lg:col-span-5"}>
            <Eyebrow className="mb-stack-s">{c.eyebrow}</Eyebrow>
            <Heading id="team-harald" level={2}>
              {HARALD}
            </Heading>
            {line && (
              // Not <Leitsatz>: that one is reserved for the closing CTA (once per page).
              <p className="mt-stack-s font-display-italic text-display-m text-text">{line}</p>
            )}
          </div>
          <div className={hasPortrait ? "mt-stack-m" : "mt-stack-m lg:col-span-6 lg:col-start-7 lg:mt-0"}>
            <p className="max-w-measure text-body text-text-soft">{text}</p>
            <ol aria-label={c.stepsLabel} className="mt-stack-m flex flex-wrap gap-x-3 gap-y-1 text-ui text-text">
              {c.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-x-3">
                  {i > 0 && (
                    <span aria-hidden="true" className="text-text-soft">
                      →
                    </span>
                  )}
                  {s}
                </li>
              ))}
            </ol>
            <div className="mt-stack-m flex flex-col items-start gap-1">
              <LinkArrow href="/arbeitsweise" locale={locale}>
                {processLink(locale)}
              </LinkArrow>
              {PROFILE_LOCALES.includes(locale) && (
                <LinkArrow href={profilePath(locale)} locale={locale}>
                  {c.profile}
                </LinkArrow>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
