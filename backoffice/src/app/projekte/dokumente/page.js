import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { Icon } from "@/components/Backoffice/icons";
import AktionKnopf from "@/components/Backoffice/Projekte/AktionKnopf";
import { Foto, ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { projekteClient } from "@/lib/backoffice/projekte/lesen";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dokumente · Projekte" };
const D = TEXTE.dokumente;
const enc = encodeURIComponent;

/** Dokumente aller Projekte (T2 Kacheln, § 5.16): Kategorie-Filter, „Kunde sieht“/„Intern“ mit Umschalter (sofort, Rückgängig über erneuten Klick). */
export default async function Dokumente({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/dokumente");
  const client = projekteClient(session);
  const [docs, projekte, renderings, aufmasse] = await Promise.all([
    client.getList("PH Projekt Dokument", { fields: ["name", "titel", "projekt", "kategorie", "status", "datum", "datei", "dateiname", "mime", "groesse", "kunde_sichtbar", "version"], orderBy: "datum desc", limit: 400 }).catch(() => []),
    client.getList("PH Projekt", { fields: ["name", "titel"], limit: 500 }).catch(() => []),
    sp.kategorie === "Rendering" ? client.getList("PH Rendering", { fields: ["name", "titel", "projekt", "status", "bild", "variante", "version"], limit: 200 }).catch(() => []) : [],
    sp.kategorie === "Aufmass" ? client.getList("PH Aufmass", { fields: ["name", "titel", "projekt", "status", "datum"], limit: 200 }).catch(() => []) : [],
  ]);
  const pj = Object.fromEntries(projekte.map((p) => [p.name, p.titel]));
  const kategorien = [...new Set(docs.map((d) => d.kategorie))].sort();
  const kat = sp.kategorie || "alle";
  const nurKunde = sp.kunde === "1";
  const liste = docs.filter((d) => (kat === "alle" || d.kategorie === kat) && (!nurKunde || Number(d.kunde_sichtbar)));
  const optionen = [{ wert: "alle", titel: "Alle", anzahl: docs.length, href: "/projekte/dokumente" }, ...kategorien.map((k) => ({ wert: k, titel: k, anzahl: docs.filter((d) => d.kategorie === k).length, href: `/projekte/dokumente?kategorie=${enc(k)}` })), { wert: "Rendering", titel: "Renderings", href: "/projekte/dokumente?kategorie=Rendering" }, { wert: "Aufmass", titel: "Aufmaße", href: "/projekte/dokumente?kategorie=Aufmass" }];
  return (
    <Shell session={session}>
      <Seitenkopf titel={D.titel} untertitel={D.unter} krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: D.titel }]}
        unternav={<div className="bo-prj-filter"><Segment label="Kategorie" groesse="s" aktiv={kat} optionen={optionen.filter((o, i, a) => a.findIndex((x) => x.wert === o.wert) === i)} /><Segment label="Sichtbar" groesse="s" aktiv={nurKunde ? "kunde" : "alle"} optionen={[{ wert: "alle", titel: "Alle", href: `/projekte/dokumente${kat !== "alle" ? `?kategorie=${enc(kat)}` : ""}` }, { wert: "kunde", titel: D.nurKunde, href: `/projekte/dokumente?kunde=1${kat !== "alle" ? `&kategorie=${enc(kat)}` : ""}` }]} /></div>} />
      {kat === "Rendering" ? (
        <Kachel titel="Renderings">
          {renderings.length ? (
            <div className="bo-prj-raster">
              {renderings.map((r) => (
                <article key={r.name} className="bo-prj-objekt">
                  <div className="bo-prj-objekt__bild">{r.bild ? <Foto src={r.bild} alt={r.titel} /> : null}</div>
                  <div className="bo-prj-objekt__text">
                    <Link className="bo-prj-zeilenlink bo-prj-titel truncate" href={`/projekte/${enc(r.projekt)}/renderings/${enc(r.name)}`}>{r.titel}</Link>
                    <span className="bo-prj-unter">{pj[r.projekt]}</span>
                    <ProjektStatus doctype="PH Rendering" wert={r.status} />
                  </div>
                </article>
              ))}
            </div>
          ) : <Leer groesse="karte" titel={TEXTE.planung.renderingsLeer} />}
        </Kachel>
      ) : kat === "Aufmass" ? (
        <Kachel titel="Aufmaße">
          {aufmasse.length ? <ul className="bo-prj-liste">{aufmasse.map((a) => <li key={a.name}><span className="bo-prj-liste__ico" data-ton="see" aria-hidden="true"><Icon name="Ruler" className="size-4" /></span><Link className="min-w-0 flex-1" href={`/projekte/${enc(a.projekt)}/aufmass/${enc(a.name)}`}><span className="bo-prj-titel block">{a.titel}</span><span className="bo-prj-unter">{pj[a.projekt]} · {datumKurz(a.datum, { jahr: true })}</span></Link><ProjektStatus doctype="PH Aufmass" wert={a.status} /></li>)}</ul> : <Leer groesse="karte" titel={TEXTE.planung.aufmassLeer} />}
        </Kachel>
      ) : (
        <Kachel titel={kat === "alle" ? D.dokumente : kat} unter={`${liste.length} Dateien`} testid="dokumente-raster">
          {liste.length ? (
            <div className="bo-prj-raster">
              {liste.map((d) => (
                <article key={d.name} className="bo-prj-objekt" data-markiert={sp.dokument === d.name ? "true" : undefined}>
                  <div className="bo-prj-objekt__bild" data-leer={/^image\//.test(d.mime || "") ? undefined : ""}>
                    {/^image\//.test(d.mime || "") ? <Foto src={d.datei} alt={d.titel} /> : <Icon name="FileText" className="size-7" />}
                  </div>
                  <div className="bo-prj-objekt__text">
                    <span className="bo-prj-titel truncate">{d.titel}</span>
                    <span className="bo-prj-unter truncate"><Link href={`/projekte/${enc(d.projekt)}?tab=dateien`} className="relative z-10 hover:underline">{pj[d.projekt] || d.projekt}</Link> · {datumKurz(d.datum, { jahr: true })}{Number(d.version) > 1 ? ` · Version ${d.version}` : ""}</span>
                    <div className="relative z-10 flex flex-wrap items-center gap-2">
                      <Pille material="travertin" punkt={false} groesse="xs">{d.kategorie}</Pille>
                      <AktionKnopf size="s" variant="ghost" icon={Number(d.kunde_sichtbar) ? "Eye" : "Lock"} art="dokument" args={{ name: d.name, freigeben: !Number(d.kunde_sichtbar) }} ok={Number(d.kunde_sichtbar) ? D.portalAus : D.portalAn}>
                        {Number(d.kunde_sichtbar) ? TEXTE.mappe.kundeSieht : TEXTE.mappe.intern}
                      </AktionKnopf>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : docs.length ? <Leer art="gefiltert" groesse="karte" titel={D.leerFilter} zuruecksetzenHref="/projekte/dokumente" /> : <Leer groesse="karte" titel={D.leer} />}
        </Kachel>
      )}
    </Shell>
  );
}
