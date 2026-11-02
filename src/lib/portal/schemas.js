import { z } from "zod";
import { DOCUMENT_TYPE_KEYS, PROJECT_STEP_KEYS } from "./constants";

// zod schemas for every input that enters the portal (forms, route handlers,
// adapter writes). Adapters re-validate, so no caller can bypass them.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ message: "Bitte eine gültige E-Mail-Adresse eingeben." }));

export const loginRequestSchema = z.object({
  email: emailSchema,
  // Optional relative path inside the portal to return to after login.
  next: z
    .string()
    .max(200)
    .regex(/^\/de\/portal(\/[a-z0-9\-/]*)?$/i)
    .optional()
    .catch(undefined),
});

export const magicTokenSchema = z.string().min(20).max(200).regex(/^[A-Za-z0-9_-]+$/);

export const idSchema = z.string().min(1).max(80).regex(/^[A-Za-z0-9_.-]+$/);

export const documentTypeSchema = z.enum(DOCUMENT_TYPE_KEYS);
export const projectStepSchema = z.enum(PROJECT_STEP_KEYS);

export const listDocumentsSchema = z
  .object({
    type: documentTypeSchema.optional(),
    projectId: idSchema.optional(),
  })
  .default({});

export const listAppointmentsSchema = z
  .object({
    projectId: idSchema.optional(),
    /** ISO date; only appointments starting at/after it. */
    from: z.iso.datetime({ offset: true }).optional(),
  })
  .default({});

export const feedbackSchema = z.object({
  projectId: idSchema,
  /** What the feedback refers to: a rendering, an item, a document, the project. */
  target: z.object({
    kind: z.enum(["projekt", "rendering", "position", "dokument"]),
    id: idSchema.optional(),
  }),
  rating: z.number().int().min(1).max(5).optional(),
  message: z.string().trim().min(1).max(2000),
});

export const planningRequestSchema = z.object({
  projectId: idSchema.optional(),
  room: z.string().trim().min(2).max(80),
  message: z.string().trim().min(10).max(3000),
  preferredContact: z.enum(["email", "telefon", "termin"]).default("email"),
  preferredDates: z.array(z.iso.date()).max(3).default([]),
});

export const messageSchema = z.object({
  body: z.string().trim().min(2, "Bitte schreiben Sie eine Nachricht.").max(2000, "Bitte höchstens 2000 Zeichen."),
  projectId: idSchema.optional(),
});

export const messageIdsSchema = z.array(idSchema).max(200);
