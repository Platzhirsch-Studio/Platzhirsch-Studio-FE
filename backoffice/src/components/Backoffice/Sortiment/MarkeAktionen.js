"use client";
// Markenakte (§ 4.2): „Bildfreigabe anfordern …“ (Mail an den Hersteller, verzögert 8 s) und „Neue Bestellung“.
import { useState } from "react";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import useAktion from "./useAktion";
import { bildfreigabeAnfordernAction } from "@/lib/backoffice/sortiment/actions";
import { MARKEN } from "@/lib/backoffice/sortiment/texte";

export default function MarkeAktionen({ marke, email, lieferant, bildfreigabeOffen, darfSchreiben }) {
  const [offen, setOffen] = useState(false);
  const [an, setAn] = useState(email || "");
  const { verzoegert, laeuft } = useAktion();
  if (!darfSchreiben) return null;
  return (
    <span className="flex flex-wrap gap-2">
      {lieferant && (
        <Knopf href={`/sortiment/bestellungen/neu?lieferant=${encodeURIComponent(lieferant)}`} icon="ScrollText">
          Neue Bestellung
        </Knopf>
      )}
      {bildfreigabeOffen && (
        <Knopf variant="primary" icon="Mail" onClick={() => setOffen(true)} data-testid="bildfreigabe-anfordern">
          {MARKEN.bildfreigabeAnfordern}
        </Knopf>
      )}
      <Dialog
        offen={offen}
        onSchliessen={() => setOffen(false)}
        titel="Bildfreigabe anfordern?"
        text="Bitte um schriftliche Freigabe der Produkt- und Markenbilder für Website, Social und Druck."
        groesse="md"
        fuss={
          <>
            <Knopf variant="secondary" onClick={() => setOffen(false)}>
              Abbrechen
            </Knopf>
            <Knopf variant="primary" laedt={laeuft} disabled={!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(an)} onClick={async () => (await verzoegert(() => bildfreigabeAnfordernAction({ marke, empfaenger: an }), { text: `Anfrage an ${an} gesendet` }))?.ok && setOffen(false)}>
              Anfordern
            </Knopf>
          </>
        }
      >
        <div className="bo-sor-feld">
          <label htmlFor="bf-an">An</label>
          <input id="bf-an" type="email" className="bo-sor-eingabe" value={an} onChange={(e) => setAn(e.target.value)} />
        </div>
      </Dialog>
    </span>
  );
}
