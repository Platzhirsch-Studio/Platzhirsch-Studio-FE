// Unterseiten „Mein Bereich“ als Segment (Konzept § 3.1: reiner Selbstservice ohne Pills, Segment
// Heute · Zeiten · Abwesenheiten · Daten). Link-Gruppe – aus Server-Seiten nutzbar.

import Segment from "../Segment";
import { T } from "@/lib/backoffice/personal/texte";

export default function MeinsNav({ aktiv }) {
  return (
    <Segment
      label={T.seiten.meins}
      aktiv={aktiv}
      optionen={[
        { wert: "heute", titel: "Heute", href: "/personal/meins" },
        { wert: "zeiten", titel: "Zeiten", href: "/personal/meins/zeiten" },
        { wert: "urlaub", titel: "Abwesenheiten", href: "/personal/meins/urlaub" },
        { wert: "daten", titel: "Daten", href: "/personal/meins/daten" },
      ]}
      testid="per-meins-nav"
    />
  );
}
