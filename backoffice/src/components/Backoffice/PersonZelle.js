import Link from "next/link";
import cx from "./cx";
import Avatar from "./Avatar";
import { Icon } from "./icons";
import { personAnzeige, personGroesse } from "@/lib/backoffice/akte/person";
import "./Akte/akte.css";

// PersonZelle (G-28, Team P0-5a, MASTER C-19): eine Person überall gleich – Initialen-Avatar im
// Materialverlauf (24 oder 32, Farbe stabil aus dem Namen, nie Fotos), Name, optional Rolle.
// Abwesenheit fremder Personen nur als „abwesend“ (nie die Art, Q-A12/Personal); die eigene Person
// (`eigen`) darf Art und Ende sehen. Ohne Person: „Niemand zugewiesen“ mit leerem Kreis.
// Server- und Client-tauglich.

/**
 * @param {object} p
 * @param {string|{name?:string, kuerzel?:string, material?:string, rolle?:string, email?:string,
 *   abwesend?: boolean|{art?:string, bis?:string}}|null} p.person
 * @param {24|32} [p.groesse]        Avatar 24 (Tabellen, dicht) oder 32 (Standard)
 * @param {string} [p.rolle]         überschreibt person.rolle („Beratung“, „Montageleitung“)
 * @param {boolean} [p.eigen]        angemeldete Person – Abwesenheit mit Art
 * @param {boolean} [p.nurAvatar]    nur der Kreis (Name als Tooltip/Screenreader)
 * @param {string} [p.href]
 * @param {string} [p.leerText]      Text ohne Person (Standard „Niemand zugewiesen“)
 */
export default function PersonZelle({ person, groesse = 32, rolle, eigen = false, nurAvatar = false, href, leerText, className, testid }) {
  const g = personGroesse(groesse);
  const a = personAnzeige(person, { eigen, rolle });
  const titel = [a.name, a.rolle, a.abwesendText].filter(Boolean).join(" · ");

  const avatar = a.leer ? (
    <span aria-hidden="true" className="bo-person__leer-av" style={{ "--av": `${g}px` }}>
      <Icon name="User" className={g === 24 ? "size-3" : "size-4"} />
    </span>
  ) : (
    <Avatar name={a.name} kuerzel={a.kuerzel} material={a.material} groesse={g} ring={false} dekorativ />
  );

  const inhalt = nurAvatar ? (
    avatar
  ) : (
    <>
      {avatar}
      <span className="bo-person__txt">
        <span className="bo-person__name">{a.leer ? leerText || a.name : a.name}</span>
        {(a.rolle || a.abwesendText) && g === 32 && (
          <span className="bo-person__rolle">
            {a.abwesendText ? <span className="bo-person__ab">{a.abwesendText}</span> : a.rolle}
          </span>
        )}
      </span>
      {g === 24 && a.abwesendText && <span className="bo-person__ab">{a.abwesendText}</span>}
    </>
  );

  const props = {
    className: cx("bo-person", className),
    "data-g": g,
    "data-leer": a.leer ? "" : undefined,
    "data-abwesend": a.abwesend ? "" : undefined,
    "data-testid": testid,
    title: titel,
  };
  if (href && !a.leer) {
    return (
      <Link href={href} {...props} aria-label={nurAvatar ? titel : undefined}>
        {inhalt}
      </Link>
    );
  }
  return (
    <span {...props} role={nurAvatar ? "img" : undefined} aria-label={nurAvatar ? titel : undefined}>
      {inhalt}
    </span>
  );
}
