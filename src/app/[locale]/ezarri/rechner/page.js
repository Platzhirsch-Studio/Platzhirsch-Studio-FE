// /de/ezarri/rechner – Mosaik-Rechner (Team C, Konzept §7.3).
// Formeln: src/lib/ezarri/rechner/flaechen.js + core.js (Prüfwert Ezarri: 106 m²,
// 265 kg Kleber, 127 kg Fuge). Zustand in der URL (Kurzschlüssel, url.js); ?k=
// übernimmt das Becken aus dem Konfigurator (Team B), ?m= eine Mischung aus Custom Mix.
// Mit Query: Hilfsseite (noindex, follow bei EZARRI_PUBLIC) – canonical ohne Query.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import JsonLd from "@/components/Reusable/JsonLd";
import { withEzarriRobots } from "@/lib/ezarri/config";
import { localeUrl } from "@/lib/seo/pageMetadata";
import { IN_LANGUAGE } from "@/lib/seo/structuredData";
import { ezRechnerCopy } from "@/lib/ezarri/lang";
import { rechnerEn } from "@/lib/ezarri/rechner/en";
// 01.11.2026: DE/EN/FR/IT. FR/IT-Texte nur vom Server (copy-intl.js → ToolCopyProvider).
import { toolLang, toolLocaleEnabled } from "@/lib/ezarri/konfigurator/intl";
import { rechnerCopy, toolCopy } from "@/lib/ezarri/konfigurator/copy-intl";
import { toolCrumbs, toolMetadata } from "@/lib/ezarri/konfigurator/seo";
import { ToolCopyProvider } from "@/components/Ezarri/Konfigurator/ToolCopy";
import { decodeRechner, fromKonfigurator } from "@/lib/ezarri/rechner/url";
import { getMixItems } from "@/lib/ezarri/rechner/palette.server";
import { PageHead } from "@/components/Ezarri/Welt/parts";
import RechnerApp from "@/components/Ezarri/Rechner/RechnerApp";

const PATH = "/ezarri/rechner";
const hasQuery = (sp) => Object.keys(sp || {}).length > 0;

/** Rechner-Texte je Sprache: fr/it aus rechner.fr/it.js, sonst copy.js/copy.en.js. */
const rechnerTexte = (locale) => rechnerCopy(locale) || { ...ezRechnerCopy(locale), uebersetze: toolLang(locale) === "en" ? rechnerEn : (s) => s };

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  if (!toolLocaleEnabled(locale)) return {};
  const { RECHNER } = rechnerTexte(locale);
  const sp = await searchParams;
  return withEzarriRobots(toolMetadata({ locale, path: PATH, title: RECHNER.metaTitle, description: RECHNER.metaDescription }), { utility: hasQuery(sp) });
}

export default async function RechnerPage({ params, searchParams }) {
  const { locale } = await params;
  if (!toolLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const lang = toolLang(locale);
  const { RECHNER, uebersetze } = rechnerTexte(locale);
  const intl = toolCopy(locale);
  const sp = await searchParams;
  const hinweise = [];
  let { eingabe, mix } = decodeRechner(sp);
  const k = typeof sp?.k === "string" ? fromKonfigurator(sp.k) : null;
  if (k) {
    eingabe = { ...k.eingabe, ...eingabe };
    if (!mix.length) mix = k.mix;
    hinweise.push(RECHNER.uebernahme.konfigurator);
    if (k.hinweis) hinweise.push(uebersetze(k.hinweis));
  }
  const items = getMixItems(mix.map((x) => x.id));
  const known = new Set(items.map((x) => x.id));
  mix = mix.filter((x) => known.has(x.id));
  if (mix.length && !k) hinweise.push(RECHNER.uebernahme.mix);
  const mixNamen = Object.fromEntries(items.map((x) => [x.id, { name: x.name, serie: x.serie }]));

  const crumbs = toolCrumbs(locale, RECHNER.crumb);
  const app = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: RECHNER.metaTitle,
    url: localeUrl(lang, PATH),
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    inLanguage: lang === "en" ? "en-GB" : IN_LANGUAGE[lang],
    description: RECHNER.metaDescription,
  };

  return (
    <>
      <PageHead crumbs={crumbs} eyebrow={RECHNER.eyebrow} title={RECHNER.title} lead={RECHNER.lead} />
      <JsonLd data={app} />
      <Container className="pb-section">
        <ToolCopyProvider value={intl ? { lang: intl.lang, RECHNER: intl.RECHNER, TABELLE: intl.TABELLE, KONF: { UI: intl.KONF.UI, UI_TPL: intl.KONF.UI_TPL } } : null}>
          <RechnerApp initialEingabe={eingabe} initialMix={mix} mixNamen={mixNamen} hinweise={hinweise} />
        </ToolCopyProvider>
      </Container>
    </>
  );
}
