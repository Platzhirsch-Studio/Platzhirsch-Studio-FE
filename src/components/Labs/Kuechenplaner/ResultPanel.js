"use client";
// Küchenplaner – Ergebnis: Zusammenfassung, Preisrahmen, Screenshot,
// Teilen-Link und "Planung anfragen" (über die bestehende /api/beratung_anfrage).
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as z from "../zod.js"; // benannte Re-Exporte statt ganzem zod-Namensraum (Bundle, R4)
import { fetchWithTimeout, LabsTimeoutError } from "../net.js";
import { Camera, Check, Copy, Download, FolderOpen, Mail, Printer, Save, Send, Trash2 } from "lucide-react";
import { decodePlan, encodePlan } from "./planState";
import { trackEvent, trackLead } from "@/lib/analytics";
// Lead-Übergabe: derselbe Formular-Vertrag wie Beratung/Kontakt – Herkunft-Block,
// lead_ref (transaction_id für trackLead), Honeypot und Zeitfalle (_t).
import { postForm } from "@/lib/forms/client";
import Honeypot from "@/components/Forms/Honeypot";
import useFormGuard from "@/components/Forms/useFormGuard";
import { formatEUR, summaryLines } from "./pricing";
import { keepTogether as kt } from "@/lib/kuechenplaner/typo";
import { PRICE_HIDDEN_TEXT, sendReleased } from "./release";
import { describeRequestError } from "./requestErrors";
import { handoffHref, handoffSummary, storeHandoff } from "@/lib/kuechenplaner/handoff";
import { useGeraeteIndex } from "./GeraeteWahl";
// Lead-Übergabe (fix-09): „Link an mich mailen“
import { planMailHref } from "@/lib/kuechenplaner/planMail";
// Lead-Übergabe (fix-07, nur Eckdaten): ?geraet= wertet page.js aus (Geräte-Anbindung), nicht dieses Panel.
import { BUDGET, BUDGET_AKTIV, EMPTY_ECKDATEN, GERAETE_WAHL, PROJEKT, ZEITRAUM, eckdatenLines } from "@/lib/kuechenplaner/eckdaten";
// Sprachen (01.11.2026): Anzeige übersetzt (useKpT), Anfragetext ans Studio bleibt deutsch (Backoffice).
import { useKpT } from "./KpCopy";

function BomLoading() {
  const tr = useKpT();
  return <p className="text-sm text-ink-soft">{tr("Stückliste wird geladen …")}</p>;
}
const BomTable = dynamic(() => import("./BomTable"), { loading: () => <BomLoading /> });
const DATE_LOCALE = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };

// Lokale Planungen (nur in diesem Browser; try/catch, weil Speicher gesperrt sein kann)
const SAVE_KEY = "kp-saves-v1";
function readSaves() {
  try {
    const list = JSON.parse(window.localStorage.getItem(SAVE_KEY) || "[]");
    return Array.isArray(list) ? list.filter((x) => x && typeof x.k === "string" && typeof x.name === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}
const SAVE_EVENT = "kp-saves-change";
function subscribeSaves(cb) {
  window.addEventListener(SAVE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(SAVE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function savesSnapshot() {
  try {
    return window.localStorage.getItem(SAVE_KEY) || "[]";
  } catch {
    return "[]";
  }
}
function writeSaves(list) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 12)));
    window.dispatchEvent(new Event(SAVE_EVENT));
    return true;
  } catch {
    return false;
  }
}

// Lead-Übergabe: Thema der Anfrage ist immer „eine Küche“ (Label wie
// MultiStepForm.step1Options der Beratungsseite) – vorher landete jede
// Planer-Anfrage im Backoffice als „eine Renovierung“. Neubau/Renovierung
// geht als Zeile „Projekt: …“ in den Text.
const TOPIC_KUECHE = "eine Küche";
const STEP1 = ["einen Neubau", "eine Renovierung", "Anderes"];
const PROJEKT_LABEL = { "einen Neubau": "Neubau", "eine Renovierung": "Renovierung", Anderes: "Anderes" };
const STEP2 = ["in einem Einfamilienhaus", "in einer Wohnung", "in einer gewerblichen Immobilie"];

const formSchema = z.object({
  vorname: z.string().trim().min(1, "Bitte Vornamen angeben.").max(80),
  nachname: z.string().trim().min(1, "Bitte Nachnamen angeben.").max(80),
  email: z.string().trim().email("Bitte eine gültige E-Mail-Adresse angeben.").max(160),
  // Freiwillig wie in Beratung/Kontakt (schemas.js, Datenminimierung); wenn angegeben, gültig.
  telefon: z
    .string()
    .trim()
    .refine((v) => !v || /^[0-9+\-()\s]{6,20}$/.test(v), "Bitte eine gültige Telefonnummer angeben."),
  step1: z.enum(STEP1),
  step2: z.enum(STEP2),
  notiz: z.string().max(1500).optional(),
  consent: z.literal(true, { error: "Bitte stimmen Sie der Verarbeitung zu." }),
});

const input =
  "mt-1 block w-full min-h-11 border border-ink/25 bg-white px-3 text-base text-ink focus:border-ink focus:outline-2 focus:outline-offset-1 focus:outline-ink";
const btnDark =
  "ph-press inline-flex min-h-11 items-center justify-center gap-2 bg-ink px-5 text-sm font-medium text-white transition duration-(--duration-micro) hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff] disabled:opacity-50";
const btnLight =
  "ph-press inline-flex min-h-11 items-center justify-center gap-2 border border-ink/30 bg-white px-4 text-sm font-medium text-ink transition duration-(--duration-micro) hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff] disabled:opacity-50";

// Fix-Runde 1 (F2, P0): Ohne Versand-Freigabe im Produktions-Build kein Formular
// mit Sperrhinweis mehr (Sackgasse), sondern die Übergabe an die Beratungsanfrage
// (wie beim Sofaplaner). Im Dev-Server zeigt ?uebergabe=1 diese Ansicht.
const PROD_HANDOFF = process.env.NODE_ENV === "production" && !sendReleased();
const noopSubscribe = () => () => {};
function handoffSnapshot() {
  if (PROD_HANDOFF) return true;
  try {
    return new URLSearchParams(window.location.search).get("uebergabe") === "1";
  } catch {
    return false;
  }
}

function isDryRun() {
  const q = new URLSearchParams(window.location.search);
  // Entwicklung: nie echt senden, außer ausdrücklich mit ?senden=1.
  if (process.env.NODE_ENV !== "production") return q.get("senden") !== "1";
  // QM R2 P2-2: Produktion sendet erst nach Freigabe (Datenschutz-Abschnitt „Online-Planer“).
  if (!sendReleased()) return true;
  return q.get("dryrun") === "1";
}

// Rat 9,5 B2 (T2): `calendar` (Server: ownCalendarActive()) – „Termin mit diesem Plan“ auf /termin, sonst auf die Beratung.
export default function ResultPanel({ plan, kitchen, price, warnings, hasErrors = false, shareUrl, calendar = false, apiRef, view3dReady, onLoad, compare = null }) {
  const tr = useKpT();
  const loc = tr.locale;
  const dateLoc = DATE_LOCALE[loc] || "de-AT";
  const savesRaw = useSyncExternalStore(subscribeSaves, savesSnapshot, () => "[]");
  const saves = useMemo(() => {
    void savesRaw;
    return typeof window === "undefined" ? [] : readSaves();
  }, [savesRaw]);
  const [saveName, setSaveName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [showBom, setShowBom] = useState(false);
  const code = encodePlan(plan);
  const printHref = `/${loc}/kuechenplaner/druck?k=${code}`;
  const saveLocal = () => {
    const name = saveName.trim().slice(0, 60) || tr("Planung {v}", { v: new Date().toLocaleDateString(dateLoc) });
    const next = [{ name, k: code, at: Date.now() }, ...readSaves().filter((x) => x.name !== name)];
    if (writeSaves(next)) {
      setSaveMsg(tr("„{v}“ in diesem Browser gespeichert.", { v: name }));
      setSaveName("");
    } else setSaveMsg(tr("Speichern ist in diesem Browser nicht möglich (privater Modus?). Nutzen Sie den Link."));
  };
  const [shot, setShot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({ vorname: "", nachname: "", email: "", telefon: "", step1: STEP1[1], step2: STEP2[0], notiz: "", consent: false });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: "idle", msg: "", preview: null });
  const formRef = useRef(null);
  const [focusTick, setFocusTick] = useState(0);
  // Geräte-Index nur laden, wenn ein Katalogmodell gewählt ist (Namen in Zusammenfassung, Stückliste, Übergabe).
  const hasGeraete = Object.values(plan.runs || {}).some((run) => (run || []).some((m) => m.d?.some(Boolean)));
  const { map: geraete } = useGeraeteIndex(hasGeraete);
  // Lead-Übergabe: freiwillige Eckdaten (Zeitraum, Gerätewunsch …) als eine Zeile
  // „Eckdaten: …“ hinter der Planung – gehen mit Übergabe, Plantext und Anfrage mit.
  const [eck, setEck] = useState(EMPTY_ECKDATEN);
  const eckGeraete = eck.geraete ?? [];
  // linesDe: Anfragetext ans Studio (Backoffice, deutsch); lines: Anzeige in der Sprache der Seite.
  const linesDe = [...summaryLines(plan, geraete), ...eckdatenLines({ ...eck, geraete: eckGeraete })];
  const lines = linesDe.map((l) => tr(l));
  const handoff = useSyncExternalStore(noopSubscribe, handoffSnapshot, () => PROD_HANDOFF);
  const [copiedText, setCopiedText] = useState(false);
  const copySummary = async () => {
    const text = handoffSummary({ lines: linesDe, shareUrl, t: tr });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      window.prompt(tr("Plantext kopieren:"), text);
    }
  };

  // Nach dem Rendern der Fehler: Fokus auf das erste fehlerhafte Feld (P2-7) und so
  // scrollen, dass es unter Header + angehefteter Ansicht sichtbar ist. Manuell statt
  // über focus(), weil WebKit beim Fokussieren scroll-margin nicht berücksichtigt.
  useEffect(() => {
    if (!focusTick) return;
    const el = formRef.current?.querySelector('[aria-invalid="true"]');
    if (!el) return;
    el.focus({ preventScroll: true });
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    const header = document.querySelector("header")?.offsetHeight || 0;
    const sticky = desktop ? 0 : document.querySelector("[data-kp-root] > div.sticky")?.offsetHeight || 0;
    // R6: 40 px statt 16 px Luft, damit das Label über dem Feld sichtbar bleibt (mobil und Desktop)
    const target = header + sticky + 40;
    const top = el.getBoundingClientRect().top;
    const bottomLimit = window.innerHeight - (desktop ? 24 : 96);
    if (top < target || top > bottomLimit) window.scrollBy({ top: top - target });
  }, [focusTick]);

  // Lead-Übergabe: Das Bild gehört zu genau einer Planung (Teilen-Code). Wurde
  // nach dem Bild weitergeplant, entsteht beim Senden ein neues – sonst sähe das
  // Studio ein Bild, das nicht zur Konfiguration passt.
  const shotCode = useRef("");
  // Eine gespeicherte Planung je Teilen-Code: Ein zweiter Sendeversuch (Tippfehler,
  // 429, Netz) legt keine weitere Kopie auf dem Server ab (Datenminimierung, Quote).
  const savedPlan = useRef({ code: "", ref: "" });
  const capture = () => {
    const url = apiRef.current?.capture?.();
    if (url) {
      shotCode.current = code;
      setShot(url);
      trackEvent("kuechenplaner_screenshot");
    }
    return url || null;
  };

  const mailHref = shareUrl ? planMailHref(shareUrl, { t: tr }) : null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(tr("Link kopieren:"), shareUrl);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: tr("Meine Küchenplanung – Platzhirsch"), url: shareUrl });
        return;
      } catch {
        /* abgebrochen → kopieren */
      }
    }
    copy();
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const guard = useFormGuard();
  const submit = async (e) => {
    e.preventDefault();
    const formEl = e.currentTarget; // nach dem ersten await ist currentTarget null (Honeypot lesen)
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const errs = {};
      for (const i of parsed.error.issues) errs[i.path[0]] ??= i.message;
      setErrors(errs);
      setState({ status: "error", msg: tr("Bitte prüfen Sie die markierten Felder."), preview: null });
      setFocusTick((n) => n + 1);
      return;
    }
    setErrors({});
    setState({ status: "sending", msg: tr("Wird gesendet …"), preview: null });

    // 1) Planung (ohne Kontaktdaten) speichern, damit das Studio Bild + Konfiguration hat.
    //    Im Testmodus wird nichts gespeichert (P3-2).
    const dry = isDryRun();
    let ref = dry ? "\nPlan-ID: (Testmodus – nicht gespeichert)" : "";
    if (!dry && savedPlan.current.code === code) ref = savedPlan.current.ref;
    else if (!dry) {
      try {
        const image = view3dReady ? (shot && shotCode.current === code ? shot : capture()) : null;
        const res = await fetchWithTimeout("/api/labs/kuechenplaner/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, consent: true, ...(image ? { image } : {}) }),
        }, 15000);
        if (res.ok) {
          const j = await res.json();
          ref = `\nPlan-ID: ${j.id}${j.imagePath ? `\nScreenshot: ${window.location.origin}${j.imagePath}` : ""}`;
          savedPlan.current = { code, ref };
        }
      } catch {
        /* Speichern optional – Anfrage geht trotzdem raus */
      }
    }

    // 2) Anfrage im Format der bestehenden Beratungs-Route.
    const d = parsed.data;
    const text = [
      "Küchenplanung aus dem 3D-Küchenplaner",
      `Projekt: ${PROJEKT_LABEL[d.step1] || d.step1}`,
      ...linesDe,
      // QM R2 P2-1: Betrag nur mit freigegebener Preistabelle
      price.visible ? `${price.label}: ${formatEUR(price.min)} – ${formatEUR(price.max)} (unverbindlich)` : "",
      `Planung öffnen: ${shareUrl}${ref}`,
      d.notiz ? `\nNachricht: ${d.notiz}` : "",
      loc !== "de" ? `Sprache der Anfrage: ${loc.toUpperCase()}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const payload = {
      bei_meiner_anfrage_geht_es_um: TOPIC_KUECHE,
      das_projekt_soll_verwirklicht_werden: d.step2,
      bitte_beschreiben_sie_ihr_vorhaben: text,
      vorname: d.vorname,
      nachname: d.nachname,
      email: d.email,
      telefon: d.telefon,
    };

    if (dry) {
      setState({ status: "dry", msg: tr("Testmodus: Die Anfrage wurde NICHT gesendet. So sähe sie aus:"), preview: payload });
      return;
    }
    // R2: Fehlertext immer deutsch aus dem `code` der Route (nie deren englisches `error`).
    // postForm hängt den Herkunft-Block an und merkt sich lead_ref für trackLead.
    let timedOut = false;
    // R4: Zeitlimit 25 s – ohne Antwort sonst endloses "Wird gesendet …".
    const fetchImpl = (url, init) =>
      fetchWithTimeout(url, init, 25000).catch((err) => {
        if (err instanceof LabsTimeoutError) timedOut = true;
        throw err;
      });
    const r = await postForm("/api/beratung_anfrage", guard(payload, formEl), { fetchImpl });
    if (!r.ok && r.code === "network") {
      const msg = timedOut ? describeRequestError({ status: 504 }).message : describeRequestError({ network: true }).message;
      setState({ status: "error", msg: tr(msg), preview: null });
      return;
    }
    if (!r.ok) {
      const e = describeRequestError({ status: r.status, body: r.data });
      if (e.field) {
        setErrors({ [e.field]: tr("Bitte prüfen Sie diese Angabe.") });
        setFocusTick((n) => n + 1);
      }
      setState({ status: "error", msg: tr(e.message), preview: null });
      return;
    }
    trackLead("kuechenplaner");
    setState({ status: "sent", msg: tr("Danke! Ihre Planung ist bei uns angekommen. Wir melden uns persönlich bei Ihnen."), preview: null });
  };

  const field = (k, label, props = {}) => (
    <div>
      {/* Fehlertext außerhalb des Labels: der Feldname bleibt kurz, der Fehler hängt per aria-describedby dran */}
      <label htmlFor={`kp-f-${k}`} className="block text-sm text-ink">{label}</label>
      <input id={`kp-f-${k}`} className={input} value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `kp-err-${k}` : undefined} {...props} />
      {errors[k] && <p id={`kp-err-${k}`} className="mt-1 text-[0.8125rem] text-[#a3261b]">{tr(errors[k])}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      <section aria-labelledby="kp-sum">
        <h3 id="kp-sum" className="text-base font-semibold text-ink">{tr("Ihre Planung")}</h3>
        <ul className="mt-3 max-w-[70ch] space-y-1.5 text-sm text-ink/90">
          {lines.map((l) => (
            <li key={l} className="wrap-break-word">{kt(l)}</li>
          ))}
        </ul>
        {warnings.length > 0 && (
          <ul className={`mt-3 space-y-1 border-l-4 p-3 text-sm ${hasErrors ? "border-error bg-[#fbeee9] text-[#8a2a1f]" : "border-notice bg-[#f6efe2] text-ink"}`} role="status">
            {warnings.map((w) => <li key={w}>{tr(w)}</li>)}
          </ul>
        )}
      </section>

      <section aria-labelledby="kp-price" className="border border-ink/15 bg-white p-4">
        <h3 id="kp-price" className="text-xs uppercase tracking-[0.14em] text-gold-text">{tr(price.label)}</h3>
        {price.visible ? (
          <>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatEUR(price.min)} – {formatEUR(price.max)}</p>
            <table className="mt-3 w-full text-left text-xs text-ink/85">
              <caption className="sr-only">{tr("Zusammensetzung des Preisrahmens")}</caption>
              <tbody>
                {price.items.map((i) => (
                  <tr key={i.label} className="border-t border-ink/10">
                    <th scope="row" className="py-1.5 pr-2 font-normal">{tr(i.label)}</th>
                    <td className="py-1.5 text-right whitespace-nowrap">{formatEUR(i.range[0])} – {formatEUR(i.range[1])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-ink/75">
              {tr("Unverbindlicher Rahmen inkl. MwSt., kein Angebot. Den verbindlichen Preis erhalten Sie nach Aufmaß und Beratung.")}
            </p>
          </>
        ) : (
          // QM R2 P2-1: ohne freigegebene Preistabelle keine Zahlen
          <p className="mt-2 text-sm text-ink/85" data-testid="kp-price-hidden">{tr(PRICE_HIDDEN_TEXT)}</p>
        )}
      </section>

      <section aria-labelledby="kp-share" className="space-y-3">
        <h3 id="kp-share" className="text-base font-semibold text-ink">{tr("Bild & Link")}</h3>
        {/* Optik-QA: gleich breite Buttons je Zeile statt Flatterrand (mobil untereinander) */}
        <div className="flex flex-wrap gap-2 [&>*]:flex-1 [&>*]:basis-[13rem]">
          <button type="button" className={btnLight} onClick={capture} disabled={!view3dReady}>
            <Camera size={16} aria-hidden="true" /> {tr("Bild der 3D-Ansicht")}
          </button>
          <button type="button" className={btnLight} onClick={share}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {tr(copied ? "Link kopiert" : "Planung teilen")}
          </button>
          {/* Lead-Übergabe: Später weiterplanen – Link im eigenen Mailprogramm an sich selbst (kein Versand, kein Speichern bei uns) */}
          {mailHref && (
            <a href={mailHref} className={btnLight} onClick={() => trackEvent("kuechenplaner_link_mail")} data-kp-mail-link="">
              <Mail size={16} aria-hidden="true" /> {tr("Link an mich mailen")}
            </a>
          )}
        </div>
        <p className="text-[0.8125rem] text-ink/75">
          {tr(view3dReady ? "Das Bild zeigt immer die Gesamtansicht von vorne – unabhängig davon, wie Sie die Ansicht gerade gedreht haben." : "Für ein Bild bitte die 3D-Ansicht öffnen.")}
        </p>
        {shot && (
          <figure className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt={tr("Bild Ihrer Küchenplanung aus der 3D-Ansicht")} className="w-full border border-ink/10" />
            <a href={shot} download="kuechenplanung-platzhirsch.jpg" className={btnLight}>
              <Download size={16} aria-hidden="true" /> {tr("Bild herunterladen")}
            </a>
          </figure>
        )}
        <p className="text-[0.8125rem] text-ink/75">{tr("Der Link enthält Ihre komplette Planung – ohne persönliche Daten.")}</p>
      </section>

      <section aria-labelledby="kp-save" className="space-y-3">
        <h3 id="kp-save" className="text-base font-semibold text-ink">{tr("Speichern & drucken")}</h3>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="kp-save-name" className="sr-only">{tr("Name der Planung")}</label>
          <input id="kp-save-name" className={`${input} mt-0 basis-full`} placeholder={tr("Name, z. B. Variante Insel")} value={saveName} maxLength={60} onChange={(e) => setSaveName(e.target.value)} />
          <button type="button" className={`${btnLight} flex-1 basis-[13rem]`} onClick={saveLocal}>
            <Save size={16} aria-hidden="true" /> {tr("Im Browser speichern")}
          </button>
          <a href={printHref} target="_blank" rel="noopener" className={`${btnLight} flex-1 basis-[13rem]`}>
            <Printer size={16} aria-hidden="true" /> {tr("Druckansicht / PDF")}
          </a>
        </div>
        {saveMsg && <p className="text-[0.8125rem] text-ink" role="status">{saveMsg}</p>}
        {saves.length > 0 && (
          <ul className="divide-y divide-ink/10 border-y border-ink/10 text-sm">
            {saves.map((x) => (
              <li key={x.name + x.at} className="flex items-center gap-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-ink">{x.name} <span className="text-[0.8125rem] text-ink/70">· {new Date(x.at).toLocaleDateString(dateLoc)}</span></span>
                <button
                  type="button"
                  className={btnLight}
                  onClick={() => {
                    const p = decodePlan(x.k);
                    if (p) {
                      onLoad?.(p);
                      setSaveMsg(tr("„{v}“ geladen – mit Rückgängig kommen Sie zurück.", { v: x.name }));
                    } else setSaveMsg(tr("Diese Planung lässt sich nicht mehr öffnen."));
                  }}
                >
                  <FolderOpen size={16} aria-hidden="true" /> {tr("Öffnen")}
                </button>
                <button
                  type="button"
                  className={btnLight}
                  aria-label={tr("{v} löschen", { v: x.name })}
                  onClick={() => {
                    const next = readSaves().filter((y) => !(y.name === x.name && y.at === x.at));
                    writeSaves(next);
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[0.8125rem] text-ink/75">{tr("Gespeichert wird nur in diesem Browser. Die Druckansicht enthält Grundriss mit Maßen, Wandansichten, Prüfung und Stückliste – als PDF über „Drucken“.")}</p>
      </section>

      {/* Feinschliff (P3-9): Varianten A/B nebeneinander, direkt nach „Speichern“ */}
      {compare}

      <section aria-labelledby="kp-bom" className="space-y-2">
        <h3 id="kp-bom" className="text-base font-semibold text-ink">{tr("Stückliste")}</h3>
        {showBom ? (
          <BomTable plan={plan} kitchen={kitchen} geraete={geraete} t={tr} />
        ) : (
          <button type="button" className={btnLight} onClick={() => setShowBom(true)} aria-expanded="false">
            {tr("Stückliste mit Positionen anzeigen")}
          </button>
        )}
      </section>

      <section aria-labelledby="kp-req">
        <h3 id="kp-req" tabIndex={-1} className="text-base font-semibold text-ink focus:outline-none">{tr("Planung anfragen")}</h3>
        <p className="mt-1 text-sm text-ink/80">{tr("Wir prüfen Ihre Planung, messen auf Wunsch vor Ort auf und melden uns persönlich.")}</p>
        {/* Lead-Übergabe: freiwillige Eckdaten – außerhalb des Formulars, gelten auch für „Termin mit diesem Plan“ */}
        <fieldset className="mt-4 min-w-0 space-y-3 border border-ink/15 p-3" data-kp-eckdaten="">
          <legend className="px-1 text-sm font-medium text-ink">{tr("Für die Beratung (freiwillig)")}</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3">
            {/* Ohne Freigabe fragt das Formular unten selbst nach Neubau/Renovierung – hier nur bei der Übergabe */}
            {handoff && (
              <label className="block text-sm text-ink">
                {tr("Projekt")}
                <select className={input} value={eck.projekt} onChange={(e) => setEck((x) => ({ ...x, projekt: e.target.value }))}>
                  <option value="">{tr("keine Angabe")}</option>
                  {PROJEKT.map((o) => <option key={o.k} value={o.k}>{tr(o.label)}</option>)}
                </select>
              </label>
            )}
            <label className="block text-sm text-ink">
              {tr("Umsetzung geplant")}
              <select className={input} value={eck.zeitraum} onChange={(e) => setEck((x) => ({ ...x, zeitraum: e.target.value }))}>
                <option value="">{tr("keine Angabe")}</option>
                {ZEITRAUM.map((o) => <option key={o.k} value={o.k}>{tr(o.label)}</option>)}
              </select>
            </label>
            {BUDGET_AKTIV && (
              <label className="block text-sm text-ink">
                {tr("Budgetrahmen")}
                <select className={input} value={eck.budget} onChange={(e) => setEck((x) => ({ ...x, budget: e.target.value }))}>
                  <option value="">{tr("keine Angabe")}</option>
                  {BUDGET.map((o) => <option key={o.k} value={o.k}>{tr(o.label)}</option>)}
                </select>
              </label>
            )}
          </div>
          <div role="group" aria-labelledby="kp-eck-geraete">
            <p id="kp-eck-geraete" className="text-sm text-ink">{tr("Gerätewunsch")}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {GERAETE_WAHL.map((g) => (
                <label key={g.id} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-ink"
                    checked={eckGeraete.includes(g.id)}
                    onChange={(e) => setEck((x) => ({ ...x, geraete: e.target.checked ? [...eckGeraete, g.id] : eckGeraete.filter((id) => id !== g.id) }))}
                  />
                  {g.name}
                </label>
              ))}
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={eck.unterlagen} onChange={(e) => setEck((x) => ({ ...x, unterlagen: e.target.checked }))} />
            {tr("Grundriss oder Fotos des Raums vorhanden")}
          </label>
          <p className="text-[0.8125rem] text-ink/75">{tr("Diese Angaben kommen mit Ihrer Anfrage zu uns; im Teilen-Link stehen sie nicht.")}</p>
        </fieldset>
        {/* Rat 9,5 B2: Termin mit Plan-Link (?plan=) – auch im Testmodus des Dev-Servers über dem Formular */}
        <p className="mt-4" data-kp-termin="">
          <a
            href={handoffHref({ locale: loc, lines: linesDe, shareUrl, calendar, t: tr })}
            className={btnDark}
            onClick={() => {
              storeHandoff(typeof window === "undefined" ? null : window.sessionStorage, { lines: linesDe, shareUrl, t: tr });
              trackEvent("kuechenplaner_termin");
            }}
            data-kp-termin-link=""
          >
            <Send size={16} aria-hidden="true" /> {tr("Termin mit diesem Plan")}
          </a>
        </p>
        {handoff ? (
          <div className="mt-4 space-y-3" data-kp-handoff="">
            <p className="text-sm text-ink/85">
              {tr("Harald Menghin skizziert Ihre Küche auf Wunsch zuerst von Hand – mit Ihrem Plan als Ausgangspunkt. Ihre Planung nehmen wir in die Beratungsanfrage mit.")}
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Ohne Kalender führt schon „Termin mit diesem Plan“ zur Beratung – dann kein zweiter Knopf mit demselben Ziel. */}
              {calendar && (
                <a
                  href={handoffHref({ locale: loc, lines: linesDe, shareUrl, t: tr })}
                  className={btnLight}
                  onClick={() => {
                    storeHandoff(typeof window === "undefined" ? null : window.sessionStorage, { lines: linesDe, shareUrl, t: tr });
                    trackEvent("kuechenplaner_uebergabe");
                  }}
                >
                  {tr("Mit dieser Planung Beratung anfragen")}
                </a>
              )}
              <button type="button" className={btnLight} onClick={copySummary}>
                {copiedText ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {tr(copiedText ? "Plantext kopiert" : "Plantext kopieren")}
              </button>
            </div>
            <p className="text-[0.8125rem] text-ink/75">{tr("Der Link zu Ihrer Planung enthält keine persönlichen Daten. Ihre Kontaktdaten geben Sie erst in der Beratungsanfrage an.")}</p>
          </div>
        ) : state.status === "sent" ? (
          <p className="ph-arrive mt-4 bg-[#eef3ea] p-4 text-sm text-[#2f4a26]" role="status">{state.msg}</p>
        ) : (
          <form ref={formRef} onSubmit={submit} noValidate className="mt-4 space-y-3">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3">
              {field("vorname", tr("Vorname"), { autoComplete: "given-name", required: true })}
              {field("nachname", tr("Nachname"), { autoComplete: "family-name", required: true })}
              {field("email", tr("E-Mail"), { type: "email", autoComplete: "email", required: true })}
              {field("telefon", tr("Telefon (optional)"), { type: "tel", autoComplete: "tel" })}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3">
              <label className="block text-sm text-ink">
                {tr("Projekt")}
                <select className={input} value={form.step1} onChange={set("step1")}>
                  {STEP1.map((o) => <option key={o} value={o}>{tr(PROJEKT_LABEL[o])}</option>)}
                </select>
              </label>
              <label className="block text-sm text-ink">
                {tr("Umsetzung")}
                <select className={input} value={form.step2} onChange={set("step2")}>
                  {STEP2.map((o) => <option key={o} value={o}>{tr(o)}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm text-ink">
              {tr("Nachricht (optional)")}
              <textarea className={`${input} min-h-24 py-2`} rows={3} maxLength={1500} value={form.notiz} onChange={set("notiz")} />
            </label>
            <label className="flex items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5 h-6 w-6 shrink-0 accent-ink"
                checked={form.consent}
                onChange={set("consent")}
                aria-invalid={Boolean(errors.consent)}
                aria-describedby={errors.consent ? "kp-consent-text kp-err-consent" : "kp-consent-text"}
              />
              <span id="kp-consent-text">
                {tr("Ich bin einverstanden, dass Platzhirsch Home Living meine Angaben, die Küchenkonfiguration und ein Bild der 3D-Ansicht zur Bearbeitung meiner Anfrage speichert und mich dazu kontaktiert. Konfiguration und Bild speichern wir höchstens 180 Tage. Widerruf jederzeit per E-Mail an info@platzhirsch.studio.")}{" "}
                {tr("Details in der")}{" "}
                <a href={`/${loc}/datenschutz`} className="underline underline-offset-2" target="_blank" rel="noopener">{tr("Datenschutzerklärung")}</a>.
              </span>
            </label>
            {errors.consent && <p id="kp-err-consent" className="text-[0.8125rem] text-[#a3261b]">{tr(errors.consent)}</p>}
            <Honeypot id="kp-website" />
            <button type="submit" className={btnDark} disabled={state.status === "sending"}>
              <Send size={16} aria-hidden="true" /> {tr("Planung anfragen")}
            </button>
            {state.msg && (
              <p className={`text-sm ${state.status === "error" ? "text-[#a3261b]" : "text-ink"}`} role={state.status === "error" ? "alert" : "status"}>
                {state.msg}
              </p>
            )}
            {state.preview && (
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap wrap-break-word bg-[#f2efe9] p-3 text-xs text-ink" data-testid="kp-dryrun">
                {JSON.stringify(state.preview, null, 2)}
              </pre>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
