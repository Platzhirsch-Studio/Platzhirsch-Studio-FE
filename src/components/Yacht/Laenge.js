// Bootslänge in Overlines (QM r4): Zahl und Einheit mit geschütztem Leerzeichen,
// die Einheit bleibt in Versalien-Zeilen klein („8–10 m“ statt „8–10 / M“).
// Server-safe, keine Hooks.
import { lengthParts } from "@/lib/yacht/typography";

export default function Laenge({ value }) {
  const parts = lengthParts(value);
  if (!parts) return value || null;
  return (
    <span className="whitespace-nowrap">
      {parts.num}
      {"\u00A0"}
      <span className="normal-case">{parts.unit}</span>
    </span>
  );
}
