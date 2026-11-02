// /de/ki-assistenten – „Platzhirsch für KI-Assistenten“ (N3): MCP-Server, WebMCP,
// Werkzeuge, Vorführung, Terminwunsch mit Double-Opt-in.
// Nur Deutsch (wie /de/arbeitsweise); andere Sprachen 404, bis die Texte aus
// src/lib/agent/copy.js über src/messages/*.json übersetzt sind. Die
// Werkzeuge selbst liefern Links in allen vier Sprachen (Parameter locale).
// Noch nicht im Menü (Integrationsteam). Doku: Marktresearch/digital/features/neuland.md §4.
import { notFound } from "next/navigation";
import AgentPage from "@/components/Agent/AgentPage";
import { META } from "@/lib/agent/copy";
import { deOnlyMetadata } from "@/lib/seo/pageMetadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") return {};
  // Runde 2 (recht P2-1, seo P2-3/P2-4): ein Builder für deutsche Seiten –
  // Description ≤ 165, hreflang de + x-default, typografische Share-Karte.
  return deOnlyMetadata({ path: "/ki-assistenten", title: META.title, description: META.description, ogTitle: META.ogTitle });
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  return <AgentPage />;
}
