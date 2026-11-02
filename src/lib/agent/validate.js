// src/lib/agent/validate.js – zod-Prüfung der Werkzeug-Eingaben (Server).
// Spiegelt die JSON-Schemas aus tools.js; die Grenzen sind dieselben wie im
// Concierge (src/lib/concierge/tools.js). Unbekannte Felder werden
// abgelehnt (strict), damit kein Agent Daten „nebenbei“ mitschickt.
// Rein (nur zod): node --test lädt es direkt.
import { z } from "zod";

// Gleiche Einstellung wie src/lib/forms/schemas.js (CSP ohne 'unsafe-eval').
z.config({ jitless: true });

const locale = z.enum(["de", "en", "fr", "it"]).optional();
const limit = z.number().int().min(1).max(6).optional();
const text = (min, max) => z.string().trim().min(min).max(max);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;

export const INPUT_SCHEMAS = {
  search_products: z.strictObject({ query: text(2, 80), limit, locale }),
  list_categories: z.strictObject({ locale }),
  products_in_category: z.strictObject({ category_key: text(2, 80), brand: text(2, 60).optional(), limit, locale }),
  list_brands: z.strictObject({ locale }),
  brand_overview: z.strictObject({ brand: text(2, 60), locale }),
  showroom_info: z.strictObject({}),
  arbeitsweise: z.strictObject({}),
  ezarri_collections: z.strictObject({
    collection: text(2, 40).optional(),
    linie: z.enum(["Premium", "Classic", "Custom"]).optional(),
    farbe: z.enum(["weiss", "grau", "schwarz", "blau", "gruen", "braun", "gelb", "rot", "rosa"]).optional(),
  }),
  ezarri_quantities: z.strictObject({
    flaeche_m2: z.number().positive().max(5000),
    format: z.enum(["25", "50", "hexa"]).optional(),
    verschnitt_prozent: z.number().min(0).max(50).optional(),
  }),
  idea_board_appointment_link: z.strictObject({
    share_id: z.string().regex(/^[A-Za-z0-9_-]{32}$/),
    locale,
  }),
  free_appointment_slots: z.strictObject({
    art: z.enum(["studio", "video", "vor_ort", "planung"]).optional(),
    modus: z.enum(["studio", "video"]).optional(),
    from: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).optional(),
    limit: z.number().int().min(1).max(20).optional(),
    locale,
  }),
  request_appointment: z.strictObject({
    agent_consent: z.literal(true, { error: "agent_consent muss true sein: Die Person muss den Terminwunsch ausdrücklich wollen und der Weitergabe zustimmen." }),
    first_name: text(1, 100),
    last_name: text(1, 100),
    email: text(3, 254).refine((v) => EMAIL_RE.test(v), "E-Mail-Adresse ungültig"),
    phone: text(6, 20).refine((v) => PHONE_RE.test(v), "Telefonnummer ungültig (nur Ziffern, +, -, Klammern, Leerzeichen)"),
    topic: text(2, 120),
    project_type: z.enum(["Neubau", "Renovierung", "Anderes"]).optional(),
    property_type: z.enum(["Einfamilienhaus", "Wohnung", "Gewerbe"]),
    place: z.enum(["showroom", "vor_ort", "offen"]).optional(),
    preferred_times: z.array(text(2, 80)).max(3).optional(),
    message: z.string().trim().max(1000).optional(),
    locale,
  }),
};

/** → { ok: true, data } | { ok: false, issues: string[] } */
export function validateInput(name, raw) {
  const schema = INPUT_SCHEMAS[name];
  if (!schema) return { ok: false, issues: [`Unbekanntes Werkzeug: ${name}`] };
  const parsed = schema.safeParse(raw ?? {});
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, issues: parsed.error.issues.slice(0, 8).map((i) => `${i.path.join(".") || "(Eingabe)"}: ${i.message}`) };
}
