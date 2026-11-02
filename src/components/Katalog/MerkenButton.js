"use client";
// src/components/Katalog/MerkenButton.js
// „Auf meine Auswahl“ für Produkte des statischen Herstellerkatalogs.
// Die Merkliste (CartContext, localStorage) nimmt Einträge außerhalb des
// Frappe-Katalogs bereits auf (Ezarri-Konfigurator, Bodensee-Licht): eigene
// `id`, `href` zur Produktseite, Bild unter /Images/ (wishlistImageSrc).
// Texte als Props (Namespace „katalog“ ist server-only).
import { useCart } from "@/context/CartContext";

/**
 * @param {{item: {id: string, name: string, image: string|null, category: string, href: string, slug: string}, label: string, className?: string}} props
 */
export default function MerkenButton({ item, label, className = "" }) {
  const { addToCart } = useCart();
  return (
    <button
      type="button"
      onClick={() =>
        addToCart({
          id: item.id,
          name: item.name,
          image: item.image,
          category: item.category,
          kategories: "katalog",
          url_slug: item.slug,
          href: item.href,
          produkte_id: item.id,
        })
      }
      className={`inline-flex min-h-11 items-center gap-2 text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current ${className}`}
      data-kat-merken={item.slug}
    >
      {label}
    </button>
  );
}
