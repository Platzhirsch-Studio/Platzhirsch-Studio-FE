"use client";
// Kassa-Verwaltung – Client-Aktionen (Team B-KAS): Dokumentmethoden aus der Whitelist (Signatur prüfen,
// Nullbeleg, DEP, Ereignis gemeldet …) mit Rückfrage bei Außen-/Geldwirkung, Trainingsmodus mit
// Echtbetriebs-Schranke (§0.4) und die Kassa-Einstellungen (Feld für Feld, sofort gespeichert).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Schalter from "../Schalter";
import Bestaetigen from "../Bestaetigen";
import BetragFeld from "../Eingabe/BetragFeld";
import { useToast } from "../Toast";
import { docMethodeAction, einstellungAction, nullbelegAction, trainingAction } from "@/lib/backoffice/kassa/actions";

/** Knopf für eine Dokumentmethode. `frage` → Rückfrage vorher. */
export function DocAktion({ doctype, name, methode, args, titel, icon, frage, variant = "secondary", erfolg, deaktiviert, grund, testid }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [offen, setOffen] = useState(false);
  const [laeuft, starte] = useTransition();
  const los = () =>
    starte(async () => {
      const r = await docMethodeAction({ doctype, name, methode, args });
      zeige(r.ok ? erfolg || `${titel}: erledigt` : r.message, { art: r.ok ? "ok" : "fehler" });
      if (r.ok) router.refresh();
    });
  return (
    <>
      <Knopf variant={variant} icon={icon} laedt={laeuft} disabled={deaktiviert} grund={deaktiviert ? grund : undefined} onClick={() => (frage ? setOffen(true) : los())} data-testid={testid}>
        {titel}
      </Knopf>
      {frage && <Bestaetigen offen={offen} titel={titel} text={frage} bestaetigen={titel} onBestaetigen={() => (setOffen(false), los())} onAbbrechen={() => setOffen(false)} />}
    </>
  );
}

/** Nullbeleg erstellen (Leitung). */
export function NullbelegKnopf({ kasse }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [laeuft, starte] = useTransition();
  return (
    <Knopf icon="Receipt" laedt={laeuft} onClick={() => starte(async () => {
      const r = await nullbelegAction({ kasse });
      zeige(r.ok ? `Nullbeleg ${r.daten.belegnummer} erstellt` : r.message, { art: r.ok ? "ok" : "fehler" });
      if (r.ok) router.refresh();
    })}>
      Nullbeleg
    </Knopf>
  );
}

/** Trainingsmodus der Kasse – „aus“ nur, wenn die Echtbetriebs-Schranke erfüllt ist. */
export function TrainingSchalter({ kasse, an, fehlt = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [wert, setWert] = useState(!!an);
  const [frage, setFrage] = useState(null);
  const gesperrt = wert && fehlt.length > 0;
  const setzen = async (neu) => {
    const r = await trainingAction({ kasse, an: neu });
    if (r.ok) {
      setWert(!!neu);
      zeige(neu ? "Trainingsmodus eingeschaltet" : "Trainingsmodus ausgeschaltet", { art: "ok" });
      router.refresh();
    } else zeige(r.message, { art: "fehler" });
  };
  return (
    <div className="grid gap-2">
      <Schalter label="Trainingsmodus" beschreibung={wert ? "Belege zählen nicht zum Umsatz." : "Echtbetrieb – Belege sind gültig."} an={wert} deaktiviert={gesperrt} onWechsel={(n) => setFrage(n)} testid="kasse-training" />
      {!wert && fehlt.length > 0 && (
        <p className="rounded-[14px] bg-bo-ziegel-soft px-3 py-2 text-[13px] text-bo-ziegel-text" data-testid="echtbetrieb-ohne-schranke">
          <b>Echtbetrieb ohne erfüllte Voraussetzungen – es fehlt:</b> {fehlt.join(" · ")}
        </p>
      )}
      {gesperrt && (
        <p className="rounded-[14px] bg-bo-eiche-soft px-3 py-2 text-[13px] text-bo-eiche-text" data-testid="echtbetrieb-schranke">
          <b>Echtbetrieb braucht:</b> {fehlt.join(" · ")}
        </p>
      )}
      <Bestaetigen offen={frage !== null} titel={frage ? "Training einschalten" : "Training ausschalten"} text={frage ? "Ab jetzt sind Belege dieser Kasse Trainingsbelege." : "Ab jetzt sind Belege gültig und zählen zum Umsatz."} bestaetigen={frage ? "Einschalten" : "Ausschalten"} onBestaetigen={() => (setzen(frage), setFrage(null))} onAbbrechen={() => setFrage(null)} />
    </div>
  );
}

/** Eine Einstellung: Schalter (check), Betrag (int Cent), Promille als %, Text oder Auswahl. */
export function EinstellungFeld({ feld, typ, titel, beschreibung, wert: start, optionen = [], darf }) {
  const { zeige } = useToast();
  const [wert, setWert] = useState(start);
  const speichern = async (w) => {
    setWert(w);
    const r = await einstellungAction({ feld, wert: w });
    zeige(r.ok ? `${titel} gespeichert` : r.message, { art: r.ok ? "ok" : "fehler" });
    if (!r.ok) setWert(start);
  };
  if (typ === "check") return <Schalter label={titel} beschreibung={beschreibung} an={!!Number(wert)} deaktiviert={!darf} onWechsel={(n) => speichern(n ? 1 : 0)} />;
  return (
    <label className="grid gap-1.5 py-2">
      <span className="text-[15px] font-medium">{titel}</span>
      {beschreibung && <span className="text-[13px] text-bo-text-soft">{beschreibung}</span>}
      {typ === "cent" && <BetragFeld value={Number(wert) || 0} onChange={(c) => c !== null && c !== wert && speichern(c)} disabled={!darf} className="max-w-56" />}
      {typ === "promille" && (
        <span className="flex items-center gap-2">
          <input type="number" min="0" max="100" step="1" className="h-11 w-28 rounded-[12px] bg-bo-surface-2 px-3 text-[15px] tabular-nums" defaultValue={(Number(wert) || 0) / 10} disabled={!darf} onBlur={(e) => speichern(Math.round(Number(e.target.value) * 10))} aria-label={titel} />
          <span className="text-bo-text-soft">%</span>
        </span>
      )}
      {typ === "text" && <input className="h-11 rounded-[12px] bg-bo-surface-2 px-3 text-[15px]" defaultValue={wert || ""} disabled={!darf} onBlur={(e) => e.target.value !== (wert || "") && speichern(e.target.value)} aria-label={titel} />}
      {typ === "select" && (
        <select className="h-11 max-w-72 rounded-[12px] bg-bo-surface-2 px-3 text-[15px]" value={wert || ""} disabled={!darf} onChange={(e) => speichern(e.target.value)} aria-label={titel}>
          {optionen.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}
