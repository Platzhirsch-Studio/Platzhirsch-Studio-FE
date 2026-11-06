// Slot „Projekte“ für die Kundenakte (akte/slots/projekte.js): Projekte des Kontakts mit Phase und nächstem Schritt.
// Bekommt nur `daten` (nie die Sitzung).

import Link from "next/link";
import { ProjektBild, ProjektStatus } from "./Teile";
import { statusText } from "@/lib/backoffice/projekte/texte";
import "./projekte.css";

export default function KundenProjekteSlot({ daten = [] }) {
  return (
    <ul className="bo-prj-liste" data-testid="slot-projekte">
      {daten.map((p) => (
        <li key={p.name}>
          <ProjektBild klein art={p.projektart} />
          <Link href={`/projekte/${encodeURIComponent(p.name)}`} className="min-w-0 flex-1">
            <span className="bo-prj-titel block truncate">{p.titel}</span>
            <span className="bo-prj-unter block">{[statusText("PH Projekt", p.projektart), p.objekt_ort, p.name].filter(Boolean).join(" · ")}</span>
          </Link>
          <ProjektStatus wert={p.status} />
        </li>
      ))}
    </ul>
  );
}
