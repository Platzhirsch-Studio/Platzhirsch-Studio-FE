import { herkunftFalsch, json, leseJson, zod400 } from "@/lib/raumzwilling/api";
import { clientIp } from "@/lib/portal/http";
import { rateLimit } from "@/lib/portal/rateLimit";
import { freigabeInputSchema, FREIGABE_ID } from "@/lib/portal/tagebuch/schemas";
import { tagebuchApiZugriff } from "@/lib/portal/tagebuch/zugriff";
import { freigabeAnlegen, TagebuchFehler, widerrufen } from "@/lib/portal/tagebuch/service";

// POST   /api/portal/tagebuch/<projekt>/freigabe   JSON { fotoIds, anzeige, vorname?, ort?, einwilligung: true, version }
//        → Freigabe „eingereicht“ (Einwilligung mit Version und Zeitpunkt gespeichert)
// DELETE /api/portal/tagebuch/<projekt>/freigabe?id=fg-…   Widerruf (jederzeit, sofort offline)
// Nur der Kunde des Projekts. Nichts wird per E-Mail versendet.

const fehler = (err) => {
  if (err instanceof TagebuchFehler) return json({ error: err.message }, err.status);
  console.error("[tagebuch] freigabe", err);
  return json({ error: "Das hat nicht geklappt. Bitte später erneut versuchen." }, 500);
};

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const z = await tagebuchApiZugriff(request, projekt);
  if (z.antwort) return z.antwort;
  const limit = rateLimit(`tagebuch-freigabe:${z.kunde?.id || "team"}:${clientIp(request)}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) return json({ error: "Zu viele Versuche. Bitte später erneut versuchen." }, 429);
  const { daten, fehler: f } = await leseJson(request, 16 * 1024);
  if (f) return f;
  const p = freigabeInputSchema.safeParse(daten);
  if (!p.success) {
    const eigene = p.error.issues.find((i) => ["einwilligung", "version", "vorname", "ort"].includes(i.path[0]));
    return eigene ? json({ error: eigene.message, feld: eigene.path[0] }, 400) : zod400(p.error);
  }
  try {
    const freigabe = await freigabeAnlegen(projekt, z, p.data);
    return json({ ok: true, freigabe: { id: freigabe.id, status: freigabe.status, erstellt: freigabe.erstellt } }, 201);
  } catch (err) {
    return fehler(err);
  }
}

export async function DELETE(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const z = await tagebuchApiZugriff(request, projekt);
  if (z.antwort) return z.antwort;
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!FREIGABE_ID.test(id)) return json({ error: "Freigabe nicht gefunden" }, 404);
  try {
    await widerrufen(projekt, z, id);
    return json({ ok: true });
  } catch (err) {
    return fehler(err);
  }
}
