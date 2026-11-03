"use client";
// Online-Rücktrittsfunktion des Shops (§ 13a FAGG): Felder des Muster-
// Widerrufsformulars (Anhang I Teil B FAGG) → Schaltfläche „Widerruf
// bestätigen“ → POST /api/shop/widerruf → Bestätigungsseite mit
// Eingangsnummer und Zeitpunkt (die Eingangsbestätigung per E-Mail baut der
// Server; im Testmodus wird keine Mail erzeugt). Nur Deutsch (verbindlicher
// Text), wie die Rechtstexte unter /shop/recht.
import { useId, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { readFormResponse } from "@/lib/forms/client";
import { errorTextOf } from "@/lib/commerce/client";
import FormField from "@/components/Forms/FormField";
import { FormAlert } from "@/components/Forms/FormAlert";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import useFormGuard, { focusField, useHydrated } from "@/components/Forms/useFormGuard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY = { bestellung: "", bestelltAm: "", erhaltenAm: "", name: "", anschrift: "", email: "", artikel: "" };
const ORDER = ["bestellung", "bestelltAm", "erhaltenAm", "name", "anschrift", "email", "artikel"];
const DATUM_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Clientseitige Prüfung – dieselben Grenzen wie shopWiderrufSchema (src/lib/shop/widerruf.js). */
export function validateWiderruf(f) {
  const e = {};
  // Bestellnummer optional (Inhaber 03.11.2026): auch für Verträge außerhalb des Onlineshops nutzbar.
  if (f.bestellung.trim() && f.bestellung.trim().length < 6) e.bestellung = "Bitte prüfen Sie die Bestellnummer oder lassen Sie das Feld leer.";
  if (f.bestelltAm && !DATUM_RE.test(f.bestelltAm)) e.bestelltAm = "Bitte geben Sie das Datum als Jahr-Monat-Tag an.";
  if (f.erhaltenAm && !DATUM_RE.test(f.erhaltenAm)) e.erhaltenAm = "Bitte geben Sie das Datum als Jahr-Monat-Tag an.";
  if (f.name.trim().length < 2) e.name = "Bitte geben Sie Ihren Namen an.";
  if (f.anschrift.trim().length < 5) e.anschrift = "Bitte geben Sie Ihre Anschrift an.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Bitte prüfen Sie die E-Mail-Adresse.";
  if (f.artikel.trim().length < 2) e.artikel = "Bitte nennen Sie die Artikel, die Sie widerrufen.";
  if (f.artikel.length > 1500) e.artikel = "Höchstens 1500 Zeichen.";
  return e;
}

export default function WiderrufForm({ initialRef = "", bestaetigungPath }) {
  const base = `sw${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY, bestellung: initialRef });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const id = (k) => `${base}-${k}`;
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    const found = validateWiderruf(form);
    setErrors(found);
    const keys = ORDER.filter((k) => found[k]);
    if (keys.length) {
      setStatus({ type: "summary", title: "Bitte prüfen Sie Ihre Angaben", items: keys.map((k) => ({ id: id(k), text: found[k] })) });
      focusField(id(keys[0]));
      return;
    }
    const payload = guard(
      { bestellung: form.bestellung.trim(), bestelltAm: form.bestelltAm, erhaltenAm: form.erhaltenAm, name: form.name.trim(), anschrift: form.anschrift.trim(), email: form.email.trim(), artikel: form.artikel.trim(), bestaetigt: true },
      e.currentTarget
    );
    setLoading(true);
    setStatus(null);
    let r;
    try {
      const res = await fetch("/api/shop/widerruf", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      r = res.status === 404 ? { ok: false, code: "not_found" } : await readFormResponse(res);
    } catch {
      r = { ok: false, code: "network" };
    }
    if (r.ok) {
      // Bestätigungsseite trägt nur Eingangsnummer und Zeitpunkt, keine Personendaten.
      router.push(`${bestaetigungPath}?id=${encodeURIComponent(r.data.id)}&zeit=${encodeURIComponent(r.data.zeit)}`);
      return;
    }
    setLoading(false);
    setStatus({ type: "error", text: r.code === "not_found" ? "Die Online-Funktion ist gerade nicht erreichbar. Bitte schreiben Sie an info@platzhirsch.studio – das wahrt die Frist ebenso." : errorTextOf(r.code) });
  };

  return (
    <form method="post" onSubmit={onSubmit} noValidate className="space-y-8" data-shop-widerruf-form="">
      <FormAlert status={status} />
      <FormField id={id("bestellung")} name="bestellung" label="Bestellnummer" optionalText="optional" hint="Bei Bestellungen im Onlineshop zum Beispiel PH-S-261102-A1B2C3 (Bestellseite, Auftragsbestätigung). Bei einem Vertrag per E-Mail, Telefon, Video oder zu Hause lassen Sie das Feld leer und nennen unten Angebot oder Auftrag." value={form.bestellung} onChange={onChange} error={errors.bestellung} autoComplete="off" maxLength={40} />
      <div className="grid gap-8 sm:grid-cols-2">
        <FormField id={id("bestelltAm")} name="bestelltAm" type="date" label="Bestellt am" optionalText="optional" value={form.bestelltAm} onChange={onChange} error={errors.bestelltAm} autoComplete="off" />
        <FormField id={id("erhaltenAm")} name="erhaltenAm" type="date" label="Erhalten am" optionalText="optional" value={form.erhaltenAm} onChange={onChange} error={errors.erhaltenAm} autoComplete="off" />
      </div>
      <FormField id={id("name")} name="name" label="Name" required value={form.name} onChange={onChange} error={errors.name} autoComplete="name" maxLength={200} />
      <FormField id={id("anschrift")} as="textarea" name="anschrift" label="Anschrift" required value={form.anschrift} onChange={onChange} error={errors.anschrift} autoComplete="street-address" rows={3} maxLength={400} />
      <FormField id={id("email")} name="email" type="email" label="E-Mail-Adresse der Bestellung" required hint="An diese Adresse senden wir die Eingangsbestätigung." value={form.email} onChange={onChange} error={errors.email} autoComplete="email" inputMode="email" maxLength={254} />
      <FormField id={id("artikel")} as="textarea" name="artikel" label="Waren oder Leistungen, die Sie widerrufen" required hint="Alle Artikel der Bestellung oder nur einzelne – bitte mit Menge; bei Verträgen außerhalb des Onlineshops Angebots- oder Auftragsnummer und Datum, soweit bekannt." value={form.artikel} onChange={onChange} error={errors.artikel} rows={4} maxLength={1500} />
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
