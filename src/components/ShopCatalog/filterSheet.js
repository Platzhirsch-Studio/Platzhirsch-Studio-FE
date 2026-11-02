"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import Button from "@/components/ui/Button";

// Filter sheet of the catalogue (./shopCatalog.js): right-hand sheet on
// desktop, full screen on phones, every filter group in one <dialog>
// (showModal: focus trap, Escape and the inert page come from the platform).
// R6-produkt-perf: its own chunk, mounted on the first "Filter" click only.
// Before, all groups with every checkbox (64 on /de/produkte/lamps) were
// rendered and hydrated on page load, inside a closed dialog nobody sees.
// After the first open it stays mounted (closed), so ticks and the scroll
// position of the sheet survive closing and reopening.

const VISIBLE_OPTION_LIMIT = 6;

function FilterGroup({ group, selected, onToggle, tc, t }) {
  const [expanded, setExpanded] = useState(false);
  // Ticked options first, so a selection is never hidden behind "more".
  const ordered = [...group.options.filter((o) => selected.has(o.value)), ...group.options.filter((o) => !selected.has(o.value))];
  const limit = Math.max(VISIBLE_OPTION_LIMIT, selected.size);
  const visible = expanded ? ordered : ordered.slice(0, limit);
  const hidden = ordered.length - limit;

  return (
    <details id={`filter-group-${group.key}`} className="ph-accordion group border-b border-line" open>
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3">
        <span className="text-ui text-text">{group.title}</span>
        <span className="flex items-center gap-3 text-small text-text-soft">
          {selected.size > 0 && <span className="tabular">{tc("catalog.selectedCount", { count: selected.size })}</span>}
          <ChevronDown aria-hidden="true" className="size-4 transition-transform duration-(--duration-ui) group-open:rotate-180" strokeWidth={1.5} />
        </span>
      </summary>
      <fieldset className="pb-5">
        <legend className="sr-only">{group.title}</legend>
        <ul>
          {visible.map((opt) => {
            const checked = selected.has(opt.value);
            return (
              <li key={opt.value}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body text-text">
                  <span className="relative inline-flex size-5 shrink-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(opt.value)}
                      className="peer size-5 cursor-pointer appearance-none rounded-none border border-line-control bg-surface transition-colors duration-(--duration-micro) checked:border-ink checked:bg-ink"
                    />
                    <Check
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 m-auto size-3.5 text-paper opacity-0 peer-checked:opacity-100"
                      strokeWidth={2}
                    />
                  </span>
                  {group.swatch && (
                    <span
                      aria-hidden="true"
                      className="size-4 shrink-0 border border-line-control"
                      style={{ backgroundColor: opt.hex || "transparent" }}
                    />
                  )}
                  <span className="flex-1 first-letter:uppercase">{opt.label}</span>
                  <span className="tabular text-small text-text-soft">{opt.count}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-1 inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current"
          >
            {expanded ? t("viewLess") : t("viewMore", { count: hidden })}
          </button>
        )}
      </fieldset>
    </details>
  );
}

/**
 * @param request  { groupKey, n } – every new object opens the sheet (n counts
 *                 the clicks), optionally scrolled to one group
 * @param onClosed called after the native close (focus return by the caller)
 */
export default function FilterSheet({ request, groups, selected, onToggle, onClearAll, onClosed, resultCount, activeCount, t, tc }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !request) return;
    if (!dialog.open) dialog.showModal();
    if (request.groupKey) {
      const el = document.getElementById(`filter-group-${request.groupKey}`);
      if (el) {
        el.open = true;
        el.querySelector("summary")?.focus();
        el.scrollIntoView({ block: "start" });
      }
    }
  }, [request]);

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="catalog-filter-title"
      onClose={onClosed}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-md translate-x-0 bg-surface p-0 text-text transition-transform duration-(--duration-ui) ease-quiet backdrop:bg-ink/40 backdrop:transition-opacity backdrop:duration-(--duration-ui) open:flex open:flex-col motion-reduce:transition-none motion-reduce:backdrop:transition-none starting:open:translate-x-full starting:open:backdrop:opacity-0"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-3">
        <h2 id="catalog-filter-title" className="text-title text-text">
          {t("filters")}
        </h2>
        <button type="button" onClick={close} aria-label={t("close")} className="ph-press inline-flex size-11 items-center justify-center text-text transition-colors duration-(--duration-micro) hover:bg-ink/5">
          <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        {groups.map((g) => (
          <FilterGroup key={g.key} group={g} selected={selected[g.key]} onToggle={(v) => onToggle(g.key, v)} tc={tc} t={t} />
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-line px-6 py-4">
        <Button variant="ghost" onClick={onClearAll} disabled={activeCount === 0}>
          {t("clearAll")}
        </Button>
        <Button onClick={close} className="flex-1">
          {tc("catalog.showResults", { count: resultCount })}
        </Button>
      </div>
    </dialog>
  );
}
