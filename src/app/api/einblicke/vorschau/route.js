// GET /api/einblicke/vorschau?datei=<stamm>--<gerät>.<png|jpg|webp> – liefert
// einen Screenshot aus .data/einblicke/screenshots/ für die lokale Vorschau
// /de/preview/einblicke. Nur Dev bzw. FREIGABE_PREVIEW=1 (nie
// VERCEL_ENV=production), sonst 404. Dateiname streng geprüft (kein Pfad).
import { readFile } from "node:fs/promises";
import path from "node:path";
import { dirs } from "@/lib/einblicke/store.server";
import { SHOT_RE, einblickePreviewEnabled } from "@/lib/einblicke/vorschau.server";

export const runtime = "nodejs";

const TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
const notFound = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request) {
  if (!einblickePreviewEnabled()) return notFound();
  const datei = new URL(request.url).searchParams.get("datei") || "";
  if (!SHOT_RE.test(datei)) return notFound();
  try {
    const body = await readFile(path.join(dirs().screenshots, datei));
    return new Response(body, {
      headers: { "Content-Type": TYPES[datei.split(".").pop()], "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch {
    return notFound();
  }
}
