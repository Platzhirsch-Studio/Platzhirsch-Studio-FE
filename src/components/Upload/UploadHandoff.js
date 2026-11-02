"use client";
// Success-screen card ("Übergabekarte"): QR code + direct link to the mobile
// upload page (/de/upload/<token>). Used by the product inquiry, Beratung and
// Kontakt forms after a successful submit, and by /de/upload (with a
// pre-built `initial` handoff, so no request is needed there).
// The forms send through /api/upload/inquiry/<kind>, whose answer carries a
// signed ticket (`result.upload.ticket`); only that ticket buys an upload link
// (POST /api/upload/session). The QR SVG (house QR with monogram, scan-tested,
// src/lib/upload/qrSvg.js) is rendered on the server.
// Interface (shared with the forms, R2 contract): default export
// UploadHandoff({ kind, ticket, email, initial, onClose, onContinue,
// continueLabel, className }) and handoffFrom(kind, { email, result, ticket }).
// Without a ticket (fake success, older answer) the card shows the e-mail way.
//
// Labs-Ausbau "Handy-Upload Premium" (Design-Bibel §2 P2/P3, §6, §8):
//   - desktop: QR in a viewfinder frame on bone, 3-step mini guide, validity
//     countdown (client only, after mount), "Auf diesem Gerät" as secondary;
//   - phone: one primary button (same tab), the QR is not shown;
//   - "Link an mich senden" (SMS / E-Mail): PREPARED only. Nothing is sent by
//     Platzhirsch; the buttons open the visitor's own SMS or mail app with the
//     link filled in (sms: / mailto:), clearly marked "Vorbereitet".
// Hairlines on paper, no radius, no shadow, no gold on light (tests:
// r3-portal-upload, r3-portal-flat, upload.spec).
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowRight, ArrowUpRight, Copy, Check, Mail, X, Camera, Film, FileText, RotateCw, ScanLine, MessageSquare, ChevronDown, Clock,
} from "lucide-react";
import { EMAIL, EMAIL_HREF } from "@/lib/site";
import { UPLOAD_CONFIG, uploadsAccepting } from "@/lib/upload/config";
import {
  HANDOFF_ATTEMPTS as ATTEMPTS,
  HANDOFF_AUTO_RETRY as AUTO_RETRY,
  HANDOFF_MAX_WAIT_MS as MAX_WAIT_MS,
  HANDOFF_REASONS as REASONS,
  HANDOFF_RETRYABLE as RETRYABLE,
  linkFailureReason as failureReason,
} from "@/lib/upload/messages";

const TICKET_RE = /^[A-Za-z0-9_-]{20,1170}\.[A-Za-z0-9_-]{22}$/;
const asTicket = (v) => (typeof v === "string" && TICKET_RE.test(v) ? v : undefined);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper for the forms: the props for <UploadHandoff> from a submit.
 * `result` = JSON answer of /api/upload/inquiry/<kind> (ticket in
 * `result.upload.ticket`; `result.ticket` is accepted too). Additive: an
 * explicit `ticket` wins. Returns null while uploadsAccepting() is false.
 */
export function handoffFrom(kind, { email, result, ticket } = {}) {
  // r1-recht-inhalt P0-4: while the upload takes nothing, the forms show their
  // success message alone (no card, no e-mail detour that looks like a feature).
  if (!uploadsAccepting()) return null;
  const cleanEmail = typeof email === "string" && EMAIL_RE.test(email.trim()) ? email.trim() : undefined;
  return { kind, email: cleanEmail, ticket: asTicket(ticket) || asTicket(result?.upload?.ticket) || asTicket(result?.ticket) };
}

// No `display` here: each element sets its own (QA A-1 — in Tailwind 4
// `inline-flex` in the same list beat `hidden`, so phones showed two buttons).
const linkBase =
  "min-h-11 items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quiet = `${linkBase} inline-flex gap-1.5 px-1 text-[15px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current`;

async function requestLink(ticket, timeoutMs = 20000) {
  const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(timeoutMs) : undefined;
  let r;
  try {
    r = await fetch("/api/upload/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
      signal,
    });
  } catch (error) {
    return { status: "error", reason: failureReason(error) };
  }
  const j = await r.json().catch(() => ({}));
  if (r.ok && j.ok && j.url) return { status: "ready", data: j };
  if (r.status === 429) return { status: "error", reason: j.error === "daily_limit" ? "daily_limit" : "rate_limited" };
  if (r.status === 507) return { status: "error", reason: "storage_full" };
  if (j.error === "ticket_expired") return { status: "error", reason: "ticket_expired" };
  return { status: "error", reason: r.status >= 500 ? "server" : "no_ticket" };
}

// ---- validity countdown (client only: the server snapshot is null) ---------
const TICK_MS = 30_000;
function subscribeClock(cb) {
  const id = setInterval(cb, TICK_MS);
  return () => clearInterval(id);
}
const clockSnapshot = () => Math.floor(Date.now() / TICK_MS);
const serverClock = () => null;

// "Mounted" flag (QA fix1 P2-4): false on the server and during hydration,
// true afterwards. Buttons that need JS stay disabled until then, so an early
// click never silently does nothing.
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

// Value next to the label "Gültig" (QA fix1 P2-5: the word appears once).
export function remainingLabel(ms) {
  if (ms <= 0) return "abgelaufen";
  const min = Math.max(1, Math.floor(ms / 60_000));
  if (min <= 90) return `noch ${min} Min.`;
  const h = Math.floor(ms / 3_600_000);
  if (h < 48) return `noch ${h} Std.`;
  return `noch ${Math.floor(h / 24)} Tage`;
}

// Same time zone on server and browser → identical first render.
const TIME_FMT = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
const DAY_FMT = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", timeZone: "Europe/Vienna" });
/**
 * Before the clock runs (server render, hydration): "bis 20:43 Uhr" for a
 * short link (demo, 1 h) or "bis 10. November, 19:59 Uhr".
 */
export function untilLabel(iso, short = false) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return short ? `bis ${TIME_FMT.format(d)} Uhr` : `bis ${DAY_FMT.format(d)}, ${TIME_FMT.format(d)} Uhr`;
}

const GUIDE = [
  ["Kamera öffnen", "Die normale Kamera-App genügt – ohne App, ohne Anmeldung."],
  ["Code anvisieren", "Auf den Link tippen, der über dem Code erscheint."],
  ["Raum zeigen", "Fotos, Video-Rundgang oder Grundriss senden. Fertig."],
];

/** Four corner brackets around the QR (camera viewfinder), decorative. */
function Viewfinder() {
  const c = "pointer-events-none absolute size-5 border-ink";
  return (
    <span aria-hidden="true">
      <span className={`${c} -left-2 -top-2 border-l-2 border-t-2`} />
      <span className={`${c} -right-2 -top-2 border-r-2 border-t-2`} />
      <span className={`${c} -bottom-2 -left-2 border-b-2 border-l-2`} />
      <span className={`${c} -bottom-2 -right-2 border-b-2 border-r-2`} />
    </span>
  );
}

/**
 * "Link an mich senden": prepared UI, opens the visitor's own app (nothing is
 * sent by us). Desktop/tablet only (QA fix1 P2-2: on the phone the visitor is
 * already on the right device); E-Mail first, SMS second.
 */
function SendToMe({ data, email, mounted }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState("mail");
  const [to, setTo] = useState({ sms: "", mail: email || "" });
  const value = to[channel];
  const body = `Fotos, Videos und Pläne zu meiner Anfrage hochladen (Platzhirsch, ${data.ref}):\n${data.url}`;
  const phone = value.replace(/[^\d+]/g, "");
  const href =
    channel === "sms"
      ? `sms:${phone}?&body=${encodeURIComponent(body)}`
      : `mailto:${EMAIL_RE.test(value.trim()) ? value.trim() : ""}?subject=${encodeURIComponent(`Upload-Link Platzhirsch (${data.ref})`)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="hidden border-t border-line sm:block" data-upload-sendtome="">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        disabled={!mounted}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-wait"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Mail size={18} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block whitespace-nowrap">Link an mich senden</span>
            <span className="mt-0.5 flex items-center gap-2 text-xs font-normal text-ink-soft">
              <span className="border border-line bg-bone px-1.5 py-px text-[11px] font-semibold uppercase tracking-[0.12em]">Vorbereitet</span>
              per E-Mail oder SMS
            </span>
          </span>
        </span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform duration-(--duration-ui) ease-quiet motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={`${id}-panel`} hidden={!open} className="pb-4">
        {/* Segmented choice as two toggle buttons (a native radio keeps a 50 % UA radius, Bibel §6: 0). */}
        <div role="group" aria-label="Versandweg" className="grid grid-cols-2 border border-line-control">
          {[
            ["mail", "E-Mail", Mail],
            ["sms", "SMS", MessageSquare],
          ].map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              aria-pressed={channel === key}
              onClick={() => setChannel(key)}
              className={`flex min-h-11 items-center justify-center gap-2 text-[15px] font-medium transition-colors duration-(--duration-micro) focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current ${
                channel === key ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-stone"
              }`}
            >
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
        <label htmlFor={`${id}-to`} className="mt-3 block text-sm font-medium">
          {channel === "sms" ? "Ihre Handynummer" : "Ihre E-Mail-Adresse"} <span className="font-normal text-ink-soft">(bleibt auf diesem Gerät)</span>
        </label>
        <input
          id={`${id}-to`}
          type={channel === "sms" ? "tel" : "email"}
          inputMode={channel === "sms" ? "tel" : "email"}
          autoComplete={channel === "sms" ? "tel" : "email"}
          value={value}
          onChange={(e) => setTo((t) => ({ ...t, [channel]: e.target.value }))}
          placeholder={channel === "sms" ? "+43 …" : "name@beispiel.at"}
          className="mt-1.5 h-12 w-full border border-line-control bg-paper px-3 text-base text-ink placeholder:text-ink-soft focus:border-ink focus:outline-2 focus:outline-offset-1 focus:outline-ink"
        />
        <a
          href={href}
          className={`${linkBase} mt-3 flex w-full border border-ink px-5 text-[15px] font-medium text-ink hover:bg-ink hover:text-paper`}
        >
          {channel === "sms" ? <MessageSquare size={16} aria-hidden="true" /> : <Mail size={16} aria-hidden="true" />}
          {channel === "sms" ? "In meiner SMS-App öffnen" : "In meiner Mail-App öffnen"}
        </a>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          Vorbereitet: Der direkte Versand durch Platzhirsch ist noch nicht aktiv. Dieser Knopf öffnet Ihre eigene{" "}
          {channel === "sms" ? "SMS-App" : "Mail-App"} mit dem fertigen Link – Platzhirsch sendet und speichert dabei nichts.
        </p>
      </div>
    </div>
  );
}

export default function UploadHandoff({ kind, ticket, email, initial, onClose, onContinue, continueLabel, className = "" }) {
  const [state, setState] = useState(
    initial ? { status: "ready", data: initial } : ticket ? { status: "loading" } : { status: "error", reason: "no_ticket" },
  );
  const [copied, setCopied] = useState(false);
  // QA fix2 P2-3: clipboard blocked/missing → the link appears in a read-only,
  // pre-selected field instead of a silent "Link kopieren".
  const [manualCopy, setManualCopy] = useState(false);
  const manualRef = useRef(null);
  const alive = useRef(true);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const clock = useSyncExternalStore(subscribeClock, clockSnapshot, serverClock);
  const mounted = useMounted();

  // Automatic retries on network/server errors and timeouts (WebKit sometimes
  // fails a POST on a reused keep-alive connection: "rewinding of the data
  // stream failed"; a busy server answers late). The same ticket always
  // returns the same link, so a retry never creates a second folder. After a
  // timeout the card says that it takes longer than usual and keeps waiting.
  const load = useCallback(async () => {
    setState({ status: "loading" });
    const started = Date.now();
    let next = null;
    for (const [i, { delay, timeout }] of ATTEMPTS.entries()) {
      if (i > 0) {
        if (!alive.current || next.status !== "error" || !AUTO_RETRY.has(next.reason)) break;
        if (Date.now() - started + delay >= MAX_WAIT_MS) break;
        if (next.reason === "timeout") setState({ status: "loading", slow: true });
        await new Promise((r) => setTimeout(r, delay));
        if (!alive.current) break;
      }
      next = await requestLink(ticket, Math.min(timeout, Math.max(5000, MAX_WAIT_MS - (Date.now() - started))));
    }
    if (alive.current) setState(next);
  }, [ticket]);

  // QA R2 P2: after a form submit the focus must land on the confirmation,
  // not on <main>. The forms focus their success box in a requestAnimationFrame
  // that can run before React has rendered it; if the focus is lost by then,
  // move it to the confirmation right before this card, else to our title.
  useEffect(() => {
    if (initial) return; // demo page: nothing was submitted
    const id = setTimeout(() => {
      const a = document.activeElement;
      if (a && a !== document.body && a.tagName !== "MAIN" && a.isConnected) return;
      const prev = sectionRef.current?.previousElementSibling;
      if (prev && prev.getAttribute("tabindex") === "-1") prev.focus();
      else titleRef.current?.focus();
    }, 60);
    return () => clearTimeout(id);
  }, [initial]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // The timer is cleared on unmount, so StrictMode (mount → unmount → mount)
  // still sends exactly one request.
  useEffect(() => {
    if (initial || !ticket) return;
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [initial, ticket, load]);

  const copy = async () => {
    if (state.status !== "ready") return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(state.data.url);
      setManualCopy(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Headless, embedded page, plain http over the LAN IP, locked-down
      // company browsers: no clipboard. Show the link selected for Ctrl/⌘ + C.
      setManualCopy(true);
      requestAnimationFrame(() => {
        const el = manualRef.current;
        el?.focus();
        el?.select();
      });
    }
  };
  const isMac = mounted && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  const manualHint = `Kopieren nicht möglich – Link markiert, mit ${isMac ? "⌘" : "Strg"} + C kopieren`;

  const data = state.status === "ready" ? state.data : null;
  // A server-built label (demo page) avoids ICU differences between Node and the browser.
  const shortLink = kind === "demo";
  const validUntil = data ? data.validLabel || untilLabel(data.expiresAt, shortLink).replace(/^bis /, "") : "";
  // Countdown only after mount (clock === null on the server and in the first render).
  const expiresMs = data ? Date.parse(data.expiresAt) : NaN;
  const ttlMs = kind === "demo" ? UPLOAD_CONFIG.demo.ttlMinutes * 60_000 : UPLOAD_CONFIG.tokenTtlDays * 86_400_000;
  const left = clock !== null && Number.isFinite(expiresMs) ? expiresMs - clock * TICK_MS : null;
  const leftShare = left === null ? 1 : Math.max(0, Math.min(1, left / ttlMs));

  return (
    <section
      ref={sectionRef}
      aria-labelledby="upload-handoff-title"
      data-upload-handoff=""
      className={`relative mx-auto w-full max-w-3xl overflow-hidden lg:max-w-[57rem] border border-line bg-paper text-left text-ink motion-safe:animate-[handoffIn_var(--duration-enter)_var(--ease-quiet)_both] ${className}`}
    >
      <style>{"@keyframes handoffIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes qrReady{from{opacity:.9;transform:scale(1)}to{opacity:0;transform:scale(2.8)}}"}</style>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 inline-flex size-11 items-center justify-center text-ink/80 hover:bg-stone focus-visible:outline-2 focus-visible:outline-ink"
          aria-label="Hinweis schließen"
        >
          <X size={18} aria-hidden="true" />
        </button>
      )}

      <div className="px-5 pb-5 pt-6 sm:px-8 sm:pt-8">
        {/* pr-12 keeps the eyebrow clear of the close button (44 px at right-2), QA R2 P2 at 320 px */}
        <p className={`text-overline uppercase text-gold-text ${onClose ? "pr-12" : ""}`}>Optional · dauert 1 Minute</p>
        <h3
          id="upload-handoff-title"
          ref={titleRef}
          tabIndex={-1}
          className="font-display mt-2 pr-10 text-[2rem] leading-[1.1] text-balance focus:outline-none sm:text-display-m"
        >
          Zeigen Sie uns Ihren Raum
        </h3>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ink/85 text-pretty sm:text-base">
          Mit Fotos, einem kurzen Video-Rundgang oder Ihrem Grundriss bereiten wir Ihre Beratung gezielt vor –
          direkt aus der Handykamera, ohne App und ohne Anmeldung.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm text-ink" aria-label="Möglich sind">
          {[
            [Camera, "Raumfotos"],
            [Film, `Video ≤ ${UPLOAD_CONFIG.videoMaxSeconds / 60} Min.`],
            [FileText, "Grundriss & Pläne"],
          ].map(([Icon, label]) => (
            <li key={label} className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap border border-line bg-bone px-2.5">
              <Icon className="text-ink-soft" size={15} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {state.status === "error" ? (
        <div role="status" className="border-t border-line px-5 py-5 text-[15px] leading-relaxed text-ink/85 sm:px-8">
          <p>
            {REASONS[state.reason] ? `${REASONS[state.reason]}. ` : ""}
            Sie können uns Fotos und Pläne gern per E-Mail an{" "}
            <a href={EMAIL_HREF} className="font-medium text-gold-text underline">{EMAIL}</a> senden.
          </p>
          {ticket && RETRYABLE.has(state.reason) && (
            <button
              type="button"
              onClick={load}
              className={`${linkBase} mt-2 inline-flex gap-1.5 font-medium text-gold-text underline-offset-4 hover:underline`}
            >
              <RotateCw size={16} aria-hidden="true" /> Erneut versuchen
            </button>
          )}
        </div>
      ) : (
        <div className="border-t border-line sm:grid sm:grid-cols-[17.5rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]">
          {/* QR panel — desktop/tablet only (on a phone the visitor already holds the camera).
              lg: 256 px code, vertically centred in its column (QA fix1 P2-1). */}
          <figure className="hidden flex-col items-center justify-center border-r border-line bg-bone px-5 pb-6 pt-8 sm:flex lg:px-8 lg:py-10">
            <div className="relative" data-qr-ready={data ? "" : undefined}>
              <Viewfinder />
              {data ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.qr}
                  width={256}
                  height={256}
                  alt="QR-Code zur Upload-Seite – mit der Handykamera scannen"
                  className="block size-56 max-w-none bg-paper motion-safe:animate-[handoffIn_var(--duration-swap)_var(--ease-quiet)_both] lg:size-64"
                />
              ) : (
                <div className="flex size-56 flex-col items-center justify-center gap-2 bg-linen text-center text-xs text-ink/80 lg:size-64" aria-hidden="true">
                  <ScanLine size={22} strokeWidth={1.5} />
                  QR-Code wird erstellt…
                </div>
              )}
            </div>
            <figcaption className="mt-5 inline-flex items-center gap-2 text-center text-sm font-medium">
              {data ? (
                <>
                  {/* P3-7: a quiet "ready" moment instead of a bare swap */}
                  <span className="relative flex size-2.5 items-center justify-center" aria-hidden="true">
                    <span className="absolute inset-0 bg-success/40 motion-safe:animate-[qrReady_1.2s_var(--ease-quiet)_2_both]" />
                    <span className="relative size-1.5 bg-success" />
                  </span>
                  <span className="whitespace-nowrap">Code bereit<span className="hidden lg:inline"> · mit der Kamera scannen</span><span className="lg:hidden"> · scannen</span></span>
                </>
              ) : (
                <>
                  <ScanLine size={16} strokeWidth={1.75} aria-hidden="true" /> Mit der Handykamera scannen
                </>
              )}
            </figcaption>
            {data && (
              <div className="mt-4 w-full max-w-56 lg:max-w-64">
                <p className="flex items-center justify-between gap-2 text-xs text-ink-soft tabular-nums">
                  <span className="inline-flex items-center gap-1"><Clock size={13} aria-hidden="true" /> Gültig</span>
                  <span data-upload-validity="">{left === null ? untilLabel(data.expiresAt, shortLink) : remainingLabel(left)}</span>
                </p>
                <div className="mt-1.5 h-px bg-line-strong" aria-hidden="true">
                  <div className="h-px origin-left bg-brass-500 transition-transform duration-(--duration-ui)" style={{ transform: `scaleX(${leftShare})` }} />
                </div>
              </div>
            )}
          </figure>

          <div className="min-w-0 px-5 pb-5 pt-5 sm:px-8 sm:pt-8">
            <ol className="hidden space-y-4 sm:block" aria-label="So geht es">
              {GUIDE.map(([title, text], i) => (
                <li key={title} className="grid grid-cols-[2rem_1fr] gap-x-3">
                  <span className="pt-0.5 text-sm font-semibold tabular-nums text-gold-text" aria-hidden="true">0{i + 1}</span>
                  <span>
                    <span className="block text-[15px] font-medium">
                      <span className="sr-only">Schritt {i + 1}: </span>
                      {title}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-ink/80">{text}</span>
                  </span>
                </li>
              ))}
            </ol>

            {/* Phone: the visitor is already on the phone → open in the same tab. The one primary action. */}
            <a
              href={data?.url || undefined}
              aria-disabled={!data}
              className={`${linkBase} flex min-h-12 w-full bg-ink px-5 text-base font-medium tracking-wide text-paper hover:bg-ink-deep sm:hidden ${data ? "" : "pointer-events-none opacity-60"}`}
              data-upload-link="phone"
            >
              Jetzt Fotos &amp; Pläne senden <ArrowRight size={18} aria-hidden="true" />
            </a>
            <p className="mt-2 text-center text-xs text-ink-soft sm:hidden">Öffnet die Upload-Seite hier auf Ihrem Handy.</p>

            {/* Desktop: scanning is the main way; this device is the quiet alternative. */}
            <div className="mt-6 hidden flex-col items-start gap-3 border-t border-line pt-4 sm:flex">
              <p className="text-sm text-ink/85">
                <span className="block font-medium text-ink">Auf diesem Gerät hochladen</span>
                Fotos und Pläne liegen schon auf dem Computer?
              </p>
              <a
                href={data?.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!data}
                className={`${linkBase} inline-flex shrink-0 border border-ink px-4 text-[15px] font-medium text-ink hover:bg-ink hover:text-paper ${data ? "" : "pointer-events-none opacity-60"}`}
                data-upload-link="desktop"
              >
                Upload-Seite öffnen <ArrowUpRight size={16} aria-hidden="true" />
                <span className="sr-only">(neuer Tab)</span>
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
              <button type="button" onClick={copy} disabled={!data || !mounted} data-upload-copy="" className={`${quiet} disabled:opacity-60`}>
                {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? "Kopiert" : "Link kopieren"}
              </button>
            </div>
            {manualCopy && data && (
              <div className="mt-2 w-full max-w-xl" data-upload-copy-fallback="">
                <label htmlFor="upload-handoff-manual-link" className="block text-xs text-ink/85">{manualHint}</label>
                <input
                  ref={manualRef}
                  id="upload-handoff-manual-link"
                  type="text"
                  readOnly
                  value={data.url}
                  spellCheck={false}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  className="mt-1 min-h-11 w-full border border-line-control bg-bone px-3 font-mono text-[13px] text-ink focus:border-ink focus:outline-2 focus:outline-offset-1 focus:outline-ink"
                />
              </div>
            )}
            <p className="sr-only" aria-live="polite">{copied ? "Link kopiert." : manualCopy ? `${manualHint}.` : ""}</p>

            {data && (
              <div className="mt-2">
                <SendToMe data={data} email={email} mounted={mounted} />
              </div>
            )}

            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink/80 tabular-nums" aria-live="polite">
              {data ? (
                <>Referenz <span className="font-medium text-ink">{data.ref}</span> · gültig bis {validUntil} · nur über diesen Link erreichbar</>
              ) : state.slow ? (
                "Das dauert gerade länger als üblich – einen Moment bitte…"
              ) : (
                "Upload-Link wird erstellt…"
              )}
            </p>
          </div>
        </div>
      )}

      {onContinue && (
        <div className="border-t border-line px-5 py-3 text-right sm:px-8">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-11 items-center text-[15px] font-medium text-gold-text underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ink"
          >
            {continueLabel || "Weiter"}
          </button>
        </div>
      )}
    </section>
  );
}
