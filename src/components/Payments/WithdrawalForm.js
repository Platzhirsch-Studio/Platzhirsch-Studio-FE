"use client";
// Widerrufsfunktion (§ 13a FAGG): Angaben → Schaltfläche „Widerruf
// bestätigen“ → sofortige Eingangsbestätigung auf der Seite und per E-Mail.
import { useEffect, useId, useRef, useState } from "react";
import { readFormResponse } from "@/lib/forms/client";
import { errorTextOf } from "@/lib/commerce/client";
import FormField from "@/components/Forms/FormField";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import useFormGuard, { focusField, useHydrated } from "@/components/Forms/useFormGuard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { name: "", email: "", bestellung: "", nachricht: "" };
const ORDER = ["name", "email", "bestellung", "nachricht"];

export function validateWithdrawal(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = "Bitte geben Sie Ihren Namen an.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Bitte prüfen Sie die E-Mail-Adresse.";
  if (f.bestellung.trim().length < 6) e.bestellung = "Bitte geben Sie die Bestellnummer oder den Gutscheincode an.";
  if (f.nachricht.length > 1000) e.nachricht = "Höchstens 1000 Zeichen.";
  return e;
}

export default function WithdrawalForm({ initialRef = "", mock = false }) {
  const base = `wd${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [form, setForm] = useState({ ...EMPTY, bestellung: initialRef });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const doneRef = useRef(null);
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const id = (k) => `${base}-${k}`;
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    const found = validateWithdrawal(form);
    setErrors(found);
    const keys = ORDER.filter((k) => found[k]);
    if (keys.length) {
      setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: keys.map((k) => ({ id: id(k), text: found[k] })) });
      focusField(id(keys[0]));
      return;
    }
    const payload = guard({ name: form.name.trim(), email: form.email.trim(), bestellung: form.bestellung.trim(), nachricht: form.nachricht.trim(), bestaetigt: true }, e.currentTarget);
    setLoading(true);
    setStatus(null);
    let r;
    try {
      const res = await fetch("/api/payments/widerruf", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", ...(mock ? { "x-payments-mock": "1" } : {}) }, body: JSON.stringify(payload) });
      r = res.status === 404 ? { ok: false, code: "not_found" } : await readFormResponse(res);
    } catch {
      r = { ok: false, code: "network" };
    }
    setLoading(false);
    if (r.ok) {
      setDone({ id: r.data.id, zeit: r.data.zeit });
      return;
    }
    setStatus({ type: "error", text: r.code === "not_found" ? "Die Widerrufsfunktion ist gerade nicht erreichbar. Bitte schreiben Sie an info@platzhirsch.studio, das wahrt die Frist ebenso." : errorTextOf(r.code) });
  };

  if (done) {
    const when = new Intl.DateTimeFormat("de-AT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Vienna" }).format(new Date(done.zeit));
    return (
      <FormSuccess ref={doneRef} title="Ihr Widerruf ist eingegangen">
        <p>
          Eingang am {when}, Eingangsnummer {done.id}. Die Bestätigung mit Ihren Angaben kommt per E-Mail. Wir zahlen den Betrag spätestens binnen 14 Tagen über das ursprüngliche
          Zahlungsmittel zurück.
        </p>
      </FormSuccess>
    );
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-8">
      <FormAlert status={status} />
      <FormField id={id("name")} name="name" label="Ihr Name" required value={form.name} onChange={onChange} error={errors.name} autoComplete="name" maxLength={200} />
      <FormField id={id("email")} name="email" type="email" label="E-Mail-Adresse der Bestellung" required value={form.email} onChange={onChange} error={errors.email} autoComplete="email" inputMode="email" maxLength={254} />
      <FormField
        id={id("bestellung")}
        name="bestellung"
        label="Bestellnummer oder Gutscheincode"
        required
        hint="Zum Beispiel G-7KQ2-M9XA, steht in der Bestätigungs-E-Mail."
        value={form.bestellung}
        onChange={onChange}
        error={errors.bestellung}
        autoComplete="off"
        maxLength={40}
      />
      <FormField id={id("nachricht")} as="textarea" name="nachricht" label="Nachricht" optionalText="optional" value={form.nachricht} onChange={onChange} error={errors.nachricht} rows={3} />
      <Honeypot id={id("website")} />
      <div className="space-y-4">
        <button
          type="submit"
          disabled={!hydrated || loading}
          className="inline-flex min-h-12 w-full items-center justify-center bg-action px-8 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:min-h-13"
        >
          {loading ? "Wird gesendet …" : "Widerruf bestätigen"}
        </button>
        <FormPrivacyNote />
      </div>
    </form>
  );
}
