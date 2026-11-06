"use client";
// Personalakte: Primäraktion „Abwesenheit anlegen“ (Leitung) – Sheet wie Urlaub, Person vorbelegt.

import { useState } from "react";
import Knopf from "../Knopf";
import { UrlaubSheet } from "./Abwesenheit";
import { T } from "@/lib/backoffice/personal/texte";

export function MitarbeiterAbwesenheitKnopf({ mitarbeiter, heute, primaer = false }) {
  const [offen, setOffen] = useState(false);
  return (
    <>
      <Knopf variant={primaer ? "primary" : "secondary"} size={primaer ? "m" : "s"} icon="CalendarPlus" onClick={() => setOffen(true)} kuerzel={primaer ? "Strg+Enter" : undefined} data-testid="per-ma-abwesenheit">
        {T.akteMa.abwesenheitAnlegen}
      </Knopf>
      <UrlaubSheet offen={offen} onSchliessen={() => setOffen(false)} heute={heute} fuerPerson personen={[mitarbeiter]} vertretungen={[]} />
    </>
  );
}
