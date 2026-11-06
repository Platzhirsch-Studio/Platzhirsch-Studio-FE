// src/lib/kundenkarte/schema.js – Antrag auf die Kundenkarte: zod-Schema der
// Route (/api/kundenkarte/apply, Allowlist) und die gleichen Regeln für den
// Browser (validate/validateField, ohne zod im Client-Bundle).
//
// Pflicht: vorname, nachname, email, kenntnisnahme (Teilnahmebedingungen +
// Datenschutz). Freiwillig: telefon, plz, ort, geburtstag (Tag + Monat,
// Jahr optional), interessen[], die ZWEI getrennten Einwilligungen
// einwilligung_auswertung und einwilligung_newsletter (Standard false).
// Geburtstag ans Backend als ISO-Teildatum: "YYYY-MM-DD" oder "--MM-DD".
// Keine "@/..."-Importe (node --test).
import { z } from "zod";
import { INTERESSEN_KEYS, KUNDENKARTE_LOCALES } from "./copy.js";
import { attributionShape } from "../forms/attributionFields.js";

z.config({ jitless: true });

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-()\s/]{6,25}$/;
export const PLZ_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/;
export const NAME_MAX = 100;

const trimmed = (max) => z.string().trim().max(max);
const optionalText = (max) => z.string().trim().max(max).optional().default("");
const bool = z.union([z.boolean(), z.literal(1), z.literal(0), z.literal("1"), z.literal("0"), z.literal("true"), z.literal("false")]).transform((v) => v === true || v === 1 || v === "1" || v === "true");

export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Tag/Monat/Jahr (Strings oder Zahlen, leer erlaubt) → "YYYY-MM-DD" | "--MM-DD" | "" | null (ungültig). */
export function birthdayOf({ tag, monat, jahr } = {}, now = new Date()) {
  const t = String(tag ?? "").trim();
  const m = String(monat ?? "").trim();
  const j = String(jahr ?? "").trim();
  if (!t && !m && !j) return "";
  if (!t || !m) return null;
  const d = Number(t);
  const mo = Number(m);
  if (!Number.isInteger(d) || !Number.isInteger(mo) || mo < 1 || mo > 12 || d < 1 || d > DAYS_IN_MONTH[mo - 1]) return null;
  const mm = String(mo).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  if (!j) return `--${mm}-${dd}`;
  const y = Number(j);
  const thisYear = now.getFullYear();
  if (!/^\d{4}$/.test(j) || y < thisYear - 120 || y > thisYear) return null;
  if (mo === 2 && d === 29 && !((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return null;
  return `${j}-${mm}-${dd}`;
}

export const BIRTHDAY_RE = /^(\d{4}|-)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** "YYYY-MM-DD" | "--MM-DD" gültig (Tag passt zum Monat, Jahr plausibel)? */
export function isBirthday(v, now = new Date()) {
  const m = BIRTHDAY_RE.exec(String(v || ""));
  if (!m) return false;
  return birthdayOf({ tag: m[3], monat: m[2], jahr: m[1] === "-" ? "" : m[1] }, now) !== null;
}

/** Schema der Route (nach guardForm: website/_t sind schon entfernt). */
export const applicationSchema = z.object({
  vorname: trimmed(NAME_MAX).min(1, "vorname"),
  nachname: trimmed(NAME_MAX).min(1, "nachname"),
  email: z
    .string()
    .trim()
    .max(254)
    .refine((v) => EMAIL_RE.test(v), "email")
    .transform((v) => v.toLowerCase()),
  telefon: optionalText(40).refine((v) => !v || PHONE_RE.test(v), "telefon"),
  plz: optionalText(12).refine((v) => !v || PLZ_RE.test(v), "plz"),
  ort: optionalText(120),
  geburtstag: z
    .string()
    .trim()
    .max(10)
    .optional()
    .default("")
    .refine((v) => !v || isBirthday(v), "geburtstag"),
  interessen: z
    .array(z.enum(INTERESSEN_KEYS))
    .max(INTERESSEN_KEYS.length)
    .optional()
    .default([])
    .transform((a) => [...new Set(a)]),
  einwilligung_auswertung: bool.optional().default(false),
  einwilligung_newsletter: bool.optional().default(false),
  kenntnisnahme: bool.refine((v) => v === true, "kenntnisnahme"),
  sprache: z.enum(KUNDENKARTE_LOCALES).optional().default("de"),
  // utm_* / klick_id: nur mit Ads-Einwilligung vom Browser (forms/attributionFields.js).
  ...attributionShape(z),
});

export const FIELD_ORDER = Object.freeze(["vorname", "nachname", "email", "telefon", "plz", "ort", "geburtstag", "jahr", "kenntnisnahme"]);

/** Leere Formularwerte (Browser). */
export const emptyValues = () => ({
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  plz: "",
  ort: "",
  tag: "",
  monat: "",
  jahr: "",
  interessen: [],
  einwilligung_auswertung: false,
  einwilligung_newsletter: false,
  kenntnisnahme: false,
});

/** Fehlerschlüssel eines Felds (Browser, gleiche Regeln wie das Schema) oder null. */
export function validateField(name, v) {
  const s = (k) => String(v[k] ?? "").trim();
  switch (name) {
    case "vorname":
    case "nachname":
      return s(name).length === 0 || s(name).length > NAME_MAX ? name : null;
    case "email":
      return EMAIL_RE.test(s("email")) && s("email").length <= 254 ? null : "email";
    case "telefon":
      return s("telefon") && !PHONE_RE.test(s("telefon")) ? "telefon" : null;
    case "plz":
      return s("plz") && !PLZ_RE.test(s("plz")) ? "plz" : null;
    case "geburtstag": {
      if (!s("tag") && !s("monat") && !s("jahr")) return null;
      if (!s("tag") || !s("monat")) return "geburtstag";
      return birthdayOf({ tag: v.tag, monat: v.monat }) === null ? "geburtstag" : null;
    }
    case "jahr": {
      if (!s("jahr")) return null;
      if (!s("tag") || !s("monat")) return null; // meldet "geburtstag"
      return birthdayOf({ tag: v.tag, monat: v.monat, jahr: v.jahr }) === null ? "jahr" : null;
    }
    case "kenntnisnahme":
      return v.kenntnisnahme === true ? null : "kenntnisnahme";
    default:
      return null;
  }
}

/** Alle Fehler { feld: schlüssel } (Browser). */
export function validate(values) {
  const errors = {};
  for (const name of FIELD_ORDER) {
    const e = validateField(name, values);
    if (e) errors[name] = e;
  }
  return errors;
}

/** Formularwerte → Payload der Route (ohne website/_t; die ergänzt useFormGuard). */
export function toPayload(values, locale = "de") {
  return {
    vorname: values.vorname.trim(),
    nachname: values.nachname.trim(),
    email: values.email.trim(),
    telefon: values.telefon.trim(),
    plz: values.plz.trim(),
    ort: values.ort.trim(),
    geburtstag: birthdayOf(values) || "",
    interessen: values.interessen,
    einwilligung_auswertung: values.einwilligung_auswertung === true,
    einwilligung_newsletter: values.einwilligung_newsletter === true,
    kenntnisnahme: values.kenntnisnahme === true,
    sprache: KUNDENKARTE_LOCALES.includes(locale) ? locale : "de",
  };
}
