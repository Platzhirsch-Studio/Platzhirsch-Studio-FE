"use client";
// Kostenzuordnung einer Eingangsrechnung (Projektnachkalkulation, Inhaber 04.11.2026): Modus Ganz · Positionen ·
// Anteilig · Gemeinkosten, Zeilen mit Projekt/Kostenart/Prozent oder Betrag, Rundungsrest auf die größte Zeile
// (gleiches Rechenwerk wie der Server), Summe/Differenz live, Vorschlag aus dem Bezug, Budget-Hinweis je
// Projekt/Kostenart (Warnung, blockiert nie). Vor der Freigabe „Speichern“, danach nur „Umbuchen“ (Leitung, Grund).

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Segment from "../Segment";
import { Pille } from "../StatusBadge";
import { Dialog } from "../Overlay";
import BetragFeld from "../Eingabe/BetragFeld";
import { useToast } from "../Toast";
import { cent } from "@/lib/backoffice/format";
import * as KZ from "@/lib/backoffice/faktura/kostenzuordnung";
import { KOSTEN, AKTION } from "@/lib/backoffice/faktura/texte";
import { kostenSpeichernAction, kostenVorschlagAction } from "@/lib/backoffice/faktura/actions";
import { Feld, Hinweis } from "./teile";
import { useVorgang } from "./hilfen";

const leer = () => ({ projekt: "", kostenart: "", prozent: 0, betrag_cent: 0, bemerkung: "" });

export default function Kostenzuordnung({ er, projekte = [], budgets = {}, rolle = {}, umbuchenFaehig = true }) {
  const router = useRouter();
  const { zeige } = useToast();
  const nachFreigabe = ["Freigegeben", "Bezahlt"].includes(er.status);
  const gesperrt = nachFreigabe && (!rolle.leitung || !umbuchenFaehig);
  const [modus, setModus] = useState(er.zuordnung_modus || "Ganz einem Projekt");
  const [zeilen, setZeilen] = useState(() => (er.zuordnung?.length ? er.zuordnung.map((z) => ({ ...z })) : [{ ...leer(), projekt: er.projekt || "", kostenart: er.kostenart || "" }]));
  const [prozentModus, setProzentModus] = useState(() => (er.zuordnung || []).some((z) => Number(z.prozent) > 0));
  const [frage, setFrage] = useState(false);
  const [grund, setGrund] = useState("");
  const [fehler, setFehler] = useState(null);
  const v = useVorgang();

  const r = useMemo(() => KZ.berechne({ modus, netto_cent: er.netto_cent, zeilen: modus === "Aliquot" && !prozentModus ? zeilen.map((z) => ({ ...z, prozent: 0 })) : zeilen, positionen: er.positionen || [], projekt: er.projekt, kostenart: er.kostenart }), [modus, zeilen, er, prozentModus]);
  const hinweise = useMemo(() => KZ.budgetHinweise(r.zeilen, budgets, {}, er.belegart), [r.zeilen, budgets, er.belegart]);
  const titelProjekt = Object.fromEntries(projekte.map((p) => [p.wert, p.titel]));
  const setz = (i, f, x) => setZeilen((zz) => zz.map((z, j) => (j === i ? { ...z, [f]: x } : z)));
  const anzeigeZeilen = modus === "Nach Positionen" ? r.zeilen : zeilen;

  async function speichern(mitGrund) {
    await v.start(async () => {
      const res = await kostenSpeichernAction({ name: er.name, modus, zeilen: modus === "Nach Positionen" ? r.zeilen : modus === "Aliquot" && !prozentModus ? zeilen.map((z) => ({ ...z, prozent: 0 })) : zeilen, grund: mitGrund ? grund : undefined });
      if (!res.ok) return setFehler(res.message);
      setFehler(null);
      setFrage(false);
      zeige(nachFreigabe ? KOSTEN.umbuchenFertig(er.name) : KOSTEN.gespeichert, { art: "ok" });
      router.refresh();
    });
  }
  async function vorschlag() {
    const res = await kostenVorschlagAction({ name: er.name });
    if (!res.ok || !res.zeilen?.length) return zeige("Kein Vorschlag aus dem Bezug – bitte von Hand zuordnen.", { art: "info" });
    if (res.modus) setModus(res.modus);
    setZeilen(res.zeilen.map((z) => ({ ...leer(), ...z })));
  }

  const statusMat = r.status === "Vollstaendig" ? "salbei" : r.status === "Gemeinkosten" ? "stein" : "eiche";
  return (
    <div className="flex flex-col gap-4" data-testid="kostenzuordnung">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segment label={KOSTEN.modus} wert={modus} onWechsel={(m) => !gesperrt && setModus(m)} optionen={KOSTEN.modi.map((m) => ({ wert: m.wert, titel: m.titel, deaktiviert: gesperrt }))} testid="kosten-modus" />
        <span className="flex items-center gap-2">
          <Pille material={statusMat} testid="kosten-status">{KOSTEN.status[r.status]}</Pille>
          {!gesperrt && !nachFreigabe && (
            <Knopf size="s" variant="ghost" icon="Sparkles" onClick={vorschlag}>
              {KOSTEN.vorschlag}
            </Knopf>
          )}
        </span>
      </div>
      <p className="text-[13px] text-bo-text-soft">{KOSTEN.modi.find((m) => m.wert === modus)?.text} Netto {cent(er.netto_cent)}.</p>

      {modus !== "Gemeinkosten" && (
        <div className="flex flex-col gap-2">
          {anzeigeZeilen.map((z, i) => (
            <div key={i} className="bo-fk-kosten-zeile rounded-bo-zeile bg-bo-surface-2 p-2.5" data-testid="kosten-zeile">
              {modus === "Nach Positionen" ? (
                <span className="min-w-0 truncate px-1 text-[14px]">
                  Pos. {z.belegposition} · {z.bemerkung}
                </span>
              ) : null}
              <select className="bo-fk-feld" aria-label={`${KOSTEN.projekt} Zeile ${i + 1}`} disabled={gesperrt} value={z.projekt || ""} aria-invalid={!z.projekt || undefined} onChange={(e) => (modus === "Nach Positionen" ? setZeilen(r.zeilen.map((x, j) => (j === i ? { ...x, projekt: e.target.value } : x))) : setz(i, "projekt", e.target.value))}>
                <option value="">{KOSTEN.projekt} wählen …</option>
                {projekte.map((p) => (
                  <option key={p.wert} value={p.wert}>
                    {p.titel} · {p.wert}
                  </option>
                ))}
              </select>
              <select className="bo-fk-feld" aria-label={`${KOSTEN.kostenart} Zeile ${i + 1}`} disabled={gesperrt} value={z.kostenart || ""} aria-invalid={!z.kostenart || undefined} onChange={(e) => (modus === "Nach Positionen" ? setZeilen(r.zeilen.map((x, j) => (j === i ? { ...x, kostenart: e.target.value } : x))) : setz(i, "kostenart", e.target.value))}>
                <option value="">{KOSTEN.kostenart} …</option>
                {KOSTEN.kostenarten.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              {modus === "Aliquot" && prozentModus ? (
                <input className="bo-fk-feld text-right tabular-nums" inputMode="decimal" aria-label={`${KOSTEN.prozent} Zeile ${i + 1}`} disabled={gesperrt} value={z.prozent || ""} onChange={(e) => setz(i, "prozent", Number(e.target.value.replace(",", ".")) || 0)} />
              ) : modus !== "Nach Positionen" ? (
                <span className="text-right text-[13px] tabular-nums text-bo-text-faint">{er.netto_cent ? `${Math.round(((r.zeilen[i]?.betrag_cent || 0) * 1000) / er.netto_cent) / 10} %` : "–"}</span>
              ) : null}
              {modus === "Aliquot" && !prozentModus ? (
                <BetragFeld aria-label={`${KOSTEN.betrag} Zeile ${i + 1}`} disabled={gesperrt} value={z.betrag_cent} onChange={(c) => setz(i, "betrag_cent", c || 0)} />
              ) : (
                <span className="text-right text-[14px] font-medium tabular-nums">{cent(r.zeilen[i]?.betrag_cent ?? z.betrag_cent)}</span>
              )}
              {modus === "Aliquot" && !gesperrt ? <Knopf size="s" variant="ghost" icon="Trash2" label={KOSTEN.zeileEntfernen} onClick={() => setZeilen((zz) => zz.filter((_, j) => j !== i))} disabled={zeilen.length < 2} /> : <span />}
            </div>
          ))}
          {modus === "Aliquot" && !gesperrt && (
            <div className="flex flex-wrap items-center gap-2">
              <Knopf size="s" variant="secondary" icon="Plus" onClick={() => setZeilen((zz) => [...zz, leer()])} data-testid="kosten-zeile-hinzu">
                {KOSTEN.zeileHinzu}
              </Knopf>
              <Segment groesse="s" label="Aufteilen nach" wert={prozentModus ? "prozent" : "betrag"} onWechsel={(x) => setProzentModus(x === "prozent")} optionen={[{ wert: "prozent", titel: KOSTEN.prozent }, { wert: "betrag", titel: KOSTEN.betrag }]} />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-bo-karte bg-bo-surface-2 px-3.5 py-3 text-[14px] tabular-nums" data-testid="kosten-summe">
        <span>
          {KOSTEN.summe} <strong className="font-semibold">{cent(r.summe_cent)}</strong> von {cent(er.netto_cent)}
        </span>
        <span className={r.differenz_cent === 0 ? "text-bo-salbei-text" : "text-bo-eiche-text"}>{r.differenz_cent === 0 ? KOSTEN.vollstaendig : r.differenz_cent > 0 ? KOSTEN.offen(cent(r.differenz_cent)) : KOSTEN.zuViel(cent(-r.differenz_cent))}</span>
      </div>
      {modus === "Aliquot" && prozentModus && <p className="text-[12px] text-bo-text-faint">{KOSTEN.rundung}</p>}
      {r.fehler.length > 0 && modus !== "Gemeinkosten" && (
        <ul className="flex flex-col gap-1" data-testid="kosten-fehler">
          {r.fehler.slice(0, 3).map((f) => (
            <li key={f} className="bo-fk-fehler mt-0">
              {f}
            </li>
          ))}
        </ul>
      )}

      {hinweise.length > 0 && (
        <section className="flex flex-col gap-1.5" data-testid="budget-hinweis">
          <h3 className="text-[13px] font-medium text-bo-text-soft">{KOSTEN.budgetTitel}</h3>
          {hinweise.map((h) => (
            <Hinweis key={`${h.projekt}${h.kostenart}`} ton={h.stufe === "rot" ? "gefahr" : h.stufe === "gelb" || h.stufe === "ohne" ? "warnung" : "ok"}>
              {h.stufe === "ohne" ? KOSTEN.budgetOhne(titelProjekt[h.projekt] || h.projektTitel) : h.stufe === "rot" ? KOSTEN.budgetUeber(titelProjekt[h.projekt] || h.projektTitel, h.kostenart, cent(h.gebunden_cent - h.budget_cent)) : KOSTEN.budget(titelProjekt[h.projekt] || h.projektTitel, h.kostenart, cent(h.gebunden_cent), cent(h.budget_cent), h.prozent)}
            </Hinweis>
          ))}
        </section>
      )}
      {er.budget_hinweis && <Hinweis ton="warnung">{er.budget_hinweis}</Hinweis>}
      {fehler && <Hinweis ton="gefahr">{fehler}</Hinweis>}

      <div className="flex justify-end gap-2">
        {nachFreigabe ? (
          <Knopf variant="secondary" onClick={() => setFrage(true)} disabled={gesperrt || r.fehler.length > 0} grund={!rolle.leitung ? KOSTEN.nurLeitung : r.fehler.length ? KOSTEN.offen(cent(r.differenz_cent)) : null} data-testid="kosten-umbuchen">
            {AKTION.umbuchen}
          </Knopf>
        ) : (
          <Knopf variant="secondary" onClick={() => speichern(false)} laedt={v.zeigen} disabled={v.laeuft || (r.fehler.length > 0 && modus !== "Gemeinkosten")} data-testid="kosten-speichern">
            {AKTION.speichern}
          </Knopf>
        )}
      </div>

      <Dialog offen={frage} onSchliessen={() => setFrage(false)} groesse="sm" titel={KOSTEN.umbuchenTitel(er.name)} text={KOSTEN.umbuchenText} sperren={v.laeuft} fuss={<><Knopf variant="secondary" onClick={() => setFrage(false)}>{AKTION.abbrechen}</Knopf><Knopf variant="primary" onClick={() => speichern(true)} laedt={v.zeigen} disabled={!grund.trim()} data-testid="umbuchen-bestaetigen">{AKTION.umbuchen}</Knopf></>}>
        <Feld label={KOSTEN.umbuchenGrund} id="umb-grund">
          <textarea id="umb-grund" className="bo-fk-feld" rows={3} value={grund} onChange={(e) => setGrund(e.target.value)} />
        </Feld>
      </Dialog>
    </div>
  );
}
