"use client";
// Filter-Pillen als Auswahl (Lounge §6 „Suche“: Pillenfeld + Filter als runde Pillen in einer Reihe).
// Reiner URL-Zustand (Q-B7): jede Änderung ersetzt den Parameter und setzt die Seite zurück.

import { useRouter } from "next/navigation";
import Knopf from "../Knopf";

export default function Filter({ basis, params = {}, felder = [], zuruecksetzen = true, testid = "kk-filter" }) {
  const router = useRouter();
  const setze = (name, wert) => {
    const sp = new URLSearchParams(params);
    if (wert) sp.set(name, wert);
    else sp.delete(name);
    sp.delete("seite");
    const s = sp.toString();
    router.push(s ? `${basis}?${s}` : basis);
  };
  const aktiv = felder.some((f) => params[f.name]);
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid={testid}>
      {felder.map((f) => (
        <select key={f.name} className="bo-kk-auswahl" aria-label={f.label} value={params[f.name] || ""} onChange={(e) => setze(f.name, e.target.value)} data-testid={`${testid}-${f.name}`}>
          <option value="">{f.label}</option>
          {f.optionen.map((o) => (
            <option key={o.wert} value={o.wert}>
              {o.titel}
            </option>
          ))}
        </select>
      ))}
      {zuruecksetzen && aktiv && (
        <Knopf
          variant="ghost"
          size="s"
          icon="X"
          onClick={() => {
            const sp = new URLSearchParams(params);
            for (const f of felder) sp.delete(f.name);
            sp.delete("seite");
            const s = sp.toString();
            router.push(s ? `${basis}?${s}` : basis);
          }}
        >
          Zurücksetzen
        </Knopf>
      )}
    </div>
  );
}
