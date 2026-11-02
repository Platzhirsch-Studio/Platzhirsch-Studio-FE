// /de/ezarri/technik/downloads – Datenblätter, Zertifikate, Garantie (Team A, Konzept §3.7).
// Lokale Kopien der öffentlichen Ezarri-PDFs unter public/ezarri/pdf/ (aus
// Herstellermaterial/Ezarri/pdf, Quell-URL je Datei verlinkt). Kataloge gibt
// es bei Ezarri nur nach Login → „Katalog anfragen“.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ExternalLink, FileText } from "lucide-react";
import { Button, Container, Heading } from "@/components/ui";
import { getDownloads } from "@/lib/ezarri/data";
import { ezarriCredit, ezarriWeltLocaleEnabled } from "@/lib/ezarri/config";
import { ezLinkProps } from "@/lib/ezarri/deLinks";
import { ezCopy, ezT, wert } from "@/lib/ezarri/lang";
import { PageHead, Schluss, ezCrumbsFor } from "@/components/Ezarri/Welt/parts";
import { ezarriMetadata } from "@/components/Ezarri/Welt/meta";

const PATH = "/ezarri/technik/downloads";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) return {};
  const { DOWNLOADS, LINKS, TECHNIK } = ezCopy(locale);
  return ezarriMetadata({ locale, path: PATH, title: DOWNLOADS.seoTitle, description: DOWNLOADS.description });
}

function Row({ href, title, meta, quelle, locale }) {
  const { DOWNLOADS } = ezCopy(locale);
  const t = ezT(locale);
  return (
    <li className="flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:items-center sm:justify-between">
      <a href={href} type="application/pdf" className="inline-flex min-h-11 items-center gap-3 text-ui text-text underline decoration-transparent underline-offset-4 hover:decoration-current">
        <FileText aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.5} />
        <span>
          {title} <span className="text-small text-text-soft">({meta})</span>
        </span>
      </a>
      {quelle && (
        <a href={quelle} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-small text-text-soft underline underline-offset-4">
          {DOWNLOADS.quelleLink}
          <ExternalLink aria-hidden="true" className="size-3.5" strokeWidth={1.5} />
          <span className="sr-only">: {title} {t("(öffnet ezarri.com)", "(opens ezarri.com)", "(ouvre ezarri.com)", "(apre ezarri.com)")}</span>
        </a>
      )}
    </li>
  );
}

export default async function DownloadsPage({ params }) {
  const { locale } = await params;
  if (!ezarriWeltLocaleEnabled(locale)) notFound();
  setRequestLocale(locale);
  const { DOWNLOADS, LINKS, TECHNIK } = ezCopy(locale);
  const t = ezT(locale);
  const { sheets, alt } = getDownloads();
  return (
    <>
      <PageHead crumbs={ezCrumbsFor(locale, { label: TECHNIK.crumb, href: "/ezarri/technik" }, { label: DOWNLOADS.crumb })} eyebrow={TECHNIK.eyebrow} title={DOWNLOADS.title} lead={DOWNLOADS.lead} />
      <Container size="text" className="flex flex-col gap-16 pb-section">
        <section aria-labelledby="ez-dl-db">
          <Heading id="ez-dl-db" level={2} size="title">
            {DOWNLOADS.datenblaetter}
          </Heading>
          <ul className="mt-4 border-t border-line">
            {sheets.map((s) => (
              <Row key={s.id} href={s.href} title={s.name} meta={`PDF, ${wert("sprache", s.sprache, locale)}`} quelle={s.quelle} locale={locale} />
            ))}
          </ul>
        </section>
        <section aria-labelledby="ez-dl-zert">
          <Heading id="ez-dl-zert" level={2} size="title">
            {DOWNLOADS.zertifikate}
          </Heading>
          <ul className="mt-4 border-t border-line">
            {DOWNLOADS.zertifikatListe.map((z) => (
              <Row key={z.datei} href={`/ezarri/pdf/${z.datei}`} title={z.title} meta={`PDF, ${wert("sprache", z.sprache, locale)}`} quelle={z.quelle} locale={locale} />
            ))}
          </ul>
        </section>
        <section aria-labelledby="ez-dl-alt">
          <Heading id="ez-dl-alt" level={2} size="title">
            {DOWNLOADS.alt}
          </Heading>
          <p className="mt-2 text-small text-text-soft">{DOWNLOADS.altHinweis}</p>
          <ul className="mt-4 border-t border-line">
            {alt.map((a) => (
              <Row key={a.id} href={a.href} title={a.name} meta={`PDF, ${wert("sprache", a.sprache, locale)}`} locale={locale} />
            ))}
          </ul>
        </section>
        <section aria-labelledby="ez-dl-kat" className="bg-surface-band p-6">
          <Heading id="ez-dl-kat" level={2} size="title">
            {DOWNLOADS.kataloge.title}
          </Heading>
          <p className="mt-2 text-body text-text-soft">{DOWNLOADS.kataloge.text}</p>
          <Button href={LINKS.katalog} {...ezLinkProps(locale, LINKS.katalog)} variant="secondary" className="mt-4">
            {DOWNLOADS.kataloge.link}
          </Button>
        </section>
        <p className="text-small text-text-soft">{ezarriCredit("datenblatt", locale)} · {t("Stand", "as of", "état au", "aggiornato al")} 28.10.2026</p>
      </Container>
      <Schluss />
    </>
  );
}
