// /de/3d-ansicht/uebergabe — Live-Status der QR-Übergabe (QA R2 P2-6.3, Labs).
//   POST { aktion: "neu" }                 → { t }            Desktop öffnet den QR-Dialog
//   POST { aktion: "geoeffnet", t }        → { ok }           Handy hat den Link geöffnet
//   GET  ?t=…                              → { geoeffnet }    Desktop fragt nach (alle 2,5 s)
// Es wird nur ein zufälliges Token gespeichert (kein Produkt, keine IP, keine Geräte-
// daten), im Prozessspeicher, 15 min gültig, höchstens 2 000 gleichzeitig. Mehrere
// Instanzen teilen den Speicher nicht – dann fehlt nur der Haken, der QR funktioniert.
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { clientKey, planerLimiter } from "@/components/Labs/Kuechenplaner/server/rateLimit";

const TTL_MS = 15 * 60 * 1000;
const MAX = 2000;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,32}$/;
const NO_STORE = { "cache-control": "no-store", "x-robots-tag": "noindex" };
const limiter = planerLimiter("arviewer-uebergabe", { max: 40, windowMs: 10 * 60 * 1000 });

const store = (globalThis.__arvUebergabe ||= new Map()); // token → { erstellt, geoeffnet }

function sweep(now = Date.now()) {
  for (const [k, v] of store) if (now - v.erstellt > TTL_MS) store.delete(k);
  while (store.size > MAX) store.delete(store.keys().next().value);
}

const json = (body, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

export async function POST(request, { params }) {
  const { locale } = await params;
  if (locale !== "de") return json({ error: "not found" }, 404);
  const text = await request.text();
  if (text.length > 256) return json({ error: "zu groß" }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "ungültig" }, 400);
  }
  sweep();
  if (body?.aktion === "neu") {
    if (await limiter.limited(clientKey(request.headers))) return json({ error: "zu viele" }, 429);
    const t = randomBytes(16).toString("base64url"); // 22 Zeichen
    store.set(t, { erstellt: Date.now(), geoeffnet: false });
    return json({ t });
  }
  if (body?.aktion === "geoeffnet" && TOKEN_RE.test(String(body.t || ""))) {
    const e = store.get(body.t);
    if (e) e.geoeffnet = true;
    return json({ ok: true }); // immer ok: verrät nicht, ob ein Token existiert
  }
  return json({ error: "ungültig" }, 400);
}

export async function GET(request, { params }) {
  const { locale } = await params;
  if (locale !== "de") return json({ error: "not found" }, 404);
  const t = request.nextUrl.searchParams.get("t") || "";
  if (!TOKEN_RE.test(t)) return json({ error: "ungültig" }, 400);
  sweep();
  return json({ geoeffnet: Boolean(store.get(t)?.geoeffnet) });
}
