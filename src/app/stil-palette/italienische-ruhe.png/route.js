// GET /stil-palette/italienische-ruhe.png – Pin-Karte des Stil-Finder-Profils (src/lib/pinterest/stilPalette.js).
import { stilPaletteResponse } from "@/lib/pinterest/stilPalette";

export function GET() {
  return stilPaletteResponse("italienische-ruhe");
}
