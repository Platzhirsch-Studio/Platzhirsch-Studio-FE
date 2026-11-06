"use client";
// Kiosk Packtisch nach JTL (33-referenz-jtl-packtisch § 4) im Lounge-Stil (Entwurf entwurf/lounge/packtisch,
// lounge.md §7.5): großes Scanfeld (Ring bereit/Fehler + Schütteln) + Mengenfeld + Fortschrittsring; links Auftrag
// (Quelle, Nummer, Versand, Adresse, Packhinweise), Mitte Positionen (Bild, EAN, Ist/Soll groß, Status als Farbe +
// Text + Symbol, erledigte nach unten), rechts Pakete (Packmittel-Segment, Gewicht manuell mit Plausibilität);
// unten Problem · Zurückstellen · Lieferschein · Etikett und genau EIN Abschluss-Knopf.
// Ablauf 10-konzept-logistik § 6 + E1: nach dem letzten Scan automatisch „Gepackt“ (verzögerter Commit 8 s) bzw.
// Etikett-Bildschirm (Versand). Mutationen nur über Server Actions (Mock-Pfad im Dienst).

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, Check, CircleAlert, Ellipsis, FileText, Gift, Hand, Layers, MapPin, Minus, Package, PackageCheck,
  PauseCircle, Plus, Printer, ScanLine, Store, Tag, Truck, Volume2, VolumeX, Wine, Container,
} from "lucide-react";
import KioskShell, { useKiosk } from "../Kiosk/KioskShell";
import Segment from "../Segment";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import Bestaetigen from "../Bestaetigen";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import Unterschrift from "../Eingabe/Unterschrift";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { druckHref } from "@/lib/backoffice/druck";
import { erkenneLogistikCode } from "@/lib/backoffice/logistik/scan";
import { fortschritt as packFortschritt, gewichtPlausibel, mengePruefen, posId, primaerAktion, setzeMenge, sortierePositionen, standAus, wendeScanAn, zeilenZustand } from "@/lib/backoffice/logistik/packen";
import { lieferartText } from "@/lib/backoffice/logistik/status";
import { DIALOG, ETIKETT, PACKTISCH as T, LEER, ERFOLG } from "@/lib/backoffice/logistik/texte";
import {
  ausgebenAction, bestellungOeffnenAction, etikettAction, gepacktPlanenAction, handBestaetigenAction, hinweiseBestaetigenAction, paketeSpeichernAction, paketeVorschlagenAction,
  positionMinusAction, positionStandAction, problemAction, scanAction, tarifeAction, teillieferungAction, verpackenAction, vorgangScannenAction, zurueckstellenAction, lagerScanAction, umlagernScanAction,
} from "@/lib/backoffice/logistik/actions";
import { Chip, Ring, StatusPille, kgText, datumKurz } from "./ui";
import "./logistik.css";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const S16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
const S24 = { size: 24, strokeWidth: 1.75, "aria-hidden": true };
const HINWEIS_ICON = { Wine, Gift, Tag, MapPin, Truck };
const EURO = (c) => new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(Number(c || 0) / 100);
const HILFE = [
  { taste: "F2", text: T.tastatur.f2 }, { taste: "F3", text: T.tastatur.f3 }, { taste: "F4", text: T.tastatur.f4 }, { taste: "F6", text: T.tastatur.f6 },
  { taste: "F7", text: T.tastatur.f7 }, { taste: "F9", text: T.tastatur.f9 }, { taste: "F12", text: T.tastatur.f12 },
];

const TON_SCHLUESSEL = "ph-bo:packtisch-ton";
function tonLesen() {
  try {
    return window.localStorage.getItem(TON_SCHLUESSEL) !== "aus";
  } catch {
    return true;
  }
}
function tonAbo(f) {
  window.addEventListener("storage", f);
  window.addEventListener(TON_SCHLUESSEL, f);
  return () => {
    window.removeEventListener("storage", f);
    window.removeEventListener(TON_SCHLUESSEL, f);
  };
}

/** Ton je Gerät (M5): an/aus in localStorage, hydrationssicher über useSyncExternalStore. */
function useTon() {
  const an = useSyncExternalStore(tonAbo, tonLesen, () => true);
  const umschalten = () => {
    try {
      window.localStorage.setItem(TON_SCHLUESSEL, an ? "aus" : "an");
    } catch {
      /* ohne Speicher bleibt es beim Standard */
    }
    window.dispatchEvent(new Event(TON_SCHLUESSEL));
  };
  const spiele = useCallback(
    (art) => {
      if (!an) return;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const folge = art === "fehler" ? [[220, 0], [220, 0.12]] : [[880, 0]];
        for (const [f, t] of folge) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = f;
          g.gain.value = 0.06;
          o.connect(g).connect(ctx.destination);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.06);
        }
        setTimeout(() => ctx.close(), 400);
      } catch {
        /* ohne Ton */
      }
    },
    [an],
  );
  return { an, umschalten, spiele };
}

const ohneAbo = () => () => {};
function TonPille() {
  const ton = useTon();
  const eingehaengt = useSyncExternalStore(ohneAbo, () => true, () => false);
  if (!eingehaengt) return null;
  return (
    <button type="button" className="bo-log-chip" data-ton={ton.an ? "salbei" : undefined} onClick={ton.umschalten} aria-pressed={ton.an} style={{ height: 36, padding: "0 12px" }} data-testid="packtisch-ton">
      {ton.an ? <Volume2 {...S16} /> : <VolumeX {...S16} />}
      {ton.an ? T.tonAn : T.tonAus}
    </button>
  );
}

// Globale Scans (Scanner ohne Fokus im Feld) gehen über die KioskShell an die Seite – als Ereignis, damit die
// Ansicht darunter sie empfängt, ohne Props zu verändern.
const SCAN_EREIGNIS = "ph-bo:logistik-scan";
function sendeScan(code) {
  window.dispatchEvent(new CustomEvent(SCAN_EREIGNIS, { detail: code }));
}
function useScanEmpfang(fn) {
  const empfang = useEffectEvent((e) => fn(e.detail));
  useEffect(() => {
    const h = (e) => empfang(e);
    window.addEventListener(SCAN_EREIGNIS, h);
    return () => window.removeEventListener(SCAN_EREIGNIS, h);
  }, []);
}

// ======================================================================= Start ==

/**
 * Startseite (§ 6.1): Scanfeld (Lieferschein, Bestellung, Abholcode, Artikel → Vorgang), Segment Packen · Abholung ·
 * Wareneingang, Karten (Heute → Etikett fehlt → Alter). Bezahlte Bestellung antippen erzeugt still den Lieferschein.
 */
export function PacktischStart({ daten, geraet, benutzer, packplatz }) {
  return (
    <KioskShell titel={T.titel} geraet={geraet} benutzer={benutzer} kontext={packplatz} hilfe={HILFE} zurueckHref="/arbeitsplatz" onScan={sendeScan} kopfSlot={<TonPille />}
      baender={daten.test ? [{ art: "training", text: "Versand im Testmodus – Etiketten sind Muster" }] : []}>
      <StartInhalt daten={daten} packplatz={packplatz} />
    </KioskShell>
  );
}

function StartInhalt({ daten, packplatz }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { ansagen } = useKiosk();
  const [segment, setSegment] = useState("packen");
  const [code, setCode] = useState("");
  const [ergebnis, setErgebnis] = useState("bereit");
  const [laeuft, start] = useTransition();
  const [lagerOffen, setLagerOffen] = useState(false);
  const feld = useRef(null);
  const ton = useTon();

  const oeffne = (ziel) => router.push(ziel);

  const scan = useCallback(
    (roh) => {
      const c = String(roh || "").trim();
      if (!c) return;
      const e = erkenneLogistikCode(c);
      if (e.art === "platz" || e.art === "bestand") {
        setLagerOffen(c);
        return;
      }
      if (e.art === "wareneingang") return oeffne(`/d/ph-wareneingang/${encodeURIComponent(e.wert)}`);
      start(async () => {
        const r = await vorgangScannenAction({ code: c, packplatz });
        if (r.ok && r.lieferschein) {
          setErgebnis("erkannt");
          ansagen(`Geöffnet: ${r.lieferschein}`);
          oeffne(`/packtisch/${encodeURIComponent(r.lieferschein)}`);
        } else {
          setErgebnis("unbekannt");
          ton.spiele("fehler");
          ansagen(T.scan.unbekannterCode);
          zeige(T.scan.unbekannterCode, { art: "warnung", unter: c });
        }
        setCode("");
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [packplatz],
  );

  useScanEmpfang(scan);

  const kartenPacken = daten.packen || [];
  const optionen = [
    { wert: "packen", titel: T.segmente.packen, anzahl: kartenPacken.length },
    { wert: "abholung", titel: T.segmente.abholung, anzahl: daten.abholung.length },
    { wert: "wareneingang", titel: T.segmente.wareneingang, anzahl: daten.wareneingang.length },
  ];

  const bestellung = (name) =>
    start(async () => {
      const r = await bestellungOeffnenAction({ bestellung: name });
      if (r.ok) oeffne(`/packtisch/${encodeURIComponent(r.lieferschein)}`);
      else zeige(r.message, { art: "fehler" });
    });

  return (
    <div className="bo-log-start" data-testid="packtisch-start">
      <form
        className="bo-log-pack__scan"
        onSubmit={(ev) => {
          ev.preventDefault();
          scan(code);
        }}
      >
        <label className="bo-log-scan" data-ergebnis={ergebnis} onAnimationEnd={() => setErgebnis("bereit")}>
          <ScanLine {...S24} />
          <input ref={feld} value={code} onChange={(e) => setCode(e.target.value)} placeholder={T.scanPlatzhalter} aria-label={T.scanPlatzhalter} data-testid="packtisch-scan" data-scan="nein" autoComplete="off" />
          {laeuft ? <span className="bo-log-scan__zuletzt">…</span> : null}
        </label>
        <button type="button" className="bo-log-knopf-l" style={{ height: 64, borderRadius: 22 }} onClick={() => setLagerOffen(true)} data-testid="lager-scan">
          <Layers {...S} />
          <span>Lager-Scan</span>
        </button>
      </form>
      {daten.hinweis ? <p className="bo-log-hinweis" data-ton="eiche">{daten.hinweis}</p> : null}
      <Segment label="Arbeitsschritt" optionen={optionen} wert={segment} onWechsel={setSegment} testid="packtisch-segment" />

      {segment === "packen" && (
        kartenPacken.length ? (
          <div className="bo-log-karten" data-testid="packtisch-karten">
            {kartenPacken.map((k) =>
              k.typ === "bestellung" ? (
                <button key={k.name} type="button" className="bo-log-karte" onClick={() => bestellung(k.name)} data-testid="karte-bestellung">
                  <span className="bo-log-karte__kunde">{k.kunde}</span>
                  <span className="bo-log-muted"><LieferartKurz wert={k.lieferart} /> · {k.ort || "–"}</span>
                  <span className="bo-log-karte__chips"><Chip ton="cognac">{T.neu}</Chip></span>
                  <span className="bo-log-mono">{k.name}</span>
                </button>
              ) : (
                <a key={k.name} href={`/packtisch/${encodeURIComponent(k.name)}`} className="bo-log-karte" data-heute={k.heute ? "true" : undefined} data-etikett={k.etikettFehlt ? "true" : undefined} data-testid="karte-lieferschein">
                  <span className="bo-log-karte__kunde">{k.kunde}</span>
                  <span className="bo-log-muted"><LieferartKurz wert={k.lieferart} /> · {k.ort || "–"}</span>
                  <span className="bo-log-karte__chips">
                    {k.heute ? <Chip ton="cognac">{T.heute}</Chip> : null}
                    {k.etikettFehlt ? <Chip ton="eiche">{T.etikettFehlt}</Chip> : null}
                    {k.zurueckgestellt ? <Chip ton="ziegel">Zurückgestellt</Chip> : null}
                    {k.zerbrechlich ? <Chip ton="messing">Glas</Chip> : null}
                    {k.tour ? <Chip ton="see">Tour</Chip> : null}
                    <Chip>{k.gepackt}/{k.positionen}</Chip>
                  </span>
                  <span className="bo-log-mono">{k.name}</span>
                </a>
              ),
            )}
          </div>
        ) : (
          <LeerKarte text={LEER.packen} />
        )
      )}
      {segment === "abholung" && (
        daten.abholung.length ? (
          <div className="bo-log-karten" data-testid="abholung-karten">
            {daten.abholung.map((k) => (
              <a key={k.name} href={`/packtisch/${encodeURIComponent(k.name)}`} className="bo-log-karte">
                <span className="bo-log-karte__kunde">{k.kunde}</span>
                <span className="bo-log-muted">{T.bereitSeit(datumKurz(k.bereitSeit))}</span>
                <span className="bo-log-karte__chips">
                  {k.bezahlt ? <Chip ton="salbei"><Check {...S16} />{T.bezahlt}</Chip> : <Chip ton="ziegel">{T.offen(EURO(k.offenCent))}</Chip>}
                  {k.ohneMail ? <Chip ton="eiche">{T.ohneMail}</Chip> : null}
                  {k.frist ? <Chip ton="ziegel">{T.fristAbgelaufen}</Chip> : null}
                </span>
                <span className="bo-log-mono">{k.name}</span>
              </a>
            ))}
          </div>
        ) : (
          <LeerKarte text={LEER.abholung} />
        )
      )}
      {segment === "wareneingang" && (
        daten.wareneingang.length ? (
          <div className="bo-log-karten">
            {daten.wareneingang.map((w) => (
              <a key={w.name} href={`/d/ph-wareneingang/${encodeURIComponent(w.name)}`} className="bo-log-karte">
                <span className="bo-log-karte__kunde">{w.lieferant || "Wareneingang"}</span>
                <span className="bo-log-muted">{w.herstellerbestellung || "–"}</span>
                <span className="bo-log-karte__chips"><Chip ton="see">{w.status === "Teilweise" ? "Teilweise" : "Offen"}</Chip></span>
                <span className="bo-log-mono">{w.name}</span>
              </a>
            ))}
          </div>
        ) : (
          <LeerKarte text={LEER.wareneingang} />
        )
      )}
      <LagerScanDialog offen={!!lagerOffen} startCode={typeof lagerOffen === "string" ? lagerOffen : ""} onSchliessen={() => setLagerOffen(false)} />
    </div>
  );
}

function LieferartKurz({ wert }) {
  const I = wert === "Abholung" ? Store : wert === "Eigenlieferung" ? Truck : wert === "Spedition" ? Container : Package;
  return (
    <span className="bo-log-lieferart">
      <I {...S16} />
      {lieferartText(wert)}
    </span>
  );
}

function LeerKarte({ text }) {
  return (
    <div className="bo-kachel" data-testid="packtisch-leer">
      <p className="flex items-center gap-3 text-[15px]">
        <span className="grid size-10 place-items-center rounded-full bg-bo-salbei-soft text-bo-salbei-text"><Check {...S} /></span>
        {text}
      </p>
    </div>
  );
}

// ================================================================= Lager-Scan ==

/** Lager-Scan (§ 6.4/§ 8.2): Bestand oder Platz scannen; „Platz zuerst“ lagert folgende Scans dorthin um. */
export function LagerScanDialog({ offen, onSchliessen, startCode = "" }) {
  const { zeige } = useToast();
  const [code, setCode] = useState("");
  const [treffer, setTreffer] = useState(null);
  const [ziel, setZiel] = useState("");
  const [laeuft, start] = useTransition();

  const pruefe = useCallback(
    (c) =>
      start(async () => {
        const r = await lagerScanAction({ code: c });
        if (!r.ok) {
          zeige(r.message || T.scan.unbekannterCode, { art: "warnung" });
          return;
        }
        if (r.art === "platz") {
          setZiel(c);
          zeige(`Platz ${r.platz} gewählt – folgende Bestände werden dorthin umgelagert`, { art: "info" });
          if (treffer?.length === 1) {
            const u = await umlagernScanAction({ lagerbestand: treffer[0].name, platzCode: c });
            zeige(u.ok ? ERFOLG.umgelagert(1) : u.message, { art: u.ok ? "ok" : "fehler" });
            setTreffer(null);
          }
          return;
        }
        if (ziel && r.bestaende.length === 1) {
          const u = await umlagernScanAction({ lagerbestand: r.bestaende[0].name, platzCode: ziel });
          zeige(u.ok ? ERFOLG.umgelagert(1) : u.message, { art: u.ok ? "ok" : "fehler" });
          return;
        }
        setTreffer(r.bestaende);
      }),
    [treffer, ziel, zeige],
  );

  useEffect(() => {
    if (offen && startCode) pruefe(startCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offen, startCode]);

  return (
    <Dialog offen={offen} onSchliessen={() => { setTreffer(null); setZiel(""); onSchliessen(); }} titel="Lager-Scan" text="Bestand scannen, dann den Platz-QR des Ziels. „Platz zuerst“: erst den Platz, dann beliebig viele Bestände." groesse="md" testid="lager-scan-dialog">
      <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) pruefe(code.trim()); setCode(""); }} className="flex flex-col gap-3">
        <label className="bo-log-scan" style={{ height: 56 }}>
          <ScanLine {...S} />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Bestand, Seriennummer oder Platz" aria-label="Lager-Scan" data-scan="nein" autoFocus />
        </label>
        {ziel ? <p className="bo-log-hinweis" data-ton="see"><MapPin {...S16} />Ziel: {ziel}</p> : null}
        {laeuft ? <p className="bo-log-cap">…</p> : null}
        {(treffer || []).map((b) => (
          <div key={b.name} className="bo-log-zeile" style={{ background: "var(--color-bo-surface-2)" }}>
            <span className="min-w-0">
              <span className="bo-log-zeile__titel block">{b.produkt_name}</span>
              <span className="bo-log-zeile__unter block">{b.lagerort} · {b.platz || "ohne Platz"} · {b.menge} Stück</span>
            </span>
            <StatusPille doctype="PH Lagerbestand" status={b.status} />
          </div>
        ))}
      </form>
    </Dialog>
  );
}

// ============================================================== Pack-Ansicht ==

/**
 * Pack-Ansicht `/packtisch/[name]` (§ 6.2) – auch im Backoffice unter `/logistik/packen/[name]` (ohne Gerät).
 * @param {{daten:object, naechster:string|null, naechsterSperrgut:string|null, naechsterPaket:string|null, geraet:object|null, benutzer:object, leitung:boolean, ohneGeraet?:boolean}} p
 */
export function PackAnsicht(p) {
  const ls = p.daten.lieferschein;
  const baender = [];
  if (p.daten.test) baender.push({ art: "training", text: "Versand im Testmodus – Etiketten sind Muster" });
  if (p.ohneGeraet) baender.push({ art: "see", text: T.keinGeraet });
  if (p.daten.zweite) baender.push({ art: "see", text: T.zweitePerson(String(p.daten.zweite.wer).split("@")[0], String(p.daten.zweite.seit).slice(11, 16)) });
  const istAbholung = ls.lieferart === "Abholung" && ls.status === "Gepackt";
  return (
    <KioskShell titel={T.titel} geraet={p.geraet} benutzer={p.benutzer} kontext={ls.name} hilfe={HILFE} zurueckHref={p.ohneGeraet ? `/logistik/lieferscheine/${encodeURIComponent(ls.name)}` : "/packtisch"} baender={baender} onScan={sendeScan}
      kopfSlot={<>{istAbholung ? null : <ModusSegment ls={ls} paket={p.naechsterPaket} sperrgut={p.naechsterSperrgut} />}<TonPille /></>}>
      {istAbholung ? <AbholAnsicht {...p} /> : <PackInhalt {...p} />}
    </KioskShell>
  );
}

function ModusSegment({ ls, paket, sperrgut }) {
  const router = useRouter();
  const wert = ls.lieferart === "Versand" ? "paket" : "sperrgut";
  const ziel = wert === "paket" ? sperrgut : paket;
  return (
    <Segment
      label="Auftragsart"
      wert={wert}
      onWechsel={(w) => {
        if (w !== wert && ziel) router.push(`/packtisch/${encodeURIComponent(ziel)}`);
      }}
      optionen={[
        { wert: "paket", titel: T.modus.paket, deaktiviert: wert !== "paket" && !paket },
        { wert: "sperrgut", titel: T.modus.sperrgut, deaktiviert: wert !== "sperrgut" && !sperrgut },
      ]}
      testid="packtisch-modus"
    />
  );
}

function PackInhalt({ daten, naechster }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { ansagen } = useKiosk();
  const { starte } = useVerzoegerterCommit();
  const ton = useTon();
  const ls = daten.lieferschein;
  const sperrgut = ls.lieferart !== "Versand";
  const [positionen, setPositionen] = useState(daten.positionen);
  const [aktivId, setAktivId] = useState(null);
  const [menge, setMenge] = useState(1);
  const [code, setCode] = useState("");
  const [zuletzt, setZuletzt] = useState("");
  const [ergebnis, setErgebnis] = useState("bereit");
  const [meldung, setMeldung] = useState(null);
  const [frage, setFrage] = useState(null);
  const [pakete, setPakete] = useState(() => (daten.pakete || []).map((pk, i) => ({ ...pk, paket_nr: pk.paket_nr || i + 1 })));
  const [jetztPaket, setJetztPaket] = useState(() => (daten.pakete || []).length || 1);
  const [etikettOffen, setEtikettOffen] = useState(false);
  const [problem, setProblem] = useState(null);
  const [zurueck, setZurueck] = useState(false);
  const [fertig, setFertig] = useState(null);
  const [hinweiseOk, setHinweiseOk] = useState(!!Number(ls.packhinweise_bestaetigt));
  const [, start] = useTransition();
  const feld = useRef(null);
  const automatik = useRef(false);
  const speichernTimer = useRef(null);

  const f = packFortschritt(positionen);
  const sortiert = useMemo(() => sortierePositionen(positionen, aktivId), [positionen, aktivId]);
  const primaer = primaerAktion(ls);
  const entwurf = ls.status === "Entwurf";
  const zurueckgestellt = !!Number(ls.zurueckgestellt);

  // ------------------------------------------------------------- Abschluss --
  const abschliessen = useCallback((fertigVorgabe) => {
    if (!(fertigVorgabe === true || f.alleFertig)) {
      zeige(T.nochPositionen(f.offen), { art: "warnung" });
      return;
    }
    if (primaer.id === "verpacken") {
      setEtikettOffen(true);
      return;
    }
    start(async () => {
      const r = await gepacktPlanenAction({ lieferschein: ls.name });
      if (!r.ok) {
        zeige(r.message, { art: "fehler" });
        return;
      }
      const text = primaer.id === "abholbereit" ? (r.ohneMail ? `${T.gepacktToast} · ${T.abholbereitOhneMail}` : T.abholbereitToast(r.kunde)) : T.gepacktToast;
      starte(text, { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: `Gepackt ${ls.name}`, onVerworfen: () => setFertig(null) });
      setFertig({ art: "gepackt" });
      ansagen(text);
    });
  }, [f.alleFertig, f.offen, primaer.id, ls.name, starte, zeige, ansagen]);

  // Automatik nach dem letzten Scan (E1): Gepackt verzögert bzw. Etikett-Bildschirm – ausgelöst vom Ereignis, nicht vom Render.
  const automatikStarten = (neu) => {
    if (!entwurf || zurueckgestellt || automatik.current || !packFortschritt(neu).alleFertig) return;
    automatik.current = true;
    if (primaer.id !== "verpacken") return abschliessen(true);
    if (pakete.length) return setEtikettOffen(true);
    start(async () => {
      const r = await paketeVorschlagenAction({ lieferschein: ls.name });
      if (r.ok && r.pakete) setPakete(r.pakete);
      setEtikettOffen(true);
    });
  };

  // ----------------------------------------------------------------- Scan --
  const scan = (roh, bestaetigt = false, anzahlVorgabe) => {
      const c = String(roh || "").trim();
      if (!c) return;
      setZuletzt(c);
      const e = erkenneLogistikCode(c);
      if (e.art === "lieferschein" && e.wert !== ls.name) {
        setMeldung({ ton: "eiche", titel: T.scan.anderer(e.wert), aktion: { titel: "Wechseln", href: `/packtisch/${encodeURIComponent(e.wert)}` } });
        return;
      }
      if (!entwurf) {
        setMeldung({ ton: "eiche", titel: "Bereits gepackt – Scannen nur im Entwurf." });
        return;
      }
      const anzahl = anzahlVorgabe ?? menge;
      const r = wendeScanAn(positionen, c, anzahl, { mengenBestaetigen: daten.packplatz.mengenBestaetigen, bestaetigt });
      if (r.ergebnis === "unbekannt") {
        setErgebnis("unbekannt");
        setMeldung({ ton: "ziegel", titel: T.scan.fehlerTitel, text: T.scan.unbekannt(c, ls.name), alert: true });
        ton.spiele("fehler");
        ansagen(T.scan.unbekannt(c, ls.name));
        return;
      }
      if (r.ergebnis === "bestaetigen") {
        setFrage({ code: c, anzahl: r.anzahl, titel: r.position.beschreibung });
        return;
      }
      if (r.ergebnis === "vollstaendig" || r.ergebnis === "zu_viel") {
        setErgebnis("doppelt");
        const text = r.ergebnis === "vollstaendig" ? T.scan.vollstaendig(r.position.beschreibung, `${r.position.menge_gepackt}/${r.position.menge}`) : T.scan.zuViel(mengePruefen(r.position, anzahl).offen);
        setMeldung({ ton: "eiche", titel: text });
        ton.spiele("fehler");
        ansagen(text);
        return;
      }
      const vorher = standAus(positionen);
      setPositionen(r.positionen);
      setAktivId(posId(r.position));
      setErgebnis("erkannt");
      setMeldung(null);
      setMenge(1);
      ansagen(T.scan.erkannt(r.position.beschreibung));
      start(async () => {
        const a = await scanAction({ lieferschein: ls.name, code: c, anzahl, bestaetigt: true, packplatz: daten.packplatz.name });
        if (!a.ok || a.ergebnis !== "erkannt") {
          setPositionen((alt) => Object.entries(vorher).reduce((acc, [id, m]) => setzeMenge(acc, id, m), alt));
          zeige(a.message || T.scan.unbekannterCode, { art: "fehler" });
          return;
        }
        automatikStarten(r.positionen);
        zeige(T.scan.erkannt(r.position.beschreibung), {
          art: "ok",
          aktion: {
            titel: DIALOG.rueckgaengig,
            onClick: () => {
              setPositionen((alt) => Object.entries(vorher).reduce((acc, [id, m]) => setzeMenge(acc, id, m), alt));
              automatik.current = false;
              positionStandAction({ lieferschein: ls.name, stand: vorher });
            },
          },
        });
      });
  };

  const hand = (pos) =>
    start(async () => {
      const vorher = standAus(positionen);
      const neu = setzeMenge(positionen, posId(pos), pos.menge);
      setPositionen(neu);
      setAktivId(posId(pos));
      const r = await handBestaetigenAction({ lieferschein: ls.name, position: posId(pos) });
      if (!r.ok) {
        setPositionen((alt) => Object.entries(vorher).reduce((acc, [id, m]) => setzeMenge(acc, id, m), alt));
        zeige(r.message, { art: "fehler" });
        return;
      }
      automatikStarten(neu);
      zeige(`Bestätigt: ${pos.beschreibung}`, { art: "ok", aktion: { titel: DIALOG.rueckgaengig, onClick: () => { automatik.current = false; setPositionen((alt) => setzeMenge(alt, posId(pos), vorher[posId(pos)])); positionStandAction({ lieferschein: ls.name, stand: { [posId(pos)]: vorher[posId(pos)] } }); } } });
    });

  const minus = (pos) =>
    start(async () => {
      const alt = Number(pos.menge_gepackt || 0);
      if (!alt) return;
      setPositionen((x) => setzeMenge(x, posId(pos), alt - 1));
      automatik.current = false;
      const r = await positionMinusAction({ lieferschein: ls.name, position: posId(pos) });
      if (!r.ok) {
        setPositionen((x) => setzeMenge(x, posId(pos), alt));
        zeige(r.message, { art: "fehler" });
      } else zeige(`−1: ${pos.beschreibung}`, { art: "info", aktion: { titel: DIALOG.rueckgaengig, onClick: () => { setPositionen((x) => setzeMenge(x, posId(pos), alt)); positionStandAction({ lieferschein: ls.name, stand: { [posId(pos)]: alt } }); } } });
    });

  // --------------------------------------------------------------- Pakete --
  const speichern = (liste) => {
    clearTimeout(speichernTimer.current);
    speichernTimer.current = setTimeout(async () => {
      const r = await paketeSpeichernAction({ lieferschein: ls.name, pakete: liste, packplatz: daten.packplatz.name });
      if (!r.ok) zeige(r.message, { art: "fehler" });
    }, 600);
  };
  const paketAendern = (nr, werte) => {
    setPakete((alt) => {
      const neu = alt.map((pk) => (pk.paket_nr === nr ? { ...pk, ...werte } : pk));
      speichern(neu);
      return neu;
    });
  };
  const VORZUG = sperrgut ? ["palette", "karton-l"] : ["karton-m", "karton-l", "versandtuete"];
  const profile = (daten.profile || [])
    .filter((pr) => (sperrgut ? ["moebel"].includes(pr.familie) || pr.name === "karton-l" : pr.familie !== "moebel" && !Number(pr.versand_gesperrt)))
    .sort((a, b) => ((VORZUG.indexOf(a.name) + 1 || 99) - (VORZUG.indexOf(b.name) + 1 || 99)));
  const paketNeu = () => {
    setPakete((alt) => {
      const pr = profile.find((x) => Number(x.standard)) || profile[0] || {};
      const neu = [...alt, { paket_nr: alt.length + 1, paketprofil: pr.name || "", art: sperrgut ? "Sperrgut" : "Paket", laenge_cm: pr.laenge_cm, breite_cm: pr.breite_cm, hoehe_cm: pr.hoehe_cm, gewicht_g: 0, gewicht_vorschlag_g: pr.gewicht_g || 0 }];
      setJetztPaket(neu.length);
      speichern(neu);
      return neu;
    });
  };
  const paketSchliessen = () => {
    if (jetztPaket < pakete.length) setJetztPaket(jetztPaket + 1);
    else paketNeu();
  };

  // ------------------------------------------------------------- Tasten --
  const kuerzel = {
    F2: () => feld.current?.focus(),
    F3: () => naechster && router.push(`/packtisch/${encodeURIComponent(naechster)}`),
    F4: () => !sperrgut && f.alleFertig && setEtikettOffen(true),
    F6: paketSchliessen,
    F7: paketNeu,
    F9: () => setProblem("Fehlt"),
    F12: () => abschliessen(),
    "ctrl+enter": () => abschliessen(),
  };

  const aktivPaket = pakete.find((x) => x.paket_nr === jetztPaket) || pakete[pakete.length - 1];
  const inhalt = Math.max(0, f.stueck);

  return (
    <PackRahmen kuerzel={kuerzel} onScan={(c) => scan(c)}>
      <div className="bo-log-pack" data-testid="pack-ansicht" data-status={ls.status}>
        <form className="bo-log-pack__scan" onSubmit={(ev) => { ev.preventDefault(); scan(code); setCode(""); }}>
          <label className="bo-log-scan bo-scan" data-ergebnis={ergebnis} onAnimationEnd={() => setErgebnis("bereit")}>
            <ScanLine {...S24} />
            <input ref={feld} value={code} onChange={(e) => setCode(e.target.value)} placeholder={T.scanPlatzhalterPack} aria-label="Scanfeld" data-testid="pack-scan" data-scan="nein" autoComplete="off" />
            {zuletzt ? <span className="bo-log-scan__zuletzt">{T.zuletzt}: <b>{positionen.find((x) => posId(x) === aktivId)?.beschreibung || zuletzt}</b></span> : null}
          </label>
          <div className="bo-log-kapsel" role="group" aria-label="Menge vor dem Scan">
            <span className="bo-log-kapsel__l">{T.menge}</span>
            <button type="button" className="bo-log-rund48" onClick={() => setMenge((m) => Math.max(1, m - 1))} aria-label={T.mengeWeniger}><Minus {...S16} /></button>
            <span className="bo-log-zahl" data-testid="pack-menge">{menge}</span>
            <button type="button" className="bo-log-rund48" onClick={() => setMenge((m) => Math.min(99, m + 1))} aria-label={T.mengeMehr}><Plus {...S16} /></button>
          </div>
          <div className="bo-log-fortschritt" aria-live="polite" data-testid="pack-fortschritt">
            <Ring wert={f.fertig} gesamt={f.positionen || 1} />
            <span>
              <b className="bo-log-zahl">{T.vonPositionen(f.fertig, f.positionen)}</b>
              <small>{T.stueck(f.stueck, f.stueckGes)}</small>
            </span>
          </div>
        </form>

        <div className="bo-log-pack__body">
          <aside className="bo-log-pack__spalte" aria-label="Auftrag">
            <p className="bo-log-cap">{T.quelle[daten.quelle.art]}{daten.quelle.nr ? ` · ${daten.quelle.nr}` : ""}</p>
            <h1 className="bo-log-pack__nr">{ls.name}</h1>
            <StatusPille doctype="PH Lieferschein" status={ls.status} doc={ls} />
            <div className="bo-log-pack__kasten">
              {sperrgut ? <Truck {...S} /> : <Package {...S} />}
              <span>
                <b>{daten.tour ? `Tour · ${datumKurz(daten.tour.datum)}` : lieferartText(ls.lieferart)}</b>
                <small>{daten.quelle.art === "shop" ? (daten.quelle.bezahlt ? "bezahlt" : "Zahlung offen") : daten.zahlung.gesperrt ? daten.zahlung.text : ls.kunde_name}</small>
              </span>
            </div>
            <div className="bo-log-pack__adr">
              <MapPin {...S16} />
              <address className="bo-log-adresse">
                <span className="block">{ls.liefer_name || ls.kunde_name}</span>
                {ls.liefer_firma ? <span className="block">{ls.liefer_firma}</span> : null}
                <span className="block">{[ls.liefer_strasse, ls.liefer_hausnr].filter(Boolean).join(" ") || "–"}</span>
                <span className="block">{[ls.liefer_plz, ls.liefer_ort].filter(Boolean).join(" ")}</span>
                <span className="block">{ls.liefer_land === "AT" ? "Österreich" : ls.liefer_land === "DE" ? "Deutschland" : ls.liefer_land === "CH" ? "Schweiz" : ls.liefer_land}</span>
              </address>
            </div>
            {daten.hinweise.length ? (
              <div className="flex flex-col gap-2" data-testid="packhinweise">
                <p className="bo-log-cap">{T.packhinweise}</p>
                {daten.hinweise.map((h) => {
                  const I = HINWEIS_ICON[h.icon] || AlertTriangle;
                  return (
                    <p key={h.id} className="bo-log-hinweis" data-ton={h.ton}>
                      <I {...S16} />
                      <span>{h.text}</span>
                    </p>
                  );
                })}
                {daten.hinweise.some((h) => h.bestaetigen) && !hinweiseOk ? (
                  <Knopf size="s" icon="Check" onClick={() => start(async () => { const r = await hinweiseBestaetigenAction({ lieferschein: ls.name }); if (r.ok) setHinweiseOk(true); })}>{T.hinweiseBestaetigen}</Knopf>
                ) : null}
              </div>
            ) : null}
          </aside>

          <section className="bo-log-pack__spalte" aria-label={T.positionen} style={{ padding: "18px 12px 12px" }}>
            <header className="bo-log-pack__kopf">
              <h2>{T.positionen}</h2>
              <small>{T.erledigteUnten}</small>
            </header>
            {meldung ? (
              <div className="bo-log-fehlscan" data-ton={meldung.ton === "ziegel" ? undefined : meldung.ton} role={meldung.alert ? "alert" : "status"} data-testid="scan-meldung">
                <span className="bo-log-fehlscan__ico"><CircleAlert {...S24} /></span>
                <span>
                  <b>{meldung.titel}</b>
                  {meldung.text ? <span className="block">{meldung.text}</span> : null}
                </span>
                {meldung.aktion ? (
                  <Knopf size="s" href={meldung.aktion.href}>{meldung.aktion.titel}</Knopf>
                ) : meldung.alert ? (
                  <span className="bo-log-fehlscan__ton">{ton.an ? <Volume2 {...S16} /> : <VolumeX {...S16} />}{T.scan.fehlerton}</span>
                ) : null}
              </div>
            ) : null}
            <ol className="bo-log-pz-liste" data-testid="pack-positionen">
              {sortiert.map((pos) => (
                <PositionZeile key={posId(pos)} pos={pos} zustand={zeilenZustand(pos, aktivId)} entwurf={entwurf} onHand={() => hand(pos)} onMinus={() => minus(pos)} onPlus={() => scan(pos.ean || pos.seriennummer || pos.slug || pos.produkt, false, 1)} />
              ))}
            </ol>
            {!positionen.length ? <p className="bo-log-cap p-3">Keine Positionen.</p> : null}
          </section>

          <aside className="bo-log-pack__spalte" aria-label={sperrgut ? T.packstuecke : T.pakete}>
            <header className="bo-log-pack__kopf">
              <h2>{sperrgut ? T.packstuecke : T.pakete}</h2>
              <button type="button" className="bo-log-rund48" onClick={paketNeu} aria-label={T.paketHinzu} data-testid="paket-neu"><Plus {...S16} /></button>
            </header>
            {aktivPaket && profile.length ? (
              <Segment label="Packmittel" breit groesse="s" wert={aktivPaket.paketprofil || ""} onWechsel={(w) => { const pr = profile.find((x) => x.name === w) || {}; paketAendern(aktivPaket.paket_nr, { paketprofil: w, laenge_cm: pr.laenge_cm, breite_cm: pr.breite_cm, hoehe_cm: pr.hoehe_cm, gewicht_vorschlag_g: pr.gewicht_g || 0 }); }}
                optionen={profile.slice(0, 3).map((pr) => ({ wert: pr.name, titel: pr.bezeichnung || pr.name }))} testid="packmittel" />
            ) : null}
            <ul className="flex flex-col gap-2">
              {pakete.map((pk) => (
                <PaketKarte key={pk.paket_nr} pk={pk} jetzt={pk.paket_nr === (aktivPaket?.paket_nr)} profil={(daten.profile || []).find((x) => x.name === pk.paketprofil)} inhalt={pakete.length === 1 ? inhalt : null} packplatz={daten.packplatz} onGewicht={(g) => paketAendern(pk.paket_nr, { gewicht_g: g })} onWaehlen={() => setJetztPaket(pk.paket_nr)} />
              ))}
            </ul>
            <button type="button" className="bo-log-pk-neu" onClick={paketNeu}><Plus {...S16} />{sperrgut ? T.packstueckNeu : T.paketNeu}</button>
            <div className="bo-log-versand">
              <p className="bo-log-cap">{sperrgut ? T.uebergabe : T.versandUeber}</p>
              <dl>
                {(sperrgut
                  ? [[T.tourZeile, daten.tour ? `${daten.tour.name.replace(/^PH-TOUR-\d{4}-/, "")} · ${datumKurz(daten.tour.datum)}` : "–"], [T.fahrer, daten.tour?.fahrerName || "–"], [T.abfahrt, daten.tour?.start_zeit ? `${String(daten.tour.start_zeit).slice(0, 5)} ${daten.tour.start_lagerort || ""}` : "–"]]
                  : [[T.dienst, daten.sendungen[0]?.service_name || "Empfehlung"], [T.etikett, T.nachGewicht], ["Gewicht", kgText(pakete.reduce((s, x) => s + Number(x.gewicht_g || 0), 0))]]
                ).map(([k, v]) => (
                  <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        <footer className="bo-log-pack__fuss">
          <div className="bo-log-problem" role="group" aria-label="Problem melden">
            <span className="bo-log-problem__l"><AlertTriangle {...S16} />{T.problem}</span>
            {Object.entries(T.problemGruende).map(([wert, titel]) => (
              <button key={wert} type="button" onClick={() => setProblem(wert)} data-testid={`problem-${wert}`}>{titel}</button>
            ))}
          </div>
          {zurueckgestellt ? (
            <button type="button" className="bo-log-knopf-l" disabled title={ls.zurueckgestellt_grund}><PauseCircle {...S} /><span>Zurückgestellt</span></button>
          ) : (
            <button type="button" className="bo-log-knopf-l" onClick={() => setZurueck(true)} disabled={!entwurf}><PauseCircle {...S} /><span>{T.zurueckstellen}</span></button>
          )}
          <span className="bo-log-luecke" />
          <a className="bo-log-knopf-l" href={druckHref("PH Lieferschein", ls.name, "PH Lieferschein Standard")} target="_blank" rel="noreferrer"><FileText {...S} /><span>{T.lieferschein}</span></a>
          {sperrgut ? (
            <a className="bo-log-knopf-l" href={druckHref("PH Lieferschein", ls.name, "PH Lieferschein Packliste")} target="_blank" rel="noreferrer" title="Packstück-Etikett (NVE) folgt – bis dahin Packliste">
              <Tag {...S} /><span>Packliste</span>
            </a>
          ) : (
            <button type="button" className="bo-log-knopf-l" onClick={() => setEtikettOffen(true)} disabled={!f.alleFertig || !entwurf}><Printer {...S} /><span>{T.etikettKnopf}</span></button>
          )}
          <button type="button" className="bo-log-go" data-primaer="" aria-disabled={!f.alleFertig || !entwurf ? "true" : undefined} aria-describedby="pack-go-hinweis" onClick={entwurf ? () => abschliessen() : undefined} data-testid="pack-abschluss">
            <PackageCheck {...S24} />
            <span>
              {entwurf ? primaer.titel : "Gepackt"}
              <small id="pack-go-hinweis">{!entwurf ? "erledigt" : !f.alleFertig ? T.nochPositionen(f.offen) : primaer.id === "verpacken" ? T.hinweisVersand : primaer.id === "abholbereit" ? T.hinweisAbholung : T.hinweisTour}</small>
            </span>
          </button>
          <Menue label={T.weitere} ausloeser={(props) => <button type="button" {...props} className="bo-log-rund48" style={{ width: 52, height: 52, background: "var(--color-bo-surface)", boxShadow: "var(--bo-sh-btn)" }} aria-label={T.weitere}><Ellipsis {...S} /></button>}>
            <MenuePunkt icon="ArrowRight" href={naechster ? `/packtisch/${encodeURIComponent(naechster)}` : undefined} deaktiviert={!naechster} grund="Kein weiterer Lieferschein">{T.naechster}</MenuePunkt>
            <MenuePunkt icon="Rows3" href={druckHref("PH Lieferschein", ls.name, "PH Lieferschein Packliste")}>Packliste drucken</MenuePunkt>
            <MenuePunkt icon="Package" onWaehlen={() => start(async () => { const r = await paketeVorschlagenAction({ lieferschein: ls.name }); if (r.ok && r.pakete) setPakete(r.pakete); else if (!r.ok) zeige(r.message, { art: "fehler" }); })} deaktiviert={!entwurf} grund="Nur im Entwurf">Pakete vorschlagen</MenuePunkt>
            <MenuePunkt icon="Layers" onWaehlen={() => start(async () => { const r = await teillieferungAction({ lieferschein: ls.name }); if (r.ok) { zeige(r.rest ? `Rest als ${r.rest} angelegt` : "Nichts aufzuteilen", { art: "ok" }); router.refresh(); } else zeige(r.message, { art: "fehler" }); })} deaktiviert={!entwurf || f.stueck === 0 || f.alleFertig} grund="Erst gescannte Positionen">{T.teillieferung}</MenuePunkt>
            <MenueTrenner />
            <MenuePunkt icon="FileText" href={`/logistik/lieferscheine/${encodeURIComponent(ls.name)}`}>Zur Lieferschein-Akte</MenuePunkt>
          </Menue>
        </footer>
      </div>

      <Bestaetigen offen={!!frage} titel={frage ? T.scan.bestaetigen(frage.anzahl, frage.titel) : ""} bestaetigen="Packen" onAbbrechen={() => setFrage(null)} onBestaetigen={() => { const q = frage; setFrage(null); scan(q.code, true, q.anzahl); }} />
      <EtikettDialog offen={etikettOffen} onSchliessen={() => setEtikettOffen(false)} ls={ls} pakete={pakete} packplatz={daten.packplatz} onFertig={(erg) => { setEtikettOffen(false); setFertig({ art: "etikett", ...erg }); }} />
      <ProblemDialog key={problem || "zu"} offen={!!problem} grund={problem} lieferschein={ls.name} onSchliessen={() => setProblem(null)} />
      <ZurueckstellenDialog offen={zurueck} lieferschein={ls.name} onSchliessen={(ok) => { setZurueck(false); if (ok) router.push("/packtisch"); }} />
      <Dialog offen={!!fertig} onSchliessen={() => setFertig(null)} titel=" " groesse="md" testid="pack-ergebnis">
        {fertig ? (
          <ErgebnisKarte
            ohneKachel
            titel={fertig.art === "etikett" ? ETIKETT.ergebnis(fertig.sendung?.carrier || "", fertig.sendung?.tracking_nr || "") : primaer.id === "abholbereit" ? "Abholbereit gemeldet" : `${ls.name} gepackt`}
            unter={fertig.art === "etikett" ? `${ls.kunde_name} · ${lieferartText(ls.lieferart)}` : "Rückgängig ist 8 Sekunden lang im Hinweis unten möglich."}
            dokumente={[{ titel: T.lieferschein, href: druckHref("PH Lieferschein", ls.name, "PH Lieferschein Standard"), icon: "FileText" }]}
            weiter={naechster ? { titel: `${T.naechster} ›`, href: `/packtisch/${encodeURIComponent(naechster)}`, kuerzel: "F3" } : { titel: T.zurueck, href: "/packtisch" }}
          />
        ) : null}
      </Dialog>
    </PackRahmen>
  );
}

/** Registriert die F-Tasten und den globalen Scanner der Pack-Ansicht über die umgebende KioskShell. */
function PackRahmen({ kuerzel, onScan, children }) {
  useScanEmpfang(onScan);
  const taste = useEffectEvent((e) => {
    const key = (e.ctrlKey || e.metaKey) && e.key === "Enter" ? "ctrl+enter" : e.key;
    const fn = kuerzel[key];
    if (!fn || !/^Fd+$|^ctrl+enter$/.test(key)) return;
    e.preventDefault();
    fn(e);
  });
  useEffect(() => {
    const h = (e) => taste(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return children;
}

function PositionZeile({ pos, zustand, entwurf, onHand, onMinus, onPlus }) {
  return (
    <li className="bo-log-pz" data-z={zustand} data-testid="pack-position" aria-describedby={undefined}>
      <span className="bo-log-pz__bild">
        {pos.bild ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pos.bild} alt="" loading="lazy" />
        ) : (
          <Layers {...S24} />
        )}
      </span>
      <span className="bo-log-pz__txt">
        <b>{pos.beschreibung}</b>
        <span>
          {[pos.marke, pos.ean ? pos.ean : pos.seriennummer ? `SN ${pos.seriennummer}` : T.zeile.ohneBarcode].filter(Boolean).join(" · ")}
        </span>
        {pos.entnahme ? <span className="bo-log-pz__entnahme">{pos.entnahme.mehrdeutig ? "Entnahme wählen" : `Entnahme: ${pos.entnahme.text}`}</span> : null}
      </span>
      <span className="bo-log-pz__menge" role="group" aria-label={`${pos.menge_gepackt || 0} von ${pos.menge} gepackt`}>
        {entwurf && Number(pos.menge_gepackt) > 0 ? <button type="button" className="bo-log-rund48" onClick={onMinus} aria-label={`Eins weniger: ${pos.beschreibung}`}><Minus {...S16} /></button> : null}
        <span><b>{pos.menge_gepackt || 0}</b> / {pos.menge}</span>
        {entwurf && zustand !== "fertig" && zustand !== "manuell" ? <button type="button" className="bo-log-rund48" onClick={onPlus} aria-label={`Eins mehr: ${pos.beschreibung}`}><Plus {...S16} /></button> : null}
      </span>
      <span className="bo-log-pz__st">
        {zustand === "fertig" && <span className="bo-log-pz__badge"><Check {...S16} />{T.zeile.fertig}</span>}
        {zustand === "aktiv" && <span className="bo-log-pz__badge"><ScanLine {...S16} />{T.zeile.aktiv}</span>}
        {zustand === "manuell" && entwurf && <button type="button" className="bo-log-pz__knopf" onClick={onHand} data-testid="hand-bestaetigen"><Hand {...S16} />{T.zeile.manuell}</button>}
        {zustand === "offen" && <span className="bo-log-pz__badge">{T.zeile.offen}</span>}
      </span>
    </li>
  );
}

function PaketKarte({ pk, jetzt, profil, inhalt, packplatz, onGewicht, onWaehlen }) {
  const [text, setText] = useState(pk.gewicht_g ? String(pk.gewicht_g / 1000).replace(".", ",") : "");
  const g = Math.round(Number(String(text).replace(",", ".")) * 1000) || 0;
  const vorschlag = Number(pk.gewicht_vorschlag_g || 0) || null;
  const p = gewichtPlausibel(g, vorschlag, { toleranzPromille: packplatz.toleranzPromille, toleranzMinG: packplatz.toleranzMinG, maxG: profil?.gewicht_max_g || null });
  const kg = (x) => new Intl.NumberFormat("de-AT", { maximumFractionDigits: 1 }).format(x / 1000);
  return (
    <li className="bo-log-pk" data-jetzt={jetzt ? "true" : undefined} data-testid="paket">
      <button type="button" className="bo-log-pk__kopf text-left" onClick={onWaehlen} aria-pressed={jetzt}>
        <span className="bo-log-pk__nr">{pk.paket_nr}</span>
        <span className="min-w-0">
          <b className="block truncate">{profil?.bezeichnung || pk.paketprofil || pk.art || "Paket"}{profil && !Number(profil.geprueft) ? " · Schätzung" : ""}</b>
          <small>{pk.laenge_cm ? `${pk.laenge_cm} × ${pk.breite_cm} × ${pk.hoehe_cm} cm` : "Maße offen"}</small>
        </span>
        <span className="bo-log-pk__st">{jetzt ? T.inArbeit : T.geschlossen}</span>
      </button>
      <label className="bo-log-gewicht">
        <span>{T.gewicht}</span>
        <input inputMode="decimal" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onGewicht(g)} placeholder={T.gewichtEintragen} aria-label={`Gewicht Paket ${pk.paket_nr} in kg`} data-scan="feld" />
        <span>kg</span>
      </label>
      <p className="bo-log-plaus" data-ok={p.ok ? "true" : undefined}>
        {p.ok ? <Check {...S16} /> : <AlertTriangle {...S16} />}
        {p.ok ? (p.von !== null ? T.plausibel(kg(p.von), kg(p.bis)) : "eingetragen") : p.grund === "abweichung" ? T.gewichtAbweichung(kg(p.von), kg(p.bis)) : T.gewichtPflicht(p.von !== null ? kg(p.von) : null, p.bis !== null ? kg(p.bis) : null)}
      </p>
      {inhalt !== null ? <p className="bo-log-cap">{T.inhalt(inhalt)}</p> : pk.inhalt ? <p className="bo-log-cap">{pk.inhalt}</p> : null}
    </li>
  );
}

// ================================================================== Etikett ==

/** Etikett-Bildschirm (§ 5.4, E2): ein Bildschirm, Empfehlung vorausgewählt, „Buchen und drucken“. */
export function EtikettDialog(props) {
  const { offen, onSchliessen, ls, pakete = [] } = props;
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel={ETIKETT.titel(ls.kunde_name, ls.liefer_land || "AT")} text={ETIKETT.zusammenfassung(pakete.length || 1, kgText(pakete.reduce((s, p) => s + Number(p.gewicht_g || 0), 0)).replace(" kg", ""), Number(ls.versichern) ? EURO(ls.versicherungswert_cent) : null)} groesse="lg" testid="etikett-dialog">
      {offen ? <EtikettInhalt {...props} /> : null}
    </Dialog>
  );
}

function EtikettInhalt({ onSchliessen, ls, pakete = [], packplatz, onFertig, nurEtikett = false }) {
  const { zeige } = useToast();
  const [laden, setLaden] = useState(true);
  const [daten, setDaten] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [wahl, setWahl] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const [frage, setFrage] = useState(false);

  useEffect(() => {
    let aktiv = true;
    tarifeAction({ lieferschein: ls.name }).then((r) => {
      if (!aktiv) return;
      setLaden(false);
      if (!r.ok) return setFehler(r.message);
      setDaten(r.ergebnis);
      setWahl((r.ergebnis.tarife || []).find((t) => Number(t.empfohlen))?.id || r.ergebnis.tarife?.[0]?.id || null);
    });
    return () => {
      aktiv = false;
    };
  }, [ls.name]);

  const gewichtFehlt = pakete.length === 0 || pakete.some((p) => !(Number(p.gewicht_g) > 0));
  const grund = daten?.warnung || (gewichtFehlt ? "Gewicht je Paket eintragen – Pflicht vor dem Etikett" : null);
  const tarif = (daten?.tarife || []).find((t) => t.id === wahl);

  const buchen = async (bestaetigt = false) => {
    if (laeuft || !wahl) return;
    setLaeuft(true);
    const r = nurEtikett ? await etikettAction({ lieferschein: ls.name, tarifId: wahl, bestaetigt }) : await verpackenAction({ lieferschein: ls.name, tarifId: wahl, bestaetigt, packplatz: packplatz?.name });
    setLaeuft(false);
    if (!r.ok && r.bestaetigen) return setFrage(true);
    if (!r.ok) {
      zeige(r.message, { art: "fehler" });
      return;
    }
    onFertig?.({ sendung: r.ergebnis?.sendung || r.sendung });
  };

  return (
    <div className="flex flex-col gap-3">
      {daten?.test ? <p className="bo-log-hinweis" data-ton="see">{ETIKETT.testmodus}</p> : null}
      {Number(ls.zerbrechlich) ? <p className="bo-log-hinweis" data-ton="eiche"><Wine {...S16} /><span>{ETIKETT.glas}</span></p> : null}
      {laden ? <p className="bo-log-cap">Tarife werden geladen …</p> : null}
      {fehler ? <p className="bo-log-hinweis" data-ton="ziegel"><CircleAlert {...S16} /><span>{fehler}</span></p> : null}
      {daten?.warnung ? <p className="bo-log-hinweis" data-ton="ziegel"><CircleAlert {...S16} /><span>{daten.warnung}</span></p> : null}
      {daten?.tarife?.length ? (
        <div className="bo-log-tarife" role="radiogroup" aria-label="Tarif">
          {daten.tarife.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={wahl === t.id} className="bo-log-tarif" onClick={() => setWahl(t.id)} data-testid="tarif">
              <span className="bo-log-cap">{Number(t.empfohlen) ? ETIKETT.empfehlung : " "}</span>
              <b>{t.service}</b>
              <span className="bo-log-muted">{t.laufzeit}</span>
              <span className="preis">{EURO(t.brutto_cent)}</span>
            </button>
          ))}
        </div>
      ) : !laden && !fehler ? <p className="bo-log-cap">{ETIKETT.keineTarife}</p> : null}
      {tarif && daten?.berechnet_cent !== undefined ? (
        <p className="bo-log-cap">{ETIKETT.berechnet(EURO(daten.berechnet_cent), EURO(daten.berechnet_cent - tarif.brutto_cent))}{daten.gueltig_bis ? ` · ${ETIKETT.gueltigBis(String(daten.gueltig_bis).slice(11, 16))}` : ""}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <Knopf variant="ghost" onClick={onSchliessen}>{DIALOG.abbrechen}</Knopf>
        <Knopf variant="primary" icon="Printer" laedt={laeuft} disabled={!!grund || !wahl || laden} grund={grund || undefined} onClick={() => buchen(false)} kuerzel="F12" data-testid="etikett-buchen">{laeuft ? ETIKETT.buchenLaeuft : ETIKETT.buchen}</Knopf>
      </div>
      <Bestaetigen offen={frage} titel={tarif ? ETIKETT.bestaetigen(tarif.service, EURO(tarif.brutto_cent)) : ""} bestaetigen="Kostenpflichtig buchen" onAbbrechen={() => setFrage(false)} onBestaetigen={() => { setFrage(false); buchen(true); }} />
    </div>
  );
}

// ================================================================== Problem ==

const PROBLEM_GRUENDE = [["Beschaedigt", "Beschädigt"], ["Fehlt", "Fehlt"], ["Falscher Artikel", "Falscher Artikel"], ["Adresse unklar", "Adresse unklar"], ["Sonstiges", "Sonstiges"]];

export function ProblemDialog({ offen, grund: startGrund, lieferschein, onSchliessen }) {
  const { zeige } = useToast();
  const [grund, setGrund] = useState(startGrund || "Fehlt");
  const [text, setText] = useState("");
  const [laeuft, start] = useTransition();
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel="Problem melden" text="Der Lieferschein bleibt im Status; die Leitung bekommt eine Aufgabe." groesse="md" testid="problem-dialog"
      fuss={<>
        <Knopf variant="ghost" onClick={onSchliessen}>{DIALOG.abbrechen}</Knopf>
        <Knopf variant="primary" laedt={laeuft} onClick={() => start(async () => { const r = await problemAction({ lieferschein, grund, text }); if (r.ok) { zeige(ERFOLG.gemeldet, { art: "ok", unter: r.servicefall ? "Servicefall angelegt" : undefined }); onSchliessen(); } else zeige(r.message, { art: "fehler" }); })} testid="problem-melden">Melden</Knopf>
      </>}>
      <div className="flex flex-col gap-3">
        <Segment label="Grund" wert={grund} onWechsel={setGrund} optionen={PROBLEM_GRUENDE.map(([w, t]) => ({ wert: w, titel: t }))} />
        <label className="flex flex-col gap-1">
          <span className="bo-log-cap">Beschreibung</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="rounded-[14px] bg-bo-surface-2 p-3 text-[15px] outline-none focus-visible:shadow-(--bo-sh-focus)" data-scan="nein" />
        </label>
        <p className="bo-log-cap">{DIALOG.fotoHinweis}</p>
      </div>
    </Dialog>
  );
}

function ZurueckstellenDialog({ offen, lieferschein, onSchliessen }) {
  const { zeige } = useToast();
  const [grund, setGrund] = useState("Fehlt");
  const [text, setText] = useState("");
  const [laeuft, start] = useTransition();
  return (
    <Dialog offen={offen} onSchliessen={() => onSchliessen(false)} titel="Zurückstellen" text="Gepackte Mengen bleiben erhalten. Fortsetzen über die Nummer." groesse="md" testid="zurueckstellen-dialog"
      fuss={<>
        <Knopf variant="ghost" onClick={() => onSchliessen(false)}>{DIALOG.abbrechen}</Knopf>
        <Knopf variant="primary" laedt={laeuft} onClick={() => start(async () => { const r = await zurueckstellenAction({ lieferschein, grund, text }); if (r.ok) { zeige("Zurückgestellt", { art: "ok" }); onSchliessen(true); } else zeige(r.message, { art: "fehler" }); })}>Zurückstellen</Knopf>
      </>}>
      <div className="flex flex-col gap-3">
        <Segment label="Grund" wert={grund} onWechsel={setGrund} optionen={[["Fehlt", "Fehlt"], ["Beschaedigt", "Beschädigt"], ["Falscher Artikel", "Falsch"], ["Kunde Rueckfrage", "Rückfrage"], ["Sonstiges", "Sonstiges"]].map(([w, t]) => ({ wert: w, titel: t }))} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} aria-label="Notiz" className="rounded-[14px] bg-bo-surface-2 p-3 text-[15px] outline-none focus-visible:shadow-(--bo-sh-focus)" data-scan="nein" />
      </div>
    </Dialog>
  );
}

// ================================================================= Abholung ==

/** Abholkarte (§ 6.3): Zahlung, Abholcode, Unterschrift oder „Name bestätigt“ → „An Kunde ausgeben“. */
function AbholAnsicht({ daten, leitung }) {
  const router = useRouter();
  const { zeige } = useToast();
  const ls = daten.lieferschein;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [us, setUs] = useState(null);
  const [override, setOverride] = useState("");
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();
  const [fertig, setFertig] = useState(false);
  const sperre = daten.zahlung;

  const ausgeben = () =>
    start(async () => {
      const r = await ausgebenAction({ lieferschein: ls.name, empfaengerName: name, unterschrift: us?.art === "unterschrift" ? us.png : null, alternative: us && us.art !== "unterschrift" ? "Name bestätigt" : null, abholcode: code, override });
      if (!r.ok) {
        setFehler(r.fehler || { _: r.message });
        zeige(r.message, { art: "fehler" });
        return;
      }
      setFertig(true);
    });

  if (fertig) {
    return (
      <div className="bo-kachel mx-auto max-w-[640px]" data-testid="abholung-fertig">
        <ErgebnisKarte ohneKachel titel={ERFOLG.ausgegeben(ls.kunde_name)} unter={ls.name} weiter={{ titel: T.zurueck, href: "/packtisch" }} dokumente={[{ titel: T.lieferschein, href: druckHref("PH Lieferschein", ls.name, "PH Lieferschein Standard"), icon: "FileText" }]} />
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" data-testid="abhol-ansicht">
      <section className="bo-log-pack__spalte" aria-label="Abholung">
        <p className="bo-log-cap">Abholung · {ls.name}</p>
        <h1 className="bo-titel-gross">{ls.kunde_name}</h1>
        <div className="flex flex-wrap gap-2">
          {sperre.gesperrt ? <Chip ton="ziegel">{sperre.art === "bezahlung" ? T.offen(EURO(sperre.fehltCent)) : "Anzahlung offen"}</Chip> : <Chip ton="salbei"><Check {...S16} />{T.bezahlt}</Chip>}
          {!ls.kunde_email ? <Chip ton="eiche">{T.ohneMail}</Chip> : null}
        </div>
        {sperre.gesperrt ? (
          <p className="bo-log-hinweis" data-ton="ziegel"><CircleAlert {...S16} /><span>{sperre.text}. <a className="underline" href={`/kassa?beleg=${encodeURIComponent(ls.bestellung || ls.auftrag || "")}`}>Zur Kassa</a></span></p>
        ) : null}
        <ol className="bo-log-pz-liste">
          {daten.positionen.map((pos) => (
            <li key={posId(pos)} className="bo-log-pz" data-z="fertig">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="bo-log-pz__bild">{pos.bild ? <img src={pos.bild} alt="" /> : <Layers {...S24} />}</span>
              <span className="bo-log-pz__txt"><b>{pos.beschreibung}</b><span>{pos.marke}</span></span>
              <span className="bo-log-pz__menge"><b>{pos.menge}</b></span>
              <span className="bo-log-pz__st"><span className="bo-log-pz__badge"><Check {...S16} />Gepackt</span></span>
            </li>
          ))}
        </ol>
      </section>
      <section className="bo-log-pack__spalte" aria-label="Ausgeben">
        <label className="flex flex-col gap-1">
          <span className="bo-log-cap">Abholcode</span>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="h-14 rounded-[14px] bg-bo-surface-2 px-4 text-[22px] tracking-[0.2em] outline-none focus-visible:shadow-(--bo-sh-focus)" aria-invalid={fehler.abholcode ? "true" : undefined} data-testid="abholcode" data-scan="nein" />
          {fehler.abholcode ? <span className="text-[13px] text-bo-ziegel-text">{fehler.abholcode}</span> : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="bo-log-cap">Abgeholt von</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-[14px] bg-bo-surface-2 px-4 text-[16px] outline-none focus-visible:shadow-(--bo-sh-focus)" data-testid="abholer" data-scan="nein" />
        </label>
        <Unterschrift erklaerung="Ich habe die Ware vollständig und unbeschädigt erhalten." name={name} alternativen={[{ wert: "name", titel: "Name bestätigt", feld: true, fotoPflicht: false }]} onUebernommen={setUs} testid="abhol-unterschrift" />
        {sperre.gesperrt && leitung ? (
          <label className="flex flex-col gap-1">
            <span className="bo-log-cap">{DIALOG.ueberschreiben}</span>
            <input value={override} onChange={(e) => setOverride(e.target.value)} className="h-12 rounded-[14px] bg-bo-surface-2 px-4 outline-none focus-visible:shadow-(--bo-sh-focus)" data-scan="nein" />
          </label>
        ) : null}
        <button type="button" className="bo-log-go mt-auto" data-primaer="" aria-disabled={(!us || !name || (sperre.gesperrt && !(leitung && override.length >= 5))) ? "true" : undefined} onClick={() => (!us || !name ? zeige("Bitte unterschreiben lassen oder Alternative wählen", { art: "warnung" }) : ausgeben())} data-testid="ausgeben">
          <PackageCheck {...S24} />
          <span>
            {laeuft ? "…" : "An Kunde ausgeben"}
            <small>{sperre.gesperrt ? (leitung ? "Leitung: Grund angeben" : "zuerst an der Kassa") : !us ? "Unterschrift fehlt" : "bestätigt die Übergabe"}</small>
          </span>
        </button>
        <Knopf variant="ghost" icon="ChevronLeft" onClick={() => router.push("/packtisch")}>{T.zurueck}</Knopf>
      </section>
    </div>
  );
}

