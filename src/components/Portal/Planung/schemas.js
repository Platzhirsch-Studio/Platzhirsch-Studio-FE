import { z } from "zod";

// zod schemas of the planning feedback API (/api/portal/feedback/**).
// Shared by route handlers and the feature store (re-validated there).

const id = z.string().min(1).max(80).regex(/^[A-Za-z0-9_.-]+$/);
const text = (max) => z.string().trim().min(1).max(max);

/** Percent coordinates of a pin on the rendering (0–100). */
export const pointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

const base = {
  projectId: id,
  renderingId: id.optional(),
};

export const feedbackEntrySchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("kommentar"), body: text(2000), parentId: id.optional() }),
  z.object({ ...base, kind: z.literal("vorschlag"), body: text(2000) }),
  z.object({ ...base, renderingId: id, kind: z.literal("annotation"), body: text(1000), point: pointSchema }),
  z.object({ ...base, renderingId: id, kind: z.literal("vote"), vote: z.enum(["up", "down", "none"]) }),
  z.object({
    ...base,
    renderingId: id,
    kind: z.literal("freigabe"),
    body: z.string().trim().max(1000).optional(),
    confirm: z.literal(true),
  }),
]);

export const VOICE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB ≈ several minutes Opus
export const VOICE_MAX_SECONDS = 180;

/** Accepted recording containers (MediaRecorder output of current browsers). */
export const VOICE_TYPES = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

export const voiceMetaSchema = z.object({
  projectId: id,
  renderingId: id.optional(),
  parentId: id.optional(),
  durationSec: z.coerce.number().min(0.5).max(VOICE_MAX_SECONDS),
  consent: z.literal("ja"),
});

export const entryIdSchema = id;
