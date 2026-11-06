"use client";
// Rendering-Bildansicht (10-konzept-projekte.md § 5.6): Bildfläche mit Pins (Kreis 28 px, Trefferfläche 44 px,
// Ziffer, offen = Cognac-Ring), Werkzeugleiste Ansehen | Pin · Zoom; im Pin-Modus Klick oder Pfeiltasten (1 %, Umschalt
// 5 %) + Enter setzt einen Studio-Pin. Rechts der Faden (älteste oben), Kunde links / Studio eingerückt, Votes als
// Zähler, Freigabe-Banner, ein Antwortfeld (Strg/⌘+Enter), „Erledigt“ als verzögerter Commit (§ 3.4).

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Kachel from "../Kachel";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { antwortenAction, pinSetzenAction, renderingStatusAction, rueckmeldungErledigtAction } from "@/lib/backoffice/projekte/actions";
import { TEXTE } from "@/lib/backoffice/projekte/texte";
import "./projekte.css";

const R = TEXTE.rendering;

export default function RenderingAnsicht({ rendering, faden = [], kunde, darfSchreiben = true }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [modus, setModus] = useState("ansehen");
  const [zoom, setZoom] = useState(1);
  const [kreuz, setKreuz] = useState({ x: 50, y: 50 });
  const [aktiv, setAktiv] = useState(null);
  const [text, setText] = useState("");
  const [weg, setWeg] = useState([]);
  const [pending, start] = useTransition();
  const flaeche = useRef(null);
  const pins = useMemo(() => faden.filter((f) => f.art === "annotation" && f.punkt_x !== null && f.punkt_x !== undefined && !f.antwort_auf), [faden]);
  const nr = (f) => pins.findIndex((p) => p.name === f.name) + 1;
  const offen = faden.filter((f) => f.von === "kunde" && f.status === "Offen" && f.art !== "vote" && !weg.includes(f.name));
  const ziel = faden.find((f) => f.name === aktiv) || offen[0] || null;

  const setzen = (x, y) =>
    start(async () => {
      const r = await pinSetzenAction({ rendering: rendering.name, x, y, text: text.trim() || "Pin" });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      zeige(R.pinGesetzt, { art: "ok" });
      setText("");
      router.refresh();
    });
  const klick = (e) => {
    if (modus !== "pin" || !darfSchreiben) return;
    const r = flaeche.current.getBoundingClientRect();
    setzen(Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, Math.round(((e.clientY - r.top) / r.height) * 1000) / 10);
  };
  const taste = (e) => {
    if (modus !== "pin") return;
    const s = e.shiftKey ? 5 : 1;
    const d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
    if (d) {
      e.preventDefault();
      setKreuz((k) => ({ x: Math.min(100, Math.max(0, k.x + d[0])), y: Math.min(100, Math.max(0, k.y + d[1])) }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      setzen(kreuz.x, kreuz.y);
    }
  };
  const antworten = () =>
    start(async () => {
      if (!text.trim()) return;
      const r = await antwortenAction({ doctype: ziel ? "PH Rendering Feedback" : "PH Rendering", name: ziel ? ziel.name : rendering.name, text });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      zeige(TEXTE.rueckmeldungen.antwortGesendet, { art: "ok" });
      setText("");
      router.refresh();
    });
  const erledigt = (f) =>
    start(async () => {
      const r = await rueckmeldungErledigtAction({ doctype: "PH Rendering Feedback", name: f.name });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      setWeg((w) => [...w, f.name]);
      starte(TEXTE.rueckmeldungen.erledigtToast, { token: r.token, ms: r.ms, objekt: r.objekt, gruppe: "projekte.erledigt", sammel: TEXTE.rueckmeldungen.erledigtSammel, onVerworfen: () => setWeg((w) => w.filter((x) => x !== f.name)) });
    });
  const status = (aktion) =>
    start(async () => {
      const r = await renderingStatusAction({ name: rendering.name, aktion });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      starte(`${aktion} · ${rendering.titel}`, { token: r.token, ms: r.ms, objekt: r.objekt, onErfolg: () => router.refresh() });
    });
  const freigabe = faden.find((f) => f.art === "freigabe" && f.von === "kunde");

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]" data-testid="rendering-ansicht">
      <div className="flex min-w-0 flex-col gap-4">
        {freigabe && rendering.status !== "Freigegeben" && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-bo-salbei-soft px-5 py-4 text-bo-salbei-text">
            <p className="text-[15px] font-medium">{TEXTE.planung.freigabeBanner(kunde, "")}</p>
            <Knopf size="s" variant="secondary" laedt={pending} onClick={() => status("Freigeben")}>{TEXTE.planung.freigabeUebernehmen}</Knopf>
          </div>
        )}
        <div className="bo-prj-buehne" data-modus={modus}>
          {rendering.bild ? (
            <div className="overflow-hidden">
              <div ref={flaeche} className="bo-prj-buehne__bild" style={{ transform: `scale(${zoom})` }} onClick={klick} onKeyDown={taste} tabIndex={modus === "pin" ? 0 : -1} role={modus === "pin" ? "application" : undefined} aria-label={modus === "pin" ? "Pin setzen: Pfeiltasten bewegen, Enter setzt" : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Rendering (privat, gestreamt) */}
                <img src={rendering.bild} alt={rendering.titel} draggable={false} />
                {pins.map((p) => (
                  <button key={p.name} type="button" className="bo-prj-pin" style={{ left: `${p.punkt_x}%`, top: `${p.punkt_y}%` }} data-offen={p.status === "Offen" && !weg.includes(p.name) ? "" : undefined} data-studio={p.von === "studio" ? "" : undefined} data-aktiv={aktiv === p.name ? "" : undefined}
                    aria-label={R.pinLabel(nr(p), p.von === "kunde" ? p.autor || kunde : R.studio, p.text, p.status === "Offen")} onClick={(e) => (e.stopPropagation(), setAktiv(p.name))}>
                    <span>{p.status === "Offen" ? nr(p) : "✓"}</span>
                  </button>
                ))}
                {modus === "pin" && <span className="bo-prj-kreuz" style={{ left: `${kreuz.x}%`, top: `${kreuz.y}%` }} aria-hidden="true" />}
              </div>
            </div>
          ) : (
            <div className="grid min-h-[320px] place-items-center text-bo-ink-inverse">{R.keinBild}</div>
          )}
          <div className="bo-prj-werkzeug bo-material-stark">
            <Segment label="Modus" groesse="s" wert={modus} onWechsel={setModus} optionen={[{ wert: "ansehen", titel: R.ansehen, icon: "Eye" }, { wert: "pin", titel: R.pin, icon: "MapPin", deaktiviert: !darfSchreiben }]} testid="pin-modus" />
            <Knopf size="s" variant="ghost" icon="Minus" label="Verkleinern" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} />
            <span className="w-12 text-center text-[13px] font-medium tabular-nums" aria-live="polite">{Math.round(zoom * 100)} %</span>
            <Knopf size="s" variant="ghost" icon="Plus" label="Vergrößern" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} />
          </div>
        </div>
      </div>

      <Kachel titel={R.faden} unter={`${R.fadenUnter} · ${TEXTE.rendering.votes(rendering.votes_up || 0, rendering.votes_down || 0)}`} testid="faden">
        {faden.filter((f) => f.art !== "vote").length === 0 ? (
          <p className="text-[15px] text-bo-text-soft">{rendering.status === "Entwurf" ? R.entwurfLeer : R.leer("")}</p>
        ) : (
          <ol className="bo-prj-faden">
            {faden.filter((f) => f.art !== "vote").map((f) => (
              <li key={f.name} className="bo-prj-faden__e" data-studio={f.von === "studio" ? "" : undefined} data-aktiv={ziel?.name === f.name ? "" : undefined}>
                <span className="bo-prj-faden__n" aria-hidden="true">{f.art === "annotation" && !f.antwort_auf ? nr(f) || "·" : f.art === "sprachnachricht" ? <Icon name="Play" className="size-3" /> : f.von === "studio" ? "S" : "K"}</span>
                <div className="min-w-0">
                  <p className="text-[13px] text-bo-text-soft">{f.von === "studio" ? R.studio : f.autor || kunde} · {String(f.erstellt_am || "").slice(8, 10)}.{String(f.erstellt_am || "").slice(5, 7)}.{f.status === "Offen" && f.von === "kunde" && !weg.includes(f.name) ? " · offen" : ""}</p>
                  <p className="mt-1 text-[15px] leading-[22px]">{f.art === "sprachnachricht" ? `${R.sprachnotiz} ${Math.round(Number(f.audio_dauer_s || 0))} s – ${f.text || ""}` : f.text}</p>
                  {f.von === "kunde" && f.status === "Offen" && !weg.includes(f.name) && darfSchreiben && (
                    <div className="mt-2 flex gap-2">
                      <Knopf size="s" variant="ghost" onClick={() => setAktiv(f.name)}>Antworten</Knopf>
                      <Knopf size="s" variant="ghost" icon="Check" onClick={() => erledigt(f)} kuerzel="⇧E">{R.erledigt}</Knopf>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {darfSchreiben && (
          <div className="bo-prj-composer mt-5">
            <label htmlFor="antwort" className="text-[12px] font-medium text-bo-text-soft">{ziel ? R.antwortAn(nr(ziel) || "·", String(ziel.text || "").slice(0, 40)) : R.antwortPlatzhalter}</label>
            <textarea id="antwort" value={text} onChange={(e) => setText(e.target.value)} placeholder={R.antwortPlatzhalter} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); antworten(); } }} />
            <div className="bo-prj-composer__fuss">
              <span className="text-[12px] text-bo-text-soft">Strg + Enter</span>
              <Knopf size="s" laedt={pending} disabled={!text.trim()} onClick={antworten} data-testid="antwort-senden">{R.senden}</Knopf>
            </div>
          </div>
        )}
      </Kachel>
    </div>
  );
}
