"use client";
// Stempeluhr (Konzept § 4, E6): Pille in der Kopfzeile (Shell-Slot) mit Popover, Stempelkarte in „Mein Bereich“,
// Kiosk-Knopf. Kommen = verzögerter Commit (8 s, Kiosk 6 s, Toast „Kommen 07:55 · Rückgängig“), Gehen = sofort mit
// Gegenaktion (Gehen leeren). Nach Gehen mit vorgeschlagener Pause: „30 min Pause genommen? Ja · Andere Dauer“.
// Kein Einzeltasten-Kürzel. Zeit tabellarisch, Aktualisierung minütlich, aria-live nur für Ansagen.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, useTransition } from "react";
import Popover from "../Overlay/Popover";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { Haken } from "../motion";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { stempelnAction, gehenZuruecknehmenAction, pauseSetzenAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { hmText, tagTitel, iso, minZeit, tagessollMin } from "@/lib/backoffice/personal/zeit";
import "./personal.css";
import { useWechsel } from "./hooks";

const jetztZeit = () => minZeit(new Date().getHours() * 60 + new Date().getMinutes());

/** Minütlicher Takt (hydrationssicher: erst nach dem Einhängen). */
function useMinute() {
  const [t, setT] = useState(null);
  useEffect(() => {
    const erst = setTimeout(() => setT(Date.now()), 0);
    const h = setInterval(() => setT(Date.now()), 30_000);
    return () => {
      clearTimeout(erst);
      clearInterval(h);
    };
  }, []);
  return t;
}

/**
 * Gemeinsame Logik: Zustand (im Dienst seit, bisher), Kommen (A), Gehen (B), Pause-Frage.
 * @param {{offen:{name:string,kommen:string}|null, bisherMin:number, abgeschlossenMin:number, stand:string}} start
 */
export function useStempeluhr(start, { kiosk = false } = {}) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [offen, setOffen] = useState(start?.offen || null);
  const [laeuft, setLaeuft] = useState(false);
  const [pause, setPause] = useState(null); // { buchung, minuten }
  const [ansage, setAnsage] = useState("");
  const [, startTransition] = useTransition();
  const takt = useMinute();
  useWechsel(start?.offen?.name || null, () => setOffen(start?.offen || null));

  const bisherMin = (() => {
    if (!takt) return start?.bisherMin || 0;
    const d = new Date(takt);
    const jetzt = d.getHours() * 60 + d.getMinutes();
    const [h, m] = String(offen?.kommen || "").split(":").map(Number);
    const lauf = offen && Number.isFinite(h) ? Math.max(0, jetzt - (h * 60 + m)) : 0;
    return (start?.abgeschlossenMin || 0) + lauf;
  })();

  const kommen = useCallback(async () => {
    if (laeuft) return;
    setLaeuft(true);
    const zeit = jetztZeit();
    const r = await stempelnAction();
    setLaeuft(false);
    if (!r.ok) return zeige(r.message || T.fehler.allgemein, { art: r.code === "conflict" ? "warnung" : "fehler" });
    if (r.art === "kommen") {
      const vorher = offen;
      setOffen({ name: "neu", kommen: zeit });
      setAnsage(T.stempel.ansageKommen(zeit));
      starte(T.stempel.kommenGebucht(zeit), {
        token: r.token,
        ms: r.ms,
        objekt: r.objekt,
        gruppe: "personal.kommen",
        fehlerText: T.stempel.kommen,
        onVerworfen: () => setOffen(vorher),
        onFehler: () => setOffen(vorher),
        onErfolg: () => startTransition(() => router.refresh()),
      });
      return;
    }
    // Gehen: sofort gebucht, Rückgängig = Gehen leeren (Variante B)
    const warOffen = offen;
    setOffen(null);
    setAnsage(T.stempel.ansageGehen(zeit));
    if (r.pause) setPause({ buchung: r.buchung, minuten: r.pause });
    zeige(r.meldung || T.stempel.gehenGebucht(zeit, ""), {
      art: "ok",
      aktion: {
        titel: T.zeiten.rueck,
        onClick: async () => {
          const z = await gehenZuruecknehmenAction({ buchung: r.buchung });
          if (!z.ok) return zeige(z.message, { art: "fehler" });
          setPause(null);
          setOffen(warOffen);
          zeige(T.stempel.gehenRueck, { art: "info" });
          startTransition(() => router.refresh());
        },
      },
    });
    startTransition(() => router.refresh());
  }, [laeuft, offen, router, starte, zeige]);

  const pauseSetzen = useCallback(
    async (minuten) => {
      if (!pause) return { ok: false };
      const r = await pauseSetzenAction({ buchung: pause.buchung, minuten });
      if (!r.ok) {
        zeige(r.message, { art: r.keinePause ? "warnung" : "fehler", dauer: r.keinePause ? 9000 : undefined });
        return r;
      }
      zeige(T.stempel.pauseGespeichert(r.pause), { art: "ok" });
      setPause(null);
      startTransition(() => router.refresh());
      return r;
    },
    [pause, router, zeige]
  );

  void kiosk;
  return { offen, imDienst: Boolean(offen), bisherMin, kommen, laeuft, pause, pauseSetzen, ansage };
}

/** „30 min Pause genommen? [Ja] [Andere Dauer]“ – Minuten als Zahl (inputmode numeric). */
export function PauseFrage({ pause, onSetzen, kompakt = false }) {
  const [andere, setAndere] = useState(false);
  const [wert, setWert] = useState(String(pause?.minuten || 30));
  const [fehler, setFehler] = useState(null);
  const id = useId();
  if (!pause) return null;
  const senden = async (m) => {
    const r = await onSetzen(m);
    if (!r?.ok) setFehler(r?.message || null);
  };
  return (
    <div className="bo-per-band-hinweis" data-ton="eiche" role="group" aria-labelledby={`${id}-t`} data-testid="per-pause-frage">
      <Icon name="Clock" className="mt-0.5 size-4 flex-none" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span id={`${id}-t`} className="font-medium text-bo-text">
          {T.stempel.pauseFrage(pause.minuten)}
        </span>
        {!andere ? (
          <div className="flex flex-wrap gap-2">
            <Knopf size="s" variant="secondary" onClick={() => senden(pause.minuten)} data-testid="per-pause-ja">
              {T.stempel.pauseJa}
            </Knopf>
            <Knopf size="s" variant="ghost" onClick={() => setAndere(true)}>
              {T.stempel.pauseAndere}
            </Knopf>
          </div>
        ) : (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              senden(Number(wert));
            }}
          >
            <label className="bo-per-feld">
              <span>{T.stempel.pauseMinuten}</span>
              <input className="bo-per-zeitfeld" inputMode="numeric" enterKeyHint="done" value={wert} onChange={(e) => setWert(e.target.value.replace(/\D/g, "").slice(0, 3))} aria-invalid={fehler ? "true" : undefined} autoFocus />
            </label>
            <Knopf size="s" variant="secondary" type="submit">
              {T.speichern}
            </Knopf>
          </form>
        )}
        {fehler && <span className="text-[12px] leading-4">{fehler}</span>}
      </div>
      {!kompakt && null}
    </div>
  );
}

function Hauptknopf({ uhr, testid }) {
  const [zeit, setZeit] = useState("");
  useEffect(() => {
    const erst = setTimeout(() => setZeit(jetztZeit()), 0);
    const h = setInterval(() => setZeit(jetztZeit()), 15_000);
    return () => {
      clearTimeout(erst);
      clearInterval(h);
    };
  }, []);
  return (
    <button type="button" className="bo-per-stempel__haupt" onClick={uhr.kommen} disabled={uhr.laeuft} aria-busy={uhr.laeuft || undefined} data-testid={testid}>
      {uhr.imDienst ? T.stempel.gehen : T.stempel.kommen}
      <small suppressHydrationWarning>{zeit ? T.stempel.jetzt(zeit) : " "}</small>
    </button>
  );
}

/**
 * Stempelpille für die Kopfzeile (Shell `kopfSlot`, Konzept § 4.1). Ohne Mitarbeiter-Datensatz: nichts.
 * @param {{stempel:object}} p  Ergebnis von daten.ladeStempel()
 */
export function StempelPille({ stempel }) {
  const uhr = useStempeluhr(stempel);
  const heute = iso(new Date());
  if (!stempel?.mitarbeiter) return null;
  const soll = tagessollMin(stempel.mitarbeiter.wochenstunden);
  return (
    <>
      <Popover
        label={T.stempel.pilleLabel}
        platzierung="unten-ende"
        breite={320}
        testid="per-stempel-popover"
        ausloeser={(p) => (
          <button type="button" {...p} className="bo-per-pille" data-dienst={uhr.imDienst ? "ja" : "nein"} data-testid="per-stempelpille">
            <span className="bo-per-pille__punkt" aria-hidden="true" />
            <span>{uhr.imDienst ? T.stempel.imDienst(uhr.offen.kommen) : T.stempel.nichtImDienst}</span>
            {uhr.imDienst && (
              <span className="bo-per-pille__zeit" suppressHydrationWarning>
                · {hmText(uhr.bisherMin)}
              </span>
            )}
          </button>
        )}
      >
        <div className="bo-per-stempel">
          <span className="bo-per-stempel__tag" suppressHydrationWarning>
            {tagTitel(heute)}
          </span>
          <div className="bo-per-stempel__bisher">
            <span className="text-[13px] text-bo-text-soft">{T.stempel.heuteBisher}</span>
            <span className="bo-per-stempel__zahl" suppressHydrationWarning>
              {hmText(uhr.bisherMin)}
            </span>
          </div>
          <div className="bo-per-fortschritt" role="img" aria-label={T.stempel.sollAnteil}>
            <span style={{ width: `${Math.min(100, soll ? (uhr.bisherMin / soll) * 100 : 0)}%` }} />
          </div>
          <Hauptknopf uhr={uhr} testid="per-stempel-knopf" />
          <PauseFrage pause={uhr.pause} onSetzen={uhr.pauseSetzen} kompakt />
          <div className="bo-per-stempel__links">
            <Knopf size="s" variant="secondary" href="/personal/meins?sheet=urlaub" icon="CalendarPlus">
              {T.stempel.urlaub}
            </Knopf>
            <Knopf size="s" variant="secondary" href="/personal/meins?sheet=krank">
              {T.stempel.krank}
            </Knopf>
          </div>
          <Link href="/personal/meins/zeiten" className="bo-per-link inline-flex items-center gap-1 text-[14px]">
            {T.stempel.meineZeiten}
            <Icon name="ArrowRight" className="size-4" />
          </Link>
        </div>
      </Popover>
      <span className="bo-per-sr" aria-live="polite">
        {uhr.ansage}
      </span>
    </>
  );
}

/** Stempelkarte in „Mein Bereich“ (Telefon: Knopf sticky in der Daumenzone). */
export function StempelKarte({ stempel }) {
  const uhr = useStempeluhr(stempel);
  if (!stempel?.mitarbeiter) return null;
  const soll = tagessollMin(stempel.mitarbeiter.wochenstunden);
  return (
    <div className="flex flex-col gap-4" data-testid="per-stempelkarte">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-bo-text-soft">{T.stempel.heuteBisher}</p>
          <p className="bo-zahl-gross mt-1" suppressHydrationWarning data-testid="per-heute-bisher">
            {hmText(uhr.bisherMin)}
          </p>
        </div>
        <p className="text-right text-[13px] text-bo-text-soft">{uhr.imDienst ? T.stempel.kommenUm(uhr.offen.kommen) : stempel.erstesKommen ? T.stempel.kommenUm(stempel.erstesKommen) : T.stempel.keineBuchung}</p>
      </div>
      <div className="bo-per-fortschritt" role="img" aria-label={T.stempel.sollAnteil}>
        <span style={{ width: `${Math.min(100, soll ? (uhr.bisherMin / soll) * 100 : 0)}%` }} />
      </div>
      <div className="max-sm:sticky max-sm:bottom-24 max-sm:z-20">
        <Hauptknopf uhr={uhr} testid="per-stempelkarte-knopf" />
      </div>
      <PauseFrage pause={uhr.pause} onSetzen={uhr.pauseSetzen} />
      <span className="bo-per-sr" aria-live="polite">
        {uhr.ansage}
      </span>
    </div>
  );
}

/**
 * Kiosk-Stempeln Fall A (§ 4.2): angemeldete Person stempelt sich selbst. Knopf ≥ 48 px mit Text für den
 * KioskShell-`kopfSlot`, Dialog mit großem Knopf, Countdown ab 20 s Inaktivität, Ergebnis 2000 ms.
 * Fall B (andere Person mit PIN) erscheint erst mit Fähigkeit `kioskAnderePerson` (hier nicht im DOM).
 */
export function KioskStempeln({ stempel, name }) {
  const uhr = useStempeluhr(stempel, { kiosk: true });
  const [offen, setOffen] = useState(false);
  const [rest, setRest] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const f = () => setOnline(navigator.onLine);
    const erst = setTimeout(f, 0);
    window.addEventListener("online", f);
    window.addEventListener("offline", f);
    return () => {
      clearTimeout(erst);
      window.removeEventListener("online", f);
      window.removeEventListener("offline", f);
    };
  }, []);
  useEffect(() => {
    if (!offen || ergebnis) return undefined;
    let still = 0;
    const tick = setInterval(() => {
      still += 1;
      if (still < 20) return;
      setRest((r) => {
        const n = r == null ? 10 : r - 1;
        if (n <= 0) {
          setOffen(false);
          return null;
        }
        return n;
      });
    }, 1000);
    const wach = () => {
      still = 0;
      setRest(null);
    };
    window.addEventListener("pointerdown", wach);
    window.addEventListener("keydown", wach);
    return () => {
      clearInterval(tick);
      window.removeEventListener("pointerdown", wach);
      window.removeEventListener("keydown", wach);
    };
  }, [offen, ergebnis]);
  if (!stempel?.mitarbeiter) return null;
  const tippen = async () => {
    const art = uhr.imDienst ? T.stempel.gehen : T.stempel.kommen;
    await uhr.kommen();
    setErgebnis(T.kiosk.ergebnis(art, jetztZeit(), name || stempel.mitarbeiter.titel));
    setTimeout(() => {
      setErgebnis(null);
      setOffen(false);
    }, 2000);
  };
  return (
    <>
      <Knopf size="kiosk" variant="secondary" icon="Clock" onClick={() => setOffen(true)} data-testid="per-kiosk-stempeln">
        {T.kiosk.knopf}
      </Knopf>
      <Dialog offen={offen} onSchliessen={() => setOffen(false)} titel={T.kiosk.knopf} groesse="sm" testid="per-kiosk-dialog">
        {ergebnis ? (
          <div className="bo-per-ergebnis" role="status">
            <Haken groesse={28} />
            <span>{ergebnis}</span>
          </div>
        ) : (
          <div className="bo-per-kiosk">
            {!online && <p className="bo-per-band-hinweis" data-ton="eiche">{T.kiosk.offline}</p>}
            <button type="button" className="bo-per-stempel__haupt bo-per-kiosk__haupt" onClick={tippen} disabled={!online || uhr.laeuft} data-testid="per-kiosk-haupt">
              {uhr.imDienst ? T.kiosk.gehen(name || stempel.mitarbeiter.titel) : T.kiosk.kommen(name || stempel.mitarbeiter.titel)}
            </button>
            {rest !== null && (
              <div className="bo-per-kiosk__countdown" role="timer">
                <span className="bo-per-kiosk__balken" aria-hidden="true">
                  <span style={{ width: `${(rest / 10) * 100}%` }} />
                </span>
                <span>{T.kiosk.schliesst(rest)}</span>
                <Knopf size="s" variant="ghost" onClick={() => setRest(null)}>
                  {T.kiosk.offenLassen}
                </Knopf>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
