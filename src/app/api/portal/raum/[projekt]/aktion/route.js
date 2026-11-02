import { rm } from "node:fs/promises";
import { raumApi } from "@/lib/raumzwilling/access";
import { herkunftFalsch, json, leseJson, zod400 } from "@/lib/raumzwilling/api";
import { aktionSchema } from "@/lib/raumzwilling/schemas";
import { aendereRaum, projektDir } from "@/lib/raumzwilling/store";
import { erzeugeRaumLink } from "@/lib/raumzwilling/teilen";
import { DEMO_RAEUME, demoAktiv } from "@/lib/raumzwilling/seed";
import { melde } from "@/lib/raumzwilling/notify";
import { publicOrigin } from "@/lib/portal/config";

// POST /api/portal/raum/<projekt>/aktion  (nur Team)
//   { aktion:"status", status, grund? }   z. B. „nur-fotos“ (Splat unbrauchbar) oder
//                                          „bitte-wiederholen“ mit Grund
//   { aktion:"link" }                      einmaliger Raum-Link (Fallback 3), Team schickt ihn selbst
//   { aktion:"waende", waende:{…} }        Wandnamen für „Position in Worten“
//   { aktion:"demo-zuruecksetzen" }        nur Entwicklung + Mock: Demo-Raum neu anlegen

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "bearbeiten");
  if (e.antwort) return e.antwort;
  const { daten, fehler } = await leseJson(request, 16 * 1024);
  if (fehler) return fehler;
  const p = aktionSchema.safeParse(daten);
  if (!p.success) return zod400(p.error);
  const a = p.data;

  if (a.aktion === "demo-zuruecksetzen") {
    if (!demoAktiv() || !DEMO_RAEUME[projekt]) return json({ error: "Nur für Demo-Räume in der Entwicklung." }, 404);
    await aendereRaum(projekt, async () => {
      await rm(projektDir(projekt), { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      return { raum: null, ergebnis: null };
    });
    return json({ ok: true });
  }
  if (!e.raum) return json({ error: "Raum nicht gefunden" }, 404);

  if (a.aktion === "link") {
    const link = await erzeugeRaumLink(projekt, publicOrigin(request), e.team?.name);
    await melde(projekt, "link", `Raum-Link für ${projekt} erzeugt (gültig ${link.gueltigTage} Tage, einmal einlösbar). Nicht automatisch versendet.`);
    return json({ ok: true, ...link });
  }
  if (a.aktion === "waende") {
    await aendereRaum(projekt, async (raum) => {
      if (raum.grundriss) raum.grundriss.waende = { ...(raum.grundriss.waende || {}), ...Object.fromEntries(Object.entries(a.waende).filter(([, v]) => v)) };
      return { raum, ergebnis: null };
    });
    return json({ ok: true });
  }
  // status
  await aendereRaum(projekt, async (raum) => {
    raum.status = a.status;
    if (a.status === "bitte-wiederholen") {
      raum.qualitaet = { ok: false, gruende: [{ code: "team", text: a.grund || "Bitte nehmen Sie den Raum noch einmal auf." }], vonTeam: true };
    }
    return { raum, ergebnis: null };
  });
  return json({ ok: true, status: a.status });
}
