"use client";
// Prüfung einer Warenrücknahme (§ 4.9): je Position Zustand und Entscheidung Pflicht, Platz bei Einlagerung Pflicht;
// „Prüfung buchen“ bucht idempotent (ruecknahme_logik.buchungen) und setzt den Status „Geprüft“.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { useToast } from "../Toast";
import { RUECKNAHME as T } from "@/lib/backoffice/logistik/texte";

const ZUSTAND = [{ wert: "Neuwertig", titel: "Neuwertig" }, { wert: "B-Ware", titel: "B-Ware" }, { wert: "Defekt", titel: "Defekt" }];
const ENTSCHEIDUNG = [{ wert: "Wiedereinlagern", titel: "Einlagern" }, { wert: "B-Ware", titel: "B-Ware" }, { wert: "Ausbuchen", titel: "Ausbuchen" }, { wert: "An Lieferant", titel: "An Lieferant" }];

export default function Pruefung({ name, positionen = [], buchen, bearbeitbar }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pos, setPos] = useState(positionen.map((p) => ({ zustand: p.zustand || "", entscheidung: p.entscheidung || "", platz: p.platz || "", produkt_name: p.produkt_name, menge: p.menge })));
  const [laeuft, start] = useTransition();
  const fehlt = pos.some((p) => !p.zustand || !p.entscheidung || (p.entscheidung === "Wiedereinlagern" && !p.platz));
  const setze = (i, w) => setPos((alt) => alt.map((p, k) => (k === i ? { ...p, ...w } : p)));
  return (
    <div className="flex flex-col gap-4" data-testid="pruefung">
      {pos.map((p, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-[20px] bg-bo-surface-2 p-4">
          <p className="text-[15px] font-semibold">{p.menge} × {p.produkt_name}</p>
          <Segment label={`Zustand Position ${i + 1}`} wert={p.zustand} onWechsel={(w) => setze(i, { zustand: w })} optionen={ZUSTAND.map((o) => ({ ...o, deaktiviert: !bearbeitbar }))} />
          <Segment label={`Entscheidung Position ${i + 1}`} wert={p.entscheidung} onWechsel={(w) => setze(i, { entscheidung: w })} optionen={ENTSCHEIDUNG.map((o) => ({ ...o, deaktiviert: !bearbeitbar }))} />
          {p.entscheidung === "Wiedereinlagern" ? (
            <label className="flex flex-col gap-1">
              <span className="bo-log-cap">Platz *</span>
              <input className="h-12 rounded-[14px] bg-bo-surface px-4 outline-none focus-visible:shadow-(--bo-sh-focus)" value={p.platz} onChange={(e) => setze(i, { platz: e.target.value })} disabled={!bearbeitbar} />
            </label>
          ) : null}
        </div>
      ))}
      {bearbeitbar ? (
        <div className="flex justify-end">
          <Knopf variant="primary" icon="CircleCheck" laedt={laeuft} disabled={fehlt} grund={fehlt ? T.pflicht : undefined} onClick={() => start(async () => { const r = await buchen({ name, methode: "pruefung_buchen", args: { positionen: pos } }); if (!r.ok) return zeige(r.message, { art: "fehler" }); zeige("Prüfung gebucht", { art: "ok" }); router.refresh(); })} data-testid="pruefung-buchen">{T.primaer.pruefung}</Knopf>
        </div>
      ) : null}
    </div>
  );
}
