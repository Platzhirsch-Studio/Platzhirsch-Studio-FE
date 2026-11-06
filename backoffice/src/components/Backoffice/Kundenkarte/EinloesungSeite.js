"use client";
// Einlösung als Vollseite (Deep-Link /kundenkarte/einloesungen/[name]) – gleiche Inhalte wie das Sheet.

import { useState } from "react";
import { useToast } from "../Toast";
import { EinloesungDetails } from "./Einloesungen";
import { StornoDialog } from "./Dialoge";
import { datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export default function EinloesungSeite(props) {
  const [storno, setStorno] = useState(null);
  const { zeige } = useToast();
  return (
    <>
      <EinloesungDetails {...props} onStorno={setStorno} />
      {storno && <StornoDialog einloesung={storno.name} titel={`${storno.vorteil_titel} · ${datumZeit(storno.eingeloest_am)}`} onSchliessen={() => setStorno(null)} onFertig={() => (setStorno(null), zeige(T.einloesungen.storniert, { art: "ok" }))} />}
    </>
  );
}
