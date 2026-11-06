"use client";
// Knopf „Kundenansicht“ (G-20) für den Kopfzeilen-Slot der Shell oder eine Akte (CRM-Protokoll,
// Faktura-Angebot, Projektmappe, Kundenkarte-Übergabe). Startet den Kundenmodus der Shell.

import Knopf from "../Knopf";
import { useKundenmodus } from "./Kontext";
import { TEXTE } from "./texte";

/** @param {{variant?:string, size?:string, nurSymbol?:boolean}} props */
export default function KundenmodusKnopf({ variant = "secondary", size = "m", nurSymbol = false }) {
  const { an, starten } = useKundenmodus();
  if (an) return null;
  return (
    <Knopf variant={variant} size={size} icon="Eye" label={nurSymbol ? TEXTE.startenLabel : undefined} onClick={starten} title={TEXTE.startenHinweis} data-testid="kundenmodus-starten">
      {nurSymbol ? null : TEXTE.starten}
    </Knopf>
  );
}
