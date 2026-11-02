import { json } from "@/lib/raumzwilling/api";
import { tagebuchAdapter } from "@/lib/portal/tagebuch/adapter";
import { BILD_NAME } from "@/lib/portal/tagebuch/dateiAdapter";
import { tagebuchApiZugriff } from "@/lib/portal/tagebuch/zugriff";

// GET /api/portal/tagebuch/<projekt>/bild/<f-…>-<breite>.<avif|webp>
// Privat: nur Kunde des Projekts oder Studio-Team. Nie in geteilten Caches
// (next.config.js nimmt /api/ von der 1-Jahres-Cache-Regel aus).

export async function GET(request, { params }) {
  const { projekt, datei } = await params;
  if (!BILD_NAME.test(String(datei))) return json({ error: "Nicht gefunden" }, 404);
  const z = await tagebuchApiZugriff(request, projekt);
  if (z.antwort) return z.antwort;
  const daten = await tagebuchAdapter().leseBild(projekt, datei);
  if (!daten) return json({ error: "Nicht gefunden" }, 404);
  return new Response(daten, {
    status: 200,
    headers: {
      "Content-Type": datei.endsWith(".avif") ? "image/avif" : "image/webp",
      "Content-Length": String(daten.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Disposition": "inline",
    },
  });
}
