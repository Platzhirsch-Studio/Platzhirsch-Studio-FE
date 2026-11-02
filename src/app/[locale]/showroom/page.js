// /[locale]/showroom – „Das Haus, jederzeit offen“: der Showroom Lochau als
// begehbarer Gaussian Splat mit klickbaren Ausstellungsstücken (Neuland N1).
// Doku: Marktresearch/digital/features/neuland.md §2 und §8.
//
// Modus (src/lib/showroom/config.js):
//   public   echte, freigegebene Aufnahme → indexierbar, JSON-LD, Sitemap
//   preview  Entwicklung bzw. SHOWROOM_PREVIEW=1 → noindex; ohne Aufnahme
//            die synthetische Testszene (deutlich gekennzeichnet)
//   off      Produktion ohne Aufnahme → 404, kein Platzhalter live
// Gleicher Pfad in allen vier Sprachen. Noch nicht im Menü (Integration).
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";
import ShowroomPage from "@/components/Showroom/ShowroomPage";
import { HOTSPOTS, MANIFEST, SHOWROOM_PATH, manifestReady, showroomMode, showroomRobots } from "@/lib/showroom/config";
import { SHOWROOM_LOCALES } from "@/lib/showroom/copy";
import { pageCopy } from "@/components/Showroom/honestCopy";
import { buildTour } from "@/lib/showroom/data";
import TESTSZENE from "@/lib/showroom/testszene.json" with { type: "json" };
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

/** Welche Daten zeigt die Seite in diesem Modus? null = keine (404). */
function tourFor(locale, mode) {
  if (mode === "off") return null;
  if (mode === "public" || manifestReady().ok) return buildTour({ data: HOTSPOTS, manifest: MANIFEST, locale });
  if (MANIFEST.testszene) return buildTour({ data: TESTSZENE, manifest: MANIFEST, locale, test: true });
  return null;
}

// R5 (r5-technik P2-2): "off" (production without recording) and unknown
// locales are a REAL 404. notFound() while the page is prerendered stored the
// empty <html id="__next_error__"> shell with s-maxage=3600 (404 cached for an
// hour). connection() first stops the prerender, so the 404 is rendered per
// request: src/app/not-found.js (lang, h1, noindex), Cache-Control no-store.
// Same pattern as ratgeber/page.js. Called from generateMetadata already –
// a notFound() only in the page body still streamed the empty shell.
async function notFoundPerRequest() {
  await connection();
  notFound();
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const mode = showroomMode();
  if (!SHOWROOM_LOCALES.includes(locale) || mode === "off") await notFoundPerRequest();
  const tour = tourFor(locale, mode);
  if (!tour || tour.stations.length === 0) await notFoundPerRequest();
  // R8: ohne echte Aufnahme kein „Rundgang“ im Title (Seite bleibt noindex)
  const t = pageCopy(locale, tour?.test);
  const meta = buildPageMetadata({
    locale,
    pathByLocale: SHOWROOM_PATH,
    title: t.meta.title,
    description: t.meta.description,
    image: tour?.poster?.webp || undefined,
    imageAlt: t.videoTitel,
  });
  return { ...meta, robots: showroomRobots(mode) };
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!SHOWROOM_LOCALES.includes(locale)) await notFoundPerRequest();
  setRequestLocale(locale);
  const mode = showroomMode();
  const tour = tourFor(locale, mode);
  if (!tour || tour.stations.length === 0) await notFoundPerRequest();
  return <ShowroomPage locale={locale} tour={tour} mode={mode} aufnahmeDatum={MANIFEST.aufnahme?.datum} />;
}
