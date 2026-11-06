"use client";
// Einlösen (Konzept §3.5.7): Popover an der Vorteil-Kachel mit bis zu 5 offenen Belegen – ein Klick auf eine
// Zeile = Einlösung als verzögerter Commit (8 s Rückgängig). Lieferung/Montage/Pflege nur mit Beleg;
// „Ohne Beleg“ nur bei Persönlich und Event. Fehler nach Ablauf: Kachel zurück, Fehler-Toast mit Klartext.

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { Icon } from "../icons";
import { Popover } from "../Overlay";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { belegSuchenAction, belegeAction, einloesenPlanenAction } from "@/lib/backoffice/kundenkarte/actions";
import { EINLOESE_FEHLER, ohneBelegErlaubt } from "@/lib/backoffice/kundenkarte/regeln";
import { ORTE } from "@/lib/backoffice/kundenkarte/labels";
import { datum } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";

const BELEG_ICON = { "PH Bestellung": "Package", "PH Kassenbeleg": "Receipt", "PH Rechnung": "FileText", "PH Serviceauftrag": "Wrench", "PH Pflege Abo": "Sparkles", "PH Event": "CalendarDays", "PH Auftragsbestaetigung": "ScrollText", "PH Lieferschein": "Truck" };

/** Gemeinsamer Ablauf: planen → optimistisch → Toast mit Rückgängig → Ergebnis. */
export function useEinloesen({ karte, kunde }) {
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const router = useRouter();
  return async function einloesen({ vorteil, titel, beleg, ort, kommentar }, { onOptimistisch, onZurueck } = {}) {
    const r = await einloesenPlanenAction({ karte, vorteil, bezugDoctype: beleg?.doctype || null, bezug: beleg?.name || null, kommentar, ort });
    if (!r?.ok) {
      zeige(r?.message || T.fehler.allgemein, { art: "fehler", unter: titel });
      return false;
    }
    onOptimistisch?.();
    starte(T.einloesen.toast(titel), {
      token: r.token,
      ms: r.ms,
      objekt: r.objekt,
      fehlerText: T.einloesen.fehlerVerlassen(kunde, ""),
      onVerworfen: () => onZurueck?.("verworfen"),
      onFehler: (e) => {
        onZurueck?.("fehler", e);
        const code = e?.ergebnis?.detail?.code || e?.detail?.code;
        zeige(`${T.einloesen.fehlerVerlassen(kunde, EINLOESE_FEHLER[code] || e?.message || e?.ergebnis?.message || "")}`, { art: "fehler", aktion: { titel: "Zur Karte", onClick: () => router.push(`/kundenkarte/karten/${karte}`) } });
      },
      onErfolg: () => router.refresh(),
    });
    return true;
  };
}

/** Belegliste + Suche + „Mehr“ (Ort, Kommentar). `onWahl({beleg|null, ort, kommentar})`. */
export function BelegWahl({ karte, vorteil, art, onWahl, autoFokus = true }) {
  const id = useId();
  const [d, setD] = useState(null);
  const [q, setQ] = useState("");
  const [suche, setSuche] = useState(null);
  const [mehr, setMehr] = useState(false);
  const [ort, setOrt] = useState("Showroom");
  const [kommentar, setKommentar] = useState("");
  const [lauf, setLauf] = useState(0);
  const [, starteTr] = useTransition();
  useEffect(() => {
    let aktiv = true;
    belegeAction({ karte, vorteil }).then((r) => aktiv && setD(r));
    return () => {
      aktiv = false;
    };
  }, [karte, vorteil, lauf]);
  useEffect(() => {
    if (q.trim().length < 3) return undefined;
    const h = setTimeout(() => starteTr(async () => setSuche(await belegSuchenAction({ karte, vorteil, q }))), 250);
    return () => clearTimeout(h);
  }, [q, karte, vorteil]);
  const ohne = ohneBelegErlaubt(art);
  const liste = q.trim().length >= 3 ? suche?.belege || [] : d?.belege || [];
  const zeile = (b) => (
    <li key={`${b.doctype}-${b.name}`}>
      <button type="button" className="bo-kk-scan__treffer" onClick={() => onWahl({ beleg: b, ort, kommentar })} data-testid={`kk-beleg-${b.name}`}>
        <Icon name={BELEG_ICON[b.doctype] || "FileText"} className="size-4 flex-none text-bo-text-soft" />
        <span className="bo-kk-mono w-36 flex-none truncate text-[13px]">{b.name}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-bo-text-soft">{[b.datum ? datum(b.datum) : null, b.info].filter(Boolean).join(" · ")}</span>
      </button>
    </li>
  );
  return (
    <div className="flex w-full flex-col gap-2">
      <p id={`${id}-t`} className="px-1 text-[13px] font-medium text-bo-text-soft">
        {T.einloesen.beleg}
      </p>
      {!d ? (
        <div aria-busy="true" className="flex flex-col gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="bo-skeleton block h-11 w-full rounded-2xl" />
          ))}
        </div>
      ) : !d.ok ? (
        <div className="flex items-center gap-2 px-1 text-[13px]">
          <span>{T.einloesen.sucheAus}</span>
          <Knopf size="s" variant="ghost" onClick={() => (setD(null), setLauf((x) => x + 1))}>
            Erneut
          </Knopf>
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5" aria-labelledby={`${id}-t`} data-testid="kk-belege">
          {liste.map(zeile)}
          {liste.length === 0 && <li className="px-3 py-2 text-[13px] text-bo-text-soft">{q.trim().length >= 3 ? "Kein passender Beleg." : T.einloesen.keineBelege}</li>}
        </ul>
      )}
      <div className="relative">
        <Icon name="Search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-bo-text-soft" />
        <input
          className="bo-kk-feld pl-9 text-[14px]"
          aria-label={T.einloesen.suchen}
          placeholder={T.einloesen.suchen}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFokus}
          data-scan="ja"
        />
      </div>
      {ohne ? (
        <button type="button" className="bo-kk-scan__treffer" onClick={() => onWahl({ beleg: null, ort, kommentar })} data-testid="kk-ohne-beleg">
          <Icon name="CircleDashed" className="size-4 text-bo-text-soft" />
          <span className="text-[14px]">{T.einloesen.ohneBeleg}</span>
        </button>
      ) : (
        <p className="px-1 text-[12px] text-bo-text-faint">{T.einloesen.pflicht}</p>
      )}
      <button type="button" className="flex items-center gap-1.5 px-1 text-[13px] text-bo-text-soft" aria-expanded={mehr} onClick={() => setMehr((m) => !m)}>
        <Icon name={mehr ? "ChevronDown" : "ChevronRight"} className="size-3.5" />
        {T.einloesen.mehr}
      </button>
      {mehr && (
        <div className="grid grid-cols-1 gap-2 px-1">
          <label className="text-[13px]">
            <span className="bo-kk-label">{T.einloesen.ort}</span>
            <select className="bo-kk-feld" value={ort} onChange={(e) => setOrt(e.target.value)}>
              {ORTE.filter((o) => o !== "Kassa" && o !== "Packtisch").map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label className="text-[13px]">
            <span className="bo-kk-label">{T.einloesen.kommentar}</span>
            <input className="bo-kk-feld" value={kommentar} maxLength={500} onChange={(e) => setKommentar(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}

/** Popover an der Kachel: Auslöser = Knopf „Einlösen“. */
export function EinloesePopover({ karte, kunde, vorteil, onEingeloest, onZurueck, knopfRef, breit = false }) {
  const [offen, setOffen] = useState(false);
  const einloesen = useEinloesen({ karte, kunde });
  return (
    <Popover
      label={T.einloesen.titel(vorteil.titel)}
      rolle="dialog"
      fokusfalle
      breite={380}
      offen={offen}
      onOffen={setOffen}
      platzierung="unten-start"
      testid={`kk-einloesen-${vorteil.vorteil}`}
      ausloeser={(p) => (
        <Knopf
          {...p}
          ref={(el) => {
            p.ref.current = el;
            if (knopfRef) knopfRef.current = el;
          }}
          size="s"
          variant="secondary"
          icon="Sparkles"
          className={breit ? "w-full justify-center" : undefined}
          data-testid={`kk-einloesen-knopf-${vorteil.vorteil}`}
        >
          {T.vorteile.einloesen}
        </Knopf>
      )}
    >
      <div className="flex w-[min(380px,calc(100vw-48px))] flex-col gap-2 p-3">
        <p className="px-1 text-[15px] font-semibold">{T.einloesen.titel(vorteil.titel)}</p>
        <BelegWahl
          karte={karte}
          vorteil={vorteil.vorteil}
          art={vorteil.art}
          onWahl={async (w) => {
            setOffen(false);
            await einloesen({ vorteil: vorteil.vorteil, titel: vorteil.titel, ...w }, { onOptimistisch: () => onEingeloest?.(vorteil), onZurueck: (grund) => onZurueck?.(vorteil, grund) });
          }}
        />
      </div>
    </Popover>
  );
}
