"use client";
// Bewertungsformular auf /de/bewerten (nur gezeigt, wenn die Gruppe "bewertung"
// auf ph steht und der Zugang da ist). Prüfung wie der Server
// (src/lib/bewertungen/schema.js), Versand an /<locale>/bewerten/senden.
// Kein Gating: jede Sternezahl geht gleich an das Studio; die Einwilligung zur
// Veröffentlichung ist ein eigenes, nicht vorausgewähltes Häkchen.
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { FieldError, FormField, Honeypot } from "@/components/Forms";
import SmartLink from "@/components/ui/SmartLink";
import { ANLAESSE, FIELD_ORDER, LIMITS, validateBewertung } from "@/lib/bewertungen/schema";

const fill = (t, v = {}) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m));
const EMPTY = { sterne: "", text: "", anlass: "", name: "", email: "", einwilligung: false };
const STARS = [1, 2, 3, 4, 5];

export default function BewertungForm({ locale = "de", copy: c, phone, email, quelle = "direkt" }) {
  const id = useId();
  const fid = (k) => `${id}-${k}`;
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const started = useRef(0);
  const idem = useRef(null);
  const summary = useRef(null);
  const doneRef = useRef(null);

  useEffect(() => {
    started.current = performance.now();
  }, []);
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const set = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((prev) => ({ ...prev, [k]: value }));
    if (errors[k] || (k === "text" && errors.sterne === "required")) setErrors((prev) => ({ ...prev, [k]: undefined, ...(k === "text" ? { sterne: undefined } : {}) }));
  };
  const errText = (code) => (code ? c.errors[code] || c.errors.required : undefined);

  function showErrors(e) {
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    requestAnimationFrame(() => {
      const el = document.getElementById(first === "sterne" ? fid("sterne-1") : fid(first));
      if (el) el.focus();
      else summary.current?.focus();
    });
  }

  async function onSubmit(ev) {
    ev.preventDefault();
    if (sending) return;
    setFormError(null);
    const v = validateBewertung({ ...f, quelle, sprache: locale });
    if (!v.ok) return showErrors(v.errors);
    if (!idem.current) idem.current = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setSending(true);
    const website = ev.currentTarget.elements?.namedItem("website")?.value || "";
    let status = 0;
    let body = {};
    try {
      const res = await fetch(`/${locale}/bewerten/senden`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...f, sterne: f.sterne ? Number(f.sterne) : null, quelle, sprache: locale, idem: idem.current, website, _t: Math.round(performance.now() - started.current) }),
      });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    setSending(false);
    if (status === 200 && body.success) {
      setDone({ referenz: body.referenz || null, publish: Boolean(f.einwilligung) });
      return;
    }
    if (status === 400 && body.field && FIELD_ORDER.includes(body.field)) return showErrors({ [body.field]: body.field === "email" ? "email" : body.field === "sterne" ? "required" : "choice" });
    setFormError(fill(status === 429 ? c.errors.rateLimited : c.errors.generic, { phone, email }));
    requestAnimationFrame(() => summary.current?.focus());
  }

  if (done) {
    return (
      <div data-bewertung-state="done" className="border-t border-line-strong pt-8">
        <h3 ref={doneRef} tabIndex={-1} className="font-display text-display-m text-text text-balance focus:outline-none">
          {c.done.title}
        </h3>
        <p className="mt-4 max-w-measure text-body text-text-soft">{done.publish ? c.done.textPublish : c.done.text}</p>
        {done.referenz && (
          <p className="mt-4 text-body text-text" data-bewertung-ref>
            {fill(c.done.ref, { ref: done.referenz })}
          </p>
        )}
      </div>
    );
  }

  const errorList = FIELD_ORDER.filter((k) => errors[k]);
  const starsError = errText(errors.sterne);
  return (
    <form noValidate onSubmit={onSubmit} className="relative" data-bewertung-form>
      <Honeypot id={fid("hp")} />
      <div ref={summary} tabIndex={-1} aria-live="polite" className="focus:outline-none">
        {formError && (
          <p role="alert" className="mb-6 text-body text-error">
            {formError}
          </p>
        )}
        {errorList.length > 0 && (
          <p role="alert" className="mb-6 text-body text-error" data-bewertung-summary>
            {errorList.length === 1 ? c.errors.summaryOne : fill(c.errors.summary, { n: errorList.length })}
          </p>
        )}
      </div>

      <fieldset className="min-w-0" aria-describedby={`${fid("sterne")}-hint${starsError ? ` ${fid("sterne")}-error` : ""}`}>
        <legend className="text-title text-text">{c.legendStars}</legend>
        <p id={`${fid("sterne")}-hint`} className="mt-1 text-small text-text-soft">
          {c.starsHint}
        </p>
        <div className="mt-stack-s flex flex-wrap gap-2" data-bewertung-sterne>
          {STARS.map((n) => {
            const checked = String(f.sterne) === String(n);
            return (
              <label
                key={n}
                htmlFor={fid(`sterne-${n}`)}
                className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1 border px-3 text-ui has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-action ${checked ? "border-action bg-action text-text-inverse" : "border-line-strong text-text hover:border-action"}`}
              >
                <input id={fid(`sterne-${n}`)} type="radio" name="sterne" value={n} checked={checked} onChange={set("sterne")} className="sr-only" />
                <span aria-hidden="true">{n} ★</span>
                <span className="sr-only">{c.starLabel[n]}</span>
              </label>
            );
          })}
        </div>
        <FieldError id={`${fid("sterne")}-error`}>{starsError}</FieldError>
      </fieldset>

      <div className="mt-8 grid gap-6">
        <FormField id={fid("text")} as="textarea" label={c.labels.text} optionalText={c.optional} hint={c.hints.text} name="text" value={f.text} onChange={set("text")} maxLength={LIMITS.text} rows={5} error={errText(errors.text)} />
        <FormField id={fid("anlass")} as="select" label={c.labels.anlass} optionalText={c.optional} name="anlass" value={f.anlass} onChange={set("anlass")} error={errText(errors.anlass)}>
          <option value="">{c.anlassLeer}</option>
          {ANLAESSE.map((a) => (
            <option key={a} value={a}>
              {c.anlaesse[a]}
            </option>
          ))}
        </FormField>
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField id={fid("name")} label={c.labels.name} optionalText={c.optional} hint={c.hints.name} name="name" autoComplete="name" value={f.name} onChange={set("name")} maxLength={LIMITS.name} error={errText(errors.name)} />
          <FormField id={fid("email")} label={c.labels.email} optionalText={c.optional} hint={c.hints.email} type="email" inputMode="email" name="email" autoComplete="email" value={f.email} onChange={set("email")} maxLength={LIMITS.email} error={errText(errors.email)} />
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor={fid("einwilligung")} className="flex cursor-pointer items-start gap-3 text-body text-text">
          <input
            id={fid("einwilligung")}
            type="checkbox"
            name="einwilligung"
            checked={f.einwilligung}
            onChange={set("einwilligung")}
            aria-describedby={`${fid("einwilligung")}-hint`}
            className="mt-1 size-5 flex-none accent-ink"
            data-bewertung-einwilligung
          />
          <span className="text-pretty">
            {c.consentPublish} <span className="text-text-soft">({c.optional})</span>
          </span>
        </label>
        <p id={`${fid("einwilligung")}-hint`} className="mt-2 pl-8 text-small text-text-soft">
          {c.consentHint}
        </p>
        <p className="mt-3 text-small text-text-soft">
          {c.privacyVor}{" "}
          <SmartLink href="/datenschutz" className="underline underline-offset-4">
            {c.privacyLink}
          </SmartLink>
          .
        </p>
      </div>

      <div className="mt-8">
        <Button type="submit" variant="secondary" disabled={sending} aria-disabled={sending || undefined} data-bewertung-submit>
          {sending ? c.sending : c.submit}
        </Button>
      </div>
    </form>
  );
}
