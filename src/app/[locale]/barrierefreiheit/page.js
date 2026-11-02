// /<locale>/barrierefreiheit – Information zur Barrierefreiheit (Rat 9,5, B13;
// QA Recht −0,2, § 14 BaFG, Design-Bibel § 14). Freiwillige Information mit
// nur geprüften Aussagen; Daten in src/lib/legal/barrierefreiheit.js.
// Deutscher Text in allen vier Sprachen (wie Impressum): Textkörper lang="de",
// Hinweis in der Seitensprache. Footer-Link setzt T1 (Auftrag in
// qa-screenshots/umsetzung95/auftraege.md).
import LegalProse from "@/components/Impressum/LegalProse";
import PageHeader from "@/components/UberUns/PageHeader";
import GermanOnlyNotice, { germanText } from "@/components/Legal/GermanOnlyNotice";
import { EINSCHRAENKUNGEN, MARKTUEBERWACHUNG, PRUEFUNG, STAND, UMGESETZT } from "@/lib/legal/barrierefreiheit";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, SITE_NAME, SITE_URL } from "@/lib/site";

const LOCALES = ["de", "en", "fr", "it"];
const pageUrl = (locale) => `${SITE_URL}/${locale}/barrierefreiheit`;

const META = {
  de: { title: "Barrierefreiheit", description: "Wie barrierefrei die Website von Platzhirsch Home Living ist, wie wir sie prüfen und wie Sie uns eine Barriere melden." },
  en: { title: "Accessibility", description: "How accessible the Platzhirsch Home Living website is, how we test it and how to report a barrier (in German)." },
  fr: { title: "Accessibilité", description: "Accessibilité du site de Platzhirsch Home Living, nos contrôles et comment signaler un obstacle (en allemand)." },
  it: { title: "Accessibilità", description: "Accessibilità del sito di Platzhirsch Home Living, come lo verifichiamo e come segnalare una barriera (in tedesco)." },
};

const dateDe = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("de-AT", { day: "numeric", month: "long", year: "numeric" });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const m = META[locale] || META.de;
  return {
    title: `${m.title} | ${SITE_NAME}`,
    description: m.description,
    // Rechtliche Information, kein Suchziel (wie Datenschutz und Impressum).
    robots: { index: false, follow: true },
    alternates: { canonical: pageUrl(locale), languages: hreflangLanguages((l) => pageUrl(l)) },
    openGraph: {
      type: "website",
      url: pageUrl(locale),
      title: m.title,
      description: m.description,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

export default async function BarrierefreiheitPage({ params }) {
  const { locale } = await params;
  const p = PRUEFUNG;
  return (
    <div data-page="barrierefreiheit">
      <PageHeader
        width="text"
        breadcrumbs={[{ label: homeCrumbLabel(locale), href: "/" }, { label: germanText("Barrierefreiheit", locale) }]}
        title={germanText("Barrierefreiheit", locale)}
        lead={locale !== "de" ? <GermanOnlyNotice locale={locale} /> : undefined}
      />
      <LegalProse>
        <p>
          <strong>Stand: {dateDe(STAND)}</strong>
        </p>
        <p>
          Diese Information gilt für die Website platzhirsch.studio von {SITE_NAME}. Wir gestalten sie nach den Web Content
          Accessibility Guidelines (WCAG) 2.2, Stufe AA, und prüfen sie regelmäßig.
        </p>

        <h2 id="pruefung">Wie wir prüfen</h2>
        <p>
          Letzte automatische Prüfung am {dateDe(p.datum)} mit {p.werkzeug} {p.version} nach den Regeln für {p.regeln}, auf{" "}
          {p.geraete}. Geprüft wurden {p.seiten.length} Seiten, darunter Startseite, Produktübersicht, Kontakt, Beratung,
          Über uns, Datenschutz und Impressum.{" "}
          {p.verstoesse === 0
            ? "Ergebnis: Das Werkzeug hat keine Verstöße gemeldet."
            : `Ergebnis: Das Werkzeug hat ${p.verstoesse} Verstöße gemeldet; wir beheben sie.`}
        </p>
        <p>
          Eine automatische Prüfung findet nicht jede Barriere. Deshalb ist uns Ihre Rückmeldung wichtig (Abschnitt „Barriere
          melden“).
        </p>

        <h2 id="umgesetzt">Was umgesetzt ist</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-text-soft">
          {UMGESETZT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <h2 id="einschraenkungen">Was noch nicht barrierefrei ist</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-text-soft">
          {EINSCHRAENKUNGEN.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <h2 id="barriere-melden">Barriere melden</h2>
        <p>
          Wenn Sie auf unserer Website auf eine Barriere stoßen oder Inhalte in einer anderen Form brauchen, schreiben Sie uns oder
          rufen Sie an:
        </p>
        <p>
          E-Mail: <a href={EMAIL_HREF}>{EMAIL}</a>
          <br />
          Telefon: <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
        </p>
        <p>Diese Information erhalten Sie auf Wunsch auch schriftlich oder mündlich.</p>

        <h2 id="marktueberwachung">Marktüberwachung</h2>
        <p>
          Zuständig für die Marktüberwachung nach dem Barrierefreiheitsgesetz ist in Österreich das{" "}
          <a href={MARKTUEBERWACHUNG.url} rel="noopener noreferrer">
            {MARKTUEBERWACHUNG.name}
          </a>
          .
        </p>
      </LegalProse>
    </div>
  );
}
