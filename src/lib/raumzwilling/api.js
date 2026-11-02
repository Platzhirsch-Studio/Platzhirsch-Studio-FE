// src/lib/raumzwilling/api.js — kleine Helfer für die Raum-Route-Handler (server-only).
import "server-only";
import { NextResponse } from "next/server";
import { isSameOrigin, noStore } from "@/lib/portal/http";

export const json = (body, status = 200, extra = {}) => NextResponse.json(body, { status, headers: { ...noStore, ...extra } });

/** CSRF-Schutz für alles, was schreibt. */
export function herkunftFalsch(request) {
  return isSameOrigin(request) ? null : json({ error: "Ungültige Herkunft" }, 403);
}

export async function leseJson(request, maxBytes = 256 * 1024) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > maxBytes) return { fehler: json({ error: "Anfrage zu groß" }, 413) };
  try {
    const text = await request.text();
    if (text.length > maxBytes) return { fehler: json({ error: "Anfrage zu groß" }, 413) };
    return { daten: JSON.parse(text || "{}") };
  } catch {
    return { fehler: json({ error: "Ungültige Anfrage" }, 400) };
  }
}

export const zod400 = (err) => json({ error: "Bitte Eingaben prüfen.", details: err.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) }, 400);

export function autorVon(e) {
  if (e.zugriff.rolle === "team") return e.team?.name ? `${e.team.name} (Platzhirsch)` : "Ihr Platzhirsch-Beratungsteam";
  if (e.zugriff.rolle === "kunde") {
    const c = e.kunde;
    return [c.firstName, c.lastName].filter(Boolean).join(" ") || c.displayName || "Kunde";
  }
  return "Gast (Raum-Link)";
}
