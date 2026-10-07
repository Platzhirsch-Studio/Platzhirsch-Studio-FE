"use client";
import { PHONE_HREF } from "@/lib/site";
import { Heart, ChevronDown, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useWishlistToggle } from "@/components/ShopCatalog/wishlistHeart";

// Action row on the product detail page: "Beratung anfragen", a heart that
// toggles the product on the Merkliste (CartContext, localStorage), and a
// "Mehr Details anzeigen" link that scrolls down to the product info tabs.
// `wishlistItem` is the Merkliste entry: { id, name, image, category (brand),
// kategories, url_slug, href, produkte_id } — `href`/`image` are complete
// paths (/produkte/…, /cmx/…) so the Merkliste page doesn't have to rebuild
// them for "Produkte New" products.
export default function ProductActions({ locale, consultationHref, detailsAnchor, wishlistItem, labels }) {
  const { saved, toggle: toggleSaved } = useWishlistToggle(wishlistItem);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-stretch gap-3">
        <Link
          href={consultationHref}
          locale={locale}
          className="inline-flex items-center gap-2 bg-[#d1b250] rounded-[3px] px-6 py-3 text-sm font-medium uppercase tracking-wide text-[#30373e] transition-colors duration-300 hover:bg-[#bfa047]"
        >
          {labels.requestConsultation}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>

        <button
          type="button"
          onClick={toggleSaved}
          aria-pressed={saved}
          aria-label={saved ? labels.removeFromWishlist : labels.addToWishlist}
          title={saved ? labels.removeFromWishlist : labels.addToWishlist}
          className={`group inline-flex items-center gap-2 rounded-[3px] border px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors duration-300 ${
            saved
              ? "border-[#d1b250] bg-[#d1b250]/10 text-[#30373e]"
              : "border-[#30373e]/20 text-[#30373e] hover:border-[#d1b250]"
          }`}
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            className={`transition-all duration-300 ${
              saved ? "fill-[#d1b250] text-[#d1b250] scale-110" : "text-[#30373e] group-hover:text-[#d1b250]"
            }`}
          />
          <span>{saved ? labels.saved : labels.save}</span>
        </button>

        {/* Direct phone line — the showroom sells through conversation, so a
            call is the shortest path from product interest to an appointment. */}
        <a
          href={PHONE_HREF}
          className="inline-flex items-center gap-2 rounded-[3px] border border-[#30373e]/20 px-4 py-3 text-sm font-medium uppercase tracking-wide text-[#30373e] transition-colors duration-300 hover:border-[#d1b250]"
        >
          <Phone size={16} aria-hidden="true" />
          <span>{labels.callUs}</span>
        </a>
      </div>

      <a
        href={`#${detailsAnchor}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#30373e] underline decoration-[#d1b250] decoration-2 underline-offset-4 transition-colors hover:text-[#d1b250]"
      >
        {labels.showMoreDetails}
        <ChevronDown size={16} />
      </a>
    </div>
  );
}
