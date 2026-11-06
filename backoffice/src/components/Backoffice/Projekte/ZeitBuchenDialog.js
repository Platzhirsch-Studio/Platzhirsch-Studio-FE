"use client";
// Zeit buchen (10-konzept-projekte.md § 5.15): Dauer mit Live-Deutung („= 1 h 30 min“), Tätigkeit, Datum,
// Beschreibung, abrechenbar. Esc verwirft, Strg/⌘+Enter speichert. Servertexte wörtlich am Feld.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "../Overlay";
import Knopf from "../Knopf";
import Datumsfeld from "../Formular/Datumsfeld";
import { useToast } from "../Toast";
import { zeitBuchenAction } from "@/lib/backoffice/projekte/actions";
import { parseDauer } from "@/lib/backoffice/projekte/zeit";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

const T = TEXTE.zeiten;
const TAETIGKEITEN = ["Planung", "Beratung", "Montage", "Fahrt", "Koordination", "Service", "Buero", "Sonstiges"];
const ANZEIGE = { Buero: "Büro" };

export default function ZeitBuchenDialog({ offen, onSchliessen, projekt, projekte = null, montageauftrag = "" }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [p, setP] = useState(projekt || "");
  const [dauer, setDauer] = useState("");
  const [taetigkeit, setTaetigkeit] = useState("Planung");
  const [datum, setDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [beschreibung, setBeschreibung] = useState("");
  const [abrechenbar, setAbrechenbar] = useState(true);
  const [fehler, setFehler] = useState({});
  const [pending, start] = useTransition();
  const d = dauer ? parseDauer(dauer) : null;
  const los = () =>
    start(async () => {
      const r = await zeitBuchenAction({ projekt: p, dauer, datum, taetigkeit, beschreibung, abrechenbar, montageauftrag });
      if (!r?.ok) return setFehler(r?.fehler || { dauer: r?.message });
      zeige(T.gebucht(r.text), { art: "ok" });
      setDauer("");
      setBeschreibung("");
      setFehler({});
      onSchliessen();
      router.refresh();
    });
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={T.buchen} groesse="sm" testid="zeit-buchen"
      fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" laedt={pending} onClick={los} disabled={!d?.ok || !p} kuerzel="Strg+Enter">{T.buchen}</Knopf></>}>
      <form className="flex flex-col gap-4" onSubmit={(e) => (e.preventDefault(), d?.ok && los())} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && d?.ok) { e.preventDefault(); los(); } }}>
        {projekte && (
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">Projekt</span>
            <select className="bo-input mt-1 w-full" value={p} onChange={(e) => setP(e.target.value)} aria-invalid={!!fehler.projekt}>
              <option value="">Projekt wählen …</option>
              {projekte.map((x) => (
                <option key={x.name} value={x.name}>
                  {x.titel}
                </option>
              ))}
            </select>
            {fehler.projekt && <span className="mt-1 block text-[12px] text-bo-danger-text">{fehler.projekt}</span>}
          </label>
        )}
        <label className="block">
          <span className="text-[13px] font-medium text-bo-text-soft">{T.dauer}</span>
          <input autoFocus className="bo-input mt-1 w-full tabular-nums" inputMode="decimal" value={dauer} onChange={(e) => setDauer(e.target.value)} placeholder="1:30" aria-describedby="zeit-hilfe" aria-invalid={!!fehler.dauer || (d && !d.ok)} data-testid="zeit-dauer" />
          <span id="zeit-hilfe" className="mt-1 block text-[12px] text-bo-text-soft" aria-live="polite">
            {fehler.dauer || (d ? (d.ok ? `= ${d.text}` : d.fehler === "zuviel" ? T.zuViel : T.unklar) : T.dauerHilfe)}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">{T.taetigkeit}</span>
            <select className="bo-input mt-1 w-full" value={taetigkeit} onChange={(e) => setTaetigkeit(e.target.value)}>
              {TAETIGKEITEN.map((t) => (
                <option key={t} value={t}>
                  {ANZEIGE[t] || t}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="text-[13px] font-medium text-bo-text-soft" id="zeit-datum">{T.datum}</span>
            <Datumsfeld value={datum} onChange={setDatum} aria-label={T.datum} className="mt-1" />
          </div>
        </div>
        <label className="block">
          <span className="text-[13px] font-medium text-bo-text-soft">{T.beschreibung}</span>
          <input className="bo-input mt-1 w-full" value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)} />
        </label>
        <label className="flex items-center gap-3 text-[15px]">
          <input type="checkbox" checked={abrechenbar} onChange={(e) => setAbrechenbar(e.target.checked)} className="size-5" />
          {T.abrechenbar}
        </label>
      </form>
    </Dialog>
  );
}
