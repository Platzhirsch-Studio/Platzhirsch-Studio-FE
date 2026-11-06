"use client";
// Kopf-Aktionen der Auftragsmappe (10-konzept-projekte.md § 4.1, § 4.3, § 4.6): genau eine Primäraktion
// („Empfohlen“, Strg/⌘+Enter), Aktionsmenü ⋯ (Kunde · Anlegen · Drucken · Phase · Leitung), „Kunde nicht
// informiert“-Chip mit Sheet (G-18), Montage planen (Sheet § 6.2), Abschließen (PA8), Abbrechen (PA9),
// Phase zurücksetzen (Leitung). Workflow-Vorwärtsaktionen laufen als verzögerter Commit (E2).

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Menue, MenuePunkt, MenueTrenner, MenueGruppe, Dialog } from "../Overlay";
import { InformierenChip, InformierenSheet } from "../Informieren/Informieren";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { abbrechenAction, abschliessenAction, phasePlanenAction, phaseZuruecksetzenAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";
import MontagePlanenSheet from "./MontagePlanenSheet";
import ZeitBuchenDialog from "./ZeitBuchenDialog";
import "./projekte.css";

export const INFORMIEREN_EREIGNIS = "ph-prj-informieren";

/**
 * @param {{projekt:object, kontakt:object|null, primaer:object|null, leitung:boolean, transitions:Array<{action:string,nextState:string}>,
 *   informieren:{vorlagen:object[], werte:object, versand:object, empfaenger:object}, pruefliste:object[], planen:object, phasen:string[], readonly:boolean}} p
 */
export default function MappeAktionen({ projekt, primaer, leitung, transitions = [], informieren, pruefliste = [], planen, phasen = [], readonly = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte, flush } = useVerzoegerterCommit();
  const [pending, start] = useTransition();
  const [chip, setChip] = useState(false);
  const [sheet, setSheet] = useState(null); // informieren | planen | zeit | abschliessen | abbrechen | zurueck
  const objekt = { doctype: "PH Projekt", name: projekt.name, titel: projekt.titel };

  useEffect(() => {
    const an = (e) => {
      if (!e.detail || e.detail === projekt.name) setChip(true);
    };
    window.addEventListener(INFORMIEREN_EREIGNIS, an);
    return () => window.removeEventListener(INFORMIEREN_EREIGNIS, an);
  }, [projekt.name]);

  const workflow = (aktion) =>
    start(async () => {
      await flush(objekt);
      const r = await phasePlanenAction({ name: projekt.name, aktion });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      starte(`${aktion} · ${projekt.titel}`, { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: aktion, onErfolg: () => router.refresh() });
    });

  const primaerAusfuehren = () => {
    if (!primaer?.aktion) return;
    const a = primaer.aktion;
    if (a.art === "workflow") workflow(a.aktion);
    else if (a.art === "sheet") setSheet(a.sheet === "montage-planen" ? "planen" : a.sheet === "abschliessen" ? "abschliessen" : a.sheet);
    else if (a.art === "link") router.push(a.href);
  };
  useKuerzel("akte", { "akte.primaer": () => (primaerAusfuehren(), true) });

  const vorwaerts = transitions.filter((t) => !["Zurück", "Abbrechen", "Abschließen", "Zurück auf Neu"].includes(t.action));
  const kannZurueck = leitung && transitions.some((t) => t.action === "Zurück");
  const kannAbbrechen = leitung && transitions.some((t) => t.action === "Abbrechen");
  const kannAbschliessen = leitung && transitions.some((t) => t.action === "Abschließen");

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2" data-testid="mappe-aktionen">
      {chip && <InformierenChip objekt={objekt} onOeffnen={() => setSheet("informieren")} onNichtNoetig={() => setChip(false)} />}
      {primaer?.aktion && !readonly && (
        <Knopf variant="primary" icon={primaer.aktion.art === "link" ? "ArrowUpRight" : "Check"} kuerzel="Strg+Enter" laedt={pending} onClick={primaerAusfuehren} data-testid="primaer">
          {primaer.titel}
        </Knopf>
      )}
      <Menue label={TEXTE.mappe.aktionen} breite={280} ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label={TEXTE.mappe.aktionen} data-testid="aktionsmenue" />}>
        <MenueGruppe titel="Kunde">
          <MenuePunkt icon="Mail" onWaehlen={() => setSheet("informieren")} testid="menue-informieren">
            Kunden informieren
          </MenuePunkt>
        </MenueGruppe>
        <MenueTrenner />
        <MenueGruppe titel="Anlegen">
          <MenuePunkt icon="CalendarPlus" onWaehlen={() => setSheet("planen")} deaktiviert={readonly} grund={readonly ? TEXTE.mappe.readonly : undefined}>
            Montage planen
          </MenuePunkt>
          <MenuePunkt icon="Clock" onWaehlen={() => setSheet("zeit")} kuerzel="⇧H">
            Zeit buchen
          </MenuePunkt>
          <MenuePunkt icon="CheckSquare" href={`/projekte/aufgaben?projekt=${encodeURIComponent(projekt.name)}&neu=1`}>
            Aufgabe
          </MenuePunkt>
        </MenueGruppe>
        <MenueTrenner />
        <MenueGruppe titel="Drucken">
          <MenuePunkt icon="Printer" href={`/druck/ph-projekt/${encodeURIComponent(projekt.name)}?format=${encodeURIComponent("PH Projekt Statusbericht")}`}>
            Statusbericht
          </MenuePunkt>
        </MenueGruppe>
        {vorwaerts.length > 0 && !readonly && (
          <>
            <MenueTrenner />
            <MenueGruppe titel="Phase">
              {vorwaerts.map((t) => (
                <MenuePunkt key={t.action} icon="ArrowRight" onWaehlen={() => workflow(t.action)}>
                  {t.action}
                </MenuePunkt>
              ))}
            </MenueGruppe>
          </>
        )}
        {leitung && (
          <>
            <MenueTrenner />
            <MenueGruppe titel="Leitung">
              {kannAbschliessen && (
                <MenuePunkt icon="BadgeCheck" onWaehlen={() => setSheet("abschliessen")}>
                  Abschließen …
                </MenuePunkt>
              )}
              {kannZurueck && (
                <MenuePunkt icon="RotateCcw" onWaehlen={() => setSheet("zurueck")}>
                  Phase zurücksetzen …
                </MenuePunkt>
              )}
              {kannAbbrechen && (
                <MenuePunkt icon="CircleX" gefaehrlich onWaehlen={() => setSheet("abbrechen")}>
                  Abbrechen …
                </MenuePunkt>
              )}
            </MenueGruppe>
          </>
        )}
      </Menue>

      <InformierenSheet
        offen={sheet === "informieren"}
        onSchliessen={() => setSheet(null)}
        objekt={objekt}
        empfaenger={informieren.empfaenger}
        vorlagen={informieren.vorlagen}
        werte={informieren.werte}
        versand={informieren.versand}
        pfad={`/projekte/${encodeURIComponent(projekt.name)}`}
        onErgebnis={(e) => {
          setChip(false);
          if (e?.art === "gesendet") zeige("Kunde informiert", { art: "ok" });
        }}
      />
      <MontagePlanenSheet offen={sheet === "planen"} onSchliessen={() => setSheet(null)} {...planen} />
      <ZeitBuchenDialog offen={sheet === "zeit"} onSchliessen={() => setSheet(null)} projekt={projekt.name} />
      <AbschliessenDialog offen={sheet === "abschliessen"} onSchliessen={() => setSheet(null)} projekt={projekt} pruefliste={pruefliste} />
      <AbbrechenDialog offen={sheet === "abbrechen"} onSchliessen={() => setSheet(null)} projekt={projekt} />
      <ZuruecksetzenDialog offen={sheet === "zurueck"} onSchliessen={() => setSheet(null)} projekt={projekt} phasen={phasen} />
    </div>
  );
}

function AbschliessenDialog({ offen, onSchliessen, projekt, pruefliste }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [grund, setGrund] = useState("");
  const [pending, start] = useTransition();
  const offenZeilen = pruefliste.filter((z) => !z.ok).length;
  const los = () =>
    start(async () => {
      const r = await abschliessenAction({ name: projekt.name, begruendung: grund, offen: offenZeilen });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      zeige(`Projekt ${projekt.titel} abgeschlossen`, { art: "ok" });
      onSchliessen();
      router.refresh();
    });
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={`${projekt.titel} abschließen?`} groesse="md" testid="abschliessen-dialog"
      fuss={<><Knopf onClick={onSchliessen}>Abbrechen</Knopf><Knopf variant="primary" laedt={pending} onClick={los} disabled={offenZeilen > 0 && grund.trim().length < 5} grund={offenZeilen > 0 && grund.trim().length < 5 ? "Bei offenen Punkten ist eine Begründung Pflicht." : undefined}>Abschließen</Knopf></>}>
      <ul className="bo-prj-pruef" data-testid="pruefliste">
        {pruefliste.map((z) => (
          <li key={z.id} data-ok={z.ok ? "" : undefined}>
            <span className="bo-prj-pruef__ico" aria-hidden="true">{z.ok ? "✓" : "!"}</span>
            <span className="min-w-0 flex-1">
              {z.titel}
              <span className="sr-only">{z.ok ? " – erfüllt" : " – offen"}</span>
              {z.hinweis && <span className="bo-prj-unter block">{z.hinweis}</span>}
            </span>
            {z.href && !z.ok && (
              <a href={z.href} className="shrink-0 text-[13px] font-medium underline underline-offset-2">
                Ansehen
              </a>
            )}
          </li>
        ))}
      </ul>
      {offenZeilen > 0 && (
        <label className="mt-4 block">
          <span className="text-[13px] font-medium text-bo-text-soft">Begründung ({offenZeilen} offen)</span>
          <textarea className="bo-input mt-1 min-h-20 w-full" value={grund} onChange={(e) => setGrund(e.target.value)} />
        </label>
      )}
    </Dialog>
  );
}

function AbbrechenDialog({ offen, onSchliessen, projekt }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [grund, setGrund] = useState("");
  const [folgen, setFolgen] = useState(["montagen", "aufgaben"]);
  const [ergebnis, setErgebnis] = useState(null);
  const [pending, start] = useTransition();
  const umschalten = (f) => setFolgen((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]));
  const los = () =>
    start(async () => {
      const r = await abbrechenAction({ name: projekt.name, grund, folgen });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      setErgebnis(r.ergebnisse || []);
      zeige(`Projekt ${projekt.titel} abgebrochen`, { art: "ok" });
      router.refresh();
    });
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={`${projekt.titel} abbrechen?`} groesse="md" testid="abbrechen-dialog"
      fuss={ergebnis ? <Knopf variant="primary" onClick={onSchliessen}>Fertig</Knopf> : <><Knopf onClick={onSchliessen}>Zurück</Knopf><Knopf variant="danger-solid" laedt={pending} onClick={los} disabled={grund.trim().length < 5} grund={grund.trim().length < 5 ? "Grund ist Pflicht." : undefined}>Projekt abbrechen</Knopf></>}>
      {ergebnis ? (
        <ul className="bo-prj-pruef">
          {ergebnis.length ? ergebnis.map((e) => <li key={e.titel} data-ok={e.ok ? "" : undefined}><span className="bo-prj-pruef__ico" aria-hidden="true">{e.ok ? "✓" : "!"}</span>{e.titel}{e.grund ? ` – ${e.grund}` : ""}</li>) : <li data-ok=""><span className="bo-prj-pruef__ico">✓</span>Keine offenen Folgen.</li>}
        </ul>
      ) : (
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="text-[13px] font-medium text-bo-text-soft">Grund</span>
            <textarea className="bo-input mt-1 min-h-20 w-full" value={grund} onChange={(e) => setGrund(e.target.value)} data-testid="abbruch-grund" />
          </label>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-[13px] font-medium text-bo-text-soft">Folgen</legend>
            {[["montagen", "Offene Montagen mit abbrechen"], ["aufgaben", "Offene Aufgaben verwerfen"]].map(([f, t]) => (
              <label key={f} className="flex items-center gap-3 text-[15px]">
                <input type="checkbox" checked={folgen.includes(f)} onChange={() => umschalten(f)} className="size-5 accent-(--color-bo-ink)" />
                {t}
              </label>
            ))}
            <p className="bo-prj-unter">Auftragsbestätigung, Anzahlung und Herstellerbestellungen klärst du in Faktura und Sortiment.</p>
          </fieldset>
        </div>
      )}
    </Dialog>
  );
}

function ZuruecksetzenDialog({ offen, onSchliessen, projekt, phasen }) {
  const router = useRouter();
  const { zeige } = useToast();
  const idx = phasen.indexOf(projekt.status);
  const ziele = idx > 0 ? phasen.slice(0, idx) : [];
  const [ziel, setZiel] = useState(ziele[ziele.length - 1] || "");
  const [pending, start] = useTransition();
  const los = () =>
    start(async () => {
      const r = await phaseZuruecksetzenAction({ name: projekt.name, ziel });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      zeige(`Phase auf ${statusText("PH Projekt", ziel)} zurückgesetzt`, { art: "ok" });
      onSchliessen();
      router.refresh();
    });
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={TEXTE.mappe.zuruecksetzenFrage(statusText("PH Projekt", projekt.status), statusText("PH Projekt", ziel))} text={TEXTE.mappe.zuruecksetzenText} groesse="sm"
      fuss={<><Knopf onClick={onSchliessen} autoFocus>Abbrechen</Knopf><Knopf variant="danger-solid" laedt={pending} onClick={los} disabled={!ziel}>{TEXTE.mappe.zuruecksetzenKnopf}</Knopf></>}>
      <label className="block">
        <span className="text-[13px] font-medium text-bo-text-soft">Zurück auf</span>
        <select className="bo-input mt-1 w-full" value={ziel} onChange={(e) => setZiel(e.target.value)}>
          {ziele.map((z) => (
            <option key={z} value={z}>
              {statusText("PH Projekt", z)}
            </option>
          ))}
        </select>
      </label>
    </Dialog>
  );
}
