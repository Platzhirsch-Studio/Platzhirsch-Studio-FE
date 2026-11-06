// src/components/Katalog/katalogRoutes.js
// Gemeinsame Routen-Logik der Katalogseiten (je Welt "bad-wellness" und
// "kuechengeraete"):
//   …/produkte/page.js                         → uebersicht*
//   …/produkte/[slug]/page.js                  → produkt*
//   …/marke/[marke]/page.js                    → marke* (Seite 1)
//   …/marke/[marke]/seite/[seite]/page.js      → marke* (Seite ≥ 2)
//   …/kategorie/[kategorie]/page.js            → kategorie* (Seite 1)
//   …/kategorie/[kategorie]/seite/[seite]/page.js → kategorie* (Seite ≥ 2)
// Statisch erzeugt (generateStaticParams mit vollen Params inkl. locale, wie
// ratgeber/[slug]); dynamicParams = false in den Seiten → unbekannte Slugs,
// Marken/Kategorien ohne Produkte und Seiten jenseits der letzten bekommen
// die vorgerenderte 404. Gleicher Pfad in allen vier Sprachen, eigene
// Canonical je Sprache (auch je Seite), hreflang de/en/fr/it + x-default.
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { limitPrerender } from "@/lib/build/prerender";
import { KATALOG_LOCALES, kategorieKey, textOf } from "@/lib/katalog/schema";
import { WELTEN, WELT_IDS, kategoriePath, markePath, produktPath, produktePath, seitePath } from "@/lib/katalog/welten";
import { letzterSatz, produktBeschreibung, weltTitel } from "./katalogMeta";
import { detailBild, leitbild } from "./kachelBild";
// Kaufwort-Seiten der Gerätemarken (02.11.2026): Titel/Description je Marke aus
// markenSeo.js; das Händlerwort im Titel kommt nur aus dem Claim-Guard.
import { dealerTitleWord } from "@/lib/legal/claims";
import { markenSeo, markenSeoTitel } from "@/lib/kueche/markenSeo";
import {
  kategorienMitProdukten,
  markeBySlug,
  markenMitProdukten,
  produktBySlug,
  produkteByKategorie,
  produkteByMarke,
  produkteByWelt,
  seitenAnzahl,
} from "@/lib/katalog";

const SUFFIX = " | Platzhirsch";
const ok = (locale) => KATALOG_LOCALES.includes(locale);
const nf = { robots: { index: false, follow: true } };
const forLocales = (fn) => KATALOG_LOCALES.flatMap((locale) => fn(locale));
// Qualität 01.11.2026: gleiche Marke/Kategorie in mehreren Welten → Weltname in den Titel (katalogMeta.js).
const andereWelten = (welt) => WELT_IDS.filter((w) => w !== welt);
const markeMehrfach = (welt, slug) => andereWelten(welt).some((w) => produkteByMarke(slug, w).length > 0);
const kategorieMehrfach = (welt, kategorie) => andereWelten(welt).some((w) => produkteByKategorie(w, kategorie).length > 0);
const seiteNr = (s) => (s == null ? 1 : /^[2-9]\d*$|^1\d+$/.test(String(s)) ? Number(s) : NaN);

// QM Inhaber-Entscheidung Nr. 6, 02.11.: og:image der Listen = Kachelbild (kachelBild.js:
// Dornbracht-Freisteller statt Farbverlauf), nicht starr bilder[0]. 03.11.: Listen = Kachelbild
// (leitbild), Produktseite = ihr Hero (detailBild: Raumbild > Freisteller > bilder[0]).
function bildMeta(list, locale, wahl = leitbild) {
  const first = list.find((p) => p.bilder.length);
  const bild = first ? wahl(first) : null;
  return bild ? { image: bild.src, imageAlt: textOf(bild.alt, locale) } : {};
}

// ------------------------------------------------------------------ Übersicht
export function uebersichtParams(welt) {
  return produkteByWelt(welt).length ? KATALOG_LOCALES.map((locale) => ({ locale })) : [];
}

export async function uebersichtMetadata(welt, { params }) {
  const { locale } = await params;
  const list = produkteByWelt(welt);
  if (!ok(locale) || !list.length) return nf;
  const t = await getTranslations({ locale, namespace: "katalog" });
  const k = `welt.${WELTEN[welt].key}`;
  return buildPageMetadata({ locale, pathByLocale: produktePath(welt), title: t(`${k}.metaTitle`) + SUFFIX, description: t(`${k}.metaDescription`), ...bildMeta(list, locale) });
}

export async function uebersichtProps(welt, { params }) {
  const { locale } = await params;
  if (!ok(locale) || !produkteByWelt(welt).length) notFound();
  return { locale, welt, modus: "uebersicht" };
}

// ------------------------------------------------------------------ Marke (+ Seiten)
function markeOf(welt, slug) {
  const m = markeBySlug(slug);
  return m && produkteByMarke(slug, welt).length ? m : null;
}

/** @param {boolean} folgeseiten  false = Seite 1 (Basisroute), true = Seiten ≥ 2 */
export function markeParams(welt, folgeseiten = false) {
  return forLocales((locale) =>
    markenMitProdukten(welt).flatMap((m) => {
      if (!folgeseiten) return [{ locale, marke: m.slug }];
      const n = seitenAnzahl(produkteByMarke(m.slug, welt));
      return Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({ locale, marke: m.slug, seite: String(i + 2) }));
    })
  );
}

async function markeAufloesen(welt, params) {
  const { locale, marke: slug, seite: s } = await params;
  const m = markeOf(welt, slug);
  const seite = seiteNr(s);
  if (!ok(locale) || !m || !(seite >= 1) || seite > seitenAnzahl(produkteByMarke(slug, welt))) return null;
  return { locale, m, seite };
}

export async function markeMetadata(welt, { params }) {
  const r = await markeAufloesen(welt, params);
  if (!r) return nf;
  const t = await getTranslations({ locale: r.locale, namespace: "katalog" });
  const seitenText = r.seite > 1 ? ` – ${t("seiten.seite")} ${r.seite}` : "";
  // Gerätemarken mit Kaufwort-Texten (Seite 1 der Welt kuechengeraete): eigener
  // Titel („Quooker kaufen in Vorarlberg – Händler in Lochau“) und Description.
  const seo = welt === "kuechengeraete" && r.seite === 1 ? markenSeo(r.m.slug, r.locale) : null;
  if (seo) {
    return buildPageMetadata({
      locale: r.locale,
      pathByLocale: markePath(welt, r.m.slug),
      title: markenSeoTitel(r.m.slug, r.locale, r.m.dealer ? dealerTitleWord(r.m.slug, r.locale) : "") + SUFFIX,
      description: seo.description,
      ...bildMeta(produkteByMarke(r.m.slug, welt), r.locale),
    });
  }
  return buildPageMetadata({
    locale: r.locale,
    pathByLocale: seitePath(markePath(welt, r.m.slug), r.seite),
    title:
      weltTitel({
        basis: t("marke.title", { marke: r.m.name }),
        name: r.m.name,
        welt: t(`welt.${WELTEN[welt].key}.crumb`),
        seitenText,
        mehrereWelten: markeMehrfach(welt, r.m.slug),
      }) + SUFFIX,
    // Designsystem (sharedNeeds 01.11.2026): Accessoires sind nicht „eingebaut“,
    // und Marken in mehreren Welten (Dornbracht) brauchen je Welt eine eigene
    // Description – beides über metaDescriptionWelt (nur Beratung, kein Einbau).
    description:
      welt === "accessoires" || markeMehrfach(welt, r.m.slug)
        ? t("marke.metaDescriptionWelt", { marke: r.m.name, welt: t(`welt.${WELTEN[welt].key}.crumb`) })
        : t("marke.metaDescription", { marke: r.m.name }),
    ...bildMeta(produkteByMarke(r.m.slug, welt), r.locale),
  });
}

export async function markeProps(welt, { params }) {
  const r = await markeAufloesen(welt, params);
  if (!r) notFound();
  return { locale: r.locale, welt, modus: "marke", marke: r.m, seite: r.seite };
}

// ------------------------------------------------------------------ Kategorie (+ Seiten)
export function kategorieParams(welt, folgeseiten = false) {
  return forLocales((locale) =>
    kategorienMitProdukten(welt).flatMap((kategorie) => {
      if (!folgeseiten) return [{ locale, kategorie }];
      const n = seitenAnzahl(produkteByKategorie(welt, kategorie));
      return Array.from({ length: Math.max(0, n - 1) }, (_, i) => ({ locale, kategorie, seite: String(i + 2) }));
    })
  );
}

async function kategorieAufloesen(welt, params) {
  const { locale, kategorie, seite: s } = await params;
  const list = produkteByKategorie(welt, kategorie);
  const seite = seiteNr(s);
  if (!ok(locale) || !list.length || !(seite >= 1) || seite > seitenAnzahl(list)) return null;
  return { locale, kategorie, seite, list };
}

export async function kategorieMetadata(welt, { params }) {
  const r = await kategorieAufloesen(welt, params);
  if (!r) return nf;
  const t = await getTranslations({ locale: r.locale, namespace: "katalog" });
  const kat = t(`kategorie.${kategorieKey(r.kategorie)}`);
  const seitenText = r.seite > 1 ? ` – ${t("seiten.seite")} ${r.seite}` : "";
  return buildPageMetadata({
    locale: r.locale,
    pathByLocale: seitePath(kategoriePath(welt, r.kategorie), r.seite),
    title:
      weltTitel({
        basis: t("kategorieSeite.title", { kategorie: kat }),
        name: kat,
        welt: t(`welt.${WELTEN[welt].key}.crumb`),
        seitenText,
        mehrereWelten: kategorieMehrfach(welt, r.kategorie),
      }) + SUFFIX,
    description: t("kategorieSeite.lead", { kategorie: kat }),
    ...bildMeta(r.list, r.locale),
  });
}

export async function kategorieProps(welt, { params }) {
  const r = await kategorieAufloesen(welt, params);
  if (!r) notFound();
  return { locale: r.locale, welt, modus: "kategorie", kategorie: r.kategorie, seite: r.seite };
}

// ------------------------------------------------------------------ Produkt
export function produktParams(welt) {
  return limitPrerender(forLocales((locale) => produkteByWelt(welt).map((p) => ({ locale, slug: p.slug }))));
}

function produktOf(welt, slug) {
  const p = produktBySlug(slug);
  return p && p.welt === welt ? p : null;
}

/** Vorhandene, übersetzte Planungssätze je Welt (nur Bad & Wellness / Küchengeräte; Accessoires ohne Zusatz). */
function produktZusatz(welt, t, kat, markeName) {
  const beratung = letzterSatz(t("marke.lead", { marke: markeName }));
  if (welt === "kuechengeraete") return [t("liste.interlude1"), t("liste.interlude3"), beratung];
  if (welt === "bad-wellness") return [letzterSatz(t("kategorieSeite.lead", { kategorie: kat })), beratung];
  return [];
}

export async function produktMetadata(welt, { params }) {
  const { locale, slug } = await params;
  const p = produktOf(welt, slug);
  if (!ok(locale) || !p) return nf;
  const m = markeBySlug(p.marke);
  const t = await getTranslations({ locale, namespace: "katalog" });
  const kat = t(`kategorie.${kategorieKey(p.kategorie)}`);
  return buildPageMetadata({
    locale,
    pathByLocale: produktPath(welt, slug),
    title: `${m.name} ${p.name} – ${kat}${SUFFIX}`,
    // Qualität 01.11.2026: Kurztext < 70 Zeichen → vorhandener Planungssatz der Welt dazu (katalogMeta.js).
    description: produktBeschreibung(textOf(p.kurz, locale), produktZusatz(welt, t, kat, m.name)),
    ...bildMeta([p], locale, detailBild),
  });
}

export async function produktProps(welt, { params }) {
  const { locale, slug } = await params;
  const p = produktOf(welt, slug);
  if (!ok(locale) || !p) notFound();
  return { locale, p, marke: markeBySlug(p.marke) };
}
