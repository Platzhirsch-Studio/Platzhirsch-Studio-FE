// Block „Bei uns als Händler“ für die Stadtseiten Bregenz, Dornbirn, Lindau,
// St. Gallen und Friedrichshafen (Daten und Regeln: src/lib/content/
// ortsMarken.js). Überschrift und Händler-Satz kommen aus dem Claim-Register
// (src/lib/legal/claims.js); ohne belegte Marke rendert nichts.
// Server component, kein Client-JS. Wird page-level nach <LandingPage> gesetzt,
// damit das gemeinsame Layout (auch Küchen-/Themenseiten) unverändert bleibt.
import { LinkArrow, Section } from "@/components/ui";
import { ortsMarkenBlock } from "@/lib/content/ortsMarken";
import { ARROW_INLINE, SectionHead } from "./parts";
import { bindAbbreviations } from "./typoLanding";

export default function OrtsMarken({ path }) {
  const data = ortsMarkenBlock(path);
  if (!data) return null;
  return (
    <Section tone="surface" labelledBy="orts-marken-title" data-orts-marken-block="">
      <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-4">
          <SectionHead id="orts-marken-title" eyebrow={data.eyebrow} title={data.heading} />
        </div>
        <div className="space-y-stack-m lg:col-span-7 lg:col-start-6">
          <div className="max-w-measure space-y-4 text-body text-text">
            <p data-orts-marken-statement="">{data.statement}</p>
            <p className="text-text-soft">{data.text}</p>
          </div>
          {data.links.length > 0 && (
            // QM R4: Pfeil am Textende (ARROW_INLINE) und Abstand zwischen zweizeiligen Links –
            // vorher klebten „Ratgeber: …“ und „Minotti Studio – …“ am Handy aneinander.
            <p className="flex flex-wrap gap-x-8 gap-y-3" data-orts-marken-links="">
              {data.links.map((link) => (
                <LinkArrow key={link.href} href={link.href} className={ARROW_INLINE}>
                  {bindAbbreviations(link.label)}
                </LinkArrow>
              ))}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
