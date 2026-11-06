"use client";
// Team (Konzept § 5.8, E2/E10): Kalender als role="grid" (Personen × Tage, Ist-Stunden, Bänder mit Kürzel, fremde
// Art nur „abwesend“ mit Schraffur – serverseitig maskiert), Tagespanel mit Buchungen, Personen, Buchungen, Anträge
// mit Kontext (Vertretung, Teamstärke), „+ Abwesenheit“ für die Leitung. Pfeiltasten von Zelle zu Zelle, Enter öffnet.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Sheet from "../Overlay/Sheet";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import Avatar from "../Avatar";
import StatusBadge from "../StatusBadge";
import Leer from "../Leer";
import Datumsfeld from "../Formular/Datumsfeld";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { gehenJetztAction, mitarbeiterAnlegenAction, pauseSammelAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { statusText, statusTon, artText, rolleInternText, ausmassText, ROLLE_INTERN } from "@/lib/backoffice/personal/status";
import { ART_KUERZEL, ART_MATERIAL } from "@/lib/backoffice/personal/sichtbarkeit";
import { hm, tagKurz, tagLang, kurzDatum, langDatum, istWochenende, zeitraumText, plusTage } from "@/lib/backoffice/personal/zeit";
import { AntragKnoepfe, KrankKnoepfe, UrlaubSheet, KrankSheet } from "./Abwesenheit";
import { NachtragDialog } from "./Zeiten";
import "../DataTable/datatable.css";
import "./personal.css";

function Band({ a, tag, tage }) {
  const i = tage.indexOf(tag);
  const anfang = a.von >= tag || i === 0;
  const ende = a.bis <= tag || i === tage.length - 1;
  const fremd = a.maskiert;
  const art = fremd ? "abwesend" : a.art;
  const beantragt = a.status === "Beantragt";
  return (
    <span className="bo-per-band" data-material={ART_MATERIAL[art] || "stein"} data-schraffur={fremd ? "" : undefined} data-beantragt={beantragt && !fremd ? "" : undefined} data-anfang={anfang ? undefined : "nein"} data-ende={ende ? undefined : "nein"} aria-hidden="true">
      {anfang && (
        <>
          {art === "Krankenstand" && <Icon name="Info" className="size-3" />}
          {ART_KUERZEL[art] || "AB"}
        </>
      )}
    </span>
  );
}

/**
 * Teamkalender (Woche: Zahl + Band; Monat: Band, Zahl im Tagespanel).
 * @param {{zeilen:object[], tage:string[], heute:string, monat:boolean, leitung:boolean, staerke:object[], uhrzeiten:boolean}} p
 */
export function TeamKalender({ zeilen, tage, heute, monat = false, leitung = false, staerke = [], buchungenJeTag = {} }) {
  const [fokus, setFokus] = useState({ r: 0, c: Math.max(0, tage.indexOf(heute)) });
  const [panel, setPanel] = useState(null);
  const ref = useRef(null);
  const bewege = (r, c) => {
    const rr = Math.max(0, Math.min(zeilen.length - 1, r));
    const cc = Math.max(0, Math.min(tage.length - 1, c));
    setFokus({ r: rr, c: cc });
    requestAnimationFrame(() => ref.current?.querySelector(`[data-zelle="${rr}-${cc}"]`)?.focus());
  };
  const taste = (e) => {
    const { r, c } = fokus;
    const m = { ArrowRight: [r, c + 1], ArrowLeft: [r, c - 1], ArrowDown: [r + 1, c], ArrowUp: [r - 1, c], Home: e.ctrlKey ? [0, 0] : [r, 0], End: e.ctrlKey ? [zeilen.length - 1, tage.length - 1] : [r, tage.length - 1] }[e.key];
    if (m) {
      e.preventDefault();
      bewege(...m);
    }
  };
  const legende = [...new Set(zeilen.flatMap((z) => z.baender.map((b) => (b.maskiert ? "abwesend" : b.art))))];
  return (
    <>
      <div className="bo-kachel bo-kachel--dicht" data-testid="per-teamkalender">
        <div className="bo-per-raster-huelle">
          <table className="bo-per-raster" role="grid" aria-label={T.team.ansichten.kalender} ref={ref} onKeyDown={taste}>
            <thead>
              <tr role="row">
                <th scope="col" className="bo-per-raster__person">{T.team.person}</th>
                {tage.map((t) => (
                  <th key={t} scope="col" data-heute={t === heute ? "" : undefined} role="columnheader">
                    <span>{monat ? Number(t.slice(8)) : `${tagKurz(t)} ${t.slice(8)}`}</span>
                  </th>
                ))}
                <th scope="col" className="bo-per-raster__summe">{T.team.ist}</th>
              </tr>
            </thead>
            <tbody>
              {zeilen.map((z, r) => (
                <tr key={z.name} role="row">
                  <th scope="row" className="bo-per-raster__person">
                    <Link href={`/personal/mitarbeiter/${encodeURIComponent(z.name)}`} className="flex items-center gap-2.5">
                      <Avatar name={z.titel} groesse={28} />
                      <span className="bo-per-link truncate text-[14px]">{z.titel}</span>
                    </Link>
                  </th>
                  {tage.map((t, c) => {
                    const d = z.tage[t];
                    const a = z.baender.find((b) => b.von <= t && b.bis >= t);
                    const text = a ? `${a.maskiert ? T.zeiten.abwesend : artText(a.art)}${a.status === "Beantragt" ? `, ${T.team.beantragt}` : ""}` : d?.laeuft ? T.team.laeuft : d?.offen ? T.team.offen : d ? hm(d.min) : T.team.keineBuchung;
                    return (
                      <td key={t} role="gridcell" data-wochenende={istWochenende(t) ? "" : undefined}>
                        <button
                          type="button"
                          className="bo-per-zelle"
                          data-zelle={`${r}-${c}`}
                          data-heute={t === heute ? "" : undefined}
                          tabIndex={fokus.r === r && fokus.c === c ? 0 : -1}
                          aria-label={T.team.zelle(z.titel, `${tagLang(t)} ${Number(t.slice(8))}.${Number(t.slice(5, 7))}.`, text)}
                          onFocus={() => setFokus({ r, c })}
                          onClick={() => setPanel({ z, t })}
                        >
                          {a ? <Band a={a} tag={t} tage={tage} /> : !monat && (d?.laeuft ? <span className="bo-per-zelle__laeuft">{T.team.laeuft}</span> : d?.offen ? <span className="bo-per-zelle__offen">{T.team.offen}</span> : d ? hm(d.min) : "")}
                        </button>
                      </td>
                    );
                  })}
                  <td className="bo-per-raster__summe font-medium">{z.ist ? hm(z.ist) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 px-2 pt-2">
          <ul className="bo-per-legende" aria-label={T.team.legende}>
            {legende.map((l) => (
              <li key={l}>
                <span className="bo-per-band static inline-flex h-5 px-2" data-material={ART_MATERIAL[l] || "stein"} data-schraffur={l === "abwesend" ? "" : undefined}>{ART_KUERZEL[l] || "AB"}</span>
                {artText(l)}
              </li>
            ))}
          </ul>
          <div className="bo-per-staerke">
            {staerke.map((s) => (
              <span key={s.team} className="bo-per-kennzeichen" data-ton={s.da < s.gesamt / 2 ? "eiche" : undefined}>
                {T.team.teamZeile(T.team.teams[s.team], s.da, s.gesamt)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Tagespanel offen={Boolean(panel)} onSchliessen={() => setPanel(null)} zeile={panel?.z} tag={panel?.t} heute={heute} leitung={leitung} buchungen={panel ? buchungenJeTag[`${panel.z.name}|${panel.t}`] || [] : []} />
    </>
  );
}

function Tagespanel({ offen, onSchliessen, zeile, tag, heute, leitung, buchungen }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [nachtrag, setNachtrag] = useState(false);
  const [, start] = useTransition();
  if (!zeile) return null;
  const a = zeile.baender.find((b) => b.von <= tag && b.bis >= tag);
  const d = zeile.tage[tag];
  return (
    <>
      <Sheet offen={offen} onSchliessen={onSchliessen} titel={T.team.tagespanel(zeile.titel, `${tagKurz(tag)} ${kurzDatum(tag)}`)} groesse="md" testid="per-tagespanel"
        fuss={leitung && tag <= heute ? <Knopf variant="secondary" icon="Plus" onClick={() => setNachtrag(true)}>{T.team.nachtragen}</Knopf> : null}>
        <div className="flex flex-col gap-4">
          {a && <p className="bo-per-band-hinweis">{`${a.maskiert ? T.zeiten.abwesend : artText(a.art)} ${zeitraumText(a.von, a.bis)} · ${statusText(a.quelle === "krank" ? "krank" : "abwesenheit", a.status)}`}</p>}
          {buchungen.length ? (
            <ul className="bo-per-zeilen">
              {buchungen.map((b) => (
                <li key={b.name} className="bo-per-zeile">
                  <span className="bo-per-zeile__icon" data-ton={b.gehen ? "stein" : "salbei"} aria-hidden="true"><Icon name="Clock" className="size-4" /></span>
                  <span><span className="bo-per-zeile__titel bo-per-zahl">{`${b.kommen}–${b.gehen || "…"}`}</span><span className="bo-per-zeile__unter">{b.gehen ? `${T.zeiten.spalten.pause} ${b.pause_min} min · ${T.zeiten.spalten.netto} ${hm(b.netto)}` : statusText("buchung", "Offen")}</span></span>
                  {leitung && !b.gehen && tag === heute && (
                    <Knopf size="s" variant="secondary" onClick={async () => { const r = await gehenJetztAction({ buchung: b.name }); if (!r.ok) return zeige(r.message, { art: "fehler" }); zeige(T.team.gespeichert, { art: "ok" }); start(() => router.refresh()); onSchliessen(); }}>{T.team.gehenJetzt}</Knopf>
                  )}
                  {b.gehen && <StatusBadge wert={b.status} text={statusText("buchung", b.status)} ton={statusTon("buchung", b.status)} groesse="xs" />}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{d ? hm(d.min) : T.team.keineBuchung}</p>
          )}
          {buchungen.some((b) => b.netto > 600) && <p className="bo-per-band-hinweis" data-ton="eiche">{T.zeiten.azg}</p>}
          <Link href={`/personal/mitarbeiter/${encodeURIComponent(zeile.name)}?monat=${tag.slice(0, 7)}`} className="bo-per-link text-[14px]">Personalakte öffnen</Link>
        </div>
      </Sheet>
      <NachtragDialog offen={nachtrag} onSchliessen={() => setNachtrag(false)} heute={heute} mitarbeiter={zeile.name} leitung datum={tag} />
    </>
  );
}

/** Anträge (Beantragt zuerst) mit Kontext und Inline-Entscheidung; Krankmeldungen nur Leitung/GF ohne Ablehnen. */
export function AntraegeListe({ antraege, heute, leitung }) {
  const [weg, setWeg] = useState(() => new Set());
  const sichtbar = antraege.filter((a) => !weg.has(a.name));
  if (!sichtbar.length) return <Leer art="erledigt" titel={T.antrag.alleErledigt} text="" testid="per-antraege-leer" />;
  return (
    <div className="bo-kachel" data-testid="per-antraege">
      <ul className="bo-per-zeilen">
        {sichtbar.map((a) => (
          <li key={a.name} className="bo-per-zeile" data-testid={`per-antrag-${a.name}`}>
            <Avatar name={a.mitarbeiter_name} groesse={40} />
            <span className="min-w-0">
              <span className="bo-per-zeile__titel">{`${a.mitarbeiter_name} · ${a.maskiert ? T.zeiten.abwesend : artText(a.art)} · ${zeitraumText(a.von, a.bis)}`}</span>
              <span className="bo-per-zeile__unter" data-warn={a.staerke && a.staerke.da - 1 < a.staerke.gesamt / 2 ? "" : undefined}>
                {[a.vertretungName ? T.zeilen.vertretung(a.vertretungName) : null, a.staerke ? T.zeilen.teamStaerke(T.team.teams[a.team], Math.max(0, a.staerke.da - 1), a.staerke.gesamt) : null, a.begruendung || null, a.typ === "krank" ? statusText("krank", a.status) : null].filter(Boolean).join(" · ")}
              </span>
            </span>
            <span className="bo-per-zeile__aktionen">
              {a.typ === "krank" ? <KrankKnoepfe krank={a} heute={heute} leitung={leitung} kompakt /> : <AntragKnoepfe antrag={a} entscheidbar={a.entscheidbar} kompakt onErledigt={(j) => setWeg((s) => { const n = new Set(s); if (j) n.add(a.name); else n.delete(a.name); return n; })} />}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Personen (Karten-Tabelle) mit heute-Zustand; Saldo/Resturlaub nur Leitung + konten (hier nicht gezeigt, siehe Akte). */
export function PersonenListe({ personen, heute }) {
  if (!personen.length) return <Leer art="leer" titel={T.team.personenLeer} text={T.team.personenLeerText} icon="Users" />;
  return (
    <div className="bo-dt" data-testid="per-personen">
      <div className="overflow-x-auto">
        <table className="bo-dt__tabelle">
          <thead><tr>{["name", "teams", "ausmass", "stunden", "eintritt", "status", "heute"].map((k) => <th key={k} scope="col">{T.team.spaltenP[k]}</th>)}</tr></thead>
          <tbody>
            {personen.map((m) => (
              <tr key={m.name}>
                <td className="bo-dt__kopfzelle"><span className="bo-dt-objekt"><Avatar name={m.titel} groesse={40} /><span className="min-w-0"><Link href={`/personal/mitarbeiter/${encodeURIComponent(m.name)}`} className="bo-dt-objekt__titel bo-dt-objekt__link">{m.titel}</Link><span className="bo-dt-objekt__unter">{rolleInternText(m.rolle_intern)}</span></span></span></td>
                <td>{m.teams.map((t) => T.team.teams[t]).join(", ") || "–"}</td>
                <td>{ausmassText(m.beschaeftigungsart)}</td>
                <td className="bo-per-zahl">{m.wochenstunden ? String(m.wochenstunden).replace(".", ",") : "–"}</td>
                <td className="whitespace-nowrap">{langDatum(m.eintritt)}</td>
                <td><StatusBadge wert={m.status} text={statusText("mitarbeiter", m.status)} ton={statusTon("mitarbeiter", m.status)} groesse="m" /></td>
                <td className="text-bo-text-soft">{m.heute}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-3 pt-3 text-[12px] text-bo-text-faint">{heute ? "" : ""}</p>
    </div>
  );
}

/** Buchungen (Monat) mit Chips Offen/Erfasst/Korrigiert, Kennzeichen, Sammelaktion „Pause 30 min setzen“. */
export function BuchungenListe({ buchungen, leitung, leerText }) {
  const router = useRouter();
  const { zeige } = useToast();
  const kandidaten = buchungen.filter((b) => b.status !== "Offen" && !Number(b.pause_min) && b.gehen);
  if (!buchungen.length) return <Leer art="leer" titel={leerText} icon="Clock" testid="per-buchungen-leer" />;
  return (
    <div className="bo-dt" data-testid="per-buchungen">
      {leitung && kandidaten.length > 0 && (
        <div className="bo-dt__kopf"><Knopf size="s" variant="secondary" onClick={async () => { const r = await pauseSammelAction({ namen: kandidaten.map((b) => b.name) }); if (!r.ok) return zeige(r.message, { art: "fehler" }); zeige(`${r.anzahl} × ${T.team.pauseSetzen}`, { art: "ok" }); router.refresh(); }}>{`${T.team.pauseSetzen} (${kandidaten.length})`}</Knopf></div>
      )}
      <div className="overflow-x-auto">
        <table className="bo-dt__tabelle bo-per-monat" data-dicht>
          <thead><tr>{["datum", "person", "kommen", "gehen", "pause", "netto", "art", "status", "kennzeichen"].map((k) => <th key={k} scope="col">{T.team.spaltenB[k]}</th>)}</tr></thead>
          <tbody>
            {buchungen.slice(0, 300).map((b) => (
              <tr key={b.name}>
                <td>{`${tagKurz(b.datum)} ${kurzDatum(b.datum)}`}</td>
                <td><Link href={`/personal/mitarbeiter/${encodeURIComponent(b.mitarbeiter)}`} className="bo-per-link">{b.mitarbeiter_name}</Link></td>
                <td>{b.kommen}</td>
                <td>{b.gehen || <span className="bo-per-zelle__offen">{T.team.offen}</span>}</td>
                <td>{b.gehen ? `${b.pause_min} min` : "–"}</td>
                <td className="font-medium">{b.netto != null ? hm(b.netto) : "–"}</td>
                <td>{b.art}</td>
                <td><StatusBadge wert={b.status} text={statusText("buchung", b.status)} ton={statusTon("buchung", b.status)} groesse="xs" /></td>
                <td>
                  <span className="flex flex-wrap gap-1">
                    {b.korrektur_status === "Beantragt" && <span className="bo-per-kennzeichen" data-ton="see">{T.zeiten.korrekturAngefragt}</span>}
                    {b.gehen && !Number(b.pause_bestaetigt) && Number(b.pause_min) > 0 && <span className="bo-per-kennzeichen" data-ton="eiche">{T.zeiten.pauseVorgeschlagen}</span>}
                    {(Number(b.azg_verstoesse) > 0 || b.netto > 600) && <span className="bo-per-kennzeichen" data-ton="eiche">{T.zeiten.azg}</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** „+ Abwesenheit ▾“ (Leitung): Abwesenheit für eine Person · Krankmeldung erfassen · Buchung nachtragen · Mitarbeiter. */
export function TeamNeu({ personen, heute, start: startWert = null, darfMitarbeiter = false, leitung = false }) {
  const [offen, setOffen] = useState(startWert);
  return (
    <div className="flex flex-wrap gap-2">
      {darfMitarbeiter && <Knopf variant="secondary" icon="UserPlus" onClick={() => setOffen("mitarbeiter")} data-testid="per-mitarbeiter-neu">{T.uebersicht.neuMenue.mitarbeiter}</Knopf>}
      {leitung && <Knopf variant="secondary" onClick={() => setOffen("krank")}>{T.krank.titelFuer}</Knopf>}
      {leitung && <Knopf variant="secondary" icon="Clock" onClick={() => setOffen("buchung")}>{T.team.nachtragen}</Knopf>}
      {leitung && <Knopf variant="primary" icon="CalendarPlus" onClick={() => setOffen("abwesenheit")} kuerzel="Strg+Enter" data-testid="per-abwesenheit-neu">{T.team.neu}</Knopf>}
      <UrlaubSheet offen={offen === "abwesenheit"} onSchliessen={() => setOffen(null)} heute={heute} fuerPerson personen={personen} vertretungen={personen} darfVertretung />
      <KrankSheet offen={offen === "krank"} onSchliessen={() => setOffen(null)} heute={heute} fuerPerson personen={personen} />
      <NachtragDialog offen={offen === "buchung"} onSchliessen={() => setOffen(null)} heute={heute} leitung personen={personen} />
      <MitarbeiterNeuDialog offen={offen === "mitarbeiter"} onSchliessen={() => setOffen(null)} heute={heute} />
    </div>
  );
}

function MitarbeiterNeuDialog({ offen, onSchliessen, heute }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [w, setW] = useState({ vorname: "", nachname: "", rolle: "", eintritt: heute, ausmass: "Vollzeit", wochenstunden: "38,5", user: "" });
  const [fehler, setFehler] = useState({});
  const [laeuft, start] = useTransition();
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  return (
    <Dialog offen={offen} onSchliessen={onSchliessen} titel="Mitarbeiter anlegen" groesse="md" testid="per-mitarbeiter-dialog"
      fuss={<><Knopf variant="ghost" onClick={onSchliessen}>{T.abbrechen}</Knopf><Knopf variant="primary" laedt={laeuft} onClick={() => start(async () => { const r = await mitarbeiterAnlegenAction({ ...w, wochenstunden: Number(String(w.wochenstunden).replace(",", ".")) }); if (!r.ok) return setFehler(r.fehler || { vorname: r.message }); zeige("Mitarbeiter angelegt", { art: "ok" }); onSchliessen(); router.push(`/personal/mitarbeiter/${encodeURIComponent(r.name)}?tab=stammdaten`); })}>{T.bewerbung.anlegen}</Knopf></>}>
      <div className="bo-per-raster2">
        {["vorname", "nachname"].map((f) => <label key={f} className="bo-per-feld"><span>{f === "vorname" ? "Vorname *" : "Nachname *"}</span><input className="bo-per-auswahl" value={w[f]} onChange={(e) => setze(f, e.target.value)} aria-invalid={fehler[f] ? "true" : undefined} />{fehler[f] && <span className="bo-per-feld__fehler">{fehler[f]}</span>}</label>)}
        <label className="bo-per-feld"><span>Rolle *</span><select className="bo-per-auswahl" value={w.rolle} onChange={(e) => setze("rolle", e.target.value)}><option value="">–</option>{Object.entries(ROLLE_INTERN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>{fehler.rolle && <span className="bo-per-feld__fehler">{fehler.rolle}</span>}</label>
        <div className="bo-per-feld"><span>Eintritt *</span><Datumsfeld value={w.eintritt} onChange={(v) => setze("eintritt", v)} aria-label="Eintritt" /></div>
        <label className="bo-per-feld"><span>{T.team.spaltenP.ausmass}</span><select className="bo-per-auswahl" value={w.ausmass} onChange={(e) => setze("ausmass", e.target.value)}>{["Vollzeit", "Teilzeit", "Geringfuegig", "Lehre", "Praktikum"].map((k) => <option key={k} value={k}>{ausmassText(k)}</option>)}</select></label>
        <label className="bo-per-feld"><span>{T.einstellen.wochenstunden}</span><input className="bo-per-auswahl" value={w.wochenstunden} onChange={(e) => setze("wochenstunden", e.target.value)} inputMode="decimal" /></label>
        <label className="bo-per-feld md:col-span-2"><span>Benutzer (E-Mail)</span><input className="bo-per-auswahl" value={w.user} onChange={(e) => setze("user", e.target.value)} /><span className="bo-per-feld__hilfe">{T.einstellen.benutzerHinweis}</span></label>
      </div>
    </Dialog>
  );
}

export { plusTage };
