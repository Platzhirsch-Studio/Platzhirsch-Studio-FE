// src/lib/concierge/prepare.js
// Turns the checked request history into model messages. A user turn that
// carries a page context (sitewide) becomes two text blocks: the rendered
// <seitenkontext> first, then the question. Every turn is rendered the same
// way on every request (fixed order, resolved from the backoffice), so the
// prefix stays append-only and the prompt cache keeps working.
import "server-only";
import { findCategory, productBySlug, brandNameBySlug } from "./catalog";
import { renderContext, resolveContext } from "./pageContext";
import { verifyActionSig } from "./token";

export async function prepareHistory(history, { sid }) {
  const lookup = {
    category: async (slug, locale) => (await findCategory(slug, locale))?.label || null,
    product: (cat, prod, locale) => productBySlug(cat, prod, locale),
    brand: (slug) => brandNameBySlug(slug),
    verifyAction: (a) => verifyActionSig(a, sid),
  };
  let lastCtx = null;
  let ctxChars = 0;
  const messages = [];
  for (const m of history) {
    if (m.role === "user" && m.ctx) {
      const resolved = await resolveContext(m.ctx, lookup);
      const block = renderContext(resolved);
      ctxChars += block.length;
      lastCtx = m.ctx;
      messages.push({ role: "user", content: [{ type: "text", text: block }, { type: "text", text: m.content }] });
    } else {
      if (m.role === "user") lastCtx = null;
      messages.push({ role: m.role, content: m.content });
    }
  }
  return { messages, lastCtx, ctxChars };
}
