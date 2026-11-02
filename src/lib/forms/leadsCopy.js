// src/lib/forms/leadsCopy.js
// Texts of R4-leads (Merkliste → Showroom, Termin-Link) live in
// src/messages/{de,en,fr,it}.json under `cart.selection.*` and `booking.*`
// (merged by R5-i18n from Marktresearch/digital/teamleiter/messages-r4-leads.json).
// Readers prefer the messages (t.has); this table is only a thin safety net
// (R6-leads): German only, so a missing key never shows a bare key. Other
// locales fall back to it as well. tests/unit/r4-leads.test.mjs checks that
// the 4 messages files carry every key and that DE here equals messages/de.
// No "@/..." imports: tested with `node --test`.

export const LEADS_TEXT = {
  de: {
    cart: {
      selection: {
        showroom: "Diese Auswahl im Showroom ansehen",
        showroomNote: "Vereinbaren Sie einen Besuch in Lochau. Ihre Auswahl steht schon im Formular.",
      },
    },
    booking: {
      title: "Termin online wählen",
      text: "Sie können einen freien Termin auch direkt im Kalender auswählen.",
      cta: "Kalender öffnen",
      note: "Öffnet {host} in einem neuen Fenster. Dort gelten die Datenschutzhinweise des Anbieters.",
    },
  },
  en: {},
  fr: {},
  it: {},
};

const lookup = (obj, key) => key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);

/** Text for a full key ("cart.selection.showroom"), DE as fallback, {vars} filled. */
export function leadsText(locale, key, vars = {}) {
  const raw = lookup(LEADS_TEXT[locale], key) ?? lookup(LEADS_TEXT.de, key);
  if (typeof raw !== "string") return key;
  return raw.replace(/\{(\w+)\}/g, (m, name) => (vars[name] != null ? String(vars[name]) : m));
}

/** Messages first (root translator `t`), then this table. */
export function leadsCopy(t, locale, key, vars) {
  try {
    if (t && typeof t.has === "function" && t.has(key)) return t(key, vars);
  } catch {
    /* fall through */
  }
  return leadsText(locale, key, vars);
}

/**
 * ?produkt= value for the consultation form from Merkliste items
 * ("Marke Name, Marke Name …"), at most 10 pieces and 400 characters.
 */
export function selectionLabel(items, { max = 10, maxLength = 400 } = {}) {
  const names = (Array.isArray(items) ? items : [])
    .map((item) => [item?.category, item?.name].filter(Boolean).join(" ").trim())
    .filter(Boolean);
  const unique = [...new Set(names)];
  let label = unique.slice(0, max).join(", ");
  if (unique.length > max) label += ", …";
  return label.length > maxLength ? `${label.slice(0, maxLength - 1).trimEnd()}…` : label;
}
