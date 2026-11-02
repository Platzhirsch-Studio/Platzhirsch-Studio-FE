// Fallstudien-Slot Yacht (Rat 9,5 C7). Rendert NICHTS ohne freigegebenen
// Eintrag (src/lib/yacht/references.js) – kein Leerzustand, kein Platzhalter.
// Gleiche Darstellung wie der Referenz-Slot von Hotel & Objekt.
// Texte: Vorschlag in Marktresearch/digital/features/rat95-t3-messages.json (yacht.references).
import HotelReferences from "@/components/Hotel/HotelReferences";
import { visibleYachtReferences } from "@/lib/yacht/references";

const TEXT = {
  de: { eyebrow: "Fallstudien", heading: "Projekte an Bord", text: "Boote und Bootshäuser, die wir eingerichtet haben – mit Freigabe der Eigner." },
  en: { eyebrow: "Case studies", heading: "Projects on board", text: "Boats and boathouses we have furnished – published with the owners’ consent." },
  fr: { eyebrow: "Études de cas", heading: "Projets à bord", text: "Bateaux et hangars à bateaux que nous avons aménagés – publiés avec l’accord des propriétaires." },
  it: { eyebrow: "Casi studio", heading: "Progetti a bordo", text: "Barche e rimesse che abbiamo arredato – pubblicati con il consenso degli armatori." },
};

export default function YachtReferences({ locale = "de" }) {
  const items = visibleYachtReferences(locale);
  if (!items.length) return null;
  return <HotelReferences data={TEXT[locale] || TEXT.de} items={items} locale={locale} />;
}
