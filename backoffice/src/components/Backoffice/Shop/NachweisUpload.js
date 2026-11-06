"use client";
// Absendenachweis am Widerruf (§ 5.6): PDF/JPG ≤ 10 MB, Fehler „Datei zu groß (max. 10 MB)“ sofort am Feld.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "@/components/Backoffice/Knopf";
import { nachweisHochladenAction } from "@/lib/backoffice/shop/actions";

export default function NachweisUpload({ widerruf, vorhanden = false, schreiben = true }) {
  const router = useRouter();
  const [fehler, setFehler] = useState(null);
  const [laeuft, start] = useTransition();
  const [datei, setDatei] = useState(null);
  if (!schreiben) return <p className="text-[14px] text-bo-text-soft">{vorhanden ? "Nachweis liegt vor." : "Noch kein Nachweis."}</p>;
  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => {
      e.preventDefault();
      if (!datei) return;
      const fd = new FormData();
      fd.set("widerruf", widerruf);
      fd.set("datei", datei);
      start(async () => {
        const r = await nachweisHochladenAction(fd);
        if (!r.ok) setFehler(r.message);
        else router.refresh();
      });
    }}>
      {vorhanden && <p className="bo-shop-flaeche text-[14px]" data-ton="ok">Nachweis liegt vor – Erstatten ist möglich.</p>}
      <input type="file" accept="application/pdf,image/jpeg" aria-label="Absendenachweis" data-testid="nachweis-datei" className="text-[14px]"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          setFehler(f && f.size > 10 * 1024 * 1024 ? "Datei zu groß (max. 10 MB)" : null);
          setDatei(f && f.size <= 10 * 1024 * 1024 ? f : null);
        }} />
      {fehler && <p className="bo-shop-fehler" role="alert">{fehler}</p>}
      <span><Knopf type="submit" disabled={!datei} laedt={laeuft}>Hochladen</Knopf></span>
    </form>
  );
}
