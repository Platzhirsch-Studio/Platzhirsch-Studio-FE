// src/lib/stilfinder/schema.js
// Request schema of POST /api/labs/stilfinder/moodboard (zod 4, allowlist).
// Only the e-mail address is required. The client form (MoodboardPdfForm.js)
// uses the same option lists, so labels and server values cannot drift apart.
import { z } from "zod";

import { PROJECT_TYPES, REGIONS } from "./options.js";

export { PROJECT_TYPES, REGIONS, labelOf } from "./options.js";

const optionalEnum = (list) =>
  z
    .union([z.enum(list.map((o) => o.value)), z.literal("")])
    .optional()
    .transform((v) => v || null);

// Names: letters (incl. accents such as ç/ë), spaces, apostrophe, hyphen, dot.
const NAME_RE = /^[\p{L}][\p{L}\p{M} .'’-]*$/u;

export const moodboardRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email({ pattern: z.regexes.html5Email })),
  name: z
    .string()
    .trim()
    .max(80)
    .refine((v) => v === "" || NAME_RE.test(v), "name")
    .optional()
    .transform((v) => v || null),
  projekt: optionalEnum(PROJECT_TYPES),
  region: optionalEnum(REGIONS),
  newsletter: z.boolean().optional().default(false),
  profil: z.string().regex(/^[a-z-]{3,40}$/),
  code: z
    .string()
    .regex(/^[0-4x]{1,16}$/)
    .optional()
    .nullable()
    .transform((v) => v || null),
  // honeypot and time trap, removed by guardForm before anything else
  website: z.string().max(200).optional(),
  _t: z.union([z.number(), z.string().max(20)]).optional(),
});
