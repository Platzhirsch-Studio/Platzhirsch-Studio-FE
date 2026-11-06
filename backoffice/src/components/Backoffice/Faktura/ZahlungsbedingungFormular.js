"use client";
// Zahlungsbedingung (§ 3.11 Stammdaten): Live-Satz „Kunde zahlt 40 % bei Auftrag …“, Live-Fehler bei > 100 %,
// Speichern nur Leitung („Gespeichert 14:02“).

import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { zahlungsbedingungSatz } from "@/lib/backoffice/faktura/betraege";
import { zahlungsbedingungSpeichernAction } from "@/lib/backoffice/faktura/actions";
import { Feld } from "./teile";
import { useVorgang } from "./hilfen";

export default function ZahlungsbedingungFormular({ bedingung, darf = false, neu = false }) {
  const router = useRouter();
  const [w, setW] = useState({ ...bedingung });
  const [stand, setStand] = useState(null);
  const v = useVorgang();
  const satz = zahlungsbedingungSatz(w);
  const zahl = (k) => (e) => setW((x) => ({ ...x, [k]: Number(e.target.value.replace(",", ".")) || 0 }));
  async function speichern() {
    await v.start(async () => {
      const r = await zahlungsbedingungSpeichernAction({ ...w, name: neu ? undefined : bedingung.name });
      setStand(r.ok ? `Gespeichert ${r.gespeichert}` : r.message);
      if (r.ok) router.refresh();
    });
  }
  const id = (k) => `zb-${bedingung.name || "neu"}-${k}`;
  return (
    <div className="flex flex-col gap-3">
      {neu && (
        <Feld label="Titel" id={id("t")}>
          <input id={id("t")} className="bo-fk-feld" value={w.titel} onChange={(e) => setW((x) => ({ ...x, titel: e.target.value }))} disabled={!darf} />
        </Feld>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Feld label="Anzahlung %" id={id("a")}>
          <input id={id("a")} className="bo-fk-feld text-right" inputMode="numeric" value={w.anzahlung_prozent ?? 0} onChange={zahl("anzahlung_prozent")} disabled={!darf} aria-invalid={!satz.ok || undefined} />
        </Feld>
        <Feld label="Teilzahlung %" id={id("tz")}>
          <input id={id("tz")} className="bo-fk-feld text-right" inputMode="numeric" value={w.teilzahlung_prozent ?? 0} onChange={zahl("teilzahlung_prozent")} disabled={!darf} aria-invalid={!satz.ok || undefined} />
        </Feld>
        <Feld label="Zieltage" id={id("z")}>
          <input id={id("z")} className="bo-fk-feld text-right" inputMode="numeric" value={w.zieltage ?? 14} onChange={zahl("zieltage")} disabled={!darf} />
        </Feld>
        <Feld label="Skonto %" id={id("s")}>
          <input id={id("s")} className="bo-fk-feld text-right" inputMode="decimal" value={(Number(w.skonto_promille) || 0) / 10 || ""} onChange={(e) => setW((x) => ({ ...x, skonto_promille: Math.round((Number(e.target.value.replace(",", ".")) || 0) * 10) }))} disabled={!darf} />
        </Feld>
      </div>
      <p className={`text-[14px] ${satz.ok ? "text-bo-text" : "text-bo-ziegel-text"}`} role={satz.ok ? undefined : "alert"} data-testid="zb-satz">
        {satz.satz}
      </p>
      {darf && (
        <div className="flex items-center justify-end gap-3">
          {stand && <span className="text-[13px] text-bo-text-soft">{stand}</span>}
          <Knopf size="s" variant="secondary" onClick={speichern} laedt={v.zeigen} disabled={!satz.ok || v.laeuft || (neu && !w.titel)}>
            Speichern
          </Knopf>
        </div>
      )}
    </div>
  );
}
