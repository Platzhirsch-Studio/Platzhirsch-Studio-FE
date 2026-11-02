"use client";

// R8 (ux P2-6): Auf dem Handy ist der Concierge ein Bottom-Sheet mit
// schwebendem Knopf, der sich unter der Cookie-Leiste versteckt. Damit das
// Werkzeug im ersten Bildschirm steht, öffnet dieser Knopf direkt unter H1 und
// Lead dasselbe Sheet (er löst den Knopf des Concierge aus, aria-controls
// "concierge-panel"). Nur unter 768 px sichtbar; ab md steht das Panel inline.
export default function StartButton({ className }) {
  const open = () => {
    const trigger = document.querySelector('button[aria-controls="concierge-panel"]');
    if (trigger) trigger.click();
  };
  return (
    <button type="button" onClick={open} className={className} data-concierge-start="">
      Concierge starten
    </button>
  );
}
