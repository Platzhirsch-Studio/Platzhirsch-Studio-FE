"use client";
// Online-Termin in vier Schritten: 1 Terminart, 2 Tag + Uhrzeit, 3 Kontakt,
// 4 „Bitte E-Mail bestätigen“ (Double-Opt-in: Die Uhrzeit ist 30 Minuten
// vorgemerkt, fest wird der Termin erst über den Link in der Mail,
// /[locale]/termin/bestaetigen). Die volle Adresse steht vor dem Absenden und
// auf der Bestätigung, damit ein Tippfehler auffällt („Korrigieren“ schickt
// mit demselben Schlüssel neu, die Uhrzeit bleibt).
// Ein Schritt je Ansicht, Fokus auf die Schrittüberschrift nach jedem Wechsel,
// Fehler am Feld + Zusammenfassung (WCAG 3.3.1/3.3.3), kein Auto-Weiter.
// Sendet an POST /api/termin/book (Herkunft, Rate-Limit, Honeypot, zod,
// Doppelbuchungsschutz serverseitig). Texte als Props (src/lib/booking/copy.js),
// nichts von FRAPPE_BOOKING_* erreicht den Client.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { domChoice } from "@/components/Forms/domChoice";
import { CalendarCheck, Coffee, House, PencilRuler, Video } from "lucide-react";
import Button from "@/components/ui/Button";
import cx from "@/components/ui/cx";
import { kernDisplay } from "@/components/ui/Kern";
import { FieldError, FormField, Honeypot } from "@/components/Forms";
import { UploadHandoff, handoffAfterSend, prefetchHandoff } from "@/components/Forms/lazyHandoff";
import { fill, formatDate, formatTime } from "@/lib/booking/format";
import { TERMINARTEN } from "@/lib/booking/types";
import { EMAIL_RE, PHONE_RE } from "@/lib/booking/patterns";
import { WIDERRUF_PATH, widerrufHinweis } from "@/lib/legal/widerruf";
import SlotPicker from "./SlotPicker";
import { ConfirmedView, Facts } from "./parts";
import { revealConfirmation } from "@/lib/forms/reveal";

const ICONS = { studio: Coffee, video: Video, vor_ort: House, planung: PencilRuler };
const STEPS = ["art", "zeit", "daten", "fertig"];

function newIdem() {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
}

// Design-Jury P2-17: the step bar names each step in one word (copy.stepsShort,
// termin.stepsShort in src/messages, übernommen 30.10.2026); the H2 right
// below asks the question (before, both said "Wie möchten Sie uns treffen?").

export default function BookingWizard({ locale, copy, phone, initial = {}, test = false, uploads = false }) {
  const c = copy;
  const id = useId();
  const [step, setStep] = useState(0);
  const [art, setArt] = useState(initial.art || null);
  const [thema, setThema] = useState(initial.thema || null);
  const [modus, setModus] = useState(initial.modus || null);
  const [slot, setSlot] = useState(null);
  const [f, setF] = useState({ vorname: "", nachname: "", email: "", telefon: "", plzOrt: "", anliegen: initial.anliegen || "", consent: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const heading = useRef(null);
  const summary = useRef(null);
  const started = useRef(0);
  const idem = useRef("");
  const formRef = useRef(null);
  const shownStep = useRef(0);

  useEffect(() => {
    started.current = Date.now();
    idem.current = newIdem();
  }, []);

  // Fokus nur bei echtem Schrittwechsel (nicht beim Laden, auch nicht im Strict-Mode-Doppellauf).
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    // Rat 9,5 A3 (UX2): the step heading – above all the confirmation – comes
    // into view (iPhone: top >= 0), focus without a jump.
    revealConfirmation(heading.current);
  }, [step]);

  const t = art ? TERMINARTEN[art] : null;
  const effModus = art === "planung" ? modus : t?.modus || null;
  const isVideo = effModus === "video";
  const isVorOrt = effModus === "vor_ort";
  const anfrage = t?.bestaetigung === "anfrage";
  // Rat 9,5 B2: plan / Ideenboard lines (server-checked, initial.attach) go
  // below the visitor's text; the 1000 characters of "anliegen" (Frappe spec)
  // hold both, so the visitor's part gets what is left. A plan link too long
  // for that stays out (the page offers „Lieber schreiben“ with the link).
  const attachText = useMemo(() => {
    const lines = Array.isArray(initial.attach) ? initial.attach : [];
    const fit = [];
    for (const l of lines) if ([...fit, l].join("\n").length <= 600) fit.push(l);
    return fit.join("\n");
  }, [initial.attach]);
  const anliegenMax = attachText ? 1000 - attachText.length - 2 : 1000;

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  function go(n) {
    setErrors({});
    setFormError(null);
    setStep(n);
  }

  function validateArt(v = { art, thema, modus }) {
    const e = {};
    if (!v.art) e.art = c.errors.art;
    if (v.art === "planung") {
      if (!v.thema) e.thema = c.errors.thema;
      if (!v.modus) e.modus = c.errors.modus;
    }
    return e;
  }

  // QM r3 (iPhone, 1 of 10 runs): a choice tapped before hydration is checked in
  // the DOM only – adopt it on mount and when "Weiter" finds the state empty.
  function adoptDom() {
    const v = {
      art: art || domChoice("art", (x) => Boolean(TERMINARTEN[x])),
      thema: thema || domChoice("thema", (x) => TERMINARTEN.planung.themen.includes(x)),
      modus: modus || domChoice("modus", (x) => TERMINARTEN.planung.modi.includes(x)),
    };
    if (v.art !== art) setArt(v.art);
    if (v.thema !== thema) setThema(v.thema);
    if (v.modus !== modus) setModus(v.modus);
    return v;
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the DOM once after hydration
    adoptDom();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once after hydration
  }, []);

  function validateDaten() {
    const e = {};
    if (!f.vorname.trim()) e.vorname = c.errors.vorname;
    if (!f.nachname.trim()) e.nachname = c.errors.nachname;
    if (!EMAIL_RE.test(f.email.trim())) e.email = c.errors.email;
    if (f.telefon.trim() && !PHONE_RE.test(f.telefon.trim())) e.telefon = c.errors.telefon;
    if (isVorOrt && !f.telefon.trim()) e.telefon = c.errors.telefon;
    if (isVorOrt && f.plzOrt.trim().length < 3) e.plzOrt = c.errors.plzOrt;
    if (f.anliegen.length > anliegenMax) e.anliegen = c.errors.anliegen;
    if (isVideo && !f.consent) e.consent = c.errors.consent;
    return e;
  }

  function showErrors(e) {
    setErrors(e);
    requestAnimationFrame(() => summary.current?.focus());
  }

  function next() {
    if (step === 0) {
      const e = validateArt(adoptDom());
      if (Object.keys(e).length) return showErrors(e);
      setSlot(null);
      return go(1);
    }
    if (step === 1) {
      if (!slot) return showErrors({ slot: c.errors.slot });
      prefetchHandoff(locale);
      return go(2);
    }
  }

  async function submit(ev) {
    ev.preventDefault();
    if (sending) return;
    const e = validateDaten();
    if (Object.keys(e).length) return showErrors(e);
    setSending(true);
    setFormError(null);
    const website = formRef.current?.elements?.namedItem("website")?.value || "";
    const payload = {
      art,
      ...(art === "planung" ? { thema, modus } : {}),
      start: slot.start,
      vorname: f.vorname.trim(),
      nachname: f.nachname.trim(),
      email: f.email.trim(),
      telefon: f.telefon.trim(),
      plzOrt: isVorOrt ? f.plzOrt.trim() : "",
      anliegen: attachText ? [f.anliegen.trim(), attachText].filter(Boolean).join("\n\n") : f.anliegen,
      einwilligungVideo: isVideo ? f.consent : false,
      locale,
      website,
      t: Date.now() - started.current,
      idem: idem.current,
    };
    let status = 0;
    let body = {};
    try {
      const res = await fetch("/api/termin/book", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    setSending(false);
    if (status === 200 && body.ok) {
      setResult(body);
      go(3);
      handoffAfterSend("beratung", { email: payload.email, result: body, locale }).then(setHandoff);
      return;
    }
    if (body.code === "slot_taken" || body.code === "outside_window") {
      setSlot(null);
      idem.current = newIdem();
      setStep(1);
      setErrors({ slot: c.errors[body.code] });
      return;
    }
    if (body.code === "invalid" && body.fields) {
      const mapped = Object.fromEntries(Object.keys(body.fields).map((k) => [k, c.errors[k] || c.errors.generic]));
      return showErrors(mapped);
    }
    setFormError(fill(c.errors[body.code] || c.errors.generic, { phone }));
    requestAnimationFrame(() => summary.current?.focus());
  }

  const errorList = Object.entries(errors).filter(([, v]) => v);
  const fieldTarget = { art: `${id}-art-0`, thema: `${id}-thema-0`, modus: `${id}-modus-0`, slot: null, consent: `${id}-consent` };

  const artOptions = useMemo(() => Object.keys(TERMINARTEN), []);

  return (
    <div className="mt-6 sm:mt-8 md:mt-12" data-termin-step={STEPS[step]} data-termin-test={test ? "1" : undefined}>
      {/* Fortschritt: Text für alle, Liste nur zur Orientierung */}
      <ol className="flex flex-wrap gap-x-3 gap-y-2 border-b border-line pb-3 text-small sm:gap-x-6 sm:pb-4" aria-label={fill(c.stepOf, { n: step + 1, total: STEPS.length })}>
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={cx("flex items-center gap-2", i === step ? "text-text" : "text-text-soft")}>
            <span aria-hidden="true" className={cx("inline-flex size-6 items-center justify-center border tabular transition-colors duration-(--duration-ui) ease-quiet", i === step ? "border-ink bg-action text-paper" : i < step ? "border-ink" : "border-line-control")}>
              {i + 1}
            </span>
            {/* Handy: auch der aktuelle Schritt nur als Zahl – die H2 darunter nennt ihn (eine Zeile, kein Umbruch).
                Design-Jury P2-17: Kurzwort statt der Frage, die die H2 direkt darunter stellt. */}
            <span className="max-sm:sr-only">{c.stepsShort[s]}</span>
          </li>
        ))}
      </ol>

      {/* Handy: „Schritt n von 4“ steht schon in der Schrittleiste (aria-label) – ausgeblendet, damit die erste Terminart im ersten Bildschirm anschneidet. */}
      <p className="mt-8 text-overline uppercase text-text-accent max-sm:hidden">{fill(c.stepOf, { n: step + 1, total: STEPS.length })}</p>
      <h2 ref={heading} tabIndex={-1} className="mt-3 scroll-mt-16 sm:mt-2 sm:scroll-mt-28 font-display text-display-m text-text text-balance focus:outline-none">
        {kernDisplay(step === 3 ? (result?.pending ? c.done.pending : result?.booking?.status === "angefragt" ? c.done.requested : c.done.booked) : c.steps[STEPS[step]])}
      </h2>

      {(errorList.length > 0 || formError) && step < 3 && (
        <div ref={summary} tabIndex={-1} role="alert" data-termin-errors className="mt-6 border-l-2 border-error pl-4 focus:outline-none">
          {formError ? (
            <p className="text-body text-error">{formError}</p>
          ) : (
            <>
              <p className="text-body text-error">{errorList.length === 1 ? c.errors.summaryOne : fill(c.errors.summary, { n: errorList.length })}</p>
              <ul className="mt-2 grid list-disc gap-1 pl-5 text-small text-text">
                {errorList.map(([k, v]) => (
                  <li key={k}>
                    {fieldTarget[k] === null ? (
                      v
                    ) : (
                      <a href={`#${fieldTarget[k] || `${id}-${k}`}`} className="inline-flex min-h-6 items-center py-0.5 underline underline-offset-2" onClick={(e) => { e.preventDefault(); document.getElementById(fieldTarget[k] || `${id}-${k}`)?.focus(); }}>
                        {v}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------- 1 Terminart */}
      {step === 0 && (
        <div className="mt-4 sm:mt-8">
          {/* QM r2 (200 % text): one minmax column, two only when the fieldset is 40rem
              wide (container query) – the implicit auto column ran 190 px off screen. */}
          <fieldset className="@container min-w-0 wrap-break-word" aria-describedby={errors.art ? `${id}-art-error` : undefined}>
            <legend className="sr-only">{c.steps.art}</legend>
            <div className="grid grid-cols-1 gap-3 @min-[40rem]:grid-cols-2">
              {artOptions.map((key, i) => {
                const Icon = ICONS[key];
                const a = c.arten[key];
                const def = TERMINARTEN[key];
                return (
                  <label
                    key={key}
                    className={cx(
                      "flex cursor-pointer gap-4 bg-surface p-5 transition-colors duration-(--duration-micro)",
                      errors.art ? "border-2 border-error" : "border border-line-control hover:border-ink has-checked:border-2 has-checked:border-ink has-checked:bg-surface-raised has-checked:p-[19px]"
                    )}
                  >
                    <input id={`${id}-art-${i}`} type="radio" name="art" value={key} checked={art === key} onChange={() => { setArt(key); setErrors({}); }} className="ph-radio mt-1 flex-none" />
                    <span className="min-w-0">
                      {/* QM r2: icon on the first title line, also when the title wraps. */}
                      <span className="flex items-start gap-2 text-title text-text text-balance">
                        <Icon aria-hidden="true" className="mt-[0.2em] size-5 flex-none text-text-soft" strokeWidth={1.5} />
                        {a.title}
                      </span>
                      <span className="mt-1 block text-body text-text-soft text-pretty">{a.text}</span>
                      <span className="mt-2 block text-small text-text-soft tabular">
                        {fill(c.minutes, { n: def.dauer })}
                        {def.bestaetigung === "anfrage" ? ` · ${c.anfrage}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <FieldError id={`${id}-art-error`}>{errors.art}</FieldError>
          </fieldset>
          {/* Kern-USP unter den Karten statt im Seitenkopf: so schneidet die erste Karte im ersten Bildschirm an (QA UX P2-1). */}
          <p className="mt-6 max-w-measure border-l-2 border-line-strong pl-4 text-body text-text">{c.usp}</p>
          {/* Yacht team: "Besichtigung an Bord" = Terminart "Bei Ihnen vor Ort" (termin/page.js, lib/forms/topicHints.js). */}
          {initial.topicNote && (
            <p className="mt-3 max-w-measure pl-4 text-small text-text-soft" data-termin-topic-note="">
              {initial.topicNote}
            </p>
          )}

          {art === "planung" && (
            // Motion: the planning choices settle in after "Planung" is picked (ph-arrive, opacity only).
            <div className="ph-arrive mt-8 grid gap-8">
              <ChipGroup id={`${id}-thema`} name="thema" legend={c.thema.legend} value={thema} onChange={(v) => { setThema(v); setErrors((x) => ({ ...x, thema: undefined })); }} error={errors.thema} options={TERMINARTEN.planung.themen.map((k) => ({ value: k, label: c.thema.options[k] }))} />
              <ChipGroup id={`${id}-modus`} name="modus" legend={c.modus.legend} value={modus} onChange={(v) => { setModus(v); setErrors((x) => ({ ...x, modus: undefined })); }} error={errors.modus} options={TERMINARTEN.planung.modi.map((k) => ({ value: k, label: c.modus[k] }))} />
            </div>
          )}

          {/* QM r3: on phones the primary button is full width, like in the Beratung wizard. */}
          <div className="mt-10">
            <Button type="button" onClick={next} arrow className="max-sm:w-full">
              {c.actions.next}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- 2 Tag + Zeit */}
      {/* Motion: steps 2 and 3 settle in from 0.6 opacity when reached (ph-arrive, @starting-style; instant when calm). */}
      {step === 1 && art && (
        <div className="ph-arrive mt-6">
          <Choice copy={c} art={art} thema={thema} modus={modus} onChange={() => go(0)} />
          <SlotPicker
            art={art}
            modus={modus}
            locale={locale}
            copy={c}
            value={slot}
            phone={phone}
            error={errors.slot}
            onChange={(s) => {
              // Andere Uhrzeit = neue Buchung (eine vorgemerkte bleibt bis zum Ablauf stehen).
              if (s && slot && s.start !== slot.start) idem.current = newIdem();
              setSlot(s);
              if (s) setErrors({});
            }}
          />
          <div className="mt-10 flex flex-wrap gap-3 max-sm:flex-col max-sm:items-stretch">
            <Button type="button" onClick={next} arrow className="max-sm:w-full">
              {c.actions.next}
            </Button>
            <Button type="button" variant="ghost" className="max-sm:self-start max-[420px]:px-0!" onClick={() => go(0)}>
              {c.actions.back}
            </Button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- 3 Kontakt */}
      {step === 2 && slot && (
        <form ref={formRef} noValidate onSubmit={submit} className="ph-arrive relative mt-6" aria-describedby={`${id}-privacy`}>
          <Choice copy={c} art={art} thema={thema} modus={modus} slot={slot} locale={locale} onChange={() => go(0)} onChangeTime={() => go(1)} />
          <Honeypot id={`${id}-website`} />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <FormField id={`${id}-vorname`} label={c.daten.vorname} required autoComplete="given-name" value={f.vorname} onChange={set("vorname")} error={errors.vorname} maxLength={60} />
            <FormField id={`${id}-nachname`} label={c.daten.nachname} required autoComplete="family-name" value={f.nachname} onChange={set("nachname")} error={errors.nachname} maxLength={80} />
            <FormField id={`${id}-email`} label={c.daten.email} required type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} hint={c.daten.emailHint} maxLength={254} />
            <FormField
              id={`${id}-telefon`}
              label={c.daten.telefon}
              required={isVorOrt}
              optionalText={c.daten.optional}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={f.telefon}
              onChange={set("telefon")}
              error={errors.telefon}
              hint={isVorOrt ? c.daten.telefonHintVorOrt : isVideo ? c.daten.telefonHintVideo : undefined}
              maxLength={40}
            />
            {isVorOrt && (
              <FormField id={`${id}-plzOrt`} label={c.daten.plzOrt} required autoComplete="postal-code" value={f.plzOrt} onChange={set("plzOrt")} error={errors.plzOrt} hint={c.daten.plzOrtHint} maxLength={80} className="md:col-span-2" />
            )}
            <FormField
              id={`${id}-anliegen`}
              as="textarea"
              label={c.daten.anliegen}
              optionalText={c.daten.optional}
              value={f.anliegen}
              onChange={set("anliegen")}
              error={errors.anliegen}
              hint={initial.anliegenHint || c.daten.anliegenHint}
              maxLength={1000}
              className="md:col-span-2"
            />
          </div>

          {/* Handy-Upload nur versprechen, wenn er angenommen wird (QA UX P2-2). */}
          <p className="mt-4 text-small text-text-soft">{uploads ? c.daten.upload : c.daten.uploadOff}</p>

          {isVideo && (
            <fieldset className="mt-8 min-w-0 border-t border-line pt-6">
              <legend className="sr-only">{c.daten.consentLegend}</legend>
              <p aria-hidden="true" className="text-ui text-text">{c.daten.consentLegend}</p>
              <label htmlFor={`${id}-consent`} className={cx("mt-3 flex cursor-pointer items-start gap-3 p-4", errors.consent ? "border-2 border-error" : "border border-line-control")}>
                <input
                  id={`${id}-consent`}
                  type="checkbox"
                  checked={f.consent}
                  onChange={set("consent")}
                  required
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={[`${id}-consent-hint`, errors.consent ? `${id}-consent-error` : null].filter(Boolean).join(" ")}
                  className="mt-0.5 size-5 flex-none accent-ink"
                />
                <span className="text-body text-text">
                  {c.daten.consent}
                  <span aria-hidden="true"> *</span>
                </span>
              </label>
              <p id={`${id}-consent-hint`} className="mt-2 text-small text-text-soft">
                {c.daten.consentHint}
              </p>
              <FieldError id={`${id}-consent-error`}>{errors.consent}</FieldError>
            </fieldset>
          )}

          <p id={`${id}-privacy`} className="mt-8 text-small text-text-soft">
            {c.daten.privacy}{" "}
            <a href={`/${locale}/datenschutz`} className="underline underline-offset-2">
              {c.daten.privacyLink}
            </a>
          </p>
          {/* Inhaber 03.11.2026: Hinweis auf die Widerrufsbelehrung (FAGG) – nur ein Satz mit Link, der Ablauf bleibt gleich. */}
          <p className="mt-2 text-small text-text-soft" data-termin-widerruf>
            {widerrufHinweis(locale).text}{" "}
            <a href={`/${locale}${WIDERRUF_PATH}`} className="underline underline-offset-2">
              {widerrufHinweis(locale).link}
            </a>
          </p>

          {EMAIL_RE.test(f.email.trim()) && (
            <p className="mt-6 text-body text-text" data-termin-email-preview>
              {fill(c.daten.emailConfirm, { email: "" })}
              <strong className="font-medium wrap-break-word">{f.email.trim()}</strong>
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3 max-sm:flex-col max-sm:items-stretch">
            <Button type="submit" disabled={sending} aria-disabled={sending || undefined} className="max-sm:w-full">
              {sending ? c.actions.sending : anfrage ? c.actions.request : c.actions.book}
            </Button>
            <Button type="button" variant="ghost" className="max-sm:self-start max-[420px]:px-0!" onClick={() => go(1)} disabled={sending}>
              {c.actions.back}
            </Button>
          </div>
        </form>
      )}

      {/* ---------------------------------------------------------- 4 Fertig */}
      {step === 3 && result && (
        <Done copy={c} locale={locale} phone={phone} email={f.email.trim()} result={result} handoff={handoff} onHandoffClose={() => setHandoff(null)} onFix={() => go(2)} />
      )}
    </div>
  );
}

function ChipGroup({ id, name, legend, options, value, onChange, error }) {
  return (
    <fieldset className="min-w-0" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-ui text-text">
        {legend}
        <span aria-hidden="true"> *</span>
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label
            key={o.value}
            className={cx(
              "inline-flex min-h-12 cursor-pointer items-center gap-2 bg-surface px-4 text-ui text-text",
              error ? "border-2 border-error" : "border border-line-control hover:border-ink has-checked:border-ink has-checked:bg-surface-raised"
            )}
          >
            <input id={`${id}-${i}`} type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="ph-radio flex-none" />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </fieldset>
  );
}

/** Bisherige Auswahl mit „Ändern“ (Schritt 2 und 3). */
function Choice({ copy: c, art, thema, modus, slot, locale, onChange, onChangeTime }) {
  const parts = [c.arten[art].title, art === "planung" && thema ? c.thema.options[thema] : null, art === "planung" && modus ? c.modus[modus] : null].filter(Boolean);
  return (
    // QM content-legal r3 (200 % text): one word per line next to a half-width
    // „Ändern“ column – below 18 rem (container query, rem = text size) every row
    // stacks: value, then „Ändern“ underneath; the calendar icon stays with the date.
    <div className="@container border border-line bg-surface-raised p-4">
      <p className="text-small text-text-soft">{c.daten.summary}</p>
      {/* QM r2: beide „Ändern“ stehen rechts in derselben Spalte (vorher brach das
          zweite unter das Datum um). */}
      <div className="mt-1 grid grid-cols-1 items-baseline gap-x-4 @min-[18rem]:grid-cols-[minmax(0,1fr)_auto]">
        <p className="text-ui text-text">{parts.join(" · ")}</p>
        <button type="button" onClick={onChange} className="min-h-11 justify-self-start text-small underline underline-offset-4 @min-[18rem]:justify-self-auto">
          {c.daten.change}
          <span className="sr-only">: {c.steps.art}</span>
        </button>
      </div>
      {slot && (
        <div className="grid grid-cols-1 items-baseline gap-x-4 @min-[18rem]:grid-cols-[minmax(0,1fr)_auto]">
          <p className="flex items-baseline gap-2 text-ui text-text tabular">
            <CalendarCheck aria-hidden="true" className="size-4 flex-none translate-y-[2px] self-start text-text-soft" strokeWidth={1.5} />
            <span className="min-w-0">
              {/* „3. / November“ never splits (no-break space after the day). */}
              {formatDate(slot.start, locale).replace(/(\d{1,2}\.) /u, "$1 ")}, {formatTime(slot.start, locale)}
            </span>
          </p>
          <button type="button" onClick={onChangeTime} className="min-h-11 justify-self-start text-small underline underline-offset-4 @min-[18rem]:justify-self-auto">
            {c.daten.change}
            <span className="sr-only">: {c.steps.zeit}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Done({ copy: c, locale, phone, email, result, handoff, onHandoffClose, onFix }) {
  const b = result.booking;
  const upload = handoff ? (
    <div className="mt-10">
      <UploadHandoff {...handoff} onClose={onHandoffClose} />
    </div>
  ) : null;
  if (!result.pending) {
    return (
      <ConfirmedView copy={c} locale={locale} booking={b} manageUrl={result.manageUrl}>
        {upload}
      </ConfirmedView>
    );
  }
  const requested = b.art === "vor_ort";
  return (
    <div className="mt-6" data-termin-ref={b.ref} data-termin-pending>
      <p role="status" className="max-w-measure text-lead text-text">
        {fill(requested ? c.done.pendingTextRequest : c.done.pendingText, { email: "\u0000" })
          .split("\u0000")
          .flatMap((part, i) => (i ? [<strong key={i} className="font-medium wrap-break-word" data-termin-email>{email}</strong>, part] : [part]))}
      </p>
      <p className="mt-3">
        <button type="button" onClick={onFix} className="inline-flex min-h-11 items-center text-ui underline underline-offset-4" data-termin-fix>
          {c.done.pendingFix}
        </button>
      </p>
      {result.devConfirmUrl && (
        <p className="mt-4 border-l-2 border-notice pl-4 text-small text-text">
          <a href={result.devConfirmUrl} className="inline-flex min-h-11 items-center underline underline-offset-2" data-termin-devconfirm>
            {c.done.devConfirm}
          </a>
        </p>
      )}
      <Facts copy={c} booking={b} locale={locale} />
      <p className="mt-6 max-w-measure text-small text-text-soft">{fill(c.done.pendingNoMail, { phone })}</p>
      {b.modus !== "video" && <p className="mt-8 max-w-measure border-l-2 border-line-strong pl-4 text-body text-text">{c.done.usp}</p>}
      {upload}
    </div>
  );
}
