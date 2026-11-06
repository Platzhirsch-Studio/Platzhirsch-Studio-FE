"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import cx from "./cx";
import { DAUER, useReduziert } from "./motion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { CommitKontext } from "@/lib/backoffice/commit/kontext";
import { erzeugeWarteschlange } from "@/lib/backoffice/commit/warteschlange";
import { commitAction, verwerfeCommit } from "@/lib/backoffice/commit/actions";
import { COMMIT_MS, COMMIT_MS_KIOSK } from "@/lib/backoffice/commit/konstanten";
import { COMMIT_TEXTE as T, grundAus } from "@/lib/backoffice/commit/texte";
import { ARBEITSPLAETZE } from "@/lib/backoffice/arbeitsplaetze";

// Toast v2 im Lounge-Material (G-03, Team P0-3; art-direction/lounge.md § 6/8/9).
//
// <ToastProvider> steckt in Shell und KioskShell. Er stellt bereit:
//   useToast().zeige(text, { art, dauer, unter, icon, aktion })   art: ok | info (4 s) · warnung (6 s) · fehler (bis geschlossen)
//   useVerzoegerterCommit().starte(…) (lib/backoffice/commit)      Undo-Toast 8 s (Kiosk 6 s) mit Balken, „Rückgängig“, „Jetzt ausführen“
//   useToastAnker("#kassa-meldungen" | "unten-mitte" | …)          Kiosk: Meldungen an eine Stelle der Seite binden
//
// Verhalten: Breite 360, Stapel 3 (Kiosk 2), gleichartige werden zusammengefasst („2-mal“), Undo-, Warn- und
// Fehler-Meldungen werden nie verdrängt (darüber „n weitere Meldungen“). Timer pausieren bei Zeiger, Fokus und
// Berührung; der Timer im JS ist die Wahrheit, der Balken nur Anzeige. Reduzierte Bewegung: kein Balken, dafür
// „Rückgängig (6 s)“. Tasten: Z bzw. Strg/⌘+Z = jüngsten Undo zurücknehmen, F8 = Meldung fokussieren;
// Esc berührt Toasts nie (K-04). Backoffice unten rechts, Kiosk über `toastAnker` (K-05).

const ToastContext = createContext(null);

const DAUER_ART = { ok: 4000, info: 4000, warnung: 6000, fehler: 0 };
const ICON_ART = { ok: "Check", info: "Info", warnung: "TriangleAlert", fehler: "CircleX", undo: "Check" };
const TON_ART = {
  ok: "bg-bo-salbei-soft text-bo-salbei-text",
  undo: "bg-bo-salbei-soft text-bo-salbei-text",
  info: "bg-bo-fill-2 text-bo-text-soft",
  warnung: "bg-bo-eiche-soft text-bo-eiche-text",
  fehler: "bg-bo-ziegel-soft text-bo-ziegel-text",
};
const BLEIBT = new Set(["undo", "warnung", "fehler"]);
const ANKER = {
  // Telefon: über der Tab-Kapsel der Shell (64 + 12 + 12 px, shell.css), ab md unten rechts.
  "unten-rechts": "fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] items-center md:inset-x-auto md:right-6 md:bottom-6 md:items-end",
  "unten-mitte": "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] items-center",
  "oben-mitte": "fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] items-center",
};
const KIOSK_ROUTEN = ARBEITSPLAETZE.filter((a) => a.kiosk).map((a) => a.route);

/** Kiosk-Arbeitsplatz anhand des Pfads (KioskShell übergibt nichts; /kassa/verwaltung ist Backoffice). */
export function istKioskPfad(pfad) {
  if (!pfad || pfad.startsWith("/kassa/verwaltung")) return false;
  return KIOSK_ROUTEN.some((r) => pfad === r || pfad.startsWith(`${r}/`));
}

function sendeBeacon(tokens) {
  const body = JSON.stringify({ tokens });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon?.("/api/undo-commit", new Blob([body], { type: "text/plain;charset=UTF-8" }))) return true;
  } catch {
    // weiter mit fetch keepalive
  }
  try {
    fetch("/api/undo-commit", { method: "POST", body, keepalive: true, credentials: "same-origin", headers: { "Content-Type": "text/plain;charset=UTF-8" } }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** Sekunden bis `frist` (aufgerundet), tickt 4× je Sekunde, steht bei Pause. */
function useSekunden(frist, pausiert, rest) {
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    if (!frist || pausiert) return undefined;
    const t = setInterval(() => setJetzt(Date.now()), 250);
    return () => clearInterval(t);
  }, [frist, pausiert]);
  if (!frist) return 0;
  const ms = pausiert ? rest : frist - jetzt;
  return Math.max(0, Math.ceil(ms / 1000));
}

/**
 * Darstellung einer Meldung (ohne Zustand) – auch für Demo und Abnahme-Bilder.
 * @param {object} p
 * @param {"ok"|"info"|"warnung"|"fehler"|"undo"} [p.art]
 */
export function ToastKarte({ art = "info", text, unter, icon, anzahl = 1, sekunden, ms = COMMIT_MS, lauf = 1, pausiert = false, reduziert = false, geht = false, aktion, onRueckgaengig, onJetzt, onSchliessen, onPause, onWeiter, kartenRef, testid, statisch = false, className }) {
  const undo = art === "undo";
  const laut = art === "fehler" || art === "warnung";
  return (
    <div
      ref={kartenRef}
      role={statisch ? undefined : laut ? "alert" : "status"}
      tabIndex={-1}
      data-art={art}
      data-geht={geht ? "true" : undefined}
      data-pausiert={pausiert ? "true" : undefined}
      data-testid={testid}
      onPointerEnter={onPause}
      onPointerLeave={onWeiter}
      onFocus={onPause}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onWeiter?.();
      }}
      style={{ backgroundColor: "color-mix(in srgb, var(--color-bo-surface) 92%, transparent)" }}
      className={cx(
        "bo-toast bo-material-stark pointer-events-auto w-[360px] max-w-full rounded-bo-karte py-3 pl-3 pr-2 text-bo-text outline-none",
        "focus-visible:ring-2 focus-visible:ring-bo-focus",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={cx("inline-flex size-8 shrink-0 items-center justify-center rounded-full", TON_ART[art] || TON_ART.info)}>
          <Icon name={icon || ICON_ART[art] || "Info"} className="size-4" />
        </span>
        <div className="min-w-0 flex-1 pt-[5px]">
          <p className="text-[14px] font-medium leading-5 [overflow-wrap:anywhere]">
            {text}
            {anzahl > 1 && <span className="ml-1.5 inline-flex h-5 items-center rounded-pill bg-bo-fill-2 px-1.5 align-[1px] text-[12px] font-medium tabular-nums text-bo-text-soft">{T.anzahl(anzahl)}</span>}
          </p>
          {unter && <p className="mt-0.5 text-[13px] leading-[18px] text-bo-text-soft">{unter}</p>}
          {(undo || aktion) && (
            <div className="-ml-0.5 mt-2.5 flex flex-wrap items-center gap-1.5">
              {undo && (
                <button type="button" onClick={onRueckgaengig} aria-keyshortcuts="Z Control+Z Meta+Z" data-testid="toast-rueckgaengig" className="bo-knopf bo-knopf--primary inline-flex min-h-(--bo-control-h-s) items-center gap-1.5 rounded-pill px-3 text-[13px] font-semibold">
                  <Icon name="Undo2" className="size-4" />
                  {reduziert && typeof sekunden === "number" ? T.rueckgaengigSekunden(sekunden) : T.rueckgaengig}
                </button>
              )}
              {undo && (
                <button type="button" onClick={onJetzt} data-testid="toast-jetzt" className="bo-knopf bo-knopf--ghost inline-flex min-h-(--bo-control-h-s) items-center rounded-pill px-3 text-[13px] font-medium text-bo-text-soft hover:text-bo-text">
                  {T.jetztAusfuehren}
                </button>
              )}
              {aktion && (
                <button type="button" onClick={aktion.onClick} className="bo-knopf bo-knopf--secondary inline-flex min-h-(--bo-control-h-s) items-center rounded-pill px-3 text-[13px] font-semibold">
                  {aktion.titel}
                </button>
              )}
            </div>
          )}
        </div>
        <button type="button" onClick={onSchliessen} aria-label={T.schliessen} className="bo-knopf bo-knopf--ghost bo-ziel inline-flex size-7 shrink-0 items-center justify-center rounded-full text-bo-text-faint hover:text-bo-text">
          <Icon name="X" className="size-3.5" />
        </button>
      </div>
      {undo && !reduziert && <span key={lauf} aria-hidden="true" className="bo-toast-balken text-bo-cognac" style={{ "--undo-ms": `${ms}ms` }} />}
    </div>
  );
}

/**
 * @param {object} p
 * @param {boolean} [p.kiosk]       Kiosk-Regeln (Undo 6 s, Stapel 2); Standard: aus dem Pfad (Kassa, Packtisch, Montage, Technik)
 * @param {string} [p.toastAnker]  "unten-rechts" (Backoffice) | "unten-mitte" (Kiosk-Standard) | "oben-mitte" | "#element-id"
 */
export function ToastProvider({ children, kiosk: kioskProp, toastAnker }) {
  const pfad = usePathname();
  const kiosk = kioskProp ?? istKioskPfad(pfad);
  const reduziert = useReduziert();
  const [liste, setListeRoh] = useState([]);
  const [offen, setOffen] = useState(false);
  const [ankerLaufzeit, setAnkerLaufzeit] = useState(null);
  const zaehler = useRef(0);
  const timer = useRef(new Map());
  const karten = useRef(new Map());
  // Liste synchron spiegeln: mehrere zeige()-Aufrufe im selben Takt sehen einander (Zusammenfassen).
  const listeRef = useRef([]);
  const setListe = useCallback((fn) => {
    listeRef.current = typeof fn === "function" ? fn(listeRef.current) : fn;
    setListeRoh(listeRef.current);
  }, []);

  const [q] = useState(() =>
    erzeugeWarteschlange({
      ausfuehren: (tokens) => commitAction({ tokens }),
      verwerfen: (tokens) => verwerfeCommit({ tokens }),
      beacon: sendeBeacon,
      standardMs: kioskProp ?? istKioskPfad(pfad) ? COMMIT_MS_KIOSK : COMMIT_MS,
    })
  );
  const snap = useSyncExternalStore(q.abonniere, q.schnappschuss, q.schnappschuss);
  const vorgaenge = useMemo(() => new Map(snap.vorgaenge.map((v) => [v.id, v])), [snap]);

  // ---------------------------------------------------------------- Timer je Meldung (ok/info/warnung)
  const loescheTimer = useCallback((id) => {
    const t = timer.current.get(id);
    if (t?.h) clearTimeout(t.h);
    timer.current.delete(id);
  }, []);

  const entferne = useCallback(
    (id) => {
      loescheTimer(id);
      karten.current.delete(id);
      setListe((l) => l.map((t) => (t.id === id ? { ...t, geht: true } : t)));
      setTimeout(() => setListe((l) => l.filter((t) => t.id !== id)), DAUER.fast);
    },
    [loescheTimer, setListe]
  );

  const stelleTimer = useCallback(
    (id, ms) => {
      loescheTimer(id);
      if (!(ms > 0)) return;
      timer.current.set(id, { h: setTimeout(() => entferne(id), ms), bis: Date.now() + ms, rest: ms, pause: false });
    },
    [entferne, loescheTimer]
  );

  const pausiereTimer = useCallback((id) => {
    const t = timer.current.get(id);
    if (!t || t.pause) return;
    clearTimeout(t.h);
    t.rest = Math.max(800, t.bis - Date.now());
    t.pause = true;
  }, []);

  const weiterTimer = useCallback(
    (id) => {
      const t = timer.current.get(id);
      if (!t || !t.pause) return;
      t.pause = false;
      t.bis = Date.now() + t.rest;
      t.h = setTimeout(() => entferne(id), t.rest);
    },
    [entferne]
  );

  // ---------------------------------------------------------------- Meldungen
  const fuegeHinzu = useCallback(
    (eintrag) => {
      const max = kiosk ? 2 : 3;
      setListe((l) => {
        const neu = [...l, eintrag];
        // Nur ok/info dürfen verdrängt werden – und nur, wenn der Stapel voll ist.
        const sichtbar = neu.filter((t) => !t.geht);
        let zuViel = sichtbar.length - max;
        const raus = new Set();
        for (const t of sichtbar) {
          if (zuViel <= 0) break;
          if (!BLEIBT.has(t.art) && t.id !== eintrag.id) {
            raus.add(t.id);
            zuViel -= 1;
          }
        }
        for (const id of raus) {
          loescheTimer(id);
          karten.current.delete(id);
        }
        return neu.filter((t) => !raus.has(t.id));
      });
    },
    [kiosk, loescheTimer, setListe]
  );

  const zeige = useCallback(
    (text, { art = "info", dauer, unter, icon, aktion } = {}) => {
      const a = DAUER_ART[art] !== undefined ? art : "info";
      const ms = dauer ?? DAUER_ART[a];
      const gleich = listeRef.current.find((t) => !t.geht && !t.vorgangId && t.art === a && t.text === text && (t.unter || null) === (unter || null));
      if (gleich) {
        setListe((l) => l.map((t) => (t.id === gleich.id ? { ...t, anzahl: (t.anzahl || 1) + 1, lauf: (t.lauf || 1) + 1 } : t)));
        stelleTimer(gleich.id, ms);
        return gleich.id;
      }
      const id = `t${++zaehler.current}`;
      fuegeHinzu({ id, art: a, text, unter, icon, aktion, anzahl: 1, lauf: 1 });
      stelleTimer(id, ms);
      return id;
    },
    [fuegeHinzu, setListe, stelleTimer]
  );

  // ---------------------------------------------------------------- Ereignisse der Commit-Warteschlange
  useEffect(
    () =>
      q.hoere((e) => {
        const tid = `u${e.vorgang.id}`;
        const ersetze = (text, art, opts = {}) => {
          if (!e.vorgang.still) entferne(tid);
          zeige(text, { art, ...opts });
        };
        switch (e.art) {
          case "neu":
            fuegeHinzu({ id: tid, art: "undo", vorgangId: e.vorgang.id, text: e.vorgang.text, anzahl: 1, lauf: 1 });
            break;
          case "aktualisiert":
            setListe((l) => l.map((t) => (t.id === tid ? { ...t, text: e.vorgang.text } : t)));
            break;
          case "fertig":
            if (!e.vorgang.still) entferne(tid);
            break;
          case "gesendet":
            entferne(tid);
            break;
          case "fehler": {
            const fehl = (e.ergebnisse || []).filter((r) => !r.ok && r.code !== "netz");
            const r = fehl[0] || {};
            const text = r.fehlerText ? T.fehlgeschlagen(r.fehlerText, grundAus(r)) : T.fehlgeschlagenOhneTitel(grundAus(r));
            ersetze(text, "fehler", { unter: fehl.length > 1 ? T.weitere(fehl.length - 1) : undefined });
            break;
          }
          case "netz":
            ersetze(T.netz, "warnung");
            break;
          case "verworfen":
            ersetze(e.vorgang.anzahl > 1 ? T.rueckgaengigGemachtMehrere(e.vorgang.anzahl) : T.rueckgaengigGemacht, "ok", { icon: "Undo2", dauer: 2500 });
            break;
          case "verwerfenNetz":
            ersetze(T.verwerfenNetz, "fehler");
            break;
          case "verwerfenZuSpaet":
            ersetze(T.schonAusgefuehrt, "warnung");
            break;
          default:
            break;
        }
      }),
    [q, entferne, fuegeHinzu, setListe, zeige]
  );

  // Seite verlassen oder verborgen → per Beacon ausführen (Q-C4); Navigation → sofort ausführen.
  useEffect(() => {
    const weg = () => q.beaconAlle();
    const sicht = () => {
      if (document.visibilityState === "hidden") q.beaconAlle();
    };
    window.addEventListener("pagehide", weg);
    document.addEventListener("visibilitychange", sicht);
    return () => {
      window.removeEventListener("pagehide", weg);
      document.removeEventListener("visibilitychange", sicht);
      q.beaconAlle();
    };
  }, [q]);

  const vorigerPfad = useRef(pfad);
  useEffect(() => {
    if (vorigerPfad.current === pfad) return;
    vorigerPfad.current = pfad;
    q.flush();
  }, [pfad, q]);

  useEffect(() => {
    const t = timer.current;
    return () => {
      for (const v of t.values()) clearTimeout(v.h);
      t.clear();
    };
  }, []);

  // ---------------------------------------------------------------- Tasten (Register: kuerzel/global.js)
  const juengsterZurueck = useCallback(() => {
    const j = q.juengster();
    if (!j) return false;
    q.rueckgaengig(j.id);
    return undefined;
  }, [q]);
  const fokussiere = useCallback(() => {
    const l = listeRef.current.filter((t) => !t.geht);
    const t = l[l.length - 1];
    const el = t && karten.current.get(t.id);
    if (!el) return false;
    (el.querySelector("button") || el).focus();
    return undefined;
  }, []);
  useKuerzel(kiosk ? "kiosk" : "global", {
    "global.rueckgaengig": juengsterZurueck,
    "global.rueckgaengig-z": juengsterZurueck,
    "global.toast": fokussiere,
    "kiosk.rueckgaengig": juengsterZurueck,
  });

  // ---------------------------------------------------------------- Anker
  const anker = ankerLaufzeit || toastAnker || (kiosk ? "unten-mitte" : "unten-rechts");
  // Element-Anker erst nach dem Einhängen auflösen (das Ziel ist Teil der Seite, die gerade rendert).
  const ankerId = typeof anker === "string" && anker.startsWith("#") ? anker.slice(1) : "";
  const ankerEl = useSyncExternalStore(
    useCallback((neu) => {
      if (!ankerId) return () => {};
      const r = requestAnimationFrame(neu);
      return () => cancelAnimationFrame(r);
    }, [ankerId]),
    () => (ankerId ? document.getElementById(ankerId) : null),
    () => null
  );

  // Entwicklungs-Haken für E2E/Abnahme-Bilder (nie im Produktions-Build).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return undefined;
    window.__phBoToast = { zeige, starte: q.starte, flush: q.flush, juengster: q.juengster, anzahl: q.anzahl };
    return () => {
      if (window.__phBoToast?.zeige === zeige) delete window.__phBoToast;
    };
  }, [q, zeige]);

  const wert = useMemo(() => ({ zeige, entferne, kiosk, setzeAnker: setAnkerLaufzeit }), [zeige, entferne, kiosk]);

  // ---------------------------------------------------------------- Darstellung
  const max = kiosk ? 2 : 3;
  const aktiv = liste.filter((t) => !t.geht);
  const aufgeklappt = offen && aktiv.length > max;
  const verborgen = aufgeklappt ? 0 : Math.max(0, aktiv.length - max);
  const verborgenIds = new Set(aktiv.slice(0, verborgen).map((t) => t.id));
  const sichtbar = liste.filter((t) => !verborgenIds.has(t.id));
  const oben = anker === "oben-mitte";

  const stapel = (
    <div aria-live="polite" aria-atomic="false" aria-label={T.meldungen} role="region" data-testid="toast-bereich" data-bo-kiosk={kiosk && oben ? "" : undefined} className={cx("pointer-events-none z-[70] flex gap-2 [[data-bo-kundenmodus=an]_&]:hidden", ankerEl ? "flex-col" : cx(ANKER[anker] || ANKER["unten-rechts"], oben ? "flex-col-reverse" : "flex-col"))}>
      {verborgen > 0 && (
        <button type="button" onClick={() => setOffen(true)} className="bo-knopf bo-material pointer-events-auto inline-flex min-h-(--bo-control-h-s) items-center gap-1.5 self-center rounded-pill px-3 text-[12px] font-medium text-bo-text-soft md:self-end" data-testid="toast-weitere">
          <Icon name="Layers" className="size-3.5" />
          {T.weitere(verborgen)}
        </button>
      )}
      {aufgeklappt && (
        <button type="button" onClick={() => setOffen(false)} className="bo-knopf bo-material pointer-events-auto inline-flex min-h-(--bo-control-h-s) items-center self-center rounded-pill px-3 text-[12px] font-medium text-bo-text-soft md:self-end">
          {T.wenigerZeigen}
        </button>
      )}
      {sichtbar.map((t) => (
        <ToastEintrag key={t.id} t={t} v={t.vorgangId ? vorgaenge.get(t.vorgangId) : null} q={q} reduziert={reduziert} karten={karten} entferne={entferne} pausiereTimer={pausiereTimer} weiterTimer={weiterTimer} />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={wert}>
      <CommitKontext.Provider value={q}>
        {children}
        {ankerEl ? createPortal(stapel, ankerEl) : stapel}
      </CommitKontext.Provider>
    </ToastContext.Provider>
  );
}

function ToastEintrag({ t, v, q, reduziert, karten, entferne, pausiereTimer, weiterTimer }) {
  const undo = t.art === "undo";
  const sekunden = useSekunden(undo && v ? v.frist : 0, !!v?.pausiert, v?.rest || 0);
  const [beruehrt, setBeruehrt] = useState(false);
  const setzeRef = (el) => {
    if (el) karten.current.set(t.id, el);
    else karten.current.delete(t.id);
  };
  const pause = () => (undo ? v && q.pausiere(v.id) : pausiereTimer(t.id));
  const weiter = () => {
    setBeruehrt(false);
    if (undo) {
      if (v) q.fortsetzen(v.id);
    } else weiterTimer(t.id);
  };
  return (
    <ToastKarte
      kartenRef={setzeRef}
      testid={undo ? "toast-undo" : "toast"}
      art={t.art}
      text={undo && v ? v.text : t.text}
      unter={t.unter}
      icon={t.icon}
      anzahl={undo ? 1 : t.anzahl}
      aktion={t.aktion}
      geht={t.geht}
      ms={v?.ms}
      lauf={v?.lauf || t.lauf}
      pausiert={undo ? !!v?.pausiert || beruehrt : beruehrt}
      sekunden={sekunden}
      reduziert={reduziert}
      onPause={(e) => {
        if (e?.pointerType === "touch") setBeruehrt(true);
        pause();
      }}
      onWeiter={weiter}
      onRueckgaengig={() => v && q.rueckgaengig(v.id)}
      onJetzt={() => v && q.jetzt(v.id)}
      onSchliessen={() => {
        // Schließen eines Undo-Toasts führt aus (nie still verwerfen).
        if (undo && v) q.jetzt(v.id);
        else entferne(t.id);
      }}
    />
  );
}

/** { zeige(text, {art, dauer, unter, icon, aktion}), entferne(id), kiosk } – ohne Provider wirkungslos. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { zeige: () => {}, entferne: () => {}, kiosk: false, setzeAnker: () => {} };
  return ctx;
}

/**
 * Meldungen dieser Seite an einen Ort binden (Kiosk, K-05): "#element-id" (Kassa: linke Spalte),
 * "unten-mitte" (Packtisch), "oben-mitte". Beim Verlassen der Seite gilt wieder der Standard.
 */
export function useToastAnker(anker) {
  const { setzeAnker } = useToast();
  useEffect(() => {
    setzeAnker(anker || null);
    return () => setzeAnker(null);
  }, [anker, setzeAnker]);
}

/** Zeigt beim Einhängen einmal einen Toast (für Server-Ergebnisse via searchParams). */
export function ToastBeimLaden({ text, art = "ok" }) {
  const { zeige } = useToast();
  useEffect(() => {
    if (text) zeige(text, { art });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return null;
}
