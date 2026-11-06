"use client";
// Dialog für Produkt-Workflows mit Vorprüfung (§ 5.1 „Veröffentlichen“): „6 Produkte veröffentlichen?“,
// „4 möglich · 2 gesperrt“ mit Grund je Zeile, Hinweis zur Website, danach verzögerter Commit 8 s.
// Derselbe Dialog für Knopf, Massenaktion und Kanban-Ziel (WCAG 2.5.7).
import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import useAktion from "./useAktion";
import { produktVorpruefungAction, produktWorkflowAction } from "@/lib/backoffice/sortiment/actions";
import { GLOSSAR, VEROEFFENTLICHEN, WORKFLOW_TOAST } from "@/lib/backoffice/sortiment/texte";

const TOAST = {
  "Prüfen": WORKFLOW_TOAST.pruefen,
  "Veröffentlichen": VEROEFFENTLICHEN.toast,
  Pausieren: WORKFLOW_TOAST.pausieren,
  Reaktivieren: WORKFLOW_TOAST.reaktivieren,
  "Zurück auf Entwurf": () => WORKFLOW_TOAST.entwurf,
  "Auslaufen lassen": () => WORKFLOW_TOAST.auslaufen,
};

/** Toast-Text einer Workflow-Aktion für n Produkte. */
export function workflowToast(aktion, n) {
  return (TOAST[aktion] || (() => GLOSSAR.produktAktion[aktion] || aktion))(n);
}

/**
 * @param {{offen:boolean, namen:string[], aktion:string, onSchliessen:()=>void, onGeplant?:(namen:string[])=>void, onVerworfen?:()=>void}} p
 */
export default function WorkflowDialog({ offen, namen = [], aktion, onSchliessen, onGeplant, onVerworfen }) {
  const { verzoegert, laeuft } = useAktion();
  const [pruefung, setPruefung] = useState(null);
  const schluessel = `${aktion}:${namen.join(",")}`;

  useEffect(() => {
    if (!offen) return undefined;
    let ab = false;
    produktVorpruefungAction({ namen, aktion }).then((r) => {
      if (!ab) setPruefung({ schluessel, r });
    });
    return () => {
      ab = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, schluessel]);

  const aktuell = pruefung?.schluessel === schluessel ? pruefung.r : null;
  const moeglich = aktuell?.ok ? aktuell.moeglich : [];
  const gesperrt = aktuell?.ok ? aktuell.gesperrt : [];
  const label = GLOSSAR.produktAktion[aktion] || aktion;
  const titel = aktion === "Veröffentlichen" ? VEROEFFENTLICHEN.titel(namen.length) : namen.length === 1 ? `${label}?` : `${namen.length} Produkte: ${label}?`;

  async function los() {
    const liste = moeglich;
    const r = await verzoegert(() => produktWorkflowAction({ namen: liste, aktion }), { text: workflowToast(aktion, liste.length), fehlerText: label, onVerworfen });
    if (r?.ok) {
      onGeplant?.(liste);
      onSchliessen();
    }
  }

  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={titel}
      text={aktuell?.ok ? VEROEFFENTLICHEN.moeglich(moeglich.length, gesperrt.length) : "Wird geprüft …"}
      groesse="md"
      sperren={laeuft}
      testid="workflow-dialog"
      fuss={
        <>
          <Knopf variant="secondary" onClick={onSchliessen}>
            Abbrechen
          </Knopf>
          <Knopf variant="primary" onClick={los} laedt={laeuft} disabled={!moeglich.length} grund={aktuell?.ok && !moeglich.length ? VEROEFFENTLICHEN.keiner : undefined} data-testid="workflow-bestaetigen">
            {aktion === "Veröffentlichen" ? VEROEFFENTLICHEN.knopf(moeglich.length || namen.length) : label}
          </Knopf>
        </>
      }
    >
      {aktuell && !aktuell.ok && <p className="bo-sor-unter bo-sor-gefahr">{aktuell.message}</p>}
      {gesperrt.length > 0 && (
        <ul className="mb-4 flex flex-col gap-1 rounded-[16px] bg-bo-fill p-2" aria-label="Gesperrt">
          {gesperrt.map((g) => (
            <li key={g.name} className="flex items-start gap-3 rounded-[12px] px-2 py-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-bo-eiche-text" strokeWidth={1.75} aria-hidden="true" />
              <span className="min-w-0">
                <Link href={`/sortiment/produkte/${encodeURIComponent(g.name)}`} className="font-medium underline-offset-2 hover:underline">
                  {g.titel}
                </Link>
                <span className="bo-sor-unter block">{g.grund}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {moeglich.length > 0 && (
        <p className="flex items-center gap-2 text-[14px] text-bo-text-soft">
          <CircleCheck className="size-4 text-bo-salbei-text" strokeWidth={1.75} aria-hidden="true" />
          {aktion === "Veröffentlichen" || aktion === "Reaktivieren" || aktion === "Pausieren" ? VEROEFFENTLICHEN.hinweis : `${moeglich.length} ${moeglich.length === 1 ? "Produkt" : "Produkte"} bereit.`}
        </p>
      )}
    </Dialog>
  );
}
