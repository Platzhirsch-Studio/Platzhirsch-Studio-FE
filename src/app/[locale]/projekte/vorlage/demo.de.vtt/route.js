// /de/projekte/vorlage/demo.de.vtt – caption track of the InlineVideo demo
// (R5-content). German route only, other locales 404.
import { DEMO_VTT } from "../_demo/assets";
import { designPreviewEnabled } from "@/components/Preview/gate";

export async function GET(request, { params }) {
  const { locale } = await params;
  // Produktion: 404 ohne DESIGN_PREVIEW=1 (Preview/gate.js).
  if (locale !== "de" || !designPreviewEnabled()) return new Response("Not found", { status: 404 });
  return new Response(DEMO_VTT, {
    headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex, nofollow" },
  });
}
