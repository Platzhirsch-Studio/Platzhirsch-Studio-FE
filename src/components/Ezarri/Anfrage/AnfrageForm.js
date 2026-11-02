"use client";
// src/components/Ezarri/Anfrage/AnfrageForm.js – „Muster, Beratung, Angebot“ (Team C).
// Gemeinsam genutzt von der Anfrage-Seite, dem Konfigurator (Team B) und dem
// Katalog (Team A). Sendet an /api/ezarri/anfrage (heute Dry-Run, siehe
// src/app/api/ezarri/anfrage/versand.js). Formular-Vertrag wie alle Lead-
// Formulare: Honeypot `website`, `_t`, Fehler am Feld + Zusammenfassung,
// Bestätigung inline mit Fokus.
//
// PROPS (alle optional):
//   art          "muster" | "beratung" | "angebot"         Vorauswahl
//   referenzen   Array<{id, code, name}>                    Chips (max. 6), Server: getReferenceChips()
//   m2           number                                     Fläche (Rechner/Konfigurator)
//   projektart   "pool" | "wellness" | "bad" | "kueche" | "fassade" | "anderes"
//   k            string   Konfig-Zustand (Team B), wird mitgesendet
//   m            string   Custom-Mix-Mischung "37-70.38-30", wird mitgesendet
//   rechner      string   Query des Rechners, wird mitgesendet (der Server rechnet die Mengen nach)
//   fuge         string   Fugen-ID der Mischung ("1" … "7"), wird mitgesendet
//   format       "25" | "50" | "hexa"   Format der Mischung/des Rechners, wird mitgesendet
//   zubehoer     {kleber?, fuge?, werkzeug?, corner?, cove?}  Vorbelegung „Zubehör mit anbieten“ (nur Angebot)
//   quelle       "katalog" | "konfigurator" | "rechner" | "custom-mix" | "anfrage"
//   kontext      Array<string>  Zeilen, die über dem Formular als Zusammenfassung stehen
//   headingLevel 2 | 3     Ebene der Abschnittstitel (eingebettet in Sheet/Dialog: 3)
//   idPrefix     string   für mehrere Formulare auf einer Seite (Standard "ez-anfrage")
//   endpoint     string   Standard "/api/ezarri/anfrage" (Tests)
//   musterLink   string   Link „Mosaike ansehen“, wenn keine Referenz gewählt ist
//   onSuccess    (result) => void
import { useId, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from "@/lib/site";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import LinkArrow from "@/components/ui/LinkArrow";
import cx from "@/components/ui/cx";
import { FieldError, FormAlert, FormField, FormPrivacyNote, FormSuccess, Honeypot, describedBy, useFormGuard, useHydrated } from "@/components/Forms";
import { postForm } from "@/lib/forms/client";
import { scrollVerhalten } from "@/lib/ezarri/motion";
import { trackLead } from "@/lib/analytics";
import { ANFRAGE as ANFRAGE_DE } from "@/lib/ezarri/rechner/copy";
import { ANFRAGE as ANFRAGE_EN } from "@/lib/ezarri/rechner/copy.en";
import { OPTION_EN, fehlerEn, meldungEn } from "@/lib/ezarri/rechner/anfrage-en";
import { ARTEN, FELD_REIHENFOLGE, LAENDER, PROFILE, PROJEKTARTEN, ZEITRAEUME, ZUBEHOER, MAX_REFS, pruefeAnfrage } from "@/app/api/ezarri/anfrage/schema";


export default function AnfrageForm({
  art: artStart = "muster",
  referenzen: refsStart = [],
  m2: m2Start,
  projektart: projektStart,
  k,
  m,
  rechner,
  fuge,
  format,
  zubehoer: zubehoerStart,
  quelle = "anfrage",
  kontext = [],
  headingLevel = 2,
  idPrefix = "ez-anfrage",
  endpoint = "/api/ezarri/anfrage",
  musterLink = "/ezarri/mosaike",
  onSuccess,
}) {
  // Welle 2 (Englisch): Texte, Optionsnamen und Meldungen je Sprache; gesendet werden dieselben Werte.
  const en = useLocale() === "en";
  const C = en ? ANFRAGE_EN : ANFRAGE_DE;
  const lbl = (list, value, label) => (en ? OPTION_EN[list]?.[value] ?? label : label);
  const pruefe = (p) => {
    const r = pruefeAnfrage(p);
    return en && !r.ok ? { ...r, fehler: fehlerEn(r.fehler) } : r;
  };
  const uid = useId();
  const id = (name) => `${idPrefix}-${name}`;
  const hydrated = useHydrated();
  const guard = useFormGuard();
  const formRef = useRef(null);
  const successRef = useRef(null);
  const [werte, setWerte] = useState(() => ({
    art: ARTEN.some((a) => a.value === artStart) ? artStart : "muster",
    m2: m2Start ? (en ? String(m2Start) : String(m2Start).replace(".", ",")) : "",
    projektart: PROJEKTARTEN.some((p) => p.value === projektStart) ? projektStart : "",
    name: "",
    email: "",
    telefon: "",
    profil: "",
    ort: "",
    land: "",
    zeitraum: "",
    nachricht: "",
    einwilligung: false,
  }));
  const [refs, setRefs] = useState(() => (refsStart || []).slice(0, MAX_REFS));
  // Zubehör: je Position {an, wert}; vorbelegt aus dem Rechner (Mengen laut Ezarri-Faktoren)
  const [zub, setZub] = useState(() =>
    Object.fromEntries(
      ZUBEHOER.map((x) => {
        const v = Number(zubehoerStart?.[x.id]);
        const ok = Number.isFinite(v) && v > 0;
        return [x.id, { an: ok, wert: ok ? (en ? String(v) : String(v).replace(".", ",")) : "" }];
      })
    )
  );
  const [fehler, setFehler] = useState({});
  const [status, setStatus] = useState(null);
  const [sendet, setSendet] = useState(false);
  const [ergebnis, setErgebnis] = useState(null);

  const payload = useMemo(
    () => ({
      ...werte,
      referenzen: refs.map((r) => r.id),
      ...(k ? { k } : {}),
      ...(m ? { m } : {}),
      ...(rechner ? { rechner } : {}),
      ...(fuge ? { fuge } : {}),
      ...(format ? { format } : {}),
      ...(werte.art === "angebot" && ZUBEHOER.some((x) => zub[x.id].an)
        ? { zubehoer: Object.fromEntries(ZUBEHOER.filter((x) => zub[x.id].an).map((x) => [x.id, zub[x.id].wert || "0"])) }
        : {}),
      quelle,
    }),
    [werte, refs, k, m, rechner, fuge, format, zub, quelle]
  );

  const set = (name) => (e) => {
    const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setWerte((w) => ({ ...w, [name]: value }));
    if (fehler[name] || (name === "telefon" && fehler.email)) {
      const r = pruefe({ ...payload, [name]: value });
      setFehler((f) => {
        const next = { ...f, [name]: r.ok ? undefined : r.fehler[name] };
        if (name === "telefon" || name === "email") next.email = r.ok ? undefined : r.fehler.email;
        return next;
      });
    }
  };

  const blur = (name) => () => {
    const r = pruefe(payload);
    const msg = r.ok ? undefined : r.fehler[name];
    // Kontakt-Fehler erst zeigen, wenn beide Felder verlassen wurden
    if (name === "email" && msg === undefined) return setFehler((f) => ({ ...f, email: undefined }));
    if (name === "email" && !werte.email && !werte.telefon) return;
    setFehler((f) => ({ ...f, [name]: msg }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (sendet) return;
    const r = pruefe(payload);
    if (!r.ok) {
      setFehler(r.fehler);
      const order = FELD_REIHENFOLGE.filter((key) => r.fehler[key]);
      setStatus({
        type: "summary",
        title: C.fehlerTitel,
        items: order.map((key) => ({ id: feldId(key), text: r.fehler[key] })),
      });
      focus(feldId(order[0]));
      return;
    }
    setSendet(true);
    setStatus(null);
    const res = await postForm(endpoint, guard(payload, formRef.current), { lead: false });
    setSendet(false);
    if (res.ok) {
      setErgebnis(res.data);
      trackLead("ezarri_anfrage", { art: werte.art });
      onSuccess?.(res.data);
      requestAnimationFrame(() => successRef.current?.focus());
      return;
    }
    if (res.code === "invalid" && res.field) {
      const msg = (en ? meldungEn(res.data?.error) : res.data?.error) || C.fehler.allgemein;
      setFehler((f) => ({ ...f, [res.field]: msg }));
      setStatus({ type: "summary", title: C.fehlerTitel, items: [{ id: feldId(res.field), text: msg }] });
      focus(feldId(res.field));
      return;
    }
    if (res.data?.code === "unavailable") {
      // Produktion ohne Anfrageweg (versand.js): direkt anrufen oder schreiben
      setStatus({
        type: "error",
        text: (
          <>
            {C.fehler.unavailable}{" "}
            <a href={PHONE_HREF} className="underline underline-offset-4">
              {PHONE_DISPLAY}
            </a>{" "}
            ·{" "}
            <a href={EMAIL_HREF} className="underline underline-offset-4">
              {EMAIL}
            </a>
          </>
        ),
      });
      return;
    }
    setStatus({ type: "error", text: C.fehler[res.code] || C.fehler.allgemein });
  }

  function feldId(key) {
    if (key === "art") return id("art");
    if (key === "referenzen") return id("refs");
    if (key === "einwilligung") return id("einwilligung");
    if (key === "zubehoer") return id("zubehoer");
    return id(key);
  }

  if (ergebnis) {
    return (
      <FormSuccess ref={successRef} title={C.danke.titel}>
        <p className="max-w-measure">{C.danke.text}</p>
        {ergebnis.dryRun && <p className="mt-3 max-w-measure text-small text-text-soft">{C.danke.dryRun}</p>}
        <div className="mt-6">
          <LinkArrow href="/ezarri">{C.danke.weiter}</LinkArrow>
        </div>
      </FormSuccess>
    );
  }

  const H = `h${Math.min(4, Math.max(2, headingLevel))}`;
  const opt = C.felder.optional;

  return (
    <form ref={formRef} method="post" noValidate onSubmit={onSubmit} aria-describedby={id("privacy")} className="relative flex flex-col gap-8 [&_input]:scroll-mb-24 [&_select]:scroll-mb-24 [&_textarea]:scroll-mb-24 [&_button]:scroll-mb-24" data-ezarri-anfrage>
      <Honeypot id={id("website")} />
      <FormAlert status={status} />

      {kontext.length > 0 && (
        <div className="border-l-2 border-see bg-surface-raised px-5 py-4">
          <ul className="space-y-1 text-small text-text">
            {kontext.map((z) => (
              <li key={z}>{z}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Art */}
      <fieldset id={id("art")} tabIndex={-1} aria-describedby={fehler.art ? `${id("art")}-error` : undefined} className="min-w-0 focus:outline-none">
        <legend className="text-title text-text">
          <H className="contents">{C.art.legend}</H>
        </legend>
        <div className="mt-stack-s grid gap-3 sm:grid-cols-3">
          {ARTEN.map((a, i) => (
            <label
              key={a.value}
              htmlFor={`${id("art")}-${i}`}
              className={cx(
                "flex min-h-16 cursor-pointer items-start gap-3 bg-surface px-4 py-3 text-text transition-colors duration-(--duration-micro)",
                fehler.art ? "border-2 border-error" : "border border-line-control hover:border-ink has-checked:border-2 has-checked:border-ink has-checked:bg-surface-raised has-checked:px-[15px]"
              )}
            >
              <input
                id={`${id("art")}-${i}`}
                type="radio"
                name={`${uid}-art`}
                value={a.value}
                checked={werte.art === a.value}
                onChange={() => set("art")(a.value)}
                className="mt-0.5 size-5 flex-none accent-ink"
              />
              <span className="flex flex-col">
                <span className="text-ui">{C.art.optionen[a.value].label}</span>
                <span className="text-small text-text-soft">{C.art.optionen[a.value].text}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id={`${id("art")}-error`}>{fehler.art}</FieldError>
      </fieldset>

      {/* Mosaike */}
      <div id={id("refs")} tabIndex={-1} className="focus:outline-none">
        <p className="text-ui text-text" id={`${id("refs")}-label`}>
          {C.felder.referenzen} <span className="font-normal text-text-soft">({opt})</span>
        </p>
        {refs.length ? (
          <>
            <ul aria-labelledby={`${id("refs")}-label`} className="mt-2 flex flex-wrap gap-2">
              {refs.map((r) => (
                <li key={r.id} className="inline-flex min-h-11 items-center gap-1 border border-line-control bg-surface-raised pl-3 text-ui text-text">
                  <span>
                    {r.name}
                    {r.code && r.code !== r.name ? <span className="ml-1 text-small text-text-soft tabular-nums">{r.code}</span> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRefs((list) => list.filter((x) => x.id !== r.id))}
                    className="inline-flex size-11 items-center justify-center text-text-soft hover:text-text"
                    aria-label={en ? `Remove ${r.name}` : `${r.name} entfernen`}
                  >
                    <X aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-small text-text-soft">{C.felder.referenzenHint}</p>
          </>
        ) : (
          <p className="mt-2 text-small text-text-soft">
            {C.felder.referenzenLeer}{" "}
            <LinkArrow href={musterLink} className="text-small">
              {C.felder.referenzenLink}
            </LinkArrow>
          </p>
        )}
        <FieldError id={`${id("refs")}-error`}>{fehler.referenzen}</FieldError>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          id={id("m2")}
          name="m2"
          label={`${C.felder.m2} (m²)`}
          optionalText={opt}
          inputMode="decimal"
          autoComplete="off"
          hint={C.felder.m2Hint}
          value={werte.m2}
          onChange={set("m2")}
          onBlur={blur("m2")}
          error={fehler.m2}
        />
        <FormField id={id("projektart")} as="select" name="projektart" label={C.felder.projektart} optionalText={opt} value={werte.projektart} onChange={set("projektart")}>
          <option value="">{C.felder.bitteWaehlen}</option>
          {PROJEKTARTEN.map((p) => (
            <option key={p.value} value={p.value}>
              {lbl("projektarten", p.value, p.label)}
            </option>
          ))}
        </FormField>
      </div>

      {werte.art === "angebot" && (
        <div id={id("zubehoer")} tabIndex={-1} className="focus:outline-none">
          <details className="group border-t border-line pt-4" open={Boolean(zubehoerStart) || Boolean(fehler.zubehoer) || undefined}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-ui text-text [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="inline-block transition-transform duration-(--duration-micro) group-open:rotate-90 motion-reduce:transition-none">
                ›
              </span>
              {C.zubehoer.titel} <span className="font-normal text-text-soft">({opt})</span>
            </summary>
            <fieldset className="mt-4 min-w-0" aria-describedby={[`${id("zubehoer")}-hint`, fehler.zubehoer ? `${id("zubehoer")}-error` : null].filter(Boolean).join(" ")}>
              <legend className="sr-only">{C.zubehoer.titel}</legend>
              <p id={`${id("zubehoer")}-hint`} className="text-small text-text-soft">
                {zubehoerStart ? C.zubehoer.hintRechner : C.zubehoer.hint}
              </p>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {ZUBEHOER.map((x) => {
                  const z = zub[x.id];
                  const cb = `${id("zubehoer")}-${x.id}`;
                  const leer = z.an && !(Number.parseFloat(z.wert.replace(",", ".")) > 0);
                  return (
                    <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                      <label htmlFor={cb} className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 text-body text-text">
                        <input
                          id={cb}
                          type="checkbox"
                          checked={z.an}
                          onChange={(e) => {
                            const an = e.target.checked;
                            setZub((alt) => ({ ...alt, [x.id]: { ...alt[x.id], an } }));
                            if (fehler.zubehoer) setFehler((f) => ({ ...f, zubehoer: undefined }));
                          }}
                          className="size-5 flex-none accent-ink"
                        />
                        {lbl("zubehoer", x.id, x.label)}
                      </label>
                      <label className="flex items-center gap-2 text-ui text-text">
                        <span className="sr-only">{C.zubehoer.menge(lbl("zubehoer", x.id, x.label), lbl("einheit", x.einheit, x.einheit))}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={z.wert}
                          disabled={!z.an}
                          aria-invalid={fehler.zubehoer && leer ? true : undefined}
                          onChange={(e) => {
                            const wert = e.target.value.slice(0, 8);
                            setZub((alt) => ({ ...alt, [x.id]: { ...alt[x.id], wert } }));
                          }}
                          className={cx(
                            "h-11 w-24 bg-surface px-3 text-right tabular-nums text-text disabled:opacity-40",
                            fehler.zubehoer && leer ? "border-2 border-error" : "border border-line-control"
                          )}
                        />
                        <span aria-hidden="true" className="w-12 text-small text-text-soft">
                          {lbl("einheit", x.einheit, x.einheit)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </details>
          <FieldError id={`${id("zubehoer")}-error`}>{fehler.zubehoer}</FieldError>
        </div>
      )}

      <div className="grid gap-6">
        <FormField id={id("name")} name="name" label={C.felder.name} required autoComplete="name" value={werte.name} onChange={set("name")} onBlur={blur("name")} error={fehler.name} />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id={id("email")}
            name="email"
            type="email"
            label={C.felder.email}
            autoComplete="email"
            inputMode="email"
            hint={C.felder.kontaktHint}
            value={werte.email}
            onChange={set("email")}
            onBlur={blur("email")}
            error={fehler.email}
          />
          <FormField
            id={id("telefon")}
            name="telefon"
            type="tel"
            label={C.felder.telefon}
            autoComplete="tel"
            value={werte.telefon}
            onChange={set("telefon")}
            onBlur={blur("telefon")}
            error={fehler.telefon}
          />
        </div>
      </div>

      <details className="group border-t border-line pt-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-ui text-text [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="inline-block transition-transform duration-(--duration-micro) group-open:rotate-90">›</span>
          {C.felder.mehr}
        </summary>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <FormField id={id("profil")} as="select" name="profil" label={C.felder.profil} optionalText={opt} value={werte.profil} onChange={set("profil")}>
            <option value="">{C.felder.bitteWaehlen}</option>
            {PROFILE.map((p) => (
              <option key={p.value} value={p.value}>
                {lbl("profile", p.value, p.label)}
              </option>
            ))}
          </FormField>
          <FormField id={id("zeitraum")} as="select" name="zeitraum" label={C.felder.zeitraum} optionalText={opt} value={werte.zeitraum} onChange={set("zeitraum")}>
            <option value="">{C.felder.bitteWaehlen}</option>
            {ZEITRAEUME.map((p) => (
              <option key={p.value} value={p.value}>
                {lbl("zeitraeume", p.value, p.label)}
              </option>
            ))}
          </FormField>
          <FormField id={id("ort")} name="ort" label={C.felder.ort} optionalText={opt} autoComplete="address-level2" value={werte.ort} onChange={set("ort")} />
          <FormField id={id("land")} as="select" name="land" label={C.felder.land} optionalText={opt} autoComplete="country" value={werte.land} onChange={set("land")}>
            <option value="">{C.felder.bitteWaehlen}</option>
            {LAENDER.map((p) => (
              <option key={p.value} value={p.value}>
                {lbl("laender", p.value, p.label)}
              </option>
            ))}
          </FormField>
          <FormField
            id={id("nachricht")}
            as="textarea"
            name="nachricht"
            label={C.felder.nachricht}
            optionalText={opt}
            hint={C.felder.nachrichtHint}
            className="sm:col-span-2"
            value={werte.nachricht}
            onChange={set("nachricht")}
            maxLength={3000}
          />
        </div>
      </details>

      <div>
        <label htmlFor={id("einwilligung")} className="flex min-h-11 cursor-pointer items-start gap-3 text-body text-text">
          <input
            id={id("einwilligung")}
            type="checkbox"
            name="einwilligung"
            required
            checked={werte.einwilligung}
            onChange={set("einwilligung")}
            aria-invalid={fehler.einwilligung ? true : undefined}
            aria-describedby={describedBy(id("einwilligung"), { error: fehler.einwilligung })}
            className={cx("mt-1 size-5 flex-none accent-ink", fehler.einwilligung && "outline-2 outline-error")}
          />
          <span>
            {C.felder.einwilligung}
            <span aria-hidden="true"> *</span>
          </span>
        </label>
        <FieldError id={`${id("einwilligung")}-error`}>{fehler.einwilligung}</FieldError>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start gap-2">
          <Button type="submit" disabled={!hydrated || sendet} aria-disabled={sendet || undefined} className="w-full sm:w-auto" arrow={!sendet}>
            {sendet ? C.sendet : C.senden}
          </Button>
          <p className="text-small text-text-soft">{C.sendenSub}</p>
        </div>
        <FormPrivacyNote id={id("privacy")} />
      </div>
    </form>
  );
}

function focus(elementId) {
  if (!elementId) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const target = el.matches("fieldset,div") ? el.querySelector("input,button,select,textarea") || el : el;
    target.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: scrollVerhalten() });
  });
}

