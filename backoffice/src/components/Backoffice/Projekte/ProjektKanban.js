"use client";
// Kanban „PH Projekte“ (10-konzept-projekte.md § 5.2): Spalten Anfrage … Übergabe (+ Abgeschlossen/Abgebrochen),
// Ziehen = Workflow-Aktion des Übergangs als verzögerter Commit (E2); nicht erlaubte Spalten sperrt das Kanban.
// „Abgeschlossen“ und „Abgebrochen“ öffnen nur die Mappe (Prüfliste/Assistent), nie die nackte Aktion.

import { useRouter } from "next/navigation";
import Kanban from "../Kanban/Kanban";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { phasePlanenAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export default function ProjektKanban({ spalten, uebergaenge, statusTon, kartenFelder }) {
  const router = useRouter();
  const { starte } = useVerzoegerterCommit();
  const onVerschiebe = async ({ name, nach, action }) => {
    if (nach === "Abgeschlossen" || nach === "Abgebrochen") {
      router.push(`/projekte/${encodeURIComponent(name)}`);
      return { ok: false, message: nach === "Abgeschlossen" ? TEXTE.liste.kanbanAbschluss : TEXTE.liste.kanbanAbbruch };
    }
    const r = await phasePlanenAction({ name, aktion: action });
    if (!r?.ok) return r || { ok: false };
    starte(`${action} · ${name}`, { token: r.token, ms: r.ms, objekt: r.objekt, gruppe: "projekte.phase", sammel: (n) => `${n} Projekte verschoben`, fehlerText: action, onFehler: () => router.refresh(), onVerworfen: () => router.refresh() });
    return { ok: true };
  };
  return <Kanban doctype="PH Projekt" spalten={spalten} kartenFelder={kartenFelder} titelFeld="titel" statusTon={statusTon} uebergaenge={uebergaenge} hrefBasis="/projekte" onVerschiebe={onVerschiebe} />;
}
