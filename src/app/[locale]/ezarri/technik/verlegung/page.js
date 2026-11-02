// /de/ezarri/technik/verlegung – Schritte je Beckentyp (Team A, Konzept §3.7).
// Beckentyp als RadioCard; umgeschaltet per CSS :has() – ohne JS vollständig
// bedienbar, ohne :has() stehen alle Typen untereinander (<ol> je Typ).
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { ezCopy, ezT } from "@/lib/ezarri/lang";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import { CreditNote, PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";
import { article } from "@/components/Ezarri/Welt/schema";
import styles from "@/components/Ezarri/Welt/ezarri.module.css";

const PATH = "/ezarri/technik/verlegung";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { TECHNIK, VERLEGUNG } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: VERLEGUNG.seoTitle, description: VERLEGUNG.description });
}

export default async function VerlegungPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { TECHNIK, VERLEGUNG } = ezCopy(locale);
  const t = ezT(locale);
  return (
    <>
      <PageHead
        crumbs={ezCrumbsFor(locale, { label: TECHNIK.crumb, href: "/ezarri/technik" }, { label: VERLEGUNG.crumb })}
        eyebrow={TECHNIK.eyebrow}
        title={VERLEGUNG.title}
        lead={VERLEGUNG.lead}
        jsonLd={[article({ locale, path: PATH, headline: VERLEGUNG.title, description: VERLEGUNG.description })]}
      />
      <Container className="pb-section">
        <div className={styles.typen}>
          <fieldset>
            <legend className="text-overline uppercase text-text-soft">{VERLEGUNG.waehlen}</legend>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {VERLEGUNG.typen.map((typ, i) => (
                <label
                  key={typ.id}
                  className="flex min-h-14 cursor-pointer items-center gap-3 border border-line-control px-4 text-ui text-text has-[:checked]:border-see has-[:checked]:bg-surface-band has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
                >
                  <input type="radio" name="becken" value={typ.id} defaultChecked={i === 0} className="size-5 accent-ink" />
                  {typ.label}
                  <span className="ml-auto text-small tabular-nums text-text-soft">{t(`${typ.schritte.length} Schritte`, `${typ.schritte.length} steps`, `${typ.schritte.length} étapes`, `${typ.schritte.length} passaggi`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {VERLEGUNG.typen.map((typ) => (
            <section key={typ.id} data-typ={typ.id} aria-labelledby={`ez-v-${typ.id}`} className={`${styles.typ} mt-12`}>
              <h2 id={`ez-v-${typ.id}`} className="font-display text-display-m text-text">
                {typ.label}
              </h2>
              <ol className="mt-stack-m grid gap-x-grid gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                {typ.schritte.map(([titel, text], i) => (
                  <li key={titel} className="border-t border-line pt-4">
                    <p className="text-small tabular-nums text-text-soft">
                      {t(`Schritt ${i + 1} von ${typ.schritte.length}`, `Step ${i + 1} of ${typ.schritte.length}`, `Étape ${i + 1} sur ${typ.schritte.length}`, `Passaggio ${i + 1} di ${typ.schritte.length}`)}
                    </p>
                    <h3 className="mt-1 text-title text-text">{titel}</h3>
                    <p className="mt-2 text-body text-text-soft">{text}</p>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        <p className="mt-12 max-w-measure text-small text-text-soft">{VERLEGUNG.hinweisKelle}</p>
        <p className="mt-4 max-w-measure text-body text-text">{TECHNIK.fachbetrieb}</p>
        <p className="mt-4 text-small text-text-soft">
          {t("Quelle der Schritte: Ezarri, ezarri.com/de/verlegung, Stand 28.10.2026. Menge von Kleber und Fuge:", "Source of the steps: Ezarri, ezarri.com/en/installation, as of 28.10.2026. Quantity of adhesive and grout:", "Source des étapes : Ezarri, ezarri.com/en/installation, état au 28.10.2026. Quantité de colle et de joint :", "Fonte dei passaggi: Ezarri, ezarri.com/en/installation, aggiornato al 28.10.2026. Quantità di adesivo e fuga:")}{" "}
          <Link href="/ezarri/rechner" {...ezLinkProps(locale, "/ezarri/rechner")} className="underline underline-offset-4">
            {t("Mosaik-Rechner", "mosaic calculator", "calculateur de mosaïque", "calcolatore del mosaico")}
          </Link>
          .
        </p>
        <CreditNote kinds={["daten"]} className="mt-2" />
      </Container>
      <Schluss />
    </>
  );
}
