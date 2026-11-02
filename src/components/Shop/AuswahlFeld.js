// src/components/Shop/AuswahlFeld.js
// Eckiges Auswahlfeld des Shops (Optik-QA r2): iOS/WebKit zeigte Sortierung, Lieferland und
// Ausführung im Systemstil (grauer Grund, runde Ecken, schwarzes Dreieck) neben den eckigen
// Feldern und Knöpfen. appearance-none + rounded-none + eigener Pfeil (lucide, currentColor →
// folgt dem Farbschema). Natives <select> bleibt: Tastatur, Screenreader und die Auswahlliste
// des Systems funktionieren unverändert. Ohne Hooks (Server und Client).
import { ChevronDown } from "lucide-react";

/** Klassen des <select> selbst (für Tests exportiert). */
export const AUSWAHL_KLASSE = "appearance-none rounded-none bg-surface pr-9 [&::-ms-expand]:hidden";

/**
 * @param {{ wrapClassName?: string, className?: string, children: import("react").ReactNode } & import("react").SelectHTMLAttributes<HTMLSelectElement>} props
 *   wrapClassName: Breite/Rand des Rahmens (das Feld füllt ihn), className: Schrift, Höhe, Rahmen des Feldes
 */
export default function AuswahlFeld({ wrapClassName = "", className = "", children, ...props }) {
  return (
    <span className={`relative inline-flex min-w-0 ${wrapClassName}`}>
      <select {...props} className={`${AUSWAHL_KLASSE} w-full ${className}`}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-soft" strokeWidth={1.5} />
    </span>
  );
}
