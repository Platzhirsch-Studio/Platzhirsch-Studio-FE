// Shared by the brand story page (client) and the collection pages (server):
// collection titles + the localized URL of one collection page.
import { generateSlug } from "@/lib/slugify";
import { ROUTES } from "@/utils/routing";

// The collections API only returns the collection's docname ("alonpi-heritage"),
// so turn it into a display title ("Alonpi Heritage").
export const formatCollectionName = (name) =>
  String(name || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());

// /ueber-uns/marken/<brand>/<collection> (and the en/fr/it equivalents).
// Without the /{locale} prefix — Link from @/i18n/navigation adds that.
export const collectionPath = (locale, brandName, collectionName) =>
  `${ROUTES.marken[locale] || ROUTES.marken.de}/${generateSlug(brandName)}/${generateSlug(collectionName)}`;
