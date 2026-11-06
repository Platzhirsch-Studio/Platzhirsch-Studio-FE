"use client";
// Erstbesuch (G-27, MASTER C-11): ein ruhiges Band unter dem Seitenkopf beim ersten Besuch einer Seite –
// 1–2 Sätze, „Mehr“ (öffnet das Hilfe-Panel oder einen Link) und „Verstanden“. Gemerkt je Benutzer und
// Route im Browser (`ph-bo:<benutzer-hash>:erstbesuch:<route>`). Nie Touren mit Schritten.
// Erscheint erst nach dem Einhängen (Server kennt den Speicher nicht) und belegt bis dahin keinen Platz.
//
//   <Seitenkopf titel="Anfragen" … />
//   <Erstbesuch text={TEXTE.erstbesuch} />                       // Route = aktuelle Seite
//   <Erstbesuch route="/crm/anfragen" text="…" mehrHref="/hilfe/crm/anfragen" />

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import Knopf from "./Knopf";
import { useShell } from "./Shell/ShellKontext";
import { oeffneHilfe } from "./Shell/HilfePanel";
import { erstbesuchSchluessel } from "./Shell/logik";

export const ERSTBESUCH_TEXTE = { mehr: "Mehr", verstanden: "Verstanden", label: "Hinweis zu dieser Seite" };

export { erstbesuchSchluessel };

/**
 * @param {{text:React.ReactNode, route?:string, mehrHref?:string, titel?:string}} props
 */
export default function Erstbesuch({ text, route, mehrHref, titel }) {
  const pfad = usePathname();
  const { benutzerHash } = useShell();
  const schluessel = erstbesuchSchluessel(benutzerHash, route || pfad);
  const [sichtbar, setSichtbar] = useState(false);

  useEffect(() => {
    let gesehen = true;
    try {
      gesehen = localStorage.getItem(schluessel) === "1";
    } catch {
      gesehen = true; // ohne Speicher nie aufdrängen
    }
    setSichtbar(!gesehen); // eslint-disable-line react-hooks/set-state-in-effect -- Speicher erst nach dem Einhängen lesbar
  }, [schluessel]);

  if (!sichtbar || !text) return null;
  const verstanden = () => {
    try {
      localStorage.setItem(schluessel, "1");
    } catch {
      // nur für diesen Aufruf ausblenden
    }
    setSichtbar(false);
  };
  return (
    <aside className="bo-schale-erstbesuch bo-erscheinen" aria-label={ERSTBESUCH_TEXTE.label} data-testid="erstbesuch">
      <span className="bo-schale-erstbesuch__symbol" aria-hidden="true">
        <Icon name="Sparkles" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        {titel && <p className="bo-schale-erstbesuch__titel">{titel}</p>}
        <p className="bo-schale-erstbesuch__text">{text}</p>
      </div>
      <div className="bo-schale-erstbesuch__knoepfe">
        {mehrHref ? (
          <Knopf href={mehrHref} variant="ghost" size="s">
            {ERSTBESUCH_TEXTE.mehr}
          </Knopf>
        ) : (
          <Knopf variant="ghost" size="s" onClick={oeffneHilfe}>
            {ERSTBESUCH_TEXTE.mehr}
          </Knopf>
        )}
        <Knopf variant="secondary" size="s" onClick={verstanden} data-testid="erstbesuch-verstanden">
          {ERSTBESUCH_TEXTE.verstanden}
        </Knopf>
      </div>
    </aside>
  );
}
