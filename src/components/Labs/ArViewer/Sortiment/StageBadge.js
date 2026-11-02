// Stufen-Kennzeichnung für Kunden (Icon + Text, nie nur Farbe – WCAG 1.4.1).
// Server-sicher, auch in Client-Komponenten nutzbar.
import { Box, Boxes, ScanLine, Image as ImageIcon, ImageOff } from "lucide-react";
import { STUFEN } from "@/lib/arviewer/stage";

const ICONS = { "3d": Box, "ar-foto": ScanLine, raumbedarf: Boxes, bild: ImageIcon, "ohne-bild": ImageOff };
const TONES = {
  "3d": "bg-ink-deep text-paper",
  "ar-foto": "bg-paper text-text border border-ink",
  raumbedarf: "bg-paper text-text border border-ink",
  bild: "bg-paper/95 text-text-soft border border-line",
  "ohne-bild": "bg-paper/95 text-text-soft border border-line",
};

/**
 * @param {"3d"|"ar-foto"|"raumbedarf"|"bild"|"ohne-bild"} stufe
 * @param {boolean} [long] ausgeschriebener Titel statt Kurzform
 */
export default function StageBadge({ stufe, long = false, className = "" }) {
  const s = STUFEN[stufe] || STUFEN.bild;
  const Icon = ICONS[stufe] || ImageIcon;
  return (
    <span
      data-stufe={stufe}
      className={`inline-flex min-h-7 items-center gap-1.5 px-2 py-1 text-[13px] font-medium leading-none tracking-[0.01em] ${TONES[stufe] || TONES.bild} ${className}`}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span>
        <span className="sr-only">Darstellung: </span>
        {long ? s.titel : s.kurz}
      </span>
    </span>
  );
}
