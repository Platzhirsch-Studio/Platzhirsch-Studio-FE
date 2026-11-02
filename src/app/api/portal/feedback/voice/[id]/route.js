import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/portal/dal";
import { readVoice } from "@/components/Portal/Planung/server/planungStore";

// GET /api/portal/feedback/voice/:id – streams a voice note of the logged-in
// customer (byte ranges supported for Safari). Never cached, never public.

export async function GET(request, ctx) {
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const { id } = await ctx.params;
  const voice = await readVoice(auth.portal.customerId, id);
  if (!voice) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  const total = voice.buffer.length;
  const headers = {
    "Content-Type": voice.mime,
    "Cache-Control": "private, no-store",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : total - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : total - 1;
    start = Math.max(0, start);
    end = Math.min(end, total - 1);
    if (start > end) return new NextResponse(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${total}` } });
    return new NextResponse(voice.buffer.subarray(start, end + 1), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new NextResponse(voice.buffer, { headers: { ...headers, "Content-Length": String(total) } });
}
