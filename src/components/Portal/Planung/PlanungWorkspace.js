"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, CheckCircle2, Columns2, Expand, Image as ImageIcon, MapPin, SplitSquareHorizontal, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { formatDate } from "@/lib/portal/format";
import AnnotatableImage from "./AnnotatableImage";
import BeforeAfter from "./BeforeAfter";
import Thread from "./Thread";
import VariantImage from "./VariantImage";
import { SCENES } from "./scenes";
import { chip, focusRing, postFeedback, useMicAvailability } from "./client";

// Interactive planning workspace of /de/portal/projekte/[id].
// Heavy parts (3D, voice recorder, lightbox) are split out and loaded on use.

const Viewer3D = dynamic(() => import("./Viewer3D"), { ssr: false, loading: () => <Loading text="3D-Ansicht wird vorbereitet …" /> });
const VoiceRecorder = dynamic(() => import("./VoiceRecorder"), { ssr: false, loading: () => <Loading text="Aufnahme wird vorbereitet …" /> });
const Lightbox = dynamic(() => import("./Lightbox"), { ssr: false });

function Loading({ text }) {
  return (
    <div role="status" className="flex aspect-16/10 items-center justify-center bg-bone text-sm text-ink/75">
      {text}
    </div>
  );
}

const VIEWS = [
  { id: "bild", label: "Bild", Icon: ImageIcon },
  { id: "vorher", label: "Vorher / Nachher", Icon: SplitSquareHorizontal },
  { id: "vergleich", label: "Varianten vergleichen", Icon: Columns2 },
  { id: "3d", label: "3D", Icon: Box },
];

function VoteButtons({ value, onVote, letter, busy }) {
  return (
    <div className="flex gap-2" role="group" aria-label={`Bewertung Variante ${letter}`}>
      <button
        type="button"
        disabled={busy}
        aria-pressed={value === "up"}
        onClick={() => onVote(value === "up" ? "none" : "up")}
        className={`flex size-11 items-center justify-center border ${focusRing} ${value === "up" ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink"}`}
        aria-label={`Variante ${letter} gefällt mir`}
      >
        <ThumbsUp size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={busy}
        aria-pressed={value === "down"}
        onClick={() => onVote(value === "down" ? "none" : "down")}
        className={`flex size-11 items-center justify-center border ${focusRing} ${value === "down" ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink"}`}
        aria-label={`Variante ${letter} gefällt mir nicht`}
      >
        <ThumbsDown size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

function AiBadge({ variant }) {
  if (!variant.aiGenerated) return null;
  return (
    <span className="inline-flex items-center border border-ink/40 bg-white/95 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink" title="Mit KI erstellt oder bearbeitet (Kennzeichnung nach AI Act Art. 50)">
      KI-generiert
    </span>
  );
}

function ApproveDialog({ open, variant, onClose, onConfirm }) {
  const ref = useRef(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="approve-title" className="m-auto w-[calc(100%-2rem)] max-w-lg bg-white p-0 text-ink backdrop:bg-ink-deep/60">
      {variant && (
        <form
          method="dialog"
          className="space-y-4 p-5 sm:p-7"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await onConfirm(note);
              setNote("");
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 id="approve-title" className="font-display text-2xl">
            Variante {variant.letter} freigeben?
          </h2>
          <p className="text-[15px] leading-relaxed text-ink/80">
            Sie teilen uns mit, dass Ihnen <strong>„{variant.title}“</strong> gefällt, und bitten um ein Angebot auf dieser Grundlage. Das ist noch keine Bestellung und kein Vertrag – das
            verbindliche Angebot erhalten Sie anschließend unter Dokumente.
          </p>
          <label className="block text-sm font-medium" htmlFor="approve-note">
            Anmerkung (optional)
          </label>
          <textarea id="approve-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className="w-full border border-ink/20 px-3 py-2 text-[15px] focus:border-ink focus:outline-none" placeholder="z. B. Griffe bitte in Schwarz" />
          {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={`min-h-12 border border-ink/20 px-5 text-sm ${focusRing}`}>
              Abbrechen
            </button>
            <button type="submit" disabled={busy} className={`inline-flex min-h-12 items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold text-white disabled:opacity-60 ${focusRing}`}>
              <CheckCircle2 size={18} aria-hidden="true" />
              {busy ? "Wird gesendet …" : "Ja, bitte Angebot"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

function Composer({ projectId, variant, onAdded }) {
  const [mode, setMode] = useState("kommentar");
  const [scope, setScope] = useState("variante");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const focusTextRef = useRef(false);
  const textRef = useRef(null);
  const mic = useMicAvailability();
  // Voice notes only where recording can work (Permissions-Policy, MediaRecorder).
  const voiceAvailable = mic === "ok";
  const effectiveMode = mode === "sprachnachricht" && !voiceAvailable ? "kommentar" : mode;
  const renderingId = scope === "variante" ? variant?.id : undefined;

  useEffect(() => {
    // "Stattdessen schreiben": focus the text field once it is rendered.
    if (focusTextRef.current && effectiveMode !== "sprachnachricht") {
      focusTextRef.current = false;
      textRef.current?.focus();
    }
  }, [effectiveMode]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const entry = await postFeedback({ projectId, kind: effectiveMode, body, ...(renderingId ? { renderingId } : {}) });
      onAdded(entry);
      setBody("");
      setStatus({ ok: true, text: "Danke – Ihre Nachricht ist beim Team angekommen." });
    } catch (err) {
      setStatus({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Art der Rückmeldung">
        {[
          ["kommentar", "Kommentar"],
          ["vorschlag", "Vorschlag"],
          ...(voiceAvailable ? [["sprachnachricht", "Sprachnachricht"]] : []),
        ].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={effectiveMode === id} onClick={() => setMode(id)} className={chip(effectiveMode === id)}>
            {label}
          </button>
        ))}
      </div>
      {variant && (
        <fieldset className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink">
          <legend className="sr-only">Bezug</legend>
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="scope" checked={scope === "variante"} onChange={() => setScope("variante")} className="size-5 accent-ink" />
            zu Variante {variant.letter}
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="radio" name="scope" checked={scope === "projekt"} onChange={() => setScope("projekt")} className="size-5 accent-ink" />
            zum ganzen Projekt
          </label>
        </fieldset>
      )}
      {effectiveMode === "sprachnachricht" ? (
        <VoiceRecorder
          projectId={projectId}
          renderingId={renderingId}
          onSent={(entry) => {
            onAdded(entry);
            setStatus({ ok: true, text: "Danke – Ihre Sprachnachricht ist angekommen." });
          }}
          onFallback={() => {
            focusTextRef.current = true;
            setMode("kommentar");
          }}
        />
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="planung-text" className="block text-sm font-medium text-ink">
            {effectiveMode === "vorschlag" ? "Ihr Vorschlag – was sollen wir ändern?" : "Ihr Kommentar"}
          </label>
          <textarea
            ref={textRef}
            id="planung-text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            maxLength={2000}
            rows={4}
            className="w-full border border-ink/20 bg-white px-3 py-2 text-[15px] text-ink focus:border-ink focus:outline-none"
            placeholder={effectiveMode === "vorschlag" ? "z. B. Insel 20 cm schmaler, dafür mehr Durchgang zum Esstisch" : "Was gefällt Ihnen, was fehlt?"}
          />
          <p className="text-xs text-ink/75">
            Ihre Nachricht wird zur Bearbeitung des Projekts gespeichert (siehe{" "}
            <Link href="/de/portal/datenschutz" className={`py-1 underline underline-offset-2 ${focusRing}`}>
              Datenschutzerklärung
            </Link>
            ).
          </p>
          <button type="submit" disabled={busy || !body.trim()} className={`min-h-12 w-full bg-ink px-6 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto ${focusRing}`}>
            {busy ? "Wird gesendet …" : "Senden"}
          </button>
        </form>
      )}
      <p aria-live="polite" className={`text-sm ${status?.ok === false ? "text-red-800" : "text-ink/80"}`}>
        {status?.text}
      </p>
    </div>
  );
}

export default function PlanungWorkspace({ projectId, variants, beforeScene, initialEntries, initialVotes, initialApproval }) {
  const [activeId, setActiveId] = useState(variants[variants.length - 1]?.id);
  const [view, setView] = useState("bild");
  const [entries, setEntries] = useState(initialEntries);
  const [votes, setVotes] = useState(initialVotes);
  const [voteBusy, setVoteBusy] = useState(null);
  const [approval, setApproval] = useState(initialApproval);
  const [approveFor, setApproveFor] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [annotating, setAnnotating] = useState(false);
  const [pending, setPending] = useState(null);
  const [pinText, setPinText] = useState("");
  const [pinBusy, setPinBusy] = useState(false);
  const [pinError, setPinError] = useState("");
  const [selectedPin, setSelectedPin] = useState(null);
  const [compare, setCompare] = useState([variants[0]?.id, variants[1]?.id || variants[0]?.id]);
  const [threadFilter, setThreadFilter] = useState(false);
  const stageRef = useRef(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const active = variants.find((v) => v.id === activeId) || variants[0];
  const add = (entry) => setEntries((list) => [...list, entry]);

  // Pins: numbered per rendering in order of creation.
  const { pinsByVariant, pinNumbers } = useMemo(() => {
    const byV = {};
    const nums = {};
    for (const e of entries) {
      if (e.kind !== "annotation" || !e.point) continue;
      byV[e.renderingId] = byV[e.renderingId] || [];
      const n = byV[e.renderingId].length + 1;
      byV[e.renderingId].push({ ...e, n });
      nums[e.id] = n;
    }
    return { pinsByVariant: byV, pinNumbers: nums };
  }, [entries]);

  if (!active) return null;
  const pins = pinsByVariant[active.id] || [];
  const selected = pins.find((p) => p.id === selectedPin);
  const approvedVariant = approval && variants.find((v) => v.id === approval.renderingId);

  const vote = async (variant, value) => {
    const prev = votes[variant.id] ?? null;
    setVotes((v) => ({ ...v, [variant.id]: value === "none" ? null : value }));
    setVoteBusy(variant.id);
    try {
      await postFeedback({ projectId, renderingId: variant.id, kind: "vote", vote: value });
    } catch {
      setVotes((v) => ({ ...v, [variant.id]: prev }));
    } finally {
      setVoteBusy(null);
    }
  };

  const savePin = async (e) => {
    e.preventDefault();
    setPinBusy(true);
    setPinError("");
    try {
      const entry = await postFeedback({ projectId, renderingId: active.id, kind: "annotation", body: pinText, point: pending });
      add(entry);
      setPending(null);
      setPinText("");
      setAnnotating(false);
      setSelectedPin(entry.id);
    } catch (err) {
      setPinError(err.message);
    } finally {
      setPinBusy(false);
    }
  };

  const startAnnotating = (viaKeyboard) => {
    setView("bild");
    setAnnotating(true);
    setSelectedPin(null);
    setPending(viaKeyboard ? { x: 50, y: 50 } : null);
  };
  const cancelPin = () => {
    setAnnotating(false);
    setPending(null);
    setPinText("");
    setPinError("");
  };

  const select = (id) => {
    setActiveId(id);
    cancelPin();
    setSelectedPin(null);
  };

  const showPin = (entry) => {
    select(entry.renderingId);
    setView("bild");
    setSelectedPin(entry.id);
    stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [cA, cB] = compare.map((id) => variants.find((v) => v.id === id) || variants[0]);

  return (
    <div className="space-y-5 lg:space-y-6">
      {approvedVariant && (
        <div className="flex items-start gap-3 border border-gold/50 bg-gold/10 p-4 text-sm text-ink" role="status">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
          <p>
            <strong>Freigegeben: Variante {approvedVariant.letter}</strong> („{approvedVariant.title}“) am {formatDate(approval.createdAt)}. Das Team erstellt das Angebot auf dieser Grundlage – Sie finden es dann unter Dokumente.
          </p>
        </div>
      )}

      <section aria-labelledby="planungen-title" className="border border-ink/10 bg-white p-4 sm:p-7" ref={stageRef}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="planungen-title" className="font-display text-xl text-ink sm:text-2xl">
            Planungen
          </h2>
          <p className="text-xs text-ink/75">{variants.length} {variants.length === 1 ? "Variante" : "Varianten"}</p>
        </div>

        {/* variant picker */}
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Variante wählen">
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={v.id === active.id}
              onClick={() => select(v.id)}
              className={`flex min-h-11 shrink-0 items-center gap-2 border p-1.5 pr-3 text-left text-sm ${focusRing} ${v.id === active.id ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink/40"}`}
            >
              <span className="block h-9 w-14 overflow-hidden bg-stone" aria-hidden="true">
                <VariantImage variant={v} />
              </span>
              <span className="font-semibold">{v.letter}</span>
              <span className="sr-only">: {v.title}</span>
              {votes[v.id] === "up" && <ThumbsUp size={14} aria-label="gefällt mir" />}
              {votes[v.id] === "down" && <ThumbsDown size={14} aria-label="gefällt mir nicht" />}
              {approval?.renderingId === v.id && <CheckCircle2 size={14} aria-label="freigegeben" />}
            </button>
          ))}
        </div>

        {/* view switch */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" role="group" aria-label="Ansicht">
          {VIEWS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={view === id} onClick={() => { setView(id); if (id !== "bild") cancelPin(); }} className={`${chip(view === id)} justify-center`}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {view === "bild" && (
          <div className="space-y-3">
            <div className="relative">
              <AnnotatableImage
                variant={active}
                pins={pins}
                annotating={annotating}
                pending={pending}
                onPending={setPending}
                selectedId={selectedPin}
                onSelect={setSelectedPin}
              />
              <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
                <span className="bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">Variante {active.letter}</span>
                <AiBadge variant={active} />
              </div>
              {!annotating && (
                <button type="button" onClick={() => setLightbox(active)} className={`absolute right-3 top-3 flex size-11 items-center justify-center bg-white/95 text-ink shadow ${focusRing}`} aria-label="Bild im Vollbild ansehen">
                  <Expand size={18} aria-hidden="true" />
                </button>
              )}
            </div>
            {!active.imageUrl && <p className="text-xs text-ink/75">Platzhalter-Visualisierung ({SCENES[active.scene]?.label}) – das hochaufgelöste Rendering stellt Ihr Beratungsteam hier bereit.</p>}

            {selected && (
              <div className="flex items-start gap-3 bg-bone p-3 text-sm text-ink" aria-live="polite">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-ink-deep">{selected.n}</span>
                <p className="flex-1">
                  <span className="font-semibold">{selected.author}: </span>
                  {selected.body}
                  {entries.some((e) => e.parentId === selected.id) && <span className="mt-1 block text-ink/70">Antwort des Teams im Verlauf unten.</span>}
                </p>
                <button type="button" onClick={() => setSelectedPin(null)} className={`-my-2 -mr-2 flex size-11 shrink-0 items-center justify-center hover:bg-stone ${focusRing}`} aria-label="Markierung schließen">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}

            {annotating ? (
              pending ? (
                <form onSubmit={savePin} className="space-y-2 border border-gold/50 bg-gold/10 p-3">
                  <label htmlFor="pin-text" className="block text-sm font-medium text-ink">
                    Ihr Kommentar zu dieser Stelle
                  </label>
                  <textarea id="pin-text" value={pinText} onChange={(e) => setPinText(e.target.value)} required maxLength={1000} rows={3} className="w-full border border-ink/20 bg-white px-3 py-2 text-[15px] text-ink focus:border-ink focus:outline-none" placeholder="z. B. Hier bitte eine Steckdose einplanen" />
                  <p className="text-xs text-ink/70">Tipp: Den Punkt können Sie durch erneutes Tippen oder mit den Pfeiltasten verschieben.</p>
                  {pinError && <p role="alert" className="text-sm text-red-800">{pinError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={pinBusy || !pinText.trim()} className={`min-h-11 flex-1 bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50 sm:flex-none ${focusRing}`}>
                      {pinBusy ? "Speichert …" : "Markierung senden"}
                    </button>
                    <button type="button" onClick={cancelPin} className={`min-h-11 border border-ink/20 bg-white px-5 text-sm text-ink ${focusRing}`}>
                      Abbrechen
                    </button>
                  </div>
                </form>
              ) : (
                <button type="button" onClick={cancelPin} className={`min-h-11 border border-ink/20 px-5 text-sm text-ink ${focusRing}`}>
                  Markieren abbrechen
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={(e) => startAnnotating(e.detail === 0)}
                className={`inline-flex min-h-11 items-center gap-2 border border-ink/20 px-5 text-sm text-ink hover:border-ink ${focusRing}`}
              >
                <MapPin size={16} aria-hidden="true" />
                Punkt im Bild markieren{pins.length ? ` (${pins.length} vorhanden)` : ""}
              </button>
            )}
          </div>
        )}

        {view === "vorher" && (
          <BeforeAfter
            before={{ variant: null, scene: beforeScene, label: "Bestand (Skizze)" }}
            after={{ variant: active, scene: active.scene, label: `Variante ${active.letter}` }}
          />
        )}

        {view === "vergleich" && (
          <div className="space-y-5">
            {variants.length > 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1].map((slot) => (
                    <label key={slot} className="text-sm text-ink">
                      <span className="mb-1 block text-xs text-ink/70">{slot === 0 ? "Links" : "Rechts"}</span>
                      <select
                        value={compare[slot]}
                        onChange={(e) => setCompare((c) => (slot === 0 ? [e.target.value, c[1]] : [c[0], e.target.value]))}
                        className="min-h-11 w-full border border-ink/20 bg-white px-3 text-sm"
                      >
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            Variante {v.letter}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <BeforeAfter before={{ variant: cA, scene: cA.scene, label: `Variante ${cA.letter}` }} after={{ variant: cB, scene: cB.scene, label: `Variante ${cB.letter}` }} />
              </div>
            )}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {variants.map((v) => (
                <li key={v.id} className="overflow-hidden border border-ink/10">
                  <button type="button" onClick={() => setLightbox(v)} className={`relative block aspect-16/10 w-full bg-stone ${focusRing}`} aria-label={`Variante ${v.letter} im Vollbild`}>
                    <VariantImage variant={v} />
                    <span className="absolute left-2 top-2 flex gap-1">
                      <span className="bg-white/95 px-2 py-0.5 text-xs font-semibold text-ink">{v.letter}</span>
                      <AiBadge variant={v} />
                    </span>
                  </button>
                  <div className="space-y-3 p-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{v.title}</p>
                      {v.description && <p className="mt-1 text-xs leading-relaxed text-ink/70">{v.description}</p>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <VoteButtons value={votes[v.id]} letter={v.letter} busy={voteBusy === v.id} onVote={(val) => vote(v, val)} />
                      <button type="button" onClick={() => { select(v.id); setView("bild"); }} className={`min-h-11 px-3 text-sm text-ink underline underline-offset-4 ${focusRing}`}>
                        Ansehen
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === "3d" && <Viewer3D variant={active} />}

        {/* meta + actions of the active variant */}
        {view !== "vergleich" && (
          <div className="mt-5 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                Variante {active.letter} · {active.title}
              </p>
              {active.description && <p className="mt-1 text-sm leading-relaxed text-ink/75">{active.description}</p>}
              <p className="mt-1 text-xs text-ink/75">
                Version {active.version} vom {formatDate(active.createdAt)}
                {active.aiGenerated && " · Bild mit KI erstellt oder bearbeitet, nicht maßstäblich"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <VoteButtons value={votes[active.id]} letter={active.letter} busy={voteBusy === active.id} onVote={(val) => vote(active, val)} />
              {approval?.renderingId === active.id ? (
                <span className="inline-flex min-h-11 items-center gap-2 bg-gold/15 px-4 text-sm font-semibold text-gold-text">
                  <CheckCircle2 size={16} aria-hidden="true" /> Freigegeben
                </span>
              ) : (
                <button type="button" onClick={() => setApproveFor(active)} className={`inline-flex min-h-12 items-center gap-2 bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-deep ${focusRing}`}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Gefällt mir – bitte Angebot
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        <section aria-labelledby="rueckmeldung-title" className="border border-ink/10 bg-white p-4 sm:p-7 lg:col-span-2 lg:self-start">
          <h2 id="rueckmeldung-title" className="mb-4 font-display text-xl text-ink sm:text-2xl">
            Ihre Rückmeldung
          </h2>
          <Composer projectId={projectId} variant={active} onAdded={add} />
        </section>

        <section aria-labelledby="verlauf-title" className="border border-ink/10 bg-white p-4 sm:p-7 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="verlauf-title" className="font-display text-xl text-ink sm:text-2xl">
              Verlauf
            </h2>
            <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={threadFilter} onChange={(e) => setThreadFilter(e.target.checked)} className="size-5 accent-ink" />
              nur Variante {active.letter}
            </label>
          </div>
          <Thread projectId={projectId} entries={entries} variants={variants} pinNumbers={pinNumbers} onAdded={add} onShowPin={showPin} filterId={threadFilter ? active.id : null} />
        </section>
      </div>

      <ApproveDialog
        open={Boolean(approveFor)}
        variant={approveFor}
        onClose={() => setApproveFor(null)}
        onConfirm={async (note) => {
          const entry = await postFeedback({ projectId, renderingId: approveFor.id, kind: "freigabe", confirm: true, ...(note.trim() ? { body: note.trim() } : {}) });
          add(entry);
          setApproval(entry);
          setApproveFor(null);
        }}
      />
      {lightbox && <Lightbox key={lightbox.id} variant={lightbox} onClose={closeLightbox} />}
    </div>
  );
}
