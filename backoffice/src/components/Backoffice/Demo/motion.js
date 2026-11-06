"use client";
// Demo „Bewegung“ (Team Q2, G-31) für /einstellungen?tab=system&baustein=motion – nur Admin,
// nur Mock (Prüfung im demo-register). Jede Probe zeigt eine Bewegung aus art-direction/lounge.md
// § 8 bzw. 04-motion.md: die Lounge-Bausteine aus globals.css (Kachel, Knopf, Segment, Schalter)
// und die Bewegungsklassen/Funktionen aus bo-motion.css und motion.js. Beispielwerte sind als
// solche gekennzeichnet.

import { startTransition, useEffect, useLayoutEffect, useRef, useState, ViewTransition } from "react";
import Kachel, { Bento } from "../Kachel";
import Knopf, { PfeilKnopf, RundKnopf } from "../Knopf";
import Segment from "../Segment";
import Schalter from "../Schalter";
import Bestaetigen from "../Bestaetigen";
import { Icon } from "../icons";
import cx from "../cx";
import { DAUER, FEDER, FEDER_SANFT, Haken, abgang, animiere, flip, markiere, merke, staffel, useGleiter, useHochzaehlen, useReduziert } from "../motion";

const TEXTE = {
  titel: "Bewegung",
  einleitung: "Jede Bewegung hat einen Zweck: Herkunft zeigen, Ziel zeigen, einen Druck bestätigen oder auf einen Fehler hinweisen. Federn statt linearer Übergänge, nur Verschieben, Skalieren und Blenden.",
  reduziertJa: "Bewegung reduziert (Systemeinstellung): nur kurze Blenden, Zahlen sofort final, Häkchen gezeichnet.",
  reduziertNein: "Bewegung normal. Mit „Bewegung reduzieren“ im System bleiben nur kurze Blenden.",
  erneut: "Erneut abspielen",
  federn: {
    titel: "Federn",
    unter: "Aus der Feder-Gleichung berechnet, als CSS linear()",
    feder: "Feder",
    federZweck: "Knöpfe, Indikatoren, Panels · 620 ms",
    sanft: "Feder sanft",
    sanftZweck: "Einblenden von Kacheln · 700 ms",
    abspielen: (n) => `${n} abspielen`,
  },
  druck: { titel: "Druck-Feder", unter: "Eindrücken in 80 ms, mit Feder zurück", primaer: "Speichern", neben: "Abbrechen", rund: "Teilen", plus: "Eins mehr", stueck: (n) => `${n} im Korb` },
  kachel: { titel: "Kachel-Hover", unter: "Hebt 2 px, Schatten eine Stufe tiefer, Pfeil dreht 45°", name: "Beispielkachel", text: "Zeiger darüber bewegen" },
  staffel: { titel: "Staffel", unter: "Kacheln erscheinen nacheinander, je 30 ms", kachel: (n) => `Kachel ${n}` },
  segment: { titel: "Segmented Control", unter: "Indikator gleitet mit Feder", label: "Beispiel-Filter", optionen: ["Alle", "Neu", "Beratung", "Angebot"] },
  reiter: { titel: "Pillen-Reiter", unter: "Aktive Pille gleitet mit (useGleiter)", label: "Beispiel-Reiter", optionen: ["Übersicht", "Verlauf", "Belege", "Bezüge"] },
  schalter: { titel: "Schalter", unter: "Daumen federt, verbreitert sich beim Drücken", label: "Beleg per E-Mail" },
  zahl: { titel: "Zahl", unter: "Zählt beim Erscheinen hoch, danach bei jeder Änderung", label: "Beispielwert", plus: "Plus 25", minus: "Minus 10" },
  balken: { titel: "Balken", unter: "Wachsen aus der Grundlinie", monate: ["Jun", "Jul", "Aug", "Sep", "Okt", "Nov"], werte: [42, 55, 48, 63, 71, 38] },
  panel: { titel: "Panel", unter: "Vorschau gleitet mit Feder von rechts ein", oeffnen: "Vorschau zeigen", schliessen: "Vorschau schließen", inhalt: "Beispiel-Vorschau", text: "Kunde, Wunsch und nächster Schritt stehen hier." },
  sheet: { titel: "Sheet mit Häkchen", unter: "Von unten mit Feder, Häkchen zeichnet sich nach 220 ms", oeffnen: "Bezahlt-Sheet zeigen", betrag: "Beispielbetrag", status: "Bezahlt", weiter: "Nächster Kunde", schliessen: "Schließen" },
  liste: {
    titel: "Liste",
    unter: "Erscheinen, Verschwinden, Markieren",
    anlegen: "Eintrag anlegen",
    entfernen: "Ersten entfernen",
    leer: "Keine Einträge. „Eintrag anlegen“ fügt einen hinzu.",
    eintrag: (n) => `Beispiel-Eintrag ${n}`,
    angelegt: (n) => `Beispiel-Eintrag ${n} angelegt`,
    entfernt: (n) => `Beispiel-Eintrag ${n} entfernt`,
  },
  dialog: { titel: "Dialog", unter: "Sofort sichtbar, Form federt nach", oeffnen: "Dialog öffnen", frage: "Beispiel-Dialog schließen?", text: "Esc oder Abbrechen schließt.", ja: "Schließen" },
  toast: {
    titel: "Toast mit Rückgängig",
    unter: "Balken 8 s, hält bei Zeiger oder Fokus an",
    zeigen: "Toast zeigen",
    text: "Beispiel-Eintrag archiviert",
    rueck: "Rückgängig",
    rueckSek: (s) => `Rückgängig (${s} s)`,
    wieder: "Wiederhergestellt",
    ausgefuehrt: "Ausgeführt",
  },
  scan: {
    titel: "Scan-Bestätigung",
    unter: "Ring, Symbol und Text – nie Farbe allein",
    erkannt: "Erkannt",
    unbekannt: "Unbekannt",
    doppelt: "Doppelt",
    leer: "Bereit für den nächsten Scan",
    erkanntText: "Hinzugefügt: Beispielartikel",
    unbekanntText: "Unbekannter Code 4006… – Artikel suchen (F3)",
    doppeltText: "Menge erhöht auf 2",
  },
  kanban: { titel: "Ablage", unter: "Karte federt in die Zielspalte", links: "Offen", rechts: "In Arbeit", karte: "Beispielkarte", umsetzen: "Karte umsetzen", ungueltig: "Ungültige Ablage", nachRechts: "Karte nach „In Arbeit“ verschoben", nachLinks: "Karte nach „Offen“ verschoben", keinUebergang: "Von „Offen“ nach „Erledigt“ gibt es keinen Übergang." },
  seite: { titel: "Seitenwechsel", unter: "Neue Seite steigt mit sanfter Feder auf", wechseln: "Ansicht wechseln", a: "Ansicht A", b: "Ansicht B", aText: "Alt blendet in 120 ms aus, neu steigt 12 px auf.", bText: "Browser-Zurück, Filterwechsel und Aktualisieren wechseln ohne Übergang." },
  erfolg: { titel: "Erfolgsmoment", unter: "Ein Moment je abgeschlossenem Vorgang", abschliessen: "Vorgang abschließen", zuruecksetzen: "Zurücksetzen", ueberschrift: "Beispiel-Vorgang abgeschlossen", nummer: "Nr. BEISPIEL-0001", weiter: "Nächster Schritt" },
  drucken: { titel: "Druck-Rückmeldung", unter: "Blatt läuft aus dem Symbol", bereit: "Bon drucken", druckt: "Druckt …", fertig: "Gedruckt" },
};

// Eingelassene Fläche in einer Kachel (Radius 28 − 8 = 20, Fläche 2) – wie .bo-kachel--eingelassen.
const FLAECHE = "rounded-[20px] bg-bo-surface-2";

function Probe({ titel, unter, testid, children, className, werkzeuge }) {
  return (
    <Kachel titel={titel} unter={unter} werkzeuge={werkzeuge} ebene={3} className={className} testid={testid}>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </Kachel>
  );
}

function Erneut({ onClick, name }) {
  return <RundKnopf icon="RotateCcw" label={name ? `${name}: ${TEXTE.erneut}` : TEXTE.erneut} groesse="s" onClick={onClick} />;
}

// ------------------------------------------------------------------ Federn (Kurven)
function stuetzen(kurve) {
  return kurve
    .replace(/^linear\(|\)$/g, "")
    .split(",")
    .map((s) => Number(s.trim()));
}

function Kurve({ kurve, titel, zweck, dauer }) {
  const w = stuetzen(kurve);
  const B = 220;
  const H = 96;
  const y = (v) => H - 8 - v * (H - 28);
  const punkte = w.map((v, i) => `${((i / (w.length - 1)) * B).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const [lauf, setLauf] = useState(0);
  return (
    <div className={cx(FLAECHE, "min-w-0 p-4")}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[15px] font-semibold">{titel}</p>
        <p className="text-[12px] leading-4 text-bo-text-soft tabular-nums">{zweck}</p>
      </div>
      <svg viewBox={`0 0 ${B} ${H}`} className="mt-3 h-24 w-full overflow-visible" aria-hidden="true" preserveAspectRatio="none">
        <line x1="0" x2={B} y1={y(1)} y2={y(1)} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        <polyline points={punkte} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <button type="button" onClick={() => setLauf((n) => n + 1)} className="bo-druck bo-druck-flaeche mt-3 flex h-11 w-full items-center rounded-full bg-bo-surface px-1.5 shadow-(--bo-sh-card) [container-type:inline-size]" aria-label={TEXTE.federn.abspielen(titel)}>
        <span key={lauf} className="size-8 rounded-full bg-bo-action shadow-(--bo-sh-ink)" style={lauf ? { animation: `demo-q2-lauf ${dauer}ms ${kurve} both` } : undefined} aria-hidden="true" />
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ Druck
function DruckFederProbe() {
  const [n, setN] = useState(0);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Knopf variant="primary">{TEXTE.druck.primaer}</Knopf>
      <Knopf>{TEXTE.druck.neben}</Knopf>
      <RundKnopf icon="ArrowUpRight" label={TEXTE.druck.rund} />
      {/* Kassa-Muster ohne eigenen Baustein: .bo-druck .bo-druck-klein + Zähler mit Feder-Pop */}
      <span className="relative">
        <button type="button" onClick={() => setN((x) => x + 1)} className="bo-druck bo-druck-klein grid size-11 place-items-center rounded-full bg-bo-surface-2 active:bg-bo-action active:text-bo-action-text" aria-label={TEXTE.druck.plus} data-testid="demo-druck-plus">
          <Icon name="Plus" className="size-5" />
        </button>
        {n > 0 && (
          <span key={n} className="bo-anim-pop pointer-events-none absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-cognac px-1.5 text-[12px] font-semibold text-white tabular-nums" aria-hidden="true">
            {n}
          </span>
        )}
        <span className="sr-only" aria-live="polite">
          {n > 0 ? TEXTE.druck.stueck(n) : ""}
        </span>
      </span>
    </div>
  );
}

// ------------------------------------------------------------------ Staffel
function StaffelProbe() {
  const [lauf, setLauf] = useState(0);
  return (
    <Probe titel={TEXTE.staffel.titel} unter={TEXTE.staffel.unter} testid="probe-staffel" werkzeuge={<Erneut name={TEXTE.staffel.titel} onClick={() => setLauf((n) => n + 1)} />}>
      <div key={lauf} className="bo-staffel grid grid-cols-3 gap-3" data-testid="demo-staffel">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className={cx(FLAECHE, "flex h-20 items-end p-3 text-[13px] text-bo-text-soft")}>
            {TEXTE.staffel.kachel(n)}
          </div>
        ))}
      </div>
    </Probe>
  );
}

// ------------------------------------------------------------------ Reiter mit useGleiter
function ReiterProbe() {
  const [wert, setWert] = useState(0);
  const { ref, indikator } = useGleiter(wert);
  return (
    <div ref={ref} role="tablist" aria-label={TEXTE.reiter.label} className="relative inline-flex max-w-full self-start overflow-x-auto rounded-full bg-bo-surface p-1 shadow-(--bo-sh-btn)" data-testid="demo-reiter">
      {indikator && <span {...indikator} className={cx(indikator.className, "absolute left-0 top-0 rounded-full bg-bo-action shadow-(--bo-sh-ink)")} data-testid="demo-reiter-indikator" />}
      {TEXTE.reiter.optionen.map((o, i) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={wert === i}
          onClick={() => setWert(i)}
          className={cx("bo-druck relative z-[1] h-9 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors duration-200", wert === i ? "text-bo-action-text" : "text-bo-text-soft hover:text-bo-text")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Zahl
function ZahlAnzeige({ wert }) {
  const anzeige = useHochzaehlen(wert);
  return (
    <>
      <p className="text-[64px] font-light leading-[68px] tracking-[-0.05em] tabular-nums" aria-hidden="true" data-testid="demo-zahl">
        {anzeige.toLocaleString("de-DE")}
      </p>
      <p className="sr-only" aria-live="polite">
        {wert.toLocaleString("de-DE")}
      </p>
    </>
  );
}

function ZahlProbe() {
  const [wert, setWert] = useState(1240);
  const [lauf, setLauf] = useState(0);
  return (
    <Probe titel={TEXTE.zahl.titel} unter={TEXTE.zahl.unter} testid="probe-zahl" werkzeuge={<Erneut name={TEXTE.zahl.titel} onClick={() => setLauf((n) => n + 1)} />}>
      <p className="text-[13px] text-bo-text-soft">{TEXTE.zahl.label}</p>
      <ZahlAnzeige key={lauf} wert={wert} />
      <div className="mt-auto flex flex-wrap gap-3 pt-4">
        <Knopf icon="Plus" onClick={() => setWert((w) => w + 25)} data-testid="demo-zahl-plus">
          {TEXTE.zahl.plus}
        </Knopf>
        <Knopf icon="Minus" onClick={() => setWert((w) => Math.max(0, w - 10))}>
          {TEXTE.zahl.minus}
        </Knopf>
      </div>
    </Probe>
  );
}

// ------------------------------------------------------------------ Balken
function BalkenProbe() {
  const [lauf, setLauf] = useState(0);
  const max = Math.max(...TEXTE.balken.werte);
  return (
    <Probe titel={TEXTE.balken.titel} unter={TEXTE.balken.unter} testid="probe-balken" werkzeuge={<Erneut name={TEXTE.balken.titel} onClick={() => setLauf((n) => n + 1)} />}>
      <div key={lauf} className="flex h-36 items-end gap-3" data-testid="demo-balken">
        {TEXTE.balken.werte.map((v, i) => (
          <div key={TEXTE.balken.monate[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span
              className={cx("bo-wachsen-y w-full max-w-9 rounded-t-[10px] rounded-b-[4px]", i === 4 ? "bg-bo-text" : "bg-bo-text/15")}
              style={{ ...staffel(i), height: `${(v / max) * 100}%` }}
              aria-label={`${TEXTE.balken.monate[i]}: ${v}`}
              role="img"
            />
            <span className="text-[12px] text-bo-text-soft">{TEXTE.balken.monate[i]}</span>
          </div>
        ))}
      </div>
    </Probe>
  );
}

// ------------------------------------------------------------------ Panel
function PanelProbe() {
  const [offen, setOffen] = useState(false);
  return (
    <>
      <Knopf onClick={() => setOffen((o) => !o)} aria-expanded={offen} className="self-start" data-testid="demo-panel-umschalten">
        {offen ? TEXTE.panel.schliessen : TEXTE.panel.oeffnen}
      </Knopf>
      <div className="mt-4 min-h-28">
        {offen && (
          <div className="bo-panel rounded-[20px] bg-bo-surface p-5 shadow-(--bo-sh-float)" data-testid="demo-panel">
            <p className="text-[15px] font-semibold">{TEXTE.panel.inhalt}</p>
            <p className="mt-1 text-[13px] text-bo-text-soft">{TEXTE.panel.text}</p>
          </div>
        )}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Sheet von unten
function SheetProbe() {
  const ref = useRef(null);
  const [offen, setOffen] = useState(false);
  const [mail, setMail] = useState(true);
  const [n, setN] = useState(0);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (offen && !d.open) d.showModal();
    if (!offen && d.open) d.close();
  }, [offen]);
  return (
    <>
      <Knopf
        onClick={() => {
          setN((x) => x + 1);
          setOffen(true);
        }}
        className="self-start"
        data-testid="demo-sheet-oeffnen"
      >
        {TEXTE.sheet.oeffnen}
      </Knopf>
      <dialog
        ref={ref}
        data-seite="unten"
        onClose={() => setOffen(false)}
        className="bo-sheet bo-material m-auto mb-6 w-[min(440px,calc(100vw-32px))] rounded-[32px] p-6 pt-3 text-bo-text shadow-(--bo-sh-float) outline-none backdrop:bg-bo-overlay"
        aria-labelledby="demo-sheet-titel"
        data-testid="demo-sheet"
      >
        <div className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-bo-line-strong" aria-hidden="true" />
        <div className="flex flex-col items-center text-center">
          <span className="grid size-[72px] place-items-center rounded-full bg-bo-ok-soft text-bo-ok">{offen && <Haken key={n} groesse={40} strich={2.5} />}</span>
          <p id="demo-sheet-titel" className="mt-4 text-[15px] text-bo-text-soft">
            {TEXTE.sheet.status}
          </p>
          <p className="text-[44px] font-semibold leading-[52px] tracking-[-0.03em] tabular-nums">{TEXTE.sheet.betrag}</p>
        </div>
        <div className="my-5 rounded-[16px] bg-bo-surface px-4 shadow-(--bo-sh-card)">
          <Schalter label={TEXTE.schalter.label} an={mail} onWechsel={setMail} />
        </div>
        <div className="flex gap-3">
          <Knopf size="l" onClick={() => setOffen(false)} className="flex-1">
            {TEXTE.sheet.schliessen}
          </Knopf>
          <Knopf size="l" variant="primary" onClick={() => setOffen(false)} className="flex-1">
            {TEXTE.sheet.weiter}
          </Knopf>
        </div>
      </dialog>
    </>
  );
}

// ------------------------------------------------------------------ Liste
function ListenProbe({ ansage }) {
  const [liste, setListe] = useState([{ id: 1 }, { id: 2 }, { id: 3 }]);
  const naechste = useRef(4);
  const refs = useRef(new Map());
  const entfernenKnopf = useRef(null);

  const anlegen = () => {
    const id = naechste.current++;
    setListe((l) => [{ id, neu: true }, ...l]);
    ansage(TEXTE.liste.angelegt(id));
    requestAnimationFrame(() => markiere(refs.current.get(id)));
  };
  const entfernen = async () => {
    const erster = liste[0];
    if (!erster) return;
    await abgang(refs.current.get(erster.id));
    setListe((l) => l.filter((e) => e.id !== erster.id));
    ansage(TEXTE.liste.entfernt(erster.id));
    entfernenKnopf.current?.focus();
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Knopf icon="Plus" onClick={anlegen} data-testid="demo-liste-anlegen">
          {TEXTE.liste.anlegen}
        </Knopf>
        <Knopf onClick={entfernen} disabled={liste.length === 0} ref={entfernenKnopf} data-testid="demo-liste-entfernen">
          {TEXTE.liste.entfernen}
        </Knopf>
      </div>
      {liste.length === 0 ? (
        <p className="bo-anim-eintrag-fade text-[15px] text-bo-text-soft">{TEXTE.liste.leer}</p>
      ) : (
        <ul className="flex flex-col gap-1" data-testid="demo-liste" data-bo-viele={liste.length > 8 ? "true" : undefined}>
          {liste.map((e) => (
            <li
              key={e.id}
              ref={(el) => {
                if (el) refs.current.set(e.id, el);
                else refs.current.delete(e.id);
              }}
              className={cx("bo-markierbar flex min-h-12 items-center rounded-[14px] bg-bo-surface-2 px-4 text-[15px]", e.neu && "bo-anim-eintrag")}
              data-testid="demo-liste-eintrag"
            >
              {TEXTE.liste.eintrag(e.id)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Toast
function ToastProbe({ reduziert }) {
  const [toast, setToast] = useState(null); // { id, zustand: "laeuft"|"rueck"|"ausgefuehrt", geht }
  const rest = useRef(0);
  const start = useRef(0);
  const timer = useRef(0);
  const [sek, setSek] = useState(8);
  const zaehler = useRef(0);

  const gehe = (id) => {
    setToast((t) => (t && t.id === id ? { ...t, geht: true } : t));
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), DAUER.fast);
  };
  const plane = (id, ms) => {
    clearTimeout(timer.current);
    start.current = performance.now();
    rest.current = ms;
    timer.current = setTimeout(() => {
      setToast((t) => (t && t.id === id ? { ...t, zustand: "ausgefuehrt" } : t));
      setTimeout(() => gehe(id), 1500);
    }, ms);
  };
  const zeigen = () => {
    const id = ++zaehler.current;
    setToast({ id, zustand: "laeuft", geht: false });
    setSek(Math.round(DAUER.undo / 1000));
    plane(id, DAUER.undo);
  };
  const pause = () => {
    if (!toast || toast.zustand !== "laeuft") return;
    clearTimeout(timer.current);
    rest.current = Math.max(0, rest.current - (performance.now() - start.current));
  };
  const weiter = () => {
    if (!toast || toast.zustand !== "laeuft") return;
    plane(toast.id, rest.current);
  };
  const rueck = () => {
    if (!toast) return;
    clearTimeout(timer.current);
    const id = toast.id;
    setToast((t) => ({ ...t, zustand: "rueck" }));
    setTimeout(() => gehe(id), 1500);
  };

  // Bei reduzierter Bewegung steht der Balken; der Text zählt sekündlich herunter (Timer = Wahrheit).
  useEffect(() => {
    if (!reduziert || !toast || toast.zustand !== "laeuft") return;
    const iv = setInterval(() => setSek((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [reduziert, toast]);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <>
      <Knopf onClick={zeigen} className="self-start" data-testid="demo-toast-zeigen">
        {TEXTE.toast.zeigen}
      </Knopf>
      <div aria-live="polite" className="mt-4 min-h-16">
        {toast && (
          <div
            key={toast.id}
            role="status"
            className="bo-toast flex max-w-sm items-center gap-3 rounded-full bg-bo-action py-2 pl-4 pr-2 text-[14px] text-bo-action-text shadow-(--bo-sh-float)"
            style={{ "--undo-ms": `${DAUER.undo}ms` }}
            data-geht={toast.geht ? "true" : undefined}
            data-rueckgaengig={toast.zustand === "rueck" ? "true" : undefined}
            onMouseEnter={pause}
            onMouseLeave={weiter}
            onFocus={pause}
            onBlur={weiter}
            data-testid="demo-toast"
          >
            <Icon name={toast.zustand === "laeuft" ? "Info" : "Check"} className={cx("size-4 shrink-0", toast.zustand === "laeuft" && "opacity-70")} />
            <span className="flex min-h-8 flex-1 items-center">{toast.zustand === "rueck" ? TEXTE.toast.wieder : toast.zustand === "ausgefuehrt" ? TEXTE.toast.ausgefuehrt : TEXTE.toast.text}</span>
            {toast.zustand === "laeuft" && (
              <button type="button" onClick={rueck} className="bo-druck h-8 rounded-full bg-bo-action-text/15 px-3 text-[13px] font-semibold hover:bg-bo-action-text/25">
                {reduziert ? TEXTE.toast.rueckSek(sek) : TEXTE.toast.rueck}
              </button>
            )}
            {toast.zustand === "laeuft" && <span className="bo-toast-balken" aria-hidden="true" />}
          </div>
        )}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Scan
function ScanProbe() {
  const [scan, setScan] = useState({ n: 0, ergebnis: null });
  const setze = (ergebnis) => setScan((s) => ({ n: s.n + 1, ergebnis }));
  useEffect(() => {
    if (!scan.ergebnis) return;
    const t = setTimeout(() => setScan((s) => (s.n === scan.n ? { ...s, ergebnis: null } : s)), 1500);
    return () => clearTimeout(t);
  }, [scan]);
  const text = { erkannt: TEXTE.scan.erkanntText, unbekannt: TEXTE.scan.unbekanntText, doppelt: TEXTE.scan.doppeltText }[scan.ergebnis] || TEXTE.scan.leer;
  const symbol = { erkannt: "Check", unbekannt: "TriangleAlert", doppelt: "Info" }[scan.ergebnis] || "ScanLine";
  const farbe = { erkannt: "text-bo-ok", unbekannt: "text-bo-danger", doppelt: "text-bo-warn-text" }[scan.ergebnis] || "text-bo-text-soft";
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Knopf onClick={() => setze("erkannt")} data-testid="demo-scan-erkannt">{TEXTE.scan.erkannt}</Knopf>
        <Knopf onClick={() => setze("unbekannt")} data-testid="demo-scan-unbekannt">{TEXTE.scan.unbekannt}</Knopf>
        <Knopf onClick={() => setze("doppelt")}>{TEXTE.scan.doppelt}</Knopf>
      </div>
      <div
        key={scan.n}
        className={cx("bo-scan flex min-h-14 items-center gap-3 rounded-[16px] bg-bo-surface px-4 text-[15px]", !scan.ergebnis && "shadow-(--bo-sh-card)")}
        style={{ "--bo-scan-grund": "var(--bo-sh-card)" }}
        data-ergebnis={scan.ergebnis || undefined}
        role="status"
        data-testid="demo-scan"
      >
        <Icon name={symbol} className={cx("size-5 shrink-0", farbe)} />
        <span>{text}</span>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Ablage (FLIP + Feder)
function KanbanProbe({ ansage }) {
  const [rechts, setRechts] = useState(false);
  const karte = useRef(null);
  const vorher = useRef(null);
  const [fehler, setFehler] = useState(false);

  useLayoutEffect(() => {
    if (!vorher.current) return;
    flip(karte.current, vorher.current, { feder: true });
    vorher.current = null;
  }, [rechts]);

  const umsetzen = () => {
    vorher.current = merke(karte.current);
    setFehler(false);
    setRechts((r) => !r);
    ansage(rechts ? TEXTE.kanban.nachLinks : TEXTE.kanban.nachRechts);
  };
  const ungueltig = () => {
    // Rückkehr bei ungültiger Ablage: 200 ms ease-out zurück, ohne Feder; Text statt Bewegung allein.
    animiere(karte.current, [{ transform: "translateX(48px) scale(1.02)" }, { transform: "none" }], { duration: DAUER.move, easing: "aus" });
    setFehler(true);
    ansage(TEXTE.kanban.keinUebergang);
  };

  const spalte = (titel, aktiv) => (
    <div className={cx(FLAECHE, "min-h-28 min-w-0 flex-1 p-2")} aria-label={titel} role="group">
      <p className="mb-2 px-2 pt-1 text-[13px] font-medium text-bo-text-soft">{titel}</p>
      {aktiv && (
        <div ref={karte} className="rounded-[14px] bg-bo-surface p-3 text-[15px] shadow-(--bo-sh-card)" data-testid="demo-kanban-karte">
          {TEXTE.kanban.karte}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Knopf onClick={umsetzen} data-testid="demo-kanban-umsetzen">{TEXTE.kanban.umsetzen}</Knopf>
        <Knopf onClick={ungueltig}>{TEXTE.kanban.ungueltig}</Knopf>
      </div>
      <div className="flex gap-3" data-testid="demo-kanban" data-seite={rechts ? "rechts" : "links"}>
        {spalte(TEXTE.kanban.links, !rechts)}
        {spalte(TEXTE.kanban.rechts, rechts)}
      </div>
      {fehler && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-bo-danger-text">
          <Icon name="TriangleAlert" className="size-4" /> {TEXTE.kanban.keinUebergang}
        </p>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Seitenwechsel (View Transition)
function SeitenProbe() {
  const [ansicht, setAnsicht] = useState("a");
  const wechseln = () => startTransition(() => setAnsicht((a) => (a === "a" ? "b" : "a")));
  return (
    <>
      <Knopf onClick={wechseln} className="self-start" data-testid="demo-seite-wechseln">{TEXTE.seite.wechseln}</Knopf>
      <div className="mt-4 min-h-24">
        <ViewTransition key={ansicht} enter="bo-seite" exit="bo-seite" default="none">
          <div className={cx(FLAECHE, "p-4")} data-testid="demo-seite" data-ansicht={ansicht}>
            <p className="text-[15px] font-semibold">{ansicht === "a" ? TEXTE.seite.a : TEXTE.seite.b}</p>
            <p className="mt-1 text-[13px] text-bo-text-soft">{ansicht === "a" ? TEXTE.seite.aText : TEXTE.seite.bText}</p>
          </div>
        </ViewTransition>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Erfolgsmoment
function ErfolgProbe() {
  const [fertig, setFertig] = useState(false);
  const weiter = useRef(null);
  useEffect(() => {
    if (!fertig) return;
    const t = setTimeout(() => weiter.current?.focus(), DAUER.slow);
    return () => clearTimeout(t);
  }, [fertig]);
  if (!fertig) {
    return (
      <Knopf variant="primary" onClick={() => setFertig(true)} className="self-start" data-testid="demo-erfolg-abschliessen">
        {TEXTE.erfolg.abschliessen}
      </Knopf>
    );
  }
  return (
    <section className={cx("bo-erfolg p-5", FLAECHE)} role="status" aria-live="polite" data-testid="demo-erfolg">
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-bo-ok-soft text-bo-ok">
          <Haken groesse={26} />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">{TEXTE.erfolg.ueberschrift}</p>
          <p className="text-[13px] text-bo-text-soft tabular-nums">{TEXTE.erfolg.nummer}</p>
        </div>
      </div>
      <div className="bo-erfolg-schritte mt-4 flex flex-wrap gap-3">
        <Knopf variant="primary" ref={weiter}>{TEXTE.erfolg.weiter}</Knopf>
        <Knopf onClick={() => setFertig(false)}>{TEXTE.erfolg.zuruecksetzen}</Knopf>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ Druck
function DruckProbe() {
  const [zustand, setZustand] = useState("bereit");
  const timer = useRef([]);
  useEffect(() => () => timer.current.forEach(clearTimeout), []);
  const drucken = () => {
    timer.current.forEach(clearTimeout);
    setZustand("druckt");
    timer.current = [setTimeout(() => setZustand("fertig"), 1800), setTimeout(() => setZustand("bereit"), 3300)];
  };
  return (
    <div data-druck={zustand} className="self-start">
      <Knopf onClick={drucken} disabled={zustand === "druckt"} aria-busy={zustand === "druckt" || undefined} data-testid="demo-druck">
        <span className="relative inline-flex size-4 items-center justify-center" aria-hidden="true">
          <Icon name={zustand === "fertig" ? "Check" : "Printer"} className="size-4" />
          {zustand === "druckt" && <span className="bo-druck-blatt absolute -top-1 left-1 h-1.5 w-2 rounded-[1px] bg-current" />}
        </span>
        {zustand === "druckt" ? TEXTE.drucken.druckt : zustand === "fertig" ? TEXTE.drucken.fertig : TEXTE.drucken.bereit}
      </Knopf>
    </div>
  );
}

// ------------------------------------------------------------------ Seite
export default function MotionDemo() {
  const reduziert = useReduziert();
  const [dialog, setDialog] = useState(false);
  const [meldung, setMeldung] = useState("");
  const [segment, setSegment] = useState(TEXTE.segment.optionen[0]);
  const [schalter, setSchalter] = useState(true);
  const halb = "md:col-span-6 2xl:col-span-4";

  return (
    <div className="min-w-0" data-testid="demo-motion">
      {/* Nur für die Kurven-Probe: Kugel läuft über die Breite (Kurve kommt inline). */}
      <style>{"@keyframes demo-q2-lauf{from{translate:0 0}to{translate:calc(100cqw - 2rem - 12px) 0}}"}</style>
      <h2 className="text-[34px] font-semibold leading-10 tracking-[-0.022em]">{TEXTE.titel}</h2>
      <p className="mt-2 max-w-[62ch] text-[15px] leading-[22px] text-bo-text-soft">{TEXTE.einleitung}</p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-bo-surface px-3 py-1.5 text-[13px] text-bo-text-soft shadow-(--bo-sh-btn)" data-testid="demo-reduziert" data-reduziert={reduziert ? "ja" : "nein"}>
        <span className={cx("size-2 rounded-full", reduziert ? "bg-bo-warn" : "bg-bo-ok")} aria-hidden="true" /> {reduziert ? TEXTE.reduziertJa : TEXTE.reduziertNein}
      </p>
      <p className="sr-only" aria-live="polite">
        {meldung}
      </p>

      <Bento className="mt-8">
        <Probe titel={TEXTE.federn.titel} unter={TEXTE.federn.unter} testid="probe-federn" className="md:col-span-12 2xl:col-span-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Kurve kurve={FEDER} titel={TEXTE.federn.feder} zweck={TEXTE.federn.federZweck} dauer={DAUER.feder} />
            <Kurve kurve={FEDER_SANFT} titel={TEXTE.federn.sanft} zweck={TEXTE.federn.sanftZweck} dauer={DAUER.erscheinen} />
          </div>
        </Probe>

        <Kachel titel={TEXTE.kachel.titel} unter={TEXTE.kachel.unter} ebene={3} lift className={cx(halb, "min-h-48")} testid="probe-kachel">
          <div className="mt-auto flex items-end justify-between gap-4">
            <div>
              <p className="text-[15px] font-semibold">{TEXTE.kachel.name}</p>
              <p className="text-[13px] text-bo-text-soft">{TEXTE.kachel.text}</p>
            </div>
            <PfeilKnopf nurOptik testid="demo-kachel-pfeil" />
          </div>
        </Kachel>

        <Probe titel={TEXTE.druck.titel} unter={TEXTE.druck.unter} testid="probe-druck-feder" className={halb}>
          <DruckFederProbe />
        </Probe>

        <Probe titel={TEXTE.segment.titel} unter={TEXTE.segment.unter} testid="probe-segment" className={halb}>
          <Segment label={TEXTE.segment.label} optionen={TEXTE.segment.optionen.map((o) => ({ wert: o, titel: o }))} wert={segment} onWechsel={setSegment} testid="demo-segment" className="self-start" />
        </Probe>

        <Probe titel={TEXTE.reiter.titel} unter={TEXTE.reiter.unter} testid="probe-reiter" className={halb}>
          <ReiterProbe />
        </Probe>

        <Probe titel={TEXTE.schalter.titel} unter={TEXTE.schalter.unter} testid="probe-schalter" className={halb}>
          <Schalter label={TEXTE.schalter.label} an={schalter} onWechsel={setSchalter} testid="demo-schalter" />
        </Probe>

        <div className={cx(halb, "flex")}>
          <StaffelProbe />
        </div>

        <div className={cx(halb, "flex")}>
          <ZahlProbe />
        </div>

        <div className={cx(halb, "flex")}>
          <BalkenProbe />
        </div>

        <Probe titel={TEXTE.panel.titel} unter={TEXTE.panel.unter} testid="probe-panel" className={halb}>
          <PanelProbe />
        </Probe>

        <Probe titel={TEXTE.sheet.titel} unter={TEXTE.sheet.unter} testid="probe-sheet" className={halb}>
          <SheetProbe />
        </Probe>

        <Probe titel={TEXTE.liste.titel} unter={TEXTE.liste.unter} testid="probe-liste" className={halb}>
          <ListenProbe ansage={setMeldung} />
        </Probe>

        <Probe titel={TEXTE.dialog.titel} unter={TEXTE.dialog.unter} testid="probe-dialog" className={halb}>
          <Knopf onClick={() => setDialog(true)} className="self-start" data-testid="demo-dialog-oeffnen">
            {TEXTE.dialog.oeffnen}
          </Knopf>
          <Bestaetigen offen={dialog} titel={TEXTE.dialog.frage} text={TEXTE.dialog.text} bestaetigen={TEXTE.dialog.ja} onBestaetigen={() => setDialog(false)} onAbbrechen={() => setDialog(false)} />
        </Probe>

        <Probe titel={TEXTE.toast.titel} unter={TEXTE.toast.unter} testid="probe-toast" className={halb}>
          <ToastProbe reduziert={reduziert} />
        </Probe>

        <Probe titel={TEXTE.scan.titel} unter={TEXTE.scan.unter} testid="probe-scan" className={halb}>
          <ScanProbe />
        </Probe>

        <Probe titel={TEXTE.kanban.titel} unter={TEXTE.kanban.unter} testid="probe-kanban" className={halb}>
          <KanbanProbe ansage={setMeldung} />
        </Probe>

        <Probe titel={TEXTE.seite.titel} unter={TEXTE.seite.unter} testid="probe-seite" className={halb}>
          <SeitenProbe />
        </Probe>

        <Probe titel={TEXTE.erfolg.titel} unter={TEXTE.erfolg.unter} testid="probe-erfolg" className={halb}>
          <ErfolgProbe />
        </Probe>

        <Probe titel={TEXTE.drucken.titel} unter={TEXTE.drucken.unter} testid="probe-druck" className={halb}>
          <DruckProbe />
        </Probe>
      </Bento>
    </div>
  );
}
