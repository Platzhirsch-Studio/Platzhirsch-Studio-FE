import cx from "../cx";
import { brauchtRing, schriftAuf, stufeMonogramm } from "@/lib/backoffice/kundenkarte/labels";
import "./kundenkarte.css";

// StufenKennzeichen (Konzept §10, Lounge §6 „Kundenkarte“): Pille mit Bodoni-Monogramm im Kreis in der
// Stufenfarbe + Stufenname. Bewusst keine Statusform (kein Punkt/Haken/Dreieck) – Stufe ist kein Status.
// Server-tauglich; als Knopf (Popover „Stufe festlegen“) über `als="button"` + Props des Auslösers.

/** CSS-Variablen aus der Stufenfarbe (Datenwert aus PH Kundenkarte Stufe). */
export function stufenStil(farbe) {
  if (!farbe) return undefined;
  return { "--kk-farbe": farbe, "--kk-schrift": schriftAuf(farbe) };
}

/**
 * @param {object} p
 * @param {string} p.stufe              Stufenname („Platzhirsch Plus“)
 * @param {string} [p.farbe]            Hex aus der Stufe
 * @param {"s"|"m"|"l"} [p.groesse]
 * @param {string} [p.zusatz]           z. B. „von Hand“ (gedämpft)
 * @param {"span"|"button"} [p.als]
 */
export default function StufenKennzeichen({ stufe, farbe, groesse = "m", zusatz, als = "span", className, testid, ...rest }) {
  const Tag = als;
  if (!stufe) return <span className="text-bo-text-faint">–</span>;
  return (
    <Tag
      className={cx("bo-kk-stufe", className)}
      data-groesse={groesse}
      data-ring={farbe && brauchtRing(farbe) ? "" : undefined}
      style={stufenStil(farbe)}
      data-testid={testid}
      {...(als === "button" ? { type: "button", "aria-haspopup": "dialog" } : {})}
      {...rest}
    >
      <span className="bo-kk-stufe__mono" aria-hidden="true">
        {stufeMonogramm(stufe)}
      </span>
      <span className="min-w-0 truncate">{stufe}</span>
      {zusatz && <span className="bo-kk-stufe__zusatz">· {zusatz}</span>}
    </Tag>
  );
}
