"use client";
// Teil- und Schlussrechnung in Schritten (§ 5.9/§ 5.10): Mengen (gedeckelt auf geliefert − abgerechnet, „Alles
// Gelieferte“) bzw. offene Mengen → Anzahlungen (nur vereinnahmte werden abgezogen, sonst blockiert) → Prüfen und
// Stellen über den Stellen-Dialog. ⌘↵ = Weiter, Enter wirkt nur im Feld. Die Vorschau legt einen Entwurf an.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Kachel from "../Kachel";
import Segment from "../Segment";
import { useToast } from "../Toast";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { cent } from "@/lib/backoffice/format";
import { vereinnahmteAnzahlungen } from "@/lib/backoffice/faktura/betraege";
import { AUFTRAG, AKTION } from "@/lib/backoffice/faktura/texte";
import { abrechnenEntwurfAction } from "@/lib/backoffice/faktura/actions";
import { useFaktura } from "./Aktionen";
import { Hinweis } from "./teile";
import { useVorgang } from "./hilfen";

export default function AbrechnenAblauf({ auftrag, art, anzahlungen = [], leitung = false, restAufloesen = false, email = "" }) {
  const router = useRouter();
  const { zeige } = useToast();
  const { ausfuehren } = useFaktura();
  const schluss = art === "schluss";
  const positionen = (auftrag.positionen || []).filter((p) => !p.alternativ && p.art !== "Text");
  const [schritt, setSchritt] = useState(0);
  const [mengen, setMengen] = useState(() => Object.fromEntries(positionen.map((p) => [p.pos, schluss ? Number(p.menge) - (Number(p.rechnung_menge) || 0) : 0])));
  const v = useVorgang();
  const v2 = vereinnahmteAnzahlungen(anzahlungen);
  const nichtGeliefert = positionen.filter((p) => (Number(p.lieferschein_menge) || 0) < Number(p.menge)).length;
  const blockiert = schluss && v2.blockiert.length > 0;
  const netto = useMemo(() => positionen.reduce((s, p) => s + Math.round((mengen[p.pos] || 0) * p.einzel_netto_cent * (1 - (Number(p.rabatt_promille) || 0) / 1000)), 0), [mengen, positionen]);
  const brutto = Math.round(netto * 1.2);
  const schritte = schluss ? ["Offene Mengen", AUFTRAG.anzahlungen, AUFTRAG.pruefen] : [AUFTRAG.mengen, AUFTRAG.pruefen];

  async function anlegen(stellen) {
    await v.start(async () => {
      const r = await abrechnenEntwurfAction({ auftrag: auftrag.name, art: schluss ? "Schlussrechnung" : "Teilrechnung", mengen });
      if (!r.ok) return zeige(r.message, { art: "fehler" });
      if (!stellen) {
        zeige(`Entwurf ${r.rechnung} angelegt`, { art: "ok", aktion: { titel: "Öffnen", onClick: () => router.push(`/faktura/rechnungen/${encodeURIComponent(r.rechnung)}`) } });
        return router.push(`/faktura/rechnungen/${encodeURIComponent(r.rechnung)}`);
      }
      ausfuehren("stellen", { doctype: "PH Rechnung", name: r.rechnung, daten: { art: schluss ? "Schlussrechnung" : "Teilrechnung", auftrag: auftrag.name, brutto_cent: brutto, zahlbar_cent: schluss ? brutto - v2.abzug_brutto_cent : brutto, kunde: auftrag.kunde_name, adresse: [auftrag.kunde_name, auftrag.strasse, [auftrag.plz, auftrag.ort].join(" ")].filter(Boolean).join(", "), email, leistungsdatum: auftrag.liefertermin_bestaetigt || "", leistung_quelle: auftrag.liefertermin_bestaetigt ? "Lieferschein (Zustellung)" : "", zahlungsziel_tage: 14 } });
    });
  }
  const weiter = () => {
    if (schritt < schritte.length - 1 && !(schluss && schritt === 1 && blockiert)) setSchritt(schritt + 1);
  };
  useKuerzel("akte", { "akte.primaer": () => (schritt === schritte.length - 1 ? anlegen(true) : weiter()) });

  return (
    <div className="flex flex-col gap-4 xl:gap-6" data-testid="abrechnen-ablauf">
      <Segment label="Schritte" wert={schritt} onWechsel={(x) => x <= schritt && setSchritt(x)} optionen={schritte.map((t, i) => ({ wert: i, titel: `${i + 1} ${t}`, deaktiviert: i > schritt }))} />
      {schritt === 0 && (
        <Kachel titel={schluss ? "Offene Mengen" : AUFTRAG.mengen} unter={schluss && nichtGeliefert ? AUFTRAG.nichtGeliefert(nichtGeliefert) : !schluss ? AUFTRAG.etappen : undefined} werkzeuge={!schluss && <Knopf size="s" variant="secondary" onClick={() => setMengen(Object.fromEntries(positionen.map((p) => [p.pos, Math.max((Number(p.lieferschein_menge) || 0) - (Number(p.rechnung_menge) || 0), 0)])))} data-testid="alles-geliefert">{AKTION.allesGelieferte}</Knopf>}>
          <div className="bo-scroll-x overflow-x-auto">
            <table className="bo-fk-pos min-w-[640px]">
              <thead>
                <tr>
                  <th>Position</th>
                  <th className="text-right">Menge</th>
                  <th className="text-right">{AUFTRAG.geliefert}</th>
                  <th className="text-right">{AUFTRAG.abgerechnet}</th>
                  <th className="w-36 text-right">{AUFTRAG.jetzt}</th>
                </tr>
              </thead>
              <tbody>
                {positionen.map((p) => {
                  const max = schluss ? Number(p.menge) - (Number(p.rechnung_menge) || 0) : Math.max((Number(p.lieferschein_menge) || 0) - (Number(p.rechnung_menge) || 0), 0);
                  return (
                    <tr key={p.pos}>
                      <td className="min-w-56">{p.bezeichnung}</td>
                      <td className="text-right tabular-nums">{p.menge}</td>
                      <td className="text-right tabular-nums">{Number(p.lieferschein_menge) || 0}</td>
                      <td className="text-right tabular-nums">{Number(p.rechnung_menge) || 0}</td>
                      <td>
                        <input className="bo-fk-feld text-right tabular-nums" inputMode="numeric" aria-label={`${AUFTRAG.jetzt} ${p.bezeichnung}`} disabled={schluss} value={mengen[p.pos] ?? 0} onChange={(e) => setMengen((m) => ({ ...m, [p.pos]: Math.min(Math.max(Math.floor(Number(e.target.value) || 0), 0), max) }))} />
                        <span className="mt-1 block text-right text-[11px] text-bo-text-faint">{AUFTRAG.gedeckelt(max)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Kachel>
      )}
      {schluss && schritt === 1 && (
        <Kachel titel={AUFTRAG.anzahlungen} unter="Abgezogen wird nur der vereinnahmte Betrag">
          <ul className="flex flex-col gap-2 text-[14px]" data-testid="anzahlungen">
            {anzahlungen.map((x) => (
              <li key={x.name} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 rounded-bo-zeile bg-bo-surface-2 px-3.5 py-2.5 tabular-nums">
                <span>{x.name}</span>
                <span>gestellt {cent(x.brutto_cent)}</span>
                <span className="font-medium">vereinnahmt {cent(Math.min(x.bezahlt_cent, x.brutto_cent))}</span>
              </li>
            ))}
            {!anzahlungen.length && <li className="text-bo-text-soft">Keine Anzahlungsrechnung zu diesem Auftrag.</li>}
          </ul>
          {blockiert && (
            <Hinweis ton="gefahr" className="mt-3" testid="anzahlung-blockiert" aktion={restAufloesen && leitung ? <Knopf size="s" variant="secondary">{AUFTRAG.restAufloesen}</Knopf> : <Knopf size="s" variant="ghost" href={`/faktura/rechnungen/${encodeURIComponent(v2.blockiert[0].name)}`}>Rechnung öffnen</Knopf>}>
              {AUFTRAG.anzahlungBlock(v2.blockiert[0].name, cent(v2.blockiert[0].bezahlt_cent))}
            </Hinweis>
          )}
        </Kachel>
      )}
      {schritt === schritte.length - 1 && (
        <Kachel titel={AUFTRAG.pruefen}>
          <dl className="bo-fk-summen">
            <dt>Netto</dt>
            <dd>{cent(netto)}</dd>
            <dt>USt 20 %</dt>
            <dd>{cent(brutto - netto)}</dd>
            <dt data-stark="">Brutto</dt>
            <dd data-stark="">{cent(brutto)}</dd>
            {schluss && (
              <>
                <dt>abzüglich vereinnahmter Anzahlungen</dt>
                <dd>−{cent(v2.abzug_brutto_cent)}</dd>
                <dt data-stark="">Zahlbar</dt>
                <dd data-stark="">{cent(brutto - v2.abzug_brutto_cent)}</dd>
              </>
            )}
          </dl>
        </Kachel>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {schritt > 0 && (
          <Knopf variant="ghost" onClick={() => setSchritt(schritt - 1)}>
            {AKTION.zurueck}
          </Knopf>
        )}
        {schritt === schritte.length - 1 ? (
          <>
            <Knopf variant="secondary" onClick={() => anlegen(false)} disabled={v.laeuft || !netto}>
              {AKTION.alsEntwurf}
            </Knopf>
            <Knopf variant="primary" onClick={() => anlegen(true)} laedt={v.zeigen} disabled={v.laeuft || !netto} kuerzel="⌘↵" data-testid="abrechnen-stellen">
              {AKTION.anlegenUndStellen}
            </Knopf>
          </>
        ) : (
          <Knopf variant="primary" onClick={weiter} disabled={(schluss && schritt === 1 && blockiert) || (!schluss && !netto)} grund={schluss && schritt === 1 && blockiert ? "Schlussrechnung erst nach Zahlung der Anzahlung" : !schluss && !netto ? "Keine Menge zum Abrechnen" : null} kuerzel="⌘↵" data-testid="abrechnen-weiter">
            {AKTION.weiter}
          </Knopf>
        )}
      </div>
    </div>
  );
}
