"use client";
// Freigabe-Schreibtisch (§ 3.9): Bilder als Raster (role="grid", Pfeile, X/Leertaste markieren, 1 Freigeben,
// 3 Ablehnen mit Grund), Preise und Lieferzeiten als Liste mit bisher → neu. Nur die Leitung entscheidet; jede
// Entscheidung läuft als verzögerter Commit 8 s – die Website sieht vor Ablauf nichts. Das Team sieht, was wartet.
import { useRef, useState } from "react";
import { Check, ExternalLink, ShieldCheck } from "lucide-react";
import Knopf from "../Knopf";
import Dialog from "../Overlay/Dialog";
import Lightbox from "../Overlay/Lightbox";
import { Pille } from "../StatusBadge";
import { ProduktBild } from "./Bausteine";
import useAktion from "./useAktion";
import { freigabeAction } from "@/lib/backoffice/sortiment/actions";
import { FREIGABEN, GLOSSAR } from "@/lib/backoffice/sortiment/texte";
import { cent, datum } from "@/lib/backoffice/format";

/** @param {{art:"bilder"|"preise"|"lieferzeiten", eintraege:object[], leitung:boolean}} p */
export default function FreigabeSchreibtisch({ art, eintraege, leitung }) {
  const { verzoegert, laeuft } = useAktion();
  const [gewaehlt, setGewaehlt] = useState(() => new Set());
  const [erledigt, setErledigt] = useState(() => new Set());
  const [ablehnen, setAblehnen] = useState(null);
  const [grund, setGrund] = useState("");
  const [lupe, setLupe] = useState(null);
  const [fokus, setFokus] = useState(0);
  const karten = useRef([]);
  const key = (e) => e.zeile || e.produkt;
  const sichtbar = eintraege.filter((e) => !erledigt.has(key(e)));
  const freigabeArt = art === "bilder" ? "bild" : art === "preise" ? "preis" : "lieferzeit";

  const entscheide = async (liste, entscheidung, g = "") => {
    const keys = liste.map(key);
    setErledigt((alt) => new Set([...alt, ...keys]));
    setGewaehlt(new Set());
    const r = await verzoegert(() => freigabeAction({ art: freigabeArt, ziele: liste.map((e) => ({ produkt: e.produkt, zeile: e.zeile })), entscheidung, grund: g }), {
      text: entscheidung === "freigeben" ? FREIGABEN.freigegebenToast(liste.length) : FREIGABEN.abgelehntToast(liste.length),
      onVerworfen: () => setErledigt((alt) => new Set([...alt].filter((k) => !keys.includes(k)))),
    });
    if (!r?.ok) setErledigt((alt) => new Set([...alt].filter((k) => !keys.includes(k))));
  };

  const umschalten = (e) =>
    setGewaehlt((alt) => {
      const n = new Set(alt);
      n.has(key(e)) ? n.delete(key(e)) : n.add(key(e));
      return n;
    });

  const auswahl = sichtbar.filter((e) => gewaehlt.has(key(e)));
  const ziel = auswahl.length ? auswahl : sichtbar;

  const taste = (ev, i) => {
    const spalten = Math.max(1, Math.round((ev.currentTarget.parentElement?.clientWidth || 800) / 216));
    const geh = (n) => {
      const j = Math.max(0, Math.min(sichtbar.length - 1, n));
      setFokus(j);
      karten.current[j]?.focus();
    };
    if (ev.key === "ArrowRight") geh(i + 1);
    else if (ev.key === "ArrowLeft") geh(i - 1);
    else if (ev.key === "ArrowDown") geh(i + spalten);
    else if (ev.key === "ArrowUp") geh(i - spalten);
    else if (ev.key.toLowerCase() === "x") umschalten(sichtbar[i]);
    else if (ev.key === " " || ev.key === "Enter") setLupe(i);
    else if (ev.key === "1" && leitung) entscheide([sichtbar[i]], "freigeben");
    else if (ev.key === "3" && leitung) setAblehnen([sichtbar[i]]);
    else return;
    ev.preventDefault();
  };

  if (!sichtbar.length) return null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="bo-sor-unter">{leitung ? (auswahl.length ? `${auswahl.length} ausgewählt` : `${sichtbar.length} warten`) : FREIGABEN.teamHinweis}</p>
        {leitung && (
          <span className="flex flex-wrap gap-2">
            <Knopf variant="secondary" onClick={() => setAblehnen(ziel)} disabled={laeuft}>
              {FREIGABEN.ablehnen}
            </Knopf>
            <Knopf variant="primary" icon="Check" onClick={() => entscheide(ziel, "freigeben")} laedt={laeuft} data-testid="freigabe-alle">
              {auswahl.length ? FREIGABEN.ausgewaehlte(auswahl.length) : FREIGABEN.alleFreigeben(sichtbar.length)}
            </Knopf>
          </span>
        )}
      </div>

      {art === "bilder" ? (
        <ul className="bo-sor-freigabe-raster" role="grid" aria-label={FREIGABEN.arten.bilder} data-testid="freigabe-raster">
          {sichtbar.map((e, i) => (
            <li
              key={key(e)}
              ref={(el) => (karten.current[i] = el)}
              role="gridcell"
              tabIndex={i === fokus ? 0 : -1}
              aria-selected={gewaehlt.has(key(e))}
              className="bo-sor-freigabe-karte"
              onKeyDown={(ev) => taste(ev, i)}
              onFocus={() => setFokus(i)}
              aria-label={`${e.titel}, ${GLOSSAR.bildTyp[e.typ] || "Bild"}`}
            >
              {leitung && (
                <button type="button" className="bo-sor-freigabe-karte__haken" aria-label={`${e.titel} markieren`} aria-pressed={gewaehlt.has(key(e))} tabIndex={-1} onClick={() => umschalten(e)}>
                  {gewaehlt.has(key(e)) && <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />}
                </button>
              )}
              <button type="button" className="block rounded-[18px]" onClick={() => setLupe(i)} tabIndex={-1} aria-label={`${e.titel} groß ansehen`}>
                <ProduktBild src={e.bild} alt="" fuellen typ={e.typ} />
              </button>
              <div className="min-w-0 px-2">
                <p className="truncate text-[14px] font-semibold">{e.titel}</p>
                <p className="bo-sor-klein flex items-center gap-1 truncate">
                  {e.beleg ? <ShieldCheck className="size-3.5 text-bo-salbei-text" strokeWidth={1.75} aria-hidden="true" /> : null}
                  {e.marke} · {GLOSSAR.bildTyp[e.typ] || "Bild"} · {e.beleg ? "Beleg" : "ohne Beleg"}
                </p>
              </div>
              {leitung && (
                <div className="flex gap-2 px-2">
                  <Knopf size="s" variant="secondary" className="flex-1" onClick={() => entscheide([e], "freigeben")} tabIndex={-1}>
                    {FREIGABEN.freigeben}
                  </Knopf>
                  <Knopf size="s" variant="ghost" onClick={() => setAblehnen([e])} tabIndex={-1}>
                    {FREIGABEN.ablehnen}
                  </Knopf>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1" data-testid="freigabe-liste">
          {sichtbar.map((e) => (
            <li key={key(e)} className="bo-sor-karte-zeile !flex-wrap">
              {leitung && <input type="checkbox" className="size-4" checked={gewaehlt.has(key(e))} onChange={() => umschalten(e)} aria-label={`${e.titel} markieren`} />}
              <ProduktBild src={e.bild} alt="" groesse={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{e.titel}</p>
                <p className="bo-sor-unter truncate">
                  {art === "preise" ? `${e.marke} · ${GLOSSAR.preisartKurz[e.preisart] || e.preisart} · Stand ${datum(e.stand)} · ${GLOSSAR.preisQuelle[e.quelle] || e.quelle || "–"}` : `${e.marke}${e.imShop ? " · im Shop" : ""}`}
                </p>
              </div>
              <div className="text-right">
                {art === "preise" ? (
                  <>
                    <p className="text-[15px] tabular-nums">
                      <span className="text-bo-text-soft">{e.bisher !== null ? cent(e.bisher) : "–"}</span> → <strong className="font-semibold">{cent(e.neu)}</strong>
                    </p>
                    {e.bisher ? <p className="bo-sor-klein tabular-nums">{`${e.neu >= e.bisher ? "+" : "−"}${(Math.abs((e.neu - e.bisher) * 100) / e.bisher).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`}</p> : <p className="bo-sor-klein">erster Preis</p>}
                  </>
                ) : (
                  <p className="text-[15px] font-semibold tabular-nums">{e.von === e.bis ? `${e.von} Wochen` : `${e.von}–${e.bis} Wochen`}</p>
                )}
              </div>
              {e.quelleUrl ? (
                <a href={e.quelleUrl} target="_blank" rel="noreferrer noopener" className="bo-rund bo-rund--s bo-tip" data-tip={FREIGABEN.quelle} aria-label={`${FREIGABEN.quelle} ${e.titel}`}>
                  <ExternalLink className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </a>
              ) : null}
              {leitung ? (
                <span className="flex gap-2">
                  <Knopf size="s" variant="secondary" onClick={() => entscheide([e], "freigeben")}>
                    {FREIGABEN.freigeben}
                  </Knopf>
                  <Knopf size="s" variant="ghost" onClick={() => setAblehnen([e])}>
                    {FREIGABEN.ablehnen}
                  </Knopf>
                </span>
              ) : (
                <Pille material="eiche" groesse="sm">
                  Freigabe offen
                </Pille>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        offen={!!ablehnen}
        onSchliessen={() => setAblehnen(null)}
        titel={ablehnen?.length === 1 ? `${ablehnen[0].titel} ablehnen?` : `${ablehnen?.length || 0} ablehnen?`}
        text="Der Grund steht im Verlauf des Produkts."
        groesse="sm"
        fuss={
          <>
            <Knopf variant="secondary" onClick={() => setAblehnen(null)}>
              Abbrechen
            </Knopf>
            <Knopf
              variant="danger"
              disabled={grund.trim().length < 5}
              grund={grund.trim().length < 5 ? FREIGABEN.grundPflicht : undefined}
              onClick={() => {
                const liste = ablehnen;
                setAblehnen(null);
                setGrund("");
                entscheide(liste, "ablehnen", grund);
              }}
            >
              {FREIGABEN.ablehnen}
            </Knopf>
          </>
        }
      >
        <div className="bo-sor-feld">
          <label htmlFor="fg-grund">{FREIGABEN.grund}</label>
          <input id="fg-grund" className="bo-sor-eingabe" value={grund} onChange={(ev) => setGrund(ev.target.value)} autoFocus />
        </div>
      </Dialog>

      {art === "bilder" && (
        <Lightbox offen={lupe !== null} onSchliessen={() => setLupe(null)} start={lupe ?? 0} titel={FREIGABEN.arten.bilder} medien={sichtbar.map((e) => ({ src: e.bild, titel: e.titel, alt: e.titel, quelle: e.quelle, freigabe: { text: e.beleg ? FREIGABEN.markenbeleg : FREIGABEN.ohneBeleg, ton: e.beleg ? "ok" : "warn" } }))} />
      )}
    </>
  );
}
