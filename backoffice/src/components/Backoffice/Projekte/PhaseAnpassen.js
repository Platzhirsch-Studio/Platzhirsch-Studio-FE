"use client";
// Band „Montage läuft – Phase noch ‚Lieferung‘“ (E4): Knopf „Phase anpassen“ schiebt nach operativen Fakten
// (mit Systemeintrag). Ohne Recht bietet die Seite „Leitung bitten“ an.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { useToast } from "../Toast";
import { phaseSchiebenAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";

export default function PhaseAnpassen({ projekt }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pending, start] = useTransition();
  return (
    <Knopf size="s" laedt={pending} data-testid="phase-anpassen"
      onClick={() =>
        start(async () => {
          const r = await phaseSchiebenAction({ name: projekt });
          if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
          if (r.geschoben) zeige(`Phase auf ${statusText("PH Projekt", r.ziel)} gesetzt`, { art: "ok" });
          router.refresh();
        })
      }>
      {TEXTE.mappe.phaseAnpassen}
    </Knopf>
  );
}
