// /og-standard.png – typographic default share card (1200 × 630), Runde 2
// (seo P1-8). No photo: the /Images files have no documented release
// (Marktresearch/recht/bildrechte.csv). The path has a dot, so the proxy
// matcher (src/proxy.js) leaves it alone. Static, built once.
import { ogDefaultImageResponse } from "@/lib/seo/ogCard";

export const dynamic = "force-static";

export function GET() {
  return ogDefaultImageResponse();
}
