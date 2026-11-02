import path from "node:path";
import { raumApi } from "@/lib/raumzwilling/access";
import { herkunftFalsch, json, leseJson, zod400 } from "@/lib/raumzwilling/api";
import { massstabSchema } from "@/lib/raumzwilling/schemas";
import { IDENTITAET, a4Massstab, bodenAusDreiPunkten, mitFaktor, wandAlsHinten, zentriere, zweiPunktMassstab } from "@/lib/raumzwilling/massstab";
import { grundrissAusPunkten } from "@/lib/raumzwilling/platzierung";
import { aendereRaum, projektDir } from "@/lib/raumzwilling/store";
import { leseSogBuendel, standpunkteFuer, weltSplats } from "@/lib/raumzwilling/assets";

// POST /api/portal/raum/<projekt>/massstab  (nur Team)
//   { art:"zwei-punkt", a, b, meter, bezeichnung? }  Maßstab aus bekannter Strecke
//   { art:"a4", ecken:[4 Punkte] }                     Maßstab aus A4-Blatt
//   { art:"boden", punkte:[3 Punkte] }                 Boden auf y = 0
//   { art:"wand", a, b, name? }                        diese Wand nach hinten
//   { art:"zuruecksetzen" }
// Punkte in Modell-Koordinaten des Splats (wie im Werkzeug angeklickt).
// Danach werden Grundriss und Kamera-Standpunkte neu berechnet.

async function splatPunkte(projekt) {
  const s = await leseSogBuendel(path.join(projektDir(projekt), "splat"));
  return s;
}

function schwerpunkt(s) {
  const c = [0, 0, 0];
  const schritt = Math.max(1, Math.floor(s.anzahl / 20000));
  let n = 0;
  for (let i = 0; i < s.anzahl; i += schritt) {
    c[0] += s.positionen[i * 3];
    c[1] += s.positionen[i * 3 + 1];
    c[2] += s.positionen[i * 3 + 2];
    n++;
  }
  return c.map((v) => v / n);
}

export async function POST(request, { params }) {
  const { projekt } = await params;
  const bad = herkunftFalsch(request);
  if (bad) return bad;
  const e = await raumApi(request, projekt, "bearbeiten");
  if (e.antwort) return e.antwort;
  if (!e.raum?.splat) return json({ error: "Für diesen Raum gibt es noch keinen Splat." }, 409);
  const { daten, fehler } = await leseJson(request);
  if (fehler) return fehler;
  const p = massstabSchema.safeParse(daten);
  if (!p.success) return zod400(p.error);
  const a = p.data;

  let s;
  try {
    s = await splatPunkte(projekt);
  } catch {
    return json({ error: "Splat-Dateien nicht lesbar." }, 500);
  }

  let transform = e.raum.transform || { ...IDENTITAET };
  let massstab = e.raum.massstab;
  let waende = e.raum.grundriss?.waende || {};
  const jetzt = new Date().toISOString();
  const von = e.team?.name || "Team";
  try {
    if (a.art === "zwei-punkt") {
      const m = zweiPunktMassstab(a.a, a.b, a.meter);
      transform = mitFaktor(transform, m.faktor);
      massstab = { quelle: "zwei-punkt", meter: a.meter, punkte: [a.a, a.b], bezeichnung: a.bezeichnung || null, gesetztAm: jetzt, gesetztVon: von };
    } else if (a.art === "a4") {
      const m = a4Massstab(a.ecken);
      transform = mitFaktor(transform, m.faktor);
      massstab = { quelle: "a4", meter: 0.297, punkte: a.ecken, bezeichnung: "A4-Blatt", gesetztAm: jetzt, gesetztVon: von };
    } else if (a.art === "boden") {
      transform = bodenAusDreiPunkten(a.punkte[0], a.punkte[1], a.punkte[2], schwerpunkt(s), transform.faktor);
    } else if (a.art === "wand") {
      transform = wandAlsHinten(transform, a.a, a.b);
      if (a.name) waende = { ...waende, hinten: a.name };
    } else {
      transform = null;
      massstab = null;
    }
  } catch (err) {
    return json({ error: err.message || "Ungültige Punkte" }, 400);
  }

  let grundriss = null;
  let standpunkte = [];
  if (transform) {
    const welt = weltSplats(s, transform);
    const pts = [];
    const schritt = Math.max(1, Math.floor(welt.anzahl / 30000));
    for (let i = 0; i < welt.anzahl; i += schritt) pts.push([welt.positionen[i * 3], welt.positionen[i * 3 + 1], welt.positionen[i * 3 + 2]]);
    const z = zentriere(transform, { ...grundrissAusPunkten(pts), waende });
    transform = z.transform;
    grundriss = z.grundriss;
    standpunkte = standpunkteFuer(grundriss);
  }
  const raum = await aendereRaum(projekt, async (r) => {
    if (!r) throw new Error("Raum fehlt");
    Object.assign(r, { transform, massstab, grundriss, standpunkte });
    return { raum: r, ergebnis: r };
  });
  return json({ ok: true, transform: raum.transform, massstab: raum.massstab, grundriss: raum.grundriss, standpunkte: raum.standpunkte });
}
