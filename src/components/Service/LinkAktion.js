"use client";
// Link-Aktion aus einer Mail (Newsletter bestätigen/abbestellen, Adventsabend
// absagen). Das Token aus ?token= geht erst nach einem Klick per POST an
// /<locale>/service/senden/<art> – Mail-Scanner, die Links vorab öffnen,
// lösen nichts aus (Muster /kundenkarte/bestaetigen, ConfirmClient.js).
// emailFallback: ohne (oder mit ungültigem) Token ein Feld für die E-Mail-Adresse
// (nur Newsletter-Abmeldung). Texte: src/lib/service/linkAktionenCopy.js.
import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { FormField, Honeypot } from "@/components/Forms";
import { fill } from "@/lib/service/linkAktionenCopy";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FINAL = ["done", "missing", "invalid", "expired", "error", "notAvailable", "rateLimited"];

export default function LinkAktion({ art, locale, texts, common, phone, email, emailFallback = false, backHref, backLabel }) {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const id = useId();
  const message = useRef(null);
  const heading = useRef(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, []);
  const [state, setState] = useState(() => ({ step: token ? "ready" : emailFallback ? "email" : "missing" }));
  const [address, setAddress] = useState("");
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    if (state.step === "done") heading.current?.focus();
    else if (FINAL.includes(state.step)) message.current?.focus();
  }, [state.step]);

  async function send(body, { viaEmail = false } = {}) {
    setState({ step: "sending", viaEmail });
    let status = 0;
    let data = {};
    try {
      const res = await fetch(`/${locale}/service/senden/${art}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) });
      status = res.status;
      data = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    if (status === 200 && data.success) return setState({ step: "done", status: viaEmail ? "email" : data.status });
    if (data.code === "invalid_token") return setState({ step: emailFallback ? "email" : "invalid", invalid: true });
    const map = { expired: "expired", not_available: "notAvailable", rate_limited: "rateLimited", invalid: viaEmail ? "email" : "invalid" };
    if (viaEmail && data.code === "invalid") {
      setFieldError(texts.emailInvalid);
      return setState({ step: "email" });
    }
    setState({ step: map[data.code] || "error" });
  }

  function submitEmail(ev) {
    ev.preventDefault();
    const value = address.trim();
    if (!EMAIL_RE.test(value)) {
      setFieldError(texts.emailInvalid);
      document.getElementById(`${id}-email`)?.focus();
      return;
    }
    setFieldError("");
    const website = ev.currentTarget.elements?.namedItem("website")?.value || "";
    send({ email: value, website, _t: Math.round(performance.now() - started.current) }, { viaEmail: true });
  }

  const contact = <p className="mt-6 text-small text-text-soft">{fill(common.contact, { phone, email })}</p>;
  const back = backHref ? (
    <div className="mt-8">
      <Button href={backHref} variant="secondary">
        {backLabel || common.home}
      </Button>
    </div>
  ) : null;

  if (state.step === "ready" || (state.step === "sending" && !state.viaEmail)) {
    const sending = state.step === "sending";
    return (
      <div className="mt-8" data-link-state="ready">
        <p className="max-w-measure text-lead text-text">{texts.lead}</p>
        <div className="mt-8">
          <Button type="button" onClick={() => send({ token })} disabled={sending} aria-disabled={sending || undefined} data-link-action={art}>
            {sending ? texts.sending : texts.button}
          </Button>
        </div>
        {contact}
      </div>
    );
  }

  if (state.step === "email" || (state.step === "sending" && state.viaEmail)) {
    const sending = state.step === "sending";
    return (
      <div className="mt-8" data-link-state="email">
        {state.invalid && (
          <p ref={message} tabIndex={-1} role="alert" className="mb-6 max-w-measure text-body text-text focus:outline-none">
            {texts.invalid}
          </p>
        )}
        <p className="max-w-measure text-lead text-text">{texts.emailLead}</p>
        <form noValidate onSubmit={submitEmail} className="relative mt-8 max-w-[32rem]">
          <Honeypot id={`${id}-hp`} />
          <FormField
            id={`${id}-email`}
            label={texts.emailLabel}
            required
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            error={fieldError || undefined}
          />
          <div className="mt-6">
            <Button type="submit" disabled={sending} aria-disabled={sending || undefined} data-link-email-submit>
              {sending ? texts.sending : texts.emailButton}
            </Button>
          </div>
        </form>
        {contact}
      </div>
    );
  }

  if (state.step === "done") {
    const extra = state.status === "email" ? texts.doneEmail : state.status?.startsWith("bereits") ? texts.already : state.status === "vorgemerkt" ? texts.vorgemerkt : null;
    return (
      <div className="mt-8" data-link-state="done" data-link-status={state.status || ""}>
        <h2 ref={heading} tabIndex={-1} className="font-display text-display-m text-text text-balance focus:outline-none">
          {texts.doneTitle}
        </h2>
        <p className="mt-4 max-w-measure text-body text-text-soft">{extra || texts.doneText}</p>
        {back}
      </div>
    );
  }

  const text = {
    missing: texts.missing,
    invalid: fill(texts.invalid, { phone, email }),
    expired: texts.expired,
    notAvailable: fill(texts.notAvailable || common.error, { phone, email }),
    rateLimited: common.rateLimited,
    error: fill(common.error, { phone, email }),
  }[state.step];
  return (
    <div className="mt-10" data-link-state={state.step}>
      <p ref={message} tabIndex={-1} role="alert" className="max-w-measure text-lead text-text focus:outline-none">
        {text}
      </p>
      {state.step === "expired" && texts.again ? (
        <div className="mt-8">
          <Button href={`/${locale}/newsletter`} variant="secondary">
            {texts.again}
          </Button>
        </div>
      ) : (
        back
      )}
      {contact}
    </div>
  );
}
