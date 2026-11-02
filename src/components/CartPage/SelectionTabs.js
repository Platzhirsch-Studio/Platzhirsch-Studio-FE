"use client";
// Rat 9,5 B9 (T2): „Ihre Auswahl“ als EIN Ort unter ♡ – Merkliste (Stücke)
// und Ideenboard (Ideen) als zwei Reiter derselben Auswahl. Umgesetzt als
// Navigations-Reiter (zwei Seiten, je eigene URL, aria-current), nicht als
// ARIA-Tablist: jede Seite bleibt verlinkbar, Zurück funktioniert, und ohne
// JavaScript sind es zwei normale Links. Zähler aus localStorage (nach der
// Hydration; Server und erster Render zeigen keine Zahl → kein Mismatch).
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import { useBoard } from "@/lib/ideenboard/clientStore";
// Shop der Accessoire-Welt (Nr. 29): dritter Reiter „Warenkorb“ nur bei aktivem
// Shop (Prop vom Server, SHOP_MODE test/live). Kein eigenes Kopfzeilen-Symbol
// (Navbar-Überlappung, tests/unit/nav-ueberlappung.test.mjs): der Warenkorb
// hängt an der bestehenden „Auswahl“.
import { cartCount, useShopCart } from "@/components/Shop/cartStore";
import { selectionText } from "./selectionCopy";
import { ROUTES } from "@/utils/routing";

const cx = (...p) => p.filter(Boolean).join(" ");

/** @param {{ active: "stuecke"|"ideen"|"warenkorb", locale: string, className?: string, shop?: boolean, shopLabel?: string }} props */
export default function SelectionTabs({ active, locale = "de", className, shop = false, shopLabel = "Warenkorb" }) {
  const t = useTranslations("cart");
  const { getTotalItems } = useCart();
  const board = useBoard();
  const pieces = getTotalItems();
  const ideas = board?.cards?.length || 0;
  const basket = cartCount(useShopCart());
  const tx = (k) => selectionText(t, locale, k);
  const tabs = [
    { key: "stuecke", href: ROUTES.merkliste[locale] || ROUTES.merkliste.de, label: tx("tabs.pieces"), n: pieces },
    { key: "ideen", href: "/ideenboard", label: tx("tabs.ideas"), n: ideas },
    ...(shop ? [{ key: "warenkorb", href: "/shop/warenkorb", label: shopLabel, n: basket }] : []),
  ];
  return (
    <nav aria-label={tx("tabs.label")} className={cx("border-b border-line print:hidden", className)} data-selection-tabs="">
      {/* Umbrechend statt wischbar (Optik-QA r3: bei 200 % Textzoom schrumpfte der aktive Reiter „Warenkorb“ am Rand
          auf „W“) – jeder Reiter bleibt ganz; drei kurze Wörter brauchen bei normaler Schrift weiter nur eine Zeile. */}
      <ul className="-mb-px flex flex-wrap gap-x-6 whitespace-nowrap sm:gap-x-8" role="list">
        {tabs.map((tab) => {
          const on = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                prefetch={false}
                aria-current={on ? "page" : undefined}
                data-selection-tab={tab.key}
                data-ideenboard-nav={tab.key === "ideen" ? "" : undefined}
                className={cx(
                  "inline-flex min-h-11 items-center gap-2 border-b-2 text-ui transition-colors duration-(--duration-micro)",
                  on ? "border-ink text-text" : "border-transparent text-text-soft hover:text-text"
                )}
              >
                {tab.label}
                {tab.n > 0 && <span className="tabular text-small text-text-soft">({tab.n})</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
