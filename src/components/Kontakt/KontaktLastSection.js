// Closing section of the contact page: the existing "ContactSection" text
// (kept for content and search) in a quiet text column, then the Leitsatz
// and the way to an appointment. Server component, no image (the old
// question-mark stock graphic is gone: Bibel §7, no decoration).
import { useLocale, useTranslations } from "next-intl";
import { Button, Eyebrow, Heading, Leitsatz, Section } from "@/components/ui";
import { ROUTES } from "@/utils/routing";
import { contactCopy } from "./copy";

export default function KontaktLastSection() {
  const locale = useLocale();
  const t = useTranslations("ContactSection");
  const tContact = useTranslations("contact");
  const paragraphs = t.has("paragraphs") ? t.raw("paragraphs") : [];
  const title = String(t("title")).replace(/\s*\n\s*/g, " ");

  return (
    // QM content-legal r2 (iPad hoch): the centred text container stood ~96 px in
    // from the page grid – page container, text column left-aligned with the form above.
    // QM r3 (laptop): compact – the three sections were separated by 170–200 px empty bands.
    <Section tone="raised" spacing="compact" contained="page" labelledBy="kontakt-gespraech-title">
      <div className="max-w-text">
      <Eyebrow className="mb-stack-s">{t("pretitle")}</Eyebrow>
      <Heading id="kontakt-gespraech-title" level={2}>
        {title}
      </Heading>
      <div className="mt-stack-m space-y-4">
        {Array.isArray(paragraphs) &&
          paragraphs.map((paragraph, idx) => (
            <p key={idx} className="max-w-measure text-body text-text-soft">
              {paragraph}
            </p>
          ))}
      </div>
      <Leitsatz size="m" align="start" className="mt-stack-m" />
      <div className="mt-stack-m">
        <Button href={ROUTES.beratung[locale] || "/beratung"} variant="secondary" arrow>
          {contactCopy(tContact, locale, "consultCta")}
        </Button>
      </div>
      </div>
    </Section>
  );
}
