import { useLocale, useTranslations } from "next-intl";
import cx from "./cx";
import SmartLink from "./SmartLink";
import JsonLd from "@/components/Reusable/JsonLd";
import { breadcrumbSchemaItems, normalizeHomeCrumb } from "@/lib/seo/breadcrumbs";
import { menuTrail } from "./menuTrail";

const SITE = "https://platzhirsch.studio";

// Until the "Recht & Texte" integration adds ui.breadcrumbs to
// src/messages/*.json (proposal: Marktresearch/digital/redesign/messages-fundament.json).
const FALLBACK = { de: "Sie sind hier", en: "You are here", fr: "Vous êtes ici", it: "Ti trovi qui" };

/**
 * Breadcrumb trail. The last item is the current page (aria-current, no link).
 * The home step (href "/") always reads "Startseite"/"Home"/"Accueil"/"Home"
 * (lib/seo/breadcrumbs.js), whatever generic "Home" a caller passes.
 * JSON-LD: Google needs an `item` URL on every step except the last, so a
 * middle step without a page of its own (e.g. "Über uns") is shown but left
 * out of the BreadcrumbList (R4-seo finding 3).
 * Works in server and client components (next-intl hooks, no async).
 * @param {Array<{label: string, href?: string}>} items  href = path WITHOUT locale ("/produkte")
 * @param {boolean} [schema=false] also emit BreadcrumbList JSON-LD – only if the
 *   page does not already render one (avoid duplicates)
 * @param {"light"|"dark"} [tone="light"]
 */
export default function Breadcrumbs({ items: rawItems = [], schema = false, tone = "light", className }) {
  const locale = useLocale();
  const shell = useTranslations("Shell");
  const nav = (key, fallback) => (shell.has(`nav.${key}`) ? shell(`nav.${key}`) : fallback);
  // F5 (Runde 1): pages of the menu section "Planen & Erleben" get the same
  // trail and wording as the menu (menuTrail.js), in the visible trail and in
  // the JSON-LD below.
  const items = menuTrail(
    rawItems.map((item) => (item?.href === "/" ? { ...item, label: normalizeHomeCrumb(item.label, locale) } : item)),
    locale,
    nav
  );
  const t = useTranslations("ui");
  const label = t.has("breadcrumbs") ? t("breadcrumbs") : FALLBACK[locale] || FALLBACK.de;
  const soft = tone === "dark" ? "text-text-inverse-soft" : "text-text-soft";
  const strong = tone === "dark" ? "text-text-inverse" : "text-text";

  const ld = schema
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbSchemaItems(items, `${SITE}/${locale}`),
      }
    : null;

  return (
    <nav aria-label={label} className={className}>
      <ol className={cx("flex flex-wrap items-center gap-x-2 text-small", soft)}>
        {items.map((item, i) => {
          const current = i === items.length - 1;
          return (
            <li key={`${item.href ?? ""}-${i}`} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="opacity-60">
                  /
                </span>
              )}
              {item.href && !current ? (
                <SmartLink
                  href={item.href}
                  className="inline-flex min-h-6 items-center underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                >
                  {item.label}
                </SmartLink>
              ) : (
                <span aria-current={current ? "page" : undefined} className={current ? strong : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {ld && <JsonLd data={ld} />}
    </nav>
  );
}
