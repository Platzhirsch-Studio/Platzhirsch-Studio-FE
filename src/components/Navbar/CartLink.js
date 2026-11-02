"use client";
// Warenkorb-Symbol in der Kopfzeile (Shop-Feeling, 31.10.2026) – NUR wenn der
// Shop aktiv ist (navbar.js entscheidet auf dem Server: SHOP_MODE test/live;
// in Produktion ist der Shop standardmäßig off → kein Symbol).
// Zähler aus localStorage nach der Hydration (Server/erster Render: keine
// Zahl → kein Hydration-Mismatch; der Zähler ist absolut positioniert → kein
// Layout-Sprung). Andere Tabs aktualisieren ihn über das storage-Ereignis
// (cartStore). Die Zahl steckt im aria-label des Links („Warenkorb, 3 Artikel“).
// Gleiche Zähler-Optik wie „Ihre Auswahl“ (SelectionLink, Navbar.module.css .count).
// Kein Prefetch (dynamische, noindex-Seite).
import { ShoppingBag } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { cartCount, useShopCart } from "@/components/Shop/cartStore";
import s from "./Navbar.module.css";

/** @param {{ labels: { label: string, count: string } }} props */
export default function CartLink({ labels }) {
  const n = cartCount(useShopCart());
  const label = n > 0 ? labels.count.replace("{n}", String(n)) : labels.label;
  return (
    <Link
      href="/shop/warenkorb"
      prefetch={false}
      aria-label={label}
      data-header-warenkorb={n}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center text-ui text-text transition-colors duration-(--duration-micro) hover:text-text-soft"
    >
      <ShoppingBag aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
      {n > 0 && (
        <span
          key={n}
          aria-hidden="true"
          className={`${s.count} tabular absolute top-1 right-0 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-action px-1 text-[0.75rem] leading-none font-medium text-paper`}
        >
          {n}
        </span>
      )}
    </Link>
  );
}
