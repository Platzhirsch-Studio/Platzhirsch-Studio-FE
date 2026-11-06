"use client";
// „Schaden melden …“ (§ 4.4, schaden_melden): Beschreibung (Pflicht), Haken Regress beim Spediteur → Servicefall.
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import Schalter from "../Schalter";
import useAktion from "./useAktion";
import { schadenAction } from "@/lib/backoffice/sortiment/actions";
import { WARENEINGANG } from "@/lib/backoffice/sortiment/texte";

export default function SchadenMelden({ name, vorbelegt = "" }) {
  const sp = useSearchParams();
  const [offen, setOffen] = useState(sp.get("dialog") === "schaden");
  const [text, setText] = useState(vorbelegt);
  const [regress, setRegress] = useState(false);
  const { sofort, laeuft } = useAktion();
  return (
    <>
      <Knopf variant="primary" icon="ShieldAlert" onClick={() => setOffen(true)} data-testid="schaden-melden">
        {WARENEINGANG.schadenMelden}
      </Knopf>
      <Dialog
        offen={offen}
        onSchliessen={() => setOffen(false)}
        titel={WARENEINGANG.schadenMelden.replace(" …", "")}
        text="Legt einen Servicefall an; mit Regress zusätzlich die Forderung an den Spediteur."
        groesse="md"
        sperren={laeuft}
        fuss={
          <>
            <Knopf variant="secondary" onClick={() => setOffen(false)}>
              Abbrechen
            </Knopf>
            <Knopf variant="primary" laedt={laeuft} disabled={text.trim().length < 5} grund={text.trim().length < 5 ? "Beschreibung mit mindestens 5 Zeichen" : undefined} onClick={async () => (await sofort(() => schadenAction({ name, beschreibung: text, regress }), { ok: "Schaden gemeldet" }))?.ok && setOffen(false)}>
              Melden
            </Knopf>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="bo-sor-feld">
            <label htmlFor="sm-text">Beschreibung</label>
            <textarea id="sm-text" className="bo-sor-eingabe" rows={4} value={text} onChange={(e) => setText(e.target.value)} />
            <span className="bo-sor-feld__hinweis">{WARENEINGANG.fotoHinweis}</span>
          </div>
          <Schalter label="Regress beim Spediteur" beschreibung="Bei Transportschaden" an={regress} onWechsel={setRegress} />
        </div>
      </Dialog>
    </>
  );
}
