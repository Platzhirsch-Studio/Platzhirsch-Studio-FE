"use client";
// Neutraler Inhalt eines Kiosk-Arbeitsplatzes, solange der Fachbereich ihn einrichtet (QA-Befund 12: keine
// internen Texte). Lounge-Kiosk: großes Scan-/Suchfeld als Pille (Scanner und Enter suchen in der ersten
// Liste), darunter Listen als schwebende Kacheln mit rundem Symbol und Pfeil. Fachbereichs-Agenten ersetzen
// den Inhalt (src/app/(kiosk)/<arbeitsplatz>/page.js) und behalten KioskShell.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import KioskShell from "./KioskShell";
import ScanFeld from "../Eingabe/ScanFeld";
import { Icon } from "../icons";
import { TEXTE } from "./texte";

const T = TEXTE.platzhalter;

/**
 * @param {{titel:string, geraet?:object|null, benutzer:{name:string}, icon?:string, links?:Array<{titel:string, href:string, text?:string, icon?:string}>}} props
 */
export default function KioskPlatzhalter({ titel, geraet, benutzer, icon = "Monitor", links = [] }) {
  const router = useRouter();
  const [zuletzt, setZuletzt] = useState(null);
  const suche = (code) => {
    const ziel = links[0]?.href;
    setZuletzt({ text: code, ergebnis: "erkannt" });
    if (ziel && code) router.push(`${ziel}?q=${encodeURIComponent(code)}`);
  };
  return (
    <KioskShell
      titel={titel}
      geraet={geraet}
      benutzer={benutzer}
      onScan={(code) => suche(code)}
      kuerzel={{ F2: () => document.getElementById("kiosk-suche")?.focus() }}
      hilfe={[{ taste: "F2", text: T.suche }]}
    >
      <div className="mx-auto grid w-full max-w-3xl gap-6 py-4 sm:py-10">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="hidden size-14 shrink-0 place-items-center rounded-full bg-bo-surface text-bo-text shadow-(--bo-sh-btn) sm:grid">
            <Icon name={icon} className="size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="bo-titel-gross">{titel}</h1>
            <p className="mt-1 max-w-[60ch] text-[15px] text-bo-text-soft">{T.text}</p>
          </div>
        </div>

        <ScanFeld id="kiosk-suche" label={`${T.suche} (F2)`} platzhalter={T.sucheHinweis} zuletzt={zuletzt} onScan={(code) => suche(code)} />

        {links.length > 0 && (
          <section aria-labelledby="kiosk-listen" className="grid gap-3">
            <h2 id="kiosk-listen" className="bo-titel-kachel">
              {T.listen}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2" data-testid="kiosk-links">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="bo-kachel bo-kachel--lift group min-h-24 p-5" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-bo-surface-2 text-bo-text">
                      <Icon name={l.icon || "ScrollText"} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-semibold tracking-[-0.012em]">{l.titel}</span>
                      {l.text && <span className="mt-0.5 block truncate text-[13px] text-bo-text-soft">{l.text}</span>}
                    </span>
                    <span aria-hidden="true" className="bo-pfeil size-11">
                      <ArrowUpRight className="size-5" strokeWidth={1.75} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </KioskShell>
  );
}
