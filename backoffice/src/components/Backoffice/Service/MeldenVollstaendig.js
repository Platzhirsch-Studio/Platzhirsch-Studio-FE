"use client";
// S1-Vollständig (10-konzept-service §2.3.2): ① Kunde & Bezug ② Mangel ③ Fristen ④ Prüfen & anlegen.
// Rechte Spalte: Gewährleistungs-Vorschau (fristen.js, Spiegel von fristen.py) und Wissen am Fehlercode.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Kachel from "../Kachel";
import Schalter from "../Schalter";
import Datumsfeld from "../Formular/Datumsfeld";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import { Icon } from "../icons";
import { useToast } from "../Toast";
import { ArtWahl, FehlerCombobox, KontaktSuche } from "./Melden";
import { fallAnlegenAction } from "@/lib/backoffice/service/actions";
import { fristen } from "@/lib/backoffice/service/fristen";
import { KANAELE, KUNDENWUENSCHE, PRIORITAETEN } from "@/lib/backoffice/service/labels";
import { datumLang } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import "./service.css";

const BEZUG_ARTEN = [
  ["PH Lieferschein", "Lieferschein"],
  ["PH Rechnung", "Rechnung"],
  ["PH Projekt", "Projekt"],
];

export default function MeldenVollstaendig({ katalog, einst }) {
  const router = useRouter();
  const { zeige } = useToast();
  const [schritt, setSchritt] = useState(0);
  const [w, setW] = useState({ kontakt: null, kanal: "Telefon", bezugArt: "PH Lieferschein", bezug: "", art: "Mangel", fehlercode: "", beschreibung: "", ort_am_stueck: "", erstauftreten: "", kundenwunsch: "Offen", seriennummer: "", produkt_name: "", kaufdatum: "", uebergabe_datum: "", sachart: "Beweglich", prioritaet: einst.standard_prioritaet || "Normal", eingang: true, telefonat: false });
  const [weiterleitung, setWeiterleitung] = useState(null);
  const [fehler, setFehler] = useState({});
  const [laeuft, setLaeuft] = useState(false);
  const [ergebnis, setErgebnis] = useState(null);
  const setze = (k, v) => setW((x) => ({ ...x, [k]: v }));
  const code = (katalog.codes || []).find((c) => c.code === w.fehlercode);
  const fr = useMemo(() => fristen({ kaufdatum: w.kaufdatum, uebergabe: w.uebergabe_datum, kundentyp: w.kontakt?.unternehmer ? "Unternehmer" : "Verbraucher", sachart: w.sachart, gewaehrleistung_monate: einst.gewaehrleistung_monate }), [w.kaufdatum, w.uebergabe_datum, w.kontakt, w.sachart, einst.gewaehrleistung_monate]);

  const pruefe = (s) => {
    const f = {};
    if (s === 0 && !w.kontakt) f.kontakt = T.melden.pflicht;
    if (s === 1 && !w.fehlercode) f.fehlercode = T.melden.pflicht;
    if (s === 1 && !w.beschreibung.trim()) f.beschreibung = T.melden.pflicht;
    setFehler(f);
    return !Object.keys(f).length;
  };
  const weiter = () => pruefe(schritt) && !weiterleitung && setSchritt(schritt + 1);
  const anlegen = async () => {
    if (!pruefe(0) || !pruefe(1)) return;
    setLaeuft(true);
    const r = await fallAnlegenAction({ ...w, kontakt: w.kontakt.name, kunde_name: w.kontakt.anzeige, kunde_email: w.kontakt.email, kunde_telefon: w.kontakt.telefon, kundentyp: w.kontakt.unternehmer ? "Unternehmer" : "Verbraucher", bezug: w.bezug ? { doctype: w.bezugArt, name: w.bezug } : null, eingang: w.eingang && !!w.kontakt.email });
    setLaeuft(false);
    if (!r.ok) {
      if (r.fehler) setFehler(r.fehler);
      zeige(r.message || T.fehlerText.allgemein, { art: "fehler" });
      return;
    }
    setErgebnis(r);
  };

  if (ergebnis)
    return (
      <ErgebnisKarte
        titel={`${ergebnis.name} angelegt`}
        unter={ergebnis.frist ? `Reaktion bis ${ergebnis.frist}` : undefined}
        dokumente={[{ titel: ergebnis.name, info: "Servicefall", href: `/service/faelle/${ergebnis.name}`, icon: "ScrollText" }, ...(ergebnis.eingang ? [{ titel: "Eingangsbestätigung", info: ergebnis.eingang.verzoegert ? "wird gesendet" : "gesendet", icon: "Mail" }] : [])]}
        weiter={{ titel: "Akte öffnen", href: `/service/faelle/${ergebnis.name}` }}
        aktionen={[{ titel: "Prüfen & entscheiden", href: `/service/faelle/${ergebnis.name}?aktion=pruefen` }, { titel: "Nächster Fall", href: "/service/faelle?melden=1" }]}
      />
    );

  const folgen = [w.eingang && w.kontakt?.email && "sendet 1 Eingangsbestätigung", w.bezug && `verknüpft ${w.bezug}`].filter(Boolean);
  return (
    <div className="grid gap-(--bo-bento-gap) xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 content-start gap-(--bo-bento-gap)">
        <ol className="bo-svc-schritte" aria-label="Schritte">
          {T.melden.schritte.map((t, i) => (
            <li key={t} aria-current={i === schritt ? "step" : undefined} data-fertig={i < schritt ? "" : undefined}>
              <span>{i < schritt ? <Icon name="Check" className="size-3" /> : i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <Kachel titel={T.melden.schritte[schritt]}>
          {schritt === 0 && (
            <div className="grid gap-5">
              <KontaktSuche wert={w.kontakt} onWahl={(k) => setze("kontakt", k)} fehler={fehler.kontakt} autoFocus />
              <label className="bo-svc-feld">
                <span>{T.melden.kanal}</span>
                <select value={w.kanal} onChange={(e) => setze("kanal", e.target.value)}>
                  {KANAELE.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                <label className="bo-svc-feld">
                  <span>{T.melden.bezug}</span>
                  <select value={w.bezugArt} onChange={(e) => setze("bezugArt", e.target.value)}>
                    {BEZUG_ARTEN.map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="bo-svc-feld">
                  <span>Belegnummer ({T.melden.ohneBezug}: leer lassen)</span>
                  <input value={w.bezug} onChange={(e) => setze("bezug", e.target.value.trim())} placeholder="LS-2026-00001" />
                </label>
              </div>
            </div>
          )}
          {schritt === 1 && (
            <div className="grid gap-5">
              <ArtWahl wert={w.art} onWahl={(a) => setze("art", a)} weiterleitung={weiterleitung} onWeiterleitung={setWeiterleitung} />
              <FehlerCombobox katalog={katalog} wert={w.fehlercode} onWahl={(c) => setze("fehlercode", c.code)} fehler={fehler.fehlercode} />
              <label className="bo-svc-feld" data-fehler={fehler.beschreibung ? "" : undefined}>
                <span>{T.melden.beschreibung}</span>
                <textarea rows={4} value={w.beschreibung} onChange={(e) => setze("beschreibung", e.target.value)} />
                {fehler.beschreibung && <span className="bo-svc-fehler">{fehler.beschreibung}</span>}
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="bo-svc-feld">
                  <span>{T.melden.stelle}</span>
                  <input value={w.ort_am_stueck} onChange={(e) => setze("ort_am_stueck", e.target.value)} />
                </label>
                <div className="bo-svc-feld">
                  <span>{T.melden.seit}</span>
                  <Datumsfeld value={w.erstauftreten} onChange={(v) => setze("erstauftreten", v)} aria-label={T.melden.seit} />
                </div>
                <label className="bo-svc-feld">
                  <span>{T.melden.wunsch}</span>
                  <select value={w.kundenwunsch} onChange={(e) => setze("kundenwunsch", e.target.value)}>
                    {KUNDENWUENSCHE.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
                <label className="bo-svc-feld">
                  <span>{T.melden.produkt}</span>
                  <input value={w.produkt_name} onChange={(e) => setze("produkt_name", e.target.value)} />
                </label>
                <label className="bo-svc-feld">
                  <span>{T.melden.seriennummer}</span>
                  <input value={w.seriennummer} onChange={(e) => setze("seriennummer", e.target.value)} />
                </label>
              </div>
            </div>
          )}
          {schritt === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bo-svc-feld">
                <span>Kaufdatum</span>
                <Datumsfeld value={w.kaufdatum} onChange={(v) => setze("kaufdatum", v)} aria-label="Kaufdatum" />
              </div>
              <div className="bo-svc-feld">
                <span>Übergabe (Lieferung/Montage)</span>
                <Datumsfeld value={w.uebergabe_datum} onChange={(v) => setze("uebergabe_datum", v)} aria-label="Übergabe" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <span className="bo-svc-label">{T.melden.sachart}</span>
                <div className="bo-svc-chips" role="radiogroup" aria-label={T.melden.sachart}>
                  {[["Beweglich", T.melden.beweglich], ["Unbeweglich", T.melden.fest]].map(([v, t]) => (
                    <button key={v} type="button" role="radio" aria-checked={w.sachart === v} className="bo-svc-wahl" onClick={() => setze("sachart", v)}>
                      {t}
                    </button>
                  ))}
                </div>
                <p className="bo-svc-hinweis">{T.melden.festTip}</p>
              </div>
            </div>
          )}
          {schritt === 3 && (
            <div className="grid gap-4">
              <p className="text-[15px]">
                {w.kontakt?.anzeige} · {w.art} · {w.fehlercode} {code?.bezeichnung}
              </p>
              <p className="bo-svc-zitat">{w.beschreibung}</p>
              <label className="bo-svc-feld">
                <span>{T.melden.prioritaet}</span>
                <select value={w.prioritaet} onChange={(e) => setze("prioritaet", e.target.value)}>
                  {PRIORITAETEN.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              {w.kontakt?.email ? <Schalter label={`${T.melden.eingang} an ${w.kontakt.email}`} an={w.eingang} onWechsel={(v) => setze("eingang", v)} /> : <p className="bo-svc-hinweis">{T.melden.eingang}: {T.melden.keineEmail}</p>}
              <p className="bo-svc-hinweis">{T.melden.folgen(folgen)}</p>
            </div>
          )}
        </Kachel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Knopf variant="ghost" icon="ChevronLeft" onClick={() => (schritt ? setSchritt(schritt - 1) : router.push("/service/faelle"))}>
            {T.aktionen.zurueck}
          </Knopf>
          {schritt < 3 ? (
            <Knopf variant="primary" iconRechts="ChevronRight" onClick={weiter} disabled={!!weiterleitung} data-testid="vollstaendig-weiter">
              {T.aktionen.weiter}
            </Knopf>
          ) : (
            <Knopf variant="primary" laedt={laeuft} onClick={anlegen} data-testid="vollstaendig-anlegen">
              {T.melden.anlegen}
            </Knopf>
          )}
        </div>
      </div>
      <aside className="grid content-start gap-(--bo-bento-gap)">
        <Kachel titel="Gewährleistung" unter={w.kontakt?.unternehmer ? "Unternehmer" : "Verbraucher"}>
          {fr.gewaehrleistung_bis ? (
            <dl className="bo-svc-fakten" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
              <div>
                <dt>Vermutung bis</dt>
                <dd>{datumLang(fr.beweislast_bis)}</dd>
              </div>
              <div>
                <dt>Gewährleistung bis</dt>
                <dd>{datumLang(fr.gewaehrleistung_bis)}</dd>
              </div>
              <div>
                <dt>Verjährung der Geltendmachung</dt>
                <dd>{datumLang(fr.verjaehrung_bis)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{T.melden.gewaehrleistungOhne}</p>
          )}
          {w.kontakt?.unternehmer && <p className="bo-svc-hinweis mt-3">{T.melden.unternehmerHinweis}</p>}
        </Kachel>
        {code && (
          <Kachel titel={`${code.code} ${code.bezeichnung}`}>
            <div className="bo-svc-wissen">
              <p>
                <b>{T.melden.standardloesung}</b>
                {code.standardloesung || "–"}
              </p>
              <p>
                <b>{T.melden.pruefhinweis}</b>
                {code.pruefhinweis || "–"}
              </p>
            </div>
          </Kachel>
        )}
      </aside>
    </div>
  );
}
