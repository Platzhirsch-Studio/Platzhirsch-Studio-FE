"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocalStorage } from "../useLocalStorage";
import cx from "../cx";
import { Icon } from "../icons";
import Knopf from "../Knopf";
import Leer from "../Leer";
import Avatar from "../Avatar";
import StatusBadge from "../StatusBadge";
import { useToast } from "../Toast";
import { cent, datum, datumZeit, relativ } from "@/lib/backoffice/format";
import { anzeige } from "@/lib/backoffice/labels";
import { exportCsvAction, massenaktionAction } from "@/lib/backoffice/actions";
import { STATUS_FELDER, hatFilter, istPersonSpalte, ohneUmbruch, personName, rechtsbuendig, zeilenAufbau } from "./logik";
import { LISTE } from "./texte";
import "./datatable.css";

/**
 * Liste im Lounge-Stil (Team P0-5b; lounge.md §6 „Tabelle in Kachel“, §7.2): Tabelle in einer schwebenden
 * Kachel ohne Rahmen, Zeilen 72 hoch mit Haarlinie, Hover/Fokus = gerundete Fläche, Auswahl = Fläche +
 * Tinte-Kante. Je Zeile Bild (`bildFeld`) oder Avatar und Titel mit Nummer als Unterzeile (statt eigener
 * Nr.-Spalte), Personen-Spalten mit Avatar, Status als weiche Pille. Unter 768 px Kartenliste.
 * Serverseitig paginiert: Sortierung/Paging sind Links (searchParams); Spaltenwahl (localStorage),
 * Massenaktionen als schwebende Material-Kapsel unten, CSV nur mit Export-Recht, Tastatur ↑/↓/Enter/Leertaste.
 *
 * @param {{
 *  doctype:string, spalten:Array<{fieldname,label,fieldtype?,options?,cent?,person?:boolean}>,
 *  zeilen:object[], gesamt:number, seite:number, groesse:number, sortFeld?:string, richtung?:"asc"|"desc",
 *  basis:string, params:Record<string,string>, zeilenBasis?:string, zeilenHref?:(zeile)=>string, statusTon?:Record<string,string>,
 *  darfExport?:boolean, massenaktionen?:Array<{id:string,titel:string,aktion?:string,feld?:string,wert?:any}>,
 *  filterDaten?:object, leerText?:string, bildFeld?:string, titelFeld?:string, unterFelder?:string[],
 *  avatar?:boolean, zusammenfassen?:boolean, dicht?:boolean, ohneKachel?:boolean, testid?:string
 * }} props
 */
export default function DataTable({
  doctype,
  spalten,
  zeilen,
  gesamt,
  seite,
  groesse,
  sortFeld,
  richtung = "desc",
  basis,
  params = {},
  zeilenBasis,
  zeilenHref,
  statusTon = {},
  darfExport = false,
  massenaktionen = [],
  filterDaten,
  leerText = LISTE.leerText,
  bildFeld,
  titelFeld,
  unterFelder = [],
  avatar = true,
  zusammenfassen = true,
  dicht = false,
  ohneKachel = false,
  testid = "liste",
}) {
  const router = useRouter();
  const { zeige } = useToast();
  const [pending, start] = useTransition();
  const [versteckt, setVersteckt] = useLocalStorage(`ph-bo-spalten:${doctype}`, []);
  const [spaltenMenu, setSpaltenMenu] = useState(false);
  const [auswahl, setAuswahl] = useState(() => new Set());
  const [aktiv, setAktiv] = useState(-1);
  const tbody = useRef(null);
  const spaltenRef = useRef(null);

  const sichtbar = useMemo(() => spalten.filter((s) => !versteckt.includes(s.fieldname)), [spalten, versteckt]);
  const aufbau = useMemo(() => zeilenAufbau(sichtbar, { titelFeld, zusammenfassen }), [sichtbar, titelFeld, zusammenfassen]);
  const toggleSpalte = (f) => setVersteckt(versteckt.includes(f) ? versteckt.filter((x) => x !== f) : [...versteckt, f]);
  const hrefVon = useCallback((z) => (zeilenHref ? zeilenHref(z) : zeilenBasis ? `${zeilenBasis}/${encodeURIComponent(z.name)}` : null), [zeilenBasis, zeilenHref]);

  const link = useCallback(
    (aenderung) => {
      const u = new URLSearchParams(params);
      for (const [k, v] of Object.entries(aenderung)) {
        if (v === null || v === undefined || v === "") u.delete(k);
        else u.set(k, String(v));
      }
      const s = u.toString();
      return s ? `${basis}?${s}` : basis;
    },
    [basis, params]
  );

  const seiten = Math.max(1, Math.ceil((gesamt || 0) / (groesse || 1)));
  const mitAuswahl = massenaktionen.length > 0;
  const alleGewaehlt = zeilen.length > 0 && zeilen.every((z) => auswahl.has(z.name));
  const toggleAlle = () => setAuswahl(alleGewaehlt ? new Set() : new Set(zeilen.map((z) => z.name)));
  const toggleZeile = (name) =>
    setAuswahl((a) => {
      const n = new Set(a);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });

  // Tastatur: ↑/↓ wechseln die aktive Zeile, Enter öffnet, Leertaste wählt aus.
  const onKey = (e) => {
    if (!zeilen.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktiv((a) => Math.min(zeilen.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktiv((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && aktiv >= 0 && hrefVon(zeilen[aktiv]) && e.target.tagName !== "A") {
      router.push(hrefVon(zeilen[aktiv]));
    } else if (e.key === " " && aktiv >= 0 && mitAuswahl && e.target.tagName !== "INPUT") {
      e.preventDefault();
      toggleZeile(zeilen[aktiv].name);
    }
  };
  useEffect(() => {
    if (aktiv >= 0) tbody.current?.querySelector(`[data-index="${aktiv}"] a, [data-index="${aktiv}"]`)?.focus?.();
  }, [aktiv]);

  // Spaltenmenü schließt bei Klick daneben und mit Esc.
  useEffect(() => {
    if (!spaltenMenu) return undefined;
    const klick = (e) => spaltenRef.current && !spaltenRef.current.contains(e.target) && setSpaltenMenu(false);
    const taste = (e) => e.key === "Escape" && setSpaltenMenu(false);
    document.addEventListener("mousedown", klick);
    document.addEventListener("keydown", taste);
    return () => {
      document.removeEventListener("mousedown", klick);
      document.removeEventListener("keydown", taste);
    };
  }, [spaltenMenu]);

  const exportiere = () =>
    start(async () => {
      const r = await exportCsvAction({ doctype, ...(filterDaten || {}) });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = r.dateiname;
      a.click();
      URL.revokeObjectURL(a.href);
      zeige(LISTE.csvExportiert(r.dateiname), { art: "ok" });
    });

  const massenaktion = (m) =>
    start(async () => {
      const r = await massenaktionAction({ doctype, namen: [...auswahl], aktion: m.aktion, feld: m.feld, wert: m.wert });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      zeige(r.fehlgeschlagen ? LISTE.massenTeil(r.ergebnisse.length - r.fehlgeschlagen, r.fehlgeschlagen) : LISTE.massenOk(r.ergebnisse.length), { art: r.fehlgeschlagen ? "info" : "ok" });
      setAuswahl(new Set());
      router.refresh();
    });

  const von = gesamt === 0 ? 0 : (seite - 1) * groesse + 1;
  const bis = Math.min(gesamt, seite * groesse);

  // Telefon-Karte: Titel, Nr., Status, bis zu zwei Nebenfelder, Änderungszeit.
  const titelSpalte = aufbau.titel || sichtbar.find((s) => !["name", "modified", ...STATUS_FELDER].includes(s.fieldname));
  const statusSpalte = sichtbar.find((s) => STATUS_FELDER.includes(s.fieldname));
  const nebenSpalten = sichtbar.filter((s) => s !== titelSpalte && !["name", "modified", ...STATUS_FELDER].includes(s.fieldname)).slice(0, 2);
  const geaendertSpalte = sichtbar.find((s) => s.fieldname === "modified");
  const unterText = (z) => [z.name !== textWert(z, titelSpalte || {}) ? z.name : null, ...unterFelder.map((f) => z[f])].filter(Boolean).join(" · ");

  const vorspann = (z, titel, gr = 48, i = 0) =>
    bildFeld && z[bildFeld] ? (
      <span className="bo-dt-bild" style={gr !== 48 ? { width: gr, height: gr } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Bilder aus Frappe/Datei-Proxy, Größe fest 48 px */}
        <img src={z[bildFeld]} alt="" loading={i < 10 ? "eager" : "lazy"} decoding="async" />
      </span>
    ) : avatar && titel ? (
      <Avatar name={titel} groesse={gr === 48 ? 44 : gr} ring={false} dekorativ />
    ) : null;

  const inhalt = (
    <>
      <div className="bo-dt__kopf">
        <span className="bo-dt__zahl" data-testid="tabelle-gesamt">
          {LISTE.eintraege(gesamt)}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <div className="relative" ref={spaltenRef}>
            <Knopf size="s" variant="secondary" icon="SlidersHorizontal" onClick={() => setSpaltenMenu((o) => !o)} aria-expanded={spaltenMenu} aria-haspopup="true">
              {LISTE.spalten}
            </Knopf>
            {spaltenMenu && (
              <div className="bo-pop bo-dt-menue" role="group" aria-label={LISTE.spaltenTitel}>
                {spalten.map((s) => (
                  <label key={s.fieldname}>
                    <input type="checkbox" checked={!versteckt.includes(s.fieldname)} onChange={() => toggleSpalte(s.fieldname)} disabled={s.fieldname === "name"} />
                    {anzeige(s.label)}
                  </label>
                ))}
              </div>
            )}
          </div>
          {darfExport && (
            <Knopf size="s" variant="secondary" icon="Download" onClick={exportiere} disabled={pending} data-testid="csv-export">
              {LISTE.csv}
            </Knopf>
          )}
        </span>
      </div>

      {zeilen.length === 0 ? (
        <div className="px-2 pb-2">
          <Leer art={hatFilter(params) ? "gefiltert" : "leer"} titel={hatFilter(params) ? undefined : LISTE.leerTitel} text={hatFilter(params) ? undefined : leerText} zuruecksetzenHref={hatFilter(params) ? basis : undefined} groesse="karte" />
        </div>
      ) : (
        <>
          {/* Telefon (< 768 px): Karten statt Tabelle */}
          <ul className="bo-dt-karten md:hidden" data-testid="karten-liste">
            {zeilen.map((z, i) => {
              const href = hrefVon(z);
              const titel = titelSpalte ? textWert(z, titelSpalte) : "";
              const karte = (
                <>
                  {vorspann(z, titel || z.name, 44, i)}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex min-w-0 items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="line-clamp-2 break-words text-[15px] leading-5 font-semibold text-bo-text">{titel || z.name}</span>
                        {titel && titel !== z.name && <span className="block truncate text-[13px] leading-[18px] text-bo-text-soft">{z.name}</span>}
                      </span>
                      {statusSpalte && <span className="shrink-0">{zelle(z, statusSpalte, statusTon)}</span>}
                    </span>
                    {(nebenSpalten.length > 0 || geaendertSpalte) && (
                      <span className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-bo-text-soft">
                        {nebenSpalten.map((s) =>
                          s.fieldtype === "Check" ? (
                            z[s.fieldname] ? (
                              <span key={s.fieldname} className="inline-flex items-center gap-1">
                                <Icon name="Check" className="size-3.5 text-bo-salbei" /> {anzeige(s.label)}
                              </span>
                            ) : null
                          ) : (
                            <span key={s.fieldname} className="min-w-0 max-w-full truncate">
                              <span className="sr-only">{anzeige(s.label)}: </span>
                              {(istPersonSpalte(s) ? personName(z[s.fieldname]) : textWert(z, s)) || "–"}
                            </span>
                          )
                        )}
                        {geaendertSpalte && z.modified && <span className="ml-auto whitespace-nowrap tabular-nums text-bo-text-faint" suppressHydrationWarning>{relativ(z.modified)}</span>}
                      </span>
                    )}
                  </span>
                </>
              );
              return (
                <li key={z.name} className="flex min-w-0 items-start gap-2">
                  {mitAuswahl && <input type="checkbox" aria-label={LISTE.waehlen(z.name)} checked={auswahl.has(z.name)} onChange={() => toggleZeile(z.name)} className="ml-1 mt-5 shrink-0" />}
                  {href ? (
                    <Link href={href} className="bo-dt-karte flex-1" data-gewaehlt={auswahl.has(z.name) ? "true" : undefined}>
                      {karte}
                    </Link>
                  ) : (
                    <div className="bo-dt-karte flex-1" data-gewaehlt={auswahl.has(z.name) ? "true" : undefined}>
                      {karte}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Ab 768 px: Tabelle, waagrecht scrollbar in ihrer Kachel */}
          <div className="bo-scroll-x hidden overflow-x-auto md:block">
            <table className="bo-dt__tabelle min-w-[640px]" data-dicht={dicht ? "" : undefined} onKeyDown={onKey}>
              <thead>
                <tr>
                  {mitAuswahl && (
                    <th scope="col" className="w-10">
                      <input type="checkbox" aria-label={LISTE.alleWaehlen} checked={alleGewaehlt} onChange={toggleAlle} className="align-middle" />
                    </th>
                  )}
                  {aufbau.titel && <Kopf s={aufbau.titel} sortFeld={sortFeld} richtung={richtung} link={link} />}
                  {aufbau.spalten.map((s) => (
                    <Kopf key={s.fieldname} s={s} sortFeld={sortFeld} richtung={richtung} link={link} />
                  ))}
                </tr>
              </thead>
              <tbody ref={tbody}>
                {zeilen.map((z, i) => {
                  const href = hrefVon(z);
                  const titel = aufbau.titel ? textWert(z, aufbau.titel) : "";
                  const gewaehlt = auswahl.has(z.name);
                  return (
                    <tr key={z.name} data-index={i} data-aktiv={i === aktiv ? "true" : undefined} data-gewaehlt={gewaehlt ? "true" : undefined} className="bo-row" onFocus={() => setAktiv(i)}>
                      {mitAuswahl && (
                        <td>
                          <input type="checkbox" aria-label={LISTE.waehlen(z.name)} checked={gewaehlt} onChange={() => toggleZeile(z.name)} className="align-middle" />
                        </td>
                      )}
                      {aufbau.titel && (
                        <td className="bo-dt__kopfzelle min-w-56 max-w-[26rem]">
                          <span className="bo-dt-objekt">
                            {vorspann(z, titel || z.name, 48, i)}
                            <span className="min-w-0">
                              {href ? (
                                <Link href={href} className="bo-dt-objekt__link bo-dt-objekt__titel line-clamp-2 break-words hover:underline hover:decoration-bo-line-strong hover:underline-offset-[3px]">
                                  {titel || z.name}
                                </Link>
                              ) : (
                                <span className="bo-dt-objekt__titel line-clamp-2 break-words">{titel || z.name}</span>
                              )}
                              {unterText(z) && <span className="bo-dt-objekt__unter">{unterText(z)}</span>}
                            </span>
                          </span>
                        </td>
                      )}
                      {aufbau.spalten.map((s, j) => (
                        <td key={s.fieldname} className={cx(rechtsbuendig(s) && "text-right tabular-nums", ohneUmbruch(s) ? "whitespace-nowrap" : "min-w-40 max-w-80")}>
                          {!aufbau.titel && j === 0 && href ? (
                            <Link href={href} className="font-semibold text-bo-text underline-offset-[3px] hover:underline">
                              {zelle(z, s, statusTon)}
                            </Link>
                          ) : (
                            zelle(z, s, statusTon)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {auswahl.size > 0 && (
        <div className="bo-dt-massen" role="region" aria-label={LISTE.gewaehlt(auswahl.size)}>
          <span className="text-[13px] font-semibold tabular-nums">{LISTE.gewaehlt(auswahl.size)}</span>
          {massenaktionen.map((m) => (
            <Knopf key={m.id} size="s" variant="secondary" onClick={() => massenaktion(m)} disabled={pending}>
              {anzeige(m.titel)}
            </Knopf>
          ))}
          <Knopf size="s" variant="ghost" onClick={() => setAuswahl(new Set())}>
            {LISTE.aufheben}
          </Knopf>
        </div>
      )}

      <nav aria-label={LISTE.seiten} className="bo-dt__fuss">
        <span className="tabular-nums">
          {LISTE.bereich(von, bis, gesamt)}
          <span className="sr-only">{LISTE.seiteVon(seite, seiten)}</span>
        </span>
        {seiten > 1 && (
          <span className="flex items-center gap-2">
            <Knopf size="s" variant="secondary" icon="ChevronLeft" href={seite > 1 ? link({ seite: seite - 1 }) : undefined} disabled={seite <= 1}>
              {LISTE.zurueck}
            </Knopf>
            <Knopf size="s" variant="secondary" iconRechts="ChevronRight" href={seite < seiten ? link({ seite: seite + 1 }) : undefined} disabled={seite >= seiten}>
              {LISTE.weiter}
            </Knopf>
          </span>
        )}
      </nav>
    </>
  );

  if (ohneKachel) return <div className="min-w-0" data-testid={testid}>{inhalt}</div>;
  return (
    <div className="bo-dt" data-testid={testid}>
      {inhalt}
    </div>
  );
}

/** Kopfzelle mit Sortier-Link (aria-sort). */
function Kopf({ s, sortFeld, richtung, link }) {
  const istSort = sortFeld === s.fieldname;
  const naechste = istSort && richtung === "desc" ? "asc" : "desc";
  return (
    <th scope="col" aria-sort={istSort ? (richtung === "asc" ? "ascending" : "descending") : "none"} data-rechts={rechtsbuendig(s) ? "" : undefined}>
      <Link href={link({ sort: s.fieldname, r: naechste, seite: null })} className="bo-dt-sort group" data-aktiv={istSort ? "" : undefined}>
        {anzeige(s.label)}
        <Icon name={istSort && richtung === "asc" ? "ChevronUp" : "ChevronDown"} className={cx("size-3.5 transition-opacity duration-150", istSort ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
      </Link>
    </th>
  );
}

/** Wert einer Spalte als reiner Text (Karten, title-Attribute). */
function textWert(z, s) {
  const v = z?.[s?.fieldname];
  if (v === null || v === undefined || v === "") return "";
  if (s.cent) return cent(v);
  if (s.fieldtype === "Date") return datum(v);
  if (s.fieldtype === "Datetime") return datumZeit(v);
  if (s.fieldtype === "Check") return v ? LISTE.ja : LISTE.nein;
  if (s.fieldtype === "Select") return anzeige(v);
  return String(v).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Zellenwert nach Feldtyp formatieren. Lange Texte: höchstens zwei Zeilen (voller Text im title),
 * Personen mit Avatar, Status als weiche Pille.
 */
export function zelle(z, s, statusTon = {}) {
  const v = z[s.fieldname];
  if (STATUS_FELDER.includes(s.fieldname)) return <StatusBadge wert={v ?? ""} ton={statusTon[v] || "grau"} groesse="m" />;
  if (v === null || v === undefined || v === "") return <span className="text-bo-text-faint">–</span>;
  if (istPersonSpalte(s)) {
    const n = personName(v);
    return (
      <span className="inline-flex max-w-56 min-w-0 items-center gap-2" title={String(v)}>
        <Avatar name={n} groesse={28} ring={false} dekorativ />
        <span className="truncate">{n}</span>
      </span>
    );
  }
  if (s.cent) return cent(v);
  switch (s.fieldtype) {
    case "Date":
      return <span className="tabular-nums text-bo-text-soft">{datum(v)}</span>;
    case "Datetime":
      return <span className="tabular-nums text-bo-text-soft">{datumZeit(v)}</span>;
    case "Check":
      return v ? (
        <span className="inline-flex text-bo-salbei">
          <Icon name="Check" className="size-4" />
          <span className="sr-only">{LISTE.ja}</span>
        </span>
      ) : (
        <span className="text-bo-text-faint">{LISTE.nein}</span>
      );
    case "Int":
    case "Float":
    case "Currency":
      return <span className="tabular-nums">{String(v)}</span>;
    case "Small Text":
    case "Text":
    case "Long Text":
    case "Text Editor": {
      const t = textWert(z, s);
      return (
        <span className="line-clamp-2 break-words text-bo-text-soft" title={t.length > 40 ? t : undefined}>
          {t}
        </span>
      );
    }
    default: {
      const t = textWert(z, s);
      return (
        <span className="block max-w-64 truncate" title={t.length > 28 ? t : undefined}>
          {t}
        </span>
      );
    }
  }
}

/** Lade-Skelett in Zielform (Kachel, Zeilen 72, Avatar-Kreis) für loading.js. */
export function DataTableSkeleton({ zeilen = 8 }) {
  return (
    <div className="bo-dt" aria-busy="true" aria-label={LISTE.laedt}>
      <div className="bo-dt__kopf">
        <span className="bo-skeleton h-4 w-28 rounded-pill" />
        <span className="bo-skeleton ml-auto h-8 w-24 rounded-pill" />
      </div>
      {Array.from({ length: zeilen }).map((_, i) => (
        <div key={i} className="flex h-[72px] items-center gap-3 px-3">
          <span className="bo-skeleton size-11 shrink-0 rounded-full" />
          <span className="flex flex-1 flex-col gap-2">
            <span className="bo-skeleton h-3.5 w-2/5 rounded-pill" />
            <span className="bo-skeleton h-3 w-1/4 rounded-pill" />
          </span>
          <span className="bo-skeleton hidden h-7 w-20 rounded-pill md:block" />
        </div>
      ))}
    </div>
  );
}
