import { raumApi } from "@/lib/raumzwilling/access";
import { herkunftFalsch, json } from "@/lib/raumzwilling/api";
import { oeffentlicheSicht } from "@/lib/raumzwilling/zugriff";
import { aendereRaum, projektDir } from "@/lib/raumzwilling/store";
import { geleerterRaum } from "@/lib/raumzwilling/modell";
import { melde } from "@/lib/raumzwilling/notify";
import { redirectTo } from "@/lib/portal/http";
import { rm } from "node:fs/promises";

// GET    /api/portal/raum/<projekt>  → Raum-Datensatz für Portal/Werkzeug (Session nötig)
// DELETE /api/portal/raum/<projekt>  → Löschknopf: Video, Splat, Standbilder, Skizzen,
//                                      Kommentare und Sprachnachrichten werden gelöscht.
// POST   (Formular ohne JavaScript, Feld bestaetigung=LOESCHEN) → wie DELETE, dann 303.

export async function GET(request, { params }) {
  const { projekt } = await params;
  const e = await raumApi(request, projekt, "ansehen");
  if (e.antwort) return e.antwort;
  if (!e.raum) return json({ error: "Für dieses Projekt gibt es noch keinen Raum." }, 404);
  return json({ rolle: e.zugriff.rolle, raum: oeffentlicheSicht(e.raum, e.zugriff.rolle) });
}

async function loesche(projekt, e) {
  // Dateien weg, Datensatz auf den leeren Rahmen zurück (Projekt bleibt zugeordnet).
  const dir = projektDir(projekt);
  await aendereRaum(projekt, async (raum) => {
    if (!raum) return { raum: null, ergebnis: null };
    for (const sub of ["splat", "standbild", "skizze", "audio", "video"]) {
      await rm(`${dir}/${sub}`, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
    return { raum: geleerterRaum(raum), ergebnis: null };
  });
  await melde(projekt, "geloescht", `Raum ${projekt} wurde von ${e.zugriff.rolle === "team" ? "dem Team" : "der Kundin / dem Kunden"} gelöscht.`);
}

export async function DELETE(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "loeschen");
  if (e.antwort) return e.antwort;
  if (!e.raum) return json({ ok: true });
  await loesche(projekt, e);
  return json({ ok: true });
}

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "loeschen");
  if (e.antwort) return e.antwort;
  const form = await request.formData().catch(() => null);
  if (String(form?.get("bestaetigung") || "").trim().toUpperCase() !== "LOESCHEN") {
    return redirectTo(request, `/de/portal/raum/${projekt}?loeschen=bestaetigen#loeschen`);
  }
  if (e.raum) await loesche(projekt, e);
  return redirectTo(request, `/de/portal/raum?geloescht=${encodeURIComponent(projekt)}`);
}

