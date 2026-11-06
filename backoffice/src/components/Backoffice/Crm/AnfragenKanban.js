"use client";
// Kanban der Anfragen (§ 3.2): Spalten als eingelassene Flächen, Karten schweben (Radius 20). Je Karte genau
// der nächste Schritt als Knopf (Annehmen → Termin → Öffnen) – Ziehen kommt, sobald der Fundament-Kanban
// Anzeige-Titel je Spalte annimmt (er zeigt sonst den gespeicherten Wert „Qualifiziert“, Glossar § 2.1 verbietet
// das Wort; Anfrage an P0-5b im Übergabeprotokoll). Tastatur: Karten sind Links, Knöpfe fokussierbar.

import { useState } from "react";
import Link from "next/link";
import Knopf from "../Knopf";
import Avatar from "../Avatar";
import StatusBadge from "../StatusBadge";
import { TerminAnlegenDialog } from "./TerminDialoge";
import { useCrmAktion } from "./useCrmAktion";
import { annehmenAction } from "@/lib/backoffice/crm/actions";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { alterText } from "@/lib/backoffice/crm/vorgang";
import "./crm.css";

export default function AnfragenKanban({ spalten, berater = [], ich, jetzt: jetztIso }) {
  const jetzt = jetztIso ? new Date(jetztIso) : new Date();
  const { fuehre, laeuft } = useCrmAktion();
  const [termin, setTermin] = useState(null);
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto pb-2" style={{ contain: "inline-size" }} data-testid="crm-anfragen-kanban">
      <div className="flex gap-4" style={{ minWidth: spalten.length * 296 }}>
        {spalten.map((s) => (
          <section key={s.status} className="w-[280px] shrink-0 rounded-[24px] bg-bo-surface-2 p-3" aria-label={`${s.titel}, ${s.karten.length}`}>
            <header className="flex items-center justify-between px-2 pb-3 pt-1">
              <StatusBadge wert={s.status} text={s.titel} ton={s.ton} groesse="m" />
              <span className="text-[13px] text-bo-text-soft tabular-nums">{s.karten.length}</span>
            </header>
            {s.karten.length === 0 ? (
              <p className="rounded-[18px] px-3 py-6 text-center text-[13px] text-bo-text-faint" style={{ boxShadow: "inset 0 0 0 1px var(--color-bo-line)" }}>Keine Einträge</p>
            ) : (
              <ul className="grid gap-2.5 bo-staffel">
                {s.karten.map((k) => {
                  const alt = alterText(k.eingang, { status: k.status, jetzt });
                  return (
                    <li key={k.name} className="rounded-[20px] bg-bo-surface p-4 shadow-(--bo-sh-card) transition-transform duration-200 hover:-translate-y-0.5">
                      <Link href={`/crm/anfragen/${encodeURIComponent(k.name)}`} className="grid gap-1">
                        <span className="text-[12px] text-bo-text-soft tabular-nums">{k.name} · {alt.text}</span>
                        <span className="text-[15px] font-semibold leading-5">{k.person}</span>
                        <span className="text-[13px] text-bo-text-soft">{T.art[k.art] || k.art}{k.projektart ? ` · ${k.projektart}` : ""}</span>
                      </Link>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {k.zustaendigName ? <Avatar name={k.zustaendigName} groesse={24} /> : <span className="text-[12px] text-bo-text-faint">{T.anfragen.niemand}</span>}
                        {s.status === "Neu" && <Knopf size="s" variant="secondary" laedt={laeuft} onClick={() => fuehre(() => annehmenAction({ namen: [k.name] }), { text: T.toast.angenommen, fehlerText: "Annehmen", objekt: { doctype: "PH Anfrage", name: k.name } })}>{T.knopf.annehmen}</Knopf>}
                        {(s.status === "Qualifiziert" || k.abgeleitet?.entfallen) && <Knopf size="s" variant="secondary" onClick={() => setTermin(k)}>{T.knopf.terminKurz}</Knopf>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
      {termin && <TerminAnlegenDialog offen onSchliessen={() => setTermin(null)} anfrage={{ name: termin.name, titel: termin.person, email: termin.email, zugewiesen_an: termin.zugewiesen_an, thema: termin.projektart }} berater={berater} ich={ich} />}
    </div>
  );
}
