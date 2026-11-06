"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import cx from "../cx";
import { Icon } from "../icons";
import { anzeigeTasten, grundKontext, istEinzeltaste, katalog, kontextTitel } from "@/lib/backoffice/kuerzel/index";
import { useEinzeltasten, useMac } from "@/lib/backoffice/kuerzel/useKuerzel";

// Kürzel-Dialog (G-02, Strg+/): durchsuchbar, gruppiert nach Kontext, zeigt nur, was die Sitzung erreichen kann
// (Gehe-zu-Ziele kommen gefiltert als `ziele`). Schalter „Einzeltasten-Kürzel“ (WCAG 2.1.4). Kiosk-Tasten
// stehen in der Kiosk-Hilfe (F1), nicht hier. Dialog md 560 px (Q-G8), natives <dialog> mit Fokusfalle.
// Gestaltung Lounge (lounge.md §6): Material-Fläche Radius 28 ohne Rahmen, Pillen-Suche, iOS-Schalter in einer
// eingelassenen Karte (28 − 8 = 20), Abschnittstitel in Satzschreibung, Zeilen ohne Trennlinien (Hover = Fläche),
// Tastenkappen als gefüllte Flächen ohne Kontur.

const REIHE = ["global", "liste", "karten", "akte", "arbeitsplatz", "zentrale", "palette", "glocke"];

function Kappen({ taste, mac }) {
  const teile = anzeigeTasten(taste, mac);
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {teile.map((t, i) =>
        t === "dann" ? (
          <span key={i} className="text-xs text-bo-text-faint">
            dann
          </span>
        ) : (
          <kbd key={i} className="inline-flex h-6 min-w-6 items-center justify-center rounded-bo-xs bg-bo-fill-2 px-1.5 font-sans text-xs font-medium leading-none tabular-nums text-bo-text-soft">
            {t}
          </kbd>
        )
      )}
    </span>
  );
}

/** Einträge eines Kontexts zu Zeilen; Einträge mit `gruppe` (1–9, Reiter, Gehe zu …) werden zu einer Zeile. */
function zeilen(eintraege) {
  const out = [];
  const gruppen = new Map();
  for (const e of eintraege) {
    if (e.gruppe && e.gruppe !== "Gehe zu") {
      if (!gruppen.has(e.gruppe)) {
        const z = { id: e.gruppe, titel: e.gruppe, gruppe: true, tasten: [], einzel: istEinzeltaste(e.taste), suche: e.gruppe };
        gruppen.set(e.gruppe, z);
        out.push(z);
      }
      gruppen.get(e.gruppe).tasten.push(e.taste);
      continue;
    }
    // Gleiche Wirkung mit zwei Tasten (Strg+Z und Z) → eine Zeile „… oder …“.
    const gleich = out.find((z) => !z.gruppe && z.titel === e.titel);
    if (gleich) {
      gleich.tasten.push(e.taste);
      gleich.einzel = gleich.einzel && istEinzeltaste(e.taste);
      continue;
    }
    out.push({ id: e.id, titel: e.titel, tasten: [e.taste], einzel: istEinzeltaste(e.taste), suche: e.titel });
  }
  // Gruppen zeigen erste und letzte Taste („1“ … „9“).
  return out.map((z) => (z.tasten.length > 2 ? { ...z, tasten: [z.tasten[0], z.tasten.at(-1)], spanne: true } : z));
}

/**
 * @param {{offen:boolean, onSchliessen:()=>void, ziele:Array<{id:string}>}} props
 */
export default function KuerzelDialog({ offen, onSchliessen, ziele = [] }) {
  const ref = useRef(null);
  const suchfeld = useRef(null);
  const titelId = useId();
  const [q, setQ] = useState("");
  const [einzeltasten, setzeEinzeltasten] = useEinzeltasten();
  const mac = useMac();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) {
      d.showModal();
      suchfeld.current?.focus(); // showModal setzt den Fokus sonst auf „Schließen“
    }
    if (!offen && d.open) d.close();
  }, [offen]);

  const erlaubteZiele = useMemo(() => new Set(ziele.map((z) => z.id)), [ziele]);

  const abschnitte = useMemo(() => {
    const alle = katalog().filter((k) => !grundKontext(k.kontext).startsWith("kiosk"));
    const sichtbar = alle.filter((k) => k.gruppe !== "Gehe zu" || erlaubteZiele.has(k.id));
    const kontexte = [...new Set(sichtbar.map((k) => k.kontext))].sort((a, b) => {
      const ra = REIHE.indexOf(grundKontext(a));
      const rb = REIHE.indexOf(grundKontext(b));
      return (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb) || a.localeCompare(b);
    });
    const suche = q.trim().toLowerCase();
    return kontexte
      .map((k) => {
        const z = zeilen(sichtbar.filter((e) => e.kontext === k));
        const gefiltert = suche ? z.filter((e) => e.suche.toLowerCase().includes(suche) || e.tasten.some((t) => t.includes(suche))) : z;
        return { kontext: k, titel: kontextTitel(k), zeilen: gefiltert };
      })
      .filter((a) => a.zeilen.length);
  }, [q, erlaubteZiele]);

  return (
    <dialog
      ref={ref}
      onClose={onSchliessen}
      onCancel={(e) => {
        e.preventDefault();
        onSchliessen();
      }}
      aria-labelledby={titelId}
      data-testid="kuerzel-dialog"
      className="bo-dialog bo-material-stark mx-auto mb-auto mt-[10vh] max-h-[min(80vh,46rem)] w-[min(calc(100vw-2rem),35rem)] flex-col rounded-bo-kachel border-0 p-0 text-bo-text open:flex"
    >
      <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
        <div className="min-w-0">
          <h2 id={titelId} className="bo-titel-kachel">
            Tastenkürzel
          </h2>
          <p className="bo-unterzeile mt-0.5">Alles, was hier steht, geht auch mit Maus oder Finger.</p>
        </div>
        <button type="button" onClick={onSchliessen} aria-label="Schließen" className="bo-rund bo-rund--s shrink-0">
          <Icon name="X" className="size-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3 px-6 pb-4">
        <label className="bo-suche w-full">
          <span className="sr-only">Kürzel suchen</span>
          <Icon name="Search" className="size-4 shrink-0 text-bo-text-faint" />
          <input ref={suchfeld} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen, z. B. „Rückgängig“" className="min-w-0 !outline-none" />
        </label>
        <div className="flex items-center justify-between gap-4 rounded-bo-karte bg-bo-fill px-4 py-3">
          <span className="min-w-0">
            <span id={`${titelId}-et`} className="block text-[15px] font-medium leading-[22px]">
              Einzeltasten-Kürzel
            </span>
            <span className="block text-[13px] leading-[18px] text-bo-text-soft">{einzeltasten ? "Buchstaben, Ziffern und Zeichen wirken außerhalb von Eingabefeldern." : "Aus: Es wirken nur Kürzel mit Strg, F-Tasten und Esc."}</span>
          </span>
          <button type="button" role="switch" aria-checked={einzeltasten} aria-labelledby={`${titelId}-et`} onClick={() => setzeEinzeltasten(!einzeltasten)} className="bo-schalter inline-flex shrink-0 rounded-full" data-testid="einzeltasten-schalter">
            <span className="bo-schalter__spur" aria-hidden="true">
              <span className="bo-schalter__daumen" />
            </span>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        {abschnitte.length === 0 && <p className="px-3 py-10 text-center text-[15px] text-bo-text-soft">Kein Kürzel passt zu „{q}“.</p>}
        {abschnitte.map((a) => (
          <section key={a.kontext} className="mb-3 last:mb-1" aria-label={a.titel}>
            <h3 className="px-3 pb-1 pt-2 text-[13px] font-semibold leading-[18px] text-bo-text-soft">{a.titel}</h3>
            <ul>
              {a.zeilen.map((z) => (
                <li key={z.id} className={cx("flex min-h-10 items-center justify-between gap-3 rounded-bo-zeile px-3 py-1.5 text-[15px] leading-[22px] transition-colors duration-[120ms] hover:bg-bo-fill", z.einzel && !einzeltasten && "text-bo-text-faint")}>
                  <span className="min-w-0">
                    {z.titel}
                    {z.einzel && !einzeltasten && <span className="ml-2 text-[13px]">aus</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {z.tasten.map((t, i) => (
                      <span key={t} className="inline-flex items-center gap-1">
                        {i > 0 && <span className="text-xs text-bo-text-faint">{z.spanne ? "bis" : "oder"}</span>}
                        <Kappen taste={t} mac={mac} />
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="px-6 pb-5 pt-2 text-xs leading-4 text-bo-text-faint">
        Einzeltasten wirken nie in Eingabefeldern. Kassa und Packtisch haben eigene Tasten (Hilfe mit F1).
      </p>
    </dialog>
  );
}
