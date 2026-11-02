"use client";

// Anfrageformular Pflege-Service (Lead-Kontext „pflege“).
// Versand über das bestehende Beratungs-Backend (/api/upload/inquiry/beratung,
// Payload: src/lib/service/pflege/anfrage.js). Danach die Handy-Upload-Karte
// für Fotos (nur DE, lazyHandoff). Formular-Vertrag (Honeypot, _t, Herkunft,
// lead_ref): src/lib/forms/client.js. Kein Absenden in Tests (blockFormSends).
//
// Barrierefreiheit (Bibel §14): sichtbare Labels, Fehler am Feld mit Icon und
// Text (aria-invalid/-describedby), Fehler-Zusammenfassung in EINER
// Live-Region, Fokus auf das erste fehlerhafte Feld, Senden-Knopf bis zur
// Hydrierung deaktiviert, method="post" (nie personenbezogene Daten in der URL).
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import cx from "@/components/ui/cx";
import { FieldError, FormAlert, FormField, FormPrivacyNote, FormSuccess, Honeypot, RadioCards, fieldBorder, focusField, useFormGuard, useHydrated } from "@/components/Forms";
import { UploadHandoff, handoffAfterSend, handoffAllowed, prefetchHandoff } from "@/components/Forms/lazyHandoff";
import { postForm } from "@/lib/forms/client";
import { trackLead } from "@/lib/analytics";
import { pflegeCopy } from "@/lib/service/pflege/copy";
import { MATERIAL_KEYS } from "@/lib/service/pflege/materials";
import { FIELD_ORDER, ZEITRAEUME, emptyValues, prefillFromSearch, toBeratungPayload, validate, validateField } from "@/lib/service/pflege/anfrage";

const ID = (name) => `pflege-${name}`;

export default function PflegeAnfrage({ locale = "de", copy = null }) {
  // FR/IT: Formulartexte kommen vom Server (PflegePage, copy-intl.js).
  const c = copy || pflegeCopy(locale).FORM;
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const successRef = useRef(null);
  const uploadPossible = handoffAllowed(locale);

  // Vorbelegung aus dem Portal (?stueck=, ?material=, ?art=abo) – nach dem
  // Mount, damit die Seite statisch bleibt und das Server-HTML stimmt.
  useEffect(() => {
    const pre = prefillFromSearch(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- einmalige Übernahme aus der URL nach dem Mount
    if (Object.keys(pre).length) setValues((v) => ({ ...v, ...pre }));
  }, []);

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const set = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) {
      const next = { ...values, [name]: value };
      const e = validateField(name, next);
      setErrors((old) => {
        const copy = { ...old };
        if (e) copy[name] = e;
        else delete copy[name];
        return copy;
      });
    }
  };
  const blur = (name) => {
    const e = validateField(name, values);
    if (e && String(values[name] ?? "").length === 0 && !errors[name]) return; // leeres Feld erst beim Senden melden
    setErrors((old) => {
      const copy = { ...old };
      if (e) copy[name] = e;
      else delete copy[name];
      return copy;
    });
  };
  const err = (name) => (errors[name] ? c.errors[errors[name]] : undefined);

  const toggleMaterial = (key) => {
    const has = values.material.includes(key);
    set("material", has ? values.material.filter((m) => m !== key) : [...values.material, key]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    if (Object.keys(found).length) {
      setErrors(found);
      setStatus({
        type: "summary",
        title: c.summaryTitle,
        items: FIELD_ORDER.filter((k) => found[k]).map((k) => ({ id: ID(k), text: c.errors[found[k]] })),
      });
      focusField(ID(FIELD_ORDER.find((k) => found[k])));
      return;
    }
    setLoading(true);
    setStatus(null);
    const payload = toBeratungPayload(values, { locale, nachkaufText: `${c.nachkaufLabel} ${c.nachkaufHint}` });
    const result = await postForm("/api/upload/inquiry/beratung", guard(payload, e.currentTarget), {
      lead: { pageContext: c.backoffice.context },
    });
    setLoading(false);
    if (!result.ok) {
      setStatus({ type: "error", text: c.requestErrors[result.code] || c.requestErrors.default });
      return;
    }
    trackLead("pflege", { transaction_id: result.leadRef });
    handoffAfterSend("beratung", { email: values.email, result: result.data, locale }).then(setHandoff);
    setSent(true);
  };

  if (sent) {
    return (
      <FormSuccess ref={successRef} title={c.successTitle}>
        <p>{c.successText}</p>
        {handoff ? <UploadHandoff {...handoff} onClose={() => setHandoff(null)} /> : <p className="mt-3 text-small text-text-soft">{c.fotosHintNoUpload}</p>}
        <Button
          variant="link"
          className="mt-4"
          onClick={() => {
            setValues(emptyValues());
            setErrors({});
            setHandoff(null);
            setSent(false);
          }}
        >
          {c.again}
        </Button>
      </FormSuccess>
    );
  }

  const matErr = err("material");
  return (
    <form method="post" noValidate onSubmit={onSubmit} onFocus={() => prefetchHandoff(locale)} aria-labelledby="pflege-anfrage-title" className="relative space-y-8" data-testid="pflege-form">
      <Honeypot id="pflege-website" />

      <fieldset id={ID("material")} tabIndex={-1} aria-describedby={matErr ? `${ID("material")}-error` : undefined} className="min-w-0 focus:outline-none">
        <legend className="block text-ui text-text">
          {c.materialLegend}
          <span aria-hidden="true"> *</span>
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {MATERIAL_KEYS.map((key) => (
            <label
              key={key}
              htmlFor={`${ID("material")}-${key}`}
              className={cx(
                "flex min-h-14 cursor-pointer items-center gap-3 bg-surface px-4 py-3 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet has-checked:bg-surface-raised",
                matErr ? fieldBorder(true) : "border border-line-control hover:border-ink has-checked:border-ink"
              )}
            >
              <input
                id={`${ID("material")}-${key}`}
                type="checkbox"
                name="material"
                value={key}
                checked={values.material.includes(key)}
                onChange={() => toggleMaterial(key)}
                className="size-5 flex-none accent-ink"
              />
              <span>{c.materialOptions[key]}</span>
            </label>
          ))}
        </div>
        <FieldError id={`${ID("material")}-error`}>{matErr}</FieldError>
      </fieldset>

      <FormField
        id={ID("stuecke")}
        as="textarea"
        name="stuecke"
        label={c.stueckeLabel}
        required
        hint={c.stueckeHint}
        error={err("stuecke")}
        value={values.stuecke}
        maxLength={1500}
        rows={4}
        onChange={(e) => set("stuecke", e.target.value)}
        onBlur={() => blur("stuecke")}
      />

      <RadioCards
        id={ID("art")}
        name="art"
        legend={c.artLegend}
        legendSize="label"
        options={["einmalig", "abo"].map((value) => ({ value, label: c.artOptions[value] }))}
        value={values.art}
        onChange={(v) => set("art", v)}
        error={err("art")}
        className="sm:[&_.grid]:grid-cols-2"
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          id={ID("zeitraum")}
          as="select"
          name="zeitraum"
          label={c.zeitraumLabel}
          required
          error={err("zeitraum")}
          value={values.zeitraum}
          onChange={(e) => set("zeitraum", e.target.value)}
        >
          <option value="">{c.zeitraumOptions[""]}</option>
          {ZEITRAEUME.map((z) => (
            <option key={z} value={z}>
              {c.zeitraumOptions[z]}
            </option>
          ))}
        </FormField>
        <FormField
          id={ID("ort")}
          name="ort"
          label={c.ortLabel}
          required
          hint={c.ortHint}
          error={err("ort")}
          value={values.ort}
          maxLength={120}
          autoComplete="address-level2"
          onChange={(e) => set("ort", e.target.value)}
          onBlur={() => blur("ort")}
        />
      </div>

      <FormField
        id={ID("nachricht")}
        as="textarea"
        name="nachricht"
        label={c.nachrichtLabel}
        optionalText={c.optional}
        value={values.nachricht}
        maxLength={3000}
        rows={3}
        onChange={(e) => set("nachricht", e.target.value)}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id={ID("vorname")} name="vorname" label={c.vornameLabel} required autoComplete="given-name" error={err("vorname")} value={values.vorname} maxLength={100} onChange={(e) => set("vorname", e.target.value)} onBlur={() => blur("vorname")} />
        <FormField id={ID("nachname")} name="nachname" label={c.nachnameLabel} required autoComplete="family-name" error={err("nachname")} value={values.nachname} maxLength={100} onChange={(e) => set("nachname", e.target.value)} onBlur={() => blur("nachname")} />
        <FormField id={ID("email")} name="email" type="email" inputMode="email" label={c.emailLabel} required autoComplete="email" error={err("email")} value={values.email} maxLength={254} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} />
        <FormField id={ID("telefon")} name="telefon" type="tel" inputMode="tel" label={c.telefonLabel} optionalText={c.optional} autoComplete="tel" error={err("telefon")} value={values.telefon} maxLength={40} onChange={(e) => set("telefon", e.target.value)} onBlur={() => blur("telefon")} />
      </div>

      <div>
        <label htmlFor={ID("nachkauf")} className="flex min-h-11 cursor-pointer items-start gap-3 text-body text-text">
          <input
            id={ID("nachkauf")}
            type="checkbox"
            name="nachkauf"
            checked={values.nachkauf}
            onChange={(e) => set("nachkauf", e.target.checked)}
            aria-describedby={`${ID("nachkauf")}-hint`}
            className="mt-1 size-5 flex-none accent-ink"
          />
          <span>{c.nachkaufLabel}</span>
        </label>
        <p id={`${ID("nachkauf")}-hint`} className="mt-1 pl-8 text-small text-text-soft">
          {c.nachkaufHint}
        </p>
      </div>

      <p className="text-small text-text-soft">{uploadPossible ? c.fotosHint : c.fotosHintNoUpload}</p>

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
