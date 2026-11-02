"use client";

// Stil-Finder – Texte der aktuellen Sprache für die Client-Komponenten
// (Mehrsprachigkeit 01.11.2026). Der Server (page.js / layout.js) gibt genau
// eine Sprache mit (stilfinderClientCopy), nichts davon liegt in den
// next-intl-Messages. useStilCopy() liefert UI-Texte sowie Fragen und Profile
// mit dem Text-Overlay der Sprache.
import { createContext, useContext, useMemo } from "react";
import { PROFILES } from "./profiles";
import { QUESTIONS } from "./questions";
import { localizeOptions, localizeProfiles, localizeQuestions } from "./localize";
import { PROJECT_TYPES, REGIONS } from "@/lib/stilfinder/options";

const Ctx = createContext(null);

export function StilCopyProvider({ copy, children }) {
  return <Ctx.Provider value={copy}>{children}</Ctx.Provider>;
}

/** { locale, t, profiles, questions, projectTypes, regions } – t = UI-Texte der Sprache. */
export function useStilCopy() {
  const copy = useContext(Ctx);
  return useMemo(() => {
    if (!copy) throw new Error("Stil-Finder: StilCopyProvider fehlt");
    return {
      locale: copy.locale,
      t: copy.ui,
      profiles: localizeProfiles(PROFILES, copy.profiles),
      questions: localizeQuestions(QUESTIONS, copy.questions),
      projectTypes: localizeOptions(PROJECT_TYPES, copy.options?.projectTypes),
      regions: localizeOptions(REGIONS, copy.options?.regions),
    };
  }, [copy]);
}
