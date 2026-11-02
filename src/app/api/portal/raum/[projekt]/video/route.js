import { open, mkdir, readFile, writeFile, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { raumApi } from "@/lib/raumzwilling/access";
import { herkunftFalsch, json, leseJson, zod400 } from "@/lib/raumzwilling/api";
import { CONSENT_TEXT_VERSION } from "@/lib/raumzwilling/einwilligung";
import { RAUM_CONFIG } from "@/lib/raumzwilling/config";
import { videoStartSchema } from "@/lib/raumzwilling/schemas";
import { aendereRaum, videoDir } from "@/lib/raumzwilling/store";
import { neuerRaum, loeschdatum } from "@/lib/raumzwilling/modell";
import { entferneVideoOrt } from "@/lib/raumzwilling/medien";
import { melde } from "@/lib/raumzwilling/notify";
import { detectType } from "@/lib/upload/magic";
import { rateLimit } from "@/lib/portal/rateLimit";

// Raumvideo hochladen (Kunde des Projekts oder Team), in 4-MB-Stücken.
//   POST ?schritt=start   { name, bytes, typ, sekunden, einwilligung:"ja", a4? } → { uploadId, stueck }
//   PUT  ?upload=<id>&offset=<n>   Rohdaten eines Stücks (≤ 4 MB)               → { empfangen }
//   GET  ?upload=<id>                                                          → { empfangen } (Fortsetzen)
//   POST ?schritt=fertig  { uploadId }  → Dateityp per Signatur, Ortsangaben entfernt,
//                                         Status „in-arbeit“, Job „wartet“, Team im Postausgang.
// Das Video liegt in .data/raumzwilling/<projekt>/video/ (nie public/) und
// wird nach dem Job gelöscht (RAUM_CONFIG.deleteVideoAfterJob).

const V = RAUM_CONFIG.video;
const meta = (projekt) => path.join(videoDir(projekt), "eingang.json");
const teil = (projekt) => path.join(videoDir(projekt), "eingang.part");

async function leseEingang(projekt) {
  try {
    return JSON.parse(await readFile(meta(projekt), "utf8"));
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const { projekt } = await params;
  const e = await raumApi(request, projekt, "video");
  if (e.antwort) return e.antwort;
  const ein = await leseEingang(projekt);
  const id = new URL(request.url).searchParams.get("upload");
  if (!ein || ein.uploadId !== id) return json({ error: "Upload nicht gefunden" }, 404);
  return json({ empfangen: ein.empfangen, bytes: ein.bytes });
}

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "video");
  if (e.antwort) return e.antwort;
  const schritt = new URL(request.url).searchParams.get("schritt");
  const { daten, fehler } = await leseJson(request, 8 * 1024);
  if (fehler) return fehler;

  if (schritt === "start") {
    const limit = rateLimit(`raum-video:${projekt}`, { limit: 6, windowMs: 60 * 60 * 1000 });
    if (!limit.ok) return json({ error: "Zu viele Uploads in kurzer Zeit. Bitte später erneut versuchen." }, 429);
    const p = videoStartSchema.safeParse(daten);
    if (!p.success) {
      if (p.error.issues.some((i) => i.path[0] === "einwilligung")) return json({ error: "Bitte der Verarbeitung Ihres Raumvideos zustimmen." }, 400);
      if (p.error.issues.some((i) => i.path[0] === "bytes")) return json({ error: "Das Video ist zu groß (max. 300 MB)." }, 413);
      if (p.error.issues.some((i) => i.path[0] === "sekunden")) return json({ error: "Das Video ist länger als 2 Minuten. Bitte kürzer aufnehmen." }, 400);
      return zod400(p.error);
    }
    if (!V.mimes.includes(p.data.typ.split(";")[0])) return json({ error: "Bitte ein Video im Format MP4, MOV oder WebM." }, 415);
    if (!e.raum && e.zugriff.rolle !== "kunde") return json({ error: "Raum fehlt" }, 409);
    if (e.raum && ["in-arbeit"].includes(e.raum.status)) return json({ error: "Ihr Raum wird gerade verarbeitet." }, 409);
    const uploadId = randomUUID();
    await mkdir(videoDir(projekt), { recursive: true });
    await rm(teil(projekt), { force: true });
    await writeFile(teil(projekt), Buffer.alloc(0));
    const jetzt = new Date().toISOString();
    await writeFile(meta(projekt), JSON.stringify({ uploadId, name: p.data.name, bytes: p.data.bytes, typ: p.data.typ, sekunden: p.data.sekunden, a4: Boolean(p.data.a4), empfangen: 0, start: jetzt }));
    await aendereRaum(projekt, async (raum) => {
      const r = raum || neuerRaum({ projektId: projekt, customerId: e.kunde.id, titel: e.projekt?.room || e.projekt?.title });
      r.einwilligung = { version: CONSENT_TEXT_VERSION, am: jetzt, rolle: e.zugriff.rolle };
      return { raum: r, ergebnis: null };
    });
    return json({ uploadId, stueck: V.chunkBytes }, 201);
  }

  if (schritt === "fertig") {
    const ein = await leseEingang(projekt);
    if (!ein || ein.uploadId !== daten.uploadId) return json({ error: "Upload nicht gefunden" }, 404);
    const groesse = (await stat(teil(projekt)).catch(() => null))?.size ?? 0;
    if (groesse !== ein.bytes) return json({ error: "Das Video ist noch nicht vollständig.", empfangen: groesse }, 409);
    const buf = await readFile(teil(projekt));
    const typ = detectType(buf.subarray(0, 64));
    if (!typ || typ.family !== "video") {
      await rm(teil(projekt), { force: true });
      return json({ error: "Die Datei ist kein Video." }, 415);
    }
    const bereinigt = ["mp4", "mov", "3gp"].includes(typ.ext) ? entferneVideoOrt(buf) : 0;
    const ziel = path.join(videoDir(projekt), `original.${typ.ext}`);
    await writeFile(ziel, buf);
    await rm(teil(projekt), { force: true });
    await rm(meta(projekt), { force: true });
    const jetzt = new Date().toISOString();
    await aendereRaum(projekt, async (raum) => {
      raum.status = "in-arbeit";
      raum.video = { name: ein.name, datei: path.basename(ziel), bytes: ein.bytes, dauer: ein.sekunden, a4: ein.a4, empfangen: jetzt, ortEntfernt: bereinigt, geloescht: false };
      raum.qualitaet = null;
      raum.job = { status: "wartet", angelegt: jetzt };
      raum.loeschenAm = loeschdatum(jetzt);
      return { raum, ergebnis: null };
    });
    await melde(projekt, "video", `Neues Raumvideo für ${projekt} (${Math.round(ein.bytes / 1048576)} MB). Job starten: node tools/raumzwilling/run.mjs ${projekt}`);
    return json({ ok: true, status: "in-arbeit" });
  }

  return json({ error: "Unbekannter Schritt" }, 400);
}

export async function PUT(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "video");
  if (e.antwort) return e.antwort;
  const url = new URL(request.url);
  const ein = await leseEingang(projekt);
  if (!ein || ein.uploadId !== url.searchParams.get("upload")) return json({ error: "Upload nicht gefunden" }, 404);
  const offset = Number(url.searchParams.get("offset"));
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > V.chunkBytes) return json({ error: "Stück zu groß" }, 413);
  const daten = Buffer.from(await request.arrayBuffer());
  if (!daten.length || daten.length > V.chunkBytes) return json({ error: "Stück zu groß oder leer" }, 413);
  const groesse = (await stat(teil(projekt)).catch(() => null))?.size ?? 0;
  // Nur lückenlos: neues Stück genau am Ende, oder Wiederholung eines Stücks.
  if (!Number.isInteger(offset) || offset < 0 || offset > groesse || offset + daten.length > ein.bytes) {
    return json({ error: "Falscher Versatz", empfangen: groesse }, 409);
  }
  const fh = await open(teil(projekt), "r+");
  try {
    await fh.write(daten, 0, daten.length, offset);
  } finally {
    await fh.close();
  }
  const neu = Math.max(groesse, offset + daten.length);
  ein.empfangen = neu;
  const tmp = `${meta(projekt)}.tmp`;
  await writeFile(tmp, JSON.stringify(ein));
  await rename(tmp, meta(projekt)).catch(async () => writeFile(meta(projekt), JSON.stringify(ein)));
  return json({ empfangen: neu });
}
