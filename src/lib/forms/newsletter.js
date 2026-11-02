// src/lib/forms/newsletter.js
// Handler of /api/newsletter_subscribe (route file passes the backoffice URL).
// Answers stay minimal — { success } or { success:false, code } — and the form
// (components/Newsletter/newsletter.js) maps `code` to a translated message:
//   invalid_email (400) | failed (502)
//   QA Welle 2 P1-4: an address that is already on the list gets the SAME
//   neutral { success: true } as a new one – no 409, so the endpoint does not
//   reveal who is subscribed (Art. 32 DSGVO, no address enumeration).
//   Double opt-in is still missing in the backoffice app: until it is live,
//   NO newsletter is sent to this list (Kanzlei/Inhaber, see
//   Marktresearch/digital/features/kundenbetreuung.md, Abschn. 5).
//   plus from guardForm: too_large (413), rate_limited (429) → generic text,
//   and forbidden (403) for a foreign Origin/Referer (origin.js).
// Honeypot `website` (sent by the form today) and time trap `_t` → fake success.
// No "@/..." imports: tested directly with `node --test`.
import { guardForm } from "./guard.js";
import { forwardJson, outerHeadersOf } from "./forward.js";
import { MAX_BYTES, newsletterSchema } from "./schemas.js";
import { forbiddenResponse, originCheck } from "./origin.js";

const fail = (code, status) => Response.json({ success: false, code }, { status });

// Frappe puts user-facing errors in `_server_messages` (a JSON string of
// JSON strings). Returns the joined message text, or "".
export function frappeMessage(data) {
  try {
    return JSON.parse(data?._server_messages || "[]")
      .map((m) => {
        try {
          return JSON.parse(m).message || "";
        } catch {
          return String(m);
        }
      })
      .join(" ");
  } catch {
    return "";
  }
}

export function newsletterHandler({ url, fetchImpl, limiter, now, resolveHeaders, env } = {}) {
  return async function POST(request) {
    try {
      const outerHeaders = await outerHeadersOf(resolveHeaders);
      // Herkunftsprüfung (origin.js): 403 { code: "forbidden" } for cross-site posts.
      const origin = originCheck(request, outerHeaders, env);
      if (!origin.ok) {
        console.warn(`[forms] newsletter_subscribe: ${origin.reason} -> 403`);
        return forbiddenResponse();
      }
      const guard = await guardForm(request, newsletterSchema, {
        route: "newsletter_subscribe",
        outerHeaders,
        maxBytes: MAX_BYTES.newsletter_subscribe,
        invalidCode: "invalid_email",
        fakeSuccess: () => ({ success: true }),
        limiter,
        now: now ? now() : Date.now(),
      });
      if (!guard.ok) return guard.response;

      const result = await forwardJson(
        url,
        { email: guard.data.email.trim() },
        { fetchImpl: fetchImpl || fetch, headers: { "Content-Type": "application/json", Accept: "application/json" } }
      );
      if (result.kind === "timeout" || result.kind === "network" || result.kind === "non_json") {
        console.error(`[forms] newsletter_subscribe: backoffice ${result.kind}`, result.status || "", result.detail || "");
        return fail("failed", 502);
      }
      const data = result.kind === "ok" ? result.data : result.detail;
      if (result.kind !== "ok" || data?.exc) {
        if (typeof data !== "object" || data === null) {
          console.error("[forms] newsletter_subscribe: backoffice error", result.status, "(non-JSON)");
          return fail("failed", 502);
        }
        const message = frappeMessage(data);
        if (/bereits angemeldet|already subscribed/i.test(message)) {
          console.info("[forms] newsletter_subscribe: address already on the list -> neutral success");
          return Response.json({ success: true });
        }
        console.error("[forms] newsletter_subscribe: backoffice error", result.status || "", message || data.exc_type || "");
        return fail("failed", 502);
      }
      return Response.json({ success: true });
    } catch (error) {
      console.error("[forms] newsletter_subscribe: internal error", error);
      return fail("failed", 502);
    }
  };
}
