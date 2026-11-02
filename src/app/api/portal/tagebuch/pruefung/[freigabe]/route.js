import { herkunftFalsch, json, leseJson, zod400 } from "@/lib/raumzwilling/api";
import { FREIGABE_ID, pruefungSchema } from "@/lib/portal/tagebuch/schemas";
import { teamAusAnfrage } from "@/lib/portal/tagebuch/zugriff";
import { darf } from "@/lib/portal/tagebuch/konten";
import { pruefen } from "@/lib/portal/tagebuch/service";

// POST /api/portal/tagebuch/pruefung/<fg-…>   nur persönliches Team-Konto mit Rolle "studio"
//   (Recht referenz_pruefen, src/lib/portal/tagebuch/konten.js); "mitarbeit" → 403.
//   { aktion: "veroeffentlichen", slug, titel, typologie, leistungen, zeitraumVon, zeitraumBis, ausgangslage, loesung, alt }
//   { aktion: "ablehnen" | "zurueckziehen", notiz? }
// Veröffentlicht wird nur, wenn der abgeleitete Eintrag projektSchema
// (src/lib/content/projekte.js) besteht. Danach zeigt /de/projekte ihn automatisch.

export async function POST(request, { params }) {
  const { freigabe } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const team = await teamAusAnfrage(request);
  if (!team) return json({ error: "Nur für das Studio-Team" }, 401);
  if (!darf(team, "referenz_pruefen")) return json({ error: "Referenzen prüft nur ein Konto mit der Rolle Studio." }, 403);
  if (!FREIGABE_ID.test(String(freigabe))) return json({ error: "Freigabe nicht gefunden" }, 404);
  const { daten, fehler } = await leseJson(request, 64 * 1024);
  if (fehler) return fehler;
  const p = pruefungSchema.safeParse(daten);
  if (!p.success) return zod400(p.error);
  try {
    const r = await pruefen(freigabe, team, p.data);
    if (r.status !== 200) return json({ error: r.status === 404 ? "Freigabe nicht gefunden" : "Bitte Angaben prüfen.", details: r.fehler || [] }, r.status);
    return json({ ok: true, status: r.freigabe.status, slug: r.freigabe.pruefung?.slug || null });
  } catch (err) {
    console.error("[tagebuch] pruefung", err);
    return json({ error: "Das hat nicht geklappt." }, 500);
  }
}
