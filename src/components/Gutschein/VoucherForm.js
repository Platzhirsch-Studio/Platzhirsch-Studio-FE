"use client";
// Gutschein-Anfrage (Paket R5-commerce, Masterplan AP9 Nr. 1).
// Schickt eine ANFRAGE an /api/gutschein_anfrage (VOUCHER_MODE=anfrage).
// Es wird nichts bestellt und nichts bezahlt; das Team meldet sich persönlich.
// In der Vorschau (`demo`) wird nichts gesendet.
//
// Barrierefreiheit (WCAG 2.2 AA, Bibel §9/§14): sichtbare Labels, Betrag als
// echte Radiogruppe mit eigenem Betrag, Fehler am Feld (aria-invalid,
// aria-describedby) plus Zusammenfassung in einer höflichen Live-Region,
// Fokus auf das erste fehlerhafte Feld bzw. auf die Bestätigung. 52-px-Felder,
// 16-px-Schrift, Knopf erst nach der Hydrierung aktiv.
// Texte nur auf Deutsch (Seite ist DE-only).
import { useEffect, useId, useRef, useState } from "react";
import { trackLead } from "@/lib/analytics";
import { sendCommerce, errorTextOf } from "@/lib/commerce/client";
import { formatEuro } from "@/lib/commerce/priceRules";
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_PRESETS,
  GREETING_MAX,
  MOTIFS,
  NOTE_MAX,
  QUANTITY_MAX,
  parseAmount,
} from "@/lib/commerce/voucherConfig";
import FormField, { FieldError, RadioCards, fieldBorder } from "@/components/Forms/FormField";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import useFormGuard, { focusField, useHydrated } from "@/components/Forms/useFormGuard";
import cx from "@/components/ui/cx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;

const EMPTY = {
  preset: "100",
  eigenerBetrag: "",
  anzahl: "1",
  motiv: "",
  empfaenger: "",
  grusstext: "",
  firma: "",
  name: "",
  email: "",
  telefon: "",
  anmerkung: "",
};

const ORDER = ["betrag", "anzahl", "motiv", "grusstext", "name", "email", "telefon", "anmerkung"];

export function amountOf(form) {
  return form.preset === "eigener" ? parseAmount(form.eigenerBetrag) : Number(form.preset);
}

export function validateVoucher(form) {
  const errors = {};
  const betrag = amountOf(form);
  if (!Number.isFinite(betrag)) errors.betrag = "Bitte geben Sie einen Betrag in Euro an.";
  else if (!Number.isInteger(betrag)) errors.betrag = "Bitte einen Betrag in ganzen Euro angeben.";
  else if (betrag < AMOUNT_MIN) errors.betrag = `Der Betrag beginnt bei ${AMOUNT_MIN} €.`;
  else if (betrag > AMOUNT_MAX) errors.betrag = `Für Beträge über ${formatEuro(AMOUNT_MAX)} sprechen Sie uns bitte direkt an.`;
  const anzahl = Number(form.anzahl);
  if (!Number.isInteger(anzahl) || anzahl < 1 || anzahl > QUANTITY_MAX) errors.anzahl = `Bitte eine Stückzahl von 1 bis ${QUANTITY_MAX}.`;
  if (!form.motiv) errors.motiv = "Bitte wählen Sie ein Motiv.";
  if (form.grusstext.length > GREETING_MAX) errors.grusstext = `Höchstens ${GREETING_MAX} Zeichen.`;
  if (form.name.trim().length < 2) errors.name = "Bitte geben Sie Ihren Namen an.";
  if (!form.email.trim()) errors.email = "Bitte geben Sie Ihre E-Mail-Adresse an.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Bitte prüfen Sie die E-Mail-Adresse, zum Beispiel name@beispiel.at.";
  if (form.telefon.trim() && !PHONE_RE.test(form.telefon.trim())) errors.telefon = "Bitte prüfen Sie die Telefonnummer (6 bis 20 Ziffern).";
  if (form.anmerkung.length > NOTE_MAX) errors.anmerkung = `Höchstens ${NOTE_MAX} Zeichen.`;
  return errors;
}

/** Feld-Id für die Fehlerzusammenfassung. */
const idOf = (base, key) =>
  ({
    betrag: `${base}-betrag`,
    anzahl: `${base}-anzahl`,
    motiv: `${base}-motiv`,
    grusstext: `${base}-grusstext`,
    name: `${base}-name`,
    email: `${base}-email`,
    telefon: `${base}-telefon`,
    anmerkung: `${base}-anmerkung`,
  })[key];

export default function VoucherForm({ demo = false }) {
  const base = `gs${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(null);
  const successRef = useRef(null);
  const guard = useFormGuard();
  const hydrated = useHydrated();

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const set = (name, value) => {
    const next = { ...form, [name]: value };
    setForm(next);
    if (Object.keys(errors).length) {
      const found = validateVoucher(next);
      setErrors((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, found[k]]).filter(([, v]) => v)));
    }
  };
  const onChange = (e) => set(e.target.name, e.target.value);

  const betrag = amountOf(form);
  const anzahl = Number(form.anzahl);
  const summaryValid = Number.isInteger(betrag) && betrag >= AMOUNT_MIN && betrag <= AMOUNT_MAX && Number.isInteger(anzahl) && anzahl >= 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    const found = validateVoucher(form);
    setErrors(found);
    const keys = ORDER.filter((k) => found[k]);
    if (keys.length) {
      setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: keys.map((k) => ({ id: idOf(base, k), text: found[k] })) });
      focusField(keys[0] === "betrag" && form.preset !== "eigener" ? `${base}-betrag-0` : keys[0] === "motiv" ? `${base}-motiv-0` : idOf(base, keys[0]));
      return;
    }
    const payload = guard(
      {
        betrag,
        anzahl,
        motiv: form.motiv,
        empfaenger: form.empfaenger.trim(),
        grusstext: form.grusstext.trim(),
        firma: form.firma.trim(),
        name: form.name.trim(),
        email: form.email.trim(),
        telefon: form.telefon.trim(),
        anmerkung: form.anmerkung.trim(),
      },
      e.currentTarget
    );
    setLoading(true);
    setStatus(null);
    const result = await sendCommerce("/api/gutschein_anfrage", payload, { field: "anmerkung", demo });
    setLoading(false);
    if (!result.ok) {
      if (result.code === "invalid" && result.field && idOf(base, result.field)) {
        const text = result.message || "Bitte prüfen Sie diese Angabe.";
        setErrors({ [result.field]: text });
        setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: [{ id: idOf(base, result.field), text }] });
        focusField(idOf(base, result.field));
      } else {
        setStatus({ type: "error", text: errorTextOf(result.code) });
      }
      return;
    }
    if (!result.demo) trackLead("gutschein", { transaction_id: result.leadRef });
    setSent({ name: form.name.trim(), demo: Boolean(result.demo), betrag, anzahl });
    setForm(EMPTY);
    setErrors({});
  };

  if (sent) {
    return (
      <FormSuccess ref={successRef} title={sent.demo ? "Vorschau: so sieht die Bestätigung aus" : "Anfrage angekommen"}>
        {sent.demo && <p className="mb-4 text-small text-text-soft">In der Vorschau wird nichts gesendet.</p>}
        <p>
          Danke, {sent.name}. Ihre Anfrage für {sent.anzahl} {sent.anzahl === 1 ? "Gutschein" : "Gutscheine"} zu je {formatEuro(sent.betrag)} ist bei
          uns. Wir melden uns persönlich bei Ihnen und besprechen Motiv, Zustellung und die nächsten Schritte.
        </p>
        <p className="mt-4">Mit dieser Anfrage ist nichts bestellt und nichts zu bezahlen.</p>
        <button
          type="button"
          onClick={() => {
            setSent(null);
            requestAnimationFrame(() => document.getElementById(`${base}-betrag-0`)?.focus());
          }}
          className="mt-6 flex min-h-11 items-center text-ui underline underline-offset-4"
        >
          Weitere Anfrage
        </button>
      </FormSuccess>
    );
  }

  const presetOptions = [...AMOUNT_PRESETS.map((v) => ({ value: String(v), label: formatEuro(v) })), { value: "eigener", label: "Eigener Betrag" }];

  return (
    <form method="post" onSubmit={handleSubmit} noValidate aria-describedby={`${base}-pflicht`} className="relative space-y-10">
      <FormAlert status={status} />
      <p id={`${base}-pflicht`} className="text-small text-text-soft">
        Felder mit * brauchen wir für die Anfrage.
      </p>

      {/* Betrag */}
      <fieldset id={idOf(base, "betrag")} tabIndex={-1} aria-describedby={errors.betrag ? `${base}-betrag-error` : `${base}-betrag-hint`} className="min-w-0 focus:outline-none">
        <legend className="text-title text-text">Betrag je Gutschein</legend>
        <p id={`${base}-betrag-hint`} className="mt-2 text-small text-text-soft">
          Ab {AMOUNT_MIN} €, in ganzen Euro.
        </p>
        <div className="mt-stack-s grid grid-cols-2 gap-3 sm:grid-cols-3">
          {presetOptions.map((option, index) => (
            <label
              key={option.value}
              htmlFor={`${base}-betrag-${index}`}
              className={cx(
                "flex min-h-13 cursor-pointer items-center gap-3 bg-surface px-4 py-3 text-ui text-text tabular-nums transition-colors duration-(--duration-micro) ease-quiet has-checked:bg-surface-raised",
                errors.betrag && form.preset !== "eigener"
                  ? "border-2 border-error"
                  : "border border-line-control hover:border-ink has-checked:border-2 has-checked:border-ink has-checked:px-[15px]"
              )}
            >
              <input
                id={`${base}-betrag-${index}`}
                type="radio"
                name="preset"
                value={option.value}
                checked={form.preset === option.value}
                onChange={() => set("preset", option.value)}
                className="size-5 flex-none accent-ink"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {form.preset === "eigener" && (
          <div className="mt-4 max-w-xs">
            <label htmlFor={`${base}-eigener`} className="block text-ui text-text">
              Eigener Betrag in Euro <span aria-hidden="true">*</span>
            </label>
            <input
              id={`${base}-eigener`}
              name="eigenerBetrag"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              aria-invalid={errors.betrag ? true : undefined}
              aria-describedby={errors.betrag ? `${base}-betrag-error` : `${base}-betrag-hint`}
              value={form.eigenerBetrag}
              onChange={onChange}
              className={cx("mt-2 block h-13 w-full bg-surface px-4 text-ui font-normal text-text tabular-nums", fieldBorder(errors.betrag))}
            />
          </div>
        )}
        <FieldError id={`${base}-betrag-error`}>{errors.betrag}</FieldError>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          id={idOf(base, "anzahl")}
          name="anzahl"
          label="Stückzahl"
          required
          type="number"
          inputMode="numeric"
          min={1}
          max={QUANTITY_MAX}
          value={form.anzahl}
          onChange={onChange}
          error={errors.anzahl}
          hint="Mehrere Gutscheine mit gleichem Wert, zum Beispiel als Firmengeschenk."
          controlClassName="tabular-nums"
        />
        <div className="self-end pb-1" aria-live="polite">
          {summaryValid && (
            <p className="text-ui text-text tabular-nums">
              {anzahl} × {formatEuro(betrag)}
              {anzahl > 1 && <> = {formatEuro(betrag * anzahl)}</>}
            </p>
          )}
        </div>
      </div>

      <RadioCards
        id={idOf(base, "motiv")}
        name="motiv"
        legend="Motiv"
        options={MOTIFS.map((m) => ({
          value: m.id,
          label: (
            <span className="flex flex-col">
              <span>{m.label}</span>
              <span className="text-small font-normal text-text-soft">{m.text}</span>
            </span>
          ),
        }))}
        value={form.motiv}
        onChange={(v) => set("motiv", v)}
        error={errors.motiv}
      />

      <fieldset className="min-w-0 space-y-6">
        <legend className="text-title text-text">Für wen?</legend>
        <FormField id={`${base}-empfaenger`} name="empfaenger" label="Name auf dem Gutschein" optionalText="optional" value={form.empfaenger} onChange={onChange} maxLength={120} autoComplete="off" />
        <FormField
          id={idOf(base, "grusstext")}
          as="textarea"
          name="grusstext"
          label="Grußtext"
          optionalText="optional"
          value={form.grusstext}
          onChange={onChange}
          error={errors.grusstext}
          rows={3}
          hint={`${form.grusstext.length} von ${GREETING_MAX} Zeichen`}
        />
        <FormField
          id={`${base}-firma`}
          name="firma"
          label="Firma"
          optionalText="optional"
          hint="Nur bei Firmengeschenken."
          value={form.firma}
          onChange={onChange}
          autoComplete="organization"
          maxLength={200}
        />
      </fieldset>

      <fieldset className="min-w-0 space-y-6">
        <legend className="text-title text-text">Ihre Kontaktdaten</legend>
        <FormField id={idOf(base, "name")} name="name" label="Ihr Name" required value={form.name} onChange={onChange} error={errors.name} autoComplete="name" maxLength={200} />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField id={idOf(base, "email")} name="email" type="email" label="E-Mail" required value={form.email} onChange={onChange} error={errors.email} autoComplete="email" inputMode="email" maxLength={254} />
          <FormField id={idOf(base, "telefon")} name="telefon" type="tel" label="Telefon" optionalText="optional" value={form.telefon} onChange={onChange} error={errors.telefon} autoComplete="tel" maxLength={40} />
        </div>
        <FormField
          id={idOf(base, "anmerkung")}
          as="textarea"
          name="anmerkung"
          label="Anmerkung"
          optionalText="optional"
          hint="Zum Beispiel ein Wunschtermin für die Abholung im Showroom."
          value={form.anmerkung}
          onChange={onChange}
          error={errors.anmerkung}
          rows={3}
        />
      </fieldset>

      <Honeypot id={`${base}-website`} />

      <div className="space-y-4">
        <button
          type="submit"
          disabled={!hydrated || loading}
          aria-describedby={`${base}-unverbindlich`}
          className="inline-flex min-h-12 w-full items-center justify-center bg-action px-8 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:min-h-13"
        >
          {loading ? "Wird gesendet …" : "Gutschein anfragen"}
        </button>
        <p id={`${base}-unverbindlich`} className="max-w-measure text-small text-text-soft">
          Unverbindlich: Mit der Anfrage ist nichts bestellt und nichts zu bezahlen. Wir melden uns persönlich.
        </p>
        <FormPrivacyNote />
      </div>
    </form>
  );
}
