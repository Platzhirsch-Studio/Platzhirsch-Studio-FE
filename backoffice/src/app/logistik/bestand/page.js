import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Unternav from "@/components/Backoffice/Unternav";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { LagerScanKnopf } from "@/components/Backoffice/Logistik/LagerScanKnopf";
import { StatusPille, Chip, datumKurz } from "@/components/Backoffice/Logistik/ui";
import { bestandGruppen } from "@/lib/backoffice/logistik/daten";
import { BESTAND as T, LEER } from "@/lib/backoffice/logistik/texte";
import { seite, werte } from "../_teile";

export const metadata = { title: "Bestand" };
export const dynamic = "force-dynamic";

// Bestand (§ 4.10): Ansichten als Pillen, gruppiert nach Lagerort (Kopf mit Summen, je Gruppe 25 Zeilen + „Weitere 25“).
// Zeilenaktionen in der Bestand-Akte (Umlagern, Reservieren, Sperren, Ausbuchen); Kopf „Umlagern …“ per Scan.
export default async function Bestand({ searchParams }) {
  const params = werte(await searchParams);
  const { session, client, leitung } = await seite("/logistik/bestand");
  const ansicht = params.ansicht || "alle";
  const mehr = Object.fromEntries(Object.entries(params).filter(([k]) => k.startsWith("mehr_")).map(([k, v]) => [k.slice(5), Number(v) || 0]));
  const gruppen = await bestandGruppen(client, { ansicht, q: params.q, mehr });
  const ansichten = Object.entries(T.ansichten).map(([k, titel]) => ({ titel, href: k === "alle" ? "/logistik/bestand" : `/logistik/bestand?ansicht=${k}` }));
  return (
    <Shell session={session} breit>
      <Seitenkopf titel={T.titel} krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: T.titel }]} aktionen={<><Knopf href="/d/ph-wareneingang" icon="Package">Wareneingang</Knopf><LagerScanKnopf titel={T.umlagern} /></>}
        unternav={<Unternav eintraege={ansichten} aktiv={ansicht === "alle" ? "/logistik/bestand" : `/logistik/bestand?ansicht=${ansicht}`} label="Ansichten" />} />
      <form className="mb-6 flex justify-end" action="/logistik/bestand">
        {ansicht !== "alle" ? <input type="hidden" name="ansicht" value={ansicht} /> : null}
        <label className="bo-suche w-full max-w-sm"><span className="sr-only">Suche</span><input name="q" defaultValue={params.q || ""} placeholder="Artikel, SN, Platz, EAN" /></label>
      </form>
      {!gruppen.length ? (
        <Leer art={ansicht === "gesperrt" ? "erledigt" : params.q ? "gefiltert" : "leer"} titel={ansicht === "gesperrt" ? LEER.gesperrt : undefined} text={ansicht === "gesperrt" ? undefined : LEER.bestand} zuruecksetzenHref="/logistik/bestand" aktion={<Knopf href="/d/ph-wareneingang" icon="Package">Zum Wareneingang</Knopf>} />
      ) : (
        <div className="flex flex-col gap-6" data-testid="bestand-gruppen">
          {gruppen.map((g) => (
            <details key={g.lagerort} open className="bo-kachel bo-log-gruppe">
              <summary>
                <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="bo-titel-kachel">{g.lagerort}</span>
                <span className="bo-log-cap">{T.gruppe(g.gesamt, g.stueck)}</span>
              </summary>
              <div className="bo-log-tabhuelle">
                <table className="bo-log-tab">
                  <thead><tr><th>{T.spalten.platz}</th><th>{T.spalten.artikel}</th><th>{T.spalten.sn}</th><th className="r">{T.spalten.menge}</th><th className="r">{T.spalten.reserviert}</th><th className="r">{T.spalten.verfuegbar}</th><th>{T.spalten.zustand}</th>{leitung ? <th className="r">EK</th> : null}<th>{T.spalten.status}</th></tr></thead>
                  <tbody>
                    {g.zeilen.map((b) => (
                      <tr key={b.name} data-testid="bestand-zeile">
                        <td><span className="bo-log-platz">{b.platz || "–"}</span></td>
                        <td><Link className="font-semibold hover:underline" href={`/logistik/bestand/${encodeURIComponent(b.name)}`}>{b.produkt_name || b.name}</Link><span className="bo-log-cap block">{[b.marke, b.kommission ? `Kommission ${b.kommission}` : null, b.sperrgrund].filter(Boolean).join(" · ")}</span></td>
                        <td className="bo-log-mono">{b.seriennummer || "–"}</td>
                        <td className="r">{b.menge}</td>
                        <td className="r" title={b.reserviert_kunde_name ? `${b.reserviert_kunde_name} bis ${datumKurz(b.reserviert_bis)}` : undefined}>{b.reserviert || 0}</td>
                        <td className="r">{b.verfuegbar}</td>
                        <td>{Number(b.ausstellungsstueck) ? <Chip ton="messing">Ausstellung</Chip> : b.zustand === "B-Ware" ? <Chip ton="eiche">B-Ware</Chip> : "Neu"}</td>
                        {leitung ? <td className="r">{b.ek_cent ? `${(b.ek_cent / 100).toLocaleString("de-AT", { minimumFractionDigits: 2 })} €` : "–"}</td> : null}
                        <td><StatusPille doctype="PH Lagerbestand" status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {g.weitere ? <Knopf size="s" href={`/logistik/bestand?${new URLSearchParams({ ...params, [`mehr_${g.lagerort}`]: String((mehr[g.lagerort] || 0) + 1) })}`}>Weitere 25</Knopf> : null}
            </details>
          ))}
        </div>
      )}
    </Shell>
  );
}
