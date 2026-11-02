// src/lib/einblicke/config.js – Besucher-Einblicke: Schalter, Ausschlussrouten,
// Gerätegrenzen und Limits (Konzept: Marktresearch/digital/features/besucher-einblicke.md).
//
// Rein, ohne React, ohne Pakete und ohne "@/": Client, Server und node --test
// importieren dieselbe Datei.
//
// Schalter NEXT_PUBLIC_EINBLICKE (wörtlich ausgeschrieben, sonst setzt Next.js
// ihn beim Build nicht ein – node_modules/next/dist/docs/01-app/02-guides/
// environment-variables.md):
//   "1"            an (auch im Produktions-Build)
//   "0"            aus (auch im Dev)
//   nicht gesetzt  Dev an, Produktion AUS – bis die Kanzlei die Kopplung an die
//                  Statistik-Einwilligung freigibt (Konzept §8).
// DSE-Sperre (Rat 9,5 B3): Im Produktions-Build wirkt "1" erst, wenn der
// Abschnitt #besucher-einblicke freigegeben ist (src/lib/legal/dseSections.js).
// Sonst bleiben Messung, Banner-Schalter und Texte aus.

import { DSE_SECTIONS, dseApproved } from "../legal/dseSections.js";

export const RAW_FLAG = process.env.NEXT_PUBLIC_EINBLICKE;

/** Regel des Schalters (Parameter, damit Tests jede Umgebung prüfen). */
export function einblickeOn(raw = RAW_FLAG, nodeEnv = process.env.NODE_ENV, sections = DSE_SECTIONS) {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (v === "0") return false;
  if (nodeEnv === "production") return v === "1" && dseApproved("einblicke", sections);
  return true;
}

export const ENDPOINT = "/api/einblicke";
export const SESSION_KEY = "ph_eb";
export const SESSION_MS = 30 * 60 * 1000;

// Gerätegruppe aus der Viewport-Breite (kein User-Agent): m < 768 ≤ t < 1200 ≤ d.
export const DEVICES = { m: "Handy", t: "Tablet", d: "Desktop" };
export const deviceOf = (width) => (width < 768 ? "m" : width < 1200 ? "t" : "d");

// Nie erfasst: Portal, Upload, Zahlung, Vorschauen, Labs-Postausgang, der
// Termin-Testraum und jede Route mit Zugangsschlüssel oder ID im Pfad
// (QA Recht P1-3): geteiltes Ideenboard /ideenboard/[shareId], geteilte
// Wunschliste /wunschliste/[id] (nicht /wunschliste/verwalten – dort steht der
// Schlüssel nur im Fragment). tests/unit/einblicke.test.mjs prüft, dass jeder
// [param]-Ordner unter src/app/[locale] hier oder in routes.js TABLE steht.
// Auf der Seite zusätzlich: alles unter [data-eb-ignore].
// Shop (Nr. 29, Testmodus): Warenkorb, Bestellung und Testartikel nie erfassen (Bestell-Token in der URL).
export const EXCLUDED = /^\/(?:[a-z]{2}\/)?(?:(?:portal|upload|zahlung|shop|preview|termin\/testraum)(?:\/|$)|ideenboard\/[^/]|wunschliste\/(?!verwalten(?:\/|$))[^/])|\/postausgang(?:\/|$)/;
export const routeExcluded = (path) => typeof path !== "string" || !path.startsWith("/") || EXCLUDED.test(path);

// Heatmap-Raster: 40 Spalten über die Viewport-Breite, 40-px-Bänder über die Seite.
export const GRID_COLS = 40;
export const BAND_PX = 40;
export const MAX_BANDS = 1000; // 40 000 px Seite
export const ELEMENT_GRID = 20; // Element-Klicks: 20 × 20 Punkte je Element

// Limits je Seitenaufruf (Browser) und je Paket (Server).
export const LIMITS = /* @__PURE__ */ Object.freeze({
  clicksPerView: 100,
  moveSamplesPerView: 400,
  moveTickMs: 250,
  errorsPerView: 10,
  sectionMsCap: 10 * 60 * 1000,
  flushEvents: 30,
  flushMs: 20_000,
  packetBytes: 16 * 1024,
  eventsPerPacket: 120,
  rageCount: 3,
  rageMs: 700,
  ragePx: 30,
  deadWaitMs: 1000,
});

// Server: Rate-Limits und Aufbewahrung (Rohdaten höchstens 14 Tage, im Code erzwungen).
export const SERVER = /* @__PURE__ */ Object.freeze({
  packetsPerMinute: 120,
  // je sid und Minute (QA Technik P2-2): eine sid belegt nicht das ganze Minutenlimit
  packetsPerSidMinute: 12,
  packetsPerSidDay: 300,
  rawMaxDays: 14,
  // QA Technik P2-2: 50 MB je Tag (echter Verkehr ≈ 1 KB je Seitenaufruf)
  rawFileMaxBytes: 50 * 1024 * 1024,
  maxRoutesPerDay: 500,
  k: 5,
});

/** Aufbewahrung der Rohdaten in Tagen: EINBLICKE_ROH_TAGE, höchstens 14. */
export function rawDays(raw = process.env.EINBLICKE_ROH_TAGE) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return SERVER.rawMaxDays;
  return Math.min(n, SERVER.rawMaxDays);
}

// Ziele (Typen fest) und die GA4-Ereignisse, aus denen sie kommen (analytics.js trackEvent).
export const GOALS = ["termin", "anfrage", "planer", "merkliste", "kontakt"];
export const GOAL_OF_GA = /* @__PURE__ */ Object.freeze({
  book_appointment: "termin",
  generate_lead: "anfrage",
  add_to_wishlist: "merkliste",
  contact_click: "kontakt",
  kuechenplaner_uebergabe: "planer",
  // Lead-Übergabe: „Termin mit diesem Plan“ ist der Hauptknopf im Ergebnis. Ohne
  // Online-Kalender gibt es den zweiten Knopf (kuechenplaner_uebergabe) gar nicht –
  // ohne diese Zeile zählte die Übergabe im Livebetrieb nie.
  kuechenplaner_termin: "planer",
});

// Planer und ihre Schritte (feste Listen – nichts Beliebiges).
export const PLANNERS = /* @__PURE__ */ Object.freeze({
  kuechenplaner: { label: "Küche", steps: ["raum", "form", "fronten", "geraete", "vergleich"] },
  sofaplaner: { label: "Sofa", steps: ["modell", "module", "bezug", "ansicht"] },
  ezarri: { label: "Ezarri", steps: ["kollektion", "farbe", "flaeche", "rechner"] },
  stilfinder: { label: "Stil-Finder", steps: ["1", "2", "3", "4", "5", "6", "7"] },
});
export const PLANNER_ACTIONS = ["start", "schritt", "variante", "uebergabe", "abbruch", "ergebnis"];
export const STYLE_PROFILES_MAX = 5;

// Signaltypen (Select in Frappe „Web Signal“).
export const SIGNAL_TYPES = /* @__PURE__ */ Object.freeze({
  rage: "Rage-Klick",
  dead: "Toter Klick",
  abbruch: "Formularabbruch",
  invalid: "Validierungsfehler",
  error: "Fehler",
  formError: "Formular-Serverfehler",
});

export const SCHEMA_VERSION = 1;
