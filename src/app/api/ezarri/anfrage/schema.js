// src/app/api/ezarri/anfrage/schema.js – zod-Schema (= Feld-Allowlist) der
// Ezarri-Anfrage „Muster, Beratung, Angebot“ (Team C).
//
// Rein und ohne "@/"-Aliase: wird von der Route, vom Formular (gleiche Regeln
// im Browser) und von node --test importiert.
//
// Pflicht (Konzept §7.3): Art, Name, E-Mail ODER Telefon, Einwilligung.
// Optional: Referenzen (bis 6), Fläche m², Projektart, Profil, Ort, Land,
// Zeitraum, Nachricht, Konfiguration (k) und Mischung (m) als Kontext, Fuge und
// Format der Mischung, Zubehör mit Mengen (nur Angebot).
import { z } from "zod";

// CSP ohne 'unsafe-eval' (siehe src/lib/forms/schemas.js): zod ohne JIT.
z.config({ jitless: true });

export const ARTEN = Object.freeze([
  { value: "muster", label: "Muster" },
  { value: "beratung", label: "Beratung" },
  { value: "angebot", label: "Angebot" },
]);

export const PROJEKTARTEN = Object.freeze([
  { value: "pool", label: "Pool" },
  { value: "wellness", label: "Wellness, Whirlpool, Sauna" },
  { value: "bad", label: "Bad, Dusche" },
  { value: "kueche", label: "Küche" },
  { value: "fassade", label: "Fassade, Außenwand" },
  { value: "anderes", label: "Etwas anderes" },
]);

export const PROFILE = Object.freeze([
  { value: "privat", label: "Privat" },
  { value: "architektur", label: "Architektur, Innenarchitektur" },
  { value: "bau", label: "Bauunternehmen" },
  { value: "fachbetrieb", label: "Pool- oder Fliesenfachbetrieb" },
  { value: "hotel", label: "Hotel, Gastronomie" },
]);

export const LAENDER = Object.freeze([
  { value: "AT", label: "Österreich" },
  { value: "DE", label: "Deutschland" },
  { value: "CH", label: "Schweiz" },
  { value: "LI", label: "Liechtenstein" },
  { value: "IT", label: "Italien" },
  { value: "andere", label: "anderes Land" },
]);

export const ZEITRAEUME = Object.freeze([
  { value: "3m", label: "in den nächsten 3 Monaten" },
  { value: "6m", label: "in 3 bis 6 Monaten" },
  { value: "12m", label: "in 6 bis 12 Monaten" },
  { value: "offen", label: "noch offen" },
]);

export const MAX_REFS = 6;

/** Fugenfarben-IDs (Ezarri-Konfigurator, 7 Farben) und Formate aus Custom Mix/Rechner. */
export const FUGEN_IDS = Object.freeze(["1", "2", "3", "4", "5", "6", "7"]);
export const FORMAT_IDS = Object.freeze(["25", "50", "hexa"]);

/**
 * Zubehör im Angebot (QM P2-5, Ezarri: Stückzahlen im Kostenvoranschlag änderbar).
 * Jede Position mit Einheit und Grenzen; vorbelegt aus dem Rechner.
 */
export const ZUBEHOER = Object.freeze([
  { id: "kleber", label: "Kleber (mind. C2TE)", einheit: "kg", max: 20000, step: 1 },
  { id: "fuge", label: "Epoxidfuge (RG)", einheit: "kg", max: 10000, step: 1 },
  { id: "werkzeug", label: "Werkzeugpaket laut Ezarri", einheit: "Paket", max: 20, step: 1 },
  { id: "corner", label: "Corner (Kantenteile)", einheit: "lfm", max: 5000, step: 0.1 },
  { id: "cove", label: "Cove (Hohlkehle)", einheit: "lfm", max: 5000, step: 0.1 },
]);
export const MAX_BYTES = 12 * 1024;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-()/\s]{6,24}$/;
export const REF_RE = /^[a-z0-9][a-z0-9-]{0,48}$/;

const values = (list) => list.map((x) => x.value);
const trimmed = (max) => z.string().trim().max(max);
const optText = (max) => trimmed(max).optional().transform((v) => (v ? v : undefined));
const optEnum = (list) =>
  z
    .union([z.enum(values(list)), z.literal("")])
    .optional()
    .transform((v) => (v ? v : undefined));

/** Fehlertexte (deutsch, die Oberfläche zeigt sie am Feld). */
export const MELDUNGEN = Object.freeze({
  art: "Bitte wählen Sie, was Sie anfragen möchten.",
  name: "Bitte geben Sie Ihren Namen an.",
  kontakt: "Bitte geben Sie eine E-Mail-Adresse oder eine Telefonnummer an.",
  email: "Diese E-Mail-Adresse sieht unvollständig aus, z. B. name@beispiel.at.",
  telefon: "Bitte nur Ziffern, Leerzeichen und + ( ) - / verwenden.",
  einwilligung: "Bitte bestätigen Sie, dass wir Sie zu Ihrer Anfrage kontaktieren dürfen.",
  m2: "Bitte eine Fläche zwischen 0,1 und 5000 m² angeben.",
  zubehoer: "Bitte eine Menge größer als 0 angeben oder das Häkchen entfernen.",
});

export const anfrageSchema = z
  .object({
    art: z.enum(values(ARTEN), { error: MELDUNGEN.art }),
    name: trimmed(120).min(2, MELDUNGEN.name),
    email: optText(254).refine((v) => !v || EMAIL_RE.test(v), MELDUNGEN.email),
    telefon: optText(40).refine((v) => !v || PHONE_RE.test(v), MELDUNGEN.telefon),
    einwilligung: z.literal(true, { error: MELDUNGEN.einwilligung }),
    referenzen: z
      .array(z.string().trim().toLowerCase().regex(REF_RE))
      .max(MAX_REFS)
      .optional()
      .transform((v) => (v?.length ? [...new Set(v)] : undefined)),
    m2: z
      .union([z.number(), z.string().trim()])
      .optional()
      .transform((v, ctx) => {
        if (v === undefined || v === "") return undefined;
        const n = typeof v === "number" ? v : Number.parseFloat(v.replace(",", "."));
        if (!Number.isFinite(n) || n < 0.1 || n > 5000) {
          ctx.addIssue({ code: "custom", message: MELDUNGEN.m2 });
          return z.NEVER;
        }
        return Math.round(n * 100) / 100;
      }),
    projektart: optEnum(PROJEKTARTEN),
    profil: optEnum(PROFILE),
    land: optEnum(LAENDER),
    ort: optText(120),
    zeitraum: optEnum(ZEITRAEUME),
    nachricht: optText(3000),
    // Kontext aus Konfigurator/Rechner/Custom Mix (kurze Codes, keine Freitexte)
    k: optText(1200).refine((v) => !v || /^[A-Za-z0-9_-]+$/.test(v), "invalid k"),
    m: optText(80).refine((v) => !v || /^\d{1,4}-\d{1,3}(\.\d{1,4}-\d{1,3}){0,3}$/.test(v), "invalid m"),
    rechner: optText(600).refine((v) => !v || /^[A-Za-z0-9=&%,._-]+$/.test(v), "invalid rechner"),
    fuge: optEnum(FUGEN_IDS.map((value) => ({ value }))),
    format: optEnum(FORMAT_IDS.map((value) => ({ value }))),
    zubehoer: z
      .object(
        Object.fromEntries(
          ZUBEHOER.map((x) => [
            x.id,
            z
              .union([z.number(), z.string().trim()])
              .optional()
              .transform((v, ctx) => {
                if (v === undefined || v === "") return undefined;
                const n = typeof v === "number" ? v : Number.parseFloat(v.replace(",", "."));
                if (!Number.isFinite(n) || n <= 0 || n > x.max) {
                  ctx.addIssue({ code: "custom", message: MELDUNGEN.zubehoer });
                  return z.NEVER;
                }
                return Math.round(n * 10) / 10;
              }),
          ])
        )
      )
      .strip()
      .optional()
      .transform((v) => (v && Object.values(v).some((n) => n !== undefined) ? Object.fromEntries(Object.entries(v).filter(([, n]) => n !== undefined)) : undefined)),
    quelle: optEnum([{ value: "rechner" }, { value: "custom-mix" }, { value: "konfigurator" }, { value: "katalog" }, { value: "anfrage" }]),
  })
  .superRefine((d, ctx) => {
    if (!d.email && !d.telefon) ctx.addIssue({ code: "custom", path: ["email"], message: MELDUNGEN.kontakt });
  });

/** Felder in der Reihenfolge des Formulars (Fehler-Zusammenfassung, Fokus). */
export const FELD_REIHENFOLGE = Object.freeze(["art", "referenzen", "m2", "projektart", "zubehoer", "name", "email", "telefon", "profil", "ort", "land", "zeitraum", "nachricht", "einwilligung"]);

/**
 * Prüft die Eingaben im Browser mit demselben Schema.
 * @returns {{ok: true, data: object} | {ok: false, fehler: Record<string,string>}}
 */
export function pruefeAnfrage(input) {
  const r = anfrageSchema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const fehler = {};
  for (const issue of r.error.issues) {
    const key = String(issue.path?.[0] ?? "form");
    if (!fehler[key]) fehler[key] = issue.message;
  }
  return { ok: false, fehler };
}

/** Lesbares Label zu einem Wert. */
export function labelOf(list, value) {
  return list.find((x) => x.value === value)?.label ?? value ?? "";
}
