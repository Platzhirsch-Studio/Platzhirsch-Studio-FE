// /[locale]/ideenboard – persönliche Pinnwand (Inhaber-Entscheidung Nr. 14).
// noindex, nofollow: der Inhalt liegt im Browser der Besucherin und ist für
// Suchmaschinen leer. Server: nur Rahmen, Texte und das Termin-Ziel; das Board
// selbst ist die Insel IdeenboardPage (localStorage).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import IdeenboardPage from "@/components/Pinterest/IdeenboardPage";
import { bookingConfig } from "@/components/Booking/config";
import { ideenboardShareAvailable, ideenboardTerminConnected } from "@/lib/ideenboard/mode";
import { getPinCopy } from "@/lib/pinterest/copyServer";
import { routing } from "@/i18n/config";
import { ROUTES } from "@/utils/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = (await getPinCopy(locale)).ideenboard;
  return {
    title: t.meta.title,
    description: t.meta.description,
    robots: { index: false, follow: false },
  };
}

/** Termin-Ziel: eigener Kalender (/termin), sonst die Beratungsanfrage. */
function terminPathFor(locale, config = bookingConfig()) {
  if (config.provider === "frappe") return config.path;
  return ROUTES.beratung[locale] || ROUTES.beratung.de;
}

export default async function Page({ params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);
  const copy = await getPinCopy(locale);
  return <IdeenboardPage copy={copy} locale={locale} terminPath={terminPathFor(locale)} terminConnected={ideenboardTerminConnected()} shareAvailable={ideenboardShareAvailable()} />;
}
