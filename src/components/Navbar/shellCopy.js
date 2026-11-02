// Texts of the site shell (header, menus, footer, mobile CTA bar).
//
// Single source: namespace `Shell` in src/messages/{de,en,fr,it}.json
// (R4-i18n, round 4). The former fallback table SHELL_COPY (a full copy of
// those messages in all four languages) is removed; tests/unit/r4-i18n.test.mjs
// checks that every `c("…")` key used by the shell exists in all four locales.
// No "use client": the hook works in Server and Client Components alike.

import { useTranslations } from "next-intl";

// Language names in their own language (no flags, §10.1).
export const LANGUAGES = [
  { code: "de", name: "Deutsch" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
];

/**
 * Translator for the shell: `c("header.termin")`, `c("footer.copyright", { year })`.
 * Reads `Shell.<key>` from the loaded messages (no fallback table).
 */
export function useShellCopy() {
  const t = useTranslations("Shell");
  return (key, values) => t(key, values);
}
