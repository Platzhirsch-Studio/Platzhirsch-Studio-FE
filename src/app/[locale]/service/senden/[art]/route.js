// POST /<locale>/service/senden/<art> – Absende-Ziel der Service-Seiten
// (Bericht Marktresearch/digital/backoffice/60-website-backend-umstellung.md, „Website-Seiten“):
//   newsletter-bestaetigen  { token }                       → lib/backend/tokenAktionen.js confirmNewsletter
//   newsletter-abmelden     { token } | { email, website }  → unsubscribeNewsletter
//   adventsabend-absagen    { token }                       → cancelEventRegistration
//   reklamation             JSON-Formular                   → lib/service/reklamation/send.js
//   bewerbung               multipart (Felder + PDF)        → lib/karriere/bewerbungSend.js
// Die Seiten schicken Token erst nach einem Klick (Mail-Scanner lösen nichts aus).
// Prüfungen: Herkunft (origin.js), Rate-Limit je IP, Größe, Honeypot/Zeitfalle
// (guardForm), Feldprüfung (Schema der Seite). Antworten nur mit eigenen Codes,
// no-store, noindex. Backend alt/ph: src/lib/backend/config.js.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { STATUS, cancelEventRegistration, confirmNewsletter, unsubscribeNewsletter } from "@/lib/backend/tokenAktionen";
import { reklamationSchema } from "@/lib/service/reklamation/schema";
import { sendReklamation } from "@/lib/service/reklamation/send";
import { BEWERBUNG_LIMITS, FIELD_ORDER as BEWERBUNG_FIELDS, isPdfBytes, validateBewerbung } from "@/lib/karriere/bewerbung";
import { sendBewerbung } from "@/lib/karriere/bewerbungSend";
import { guardForm, isTooFast } from "@/lib/forms/guard";
import { forbiddenResponse, originCheck } from "@/lib/forms/origin";
import { clientIp, createRateLimiter, ipFromHeaders } from "@/lib/forms/rateLimit";
import { originalRequestHeaders } from "@/lib/forms/requestHeaders";
import { uploadsAccepting } from "@/lib/upload/config";
import { signTicket, tokensAvailable } from "@/lib/upload/token";

export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const json = (body, status = 200) => Response.json(body, { status, headers: HEADERS });
const fail = (code, status = STATUS[code] || 503, extra = {}) => json({ success: false, code, ...extra }, status);

const DATA = path.join(/*turbopackIgnore: true*/ process.cwd(), ".data");
function outboxIn(...dir) {
  const folder = path.join(DATA, ...dir);
  return async (entry) => {
    await mkdir(folder, { recursive: true });
    const name = `${entry.eingang.replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}.json`;
    await writeFile(path.join(folder, name), JSON.stringify(entry, null, 2), "utf8");
    console.info(`[service] ${entry.art} vorgemerkt (${dir.join("/")}/${name}) – bitte im Backoffice nachtragen.`);
  };
}

const limiter = createRateLimiter();
const TOKEN_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const BEWERBUNG_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
// Felder + zwei PDF zu je 4 MB, unter dem 10-MB-Puffer des Proxys (proxyClientMaxBodySize).
const BEWERBUNG_MAX_BYTES = BEWERBUNG_LIMITS.maxFiles * BEWERBUNG_LIMITS.maxFileBytes + 64 * 1024;

const tokenSchema = {
  safeParse(v) {
    const token = typeof v?.token === "string" ? v.token.trim() : "";
    return token && token.length <= 200 ? { success: true, data: { token } } : { success: false, error: { issues: [{ path: ["token"], message: "invalid token" }] } };
  },
};
const unsubscribeSchema = {
  safeParse(v) {
    const token = typeof v?.token === "string" ? v.token.trim() : "";
    const email = typeof v?.email === "string" ? v.email.trim() : "";
    if ((token && token.length <= 200) || (email && email.length <= 254)) return { success: true, data: token ? { token } : { email } };
    return { success: false, error: { issues: [{ path: [token ? "token" : "email"], message: "invalid" }] } };
  },
};

function answerToken(r) {
  if (r.ok) return json({ success: true, status: r.status });
  if (r.code !== "invalid_token" && r.code !== "expired" && r.code !== "invalid") console.error(`[service] Link-Aktion (${r.generation}): ${r.code}`);
  return fail(r.code);
}

async function guarded(request, schema, route, opts = {}) {
  const outerHeaders = await originalRequestHeaders().catch(() => null);
  if (!originCheck(request, outerHeaders).ok) return { response: forbiddenResponse() };
  const g = await guardForm(request, schema, { route, outerHeaders, ...opts });
  return g.ok ? { data: g.data } : { response: g.response };
}

function uploadTicket(referenz, email) {
  try {
    if (!uploadsAccepting() || !tokensAvailable()) return null;
    return signTicket({ kind: "kontakt", leadRef: referenz || undefined, email });
  } catch {
    return null;
  }
}

const HANDLERS = {
  async "newsletter-bestaetigen"(request) {
    const g = await guarded(request, tokenSchema, "newsletter_bestaetigen", { maxBytes: 2048, invalidCode: "invalid_token", limit: TOKEN_LIMIT });
    if (g.response) return g.response;
    return answerToken(await confirmNewsletter({ token: g.data.token }));
  },
  async "newsletter-abmelden"(request) {
    const g = await guarded(request, unsubscribeSchema, "newsletter_abmelden", { maxBytes: 2048, limit: TOKEN_LIMIT });
    if (g.response) return g.response;
    return answerToken(await unsubscribeNewsletter({ ...g.data, outbox: outboxIn("newsletter", "abmeldungen") }));
  },
  async "adventsabend-absagen"(request) {
    const g = await guarded(request, tokenSchema, "adventsabend_absagen", { maxBytes: 2048, invalidCode: "invalid_token", limit: TOKEN_LIMIT });
    if (g.response) return g.response;
    return answerToken(await cancelEventRegistration({ token: g.data.token, outbox: outboxIn("adventsabend", "absagen") }));
  },
  async reklamation(request) {
    const g = await guarded(request, reklamationSchema, "reklamation", { maxBytes: 16 * 1024 });
    if (g.response) return g.response;
    const leadRef = `REK-${randomUUID().slice(0, 8).toUpperCase()}`;
    const r = await sendReklamation(g.data, { leadRef });
    if (!r.ok) {
      console.error(`[service] Reklamation (${r.generation}): ${r.code}`);
      return fail(r.code === "invalid" ? "invalid" : r.code === "rate_limited" ? "rate_limited" : r.code === "not_configured" ? "not_configured" : "unavailable");
    }
    const ticket = uploadTicket(r.referenz || leadRef, g.data.email);
    return json({ success: true, referenz: r.referenz || leadRef, ...(ticket ? { upload: { ticket } } : {}) });
  },
  async bewerbung(request) {
    const outerHeaders = await originalRequestHeaders().catch(() => null);
    if (!originCheck(request, outerHeaders).ok) return forbiddenResponse();
    const ip = clientIp(request) || ipFromHeaders(outerHeaders) || "noip";
    if (!limiter.take(`bewerbung:${ip}`, BEWERBUNG_LIMIT).ok) return fail("rate_limited", 429);
    const declared = Number(request.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > BEWERBUNG_MAX_BYTES) return fail("too_large", 413);
    let form;
    try {
      form = await request.formData();
    } catch {
      return fail("invalid", 400);
    }
    const text = (k) => (typeof form.get(k) === "string" ? form.get(k) : "");
    // Honeypot / Zeitfalle wie guardForm: sieht nach Erfolg aus, nichts wird gesendet.
    if (text("website").trim() || isTooFast(Number(text("_t")) || undefined, Date.now())) return json({ success: true });
    const files = {};
    for (const k of ["lebenslauf", "anschreiben"]) {
      const f = form.get(k);
      if (f && typeof f === "object" && f.size) files[k] = f;
    }
    const fields = Object.fromEntries(["vorname", "nachname", "email", "telefon", "starttermin", "gehalt", "nachricht", "einwilligung", "sprache", "stelle", "titel", "idem"].map((k) => [k, text(k)]));
    const v = validateBewerbung(fields, files);
    if (!v.ok) return fail("invalid", 400, { field: BEWERBUNG_FIELDS.find((k) => v.errors[k]) });
    const dateien = {};
    for (const [k, f] of Object.entries(files)) {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (!isPdfBytes(bytes) || bytes.length > BEWERBUNG_LIMITS.maxFileBytes) return fail("invalid", 400, { field: k });
      dateien[k] = { name: f.name, bytes };
    }
    const r = await sendBewerbung(v.data, dateien, { leadRef: `BEW-${randomUUID().slice(0, 8).toUpperCase()}` });
    if (!r.ok) {
      console.error(`[service] Bewerbung (${r.generation}): ${r.code}`);
      return fail(r.code === "invalid" ? "invalid" : r.code === "rate_limited" ? "rate_limited" : r.code === "not_available" ? "not_available" : r.code === "not_configured" ? "not_configured" : "unavailable");
    }
    if (r.fehlend) console.error(`[service] Bewerbung ${r.referenz}: ${r.fehlend} Unterlage(n) nicht übertragen`);
    return json({ success: true, referenz: r.referenz, fehlend: r.fehlend });
  },
};

export async function POST(request, ctx) {
  const { art } = await ctx.params;
  const handler = Object.hasOwn(HANDLERS, art) ? HANDLERS[art] : null;
  if (!handler) return fail("not_found", 404);
  try {
    return await handler(request);
  } catch (err) {
    console.error(`[service] ${art}: ${err?.name || "Fehler"}`);
    return fail("unavailable", 503);
  }
}

export function GET() {
  return fail("method_not_allowed", 405);
}
