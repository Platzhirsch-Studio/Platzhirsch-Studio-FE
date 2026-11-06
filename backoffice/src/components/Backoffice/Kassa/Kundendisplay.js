"use client";
// Kassa – Kundendisplay (Team B-KAS, Konzept §9, Lounge §10, Entwurf entwurf-lounge/kundendisplay). Zweiter
// Bildschirm ohne Bedienelemente, gekoppelt über den Kanal des Fundaments (P0-6): gleiches Gerät
// BroadcastChannel „ph-kassa-<Kasse>“, zweites Gerät SSE /api/kassa/display (Rückfall Polling 2 s); ohne
// Verbindung Ruhebild + „Anzeige pausiert“. Datensparsam: keine Kontaktdaten, Standard ohne Namen; Kundenkarte
// nur als Stufe + Leistungsvorteile (ohne Geldwert). Maßeinheit --u skaliert mit der Fläche (lesbar auf 1,5 m).

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Gift, Nfc, Package, Sparkles, Ticket, Truck } from "lucide-react";
import { useKundendisplay } from "@/lib/backoffice/kanal/browser";
import { euro } from "@/lib/backoffice/kassa/betraege";
import { DISPLAY } from "@/lib/backoffice/kassa/texte";
import { qrSvgAction } from "@/lib/backoffice/kassa/actions";
import { Haken } from "./Sheet";
import "./kassa.css";

const VORTEIL = [
  [/liefer/i, Truck],
  [/pflege/i, Sparkles],
  [/event/i, Ticket],
];
const vorteilIcon = (t) => VORTEIL.find(([re]) => re.test(t))?.[1] || Sparkles;
const s = (n, w = 1.5) => ({ strokeWidth: w, "aria-hidden": true, style: { width: n, height: n } });

function Ruhe({ bilder, text }) {
  return (
    <div className="bo-kd-ruhe" data-testid="kd-ruhe">
      <div aria-hidden="true">
        {bilder.map((b, i) => (
          <span key={b} className="bo-kd-ruhe__bild" style={{ "--i": i }}>
            <Image src={b} alt="" fill sizes="100vw" preload={i === 0} />
          </span>
        ))}
      </div>
      <div className="bo-kd-ruhe__panel">
        <p className="bo-kd-mark">PLATZHIRSCH</p>
        <p className="bo-kd-ruhe__sub">Home Living · Lochau am Bodensee</p>
        <p className="bo-kd-ruhe__gruss">{text || DISPLAY.willkommen}</p>
        <div className="bo-kd-ruhe__karten">
          <div className="bo-kd-glas">
            <Sparkles strokeWidth={1.5} aria-hidden="true" />
            <p>
              <b>Kundenkarte</b>
              {DISPLAY.kundenkarteHinweis.replace(/^Mit der Platzhirsch Kundenkarte: /, "")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Einkauf({ n, name }) {
  const kk = n.kundenkarte;
  const weitere = Math.max(0, (n.anzahl || 0) - n.positionen.length);
  return (
    <div className="bo-kd-einkauf" data-testid="kd-einkauf">
      <section aria-label="Ihr Einkauf">
        <p className="bo-kd-gruss">{name ? DISPLAY.gutenTagName(name) : DISPLAY.gutenTag}</p>
        {weitere > 0 && <p className="bo-kd-weitere">{DISPLAY.weitere(weitere)}</p>}
        <ol className="bo-kd-liste">
          {n.positionen.map((p, i) => (
            <li key={`${p.titel}-${i}`} className="bo-kd-pos" style={{ "--i": i }} data-neu={p.neu ? "true" : undefined}>
              <span className={p.bild ? "bo-kd-pos__img" : "bo-kd-pos__img"}>{p.bild ? <Image src={p.bild} alt="" fill sizes="120px" /> : /gutschein/i.test(p.titel) ? <Gift {...s("50%")} /> : <Package {...s("45%")} />}</span>
              <span>
                <span className="bo-kd-pos__name">{p.titel}</span>
                <span className="bo-kd-pos__marke">{[p.unter, p.menge > 1 ? `${p.menge} × ${euro(p.einzel_cent)}` : ""].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="bo-kd-pos__preis">{euro(p.betrag_cent)}</span>
            </li>
          ))}
        </ol>
      </section>
      <aside className="bo-kd-summe">
        {kk && (
          <>
            <div className="bo-kd-karte">
              <span className="bo-kd-karte__chip" aria-hidden="true">P</span>
              <span>
                <span className="bo-kd-karte__cap">{DISPLAY.karteErkannt}</span>
                <b>{kk.stufe}</b>
              </span>
            </div>
            {kk.vorteile?.length > 0 && (
              <ul className="bo-kd-vorteile">
                {kk.vorteile.slice(0, 3).map((v) => {
                  const I = vorteilIcon(v.titel);
                  return (
                    <li key={v.titel}>
                      <I strokeWidth={1.5} aria-hidden="true" />
                      {v.titel}
                      <span data-spaeter={v.eingeloest ? undefined : "true"}>
                        {v.eingeloest && <Check {...s("1em", 2)} />}
                        {v.eingeloest ? DISPLAY.eingeloest : DISPLAY.verfuegbar}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        <dl className="bo-kd-zeilen">
          <div>
            <dt>{DISPLAY.zwischensumme}</dt>
            <dd>{euro(n.zwischensumme_cent ?? n.gesamt_cent)}</dd>
          </div>
          {n.gutschein_cent ? (
            <div>
              <dt>
                <Gift {...s("1em")} />
                {DISPLAY.gutschein}
              </dt>
              <dd>{euro(-n.gutschein_cent)}</dd>
            </div>
          ) : null}
          {n.ust_cent ? (
            <div className="bo-kd-ust">
              <dt>{DISPLAY.darinUst}</dt>
              <dd>{euro(n.ust_cent)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="bo-kd-gesamt">
          <span>{DISPLAY.gesamt}</span>
          <b data-testid="kd-gesamt">{euro(n.gesamt_cent)}</b>
        </div>
      </aside>
    </div>
  );
}

function Bezahlen({ n }) {
  const bar = n.zahlart === "bar";
  return (
    <div className="bo-kd-zahlen" data-testid="kd-bezahlen">
      <p className="bo-kd-zahlen__cap">{DISPLAY.zuZahlen}</p>
      <p className="bo-kd-zahlen__betrag">{euro(n.gesamt_cent)}</p>
      {bar ? (
        <dl className="bo-kd-bar">
          <div>
            <dt>{DISPLAY.gegeben}</dt>
            <dd>{euro(n.gegeben_cent ?? n.gesamt_cent)}</dd>
          </div>
          <div data-rueck="true">
            <dt>{DISPLAY.rueckgeld}</dt>
            <dd>{euro(n.rueckgeld_cent ?? 0)}</dd>
          </div>
        </dl>
      ) : (
        <div className="bo-kd-terminal">
          <span className="bo-kd-terminal__ico">
            <Nfc strokeWidth={1.5} aria-hidden="true" />
            <i />
            <i />
          </span>
          <p>{DISPLAY.karte}</p>
        </div>
      )}
    </div>
  );
}

function QrBild({ qr }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let aus = false;
    const beleg = /^beleg:(.+)$/.exec(qr || "")?.[1];
    if (!beleg) return;
    qrSvgAction({ beleg }).then((r) => !aus && r.ok && typeof r.daten?.svg === "string" && setSvg(r.daten.svg));
    return () => {
      aus = true;
    };
  }, [qr]);
  if (!svg) return <span className="bo-kd-qr" aria-hidden="true" />;
  // Nur SVG ohne Skript/Ereignisse (Server-Erzeugung ph_kassa.rksv.qr bzw. Mock-Muster).
  return <span className="bo-kd-qr" role="img" aria-label={DISPLAY.qr} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Danke({ n }) {
  const bar = n.zahlart === "bar";
  const vorteil = n.kundenkarte?.vorteile?.find((v) => v.eingeloest);
  return (
    <div className="bo-kd-danke" data-testid="kd-danke">
      <div className="bo-kd-danke__main">
        <Haken />
        <p className="bo-kd-danke__t">{DISPLAY.danke}</p>
        {bar && n.rueckgeld_cent ? (
          <p className="bo-kd-danke__sub">
            {DISPLAY.rueckgeld} <b>{euro(n.rueckgeld_cent)}</b>
          </p>
        ) : (
          <p className="bo-kd-danke__sub">
            {bar ? "Barzahlung" : DISPLAY.dankeKarte} · <b>{euro(n.gesamt_cent)}</b>
          </p>
        )}
        {vorteil && <p className="bo-kd-danke__hint">Vorteil „{vorteil.titel}“ ist auf Ihrem Beleg vermerkt.</p>}
      </div>
      {n.qr && (
        <div className="bo-kd-qrkarte">
          <QrBild qr={n.qr} />
          <p>
            <b>{DISPLAY.qr}</b>
            {DISPLAY.qrText}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * @param {{kasse:string, titel:string, standort:string, bilder:string[], text:string, vorschau?:object|null}} p
 * `vorschau`: feste Nachricht (Verwaltung/Abnahme) statt Live-Kanal.
 */
export default function Kundendisplay({ kasse, titel, standort, bilder, text, vorschau = null }) {
  const live = useKundendisplay(vorschau ? "" : kasse);
  const n = vorschau || live.nachricht;
  const verbunden = vorschau ? true : live.verbunden;
  // Nach dem Dank zurück zur Ruhe (Konzept: 8 s), falls die Kassa nichts mehr sendet.
  const [ruheNach, setRuheNach] = useState(null);
  useEffect(() => {
    if (n?.zustand !== "danke" || vorschau) return;
    const seq = n.seq;
    const t = setTimeout(() => setRuheNach(seq), 20000);
    return () => clearTimeout(t);
  }, [n, vorschau]);
  const ruhe = !!n && n.zustand === "danke" && ruheNach === n.seq;
  const zustand = !n || !verbunden || ruhe ? "ruhe" : n.zustand;
  return (
    <div className="bo-kd" data-zustand={zustand} data-testid="kundendisplay" data-verbunden={verbunden ? "ja" : "nein"}>
      {n?.training && zustand !== "ruhe" && <p className="bo-kd-training">{DISPLAY.training}</p>}
      {zustand === "ruhe" && <Ruhe bilder={bilder} text={text} />}
      {zustand === "einkauf" && <Einkauf n={n} name={n.name} />}
      {zustand === "bezahlen" && <Bezahlen n={n} />}
      {zustand === "danke" && <Danke n={n} />}
      {zustand !== "ruhe" ? (
        <p className="bo-kd-fuss">
          <span className="bo-kd-mark bo-kd-mark--s">PLATZHIRSCH</span>
          <span>
            {titel} · {standort}
          </span>
        </p>
      ) : (
        !verbunden && (
          <p className="bo-kd-fuss" style={{ justifyContent: "flex-start", zIndex: 2 }}>
            <span className="bo-kd-pause" role="status">{DISPLAY.pausiert}</span>
          </p>
        )
      )}
    </div>
  );
}
