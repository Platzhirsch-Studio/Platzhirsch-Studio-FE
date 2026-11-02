import { raumApi } from "@/lib/raumzwilling/access";
import { herkunftFalsch, json, leseJson, zod400 } from "@/lib/raumzwilling/api";
import { platzierungSchema, pruefePlatzierung } from "@/lib/raumzwilling/platzierung";
import { aendereRaum } from "@/lib/raumzwilling/store";

// PUT /api/portal/raum/<projekt>/platzierung  (nur Team)
// Body: { version: 1, volumen: [...] } – weiche Volumen aus Katalogmaßen.
// Antwort: gespeicherte Platzierung + Hinweise (Überschneidung, außerhalb, zu hoch).

export async function PUT(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "bearbeiten");
  if (e.antwort) return e.antwort;
  if (!e.raum) return json({ error: "Raum nicht gefunden" }, 404);
  const { daten, fehler } = await leseJson(request);
  if (fehler) return fehler;
  const p = platzierungSchema.safeParse(daten);
  if (!p.success) return zod400(p.error);
  const platzierung = { ...p.data, aktualisiert: new Date().toISOString(), von: e.team?.name || "Team" };
  await aendereRaum(projekt, async (raum) => {
    if (!raum) throw new Error("Raum fehlt");
    raum.platzierung = platzierung;
    return { raum, ergebnis: null };
  });
  return json({ ok: true, platzierung, hinweise: pruefePlatzierung(platzierung, e.raum.grundriss) });
}
