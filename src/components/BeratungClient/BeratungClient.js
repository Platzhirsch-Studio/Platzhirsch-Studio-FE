"use client";
// Beratungsanfrage in four steps (Neuauftritt, Design-Bibel §9 "Stepper",
// §14). Payload unchanged since Runde 1:
//   { bei_meiner_anfrage_geht_es_um, das_projekt_soll_verwirklicht_werden,
//     bitte_beschreiben_sie_ihr_vorhaben, vorname, nachname, email, telefon }
// plus `website` (honeypot) and `_t` (ms since render), through
// /api/upload/inquiry/beratung (→ /api/beratung_anfrage, upload ticket).
// Changes for accessibility: radio cards in a fieldset instead of buttons
// that jumped on after 500 ms (no auto-advance, §14), "Zurück"/"Weiter",
// "Schritt n von 4", focus on the step question when the step changes and
// on the first bad field after an error; errors at the field, summary in a
// polite live region, request errors as translated `code`. After success the
// confirmation stays (no reset after 5 s) together with the upload card.
// R5-leads-perf: <UploadHandoff> loads only after the send (Forms/
// lazyHandoff.js, keeps lib/upload/config.js out of the first load); step 4
// has the optional Selbstauskunft, sent as `lead.selfReport` into the
// Herkunft text block (no new API field).
// Fix-Runde 1 (F3): more topics (Küche, Sofa, Ezarri, Outdoor; Hotel/
// Gastronomie, Boot/Yacht – keys in lib/forms/beratungContext.js), context
// from ?thema= / ?planer= / ?stil= / ?produkt= (topic, place and first message
// lines prefilled) and an optional Wunschtermin in step 3 (day + time of day,
// no booking, no promise). The Wunschtermin travels as one line at the end of
// bitte_beschreiben_sie_ihr_vorhaben (free text, no new API field).
// r7-p1 (ux P1-6, P2-6): after the send a real confirmation (Beratung/
// Confirmation.js: "Danke, {Vorname}.", summary, three next steps, phone,
// Arbeitsweise, route; no reply deadline). Step 3 shows the Wunschtermin
// ABOVE the textarea, so on phones it is not pushed below the fold; the
// textarea starts with the context lines (?thema=, ?rolle=, ?ort=).
import { useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building, Building2, CookingPot, DraftingCompass, Ellipsis, Home, Hotel, LayoutGrid, Sailboat, Ship, Sofa, Trees, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import cx from "@/components/ui/cx";
import Eyebrow from "@/components/ui/Eyebrow";
import { domChoice } from "@/components/Forms/domChoice";
import Heading from "@/components/ui/Heading";
import { trackLead } from "@/lib/analytics";
import { firstError, isEmail, isPhone, postForm } from "@/lib/forms/client";
import { UploadHandoff, handoffAfterSend, prefetchHandoff } from "@/components/Forms/lazyHandoff";
import SelfReportField from "@/components/Forms/SelfReportField";
import FormField, { RadioCards } from "@/components/Forms/FormField";
import FormPrivacyNote from "@/components/Forms/FormPrivacyNote";
import Honeypot from "@/components/Forms/Honeypot";
import { FormAlert } from "@/components/Forms/FormAlert";
import Confirmation from "@/components/Beratung/Confirmation";
import { cityContext } from "@/components/Beratung/confirmationCopy";
import { boardLabel } from "@/components/Beratung/t1Copy";
import { revealConfirmation } from "@/lib/forms/reveal";
import { clearDraft, contextKey, loadDraft, saveDraft, tabStorage, takeHandoff, withoutPlanLine } from "@/lib/forms/draft";
import useFormGuard, { focusField, useHydrated, useServerFieldError } from "@/components/Forms/useFormGuard";
import useFormText from "@/components/Forms/useFormText";
import {
  STEP1_KEYS,
  STEP2_KEYS,
  TOPIC_PLACE,
  WISH_SLOTS,
  attachmentLines,
  beratungContext,
  contextCity,
  herkunftContext,
  optionKey,
  optionLabel,
  prefillMessage,
  todayIso,
  topicSummary,
  weekdayOf,
  wishDateError,
  wishLine,
} from "@/lib/forms/beratungContext";
// Yacht team (31.10.2026): topic hint under the message (boat type, berth, refit or new build, time frame).
import { anliegenHint } from "@/lib/forms/topicHints";

const TOTAL = 4;
// Same order as STEP1_KEYS / STEP2_KEYS (and the message arrays).
const STEP1_ICONS = [Building, Wrench, CookingPot, Sofa, LayoutGrid, Trees, Ship, Hotel, DraftingCompass, Ellipsis];
const STEP2_ICONS = [Home, Building, Building2, Hotel, Sailboat];

// Field → step and element id (also for a server 400 with `field`).
const FIELDS = {
  step1: { step: 1, id: "beratung-art-0", api: "bei_meiner_anfrage_geht_es_um" },
  step2: { step: 2, id: "beratung-ort-0", api: "das_projekt_soll_verwirklicht_werden" },
  // Optional, no API field of its own (goes into the message as one line).
  // Above the textarea since r7-p1 (ux P2-6), so first in the error order too.
  wishDate: { step: 3, id: "beratung-wunschtag" },
  message: { step: 3, id: "beratung-vorhaben", api: "bitte_beschreiben_sie_ihr_vorhaben" },
  vorname: { step: 4, id: "beratung-vorname", api: "vorname" },
  nachname: { step: 4, id: "beratung-nachname", api: "nachname" },
  email: { step: 4, id: "beratung-email", api: "email" },
  telefon: { step: 4, id: "beratung-telefon", api: "telefon" },
};
const ORDER = Object.keys(FIELDS);

// Rat 9,5 C3 (UX10): step 1 shows six cards, the rarer topics behind
// "Andere Anliegen" (opened automatically when one of them is chosen).
const STEP1_VISIBLE = 6;
// Draft (C3) and planner hand-over (A4): src/lib/forms/draft.js.
const storage = tabStorage;
const API_TO_FIELD = Object.fromEntries(ORDER.filter((k) => FIELDS[k].api).map((k) => [FIELDS[k].api, k]));

// `start`: prefilled topic/place labels and message start (from the URL
// context, in the page language; forms.productPrefix, Lead-Restliste P3-4).
const empty = (start = {}) => ({
  step1: start.step1 || null,
  step2: start.step2 || null,
  message: start.message || "",
  wishDate: "",
  wishSlot: "",
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
});

// Reads ?produkt=, ?thema=, ?planer=, ?stil= from the URL. In the static build
// useSearchParams() suspends on the server, so the page renders
// <BeratungForm /> (no prefill) as the Suspense fallback: the form is in the
// server HTML either way.
export default function BeratungClient() {
  return <BeratungForm context={beratungContext(useSearchParams())} />;
}

/**
 * @param {object} [context]  beratungContext() result
 * @param {string} [produkt]  legacy: product text only (= context.produkt)
 * @param {number|null|"gone"} [boardCount] cards of the shared Ideenboard (?ideenboard=, read on the server); "gone" = link no longer valid
 * @param {ReactNode} [aside] trust block next to the form (Beratung/TrustBlock.js, server)
 */
export function BeratungForm({ context = null, produkt = null, boardCount = null, aside = null }) {
  const t = useTranslations("MultiStepForm");
  const tf = useTranslations("forms");
  const { text, errorText, locale } = useFormText();
  const guard = useFormGuard();
  const hydrated = useHydrated();
  const serverError = useServerFieldError();
  // Dreiländer-Rechner: country code and value band → names in the page language.
  const contextVars = (vars) => {
    if (!vars) return vars;
    const out = { ...vars };
    if (vars.land && t.has(`context.lands.${vars.land}`)) out.land = t(`context.lands.${vars.land}`);
    if (vars.wert && t.has(`context.values.${vars.wert}`)) out.wert = t(`context.values.${vars.wert}`);
    return out;
  };
  // The request starts with topic, place and the context lines (product from
  // a product page, "Anfrage aus dem Küchenplaner", "Stil-Finder-Ergebnis: …").
  const [values, setValues] = useState(() => {
    const ctx = context || (produkt ? { produkt, lines: [] } : null);
    if (!ctx) return empty();
    return empty({
      step1: optionLabel(STEP1_KEYS, t.raw("step1Options"), ctx.step1),
      step2: optionLabel(STEP2_KEYS, t.raw("step2Options"), ctx.step2),
      // Runde 5 (ux P2-4): the city is no sentence in the visitor's own text
      // any more – it is the context line above step 1, a confirmation row
      // and the "Kontext:" line of the Herkunft block (herkunftContext).
      message: prefillMessage({ ...ctx, lines: (ctx.lines || []).filter((l) => l.key !== "ort") }, {
        format: (key, vars) => (t.has(`context.${key}`) ? t(`context.${key}`, contextVars(vars)) : ""),
        productLine: (product) => text("productPrefix", { product }),
      }),
    });
  });
  // Vorwahl beim Laden (für die Reihenfolge der Optionen, siehe options()).
  const [preset] = useState(() => ({ step1: values.step1, step2: values.step2 }));
  const [today] = useState(() => todayIso());
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [handoff, setHandoff] = useState(null);
  const [selfReport, setSelfReport] = useState("");
  // ?ort= city and the page context for the Herkunft block (Runde 5, ux P2-4).
  const city = contextCity(context);
  const pageContext = herkunftContext(context);
  // What was sent, for the confirmation (values are reset after the send).
  const [summary, setSummary] = useState(null);
  const stepHeading = useRef(null);
  const successRef = useRef(null);
  const moved = useRef(false);
  const [moreTopics, setMoreTopics] = useState(false);
  const [restored, setRestored] = useState(false);
  const draftReady = useRef(false);
  const initialMessage = useRef(values.message);
  // The values the page started with (URL context): a draft is only worth keeping once they differ.
  const initialValues = useRef(values);
  // Rat 9,5 B2: plan and Ideenboard travel with the request (lines at the end
  // of the message, no new API field); a revoked board is not attached.
  const attachments = { plan: context?.plan || null, ideenboard: boardCount === "gone" ? null : context?.ideenboard || null };
  const attachmentNames = [
    attachments.plan ? tf("attach.plan") : null,
    attachments.ideenboard ? boardLabel(tf, typeof boardCount === "number" ? boardCount : null) : null,
  ].filter(Boolean);
  const attachLines = attachmentLines(attachments, {
    locale,
    labels: { plan: tf("attach.labelPlan"), ideenboard: tf("attach.labelBoard") },
  });

  // A4 + C3 on mount: a fresh planner hand-over wins, else the draft of this tab.
  useEffect(() => {
    const store = storage();
    if (!store) {
      draftReady.current = true;
      return;
    }
    const handoff = takeHandoff(store, (context?.lines || []).map((l) => l.key));
    if (handoff) {
      // Der Plan hängt schon als Anlage dran (?plan=) – Link nicht doppelt im Text.
      const text = withoutPlanLine(handoff.text, context?.plan || null);
      setValues((v) => (v.message === initialMessage.current ? { ...v, message: `${text}\n` } : v));
    } else {
      const d = loadDraft(store, contextKey(context), empty());
      if (d) {
        setValues((v) => ({ ...v, ...d.values }));
        if (d.step >= 1 && d.step <= TOTAL) setStep(d.step);
        setRestored(true);
      }
    }
    draftReady.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, []);

  // QM r3 (iPad hoch): a topic tapped before hydration is checked in the DOM only – adopt it.
  useEffect(() => {
    const dom = domChoice("step1");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the DOM once after hydration
    if (dom) setValues((v) => (v.step1 ? v : { ...v, step1: dom }));
  }, []);

  // C3: keep the draft of this tab while the visitor works (not after the send).
  useEffect(() => {
    if (!draftReady.current || sent) return;
    const store = storage();
    if (!store) return;
    const start = initialValues.current;
    const dirty = Object.entries(values).some(([k, v]) => (v || "") !== (start[k] || ""));
    if (dirty || step > 1) saveDraft(store, contextKey(context), { step, values });
  }, [values, step, sent, context]);

  const discardDraft = () => {
    clearDraft(storage());
    setRestored(false);
    setErrors({});
    setStatus(null);
    setValues(empty({ step1: preset.step1, step2: preset.step2, message: initialMessage.current }));
    moved.current = true;
    setStep(1);
  };

  // Focus the step question after a step change caused by the visitor
  // (not on first render: the page must not jump to the form on load).
  useEffect(() => {
    if (!moved.current) return;
    // A3 (UX2): the confirmation comes into view (iPhone: top >= 0), focus without a jump.
    if (sent) revealConfirmation(successRef.current);
    else if (step <= 2) document.getElementById(step === 1 ? "beratung-art" : "beratung-ort")?.focus();
    else stepHeading.current?.focus();
  }, [step, sent]);

  const validate = (name, v = values) => {
    const value = v[name];
    switch (name) {
      case "step1":
      case "step2":
        return value ? null : text("field.choose");
      case "message":
        if (!String(value).trim()) return t("notification.describeRequired");
        return String(value).trim().length >= 10 ? null : t("notification.describeMinLength");
      case "wishDate": {
        const problem = wishDateError(value, today);
        return problem ? t(`wish.${problem}`) : null;
      }
      case "vorname":
      case "nachname":
        return String(value).trim() ? null : text("field.required");
      case "email":
        return isEmail(value) ? null : t("notification.emailInvalid");
      case "telefon":
        // Runde 4 (recht P2): freiwillig – nur eine eingegebene Nummer wird geprüft.
        if (!String(value ?? "").trim()) return null;
        return isPhone(value) ? null : t("notification.telefonInvalid");
      default:
        return null;
    }
  };

  const fieldsOf = (s) => ORDER.filter((k) => FIELDS[k].step === s);

  const showErrors = (found) => {
    const keys = ORDER.filter((k) => found[k]);
    setErrors((prev) => ({ ...prev, ...found }));
    setStatus({
      type: "summary",
      title: text("summary", { count: keys.length }),
      // Generic messages get the field name ("Vorname: Bitte füllen Sie …").
      items: keys.map((k) => ({
        id: FIELDS[k].id,
        text: k === "vorname" || k === "nachname" ? `${t(`field.${k}`)}: ${found[k]}` : found[k],
      })),
    });
    focusField(FIELDS[firstError(found, ORDER)]?.id);
  };

  const checkStep = (s) => {
    const found = {};
    for (const k of fieldsOf(s)) {
      const message = validate(k);
      if (message) found[k] = message;
    }
    if (Object.keys(found).length) {
      showErrors(found);
      return false;
    }
    return true;
  };

  const goTo = (s) => {
    moved.current = true;
    setStatus(null);
    setStep(s);
  };

  const set = (name, value) => {
    const next = { ...values, [name]: value };
    // r8-leads: a topic that names its place (Yacht-Interieur → auf einem Boot
    // oder einer Yacht, Objekt / Hotel → Hotel oder Gastronomie) presets step 2
    // while it is still empty; the visitor can change it.
    if (name === "step1" && !values.step2) {
      const place = TOPIC_PLACE[optionKey(STEP1_KEYS, t.raw("step1Options"), value)];
      if (place) next.step2 = optionLabel(STEP2_KEYS, t.raw("step2Options"), place);
    }
    setValues(next);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validate(name, next) }));
  };

  const onBlur = (e) => {
    const name = e.target.name;
    if (!FIELDS[name] || (!e.target.value && !errors[name])) return;
    // A server-rejected value keeps its error until it is changed.
    if (serverError.holds(name, e.target.value)) return;
    setErrors((prev) => ({ ...prev, [name]: validate(name) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading || !hydrated) return;
    // Enter in a field of an earlier step = "Weiter".
    if (step < TOTAL) {
      // QM r3: the radio is checked in the DOM but the state is empty (tap during hydration).
      const key = step <= 2 ? `step${step}` : null;
      const dom = key && !values[key] ? domChoice(key) : null;
      if (dom) {
        set(key, dom);
        goTo(step + 1);
        return;
      }
      if (checkStep(step)) goTo(step + 1);
      return;
    }
    // All steps again (a value may have been cleared on the way back).
    const found = {};
    for (const k of ORDER) {
      const message = validate(k);
      if (message) found[k] = message;
    }
    const first = firstError(found, ORDER);
    if (first) {
      if (FIELDS[first].step !== step) {
        moved.current = false;
        setStep(FIELDS[first].step);
      }
      showErrors(found);
      return;
    }

    // Wunschtermin as the last line of the message (not a booking).
    const wish = wishLine({
      date: values.wishDate,
      slot: values.wishSlot,
      label: t("wish.line"),
      slotLabel: values.wishSlot ? t(`wish.slots.${values.wishSlot}`) : "",
      locale,
    });
    const payload = {
      bei_meiner_anfrage_geht_es_um: values.step1,
      das_projekt_soll_verwirklicht_werden: values.step2,
      // Wunschtermin and the attachments (B2: "Plan: …", "Ideenboard: …") as own paragraphs.
      bitte_beschreiben_sie_ihr_vorhaben:
        wish || attachLines.length ? [values.message.trimEnd(), wish, attachLines.join("\n")].filter(Boolean).join("\n\n") : values.message,
      vorname: values.vorname,
      nachname: values.nachname,
      email: values.email,
      telefon: values.telefon,
    };

    serverError.clear();
    setLoading(true);
    setStatus(null);
    const result = await postForm(
      "/api/upload/inquiry/beratung",
      guard(payload, e.currentTarget),
      selfReport || pageContext ? { lead: { ...(selfReport ? { selfReport } : {}), ...(pageContext ? { pageContext } : {}) } } : undefined,
    );
    setLoading(false);

    if (!result.ok) {
      const key = result.code === "invalid" ? API_TO_FIELD[result.field] : undefined;
      if (key) {
        moved.current = false;
        setStep(FIELDS[key].step);
        serverError.set(key, values[key]);
        showErrors({ [key]: validate(key) || text("field.check") });
        return;
      }
      setStatus({ type: "error", text: errorText(result.code) });
      return;
    }

    trackLead("beratung", { transaction_id: result.leadRef });
    handoffAfterSend("beratung", { email: values.email, result: result.data, locale }).then(setHandoff);
    setSummary({
      name: values.vorname,
      phone: values.telefon,
      rows: [
        // r8-leads (ux P1-2): topic and place as ONE coherent line ("eine
        // Küche in einer Wohnung", "ein Yacht-Interieur") instead of two rows.
        {
          label: text("confirmation.topic"),
          value: topicSummary({
            topic: values.step1,
            place: values.step2,
            topicKey: optionKey(STEP1_KEYS, t.raw("step1Options"), values.step1),
            placeKey: optionKey(STEP2_KEYS, t.raw("step2Options"), values.step2),
          }),
        },
        { label: text("confirmation.wish"), value: wish ? wish.slice(wish.indexOf(":") + 1).trim() : "" },
        { label: cityContext(locale, "label"), value: city || "" },
        // Rat 9,5 B2: what travelled with the request.
        { label: tf("attach.title"), value: attachmentNames.join(" · ") },
        { label: text("confirmation.contactWay"), value: [values.telefon, values.email].filter(Boolean).join(" · ") },
      ],
    });
    setValues(empty());
    clearDraft(storage());
    setRestored(false);
    setSelfReport("");
    setErrors({});
    moved.current = true;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-page px-gutter pt-6 pb-16 md:py-20">
        <div className="max-w-text">
          <Confirmation ref={successRef} kind="beratung" name={summary?.name} phone={summary?.phone} summary={summary?.rows}>
            {handoff && <UploadHandoff {...handoff} onClose={() => setHandoff(null)} />}
            <Button
              variant="link"
              onClick={() => {
                moved.current = true;
                setSent(false);
                setHandoff(null);
                setSummary(null);
                setStep(1);
              }}
            >
              {text("newRequest")}
            </Button>
          </Confirmation>
        </div>
      </div>
    );
  }

  // Runde 4 (ux P1, iPhone 13): eine aus dem Seitenkontext vorgewählte Option
  // (?thema=yacht → Yacht-Interieur) steht zuerst, damit sie im ersten
  // Bildschirm sichtbar ist. Nur die Anzeige-Reihenfolge ändert sich; Werte
  // und Labels bleiben (Backoffice). Maßgeblich ist die Vorwahl beim Laden,
  // ein Klick des Besuchers sortiert nichts um.
  const options = (key, icons) => {
    const list = t.raw(key).map((label, idx) => {
      const Icon = icons[idx];
      return { value: label, label, icon: Icon ? <Icon size={22} strokeWidth={1.5} /> : null };
    });
    const first = preset[key === "step1Options" ? "step1" : "step2"];
    const at = first ? list.findIndex((o) => o.value === first) : -1;
    return at > 0 ? [list[at], ...list.slice(0, at), ...list.slice(at + 1)] : list;
  };

  // C3: six cards first; a chosen or preset topic further down opens the rest.
  const step1All = options("step1Options", STEP1_ICONS);
  const chosenAt = values.step1 ? step1All.findIndex((o) => o.value === values.step1) : -1;
  const step1Forced = chosenAt >= STEP1_VISIBLE;
  const step1Open = moreTopics || step1Forced;
  const step1Shown = step1Open ? step1All : step1All.slice(0, STEP1_VISIBLE);

  const titles = { 1: t("step1Title"), 2: t("step2Title"), 3: t("step3Title"), 4: t("step4Title") };
  const input = (name, props) => ({
    id: FIELDS[name].id,
    name,
    value: values[name],
    onChange: (e) => set(name, e.target.value),
    onBlur,
    error: errors[name] || undefined,
    required: true,
    ...props,
  });

  return (
    // Phones: small top spacing, so step 1 starts in the first screen (r1-ux P1-1).
    // Rat 9,5 B6: from lg the trust block stands next to the form (below it on phones).
    // QM content-legal r2 (200 % text): side by side only when the row is at least
    // 64rem wide (container query, rem = text size) – with large text the trust
    // block moves below the form instead of one word per line.
    <div className="@container">
    <div className={cx("mx-auto w-full max-w-page px-gutter pt-3 pb-16 md:py-20", aside && "@min-[64rem]:grid @min-[64rem]:grid-cols-12 @min-[64rem]:gap-x-grid")}>
      {/* QM content-legal r3 (iPad hoch): one column below 56 rem – the form takes the
          full content width (it ended 18 px before the band and the rules). */}
      <div className={cx("max-w-text @max-[56rem]:max-w-none", aside && "@min-[64rem]:col-span-7")}>
        {/* Runde 4 (ux P1, iPhone 13): the eyebrow only from md – on phones the
            step counter follows the page header directly. */}
        <Eyebrow className="mb-stack-s max-md:hidden">{t("formTitle")}</Eyebrow>
        {/* Progress: text, not only a bar (§4.5). */}
        {city && (
          <p role="status" data-beratung-city="" className="mb-stack-s text-ui text-text">
            {cityContext(locale, "note", city)}
          </p>
        )}
        {/* Rat 9,5 B2: what the tool hands over is named before step 1. */}
        {(attachmentNames.length > 0 || boardCount === "gone") && (
          <div data-beratung-attachments="" className="mb-stack-s border-l-2 border-line-strong pl-4 text-ui text-text">
            {attachmentNames.length > 0 && (
              <p className="flex items-start gap-2">
                <Paperclip aria-hidden="true" className="mt-1 size-4 shrink-0 text-text-soft" strokeWidth={1.5} />
                <span>
                  {tf("attach.title")}: {attachmentNames.join(" · ")}
                  {attachments.plan && (
                    <>
                      {" · "}
                      <a href={attachments.plan} target="_blank" rel="noopener" className="underline decoration-line-strong underline-offset-4 hover:decoration-current">
                        {tf("attach.planOpen")}
                        <span className="sr-only"> {tf("attach.newTab")}</span>
                      </a>
                    </>
                  )}
                </span>
              </p>
            )}
            {boardCount === "gone" && <p className="text-small text-text-soft">{tf("attach.boardGone")}</p>}
          </div>
        )}
        <p className="text-small text-text-soft tabular" id="beratung-schritt">
          {text("step", { current: step, total: TOTAL })}
        </p>
        {/* Motion: a reached segment fills from the left (scaleX, 280 ms, transform only; instant when calm). */}
        <div aria-hidden="true" className="mt-2 grid grid-cols-4 gap-1">
          {Array.from({ length: TOTAL }, (_, i) => (
            <span key={i} className="relative h-0.5 overflow-hidden bg-line-strong">
              <span
                className={`absolute inset-0 origin-left bg-ink transition-transform duration-(--duration-ui) ease-quiet motion-reduce:transition-none ${i < step ? "scale-x-100" : "scale-x-0"}`}
              />
            </span>
          ))}
        </div>

        <form
          method="post"
          onSubmit={onSubmit}
          onFocus={() => prefetchHandoff(locale)}
          noValidate
          aria-describedby="beratung-schritt"
          className="relative mt-stack-m space-y-6"
        >
          <FormAlert status={status} />

          {/* Rat 9,5 C3: restored draft of this tab, with a way to start over. */}
          {restored && (
            <p data-beratung-draft="" className="flex flex-wrap items-center gap-x-3 border-l-2 border-line-strong pl-4 text-small text-text">
              {tf("draft.restored")}
              <button type="button" onClick={discardDraft} className="inline-flex min-h-11 items-center underline underline-offset-4">
                {tf("draft.discard")}
              </button>
            </p>
          )}

          {/* Motion: a new step's content settles in from 0.6 opacity (ph-arrive,
              @starting-style; not on step 1 at load, so nothing fades on arrival). */}
          {step <= 2 ? (
            <div key={step} className={step > 1 ? "ph-arrive" : undefined}>
              <RadioCards
                key={step}
                id={step === 1 ? "beratung-art" : "beratung-ort"}
                name={step === 1 ? "step1" : "step2"}
                legend={titles[step]}
                options={step === 1 ? step1Shown : options("step2Options", STEP2_ICONS)}
                value={values[`step${step}`]}
                onChange={(v) => set(`step${step}`, v)}
                layout="fit"
                error={errors[`step${step}`] || undefined}
              />
              {step === 1 && step1All.length > STEP1_VISIBLE && !step1Forced && (
                <button
                  type="button"
                  aria-expanded={step1Open}
                  aria-controls="beratung-art"
                  data-beratung-more=""
                  onClick={() => setMoreTopics((v) => !v)}
                  className="mt-3 inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current"
                >
                  {tf(step1Open ? "moreTopics.hide" : "moreTopics.show")}
                </button>
              )}
            </div>
          ) : (
            <Heading level={3} size="title" ref={stepHeading} tabIndex={-1} className="focus:outline-none">
              {titles[step]}
            </Heading>
          )}

          {step === 3 && (
            <div className="ph-arrive space-y-6">
              {/* Wunschtermin: optional, a wish – no booking, no promise. */}
              <fieldset className="min-w-0 space-y-4" aria-describedby="beratung-wunsch-hint">
                <legend className="text-ui text-text">{t("wish.legend")}</legend>
                <p id="beratung-wunsch-hint" className="text-small text-text-soft">
                  {t("wish.hint")}
                </p>
                <FormField
                  {...input("wishDate", {
                    label: t("wish.date"),
                    type: "date",
                    min: today,
                    required: false,
                    hint:
                      values.wishDate && !wishDateError(values.wishDate, today) && [0, 1].includes(weekdayOf(values.wishDate))
                        ? t("wish.closedDay")
                        : undefined,
                  })}
                  className="max-w-xs"
                />
                <RadioCards
                  id="beratung-tageszeit"
                  name="wishSlot"
                  legend={t("wish.slotLegend")}
                  legendSize="label"
                  required={false}
                  options={WISH_SLOTS.map((k) => ({ value: k, label: t(`wish.slots.${k}`) }))}
                  value={values.wishSlot || null}
                  onChange={(v) => set("wishSlot", v)}
                />
              </fieldset>
              <FormField
                {...input("message", {
                  as: "textarea",
                  label: t("describePlaceholder").replace(/\s*(\.{3}|…)\s*$/, ""),
                  hint: anliegenHint(optionKey(STEP1_KEYS, t.raw("step1Options"), values.step1), locale) || t("describeHint"),
                  rows: 6,
                })}
              />
            </div>
          )}

          {step === 4 && (
            <div className="ph-arrive space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField {...input("vorname", { label: t("field.vorname"), type: "text", autoComplete: "given-name" })} />
                <FormField {...input("nachname", { label: t("field.nachname"), type: "text", autoComplete: "family-name" })} />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  {...input("email", { label: t("field.email"), type: "email", inputMode: "email", autoComplete: "email", spellCheck: false })}
                />
                <FormField
                  {...input("telefon", { label: t("field.telefon"), type: "tel", inputMode: "tel", autoComplete: "tel", required: false, optionalText: text("optional") })}
                />
              </div>
              <SelfReportField
                id="beratung-selbstauskunft"
                optionalText={text("optional")}
                value={selfReport}
                onChange={(e) => setSelfReport(e.target.value)}
              />
              <p className="text-small text-text-soft">{text("requiredHint")}</p>
            </div>
          )}

          <Honeypot id="beratung-website" />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {step > 1 && (
              <Button variant="ghost" onClick={() => goTo(step - 1)} className="sm:mr-auto">
                {text("back")}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              arrow={!loading}
              disabled={!hydrated || undefined}
              aria-disabled={loading || undefined}
              className="w-full sm:w-auto sm:ml-auto"
            >
              {step < TOTAL ? text("next") : loading ? text("sending") : t("send")}
            </Button>
          </div>
          {step === TOTAL && <FormPrivacyNote />}
        </form>
      </div>
      {/* QM r3 (iPad quer): the aside starts one column earlier below 90 rem (100 px gap
          before), and side by side it drops its top rule, so „Anfrage“ and „Mit wem Sie
          sprechen“ start on one line. */}
      {aside && (
        <div className="mt-16 @min-[64rem]:col-span-5 @min-[64rem]:col-start-8 @min-[64rem]:mt-0 @min-[64rem]:[&>aside]:border-t-0 @min-[64rem]:[&>aside]:pt-0 @min-[90rem]:col-span-4 @min-[90rem]:col-start-9">
          {aside}
        </div>
      )}
    </div>
    </div>
  );
}
