"use client";
// Aufklapper für „Mehr Zahlen“ (§ 2.1): eingeklappt, Zustand je Benutzer in localStorage (mit try/catch;
// ohne Speicher eingeklappt). Inhalt wird erst beim Aufklappen eingehängt (lazy).
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import "./marketing.css";

export default function Aufklapper({ schluessel, titel, unter, children, testid }) {
  const [offen, setOffen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(`ph-bo:marketing:${schluessel}`) === "1") Promise.resolve().then(() => setOffen(true));
    } catch {
      /* ohne Speicher eingeklappt */
    }
  }, [schluessel]);
  const wechsel = () => {
    setOffen((o) => {
      try {
        localStorage.setItem(`ph-bo:marketing:${schluessel}`, o ? "0" : "1");
      } catch {
        /* egal */
      }
      return !o;
    });
  };
  return (
    <section className="min-w-0" data-testid={testid}>
      <button type="button" onClick={wechsel} aria-expanded={offen} className="flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left transition-colors hover:bg-(--color-bo-fill)">
        <ChevronDown className="size-5 shrink-0 transition-transform duration-200" style={{ transform: offen ? "rotate(0deg)" : "rotate(-90deg)" }} strokeWidth={1.75} aria-hidden="true" />
        <span className="min-w-0">
          <span className="bo-titel-kachel block">{titel}</span>
          {unter && <span className="bo-mar-unter">{unter}</span>}
        </span>
      </button>
      {offen && <div className="mt-4">{children}</div>}
    </section>
  );
}
