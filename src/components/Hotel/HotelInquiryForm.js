"use client";
// Projektanfrage Hotel & Objekt (/<locale>/hotel-objekt#anfrage).
//
// Bestehender Lead-Weg: POST /api/beratung_anfrage mit den Feldern des
// Beratungs-Wizards (Payload: src/lib/hotel/inquiry.js) plus Formular-Vertrag
// (website-Honeypot, _t) und Herkunft/lead_ref (postForm, pageContext
// "Seite: Hotel & Objekt"). trackLead("hotel_objekt").
// SICHERHEIT: Tests beantworten die Route per page.route – nichts geht ans
// produktive Backoffice.
//
// Barrierefreiheit (WCAG 2.2 AA, Bibel §9/§14): sichtbare Labels über dem
// Feld, Prüfung beim Verlassen, Fehler am Feld (aria-invalid,
// aria-describedby) plus Zusammenfassung in der höflichen Live-Region
// (FormAlert), Fokus auf das erste fehlerhafte Feld, nach Erfolg auf die
// Bestätigung. Felder 52 px, Checkboxen mit 44-px-Zeile, Schrift 16 px.
// Texte: src/lib/hotel/content.js (DE/EN), als Prop vom Server.
//
// Rat 9,5 B10 (ux 6): zwei Stufen – vier Pflichtfelder (Haus, Name, E-Mail,
// Vorhaben in einem Satz), danach freiwillig „Details ergänzen“ (Ort, Art,
// Zimmer, Bereiche, Zeitfenster, Rolle, Firma, Telefon). Logik:
// ./quickInquiry.js. Die Details sind ein Disclosure-Knopf (aria-expanded);
// Fehler in den Details oder der Chalet-Link öffnen sie.
// Rat 9,5 A3 (ux 2): nach dem Senden steht die Bestätigung am Viewport-Anfang
// (focus ohne Sprung + scrollIntoView, ../Landing/revealConfirmation.js).
import { useEffect, useRef, useState } from "react";
import { trackLead } from "@/lib/analytics";
import { postForm } from "@/lib/forms/client";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { FormAlert } from "@/components/Forms/FormAlert";
import { ErrorIcon, SuccessIcon } from "@/components/Forms/FormField";
import useFormGuard, { focusField, useHydrated, useServerFieldError } from "@/components/Forms/useFormGuard";
import useFormText from "@/components/Forms/useFormText";
import { CHALET_HASH, pageContextOf } from "@/lib/hotel/inquiry";
import { revealConfirmation } from "@/components/Landing/revealConfirmation";
import { EMPTY_QUICK, QUICK_ORDER, QUICK_SERVER_FIELD, buildQuickPayload, detailsHaveError, quickText, splitName, validateQuick, validateQuickField } from "./quickInquiry";
import SmartLink from "@/components/ui/SmartLink";

const ID = (name) => `ho-${name}`;
const labelClass = "block text-ui text-text";
const fieldBase =
  "mt-2 block w-full border bg-surface px-4 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet placeholder:text-text-soft";
const fieldClass = (invalid) => `${fieldBase} h-13 ${invalid ? "border-error border-2" : "border-line-control"}`;
const selectClass = (invalid) =>
  `${fieldClass(invalid)} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%2330373e%22 stroke-width=%221.5%22/></svg>')] bg-[length:12px_8px] bg-[position:right_1rem_center] bg-no-repeat pr-10`;
const hintClass = "font-normal text-text-soft";

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

/**
 * @param {object} props
 * @param {object} props.form   copy.form aus src/lib/hotel/content.js
 * @param {{topic: string, place: string}} props.labels Wizard-Beschriftungen (Thema "objekt", Ort "hotel")
 * @param {string} props.terminHref Terminanfrage mit Kontext (/beratung?thema=hotel)
 * @param {string} [props.terminLabel] Rat 9,5 B1: Wort zum Ziel aus dem Terminhelfer (sonst copy.termin.label)
 * @param {"de"|"en"} [props.locale]
 */
export default function HotelInquiryForm({ form: copy, labels, terminHref, terminLabel, locale = "de" }) {
  const q = quickText(locale);
  const [data, setData] = useState(() => ({ ...EMPTY_QUICK, bereiche: [] }));
  const [details, setDetails] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const statusRef = useRef(null);
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const serverError = useServerFieldError();
  const { errorText } = useFormText();
  const f = copy.fields;

  useEffect(() => {
    if (status?.type === "success") revealConfirmation(statusRef.current);
  }, [status]);

  // Abschnitt „Chalets & Ferienwohnungen“ verlinkt auf #anfrage-chalet:
  // die Art des Hauses wird mit "chalet" vorbelegt (beim Laden und bei jedem
  // Klick auf den Link). Kein Query-Parameter, damit die Seite statisch bleibt.
  useEffect(() => {
    const apply = () => {
      if (window.location.hash !== CHALET_HASH) return;
      setData((prev) => ({ ...prev, art: "chalet" }));
      setDetails(true);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...data, [name]: value };
    setData(next);
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validateQuickField(name, next, copy, q) }));
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    if (!QUICK_ORDER.includes(name) || serverError.holds(name, value)) return;
    // QM R3: ein leeres Feld nur per Tab zu verlassen zeigt noch keinen Fehler (wie das
    // Architekten-Formular) – erst nach einer Eingabe oder beim Absenden.
    if (!value && !touched[name] && !errors[name]) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateQuickField(name, data, copy, q) }));
  };

  const onToggle = (e) => {
    const { value, checked } = e.target;
    setData((prev) => ({
      ...prev,
      bereiche: checked ? [...new Set([...prev.bereiche, value])] : prev.bereiche.filter((v) => v !== value),
    }));
  };

  const showSummary = (found) => {
    const items = QUICK_ORDER.filter((k) => found[k]).map((k) => ({ id: ID(k), text: found[k] }));
    setStatus({ type: "summary", title: copy.summaryTitle, items });
    if (detailsHaveError(found)) setDetails(true);
    // nach dem Aufklappen fokussieren (die Felder müssen sichtbar sein)
    requestAnimationFrame(() => focusField(items[0]?.id));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    serverError.clear();
    const found = validateQuick(data, copy, q);
    setErrors(found);
    setTouched(Object.fromEntries(QUICK_ORDER.map((k) => [k, true])));
    if (Object.keys(found).length) return showSummary(found);

    const body = guard(buildQuickPayload(data, copy, labels), e.currentTarget);
    setLoading(true);
    setStatus(null);
    try {
      const result = await postForm("/api/beratung_anfrage", body, { lead: { pageContext: pageContextOf(data, copy) } });
      if (!result.ok) {
        const key = result.code === "invalid" ? QUICK_SERVER_FIELD[result.field] : undefined;
        if (key) {
          serverError.set(key, data[key]);
          const message = validateQuickField(key, data, copy, q) || copy.errors.server;
          setErrors((prev) => ({ ...prev, [key]: message }));
          showSummary({ [key]: message });
        } else {
          setStatus({ type: "error", text: errorText(result.code) });
        }
        return;
      }
      trackLead(data.art === "chalet" ? "hotel_objekt_chalet" : "hotel_objekt", { transaction_id: result.leadRef });
      setStatus({ type: "success", text: fill(copy.success, { name: splitName(data.name)?.vorname || data.name.trim(), haus: data.haus.trim() }) });
      setData({ ...EMPTY_QUICK, bereiche: [] });
      setDetails(false);
      setTouched({});
      setErrors({});
    } catch (error) {
      console.error("Hotel inquiry:", error);
      setStatus({ type: "error", text: errorText("upstream") });
    } finally {
      setLoading(false);
    }
  };

  const describedBy = (name, hint) => [hint && `${ID(name)}-hinweis`, errors[name] && `${ID(name)}-fehler`].filter(Boolean).join(" ") || undefined;
  const fieldError = (name) =>
    errors[name] ? (
      <p id={`${ID(name)}-fehler`} className="mt-2 flex items-start gap-2 text-small text-error">
        <ErrorIcon />
        <span>{errors[name]}</span>
      </p>
    ) : null;
  const common = (name, hint) => ({
    id: ID(name),
    name,
    value: data[name],
    onChange,
    onBlur,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": describedBy(name, hint),
  });
  const label = (name, required) => (
    <label htmlFor={ID(name)} className={labelClass}>
      {f[name]} {required ? "*" : <span className={hintClass}>{copy.optional}</span>}
    </label>
  );
  const select = (name, options, required) => (
    <div>
      {label(name, required)}
      <select {...common(name, name === "zeitfenster")} required={required || undefined} className={selectClass(errors[name])}>
        <option value="">{copy.choose}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {name === "zeitfenster" && (
        <p id={`${ID(name)}-hinweis`} className="mt-2 text-small text-text-soft">
          {f.zeitfensterHint}
        </p>
      )}
      {fieldError(name)}
    </div>
  );

  if (status?.type === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" data-hotel-success="" data-confirmation="" className="ph-arrive scroll-mt-[88px] border-t-2 border-success bg-surface p-6 sm:p-8 focus-visible:outline-none">
        <h3 className="flex items-start gap-3 text-ui text-success">
          <SuccessIcon />
          <span>{copy.successTitle}</span>
        </h3>
        <p className="mt-4 text-body text-text">{status.text}</p>
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            requestAnimationFrame(() => document.getElementById(ID("haus"))?.focus());
          }}
          className="mt-6 flex min-h-11 items-center text-ui underline underline-offset-4"
        >
          {copy.again}
        </button>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate aria-describedby="ho-pflicht" className="relative space-y-6" data-hotel-form="">
      <FormAlert status={status} />
      <p id="ho-pflicht" className="text-small text-text-soft">
        {copy.required}
      </p>

      {/* Stufe 1: vier Pflichtfelder (B10) */}
      <div>
        {label("haus", true)}
        <input {...common("haus")} type="text" autoComplete="organization" required className={fieldClass(errors.haus)} />
        {fieldError("haus")}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={ID("name")} className={labelClass}>
            {q.name} *
          </label>
          <input {...common("name")} type="text" autoComplete="name" required className={fieldClass(errors.name)} />
          {fieldError("name")}
        </div>
        <div>
          {label("email", true)}
          <input {...common("email")} type="email" inputMode="email" autoComplete="email" required className={fieldClass(errors.email)} />
          {fieldError("email")}
        </div>
      </div>

      <div>
        <label htmlFor={ID("nachricht")} className={labelClass}>
          {q.vorhaben} *
        </label>
        <textarea {...common("nachricht", true)} rows={3} required className={`${fieldBase} min-h-24 py-3 ${errors.nachricht ? "border-error border-2" : "border-line-control"}`} />
        <p id={`${ID("nachricht")}-hinweis`} className="mt-2 text-small text-text-soft">
          {q.vorhabenHint}
        </p>
        {fieldError("nachricht")}
      </div>

      {/* Stufe 2: freiwillige Details (B10) – Disclosure, nichts davon ist Pflicht */}
      <div className="border-t border-line pt-2">
        <button
          type="button"
          aria-expanded={details}
          aria-controls="ho-details"
          onClick={() => setDetails((v) => !v)}
          className="flex min-h-11 w-full items-center justify-between gap-4 text-left text-ui text-text"
          data-hotel-details-toggle=""
        >
          <span>
            {q.details} <span className={hintClass}>{copy.optional}</span>
          </span>
          <span aria-hidden="true" className="text-title leading-none">
            {details ? "−" : "+"}
          </span>
        </button>
        <div id="ho-details" hidden={!details} className="mt-4 space-y-6" data-hotel-details="">
          <p className="text-small text-text-soft">{q.detailsHint}</p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              {label("ort", false)}
              <input {...common("ort")} type="text" autoComplete="address-level2" className={fieldClass(errors.ort)} />
              {fieldError("ort")}
            </div>
            {select("art", copy.art, false)}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              {label("zimmer", false)}
              <input {...common("zimmer", true)} type="text" inputMode="numeric" autoComplete="off" className={`${fieldClass(errors.zimmer)} tabular`} />
              <p id={`${ID("zimmer")}-hinweis`} className="mt-2 text-small text-text-soft">
                {f.zimmerHint}
              </p>
              {fieldError("zimmer")}
            </div>
            {select("zeitfenster", copy.zeitfenster, false)}
          </div>

          <fieldset>
            <legend className={labelClass}>
              {f.bereiche} <span className={hintClass}>{copy.optional}</span>
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {copy.bereiche.map((o) => (
                <label key={o.value} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-line py-2 text-ui text-text">
                  <input
                    type="checkbox"
                    name="bereiche"
                    value={o.value}
                    checked={data.bereiche.includes(o.value)}
                    onChange={onToggle}
                    className="size-5 shrink-0 accent-ink"
                  />
                  <span>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-6 sm:grid-cols-2">
            {select("rolle", copy.rolle, false)}
            <div>
              {label("firma", false)}
              <input {...common("firma")} type="text" autoComplete="organization" className={fieldClass(false)} />
            </div>
          </div>

          <div>
            {label("telefon", false)}
            <input {...common("telefon")} type="tel" inputMode="tel" autoComplete="tel" className={`${fieldClass(errors.telefon)} tabular`} />
            {fieldError("telefon")}
          </div>
        </div>
      </div>

      <Honeypot id="ho-website" />

      <div>
        <button
          type="submit"
          disabled={!hydrated || undefined}
          aria-disabled={loading || undefined}
          className="ph-press inline-flex h-12 w-full items-center justify-center bg-action px-8 text-ui text-text-inverse transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover aria-disabled:cursor-wait aria-disabled:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:h-13"
        >
          {loading ? copy.sending : copy.send}
        </button>
        <FormPrivacyNote className="mt-4" />
        <p className="mt-stack-m border-t border-line pt-4 text-small text-text-soft">
          <SmartLink href={terminHref} className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) ease-quiet hover:decoration-current">
            {terminLabel || copy.termin.label}
          </SmartLink>
          <span className="block">{copy.termin.text}</span>
        </p>
      </div>
    </form>
  );
}
