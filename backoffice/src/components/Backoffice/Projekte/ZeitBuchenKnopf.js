"use client";
// Knopf „Zeit buchen“ mit Dialog (Umschalt+H, Konzept § 3.7) – für Seiten ohne Projektkontext mit Projektauswahl.

import { useEffect, useState } from "react";
import Knopf from "../Knopf";
import ZeitBuchenDialog from "./ZeitBuchenDialog";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export default function ZeitBuchenKnopf({ projekt = "", projekte = null, variant = "primary" }) {
  const [offen, setOffen] = useState(false);
  useEffect(() => {
    const t = (e) => {
      if (/input|textarea|select/i.test(e.target?.tagName || "") || e.target?.isContentEditable) return;
      if (e.shiftKey && (e.key === "H" || e.key === "h")) {
        e.preventDefault();
        setOffen(true);
      }
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, []);
  return (
    <>
      <Knopf variant={variant} icon="Clock" kuerzel="⇧H" onClick={() => setOffen(true)} data-testid="zeit-buchen-knopf">
        {TEXTE.zeiten.buchen}
      </Knopf>
      <ZeitBuchenDialog offen={offen} onSchliessen={() => setOffen(false)} projekt={projekt} projekte={projekte} />
    </>
  );
}
