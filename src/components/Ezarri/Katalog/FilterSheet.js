"use client";
// Gemeinsame Filter-Bausteine der Ezarri-Welt (QM Runde 2, P2-4: ein
// Bedienkonzept für Mosaik-Übersicht und Galerie):
//   Chip        Checkbox als Chip (sr-only-Input, sichtbarer Fokus, Trefferzahl)
//   ChipGroup   fieldset mit Legende und umbrechenden Chips (kein Querscrollen)
//   FilterSheet Bottom-Sheet (<dialog>, showModal) mit Kopf, scrollendem Inhalt
//               und Fußleiste; Klick auf den Hintergrund und Esc schließen.
// Der Aufrufer hält die Ref (sheetRef) und öffnet mit sheetRef.current.showModal().
import { X } from "lucide-react";
import styles from "@/components/Ezarri/Welt/ezarri.module.css";
import { SHEET_UP } from "@/lib/ezarri/motion";

export function Chip({ name, value, checked, onChange, count, swatch, children }) {
  return (
    <label
      className={`relative inline-flex min-h-11 cursor-pointer items-center gap-2 border px-3 text-small transition-colors duration-(--duration-micro) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
        checked ? "border-see bg-see text-paper" : "border-line-control text-text hover:border-ink"
      } ${count === 0 && !checked ? "opacity-60" : ""}`}
    >
      <input type="checkbox" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {swatch && <span aria-hidden="true" className="size-4 shrink-0 border border-line-strong bg-(--swatch)" style={{ "--swatch": swatch }} />}
      <span>{children}</span>
      {typeof count === "number" && <span className={checked ? "text-paper/80" : "text-text-soft"}>({count})</span>}
    </label>
  );
}

export function ChipGroup({ legend, hint, children, className = "" }) {
  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="mb-2 text-overline uppercase text-text-soft">{legend}</legend>
      {hint && <p className="-mt-1 mb-2 text-small text-text-soft">{hint}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * @param {{current: HTMLDialogElement|null}} sheetRef
 * @param {string} titleId
 * @param {string} title
 * @param {string} closeLabel
 * @param {() => void} [onClose] nach dem Schließen (Fokus zurück auf den Auslöser)
 * @param {import("react").ReactNode} footer
 */
export function FilterSheet({ sheetRef, titleId, title, closeLabel, onClose, footer, children }) {
  return (
    <dialog
      ref={sheetRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className={`${styles.sheet} fixed inset-x-0 bottom-0 top-auto m-0 mt-auto max-h-[88dvh] w-full max-w-none flex-col bg-surface p-0 text-text shadow-overlay backdrop:bg-ink/50 open:flex ${SHEET_UP}`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-gutter py-2">
        <h2 id={titleId} className="text-title text-text">
          {title}
        </h2>
        <button type="button" onClick={() => sheetRef.current?.close()} className="ph-press inline-flex size-12 items-center justify-center text-text" aria-label={closeLabel}>
          <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-gutter py-6">{children}</div>
      <div className="flex items-center gap-3 border-t border-line px-gutter pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">{footer}</div>
    </dialog>
  );
}
