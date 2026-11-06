"use client";
// Liste des Bereichs Faktura im Lounge-Stil (10-konzept-faktura § 2.1, lounge.md §6 „Tabelle in Kachel“): gleiche
// Optik wie DataTable des Fundaments (Klassen bo-dt-*), dazu Faktura-Eigenheiten: Reiter als Segment, eine
// Filterzeile, Zeilen-Signal, Beträge rechtsbündig, Zeilen-Primäraktion (⇧↵), Auswahl (X) mit Massenleiste und
// Vorschau „n von m möglich“, Peek (Leertaste), Summenzeile, Karten unter 768 px, Leerzustände in drei Fällen.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import cx from "../cx";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Leer from "../Leer";
import Avatar from "../Avatar";
import { Peek, useListenPeek, Dialog, Fakten as OvFakten } from "../Overlay";
import { Pille } from "../StatusBadge";
import Datumsfeld from "../Formular/Datumsfeld";
import { useToast } from "../Toast";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { LISTE, FILTER, AKTION, BANK } from "@/lib/backoffice/faktura/texte";
import { listenexportAction, erAktionAction, zahllaufBuchenAction } from "@/lib/backoffice/faktura/actions";
import { useFaktura } from "./Aktionen";
import { Signal, Status, FIcon } from "./teile";
import "../DataTable/datatable.css";
import "./faktura.css";

const MASSEN_REGEL = {
  mahnen: (z) => z.aktion?.id === "mahnen",
  zahllauf: (z) => z.daten?.status === "Freigegeben",
  "zahllauf-buchen": (z) => z.daten?.status === "Freigegeben",
  "er-pruefen": (z) => z.daten?.status === "Erfasst",
  "er-freigeben": (z) => z.daten?.status === "Sachlich geprueft" && !z.daten?.kostenOffen,
  "sicher-zuordnen": (z) => z.sicherheit?.wort === "Sicher" && z.daten?.vorschlag?.doctype === "PH Rechnung" && z.daten?.status === "Offen",
  ignorieren: (z) => ["Offen", "Teilweise"].includes(z.daten?.status),
  "ma-erledigt": (z) => z.daten?.status === "Gesendet",
  anzahlung: (z) => z.aktion?.id === "anzahlung",
  csv: () => true,
};

function link(basis, params, aenderung) {
  const p = new URLSearchParams(Object.entries({ ...params, ...aenderung }).filter(([, v]) => v !== null && v !== undefined && v !== ""));
  const s = p.toString();
  return s ? `${basis}?${s}` : basis;
}

function Zelle({ z, s }) {
  if (s.typ === "objekt") {
    return (
      <span className="bo-dt-objekt">
        <span className="min-w-0">
          {z.href ? (
            <Link href={z.href} className="bo-dt-objekt__link bo-dt-objekt__titel line-clamp-2 break-words hover:underline hover:underline-offset-[3px]">
              {z.titel}
            </Link>
          ) : (
            <span className="bo-dt-objekt__titel line-clamp-2 break-words">{z.titel}</span>
          )}
          <span className="bo-dt-objekt__unter">
            <span className={cx("font-mono text-[12px]", z.entwurf && "text-bo-text-faint")}>{z.nummer}</span>
            {z.unter ? <span className="text-bo-text-faint"> · {z.unter}</span> : null}
          </span>
        </span>
      </span>
    );
  }
  if (s.typ === "status") return <Status status={z.status} />;
  if (s.typ === "person") return z.person ? <span className="inline-flex items-center gap-2"><Avatar name={z.person.split("@")[0]} groesse={28} ring={false} dekorativ /><span className="truncate text-bo-text-soft">{z.person.split("@")[0]}</span></span> : <span className="text-bo-text-faint">–</span>;
  if (s.typ === "signal")
    return (
      <span className="flex flex-col items-start gap-0.5">
        <span className="whitespace-nowrap tabular-nums text-bo-text-soft">{z.zellen?.[s.key] ?? "–"}</span>
        <Signal signal={z.signal} />
      </span>
    );
  if (s.typ === "betrag") return <span className={cx("whitespace-nowrap tabular-nums", s.key === "offen" || s.key === "betrag" || s.key === "zahlbetrag" ? "font-medium text-bo-text" : "text-bo-text-soft")}>{z.richtung === "Ausgang" && s.key === "betrag" ? <FIcon name="ArrowUpRight" className="mr-1 inline size-3.5 text-bo-text-faint" label="Ausgang" /> : z.richtung === "Eingang" && s.key === "betrag" ? <FIcon name="ArrowDownLeft" className="mr-1 inline size-3.5 text-bo-text-faint" label="Eingang" /> : null}{z.zellen?.[s.key] ?? "–"}</span>;
  if (s.typ === "sicherheit") return z.sicherheit ? <span aria-label={BANK.sicherheitAria(z.sicherheit.wort, z.sicherheit.grund)}><Pille material={z.sicherheit.material}>{z.sicherheit.wort}</Pille></span> : <span className="text-bo-text-faint">–</span>;
  if (s.typ === "kosten") {
    const st = z.kosten?.status || "Offen";
    return <Pille material={st === "Offen" ? "eiche" : st === "Gemeinkosten" ? "stein" : "salbei"}>{z.zellen?.[s.key]}</Pille>;
  }
  return <span className={cx("block max-w-64 truncate", s.typ === "zahl" ? "tabular-nums" : "text-bo-text-soft")} title={String(z.zellen?.[s.key] ?? "")}>{z.zellen?.[s.key] ?? "–"}</span>;
}

/**
 * @param {{liste:string, titel?:string, spalten:Array<{key:string,titel:string,typ:string}>, zeilen:object[], reiter?:Array<{id,titel,anzahl?,hinweis?}>,
 *  aktiverReiter?:string, basis:string, params?:object, seite?:number, seiten?:number, gesamt?:number, summe?:string,
 *  massen?:Array<{id:string,titel:string,unterMehr?:boolean}>, leer?:{art:string,titel?:string,text?:string,aktion?:{titel:string,href?:string,id?:string}},
 *  statusOptionen?:Array<{wert:string,text:string}>, darfCsv?:boolean, ohneZeitraum?:boolean, suchHinweis?:string, kopf?:any, testid?:string}} p
 */
export default function FakturaListe({ liste, spalten, zeilen = [], reiter = [], aktiverReiter, basis, params = {}, seite = 1, seiten = 1, gesamt = 0, summe, massen = [], leer, statusOptionen = [], darfCsv = false, ohneZeitraum = false, suchHinweis = FILTER.suche, kopf, testid = "faktura-liste" }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { ausfuehren, versteckt } = useFaktura();
  const sichtbar = useMemo(() => zeilen.filter((z) => !versteckt.has(z.name)), [zeilen, versteckt]);
  const [auswahl, setAuswahl] = useState(() => new Set());
  const [vorschau, setVorschau] = useState(null);
  const [zeitraum, setZeitraum] = useState(false);
  const [von, setVon] = useState(params.von || "");
  const [bis, setBis] = useState(params.bis || "");
  const peek = useListenPeek({ anzahl: sichtbar.length, panel: "peek" });
  const fokus = useRef(-1);
  const gefiltert = !!(params.q || params.status || params.von || params.bis || params.art || params.alter);

  const toggle = (name) =>
    setAuswahl((s) => {
      const n = new Set(s);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });

  useKuerzel("liste", {
    "liste.primaer": () => {
      const z = sichtbar[fokus.current];
      if (!z?.aktion) return false;
      ausfuehren(z.aktion.id, { ...z, href: z.aktion.href });
    },
    "liste.auswaehlen": () => {
      const z = sichtbar[fokus.current];
      if (!z) return false;
      toggle(z.name);
    },
  });

  function massen_(m) {
    const gewaehlt = sichtbar.filter((z) => auswahl.has(z.name));
    const regel = MASSEN_REGEL[m.id] || (() => true);
    const moeglich = gewaehlt.filter(regel);
    setVorschau({ m, gewaehlt, moeglich });
  }

  async function massenAusfuehren() {
    const { m, moeglich } = vorschau;
    setVorschau(null);
    const namen = moeglich.map((z) => z.name);
    if (m.id === "csv") {
      const r = await listenexportAction({ liste, zeilen: moeglich.map((z) => ({ Nummer: z.nummer, Titel: z.titel, ...Object.fromEntries(spalten.filter((s) => z.zellen?.[s.key] !== undefined).map((s) => [s.titel, z.zellen[s.key]])), Status: z.status?.text })) });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([`﻿${r.csv}`], { type: "text/csv;charset=utf-8" }));
      a.download = r.dateiname;
      a.click();
      return undefined;
    }
    if (m.id === "sicher-zuordnen") return ausfuehren("sicher-zuordnen", { namen, zeilen: moeglich, summe: moeglich.reduce((s, z) => s + Math.abs(z.betrag_cent || 0), 0) });
    if (m.id === "zahllauf") return ausfuehren("zahllauf", { namen });
    if (m.id === "mahnen") return ausfuehren("mahnen-alle", {});
    if (m.id === "zahllauf-buchen") {
      const r = await zahllaufBuchenAction({ namen, idempotency: `zahllauf:${Date.now()}` });
      zeige(r.ok ? `${r.gebucht} als bezahlt gebucht${r.fehler?.length ? ` · ${r.fehler.length} nicht gebucht` : ""}` : r.message, { art: r.ok ? "ok" : "fehler" });
      setAuswahl(new Set());
      return router.refresh();
    }
    if (m.id === "er-pruefen") {
      let n = 0;
      for (const name of namen) if ((await erAktionAction({ name, aktion: "pruefen" })).ok) n++;
      zeige(`${n} sachlich geprüft`, { art: "ok" });
      setAuswahl(new Set());
      return router.refresh();
    }
    for (const z of moeglich) await ausfuehren(m.id, z);
    setAuswahl(new Set());
    router.refresh();
    return undefined;
  }

  const reiterOptionen = reiter.map((r) => ({ wert: r.id, titel: r.titel, href: link(basis, { ...params, r: r.id, seite: null }, {}), anzahl: r.anzahl || undefined, testid: `reiter-${r.id}` }));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {reiter.length > 0 && (
        <div className="bo-scroll-x -mx-1 overflow-x-auto px-1 pb-1">
          <Segment label="Ansichten" aktiv={aktiverReiter} optionen={reiterOptionen} className="w-max min-w-0" testid={`${testid}-reiter`} />
        </div>
      )}
      <form action={basis} method="get" className="flex flex-wrap items-center gap-2" role="search" data-testid={`${testid}-filter`}>
        {aktiverReiter && <input type="hidden" name="r" value={aktiverReiter} />}
        {params.ansicht && <input type="hidden" name="ansicht" value={params.ansicht} />}
        <label className="bo-suche relative flex h-10 min-w-0 flex-1 items-center gap-2 px-4 sm:max-w-80">
          <FIcon name="Search" className="size-4 shrink-0 text-bo-text-faint" />
          <span className="sr-only">{FILTER.sucheKurz}</span>
          <input name="q" defaultValue={params.q || ""} placeholder={suchHinweis} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
        </label>
        {statusOptionen.length > 0 && (
          <label className="relative">
            <span className="sr-only">{FILTER.status}</span>
            <select name="status" defaultValue={params.status || ""} className="bo-fk-feld h-10 rounded-pill pr-8" onChange={(e) => e.currentTarget.form?.requestSubmit()}>
              <option value="">{FILTER.status}: {FILTER.alle}</option>
              {statusOptionen.map((s) => (
                <option key={s.wert} value={s.wert}>
                  {s.text}
                </option>
              ))}
            </select>
          </label>
        )}
        {!ohneZeitraum && (
          <>
            <Knopf size="m" variant="secondary" icon="CalendarDays" onClick={() => setZeitraum((z) => !z)} aria-expanded={zeitraum}>
              {params.von || params.bis ? `${params.von ? params.von.split("-").reverse().join(".") : "…"} – ${params.bis ? params.bis.split("-").reverse().join(".") : "…"}` : FILTER.zeitraum}
            </Knopf>
            {zeitraum && (
              <span className="flex flex-wrap items-center gap-2 rounded-bo-karte bg-bo-surface p-2 shadow-(--bo-sh-card)">
                <Datumsfeld name="von" value={von} onChange={setVon} aria-label="Von" kompakt />
                <Datumsfeld name="bis" value={bis} onChange={setBis} aria-label="Bis" kompakt />
                <Knopf size="s" variant="primary" type="submit">
                  Anwenden
                </Knopf>
              </span>
            )}
          </>
        )}
        {gefiltert && (
          <Knopf size="m" variant="ghost" href={link(basis, { r: aktiverReiter }, {})}>
            {FILTER.zuruecksetzen}
          </Knopf>
        )}
        <button type="submit" className="sr-only">
          {FILTER.sucheKurz}
        </button>
      </form>

      <div className="bo-dt" data-testid={testid}>
        {kopf}
        {sichtbar.length === 0 ? (
          <div className="px-2 pb-2">
            {gefiltert ? (
              <Leer art="gefiltert" groesse="karte" zuruecksetzenHref={link(basis, { r: aktiverReiter }, {})} />
            ) : leer?.art === "erledigt" ? (
              <Leer art="erledigt" titel={leer.titel} groesse="karte" />
            ) : (
              <Leer art="leer" titel={leer?.titel} text={leer?.text} groesse="karte" aktion={leer?.aktion ? <Knopf variant="primary" href={leer.aktion.href} onClick={leer.aktion.id ? () => ausfuehren(leer.aktion.id, {}) : undefined}>{leer.aktion.titel}</Knopf> : undefined} />
            )}
          </div>
        ) : (
          <>
            <ul className="bo-dt-karten md:hidden" data-testid="karten-liste">
              {sichtbar.map((z) => (
                <li key={z.name} className="flex min-w-0 items-start gap-2">
                  {massen.length > 0 && <input type="checkbox" aria-label={LISTE.waehlen(z.nummer)} checked={auswahl.has(z.name)} onChange={() => toggle(z.name)} className="ml-1 mt-5 shrink-0" />}
                  <div className="bo-dt-karte flex-1" data-gewaehlt={auswahl.has(z.name) || undefined}>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex min-w-0 items-start justify-between gap-2">
                        <span className="min-w-0">
                          {z.href ? (
                            <Link href={z.href} className="block truncate text-[15px] font-semibold leading-5">
                              {z.titel}
                            </Link>
                          ) : (
                            <span className="block truncate text-[15px] font-semibold leading-5">{z.titel}</span>
                          )}
                          <span className="block whitespace-nowrap font-mono text-[12px] text-bo-text-soft" aria-label={z.nummer}>
                            {String(z.nummer).length > 12 ? String(z.nummer).replace(/^([A-Z]+)-\d{4}-/, "$1-…") : z.nummer}
                          </span>
                        </span>
                        <Status status={z.status} />
                      </span>
                      <span className="flex items-center justify-between gap-2 text-[13px]">
                        <Signal signal={z.signal} />
                        <span className="ml-auto font-medium tabular-nums">{z.zellen?.offen || z.zellen?.betrag || z.zellen?.zahlbetrag || z.zellen?.brutto || ""}</span>
                      </span>
                      {z.aktion && (
                        <Knopf size="l" variant="secondary" className="mt-1 w-full" href={z.aktion.href} onClick={z.aktion.href ? undefined : () => ausfuehren(z.aktion.id, z)}>
                          {z.aktion.titel}
                        </Knopf>
                      )}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="bo-scroll-x hidden overflow-x-auto md:block">
              <table className="bo-dt__tabelle min-w-[720px]">
                <thead>
                  <tr>
                    {massen.length > 0 && (
                      <th scope="col" className="w-10">
                        <input type="checkbox" aria-label={LISTE.alleWaehlen} checked={auswahl.size > 0 && auswahl.size === sichtbar.length} onChange={() => setAuswahl(auswahl.size === sichtbar.length ? new Set() : new Set(sichtbar.map((z) => z.name)))} />
                      </th>
                    )}
                    {spalten.map((s) => (
                      <th key={s.key} scope="col" data-rechts={s.typ === "betrag" || s.rechts ? "" : undefined} className="whitespace-nowrap px-3 text-[12px] font-medium text-bo-text-soft">
                        {s.titel}
                      </th>
                    ))}
                    <th scope="col">
                      <span className="sr-only">{LISTE.aktionen}</span>
                    </th>
                  </tr>
                </thead>
                <tbody {...peek.listenProps}>
                  {sichtbar.map((z, i) => {
                    const pp = peek.zeilenProps(i);
                    return (
                      <tr
                        key={z.name}
                        {...pp}
                        className="bo-row"
                        data-gewaehlt={auswahl.has(z.name) || undefined}
                        data-testid={`zeile-${z.name}`}
                        onFocus={() => (fokus.current = i)}
                        onClick={(e) => {
                          if (e.target.closest("a,button,input,label")) return;
                          peek.oeffne(i);
                        }}
                        onKeyDown={(e) => {
                          if (e.target === e.currentTarget && e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (z.href) router.push(z.href);
                            else peek.oeffne(i);
                            return;
                          }
                          pp.onKeyDown?.(e);
                        }}
                      >
                        {massen.length > 0 && (
                          <td>
                            <input type="checkbox" aria-label={LISTE.waehlen(z.nummer)} checked={auswahl.has(z.name)} onChange={() => toggle(z.name)} />
                          </td>
                        )}
                        {spalten.map((s) => (
                          <td key={s.key} className={cx(s.typ === "betrag" || s.rechts ? "text-right" : "", s.typ === "objekt" ? "bo-dt__kopfzelle min-w-56 max-w-[26rem]" : "")}>
                            <Zelle z={z} s={s} />
                          </td>
                        ))}
                        <td className="w-1 whitespace-nowrap text-right">
                          {z.aktion && (
                            <Knopf size="s" variant="secondary" href={z.aktion.href} onClick={z.aktion.href ? undefined : () => ausfuehren(z.aktion.id, z)} title={`${z.aktion.titel} · ⇧↵`} data-testid={`aktion-${z.name}`}>
                              {z.aktion.titel}
                            </Knopf>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="bo-dt__fuss">
          <span className="tabular-nums" data-testid={`${testid}-summe`}>
            {summe || `${sichtbar.length} von ${gesamt}`}
            {auswahl.size > 0 ? ` · Auswahl ${auswahl.size}` : ""}
          </span>
          {seiten > 1 && (
            <span className="flex items-center gap-2">
              <Knopf size="s" variant="secondary" icon="ChevronLeft" href={seite > 1 ? link(basis, params, { seite: seite - 1 }) : undefined} disabled={seite <= 1}>
                {LISTE.zurueck}
              </Knopf>
              <span className="text-[13px] tabular-nums text-bo-text-soft">{LISTE.seite(seite, seiten)}</span>
              <Knopf size="s" variant="secondary" iconRechts="ChevronRight" href={seite < seiten ? link(basis, params, { seite: seite + 1 }) : undefined} disabled={seite >= seiten}>
                {LISTE.weiter}
              </Knopf>
            </span>
          )}
        </div>
      </div>

      {auswahl.size > 0 && (massen.length > 0 || darfCsv) && (
        <div className="bo-dt-massen" role="region" aria-label={LISTE.gewaehlt(auswahl.size)} data-testid="massenleiste">
          <span className="text-[13px] font-semibold tabular-nums">{LISTE.gewaehlt(auswahl.size)}</span>
          {massen.filter((m) => !m.unterMehr).map((m) => (
            <Knopf key={m.id} size="s" variant="secondary" onClick={() => massen_(m)}>
              {m.titel}
            </Knopf>
          ))}
          {darfCsv && (
            <Knopf size="s" variant="ghost" icon="Download" onClick={() => massen_({ id: "csv", titel: "CSV" })}>
              CSV
            </Knopf>
          )}
          <Knopf size="s" variant="ghost" onClick={() => setAuswahl(new Set())}>
            {LISTE.aufheben}
          </Knopf>
        </div>
      )}

      <Peek
        peek={peek}
        eintraege={sichtbar}
        titel={(z) => z.titel}
        unter={(z) => `${z.nummer}${z.status?.text ? ` · ${z.status.text}` : ""}`}
        vollseite={(z) => z.href || undefined}
        fuss={(z) =>
          z.aktion ? (
            <Knopf variant="primary" href={z.aktion.href} onClick={z.aktion.href ? undefined : () => ausfuehren(z.aktion.id, z)} kuerzel="⇧↵">
              {z.aktion.titel}
            </Knopf>
          ) : null
        }
      >
        {(z) => (
          <div className="flex flex-col gap-4">
            {z.doctype === "PH Bankumsatz" ? (
              <>
                <section>
                  <h3 className="bo-titel-kachel mb-2">{BANK.umsatz}</h3>
                  <OvFakten eintraege={[{ label: BANK.auftraggeber, wert: z.daten?.auftraggeber }, { label: "IBAN", wert: z.daten?.iban }, { label: "Zweck", wert: z.daten?.zweck }, { label: BANK.valuta, wert: z.zellen?.datum }, { label: BANK.e2e, wert: z.daten?.e2e }, { label: "Betrag", wert: z.zellen?.betrag }].filter((x) => x.wert)} />
                </section>
                {z.daten?.vorschlag && (
                  <section>
                    <h3 className="bo-titel-kachel mb-2">{BANK.beleg}</h3>
                    <OvFakten eintraege={[{ label: "Beleg", wert: z.daten.vorschlag.beleg }, { label: "Kunde", wert: z.daten.beleg?.kunde }, { label: "Offen", wert: z.daten.beleg ? `${(z.daten.beleg.offen_cent / 100).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €` : null }, { label: "Grund", wert: z.daten.vorschlag.grund }, { label: "Sicherheit", wert: `${z.daten.vorschlag.wort} (${z.daten.vorschlag.zahl})` }].filter((x) => x.wert)} />
                    <Knopf className="mt-3" size="s" variant="ghost" onClick={() => ausfuehren("pruefen", z)}>
                      {AKTION.andererBeleg}
                    </Knopf>
                  </section>
                )}
              </>
            ) : (
              <OvFakten eintraege={spalten.filter((s) => s.typ !== "objekt" && s.typ !== "status").map((s) => ({ label: s.titel, wert: s.typ === "sicherheit" ? z.sicherheit?.wort : s.typ === "kosten" ? z.zellen?.[s.key] : s.typ === "person" ? z.person?.split("@")[0] : z.zellen?.[s.key] })).filter((x) => x.wert && x.wert !== "–")} />
            )}
            {z.signal && <Signal signal={z.signal} />}
          </div>
        )}
      </Peek>

      <Dialog
        offen={!!vorschau}
        onSchliessen={() => setVorschau(null)}
        groesse="sm"
        art="bestaetigen"
        titel={vorschau ? `${vorschau.m.titel}?` : ""}
        text={vorschau ? LISTE.moeglich(vorschau.moeglich.length, vorschau.gewaehlt.length, vorschau.gewaehlt.length - vorschau.moeglich.length, "nicht zulässig") : ""}
        fuss={
          <>
            <Knopf variant="secondary" onClick={() => setVorschau(null)}>
              {AKTION.abbrechen}
            </Knopf>
            <Knopf variant="primary" disabled={!vorschau?.moeglich.length} onClick={massenAusfuehren} data-testid="massen-bestaetigen">
              {vorschau?.m.titel}
            </Knopf>
          </>
        }
      />
    </div>
  );
}
