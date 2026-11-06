"use client";
// „Jetzt dran“ (10-konzept-service §2.1): offene Fälle nach Server-Rang, je Zeile genau ein Knopf (secondary s).
// Ein-Klick-Aktionen (Eingangsbestätigung) laufen ohne Seitenwechsel mit „Rückgängig“; Telefonat als kleiner
// Dialog; alles andere öffnet die Akte mit dem passenden Assistenten (?aktion=…).
import Link from "next/link";
import { useState } from "react";
import Knopf from "../Knopf";
import { Dialog } from "../Overlay";
import { Icon } from "../icons";
import { Bild, Gewaehrleistung, Schritt, Signal } from "./Teile";
import { useAktion } from "./useAktion";
import { eingangAction, telefonatAction } from "@/lib/backoffice/service/actions";
import { ERSTREAKTION_KANAELE } from "@/lib/backoffice/service/labels";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

/** Dialog „Telefonat erfassen“ (Segment Kanal + Notiz 1 Zeile). */
export function TelefonatDialog({ offen, onSchliessen, name, kunde }) {
  const { ausfuehren, laeuft } = useAktion();
  const [kanal, setKanal] = useState("Telefon");
  const [notiz, setNotiz] = useState("");
  const senden = () => ausfuehren(telefonatAction, { name, kanal, notiz }, { ok: `${T.dialog.telefonat.ok} · ${kunde || name}`, onOk: onSchliessen });
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={T.dialog.telefonat.titel}
      text={kunde}
      groesse="sm"
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            {T.aktionen.abbrechen}
          </Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={senden} kuerzel="Strg+Enter" data-testid="telefonat-ok">
            {T.dialog.telefonat.ok}
          </Knopf>
        </>
      }
    >
      <div
        className="grid gap-4"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") senden();
        }}
      >
        <div className="bo-svc-chips" role="radiogroup" aria-label={T.dialog.telefonat.kanal}>
          {ERSTREAKTION_KANAELE.map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kanal === k} className="bo-svc-wahl" onClick={() => setKanal(k)}>
              {k}
            </button>
          ))}
        </div>
        <label className="bo-svc-feld">
          <span>{T.dialog.telefonat.notiz}</span>
          <input value={notiz} maxLength={140} onChange={(e) => setNotiz(e.target.value)} />
        </label>
      </div>
    </Dialog>
  );
}

const AKTE_AKTION = { pruefen: "pruefen", entscheiden: "pruefen", "ersatzteile-bestellen": "bestellen", "erledigt-melden": "erledigt", "forderung-stellen": "forderung", "abschluss-mitteilen": "informieren", schliessen: "schliessen", "kulanz-freigeben": "kulanz" };

/**
 * @param {{zeilen:Array<{name:string, titel:string, unter:string, bild:string|null, knopf:object, ton:string, gwl:object, signal:object|null, kunde:string}>, mehr?:{text:string, href:string}}} p
 */
export default function JetztDran({ zeilen = [], mehr }) {
  const { ausfuehren } = useAktion();
  const [telefonat, setTelefonat] = useState(null);
  const [laufend, setLaufend] = useState(null);
  const eingang = async (z) => {
    setLaufend(z.name);
    await ausfuehren(eingangAction, { names: [z.name] }, { ok: T.dialog.eingang.gesendet(z.email || z.kunde), fehlerText: `Eingangsbestätigung ${z.name}` });
    setLaufend(null);
  };
  return (
    <>
      <ul className="bo-svc-zeilen" data-testid="jetzt-dran">
        {zeilen.map((z) => (
          <li key={z.name} className="bo-svc-zeile" data-markiert={z.signal ? "gefahr" : undefined}>
            <Bild src={z.bild} />
            <span className="min-w-0">
              <Link href={`/service/faelle/${encodeURIComponent(z.name)}`} className="bo-svc-zeile__link">
                <span className="bo-svc-zeile__titel truncate">{z.titel}</span>
              </Link>
              <span className="bo-svc-zeile__unter">{z.unter}</span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Schritt titel={z.knopf.art === "blocker" ? z.knopf.titel : z.schrittText} faellig={z.knopf.faellig} ton={z.ton} />
              </span>
            </span>
            <span className="bo-svc-zeile__rechts flex-col items-end sm:flex-row sm:items-center">
              {z.signal ? <Signal signal={z.signal} /> : <Gewaehrleistung g={z.gwl} />}
              {z.knopf.art === "primaer" && z.knopf.id === "eingang-senden" && (
                <Knopf size="s" variant="secondary" laedt={laufend === z.name} onClick={() => eingang(z)} data-testid="zeile-eingang">
                  {z.knopf.titel}
                </Knopf>
              )}
              {z.knopf.art === "primaer" && z.knopf.id === "telefonat" && (
                <Knopf size="s" variant="secondary" icon="Phone" onClick={() => setTelefonat(z)}>
                  {z.knopf.titel}
                </Knopf>
              )}
              {z.knopf.art === "primaer" && z.knopf.id === "einsatz-planen" && (
                <Knopf size="s" variant="secondary" href={`/service/einsaetze/neu?fall=${encodeURIComponent(z.name)}`}>
                  {z.knopf.titel}
                </Knopf>
              )}
              {z.knopf.art === "primaer" && AKTE_AKTION[z.knopf.id] && (
                <Knopf size="s" variant="secondary" href={`/service/faelle/${encodeURIComponent(z.name)}?aktion=${AKTE_AKTION[z.knopf.id]}`}>
                  {z.knopf.titel}
                </Knopf>
              )}
              {z.knopf.art === "blocker" && (
                <span className="inline-flex items-center gap-1 text-[13px] text-bo-text-soft">
                  <Icon name="Hourglass" className="size-3.5" />
                  wartet
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {mehr && (
        <div className="mt-3 px-3">
          <Link href={mehr.href} className="inline-flex items-center gap-1 rounded-md text-[14px] font-medium text-bo-text hover:underline">
            {mehr.text}
            <Icon name="ArrowRight" className="size-4" />
          </Link>
        </div>
      )}
      {telefonat && <TelefonatDialog offen onSchliessen={() => setTelefonat(null)} name={telefonat.name} kunde={telefonat.kunde} />}
    </>
  );
}
