// /{locale}/ueber-uns/karriere/share-image (public: /en/about-us/career/share-image,
// /fr/a-propos/carriere/share-image, /it/chi-siamo/carriera/share-image via the
// next-intl pathnames in src/proxy.js): PNG share image of the career pages
// (r4-seo P2-7, src/components/Karriere/shareImage.js). Built once per locale
// at build time; any other first segment 404s.
import { notFound } from "next/navigation";
import { routing } from "@/i18n/config";
import { renderShareImage } from "@/components/Karriere/shareImage";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(request, { params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  return renderShareImage(locale);
}
