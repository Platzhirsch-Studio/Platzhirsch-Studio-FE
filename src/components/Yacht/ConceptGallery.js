// Six example concepts, one tab per boat type. Server component: the FIRST
// panel (image, palette, materials) is in the HTML; ConceptTabs loads the
// other panels as a small chunk when their tab is chosen (R5 technik P1-3:
// page weight). Products per zone live in the Werfthalle and the brand shelf.
// Labels: "Beispielkonzept – kein Kundenprojekt" on every concept,
// "Visualisierung (Rendering)" on every image (03.11.2026: only Blender renderings).
import ConceptTabs from "./ConceptTabs";
import { useLocale } from "next-intl";
import { yachtUi } from "@/lib/yacht/ui";
import Concept from "./ConceptPanel";

/**
 * @param {Array} concepts buildConcepts(...)
 */
export default function ConceptGallery({ concepts }) {
  const locale = useLocale();
  const t = yachtUi(locale);
  const tabs = concepts.map((c) => ({ id: c.id, kicker: t.kicker[c.model], title: c.title }));
  return (
    <ConceptTabs tabs={tabs} label={t.conceptsLabel}>
      <Concept c={concepts[0]} />
    </ConceptTabs>
  );
}
