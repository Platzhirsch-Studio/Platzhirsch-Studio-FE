"use client";
// „Umlagern …“ / „Platz ändern …“ im Backoffice (§ 4.10, § 8.2): öffnet den Lager-Scan (Bestand → Platz-QR,
// oder „Platz zuerst“ für Serien). Gleicher Dialog wie am Packtisch.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { LagerScanDialog } from "./Packtisch";

export function LagerScanKnopf({ titel, variant = "primary" }) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  return (
    <>
      <Knopf variant={variant} icon="ScanLine" onClick={() => setOffen(true)} data-testid="lager-scan-knopf">{titel}</Knopf>
      <LagerScanDialog offen={offen} onSchliessen={() => { setOffen(false); router.refresh(); }} />
    </>
  );
}
