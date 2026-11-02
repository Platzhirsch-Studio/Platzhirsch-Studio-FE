// /<locale>/architekten – „Für Architekten und Bauträger“ (Welle 2, Team Architekten).
// DE, EN, FR und IT unter demselben Pfad (FR/IT seit 01.11.2026,
// src/lib/architekten/copy-intl.js). Texte: src/lib/architekten/copy.js,
// Metadaten und JSON-LD: src/lib/architekten/seo.js,
// Seite: src/components/Architekten/ArchitektenPage.js.
import { notFound } from "next/navigation";
import ArchitektenPage from "@/components/Architekten/ArchitektenPage";
import { ANSPRECHPERSON, isArchitektenLocale } from "@/lib/architekten/copy";
import { architektenMetadata, architektenSchema } from "@/lib/architekten/seo";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return architektenMetadata(locale);
}

/** Inhaber-Slot ANSPRECHPERSON → { name, role, email } in der Sprache der Seite, sonst null. */
function contactOf(locale) {
  const p = ANSPRECHPERSON;
  if (!p?.name) return null;
  return { name: p.name, role: p.role?.[locale] || p.role?.de || "", email: p.email || null };
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!isArchitektenLocale(locale)) notFound();
  return <ArchitektenPage locale={locale} contact={contactOf(locale)} schema={architektenSchema(locale)} />;
}
