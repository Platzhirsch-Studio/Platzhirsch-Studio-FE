// /<locale>/service/reklamation – Reklamation melden (DE/EN/FR/IT, index, follow,
// hreflang reziprok). Formular: src/components/Service/Reklamation/ReklamationForm.js,
// Prüfung src/lib/service/reklamation/schema.js, Versand über
// /<locale>/service/senden/reklamation (ph: ph_service.api.create_service_case;
// alt: Anfrage über create_contact mit „Art: Reklamation“).
// Fotos/Videos: nach dem Absenden über den Handy-Upload (nur DE, nur solange er
// Dateien annimmt), sonst Hinweis auf die E-Mail-Adresse.
// Verlinkt im Footer (Spalte Service) und auf /pflege-service.
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Container, Eyebrow, Heading } from "@/components/ui";
import ReklamationForm from "@/components/Service/Reklamation/ReklamationForm";
import { REKLAMATION_LOCALES, REKLAMATION_PATH, reklamationCopy } from "@/lib/service/reklamation/copy";
import { buildPageMetadata, titleWithSuffix } from "@/lib/seo/pageMetadata";
import { uploadsAccepting } from "@/lib/upload/config";
import { EMAIL, PHONE_DISPLAY } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!REKLAMATION_LOCALES.includes(locale)) return {};
  const c = reklamationCopy(locale);
  return buildPageMetadata({ locale, pathByLocale: REKLAMATION_PATH, title: titleWithSuffix(c.metaTitle), description: c.metaDescription });
}

export default async function ReklamationPage({ params }) {
  const { locale } = await params;
  if (!REKLAMATION_LOCALES.includes(locale)) notFound();
  setRequestLocale(locale);
  const c = reklamationCopy(locale);
  const upload = locale === "de" && uploadsAccepting();
  return (
    <Container size="page" className="pt-8 pb-16 md:pt-16 md:pb-24" data-page="service-reklamation">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <Heading level={1} className="mt-stack-s text-balance">
            {c.title}
          </Heading>
          <p className="mt-stack-s max-w-measure text-body text-pretty text-text-soft">{c.intro}</p>
          <h2 className="mt-10 text-title text-text">{c.stepsTitle}</h2>
          <ol className="mt-4 space-y-3">
            {c.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-body text-text">
                <span aria-hidden="true" className="tabular-nums text-text-soft">
                  {i + 1}.
                </span>
                <span className="text-pretty">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="min-w-0 lg:col-span-7 lg:col-start-6">
          <ReklamationForm locale={locale} copy={c} phone={PHONE_DISPLAY} email={EMAIL} upload={upload} />
        </div>
      </div>
    </Container>
  );
}
