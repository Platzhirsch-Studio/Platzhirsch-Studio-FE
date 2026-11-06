"use client";
// Berichtstabelle (Konzept §3.8) – Tabelle in Kachel, Euro-Spalten nur mit Recht (Server leert sie ohnehin),
// „Karten ohne Einkauf“: Auswahl → „Aufgabe an Berater“ mit Kanal-Vorschau (TKG § 174), Filter „Meine Karten“.

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Leer from "../Leer";
import { Icon } from "../icons";
import { Bestaetigen } from "../Overlay";
import { useToast } from "../Toast";
import { aufgabenAnBeraterAction } from "@/lib/backoffice/kundenkarte/actions";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { T } from "@/lib/backoffice/kundenkarte/texte";
import "../DataTable/datatable.css";
import "./kundenkarte.css";

const SPALTEN = {
  kundenwert: [
    ["karte", "Karte"],
    ["kunde_name", "Kunde"],
    ["stufe", "Stufe"],
    ["stufe_seit", "Stufe seit", "datum"],
    ["jahresumsatz", "Umsatz Zeitraum", "euro"],
    ["gesamtumsatz", "Gesamtumsatz", "euro"],
    ["letzter_einkauf", "Letzter Einkauf", "datum"],
    ["einwilligung", "Auswertung"],
    ["berater", "Berater", "person"],
  ],
  stufenwechsel: [
    ["zeitpunkt", "Zeitpunkt", "zeit"],
    ["karte", "Karte"],
    ["kunde_name", "Kunde"],
    ["alt", "Von"],
    ["neu", "Nach"],
    ["richtung", "Richtung", "richtung"],
    ["art", "Auslöser"],
    ["jahresumsatz", "Umsatz Zeitraum", "euro"],
  ],
  vorteile: [
    ["titel", "Vorteil"],
    ["aktiv", "Aktiv"],
    ["limit", "Limit/Jahr", "zahl"],
    ["einloesungen", "Einlösungen", "zahl"],
    ["stornos", "Stornos", "zahl"],
    ["karten", "Karten (genutzt)", "zahl"],
    ["berechtigt", "Karten (berechtigt)", "zahl"],
    ["orte", "Orte"],
  ],
  "ohne-einkauf": [
    ["karte", "Karte"],
    ["kunde_name", "Kunde"],
    ["stufe", "Stufe"],
    ["letzter_einkauf", "Letzter Einkauf", "datum"],
    ["tage", "Tage ohne Einkauf", "zahl"],
    ["berater", "Berater", "person"],
    ["hinweis", "Hinweis"],
  ],
  manuell: [
    ["karte", "Karte"],
    ["kunde_name", "Kunde"],
    ["stufe", "Stufe"],
    ["stufe_seit", "Stufe seit", "datum"],
    ["grund", "Grund"],
  ],
};

export default function BerichtTabelle({ report, zeilen = [], betraege = false, berater = [], darfAufgaben = false, meine = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [vorschau, setVorschau] = useState(null);
  const [laeuft, starte] = useTransition();
  const name = (w) => berater.find((b) => b.wert === w)?.titel || (w ? String(w).split("@")[0] : "–");
  const spalten = (SPALTEN[report] || []).filter(([, , art]) => art !== "euro" || betraege);
  const mitAuswahl = report === "ohne-einkauf" && darfAufgaben;
  const zelle = (z, [feld, , art]) => {
    const w = z[feld];
    if (feld === "karte" && w)
      return (
        <Link href={`/kundenkarte/karten/${w}`} className="bo-kk-mono text-[13px] hover:underline">
          {w}
        </Link>
      );
    if (art === "euro") return w == null ? "–" : cent(w);
    if (art === "datum") return w ? datum(w) : "–";
    if (art === "zeit") return w ? datumZeit(w) : "–";
    if (art === "person") return name(w);
    if (art === "richtung")
      return (
        <span className="inline-flex items-center gap-1">
          <Icon name={w === "auf" ? "ArrowUp" : "ArrowDown"} className="size-3.5" />
          {w === "auf" ? "Aufstufung" : "Herabstufung"}
        </span>
      );
    return w ?? "–";
  };
  const csv = () => {
    const kopf = spalten.map(([, t]) => t).join(";");
    const reihen = zeilen.map((z) => spalten.map(([f, , art]) => `"${String(art === "euro" ? (z[f] == null ? "" : (z[f] / 100).toFixed(2).replace(".", ",")) : (z[f] ?? "")).replace(/"/g, '""')}"`).join(";"));
    const url = URL.createObjectURL(new Blob([`﻿${[kopf, ...reihen].join("\n")}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kundenkarte-${report}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="min-w-0">
      <div className="bo-dt" data-testid="kk-bericht-tabelle">
        <div className="bo-dt__kopf">
          <span className="bo-dt__zahl">{zeilen.length} Zeilen</span>
          <span className="flex-1" />
          {report === "ohne-einkauf" && (
            <Knopf size="s" variant={meine ? "primary" : "ghost"} href={meine ? `/kundenkarte/berichte/${report}` : `/kundenkarte/berichte/${report}?meine=1`} aria-pressed={meine}>
              {T.berichte.meine}
            </Knopf>
          )}
          {betraege && zeilen.length > 0 && (
            <Knopf size="s" variant="ghost" icon="Download" onClick={csv} data-testid="csv-export">
              CSV
            </Knopf>
          )}
        </div>
        {zeilen.length === 0 ? (
          <Leer art="leer" groesse="karte" titel={T.berichte.leer} text="" icon="ChartColumn" />
        ) : (
          <div className="overflow-x-auto">
            <table className="bo-dt__tabelle" data-dicht="">
              <caption className="bo-kk-sr">Bericht</caption>
              <thead>
                <tr>
                  {mitAuswahl && (
                    <th scope="col">
                      <span className="bo-kk-sr">Auswahl</span>
                    </th>
                  )}
                  {spalten.map(([f, t, art]) => (
                    <th key={f} scope="col" data-rechts={art === "euro" || art === "zahl" ? "" : undefined}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z, i) => (
                  <tr key={`${z.karte || z.vorteil || i}-${i}`} data-gewaehlt={gewaehlt.has(z.karte) ? "true" : undefined} className={z.nichtBeurteilbar ? "text-bo-text-faint" : undefined}>
                    {mitAuswahl && (
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`${z.kunde_name} auswählen`}
                          disabled={z.nichtBeurteilbar}
                          checked={gewaehlt.has(z.karte)}
                          onChange={() =>
                            setGewaehlt((g) => {
                              const n = new Set(g);
                              if (n.has(z.karte)) n.delete(z.karte);
                              else n.add(z.karte);
                              return n;
                            })
                          }
                        />
                      </td>
                    )}
                    {spalten.map((s) => (
                      <td key={s[0]} className={`text-[14px] ${s[2] === "euro" || s[2] === "zahl" ? "text-right tabular-nums" : ""}`}>
                        {zelle(z, s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {report === "vorteile" && <p className="bo-dt__fuss">{T.berichte.fussVorteile}</p>}
      </div>
      {mitAuswahl && gewaehlt.size > 0 && (
        <div className="bo-dt-massen" role="region" aria-label="Auswahl">
          <span className="text-[14px] font-semibold">{T.karten.auswahl(gewaehlt.size)}</span>
          <Knopf
            size="s"
            icon="Users"
            laedt={laeuft}
            onClick={() =>
              starte(async () => {
                const r = await aufgabenAnBeraterAction({ karten: [...gewaehlt], nurVorschau: true });
                if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
                setVorschau(r.vorschau);
              })
            }
            data-testid="kk-aufgabe-berater"
          >
            {T.berichte.aufgabe}
          </Knopf>
        </div>
      )}
      <Bestaetigen
        offen={Boolean(vorschau)}
        titel={`${vorschau?.moeglich ?? 0} persönliche Aufgaben anlegen?`}
        text={vorschau?.satz}
        fakten={[{ label: "Kanal", wert: "Brief immer; Telefon oder E-Mail nur mit Werbeeinwilligung" }]}
        bestaetigen="Anlegen"
        laeuft={laeuft}
        onAbbrechen={() => setVorschau(null)}
        testid="kk-kanal-vorschau"
        onBestaetigen={() =>
          starte(async () => {
            const r = await aufgabenAnBeraterAction({ karten: [...gewaehlt] });
            setVorschau(null);
            if (!r?.ok) return zeige(r?.message || T.fehler.allgemein, { art: "fehler" });
            setGewaehlt(new Set());
            zeige(T.berichte.aufgabenAngelegt(r.angelegt), { art: "ok" });
            router.refresh();
          })
        }
      />
    </div>
  );
}
