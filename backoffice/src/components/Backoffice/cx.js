// Klassen zusammenfügen, falsy auslassen (Kopie von src/components/ui/cx.js der Website).
export default function cx(...parts) {
  return parts.flat().filter(Boolean).join(" ");
}
