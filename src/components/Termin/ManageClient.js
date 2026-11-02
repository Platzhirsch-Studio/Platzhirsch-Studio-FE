"use client";
// /[locale]/termin/verwalten#<token> – Termin ansehen, verschieben, absagen.
// Der signierte Link steht im Fragment (location.hash) und geht nur per POST
// an /api/termin/manage|cancel|reschedule, nie in eine Adresse. Nach dem
// Umbuchen ersetzt der neue Token das Fragment (history.replaceState), der
// alte gilt nicht mehr. Absagen braucht eine zweite Bestätigung (inline, kein
// Modal). Fokus nach jedem Ergebnis auf die Meldung.
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { fill } from "@/lib/booking/format";
import SlotPicker from "./SlotPicker";
import { Facts, IcsLink, MeetInfo } from "./parts";

async function post(path, body) {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  } catch {
    return { status: 0, body: {} };
  }
}

export default function ManageClient({ locale, copy, phone }) {
  const c = copy;
  const m = c.manage;
  const token = useRef("");
  const message = useRef(null);
  const [state, setState] = useState({ step: "loading" });
  const [mode, setMode] = useState(null); // null | "cancel" | "reschedule"
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!token.current) token.current = decodeURIComponent(window.location.hash.slice(1));
    if (!token.current) {
      setState({ step: "missing" });
      return;
    }
    post("/api/termin/manage", { token: token.current, locale }).then(({ status, body }) => {
      if (status === 200 && body.ok) setState({ step: "ready", booking: body.booking });
      else setState({ step: body.code === "expired" ? "expired" : status === 403 || status === 400 ? "invalid" : "error" });
    });
  }, [locale]);

  useEffect(() => {
    if (notice || ["missing", "invalid", "expired", "error"].includes(state.step)) message.current?.focus();
  }, [notice, state.step]);

  async function doCancel() {
    setBusy(true);
    const { status, body } = await post("/api/termin/cancel", { token: token.current, locale });
    setBusy(false);
    setMode(null);
    if (status === 200 && body.ok) {
      setState({ step: "ready", booking: body.booking });
      setNotice({ tone: "ok", text: m.cancelled });
    } else setNotice({ tone: "error", text: body.code === "too_late_to_change" ? fill(m.tooLate, { phone }) : fill(m.error, { phone }) });
  }

  async function doReschedule() {
    if (!slot) {
      setNotice({ tone: "error", text: c.errors.slot });
      return;
    }
    setBusy(true);
    const { status, body } = await post("/api/termin/reschedule", { token: token.current, start: slot.start, locale });
    setBusy(false);
    if (status === 200 && body.ok) {
      token.current = body.manageUrl.split("#")[1];
      history.replaceState(null, "", body.manageUrl);
      setState({ step: "ready", booking: body.booking });
      setMode(null);
      setSlot(null);
      setNotice({ tone: "ok", text: m.rescheduled });
      return;
    }
    if (body.code === "slot_taken" || body.code === "outside_window") {
      setSlot(null);
      setNotice({ tone: "error", text: c.errors[body.code] });
      return;
    }
    setNotice({ tone: "error", text: body.code === "too_late_to_change" ? fill(m.tooLate, { phone }) : fill(m.error, { phone }) });
  }

  if (state.step === "loading") return <p className="mt-10 text-body text-text-soft">{m.loading}</p>;
  if (state.step !== "ready") {
    const text = { missing: m.missing, invalid: m.invalid, expired: m.expired, error: fill(m.error, { phone }) }[state.step];
    return (
      <div className="mt-10" data-manage-state={state.step}>
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

  const b = state.booking;
  return (
    <div className="mt-10" data-manage-state="ready" data-termin-status={b.status}>
      {b.test && <p className="mb-6 border-l-2 border-notice pl-4 text-small text-text">{c.testBanner}</p>}
      {notice && (
        <p
          ref={message}
          tabIndex={-1}
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mb-6 max-w-measure border-l-2 pl-4 text-body focus:outline-none ${notice.tone === "error" ? "border-error text-error" : "border-success text-text"}`}
        >
          {notice.text}
        </p>
      )}
      <Facts copy={c} booking={b} locale={locale} extra={[[m.statusLabel, m.status[b.status] || b.status]]} />

      {b.status !== "storniert" && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <IcsLink ics={b.ics} reference={b.ref} label={c.done.ics} />
        </div>
      )}
      {/* Videoraum-Knopf erst ab 15 Minuten vor Beginn (der Server liefert den Link nur dann). */}
      <MeetInfo copy={c} booking={b} locale={locale} />

      {b.canChange && mode === null && (
        <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-6">
          <Button type="button" variant="secondary" onClick={() => { setNotice(null); setMode("reschedule"); }}>
            {m.reschedule}
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setNotice(null); setMode("cancel"); }}>
            {m.cancel}
          </Button>
        </div>
      )}

      {mode === "cancel" && (
        <div className="mt-10 border-t border-line pt-6" role="group" aria-labelledby="termin-cancel-q">
          <p id="termin-cancel-q" className="text-body text-text">
            {m.cancelConfirm}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={doCancel} disabled={busy} autoFocus>
              {busy ? c.actions.sending : m.cancelYes}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode(null)} disabled={busy}>
              {m.cancelNo}
            </Button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <section className="mt-10 border-t border-line pt-6" aria-labelledby="termin-reschedule-h">
          <h2 id="termin-reschedule-h" className="text-title text-text">
            {m.reschedule}
          </h2>
          <SlotPicker art={b.art} modus={b.modus} locale={locale} copy={c} value={slot} onChange={setSlot} phone={phone} />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" onClick={doReschedule} disabled={busy}>
              {busy ? c.actions.sending : m.rescheduleSave}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setMode(null); setSlot(null); }} disabled={busy}>
              {c.actions.back}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
