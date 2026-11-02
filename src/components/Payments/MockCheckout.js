"use client";
// Simulierte Bezahlseite (nur Entwicklung/Tests). Jede Schaltfläche schickt
// ein signiertes Ereignis durch denselben Webhook-Pfad wie Stripe.
import { useState } from "react";
import { useHydrated } from "@/components/Forms/useFormGuard";
import { FormAlert } from "@/components/Forms/FormAlert";

const OUTCOMES = [
  { id: "erfolg", label: "Zahlung erfolgreich", primary: true },
  { id: "ausstehend", label: "Lastschrift: Zahlung ausstehend" },
  { id: "abbruch", label: "Abbrechen" },
];
const LATER = [
  { id: "lastschrift_bestaetigt", label: "Lastschrift bestätigen" },
  { id: "fehlschlag", label: "Lastschrift fehlgeschlagen" },
  { id: "erstattung", label: "Erstatten" },
];

export default function MockCheckout({ session, done = false }) {
  const hydrated = useHydrated();
  const [busy, setBusy] = useState(null);
  const [status, setStatus] = useState(null);
  const run = async (ausgang) => {
    setBusy(ausgang);
    setStatus(null);
    try {
      const res = await fetch("/api/payments/mock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session, ausgang }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.redirect) {
        window.location.assign(data.redirect);
        return;
      }
      setStatus({ type: "error", text: "Simulation fehlgeschlagen." });
    } catch {
      setStatus({ type: "error", text: "Keine Verbindung." });
    }
    setBusy(null);
  };
  const list = done ? LATER : OUTCOMES;
  return (
    <div className="space-y-4">
      <FormAlert status={status} />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {list.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={!hydrated || Boolean(busy)}
            onClick={() => run(o.id)}
            className={
              o.primary
                ? "inline-flex min-h-12 items-center justify-center bg-action px-8 text-ui text-paper hover:bg-action-hover disabled:opacity-50"
                : "inline-flex min-h-12 items-center justify-center border border-ink px-6 text-ui text-text hover:bg-surface-raised disabled:opacity-50"
            }
          >
            {busy === o.id ? "…" : o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
