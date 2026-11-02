// src/components/Katalog/KatalogMarkenLink.js
// Link „Produkte ansehen“ (Bad & Wellness) bzw. „Sortiment ansehen“
// (Küchengeräte) für eine Markenkarte. Rendert nichts, solange die Marke im
// Katalog (src/lib/katalog/marken/<marke>.js) keine Produkte hat – so kann
// jedes Daten-Team seine Marke füllen, ohne die Weltseite anzufassen.
import { useTranslations } from "next-intl";
import { LinkArrow } from "@/components/ui";
import { markeBySlug, produkteByMarke } from "@/lib/katalog";
import { markePath } from "@/lib/katalog/welten";

/**
 * @param {{marke: string, welt: "bad-wellness"|"kuechengeraete", className?: string}} props
 */
export default function KatalogMarkenLink({ marke, welt, className }) {
  const t = useTranslations("katalog");
  const m = markeBySlug(marke);
  if (!m || !produkteByMarke(marke, welt).length) return null;
  return (
    <LinkArrow href={markePath(welt, marke)} className={className} data-kat-marke-link={marke}>
      {t(welt === "kuechengeraete" ? "links.sortimentAnsehen" : "links.produkteAnsehen")}
      <span className="sr-only">: {m.name}</span>
    </LinkArrow>
  );
}
