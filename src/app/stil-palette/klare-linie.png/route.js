// GET /stil-palette/klare-linie.png – Pin-Karte des Stil-Finder-Profils (src/lib/pinterest/stilPalette.js).
import { stilPaletteResponse } from "@/lib/pinterest/stilPalette";

export function GET() {
  return stilPaletteResponse("klare-linie");
}
