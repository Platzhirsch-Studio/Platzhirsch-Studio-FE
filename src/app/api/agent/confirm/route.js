// src/app/api/agent/confirm/route.js – Double-Opt-in eines Terminwunschs aus einem KI-Assistenten.
// POST { token, action: "preview" | "confirm" } von /de/ki-assistenten/bestaetigen.
// An das Backoffice geht die Anfrage NUR im Modus live in Produktion
// (src/lib/agent/deps.js confirmContext); sonst Probelauf ohne Netzwerkaufruf.
// Nur gleiche Herkunft (die Seite selbst), Rate-Limit pro IP, kein Cache.
import { z } from "zod";
import { confirmAppointment } from "@/lib/agent/appointment";
import { agentRuntime, confirmContext } from "@/lib/agent/deps";
import { clientIp } from "@/lib/agent/rate";
import { isSameOriginRequest } from "@/lib/forms/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body, status = 200, headers = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...headers } });

const schema = z.strictObject({ token: z.string().min(40).max(8000), action: z.enum(["preview", "confirm"]) });

// r8-leads (technik P2): one shared same-origin rule, lib/forms/origin.js.
const sameOrigin = (request) => isSameOriginRequest(request);

export async function POST(request) {
  if (!sameOrigin(request)) return json({ ok: false, code: "forbidden" }, 403);
  const { limiter, used, log } = agentRuntime();
  const rate = await limiter.confirm(clientIp(request.headers), Date.now());
  if (!rate.ok) return json({ ok: false, code: "rate_limited", retryAfter: rate.retryAfter }, 429, { "Retry-After": String(rate.retryAfter) });
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 10_000) return json({ ok: false, code: "too_large" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, code: "invalid_json" }, 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ ok: false, code: "invalid_input" }, 400);
  try {
    const { status, body: out } = await confirmAppointment(parsed.data, { ...confirmContext(), used });
    return json(out, status);
  } catch (error) {
    log("[agent] confirm failed", error);
    return json({ ok: false, code: "internal" }, 500);
  }
}
