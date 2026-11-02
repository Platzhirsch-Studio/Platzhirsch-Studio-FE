// /de/ezarri/konfigurator – 3D-Konfigurator „Becken“ (Team B, Konzept §4).
// Server: liest ?k= (geteilter Entwurf), ?m= (Konfigurator-ID oder Referenz-ID aus
// der Mosaik-Detailseite), ?ref= (Referenz-ID), ?szene=; liefert den Teilkatalog
// für den ersten Render (≈ 3 KB gzip). three/R3F laden erst im Browser (Stage3D).
// robots über withEzarriRobots (Schalter EZARRI_PUBLIC); mit ?k= immer noindex.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container, Eyebrow, Heading, Breadcrumbs } from "@/components/ui";
import { ezarriCredit } from "@/lib/ezarri/config";
import { ezCopy } from "@/lib/ezarri/lang";
import { graph } from "@/components/Ezarri/Welt/schema";
// 01.11.2026: DE/EN/FR/IT. FR/IT-Texte nur vom Server (copy-intl.js → ToolCopyProvider).
import { toolLocaleEnabled } from "@/lib/ezarri/konfigurator/intl";
import { konfCopy, toolCopy } from "@/lib/ezarri/konfigurator/copy-intl";
import { toolCrumbs, toolCrumbsSchema, toolMetadata } from "@/lib/ezarri/konfigurator/seo";
import { ToolCopyProvider } from "@/components/Ezarri/Konfigurator/ToolCopy";
import JsonLd from "@/components/Reusable/JsonLd";
import { DEFAULT_STATE, decodeState, sanitizeState, SZENEN, withSzene } from "@/lib/ezarri/konfigurator/state";
import { getKonfiguratorKatalog, isKnownMosaic, katalogFuer } from "@/lib/ezarri/konfigurator/katalog";
import HandBridge from "@/components/Reusable/HandBridge";
import HandZeile from "@/components/Ezarri/Welt/HandZeile";
import Konfigurator from "@/components/Ezarri/Konfigurator/Konfigurator";
import { ownCalendarActive } from "@/components/Booking/config";

const PATH = "/ezarri/konfigurator";
const one = (v) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params, searchParams }) {
  const { locale } = await params;
  if (!toolLocaleEnabled(locale)) return {};
  const sp = await searchParams;
  const { SEITE, lang } = konfCopy(locale);
  return toolMetadata({
    locale,
    path: PATH,
    title: lang === "en" ? "Pool configurator for Ezarri glass mosaic" : lang === "de" ? "Pool-Konfigurator für Ezarri-Glasmosaik" : SEITE.metaTitle,
    description: SEITE.metaDescription,
    image: "/ezarri/gemma/anw-celestite-25-gemma-mosaic-pool-ezarri-1",
    utility: Boolean(one(sp?.k) || one(sp?.m) || one(sp?.ref)),
  });
}

/** Startzustand aus den Suchparametern. */
function initialFrom(sp) {
  const k = one(sp?.k);
  let state = null;
  let linkInvalid = false;
  if (typeof k === "string" && k) {
    state = decodeState(k, { isKnown: isKnownMosaic });
    linkInvalid = !state;
  }
  if (!state) {
    state = sanitizeState(DEFAULT_STATE);
    const pick = one(sp?.ref) || one(sp?.m);
    if (typeof pick === "string" && pick) {
      const kat = getKonfiguratorKatalog();
      const r = kat.refs.find((x) => x.id === pick) || kat.refs.find((x) => x.mid === pick && !x.safe && x.typ !== "corner" && x.typ !== "cove");
      if (r && r.typ !== "corner" && r.typ !== "cove") {
        const basis = kat.refs.find((x) => x.mid === r.mid && !x.safe && x.fmt === r.fmt);
        state = sanitizeState({ ...state, mix: [{ id: r.mid, anteil: 100, ...(basis && basis.id !== r.id ? { ref: r.id } : {}) }], format: r.fmt || state.format });
      }
    }
    const szene = one(sp?.szene);
    if (SZENEN.includes(szene)) state = withSzene(state, szene);
  }
  return { state, linkInvalid };
}

export default async function KonfiguratorPage({ params, searchParams }) {
  const { locale } = await params;
  if (!toolLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { SEITE, lang } = konfCopy(locale);
  const { NEUTRAL_CLAIM, LINKS } = ezCopy(locale);
  const en = lang === "en";
  const fremd = lang === "fr" || lang === "it";
  const intl = toolCopy(locale);
  const sp = await searchParams;
  const { state, linkInvalid } = initialFrom(sp);
  const katalog = katalogFuer(state);
  const crumbs = toolCrumbs(locale, SEITE.crumb);

  return (
    <div className="bg-surface text-text" lang={lang}>
      {/* Fokus nie unter der angehefteten Bühne bzw. dem schwebenden KI-Knopf unten rechts (WCAG 2.4.11): nur auf dieser Seite */}
      <style>{`@media (max-width:1023.98px){html:has([data-ezk]){scroll-padding-top:calc(var(--header-h) + max(42svh,15rem) + .5rem);scroll-padding-bottom:5.5rem}}@media (min-width:1024px){html:has([data-ezk]){scroll-padding-top:calc(var(--header-h) + 3.5rem);scroll-padding-bottom:5.5rem}}`}</style>
      {/* QM r4 (Handy quer, 390 px hoch): kompakter Kopf – Overline und Einleitung ausgeblendet, kleinere H1,
          damit oberhalb der Falz mehr als ein Streifen der Bühne steht. */}
      <Container as="header" className="pb-4 pt-4 md:pb-6 md:pt-6 [@media(orientation:landscape)_and_(max-height:500px)]:pb-2 [@media(orientation:landscape)_and_(max-height:500px)]:pt-2">
        <Breadcrumbs items={crumbs} />
        {/* Runde 4 P5 (seo P1-3): BreadcrumbList wie die übrigen Ezarri-Seiten */}
        <JsonLd data={graph(toolCrumbsSchema(crumbs, locale, PATH))} />
        <Eyebrow className="mt-4 [@media(orientation:landscape)_and_(max-height:500px)]:hidden">{SEITE.eyebrow}</Eyebrow>
        <Heading level={1} size="display-l" className="mt-stack-s text-balance [@media(orientation:landscape)_and_(max-height:500px)]:mt-1 [@media(orientation:landscape)_and_(max-height:500px)]:text-title">
          {SEITE.title}
        </Heading>
        <p className="mt-2 max-w-[68ch] text-ui text-text-soft text-pretty md:text-lead [@media(orientation:landscape)_and_(max-height:500px)]:hidden">{SEITE.lead}</p>
      </Container>
      <Container className="pb-section">
        <ToolCopyProvider value={intl ? { lang: intl.lang, KONF: intl.KONF } : null}>
          <Konfigurator initialState={state} initialKatalog={katalog} linkInvalid={linkInvalid} calendar={ownCalendarActive()} />
        </ToolCopyProvider>
        {/* R2 gesamtwerk P1-4: Kern-USP auch im Konfigurator */}
        {en || fremd ? (
          <HandZeile className="mt-10 !px-0" links={[{ href: LINKS.beratung, label: fremd ? SEITE.planen : "Plan your pool with us" }]} />
        ) : (
          <HandBridge className="mt-10 !px-0" links={[{ href: "/beratung?thema=ezarri", label: "Becken mit uns planen" }]} />
        )}
        <aside className="mt-10 max-w-[68ch] space-y-2 border-t border-line pt-6 text-small text-text-soft">
          <p>{SEITE.hinweisFarbe}</p>
          <p>
            {SEITE.hinweisMessung} {ezarriCredit("daten", locale)} · {ezarriCredit("bild", locale)} · {fremd ? SEITE.stand : en ? "as of" : "Stand"} 28.10.2026.
          </p>
          <p>
            {fremd
              ? SEITE.hinweisBrowser
              : en
              ? "The configurator calculates only in your browser. It stores nothing on our servers; the design is in the link."
              : "Der Konfigurator rechnet nur in Ihrem Browser. Er speichert nichts auf unseren Servern; der Entwurf steht im Link."}{" "}
            {NEUTRAL_CLAIM}.
          </p>
        </aside>
      </Container>
    </div>
  );
}
