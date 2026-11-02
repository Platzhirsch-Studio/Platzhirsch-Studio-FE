// JobPosting + BreadcrumbList JSON-LD for one job detail page. Shared by the
// four per-language copies (ueber-uns/karriere, about-us/career,
// a-propos/carriere, chi-siamo/carriera) so they can't drift apart.
import JsonLd from "@/components/Reusable/JsonLd";
import { localeUrl } from "@/lib/seo/pageMetadata";
import { breadcrumbList, graph, jobPostingSchema } from "@/lib/seo/structuredData";
import { ROUTES } from "@/utils/routing";
import { localizedTitle } from "@/lib/karriere/stellen";

const HOME_LABEL = { de: "Startseite", en: "Home", fr: "Accueil", it: "Home" };
const CAREER_LABEL = { de: "Karriere", en: "Career", fr: "Carrière", it: "Carriera" };

export default function JobPostingJsonLd({ job, locale }) {
  if (!job) return null;
  const careerPath = ROUTES.karriere[locale] || ROUTES.karriere.de;
  const url = localeUrl(locale, `${careerPath}/${job.slug}`);

  return (
    <JsonLd
      data={graph(
        jobPostingSchema({ job, locale, url }),
        breadcrumbList(
          [
            { name: HOME_LABEL[locale] || HOME_LABEL.de, url: localeUrl(locale) },
            { name: CAREER_LABEL[locale] || CAREER_LABEL.de, url: localeUrl(locale, careerPath) },
            { name: localizedTitle(job, locale) },
          ],
          `${url}#breadcrumb`
        )
      )}
    />
  );
}
