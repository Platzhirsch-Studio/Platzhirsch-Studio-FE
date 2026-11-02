// /[locale]/empfehlen — Empfehlungsprogramm „Unter Freunden“ (Welle 2, Team
// Kundenbetreuung; Inhaber 29.10.2026: „Wer einen Kunden empfiehlt, bekommt
// einen Gutschein.“). DE/EN/FR/IT, Texte in src/lib/kundenbetreuung/
// empfehlenContent.js, Regeln in src/lib/kundenbetreuung/empfehlung.js.
//
// Zwei Wege auf einer Seite:
//   1. Kundin/Kunde fordert den persönlichen Code an (Formular → /api/kontakt
//      mit Kontext „Empfehlungsprogramm · Empfehler“) und erzeugt sich den
//      Teilen-Link selbst (ShareLink: Kopieren, Teilen-Menü, eigenes Postfach).
//   2. Die empfohlene Person kommt über ?code=EMP-XXXXXX und meldet sich selbst
//      (Formular mit freiwilliger Einwilligung in die Zuordnung).
// Kein Feld für Adressen Dritter, keine Mail von Platzhirsch an Dritte.
//
// Sichtbarkeit (empfehlung.js referralPagePublic): Produktion erst mit
// freigegebenen Teilnahmebedingungen (REFERRAL.termsStatus) oder
// EMPFEHLUNG_PUBLIC=1; bis dahin 404. Entwicklung: sichtbar mit Hinweis.
// Indexiert erst mit freigegebenen Bedingungen.
// Design-Bibel: typografischer Auftakt (kein eigenes Foto im Bildregister),
// Haarlinien, keine Radien/Schatten, ein Primärknopf je Ansicht.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Breadcrumbs, Container } from "@/components/ui";
import JsonLd from "@/components/Reusable/JsonLd";
import EmpfehlungForm from "@/components/Empfehlen/EmpfehlungForm";
import ShareLink from "@/components/Empfehlen/ShareLink";
import { breadcrumbList, graph, IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import { hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  REFERRAL,
  normalizeReferralCode,
  referralPagePublic,
  referralTermsReleased,
  voucherValueLabel,
} from "@/lib/kundenbetreuung/empfehlung";
import { EMPFEHLEN_LOCALES, empfehlenCopy, fill } from "@/lib/kundenbetreuung/empfehlenContent";

const PATH = "/empfehlen";
const urlFor = (locale) => `${SITE_URL}/${locale}${PATH}`;
const HOME = { de: "Startseite", en: "Home", fr: "Accueil", it: "Home" };
const first = (v) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!EMPFEHLEN_LOCALES.includes(locale) || !referralPagePublic()) {
    await connection();
    notFound();
  }
  const c = empfehlenCopy(locale);
  const released = referralTermsReleased();
  const url = urlFor(locale);
  return {
    title: `${c.meta.title} | ${SITE_NAME}`,
    description: c.meta.description,
    // Indexierbar erst mit freigegebenen Teilnahmebedingungen.
    robots: { index: released, follow: true },
    alternates: released ? { canonical: url, languages: hreflangLanguages(urlFor) } : { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: c.meta.title,
      description: c.meta.description,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [{ url: "/Images/fallback-og.jpg", width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

const overline = "text-overline uppercase text-text-accent";

export default async function EmpfehlenPage({ params, searchParams }) {
  const { locale } = await params;
  if (!EMPFEHLEN_LOCALES.includes(locale) || !referralPagePublic()) {
    await connection();
    notFound();
  }
  const sp = await searchParams;
  const code = normalizeReferralCode(first(sp?.code));
  const c = empfehlenCopy(locale);
  const released = referralTermsReleased();
  const value = voucherValueLabel(locale);
  const showDraft = !released && process.env.NODE_ENV !== "production";
  const url = urlFor(locale);

  const schema = graph({
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: c.title,
    description: c.meta.description,
    inLanguage: IN_LANGUAGE[locale] || "de-AT",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    breadcrumb: breadcrumbList([{ name: HOME[locale] || "Startseite", url: `${SITE_URL}/${locale}` }, { name: c.breadcrumb }], `${url}#breadcrumb`),
  });

  const empfohlenSection = (
    <section
      id="empfohlen"
      aria-labelledby="emp-empfohlen-titel"
      className={code ? "bg-surface-band px-gutter py-16 md:py-20" : "border-t border-line bg-surface-band px-gutter py-16 md:py-20"}
    >
      <div className="mx-auto grid max-w-page gap-x-grid gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-4 lg:col-start-2">
          <p className={overline}>{c.empfohlen.overline}</p>
          <h2 id="emp-empfohlen-titel" className="mt-stack-s font-display text-display-m">
            {c.empfohlen.title}
          </h2>
          <p className="mt-stack-s max-w-measure text-body text-text">{code ? c.empfohlen.text : c.empfohlen.textNoCode}</p>
          {code && (
            <p className="mt-stack-s text-small text-text-soft">
              {c.form.code}: <span className="tabular text-text">{code}</span>
            </p>
          )}
        </div>
        <div className="bg-surface p-6 sm:p-8 lg:col-span-6">
          <EmpfehlungForm role="empfohlen" copy={c.form} initialCode={code || ""} />
        </div>
      </div>
    </section>
  );

  return (
    <div className="bg-surface text-text">
      <JsonLd data={schema} />
      <section aria-labelledby="emp-titel" className="px-gutter pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="mx-auto max-w-page">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: c.breadcrumb }]} />
          <div className="mt-stack-m grid gap-x-grid lg:grid-cols-12">
            <div className="lg:col-span-8 lg:col-start-2">
              <p className={overline}>
                {SITE_NAME} · {c.overline}
              </p>
              <h1 id="emp-titel" className="mt-stack-s font-display text-display-l">
                {c.title}
              </h1>
              <p className="mt-stack-m max-w-measure text-lead">{value ? `${c.lead.split(". ")[0]}. ${fill(c.leadValue, { value })}` : c.lead}</p>
            </div>
          </div>
        </div>
      </section>

      {showDraft && (
        <div role="note" className="border-y border-line-strong bg-stone">
          <Container className="py-4">
            <p className="text-ui text-text">{c.draftNote.title}</p>
            <p className="mt-1 max-w-measure text-small text-text">{c.draftNote.text}</p>
          </Container>
        </div>
      )}

      {code && empfohlenSection}

      <section aria-labelledby="emp-schritte" className="border-t border-line px-gutter py-16 md:py-20">
        <div className="mx-auto max-w-page">
          <h2 id="emp-schritte" className="font-display text-display-m">
            {c.stepsTitle}
          </h2>
          <ol className="mt-stack-m grid gap-x-grid gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {c.steps.map((s, i) => (
              <li key={s.title}>
                <p className="tabular text-overline text-text-accent" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-title">{s.title}</h3>
                <p className="mt-2 text-body text-text-soft">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="code" aria-labelledby="emp-code-titel" className="border-t border-line px-gutter py-16 md:py-20">
        <div className="mx-auto grid max-w-page gap-x-grid gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-6 lg:col-start-2">
            <p className={overline}>{c.empfehler.overline}</p>
            <h2 id="emp-code-titel" className="mt-stack-s font-display text-display-m">
              {c.empfehler.title}
            </h2>
            <p className="mt-stack-s max-w-measure text-body text-text">{c.empfehler.text}</p>
            <div className="mt-stack-m">
              <EmpfehlungForm role="empfehler" copy={c.form} />
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-8">
            <div className="border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <h2 className="text-title">{c.share.title}</h2>
              <p className="mt-2 text-body text-text-soft">{c.share.text}</p>
              <div className="mt-6">
                <ShareLink copy={c.share} locale={locale} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="emp-fair" className="border-t border-line px-gutter py-16 md:py-20">
        <div className="mx-auto grid max-w-page gap-x-grid lg:grid-cols-12">
          <div className="lg:col-span-8 lg:col-start-2">
            <h2 id="emp-fair" className="font-display text-display-m">
              {c.fairTitle}
            </h2>
            <ul className="mt-stack-m divide-y divide-line border-y border-line text-body">
              {c.fair.map((line) => (
                <li key={line} className="py-3">
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-stack-s max-w-measure text-small text-text-soft">
              {released && REFERRAL.termsStand ? fill(c.termsReleased, { stand: REFERRAL.termsStand }) : c.termsDraft}
            </p>
          </div>
        </div>
      </section>

      {!code && empfohlenSection}
    </div>
  );
}
