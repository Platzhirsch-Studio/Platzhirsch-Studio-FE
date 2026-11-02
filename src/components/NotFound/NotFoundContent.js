import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/utils/routing";
import { Monogram } from "@/components/Brand";

// The 404 page body, shared by src/app/[locale]/not-found.js (unknown paths
// under a locale) and src/app/not-found.js (everything else, e.g. /wp-login.php),
// so both look identical and speak the visitor's language. Plain next/link
// and absolute /{locale}/… paths.
// Tempo & A11y (Konsolidierung): Server Components only. The root not-found
// (src/app/not-found.js) is the boundary of the root layout, so Next puts its
// tree into the RSC payload of EVERY page – and with it the client chunk of
// whatever it renders (before: NotFoundLocales + this body + next-intl
// provider, ≈ 8 KB gzip on every page, measured in platzhirsch-prodtest).
// Now the body is pure markup: NotFoundBody takes the `error404` texts as a
// plain object (the global 404 has no request locale), NotFoundContent reads
// them with next-intl for the locale pages; NotFoundLocales only picks the
// block.
//
// New design: light surface, one primary action, three quiet way-outs.
// Runde 2 (seo/recht): no manufacturer photo any more (the former
// minotti-sofas.webp has no documented release) – a typographic panel with the
// monogram instead.
// All texts come from `error404` in src/messages (the Runde-1 FALLBACK for the
// changed keys is gone since R3: the keys are in all four message files).
const QUIET_LINK =
  "group inline-flex min-h-11 items-center gap-2 text-ui text-text underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current";

const KEYS = ["eyebrow", "headline", "description", "backHome", "linksTitle", "browseProducts", "browseBrands", "contact"];

/** Localized 404 body inside the locale layout (texts via next-intl). */
export default function NotFoundContent({ locale }) {
  const t = useTranslations("error404");
  return <NotFoundBody locale={locale} m={Object.fromEntries(KEYS.map((k) => [k, t(k)]))} />;
}

/** The 404 body; `m` = the `error404` texts of `locale`. */
export function NotFoundBody({ locale, m }) {
  const t = (key) => m?.[key] ?? "";

  const links = [
    { href: `/${locale}${ROUTES.produkte[locale] || ROUTES.produkte.de}`, label: t("browseProducts") },
    { href: `/${locale}${ROUTES.marken[locale] || ROUTES.marken.de}`, label: t("browseBrands") },
    { href: `/${locale}${ROUTES.kontakt[locale] || ROUTES.kontakt.de}`, label: t("contact") },
  ];

  return (
    <div className="bg-surface pb-section pt-10 text-text md:pt-14 lg:pt-20">
      <div className="mx-auto grid w-full max-w-page grid-cols-1 gap-y-12 gap-x-grid px-gutter lg:grid-cols-12 lg:items-center">
        {/* QM r2: starts on column 1 like logo, breadcrumbs and every H1 (the
            xl:col-start-2 indent at x = 189 px had no grid reason). */}
        <div className="lg:col-span-6">
          <p className="mb-stack-s text-overline uppercase text-text-accent">{t("eyebrow")}</p>
          {/* The headline is the H1 ("404" alone says nothing to search
              engines or screen readers). */}
          <h1 className="font-display text-display-l text-text">{t("headline")}</h1>
          <p className="mt-stack-m max-w-measure text-lead text-text-soft">{t("description")}</p>
          {/* Straight to this locale's homepage; a bare "/" would always land on German. */}
          <div className="mt-stack-m">
            <Link
              href={`/${locale}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-action px-6 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover lg:min-h-13 lg:px-7"
            >
              <span>{t("backHome")}</span>
              <ArrowRight aria-hidden="true" className="ph-arrow size-4 shrink-0" strokeWidth={1.5} />
            </Link>
          </div>
          {/* Dead ends lose visitors (and crawl equity): offer the main sections. */}
          <nav aria-label={t("linksTitle")} className="mt-10 border-t border-line pt-6">
            <p className="text-overline uppercase text-text-soft">{t("linksTitle")}</p>
            <ul className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-8">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={QUIET_LINK}>
                    <span>{link.label}</span>
                    <ArrowRight aria-hidden="true" className="ph-arrow size-4 shrink-0" strokeWidth={1.5} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div aria-hidden="true" className="relative hidden aspect-[4/5] items-center justify-center overflow-hidden bg-linen text-ink lg:col-span-5 lg:col-start-8 lg:flex" data-notfound-panel="">
          <Monogram size={160} decorative />
          <span className="absolute bottom-10 left-10 right-10 border-t border-line-strong pt-4 font-display text-display-m text-text-soft">404</span>
        </div>
      </div>
    </div>
  );
}
