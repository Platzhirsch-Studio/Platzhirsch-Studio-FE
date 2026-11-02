"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Send, Square, Trash2 } from "lucide-react";
import { VOICE_RETENTION } from "@/lib/portal/privacy";
import { focusRing, micAvailability } from "./client";

// Voice note: MediaRecorder + live waveform (AnalyserNode) + timer, listen
// before sending, explicit consent, upload to /api/portal/feedback/voice.

const MAX_SECONDS = 180;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function pickType() {
  if (typeof MediaRecorder === "undefined") return null;
  return TYPES.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
}

function stopAll(rec) {
  const r = rec.current;
  if (!r) return;
  cancelAnimationFrame(r.raf);
  clearInterval(r.timer);
  r.stream.getTracks().forEach((t) => t.stop());
  r.ctx?.close().catch(() => {});
  rec.current = null;
}

function Wave({ peaks, live }) {
  const bars = peaks.slice(-64);
  return (
    <div className="flex h-12 items-center gap-[3px] overflow-hidden" aria-hidden="true">
      {bars.map((p, i) => (
        <span key={i} className={`w-[3px] shrink-0 ${live ? "bg-red-700" : "bg-ink/70"}`} style={{ height: `${Math.max(8, Math.min(100, p * 260))}%` }} />
      ))}
      {!bars.length && <span className="h-px w-full bg-ink/20" />}
    </div>
  );
}

const MIC_MESSAGES = {
  unsupported: "Ihr Browser unterstützt keine Sprachaufnahme.",
  blocked: "Die Sprachaufnahme ist auf dieser Seite derzeit nicht verfügbar.",
  denied: "Kein Zugriff auf das Mikrofon. Sie können den Zugriff in den Browser-Einstellungen erlauben.",
};

export default function VoiceRecorder({ projectId, renderingId, onSent, onFallback }) {
  const [state, setState] = useState("idle"); // idle | recording | recorded | sending
  const [seconds, setSeconds] = useState(0);
  const [peaks, setPeaks] = useState([]);
  const [clip, setClip] = useState(null); // { blob, url, duration }
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  // Pre-check on mount: no tap needed to learn that recording is impossible.
  const [micError, setMicError] = useState(() => {
    const a = micAvailability();
    return a === "blocked" || a === "unsupported" ? MIC_MESSAGES[a] : "";
  });
  const rec = useRef(null);

  useEffect(() => () => stopAll(rec), []);
  useEffect(() => () => clip?.url && URL.revokeObjectURL(clip.url), [clip]);

  async function start() {
    setError("");
    setMicError("");
    const availability = micAvailability();
    const type = pickType();
    if (availability !== "ok" || type === null) {
      setMicError(MIC_MESSAGES[availability === "blocked" ? "blocked" : "unsupported"]);
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      // NotAllowedError also covers a Permissions-Policy block in Safari.
      setMicError(MIC_MESSAGES[err?.name === "NotAllowedError" || err?.name === "SecurityError" ? "denied" : "unsupported"]);
      return;
    }
    const recorder = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 48000 } : undefined);
    const chunks = [];
    const startedAt = performance.now();
    const r = { stream, recorder, raf: 0, timer: 0, ctx: null };
    rec.current = r;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      r.ctx = new Ctx();
      const analyser = r.ctx.createAnalyser();
      analyser.fftSize = 1024;
      r.ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let last = 0;
      const tick = (t) => {
        if (t - last > 90) {
          last = t;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += ((v - 128) / 128) ** 2;
          const rms = Math.sqrt(sum / buf.length);
          setPeaks((p) => [...p.slice(-400), rms]);
        }
        r.raf = requestAnimationFrame(tick);
      };
      r.raf = requestAnimationFrame(tick);
    } catch {
      /* waveform is optional */
    }

    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const duration = (performance.now() - startedAt) / 1000;
      const blob = new Blob(chunks, { type: (recorder.mimeType || type || "audio/webm").split(";")[0] });
      stopAll(rec);
      if (blob.size > MAX_BYTES) {
        setError("Die Aufnahme ist zu groß. Bitte kürzer aufnehmen.");
        setState("idle");
        return;
      }
      setClip({ blob, url: URL.createObjectURL(blob), duration });
      setState("recorded");
    };
    r.timer = setInterval(() => {
      const s = (performance.now() - startedAt) / 1000;
      setSeconds(s);
      if (s >= MAX_SECONDS && recorder.state === "recording") recorder.stop();
    }, 250);

    setPeaks([]);
    setSeconds(0);
    recorder.start(1000);
    setState("recording");
  }

  function stop() {
    if (rec.current?.recorder.state === "recording") rec.current.recorder.stop();
  }

  function discard() {
    setClip(null);
    setPeaks([]);
    setSeconds(0);
    setState("idle");
  }

  async function send() {
    if (!clip || !consent) return;
    setState("sending");
    setError("");
    const fd = new FormData();
    const ext = { "audio/ogg": "ogg", "audio/mp4": "m4a" }[clip.blob.type] || "webm";
    fd.append("audio", clip.blob, `sprachnachricht.${ext}`);
    fd.append("projectId", projectId);
    if (renderingId) fd.append("renderingId", renderingId);
    fd.append("durationSec", String(Math.max(0.5, Math.min(MAX_SECONDS, clip.duration)).toFixed(1)));
    fd.append("consent", "ja");
    try {
      const res = await fetch("/api/portal/feedback/voice", { method: "POST", body: fd, credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Senden fehlgeschlagen.");
      onSent?.(data.entry);
      discard();
      setConsent(false);
    } catch (err) {
      setError(err.message);
      setState("recorded");
    }
  }

  if (micError && !clip) {
    return (
      <div role="alert" className="space-y-3 border border-ink/15 bg-bone p-4 text-sm text-ink">
        <p>{micError} Schreiben Sie uns stattdessen eine Nachricht.</p>
        <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onFallback?.()}
          className={`inline-flex min-h-11 items-center bg-ink px-5 text-sm font-semibold text-white ${focusRing}`}
        >
          Stattdessen schreiben
        </button>
        {micError === MIC_MESSAGES.denied && (
          <button type="button" onClick={start} className={`inline-flex min-h-11 items-center border border-ink/20 bg-white px-5 text-sm text-ink ${focusRing}`}>
            Erneut versuchen
          </button>
        )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border border-ink/10 bg-bone p-4">
        <div className="flex items-center gap-3">
          {state === "recording" ? (
            <button type="button" onClick={stop} className={`flex size-14 shrink-0 items-center justify-center bg-red-700 text-white ${focusRing}`} aria-label="Aufnahme beenden">
              <Square size={20} fill="currentColor" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={state === "sending" || state === "recorded"}
              className={`flex size-14 shrink-0 items-center justify-center bg-ink text-white disabled:opacity-40 ${focusRing}`}
              aria-label="Aufnahme starten"
            >
              <Mic size={22} aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <Wave peaks={peaks} live={state === "recording"} />
          </div>
          <span className="w-12 shrink-0 text-right text-sm tabular-nums text-ink" aria-live="off">
            {mmss(state === "recorded" || state === "sending" ? clip?.duration || 0 : seconds)}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink/70" aria-live="polite">
          {state === "recording"
            ? `Aufnahme läuft … (max. ${MAX_SECONDS / 60} Minuten)`
            : state === "recorded"
              ? "Hören Sie die Aufnahme an, bevor Sie sie senden."
              : "Mikrofon antippen und lossprechen."}
        </p>
      </div>

      {clip && (
        <div className="space-y-3">
          <audio controls src={clip.url} className="w-full">
            Ihr Browser kann die Aufnahme nicht abspielen.
          </audio>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink/80">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-5 shrink-0 accent-ink" />
            <span>
              Ich bin einverstanden, dass Platzhirsch Home Living meine Sprachnachricht zur Bearbeitung dieses Projekts speichert und anhört. Die Aufnahme ist nur für mich und das Beratungsteam
              abrufbar und wird {VOICE_RETENTION} gelöscht. Die Einwilligung kann ich jederzeit widerrufen. Details in der{" "}
              <Link href="/de/portal/datenschutz" className={`py-1 underline underline-offset-2 ${focusRing}`}>
                Datenschutzerklärung
              </Link>
              .
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={send}
              disabled={!consent || state === "sending"}
              className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50 ${focusRing}`}
            >
              <Send size={16} aria-hidden="true" />
              {state === "sending" ? "Wird gesendet …" : "Sprachnachricht senden"}
            </button>
            <button type="button" onClick={discard} disabled={state === "sending"} className={`inline-flex min-h-12 items-center gap-2 border border-ink/20 px-5 text-sm text-ink ${focusRing}`}>
              <Trash2 size={16} aria-hidden="true" />
              Verwerfen
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      )}
    </div>
  );
}
