// Bereich Marketing – Seitenrahmen (10-konzept-marketing § 13.1 „layout.js“: Seitenband, Rollen-Ausblendung).
// Die Shell wird je Seite gerendert (Sitzung kommt von der Seite, kein Schutz im Layout). Höchstens ein Band je Seite
// (§ 2.0.2): Testmodus > Fehler > Hinweis. Server-Komponente.
import Shell from "../Shell/Shell";
import Erstbesuch from "../Erstbesuch";
import { SeitenBand } from "./Bausteine";
import { bandFuer } from "@/lib/backoffice/marketing/band";

/**
 * @param {{ctx:{session:object, testmodus:boolean, einst:object}, band?:{ton:"gefahr"|"warn"|"info", inhalt:any, aktion?:any}|null,
 *   erstbesuch?:{text:string, route:string}, children:any}} p
 */
export default function Rahmen({ ctx, band = null, erstbesuch, children }) {
  const bandInhalt = bandFuer(ctx, band);
  return (
    <Shell session={ctx.session} breit>
      {bandInhalt && (
        <SeitenBand ton={bandInhalt.ton} aktion={bandInhalt.aktion} testid="marketing-band">
          {bandInhalt.inhalt}
        </SeitenBand>
      )}
      {erstbesuch && <Erstbesuch text={erstbesuch.text} route={erstbesuch.route} />}
      {children}
    </Shell>
  );
}
