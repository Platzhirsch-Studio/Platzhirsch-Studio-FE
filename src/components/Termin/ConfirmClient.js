"use client";
// /[locale]/termin/bestaetigen#<referenz>.<zufall> – E-Mail-Adresse bestätigen
// (Double-Opt-in). Der Link steht im Fragment (erreicht nie ein Server-Log)
// und geht erst nach einem Klick per POST an /api/termin/confirm: Mail-Scanner,
// die Links vorab öffnen, bestätigen so nichts. Danach zeigt die Seite den
// festen Termin mit .ics, Verwaltungslink und Videoraum-Hinweis
// (ConfirmedView). Ein zweiter Klick (neu laden) meldet „schon bestätigt“.
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { fill } from "@/lib/booking/format";
import { ConfirmedView } from "./parts";

export default function ConfirmClient({ locale, copy, phone }) {
  const c = copy;
  const k = c.confirm;
  const link = useRef("");
  const message = useRef(null);
  const heading = useRef(null);
  const [state, setState] = useState({ step: "loading" });

  useEffect(() => {
    if (!link.current) link.current = decodeURIComponent(window.location.hash.slice(1));
    setState({ step: link.current ? "ready" : "missing" });
  }, []);

  useEffect(() => {
    if (state.step === "done") heading.current?.focus();
    else if (["missing", "invalid", "expired", "taken", "gone", "error"].includes(state.step)) message.current?.focus();
  }, [state.step]);

  async function confirm() {
    setState({ step: "sending" });
    let status = 0;
    let body = {};
    try {
      const res = await fetch("/api/termin/confirm", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ link: link.current, locale }) });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    if (status === 200 && body.ok) return setState({ step: "done", ...body });
    const map = { invalid_token: "invalid", verify_expired: "expired", outside_window: "expired", slot_taken: "taken", cancelled: "gone" };
    setState({ step: map[body.code] || "error" });
  }

  if (state.step === "loading") return <p className="mt-10 text-body text-text-soft">{k.sending}</p>;

  if (state.step === "ready" || state.step === "sending") {
    return (
      <div className="mt-8" data-confirm-state="ready">
        <p className="max-w-measure text-lead text-text">{k.lead}</p>
        <div className="mt-8">
          <Button type="button" onClick={confirm} disabled={state.step === "sending"} aria-disabled={state.step === "sending" || undefined} data-termin-confirm>
            {state.step === "sending" ? k.sending : k.button}
          </Button>
        </div>
      </div>
    );
  }

  if (state.step === "done") {
    const b = state.booking;
    return (
      <div className="mt-8" data-confirm-state="done">
        <h2 ref={heading} tabIndex={-1} className="font-display text-display-m text-text text-balance focus:outline-none">
          {b.status === "angefragt" ? c.done.requested : c.done.booked}
        </h2>
        {state.already && <p className="mt-3 text-body text-text-soft">{k.already}</p>}
        {b.test && <p className="mt-6 border-l-2 border-notice pl-4 text-small text-text">{c.testBanner}</p>}
        <ConfirmedView copy={c} locale={locale} booking={b} manageUrl={state.manageUrl} />
      </div>
    );
  }

  const text = { missing: k.missing, invalid: k.invalid, expired: k.expired, taken: k.taken, gone: k.gone, error: fill(k.error, { phone }) }[state.step];
  return (
    <div className="mt-10" data-confirm-state={state.step}>
      <p ref={message} tabIndex={-1} role="alert" className="max-w-measure text-lead text-text focus:outline-none">
        {text}
      </p>
      <p className="mt-6">
        <a href={`/${locale}/termin`} className="inline-flex min-h-11 items-center text-ui underline underline-offset-4">
          {c.done.again}
        </a>
      </p>
    </div>
  );
}
