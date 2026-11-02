import { getTranslations } from "next-intl/server";

// Portal and upload are German only: EN/FR/IT answer 404 (layout/page call
// notFound()). Their static metadata would still put the German portal title
// ("Übersicht | Mein Platzhirsch") on that English 404 page – misleading for
// screen readers (WCAG 2.4.2, R5 QM P2-2). So every portal page exports
// `generateMetadata = portalMetadata({...})`: DE gets the given metadata,
// any other locale the same translated 404 title as the rest of the site
// (cf. [locale]/[slug]/page.js).
const NOINDEX = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };

export async function notFoundMetadata(locale) {
  const t = await getTranslations({ locale, namespace: "error404" });
  return {
    title: { absolute: `${t("headline")} | Platzhirsch Home Living` },
    description: t("description"),
    robots: NOINDEX,
    // Upload-URLs tragen das Token: auch die 404 gibt es nicht weiter.
    referrer: "no-referrer",
  };
}

/** @param {import("next").Metadata} meta DE metadata of the page/layout */
export function portalMetadata(meta) {
  return async function generateMetadata({ params }) {
    const { locale } = await params;
    return locale === "de" ? meta : notFoundMetadata(locale);
  };
}
