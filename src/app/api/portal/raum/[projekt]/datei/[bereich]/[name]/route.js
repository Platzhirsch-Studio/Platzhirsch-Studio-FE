import { readFile } from "node:fs/promises";
import { raumApi } from "@/lib/raumzwilling/access";
import { json } from "@/lib/raumzwilling/api";
import { dateiMitEndung, dateiPfad } from "@/lib/raumzwilling/store";

// GET /api/portal/raum/<projekt>/datei/<bereich>/<name ohne Endung>
// Liefert Splat-Bündel, Standbilder, Skizzen und Sprachnachrichten NUR mit
// Portal-Session (Kunde des Projekts), Team-Cookie oder Raum-Link. Die Dateien
// liegen außerhalb von public/ (.data/raumzwilling). Strikte Dateinamen-Liste.

const TYPEN = {
  json: "application/json; charset=utf-8",
  webp: "image/webp",
  svg: "image/svg+xml",
  webm: "audio/webm",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

export async function GET(request, { params }) {
  const { projekt, bereich, name } = await params;
  const e = await raumApi(request, projekt, "ansehen");
  if (e.antwort) return e.antwort;
  // URL ohne Endung (siehe store.js: sonst greift die 1-Jahres-Cache-Regel)
  const datei = e.raum ? dateiMitEndung(projekt, bereich, name) : null;
  const pfad = datei ? dateiPfad(projekt, bereich, datei) : null;
  if (!pfad) return json({ error: "Nicht gefunden" }, 404);
  let daten;
  try {
    daten = await readFile(pfad);
  } catch {
    return json({ error: "Nicht gefunden" }, 404);
  }
  const ext = datei.split(".").pop();
  return new Response(daten, {
    status: 200,
    headers: {
      "Content-Type": TYPEN[ext] || "application/octet-stream",
      "Content-Length": String(daten.length),
      // Privat: nie in geteilten Caches, nicht dauerhaft im Browser.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Disposition": "inline",
      "X-Robots-Tag": "noindex, nofollow",
      ...(ext === "svg" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
    },
  });
}
