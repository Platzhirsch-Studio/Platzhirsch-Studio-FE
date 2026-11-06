import cx from "./cx";

// Avatar und Avatar-Reihe (lounge.md §6): Initialen-Kreis im Materialverlauf (zwei Stufen desselben
// Materials, dunkle Initialen, AA) – nie Fotos echter Personen. Die Reihe überlappt 18 %, jeder
// Kreis trägt einen Ring in Kachelfarbe, Zähler „+n“ in Tinte. Server- und Client-tauglich.
// Material: ausdrücklich (`material`) oder stabil aus dem Namen abgeleitet (gleiche Person =
// gleiche Farbe auf jedem Bildschirm).

export const AVATAR_MATERIALIEN = ["cognac", "eiche", "salbei", "messing", "see", "nuss", "travertin"];

/** Initialen aus einem Namen oder einer E-Mail: „Lena Moosbrugger“ → „LM“, „sb@…“ → „SB“. */
export function initialen(text = "") {
  const roh = String(text).trim();
  if (!roh) return "?";
  const name = roh.includes("@") ? roh.split("@")[0].replace(/[._-]+/g, " ") : roh;
  const teile = name.split(/\s+/).filter((t) => /\p{L}/u.test(t) && !/^(dr|mag|ing|di|prof)\.?$/i.test(t));
  if (teile.length === 0) return name.slice(0, 2).toUpperCase();
  if (teile.length === 1) return teile[0].slice(0, 2).toUpperCase();
  return (teile[0][0] + teile[teile.length - 1][0]).toUpperCase();
}

/** Stabiles Material zu einem Schlüssel (Name/E-Mail): einfacher Hash über die Zeichen. */
export function materialFuer(schluessel = "") {
  let h = 0;
  for (const z of String(schluessel)) h = (h * 31 + z.codePointAt(0)) >>> 0;
  return AVATAR_MATERIALIEN[h % AVATAR_MATERIALIEN.length];
}

/**
 * @param {object} p
 * @param {string} [p.name]        voller Name (Tooltip + Screenreader); Initialen daraus
 * @param {string} [p.kuerzel]     Initialen ausdrücklich („LM“)
 * @param {string} [p.material]    cognac|eiche|salbei|messing|see|nuss|travertin
 * @param {number} [p.groesse]     Durchmesser in px (Standard 32; Reihe 28)
 * @param {boolean} [p.ring]       Ring in Kachelfarbe (Standard ja)
 * @param {boolean} [p.dekorativ]  neben ausgeschriebenem Namen: aria-hidden
 */
export default function Avatar({ name, kuerzel, material, groesse = 32, ring = true, dekorativ = false, className, testid }) {
  const text = kuerzel || initialen(name);
  const m = AVATAR_MATERIALIEN.includes(material) ? material : materialFuer(name || kuerzel);
  const a11y = dekorativ || !name ? { "aria-hidden": true } : { role: "img", "aria-label": name, title: name };
  return (
    <span className={cx("bo-av", ring && "bo-av--ring", className)} data-m={m} style={{ "--av": `${groesse}px` }} data-testid={testid} {...a11y}>
      {text}
    </span>
  );
}

/**
 * Überlappende Avatar-Reihe mit Zähler. `personen`: Namen oder Objekte {name, kuerzel, material}.
 * @param {object} p
 * @param {Array<string|{name?:string, kuerzel?:string, material?:string}>} p.personen
 * @param {number} [p.max]       sichtbare Kreise (Standard 4)
 * @param {number} [p.groesse]   Durchmesser (Standard 28)
 * @param {number} [p.mehr]     zusätzliche, nicht übergebene Personen für den Zähler
 * @param {string} [p.label]     Gruppenname für Screenreader (Standard: Namen aufgezählt)
 */
export function AvatarReihe({ personen = [], max = 4, groesse = 28, mehr = 0, label, className, testid }) {
  const liste = personen.map((p) => (typeof p === "string" ? { name: p } : p || {}));
  const sicht = liste.slice(0, max);
  const rest = liste.length - sicht.length + (mehr > 0 ? mehr : 0);
  const namen = liste.map((p) => p.name || p.kuerzel).filter(Boolean);
  const text = label || [namen.slice(0, max).join(", "), rest > 0 ? `und ${rest} weitere` : null].filter(Boolean).join(" ");
  if (!liste.length && rest <= 0) return null;
  return (
    <span role="img" aria-label={text} className={cx("bo-avreihe", className)} style={{ "--av": `${groesse}px` }} data-testid={testid}>
      {sicht.map((p, i) => (
        <Avatar key={`${p.kuerzel || p.name}-${i}`} name={p.name} kuerzel={p.kuerzel} material={p.material} groesse={groesse} dekorativ />
      ))}
      {rest > 0 && (
        <span aria-hidden="true" className="bo-av bo-av--mehr bo-av--ring" style={{ "--av": `${groesse}px` }}>
          +{rest}
        </span>
      )}
    </span>
  );
}
