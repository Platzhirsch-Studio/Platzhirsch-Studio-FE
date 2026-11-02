// Sofaplaner – NEUTRAL material families for the drawing and the 3D preview.
// These are generic look-alikes (no Minotti colour names, codes or images).
// Which families a model offers follows the cover categories in the research
// file ("Stoff", "Leder", "Outdoor-Stoff" …). Real swatches: in the showroom.

export const MATERIALS = {
  stoff: {
    label: "Stoff, glatt",
    hint: "Fein gewebter Möbelstoff. Große Farbauswahl, angenehm warm.",
    rough: 0.92,
    sheen: 0.25,
    tones: [
      ["kreide", "Kreide", "#e6e1d6"],
      ["sand", "Sand", "#cbb89a"],
      ["kiesel", "Kiesel", "#9b968c"],
      ["salbei", "Salbei", "#8d9a80"],
      ["see", "Seeblau", "#5b7480"],
      ["grafit", "Grafit", "#45474a"],
    ],
  },
  struktur: {
    label: "Stoff, strukturiert",
    hint: "Bouclé, Wolle oder Leinen-Optik mit fühlbarer Oberfläche.",
    rough: 0.98,
    sheen: 0.1,
    tones: [
      ["schnee", "Schnee", "#ece7dd"],
      ["hafer", "Hafer", "#d8ccb6"],
      ["taupe", "Taupe", "#a79a8a"],
      ["moos", "Moos", "#6f735a"],
      ["torf", "Torf", "#5b4a3d"],
    ],
  },
  samt: {
    label: "Samt",
    hint: "Weicher Flor mit Glanz je nach Lichteinfall.",
    rough: 0.75,
    sheen: 0.8,
    tones: [
      ["perle", "Perle", "#d9d2c6"],
      ["rost", "Rost", "#8c4f2e"],
      ["tanne", "Tanne", "#2f4a3f"],
      ["nacht", "Nacht", "#2f3a4f"],
    ],
  },
  leder: {
    label: "Leder",
    hint: "Langlebig, entwickelt Patina. Direkte Sonne am Fenster vermeiden.",
    rough: 0.5,
    sheen: 0,
    tones: [
      ["creme", "Creme", "#e2d6c2"],
      ["cognac", "Cognac", "#8a5532"],
      ["tabak", "Tabak", "#5c4030"],
      ["mokka", "Mokka", "#4a3a31"],
      ["schwarz", "Schwarz", "#2b2b2c"],
    ],
  },
  nubuk: {
    label: "Nubuk / Velours",
    hint: "Samtig angeschliffene Oberfläche, matt.",
    rough: 0.85,
    sheen: 0.2,
    tones: [
      ["stein", "Stein", "#b7ad9f"],
      ["kastanie", "Kastanie", "#6d4a35"],
      ["schiefer", "Schiefer", "#55595c"],
    ],
  },
  outdoor: {
    label: "Outdoor-Stoff",
    hint: "Lichtecht und schnell trocknend für Terrasse und Wintergarten.",
    rough: 0.9,
    sheen: 0.1,
    tones: [
      ["kreide", "Kreide", "#e6e2d8"],
      ["sand", "Sand", "#c9b99c"],
      ["oliv", "Oliv", "#6e7158"],
      ["schiefer", "Schiefer", "#5d6266"],
    ],
  },
};

/** Material families a model offers, from its cover categories (fallback: Stoff + Leder). */
export function materialsFor(family) {
  const cats = (family?.options?.cover?.categories || []).join(" ").toLowerCase();
  if (family?.outdoor || /outdoor/.test(cats)) return ["outdoor"];
  const out = [];
  if (/stoff|textil|fabric|bouclé|boucle/.test(cats) || !cats) out.push("stoff", "struktur");
  if (/samt|velvet/.test(cats)) out.push("samt");
  if (/leder|leather|cuoio|saddle|hide/.test(cats) || !cats) out.push("leder");
  if (/nubuk|alcantara/.test(cats)) out.push("nubuk");
  return out.length ? out : ["stoff", "leder"];
}

export function tone(material, key) {
  const m = MATERIALS[material] || MATERIALS.stoff;
  const t = m.tones.find(([k]) => k === key) || m.tones[0];
  return { key: t[0], label: t[1], hex: t[2], material: m };
}

/** Neutral finish for base/feet in 3D, guessed from the chosen option text. */
export function baseColor(text) {
  const t = String(text || "").toLowerCase();
  if (/eiche|esche|nuss|walnut|holz|teak|iroko|wood|rovere|frassino/.test(t)) return "#8b6a4c";
  if (/alumin|silber|nickel|chrom|edelstahl|stahl satin|champagne/.test(t)) return "#b3b0a8";
  if (/schwarz|black|nero|bronze|brandy|tabak|peltro|grafit|graphite|dunkel|dark|pewter|moka/.test(t)) return "#38332e";
  return "#4a423a";
}
