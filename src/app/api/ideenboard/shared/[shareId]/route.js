// GET /api/ideenboard/shared/<shareId> – öffentliche Ansicht eines geteilten
// Boards (Karten + Stand, keine Kennungen). Für das Termin-Team und die
// Studio-Ansicht; 404 bei unbekanntem, widerrufenem oder abgelaufenem Link.
import { RATE, getSharedBoard, limited } from "@/lib/ideenboard/service";
import { fail, ipOf, json } from "@/lib/ideenboard/http";

export async function GET(request, { params }) {
  const { shareId } = await params;
  if (limited(`read:${ipOf(request)}`, RATE.read)) return fail("rate_limited", 429);
  try {
    const board = await getSharedBoard(shareId);
    if (!board) return fail("not_found", 404);
    return json({ ok: true, board });
  } catch (e) {
    if (e?.status === 503) return fail("unavailable", 503);
    console.error("[ideenboard] shared", e);
    return fail("error", 500);
  }
}
