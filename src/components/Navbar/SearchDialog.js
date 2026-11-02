"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "@/components/ui/icons";
import cx from "@/components/ui/cx";

// Header search trigger (R4-shell-perf, masterplan AP8: "Die Suche lädt erst
// bei Fokus"). Only this button is in the first load; the sheet
// (SearchSheet.js: <dialog>, live results, next/image) is fetched when the
// pointer approaches or the button gets focus, and mounted on the first
// click, which also opens it. Same accessible name and dialog as before.
const loadSheet = () => import("./SearchSheet");
const SearchSheet = dynamic(loadSheet, { ssr: false });

export default function SearchDialog({ className, labels = {} }) {
  const [openSignal, setOpenSignal] = useState(0);
  const prefetch = () => {
    loadSheet().catch(() => {});
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenSignal((n) => n + 1)}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        onTouchStart={prefetch}
        aria-haspopup="dialog"
        aria-label={labels.open}
        className={cx(
          "inline-flex min-h-11 min-w-11 items-center justify-center text-text transition-colors duration-(--duration-micro) hover:text-text-soft",
          className
        )}
      >
        <Search aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </button>
      {openSignal > 0 && <SearchSheet labels={labels} openSignal={openSignal} />}
    </>
  );
}
