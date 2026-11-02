import { raumApi } from "@/lib/raumzwilling/access";
import { autorVon, herkunftFalsch, json, zod400 } from "@/lib/raumzwilling/api";
import { RAUM_CONFIG } from "@/lib/raumzwilling/config";
import { kommentarSchema } from "@/lib/raumzwilling/schemas";
import { aendereRaum, schreibeDatei } from "@/lib/raumzwilling/store";
import { kommentarId } from "@/lib/raumzwilling/modell";
import { AUDIO_TYPEN, audioSignaturOk } from "@/lib/raumzwilling/medien";
import { melde } from "@/lib/raumzwilling/notify";
import { rateLimit } from "@/lib/portal/rateLimit";

// POST /api/portal/raum/<projekt>/kommentar
//   JSON:      { text, punkt?:[x,y,z] (Welt-Meter), bezug:{art, volumenId?} }
//   multipart: Felder wie oben (punkt/bezug als JSON-Text) + audio (Blob),
//              sekunden, einwilligung="ja"
// Speichert im Raum-Datensatz (Mock-Store), Audio außerhalb von public/.
// Benachrichtigt das Team nur über den Postausgang – keine Mail.
// DELETE ?id=…  eigener Kommentar (oder Team).

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "kommentieren");
  if (e.antwort) return e.antwort;
  if (!e.raum) return json({ error: "Raum nicht gefunden" }, 404);

  const limit = rateLimit(`raum-kommentar:${projekt}:${e.zugriff.rolle}`, { limit: 40, windowMs: 60 * 60 * 1000 });
  if (!limit.ok) return json({ error: "Zu viele Kommentare in kurzer Zeit." }, 429);

  const typ = request.headers.get("content-type") || "";
  let felder;
  let audio = null;
  if (typ.includes("multipart/form-data")) {
    if (Number(request.headers.get("content-length") || 0) > RAUM_CONFIG.comment.voiceMaxBytes + 64 * 1024) {
      return json({ error: "Aufnahme zu groß (max. 5 MB)." }, 413);
    }
    const form = await request.formData().catch(() => null);
    if (!form) return json({ error: "Ungültige Anfrage" }, 400);
    const roh = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
    try {
      felder = {
        text: roh.text || "",
        punkt: roh.punkt ? JSON.parse(roh.punkt) : null,
        bezug: roh.bezug ? JSON.parse(roh.bezug) : undefined,
        sekunden: roh.sekunden,
        einwilligung: roh.einwilligung,
      };
    } catch {
      return json({ error: "Ungültige Anfrage" }, 400);
    }
    const datei = form.get("audio");
    if (datei && typeof datei !== "string") {
      if (felder.einwilligung !== "ja") return json({ error: "Bitte der Verarbeitung der Sprachnachricht zustimmen." }, 400);
      if (datei.size < 512 || datei.size > RAUM_CONFIG.comment.voiceMaxBytes) return json({ error: "Aufnahme zu kurz oder zu groß (max. 5 MB)." }, 400);
      const mime = String(datei.type || "").split(";")[0].trim().toLowerCase();
      const ext = AUDIO_TYPEN[mime];
      if (!ext) return json({ error: "Dateiformat nicht unterstützt." }, 415);
      const buf = Buffer.from(await datei.arrayBuffer());
      if (!audioSignaturOk(buf, ext)) return json({ error: "Datei ist keine gültige Audioaufnahme." }, 415);
      audio = { buf, ext, mime };
    }
  } else {
    try {
      felder = await request.json();
    } catch {
      return json({ error: "Ungültige Anfrage" }, 400);
    }
  }

  const p = kommentarSchema.safeParse(felder);
  if (!p.success) return zod400(p.error);
  const { text, punkt, bezug, sekunden } = p.data;
  if (!text && !audio) return json({ error: "Bitte einen Kommentar schreiben oder eine Sprachnachricht aufnehmen." }, 400);
  if (bezug.art === "volumen" && !e.raum.platzierung?.volumen?.some((v) => v.id === bezug.volumenId)) {
    return json({ error: "Stück nicht gefunden" }, 404);
  }

  const id = kommentarId();
  let audioInfo = null;
  if (audio) {
    const name = `a-${id.slice(2)}.${audio.ext}`;
    await schreibeDatei(projekt, "audio", name, audio.buf);
    audioInfo = { datei: name, mime: audio.mime, sekunden: Math.round(sekunden || 0), einwilligungAm: new Date().toISOString() };
  }
  const kommentar = {
    id,
    punkt: bezug.art === "punkt" ? punkt || null : null,
    bezug,
    text,
    audio: audioInfo,
    autor: autorVon(e),
    rolle: e.zugriff.rolle,
    erstellt: new Date().toISOString(),
  };
  await aendereRaum(projekt, async (raum) => {
    if (!raum) throw new Error("Raum fehlt");
    raum.kommentare = [...(raum.kommentare || []), kommentar].slice(-500);
    return { raum, ergebnis: null };
  });
  if (e.zugriff.rolle !== "team") await melde(projekt, "kommentar", `Neuer ${audio ? "Sprach-" : ""}Kommentar im Raum ${projekt}.`);
  return json({ ok: true, kommentar }, 201);
}

export async function DELETE(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "kommentieren");
  if (e.antwort) return e.antwort;
  const id = new URL(request.url).searchParams.get("id") || "";
  const autor = autorVon(e);
  const ok = await aendereRaum(projekt, async (raum) => {
    const k = raum?.kommentare?.find((x) => x.id === id);
    if (!k) return { raum: null, ergebnis: false };
    if (e.zugriff.rolle !== "team" && (k.rolle !== e.zugriff.rolle || k.autor !== autor)) return { raum: null, ergebnis: false };
    raum.kommentare = raum.kommentare.filter((x) => x.id !== id);
    return { raum, ergebnis: k };
  });
  if (!ok) return json({ error: "Kommentar nicht gefunden" }, 404);
  if (ok.audio?.datei) {
    const { rm } = await import("node:fs/promises");
    const { dateiPfad } = await import("@/lib/raumzwilling/store");
    const pfad = dateiPfad(projekt, "audio", ok.audio.datei);
    if (pfad) await rm(pfad, { force: true });
  }
  return json({ ok: true });
}
