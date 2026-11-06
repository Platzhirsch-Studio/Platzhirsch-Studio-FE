"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import cx from "./cx";
import { Icon } from "./icons";
import { useGleiter } from "./motion";
import { Menue, MenuePunkt } from "./Overlay/Popover";
import { anzeige } from "@/lib/backoffice/labels";
import { SEITE } from "./ZuTun/texte";
import { UNTERNAV_MAX, aktiverEintrag, teileUnternav } from "./ZuTun/logik";

// Unternav (MASTER G-10, Q-B3; Lounge §6 „Pillen-Reiter“ und Akte-Reiter „Reise · Planung 14 · …“;
// Team P0-5b). Eine Komponente für die Unternavigation innerhalb einer Seite oder eines Bereichs:
// Kapsel aus 8 % Tinte, aktive Pille in Tinte gleitet mit Feder (useGleiter, transform + Breite),
// Zähler gedimmt, höchstens 7 sichtbar, der Rest unter „Mehr“. Zu schmal: waagrecht scrollbar mit
// weichem Randverlauf. Reines GET (Links), aria-current="page". Abweichung von Q-B3 (2-px-Unterstrich):
// Lounge-Freigabe Nr. 51/53 verlangt Pillen.

export { UNTERNAV_MAX, teileUnternav, aktiverEintrag };

/**
 * @param {object} p
 * @param {Array<{titel:string, href:string, zaehler?:number|string, recht?:boolean, testid?:string}>} p.eintraege
 * @param {string} [p.aktiv]   href des aktiven Eintrags; ohne Angabe aus dem Pfad bestimmt
 * @param {string} [p.label]   Name der Navigation (Screenreader)
 * @param {number} [p.max]     sichtbare Einträge (Standard 7)
 * @param {"m"|"s"} [p.groesse]
 */
export default function Unternav({ eintraege = [], aktiv, label = SEITE.unternav, max = UNTERNAV_MAX, groesse = "m", className, testid = "unternav" }) {
  const pfad = usePathname() || "";
  const aktivHref = aktiv ?? aktiverEintrag(eintraege, pfad);
  const { sichtbar, mehr } = teileUnternav(eintraege, aktivHref, max);
  const { ref, indikator } = useGleiter(aktivHref, { selektor: '[aria-current="page"]' });
  const scroller = useRef(null);
  const [rand, setRand] = useState({ l: false, r: false });
  const messe = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const l = el.scrollLeft > 2;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setRand((alt) => (alt.l === l && alt.r === r ? alt : { l, r }));
  }, []);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    messe();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(messe);
    ro?.observe(el);
    el.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    return () => ro?.disconnect();
  }, [messe, aktivHref]);

  if (sichtbar.length + mehr.length < 2) return null;
  const mehrAktiv = mehr.some((e) => e.href === aktivHref);
  const klein = groesse === "s";
  const item = cx(
    "bo-motion relative z-[1] inline-flex shrink-0 items-center gap-2 rounded-pill whitespace-nowrap font-medium transition-[color,transform] duration-200 active:scale-[0.97] active:duration-[80ms]",
    klein ? "h-8 px-3 text-[13px]" : "h-9 px-4 text-sm"
  );
  return (
    <nav aria-label={label} className={cx("relative min-w-0 max-w-full", className)} data-testid={testid}>
      <div ref={scroller} onScroll={messe} className="bo-scroll-x max-w-full overflow-x-auto rounded-pill [scrollbar-width:none]">
        <ul ref={ref} className="relative isolate inline-flex min-w-max items-center gap-0.5 rounded-pill bg-bo-fill-2 p-1">
          {indikator && <li role="presentation" {...indikator} className={cx(indikator.className, "absolute left-0 top-0 z-0 rounded-pill bg-bo-action shadow-(--bo-sh-ink)")} />}
          {sichtbar.map((e) => {
            const an = e.href === aktivHref;
            return (
              <li key={e.href} className="flex">
                <Link
                  href={e.href}
                  aria-current={an ? "page" : undefined}
                  data-testid={e.testid}
                  className={cx(item, an ? "text-bo-action-text" : "text-bo-text-soft hover:text-bo-text", an && !indikator && "bg-bo-action shadow-(--bo-sh-ink)")}
                >
                  {anzeige(e.titel)}
                  {e.zaehler !== undefined && e.zaehler !== null && e.zaehler !== "" && (
                    <span className="text-xs tabular-nums opacity-70" aria-label={`, ${e.zaehler}`}>
                      {e.zaehler}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          {mehr.length > 0 && (
            <li className="flex">
              <Menue
                label={SEITE.mehr}
                platzierung="unten-ende"
                ausloeser={(p) => (
                  <button {...p} type="button" className={cx(item, mehrAktiv ? "bg-bo-action text-bo-action-text shadow-(--bo-sh-ink)" : "text-bo-text-soft hover:text-bo-text")}>
                    {SEITE.mehr}
                    <Icon name="ChevronDown" className="size-3.5" />
                  </button>
                )}
              >
                {mehr.map((e) => (
                  <MenuePunkt key={e.href} href={e.href} gewaehlt={e.href === aktivHref}>
                    {anzeige(e.titel)}
                    {e.zaehler !== undefined && e.zaehler !== null ? ` · ${e.zaehler}` : ""}
                  </MenuePunkt>
                ))}
              </Menue>
            </li>
          )}
        </ul>
      </div>
      <span aria-hidden="true" className={cx("pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-pill bg-linear-to-r from-bo-bg to-transparent transition-opacity duration-200", rand.l ? "opacity-100" : "opacity-0")} />
      <span aria-hidden="true" className={cx("pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-pill bg-linear-to-l from-bo-bg to-transparent transition-opacity duration-200", rand.r ? "opacity-100" : "opacity-0")} />
    </nav>
  );
}
