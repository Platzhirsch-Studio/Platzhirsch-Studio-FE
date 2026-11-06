"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import cx from "../cx";
import Knopf, { RundKnopf } from "../Knopf";
import { Icon } from "../icons";
import Datumsfeld from "../Formular/Datumsfeld";
import { anzeige } from "@/lib/backoffice/labels";
import { hatFilter } from "./logik";
import { FILTER } from "./texte";
import "./datatable.css";

const PUNKT = { blau: "bg-bo-cognac", gruen: "bg-bo-salbei", orange: "bg-bo-eiche", rot: "bg-bo-ziegel", lila: "bg-bo-messing", tuerkis: "bg-bo-see", grau: "bg-bo-stein" };

/**
 * Filterleiste im Lounge-Stil (Team P0-5b; lounge.md §6 „Suche“, §7.2 Werkzeugzeile): links die Status als
 * Pillen in einer Kapsel (Mehrfachauswahl, aktiv = Tinte, Punkt im Statuston), rechts Pillen-Suche und ein
 * Zeitraum-Knopf, der eine schwebende Karte mit zwei deutschen Datumsfeldern öffnet. Reines GET – der Server
 * filtert (listenAbfrage). Chips zeigen den Status mit Umlauten, die URL trägt den Originalwert.
 * @param {{basis:string, params:Record<string,string>, statusWerte?:string[], statusTon?:Record<string,string>, datumsLabel?:string, zusatz?:React.ReactNode}} props
 */
export default function Filterleiste({ basis, params = {}, statusWerte = [], statusTon = {}, datumsLabel = FILTER.zeitraum, zusatz }) {
  const router = useRouter();
  const gewaehlt = (params.status || "").split(",").filter(Boolean);
  const [zeitraumOffen, setZeitraumOffen] = useState(false);
  const zeitraumRef = useRef(null);
  const chip = (wert) => {
    const n = gewaehlt.includes(wert) ? gewaehlt.filter((x) => x !== wert) : [...gewaehlt, wert];
    const u = new URLSearchParams(params);
    if (n.length) u.set("status", n.join(","));
    else u.delete("status");
    u.delete("seite");
    const s = u.toString();
    return s ? `${basis}?${s}` : basis;
  };
  const aktiv = hatFilter(params);
  const zeitraumAktiv = !!(params.von || params.bis);
  const label = anzeige(datumsLabel);

  useEffect(() => {
    if (!zeitraumOffen) return undefined;
    const klick = (e) => zeitraumRef.current && !zeitraumRef.current.contains(e.target) && !e.target.closest?.("[data-bo-kalender]") && setZeitraumOffen(false);
    const taste = (e) => e.key === "Escape" && setZeitraumOffen(false);
    document.addEventListener("mousedown", klick);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("mousedown", klick);
      document.removeEventListener("keydown", taste);
    };
  }, [zeitraumOffen]);

  return (
    <form
      method="get"
      action={basis}
      className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3"
      data-testid="filterleiste"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const u = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) if (!["q", "von", "bis", "seite"].includes(k) && v) u.set(k, v);
        for (const k of ["q", "von", "bis"]) {
          const v = String(fd.get(k) || "").trim();
          if (v) u.set(k, v);
        }
        setZeitraumOffen(false);
        const s = u.toString();
        router.push(s ? `${basis}?${s}` : basis);
      }}
    >
      {statusWerte.length > 0 ? (
        <fieldset className="bo-scroll-x min-w-0 max-w-full overflow-x-auto rounded-pill [scrollbar-width:none]">
          <legend className="sr-only">{FILTER.status}</legend>
          <span className="inline-flex min-w-max items-center gap-0.5 rounded-pill bg-bo-fill-2 p-1">
            {statusWerte.map((w) => {
              const an = gewaehlt.includes(w);
              return (
                <Link
                  key={w}
                  href={chip(w)}
                  aria-pressed={an}
                  role="button"
                  scroll={false}
                  className={cx(
                    "bo-motion inline-flex h-9 items-center gap-2 rounded-pill px-4 text-sm font-medium whitespace-nowrap transition-[color,background-color,transform] duration-200 active:scale-[0.97] active:duration-[80ms]",
                    an ? "bg-bo-action text-bo-action-text shadow-(--bo-sh-ink)" : "text-bo-text-soft hover:bg-bo-fill hover:text-bo-text"
                  )}
                  data-ton={statusTon[w]}
                >
                  <span aria-hidden="true" className={cx("size-1.5 rounded-full", an ? "bg-current" : PUNKT[statusTon[w]] || PUNKT.grau)} />
                  {anzeige(w)}
                </Link>
              );
            })}
          </span>
        </fieldset>
      ) : (
        <span />
      )}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
        <label className="bo-suche min-w-0 flex-1 bg-bo-surface! shadow-(--bo-sh-btn) sm:w-64 sm:flex-none">
          <Icon name="Search" className="size-4 shrink-0" />
          <span className="sr-only">{FILTER.suche}</span>
          <input id="filter-q" type="search" name="q" defaultValue={params.q || ""} placeholder={FILTER.suchePlatzhalter} />
        </label>
        <div className="relative" ref={zeitraumRef}>
          <Knopf size="m" variant="secondary" icon="CalendarDays" iconRechts="ChevronDown" aria-expanded={zeitraumOffen} aria-haspopup="dialog" onClick={() => setZeitraumOffen((o) => !o)} data-testid="filter-zeitraum">
            {label}
            {zeitraumAktiv && (
              <>
                <span aria-hidden="true" className="size-1.5 rounded-full bg-bo-cognac" />
                <span className="sr-only">{FILTER.gesetzt}</span>
              </>
            )}
          </Knopf>
          <div hidden={!zeitraumOffen} role="dialog" aria-label={label} className="bo-pop absolute right-0 top-[calc(100%+8px)] z-30 w-[min(320px,calc(100vw-32px))] rounded-bo-karte bg-bo-surface p-4 shadow-(--bo-sh-float)">
            <div className="grid grid-cols-1 gap-3">
              <div className="min-w-0">
                <label htmlFor="filter-von" className="mb-1.5 block text-[13px] font-medium text-bo-text-soft">
                  {label} {FILTER.von}
                </label>
                <Datumsfeld id="filter-von" name="von" defaultValue={params.von || ""} kompakt />
              </div>
              <div className="min-w-0">
                <label htmlFor="filter-bis" className="mb-1.5 block text-[13px] font-medium text-bo-text-soft">
                  {FILTER.bis}
                </label>
                <Datumsfeld id="filter-bis" name="bis" defaultValue={params.bis || ""} kompakt />
              </div>
              <Knopf type="submit" variant="primary" className="w-full">
                {FILTER.anwenden}
              </Knopf>
            </div>
          </div>
        </div>
        {zusatz}
        <RundKnopf icon="Filter" label={FILTER.filtern} type="submit" testid="filter-senden" />
        {aktiv && (
          <Knopf href={basis} size="m" variant="ghost" icon="X">
            {FILTER.zuruecksetzen}
          </Knopf>
        )}
      </div>
    </form>
  );
}
