"use client";
// Kartenliste (Konzept §3.4): Tabelle in schwebender Kachel (Lounge §6), 6 Spalten, Berater inline (sofort +
// Rückgängig 8 s), Leertaste = Vorschau (Peek), Auswahl mit Massenaktionen unten als Material-Kapsel.
// Mitarbeitende sehen keine Beträge (die Daten kommen bereits gefiltert vom Server).

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import StatusBadge from "../StatusBadge";
import Leer from "../Leer";
import { Bestaetigen, Menue, MenuePunkt, MenueTrenner, Peek, useListenPeek } from "../Overlay";
import { useToast } from "../Toast";
import { useVerzoegerterCommit } from "@/lib/backoffice/commit/useVerzoegerterCommit";
import StufenKennzeichen from "./StufenKennzeichen";
import KartenPeek from "./KartenPeek";
import SperrenDialog from "./SperrenDialog";
import { KARTE_STATUS, statusLabel, statusTon, sperrgrundLabel } from "@/lib/backoffice/kundenkarte/labels";
import { aufgabenAnBeraterAction, beraterSetzenAction, beraterZuruecksetzenAction, kartenExportAction, neuEinstufenAction, uebergabePlanenAction, zusammenfuehrenAction } from "@/lib/backoffice/kundenkarte/actions";
import { cent } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";
import "../DataTable/datatable.css";
import "./kundenkarte.css";

function seitenHref(basis, params, seite) {
  const sp = new URLSearchParams(params);
  if (seite > 1) sp.set("seite", String(seite));
  else sp.delete("seite");
  const s = sp.toString();
  return s ? `${basis}?${s}` : basis;
}

export default function KartenListe({ zeilen: start = [], gesamt = 0, gesamtAlle = 0, seite = 1, groesse = 25, params = {}, reiter = "alle", stufen = [], berater = [], darfSchreiben = false, leitung = false, betraege = false, dubletten = [] }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { starte } = useVerzoegerterCommit();
  const [zeilen, setZeilen] = useState(start);
  const [schluessel, setSchluessel] = useState(start);
  if (start !== schluessel) {
    setSchluessel(start);
    setZeilen(start);
  }
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [sperren, setSperren] = useState(null);
  const [aufgabe, setAufgabe] = useState(null);
  const [zusammen, setZusammen] = useState(null);
  const [laeuft, starteTr] = useTransition();
  const peek = useListenPeek({ anzahl: zeilen.length, panel: "karte" });
  const farbe = useMemo(() => Object.fromEntries(stufen.map((s) => [s.name, s.farbe])), [stufen]);
  const beraterName = (w) => berater.find((b) => b.wert === w)?.titel || (w ? String(w).split("@")[0] : "");
  const alleGewaehlt = zeilen.length > 0 && zeilen.every((z) => gewaehlt.has(z.name));
  const auswahl = zeilen.filter((z) => gewaehlt.has(z.name));

  const umschalten = (name) =>
    setGewaehlt((g) => {
      const n = new Set(g);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });

  const beraterSetzen = (namen, wert) => {
    const alt = zeilen.filter((z) => namen.includes(z.name)).map((z) => ({ karte: z.name, wert: z.persoenlicher_berater || "" }));
    setZeilen((zs) => zs.map((z) => (namen.includes(z.name) ? { ...z, persoenlicher_berater: wert, _frisch: Date.now() } : z)));
    starteTr(async () => {
      const r = await beraterSetzenAction({ karten: namen, berater: wert });
      if (!r?.ok) {
        setZeilen((zs) => zs.map((z) => ({ ...z, persoenlicher_berater: alt.find((a) => a.karte === z.name)?.wert ?? z.persoenlicher_berater })));
        zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
        return;
      }
      const satz = T.karten.beraterGesetzt(namen.length, beraterName(wert)) + (r.hatten ? ` (${r.hatten} hatten bereits einen)` : "");
      zeige(satz, {
        art: "ok",
        dauer: 8000,
        aktion: {
          titel: "Rückgängig",
          onClick: async () => {
            setZeilen((zs) => zs.map((z) => ({ ...z, persoenlicher_berater: r.alt.find((a) => a.karte === z.name)?.wert ?? z.persoenlicher_berater })));
            await beraterZuruecksetzenAction({ werte: r.alt });
            router.refresh();
          },
        },
      });
    });
  };

  const uebergabe = (z) => {
    starteTr(async () => {
      const r = await uebergabePlanenAction({ karte: z.name });
      if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
      setZeilen((zs) => zs.map((x) => (x.name === z.name ? { ...x, status: "Aktiv", wartetTage: null } : x)));
      starte(T.uebergabe.toast(z.name), { token: r.token, ms: r.ms, objekt: r.objekt, fehlerText: `Übergabe ${z.name}`, onVerworfen: () => setZeilen((zs) => zs.map((x) => (x.name === z.name ? z : x))), onFehler: () => setZeilen((zs) => zs.map((x) => (x.name === z.name ? z : x))), onErfolg: () => router.refresh() });
    });
  };

  const csv = () =>
    starteTr(async () => {
      const r = await kartenExportAction({ status: params.status || "" });
      if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
      const url = URL.createObjectURL(new Blob([`﻿${r.csv}`], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = r.datei;
      a.click();
      URL.revokeObjectURL(url);
    });

  const neuEinstufen = () =>
    starteTr(async () => {
      const r = await neuEinstufenAction({ karten: auswahl.map((z) => z.name) });
      if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
      zeige(`Einstufung geprüft · ${r.moeglich} von ${r.moeglich + r.ohne}${r.ohne ? ` – ${r.ohne} ohne Einwilligung` : ""}`, { art: "ok" });
      router.refresh();
    });

  const aufgabeVorschau = () =>
    starteTr(async () => {
      const r = await aufgabenAnBeraterAction({ karten: auswahl.map((z) => z.name), nurVorschau: true });
      if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
      setAufgabe(r.vorschau);
    });

  if (!zeilen.length) {
    const gefiltert = Boolean(params.q || params.status || params.stufe || params.berater) || reiter !== "alle";
    if (reiter === "dubletten") return <Leer art="erledigt" titel={T.karten.dublettenLeer} text="" testid="kk-karten-leer" />;
    if (gesamtAlle === 0) return <Leer art="leer" titel={T.karten.leer} text={T.uebersicht.leerText} icon="CreditCard" aktion={darfSchreiben ? <Knopf variant="primary" icon="Plus" href="/kundenkarte/karten/neu">{T.seiten.neu}</Knopf> : null} testid="kk-karten-leer" />;
    if (params.status === "Gesperrt") return <Leer art="erledigt" titel={T.karten.gesperrtLeer} text="" testid="kk-karten-leer" />;
    return <Leer art={gefiltert ? "gefiltert" : "leer"} titel={T.karten.gefiltert} zuruecksetzenHref="/kundenkarte/karten" testid="kk-karten-leer" />;
  }

  const von = (seite - 1) * groesse + 1;
  const bis = Math.min(gesamt, von + zeilen.length - 1);
  const seiten = Math.max(1, Math.ceil(gesamt / groesse));

  const zeilenMenue = (z) => (
    <Menue label={`Aktionen ${z.name}`} platzierung="unten-ende" ausloeser={(p) => <Knopf {...p} variant="ghost" size="s" icon="Ellipsis" label={`Aktionen für ${z.kunde_name}`} />}>
      <MenuePunkt icon="ArrowRight" href={`/kundenkarte/karten/${z.name}`}>
        Öffnen
      </MenuePunkt>
      {z.kontakt && (
        <MenuePunkt icon="Contact" href={`/kunden/${encodeURIComponent(z.kontakt)}`}>
          {T.akte.kundenakte}
        </MenuePunkt>
      )}
      {darfSchreiben && z.status === "Aktiv" && (
        <MenuePunkt icon="Sparkles" href={`/kundenkarte/karten/${z.name}?einloesen=1`}>
          Vorteil einlösen …
        </MenuePunkt>
      )}
      <MenuePunkt icon="Printer" href={`/kundenkarte/karten/${z.name}?druck=1`}>
        Drucken …
      </MenuePunkt>
      {darfSchreiben && z.status === "Beantragt" && (
        <MenuePunkt icon="CheckCheck" onWaehlen={() => uebergabe(z)}>
          Übergabe aktivieren
        </MenuePunkt>
      )}
      {reiter === "dubletten" && leitung && (
        <MenuePunkt icon="Layers" onWaehlen={() => setZusammen(z)}>
          {T.karten.zusammenfuehren}
        </MenuePunkt>
      )}
      {darfSchreiben && ["Aktiv", "Beantragt"].includes(z.status) && (
        <>
          <MenueTrenner />
          <MenuePunkt icon="Lock" onWaehlen={() => setSperren([z.name])}>
            Sperren …
          </MenuePunkt>
        </>
      )}
    </Menue>
  );

  return (
    <div className="min-w-0">
      <div className="bo-dt" data-testid="kk-karten-liste">
        <div className="bo-dt__kopf">
          <span className="bo-dt__zahl" data-testid="tabelle-gesamt">
            {gesamt === zeilen.length ? `${gesamt} ${gesamt === 1 ? "Karte" : "Karten"}` : `${von}–${bis} von ${gesamt}`}
          </span>
          <span className="flex-1" />
          {betraege && (
            <Knopf variant="ghost" size="s" icon="Download" onClick={csv} laedt={laeuft} data-testid="csv-export">
              {T.karten.export}
            </Knopf>
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="bo-dt__tabelle">
            <caption className="bo-kk-sr">Kundenkarten</caption>
            <thead>
              <tr>
                {darfSchreiben && (
                  <th scope="col" className="w-10">
                    <input type="checkbox" aria-label="Alle auswählen" checked={alleGewaehlt} onChange={() => setGewaehlt(alleGewaehlt ? new Set() : new Set(zeilen.map((z) => z.name)))} />
                  </th>
                )}
                <th scope="col">{T.karten.spalten.karte}</th>
                <th scope="col">{T.karten.spalten.name}</th>
                <th scope="col">{T.karten.spalten.stufe}</th>
                <th scope="col">{T.karten.spalten.berater}</th>
                <th scope="col" title={T.karten.legende}>
                  {T.karten.spalten.letzter}
                </th>
                {betraege && (
                  <th scope="col" data-rechts="" className="hidden xl:table-cell">
                    {T.karten.spalten.umsatz}
                  </th>
                )}
                <th scope="col">
                  <span className="bo-kk-sr">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody {...peek.listenProps}>
              {zeilen.map((z, i) => (
                <tr key={z.name} {...peek.zeilenProps(i)} data-gewaehlt={gewaehlt.has(z.name) ? "true" : undefined} data-testid={`kk-karte-${z.name}`}>
                  {darfSchreiben && (
                    <td>
                      <input type="checkbox" aria-label={`${z.kunde_name} auswählen`} checked={gewaehlt.has(z.name)} onChange={() => umschalten(z.name)} onClick={(e) => e.stopPropagation()} />
                    </td>
                  )}
                  <td className="whitespace-nowrap">
                    <Link href={`/kundenkarte/karten/${z.name}`} className="bo-kk-mono text-[14px] text-bo-text hover:underline">
                      {z.name}
                    </Link>
                  </td>
                  <td className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-semibold text-bo-text">{z.kunde_name}</span>
                      {z.status !== "Aktiv" && <StatusBadge wert={z.status} text={statusLabel(KARTE_STATUS, z.status)} ton={statusTon(KARTE_STATUS, z.status)} groesse="xs" />}
                    </span>
                    {z.status === "Gesperrt" && <span className="bo-kk-unter">{[sperrgrundLabel(z.sperrgrund_art), z.sperrgrund].filter(Boolean).join(" – ")}</span>}
                    {z.status === "Beantragt" && z.wartetTage > 7 && <span className="bo-kk-warn mt-0.5">{T.karten.wartetUebergabe(z.wartetTage)}</span>}
                  </td>
                  <td>
                    <StufenKennzeichen stufe={z.stufe} farbe={farbe[z.stufe]} groesse="s" zusatz={Number(z.stufe_manuell) ? T.akte.vonHand : undefined} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {darfSchreiben && z.status !== "Gekuendigt" ? (
                      <select className="bo-kk-auswahl bo-kk-auswahl--klein max-w-40" aria-label={`Berater für ${z.kunde_name}`} value={z.persoenlicher_berater || ""} onChange={(e) => beraterSetzen([z.name], e.target.value)} data-frisch={z._frisch ? "" : undefined}>
                        <option value="">–</option>
                        {berater.map((b) => (
                          <option key={b.wert} value={b.wert}>
                            {b.titel}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[14px]">{beraterName(z.persoenlicher_berater) || "–"}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap tabular-nums text-[14px]">
                    {z.letzter_einkauf_monat || (
                      <>
                        <span aria-hidden="true">–</span>
                        <span className="bo-kk-sr">{Number(z.einwilligung_auswertung) ? "kein Einkauf" : T.karten.nichtAusgewertet}</span>
                      </>
                    )}
                  </td>
                  {betraege && <td className="hidden whitespace-nowrap text-right tabular-nums text-[14px] xl:table-cell">{Number(z.einwilligung_auswertung) ? cent(z.jahresumsatz_cent) : "–"}</td>}
                  <td className="w-12 text-right" onClick={(e) => e.stopPropagation()}>
                    {zeilenMenue(z)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Telefon: Karten */}
        <ul className="bo-dt-karten md:hidden" data-testid="karten-liste">
          {zeilen.map((z) => (
            <li key={z.name} className="bo-dt-karte" data-gewaehlt={gewaehlt.has(z.name) ? "true" : undefined}>
              <span className="min-w-0 flex-1">
                <Link href={`/kundenkarte/karten/${z.name}`} className="block text-[15px] font-semibold text-bo-text after:absolute after:inset-0">
                  {z.kunde_name}
                </Link>
                <span className="mt-1 flex flex-wrap items-center gap-2">
                  <StufenKennzeichen stufe={z.stufe} farbe={farbe[z.stufe]} groesse="s" />
                  {z.status !== "Aktiv" && <StatusBadge wert={z.status} text={statusLabel(KARTE_STATUS, z.status)} ton={statusTon(KARTE_STATUS, z.status)} groesse="xs" />}
                </span>
                <span className="bo-kk-unter mt-1">
                  <span className="bo-kk-mono">{z.name}</span> · {z.letzter_einkauf_monat || "–"}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {seiten > 1 && (
          <nav className="bo-dt__fuss" aria-label="Seiten">
            <span>
              {von}–{bis} von {gesamt}
            </span>
            <span className="flex gap-2">
              <Knopf size="s" variant="ghost" icon="ChevronLeft" href={seite > 1 ? seitenHref("/kundenkarte/karten", params, seite - 1) : undefined} disabled={seite <= 1} label="Vorige Seite" />
              <Knopf size="s" variant="ghost" icon="ChevronRight" href={seite < seiten ? seitenHref("/kundenkarte/karten", params, seite + 1) : undefined} disabled={seite >= seiten} label="Nächste Seite" />
            </span>
          </nav>
        )}
      </div>

      {gewaehlt.size > 0 && darfSchreiben && (
        <div className="bo-dt-massen" role="region" aria-label={T.karten.auswahl(gewaehlt.size)} data-testid="kk-massen">
          <span className="text-[14px] font-semibold">{T.karten.auswahl(gewaehlt.size)}</span>
          <select className="bo-kk-auswahl" aria-label={T.karten.massenBerater} value="" onChange={(e) => e.target.value && beraterSetzen([...gewaehlt], e.target.value === "-" ? "" : e.target.value)}>
            <option value="">{T.karten.massenBerater}</option>
            {berater.map((b) => (
              <option key={b.wert} value={b.wert}>
                {b.titel}
              </option>
            ))}
            <option value="-">Niemand</option>
          </select>
          <Knopf size="s" icon="Users" onClick={aufgabeVorschau} laedt={laeuft}>
            {T.karten.massenAufgabe}
          </Knopf>
          <Knopf size="s" icon="RefreshCw" onClick={neuEinstufen}>
            {T.karten.massenNeu}
          </Knopf>
          <Menue label="Mehr" ausloeser={(p) => <Knopf {...p} size="s" iconRechts="ChevronDown">Mehr</Knopf>}>
            <MenuePunkt icon="Lock" gefaehrlich onWaehlen={() => setSperren(auswahl.filter((z) => ["Aktiv", "Beantragt"].includes(z.status)).map((z) => z.name))} deaktiviert={!auswahl.some((z) => ["Aktiv", "Beantragt"].includes(z.status))} grund="Nur aktive Karten lassen sich sperren.">
              {T.karten.massenSperren}
            </MenuePunkt>
          </Menue>
          <Knopf size="s" variant="ghost" icon="X" label="Auswahl aufheben" onClick={() => setGewaehlt(new Set())} />
        </div>
      )}

      <Peek peek={peek} eintraege={zeilen} titel={(z) => z.kunde_name} unter={(z) => z.name} vollseite={(z) => `/kundenkarte/karten/${z.name}`}>
        {(z) => <KartenPeek karte={z.name} />}
      </Peek>

      {sperren && (
        <SperrenDialog
          karten={sperren}
          onSchliessen={() => setSperren(null)}
          onGeplant={(namen) => {
            setZeilen((zs) => zs.map((z) => (namen.includes(z.name) ? { ...z, status: "Gesperrt" } : z)));
            setGewaehlt(new Set());
          }}
          onZurueck={() => router.refresh()}
        />
      )}
      <Bestaetigen
        offen={Boolean(aufgabe)}
        titel={`${aufgabe?.moeglich ?? 0} Aufgaben an die Berater anlegen?`}
        text={aufgabe?.satz}
        fakten={[{ label: "Kanal", wert: "Brief immer; Telefon/E-Mail nur mit Werbeeinwilligung" }]}
        bestaetigen="Anlegen"
        laeuft={laeuft}
        onAbbrechen={() => setAufgabe(null)}
        onBestaetigen={() =>
          starteTr(async () => {
            const r = await aufgabenAnBeraterAction({ karten: auswahl.map((z) => z.name) });
            setAufgabe(null);
            if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
            zeige(T.berichte.aufgabenAngelegt(r.angelegt), { art: "ok" });
            setGewaehlt(new Set());
          })
        }
      />
      <Bestaetigen
        offen={Boolean(zusammen)}
        titel={T.zusammen.titel}
        text={zusammen ? `${zusammen.kunde_name}: ${dubletten.find((d) => d.karten.includes(zusammen.name))?.karten.join(" + ") || zusammen.name}` : ""}
        bestaetigen={T.zusammen.knopf}
        laeuft={laeuft}
        onAbbrechen={() => setZusammen(null)}
        onBestaetigen={() =>
          starteTr(async () => {
            const d = dubletten.find((x) => x.karten.includes(zusammen.name));
            const andere = d?.karten.find((k) => k !== zusammen.name);
            const r = await zusammenfuehrenAction({ karte: zusammen.name, andere, ausfuehren: true });
            setZusammen(null);
            if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
            zeige(T.zusammen.ergebnis(r.plan.ziel), { art: "ok" });
            router.refresh();
          })
        }
      />
    </div>
  );
}

