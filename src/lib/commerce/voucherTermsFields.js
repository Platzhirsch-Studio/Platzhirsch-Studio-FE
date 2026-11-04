// src/lib/commerce/voucherTermsFields.js
// Die 7 Unternehmensangaben der Gutscheinbedingungen (voucherTerms.js).
// Wortlaut der Bedingungen: Kanzlei-Freigabe laut Inhaber-Entscheidung Nr. 11
// (29.10.2026). Die Werte folgen aus den Inhaber-Entscheidungen Nr. 17 (Café),
// Nr. 38 (Vertragspartnerin MW Immobilienverwaltungs GmbH), Nr. 40/45 (keine
// Verbraucherschlichtung) und Nr. 46 (03.11.2026: Gutscheinverkauf online
// erlaubt). Quelle je Wert steht in `beleg`. Nichts geschätzt; Firmendaten aus
// src/lib/site.js bzw. dem Impressum (FN 443753 d, LG Feldkirch, ATU70035339).
// Steuerliche Art „Mehrzweckgutschein“: Einlösung für Waren mit 20 % und für
// Bildbände mit 10 % möglich → USt entsteht bei Einlösung; Bestätigung des
// Steuerberaters steht in der Inhaber-Checkliste (SHOP-LIVE-2026-11-03.md).
// Keine "@/..."-Importe.

export const TERMS_OWNER_FIELDS = Object.freeze([
  { id: "aussteller", section: "1. Aussteller", label: "Firmenwortlaut, FN, Firmenbuchgericht und UID der ausgebenden Gesellschaft (W14)", value: "MW Immobilienverwaltungs GmbH, FN 443753 d, Landesgericht Feldkirch, UID ATU70035339", beleg: "Inhaber-Entscheidung Nr. 38 (02.11.2026), Impressum Variante A" },
  { id: "steuerart", section: "2. Wertgutscheine", label: "Einzweck- oder Mehrzweckgutschein (Steuerberater) → auch VOUCHER_TAX", value: "Mehrzweckgutschein (Einlösung für Waren mit 20 % und Bildbände mit 10 % möglich; Umsatzsteuer bei Einlösung)", beleg: "Inhaber-Entscheidung Nr. 46 (03.11.2026); Bestätigung Steuerberater offen, siehe SHOP-LIVE-2026-11-03.md" },
  { id: "gueltigkeit", section: "3. Gültigkeit", label: "eine Formulierung: „unbefristet“ oder „30 Jahre“ (Kanzlei) → auch VOUCHER_VALIDITY", value: "unbefristet: kein Ablaufdatum; Anspruch verjährt nach der gesetzlichen Frist von 30 Jahren (§ 1478 ABGB)", beleg: "Inhaber-Entscheidung Nr. 46 (03.11.2026), Rechtspaket 06 W3" },
  { id: "online", section: "4. Einlösung", label: "Einlösung auch online: ja/nein", value: "ja: im Showroom und für Bestellungen im Onlineshop (Code vor der Bestellung an das Team, Verrechnung mit der Bestellung)", beleg: "Inhaber-Entscheidung Nr. 46 (03.11.2026)" },
  { id: "cafe", section: "4. Einlösung", label: "Café: Variante A (gilt nicht im Café) oder B (eigener Café-Gutschein), W15", value: "Variante A: gilt nicht im Platzhirsch Café, Restaurant & Bar (Café getrennt)", beleg: "Inhaber-Entscheidung Nr. 17 (30.10.2026), Nr. 46 (03.11.2026)" },
  { id: "aktion", section: "9. Aktions- und Gratisgutscheine", label: "Kombinierbarkeit von Aktionsgutscheinen", value: "je Kauf ein Aktionsgutschein; mit gekauften Wertgutscheinen kombinierbar, soweit der Aktionsgutschein nichts anderes sagt", beleg: "Standardformulierung 03.11.2026 (zurückhaltend), Inhaber kann ändern" },
  { id: "schlichtung", section: "10. Schlussbestimmungen", label: "Schlichtungsstelle nach § 19 AStG: bereit ja/nein, welche Stelle", value: "nein: keine Teilnahme an Verfahren vor einer Verbraucherschlichtungsstelle", beleg: "Inhaber-Entscheidung Nr. 40/45 (03.11.2026)" },
]);

/** Ids der Felder, die noch leer sind. */
export function termsFieldsOpen(fields = TERMS_OWNER_FIELDS) {
  return fields.filter((f) => f.value == null || String(f.value).trim() === "").map((f) => f.id);
}
