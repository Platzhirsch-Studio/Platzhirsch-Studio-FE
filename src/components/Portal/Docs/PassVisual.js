import { Armchair, CookingPot, Grid2x2, LampFloor, Layers, Sofa } from "lucide-react";

// Product image of a product pass (Server Component, 4:3).
// `pass.image` = { src, alt? } once an adapter delivers the manufacturer image
// (Frappe: Item.image of the linked Item, served via /cms/files/…). Until then
// an elegant, clearly labelled placeholder with the brand as wordmark.

const ICON_BY_CATEGORY = { Sofa, Teppich: Grid2x2, Leuchte: LampFloor, Küche: CookingPot, Arbeitsplatte: Layers };

export default function PassVisual({ pass, item, hero = false, className = "" }) {
  const image = pass.image?.src ? pass.image : null;
  const Icon = ICON_BY_CATEGORY[item?.category] || Armchair;

  if (image) {
    return (
      <div className={`relative aspect-[4/3] overflow-hidden bg-stone ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- backoffice image of unknown size, proxied via /cms/files */}
        <img src={image.src} alt={image.alt || `${pass.brand} ${pass.product}`} loading={hero ? "eager" : "lazy"} decoding="async" className="size-full object-cover" />
      </div>
    );
  }

  // Calm placeholder (QA R2, N5): flat surface, the brand alone in the centre,
  // a short brass rule BELOW the category (never through the wordmark) and the
  // line drawing small in the corner, so nothing crosses the text.
  // Druck 02.11.: der Platzhalter ist Entwicklungsstand – er kommt nicht auf den Ausdruck (ein echtes Herstellerbild schon).
  return (
    <div
      className={`relative aspect-[4/3] overflow-hidden border border-ink/10 bg-bone print:hidden ${className}`}
      role="img"
      aria-label={`Platzhalter-Grafik für ${pass.brand} ${pass.product} – Herstellerbild folgt`}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={0.75}
        className={`absolute right-4 bottom-4 text-walnut/15 ${hero ? "size-20 sm:size-28" : "size-14"}`}
      />
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className={`font-display leading-none text-ink ${hero ? "text-4xl sm:text-6xl" : "text-3xl"}`}>{pass.brand}</span>
        <span className="mt-3 text-[11px] font-semibold tracking-[0.25em] text-gold-text uppercase">{item?.category || "Einzelstück"}</span>
        <span className="mt-4 h-px w-10 bg-gold" />
      </div>
      <span className="absolute bottom-3 left-3 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">Platzhalter · Herstellerbild folgt</span>
    </div>
  );
}
