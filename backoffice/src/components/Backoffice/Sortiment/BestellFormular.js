"use client";
// Bestellung erfassen (§ 3.7): Lieferant, Kommission, Wunschtermin, Lieferadresse, Positionen (Produkt aus dem
// Sortiment des Lieferanten oder Freitext), Mengen nur ganzzahlig (Q-D6), EK nur Leitung. „Anlegen“ legt den
// Entwurf an und öffnet die Bestellakte – Senden ist ein eigener, bewusster Schritt.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Knopf from "../Knopf";
import Datumsfeld from "../Formular/Datumsfeld";
import BetragFeld from "../Eingabe/BetragFeld";
import { ProduktBild } from "./Bausteine";
import useAktion from "./useAktion";
import { bestellungAnlegenAction } from "@/lib/backoffice/sortiment/actions";
import { GLOSSAR } from "@/lib/backoffice/sortiment/texte";

const LEER = { produkt: "", bezeichnung: "", hersteller_artikelnr: "", ausfuehrung_text: "", menge: 1, ek_cent: null };

/** @param {{lieferanten:object[], produkte:object[], leitung:boolean, vorbelegt?:string}} p */
export default function BestellFormular({ lieferanten, produkte, leitung, vorbelegt = "" }) {
  const router = useRouter();
  const { sofort, laeuft } = useAktion();
  const [kopf, setKopf] = useState({ lieferant: vorbelegt, kommission: "", wunschtermin: "", lieferadresse: "Lager", notizen_lieferant: "" });
  const [zeilen, setZeilen] = useState([{ ...LEER }]);
  const [fehler, setFehler] = useState("");
  const lf = lieferanten.find((l) => l.name === kopf.lieferant);
  const auswahl = useMemo(() => produkte.filter((p) => !lf?.marke || p.marke === lf.marke), [produkte, lf]);

  const setze = (i, feld, wert) => setZeilen((z) => z.map((x, j) => (j === i ? { ...x, [feld]: wert } : x)));
  const waehleProdukt = (i, name) => {
    const p = produkte.find((x) => x.name === name);
    setZeilen((z) => z.map((x, j) => (j === i ? { ...x, produkt: name, bezeichnung: p?.titel || x.bezeichnung, hersteller_artikelnr: p?.hersteller_artikelnr || "" } : x)));
  };

  const anlegen = async () => {
    if (!kopf.lieferant) {
      setFehler("Lieferant wählen.");
      return;
    }
    if (zeilen.some((z) => z.menge !== "" && !/^\d+$/.test(String(z.menge)))) {
      setFehler("Mengen nur ganzzahlig – „3,6“ geht nicht.");
      return;
    }
    if (!zeilen.some((z) => z.bezeichnung.trim() && Number(z.menge) > 0)) {
      setFehler("Mindestens eine Position mit Bezeichnung und Menge angeben.");
      return;
    }
    setFehler("");
    const r = await sofort(() => bestellungAnlegenAction({ ...kopf, positionen: zeilen }), { ok: (x) => `Bestellentwurf ${x.name} angelegt`, neuLaden: false });
    if (r?.ok) router.push(`/sortiment/bestellungen/${encodeURIComponent(r.name)}`);
  };

  return (
    <div className="flex flex-col gap-(--bo-bento-gap)" data-testid="bestell-formular">
      <section className="bo-kachel">
        <h2 className="bo-titel-kachel">Kopf</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="bo-sor-feld">
            <label htmlFor="bf-lf">Lieferant</label>
            <select id="bf-lf" className="bo-sor-eingabe" value={kopf.lieferant} onChange={(e) => setKopf((k) => ({ ...k, lieferant: e.target.value }))}>
              <option value="">Bitte wählen</option>
              {lieferanten.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
            {lf && <span className="bo-sor-feld__hinweis">{`${GLOSSAR.bestellweg[lf.bestellweg] || "Bestellweg offen"}${lf.bestell_email ? "" : " · Bestell-E-Mail fehlt"}`}</span>}
          </div>
          <div className="bo-sor-feld">
            <label htmlFor="bf-ko">Kommission</label>
            <input id="bf-ko" className="bo-sor-eingabe" value={kopf.kommission} onChange={(e) => setKopf((k) => ({ ...k, kommission: e.target.value }))} placeholder="Auftrag oder Lager" />
          </div>
          <div className="bo-sor-feld">
            <span>Wunschtermin</span>
            <Datumsfeld value={kopf.wunschtermin} onChange={(v) => setKopf((k) => ({ ...k, wunschtermin: v }))} aria-label="Wunschtermin" />
          </div>
          <div className="bo-sor-feld">
            <label htmlFor="bf-la">Lieferadresse</label>
            <select id="bf-la" className="bo-sor-eingabe" value={kopf.lieferadresse} onChange={(e) => setKopf((k) => ({ ...k, lieferadresse: e.target.value }))}>
              {Object.entries(GLOSSAR.lieferadresse).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bo-kachel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="bo-titel-kachel">Positionen</h2>
          <Knopf size="s" variant="secondary" icon="Plus" onClick={() => setZeilen((z) => [...z, { ...LEER }])}>
            Position
          </Knopf>
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {zeilen.map((z, i) => {
            const p = produkte.find((x) => x.name === z.produkt);
            return (
              <li key={i} className="grid grid-cols-1 items-end gap-3 rounded-[20px] bg-bo-surface-2 p-4 md:grid-cols-[48px_minmax(0,2fr)_minmax(0,1fr)_96px_minmax(0,1fr)_44px]">
                <ProduktBild src={p?.bild_hauptbild || ""} alt="" groesse={48} className="max-md:hidden" />
                <div className="bo-sor-feld">
                  <label htmlFor={`bf-p-${i}`}>Produkt</label>
                  <select id={`bf-p-${i}`} className="bo-sor-eingabe bo-sor-eingabe--klein" value={z.produkt} onChange={(e) => waehleProdukt(i, e.target.value)}>
                    <option value="">Freitext</option>
                    {auswahl.map((x) => (
                      <option key={x.name} value={x.name}>
                        {x.marke} · {x.titel}
                      </option>
                    ))}
                  </select>
                  {!z.produkt && <input aria-label={`Bezeichnung Position ${i + 1}`} className="bo-sor-eingabe bo-sor-eingabe--klein" value={z.bezeichnung} onChange={(e) => setze(i, "bezeichnung", e.target.value)} placeholder="Bezeichnung" />}
                </div>
                <div className="bo-sor-feld">
                  <label htmlFor={`bf-a-${i}`}>Ausführung</label>
                  <input id={`bf-a-${i}`} className="bo-sor-eingabe bo-sor-eingabe--klein" value={z.ausfuehrung_text} onChange={(e) => setze(i, "ausfuehrung_text", e.target.value)} />
                </div>
                <div className="bo-sor-feld">
                  <label htmlFor={`bf-m-${i}`}>Menge</label>
                  <input id={`bf-m-${i}`} inputMode="numeric" className="bo-sor-eingabe bo-sor-eingabe--klein" value={z.menge} onChange={(e) => setze(i, "menge", e.target.value)} />
                </div>
                {leitung ? (
                  <div className="bo-sor-feld">
                    <label htmlFor={`bf-ek-${i}`}>EK netto</label>
                    <BetragFeld id={`bf-ek-${i}`} value={z.ek_cent} onChange={(c) => setze(i, "ek_cent", c)} />
                  </div>
                ) : (
                  <span className="bo-sor-klein self-center">EK erfasst die Leitung</span>
                )}
                <button type="button" className="bo-rund bo-rund--s bo-tip self-center" data-tip="Position entfernen" aria-label={`Position ${i + 1} entfernen`} disabled={zeilen.length === 1} onClick={() => setZeilen((x) => x.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
        {fehler && (
          <p className="bo-sor-feld__fehler mt-3" role="alert">
            {fehler}
          </p>
        )}
      </section>

      <div className="bo-material-stark sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-full px-5 py-2.5 shadow-(--bo-sh-float)">
        <span className="bo-sor-unter tabular-nums">
          {zeilen.length} Positionen · {zeilen.reduce((a, z) => a + (Number(z.menge) || 0), 0)} Stück
        </span>
        <span className="flex gap-2">
          <Knopf variant="ghost" href="/sortiment/bestellungen">
            Abbrechen
          </Knopf>
          <Knopf variant="primary" laedt={laeuft} onClick={anlegen} data-testid="bestellung-anlegen">
            Entwurf anlegen
          </Knopf>
        </span>
      </div>
    </div>
  );
}
