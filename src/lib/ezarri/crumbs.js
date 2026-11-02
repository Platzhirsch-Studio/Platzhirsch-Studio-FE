// src/lib/ezarri/crumbs.js – Brotkrumen der Ezarri-Welt (rein, node --test lädt es).
//
// Startseite › Outdoor & Pool › Ezarri Glasmosaik › …
// „Outdoor & Pool“ ist die Menügruppe (src/components/Navbar/shellNav.js). Bis
// Runde 4 ohne Link – im BreadcrumbList-JSON-LD fehlte damit `item` mitten in
// der Liste (ungültig laut Google, seo P1-3). Jetzt hat die Stufe eine URL:
// die Outdoor-Seite der Gruppe (/outdoor-gartenplanung, im Menü unter
// „Planen“ derselben Gruppe) – sichtbar verlinkt. Im JSON-LD steht sie nur,
// solange diese Seite indexierbar ist (EZ_MENU_GROUP.inSchema): heute ist sie
// noindex bis zur Rechtsprüfung, und eine Brotkrumen-URL soll laut
// r4-seo P1-3 eine echte, indexierbare Seite sein. Dann lässt das JSON-LD die
// Gruppe weg (Startseite › Ezarri Glasmosaik › …) – gültig, jede Stufe vor
// der letzten hat `item`. Wird die Outdoor-Seite index, inSchema auf true.

/** Menügruppe „Outdoor & Pool“ mit ihrer Seite. */
export const EZ_MENU_GROUP = Object.freeze({ label: "Outdoor & Pool", href: "/outdoor-gartenplanung", inSchema: false });

/** Brotkrumen-Text des Hubs (= Menütext Shell.nav.ezarri, HUB.crumb in copy.js). */
export const EZ_HUB_CRUMB = Object.freeze({ label: "Ezarri Glasmosaik", href: "/ezarri" });

/** Startseite / Outdoor & Pool / Ezarri Glasmosaik / …rest (href ohne Locale). */
export function ezCrumbs(...rest) {
  return [{ label: "Startseite", href: "/" }, EZ_MENU_GROUP, EZ_HUB_CRUMB, ...rest];
}

/** Englischer Hub-Eintrag (= Shell.nav.ezarri in en.json). */
export const EZ_HUB_CRUMB_EN = Object.freeze({ label: "Ezarri glass mosaic", href: "/ezarri" });
/** Französischer und italienischer Hub-Eintrag (= HUB.crumb in copy.fr.js / copy.it.js). */
export const EZ_HUB_CRUMB_FR = Object.freeze({ label: "Mosaïque de verre Ezarri", href: "/ezarri" });
export const EZ_HUB_CRUMB_IT = Object.freeze({ label: "Mosaico di vetro Ezarri", href: "/ezarri" });

/**
 * Brotkrumen in der Sprache der Seite. Englisch: Home / Ezarri glass mosaic / …
 * – ohne die Menügruppe, denn ihre Seite (/outdoor-gartenplanung) gibt es nur
 * auf Deutsch (eine Brotkrume soll nicht in eine andere Sprache führen).
 */
export function ezCrumbsFor(locale, ...rest) {
  if (locale === "en") return [{ label: "Home", href: "/" }, EZ_HUB_CRUMB_EN, ...rest];
  // 01.11.2026: fr/it wie Englisch ohne die (rein deutsche) Menügruppe.
  if (locale === "fr") return [{ label: "Accueil", href: "/" }, EZ_HUB_CRUMB_FR, ...rest];
  if (locale === "it") return [{ label: "Home", href: "/" }, EZ_HUB_CRUMB_IT, ...rest];
  return ezCrumbs(...rest);
}

/**
 * BreadcrumbList aus Brotkrumen [{label, href}] (href ohne Locale, "/" = Startseite).
 * Jede Stufe außer der letzten MUSS eine URL haben; eine fehlende wird gemeldet
 * (Fehler), statt ein ungültiges JSON-LD auszugeben. Die letzte Stufe (die Seite
 * selbst) bekommt `item`, wenn `pageHref` bzw. ihr href bekannt ist.
 */
export function ezBreadcrumbList(items, { siteUrl = "https://platzhirsch.studio", locale = "de", pageHref } = {}) {
  const url = (href) => `${siteUrl}/${locale}${href === "/" ? "" : href}`;
  const list = (items || []).filter((i) => i && i.inSchema !== false);
  return {
    "@type": "BreadcrumbList",
    itemListElement: list.map((i, index) => {
      const last = index === list.length - 1;
      const href = i.href || (last ? pageHref : undefined);
      if (!href && !last) throw new Error(`Brotkrume ohne URL: ${i.label}`);
      return { "@type": "ListItem", position: index + 1, name: i.label, ...(href ? { item: url(href) } : {}) };
    }),
  };
}
