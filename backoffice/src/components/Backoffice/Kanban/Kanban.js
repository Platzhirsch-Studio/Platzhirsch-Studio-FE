"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import cx from "../cx";
import Knopf from "../Knopf";
import StatusBadge from "../StatusBadge";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { anzeige } from "@/lib/backoffice/labels";
import { setzeWertAction, workflowAktionAction } from "@/lib/backoffice/actions";
import Avatar from "../Avatar";
import { RundKnopf } from "../Knopf";
import { istPersonSpalte, personName } from "../DataTable/logik";
import { KANBAN } from "./texte";
import "./kanban.css";

const SPALTE_PX = 304;

/**
 * Kanban im Lounge-Stil (Team P0-5b; lounge.md §6 Kundenreise-Spalten): Spalten als eingelassene Flächen
 * (Radius 24), Karten als schwebende Karten (Radius 20, Kartenschatten, Hub beim Hover), Ziel-Spalte mit
 * Tinte-Kontur, Personen als Avatar. Spalten aus Status-Werten (feste Breite 304 px), waagrechter Scroll mit
 * Randverlauf und Blätter-Knöpfen, Drag & Drop mit Maus/Stift (Pointer-Events, ohne
 * Bibliothek), Tastatur: Karte fokussieren, ←/→ verschiebt in die Nachbarspalte (nur
 * erlaubte Übergänge), M öffnet „Verschieben nach …“, Enter öffnet die Karte.
 * Touch: Wischen scrollt das Board, Verschieben über das Menü (⋯).
 * Optimistische Aktualisierung, WIP-Zähler, Ansage über eine Live-Region.
 * Bei Workflow-DocTypes läuft je Zielspalte die passende Workflow-Aktion
 * (uebergaenge: {vonStatus: [{action, nachStatus}]}), sonst setValue(status).
 *
 * @param {{
 *  doctype:string, feld?:string, spalten:Array<{status:string, karten:object[]}>,
 *  kartenFelder:Array<{fieldname,label,fieldtype?,cent?}>, titelFeld:string,
 *  statusTon:Record<string,string>, uebergaenge?:Record<string, Array<{action:string, nachStatus:string}>>,
 *  hrefBasis:string (Karte → `${hrefBasis}/${name}`), wipLimit?:Record<string,number>,
 *  onVerschiebe?:(p:{name,von,nach,action?})=>Promise<{ok:boolean,message?:string,doc?:object}>  ersetzt die Server Action (Demo, Bereichs-Action)
 * }} props
 */
export default function Kanban({ doctype, feld = "status", spalten, kartenFelder = [], titelFeld, statusTon = {}, uebergaenge = null, hrefBasis, wipLimit = {}, onVerschiebe }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [, start] = useTransition();
  const [board, setBoard] = useState(spalten);
  const [optimistisch, bewege] = useOptimistic(board, (state, { name, von, nach }) => {
    const karte = state.find((s) => s.status === von)?.karten.find((k) => k.name === name);
    if (!karte) return state;
    return state.map((s) => (s.status === von ? { ...s, karten: s.karten.filter((k) => k.name !== name) } : s.status === nach ? { ...s, karten: [{ ...karte, [feld]: nach, _laeuft: true }, ...s.karten] } : s));
  });
  const [drag, setDrag] = useState(null); // { name, von, x, y, titel }
  const [ueber, setUeber] = useState(null);
  const [menu, setMenu] = useState(null); // Name der Karte mit offenem „Verschieben“-Menü
  const [ansage, setAnsage] = useState("");
  const scroller = useRef(null);
  const [rand, setRand] = useState({ links: false, rechts: false });

  // Randverlauf + Blätter-Knöpfe nur, wenn es in die Richtung weitergeht.
  const messe = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setRand({ links: el.scrollLeft > 4, rechts: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    messe();
    const ro = new ResizeObserver(messe);
    ro.observe(el);
    return () => ro.disconnect();
  }, [messe]);
  const blaettere = (richtung) => {
    const el = scroller.current;
    if (!el) return;
    const reduziert = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: richtung * (SPALTE_PX + 12), behavior: reduziert ? "auto" : "smooth" });
  };

  const zieleFuer = (von) => {
    if (uebergaenge) return (uebergaenge[von] || []).map((u) => ({ status: u.nachStatus, action: u.action }));
    return board.filter((s) => s.status !== von).map((s) => ({ status: s.status }));
  };

  const verschiebe = (name, von, nach) => {
    if (von === nach) return;
    const ziel = zieleFuer(von).find((z) => z.status === nach);
    if (!ziel) return zeige(KANBAN.keinUebergang(anzeige(von), anzeige(nach)), { art: "fehler" });
    setMenu(null);
    start(async () => {
      bewege({ name, von, nach });
      const r = onVerschiebe ? await onVerschiebe({ name, von, nach, action: ziel.action }) : ziel.action ? await workflowAktionAction({ doctype, name, action: ziel.action }) : await setzeWertAction({ doctype, name, feld, wert: nach });
      if (!r.ok) {
        zeige(r.message, { art: "fehler" });
        router.refresh();
        return;
      }
      setBoard((b) => b.map((s) => (s.status === von ? { ...s, karten: s.karten.filter((k) => k.name !== name) } : s.status === nach ? { ...s, karten: [{ ...(b.find((x) => x.status === von)?.karten.find((k) => k.name === name) || { name }), ...(r.doc || {}), [feld]: nach }, ...s.karten] } : s)));
      setAnsage(KANBAN.verschoben(name, anzeige(nach)));
      zeige(`${name} → ${anzeige(nach)}`, { art: "ok" });
      // Fokus bleibt auf der verschobenen Karte (Tastaturbedienung).
      requestAnimationFrame(() => scroller.current?.querySelector(`[data-karte="${CSS.escape(name)}"]`)?.focus());
    });
  };

  // Pointer-Events (Maus/Stift): Karte greifen, Spalte unter dem Zeiger ermitteln, loslassen.
  const onPointerDown = (e, karte, von) => {
    if (e.pointerType === "touch" || e.button !== 0 || e.target.closest("a,button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ name: karte.name, von, x: e.clientX, y: e.clientY, titel: karte[titelFeld] || karte.name });
  };
  const onPointerMove = (e) => {
    if (!drag) return;
    setDrag((d) => ({ ...d, x: e.clientX, y: e.clientY }));
    const el = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.dataset?.spalte);
    setUeber(el?.dataset.spalte || null);
    // Am Rand automatisch weiterscrollen.
    const r = scroller.current?.getBoundingClientRect();
    if (r && e.clientX > r.right - 48) scroller.current.scrollLeft += 12;
    if (r && e.clientX < r.left + 48) scroller.current.scrollLeft -= 12;
  };
  const onPointerUp = () => {
    if (drag && ueber && ueber !== drag.von) verschiebe(drag.name, drag.von, ueber);
    setDrag(null);
    setUeber(null);
  };

  // Tastatur auf der Karte: ←/→ Nachbarspalte (falls Übergang erlaubt), M Menü, Enter öffnen.
  const onKarteTaste = (e, k, von) => {
    if (e.target !== e.currentTarget) return;
    const reihenfolge = board.map((s) => s.status);
    const i = reihenfolge.indexOf(von);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const erlaubt = new Set(zieleFuer(von).map((z) => z.status));
      const schritt = e.key === "ArrowRight" ? 1 : -1;
      for (let j = i + schritt; j >= 0 && j < reihenfolge.length; j += schritt) {
        if (erlaubt.has(reihenfolge[j])) return verschiebe(k.name, von, reihenfolge[j]);
      }
      setAnsage(KANBAN.keinSchritt(schritt > 0));
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      setMenu(k.name);
    } else if (e.key === "Enter") {
      router.push(`${hrefBasis}/${encodeURIComponent(k.name)}`);
    } else if (e.key === "Escape") {
      setMenu(null);
    }
  };

  return (
    <div className="bo-kb relative min-w-0" data-testid="kanban-rahmen">
      <p id="kanban-hilfe" className="sr-only">
        {KANBAN.hilfe}
      </p>
      <p className="sr-only" aria-live="polite">
        {ansage}
      </p>
      <div ref={scroller} onScroll={messe} className="bo-scroll-x -mx-2 flex snap-x snap-proximity items-start gap-4 overflow-x-auto px-2 pb-4 pt-1" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} data-testid="kanban">
        {optimistisch.map((s) => {
          const limit = wipLimit[s.status];
          const istZiel = drag && ueber === s.status && zieleFuer(drag.von).some((z) => z.status === s.status);
          const gesperrt = drag && ueber === s.status && !istZiel && s.status !== drag.von;
          return (
            <section key={s.status} data-spalte={s.status} aria-label={KANBAN.spalte(anzeige(s.status), s.karten.length)} style={{ width: SPALTE_PX }} className={cx("bo-kb__spalte shrink-0 snap-start", istZiel && "is-ziel", gesperrt && "is-gesperrt")}>
              <header className="flex h-12 items-center gap-2 px-2">
                <StatusBadge wert={s.status} ton={statusTon[s.status]} groesse="m" />
                <span className={cx("ml-auto inline-flex h-7 min-w-7 items-center justify-center rounded-pill px-2.5 text-[13px] font-medium tabular-nums", limit && s.karten.length > limit ? "bg-bo-eiche-soft text-bo-eiche-text" : "text-bo-text-soft")} title={limit ? KANBAN.wip(limit) : undefined}>
                  {s.karten.length}
                  {limit ? ` / ${limit}` : ""}
                </span>
              </header>
              <ul className="flex flex-col gap-2">
                {s.karten.length === 0 && <li className="bo-kb__leer">{KANBAN.leer}</li>}
                {s.karten.map((k) => {
                  const person = kartenFelder.find((f) => istPersonSpalte(f) && k[f.fieldname]);
                  const felder = kartenFelder.filter((f) => f !== person);
                  return (
                    <li
                      key={k.name}
                      data-karte={k.name}
                      tabIndex={0}
                      aria-describedby="kanban-hilfe"
                      onKeyDown={(e) => onKarteTaste(e, k, s.status)}
                      onPointerDown={(e) => onPointerDown(e, k, s.status)}
                      className={cx("bo-kb__karte group", drag?.name === k.name && "is-gezogen", k._laeuft && "is-laeuft")}
                      data-testid="kanban-karte"
                    >
                      <div className="flex items-start gap-2">
                        <Link href={`${hrefBasis}/${encodeURIComponent(k.name)}`} className="min-w-0 flex-1" tabIndex={-1}>
                          <span className="line-clamp-2 break-words text-[15px] leading-5 font-semibold group-hover:underline group-hover:decoration-bo-line-strong group-hover:underline-offset-[3px]">{k[titelFeld] || k.name}</span>
                          <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-bo-text-soft">{k.name}</span>
                        </Link>
                        <div className="relative -mr-1 -mt-1">
                          <button type="button" aria-haspopup="menu" aria-expanded={menu === k.name} aria-label={KANBAN.verschieben(k.name)} onClick={() => setMenu(menu === k.name ? null : k.name)} className="bo-motion bo-ziel inline-flex size-8 items-center justify-center rounded-full text-bo-text-soft transition-colors duration-150 hover:bg-bo-fill-2 hover:text-bo-text">
                            <Icon name="MoreHorizontal" className="size-4" />
                          </button>
                          {menu === k.name && (
                            <Menue
                              ziele={zieleFuer(s.status)}
                              onWahl={(z) => verschiebe(k.name, s.status, z.status)}
                              onSchliessen={() => {
                                setMenu(null);
                                scroller.current?.querySelector(`[data-karte="${CSS.escape(k.name)}"]`)?.focus();
                              }}
                            />
                          )}
                        </div>
                      </div>
                      {felder.length > 0 && (
                        <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px] leading-[18px] text-bo-text-soft">
                          {felder.map((f) => (
                            <div key={f.fieldname} className="contents">
                              <dt className="truncate">{anzeige(f.label)}</dt>
                              <dd className={cx("truncate text-right text-bo-text", f.cent && "tabular-nums")}>{wert(k[f.fieldname], f)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {person && (
                        <p className="mt-3 flex min-w-0 items-center gap-2 text-[13px] text-bo-text-soft">
                          <Avatar name={personName(k[person.fieldname])} groesse={24} ring={false} dekorativ />
                          <span className="truncate">{personName(k[person.fieldname])}</span>
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {board.every((s) => s.karten.length === 0) && (
          <div className="self-center px-4 text-sm text-bo-text-soft">
            {KANBAN.keineKarten}{" "}
            <Knopf size="s" variant="ghost" onClick={() => router.refresh()}>
              {KANBAN.neuLaden}
            </Knopf>
          </div>
        )}
      </div>

      {/* Randverlauf + Blätter-Knöpfe */}
      <div aria-hidden="true" className={cx("pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-bo-bg to-transparent transition-opacity duration-200", rand.links ? "opacity-100" : "opacity-0")} />
      <div aria-hidden="true" className={cx("pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-bo-bg to-transparent transition-opacity duration-200", rand.rechts ? "opacity-100" : "opacity-0")} />
      {rand.links && <RundKnopf icon="ChevronLeft" label={KANBAN.links} onClick={() => blaettere(-1)} className="bo-fade absolute! left-1 top-3" />}
      {rand.rechts && <RundKnopf icon="ChevronRight" label={KANBAN.rechts} onClick={() => blaettere(1)} testid="kanban-weiter" className="bo-fade absolute! right-1 top-3" />}

      {drag && (
        <div aria-hidden="true" className="bo-kb__geist" style={{ left: drag.x + 8, top: drag.y + 8 }}>
          {drag.titel}
        </div>
      )}
    </div>
  );
}

/** Menü „Verschieben nach …“: Pfeiltasten, Enter, Esc; schließt bei Klick daneben. */
function Menue({ ziele, onWahl, onSchliessen }) {
  const ref = useRef(null);
  const schliessen = useRef(onSchliessen);
  useEffect(() => {
    schliessen.current = onSchliessen;
  });
  useEffect(() => {
    ref.current?.querySelector("[role=menuitem]")?.focus();
    const klick = (e) => ref.current && !ref.current.contains(e.target) && !e.target.closest?.("[aria-haspopup=menu]") && schliessen.current();
    document.addEventListener("mousedown", klick);
    return () => document.removeEventListener("mousedown", klick);
  }, []);
  const taste = (e) => {
    const items = [...(ref.current?.querySelectorAll("[role=menuitem]") || [])];
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onSchliessen();
    }
  };
  return (
    <div ref={ref} role="menu" aria-label={KANBAN.verschiebenNach} onKeyDown={taste} className="bo-pop bo-kb__menue">
      <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-bo-text-soft">{KANBAN.verschiebenNach}</p>
      {ziele.length === 0 && <p className="px-3 py-2 text-[13px] text-bo-text-soft">{KANBAN.keinZiel}</p>}
      {ziele.map((z) => (
        <button key={z.status} role="menuitem" type="button" onClick={() => onWahl(z)} className="flex min-h-10 w-full items-center gap-2 rounded-[12px] px-3 text-left text-sm hover:bg-bo-fill-2 focus-visible:bg-bo-fill-2 focus-visible:outline-offset-0">
          <Icon name="ArrowRight" className="size-3.5 shrink-0 text-bo-text-faint" />
          <span className="min-w-0 flex-1 truncate">{anzeige(z.status)}</span>
          {z.action && <span className="shrink-0 text-[12px] text-bo-text-soft">{anzeige(z.action)}</span>}
        </button>
      ))}
    </div>
  );
}

function wert(v, f) {
  if (v === null || v === undefined || v === "") return "–";
  if (istPersonSpalte(f)) return personName(v);
  if (f.cent) return cent(v);
  if (f.fieldtype === "Date") return datum(v);
  if (f.fieldtype === "Datetime") return datumZeit(v);
  if (f.fieldtype === "Select") return anzeige(v);
  return String(v);
}
