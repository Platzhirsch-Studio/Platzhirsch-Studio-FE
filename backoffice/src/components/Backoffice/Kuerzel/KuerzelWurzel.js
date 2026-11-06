"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { anzeigeTasten } from "@/lib/backoffice/kuerzel/index";
import { KUERZEL_DIALOG_EREIGNIS, brichFolgeAb, useFolge, useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import KuerzelDialog from "./KuerzelDialog";

// Globale Kürzel der Backoffice-Shell (G-02): Strg+/ öffnet den Kürzel-Dialog, „G“ + Buchstabe springt zu einem
// Bereich (K-10). Nach „G“ erscheint unten links die Zielzeile (12 px, Tinte-Karte Radius 20 – Lounge); Esc oder 1,5 s brechen ab.
// Die übrigen globalen Tasten (Strg+K, Strg+B …) behalten ihre bisherigen Handler; sie stehen im Register und
// im Dialog. Bekommt die Gehe-zu-Ziele der Sitzung serialisiert (gZiele(session)).

/**
 * @param {{ziele:Array<{id:string, taste:string, titel:string, href:string}>}} props
 */
export default function KuerzelWurzel({ ziele = [] }) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const folge = useFolge();

  const map = { "global.kuerzel": () => setOffen((o) => !o) };
  for (const z of ziele) map[z.id] = () => router.push(z.href);
  useKuerzel("global", map);

  useEffect(() => {
    const auf = () => setOffen(true);
    window.addEventListener(KUERZEL_DIALOG_EREIGNIS, auf);
    return () => window.removeEventListener(KUERZEL_DIALOG_EREIGNIS, auf);
  }, []);

  useEffect(() => {
    if (!folge) return undefined;
    const t = window.setTimeout(brichFolgeAb, Math.max(0, folge.bis - Date.now()));
    return () => window.clearTimeout(t);
  }, [folge]);

  const zielIds = new Set(ziele.map((z) => z.id));
  const sichtbar = folge?.praefix === "g" ? ziele.filter((z) => zielIds.has(z.id)) : [];

  return (
    <>
      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-3 left-3 z-[70] max-w-[min(92vw,40rem)]">
        {folge && sichtbar.length > 0 && (
          <div className="bo-pop flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-bo-karte bg-bo-surface-inverse px-4 py-2.5 text-xs leading-4 text-bo-ink-inverse shadow-bo-ink" data-testid="gehe-zu-zeile">
            <span className="font-semibold">Gehe zu</span>
            {sichtbar.map((z) => (
              <span key={z.id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-bo-xs bg-bo-ink-inverse/15 px-1 font-sans text-[11px] font-semibold leading-none">{anzeigeTasten(z.taste).at(-1)}</kbd>
                {z.titel}
              </span>
            ))}
            <span className="text-bo-ink-inverse-soft">Esc bricht ab</span>
          </div>
        )}
      </div>
      <KuerzelDialog offen={offen} onSchliessen={() => setOffen(false)} ziele={ziele} />
    </>
  );
}
