// src/lib/commerce/voucher.js
// Gutschein-ANFRAGE (Masterplan AP9 Nr. 1, VOUCHER_MODE=anfrage).
// Kein Kauf, keine Zahlung, kein Vertrag über die Website: Die Anfrage geht
// über guardForm als Text an das bestehende Kontakt-Backoffice, das Team
// meldet sich persönlich (Rechtspaket W5: Fernabsatz, Belehrung erst in
// Angebot/Rechnung [anwaltlich prüfen]).
//
// Felder: Betrag (ab 25 €, Vorschläge 50/100/250/500/1.000 €), Motiv,
// Stückzahl, Empfänger, Grußtext, Firma (Firmengeschenke über dasselbe
// Formular), Kontakt, Anmerkung (+ Herkunftsblock aus src/lib/forms).
// Keine "@/..."-Importe: direkt mit `node --test` getestet.
import { z } from "zod";
import { EMAIL_RE, PHONE_RE } from "../forms/schemas.js";
import { HERKUNFT_MAX, isLeadRef, stripHerkunft } from "../forms/leadPayload.js";
import { formatEuro } from "./priceRules.js";
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_PRESETS,
  GREETING_MAX,
  MOTIFS,
  MOTIF_IDS,
  NOTE_MAX,
  QUANTITY_MAX,
  motifLabel,
  parseAmount,
  voucherTotal,
} from "./voucherConfig.js";

export { AMOUNT_MAX, AMOUNT_MIN, AMOUNT_PRESETS, GREETING_MAX, MOTIFS, MOTIF_IDS, NOTE_MAX, QUANTITY_MAX, motifLabel, parseAmount, voucherTotal };

export const MAX_BYTES = 12 * 1024;

const leadRef = z.unknown().transform((v) => (isLeadRef(v) ? v : undefined)).optional();
const own = (v) => String(stripHerkunft(v) ?? "");
const optional = (max) =>
  z
    .string()
    .max(max, "Diese Angabe ist zu lang.")
    .nullish()
    .transform((v) => (v ? v.trim() : ""));

export const voucherSchema = z.object({
  betrag: z.preprocess(
    parseAmount,
    z
      .number({ error: "Bitte geben Sie einen Betrag an." })
      .int("Bitte einen Betrag in ganzen Euro angeben.")
      .min(AMOUNT_MIN, `Der Betrag beginnt bei ${AMOUNT_MIN} €.`)
      .max(AMOUNT_MAX, `Für Beträge über ${formatEuro(AMOUNT_MAX)} sprechen Sie uns bitte direkt an.`)
  ),
  anzahl: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? 1 : Number(v)),
    z
      .number({ error: "Bitte eine ganze Zahl angeben." })
      .int("Bitte eine ganze Zahl angeben.")
      .min(1, "Mindestens 1 Gutschein.")
      .max(QUANTITY_MAX, `Höchstens ${QUANTITY_MAX} Gutscheine je Anfrage.`)
  ),
  motiv: z.enum(MOTIF_IDS, { error: "Bitte wählen Sie ein Motiv." }),
  empfaenger: optional(120),
  grusstext: optional(GREETING_MAX),
  firma: optional(200),
  name: z.string({ error: "Bitte geben Sie Ihren Namen an." }).trim().min(2, "Bitte geben Sie Ihren Namen an.").max(200),
  email: z
    .string({ error: "Bitte geben Sie Ihre E-Mail-Adresse an." })
    .trim()
    .max(254)
    .refine((v) => EMAIL_RE.test(v), "Bitte prüfen Sie die E-Mail-Adresse."),
  telefon: optional(40).refine((v) => !v || PHONE_RE.test(v), "Bitte prüfen Sie die Telefonnummer."),
  anmerkung: z
    .string()
    .max(NOTE_MAX + HERKUNFT_MAX, "Die Anmerkung ist zu lang.")
    .nullish()
    .transform((v) => v || "")
    .refine((v) => own(v).length <= NOTE_MAX, "Die Anmerkung ist zu lang."),
  lead_ref: leadRef,
});

/**
 * Geprüfte Anfrage → Payload des Kontakt-Backoffice
 * { name, company, email_address, telefon, ihre_nachricht }.
 * Alles Gutschein-Spezifische steht als Text in ihre_nachricht.
 */
export function voucherToBackoffice(data) {
  const lines = [
    "[Gutschein-Anfrage über die Website – keine Bestellung, keine Zahlung]",
    `Wert je Gutschein: ${formatEuro(data.betrag)}`,
    `Stückzahl: ${data.anzahl}`,
    data.anzahl > 1 ? `Gesamtwert: ${formatEuro(voucherTotal(data))}` : null,
    `Motiv: ${motifLabel(data.motiv)}`,
    data.empfaenger ? `Empfänger: ${data.empfaenger}` : null,
    data.grusstext ? `Grußtext: ${data.grusstext}` : null,
    data.firma ? `Firmengeschenk: ${data.firma}` : null,
  ].filter(Boolean);
  const note = data.anmerkung ? `\n\n${data.anmerkung}` : "";
  return {
    name: data.name,
    company: data.firma || "",
    email_address: data.email,
    telefon: data.telefon || "",
    ihre_nachricht: `${lines.join("\n")}${note}`,
  };
}
