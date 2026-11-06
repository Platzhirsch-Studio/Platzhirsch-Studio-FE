"use client";
// Filterzeile der Shop-Listen (§ 3.5, N10; Lounge §7.2): Arbeitsansichten als Segment mit Zählern (≤ 5),
// Pillen-Suche (GET, URL = Zustand), Status-Menü (Arbeitsfluss oben, Endzustände abgetrennt, Ziffern 1–9),
// feste Chips (Lieferart, Kanal), „Testdaten anzeigen“ als Chip, „Zurücksetzen“. Alles serverseitig gefiltert.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Segment from "@/components/Backoffice/Segment";
import Knopf from "@/components/Backoffice/Knopf";
import { Menue, MenuePunkt, MenueTrenner } from "@/components/Backoffice/Overlay";
import { Icon } from "@/components/Backoffice/icons";

function href(basis, params, aenderung) {
  const p = { ...params, ...aenderung };
  delete p.seite;
  delete p.panel;
  const qs = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  const s = qs.toString();
  return s ? `${basis}?${s}` : basis;
}

/**
 * @param {{basis:string, params:Record<string,string>, ansichten?:Array<{id,titel,anzahl}>, ansicht?:string,
 *   status?:Array<{wert,anzeige,ende?:boolean}>, chips?:Array<{param,wert,titel}>, suche?:string, test?:boolean, rechts?:import("react").ReactNode}} p
 */
export default function ShopFilter({ basis, params = {}, ansichten = [], ansicht, status = [], chips = [], suche = "Suchen", test = true, rechts }) {
  const router = useRouter();
  const gewaehlt = String(params.status || "").split(",").filter(Boolean);
  const umschalten = (w) => {
    const neu = gewaehlt.includes(w) ? gewaehlt.filter((x) => x !== w) : [...gewaehlt, w];
    router.push(href(basis, params, { status: neu.join(",") }), { scroll: false });
  };
  // Tasten 1–9: Status-Filter n ein/aus (§ 2.5) – nie in Eingabefeldern
  useEffect(() => {
    const h = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable], dialog")) return;
      if (/^[1-9]$/.test(e.key) && status[Number(e.key) - 1]) {
        const w = status[Number(e.key) - 1].wert;
        const neu = gewaehlt.includes(w) ? gewaehlt.filter((x) => x !== w) : [...gewaehlt, w];
        router.push(href(basis, params, { status: neu.join(",") }), { scroll: false });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [status, gewaehlt, basis, params, router]);
  const aktiv = gewaehlt.length || params.q || params.lieferart || params.kanal;
  const arbeit = status.filter((s) => !s.ende);
  const ende = status.filter((s) => s.ende);
  return (
    <div className="bo-shop-filter" data-testid="shop-filter">
      {ansichten.length > 1 && (
        <Segment label="Ansicht" aktiv={ansicht} optionen={ansichten.map((a) => ({ wert: a.id, titel: a.titel, anzahl: a.anzahl, href: href(basis, { ...params, status: "", q: params.q }, { ansicht: a.id }), testid: `ansicht-${a.id}` }))} />
      )}
      <div className="bo-shop-filter__rechts">
        <form action={basis} method="get" className="bo-shop-suche" role="search">
          {Object.entries(params).filter(([k, v]) => k !== "q" && k !== "seite" && k !== "panel" && v).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <Icon name="Search" className="size-4" />
          <input type="search" name="q" defaultValue={params.q || ""} placeholder={suche} aria-label={suche} data-testid="shop-suche" />
        </form>
        {status.length > 0 && (
          <Menue label="Status" ausloeser={(p) => <Knopf {...p} variant="secondary" iconRechts="ChevronDown" data-testid="filter-status">{gewaehlt.length ? `Status (${gewaehlt.length})` : "Status"}</Knopf>}>
            {arbeit.map((s, i) => (
              <MenuePunkt key={s.wert} gewaehlt={gewaehlt.includes(s.wert)} kuerzel={i < 9 ? String(i + 1) : undefined} offenLassen onWaehlen={() => umschalten(s.wert)}>{s.anzeige}</MenuePunkt>
            ))}
            {ende.length > 0 && <MenueTrenner />}
            {ende.map((s) => (
              <MenuePunkt key={s.wert} gewaehlt={gewaehlt.includes(s.wert)} offenLassen onWaehlen={() => umschalten(s.wert)}>{s.anzeige}</MenuePunkt>
            ))}
          </Menue>
        )}
        {chips.length > 0 && (
          <div className="bo-shop-chipzeile" role="group" aria-label="Schnellfilter">
            {chips.map((c) => {
              const an = params[c.param] === c.wert;
              return (
                <Link key={`${c.param}-${c.wert}`} href={href(basis, params, { [c.param]: an ? "" : c.wert })} className="bo-shop-chip" aria-pressed={an} scroll={false} prefetch={false}>{c.titel}</Link>
              );
            })}
          </div>
        )}
        {test && (
          <Link href={href(basis, params, { test: params.test === "1" ? "" : "1" })} className="bo-shop-chip" aria-pressed={params.test === "1"} scroll={false} prefetch={false} data-testid="chip-testdaten">Testdaten anzeigen</Link>
        )}
        {aktiv ? <Knopf variant="ghost" size="s" href={href(basis, { ansicht: params.ansicht, test: params.test, segment: params.segment, tab: params.tab, ansichtTyp: params.ansichtTyp }, {})}>Zurücksetzen</Knopf> : null}
        {rechts}
      </div>
    </div>
  );
}
