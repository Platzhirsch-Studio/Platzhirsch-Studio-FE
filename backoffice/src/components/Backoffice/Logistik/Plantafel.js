"use client";
// Plantafel (10-konzept-logistik § 4.6, E5): Raster Tag × Fahrzeug (role="grid", Pfeiltasten), Ablage links
// (Ohne Tour · Zurück im Fahrzeug · Montagen · Speditionen). Zuordnen ohne Ziehen: Ablage-Karte antippen →
// Sheet mit Tour-Kacheln und Auslastung danach („+120 kg → 532 / 1 100 kg“, rot bei Überschreitung).
// Neue Tour in einer Zelle über „+ Tour“. Jede Zuordnung sofort mit Rückgängig (stopp_entfernen).

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Truck } from "lucide-react";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import Sheet from "../Overlay/Sheet";
import { AvatarReihe } from "../Avatar";
import { useToast } from "../Toast";
import { vorschauDanach } from "@/lib/backoffice/logistik/auslastung";
import { tagKopf } from "@/lib/backoffice/logistik/plantafel";
import { DIALOG, TOUR as T, LEER } from "@/lib/backoffice/logistik/texte";
import { Balken, Chip, Lieferart, StatusPille, datumKurz, kgText } from "./ui";
import "./logistik.css";

const S16 = { size: 16, strokeWidth: 1.75, "aria-hidden": true };

export default function Plantafel({ tafel, heute, vorwahl, zurTour, ausTour, tourAnlegen, fahrer = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [wahl, setWahl] = useState(() => tafel.ablage.ohneTour.find((l) => l.name === vorwahl) || null);
  const [neu, setNeu] = useState(null);
  const [laeuft, start] = useTransition();
  const raster = useRef(null);
  const live = useRef(null);
  const lsMap = new Map((tafel.lieferscheine || []).map((l) => [l.name, l]));
  const fzMap = new Map((tafel.fahrzeuge || []).map((f) => [f.name, f]));
  const tourLs = (k) => (tafel.touren.find((t) => t.name === k.name)?.stopps || []).map((s) => lsMap.get(s.lieferschein)).filter(Boolean);

  const zuordnen = (tour) =>
    start(async () => {
      const ls = wahl;
      const r = await zurTour({ tour, lieferscheine: [ls.name] });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      const text = `Zu ${tour}`;
      setWahl(null);
      if (live.current) live.current.textContent = T.zugeordnet(ls.name, tour, "");
      zeige(text, { art: "ok", aktion: { titel: DIALOG.rueckgaengig, onClick: async () => { await ausTour({ tour, stopp: ls.name }); router.refresh(); } } });
      router.refresh();
    });

  const pfeil = (e) => {
    const zellen = [...(raster.current?.querySelectorAll("[data-zelle]") || [])];
    const i = zellen.indexOf(document.activeElement);
    if (i < 0) return;
    const breite = tafel.tage.length;
    const ziel = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + breite, ArrowUp: i - breite }[e.key];
    if (ziel === undefined) return;
    e.preventDefault();
    zellen[Math.max(0, Math.min(zellen.length - 1, ziel))]?.focus();
  };

  return (
    <div className="bo-log-tafel" data-testid="plantafel">
      <p ref={live} className="sr-only" role="status" aria-live="polite" />
      <aside className="bo-log-ablage" aria-label="Ablage">
        <AblageGruppe titel={T.ablage.ohneTour} anzahl={tafel.ablage.ohneTour.length}>
          {tafel.ablage.ohneTour.length ? tafel.ablage.ohneTour.map((l) => (
            <button key={l.name} type="button" className="bo-log-ablage__karte" aria-pressed={wahl?.name === l.name} onClick={() => setWahl(wahl?.name === l.name ? null : l)} data-testid="ablage-karte">
              <b>{l.kunde_name}</b>
              <span className="bo-log-cap">{[l.liefer_plz, l.liefer_ort].filter(Boolean).join(" ")} · {l.status === "Entwurf" ? T.wirdGepackt : "Gepackt"}</span>
              <span className="flex flex-wrap items-center gap-1.5"><Chip>{l.wunschtermin ? `Wunsch ${datumKurz(l.wunschtermin)}` : "ohne Wunsch"}</Chip><Chip>{kgText(l.gesamtgewicht_g)}</Chip>{l.kommission ? <Chip ton="see">Kommission</Chip> : null}</span>
            </button>
          )) : <p className="bo-log-cap px-1">{LEER.ablage}</p>}
        </AblageGruppe>
        {tafel.ablage.zurueck.length ? (
          <AblageGruppe titel={T.ablage.zurueck} anzahl={tafel.ablage.zurueck.length}>
            {tafel.ablage.zurueck.map((l) => (
              <Link key={l.name} href={`/logistik/lieferscheine/${encodeURIComponent(l.name)}`} className="bo-log-ablage__karte">
                <b>{l.kunde_name}</b>
                <span className="bo-log-cap">{l.tourName} · {l.stoppStatus === "nicht angetroffen" ? "nicht angetroffen" : l.stoppStatus}</span>
              </Link>
            ))}
          </AblageGruppe>
        ) : null}
        <AblageGruppe titel={T.ablage.montagen} anzahl={tafel.montagenFehler ? null : tafel.ablage.montagen.length}>
          {tafel.montagenFehler ? <p className="bo-log-cap px-1">Montagen nicht geladen (Projekte nicht erreichbar)</p> : tafel.ablage.montagen.slice(0, 5).map((m) => (
            <div key={m.name} className="bo-log-ablage__karte" style={{ cursor: "default" }}><b>{m.titel || m.name}</b><span className="bo-log-cap">{m.kunde_name || m.ort || m.name}</span></div>
          ))}
        </AblageGruppe>
        {tafel.ablage.speditionen.length ? (
          <AblageGruppe titel={T.ablage.speditionen} anzahl={tafel.ablage.speditionen.length}>
            {tafel.ablage.speditionen.map((s) => (
              <Link key={s.name} href={`/logistik/speditionen/${encodeURIComponent(s.name)}`} className="bo-log-ablage__karte"><b>{s.kunde_name || s.spediteur}</b><span className="bo-log-cap">{datumKurz(s.zustell_datum)} · {s.ziel_ort}</span></Link>
            ))}
          </AblageGruppe>
        ) : null}
      </aside>

      <div className="bo-log-raster bo-kachel" style={{ padding: 12 }}>
        {!tafel.zeilen.length ? <p className="bo-log-cap p-4">{LEER.fahrzeuge}</p> : null}
        <table ref={raster} role="grid" aria-label="Plantafel" onKeyDown={pfeil}>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Fahrzeug</span></th>
              {tafel.tage.map((t) => <th key={t} scope="col" data-heute={t === heute ? "true" : undefined}><span>{tagKopf(t)}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {tafel.zeilen.map((z) => (
              <tr key={z.fahrzeug || "ohne"}>
                <th scope="row" className="zeilenkopf"><b>{z.titel}</b><span className="bo-log-mono">{z.kennzeichen}</span></th>
                {z.zellen.map((c) => (
                  <td key={c.tag} role="gridcell" tabIndex={-1} data-zelle="" className="bo-log-zelle">
                    <div className="bo-log-zelle__inhalt">
                      {c.touren.map((k) => (
                        <Link key={k.name} href={`/logistik/touren/${encodeURIComponent(k.name)}`} className="bo-log-tourkarte" data-ziel={wahl ? "true" : undefined} data-testid="tourkarte"
                          onClick={(e) => { if (wahl && ["Geplant", "Freigegeben"].includes(k.status)) { e.preventDefault(); zuordnen(k.name); } }}>
                          <span className="bo-log-tourkarte__kopf">
                            <span className="bo-log-mono">{k.name.replace(/^PH-TOUR-\d{4}-/, "Tour ")}</span>
                            <StatusPille doctype="PH Tour" status={k.status} />
                          </span>
                          <span className="flex items-center justify-between gap-2">
                            {k.fahrer || k.team.length ? <AvatarReihe personen={[k.fahrer, ...k.team].filter(Boolean)} groesse={22} max={3} /> : <span className="bo-log-cap">kein Fahrer</span>}
                            {k.warnungen.length ? <span className="bo-log-tourkarte__warn" title={k.warnungen.join(" · ")}><AlertTriangle {...S16} />{k.warnungen.length}</span> : null}
                          </span>
                          <span className="bo-log-cap">{T.stopps(k.stopps)} · {wahl ? vorschauDanach(tourLs(k), fzMap.get(k.fahrzeug), wahl).text : k.auslastung.text}</span>
                          <Balken anteil={wahl ? vorschauDanach(tourLs(k), fzMap.get(k.fahrzeug), wahl).anteil : k.auslastung.anteil} ueber={wahl ? vorschauDanach(tourLs(k), fzMap.get(k.fahrzeug), wahl).ueber : k.auslastung.ueber} label={k.auslastung.text} />
                          {k.auslastung.ueber ? <span className="text-[12px] font-semibold text-bo-ziegel-text">{k.auslastung.warnText}</span> : null}
                          {k.warnungen.length ? <span className="text-[12px] text-bo-eiche-text">{k.warnungen.join(" · ")}</span> : null}
                        </Link>
                      ))}
                      <button type="button" className="bo-log-plus-tour" onClick={() => setNeu({ datum: c.tag, fahrzeug: z.fahrzeug })} aria-label={`Neue Tour ${tagKopf(c.tag)} ${z.titel}`} data-testid="plus-tour"><Plus {...S16} />Tour</button>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Sheet offen={!!wahl} onSchliessen={() => setWahl(null)} titel={wahl ? T.zuordnenTitel(wahl.kunde_name) : ""} unter={wahl ? <><Lieferart wert={wahl.lieferart} /> · {kgText(wahl.gesamtgewicht_g)}</> : null} groesse="md" testid="zuordnen-sheet" peek>
        {wahl ? (
          <div className="flex flex-col gap-2">
            {tafel.karten.filter((k) => ["Geplant", "Freigegeben"].includes(k.status)).map((k) => {
              const v = vorschauDanach(tourLs(k), fzMap.get(k.fahrzeug), wahl);
              return (
                <button key={k.name} type="button" className="bo-log-ablage__karte" onClick={() => zuordnen(k.name)} disabled={laeuft} data-testid="zuordnen-tour">
                  <b className="flex items-center gap-2"><Truck {...S16} />{tagKopf(k.datum)} · {k.fahrzeug || "ohne Fahrzeug"}</b>
                  <span className={v.ueber ? "text-[13px] font-semibold text-bo-ziegel-text" : "bo-log-cap"}>{v.text}{v.ueber ? ` · ${v.warnText}` : ""}</span>
                  <Balken anteil={v.anteil} ueber={v.ueber} label={v.text} />
                </button>
              );
            })}
            <Knopf icon="Plus" onClick={() => setNeu({ datum: wahl.wunschtermin || heute, fahrzeug: tafel.zeilen[0]?.fahrzeug || "", lieferschein: wahl.name })}>{T.neueTourHier}</Knopf>
          </div>
        ) : null}
      </Sheet>
      <NeueTour offen={!!neu} vorgabe={neu} onSchliessen={() => setNeu(null)} anlegen={tourAnlegen} fahrzeuge={tafel.fahrzeuge || []} fahrer={fahrer} />
    </div>
  );
}

function AblageGruppe({ titel, anzahl, children }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="bo-log-gruppe-titel">{titel}{anzahl !== null && anzahl !== undefined ? ` · ${anzahl}` : ""}</h2>
      {children}
    </section>
  );
}

export function NeueTour({ offen, vorgabe, onSchliessen, anlegen, fahrzeuge = [], fahrer = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [werte, setWerte] = useState({});
  const [laeuft, start] = useTransition();
  const v = { datum: vorgabe?.datum || "", fahrzeug: vorgabe?.fahrzeug || "", fahrer: "", startZeit: "07:30", ...werte };
  return (
    <Dialog offen={offen} onSchliessen={() => { setWerte({}); onSchliessen(); }} titel="Neue Tour" text={vorgabe?.lieferschein ? `Lieferschein ${vorgabe.lieferschein} wird zugeordnet.` : undefined} groesse="md" testid="neue-tour"
      fuss={<>
        <Knopf variant="ghost" onClick={onSchliessen}>{DIALOG.abbrechen}</Knopf>
        <Knopf variant="primary" laedt={laeuft} disabled={!v.datum} onClick={() => start(async () => { const r = await anlegen({ ...v, lieferschein: vorgabe?.lieferschein || "" }); if (!r.ok) return zeige(r.message, { art: "fehler" }); zeige(`${r.name} angelegt`, { art: "ok" }); setWerte({}); onSchliessen(); router.refresh(); })} data-testid="neue-tour-ok">{DIALOG.anlegen}</Knopf>
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="bo-log-cap">{DIALOG.datum}</span><input className="h-12 rounded-[14px] bg-bo-surface-2 px-4 outline-none focus-visible:shadow-(--bo-sh-focus)" value={v.datum} onChange={(e) => setWerte((w) => ({ ...w, datum: e.target.value }))} placeholder="JJJJ-MM-TT" /></label>
        <label className="flex flex-col gap-1"><span className="bo-log-cap">{DIALOG.abfahrt}</span><input className="h-12 rounded-[14px] bg-bo-surface-2 px-4 outline-none focus-visible:shadow-(--bo-sh-focus)" value={v.startZeit} onChange={(e) => setWerte((w) => ({ ...w, startZeit: e.target.value }))} /></label>
        <label className="flex flex-col gap-1"><span className="bo-log-cap">{DIALOG.fahrzeug}</span>
          <select className="h-12 rounded-[14px] bg-bo-surface-2 px-3 outline-none focus-visible:shadow-(--bo-sh-focus)" value={v.fahrzeug} onChange={(e) => setWerte((w) => ({ ...w, fahrzeug: e.target.value }))}>
            <option value="">–</option>
            {fahrzeuge.map((f) => <option key={f.name} value={f.name}>{f.bezeichnung} · {f.name}{f.naechster_service && f.naechster_service <= v.datum ? " · Service fällig" : ""}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1"><span className="bo-log-cap">{DIALOG.fahrer}</span>
          <select className="h-12 rounded-[14px] bg-bo-surface-2 px-3 outline-none focus-visible:shadow-(--bo-sh-focus)" value={v.fahrer} onChange={(e) => setWerte((w) => ({ ...w, fahrer: e.target.value }))}>
            <option value="">Standard-Fahrer des Fahrzeugs</option>
            {fahrer.map((f) => <option key={f.name} value={f.name}>{f.titel}</option>)}
          </select>
        </label>
      </div>
    </Dialog>
  );
}
