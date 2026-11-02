"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { tagebuchT } from "./texte";

export default function FotoLoeschen({ projektId, fotoId, titel }) {
  const s = tagebuchT(useTranslations());
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState("");

  async function loeschen() {
    if (!window.confirm(s("deleteConfirm"))) return;
    setBusy(true);
    setFehler("");
    const res = await fetch(`/api/portal/tagebuch/${encodeURIComponent(projektId)}/foto?id=${fotoId}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (res?.ok) return router.refresh();
    const body = await res?.json().catch(() => null);
    setFehler(body?.error || s("deleteFailed"));
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={loeschen}
        disabled={busy}
        aria-label={`${s("delete")}: ${titel}`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2 text-sm text-ink/80 underline decoration-ink/25 underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
      >
        <Trash2 size={16} aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{s("delete")}</span>
      </button>
      {fehler && (
        <span role="alert" className="max-w-56 text-right text-xs text-red-900">
          {fehler}
        </span>
      )}
    </span>
  );
}
