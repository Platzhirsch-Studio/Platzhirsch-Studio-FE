// GET /api/labs/ar-viewer/studio-v1.hdr → Studio-Umgebung für <model-viewer>
// (environment-image). Rechnerisch erzeugt (ArViewer/studioHdr.js), keine
// Drittquelle, keine Eingaben, keine Personendaten. Statisch beim Build
// erzeugt; die Version steht im Pfad, daher darf der Browser sie dauerhaft
// zwischenspeichern.
import { buildStudioHdr } from "@/components/Labs/ArViewer/studioHdr";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildStudioHdr(), {
    headers: {
      "Content-Type": "image/vnd.radiance",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noindex",
    },
  });
}
