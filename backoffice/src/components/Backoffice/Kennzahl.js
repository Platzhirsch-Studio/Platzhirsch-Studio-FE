import Link from "next/link";
import cx from "./cx";
import { Icon } from "./icons";
import { PfeilKnopf } from "./Knopf";
import Zahl, { ErneutKnopf } from "./Charts/Zahl";
import { Sparkline } from "./Charts";
import { formatiere, trendBewertung, zielAnteil } from "./Charts/logik";

export const TEXTE = {
  keinVergleich: "Kein Vergleich",
  nichtGeladen: "Nicht geladen",
  erneut: "Erneut",
  laedt: "Wird geladen",
  ziel: "Ziel",
  oeffnen: "Öffnen",
};

// Trend als weiche Pille: Farbe nach Bedeutung, nicht nach Richtung.
const TREND_PILLE = {
  gut: "bg-bo-success-soft text-bo-success-text",
  schlecht: "bg-bo-danger-soft text-bo-danger-text",
  neutral: "bg-bo-fill-2 text-bo-text-soft",
};
const TREND_ZEICHEN = { auf: "ArrowUp", ab: "ArrowDown" };

/**
 * Kennzahl-Kachel im Lounge-Stil (lounge.md §5/§6, 03 §8.14): schwebende Kachel ohne Rahmen,
 * Bezeichnung 13/500, große leichte Zahl 34/400 mit Tabellenziffern (schmale Kacheln 28),
 * Einheit 17 gedämpft, Trend als weiche Pille, bei `href` runder Pfeil-Knopf unten rechts, der sich
 * beim Hover der Kachel dreht. `ton="cognac"|"salbei"` macht daraus eine Akzentkachel mit sehr
 * großer Zahl (64/300) – höchstens zwei je Bildschirm.
 * Server-Komponente; die Zahl ist das Client-Kind `Zahl` (zählt beim Erscheinen hoch, später nur
 * bei Änderung; Kiosk und reduzierte Bewegung nie).
 *
 * @param {object} p
 * @param {string} p.titel           Bezeichnung, bricht mit Silbentrennung um
 * @param {number|string|null} [p.wert]  Zahl → `Zahl` (mit `format`), Text → wie geliefert, null → „–“
 * @param {"zahl"|"dezimal"|"cent"|"cent-rund"|"prozent"} [p.format]  nur für Zahlen
 * @param {string} [p.einheit]       kleiner Zusatz hinter der Zahl („Stk.“, „T€“)
 * @param {import("react").ReactNode} [p.zusatz]  Fußtext (z. B. Summe)
 * @param {string} [p.href]          ganze Kachel ist Link (Pfeil-Knopf unten rechts)
 * @param {{richtung:"auf"|"ab"|"gleich", text:string, gut?:"hoch"|"niedrig"|"neutral"}|null} [p.trend]
 *        Farbe nach Bedeutung: `gut:"niedrig"` für Überfälliges (↑ = rot). `trend === null` → „Kein Vergleich“.
 * @param {number[]} [p.verlauf]     Sparkline 64×20
 * @param {{wert:number, ziel:number, text?:string}} [p.ziel]  4-px-Fortschritt unter dem Wert
 * @param {string} [p.hilfe]         Info-Symbol mit Tooltip
 * @param {boolean} [p.laedt]        Skeleton in Zielform
 * @param {boolean|string} [p.fehler] Wert „–“, Fuß „Nicht geladen · Erneut“ (Text überschreibbar)
 * @param {boolean} [p.kiosk]        Zahl zählt nie (nur Farbimpuls)
 * @param {boolean} [p.hochzaehlen]  beim Erscheinen hochzählen (Standard ja, außer Kiosk)
 * @param {"cognac"|"salbei"} [p.ton] Akzentkachel
 */
export default function Kennzahl({ titel, wert, format = "zahl", einheit, zusatz, href, trend, verlauf, ziel, hilfe, laedt = false, fehler = false, kiosk = false, hochzaehlen, ton, className, testid }) {
  const akzent = ton === "cognac" || ton === "salbei" ? ton : null;
  const klassen = cx(
    "@container group relative flex min-h-32 min-w-0 flex-col",
    akzent ? "bo-kachel bo-akzent" : "bo-kachel bo-kachel--dicht",
    href && !laedt && !fehler && "bo-kachel--lift",
    className
  );
  const zaehlen = hochzaehlen ?? !kiosk;

  if (laedt) {
    return (
      <div className={cx("@container relative flex min-h-32 min-w-0 flex-col bo-kachel bo-kachel--dicht", className)} aria-busy="true" data-testid={testid}>
        <span className="sr-only" role="status">
          {titel}: {TEXTE.laedt}
        </span>
        <span aria-hidden="true" className="bo-skeleton block h-3.5 w-24" />
        <span aria-hidden="true" className="bo-skeleton mt-4 block h-8 w-32 rounded-bo" />
        <span aria-hidden="true" className="bo-skeleton mt-3 block h-3 w-20" />
      </div>
    );
  }

  const leer = wert === null || wert === undefined || fehler;
  const istZahl = typeof wert === "number" && Number.isFinite(wert);
  const bewertung = trend ? trendBewertung(trend.richtung, trend.gut) : "neutral";
  const zahlKlasse = akzent ? "bo-akzent__zahl" : "text-[28px] leading-8 font-normal tracking-[-0.03em] @[15rem]:text-[34px] @[15rem]:leading-9";

  const zahl = (
    <p className={cx("min-w-0 truncate tabular-nums", zahlKlasse)}>
      {leer ? <span className={akzent ? "opacity-70" : "text-bo-text-faint"}>–</span> : istZahl ? <Zahl wert={wert} format={format} kiosk={kiosk} hochzaehlen={zaehlen} /> : <span>{wert}</span>}
      {!leer && einheit && <span className={cx("ml-1 text-[17px] tracking-[-0.01em]", akzent ? "opacity-80" : "text-bo-text-soft")}>{einheit}</span>}
    </p>
  );

  const fuss = fehler ? (
    <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] text-bo-text-soft">
      <span>{typeof fehler === "string" ? fehler : TEXTE.nichtGeladen}</span>
      <span aria-hidden="true">·</span>
      <span className="relative z-10">
        <ErneutKnopf>{TEXTE.erneut}</ErneutKnopf>
      </span>
    </p>
  ) : (
    (zusatz || trend !== undefined) && (
      <p className={cx("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px]", akzent ? "opacity-90" : "text-bo-text-soft")}>
        {trend === null && <span className={akzent ? "" : "text-bo-text-faint"}>{TEXTE.keinVergleich}</span>}
        {trend && (
          <span className={cx("bo-pille h-6 gap-1 px-2.5 text-xs", akzent ? "bg-white/20" : TREND_PILLE[bewertung])}>
            {TREND_ZEICHEN[trend.richtung] ? <Icon name={TREND_ZEICHEN[trend.richtung]} className="size-3" strokeWidth={2.25} /> : <span aria-hidden="true">·</span>}
            <span className="sr-only">{trend.richtung === "auf" ? "gestiegen:" : trend.richtung === "ab" ? "gesunken:" : "unverändert:"}</span>
            {trend.text}
          </span>
        )}
        {zusatz && <span className="min-w-0 tabular-nums">{zusatz}</span>}
      </p>
    )
  );

  const inhalt = (
    <>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className={cx("min-w-0 hyphens-auto break-words text-[13px] font-medium leading-[18px]", akzent ? "bo-akzent__cap" : "text-bo-text-soft")} lang="de">
          {titel}
        </p>
        {hilfe && (
          <span className={cx("bo-tip relative z-10 inline-flex shrink-0", akzent ? "opacity-80" : "text-bo-text-faint")} data-tip={hilfe} aria-label={hilfe} tabIndex={href ? undefined : 0} role="img">
            <Icon name="Info" className="size-4" />
          </span>
        )}
      </div>

      {akzent ? (
        <div className="mt-auto flex min-w-0 items-end justify-between gap-3 pt-6">
          <div className="min-w-0">
            {zahl}
            {fuss && <div className="mt-3">{fuss}</div>}
          </div>
          {href && !fehler && <PfeilKnopf nurOptik hell={akzent === "cognac"} />}
        </div>
      ) : (
        <>
          <div className="mt-3 flex min-w-0 items-end justify-between gap-3">
            {zahl}
            {!leer && verlauf && verlauf.length > 1 && <Sparkline werte={verlauf} breite={64} hoehe={20} label={`${titel} – Verlauf`} />}
          </div>

          {!leer && ziel && (
            <div className="mt-3">
              <div className="h-1 overflow-hidden rounded-pill bg-bo-fill-2" role="progressbar" aria-label={ziel.text || TEXTE.ziel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(zielAnteil(ziel.wert, ziel.ziel))}>
                <div className="h-full rounded-pill bg-bo-action" style={{ width: `${zielAnteil(ziel.wert, ziel.ziel)}%` }} />
              </div>
              {ziel.text && <p className="mt-1.5 text-xs text-bo-text-soft">{ziel.text}</p>}
            </div>
          )}

          {(fuss || (href && !fehler)) && (
            <div className="mt-auto flex min-w-0 items-end justify-between gap-3 pt-3">
              <div className="min-w-0">{fuss}</div>
              {href && !fehler && <PfeilKnopf nurOptik groesse="s" />}
            </div>
          )}
        </>
      )}
    </>
  );

  if (href && !fehler) {
    return (
      <Link href={href} className={klassen} data-testid={testid} data-ton={akzent || undefined}>
        {inhalt}
      </Link>
    );
  }
  return (
    <div className={klassen} data-testid={testid} data-ton={akzent || undefined}>
      {inhalt}
    </div>
  );
}

/** Kennzahl-Wert als Text (für Tabellen/Tooltips mit gleicher Formatierung). */
export function kennzahlText(wert, format = "zahl") {
  return formatiere(wert, format);
}
