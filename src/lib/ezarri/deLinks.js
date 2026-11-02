// src/lib/ezarri/deLinks.js – Links der Ezarri-Welt auf rein deutsche Seiten.
//
// Crawl 01.11.2026 (ezarri-yacht, link-to-redirect): /en/ezarri… verlinkte
// /en/kuechen-vorarlberg, /en/outdoor-gartenplanung, /en/bodensee-licht … –
// jede Adresse antwortete mit einer Weiterleitung auf /de/…?lang=en
// (src/lib/seo/deOnlyRedirects.cjs). Wie YachtPage (outdoorLink) zeigt der
// Link jetzt direkt auf die deutsche Seite: next-intl-Link mit locale "de"
// und hrefLang="de". Die Liste kommt aus deOnlyRedirects.cjs (eine Quelle).
//
// Rein: keine "@/"-Aliase, node --test lädt es.
import deOnly from "../seo/deOnlyRedirects.cjs";
import { ezarriLocaleEnabled, ezarriWeltLocaleEnabled } from "./config.js";
import { toolLocaleEnabled } from "./konfigurator/intl.js";

const { DE_ONLY_EXACT, DE_ONLY_TREE } = deOnly;
const EXACT = new Set(DE_ONLY_EXACT.concat(DE_ONLY_TREE));
const TREE = new Set(DE_ONLY_TREE);

/** true, wenn href (ohne Locale, z. B. "/bodensee-licht?szene=pool") nur auf Deutsch existiert. */
export function isDeOnlyHref(href) {
  if (typeof href !== "string" || !href.startsWith("/")) return false;
  const segs = href.split(/[?#]/)[0].split("/").filter(Boolean);
  if (!segs.length) return false;
  return segs.length === 1 ? EXACT.has(segs[0]) : TREE.has(segs[0]);
}

/** Zusatz-Props für <Link>/<LinkArrow>: auf Nicht-DE-Seiten direkt auf /de/… zeigen. */
export function deLinkProps(locale, href) {
  return locale !== "de" && isDeOnlyHref(href) ? { locale: "de", hrefLang: "de" } : {};
}

// Werkzeuge der Ezarri-Welt und ihre Sprachen: Konfigurator und Rechner über
// konfigurator/intl.js (TOOL_LOCALES, 01.11.2026: de, en, fr, it), Custom Mix
// und Anfrage über EZARRI_LOCALES (de, en).
const EZ_TOOLS = new RegExp("^/ezarri/(konfigurator|rechner|custom-mix|anfrage)(?=[/?#]|$)");
const toolHasLocale = (href, locale) => {
  const tool = EZ_TOOLS.exec(href)?.[1];
  return tool === "konfigurator" || tool === "rechner" ? toolLocaleEnabled(locale) && ezarriWeltLocaleEnabled(locale) : ezarriLocaleEnabled(locale);
};

/** true, wenn href ein Ezarri-Werkzeug ist (Konfigurator, Rechner, Custom Mix, Anfrage). */
export function isEzarriToolHref(href) {
  return typeof href === "string" && EZ_TOOLS.test(href);
}

/**
 * Link-Props der Ezarri-Welt (01.11.2026, fr/it): Werkzeuge ohne eigene
 * Sprachfassung → englische Fassung (wie Hotel & Objekt „lang: en“), rein
 * deutsche Seiten → /de (deLinkProps). Sobald ein Werkzeug die Sprache in
 * EZARRI_LOCALES führt, bleibt der Link automatisch in der Seitensprache.
 */
export function ezLinkProps(locale, href) {
  if (locale !== "de" && isEzarriToolHref(href) && !toolHasLocale(href, locale)) return { locale: "en", hrefLang: "en" };
  return deLinkProps(locale, href);
}
