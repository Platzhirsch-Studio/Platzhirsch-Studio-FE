// /de/preview/freigaben — Freigabe-Cockpit (R6-uebergabe).
// Shows, read-only, what still needs a release (Ratgeber, Produkttexte,
// Hero-Fotos, Rechtsentwürfe, Gutschein/Atelier, Schweiz-Hub) and where the
// release is set in the code. No form, no write function, no fetch.
// Visible in development or with FREIGABE_PREVIEW=1 in a production build
// (never on VERCEL_ENV=production), otherwise 404. German only (en/fr/it 404).
// Always noindex,nofollow; not in sitemap, llms.txt or navigation.
// Documentation: Marktresearch/digital/uebergabe/00-uebergabe.md
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Cockpit from "@/components/Freigaben/Cockpit";
import { loadCockpit } from "@/components/Freigaben/data.server";
import { COCKPIT_ROBOTS, freigabePreviewEnabled } from "@/components/Freigaben/model";

export const metadata = {
  title: "Freigabe-Cockpit – Vorschau",
  robots: COCKPIT_ROBOTS,
};

export default async function FreigabenPage({ params }) {
  const { locale } = await params;
  // Request time: the switch is read from the running server's environment.
  await connection();
  if (locale !== "de" || !freigabePreviewEnabled()) notFound();
  return <Cockpit data={loadCockpit()} />;
}
