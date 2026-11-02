// src/components/Shop/keinUmbruch.js
// „20 %“ darf im schmalen Mini-Warenkorb nicht zwischen Zahl und Prozentzeichen
// umbrechen: normales Leerzeichen → schmales geschütztes Leerzeichen (U+202F).
// Rein, ohne Importe (node --test).
export const keinUmbruch = (s) => String(s ?? "").replace(/(\d) %/g, "$1 %");

// Rechtstexte (/shop/recht/*): Paragraf-, Absatz- und Registerangaben sowie
// Telefonnummern brachen auf 375 px mitten durch („FN 443753 / d“, „+43 5574 /
// 46255“, „§ 8 Abs / 2 FAGG“). Nur Leerzeichen werden geschützt, Wortlaut bleibt.
const NB = " ";
export const rechtUmbruch = (s) =>
  typeof s !== "string"
    ? s
    : s
        .replace(/\+\d{2}(?: \d{2,})+/g, (m) => m.replace(/ /g, NB))
        .replace(/\bFN (\d+) ([a-z])\b/g, `FN${NB}$1${NB}$2`)
        .replace(/(§§?|\bAbs\.?|\bArt\.?|\bNr\.?|\blit\.?|\bZ) (?=\d)/g, `$1${NB}`)
        // Optik-QA r2: „E-“ / „Mail“ und „(z.“ / „B.“ – Wortverbinder nach dem Bindestrich, geschütztes Leerzeichen in Abkürzungen.
        .replace(/\bE-Mail/g, "E-⁠Mail")
        .replace(/\b(z|d|u|bzw|i)\. (B|h|a|S)\./g, `$1.${NB}$2.`)
        // Optik-QA r3 (Widerrufsformular): Postleitzahl und Ort nie getrennt („6911“ / „Lochau“).
        .replace(/\b((?:[A-Z]{1,2}-)?\d{4,5}) (?=\p{Lu}\p{Ll})/gu, `$1${NB}`);
