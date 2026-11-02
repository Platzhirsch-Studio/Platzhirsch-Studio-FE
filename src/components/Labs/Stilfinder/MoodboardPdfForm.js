"use client";

// Stil-Finder: "Ihr Moodboard als PDF" – e-mail form under the result.
// Only the e-mail address is required. Name, project type and region are
// optional and personalise the PDF. The newsletter wish is a separate,
// unticked checkbox with a Double-Opt-in note. POST /api/labs/stilfinder/moodboard.
// In Labs/dev no mail leaves the machine: the answer carries a link to the
// PDF in the dev outbox.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, FileText, Loader2, RotateCcw } from "lucide-react";
import { planTerminHref } from "@/lib/kuechenplaner/planTermin";
import { resultBase } from "./profiles";
import { blurBackdrop } from "./blurBackdrop";
import { PREVIEW_MATERIALS } from "./materialImages";
import { useStilCopy } from "./StilCopy";
import { fmt, rich } from "./localize";

// Mehrsprachigkeit (01.11.2026): Kapitel, Fehlertexte (daily_cap: …), Labels und
// Optionslisten kommen aus useStilCopy() (src/lib/stilfinder/intl/<locale>.js).
// PDF und E-Mail entstehen weiter auf Deutsch – EN/FR/IT sagen das (pdf.langNote).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Dev/Labs: the mail lands in the dev outbox (7 days), see the feature doc.
const IS_LABS_DEV = process.env.NODE_ENV !== "production";

const field =
  "mt-2 block min-h-12 w-full border border-[#8a8174] bg-white px-4 py-3 text-base text-ink outline-offset-2 placeholder:text-ink-soft focus:border-ink focus-visible:outline-2 focus-visible:outline-ink aria-[invalid=true]:border-[#9b2c2c]";
const labelCls = "block text-sm font-medium text-ink";

export default function MoodboardPdfForm({ profile, code, calendar = false }) {
  const { locale, t: all, projectTypes, regions } = useStilCopy();
  const t = all.pdf;
  const ERRORS = t.errors;
  const CHAPTERS = t.chapters;
  const id = useId();
  const renderedAt = useRef(0);
  const emailRef = useRef(null);
  const doneRef = useRef(null);
  const [state, setState] = useState({ phase: "idle" });
  const [emailError, setEmailError] = useState("");
  const [slow, setSlow] = useState(false);

  // QA P2.1: after 8 s a second status text
  useEffect(() => {
    if (state.phase !== "sending") return undefined;
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [state.phase]);

  useEffect(() => {
    renderedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (state.phase === "done") doneRef.current?.focus();
  }, [state.phase]);

  async function onSubmit(e) {
    e.preventDefault();
    if (state.phase === "sending") return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    if (!email) {
      setEmailError(t.emailMissing);
      emailRef.current?.focus();
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setEmailError(t.emailInvalidExample);
      emailRef.current?.focus();
      return;
    }
    setEmailError("");
    setSlow(false);
    setState({ phase: "sending" });
    try {
      const res = await fetch("/api/labs/stilfinder/moodboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: String(fd.get("name") || "").trim(),
          projekt: String(fd.get("projekt") || ""),
          region: String(fd.get("region") || ""),
          newsletter: fd.get("newsletter") === "on",
          profil: profile.slug,
          code: code || null,
          website: String(fd.get("website") || ""),
          _t: Math.max(1, Math.round(performance.now() - renderedAt.current)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setState({ phase: "done", email, mode: data.mode, preview: data.preview, pages: data.pages });
        return;
      }
      if (data.code === "invalid" && data.field === "email") {
        setEmailError(t.emailInvalid);
        setState({ phase: "idle" });
        emailRef.current?.focus();
        return;
      }
      setState({ phase: "error", message: ERRORS[data.code] || ERRORS.failed });
    } catch {
      setState({ phase: "error", message: ERRORS.network });
    }
  }

  const sending = state.phase === "sending";

  return (
    <section className="border-t border-ink/10 bg-[#f7f5f1] py-16 lg:py-24" aria-labelledby={`${id}-title`}>
      {/* QM r5: grid-cols-1 = minmax(0,1fr) – bei 200 % Text lief das Formular sonst über den Rand (WCAG 1.4.10) */}
      <div className="mx-auto grid max-w-page grid-cols-1 px-gutter gap-12 md:grid-cols-12 md:gap-12">
        {/* Left: what you get */}
        <div className="reveal min-w-0 md:col-span-5">
          <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.eyebrow}</p>
          <h2 id={`${id}-title`} className="font-display mt-3 text-3xl leading-tight sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink/80">{t.text}</p>
          {t.langNote && (
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/75" data-sf-pdf-lang="">
              {t.langNote}
            </p>
          )}

          <PdfPreview profile={profile} />

          <ul className="mt-8 space-y-2.5 text-sm text-ink/85">
            {CHAPTERS.map((c) => (
              <li key={c} className="flex gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-[#2f6b4a]" aria-hidden="true" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: form or confirmation */}
        <div className="min-w-0 md:col-span-7 md:pl-6 lg:pl-10">
          {state.phase === "done" ? (
            <div className="ph-arrive border border-ink/15 bg-white p-6 sm:p-10">
              <p className="text-xs uppercase tracking-[0.14em] text-gold-text">{t.sentEyebrow}</p>
              <h3 ref={doneRef} tabIndex={-1} className="font-display mt-3 scroll-mt-24 text-3xl leading-tight outline-none sm:text-4xl">
                {t.sentTitle}
              </h3>
              {state.mode === "live" ? (
                <p className="mt-4 text-base leading-relaxed text-ink/85">
                  {rich(t.sentLive, { email: <strong key="email" className="font-medium">{state.email}</strong> }, { name: profile.name })}
                </p>
              ) : (
                <>
                  <p className="mt-4 text-base leading-relaxed text-ink/85">
                    {fmt(t.ready, { name: profile.name, pages: state.pages || t.pagesFallback })}
                  </p>
                  <p className="mt-4 border-l-2 border-[#8a5a00] bg-[#faf8f4] p-4 text-sm leading-relaxed text-ink/85" role="note">
                    <strong className="font-medium">{t.testLabel}</strong> {fmt(t.testText, { email: state.email })}
                  </p>
                  {state.preview && (
                    <a
                      href={state.preview}
                      target="_blank"
                      rel="noopener"
                      className="ph-press mt-6 inline-flex min-h-12 items-center gap-2 bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1f252b]"
                    >
                      <FileText className="size-4" aria-hidden="true" /> {t.viewPdf}
                      <span className="sr-only">{t.newTab}</span>
                    </a>
                  )}
                </>
              )}
              <div className="mt-8 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:items-center">
                <Link
                  href={planTerminHref({
                    locale,
                    calendar,
                    planer: "stil-finder",
                    stil: profile.slug,
                    produkt: fmt(all.result.terminProdukt, { name: profile.name }),
                    plan: `${resultBase(locale)}/ergebnis/${profile.slug}${code ? `?a=${encodeURIComponent(code)}` : ""}`,
                  })}
                  className="inline-flex min-h-12 items-center gap-2 text-sm font-medium underline underline-offset-4"
                >
                  {t.chooseTermin} <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => setState({ phase: "idle" })}
                  className="inline-flex min-h-12 items-center gap-2 text-sm text-ink/80 underline underline-offset-4 sm:ml-auto"
                >
                  <RotateCcw className="size-4" aria-hidden="true" /> {t.another}
                </button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} aria-busy={sending} className="border border-ink/15 bg-white p-6 sm:p-10">
              <p className="text-sm text-ink/80">
                {rich(t.required, { star: <span key="star" aria-hidden="true">(*)</span> })}
              </p>

              <div className="mt-6">
                <label htmlFor={`${id}-email`} className={labelCls}>
                  {t.email} <span aria-hidden="true">*</span>
                </label>
                <input
                  ref={emailRef}
                  id={`${id}-email`}
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={emailError ? "true" : "false"}
                  aria-describedby={emailError ? `${id}-email-err` : undefined}
                  maxLength={254}
                  className={field}
                  onInput={() => emailError && setEmailError("")}
                />
                {emailError && (
                  <p id={`${id}-email-err`} className="mt-2 text-sm text-[#9b2c2c]">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label htmlFor={`${id}-name`} className={labelCls}>
                  {t.name} <span className="font-normal text-ink/75">{t.nameHint}</span>
                </label>
                <input id={`${id}-name`} name="name" type="text" autoComplete="name" maxLength={80} className={field} />
              </div>

              <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-5">
                <div className="relative">
                  <label htmlFor={`${id}-projekt`} className={labelCls}>
                    {t.projekt} <span className="font-normal text-ink/75">{t.optional}</span>
                  </label>
                  <select id={`${id}-projekt`} name="projekt" defaultValue="" className={`${field} appearance-none pr-11`}>
                    <option value="">{t.choose}</option>
                    {projectTypes.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute bottom-[17px] right-4 size-4 text-ink" aria-hidden="true" />
                </div>
                <div className="relative">
                  <label htmlFor={`${id}-region`} className={labelCls}>
                    {t.region} <span className="font-normal text-ink/75">{t.optional}</span>
                  </label>
                  <select id={`${id}-region`} name="region" defaultValue="" className={`${field} appearance-none pr-11`}>
                    <option value="">{t.choose}</option>
                    {regions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute bottom-[17px] right-4 size-4 text-ink" aria-hidden="true" />
                </div>
              </div>

              {/* Honeypot: hidden from people and assistive technology */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor={`${id}-website`}>Website</label>
                <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <p id={`${id}-consent`} className="mt-6 text-sm leading-relaxed text-ink/80">
                {t.consent}
                {IS_LABS_DEV ? t.consentDev : ""}{" "}
                <Link href={`/${locale}/datenschutz`} className="underline underline-offset-2">
                  {t.privacyLink}
                </Link>
              </p>

              <div className="mt-5 border-t border-ink/10 pt-5">
                <div className="flex gap-3">
                  <input
                    id={`${id}-newsletter`}
                    name="newsletter"
                    type="checkbox"
                    className="mt-0.5 size-6 shrink-0 accent-[#30373e]"
                    aria-describedby={`${id}-newsletter-hint`}
                  />
                  <label htmlFor={`${id}-newsletter`} className="text-sm leading-relaxed text-ink">
                    {t.newsletter}
                  </label>
                </div>
                <p id={`${id}-newsletter-hint`} className="mt-2 pl-9 text-xs leading-relaxed text-ink/75">
                  {t.newsletterHint}
                </p>
              </div>

              <button
                type="submit"
                disabled={sending}
                aria-describedby={`${id}-consent`}
                className="ph-press mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1f252b] disabled:cursor-wait disabled:opacity-80 sm:w-auto"
              >
                {sending ? (
                  <>
                    <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" /> {t.sending}
                  </>
                ) : (
                  <>
                    <FileText className="size-4" aria-hidden="true" /> {t.submit}
                  </>
                )}
              </button>

              <p className="mt-4 min-h-5 text-sm" role="status" aria-live="polite">
                {sending ? (slow ? t.statusSlow : t.status) : ""}
              </p>
              {state.phase === "error" && (
                <p className="mt-1 border-l-2 border-[#9b2c2c] pl-3 text-sm text-[#9b2c2c]" role="alert">
                  {state.message}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// Preview of the PDF's showpiece (QA Runde 1, P1.2): the moodboard spread –
// collage with the profile photo and material photos on the left page,
// keywords, quote and the palette as circles on the right page.
function PdfPreview({ profile }) {
  const { t: all } = useStilCopy();
  const t = all.pdf;
  const mats = PREVIEW_MATERIALS[profile.key] || [];
  const tile = "relative overflow-hidden bg-[#ece8e1]";
  return (
    <figure className="mt-10 max-w-md" aria-label={fmt(t.previewAria, { name: profile.name })}>
      <div className="grid aspect-[2.828] grid-cols-2 border border-ink/10 bg-[#faf8f4] shadow-[0_12px_40px_rgba(31,37,43,0.14)]" aria-hidden="true">
        {/* left page: bleed collage */}
        <div className="grid grid-cols-[1.85fr_1fr_1fr] gap-px">
          <div className={tile}>
            <Image src={profile.hero.img} alt="" fill sizes="240px" style={blurBackdrop(profile.hero.img)} className="object-cover" />
          </div>
          <div className="grid grid-rows-[1.1fr_1fr] gap-px">
            {mats.slice(0, 2).map((m, i) => (
              <div key={i} className={tile}>
                <Image src={m} alt="" fill sizes="128px" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="grid grid-rows-[1fr_1.3fr] gap-px">
            <div className={tile}>{mats[2] && <Image src={mats[2]} alt="" fill sizes="128px" className="object-cover" />}</div>
            <div style={{ backgroundColor: profile.palette[1].hex }} />
          </div>
        </div>
        {/* right page: keywords, quote, palette circles */}
        <div className="flex flex-col justify-center gap-1.5 border-l border-ink/10 px-3 sm:px-4">
          <span className="text-[6px] uppercase tracking-[0.14em] text-gold-text sm:text-[7px]">{t.previewTag}</span>
          {profile.keywords.slice(0, 3).map((k) => (
            <span key={k} className="font-display text-[11px] italic leading-none sm:text-sm">
              {k}
            </span>
          ))}
          <span className="mt-1 flex gap-1">
            {profile.palette.map((c) => (
              <span key={c.hex} className="size-2.5 rounded-full border border-ink/10 sm:size-3" style={{ backgroundColor: c.hex }} />
            ))}
          </span>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-ink/75">{t.previewCaption}</figcaption>
    </figure>
  );
}
