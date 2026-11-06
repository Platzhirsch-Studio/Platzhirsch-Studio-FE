"use client";
// A11 Schritt 1 „Rahmen“ (§ 5.8): Marke, Lieferant, Preisart, Stand (Datum der Liste, nicht heute), Quelle, Datei.
// Das Einlesen der Datei macht der Server (datei_einlesen); danach folgt der Abgleich im Lauf.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import Datumsfeld from "../Formular/Datumsfeld";
import useAktion from "./useAktion";
import { preislisteAnlegenAction } from "@/lib/backoffice/sortiment/actions";
import { GLOSSAR, PREISLISTEN } from "@/lib/backoffice/sortiment/texte";

export default function PreislisteNeu({ marken, lieferanten, preisbasisVorhanden }) {
  const router = useRouter();
  const { sofort, laeuft } = useAktion();
  const [w, setW] = useState({ marke: "", lieferant: "", preisart: "UVP", stand: "", quelle: "" });
  const [fehler, setFehler] = useState({});
  const setze = (k) => (e) => setW((x) => ({ ...x, [k]: e.target.value }));
  const anlegen = async () => {
    const r = await sofort(() => preislisteAnlegenAction(w), { ok: (x) => PREISLISTEN.angelegt(x.name), neuLaden: false });
    if (r?.ok) router.push(`/sortiment/preislisten/${encodeURIComponent(r.name)}`);
    else if (r?.fehler) setFehler(r.fehler);
  };
  return (
    <section className="bo-kachel" data-testid="preisliste-neu">
      <h2 className="bo-titel-kachel">{PREISLISTEN.rahmen}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bo-sor-feld">
          <label htmlFor="pl-m">Marke *</label>
          <select id="pl-m" className="bo-sor-eingabe" value={w.marke} onChange={(e) => setW((x) => ({ ...x, marke: e.target.value, lieferant: marken.find((m) => m.name === e.target.value)?.lieferant || x.lieferant }))} aria-invalid={fehler.marke ? "true" : undefined}>
            <option value="">Bitte wählen</option>
            {marken.map((m) => (
              <option key={m.name}>{m.name}</option>
            ))}
          </select>
          {fehler.marke && <span className="bo-sor-feld__fehler">{fehler.marke}</span>}
        </div>
        <div className="bo-sor-feld">
          <label htmlFor="pl-l">Lieferant</label>
          <select id="pl-l" className="bo-sor-eingabe" value={w.lieferant} onChange={setze("lieferant")}>
            <option value="">–</option>
            {lieferanten.map((l) => (
              <option key={l.name}>{l.name}</option>
            ))}
          </select>
        </div>
        <div className="bo-sor-feld">
          <label htmlFor="pl-a">Preisart *</label>
          <select id="pl-a" className="bo-sor-eingabe" value={w.preisart} onChange={setze("preisart")}>
            {["Verkaufspreis", "UVP", "Herstellerpreis", "Einkaufspreis"].map((a) => (
              <option key={a} value={a}>
                {GLOSSAR.preisart[a]}
              </option>
            ))}
          </select>
          {w.preisart === "UVP" && <span className="bo-sor-feld__hinweis">{preisbasisVorhanden ? "Preisbasis angeben." : "Eine UVP gilt nur als österreichische Herstellerempfehlung inkl. 20 % USt. Die Preisbasis kann die App noch nicht speichern – deutsche Listen als Herstellerpreis einlesen."}</span>}
        </div>
        <div className="bo-sor-feld">
          <span>Stand der Liste *</span>
          <Datumsfeld value={w.stand} onChange={(v) => setW((x) => ({ ...x, stand: v }))} aria-label="Stand der Liste" invalid={!!fehler.stand} />
          {fehler.stand && <span className="bo-sor-feld__fehler">{fehler.stand}</span>}
        </div>
        <div className="bo-sor-feld md:col-span-2">
          <label htmlFor="pl-q">Quelle (Adresse oder Text)</label>
          <input id="pl-q" className="bo-sor-eingabe" value={w.quelle} onChange={setze("quelle")} />
        </div>
        <div className="bo-sor-feld md:col-span-2">
          <label htmlFor="pl-d">{PREISLISTEN.datei}</label>
          <input id="pl-d" type="file" accept=".csv,.txt,.xml,.dat" className="bo-sor-eingabe pt-2.5 text-[13px]" />
          <span className="bo-sor-feld__hinweis">{PREISLISTEN.dateiHinweis}</span>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Knopf variant="ghost" href="/sortiment/preislisten">
          Abbrechen
        </Knopf>
        <Knopf variant="primary" laedt={laeuft} onClick={anlegen}>
          {PREISLISTEN.anlegen}
        </Knopf>
      </div>
    </section>
  );
}
