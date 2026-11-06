"use client";
// Aufgabenakte (10-konzept-zentrale § 4.1): Erledigen ohne Dialog (Strg+Enter), Status, Fällig +1/+7, Priorität,
// Beschreibung und Ergebnis speichern beim Verlassen des Felds – jede Änderung sofort mit Rückgängig (Q-C3 B).

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { useToast } from "../Toast";
import { AUFGABEN } from "@/lib/backoffice/zentrale/texte";
import { faelligAnzeige } from "@/lib/backoffice/zentrale/aufgaben";
import { aufgabeFeldAction, aufgabeStatusAction, aufgabeVerschiebenAction } from "@/lib/backoffice/zentrale/actions";

export default function AufgabeAkte({ aufgabe, heute, darfSchreiben }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [laeuft, starte] = useTransition();
  const [status, setStatus] = useState(aufgabe.status);
  const [beschreibung, setBeschreibung] = useState(String(aufgabe.beschreibung || "").replace(/<[^>]+>/g, ""));
  const [ergebnis, setErgebnis] = useState(aufgabe.ergebnis || "");
  const f = faelligAnzeige(aufgabe.faellig, heute);

  const mitUndo = (text, r, zurueck) => {
    if (!r?.ok) return zeige(r?.message || "Das hat nicht geklappt.", { art: "fehler" });
    router.refresh();
    zeige(text, { art: "ok", dauer: 8000, aktion: zurueck ? { titel: AUFGABEN.rueckgaengig, onClick: async () => { await zurueck(r.undo); router.refresh(); } } : undefined });
  };

  const setzeStatus = (s) =>
    starte(async () => {
      const alt = status;
      setStatus(s);
      const r = await aufgabeStatusAction({ quelle: "aufgabe", name: aufgabe.name, status: s, ergebnis: s === "Erledigt" ? ergebnis : undefined });
      if (!r?.ok) setStatus(alt);
      mitUndo(AUFGABEN.statusGesetzt(aufgabe.titel, AUFGABEN.spalten[s]), r, async (u) => {
        await aufgabeStatusAction({ quelle: "aufgabe", name: aufgabe.name, status: u.status });
        setStatus(u.status);
      });
    });

  useEffect(() => {
    const taste = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && darfSchreiben && status !== "Erledigt") {
        e.preventDefault();
        setzeStatus("Erledigt");
      }
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  });

  const verschiebe = (tage) =>
    starte(async () => {
      const r = await aufgabeVerschiebenAction({ name: aufgabe.name, tage });
      mitUndo(AUFGABEN.verschoben(aufgabe.titel, r?.faellig ? r.faellig.split("-").reverse().join(".") : ""), r, (u) => aufgabeVerschiebenAction({ name: aufgabe.name, datum: u.datum }));
    });

  const feld = (name, wert, alt) =>
    starte(async () => {
      if (String(wert) === String(alt ?? "")) return;
      const r = await aufgabeFeldAction({ name: aufgabe.name, feld: name, wert });
      mitUndo("Gespeichert", r, (u) => aufgabeFeldAction({ name: aufgabe.name, feld: name, wert: u.wert ?? "" }));
    });

  return (
    <div className="flex flex-col gap-6" data-testid="aufgabe-akte">
      <div className="flex flex-wrap items-center gap-3">
        {darfSchreiben && status !== "Erledigt" && (
          <Knopf variant="primary" icon="Check" kuerzel="Strg+Enter" laedt={laeuft} onClick={() => setzeStatus("Erledigt")} data-testid="aufgabe-erledigen">
            {AUFGABEN.allesErledigen}
          </Knopf>
        )}
        {darfSchreiben && status === "Erledigt" && (
          <Knopf icon="RotateCcw" onClick={() => setzeStatus("Offen")}>
            {AUFGABEN.wiederOeffnenKnopf}
          </Knopf>
        )}
        {darfSchreiben && (
          <Segment label={AUFGABEN.status} wert={status} onWechsel={setzeStatus} optionen={["Offen", "In Arbeit", "Erledigt", "Verworfen"].map((s) => ({ wert: s, titel: AUFGABEN.spalten[s] }))} groesse="s" />
        )}
      </div>
      <dl className="zb-def zb-def--3">
        <div>
          <dt>{AUFGABEN.faelligFeld}</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <span className="zb-faellig" data-ton={f.ton}>{aufgabe.faellig ? `${aufgabe.faellig.split("-").reverse().join(".")} · ${f.text}` : "–"}</span>
            {darfSchreiben && (
              <>
                <button type="button" className="zb-kennz hover:bg-bo-fill-2" onClick={() => verschiebe(1)} disabled={laeuft}>{AUFGABEN.plus1}</button>
                <button type="button" className="zb-kennz hover:bg-bo-fill-2" onClick={() => verschiebe(7)} disabled={laeuft}>{AUFGABEN.plus7}</button>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>{AUFGABEN.prioFeld}</dt>
          <dd>
            {darfSchreiben ? (
              <select className="zb-eingabe mt-1" defaultValue={aufgabe.prioritaet || "Normal"} onChange={(e) => feld("prioritaet", e.target.value, aufgabe.prioritaet)} aria-label={AUFGABEN.prioFeld}>
                {["Normal", "Hoch", "Niedrig"].map((p) => <option key={p}>{p}</option>)}
              </select>
            ) : (
              aufgabe.prioritaet || "Normal"
            )}
          </dd>
        </div>
        <div>
          <dt>{AUFGABEN.quelle.manuell === AUFGABEN.quelle[aufgabe.quelle] ? "Angelegt" : "Quelle"}</dt>
          <dd>{AUFGABEN.quelle[aufgabe.quelle] || "–"}</dd>
        </div>
      </dl>
      <div className="zb-form">
        <div className="zb-feld zb-feld--voll">
          <label htmlFor="auf-beschreibung">{AUFGABEN.beschreibung}</label>
          <textarea id="auf-beschreibung" className="zb-eingabe" value={beschreibung} readOnly={!darfSchreiben} onChange={(e) => setBeschreibung(e.target.value)} onBlur={() => darfSchreiben && feld("beschreibung", beschreibung, String(aufgabe.beschreibung || "").replace(/<[^>]+>/g, ""))} />
        </div>
        <div className="zb-feld zb-feld--voll">
          <label htmlFor="auf-ergebnis">{AUFGABEN.ergebnis}</label>
          <textarea id="auf-ergebnis" className="zb-eingabe" value={ergebnis} readOnly={!darfSchreiben} onChange={(e) => setErgebnis(e.target.value)} onBlur={() => darfSchreiben && feld("ergebnis", ergebnis, aufgabe.ergebnis)} />
        </div>
      </div>
    </div>
  );
}
