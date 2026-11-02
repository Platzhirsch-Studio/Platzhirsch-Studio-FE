// src/lib/content/projekte.js — Referenzprojekte (R5-content, Masterplan AP7,
// Bericht 12 C3, Rechtspaket: Projekte nur mit Einwilligung, ohne Adresse,
// EXIF entfernt).
//
// PROJEKTE is EMPTY on purpose. There is no released project yet, and nothing
// may be invented: no projects, clients, quotes, architects or photos.
// /de/projekte shows an empty state as long as listFreigegebeneProjekte() is
// empty; /de/projekte/<slug> only renders released entries (otherwise 404).
// Both pages are noindex, not linked and not in sitemap or llms.txt.
//
// A project is public only if ALL of this holds (projektSchema):
//   - freigegeben: true (owner release) and reviewedBy/updatedAt set
//   - einwilligung.bauherr: true with date and scope (photos, place, quote),
//     the signed form is filed (Ablage), the form itself is the lawyer's
//     template (Bericht 12 C3)
//   - ohneAdresse: true, `ort` is a region ("Westallgäu", "am Bodensee"),
//     never street, house number or postcode
//   - exifEntfernt: true for the project and for every image
//   - images: own photos in public/projekte/<slug>/, photographer named,
//     usage right granted, no AI-generated rooms (Design-Bibel §7 Nr. 7)
//   - architect and quote only with their own release
//   - at most 600 words (Bericht 12 C3 format)
// Pure module (zod only): used by the pages and by tests/unit/r5-content.test.mjs.
import { z } from "zod";

export const PROJEKTE_PATH = "/de/projekte";

/** Released projects go here (newest first). Empty until the owner releases one. */
export const PROJEKTE = Object.freeze([]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum als JJJJ-MM-TT");
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, "Zeitraum als JJJJ-MM");
const nonEmpty = z.string().trim().min(1);

// Street words, house numbers and postcodes (AT/CH/LI 4 digits, DE 5 digits).
const ADDRESS_RE =
  /(?:stra(?:ß|ss)e|str\.|gasse|weg\b|platz\b|allee|ufer\s*\d|\b\d{4,5}\b|\b\d+\s*[a-z]?\s*$|hausnummer)/iu;
const noAddress = nonEmpty.refine((v) => !ADDRESS_RE.test(v), "keine Adresse (nur Region, z. B. „Westallgäu“)");
/** true, wenn der Text nach Straße, Hausnummer oder Postleitzahl aussieht (auch fürs Projekt-Tagebuch). */
export const istAdresse = (v) => ADDRESS_RE.test(String(v || ""));

/** Stages of a project chain, in the order of the design process. */
export const KETTE_STUFEN = Object.freeze(["skizze", "modell", "rendering", "foto"]);

export const LEISTUNGEN = Object.freeze(["Küche", "Wohnen", "Schlafen", "Bad", "Outdoor", "Licht", "Yacht", "Objekt"]);

export const bildSchema = z.object({
  // Eigene Bilder unter public/projekte/<slug>/ ODER, für Referenzen aus dem
  // Projekt-Tagebuch (src/lib/portal/tagebuch), die öffentliche Bild-Route
  // /api/portal/tagebuch/referenz/<freigabe>/<bild>-<breite>.<avif|webp>. Sie
  // liefert nur bei Status „veroeffentlicht“ aus (Widerruf → sofort 404).
  src: z
    .string()
    .regex(
      /^(?:\/projekte\/[a-z0-9-]+\/[\w.-]+\.(?:avif|webp|jpe?g|png)|\/api\/portal\/tagebuch\/referenz\/fg-[a-z0-9]{10}\/f-[a-z0-9]{10}-\d{3,4}\.(?:avif|webp))$/i,
      "eigenes Bild unter /projekte/<slug>/"
    ),
  alt: nonEmpty,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fotograf: nonEmpty,
  nutzungsrecht: z.literal(true, { error: "volles Nutzungsrecht (Web, Social, Print, Presse) nötig" }),
  exifEntfernt: z.literal(true, { error: "EXIF/GPS-Daten entfernen" }),
  ki: z.enum(["keine", "retusche"], { error: "keine KI-generierten Räume" }),
});

export const projektSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug: Kleinbuchstaben, Ziffern, Bindestriche"),
    freigegeben: z.literal(true, { error: "freigegeben: true (Freigabe Inhaberin)" }),
    reviewedBy: nonEmpty,
    updatedAt: isoDate,
    titel: nonEmpty,
    ort: noAddress,
    typologie: nonEmpty,
    leistungen: z.array(z.enum(LEISTUNGEN)).min(1),
    zeitraum: z.object({ von: yearMonth, bis: yearMonth }),
    flaecheQm: z.number().positive().optional(),
    architekt: z
      .object({ name: nonEmpty, url: z.url().optional(), freigabe: z.literal(true, { error: "Freigabe Architekt" }) })
      .optional(),
    ausgangslage: nonEmpty,
    loesung: z.array(z.object({ raum: nonEmpty, text: nonEmpty })).min(1).max(3),
    produkte: z.array(z.object({ name: nonEmpty, href: z.string().regex(/^\/produkte\//) })).optional(),
    zitat: z.object({ text: nonEmpty, von: nonEmpty, freigabe: z.literal(true, { error: "Freigabe Zitat" }) }).optional(),
    bilder: z.array(bildSchema).min(1),
    // Rat 9,5 (B19, seo 1 / gesamtwerk M13): the chain of ONE room, in the
    // order of the Kern-USP (Entscheidung Nr. 8): Haralds Skizze → Modell →
    // Rendering → Foto. Optional; shown from two stages on. Skizze and Modell
    // are his handwork (ki "keine"), the rendering is labelled as one.
    kette: z
      .object({
        raum: nonEmpty,
        skizze: bildSchema.extend({ ki: z.literal("keine", { error: "Skizze: keine KI" }) }).optional(),
        modell: bildSchema.extend({ ki: z.literal("keine", { error: "Modell: keine KI" }) }).optional(),
        rendering: bildSchema.optional(),
        foto: bildSchema.optional(),
      })
      .optional(),
    einwilligung: z.object({
      bauherr: z.literal(true, { error: "schriftliche Einwilligung des Bauherrn" }),
      datum: isoDate,
      // "pinterest": Fotos dürfen zusätzlich auf Pinterest (Merken-Link an den
      // Projektbildern, eigene Pins). Ohne diesen Wert gilt die Einwilligung nur
      // für die Website (Inhaber-Entscheidung Nr. 14, QA Recht P1-1).
      umfang: z.array(z.enum(["fotos", "ort", "zitat", "name", "pinterest"])).min(1),
      ablage: nonEmpty,
    }),
    // Projekt-Tagebuch: Nennung nach Wahl des Kunden („Anna, Hörbranz“), nur mit Einwilligung „name“.
    nennung: noAddress.optional(),
    herkunft: z.enum(["redaktion", "tagebuch"]).optional(),
    ohneAdresse: z.literal(true, { error: "ohneAdresse: true" }),
    exifEntfernt: z.literal(true, { error: "exifEntfernt: true" }),
  })
  .superRefine((p, ctx) => {
    const words = [p.ausgangslage, ...p.loesung.map((l) => l.text), p.zitat?.text || ""].join(" ").split(/\s+/).filter(Boolean);
    if (words.length > 600) ctx.addIssue({ code: "custom", path: ["loesung"], message: `höchstens 600 Wörter (${words.length})` });
    if (p.zitat && !p.einwilligung.umfang.includes("zitat"))
      ctx.addIssue({ code: "custom", path: ["zitat"], message: "Zitat ohne Einwilligung „zitat“" });
    if (p.nennung && !p.einwilligung.umfang.includes("name"))
      ctx.addIssue({ code: "custom", path: ["nennung"], message: "Nennung ohne Einwilligung „name“" });
    if (p.zeitraum.bis < p.zeitraum.von) ctx.addIssue({ code: "custom", path: ["zeitraum"], message: "bis vor von" });
    if (p.kette && KETTE_STUFEN.filter((k) => p.kette[k]).length < 2)
      ctx.addIssue({ code: "custom", path: ["kette"], message: "Kette braucht mindestens zwei Stufen (Skizze, Modell, Rendering, Foto)" });
  });

/** { ok: true, projekt } or { ok: false, errors: ["pfad: Meldung", …] }. */
export function validateProjekt(entry) {
  const r = projektSchema.safeParse(entry);
  if (r.success) return { ok: true, projekt: r.data };
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join(".") || "(projekt)"}: ${i.message}`) };
}

/** Only valid, released entries. Invalid ones are dropped (and logged). */
export function listFreigegebeneProjekte(list = PROJEKTE) {
  const out = [];
  for (const entry of list) {
    const r = validateProjekt(entry);
    if (r.ok) out.push(r.projekt);
    else if (process.env.NODE_ENV !== "production") console.warn(`[projekte] ${entry?.slug || "?"} nicht veröffentlicht: ${r.errors.join("; ")}`);
  }
  return out;
}

export function getProjekt(slug, list = PROJEKTE) {
  return listFreigegebeneProjekte(list).find((p) => p.slug === slug) || null;
}

/** Reserved slugs that are not projects (the template preview). */
export const RESERVED_SLUGS = Object.freeze(["vorlage"]);
