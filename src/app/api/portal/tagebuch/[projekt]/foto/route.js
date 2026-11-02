import { herkunftFalsch, json, zod400 } from "@/lib/raumzwilling/api";
import { clientIp } from "@/lib/portal/http";
import { rateLimit } from "@/lib/portal/rateLimit";
import { LIMITS } from "@/lib/portal/tagebuch/config";
import { fotoFormSchema } from "@/lib/portal/tagebuch/schemas";
import { verarbeiteBild } from "@/lib/portal/tagebuch/bildPipeline";
import { autorVon, tagebuchApiZugriff } from "@/lib/portal/tagebuch/zugriff";
import { fotoHinzufuegen, fotoLoeschen, TagebuchFehler } from "@/lib/portal/tagebuch/service";

// POST   /api/portal/tagebuch/<projekt>/foto   multipart: bild, phase, titel, hinweis="ja", echt="ja" (Skizze/Modell)
// DELETE /api/portal/tagebuch/<projekt>/foto?id=f-…
// Kunde des Projekts oder Studio-Team. Das Bild wird neu kodiert (AVIF + WebP),
// dabei fallen EXIF/GPS/XMP weg; das Original wird nicht gespeichert.

const fehlerAntwort = (err) => {
  if (err instanceof TagebuchFehler) return json({ error: err.message }, err.status);
  console.error("[tagebuch] foto", err);
  return json({ error: "Das hat nicht geklappt. Bitte später erneut versuchen." }, 500);
};

const ZU_GROSS = Symbol("zu-gross");

/** Liest den Body höchstens bis `max` Bytes und parst ihn danach als multipart/form-data. */
async function begrenztesFormular(request, max) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const teile = [];
  let summe = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    summe += value.byteLength;
    if (summe > max) {
      await reader.cancel().catch(() => {});
      return ZU_GROSS;
    }
    teile.push(value);
  }
  return new Request("http://tagebuch.local/", { method: "POST", headers: { "content-type": request.headers.get("content-type") || "" }, body: Buffer.concat(teile) }).formData();
}

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const z = await tagebuchApiZugriff(request, projekt);
  if (z.antwort) return z.antwort;
  const limit = rateLimit(`tagebuch-foto:${z.kunde?.id || z.team?.name}:${clientIp(request)}`, { limit: 40, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) return json({ error: "Zu viele Uploads. Bitte später erneut versuchen." }, 429, { "Retry-After": String(limit.retryAfterSec) });
  if (Number(request.headers.get("content-length") || 0) > LIMITS.maxBytes + 64 * 1024) return json({ error: "Datei zu groß (max. 25 MB)." }, 413);
  // Body begrenzt lesen (QA Technik P2-1): auch ohne content-length (chunked)
  // bricht der Upload ab, sobald 25 MB + Formular-Overhead überschritten sind.
  const form = await begrenztesFormular(request, LIMITS.maxBytes + 64 * 1024).catch(() => null);
  if (form === ZU_GROSS) return json({ error: "Datei zu groß (max. 25 MB)." }, 413);
  if (!form) return json({ error: "Ungültige Anfrage" }, 400);
  const p = fotoFormSchema.safeParse({
    phase: form.get("phase") || "",
    titel: form.get("titel") || "",
    echt: form.get("echt") || "",
    hinweis: form.get("hinweis") || "",
  });
  if (!p.success) {
    const eigene = p.error.issues.find((i) => ["hinweis", "echt"].includes(i.path[0]));
    return eigene ? json({ error: eigene.message }, 400) : zod400(p.error);
  }
  const datei = form.get("bild");
  if (!datei || typeof datei === "string" || datei.size === 0) return json({ error: "Bitte ein Foto wählen." }, 400);
  if (datei.size > LIMITS.maxBytes) return json({ error: "Datei zu groß (max. 25 MB)." }, 413);
  const bild = await verarbeiteBild(Buffer.from(await datei.arrayBuffer()));
  if (!bild.ok) return json({ error: bild.fehler }, bild.status);
  try {
    const foto = await fotoHinzufuegen(projekt, z, p.data, bild, autorVon(z));
    return json({ ok: true, foto }, 201);
  } catch (err) {
    return fehlerAntwort(err);
  }
}

export async function DELETE(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const z = await tagebuchApiZugriff(request, projekt);
  if (z.antwort) return z.antwort;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^f-[a-z0-9]{10}$/.test(id)) return json({ error: "Foto nicht gefunden" }, 404);
  try {
    await fotoLoeschen(projekt, z, id);
    return json({ ok: true });
  } catch (err) {
    return fehlerAntwort(err);
  }
}
