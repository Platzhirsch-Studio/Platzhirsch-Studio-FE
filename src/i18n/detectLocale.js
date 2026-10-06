import "server-only";
import { cookies, headers } from "next/headers";
import { routing } from "@/i18n/config";

// The visitor's language for responses outside /{locale}/… (the global 404):
// the NEXT_LOCALE cookie the middleware sets on every localized visit, else
// the browser's Accept-Language, else German.
export async function detectLocale() {
  const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  if (routing.locales.includes(cookieLocale)) return cookieLocale;

  const acceptLanguage = (await headers()).get("accept-language") || "";
  const preferred = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .find(({ lang }) => routing.locales.includes(lang));
  return preferred?.lang || routing.defaultLocale;
}

// "<headline> | Platzhirsch Home Living" for the 404 page in that language.
export async function notFoundTitle(locale) {
  const { error404 } = (await import(`@/messages/${locale}.json`)).default;
  return `${error404.headline} | Platzhirsch Home Living`;
}
