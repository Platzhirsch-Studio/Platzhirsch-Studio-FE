"use client";
// Reservierungsanfrage für ein Atelier-Stück (Paket R5-commerce, AP9 Nr. 2).
// Schickt eine ANFRAGE an /api/atelier_reservierung (ATELIER_MODE=anfrage).
// Kein Kauf, keine Zahlung, keine Anzahlung, kein Online-Vertrag; das Stück
// ist damit noch nicht reserviert. Titel und Preis setzt der Server aus dem
// Sheet. In der Vorschau (`demo`) wird nichts gesendet.
// Barrierefreiheit wie VoucherForm (Labels, Fehler am Feld, Live-Region,
// Fokusführung). Texte nur auf Deutsch.
import { useEffect, useId, useRef, useState } from "react";
import { trackLead } from "@/lib/analytics";
import { errorTextOf, sendCommerce } from "@/lib/commerce/client";
import { RESERVATION_NOTE_MAX, RESERVATION_WAYS } from "@/lib/commerce/reservationConfig";
import FormField, { RadioCards } from "@/components/Forms/FormField";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import useFormGuard, { focusField, useHydrated } from "@/components/Forms/useFormGuard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;
const EMPTY = { name: "", email: "", telefon: "", weg: "", plz_ort: "", besichtigung: false, nachricht: "" };
const ORDER = ["weg", "name", "email", "telefon", "nachricht"];

export function validateReservation(form) {
  const errors = {};
  if (!form.weg) errors.weg = "Bitte wählen Sie Abholung oder Lieferung.";
  if (form.name.trim().length < 2) errors.name = "Bitte geben Sie Ihren Namen an.";
  if (!form.email.trim()) errors.email = "Bitte geben Sie Ihre E-Mail-Adresse an.";
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = "Bitte prüfen Sie die E-Mail-Adresse, zum Beispiel name@beispiel.at.";
  if (form.telefon.trim() && !PHONE_RE.test(form.telefon.trim())) errors.telefon = "Bitte prüfen Sie die Telefonnummer (6 bis 20 Ziffern).";
  if (form.nachricht.length > RESERVATION_NOTE_MAX) errors.nachricht = `Höchstens ${RESERVATION_NOTE_MAX} Zeichen.`;
  return errors;
}

/**
 * @param {string} slug     Stück (Sheet-slug); in der Vorschau beliebig
 * @param {string} title    Titel zur Anzeige
 * @param {boolean} [demo]
 */
export default function ReservationForm({ slug, title, demo = false }) {
  const base = `ar${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const id = (k) => `${base}-${k}`;
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
      const found = validateReservation(next);
      setErrors((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, found[k]]).filter(([, v]) => v)));
    }
  };
  const onChange = (e) => set(e.target.name, e.target.type === "checkbox" ? e.target.checked : e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    const found = validateReservation(form);
    setErrors(found);
    const keys = ORDER.filter((k) => found[k]);
    if (keys.length) {
      setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: keys.map((k) => ({ id: id(k), text: found[k] })) });
      focusField(keys[0] === "weg" ? id("weg-0") : id(keys[0]));
      return;
    }
    const payload = guard(
      {
        stueck: slug,
        name: form.name.trim(),
        email: form.email.trim(),
        telefon: form.telefon.trim(),
        weg: form.weg,
        plz_ort: form.weg === "lieferung" ? form.plz_ort.trim() : "",
        besichtigung: Boolean(form.besichtigung),
        nachricht: form.nachricht.trim(),
      },
      e.currentTarget
    );
    setLoading(true);
    setStatus(null);
    const result = await sendCommerce("/api/atelier_reservierung", payload, { field: "nachricht", demo });
    setLoading(false);
    if (!result.ok) {
      if (result.code === "invalid" && result.field === "stueck") {
        setStatus({ type: "error", text: result.message || "Dieses Stück ist nicht mehr verfügbar." });
      } else if (result.code === "invalid" && result.field && ORDER.includes(result.field)) {
        const text = result.message || "Bitte prüfen Sie diese Angabe.";
        setErrors({ [result.field]: text });
        setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: [{ id: id(result.field), text }] });
        focusField(id(result.field));
      } else {
        setStatus({ type: "error", text: errorTextOf(result.code) });
      }
      return;
    }
    if (!result.demo) trackLead("atelier_reservierung", { transaction_id: result.leadRef });
    setSent({ name: form.name.trim(), demo: Boolean(result.demo) });
    setForm(EMPTY);
    setErrors({});
  };

  if (sent) {
    return (
      <FormSuccess ref={successRef} title={sent.demo ? "Vorschau: so sieht die Bestätigung aus" : "Anfrage angekommen"}>
        {sent.demo && <p className="mb-4 text-small text-text-soft">In der Vorschau wird nichts gesendet.</p>}
        <p>
          Danke, {sent.name}. Wir haben Ihre Anfrage zu „{title}“ erhalten und melden uns persönlich bei Ihnen, um Besichtigung,
          Zustandsbeschreibung und die nächsten Schritte zu besprechen.
        </p>
        <p className="mt-4">Das Stück ist damit noch nicht reserviert, und es ist nichts zu bezahlen.</p>
      </FormSuccess>
    );
  }

  return (
    <form method="post" onSubmit={handleSubmit} noValidate aria-describedby={id("pflicht")} className="relative space-y-8">
      <FormAlert status={status} />
      <p id={id("pflicht")} className="text-small text-text-soft">
        Felder mit * brauchen wir für die Anfrage.
      </p>

      <RadioCards
        id={id("weg")}
        name="weg"
        legend="Wie möchten Sie das Stück erhalten?"
        legendSize="label"
        options={RESERVATION_WAYS.map((w) => ({ value: w.id, label: w.label }))}
        value={form.weg}
        onChange={(v) => set("weg", v)}
        error={errors.weg}
      />
      {form.weg === "lieferung" && (
        <FormField id={id("plz_ort")} name="plz_ort" label="PLZ und Ort der Lieferung" optionalText="optional" value={form.plz_ort} onChange={onChange} autoComplete="postal-code" maxLength={120} />
      )}

      <div className="flex items-start gap-3">
        <input
          id={id("besichtigung")}
          name="besichtigung"
          type="checkbox"
          checked={form.besichtigung}
          onChange={onChange}
          className="mt-0.5 size-6 flex-none accent-ink"
        />
        <label htmlFor={id("besichtigung")} className="text-ui font-normal text-text">
          Ich möchte das Stück vorher im Showroom ansehen.
        </label>
      </div>

      <FormField id={id("name")} name="name" label="Ihr Name" required value={form.name} onChange={onChange} error={errors.name} autoComplete="name" maxLength={200} />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id={id("email")} name="email" type="email" label="E-Mail" required value={form.email} onChange={onChange} error={errors.email} autoComplete="email" inputMode="email" maxLength={254} />
        <FormField id={id("telefon")} name="telefon" type="tel" label="Telefon" optionalText="optional" value={form.telefon} onChange={onChange} error={errors.telefon} autoComplete="tel" maxLength={40} />
      </div>
      <FormField id={id("nachricht")} as="textarea" name="nachricht" label="Nachricht" optionalText="optional" value={form.nachricht} onChange={onChange} error={errors.nachricht} rows={3} />

      <Honeypot id={id("website")} />

      <div className="space-y-4">
        <button
          type="submit"
          disabled={!hydrated || loading}
          aria-describedby={id("unverbindlich")}
          className="inline-flex min-h-12 w-full items-center justify-center bg-action px-8 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:min-h-13"
        >
          {loading ? "Wird gesendet …" : "Reservierung anfragen"}
        </button>
        <p id={id("unverbindlich")} className="max-w-measure text-small text-text-soft">
          Unverbindlich: Mit der Anfrage ist das Stück noch nicht reserviert und nichts zu bezahlen. Ein Kauf kommt erst im persönlichen
          Gespräch zustande, mit Zustandsbeschreibung, der Sie gesondert zustimmen.
        </p>
        <FormPrivacyNote />
      </div>
    </form>
  );
}
