"use client";
// Gutscheinkauf mit Zahlung (VOUCHER_MODE=stripe). Schickt die Angaben an
// /api/payments/gutschein/checkout und leitet zur gehosteten Stripe-
// Bezahlseite weiter. Kartendaten erreichen uns nie.
//
// Recht: Zusammenfassung (Wert, Stückzahl, Gesamtpreis – USt-Hinweis aus
// voucherPriceLabel() je nach Einzweck/Mehrzweck, keine
// Versandkosten) direkt über der Schaltfläche; Bestätigung der
// Gutscheinbedingungen und Kenntnis der Widerrufsbelehrung als Checkbox,
// NICHT vorangekreuzt; Schaltfläche „Zahlungspflichtig kaufen“ (§ 8 Abs 2
// FAGG, § 312j Abs 3 BGB); Hinweis auf Rechnung/Beleg.
// Nur clientsichere Importe (keine Datei aus src/lib/payments).
// `mock`: Entwicklungs-Mock (Kopfzeile x-payments-mock: 1), `demo`: Vorschau ohne Senden.
import { useEffect, useId, useRef, useState } from "react";
import { formatEuro } from "@/lib/commerce/priceRules";
import { errorTextOf } from "@/lib/commerce/client";
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_PRESETS,
  BUY_BUTTON_LABEL,
  GREETING_MAX,
  MOTIFS,
  ONLINE_QUANTITY_MAX,
  ONLINE_TOTAL_MAX,
  parseAmount,
} from "@/lib/commerce/voucherConfig";
import { readFormResponse } from "@/lib/forms/client";
import FormField, { FieldError, RadioCards, fieldBorder } from "@/components/Forms/FormField";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import useFormGuard, { focusField, useHydrated } from "@/components/Forms/useFormGuard";
import SmartLink from "@/components/ui/SmartLink";
import cx from "@/components/ui/cx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = { preset: "100", eigenerBetrag: "", anzahl: "1", motiv: "", empfaenger: "", grusstext: "", firma: "", name: "", email: "", bedingungen: false };
const ORDER = ["betrag", "anzahl", "motiv", "grusstext", "name", "email", "bedingungen"];

export const amountOf = (form) => (form.preset === "eigener" ? parseAmount(form.eigenerBetrag) : Number(form.preset));

export function validatePurchase(form) {
  const errors = {};
  const betrag = amountOf(form);
  if (!Number.isFinite(betrag)) errors.betrag = "Bitte geben Sie einen Betrag in Euro an.";
  else if (!Number.isInteger(betrag)) errors.betrag = "Bitte einen Betrag in ganzen Euro angeben.";
  else if (betrag < AMOUNT_MIN) errors.betrag = `Der Betrag beginnt bei ${AMOUNT_MIN} €.`;
  else if (betrag > AMOUNT_MAX) errors.betrag = `Für Beträge über ${formatEuro(AMOUNT_MAX)} sprechen Sie uns bitte direkt an.`;
  const anzahl = Number(form.anzahl);
  if (!Number.isInteger(anzahl) || anzahl < 1 || anzahl > ONLINE_QUANTITY_MAX) errors.anzahl = `Online 1 bis ${ONLINE_QUANTITY_MAX} Gutscheine je Bestellung.`;
  else if (!errors.betrag && betrag * anzahl > ONLINE_TOTAL_MAX) errors.anzahl = `Online bis ${formatEuro(ONLINE_TOTAL_MAX)} je Bestellung. Für mehr senden Sie uns bitte eine Anfrage.`;
  if (!form.motiv) errors.motiv = "Bitte wählen Sie ein Motiv.";
  if (form.grusstext.length > GREETING_MAX) errors.grusstext = `Höchstens ${GREETING_MAX} Zeichen.`;
  if (form.name.trim().length < 2) errors.name = "Bitte geben Sie Ihren Namen an.";
  if (!form.email.trim()) errors.email = "Bitte geben Sie Ihre E-Mail-Adresse an.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Bitte prüfen Sie die E-Mail-Adresse, zum Beispiel name@beispiel.at.";
  if (form.bedingungen !== true) errors.bedingungen = "Bitte bestätigen Sie die Gutscheinbedingungen und die Widerrufsbelehrung.";
  return errors;
}

export default function VoucherPurchaseForm({ mock = false, demo = false, priceLabel = { total: "Gesamtpreis", note: "" }, termsHref = "/gutscheinbedingungen", withdrawalHref = "#widerrufsbelehrung" }) {
  const base = `gk${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const doneRef = useRef(null);
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const id = (k) => `${base}-${k}`;

  useEffect(() => {
    if (demoDone) doneRef.current?.focus();
  }, [demoDone]);

  const set = (name, value) => {
    const next = { ...form, [name]: value };
    setForm(next);
    if (Object.keys(errors).length) {
      const found = validatePurchase(next);
      setErrors((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, found[k]]).filter(([, v]) => v)));
    }
  };
  const onChange = (e) => set(e.target.name, e.target.value);

  const betrag = amountOf(form);
  const anzahl = Number(form.anzahl);
  const valid = Number.isInteger(betrag) && betrag >= AMOUNT_MIN && betrag <= AMOUNT_MAX && Number.isInteger(anzahl) && anzahl >= 1 && anzahl <= ONLINE_QUANTITY_MAX;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    const found = validatePurchase(form);
    setErrors(found);
    const keys = ORDER.filter((k) => found[k]);
    if (keys.length) {
      setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: keys.map((k) => ({ id: id(k), text: found[k] })) });
      focusField(keys[0] === "betrag" && form.preset !== "eigener" ? id("betrag-0") : keys[0] === "motiv" ? id("motiv-0") : id(keys[0]));
      return;
    }
    if (demo) {
      setDemoDone(true);
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
        bedingungen: form.bedingungen === true,
      },
      e.currentTarget
    );
    setLoading(true);
    setStatus(null);
    let result;
    try {
      const response = await fetch("/api/payments/gutschein/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(mock ? { "x-payments-mock": "1" } : {}) },
        body: JSON.stringify(payload),
      });
      result = response.status === 404 ? { ok: false, code: "not_found" } : await readFormResponse(response);
    } catch {
      result = { ok: false, code: "network" };
    }
    const url = result.data?.url;
    if (result.ok && typeof url === "string" && (url.startsWith("https://checkout.stripe.com/") || url.startsWith("/") || (mock && url.startsWith(window.location.origin)))) {
      window.location.assign(url);
      return;
    }
    setLoading(false);
    if (result.code === "invalid" && result.field && ORDER.includes(result.field)) {
      const text = result.data?.error || "Bitte prüfen Sie diese Angabe.";
      setErrors({ [result.field]: text });
      setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: [{ id: id(result.field), text }] });
      focusField(id(result.field));
      return;
    }
    setStatus({ type: "error", text: result.code === "upstream" || result.code === "unavailable" ? "Die Bezahlseite ist gerade nicht erreichbar. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an: +43 5574 46255." : errorTextOf(result.code) });
  };

  if (demoDone) {
    return (
      <FormSuccess ref={doneRef} title="Vorschau: hier ginge es zur Bezahlseite">
        <p>In der Vorschau wird nichts gesendet. Auf der Seite folgt jetzt die Weiterleitung zu Stripe, danach die Bestätigungsseite.</p>
        <button type="button" onClick={() => setDemoDone(false)} className="mt-6 flex min-h-11 items-center text-ui underline underline-offset-4">
          Zurück zum Formular
        </button>
      </FormSuccess>
    );
  }

  const presets = [...AMOUNT_PRESETS.map((v) => ({ value: String(v), label: formatEuro(v) })), { value: "eigener", label: "Eigener Betrag" }];
  const linkClass = "text-text underline underline-offset-4 hover:decoration-2";

  return (
    <form method="post" onSubmit={handleSubmit} noValidate aria-describedby={id("pflicht")} className="relative space-y-10">
      <FormAlert status={status} />
      <p id={id("pflicht")} className="text-small text-text-soft">
        Felder mit * brauchen wir für die Bestellung.
      </p>

      <fieldset id={id("betrag")} tabIndex={-1} aria-describedby={errors.betrag ? id("betrag-error") : id("betrag-hint")} className="min-w-0 focus:outline-none">
        <legend className="text-title text-text">Wert je Gutschein</legend>
        <p id={id("betrag-hint")} className="mt-2 text-small text-text-soft">
          Ab {AMOUNT_MIN} €, in ganzen Euro.
        </p>
        <div className="mt-stack-s grid grid-cols-2 gap-3 sm:grid-cols-3">
          {presets.map((option, index) => (
            <label
              key={option.value}
              htmlFor={id(`betrag-${index}`)}
              className={cx(
                "flex min-h-13 cursor-pointer items-center gap-3 bg-surface px-4 py-3 text-ui text-text tabular-nums transition-colors duration-(--duration-micro) ease-quiet has-checked:bg-surface-raised",
                errors.betrag && form.preset !== "eigener" ? "border-2 border-error" : "border border-line-control hover:border-ink has-checked:border-2 has-checked:border-ink has-checked:px-[15px]"
              )}
            >
              <input id={id(`betrag-${index}`)} type="radio" name="preset" value={option.value} checked={form.preset === option.value} onChange={() => set("preset", option.value)} className="size-5 flex-none accent-ink" />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {form.preset === "eigener" && (
          <div className="mt-4 max-w-xs">
            <label htmlFor={id("eigener")} className="block text-ui text-text">
              Eigener Betrag in Euro <span aria-hidden="true">*</span>
            </label>
            <input
              id={id("eigener")}
              name="eigenerBetrag"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              required
              aria-invalid={errors.betrag ? true : undefined}
              aria-describedby={errors.betrag ? id("betrag-error") : id("betrag-hint")}
              value={form.eigenerBetrag}
              onChange={onChange}
              className={cx("mt-2 block h-13 w-full bg-surface px-4 text-ui font-normal text-text tabular-nums", fieldBorder(errors.betrag))}
            />
          </div>
        )}
        <FieldError id={id("betrag-error")}>{errors.betrag}</FieldError>
      </fieldset>

      <FormField
        id={id("anzahl")}
        name="anzahl"
        label="Stückzahl"
        required
        type="number"
        inputMode="numeric"
        min={1}
        max={ONLINE_QUANTITY_MAX}
        value={form.anzahl}
        onChange={onChange}
        error={errors.anzahl}
        hint={`Online bis ${ONLINE_QUANTITY_MAX} Stück. Für Firmengeschenke in größerer Zahl gibt es die Anfrage weiter unten.`}
        className="max-w-xs"
        controlClassName="tabular-nums"
      />

      <RadioCards
        id={id("motiv")}
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
        <legend className="text-title text-text">Widmung</legend>
        <FormField id={id("empfaenger")} name="empfaenger" label="Name auf dem Gutschein" optionalText="optional" value={form.empfaenger} onChange={onChange} maxLength={120} autoComplete="off" />
        <FormField
          id={id("grusstext")}
          as="textarea"
          name="grusstext"
          label="Grußtext"
          optionalText="optional"
          value={form.grusstext}
          onChange={onChange}
          error={errors.grusstext}
          rows={3}
          hint={`${form.grusstext.length} von ${GREETING_MAX} Zeichen. Steht auf dem PDF.`}
        />
      </fieldset>

      <fieldset className="min-w-0 space-y-6">
        <legend className="text-title text-text">Zustellung und Rechnung</legend>
        <p className="max-w-measure text-body text-text-soft">
          Der Gutschein kommt nach bestätigter Zahlung als PDF an Ihre E-Mail-Adresse. Sie drucken ihn aus oder leiten ihn weiter.
        </p>
        <FormField id={id("name")} name="name" label="Ihr Name" required value={form.name} onChange={onChange} error={errors.name} autoComplete="name" maxLength={200} />
        <FormField id={id("email")} name="email" type="email" label="E-Mail für den Gutschein" required value={form.email} onChange={onChange} error={errors.email} autoComplete="email" inputMode="email" maxLength={254} />
        <FormField id={id("firma")} name="firma" label="Firma" optionalText="optional" hint="Für die Rechnung, die Rechnungsadresse fragt die Bezahlseite ab." value={form.firma} onChange={onChange} autoComplete="organization" maxLength={200} />
      </fieldset>

      <Honeypot id={id("website")} />

      <div className="space-y-6 border-t border-line-strong pt-8">
        <div aria-live="polite">
          <p className="text-overline uppercase text-text-accent">Ihre Bestellung</p>
          {valid ? (
            <dl className="mt-3 max-w-md divide-y divide-line border-y border-line text-ui tabular-nums">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-text-soft">
                  {anzahl} × Gutschein zu {formatEuro(betrag)}
                </dt>
                <dd>{formatEuro(betrag * anzahl)}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-text-soft">Zustellung als PDF per E-Mail</dt>
                <dd>0 €</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt>{priceLabel.total}</dt>
                <dd>{formatEuro(betrag * anzahl)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-small text-text-soft">Bitte wählen Sie Wert und Stückzahl.</p>
          )}
          {valid && priceLabel.note ? <p className="mt-2 text-small text-text-soft">{priceLabel.note}</p> : null}
        </div>

        <div id={id("bedingungen")} tabIndex={-1} className="focus:outline-none">
          <label htmlFor={id("bedingungen-box")} className="flex cursor-pointer items-start gap-3 text-body text-text">
            <input
              id={id("bedingungen-box")}
              type="checkbox"
              name="bedingungen"
              checked={form.bedingungen === true}
              onChange={(e) => set("bedingungen", e.target.checked)}
              aria-invalid={errors.bedingungen ? true : undefined}
              aria-describedby={errors.bedingungen ? id("bedingungen-error") : undefined}
              required
              className="mt-1 size-5 flex-none accent-ink"
            />
            <span>
              Ich akzeptiere die{" "}
              <SmartLink href={termsHref} className={linkClass} target={termsHref.startsWith("#") ? undefined : "_blank"}>
                Gutscheinbedingungen
              </SmartLink>{" "}
              und habe die{" "}
              <SmartLink href={withdrawalHref} className={linkClass}>
                Widerrufsbelehrung
              </SmartLink>{" "}
              gelesen. <span aria-hidden="true">*</span>
            </span>
          </label>
          <FieldError id={id("bedingungen-error")}>{errors.bedingungen}</FieldError>
        </div>

        <ul className="max-w-measure space-y-2 text-small text-text-soft">
          <li>Widerruf innerhalb von 14 Tagen ab Erhalt, solange der Gutschein nicht eingelöst ist.</li>
          <li>Die Rechnung senden wir gesondert per E-Mail. Von Stripe erhalten Sie zusätzlich eine Zahlungsbestätigung.</li>
          <li>Bezahlt wird auf der Bezahlseite von Stripe. Kartendaten erreichen uns nicht.</li>
        </ul>

        <button
          type="submit"
          disabled={!hydrated || loading}
          className="inline-flex min-h-12 w-full items-center justify-center bg-action px-8 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:min-h-13"
        >
          {loading ? "Weiter zur Bezahlseite …" : BUY_BUTTON_LABEL}
        </button>
        {mock && <p className="text-small text-text-soft">Entwicklungs-Mock: Es folgt eine simulierte Bezahlseite, es fließt kein Geld.</p>}
        <FormPrivacyNote />
      </div>
    </form>
  );
}
