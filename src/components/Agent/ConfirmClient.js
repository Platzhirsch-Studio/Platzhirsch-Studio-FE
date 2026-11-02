"use client";
// Bestätigung eines Terminwunschs aus einem KI-Assistenten (Double-Opt-in).
// Liest den Token aus dem Fragment, zeigt die Angaben (POST preview) und
// sendet erst auf Knopfdruck der Person (POST confirm). Das Fragment wird
// danach aus der Adresszeile entfernt (kein Token im Verlauf/Teilen).
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import LinkArrow from "@/components/ui/LinkArrow";
import { CONFIRM } from "@/lib/agent/copy";
import { CONFIRM_API_PATH } from "@/lib/agent/config";

async function post(token, action) {
  try {
    const res = await fetch(CONFIRM_API_PATH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, action }) });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  } catch {
    return { status: 0, body: {} };
  }
}

export default function ConfirmClient() {
  const token = useRef("");
  const [state, setState] = useState({ step: "loading" });
  const heading = useRef(null);

  useEffect(() => {
    // Einmal lesen: der Effekt kann (Strict Mode) zweimal laufen, das Fragment
    // ist nach dem ersten Lauf schon aus der Adresszeile entfernt.
    if (!token.current) token.current = window.location.hash.slice(1);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    if (!token.current) {
      setState({ step: "missing" });
      return;
    }
    post(token.current, "preview").then(({ status, body }) => {
      if (status === 200 && body.ok) setState({ step: body.used ? "already" : "review", ...body });
      else setState({ step: status === 400 ? "invalid" : "error" });
    });
  }, []);

  useEffect(() => {
    if (["done", "already", "invalid", "error"].includes(state.step)) heading.current?.focus();
  }, [state.step]);

  async function confirm() {
    setState((s) => ({ ...s, step: "sending" }));
    const { status, body } = await post(token.current, "confirm");
    if (status === 200 && body.ok) setState((s) => ({ ...s, step: "done", dryrun: body.dryrun }));
    else if (status === 409) setState((s) => ({ ...s, step: "already" }));
    else if (status === 400) setState({ step: "invalid" });
    else setState((s) => ({ ...s, step: "review", failed: true }));
  }

  const s = state.summary;
  const f = CONFIRM.fields;
  const rows = s
    ? [
        [f.name, s.name],
        [f.email, s.email],
        [f.phone, s.phone],
        [f.topic, s.topic],
        [f.project, s.project],
        [f.property, s.property],
        [f.place, s.place],
        [f.times, s.times?.length ? s.times.join("; ") : CONFIRM.none],
        ...(s.message ? [[f.message, s.message]] : []),
      ]
    : [];

  const message =
    state.step === "missing" ? CONFIRM.missing : state.step === "invalid" ? CONFIRM.invalid : state.step === "error" ? CONFIRM.error : state.step === "already" ? CONFIRM.already : state.step === "done" ? (state.dryrun ? CONFIRM.doneDry : CONFIRM.done) : null;

  return (
    <div className="mt-10" data-confirm-step={state.step}>
      {state.step === "loading" && <p className="text-body text-text-soft">{CONFIRM.loading}</p>}

      {rows.length > 0 && (state.step === "review" || state.step === "sending") && (
        <>
          {state.dryrun && <p className="mb-6 border-l-2 border-notice pl-4 text-small text-text">{CONFIRM.dryrun}</p>}
          <dl className="divide-y divide-line border-y border-line">
            {rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="text-small text-text-soft">{k}</dt>
                <dd className="text-body text-text wrap-break-word">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-small text-text-soft tabular">
            {CONFIRM.reference}: {state.reference}
          </p>
          {state.failed && (
            <p role="alert" className="mt-4 text-small text-error">
              {CONFIRM.error}
            </p>
          )}
          <div className="mt-8">
            <Button type="button" onClick={confirm} disabled={state.step === "sending"} aria-disabled={state.step === "sending"}>
              {state.step === "sending" ? CONFIRM.sending : CONFIRM.confirm}
            </Button>
          </div>
          <p className="mt-4 max-w-measure text-small text-text-soft">{CONFIRM.ignore}</p>
        </>
      )}

      {message && (
        <div>
          <p ref={heading} tabIndex={-1} role="status" className="text-lead text-text focus:outline-none">
            {message}
          </p>
          {state.step !== "done" && (
            <LinkArrow href={CONFIRM.direct.href} className="mt-stack-s">
              {CONFIRM.direct.label}
            </LinkArrow>
          )}
        </div>
      )}
    </div>
  );
}
