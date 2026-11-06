// Nachkalkulation (Inhaber-Wunsch 04.11.2026; ph_projekte.api.projekt_kalkulation_v2) – nur Leitung.
// Kopf: Erlös, Kosten Ist + Obligo, Prognose gegen Budget, DB laufend und End-DB mit Ampel (Wort + Form, nie Farbe
// allein). Darunter Deckungsbeiträge DB1–3 (DB4 nur mit Gemeinkosten), Kostenarten mit Budget/Ist/Obligo/Rest/Prognose,
// Wochenreihe (Ist kumuliert, Obligo je Woche) und Belege als Quellen. Server-Komponente.

import Kachel, { Bento } from "../Kachel";
import StatusBadge from "../StatusBadge";
import Leer from "../Leer";
import { Balken } from "../Charts";
import { TEXTE } from "@/lib/backoffice/projekte/texte";
import { euroRund, prozentText, datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { STUFE_LABEL } from "@/lib/backoffice/projekte/kalkulation";
import "./projekte.css";

const K = TEXTE.kalkulation;
const AMPEL_TON = { gruen: "gruen", gelb: "orange", rot: "rot", "": "grau" };

function Ampel({ wert }) {
  return <StatusBadge wert={wert || "ohne"} ton={AMPEL_TON[wert || ""]} text={K.ampel[wert || ""]} groesse="sm" />;
}

function Stat({ titel, wert, unter, rechts }) {
  return (
    <div className="bo-prj-stufe">
      <p className="text-[13px] leading-[18px] font-medium text-bo-text-soft">{titel}</p>
      <p className="bo-prj-stufe__wert">{wert}</p>
      {unter && <p className="bo-prj-stufe__unter">{unter}</p>}
      {rechts && <div className="mt-2">{rechts}</div>}
    </div>
  );
}

export default function Nachkalkulation({ k, fehler = false }) {
  if (fehler || !k) return <Kachel titel={K.titel}><Leer art="leer" groesse="karte" titel={K.nichtVerfuegbar} /></Kachel>;
  const kopf = k.kopf || {};
  const stufen = [1, 2, 3, ...(k.gemeinkosten_aktiv ? [4] : [])];
  const ziel = k.parameter?.ziel || {};
  const verbraucht = (kopf.kosten_ist_cent || 0) + (kopf.obligo_cent || 0);
  const budget = kopf.budget_cent || 0;
  const anteil = (x) => (budget ? `${Math.min(100, Math.max(0, Math.round((x / Math.max(budget, kopf.prognose_kosten_cent || 0)) * 100)))}%` : "0%");
  const punkte = (k.zeitreihe || []).map((w) => ({ label: `KW ${w.woche.slice(-2)}`, wert: Math.round((w.ist_kumuliert_cent || 0) / 100) }));
  return (
    <div className="flex flex-col gap-6" data-testid="nachkalkulation">
      {!k.eingerichtet && <p className="rounded-[20px] bg-bo-warning-soft px-5 py-4 text-[14px] leading-5 text-bo-warning-text">{K.nichtEingerichtet}</p>}
      <Kachel titel={K.titel} unter={`${K.unter} · ${K.stichtag(datumKurz(k.stichtag, { jahr: true }))}`} werkzeuge={<Ampel wert={kopf.ampel} />}>
        <div className="bo-prj-stufen">
          <Stat titel={K.erloes} wert={euroRund(kopf.erloes_cent)} unter={K.erloesBasis[kopf.erloes_basis] || ""} />
          <Stat titel={`${K.ist} + ${K.obligo}`} wert={euroRund(verbraucht)} unter={`${K.budget} ${euroRund(budget)}`} />
          <Stat titel={K.prognose} wert={euroRund(kopf.prognose_kosten_cent)} unter={kopf.ueber_budget ? K.ueberBudget : K.imBudget} rechts={<Ampel wert={kopf.ampel_kosten} />} />
          <Stat titel={K.dbLaufend} wert={prozentText(kopf.db_laufend_prozent)} unter={`${K.fertigstellung} ${kopf.fertigstellungsgrad ?? 0} %`} />
          <Stat titel={K.dbPrognose(kopf.db_prognose_stufe || "DB3")} wert={prozentText(kopf.db_prognose_prozent)} unter={euroRund(kopf.db_prognose_cent)} rechts={<Ampel wert={kopf.ampel_db} />} />
        </div>
        <div className="mt-6">
          <div className="bo-prj-balken3" role="img" aria-label={`Ist ${euroRund(kopf.kosten_ist_cent)}, Obligo ${euroRund(kopf.obligo_cent)}, Budget ${euroRund(budget)}`}>
            <span style={{ width: anteil(kopf.kosten_ist_cent || 0) }} />
            <span style={{ width: anteil(kopf.obligo_cent || 0) }} />
            <span style={{ flex: 1 }} />
          </div>
          <p className="bo-prj-legende mt-2">
            <span><i style={{ background: "var(--color-bo-ink)" }} />{K.ist} {euroRund(kopf.kosten_ist_cent)}</span>
            <span><i style={{ background: "var(--color-bo-eiche)" }} />{K.obligo} {euroRund(kopf.obligo_cent)}</span>
            <span><i style={{ background: "var(--color-bo-fill-2)" }} />{K.rest} {euroRund(Math.max(0, budget - verbraucht))}</span>
          </p>
          <p className="mt-2 text-[12px] text-bo-text-soft">{k.fertigstellung?.methode || K.methode}</p>
        </div>
      </Kachel>
      <Bento einblenden={false}>
        <Kachel className="md:col-span-5" titel={K.stufen} unter={K.stufenUnter} testid="kalk-stufen">
          <div className="-mx-3 overflow-x-auto">
            <table className="bo-prj-tab bo-prj-kalk">
              <thead>
                <tr>
                  <th scope="col">Stufe</th>
                  <th scope="col" data-zahl>{K.ist}</th>
                  <th scope="col" data-zahl>{K.prognose}</th>
                  <th scope="col" data-zahl>{K.budget}</th>
                </tr>
              </thead>
              <tbody>
                {stufen.map((n) => (
                  <tr key={n}>
                    <th scope="row">
                      DB{n}
                      <span className="bo-prj-unter block font-normal">{n === 4 ? "nach Gemeinkosten" : `nach ${STUFE_LABEL[`DB${n}`]}`}{ziel[`ziel_db${n}`] ? ` · ${K.ziel(ziel[`ziel_db${n}`])}` : ""}</span>
                    </th>
                    <td data-zahl>{prozentText(k.stufen_ist?.[`db${n}_prozent`])}</td>
                    <td data-zahl>{prozentText(k.stufen_prognose?.[`db${n}_prozent`])}</td>
                    <td data-zahl>{n === 4 ? "–" : prozentText(k.stufen_budget?.[`db${n}_prozent`])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kachel>
        <div className="md:col-span-7">
          {punkte.length ? <Balken titel={K.wochen} untertitel={K.wochenUnter} punkte={punkte} format="zahl" hervorheben={punkte.length - 1} hoehe={180} einblenden /> : <Kachel titel={K.wochen}><Leer groesse="karte" titel={K.belegeLeer} /></Kachel>}
        </div>
      </Bento>
      <Kachel titel={K.kostenart} unter={`${(k.kostenarten || []).length} Kostenarten`} testid="kalk-kostenarten">
        <div className="-mx-3 overflow-x-auto">
          <table className="bo-prj-tab bo-prj-kalk">
            <thead>
              <tr>
                <th scope="col">{K.kostenart}</th>
                <th scope="col" data-zahl>{K.budget}</th>
                <th scope="col" data-zahl>{K.ist}</th>
                <th scope="col" data-zahl>{K.obligo}</th>
                <th scope="col" data-zahl>{K.rest}</th>
                <th scope="col" data-zahl>{K.prognose}</th>
                <th scope="col" data-zahl>{K.abweichung}</th>
                <th scope="col">Ampel</th>
              </tr>
            </thead>
            <tbody>
              {(k.kostenarten || []).map((z) => (
                <tr key={z.kostenart}>
                  <td>
                    <span className="bo-prj-titel">{z.bezeichnung}</span>
                    <span className="bo-prj-unter block">{z.db_stufe}{z.rest_manuell ? ` · Rest ${K.manuell}` : ""}</span>
                  </td>
                  <td data-zahl>{euroRund(z.budget_cent)}</td>
                  <td data-zahl>{euroRund(z.ist_cent)}</td>
                  <td data-zahl>{euroRund(z.obligo_cent)}</td>
                  <td data-zahl>{euroRund(z.rest_cent)}</td>
                  <td data-zahl>{euroRund(z.prognose_cent)}</td>
                  <td data-zahl className={z.abweichung_cent > 0 ? "text-bo-warning-text" : undefined}>{z.abweichung_cent > 0 ? "+" : ""}{euroRund(z.abweichung_cent)}</td>
                  <td><Ampel wert={z.ampel} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Summe</td>
                <td data-zahl>{euroRund(k.summe?.budget_cent)}</td>
                <td data-zahl>{euroRund(k.summe?.ist_cent)}</td>
                <td data-zahl>{euroRund(k.summe?.obligo_cent)}</td>
                <td data-zahl>{euroRund(k.summe?.rest_cent)}</td>
                <td data-zahl>{euroRund(k.summe?.prognose_cent)}</td>
                <td data-zahl>{(k.summe?.abweichung_cent || 0) > 0 ? "+" : ""}{euroRund(k.summe?.abweichung_cent)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Kachel>
      <Kachel titel={K.belege} unter={K.belegeUnter} testid="kalk-belege">
        {(k.quellen || []).length ? (
          <ul className="bo-prj-liste">
            {k.quellen.slice(0, 20).map((q, i) => (
              <li key={`${q.quelle_name}-${i}`}>
                <span className="bo-prj-liste__ico" data-ton={q.typ === "ist" ? "cognac" : "eiche"} aria-hidden="true">{q.typ === "ist" ? "I" : "O"}</span>
                <span className="min-w-0 flex-1">
                  <span className="bo-prj-titel block truncate text-[15px] leading-5">{q.text || q.quelle_name}</span>
                  <span className="bo-prj-unter block">{q.typ === "ist" ? K.ist : K.obligo} · {q.kostenart} · {q.quelle_name}{q.datum ? ` · ${datumKurz(q.datum, { jahr: true })}` : ""}</span>
                </span>
                <span className="tabular-nums text-[15px]">{euroRund(q.betrag_cent)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Leer groesse="karte" titel={K.belegeLeer} />
        )}
        {(k.hinweise || []).length > 0 && (
          <div className="mt-5 rounded-[16px] bg-bo-surface-2 px-4 py-3 text-[13px] leading-[18px] text-bo-text-soft">
            <p className="font-medium text-bo-text">{K.hinweise}</p>
            <ul className="mt-1 list-disc pl-5">
              {k.hinweise.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </Kachel>
    </div>
  );
}
