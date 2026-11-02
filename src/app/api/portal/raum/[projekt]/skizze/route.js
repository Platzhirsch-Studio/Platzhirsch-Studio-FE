import { rm } from "node:fs/promises";
import sharp from "sharp";
import { raumApi } from "@/lib/raumzwilling/access";
import { herkunftFalsch, json, zod400 } from "@/lib/raumzwilling/api";
import { skizzeSchema } from "@/lib/raumzwilling/schemas";
import { aendereRaum, dateiPfad, schreibeDatei } from "@/lib/raumzwilling/store";
import { detectType } from "@/lib/upload/magic";
import { melde } from "@/lib/raumzwilling/notify";

// POST /api/portal/raum/<projekt>/skizze  (nur Team, multipart)
//   bild (Scan/Foto der echten Handzeichnung), titel, datum (JJJJ-MM-TT), echt="ja"
// Inhaber-Entscheidung Nr. 8: nur echtes Material. Das Team bestätigt mit
// echt="ja", dass es ein Scan oder Foto von Harald Menghins Originalzeichnung
// ist (keine KI, kein Rendering). Das Bild wird neu kodiert (WebP, ≤ 2400 px),
// dabei fallen alle Metadaten weg.
// DELETE ?id=s-…

const MAX = 25 * 1024 * 1024;
const zufall = () => Math.random().toString(36).slice(2, 12).padEnd(10, "0");

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "bearbeiten");
  if (e.antwort) return e.antwort;
  if (!e.raum) return json({ error: "Raum nicht gefunden" }, 404);
  if (Number(request.headers.get("content-length") || 0) > MAX + 64 * 1024) return json({ error: "Datei zu groß (max. 25 MB)." }, 413);
  const form = await request.formData().catch(() => null);
  if (!form) return json({ error: "Ungültige Anfrage" }, 400);
  const p = skizzeSchema.safeParse({ titel: form.get("titel") || "", datum: form.get("datum") || "", echt: form.get("echt") || "" });
  if (!p.success) {
    if (p.error.issues.some((i) => i.path[0] === "echt")) return json({ error: "Bitte bestätigen: Scan oder Foto der echten Handzeichnung." }, 400);
    return zod400(p.error);
  }
  const datei = form.get("bild");
  if (!datei || typeof datei === "string" || datei.size > MAX) return json({ error: "Bitte ein Bild der Skizze wählen (max. 25 MB)." }, 400);
  const buf = Buffer.from(await datei.arrayBuffer());
  const typ = detectType(buf);
  if (!typ || typ.family !== "image") return json({ error: "Nur Bilder (JPG, PNG, WebP, HEIC)." }, 415);

  let webp;
  let info;
  try {
    const out = await sharp(buf, { failOn: "error" }).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
    webp = out.data;
    info = out.info;
  } catch {
    return json({ error: "Bild konnte nicht gelesen werden." }, 415);
  }
  const id = `s-${zufall()}`;
  const name = `${id}.webp`;
  await schreibeDatei(projekt, "skizze", name, webp);
  const skizze = {
    id,
    titel: p.data.titel,
    datum: p.data.datum,
    datei: name,
    breite: info.width,
    hoehe: info.height,
    echt: true,
    urheber: "Harald Menghin",
    art: "Handzeichnung (Scan/Foto des Originals)",
    hochgeladenAm: new Date().toISOString(),
    von: e.team?.name || "Team",
  };
  await aendereRaum(projekt, async (raum) => {
    raum.skizzen = [...(raum.skizzen || []), skizze];
    return { raum, ergebnis: null };
  });
  await melde(projekt, "skizze", `Neue Handskizze „${skizze.titel}“ im Raum ${projekt}.`);
  return json({ ok: true, skizze }, 201);
}

export async function DELETE(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "bearbeiten");
  if (e.antwort) return e.antwort;
  const id = new URL(request.url).searchParams.get("id") || "";
  const weg = await aendereRaum(projekt, async (raum) => {
    const s = raum?.skizzen?.find((x) => x.id === id);
    if (!s) return { raum: null, ergebnis: null };
    raum.skizzen = raum.skizzen.filter((x) => x.id !== id);
    return { raum, ergebnis: s };
  });
  if (!weg) return json({ error: "Skizze nicht gefunden" }, 404);
  const pfad = dateiPfad(projekt, "skizze", weg.datei);
  if (pfad) await rm(pfad, { force: true });
  return json({ ok: true });
}
