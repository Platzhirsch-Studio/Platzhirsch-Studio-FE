import { NextResponse } from "next/server";
import { z } from "zod";
import { planSchema } from "@/components/Labs/Sofaplaner/model";
import { savePlan } from "@/components/Labs/Sofaplaner/server/store";
import { readJsonLimited } from "@/components/Labs/Sofaplaner/server/body";
import { ensureCatalog, getFamily } from "@/lib/sofaplaner/catalog.server";
import { clientKey, liveBlocker, planerLimiter } from "@/components/Labs/Kuechenplaner/server/rateLimit";

// POST /de/sofaplaner/teilen  { plan, locale? }  ->  { token, url }
// Welle 2 (EN): locale "en" → the share link opens /en/sofaplaner; FR/IT (01.11.2026) likewise /fr|it/sofaplaner.
// Stores a plan (no personal data) and returns a signed share token.
const MAX_BYTES = 32 * 1024;
const bodySchema = z.object({ plan: planSchema });

// Rate limit per client: 10 links / 10 min. Redis (REST) once LABS_REDIS_REST_URL/_TOKEN
// are set, otherwise in-memory (QM R2 P2-3). Client address: LABS_IP_HEADER /
// KUECHENPLANER_IP_HEADER or the LAST X-Forwarded-For entry – see server/rateLimit.js.
const limiter = planerLimiter("sofaplaner", { max: 10, windowMs: 10 * 60 * 1000 });

export async function POST(request, { params }) {
  const { locale } = await params;
  if (locale !== "de") return NextResponse.json({ error: "not found" }, { status: 404 });

  // QM R2 P2-2/P2-3: production only after release (privacy section) and with Redis.
  const blocked = liveBlocker();
  if (blocked) return NextResponse.json({ error: `Teilen-Links: ${blocked}` }, { status: 503 });

  if (await limiter.limited(clientKey(request.headers))) {
    return NextResponse.json({ error: "Zu viele Links in kurzer Zeit. Bitte später erneut versuchen." }, { status: 429 });
  }

  // Byte limit while reading (server/body.js), never the whole body first.
  const body = await readJsonLimited(request, MAX_BYTES);
  if (body.error) return NextResponse.json({ error: body.error }, { status: body.status });
  const { json } = body;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan ist ungültig.", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }
  // Only plans of a known family with known element codes are stored.
  await ensureCatalog();
  const family = getFamily(parsed.data.plan.family);
  const codes = family ? new Set(family.elements.map((e) => e.code)) : null;
  if (!family || parsed.data.plan.items.some((i) => !codes.has(i.code))) {
    return NextResponse.json({ error: "Plan enthält unbekannte Elemente." }, { status: 400 });
  }
  try {
    const token = await savePlan(parsed.data.plan);
    const lang = ["en", "fr", "it"].includes(json?.locale) ? json.locale : "de";
    const url = new URL(`/${lang}/sofaplaner?p=${encodeURIComponent(token)}`, request.nextUrl.origin).toString();
    return NextResponse.json({ token, url });
  } catch (err) {
    console.error("[sofaplaner] save failed", err);
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
