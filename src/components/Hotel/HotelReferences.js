// Referenz-Slot der Seite Hotel & Objekt. Rendert NICHTS ohne freigegebenen
// Eintrag (src/lib/hotel/references.js) – kein Leerzustand, kein Platzhalter,
// keine Herstellerprojekte. Server-Komponente.
import { Section } from "@/components/ui";
import { SectionHead } from "@/components/Landing/parts";

export default function HotelReferences({ data, items = [], locale = "de" }) {
  if (!items.length) return null;
  return (
    <Section tone="surface" labelledBy="ho-referenzen" id="referenzen" className="scroll-mt-[88px]">
      <SectionHead id="ho-referenzen" eyebrow={data.eyebrow} title={data.heading} text={data.text} />
      <ul className="mt-stack-m grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2" data-hotel-references="">
        {items.map((ref) => (
          <li key={ref.id} className="border-t border-line pt-6">
            {ref.bild && (
              // Nur eigene Aufnahmen mit dokumentierten Rechten (references.js).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ref.bild.src} alt={ref.bild.alt[locale]} loading="lazy" decoding="async" className="mb-4 block aspect-[3/2] h-auto w-full object-cover" />
            )}
            <h3 className="text-title text-text">{ref.name}</h3>
            <p className="mt-1 text-small text-text-soft tabular">
              {[ref.ort, ref.kategorie, ref.jahr].filter(Boolean).join(" · ")}
            </p>
            {ref.text?.[locale] && <p className="mt-3 max-w-measure text-body text-text">{ref.text[locale]}</p>}
            <ul className="mt-3 text-body text-text-soft">
              {ref.leistungen[locale].map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {ref.bild?.credit && <p className="mt-2 text-small text-text-soft">{ref.bild.credit}</p>}
          </li>
        ))}
      </ul>
    </Section>
  );
}
