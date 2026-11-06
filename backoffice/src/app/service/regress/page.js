// Lieferantenregress (T2/T3, 10-konzept-service §2.8): Regressfrist erst ab Anerkannt gewahrt (R-03), Abgleich (N19).
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { isoDatum } from "@/lib/backoffice/format";
import { ladeMeta } from "@/lib/backoffice/frappe";
import { serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { ABGLEICH, REGRESS_STATUS } from "@/lib/backoffice/service/labels";
import { regressFristKritisch } from "@/lib/backoffice/service/regeln";
import { regressFristText as fristText } from "@/lib/backoffice/service/zeilen";
import { euro } from "@/lib/backoffice/service/anzeige";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import ListeKachel from "@/components/Backoffice/Service/ListeKachel";
import ServiceKanban from "@/components/Backoffice/Service/ServiceKanban";
import { Status } from "@/components/Backoffice/Service/Teile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Regress · Service" };

const REITER = ["offen", "frist", "gemeldet", "anerkannt", "unterdeckung", "verrechnet", "abgelehnt"];

export default async function Regress({ searchParams }) {
  const sp = await searchParams;
  const s0 = await requireSession("/service/regress");
  const client = serviceClient(s0);
  const meta = await ladeMeta(client, "PH Lieferantenregress");
  const session = await requireDocRecht(meta, "read", "/service/regress");
  const s = sicht(session);
  const heute = isoDatum();
  const reiter = REITER.includes(sp.reiter) ? sp.reiter : "offen";
  const alle = await client.getList("PH Lieferantenregress", { fields: ["name", "titel", "status", "servicefall", "lieferant", "marke", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent", "abgleich_status", "differenz_cent", "frist_bis", "gemeldet_am", "form"], orderBy: "frist_bis asc", limit: 300 });
  const filter = { offen: (r) => ["Offen", "Gemeldet", "Anerkannt"].includes(r.status), frist: (r) => regressFristKritisch(r, heute), gemeldet: (r) => r.status === "Gemeldet", anerkannt: (r) => r.status === "Anerkannt", unterdeckung: (r) => r.abgleich_status === "Unterdeckung", verrechnet: (r) => r.status === "Verrechnet", abgelehnt: (r) => r.status === "Abgelehnt" };
  const liste = alle.filter(filter[reiter]);
  const href = (a) => {
    const q = new URLSearchParams(Object.entries({ reiter: reiter === "offen" ? "" : reiter, kanban: sp.kanban || "", ...a }).filter(([, v]) => v));
    return `/service/regress${q.toString() ? `?${q}` : ""}`;
  };
  const offenSumme = alle.filter(filter.offen).reduce((a, r) => a + (r.status === "Anerkannt" ? Math.max(0, r.betrag_anerkannt_cent - r.betrag_erhalten_cent) : r.betrag_gefordert_cent || 0), 0);
  const kanban = sp.kanban === "1";
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.regress.titel}
        krumen={[{ titel: "Service", href: "/service" }, { titel: "Regress" }]}
        kennzahlen={[{ wert: euro(offenSumme), text: "offen" }, { wert: alle.filter(filter.frist).length, text: T.regress.reiter.frist }]}
        aktionen={<Segment label="Darstellung" aktiv={kanban ? "kanban" : "liste"} optionen={[{ wert: "liste", titel: "Liste", href: href({ kanban: "" }) }, { wert: "kanban", titel: "Kanban", href: href({ kanban: "1" }) }]} />}
        unternav={!kanban && <Segment label="Reiter" aktiv={reiter} groesse="s" optionen={REITER.map((k) => ({ wert: k, titel: T.regress.reiter[k], href: href({ reiter: k === "offen" ? "" : k }), anzahl: k === "frist" ? alle.filter(filter.frist).length || undefined : undefined }))} />}
      />
      {kanban ? (
        <ServiceKanban art="regress" spalten={["Offen", "Gemeldet", "Anerkannt"].map((st) => ({ status: st, titel: REGRESS_STATUS[st].text, ton: REGRESS_STATUS[st].ton, karten: alle.filter((r) => r.status === st).map((r) => ({ name: r.name, titel: r.lieferant, unter: `${r.name} · ${r.servicefall}`, href: `/service/regress/${encodeURIComponent(r.name)}`, chips: [{ text: euro(r.betrag_gefordert_cent) }, { text: fristText(r).text, ton: fristText(r).ton === "abgelaufen" ? "gefahr" : undefined }] })) }))} ziele={{ Offen: ["Gemeldet"], Gemeldet: ["Anerkannt"] }} nurLesen={!s.schreiben} />
      ) : liste.length ? (
        <ListeKachel
          spalten={[{ titel: T.regress.spalten.regress }, { titel: T.regress.spalten.status }, { titel: T.regress.spalten.gefordert, rechts: true }, { titel: T.regress.spalten.erhalten, rechts: true, nurAb: "lg" }, { titel: T.regress.spalten.abgleich, nurAb: "lg" }, { titel: T.regress.spalten.frist }]}
          zeilen={liste.map((r) => {
            const f = fristText(r);
            return { key: r.name, href: `/service/regress/${encodeURIComponent(r.name)}`, titel: r.lieferant, unter: `${r.name} · Fall ${r.servicefall}`, icon: "Banknote", zellen: [<Status key="s" wert={r.status} map={REGRESS_STATUS} groesse="sm" />, euro(r.betrag_gefordert_cent), r.betrag_erhalten_cent ? euro(r.betrag_erhalten_cent) : "–", r.abgleich_status && r.abgleich_status !== "Offen" ? <Status key="a" wert={r.abgleich_status} map={ABGLEICH} groesse="sm" /> : "–", <span key="f" className="bo-svc-gwl" data-ton={f.ton}>{f.text}</span>] };
          })}
          fuss={<span>{liste.length} Regresse</span>}
          testid="regress-liste"
        />
      ) : reiter === "frist" ? (
        <Leer art="erledigt" text={T.regress.leerFrist} />
      ) : reiter === "unterdeckung" ? (
        <Leer art="erledigt" text={T.regress.leerUnter} />
      ) : (
        <Leer text={T.regress.leer} />
      )}
    </Shell>
  );
}
