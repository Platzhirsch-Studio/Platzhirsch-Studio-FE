"use client";
// Ersatzteile und Bestellungen (10-konzept-service §2.6, §2.7): Bewegung buchen (Dialog md), Bestellung senden,
// AB erhalten, Wareneingang (S6), Stornieren (nur bis Bestätigt, Grund Pflicht).
import { useState } from "react";
import Knopf from "../Knopf";
import Bestaetigen from "../Bestaetigen";
import Datumsfeld from "../Formular/Datumsfeld";
import { Dialog, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import { useAktion } from "./useAktion";
import { bestellungAction, bewegungAction } from "@/lib/backoffice/service/actions";
import { BEWEGUNGSARTEN } from "@/lib/backoffice/service/labels";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

/** Knopf + Dialog „Bewegung buchen“. teile: [{name, titel, bestand}] (Auswahl) oder ein festes Teil. */
export function BewegungKnopf({ teile = [], teil = null, primaer = false, gesperrt = false, grund }) {
  const { ausfuehren, laeuft } = useAktion();
  const [offen, setOffen] = useState(false);
  const [w, setW] = useState({ teil: teil?.name || teile[0]?.name || "", art: "Zugang", menge: 1, hinweis: "" });
  const [fehler, setFehler] = useState({});
  const aktuell = teil || teile.find((t) => t.name === w.teil);
  return (
    <>
      <Knopf variant={primaer ? "primary" : "secondary"} icon="ArrowUpDown" onClick={() => setOffen(true)} disabled={gesperrt} grund={gesperrt ? grund : undefined} data-testid="bewegung-knopf">
        {T.ersatzteile.bewegung}
      </Knopf>
      {offen && (
        <Dialog
          offen
          onSchliessen={() => setOffen(false)}
          titel={T.ersatzteile.bewegungTitel}
          text={aktuell ? `${aktuell.titel} · Bestand ${aktuell.bestand}` : undefined}
          groesse="md"
          testid="dialog-bewegung"
          fuss={
            <>
              <Knopf variant="secondary" onClick={() => setOffen(false)}>
                {T.aktionen.abbrechen}
              </Knopf>
              <Knopf variant="primary" laedt={laeuft} onClick={() => ausfuehren(bewegungAction, { ...w, teil: teil?.name || w.teil }, { ok: T.ersatzteile.gebucht, onOk: () => setOffen(false), onFehler: (r) => r.fehler && setFehler(r.fehler) })} data-testid="bewegung-ok">
                Buchen
              </Knopf>
            </>
          }
        >
          <div className="grid gap-4">
            {!teil && (
              <label className="bo-svc-feld">
                <span>Ersatzteil</span>
                <select value={w.teil} onChange={(x) => setW({ ...w, teil: x.target.value })}>
                  {teile.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.titel}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid gap-2">
              <span className="bo-svc-label">{T.ersatzteile.art}</span>
              <div className="bo-svc-chips" role="radiogroup" aria-label={T.ersatzteile.art}>
                {BEWEGUNGSARTEN.map((a) => (
                  <button key={a} type="button" role="radio" aria-checked={w.art === a} className="bo-svc-wahl" onClick={() => setW({ ...w, art: a })}>
                    {a === "Inventur" ? "Inventur (Zählwert)" : a}
                  </button>
                ))}
              </div>
            </div>
            <label className="bo-svc-feld" data-fehler={fehler.menge ? "" : undefined}>
              <span>{T.ersatzteile.menge}</span>
              <input type="number" min={0} value={w.menge} onChange={(x) => setW({ ...w, menge: Number(x.target.value) })} />
              {fehler.menge && <span className="bo-svc-fehler">{fehler.menge}</span>}
            </label>
            <label className="bo-svc-feld">
              <span>{T.ersatzteile.hinweis}</span>
              <input value={w.hinweis} onChange={(x) => setW({ ...w, hinweis: x.target.value })} />
            </label>
          </div>
        </Dialog>
      )}
    </>
  );
}

/**
 * Aktionen der Bestellung je Status.
 * @param {{bestellung:{name:string, status:string, positionen:Array<{schluessel:string, bezeichnung:string, menge:number, menge_erhalten:number}>, servicefall?:string, lieferant:string}, darf:boolean}} p
 */
export function BestellungAktionen({ bestellung: b, darf }) {
  const { ausfuehren, laeuft } = useAktion();
  const [dialog, setDialog] = useState(null);
  const [empfaenger, setEmpfaenger] = useState("");
  const [ab, setAb] = useState({ referenz: "", erwartet_am: "" });
  const [mengen, setMengen] = useState(() => Object.fromEntries(b.positionen.map((p) => [p.schluessel, Math.max(0, p.menge - (p.menge_erhalten || 0))])));
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState({});
  if (!darf) return null;
  const zu = () => setDialog(null);
  const run = (methode, args, ok) => ausfuehren(bestellungAction, { name: b.name, methode, args }, { ok, onOk: zu, onFehler: (r) => r.fehler && setFehler(r.fehler) });
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="bestellung-aktionen">
      {b.status === "Entwurf" && (
        <>
          <Knopf variant="secondary" onClick={() => run("als_gesendet", { bestellweg: "Portal" }, "Als gesendet markiert")}>
            {T.ersatzteile.alsGesendet}
          </Knopf>
          <Knopf variant="primary" icon="Mail" onClick={() => setDialog("senden")} disabled={!b.positionen.length} grund={!b.positionen.length ? T.ersatzteile.keinePosition : undefined}>
            {T.ersatzteile.senden}
          </Knopf>
        </>
      )}
      {b.status === "Gesendet" && (
        <Knopf variant="primary" onClick={() => setDialog("ab")}>
          {T.ersatzteile.abErhalten}
        </Knopf>
      )}
      {["Bestaetigt", "Teilgeliefert", "Gesendet"].includes(b.status) && (
        <Knopf variant={b.status === "Gesendet" ? "secondary" : "primary"} icon="PackageCheck" onClick={() => setDialog("eingang")} data-testid="wareneingang-knopf">
          {T.ersatzteile.wareneingang}
        </Knopf>
      )}
      <Menue label={T.aktionen.mehr} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label={T.aktionen.mehr} />}>
        <MenuePunkt icon="Printer" href={`/druck/ph-ersatzteilbestellung/${encodeURIComponent(b.name)}`}>Bestellung drucken</MenuePunkt>
        {b.servicefall && <MenuePunkt icon="ScrollText" href={`/service/faelle/${encodeURIComponent(b.servicefall)}`}>Fall öffnen</MenuePunkt>}
        <MenueTrenner />
        <MenuePunkt icon="CircleX" gefaehrlich deaktiviert={!["Entwurf", "Gesendet", "Bestaetigt"].includes(b.status)} grund={b.status === "Teilgeliefert" ? T.ersatzteile.reststorno : undefined} onWaehlen={() => setDialog("storno")}>
          {T.ersatzteile.stornieren}
        </MenuePunkt>
      </Menue>

      {dialog === "senden" && (
        <Dialog offen onSchliessen={zu} titel={T.ersatzteile.senden} text={b.lieferant} groesse="sm" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run("senden", { empfaenger }, "Bestellung gesendet")}>{T.aktionen.senden}</Knopf></>}>
          <label className="bo-svc-feld" data-fehler={fehler.empfaenger ? "" : undefined}>
            <span>Empfänger (E-Mail)</span>
            <input type="email" value={empfaenger} onChange={(x) => setEmpfaenger(x.target.value)} />
            {fehler.empfaenger && <span className="bo-svc-fehler">{fehler.empfaenger}</span>}
          </label>
        </Dialog>
      )}
      {dialog === "ab" && (
        <Dialog offen onSchliessen={zu} titel={T.ersatzteile.abErhalten} groesse="sm" fuss={<><Knopf variant="secondary" onClick={zu}>{T.aktionen.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => run("bestaetigen", ab, "Auftragsbestätigung erfasst")}>{T.aktionen.erfassen}</Knopf></>}>
          <div className="grid gap-4">
            <label className="bo-svc-feld">
              <span>AB-Referenz</span>
              <input value={ab.referenz} onChange={(x) => setAb({ ...ab, referenz: x.target.value })} />
            </label>
            <div className="bo-svc-feld">
              <span>Erwartet am</span>
              <Datumsfeld value={ab.erwartet_am} onChange={(v) => setAb({ ...ab, erwartet_am: v })} aria-label="Erwartet am" />
            </div>
          </div>
        </Dialog>
      )}
      {dialog === "eingang" && (
        <Dialog
          offen
          onSchliessen={zu}
          titel={T.ersatzteile.wareneingangTitel}
          text={b.servicefall ? T.ersatzteile.kommission : undefined}
          groesse="md"
          testid="dialog-wareneingang"
          fuss={
            <>
              <Knopf variant="secondary" onClick={() => run("wareneingang", { alles: true }, "Wareneingang gebucht")}>
                {T.ersatzteile.alles}
              </Knopf>
              <Knopf variant="primary" laedt={laeuft} onClick={() => run("wareneingang", { mengen }, "Wareneingang gebucht")} data-testid="wareneingang-ok">
                Buchen
              </Knopf>
            </>
          }
        >
          <ul className="grid gap-2">
            {b.positionen.map((p) => {
              const rest = Math.max(0, p.menge - (p.menge_erhalten || 0));
              return (
                <li key={p.schluessel} className="bo-svc-karte grid grid-cols-[minmax(0,1fr)_120px] items-center gap-3">
                  <span className="min-w-0">
                    <span className="block font-semibold">{p.bezeichnung}</span>
                    <span className="block text-[13px] text-bo-text-soft">{rest ? `offen ${rest} von ${p.menge}` : "Position bereits vollständig"}</span>
                  </span>
                  <label className="bo-svc-feld">
                    <span className="sr-only">{T.ersatzteile.jetztErhalten}</span>
                    <input type="number" min={0} max={rest} disabled={!rest} value={mengen[p.schluessel] ?? 0} onChange={(x) => setMengen({ ...mengen, [p.schluessel]: Math.min(rest, Math.max(0, Number(x.target.value))) })} aria-label={`${T.ersatzteile.jetztErhalten} ${p.bezeichnung}`} />
                  </label>
                </li>
              );
            })}
          </ul>
        </Dialog>
      )}
      {dialog === "storno" && (
        <Bestaetigen offen titel={`${b.name} stornieren?`} text={T.ersatzteile.stornierenFolge} bestaetigen="Stornieren" gefaehrlich laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => run("stornieren", { grund }, "Bestellung storniert")}>
          <label className="bo-svc-feld text-left">
            <span>Grund</span>
            <input value={grund} onChange={(x) => setGrund(x.target.value)} />
          </label>
        </Bestaetigen>
      )}
    </div>
  );
}

export { Datumsfeld };
