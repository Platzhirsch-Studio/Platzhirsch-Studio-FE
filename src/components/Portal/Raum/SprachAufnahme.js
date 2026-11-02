"use client";
// Sprachnachricht für einen Raumpunkt. Mit Mikrofon im Browser (MediaRecorder),
// sonst – z. B. wenn die Seite das Mikrofon per Permissions-Policy sperrt –
// über die Aufnahme-App des Handys (<input accept="audio/*" capture>).
// Anhören vor dem Senden, ausdrückliche Einwilligung.
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { micAvailability } from "@/components/Portal/Planung/client";
import { VOICE_RETENTION } from "@/lib/portal/privacy";
import { RAUM_CONFIG } from "@/lib/raumzwilling/config";

const TYPEN = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];
const MAX_S = RAUM_CONFIG.comment.voiceMaxSeconds;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fokus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function SprachAufnahme({ onClip, einwilligung, setEinwilligung }) {
  const [zustand, setZustand] = useState("leer"); // leer | nimmt-auf | fertig
  const [sek, setSek] = useState(0);
  const [clip, setClip] = useState(null);
  const [fehler, setFehler] = useState("");
  const [mikro] = useState(() => (typeof window === "undefined" ? "unknown" : micAvailability()));
  const rec = useRef(null);

  useEffect(
    () => () => {
      rec.current?.stream.getTracks().forEach((t) => t.stop());
      clearInterval(rec.current?.timer);
    },
    []
  );
  useEffect(() => () => clip?.url && URL.revokeObjectURL(clip.url), [clip]);

  function setze(blob, dauer) {
    const c = { blob, url: URL.createObjectURL(blob), dauer };
    setClip(c);
    setZustand("fertig");
    onClip?.(c);
  }

  async function start() {
    setFehler("");
    const typ = TYPEN.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setFehler("Kein Zugriff auf das Mikrofon. Nutzen Sie „Mit der Handy-App aufnehmen“ oder schreiben Sie einen Kommentar.");
      return;
    }
    const mr = new MediaRecorder(stream, typ ? { mimeType: typ } : undefined);
    const teile = [];
    const t0 = Date.now();
    mr.ondataavailable = (e) => e.data.size && teile.push(e.data);
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(rec.current?.timer);
      const blob = new Blob(teile, { type: (mr.mimeType || typ || "audio/webm").split(";")[0] });
      setze(blob, (Date.now() - t0) / 1000);
    };
    const timer = setInterval(() => {
      const s = (Date.now() - t0) / 1000;
      setSek(s);
      if (s >= MAX_S) mr.stop();
    }, 250);
    rec.current = { mr, stream, timer };
    mr.start(1000);
    setZustand("nimmt-auf");
  }

  function datei(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > RAUM_CONFIG.comment.voiceMaxBytes) {
      setFehler("Die Aufnahme ist größer als 5 MB. Bitte kürzer aufnehmen.");
      return;
    }
    const a = new Audio();
    const url = URL.createObjectURL(f);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      setze(f, Number.isFinite(a.duration) ? a.duration : 0);
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      setze(f, 0);
    };
    a.src = url;
  }

  function verwerfen() {
    setClip(null);
    setZustand("leer");
    setSek(0);
    onClip?.(null);
  }

  return (
    <div className="space-y-3">
      {zustand === "leer" && (
        <div className="flex flex-wrap gap-2">
          {mikro === "ok" && (
            <button type="button" onClick={start} className={`inline-flex min-h-11 items-center gap-2 border border-ink bg-white px-4 text-sm font-semibold text-ink hover:bg-bone ${fokus}`}>
              <Mic size={16} aria-hidden="true" /> Aufnahme starten
            </button>
          )}
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 border border-ink/30 bg-white px-4 text-sm text-ink hover:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink`}>
            <input type="file" accept="audio/*" capture="user" className="sr-only" onChange={datei} />
            <Mic size={16} aria-hidden="true" /> {mikro === "ok" ? "Oder mit der Handy-App aufnehmen" : "Mit der Handy-App aufnehmen"}
          </label>
        </div>
      )}
      {zustand === "nimmt-auf" && (
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-sm tabular-nums text-ink">Aufnahme läuft {mmss(sek)} / {mmss(MAX_S)}</span>
          <button type="button" onClick={() => rec.current?.mr.stop()} className={`inline-flex min-h-11 items-center gap-2 bg-ink px-4 text-sm font-semibold text-white ${fokus}`}>
            <Square size={14} aria-hidden="true" /> Stopp
          </button>
        </div>
      )}
      {zustand === "fertig" && clip && (
        <div className="flex flex-wrap items-center gap-3">
          <audio controls src={clip.url} className="h-11 max-w-full" aria-label="Ihre Aufnahme anhören" />
          <button type="button" onClick={verwerfen} className={`inline-flex min-h-11 items-center gap-2 px-3 text-sm text-ink underline underline-offset-4 ${fokus}`}>
            <Trash2 size={14} aria-hidden="true" /> Verwerfen
          </button>
        </div>
      )}
      {fehler && (
        <p role="alert" className="text-sm text-error">
          {fehler}
        </p>
      )}
      <label className="flex items-start gap-3 text-sm text-ink/90">
        <input type="checkbox" checked={einwilligung} onChange={(e) => setEinwilligung(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
        <span>Ich willige ein, dass meine Sprachnachricht gespeichert und von meinem Beratungsteam angehört wird. Gespeichert {VOICE_RETENTION}.</span>
      </label>
    </div>
  );
}
