"use client";
// Küchenplaner – Knopf „Drucken / als PDF speichern“ für die Druckansicht.
import { Printer } from "lucide-react";

export default function PrintButton({ label = "Drucken / als PDF speichern" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-12 items-center gap-2 bg-ink px-6 text-ui text-paper hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff] print:hidden"
    >
      <Printer size={16} aria-hidden="true" /> {label}
    </button>
  );
}
