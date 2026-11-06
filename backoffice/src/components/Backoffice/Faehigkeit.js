import { useId } from "react";
import { cookies } from "next/headers";
import { IS_PRODUCTION, backofficeMode } from "@/lib/backoffice/config";
import { darstellung, faehigkeit } from "@/lib/backoffice/faehigkeiten";
import FaehigkeitHinweis from "./FaehigkeitHinweis";

// <Faehigkeit> (G-04, Q-A7, K-19) – Server Component. Entscheidet, ob ein Knopf erscheint:
//   an                    → Kind unverändert
//   aus, fachlich erwartet → Kind deaktiviert, darunter „Noch nicht verfügbar – {Ersatzweg}“ (Link)
//   aus, nicht erwartet / ohne Recht → nichts
//
// Am besten mit Funktion als Kind (der Knopf bekommt disabled + grund selbst, Q-I5):
//   <Faehigkeit session={session} id="kassa.retoure" katalog={KASSA}>
//     {({ deaktiviert, grund }) => <Knopf disabled={deaktiviert} grund={grund}>Zurücknehmen</Knopf>}
//   </Faehigkeit>
// Mit normalem Kind wird der Bereich als <fieldset disabled> gesperrt (Knöpfe, Felder). Links sperrt ein
// fieldset nicht – für <Knopf href> deshalb immer die Funktions-Form nutzen (Knopf rendert dann span role=link).
//
// QA (MASTER § 5.5 „Fähigkeiten an/aus“): im Mock außerhalb der Produktion überstimmt das Cookie
// `ph_bo_faehigkeiten` (gleiche Syntax wie BACKOFFICE_MOCK_FAEHIGKEITEN) – Screenshots ohne Server-Neustart.

export const FAEHIGKEITEN_COOKIE = "ph_bo_faehigkeiten";

/** Mock-Überschreibung aus dem Cookie (nur Mock, nur Entwicklung), sonst null. */
export async function mockUeberschreibung() {
  if (IS_PRODUCTION || backofficeMode() !== "mock") return null;
  try {
    return (await cookies()).get(FAEHIGKEITEN_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

/**
 * @param {{session:object, id:string, katalog?:object, client?:object, status?:object,
 *   children: import("react").ReactNode | ((z:{an:boolean, deaktiviert:boolean, grund:import("react").ReactNode, status:object}) => import("react").ReactNode)}} props
 */
export default async function Faehigkeit({ session, id, katalog, client, status, children }) {
  const s = status || (await faehigkeit(session, id, { katalog, client, ueberschreibung: await mockUeberschreibung() }));
  return <FaehigkeitInhalt status={s}>{children}</FaehigkeitInhalt>;
}

function FaehigkeitInhalt({ status, children }) {
  const hinweisId = useId();
  const d = darstellung(status);
  if (d === "aus") return null;
  const deaktiviert = d === "deaktiviert";
  if (typeof children === "function") {
    return children({ an: !deaktiviert, deaktiviert, status, grund: deaktiviert ? <FaehigkeitHinweis status={status} /> : null });
  }
  if (!deaktiviert) return children;
  return (
    <span className="inline-flex max-w-full flex-col items-start gap-1" data-faehigkeit={status.id} data-zustand="deaktiviert">
      <fieldset disabled aria-describedby={hinweisId} className="m-0 inline-flex min-w-0 border-0 p-0 opacity-50">
        {children}
      </fieldset>
      <FaehigkeitHinweis status={status} id={hinweisId} />
    </span>
  );
}
