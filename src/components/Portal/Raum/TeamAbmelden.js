"use client";
import { useRouter } from "next/navigation";

export default function TeamAbmelden() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/portal/raum/team", { method: "DELETE", credentials: "same-origin" });
        router.refresh();
      }}
      className="inline-flex min-h-11 items-center px-3 text-sm text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      Abmelden
    </button>
  );
}
