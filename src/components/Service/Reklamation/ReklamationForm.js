"use client";
// Reklamationsformular /<locale>/service/reklamation. Prüfung wie der Server
// (src/lib/service/reklamation/schema.js), Versand an
// /<locale>/service/senden/reklamation. Nach dem Erfolg: Referenz, und – nur DE,
// nur solange der Handy-Upload Dateien annimmt – die Upload-Karte
// (lazyHandoff, Ticket der Art "kontakt"); sonst Hinweis auf die E-Mail-Adresse.
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { FieldError, FormField, Honeypot } from "@/components/Forms";
import { UploadHandoff, handoffAfterSend, prefetchHandoff } from "@/components/Forms/lazyHandoff";
import SmartLink from "@/components/ui/SmartLink";
import { ARTEN, FIELD_ORDER, validateReklamation } from "@/lib/service/reklamation/schema";

const fill = (t, v = {}) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m));
const EMPTY = { vorname: "", nachname: "", email: "", telefon: "", bestellnummer: "", produkt: "", art: "mangel", beschreibung: "", einwilligung: false };

export default function ReklamationForm({ locale, copy: c, phone, email, upload = false }) {
  const id = useId();
  const fid = (k) => `${id}-${k}`;
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  const idem = useRef(null);
  const summary = useRef(null);
  const doneRef = useRef(null);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const set = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((prev) => ({ ...prev, [k]: value }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };
  const errText = (k, code) => (code ? (k === "einwilligung" ? c.errors.consent : c.errors[code] || c.errors.required) : undefined);

  function showErrors(e) {
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    requestAnimationFrame(() => {
      const el = document.getElementById(fid(first));
      if (el) el.focus();
      else summary.current?.focus();
    });
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (sending) return;
    setFormError(null);
    const v = validateReklamation({ ...f, sprache: locale });
    if (!v.ok) return showErrors(v.errors);
    if (!idem.current) idem.current = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setSending(true);
    const website = ev.currentTarget.elements?.namedItem("website")?.value || "";
    let status = 0;
    let body = {};
    try {
      const res = await fetch(`/${locale}/service/senden/reklamation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...f, sprache: locale, idem: idem.current, website, _t: Math.round(performance.now() - started.current) }),
      });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    setSending(false);
    if (status === 200 && body.success) {
      setDone({ referenz: body.referenz || null });
      if (upload) handoffAfterSend("kontakt", { email: f.email, result: body, locale }).then(setHandoff);
      return;
    }
    if (status === 400 && body.field && FIELD_ORDER.includes(body.field)) return showErrors({ [body.field]: body.field === "email" ? "email" : "required" });
    setFormError(fill(status === 429 ? c.errors.rateLimited : c.errors.generic, { phone }));
    requestAnimationFrame(() => summary.current?.focus());
  }

  if (done) {
    return (
      <div data-reklamation-state="done" className="border-t border-line-strong pt-8">
        <h2 ref={doneRef} tabIndex={-1} className="font-display text-display-m text-text text-balance focus:outline-none">
          {c.done.title}
        </h2>
        <p className="mt-4 max-w-measure text-body text-text-soft">{c.done.text}</p>
        {done.referenz && (
          <p className="mt-4 text-body text-text" data-reklamation-ref>
            {fill(c.done.ref, { ref: done.referenz })}
          </p>
        )}
        {handoff ? <UploadHandoff {...handoff} className="mt-8" /> : <p className="mt-6 max-w-measure text-body text-text">{fill(c.done.medien, { email })}</p>}
      </div>
    );
  }

  const errorList = FIELD_ORDER.filter((k) => errors[k]);
  const optional = c.optional;
  return (
    <form noValidate onSubmit={onSubmit} onFocus={() => upload && prefetchHandoff(locale)} className="relative" data-reklamation-form>
      <Honeypot id={fid("hp")} />
      <div ref={summary} tabIndex={-1} aria-live="polite" className="focus:outline-none">
        {formError && (
          <p role="alert" className="mb-6 text-body text-error">
            {formError}
          </p>
        )}
        {errorList.length > 0 && (
          <p role="alert" className="mb-6 text-body text-error" data-reklamation-summary>
            {errorList.length === 1 ? c.errors.summaryOne : fill(c.errors.summary, { n: errorList.length })}
          </p>
        )}
      </div>

      <fieldset className="min-w-0">
        <legend className="text-title text-text">{c.legend.produkt}</legend>
        <div className="mt-stack-s grid gap-6">
          <FormField id={fid("bestellnummer")} label={c.labels.bestellnummer} optionalText={optional} hint={c.hints.bestellnummer} name="bestellnummer" value={f.bestellnummer} onChange={set("bestellnummer")} maxLength={40} error={errText("bestellnummer", errors.bestellnummer)} />
          <FormField id={fid("produkt")} label={c.labels.produkt} required hint={c.hints.produkt} name="produkt" value={f.produkt} onChange={set("produkt")} maxLength={140} error={errText("produkt", errors.produkt)} />
          <FormField id={fid("art")} as="select" label={c.labels.art} required name="art" value={f.art} onChange={set("art")} error={errText("art", errors.art)}>
            {ARTEN.map((a) => (
              <option key={a} value={a}>
                {c.arten[a]}
              </option>
            ))}
          </FormField>
          <FormField id={fid("beschreibung")} as="textarea" label={c.labels.beschreibung} required hint={c.hints.beschreibung} name="beschreibung" value={f.beschreibung} onChange={set("beschreibung")} maxLength={5000} rows={6} error={errText("beschreibung", errors.beschreibung)} />
        </div>
      </fieldset>

      <div className="mt-10 border-l-2 border-line-strong pl-4">
        <h2 className="text-ui text-text">{c.medien.title}</h2>
        <p className="mt-2 max-w-measure text-small text-text-soft">{upload && c.medien.textUpload ? c.medien.textUpload : c.medien.text}</p>
      </div>

      <fieldset className="mt-10 min-w-0">
        <legend className="text-title text-text">{c.legend.kontakt}</legend>
        <div className="mt-stack-s grid gap-6 sm:grid-cols-2">
          <FormField id={fid("vorname")} label={c.labels.vorname} required name="vorname" autoComplete="given-name" value={f.vorname} onChange={set("vorname")} maxLength={100} error={errText("vorname", errors.vorname)} />
          <FormField id={fid("nachname")} label={c.labels.nachname} required name="nachname" autoComplete="family-name" value={f.nachname} onChange={set("nachname")} maxLength={100} error={errText("nachname", errors.nachname)} />
          <FormField id={fid("email")} label={c.labels.email} required type="email" inputMode="email" name="email" autoComplete="email" value={f.email} onChange={set("email")} maxLength={254} error={errText("email", errors.email)} />
          <FormField id={fid("telefon")} label={c.labels.telefon} optionalText={optional} type="tel" name="telefon" autoComplete="tel" value={f.telefon} onChange={set("telefon")} maxLength={40} error={errText("telefon", errors.telefon)} />
        </div>
      </fieldset>

      <div className="mt-8">
        <label htmlFor={fid("einwilligung")} className="flex cursor-pointer items-start gap-3 text-body text-text">
          <input
            id={fid("einwilligung")}
            type="checkbox"
            name="einwilligung"
            checked={f.einwilligung}
            onChange={set("einwilligung")}
            required
            aria-invalid={errors.einwilligung ? true : undefined}
            aria-describedby={errors.einwilligung ? `${fid("einwilligung")}-error` : undefined}
            className="mt-1 size-5 flex-none accent-ink"
          />
          <span className="text-pretty">
            {c.consent}
            <span aria-hidden="true"> *</span>
          </span>
        </label>
        <FieldError id={`${fid("einwilligung")}-error`}>{errText("einwilligung", errors.einwilligung)}</FieldError>
        <p className="mt-3 text-small text-text-soft">
          {c.privacyVor}{" "}
          <SmartLink href="/datenschutz" className="underline underline-offset-4">
            {c.privacyLink}
          </SmartLink>
          .
        </p>
      </div>

      <div className="mt-8">
        <Button type="submit" disabled={sending} aria-disabled={sending || undefined} data-reklamation-submit>
          {sending ? c.sending : c.submit}
        </Button>
      </div>
    </form>
  );
}
