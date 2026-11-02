// src/components/ui/menuTrail.js — Brotkrumen wie im Menü (F5-shell-technik-release,
// Runde 1, Auftrag 6).
//
// Das Menü führt die Arbeitsweise, Interior Design, Yacht und alle Werkzeuge
// unter „Planen & Erleben" (/leistungen, shellNav.js). Einzelne Seiten setzten
// eigene Brotkrumen („Das Haus / Arbeitsweise", „Startseite / Bodensee-Licht"),
// die nicht zum Menü passten. Breadcrumbs.js reicht jede Spur durch
// menuTrail(): Auf Deutsch wird eine bekannte Menüseite zu
//   Startseite / Planen & Erleben / <Menütext>
// Andere Spuren (Produkte, Marken, Das Haus …) bleiben unverändert.
//
// Rein, ohne React: node --test prüft die Regel (tests/unit/f5-shell-technik.test.mjs).
import { FEATURES } from "../../lib/features.js";

/** Section of the menu (shellNav.js, id "services"). */
export const PLAN_SECTION = { key: "plan", fallback: "Planen & Erleben", href: "/leistungen" };

// Seiten der Rubrik ohne Feature-Eintrag: Menütext aus Shell.nav.<key>.
const PLAN_PAGES = [
  { match: ["Arbeitsweise", "Unsere Arbeitsweise", "So arbeiten wir"], key: "process", fallback: "Unsere Arbeitsweise" },
  { match: ["Interior Design", "Interior Design Vorarlberg"], key: "interior", fallback: "Interior Design" },
  { match: ["Yacht Interior", "Yacht-Interior", "Yacht-Interieur"], key: "yacht", fallback: "Yacht-Interior" },
  { match: ["Showroom-Rundgang"], key: "showroom", fallback: "Showroom-Rundgang" },
  { match: ["KI-Assistenten", "Für KI-Assistenten"], key: "agent", fallback: "Für KI-Assistenten" },
];

const norm = (s) => String(s ?? "").toLowerCase().replace(/[\s -]+/g, " ").trim();

/**
 * Menu entry for the label of the current page, or null.
 * @returns {{key?: string, label?: string, fallback?: string}|null}
 */
export function planEntryFor(label) {
  const n = norm(label);
  if (!n) return null;
  const page = PLAN_PAGES.find((p) => p.match.some((m) => norm(m) === n));
  if (page) return page;
  const f = FEATURES.find((x) => x.id !== "yacht" && x.id !== "showroom" && (norm(x.title) === n || norm(x.nav) === n));
  // Outdoor sits in the room "Outdoor & Pool", Ezarri in its own world: not here.
  if (!f || f.id === "outdoor" || f.id === "ezarri") return null;
  return { label: f.nav };
}

/**
 * @param {Array<{label: string, href?: string}>} items  trail as passed by the page
 * @param {string} locale
 * @param {(key: string, fallback: string) => string} [nav]  Shell.nav translator
 */
export function menuTrail(items, locale, nav = (_k, fb) => fb) {
  if (locale !== "de" || !Array.isArray(items) || items.length < 2 || items.length > 3) return items;
  if (items[0]?.href !== "/") return items;
  const last = items[items.length - 1];
  if (last?.href) return items;
  const entry = planEntryFor(last.label);
  if (!entry) return items;
  const label = entry.label || nav(entry.key, entry.fallback);
  return [items[0], { label: nav(PLAN_SECTION.key, PLAN_SECTION.fallback), href: PLAN_SECTION.href }, { ...last, label }];
}
