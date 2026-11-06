// src/lib/forms/draft.js
// Rat 9,5 C3 (UX10) and A4 (UX5) for the Beratung wizard (BeratungClient.js):
//   · draft of the wizard in sessionStorage – this tab only, gone with the
//     session, so the visitor's text never outlives it; restored only for the
//     same URL context and at most 2 h old; removed after the send.
//   · planner hand-over "ph-planer-uebergabe" (lib/kuechenplaner/handoff.js,
//     T2): { planer, text, url, at } – read once, at most 30 min old and only
//     for the planner the request names (?planer=), then deleted.
// The clock lives here, not in the form (tests/unit/forms-leads: forms carry
// no Date.now; the anti-spam `_t` comes from useFormGuard). Pure apart from
// the storage handed in; node --test (tests/unit/rat95-t1-wege.test.mjs).

export const DRAFT_KEY = "ph-beratung-entwurf";
export const DRAFT_MAX_MS = 2 * 60 * 60 * 1000;
export const HANDOFF_KEY = "ph-planer-uebergabe"; // = lib/kuechenplaner/handoff.js
export const HANDOFF_MAX_MS = 30 * 60 * 1000;

/** sessionStorage of this tab, or null (blocked, private mode, server). */
export function tabStorage() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Stable key of the URL context a draft belongs to. */
export function contextKey(ctx) {
  return JSON.stringify([ctx?.step1 || null, ctx?.step2 || null, ctx?.produkt || null, (ctx?.lines || []).map((l) => l.key), ctx?.plan || null, ctx?.ideenboard || null]);
}

/** Planner hand-over for this request, or null. */
export function readHandoff(raw, { lineKeys = [], now = Date.now() } = {}) {
  try {
    const h = typeof raw === "string" ? JSON.parse(raw) : null;
    if (!h || typeof h.text !== "string" || !h.text.trim()) return null;
    if (!Number.isFinite(h.at) || now - h.at > HANDOFF_MAX_MS || h.at > now + 60_000) return null;
    if (!lineKeys.includes(String(h.planer || ""))) return null;
    const out = { text: h.text.trim().slice(0, 4000), url: typeof h.url === "string" ? h.url : "" };
    // Sofaplaner: der Plan als Objekt (planerFields.js, nur an ph_crm). Ohne ihn wie bisher.
    if (h.config && typeof h.config === "object" && !Array.isArray(h.config)) out.config = h.config;
    return out;
  } catch {
    return null;
  }
}

/** Take the hand-over out of the storage (deleted when it was used). */
export function takeHandoff(store, lineKeys) {
  if (!store) return null;
  try {
    const h = readHandoff(store.getItem(HANDOFF_KEY), { lineKeys });
    if (h) store.removeItem(HANDOFF_KEY);
    return h;
  } catch {
    return null;
  }
}

const sameUrl = (a, b) => {
  try {
    return new URL(a).toString() === new URL(b).toString();
  } catch {
    return false;
  }
};

/**
 * Hand-over text without the line that only repeats the attached plan link
 * ("Planung öffnen: <url>", "Plan öffnen: …", "Open plan: …"). The plan
 * travels as ?plan= and is appended once as "Plan: <url>" on sending; in the
 * textarea the visitor would otherwise see a ~1,000-character link twice.
 * Without an attached plan (link too long for ?plan=) the line stays – it is
 * then the only carrier of the plan.
 */
export function withoutPlanLine(text, planUrl) {
  const s = String(text ?? "");
  if (!planUrl) return s;
  return s
    .split("\n")
    .filter((line) => {
      const i = line.indexOf(": ");
      return !(i > 0 && sameUrl(line.slice(i + 2).trim(), planUrl));
    })
    .join("\n");
}

/**
 * Saved draft for this context: { step, values } with only the known value
 * keys (strings or null), or null.
 */
export function loadDraft(store, ctxKey, base, { now = Date.now() } = {}) {
  if (!store) return null;
  try {
    const d = JSON.parse(store.getItem(DRAFT_KEY) || "null");
    if (!d || d.ctx !== ctxKey || !(now - d.at < DRAFT_MAX_MS) || !d.values || typeof d.values !== "object") return null;
    const values = Object.fromEntries(Object.keys(base).map((k) => [k, typeof d.values[k] === "string" || d.values[k] === null ? d.values[k] : base[k]]));
    return { step: Number.isInteger(d.step) ? d.step : 1, values };
  } catch {
    return null;
  }
}

export function saveDraft(store, ctxKey, { step, values }) {
  if (!store) return;
  try {
    store.setItem(DRAFT_KEY, JSON.stringify({ ctx: ctxKey, at: Date.now(), step, values }));
  } catch {
    /* storage full or blocked */
  }
}

export function clearDraft(store) {
  try {
    store?.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
