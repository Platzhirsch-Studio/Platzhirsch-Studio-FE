"use client";
// Leiste „Vergleich (n)“ unten, sobald mindestens ein Mosaik gewählt ist.
// Solange sie steht, ist die mobile Termin-Leiste (MobileCtaBar) ausgeblendet
// (QM P1-1): reines CSS in ezarri.module.css (.compareBar, wie beim
// Küchenplaner), dazu html[data-ez-compare="1"] als Haken für MobileCtaBar.
// Ansage der Anzahl per aria-live (polite).
import { useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { VERGLEICH as VERGLEICH_DE } from "@/lib/ezarri/copy";
import { VERGLEICH as VERGLEICH_EN } from "@/lib/ezarri/copy.en";
import { VERGLEICH as VERGLEICH_FR } from "@/lib/ezarri/copy.fr";
import { VERGLEICH as VERGLEICH_IT } from "@/lib/ezarri/copy.it";
import { ezT } from "@/lib/ezarri/werte";

const VERGLEICHE = { de: VERGLEICH_DE, en: VERGLEICH_EN, fr: VERGLEICH_FR, it: VERGLEICH_IT };
import styles from "@/components/Ezarri/Welt/ezarri.module.css";
import { MAX_COMPARE, useCompare } from "./compareStore";
import { BAR_UP } from "@/lib/ezarri/motion";

export default function CompareBar() {
  const { ids, clear } = useCompare();
  const locale = useLocale();
  const VERGLEICH = VERGLEICHE[locale] ?? VERGLEICH_DE;
  const active = ids.length > 0;

  useEffect(() => {
    if (!active) return undefined;
    const root = document.documentElement;
    root.dataset.ezCompare = "1";
    return () => {
      delete root.dataset.ezCompare;
    };
  }, [active]);

  return (
    <div aria-live="polite" className="contents">
      {active && (
        <div
          role="region"
          aria-label={VERGLEICH.leiste(ids.length)}
          className={`${styles.compareBar} fixed inset-x-0 bottom-0 z-(--z-cta-bar) border-t border-line bg-surface-raised pb-[env(safe-area-inset-bottom)] shadow-overlay ${BAR_UP}`}
        >
          <div className="mx-auto flex max-w-page items-center gap-3 px-gutter py-2">
            <p className="min-w-0 flex-1 text-small text-text-soft">
              <span className="text-ui text-text">{VERGLEICH.leiste(ids.length)}</span>
              <span className="hidden sm:inline"> · {ezT(locale)("höchstens", "at most", "au maximum", "al massimo")} {MAX_COMPARE}</span>
            </p>
            <button type="button" onClick={clear} className="ph-press inline-flex min-h-11 items-center gap-1 px-2 text-small text-text-soft transition-colors duration-(--duration-micro) hover:text-text">
              <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
              {VERGLEICH.leeren}
            </button>
            <Link
              href={`/ezarri/mosaike/vergleich?ids=${ids.join(",")}`}
              className="ph-press inline-flex min-h-11 items-center bg-action px-4 text-ui text-paper transition-colors duration-(--duration-micro) hover:bg-action-hover"
              data-cta="compare"
            >
              {VERGLEICH.oeffnen}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
