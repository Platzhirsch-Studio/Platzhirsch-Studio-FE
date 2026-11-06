// Rahmen jeder Faktura-Seite (Server Component): Shell v2 (Material-Leiste, Pillen-Reiter aus bereiche/faktura.js),
// Aktions-Host (Dialoge, verzögerte Commits), Seitenkopf im Lounge-Muster, Erstbesuch-Satz und – solange der Bereich
// im Testbetrieb läuft – kein eigener Testhinweis (das Testband der Shell genügt).

import Shell from "../Shell/Shell";
import Seitenkopf from "../Seitenkopf";
import Erstbesuch from "../Erstbesuch";
import FakturaAktionen from "./Aktionen";
import { ERSTBESUCH } from "@/lib/backoffice/faktura/texte";
import "./faktura.css";

/**
 * @param {{ctx:{session:object, rolle:object, schalter:object}, titel:string, krumen?:Array<{titel:string, href?:string}>, ueber?:string,
 *   untertitel?:string, kennzahlen?:Array<{wert:string,text:string}>, aktionen?:any, titelZusatz?:any, variante?:string, route?:string,
 *   mahnvorschlag?:object[], offeneBelege?:object[], auftragRechnungen?:object[], ohneKopf?:boolean, children:any}} p
 */
export default function FakturaSeite({ ctx, titel, krumen, ueber, untertitel, kennzahlen, aktionen, titelZusatz, variante, route, mahnvorschlag, offeneBelege, auftragRechnungen, ohneKopf = false, children }) {
  const k = krumen || [{ titel: "Faktura", href: "/faktura" }, { titel }];
  return (
    <Shell session={ctx.session} breit>
      <FakturaAktionen rolle={ctx.rolle} schalter={ctx.schalter} mahnvorschlag={mahnvorschlag} offeneBelege={offeneBelege} auftragRechnungen={auftragRechnungen}>
        <div className="bo-fk min-w-0" data-bereich="faktura">
          {!ohneKopf && (
            <Seitenkopf titel={titel} krumen={k} ueber={ueber} untertitel={untertitel} kennzahlen={kennzahlen} titelZusatz={titelZusatz} variante={variante}>
              {aktionen}
            </Seitenkopf>
          )}
          {route && ERSTBESUCH[route] && <Erstbesuch text={ERSTBESUCH[route]} route={route} />}
          {children}
        </div>
      </FakturaAktionen>
    </Shell>
  );
}
