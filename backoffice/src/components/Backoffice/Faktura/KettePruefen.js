"use client";
// „Buchungen auf Veränderung prüfen“ (§ 3.11 Journal, Leitung): Toast „Geprüft: n Einträge, keine Abweichung“ oder
// Hinweis mit der ersten Bruchstelle.

import { useState } from "react";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { AKTION, JOURNAL } from "@/lib/backoffice/faktura/texte";
import { kettePruefenAction } from "@/lib/backoffice/faktura/actions";
import { useVorgang } from "./hilfen";

export default function KettePruefen() {
  const { zeige } = useToast();
  const v = useVorgang();
  const [bruch, setBruch] = useState(null);
  return (
    <span className="flex flex-col items-end gap-1">
      <Knopf
        variant="secondary"
        icon="Shield"
        laedt={v.zeigen}
        onClick={() =>
          v.start(async () => {
            const r = await kettePruefenAction();
            if (!r.ok) return zeige(r.message, { art: "fehler" });
            if (r.bruch) return setBruch(r.bruch);
            zeige(JOURNAL.geprueft(r.geprueft), { art: "ok" });
          })
        }
        data-testid="kette-pruefen"
      >
        {AKTION.kettePruefen}
      </Knopf>
      {bruch && <span className="text-[12px] text-bo-ziegel-text">{JOURNAL.bruch(bruch)}</span>}
    </span>
  );
}
