"use client";
import { useLocale } from "next-intl";
import { localeOf, wlText } from "@/lib/wunschliste/copy";

// Texte im Browser: die Tabelle src/lib/wunschliste/copy.js (alle vier
// Sprachen, gleich wie der Namespace "wunschliste" in src/messages – Test
// tests/unit/wunschliste.test.mjs). Der Namespace bleibt aus der Client-Kopie
// (src/components/Reusable/clientMessages.js, Budget ≤ 35 KB); Server-Seiten
// lesen ihn über getTranslations + wlCopyFrom.
export default function useWlCopy() {
  const locale = localeOf(useLocale());
  return { locale, c: (key, vars) => wlText(locale, key, vars) };
}
