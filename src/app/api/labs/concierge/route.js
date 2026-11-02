// src/app/api/labs/concierge/route.js
// KI-Concierge (Labs page and sitewide launcher). POST streams one answer as
// NDJSON (one JSON event per line, see src/lib/concierge/run.js). GET reports
// the mode for the UI. Sitewide requests send surface:"site" and a page
// context per user turn (pageContext.js); only they get proposals.
// CONCIERGE_DISABLED=1 (runtime kill switch): GET enabled:false, POST 503.
import Anthropic from "@anthropic-ai/sdk";
import { allowDevMock, getMode, isDisabled, LIMITS } from "@/lib/concierge/config";
import { prepareHistory } from "@/lib/concierge/prepare";
import { getShowroomInfo } from "@/lib/concierge/showroom";
import { chatSchema } from "@/lib/concierge/schema";
import { checkChat, clientIp } from "@/lib/concierge/rateLimit";
import { verifyToken, isTokenConfigured } from "@/lib/concierge/token";
import { runLive } from "@/lib/concierge/run";
import { runMock } from "@/lib/concierge/mock";
import { saveTurn } from "@/lib/concierge/store";
import { isSameOriginRequest } from "@/lib/forms/origin";
import { devPreviewAllowed, whatsappConfig } from "@/lib/whatsapp/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body, status = 200, headers = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

// r8-leads (technik P2): one shared same-origin rule, lib/forms/origin.js.
const sameOrigin = (request) => isSameOriginRequest(request);

// Showroom facts for the contact card of the sitewide panel (no key / paused).
function showroom() {
  const i = getShowroomInfo();
  // WhatsApp handoff (Inhaber-Entscheidung Nr. 15): "on" with WHATSAPP_NUMBER,
  // "dev" = dev server without number (test number via ?whatsapp=test), else
  // false. Only the switch – the panel links to /kontakt#whatsapp (notice first).
  const whatsapp = whatsappConfig() ? "on" : devPreviewAllowed() ? "dev" : false;
  return { phone: i.phone, email: i.email, directions: i.directions, hours: i.openingHours, whatsapp };
}

export async function GET() {
  if (isDisabled()) return json({ enabled: false, mode: "unavailable", devMock: false, showroom: showroom() });
  return json({ enabled: true, mode: getMode(), devMock: allowDevMock(), showroom: showroom() });
}

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "forbidden" }, 403);
  if (isDisabled()) return json({ error: "disabled" }, 503);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 60_000) return json({ error: "too_large" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "invalid_input", issues: parsed.error.issues.map((i) => i.message).slice(0, 5) }, 400);
  }

  if (!isTokenConfigured()) return json({ error: "not_configured" }, 503);
  const consent = verifyToken(parsed.data.token);
  if (!consent) return json({ error: "consent_required" }, 401);

  let mode = getMode();
  if (mode !== "live" && parsed.data.mock && allowDevMock()) mode = "mock";
  if (mode === "unavailable") return json({ error: "unavailable" }, 503);
  // Consent text differs per mode (mock: nothing goes to Anthropic).
  if ((consent.m || "mock") !== mode) return json({ error: "consent_required" }, 401);

  const rate = await checkChat({ ip: clientIp(request), sid: consent.sid, rid: parsed.data.rid });
  if (!rate.ok) {
    const error = rate.reason === "budget" ? "budget_exhausted" : "rate_limited";
    return json({ error, retryAfter: rate.retryAfter }, 429, { "Retry-After": String(rate.retryAfter) });
  }

  const history = parsed.data.messages;
  const surface = parsed.data.surface === "site" ? "site" : "labs";
  // Page context only from the sitewide surface (the Labs page never sends it).
  const input = surface === "site" ? history : history.map(({ role, content }) => ({ role, content }));
  const prepared = await prepareHistory(input, { sid: consent.sid });
  const plainChars = history.reduce((n, m) => n + m.content.length, 0);
  if (plainChars + prepared.ctxChars > LIMITS.totalChars) {
    return json({ error: "invalid_input", issues: ["Verlauf zu lang."] }, 400);
  }
  const env = {
    surface,
    sid: consent.sid,
    locale: prepared.lastCtx?.locale || "de",
    sections: prepared.lastCtx?.sections || [],
    route: prepared.lastCtx?.route || null,
  };
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const emit = (event) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          closed = true;
        }
      };
      emit({ type: "start", mode });
      try {
        const run = mode === "live" ? runLive : runMock;
        const result = await run({ history: prepared.messages, plain: history, emit, signal: request.signal, env });
        if (consent.st === 1) {
          await saveTurn({
            sid: consent.sid,
            mode,
            user: history[history.length - 1].content,
            assistant: result.text,
            productIds: result.productIds,
          });
        }
        emit({ type: "done" });
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("[concierge] run failed:", error);
          const message =
            error instanceof Anthropic.RateLimitError
              ? "Gerade sind sehr viele Anfragen unterwegs. Bitte versuchen Sie es in einer Minute erneut."
              : error instanceof Anthropic.APIError
                ? "Der Concierge ist kurz nicht erreichbar. Unser Team hilft Ihnen gerne direkt weiter."
                : "Da ist etwas schiefgelaufen. Bitte versuchen Sie es erneut.";
          emit({ type: "error", message });
        }
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed (client went away)
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
