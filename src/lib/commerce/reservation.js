// src/lib/commerce/reservation.js
// Reservierungs-ANFRAGE für ein Atelier-Stück (Masterplan AP9 Nr. 2,
// ATELIER_MODE=anfrage). Es kommt KEIN Vertrag online zustande, es wird
// nichts bezahlt und nichts verbindlich reserviert: Das Team meldet sich und
// klärt Besichtigung, Zustandsbeschreibung (gesonderte Zustimmung, § 6 Abs 1
// S 2 VGG) und alles Weitere persönlich. Kein Wort von einer "abgesicherten"
// Anzahlung (Rechtspaket W14, Bibel §11).
// Titel und Preis kommen auf dem Server aus dem Sheet (atelierSource.js),
// nicht aus dem Browser.
// Keine "@/..."-Importe: direkt mit `node --test` getestet.
import { z } from "zod";
import { EMAIL_RE, PHONE_RE } from "../forms/schemas.js";
import { HERKUNFT_MAX, isLeadRef, stripHerkunft } from "../forms/leadPayload.js";
import { formatEuro, PRICE_NOTES } from "./priceRules.js";
import { RESERVATION_NOTE_MAX, RESERVATION_WAYS, reservationWayLabel } from "./reservationConfig.js";

export { RESERVATION_NOTE_MAX, RESERVATION_WAYS, reservationWayLabel };
export const MAX_BYTES = 8 * 1024;

const leadRef = z.unknown().transform((v) => (isLeadRef(v) ? v : undefined)).optional();
const own = (v) => String(stripHerkunft(v) ?? "");
const optional = (max) =>
  z
    .string()
    .max(max, "Diese Angabe ist zu lang.")
    .nullish()
    .transform((v) => (v ? v.trim() : ""));

export const reservationSchema = z.object({
  stueck: z
    .string({ error: "Stück fehlt." })
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Stück fehlt."),
  name: z.string({ error: "Bitte geben Sie Ihren Namen an." }).trim().min(2, "Bitte geben Sie Ihren Namen an.").max(200),
  email: z
    .string({ error: "Bitte geben Sie Ihre E-Mail-Adresse an." })
    .trim()
    .max(254)
    .refine((v) => EMAIL_RE.test(v), "Bitte prüfen Sie die E-Mail-Adresse."),
  telefon: optional(40).refine((v) => !v || PHONE_RE.test(v), "Bitte prüfen Sie die Telefonnummer."),
  weg: z.enum(
    RESERVATION_WAYS.map((w) => w.id),
    { error: "Bitte wählen Sie Abholung oder Lieferung." }
  ),
  plz_ort: optional(120),
  besichtigung: z.preprocess((v) => v === true || v === "true" || v === "on", z.boolean()),
  nachricht: z
    .string()
    .max(RESERVATION_NOTE_MAX + HERKUNFT_MAX, "Die Nachricht ist zu lang.")
    .nullish()
    .transform((v) => v || "")
    .refine((v) => own(v).length <= RESERVATION_NOTE_MAX, "Die Nachricht ist zu lang."),
  lead_ref: leadRef,
});

/**
 * Geprüfte Anfrage + Stück aus dem Sheet → Payload des Kontakt-Backoffice.
 * @param {object} data   reservationSchema-Ergebnis
 * @param {object} item   Stück aus atelierSource.js (Titel, Preis)
 */
export function reservationToBackoffice(data, item) {
  const lines = [
    "[Atelierverkauf: Reservierungsanfrage über die Website – kein Kauf, keine Zahlung, noch nicht reserviert]",
    `Stück: ${item.titel} (${item.slug})`,
    `Preis laut Liste: ${formatEuro(item.preis)} (${PRICE_NOTES.join(", ")})`,
    `Gewünscht: ${reservationWayLabel(data.weg)}${data.weg === "lieferung" && data.plz_ort ? ` nach ${data.plz_ort}` : ""}`,
    data.besichtigung ? "Möchte das Stück vorher im Showroom ansehen." : null,
  ].filter(Boolean);
  const note = data.nachricht ? `\n\n${data.nachricht}` : "";
  return {
    name: data.name,
    company: "",
    email_address: data.email,
    telefon: data.telefon || "",
    ihre_nachricht: `${lines.join("\n")}${note}`,
  };
}
