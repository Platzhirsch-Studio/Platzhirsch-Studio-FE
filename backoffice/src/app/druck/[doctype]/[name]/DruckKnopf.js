"use client";
export default function DruckKnopf() {
  return (
    <button type="button" onClick={() => window.print()} className="underline">
      Drucken
    </button>
  );
}
