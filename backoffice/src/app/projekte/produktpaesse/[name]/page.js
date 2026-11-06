import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf, Band } from "@/components/Backoffice/Akte";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { heuteIso, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produktpass · Projekte" };
const P = TEXTE.produktpaesse;

/** Produktpass (T5, § 5.17): Produkt · Garantie & Gewährleistung · Materialien · Pflege; abgelaufene Garantie mit Gewährleistungshinweis (KSchG § 9b). */
export default async function ProduktpassAkte({ params }) {
  const { name: roh } = await params;
  const session = await requireRecht("projekte", "read", `/projekte/produktpaesse/${roh}`);
  const client = projekteClient(session);
  const heute = heuteIso();
  let d;
  try {
    d = await client.getDoc("PH Produktpass", decodeURIComponent(roh));
  } catch {
    notFound();
  }
  const abgelaufen = d.status === "Garantie abgelaufen" || (d.garantie_bis && d.garantie_bis < heute);
  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf zurueck={{ href: "/projekte/produktpaesse", titel: P.titel }} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: P.titel, href: "/projekte/produktpaesse" }, { titel: d.produkt_name }]}
          titel={d.produkt_name} nummer={`${d.name}${d.marke ? ` · ${d.marke}` : ""}${d.seriennummer ? ` · ${d.seriennummer}` : ""}`} status={<ProjektStatus doctype="PH Produktpass" wert={d.status} groesse="m" />}
          aktionen={<Knopf icon="Printer" href={`/druck/ph-produktpass/${encodeURIComponent(d.name)}?format=${encodeURIComponent("PH Produktpass")}`}>Drucken</Knopf>} />
        {abgelaufen && <Band ton="info" titel="Herstellergarantie" text={P.abgelaufen} />}
        <Bento>
          <Kachel className="md:col-span-6" titel="Garantie und Gewährleistung">
            <dl className="bo-prj-fakten">
              <div><dt>{P.garantie}</dt><dd>{d.garantie_bis ? datumKurz(d.garantie_bis, { jahr: true }) : P.keineAngabe}</dd></div>
              <div><dt>Monate</dt><dd>{d.garantie_monate || "–"}</dd></div>
              <div><dt>Geliefert</dt><dd>{d.lieferdatum ? datumKurz(d.lieferdatum, { jahr: true }) : "–"}</dd></div>
              <div><dt>Kunde sieht</dt><dd>{Number(d.kunde_sichtbar) ? "ja" : "nein"}</dd></div>
              {d.garantie_hinweis && <div className="col-span-2"><dt>Hinweis</dt><dd>{d.garantie_hinweis}</dd></div>}
              <div className="col-span-2"><dt>Gewährleistung</dt><dd className="text-bo-text-soft">Gesetzliche Gewährleistung – Frist folgt mit der Backend-Erweiterung.</dd></div>
            </dl>
          </Kachel>
          <Kachel className="md:col-span-3" titel="Materialien">{(d.materialien || []).length ? <ul className="bo-prj-liste">{d.materialien.map((m) => <li key={m.name}><span className="min-w-0 flex-1"><span className="bo-prj-titel block">{m.material}</span><span className="bo-prj-unter">{[m.anteil, m.herkunft].filter(Boolean).join(" · ")}</span></span></li>)}</ul> : <Leer groesse="karte" titel={P.materialienLeer} />}</Kachel>
          <Kachel className="md:col-span-3" titel="Pflege">{(d.pflege || []).length ? <ul className="bo-prj-liste">{d.pflege.map((m) => <li key={m.name}><span className="min-w-0 flex-1"><span className="block text-[15px]">{m.hinweis}</span><span className="bo-prj-unter">{m.intervall}</span></span></li>)}</ul> : <Leer groesse="karte" titel={P.pflegeLeer} />}</Kachel>
        </Bento>
      </div>
    </Shell>
  );
}
