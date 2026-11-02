"use client";
// Löschknopf (Widerruf, DSGVO Art. 17): funktioniert auch ohne JavaScript
// (Formular-POST mit Bestätigungs-Häkchen), mit JavaScript per DELETE.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { LOESCHEN_TEXT } from "@/lib/raumzwilling/einwilligung";
import { DATUM } from "@/lib/raumzwilling/config";

const fokus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function LoeschenBereich({ projektId, loeschenAm, bitteBestaetigen = false }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const [fehler, setFehler] = useState(bitteBestaetigen ? "Bitte bestätigen Sie das Löschen mit dem Häkchen." : "");
  const [laeuft, setLaeuft] = useState(false);

  async function loeschen(e) {
    e.preventDefault();
    if (!ok) {
      setFehler("Bitte bestätigen Sie das Löschen mit dem Häkchen.");
      return;
    }
    setLaeuft(true);
    const res = await fetch(`/api/portal/raum/${projektId}`, { method: "DELETE", credentials: "same-origin" });
    if (res.ok) {
      router.push(`/de/portal/raum?geloescht=${encodeURIComponent(projektId)}`);
      router.refresh();
    } else {
      setLaeuft(false);
      setFehler("Löschen fehlgeschlagen. Bitte erneut versuchen oder schreiben Sie uns an info@platzhirsch.studio.");
    }
  }

  return (
    <section id="loeschen" aria-labelledby="loeschen-titel" className="border border-ink/10 bg-white p-5 sm:p-7">
      <h2 id="loeschen-titel" className="font-display text-xl text-ink sm:text-2xl">
        Raum löschen
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/80">
        {LOESCHEN_TEXT}{" "}
        {loeschenAm && (
          <>
            Ohne Ihr Zutun löschen wir den Raum am {DATUM.format(new Date(loeschenAm))}, außer er wird für Ihren Auftrag gebraucht.
          </>
        )}
      </p>
      <form method="post" action={`/api/portal/raum/${projektId}`} onSubmit={loeschen} className="mt-4 space-y-3">
        <label className="flex items-start gap-3 text-[15px] text-ink">
          <input type="checkbox" name="bestaetigung" value="LOESCHEN" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
          <span>Ja, diesen Raum mit allen Kommentaren endgültig löschen.</span>
        </label>
        {fehler && (
          <p role="alert" className="text-sm text-error">
            {fehler}
          </p>
        )}
        <button type="submit" disabled={laeuft} className={`inline-flex min-h-11 items-center gap-2 border border-error px-5 text-sm font-semibold text-error hover:bg-error hover:text-white disabled:opacity-60 ${fokus}`}>
          <Trash2 size={15} aria-hidden="true" /> {laeuft ? "Wird gelöscht …" : "Raum löschen"}
        </button>
      </form>
    </section>
  );
}
