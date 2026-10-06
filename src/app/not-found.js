import "./globals.css";
import { Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import NotFoundContent from "@/components/NotFound/NotFoundContent";
import { detectLocale } from "@/i18n/detectLocale";

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-montserrat",
});

// Global 404 for URLs outside /{locale}/… (e.g. /wp-login.php, /foo.html —
// [locale]/layout.js calls notFound() for an invalid locale segment and sets
// the translated <title>). The root layout only passes children through, so
// this page brings its own <html>/<body>. It renders the same 404 page as
// [locale]/not-found.js in the visitor's language, directly with status 404.
export default async function GlobalNotFound() {
  const locale = await detectLocale();
  const { error404 } = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} dir="ltr" className={montserrat.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={{ error404 }} timeZone="Europe/Vienna">
          <NotFoundContent locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
