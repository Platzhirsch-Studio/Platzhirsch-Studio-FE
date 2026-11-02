// GET /showroom/<Testszene>/<stimmung>/<datei> (Segment „_testszene“) – synthetische Testszene des Rundgangs,
// nur Entwicklung und Tests (R3 technik P2-3, recht P2).
//
// Die Dateien (.sog-Splats, Poster, Kamerafahrt, ca. 9 MB) lagen in public/ und wurden
// damit auch im Produktions-Build mit 200 ausgeliefert. Sie liegen jetzt außerhalb von
// public/ im Ordner .data (showroom, Testszene) (gitignored, nicht im Deploy) und werden
// nur ausgeliefert, wenn der Rundgang im Vorschau-Modus läuft – dasselbe Kriterium wie
// die Seite (showroomMode() === "preview": Dev-Server oder SHOWROOM_PREVIEW=1).
// Sonst 404 mit no-store. Die URLs im Manifest (src/lib/showroom/manifest.json)
// bleiben gleich. Ordnername %5Ftestszene = URL-Segment „_testszene“ (Next: private
// Ordner beginnen mit „_“, siehe docs/01-app/01-getting-started/02-project-structure.md).
// Byte-Ranges für die Videos (Safari/iOS spielt MP4 nur mit Range).
import fs from "node:fs/promises";
import path from "node:path";
import { showroomMode } from "@/lib/showroom/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), ".data", "showroom", "_testszene");
const TYPES = {
  ".sog": "application/octet-stream",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".json": "application/json",
};
const SEGMENT = /^[a-z0-9][a-z0-9._-]{0,63}$/i;

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(request, { params }) {
  if (showroomMode() !== "preview") return notFound();
  const { path: parts } = await params;
  if (!Array.isArray(parts) || parts.length < 1 || parts.length > 3 || !parts.every((p) => SEGMENT.test(p) && !p.includes(".."))) return notFound();
  const type = TYPES[path.extname(parts[parts.length - 1]).toLowerCase()];
  if (!type) return notFound();
  const file = path.join(/*turbopackIgnore: true*/ ROOT, ...parts);
  if (!file.startsWith(ROOT + path.sep)) return notFound();
  let buf;
  try {
    buf = await fs.readFile(/*turbopackIgnore: true*/ file);
  } catch {
    return notFound();
  }
  const base = { "Content-Type": type, "Cache-Control": "no-store", "Accept-Ranges": "bytes", "X-Robots-Tag": "noindex" };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
  if (range) {
    const size = buf.length;
    const start = range[1] === "" ? size - Number(range[2]) : Number(range[1]);
    const end = range[1] === "" || range[2] === "" ? size - 1 : Math.min(Number(range[2]), size - 1);
    if (!(start >= 0 && start <= end && start < size)) {
      return new Response(null, { status: 416, headers: { ...base, "Content-Range": `bytes */${size}` } });
    }
    return new Response(buf.subarray(start, end + 1), { status: 206, headers: { ...base, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(buf, { status: 200, headers: { ...base, "Content-Length": String(buf.length) } });
}
