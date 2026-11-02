import { useTranslations } from "next-intl";
import { Heading, Section } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import useInhalt from "@/components/UberUns/inhalt/useInhalt";
import Newsletter from "./newsletter";

// Newsletter page body (server component): what subscribers receive (only
// what exists – no "exclusive discounts", UWG audit P3), then the form
// island. No overlay, no pre-ticked box, no incentive tied to consent.
// Welle 2 (Kundenbetreuung): `archiv` = there is at least one sent issue
// (archivAusgaben(), passed by the page; German archive only) → link
// "Bisherige Ausgaben ansehen". Without a sent issue no link (empty archive).
/** Form labels for the island (server side, no translation fallback in the browser). */
export function useNewsletterLabels() {
  const { t } = useInhalt("newsletter");
  const legacy = useTranslations("newsletter");
  return {
    emailLabel: t("emailLabel"),
    submit: t("submit"),
    sending: t("sending"),
    success: t("success"),
    errors: {
      invalid: legacy("errInvalid"),
      already: legacy("errAlready"),
      generic: legacy("errGeneric"),
    },
  };
}

/**
 * QM content-legal r3 (desktop): the sign-up stands in the page opening, next to
 * the photo – the opening had three lines of text beside a 600 px picture and the
 * form only came after 170 px of empty band. Used by newsletterbanner.js.
 */
export function NewsletterSignup() {
  const { t } = useInhalt("newsletter");
  const labels = useNewsletterLabels();
  return (
    <div className="w-full max-w-[34rem] border-t border-line-strong pt-6">
      <Heading id="newsletter-form" level={2} size="title">
        {t("formTitle")}
      </Heading>
      <div className="mt-4">
        <Newsletter labels={labels} />
      </div>
      <p className="mt-4 text-small text-text-soft">
        {t("privacyText")}{" "}
        <Link href="/datenschutz" className="underline decoration-line-strong underline-offset-4 hover:decoration-current">
          {t("privacyLink")}
        </Link>
        .
      </p>
    </div>
  );
}

export default function NewsletterContent({ archiv = false }) {
  const { t, raw } = useInhalt("newsletter");

  return (
    // QM r3: what subscribers get and how to unsubscribe, side by side, compact band.
    <Section tone="band" spacing="compact" labelledBy="newsletter-reasons">
      <div className="grid grid-cols-1 gap-y-12 gap-x-grid lg:grid-cols-12">
        {/* Optik QA: on the page grid like the header (no xl indent). */}
        <div className="lg:col-span-6">
          <Heading id="newsletter-reasons" level={2} size="title">
            {t("reasonsTitle")}
          </Heading>
          <ul className="mt-4 divide-y divide-line border-y border-line text-body text-text">
            {(raw("reasons") || []).map((reason) => (
              <li key={reason} className="py-3">
                {reason}
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <h3 className="text-title text-text">{t("howTitle")}</h3>
          <p className="mt-3 max-w-measure text-body text-text-soft">{t("howText")}</p>
          {archiv && (
            <p className="mt-stack-s">
              <Link href="/newsletter/archiv" locale="de" hrefLang="de" className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current">
                {t("archivLink")}
              </Link>
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
