"use client";
// Formular des Empfehlungsprogramms (/[locale]/empfehlen), zwei Rollen:
//   role="empfehler" – Kundin/Kunde fordert den persönlichen Code an
//   role="empfohlen" – die empfohlene Person meldet sich SELBST
// Beide senden über /api/kontakt (Lead-Mechanismus: Herkunftsblock mit
// „Kontext: Empfehlungsprogramm · …“, lib/kundenbetreuung/empfehlung.js).
// Es gibt bewusst KEIN Feld für die Adresse einer dritten Person.
// Der Code geht nur mit dem freiwilligen, nicht vorangekreuzten Häkchen mit.
//
// Barrierefreiheit wie AdventsabendForm (WCAG 2.2 AA, Bibel §9/§14):
// sichtbare Labels, Prüfung beim Verlassen, Fehler am Feld plus
// Zusammenfassung (FormAlert), Fokus auf erstes Fehlerfeld bzw. Bestätigung.
// Felder 52 px, Schrift 16 px, ein Primärknopf.
import { useEffect, useRef, useState } from "react";
import { trackLead } from "@/lib/analytics";
import { isEmail, isPhone, postForm } from "@/lib/forms/client";
import { normalizeReferralCode, referralLead, referralPayload } from "@/lib/kundenbetreuung/empfehlung";
import { fill } from "@/lib/kundenbetreuung/empfehlenContent";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import useFormGuard, { focusField, useHydrated, useServerFieldError } from "@/components/Forms/useFormGuard";
import useFormText from "@/components/Forms/useFormText";

const labelClass = "block text-ui text-text";
const hintClass = "mt-2 text-small text-text-soft";
const fieldBase =
  "mt-2 block w-full border bg-surface px-4 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet placeholder:text-text-soft";
const fieldClass = (invalid) => `${fieldBase} h-13 ${invalid ? "border-2 border-error" : "border-line-control"}`;

const FIELDS = {
  empfehler: ["name", "email", "telefon"],
  empfohlen: ["name", "email", "telefon", "code", "nachricht"],
};

function validate(name, form, role, t) {
  const v = String(form[name] ?? "").trim();
  switch (name) {
    case "name":
      return v.length < 2 ? t.errName : null;
    case "email":
      return isEmail(v) ? null : t.errEmail;
    case "telefon":
      return v && !isPhone(v) ? t.errTelefon : null;
    case "code":
      return v && !normalizeReferralCode(v) ? t.errCode : null;
    case "nachricht":
      return role === "empfohlen" && v.length < 10 ? t.errAnliegen : null;
    default:
      return null;
  }
}

function ErrorLine({ id, text }) {
  if (!text) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-small text-error">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="mt-0.5 flex-none">
        <circle cx="12" cy="12" r="9.25" />
        <path d="M12 7.5v5.5M12 16.25v.25" />
      </svg>
      <span>{text}</span>
    </p>
  );
}

/**
 * @param {{ role: "empfehler"|"empfohlen", copy: object, initialCode?: string, idPrefix?: string }} props
 *   copy = empfehlenCopy(locale).form
 */
export default function EmpfehlungForm({ role, copy: t, initialCode = "", idPrefix }) {
  const p = idPrefix || (role === "empfehler" ? "emp-a" : "emp-b");
  const ids = {
    name: `${p}-name`,
    email: `${p}-email`,
    telefon: `${p}-telefon`,
    kundennummer: `${p}-kundennummer`,
    code: `${p}-code`,
    consent: `${p}-consent`,
    nachricht: `${p}-nachricht`,
  };
  const empty = { name: "", email: "", telefon: "", kundennummer: "", code: initialCode || "", consent: false, nachricht: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const successRef = useRef(null);
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const serverError = useServerFieldError();
  const { errorText } = useFormText();
  const order = FIELDS[role];

  useEffect(() => {
    if (status?.type === "success") successRef.current?.focus();
  }, [status]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = { ...form, [name]: type === "checkbox" ? checked : value };
    setForm(next);
    if (touched[name] && order.includes(name)) setErrors((prev) => ({ ...prev, [name]: validate(name, next, role, t) }));
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    if (!order.includes(name)) return;
    if (serverError.holds(name, value)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, form, role, t) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    serverError.clear();
    const found = {};
    for (const f of order) {
      const m = validate(f, form, role, t);
      if (m) found[f] = m;
    }
    setErrors(found);
    setTouched(Object.fromEntries(order.map((f) => [f, true])));
    if (Object.keys(found).length) {
      const items = order.filter((f) => found[f]).map((f) => ({ id: ids[f], text: found[f] }));
      setStatus({ type: "summary", title: t.summaryTitle, items });
      focusField(items[0]?.id);
      return;
    }
    const payload = referralPayload(role, form);
    const body = guard(payload, e.currentTarget);
    setLoading(true);
    setStatus(null);
    try {
      const result = await postForm("/api/kontakt", body, { lead: referralLead(role, form) });
      if (!result.ok) {
        const key = result.code === "invalid" ? { name: "name", email_address: "email", telefon: "telefon", ihre_nachricht: role === "empfohlen" ? "nachricht" : null }[result.field] : null;
        if (key) {
          serverError.set(key, form[key]);
          const message = validate(key, form, role, t) || t.errField;
          setErrors((prev) => ({ ...prev, [key]: message }));
          setStatus({ type: "summary", title: t.summaryTitle, items: [{ id: ids[key], text: message }] });
          focusField(ids[key]);
        } else {
          setStatus({ type: "error", text: errorText(result.code) });
        }
        return;
      }
      trackLead(role === "empfehler" ? "empfehlung_code" : "empfehlung", { transaction_id: result.leadRef });
      setStatus({ type: "success", name: payload.name });
      setForm({ ...empty, code: "" });
      setTouched({});
      setErrors({});
    } catch (error) {
      console.error("Empfehlung form:", error);
      setStatus({ type: "error", text: errorText("upstream") });
    } finally {
      setLoading(false);
    }
  };

  const describedBy = (name, hint) => [hint, errors[name] ? `${ids[name]}-fehler` : null].filter(Boolean).join(" ") || undefined;

  if (status?.type === "success") {
    return (
      <FormSuccess ref={successRef} title={t.successTitle}>
        <p className="mt-4 text-body text-text">
          {fill(role === "empfehler" ? t.successEmpfehler : t.successEmpfohlen, { name: status.name })}
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            requestAnimationFrame(() => document.getElementById(ids.name)?.focus());
          }}
          className="mt-6 flex min-h-11 items-center text-ui underline underline-offset-4"
        >
          {t.again}
        </button>
      </FormSuccess>
    );
  }

  const codeValid = Boolean(normalizeReferralCode(form.code));

  return (
    <form method="post" onSubmit={onSubmit} noValidate aria-describedby={`${p}-pflicht`} className="relative space-y-6" data-rolle={role}>
      <FormAlert status={status} />
      <p id={`${p}-pflicht`} className="text-small text-text-soft">
        {t.required}
      </p>

      <div>
        <label htmlFor={ids.name} className={labelClass}>
          {t.name} *
        </label>
        <input id={ids.name} name="name" type="text" autoComplete="name" required aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy("name")} value={form.name} onChange={onChange} onBlur={onBlur} className={fieldClass(errors.name)} />
        <ErrorLine id={`${ids.name}-fehler`} text={errors.name} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.email} className={labelClass}>
            {t.email} *
          </label>
          <input id={ids.email} name="email" type="email" inputMode="email" autoComplete="email" required aria-invalid={errors.email ? true : undefined} aria-describedby={describedBy("email")} value={form.email} onChange={onChange} onBlur={onBlur} className={fieldClass(errors.email)} />
          <ErrorLine id={`${ids.email}-fehler`} text={errors.email} />
        </div>
        <div>
          <label htmlFor={ids.telefon} className={labelClass}>
            {t.telefon} <span className="font-normal text-text-soft">{t.optional}</span>
          </label>
          <input id={ids.telefon} name="telefon" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={errors.telefon ? true : undefined} aria-describedby={describedBy("telefon")} value={form.telefon} onChange={onChange} onBlur={onBlur} className={fieldClass(errors.telefon)} />
          <ErrorLine id={`${ids.telefon}-fehler`} text={errors.telefon} />
        </div>
      </div>

      {role === "empfehler" ? (
        <div>
          <label htmlFor={ids.kundennummer} className={labelClass}>
            {t.kundennummer} <span className="font-normal text-text-soft">{t.optional}</span>
          </label>
          <input id={ids.kundennummer} name="kundennummer" type="text" autoComplete="off" maxLength={60} aria-describedby={`${ids.kundennummer}-hinweis`} value={form.kundennummer} onChange={onChange} className={fieldClass(false)} />
          <p id={`${ids.kundennummer}-hinweis`} className={hintClass}>
            {t.kundennummerHint}
          </p>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor={ids.nachricht} className={labelClass}>
              {t.anliegen} *
            </label>
            <textarea id={ids.nachricht} name="nachricht" rows={4} required maxLength={2000} aria-invalid={errors.nachricht ? true : undefined} aria-describedby={describedBy("nachricht", `${ids.nachricht}-hinweis`)} value={form.nachricht} onChange={onChange} onBlur={onBlur} className={`${fieldBase} min-h-32 py-3 ${errors.nachricht ? "border-2 border-error" : "border-line-control"}`} />
            <p id={`${ids.nachricht}-hinweis`} className={hintClass}>
              {t.anliegenHint}
            </p>
            <ErrorLine id={`${ids.nachricht}-fehler`} text={errors.nachricht} />
          </div>
          <div>
            <label htmlFor={ids.code} className={labelClass}>
              {t.code} <span className="font-normal text-text-soft">{t.optional}</span>
            </label>
            <input id={ids.code} name="code" type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={20} aria-invalid={errors.code ? true : undefined} aria-describedby={describedBy("code", `${ids.code}-hinweis`)} value={form.code} onChange={onChange} onBlur={onBlur} className={`${fieldClass(errors.code)} tabular uppercase`} />
            <p id={`${ids.code}-hinweis`} className={hintClass}>
              {t.codeHint}
            </p>
            <ErrorLine id={`${ids.code}-fehler`} text={errors.code} />
          </div>
          {codeValid && (
            <div className="flex items-start gap-3">
              <input id={ids.consent} name="consent" type="checkbox" checked={form.consent} onChange={onChange} aria-describedby={`${ids.consent}-hinweis`} className="mt-0.5 size-6 flex-none accent-ink" />
              <div>
                <label htmlFor={ids.consent} className="text-body text-text">
                  {t.consent}
                </label>
                <p id={`${ids.consent}-hinweis`} className={hintClass}>
                  {t.consentHint}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {role === "empfehler" && (
        <div>
          <label htmlFor={ids.nachricht} className={labelClass}>
            {t.nachricht} <span className="font-normal text-text-soft">{t.optional}</span>
          </label>
          <textarea id={ids.nachricht} name="nachricht" rows={3} maxLength={2000} value={form.nachricht} onChange={onChange} className={`${fieldBase} min-h-28 border-line-control py-3`} />
        </div>
      )}

      <Honeypot id={`${p}-website`} />

      <div>
        <button
          type="submit"
          disabled={!hydrated || undefined}
          aria-disabled={loading || undefined}
          className="inline-flex h-12 w-full items-center justify-center bg-action px-8 text-ui text-text-inverse transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover aria-disabled:cursor-wait aria-disabled:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:h-13"
        >
          {loading ? t.sending : role === "empfehler" ? t.submitEmpfehler : t.submitEmpfohlen}
        </button>
        <FormPrivacyNote className="mt-4" />
      </div>
    </form>
  );
}
