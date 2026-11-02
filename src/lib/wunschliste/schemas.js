// src/lib/wunschliste/schemas.js — Prüfung aller Eingaben der Wunschliste-API.
// Fehler kommen als Codes zurück (Texte in ./copy.js), damit die vier
// Sprachen dieselbe Prüfung nutzen. Keine "@/..."-Importe (node --test).
import { z } from "zod";
import { ADMIN_TOKEN_RE, LIMITS, OCCASIONS, TOKEN_RE, WUNSCHLISTE_INHABER } from "./config.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const text = (max) =>
  z
    .string()
    .max(max * 2) // grobe Grenze vor dem Kürzen (Steuerzeichen werden entfernt)
    .nullish()
    .transform((v) => clean(v).slice(0, max));

/** Entfernt Steuerzeichen und überflüssige Leerräume, Zeilenumbrüche bleiben. */
export function clean(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const ItemInput = z.object({
  id: z.union([z.string().max(200), z.number()]).nullish(),
  name: z.string().max(300),
  category: z.string().max(200).nullish(),
  image: z.string().max(400).nullish(),
  href: z.string().max(300).nullish(),
});

export const CreateBody = z.object({
  locale: z.enum(["de", "en", "fr", "it"]).default("de"),
  occasion: z.enum(OCCASIONS),
  title: text(LIMITS.title).refine((v) => v.length >= 2, "title"),
  date: z
    .string()
    .nullish()
    .transform((v) => (v ? v.trim() : ""))
    .refine((v) => !v || (DATE_RE.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`))), "date"),
  message: text(LIMITS.message),
  items: z.array(ItemInput).min(1).max(LIMITS.items * 2),
  // Hinweis „Jeder mit dem Link sieht die Liste“ aktiv bestätigt (nie vorangekreuzt).
  understood: z.literal(true),
  website: z.string().max(0).nullish(), // Honigtopf
});

export const ReserveBody = z.object({
  item: z.string().regex(/^[a-f0-9]{16}$/),
  name: text(LIMITS.name),
  note: text(LIMITS.note),
  website: z.string().max(0).nullish(),
});

export const ReleaseBody = z.object({
  item: z.string().regex(/^[a-f0-9]{16}$/),
  cancel: z.string().regex(TOKEN_RE),
});

export const ContributionBody = z.object({
  amount: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(/[\s€]/g, "").replace(",", "."));
      return Number.isFinite(n) ? Math.round(n) : NaN;
    })
    .refine((v) => v === null || (Number.isInteger(v) && v >= (WUNSCHLISTE_INHABER.contributionMin || 1) && v <= LIMITS.contributionMax), "amount"),
  name: text(LIMITS.name).refine((v) => v.length >= 2, "name"),
  email: z
    .string()
    .trim()
    .max(LIMITS.email)
    .refine((v) => EMAIL_RE.test(v), "email"),
  message: text(LIMITS.message),
  // Freiwillig (Art. 7 Abs. 4 DSGVO, QA Recht P1-1): true = Name und Gruß
  // dürfen die Beschenkten sehen. false/fehlt = Beitrag erscheint dort ohne
  // Namen und ohne Gruß; der Beitrag selbst ist trotzdem möglich.
  consent: z
    .boolean()
    .nullish()
    .transform((v) => v === true),
  website: z.string().max(0).nullish(),
});

export const ManageBody = z.object({
  token: z.string().regex(ADMIN_TOKEN_RE),
  action: z.enum(["view", "rotate", "revoke", "restore", "delete", "sync", "release", "update"]),
  items: z.array(ItemInput).max(LIMITS.items * 2).optional(),
  item: z.string().regex(/^[a-f0-9]{16}$/).optional(),
  title: text(LIMITS.title).optional(),
  message: text(LIMITS.message).optional(),
  date: z.string().max(10).nullish(),
});

/** zod-Fehler → Liste der betroffenen Felder (für die Fehlermeldungen am Feld). */
export function fieldsOf(error) {
  const out = new Set();
  for (const issue of error?.issues || []) out.add(String(issue.path?.[0] ?? "form"));
  return [...out];
}
