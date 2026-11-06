import Link from "next/link";
import cx from "./cx";

// Hinweiszeile unter einem deaktivierten Knopf (G-04, Q-A7, Q-I5): 12 px, gedämpft, sichtbar – nie nur Tooltip.
// „Noch nicht verfügbar – {Ersatzweg}“, der Ersatzweg als Link, wenn es ein Ziel gibt. Server- und
// Client-tauglich (keine Hooks, keine Server-Importe), bekommt den Status von faehigkeit() als Prop.

/**
 * @param {{status:{an:boolean, grund?:string|null, ersatz?:{titel:string, href?:string}|null}, id?:string, className?:string}} props
 */
export default function FaehigkeitHinweis({ status, id, className }) {
  if (!status || status.an) return null;
  // faehigkeit() setzt grund immer („Noch nicht verfügbar“ oder der Grund der Definition); kein Server-Import hier,
  // damit die Zeile auch in Client-Komponenten (z. B. Listen-Massenaktionen) nutzbar bleibt.
  const kopf = status.grund || "Noch nicht verfügbar";
  const ersatz = status.ersatz;
  return (
    <span id={id} className={cx("text-xs leading-4 text-bo-text-faint", className)} data-testid="faehigkeit-hinweis">
      {kopf}
      {ersatz?.titel && (
        <>
          {" – "}
          {ersatz.href ? (
            <Link href={ersatz.href} className="text-bo-text-soft underline decoration-bo-line-strong underline-offset-2 hover:text-bo-text hover:decoration-current">
              {ersatz.titel}
            </Link>
          ) : (
            ersatz.titel
          )}
        </>
      )}
    </span>
  );
}
