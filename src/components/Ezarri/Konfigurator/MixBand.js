"use client";
// Ezarri-Konfigurator – Anteilsband: eine Leiste mit ziehbaren Grenzen (role=slider,
// Pfeiltasten ±1 %, Bild auf/ab ±10 %), dazu je Mosaik Zahlenfeld und ±-Knöpfe
// (WCAG 2.5.7: Ziehen ist nie der einzige Weg). Summe bleibt immer 100.
import { useRef } from "react";
import { Minus, Plus, Trash2, Replace } from "lucide-react";
import { boundaries, setBoundary, setShare } from "@/lib/ezarri/konfigurator/mix";
import { Thumb } from "./controls";
import { useKonfCopy } from "./useKonfCopy";

export default function MixBand({ mix, index, format, onChange, onRemove, onReplace }) {
  const { t } = useKonfCopy();
  const bar = useRef(null);
  const drag = useRef(null);
  const bounds = boundaries(mix);

  const posFrom = (clientX) => {
    const r = bar.current.getBoundingClientRect();
    return Math.round(((clientX - r.left) / r.width) * 100);
  };

  return (
    <div className="space-y-3" data-ezk-mixband="">
      <div ref={bar} className="relative flex h-12 w-full select-none overflow-hidden border border-line-strong" onPointerMove={(e) => drag.current != null && onChange(setBoundary(mix, drag.current, posFrom(e.clientX)))} onPointerUp={() => (drag.current = null)}>
        {mix.map((e, i) => {
          const ref = index.resolveRef(e.id, format, { ref: e.ref });
          return (
            <div key={e.id} className="relative h-full overflow-hidden transition-[width] duration-(--duration-micro)" style={{ width: `${e.anteil}%` }} aria-hidden="true" title={`${index.label(e.id)}: ${e.anteil} %`}>
              <Thumb img={ref?.img} size="absolute inset-0 size-full" />
              {/* unter 12 % keine Beschriftung (brach in „10 / %“ um, QM R2 P3); Wert steht im Zahlenfeld */}
              {e.anteil >= 12 && <span className="absolute bottom-1 left-1 whitespace-nowrap bg-paper/90 px-1 text-small tabular-nums text-text">{e.anteil} %</span>}
              <span className="sr-only">{i}</span>
            </div>
          );
        })}
        {bounds.map((b, j) => (
          <div
            key={j}
            role="slider"
            tabIndex={0}
            aria-label={t(`Grenze zwischen ${index.label(mix[j].id)} und ${index.label(mix[j + 1].id)}`, `Boundary between ${index.label(mix[j].id)} and ${index.label(mix[j + 1].id)}`, "mix.grenze", { a: index.label(mix[j].id), b: index.label(mix[j + 1].id) })}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={b}
            aria-valuetext={`${index.label(mix[j].id)} ${mix[j].anteil} %, ${index.label(mix[j + 1].id)} ${mix[j + 1].anteil} %`}
            className="absolute inset-y-0 z-10 flex w-11 -translate-x-1/2 cursor-ew-resize items-center justify-center"
            style={{ left: `${b}%`, touchAction: "none" }}
            onPointerDown={(e) => {
              drag.current = j;
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => drag.current === j && onChange(setBoundary(mix, j, posFrom(e.clientX)))}
            onPointerUp={() => (drag.current = null)}
            onKeyDown={(e) => {
              const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 }[e.key];
              if (!d) return;
              e.preventDefault();
              onChange(setBoundary(mix, j, b + d));
            }}
          >
            <span className="h-full w-0.5 bg-paper" aria-hidden="true" />
            <span className="absolute top-1/2 h-6 w-2.5 -translate-y-1/2 border border-ink bg-paper" aria-hidden="true" />
          </div>
        ))}
      </div>
      <ul className="space-y-2">
        {mix.map((e, i) => {
          const ref = index.resolveRef(e.id, format, { ref: e.ref });
          const name = index.label(e.id);
          return (
            <li key={e.id} className="flex items-center gap-2">
              <Thumb img={ref?.img} size="size-11" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-ui text-text">{name}</span>
                <span className="block truncate text-small text-text-soft">{index.kollektion(ref?.kol)}</span>
              </span>
              {mix.length > 1 && (
                <>
                  <button type="button" className="flex size-11 items-center justify-center border border-line-control hover:border-ink" onClick={() => onChange(setShare(mix, i, e.anteil - 5))} aria-label={t(`${name}: 5 Prozent weniger`, `${name}: 5 percent less`, "mix.weniger", { name })}>
                    <Minus className="size-4" aria-hidden="true" strokeWidth={1.5} />
                  </button>
                  <label className="relative">
                    <span className="sr-only">Anteil {name} in Prozent</span>
                    <input
                      key={e.anteil}
                      type="text"
                      inputMode="numeric"
                      defaultValue={e.anteil}
                      onBlur={(ev) => onChange(setShare(mix, i, Number.parseInt(ev.target.value, 10)))}
                      onKeyDown={(ev) => ev.key === "Enter" && onChange(setShare(mix, i, Number.parseInt(ev.currentTarget.value, 10)))}
                      className="h-11 w-16 border border-line-control bg-paper pr-6 text-right text-ui tabular-nums"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-small text-text-soft">%</span>
                  </label>
                  <button type="button" className="flex size-11 items-center justify-center border border-line-control hover:border-ink" onClick={() => onChange(setShare(mix, i, e.anteil + 5))} aria-label={t(`${name}: 5 Prozent mehr`, `${name}: 5 percent more`, "mix.mehr", { name })}>
                    <Plus className="size-4" aria-hidden="true" strokeWidth={1.5} />
                  </button>
                </>
              )}
              <button type="button" className="flex size-11 items-center justify-center hover:bg-stone" onClick={(ev) => onReplace(e.id, ev.currentTarget)} data-ezk-fokus={`ersetzen-${e.id}`} aria-label={t(`${name} austauschen`, `Replace ${name}`, "mix.austauschen", { name })} title={t("Austauschen", "Replace")}>
                <Replace className="size-4" aria-hidden="true" strokeWidth={1.5} />
              </button>
              {mix.length > 1 && (
                <button type="button" className="flex size-11 items-center justify-center hover:bg-stone" onClick={() => onRemove(e.id)} aria-label={t(`${name} aus der Mischung entfernen`, `Remove ${name} from the blend`, "mix.entfernen", { name })} title={t("Entfernen", "Remove")}>
                  <Trash2 className="size-4" aria-hidden="true" strokeWidth={1.5} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
