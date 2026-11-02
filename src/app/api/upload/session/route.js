// POST /api/upload/session — exchanges the signed "Anfrage-Ticket" from
// /api/upload/inquiry/<kind> for the upload link (token + QR). Called by
// components/Upload/UploadHandoff.js on the success screen. Without a valid
// ticket there is no link (QA round 1, P1-3); the same ticket always returns
// the same link. Global guards: links per day and total storage (service.js).
import { z } from "zod";
import { mintSession } from "@/lib/upload/service";
import { buildHandoff } from "@/lib/upload/handoff";
import { UPLOAD_CONFIG, UPLOAD_PAUSED, uploadsAccepting } from "@/lib/upload/config";
import { clientIp, fail, json, rateLimited } from "@/lib/upload/http";
// r8-leads (technik P2): shared same-origin rule; upload tickets need an Origin
// (or Sec-Fetch-Site same-origin) as before.
import { isSameOriginRequest } from "@/lib/forms/origin";

// Extra keys (kind, email, leadRef from older callers) are ignored.
const Body = z.object({
  ticket: z.string().min(30).max(1200),
});

const MINT = UPLOAD_CONFIG.rateLimits.mint;

export async function POST(request) {
  try {
    // r1-recht-inhalt P0-4: no link while the Löschfrist is unconfirmed.
    if (!uploadsAccepting()) return json({ ok: false, error: UPLOAD_PAUSED }, 503);
    if (!isSameOriginRequest(request, { requireOrigin: true })) return json({ ok: false, error: "forbidden" }, 403);
    const ip = clientIp(request);
    // Per client only behind a trusted proxy header; otherwise one shared bucket.
    if (ip !== "untrusted" && (await rateLimited(`mint:${ip}`, MINT.perIp, MINT.windowMs))) return json({ ok: false, error: "rate_limited" }, 429);
    if (await rateLimited("mint:all", MINT.all, MINT.windowMs)) return json({ ok: false, error: "rate_limited" }, 429);

    const body = await request.json().catch(() => null);
    // Older callers sent { kind, email, leadRef } without a ticket: an upload
    // link is only ever minted against a ticket (QA P1-3), so name the reason.
    if (body && typeof body === "object" && !("ticket" in body)) return json({ ok: false, error: "ticket_required" }, 400);
    const parsed = Body.safeParse(body);
    if (!parsed.success) return json({ ok: false, error: "bad_request" }, 400);
    const minted = await mintSession({ ticket: parsed.data.ticket });
    return json({ ok: true, ...(await buildHandoff(minted, request.headers)) });
  } catch (error) {
    return fail(error);
  }
}
