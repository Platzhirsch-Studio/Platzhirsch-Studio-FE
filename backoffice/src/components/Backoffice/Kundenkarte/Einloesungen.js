"use client";
// Einlösungen (Konzept §3.6): Liste mit Reitern (Eingelöst · Zugesagt [Fähigkeit] · Storniert), Anzahl statt Euro,
// Sheet je Einlösung (Datum/Vorteil/Beleg nur lesend – Limitschutz, Kommentar editierbar, Storno nach Regel),
// „Einlösen …“ als Dialog mit Kartensuche (Scan) und derselben Belegliste wie an der Kachel.

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Leer from "../Leer";
import Avatar from "../Avatar";
import StatusBadge from "../StatusBadge";
import LeitungBitten from "../LeitungBitten";
import { Dialog, Sheet } from "../Overlay";
import { useToast } from "../Toast";
import KartenSuche from "./KartenSuche";
import { BelegWahl, useEinloesen } from "./Einloesen";
import { StornoDialog } from "./Dialoge";
import { VorteilIcon } from "./VorteilIcon";
import { einloesungKommentarAction, kartePeekAction } from "@/lib/backoffice/kundenkarte/actions";
import { EINLOESUNG_STATUS, statusLabel, statusTon } from "@/lib/backoffice/kundenkarte/labels";
import { stornoErlaubt } from "@/lib/backoffice/kundenkarte/regeln";
import { datumZeit, relativ } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";
import "../DataTable/datatable.css";
import "./kundenkarte.css";

const kurz = (w) => {
  const s = String(w || "").split("@")[0];
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "–";
};

export function EinloesungDetails({ e, user, leitung, darfSchreiben, darfBitten, berater = [], onStorno }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [kommentar, setKommentar] = useState(e.kommentar || "");
  const [laeuft, starte] = useTransition();
  const erlaubt = stornoErlaubt(e, { user, leitung });
  const name = (w) => berater.find((b) => b.wert === w)?.titel || kurz(w);
  return (
    <div className="flex flex-col gap-5" data-testid="kk-einloesung-details">
      <div className="flex items-center gap-3">
        <span className="bo-kk-vorteil__icon">
          <VorteilIcon art={e.art} />
        </span>
        <div className="min-w-0">
          <p className={`text-[17px] font-semibold ${e.status === "Storniert" ? "bo-kk-durch" : ""}`}>{e.vorteil_titel}</p>
          <StatusBadge wert={e.status} text={statusLabel(EINLOESUNG_STATUS, e.status)} ton={statusTon(EINLOESUNG_STATUS, e.status)} groesse="xs" storniert={e.status === "Storniert"} />
        </div>
      </div>
      <dl className="bo-kk-fakten">
        <div>
          <dt>Datum</dt>
          <dd>{datumZeit(e.eingeloest_am)}</dd>
        </div>
        <div>
          <dt>Karte</dt>
          <dd>
            <Link href={`/kundenkarte/karten/${e.kundenkarte}`} className="bo-kk-mono underline decoration-bo-line-strong underline-offset-4">
              {e.kundenkarte}
            </Link>
            <span className="block text-[13px] text-bo-text-soft">{e.kunde_name}</span>
          </dd>
        </div>
        <div>
          <dt>Ort</dt>
          <dd>{e.ort || "–"}</dd>
        </div>
        <div>
          <dt>Beleg</dt>
          <dd>{e.bezug ? <span className="bo-kk-mono">{e.bezug}</span> : "ohne Beleg"}</dd>
        </div>
        <div>
          <dt>Durch</dt>
          <dd>{name(e.eingeloest_durch)}</dd>
        </div>
        {e.status === "Storniert" && (
          <div>
            <dt>Storniert</dt>
            <dd>
              {datumZeit(e.storniert_am)} · {e.storno_grund}
            </dd>
          </div>
        )}
      </dl>
      <p className="bo-kk-hilfe">{T.einloesungen.sheetNurLesen}</p>
      {darfSchreiben && (
        <div>
          <label htmlFor="kk-einl-kommentar" className="bo-kk-label">
            {T.einloesen.kommentar}
          </label>
          <textarea id="kk-einl-kommentar" className="bo-kk-feld" rows={2} maxLength={500} value={kommentar} onChange={(ev) => setKommentar(ev.target.value)} />
          <div className="mt-2 flex justify-end">
            <Knopf
              size="s"
              laedt={laeuft}
              disabled={kommentar === (e.kommentar || "")}
              onClick={() =>
                starte(async () => {
                  const r = await einloesungKommentarAction({ einloesung: e.name, kommentar });
                  zeige(r?.ok ? "Kommentar gespeichert" : r?.message || T.fehler.allgemein, { art: r?.ok ? "ok" : "fehler" });
                  if (r?.ok) router.refresh();
                })
              }
            >
              Speichern
            </Knopf>
          </div>
        </div>
      )}
      {e.status === "Eingeloest" && darfSchreiben && (
        <div className="rounded-2xl bg-bo-surface-2 px-4 py-3">
          {erlaubt.ok ? (
            <Knopf variant="danger" icon="Undo2" onClick={() => onStorno?.(e)} data-testid="kk-stornieren">
              {T.einloesungen.stornieren}
            </Knopf>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <p className="bo-kk-satz">{erlaubt.grund}</p>
              <LeitungBitten erlaubt={darfBitten} bereich="kundenkarte" bereichTitel="Kundenkarte" aktion="storno" aktionTitel="Einlösung stornieren" objekt={{ doctype: "PH Kundenkarte Einloesung", name: e.name, titel: e.vorteil_titel }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EinloeseNeuDialog({ onSchliessen }) {
  const [karte, setKarte] = useState(null);
  const [vorteil, setVorteil] = useState(null);
  const [fehler, setFehler] = useState("");
  const einloesen = useEinloesen({ karte: karte?.name || "", kunde: karte?.kunde_name || "" });
  const waehle = async (nr) => {
    setFehler("");
    const r = await kartePeekAction({ karte: nr });
    if (!r?.ok) return setFehler(r?.message || T.karten.peekFehler);
    setKarte({ ...r.karte, vorteile: r.vorteile });
    setVorteil(null);
  };
  const verfuegbar = karte?.vorteile?.filter((v) => v.verfuegbar) || [];
  return (
    <Dialog offen onSchliessen={onSchliessen} titel={T.einloesen.dialogTitel} groesse="md" testid="kk-einloese-neu">
      <div className="flex flex-col gap-4">
        <div>
          <p className="bo-kk-label">{T.einloesen.karte}</p>
          <KartenSuche mitListe={false} onKarte={waehle} autoFocus testid="kk-einl-karte" />
        </div>
        {fehler && <p className="bo-kk-fehler">{fehler}</p>}
        {karte && (
          <>
            <p className="text-[15px] font-semibold">
              {karte.kunde_name} · <span className="bo-kk-mono">{karte.name}</span>
            </p>
            {karte.status !== "Aktiv" ? (
              <p className="bo-kk-warn">Die Karte ist nicht aktiv.</p>
            ) : (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={T.einloesen.vorteil}>
                {verfuegbar.map((v) => (
                  <button key={v.vorteil} type="button" role="radio" aria-checked={vorteil?.vorteil === v.vorteil} className="bo-kk-chip" onClick={() => setVorteil(v)}>
                    <VorteilIcon art={v.art} className="size-4" />
                    {v.titel}
                  </button>
                ))}
              </div>
            )}
            {vorteil && (
              <BelegWahl
                key={vorteil.vorteil}
                karte={karte.name}
                vorteil={vorteil.vorteil}
                art={vorteil.art}
                autoFokus={false}
                onWahl={async (w) => {
                  onSchliessen();
                  await einloesen({ vorteil: vorteil.vorteil, titel: vorteil.titel, ...w });
                }}
              />
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}

export default function EinloesungenListe({ zeilen = [], gesamt = 0, gesamtAlle = 0, reiter, user, leitung = false, darfSchreiben = false, darfBitten = false, berater = [], arten = {}, startNeu = false, jetzt }) {
  const [offen, setOffenRoh] = useState(null);
  const setOffen = (e) => setOffenRoh(e ? { ...e, art: arten[e.vorteil] || "Sonstiges" } : null);
  const [storno, setStorno] = useState(null);
  const [neu, setNeu] = useState(startNeu && darfSchreiben);
  const { zeige } = useToast();
  const jetztD = jetzt ? new Date(jetzt) : new Date();
  const name = (w) => berater.find((b) => b.wert === w)?.titel || kurz(w);
  return (
    <div className="min-w-0">
      {darfSchreiben && (
        <div className="mb-4 flex justify-end">
          <Knopf icon="Sparkles" onClick={() => setNeu(true)} data-testid="kk-einloesen-neu">
            {T.einloesungen.neu}
          </Knopf>
        </div>
      )}
      {!zeilen.length ? (
        gesamtAlle === 0 ? (
          <Leer art="leer" titel={T.einloesungen.leer} text="" icon="CheckCheck" testid="kk-einl-leer" />
        ) : (
          <Leer art="gefiltert" titel={T.einloesungen.gefiltert} zuruecksetzenHref={`/kundenkarte/einloesungen${reiter !== "eingeloest" ? `?reiter=${reiter}` : ""}`} testid="kk-einl-leer" />
        )
      ) : (
        <div className="bo-dt" data-testid="kk-einloesungen-liste">
          <div className="hidden md:block">
            <table className="bo-dt__tabelle">
              <caption className="bo-kk-sr">Einlösungen</caption>
              <thead>
                <tr>
                  <th scope="col">{T.einloesungen.spalten.datum}</th>
                  <th scope="col">{T.einloesungen.spalten.kunde}</th>
                  <th scope="col">{T.einloesungen.spalten.vorteil}</th>
                  <th scope="col">{T.einloesungen.spalten.ort}</th>
                  <th scope="col">{T.einloesungen.spalten.beleg}</th>
                  <th scope="col">{T.einloesungen.spalten.durch}</th>
                </tr>
              </thead>
              <tbody>
                {zeilen.map((e) => (
                  <tr key={e.name} className="cursor-pointer" onClick={() => setOffen(e)} data-testid={`kk-einl-${e.name}`}>
                    <td className="whitespace-nowrap tabular-nums text-[14px]">
                      <button type="button" className="text-left" onClick={(ev) => (ev.stopPropagation(), setOffen(e))} aria-label={`${e.vorteil_titel} vom ${datumZeit(e.eingeloest_am)} öffnen`}>
                        <time title={datumZeit(e.eingeloest_am)} suppressHydrationWarning>
                          {relativ(e.eingeloest_am, jetztD)}
                        </time>
                      </button>
                    </td>
                    <td>
                      <Link href={`/kundenkarte/karten/${e.kundenkarte}`} onClick={(ev) => ev.stopPropagation()} className="text-[15px] font-semibold hover:underline">
                        {e.kunde_name || e.kundenkarte}
                      </Link>
                    </td>
                    <td>
                      <span className={`text-[14px] ${e.status === "Storniert" ? "bo-kk-durch" : ""}`}>{e.vorteil_titel}</span>
                      {e.status === "Storniert" && <span className="bo-kk-unter">{e.storno_grund}</span>}
                    </td>
                    <td className="text-[14px]">{e.ort}</td>
                    <td className="bo-kk-mono text-[13px]">{e.bezug || "–"}</td>
                    <td>
                      <span className="inline-flex items-center gap-2 text-[14px]">
                        <Avatar name={name(e.eingeloest_durch)} groesse={24} />
                        {name(e.eingeloest_durch)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="bo-dt-karten md:hidden">
            {zeilen.map((e) => (
              <li key={e.name} className="bo-dt-karte">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOffen(e)}>
                  <span className={`block text-[15px] font-semibold ${e.status === "Storniert" ? "bo-kk-durch" : ""}`}>{e.vorteil_titel}</span>
                  <span className="bo-kk-unter">
                    {e.kunde_name} · {relativ(e.eingeloest_am, jetztD)} · {e.ort}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="bo-dt__fuss">{T.einloesungen.fuss(gesamt)}</p>
        </div>
      )}
      <Sheet offen={Boolean(offen)} onSchliessen={() => setOffen(null)} titel={offen?.vorteil_titel || ""} unter={offen?.name} groesse="md" vollseite={offen ? `/kundenkarte/einloesungen/${offen.name}` : undefined} testid="kk-einloesung-sheet">
        {offen && <EinloesungDetails e={offen} user={user} leitung={leitung} darfSchreiben={darfSchreiben} darfBitten={darfBitten} berater={berater} onStorno={(x) => setStorno(x)} />}
      </Sheet>
      {storno && <StornoDialog einloesung={storno.name} titel={`${storno.vorteil_titel} · ${datumZeit(storno.eingeloest_am)}`} onSchliessen={() => setStorno(null)} onFertig={() => (setStorno(null), setOffen(null), zeige(T.einloesungen.storniert, { art: "ok" }))} />}
      {neu && <EinloeseNeuDialog onSchliessen={() => setNeu(false)} />}
    </div>
  );
}
