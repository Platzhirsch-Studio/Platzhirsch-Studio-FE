// Preis-Konfiguration des Dreiländer-Rechners (Server und Client).
// KEINE echten Preise: Platzhirsch hat noch keine Speditions-Angebote
// (intern: Marktresearch/18, Abschn. 6). Herkunft der Schätzungen – nur intern,
// nie im UI: Fracht CH 450 € = Bericht 18, Abschn. 8.1 "Fracht Sofa nach
// St. Gallen"; Verzollung CHF 80–150 = 8.1 "Verzollungsgebühr DAP";
// Transporter CHF 150–250 = 8.1 "Transporter". `source` ist der Text, den
// Kundinnen und Kunden sehen. Alles mit `approved: false` zeigt die Seite als
// "Richtwert – Beispielwert".
// Freigabe durch den Inhaber: .data/dreilaender/config.json (siehe store.server.js)
// bzw. später Frappe-Single-Doctype "Dreilaender Rechner Einstellungen".
import * as z from "../zod.js"; // benannte Re-Exporte statt ganzem zod-Namensraum (Bundle, R4)

// Integration 28.10.2026 (P0-15): kunden-taugliche Zeile statt Platzhalter; die Zeile trägt die Plakette „Richtwert“.
export const PLACEHOLDER = "Richtwert – die genauen Kosten nennen wir auf Anfrage.";
// Fix-Runde 1 (F2): neutrale Richtwert-Formulierung ohne Inhaberbezug.
export const ESTIMATE = "Richtwert, verbindlich erst im Angebot";

const range = z
  .object({
    min: z.number().nonnegative().max(100000),
    max: z.number().nonnegative().max(100000),
    approved: z.boolean().default(false),
    source: z.string().max(300).optional(),
  })
  .refine((r) => r.max >= r.min, { message: "max < min" });

export const configSchema = z.object({
  version: z.literal(1),
  // Lieferung (Fracht) als EUR-Betrag auf der Rechnung, je Zielland.
  deliveryEur: z.object({ CH: range, FL: range, DE: range, AT: range }),
  // Verzollungsgebühr des Spediteurs bei Lieferung (Kunde = Importeur), CHF.
  customsFeeChf: range,
  // Eigener Transport bei Selbstabholung (z. B. Mietbus), CHF.
  selfTransportChf: range,
  // EU-OSS: erst true, wenn der Inhaber bestätigt, dass DE-Fernverkäufe mit
  // 19 % deutscher USt über die OSS abgerechnet werden (EU-weite Schwelle
  // 10.000 € netto überschritten). Bis dahin rechnet die DE-Lieferung mit 20 %
  // AT-USt, die 19-%-Variante erscheint nur als Hinweis.
  ossActive: z.boolean().default(false),
  fallbackRate: z.object({ rate: z.number().min(0.5).max(2), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
});

export const DEFAULT_CONFIG = configSchema.parse({
  version: 1,
  deliveryEur: {
    CH: { min: 450, max: 450, source: ESTIMATE },
    FL: { min: 450, max: 450, source: `wie Schweiz angenommen – ${PLACEHOLDER}` },
    DE: { min: 250, max: 450, source: PLACEHOLDER },
    AT: { min: 150, max: 350, source: PLACEHOLDER },
  },
  customsFeeChf: { min: 80, max: 150, source: ESTIMATE },
  selfTransportChf: { min: 150, max: 250, source: ESTIMATE },
  ossActive: false,
  fallbackRate: { rate: 0.9227, date: "2026-10-23" },
});

export function mergeConfig(base, override) {
  const merged = {
    ...base,
    ...override,
    deliveryEur: { ...base.deliveryEur, ...(override?.deliveryEur || {}) },
  };
  const parsed = configSchema.safeParse(merged);
  return parsed.success ? parsed.data : base;
}
