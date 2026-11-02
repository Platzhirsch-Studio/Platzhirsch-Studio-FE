"use client";

import { forwardRef } from "react";
import { ArrowUpRight, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import cx from "@/components/ui/cx";
import { DIRECTIONS_URL, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { SuccessIcon } from "@/components/Forms/FormField";
import { confirmationStep1 } from "./confirmationCopy";

// Confirmation after a sent Beratungs- or Kontaktanfrage (r7-p1, ux P1-6).
//   "Danke, {Vorname}." · what we received · three next steps (call to arrange
//   the appointment, talk in Lochau over a coffee, on request at the client's
//   place – Kern-USP Nr. 8) · what to bring · phone · "So arbeiten wir" and
//   the route.
// No reply deadline: the owner has not decided one (Inhaber-offen Nr. 23).
// Runde 5 (ux P1-1): step 1 follows the contact way – with a phone number
// "Wir rufen Sie an …", without one "Wir melden uns per E-Mail …"
// (confirmationCopy.js, 4 languages).
// The wrapper keeps the contract of the former FormSuccess: role="status",
// tabIndex=-1, gets focus after the send (tests/e2e/forms-leads.spec.js).
// Texts: forms.confirmation.* in src/messages/{de,en,fr,it}.json.

const linkClass =
  "group inline-flex min-h-11 items-center gap-1 text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) ease-quiet hover:decoration-current";
// Motion: the external-link arrow nudges 2 px up-right on hover (transform only, never when calm).
const arrowNudge =
  "motion-safe:transition-transform motion-safe:duration-(--duration-micro) motion-safe:ease-quiet motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5";

/**
 * @param {string} [name]       first name ("" → "Danke.")
 * @param {"beratung"|"kontakt"} [kind]
 * @param {Array<{label: string, value: string}>} [summary]  rows of "Ihre Angaben" (empty values are skipped)
 * @param {string} [phone]      phone number the visitor gave ("" → e-mail variant)
 * @param {ReactNode} [children] upload card, "Neue Anfrage"
 */
const Confirmation = forwardRef(function Confirmation({ name = "", kind = "beratung", summary = [], phone = "", children, className }, ref) {
  const t = useTranslations("forms.confirmation");
  const locale = useLocale();
  const rows = summary.filter((r) => r && String(r.value || "").trim());
  const first = String(name || "").trim().split(/\s+/)[0];
  const steps = [confirmationStep1(locale, { kind, phone }), t("step2"), t("step3")];

  // Design-Jury P2-22: scroll-mt-2 – the box lands 96 px from the top
  // (scroll-padding 88 px + 8 px), not flush under the header.
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      data-confirmation={kind}
      data-contact-way={String(phone || "").trim() ? "phone" : "email"}
      className={cx("ph-arrive scroll-mt-2 border-t-2 border-success bg-surface-raised p-6 focus-visible:outline-none sm:p-8", className)}
    >
      {/* Design-Jury P2-6: the same drawn tick as FormSuccess, centred on the first title line. */}
      <h2 className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 font-display text-[2rem] leading-[1.1] text-text sm:text-display-m">
        <SuccessIcon className="mt-[calc(0.55em-10px)] text-success" />
        <span className="text-balance">{first ? t("title", { name: first }) : t("titleNoName")}</span>
      </h2>
      <p className="mt-2 text-body text-text-soft">{kind === "kontakt" ? t("leadContact") : t("lead")}</p>

      {rows.length > 0 && (
        <>
          <h3 className="mt-6 text-overline uppercase text-text-accent">{t("summaryTitle")}</h3>
          <dl className="mt-2 grid gap-x-6 gap-y-1 text-body sm:grid-cols-[auto_1fr]">
            {rows.map((r) => (
              <div key={r.label} className="contents">
                <dt className="text-text-soft">{r.label}</dt>
                <dd className="min-w-0 break-words text-text">{r.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      <h3 className="mt-6 text-overline uppercase text-text-accent">{t("nextTitle")}</h3>
      <ol className="mt-2 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="grid grid-cols-[1.75rem_1fr] text-body text-text">
            {/* Design-Jury P2-12: no Bodoni below 32 px – Instrument 500, tabular figures. */}
            <span aria-hidden="true" className="font-medium text-text-accent tabular-nums">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-body text-text-soft">{t("bring")}</p>

      <p className="mt-6 flex flex-wrap items-center gap-x-2 text-body text-text">
        {t("urgent")}
        <a href={PHONE_HREF} className={cx(linkClass, "tabular")}>
          <Phone aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.5} />
          {PHONE_DISPLAY}
        </a>
      </p>
      <p className="mt-2 flex flex-wrap gap-x-6">
        {/* Rat 9,5 A1 (UX7): /arbeitsweise in the visitor's language (all four
            exist), no "(in German)" note any more (forms.confirmation.processLang
            is proposed for deletion in rat95-t1-messages.json). */}
        <Link href="/arbeitsweise" className={linkClass}>
          {t("process")}
        </Link>
        <a href={DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {t("directions")}
          <ArrowUpRight aria-hidden="true" className={cx("size-4", arrowNudge)} strokeWidth={1.5} />
          <span className="sr-only"> {t("opensNewTab")}</span>
        </a>
      </p>

      {children && <div className="mt-6 space-y-6">{children}</div>}
    </div>
  );
});

export default Confirmation;
