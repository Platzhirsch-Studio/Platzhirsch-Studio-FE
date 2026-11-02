"use client";
// Kommentare an Raumpunkten: Liste (nummeriert wie die Punkte in Ansicht und
// Grundriss) und Formular (Text oder Sprachnachricht). Bezug: ganzer Raum,
// ein geplantes Stück oder ein Punkt, der in der 3D-Ansicht angetippt wird.
// Ohne 3D-Ansicht funktionieren „ganzer Raum“ und „Stück“ genauso.
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, MessageSquare, Mic, Send, Trash2 } from "lucide-react";
import { DATUM_ZEIT, RAUM_CONFIG } from "@/lib/raumzwilling/config";
import { meterText } from "@/lib/raumzwilling/massstab";
import { STANDARD_WAENDE } from "@/lib/raumzwilling/platzierung";

const SprachAufnahme = dynamic(() => import("./SprachAufnahme"), { ssr: false, loading: () => <p className="text-sm text-ink/70">Aufnahme wird vorbereitet …</p> });
const fokus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function punktInWorten(p, g) {
  if (!p) return "";
  if (!g) return `Punkt in ${meterText(p[1])} Höhe`;
  const w = { ...STANDARD_WAENDE, ...(g.waende || {}) };
  const ab = [
    { m: p[2] - g.z0, w: w.hinten },
    { m: g.z1 - p[2], w: w.vorne },
    { m: p[0] - g.x0, w: w.links },
    { m: g.x1 - p[0], w: w.rechts },
  ].sort((a, b) => a.m - b.m)[0];
  return `${meterText(Math.max(0, ab.m))} vor der ${ab.w}, ${meterText(Math.max(0, p[1]))} hoch`;
}

export default function Kommentare({ projektId, kommentare, volumen = [], grundriss, punkt, pickVerfuegbar, pickAktiv, onPickModus, onNeu, onGeloescht, fokusId, rolle }) {
  const [art, setArt] = useState("text");
  const [bezug, setBezug] = useState("raum");
  const [text, setText] = useState("");
  const [clip, setClip] = useState(null);
  const [einw, setEinw] = useState(false);
  const [fehler, setFehler] = useState("");
  const [sendet, setSendet] = useState(false);
  const [meldung, setMeldung] = useState("");
  const liste = useRef(null);
  const pinNummer = new Map(kommentare.filter((k) => k.punkt).map((k, i) => [k.id, i + 1]));

  useEffect(() => {
    if (!fokusId) return;
    const el = liste.current?.querySelector(`[data-k="${fokusId}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [fokusId]);

  useEffect(() => {
    onPickModus?.(bezug === "punkt");
  }, [bezug, onPickModus]);

  async function senden(e) {
    e.preventDefault();
    setFehler("");
    setMeldung("");
    const b = bezug === "raum" ? { art: "raum" } : bezug === "punkt" ? { art: "punkt" } : { art: "volumen", volumenId: bezug };
    if (b.art === "punkt" && !punkt) return setFehler("Bitte tippen Sie zuerst in der 3D-Ansicht auf die Stelle, um die es geht.");
    if (art === "text" && !text.trim()) return setFehler("Bitte einen Kommentar schreiben.");
    if (art === "sprache" && !clip) return setFehler("Bitte zuerst eine Sprachnachricht aufnehmen.");
    if (art === "sprache" && !einw) return setFehler("Bitte der Speicherung der Sprachnachricht zustimmen.");
    setSendet(true);
    try {
      let res;
      const url = `/api/portal/raum/${projektId}/kommentar`;
      if (art === "sprache") {
        const fd = new FormData();
        fd.set("text", text.trim());
        fd.set("bezug", JSON.stringify(b));
        if (b.art === "punkt") fd.set("punkt", JSON.stringify(punkt));
        fd.set("sekunden", String(Math.round(clip.dauer || 0)));
        fd.set("einwilligung", "ja");
        const typ = (clip.blob.type || "audio/webm").split(";")[0];
        fd.set("audio", new File([clip.blob], `sprachnachricht.${typ.split("/")[1] || "webm"}`, { type: typ }));
        res = await fetch(url, { method: "POST", body: fd, credentials: "same-origin" });
      } else {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ text: text.trim(), bezug: b, ...(b.art === "punkt" ? { punkt } : {}) }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.");
      if (!res.ok) throw new Error(data.error || "Senden fehlgeschlagen.");
      onNeu?.(data.kommentar);
      setText("");
      setClip(null);
      setEinw(false);
      setArt("text");
      setBezug("raum");
      setMeldung("Ihr Kommentar ist gespeichert. Ihr Beratungsteam sieht ihn hier im Portal.");
    } catch (err) {
      setFehler(err.message);
    } finally {
      setSendet(false);
    }
  }

  async function loeschen(id) {
    const res = await fetch(`/api/portal/raum/${projektId}/kommentar?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) onGeloescht?.(id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">Kommentare ({kommentare.length})</h3>
        {kommentare.length === 0 ? (
          <p className="bg-bone px-4 py-4 text-sm text-ink/80">Noch keine Kommentare. Tippen Sie auf eine Stelle im Raum und schreiben Sie, was dort wichtig ist, zum Beispiel „Hier steht das Klavier“.</p>
        ) : (
          <ol ref={liste} className="space-y-3">
            {kommentare.map((k) => {
              const vol = k.bezug?.art === "volumen" ? volumen.find((v) => v.id === k.bezug.volumenId) : null;
              const n = pinNummer.get(k.id);
              return (
                <li key={k.id} data-k={k.id} tabIndex={-1} className={`border border-ink/10 bg-white p-4 outline-none focus:border-ink ${k.id === fokusId ? "border-ink" : ""}`}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-ink/70">
                    {n && (
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${k.rolle === "team" ? "bg-walnut text-paper" : "bg-ink text-white"}`} aria-label={`Punkt ${n}`}>
                        {n}
                      </span>
                    )}
                    <span className="font-semibold text-ink">{k.autor}</span>
                    <span>· {DATUM_ZEIT.format(new Date(k.erstellt))}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/70">
                    {k.punkt ? punktInWorten(k.punkt, grundriss) : vol ? `zu ${vol.marke ? `${vol.marke} ` : ""}${vol.name}` : "zum ganzen Raum"}
                  </p>
                  {k.text && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{k.text}</p>}
                  {k.audio && (
                    <audio controls preload="none" className="mt-2 h-11 w-full" src={`/api/portal/raum/${projektId}/datei/audio/${k.audio.datei.replace(/\.[a-z0-9]+$/, "")}`} aria-label={`Sprachnachricht von ${k.autor}${k.audio.sekunden ? `, ${k.audio.sekunden} Sekunden` : ""}`} />
                  )}
                  {rolle === "team" || k.rolle === rolle ? (
                    <button type="button" onClick={() => loeschen(k.id)} className={`mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs text-ink/70 underline underline-offset-4 hover:text-ink ${fokus}`}>
                      <Trash2 size={13} aria-hidden="true" /> Kommentar löschen
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <form onSubmit={senden} className="space-y-4" aria-labelledby="neu-k">
        <h3 id="neu-k" className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/80">
          Neuer Kommentar
        </h3>
        <div role="group" aria-label="Art des Kommentars" className="flex flex-wrap gap-2">
          {[
            ["text", "Schreiben", MessageSquare],
            ["sprache", "Sprachnachricht", Mic],
          ].map(([k, l, Icon]) => (
            <button key={k} type="button" aria-pressed={art === k} onClick={() => setArt(k)} className={`inline-flex min-h-11 items-center gap-1.5 border px-4 text-sm ${fokus} ${art === k ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink/50"}`}>
              <Icon size={15} aria-hidden="true" /> {l}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="k-bezug" className="mb-1 block text-sm font-semibold text-ink">
            Worum geht es?
          </label>
          <select id="k-bezug" value={bezug} onChange={(e) => setBezug(e.target.value)} className={`min-h-11 w-full border border-pebble bg-white px-3 text-[15px] text-ink ${fokus}`}>
            <option value="raum">Den ganzen Raum</option>
            {pickVerfuegbar && <option value="punkt">Eine Stelle im Raum (in der Ansicht antippen)</option>}
            {volumen.map((v) => (
              <option key={v.id} value={v.id}>
                {v.marke ? `${v.marke} · ` : ""}
                {v.name}
              </option>
            ))}
          </select>
          {bezug === "punkt" && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-ink/80" aria-live="polite">
              <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              {punkt ? `Stelle gewählt: ${punktInWorten(punkt, grundriss)}. Erneut tippen zum Ändern.` : pickAktiv ? "Tippen Sie jetzt in der 3D-Ansicht auf die Stelle." : ""}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="k-text" className="mb-1 block text-sm font-semibold text-ink">
            {art === "sprache" ? "Kurze Notiz (optional)" : "Ihr Kommentar"}
          </label>
          <textarea id="k-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={RAUM_CONFIG.comment.maxLength} rows={art === "sprache" ? 2 : 4} className={`w-full border border-pebble bg-white px-3 py-2 text-[15px] text-ink ${fokus}`} placeholder={art === "sprache" ? "" : "Zum Beispiel: Hier steht das Klavier."} />
        </div>
        {art === "sprache" && <SprachAufnahme onClip={setClip} einwilligung={einw} setEinwilligung={setEinw} />}
        {fehler && (
          <p role="alert" className="text-sm text-error">
            {fehler}
          </p>
        )}
        {meldung && (
          <p role="status" className="text-sm text-success">
            {meldung}
          </p>
        )}
        <button type="submit" disabled={sendet} className={`inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold tracking-wide text-white hover:bg-ink-deep disabled:opacity-60 ${fokus}`}>
          <Send size={15} aria-hidden="true" /> {sendet ? "Wird gesendet …" : "Kommentar senden"}
        </button>
      </form>
    </div>
  );
}
