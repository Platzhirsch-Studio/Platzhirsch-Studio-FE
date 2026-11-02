// src/lib/content/landingKern/og.js – Share-Karten (opengraph-image.js) der
// Kern-Landingpages in EN/FR/IT. Eigenes, schlankes Modul ohne die
// Redirect-Liste (deOnlyRedirects.cjs), damit die Bild-Route nur Texte lädt.
import { frenchTypography } from "../../hotel/content-intl.js";
import { META as KUECHE } from "./kueche.js";
import { META as INTERIOR } from "./interior.js";
import { META as WOHNZIMMER } from "./wohnzimmer.js";
import { META as OUTDOOR } from "./outdoor.js";
import { META as OUTDOOR_KUECHE } from "./outdoorKueche.js";
import { META as WHIRLPOOL } from "./whirlpool.js";
import { META as SWIMSPA } from "./swimspa.js";
import { META as SAUNA } from "./sauna.js";
import { SHARED_INTL } from "./shared.js";

const META = {
  "/kuechen-vorarlberg": KUECHE,
  "/interior-design-vorarlberg": INTERIOR,
  "/wohnzimmer-einrichten-vorarlberg": WOHNZIMMER,
  "/outdoor-gartenplanung": OUTDOOR,
  "/outdoor-kueche": OUTDOOR_KUECHE,
  // Kaufwörter-Seiten Bad & Wellness (02.11.2026).
  "/whirlpool-kaufen": WHIRLPOOL,
  "/swim-spa": SWIMSPA,
  "/sauna-kaufen": SAUNA,
};

/** {eyebrow, title, footer} der Karte in `locale` (EN/FR/IT), sonst null. */
export function kernOgCard(path, locale) {
  const meta = META[path]?.[locale];
  const shared = SHARED_INTL[locale];
  if (!meta?.og || !shared) return null;
  const card = { eyebrow: meta.og.eyebrow, title: meta.og.title, footer: shared.ogFooter };
  return locale === "fr" ? frenchTypography(card) : card;
}
