// src/components/Katalog/planerLink.js
// Zweitaktion auf der Produktdetailseite der Welt "kuechengeraete":
// „In meine Küchenplanung aufnehmen“ → /de/kuechenplaner?geraet=<produkt-slug>.
// Der Planer liest ?geraet=<slug> (geraetParam, src/lib/kuechenplaner/geraete.js)
// und setzt das Gerät in den ersten passenden Steckplatz.
//
// Sichtbar nur für Produkte, die der Planer auch anbietet: Welt
// "kuechengeraete" und Kategorie aus GERAETE_KATEGORIEN (dieselbe Regel wie
// buildGeraeteIndex). Alles andere (z. B. Kaffeevollautomat, Zubehör) bekäme im
// Planer keinen Steckplatz – dort kein Link.
//
// Planer nur Deutsch: Link immer auf /de, außerhalb von DE mit Sprachhinweis
// und hreflang="de" (wie PlanerLink in KuechengeraetePage.js). Texte aus
// geraeteText() (Messages kuechengeraete.*, sonst geraeteCopy.js), kein
// Händlerwort. Rein, ohne "@/"-Importe (node --test, tests/unit/katalog-planer-link.test.mjs).
import { planerHref } from "../../lib/kueche/geraete.js";
import { GERAETE_KATEGORIEN } from "../../lib/kuechenplaner/geraete.js";
import { geraeteText } from "../Kuechengeraete/geraeteCopy.js";

/** Bietet der Küchenplaner dieses Katalogprodukt an? */
export function imPlanerVerfuegbar(p) {
  return Boolean(p?.slug) && p.welt === "kuechengeraete" && GERAETE_KATEGORIEN.includes(p.kategorie);
}

/**
 * Daten des Planer-Links für ein Produkt, sonst null.
 * @param {object} p Katalogprodukt (slug, welt, kategorie)
 * @param {string} locale
 * @param {Function} [t] next-intl-Übersetzer (optional; sonst geraeteCopy.js)
 * @returns {{href: string, locale: "de", hrefLang: string|undefined, label: string, hinweis: string} | null}
 */
export function planerLinkFuer(p, locale, t) {
  if (!imPlanerVerfuegbar(p)) return null;
  const de = locale === "de";
  return {
    href: planerHref(p.slug),
    locale: "de",
    hrefLang: de ? undefined : "de",
    label: geraeteText(locale, "planerCta", t),
    hinweis: de ? "" : ` (${geraeteText(locale, "german", t)})`,
  };
}
