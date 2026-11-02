"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { sendPortalMessage } from "./actions";

// Reply field of the mailbox. Server Action with progressive enhancement
// (submits before hydration too), own German validation (noValidate).

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export default function ReplyForm({ projects, defaultProjectId = "" }) {
  const [state, action, pending] = useActionState(sendPortalMessage, null);
  const formRef = useRef(null);
  const e = state?.errors || {};

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} noValidate className="space-y-4">
      {projects.length > 0 && (
        <div>
          <label htmlFor="msg-project" className="block text-sm font-semibold text-ink">
            Betrifft
          </label>
          <select
            id="msg-project"
            name="projectId"
            defaultValue={state?.values?.projectId ?? defaultProjectId}
            aria-invalid={e.projectId ? true : undefined}
            aria-describedby={e.projectId ? "msg-project-err" : undefined}
            className={`mt-1.5 block min-h-12 w-full border border-ink/20 bg-white px-3.5 text-base text-ink ${focusRing}`}
          >
            <option value="">Allgemein</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {e.projectId && (
            <p id="msg-project-err" className="mt-1.5 text-sm text-red-800">
              {e.projectId}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="msg-body" className="block text-sm font-semibold text-ink">
          Ihre Nachricht
        </label>
        <textarea
          id="msg-body"
          name="body"
          rows={5}
          maxLength={2000}
          defaultValue={state?.ok ? "" : state?.values?.body}
          aria-invalid={e.body ? true : undefined}
          aria-describedby={["msg-privacy", e.body ? "msg-body-err" : null].filter(Boolean).join(" ")}
          placeholder="Ihre Frage oder Rückmeldung an das Beratungsteam"
          className={`mt-1.5 block w-full border border-ink/20 bg-white px-3.5 py-3 text-base text-ink placeholder:text-ink/50 aria-[invalid=true]:border-red-700 ${focusRing}`}
        />
        {e.body && (
          <p id="msg-body-err" className="mt-1.5 text-sm text-red-800">
            {e.body}
          </p>
        )}
      </div>

      <p id="msg-privacy" className="text-[13px] leading-relaxed text-ink/75">
        Ihre Nachricht speichern wir zur Bearbeitung Ihres Projekts (Art. 6 Abs. 1 lit. b DSGVO). Mehr in der{" "}
        <Link href="/de/portal/datenschutz" className={`py-1 underline underline-offset-2 hover:text-ink ${focusRing}`}>
          Datenschutzerklärung zum Kundenportal
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={pending}
        className={`inline-flex min-h-12 w-full items-center justify-center gap-2 bg-ink px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-ink-deep disabled:opacity-60 sm:w-auto ${focusRing}`}
      >
        {pending ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
        {pending ? "Wird gesendet …" : "Nachricht senden"}
      </button>

      <div role="status" aria-live="polite">
        {state?.message && (
          <p
            className={`flex gap-2 border px-4 py-3 text-sm ${state.ok ? "border-ink/15 bg-bone text-ink" : "border-red-700/30 bg-red-50 text-red-900"}`}
          >
            {state.ok && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />}
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
