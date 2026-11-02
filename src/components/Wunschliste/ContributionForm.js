"use client";
// „Gutschein beitragen“ im Anfrage-Weg (VOUCHER_MODE off/anfrage): Es wird
// nichts bezahlt; der Beitrag wird bei der Liste gespeichert und das Studio
// meldet sich persönlich (Frappe, sobald angebunden; in der Entwicklung nur
// .data/wunschliste). Felder: Betrag (Vorschlag, optional), Name, E-Mail
// (nur Studio), Gruß, FREIWILLIGE Einwilligung „Name und Gruß dürfen
// angezeigt werden“ (nie vorangekreuzt; ohne Häkchen erscheint der Beitrag
// ohne Namen und Gruß – Art. 7 Abs. 4 DSGVO, QA Recht P1-1). Widerruf per
// E-Mail ans Studio. Fehler am Feld + Zusammenfassung (Bibel §14).
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import FormField from "@/components/Forms/FormField";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { focusField, useHydrated } from "@/components/Forms/useFormGuard";
import { LIMITS, REPORT_EMAIL, WUNSCHLISTE_INHABER } from "@/lib/wunschliste/config";
import { formatAmount } from "@/lib/wunschliste/copy";
import { postJson } from "./client";
import useWlCopy from "./useWlCopy";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER = ["amount", "name", "email", "message"];

export function validateContribution(form) {
  const errors = {};
  if (form.amount.trim()) {
    const n = Number(form.amount.replace(/[\s€]/g, "").replace(",", "."));
    const min = WUNSCHLISTE_INHABER.contributionMin || 1;
    if (!Number.isInteger(n) || n < min || n > LIMITS.contributionMax) errors.amount = "amount";
  }
  if (form.name.trim().length < 2) errors.name = "name";
  if (!EMAIL_RE.test(form.email.trim())) errors.email = "email";
  return errors;
}

export default function ContributionForm({ shareId }) {
  const { locale, c } = useWlCopy();
  const uid = useId();
  const id = (n) => `${uid}-b-${n}`;
  const min = WUNSCHLISTE_INHABER.contributionMin;
  const amountHint = min ? `${c("public.amountHint")} ${c("public.amountMin", { amount: formatAmount(min, locale) })}` : c("public.amountHint");
  const hydrated = useHydrated();
  const [form, setForm] = useState({ amount: "", name: "", email: "", message: "", consent: false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef(null);
  const formRef = useRef(null);
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  };
  const err = (n) => (errors[n] ? c(`errors.${errors[n]}`) : undefined);

  async function submit(e) {
    e.preventDefault();
    const found = validateContribution(form);
    setErrors(found);
    const invalid = ORDER.filter((k) => found[k]);
    if (invalid.length) {
      setStatus({ type: "summary", title: c("share.summaryTitle"), items: invalid.map((k) => ({ id: id(k), text: c(`errors.${found[k]}`) })) });
      focusField(id(invalid[0]));
      return;
    }
    setBusy(true);
    setStatus(null);
    const website = formRef.current?.elements?.namedItem?.("website")?.value || "";
    const res = await postJson(`/api/wunschliste/${shareId}/beitrag`, { ...form, amount: form.amount.trim() || null, consent: form.consent === true, website });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      return;
    }
    if (res.error === "invalid" && Array.isArray(res.fields)) {
      const fe = Object.fromEntries(res.fields.filter((f) => ORDER.includes(f)).map((f) => [f, f]));
      setErrors(fe);
    }
    setStatus({ type: "error", text: c(`errors.${["rate_limited", "network", "not_found", "unavailable"].includes(res.error) ? res.error : "generic"}`) });
  }

  if (done) {
    return <FormSuccess ref={doneRef} title={c("public.voucherDone")} />;
  }

  return (
    <form ref={formRef} method="post" noValidate onSubmit={submit} className="relative space-y-6">
      <Honeypot id={id("hp")} />
      <p className="max-w-measure text-body text-text">{c("public.voucherFormIntro")}</p>
      <FormField
        id={id("amount")}
        name="amount"
        inputMode="numeric"
        label={c("public.amount")}
        optionalText={c("share.optional")}
        hint={amountHint}
        value={form.amount}
        onChange={(e) => set("amount", e.target.value)}
        error={err("amount")}
        className="max-w-xs"
        controlClassName="tabular"
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id={id("name")} name="name" label={c("public.name")} required autoComplete="name" maxLength={LIMITS.name} value={form.name} onChange={(e) => set("name", e.target.value)} error={err("name")} />
        <FormField
          id={id("email")}
          name="email"
          type="email"
          label={c("public.email")}
          required
          autoComplete="email"
          maxLength={LIMITS.email}
          hint={c("public.emailHint")}
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          error={err("email")}
        />
      </div>
      <FormField id={id("message")} name="message" as="textarea" label={c("public.greeting")} optionalText={c("share.optional")} maxLength={LIMITS.message} value={form.message} onChange={(e) => set("message", e.target.value)} />
      <div>
        <label htmlFor={id("consent-box")} className="flex cursor-pointer items-start gap-3 text-body text-text">
          <input
            id={id("consent-box")}
            type="checkbox"
            name="consent"
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
            aria-describedby={`${id("consent")}-hint`}
            className="mt-1 size-5 flex-none accent-ink"
          />
          <span>{c("public.consent")}</span>
        </label>
        <p id={`${id("consent")}-hint`} className="mt-1 pl-8 text-small text-text-soft">
          {c("public.consentHint", { email: REPORT_EMAIL })}
        </p>
      </div>
      <FormPrivacyNote />
      <FormAlert status={status} />
      <Button type="submit" disabled={!hydrated || busy} aria-busy={busy || undefined} className="w-full sm:w-auto">
        {c("public.voucherSubmit")}
      </Button>
    </form>
  );
}
