// Server-taugliche Bausteine des Bereichs Faktura: Altersband (§ 3.1/§ 3.4), Stand-Band des Auftrags (§ 4.3),
// Summenblock (§ 4.1), Zahlungsbalken (Lounge „Beträge“), Pflichtangaben-Liste, Positionen lesend.

import Link from "next/link";
import cx from "../cx";
import { cent } from "@/lib/backoffice/format";
import { AKTE, AUFTRAG, SEITE } from "@/lib/backoffice/faktura/texte";
import { FIcon } from "./teile";

const SEG_FARBE = ["var(--color-bo-salbei)", "var(--color-bo-eiche)", "var(--color-bo-cognac)", "var(--color-bo-ziegel)"];

/** Offene Posten nach Alter: ein Band, Segment = Filter (?alter=), Legende mit Betrag und Anzahl. */
export function AltersBand({ segmente = [], basis = "/faktura/rechnungen?r=offene-posten", aktiv, testid = "altersband" }) {
  const gesamt = segmente.reduce((s, x) => s + x.cent, 0);
  return (
    <div className="flex flex-col gap-3" data-testid={testid}>
      <div className="bo-fk-band" role="img" aria-label={`${SEITE.altersband}: ${segmente.map((s) => `${s.titel} Tage ${cent(s.cent)}`).join(", ")}`}>
        {gesamt === 0 ? (
          <span className="bo-fk-band__seg w-full" style={{ background: "var(--color-bo-fill-2)" }} />
        ) : (
          segmente.map((s, i) =>
            s.cent > 0 ? <Link key={s.id} href={`${basis}&alter=${encodeURIComponent(s.id)}`} className="bo-fk-band__seg" style={{ flexGrow: s.cent, background: SEG_FARBE[i] }} aria-label={`${s.titel} Tage`} tabIndex={-1} /> : null
          )
        )}
      </div>
      <div className="bo-fk-legende">
        {segmente.map((s, i) => (
          <Link key={s.id} href={`${basis}&alter=${encodeURIComponent(s.id)}`} aria-current={aktiv === s.id ? "true" : undefined}>
            <span className="flex items-center gap-1.5 text-[13px] text-bo-text-soft">
              <span className="inline-block size-2 rounded-full" style={{ background: SEG_FARBE[i] }} aria-hidden="true" />
              {s.titel} Tage
            </span>
            <span className="text-[17px] font-medium tabular-nums text-bo-text">{cent(s.cent)}</span>
            <span className="text-[12px] tabular-nums text-bo-text-faint">{s.anzahl} {s.anzahl === 1 ? "Beleg" : "Belege"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Stand-Band (8 px): Fläche Tinte = bezahlt, Schraffur = abgerechnet, Kontur = geliefert; Satz + <dl> für Screenreader. */
export function StandBand({ stand, offenCent }) {
  return (
    <div className="flex flex-col gap-2" data-testid="stand-band">
      <div className="bo-fk-stand" aria-hidden="true">
        <span className="bo-fk-stand__geliefert" style={{ width: `${stand.geliefert}%` }} />
        <span className="bo-fk-stand__abgerechnet" style={{ width: `${stand.abgerechnet}%` }} />
        <span className="bo-fk-stand__bezahlt" style={{ width: `${stand.bezahlt}%` }} />
      </div>
      <p className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-bo-text-soft">
        <span>
          {AUFTRAG.stand(stand.bezahlt, stand.abgerechnet, stand.geliefert)}
          {stand.anzahlungErfuellt ? ` · ${AUFTRAG.anzahlungOk}` : ""}
        </span>
        {offenCent !== undefined && offenCent !== null ? <span className="tabular-nums text-bo-text">{AKTE.offen(cent(offenCent))}</span> : null}
      </p>
      <dl className="sr-only">
        <dt>Bezahlt</dt>
        <dd>{stand.bezahlt} %</dd>
        <dt>Abgerechnet</dt>
        <dd>{stand.abgerechnet} %</dd>
        <dt>Geliefert</dt>
        <dd>{stand.geliefert} %</dd>
      </dl>
    </div>
  );
}

/** Summenblock wie ph_faktura.summenblock (Netto · Rabatt · USt je Satz · Brutto · Anzahlungen · Zahlbar · Bezahlt · Offen). */
export function Summenblock({ s, zahlbalken = true, testid = "summenblock" }) {
  const z = [
    [AKTE.summen.netto, s.netto],
    s.rabatt ? [AKTE.summen.rabatt, s.rabatt] : null,
    ...s.ust.map((u) => [AKTE.summen.ust(String(u.satz).replace(".", ",")), u.cent]),
    [AKTE.summen.brutto, s.brutto, "stark"],
    s.anzahlung ? [AKTE.summen.anzahlung, -s.anzahlung] : null,
    s.anzahlung ? [AKTE.summen.zahlbar, s.zahlbar, "stark"] : null,
    s.bezahlt ? [AKTE.summen.bezahlt, s.bezahlt] : null,
  ].filter(Boolean);
  const bezahltAnteil = s.zahlbar ? Math.min(100, Math.round((s.bezahlt * 100) / s.zahlbar)) : 0;
  return (
    <div className="flex flex-col gap-4" data-testid={testid}>
      <dl className="bo-fk-summen">
        {z.map(([l, w, art]) => (
          <div key={l} className="contents">
            <dt data-stark={art ? "" : undefined}>{l}</dt>
            <dd data-stark={art ? "" : undefined}>{w < 0 ? `−${cent(-w)}` : cent(w)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-end justify-between gap-3 pt-1">
        <span className="text-[13px] font-medium text-bo-text-soft">{AKTE.summen.offen}</span>
        <span className="bo-fk-summen" data-testid="summe-offen">
          <span data-gross="">{cent(s.offen)}</span>
        </span>
      </div>
      {zahlbalken && s.zahlbar > 0 && (
        <div className="bo-fk-zahlbalken" aria-hidden="true">
          {bezahltAnteil > 0 && <span style={{ flexGrow: bezahltAnteil, background: "var(--color-bo-salbei)" }} />}
          {s.offen > 0 && <span style={{ flexGrow: 100 - bezahltAnteil, background: "var(--color-bo-eiche)" }} />}
        </div>
      )}
    </div>
  );
}

/** Pflichtangaben-Prüfer (lesend, Server): Liste mit „Zum Feld“. */
export function PflichtListe({ pruefung, basis }) {
  if (!pruefung) return null;
  const offen = pruefung.befunde.filter((b) => b.blockiert);
  if (!offen.length)
    return (
      <p className="flex items-center gap-2 text-[14px] text-bo-salbei-text" data-testid="pflicht-ok">
        <FIcon name="Check" className="size-4" /> Pflichtangaben vollständig
      </p>
    );
  return (
    <ul className="flex flex-col gap-1.5" data-testid="pflicht-liste">
      {offen.map((b) => (
        <li key={b.id} className="flex items-center justify-between gap-3 rounded-bo-zeile bg-bo-fill px-3 py-2 text-[13px]">
          <span className="flex items-center gap-2">
            <FIcon name="TriangleAlert" className="size-3.5 text-bo-eiche-text" />
            {b.text}
          </span>
          <Link href={`${basis}?tab=${b.tab}#${b.feld}`} className="whitespace-nowrap font-medium text-bo-text-soft hover:underline">
            Zum Feld →
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Positionen lesend (gestellte Belege, Präsentation ohne EK/Marge). */
export function PositionenLesend({ positionen = [], mitEinkauf = false, mengenInfo = false }) {
  if (!positionen.length) return <p className="py-6 text-center text-[14px] text-bo-text-soft">Keine Positionen.</p>;
  return (
    <div className="bo-scroll-x overflow-x-auto">
      <table className="bo-fk-pos min-w-[640px]" data-testid="positionen">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Bezeichnung</th>
            <th>Raum</th>
            <th className="text-right">Menge</th>
            <th className="text-right">Einzelpreis</th>
            {mengenInfo && <th className="text-right">geliefert/abgerechnet</th>}
            {mitEinkauf && <th className="text-right">Einkauf</th>}
            <th className="text-right">USt</th>
            <th className="text-right">Netto</th>
          </tr>
        </thead>
        <tbody>
          {positionen.map((p, i) => (
            <tr key={p.name || i} data-alternativ={p.alternativ ? "" : undefined}>
              <td className="tabular-nums text-bo-text-faint">{p.pos || i + 1}</td>
              <td className="min-w-56">
                <span className="block font-medium text-bo-text">{p.bezeichnung}</span>
                {(p.marke || p.alternativ) && <span className="block text-[12px] text-bo-text-faint">{[p.marke, p.alternativ ? AKTE.alternativ : null].filter(Boolean).join(" · ")}</span>}
              </td>
              <td className="text-bo-text-soft">{p.raum || "–"}</td>
              <td className="whitespace-nowrap text-right tabular-nums">
                {String(p.menge).replace(".", ",")} {p.einheit}
              </td>
              <td className="whitespace-nowrap text-right tabular-nums">{cent(p.einzel_netto_cent)}</td>
              {mengenInfo && <td className="whitespace-nowrap text-right tabular-nums text-bo-text-soft">{Number(p.lieferschein_menge) || 0}/{Number(p.rechnung_menge) || 0}</td>}
              {mitEinkauf && <td className="whitespace-nowrap text-right tabular-nums text-bo-text-soft">{p.einkauf_cent ? cent(p.einkauf_cent * (p.menge || 1)) : "–"}</td>}
              <td className="whitespace-nowrap text-right tabular-nums text-bo-text-soft">{(Number(p.ust_satz_promille) || 0) / 10} %</td>
              <td className={cx("whitespace-nowrap text-right tabular-nums", !p.alternativ && "font-medium")}>{p.alternativ ? cent(Math.round(p.menge * p.einzel_netto_cent)) : cent(p.netto_cent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
