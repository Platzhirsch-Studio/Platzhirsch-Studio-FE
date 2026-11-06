"use client";
// Stopps der Tour-Akte (§ 4.7, E5): Reihenfolge per ↑/↓ (Tipp-Weg, 44 px) und Alt+↑/↓, sofort gespeichert mit
// Rückgängig; „Nach PLZ sortieren“; Stopp-Status setzen (Fahrer/Disposition); Ankunft/Abfahrt nur mit Schalter.

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";
import Knopf from "../Knopf";
import { Menue, MenuePunkt } from "../Overlay/Popover";
import { useToast } from "../Toast";
import { DIALOG, LEER, TOUR as T } from "@/lib/backoffice/logistik/texte";
import { StatusPille } from "./ui";

const S16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
const zeit = (z) => (z ? String(z).slice(0, 5) : "");

export default function StoppListe({ tour, stopps: start, bearbeitbar, mobil, reihenfolge, ausTour, stoppStatus, zeitstempel = false, ohneTour = 0 }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [stopps, setStopps] = useState(start);
  const [, los] = useTransition();

  const verschiebe = (i, d) =>
    los(async () => {
      const j = i + d;
      if (j < 0 || j >= stopps.length) return;
      const vorher = stopps.map((s) => s.name);
      const neu = [...stopps];
      [neu[i], neu[j]] = [neu[j], neu[i]];
      setStopps(neu);
      const r = await reihenfolge({ tour, reihenfolge: neu.map((s) => s.name) });
      if (!r.ok) {
        setStopps(start);
        return zeige(r.message, { art: "fehler" });
      }
      zeige(`Stopp ${i + 1} an Position ${j + 1}`, { art: "ok", aktion: { titel: DIALOG.rueckgaengig, onClick: async () => { await reihenfolge({ tour, reihenfolge: vorher }); router.refresh(); } } });
      router.refresh();
    });

  const plz = () =>
    los(async () => {
      const r = await reihenfolge({ tour, plz: true });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      zeige("Nach PLZ sortiert", { art: "ok", aktion: { titel: DIALOG.rueckgaengig, onClick: async () => { await reihenfolge({ tour, reihenfolge: r.vorher }); router.refresh(); } } });
      router.refresh();
    });

  const status = (s, neu) =>
    los(async () => {
      const r = await stoppStatus({ tour, stopp: s.name, status: neu, alternative: neu === "erledigt" ? "Name bestätigt" : null, unterschriftName: s.kunde_name, notiz: neu === "erledigt" ? "In der Akte bestätigt" : "" });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      zeige(`Stopp ${s.reihenfolge}: ${neu}`, { art: "ok" });
      router.refresh();
    });

  if (!stopps.length) return <p className="bo-log-cap">{LEER.stopps(ohneTour)}</p>;
  return (
    <div className="flex flex-col gap-3">
      {bearbeitbar ? (
        <div className="flex flex-wrap gap-2">
          <Knopf size="s" icon="ArrowUpDown" onClick={plz}>{T.plzSortieren}</Knopf>
          <Knopf size="s" icon="Plus" href={`/logistik/touren?ansicht=plantafel`}>{T.stoppsHinzu}</Knopf>
        </div>
      ) : null}
      <ol className="flex flex-col gap-2" data-testid="stopps" onKeyDown={(e) => {
        if (!bearbeitbar || !e.altKey || !["ArrowUp", "ArrowDown"].includes(e.key)) return;
        const i = Number(e.target.closest("[data-index]")?.dataset.index);
        if (Number.isInteger(i)) { e.preventDefault(); verschiebe(i, e.key === "ArrowUp" ? -1 : 1); }
      }}>
        {stopps.map((s, i) => (
          <li key={s.name} className="bo-log-stopp" data-status={s.status} data-index={i} data-testid="stopp">
            <span className="bo-log-stopp__nr">{i + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold">{s.art} · {s.kunde_name || "–"}</span>
              <span className="block text-[13px] text-bo-text-soft">
                {[s.zeitfenster_von ? `${zeit(s.zeitfenster_von)}–${zeit(s.zeitfenster_bis)}` : null, s.eta ? `ETA ${zeit(s.eta)}` : null, [s.plz, s.ort].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
                {zeitstempel && s.ankunft ? ` · Ankunft ${String(s.ankunft).slice(11, 16)}` : ""}
              </span>
              {Number(s.zeitfenster_konflikt) ? <span className="flex items-center gap-1 text-[12px] font-semibold text-bo-eiche-text"><AlertTriangle {...S16} />Zeitfenster</span> : null}
              {s.lieferschein ? <Link className="bo-log-mono underline" href={`/logistik/lieferscheine/${encodeURIComponent(s.lieferschein)}`}>{s.lieferschein}</Link> : s.montage_referenz ? <span className="bo-log-mono">{s.montage_referenz}</span> : null}
              {s.notiz ? <span className="block text-[13px] text-bo-text-soft">{s.notiz}</span> : null}
            </span>
            <span className="bo-log-stopp__werkzeuge">
              <StatusPille doctype="PH Tour Stopp" status={s.status} />
              {s.telefon ? <Knopf size="s" variant="ghost" icon="Phone" href={`tel:${s.telefon.replace(/\s/g, "")}`} label={`Anrufen ${s.kunde_name}`} /> : null}
              {bearbeitbar ? (
                <>
                  <button type="button" className="bo-log-rund48" onClick={() => verschiebe(i, -1)} disabled={i === 0} aria-label={`Stopp ${i + 1} nach oben`}><ArrowUp {...S16} /></button>
                  <button type="button" className="bo-log-rund48" onClick={() => verschiebe(i, 1)} disabled={i === stopps.length - 1} aria-label={`Stopp ${i + 1} nach unten`}><ArrowDown {...S16} /></button>
                </>
              ) : null}
              {(mobil || bearbeitbar) && ["offen", "unterwegs"].includes(s.status) ? (
                <Menue label={`Stopp ${i + 1}`} ausloeser={(p) => <Knopf {...p} size="s" icon="Ellipsis" label={`Aktionen Stopp ${i + 1}`} />}>
                  {mobil && s.status === "offen" ? <MenuePunkt icon="MapPin" onWaehlen={() => status(s, "unterwegs")}>Angekommen</MenuePunkt> : null}
                  {mobil ? <MenuePunkt icon="CircleCheck" onWaehlen={() => status(s, "erledigt")}>Abgeliefert (Name bestätigt)</MenuePunkt> : null}
                  {mobil ? <MenuePunkt icon="X" onWaehlen={() => status(s, "nicht angetroffen")}>Nicht angetroffen</MenuePunkt> : null}
                  {mobil ? <MenuePunkt icon="Clock" onWaehlen={() => status(s, "verschoben")}>Verschoben</MenuePunkt> : null}
                  {bearbeitbar && s.lieferschein ? <MenuePunkt icon="Undo2" onWaehlen={() => los(async () => { const r = await ausTour({ tour, stopp: s.name }); if (!r.ok) return zeige(r.message, { art: "fehler" }); zeige("Aus der Tour entfernt", { art: "ok" }); router.refresh(); })}>Aus Tour entfernen</MenuePunkt> : null}
                </Menue>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="bo-log-cap">{T.fahrzeiten}</p>
    </div>
  );
}

