import Link from "next/link";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Fehler from "@/components/Backoffice/Fehler";
import Leer from "@/components/Backoffice/Leer";
import Avatar from "@/components/Backoffice/Avatar";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import Knopf, { RundKnopf } from "@/components/Backoffice/Knopf";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { GespraechsWoche, GespraechPlanenKnopf } from "@/components/Backoffice/Personal/Gespraeche";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeGespraeche, ladeBewerbungen, ladePersonen, sicher } from "@/lib/backoffice/personal/daten";
import { darfBewerbungen, darfBearbeiten, darfVertraulich, istLeitung } from "@/lib/backoffice/personal/rollen";
import { statusText, statusTon } from "@/lib/backoffice/personal/status";
import { T } from "@/lib/backoffice/personal/texte";
import { kw, plusTage, wochenStartIso, kurzDatum, tagKurz } from "@/lib/backoffice/personal/zeit";
import "@/components/Backoffice/DataTable/datatable.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gespräche · Personal" };

// T4 Woche | T2 Liste (Konzept § 5.7). Panel über ?panel=<name>, Woche über ?datum=JJJJ-MM-TT.
export default async function Gespraeche({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/gespraeche", sp, darfBewerbungen);
  const ansicht = sp.ansicht === "liste" ? "liste" : "woche";
  const montag = wochenStartIso(/^\d{4}-\d{2}-\d{2}$/.test(sp.datum || "") ? sp.datum : ctx.heute);
  const von = ansicht === "liste" ? ctx.heute : montag;
  const bis = ansicht === "liste" ? plusTage(ctx.heute, 120) : plusTage(montag, 5);
  const [r, personen, bew] = await Promise.all([
    sicher(() => ladeGespraeche(ctx, { von, bis, status: ansicht === "liste" && sp.status !== "alle" ? ["Geplant"] : undefined })),
    ladePersonen(ctx).catch(() => []),
    darfBearbeiten(ctx.rolle) ? ladeBewerbungen(ctx).catch(() => []) : [],
  ]);
  const offeneBew = bew.filter((b) => ["Eingegangen", "Gesichtet", "Gespraech"].includes(b.status)).map((b) => ({ name: b.name, person: b.person }));
  const jetzt = `${ctx.heute} ${String(ctx.jetzt.getHours()).padStart(2, "0")}:${String(ctx.jetzt.getMinutes()).padStart(2, "0")}`;
  return (
    <PersonalHuelle ctx={ctx} breit>
      <Seitenkopf
        titel={T.gespraech.titel}
        untertitel={ansicht === "woche" ? `KW ${kw(montag)} · ${kurzDatum(montag)}–${kurzDatum(plusTage(montag, 5))}` : "Geplant ab heute"}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.gespraech.titel }]}
        aktionen={
          <div className="flex flex-wrap items-center gap-2">
            {ansicht === "woche" && (
              <>
                <RundKnopf icon="ChevronLeft" href={`/personal/gespraeche?datum=${plusTage(montag, -7)}`} label="Vorige Woche" groesse="s" />
                <Knopf size="s" variant="secondary" href="/personal/gespraeche">{T.team.heute}</Knopf>
                <RundKnopf icon="ChevronRight" href={`/personal/gespraeche?datum=${plusTage(montag, 7)}`} label="Nächste Woche" groesse="s" />
              </>
            )}
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "woche", titel: T.gespraech.woche, href: "/personal/gespraeche" }, { wert: "liste", titel: T.gespraech.liste, href: "/personal/gespraeche?ansicht=liste" }]} />
            {darfBearbeiten(ctx.rolle) && <GespraechPlanenKnopf bewerbungen={offeneBew} personen={personen} standardFuehrung={ctx.user} heute={ctx.heute} startOffen={sp.planen === "1"} />}
          </div>
        }
      />
      {!r.ok ? (
        <Fehler code={r.fehler.code} />
      ) : ansicht === "woche" ? (
        r.daten.gespraeche.length === 0 ? (
          <Leer art="leer" titel={T.gespraech.leerWoche(kw(montag))} text={T.gespraech.leerText} icon="Calendar" testid="per-gespraeche-leer" />
        ) : (
          <GespraechsWoche montag={montag} gespraeche={r.daten.gespraeche} abwesend={r.daten.abwesend} jetzt={jetzt} leitung={istLeitung(ctx.rolle)} darf={darfBearbeiten(ctx.rolle)} vertraulich={darfVertraulich(ctx.rolle)} startPanel={sp.panel || null} />
        )
      ) : r.daten.gespraeche.length === 0 ? (
        <Leer art="leer" titel={T.gespraech.leer} text={T.gespraech.leerText} icon="Calendar" />
      ) : (
        <div className="bo-dt" data-testid="per-gespraeche-liste">
          <div className="overflow-x-auto">
            <table className="bo-dt__tabelle">
              <thead>
                <tr>{["beginn", "bewerber", "stelle", "modus", "fuehrung", "status", "ergebnis"].map((k) => <th key={k} scope="col">{T.gespraech.spalten[k]}</th>)}</tr>
              </thead>
              <tbody>
                {r.daten.gespraeche.map((g) => (
                  <tr key={g.name}>
                    <td className="whitespace-nowrap bo-per-zahl">{`${tagKurz(String(g.start).slice(0, 10))} ${kurzDatum(String(g.start).slice(0, 10))} ${String(g.start).slice(11, 16)}`}</td>
                    <td><Link className="bo-per-link" href={`/personal/gespraeche?panel=${encodeURIComponent(g.name)}&datum=${String(g.start).slice(0, 10)}`}>{g.bewerber}</Link></td>
                    <td>{g.stelleTitel}</td>
                    <td>{g.modus}</td>
                    <td><span className="inline-flex items-center gap-2"><Avatar name={g.verantwortlichName} groesse={24} />{g.verantwortlichName}</span></td>
                    <td><StatusBadge wert={g.status} text={statusText("gespraech", g.status)} ton={statusTon("gespraech", g.status)} groesse="m" /></td>
                    <td>{g.ergebnis || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PersonalHuelle>
  );
}
