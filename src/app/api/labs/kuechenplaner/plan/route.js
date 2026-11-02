// Küchenplaner – Planung speichern (Konfiguration + Screenshot) und per
// signiertem Link wieder abrufen. Keine Kontaktdaten: die laufen über
// /api/beratung_anfrage. Speicher: Adapter in components/Labs/Kuechenplaner/server/store.js.
//
// Schutz (QA Runde 1, P2-8):
// - Herkunft: nur Aufrufe von der eigenen Seite (Sec-Fetch-Site / Origin), sonst 403.
// - Drosselung je Client (server/rateLimit.js): Redis per REST, sobald
//   LABS_REDIS_REST_URL/_TOKEN gesetzt sind, sonst Arbeitsspeicher. IP nur aus einem
//   vertrauenswürdigen Header (LABS_IP_HEADER bzw. KUECHENPLANER_IP_HEADER) oder dem
//   letzten X-Forwarded-For-Eintrag – nie aus dem ersten (frei setzbar).
// - Livebetrieb (QM R2 P2-2/P2-3): im Produktions-Build nur mit
//   NEXT_PUBLIC_LABS_PLANER_SENDEN=1 und Redis-Konfiguration, sonst 503.
// - Globale Obergrenze: Pläne pro 24 h und Gesamtspeicher (store.QUOTA), sonst 503.
// - Bild: JPEG (Magic Number), max. 1,5 MB, max. 1200 px breit / 1600 px hoch.
import { NextResponse } from "next/server";
import { z } from "zod";
import { planSchema } from "@/components/Labs/Kuechenplaner/planState";
import { clientKey, liveBlocker, planerLimiter } from "@/components/Labs/Kuechenplaner/server/rateLimit";
import { hasSecret, loadPlan, loadPlanImage, quotaOk, savePlan, verify } from "@/components/Labs/Kuechenplaner/server/store";
import { isSameOriginRequest } from "@/lib/forms/origin";

const MAX_BODY = 2_500_000; // Bytes (Base64-Screenshot + JSON)
const MAX_IMAGE = 1_500_000; // Bytes nach Dekodierung
const MAX_W = 1200;
const MAX_H = 1600;

const bodySchema = z.object({
  plan: planSchema,
  consent: z.literal(true),
  image: z
    .string()
    .max(MAX_BODY)
    .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/)
    .optional(),
});

// Drosselung je Client: 10 Speicherungen / 10 Minuten. Redis, sobald konfiguriert,
// sonst Arbeitsspeicher (server/rateLimit.js, QM R2 P2-3).
const limiter = planerLimiter("kuechenplaner", { max: 10, windowMs: 600_000 });

// r8-leads (technik P2): one shared same-origin rule, lib/forms/origin.js.
const sameOrigin = (request) => isSameOriginRequest(request, { requireOrigin: process.env.NODE_ENV === "production" });

/** Breite/Höhe aus dem SOF-Segment eines JPEG lesen (null, wenn nicht gefunden). */
function jpegSize(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

/**
 * Body lesen, aber nie mehr als `max` Bytes puffern (code-tests Fix 05): Ohne Content-Length
 * (chunked) griff die Größenprüfung oben nicht, request.text() las beliebig viel in den Speicher.
 * Rückgabe: Text oder null, wenn zu groß.
 */
async function readCapped(request, max) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const noStore = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
const fail = (error, status) => NextResponse.json({ ok: false, error }, { status, headers: noStore });

export async function POST(request) {
  if (!hasSecret()) return fail("Speichern nicht konfiguriert", 503);
  // QM R2 P2-2/P2-3: im Produktions-Build erst nach Freigabe und mit Redis.
  const blocked = liveBlocker();
  if (blocked) return fail(blocked, 503);
  if (!sameOrigin(request)) return fail("Herkunft nicht erlaubt", 403);
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) return fail("Zu groß", 413);
  if (await limiter.limited(clientKey(request.headers))) return fail("Zu viele Anfragen", 429);
  if (!(await quotaOk(len))) return fail("Speicher derzeit voll – bitte später erneut versuchen", 503);

  let json;
  try {
    const text = await readCapped(request, MAX_BODY);
    if (text === null) return fail("Zu groß", 413);
    json = JSON.parse(text);
  } catch {
    return fail("Ungültiges JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Ungültige Planung", issues: parsed.error.issues.slice(0, 5).map((i) => i.path.join(".")) },
      { status: 400, headers: noStore },
    );
  }

  let img = null;
  if (parsed.data.image) {
    img = Buffer.from(parsed.data.image.split(",")[1], "base64");
    const isJpeg = img.length > 3 && img[0] === 0xff && img[1] === 0xd8 && img[2] === 0xff;
    const size = isJpeg ? jpegSize(img) : null;
    if (!isJpeg || img.length > MAX_IMAGE || !size || size.w > MAX_W || size.h > MAX_H) return fail("Bild ungültig oder zu groß", 400);
  }

  const { id, sig } = await savePlan(parsed.data.plan, img);
  return NextResponse.json({ ok: true, id, sig, imagePath: img ? `/api/labs/kuechenplaner/plan?id=${id}&sig=${sig}&bild=1` : null }, { headers: noStore });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  const sig = searchParams.get("sig") || "";
  if (!hasSecret() || !verify(id, sig)) return fail("Link ungültig", 403);
  if (searchParams.get("bild") === "1") {
    const buf = await loadPlanImage(id);
    if (!buf) return fail("Nicht gefunden", 404);
    return new NextResponse(buf, { headers: { ...noStore, "Content-Type": "image/jpeg" } });
  }
  const rec = await loadPlan(id);
  if (!rec) return fail("Nicht gefunden", 404);
  return NextResponse.json({ ok: true, id: rec.id, createdAt: rec.createdAt, plan: rec.plan }, { headers: noStore });
}
