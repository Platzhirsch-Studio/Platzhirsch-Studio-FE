"use client";
import { useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/portal/format";
import TagebuchBild from "./TagebuchBild";
import ReferenzVorschau from "./ReferenzVorschau";
import { tagebuchT } from "./texte";

const feld = "min-h-11 w-full border border-pebble bg-white px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const legend = "font-display text-lg text-ink sm:text-xl";
const nieAendern = () => () => {};

// „Als Referenz freigeben“: 1. Bilder wählen → 2. Nennung → 3. Vorschau → 4. Einwilligung.
// Alles auf einer Seite (kein versteckter Schritt), Vorschau aktualisiert sich live.
// Bestehende Freigaben mit Status und Widerruf stehen darüber.
export default function ReferenzFreigabe({ projektId, fotos, freigaben, aktiv, entwurf, einwilligung, max }) {
  const s = tagebuchT(useTranslations());
  const router = useRouter();
  const id = useId();
  const [auswahl, setAuswahl] = useState([]);
  const [art, setArt] = useState("anonym");
  const [vorname, setVorname] = useState("");
  const [ort, setOrt] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState(null);
  // Bedienbar erst nach der Hydration (kontrollierte Checkboxen): data-bereit zeigt es an,
  // Tests warten darauf statt auf eine feste Zeit (Prüfung Technik tagebuch:142).
  const bereit = useSyncExternalStore(nieAendern, () => true, () => false);
  const aktive = freigaben.filter((f) => f.status === "eingereicht" || f.status === "veroeffentlicht");
  const gewaehlt = auswahl.map((fid) => fotos.find((f) => f.id === fid)).filter(Boolean);
  const anzeige = art === "vorname_ort" ? { art, vorname: vorname.trim(), ort: ort.trim() } : { art: "anonym" };

  const umschalten = (fid) =>
    setAuswahl((a) => (a.includes(fid) ? a.filter((x) => x !== fid) : a.length >= max ? a : [...a, fid]));

  async function senden(e) {
    e.preventDefault();
    if (!gewaehlt.length) return setMeldung({ ok: false, text: s("refNeedPhotos") });
    setBusy(true);
    setMeldung(null);
    const res = await fetch(`/api/portal/tagebuch/${encodeURIComponent(projektId)}/freigabe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotoIds: auswahl, anzeige: art, vorname: anzeige.vorname || "", ort: anzeige.ort || "", einwilligung: ok, version: einwilligung.version }),
    }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setMeldung({ ok: true, text: s("refSent") });
      setAuswahl([]);
      setOk(false);
      router.refresh();
    } else setMeldung({ ok: false, text: body?.error || s("refFailed") });
  }

  async function widerrufen(fid) {
    if (!window.confirm(s("refRevokeConfirm"))) return;
    const res = await fetch(`/api/portal/tagebuch/${encodeURIComponent(projektId)}/freigabe?id=${fid}`, { method: "DELETE" }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setMeldung(res?.ok ? { ok: true, text: s("refRevoked") } : { ok: false, text: body?.error || s("refFailed") });
    if (res?.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 id={`${id}-t`} className="font-display text-2xl text-ink sm:text-3xl">
          {s("refTitle")}
        </h2>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink/85">{s("refIntro")}</p>
        {entwurf && aktiv && <p className="mt-3 border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-ink">{s("refDraft")}</p>}
      </div>

      {freigaben.length > 0 && (
        <section aria-labelledby={`${id}-bestand`}>
          <h3 id={`${id}-bestand`} className="text-base font-semibold text-ink">
            {s("refExisting")}
          </h3>
          <ul className="mt-2 divide-y divide-ink/10 border-y border-ink/10">
            {freigaben.map((f) => (
              <li key={f.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <p className="font-semibold text-ink">{s(`refStatus_${f.status}`)}</p>
                  <p className="text-xs text-ink/70">
                    {s("refGiven", { datum: formatDate(f.einwilligung.zeitpunkt), version: s("refConsentVersion", { version: f.einwilligung.version }) })} · {s("teamPhotos", { anzahl: f.bilder })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {f.status === "veroeffentlicht" && f.slug && (
                    <a href={`/de/projekte/${f.slug}`} className="inline-flex min-h-11 items-center border border-ink/30 px-4 text-sm text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                      {s("refView")}
                    </a>
                  )}
                  {(f.status === "eingereicht" || f.status === "veroeffentlicht") && (
                    <button type="button" onClick={() => widerrufen(f.id)} className="inline-flex min-h-11 items-center border border-ink/30 px-4 text-sm text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                      {s("refRevoke")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!aktiv ? (
        <p className="bg-bone px-4 py-3 text-sm text-ink/80">{s("refUnavailable")}</p>
      ) : aktive.length > 0 ? (
        <p className="bg-bone px-4 py-3 text-sm text-ink/80">{s("refActiveExists")}</p>
      ) : fotos.length === 0 ? (
        <p className="bg-bone px-4 py-3 text-sm text-ink/80">{s("refNoPhotos")}</p>
      ) : (
        <form onSubmit={senden} className="space-y-8" aria-labelledby={`${id}-t`} data-referenz-form data-bereit={bereit ? "1" : undefined}>
          <fieldset>
            <legend className={legend}>{s("refStep1")}</legend>
            <p className="mt-1 text-sm text-ink/75" aria-live="polite">
              {s("refSelected", { anzahl: auswahl.length, max })}
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {fotos.map((f) => {
                const an = auswahl.includes(f.id);
                return (
                  <li key={f.id}>
                    <label className={`block cursor-pointer border-2 p-1.5 ${an ? "border-ink" : "border-transparent"} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink`}>
                      <TagebuchBild foto={f} url={(d) => `/api/portal/tagebuch/${encodeURIComponent(projektId)}/bild/${f.id}-${d}`} alt="" sizes="(min-width: 1024px) 200px, 45vw" />
                      <span className="mt-1.5 flex items-start gap-2 text-sm text-ink">
                        <input type="checkbox" checked={an} onChange={() => umschalten(f.id)} disabled={!an && auswahl.length >= max} className="mt-0.5 size-5 shrink-0 accent-ink" />
                        <span className="min-w-0">
                          <span className="block">{f.titel || s(`phase_${f.phase}`)}</span>
                          <span className="block text-xs text-ink/70">
                            {s(`phase_${f.phase}`)}
                            {f.beispiel ? ` · ${s("example")}` : ""}
                          </span>
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <fieldset>
            <legend className={legend}>{s("refStep2")}</legend>
            <div className="mt-3 space-y-3">
              {[
                ["anonym", s("refAnonym"), s("refAnonymText")],
                ["vorname_ort", s("refNamed"), s("refNamedText")],
              ].map(([wert, label, text]) => (
                <label key={wert} className="flex min-h-11 items-start gap-3 text-sm text-ink">
                  <input type="radio" name="anzeige" value={wert} checked={art === wert} onChange={() => setArt(wert)} className="mt-0.5 size-5 shrink-0 accent-ink" />
                  <span>
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-ink/75">{text}</span>
                  </span>
                </label>
              ))}
              {art === "vorname_ort" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${id}-vn`} className="mb-1 block text-sm font-semibold text-ink">
                      {s("refFirstName")}
                    </label>
                    <input id={`${id}-vn`} value={vorname} onChange={(e) => setVorname(e.target.value)} required maxLength={40} autoComplete="given-name" className={feld} />
                  </div>
                  <div>
                    <label htmlFor={`${id}-ort`} className="mb-1 block text-sm font-semibold text-ink">
                      {s("refPlace")}
                    </label>
                    <input id={`${id}-ort`} value={ort} onChange={(e) => setOrt(e.target.value)} required maxLength={60} autoComplete="off" aria-describedby={`${id}-ort-h`} className={feld} />
                    <p id={`${id}-ort-h`} className="mt-1 text-xs text-ink/70">
                      {s("refPlaceHint")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legend}>{s("refStep3")}</legend>
            <p className="mt-1 mb-3 text-sm text-ink/75">{s("refPreviewNote")}</p>
            {gewaehlt.length ? <ReferenzVorschau projektId={projektId} fotos={gewaehlt} anzeige={anzeige} s={s} /> : <p className="bg-bone px-4 py-3 text-sm text-ink/75">{s("refNeedPhotos")}</p>}
          </fieldset>

          <fieldset>
            <legend className={legend}>{s("refStep4")}</legend>
            <div className="mt-3 space-y-2 border border-ink/15 bg-white p-4 text-sm leading-relaxed text-ink/90">
              {einwilligung.absaetze.map((a) => (
                <p key={a.slice(0, 24)}>{a}</p>
              ))}
              {/* Verweis auf die Datenschutzerklärung (QA Recht P2). */}
              <p>
                <Link href="/de/datenschutz" className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                  Datenschutzerklärung lesen
                </Link>
              </p>
              <p className="text-xs text-ink/70">{s("refConsentVersion", { version: einwilligung.version })}</p>
            </div>
            <label className="mt-3 flex min-h-11 items-start gap-3 text-sm font-semibold text-ink">
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} required className="mt-0.5 size-5 shrink-0 accent-ink" />
              <span>{s("refConsentCheck")}</span>
            </label>
          </fieldset>

          <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60 sm:w-auto">
            {busy ? s("refBusy") : s("refSubmit")}
          </button>
        </form>
      )}
      <div aria-live="polite">
        {meldung && (
          <p role={meldung.ok ? "status" : "alert"} className={`border px-4 py-3 text-sm ${meldung.ok ? "border-ink/15 bg-bone text-ink" : "border-red-700/30 bg-red-50 text-red-900"}`}>
            {meldung.text}
          </p>
        )}
      </div>
    </div>
  );
}
