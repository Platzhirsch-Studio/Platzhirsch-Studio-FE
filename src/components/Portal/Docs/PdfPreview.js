"use client";

import { useRef, useState } from "react";
import { ExternalLink, Eye, X } from "lucide-react";
import { focusRing } from "./labels";

// Mouse/trackpad (pointer: fine): PDF preview in a modal <dialog> (native
// focus trap + Esc) with a text fallback below the iframe.
// Touch devices (pointer: coarse, incl. iPad): no iframe – iOS Safari shows
// only the first page and scrolls badly. "PDF öffnen" opens the browser's own
// viewer in a new tab; "PDF herunterladen" sits next to it on the page.
// The iframe is only mounted when opened.
export default function PdfPreview({ href, title }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  const show = () => {
    setOpen(true);
    ref.current?.showModal();
  };
  const close = () => {
    ref.current?.close();
  };

  const btn = `inline-flex min-h-11 items-center gap-1.5 border border-ink/20 px-4 text-sm text-ink hover:border-ink ${focusRing}`;

  return (
    <>
      <a href={href} target="_blank" rel="noopener" className={`${btn} pointer-fine:hidden`}>
        <ExternalLink size={16} aria-hidden="true" /> PDF öffnen<span className="sr-only"> (öffnet in neuem Tab)</span>
      </a>
      <button type="button" onClick={show} className={`${btn} hidden pointer-fine:inline-flex`} aria-haspopup="dialog">
        <Eye size={16} aria-hidden="true" /> Vorschau
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === ref.current && close()}
        aria-label={`Vorschau: ${title}`}
        className="m-auto h-[88vh] w-[min(960px,92vw)] max-w-none border border-ink/10 bg-white p-0 shadow-2xl backdrop:bg-ink-deep/60"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
            <p className="truncate text-sm font-semibold text-ink">{title}</p>
            <div className="flex items-center gap-2">
              <a href={href} target="_blank" rel="noopener" className={`py-1 text-sm text-ink/80 underline underline-offset-4 ${focusRing}`}>
                In neuem Tab
              </a>
              <button type="button" onClick={close} className={`inline-flex size-11 items-center justify-center hover:bg-ink/5 ${focusRing}`}>
                <X size={20} aria-hidden="true" />
                <span className="sr-only">Vorschau schließen</span>
              </button>
            </div>
          </div>
          {open && <iframe src={href} title={title} className="min-h-0 w-full flex-1 bg-stone" />}
          <p className="border-t border-ink/10 px-5 py-2.5 text-[13px] text-ink/75">
            Keine Vorschau zu sehen?{" "}
            <a href={href} target="_blank" rel="noopener" className={`py-1 underline underline-offset-2 ${focusRing}`}>
              PDF in neuem Tab öffnen
            </a>{" "}
            oder{" "}
            <a href={`${href}?download=1`} download className={`py-1 underline underline-offset-2 ${focusRing}`}>
              herunterladen
            </a>
            .
          </p>
        </div>
      </dialog>
    </>
  );
}
