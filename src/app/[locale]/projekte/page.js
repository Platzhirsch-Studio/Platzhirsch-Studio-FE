// /de/projekte – Referenzprojekte (R5-content, Masterplan AP7, Bericht 12 C3).
// German only (other locales 404). noindex until a project is released AND
// the owner decides to index it; deliberately NOT linked, NOT in sitemap or
// llms.txt (those registries are not touched by this package).
// Runde 3 P5 (gesamtwerk P2, recht P2): no public empty state any more. While
// src/lib/content/projekte.js has no released entry the page answers with a
// 308 (Runde 4 P5, vorher 307) to /de/arbeitsweise (the hand-drawn design process, Kern-USP
// Nr. 8) – temporary, because the URL comes back with the first released
// project. No CTA, not in sitemap, llms.txt or navigation.
// Docs: Marktresearch/digital/teamleiter/r5-R5-content.md
import { notFound, permanentRedirect } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import ProjekteUebersicht from "@/components/Projects/ProjekteUebersicht";
import { veroeffentlichteReferenzen } from "@/lib/portal/tagebuch/service";
import Uebersicht from "./_tagebuch/Uebersicht";
import { listFreigegebeneProjekte, PROJEKTE_PATH } from "@/lib/content/projekte";
import { SITE_URL, SITE_NAME, ogLocale } from "@/lib/seo/pageMetadata";
import { routing } from "@/i18n/config";
import { notFoundTitle } from "@/i18n/detectLocale";

const TITLE = "Projekte";
const DESCRIPTION =
  "Eingerichtete Häuser und Wohnungen am Bodensee, gezeigt mit Zustimmung der Bauherren. Platzhirsch Home Living, Showroom in Lochau.";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (locale !== "de") {
    return {
      title: await notFoundTitle(routing.locales.includes(locale) ? locale : routing.defaultLocale),
      robots: { index: false, follow: true },
    };
  }
  const url = `${SITE_URL}${PROJEKTE_PATH}`;
  return {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: TITLE, description: DESCRIPTION, siteName: SITE_NAME, locale: ogLocale("de") },
  };
}

export default async function ProjektePage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  setRequestLocale(locale);
  // Projekt-Tagebuch (29.10.2026): Referenzen, die Bauherren im Portal freigegeben
  // und das Studio geprüft hat, erscheinen hier automatisch. Deshalb wird die
  // Seite je Anfrage gerendert (connection()); ein Widerruf wirkt sofort.
  await connection();
  const statisch = listFreigegebeneProjekte();
  const referenzen = await veroeffentlichteReferenzen();
  const projekte = [...referenzen, ...statisch];
  // Runde 4 P5 (seo P2-6): permanentRedirect() = HTTP 308 (docs
  // functions/permanentRedirect.md) – a 307 kept the old URL in the index.
  // When the first project is released, this branch is skipped and the page
  // renders again (browsers may have cached the 308; acceptable for a noindex
  // page that is not linked anywhere).
  if (projekte.length === 0) permanentRedirect("/de/arbeitsweise");
  return referenzen.length ? <Uebersicht projekte={projekte} /> : <ProjekteUebersicht projekte={statisch} />;
}
