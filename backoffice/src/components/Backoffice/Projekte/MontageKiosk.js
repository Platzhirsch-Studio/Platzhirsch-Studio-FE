"use client";
// Montage mobil (10-konzept-projekte.md § 8.1) im Lounge-Kiosk: Statuszeile (KioskShell), Segment Heute · Woche,
// nächster Stopp als Tinte-Karte mit Navi/Anruf (48 px), weitere Stopps als Kacheln. Stopp-Seite: Ort, Hinweis,
// Leistungen (Checkzeile 56 px), Fotos (Kamera), Mangel, Unterlagen, Zahlung (nur Hinweis, kein Bargeld – E14),
// Zustandsknopf unten (Losfahren · Beginnen · Fertig) als verzögerter Commit 6 s; ohne Recht „Status meldet dein
// Montageleiter“. Fertig → „Abnahme mit Kunde“.

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KioskShell from "../Kiosk/KioskShell";
import Segment from "../Segment";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { Sheet } from "../Overlay";
import FotoAufnahme from "../Eingabe/FotoAufnahme";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { leistungAction, mangelErfassenAction, montageStatusAction } from "@/lib/backoffice/projekte/actions";
import { kioskZustandsknopf } from "@/lib/backoffice/projekte/montage";
import { TEXTE, statusText } from "@/lib/backoffice/projekte/texte";
import "./projekte.css";

const K = TEXTE.kiosk;

function zeit(s) {
  return String(s || "").slice(11, 16);
}
function tag(s) {
  const d = new Date(`${String(s).slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat("de-AT", { weekday: "short", day: "2-digit", month: "2-digit" }).format(d);
}
const tel = (t) => `tel:${String(t || "").replace(/\s/g, "")}`;
const navi = (s) => `https://www.openstreetmap.org/search?query=${encodeURIComponent([s.strasse, s.plz, s.ort].filter(Boolean).join(" "))}`;

/** Startseite: Heute · Woche. */
export function MontageStart({ geraet, benutzer, stopps = [], heute, ansicht = "heute" }) {
  const heuteListe = stopps.filter((s) => String(s.start).slice(0, 10) === heute);
  const morgen = stopps.filter((s) => String(s.start).slice(0, 10) > heute);
  const liste = ansicht === "woche" ? stopps : heuteListe;
  return (
    <KioskShell titel={K.titel} geraet={geraet} benutzer={benutzer} kontext={ansicht === "woche" ? K.woche : K.heute}
      kopfSlot={<Segment label="Ansicht" groesse="s" aktiv={ansicht} optionen={[{ wert: "heute", titel: K.heute, href: "/montage" }, { wert: "woche", titel: K.woche, href: "/montage?ansicht=woche" }]} />}>
      <div className="bo-prj-kiosk" data-testid="montage-kiosk">
        <h1 className="bo-titel-gross">{ansicht === "woche" ? K.woche : `${K.heute} · ${tag(heute)}`}</h1>
        {liste.length === 0 ? (
          <div className="bo-prj-stopp items-start">
            <p className="text-[17px]">{ansicht === "woche" ? K.wocheLeer : K.heuteLeer}</p>
            {ansicht === "heute" && morgen.length > 0 && <Knopf href="/montage?ansicht=woche" size="kiosk">{K.morgen(morgen.length)}</Knopf>}
          </div>
        ) : (
          liste.map((s, i) => (
            <article key={s.name} className="bo-prj-stopp" data-naechster={i === 0 && ansicht === "heute" ? "" : undefined} data-testid="stopp">
              {i === 0 && ansicht === "heute" && <span className="text-[13px] font-semibold opacity-80">{K.naechster}</span>}
              <div className="flex items-baseline justify-between gap-3">
                <span className="bo-prj-stopp__zeit">{ansicht === "woche" ? `${tag(s.start)} ` : ""}{zeit(s.start)}</span>
                <span className="text-[15px] font-medium">{statusText("PH Montageauftrag", s.status)}</span>
              </div>
              <Link href={`/montage/${encodeURIComponent(s.name)}`} className="bo-prj-zeilenlink text-[20px] font-semibold">
                {s.projektTitel}
              </Link>
              <p className="bo-prj-unter !text-[15px]">{[s.kunde, [s.strasse, s.ort].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</p>
              <p className="bo-prj-unter !text-[15px]">{K.team}: {s.team.join(", ")} · {s.leistungen} {K.leistungen} · {s.unterlagen} {K.unterlagen}</p>
              <div className="bo-prj-stopp__knoepfe">
                <Knopf size="kiosk" icon="MapPin" href={navi(s)}>{K.navi}</Knopf>
                {s.telefon && <Knopf size="kiosk" icon="Phone" href={tel(s.telefon)}>{K.anruf}</Knopf>}
              </div>
            </article>
          ))
        )}
      </div>
    </KioskShell>
  );
}

/** Stopp-Seite eines Montageauftrags. */
export function MontageStopp({ geraet, benutzer, s, darfStatus, rechnung }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [leistungen, setLeistungen] = useState(s.leistungenListe);
  const [status, setStatus] = useState(s.status);
  const [sheet, setSheet] = useState(null);
  const [mangel, setMangel] = useState("");
  const [frist, setFrist] = useState(7);
  const [pending, start] = useTransition();
  const knopf = kioskZustandsknopf(status);
  const haken = (l) =>
    start(async () => {
      const neu = Number(l.erledigt) ? 0 : 1;
      setLeistungen((a) => a.map((x) => (x.name === l.name ? { ...x, erledigt: neu } : x)));
      const r = await leistungAction({ montage: s.name, zeile: l.name, erledigt: neu });
      if (!r?.ok) zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
    });
  const zustand = () =>
    start(async () => {
      if (!knopf?.aktion) return router.push(`/montage/${encodeURIComponent(s.name)}/abnahme`);
      const alt = status;
      const r = await montageStatusAction({ name: s.name, aktion: knopf.aktion, kiosk: true });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      const ziel = { Losfahren: "Unterwegs", Beginnen: "In Arbeit", "Erledigt melden": "Erledigt" }[knopf.aktion];
      setStatus(ziel);
      starte(K.gemeldet(knopf.wort), { token: r.token, ms: r.ms, objekt: r.objekt, onVerworfen: () => setStatus(alt), onFehler: () => setStatus(alt), onErfolg: () => router.refresh() });
    });
  const mangelSpeichern = () =>
    start(async () => {
      const r = await mangelErfassenAction({ montage: s.name, beschreibung: mangel, fristTage: frist });
      if (!r?.ok) return zeige(r?.message || TEXTE.fehler.unbekannt, { art: "fehler" });
      zeige(K.mangelGespeichert, { art: "ok" });
      setMangel("");
      setSheet(null);
      router.refresh();
    });
  const offen = leistungen.filter((l) => !Number(l.erledigt)).length;
  return (
    <KioskShell titel={K.titel} geraet={geraet} benutzer={benutzer} kontext={s.projektTitel} zurueckHref="/montage" status={{ text: statusText("PH Montageauftrag", status), ton: status === "In Arbeit" ? "warnung" : "info" }}
      kuerzel={{ F12: () => zustand() }}>
      <div className="bo-prj-kiosk" data-testid="montage-stopp">
        <div className="flex items-center gap-3">
          <Knopf size="kiosk" variant="ghost" icon="ChevronLeft" href="/montage" label={K.zurueck} />
          <h1 className="bo-titel-gross min-w-0 truncate">{s.projektTitel}</h1>
        </div>
        <div className="bo-prj-stopp">
          <p className="text-[17px] font-semibold">{[s.strasse, [s.plz, s.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</p>
          {s.hinweis && <p className="text-[16px] text-bo-text-soft">Hinweis: {s.hinweis}</p>}
          <p className="text-[16px]">{s.kunde}{s.telefon ? ` · ${s.telefon}` : ""}</p>
          <div className="bo-prj-stopp__knoepfe">
            <Knopf size="kiosk" icon="MapPin" href={navi(s)}>{K.navi}</Knopf>
            {s.telefon && <Knopf size="kiosk" icon="Phone" href={tel(s.telefon)}>{K.anruf}</Knopf>}
          </div>
        </div>
        <div className="bo-prj-kmenue">
          <button type="button" onClick={() => setSheet("unterlagen")}><Icon name="FileText" className="size-6" /><span className="flex-1">{K.unterlagen} ({s.unterlagenListe.length})</span><Icon name="ChevronRight" className="size-5" /></button>
          <button type="button" onClick={() => setSheet("leistungen")} data-testid="kiosk-leistungen"><Icon name="CheckSquare" className="size-6" /><span className="flex-1">{K.leistungen} {leistungen.length - offen}/{leistungen.length}</span><Icon name="ChevronRight" className="size-5" /></button>
          <button type="button" onClick={() => setSheet("fotos")}><Icon name="Eye" className="size-6" /><span className="flex-1">{K.fotos} {s.fotos}</span><Icon name="ChevronRight" className="size-5" /></button>
          <button type="button" onClick={() => setSheet("mangel")} data-testid="kiosk-mangel"><Icon name="TriangleAlert" className="size-6" /><span className="flex-1">{K.maengel} {s.maengel}</span><Icon name="Plus" className="size-5" /></button>
          <button type="button" onClick={() => setSheet("zahlung")}><Icon name="Receipt" className="size-6" /><span className="flex-1">{K.zahlung}</span><Icon name="ChevronRight" className="size-5" /></button>
        </div>
        <div className="bo-prj-primaer-fest bo-material-stark">
          {darfStatus ? (
            <Knopf variant="primary" size="kiosk" className="w-full" laedt={pending} onClick={zustand} data-testid="zustandsknopf" disabled={!knopf}>
              {knopf?.wort || statusText("PH Montageauftrag", status)}
            </Knopf>
          ) : (
            <p className="px-3 py-2 text-center text-[16px] text-bo-text-soft">{K.statusMeldetLeiter}</p>
          )}
        </div>
      </div>
      <Sheet offen={!!sheet} onSchliessen={() => setSheet(null)} titel={sheet ? { unterlagen: K.unterlagen, leistungen: K.leistungen, fotos: K.fotos, mangel: K.mangelNeu, zahlung: K.zahlung }[sheet] : ""} groesse="md"
        fuss={sheet === "mangel" ? <Knopf variant="primary" size="kiosk" className="w-full" laedt={pending} disabled={!mangel.trim()} onClick={mangelSpeichern}>{K.speichern}</Knopf> : undefined}>
        {sheet === "unterlagen" && (s.unterlagenListe.length ? <div className="bo-prj-kmenue">{s.unterlagenListe.map((u) => <div key={u}><Icon name="FileText" className="size-6" />{u}</div>)}</div> : <p className="text-[16px]">{K.unterlagenLeer}</p>)}
        {sheet === "leistungen" && (
          <div className="flex flex-col gap-2">
            {leistungen.map((l) => (
              <button key={l.name} type="button" role="checkbox" aria-checked={!!Number(l.erledigt)} className="bo-prj-check" onClick={() => haken(l)}>
                <span className="bo-prj-check__box" aria-hidden="true">{Number(l.erledigt) ? "✓" : ""}</span>
                <span className="bo-prj-check__text">{l.beschreibung}</span>
              </button>
            ))}
          </div>
        )}
        {sheet === "fotos" && <FotoAufnahme label={K.kamera} ziel={{ doctype: "PH Montageauftrag", name: s.name }} warteschlange onAenderung={() => zeige(K.fotoGespeichert, { art: "ok" })} />}
        {sheet === "mangel" && (
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="text-[14px] font-medium text-bo-text-soft">{K.beschreibung}</span>
              <textarea className="bo-input mt-1 min-h-28 w-full text-[16px]" value={mangel} onChange={(e) => setMangel(e.target.value)} />
            </label>
            <div className="flex gap-2">{[3, 7, 14].map((n) => <button key={n} type="button" aria-pressed={frist === n} onClick={() => setFrist(n)} className={`h-12 flex-1 rounded-full text-[16px] font-medium ${frist === n ? "bg-bo-ink text-bo-surface" : "bg-bo-fill"}`}>+{n} Tage</button>)}</div>
          </div>
        )}
        {sheet === "zahlung" && (
          <div className="flex flex-col gap-3 text-[16px]">
            {rechnung ? <p>{rechnung.name} · {rechnung.status}</p> : <p>{K.zahlungLeer}</p>}
            <p className="text-bo-text-soft">{K.zahlungText}</p>
          </div>
        )}
      </Sheet>
    </KioskShell>
  );
}
