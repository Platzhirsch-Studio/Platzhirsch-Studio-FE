// /<locale>/wunschliste – Einstieg in die teilbare Wunschliste (Rat 9,5 A17,
// neuland Nr. 10; T2). Vorher 404: Die Funktion gab es nur als Knopf in der
// Merkliste („Als Wunschliste teilen“), niemand fand sie. Die Seite erklärt
// Anlass, Ablauf und Aufbewahrung und führt in „Ihre Auswahl“, wo die Liste
// angelegt wird. Nur Aussagen, die die gebaute Funktion erfüllt: Der Satz zum
// gemeinsamen Gutschein steht nur, wenn der Beitragsweg offen ist
// (contributionChannel ≠ "aus"). Ohne verfügbare Wunschliste (Produktion vor
// der DSE-Freigabe, src/lib/wunschliste/config.js) → 404 wie die Unterseiten.
// Server-Komponente, kein Client-JS.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Button, Container, Eyebrow, Heading, Lead, LinkArrow } from "@/components/ui";
import { contributionChannel, wunschlisteAvailable } from "@/lib/wunschliste/mode";
import { retentionMonths } from "@/lib/wunschliste/config";
import { localeOf, wlCopyFrom } from "@/lib/wunschliste/copy";
import { voucherMode } from "@/lib/commerce/mode";
import { landingText } from "@/components/Wunschliste/landingCopy";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";
import { productsPath, ROUTES } from "@/utils/routing";
import { routing } from "@/i18n/config";

const OCCASIONS = ["einzug", "hochzeit", "geburtstag", "frei"];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) return {};
  const t = await getTranslations({ locale, namespace: "wunschliste" });
  return buildPageMetadata({
    locale,
    pathByLocale: "/wunschliste",
    title: landingText(t, locale, "metaTitle"),
    description: landingText(t, locale, "metaDescription"),
    index: wunschlisteAvailable(),
  });
}

export default async function WunschlisteLandingPage({ params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) notFound();
  await connection();
  if (!wunschlisteAvailable()) notFound();
  const t = await getTranslations({ locale, namespace: "wunschliste" });
  const root = await getTranslations({ locale });
  const wl = wlCopyFrom(localeOf(locale), root);
  const tx = (k, v) => landingText(t, locale, k, v);
  const gift = contributionChannel(voucherMode()) !== "aus";
  const steps = [1, 2, 3].map((n) => ({ n, title: tx(`step${n}Title`), text: tx(`step${n}Text`) }));
  const merkliste = ROUTES.merkliste[locale] || ROUTES.merkliste.de;
  const beratung = ROUTES.beratung[locale] || ROUTES.beratung.de;

  return (
    <div className="bg-surface text-text" data-wunschliste-landing="">
      <Container as="header" className="pt-10 pb-10 md:pt-14 lg:pt-16">
        <Eyebrow>{tx("eyebrow")}</Eyebrow>
        <Heading level={1} className="mt-stack-s max-w-[22ch] text-balance">
          {tx("title")}
        </Heading>
        <Lead className="mt-stack-m max-w-measure">
          {tx("lead")}
          {gift ? ` ${tx("leadGift")}` : ""}
        </Lead>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button href={merkliste} arrow>
            {tx("cta")}
          </Button>
          <LinkArrow href={productsPath(locale)}>{tx("browse")}</LinkArrow>
        </div>
      </Container>

      <Container className="pb-section">
        <section aria-labelledby="wl-schritte" className="border-t border-line pt-10">
          <h2 id="wl-schritte" className="text-overline uppercase text-text-accent">
            {tx("stepsTitle")}
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-x-grid gap-y-8 md:grid-cols-3" role="list">
            {steps.map((s) => (
              <li key={s.n} className="border-t border-line pt-4">
                <p className="tabular text-small text-text-soft" aria-hidden="true">
                  {String(s.n).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-title text-text">{s.title}</h3>
                <p className="mt-2 max-w-measure text-body text-text-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="wl-anlaesse" className="mt-14 border-t border-line pt-10">
          <h2 id="wl-anlaesse" className="text-overline uppercase text-text-accent">
            {tx("occasionsTitle")}
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3" role="list">
            {OCCASIONS.map((o) => (
              <li key={o} className="border border-line px-4 py-2 text-ui">
                {wl(`occasion.${o}`)}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-measure text-small text-text-soft">{tx("retention", { months: retentionMonths() })}</p>
        </section>

        <p className="mt-14 border-t border-line pt-6 text-body">
          {tx("advice")}{" "}
          <LinkArrow href={beratung} className="inline-flex">
            {tx("adviceLink")}
          </LinkArrow>
        </p>
      </Container>
    </div>
  );
}
