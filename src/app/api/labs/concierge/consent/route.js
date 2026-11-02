// src/app/api/labs/concierge/consent/route.js
// POST   issues the signed consent token after the visitor accepted the notice
//        (KI-Hinweis, Übermittlung an Anthropic, optional: Verlauf speichern).
// DELETE withdraws consent: removes every stored transcript line of the
//        token's session. The client drops the token afterwards.
import { consentSchema, revokeSchema } from "@/lib/concierge/schema";
import { issueToken, isTokenConfigured, verifyToken } from "@/lib/concierge/token";
import { checkConsent, clientIp } from "@/lib/concierge/rateLimit";
import { allowDevMock, CONSENT_VERSION, getMode, isDisabled } from "@/lib/concierge/config";
import { deleteSession } from "@/lib/concierge/store";
import { isSameOriginRequest } from "@/lib/forms/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// r8-leads (technik P2): one shared same-origin rule, lib/forms/origin.js.
const sameOrigin = (request) => isSameOriginRequest(request);

async function readBody(request) {
  try {
    const raw = await request.text();
    if (raw.length > 2000) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (isDisabled()) return json({ error: "disabled" }, 503);
  if (!isTokenConfigured()) return json({ error: "not_configured" }, 503);
  if (!(await checkConsent(clientIp(request))).ok) return json({ error: "rate_limited" }, 429);

  const parsed = consentSchema.safeParse(await readBody(request));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);

  let mode = getMode();
  if (mode !== "live" && parsed.data.mock && allowDevMock()) mode = "mock";
  if (mode === "unavailable") return json({ error: "unavailable" }, 503);

  const { token } = issueToken({ store: parsed.data.store === true, mode });
  return json({ token, mode, version: CONSENT_VERSION });
}

export async function DELETE(request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (!isTokenConfigured()) return json({ error: "not_configured" }, 503);
  if (!(await checkConsent(clientIp(request))).ok) return json({ error: "rate_limited" }, 429);

  const parsed = revokeSchema.safeParse(await readBody(request));
  if (!parsed.success) return json({ error: "invalid_input" }, 400);
  // Expired / old-version tokens are fine here: withdrawing must always work.
  const consent = verifyToken(parsed.data.token, { allowStale: true });
  if (!consent) return json({ error: "invalid_token" }, 401);

  try {
    const deleted = await deleteSession(consent.sid);
    return json({ ok: true, deleted });
  } catch (error) {
    console.error("[concierge] delete failed:", error);
    return json({ error: "delete_failed" }, 500);
  }
}
