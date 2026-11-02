// src/lib/agent/tools.js – Werkzeug-Definitionen für MCP (tools/list) und WebMCP.
//
// EINE Quelle für: den MCP-Server (src/app/api/agent/mcp/route.js), die
// WebMCP-Registrierung im Browser (src/components/Agent/WebMcpTools.js) und
// die Werkzeugliste auf /de/ki-assistenten. Die Logik dahinter steckt in
// adapter.js (gleiche Katalogfunktionen wie der Concierge, kein zweiter
// Katalogcode).
//
// Rein und klein (kein zod, keine Pakete): wird auch im Browser geladen.
// Texte: Sie-Form, Fakten, keine Superlative, keine Preise, keine
// Händler-Aussagen (außer, was das Claim-Register freigibt).

import { appointmentMode, appointmentOffered } from "./config.js";

const LOCALE = {
  type: "string",
  enum: ["de", "en", "fr", "it"],
  description: "Sprache der Links und Kategorienamen (Standard de). Für Kunden aus Frankreich/Romandie fr, Tessin/Italien it.",
};

const LIMIT = { type: "integer", minimum: 1, maximum: 6, description: "Höchstens so viele Produkte (1–6, Standard 6)" };

const READ = Object.freeze({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });

/** Alle Werkzeuge, auch request_appointment (toolDef, Tests). */
export const ALL_TOOL_DEFS = Object.freeze([
  {
    name: "search_products",
    title: "Produkte suchen",
    description:
      "Sucht aktive Produkte im Katalog von Platzhirsch Home Living (Einrichtungsstudio mit Café in Lochau am Bodensee) nach Produkt- oder Markenname (etwa 'Lawrence', 'Minotti' oder 'Vestry'). Liefert bis zu 6 Produkte mit Name, Marke, Kategorie, Designer, Maßen (soweit im Katalog angegeben) und Link. Preis immer 'auf Anfrage'. Für Produktarten wie 'Sofa' oder 'Outdoor' besser list_categories und products_in_category nutzen.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2, maxLength: 80, description: "Produkt- oder Markenname" },
        limit: LIMIT,
        locale: LOCALE,
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { title: "Produkte suchen", ...READ },
    example: { query: "Minotti" },
    question: "Welche Minotti-Stücke kann ich in Lochau ansehen?",
  },
  {
    name: "list_categories",
    title: "Kategorien",
    description:
      "Listet alle Produktkategorien des Katalogs mit Anzahl aktiver Produkte und Link (Schlüssel wie 'sofas-couches', 'armchairs-stools', 'lamps'). Vor products_in_category aufrufen.",
    inputSchema: { type: "object", properties: { locale: LOCALE }, additionalProperties: false },
    annotations: { title: "Kategorien", ...READ },
    example: {},
    question: "Was führt Platzhirsch überhaupt?",
  },
  {
    name: "products_in_category",
    title: "Produkte einer Kategorie",
    description:
      "Produkte einer Kategorie (Schlüssel aus list_categories), optional nur einer Marke. Liefert Anzahl je Marke, Link zur Kategorieseite und bis zu 6 Produkte mit Maßen und Link.",
    inputSchema: {
      type: "object",
      properties: {
        category_key: { type: "string", minLength: 2, maxLength: 80, description: "Kategorie-Schlüssel aus list_categories" },
        brand: { type: "string", minLength: 2, maxLength: 60, description: "Optional: nur diese Marke" },
        limit: LIMIT,
        locale: LOCALE,
      },
      required: ["category_key"],
      additionalProperties: false,
    },
    annotations: { title: "Produkte einer Kategorie", ...READ },
    example: { category_key: "sofas-couches", limit: 3 },
    question: "Zeig mir Sofas, die ich Probe sitzen kann.",
  },
  {
    name: "list_brands",
    title: "Marken",
    description: "Listet alle Marken, die Platzhirsch im Katalog zeigt und plant, mit Link zur Markenseite.",
    inputSchema: { type: "object", properties: { locale: LOCALE }, additionalProperties: false },
    annotations: { title: "Marken", ...READ },
    example: {},
    question: "Welche Marken gibt es dort?",
  },
  {
    name: "brand_overview",
    title: "Marke im Überblick",
    description: "Eine Marke aus dem Katalog: Kategorien mit Produktanzahl und Links sowie Kollektionen.",
    inputSchema: {
      type: "object",
      properties: {
        brand: { type: "string", minLength: 2, maxLength: 60, description: "Markenname, z. B. 'Paola Lenti'" },
        locale: LOCALE,
      },
      required: ["brand"],
      additionalProperties: false,
    },
    annotations: { title: "Marke im Überblick", ...READ },
    example: { brand: "ClassiCon" },
    question: "Was zeigt Platzhirsch von ClassiCon?",
  },
  {
    name: "showroom_info",
    title: "Showroom und Café",
    description:
      "Fakten zum Showroom mit Café in Lochau am Bodensee: Adresse, Öffnungszeiten, Telefon, E-Mail, Anfahrt, Leistungen und Link zur Terminanfrage.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "Showroom und Café", ...READ },
    example: {},
    question: "Wann hat der Showroom in Lochau offen?",
  },
  {
    name: "arbeitsweise",
    title: "Arbeitsweise",
    description:
      "Wie Platzhirsch plant, in sieben Schritten: Kennenlernen, Zeit vor Ort, Handzeichnung von Harald Menghin, Raummodell, 3D-Planung, fotorealistisches Rendering, Umsetzung. Mit Link zur Seite und zur Terminanfrage.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { title: "Arbeitsweise", ...READ },
    example: {},
    question: "Wie läuft eine Einrichtungsplanung bei Platzhirsch ab?",
  },
  {
    name: "ezarri_collections",
    title: "Ezarri-Glasmosaik",
    description:
      "Glasmosaik-Kollektionen von Ezarri (für Pool, Bad, Wellness, Küche, Fassade), die Platzhirsch in Lochau berät und bemustert: Linie, Anzahl Mosaike, Formate, Farbfamilien, Oberflächen, Link und Herstellerquelle. Optional nach Linie, Farbfamilie oder einer Kollektion filtern.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", minLength: 2, maxLength: 40, description: "Optional: Kollektion, z. B. 'gea'" },
        linie: { type: "string", enum: ["Premium", "Classic", "Custom"], description: "Optional: Linie" },
        farbe: {
          type: "string",
          enum: ["weiss", "grau", "schwarz", "blau", "gruen", "braun", "gelb", "rot", "rosa"],
          description: "Optional: Farbfamilie",
        },
      },
      additionalProperties: false,
    },
    annotations: { title: "Ezarri-Glasmosaik", ...READ },
    example: { linie: "Premium" },
    question: "Welches Glasmosaik passt in einen Pool?",
  },
  // Rat 9,5 C10 (T2): Mengenrechner und „Board an Termin anhängen“ (planTools.js).
  {
    name: "ezarri_quantities",
    title: "Ezarri-Mengenrechner",
    description:
      "Rechnet für eine Fläche in m² die Menge Ezarri-Glasmosaik aus: Kartons, Blätter, Bestellmenge, Paletten, Kleber und Fuge – mit den Faktoren des Ezarri-Rechners und Verschnitt. Richtwert, kein Angebot, keine Preise; die Bestellmenge prüft das Studio in Lochau.",
    inputSchema: {
      type: "object",
      properties: {
        flaeche_m2: { type: "number", exclusiveMinimum: 0, maximum: 5000, description: "Zu belegende Fläche in m² (Boden, Wände, Treppen zusammen)" },
        format: { type: "string", enum: ["25", "50", "hexa"], description: "Steinformat: 25 mm, 50 mm oder Hexa (Standard 25)" },
        verschnitt_prozent: { type: "number", minimum: 0, maximum: 50, description: "Verschnitt in Prozent (Standard 10)" },
      },
      required: ["flaeche_m2"],
      additionalProperties: false,
    },
    annotations: { title: "Ezarri-Mengenrechner", ...READ },
    example: { flaeche_m2: 48, format: "25" },
    question: "Wie viel Glasmosaik brauche ich für 48 m² Pool?",
  },
  {
    name: "idea_board_appointment_link",
    title: "Ideenboard an Termin anhängen",
    description:
      "Gibt den Link, mit dem die Person ihr geteiltes Platzhirsch-Ideenboard an eine Termin- bzw. Beratungsanfrage anhängt. Eingabe ist die Teilen-ID aus dem Teilen-Link des Boards (/de/ideenboard/<ID>). Es wird nichts gelesen, gebucht oder gespeichert; die Person öffnet den Link und sendet selbst.",
    inputSchema: {
      type: "object",
      properties: {
        share_id: { type: "string", pattern: "^[A-Za-z0-9_-]{32}$", description: "Teilen-ID des Ideenboards (32 Zeichen)" },
        locale: LOCALE,
      },
      required: ["share_id"],
      additionalProperties: false,
    },
    annotations: { title: "Ideenboard an Termin anhängen", ...READ },
    example: null,
    question: "Häng mein Ideenboard an eine Terminanfrage an.",
  },
  {
    name: "request_appointment",
    title: "Terminwunsch übergeben",
    description:
      "Übergibt einen Terminwunsch für eine Beratung an Platzhirsch. Es wird nichts gebucht und nichts bestellt: Die Person erhält eine E-Mail und bestätigt den Wunsch selbst (Double-Opt-in); erst dann sieht das Team die Anfrage und meldet sich mit einem Terminvorschlag. NUR aufrufen, wenn die Person das ausdrücklich möchte und zugestimmt hat, dass Name, E-Mail und Telefon dafür an Platzhirsch gehen (Datenschutz: https://platzhirsch.studio/de/datenschutz). Dann agent_consent: true setzen.",
    inputSchema: {
      type: "object",
      properties: {
        agent_consent: {
          type: "boolean",
          const: true,
          description: "true = die Person hat diesen Terminwunsch ausdrücklich verlangt und der Weitergabe ihrer Angaben zugestimmt",
        },
        first_name: { type: "string", minLength: 1, maxLength: 100 },
        last_name: { type: "string", minLength: 1, maxLength: 100 },
        email: { type: "string", format: "email", maxLength: 254, description: "Hierhin geht die Bestätigungs-E-Mail" },
        phone: { type: "string", minLength: 6, maxLength: 20, description: "Telefon für die Rückmeldung, z. B. +43 664 1234567" },
        topic: { type: "string", minLength: 2, maxLength: 120, description: "Worum es geht, z. B. 'Wohnzimmer neu einrichten'" },
        project_type: { type: "string", enum: ["Neubau", "Renovierung", "Anderes"], description: "Art des Vorhabens" },
        property_type: { type: "string", enum: ["Einfamilienhaus", "Wohnung", "Gewerbe"], description: "Wo das Projekt umgesetzt wird" },
        place: { type: "string", enum: ["showroom", "vor_ort", "offen"], description: "Termin im Showroom in Lochau, bei der Person vor Ort oder offen" },
        preferred_times: {
          type: "array",
          maxItems: 3,
          items: { type: "string", minLength: 2, maxLength: 80 },
          description: "Bis zu 3 Wunschzeiten in eigenen Worten, z. B. 'Sa 14. Nov. vormittags'",
        },
        message: { type: "string", maxLength: 1000, description: "Wünsche, Maße, Produkte (ohne weitere Personendaten)" },
        locale: LOCALE,
      },
      required: ["agent_consent", "first_name", "last_name", "email", "phone", "topic", "property_type"],
      additionalProperties: false,
    },
    annotations: { title: "Terminwunsch übergeben", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    example: null,
    question: "Frag für Samstag einen Beratungstermin für unser Wohnzimmer an.",
  },
]);

/**
 * Freie Zeiten des Online-Kalenders (nur lesend). Bewusst NICHT in
 * ALL_TOOL_DEFS: angeboten nur, solange /termin aktiv ist (der Adapter meldet
 * das über slotsOffered(), jsonrpc.js); WebMCP im Browser registriert es nicht.
 */
export const SLOT_TOOL_DEF = Object.freeze({
  name: "free_appointment_slots",
  title: "Freie Termine",
  description:
    "Freie Uhrzeiten für eine Beratung bei Platzhirsch in den nächsten zwei Wochen (Ortszeit Lochau, Europe/Vienna): im Studio mit Café in Lochau, per Video, bei der Person vor Ort (Anfrage) oder als Planungstermin. Nur lesend: Es wird nichts reserviert oder gebucht, und es werden keine Personendaten übergeben. Die Person wählt die Uhrzeit selbst über booking_url und bestätigt per E-Mail.",
  inputSchema: {
    type: "object",
    properties: {
      art: { type: "string", enum: ["studio", "video", "vor_ort", "planung"], description: "Terminart (Standard studio)" },
      modus: { type: "string", enum: ["studio", "video"], description: "Nur bei planung: im Studio oder per Video" },
      from: { type: "string", pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$", description: "Optional: ab diesem Tag (YYYY-MM-DD), sonst ab heute" },
      limit: { type: "integer", minimum: 1, maximum: 20, description: "Höchstens so viele Zeiten (Standard 12)" },
      locale: LOCALE,
    },
    additionalProperties: false,
  },
  annotations: { title: "Freie Termine", ...READ },
  example: { art: "studio" },
  question: "Wann ist nächste Woche ein Beratungstermin im Showroom frei?",
});

// Terminwunsch nur, wenn er wirklich angenommen wird (Modus dryrun/live; in
// Produktion ohne Live-Freigabe „off“): r1-recht-inhalt P1-1, r1-technik.
// Ausgewertet beim Laden auf dem Server (Seite, mcp.json, tools/list); im
// Browser zählt ohnehin nur READ_TOOL_NAMES (WebMCP).
const RUNTIME_ENV = typeof process !== "undefined" && process.env ? process.env : {};
export const APPOINTMENT_OFFERED = appointmentOffered(appointmentMode(RUNTIME_ENV).mode);

/** Werkzeuge, die dieser Server anbietet (Seite, Server-Beschreibung, tools/list). */
export const TOOL_DEFS = APPOINTMENT_OFFERED
  ? ALL_TOOL_DEFS
  : Object.freeze(ALL_TOOL_DEFS.filter((t) => t.name !== "request_appointment"));

export const TOOL_NAMES = Object.freeze(TOOL_DEFS.map((t) => t.name));
/** Werkzeuge ohne Nebenwirkung (WebMCP registriert nur diese). */
export const READ_TOOL_NAMES = Object.freeze(ALL_TOOL_DEFS.filter((t) => t.annotations.readOnlyHint).map((t) => t.name));

/** tools/list-Form (nur Felder der MCP-Spezifikation). */
export function mcpToolList({ appointment = APPOINTMENT_OFFERED, slots = false } = {}) {
  return [...ALL_TOOL_DEFS.filter((t) => appointment || t.name !== "request_appointment"), ...(slots ? [SLOT_TOOL_DEF] : [])].map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations }));
}

export function toolDef(name) {
  return ALL_TOOL_DEFS.find((t) => t.name === name) || (name === SLOT_TOOL_DEF.name ? SLOT_TOOL_DEF : null);
}
