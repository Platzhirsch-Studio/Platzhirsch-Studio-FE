"use client";
// Aktions-Bausteine der Logistik-Akten und -Listen. Server-Seiten geben Server Actions als Props herein
// (serialisierbare Referenzen) – so bleibt jede Mutation in lib/backoffice/logistik/actions.js (Mock-Pfad im Dienst).
// VorgangKnopf: sofort oder mit Rückfrage/Eingaben (Grund, km, Empfänger …), Toast mit Rückgängig, wo es eine
// Gegenaktion gibt. VerzoegertKnopf: verzögerter Commit 8 s (Gepackt, Übergeben, Freigabe – Q-C3).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import Bestaetigen from "../Bestaetigen";
import Segment from "../Segment";
import Kanban from "../Kanban/Kanban";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { DIALOG } from "@/lib/backoffice/logistik/texte";

function setze(args, pfad, werte) {
  if (!pfad) return { ...args, ...werte };
  return { ...args, [pfad]: { ...(args[pfad] || {}), ...werte } };
}

function Feld({ f, wert, onWert, fehler }) {
  const id = `feld-${f.name}`;
  const basis = "w-full rounded-[14px] bg-bo-surface-2 px-4 text-[15px] text-bo-text outline-none focus-visible:shadow-(--bo-sh-focus)";
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      <span className="text-[13px] font-medium text-bo-text-soft">{f.label}{f.pflicht ? " *" : ""}</span>
      {f.typ === "auswahl" ? (
        <Segment label={f.label} wert={wert ?? ""} onWechsel={onWert} optionen={f.optionen.map((o) => (typeof o === "string" ? { wert: o, titel: o } : o))} />
      ) : f.typ === "text" ? (
        <textarea id={id} rows={3} className={`${basis} py-3`} value={wert ?? ""} onChange={(e) => onWert(e.target.value)} data-scan="nein" />
      ) : (
        <input id={id} className={`${basis} h-12`} inputMode={f.typ === "zahl" ? "numeric" : undefined} type={f.typ === "zeit" ? "time" : "text"} value={wert ?? ""} onChange={(e) => onWert(e.target.value)} placeholder={f.platzhalter} data-scan="nein" aria-invalid={fehler ? "true" : undefined} />
      )}
      {f.hinweis ? <span className="text-[12px] text-bo-text-soft">{f.hinweis}</span> : null}
      {fehler ? <span className="text-[13px] text-bo-ziegel-text">{fehler}</span> : null}
    </label>
  );
}

/**
 * Knopf für eine Server Action.
 * @param {{aktion:Function, args?:object, titel:string, icon?:string, variant?:string, size?:string, frage?:{titel:string, text?:string, gefaehrlich?:boolean, bestaetigen?:string, fakten?:Array},
 *   felder?:Array<{name:string,label:string,typ?:"zeile"|"text"|"zahl"|"auswahl"|"zeit",pflicht?:boolean,optionen?:Array,start?:any,min?:number,hinweis?:string}>, feldPfad?:string,
 *   erfolg?:string, ziel?:string, zielFeld?:string, rueckgaengig?:{aktion:Function, args:object}, disabled?:boolean, grund?:string, testid?:string, dialogTitel?:string, dialogText?:string}} p
 */
export function VorgangKnopf({ aktion, args = {}, titel, icon, variant = "secondary", size = "m", frage, felder, feldPfad, erfolg, ziel, zielFeld, rueckgaengig, disabled, grund, testid, dialogTitel, dialogText, className }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [offen, setOffen] = useState(false);
  const [werte, setWerte] = useState(() => Object.fromEntries((felder || []).map((f) => [f.name, f.start ?? ""])));
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();

  const ausfuehren = (w = {}) =>
    start(async () => {
      const r = await aktion(setze(args, feldPfad, w));
      if (!r?.ok) {
        setFehler(r?.fehler || {});
        zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
        return;
      }
      setOffen(false);
      zeige(erfolg || "Erledigt", {
        art: "ok",
        aktion: rueckgaengig ? { titel: DIALOG.rueckgaengig, onClick: async () => { await rueckgaengig.aktion(rueckgaengig.args); router.refresh(); } } : undefined,
      });
      if (zielFeld && r[zielFeld]) router.push(`${ziel}${encodeURIComponent(r[zielFeld])}`);
      else if (ziel) router.push(ziel);
      else router.refresh();
    });

  const klick = () => {
    if (felder?.length || frage) setOffen(true);
    else ausfuehren();
  };

  const pflichtFehlt = (felder || []).some((f) => f.pflicht && !String(werte[f.name] ?? "").trim());

  return (
    <>
      <Knopf variant={variant} size={size} icon={icon} onClick={klick} laedt={laeuft && !offen} disabled={disabled} grund={grund} className={className} data-testid={testid}>
        {titel}
      </Knopf>
      {felder?.length ? (
        <Dialog offen={offen} onSchliessen={() => setOffen(false)} titel={dialogTitel || titel} text={dialogText} groesse="md" testid={testid ? `${testid}-dialog` : undefined}
          fuss={<>
            <Knopf variant="ghost" onClick={() => setOffen(false)}>{DIALOG.abbrechen}</Knopf>
            <Knopf variant={frage?.gefaehrlich ? "danger-solid" : "primary"} laedt={laeuft} disabled={pflichtFehlt} grund={pflichtFehlt ? "Pflichtfelder ausfüllen" : undefined} onClick={() => ausfuehren(werte)} data-testid={testid ? `${testid}-ok` : undefined}>{frage?.bestaetigen || titel}</Knopf>
          </>}>
          <div className="flex flex-col gap-4">
            {frage?.fakten?.length ? (
              <ul className="flex flex-col gap-1 rounded-[16px] bg-bo-surface-2 p-3 text-[14px]">{frage.fakten.map((x) => <li key={String(x)}>{x}</li>)}</ul>
            ) : null}
            {felder.map((f) => <Feld key={f.name} f={f} wert={werte[f.name]} fehler={fehler[f.name]} onWert={(v) => setWerte((w) => ({ ...w, [f.name]: v }))} />)}
          </div>
        </Dialog>
      ) : frage ? (
        <Bestaetigen offen={offen} titel={frage.titel} text={frage.text} gefaehrlich={frage.gefaehrlich} bestaetigen={frage.bestaetigen || titel} laeuft={laeuft} onAbbrechen={() => setOffen(false)} onBestaetigen={() => ausfuehren()} fakten={frage.faktenListe} />
      ) : null}
    </>
  );
}

/**
 * Verzögerter Commit (8 s, Rückgängig im Toast): planen → starte → nach Ablauf führt der Server genau einmal aus.
 * @param {{planen:Function, args:object, titel:string, text:string, icon?:string, variant?:string, felder?:Array, testid?:string, disabled?:boolean, grund?:string}} p
 */
export function VerzoegertKnopf({ planen, args = {}, titel, text, icon, variant = "primary", size = "m", felder, testid, disabled, grund, dialogTitel, dialogText }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [offen, setOffen] = useState(false);
  const [werte, setWerte] = useState(() => Object.fromEntries((felder || []).map((f) => [f.name, f.start ?? ""])));
  const [laeuft, start] = useTransition();
  const [geplant, setGeplant] = useState(false);

  const los = (w = {}) =>
    start(async () => {
      const r = await planen({ ...args, ...w });
      if (!r?.ok) {
        zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
        if (r?.sperre && felder?.length) setOffen(true);
        return;
      }
      setOffen(false);
      setGeplant(true);
      starte(text, { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: titel, onErfolg: () => router.refresh(), onVerworfen: () => setGeplant(false), onFehler: () => setGeplant(false) });
    });

  return (
    <>
      <Knopf variant={variant} size={size} icon={icon} onClick={() => los()} laedt={laeuft} disabled={disabled || geplant} grund={geplant ? "wird gespeichert …" : grund} data-testid={testid}>
        {titel}
      </Knopf>
      {felder?.length ? (
        <Dialog offen={offen} onSchliessen={() => setOffen(false)} titel={dialogTitel || titel} text={dialogText} groesse="md"
          fuss={<>
            <Knopf variant="ghost" onClick={() => setOffen(false)}>{DIALOG.abbrechen}</Knopf>
            <Knopf variant="primary" laedt={laeuft} onClick={() => los(werte)}>{titel}</Knopf>
          </>}>
          <div className="flex flex-col gap-4">
            {felder.map((f) => <Feld key={f.name} f={f} wert={werte[f.name]} onWert={(v) => setWerte((x) => ({ ...x, [f.name]: v }))} />)}
          </div>
        </Dialog>
      ) : null}
    </>
  );
}

/** Menü „⋯“ mit Einträgen: Link (`href`) oder Server Action (`aktion` + `args`, optional Rückfrage). */
export function MehrMenue({ eintraege = [], label = "Weitere Aktionen", testid }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [frage, setFrage] = useState(null);
  const [laeuft, start] = useTransition();
  const lauf = (e) =>
    start(async () => {
      const r = await e.aktion(e.args || {});
      setFrage(null);
      if (!r?.ok) return zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
      zeige(e.erfolg || "Erledigt", { art: "ok" });
      if (e.zielFeld && r[e.zielFeld]) router.push(`${e.ziel}${encodeURIComponent(r[e.zielFeld])}`);
      else router.refresh();
    });
  const sichtbar = eintraege.filter(Boolean);
  if (!sichtbar.length) return null;
  return (
    <>
      <Menue label={label} ausloeser={(p) => <Knopf {...p} icon="Ellipsis" label={label} data-testid={testid} />}>
        {sichtbar.map((e, i) =>
          e === "trenner" || e.trenner ? (
            <MenueTrenner key={`t${i}`} />
          ) : (
            <MenuePunkt key={e.titel} icon={e.icon} href={e.href} gefaehrlich={e.gefaehrlich} deaktiviert={e.deaktiviert} grund={e.grund} onWaehlen={e.aktion ? () => (e.frage ? setFrage(e) : lauf(e)) : undefined}>
              {e.titel}
            </MenuePunkt>
          ),
        )}
      </Menue>
      <Bestaetigen offen={!!frage} titel={frage?.frage?.titel || ""} text={frage?.frage?.text} gefaehrlich={frage?.frage?.gefaehrlich} bestaetigen={frage?.frage?.bestaetigen || frage?.titel} laeuft={laeuft} onAbbrechen={() => setFrage(null)} onBestaetigen={() => lauf(frage)} />
    </>
  );
}

/**
 * Kanban mit Fachlogik: Ziehen ruft die Bereichs-Action (Dokumentmethoden), nicht das Statusfeld (§ 4.2).
 * Verzögerte Schritte (Gepackt, Übergeben) laufen als Commit mit Rückgängig.
 */
export function LogistikKanban({ verschieben, ...props }) {
  const { starte } = useVerzoegerterCommit();
  const router = useRouter();
  return (
    <Kanban
      {...props}
      onVerschiebe={async ({ name, von, nach }) => {
        const r = await verschieben({ name, von, nach });
        if (r?.ok && r.token) starte(nach === "Gepackt" ? "Gepackt" : "Übergeben", { token: r.token, ms: r.ms, objekt: r.objekt, onErfolg: () => router.refresh(), onVerworfen: () => router.refresh() });
        return r?.ok ? { ok: true } : { ok: false, message: r?.message };
      }}
    />
  );
}
