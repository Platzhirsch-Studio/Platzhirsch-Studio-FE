"use client";
// Sheet „Montage planen“ (10-konzept-projekte.md § 6.2): Kalenderstreifen zwei Wochen mit Kapazität je Tag
// (Text, nicht nur Farbe), Zeit, Team, Fahrzeug, Leistungen aus gelieferten Positionen, Satz „Legt … an“.
// Standardwerte → Datum wählen + „Montage anlegen“ = 2 Interaktionen (QA 53).

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "../Overlay";
import Knopf from "../Knopf";
import Avatar from "../Avatar";
import { useToast } from "../Toast";
import { montagePlanenAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE, fmtH } from "@/lib/backoffice/projekte/texte";
import cx from "../cx";
import "./projekte.css";

const T = TEXTE.planenSheet;
const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/**
 * @param {{offen:boolean, onSchliessen:()=>void, projekt:{name:string,titel:string,objekt_land?:string}, tage:Array<{tag:string,ist:number,soll:number,ueber:boolean}>,
 *   leute:Array<{user:string,name:string}>, vorschlag:string[], leistungen:{anzahl:number, stunden:number, fehlen:number}, fagg?:boolean, unterlagen?:string[]}} p
 */
export default function MontagePlanenSheet({ offen, onSchliessen, projekt, tage = [], leute = [], vorschlag = [], leistungen = { anzahl: 0, stunden: 0, fehlen: 0 }, fagg = false, unterlagen = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const erster = tage.find((t) => !t.ueber)?.tag || tage[0]?.tag || "";
  const [datum, setDatum] = useState(erster);
  const [von, setVon] = useState("08:00");
  const [bis, setBis] = useState("16:00");
  const [team, setTeam] = useState(vorschlag);
  const [fahrzeug, setFahrzeug] = useState("Bus 1");
  const [faggOk, setFaggOk] = useState(false);
  const [fehler, setFehler] = useState("");
  const [pending, start] = useTransition();
  const [idem] = useState(() => `mp-${Math.random().toString(36).slice(2, 10)}`);
  const namen = useMemo(() => Object.fromEntries(leute.map((l) => [l.user, l.name])), [leute]);
  if (!projekt) return null;
  const ausland = projekt.objekt_land && !/^(Österreich|AT)$/i.test(projekt.objekt_land) ? projekt.objekt_land : "";
  const tagText = (iso) => {
    const d = new Date(`${iso}T12:00:00`);
    return `${WT[d.getDay()]} ${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;
  };
  const satz = datum ? T.satz(tagText(datum), von, bis, team.map((u) => namen[u] || u).join(" + ")) : "";
  const los = () =>
    start(async () => {
      setFehler("");
      const r = await montagePlanenAction({ projekt: projekt.name, datum, von, bis, team, fahrzeug, faggNachweis: faggOk, idempotency: idem });
      if (!r?.ok) {
        setFehler(r?.message || TEXTE.fehler.unbekannt);
        return;
      }
      zeige(T.angelegt, { art: "ok", unter: r.band || satz, aktion: r.href ? { titel: "Öffnen", onClick: () => router.push(r.href) } : undefined });
      onSchliessen();
      router.refresh();
    });
  const sperre = !datum || (fagg && !faggOk) || bis <= von;
  return (
    <Sheet offen={offen} onSchliessen={onSchliessen} titel={T.titel(projekt.titel)} groesse="lg" testid="montage-planen"
      fuss={
        <div className="flex w-full flex-col gap-3">
          {satz && <p className="text-[15px] leading-[22px]" data-testid="planen-satz">{satz}</p>}
          {fehler && <p role="alert" className="text-[13px] text-bo-danger-text">{fehler}</p>}
          <div className="flex justify-end gap-2">
            <Knopf onClick={onSchliessen}>Abbrechen</Knopf>
            <Knopf variant="primary" kuerzel="Strg+Enter" laedt={pending} disabled={sperre} onClick={los} data-testid="montage-anlegen">
              {T.anlegen}
            </Knopf>
          </div>
        </div>
      }>
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-bo-text-soft">{T.datum}</legend>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label={T.datum}>
            {tage.map((t) => {
              const aktiv = t.tag === datum;
              return (
                <button key={t.tag} type="button" role="radio" aria-checked={aktiv} onClick={() => setDatum(t.tag)}
                  className={cx("bo-motion flex min-h-[64px] flex-col items-start justify-between rounded-2xl px-3 py-2 text-left transition-[background-color,transform] active:scale-[0.97] focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none", aktiv ? "bg-bo-ink text-bo-surface shadow-(--bo-sh-ink)" : "bg-bo-surface-2 hover:bg-bo-fill-2")}
                  data-testid={`tag-${t.tag}`}>
                  <span className="text-[13px] font-semibold">{tagText(t.tag)}</span>
                  <span className={cx("text-[12px] tabular-nums", aktiv ? "opacity-80" : t.ueber ? "text-bo-warning-text" : "text-bo-text-soft")}>
                    {fmtH(t.ist)}/{fmtH(t.soll)} h{t.ueber ? ` · ${T.kapazitaetUeber}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">Beginn</span>
            <input type="time" step={900} className="bo-input mt-1 w-full tabular-nums" value={von} onChange={(e) => setVon(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">Ende</span>
            <input type="time" step={900} className="bo-input mt-1 w-full tabular-nums" value={bis} onChange={(e) => setBis(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">{T.fahrzeug}</span>
            <select className="bo-input mt-1 w-full" value={fahrzeug} onChange={(e) => setFahrzeug(e.target.value)}>
              {["Bus 1", "Bus 2", "Anhänger", ""].map((f) => (
                <option key={f} value={f}>
                  {f || "ohne Fahrzeug"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-bo-text-soft">{T.team}</legend>
          <div className="flex flex-wrap gap-2">
            {leute.map((l) => {
              const an = team.includes(l.user);
              return (
                <button key={l.user} type="button" aria-pressed={an} onClick={() => setTeam((t) => (an ? t.filter((x) => x !== l.user) : [...t, l.user]))}
                  className={cx("bo-motion inline-flex h-11 items-center gap-2 rounded-full pr-4 pl-1.5 text-[14px] font-medium transition-[background-color,transform] active:scale-[0.97] focus-visible:shadow-(--bo-sh-focus) focus-visible:outline-none", an ? "bg-bo-ink text-bo-surface" : "bg-bo-surface-2 hover:bg-bo-fill-2")}>
                  <Avatar name={l.name} groesse={32} ring={false} dekorativ />
                  {l.name}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="rounded-[20px] bg-bo-surface-2 p-4 text-[15px] leading-[22px]">
          <p className="font-semibold">{T.leistungen(leistungen.anzahl, leistungen.stunden)}</p>
          {leistungen.fehlen > 0 && <p className="mt-1 text-[13px] text-bo-warning-text">{T.fehlen(leistungen.fehlen)}</p>}
          {unterlagen.length > 0 && <p className="mt-1 text-[13px] text-bo-text-soft">{T.unterlagen}: {unterlagen.join(" · ")}</p>}
        </div>
        {ausland && <p className="rounded-[16px] bg-bo-warning-soft px-4 py-3 text-[14px] text-bo-warning-text">{T.ausland(ausland)}</p>}
        {fagg && (
          <div className="rounded-[16px] bg-bo-warning-soft px-4 py-3 text-[14px] text-bo-warning-text">
            <p>{T.faggHinweis}</p>
            <label className="mt-2 flex items-center gap-3 font-medium">
              <input type="checkbox" checked={faggOk} onChange={(e) => setFaggOk(e.target.checked)} className="size-5" />
              {T.faggCheck}
            </label>
          </div>
        )}
      </div>
    </Sheet>
  );
}
