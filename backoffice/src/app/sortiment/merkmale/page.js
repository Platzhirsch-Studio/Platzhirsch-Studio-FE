import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import { ListenKachel, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { GLOSSAR, MERKMALE } from "@/lib/backoffice/sortiment/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Merkmale · Sortiment" };

export default async function MerkmalePage({ searchParams }) {
  const sp = await searchParams;
  const gruppe = sp.gruppe ? String(sp.gruppe) : "";
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/merkmale", doctype: "PH Merkmal" });
  const alle = await client.getList("PH Merkmal", { fields: ["name", "merkmal", "gruppe", "code", "farbe_hex", "marke", "status"], orderBy: "merkmal asc", limit: 500 });
  const liste = gruppe ? alle.filter((m) => m.gruppe === gruppe) : alle;
  const gruppen = [...new Set(alle.map((m) => m.gruppe))];
  const kopf = [{ titel: MERKMALE.spalten.merkmal }, { titel: MERKMALE.spalten.gruppe }, { titel: MERKMALE.spalten.code, klasse: "max-lg:hidden" }, { titel: MERKMALE.spalten.marke, klasse: "max-lg:hidden" }, { titel: MERKMALE.spalten.status }];
  const zeilen = liste.map((m) => ({
    key: m.name,
    zellen: [
      <span key="t" className="flex items-center gap-3">
        <span className="bo-sor-farbe !size-6" style={m.farbe_hex ? { background: m.farbe_hex } : undefined} aria-hidden="true" />
        <span className="bo-sor-titel">{m.merkmal}</span>
      </span>,
      <span key="g" className="bo-sor-unter">{GLOSSAR.merkmalGruppe[m.gruppe] || m.gruppe}</span>,
      <span key="c" className="bo-sor-nr bo-sor-unter">{m.code || "–"}</span>,
      <span key="m" className="bo-sor-unter">{m.marke || "–"}</span>,
      <Status key="s" gruppe="aktivInaktiv" wert={m.status} groesse="sm" />,
    ],
    karte: (
      <>
        <span className="bo-sor-farbe !size-6" style={m.farbe_hex ? { background: m.farbe_hex } : undefined} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="bo-sor-titel">{m.merkmal}</p>
          <p className="bo-sor-unter">{GLOSSAR.merkmalGruppe[m.gruppe]}</p>
        </div>
      </>
    ),
  }));
  return (
    <Shell session={session}>
      <Seitenkopf titel={MERKMALE.titel} untertitel={MERKMALE.untertitel} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: MERKMALE.titel }]} />
      <div className="bo-sor-werkzeuge">
        <Segment label="Gruppe" aktiv={gruppe || "alle"} groesse="s" optionen={[{ wert: "alle", titel: MERKMALE.alleGruppen, href: "/sortiment/merkmale" }, ...gruppen.map((g) => ({ wert: g, titel: GLOSSAR.merkmalGruppe[g] || g, href: `/sortiment/merkmale?gruppe=${encodeURIComponent(g)}` }))]} />
      </div>
      {zeilen.length === 0 ? <Leer titel={MERKMALE.leer} icon="SlidersHorizontal" /> : <ListenKachel label={MERKMALE.titel} kopf={kopf} zeilen={zeilen} oben={`${zeilen.length} Merkmale`} />}
    </Shell>
  );
}
