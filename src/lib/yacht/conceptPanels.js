// Daten der Konzept-Reiter 2–6 für ConceptTabs (Browser, per import() erst bei
// Bedarf geladen – R5 technik P1-3). Gleiche Quelle wie die Seite
// (concepts.json + renders.json, buildConcepts), ohne Live-Katalog: Die
// Panels zeigen keine Produkte. Superyacht entfällt wie auf der Seite.
import concepts from "./concepts.json";
import renders from "./renders.json";
import { buildConcepts } from "./model";
import { localizeConcepts } from "./concepts-en";

export const PANEL_CONCEPTS = buildConcepts(concepts, renders).filter((c) => c.model !== "superyacht");

/** Panels in the page language (Welle 2: /en/yacht-interior). */
export function panelConcepts(locale = "de") {
  return localizeConcepts(PANEL_CONCEPTS, locale);
}
