// Gutscheinbedingungen (ENTWURF) als Text. Offene Stellen [ … ] sind
// sichtbar hervorgehoben. Server-Komponente. Quelle: src/lib/commerce/voucherTerms.js.
import { Badge, Heading } from "@/components/ui";
import { TERMS_SECTIONS, TERMS_STAND, splitMarks, termsOpenCounts } from "@/lib/commerce/voucherTerms";

export default function VoucherTerms({ headingLevel = 2 }) {
  const counts = termsOpenCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div>
      <p className="flex flex-wrap items-center gap-3 text-small text-text-soft">
        <span>{TERMS_STAND}</span>
        <Badge tone="band">{total} offene Stellen</Badge>
      </p>
      <div className="mt-stack-m space-y-10">
        {TERMS_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`gb-${section.id}`}>
            <Heading level={headingLevel} size="title" id={`gb-${section.id}`}>
              {section.title}
            </Heading>
            <div className="mt-3 max-w-measure space-y-4 text-body text-text">
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
    </div>
  );
}
