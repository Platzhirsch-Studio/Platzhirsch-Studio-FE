import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/Reusable/JsonLd";
import PageHeader from "@/components/UberUns/PageHeader";
import ImageSlot from "@/components/Arbeitsweise/ImageSlot";
import { Eyebrow, Heading, LinkArrow, Section } from "@/components/ui";
import { teamTrail } from "@/components/Team/team";
import { HARALD } from "@/components/Team/teamCopy";
import { PROFILE_LOCALES, PROFILE_META, PROFILE_URL, profileUrl } from "@/components/Team/haraldProfil";
import { arbeitsweiseCopy } from "@/lib/arbeitsweise/copy";
import { MEDIA, RATIO } from "@/lib/arbeitsweise/media";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { graph, teamPersonSchema } from "@/lib/seo/structuredData";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { ROUTES } from "@/utils/routing";

// Profile page of Harald Menghin (Rat 9,5, B14, seo 2): the author entity for
// the process page and the guides ("Geprüft von"). Only released facts: the
// USP text (Inhaber-Entscheidung Nr. 8, Showroom.abschnitte.haraldText), what
// he does (Arbeitsweise HARALD), the order of the planning. No job title, no
// years, no awards (inhaber-offen A4) – Person schema without jobTitle.
// The 4:5 portrait is MEDIA.portrait (tools/arbeitsweise/import.mjs) and
// stays invisible while empty. All four languages since 31.10.2026 (see
// haraldProfil.js): canonical = own language URL, hreflang = the four
// profile URLs; the Person keeps PROFILE_URL (DE) as its stable `url`.

const IN_LANGUAGE = { de: "de-AT", en: "en-US", fr: "fr-FR", it: "it-IT" };

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!PROFILE_LOCALES.includes(locale)) return {};
  const image = MEDIA.portrait?.src || DEFAULT_OG_IMAGE;
  const { title, description } = PROFILE_META[locale];
  const url = profileUrl(locale);
  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url, languages: hreflangLanguages((l) => profileUrl(l)) },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      siteName: "Platzhirsch Home Living",
      locale: ogLocale(locale),
      images: [{ url: image, alt: MEDIA.portrait?.alt || "Platzhirsch Home Living, Lochau" }],
    },
  };
}

export default async function HaraldProfilPage({ params }) {
  const { locale } = await params;
  if (!PROFILE_LOCALES.includes(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Showroom.abschnitte" });
  const c = arbeitsweiseCopy(locale);
  const intro = t.has("haraldText") ? t("haraldText") : c.HARALD.text;
  const trail = [...teamTrail(locale).slice(0, -1), { label: teamTrail(locale).at(-1).label, href: ROUTES.team[locale] || ROUTES.team.de }, { label: HARALD }];
  const person = teamPersonSchema({ name: HARALD, locale, pageUrl: PROFILE_URL, description: intro });
  const portrait = MEDIA.portrait;
  const pageUrl = profileUrl(locale);
  const steps = c.STEPS.filter((s) => s.n >= 3 && s.n <= 6);

  const schema = graph(
    {
      "@type": "ProfilePage",
      "@id": `${pageUrl}/#webpage`,
      url: pageUrl,
      name: HARALD,
      inLanguage: IN_LANGUAGE[locale],
      isPartOf: { "@id": "https://platzhirsch.studio/#website" },
      breadcrumb: { "@id": `${pageUrl}/#breadcrumb` },
      ...(person ? { mainEntity: { "@id": person["@id"] } } : {}),
    },
    breadcrumbJsonLd(trail, locale, { id: `${pageUrl}/#breadcrumb`, context: false }),
    ...(person ? [{ ...person, ...(portrait?.src ? { image: `https://platzhirsch.studio${portrait.src}` } : {}) }] : [])
  );

  return (
    <div>
      <JsonLd data={schema} />
      <PageHeader
        breadcrumbs={trail}
        eyebrow={c.HARALD.overline}
        title={HARALD}
        lead={intro}
        media={portrait?.src ? <ImageSlot slot={portrait} kind="" ratio={RATIO.portrait} locale={locale} sizes="(min-width: 1024px) 40vw, 100vw" /> : undefined}
      />

      <Section tone="band" spacing="compact" labelledBy="harald-tut">
        <Heading id="harald-tut" level={2} className="max-w-[20ch]">
          {c.HARALD.does.map((d) => d.word).join(". ")}.
        </Heading>
        <ul className="mt-stack-m grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-grid">
          {c.HARALD.does.map((d) => (
            <li key={d.word} className="border-t border-line-strong pt-4">
              <p className="font-display text-title text-text">{d.word}</p>
              <p className="mt-2 max-w-[32ch] text-body text-text-soft">{d.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-measure text-body text-text">{c.HARALD.text}</p>
      </Section>

      <Section tone="surface" spacing="compact" labelledBy="harald-schritte">
        <Eyebrow className="mb-stack-s">{c.UEBERSICHT.overline}</Eyebrow>
        <Heading id="harald-schritte" level={2} className="max-w-[20ch]">
          {c.HERO.title}
        </Heading>
        <ol className="mt-stack-m flex flex-col gap-y-1">
          {steps.map((s) => (
            <li key={s.id}>
              <LinkArrow href={`/arbeitsweise#${s.id}`} locale={locale}>
                {`${String(s.n).padStart(2, "0")} ${s.name}`}
              </LinkArrow>
            </li>
          ))}
        </ol>
        <p className="mt-stack-m flex flex-col items-start gap-1">
          <LinkArrow href={c.APPOINTMENT.href} locale={locale}>
            {c.APPOINTMENT.label}
          </LinkArrow>
          <LinkArrow href={ROUTES.team[locale] || ROUTES.team.de} locale={locale}>
            {c.HARALD.teamLink.label}
          </LinkArrow>
        </p>
      </Section>
    </div>
  );
}

export const revalidate = 3600;
