"use client";
// Primäraktion der Übersicht „+ Neu ▾“ (Konzept § 5.1): Bewerbung · Stelle · Gespräch · Abwesenheit für eine Person ·
// Buchung nachtragen · Mitarbeiter – nach Recht gefiltert (der Server reicht nur erlaubte Einträge herein).
// Strg/⌘+Enter öffnet das Menü.

import { useEffect, useRef } from "react";
import { Menue, MenuePunkt } from "../Overlay/Popover";
import Knopf from "../Knopf";
import { T } from "@/lib/backoffice/personal/texte";

const ICON = { bewerbung: "Inbox", stelle: "Megaphone", gespraech: "MessageSquare", abwesenheit: "CalendarPlus", buchung: "Clock", mitarbeiter: "UserPlus" };

/** @param {{eintraege: Array<{id:string, href:string}>}} p */
export default function NeuMenue({ eintraege = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    const f = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.defaultPrevented) {
        const el = document.querySelector('[data-testid="per-neu"]');
        if (el && !el.closest("dialog")) {
          e.preventDefault();
          el.click();
        }
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  if (!eintraege.length) return null;
  return (
    <span ref={ref}>
      <Menue
        label={T.uebersicht.neu}
        platzierung="unten-ende"
        ausloeser={(p) => (
          <Knopf {...p} variant="primary" icon="Plus" iconRechts="ChevronDown" kuerzel="Strg+Enter" data-testid="per-neu">
            {T.uebersicht.neu}
          </Knopf>
        )}
      >
        {eintraege.map((e) => (
          <MenuePunkt key={e.id} icon={ICON[e.id]} href={e.href} testid={`per-neu-${e.id}`}>
            {T.uebersicht.neuMenue[e.id]}
          </MenuePunkt>
        ))}
      </Menue>
    </span>
  );
}
