// src/lib/concierge/pageContext.js
// Context of the page the visitor is on (concierge-sitewide-architektur.md §4).
// The browser sends structured data per user turn (route, slugs, filters,
// section ids, the NUMBER of saved pieces, feedback on earlier proposals) –
// never free text of the page. Here it is checked (zod), names are resolved
// on the server from OUR backoffice (resolveContext) and rendered into a
// fixed text block (renderContext). The block is the first content block of
// that user turn, rendered byte-identical on every request, so the history
// stays an append-only, cacheable prefix.
import { z } from "zod";
import { FILTER_PARAM_LIST, ID_RE, LOCALES, SIG_RE, SLUG_RE } from "./actionKinds.js";

export const ROUTE_NAMES = Object.freeze([
  "home", "produkte", "kategorie", "produkt", "marken", "marke", "kollektion",
  "beratung", "kontakt", "merkliste", "ratgeber", "news", "thema", "other",
]);

const ROUTE_LABEL = {
  home: "Startseite",
  produkte: "Produktübersicht",
  kategorie: "Kategorie",
  produkt: "Produkt",
  marken: "Markenübersicht",
  marke: "Marke",
  kollektion: "Kollektion",
  beratung: "Beratung (Terminanfrage)",
  kontakt: "Kontakt",
  merkliste: "Ihre Auswahl (Merkliste)",
  ratgeber: "Ratgeber",
  news: "News",
  thema: "Themenseite",
  other: "Sonstige Seite",
};

const STATUS_LABEL = { done: "ausgeführt", declined: "abgelehnt", failed: "fehlgeschlagen" };

export const CTX_MAX_CHARS = 800;

const slug = z.string().regex(SLUG_RE);
const cut = (n) => z.string().transform((s) => s.replace(/[\u0000-\u001f\u007f<>]+/g, " ").trim().slice(0, n));

// Unknown keys are dropped (zod strips by default); bad optional parts are
// dropped instead of failing the whole request (.catch).
export const ctxSchema = z.object({
  locale: z.enum(LOCALES),
  route: z.enum(ROUTE_NAMES).catch("other"),
  path: z.string().max(200).regex(/^\/(de|en|fr|it)(\/[\w\-.~%]*)*$/).optional().catch(undefined),
  categoryKey: slug.optional().catch(undefined),
  productSlug: slug.optional().catch(undefined),
  brandSlug: slug.optional().catch(undefined),
  collectionSlug: slug.optional().catch(undefined),
  filters: z
    .record(z.string(), z.array(slug).max(3))
    .transform((f) => Object.fromEntries(FILTER_PARAM_LIST.filter((k) => f[k]?.length).map((k) => [k, [...f[k]].sort()])))
    .optional()
    .catch(undefined),
  sections: z
    .array(z.object({ id: slug, label: cut(60) }))
    .max(12)
    .optional()
    .catch(undefined),
  selectionCount: z.number().int().min(0).max(999).catch(0).default(0),
  actions: z
    .array(z.object({ id: z.string().regex(ID_RE), sig: z.string().regex(SIG_RE), exp: z.number(), status: z.enum(["done", "declined", "failed"]) }))
    .max(6)
    .optional()
    .catch(undefined),
});

/**
 * Names from the backoffice instead of the client. `lookup` (injected, so this
 * stays testable): { category(slug, locale) → label|null, product(catSlug,
 * prodSlug, locale) → {id,name,brand}|null, brand(slug) → name|null,
 * verifyAction({id,sig,exp}) → bool }. Whatever cannot be resolved is left out.
 */
export async function resolveContext(ctx, lookup) {
  const out = {
    locale: ctx.locale,
    route: ctx.route,
    selectionCount: ctx.selectionCount || 0,
  };
  const safe = async (fn) => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };
  if (ctx.categoryKey && lookup.category) out.category = await safe(() => lookup.category(ctx.categoryKey, ctx.locale));
  if (ctx.categoryKey && ctx.productSlug && lookup.product) {
    out.product = await safe(() => lookup.product(ctx.categoryKey, ctx.productSlug, ctx.locale));
  }
  if (ctx.brandSlug && lookup.brand) out.brand = await safe(() => lookup.brand(ctx.brandSlug));
  if (ctx.collectionSlug && out.brand) out.collection = ctx.collectionSlug;
  if (ctx.filters && Object.keys(ctx.filters).length) out.filters = ctx.filters;
  if (ctx.sections?.length) out.sections = ctx.sections;
  if (ctx.actions?.length) {
    const verify = lookup.verifyAction || (() => false);
    out.actions = ctx.actions.filter((a) => verify(a)).map((a) => ({ id: a.id, status: a.status }));
  }
  return out;
}

/**
 * Deterministic text block: fixed field order, fixed wording, capped length.
 * Same input → same bytes (prompt cache).
 */
export function renderContext(r) {
  if (!r) return "";
  const lines = [`Sprache: ${r.locale}`, `Seite: ${ROUTE_LABEL[r.route] || ROUTE_LABEL.other}`];
  if (r.product) {
    const p = r.product;
    lines.push(`Produkt: ${p.name}${p.brand ? ` (${p.brand})` : ""}${r.category ? `, Kategorie ${r.category}` : ""}, id ${p.id}`);
  } else if (r.category) {
    lines.push(`Kategorie: ${r.category}`);
  }
  if (r.brand) lines.push(`Marke: ${r.brand}${r.collection ? `, Kollektion ${r.collection}` : ""}`);
  const filters = r.filters ? FILTER_PARAM_LIST.filter((k) => r.filters[k]?.length).map((k) => `${k}=${r.filters[k].join(",")}`) : [];
  lines.push(`Filter: ${filters.length ? filters.join("; ") : "keine"}`);
  if (r.sections?.length) lines.push(`Abschnitte: ${r.sections.map((s) => `${s.id}=${s.label}`).join("; ")}`);
  lines.push(`Ihre Auswahl: ${r.selectionCount === 1 ? "1 Stück" : `${r.selectionCount || 0} Stücke`}`);
  if (r.actions?.length) lines.push(`Letzte Vorschläge: ${r.actions.map((a) => `${a.id} ${STATUS_LABEL[a.status]}`).join("; ")}`);
  let body = lines.join("\n");
  const frame = "<seitenkontext>\n\n</seitenkontext>".length;
  if (body.length > CTX_MAX_CHARS - frame) body = body.slice(0, CTX_MAX_CHARS - frame);
  return `<seitenkontext>\n${body}\n</seitenkontext>`;
}
