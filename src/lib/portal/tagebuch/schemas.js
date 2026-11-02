// src/lib/portal/tagebuch/schemas.js — Eingaben und Abbildung Freigabe → Referenzprojekt.
// Rein (zod + projekte.js): genutzt von Route Handlern, Seiten und tests/unit/tagebuch.test.mjs.
import { z } from "zod";
import { LEISTUNGEN, istAdresse, validateProjekt } from "../../content/projekte.js";
import { fotografVon, nennungVon, oeffentlicherOrt } from "./anzeige.js";
import { BILD_BREITEN, EINWILLIGUNG, LIMITS, PHASEN_KEYS, phase } from "./config.js";

export const FOTO_ID = /^f-[a-z0-9]{10}$/;
export const FREIGABE_ID = /^fg-[a-z0-9]{10}$/;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (max) => z.string().trim().min(1).max(max);
const ohneAdresse = (max) => text(max).refine((v) => !istAdresse(v), "keine Straße, Hausnummer oder Postleitzahl");

/** Upload-Formular (multipart Felder außer der Datei). */
export const fotoFormSchema = z
  .object({
    phase: z.enum(PHASEN_KEYS),
    titel: z.string().trim().max(LIMITS.titelMax).optional().default(""),
    echt: z.string().optional().default(""),
    hinweis: z.literal("ja", { error: "Bitte den Hinweis zu Gesichtern und Hausnummern bestätigen." }),
  })
  .superRefine((v, ctx) => {
    if (phase(v.phase)?.echtPflicht && v.echt !== "ja")
      ctx.addIssue({ code: "custom", path: ["echt"], message: "Bitte bestätigen: Foto oder Scan des echten Originals (keine KI)." });
  });

/** „Als Referenz freigeben“ (Kunde). */
export const freigabeInputSchema = z
  .object({
    fotoIds: z.array(z.string().regex(FOTO_ID)).min(LIMITS.minFotosJeFreigabe).max(LIMITS.maxFotosJeFreigabe),
    anzeige: z.enum(["anonym", "vorname_ort"]),
    vorname: z.string().trim().max(40).optional().default(""),
    ort: z.string().trim().max(60).optional().default(""),
    einwilligung: z.literal(true, { error: "Bitte die Einwilligung bestätigen." }),
    version: z.literal(EINWILLIGUNG.version, { error: "Der Einwilligungstext wurde geändert. Bitte die Seite neu laden." }),
  })
  .superRefine((v, ctx) => {
    if (new Set(v.fotoIds).size !== v.fotoIds.length) ctx.addIssue({ code: "custom", path: ["fotoIds"], message: "doppelte Fotos" });
    if (v.anzeige !== "vorname_ort") return;
    if (!/^[\p{L}][\p{L}' -]{0,39}$/u.test(v.vorname) || v.vorname.split(/\s+/).length > 2)
      ctx.addIssue({ code: "custom", path: ["vorname"], message: "Bitte nur den Vornamen angeben." });
    if (!v.ort || istAdresse(v.ort)) ctx.addIssue({ code: "custom", path: ["ort"], message: "Bitte nur Gemeinde oder Region angeben, keine Straße und keine Postleitzahl." });
  });

/** Prüfung durch das Studio (Team). */
export const pruefungSchema = z.discriminatedUnion("aktion", [
  z.object({
    aktion: z.literal("veroeffentlichen"),
    slug: z.string().regex(SLUG).max(80),
    titel: ohneAdresse(120),
    typologie: text(60),
    leistungen: z.array(z.enum(LEISTUNGEN)).min(1),
    zeitraumVon: z.string().regex(/^\d{4}-\d{2}$/),
    zeitraumBis: z.string().regex(/^\d{4}-\d{2}$/),
    ausgangslage: text(1200),
    loesung: z.array(z.object({ raum: text(60), text: text(1500) })).min(1).max(3),
    alt: z.record(z.string().regex(FOTO_ID), text(LIMITS.altMax)),
  }),
  z.object({ aktion: z.literal("ablehnen"), notiz: z.string().trim().max(500).optional().default("") }),
  z.object({ aktion: z.literal("zurueckziehen"), notiz: z.string().trim().max(500).optional().default("") }),
]);

/** Größte erzeugte Breite eines Bildes (≤ Original). */
export function groessteBreite(bild) {
  const ws = (bild?.varianten || []).map((v) => v.w);
  return ws.length ? Math.max(...ws) : BILD_BREITEN[0];
}

export { fotografVon, nennungVon, oeffentlicherOrt };

export const referenzBildSrc = (freigabeId, bildId, w, fmt = "webp") => `/api/portal/tagebuch/referenz/${freigabeId}/${bildId}-${w}.${fmt}`;

/**
 * Freigabe → Eintrag im Format von src/lib/content/projekte.js. Nur bei Status
 * „veroeffentlicht“ ist das Ergebnis gültig (freigegeben: true). Bilder in der
 * Reihenfolge der Auswahl, Vorher/Nachher bleiben erhalten.
 */
export function freigabeZuProjekt(f) {
  const p = f.pruefung || {};
  const nennung = nennungVon(f.anzeige);
  const umfang = ["fotos", "ort", ...(nennung ? ["name"] : [])];
  return {
    slug: p.slug || "",
    freigegeben: f.status === "veroeffentlicht",
    reviewedBy: p.von || "",
    updatedAt: (p.am || "").slice(0, 10),
    titel: p.titel || "",
    ort: oeffentlicherOrt(f.anzeige),
    typologie: p.typologie || "",
    leistungen: p.leistungen || [],
    zeitraum: { von: p.zeitraumVon || "", bis: p.zeitraumBis || "" },
    ausgangslage: p.ausgangslage || "",
    loesung: p.loesung || [],
    bilder: (f.bilder || []).map((b) => {
      const w = groessteBreite(b);
      const v = b.varianten.find((x) => x.w === w);
      return {
        src: referenzBildSrc(f.id, b.id, w),
        alt: p.alt?.[b.id] || b.titel || "",
        width: v?.w || w,
        height: v?.h || Math.round((w * b.hoehe) / b.breite),
        fotograf: fotografVon(b, f.anzeige),
        nutzungsrecht: true,
        exifEntfernt: true,
        ki: "keine",
      };
    }),
    einwilligung: {
      bauherr: Boolean(f.einwilligung?.erteilt),
      datum: (f.einwilligung?.zeitpunkt || "").slice(0, 10),
      umfang,
      ablage: `Kundenportal, Einwilligung ${f.einwilligung?.version || "?"} vom ${(f.einwilligung?.zeitpunkt || "").slice(0, 16)}, Freigabe ${f.id}`,
    },
    ...(nennung ? { nennung } : {}),
    herkunft: "tagebuch",
    ohneAdresse: true,
    exifEntfernt: true,
  };
}

/** Prüft, ob eine Freigabe mit diesen Studio-Angaben veröffentlicht werden könnte. */
export function pruefeVeroeffentlichung(f, pruefung, von, am = new Date().toISOString()) {
  const kandidat = { ...f, status: "veroeffentlicht", pruefung: { ...pruefung, von, am } };
  return validateProjekt(freigabeZuProjekt(kandidat));
}

/** Freigabe-Status, die ein Kunde selbst widerrufen kann. */
export const WIDERRUFBAR = Object.freeze(["eingereicht", "veroeffentlicht"]);

/** Vorschlag für den Slug: Ort + Typologie, Kleinbuchstaben. */
export function slugVorschlag(ort, typologie, id) {
  const base = `${typologie || "projekt"} ${ort || ""}`
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "projekt"}-${String(id || "").slice(-4)}`.replace(/-+$/, "");
}
