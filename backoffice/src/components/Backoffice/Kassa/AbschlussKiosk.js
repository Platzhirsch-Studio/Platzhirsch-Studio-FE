"use client";
// Kassa – Tagesabschluss-Assistent (Team B-KAS, Konzept §3.8, A15/L1, E5/E12). Mitarbeitende zählen (blind:
// Soll erst nach dem Zählen) und übergeben; die Leitung prüft die Differenz (Grund ab Toleranz), schöpft in
// den Tresor ab (Fähigkeit `abschoepfung`) und schließt mit Namen ab. Schrittleiste als Pillen, Zählraster
// Scheine | Münzen mit aktiver Zeile, Tastatur: Enter springt zur nächsten Zeile.

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Lock, ScrollText } from "lucide-react";
import KioskShell from "../Kiosk/KioskShell";
import { useToast } from "../Toast";
import BetragFeld from "../Eingabe/BetragFeld";
import { Haken } from "./Sheet";
import { euro } from "@/lib/backoffice/kassa/betraege";
import { abschlussSchritte, differenz as diff, differenzGrundPflichtig, differenzWort, MUENZEN, SCHEINE, zaehlprotokollAus, zaehlprotokollSumme } from "@/lib/backoffice/kassa/abschluss";
import { ABSCHLUSS_STATUS_TITEL, KIOSK } from "@/lib/backoffice/kassa/texte";
import { abschliessenAction, zaehlenAction } from "@/lib/backoffice/kassa/actions";
import "./kassa.css";

const S = { size: 20, strokeWidth: 1.75, "aria-hidden": true };
const stueck = (c) => (c >= 100 ? `${c / 100} €` : `${c} Cent`);

export default function AbschlussKiosk(props) {
  const { kontext, benutzer, datum } = props;
  return (
    <KioskShell titel={kontext.kasse_doc?.bezeichnung || KIOSK.titel} geraet={{ name: kontext.kasse_doc?.standort || "" }} benutzer={benutzer} kontext={`${KIOSK.abschluss.titel}${datum ? ` ${datum.split("-").reverse().join(".")}` : ""}`} zurueckHref="/kassa" hilfe={[]}>
      <Inhalt {...props} />
    </KioskShell>
  );
}

function Inhalt({ kontext, abschluss: start, leitung, faehig, blind, datum, benutzer }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [a, setA] = useState(start);
  const schritte = useMemo(() => abschlussSchritte({ leitung, abschoepfung: !!faehig.abschoepfung?.an }), [leitung, faehig]);
  const [schritt, setSchritt] = useState(() => (leitung && start.status === "Gezaehlt" ? "differenz" : "pruefen"));
  const [anzahl, setAnzahl] = useState(() => Object.fromEntries((start.zaehlprotokoll || []).map((z) => [z.stueckelung_cent, z.anzahl])));
  const [grund, setGrund] = useState("");
  const [tresor, setTresor] = useState(null);
  const [name, setName] = useState(benutzer?.name || "");
  const [laeuft, setLaeuft] = useState(false);
  const [fertig, setFertig] = useState(null);
  const felder = useRef({});
  const ist = zaehlprotokollSumme(zaehlprotokollAus(anzahl));
  const soll = a.bargeld_soll_cent || 0;
  const d = diff(a.status === "Gezaehlt" && schritt !== "zaehlen" ? a.bargeld_ist_cent : ist, soll);
  const toleranz = kontext.einstellungen?.differenz_toleranz_cent ?? 100;
  const grundPflicht = differenzGrundPflichtig(d, toleranz);
  const idx = schritte.findIndex((x) => x.id === schritt);
  const sollSichtbar = !blind || leitung || schritt !== "zaehlen";

  if (a.status === "Abgeschlossen" && !fertig) {
    return (
      <div className="bo-ka bo-ka-seite" style={{ maxWidth: 720 }} data-testid="kassa-abschluss">
        <section className="bo-ka-kachel text-center flex flex-col items-center gap-3">
          <span className="bo-ka-rund" aria-hidden="true"><Lock {...S} /></span>
          <h1 className="bo-titel">{ABSCHLUSS_STATUS_TITEL.Abgeschlossen}</h1>
          <p className="bo-ka-muted">{KIOSK.abschluss.bereits}</p>
          <button type="button" className="bo-ka-primaer" style={{ maxWidth: 320 }} onClick={() => router.push("/kassa")}>{KIOSK.titel}</button>
        </section>
      </div>
    );
  }

  if (fertig) {
    return (
      <div className="bo-ka bo-ka-seite" style={{ maxWidth: 720 }} data-testid="kassa-abschluss-fertig">
        <section className="bo-ka-kachel text-center flex flex-col items-center gap-2">
          <Haken />
          <h1 className="bo-titel">{fertig.text}</h1>
          {fertig.zeilen?.map(([l, w]) => (
            <p key={l} className="bo-ka-muted">
              {l}: <b className="bo-ka-num text-bo-text">{w}</b>
            </p>
          ))}
          <div className="bo-ka-reihe" style={{ maxWidth: 480, marginTop: 12 }}>
            {fertig.pdf && <a className="bo-ka-zweit" href={fertig.pdf}>Protokoll</a>}
            <button type="button" className="bo-ka-primaer" onClick={() => router.push("/kassa")} data-autofokus>{KIOSK.titel}</button>
          </div>
        </section>
      </div>
    );
  }

  const zaehlen = async (uebergeben) => {
    setLaeuft(true);
    const r = await zaehlenAction({ kasse: kontext.kasse, datum, anzahlen: anzahl, unterschriftName: name });
    setLaeuft(false);
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    setA(r.daten);
    if (uebergeben) setFertig({ text: KIOSK.abschluss.uebergebenFertig, zeilen: [[KIOSK.abschluss.gezaehlt, euro(r.daten.bargeld_ist_cent)]] });
    else setSchritt("differenz");
  };
  const abschliessen = async () => {
    setLaeuft(true);
    const r = await abschliessenAction({ kasse: kontext.kasse, datum, differenzGrund: grund, unterschriftName: name, tresorCent: tresor || 0 });
    setLaeuft(false);
    if (!r.ok) return zeige(r.message, { art: "fehler" });
    setFertig({ text: KIOSK.abschluss.fertig(r.daten.name), pdf: r.daten.pdf_url, zeilen: [[KIOSK.abschluss.ist, euro(r.daten.bargeld_ist_cent)], [KIOSK.abschluss.differenz, euro(r.daten.differenz_cent)], ...(tresor ? [[KIOSK.abschluss.tresor, euro(tresor)]] : [])] });
  };

  const zeile = (s) => (
    <div key={s} className="bo-ka-zaehlzeile" data-aktiv={undefined}>
      <span className="bo-ka-zaehlzeile__wert">{stueck(s)}</span>
      <input
        ref={(el) => (felder.current[s] = el)}
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={`Anzahl ${stueck(s)}`}
        data-scan="nein"
        value={anzahl[s] ?? ""}
        onChange={(e) => setAnzahl((x) => ({ ...x, [s]: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const alle = [...SCHEINE, ...MUENZEN];
            felder.current[alle[alle.indexOf(s) + 1]]?.focus();
          }
        }}
        onFocus={(e) => e.target.select()}
        data-testid={`zaehl-${s}`}
      />
      <span className="bo-ka-zaehlzeile__summe">{euro((Number(anzahl[s]) || 0) * s)}</span>
    </div>
  );

  return (
    <div className="bo-ka bo-ka-seite" data-testid="kassa-abschluss" data-schritt={schritt}>
      <div className="bo-ka-seite__kopf">
        <h1>{KIOSK.abschluss.titel}</h1>
        <nav className="bo-ka-schritte" aria-label="Schritte">
          {schritte.map((x, i) => (
            <span key={x.id} className="bo-ka-schritt" aria-current={x.id === schritt ? "step" : undefined} data-fertig={i < idx ? "true" : undefined}>
              {i < idx ? <Check size={14} strokeWidth={2} aria-hidden="true" /> : <span className="bo-ka-num">{i + 1}</span>}
              {x.titel}
            </span>
          ))}
        </nav>
      </div>

      {schritt === "pruefen" && (
        <section className="bo-ka-kachel">
          <h2>{KIOSK.abschluss.pruefen}</h2>
          <p className="bo-ka-kachel__unter">{ABSCHLUSS_STATUS_TITEL[a.status] || a.status} · {a.name}</p>
          <dl className="bo-ka-fakten" style={{ marginTop: 16 }}>
            <div><dt>{KIOSK.abschluss.umsatz}</dt><dd>{euro(a.umsatz_cent)}</dd></div>
            <div><dt>{KIOSK.abschluss.belege}</dt><dd>{a.belege_anzahl}{a.stornos_anzahl ? ` · ${a.stornos_anzahl} ${KIOSK.abschluss.stornos}` : ""}</dd></div>
            <div><dt>{KIOSK.abschluss.karte}</dt><dd>{euro(a.karten_cent)}</dd></div>
            <div><dt>{KIOSK.abschluss.gutschein}</dt><dd>{euro(a.gutschein_cent)}</dd></div>
            <div><dt>{KIOSK.abschluss.bar}</dt><dd>{euro((a.bar_einnahmen_cent || 0) - (a.bar_ausgaben_cent || 0))}</dd></div>
            <div><dt>{KIOSK.abschluss.anfang}</dt><dd>{euro(a.bargeld_anfang_cent)}</dd></div>
            <div><dt>{KIOSK.abschluss.einlagen}</dt><dd>{euro(a.einlagen_cent)}</dd></div>
            <div><dt>{KIOSK.abschluss.entnahmen}</dt><dd>{euro(a.entnahmen_cent)}</dd></div>
          </dl>
          {!faehig.abschoepfung?.an && <p className="bo-ka-grund" style={{ marginTop: 12 }}>Abschöpfen in den Tresor vor dem Zählen über „Bargeld · Geldtransit Tresor“.</p>}
          <div className="bo-ka-reihe" style={{ marginTop: 20, maxWidth: 520, marginLeft: "auto" }}>
            <button type="button" className="bo-ka-zweit" onClick={() => router.push("/kassa")}><ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />{KIOSK.titel}</button>
            <button type="button" className="bo-ka-primaer" onClick={() => setSchritt("zaehlen")} data-testid="abschluss-weiter-zaehlen">{KIOSK.abschluss.weiterZaehlen}</button>
          </div>
        </section>
      )}

      {schritt === "zaehlen" && (
        <div className="bo-ka-zwei">
          <section className="bo-ka-kachel">
            <div className="bo-ka-zaehl">
              <div>
                <p className="bo-ka-label">{KIOSK.abschluss.scheine}</p>
                {SCHEINE.map(zeile)}
              </div>
              <div>
                <p className="bo-ka-label">{KIOSK.abschluss.muenzen}</p>
                {MUENZEN.map(zeile)}
              </div>
            </div>
          </section>
          <aside className="bo-ka-korb" style={{ position: "sticky", top: 92 }}>
            <p className="bo-ka-muted text-[13px]">{KIOSK.abschluss.gezaehlt}</p>
            <p className="bo-ka-zahlgross" data-testid="abschluss-ist">{euro(ist)}</p>
            {sollSichtbar ? (
              <div className="bo-ka-feld">
                <span className="bo-ka-feld__label">{KIOSK.abschluss.soll}</span>
                <span className="bo-ka-feld__wert">{euro(soll)}</span>
              </div>
            ) : (
              <p className="bo-ka-hinweis"><Lock size={16} strokeWidth={1.75} aria-hidden="true" />{KIOSK.abschluss.blind}</p>
            )}
            <div className="flex-1" />
            {!leitung && (
              <label>
                <span className="bo-ka-label">{KIOSK.abschluss.unterschriftName}</span>
                <input className="bo-ka-eingabe" data-scan="nein" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <button type="button" className="bo-ka-pay" disabled={laeuft || ist <= 0} onClick={() => zaehlen(!leitung)} data-testid="abschluss-zaehlung">
              <span>{leitung ? KIOSK.abschluss.weiter : KIOSK.abschluss.uebergeben}</span>
              <span className="bo-ka-num">{euro(ist)}</span>
            </button>
          </aside>
        </div>
      )}

      {schritt === "differenz" && (
        <section className="bo-ka-kachel" style={{ maxWidth: 720 }}>
          <h2>{KIOSK.abschluss.differenz}</h2>
          <dl className="bo-ka-fakten" style={{ marginTop: 16 }}>
            <div><dt>{KIOSK.abschluss.soll}</dt><dd>{euro(soll)}</dd></div>
            <div><dt>{KIOSK.abschluss.ist}</dt><dd>{euro(a.bargeld_ist_cent ?? ist)}</dd></div>
          </dl>
          <div className={d === 0 || !grundPflicht ? "bo-ka-band" : "bo-ka-band"} data-ton={d === 0 || !grundPflicht ? "ok" : "warnung"} style={{ marginTop: 16 }}>
            <ScrollText {...S} />
            <span>{KIOSK.abschluss.differenz}: <b className="bo-ka-num">{euro(d)}</b> · {differenzWort(d, toleranz)}</span>
          </div>
          {grundPflicht && (
            <>
              <p className="bo-ka-label" style={{ marginTop: 16 }}>{KIOSK.abschluss.grund}</p>
              <div className="bo-ka-chips" role="radiogroup" aria-label={KIOSK.abschluss.grund}>
                {KIOSK.abschluss.gruende.map((g) => (
                  <button key={g} type="button" role="radio" aria-checked={grund === g} className="bo-ka-chip" onClick={() => setGrund(g)}>{g}</button>
                ))}
              </div>
            </>
          )}
          <div className="bo-ka-reihe" style={{ marginTop: 20 }}>
            <button type="button" className="bo-ka-zweit" onClick={() => setSchritt("zaehlen")}>{KIOSK.abschluss.zurueck}</button>
            <button type="button" className="bo-ka-primaer" disabled={grundPflicht && !grund} onClick={() => setSchritt(schritte.some((x) => x.id === "abschoepfen") ? "abschoepfen" : "abschliessen")} data-testid="abschluss-weiter">{KIOSK.abschluss.weiter}</button>
          </div>
        </section>
      )}

      {schritt === "abschoepfen" && (
        <section className="bo-ka-kachel" style={{ maxWidth: 720 }}>
          <h2>{KIOSK.abschluss.abschoepfen}</h2>
          <p className="bo-ka-kachel__unter">{KIOSK.abschluss.tresorText}</p>
          <label style={{ display: "block", marginTop: 16 }}>
            <span className="bo-ka-label">{KIOSK.abschluss.tresor}</span>
            <BetragFeld value={tresor} onChange={setTresor} className="bo-ka-eingabe" maxCent={a.bargeld_ist_cent || ist} testid="abschluss-tresor" />
          </label>
          <p className="bo-ka-muted" style={{ marginTop: 12 }}>{KIOSK.abschluss.bleibt}: <b className="bo-ka-num text-bo-text">{euro((a.bargeld_ist_cent ?? ist) - (tresor || 0))}</b></p>
          <div className="bo-ka-reihe" style={{ marginTop: 20 }}>
            <button type="button" className="bo-ka-zweit" onClick={() => setSchritt("differenz")}>{KIOSK.abschluss.zurueck}</button>
            <button type="button" className="bo-ka-primaer" onClick={() => setSchritt("abschliessen")} data-testid="abschluss-weiter-abschliessen">{KIOSK.abschluss.weiter}</button>
          </div>
        </section>
      )}

      {schritt === "abschliessen" && (
        <section className="bo-ka-kachel" style={{ maxWidth: 720 }}>
          <h2>{KIOSK.abschluss.abschliessen}</h2>
          <p className="bo-ka-kachel__unter">{KIOSK.abschluss.erklaerung}</p>
          <label style={{ display: "block", marginTop: 16 }}>
            <span className="bo-ka-label">{KIOSK.abschluss.unterschriftName}</span>
            <input className="bo-ka-eingabe" data-scan="nein" value={name} onChange={(e) => setName(e.target.value)} data-testid="abschluss-name" />
          </label>
          <div className="bo-ka-reihe" style={{ marginTop: 20 }}>
            <button type="button" className="bo-ka-zweit" onClick={() => setSchritt(schritte.some((x) => x.id === "abschoepfen") ? "abschoepfen" : "differenz")}>{KIOSK.abschluss.zurueck}</button>
            <button type="button" className="bo-ka-primaer" disabled={laeuft || !name.trim()} onClick={abschliessen} data-testid="abschluss-abschliessen">
              <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
              {KIOSK.abschluss.abschliessen}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
