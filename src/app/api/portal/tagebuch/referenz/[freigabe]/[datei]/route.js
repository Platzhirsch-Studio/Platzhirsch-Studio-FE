import { json } from "@/lib/raumzwilling/api";
import { tagebuchAdapter } from "@/lib/portal/tagebuch/adapter";
import { BILD_NAME } from "@/lib/portal/tagebuch/dateiAdapter";
import { FREIGABE_ID } from "@/lib/portal/tagebuch/schemas";

// GET /api/portal/tagebuch/referenz/<fg-…>/<f-…>-<breite>.<avif|webp>
// ÖFFENTLICH, aber nur solange die Freigabe „veroeffentlicht“ ist und das Bild
// zur Auswahl des Kunden gehört. Nach Widerruf oder Zurückziehen: 404.
// Kurzer Cache (60 s, must-revalidate), damit ein Widerruf schnell greift.
// Die Projektseiten binden diese Bilder ohne next/image-Optimizer ein: dessen
// Plattencache (minimumCacheTTL 30 Tage) würde widerrufene Bilder weiter ausliefern.

export async function GET(request, { params }) {
  const { freigabe, datei } = await params;
  const m = BILD_NAME.exec(String(datei));
  if (!FREIGABE_ID.test(String(freigabe)) || !m) return json({ error: "Nicht gefunden" }, 404);
  const a = tagebuchAdapter();
  const f = await a.leseFreigabe(freigabe);
  if (!f || f.status !== "veroeffentlicht") return json({ error: "Nicht gefunden" }, 404);
  if (process.env.NODE_ENV === "production" && f.beispiel) return json({ error: "Nicht gefunden" }, 404);
  if (!f.bilder.some((b) => b.id === m[1] && b.varianten.some((v) => v.w === Number(m[2])))) return json({ error: "Nicht gefunden" }, 404);
  const daten = await a.leseReferenzBild(freigabe, datei);
  if (!daten) return json({ error: "Nicht gefunden" }, 404);
  return new Response(daten, {
    status: 200,
    headers: {
      "Content-Type": m[3] === "avif" ? "image/avif" : "image/webp",
      "Content-Length": String(daten.length),
      "Cache-Control": "public, max-age=60, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
