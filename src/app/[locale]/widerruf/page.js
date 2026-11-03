// /<locale>/widerruf – Widerrufsbelehrung für Verträge außerhalb des
// Onlineshops (Inhaber 03.11.2026). Text und Status in src/lib/legal/widerruf.js.
// Deutscher Text in allen vier Sprachen (wie /agb, Impressum): Textkörper
// lang="de", Hinweis in der Seitensprache (Legal/GermanOnlyNotice.js).
// Verweise auf die Shop-Belehrung und die Online-Rücktrittsfunktion nur, wenn
// der Shop erreichbar ist (SHOP_MODE test/live), sonst E-Mail/Brief.
// Rechtliche Information, kein Suchziel: noindex,follow, nicht in der Sitemap.
import LegalProse from "@/components/Impressum/LegalProse";
import PageHeader from "@/components/UberUns/PageHeader";
import GermanOnlyNotice, { germanText } from "@/components/Legal/GermanOnlyNotice";
import PrintButton from "@/components/Legal/PrintButton";
import {
  WIDERRUF_ANBIETER,
  WIDERRUF_FORMULAR_PATH,
  WIDERRUF_MUSTERFORMULAR,
  WIDERRUF_SECTIONS,
  WIDERRUF_SHOP_PATH,
  WIDERRUF_STATUS,
  WIDERRUF_SUBTITLE,
  WIDERRUF_TITLE,
  widerrufStandDe,
} from "@/lib/legal/widerruf";
import { AGB_PATH } from "@/lib/legal/agb";
import { voucherEnabled } from "@/lib/commerce/mode";
import { shopActive } from "@/lib/shop/mode";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const LOCALES = ["de", "en", "fr", "it"];
const pageUrl = (locale) => `${SITE_URL}/${locale}/widerruf`;

const META = {
  de: { title: WIDERRUF_TITLE, description: "Widerrufsbelehrung von Platzhirsch Home Living: Rücktrittsrecht für Verbraucher bei Verträgen per E-Mail, Telefon, Video oder zu Hause, Ausnahmen und Muster-Widerrufsformular." },
  en: { title: "Withdrawal information", description: "Withdrawal information of Platzhirsch Home Living: consumers' right of withdrawal for contracts concluded by e-mail, phone, video or at home, exceptions and model form (in German)." },
  fr: { title: "Information sur la rétractation", description: "Information de Platzhirsch Home Living sur le droit de rétractation des consommateurs pour les contrats conclus par e-mail, téléphone, vidéo ou à domicile, exceptions et formulaire type (en allemand)." },
  it: { title: "Informativa sul recesso", description: "Informativa di Platzhirsch Home Living sul diritto di recesso dei consumatori per contratti conclusi per e-mail, telefono, video o a domicilio, eccezioni e modulo tipo (in tedesco)." },
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

function Blocks({ blocks }) {
  return blocks.map((b, i) =>
    typeof b === "string" ? (
      <p key={i}>{b}</p>
    ) : (
      <ul key={i} className="mt-3 list-disc space-y-2 pl-5 marker:text-text-soft">
        {b.ul.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    )
  );
}

export default async function WiderrufPage({ params }) {
  const { locale } = await params;
  const entwurf = WIDERRUF_STATUS === "entwurf";
  const shop = shopActive();
  const gutscheine = voucherEnabled();
  const stand = widerrufStandDe();
  const A = WIDERRUF_ANBIETER;

  return (
    <div data-page="widerruf" data-widerruf-status={WIDERRUF_STATUS}>
      <PageHeader
        width="text"
        breadcrumbs={[{ label: homeCrumbLabel(locale), href: "/" }, { label: germanText(WIDERRUF_TITLE, locale) }]}
        eyebrow={entwurf ? "Entwurf" : undefined}
        title={germanText(WIDERRUF_TITLE, locale)}
        lead={locale !== "de" ? <GermanOnlyNotice locale={locale} /> : germanText(WIDERRUF_SUBTITLE, locale)}
      />
      <LegalProse>
        <p>
          <strong>Stand: {stand}</strong>
          {entwurf && <span className="text-text-soft"> · Entwurf</span>}
        </p>
        <p>
          {A.firma} („{A.marke}“), {A.anschrift}. Diese Belehrung gilt für Verträge, die nicht in unserem Showroom geschlossen werden; sie ergänzt unsere{" "}
          <a href={`/${locale}${AGB_PATH}`}>Allgemeinen Geschäftsbedingungen</a> (Teil II § 7).
        </p>
        <div className="print:hidden">
          <PrintButton />
        </div>

        <nav aria-label="Inhalt" className="mt-8 border-t border-line pt-6 print:hidden" data-widerruf-inhalt="">
          <p className="text-small uppercase tracking-wide text-text-soft">Inhalt</p>
          <ol className="mt-3 space-y-1">
            {[...WIDERRUF_SECTIONS, WIDERRUF_MUSTERFORMULAR].map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        {WIDERRUF_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="mt-10 scroll-mt-24" data-widerruf-abschnitt={s.id}>
            <h2>{s.title}</h2>
            <Blocks blocks={s.blocks} />
            {s.id === "geltung" && (shop || gutscheine) && (
              <p className="text-small text-text-soft">
                Siehe auch:{" "}
                {shop && <a href={`/${locale}${WIDERRUF_SHOP_PATH}`}>Widerrufsbelehrung des Onlineshops</a>}
                {shop && gutscheine && " · "}
                {gutscheine && <a href={`/${locale}/gutscheinbedingungen`}>Gutscheinbedingungen</a>}
              </p>
            )}
            {s.id === "erklaerung" && shop && (
              <p data-widerruf-online="">
                Sie können den Widerruf auch online erklären: <a href={`/${locale}${WIDERRUF_FORMULAR_PATH}`}>Online-Widerrufsformular</a>. Eine Bestellnummer brauchen Sie dafür nicht; Sie erhalten sofort
                eine Eingangsnummer und eine Eingangsbestätigung per E-Mail (§ 13a FAGG).
              </p>
            )}
          </section>
        ))}

        <section id={WIDERRUF_MUSTERFORMULAR.id} className="mt-10 scroll-mt-24" data-widerruf-abschnitt={WIDERRUF_MUSTERFORMULAR.id}>
          <h2>{WIDERRUF_MUSTERFORMULAR.title}</h2>
          <p className="text-small text-text-soft">Anhang I Teil B FAGG. Sie können diese Seite ausdrucken, das Formular ausfüllen und per Post oder als Foto bzw. Scan per E-Mail an uns senden.</p>
          <Blocks blocks={WIDERRUF_MUSTERFORMULAR.blocks} />
        </section>

        <p className="mt-12 border-t border-line pt-6 text-small text-text-soft print:hidden">
          Stand {stand} · <a href={`/${locale}${AGB_PATH}`}>AGB</a> · <a href={`/${locale}/datenschutz`}>Datenschutzerklärung</a> · <a href={`/${locale}/impressum`}>Impressum</a>
        </p>
      </LegalProse>
    </div>
  );
}
