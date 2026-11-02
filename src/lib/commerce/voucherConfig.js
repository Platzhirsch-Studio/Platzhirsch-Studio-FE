// src/lib/commerce/voucherConfig.js
// Feste Werte der Gutschein-Anfrage, OHNE zod: auch im Browser-Bundle
// (components/Gutschein/VoucherForm.js) nutzbar. Schema: voucher.js.
// Keine "@/..."-Importe.

export const AMOUNT_MIN = 25;
// Technische Obergrenze je Gutschein (Schutz vor Tippfehlern). Höhere Werte
// im Gespräch; vom Team anzupassen.
export const AMOUNT_MAX = 5000;
export const AMOUNT_PRESETS = Object.freeze([50, 100, 250, 500, 1000]);
export const QUANTITY_MAX = 100;
export const GREETING_MAX = 300;
export const NOTE_MAX = 2000;

// Motive der PDF-Vorlage. Die Gestaltung liefert das Team (Masterplan AP9
// "PDF-Vorlage"); hier stehen nur Name und eine beschreibende Zeile, keine
// Bilder ohne Freigabe.
export const MOTIFS = Object.freeze([
  Object.freeze({ id: "seelicht", label: "Seelicht", text: "Helles Papier mit einer Horizontlinie" }),
  Object.freeze({ id: "geweih", label: "Geweih", text: "Mit unserem Geweih-Zeichen" }),
  Object.freeze({ id: "schlicht", label: "Schlicht", text: "Nur Schrift, ohne Bildmotiv" }),
]);
export const MOTIF_IDS = Object.freeze(MOTIFS.map((m) => m.id));
export const motifLabel = (id) => MOTIFS.find((m) => m.id === id)?.label || String(id ?? "");

/** Betrag aus dem Formular ("100", 100, "100,00 €") → Zahl oder NaN. */
export function parseAmount(value) {
  if (typeof value === "number") return value;
  const s = String(value ?? "")
    .replace(/[\s€]/g, "")
    .replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN;
}

/** Summe einer Anfrage in Euro (Betrag × Stückzahl). */
export const voucherTotal = ({ betrag, anzahl = 1 }) => Number(betrag) * Number(anzahl || 1);

// ---------- Online-Kauf (VOUCHER_MODE=stripe, src/lib/payments) ----------
// Grenzen des Online-Kaufs; größere Mengen (Firmengeschenke) über die Anfrage.
export const ONLINE_QUANTITY_MAX = 10;
export const ONLINE_TOTAL_MAX = 5000;
// Schaltfläche nach § 8 Abs 2 FAGG / § 312j Abs 3 BGB ("Button-Lösung").
export const BUY_BUTTON_LABEL = "Zahlungspflichtig kaufen";
// Aufdruck zur Gültigkeit: NICHT hier, sondern voucherValidityText() in
// voucherTerms.js (hängt an der offenen Inhaberfrage 3, QA P2-3).
