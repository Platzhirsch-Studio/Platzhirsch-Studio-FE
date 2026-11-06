"use client";
// Ein Knopf für eine Bereichs-Aktion auf einer Akte (Planung, Rendering, Nachtrag, Abnahme, Referenz, Fremdgewerk,
// Dokument, Aufgabe, Mangel). Workflow-Vorwärtsaktionen laufen als verzögerter Commit, Feldwerte sofort;
// Rückfragen nur für Bestätigungsfälle (Q-C6) mit Fakten-Text.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Bestaetigen } from "../Overlay";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import * as A from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

const AKTIONEN = {
  planung: (a) => A.planungAction(a),
  rendering: (a) => A.renderingStatusAction(a),
  "nachtrag-vorlegen": (a) => A.nachtragVorlegenAction(a),
  "abnahme-abschliessen": (a) => A.abnahmeAbschliessenAction(a),
  referenz: (a) => A.referenzAction(a),
  fremdgewerk: (a) => A.fremdgewerkStatusAction(a),
  dokument: (a) => A.dokumentPortalAction(a),
  aufgabe: (a) => A.aufgabeStatusAction(a),
  mangel: (a) => A.mangelAction(a),
  montage: (a) => A.montageStatusAction(a),
  leistung: (a) => A.leistungAction(a),
};

/**
 * @param {{art:keyof AKTIONEN, args:object, children:any, variant?:string, size?:string, icon?:string, frage?:{titel:string,text?:string,bestaetigen:string,gefaehrlich?:boolean},
 *   ok?:string, commitText?:string, weiter?:string, testid?:string, disabled?:boolean, grund?:any}} p
 */
export default function AktionKnopf({ art, args, children, variant = "secondary", size = "m", icon, frage, ok, commitText, weiter, testid, disabled, grund }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [pending, start] = useTransition();
  const [offen, setOffen] = useState(false);
  const los = () =>
    start(async () => {
      setOffen(false);
      const r = await AKTIONEN[art]?.(args);
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      if (r.token) starte(commitText || ok || String(children), { token: r.token, ms: r.ms, objekt: r.objekt, onErfolg: () => router.refresh() });
      else if (ok) zeige(ok, { art: "ok" });
      if (weiter) router.push(typeof weiter === "string" ? weiter : r.href);
      else router.refresh();
    });
  return (
    <>
      <Knopf variant={variant} size={size} icon={icon} laedt={pending} onClick={() => (frage ? setOffen(true) : los())} data-testid={testid} disabled={disabled} grund={grund}>
        {children}
      </Knopf>
      {frage && <Bestaetigen offen={offen} titel={frage.titel} text={frage.text} bestaetigen={frage.bestaetigen} gefaehrlich={frage.gefaehrlich} laeuft={pending} onBestaetigen={los} onAbbrechen={() => setOffen(false)} />}
    </>
  );
}
