import { useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PHONE_DISPLAY } from "@/lib/site";
import { errorKey } from "@/lib/forms/errorKey";
import { formatFormText } from "@/lib/forms/formatText";

// R5-leads-perf: plain messages skip the ICU compile (src/lib/forms/formatText.js).

/**
 * Form texts (error codes, field messages, stepper, privacy note) from the
 * messages, namespace `forms` (src/messages/*.json). `{phone}` is always filled.
 * R4-leads: the fallback to the text tables in src/lib/forms/i18n.js is
 * removed – R4-i18n reported forms.* (R2 + R3 keys) as complete in all four
 * languages (messages-r2-leads.json / messages-r3-inhalt.json "_uebernommen"),
 * tests/unit/r4-leads.test.mjs keeps checking that every key exists.
 * The tables stay in i18n.js only as the documented contract for the tests.
 * Works in server and client components (next-intl hooks, no async).
 * Error texts are formatted only when an error is shown (errorText is a
 * function, nothing is pre-computed during render).
 * @returns {{ text: (key: string, vars?: object) => string, errorText: (code: string) => string, locale: string }}
 */
export default function useFormText() {
  const locale = useLocale();
  const t = useTranslations("forms");
  const text = useCallback((key, vars) => formatFormText(t, key, vars, PHONE_DISPLAY), [t]);
  const errorText = useCallback((code) => text(errorKey(code)), [text]);
  return { text, errorText, locale };
}

/**
 * Same lookup without hooks, for server components that already know the
 * locale and have a `forms` translator. `locale` is kept for the old call
 * signature.
 */
export function formCopy(locale, t, key, vars) {
  return formatFormText(t, key, vars, PHONE_DISPLAY);
}
