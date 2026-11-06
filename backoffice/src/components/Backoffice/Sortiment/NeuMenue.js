"use client";
// „+ Neu ▾“ des Bereichsstarts (§ 3.1): Produkt (Schnellanlage), Bestellung, Preisliste, Wareneingang.
import Knopf from "../Knopf";
import { Menue, MenuePunkt } from "../Overlay";
import { START } from "@/lib/backoffice/sortiment/texte";

/** @param {{eintraege:Array<{titel:string, href:string, icon?:string}>}} p */
export default function NeuMenue({ eintraege }) {
  if (!eintraege.length) return null;
  return (
    <Menue label={START.neuMenue} ausloeser={(p) => <Knopf {...p} variant="primary" icon="Plus" iconRechts="ChevronDown" data-testid="sortiment-neu">{START.neuMenue}</Knopf>}>
      {eintraege.map((e) => (
        <MenuePunkt key={e.href} icon={e.icon} href={e.href}>
          {e.titel}
        </MenuePunkt>
      ))}
    </Menue>
  );
}
