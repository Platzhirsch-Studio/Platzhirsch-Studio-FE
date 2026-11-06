"use client";
// Rechte Spalte „Aktivität“ (10-konzept-projekte.md § 4.5): ein Strom, gruppiert nach Tag, Filter-Chips
// Alles · Kunde · Team · Belege · System; Composer mit Modus „Intern“ (Standard) / „An Kunde“ (Cognac-Kontur +
// Empfängerzeile). Moduswechsel nur per Klick, nach jedem Senden zurück auf „Intern“ (QA 13). „An Kunde“ =
// verzögerter Commit (portal_status_senden); ohne E-Mail kein Aufruf (§ 3.5 Punkt 5).

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Segment from "../Segment";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { anKundeAction, notizAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";
import "./projekte.css";

const T = TEXTE.aktivitaet;
const FILTER = ["alles", "kunde", "team", "belege", "system"];

function tagGruppe(zeit) {
  const d = String(zeit || "").slice(0, 10);
  const heute = new Date().toISOString().slice(0, 10);
  const gestern = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === heute) return "Heute";
  if (d === gestern) return "Gestern";
  const dt = new Date(`${d}T12:00:00`);
  return new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long" }).format(dt);
}

export default function Aktivitaet({ projekt, kunde, email, eintraege = [], max = 12 }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [filter, setFilter] = useState("alles");
  const [modus, setModus] = useState("intern");
  const [text, setText] = useState("");
  const [alle, setAlle] = useState(false);
  const [pending, start] = useTransition();
  const sicht = useMemo(() => eintraege.filter((e) => filter === "alles" || e.art === filter), [eintraege, filter]);
  const gezeigt = alle ? sicht : sicht.slice(0, max);
  const gruppen = [];
  for (const e of gezeigt) {
    const g = tagGruppe(e.zeit);
    const letzte = gruppen[gruppen.length - 1];
    if (letzte?.titel === g) letzte.e.push(e);
    else gruppen.push({ titel: g, e: [e] });
  }
  const senden = () =>
    start(async () => {
      const inhalt = text.trim();
      if (!inhalt) return;
      if (modus === "intern") {
        const r = await notizAction({ projekt, text: inhalt });
        if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
        zeige(T.gesendet, { art: "ok" });
      } else {
        const r = await anKundeAction({ projekt, text: inhalt, email });
        if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: r?.code === "kein_email" ? "warnung" : "fehler" });
        starte(T.gesendetKunde(kunde || "Kunde"), { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: T.sendenKunde, onErfolg: () => router.refresh() });
      }
      setText("");
      setModus("intern");
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-5" data-testid="aktivitaet">
      <Segment label="Filter" groesse="s" wert={filter} onWechsel={setFilter} optionen={FILTER.map((f) => ({ wert: f, titel: T.filter[f] }))} />
      {gruppen.length === 0 ? (
        <p className="text-[15px] text-bo-text-soft">{T.leer}</p>
      ) : (
        <div className="bo-prj-strom">
          {gruppen.map((g) => (
            <section key={g.titel} className="flex flex-col gap-4">
              <h3 className="bo-prj-strom__tag">{g.titel}</h3>
              {g.e.map((e) => (
                <article key={e.id} className="bo-prj-eintrag" data-art={e.art} data-intern={e.intern ? "" : undefined}>
                  <span className="bo-prj-eintrag__ico" aria-hidden="true">
                    <Icon name={e.icon || "Info"} className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="bo-prj-eintrag__kopf">
                      <span className="min-w-0">
                        {e.href ? <Link href={e.href} className="hover:underline">{e.titel}</Link> : e.titel}
                        {e.intern && (
                          <span className="ml-2 inline-flex items-center gap-1 align-middle text-[12px] font-medium text-bo-text-soft">
                            <Icon name="Lock" className="size-3" />
                            {T.intern}
                          </span>
                        )}
                      </span>
                      <time className="bo-prj-eintrag__zeit" dateTime={String(e.zeit).replace(" ", "T")}>{String(e.zeit).slice(11, 16)}</time>
                    </p>
                    {e.text && (e.art === "kunde" ? <p className="bo-prj-eintrag__zitat">„{e.text}“</p> : <p className="bo-prj-eintrag__text">{e.text}</p>)}
                    {e.autor && !e.intern && <p className="mt-1 text-[12px] text-bo-text-soft">{e.autor} · {T.quelle[e.quelle] || ""}</p>}
                  </div>
                </article>
              ))}
            </section>
          ))}
          {sicht.length > max && !alle && (
            <Knopf variant="ghost" size="s" onClick={() => setAlle(true)}>
              {`Alle ${sicht.length} Einträge`}
            </Knopf>
          )}
        </div>
      )}
      <div className="bo-prj-composer" data-modus={modus} data-testid="composer">
        <div className="flex items-center justify-between gap-2">
          <Segment label="Empfänger" groesse="s" wert={modus} onWechsel={setModus} optionen={[{ wert: "intern", titel: T.intern }, { wert: "kunde", titel: T.anKunde }]} testid="composer-modus" />
          {modus === "kunde" && <span className="truncate text-[12px] font-medium text-bo-cognac-text">{email ? T.hinweisAnKunde(kunde || "Kunde") : TEXTE.mappe.keinPortal}</span>}
        </div>
        <label className="sr-only" htmlFor={`composer-${projekt}`}>{modus === "intern" ? T.platzhalterIntern : T.platzhalterKunde}</label>
        <textarea id={`composer-${projekt}`} value={text} onChange={(e) => setText(e.target.value)} placeholder={modus === "intern" ? T.platzhalterIntern : T.platzhalterKunde}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); senden(); } }} data-testid="composer-text" />
        <div className="bo-prj-composer__fuss">
          <span className="text-[12px] text-bo-text-soft">Strg + Enter</span>
          <Knopf size="s" variant="secondary" icon="ArrowRight" laedt={pending} disabled={!text.trim() || (modus === "kunde" && !email)} onClick={senden} data-testid="composer-senden">
            {modus === "intern" ? T.senden : T.sendenKunde}
          </Knopf>
        </div>
      </div>
    </div>
  );
}
