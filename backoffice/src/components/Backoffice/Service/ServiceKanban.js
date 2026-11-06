"use client";
// Kanban des Bereichs Service (Fälle, Einsätze, Regress, Bestellungen, Aufträge) im Lounge-Stil (kanban.css):
// Spalten als eingelassene Flächen, Karten schweben. Ziehen mit Maus/Stift, Touch und Tastatur über das Menü
// „Verschieben nach …“ (M). Übergänge mit Pflichtangaben öffnen den Assistenten in der Akte (kanbanAction).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import cx from "../cx";
import Avatar from "../Avatar";
import StatusBadge from "../StatusBadge";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useAktion } from "./useAktion";
import { kanbanAction } from "@/lib/backoffice/service/actions";
import { T } from "@/lib/backoffice/service/texte";
import "../Kanban/kanban.css";
import "./service.css";

/**
 * @param {{art:string, spalten:Array<{status:string, titel:string, ton:string, eingeklappt?:boolean,
 *   karten:Array<{name:string, titel:string, unter?:string, href:string, chips?:Array<{text:string, ton?:string}>, person?:string, hinweis?:string, signal?:string}>}>,
 *   ziele?:Record<string,string[]>, nurLesen?:boolean}} p
 */
export default function ServiceKanban({ art, spalten, ziele = {}, nurLesen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { ausfuehren } = useAktion();
  const [board, setBoard] = useState(spalten);
  const [offen, setOffen] = useState(() => Object.fromEntries(spalten.map((s) => [s.status, !s.eingeklappt])));
  const [drag, setDrag] = useState(null);
  const [ueber, setUeber] = useState(null);
  const [menu, setMenu] = useState(null);
  const [ansage, setAnsage] = useState("");
  const scroller = useRef(null);

  const verschiebe = async (karte, von, nach) => {
    setMenu(null);
    if (von === nach) return;
    if (!(ziele[von] || []).includes(nach)) {
      zeige(`Von „${titelVon(von)}“ nach „${titelVon(nach)}“ gibt es keinen Übergang.`, { art: "info" });
      return;
    }
    const alt = board;
    setBoard((b) => b.map((s) => (s.status === von ? { ...s, karten: s.karten.filter((k) => k.name !== karte.name) } : s.status === nach ? { ...s, karten: [{ ...karte, laeuft: true }, ...s.karten] } : s)));
    const r = await ausfuehren(kanbanAction, { art, name: karte.name, von, nach }, { ok: `${karte.titel} → ${titelVon(nach)}`, ohneRefresh: true, onFehler: () => {} });
    if (!r.ok) {
      setBoard(alt);
      if (r.code === "dialog" && r.href) router.push(r.href);
      return;
    }
    setAnsage(`${karte.titel} verschoben nach ${titelVon(nach)}`);
    router.refresh();
  };
  const titelVon = (status) => board.find((s) => s.status === status)?.titel || status;

  const onPointerDown = (e, karte, von) => {
    if (nurLesen || e.pointerType === "touch" || e.button !== 0 || e.target.closest("a,button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ karte, von, x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e) => {
    if (!drag) return;
    setDrag((d) => ({ ...d, x: e.clientX, y: e.clientY }));
    const el = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.dataset?.spalte);
    setUeber(el?.dataset.spalte || null);
  };
  const onPointerUp = () => {
    if (drag && ueber && ueber !== drag.von) verschiebe(drag.karte, drag.von, ueber);
    setDrag(null);
    setUeber(null);
  };

  return (
    <div className="bo-kb relative min-w-0" data-testid="service-kanban">
      <p className="sr-only" aria-live="polite">
        {ansage}
      </p>
      {nurLesen && (
        <p className="mb-3 inline-flex items-center gap-2 text-[13px] text-bo-text-soft">
          <Icon name="Eye" className="size-4" />
          {T.faelle.kanbanNurLesen}
        </p>
      )}
      <div ref={scroller} className="bo-scroll-x -mx-2 flex items-start gap-4 overflow-x-auto px-2 pb-4 pt-1" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        {board.map((s) => {
          const istZiel = drag && ueber === s.status && (ziele[drag.von] || []).includes(s.status);
          const gesperrt = drag && ueber === s.status && !istZiel && s.status !== drag.von;
          if (!offen[s.status]) {
            return (
              <button key={s.status} type="button" data-spalte={s.status} className={cx("bo-kb__spalte bo-svc-kb__spalte--eingeklappt shrink-0 items-center py-3", istZiel && "is-ziel")} onClick={() => setOffen((o) => ({ ...o, [s.status]: true }))} aria-label={`${s.titel} aufklappen (${s.karten.length})`}>
                <span className="text-[13px] font-medium tabular-nums text-bo-text-soft">{s.karten.length}</span>
                <span className="mt-2 text-[13px] font-medium text-bo-text [writing-mode:vertical-rl]">{s.titel}</span>
              </button>
            );
          }
          return (
            <section key={s.status} data-spalte={s.status} aria-label={`${s.titel}, ${s.karten.length} Karten`} style={{ width: 300 }} className={cx("bo-kb__spalte shrink-0", istZiel && "is-ziel", gesperrt && "is-gesperrt")}>
              <header className="flex h-12 items-center gap-2 px-2">
                <StatusBadge wert={s.status} text={s.titel} ton={s.ton} groesse="m" />
                {gesperrt && <span className="text-[12px] text-bo-text-soft">Kein Übergang</span>}
                <span className="ml-auto inline-flex h-7 min-w-7 items-center justify-center rounded-pill px-2.5 text-[13px] font-medium tabular-nums text-bo-text-soft">{s.karten.length}</span>
              </header>
              <ul className="flex flex-col gap-2">
                {s.karten.length === 0 && <li className="bo-kb__leer">–</li>}
                {s.karten.map((k) => (
                  <li
                    key={k.name}
                    data-karte={k.name}
                    tabIndex={0}
                    onPointerDown={(e) => onPointerDown(e, k, s.status)}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter") router.push(k.href);
                      if ((e.key === "m" || e.key === "M") && !nurLesen) setMenu(k.name);
                    }}
                    className={cx("bo-kb__karte group", drag?.karte.name === k.name && "is-gezogen", k.laeuft && "is-laeuft")}
                    data-testid="kanban-karte"
                  >
                    <div className="flex items-start gap-2">
                      <Link href={k.href} className="min-w-0 flex-1" tabIndex={-1}>
                        <span className="line-clamp-2 text-[15px] leading-5 font-semibold group-hover:underline group-hover:decoration-bo-line-strong group-hover:underline-offset-[3px]">{k.titel}</span>
                        {k.unter && <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-bo-text-soft">{k.unter}</span>}
                      </Link>
                      {!nurLesen && (ziele[s.status] || []).length > 0 && (
                        <div className="relative -mr-1 -mt-1">
                          <button type="button" aria-haspopup="menu" aria-expanded={menu === k.name} aria-label={`${k.titel} verschieben`} onClick={() => setMenu(menu === k.name ? null : k.name)} className="bo-ziel inline-flex size-8 items-center justify-center rounded-full text-bo-text-soft transition-colors duration-150 hover:bg-bo-fill-2 hover:text-bo-text">
                            <Icon name="MoreHorizontal" className="size-4" />
                          </button>
                          {menu === k.name && (
                            <div role="menu" className="bo-kb__menue" onKeyDown={(e) => e.key === "Escape" && setMenu(null)}>
                              <p className="px-3 pb-1 pt-2 text-[12px] font-medium text-bo-text-soft">Verschieben nach</p>
                              {(ziele[s.status] || []).map((z, i) => (
                                <button key={z} type="button" role="menuitem" autoFocus={i === 0} className="flex min-h-10 w-full items-center rounded-[14px] px-3 text-left text-[14px] hover:bg-bo-fill-2" onClick={() => verschiebe(k, s.status, z)}>
                                  {titelVon(z)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {k.chips?.length > 0 && (
                      <div className="bo-svc-kb__chips">
                        {k.chips.map((c) => (
                          <span key={c.text} className={cx("inline-flex h-6 items-center rounded-pill px-2.5 text-[12px] font-medium", c.ton === "gefahr" ? "bg-bo-ziegel-soft text-bo-ziegel-text" : c.ton === "warn" ? "bg-bo-eiche-soft text-bo-eiche-text" : "bg-bo-fill-2 text-bo-text-soft")}>
                            {c.text}
                          </span>
                        ))}
                      </div>
                    )}
                    {(k.hinweis || k.person) && (
                      <div className="bo-svc-kb__fuss">
                        <span className="min-w-0 truncate text-[13px] text-bo-text">{k.hinweis}</span>
                        {k.person && <Avatar name={k.person} groesse={24} />}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {drag && (
        <div className="bo-kb__geist" style={{ left: drag.x + 12, top: drag.y + 12 }} aria-hidden="true">
          {drag.karte.titel}
        </div>
      )}
    </div>
  );
}
