// src/lib/stilfinder/materials.js
// Materialfotos für die Materialwelt und das Moodboard (QA Runde 1, P1.3).
// Quelle (Reihenfolge laut QA): (a) Hersteller-Muster aus dem Katalog gibt es
// im Backoffice nicht als eigene Bilder, (b) Showroom-Fotos fehlen noch, also
// (c) frei lizenzierte Texturen: ambientCG (https://ambientcg.com), Lizenz
// CC0 1.0 Universal. Die Bilder liegen fertig unter ./materials/*.jpg
// (erzeugt mit materials/make-materials.mjs, 4:5, 720 × 900 px).
// Sobald Showroom-Fotos echter Muster vorliegen, hier nur `file` tauschen.
// No "@/..." imports: node --test loads it directly.
import fs from "node:fs/promises";
import path from "node:path";

export const MATERIAL_SOURCE = "Materialfotos: ambientCG.com, CC0 1.0 (frei lizenziert), für das Moodboard zugeschnitten, belichtet und teils eingefärbt.";
export const MATERIAL_SOURCE_SHORT = "Materialfotos: ambientCG.com (CC0).";

// key → ambientCG-Asset und Bearbeitung (siehe make-materials.mjs).
export const MATERIAL_TEXTURES = {
  "eiche-geraeuchert": { asset: "Wood049", label: "Eiche geräuchert" },
  "eiche-hell": {
    asset: "Wood095",
    label: "Eiche hell furniert",
    saturation: 0.55,
  },
  nussbaum: { asset: "Wood026", label: "Nussbaum geölt" },
  "nussbaum-dunkel": { asset: "Wood027", label: "Nussbaum poliert" },
  teak: { asset: "Wood094", label: "Teak", saturation: 0.75 },
  travertin: { asset: "Travertine009", label: "Travertin" },
  terrazzo: { asset: "Terrazzo004", label: "Terrazzo" },
  quarzit: { asset: "Marble012", label: "Quarzit" },
  calacatta: { asset: "Marble014", label: "Marmor mit Zeichnung" },
  beton: { asset: "Concrete034", label: "Beton" },
  boucle: { asset: "Carpet014", label: "Bouclé" },
  leinen: { asset: "Fabric036", label: "Leinen" },
  "leinen-oliv": { asset: "Fabric066", label: "Leinen in Oliv" },
  geflecht: { asset: "Wicker010A", label: "Geflecht" },
  // Abnahme Runde 3, P3.3: Faltenwurf mit Glanz auf den Graten (sonst eine Farbfläche ohne Flor)
  samt: {
    asset: "Fabric082A",
    label: "Samt Bordeaux",
    tint: "#6b2f35",
    levels: [0.32, 4],
    folds: {
      seed: 21,
      freq: [0.007, 0.0018],
      scale: 20,
      spec: 0.8,
      brightness: 0.9,
      saturation: 0.95,
      contrast: [1.7, -80],
    },
  },
  filz: { asset: "Fabric034", label: "Wollfilz" },
  bronze: { asset: "Metal015", label: "Bronze matt", light: 0.3 },
  "messing-gebuerstet": {
    asset: "Metal009",
    label: "Messing gebürstet",
    tint: "#b8923f",
    levels: [0.7, 40],
    light: 0.3,
    sheen: true,
  },
  // QA Runde 2, P3.1: the texture is brushed, the label says so
  "messing-poliert": {
    asset: "Metal009",
    label: "Messing, fein geschliffen",
    tint: "#c9a052",
    levels: [0.55, 80],
    light: 0.4,
    sheen: true,
  },
  aluminium: {
    asset: "Metal009",
    label: "Aluminium gebürstet",
    light: 0.3,
    sheen: true,
  },
  "stahl-schwarz": {
    asset: "Metal038",
    label: "Stahl schwarz",
    light: 0.3,
    sheen: true,
  },
};

// Profil → je Materialgruppe ein Bild (Reihenfolge wie im PDF: Holz, Stein, Textil, Metall).
export const PROFILE_MATERIALS = {
  ruhe: {
    holz: "eiche-geraeuchert",
    stein: "travertin",
    textil: "boucle",
    metall: "bronze",
  },
  // QA Runde 2, P2.4 d: warm travertine instead of the grey-blue terrazzo
  warm: {
    holz: "nussbaum",
    stein: "travertin",
    textil: "leinen-oliv",
    metall: "messing-gebuerstet",
  },
  see: {
    holz: "teak",
    stein: "quarzit",
    textil: "geflecht",
    metall: "aluminium",
  },
  salon: {
    holz: "nussbaum-dunkel",
    stein: "calacatta",
    textil: "samt",
    metall: "messing-poliert",
  },
  klar: {
    holz: "eiche-hell",
    stein: "beton",
    textil: "filz",
    metall: "stahl-schwarz",
  },
};

export const MATERIAL_DIR = path.join(process.cwd(), "src", "lib", "stilfinder", "materials");

const cache = new Map();

/** { data, width, height, label, key } or null. The files are ready-made JPEGs. */
export async function loadMaterialImage(key, dir = MATERIAL_DIR) {
  if (!MATERIAL_TEXTURES[key]) return null;
  if (cache.has(key)) return cache.get(key);
  try {
    const data = await fs.readFile(path.join(dir, `${key}.jpg`));
    const img = {
      data,
      width: 720,
      height: 900,
      label: MATERIAL_TEXTURES[key].label,
      key,
      material: true,
    };
    cache.set(key, img);
    return img;
  } catch {
    return null;
  }
}

/** All four material images of a profile: { holz, stein, textil, metall }. */
export async function loadProfileMaterials(profileKey, dir) {
  const map = PROFILE_MATERIALS[profileKey] || {};
  const entries = await Promise.all(Object.entries(map).map(async ([k, key]) => [k, await loadMaterialImage(key, dir)]));
  return Object.fromEntries(entries);
}
