"use client";

// Anmeldeformular der Kundenkarte (/[locale]/kundenkarte#anmeldung).
// Pflicht: Vorname, Nachname, E-Mail, Kenntnisnahme (Teilnahmebedingungen +
// Datenschutz). Freiwillig: Telefon, PLZ, Ort, Geburtstag (Tag + Monat,
// Jahr optional), Interessen, ZWEI getrennte Einwilligungen (Auswertung der
// Einkäufe, Newsletter) – beide standardmäßig aus, nie vorangekreuzt.
// Formular-Vertrag (Honeypot `website`, `_t`, Herkunft): src/lib/forms/client.js;
// Route: /api/kundenkarte/apply (Double-Opt-in, Mock ohne Backend).
// Barrierefreiheit (Bibel §14): sichtbare Labels, Fehler am Feld, EINE
// Live-Region, Fokus auf das erste fehlerhafte Feld, Senden erst nach Hydrierung.
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import cx from "@/components/ui/cx";
import { FieldError, FormAlert, FormField, FormSuccess, Honeypot, fieldBorder, focusField, useFormGuard, useHydrated } from "@/components/Forms";
import { postForm } from "@/lib/forms/client";
import { INTERESSEN_KEYS } from "@/lib/kundenkarte/copy";
import { DAYS_IN_MONTH, FIELD_ORDER, emptyValues, toPayload, validate, validateField } from "@/lib/kundenkarte/schema";

const ID = (name) => `kk-${name}`;
const SELECT = "h-13 w-full appearance-none border bg-surface px-4 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

function Consent({ id, checked, onChange, label, hint, error, required = false }) {
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 text-body text-text">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
          className={cx("mt-1 size-5 flex-none accent-ink", error && "outline outline-2 outline-error")}
        />
        <span>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 pl-8 text-small text-text-soft">
          {hint}
        </p>
      )}
      <div className="pl-8">
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </div>
    </div>
  );
}

export default function KundenkarteForm({ locale = "de", copy, termsHref, privacyHref }) {
  const c = copy;
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const applyError = (name, next) => {
    const e = validateField(name, next);
    setErrors((old) => {
      const copyErr = { ...old };
      if (e) copyErr[name] = e;
      else delete copyErr[name];
      return copyErr;
    });
  };
  const set = (name, value) => {
    const next = { ...values, [name]: value };
    setValues(next);
    const check = ["tag", "monat"].includes(name) ? "geburtstag" : name;
    if (errors[check]) applyError(check, next);
    if (name === "jahr" && errors.jahr) applyError("jahr", next);
  };
  const blur = (name) => {
    if (String(values[name] ?? "").length === 0 && !errors[name]) return; // leeres Feld erst beim Senden melden
    applyError(name, values);
  };
  const err = (name) => (errors[name] ? c.errors[errors[name]] : undefined);
  const toggleInteresse = (key) => set("interessen", values.interessen.includes(key) ? values.interessen.filter((k) => k !== key) : [...values.interessen, key]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    if (Object.keys(found).length) {
      setErrors(found);
      const firstKey = FIELD_ORDER.find((k) => found[k]);
      setStatus({ type: "summary", title: c.summaryTitle, items: FIELD_ORDER.filter((k) => found[k]).map((k) => ({ id: ID(k === "geburtstag" ? "tag" : k), text: c.errors[found[k]] })) });
      focusField(ID(firstKey === "geburtstag" ? "tag" : firstKey));
      return;
    }
    setLoading(true);
    setStatus(null);
    const result = await postForm("/api/kundenkarte/apply", guard(toPayload(values, locale), e.currentTarget), { lead: false });
    setLoading(false);
    if (!result.ok) {
      const code = result.data?.code || result.code;
      setStatus({ type: "error", text: c.requestErrors[code] || c.requestErrors.default });
      return;
    }
    setSent({ devConfirmUrl: result.data?.devConfirmUrl || null });
  };

  if (sent) {
    return (
      <FormSuccess ref={successRef} title={c.successTitle}>
        <p>{c.successText}</p>
        {sent.devConfirmUrl && (
          <p className="mt-3 text-small text-text-soft" data-kundenkarte-dev-link="">
            <a href={sent.devConfirmUrl} className="underline underline-offset-4">
              {c.devLink}
            </a>
          </p>
        )}
        <Button
          variant="link"
          className="mt-4"
          onClick={() => {
            setValues(emptyValues());
            setErrors({});
            setSent(null);
          }}
        >
          {c.again}
        </Button>
      </FormSuccess>
    );
  }

  const gebErr = err("geburtstag");
  const days = values.monat ? DAYS_IN_MONTH[Number(values.monat) - 1] : 31;

  return (
    <form method="post" noValidate onSubmit={onSubmit} aria-labelledby="kk-form-title" className="relative space-y-8" data-testid="kundenkarte-form">
      <Honeypot id="kk-website" />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id={ID("vorname")} name="vorname" label={c.vorname} required autoComplete="given-name" error={err("vorname")} value={values.vorname} maxLength={100} onChange={(e) => set("vorname", e.target.value)} onBlur={() => blur("vorname")} />
        <FormField id={ID("nachname")} name="nachname" label={c.nachname} required autoComplete="family-name" error={err("nachname")} value={values.nachname} maxLength={100} onChange={(e) => set("nachname", e.target.value)} onBlur={() => blur("nachname")} />
        <FormField id={ID("email")} name="email" type="email" inputMode="email" label={c.email} required autoComplete="email" error={err("email")} value={values.email} maxLength={254} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} />
        <FormField id={ID("telefon")} name="telefon" type="tel" inputMode="tel" label={c.telefon} optionalText={c.optional} autoComplete="tel" error={err("telefon")} value={values.telefon} maxLength={40} onChange={(e) => set("telefon", e.target.value)} onBlur={() => blur("telefon")} />
        <FormField id={ID("plz")} name="plz" label={c.plz} optionalText={c.optional} autoComplete="postal-code" inputMode="text" error={err("plz")} value={values.plz} maxLength={12} onChange={(e) => set("plz", e.target.value)} onBlur={() => blur("plz")} />
        <FormField id={ID("ort")} name="ort" label={c.ort} optionalText={c.optional} autoComplete="address-level2" value={values.ort} maxLength={120} onChange={(e) => set("ort", e.target.value)} />
      </div>

      <fieldset className="min-w-0" aria-describedby={`${ID("geburtstag")}-hint${gebErr ? ` ${ID("geburtstag")}-error` : ""}`}>
        <legend className="block text-ui text-text">
          {c.geburtstagLegend} <span className="font-normal text-text-soft">({c.optional})</span>
        </legend>
        <p id={`${ID("geburtstag")}-hint`} className="mt-1 text-small text-text-soft">
          {c.geburtstagHint}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-md">
          <div>
            <label htmlFor={ID("tag")} className="block text-small text-text-soft">
              {c.tag}
            </label>
            <select id={ID("tag")} name="tag" value={values.tag} aria-invalid={gebErr ? true : undefined} onChange={(e) => set("tag", e.target.value)} className={cx(SELECT, "mt-1", fieldBorder(gebErr))}>
              <option value="">–</option>
              {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={ID("monat")} className="block text-small text-text-soft">
              {c.monat}
            </label>
            <select id={ID("monat")} name="monat" value={values.monat} aria-invalid={gebErr ? true : undefined} onChange={(e) => set("monat", e.target.value)} className={cx(SELECT, "mt-1", fieldBorder(gebErr))}>
              <option value="">–</option>
              {c.monate.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={ID("jahr")} className="block text-small text-text-soft">
              {c.jahr}
            </label>
            <input
              id={ID("jahr")}
              name="jahr"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              autoComplete="bday-year"
              value={values.jahr}
              aria-invalid={err("jahr") ? true : undefined}
              aria-describedby={err("jahr") ? `${ID("jahr")}-error` : undefined}
              onChange={(e) => set("jahr", e.target.value.replace(/\D/g, ""))}
              onBlur={() => blur("jahr")}
              className={cx("mt-1 h-13 w-full border bg-surface px-4 text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus", fieldBorder(err("jahr")))}
            />
          </div>
        </div>
        <FieldError id={`${ID("geburtstag")}-error`}>{gebErr}</FieldError>
        <FieldError id={`${ID("jahr")}-error`}>{err("jahr")}</FieldError>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="block text-ui text-text">
          {c.interessenLegend} <span className="font-normal text-text-soft">({c.optional})</span>
        </legend>
        <p className="mt-1 text-small text-text-soft">{c.interessenHint}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {INTERESSEN_KEYS.map((key) => (
            <label key={key} htmlFor={`${ID("interesse")}-${key}`} className="flex min-h-14 cursor-pointer items-center gap-3 border border-line-control bg-surface px-4 py-3 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet hover:border-ink has-checked:border-ink has-checked:bg-surface-raised">
              <input id={`${ID("interesse")}-${key}`} type="checkbox" name="interessen" value={key} checked={values.interessen.includes(key)} onChange={() => toggleInteresse(key)} className="size-5 flex-none accent-ink" />
              <span>{c.interessen[key]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0 space-y-5">
        <legend className="block text-ui text-text">{c.einwilligungenLegend}</legend>
        <Consent id={ID("auswertung")} checked={values.einwilligung_auswertung} onChange={(v) => set("einwilligung_auswertung", v)} label={c.auswertungLabel} hint={c.auswertungHint} />
        <Consent id={ID("newsletter")} checked={values.einwilligung_newsletter} onChange={(v) => set("einwilligung_newsletter", v)} label={c.newsletterLabel} hint={c.newsletterHint} />
        <p className="text-small text-text-soft">{c.widerrufHint}</p>
      </fieldset>

      <Consent
        id={ID("kenntnisnahme")}
        required
        checked={values.kenntnisnahme}
        onChange={(v) => set("kenntnisnahme", v)}
        error={err("kenntnisnahme")}
        label={
          <>
            {c.kenntnisnahmeBefore}
            <a href={termsHref} className="underline underline-offset-4" target="_blank" rel="noopener">
              {c.kenntnisnahmeTerms}
            </a>
            {c.kenntnisnahmeMiddle}
            <a href={privacyHref} className="underline underline-offset-4" target="_blank" rel="noopener">
              {c.kenntnisnahmePrivacy}
            </a>
            {c.kenntnisnahmeAfter}
          </>
        }
      />

      <FormAlert status={status} />

      <div>
        <Button type="submit" disabled={!hydrated || loading} aria-disabled={loading || undefined} fullWidth className="sm:w-auto">
          {loading ? c.sending : c.submit}
        </Button>
      </div>
    </form>
  );
}
