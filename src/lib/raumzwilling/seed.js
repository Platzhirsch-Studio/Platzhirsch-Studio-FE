// src/lib/raumzwilling/seed.js — Demo-Räume für das Mock-Portal (nur Entwicklung).
// PRJ-2026-014 „Wohnzimmer am See“: synthetischer Testraum (Rechenmodell,
//   keine Aufnahme, keine KI) mit Maßstab, zwei Volumen aus geprüften
//   ClassiCon-Herstellermaßen (src/lib/arviewer/dims.json) und einem
//   Beispiel-Kommentar des Teams. Keine Skizze: Es gibt noch keine echte
//   Handzeichnung zu diesem Raum, also zeigt die Ebene „Skizze“ nichts Erfundenes.
// PRJ-2026-021: wartet auf das Raumvideo (Aufnahmehilfe + Upload).
// In Produktion oder mit dem Frappe-Adapter passiert hier nichts.
import "server-only";
import path from "node:path";
import { adapterName, IS_PRODUCTION } from "@/lib/portal/config";
import { entpackeSog } from "./sog.js";
import { erzeugeTestraum } from "./testraum.js";
import { grundrissAusPunkten } from "./platzierung.js";
import { zentriere } from "./massstab.js";
import { neuerRaum } from "./modell.js";
import { aendereRaum, leseRaum, projektDir } from "./store.js";
import { berechneDemoLage, schreibeSogBuendel, schreibeStandbilder, standpunkteFuer, weltSplats } from "./assets.js";
import { packeSog } from "./sog.js";
import DIMS from "@/lib/arviewer/dims.json";

export const DEMO_RAEUME = Object.freeze({ "PRJ-2026-014": "testraum", "PRJ-2026-021": "offen" });
export const TESTRAUM_KENNZEICHNUNG =
  "Synthetischer Testraum: aus einem Rechenmodell mit bekannten Maßen erzeugt, keine Aufnahme, keine KI, keine Kundendaten. So erscheint Ihr eigener Raum, sobald Ihr Video verarbeitet ist.";

const laufend = globalThis.__phRaumSeed || (globalThis.__phRaumSeed = new Map());

export const demoAktiv = () => !IS_PRODUCTION && adapterName() === "mock";

function volumenAus(pfad, id, marke, name, lage) {
  const d = DIMS.produkte[pfad];
  return {
    id,
    produktId: pfad,
    name,
    marke,
    w: d.w,
    d: d.d,
    h: d.h,
    quelle: { art: "hersteller", text: d.modell ? `Herstellerangabe: ${d.modell}` : "Herstellerangabe", url: d.quelle || null },
    y: 0,
    notiz: null,
    ...lage,
  };
}

async function baueTestraum(projektId, customerId, projekt) {
  const dir = projektDir(projektId);
  const splats = erzeugeTestraum();
  const splat = await schreibeSogBuendel(path.join(/*turbopackIgnore: true*/ dir, "splat"), splats);
  const { meta, bilder } = packeSog(splats);
  const entpackt = entpackeSog(meta, (n) => bilder[n].rgba);
  const lage = berechneDemoLage();
  const roh = weltSplats(entpackt, lage.transform);
  const punkte = [];
  for (let i = 0; i < roh.anzahl; i += 7) punkte.push([roh.positionen[i * 3], roh.positionen[i * 3 + 1], roh.positionen[i * 3 + 2]]);
  const z = zentriere(lage.transform, { ...grundrissAusPunkten(punkte), waende: { hinten: "Fensterwand", links: "Türwand" } });
  const { transform, grundriss } = z;
  const massstab = lage.massstab;
  const welt = weltSplats(entpackt, transform);
  const standpunkte = standpunkteFuer(grundriss);
  const standbilder = await schreibeStandbilder(path.join(/*turbopackIgnore: true*/ dir, "standbild"), welt, standpunkte);
  const jetzt = new Date().toISOString();
  const raum = neuerRaum({ projektId, customerId, titel: projekt.room || projekt.title, jetzt });
  return {
    ...raum,
    status: "bereit",
    quelle: "testraum",
    kennzeichnung: TESTRAUM_KENNZEICHNUNG,
    einwilligung: { version: "demo", am: jetzt },
    splat,
    transform,
    massstab: { ...massstab, gesetztAm: jetzt, gesetztVon: "Demo" },
    grundriss,
    standpunkte,
    standbilder,
    platzierung: {
      version: 1,
      volumen: [
        volumenAus("sofas-couches-lota-sofa", "v-demolota01", "ClassiCon", "Lota Sofa", { x: 0.1, z: 0.55, rotY: 180 }),
        volumenAus("armchairs-stools-bibendum-armchair", "v-demobibe01", "ClassiCon", "Bibendum Armchair", { x: -1.3, z: -0.55, rotY: 140 }),
      ],
      aktualisiert: jetzt,
      von: "Demo",
    },
    kommentare: [
      {
        id: "k-demoteam0001",
        punkt: [0.2, 1.2, grundriss.z0 + 0.02],
        bezug: { art: "punkt" },
        text: "Beispieltext: Am Fenster prüfen wir beim Termin vor Ort, wie das Abendlicht auf das Sofa fällt.",
        audio: null,
        autor: "Ihr Platzhirsch-Beratungsteam",
        rolle: "team",
        erstellt: jetzt,
      },
    ],
  };
}

/** Legt beim ersten Aufruf die Demo-Räume an (idempotent, nur Mock + Entwicklung). */
export async function stelleDemoBereit(customerId, projektId, projekt) {
  if (!demoAktiv() || !DEMO_RAEUME[projektId]) return;
  if (await leseRaum(projektId)) return;
  if (!laufend.has(projektId)) {
    laufend.set(
      projektId,
      aendereRaum(projektId, async (vorhanden) => {
        if (vorhanden) return { raum: null, ergebnis: null };
        const raum =
          DEMO_RAEUME[projektId] === "testraum"
            ? await baueTestraum(projektId, customerId, projekt)
            : neuerRaum({ projektId, customerId, titel: projekt.room || projekt.title });
        return { raum, ergebnis: null };
      }).finally(() => laufend.delete(projektId))
    );
  }
  await laufend.get(projektId);
}
