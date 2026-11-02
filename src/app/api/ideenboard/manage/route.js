// POST /api/ideenboard/manage { token, action, board? }
// action: sync | revoke | renew | delete | status. Der Schlüssel kommt aus dem
// localStorage des Erstellers (nie in einer Adresse, also in keinem Log).
import { BoardError, RATE, limited, manageShared } from "@/lib/ideenboard/service";
import { fail, ipOf, isSameOrigin, json, readJsonBody } from "@/lib/ideenboard/http";

const ACTIONS = new Set(["sync", "revoke", "renew", "delete", "status"]);

export async function POST(request) {
  if (!isSameOrigin(request)) return fail("forbidden", 403);
  if (limited(`manage:${ipOf(request)}`, RATE.manage)) return fail("rate_limited", 429);
  const body = await readJsonBody(request);
  if (!body || typeof body.token !== "string" || !ACTIONS.has(body.action)) return fail("invalid", 400);
  try {
    const r = await manageShared(body.token, body.action, { board: body.board });
    return json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof BoardError) return fail(e.code, e.status);
    console.error("[ideenboard] manage", e);
    return fail("error", 500);
  }
}
