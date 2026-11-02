// /de/ezarri/mosaike/vergleich?ids=a,b,c – Vergleich bis 4 Mosaike (Team A, Konzept §3.4).
// Immer Hilfsseite (noindex). IDs aus der URL → als Link teilbar; die
// Vergleichsleiste (compareStore) baut diesen Link. Unterschiede werden mit
// Symbol UND Text markiert, nicht nur per Farbe. „Nur Unterschiede“ per CSS :has().
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Check, Diff, X } from "lucide-react";
import { Button, Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { getCollection, getEignung, getOwnPackaging, getReference, getSlipResistance, getSpecialPieces, ownFormatIds, toReferenceCard } from "@/lib/ezarri/data";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import { facetsFor, formatIdsOf } from "@/lib/ezarri/facets";
import { ezCopy, ezT, wert } from "@/lib/ezarri/lang";
import EzImage from "@/components/Ezarri/Welt/EzImage";
import { PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { konfiguratorHref } from "@/components/Ezarri/Katalog/konfigLink";
import { anfrageHref } from "@/components/Ezarri/Anfrage/AnfrageLink";
import styles from "@/components/Ezarri/Welt/ezarri.module.css";

const PATH = "/ezarri/mosaike/vergleich";
const MAX = 4;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { VERGLEICH, alt: altText } = ezCopy(locale);
  const description = ezT(locale)(
    "Ezarri-Mosaike nebeneinander: Format, Oberfläche, Wasserwirkung, Rutschhemmung, Verpackung.",
    "Ezarri mosaics side by side: format, surface, water effect, slip resistance, packaging.",
    "Comparer des mosaïques Ezarri côte à côte : format, surface, effet d’eau, résistance au glissement, conditionnement et utilisation.",
    "Confrontare mosaici Ezarri uno accanto all’altro: formato, superficie, effetto dell’acqua, resistenza allo scivolamento, imballaggio e impiego."
  );
  return ezarriMetadata({ locale, path: PATH, title: VERGLEICH.seoTitle, description, utility: true });
}

const parseIds = (v) =>
  [...new Set(String(Array.isArray(v) ? v.join(",") : v ?? "").split(",").map((s) => s.trim()).filter((s) => /^[a-z0-9_-]{1,60}$/.test(s)))].slice(0, MAX);

const label = (list, ids) => ids.map((id) => list.find((x) => x.id === id)?.label).filter(Boolean).join(", ");

function rowsFor(r, locale = "de") {
  const { EINSATZ, FORMATE, WASSERWIRKUNG } = facetsFor(locale);
  const en = locale === "en";
  const t = ezT(locale);
  const dez = (v) => (en ? String(v) : String(v).replace(".", ","));
  // Format und Verpackung DIESER Referenz (QM P2-4), nicht der ersten Variante der Familie.
  const p = getOwnPackaging(r) || {};
  const slip = getSlipResistance(r);
  const own = ownFormatIds(r);
  const fids = own.length ? own : formatIdsOf(r);
  return {
    kollektion: getCollection(r.kollektion)?.name ?? r.kollektion,
    format: label(FORMATE, fids),
    oberflaeche: wert("oberflaeche", r.oberflaeche, locale),
    wasser: [].concat(r.wasserfarbe ?? []).map((v) => WASSERWIRKUNG.find((w) => w.value === v)?.label).filter(Boolean).join(", "),
    rutsch: slip ? [slip.schuh, slip.barfuss].filter(Boolean).join(" · ") : null,
    spezial: getSpecialPieces(r).map((x) => (x.typ === "corner" ? "Corner" : "Cove")).filter((v, i, a) => a.indexOf(v) === i).join(", ") || null,
    blatt: p.blattCm ? `${en ? String(p.blattCm).replace(/(\d),(\d)/g, "$1.$2").replace(" x ", " × ") : p.blattCm} cm` : null,
    steine: p.steineProBlatt,
    m2karton: p.m2ProKarton != null ? dez(p.m2ProKarton) : null,
    kgm2: p.kgProM2 != null ? dez(p.kgProM2) : null,
    einsatz: label(EINSATZ, getEignung(r)),
    mischbar: r.konfigurator ? (r.konfigurator.mischbar ? t("ja", "yes", "oui", "sì") : t("nein", "no", "non", "no")) : t("nicht im Konfigurator", "not in the configurator", "pas dans le configurateur", "non nel configuratore"),
  };
}

export default async function VergleichPage({ params, searchParams }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { VERGLEICH, alt: altText } = ezCopy(locale);
  const t = ezT(locale);
  const sp = await searchParams;
  const refs = parseIds(sp?.ids).map(getReference).filter(Boolean);
  const cards = refs.map(toReferenceCard);
  const data = refs.map((r) => rowsFor(r, locale));
  const keys = Object.keys(VERGLEICH.zeilen);
  const allMix = refs.length > 1 && refs.every((r) => r.konfigurator?.mischbar);
  const crumbs = ezCrumbsFor(locale, { label: t("Mosaike", "Mosaics", "Mosaïques", "Mosaici"), href: "/ezarri/mosaike" }, { label: VERGLEICH.crumb });
  const without = (id) => `${PATH}?ids=${refs.filter((r) => r.id !== id).map((r) => r.id).join(",")}`;

  return (
    <>
      <PageHead crumbs={crumbs} title={VERGLEICH.title} />
      <Container className="pb-section">
        {refs.length === 0 ? (
          <div className="max-w-measure">
            <p className="text-body text-text-soft">{VERGLEICH.leer}</p>
            <Button href="/ezarri/mosaike" className="mt-6" arrow>
              {VERGLEICH.zurUebersicht}
            </Button>
          </div>
        ) : (
          <div className={styles.vergleich}>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-ui text-text">
              <input type="checkbox" name="nur-unterschiede" className="size-5 accent-ink" />
              {VERGLEICH.nurUnterschiede}
            </label>
            {/* Mobil (unter sm, QM P2-6): Kopf mit Bildern klebt oben, je Merkmal eine Zeile mit
                Überschrift (Merkmal + gleich/unterschiedlich) und den Werten nebeneinander. */}
            <div className="mt-4 sm:hidden">
              <ul
                aria-label={t("Verglichene Mosaike", "Compared mosaics", "Mosaïques comparées", "Mosaici a confronto")}
                className="sticky top-(--header-h) z-(--z-sticky) -mx-gutter grid gap-2 border-b border-line bg-surface px-gutter py-2"
                style={{ gridTemplateColumns: `repeat(${refs.length}, minmax(0, 1fr))` }}
              >
                {cards.map((c) => (
                  <li key={c.id} className="flex min-w-0 flex-col items-start">
                    <EzImage image={c.bild} alt="" ratio="1/1" sizes="64px" className="w-16" />
                    <Link href={`/ezarri/mosaike/${c.id}`} className="mt-1 inline-flex min-h-6 max-w-full items-center truncate text-small text-text underline underline-offset-4">
                      {c.name}
                    </Link>
                    <Link href={without(c.id)} className="inline-flex min-h-6 items-center gap-1 text-small text-text-soft hover:text-text">
                      <X aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                      {t("Entfernen", "Remove", "Retirer", "Rimuovere")}
                      <span className="sr-only">: {c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <dl>
                {keys.map((k) => {
                  const vals = data.map((d) => d[k] || "–");
                  const same = vals.every((v) => v === vals[0]);
                  return (
                    <div key={k} data-gleich={same && refs.length > 1 ? "1" : undefined} className="border-b border-line py-3">
                      <dt className="flex items-center justify-between gap-3 text-small">
                        <span className="font-medium text-text">{VERGLEICH.zeilen[k]}</span>
                        {refs.length > 1 && (
                          <span className="inline-flex items-center gap-1 text-text-soft">
                            {same ? <Check aria-hidden="true" className="size-3.5" strokeWidth={1.5} /> : <Diff aria-hidden="true" className="size-3.5" strokeWidth={1.5} />}
                            {same ? VERGLEICH.gleich : VERGLEICH.unterschied}
                          </span>
                        )}
                      </dt>
                      <dd className="mt-1 grid gap-2 text-small tabular-nums text-text" style={{ gridTemplateColumns: `repeat(${refs.length}, minmax(0, 1fr))` }}>
                        {vals.map((v, i) => (
                          <span key={refs[i].id} className={`min-w-0 break-words ${!same ? "bg-surface-band px-1" : ""}`}>
                            <span className="sr-only">{cards[i].name}: </span>
                            {v}
                          </span>
                        ))}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
            <div className="relative mt-4 hidden overflow-x-auto sm:block" tabIndex={0} role="region" aria-label={t(`${VERGLEICH.title}, waagrecht scrollbar`, `${VERGLEICH.title}, scrolls horizontally`, `${VERGLEICH.title}, défilement horizontal`, `${VERGLEICH.title}, scorrimento orizzontale`)}>
              <table className="w-full min-w-[40rem] table-fixed border-collapse text-left text-small tabular-nums">
                <caption className="sr-only">{t(`Vergleich von ${refs.length} Ezarri-Mosaiken. Zeilen mit unterschiedlichen Werten sind mit „unterschiedlich“ markiert.`, `Comparison of ${refs.length} Ezarri mosaics. Rows with different values are marked “different”.`, `Comparaison de ${refs.length} mosaïques Ezarri. Les lignes aux valeurs différentes sont marquées « différent ».`, `Confronto di ${refs.length} mosaici Ezarri. Le righe con valori diversi sono contrassegnate con «diverso».`)}</caption>
                <colgroup>
                  <col className="w-36" />
                  {refs.map((r) => (
                    <col key={r.id} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <td />
                    {cards.map((c) => (
                      <th key={c.id} scope="col" className="px-2 pb-4 align-top font-normal">
                        <EzImage image={c.bild} alt={altText.mosaik(c.name, null, wert("oberflaeche", c.oberflaeche, locale))} ratio="1/1" sizes="(min-width: 1024px) 20vw, 40vw" />
                        <Link href={`/ezarri/mosaike/${c.id}`} className="mt-2 inline-flex min-h-11 items-center text-ui text-text underline underline-offset-4">
                          {c.name}
                        </Link>
                        <Link href={without(c.id)} className="inline-flex min-h-11 items-center gap-1 text-small text-text-soft hover:text-text">
                          <X aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
                          {t("Entfernen", "Remove", "Retirer", "Rimuovere")}
                          <span className="sr-only">: {c.name}</span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => {
                    const vals = data.map((d) => d[k] || "–");
                    const same = vals.every((v) => v === vals[0]);
                    return (
                      <tr key={k} data-gleich={same && refs.length > 1 ? "1" : undefined} className="border-t border-line">
                        <th scope="row" className="py-3 pr-3 align-top font-medium text-text-soft">
                          <span className="block">{VERGLEICH.zeilen[k]}</span>
                          {refs.length > 1 && (
                            <span className={`mt-1 inline-flex items-center gap-1 text-small ${same ? "text-text-soft" : "text-text"}`}>
                              {same ? <Check aria-hidden="true" className="size-3.5" strokeWidth={1.5} /> : <Diff aria-hidden="true" className="size-3.5" strokeWidth={1.5} />}
                              {same ? VERGLEICH.gleich : VERGLEICH.unterschied}
                            </span>
                          )}
                        </th>
                        {vals.map((v, i) => (
                          <td key={refs[i].id} className={`px-2 py-3 align-top ${!same ? "bg-surface-band text-text" : "text-text"}`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-small text-text-soft">{t("Daten: Ezarri, ezarri.com · Bild: Ezarri, ezarri.com · Stand 28.10.2026", "Data: Ezarri, ezarri.com · Image: Ezarri, ezarri.com · as of 28.10.2026", "Données : Ezarri, ezarri.com · Image : Ezarri, ezarri.com · état au 28.10.2026", "Dati: Ezarri, ezarri.com · Immagine: Ezarri, ezarri.com · aggiornato al 28.10.2026")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button href={anfrageHref({ art: "muster", refs: refs.map((r) => r.id), quelle: "katalog" })} {...ezLinkProps(locale, "/ezarri/anfrage")} arrow>
                {VERGLEICH.muster}
              </Button>
              {allMix ? (
                <Button href={konfiguratorHref(refs.map((r) => ({ konfId: r.konfigurator.id, ref: r.id })), "25mm")} {...ezLinkProps(locale, "/ezarri/konfigurator")} variant="secondary">
                  {VERGLEICH.konfigurator}
                </Button>
              ) : (
                refs.length > 1 && <p className="self-center text-small text-text-soft">{VERGLEICH.nichtMischbar}</p>
              )}
            </div>
          </div>
        )}
      </Container>
      <Schluss />
    </>
  );
}
