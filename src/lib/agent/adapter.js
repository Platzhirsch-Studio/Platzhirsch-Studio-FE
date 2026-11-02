// src/lib/agent/adapter.js – Werkzeuge für KI-Assistenten auf die Concierge-Logik.
//
// Die Katalog-Werkzeuge rufen DIESELBEN Funktionen wie der Concierge
// (src/lib/concierge/catalog.js: searchProducts, listCategories,
// productsInCategory, listBrands, brandOverview) – verdrahtet in deps.js,
// hier nur als Parameter (`catalog`), damit node --test einen Testkatalog
// einsetzen kann. Dazu kommen die Werkzeuge ohne Backoffice (facts.js) und
// der Terminwunsch (appointment.js).
//
// Jede Antwort: kanonische, absolute URL (`url`), price "auf Anfrage",
// Claim-Schutz über alle Strings (clean.js). Fehler des Backoffice werden
// zu einer ruhigen Meldung (isError), nie zu einem Stacktrace.
// Rein: node --test lädt es direkt.
import { PRICE, appointmentOffered as offered } from "./config.js";
import { abs, appointmentUrl, arbeitsweiseInfo, ezarriCollections, showroomInfo, FEATURE_URL } from "./facts.js";
import { freeAppointmentSlots, requestAppointment } from "./appointment.js";
import { ezarriQuantities, ideaBoardAppointmentLink } from "./planTools.js";
import { scrub } from "./clean.js";
import { toolDef } from "./tools.js";
import { validateInput } from "./validate.js";

export class ToolNotFound extends Error {}

const CATALOG_DOWN =
  "Der Produktkatalog ist gerade nicht erreichbar. Bitte später erneut versuchen. Showroom, Öffnungszeiten und Arbeitsweise sind weiter abrufbar (showroom_info, arbeitsweise); Telefon +43 5574 46255.";

const catalogUrl = (locale) => abs(`/${locale}${{ de: "/produkte", en: "/products", fr: "/produits", it: "/prodotti" }[locale]}`);

/**
 * Produktkarte des Concierge (+ optionale Details) → Antwort für Assistenten.
 * Bewusst OHNE Bild-URL: Herstellerbilder (z. B. Minotti) sind für die eigene
 * Website freigegeben, nicht zur Weitergabe; Assistenten verlinken die Seite.
 */
export function toAgentProduct(card, details) {
  return {
    name: card.name,
    brand: card.brand || null,
    category: card.category || null,
    designer: details?.designer || null,
    dimensions: details?.dimensions || null,
    url: abs(card.href),
    price: PRICE,
  };
}

/** MCP-Ergebnis: Text (JSON) + strukturierte Daten. */
export function toolResult(data, isError = false) {
  const clean = scrub(data);
  return { content: [{ type: "text", text: JSON.stringify(clean) }], structuredContent: clean, isError };
}

/**
 * @param {{
 *   catalog: { searchProducts, listCategories, productsInCategory, listBrands, brandOverview, productDetails? },
 *   appointment?: () => { mode: string, secret?: string|null, sendMail?: Function },
 *   slots?: () => ({ fetch: Function, test?: boolean, today: string } | null),
 *   log?: (msg: string, err?: unknown) => void,
 * }} deps
 */
export function createAdapter({ catalog, appointment = () => ({ mode: "dryrun", secret: null }), slots = () => null, log = () => {} }) {
  async function withDetails(cards = []) {
    if (typeof catalog.productDetails !== "function") return cards.map((c) => toAgentProduct(c));
    const details = await Promise.all(cards.map((c) => catalog.productDetails(c).catch(() => null)));
    return cards.map((c, i) => toAgentProduct(c, details[i]));
  }

  const handlers = {
    async search_products({ query, limit = 6, locale = "de" }) {
      const cards = await catalog.searchProducts(query, limit, locale);
      const products = await withDetails(cards.slice(0, limit));
      return {
        query,
        total: products.length,
        products,
        hint: products.length ? null : "Keine Treffer. Andere Schreibweise oder Marke versuchen, oder list_categories nutzen.",
        url: catalogUrl(locale),
        price: PRICE,
      };
    },
    async list_categories({ locale = "de" }) {
      const rows = await catalog.listCategories(locale);
      if (!rows.length) return { error: "catalog_unavailable", message: CATALOG_DOWN, url: catalogUrl(locale), price: PRICE, isError: true };
      return {
        total: rows.length,
        categories: rows.slice(0, 80).map((c) => ({ key: c.key, label: c.label, products: c.count, url: abs(c.href) })),
        url: catalogUrl(locale),
        price: PRICE,
      };
    },
    async products_in_category({ category_key, brand, limit = 6, locale = "de" }) {
      const r = await catalog.productsInCategory(category_key, brand, limit, locale);
      if (!r?.found) {
        return { found: false, message: r?.message || `Kategorie "${category_key}" unbekannt. Erst list_categories aufrufen.`, url: catalogUrl(locale), price: PRICE };
      }
      return {
        found: true,
        category: r.category,
        total: r.total,
        brands: Object.entries(r.brandCounts || {}).map(([name, count]) => ({ name, products: count })),
        products: await withDetails(r.products || []),
        url: abs(r.href),
        price: PRICE,
      };
    },
    async list_brands({ locale = "de" }) {
      const rows = await catalog.listBrands(locale);
      if (!rows.length) return { error: "catalog_unavailable", message: CATALOG_DOWN, url: catalogUrl(locale), price: PRICE, isError: true };
      return { total: rows.length, brands: rows.slice(0, 150).map((b) => ({ name: b.name, url: abs(b.href) })), url: abs(rows[0].href.replace(/\/[^/]+$/, "")), price: PRICE };
    },
    async brand_overview({ brand, locale = "de" }) {
      const r = await catalog.brandOverview(brand, locale);
      if (!r?.found) return { found: false, message: r?.message || `Marke "${brand}" nicht im Katalog. list_brands zeigt alle Marken.`, url: catalogUrl(locale), price: PRICE };
      return {
        found: true,
        name: r.name,
        categories: (r.categories || []).map((c) => ({ key: c.key, label: c.label, products: c.count, url: abs(c.href) })),
        collections: (r.collections || []).map((c) => ({ name: c.name, products: c.count })),
        url: abs(r.href),
        appointment: appointmentUrl(locale),
        price: PRICE,
      };
    },
    async showroom_info() {
      return showroomInfo();
    },
    async arbeitsweise() {
      return arbeitsweiseInfo();
    },
    async ezarri_collections(filter) {
      return ezarriCollections(filter);
    },
    // Rat 9,5 C10: keine Personendaten, keine Nebenwirkung (planTools.js).
    async ezarri_quantities(input) {
      return { ...ezarriQuantities(input), price: PRICE };
    },
    async idea_board_appointment_link({ share_id, locale = "de" }) {
      return { ...ideaBoardAppointmentLink({ share_id, locale, calendar: slotsOffered() }), price: PRICE };
    },
    async free_appointment_slots(input) {
      const { isError, result } = await freeAppointmentSlots(input, slots());
      return { ...result, price: PRICE, ...(isError ? { isError: true } : {}) };
    },
    async request_appointment(input) {
      const { isError, result } = await requestAppointment(input, appointment());
      return { ...result, url: FEATURE_URL, price: PRICE, ...(isError ? { isError: true } : {}) };
    },
  };

  /**
   * tools/call. Wirft ToolNotFound bei unbekanntem Namen (→ JSON-RPC -32602);
   * ungültige Eingaben und Backoffice-Fehler kommen als isError-Ergebnis
   * zurück, damit der Assistent sich korrigieren kann (MCP 2025-11-25).
   */
  async function callTool(name, args) {
    if (!toolDef(name) || !handlers[name] || (name === "free_appointment_slots" && !slotsOffered())) throw new ToolNotFound(name);
    const v = validateInput(name, args);
    if (!v.ok) {
      const consent = name === "request_appointment" && v.issues.some((i) => i.startsWith("agent_consent"));
      return toolResult(
        {
          error: consent ? "consent_required" : "invalid_input",
          message: consent
            ? "Ohne agent_consent: true wird kein Terminwunsch übergeben. Fragen Sie die Person, ob sie den Termin wünscht und der Weitergabe von Name, E-Mail und Telefon an Platzhirsch zustimmt."
            : "Eingabe ungültig.",
          issues: v.issues,
          url: FEATURE_URL,
          price: PRICE,
        },
        true
      );
    }
    try {
      const { isError = false, ...data } = await handlers[name](v.data);
      return toolResult(data, isError);
    } catch (error) {
      log(`[agent] tool ${name} failed`, error);
      return toolResult({ error: "catalog_unavailable", message: CATALOG_DOWN, url: FEATURE_URL, price: PRICE }, true);
    }
  }

  /** tools/list and instructions: request_appointment only in dryrun/live (never „off“). */
  function appointmentOffered() {
    try {
      return offered(appointment()?.mode);
    } catch {
      return false;
    }
  }

  /** free_appointment_slots nur bei aktivem Online-Kalender (tools/list + tools/call). */
  function slotsOffered() {
    try {
      return Boolean(slots());
    } catch {
      return false;
    }
  }

  return { callTool, appointmentOffered, slotsOffered };
}
