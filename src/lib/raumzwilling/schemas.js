// src/lib/raumzwilling/schemas.js — Eingaben der Raum-API (zod, rein).
import { z } from "zod";
import { RAUM_CONFIG, STATUS_KEYS } from "./config.js";

const punkt = z.array(z.number().finite().min(-1e4).max(1e4)).length(3);
const weltPunkt = z.array(z.number().finite().min(-50).max(50)).length(3);

export const kommentarSchema = z
  .object({
    text: z.string().trim().max(RAUM_CONFIG.comment.maxLength).default(""),
    punkt: weltPunkt.nullable().optional(),
    bezug: z
      .object({ art: z.enum(["punkt", "volumen", "raum"]), volumenId: z.string().max(40).optional() })
      .default({ art: "raum" }),
    sekunden: z.coerce.number().min(0).max(RAUM_CONFIG.comment.voiceMaxSeconds).optional(),
    einwilligung: z.literal("ja").optional(),
  })
  .strict();

export const massstabSchema = z.discriminatedUnion("art", [
  z.object({ art: z.literal("zwei-punkt"), a: punkt, b: punkt, meter: z.number().min(0.05).max(40), bezeichnung: z.string().trim().max(60).optional() }),
  z.object({ art: z.literal("a4"), ecken: z.array(punkt).length(4) }),
  z.object({ art: z.literal("boden"), punkte: z.array(punkt).length(3) }),
  z.object({ art: z.literal("wand"), a: punkt, b: punkt, name: z.string().trim().max(40).optional() }),
  z.object({ art: z.literal("zuruecksetzen") }),
]);

export const aktionSchema = z.discriminatedUnion("aktion", [
  z.object({ aktion: z.literal("status"), status: z.enum(STATUS_KEYS), grund: z.string().trim().max(300).optional() }),
  z.object({ aktion: z.literal("link") }),
  z.object({ aktion: z.literal("demo-zuruecksetzen") }),
  z.object({
    aktion: z.literal("waende"),
    waende: z.object({ hinten: z.string().trim().max(30), vorne: z.string().trim().max(30), links: z.string().trim().max(30), rechts: z.string().trim().max(30) }).partial(),
  }),
]);

export const videoStartSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    bytes: z.number().int().min(1024).max(RAUM_CONFIG.video.maxBytes),
    typ: z.string().max(60),
    sekunden: z.number().min(0).max(RAUM_CONFIG.video.maxSeconds + 2).nullable(),
    einwilligung: z.literal("ja"),
    a4: z.boolean().optional(),
  })
  .strict();

export const skizzeSchema = z
  .object({
    titel: z.string().trim().min(1).max(80),
    datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    echt: z.literal("ja"),
  })
  .strict();
