"use client";

import { useState } from "react";
import { Heart } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/context/CartContext";
import cx from "@/components/ui/cx";
import { selectionCountLabel } from "./navMatch";
import s from "./Navbar.module.css";

// "Ihre Auswahl" (Design-Bibel §9 Auswahl): the saved pieces, no account.
// Today it is the Merkliste (CartContext, localStorage). The counter is the
// only element allowed to use the pill radius and ease-pop (§6, §8.1).
// showLabel: false (icon only), true (label from 1536 px), "always".
// labels: shellLabels().selection – resolved on the server (R4-shell-perf).
// Tempo fix1 (qa-screenshots/tempo/fix1.md): the header icon is in the
// viewport on every page, so Next prefetched the whole Merkliste route right
// after hydration – its RSC payload AND its client chunks (CartPage,
// Wunschliste share panel with the four-language copy table, ≈ 30 KB gzip),
// inside Lighthouse's TBT window. Now it prefetches on intent (pointer over,
// focus, touch), the pattern of the Next docs (linking-and-navigating.md,
// "Disabling prefetching": prefetch={active ? null : false}). Same link,
// same target; the route still loads before the click on hover/focus/touch.
export default function SelectionLink({ href, showLabel = false, className, labels }) {
  const { getTotalItems } = useCart();
  const count = getTotalItems();
  const [intent, setIntent] = useState(false);
  const onIntent = () => setIntent(true);

  return (
    <Link
      href={href}
      prefetch={intent ? null : false}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
      aria-label={selectionCountLabel(labels, count)}
      className={cx(
        "relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 text-ui text-text transition-colors duration-(--duration-micro) hover:text-text-soft",
        showLabel === true && "2xl:px-2",
        className
      )}
    >
      <Heart aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
      {showLabel && <span className={showLabel === "always" ? "" : "hidden 2xl:inline"}>{labels?.label}</span>}
      {count > 0 && (
        <span
          key={count}
          aria-hidden="true"
          className={cx(
            s.count,
            "tabular absolute top-1 right-0 inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-action px-1 text-[0.75rem] leading-none font-medium text-paper",
            showLabel === true && "2xl:static",
            showLabel === "always" && "static"
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
