"use client";
// G-24 Kiosk-Kern v2 (Team P0-6) im Lounge-Kiosk-Stil (lounge.md §7.4/§7.5/§12; Entwurf
// src/app/entwurf/lounge/kassa + packtisch): keine Seitenleiste, schwebende Statuszeile als Material-Kapsel
// (Zurück · Wortmarke · Arbeitsplatz/Gerät/Kontext │ Kopfzeilen-Slot │ Status · Uhr · Bediener · Hilfe ·
// Hell/Dunkel · Mehr · Sperren), große runde Ziele ≥ 44 px, Kiosk-Dichte fix.
// Fundament-Pflichten (MASTER G-24, Q-J1…Q-J6, Q-E5, Q-D8, Q-F7):
// - Kopfzeilen-Slot (`kopfSlot`) für z. B. Paket/Sperrgut-Segment oder die Stempelpille (K-36);
// - `aria-live`-Region (Ansagen über `useKiosk().ansagen(text)`, Scans werden angesagt);
// - `data-tastatur`-Erkennung (`<kbd>` nur mit angeschlossener Tastatur);
// - Band-Stapel (Q-J4) nach Rang, max. 2 + „+n“, nie blinkend; Offline in Eiche, Ziegel nur „Zahlung ohne Beleg“;
// - `toastAnker` (Q-J3) – Toasts im Kiosk über den ToastProvider mit Kiosk-Regeln;
// - Hilfe-Knopf 48 px + F1 (Dialog mit den Tasten der Ansicht und den gemeinsamen Kiosk-Tasten);
// - Idle-Sperre (Standard 15 min) mit 30-s-Band, danach Sperrbild aus Material (240 ms Blende);
// - Scanner global über ScanTor (Opt-out `data-scan="nein"`, `scanAus` z. B. während der Zahlung);
// - Upload-Warteschlange sichtbar („2 Fotos werden gesendet“), Online-Status an die Warteschlange.
// Hydration-sicher (QA-Befund 1): Uhr, Vollbild und Tastatur erst nach dem Einhängen.
// Kompatibel zur v1-API: titel, geraet, benutzer, kuerzel, onScan, hilfe, children.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, CircleHelp, Ellipsis, Lock, Moon, RefreshCw, Sun, TriangleAlert } from "lucide-react";
import { ToastProvider } from "../Toast";
import Avatar from "../Avatar";
import Knopf from "../Knopf";
import cx from "../cx";
import { Icon } from "../icons";
import Dialog from "../Overlay/Dialog";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import { useThema } from "../Shell/Thema";
import { useScanTor } from "../Eingabe/ScanTor";
import { abmeldenAction } from "@/lib/backoffice/actions";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { useDruck, useIdle, useLebenszeichen, useTastatur, useTastenkuerzel, useUhr, useVerbindung, useVollbild } from "./hooks";
import { ordneBaender } from "./logik";
import { setzeOnline, useWarteschlange } from "./warteschlange";
import { TEXTE } from "./texte";
import "./kiosk.css";

const KioskKontext = createContext(null);

/** { ansagen(text), online, tastatur } – außerhalb der KioskShell wirkungslos. */
export function useKiosk() {
  return useContext(KioskKontext) || { ansagen: () => {}, online: true, tastatur: false };
}

function abonniereSchmal(f) {
  const mq = window.matchMedia("(max-width: 639px)");
  mq.addEventListener("change", f);
  return () => mq.removeEventListener("change", f);
}

const STATUS_TON = { bereit: "ok", ok: "ok", warnung: "warnung", gefahr: "gefahr", info: "info" };

/**
 * @param {object} p
 * @param {string} p.titel                         Arbeitsplatz („Kassa 1“, „Packtisch“)
 * @param {{name:string, standort?:string}|null} [p.geraet]
 * @param {{name:string}} p.benutzer
 * @param {string} [p.kontext]                     Zusatz in der Statuszeile („Bon K1-000124“)
 * @param {import("react").ReactNode} [p.kopfSlot] Mitte der Statuszeile (Segment, Stempelpille)
 * @param {{text:string, ton?:"ok"|"warnung"|"gefahr"|"info"}} [p.status]  Status-Pille (Standard Verbunden/Offline)
 * @param {Array<{art:string, text:string, aktion?:{titel:string, onClick:()=>void}}>} [p.baender]  weitere Bänder (training, see, zahlung-ohne-beleg …)
 * @param {Record<string, Function>} [p.kuerzel]    zusätzliche Tasten der Ansicht (F-Tasten, Strg+…)
 * @param {(code:string, erkannt:object) => void} [p.onScan]
 * @param {boolean} [p.scanAus]                    Scanner gesperrt (Zahlung)
 * @param {Array<{taste:string, text:string}>} [p.hilfe]   Tasten der Ansicht für Hilfe-Dialog und Fußzeile
 * @param {string} [p.toastAnker]                  "unten-mitte" (Standard) | "oben-mitte" | "#element-id"
 * @param {number} [p.idleMs]                      0 = keine Idle-Sperre; Standard 15 min (Q-J2)
 * @param {string} [p.zurueckHref]
 */
export default function KioskShell(props) {
  return (
    <ToastProvider kiosk toastAnker={props.toastAnker}>
      <KioskRahmen {...props} />
    </ToastProvider>
  );
}

function KioskRahmen({ titel, geraet, benutzer, kontext, kopfSlot, status, baender = [], kuerzel = {}, onScan, scanAus = false, hilfe = [], idleMs = 15 * 60_000, zurueckHref = "/arbeitsplatz", children }) {
  const router = useRouter();
  const uhr = useUhr();
  const { online } = useVerbindung();
  const vollbild = useVollbild();
  const { gesperrt: geraetGesperrt } = useLebenszeichen(!!geraet);
  const drucke = useDruck();
  const tastatur = useTastatur();
  const [thema, setzeThema] = useThema();
  const [ansage, setAnsage] = useState("");
  const [hilfeOffen, setHilfeOffen] = useState(false);
  const [gesperrt, setGesperrt] = useState(false);
  const [letzterScan, setLetzterScan] = useState("");
  const idle = useIdle({ idleMs: idleMs || 1, aktiv: idleMs > 0 && !gesperrt });
  const warte = useWarteschlange();
  const schmal = useSyncExternalStore(abonniereSchmal, () => window.matchMedia("(max-width: 639px)").matches, () => false);

  useEffect(() => {
    setzeOnline(online);
  }, [online]);

  const ansageZaehler = useRef(0);
  const ansagen = useCallback((text) => {
    // Gleicher Text zweimal hintereinander wird sonst nicht erneut vorgelesen.
    ansageZaehler.current += 1;
    setAnsage(`${text}${ansageZaehler.current % 2 ? "" : "​"}`);
  }, []);

  useScanTor({
    modus: "kiosk",
    gesperrt: scanAus || gesperrt,
    onAnsage: ansagen,
    onScan: (code, erkannt) => {
      setLetzterScan(code);
      onScan?.(code, erkannt);
    },
  });

  useKuerzel("kiosk", {
    "kiosk.hilfe": () => setHilfeOffen(true),
    "kiosk.bediener": () => router.push("/wechsel"),
    "kiosk.vollbild": () => vollbild.umschalten(),
    "kiosk.drucken": () => drucke(),
  });
  useTastenkuerzel(kuerzel);

  const istGesperrt = gesperrt || idle.phase === "gesperrt";
  const kurzname = String(benutzer?.name || "").split(" (")[0];
  const dunkel = thema === "dark";

  const alleBaender = useMemo(() => {
    const b = [...baender];
    if (!online) b.push({ art: "offline", text: TEXTE.baender.offline });
    if (geraetGesperrt) b.push({ art: "gesperrt", text: TEXTE.baender.gesperrt });
    if (idle.phase === "warnung") b.push({ art: "idle", text: TEXTE.baender.idle(idle.rest), aktion: { titel: TEXTE.baender.idleWeiter, onClick: idle.weiter } });
    return ordneBaender(b, 2);
  }, [baender, online, geraetGesperrt, idle.phase, idle.rest, idle.weiter]);

  const statusText = status?.text || (online ? TEXTE.verbunden : TEXTE.getrennt);
  const statusTon = status?.ton ? STATUS_TON[status.ton] || "ok" : online ? "ok" : "warnung";
  const wertKontext = useMemo(() => ({ ansagen, online, tastatur }), [ansagen, online, tastatur]);
  const warteFehler = warte.eintraege.some((e) => e.zustand === "fehler");

  return (
    <KioskKontext.Provider value={wertKontext}>
      <div className="bo-ki" data-dichte="kiosk" data-bo-kiosk="" aria-hidden={istGesperrt ? "true" : undefined}>
        <header className="bo-ki-kopf bo-material bo-no-print" data-testid="kiosk-kopf" data-slot={kopfSlot ? "" : undefined}>
          <div className="bo-ki-kopf__l">
            <Link href={zurueckHref} className="bo-rund bo-ziel" aria-label={TEXTE.zurueck}>
              <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </Link>
            <span className="bo-ki-wort bo-wortmarke" aria-hidden="true">
              PLATZHIRSCH
            </span>
            <span className="bo-ki-mono" aria-hidden="true">
              P
            </span>
            <span className="bo-ki-sep" aria-hidden="true" />
            <span className="bo-ki-ctx">
              <b>{titel}</b>
              {(geraet?.name || kontext) && (
                <span className="bo-ki-ctx__rest">
                  {geraet?.name && <span className="bo-ki-ctx__geraet">&nbsp;· {[geraet.name, geraet.standort].filter(Boolean).join(" · ")}</span>}
                  {kontext && <span>&nbsp;· {kontext}</span>}
                </span>
              )}
            </span>
          </div>
          {kopfSlot && <div className="bo-ki-kopf__slot">{kopfSlot}</div>}
          <div className="bo-ki-kopf__r">
            <span className="bo-ki-status" data-ton={statusTon === "ok" ? undefined : statusTon} role="status" aria-live="polite" aria-label={statusText}>
              <i aria-hidden="true" />
              <span className="bo-ki-status__text">{statusText}</span>
            </span>
            <time className="bo-ki-uhr tabular-nums" dateTime={uhr.iso || undefined}>
              {uhr.text || " "}
            </time>
            <Link href="/wechsel" className="bo-ki-op" aria-label={`${TEXTE.bediener}: ${kurzname}`} data-testid="bedienerwechsel">
              <Avatar name={kurzname} groesse={32} ring={false} dekorativ />
              <span className="bo-ki-op__name">{kurzname}</span>
            </Link>
            <button type="button" className="bo-rund bo-ziel" aria-label={`${TEXTE.hilfe} (${TEXTE.hilfeKuerzel})`} aria-keyshortcuts="F1" onClick={() => setHilfeOffen(true)} data-testid="kiosk-hilfe">
              <CircleHelp aria-hidden="true" className="size-5" strokeWidth={1.75} />
            </button>
            <button type="button" className="bo-rund bo-ziel bo-ki-nur-breit" aria-label={dunkel ? TEXTE.hell : TEXTE.dunkel} aria-pressed={dunkel} onClick={() => setzeThema(dunkel ? "light" : "dark")}>
              {dunkel ? <Sun aria-hidden="true" className="size-5" strokeWidth={1.75} /> : <Moon aria-hidden="true" className="size-5" strokeWidth={1.75} />}
            </button>
            <Menue
              label={TEXTE.mehr}
              platzierung="unten-ende"
              ausloeser={(p) => (
                <button type="button" {...p} className="bo-rund bo-ziel" aria-label={TEXTE.mehr} data-testid="kiosk-mehr">
                  <Ellipsis aria-hidden="true" className="size-5" strokeWidth={1.75} />
                </button>
              )}
            >
              {vollbild.verfuegbar && (
                <MenuePunkt icon={vollbild.an ? "Minimize" : "Maximize"} kuerzel="F11" onWaehlen={vollbild.umschalten}>
                  {vollbild.an ? TEXTE.vollbildAus : TEXTE.vollbild}
                </MenuePunkt>
              )}
              <MenuePunkt icon="Printer" kuerzel="Strg+P" onWaehlen={() => drucke()}>
                {TEXTE.drucken}
              </MenuePunkt>
              <MenuePunkt icon="Users" kuerzel="⇧F2" href="/wechsel">
                {TEXTE.bediener}
              </MenuePunkt>
              {schmal && (
                <MenuePunkt icon={dunkel ? "Sun" : "Moon"} onWaehlen={() => setzeThema(dunkel ? "light" : "dark")}>
                  {dunkel ? TEXTE.hell : TEXTE.dunkel}
                </MenuePunkt>
              )}
              {schmal && (
                <MenuePunkt icon="Lock" onWaehlen={() => setGesperrt(true)}>
                  {TEXTE.sperren}
                </MenuePunkt>
              )}
              <MenueTrenner />
              <MenuePunkt icon="LogOut" onWaehlen={() => abmeldenAction()}>
                {TEXTE.abmelden}
              </MenuePunkt>
            </Menue>
            <Knopf variant="ghost" className="bo-ki-sperren bo-ki-nur-breit" onClick={() => setGesperrt(true)} aria-label={TEXTE.sperren} data-testid="kiosk-sperren">
              <Lock aria-hidden="true" className="size-4" strokeWidth={1.75} />
              <span className="bo-ki-sperren__text">{TEXTE.sperren}</span>
            </Knopf>
          </div>
        </header>

        {alleBaender.sichtbar.length > 0 && (
          <div className="bo-ki-baender bo-no-print" data-testid="kiosk-baender">
            {alleBaender.sichtbar.map((b, i) => (
              <div key={`${b.art}-${i}`} className="bo-ki-band" data-ton={b.ton} role={b.ton === "gefahr" ? "alert" : "status"}>
                <span className="bo-ki-band__ico" aria-hidden="true">
                  <Icon name={b.icon} className="size-4" />
                </span>
                <span className="bo-ki-band__text">{b.text}</span>
                {b.aktion && (
                  <Knopf size="m" variant="secondary" onClick={b.aktion.onClick}>
                    {b.aktion.titel}
                  </Knopf>
                )}
                {i === alleBaender.sichtbar.length - 1 && alleBaender.weitere > 0 && <span className="bo-ki-band__mehr">{TEXTE.bandWeitere(alleBaender.weitere)}</span>}
              </div>
            ))}
          </div>
        )}

        <main className="bo-ki-inhalt" data-testid="kiosk-inhalt">
          {children}
        </main>

        {(hilfe.length > 0 || letzterScan) && (
          <footer className="bo-ki-fuss bo-no-print" aria-hidden="true">
            {hilfe.map((h) => (
              <span key={h.taste} className="inline-flex items-center gap-1.5">
                <kbd className="bo-ki-taste">{h.taste}</kbd> {h.text}
              </span>
            ))}
            {letzterScan && (
              <span className="ml-auto">
                {TEXTE.letzterScan}: <code>{letzterScan}</code>
              </span>
            )}
          </footer>
        )}

        {warte.text && (
          <div className="bo-ki-warte bo-material bo-no-print" role="status" data-fehler={warteFehler ? "true" : undefined} data-testid="kiosk-warteschlange">
            {warteFehler ? <TriangleAlert aria-hidden="true" className="size-4" strokeWidth={1.75} /> : <RefreshCw aria-hidden="true" className={cx("size-4", online && "bo-ki-dreht")} strokeWidth={1.75} />}
            {warte.text}
            {warteFehler && (
              <Knopf size="s" variant="secondary" onClick={() => warte.eintraege.filter((e) => e.zustand === "fehler").forEach((e) => warte.erneut(e.id))}>
                {TEXTE.warteschlange.erneut}
              </Knopf>
            )}
          </div>
        )}

        <p className="sr-only" aria-live="polite" aria-atomic="true" data-testid="kiosk-ansage">
          {ansage}
        </p>
      </div>

      {istGesperrt && (
        <div className="bo-ki-sperre bo-material-stark" role="dialog" aria-modal="true" aria-labelledby="kiosk-sperre-titel" data-testid="kiosk-sperrbild">
          <div className="bo-ki-sperre__karte">
            <span className="bo-ki-sperre__wort bo-wortmarke">PLATZHIRSCH</span>
            <time className="bo-ki-sperre__uhr tabular-nums" dateTime={uhr.iso || undefined}>
              {uhr.text || " "}
            </time>
            <h2 id="kiosk-sperre-titel" className="bo-ki-sperre__titel">
              {TEXTE.sperre.titel}
            </h2>
            <p className="bo-ki-sperre__text">{TEXTE.sperre.text}</p>
            <Knopf variant="primary" size="kiosk" href="/wechsel" className="mt-4">
              {TEXTE.sperre.weiter}
            </Knopf>
          </div>
        </div>
      )}

      <Dialog offen={hilfeOffen} onSchliessen={() => setHilfeOffen(false)} titel={TEXTE.hilfeDialog.titel} groesse="md" testid="kiosk-hilfe-dialog" fuss={<Knopf variant="primary" onClick={() => setHilfeOffen(false)}>{TEXTE.hilfeDialog.schliessen}</Knopf>}>
        <div className="grid gap-4">
          {!tastatur && <p className="text-[15px] text-bo-text-soft">{TEXTE.hilfeDialog.ohneTastatur}</p>}
          <dl className="bo-ki-hilfe-liste">
            {[...hilfe, ...TEXTE.hilfeDialog.gemeinsam].map((h) => (
              <div key={h.taste} className="contents">
                <dt>
                  <kbd className="bo-ki-taste">{h.taste}</kbd>
                </dt>
                <dd>{h.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Dialog>
    </KioskKontext.Provider>
  );
}
