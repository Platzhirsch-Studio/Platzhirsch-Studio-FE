"use client";
// Sofaplaner: T() for the current page locale (next-intl), see
// src/lib/sofaplaner/copy/t.js. Welle 2, team EN-Yacht-Sofa.
import { useMemo } from "react";
import { useLocale } from "next-intl";
import { makeT } from "../../../lib/sofaplaner/copy/t.js";

export function useT() {
  const locale = useLocale();
  return useMemo(() => makeT(locale), [locale]);
}
