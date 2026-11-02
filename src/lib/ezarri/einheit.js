// src/lib/ezarri/einheit.js – Zahl und Einheit mit geschütztem Leerzeichen verbinden,
// damit „25 mm“, „13 Stk.“ oder „16 Referenzen“-Zeilen bei großer Schrift nicht
// zwischen Zahl und Einheit umbrechen (QM r2, WCAG 1.4.4 bei 200 % Text).
// Rein (keine Imports): Server- und Client-Komponenten, node --test.

const EINHEIT = /(\d) (mm|cm|m²|m|Stk\.|pcs|pz\.|pièces|%)(?=$|[\s.,;:)·])/g;

/** "25 mm" → "25 mm"; Text ohne Zahl+Einheit bleibt unverändert. */
export function mitFesterEinheit(text) {
  if (text == null) return "";
  return String(text).replace(EINHEIT, "$1 $2");
}

// QM r4 (200 % Text): Musternamen wie „2545-A Hexa“ brachen am Bindestrich („2545- / A /
// Hexa“). Zwischen Ziffer und Buchstabe steht deshalb ein geschützter Bindestrich (U+2011).
const CODE_STRICH = /(\d)-(?=[A-Za-z0-9])/g;

/** "2545-A Hexa" → "2545‑A Hexa" (geschützter Bindestrich); andere Texte unverändert. */
export function festerCode(text) {
  if (text == null) return "";
  return String(text).replace(CODE_STRICH, "$1‑");
}
