"use client";
// „Auf die Merkliste“ für die Viewer-Produktseite: derselbe Eintrag wie auf der
// Shop-Produktseite (toWishlistItem), lokal im Browser, nichts wird gesendet.
import { Heart } from "lucide-react";
import { useWishlistToggle } from "@/components/ShopCatalog/wishlistHeart";
import { toWishlistItem } from "@/lib/shop/wishlistItem";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default function MerkButton({ product }) {
  const { saved, toggle } = useWishlistToggle(toWishlistItem(product));
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      className={`inline-flex min-h-12 items-center justify-center gap-2 border border-line-strong px-5 text-ui text-text transition-colors duration-(--duration-micro) hover:border-ink ${FOCUS}`}
    >
      <Heart aria-hidden="true" className={`size-[18px] ${saved ? "fill-ink" : ""}`} strokeWidth={1.5} />
      {saved ? "Auf der Merkliste" : "Auf die Merkliste"}
    </button>
  );
}
