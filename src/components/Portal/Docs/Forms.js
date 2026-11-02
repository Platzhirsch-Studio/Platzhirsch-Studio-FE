"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { requestAppointmentChange, requestPassService, startPlanning } from "./actions";
import { APPOINTMENT_CHANGE_REASONS, BUDGETS, CONTACT_OPTIONS, PASS_REQUESTS, ROOMS, TIMEFRAMES, focusRing } from "./labels";

// Client forms for Termine, Produktpass and Neue Planung. They post to Server
// Actions (progressive enhancement: they also submit before hydration).

const input = `mt-1.5 block w-full min-h-12 border border-ink/20 bg-white px-3.5 text-base text-ink placeholder:text-ink/50 hover:border-ink/40 ${focusRing} aria-[invalid=true]:border-red-700`;
const labelCls = "block text-sm font-semibold text-ink";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-800">
      {error}
    </p>
  );
}

function Field({ label, name, error, hint, children }) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-[13px] text-ink/70">
          {hint}
        </p>
      )}
      {children({ id, name, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      <FieldError id={errId} error={error} />
    </div>
  );
}

function DateFields({ error, legend = "Wunschtermine (optional, bis zu 3)" }) {
  const min = todayIso();
  return (
    <fieldset>
      <legend className={labelCls}>{legend}</legend>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <input key={n} type="date" name="preferredDates" min={min} aria-label={`Wunschtermin ${n}`} className={input} aria-invalid={error ? true : undefined} />
        ))}
      </div>
      <FieldError error={error} />
    </fieldset>
  );
}

function ContactChoice({ defaultValue = "email" }) {
  return (
    <fieldset>
      <legend className={labelCls}>Wie dürfen wir uns melden?</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(CONTACT_OPTIONS).map(([value, label]) => (
          <label
            key={value}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink/20 bg-white px-4 text-sm text-ink has-[:checked]:border-gold has-[:checked]:bg-gold/15 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold"
          >
            <input type="radio" name="preferredContact" value={value} defaultChecked={value === defaultValue} className="size-4 accent-[#30373e]" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PrivacyHint({ children }) {
  return (
    <p className="text-[13px] leading-relaxed text-ink/70">
      {children} Ihre Angaben verwenden wir nur zur Bearbeitung dieser Anfrage im Rahmen Ihres Kundenverhältnisses (Art. 6 Abs. 1 lit. b DSGVO). Mehr in der{" "}
      <Link href="/de/portal/datenschutz" className={`py-1 underline underline-offset-2 hover:text-ink ${focusRing}`}>
        Datenschutzerklärung
      </Link>
      .
    </p>
  );
}

function Submit({ pending, children }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink-deep disabled:opacity-60 sm:w-auto ${focusRing}`}
    >
      {pending && <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {pending ? "Wird gesendet …" : children}
    </button>
  );
}

function Status({ state }) {
  if (!state?.message) return <div role="status" aria-live="polite" className="sr-only" />;
  if (state.ok) {
    return (
      <div role="status" aria-live="polite" className="flex gap-3 border border-ink/15 bg-bone px-4 py-3 text-sm text-ink">
        <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
        <span>
          {state.message}
          {state.ref && <span className="mt-1 block text-xs text-ink/70">Vorgangsnummer: {state.ref}</span>}
        </span>
      </div>
    );
  }
  return (
    <div role="alert" className="border border-red-700/30 bg-red-50 px-4 py-3 text-sm text-red-900">
      {state.message}
    </div>
  );
}

// ---------------------------------------------------------------- Termine

export function AppointmentChangeForm({ appointmentId }) {
  const [state, action, pending] = useActionState(requestAppointmentChange, null);
  const e = state?.errors || {};
  if (state?.ok) return <Status state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <Field label="Was dürfen wir ändern?" error={e.reason}>
        {(p) => (
          <select {...p} name="reason" defaultValue="verschieben" className={input}>
            {Object.entries(APPOINTMENT_CHANGE_REASONS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        )}
      </Field>
      <DateFields error={e.preferredDates} />
      <Field label="Nachricht (optional)" error={e.message} hint="z. B. bevorzugte Uhrzeit oder Zufahrt">
        {(p) => <textarea {...p} name="message" rows={3} maxLength={1000} className={`${input} py-3`} />}
      </Field>
      <PrivacyHint />
      <Status state={state} />
      <Submit pending={pending}>Änderung anfragen</Submit>
    </form>
  );
}

// ---------------------------------------------------------------- Produktpass

export function PassRequestForm({ passId, defaultKind = "service" }) {
  const [state, action, pending] = useActionState(requestPassService, null);
  const [kind, setKind] = useState(defaultKind);
  const e = state?.errors || {};
  if (state?.ok) return <Status state={state} />;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="passId" value={passId} />
      <fieldset>
        <legend className={labelCls}>Ihr Anliegen</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {Object.entries(PASS_REQUESTS).map(([value, r]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer gap-3 border border-ink/15 bg-white p-3.5 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold"
            >
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="mt-0.5 size-4 shrink-0 accent-[#30373e]" />
              <span>
                <span className="block font-semibold text-ink">{r.label.replace(" anfragen", "")}</span>
                <span className="block text-[13px] text-ink/70">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError error={e.kind} />
      </fieldset>
      <Field label="Beschreibung" error={e.message} hint="Was ist passiert bzw. was wünschen Sie sich? Fotos senden wir Ihnen nach Rückmeldung per Upload-Link.">
        {(p) => <textarea {...p} name="message" rows={4} maxLength={1500} required className={`${input} py-3`} />}
      </Field>
      <ContactChoice />
      <PrivacyHint />
      <Status state={state} />
      <Submit pending={pending}>Anfrage senden</Submit>
    </form>
  );
}

// ---------------------------------------------------------------- Neue Planung

export function PlanningForm({ projects = [], defaultProjectId = "" }) {
  const [state, action, pending] = useActionState(startPlanning, null);
  const [scope, setScope] = useState(defaultProjectId ? "erweiterung" : "neu");
  const [room, setRoom] = useState(ROOMS[0]);
  const e = state?.errors || {};
  if (state?.ok) {
    return (
      <div className="space-y-4">
        <Status state={state} />
        <Link href="/de/portal" className={`inline-flex min-h-11 items-center text-sm text-ink underline underline-offset-4 ${focusRing}`}>
          Zur Übersicht
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-6" noValidate>
      <fieldset>
        <legend className={labelCls}>Worum geht es?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            ["neu", "Neue Planung", "Ein neuer Raum oder ein neues Vorhaben."],
            ["erweiterung", "Bestehendes Projekt erweitern", "Ergänzung zu einem laufenden Projekt."],
          ].map(([value, label, hint]) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer gap-3 border border-ink/15 bg-white p-3.5 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold has-[:disabled]:opacity-50"
            >
              <input
                type="radio"
                name="scope"
                value={value}
                checked={scope === value}
                disabled={value === "erweiterung" && projects.length === 0}
                onChange={() => setScope(value)}
                className="mt-0.5 size-4 shrink-0 accent-[#30373e]"
              />
              <span>
                <span className="block font-semibold text-ink">{label}</span>
                <span className="block text-[13px] text-ink/70">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {scope === "erweiterung" && (
        <Field label="Welches Projekt?" error={e.projectId}>
          {(p) => (
            <select {...p} name="projectId" defaultValue={defaultProjectId || projects[0]?.id} className={input}>
              {projects.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.title}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Raum" error={room === "__andere" ? undefined : e.room}>
          {(p) => (
            <select {...p} name="room" value={room} onChange={(ev) => setRoom(ev.target.value)} className={input}>
              {ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="__andere">Anderer Raum …</option>
            </select>
          )}
        </Field>
        {room === "__andere" && (
          <Field label="Welcher Raum?" error={e.room}>
            {(p) => <input {...p} name="roomOther" type="text" maxLength={80} autoComplete="off" className={input} />}
          </Field>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budgetrahmen (optional)" error={e.budget} hint="Hilft uns, passende Vorschläge vorzubereiten.">
          {(p) => (
            <select {...p} name="budget" defaultValue="" className={input}>
              {Object.entries(BUDGETS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Zeitraum (optional)" error={e.timeframe} hint="Wann soll es fertig sein?">
          {(p) => (
            <select {...p} name="timeframe" defaultValue="" className={input}>
              {Object.entries(TIMEFRAMES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label="Ihr Vorhaben" error={e.message} hint="Stil, Nutzung, vorhandene Möbel, Maße falls bekannt.">
        {(p) => <textarea {...p} name="message" rows={5} maxLength={2500} required className={`${input} py-3`} />}
      </Field>

      <DateFields error={e.preferredDates} legend="Wunschtermine für ein Gespräch (optional, bis zu 3)" />
      <ContactChoice />

      <div className="bg-bone px-4 py-3 text-[13px] leading-relaxed text-ink/80">
        <strong className="font-semibold text-ink">Fotos und Grundrisse:</strong> Bitte noch nicht anhängen. Nach Ihrer Anfrage erhalten Sie von uns einen persönlichen,
        geschützten Upload-Link – so landen Ihre Bilder nur bei uns und nicht im E-Mail-Postfach.
      </div>

      <PrivacyHint />
      <Status state={state} />
      <Submit pending={pending}>Planungsanfrage senden</Submit>
    </form>
  );
}
