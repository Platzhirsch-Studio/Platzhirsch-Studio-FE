"use client";
// Liste im Lounge-Stil (lounge.md §6 „Tabelle in Kachel“, Entwurf Anfragen): schwebende Kachel ohne Rahmen,
// Zeilen 72 hoch mit Bild/Symbol + Titel 15/600 + Nummer, weiche Status-Pillen, „Nächster Schritt“ mit
// Zeilenknopf (Shift+Enter), Auswahl mit 3-px-Tinte-Kante, Massenaktionen als Material-Kapsel unten,
// Vorschau-Link (Leertaste) am Zeilenende. Unter 768 px Karten. Ausstehende Commits je Zeile sichtbar.
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "@/components/Backoffice/DataTable/datatable.css";
import Knopf, { RundKnopf } from "@/components/Backoffice/Knopf";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import Avatar from "@/components/Backoffice/Avatar";
import Ausstehend, { useCommitMarke } from "@/components/Backoffice/Ausstehend";
import { useAusstehend } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import { csvAction } from "@/lib/backoffice/shop/actions";
import ShopIcon from "./ShopIcon";
import { Thumb } from "./Dialoge";
import { useShopAktionen } from "./ShopAktionen";

function Objekt({ v, href }) {
  return (
    <div className="bo-dt-objekt">
      {v.bilder?.length ? (
        <span className="bo-shop-bildstapel" aria-hidden="true">{v.bilder.slice(0, 2).map((b, i) => <Thumb key={i} bild={b} />)}</span>
      ) : (
        <span className="bo-shop-thumb" aria-hidden="true"><span className="bo-shop-thumb__ico"><ShopIcon name={v.icon || "Package"} className="size-5" /></span></span>
      )}
      <span className="min-w-0">
        <Link href={href} className={`bo-dt-objekt__titel bo-dt-objekt__link block truncate${v.mono ? " bo-shop-code" : ""}`} style={v.mono ? { fontSize: 15 } : undefined} prefetch={false}>
          {v.titel}
        </Link>
        <span className={`bo-dt-objekt__unter${v.monoUnter ? " font-mono text-[12px]" : ""}`}>{v.unter}</span>
      </span>
    </div>
  );
}

function Zelle({ art, v }) {
  if (v === undefined || v === null) return <span className="text-bo-text-faint">–</span>;
  switch (art) {
    case "betrag":
      return (
        <span className="bo-shop-betrag block" data-minus={v.minus ? "" : undefined}>
          {v.text}
          {v.unter && <span className="bo-shop-unter">{v.unter}</span>}
        </span>
      );
    case "status":
      return (
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <StatusBadge wert={v.wert} text={v.anzeige} ton={v.ton} groesse="m" gebucht={v.gebucht} />
            {(v.chips || []).map((c) => <Pille key={c.id} material={c.material} groesse="s">{c.text}</Pille>)}
          </span>
          {v.unter && <span className="bo-shop-unter" data-ton={v.unterTon}>{v.unter}</span>}
        </span>
      );
    case "schritt":
      return (
        <span className="bo-shop-schritt" data-ton={v.ton || undefined}>
          <span className="bo-shop-schritt__ico" aria-hidden="true"><ShopIcon name={v.icon} /></span>
          <span className="bo-shop-schritt__text">
            {v.titel}
            <span className="bo-shop-schritt__faellig">{[v.lieferart, v.faellig].filter(Boolean).join(" · ")}</span>
          </span>
        </span>
      );
    case "person":
      return v ? <Avatar name={String(v).split("@")[0].replace(/[._]/g, " ")} groesse={28} /> : <span className="text-bo-text-faint">–</span>;
    case "rest":
      return (
        <span className="flex items-center justify-end gap-2">
          <span className="bo-shop-restbalken" aria-hidden="true"><span style={{ width: `${Math.round(Math.min(Math.max(v.anteil, 0), 1) * 100)}%` }} /></span>
          <span className="bo-shop-betrag">{v.text}</span>
        </span>
      );
    case "ampel":
      return (
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <StatusBadge wert={v.ton} text={v.text} ton={v.ton === "rot" ? "rot" : v.ton === "orange" ? "orange" : v.ton === "gruen" ? "gruen" : "grau"} groesse="m" />
          {v.unter && <span className="bo-shop-unter">{v.unter}</span>}
        </span>
      );
    case "link":
      return v.href ? (
        <Link href={v.href} className="relative z-[1] text-[13px] font-medium underline-offset-2 hover:underline" prefetch={false}>{v.text}</Link>
      ) : (
        <span className="text-[13px]" data-ton={v.ton}>
          {v.ton === "gefahr" ? <span className="text-bo-ziegel-text font-medium">{v.text}</span> : v.text}
        </span>
      );
    default:
      return (
        <span className="block min-w-0" title={v.titel}>
          <span className={`block truncate text-[14px]${v.ton === "gefahr" ? " text-bo-ziegel-text font-medium" : ""}`}>{v.text}</span>
          {v.unter && <span className="bo-shop-unter" data-ton={v.unterTon}>{v.unter}</span>}
        </span>
      );
  }
}

function Zeile({ z, spalten, gewaehlt, onWahl, auswahl, vorschauHref, aktiv }) {
  const { ausfuehren } = useShopAktionen();
  const objekt = { doctype: z.doc?.doctype || "PH Bestellung", name: z.name };
  const v = useAusstehend(objekt);
  const marke = useCommitMarke(objekt);
  const router = useRouter();
  return (
    <tr ref={marke} className="bo-row" data-gewaehlt={gewaehlt ? "true" : undefined} data-aktiv={aktiv ? "true" : undefined} data-testid="shop-zeile" data-name={z.name}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" && e.shiftKey && z.aktion) {
          e.preventDefault();
          ausfuehren(z.aktion.id, z.doc);
        } else if (e.key === "Enter") router.push(z.href);
        else if (e.key === " " && vorschauHref) {
          e.preventDefault();
          router.push(vorschauHref, { scroll: false });
        } else if (e.key === "x" || e.key === "X") onWahl?.(!gewaehlt);
        else if (e.key === "ArrowDown" || e.key === "j") (e.currentTarget.nextElementSibling)?.focus();
        else if (e.key === "ArrowUp" || e.key === "k") (e.currentTarget.previousElementSibling)?.focus();
      }} tabIndex={0}>
      {auswahl && (
        <td className="w-10">
          <input type="checkbox" checked={gewaehlt} onChange={(e) => onWahl(e.target.checked)} aria-label={`${z.name} auswählen`} />
        </td>
      )}
      {spalten.map((s, i) => (
        <td key={s.id} className={`${i === 0 ? "bo-dt__kopfzelle " : ""}${s.rechts ? "text-right" : ""}`} data-nur-breit={s.nurBreit ? "" : undefined} style={s.breite ? { width: s.breite } : undefined}>
          {s.art === "objekt" ? <Objekt v={z.zellen.objekt} href={z.href} /> : <Zelle art={s.art} v={z.zellen[s.id]} />}
          {s.art === "status" && v && <span className="mt-1 block"><Ausstehend objekt={objekt} /></span>}
        </td>
      ))}
      <td className="w-px whitespace-nowrap text-right">
        <span className="relative z-[1] inline-flex items-center gap-1">
          {z.aktion && (
            <span className="bo-shop-zeilenknopf">
              <Knopf size="s" variant={z.aktion.id === "an-die-kassa" ? "secondary" : "secondary"} disabled={!!v} title={v ? "Läuft noch" : undefined} onClick={() => ausfuehren(z.aktion.id, z.doc)} data-testid={`zeile-${z.aktion.id}`}>
                {z.aktion.titel}
              </Knopf>
            </span>
          )}
          {vorschauHref && <RundKnopf icon="Eye" label={`Vorschau ${z.name}`} href={vorschauHref} groesse="s" flach />}
        </span>
      </td>
    </tr>
  );
}

/**
 * @param {{liste:string, spalten:Array<{id,titel,art,rechts?,nurBreit?,breite?}>, zeilen:object[], gesamt:number, seite:number, seiten:number,
 *  basis:string, params:Record<string,string>, massen?:Array<{id,titel,icon?}>, arbeit?:boolean, vorschau?:boolean, aktivName?:string,
 *  summe?:string, leer?:import("react").ReactNode, darfExport?:boolean, testid?:string, titel?:string}} p
 */
export default function ShopListe({ liste, spalten, zeilen, gesamt, seite, seiten, basis, params, massen = [], arbeit = false, vorschau = false, aktivName, summe, leer, darfExport = false, testid = "shop-liste", titel }) {
  const [auswahl, setAuswahl] = useState(() => new Set());
  const { massen: massenAus } = useShopAktionen();
  const [laeuft, setLaeuft] = useState(false);
  const tabelle = useRef(null);
  const namen = useMemo(() => zeilen.map((z) => z.name), [zeilen]);
  const alleGewaehlt = auswahl.size > 0 && namen.every((n) => auswahl.has(n));
  const href = (seiteNeu) => {
    const p = new URLSearchParams({ ...params, seite: String(seiteNeu) });
    return `${basis}?${p.toString()}`;
  };
  const vorschauHref = (n) => {
    const p = new URLSearchParams({ ...params, panel: n });
    return `${basis}?${p.toString()}`;
  };
  const csv = async () => {
    const r = await csvAction({ liste, params });
    if (!r.ok) return;
    const url = URL.createObjectURL(new Blob([`﻿${r.ergebnis}`], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${liste}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };
  if (!zeilen.length) return <div className="bo-dt" data-testid={testid}>{leer}</div>;
  return (
    <div className="bo-dt bo-shop-tab min-w-0" data-testid={testid} data-arbeit={arbeit ? "ja" : "nein"}>
      <div className="bo-dt__kopf">
        <span className="bo-dt__zahl" data-testid="tabelle-gesamt">{titel ? `${titel} · ` : ""}{gesamt} {gesamt === 1 ? "Eintrag" : "Einträge"}{summe ? ` · ${summe}` : ""}</span>
        {darfExport && <span className="ml-auto"><Knopf size="s" variant="ghost" icon="Download" onClick={csv} data-testid="csv-export">CSV</Knopf></span>}
      </div>
      <div className="relative hidden min-w-0 overflow-x-auto md:block">
        <table className="bo-dt__tabelle" ref={tabelle}>
          <thead>
            <tr>
              {massen.length > 0 && (
                <th scope="col" className="w-10">
                  <input type="checkbox" checked={alleGewaehlt} onChange={(e) => setAuswahl(e.target.checked ? new Set(namen) : new Set())} aria-label="Alle auswählen" />
                </th>
              )}
              {spalten.map((s) => (
                <th key={s.id} scope="col" data-rechts={s.rechts ? "" : undefined} data-nur-breit={s.nurBreit ? "" : undefined}>{s.titel}</th>
              ))}
              <th scope="col"><span className="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody className="bo-staffel">
            {zeilen.map((z) => (
              <Zeile key={z.name} z={z} spalten={spalten} auswahl={massen.length > 0} gewaehlt={auswahl.has(z.name)} aktiv={aktivName === z.name}
                onWahl={(an) => setAuswahl((s) => { const n = new Set(s); if (an) n.add(z.name); else n.delete(z.name); return n; })}
                vorschauHref={vorschau ? vorschauHref(z.name) : null} />
            ))}
          </tbody>
        </table>
      </div>
      <ul className="bo-dt-karten" data-testid="karten-liste">
        {zeilen.map((z) => (
          <li key={z.name}>
            <Link href={z.href} className="bo-dt-karte" prefetch={false}>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{z.zellen.objekt?.titel}</span>
                <span className="bo-dt-objekt__unter">{z.zellen.objekt?.unter}</span>
                <span className="mt-2 flex flex-wrap items-center gap-2">
                  {z.zellen.status && <StatusBadge wert={z.zellen.status.wert} text={z.zellen.status.anzeige} ton={z.zellen.status.ton} />}
                  {(z.zellen.gesamt || z.zellen.betrag) && <span className="bo-shop-betrag text-[14px]">{(z.zellen.gesamt || z.zellen.betrag).text}</span>}
                </span>
                {z.zellen.schritt?.titel && z.zellen.schritt.titel !== "–" && <span className="bo-shop-unter mt-1">Nächster Schritt: {z.zellen.schritt.titel}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {seiten > 1 && (
        <nav className="bo-dt__fuss" aria-label="Seiten">
          <span>Seite {seite} von {seiten}</span>
          <span className="flex gap-2">
            <Knopf size="s" variant="ghost" href={seite > 1 ? href(seite - 1) : undefined} disabled={seite <= 1} icon="ChevronLeft">Zurück</Knopf>
            <Knopf size="s" variant="ghost" href={seite < seiten ? href(seite + 1) : undefined} disabled={seite >= seiten} iconRechts="ChevronRight">Weiter</Knopf>
          </span>
        </nav>
      )}
      {auswahl.size > 0 && massen.length > 0 && (
        <div className="bo-dt-massen" role="toolbar" aria-label="Auswahl" data-testid="massenaktionen">
          <span className="text-[13px] font-medium">Auswahl ({auswahl.size})</span>
          {massen.map((m) => (
            <Knopf key={m.id} size="s" variant="secondary" icon={m.icon} laedt={laeuft} data-testid={`massen-${m.id}`}
              onClick={async () => {
                setLaeuft(true);
                const n = [...auswahl];
                setAuswahl(new Set());
                await massenAus(m.id, n);
                setLaeuft(false);
              }}>
              {m.titel}
            </Knopf>
          ))}
          <Knopf size="s" variant="ghost" onClick={() => setAuswahl(new Set())}>Aufheben</Knopf>
        </div>
      )}
    </div>
  );
}
