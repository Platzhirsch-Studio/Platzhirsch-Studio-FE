"use client";
import Knopf from "../Knopf";
import { oeffneKuerzelDialog, useMac } from "@/lib/backoffice/kuerzel/useKuerzel";
import { anzeigeText } from "@/lib/backoffice/kuerzel/index";

// Knopf „Tastenkürzel“ (G-02): öffnet den Kürzel-Dialog der Shell (gleiche Wirkung wie Strg+/).
// Für Hilfe-Panel, Benutzermenü und Demos; außerhalb der Shell (Kiosk) ohne Wirkung – dort F1.

/** @param {{variant?:string, size?:string, children?:import("react").ReactNode}} props */
export default function KuerzelKnopf({ variant = "secondary", size = "m", children = "Tastenkürzel" }) {
  const mac = useMac();
  return (
    <Knopf variant={variant} size={size} icon="Keyboard" kuerzel={anzeigeText("mod+/", mac)} onClick={oeffneKuerzelDialog} data-testid="kuerzel-knopf">
      {children}
    </Knopf>
  );
}
