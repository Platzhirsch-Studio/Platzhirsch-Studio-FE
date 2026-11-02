// Sofaplaner – rules for the "Ausführung" options (QM Sofaplaner R1 P2-3).
// Pure functions, used by LookPanel and the unit tests.
import { KINDS } from "./normalize.js";

// Back options: the basic back (fixed back, no back, reclining …) is ONE choice;
// headrests, back cushions and other optional parts come on top.
const ADDON = /optional|auf anfrage|^plus\b|^(kopfstütze|kopfstuetze|rückenkissen|rueckenkissen|lendenkissen|nackenrolle|zierkissen)/i;
export function isAddon(o) {
  return ADDON.test(o.label) || ADDON.test(o.labelEn || "");
}

const STOP = new Set(["small", "large", "klein", "groß", "gross", "und", "oder", "mit", "für", "fuer", "the", "and", "with", "nur", "cm", "bei"]);

/** "(Chaise round small/large, circle)" → scope tokens; null when the option names no elements. */
export function scopeOf(label) {
  const m = String(label).match(/\(([^()]+)\)\s*$/);
  if (!m) return null;
  const text = m[1].trim();
  const tokens = text
    .split(/,|\/|;|\bund\b|\boder\b/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      const mod = t.match(/sitzmodul\s*(\d+)/i);
      if (mod) return { module: Number(mod[1]) };
      const words = t
        .toLowerCase()
        .split(/[^a-zäöüß0-9-]+/)
        .filter((w) => w.length >= 3 && !STOP.has(w));
      return words.length ? { words } : null;
    })
    .filter(Boolean);
  return tokens.length ? { text, tokens } : null;
}

const elText = (e) => `${e.label} ${e.labelEn || ""} ${e.art || ""} ${KINDS[e.kind]?.label || ""}`.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u");
const norm = (w) => w.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/e$/, "");

function matches(el, token) {
  if (token.module != null) return el.module === token.module;
  const t = elText(el);
  return token.words.every((w) => t.includes(norm(w)));
}

/**
 * Availability of a scoped option for the current plan.
 * → { scope: text|null, available: true|false|null } – null = cannot be decided
 * from the data (no family element matches the scope), then nothing is greyed out.
 */
export function availability(option, familyElements, planElements) {
  const sc = scopeOf(option.label);
  if (!sc) return { scope: null, available: null };
  const inFamily = familyElements.filter((e) => sc.tokens.some((t) => matches(e, t)));
  if (!inFamily.length) return { scope: sc.text, available: null };
  const codes = new Set(inFamily.map((e) => e.code));
  return { scope: sc.text, available: planElements.some((e) => e && codes.has(e.code)) };
}

/** Split back options into one exclusive choice and optional add-ons. */
export function backGroups(options) {
  const base = options.filter((o) => !isAddon(o));
  const addons = options.filter((o) => isAddon(o));
  return { base, addons };
}
