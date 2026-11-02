// src/components/Katalog/produktTitel.js – Umbruch der Produktnamen im
// Herstellerkatalog (Optik-QA 01.11.2026). Pure, ohne "@/"-Imports.
// „Backofen 60 x 60 cm GO 250“ brach als „Backofen 60 x“ / „60 cm GO 250“ um:
// Maßangaben (Zahl × Zahl [Einheit]) bleiben zusammen. Nur Leerzeichen werden
// geschützt – Name, Schreibweise und Zeichen bleiben unverändert.

const NBSP = " ";
const UNITS = "mm|cm|m|l|kg|W|kW|V";

/**
 * @param {string} name Produktname aus dem Katalog
 * @returns {string}
 */
export function produktTitel(name) {
  if (typeof name !== "string" || !name) return name;
  return (
    name
      // „60 x 60“, „90 × 48“: Zahl – x/× – Zahl
      .replace(/(\d) ([x×]) (?=\d)/gu, `$1${NBSP}$2${NBSP}`)
      // Zahl + Einheit („60 cm“, „67 l“)
      .replace(new RegExp(`(\\d) (${UNITS})(?=$|[\\s,.;)])`, "gu"), `$1${NBSP}$2`)
      // Maßbuchstabe + Zahl („L 184 × B 85 × H 57 cm“, Konfigurator-Optionen; Optik-QA 01.11.2026)
      .replace(/(^|[\s,(])([LBHTD]) (?=\d)/gu, `$1$2${NBSP}`)
  );
}

/**
 * Lange Produktnamen (Doppelmodelle „DGC 7865 HC Pro / DGC 7865 HCX Pro“)
 * bekommen auf der Detailseite die kleinere Display-Stufe, damit die H1 nicht
 * in vier, fünf Zeilen mit einzelnen Wortresten zerfällt.
 * @param {string} name
 * @returns {"display-l"|"display-m"}
 */
export function produktTitelGroesse(name) {
  return typeof name === "string" && name.length > 24 ? "display-m" : "display-l";
}

// Marken, deren Produktnamen im Herstellerauftritt durchgehend in Versalien stehen (TARA, MEM).
// QM R4 (02.11.2026): Versalnamen wirkten zwischen den normal geschriebenen Gaggenau-/Miele-/
// BORA-Namen laut („AQUAHALO“, „SERENITY SKY“). Dort jetzt normale Schreibweise; nur Kurznamen
// bis drei Buchstaben (MEM, CYO, LOT, ENO) bleiben als Kürzel in Versalien.
const VERSAL_MARKEN = new Set(["dornbracht"]);
// QM R3: Marken mit gemischten Namen, in denen einzelne Versalwörter stehen („SQUARE Hammam
// Day Bed“, „Ikon Acoustic Square (SET OF 4)“, „CLEOPATRA Basico“) – dort werden Versalwörter
// ab 4 Buchstaben und Versal-Klammern normal geschrieben.
const GEMISCHT_MARKEN = new Set(["naggura", "fabio-alemanno", "soleum"]);
const VOKAL = /[AEIOUYÄÖÜ]/u;
const gross = (w) => w.charAt(0) + w.slice(1).toLowerCase();

/**
 * Anzeigename im Katalog (QM R1, 01.11.2026): „DORNBRACHT PIUR“ unter der Marke Dornbracht
 * wiederholte die Marke; Schreibweisen wechselten („Swop 2L“ / „SWOP 2L SOFT“, „ROSE RED“
 * neben „Flying Carpet“). Marke am Namensanfang fällt weg; reine Versalnamen werden in
 * normale Schreibweise gesetzt – außer bei Marken mit Versal-Stil. Wörter mit Ziffern
 * (Modellcodes „2L“, „GO 250“) bleiben unverändert.
 * @param {string} name
 * @param {{name?: string, slug?: string}} [marke]
 * @returns {string}
 */
export function anzeigeName(name, marke = {}) {
  if (typeof name !== "string" || !name) return name;
  let n = name.trim();
  const mn = marke?.name ? String(marke.name).trim() : "";
  if (mn && n.toLowerCase().startsWith(`${mn.toLowerCase()} `) && n.length > mn.length + 1) n = n.slice(mn.length + 1).trim();
  const istVersal = /\p{L}/u.test(n) && n === n.toUpperCase();
  if (istVersal && !VERSAL_MARKEN.has(marke?.slug)) {
    n = n.replace(/\p{L}[\p{L}'’]*/gu, (w, i, all) => {
      const vor = all[i - 1];
      const nach = all[i + w.length];
      if ((vor && /\d/.test(vor)) || (nach && /\d/.test(nach))) return w; // „2L“, „X60“
      if (w.length <= 3 && /^\s+\d/u.test(all.slice(i + w.length))) return w; // Typkürzel „GO 250“, „EB 333“
      if (!VOKAL.test(w)) return w; // QM R3: Kürzel ohne Vokal bleiben („DR“ statt „Dr“ = Doktor)
      return gross(w);
    });
  } else if (istVersal) {
    n = n.replace(/\p{L}[\p{L}'’]*/gu, (w, i, all) => {
      const vor = all[i - 1];
      const nach = all[i + w.length];
      if ((w.length <= 3 && w === all) || (vor && /[\d.]/.test(vor)) || (nach && /[\d.]/.test(nach))) return w; // Kurzname „MEM“, „CL.1“
      return VOKAL.test(w) ? gross(w) : w;
    });
  } else if (GEMISCHT_MARKEN.has(marke?.slug)) {
    n = n
      .replace(/\(([^()]*)\)/gu, (m, inner) => (/\p{Ll}/u.test(inner) || !/\p{L}{2}/u.test(inner) ? m : `(${gross(inner)})`))
      .replace(/(?<![\p{L}\d])\p{Lu}{4,}(?![\p{L}\d])/gu, (w) => (VOKAL.test(w) ? gross(w) : w));
  }
  return n;
}
