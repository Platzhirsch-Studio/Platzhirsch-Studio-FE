import { useTranslations } from "next-intl";
import FormField from "./FormField";
import { SELF_REPORT_CODES, SELF_REPORT_NAME, SELF_REPORT_TEXT } from "@/lib/forms/selfReport";

/**
 * Optional select "Wie sind Sie auf uns aufmerksam geworden?" (AP3 Nr. 3,
 * R5-leads-perf). Sends nothing itself: the form reads the chosen code
 * (selfReportFrom(form) or its own state) and passes it to
 * postForm(…, { lead: { selfReport } }); it ends up as one line of the
 * Herkunft text block. Texts: forms.selfReport.* from the messages; a
 * missing key falls back to German (SELF_REPORT_TEXT.de). Server-safe (no state):
 * Kontakt renders it on the server and hands it to the client form, so it
 * costs no client render work there. Uncontrolled unless `value`/`onChange`
 * are passed (Beratung keeps it across steps).
 * @param {string} id
 * @param {string} [optionalText] e.g. forms.optional
 */
export default function SelfReportField({ id, optionalText, className, ...props }) {
  const t = useTranslations("forms");
  const fallback = SELF_REPORT_TEXT.de;
  const get = (key, fb) => (t.has(`selfReport.${key}`) ? t(`selfReport.${key}`) : fb);
  return (
    <FormField
      id={id}
      as="select"
      name={SELF_REPORT_NAME}
      label={get("label", fallback.label)}
      optionalText={optionalText ?? (t.has("optional") ? t("optional") : "optional")}
      className={className}
      {...(props.value === undefined ? { defaultValue: "" } : {})}
      {...props}
    >
      <option value="">{get("empty", fallback.empty)}</option>
      {SELF_REPORT_CODES.map((code) => (
        <option key={code} value={code}>
          {get(`options.${code}`, fallback.options[code])}
        </option>
      ))}
    </FormField>
  );
}
