"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImagePlus } from "lucide-react";
import { PHASEN, phase as phaseVon } from "@/lib/portal/tagebuch/config";
import { tagebuchT } from "./texte";

const feld = "min-h-11 w-full border border-pebble bg-white px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

// Upload ins Tagebuch (Kunde: Lieferung, Montage, Vorher, Nachher; Team: alle Phasen).
// Ohne JS-Fehlerpfad: Rückmeldung als role="status"/"alert".
export default function FotoUpload({ projektId, rolle }) {
  const s = tagebuchT(useTranslations());
  const router = useRouter();
  const id = useId();
  const form = useRef(null);
  const erlaubt = PHASEN.filter((p) => rolle === "team" || !p.nurTeam);
  const [phase, setPhase] = useState(rolle === "team" ? "skizze" : "lieferung");
  const [busy, setBusy] = useState(false);
  const [meldung, setMeldung] = useState(null);
  const echtPflicht = phaseVon(phase)?.echtPflicht;

  async function senden(e) {
    e.preventDefault();
    setBusy(true);
    setMeldung(null);
    const daten = new FormData(e.currentTarget);
    const res = await fetch(`/api/portal/tagebuch/${encodeURIComponent(projektId)}/foto`, { method: "POST", body: daten }).catch(() => null);
    const body = await res?.json().catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setMeldung({ ok: true, text: body?.foto?.gpsEntfernt ? s("uploadDoneGps") : s("uploadDone") });
      form.current?.reset();
      setPhase(daten.get("phase"));
      router.refresh();
    } else {
      setMeldung({ ok: false, text: body?.error || s("uploadFailed") });
    }
  }

  return (
    <form ref={form} onSubmit={senden} className="space-y-4" aria-labelledby={`${id}-t`} encType="multipart/form-data">
      <h2 id={`${id}-t`} className="font-display text-xl text-ink sm:text-2xl">
        {s("uploadTitle")}
      </h2>
      <p className="border-l-2 border-ink/30 pl-3 text-sm leading-relaxed text-ink/85">{s("uploadHint")}</p>
      {rolle !== "team" && <p className="text-sm text-ink/75">{s("uploadTeamOnly")}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-phase`} className="mb-1 block text-sm font-semibold text-ink">
            {s("uploadPhase")}
          </label>
          <select id={`${id}-phase`} name="phase" value={phase} onChange={(e) => setPhase(e.target.value)} className={feld}>
            {erlaubt.map((p) => (
              <option key={p.key} value={p.key}>
                {s(`phase_${p.key}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-titel`} className="mb-1 block text-sm font-semibold text-ink">
            {s("uploadCaption")}
          </label>
          <input id={`${id}-titel`} name="titel" maxLength={120} className={feld} autoComplete="off" />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-bild`} className="mb-1 block text-sm font-semibold text-ink">
          {s("uploadFile")}
        </label>
        <input id={`${id}-bild`} name="bild" type="file" required accept="image/jpeg,image/png,image/webp,image/avif" className="block min-h-11 w-full text-base text-ink file:mr-3 file:min-h-11 file:border file:border-ink/30 file:bg-white file:px-4 file:text-sm file:font-semibold file:text-ink" />
      </div>
      <label className="flex min-h-11 items-start gap-3 text-sm text-ink">
        <input type="checkbox" name="hinweis" value="ja" required className="mt-0.5 size-5 shrink-0 accent-ink" />
        <span>{s("uploadHintConfirm")}</span>
      </label>
      {echtPflicht && (
        <label className="flex min-h-11 items-start gap-3 text-sm text-ink">
          <input type="checkbox" name="echt" value="ja" required className="mt-0.5 size-5 shrink-0 accent-ink" />
          <span>{s("uploadReal")}</span>
        </label>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-ink bg-white px-6 text-sm font-semibold text-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60 sm:w-auto"
      >
        <ImagePlus size={18} aria-hidden="true" />
        {busy ? s("uploadBusy") : s("uploadSubmit")}
      </button>
      <div aria-live="polite">
        {meldung && (
          <p role={meldung.ok ? "status" : "alert"} className={`border px-4 py-3 text-sm ${meldung.ok ? "border-ink/15 bg-bone text-ink" : "border-red-700/30 bg-red-50 text-red-900"}`}>
            {meldung.text}
          </p>
        )}
      </div>
    </form>
  );
}
