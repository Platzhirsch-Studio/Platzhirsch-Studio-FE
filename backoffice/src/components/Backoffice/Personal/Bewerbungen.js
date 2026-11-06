"use client";
// Bewerbungen (Konzept § 5.5): Kanban (Standard) mit Karte aus drei Zeilen (Name · Stelle + Alter · ein Kennzeichen,
// Fuß Avatar + Anhänge, keine Sterne), „Abgeschlossen“ eingeklappt, Züge nur nach Workflow und Rolle; gesperrte Ziele
// im Menü mit Grund. Liste mit Löschfrist. Neu-Dialog mit Kontakt-fieldset, Pflicht „Datenschutzinformation
// übermittelt“, Eingangsbestätigung und Duplikat-Hinweis.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import Dialog from "../Overlay/Dialog";
import Knopf from "../Knopf";
import Avatar from "../Avatar";
import StatusBadge from "../StatusBadge";
import Leer from "../Leer";
import Datumsfeld from "../Formular/Datumsfeld";
import LeitungBitten from "../LeitungBitten";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { bewerbungWorkflowAction, bewerbungAnlegenAction, bewerbungDuplikatAction } from "@/lib/backoffice/personal/actions";
import { T } from "@/lib/backoffice/personal/texte";
import { statusText, statusTon } from "@/lib/backoffice/personal/status";
import { BOARD_SPALTEN, ABGESCHLOSSEN, zieleVon } from "@/lib/backoffice/personal/regeln";
import { kurzDatum, langDatum, relativTage, tagKurz } from "@/lib/backoffice/personal/zeit";
import Board from "./Board";
import { GespraechSheet } from "./Gespraeche";
import { AbsageDialog } from "./Bewerberakte";
import { useCommitAktion } from "./Abwesenheit";
import "../DataTable/datatable.css";
import "./personal.css";
import { useWechsel } from "./hooks";

function Kennzeichen({ k, heute }) {
  if (!k) return null;
  if (k.art === "gespraech") return <span className="bo-per-kennzeichen" data-ton="see"><Icon name="Calendar" className="size-3" />{`${tagKurz(String(k.start).slice(0, 10))} ${String(k.start).slice(11, 16)} · ${k.modus}`}</span>;
  if (k.art === "loeschung") return <span className="bo-per-kennzeichen" data-ton="eiche" title={langDatum(k.datum)}>{T.bewerbung.kennzeichen.loeschung(k.rest)}</span>;
  if (k.art === "ohneUnterlagen") return <span className="bo-per-kennzeichen" data-ton="eiche">{T.bewerbung.kennzeichen.ohneUnterlagen}</span>;
  void heute;
  return <span className="bo-per-kennzeichen">{k.quelle}</span>;
}

function Karte({ b, heute }) {
  return (
    <>
      <span className="bo-per-karte__name pr-10">
        <Link href={`/personal/bewerbungen/${encodeURIComponent(b.name)}`} title={b.name}>
          {b.person}
        </Link>
      </span>
      <span className="bo-per-karte__zeile" data-alt={b.alterTage >= 7 && ["Eingegangen", "Gesichtet"].includes(b.status) ? "" : undefined}>
        {b.stelle_titel || T.bewerbung.kennzeichen.initiativ} · {relativTage(b.eingang, heute)}
      </span>
      <span>
        <Kennzeichen k={b.kennzeichen} heute={heute} />
      </span>
      <span className="bo-per-karte__fuss">
        {b.zugewiesen_an ? <Avatar name={b.zustaendigName} groesse={24} /> : <span className="text-[12px] text-bo-text-faint">–</span>}
        {b.anhaenge != null && (
          <span className="bo-per-karte__anh" aria-label={T.bewerbung.anhaenge(b.anhaenge)}>
            <Icon name="Paperclip" className="size-3.5" />
            {b.anhaenge}
          </span>
        )}
      </span>
    </>
  );
}

/**
 * @param {{bewerbungen:object[], heute:string, rolle:string, personen:Array, standardFuehrung:string}} p
 */
export function BewerbungsBoard({ bewerbungen, heute, rolle, personen, standardFuehrung, mitAbgeschlossen = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const commit = useCommitAktion();
  const [status, setStatus] = useState({});
  const [gespraech, setGespraech] = useState(null);
  const [absage, setAbsage] = useState(null);
  const [zeigeAb, setZeigeAb] = useState(mitAbgeschlossen);
  const [laufend, setLaufend] = useState(() => new Set());
  const liste = bewerbungen.map((b) => (status[b.name] ? { ...b, status: status[b.name] } : b));
  const aendern = (name, z) => setStatus((s) => (z ? { ...s, [name]: z } : Object.fromEntries(Object.entries(s).filter(([k]) => k !== name))));
  const ziele = (b) => (Number(b.pseudonymisiert) ? [] : zieleVon(b.status, rolle, { pseudonymisiert: Number(b.pseudonymisiert) }).map(({ nach, zug }) => ({ nach, titel: statusText("bewerbung", nach), erlaubt: zug.erlaubt, grund: zug.erlaubt ? undefined : zug.grund === "leitung" ? T.bewerbung.nurLeitung : T.fehler.keinRecht, zug })));
  const onZug = async (b, nach) => {
    const z = ziele(b).find((x) => x.nach === nach)?.zug;
    if (!z?.erlaubt) return;
    if (z.art === "sheet") return setGespraech(b);
    if (z.art === "assistent") return router.push(`/personal/bewerbungen/${encodeURIComponent(b.name)}?einstellen=1`);
    if (z.art === "absage") return setAbsage(b);
    aendern(b.name, nach);
    setLaufend((s) => new Set(s).add(b.name));
    const r = await commit(() => bewerbungWorkflowAction({ name: b.name, von: b.status, nach }), `${b.person} → ${statusText("bewerbung", nach)}`, {
      gruppe: `personal.bew-${nach}`,
      onVerworfen: () => aendern(b.name, null),
    });
    setLaufend((s) => {
      const n = new Set(s);
      n.delete(b.name);
      return n;
    });
    if (!r.ok) aendern(b.name, null);
  };
  const sichten = liste.filter((b) => b.status === "Eingegangen");
  const spalten = BOARD_SPALTEN.map((st) => ({
    status: st,
    titel: statusText("bewerbung", st),
    karten: liste.filter((b) => b.status === st && b.aufBoard),
    kopf: st === "Eingegangen" && sichten.length ? <Knopf size="s" variant="secondary" href={`/personal/bewerbungen/${encodeURIComponent(sichten.at(-1).name)}?modus=sichten`} data-testid="per-sichten-start">{T.bewerbung.sichten(sichten.length)}</Knopf> : null,
    fuss: st === "Eingestellt" ? <p className="px-1 text-[12px] text-bo-text-faint">{T.bewerbung.aelterImBericht}</p> : null,
  }));
  const ab = liste.filter((b) => ABGESCHLOSSEN.includes(b.status));
  return (
    <>
      <Board label={T.bewerbung.titel} spalten={spalten} ziele={ziele} onZug={onZug} laufend={laufend} onGesperrt={(b, z) => zeige(z.grund === T.bewerbung.nurLeitung && z.nach === "Abgesagt" ? T.bewerbung.absagenNurLeitung : z.grund, { art: "warnung" })} karte={(b) => <Karte b={b} heute={heute} />} />
      <section className="bo-per-abgeschlossen" aria-label={T.bewerbung.abgeschlossen}>
        <button type="button" className="bo-per-link inline-flex items-center gap-2 text-[14px]" aria-expanded={zeigeAb} onClick={() => setZeigeAb((x) => !x)} data-testid="per-abgeschlossen">
          <Icon name={zeigeAb ? "ChevronUp" : "ChevronDown"} className="size-4" />
          {T.bewerbung.abgeschlossen}: {ABGESCHLOSSEN.map((s) => `${statusText("bewerbung", s)} ${ab.filter((b) => b.status === s).length}`).join(" · ")}
        </button>
        {zeigeAb && (
          <div className="mt-4">
            <Board label={T.bewerbung.abgeschlossen} testid="per-board-abgeschlossen" spalten={ABGESCHLOSSEN.map((st) => ({ status: st, titel: statusText("bewerbung", st), karten: ab.filter((b) => b.status === st) }))} ziele={ziele} onZug={onZug} karte={(b) => <Karte b={b} heute={heute} />} />
          </div>
        )}
      </section>
      <GespraechSheet offen={Boolean(gespraech)} onSchliessen={() => setGespraech(null)} bewerbung={gespraech ? { name: gespraech.name, person: gespraech.person } : null} personen={personen} standardFuehrung={standardFuehrung} heute={heute} />
      <AbsageDialog offen={Boolean(absage)} onSchliessen={() => setAbsage(null)} bewerbungen={absage ? [absage] : []} onGeplant={() => absage && aendern(absage.name, "Abgesagt")} onVerworfen={() => absage && aendern(absage.name, null)} />
    </>
  );
}

/** Liste (§ 5.5): Name · Stelle · Quelle · Eingang · Zuständig · Nächstes Gespräch · Löschfrist · Status. */
export function BewerbungsListe({ bewerbungen, heute }) {
  return (
    <div className="bo-dt" data-testid="per-bewerbungen-liste">
      <div className="overflow-x-auto">
        <table className="bo-dt__tabelle">
          <thead>
            <tr>
              {["name", "quelle", "eingang", "zustaendig", "gespraech", "loeschfrist", "status"].map((k) => (
                <th key={k} scope="col">{T.bewerbung.spalten[k]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bewerbungen.map((b) => (
              <tr key={b.name}>
                <td className="bo-dt__kopfzelle">
                  <span className="bo-dt-objekt">
                    <Avatar name={b.person} groesse={40} />
                    <span className="min-w-0">
                      {Number(b.pseudonymisiert) ? <span className="bo-dt-objekt__titel text-bo-text-soft">{b.person}</span> : <Link href={`/personal/bewerbungen/${encodeURIComponent(b.name)}`} className="bo-dt-objekt__titel bo-dt-objekt__link">{b.person}</Link>}
                      <span className="bo-dt-objekt__unter">{b.stelle_titel || T.bewerbung.kennzeichen.initiativ}</span>
                    </span>
                  </span>
                </td>
                <td>{b.quelle}</td>
                <td className="whitespace-nowrap" title={langDatum(String(b.eingang).slice(0, 10))}>{relativTage(b.eingang, heute)}</td>
                <td>{b.zugewiesen_an ? <span className="inline-flex items-center gap-2"><Avatar name={b.zustaendigName} groesse={24} />{b.zustaendigName}</span> : "–"}</td>
                <td className="whitespace-nowrap">{b.naechstes ? `${tagKurz(String(b.naechstes.start).slice(0, 10))} ${kurzDatum(String(b.naechstes.start).slice(0, 10))} ${String(b.naechstes.start).slice(11, 16)}` : "–"}</td>
                <td className="whitespace-nowrap">{b.frist?.datum ? <span className={b.frist.warnung ? "text-bo-eiche-text" : ""}>{`${kurzDatum(b.frist.datum)} · ${relativTage(b.frist.datum, heute)}`}</span> : "–"}</td>
                <td><StatusBadge wert={b.status} text={statusText("bewerbung", b.status)} ton={statusTon("bewerbung", b.status)} groesse="m" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Neu-Dialog „Bewerbung erfassen“ (§ 5.5). */
export function NeueBewerbungDialog({ offen, onSchliessen, stellen = [], vorbelegtStelle = "" }) {
  const router = useRouter();
  const { zeige } = useToast();
  const id = useId();
  const leer = { vorname: "", nachname: "", email: "", telefon: "", stelle: vorbelegtStelle, quelle: "E-Mail", eingang: "", datenschutz: false, datenschutzWeg: "E-Mail", eingangsbestaetigung: true, anrede: "", sprache: "de", verfuegbar_ab: "", plz_ort: "", anschreiben: "" };
  const [w, setW] = useState(leer);
  const [fehler, setFehler] = useState({});
  const [dupl, setDupl] = useState([]);
  const [laeuft, start] = useTransition();
  useWechsel(offen, (o) => {
    if (!o) return;
    setW({ ...leer, stelle: vorbelegtStelle });
    setFehler({});
    setDupl([]);
  });
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const senden = (oeffnen) =>
    start(async () => {
      setFehler({});
      const r = await bewerbungAnlegenAction(w);
      if (!r.ok) return setFehler(r.fehler || { nachname: r.message });
      zeige(T.bewerbung.angelegt(`${w.vorname} ${w.nachname}`.trim()), { art: "ok" });
      onSchliessen();
      if (oeffnen) router.push(`/personal/bewerbungen/${encodeURIComponent(r.name)}`);
      else router.refresh();
    });
  const F = T.bewerbung.feld;
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={T.bewerbung.neuTitel}
      groesse="lg"
      testid="per-bewerbung-neu"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen}>{T.abbrechen}</Knopf>
          <Knopf variant="secondary" laedt={laeuft} onClick={() => senden(false)} data-testid="per-bewerbung-anlegen">{T.bewerbung.anlegen}</Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={() => senden(true)}>{T.bewerbung.anlegenOeffnen}</Knopf>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); senden(true); }}>
        <div className="bo-per-raster2">
          <label className="bo-per-feld"><span>{F.vorname}</span><input className="bo-per-auswahl" value={w.vorname} onChange={(e) => setze("vorname", e.target.value)} /></label>
          <label className="bo-per-feld"><span>{F.nachname} *</span><input className="bo-per-auswahl" value={w.nachname} onChange={(e) => setze("nachname", e.target.value)} aria-invalid={fehler.nachname ? "true" : undefined} data-testid="per-bew-nachname" />{fehler.nachname && <span className="bo-per-feld__fehler">{fehler.nachname}</span>}</label>
        </div>
        <fieldset className="flex flex-col gap-3 rounded-2xl bg-bo-surface-2 p-4" aria-describedby={fehler.kontakt ? `${id}-k` : undefined}>
          <legend className="px-1 text-[13px] font-medium text-bo-text-soft">{F.kontakt}</legend>
          <div className="bo-per-raster2">
            <label className="bo-per-feld"><span>{F.email}</span><input type="email" className="bo-per-auswahl" value={w.email} onChange={(e) => setze("email", e.target.value)} onBlur={async () => { const r = await bewerbungDuplikatAction({ email: w.email }); setDupl(r.ok ? r.treffer : []); }} aria-invalid={fehler.email || fehler.kontakt ? "true" : undefined} data-testid="per-bew-email" /></label>
            <label className="bo-per-feld"><span>{F.telefon}</span><input className="bo-per-auswahl" value={w.telefon} onChange={(e) => setze("telefon", e.target.value)} aria-invalid={fehler.kontakt ? "true" : undefined} /></label>
          </div>
          {fehler.kontakt && <span id={`${id}-k`} className="bo-per-feld__fehler">{fehler.kontakt}</span>}
          {fehler.email && <span className="bo-per-feld__fehler">{fehler.email}</span>}
          {dupl.length > 0 && <p className="bo-per-band-hinweis" data-ton="eiche">{dupl.map((d) => T.bewerbung.duplikat(d.name, statusText("bewerbung", d.status))).join(" · ")}</p>}
        </fieldset>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="bo-per-feld"><span>{F.stelle}</span><select className="bo-per-auswahl" value={w.stelle} onChange={(e) => setze("stelle", e.target.value)}><option value="">{F.initiativ}</option>{stellen.map((s) => <option key={s.name} value={s.name}>{s.titel}</option>)}</select></label>
          <label className="bo-per-feld"><span>{F.quelle}</span><select className="bo-per-auswahl" value={w.quelle} onChange={(e) => setze("quelle", e.target.value)}>{["E-Mail", "Website", "Empfehlung", "AMS", "LinkedIn", "Sonstige"].map((q) => <option key={q}>{q}</option>)}</select></label>
          <div className="bo-per-feld"><span>{F.eingang}</span><Datumsfeld value={w.eingang} onChange={(v) => setze("eingang", v)} aria-label={F.eingang} /></div>
        </div>
        {["AMS", "Empfehlung"].includes(w.quelle) && <p className="bo-per-band-hinweis">{F.art14}</p>}
        <div className="flex flex-col gap-3">
          <label className="bo-per-check"><input type="checkbox" checked={w.datenschutz} onChange={(e) => setze("datenschutz", e.target.checked)} aria-invalid={fehler.datenschutz ? "true" : undefined} data-testid="per-bew-datenschutz" /><span>{F.datenschutz} *</span></label>
          <label className="bo-per-feld max-w-xs"><span>{F.datenschutzWeg}</span><select className="bo-per-auswahl" value={w.datenschutzWeg} onChange={(e) => setze("datenschutzWeg", e.target.value)}>{["E-Mail", "Post", "Persönlich", "Website-Formular"].map((q) => <option key={q}>{q}</option>)}</select></label>
          {fehler.datenschutz && <span className="bo-per-feld__fehler">{fehler.datenschutz}</span>}
          <label className="bo-per-check"><input type="checkbox" checked={w.eingangsbestaetigung && Boolean(w.email)} disabled={!w.email} onChange={(e) => setze("eingangsbestaetigung", e.target.checked)} /><span>{F.bestaetigung}</span></label>
        </div>
        <details>
          <summary className="cursor-pointer text-[14px] font-medium text-bo-text-soft">{F.weitere}</summary>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="bo-per-feld"><span>{F.anrede}</span><select className="bo-per-auswahl" value={w.anrede} onChange={(e) => setze("anrede", e.target.value)}><option value="">–</option><option>Frau</option><option>Herr</option><option>Divers</option></select></label>
            <label className="bo-per-feld"><span>{F.sprache}</span><select className="bo-per-auswahl" value={w.sprache} onChange={(e) => setze("sprache", e.target.value)}><option value="de">Deutsch</option><option value="en">Englisch</option><option value="fr">Französisch</option><option value="it">Italienisch</option></select></label>
            <div className="bo-per-feld"><span>{F.verfuegbar}</span><Datumsfeld value={w.verfuegbar_ab} onChange={(v) => setze("verfuegbar_ab", v)} aria-label={F.verfuegbar} /></div>
            <label className="bo-per-feld"><span>{F.ort}</span><input className="bo-per-auswahl" value={w.plz_ort} onChange={(e) => setze("plz_ort", e.target.value)} /></label>
            <label className="bo-per-feld md:col-span-2"><span>{F.anschreiben}</span><textarea className="bo-per-auswahl bo-per-text" value={w.anschreiben} onChange={(e) => setze("anschreiben", e.target.value)} /></label>
          </div>
        </details>
      </form>
    </Dialog>
  );
}

/** Seitenkopf-Knopf „+ Bewerbung“. */
export function BewerbungNeuKnopf({ stellen, startOffen = false, vorbelegtStelle = "" }) {
  const [offen, setOffen] = useState(startOffen);
  return (
    <>
      <Knopf variant="primary" icon="Plus" onClick={() => setOffen(true)} kuerzel="Strg+Enter" data-testid="per-bewerbung-neu-knopf">{T.bewerbung.neu}</Knopf>
      <NeueBewerbungDialog offen={offen} onSchliessen={() => setOffen(false)} stellen={stellen} vorbelegtStelle={vorbelegtStelle} />
    </>
  );
}

export function BewerbungenLeer({ gefiltert, zuruecksetzenHref }) {
  return <Leer art={gefiltert ? "gefiltert" : "leer"} titel={gefiltert ? T.bewerbung.gefiltert : T.bewerbung.leer} text={gefiltert ? undefined : T.bewerbung.leerText} zuruecksetzenHref={zuruecksetzenHref} icon="Inbox" testid="per-bewerbungen-leer" />;
}

export { LeitungBitten };
