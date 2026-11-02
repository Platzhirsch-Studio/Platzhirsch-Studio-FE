"use client";
// Schaltfläche, die eine Checkout-Session auf dem Server anfordert und zur
// Bezahlseite weiterleitet (Anzahlung). Der Betrag kommt vom Server.
import { useState } from "react";
import { useHydrated } from "@/components/Forms/useFormGuard";
import { FormAlert } from "@/components/Forms/FormAlert";

const TEXT = {
  rate_limited: "Zu viele Versuche in kurzer Zeit. Bitte versuchen Sie es in einigen Minuten erneut.",
  paid: "Diese Anzahlung ist bereits bezahlt.",
  processing: "Die letzte Zahlung wird gerade verarbeitet. Bitte versuchen Sie es in einigen Minuten erneut.",
  fallback: "Die Bezahlseite ist gerade nicht erreichbar. Bitte versuchen Sie es später erneut oder rufen Sie uns an: +43 5574 46255.",
};

export default function PayButton({ endpoint, label, mock = false }) {
  const hydrated = useHydrated();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { Accept: "application/json", ...(mock ? { "x-payments-mock": "1" } : {}) } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && typeof data.url === "string") {
        window.location.assign(data.url);
        return;
      }
      setStatus({ type: "error", text: TEXT[data.code] || TEXT.fallback });
    } catch {
      setStatus({ type: "error", text: "Keine Verbindung. Bitte prüfen Sie Ihre Internetverbindung." });
    }
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <FormAlert status={status} />
      <button
        type="button"
        onClick={onClick}
        disabled={!hydrated || loading}
        className="inline-flex min-h-12 w-full items-center justify-center bg-action px-8 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:min-h-13"
      >
        {loading ? "Weiter zur Bezahlseite …" : label}
      </button>
    </div>
  );
}
