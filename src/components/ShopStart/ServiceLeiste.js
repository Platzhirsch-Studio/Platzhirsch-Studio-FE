// src/components/ShopStart/ServiceLeiste.js
// Serviceleiste des Shops (Server Component). Die Aussagen kommen fertig aus
// serviceLeiste() (src/lib/shop/shopStart.js) – nur, was laut SHOP_MODE und
// Lieferländern stimmt; hier wird nur gesetzt. Kein Icon-Font, nur Text
// (WCAG 1.4.12: Zeilen umbrechen frei).
import { Container } from "@/components/ui";

const PUNKT = (
  <svg aria-hidden="true" viewBox="0 0 8 8" className="mt-2 size-1.5 shrink-0 fill-current text-text-accent">
    <circle cx="4" cy="4" r="4" />
  </svg>
);

/** @param {{ items: Array<{id: string, text: string}>, label: string }} props */
export default function ServiceLeiste({ items, label }) {
  if (!items?.length) return null;
  return (
    <section aria-label={label} className="border-y border-line bg-surface-raised text-text" data-shop-service="">
      <Container>
        {/* Raster statt flex-wrap: bei 1280 px rutschte der 4. Punkt allein in eine zweite Zeile. */}
        <ul className="grid gap-x-grid gap-y-2 py-4 text-small sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
          {items.map((s) => (
            <li key={s.id} className="flex items-start gap-2" data-shop-service-item={s.id}>
              {PUNKT}
              <span>{s.text}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
