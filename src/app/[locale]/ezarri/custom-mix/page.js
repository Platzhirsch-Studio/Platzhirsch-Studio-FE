// /de/ezarri/custom-mix – Mischpult „Eigene Mischung“ (Team C, Konzept §7.3).
// Bis zu 4 mischbare Ezarri-Mosaike (90 von 201), Anteile, Fuge, Format, Vorschau
// auf <canvas> (Töne je Mosaik aus tones.json), Teilen per URL
// (?m=37-70.38-30&fu=1&f=50&s=4711&w=1). Mit Query: Hilfsseite (noindex).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import { ezarriLocaleEnabled, withEzarriRobots } from "@/lib/ezarri/config";
import { ezRechnerCopy } from "@/lib/ezarri/lang";
import { decodeCustomMix } from "@/lib/ezarri/rechner/url";
import { getFesteMosaike, getGroutList, getMixPalette, getMixRecipes } from "@/lib/ezarri/rechner/palette.server";
import { PageHead, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import CustomMixApp from "@/components/Ezarri/CustomMix/CustomMixApp";

const PATH = "/ezarri/custom-mix";

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriLocaleEnabled(locale)) return {};
  const { CUSTOM_MIX } = ezRechnerCopy(locale);
  const sp = await searchParams;
  return withEzarriRobots(ezarriMetadata({ locale, path: PATH, title: CUSTOM_MIX.metaTitle, description: CUSTOM_MIX.metaDescription }), {
    utility: Object.keys(sp || {}).length > 0,
  });
}

export default async function CustomMixPage({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { CUSTOM_MIX } = ezRechnerCopy(locale);
  const sp = await searchParams;
  const palette = getMixPalette();
  const rezepte = getMixRecipes();
  const initial = decodeCustomMix(sp);
  // Ohne Mischung in der URL: erste fertige Ezarri-Mischung als Startpunkt
  // (bevorzugt eine blaue Pool-Mischung, das häufigste Einsatzgebiet)
  if (!initial.mix.length && rezepte.length) {
    const farben = new Map(palette.map((p) => [p.id, p.farben]));
    initial.mix = (rezepte.find((r) => r.mix.every((x) => farben.get(x.id)?.includes("blau"))) || rezepte[0]).mix;
  }
  const crumbs = ezCrumbsFor(locale, { label: CUSTOM_MIX.crumb });

  return (
    <>
      <PageHead crumbs={crumbs} eyebrow={CUSTOM_MIX.eyebrow} title={CUSTOM_MIX.title} lead={CUSTOM_MIX.lead} />
      <Container className="pb-section">
        <CustomMixApp palette={palette} rezepte={rezepte} feste={getFesteMosaike()} fugen={getGroutList()} initial={initial} />
      </Container>
    </>
  );
}
