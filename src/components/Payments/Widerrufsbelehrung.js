// Widerrufsbelehrung für den Online-Kauf von Gutscheinen (Server-Komponente).
// Quelle: src/lib/commerce/withdrawalText.js. Offene Stellen [ … ] sind
// sichtbar markiert, solange der Text Entwurf ist (dann ist die Kaufstrecke
// ohnehin nur in Vorschau und Entwicklungs-Mock zu sehen).
import { Badge, Heading, SmartLink } from "@/components/ui";
import { splitMarks } from "@/lib/commerce/voucherTerms";
import { WITHDRAWAL_SECTIONS, WITHDRAWAL_STATUS, withdrawalStandDe } from "@/lib/commerce/withdrawalText";

export default function Widerrufsbelehrung({ headingLevel = 3, withdrawHref = "/zahlung/widerruf" }) {
  const draft = WITHDRAWAL_STATUS !== "freigegeben";
  return (
    <div>
      <p className="flex flex-wrap items-center gap-3 text-small text-text-soft">
        <span>{withdrawalStandDe()}</span>
        {draft && <Badge tone="band">Entwurf</Badge>}
      </p>
      <div className="mt-6 space-y-8">
        {WITHDRAWAL_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`wb-${section.id}`}>
            <Heading level={headingLevel} size="title" id={`wb-${section.id}`}>
              {section.title}
            </Heading>
            <div className="mt-3 max-w-measure space-y-3 text-body text-text">
              {section.paragraphs.map((p, i) => (
                <p key={i}>
                  {splitMarks(p).map((part, j) =>
                    part.type === "mark" ? (
                      <mark key={j} className="bg-stone px-1 text-small font-medium text-text">
                        {part.value}
                      </mark>
                    ) : (
                      <span key={j}>{part.value}</span>
                    )
                  )}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-8">
        <SmartLink
          href={withdrawHref}
          className="inline-flex min-h-12 items-center border border-ink px-6 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:bg-surface-raised"
        >
          Vertrag widerrufen
        </SmartLink>
      </p>
    </div>
  );
}
