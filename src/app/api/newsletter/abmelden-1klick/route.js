// src/app/api/newsletter/abmelden-1klick/route.js – One-Click-Abmeldung (RFC 8058).
//
// POST ?token=…  Body "List-Unsubscribe=One-Click" (form-encoded): so ruft der
//                Mail-Client (Gmail, Apple Mail, …) die Adresse aus
//                List-Unsubscribe auf. Antwort 200 ohne Personendaten; ein
//                Browser (Accept text/html) bekommt eine Bestätigungsseite.
// GET  ?token=…  Seite mit Rückfrage und Knopf (POST auf dieselbe Adresse).
//                GET meldet NIE ab (Link-Scanner, Vorschau), RFC 8058 §3.2.
// Seite und Antworten: noindex (Meta + X-Robots-Tag), no-store.
// Backend: src/lib/backend/newsletterAbmeldung.js (ph: ph_marketing.api.unsubscribe_one_click,
// alt: Postausgang .data/newsletter/abmeldungen für das Team).
// Kein Origin-Check: One-Click-POSTs kommen vom Mailanbieter, nicht von unserer Seite;
// ohne gültigen Token passiert nichts.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { SEITEN, TOKEN_RE, abmeldeSeite, isOneClickBody, unsubscribeOneClick } from "@/lib/backend/newsletterAbmeldung";
import { clientIp, createRateLimiter } from "@/lib/forms/rateLimit";

export const dynamic = "force-dynamic";

const PATH = "/api/newsletter/abmelden-1klick";
const MAX_BODY = 1024;
const limiter = createRateLimiter();
const LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };
const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
const OUTBOX = path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "newsletter", "abmeldungen");

async function outbox(entry) {
  await mkdir(OUTBOX, { recursive: true });
  const name = `${entry.eingang.replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}.json`;
  await writeFile(path.join(OUTBOX, name), JSON.stringify(entry, null, 2), "utf8");
  console.info(`[newsletter] One-Click-Abmeldung vorgemerkt (${name}) – bitte im Verteiler austragen.`);
}

const html = (seite, status = 200, extra = {}) =>
  new Response(abmeldeSeite({ ...seite, ...extra, action: PATH }), { status, headers: { ...HEADERS, "Content-Type": "text/html; charset=utf-8" } });

const wantsHtml = (request) => /text\/html/i.test(request.headers.get("accept") || "");

export async function GET(request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!TOKEN_RE.test(token)) return html(SEITEN.invalid_token, 404);
  return html(SEITEN.frage, 200, { token });
}

export async function POST(request) {
  const browser = wantsHtml(request);
  const answer = (code, status, seite) => (browser ? html(seite, status) : Response.json({ ok: status < 300, ...(code ? { code } : {}) }, { status, headers: HEADERS }));
  const ip = clientIp(request) || "ohne-ip";
  if (!limiter.take(`one-click:${ip}`, LIMIT).ok) return answer("rate_limited", 429, SEITEN.fehler);

  const token = new URL(request.url).searchParams.get("token") || "";
  let body = "";
  try {
    body = (await request.text()).slice(0, MAX_BODY);
  } catch {
    body = "";
  }
  if (!isOneClickBody(body)) return answer("invalid", 400, SEITEN.frage);

  const r = await unsubscribeOneClick({ token, outbox });
  if (r.ok) return answer(null, 200, SEITEN[r.status] || SEITEN.abgemeldet);
  if (r.code === "invalid_token") return answer("invalid_token", 404, SEITEN.invalid_token);
  if (r.code === "invalid") return answer("invalid", 400, SEITEN.frage);
  console.error(`[newsletter] One-Click-Abmeldung (${r.generation}): ${r.code}`);
  return answer(r.code === "not_configured" ? "not_configured" : "unavailable", 503, SEITEN.fehler);
}
