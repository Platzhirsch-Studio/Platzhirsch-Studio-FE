// src/app/api/labs/stilfinder/moodboard/route.js
// Stil-Finder (Labs): POST → personal Moodboard PDF (≥ 20 pages) by e-mail.
// Checks, in this order:
//   same origin → guardForm (IP rate limit 3 sends / 15 attempts per 10 min,
//   4 KB body, honeypot, time trap, zod allowlist) → per-address limit
//   (3 / 24 h, hashed) → max. 2 builds at once → build + send.
//   pdf-lead fix-04: daily caps per IP (10) and for the site (300) before the
//   per-address limit.
// Development: no mail leaves the machine, it lands in .data/stilfinder/outbox
// and the answer carries a preview link (/api/labs/stilfinder/postausgang/<id>).
// Production: only with STILFINDER_MAIL_ENABLED=1 and a complete provider,
// otherwise 503 – never a false "sent".
import { guardForm, errorResponse } from "@/lib/forms/guard";
import { moodboardRequestSchema } from "@/lib/stilfinder/schema";
import { IS_PRODUCTION, LIMITS } from "@/lib/stilfinder/config";
import { emailLimiter, sendCaps, withBuildSlot } from "@/lib/stilfinder/limits";
import { clientIp } from "@/lib/forms/rateLimit";
import { MoodboardError, sendMoodboard } from "@/lib/stilfinder/service";
import { isSameOriginRequest } from "@/lib/forms/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const json = (body, status = 200, headers = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

// r8-leads (technik P2): one shared same-origin rule, lib/forms/origin.js.
const sameOrigin = (request) => isSameOriginRequest(request);

export async function POST(request) {
  if (!sameOrigin(request)) return json({ success: false, code: "forbidden" }, 403);

  // Read the (small) body completely BEFORE any answer: guardForm answers a
  // full rate-limit bucket before reading, and some clients (WebKit/libcurl:
  // "rewinding of the data stream failed") then never see the 429 at all.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > 64 * 1024) return json({ success: false, code: "too_large" }, 413);
  let body;
  try {
    body = await request.arrayBuffer();
  } catch {
    return json({ success: false, code: "invalid" }, 400);
  }
  if (body.byteLength > 64 * 1024) return json({ success: false, code: "too_large" }, 413);
  const buffered = new Request(request.url, { method: "POST", headers: request.headers, body });

  const guard = await guardForm(buffered, moodboardRequestSchema, {
    route: "stilfinder_pdf",
    limit: LIMITS.send,
    attemptLimit: LIMITS.attempt,
    maxBytes: LIMITS.maxBodyBytes,
    invalidCode: "invalid",
    fakeSuccess: () => ({ success: true, mode: "outbox" }),
  });
  if (!guard.ok) return guard.response;

  // pdf-lead fix-04: daily caps (per IP, whole site) before the per-address
  // limit, so a refused request does not use up the address' quota
  const caps = sendCaps.take(clientIp(request));
  if (!caps.ok) {
    return errorResponse(caps.scope === "global" ? "daily_cap" : "rate_limited", 429, {
      headers: { "Retry-After": String(caps.retryAfter) },
    });
  }

  const perMail = emailLimiter.take(guard.data.email);
  if (!perMail.ok) {
    return errorResponse("rate_limited_email", 429, {
      message: "Für diese Adresse haben wir heute schon mehrere Moodboards erstellt. Bitte versuchen Sie es morgen erneut",
      headers: { "Retry-After": String(perMail.retryAfter) },
    });
  }

  try {
    const run = await withBuildSlot(() => sendMoodboard(guard.data));
    if (run.busy) return json({ success: false, code: "busy" }, 503, { "Retry-After": "15" });
    const r = run.value;
    return json({
      success: true,
      mode: r.mode,
      pages: r.pages,
      // dev only: open the PDF that would have been attached
      ...(r.mode === "outbox" && !IS_PRODUCTION ? { preview: `/api/labs/stilfinder/postausgang/${r.id}` } : {}),
    });
  } catch (e) {
    if (e instanceof MoodboardError) return json({ success: false, code: e.code }, e.status);
    console.error("[stilfinder] PDF/Mail fehlgeschlagen:", e?.message || e);
    return json({ success: false, code: "failed" }, 502);
  }
}
