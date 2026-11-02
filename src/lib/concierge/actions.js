// src/lib/concierge/actions.js
// Website agent (concierge-sitewide-architektur.md §5). The model calls
// propose_* tools; nothing here changes anything. Each call is checked with
// zod and resolved against the catalogue, and only then sent to the browser as
// a signed PROPOSAL ("action" event). It runs only when the visitor clicks
// "Ausführen". The model learns { proposed: true, executed: false } and gets
// the outcome with the next <seitenkontext>.
//
// No tool exists for: submitting a form, sending mail, emptying the
// selection, consent, language switch, external pages, downloads, checkout.
//
// createProposer({ catalog, sign }) gets its dependencies injected, so the
// same code runs in the route, in mock mode and in node --test.
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { generateSlug } from "../slugify.js";
import {
  ACTION_TTL_MS,
  FILTER_PARAMS,
  MAX_PER_ANSWER,
  MAX_PER_SESSION,
  NOTE_MAX,
  ROUTE_KEYS,
  ROUTE_KEY_LIST,
  SLUG_RE,
  buildHref,
  checkAction,
  cleanNote,
} from "./actionKinds.js";

// Same slug as the catalogue filter (optionSlug = generateSlug), so the URL
// selects exactly these options in ShopCatalog.
const slugOf = (s) => generateSlug(String(s ?? "")).slice(0, 80);

const values = z.array(z.string().trim().min(1).max(60)).min(1).max(3);

export const ACTION_SCHEMAS = {
  propose_navigation: z.object({
    route: z.enum(ROUTE_KEY_LIST),
    reason: z.string().trim().max(120).optional(),
  }),
  propose_open_product: z.object({ product_id: z.string().trim().min(1).max(140) }),
  propose_catalog_filter: z.object({
    category_key: z.string().trim().min(2).max(80),
    brand: values.optional(),
    sub_category: values.optional(),
    material: values.optional(),
    color: values.optional(),
    area: values.optional(),
  }),
  propose_save_to_selection: z.object({
    product_ids: z.array(z.string().trim().min(1).max(140)).min(1).max(6),
  }),
  propose_appointment_form: z.object({
    topic: z.string().trim().min(2).max(120),
    note: z.string().trim().max(NOTE_MAX).optional(),
    product_id: z.string().trim().min(1).max(140).optional(),
  }),
  propose_scroll_to_section: z.object({ section_id: z.string().trim().regex(SLUG_RE) }),
};

const filterProps = {
  type: "array",
  items: { type: "string" },
  maxItems: 3,
};

// Appended to TOOLS in a fixed order (prompt cache, E3).
export const ACTION_TOOLS = [
  {
    name: "propose_navigation",
    description:
      "Schlägt dem Kunden vor, auf eine andere Seite der Website zu wechseln. Nur diese Routen-Schlüssel sind möglich, nie eine URL. Der Kunde sieht eine Karte mit 'Ausführen' und entscheidet selbst; erst dann passiert etwas. Nur verwenden, wenn der Kunde das erkennbar möchte.",
    input_schema: {
      type: "object",
      properties: {
        route: { type: "string", enum: [...ROUTE_KEY_LIST] },
        reason: { type: "string", description: "Kurzer Grund in der Sprache des Kunden, max. 120 Zeichen" },
      },
      required: ["route"],
    },
    eager_input_streaming: true,
  },
  {
    name: "propose_open_product",
    description:
      "Schlägt vor, die Produktseite eines Produkts zu öffnen. product_id muss aus einem Ergebnis von search_products oder products_in_category oder aus dem <seitenkontext> stammen.",
    input_schema: {
      type: "object",
      properties: { product_id: { type: "string" } },
      required: ["product_id"],
    },
    eager_input_streaming: true,
  },
  {
    name: "propose_catalog_filter",
    description:
      "Schlägt vor, eine Katalog-Kategorie gefiltert zu öffnen (z. B. Sofas nur von Minotti). category_key aus list_categories. Optional je bis zu 3 Werte für brand (Markenname), sub_category, material, color, area (indoor/outdoor). Liefert die Trefferzahl; bei 0 Treffern kommt ein Fehler zurück.",
    input_schema: {
      type: "object",
      properties: {
        category_key: { type: "string" },
        brand: filterProps,
        sub_category: filterProps,
        material: filterProps,
        color: filterProps,
        area: filterProps,
      },
      required: ["category_key"],
    },
    eager_input_streaming: true,
  },
  {
    name: "propose_save_to_selection",
    description:
      "Schlägt vor, 1 bis 6 Produkte auf die Merkliste ('Ihre Auswahl') zu legen. product_ids aus search_products oder products_in_category. Erst der Klick des Kunden speichert.",
    input_schema: {
      type: "object",
      properties: { product_ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 } },
      required: ["product_ids"],
    },
    eager_input_streaming: true,
  },
  {
    name: "propose_appointment_form",
    description:
      "Schlägt vor, das Formular für eine Terminanfrage zu öffnen. note ist ein Entwurf, den der Kunde selbst kopiert und einfügt (das Formular wird nicht vorausgefüllt). Das Formular wird NIE abgeschickt – der Kunde prüft und sendet selbst. note ohne Namen, Telefonnummern, E-Mail-Adressen oder Adressen. Optional product_id eines gezeigten Produkts.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Thema in wenigen Worten" },
        note: { type: "string", description: "Anliegen in 1–3 Sätzen, max. 300 Zeichen, ohne persönliche Daten" },
        product_id: { type: "string" },
      },
      required: ["topic"],
    },
    eager_input_streaming: true,
  },
  {
    name: "propose_scroll_to_section",
    description:
      "Schlägt vor, auf der aktuellen Seite zu einem Abschnitt zu springen. section_id muss im <seitenkontext> unter 'Abschnitte' stehen.",
    input_schema: {
      type: "object",
      properties: { section_id: { type: "string" } },
      required: ["section_id"],
    },
    eager_input_streaming: true,
  },
];

export const ACTION_TOOL_NAMES = new Set(ACTION_TOOLS.map((t) => t.name));

const ROUTE_TITLE = {
  home: "Startseite",
  produkte: "Produkte",
  marken: "Marken",
  beratung: "Beratung",
  kontakt: "Kontakt und Anfahrt",
  merkliste: "Ihre Auswahl",
  news: "News",
  "ueber-uns/platzhirsch": "Über Platzhirsch",
  "ueber-uns/team": "Team",
  ratgeber: "Ratgeber",
  "yacht-interior": "Yacht-Interieur",
  "outdoor-gartenplanung": "Outdoor und Gartenplanung",
  "einkaufen-aus-der-schweiz": "Einkaufen aus der Schweiz",
  gutscheine: "Gutscheine",
};

// Session counter for proposals (≤ MAX_PER_SESSION per consent sid). Costs no
// API call; kept in memory per instance, like the rate limiter's default.
const sessionCounts = (globalThis.__phConciergeProposals ||= new Map());
function countSession(sid) {
  const n = (sessionCounts.get(sid) || 0) + 1;
  sessionCounts.delete(sid);
  sessionCounts.set(sid, n);
  if (sessionCounts.size > 20000) sessionCounts.delete(sessionCounts.keys().next().value);
  return n;
}
export function resetSessionCounts() {
  sessionCounts.clear();
}

const err = (message) => ({ content: JSON.stringify({ error: message }), isError: true });

/**
 * @param {{ catalog: {
 *   findCategory(keyOrSlug, locale): Promise<{key,slug,label}|null>,
 *   categoryProducts(cat): Promise<Array>,
 *   seenProduct(id): {id,name,brand,categorySlug,urlSlug,image}|null,
 * }, sign: (p:{id,sid,exp}) => string|null, now?: () => number }} deps
 */
export function createProposer({ catalog, sign, now = () => Date.now() }) {
  // env: { sid, locale, sections: [{id,label}], round: { count } }
  return async function propose(name, rawInput, env = {}) {
    const schema = ACTION_SCHEMAS[name];
    if (!schema) return err(`Unbekanntes Tool: ${name}`);
    const parsed = schema.safeParse(rawInput ?? {});
    if (!parsed.success) {
      return { content: JSON.stringify({ INVALID_INPUT: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }), isError: true };
    }
    const input = parsed.data;
    const locale = env.locale || "de";
    const round = env.round || (env.round = { count: 0 });
    if (round.count >= MAX_PER_ANSWER) return err(`Höchstens ${MAX_PER_ANSWER} Vorschläge pro Antwort.`);
    if (env.sid && (sessionCounts.get(env.sid) || 0) >= MAX_PER_SESSION) {
      return err("Für dieses Gespräch sind keine weiteren Vorschläge möglich. Bitte an das Team verweisen.");
    }

    // Reserve the slot synchronously: parallel tool calls of one round must
    // not get past the limit together.
    round.count++;
    const fail = (message) => {
      round.count--;
      return err(message);
    };
    let action;
    try {
      action = await resolve(name, input, { locale, sections: env.sections || [], catalog });
    } catch (e) {
      console.error(`[concierge] ${name} failed:`, e);
      return fail("Der Katalog ist gerade nicht erreichbar. Bitte ohne Vorschlag weiterhelfen.");
    }
    if (action.error) return fail(action.error);

    const id = `a_${randomBytes(9).toString("base64url")}`;
    const exp = now() + ACTION_TTL_MS;
    const sig = sign({ id, sid: env.sid || "", exp });
    if (!sig) return fail("Vorschläge sind auf diesem Server nicht eingerichtet.");
    const event = { type: "action", id, sig, exp, kind: action.kind, label: action.label, summary: action.summary || "", params: action.params };
    if (action.deOnly) event.deOnly = true;
    if (Number.isFinite(action.count)) event.count = action.count;

    // Same check the browser runs (one source, actionKinds.js).
    const check = checkAction(event, { locale, now: now() });
    if (!check.ok) return fail(`Vorschlag ungültig (${check.error}).`);
    if (check.href) event.href = check.href;

    if (env.sid) countSession(env.sid);
    return {
      content: JSON.stringify({ proposed: true, id, shown_to_customer: true, executed: false, label: action.label, summary: action.summary || undefined }),
      action: event,
    };
  };
}

async function resolve(name, input, { locale, sections, catalog }) {
  switch (name) {
    case "propose_navigation": {
      const r = ROUTE_KEYS[input.route];
      return {
        kind: "navigation",
        label: ROUTE_TITLE[input.route] || input.route,
        summary: input.reason ? cleanNote(input.reason, 120) : "",
        params: { route: input.route },
        deOnly: Boolean(r.deOnly && locale !== "de"),
      };
    }
    case "propose_open_product": {
      const p = catalog.seenProduct(input.product_id);
      if (!p) return { error: "Produkt unbekannt – erst search_products oder products_in_category aufrufen und deren id verwenden." };
      return {
        kind: "open_product",
        label: [p.brand, p.name].filter(Boolean).join(" "),
        params: { categorySlug: p.categorySlug, urlSlug: p.urlSlug },
      };
    }
    case "propose_catalog_filter": {
      const cat = await catalog.findCategory(input.category_key, locale);
      if (!cat) return { error: `Kategorie "${input.category_key}" unbekannt – erst list_categories aufrufen.` };
      const products = await catalog.categoryProducts(cat);
      const getters = {
        brand: (p) => [p.brand],
        sub_category: (p) => p.subCategoryKeys || [],
        material: (p) => p.materialKeys || [],
        color: (p) => p.colorKeys || [],
        area: (p) => [p.indoorOutdoor],
      };
      const filters = {};
      const names = [];
      let hits = products;
      for (const [field, param] of Object.entries(FILTER_PARAMS)) {
        const wanted = input[field];
        if (!wanted?.length) continue;
        const known = new Map();
        for (const p of products) for (const v of getters[field](p)) if (v) known.set(slugOf(v), v);
        const slugs = [...new Set(wanted.map(slugOf))].filter((s) => known.has(s));
        if (!slugs.length) return { error: `Kein Produkt der Kategorie hat ${field} = ${wanted.join(", ")}.` };
        filters[param] = slugs.sort();
        names.push(...slugs.map((s) => known.get(s)));
        hits = hits.filter((p) => getters[field](p).some((v) => v && slugs.includes(slugOf(v))));
      }
      if (!hits.length) return { error: "0 Treffer mit diesen Filtern – andere Kombination vorschlagen." };
      return {
        kind: "catalog_filter",
        label: [cat.label, ...names].join(" · "),
        summary: hits.length === 1 ? "1 Stück" : `${hits.length} Stücke`,
        count: hits.length,
        params: { categorySlug: cat.slug, filters },
      };
    }
    case "propose_save_to_selection": {
      const items = [];
      for (const id of [...new Set(input.product_ids)]) {
        const p = catalog.seenProduct(id);
        if (!p) return { error: `Produkt ${id} unbekannt – nur ids aus search_products oder products_in_category.` };
        items.push({ id: p.id, name: p.name, brand: p.brand, categoryKey: p.categoryKey || p.categorySlug, categorySlug: p.categorySlug, urlSlug: p.urlSlug, image: p.image || null });
      }
      return {
        kind: "save_to_selection",
        label: items.length === 1 ? [items[0].brand, items[0].name].filter(Boolean).join(" ") : `${items.length} Stücke`,
        summary: items.length === 1 ? "" : items.map((i) => i.name).join(", ").slice(0, 120),
        params: { items },
      };
    }
    case "propose_appointment_form": {
      let product = "";
      if (input.product_id) {
        const p = catalog.seenProduct(input.product_id);
        if (p) product = [p.brand, p.name].filter(Boolean).join(" ");
      }
      const topic = cleanNote(input.topic, 120);
      const note = cleanNote([topic, input.note].filter(Boolean).join(": "));
      return {
        kind: "appointment_form",
        label: topic || "Terminanfrage",
        summary: note,
        params: { note, ...(product ? { product } : {}) },
      };
    }
    case "propose_scroll_to_section": {
      const s = sections.find((x) => x.id === input.section_id);
      if (!s) return { error: "Abschnitt steht nicht im <seitenkontext> dieser Seite." };
      return { kind: "scroll_to_section", label: s.label || s.id, params: { sectionId: s.id } };
    }
    default:
      return { error: `Unbekanntes Tool: ${name}` };
  }
}

export { buildHref };
