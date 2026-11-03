"use client";
// Rechtstexte – Knopf „Drucken / als PDF speichern“ (Druckansicht über den
// Browser; die Seite blendet Kopf- und Fußzeile per print:hidden aus).
import { Printer } from "lucide-react";

export default function PrintButton({ label = "Drucken / als PDF speichern" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-12 items-center gap-2 border border-line-strong bg-surface px-5 text-ui text-text hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink print:hidden"
    >
      <Printer size={16} aria-hidden="true" /> {label}
    </button>
  );
}
