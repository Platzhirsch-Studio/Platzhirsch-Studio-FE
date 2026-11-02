"use client";
// Vorher-Nachher-Kette EINES echten Projekts (Konzept K8): Vorher · Skizze ·
// Modell · Rendering · Heute. Auswahl als Radiogruppe (Pfeiltasten, 44-px-Ziele),
// Bildwechsel per Crossfade 240 ms (CSS-Übergang; Reduced Motion: sofort).
// Ohne JS (Server-HTML) stehen alle fünf Bilder untereinander, die Auswahl
// erscheint erst nach der Hydration.
import { useRef, useState, useSyncExternalStore } from "react";
import ImageSlot from "./ImageSlot";
import styles from "./arbeitsweise.module.css";

const cx = (...p) => p.filter(Boolean).join(" ");
const noop = () => () => {};

/**
 * @param {Array<{key, label, kind, slot, note?}>} stations
 * @param {string} groupLabel
 */
export default function Kette({ stations, groupLabel }) {
  // false im Server-HTML und bei der Hydration, danach true (ohne setState im Effekt).
  const enhanced = useSyncExternalStore(noop, () => true, () => false);
  const [active, setActive] = useState(0);
  const refs = useRef([]);

  const select = (i, focus = false) => {
    const next = (i + stations.length) % stations.length;
    setActive(next);
    if (focus) refs.current[next]?.focus();
  };
  const onKey = (e) => {
    const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in map) {
      e.preventDefault();
      select(active + map[e.key], true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      select(e.key === "Home" ? 0 : stations.length - 1, true);
    }
  };

  return (
    <div>
      {enhanced && (
        <div role="radiogroup" aria-label={groupLabel} onKeyDown={onKey} className="mb-6 flex flex-wrap gap-2">
          {stations.map((s, i) => (
            <button
              key={s.key}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="radio"
              aria-checked={active === i}
              tabIndex={active === i ? 0 : -1}
              onClick={() => select(i)}
              className={cx(
                "inline-flex min-h-11 min-w-11 items-center gap-2 border px-4 text-ui transition-colors duration-(--duration-micro)",
                active === i ? "border-ink bg-surface-band text-text underline decoration-1 underline-offset-4" : "border-line-control text-text hover:border-ink"
              )}
            >
              <span aria-hidden="true" className="tabular text-small text-text-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className={styles.chainStack} data-enhanced={enhanced ? "true" : "false"}>
        {stations.map((s, i) => (
          <div
            key={s.key}
            className={styles.chainLayer}
            data-active={!enhanced || active === i ? "true" : "false"}
            aria-hidden={enhanced && active !== i ? "true" : undefined}
          >
            {!enhanced && <p className="mb-2 text-overline uppercase text-text-soft">{s.label}</p>}
            <ImageSlot slot={s.slot} kind={s.kind} ratio="3/2" note={s.note} sizes="(min-width: 1024px) 60vw, 100vw" />
          </div>
        ))}
      </div>
    </div>
  );
}
