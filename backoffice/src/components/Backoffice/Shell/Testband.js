// Testband v2 (QA-Befund 10, Lounge): ruhige Eiche-Pille im Fluss als erste Zeile des Inhalts (unter der
// Kopfzeile, rechts der Leiste) – überdeckt nichts, die Kopfzeile bleibt bündig mit dem Leisten-Logo. Mock oder Frappe-
// Testsite (Host mit test/staging/localhost); Telefon: Kurzform.
import { TEXTE } from "./texte";

export default function Testband({ modus, host }) {
  if (modus !== "mock" && !/test|staging|localhost/.test(host || "")) return null;
  const mock = modus === "mock";
  return (
    <div className="bo-schale-band" role="status" data-testid="testband">
      <span className="bo-schale-band__pille">
        <span className="bo-schale-band__punkt" aria-hidden="true" />
        <strong>{mock ? TEXTE.testmodus : TEXTE.testsystem}</strong>
        <span className="bo-schale-band__lang">{mock ? TEXTE.testmodusLang : TEXTE.testsystemLang(host)}</span>
        <span className="bo-schale-band__kurz">{mock ? TEXTE.testmodusKurz : host}</span>
      </span>
    </div>
  );
}
