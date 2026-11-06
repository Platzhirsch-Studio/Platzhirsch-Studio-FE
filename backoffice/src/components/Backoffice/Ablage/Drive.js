"use client";
// Drive-Seite der Ablage (Konzept §3.1): Ordnerbaum · Pfad · Ordnerkacheln · Dateien (Raster/Liste) ·
// Vorschau-Panel; Hochladen per Ziehen auf die Seite oder Knopf; Massenaktionen; Kürzel aus dem Register.
// Zustand in der URL (?ordner=&ansicht=&sort=&q=&endung=&datei=) – Browser-Zurück funktioniert (Q-B7).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownUp, ChevronRight, CloudUpload, Folder, FolderLock, FolderOpen, Search, ShieldCheck, Users } from "lucide-react";
import Knopf from "../Knopf";
import Segment from "../Segment";
import Leer from "../Leer";
import Dialog from "../Overlay/Dialog";
import Bestaetigen from "../Bestaetigen";
import { Menue, MenuePunkt, MenueTrenner } from "../Overlay/Popover";
import { useToast } from "../Toast";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { ART_FILTER, MODUS } from "@/lib/backoffice/ablage/labels";
import { istLeitung, ordnerName } from "@/lib/backoffice/ablage/regeln";
import { loeschenVieleAction, ordnerAnlegenAction, ordnerEinstellenAction, ordnerLoeschenAction, ordnerUmbenennenAction, verschiebenAction, wiederherstellenVieleAction } from "@/lib/backoffice/ablage/actions";
import { T } from "@/lib/backoffice/ablage/texte";
import Dateien from "./Dateien";
import DateiPanel from "./DateiPanel";
import Ordnerbaum from "./Ordnerbaum";
import UploadSchlange from "./UploadSchlange";
import useUpload from "./useUpload";
import useDateiWerkzeug from "./DateiWerkzeug";

export const EREIGNIS_HOCHLADEN = "ph-ablage:hochladen";
export const EREIGNIS_ORDNER = "ph-ablage:neuer-ordner";

const SORT_OPTIONEN = [
  ["name", "Name"],
  ["-geaendert", "Zuletzt geändert"],
  ["-erstellt", "Neueste zuerst"],
  ["-groesse", "Größe"],
  ["endung", "Art"],
];

function hrefMit(basis, p) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `${basis}?${s}` : basis;
}

function OrdnerKachel({ o, href, onAblegen }) {
  const [ziel, setZiel] = useState(false);
  const Ico = o.effektiver_modus === "leitung" ? FolderLock : Folder;
  const material = o.farbe && /^[a-z]+$/.test(o.farbe) ? o.farbe : o.ist_bezugswurzel ? "eiche" : o.aufbewahrungsklasse === "Beleg" ? "cognac" : "travertin";
  return (
    <Link
      href={href}
      className="bo-abl-ordner"
      data-ziel={ziel ? "true" : undefined}
      data-testid="abl-ordner"
      onDragOver={(e) => {
        if (!onAblegen || !e.dataTransfer.types.includes("application/x-ph-datei")) return;
        e.preventDefault();
        setZiel(true);
      }}
      onDragLeave={() => setZiel(false)}
      onDrop={(e) => {
        setZiel(false);
        const roh = e.dataTransfer.getData("application/x-ph-datei");
        if (!roh || !onAblegen) return;
        e.preventDefault();
        try {
          onAblegen(o, JSON.parse(roh));
        } catch {
          /* ignorieren */
        }
      }}
    >
      <span className="bo-abl-ordner__ico" data-material={material}>
        <Ico className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="bo-abl-ordner__text">
        <span className="bo-abl-ordner__titel" title={o.titel}>
          {ordnerName(o)}
        </span>
        <span className="bo-abl-ordner__unter">
          {o.ist_bezugswurzel && o.bezug_name ? o.bezug_name : o.anzahl_dateien ? T.inhalt.anzahl(o.anzahl_dateien) : o.hat_kinder ? T.inhalt.ordner : T.inhalt.anzahl(0)}
          {o.aufbewahrungsklasse === "Beleg" && (
            <>
              <span aria-hidden="true">·</span>
              <ShieldCheck className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              Beleg
            </>
          )}
          {o.effektiver_modus === "team" && o.ist_bezugswurzel ? (
            <>
              <span aria-hidden="true">·</span>
              <Users className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
              {T.baum.team}
            </>
          ) : null}
        </span>
      </span>
    </Link>
  );
}

function OrdnerDialog({ offen, eltern, leitung, onSchliessen, onFertig, start }) {
  const [titel, setTitel] = useState(start?.titel || "");
  const [modus, setModus] = useState(start?.rechte_modus || "");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const bearbeiten = Boolean(start);
  const senden = async (e) => {
    e?.preventDefault();
    if (!titel.trim()) return setFehler(T.upload.nameLeer);
    setLaeuft(true);
    let r;
    if (bearbeiten) {
      r = titel.trim() !== start.titel ? await ordnerUmbenennenAction({ ordner: start.ordner, titel: titel.trim() }) : { ok: true };
      if (r.ok && modus !== (start.rechte_modus || "")) r = await ordnerEinstellenAction({ ordner: start.ordner, rechte_modus: modus });
    } else r = await ordnerAnlegenAction({ titel: titel.trim(), eltern: eltern?.ordner, rechte_modus: modus || undefined });
    setLaeuft(false);
    if (!r.ok) return setFehler(r.message);
    onFertig(r.daten, titel.trim());
  };
  const modi = [{ wert: "", titel: "Wie oben" }, { wert: "team", titel: MODUS.team.titel }, ...(leitung ? [{ wert: "leitung", titel: MODUS.leitung.titel }] : [])];
  return (
    <Dialog
      offen={offen}
      onSchliessen={onSchliessen}
      titel={bearbeiten ? T.aktionen.ordnerUmbenennen.replace(" …", "") : T.dialog.ordnerNeu}
      text={!bearbeiten && eltern ? T.dialog.ordnerIn(eltern.titel) : undefined}
      sperren={laeuft}
      groesse="sm"
      testid="abl-ordner-dialog"
      fuss={
        <>
          <Knopf variant="ghost" onClick={onSchliessen} disabled={laeuft}>
            {T.dialog.abbrechen}
          </Knopf>
          <Knopf variant="primary" onClick={senden} laedt={laeuft} data-testid="abl-ordner-anlegen">
            {bearbeiten ? T.dialog.speichern : T.dialog.anlegen}
          </Knopf>
        </>
      }
    >
      <form onSubmit={senden} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-bo-text-soft">{T.dialog.ordnerName}</span>
          <input className="bo-input" value={titel} onChange={(e) => (setTitel(e.target.value), setFehler(null))} autoFocus maxLength={140} data-testid="abl-ordner-name" />
          {fehler && (
            <span className="text-xs text-bo-ziegel-text" role="alert">
              {fehler}
            </span>
          )}
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-bo-text-soft">{T.dialog.modus}</span>
          <Segment label={T.dialog.modus} wert={modus} onWechsel={setModus} optionen={modi} breit />
        </div>
      </form>
    </Dialog>
  );
}

/**
 * @param {object} p  Daten der Seite (serialisierbar, ladeDrive)
 */
export default function Drive({ daten, params, info, user, rollen, schreiben, anlegen, zaehler, namen, ordnerTitel = {}, zipStatus, linkMailen }) {
  const router = useRouter();
  const pfadname = usePathname();
  const { zeige } = useToast();
  const ordner = params.ordner || null;
  const aktuell = daten.aktuell;
  const kette = daten.kette || [];
  const ansicht = params.ansicht === "liste" ? "liste" : "raster";
  const [quelle, setQuelle] = useState(daten.dateien.items);
  const [items, setItems] = useState(daten.dateien.items);
  if (quelle !== daten.dateien.items) {
    setQuelle(daten.dateien.items);
    setItems(daten.dateien.items);
  }
  const [panel, setPanel] = useState(params.datei || null);
  const [auswahl, setAuswahl] = useState(() => new Set());
  const [zone, setZone] = useState(false);
  const [ordnerDialog, setOrdnerDialog] = useState(null);
  const [ordnerLoeschen, setOrdnerLoeschen] = useState(false);
  const [suche, setSuche] = useState(params.q || "");
  const dateiInput = useRef(null);
  const tiefe = useRef(0);

  const href = useCallback((p) => hrefMit("/ablage", { ordner, ansicht: params.ansicht, sort: params.sort, endung: params.endung, q: params.q, ...p }), [ordner, params.ansicht, params.sort, params.endung, params.q]);
  const ordnerHref = useCallback((o) => hrefMit("/ablage", { ordner: o, ansicht: params.ansicht, sort: params.sort }), [params.ansicht, params.sort]);

  const upload = useUpload({
    info,
    onFertig: (d) => {
      if (!d?.datei || d.verworfen) return;
      if (d.ordner === ordner) setItems((l) => [{ ...d, _neu: true }, ...l.filter((x) => x.datei !== d.datei)]);
      router.refresh();
    },
  });
  const hochgeladen = upload.eintraege.filter((e) => e.zustand === "fertig").length;
  const letzteMeldung = useRef(0);
  useEffect(() => {
    const laeuft = upload.eintraege.some((e) => ["wartet", "pruefe", "sendet", "schliesst"].includes(e.zustand));
    if (!laeuft && hochgeladen > letzteMeldung.current) {
      zeige(T.toast.hochgeladen(hochgeladen - letzteMeldung.current), { art: "ok" });
      letzteMeldung.current = hochgeladen;
    }
  }, [upload.eintraege, hochgeladen, zeige]);

  const werkzeug = useDateiWerkzeug({
    info,
    rollen,
    user,
    schreiben,
    linkMailen,
    onGeaendert: (d) => setItems((l) => l.map((x) => (x.datei === d.datei ? { ...x, ...d } : x))),
    onEntfernt: (d) => {
      setItems((l) => l.filter((x) => x.datei !== d.datei));
      if (panel === d.datei) setPanel(null);
    },
    onNeueVersion: (f, d) => upload.starte([f], { ordner: d.ordner, zielDatei: d.datei }),
  });

  const waehle = useCallback(
    (d) => {
      const neu = panel === d.datei ? null : d.datei;
      setPanel(neu);
      const q = new URLSearchParams(window.location.search);
      if (neu) q.set("datei", neu);
      else q.delete("datei");
      const s = q.toString();
      window.history.replaceState(window.history.state, "", s ? `${pfadname}?${s}` : pfadname);
    },
    [panel, pfadname]
  );
  const schliessePanel = useCallback(() => {
    if (!panel) return;
    const el = document.querySelector(`[data-abl-liste] [aria-pressed="true"]`);
    waehle({ datei: panel });
    el?.focus?.();
  }, [panel, waehle]);

  const auswaehlen = (d) =>
    setAuswahl((s) => {
      const n = new Set(s);
      if (n.has(d.datei)) n.delete(d.datei);
      else n.add(d.datei);
      return n;
    });

  const uploadRef = useRef(upload);
  useEffect(() => {
    uploadRef.current = upload;
  });
  const starteUpload = useCallback(
    (dateien) => {
      if (!ordner || !anlegen) return zeige(T.fehler.ordnerFehlt, { art: "info" });
      uploadRef.current.starte(dateien, { ordner, ordnerTitel: aktuell?.titel });
    },
    [ordner, anlegen, aktuell?.titel, zeige]
  );

  // ?hochladen=1 (Palette, Akten-Slot): Hochladen-Knopf in den Fokus – Dateiauswahl braucht einen Klick (Browser).
  useEffect(() => {
    if (params.hochladen && ordner) document.querySelector('[data-testid="abl-hochladen"]')?.focus();
  }, [params.hochladen, ordner]);

  // Kopf-Knöpfe (Server-Seitenkopf) melden sich über Ereignisse
  useEffect(() => {
    const hoch = () => dateiInput.current?.click();
    const neu = () => setOrdnerDialog({ neu: true });
    window.addEventListener(EREIGNIS_HOCHLADEN, hoch);
    window.addEventListener(EREIGNIS_ORDNER, neu);
    return () => {
      window.removeEventListener(EREIGNIS_HOCHLADEN, hoch);
      window.removeEventListener(EREIGNIS_ORDNER, neu);
    };
  }, []);

  // Ablegen auf der ganzen Seite (nur Dateien von außen)
  useEffect(() => {
    if (!ordner || !anlegen) return undefined;
    const istDatei = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
    const rein = (e) => {
      if (!istDatei(e)) return;
      e.preventDefault();
      tiefe.current += 1;
      setZone(true);
    };
    const ueber = (e) => {
      if (!istDatei(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    const raus = (e) => {
      if (!istDatei(e)) return;
      tiefe.current = Math.max(0, tiefe.current - 1);
      if (!tiefe.current) setZone(false);
    };
    const ab = (e) => {
      if (!istDatei(e)) return;
      e.preventDefault();
      tiefe.current = 0;
      setZone(false);
      if (e.dataTransfer.files?.length) starteUpload(e.dataTransfer.files);
    };
    window.addEventListener("dragenter", rein);
    window.addEventListener("dragover", ueber);
    window.addEventListener("dragleave", raus);
    window.addEventListener("drop", ab);
    return () => {
      window.removeEventListener("dragenter", rein);
      window.removeEventListener("dragover", ueber);
      window.removeEventListener("dragleave", raus);
      window.removeEventListener("drop", ab);
    };
  }, [ordner, anlegen, starteUpload]);

  const panelDatei = useMemo(() => items.find((x) => x.datei === panel) || (daten.suche || []).find((x) => x.datei === panel) || null, [items, panel, daten.suche]);

  useKuerzel("liste@ablage", {
    "ablage.hochladen": () => (ordner && anlegen ? dateiInput.current?.click() : false),
    "ablage.neuer-ordner": () => (anlegen ? setOrdnerDialog({ neu: true }) : false),
    "ablage.ansicht": () => router.push(href({ ansicht: ansicht === "liste" ? "" : "liste" })),
    "ablage.teilen": () => (panelDatei && werkzeug.rechte(panelDatei).teilen.an ? werkzeug.h.teilen(panelDatei) : false),
    "ablage.herunterladen": () => (panelDatei ? werkzeug.h.herunterladen(panelDatei) : false),
  });

  const verschiebeAuf = async (zielRoh, namen) => {
    const ziel = { ...zielRoh, titel: ordnerName(zielRoh) };
    let ok = 0;
    for (const datei of namen) {
      const r = await verschiebenAction({ datei, ordner: ziel.ordner });
      if (r.ok) ok += 1;
      else zeige(r.message, { art: "fehler" });
    }
    if (ok) {
      setItems((l) => l.filter((x) => !namen.includes(x.datei)));
      setAuswahl(new Set());
      zeige(T.toast.verschoben(ziel.titel), { art: "ok" });
      router.refresh();
    }
  };

  const papierkorbViele = async () => {
    const namen = [...auswahl];
    const r = await loeschenVieleAction({ dateien: namen });
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    const weg = r.daten.ok;
    setItems((l) => l.filter((x) => !weg.includes(x.datei)));
    setAuswahl(new Set());
    if (weg.length)
      zeige(T.toast.papierkorbViele(weg.length), {
        art: "ok",
        unter: r.daten.uebersprungen.length ? `${r.daten.uebersprungen.length} übersprungen – ${r.daten.uebersprungen[0].message}` : undefined,
        aktion: {
          titel: T.toast.rueckgaengig,
          onClick: async () => {
            await wiederherstellenVieleAction({ dateien: weg });
            router.refresh();
          },
        },
      });
    else if (r.daten.uebersprungen.length) zeige(r.daten.uebersprungen[0].message, { art: "warnung" });
    router.refresh();
  };

  const leitungHier = istLeitung(rollen, aktuell?.bezug_doctype || null);
  const zuletzt = !ordner;
  const ordnerItems = daten.unterordner || [];
  const sucheAktiv = Boolean(params.q);
  const auswahlRechte = [...auswahl].map((n) => items.find((x) => x.datei === n)).filter(Boolean);
  const loeschbar = auswahlRechte.filter((d) => werkzeug.rechte(d).papierkorb.an).length;

  return (
    <>
      <div className="bo-abl-drive" data-panel={panelDatei ? "offen" : undefined}>
        <div className="hidden min-w-0 lg:block">
          <Ordnerbaum wurzeln={daten.wurzeln} kette={kette.map((k) => k.ordner)} aktiv={ordner} href={ordnerHref} zaehler={zaehler} onAblegen={schreiben ? verschiebeAuf : undefined} />
        </div>

        <div className="bo-abl-spalte">
          {/* Pfad + Werkzeuge */}
          <div className="flex flex-col gap-3">
            <nav className="bo-abl-pfad min-w-0 flex-1" aria-label="Pfad">
                <Link href="/ablage">{T.bereich}</Link>
                {kette.map((k, i) => (
                  <span key={k.ordner} className="contents">
                    <ChevronRight className="bo-abl-pfad__trenner size-3.5" aria-hidden="true" />
                    {i === kette.length - 1 ? (
                      <span aria-current="page" title={k.titel}>
                        {ordnerName(k)}
                      </span>
                    ) : (
                      <Link href={ordnerHref(k.ordner)} title={k.titel}>
                        {ordnerName(k)}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            <div className="bo-abl-werkzeuge">
              <form
                className="bo-suche bo-abl-suche"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  router.push(href({ q: suche.trim(), datei: "" }));
                }}
              >
                <Search className="size-4 shrink-0 text-bo-text-faint" aria-hidden="true" />
                <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder={ordner ? T.werkzeuge.suche : T.werkzeuge.sucheUeberall} aria-label={T.werkzeuge.sucheLabel} data-testid="abl-suche" />
              </form>
              {ordner && (
                <div className="bo-abl-chips" role="group" aria-label={T.werkzeuge.art}>
                  <Link className="bo-abl-chip" href={href({ endung: "" })} aria-current={!params.endung ? "true" : undefined}>
                    {T.werkzeuge.alle}
                  </Link>
                  {Object.entries(ART_FILTER).map(([k, f]) => {
                    const wert = f.endungen.join(",");
                    return (
                      <Link key={k} className="bo-abl-chip" href={href({ endung: wert })} aria-current={params.endung === wert ? "true" : undefined}>
                        {f.titel}
                      </Link>
                    );
                  })}
                </div>
              )}
              <div className="bo-abl-werkzeuge__rechts">
                <Segment
                  label={T.werkzeuge.ansicht}
                  aktiv={ansicht}
                  groesse="s"
                  optionen={[
                    { wert: "raster", titel: T.werkzeuge.raster, href: href({ ansicht: "" }), icon: "LayoutDashboard", testid: "abl-ansicht-raster" },
                    { wert: "liste", titel: T.werkzeuge.liste, href: href({ ansicht: "liste" }), icon: "Rows3", testid: "abl-ansicht-liste" },
                  ]}
                />
                <Menue
                  label={T.werkzeuge.sortieren}
                  platzierung="unten-ende"
                  ausloeser={(p) => (
                    <button type="button" className="bo-rund bo-ziel bo-tip" data-tip={T.werkzeuge.sortieren} aria-label={T.werkzeuge.sortieren} {...p} data-testid="abl-sortieren">
                      <ArrowDownUp className="size-[18px]" strokeWidth={1.75} />
                    </button>
                  )}
                >
                  {SORT_OPTIONEN.map(([wert, titel]) => (
                    <MenuePunkt key={wert} href={href({ sort: wert === "name" ? "" : wert })} gewaehlt={(params.sort || "name") === wert}>
                      {titel}
                    </MenuePunkt>
                  ))}
                </Menue>
                {aktuell && schreiben && !aktuell.geschuetzt && (
                  <Menue
                    label={T.inhalt.ordner}
                    platzierung="unten-ende"
                    ausloeser={(p) => (
                      <button type="button" className="bo-rund bo-ziel bo-tip" data-tip={T.aktionen.menue} aria-label={`${T.inhalt.ordner}: ${T.aktionen.menue}`} {...p} data-testid="abl-ordner-menue">
                        <FolderOpen className="size-[18px]" strokeWidth={1.75} />
                      </button>
                    )}
                  >
                    <MenuePunkt icon="Pencil" onWaehlen={() => setOrdnerDialog({ bearbeiten: aktuell })}>
                      {T.aktionen.ordnerUmbenennen}
                    </MenuePunkt>
                    <MenueTrenner />
                    <MenuePunkt icon="Trash2" gefaehrlich onWaehlen={() => setOrdnerLoeschen(true)} deaktiviert={items.length > 0 || ordnerItems.length > 0} grund={items.length > 0 || ordnerItems.length > 0 ? T.dialog.ordnerLoeschenText : undefined}>
                      {T.aktionen.ordnerLoeschen}
                    </MenuePunkt>
                  </Menue>
                )}
              </div>
            </div>
          </div>

          {/* Ordner */}
          {ordnerItems.length > 0 && !sucheAktiv && (
            <section className="bo-abl-abschnitt" aria-labelledby="abl-ordner-titel">
              <div className="bo-abl-abschnitt__kopf">
                <h2 id="abl-ordner-titel" className="bo-abl-abschnitt__titel">
                  {T.inhalt.ordner}
                </h2>
                <span className="bo-abl-abschnitt__unter">{ordnerItems.length}</span>
              </div>
              <div className="bo-abl-ordnerraster bo-staffel">
                {ordnerItems.map((o) => (
                  <OrdnerKachel key={o.ordner} o={o} href={ordnerHref(o.ordner)} onAblegen={schreiben ? verschiebeAuf : undefined} />
                ))}
              </div>
            </section>
          )}

          {/* Dateien */}
          {(ordner || items.length > 0) && (
            <section className="bo-abl-abschnitt" aria-labelledby="abl-dateien-titel">
              <div className="bo-abl-abschnitt__kopf">
                <h2 id="abl-dateien-titel" className="bo-abl-abschnitt__titel">
                  {zuletzt ? T.inhalt.zuletztGeaendert : sucheAktiv ? T.inhalt.treffer(items.length, params.q) : T.inhalt.dateien}
                </h2>
                <span className="bo-abl-abschnitt__unter" data-testid="abl-anzahl">
                  {daten.dateien.gesamt > items.length ? T.inhalt.vonGesamt(items.length, daten.dateien.gesamt) : T.inhalt.anzahl(items.length)}
                </span>
              </div>
              {items.length ? (
                <Dateien items={items} ansicht={ansicht} aktiv={panel} auswahl={auswahl} onWaehle={werkzeug ? (d) => waehle(d) : undefined} onAuswahl={auswaehlen} werkzeug={werkzeug} user={user} namen={namen} info={info} ziehbar={schreiben} mitOrdner={zuletzt} ordnerTitel={ordnerTitel} />
              ) : (
                <Leer
                  art={sucheAktiv || params.endung ? "gefiltert" : "leer"}
                  titel={sucheAktiv ? T.leer.suche(params.q).titel : T.leer.ordner(aktuell?.titel || "").titel}
                  text={sucheAktiv ? T.leer.suche(params.q).text : anlegen ? T.leer.ordner(aktuell?.titel || "").text : undefined}
                  zuruecksetzenHref={sucheAktiv || params.endung ? href({ q: "", endung: "" }) : undefined}
                  aktion={!sucheAktiv && !params.endung && anlegen ? <Knopf icon="Plus" onClick={() => dateiInput.current?.click()}>{T.kopf.hochladen}</Knopf> : undefined}
                  groesse="karte"
                  testid="abl-leer"
                />
              )}
            </section>
          )}

          {zuletzt && !items.length && !ordnerItems.length && <Leer titel={T.leer.wurzel.titel} text={T.leer.wurzel.text} testid="abl-leer" />}

          {/* Treffer in anderen Ordnern */}
          {sucheAktiv && daten.suche?.length > 0 && (
            <section className="bo-abl-abschnitt" aria-labelledby="abl-weitere-treffer">
              <div className="bo-abl-abschnitt__kopf">
                <h2 id="abl-weitere-treffer" className="bo-abl-abschnitt__titel">
                  In anderen Ordnern
                </h2>
                <span className="bo-abl-abschnitt__unter">{daten.suche.length}</span>
              </div>
              <Dateien items={daten.suche} ansicht="liste" aktiv={panel} onWaehle={(d) => waehle(d)} werkzeug={werkzeug} user={user} namen={namen} info={info} mitOrdner ordnerTitel={Object.fromEntries(daten.suche.map((d) => [d.ordner, d.ordner_pfad || ""]))} testid="abl-treffer" />
            </section>
          )}

          {auswahl.size > 0 && (
            <div className="bo-abl-masse bo-material-stark bo-rise" role="toolbar" aria-label={T.aktionen.auswahl(auswahl.size)} data-testid="abl-masse">
              <span className="bo-abl-masse__text">{T.aktionen.auswahl(auswahl.size)}</span>
              <Knopf size="s" variant="secondary" disabled={!zipStatus?.an} grund={zipStatus?.an ? undefined : zipStatus?.grundText}>
                {T.aktionen.zip}
              </Knopf>
              <Knopf size="s" variant="danger" icon="Trash2" onClick={papierkorbViele} disabled={!loeschbar} data-testid="abl-masse-papierkorb">
                {T.aktionen.papierkorb}
                {loeschbar < auswahl.size ? ` (${loeschbar} von ${auswahl.size})` : ""}
              </Knopf>
              <Knopf size="s" variant="ghost" onClick={() => setAuswahl(new Set())}>
                {T.aktionen.auswahlAufheben}
              </Knopf>
            </div>
          )}
        </div>

        {panelDatei && <DateiPanel datei={panelDatei} info={info} user={user} namen={namen} werkzeug={werkzeug} onSchliessen={schliessePanel} pfad={panelDatei.ordner === ordner ? kette.map((k) => ordnerName(k)).join(" / ") : ordnerTitel[panelDatei.ordner] || panelDatei.ordner_pfad || null} />}
      </div>

      <input
        ref={dateiInput}
        type="file"
        multiple
        hidden
        data-testid="abl-datei-input"
        onChange={(e) => {
          const f = e.target.files;
          if (f?.length) starteUpload([...f]);
          e.target.value = "";
        }}
      />

      {zone && (
        <div className="bo-abl-zone" aria-hidden="true">
          <div className="bo-abl-zone__karte bo-material-stark">
            <span className="bo-abl-zone__ico">
              <CloudUpload className="size-7" strokeWidth={1.75} />
            </span>
            <p className="bo-abl-zone__titel">{T.upload.zone(aktuell?.titel || "")}</p>
            <p className="bo-abl-zone__unter">{T.upload.zoneHinweis}</p>
          </div>
        </div>
      )}

      <UploadSchlange eintraege={upload.eintraege} onAbbrechen={upload.abbrechen} onErneut={upload.erneut} onLeeren={upload.leeren} />
      {werkzeug.dialoge}
      {ordnerDialog && (
        <OrdnerDialog
          offen
          eltern={aktuell}
          leitung={leitungHier}
          start={ordnerDialog.bearbeiten || null}
          onSchliessen={() => setOrdnerDialog(null)}
          onFertig={(o, titel) => {
            setOrdnerDialog(null);
            zeige(ordnerDialog.bearbeiten ? T.toast.ordnerUmbenannt(titel) : T.toast.ordnerAngelegt(titel), { art: "ok" });
            if (!ordnerDialog.bearbeiten && o?.ordner) router.push(ordnerHref(o.ordner));
            else router.refresh();
          }}
        />
      )}
      <Bestaetigen
        offen={ordnerLoeschen}
        titel={T.dialog.ordnerLoeschenFrage(aktuell?.titel || "")}
        text={T.dialog.ordnerLoeschenText}
        bestaetigen="Löschen"
        gefaehrlich
        onAbbrechen={() => setOrdnerLoeschen(false)}
        onBestaetigen={async () => {
          const r = await ordnerLoeschenAction({ ordner });
          setOrdnerLoeschen(false);
          if (!r.ok) return zeige(r.message, { art: "fehler" });
          zeige(T.toast.ordnerGeloescht(aktuell?.titel || ""), { art: "ok" });
          const eltern = kette.length > 1 ? kette[kette.length - 2].ordner : null;
          router.push(eltern ? ordnerHref(eltern) : "/ablage");
        }}
      />
    </>
  );
}

/** Kopf-Knöpfe der Drive-Seite (im Server-Seitenkopf): melden sich per Ereignis beim Drive. */
export function DriveKnoepfe({ ordner, anlegen, hochladenGrund }) {
  if (!anlegen) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Knopf variant="secondary" icon="Plus" onClick={() => window.dispatchEvent(new Event(EREIGNIS_ORDNER))} kuerzel="Umschalt+O" data-testid="abl-neuer-ordner">
        {T.kopf.neuerOrdner}
      </Knopf>
      <Knopf variant="primary" onClick={() => window.dispatchEvent(new Event(EREIGNIS_HOCHLADEN))} disabled={!ordner} grund={!ordner ? hochladenGrund : undefined} kuerzel="Umschalt+U" data-testid="abl-hochladen">
        <CloudUpload className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {T.kopf.hochladen}
      </Knopf>
    </div>
  );
}
