import { NextResponse } from "next/server";
import { adapterName } from "@/lib/portal/config";
import { requireApiSession } from "@/lib/portal/dal";
import { isSameOrigin, noStore } from "@/lib/portal/http";
import { rateLimit } from "@/lib/portal/rateLimit";
import { VOICE_MAX_BYTES, VOICE_TYPES, voiceMetaSchema } from "@/components/Portal/Planung/schemas";
import { loadPlanning } from "@/components/Portal/Planung/server/planungData";
import { addEntry, hasEntry, saveVoice } from "@/components/Portal/Planung/server/planungStore";

// POST /api/portal/feedback/voice  (multipart/form-data, session + same origin)
// fields: audio (Blob), projectId, renderingId?, parentId?, durationSec, consent="ja"
// Checks size, declared type AND file signature, stores the file outside
// /public in /.data/portal/feedback/ and adds a "sprachnachricht" entry.

const json = (body, status = 200) => NextResponse.json(body, { status, headers: noStore });

/** Container signature must match the declared type. */
function signatureOk(bytes, ext) {
  const ascii = (from, to) => String.fromCharCode(...bytes.subarray(from, to));
  switch (ext) {
    case "webm":
      return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    case "ogg":
      return ascii(0, 4) === "OggS";
    case "m4a":
      return ascii(4, 8) === "ftyp";
    case "mp3":
      return ascii(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    case "wav":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE";
    default:
      return false;
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Ungültige Herkunft" }, 403);
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const { portal } = auth;

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > VOICE_MAX_BYTES + 64 * 1024) return json({ error: "Aufnahme zu groß (max. 5 MB)." }, 413);

  const limit = rateLimit(`planung-voice:${portal.customerId}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) return json({ error: "Zu viele Sprachnachrichten in kurzer Zeit." }, 429);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }
  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
  const meta = voiceMetaSchema.safeParse(fields);
  if (!meta.success) {
    const consentMissing = meta.error.issues.some((i) => i.path[0] === "consent");
    return json({ error: consentMissing ? "Bitte der Verarbeitung der Sprachnachricht zustimmen." : "Bitte Eingaben prüfen." }, 400);
  }

  const file = form.get("audio");
  if (!file || typeof file === "string") return json({ error: "Keine Aufnahme erhalten." }, 400);
  if (file.size < 512 || file.size > VOICE_MAX_BYTES) return json({ error: "Aufnahme zu kurz oder zu groß (max. 5 MB)." }, 400);
  const mime = String(file.type || "").split(";")[0].trim().toLowerCase();
  const ext = VOICE_TYPES[mime];
  if (!ext) return json({ error: "Dateiformat nicht unterstützt." }, 415);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!signatureOk(buffer, ext)) return json({ error: "Datei ist keine gültige Audioaufnahme." }, 415);

  const { projectId, renderingId, parentId, durationSec } = meta.data;
  const planning = await loadPlanning(portal, projectId);
  if (!planning) return json({ error: "Projekt nicht gefunden" }, 404);
  const variant = renderingId ? planning.variants.find((v) => v.id === renderingId) : null;
  if (renderingId && !variant) return json({ error: "Variante nicht gefunden" }, 404);
  if (parentId && !(await hasEntry(portal.customerId, projectId, parentId))) return json({ error: "Beitrag nicht gefunden" }, 404);

  try {
    const audio = await saveVoice(buffer, { mime, ext, durationSec });
    const label = variant ? `Variante ${variant.letter}` : "Projekt";
    let adapterFeedbackId = null;
    try {
      const res = await portal.addFeedback({
        projectId,
        target: variant ? { kind: "rendering", id: variant.id } : { kind: "projekt" },
        message: `Sprachnachricht (${Math.round(durationSec)} s) zu ${label} – abrufbar im Kundenportal (${audio.id}).`,
      });
      adapterFeedbackId = res?.id || null;
    } catch (err) {
      if (adapterName() === "mock") throw err; // local store failed -> 500 below
      console.warn("[portal/planung] addFeedback über Adapter fehlgeschlagen:", err.message);
    }
    const author = [portal.customer.firstName, portal.customer.lastName].filter(Boolean).join(" ") || portal.customer.displayName;
    const entry = await addEntry(
      portal.customerId,
      { kind: "sprachnachricht", projectId, ...(renderingId ? { renderingId } : {}), ...(parentId ? { parentId } : {}), body: "" },
      { author, audio, consentAt: new Date().toISOString(), adapterFeedbackId }
    );
    return json({ ok: true, entry }, 201);
  } catch (err) {
    console.error("[portal/planung] Sprachnachricht speichern fehlgeschlagen:", err);
    return json({ error: "Nicht gespeichert – technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
