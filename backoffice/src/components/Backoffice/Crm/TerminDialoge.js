"use client";
// Assistent A1 „Termin anlegen“ (§ 5.5, ein Bildschirm) und „Verschieben“ (§ 3.6): Wochenraster freier Zeiten
// (get_freie_slots), Slot-Chips ≥ 44 px, Pfeiltasten im Raster, Strg/⌘+Enter legt an. Der Slot wird serverseitig
// unmittelbar vor dem Anlegen erneut geprüft; belegt → Feldfehler mit nächster freier Zeit.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "../Overlay/Dialog";
import Knopf, { RundKnopf } from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import { Feld } from "./Teile";
import { useCrmAktion } from "./useCrmAktion";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { slotsAction, terminAnlegenAction, terminVerschiebenAction, kontaktSuchenAction } from "@/lib/backoffice/crm/actions";

const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const p2 = (n) => String(n).padStart(2, "0");
const isoTag = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

function montag(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const t = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - t);
  return x;
}
function kw(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const tag = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - tag);
  const jahr = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - jahr) / 86400000 + 1) / 7);
}
const wann = (s) => {
  const d = new Date(String(s).replace(" ", "T"));
  return `${TAGE[d.getDay()]} ${p2(d.getDate())}.${p2(d.getMonth() + 1)}. ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

/** Wochenraster freier Zeiten. */
export function SlotRaster({ slots, wahl, onWahl, wocheStart, laedt, fehlerStart }) {
  const tage = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(wocheStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const jeTag = tage.map((d) => ({ d, slots: slots.filter((s) => String(s.start).slice(0, 10) === isoTag(d)) }));
  const tasten = (e) => {
    const knoepfe = [...e.currentTarget.querySelectorAll("button[data-slot]")];
    const i = knoepfe.indexOf(document.activeElement);
    if (i < 0) return;
    const ziel = { ArrowDown: i + 1, ArrowUp: i - 1, ArrowRight: i + 1, ArrowLeft: i - 1 }[e.key];
    if (ziel != null && knoepfe[ziel]) {
      e.preventDefault();
      knoepfe[ziel].focus();
    }
  };
  return (
    <div className="bo-crm-slots" role="group" aria-label={T.a1.wann} aria-busy={laedt || undefined} onKeyDown={tasten} data-testid="crm-slots">
      {jeTag.map(({ d, slots: s }) => (
        <div key={isoTag(d)} className="bo-crm-slottag">
          <p className="bo-crm-slottag__kopf">{TAGE[d.getDay()]} {d.getDate()}.</p>
          {s.length === 0 && <p className="text-center text-[12px] text-bo-text-faint">–</p>}
          {s.map((x) => {
            const zeit = String(x.start).slice(11, 16);
            const gewaehlt = wahl === x.start;
            const belegt = fehlerStart === x.start;
            return (
              <button key={x.start} type="button" data-slot="" className="bo-crm-slot bo-druck" aria-pressed={gewaehlt} aria-label={`${wann(x.start)}${belegt ? " – gerade vergeben" : ""}`} disabled={belegt} style={belegt ? { textDecoration: "line-through", opacity: 0.5 } : undefined} onClick={() => onWahl(x.start)}>
                {zeit}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function useWoche(start) {
  const [woche, setWoche] = useState(() => montag(start ? new Date(String(start).replace(" ", "T")) : new Date()));
  const blaettern = (n) => setWoche((w) => {
    const x = new Date(w);
    x.setDate(x.getDate() + 7 * n);
    return x;
  });
  return { woche, blaettern };
}

function useSlots({ offen, woche, berater, modus, terminart, ausser }) {
  const [slots, setSlots] = useState([]);
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  const laden = useCallback(async () => {
    setLaedt(true);
    setFehler("");
    const bis = new Date(woche);
    bis.setDate(bis.getDate() + 5);
    const r = await slotsAction({ von: isoTag(woche), bis: isoTag(bis), berater, modus, terminart, ausser }).catch(() => ({ ok: false }));
    const jetzt = Date.now();
    setSlots(r?.ok ? r.slots.filter((s) => new Date(String(s.start).replace(" ", "T")).getTime() > jetzt) : []);
    if (!r?.ok) setFehler(r?.message || T.fehler.unavailable);
    setLaedt(false);
  }, [woche, berater, modus, terminart, ausser]);
  useEffect(() => {
    if (!offen) return;
    const t = setTimeout(laden, 0);
    return () => clearTimeout(t);
  }, [offen, laden]);
  return { slots, laedt, fehler, laden };
}

/**
 * A1 Termin anlegen.
 * @param {{offen:boolean, onSchliessen:()=>void, anfrage?:{name:string, titel?:string, email?:string, modus?:string, zugewiesen_an?:string, thema?:string, wunschzeiten?:string},
 *   kontakt?:{name:string, titel:string, email?:string}, berater?:Array<{wert:string,titel:string}>, ich?:string, terminarten?:Array<{name:string, titel?:string}>}} p
 */
export function TerminAnlegenDialog({ offen, onSchliessen, anfrage, kontakt: kontaktStart, berater = [], ich, terminarten = [] }) {
  const router = useRouter();
  const { fuehre, laeuft } = useCrmAktion();
  const [kontakt, setKontakt] = useState(kontaktStart || null);
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState([]);
  const [modus, setModus] = useState(anfrage?.modus && T.modus[anfrage.modus] ? anfrage.modus : "Showroom");
  const [wer, setWer] = useState(anfrage?.zugewiesen_an || "");
  const [thema, setThema] = useState(anfrage?.thema || "");
  const [wahl, setWahl] = useState("");
  const [belegt, setBelegt] = useState("");
  const [hinweis, setHinweis] = useState("");
  const email = anfrage?.email || kontakt?.email || "";
  const [mail, setMail] = useState(!!email);
  const { woche, blaettern } = useWoche();
  const { slots, laedt, fehler } = useSlots({ offen, woche, berater: wer, modus });
  const mitKunde = !!anfrage || !!kontakt;

  useEffect(() => {
    if (!suche.trim() || mitKunde) return;
    const t = setTimeout(async () => {
      const r = await kontaktSuchenAction({ q: suche });
      setTreffer(r?.ok ? r.treffer : []);
    }, 250);
    return () => clearTimeout(t);
  }, [suche, mitKunde]);

  const anlegen = async () => {
    if (!mitKunde) return setHinweis(T.a1.keinKunde);
    if (!wahl) return setHinweis("Bitte eine Zeit wählen.");
    const r = await fuehre(() => terminAnlegenAction({ anfrage: anfrage?.name, kontakt: kontakt?.name, start: wahl, modus, berater: wer || undefined, thema, mail, terminart: terminarten[0]?.name }), {
      text: T.toast.terminAngelegt(anfrage?.titel || kontakt?.titel || "", wann(wahl)),
      fehlerText: T.a1.titel,
    });
    if (r?.code === "conflict") {
      setBelegt(wahl);
      setHinweis(r.naechste ? T.a1.vergeben(wann(r.naechste)) : T.fehler.slot);
      return;
    }
    if (r?.ok) {
      onSchliessen();
      if (r.name) router.push(`/crm/termine/${encodeURIComponent(r.name)}`);
    }
  };

  const zusammenfassung = wahl ? T.a1.zusammenfassung(wann(wahl), T.modus[modus], berater.find((b) => b.wert === wer)?.titel || T.a1.egal) : "";
  const wocheBis = new Date(woche);
  wocheBis.setDate(wocheBis.getDate() + 5);

  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.a1.titel} groesse="lg" testid="crm-a1"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>{T.knopf.abbrechen}</Knopf>
          <Knopf variant="primary" onClick={anlegen} laedt={laeuft} disabled={!wahl || !mitKunde} kuerzel="Strg+Enter" data-testid="crm-a1-anlegen">{T.knopf.termin}</Knopf>
        </>
      }>
      <div className="grid gap-5" onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && anlegen()}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mitKunde ? (
            <div className="bo-crm-feld"><span>{T.a1.kunde}</span><p className="flex min-h-11 items-center rounded-[14px] bg-bo-surface-2 px-3.5 text-[15px] font-medium">{anfrage?.titel || kontakt?.titel}</p></div>
          ) : (
            <Feld label={T.a1.kunde} eingelassen hinweis={hinweis === T.a1.keinKunde ? undefined : "Name, E-Mail oder Nummer"} fehler={hinweis === T.a1.keinKunde ? hinweis : undefined}>
              <input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Kunde suchen" data-testid="crm-a1-suche" />
            </Feld>
          )}
          <Feld label={T.a1.thema} eingelassen><input value={thema} onChange={(e) => setThema(e.target.value)} placeholder="z. B. Küche" /></Feld>
        </div>
        {!mitKunde && treffer.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {treffer.slice(0, 6).map((t) => <button key={t.name} type="button" className="bo-crm-chip" onClick={() => (setKontakt({ name: t.name, titel: t.titel }), setHinweis(""))}>{t.titel}</button>)}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bo-crm-feld"><span>{T.a1.art}</span><Segment label={T.a1.art} wert={modus} onWechsel={(v) => (setModus(v), setWahl(""))} optionen={Object.keys(T.modus).map((m) => ({ wert: m, titel: T.modus[m] }))} groesse="s" breit /></div>
          <div className="bo-crm-feld"><span>{T.a1.berater}</span><Segment label={T.a1.berater} wert={wer} onWechsel={(v) => (setWer(v), setWahl(""))} optionen={[{ wert: "", titel: T.a1.egal }, ...berater.slice(0, 3).map((b) => ({ wert: b.wert, titel: b.titel.split(" ")[0] }))]} groesse="s" breit /></div>
        </div>
        <div className="grid gap-3 rounded-[20px] bg-bo-surface-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <RundKnopf icon="ChevronLeft" label="Vorige Woche" groesse="s" onClick={() => blaettern(-1)} />
            <p className="text-[15px] font-semibold tabular-nums">{T.termine.woche(kw(woche), `${woche.getDate()}.${woche.getMonth() + 1}.`, `${wocheBis.getDate()}.${wocheBis.getMonth() + 1}.`)}</p>
            <RundKnopf icon="ChevronRight" label={T.a1.naechsteWoche} groesse="s" onClick={() => blaettern(1)} />
          </div>
          {fehler ? <p className="text-[14px] text-bo-danger-text" role="alert">{fehler}</p> : !laedt && slots.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3 text-[14px] text-bo-text-soft"><span>{T.a1.keineFreien(kw(woche))}</span><Knopf size="s" variant="secondary" onClick={() => blaettern(1)}>{T.a1.naechsteWoche}</Knopf></div>
          ) : (
            <SlotRaster slots={slots} wahl={wahl} onWahl={(s) => (setWahl(s), setHinweis(""), setBelegt(""))} wocheStart={woche} laedt={laedt} fehlerStart={belegt} />
          )}
          {anfrage?.wunschzeiten && <p className="text-[13px] text-bo-text-soft">Wunschzeiten: „{anfrage.wunschzeiten}“ (aus der Anfrage)</p>}
        </div>
        {hinweis && hinweis !== T.a1.keinKunde && <p className="text-[14px] text-bo-danger-text" role="alert">{hinweis}</p>}
        {zusammenfassung && (
          <p className="text-[15px] font-medium" role="status">{zusammenfassung}{anfrage ? ` · ${T.a1.anfrageWird}` : ""}</p>
        )}
        {email && <Schalter label={T.a1.mail(email.replace(/^(.).*@/, "$1***@"))} an={mail} onWechsel={setMail} />}
      </div>
    </Dialog>
  );
}

/** Verschieben eines Termins: freie Zeiten (ohne den Termin selbst), Dauer bleibt. */
export function VerschiebenDialog({ offen, onSchliessen, termin, berater = [] }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [wer, setWer] = useState(termin?.berater || "");
  const [wahl, setWahl] = useState("");
  const { woche, blaettern } = useWoche(termin?.start);
  const { slots, laedt, fehler } = useSlots({ offen, woche, berater: wer, modus: termin?.modus, ausser: termin?.name });
  const wocheBis = useMemo(() => {
    const x = new Date(woche);
    x.setDate(x.getDate() + 5);
    return x;
  }, [woche]);
  const verschieben = async () => {
    if (!wahl) return;
    const r = await fuehre(() => terminVerschiebenAction({ name: termin.name, start: wahl, berater: wer }), { text: T.toast.verschoben(wann(wahl)), fehlerText: T.knopf.verschieben, objekt: { doctype: "PH Termin", name: termin.name } });
    if (r?.ok) onSchliessen();
  };
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.termine.verschiebenTitel} text={T.termine.dauerLesend(termin?.dauer_min || 60)} groesse="lg" testid="crm-verschieben"
      fuss={<><Knopf variant="ghost" onClick={onSchliessen}>{T.knopf.abbrechen}</Knopf><Knopf variant="primary" onClick={verschieben} laedt={laeuft} disabled={!wahl} data-testid="crm-verschieben-senden">{T.knopf.verschieben}</Knopf></>}>
      <div className="grid gap-4">
        <div className="bo-crm-feld"><span>{T.a1.berater}</span><Segment label={T.a1.berater} wert={wer} onWechsel={(v) => (setWer(v), setWahl(""))} optionen={berater.slice(0, 4).map((b) => ({ wert: b.wert, titel: b.titel.split(" ")[0] }))} groesse="s" /></div>
        <div className="grid gap-3 rounded-[20px] bg-bo-surface-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <RundKnopf icon="ChevronLeft" label="Vorige Woche" groesse="s" onClick={() => blaettern(-1)} />
            <p className="text-[15px] font-semibold tabular-nums">{T.termine.woche(kw(woche), `${woche.getDate()}.${woche.getMonth() + 1}.`, `${wocheBis.getDate()}.${wocheBis.getMonth() + 1}.`)}</p>
            <RundKnopf icon="ChevronRight" label={T.a1.naechsteWoche} groesse="s" onClick={() => blaettern(1)} />
          </div>
          {fehler ? <p className="text-[14px] text-bo-danger-text" role="alert">{fehler}</p> : <SlotRaster slots={slots} wahl={wahl} onWahl={setWahl} wocheStart={woche} laedt={laedt} />}
        </div>
        {wahl && <p className="text-[15px] font-medium" role="status">{wann(wahl)}</p>}
      </div>
    </Dialog>
  );
}
