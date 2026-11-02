// /de/projekte/vorlage/demo.webm – neutral test clip for the InlineVideo demo
// (R5-content). German route only, other locales 404. Supports byte ranges
// (206), which Safari needs to play a <video>. noindex via X-Robots-Tag.
import { DEMO_CLIP_WEBM_BASE64 } from "../_demo/clip";
import { designPreviewEnabled } from "@/components/Preview/gate";
import { parseRange } from "../_demo/range";

const CLIP = Buffer.from(DEMO_CLIP_WEBM_BASE64, "base64");
const BASE_HEADERS = {
  "Content-Type": "video/webm",
  "Accept-Ranges": "bytes",
  "Cache-Control": "public, max-age=3600",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request, { params }) {
  const { locale } = await params;
  // Produktion: 404 ohne DESIGN_PREVIEW=1 (Preview/gate.js).
  if (locale !== "de" || !designPreviewEnabled()) return new Response("Not found", { status: 404 });
  const range = parseRange(request.headers.get("range"), CLIP.length);
  if (range === false) {
    return new Response(null, { status: 416, headers: { ...BASE_HEADERS, "Content-Range": `bytes */${CLIP.length}` } });
  }
  if (range) {
    const body = CLIP.subarray(range.start, range.end + 1);
    return new Response(body, {
      status: 206,
      headers: { ...BASE_HEADERS, "Content-Length": String(body.length), "Content-Range": `bytes ${range.start}-${range.end}/${CLIP.length}` },
    });
  }
  return new Response(CLIP, { status: 200, headers: { ...BASE_HEADERS, "Content-Length": String(CLIP.length) } });
}
