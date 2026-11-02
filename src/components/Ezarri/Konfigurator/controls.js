"use client";
// Ezarri-Konfigurator – Bedienelemente. Native Radios/Checkboxen (Pfeiltasten,
// Screenreader und Formular-Semantik ohne Nachbau), gestaltet nach Bibel:
// 0 Radius, Trefferflächen ≥ 44 px, Fokusring global (globals.css), Text ≥ 4,5:1.
import { useEffect, useId, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { useKonfCopy } from "./useKonfCopy";
import cx from "@/components/ui/cx";

/**
 * Auswahl (Radiogruppe) als Chips oder Karten.
 * @param {{legend:string, name:string, options:Array<{id:string,label:string,sub?:string,disabled?:boolean,hint?:string,swatch?:string}>,
 *          value:string, onChange:(id:string)=>void, variant?:"chips"|"cards", cols?:string, legendHidden?:boolean}} p
 */
export function Choice({ legend, name, options, value, onChange, variant = "chips", cols, legendHidden = false, className }) {
  const uid = useId();
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className={cx("mb-2 text-small font-medium text-text", legendHidden && "sr-only")}>{legend}</legend>
      {/* QM r2: Karten höchstens zweispaltig, Mindestbreite 9 rem – bei 200 % Text einspaltig statt angeschnitten */}
      <div className={cx(variant === "cards" ? cx("grid gap-2", cols || "grid-cols-[repeat(auto-fill,minmax(min(100%,max(9rem,calc(50%-0.25rem))),1fr))]") : "flex flex-wrap gap-2")}>
        {options.map((o) => {
          const id = `${uid}-${o.id}`;
          return (
            <label key={o.id} htmlFor={id} className={cx("relative block max-w-full", o.disabled && "cursor-not-allowed")}>
              <input
                id={id}
                type="radio"
                name={`${name}-${uid}`}
                value={o.id}
                checked={value === o.id}
                disabled={o.disabled}
                onChange={() => onChange(o.id)}
                className="peer absolute inset-0 size-full cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
                aria-describedby={o.hint ? `${id}-h` : undefined}
              />
              <span
                className={cx(
                  "pointer-events-none flex min-h-11 border transition-colors duration-(--duration-micro)",
                  // QM r2: kein nowrap – ein Chip, der breiter als die Spalte wäre (200 % Text), bricht um statt abgeschnitten zu werden
                  variant === "cards" ? "h-full flex-col justify-center px-3 py-2" : "items-center gap-2 px-3",
                  "border-line-control bg-paper text-text peer-hover:border-ink",
                  "peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
                  "peer-disabled:border-line peer-disabled:bg-stone peer-disabled:text-text-soft",
                )}
              >
                {o.swatch && <span className="size-5 shrink-0 border border-line-strong bg-(--swatch)" style={{ "--swatch": o.swatch }} aria-hidden="true" />}
                <span className="text-ui">{o.label}</span>
                {o.sub && <span className="text-small opacity-80">{o.sub}</span>}
              </span>
              {o.hint && (
                <span id={`${id}-h`} className="sr-only">
                  {o.hint}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Zahl mit Schieber, Feld und ± (WCAG 2.5.7: Ziehen ist nie der einzige Weg). */
export function NumberField({ label, value, min, max, step = 0.1, unit = "m", onChange, digits = 1 }) {
  const id = useId();
  // Welle 2: englisch mit Dezimalpunkt (fr/it wie Deutsch mit Komma)
  const { en, t } = useKonfCopy();
  const dez = (v) => (en ? String(v) : String(v).replace(".", ","));
  const set = (v) => {
    const n = Number.parseFloat(String(v).replace(",", "."));
    if (!Number.isFinite(n)) return;
    onChange(Math.min(max, Math.max(min, Math.round(n / step) * step)));
  };
  const shown = Number(value).toFixed(digits);
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-small font-medium text-text">
          {label}
        </label>
        <span className="text-small tabular-nums text-text-soft">
          {dez(min)}–{dez(max)} {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="flex size-11 shrink-0 items-center justify-center border border-line-control text-text hover:border-ink disabled:opacity-40" onClick={() => set(value - step)} disabled={value <= min} aria-label={t(`${label} verringern`, `Decrease ${label}`, "ctl.weniger", { label })}>
          <Minus className="size-4" aria-hidden="true" strokeWidth={1.5} />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => set(e.target.value)}
          className="h-11 min-w-0 flex-1 accent-ink"
          aria-label={t(`${label} (Schieber)`, `${label} (slider)`, "ctl.schieber", { label })}
          aria-valuetext={`${dez(shown)} ${unit}`}
        />
        <button type="button" className="flex size-11 shrink-0 items-center justify-center border border-line-control text-text hover:border-ink disabled:opacity-40" onClick={() => set(value + step)} disabled={value >= max} aria-label={t(`${label} erhöhen`, `Increase ${label}`, "ctl.mehr", { label })}>
          <Plus className="size-4" aria-hidden="true" strokeWidth={1.5} />
        </button>
        <span className="relative">
          <input
            id={id}
            key={shown}
            type="text"
            inputMode="decimal"
            defaultValue={dez(shown)}
            onBlur={(e) => set(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && set(e.currentTarget.value)}
            className="h-11 w-20 border border-line-control bg-paper pl-2 pr-7 text-right text-ui tabular-nums text-text"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-small text-text-soft">{unit}</span>
        </span>
      </div>
    </div>
  );
}

/** Kontrollkästchen mit Unterzeile. */
export function Toggle({ label, sub, checked, onChange, disabled }) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-start gap-3">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 shrink-0 accent-ink" aria-describedby={sub ? `${id}-s` : undefined} />
      <label htmlFor={id} className="text-ui text-text">
        {label}
        {sub && (
          <span id={`${id}-s`} className="block text-small text-text-soft">
            {sub}
          </span>
        )}
      </label>
    </div>
  );
}

/** Abschnitt im Panel. */
export function Block({ title, children, id }) {
  return (
    <section className="scroll-mt-[calc(var(--header-h)+max(42svh,15rem)+1rem)] border-t border-line py-5 first:border-t-0 first:pt-0 lg:scroll-mt-[calc(var(--header-h)+4.5rem)]" aria-labelledby={id}>
      <h3 id={id} className="mb-3 scroll-mt-[calc(var(--header-h)+max(42svh,15rem)+1rem)] text-title text-text lg:scroll-mt-[calc(var(--header-h)+4.5rem)]">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Mosaik-Vorschaubild (Ezarri-Foto, 600er AVIF/WebP). */
export function Thumb({ img, alt = "", size = "size-12", className, eager = false, sizes }) {
  if (!img) return <span className={cx(size, "block shrink-0 bg-linen", className)} aria-hidden="true" />;
  return (
    <picture key={img} className={cx(size, "block shrink-0 overflow-hidden bg-linen", className)}>
      <source type="image/avif" srcSet={`${img}-600.avif 600w`} sizes={sizes || "(max-width: 767px) 33vw, 200px"} />
      <img src={`${img}-600.webp`} alt={alt} width={600} height={600} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" className="size-full object-cover" />
    </picture>
  );
}

/**
 * Rückfrage im Design-System statt window.confirm (QM P3). Natives <dialog>
 * (Fokusfalle, Esc, Fokus kehrt beim Schließen zum Auslöser zurück).
 */
export function Bestaetigen({ open, frage, text, ja, nein, onJa, onNein }) {
  const { t } = useKonfCopy();
  nein ??= t("Abbrechen", "Cancel");
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onNein();
      }}
      aria-labelledby={`${id}-t`}
      aria-describedby={text ? `${id}-d` : undefined}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] bg-paper p-5 text-text shadow-overlay backdrop:bg-ink-deep/40"
      data-ezk-bestaetigen=""
    >
      <h2 id={`${id}-t`} className="text-title">
        {frage}
      </h2>
      {text && (
        <p id={`${id}-d`} className="mt-2 text-ui text-text-soft">
          {text}
        </p>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" autoFocus onClick={onNein} className="min-h-12 border border-line-control px-4 text-ui hover:border-ink">
          {nein}
        </button>
        <button type="button" onClick={onJa} className="min-h-12 bg-action px-4 text-ui text-paper hover:bg-action-hover">
          {ja}
        </button>
      </div>
    </dialog>
  );
}
