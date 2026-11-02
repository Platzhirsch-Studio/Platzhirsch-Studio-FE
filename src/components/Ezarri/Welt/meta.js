// Metadaten der Ezarri-Welt (Konzept §6.1/§6.3). Server-only im Gebrauch, aber
// rein (keine Hooks). Jede Seite ruft ezarriMetadata() in generateMetadata auf:
//   - robots über withEzarriRobots() (Schalter EZARRI_PUBLIC)
//   - canonical ohne Query (außer ?seite=n auf sich selbst)
//   - hreflang: Welt-Seiten de + en + fr + it (01.11.2026, EZARRI_WELT_LOCALES),
//     Werkzeug-Pfade nur EZARRI_LOCALES (de, en), dazu x-default → deutsche URL.
//     Keine Verweise auf 404-Locales (Lehre aus Commit 6de7c13).
//   - Title ≤ 60, Description ≤ 150 Zeichen (fitTitle/clampDescription, Rat 9,5 A15).
//   - og:image = Ezarri-Material (Nutzung laut Inhaber-Entscheidung Nr. 7 erlaubt).
import { withEzarriRobots, EZARRI_LOCALES, EZARRI_WELT_LOCALES } from "@/lib/ezarri/config";
import { SITE_NAME, clampDescription, deOnlyLanguages, fitTitle, localeUrl, ogLocale } from "@/lib/seo/pageMetadata";
import { ezLang } from "@/lib/ezarri/werte";

/** Freigegebenes Ezarri-Material (Entscheidung Nr. 7), 1600 × 1067. */
export const EZARRI_OG_FALLBACK = "/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1";

/**
 * hreflang nur für aktive Ezarri-Sprachen (Wrapper statt hreflangLanguages).
 * Welt-Seiten: EZARRI_WELT_LOCALES (01.11.2026: de, en, fr, it); Werkzeuge
 * (Konfigurator, Rechner, Custom Mix, Anfrage) übergeben EZARRI_LOCALES.
 */
export function ezarriLanguages(path, locales = EZARRI_WELT_LOCALES) {
  if (!locales.includes("de")) return {};
  const out = {};
  for (const l of ["de", "en", "fr", "it"]) if (locales.includes(l)) out[l] = localeUrl(l, path);
  out["x-default"] = deOnlyLanguages(path)["x-default"];
  return out;
}

/** Werkzeug-Pfade der Ezarri-Welt: hreflang nur auf EZARRI_LOCALES (de, en). */
const TOOL_PATH = new RegExp("^/ezarri/(konfigurator|rechner|custom-mix|anfrage)(/|$)");

/**
 * @param {{locale?:string, path:string, title:string, description:string, image?:string, imageAlt?:string,
 *          utility?:boolean, canonicalPath?:string, seite?:number}} o
 *   locale = Sprache der Seite (canonical und og:locale je Sprache).
 *   path = Pfad ohne Locale ("/ezarri/mosaike"); canonicalPath = abweichendes canonical
 *   (Safe/Corner/Cove → Basis-Mosaik); seite > 1 → canonical mit ?seite=n.
 */
export function ezarriMetadata({ locale = "de", path, title, description, image, imageAlt, utility = false, canonicalPath, seite }) {
  const lang = ezLang(locale);
  const own = canonicalPath || path;
  const url = localeUrl(lang, own) + (seite > 1 && !canonicalPath ? `?seite=${seite}` : "");
  // R2 seo P1-8: ohne eigenes Bild das freigegebene Ezarri-Poolbild des Hubs statt aboutHome.jpg (Herkunft unbelegt)
  const ogImage = `${image || EZARRI_OG_FALLBACK}-1600.webp`;
  // Rat 9,5 A15: Titel ≤ 60 mit Suffix (fällt zuerst weg), Description ≤ 150 als ganzer Satz.
  const fullTitle = fitTitle(`${title} | Platzhirsch`);
  description = clampDescription(description);
  return withEzarriRobots(
    {
      title: fullTitle,
      description,
      alternates: { canonical: url, languages: ezarriLanguages(own, TOOL_PATH.test(own) ? EZARRI_LOCALES : EZARRI_WELT_LOCALES) },
      openGraph: {
        type: "website",
        url,
        title: fullTitle,
        description,
        siteName: SITE_NAME,
        locale: ogLocale(lang),
        images: [{ url: ogImage, alt: imageAlt || title }],
      },
      twitter: { card: "summary_large_image", title: fullTitle, description, images: [ogImage] },
    },
    { utility }
  );
}
