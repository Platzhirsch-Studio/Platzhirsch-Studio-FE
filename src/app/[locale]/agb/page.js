// /<locale>/agb – Allgemeine Geschäftsbedingungen (Auftrag des Inhabers vom
// 02.11.2026: AGB je Geschäftsbereich). Text und Status in src/lib/legal/agb.js.
// Deutscher Text in allen vier Sprachen (wie Impressum und Barrierefreiheit):
// Textkörper lang="de", Hinweis in der Seitensprache (Legal/GermanOnlyNotice.js).
// Solange AGB_STATUS „entwurf“ ist, trägt die Seite den dezenten Marker
// „Entwurf“; Lücken für die Kanzlei („[Kanzlei: …]“) erscheinen als neutrale
// Lücke „wird ergänzt“ (wie /shop/recht, QM Inhaber-Entscheidung Nr. 5).
// Rechtliche Information, kein Suchziel: noindex,follow, nicht in der Sitemap.
import LegalProse from "@/components/Impressum/LegalProse";
import PageHeader from "@/components/UberUns/PageHeader";
import GermanOnlyNotice, { germanText } from "@/components/Legal/GermanOnlyNotice";
import PrintButton from "@/components/Legal/PrintButton";
import {
  AGB_ANBIETER,
  AGB_BEREICHE,
  AGB_STATUS,
  AGB_TEILE,
  AGB_TITLE,
  AGB_VERWEISE,
  agbStandDe,
  splitInline,
} from "@/lib/legal/agb";
import { voucherEnabled } from "@/lib/commerce/mode";
import { shopActive } from "@/lib/shop/mode";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const LOCALES = ["de", "en", "fr", "it"];
const pageUrl = (locale) => `${SITE_URL}/${locale}/agb`;

const META = {
  de: { title: AGB_TITLE, description: "Allgemeine Geschäftsbedingungen von Platzhirsch Home Living: allgemeiner Teil, Verbraucher, Unternehmer und besondere Bedingungen je Geschäftsbereich." },
  en: { title: "Terms and Conditions", description: "General terms and conditions of Platzhirsch Home Living: general part, consumers, businesses and special terms per business area (in German)." },
  fr: { title: "Conditions générales", description: "Conditions générales de Platzhirsch Home Living : partie générale, consommateurs, entreprises et conditions particulières par domaine (en allemand)." },
  it: { title: "Condizioni generali", description: "Condizioni generali di Platzhirsch Home Living: parte generale, consumatori, imprese e condizioni particolari per settore (in tedesco)." },
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const m = META[locale] || META.de;
  return {
    title: `${m.title} | ${SITE_NAME}`,
    description: m.description,
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

/** Absatz mit Hervorhebung „Verbraucher“/„Unternehmer“ und neutraler Lücke für die Kanzlei. */
function Absatz({ text }) {
  return (
    <p>
      {splitInline(text).map((p, i) => {
        if (p.t === "mark") {
          return (
            <strong key={i} className="mr-1 inline-block border border-line px-1 text-small uppercase tracking-wide text-text-soft" data-agb-gruppe={p.mark}>
              {p.mark}
            </strong>
          );
        }
        if (p.t === "luecke") {
          return (
            <mark key={i} className="border border-dashed border-line-strong bg-stone px-1 text-small text-text" data-agb-luecke="">
              wird ergänzt
            </mark>
          );
        }
        return <span key={i}>{p.text}</span>;
      })}
    </p>
  );
}

/** Link in Teil IV auf einen anderen Rechtstext – nur, wenn die Zielseite erreichbar ist. */
function Verweis({ href, label, locale }) {
  if (!href) return null;
  return (
    <p className="text-small text-text-soft">
      Siehe auch: <a href={`/${locale}${href}`}>{label}</a>
    </p>
  );
}

export default async function AgbPage({ params }) {
  const { locale } = await params;
  const entwurf = AGB_STATUS === "entwurf";
  // Verweise nur auf Seiten, die es gerade gibt (sonst 404): Shop-Rechtstexte
  // bei SHOP_MODE test/live, Gutscheinbedingungen bei VOUCHER_MODE anfrage.
  const verweise = {
    onlineshop: shopActive() ? AGB_VERWEISE.onlineshop.path : null,
    gutscheine: voucherEnabled() ? AGB_VERWEISE.gutscheine.path : null,
  };
  const stand = agbStandDe();

  return (
    <div data-page="agb" data-agb-status={AGB_STATUS}>
      <PageHeader
        width="text"
        breadcrumbs={[{ label: homeCrumbLabel(locale), href: "/" }, { label: germanText("AGB", locale) }]}
        eyebrow={entwurf ? "Entwurf" : undefined}
        title={germanText(AGB_TITLE, locale)}
        lead={locale !== "de" ? <GermanOnlyNotice locale={locale} /> : undefined}
      />
      <LegalProse>
        <p>
          <strong>Stand: {stand}</strong>
          {entwurf && <span className="text-text-soft"> · Entwurf</span>}
        </p>
        <p>
          {AGB_ANBIETER.firma} („{AGB_ANBIETER.marke}“), {AGB_ANBIETER.anschrift}. Diese AGB gelten für alle Geschäftsbereiche; die besonderen
          Bedingungen je Bereich stehen in Teil IV.
        </p>
        <div className="print:hidden">
          <PrintButton />
        </div>

        <nav aria-label="Inhalt" className="mt-8 border-t border-line pt-6 print:hidden" data-agb-inhalt="">
          <p className="text-small uppercase tracking-wide text-text-soft">Inhalt</p>
          <ol className="mt-3 space-y-3">
            {AGB_TEILE.map((teil) => (
              <li key={teil.id}>
                <a href={`#${teil.id}`}>
                  {teil.num} – {teil.title}
                </a>
                <ul className="mt-1 space-y-1 pl-5 text-small">
                  {teil.sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`}>
                        {s.num} {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </nav>

        {AGB_TEILE.map((teil) => (
          <section key={teil.id} id={teil.id} className="mt-12 scroll-mt-24" data-agb-teil={teil.id}>
            <h2>
              {teil.num} – {teil.title}
            </h2>
            {teil.lead && <p className="text-text-soft">{teil.lead}</p>}
            {teil.sections.map((s) => (
              <section key={s.id} id={s.id} className="mt-8 scroll-mt-24" data-agb-abschnitt={s.id} data-agb-bereich={s.key || undefined}>
                <h3 className="text-title text-text">
                  {s.num} {s.title}
                </h3>
                {s.lead && <p className="text-text-soft">{s.lead}</p>}
                {s.blocks.map((b, i) =>
                  typeof b === "string" ? (
                    <Absatz key={i} text={b} />
                  ) : (
                    <ul key={i} className="mt-3 list-disc space-y-2 pl-5 marker:text-text-soft">
                      {b.ul.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  )
                )}
                {s.key === "onlineshop" && <Verweis href={verweise.onlineshop} label={AGB_VERWEISE.onlineshop.label} locale={locale} />}
                {s.key === "gutscheine" && <Verweis href={verweise.gutscheine} label={AGB_VERWEISE.gutscheine.label} locale={locale} />}
              </section>
            ))}
          </section>
        ))}

        {/* Druck 02.11.: Schlusszeile (Stand steht oben, Rest sind Links) nicht im Ausdruck –
            sie stand allein auf einem 23. Blatt. */}
        <p className="mt-12 border-t border-line pt-6 text-small text-text-soft print:hidden">
          {AGB_BEREICHE.length} Geschäftsbereiche · Stand {stand} · <a href={`/${locale}${AGB_VERWEISE.datenschutz.path}`}>{AGB_VERWEISE.datenschutz.label}</a> ·{" "}
          <a href={`/${locale}/impressum`}>Impressum</a>
        </p>
      </LegalProse>
    </div>
  );
}
