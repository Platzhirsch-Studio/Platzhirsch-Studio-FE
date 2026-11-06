"use client";
// Neu-Menü (G-26, Q-F2 „N Neu-Menü“): runder Plus-Knopf in der Kopfzeile. Einträge = Schnellaktionen
// „Neu …“ aus dem Paletten-Register, serverseitig nach Rechten gefiltert; die des aktiven Bereichs zuerst.

import { useState } from "react";
import { Menue, MenuePunkt } from "../Overlay/Popover";
import { Icon } from "../icons";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { TEXTE } from "./texte";

/** @param {{eintraege:Array<{titel:string, href:string, bereich:string}>, bereich?:string|null}} props */
export default function NeuMenu({ eintraege = [], bereich = null }) {
  const [offen, setOffen] = useState(false);
  useKuerzel("global", { "global.neu": () => (eintraege.length ? setOffen(true) : false) }, { aktiv: eintraege.length > 0 });
  if (!eintraege.length) return null;
  const sortiert = [...eintraege.filter((e) => e.bereich === bereich), ...eintraege.filter((e) => e.bereich !== bereich)].slice(0, 10);
  return (
    <Menue
      label={TEXTE.neu}
      platzierung="unten-ende"
      breite={260}
      offen={offen}
      onOffen={setOffen}
      testid="neu-menu"
      ausloeser={(p) => (
        <button {...p} type="button" className="bo-rund bo-tip bo-ziel bo-schale-werkzeug bo-plus-dreh" aria-label={TEXTE.neu} data-tip={`${TEXTE.neu} · N`} aria-keyshortcuts="N" data-testid="neu-oeffnen">
          <Icon name="Plus" className="size-5" />
        </button>
      )}
    >
      {sortiert.map((e) => (
        <MenuePunkt key={e.href} href={e.href} icon="Plus">
          {e.titel}
        </MenuePunkt>
      ))}
    </Menue>
  );
}
