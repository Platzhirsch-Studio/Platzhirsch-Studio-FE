// src/lib/concierge/schema.js
// zod schemas for the concierge route bodies.
import "server-only";
import { z } from "zod";
import { LIMITS } from "./config";
import { ctxSchema } from "./pageContext";

// Sitewide: a user turn may carry the page context it was written on
// (pageContext.js). A broken ctx is dropped, never fatal.
const userMsg = z.object({
  role: z.literal("user"),
  content: z.string().trim().min(1).max(LIMITS.userChars),
  ctx: ctxSchema.optional().catch(undefined),
});
const assistantMsg = z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(LIMITS.assistantChars) });

export const chatSchema = z
  .object({
    token: z.string().min(10).max(400),
    mock: z.boolean().optional(),
    // "site" = sitewide launcher (proposals allowed), else the Labs page.
    surface: z.enum(["site", "labs"]).optional(),
    // Request id of one question; the silent second attempt after a network
    // drop sends the same id (rateLimit.js counts it only once).
    rid: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/).optional().catch(undefined),
    messages: z.array(z.discriminatedUnion("role", [userMsg, assistantMsg])).min(1).max(LIMITS.historyMessages),
  })
  .superRefine((body, ctx) => {
    const m = body.messages;
    if (m[0].role !== "user" || m[m.length - 1].role !== "user") {
      ctx.addIssue({ code: "custom", message: "Verlauf muss mit einer Kundennachricht beginnen und enden." });
    }
    for (let i = 1; i < m.length; i++) {
      if (m[i].role === m[i - 1].role) {
        ctx.addIssue({ code: "custom", message: "Rollen müssen sich abwechseln." });
        break;
      }
    }
    const total = m.reduce((n, x) => n + x.content.length, 0);
    if (total > LIMITS.totalChars) ctx.addIssue({ code: "custom", message: "Verlauf zu lang." });
  });

export const consentSchema = z.object({
  accepted: z.literal(true),
  store: z.boolean().optional(),
  // UI was switched to mock mode (dev only) – the consent text said "nothing
  // goes to Anthropic", so the token is bound to mock mode.
  mock: z.boolean().optional(),
});

export const revokeSchema = z.object({
  token: z.string().min(10).max(400),
});
