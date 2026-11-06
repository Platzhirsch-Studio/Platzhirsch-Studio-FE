"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "@/components/Backoffice/Knopf";
import Bestaetigen from "@/components/Backoffice/Bestaetigen";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Leer from "@/components/Backoffice/Leer";
import { useToast } from "@/components/Backoffice/Toast";
import { geraetSperrenAction } from "@/lib/backoffice/actions";
import { relativ } from "@/lib/backoffice/format";

/**
 * Geräteliste (ph_core list_devices) mit Sperren/Entsperren. Telefon: Karten, ab 768 px Tabelle.
 * @param {{geraete:Array<{geraet:string, geraetename:string, typ:string, arbeitsplatz:string, standort?:string, aktiv:number, gesperrt_grund?:string, zuletzt_gesehen?:string}>, typen:Array<{slug,titel,phTyp}>}} props
 */
export default function GeraeteTabelle({ geraete, typen }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pending, start] = useTransition();
  const [frage, setFrage] = useState(null);
  const typ = (t) => typen.find((x) => x.slug === t || x.phTyp === t)?.titel || t || "–";

  const umschalten = (g) => {
    const sperren = !!g.aktiv;
    const run = () =>
      start(async () => {
        const r = await geraetSperrenAction({ geraet: g.geraet, sperren, grund: "Gesperrt über das Backoffice" });
        setFrage(null);
        if (!r.ok) return zeige(r.message, { art: "fehler" });
        zeige(`${g.geraetename}: ${r.message}`, { art: "ok" });
        router.refresh();
      });
    if (sperren) setFrage({ titel: "Gerät sperren", text: `„${g.geraetename}“ kann sich danach nicht mehr am Kiosk anmelden, bis es entsperrt wird.`, run });
    else run();
  };

  if (!geraete.length) return <Leer titel="Noch keine Geräte registriert" icon="Monitor" />;

  const aktion = (g) => (
    <Knopf size="s" variant={g.aktiv ? "danger" : "secondary"} disabled={pending} onClick={() => umschalten(g)}>
      {g.aktiv ? "Sperren" : "Entsperren"}
    </Knopf>
  );

  return (
    <div className="min-w-0 rounded-[10px] border border-bo-line bg-bo-surface">
      <ul className="divide-y divide-bo-line md:hidden">
        {geraete.map((g) => (
          <li key={g.geraet} className="flex min-w-0 items-center gap-3 px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{g.geraetename}</span>
                <StatusBadge wert={g.aktiv ? "Aktiv" : "Gesperrt"} ton={g.aktiv ? "gruen" : "rot"} />
              </p>
              <p className="mt-0.5 truncate text-xs text-bo-text-soft">
                {typ(g.typ)} · {g.standort || "–"} · {g.zuletzt_gesehen ? relativ(g.zuletzt_gesehen) : "nie gesehen"}
              </p>
            </div>
            {aktion(g)}
          </li>
        ))}
      </ul>
      <div className="bo-scroll-x hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead className="border-b border-bo-line-strong bg-bo-surface-2 text-left text-xs text-bo-text-soft">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Gerät</th>
              <th scope="col" className="px-3 py-2 font-medium">Typ</th>
              <th scope="col" className="px-3 py-2 font-medium">Standort</th>
              <th scope="col" className="px-3 py-2 font-medium">Zuletzt gesehen</th>
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <th scope="col" className="w-28 px-3 py-2 text-right font-medium">
                <span className="sr-only">Aktion</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {geraete.map((g) => (
              <tr key={g.geraet} className="border-t border-bo-line first:border-t-0 hover:bg-bo-surface-2">
                <td className="px-3 py-2">
                  <span className="block font-medium">{g.geraetename}</span>
                  <span className="block whitespace-nowrap font-mono text-[11px] text-bo-text-faint">{g.geraet}</span>
                </td>
                <td className="px-3 py-2">{typ(g.typ)}</td>
                <td className="px-3 py-2">{g.standort || "–"}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-bo-text-soft">{g.zuletzt_gesehen ? relativ(g.zuletzt_gesehen) : "–"}</td>
                <td className="px-3 py-2">
                  <StatusBadge wert={g.aktiv ? "Aktiv" : "Gesperrt"} ton={g.aktiv ? "gruen" : "rot"} />
                  {!g.aktiv && g.gesperrt_grund && <span className="mt-0.5 block text-xs text-bo-text-soft">{g.gesperrt_grund}</span>}
                </td>
                <td className="px-3 py-2 text-right">{aktion(g)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Bestaetigen offen={!!frage} titel={frage?.titel || ""} text={frage?.text} bestaetigen="Sperren" gefaehrlich laeuft={pending} onBestaetigen={() => frage?.run()} onAbbrechen={() => setFrage(null)} />
    </div>
  );
}
