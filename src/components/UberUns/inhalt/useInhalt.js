import "server-only";
import { useLocale, useTranslations } from "next-intl";

// Copy for the content pages (Über uns, Team, Partner, Presse, News, Karriere,
// Rechtliches, Newsletter, Beratung, 404) lives in the message namespace
// "inhalt" of src/messages/*.json.
//
// Round 5 (R5-i18n): the last module fallback (inhalt.job.*,
// inhalt.share.*) is gone; all its keys are in the four message files since
// round 4. t() and raw() read the messages only. A missing key renders as an
// empty string (as before), tests/unit/r3-inhalt.test.mjs keeps every key the
// pages read covered in all four locales.
//
// Server components only (sync, no "use client"): pass the strings to client
// islands as props.

/**
 * @param {string} section e.g. "about", "team", "common"
 * @returns {{ t: (key: string, values?: object) => string, raw: (key: string) => any, locale: string }}
 */
export default function useInhalt(section) {
  const locale = useLocale();
  const messages = useTranslations();

  const t = (key, values) => {
    const full = `inhalt.${section}.${key}`;
    if (!messages.has(full)) return "";
    // Templates such as "{shown} von {total}" are filled in by client
    // islands; without values ICU formatting would fail, so hand them over raw.
    if (!values) {
      const text = messages.raw(full);
      if (typeof text === "string" && text.includes("{")) return text;
    }
    return messages(full, values);
  };

  const raw = (key) => {
    const full = `inhalt.${section}.${key}`;
    return messages.has(full) ? messages.raw(full) : undefined;
  };

  return { t, raw, locale };
}
