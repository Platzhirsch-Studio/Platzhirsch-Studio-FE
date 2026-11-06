// src/lib/booking/schema.js – Eingaben der /api/termin/*-Routen (zod, Allowlist).
// Unbekannte Felder werden verworfen (strip). Fehler je Feld mit den Namen
// der Formularfelder (BookingWizard), Texte in copy.js `errors.<feld>`.
// Keine "@/..."-Importe.
import { z } from "zod";
import { ART_KEYS, THEMEN, modusOf } from "./types.js";
import { TERMIN_LOCALES } from "./copy.js";
import { attributionShape } from "../forms/attributionFields.js";

import { EMAIL_RE, PHONE_RE } from "./patterns.js";

export { EMAIL_RE, PHONE_RE };
const TOKEN = z.string().min(20).max(80);

const text = (max) => z.string().trim().max(max);
const isoStart = z.string().max(40).refine((v) => Number.isFinite(Date.parse(v)) && /T\d{2}:\d{2}/.test(v), "start");

export const bookSchema = z
  .object({
    art: z.enum(ART_KEYS),
    modus: z.enum(["studio", "video"]).optional(),
    thema: z.enum(THEMEN).optional(),
    start: isoStart,
    vorname: text(60).min(1, "vorname"),
    nachname: text(80).min(1, "nachname"),
    email: text(254).refine((v) => EMAIL_RE.test(v), "email"),
    telefon: text(40).optional().default(""),
    plzOrt: text(80).optional().default(""),
    anliegen: z.string().max(1000, "anliegen").optional().default(""),
    einwilligungVideo: z.boolean().optional().default(false),
    locale: z.enum(TERMIN_LOCALES).optional().default("de"),
    website: z.string().max(500).optional().default(""),
    t: z.number().int().nonnegative().optional(),
    idem: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
    // utm_* / klick_id: nur mit Ads-Einwilligung vom Browser (forms/attributionFields.js).
    ...attributionShape(z),
  })
  .superRefine((v, ctx) => {
    const add = (path) => ctx.addIssue({ code: "custom", path: [path], message: path });
    if (v.art === "planung") {
      if (!v.thema) add("thema");
      if (!v.modus) add("modus");
    }
    const modus = modusOf(v.art, v.modus);
    if (v.telefon && !PHONE_RE.test(v.telefon)) add("telefon");
    if (modus === "vor_ort") {
      if (!v.telefon) add("telefon");
      if (v.plzOrt.length < 3) add("plzOrt");
    }
    if (modus === "video" && v.einwilligungVideo !== true) add("consent");
  });

export const slotsSchema = z.object({
  art: z.enum(ART_KEYS),
  modus: z.enum(["studio", "video"]).optional(),
  von: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const manageSchema = z.object({ token: TOKEN, locale: z.enum(TERMIN_LOCALES).optional().default("de") });
export const rescheduleSchema = manageSchema.extend({ start: isoStart });
/** Bestätigungslink "<ref>.<token>" aus dem Fragment von /[locale]/termin/bestaetigen. */
export const confirmSchema = z.object({ link: z.string().min(40).max(60), locale: z.enum(TERMIN_LOCALES).optional().default("de") });

/** zod-Fehler → { feld: "feld" } (erster Fehler je Feld). */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error?.issues || []) {
    const key = String(issue.path?.[0] ?? "form");
    if (!out[key]) out[key] = key === "einwilligungVideo" ? "consent" : key;
  }
  if (out.einwilligungVideo) {
    out.consent = "consent";
    delete out.einwilligungVideo;
  }
  return out;
}
