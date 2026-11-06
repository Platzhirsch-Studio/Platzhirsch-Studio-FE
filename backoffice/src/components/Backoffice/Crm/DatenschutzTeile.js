"use client";
// Datenschutzanfrage (§ 3.11): Schritte Identität · Bearbeiten · Prüfen · Versenden · Abschließen; Leitung führt
// sie aus (Mitarbeiter sehen den Stand). Ablehnen nur mit Pflichtgrund (Dialog).

import { useState } from "react";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import { Feld } from "./Teile";
import { useCrmAktion } from "./useCrmAktion";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { datenschutzSchrittAction } from "@/lib/backoffice/crm/actions";

export function DatenschutzSchritte({ anfrage, leitung }) {
  const { fuehre, laeuft } = useCrmAktion();
  const [dialog, setDialog] = useState(null);
  const [text, setText] = useState("");
  const a = anfrage;
  const offen = ["Offen", "In Arbeit"].includes(a.status);
  const schritt = (s, extra = {}) => fuehre(() => datenschutzSchrittAction({ name: a.name, schritt: s, ...extra }), { text: "Gespeichert", fehlerText: "Datenschutzanfrage" });
  if (!offen) return null;
  if (!leitung) return <p className="text-[14px] text-bo-text-soft">{T.datenschutz.nurLeitung}</p>;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="crm-dsa-aktionen">
      {!Number(a.identitaet_geprueft) && <Knopf variant="secondary" icon="BadgeCheck" laedt={laeuft} onClick={() => schritt("identitaet")}>{T.datenschutz.identitaet}</Knopf>}
      {a.status === "Offen" && <Knopf variant="secondary" laedt={laeuft} onClick={() => schritt("bearbeiten")}>Bearbeiten</Knopf>}
      <Knopf variant="primary" icon="Check" onClick={() => (setText(""), setDialog("abschliessen"))} data-testid="crm-dsa-abschliessen">Abschließen</Knopf>
      <Knopf variant="ghost" onClick={() => (setText(""), setDialog("ablehnen"))}>Ablehnen …</Knopf>
      {dialog && (
        <Dialog offen onSchliessen={() => setDialog(null)} titel={dialog === "ablehnen" ? "Datenschutzanfrage ablehnen?" : "Datenschutzanfrage abschließen?"} groesse="sm"
          fuss={<><Knopf variant="ghost" onClick={() => setDialog(null)}>{T.knopf.abbrechen}</Knopf><Knopf variant={dialog === "ablehnen" ? "danger-solid" : "primary"} laedt={laeuft} onClick={async () => {
            const r = await schritt(dialog, dialog === "ablehnen" ? { grund: text } : { ergebnis: text });
            if (r?.ok) setDialog(null);
          }}>{dialog === "ablehnen" ? "Ablehnen" : "Abschließen"}</Knopf></>}>
          <Feld label={dialog === "ablehnen" ? "Grund *" : "Ergebnis"} eingelassen><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></Feld>
        </Dialog>
      )}
    </div>
  );
}
