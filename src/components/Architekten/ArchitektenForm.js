"use client";
// Anfrage + Musterliste der Seite /architekten (Welle 2, Team Architekten).
// Sendet über den bestehenden Lead-Mechanismus (postForm → /api/beratung_anfrage,
// Herkunft-Block, lead_ref, Honeypot, _t). Musterliste: leichter Merkzettel
// ohne Preise in localStorage("architekten-muster"), optional mit den Stücken
// der Merkliste (CartContext, nur Namen). Logik: src/lib/architekten/lead.js.
//
// Rat 9,5 B10 (ux 6): zwei Stufen – vier Pflichtfelder (Büro, Name, E-Mail,
// Vorhaben in einem Satz), danach freiwillig „Details ergänzen“ (Anliegen,
// Projektart, Phase, Telefon, Merkliste). Logik: ./quickLead.js. Ein
// ?anliegen= aus der URL oder ein Fehler in den Details klappt sie auf.
// Rat 9,5 A3 (ux 2): Bestätigung nach dem Senden am Viewport-Anfang
// (../Landing/revealConfirmation.js).
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Eyebrow from "@/components/ui/Eyebrow";
import Heading from "@/components/ui/Heading";
import LinkArrow from "@/components/ui/LinkArrow";
import FormField, { RadioCards } from "@/components/Forms/FormField";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { FormAlert, FormSuccess } from "@/components/Forms/FormAlert";
import useFormGuard, { focusField, useHydrated } from "@/components/Forms/useFormGuard";
import useFormText from "@/components/Forms/useFormText";
import { postForm } from "@/lib/forms/client";
import { trackLead } from "@/lib/analytics";
import { useCart } from "@/context/CartContext";
import { ANLIEGEN, LEAD_URL, anliegenFromParam, cleanMuster, pageContextOf } from "@/lib/architekten/lead";
import { revealConfirmation } from "@/components/Landing/revealConfirmation";
import { ARCH_ORDER, DEFAULT_ANLIEGEN, archDetailsHaveError, archQuickText, buildArchQuickPayload, validateArchQuick } from "./quickLead";

const STORE = "architekten-muster";
const ORDER = ARCH_ORDER;
const ID = (k) => (k === "anliegen" ? "arch-anliegen" : `arch-${k}`);

// Musterliste als externer Speicher (useSyncExternalStore): kein setState im
// Effect, Server und erster Client-Render sehen [] (keine Hydration-Abweichung).
const EMPTY = Object.freeze([]);
const listeners = new Set();
let memRaw = "[]"; // privater Modus: Liste lebt nur in der Seite
let snapRaw = null;
let snap = EMPTY;
const readRaw = () => {
  try {
    return localStorage.getItem(STORE) ?? "[]";
  } catch {
    return memRaw;
  }
};
const getSnapshot = () => {
  const raw = readRaw();
  if (raw !== snapRaw) {
    snapRaw = raw;
    try {
      snap = cleanMuster(JSON.parse(raw));
    } catch {
      snap = EMPTY;
    }
  }
  return snap;
};
const getServerSnapshot = () => EMPTY;
const subscribe = (cb) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const writeStore = (list) => {
  memRaw = JSON.stringify(list);
  try {
    if (list.length) localStorage.setItem(STORE, memRaw);
    else localStorage.removeItem(STORE);
  } catch {
    /* privater Modus */
  }
  listeners.forEach((l) => l());
};
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? "");

export default function ArchitektenForm({ copy, locale, ezarriHref }) {
  return <Form copy={copy} locale={locale} ezarriHref={ezarriHref} initial={null} />;
}

/** Mit Kontext aus ?anliegen= (in <Suspense> rendern). */
export function ArchitektenFormWithParams(props) {
  const sp = useSearchParams();
  return <Form {...props} initial={anliegenFromParam(sp?.get("anliegen") || sp?.get("kontext"))} />;
}

function Form({ copy, locale, ezarriHref, initial }) {
  const { FORM: F, MUSTER: M } = copy;
  // FR/IT: Texte der Kurz-Anfrage kommen mit der Server-Copy (copy.QUICK).
  const T = copy.QUICK || archQuickText(locale);
  const { errorText } = useFormText();
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const { cartItems = [] } = useCart() || {};
  const [v, setV] = useState({ anliegen: initial || "", buero: "", projektart: "", phase: "", bedarf: "", name: "", email: "", telefon: "" });
  const [details, setDetails] = useState(Boolean(initial));
  const muster = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [withMerk, setWithMerk] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const successRef = useRef(null);

  // Link „Home-Staging anfragen“ (?anliegen=staging) wählt das Anliegen auch
  // nachträglich: Zustand beim Rendern anpassen statt im Effect.
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    if (initial) {
      setV((p) => ({ ...p, anliegen: initial }));
      setDetails(true);
    }
  }
  useEffect(() => {
    if (sent) revealConfirmation(successRef.current);
  }, [sent]);

  const merkNames = (Array.isArray(cartItems) ? cartItems : []).map((i) => i?.name).filter(Boolean);
  const msg = (key) => T.errors[key] || F.errors[key] || F.errors.required;

  const set = (name, value) => {
    const next = { ...v, [name]: value };
    setV(next);
    if (errors[name]) setErrors((p) => ({ ...p, [name]: validateArchQuick(next)[name] }));
  };
  const onBlur = (e) => {
    const name = e.target.name;
    if (!ORDER.includes(name) || (!e.target.value && !errors[name])) return;
    setErrors((p) => ({ ...p, [name]: validateArchQuick(v)[name] }));
  };
  const toggleMuster = (id) => {
    const next = muster.includes(id) ? muster.filter((x) => x !== id) : cleanMuster([...muster, id]);
    writeStore(next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    const found = validateArchQuick(v);
    const keys = ORDER.filter((k) => found[k]);
    setErrors(found);
    if (keys.length) {
      setStatus({ type: "summary", title: fill(F.errors.summary, { count: keys.length }), items: keys.map((k) => ({ id: ID(k), text: `${labelOf(F, k, T)}: ${msg(found[k])}` })) });
      if (archDetailsHaveError(found)) setDetails(true);
      requestAnimationFrame(() => focusField(ID(keys[0])));
      return;
    }
    const anliegen = ANLIEGEN.includes(v.anliegen) ? v.anliegen : DEFAULT_ANLIEGEN;
    const payload = buildArchQuickPayload(
      { ...v, muster, merkliste: withMerk ? merkNames : [] },
      { anliegenLabels: F.anliegen.options, musterLabels: Object.fromEntries(M.groups.map((g) => [g.id, g.label])), lines: F.lines, notGiven: T.notGiven },
    );
    setLoading(true);
    setStatus(null);
    const result = await postForm(LEAD_URL, guard(payload, e.currentTarget), { lead: { pageContext: pageContextOf(anliegen) } });
    setLoading(false);
    if (!result.ok) {
      setStatus({ type: "error", text: errorText(result.code) });
      return;
    }
    trackLead("architekten", { transaction_id: result.leadRef, lead_context: anliegen });
    writeStore([]);
    setSent(true);
  };

  const field = (name, extra = {}) => ({
    id: ID(name),
    name,
    value: v[name],
    onChange: (e) => set(name, e.target.value),
    onBlur,
    error: errors[name] ? msg(errors[name]) : undefined,
    ...extra,
  });

  return (
    <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-8">
      {/* Musterliste */}
      <div id="muster" className="scroll-mt-[88px] lg:col-span-4">
        <Eyebrow>{M.overline}</Eyebrow>
        <Heading level={2} size="title" className="mt-stack-s">
          {M.title}
        </Heading>
        <p className="mt-3 max-w-measure text-body text-text-soft">{M.lead}</p>
        <fieldset className="mt-stack-s">
          <legend className="sr-only">{M.title}</legend>
          <ul className="border-t border-line">
            {M.groups.map((g) => (
              <li key={g.id} className="border-b border-line">
                <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-ui text-text">
                  <input type="checkbox" className="size-5 flex-none accent-ink" checked={muster.includes(g.id)} onChange={() => toggleMuster(g.id)} disabled={sent} />
                  <span>{g.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <p className="mt-3 text-small text-text-soft tabular" aria-live="polite">
          {muster.length ? fill(M.count, { count: muster.length }) : M.none}
        </p>
        {muster.length > 0 && !sent && (
          <button type="button" onClick={() => writeStore([])} className="mt-2 inline-flex min-h-11 items-center text-small text-text underline underline-offset-4">
            {M.clear}
          </button>
        )}
        {ezarriHref && (
          <LinkArrow href={ezarriHref} className="mt-2">
            {M.ezarriLink}
          </LinkArrow>
        )}
      </div>

      {/* Anfrage */}
      <div className="lg:col-span-7 lg:col-start-6">
        <Eyebrow>{F.overline}</Eyebrow>
        <Heading id="anfrage-title" level={2} className="mt-stack-s text-balance">
          {F.title}
        </Heading>
        <p className="mt-3 max-w-measure text-body text-text-soft">{F.lead}</p>
        {sent ? (
          <FormSuccess ref={successRef} title={F.success.title} className="mt-stack-m scroll-mt-[88px]">
            <p>{F.success.text}</p>
          </FormSuccess>
        ) : (
          <form method="post" noValidate onSubmit={onSubmit} className="relative mt-stack-m space-y-6" aria-labelledby="anfrage-title">
            <FormAlert status={status} />
            {/* Stufe 1: vier Pflichtfelder (B10) */}
            <FormField {...field("buero")} label={F.buero} required autoComplete="organization" />
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField {...field("name")} label={T.name} required autoComplete="name" />
              <FormField {...field("email")} type="email" label={F.email} required autoComplete="email" inputMode="email" />
            </div>
            <FormField {...field("bedarf")} as="textarea" label={T.vorhaben} hint={F.bedarf.hint} required rows={3} />

            {/* Stufe 2: freiwillige Details (B10) */}
            <div className="border-t border-line pt-2">
              <button
                type="button"
                aria-expanded={details}
                aria-controls="arch-details"
                onClick={() => setDetails((d) => !d)}
                className="ph-press flex min-h-11 w-full items-center justify-between gap-4 text-left text-ui text-text"
                data-arch-details-toggle=""
              >
                <span>
                  {T.details} <span className="text-text-soft">({F.optional})</span>
                </span>
                <span aria-hidden="true" className="text-title leading-none">
                  {details ? "−" : "+"}
                </span>
              </button>
              <div id="arch-details" hidden={!details} className="ph-arrive mt-4 space-y-6" data-arch-details="">
                <p className="text-small text-text-soft">{T.detailsHint}</p>
                <RadioCards
                  id={ID("anliegen")}
                  name="anliegen"
                  legend={F.anliegen.legend}
                  legendSize="label"
                  options={ANLIEGEN.map((k) => ({ value: k, label: F.anliegen.options[k] }))}
                  value={v.anliegen || DEFAULT_ANLIEGEN}
                  onChange={(val) => set("anliegen", val)}
                  error={errors.anliegen ? msg(errors.anliegen) : undefined}
                  className="[&>div]:sm:grid-cols-2"
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField {...field("projektart")} as="select" label={F.projektart.label} optionalText={F.optional}>
                    <option value="">{F.choose}</option>
                    {F.projektart.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </FormField>
                  <FormField {...field("phase")} as="select" label={F.phase.label} optionalText={F.optional}>
                    <option value="">{F.choose}</option>
                    {F.phase.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </FormField>
                </div>
                <FormField {...field("telefon")} type="tel" label={F.telefon} optionalText={F.optional} autoComplete="tel" />
                {merkNames.length > 0 && (
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 text-ui text-text">
                    <input type="checkbox" className="size-5 flex-none accent-ink" checked={withMerk} onChange={(e) => setWithMerk(e.target.checked)} />
                    <span>{fill(M.merkliste, { count: merkNames.length })}</span>
                  </label>
                )}
              </div>
            </div>
            <Honeypot id="architekten-website" />
            <div className="flex flex-col items-start gap-3">
              <Button type="submit" variant="primary" arrow disabled={!hydrated || loading} aria-busy={loading || undefined}>
                {loading ? F.sending : F.submit}
              </Button>
              <FormPrivacyNote />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function labelOf(F, k, T) {
  if (k === "name") return T.name;
  if (k === "bedarf") return T.vorhaben;
  if (k === "anliegen") return F.anliegen.legend;
  if (k === "projektart") return F.projektart.label;
  if (k === "phase") return F.phase.label;
  if (k === "bedarf") return F.bedarf.label;
  return F[k];
}
