// POST /api/ideenboard { board } – Teilen-Link für ein Ideenboard erstellen.
// Antwort: { shareId, adminToken } – der Verwaltungsschlüssel bleibt im
// localStorage des Erstellers, der Server kennt nur seinen Hash.
import { BoardError, RATE, createShared, limited } from "@/lib/ideenboard/service";
import { fail, ipOf, isSameOrigin, json, readJsonBody } from "@/lib/ideenboard/http";

export async function POST(request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  if (limited(`create:${ipOf(request)}`, RATE.create)) return fail("rate_limited", 429);
  const body = await readJsonBody(request);
  if (!body || typeof body !== "object") return fail("invalid", 400);
  try {
    const r = await createShared(body.board);
    return json({ ok: true, ...r }, 201);
  } catch (e) {
    if (e instanceof BoardError) return fail(e.code, e.status);
    console.error("[ideenboard] create", e);
    return fail("error", 500);
  }
}
