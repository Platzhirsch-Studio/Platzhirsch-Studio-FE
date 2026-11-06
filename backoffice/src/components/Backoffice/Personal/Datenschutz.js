"use client";
// Löschfristen-Cockpit (Konzept § 5.10): „Fällige jetzt löschen (n)“ mit Tippfeld-Bestätigung und Fortschritt im
// Knopf; bei 0 deaktiviert mit sichtbarem Grund (nächster Löschlauf 03:15).

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { bewerberDatenLoeschenAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import "./personal.css";

export function FaelligeLoeschen({ namen = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [offen, setOffen] = useState(false);
  const [tipp, setTipp] = useState("");
  const [fehler, setFehler] = useState(null);
  const [laeuft, start] = useTransition();
  const n = namen.length;
  return (
    <>
      <Knopf variant="primary" icon="Trash2" disabled={!n} grund={!n ? T.datenschutz.nichtsFaellig : undefined} onClick={() => setOffen(true)} data-testid="per-faellige-loeschen">
        {T.datenschutz.jetztLoeschen(n)}
      </Knopf>
      <Dialog
        offen={offen}
        onSchliessen={() => setOffen(false)}
        titel={`${n} ${n === 1 ? "Bewerbung" : "Bewerbungen"} endgültig löschen?`}
        rolle="alertdialog"
        sperren={laeuft}
        fuss={
          <>
            <Knopf variant="ghost" onClick={() => setOffen(false)} autoFocus>{T.abbrechen}</Knopf>
            <Knopf
              variant="danger-solid"
              laedt={laeuft}
              disabled={tipp.trim().toLowerCase() !== "löschen"}
              onClick={() =>
                start(async () => {
                  const r = await bewerberDatenLoeschenAction({ namen, bestaetigung: tipp });
                  if (!r.ok) return setFehler(r.message);
                  setOffen(false);
                  zeige(T.datenschutz.geloescht(r.ergebnisse.filter((e) => e.ok).length), { art: "ok" });
                  router.refresh();
                })
              }
            >
              {T.akte.loeschenKnopf}
            </Knopf>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ul className="list-disc pl-5 text-[14px] leading-6 text-bo-text-soft">{T.akte.loeschenListe.map((x) => <li key={x}>{x}</li>)}</ul>
          <label className="bo-per-feld"><span>{T.akte.tippe}</span><input className="bo-per-auswahl" value={tipp} onChange={(e) => setTipp(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} /></label>
          {fehler && <span className="bo-per-feld__fehler">{fehler}</span>}
        </div>
      </Dialog>
    </>
  );
}
