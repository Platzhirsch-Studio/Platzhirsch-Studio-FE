import { notFound } from "next/navigation";
import { bereich as bereichDaten } from "@/lib/backoffice/bereiche/index";
import BereichStart from "@/components/Backoffice/BereichStart";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { bereich } = await params;
  return { title: bereichDaten(bereich)?.titel || "Bereich" };
}

/**
 * Generische Bereichs-Startseite für /crm, /sortiment, … Statische Ordner
 * (src/app/<bereich>/page.js der Fachbereiche) gewinnen gegen diese Route.
 * /kassa ist der POS-Arbeitsplatz (Kiosk); die Kassa-Verwaltung liegt unter /kassa/verwaltung.
 */
export default async function BereichSeite({ params }) {
  const { bereich } = await params;
  const b = bereichDaten(bereich);
  if (!b || b.slug === "zentrale" || b.slug === "kassa") notFound();
  return <BereichStart slug={b.slug} pfad={`/${b.slug}`} />;
}
