// src/lib/concierge/tools.js
// Tools the model may call. Definitions are a frozen, deterministic array
// (part of the cached prompt prefix – never build it per request). Every
// input is validated with zod before running: with eager_input_streaming the
// API no longer validates tool input, and the tolerant parser can hand over
// a truncated object.
import "server-only";
import { z } from "zod";
import { brandOverview, categoryProducts, findCategory, listBrands, listCategories, productsInCategory, searchProducts, seenProduct } from "./catalog";
import { ACTION_TOOLS, ACTION_TOOL_NAMES, createProposer } from "./actions";
import { signAction } from "./token";
import { ROUTES } from "@/utils/routing";
import { APPOINTMENT_PATH, getShowroomInfo } from "./showroom";
import { EMAIL, PHONE_DISPLAY } from "@/lib/site";

const schemas = {
  search_products: z.object({
    query: z.string().trim().min(2).max(80),
    limit: z.number().int().min(1).max(6).optional(),
  }),
  list_categories: z.object({}).passthrough(),
  products_in_category: z.object({
    category_key: z.string().trim().min(2).max(80),
    brand: z.string().trim().min(2).max(60).optional(),
    limit: z.number().int().min(1).max(6).optional(),
  }),
  list_brands: z.object({}).passthrough(),
  brand_overview: z.object({ brand: z.string().trim().min(2).max(60) }),
  showroom_info: z.object({}).passthrough(),
  request_appointment: z.object({
    topic: z.string().trim().min(2).max(120),
    summary: z.string().trim().max(600).optional(),
  }),
};

const BASE_TOOLS = [
  {
    name: "search_products",
    description:
      "Sucht aktive Produkte im Katalog von Platzhirsch nach Produktname oder Markenname (z. B. 'Lawrence', 'Minotti', 'Vestry'). Liefert bis zu 6 Produkte mit Marke, Kategorie, Bild und Link; die Produkte werden dem Kunden automatisch als Karten angezeigt. Für Kategorien wie 'Sofa' oder 'Outdoor' besser list_categories + products_in_category verwenden. Keine Preise, keine Verfügbarkeit.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Produkt- oder Markenname, 2–80 Zeichen" },
        limit: { type: "integer", minimum: 1, maximum: 6 },
      },
      required: ["query"],
    },
    eager_input_streaming: true,
  },
  {
    name: "list_categories",
    description:
      "Listet alle Produktkategorien mit Anzahl aktiver Produkte und Link (Schlüssel wie 'sofas-couches', 'armchairs-stools', 'outdoor-…'). Aufrufen, bevor products_in_category genutzt wird.",
    input_schema: { type: "object", properties: {} },
    eager_input_streaming: true,
  },
  {
    name: "products_in_category",
    description:
      "Zeigt Produkte einer Kategorie (Schlüssel aus list_categories), optional nur einer Marke. Liefert Anzahl je Marke, Link zur Kategorieseite und bis zu 6 Produkte, die dem Kunden als Karten angezeigt werden.",
    input_schema: {
      type: "object",
      properties: {
        category_key: { type: "string", description: "Kategorie-Schlüssel aus list_categories" },
        brand: { type: "string", description: "Optional: Markenname" },
        limit: { type: "integer", minimum: 1, maximum: 6 },
      },
      required: ["category_key"],
    },
    eager_input_streaming: true,
  },
  {
    name: "list_brands",
    description: "Listet alle Marken, die im Katalog von Platzhirsch geführt werden, mit Link zur Markenseite.",
    input_schema: { type: "object", properties: {} },
    eager_input_streaming: true,
  },
  {
    name: "brand_overview",
    description:
      "Details zu einer Marke aus dem Katalog: Kategorien mit Produktanzahl und Links sowie Kollektionen.",
    input_schema: {
      type: "object",
      properties: { brand: { type: "string", description: "Markenname, z. B. 'Paola Lenti'" } },
      required: ["brand"],
    },
    eager_input_streaming: true,
  },
  {
    name: "showroom_info",
    description:
      "Fakten zum Showroom mit Café: Adresse, Öffnungszeiten, Telefon, E-Mail, Anfahrt, Link zur Terminanfrage.",
    input_schema: { type: "object", properties: {} },
    eager_input_streaming: true,
  },
  {
    name: "request_appointment",
    description:
      "Übergibt an das Beratungsteam (Menschen): zeigt dem Kunden einen Button zur Terminanfrage auf /de/beratung sowie Telefon und E-Mail. Verwenden, wenn der Kunde einen Termin, ein Angebot, Preise, Lieferzeiten, Steuer-/Zollfragen oder eine Planung wünscht. Die Zusammenfassung wird dem Kunden zum Kopieren angezeigt, nicht gespeichert oder versendet.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Thema in wenigen Worten, in der Sprache des Kunden" },
        summary: { type: "string", description: "Kurze Notiz der Wünsche (max. 600 Zeichen), ohne personenbezogene Daten" },
      },
      required: ["topic"],
    },
    eager_input_streaming: true,
  },
];

// The 7 catalogue tools first, then the 6 website-agent tools, in a fixed
// order: one frozen array = one cached prefix for Labs and sitewide (E3).
export const TOOLS = Object.freeze([...BASE_TOOLS, ...ACTION_TOOLS]);

const propose = createProposer({ catalog: { findCategory, categoryProducts, seenProduct }, sign: signAction });

const MAX_RESULT_ITEMS = 60;

// Runs one tool call. Returns { content, isError, products?, handoff?, action? }:
// `content` goes back to the model, products/handoff/action go to the UI.
// env: { locale, sid, sections, round } – page language for links, consent
// session and the page sections for proposals (sitewide); Labs passes none.
export async function runTool(name, rawInput, env = {}) {
  if (ACTION_TOOL_NAMES.has(name)) {
    // Labs page has no action cards: the tools stay in the (cached) list, but
    // only the sitewide surface turns them into proposals.
    if (env.surface !== "site") {
      return { content: JSON.stringify({ error: "Auf dieser Seite sind keine Vorschläge zur Website-Bedienung möglich. Antworte mit Text und Links." }), isError: true };
    }
    return propose(name, rawInput, env);
  }
  const locale = ["de", "en", "fr", "it"].includes(env.locale) ? env.locale : "de";
  const schema = schemas[name];
  if (!schema) return { content: `Unbekanntes Tool: ${name}`, isError: true };
  const parsed = schema.safeParse(rawInput ?? {});
  if (!parsed.success) {
    return {
      content: JSON.stringify({ INVALID_INPUT: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }),
      isError: true,
    };
  }
  const input = parsed.data;

  try {
    switch (name) {
      case "search_products": {
        const products = await searchProducts(input.query, input.limit ?? 6, locale);
        return {
          content: JSON.stringify(products.length ? { products } : { products: [], hint: "Keine Treffer – andere Schreibweise, Marke oder Kategorie versuchen." }),
          products,
        };
      }
      case "list_categories": {
        const categories = await listCategories(locale);
        return { content: JSON.stringify({ categories: categories.slice(0, MAX_RESULT_ITEMS) }) };
      }
      case "products_in_category": {
        const result = await productsInCategory(input.category_key, input.brand, input.limit ?? 6, locale);
        return { content: JSON.stringify(result), products: result.products || [] };
      }
      case "list_brands": {
        const brands = await listBrands(locale);
        return { content: JSON.stringify({ brands: brands.slice(0, 120) }) };
      }
      case "brand_overview": {
        return { content: JSON.stringify(await brandOverview(input.brand, locale)) };
      }
      case "showroom_info": {
        return { content: JSON.stringify(getShowroomInfo()) };
      }
      case "request_appointment": {
        const handoff = {
          topic: input.topic,
          summary: input.summary || "",
          href: locale === "de" ? `${APPOINTMENT_PATH}?quelle=concierge` : `/${locale}${ROUTES.beratung[locale]}?quelle=concierge`,
          phone: PHONE_DISPLAY,
          email: EMAIL,
        };
        return {
          content: JSON.stringify({ shown_to_customer: true, href: handoff.href, phone: PHONE_DISPLAY, email: EMAIL }),
          handoff,
        };
      }
      default:
        return { content: `Unbekanntes Tool: ${name}`, isError: true };
    }
  } catch (error) {
    console.error(`[concierge] tool ${name} failed:`, error);
    return { content: "Der Katalog ist gerade nicht erreichbar. Bitte ohne diese Daten weiterhelfen oder an das Team verweisen.", isError: true };
  }
}
