"use client";
// Aktionen der Einsatz-Akte (10-konzept-service §2.5, §4.3): Primär je Status, „⋯“ mit Umplanen (verzögert 8 s),
// Absagen (Dialog rot, Grund Pflicht), Nicht angetroffen, Status im Namen des Technikers. Nie set_value auf status.
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Knopf from "../Knopf";
import Bestaetigen from "../Bestaetigen";
import Datumsfeld from "../Formular/Datumsfeld";
import { Dialog, Menue, MenuePunkt, MenueTrenner } from "../Overlay";
import { useAktion } from "./useAktion";
import { einsatzAbsagenAction, einsatzStatusAction, einsatzUmplanenAction, informierenAction, nichtAngetroffenAction } from "@/lib/backoffice/service/actions";
import { T } from "@/lib/backoffice/service/texte";
import { tagKurz, uhr } from "@/lib/backoffice/service/anzeige";
import "./service.css";

/**
 * @param {{einsatz:object, techniker:Array<{email:string,name:string}>, technikerName:string, darf:boolean, fallEmail?:string}} p
 */
export default function EinsatzAktionen({ einsatz: e, techniker, technikerName, darf, fallEmail = "" }) {
  const router = useRouter();
  const pfad = usePathname();
  const sp = useSearchParams();
  const { ausfuehren, laeuft } = useAktion();
  const [dialog, setDialog] = useState(sp?.get("aktion") || null);
  const [u, setU] = useState({ datum: e.datum, von: uhr(e.zeit_von), bis: uhr(e.zeit_bis), techniker: e.techniker, grund: "" });
  const [grund, setGrund] = useState("");
  const laeuftSchon = ["Unterwegs", "In Arbeit"].includes(e.status);
  const zu = () => {
    setDialog(null);
    if (sp?.get("aktion")) router.replace(pfad, { scroll: false });
  };
  if (!darf) return null;

  let primaer = null;
  if (e.status === "Geplant" && !e.umgeplant_am)
    primaer = (
      <Knopf variant="primary" icon="Check" laedt={laeuft} onClick={() => ausfuehren(einsatzStatusAction, { name: e.name, methode: "bestaetigen" }, { ok: "Termin bestätigt" })} data-testid="einsatz-primaer">
        {T.einsaetze.bestaetigen}
      </Knopf>
    );
  else if (e.status === "Geplant" && e.umgeplant_am && e.servicefall)
    primaer = (
      <Knopf variant="primary" icon="Mail" laedt={laeuft} disabled={!fallEmail} grund={!fallEmail ? "Keine E-Mail – telefonisch vereinbaren" : undefined} onClick={() => ausfuehren(informierenAction, { name: e.servicefall, vorlage: "termin", kanal: "email" }, { ok: "Terminvorschlag gesendet" })} data-testid="einsatz-primaer">
        {T.einsaetze.terminvorschlag}
      </Knopf>
    );
  else if (e.status === "Erledigt")
    primaer = (
      <Knopf variant="primary" icon="Printer" href={`/druck/ph-serviceeinsatz/${encodeURIComponent(e.name)}?format=${encodeURIComponent("PH Servicebericht")}`} data-testid="einsatz-primaer">
        {T.einsaetze.bericht}
      </Knopf>
    );
  else if (e.status === "Nicht angetroffen" && e.servicefall)
    primaer = (
      <Knopf variant="primary" icon="CalendarPlus" href={`/service/einsaetze/neu?fall=${encodeURIComponent(e.servicefall)}`} data-testid="einsatz-primaer">
        {T.einsaetze.folgeeinsatz}
      </Knopf>
    );
  else if (["Bestaetigt", "Unterwegs", "In Arbeit"].includes(e.status)) primaer = <span className="rounded-pill bg-bo-fill-2 px-3 py-1.5 text-[13px] font-medium text-bo-text-soft">{T.einsaetze.laeuftMit(tagKurz(e.datum), technikerName)}</span>;

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="einsatz-aktionen">
      {e.status === "Erledigt" && !e.bericht_gesendet_am && fallEmail && (
        <Knopf variant="secondary" onClick={() => ausfuehren(einsatzStatusAction, { name: e.name, methode: "bericht_senden" }, { ok: "Servicebericht gesendet" })}>
          {T.einsaetze.berichtSenden}
        </Knopf>
      )}
      {primaer}
      <Menue label={T.aktionen.mehr} ausloeser={(p) => <Knopf {...p} variant="secondary" icon="Ellipsis" label={T.aktionen.mehr} />}>
        <MenuePunkt icon="CalendarDays" onWaehlen={() => setDialog("umplanen")} deaktiviert={!["Geplant", "Bestaetigt"].includes(e.status)} grund={laeuftSchon ? T.einsaetze.laeuft : undefined}>
          {T.einsaetze.umplanen}
        </MenuePunkt>
        {["Geplant", "Bestaetigt"].includes(e.status) && <MenuePunkt icon="Calendar" onWaehlen={() => ausfuehren(einsatzStatusAction, { name: e.name, methode: "termin_anlegen" }, { ok: "Kalendertermin angelegt" })}>Kalendertermin anlegen</MenuePunkt>}
        {["Geplant", "Bestaetigt"].includes(e.status) && <MenuePunkt icon="Truck" onWaehlen={() => ausfuehren(einsatzStatusAction, { name: e.name, methode: "unterwegs", imNamen: technikerName }, { ok: "Unterwegs gesetzt (im Namen des Technikers)" })}>{T.einsaetze.imNamen(technikerName)}</MenuePunkt>}
        {["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"].includes(e.status) && <MenuePunkt icon="UserCog" onWaehlen={() => setDialog("nicht-angetroffen")}>{T.einsaetze.nichtAngetroffen}</MenuePunkt>}
        {e.servicefall && <MenuePunkt icon="ScrollText" href={`/service/faelle/${encodeURIComponent(e.servicefall)}`}>Fall öffnen</MenuePunkt>}
        {!["Erledigt", "Abgebrochen"].includes(e.status) && (
          <>
            <MenueTrenner />
            <MenuePunkt icon="CircleX" gefaehrlich onWaehlen={() => setDialog("absagen")}>
              {T.einsaetze.absagen}
            </MenuePunkt>
          </>
        )}
      </Menue>

      {dialog === "umplanen" && (
        <Dialog
          offen
          onSchliessen={zu}
          titel={T.einsaetze.umplanenTitel}
          groesse="md"
          testid="dialog-umplanen"
          fuss={
            <>
              <Knopf variant="secondary" onClick={zu}>
                {T.aktionen.abbrechen}
              </Knopf>
              <Knopf variant="primary" laedt={laeuft} onClick={() => ausfuehren(einsatzUmplanenAction, { name: e.name, ...u }, { ok: T.einsaetze.verschoben(`${tagKurz(u.datum)} ${u.von}`), onOk: zu })} data-testid="umplanen-ok">
                {T.einsaetze.umplanen}
              </Knopf>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bo-svc-feld sm:col-span-2">
              <span>Datum</span>
              <Datumsfeld value={u.datum} onChange={(v) => setU({ ...u, datum: v })} aria-label="Datum" />
            </div>
            <label className="bo-svc-feld">
              <span>Von</span>
              <input value={u.von} onChange={(x) => setU({ ...u, von: x.target.value })} inputMode="numeric" placeholder="08:00" />
            </label>
            <label className="bo-svc-feld">
              <span>Bis</span>
              <input value={u.bis} onChange={(x) => setU({ ...u, bis: x.target.value })} inputMode="numeric" placeholder="10:00" />
            </label>
            <label className="bo-svc-feld sm:col-span-2">
              <span>Techniker</span>
              <select value={u.techniker} onChange={(x) => setU({ ...u, techniker: x.target.value })}>
                {techniker.map((t) => (
                  <option key={t.email} value={t.email}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 sm:col-span-2">
              <span className="bo-svc-label">{T.einsaetze.grund} (optional)</span>
              <div className="bo-svc-chips">
                {T.einsaetze.grundChips.map((g) => (
                  <button key={g} type="button" className="bo-svc-wahl" aria-pressed={u.grund === g} onClick={() => setU({ ...u, grund: g })}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <p className="bo-svc-hinweis sm:col-span-2">Danach gilt der Termin als unbestätigt – Kunde informieren.</p>
          </div>
        </Dialog>
      )}
      {dialog === "absagen" && (
        <Bestaetigen offen titel={T.einsaetze.absagenTitel} text={T.einsaetze.absagenFolge} bestaetigen={T.einsaetze.absagen} gefaehrlich laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => ausfuehren(einsatzAbsagenAction, { name: e.name, grund }, { ok: "Einsatz abgesagt", onOk: zu })}>
          <label className="bo-svc-feld text-left">
            <span>{T.einsaetze.grund}</span>
            <input value={grund} onChange={(x) => setGrund(x.target.value)} />
          </label>
        </Bestaetigen>
      )}
      {dialog === "nicht-angetroffen" && (
        <Bestaetigen offen titel={`${T.einsaetze.nichtAngetroffen}?`} bestaetigen={T.einsaetze.nichtAngetroffen} laeuft={laeuft} onAbbrechen={zu} onBestaetigen={() => ausfuehren(nichtAngetroffenAction, { name: e.name, hinweis: grund }, { ok: "Als nicht angetroffen vermerkt", onOk: zu })}>
          <div className="grid gap-3 text-left">
            <div className="bo-svc-chips">
              {T.technik.nichtAngetroffenChips.map((g) => (
                <button key={g} type="button" className="bo-svc-wahl" aria-pressed={grund === g} onClick={() => setGrund(g)}>
                  {g}
                </button>
              ))}
            </div>
            <label className="bo-svc-feld">
              <span>Hinweis</span>
              <input value={grund} onChange={(x) => setGrund(x.target.value)} />
            </label>
          </div>
        </Bestaetigen>
      )}
    </div>
  );
}
