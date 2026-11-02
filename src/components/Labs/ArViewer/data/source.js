// Adapter-Schicht für 3D-Modelldaten (nur auf dem Server verwenden: nutzt fs).
//
// Reihenfolge der Quellen:
//   1. Frappe/ERPNext (backoffice.platzhirsch.studio) – NOCH NICHT ANGEBUNDEN,
//      siehe fetchFromFrappe() unten. Wir haben derzeit keinen Schreibzugang und
//      kein 3D-Feld im Backoffice.
//   2. Lokaler Entwicklungs-Speicher .data/ar-viewer/models.json (gitignored):
//      Einträge mit gleicher `id` überschreiben den Beispielkatalog, neue `id`s
//      werden angehängt. So lassen sich Herstellermodelle lokal testen, ohne
//      Code oder Repo zu ändern. Nur außerhalb von production gelesen.
//   3. Beispielkatalog data/catalog.js (CC0-Platzhalter).
//
// Alle Datensätze laufen durch dasselbe zod-Schema – egal aus welcher Quelle.
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { AR_MODELS } from "./catalog";

const DEV_STORE = path.join(process.cwd(), ".data", "ar-viewer", "models.json");

// Modelle dürfen nur von uns selbst oder aus dem Backoffice kommen.
const assetUrl = z
  .string()
  .max(500)
  .refine(
    (u) => (/^\/labs\/ar-viewer\/[\w\-./]+$/.test(u) && !u.includes("..")) ||
      /^https:\/\/backoffice\.platzhirsch\.studio\/files\/[\w\-./%]+$/.test(u) ||
      /^\/cmx\/[\w\-./%]+$/.test(u),
    "Nur eigene Pfade (/labs/ar-viewer/…, /cmx/…) oder backoffice.platzhirsch.studio/files erlaubt"
  );

const vec3 = z.string().regex(/^-?\d+(\.\d+)? -?\d+(\.\d+)? -?\d+(\.\d+)?$/, "Format: \"x y z\" in Metern");

export const ArModelSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{2,64}$/),
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(40),
  src: assetUrl.refine((u) => /\.(glb|gltf)$/i.test(u), "src muss .glb/.gltf sein"),
  iosSrc: assetUrl.refine((u) => /\.usdz$/i.test(u), "iosSrc muss .usdz sein").nullable().default(null),
  poster: assetUrl,
  posterAlt: z.string().min(1).max(200),
  dimensionsCm: z.object({ w: z.number().positive(), d: z.number().positive(), h: z.number().positive() }),
  arPlacement: z.enum(["floor", "wall"]).default("floor"),
  cameraOrbit: z.string().max(60).default("0deg 75deg auto"),
  credit: z.object({ author: z.string().max(120), url: z.url() }).nullable().default(null),
  // 0 für hängende Objekte (Leuchten), sonst wirkt das Modell wie am Boden stehend.
  shadowIntensity: z.number().min(0).max(2).default(1),
  // Sichtbarer Hinweis direkt am AR-Button (z. B. Einschränkungen der Platzierung).
  arNote: z.string().max(240).nullable().default(null),
  variants: z
    .array(
      z.object({
        variant: z.string().min(1).max(60),
        label: z.string().min(1).max(40),
        swatch: z.string().regex(/^#[0-9a-f]{6}$/i),
        note: z.string().max(160).default(""),
      })
    )
    .max(24)
    .default([]),
  hotspots: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9_-]{1,40}$/),
        title: z.string().min(1).max(60),
        text: z.string().max(400),
        position: vec3,
        normal: vec3,
      })
    )
    .max(8)
    .default([]),
  // true = Beispielmodell, wird in der UI immer als solches gekennzeichnet.
  sample: z.boolean().default(true),
});

/**
 * Später: 3D-Daten aus dem Backoffice. Vorgesehene Anbindung (nur lesen):
 *   GET /api/method/get_produkt_by_path_field_api?path_field=<slug>
 *     → Felder `pdf_produkte` (Anhänge) um Einträge mit Typ "3d" erweitern
 *       (GLB/USDZ als File-Doctype-Anhang am Produkt), oder
 *   GET /api/resource/Produkt 3D Modell?filters=[["produkt","=",<name>]]
 *     → eigener Child-/Doctype „Produkt 3D Modell“ mit: glb (Attach), usdz (Attach),
 *       poster (Attach Image), ar_placement (Select floor/wall), freigabe_hersteller
 *       (Check + Datum, Pflicht!), varianten (Table: variant, label, swatch, note),
 *       hotspots (Table: title, text, position, normal).
 * Dateien laufen dann über den bestehenden /cmx-Proxy (Endungen .glb/.usdz
 * müssen dort freigeschaltet werden) oder ein CDN.
 * @returns {Promise<null>} solange nicht angebunden
 */
async function fetchFromFrappe() {
  return null;
}

async function readDevStore() {
  if (process.env.NODE_ENV === "production") return [];
  let raw;
  try {
    raw = await fs.readFile(DEV_STORE, "utf8");
  } catch {
    // Datei optional. Beim ersten Lauf leere Seed-Datei anlegen, damit klar ist,
    // wo lokale Testmodelle hingehören (Format: JSON-Array im ArModelSchema).
    try {
      await fs.mkdir(path.dirname(DEV_STORE), { recursive: true });
      await fs.writeFile(DEV_STORE, "[]\n", { flag: "wx" });
    } catch {
      /* schreibgeschützt oder schon vorhanden – egal */
    }
    return [];
  }
  try {
    const parsed = z.array(z.unknown()).parse(JSON.parse(raw));
    const ok = [];
    for (const entry of parsed) {
      const r = ArModelSchema.safeParse(entry);
      if (r.success) ok.push(r.data);
      else console.warn(`[ar-viewer] Eintrag in ${DEV_STORE} ignoriert:`, z.prettifyError(r.error));
    }
    return ok;
  } catch (err) {
    console.warn(`[ar-viewer] ${DEV_STORE} ist kein gültiges JSON-Array:`, err.message);
    return [];
  }
}

/** Alle Modelle für die Galerie (validiert). */
export async function getArModels() {
  const fromFrappe = await fetchFromFrappe();
  if (fromFrappe) return fromFrappe;

  const base = AR_MODELS.map((m) => ArModelSchema.parse(m));
  const local = await readDevStore();
  const byId = new Map(base.map((m) => [m.id, m]));
  for (const m of local) byId.set(m.id, m);
  return [...byId.values()];
}
