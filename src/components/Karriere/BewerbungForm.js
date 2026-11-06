"use client";
// Bewerbungsformular der Stellenseite (#bewerbung). Nur sichtbar, wenn die Gruppe
// "bewerbung" auf ph steht und der Zugang da ist (bewerbungOnline(), Seite
// ueber-uns/karriere/[slug]); sonst bleibt der bisherige Weg (E-Mail) allein.
// Prüfung wie der Server (src/lib/karriere/bewerbung.js), Versand als
// multipart an /<locale>/service/senden/bewerbung (PDF, je Datei ≤ 4 MB).
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import SmartLink from "@/components/ui/SmartLink";
import { FieldError, FormField, Honeypot } from "@/components/Forms";
import { BEWERBUNG_LIMITS, FIELD_ORDER, validateBewerbung } from "@/lib/karriere/bewerbung";
import { bewerbungCopy, fill } from "@/lib/karriere/bewerbungCopy";

const MB = Math.round(BEWERBUNG_LIMITS.maxFileBytes / (1024 * 1024));
// Außerhalb der Komponente (react-hooks/purity): nur im Absende-Handler gerufen.
const newIdem = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const elapsedSince = (start) => Math.round(performance.now() - start);

const EMPTY = { vorname: "", nachname: "", email: "", telefon: "", starttermin: "", gehalt: "", nachricht: "", einwilligung: false };

export default function BewerbungForm({ locale, slug, titel, email }) {
  const c = bewerbungCopy(locale);
  const id = useId();
  const fid = (k) => `${id}-${k}`;
  const [f, setF] = useState(EMPTY);
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
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
  const setFile = (k) => (e) => {
    const file = e.target.files?.[0] || null;
    setFiles((prev) => ({ ...prev, [k]: file }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };
  const errText = (k, code) => {
    if (!code) return undefined;
    if (k === "einwilligung") return c.errors.consent;
    if (k === "lebenslauf" && code === "required") return c.errors.fileRequired;
    return fill(c.errors[code] || c.errors.required, { mb: MB });
  };

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
    const v = validateBewerbung(f, files);
    if (!v.ok) return showErrors(v.errors);
    if (!idem.current) idem.current = newIdem();
    const body = new FormData();
    for (const [k, val] of Object.entries(f)) body.set(k, k === "einwilligung" ? (val ? "1" : "") : String(val));
    body.set("sprache", locale);
    body.set("stelle", slug || "");
    body.set("titel", titel || "");
    body.set("idem", idem.current);
    body.set("website", ev.currentTarget.elements?.namedItem("website")?.value || "");
    body.set("_t", String(elapsedSince(started.current)));
    for (const k of ["lebenslauf", "anschreiben"]) if (files[k]) body.set(k, files[k], files[k].name);
    setSending(true);
    let status = 0;
    let data = {};
    try {
      const res = await fetch(`/${locale}/service/senden/bewerbung`, { method: "POST", headers: { Accept: "application/json" }, body });
      status = res.status;
      data = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    setSending(false);
    if (status === 200 && data.success) return setDone({ referenz: data.referenz || null, fehlend: Number(data.fehlend || 0) });
    if (status === 400 && data.field && FIELD_ORDER.includes(data.field)) return showErrors({ [data.field]: ["lebenslauf", "anschreiben"].includes(data.field) ? "type" : "required" });
    setFormError(fill(status === 429 ? c.errors.rateLimited : c.errors.generic, { email }));
    requestAnimationFrame(() => summary.current?.focus());
  }

  if (done) {
    return (
      <div data-bewerbung-state="done" className="mt-stack-m border-t border-line-strong pt-8">
        <h3 ref={doneRef} tabIndex={-1} className="font-display text-display-m text-text text-balance focus:outline-none">
          {c.done.title}
        </h3>
        <p className="mt-4 max-w-measure text-body text-text-soft">{c.done.text}</p>
        {done.referenz && <p className="mt-4 text-body text-text">{fill(c.done.ref, { ref: done.referenz })}</p>}
        {done.fehlend > 0 && <p className="mt-4 max-w-measure text-body text-text">{fill(c.done.partial, { email })}</p>}
      </div>
    );
  }

  const errorList = FIELD_ORDER.filter((k) => errors[k]);
  const fileField = (k, required) => (
    <div className="min-w-0">
      <label htmlFor={fid(k)} className="block text-ui text-text">
        {c.labels[k]}
        {required ? <span aria-hidden="true"> *</span> : <span className="font-normal text-text-soft"> ({c.optional})</span>}
      </label>
      <input
        id={fid(k)}
        type="file"
        name={k}
        accept="application/pdf,.pdf"
        required={required || undefined}
        onChange={setFile(k)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={[`${fid(k)}-hint`, errors[k] ? `${fid(k)}-error` : null].filter(Boolean).join(" ")}
        className="mt-2 block w-full max-w-full text-ui text-text file:mr-4 file:min-h-11 file:border file:border-line-control file:bg-surface file:px-4 file:text-ui file:text-text"
      />
      <p id={`${fid(k)}-hint`} className="mt-2 text-small text-text-soft">
        {fill(c.hints.datei, { mb: MB })}
      </p>
      <FieldError id={`${fid(k)}-error`}>{errText(k, errors[k])}</FieldError>
    </div>
  );

  return (
    <form noValidate onSubmit={onSubmit} className="relative mt-stack-m" data-bewerbung-form>
      <h3 className="text-title text-text">{c.title}</h3>
      <p className="mt-2 max-w-measure text-body text-text-soft">{c.intro}</p>
      <Honeypot id={fid("hp")} />
      <div ref={summary} tabIndex={-1} aria-live="polite" className="mt-4 focus:outline-none">
        {formError && (
          <p role="alert" className="mb-4 text-body text-error">
            {formError}
          </p>
        )}
        {errorList.length > 0 && (
          <p role="alert" className="mb-4 text-body text-error" data-bewerbung-summary>
            {errorList.length === 1 ? c.errors.summaryOne : fill(c.errors.summary, { n: errorList.length })}
          </p>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id={fid("vorname")} label={c.labels.vorname} required name="vorname" autoComplete="given-name" value={f.vorname} onChange={set("vorname")} maxLength={100} error={errText("vorname", errors.vorname)} />
        <FormField id={fid("nachname")} label={c.labels.nachname} required name="nachname" autoComplete="family-name" value={f.nachname} onChange={set("nachname")} maxLength={100} error={errText("nachname", errors.nachname)} />
        <FormField id={fid("email")} label={c.labels.email} required type="email" inputMode="email" name="email" autoComplete="email" value={f.email} onChange={set("email")} maxLength={254} error={errText("email", errors.email)} />
        <FormField id={fid("telefon")} label={c.labels.telefon} optionalText={c.optional} type="tel" name="telefon" autoComplete="tel" value={f.telefon} onChange={set("telefon")} maxLength={40} error={errText("telefon", errors.telefon)} />
        <FormField id={fid("starttermin")} label={c.labels.starttermin} optionalText={c.optional} type="date" name="starttermin" value={f.starttermin} onChange={set("starttermin")} error={errText("starttermin", errors.starttermin)} />
        <FormField id={fid("gehalt")} label={c.labels.gehalt} optionalText={c.optional} hint={c.hints.gehalt} name="gehalt" value={f.gehalt} onChange={set("gehalt")} maxLength={100} error={errText("gehalt", errors.gehalt)} />
        <FormField id={fid("nachricht")} as="textarea" label={c.labels.nachricht} optionalText={c.optional} name="nachricht" value={f.nachricht} onChange={set("nachricht")} maxLength={4000} rows={5} className="sm:col-span-2" error={errText("nachricht", errors.nachricht)} />
        {fileField("lebenslauf", true)}
        {fileField("anschreiben", false)}
      </div>
      <p className="mt-8 max-w-measure text-small text-pretty text-text-soft" data-bewerbung-loeschfrist>
        {c.privacy} {c.privacyVor}{" "}
        <SmartLink href="/datenschutz#bewerbungen" className="underline underline-offset-4">
          {c.privacyLink}
        </SmartLink>
        .
      </p>
      <div className="mt-6">
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
      </div>
      <div className="mt-8">
        <Button type="submit" disabled={sending} aria-disabled={sending || undefined} data-bewerbung-submit>
          {sending ? c.sending : c.submit}
        </Button>
      </div>
      <p className="mt-6 text-small text-text-soft">{c.orMail}</p>
    </form>
  );
}
