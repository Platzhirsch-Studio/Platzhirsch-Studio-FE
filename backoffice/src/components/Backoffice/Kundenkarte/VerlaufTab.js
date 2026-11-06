"use client";
// Tab „Verlauf“ (Konzept §3.5.3): Ereignisse + Einlösungen + Kommentare über die Kartenkette, Filter-Chips,
// Menschensprache, Einlösungen mit „Stornieren …“ nach Regel (Leitung oder eigene bis 23:59).
// Kommentar schreiben unten (Knopf, Strg/⌘+Enter) – kein Autosave.

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Leer from "../Leer";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { StornoDialog } from "./Dialoge";
import { kommentarAction } from "@/lib/backoffice/kundenkarte/actions";
import { stornoErlaubt } from "@/lib/backoffice/kundenkarte/regeln";
import { verlaufZeile } from "@/lib/backoffice/kundenkarte/verlauf";
import { cent, datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

const FILTER = ["alle", "einloesungen", "stufe", "einwilligung", "kommentare"];

function tagTitel(zeit) {
  const d = new Date(String(zeit).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function VerlaufTab({ karte, eintraege = [], user, leitung = false, darfSchreiben = false, betraege = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [filter, setFilter] = useState("alle");
  const [text, setText] = useState("");
  const [storno, setStorno] = useState(null);
  const [laeuft, starte] = useTransition();
  const feld = useRef(null);
  const liste = useMemo(() => (filter === "alle" ? eintraege : eintraege.filter((e) => e.typ === filter)), [eintraege, filter]);
  useKuerzel("akte@kundenkarte", { "kundenkarte.kommentar": () => feld.current?.focus() });

  const senden = () => {
    if (!text.trim()) return;
    starte(async () => {
      const r = await kommentarAction({ name: karte, text });
      if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
      setText("");
      zeige(T.verlauf.kommentarGespeichert, { art: "ok" });
      router.refresh();
    });
  };

  const tage = liste.map((e) => tagTitel(e.zeit));
  return (
    <div className="bo-kachel" data-testid="kk-verlauf">
      <div className="bo-kk-chips mb-4" role="group" aria-label="Filter">
        {FILTER.map((f) => (
          <button key={f} type="button" className="bo-kk-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {T.verlauf.filter[f]}
          </button>
        ))}
      </div>
      {liste.length === 0 ? (
        <Leer art={filter === "alle" ? "leer" : "gefiltert"} groesse="karte" titel={filter === "alle" ? T.verlauf.leer : T.verlauf.leerGefiltert} text="" aktion={filter !== "alle" ? <Knopf size="s" onClick={() => setFilter("alle")}>Filter zurücksetzen</Knopf> : null} />
      ) : (
        <ol className="flex flex-col">
          {liste.map((e, i) => {
            const z = verlaufZeile(e);
            const tag = tage[i];
            const neuerTag = i === 0 || tag !== tage[i - 1];
            const darfStorno = e.art === "Einloesung" && darfSchreiben && stornoErlaubt({ status: e.status, eingeloest_am: e.zeit, eingeloest_durch: e.wer }, { user, leitung }).ok;
            return (
              <li key={`${e.art}-${e.id}`}>
                {neuerTag && <p className="mb-2 mt-4 pl-12 text-[13px] font-medium text-bo-text-soft first:mt-0">{tag}</p>}
                <div className="flex gap-3 py-2">
                  <span className="bo-kk-zeile__icon" data-ton={z.ton} aria-hidden="true">
                    <Icon name={z.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] font-semibold ${e.status === "Storniert" ? "bo-kk-durch" : ""}`}>{z.titel}</p>
                    {z.unter && <p className="text-[13px] text-bo-text-soft">{z.unter}</p>}
                    {betraege && e.umsatz != null && <p className="text-[12px] tabular-nums text-bo-text-faint">Umsatz Zeitraum {cent(e.umsatz)}</p>}
                    {e.karte !== karte && <p className="text-[12px] text-bo-text-faint">an Vorgängerkarte {e.karte}</p>}
                  </div>
                  <time className="flex-none pt-0.5 text-[12px] tabular-nums text-bo-text-faint" title={datumZeit(e.zeit)}>
                    {String(e.zeit || "").slice(11, 16)}
                  </time>
                  {darfStorno && (
                    <Knopf size="s" variant="ghost" onClick={() => setStorno(e)}>
                      {T.einloesungen.stornieren}
                    </Knopf>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {darfSchreiben && (
        <div className="mt-5 flex flex-col gap-2 border-0">
          <label htmlFor="kk-kommentar" className="bo-kk-label">
            {T.verlauf.kommentar}
          </label>
          <textarea
            id="kk-kommentar"
            ref={feld}
            className="bo-kk-feld"
            rows={2}
            value={text}
            maxLength={2000}
            placeholder={T.verlauf.kommentarFeld}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                senden();
              }
            }}
            data-testid="kk-kommentar-feld"
          />
          <div className="flex justify-end">
            <Knopf size="s" variant="secondary" icon="MessageSquare" laedt={laeuft} disabled={!text.trim()} onClick={senden}>
              {T.verlauf.kommentar}
            </Knopf>
          </div>
        </div>
      )}
      {storno && <StornoDialog einloesung={storno.id} titel={`${storno.titel} · ${datumZeit(storno.zeit)}`} onSchliessen={() => setStorno(null)} onFertig={() => (setStorno(null), zeige(T.einloesungen.storniert, { art: "ok" }))} />}
    </div>
  );
}
