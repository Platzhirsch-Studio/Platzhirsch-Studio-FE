"use client";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/context/CartContext";
import { toWishlistItem } from "@/lib/shop/wishlistItem";

// Same id rule as CartContext's generateCartItemId (not exported there).
const cartItemId = (item) => `${item.id}-${item.name}-${item.category || "default"}`;

export function useWishlistToggle(item) {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const saved = cartItems.some((c) => cartItemId(c) === cartItemId(item));
  const toggle = () => (saved ? removeFromCart(cartItemId(item)) : addToCart(item));
  return { saved, toggle };
}

// Whole-collection variant: "saved" once every product is on the Merkliste;
// toggling adds the missing ones, or removes all of them when all are saved.
export function useWishlistCollectionToggle(items) {
  const { cartItems, addManyToCart, removeManyFromCart } = useCart();
  const savedIds = new Set(cartItems.map(cartItemId));
  const saved = items.length > 0 && items.every((item) => savedIds.has(cartItemId(item)));
  const toggle = () => (saved ? removeManyFromCart(items) : addManyToCart(items));
  return { saved, toggle };
}

// Round heart button overlaid on a product card image (top-right). Must sit
// outside the card's <Link> — a <button> inside an <a> is invalid HTML — so
// the card needs `relative` and this goes next to the image link.
export default function WishlistHeart({ product, className = "" }) {
  const t = useTranslations("shop");
  const { saved, toggle } = useWishlistToggle(toWishlistItem(product));
  const label = saved ? t("removeFromWishlistAria") : t("addToWishlistAria");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white ${className}`}
    >
      <Heart
        size={17}
        strokeWidth={1.75}
        className={`transition-colors duration-300 ${saved ? "fill-[#d1b250] text-[#d1b250]" : "text-[#30373e]"}`}
      />
    </button>
  );
}
