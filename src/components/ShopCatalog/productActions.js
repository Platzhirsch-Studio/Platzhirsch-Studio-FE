"use client";
import { Heart, Phone } from "lucide-react";
import { PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import Button from "@/components/ui/Button";
import { useWishlistToggle } from "@/components/ShopCatalog/wishlistHeart";
import { glueDash } from "@/components/ShopCatalog/copy";

// Action block of the "Atelier" product page (Bibel §10): ONE primary action
// – the appointment, with the product handed over (?produkt=) – then
// "Merken" ("Ihre Auswahl", CartContext, localStorage) as the secondary, and
// the direct phone line as a quiet link.
// QA Runde 1: the primary takes the full column width on its own line so its
// label stays on one line from 1024 px (P2-2); "Merken" is a quiet text
// button below it whose accessible name IS the visible label, the state is
// aria-pressed (P2-4, WCAG 2.5.3).
// `wishlistItem` is the Merkliste entry (toWishlistItem()).
export default function ProductActions({ consultationHref, wishlistItem, labels }) {
  const { saved, toggle } = useWishlistToggle(wishlistItem);

  return (
    <div className="sm:mt-stack-m lg:mt-stack-m">
      <Button href={consultationHref} arrow fullWidth className="text-balance text-center">
        {glueDash(labels.requestConsultation)}
      </Button>
      {labels.note && <p className="mt-4 max-w-measure text-small text-text-soft">{glueDash(labels.note)}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-8">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={saved}
          className="inline-flex min-h-11 items-center gap-2 text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
        >
          <Heart aria-hidden="true" className={`ph-heart size-4 ${saved ? "fill-current" : "fill-current/0"}`} strokeWidth={1.5} />
          {saved ? labels.saved : labels.save}
        </button>
        <a
          href={PHONE_HREF}
          className="inline-flex min-h-11 items-center gap-2 text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
        >
          <Phone aria-hidden="true" className="size-4" strokeWidth={1.5} />
          <span>
            {labels.callUs} <span className="tabular">{PHONE_DISPLAY}</span>
          </span>
        </a>
      </div>
    </div>
  );
}
