// /<locale>/accessoires/suche?q=…[&seite=n] – Produktsuche des Accessoires-Shops.
// Serverseitig über den statischen Katalog (src/lib/shop/shopSuche.js:
// Präfix-Abgleich, Pluralformen, Tippfehler-Rückfall), Ergebnis im gleichen
// Raster und mit derselben Kachel wie die Listen (ShopKachel, Raster wie ShopGrid). Funktioniert
// ohne JavaScript (GET-Formular). SEO: immer „noindex, follow“, Canonical ohne
// Query, nicht in der Sitemap.
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Breadcrumbs, Heading, Section } from "@/components/ui";
import { SHOP_CRUMBS } from "@/components/Katalog/shopCrumbs";
import { Link } from "@/i18n/navigation";
import ShopKachel from "@/components/Katalog/ShopKachel";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import { Search } from "@/components/ui/icons";
import { KATALOG_MARKEN } from "@/lib/katalog";
import { kategorieKey } from "@/lib/katalog/schema";
import { heuteIso } from "@/lib/katalog/config";
import { produktPath } from "@/lib/katalog/welten";
import { eintragVon } from "@/lib/katalog/shopIndex";
import { shopListeCopy } from "@/lib/katalog/shopListeCopy";
import { shopMode } from "@/lib/shop/mode";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { SHOP_LOCALES, SHOP_START_PATH, SHOP_SUCHE_PATH, SHOP_WELT, abteilungLabel, abteilungen, shopMarken } from "@/lib/shop/shopStart";
import { SUCHE_SEITE_GROESSE, sucheKategorien, sucheMarken, sucheProdukte, suchAnfrage, suchSeite } from "@/lib/shop/shopSuche";
import { kategoriePlural, startCopy } from "@/lib/shop/startCopy";

// Gleiches Raster wie die Produktliste (ShopGrid): mobil zweispaltig.
// Ohne Scroll-Reveal (Optik-QA r1): die gestaffelte view()-Zeitleiste ließ die angeschnittene erste
// Reihe im Ruhezustand treppenförmig versetzt stehen (11 / 13,5 / 16 / 18 px). Ein Shop-Raster steht still.
const GRID = "grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-grid xl:grid-cols-4";
const CHIP = "inline-flex min-h-11 items-center border border-line-strong px-3 text-ui text-text no-underline hover:border-ink";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!SHOP_LOCALES.includes(locale)) return { robots: { index: false, follow: true } };
  const c = startCopy(locale);
  return buildPageMetadata({ locale, pathByLocale: SHOP_SUCHE_PATH, title: `${c.sucheMetaTitle} | Platzhirsch`, description: c.sucheLeer, index: false });
}

const sucheHref = (q, seite) => `${SHOP_SUCHE_PATH}?q=${encodeURIComponent(q)}${seite > 1 ? `&seite=${seite}` : ""}`;

export default async function SuchePage({ params, searchParams }) {
  const { locale } = await params;
  if (!SHOP_LOCALES.includes(locale)) notFound();
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "katalog" });
  const c = startCopy(locale);
  const katLabel = (k) => t(`kategorie.${kategorieKey(k)}`);
  const roh = String(Array.isArray(sp?.q) ? sp.q[0] ?? "" : sp?.q ?? "").trim();
  const q = suchAnfrage(roh);
  const { treffer, korrigiert } = q ? sucheProdukte(q, { welt: SHOP_WELT, locale, katLabel }) : { treffer: [], korrigiert: null };
  const seiten = Math.max(1, Math.ceil(treffer.length / SUCHE_SEITE_GROESSE));
  const seite = Math.min(suchSeite(sp?.seite), seiten);
  const liste = treffer.slice((seite - 1) * SUCHE_SEITE_GROESSE, seite * SUCHE_SEITE_GROESSE);
  const gruppen = abteilungen();
  const marken = q ? sucheMarken(q, shopMarken()) : [];
  const alleKats = gruppen.flatMap((g) => g.kategorien.map((k) => ({ ...k, label: katLabel(k.slug) })));
  // Kategorien zur Suche: Treffer im Kategorienamen UND die Kategorien der gefundenen Produkte (nach Trefferzahl, ohne Zahl: der Link führt auf die ganze Kategorie)
  // (Optik-QA r2: bei „kerze“ stand nur „Duftkerze“, obwohl Kerzenlöscher und -ständer unter den Treffern waren).
  const jeKat = new Map();
  for (const p of treffer) jeKat.set(p.kategorie, (jeKat.get(p.kategorie) || 0) + 1);
  const namensTreffer = q ? sucheKategorien(q, alleKats).map((k) => k.slug) : [];
  const kategorien = alleKats
    .filter((k) => jeKat.has(k.slug) || namensTreffer.includes(k.slug))
    .map((k) => ({ ...k, label: kategoriePlural(locale, k.slug, k.label), n: jeKat.get(k.slug) || 0 }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);
  const lc = shopListeCopy(locale);
  const kachelOpts = { heute: heuteIso(), mode: shopMode(process.env) };
  const nameOf = (slug) => KATALOG_MARKEN.find((m) => m.slug === slug)?.name || slug;
  const crumbs = [{ label: homeCrumbLabel(locale), href: "/" }, { label: c.crumb, href: SHOP_START_PATH }, { label: c.sucheCrumb }];
  const status = !roh ? c.sucheLeer : !q ? c.sucheKurz : treffer.length ? c.sucheTreffer(treffer.length, q) : c.sucheKeine(q);

  return (
    <div data-shop-suche-seite="">
      <Section tone="surface" spacing="none" labelledBy="shop-suche-title" className="pt-6 pb-8 md:pt-10">
        <Breadcrumbs items={crumbs} schema className={SHOP_CRUMBS} />
        <Heading id="shop-suche-title" level={1} size="display-m" className="mt-stack-s">
          {c.sucheTitle}
        </Heading>
        <form role="search" aria-labelledby="shop-suche-title" action={`/${locale}${SHOP_SUCHE_PATH}`} method="get" className="mt-stack-m flex max-w-2xl items-stretch">
          <label htmlFor="shop-suche-gross" className="sr-only">
            {c.sucheLabel}
          </label>
          <input
            id="shop-suche-gross"
            name="q"
            type="search"
            defaultValue={roh.slice(0, 80)}
            minLength={2}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="search"
            placeholder={c.suchePlatzhalter}
            className="min-h-12 w-full min-w-0 appearance-none rounded-none border border-line-strong bg-surface px-4 text-body text-text placeholder:text-text-soft [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
          />
          <button type="submit" className="ph-press inline-flex min-h-12 shrink-0 items-center gap-2 bg-action px-5 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover">
            <Search className="size-5" strokeWidth={1.5} />
            <span>{c.sucheButton}</span>
          </button>
        </form>
        {/* Ergebniszeile: der Server rendert sie mit der Seite – kein Live-Region-Rauschen nötig. */}
        <p className="mt-stack-s text-body text-text" data-shop-suche-status="">
          {status}
        </p>
        {korrigiert && (
          <p className="mt-1 text-small text-text-soft" data-shop-suche-korrektur="">
            {c.sucheKorrektur(korrigiert)}
          </p>
        )}
        {(marken.length > 0 || kategorien.length > 0) && (
          <div className="mt-stack-s flex flex-wrap gap-x-8 gap-y-3">
            {marken.length > 0 && (
              <div>
                <p className="text-small text-text-soft">{c.sucheMarken}</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {marken.map((m) => (
                    <li key={m.slug}>
                      <Link href={m.href} className={CHIP}>
                        {m.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {kategorien.length > 0 && (
              <div>
                <p className="text-small text-text-soft">{c.sucheKategorien}</p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {kategorien.map((k) => (
                    <li key={k.slug}>
                      <Link href={k.href} className={CHIP}>
                        {k.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section tone="surface" spacing="compact" className="pt-0 md:pt-0">
        {liste.length > 0 ? (
          <>
            <LinkDelegate as="ul" className={GRID} data-shop-suche-treffer={treffer.length}>
              {liste.map((p, i) => (
                <li key={p.slug} data-kat-item="" data-marke={p.marke} data-kategorie={p.kategorie}>
                  <ShopKachel e={eintragVon(p, kachelOpts)} href={`/${locale}${produktPath(p.welt, p.slug)}`} locale={locale} marke={nameOf(p.marke)} copy={lc} eager={i < 4} />
                </li>
              ))}
            </LinkDelegate>
            {seiten > 1 && (
              <nav aria-label={c.sucheSeiten} className="mt-stack-m flex flex-wrap items-center gap-4 border-t border-line pt-4 text-ui">
                {seite > 1 && (
                  <Link href={sucheHref(q, seite - 1)} rel="prev" className="inline-flex min-h-11 items-center underline underline-offset-4">
                    {c.zurueck}
                  </Link>
                )}
                <span aria-current="page">{c.sucheSeite(seite, seiten)}</span>
                {seite < seiten && (
                  <Link href={sucheHref(q, seite + 1)} rel="next" className="inline-flex min-h-11 items-center underline underline-offset-4">
                    {c.weiter}
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="max-w-text">
            {q && <p className="text-body text-text-soft">{c.sucheKeineHinweis}</p>}
            <ul className="mt-stack-s flex flex-wrap gap-2" aria-label={c.subKategorien}>
              {gruppen.map((g) => (
                <li key={g.id}>
                  <Link href={g.href} className={CHIP}>
                    {abteilungLabel(g, locale, katLabel)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-stack-m max-w-measure text-small text-text-soft">{c.preiseHinweis}</p>
      </Section>
    </div>
  );
}
