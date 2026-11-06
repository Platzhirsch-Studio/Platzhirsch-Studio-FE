"use client";
// Drucken der aktuellen Ansicht (Report-Druck für Zahlliste/UVA, solange ein Druckformat fehlt – § 3.8, § 3.11).
import Knopf from "../Knopf";

export default function DruckenKnopf({ children = "Drucken", variant = "secondary" }) {
  return (
    <Knopf variant={variant} icon="Printer" onClick={() => window.print()}>
      {children}
    </Knopf>
  );
}
