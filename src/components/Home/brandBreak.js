// QM shell-home r5 (iPhone 15, WCAG 1.4.12 text spacing, IT): in the two
// brand columns of the homepage (167 px each) "Rimadesio" grew to 192 px with
// 0.12em letter spacing and broke as "Rimades|io" without a hyphen,
// "ClassiCo[n]" was cut. Long single-word brand names get soft hyphens
// (U+00AD) at a syllable or word-part boundary: invisible at normal size (the
// longest name is 157 px), a real, visible hyphen only where the name has to
// break. Screen readers and search engines ignore U+00AD.
const SHY = "\u00ad";

// Known names: break points chosen by syllable / word part.
const BREAKS = {
  rimadesio: "Rima|desio",
  classicon: "Classi|Con",
  eichholtz: "Eich|holtz",
  poliform: "Poli|form",
  minotti: "Mi|notti",
  gloster: "Glos|ter",
  kettal: "Ket|tal",
  dedon: "De|don",
  desalto: "De|salto",
  flexform: "Flex|form",
  molteni: "Mol|teni",
  cassina: "Cas|sina",
  tribù: "Tri|bù",
  ezarri: "Ez|arri",
};

/**
 * Brand name with soft hyphens for display in narrow columns.
 * Only words of 7+ letters are touched; unknown names break at an inner
 * capital (CamelCase: "ClassiCon" → "Classi\u00adCon"). The visible text is
 * unchanged.
 * @param {string} name
 * @returns {string}
 */
export function softBrandName(name) {
  const text = String(name ?? "");
  const known = BREAKS[text.toLowerCase()];
  if (known) {
    // Keep the CMS spelling, only take the break positions from the pattern.
    const plain = known.replace(/\|/g, "");
    if (plain.toLowerCase() === text.toLowerCase()) {
      let out = "";
      let j = 0;
      for (const ch of known) {
        if (ch === "|") out += SHY;
        else out += text[j++];
      }
      return out;
    }
  }
  return text
    .split(" ")
    .map((word) => (word.length >= 7 ? word.replace(/([a-zà-ÿ])([A-Z])/g, `$1${SHY}$2`) : word))
    .join(" ");
}
