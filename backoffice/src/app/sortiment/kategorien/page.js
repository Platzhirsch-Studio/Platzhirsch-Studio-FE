import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { ListenKachel, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { ustSatz } from "@/lib/backoffice/sortiment/regeln";
import { GLOSSAR, KATEGORIEN } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kategorien · Sortiment" };

export default async function KategorienPage({ searchParams }) {
  const sp = await searchParams;
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/kategorien", doctype: "PH Kategorie" });
  const liste = await client.getList("PH Kategorie", { fields: ["name", "label_de", "welt", "ust_klasse", "grundpreis_pflicht", "produkte_anzahl", "status", "uebergeordnet"], orderBy: "sortierung asc", limit: 500 });
  const ohneUst = liste.filter((k) => ustSatz(k.ust_klasse) === null).length;
  const kopf = [{ titel: KATEGORIEN.spalten.kategorie }, { titel: KATEGORIEN.spalten.ust }, { titel: KATEGORIEN.spalten.grundpreis, klasse: "max-lg:hidden" }, { titel: KATEGORIEN.spalten.status, klasse: "max-lg:hidden" }, { titel: KATEGORIEN.spalten.produkte, rechts: true }];
  const zeilen = liste.map((k) => {
    const satz = ustSatz(k.ust_klasse);
    const href = `/sortiment/produkte?kategorie=${encodeURIComponent(k.name)}`;
    return {
      key: k.name,
      warn: satz === null || String(sp.kategorie || "") === k.name,
      zellen: [
        <div key="t" className="min-w-0">
          <Link href={href} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">{k.label_de || k.name}</Link>
          <p className="bo-sor-unter">{[GLOSSAR.welt[k.welt], k.uebergeordnet || KATEGORIEN.oberste].filter(Boolean).join(" · ")}</p>
        </div>,
        satz === null ? <Pille key="u" material="eiche" groesse="sm">Satz offen</Pille> : <span key="u" className="tabular-nums">{satz} %</span>,
        <span key="g" className="bo-sor-unter">{k.grundpreis_pflicht ? KATEGORIEN.grundpreisPflicht : KATEGORIEN.nein}</span>,
        <Status key="s" gruppe="aktivInaktiv" wert={k.status} groesse="sm" />,
        <span key="p" className="bo-sor-zahl">{k.produkte_anzahl || 0}</span>,
      ],
      karte: (
        <>
          <div className="min-w-0 flex-1">
            <Link href={href} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">{k.label_de || k.name}</Link>
            <p className="bo-sor-unter">{satz === null ? "USt-Satz offen" : `USt ${satz} %`}</p>
          </div>
          <span className="bo-sor-zahl">{k.produkte_anzahl || 0}</span>
        </>
      ),
    };
  });
  return (
    <Shell session={session}>
      <Seitenkopf titel={KATEGORIEN.titel} untertitel={KATEGORIEN.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: KATEGORIEN.titel }]} kennzahlen={[{ wert: liste.length, text: "Kategorien" }, { wert: ohneUst, text: "USt-Satz offen" }]} />
      {zeilen.length === 0 ? <Leer titel={KATEGORIEN.leer} icon="Layers" /> : <ListenKachel label={KATEGORIEN.titel} kopf={kopf} zeilen={zeilen} oben="Ein offener USt-Satz sperrt das Veröffentlichen aller Produkte der Kategorie." />}
    </Shell>
  );
}
