// /de/preview/pinterest — Vorschau „Pinterest-Kanal“ (Inhaber-Entscheidung
// Nr. 14, 29.10.2026): Konzept und Startpaket zeigen, nichts veröffentlichen.
// Profil-Mockup, Boards, Beispiel-Pins (public/preview/pinterest/), Serie
// „Von der Skizze zum Raum“, Redaktionsplan, Checkliste für den Inhaber.
// Sichtbar in Entwicklung bzw. mit FREIGABE_PREVIEW=1 im Produktions-Build
// (nie bei VERCEL_ENV=production), sonst 404. Nur Deutsch (en/fr/it 404).
// Immer noindex,nofollow; nicht in Sitemap, llms.txt oder Navigation.
// Kein Pinterest-Skript, keine Verbindung zu Pinterest.
// Konzept: Marktresearch/digital/marketing/pinterest/00-konzept.md
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { COCKPIT_ROBOTS, freigabePreviewEnabled } from "@/components/Freigaben/model";
import Vorschau from "@/components/Preview/pinterest/Vorschau";

export const metadata = {
  title: "Pinterest-Kanal – Vorschau",
  description: "Interne Vorschau: Konzept und Startpaket für den Pinterest-Kanal von Platzhirsch.",
  robots: COCKPIT_ROBOTS,
};

export default async function PinterestVorschauPage({ params }) {
  const { locale } = await params;
  // Request time: the switch is read from the running server's environment.
  await connection();
  if (locale !== "de" || !freigabePreviewEnabled()) notFound();
  return <Vorschau />;
}
