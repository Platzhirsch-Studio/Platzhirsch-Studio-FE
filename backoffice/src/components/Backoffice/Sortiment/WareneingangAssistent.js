"use client";
// S3 Wareneingang buchen (§ 5.8; Büro und Packtisch-Kiosk): 1 Bestellung finden (Scan/Eingabe HB-…, erwartete
// Lieferungen als Kacheln) · 2 Kopf (Lieferschein, Spediteur, Packstücke) · 3 Positionen mit Stepper (Vorbelegung
// = Rest), Zustand-Chips mit Untertitel, Hinweis-Pflicht bei Schaden · 4 Zusammenfassung „bucht n Stück … Status
// danach …“ → Buchen. Doppelbuchung (gleicher Lieferschein) lehnt der Server ab („Schon gebucht als WE-…“).
// Kiosk: F2 Suchen, F6 Buchen, F8 Problem; Ziele 56/64 (data-dichte="kiosk").
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, ScanLine, Truck } from "lucide-react";
import Knopf from "../Knopf";
import ErgebnisKarte from "../Ergebnis/ErgebnisKarte";
import { ProduktBild, Status } from "./Bausteine";
import useAktion from "./useAktion";
import { useKuerzel } from "@/lib/backoffice/kuerzel/useKuerzel";
import { wareneingangAction } from "@/lib/backoffice/sortiment/actions";
import { restmengen, bestellstatusAusMengen } from "@/lib/backoffice/sortiment/regeln";
import { GLOSSAR, WARENEINGANG } from "@/lib/backoffice/sortiment/texte";
import { datum } from "@/lib/backoffice/format";

const ZUSTAENDE = ["ok", "Transportschaden", "beschaedigt", "falsch", "fehlt"];

/**
 * @param {{erwartet:object[], bestellung?:object|null, bilder?:Record<string,string>, kiosk?:boolean}} p
 *   bestellung: volle Bestellung (mit Positionen), wenn ?bestellung= gesetzt ist.
 */
export default function WareneingangAssistent({ erwartet = [], bestellung = null, bilder = {}, kiosk = false }) {
  const router = useRouter();
  const { sofort, laeuft } = useAktion();
  const suche = useRef(null);
  const [code, setCode] = useState("");
  const [kopf, setKopf] = useState({ lieferschein_nr_lieferant: "", spediteur: "", packstuecke: 1 });
  const rest = useMemo(() => (bestellung ? restmengen(bestellung) : []), [bestellung]);
  const [pos, setPos] = useState(() => Object.fromEntries(rest.map((r) => [r.idx, { menge_erhalten: r.rest, zustand: "ok", hinweis: "" }])));
  const [ergebnis, setErgebnis] = useState(null);
  const [fehlerCode, setFehlerCode] = useState("");

  const finde = (wert) => {
    const t = String(wert || "").trim().toUpperCase();
    if (!t) return;
    const treffer = erwartet.find((b) => b.name.toUpperCase() === t || (b.kommission || "").toUpperCase() === t || (b.ab_nummer || "").toUpperCase() === t);
    if (treffer || /^HB-\d{4}-\d{5}$/.test(t)) {
      setFehlerCode("");
      router.push(`${kiosk ? "/sortiment/wareneingang/kiosk" : "/sortiment/wareneingang/neu"}?bestellung=${encodeURIComponent(treffer?.name || t)}`);
    } else setFehlerCode(WARENEINGANG.unbekannt);
  };

  const summe = Object.values(pos).reduce((a, p) => a + (Number(p.menge_erhalten) || 0), 0);
  const nachher = useMemo(() => {
    if (!bestellung) return null;
    const neu = (bestellung.positionen || []).map((p, i) => ({ ...p, menge_erhalten: (Number(p.menge_erhalten) || 0) + (Number(pos[p.idx || i + 1]?.menge_erhalten) || 0) }));
    return bestellstatusAusMengen(neu);
  }, [bestellung, pos]);
  const fehlendeHinweise = rest.filter((r) => ["beschaedigt", "Transportschaden", "falsch"].includes(pos[r.idx]?.zustand) && !String(pos[r.idx]?.hinweis || "").trim());
  const sperre = !summe && !Object.values(pos).some((p) => p.zustand === "fehlt") ? WARENEINGANG.nichtsZuBuchen : fehlendeHinweise.length ? `${WARENEINGANG.hinweisPflicht} (Position ${fehlendeHinweise.map((r) => r.idx).join(", ")})` : null;

  const buchen = async () => {
    if (sperre || !bestellung) return;
    const r = await sofort(() => wareneingangAction({ bestellung: bestellung.name, ...kopf, positionen: Object.entries(pos).map(([idx, p]) => ({ idx: Number(idx), ...p })) }), { ok: (x) => WARENEINGANG.gebucht(x.name) });
    if (r?.ok) setErgebnis(r);
  };

  useKuerzel(kiosk ? "kiosk-packtisch@sortiment" : "akte@sortiment", {
    "sortiment.we-suchen": () => suche.current?.focus(),
    "sortiment.we-buchen": () => buchen(),
    "sortiment.akte-eingang": () => buchen(),
  });

  const setze = (idx, feld, wert) => setPos((alt) => ({ ...alt, [idx]: { ...alt[idx], [feld]: wert } }));

  if (ergebnis) {
    return (
      <ErgebnisKarte
        titel={WARENEINGANG.gebucht(ergebnis.name)}
        unter={`${bestellung.name} · ${GLOSSAR.weStatus[ergebnis.status] || ergebnis.status}`}
        zahl={{ titel: "Stück erhalten", text: String(summe) }}
        dokumente={[{ titel: ergebnis.name, info: "Wareneingang", href: `/sortiment/wareneingang/${encodeURIComponent(ergebnis.name)}`, icon: "PackageCheck" }]}
        weiter={{ titel: kiosk ? "Nächste Lieferung" : WARENEINGANG.bestellungOeffnen, href: kiosk ? "/sortiment/wareneingang/kiosk" : `/sortiment/bestellungen/${encodeURIComponent(bestellung.name)}` }}
      />
    );
  }

  if (!bestellung) {
    return (
      <div className="flex flex-col gap-(--bo-bento-gap)" data-testid="we-suchen">
        <section className="bo-kachel">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finde(code);
            }}
            className="flex flex-col gap-3"
          >
            <label htmlFor="we-code" className="bo-titel-kachel">
              {WARENEINGANG.bestellungWaehlen}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bo-suche bo-sor-suche !h-14 flex-1 !rounded-full" style={{ minWidth: 240 }}>
                <ScanLine className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <input ref={suche} id="we-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={WARENEINGANG.bestellungScan} autoComplete="off" data-scan="ja" className="!text-[17px]" autoFocus={kiosk} />
              </span>
              <Knopf variant="primary" type="submit" size={kiosk ? "kiosk" : "l"}>
                Öffnen
              </Knopf>
            </div>
            {fehlerCode && (
              <p className="bo-sor-feld__fehler" role="alert">
                {fehlerCode}
              </p>
            )}
          </form>
        </section>
        <section className="bo-kachel">
          <h2 className="bo-titel-kachel">{WARENEINGANG.erwartet}</h2>
          {erwartet.length === 0 ? (
            <p className="bo-sor-unter mt-2">{WARENEINGANG.erwartetLeer}</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {erwartet.map((b) => (
                <li key={b.name}>
                  <Link href={`${kiosk ? "/sortiment/wareneingang/kiosk" : "/sortiment/wareneingang/neu"}?bestellung=${encodeURIComponent(b.name)}`} className="bo-sor-kiosk__kachel">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-bo-fill">
                      <Truck className="size-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{b.lieferant}</span>
                      <span className="bo-sor-unter block truncate">
                        {b.name} · {b.kommission || "Lager"}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[13px] font-medium tabular-nums">{datum(b.bestaetigter_termin)}</span>
                      <Status gruppe="bestellung" wert={b.status} groesse="xs" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-(--bo-bento-gap)" data-testid="we-buchen">
      <section className="bo-kachel">
        <h2 className="bo-titel-kachel">{WARENEINGANG.kopf}</h2>
        <p className="bo-sor-unter">
          {bestellung.name} · {bestellung.lieferant} · {bestellung.kommission || "Lager"}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bo-sor-feld">
            <label htmlFor="we-ls">{WARENEINGANG.lieferschein}</label>
            <input id="we-ls" className="bo-sor-eingabe" value={kopf.lieferschein_nr_lieferant} onChange={(e) => setKopf((k) => ({ ...k, lieferschein_nr_lieferant: e.target.value }))} data-scan="ja" />
          </div>
          <div className="bo-sor-feld">
            <label htmlFor="we-sp">{WARENEINGANG.spediteur}</label>
            <input id="we-sp" className="bo-sor-eingabe" value={kopf.spediteur} onChange={(e) => setKopf((k) => ({ ...k, spediteur: e.target.value }))} />
          </div>
          <div className="bo-sor-feld">
            <label htmlFor="we-pk">{WARENEINGANG.packstuecke}</label>
            <input id="we-pk" type="number" min={1} inputMode="numeric" className="bo-sor-eingabe" value={kopf.packstuecke} onChange={(e) => setKopf((k) => ({ ...k, packstuecke: e.target.value }))} />
          </div>
        </div>
      </section>

      <section className="bo-kachel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="bo-titel-kachel">{WARENEINGANG.positionen}</h2>
            <p className="bo-sor-unter">{WARENEINGANG.erhaltenHilfe}</p>
          </div>
          <Knopf variant="secondary" icon="CheckCheck" onClick={() => setPos(Object.fromEntries(rest.map((r) => [r.idx, { menge_erhalten: r.rest, zustand: "ok", hinweis: "" }])))}>
            {WARENEINGANG.allesOk}
          </Knopf>
        </div>
        {rest.every((r) => r.rest === 0) && <p className="bo-sor-unter mt-4">{WARENEINGANG.keineOffenen}</p>}
        <ul className="mt-4 flex flex-col gap-3">
          {rest.map((r) => {
            const p = pos[r.idx] || { menge_erhalten: 0, zustand: "ok", hinweis: "" };
            const diff = (Number(p.menge_erhalten) || 0) - r.rest;
            const schaden = ["beschaedigt", "Transportschaden", "falsch"].includes(p.zustand);
            return (
              <li key={r.idx} className="flex flex-col gap-3 rounded-[20px] bg-bo-surface-2 p-4" data-testid="we-position">
                <div className="flex flex-wrap items-center gap-4">
                  <ProduktBild src={bilder[r.produkt] || ""} alt="" groesse={56} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">
                      <span className="tabular-nums text-bo-text-soft">{r.idx} · </span>
                      {r.bezeichnung}
                    </p>
                    <p className="bo-sor-unter">
                      {r.ausfuehrung_text ? `${r.ausfuehrung_text} · ` : ""}
                      {WARENEINGANG.rest(r.rest)} von {r.soll}
                      {diff < 0 ? <span className="bo-sor-warn"> · {WARENEINGANG.weniger(-diff)}</span> : diff > 0 ? <span className="bo-sor-warn"> · {WARENEINGANG.mehr(diff)}</span> : null}
                    </p>
                  </div>
                  <span className="bo-sor-stepper" role="group" aria-label={`${WARENEINGANG.menge} Position ${r.idx}`}>
                    <button type="button" aria-label="Eins weniger" onClick={() => setze(r.idx, "menge_erhalten", Math.max(0, (Number(p.menge_erhalten) || 0) - 1))}>
                      <Minus className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                    <input inputMode="numeric" aria-label={WARENEINGANG.menge} value={p.menge_erhalten} onChange={(e) => setze(r.idx, "menge_erhalten", e.target.value.replace(/\D/g, "") === "" ? "" : Number(e.target.value.replace(/\D/g, "")))} />
                    <button type="button" aria-label="Eins mehr" onClick={() => setze(r.idx, "menge_erhalten", (Number(p.menge_erhalten) || 0) + 1)}>
                      <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </span>
                </div>
                <div className="bo-sor-zustand" role="group" aria-label={`${WARENEINGANG.zustand} Position ${r.idx}`}>
                  {ZUSTAENDE.map((z) => (
                    <button key={z} type="button" aria-pressed={p.zustand === z} data-schaden={z !== "ok" ? "true" : undefined} onClick={() => setze(r.idx, "zustand", z)}>
                      {GLOSSAR.weZustand[z]}
                      <small>{GLOSSAR.weZustandUnter[z]}</small>
                    </button>
                  ))}
                </div>
                {(schaden || p.zustand === "fehlt" || p.hinweis) && (
                  <div className="bo-sor-feld">
                    <label htmlFor={`we-h-${r.idx}`}>
                      {WARENEINGANG.hinweis}
                      {schaden ? " (Pflicht)" : ""}
                    </label>
                    <input id={`we-h-${r.idx}`} className="bo-sor-eingabe" value={p.hinweis} onChange={(e) => setze(r.idx, "hinweis", e.target.value)} aria-invalid={schaden && !p.hinweis.trim() ? "true" : undefined} />
                    <span className="bo-sor-feld__hinweis">{WARENEINGANG.fotoHinweis}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bo-material-stark sticky bottom-3 z-10 flex flex-row flex-wrap items-center justify-between gap-4 rounded-[28px] px-6 py-4 shadow-(--bo-sh-float)" aria-label={WARENEINGANG.zusammenfassung}>
        <div>
          <p className="text-[15px] font-semibold">{WARENEINGANG.bucht(summe, bestellung.name)}</p>
          <p className="bo-sor-unter">{WARENEINGANG.statusDanach(GLOSSAR.bestellStatus[nachher || bestellung.status])}</p>
        </div>
        <Knopf variant="primary" size={kiosk ? "kiosk" : "l"} icon="PackageCheck" laedt={laeuft} disabled={!!sperre} grund={sperre || undefined} onClick={buchen} kuerzel={kiosk ? "F6" : undefined} data-testid="we-buchen-knopf">
          {WARENEINGANG.buchen}
        </Knopf>
      </section>
    </div>
  );
}
