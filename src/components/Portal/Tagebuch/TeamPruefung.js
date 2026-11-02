"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReferenzVorschau from "./ReferenzVorschau";
import { tagebuchT } from "./texte";

const feld = "min-h-11 w-full border border-pebble bg-white px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const area = "min-h-28 w-full border border-pebble bg-white px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const lbl = "mb-1 block text-sm font-semibold text-ink";

// Studio-Prüfung einer Referenz-Freigabe: Texte formulieren, Alternativtexte je
// Bild, dann veröffentlichen (Server prüft projektSchema), ablehnen oder zurückziehen.
export default function TeamPruefung({ freigabe, projektId, fotos, leistungenListe, vorschlag }) {
  const s = tagebuchT(useTranslations());
  const router = useRouter();
  const id = useId();
  const p = freigabe.pruefung || {};
  const [w, setW] = useState({
    slug: p.slug || vorschlag.slug,
    titel: p.titel || "",
    typologie: p.typologie || "",
    leistungen: p.leistungen || [],
    zeitraumVon: p.zeitraumVon || vorschlag.von,
    zeitraumBis: p.zeitraumBis || vorschlag.bis,
    ausgangslage: p.ausgangslage || "",
    loesung: p.loesung?.length ? p.loesung : [{ raum: "", text: "" }],
    alt: Object.fromEntries(fotos.map((f) => [f.id, p.alt?.[f.id] || f.titel || ""])),
    notiz: "",
  });
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState(null);
  const set = (k, v) => setW((x) => ({ ...x, [k]: v }));

  async function senden(aktion) {
    setBusy(true);
    setMeldung(null);
    const body =
      aktion === "veroeffentlichen"
        ? { aktion, slug: w.slug, titel: w.titel, typologie: w.typologie, leistungen: w.leistungen, zeitraumVon: w.zeitraumVon, zeitraumBis: w.zeitraumBis, ausgangslage: w.ausgangslage, loesung: w.loesung.filter((l) => l.raum || l.text), alt: w.alt }
        : { aktion, notiz: w.notiz };
    const res = await fetch(`/api/portal/tagebuch/pruefung/${freigabe.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const r = await res?.json().catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setMeldung({ ok: true, text: s("reviewDone"), slug: r?.status === "veroeffentlicht" ? r.slug : null });
      router.refresh();
    } else setMeldung({ ok: false, text: r?.error || s("reviewFailed"), details: r?.details || [] });
  }

  const eingereicht = freigabe.status === "eingereicht";
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        className="space-y-4"
        aria-labelledby={`${id}-t`}
        onSubmit={(e) => {
          e.preventDefault();
          senden("veroeffentlichen");
        }}
      >
        <h2 id={`${id}-t`} className="font-display text-xl text-ink sm:text-2xl">
          {s("reviewTitle")}
        </h2>
        <p className="text-sm text-ink/80">{s("reviewIntro")}</p>
        <div>
          <label htmlFor={`${id}-slug`} className={lbl}>{s("reviewSlug")}</label>
          <input id={`${id}-slug`} value={w.slug} onChange={(e) => set("slug", e.target.value)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className={feld} />
        </div>
        <div>
          <label htmlFor={`${id}-titel`} className={lbl}>{s("reviewTitel")}</label>
          <input id={`${id}-titel`} value={w.titel} onChange={(e) => set("titel", e.target.value)} required maxLength={120} className={feld} />
        </div>
        <div>
          <label htmlFor={`${id}-typ`} className={lbl}>{s("reviewTypologie")}</label>
          <input id={`${id}-typ`} value={w.typologie} onChange={(e) => set("typologie", e.target.value)} required maxLength={60} className={feld} />
        </div>
        <fieldset>
          <legend className={lbl}>{s("reviewLeistungen")}</legend>
          <div className="flex flex-wrap gap-x-4">
            {leistungenListe.map((l) => (
              <label key={l} className="flex min-h-11 items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={w.leistungen.includes(l)} onChange={() => set("leistungen", w.leistungen.includes(l) ? w.leistungen.filter((x) => x !== l) : [...w.leistungen, l])} className="size-5 accent-ink" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${id}-von`} className={lbl}>{s("reviewVon")}</label>
            <input id={`${id}-von`} value={w.zeitraumVon} onChange={(e) => set("zeitraumVon", e.target.value)} required pattern="\d{4}-\d{2}" inputMode="numeric" className={feld} />
          </div>
          <div>
            <label htmlFor={`${id}-bis`} className={lbl}>{s("reviewBis")}</label>
            <input id={`${id}-bis`} value={w.zeitraumBis} onChange={(e) => set("zeitraumBis", e.target.value)} required pattern="\d{4}-\d{2}" inputMode="numeric" className={feld} />
          </div>
        </div>
        <div>
          <label htmlFor={`${id}-aus`} className={lbl}>{s("reviewAusgangslage")}</label>
          <textarea id={`${id}-aus`} value={w.ausgangslage} onChange={(e) => set("ausgangslage", e.target.value)} required maxLength={1200} className={area} />
        </div>
        {w.loesung.map((l, i) => (
          <div key={i} className="grid gap-2">
            <label htmlFor={`${id}-r${i}`} className={lbl}>{s("reviewRaum", { nr: i + 1 })}</label>
            <input id={`${id}-r${i}`} value={l.raum} onChange={(e) => set("loesung", w.loesung.map((x, j) => (j === i ? { ...x, raum: e.target.value } : x)))} required={i === 0} maxLength={60} className={feld} />
            <label htmlFor={`${id}-l${i}`} className={lbl}>{s("reviewRaumText", { nr: i + 1 })}</label>
            <textarea id={`${id}-l${i}`} value={l.text} onChange={(e) => set("loesung", w.loesung.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} required={i === 0} maxLength={1500} className={area} />
          </div>
        ))}
        {w.loesung.length < 3 && (
          <button type="button" onClick={() => set("loesung", [...w.loesung, { raum: "", text: "" }])} className="inline-flex min-h-11 items-center text-sm text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            + {s("reviewRaum", { nr: w.loesung.length + 1 })}
          </button>
        )}
        {fotos.map((f, i) => (
          <div key={f.id}>
            <label htmlFor={`${id}-alt${i}`} className={lbl}>
              {s("reviewAlt")} · {i + 1}: {s(`phase_${f.phase}`)}
            </label>
            <input id={`${id}-alt${i}`} value={w.alt[f.id]} onChange={(e) => set("alt", { ...w.alt, [f.id]: e.target.value })} required maxLength={200} className={feld} />
          </div>
        ))}
        <div className="flex flex-col gap-3 border-t border-ink/10 pt-4 sm:flex-row sm:flex-wrap">
          {eingereicht && (
            <button type="submit" disabled={busy} className="inline-flex min-h-12 items-center justify-center bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60">
              {s("reviewPublish")}
            </button>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <ReferenzVorschau projektId={projektId} fotos={fotos} anzeige={freigabe.anzeige} s={s} titel={w.titel} text={w.ausgangslage} />
        {(eingereicht || freigabe.status === "veroeffentlicht") && (
          <div className="space-y-3 border-t border-ink/10 pt-4">
            <div>
              <label htmlFor={`${id}-notiz`} className={lbl}>{s("reviewNote")}</label>
              <textarea id={`${id}-notiz`} value={w.notiz} onChange={(e) => set("notiz", e.target.value)} maxLength={500} className={area} />
            </div>
            <button type="button" disabled={busy} onClick={() => senden(eingereicht ? "ablehnen" : "zurueckziehen")} className="inline-flex min-h-12 items-center justify-center border border-ink/40 bg-white px-6 text-sm font-semibold text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60">
              {eingereicht ? s("reviewReject") : s("reviewWithdraw")}
            </button>
          </div>
        )}
        <div aria-live="polite">
          {meldung && (
            <div role={meldung.ok ? "status" : "alert"} className={`border px-4 py-3 text-sm ${meldung.ok ? "border-ink/15 bg-bone text-ink" : "border-red-700/30 bg-red-50 text-red-900"}`}>
              <p>{meldung.text}</p>
              {meldung.slug && (
                <p className="mt-1">
                  <a href={`/de/projekte/${meldung.slug}`} className="underline underline-offset-4">/de/projekte/{meldung.slug}</a>
                </p>
              )}
              {meldung.details?.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {meldung.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
