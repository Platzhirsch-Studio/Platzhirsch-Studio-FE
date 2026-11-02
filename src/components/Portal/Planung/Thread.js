"use client";
import { useState } from "react";
import { CheckCircle2, Lightbulb, MapPin, MessageSquare, Mic, Reply } from "lucide-react";
import { formatDate, formatTime } from "@/lib/portal/format";
import { focusRing, postFeedback } from "./client";

// Conversation about the planning: customer entries and team replies,
// replies nested one level under their parent.

const KIND = {
  kommentar: { label: "Kommentar", Icon: MessageSquare },
  vorschlag: { label: "Vorschlag", Icon: Lightbulb },
  annotation: { label: "Markierung", Icon: MapPin },
  sprachnachricht: { label: "Sprachnachricht", Icon: Mic },
  freigabe: { label: "Freigabe", Icon: CheckCircle2 },
};

function Entry({ e, variant, pinNo, onShowPin, compact }) {
  const k = KIND[e.kind] || KIND.kommentar;
  const studio = e.from === "studio";
  return (
    <div className={`border p-4 ${studio ? "border-walnut/15 bg-[#f4efe8]" : "border-ink/10 bg-white"} ${compact ? "" : ""}`}>
      <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${studio ? "text-ink/80" : "text-ink/70"}`}>
        <span className="font-semibold text-ink">{studio ? e.author || "Platzhirsch-Team" : e.author || "Sie"}</span>
        <span className={`px-2 py-0.5 font-semibold ${studio ? "bg-walnut text-white" : "bg-stone text-ink"}`}>{studio ? "Team" : "Sie"}</span>
        <span className="inline-flex items-center gap-1">
          <k.Icon size={13} aria-hidden="true" />
          {k.label}
          {pinNo ? ` ${pinNo}` : ""}
        </span>
        {variant && <span className="border border-ink/20 px-2 py-0.5">Variante {variant.letter}</span>}
        <time dateTime={e.createdAt} className="ml-auto">
          {formatDate(e.createdAt)}, {formatTime(e.createdAt)}
        </time>
      </div>
      {e.kind === "freigabe" && <p className="mt-2 text-sm font-semibold text-ink">Diese Planung gefällt mir – bitte Angebot.</p>}
      {e.body && <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{e.body}</p>}
      {e.audio && (
        <audio controls preload="none" src={`/api/portal/feedback/voice/${encodeURIComponent(e.audio.id)}`} className="mt-3 w-full">
          Sprachnachricht ({Math.round(e.audio.durationSec)} s)
        </audio>
      )}
      {pinNo && onShowPin && (
        <button type="button" onClick={onShowPin} className={`mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-ink/80 underline underline-offset-4 ${focusRing}`}>
          <MapPin size={14} aria-hidden="true" /> Im Bild zeigen
        </button>
      )}
    </div>
  );
}

function ReplyBox({ projectId, parent, onAdded }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const id = `reply-${parent.id}`;

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex min-h-11 items-center gap-1.5 text-sm text-ink/80 hover:text-ink ${focusRing}`}>
        <Reply size={15} aria-hidden="true" /> Antworten
      </button>
    );
  }
  return (
    <form
      className="space-y-2"
      onSubmit={async (ev) => {
        ev.preventDefault();
        setBusy(true);
        setError("");
        try {
          const entry = await postFeedback({ projectId, kind: "kommentar", body, parentId: parent.id, ...(parent.renderingId ? { renderingId: parent.renderingId } : {}) });
          onAdded(entry);
          setBody("");
          setOpen(false);
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor={id} className="text-sm font-medium text-ink">
        Ihre Antwort
      </label>
      <textarea id={id} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} rows={3} autoFocus className="w-full border border-ink/20 bg-white px-3 py-2 text-[15px] text-ink focus:border-ink focus:outline-none" />
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !body.trim()} className={`min-h-11 bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50 ${focusRing}`}>
          {busy ? "Sendet …" : "Senden"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={`min-h-11 border border-ink/20 px-5 text-sm text-ink ${focusRing}`}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}

export default function Thread({ projectId, entries, variants, pinNumbers, onAdded, onShowPin, filterId }) {
  const byId = Object.fromEntries(variants.map((v) => [v.id, v]));
  const roots = entries.filter((e) => !e.parentId && (!filterId || e.renderingId === filterId)).reverse();
  const replies = (id) => entries.filter((e) => e.parentId === id);

  if (!roots.length) return <p className="bg-bone px-4 py-5 text-sm text-ink/70">Noch keine Rückmeldungen{filterId ? " zu dieser Variante" : ""}.</p>;

  return (
    <ol className="space-y-4">
      {roots.map((e) => (
        <li key={e.id} className="space-y-2">
          <Entry e={e} variant={byId[e.renderingId]} pinNo={pinNumbers[e.id]} onShowPin={pinNumbers[e.id] ? () => onShowPin(e) : null} />
          {replies(e.id).length > 0 && (
            <ol className="ml-4 space-y-2 border-l-2 border-stone pl-3 sm:ml-8 sm:pl-4" aria-label="Antworten">
              {replies(e.id).map((r) => (
                <li key={r.id}>
                  <Entry e={r} compact />
                </li>
              ))}
            </ol>
          )}
          <div className="ml-4 sm:ml-8">
            <ReplyBox projectId={projectId} parent={e} onAdded={onAdded} />
          </div>
        </li>
      ))}
    </ol>
  );
}
