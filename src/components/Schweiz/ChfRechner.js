"use client";
// CHF-Rechner des Schweiz-Hubs – die einzige Client-Insel der Seite.
// Rechnet NICHT im Browser: das Formular ruft die Server Function
// estimateAction (src/lib/ch/actions.js → estimate.js → Labs/Dreilaender/calc.js)
// und zeigt die fertigen Texte. Funktioniert ohne JS als normales Formular
// (progressive enhancement von useActionState). Statische Texte kommen als
// Props vom Server (`copy`), damit das eigene JS klein bleibt (Budget ≤ 3 KB).
// Design: eckig, Feld 52 px, Label über dem Feld, Fehler am Feld
// (aria-invalid/-describedby) plus Zusammenfassung mit Fokus.
import { useActionState, useEffect, useRef } from "react";
import { estimateAction } from "@/lib/ch/actions";

const FIELD =
  "mt-2 block h-13 w-full bg-surface px-4 text-ui text-text tabular border transition-colors duration-(--duration-micro)";
const OK = " border-line-control hover:border-ink";
const BAD = " border-2 border-error";

function Field({ id, label, hint, error, value }) {
  const desc = [`${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={id} className="block text-ui text-text">
        {label}
      </label>
      <input
        id={id}
        name={id}
        inputMode="decimal"
        autoComplete="off"
        defaultValue={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={desc}
        className={FIELD + (error ? BAD : OK)}
      />
      <p id={`${id}-hint`} className="mt-2 text-small text-text-soft">
        {hint}
      </p>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-small text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ChfRechner({ initial, copy }) {
  const [state, action, pending] = useActionState(estimateAction, initial);
  const summary = useRef(null);
  const errors = state.errors || {};
  const { rate, result } = state;

  useEffect(() => {
    if (state.status === "invalid") summary.current?.focus();
  }, [state]);

  return (
    <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
      <form action={action} noValidate className="lg:col-span-4" aria-describedby="chf-label">
        {copy.lang ? <input type="hidden" name="lang" value={copy.lang} /> : null}
        {state.status === "invalid" && (
          <div ref={summary} tabIndex={-1} role="alert" className="mb-6 border-l-2 border-error bg-surface-raised p-4 text-small text-text">
            {copy.errorSummary}
          </div>
        )}
        <div className="grid gap-6">
          <Field id="betrag" label={copy.amountLabel} hint={copy.amountHint} error={errors.betrag} value={state.values?.betrag} />
          <Field id="fracht" label={copy.freightLabel} hint={copy.freightHint} error={errors.fracht} value={state.values?.fracht} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-action px-6 text-ui text-paper transition-colors duration-(--duration-micro) hover:bg-action-hover disabled:opacity-60 sm:w-auto lg:min-h-13"
        >
          {pending ? copy.pending : copy.submit}
        </button>
      </form>

      <div aria-live="polite" aria-busy={pending} className="lg:col-span-8">
        <p id="chf-label" className="text-overline uppercase text-text-accent">
          {copy.label}
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 border-y border-line py-4 text-small sm:grid-cols-3">
          <div>
            <dt className="text-text-soft">{copy.rateLabel}</dt>
            <dd className="mt-1 text-body text-text tabular">1 € = {rate.rateText} CHF</dd>
          </div>
          <div>
            <dt className="text-text-soft">{copy.dateLabel}</dt>
            <dd className="mt-1 text-body text-text tabular">{rate.dateText}</dd>
          </div>
          <div>
            <dt className="text-text-soft">{copy.sourceLabel}</dt>
            <dd className="mt-1 text-body text-text">
              <a href={copy.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-line-strong underline-offset-4 hover:decoration-current">
                {rate.sourceText}
                <span className="sr-only">{copy.newWindow || " (öffnet in neuem Fenster)"}</span>
              </a>
            </dd>
          </div>
        </dl>
        {rate.level !== "ok" && <p className="mt-3 border-l-2 border-notice pl-3 text-small text-text">{rate.text}</p>}

        {result && (
          <>
            <p className="mt-4 text-small text-text-soft tabular">
              {copy.inputLine} {result.grossText} → {result.netText} · {copy.compareLabel} {result.compareText}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
              {result.wege.map((w) => (
                <section key={w.id} aria-labelledby={`chf-${w.id}`} className="border-t-2 border-ink pt-4">
                  <h3 id={`chf-${w.id}`} className="text-title text-text">
                    {w.title}
                  </h3>
                  <dl className="mt-3">
                    {w.lines.map((l) => (
                      <div key={l.label} className="flex justify-between gap-4 border-b border-line py-2 text-small">
                        <dt className="text-text-soft">{l.label}</dt>
                        <dd className="shrink-0 text-right text-text tabular">{l.text}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4 py-3">
                      <dt className="text-ui text-text">{copy.totalLabel}</dt>
                      <dd className="shrink-0 text-right text-ui font-semibold text-text tabular">≈ {w.total.text}</dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          </>
        )}
        <p className="mt-6 text-small text-text-soft">{copy.rounding}</p>
      </div>
    </div>
  );
}
