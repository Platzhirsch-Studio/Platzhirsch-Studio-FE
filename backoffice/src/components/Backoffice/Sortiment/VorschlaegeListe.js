"use client";
// Bestellvorschläge (Meldebestand, ph_logistik): Auswahl → „n Vorschläge bestellen“ legt je Lieferant einen
// Bestellentwurf an (bestellungen_aus_vorschlaegen, nur Leitung). Ergebnis-Toast mit „Ansehen“.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Knopf from "../Knopf";
import { ProduktBild } from "./Bausteine";
import useAktion from "./useAktion";
import { vorschlaegeBestellenAction, vorschlagVerwerfenAction } from "@/lib/backoffice/sortiment/actions";
import { VORSCHLAEGE } from "@/lib/backoffice/sortiment/texte";
import { cent, datum } from "@/lib/backoffice/format";

export default function VorschlaegeListe({ vorschlaege, leitung, ek }) {
  const router = useRouter();
  const { sofort, laeuft, zeige } = useAktion();
  const [gewaehlt, setGewaehlt] = useState(() => new Set(vorschlaege.filter((v) => v.lieferant).map((v) => v.name)));
  const auswahl = vorschlaege.filter((v) => gewaehlt.has(v.name));
  const umschalten = (n) =>
    setGewaehlt((alt) => {
      const s = new Set(alt);
      s.has(n) ? s.delete(n) : s.add(n);
      return s;
    });
  const bestellen = async () => {
    const r = await sofort(() => vorschlaegeBestellenAction({ namen: auswahl.map((v) => v.name) }), { neuLaden: true });
    if (r?.ok) zeige(VORSCHLAEGE.erzeugt(r.angelegt.length), { art: "ok", unter: r.ohneLieferant.length ? `${r.ohneLieferant.length} ${VORSCHLAEGE.ohneLieferant}` : undefined, aktion: r.angelegt[0] ? { titel: VORSCHLAEGE.ansehen, onClick: () => router.push(`/sortiment/bestellungen/${encodeURIComponent(r.angelegt[0])}`) } : undefined });
  };
  return (
    <section className="bo-kachel bo-sor-liste" aria-label={VORSCHLAEGE.titel} data-testid="vorschlaege">
      <div className="bo-sor-liste__kopf">
        <span>{`${vorschlaege.length} offen`}</span>
        <Knopf variant="primary" icon="ScrollText" onClick={bestellen} laedt={laeuft} disabled={!leitung || !auswahl.length} grund={!leitung ? VORSCHLAEGE.nurLeitung : undefined} data-testid="vorschlaege-bestellen">
          {VORSCHLAEGE.bestellen(auswahl.length)}
        </Knopf>
      </div>
      <ul className="flex flex-col">
        {vorschlaege.map((v) => (
          <li key={v.name} className="bo-sor-karte-zeile !flex-wrap md:!flex-nowrap">
            <input type="checkbox" className="size-4" checked={gewaehlt.has(v.name)} onChange={() => umschalten(v.name)} aria-label={`${v.produkt_name} auswählen`} disabled={!leitung} />
            <ProduktBild src={v.bild} alt="" groesse={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{v.produkt_name || v.titel}</p>
              <p className="bo-sor-unter truncate">{[v.marke, v.lieferant || VORSCHLAEGE.ohneLieferant, v.lagerort].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="text-right">
              <p className="bo-sor-unter tabular-nums">{VORSCHLAEGE.verfuegbarText(v.verfuegbar, v.meldebestand)}</p>
              <p className="bo-sor-klein tabular-nums">{`${VORSCHLAEGE.spalten.termin} ${datum(v.voraussichtlich_am)}${ek && v.wert_cent ? ` · ${cent(v.wert_cent)}` : ""}`}</p>
            </div>
            <span className="min-w-16 text-right text-[22px] font-medium tabular-nums">+{v.vorschlag_menge}</span>
            {leitung && (
              <Knopf size="s" variant="ghost" onClick={() => sofort(() => vorschlagVerwerfenAction({ name: v.name }), { ok: "Vorschlag verworfen" })}>
                {VORSCHLAEGE.verwerfen}
              </Knopf>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
