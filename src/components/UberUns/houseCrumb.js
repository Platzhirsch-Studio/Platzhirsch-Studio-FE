// src/components/UberUns/houseCrumb.js
// QM wm-r4: one trail for all pages of the "Das Haus" menu column. Team
// showed „Startseite / Das Haus / Team“ (menu, Runde 2 seo), Presse, Partner,
// Karriere and Platzhirsch „Startseite / Über uns / …“. All now use the menu
// label; it links to the about page (the column's "all" link), except on the
// about page itself.
import { MENU_SECTION } from "@/lib/seo/breadcrumbs";
import { ROUTES } from "@/utils/routing";

/** Middle crumb „Das Haus“ (localised); `link: false` on the about page. */
export function houseCrumb(locale = "de", { link = true } = {}) {
  const label = MENU_SECTION.house[locale] || MENU_SECTION.house.de;
  return link ? { label, href: ROUTES.platzhirsch[locale] || ROUTES.platzhirsch.de } : { label };
}
