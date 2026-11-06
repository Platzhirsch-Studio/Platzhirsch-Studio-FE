"use client";
// Anmeldeformular für den Adventsabend. Sendet das Payload-Format des
// Kontaktformulars (src/components/Kontakt/kontakt.js) an /api/kontakt:
// { name, company, email_address, telefon, ihre_nachricht }
// plus die optionalen Felder des Formular-Vertrags (Paket R1-formulare):
//   website – Honeypot (components/Forms/Honeypot), bleibt bei Menschen leer
//   _t      – Dauer seit dem Anzeigen des Formulars in ms (performance.now(),
//             unabhängig von der Uhr des Geräts; Paket R2-leads)
// Die Route behandelt beide als optional und entfernt sie vor der Weiterleitung.
// Personenzahl und Event-Kennung stehen im Nachrichtenfeld, weil Route und
// Backoffice keine eigenen Felder dafür haben.
//
// Barrierefreiheit (WCAG 2.2 AA, Design-Bibel §9/§14): sichtbare Labels über
// dem Feld, Prüfung beim Verlassen des Feldes, Fehler am Feld (aria-invalid,
// aria-describedby) plus Zusammenfassung in einer höflichen Live-Region; bei
// Fehlern springt der Fokus auf das erste fehlerhafte Feld, nach Erfolg auf
// die Bestätigung. Fehler der Route zeigen den übersetzten `code`
// (src/lib/forms/i18n.js), nie den englischen `error`.
// Felder 52 px, Knopf 48/52 px, Schrift 16 px.
import { useEffect, useRef, useState } from "react";
import { trackLead } from "@/lib/analytics";
import { postForm } from "@/lib/forms/client";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { FormAlert } from "@/components/Forms/FormAlert";
import useFormGuard, { focusField, useHydrated, useServerFieldError } from "@/components/Forms/useFormGuard";
import useFormText from "@/components/Forms/useFormText";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;
const MAX_PERSONEN = 10;

const EMPTY = { name: "", email: "", telefon: "", personen: "1", nachricht: "" };
const FIELD_ORDER = ["name", "email", "telefon", "personen"];
const FIELD_IDS = { name: "aa-name", email: "aa-email", telefon: "aa-telefon", personen: "aa-personen" };

function validateField(name, form) {
  const value = String(form[name] ?? "").trim();
  switch (name) {
    case "name":
      return value.length < 2 ? "Bitte geben Sie Ihren Namen an (mindestens 2 Zeichen)." : null;
    case "email":
      if (!value) return "Bitte geben Sie Ihre E-Mail-Adresse an.";
      return EMAIL_RE.test(value) ? null : "Bitte prüfen Sie die E-Mail-Adresse, zum Beispiel name@beispiel.at.";
    case "telefon":
      return value && !PHONE_RE.test(value) ? "Bitte prüfen Sie die Telefonnummer (6 bis 20 Ziffern)." : null;
    case "personen": {
      const n = Number(form.personen);
      return Number.isInteger(n) && n >= 1 && n <= MAX_PERSONEN
        ? null
        : `Bitte wählen Sie zwischen 1 und ${MAX_PERSONEN} Personen.`;
    }
    default:
      return null;
  }
}

function validateAll(form) {
  const errors = {};
  for (const name of FIELD_ORDER) {
    const message = validateField(name, form);
    if (message) errors[name] = message;
  }
  return errors;
}

const labelClass = "block text-ui text-text";
const fieldBase =
  "mt-2 block w-full border bg-surface px-4 text-ui text-text transition-colors duration-(--duration-micro) ease-quiet placeholder:text-text-soft";
const fieldClass = (invalid) => `${fieldBase} h-13 ${invalid ? "border-error border-2" : "border-line-control"}`;
const hintClass = "font-normal text-text-soft";

function StatusIcon({ type }) {
  return type === "success" ? (
    // Motion: the tick draws once like every confirmation (globals.css .ph-tick).
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="ph-tick mt-0.5 flex-none">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M7.75 12.25l2.75 2.75 5.75-6" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="mt-0.5 flex-none">
      <circle cx="12" cy="12" r="9.25" />
      <path d="M12 7.5v5.5M12 16.25v.25" />
    </svg>
  );
}

// submitUrl: "/api/kontakt" (Standard, heutiges Payload) oder im ph-Modus
// "/api/adventsabend/anmelden" (src/lib/backend/adventsabend.js → ph_marketing
// register_event; eigene Felder personen/nachricht, Bestätigung mit Absage-Link).
const PH_URL = "/api/adventsabend/anmelden";
const PH_ERRORS = {
  ausgebucht: "Der Adventsabend ist leider ausgebucht. Rufen Sie uns gern an – vielleicht wird noch ein Platz frei.",
  geschlossen: "Eine Anmeldung ist derzeit leider nicht möglich. Rufen Sie uns gern an.",
};

export default function AdventsabendForm({ dateLabel, calendarHref = null, submitUrl = "/api/kontakt" }) {
  const ph = submitUrl === PH_URL;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  // { type: "summary" | "error" | "success", text?, fields? }
  const [status, setStatus] = useState(null);
  const statusRef = useRef(null);
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const serverError = useServerFieldError();
  const { errorText } = useFormText();

  // Nach erfolgreichem Absenden: Fokus auf die Bestätigung (das Formular ist weg).
  useEffect(() => {
    if (status?.type === "success") statusRef.current?.focus();
  }, [status]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    // Bereits angezeigte Fehler sofort aktualisieren, neue erst beim Verlassen.
    if (touched[name] && FIELD_IDS[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, next) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!FIELD_IDS[name]) return;
    // Vom Server abgelehnter Wert: Fehler bleibt, bis er geändert wird.
    if (serverError.holds(name, value)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, form) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    serverError.clear();

    const found = validateAll(form);
    setErrors(found);
    setTouched({ name: true, email: true, telefon: true, personen: true });
    if (Object.keys(found).length) {
      const items = FIELD_ORDER.filter((f) => found[f]).map((f) => ({ id: FIELD_IDS[f], text: found[f] }));
      setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items });
      focusField(items[0]?.id);
      return;
    }

    const personen = Number(form.personen);
    const nachricht = form.nachricht.trim();
    const payload = ph
      ? { name: form.name.trim(), email_address: form.email.trim(), telefon: form.telefon.trim(), personen, nachricht }
      : {
        name: form.name.trim(),
        company: "",
        email_address: form.email.trim(),
        telefon: form.telefon.trim(),
        ihre_nachricht:
          `[Anmeldung Adventsabend ${dateLabel}] ${personen} ${personen === 1 ? "Person" : "Personen"}` +
          (nachricht ? `\n\nNachricht: ${nachricht}` : ""),
      };
    const body = guard(payload, e.currentTarget);

    setLoading(true);
    setStatus(null);
    try {
      const result = await postForm(ph ? PH_URL : "/api/kontakt", body);
      if (!result.ok) {
        // ph: ausgebucht / Anmeldung geschlossen mit eigenem Text.
        const phText = ph ? PH_ERRORS[result.data?.code] : undefined;
        if (phText) {
          setStatus({ type: "error", text: phText });
          return;
        }
        // 400 mit `field`: am Feld zeigen (Kontakt-Schema → Formularfeld).
        const key = result.code === "invalid" ? { name: "name", email_address: "email", telefon: "telefon", personen: "personen" }[result.field] : undefined;
        if (key) {
          serverError.set(key, form[key]);
          const message = validateField(key, form) || "Bitte prüfen Sie diese Angabe.";
          setErrors((prev) => ({ ...prev, [key]: message }));
          setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: [{ id: FIELD_IDS[key], text: message }] });
          focusField(FIELD_IDS[key]);
        } else {
          setStatus({ type: "error", text: errorText(result.code) });
        }
        return;
      }

      trackLead("adventsabend", { transaction_id: result.leadRef });
      setStatus({
        type: "success",
        text:
          ph && result.data?.warteliste
            ? `Danke, ${payload.name}. Der Abend ist im Moment voll – wir haben Sie mit ${personen} ${personen === 1 ? "Person" : "Personen"} auf die Warteliste gesetzt und melden uns, sobald ein Platz frei wird.`
            : `Danke, ${payload.name}. Ihre Anmeldung für ${personen} ${personen === 1 ? "Person" : "Personen"} ist bei uns angekommen. Wir freuen uns auf Ihren Besuch.` +
              (ph ? " Sie erhalten eine Bestätigung per E-Mail, darin finden Sie auch einen Link, falls Sie absagen möchten." : ""),
      });
      setForm(EMPTY);
      setTouched({});
      setErrors({});
    } catch (error) {
      console.error("Adventsabend form:", error);
      setStatus({ type: "error", text: errorText("upstream") });
    } finally {
      setLoading(false);
    }
  };

  const describedBy = (name, hintId) =>
    [hintId, errors[name] ? `${FIELD_IDS[name]}-fehler` : null].filter(Boolean).join(" ") || undefined;

  const fieldError = (name) =>
    errors[name] ? (
      <p id={`${FIELD_IDS[name]}-fehler`} className="mt-2 flex items-start gap-2 text-small text-error">
        <StatusIcon type="error" />
        <span>{errors[name]}</span>
      </p>
    ) : null;

  if (status?.type === "success") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="ph-arrive border-t-2 border-success bg-surface p-6 sm:p-8 focus-visible:outline-none"
      >
        <p className="flex items-start gap-3 text-ui text-success">
          <StatusIcon type="success" />
          <span>Anmeldung angekommen</span>
        </p>
        <p className="mt-4 text-body text-text">{status.text}</p>
        {calendarHref && (
          <a
            href={calendarHref}
            download
            className="mt-6 inline-flex h-12 items-center justify-center border border-text px-6 text-ui text-text hover:bg-action hover:text-text-inverse"
          >
            In den Kalender eintragen
            <span className="sr-only"> (Datei im Format .ics)</span>
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            requestAnimationFrame(() => document.getElementById("aa-name")?.focus());
          }}
          className="mt-6 flex min-h-11 items-center text-ui underline underline-offset-4"
        >
          Weitere Anmeldung
        </button>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={handleSubmit} noValidate aria-describedby="aa-pflicht" className="relative space-y-6">
      <FormAlert status={status} />

      <p id="aa-pflicht" className="text-small text-text-soft">
        Felder mit * brauchen wir für die Anmeldung.
      </p>

      <div>
        <label htmlFor="aa-name" className={labelClass}>
          Name *
        </label>
        <input
          id="aa-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className={fieldClass(errors.name)}
        />
        {fieldError("name")}
      </div>

      <div>
        <label htmlFor="aa-email" className={labelClass}>
          E-Mail *
        </label>
        <input
          id="aa-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={describedBy("email")}
          value={form.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={fieldClass(errors.email)}
        />
        {fieldError("email")}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="aa-telefon" className={labelClass}>
            Telefon <span className={hintClass}>(optional)</span>
          </label>
          <input
            id="aa-telefon"
            name="telefon"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={errors.telefon ? true : undefined}
            aria-describedby={describedBy("telefon")}
            value={form.telefon}
            onChange={handleChange}
            onBlur={handleBlur}
            className={fieldClass(errors.telefon)}
          />
          {fieldError("telefon")}
        </div>
        <div>
          <label htmlFor="aa-personen" className={labelClass}>
            Personen *
          </label>
          <select
            id="aa-personen"
            name="personen"
            required
            aria-invalid={errors.personen ? true : undefined}
            aria-describedby={describedBy("personen", "aa-personen-hinweis")}
            value={form.personen}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${fieldClass(errors.personen)} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%2330373e%22 stroke-width=%221.5%22/></svg>')] bg-[length:12px_8px] bg-[position:right_1rem_center] bg-no-repeat pr-10 tabular`}
          >
            {Array.from({ length: MAX_PERSONEN }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>
                {n} {n === 1 ? "Person" : "Personen"}
              </option>
            ))}
          </select>
          <p id="aa-personen-hinweis" className="mt-2 text-small text-text-soft">
            Mehr als {MAX_PERSONEN}? Bitte rufen Sie uns an.
          </p>
          {fieldError("personen")}
        </div>
      </div>

      <div>
        <label htmlFor="aa-nachricht" className={labelClass}>
          Nachricht <span className={hintClass}>(optional)</span>
        </label>
        <textarea
          id="aa-nachricht"
          name="nachricht"
          rows={4}
          aria-describedby="aa-nachricht-hinweis"
          value={form.nachricht}
          onChange={handleChange}
          className={`${fieldBase} min-h-32 border-line-control py-3`}
        />
        <p id="aa-nachricht-hinweis" className="mt-2 text-small text-text-soft">
          Zum Beispiel, wenn wir für Ihren Besuch etwas vorbereiten sollen.
        </p>
      </div>

      {/* Honeypot (Formular-Vertrag R1-formulare): für Menschen unsichtbar, nicht fokussierbar. */}
      <Honeypot id="aa-website" />

      <div>
        <button
          type="submit"
          disabled={!hydrated || undefined}
          aria-disabled={loading || undefined}
          className="inline-flex h-12 w-full items-center justify-center bg-action px-8 text-ui text-text-inverse transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover aria-disabled:cursor-wait aria-disabled:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 lg:h-13"
        >
          {loading ? "Wird gesendet …" : "Platz reservieren"}
        </button>
        <FormPrivacyNote className="mt-4" />
      </div>
    </form>
  );
}
