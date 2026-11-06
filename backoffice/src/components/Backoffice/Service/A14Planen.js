"use client";
// A14 Einsatz planen (10-konzept-service §2.4.1, Vollseite): ① Techniker & Zeit aus freien Fenstern
// (get_technician_slots je Tag) ② Mitnehmen ③ Kunde & Zusammenfassung mit Folgen-Satz. Ergebnis je Teilschritt.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Knopf from "../Knopf";
import Kachel from "../Kachel";
import Schalter from "../Schalter";
import Avatar from "../Avatar";
import { Icon } from "../icons";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import { useToast } from "../Toast";
import { einsatzPlanenAction } from "@/lib/backoffice/service/actions";
import { EINSATZ_ARTEN } from "@/lib/backoffice/service/labels";
import { tagKurz } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

function minuten(z) {
  const [h, m] = String(z).split(":").map(Number);
  return h * 60 + m;
}
function zeit(n) {
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

/**
 * @param {{ziel:{art:"fall"|"pflege", name:string, titel:string, kunde:string, ort:string, land:string, email:string},
 *   tage:string[], slots:Record<string, Record<string, Array<{von:string, bis:string}>>>, techniker:Array<{email:string, name:string}>,
 *   dauer:number, art:string, teile:Array<{bezeichnung:string, menge:number}>, hinweis:string, kostenhinweis:boolean,
 *   wochenLinks:{vor:string, zurueck:string, dauer:Record<string,string>}}} p
 */
export default function A14Planen({ ziel, tage, slots, techniker, dauer, art: startArt, teile, hinweis: startHinweis, kostenhinweis, wochenLinks, leitung = false }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [schritt, setSchritt] = useState(0);
  const [wahl, setWahl] = useState(null); // {datum, von, techniker}
  const [art, setArt] = useState(startArt);
  const [mit, setMit] = useState(() => new Set(teile.map((t) => t.bezeichnung)));
  const [freitext, setFreitext] = useState("");
  const [hinweis, setHinweis] = useState(startHinweis);
  const [termin, setTermin] = useState(!!ziel.email && ziel.art === "fall");
  const [kosten, setKosten] = useState({ an: false, kanal: "Telefon" });
  const [laeuft, setLaeuft] = useState(false);
  const [ergebnis, setErgebnis] = useState(null);
  const [fehler, setFehler] = useState("");
  const ausland = ziel.land && ziel.land !== "Österreich";
  const auslandGesperrt = ausland && !leitung;
  const alleAbwesend = tage.every((t) => Object.values(slots[t] || {}).every((l) => !l.length));
  const tName = (email) => (techniker.find((t) => t.email === email)?.name || email).replace(/\s*\(.*\)$/, "");

  const anlegen = async () => {
    if (kostenhinweis && !kosten.an) return setFehler(T.einsaetze.a14.kostenPflicht);
    setFehler("");
    setLaeuft(true);
    const bis = zeit(minuten(wahl.von) + dauer);
    const r = await einsatzPlanenAction({ [ziel.art]: ziel.name, datum: wahl.datum, von: wahl.von, bis, techniker: wahl.techniker, art, mitzubringen: [...mit, freitext].filter(Boolean).join(", "), hinweis, terminvorschlag: termin, kostenhinweis: kostenhinweis ? { kanal: kosten.kanal } : null });
    setLaeuft(false);
    if (!r.ok && !r.schritte?.length) {
      zeige(r.message || T.fehlerText.allgemein, { art: "fehler" });
      return;
    }
    setErgebnis(r);
    router.refresh();
  };

  if (ergebnis) {
    const s = Object.fromEntries((ergebnis.schritte || []).map((x) => [x.id, x]));
    return (
      <ErgebnisKarte
        titel={ergebnis.ok ? "Einsatz angelegt" : "Einsatz teilweise angelegt"}
        unter={`${tagKurz(wahl.datum)} · ${wahl.von} · ${tName(wahl.techniker)}`}
        dokumente={[s.anlegen && { titel: ergebnis.einsatz, info: "Einsatz", href: `/service/einsaetze/${encodeURIComponent(ergebnis.einsatz)}`, icon: "Wrench" }, s.termin && { titel: s.termin.ok ? "Terminvorschlag gesendet" : `Terminvorschlag: ${s.termin.message}`, info: s.termin.ok ? "E-Mail" : "nicht ausgeführt", icon: "Mail" }, s.kosten && { titel: "Kostenhinweis vermerkt", info: kosten.kanal, icon: "MessageSquare" }].filter(Boolean)}
        weiter={{ titel: ziel.art === "fall" ? "Zum Fall" : "Zum Vertrag", href: ziel.art === "fall" ? `/service/faelle/${encodeURIComponent(ziel.name)}` : `/service/vertraege/pflege/${encodeURIComponent(ziel.name)}` }}
        aktionen={[{ titel: "Einsätze", href: "/service/einsaetze" }]}
      />
    );
  }

  return (
    <div className="grid gap-(--bo-bento-gap)">
      <ol className="bo-svc-schritte" aria-label="Schritte">
        {T.einsaetze.a14.schritte.map((t, i) => (
          <li key={t} aria-current={i === schritt ? "step" : undefined} data-fertig={i < schritt ? "" : undefined}>
            <span>{i < schritt ? <Icon name="Check" className="size-3" /> : i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      {schritt === 0 && (
        <Kachel
          titel={T.einsaetze.a14.schritte[0]}
          unter={wahl ? T.einsaetze.a14.gewaehlt(tagKurz(wahl.datum), `${wahl.von}–${zeit(minuten(wahl.von) + dauer)}`, tName(wahl.techniker)) : `${ziel.kunde} · ${ziel.ort}`}
          werkzeuge={
            <span className="flex gap-2">
              <Knopf size="s" variant="ghost" href={wochenLinks.zurueck} icon="ChevronLeft" label="Vorige Woche" />
              <Knopf size="s" variant="ghost" href={wochenLinks.vor} icon="ChevronRight" label={T.einsaetze.a14.naechsteWoche} />
            </span>
          }
          testid="a14-zeit"
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <span className="bo-svc-label">{T.einsaetze.a14.dauer}</span>
              <div className="bo-svc-chips">
                {[60, 120, 240].map((d) => (
                  <Link key={d} href={wochenLinks.dauer[d]} className="bo-svc-wahl" aria-pressed={dauer === d} scroll={false}>
                    {d / 60} h
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <span className="bo-svc-label">{T.einsaetze.a14.art}</span>
              <div className="bo-svc-chips" role="radiogroup" aria-label={T.einsaetze.a14.art}>
                {EINSATZ_ARTEN.map((a) => (
                  <button key={a} type="button" role="radio" aria-checked={art === a} className="bo-svc-wahl" onClick={() => setArt(a)}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {alleAbwesend ? (
            <div className="bo-svc-karte flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px]">{techniker.length ? T.einsaetze.a14.alleAbwesend : T.einsaetze.keineTechniker}</p>
              <Knopf size="s" href={wochenLinks.vor}>
                {T.einsaetze.a14.naechsteWoche}
              </Knopf>
            </div>
          ) : (
            <div className="grid gap-3">
              {techniker.map((t) => (
                <div key={t.email} className="bo-svc-karte grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <span className="flex items-center gap-2 text-[14px] font-medium">
                    <Avatar name={tName(t.email)} groesse={28} />
                    {tName(t.email)}
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    {tage.map((d) => {
                      const fenster = (slots[d]?.[t.email] || []).filter((_, i) => i % 2 === 0).slice(0, 4);
                      return (
                        <div key={d} className="min-w-0">
                          <p className="mb-1 text-[12px] font-medium text-bo-text-soft">{tagKurz(d)}</p>
                          {fenster.length ? (
                            <div className="bo-svc-fenster">
                              {fenster.map((f) => {
                                const an = wahl?.datum === d && wahl?.von === f.von && wahl?.techniker === t.email;
                                return (
                                  <button key={f.von} type="button" aria-pressed={an} aria-label={`${tName(t.email)} ${tagKurz(d)} ${f.von} frei`} onClick={() => setWahl({ datum: d, von: f.von, techniker: t.email })}>
                                    {f.von}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[12px] text-bo-text-faint">–</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Kachel>
      )}

      {schritt === 1 && (
        <Kachel titel={T.einsaetze.a14.mitnehmen} unter={teile.length ? `${teile.length} Teile am Fall` : T.einsaetze.a14.keineTeile} testid="a14-mitnehmen">
          <div className="grid gap-3">
            {teile.map((t) => (
              <label key={t.bezeichnung} className="bo-svc-karte flex items-center gap-3">
                <input type="checkbox" className="size-[18px] accent-(--color-bo-action)" checked={mit.has(t.bezeichnung)} onChange={() => setMit((s) => (s.has(t.bezeichnung) ? new Set([...s].filter((x) => x !== t.bezeichnung)) : new Set([...s, t.bezeichnung])))} />
                <span className="text-[14px]">
                  {t.menge} × {t.bezeichnung}
                </span>
              </label>
            ))}
            <label className="bo-svc-feld">
              <span>Weiteres zum Mitnehmen</span>
              <input value={freitext} onChange={(e) => setFreitext(e.target.value)} />
            </label>
            <label className="bo-svc-feld">
              <span>{T.einsaetze.a14.hinweis}</span>
              <textarea rows={2} value={hinweis} onChange={(e) => setHinweis(e.target.value)} />
            </label>
          </div>
        </Kachel>
      )}

      {schritt === 2 && (
        <Kachel titel={T.einsaetze.a14.schritte[2]} unter={`${ziel.titel}`} testid="a14-zusammenfassung">
          <div className="grid gap-4">
            <p className="text-[15px]">{T.einsaetze.a14.gewaehlt(tagKurz(wahl.datum), `${wahl.von}–${zeit(minuten(wahl.von) + dauer)}`, tName(wahl.techniker))} · {art}</p>
            {ziel.art === "fall" && (ziel.email ? <Schalter label={`${T.einsaetze.a14.terminvorschlag} (${ziel.email})`} an={termin} onWechsel={setTermin} /> : <p className="bo-svc-hinweis">Terminvorschlag: keine E-Mail hinterlegt – telefonisch vereinbaren.</p>)}
            {kostenhinweis && (
              <div className="bo-svc-karte grid gap-3">
                <Schalter label={T.einsaetze.a14.kostenhinweis} an={kosten.an} onWechsel={(v) => setKosten({ ...kosten, an: v })} />
                <div className="bo-svc-chips" role="radiogroup" aria-label="Kanal des Kostenhinweises">
                  {["Telefon", "E-Mail", "Persönlich"].map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={kosten.kanal === k} className="bo-svc-wahl" onClick={() => setKosten({ ...kosten, kanal: k })}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {ausland && <p className="bo-svc-hinweis" data-ton="warn">{T.einsaetze.a14.ausland}</p>}
            {fehler && <p className="bo-svc-fehler">{fehler}</p>}
            <p className="bo-svc-hinweis">{T.einsaetze.a14.folgen([ziel.art === "fall" && "setzt den Fall auf „Einsatz geplant“", termin && "sendet 1 Terminvorschlag"].filter(Boolean))}</p>
          </div>
        </Kachel>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Knopf variant="ghost" icon="ChevronLeft" onClick={() => (schritt ? setSchritt(schritt - 1) : router.back())}>
          {T.aktionen.zurueck}
        </Knopf>
        {schritt < 2 ? (
          <Knopf variant="primary" iconRechts="ChevronRight" disabled={!wahl} grund={!wahl ? T.einsaetze.a14.ohneWahl : undefined} onClick={() => setSchritt(schritt + 1)} data-testid="a14-weiter">
            {schritt === 1 && mit.size === teile.length && !freitext ? "Weiter ohne Änderungen" : T.aktionen.weiter}
          </Knopf>
        ) : (
          <Knopf variant="primary" laedt={laeuft} disabled={auslandGesperrt} grund={auslandGesperrt ? "Freigabe der Leitung nötig" : undefined} onClick={anlegen} data-testid="a14-anlegen">
            {T.einsaetze.a14.ok}
          </Knopf>
        )}
      </div>
    </div>
  );
}
