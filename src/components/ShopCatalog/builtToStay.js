import { Container, Eyebrow, Heading } from "@/components/ui";

// "Gebaut, um zu bleiben" (Bibel §9 BuiltToStay, §11 "funktionales Alibi"):
// new covers, spare parts, care. The wording only promises what the studio
// itself does (asking the manufacturer, passing on care notes) – no warranty
// periods or availability claims. Server component on the band surface.
export default function BuiltToStay({ labels }) {
  const items = [
    { id: "refill", title: labels.refillTitle, text: labels.refillText },
    { id: "parts", title: labels.partsTitle, text: labels.partsText },
    { id: "care", title: labels.careTitle, text: labels.careText },
  ];
  return (
    <section aria-labelledby="built-title" className="bg-surface-band py-section text-text">
      <Container>
        <div className="lg:grid lg:grid-cols-12 lg:gap-grid">
          <div className="lg:col-span-5">
            <Eyebrow className="mb-stack-s">{labels.eyebrow}</Eyebrow>
            <Heading id="built-title" level={2} size="display-m">
              {labels.title}
            </Heading>
            <p className="mt-stack-m max-w-measure text-lead text-text">{labels.lead}</p>
          </div>
          <ul className="mt-12 border-t border-line-strong lg:col-span-6 lg:col-start-7 lg:mt-0">
            {items.map((item) => (
              <li key={item.id} className="border-b border-line-strong py-6">
                <h3 className="text-title text-text">{item.title}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
