// src/components/UberUns/FactsBlock.js
// „Auf einen Blick“ (GEO W2, SEO-Team A, 31.10.2026): short, quotable facts
// on /ueber-uns/platzhirsch as a visible <dl>. Data only from site.js,
// CAFE_PROFILE and the Claim-Guard (src/lib/seo/aboutFacts.js); the JSON-LD
// stays the one Organization node of the layout (AboutPage → about/mainEntity).
// No founding year, no showroom area, no superlatives.
// Async Server Component; texts: messages seoGeo.facts (server-only).
import { getTranslations } from "next-intl/server";
import { Container, Eyebrow, Heading } from "@/components/ui";
import { EMAIL_HREF, PHONE_HREF } from "@/lib/site";
import { fillVars } from "@/lib/seo/faqSchema";
import { splitBrandHyphens } from "./brandHyphen";
import { keepRangesIn } from "@/components/UberUns/softHyphens";
import { CONTACT, aboutVars, advisoryLanguages, cafeHoursLine, dealerGroups, minottiFact } from "@/lib/seo/aboutFacts";

const LINK = "underline decoration-line-strong underline-offset-4 hover:decoration-current";

const keepBrandHyphens = (text) =>
  splitBrandHyphens(text).map((p, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{p}</span> : p));

export default async function FactsBlock({ locale }) {
  const t = await getTranslations({ locale, namespace: "seoGeo.facts" });
  const r = (key, vars) => fillVars(t.raw(key), vars);
  const vars = keepRangesIn(aboutVars(locale));
  const minotti = minottiFact(locale);
  const groups = dealerGroups(locale);

  const rows = [
    { key: "who", label: t("whoLabel"), value: r("whoText", vars) },
    { key: "where", label: t("whereLabel"), value: r("whereText", vars) },
    minotti && {
      key: "minotti",
      label: t("minottiLabel"),
      value: (
        <>
          {minotti.statement}
          {minotti.evidenceUrl && (
            <>
              {" "}
              <a href={minotti.evidenceUrl} target="_blank" rel="noopener" className={LINK}>
                {t("minottiLink")}
                <span className="sr-only"> ({t("newTab")})</span>
              </a>
            </>
          )}
        </>
      ),
    },
    groups.length > 0 && {
      key: "dealers",
      label: t("dealersLabel"),
      value: (
        <ul className="space-y-2">
          {groups.map((g) => (
            <li key={g.key}>
              <span className="text-text">{t(g.key)}:</span> {keepBrandHyphens(g.text)}
            </li>
          ))}
        </ul>
      ),
    },
    { key: "services", label: t("servicesLabel"), value: t("servicesText") },
    { key: "languages", label: t("languagesLabel"), value: advisoryLanguages(locale) },
    { key: "showroom", label: t("showroomLabel"), value: vars.hours },
    { key: "cafe", label: t("cafeLabel"), value: r("cafeText", { ...vars, hours: cafeHoursLine(locale) }) },
    {
      key: "contact",
      label: t("contactLabel"),
      value: (
        <>
          <a href={PHONE_HREF} className={`tabular ${LINK}`}>
            {CONTACT.phone}
          </a>
          {" · "}
          <a href={EMAIL_HREF} className={`break-all ${LINK}`}>
            {CONTACT.email}
          </a>
        </>
      ),
    },
  ].filter(Boolean);

  return (
    <section aria-labelledby="about-facts" className="border-t border-line" data-about-facts="">
      <Container size="page" className="py-16 md:py-24">
        {/* QM wm-fix4: grid-cols-1 = minmax(0, 1fr) – at 200 % text size an
            implicit auto track grew to the longest word and ran 2 px (row
            34 px) past a 393 px screen. */}
        {/* QM wm-r4 (iPad landscape): the values stood in a narrow last third of
            a 7-column list beside an empty label third. Now the list takes 8 of
            12 columns, the label a fixed 11 rem track (label above the value
            below 24 rem list width, e.g. at 200 % text size). */}
        <div className="grid grid-cols-1 gap-y-8 gap-x-grid @5xl/page:grid-cols-12">
          <div className="@5xl/page:col-span-4">
            <Eyebrow className="mb-stack-s">{t("eyebrow")}</Eyebrow>
            <Heading id="about-facts" level={2}>
              {t("title")}
            </Heading>
          </div>
          <dl className="@container/facts border-t border-line-strong @5xl/page:col-span-8 @5xl/page:col-start-5">
            {rows.map((row) => (
              <div key={row.key} className="grid grid-cols-1 gap-1 border-b border-line py-4 @sm/facts:grid-cols-[11rem_minmax(0,1fr)] @sm/facts:gap-6" data-fact={row.key}>
                <dt className="text-overline uppercase text-text-soft">{row.label}</dt>
                <dd className="max-w-measure text-body text-text">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
