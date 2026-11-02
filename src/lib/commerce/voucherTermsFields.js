// src/lib/commerce/voucherTermsFields.js
// Die 7 Angaben, die in den Gutscheinbedingungen (voucherTerms.js) noch
// fehlen. Wortlaut der Bedingungen: Kanzlei-Freigabe laut Inhaber-Entscheidung
// Nr. 11 (29.10.2026). Solange ein Feld leer ist (value: null), bleibt
// TERMS_STATUS in voucherTerms.js "entwurf" und /gutscheinbedingungen 404.
// Nichts schätzen: Werte wörtlich aus Firmenbuch, Steuerberatung bzw. Kanzlei.
// Nach dem Eintragen: Absätze in voucherTerms.js ohne eckige Klammern fassen,
// dann TERMS_STATUS = "freigegeben" (tests/unit/recht-freigabe.test.mjs).
// Liste für den Inhaber: Marktresearch/digital/teamleiter/freigaben-recht.md.
// Keine "@/..."-Importe.

export const TERMS_OWNER_FIELDS = Object.freeze([
  { id: "aussteller", section: "1. Aussteller", label: "Firmenwortlaut, FN, Firmenbuchgericht und UID der ausgebenden Gesellschaft (W14)", value: null },
  { id: "steuerart", section: "2. Wertgutscheine", label: "Einzweck- oder Mehrzweckgutschein (Steuerberater) → auch VOUCHER_TAX", value: null },
  { id: "gueltigkeit", section: "3. Gültigkeit", label: "eine Formulierung: „unbefristet“ oder „30 Jahre“ (Kanzlei) → auch VOUCHER_VALIDITY", value: null },
  { id: "online", section: "4. Einlösung", label: "Einlösung auch online: ja/nein", value: null },
  { id: "cafe", section: "4. Einlösung", label: "Café: Variante A (gilt nicht im Café) oder B (eigener Café-Gutschein), W15", value: null },
  { id: "aktion", section: "9. Aktions- und Gratisgutscheine", label: "Kombinierbarkeit von Aktionsgutscheinen", value: null },
  { id: "schlichtung", section: "10. Schlussbestimmungen", label: "Schlichtungsstelle nach § 19 AStG: bereit ja/nein, welche Stelle", value: null },
]);

/** Ids der Felder, die noch leer sind. */
export function termsFieldsOpen(fields = TERMS_OWNER_FIELDS) {
  return fields.filter((f) => f.value == null || String(f.value).trim() === "").map((f) => f.id);
}
