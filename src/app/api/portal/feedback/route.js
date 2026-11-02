import { NextResponse } from "next/server";
import { adapterName } from "@/lib/portal/config";
import { requireApiSession } from "@/lib/portal/dal";
import { isSameOrigin, noStore } from "@/lib/portal/http";
import { rateLimit } from "@/lib/portal/rateLimit";
import { feedbackEntrySchema } from "@/components/Portal/Planung/schemas";
import { loadPlanning } from "@/components/Portal/Planung/server/planungData";
import { addEntry, hasEntry } from "@/components/Portal/Planung/server/planungStore";

// POST /api/portal/feedback  (JSON, session + same origin required)
// { projectId, renderingId?, kind: kommentar|vorschlag|annotation|vote|freigabe, ... }
// Stores the structured entry in the planning store and mirrors it as plain
// feedback through the portal core adapter (portal.addFeedback), which is the
// channel the Frappe adapter will push into ERPNext.

const json = (body, status = 200) => NextResponse.json(body, { status, headers: noStore });

function mirrorMessage(entry, variant) {
  const v = variant ? `Variante ${variant.letter} („${variant.title}“)` : "Projekt";
  switch (entry.kind) {
    case "annotation":
      return `Markierung auf ${v} bei ${Math.round(entry.point.x)} % / ${Math.round(entry.point.y)} %: ${entry.body}`;
    case "vote":
      return `${entry.vote === "up" ? "Daumen hoch" : entry.vote === "down" ? "Daumen runter" : "Bewertung zurückgenommen"} für ${v}`;
    case "freigabe":
      return `FREIGABE: ${v} gefällt – bitte Angebot erstellen.${entry.body ? ` Anmerkung: ${entry.body}` : ""}`;
    case "vorschlag":
      return `Vorschlag zu ${v}: ${entry.body}`;
    default:
      return `Kommentar zu ${v}: ${entry.body}`;
  }
}

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Ungültige Herkunft" }, 403);
  const auth = await requireApiSession(request);
  if (auth.response) return auth.response;
  const { portal } = auth;

  const limit = rateLimit(`planung:${portal.customerId}`, { limit: 60, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) return json({ error: "Zu viele Rückmeldungen in kurzer Zeit. Bitte kurz warten." }, 429);

  let raw;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage" }, 400);
  }
  const parsed = feedbackEntrySchema.safeParse(raw);
  if (!parsed.success) return json({ error: "Bitte Eingaben prüfen.", issues: parsed.error.issues.map((i) => i.path.join(".")) }, 400);
  const input = parsed.data;

  const planning = await loadPlanning(portal, input.projectId);
  if (!planning) return json({ error: "Projekt nicht gefunden" }, 404);
  const variant = input.renderingId ? planning.variants.find((v) => v.id === input.renderingId) : null;
  if (input.renderingId && !variant) return json({ error: "Variante nicht gefunden" }, 404);
  if (input.parentId && !(await hasEntry(portal.customerId, input.projectId, input.parentId))) {
    return json({ error: "Beitrag nicht gefunden" }, 404);
  }

  const author = [portal.customer.firstName, portal.customer.lastName].filter(Boolean).join(" ") || portal.customer.displayName;
  let adapterFeedbackId = null;
  try {
    const res = await portal.addFeedback({
      projectId: input.projectId,
      target: variant ? { kind: "rendering", id: variant.id } : { kind: "projekt" },
      ...(input.kind === "vote" && input.vote !== "none" ? { rating: input.vote === "up" ? 5 : 1 } : {}),
      ...(input.kind === "freigabe" ? { rating: 5 } : {}),
      message: mirrorMessage(input, variant).slice(0, 2000),
    });
    adapterFeedbackId = res?.id || null;
  } catch (err) {
    // Local store failed -> the UI must say "nicht gespeichert".
    if (adapterName() === "mock") {
      console.error("[portal/planung] Speichern fehlgeschlagen:", err);
      return json({ error: "Nicht gespeichert – technischer Fehler. Bitte erneut versuchen." }, 500);
    }
    // Adapter not connected (frappe stub) – keep the structured entry anyway.
    console.warn("[portal/planung] addFeedback über Adapter fehlgeschlagen:", err.message);
  }

  try {
    const entry = await addEntry(portal.customerId, input, { author, adapterFeedbackId });
    return json({ ok: true, entry }, 201);
  } catch (err) {
    console.error("[portal/planung] Speichern fehlgeschlagen:", err);
    return json({ error: "Nicht gespeichert – technischer Fehler. Bitte erneut versuchen." }, 500);
  }
}
