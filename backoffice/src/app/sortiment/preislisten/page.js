import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { ListenKachel, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { preislistenListe, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { GLOSSAR, PREISLISTEN } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { datum } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Preislisten · Sortiment" };

export default async function PreislistenPage() {
  const { session, client, meta } = await sortimentKontext({ pfad: "/sortiment/preislisten", doctype: "PH Preisliste Import" });
  const liste = await preislistenListe(client);
  const kopf = [{ titel: PREISLISTEN.spalten.lauf }, { titel: PREISLISTEN.spalten.status }, { titel: PREISLISTEN.spalten.preisart, klasse: "max-lg:hidden" }, { titel: PREISLISTEN.spalten.zeilen, rechts: true }, { titel: PREISLISTEN.spalten.stand, rechts: true }];
  const zeilen = liste.map((l) => {
    const h = `/sortiment/preislisten/${encodeURIComponent(l.name)}`;
    return {
      key: l.name,
      warn: l.status === "Geprueft",
      zellen: [
        <div key="t" className="min-w-0">
          <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">{l.marke}</Link>
          <p className="bo-sor-unter tabular-nums">{l.name}</p>
        </div>,
        <Status key="s" gruppe="preisliste" wert={l.status} />,
        <span key="a" className="bo-sor-unter">{GLOSSAR.preisart[l.preisart] || l.preisart}</span>,
        <span key="z" className="bo-sor-zahl">{l.zeilen_anzahl || 0}{l.zeilen_auffaellig ? <span className="bo-sor-klein bo-sor-warn block">{l.zeilen_auffaellig} über Schwelle</span> : null}</span>,
        <span key="d" className="bo-sor-zahl">{datum(l.stand)}</span>,
      ],
      karte: (
        <>
          <div className="min-w-0 flex-1">
            <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">{l.marke}</Link>
            <p className="bo-sor-unter">{GLOSSAR.preisartKurz[l.preisart]} · {datum(l.stand)}</p>
          </div>
          <Status gruppe="preisliste" wert={l.status} groesse="sm" />
        </>
      ),
    };
  });
  return (
    <Shell session={session}>
      <Seitenkopf titel={PREISLISTEN.titel} untertitel={PREISLISTEN.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: PREISLISTEN.titel }]} aktionen={darfDoc(session, meta, "create") ? <Knopf variant="primary" icon="Plus" href="/sortiment/preislisten/neu">{PREISLISTEN.neu}</Knopf> : null} />
      {zeilen.length === 0 ? <Leer titel={PREISLISTEN.leer} icon="Receipt" /> : <ListenKachel label={PREISLISTEN.titel} kopf={kopf} zeilen={zeilen} oben={`${zeilen.length} Läufe`} />}
    </Shell>
  );
}
