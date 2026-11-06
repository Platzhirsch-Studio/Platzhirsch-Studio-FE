import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { heuteIso, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produktpässe · Projekte" };
const P = TEXTE.produktpaesse;

/** Produktpässe (T2, § 5.17): Herstellergarantie getrennt von Gewährleistung; „Gewährleistung bis“ erst mit Backend (A10b). */
export default async function Produktpaesse() {
  const session = await requireRecht("projekte", "read", "/projekte/produktpaesse");
  const client = projekteClient(session);
  const heute = heuteIso();
  const [liste, projekte] = await Promise.all([
    client.getList("PH Produktpass", { fields: ["name", "titel", "produkt_name", "marke", "projekt", "seriennummer", "lieferdatum", "garantie_bis", "status", "pflegekategorie", "kunde_sichtbar"], orderBy: "lieferdatum desc", limit: 400 }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel", "kunde_name"], limit: 500 }).catch(() => []),
  ]);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p]));
  return (
    <Shell session={session}>
      <Seitenkopf titel={P.titel} untertitel={P.unter} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: P.titel }]} kennzahlen={[{ wert: liste.length, text: "Pässe" }, { wert: liste.filter((x) => x.garantie_bis && x.garantie_bis < heute).length, text: "Garantie abgelaufen" }]} />
      <Tabelle
        titel={P.titel}
        unter={`${liste.length} Produktpässe`}
        testid="produktpass-liste"
        spalten={[{ titel: "Produkt" }, { titel: "Kunde", versteckt: "max-lg:hidden" }, { titel: "Geliefert", rechts: true }, { titel: P.garantie, rechts: true }, { titel: "Status" }]}
        zeilen={liste.map((x) => ({ key: x.name, href: `/projekte/produktpaesse/${encodeURIComponent(x.name)}`, titel: x.produkt_name || x.titel, unter: [x.marke, x.seriennummer, pj[x.projekt]?.titel].filter(Boolean).join(" · "), zellen: [pj[x.projekt]?.kunde_name || "–", x.lieferdatum ? datumKurz(x.lieferdatum, { jahr: true }) : "–", x.garantie_bis ? datumKurz(x.garantie_bis, { jahr: true }) : P.keineAngabe, <ProjektStatus key="s" doctype="PH Produktpass" wert={x.status} />] }))}
        leer={<Leer groesse="karte" titel={P.leer} aktion={<Knopf href="/projekte/liste?status=Uebergabe">Zu Projekten in Übergabe</Knopf>} />}
      />
    </Shell>
  );
}
