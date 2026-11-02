"use client";
// Abmelden aus der persönlichen Team-Anmeldung des Projekt-Tagebuchs (Cookie ph_tagebuch_team).
import { useRouter } from "next/navigation";

export default function TeamAbmelden({ label = "Abmelden" }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/portal/tagebuch/team", { method: "DELETE", credentials: "same-origin" });
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center px-3 text-sm text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {label}
    </button>
  );
}
