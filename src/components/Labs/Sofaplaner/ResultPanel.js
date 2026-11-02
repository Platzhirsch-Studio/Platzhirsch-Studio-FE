"use client";
import { useId, useMemo, useRef, useState } from "react";
import { SOURCE_COPY } from "../../../lib/sofaplaner/consent.js";
import * as z from "./zod-mini.js"; // zod/mini: nur genutzte Prüfungen im Browser-Bundle (Tempo, 30.10.2026)
import { useTranslations } from "next-intl";
import { fetchWithTimeout, netErrorText, netTexts } from "../net.js";
import { Check, Copy, Heart, Link2, Send, Trash2 } from "lucide-react";
import { planToText } from "./model";
import { LIST_KEY, parseList, useStoredRaw, writeRaw } from "./storage";
import s from "./sofaplaner.module.css";
import { sendReleased } from "../Kuechenplaner/release";
import { LEAD_LAND, LEAD_ZEIT, handoffHref, handoffName, leadLines, leadOptions, storeHandoff } from "../../../lib/sofaplaner/handoff.js";
import { useT } from "./useT";

// Expertenrat P0-13/P0-14 (Integration 28.10.2026): in production the planner
// never shows a send button that sends nothing. Until real sending is released
// (NEXT_PUBLIC_LABS_PLANER_SENDEN=1, needs the privacy section "Online-Planer"),
// the plan is handed to the live Beratung form instead (prefilled via
// ?produkt=, the tested lead path). Development keeps the test mode for e2e.
const HANDOFF = process.env.NODE_ENV === "production" && !sendReleased();

// Same option labels as the Beratung form (src/messages/de.json → MultiStepForm).
const STEP1 = ["einen Neubau", "eine Renovierung", "Anderes"];
const STEP2 = ["in einem Einfamilienhaus", "in einer Wohnung", "in einer gewerblichen Immobilie"];

// Mirrors the checks of /api/beratung_anfrage and BeratungClient.
// zod/mini (Tempo, 30.10.2026): same rules as before (.trim().min().max() →
// check(trim, minLength, maxLength)). zod/mini has no built-in English texts,
// so the length limits carry their own message (before: zod's English default).
const textRule = (min, minMsg, max) => z.string().check(z.trim(), z.minLength(min, minMsg), z.maxLength(max, `Bitte höchstens ${max} Zeichen.`));
const anfrageSchema = z.object({
  bei_meiner_anfrage_geht_es_um: z.enum(STEP1, { error: "Bitte wählen Sie, worum es geht." }),
  das_projekt_soll_verwirklicht_werden: z.enum(STEP2, { error: "Bitte wählen Sie die Immobilie." }),
  bitte_beschreiben_sie_ihr_vorhaben: textRule(10, "Bitte mindestens 10 Zeichen.", 4000),
  vorname: textRule(1, "Vorname fehlt.", 80),
  nachname: textRule(1, "Nachname fehlt.", 80),
  email: z.string().check(z.trim(), z.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "E-Mail-Adresse prüfen.")),
  telefon: z.string().check(z.trim(), z.regex(/^[0-9+\-()\s]{6,20}$/, "Telefonnummer prüfen.")),
});

const MAX_LIST = 12;

// zod payload key -> form control name (order = order on screen)
const FIELD_OF = {
  bitte_beschreiben_sie_ihr_vorhaben: "message",
  bei_meiner_anfrage_geht_es_um: "step1",
  das_projekt_soll_verwirklicht_werden: "step2",
  vorname: "vorname",
  nachname: "nachname",
  email: "email",
  telefon: "telefon",
};
const ORDER = ["message", "step1", "step2", "vorname", "nachname", "email", "telefon", "consent"];

// Rat 9,5 B2: `calendar` (Server: ownCalendarActive()) → „Termin mit diesem Plan“ führt auf /termin, sonst auf die Beratung.
export default function ResultPanel({ plan, family, onLoad, calendar = false }) {
  const t = useTranslations();
  const T = useT();
  // English page: the enquiry text in English (same lines as planToText, model.js)
  // lead-mobil-i18n fix-04: freiwillige Angaben Zeitrahmen/Lieferland hängen am Plantext.
  const [lead, setLead] = useState({ zeit: "", land: "" });
  const base = (p, f, url) => (T.foreign ? planToText(p, f, url).split("\n").map((l) => T.dyn(l)).join("\n") : planToText(p, f, url));
  const planText = (p, f, url) => [base(p, f, url), ...leadLines(lead, T.locale)].join("\n");
  const listRaw = useStoredRaw(LIST_KEY);
  // fix-05: only well-formed entries (old or broken ones would crash the list below)
  const list = useMemo(() => parseList(listRaw), [listRaw]);
  const [share, setShare] = useState({ state: "idle", url: "", error: "" });
  const [copied, setCopied] = useState("");
  const [form, setForm] = useState({ step1: "", step2: "", vorname: "", nachname: "", email: "", telefon: "", consent: false });
  const [message, setMessage] = useState(null); // null = use generated text
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const uid = useId();
  const idOf = (name) => `${uid}-${name}`;
  const errProps = (name) =>
    errors[name] ? { "aria-invalid": true, "aria-describedby": `${idOf(name)}-err` } : { "aria-invalid": undefined };
  const errText = (name) =>
    errors[name] ? (
      <span id={`${idOf(name)}-err`} className={s.fieldErr}>
        {T(errors[name])}
      </span>
    ) : null;
  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // fix-05: a link belongs to the plan it was made for – after a change it is
  // neither shown nor put into the enquiry/handoff (it would show the old plan).
  const planKey = useMemo(() => JSON.stringify(plan), [plan]);
  const shareUrl = share.state === "done" && share.key === planKey ? share.url : "";
  const text = planText(plan, family, shareUrl);
  const msg = message ?? text;

  const saveToList = () => {
    const entry = { id: Date.now().toString(36), savedAt: new Date().toISOString(), plan };
    const next = [entry, ...list.filter((e) => JSON.stringify(e.plan) !== JSON.stringify(plan))].slice(0, MAX_LIST);
    writeRaw(LIST_KEY, JSON.stringify(next));
  };
  const removeFromList = (id) => writeRaw(LIST_KEY, JSON.stringify(list.filter((e) => e.id !== id)));

  const copy = async (value, what) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
    }
  };

  // Teilen-Link anlegen (Rückgabe: URL oder ""). quiet: ohne Teilen-Dialog (Übergabe).
  const makeShare = async ({ quiet = false } = {}) => {
    const key = planKey;
    setShare({ state: "loading", url: "", error: "" });
    try {
      const res = await fetchWithTimeout("/de/sofaplaner/teilen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, locale: T.locale }),
      }, 15000);
      const data = await res.json();
      // lead-mobil-i18n fix-05: die Route antwortet deutsch – auf /en die eigene Meldung.
      if (!res.ok) throw new Error(T.foreign ? T("Link konnte nicht erstellt werden.") : data.error || T("Fehler"));
      setShare({ state: "done", url: data.url, error: "", key });
      if (!quiet && navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        navigator.share({ title: T("Mein Sofaplan"), url: data.url }).catch(() => {});
      }
      return data.url;
    } catch (e) {
      // fix-05: bei der Übergabe (quiet) kein Alarm kurz vor dem Seitenwechsel –
      // der Plantext geht über sessionStorage mit, die Seite wechselt ohnehin.
      if (quiet) {
        setShare({ state: "idle", url: "", error: "" });
        return "";
      }
      // R4: offline/Zeitüberschreitung/HTML-Fehlerseite → deutsche Meldung statt "Failed to fetch".
      setShare({ state: "error", url: "", error: netErrorText(e, T("Link konnte nicht erstellt werden."), T.net || netTexts(t)) });
      return "";
    }
  };
  const createShare = () => makeShare();

  // R5 ux P2-5: Übergabe an die Beratung ohne Planverlust – Teilen-Link
  // automatisch erzeugen, in ?produkt= mitgeben (landet in der Nachricht) und
  // die Zusammenfassung wie beim Küchenplaner in sessionStorage ablegen.
  // UX-Benchmark P1-4: Modellname immer im Kurztext (vorher „Minotti-Sofa: Mein Sofa, 3 Elemente“).
  const handoffBase = { locale: T.locale, name: handoffName(plan?.name, family?.name), count: plan?.items?.length || 0, calendar };
  const [handoffBusy, setHandoffBusy] = useState(false);
  const handoffGo = (cal) => async (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // neuer Tab: einfache URL
    e.preventDefault();
    if (handoffBusy) return;
    setHandoffBusy(true);
    const link = shareUrl || (await makeShare({ quiet: true }));
    let storage = null;
    try {
      storage = window.sessionStorage;
    } catch {
      /* gesperrt */
    }
    storeHandoff(storage, { text: planText(plan, family, link), shareUrl: link, locale: T.locale });
    window.location.assign(handoffHref({ ...handoffBase, calendar: cal, shareUrl: link }));
  };

  const prepare = (e) => {
    e.preventDefault();
    const payload = {
      bei_meiner_anfrage_geht_es_um: form.step1,
      das_projekt_soll_verwirklicht_werden: form.step2,
      bitte_beschreiben_sie_ihr_vorhaben: msg,
      vorname: form.vorname,
      nachname: form.nachname,
      email: form.email,
      telefon: form.telefon,
    };
    const parsed = anfrageSchema.safeParse(payload);
    const next = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const name = FIELD_OF[issue.path[0]];
        if (name && !next[name]) next[name] = issue.message;
      }
    }
    if (!form.consent) next.consent = "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.";
    setErrors(next);
    const first = ORDER.find((n) => next[n]);
    if (first) {
      setResult({ ok: false, count: Object.keys(next).length });
      // move focus to the first invalid control
      requestAnimationFrame(() => formRef.current?.querySelector(`[name="${first}"]`)?.focus());
      return;
    }
    // Labs: NOT sent. Live this would be
    // fetch("/api/beratung_anfrage", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(parsed.data) })
    setResult({ ok: true, payload: parsed.data });
  };

  const field = (key, label, type = "text", autoComplete) => (
    <label className={s.field}>
      <span>{T(label)}</span>
      <input
        type={type}
        name={key}
        value={form[key]}
        autoComplete={autoComplete}
        onChange={(e) => update(key, e.target.value)}
        className={s.input}
        {...errProps(key)}
      />
      {errText(key)}
    </label>
  );

  return (
    <div className={s.stack}>
      {/* Rat 9,5 B2: „Termin mit diesem Plan“ immer (auch im Testmodus des Dev-Servers über dem Formular).
          UX-Benchmark P1: die Übergabe an den Showroom steht ZUERST – sie ist das Ziel des Planers;
          Merkliste und Teilen-Link folgen als Nebenwege (wie „find a dealer“ vor „Save“ bei den Herstellern). */}
      {(
        <div className={s.stack} data-sofa-handoff="">
          <h4 className={s.h4}>{T("Planung im Showroom besprechen")}</h4>
          <p className={s.small}>
            {T("Wir sehen uns Ihren Plan gemeinsam an, mit Stoff- und Ledermustern und Probesitzen im Showroom in Lochau. Auf Wunsch zeichnet Harald Menghin, wie das Sofa in Ihrem Raum steht.")}
          </p>
          <p id={idOf("lead")} className={s.small}>{T("Für das Gespräch (freiwillig, geht mit dem Plantext mit)")}</p>
          <div className={s.grid2} role="group" aria-labelledby={idOf("lead")} data-sofa-lead="">
            {[
              ["zeit", "Zeitrahmen", LEAD_ZEIT],
              ["land", "Lieferung nach", LEAD_LAND],
            ].map(([key, label, list]) => (
              <label key={key} className={s.field}>
                <span>{T(label)}</span>
                <select name={`lead-${key}`} className={s.input} value={lead[key]} onChange={(e) => setLead((l) => ({ ...l, [key]: e.target.value }))}>
                  <option value="">{T("Bitte wählen")}</option>
                  {leadOptions(list, T.locale).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className={s.btnRow}>
            <a className={s.btnPrimary} href={handoffHref(handoffBase)} onClick={handoffGo(calendar)} aria-busy={handoffBusy || undefined} data-sofa-handoff-link="">
              <Send size={16} aria-hidden="true" /> {T(handoffBusy ? "Plan wird übergeben …" : "Termin mit diesem Plan")}
            </a>
            {/* Rat 9,5 B1/B2: mit Kalender zweites, eigenes Wort für die schriftliche Anfrage */}
            {calendar && (
              <a className={s.btnGhost} href={handoffHref({ ...handoffBase, calendar: false })} onClick={handoffGo(false)} data-sofa-handoff-schreiben="">
                {T("Lieber schreiben")}
              </a>
            )}
            <button type="button" className={s.btnGhost} onClick={() => copy(msg, "text")}>
              {copied === "text" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {T(copied === "text" ? "Kopiert" : "Plantext kopieren")}
            </button>
          </div>
          <p className={s.small}>{T("Ihr Plan geht als Link mit in die Anfrage – er liegt beim Termin bereit. Der Link speichert nur den Plan, keine persönlichen Daten.")}</p>
        </div>
      )}

      <div className={s.btnRow}>
        <button type="button" className={s.btn} onClick={saveToList}>
          <Heart size={16} aria-hidden="true" /> {T("Auf die Merkliste")}
        </button>
        <button type="button" className={s.btn} onClick={createShare} disabled={share.state === "loading"}>
          <Link2 size={16} aria-hidden="true" /> {T(share.state === "loading" ? "Link wird erstellt …" : "Teilen-Link erstellen")}
        </button>
      </div>

      {shareUrl && (
        <div className={s.shareBox}>
          <label className={s.field}>
            <span>{T("Ihr Link (zeigt diesen Plan, ohne persönliche Daten)")}</span>
            <input readOnly value={shareUrl} className={s.input} onFocus={(e) => e.target.select()} />
          </label>
          <button type="button" className={s.btnGhost} onClick={() => copy(shareUrl, "link")}>
            {copied === "link" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {T(copied === "link" ? "Kopiert" : "Kopieren")}
          </button>
        </div>
      )}
      {share.state === "error" && (
        <p role="alert" className={s.err}>
          {share.error}
        </p>
      )}

      {list.length > 0 && (
        <div>
          <h4 className={s.h4}>{T("Merkliste (nur in diesem Browser)")}</h4>
          <ul className={s.list}>
            {list.map((e) => (
              <li key={e.id} className={s.listItem}>
                <button type="button" className={s.linkBtn} onClick={() => onLoad(e.plan)}>
                  {e.plan.name || "Sofa"} · {e.plan.family} · {T("{n} Elemente", { n: e.plan.items.length })} · {new Date(e.savedAt).toLocaleDateString(T.dateLocale)}
                </button>
                <button type="button" className={s.iconBtn} onClick={() => removeFromList(e.id)} aria-label={T("{name} von der Merkliste entfernen", { name: e.plan.name || "Sofa" })}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!HANDOFF && (
      <form className={s.stack} onSubmit={prepare} noValidate ref={formRef}>
        <h4 className={s.h4}>{T("Anfrage direkt vorbereiten (Testmodus)")}</h4>
        <p className={s.small}>{T("Wir sehen uns Ihren Plan gemeinsam an, mit Stoff- und Ledermustern und Probesitzen im Showroom in Lochau.")}</p>
        <label className={s.field}>
          <span>{T("Text der Anfrage (aus Ihrem Plan erzeugt, frei änderbar)")}</span>
          <textarea
            name="message"
            className={s.textarea}
            rows={9}
            value={msg}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errors.message) setErrors((x) => ({ ...x, message: undefined }));
            }}
            {...errProps("message")}
          />
          {errText("message")}
        </label>
        <div className={s.btnRow}>
          <button type="button" className={s.btnGhost} onClick={() => copy(msg, "text")}>
            {copied === "text" ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {T(copied === "text" ? "Kopiert" : "Text kopieren")}
          </button>
          {message !== null && (
            <button type="button" className={s.btnGhost} onClick={() => setMessage(null)}>
              {T("Text neu aus Plan erzeugen")}
            </button>
          )}
        </div>
        <div className={s.grid2}>
          <label className={s.field}>
            <span>{T("Bei meiner Anfrage geht es um")}</span>
            <select name="step1" className={s.input} value={form.step1} onChange={(e) => update("step1", e.target.value)} {...errProps("step1")}>
              <option value="">{T("Bitte wählen")}</option>
              {STEP1.map((o) => (
                <option key={o} value={o}>{T(o)}</option>
              ))}
            </select>
            {errText("step1")}
          </label>
          <label className={s.field}>
            <span>{T("Das Projekt soll verwirklicht werden")}</span>
            <select name="step2" className={s.input} value={form.step2} onChange={(e) => update("step2", e.target.value)} {...errProps("step2")}>
              <option value="">{T("Bitte wählen")}</option>
              {STEP2.map((o) => (
                <option key={o} value={o}>{T(o)}</option>
              ))}
            </select>
            {errText("step2")}
          </label>
          {field("vorname", "Vorname", "text", "given-name")}
          {field("nachname", "Nachname", "text", "family-name")}
          {field("email", "E-Mail", "email", "email")}
          {field("telefon", "Telefon", "tel", "tel")}
        </div>
        <label className={s.check}>
          <input type="checkbox" name="consent" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} {...errProps("consent")} />
          {/* Test mode only (never in production, HANDOFF). English wording: proposal, see qa-screenshots/welle2/en-yacht-sofa-bau.md (legal review). */}
          <span>
            {T("Ich bin einverstanden, dass Platzhirsch Home Living meine Angaben und den Plan zur Bearbeitung meiner Anfrage verwendet. Teilen-Links speichern nur den Plan und gelten 180 Tage. Details in der")}{" "}
            <a href={`/${T.locale}/datenschutz`} target="_blank" rel="noopener">
              {T("Datenschutzerklärung")}
            </a>
            {T(". Die Einwilligung kann jederzeit widerrufen werden.")}
          </span>
        </label>
        {errText("consent")}
        {result && !result.ok && (
          <p role="alert" className={s.err}>
            {T(result.count === 1 ? "Bitte prüfen Sie die markierte Angabe." : "Bitte prüfen Sie die {n} markierten Angaben.", { n: result.count })}
          </p>
        )}
        <button type="submit" className={s.btnPrimary}>
          <Send size={16} aria-hidden="true" /> {T("Anfrage vorbereiten")}
        </button>
        <p className={s.small}>{T("Testmodus: Die Anfrage wird nicht abgeschickt und nicht gespeichert. Ihre Kontaktdaten verlassen diesen Browser nicht.")}</p>
      </form>
      )}

      {!HANDOFF && result?.ok && (
        <div role="status" className={s.okBox}>
          <p>
            <strong>{T("Bereit.")}</strong> {T("Im Livebetrieb ginge diese Anfrage per")} <code>POST /api/beratung_anfrage</code> {T("an das Studio. Im Testmodus wurde nichts gesendet.")}
          </p>
          <pre className={s.pre}>{JSON.stringify(result.payload, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
