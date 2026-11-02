// GET /stil-palette/warme-moderne.png – Pin-Karte des Stil-Finder-Profils (src/lib/pinterest/stilPalette.js).
import { stilPaletteResponse } from "@/lib/pinterest/stilPalette";

export function GET() {
  return stilPaletteResponse("warme-moderne");
}
