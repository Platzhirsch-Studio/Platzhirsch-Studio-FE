// src/lib/forms/schemas.js
// zod schemas (= field allowlists) of the four form routes. They accept every
// field the existing callers send today, with the same rules the routes had
// before (required fields, e-mail/phone patterns, minimum lengths); new are
// only upper length limits. z.object() drops unknown keys, so only the fields
// listed here reach the backoffice. Values are forwarded unchanged (no trim),
// exactly as before. The error messages are the old ones of the routes.
//
// Callers and payloads: Marktresearch/digital/teamleiter/r1-R1-formulare.md
// No "@/..." imports: tested directly with `node --test`.
import { z } from "zod";
import { HERKUNFT_MAX, isLeadRef, stripHerkunft } from "./leadPayload.js";
import { attributionShape } from "./attributionFields.js";

// R6-leads: CSP without 'unsafe-eval'. zod 4.6 compiles a fast path for every
// z.object() with `new Function` and probes eval with `new Function("")` when
// the object schema is built (core/schemas.js $ZodObjectJIT, util.allowsEval).
// Under a strict CSP that probe is reported as a violation even though zod
// catches the error. `jitless` (core.d.ts $ZodConfig) skips probe and JIT;
// the generic parser gives the same results. It must run before the first
// z.object() below (the flag is read at construction). The setting is global
// for the zod instance, like src/components/Labs/zod.js does for Labs code.
z.config({ jitless: true });

// R4-leads: the free-text fields may carry the "Herkunft (automatisch)" block
// (leadPayload.js) on top of the visitor's text, so their upper limit grows
// by HERKUNFT_MAX; minimum lengths are checked on the visitor's own text.
// `lead_ref` (UUID) is accepted here and dropped before forwarding
// (forward.js), so the backoffice receives the same fields as before.
// A malformed reference never blocks an enquiry: it is simply dropped.
const leadRef = z.unknown().transform((v) => (isLeadRef(v) ? v : undefined)).optional();
const own = (v) => String(stripHerkunft(v) ?? "");

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;

const missing = (field) => `Missing required field: ${field}`;

// Required like before (`!body[field]` → missing), plus an upper limit.
const required = (field, max) =>
  z.string({ error: missing(field) }).min(1, missing(field)).max(max, `Field too long: ${field}`);

// Optional text: absent, null or a string.
const optional = (field, max) => z.string().max(max, `Field too long: ${field}`).nullish();

const email = (field) =>
  required(field, 254).refine((v) => EMAIL_RE.test(v), "Invalid email format");

// Per-route body limits, measured against the real callers (see doc):
// Küchenplaner worst case (U-Form, 3 × 8 m, 78 modules, 1,500-char note,
// share link, plan id + screenshot link) = 7.2 KB.
export const MAX_BYTES = {
  kontakt: 20 * 1024,
  beratung_anfrage: 32 * 1024,
  anfrage_produkt: 24 * 1024,
  newsletter_subscribe: 2 * 1024,
  adventsabend: 4 * 1024,
};

// /api/kontakt — Kontakt (kontakt.js) and Adventsabend (AdventsabendForm.js):
// { name, company, email_address, telefon, ihre_nachricht }
export const kontaktSchema = z.object({
  name: required("name", 200).refine((v) => v.trim().length >= 2, "Name must be at least 2 characters"),
  company: optional("company", 200),
  email_address: email("email_address"),
  telefon: optional("telefon", 40).refine((v) => !v || !v.trim() || PHONE_RE.test(v), "Invalid phone number format"),
  ihre_nachricht: required("ihre_nachricht", 8000 + HERKUNFT_MAX).refine(
    (v) => own(v).trim().length >= 10,
    "Message must be at least 10 characters"
  ),
  lead_ref: leadRef,
});

// /api/adventsabend/anmelden — AdventsabendForm.js im ph-Modus
// (src/lib/backend/adventsabend.js → ph_marketing.api.register_event).
export const adventSchema = z.object({
  name: required("name", 140).refine((v) => v.trim().length >= 2, "Name must be at least 2 characters"),
  email_address: email("email_address"),
  telefon: optional("telefon", 40).refine((v) => !v || !v.trim() || PHONE_RE.test(v), "Invalid phone number format"),
  personen: z.coerce.number({ error: missing("personen") }).int("Invalid number of persons").min(1, "Invalid number of persons").max(10, "Invalid number of persons"),
  nachricht: optional("nachricht", 500),
});

// /api/beratung_anfrage — BeratungClient.js and Labs/Kuechenplaner/ResultPanel.js
// (Sofaplaner only prepares the same payload, it does not send).
// The two choice fields carry the translated label of the visitor's locale,
// so they are free text, not an enum.
export const beratungSchema = z.object({
  bei_meiner_anfrage_geht_es_um: required("bei_meiner_anfrage_geht_es_um", 200),
  das_projekt_soll_verwirklicht_werden: required("das_projekt_soll_verwirklicht_werden", 200),
  bitte_beschreiben_sie_ihr_vorhaben: required("bitte_beschreiben_sie_ihr_vorhaben", 12000 + HERKUNFT_MAX).refine(
    (v) => own(v).trim().length >= 10,
    "Description must be at least 10 characters"
  ),
  vorname: required("vorname", 100),
  nachname: required("nachname", 100),
  email: email("email"),
  // Runde 4 (recht P2, Datenminimierung): Telefon freiwillig wie im Kontaktformular.
  telefon: optional("telefon", 40).refine((v) => !v || !v.trim() || PHONE_RE.test(v), "Invalid phone number format"),
  lead_ref: leadRef,
  // Planer-Beilage (Sofaplaner, Dreiländer-Rechner; src/lib/forms/planerFields.js):
  // nur an ph_crm weitergegeben (backend/forms.js), das alte System bekommt sie nie.
  planer: optional("planer", 40),
  planer_konfiguration: optional("planer_konfiguration", 64 * 1024),
  planer_link: optional("planer_link", 500),
});

// /api/anfrage_produkt — AnfrageFormProduct.js (Merkliste → Anfrage).
// `produkte` = cart item ids (number or string; old cart entries may be null).
export const produktSchema = z
  .object({
    anfrage_type: required("anfrage_type", 50),
    anfrage_vorname: required("anfrage_vorname", 100),
    anfrage_nachname: required("anfrage_nachname", 100),
    anfrage_email: email("anfrage_email"),
    anfrage_phone: required("anfrage_phone", 40),
    anfrage_country: required("anfrage_country", 100),
    anfrage_city: required("anfrage_city", 100),
    anfrage_address: required("anfrage_address", 300),
    anfrage_beschreibung: optional("anfrage_beschreibung", 4000 + HERKUNFT_MAX),
    anfrage_company: optional("anfrage_company", 200),
    anfrage_fiscal_number: optional("anfrage_fiscal_number", 60),
    produkte: z
      .array(z.union([z.string().max(140), z.number(), z.null()]), { error: "Invalid product list" })
      .max(300, "Too many products")
      .optional(),
    lead_ref: leadRef,
  })
  .refine((b) => b.anfrage_type !== "Geschäft" || (b.anfrage_company && b.anfrage_fiscal_number), {
    message: "Company name and fiscal number are required for business customers",
    path: ["anfrage_company"],
  });

// /api/newsletter_subscribe — Newsletter/newsletter.js: { email, website }.
// `website` is the honeypot and handled by guardForm. The route forwards { email } trimmed.
export const newsletterSchema = z.object({
  email: z
    .string({ error: "Invalid email format" })
    .max(1000)
    .refine((v) => {
      const e = v.trim();
      return e.length > 0 && e.length <= 254 && EMAIL_RE.test(e);
    }, "Invalid email format"),
  // utm_* / klick_id (nur mit Ads-Einwilligung vom Browser, attributionFields.js);
  // weitergegeben nur an das ph-Backend (route.js extraFields), nie an das alte System.
  ...attributionShape(z),
});
