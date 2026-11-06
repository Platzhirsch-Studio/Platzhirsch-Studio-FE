import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import FilterForm from "@/components/Backoffice/Sortiment/FilterForm";
import { ListenKachel, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { lieferantenListe, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { glnGueltig } from "@/lib/backoffice/sortiment/uebermittlung";
import { GLOSSAR, LEER, LIEFERANTEN } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lieferanten · Sortiment" };

export default async function LieferantenPage({ searchParams }) {
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/lieferanten", doctype: "PH Lieferant" });
  const liste = await lieferantenListe(client, sp);
  const basis = "/sortiment/lieferanten";
  const kopf = [{ titel: LIEFERANTEN.spalten.lieferant }, { titel: LIEFERANTEN.spalten.bestellweg }, { titel: LIEFERANTEN.spalten.lieferzeit, klasse: "max-lg:hidden" }, { titel: "Status", klasse: "max-xl:hidden" }, { titel: LIEFERANTEN.spalten.offen, rechts: true }];
  const zeilen = liste.map((l) => {
    const h = `${basis}/${encodeURIComponent(l.name)}`;
    const elektronisch = ["IWOfurn", "EDI"].includes(l.bestellweg);
    const hinweis = !l.bestell_email && l.bestellweg === "E-Mail" ? LIEFERANTEN.ohneEmail : elektronisch && !glnGueltig(l.gln) ? LIEFERANTEN.glnFehlt : null;
    return {
      key: l.name,
      warn: !!hinweis,
      zellen: [
        <div key="t" className="min-w-0">
          <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
            {l.firmenname || l.name}
          </Link>
          <p className="bo-sor-unter truncate">{[l.marke, [l.ort, l.land].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</p>
        </div>,
        <span key="b" className="flex flex-col">
          <span className="text-[14px]">{GLOSSAR.bestellweg[l.bestellweg] || "–"}</span>
          {hinweis ? <span className="bo-sor-klein bo-sor-warn">{hinweis}</span> : <span className="bo-sor-klein truncate">{l.bestell_email || (elektronisch ? `GLN ${l.gln}` : "")}</span>}
        </span>,
        <span key="z" className="bo-sor-unter">{l.lieferzeit_wochen_standard ? `${l.lieferzeit_wochen_standard} Wochen` : "–"} · {LIEFERANTEN.ab(l.ab_erwartet_tage || 5)}</span>,
        <Status key="s" gruppe="aktivInaktiv" wert={l.status} groesse="sm" />,
        <span key="o" className="bo-sor-zahl">
          {l.offen}
          {l.entwuerfe ? <span className="bo-sor-klein block">+{l.entwuerfe} Entwurf</span> : null}
        </span>,
      ],
      karte: (
        <>
          <div className="min-w-0 flex-1">
            <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
              {l.firmenname || l.name}
            </Link>
            <p className="bo-sor-unter">{GLOSSAR.bestellweg[l.bestellweg] || "–"}</p>
          </div>
          {hinweis ? <Pille material="eiche" groesse="sm">{hinweis.split(" –")[0]}</Pille> : <span className="bo-sor-zahl">{l.offen}</span>}
        </>
      ),
    };
  });
  return (
    <Shell session={session} breit>
      <Seitenkopf titel={LIEFERANTEN.titel} untertitel={LIEFERANTEN.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: LIEFERANTEN.titel }]} kennzahlen={[{ wert: liste.length, text: "Lieferanten" }, { wert: liste.reduce((a, l) => a + l.offen, 0), text: "offene Bestellungen" }]} />
      <div className="bo-sor-werkzeuge">
        <span />
        <FilterForm basis={basis} params={sp} suche={{ name: "q", platzhalter: LIEFERANTEN.suche }} zuruecksetzen={basis} />
      </div>
      {liste.length === 0 ? sp.q ? <Leer art="gefiltert" titel={LEER.gefiltert} zuruecksetzenHref={basis} /> : <Leer titel={LIEFERANTEN.leer} icon="Truck" /> : <ListenKachel label={LIEFERANTEN.titel} kopf={kopf} zeilen={zeilen} oben={`${liste.length} Lieferanten`} />}
    </Shell>
  );
}
