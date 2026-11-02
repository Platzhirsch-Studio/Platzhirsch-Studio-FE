// src/app/api/ezarri/anfrage/handler.js – POST-Logik der Ezarri-Anfrage (Team C).
// route.js exportiert nur POST; die Logik liegt hier, damit node --test sie mit
// eigenen Abhängigkeiten (Limiter, Postausgang-Ordner, fetch) prüfen kann.
//
// Ablauf: gleiche Herkunft → guardForm (Rate-Limit je IP: 5 Sendungen / 20 Versuche
// in 10 min, 12 KB, Honeypot `website`, Zeitfalle `_t`, zod-Allowlist) →
// Referenzen auflösen (unbekannte fallen weg) → Versandweg (versand.js).
// Antworten: {success:true, dryRun:true, id} | {success:true, id} | {success:false, code}
// Produktion ohne Backoffice-Schalter: 503 {success:false, code:"unavailable"} –
// nichts wird abgelegt, das Formular nennt Telefon und E-Mail (QM P1-4).
import { guardForm, errorResponse } from "../../../../lib/forms/guard.js";
import { forwardJson } from "../../../../lib/forms/forward.js";
import { anfrageSchema, MAX_BYTES } from "./schema.js";
import { decodeMix, decodeRechner } from "../../../../lib/ezarri/rechner/url.js";
import { BACKOFFICE_URL, anfrageText, inPostausgang, postausgangAlsTest, toBackofficePayload, versandModus } from "./versand.js";
import { isSameOriginRequest } from "../../../../lib/forms/origin.js";

export const LIMITS = Object.freeze({
  send: { max: 5, windowMs: 10 * 60 * 1000 },
  attempt: { max: 20, windowMs: 10 * 60 * 1000 },
});

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

// r8-leads (technik P2): one shared same-origin rule, lib/forms/origin.js.
const sameOrigin = (request) => isSameOriginRequest(request);

/**
 * @param {object} deps
 * @param {(ids: string[]) => Array<{id,code,name}>} [deps.resolveRefs]
 * @param {() => Promise<Headers|null>} [deps.resolveHeaders]
 * @param {object} [deps.limiter]   Rate-Limiter (Tests)
 * @param {string} [deps.outboxDir] Postausgang (Tests)
 * @param {Function} [deps.fetchImpl]
 * @param {Function} [deps.modus]   () => "outbox" | "backoffice"
 * @param {Function} [deps.alsTest] () => boolean  Postausgang als Erfolg melden? (Standard: postausgangAlsTest)
 * @param {(ids: string[]) => Array<{id,name,serie}>} [deps.resolveMix]  Konfigurator-Mosaik-IDs → Namen
 * @param {(id: string) => string|undefined} [deps.resolveFuge]           Fugen-ID → Name
 */
export function createAnfrageHandler(deps = {}) {
  return async function POST(request) {
    try {
      if (!sameOrigin(request)) return json({ success: false, code: "forbidden" }, 403);
      let outer = null;
      try {
        outer = deps.resolveHeaders ? await deps.resolveHeaders() : null;
      } catch {
        outer = null;
      }
      const guard = await guardForm(request, anfrageSchema, {
        route: "ezarri_anfrage",
        limit: LIMITS.send,
        attemptLimit: LIMITS.attempt,
        maxBytes: MAX_BYTES,
        fakeSuccess: () => ({ success: true, dryRun: true }),
        outerHeaders: outer,
        ...(deps.limiter ? { limiter: deps.limiter } : {}),
      });
      if (!guard.ok) return guard.response;
      const data = guard.data;
      const referenzen = data.referenzen?.length && deps.resolveRefs ? deps.resolveRefs(data.referenzen) : [];
      if (data.referenzen?.length && deps.resolveRefs) data.referenzen = referenzen.map((r) => r.id);
      const modus = (deps.modus || versandModus)();
      if (modus !== "backoffice" && !(deps.alsTest || postausgangAlsTest)()) {
        // Kein Anfrageweg: ehrlich ablehnen statt „Testbetrieb“ (keine Daten ablegen).
        console.error("[ezarri-anfrage] unavailable: Backoffice-Schalter aus in Produktion");
        return errorResponse("unavailable", 503, { message: "Anfrage derzeit nicht möglich" });
      }
      const mixIds = [...decodeMix(data.m || ""), ...(data.rechner ? decodeRechner(data.rechner).mix : [])].map((x) => x.id);
      const mixNamen = mixIds.length && deps.resolveMix ? Object.fromEntries(deps.resolveMix([...new Set(mixIds)]).map((x) => [x.id, x])) : {};
      const opts = { referenzen, mixNamen, fugeName: deps.resolveFuge };
      const text = anfrageText(data, opts);

      if (modus === "backoffice") {
        const payload = toBackofficePayload(data, opts);
        const result = await forwardJson(BACKOFFICE_URL, payload, { fetchImpl: deps.fetchImpl || fetch });
        if (result.kind === "ok") return json({ success: true });
        console.error(`[ezarri-anfrage] backoffice ${result.kind}`, result.status || "");
        // Nichts verlieren: ablegen und ehrlich als Fehler melden.
        await inPostausgang({ modus: "backoffice-fehler", data, text }, deps.outboxDir ? { dir: deps.outboxDir } : undefined).catch(() => {});
        return errorResponse(result.kind === "timeout" ? "timeout" : "upstream", result.kind === "timeout" ? 504 : 502);
      }

      const { id } = await inPostausgang({ modus: "dry-run", data, text }, deps.outboxDir ? { dir: deps.outboxDir } : undefined);
      return json({ success: true, dryRun: true, id });
    } catch (error) {
      console.error("[ezarri-anfrage] intern", error?.message || error);
      return errorResponse("internal", 500);
    }
  };
}
