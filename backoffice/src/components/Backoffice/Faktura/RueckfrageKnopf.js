"use client";
// Knopf mit Rückfrage für Monatsroutinen (§ 3.8 UVA berechnen/übergeben, § 3.9 Monat abschließen): Titel als Frage
// mit Fakten, Primär nennt die Folge (Q-C6). Gesperrt mit sichtbarem Grund, wenn die Fähigkeit fehlt (Q-A7).

import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Dialog } from "../Overlay";
import { useToast } from "../Toast";
import { uvaAction, monatAbschliessenAction } from "@/lib/backoffice/faktura/actions";
import { useVorgang } from "./hilfen";

export default function RueckfrageKnopf({ art, name, monat, titel, frage, text, ergebnis, deaktiviert = false, grund, primaer = true, testid }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [offen, setOffen] = useState(false);
  const v = useVorgang();
  async function los() {
    await v.start(async () => {
      const r = art === "abschliessen" ? await monatAbschliessenAction({ monat, bestaetigt: true }) : await uvaAction({ name, monat, aktion: art === "uva-uebergeben" ? "uebergeben" : "berechnen" });
      setOffen(false);
      zeige(r.ok ? ergebnis || "Erledigt" : r.message, { art: r.ok ? "ok" : "fehler" });
      router.refresh();
    });
  }
  return (
    <>
      <Knopf variant={primaer ? "primary" : "secondary"} onClick={() => setOffen(true)} disabled={deaktiviert} grund={deaktiviert ? grund : null} data-testid={testid}>
        {titel}
      </Knopf>
      <Dialog offen={offen} onSchliessen={() => !v.laeuft && setOffen(false)} groesse="sm" art="bestaetigen" titel={frage} text={text} sperren={v.laeuft} fuss={<><Knopf variant="secondary" onClick={() => setOffen(false)}>Abbrechen</Knopf><Knopf variant="primary" onClick={los} laedt={v.zeigen}>{titel}</Knopf></>} />
    </>
  );
}
