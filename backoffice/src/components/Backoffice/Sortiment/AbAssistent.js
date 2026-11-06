"use client";
// A10 „AB einlesen“ (§ 5.8): 1 AB-Nummer, -Datum, Datei · 2 Werte je Position (leer = nicht bestätigt, „=“ übernimmt
// den Sollwert, „Alle wie bestellt“), Abweichung live mit denselben Regeln und Texten wie der Server
// (regeln.abweichungenPosition) · 3 Ergebnis mit nächstem Schritt. EK-Spalte nur für die Leitung (§ 1.2, O2).
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Datumsfeld from "../Formular/Datumsfeld";
import BetragFeld from "../Eingabe/BetragFeld";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import useAktion from "./useAktion";
import { abEinlesenAction } from "@/lib/backoffice/sortiment/actions";
import { abweichungenPosition, isoTag } from "@/lib/backoffice/sortiment/regeln";
import { AB_ASSISTENT } from "@/lib/backoffice/sortiment/texte";
import { datum } from "@/lib/backoffice/format";

/** @param {{b:object, leitung:boolean, toleranz:{toleranzPreis:number, toleranzTermin:number}}} p */
export default function AbAssistent({ b, leitung, toleranz }) {
  const router = useRouter();
  const { sofort, laeuft } = useAktion();
  const [schritt, setSchritt] = useState(1);
  const [kopf, setKopf] = useState({ ab_nummer: b.ab_nummer || "", ab_datum: b.ab_datum || isoTag() });
  const [fehler, setFehler] = useState({});
  const positionen = (b.positionen || []).filter((p) => p.status !== "Storniert");
  const [werte, setWerte] = useState(() => Object.fromEntries(positionen.map((p, i) => [p.idx || i + 1, { ab_menge: p.ab_menge ?? "", ab_ek_cent: p.ab_ek_cent ?? null, bestaetigter_termin: p.bestaetigter_termin || "", ab_artikelnr: p.ab_artikelnr || "", ab_ausfuehrung_text: p.ab_ausfuehrung_text || "" }])));
  const [ergebnis, setErgebnis] = useState(null);

  const setze = (idx, feld, wert) => setWerte((w) => ({ ...w, [idx]: { ...w[idx], [feld]: wert } }));
  const gleich = (idx, p, feld, soll) => (e) => {
    if (e.target.value === "=") setze(idx, feld, soll ?? "");
  };
  const alleWieBestellt = () => setWerte(Object.fromEntries(positionen.map((p, i) => [p.idx || i + 1, { ab_menge: p.menge, ab_ek_cent: leitung ? p.ek_cent ?? null : null, bestaetigter_termin: p.wunschtermin || b.wunschtermin || "", ab_artikelnr: p.hersteller_artikelnr || "", ab_ausfuehrung_text: p.ausfuehrung_text || "" }])));

  const live = useMemo(
    () =>
      Object.fromEntries(
        positionen.map((p, i) => {
          const idx = p.idx || i + 1;
          const w = werte[idx] || {};
          return [idx, abweichungenPosition({ ...p, wunschtermin: p.wunschtermin || b.wunschtermin, ab_menge: w.ab_menge === "" ? undefined : Number(w.ab_menge), ab_ek_cent: w.ab_ek_cent ?? undefined, bestaetigter_termin: w.bestaetigter_termin, ab_artikelnr: w.ab_artikelnr, ab_ausfuehrung_text: w.ab_ausfuehrung_text }, idx, toleranz)];
        })
      ),
    [positionen, werte, toleranz, b.wunschtermin]
  );
  const anzahl = Object.values(live).reduce((a, z) => a + z.length, 0);

  const weiter = () => {
    if (!kopf.ab_nummer.trim()) {
      setFehler({ ab_nummer: AB_ASSISTENT.nummerFehlt });
      document.getElementById("ab-nr")?.focus();
      return;
    }
    setFehler({});
    setSchritt(2);
  };

  const erzeugen = async () => {
    const r = await sofort(() => abEinlesenAction({ name: b.name, ab_nummer: kopf.ab_nummer, ab_datum: kopf.ab_datum, positionen: Object.entries(werte).map(([idx, w]) => ({ idx: Number(idx), ...w })) }), { ok: AB_ASSISTENT.fertig, neuLaden: false });
    if (r?.ok) {
      setErgebnis(r);
      setSchritt(3);
    }
  };

  return (
    <div className="flex flex-col gap-(--bo-bento-gap)" data-testid="ab-assistent">
      <ol className="flex flex-wrap gap-2" aria-label="Schritte">
        {AB_ASSISTENT.schritte.map((t, i) => (
          <li key={t} aria-current={schritt === i + 1 ? "step" : undefined} className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium ${schritt === i + 1 ? "bg-bo-text text-bo-surface" : schritt > i + 1 ? "bg-bo-fill-2 text-bo-text" : "bg-bo-fill text-bo-text-soft"}`}>
            <span className="tabular-nums">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      {schritt === 1 && (
        <section className="bo-kachel">
          <h2 className="bo-titel-kachel">{AB_ASSISTENT.schritte[0]}</h2>
          <p className="bo-sor-unter">{AB_ASSISTENT.dateiHinweis}</p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="bo-sor-feld">
              <label htmlFor="ab-nr">{AB_ASSISTENT.abNummer} *</label>
              <input id="ab-nr" className="bo-sor-eingabe" value={kopf.ab_nummer} onChange={(e) => setKopf((k) => ({ ...k, ab_nummer: e.target.value }))} aria-invalid={fehler.ab_nummer ? "true" : undefined} autoFocus />
              {fehler.ab_nummer && <span className="bo-sor-feld__fehler">{fehler.ab_nummer}</span>}
            </div>
            <div className="bo-sor-feld">
              <span>{AB_ASSISTENT.abDatum} *</span>
              <Datumsfeld value={kopf.ab_datum} onChange={(v) => setKopf((k) => ({ ...k, ab_datum: v }))} aria-label={AB_ASSISTENT.abDatum} />
            </div>
            <div className="bo-sor-feld">
              <label htmlFor="ab-datei">{AB_ASSISTENT.datei}</label>
              <input id="ab-datei" type="file" accept="application/pdf" className="bo-sor-eingabe pt-2.5 text-[13px]" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Knopf variant="ghost" href={`/sortiment/bestellungen/${encodeURIComponent(b.name)}`}>
              {AB_ASSISTENT.abbrechen}
            </Knopf>
            <Knopf variant="primary" iconRechts="ArrowRight" onClick={weiter} data-testid="ab-weiter">
              {AB_ASSISTENT.weiter}
            </Knopf>
          </div>
        </section>
      )}

      {schritt === 2 && (
        <section className="bo-kachel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="bo-titel-kachel">{AB_ASSISTENT.schritte[1]}</h2>
              <p className="bo-sor-unter">{AB_ASSISTENT.leerHinweis}</p>
            </div>
            <Knopf variant="secondary" icon="CheckCheck" onClick={alleWieBestellt} data-testid="ab-wie-bestellt">
              {AB_ASSISTENT.alleWieBestellt}
            </Knopf>
          </div>
          <ul className="mt-5 flex flex-col gap-3">
            {positionen.map((p, i) => {
              const idx = p.idx || i + 1;
              const w = werte[idx];
              const z = live[idx];
              return (
                <li key={idx} className="rounded-[20px] bg-bo-surface-2 p-4" data-testid="ab-position">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[15px] font-semibold">
                      <span className="tabular-nums text-bo-text-soft">{idx} · </span>
                      {p.bezeichnung}
                    </p>
                    <p className="bo-sor-unter tabular-nums">
                      {AB_ASSISTENT.wieBestellt}: {p.menge} Stk. · {datum(p.wunschtermin || b.wunschtermin)}
                      {p.ausfuehrung_text ? ` · ${p.ausfuehrung_text}` : ""}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                    <div className="bo-sor-feld">
                      <label htmlFor={`ab-m-${idx}`}>AB Menge</label>
                      <input id={`ab-m-${idx}`} inputMode="numeric" className="bo-sor-eingabe bo-sor-eingabe--klein" value={w.ab_menge} placeholder={String(p.menge)} onChange={(e) => (e.target.value === "=" ? setze(idx, "ab_menge", p.menge) : setze(idx, "ab_menge", e.target.value.replace(/\D/g, "")))} />
                    </div>
                    <div className="bo-sor-feld">
                      <label htmlFor={`ab-t-${idx}`}>AB Termin</label>
                      <Datumsfeld id={`ab-t-${idx}`} kompakt value={w.bestaetigter_termin} onChange={(v) => setze(idx, "bestaetigter_termin", v)} aria-label={`AB Termin Position ${idx}`} />
                    </div>
                    {leitung ? (
                      <div className="bo-sor-feld">
                        <label htmlFor={`ab-ek-${idx}`}>AB EK netto</label>
                        <BetragFeld id={`ab-ek-${idx}`} value={w.ab_ek_cent} onChange={(c) => setze(idx, "ab_ek_cent", c)} />
                      </div>
                    ) : (
                      <div className="bo-sor-feld">
                        <span>AB EK netto</span>
                        <span className="bo-sor-klein pt-2">EK erfasst die Leitung</span>
                      </div>
                    )}
                    <div className="bo-sor-feld">
                      <label htmlFor={`ab-a-${idx}`}>AB Art.-Nr.</label>
                      <input id={`ab-a-${idx}`} className="bo-sor-eingabe bo-sor-eingabe--klein" value={w.ab_artikelnr} placeholder={p.hersteller_artikelnr || ""} onChange={(e) => setze(idx, "ab_artikelnr", e.target.value)} onBlur={gleich(idx, p, "ab_artikelnr", p.hersteller_artikelnr)} />
                    </div>
                    <div className="bo-sor-feld">
                      <label htmlFor={`ab-x-${idx}`}>AB Ausführung</label>
                      <input id={`ab-x-${idx}`} className="bo-sor-eingabe bo-sor-eingabe--klein" value={w.ab_ausfuehrung_text} placeholder={p.ausfuehrung_text || ""} onChange={(e) => setze(idx, "ab_ausfuehrung_text", e.target.value)} onBlur={gleich(idx, p, "ab_ausfuehrung_text", p.ausfuehrung_text)} />
                    </div>
                  </div>
                  <p className={`mt-3 text-[13px] ${z.length ? "bo-sor-warn" : "bo-sor-ok"}`} aria-live="polite">
                    {z.length ? z.map((x) => `${x.feld === "Ausfuehrung" ? "Ausführung" : x.feld === "Artikel" ? "Art.-Nr." : x.feld}: ${x.abweichung_text}`).join(" · ") : AB_ASSISTENT.wieBestellt}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="bo-sor-klein mt-4">{AB_ASSISTENT.toleranz(toleranz.toleranzPreis, toleranz.toleranzTermin)}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Knopf variant="ghost" icon="ArrowLeft" onClick={() => setSchritt(1)}>
              {AB_ASSISTENT.zurueck}
            </Knopf>
            <span className="flex items-center gap-3">
              <span className="bo-sor-unter tabular-nums">{anzahl ? `${anzahl} Abweichungen` : "Ohne Abweichung"}</span>
              <Knopf variant="primary" laedt={laeuft} onClick={erzeugen} data-testid="ab-erzeugen">
                {AB_ASSISTENT.abgleichErzeugen}
              </Knopf>
            </span>
          </div>
        </section>
      )}

      {schritt === 3 && ergebnis && (
        <ErgebnisKarte
          titel={`${AB_ASSISTENT.fertig} · ${kopf.ab_nummer}`}
          unter={AB_ASSISTENT.fertigUnter(ergebnis.abweichungen || 0, ergebnis.offen || 0)}
          zahl={{ titel: "Abweichungen offen", text: String(ergebnis.offen || 0) }}
          weiter={{ titel: ergebnis.offen ? "Abweichungen klären" : AB_ASSISTENT.zurBestellung, href: `/sortiment/bestellungen/${encodeURIComponent(b.name)}${ergebnis.offen ? "?tab=ab" : ""}` }}
          aktionen={[{ titel: "Zur Liste", href: "/sortiment/bestellungen", onClick: () => router.refresh() }]}
        />
      )}
    </div>
  );
}
