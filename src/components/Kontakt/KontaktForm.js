"use client";
// Kontaktformular (Neuauftritt). Payload unchanged since Runde 1:
//   { name, company, email_address, telefon, ihre_nachricht }
// plus the contract fields `website` (honeypot) and `_t` (ms since render),
// sent through /api/upload/inquiry/kontakt (→ /api/kontakt) so the answer
// carries the upload ticket for <UploadHandoff>.
// Errors: at the field (aria-invalid/-describedby), focus on the first bad
// field, summary in a polite live region; request errors show the translated
// `code` (src/lib/forms/i18n.js), never the English `error`.
//
// R5-leads-perf (TBT ≤ 200 ms on /de/kontakt):
// - <UploadHandoff> (and with it lib/upload/config.js, lib/upload/messages.js
//   and its icons) is loaded only after a successful send (next/dynamic +
//   import() for handoffFrom, Forms/lazyHandoff.js); the chunk is
//   prefetched on focus in the form, so the card appears without a wait.
// - Static parts come from the server: kontakt.js passes the privacy note and
//   the Selbstauskunft select as props (no client render work, same HTML).
// - trackLead("kontakt", { transaction_id: result.leadRef }) explicitly.
// - Selbstauskunft (optional): the chosen code goes through postForm's
//   `lead.selfReport` into the Herkunft text block, never as an API field.
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { trackLead } from "@/lib/analytics";
import { firstError, isEmail, isPhone, postForm } from "@/lib/forms/client";
import FormField from "@/components/Forms/FormField";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { FormAlert } from "@/components/Forms/FormAlert";
import Confirmation from "@/components/Beratung/Confirmation";
import { revealConfirmation } from "@/lib/forms/reveal";
import useFormGuard, { focusField, useHydrated, useServerFieldError } from "@/components/Forms/useFormGuard";
import useFormText from "@/components/Forms/useFormText";
import { UploadHandoff, handoffAfterSend, prefetchHandoff } from "@/components/Forms/lazyHandoff";
import { selfReportFrom } from "@/lib/forms/selfReport";

const EMPTY = { name: "", company: "", email_address: "", telefon: "", ihre_nachricht: "" };
const ORDER = ["name", "email_address", "telefon", "ihre_nachricht", "company"];
const IDS = {
  name: "kontakt-name",
  company: "kontakt-company",
  email_address: "kontakt-email",
  telefon: "kontakt-telefon",
  ihre_nachricht: "kontakt-nachricht",
};

/**
 * @param {ReactNode} [privacyNote]  server-rendered <FormPrivacyNote/> (else rendered here)
 * @param {ReactNode} [selfReport]   server-rendered <SelfReportField/> (optional field)
 */
export default function KontaktForm({ privacyNote, selfReport } = {}) {
  const t = useTranslations("contact");
  const tEnquiry = useTranslations("enquiry");
  const { text, errorText, locale } = useFormText();
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const serverError = useServerFieldError();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const successRef = useRef(null);
  // What was sent, for the confirmation (r7-p1, ux P1-6; the form resets).
  const [summary, setSummary] = useState(null);

  const validate = (name, values) => {
    const value = String(values[name] ?? "");
    switch (name) {
      case "name":
        return value.trim().length >= 2 ? null : t("formErrorName");
      case "email_address":
        return isEmail(value) ? null : t("formErrorMail");
      case "telefon":
        return !value.trim() || isPhone(value) ? null : t("formErrorPhone");
      case "ihre_nachricht":
        return value.trim().length >= 10 ? null : t("formErrorMsg");
      default:
        return null;
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    // Errors already shown update while typing; new ones only on blur (§9).
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validate(name, next) }));
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    // An untouched empty field is not an error yet (no scolding on Tab).
    if (!touched[name] && !value) return;
    // A server-rejected value keeps its error until it is changed.
    if (serverError.holds(name, value)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, form) }));
  };

  const showErrors = (found) => {
    setErrors(found);
    setTouched(Object.fromEntries(ORDER.map((k) => [k, true])));
    const items = ORDER.filter((k) => found[k]).map((k) => ({ id: IDS[k], text: found[k] }));
    setStatus({ type: "summary", title: text("summary", { count: items.length }), items });
    focusField(IDS[firstError(found, ORDER)]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    serverError.clear();
    const found = {};
    for (const k of ORDER) {
      const message = validate(k, form);
      if (message) found[k] = message;
    }
    if (Object.keys(found).length) return showErrors(found);

    setLoading(true);
    setStatus(null);
    const formEl = e.currentTarget;
    const self = selfReportFrom(formEl);
    const result = await postForm("/api/upload/inquiry/kontakt", guard(form, formEl), self ? { lead: { selfReport: self } } : undefined);
    setLoading(false);

    if (!result.ok) {
      // 400 with `field`: show it at the field the server named.
      if (result.code === "invalid" && result.field && IDS[result.field]) {
        serverError.set(result.field, form[result.field]);
        return showErrors({ [result.field]: validate(result.field, form) || text("field.check") });
      }
      setStatus({ type: "error", text: errorText(result.code) });
      return;
    }

    trackLead("kontakt", { transaction_id: result.leadRef });
    const email = form.email_address;
    const msg = form.ihre_nachricht.trim();
    setSummary({
      name: form.name,
      phone: form.telefon,
      rows: [
        { label: text("confirmation.message"), value: msg.length > 160 ? `${msg.slice(0, 159).trimEnd()}…` : msg },
        { label: text("confirmation.contactWay"), value: [form.telefon, email].filter(Boolean).join(" · ") },
      ],
    });
    // Without the chunk (offline) the success message stays on its own.
    handoffAfterSend("kontakt", { email, result: result.data, locale }).then(setHandoff);
    setForm(EMPTY);
    setErrors({});
    setTouched({});
    setSent(true);
    // Rat 9,5 A3 (UX2): bring the confirmation into view (iPhone: top >= 0), focus without a jump.
    requestAnimationFrame(() => revealConfirmation(successRef.current));
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <Confirmation ref={successRef} kind="kontakt" name={summary?.name} phone={summary?.phone} summary={summary?.rows}>
          {handoff && <UploadHandoff {...handoff} onClose={() => setHandoff(null)} />}
          <Button
            variant="link"
            onClick={() => {
              setSent(false);
              setHandoff(null);
              setSummary(null);
              focusField(IDS.name);
            }}
          >
            {text("newRequest")}
          </Button>
        </Confirmation>
      </div>
    );
  }

  const field = (name, props) => ({
    id: IDS[name],
    name,
    value: form[name],
    onChange,
    onBlur,
    error: errors[name] || undefined,
    ...props,
  });

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      onFocus={() => prefetchHandoff(locale)}
      noValidate
      aria-describedby="kontakt-pflicht"
      className="relative space-y-6"
    >
      <FormAlert status={status} />
      <p id="kontakt-pflicht" className="text-small text-text-soft">
        {text("requiredHint")}
      </p>

      <FormField {...field("name", { label: t("formName"), required: true, type: "text", autoComplete: "name" })} />
      {/* QM r3 (laptop): the e-mail field gets the full row – at half width real
          addresses were cut („maria.muster-beispiel@examp…“); phone and company share one. */}
      <FormField
        {...field("email_address", {
          label: t("formMail"),
          required: true,
          type: "email",
          inputMode: "email",
          autoComplete: "email",
          spellCheck: false,
        })}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          {...field("telefon", {
            label: t("formPhone"),
            optionalText: text("optional"),
            type: "tel",
            inputMode: "tel",
            autoComplete: "tel",
          })}
        />
        <FormField
          {...field("company", {
            label: t("formCompany"),
            optionalText: text("optional"),
            type: "text",
            autoComplete: "organization",
          })}
        />
      </div>
      <FormField {...field("ihre_nachricht", { as: "textarea", label: t("formMessage"), required: true, rows: 6 })} />
      {selfReport}

      <Honeypot id="kontakt-website" />

      <div className="space-y-4">
        <Button type="submit" variant="primary" arrow={!loading} fullWidth disabled={!hydrated || undefined}
          aria-disabled={loading || undefined}
          className="sm:w-auto"
        >
          {loading ? text("sending") : tEnquiry("sendMessage")}
        </Button>
        {privacyNote ?? <FormPrivacyNote />}
      </div>
    </form>
  );
}
