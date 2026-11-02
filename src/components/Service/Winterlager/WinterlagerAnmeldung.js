"use client";

// Anmeldung zum Outdoor-Winterservice (Lead-Kontext „winterlager“).
// Versand über das bestehende Beratungs-Backend (/api/upload/inquiry/beratung,
// Payload: src/lib/service/winterlager/form.js). Danach die Handy-Upload-Karte
// für Fotos (nur DE, lazyHandoff). Formular-Vertrag (Honeypot, _t, Herkunft,
// lead_ref): src/lib/forms/client.js. In Tests wird nichts abgesendet.
//
// Barrierefreiheit (Bibel §14): sichtbare Labels, Fehler am Feld (aria-invalid,
// -describedby), EINE Fehler-Zusammenfassung, Fokus auf das erste fehlerhafte
// Feld, Senden-Knopf bis zur Hydrierung deaktiviert, method="post".
// DOM-IDs hängen am Index (wl-row-0-type …), row.id dient nur als React-Key.
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { FormAlert, FormField, FormPrivacyNote, FormSuccess, Honeypot, RadioCards, focusField, useFormGuard, useHydrated } from "@/components/Forms";
import { UploadHandoff, handoffAfterSend, handoffAllowed, prefetchHandoff } from "@/components/Forms/lazyHandoff";
import { postForm } from "@/lib/forms/client";
import { trackLead } from "@/lib/analytics";
import { PHONE_DISPLAY } from "@/lib/site";
import { WINTERLAGER_CONFIG } from "@/lib/service/winterlager/config";
import { COUNTRY_KEYS, FORM_MATERIAL_KEYS, FURNITURE_KEYS, PICKUP_KEYS, RETURN_KEYS, VARIANT_KEYS, fill, winterlagerCopy } from "@/lib/service/winterlager/copy";
import { PAGE_CONTEXT, SEND_URL, buildPayload, emptyRow, fieldOrder, initialValues, validate } from "@/lib/service/winterlager/form";

export default function WinterlagerAnmeldung({ locale = "de" }) {
  const c = winterlagerCopy(locale).form;
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const successRef = useRef(null);
  const uploadPossible = handoffAllowed(locale);
  const max = WINTERLAGER_CONFIG.maxPositionen;

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const clearError = (id) => {
    if (errors[id]) {
      setErrors((old) => {
        const copy = { ...old };
        delete copy[id];
        return copy;
      });
    }
  };
  const set = (name, value, id = `wl-${name}`) => {
    setValues((v) => ({ ...v, [name]: value }));
    clearError(id);
  };
  const setRow = (i, name, value) => {
    setValues((v) => ({ ...v, rows: v.rows.map((r, j) => (j === i ? { ...r, [name]: value } : r)) }));
    clearError(`wl-row-${i}-${name}`);
  };
  const addRow = () => {
    if (values.rows.length >= max) return;
    const next = values.rows.length;
    setValues((v) => ({ ...v, rows: [...v.rows, emptyRow()] }));
    requestAnimationFrame(() => document.getElementById(`wl-row-${next}-type`)?.focus());
  };
  const removeRow = (i) => {
    setValues((v) => ({ ...v, rows: v.rows.filter((_, j) => j !== i) }));
    setErrors({});
    requestAnimationFrame(() => document.getElementById(`wl-row-${Math.max(0, i - 1)}-type`)?.focus());
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, locale);
    if (Object.keys(found).length) {
      setErrors(found);
      const order = fieldOrder(values).filter((k) => found[k]);
      setStatus({ type: "summary", title: c.errors.summary, items: order.map((id) => ({ id, text: found[id] })) });
      focusField(order[0]);
      return;
    }
    setLoading(true);
    setStatus(null);
    const result = await postForm(SEND_URL, guard(buildPayload(values), e.currentTarget), { lead: { pageContext: PAGE_CONTEXT } });
    setLoading(false);
    if (!result.ok) {
      setStatus({ type: "error", text: result.code === "rate_limited" ? c.errors.rate : fill(c.errors.send, { phone: PHONE_DISPLAY }) });
      return;
    }
    trackLead("winterlager", { transaction_id: result.leadRef });
    handoffAfterSend("beratung", { email: values.email, result: result.data, locale }).then(setHandoff);
    setSent(true);
  };

  if (sent) {
    return (
      <FormSuccess ref={successRef} title={c.success.title}>
        <p>{c.success.text}</p>
        {handoff ? <UploadHandoff {...handoff} onClose={() => setHandoff(null)} /> : <p className="mt-3 text-small text-text-soft">{c.photos.textNoUpload}</p>}
      </FormSuccess>
    );
  }

  const opt = c.optional;
  return (
    <form method="post" noValidate onSubmit={onSubmit} onFocus={() => prefetchHandoff(locale)} aria-labelledby="wl-form-title" className="relative space-y-10" data-testid="wl-form">
      <Honeypot id="wl-website" />
      <p className="text-small text-text-soft">{c.required}</p>

      <RadioCards
        id="wl-variant"
        name="variant"
        legend={c.variant.legend}
        legendSize="label"
        options={VARIANT_KEYS.map((value) => ({ value, label: c.variant[value] }))}
        value={values.variant}
        onChange={(v) => set("variant", v)}
        error={errors["wl-variant"]}
      />

      <fieldset className="min-w-0">
        <legend className="block text-ui text-text">
          {c.list.legend}
          <span aria-hidden="true"> *</span>
        </legend>
        <p className="mt-1 text-small text-text-soft">{c.list.hint}</p>
        <ol className="mt-4 space-y-6">
          {values.rows.map((row, i) => (
            <li key={row.id} className="border-t border-line pt-4">
              <fieldset className="min-w-0">
                <legend className="text-small text-text-soft">{fill(c.list.item, { n: i + 1 })}</legend>
                <div className="mt-2 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,2fr)]">
                  <FormField id={`wl-row-${i}-type`} as="select" name={`type-${i}`} label={c.list.type} required error={errors[`wl-row-${i}-type`]} value={row.type} onChange={(e) => setRow(i, "type", e.target.value)}>
                    <option value="">–</option>
                    {FURNITURE_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {c.list.types[k]}
                      </option>
                    ))}
                  </FormField>
                  <FormField
                    id={`wl-row-${i}-count`}
                    name={`count-${i}`}
                    inputMode="numeric"
                    label={c.list.count}
                    required
                    error={errors[`wl-row-${i}-count`]}
                    value={row.count}
                    maxLength={2}
                    onChange={(e) => setRow(i, "count", e.target.value)}
                    controlClassName="tabular-nums"
                  />
                  <FormField id={`wl-row-${i}-material`} as="select" name={`material-${i}`} label={c.list.material} required error={errors[`wl-row-${i}-material`]} value={row.material} onChange={(e) => setRow(i, "material", e.target.value)}>
                    <option value="">–</option>
                    {FORM_MATERIAL_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {c.list.materials[k]}
                      </option>
                    ))}
                  </FormField>
                </div>
                <FormField
                  id={`wl-row-${i}-note`}
                  name={`note-${i}`}
                  label={c.list.note}
                  optionalText={opt}
                  placeholder={c.list.notePlaceholder}
                  value={row.note}
                  maxLength={120}
                  onChange={(e) => setRow(i, "note", e.target.value)}
                  className="mt-4"
                />
                {values.rows.length > 1 && (
                  <Button variant="ghost" className="mt-2" onClick={() => removeRow(i)}>
                    {fill(c.list.remove, { n: i + 1 })}
                  </Button>
                )}
              </fieldset>
            </li>
          ))}
        </ol>
        {values.rows.length < max ? (
          <Button variant="secondary" className="mt-6" onClick={addRow}>
            {c.list.add}
          </Button>
        ) : (
          <p className="mt-6 text-small text-text-soft">{fill(c.list.max, { max })}</p>
        )}
      </fieldset>

      {(WINTERLAGER_CONFIG.kleinreparaturAufAnfrage || WINTERLAGER_CONFIG.aufbauAufWunsch) && (
        <fieldset className="min-w-0">
          <legend className="block text-ui text-text">
            {c.extras.legend} <span className="font-normal text-text-soft">({opt})</span>
          </legend>
          <div className="mt-3 space-y-2">
            {WINTERLAGER_CONFIG.kleinreparaturAufAnfrage && (
              <label htmlFor="wl-reparatur" className="flex min-h-11 cursor-pointer items-start gap-3 text-body text-text">
                <input id="wl-reparatur" type="checkbox" name="reparatur" checked={values.reparatur} onChange={(e) => set("reparatur", e.target.checked)} className="mt-1 size-5 flex-none accent-ink" />
                <span>{c.extras.reparatur}</span>
              </label>
            )}
            {WINTERLAGER_CONFIG.aufbauAufWunsch && (
              <label htmlFor="wl-aufbau" className="flex min-h-11 cursor-pointer items-start gap-3 text-body text-text">
                <input id="wl-aufbau" type="checkbox" name="aufbau" checked={values.aufbau} onChange={(e) => set("aufbau", e.target.checked)} className="mt-1 size-5 flex-none accent-ink" />
                <span>{c.extras.aufbau}</span>
              </label>
            )}
          </div>
        </fieldset>
      )}

      <fieldset className="min-w-0">
        <legend className="block text-ui text-text">{c.address.legend}</legend>
        <p className="mt-1 text-small text-text-soft">{c.address.hint}</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <FormField id="wl-street" name="street" label={c.address.street} optionalText={opt} autoComplete="street-address" value={values.street} maxLength={160} onChange={(e) => set("street", e.target.value)} className="sm:col-span-2" />
          <FormField id="wl-zip" name="zip" label={c.address.zip} required autoComplete="postal-code" inputMode="numeric" error={errors["wl-zip"]} value={values.zip} maxLength={12} onChange={(e) => set("zip", e.target.value)} />
          <FormField id="wl-city" name="city" label={c.address.city} required autoComplete="address-level2" error={errors["wl-city"]} value={values.city} maxLength={100} onChange={(e) => set("city", e.target.value)} />
          <FormField id="wl-country" as="select" name="country" label={c.address.country} autoComplete="country" value={values.country} onChange={(e) => set("country", e.target.value)}>
            {COUNTRY_KEYS.map((k) => (
              <option key={k} value={k}>
                {c.address.countries[k]}
              </option>
            ))}
          </FormField>
          <FormField
            id="wl-access"
            as="textarea"
            name="access"
            label={c.address.access}
            optionalText={opt}
            placeholder={c.address.accessPlaceholder}
            value={values.access}
            maxLength={300}
            rows={2}
            onChange={(e) => set("access", e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="block text-ui text-text">{c.dates.legend}</legend>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <FormField id="wl-pickup" as="select" name="pickup" label={c.dates.pickup} value={values.pickup} onChange={(e) => set("pickup", e.target.value)}>
            {PICKUP_KEYS.map((k) => (
              <option key={k} value={k}>
                {c.dates.pickupOptions[k]}
              </option>
            ))}
          </FormField>
          <FormField id="wl-back" as="select" name="back" label={c.dates.back} value={values.back} onChange={(e) => set("back", e.target.value)}>
            {RETURN_KEYS.map((k) => (
              <option key={k} value={k}>
                {c.dates.returnOptions[k]}
              </option>
            ))}
          </FormField>
          <FormField
            id="wl-dateNote"
            name="dateNote"
            label={c.dates.note}
            optionalText={opt}
            placeholder={c.dates.notePlaceholder}
            value={values.dateNote}
            maxLength={200}
            onChange={(e) => set("dateNote", e.target.value)}
            className="sm:col-span-2"
          />
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="block text-ui text-text">{c.contact.legend}</legend>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <FormField id="wl-vorname" name="vorname" label={c.contact.vorname} required autoComplete="given-name" error={errors["wl-vorname"]} value={values.vorname} maxLength={100} onChange={(e) => set("vorname", e.target.value)} />
          <FormField id="wl-nachname" name="nachname" label={c.contact.nachname} required autoComplete="family-name" error={errors["wl-nachname"]} value={values.nachname} maxLength={100} onChange={(e) => set("nachname", e.target.value)} />
          <FormField id="wl-email" name="email" type="email" inputMode="email" label={c.contact.email} required autoComplete="email" error={errors["wl-email"]} value={values.email} maxLength={254} onChange={(e) => set("email", e.target.value)} />
          <FormField id="wl-telefon" name="telefon" type="tel" inputMode="tel" label={c.contact.telefon} optionalText={opt} autoComplete="tel" error={errors["wl-telefon"]} value={values.telefon} maxLength={40} onChange={(e) => set("telefon", e.target.value)} />
          <FormField id="wl-message" as="textarea" name="message" label={c.contact.message} optionalText={opt} value={values.message} maxLength={4000} rows={3} onChange={(e) => set("message", e.target.value)} className="sm:col-span-2" />
        </div>
      </fieldset>

      <div>
        <p className="text-ui text-text">{c.photos.title}</p>
        <p className="mt-1 text-small text-text-soft">{uploadPossible ? c.photos.text : c.photos.textNoUpload}</p>
      </div>

      <FormAlert status={status} />

      <div className="space-y-4">
        <Button type="submit" disabled={!hydrated || loading} aria-disabled={loading || undefined} fullWidth className="sm:w-auto">
          {loading ? c.sending : c.submit}
        </Button>
        <FormPrivacyNote />
      </div>
    </form>
  );
}
