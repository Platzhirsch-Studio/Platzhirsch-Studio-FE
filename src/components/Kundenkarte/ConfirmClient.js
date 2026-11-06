"use client";
// /[locale]/kundenkarte/bestaetigen?token=<antrag>.<geheimnis> – E-Mail-Adresse
// bestätigen (Double-Opt-in). Das Token geht erst nach einem Klick per POST an
// /api/kundenkarte/confirm: Mail-Scanner, die Links vorab öffnen, bestätigen
// nichts. Die Seite sendet keinen Referrer (metadata.referrer).
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { fill } from "@/lib/kundenkarte/copy";

export default function ConfirmClient({ locale, copy, phone, portalHref, formHref }) {
  const k = copy.confirm;
  const params = useSearchParams();
  const token = params.get("token") || "";
  const message = useRef(null);
  const heading = useRef(null);
  const [state, setState] = useState(() => ({ step: token ? "ready" : "missing" }));

  useEffect(() => {
    if (state.step === "done") heading.current?.focus();
    else if (["missing", "invalid", "expired", "error"].includes(state.step)) message.current?.focus();
  }, [state.step]);

  async function confirm() {
    setState({ step: "sending" });
    let status = 0;
    let body = {};
    try {
      const res = await fetch("/api/kundenkarte/confirm", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ token, locale }) });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    if (status === 200 && body.success) return setState({ step: "done", already: Boolean(body.already) });
    const map = { invalid_token: "invalid", invalid: "invalid", expired: "expired" };
    setState({ step: map[body.code] || "error" });
  }

  if (state.step === "ready" || state.step === "sending") {
    return (
      <div className="mt-8" data-confirm-state="ready">
        <p className="max-w-measure text-lead text-text">{k.lead}</p>
        <div className="mt-8">
          <Button type="button" onClick={confirm} disabled={state.step === "sending"} aria-disabled={state.step === "sending" || undefined} data-kundenkarte-confirm>
            {state.step === "sending" ? k.sending : k.button}
          </Button>
        </div>
      </div>
    );
  }

  if (state.step === "done") {
    return (
      <div className="mt-8" data-confirm-state="done">
        <h2 ref={heading} tabIndex={-1} className="font-display text-display-m text-text text-balance focus:outline-none">
          {k.doneTitle}
        </h2>
        {state.already && <p className="mt-3 text-body text-text-soft">{k.already}</p>}
        <p className="mt-4 max-w-measure text-body text-text-soft">{k.doneText}</p>
        <div className="mt-8">
          <Button href={portalHref} arrow>
            {k.portal}
          </Button>
        </div>
      </div>
    );
  }

  const text = { missing: k.missing, invalid: k.invalid, expired: k.expired, error: fill(k.error, { phone }) }[state.step];
  return (
    <div className="mt-10" data-confirm-state={state.step}>
      <p ref={message} tabIndex={-1} role="alert" className="max-w-measure text-lead text-text focus:outline-none">
        {text}
      </p>
      <div className="mt-8">
        <Button href={formHref} variant="secondary">
          {k.backToForm}
        </Button>
      </div>
    </div>
  );
}
