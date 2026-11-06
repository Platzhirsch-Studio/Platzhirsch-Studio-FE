// /marketing/einblicke – Besucher-Einblicke (10-konzept-marketing § 2.12, T8): Zeitraum, Top-Seiten, Kennzahlen,
// Empfang je Tag (60 Tage, Sequenzpalette, grau = kein Datensatz). Kein Tracking-Pixel, keine Öffnungsraten.
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import { Balken as ChartBalken } from "@/components/Backoffice/Charts";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel } from "@/components/Backoffice/Marketing/Bausteine";
import { einblicke, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { kurzDatum } from "@/lib/backoffice/marketing/regeln";
import { EINBLICKE, seitentitel } from "@/lib/backoffice/marketing/texte";
import { zahl } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Einblicke") };

export default async function EinblickeSeite({ searchParams }) {
  const sp = await searchParams;
  const tage = [7, 30, 90].includes(Number(sp.tage)) ? Number(sp.tage) : 30;
  const ctx = await marketingKontext({ pfad: "/marketing/einblicke", doctype: "PH Einblick Tag" });
  const e = await einblicke(ctx.client, { tage });
  const max = Math.max(1, ...e.heat.map((h) => h.besuche || 0));
  return (
    <Rahmen ctx={ctx}>
      <Seitenkopf
        titel={EINBLICKE.titel}
        untertitel={EINBLICKE.untertitel}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: EINBLICKE.titel }]}
        kennzahlen={[{ wert: e.tage, text: EINBLICKE.tageEmpfangen }, { wert: zahl(e.besuche), text: EINBLICKE.besucheTop }]}
        aktionen={<StatusChips label={EINBLICKE.zeitraum} aktiv={String(tage)} optionen={[7, 30, 90].map((t) => ({ wert: String(t), titel: EINBLICKE.tage(t), href: `/marketing/einblicke?tage=${t}` }))} />}
      />
      <p className="bo-mar-zustand">{EINBLICKE.hilfe}</p>
      {e.tage === 0 ? (
        <Leer titel="Noch keine Einblicke" text={EINBLICKE.leer} />
      ) : (
        <Bento>
          <ChartBalken className="md:col-span-7" titel={EINBLICKE.topSeiten} untertitel="Besuche" punkte={e.top.map((s) => ({ label: s.pfad.replace(/^\/de\//, ""), wert: s.besuche }))} hoehe={200} />
          <Kachel className="md:col-span-5" titel={EINBLICKE.empfang} unter="60 Tage">
            <div className="bo-mar-heat mt-3" role="img" aria-label={`${e.heat.filter((h) => h.besuche != null).length} von 60 Tagen empfangen`}>
              {e.heat.map((h) => <span key={h.datum} title={`${kurzDatum(h.datum)}: ${h.besuche == null ? EINBLICKE.keinDatensatz : `${h.besuche} Besuche`}`} data-stufe={h.besuche == null ? undefined : Math.max(1, Math.ceil((h.besuche / max) * 5))} />)}
            </div>
            <p className="bo-mar-klein mt-3">Grau: {EINBLICKE.keinDatensatz}</p>
          </Kachel>
          <div className="md:col-span-12">
            <ListeKachel label={EINBLICKE.topSeiten}>
              <div className="overflow-x-auto">
                <table className="bo-mar-tabelle">
                  <thead><tr><th scope="col">{EINBLICKE.spalten.seite}</th><th scope="col" className="r">{EINBLICKE.spalten.besuche}</th><th scope="col" className="r">{EINBLICKE.spalten.tage}</th><th scope="col" className="r">{EINBLICKE.spalten.scroll}</th><th scope="col" className="r">{EINBLICKE.spalten.ziele}</th></tr></thead>
                  <tbody>{e.top.map((s) => <tr key={s.pfad}><td>{s.pfad}</td><td className="r bo-mar-zahl">{zahl(s.besuche)}</td><td className="r bo-mar-zahl">{s.tage}</td><td className="r bo-mar-zahl">{s.scroll} %</td><td className="r bo-mar-zahl">{s.ziele}</td></tr>)}</tbody>
                </table>
              </div>
            </ListeKachel>
          </div>
        </Bento>
      )}
    </Rahmen>
  );
}
