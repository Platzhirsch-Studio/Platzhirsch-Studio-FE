import cx from "./cx";
import Section from "./Section";
import Heading from "./Heading";
import Eyebrow from "./Eyebrow";
import Button from "./Button";
import Leitsatz from "./Leitsatz";

/**
 * Closing call to action – the "Peak-End" of a page (Bibel §8.3/§16 W15).
 * One primary action ("Termin anfragen", r7-p1 ux P1-5), optionally one secondary, optionally
 * the Leitsatz "Nehmen Sie Platz." above.
 * tone="inverse" uses the page's ONE walnut surface – don't combine with
 * another inverse section or the dark footer on the same page.
 * @param {string} [eyebrow]
 * @param {string} title                  H2 (Instrument/Bodoni via size)
 * @param {ReactNode} [text]              1–2 sentences, concrete (time, cost, person)
 * @param {{href, label}} [primary]       e.g. { href: "/beratung", label: "Termin anfragen" }
 * @param {{href, label}} [secondary]
 * @param {boolean} [leitsatz=false]      show the Leitsatz above the title
 * @param {"band"|"raised"|"inverse"} [tone="band"]
 * @param {string} [id]                   heading id (default "cta-title")
 */
export default function CTABand({
  eyebrow,
  title,
  text,
  primary,
  secondary,
  leitsatz = false,
  tone = "band",
  id = "cta-title",
  className,
}) {
  const dark = tone === "inverse";
  return (
    <Section tone={tone} labelledBy={id} className={className} contained="text">
      <div className="flex flex-col items-center text-center">
        {leitsatz && <Leitsatz size="l" tone={dark ? "inverse" : "text"} className="mb-stack-m" />}
        {eyebrow && (
          <Eyebrow tone={dark ? "inverse" : "accent"} className="mb-stack-s">
            {eyebrow}
          </Eyebrow>
        )}
        <Heading id={id} level={2} size="display-m" tone={dark ? "inverse" : "text"}>
          {title}
        </Heading>
        {text && (
          <div className={cx("mt-stack-s max-w-measure text-body", dark ? "text-text-inverse-soft" : "text-text-soft")}>{text}</div>
        )}
        {(primary || secondary) && (
          <div className="mt-stack-m flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
            {primary && (
              <Button href={primary.href} variant="primary" onDark={dark} arrow>
                {primary.label}
              </Button>
            )}
            {secondary && (
              <Button href={secondary.href} variant="secondary" onDark={dark}>
                {secondary.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
