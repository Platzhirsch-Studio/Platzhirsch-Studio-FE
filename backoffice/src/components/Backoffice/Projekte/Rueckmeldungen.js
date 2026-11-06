"use client";
// Rückmeldungen-Inbox (10-konzept-projekte.md § 5.7): Liste links (älteste offene zuerst, „seit n Tagen“ ab
// Erinnerungsgrenze in Eiche), Vorschau rechts mit Antwortfeld (Strg/⌘+Enter), „Erledigt“ (Umschalt+E) als
// verzögerter Commit; Zeile verschwindet (120 ms), Fokus springt auf die nächste. J/K blättert.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Leer from "../Leer";
import Avatar from "../Avatar";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { antwortenAction, rueckmeldungErledigtAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";
import "./projekte.css";

const R = TEXTE.rueckmeldungen;
const ICON = { pin: "MapPin", sprache: "Play", freigabe: "CheckCheck", nachricht: "MessageSquare", nachtrag: "Layers" };

export default function Rueckmeldungen({ eintraege = [], projekte = {}, start: startId }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [art, setArt] = useState("alle");
  const [weg, setWeg] = useState([]);
  const [aktiv, setAktiv] = useState(startId || null);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const listeRef = useRef(null);
  const sicht = useMemo(() => eintraege.filter((e) => !weg.includes(e.id) && (art === "alle" || e.art === art)), [eintraege, weg, art]);
  const zahlen = useMemo(() => Object.fromEntries(["alle", "pin", "sprache", "freigabe", "nachricht", "nachtrag"].map((a) => [a, eintraege.filter((e) => !weg.includes(e.id) && (a === "alle" || e.art === a)).length])), [eintraege, weg]);
  const e = sicht.find((x) => x.id === aktiv) || sicht[0] || null;
  const idx = e ? sicht.indexOf(e) : -1;
  const p = e ? projekte[e.projekt] || {} : {};

  useEffect(() => {
    const t = (ev) => {
      if (/input|textarea|select/i.test(ev.target?.tagName || "")) return;
      if (ev.key === "j" || ev.key === "k") {
        const n = sicht[Math.max(0, Math.min(sicht.length - 1, idx + (ev.key === "j" ? 1 : -1)))];
        if (n) {
          setAktiv(n.id);
          listeRef.current?.querySelector(`[data-id="${CSS.escape(n.id)}"]`)?.focus();
        }
      }
      if (ev.key === "E" && ev.shiftKey && e) erledigt(e);
    };
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  });

  function erledigt(x) {
    start(async () => {
      const r = await rueckmeldungErledigtAction({ doctype: x.doctype === "PH Projekt Nachricht" ? "PH Projekt Nachricht" : "PH Rendering Feedback", name: x.name });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      const naechste = sicht[idx + 1] || sicht[idx - 1];
      setWeg((w) => [...w, x.id]);
      setAktiv(naechste?.id || null);
      starte(R.erledigtToast, { token: r.token, ms: r.ms, objekt: r.objekt, gruppe: "projekte.erledigt", sammel: R.erledigtSammel, onVerworfen: () => setWeg((w) => w.filter((y) => y !== x.id)) });
    });
  }
  const antworten = () =>
    start(async () => {
      if (!e || !text.trim()) return;
      const r = await antwortenAction({ doctype: e.doctype === "PH Projekt Nachricht" ? "PH Projekt Nachricht" : "PH Rendering Feedback", name: e.name, text });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      zeige(R.antwortGesendet, { art: "ok" });
      setText("");
      router.refresh();
    });

  const kannErledigen = e && (e.doctype === "PH Rendering Feedback" || e.doctype === "PH Projekt Nachricht");
  const kannAntworten = kannErledigen;
  return (
    <div className="flex flex-col gap-5">
      <Segment label="Art" wert={art} onWechsel={setArt} groesse="s" optionen={Object.entries(R.arten).map(([w, t]) => ({ wert: w, titel: t, anzahl: zahlen[w] }))} testid="rueck-art" />
      {!eintraege.length || (!sicht.length && art === "alle") ? (
        <Leer art={eintraege.length ? "erledigt" : "leer"} titel={eintraege.length ? R.erledigtAlles : R.leer} />
      ) : (
        <div className="bo-prj-inbox">
          <Kachel titel={R.titel} unter={`${sicht.length} offen · älteste zuerst`} testid="inbox-liste">
            {sicht.length ? (
              <ul ref={listeRef} role="listbox" aria-label={R.titel} className="-mx-3 flex flex-col">
                {sicht.map((x) => (
                  <li key={x.id} role="option" aria-selected={x.id === e?.id} tabIndex={0} data-id={x.id} className="bo-prj-inbox__zeile" onClick={() => setAktiv(x.id)} onKeyDown={(ev) => ev.key === "Enter" && setAktiv(x.id)} data-testid="inbox-zeile">
                    <span className="bo-prj-liste__ico" data-ton={x.art === "freigabe" ? "salbei" : x.art === "nachtrag" ? "eiche" : "cognac"} aria-hidden="true">
                      <Icon name={ICON[x.art] || "MessageSquare"} className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="bo-prj-punkt" aria-hidden="true" />
                        <span className="bo-prj-titel truncate text-[15px]">{x.autor || projekte[x.projekt]?.kunde || "Kunde"} · {projekte[x.projekt]?.titel || x.projekt}</span>
                      </span>
                      <span className="bo-prj-unter block truncate">{R.quelle[x.quelle] || x.quelle} · „{x.text}“</span>
                    </span>
                    <span className={`text-right text-[13px] tabular-nums ${x.ueberfaellig ? "font-medium text-bo-warning-text" : "text-bo-text-soft"}`}>{R.seit(x.alterTage)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Leer art="gefiltert" groesse="karte" titel={R.leerFilter} />
            )}
          </Kachel>
          <div className="bo-prj-inbox__vorschau">
            <Kachel titel={e ? `${R.quelle[e.quelle] || ""} · ${p.titel || e.projekt}` : "Vorschau"} unter={e ? `${p.kunde || ""} · ${R.seit(e.alterTage)}` : undefined} testid="inbox-vorschau">
              {e ? (
                <div className="flex flex-col gap-4">
                  {e.bild && (
                    // eslint-disable-next-line @next/next/no-img-element -- Ausschnitt um den Pin
                    <img src={e.bild} alt="" className="aspect-[16/10] w-full rounded-[20px] object-cover" />
                  )}
                  <div className="flex gap-3">
                    <Avatar name={e.autor || p.kunde || "Kunde"} groesse={36} />
                    <p className="bo-prj-eintrag__zitat flex-1">„{e.text}“</p>
                  </div>
                  {kannAntworten && (
                    <div className="bo-prj-composer">
                      <label htmlFor="inbox-antwort" className="sr-only">Antwort</label>
                      <textarea id="inbox-antwort" value={text} onChange={(ev) => setText(ev.target.value)} placeholder={TEXTE.rendering.antwortPlatzhalter} onKeyDown={(ev) => { if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") { ev.preventDefault(); antworten(); } }} />
                      <div className="bo-prj-composer__fuss">
                        <span className="text-[12px] text-bo-text-soft">Strg + Enter</span>
                        <Knopf size="s" laedt={pending} disabled={!text.trim()} onClick={antworten}>{TEXTE.rendering.senden}</Knopf>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {kannErledigen && <Knopf variant="primary" icon="Check" kuerzel="⇧E" onClick={() => erledigt(e)} data-testid="inbox-erledigt">{TEXTE.rendering.erledigt}</Knopf>}
                    {e.doctype === "PH Nachtrag" && <Knopf variant="primary" href={`/projekte/${encodeURIComponent(e.projekt)}/nachtraege/${encodeURIComponent(e.name)}`}>{R.nachtragOeffnen}</Knopf>}
                    {e.doctype === "PH Planung" && <Knopf variant="primary" href={`/projekte/${encodeURIComponent(e.projekt)}/planung/${encodeURIComponent(e.name)}`}>{TEXTE.planung.freigabeUebernehmen}</Knopf>}
                    {e.rendering && <Knopf href={`/projekte/${encodeURIComponent(e.projekt)}/renderings/${encodeURIComponent(e.rendering)}`}>{R.insRendering}</Knopf>}
                    <Knopf variant="ghost" href={`/projekte/${encodeURIComponent(e.projekt)}`}>{R.zumProjekt}</Knopf>
                  </div>
                </div>
              ) : (
                <p className="text-[15px] text-bo-text-soft">{R.vorschauLeer}</p>
              )}
            </Kachel>
          </div>
        </div>
      )}
    </div>
  );
}
