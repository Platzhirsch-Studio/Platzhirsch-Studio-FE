import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteKopf } from "@/components/Backoffice/Akte";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import { ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import { ladeUnterakte } from "@/lib/backoffice/projekte/akte";
import { datumKurz } from "@/lib/backoffice/projekte/anzeige";
import { statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aufmaß · Projekte" };
const mm = (v) => (v || v === 0 ? `${Number(v).toLocaleString("de-DE")} mm` : "–");

/** Aufmaß (§ 5.4): Objekt, Räume, Maße in mm, Anschlüsse, Plausibilität als Hinweis (nicht blockierend). */
export default async function AufmassAkte({ params }) {
  const { session, doc: a, projekt: p } = await ladeUnterakte({ params, doctype: "PH Aufmass", pfad: "aufmass" });
  const enc = encodeURIComponent;
  return (
    <Shell session={session}>
      <div className="flex flex-col gap-6">
        <AkteKopf
          zurueck={{ href: `/projekte/${enc(p.name)}?tab=planung`, titel: p.titel }}
          krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: p.titel, href: `/projekte/${enc(p.name)}` }, { titel: a.titel }]}
          titel={a.titel}
          nummer={`${a.name} · ${datumKurz(a.datum, { jahr: true })}${a.geprueft_am ? ` · geprüft ${datumKurz(a.geprueft_am, { jahr: true })}` : ""}`}
          status={<ProjektStatus doctype="PH Aufmass" wert={a.status} groesse="m" />}
        />
        {a.plausibilitaet && (
          <div className="rounded-[20px] bg-bo-warning-soft px-5 py-4 text-[15px] text-bo-warning-text" role="status">
            {a.plausibilitaet}
          </div>
        )}
        <Bento>
          <Kachel className="md:col-span-4" titel="Objekt">
            <dl className="bo-prj-fakten bo-prj-fakten--eins">
              <div><dt>Adresse</dt><dd>{a.objekt_text || "–"}</dd></div>
              <div><dt>Etage</dt><dd>{a.etage || "–"}{Number(a.aufzug) ? " · Aufzug" : ""}</dd></div>
              <div><dt>Raumhöhe</dt><dd>{mm(a.raumhoehe_standard_mm)}</dd></div>
              {a.zugang_hinweis && <div><dt>Zugang</dt><dd>{a.zugang_hinweis}</dd></div>}
            </dl>
          </Kachel>
          <Tabelle className="md:col-span-8" titel="Räume" testid="aufmass-raeume" spalten={[{ titel: "Raum" }, { titel: "Länge", rechts: true }, { titel: "Breite", rechts: true }, { titel: "Fläche", rechts: true }]}
            zeilen={(a.raeume || []).map((r) => ({ key: r.name, titel: r.raum, unter: r.notiz, zellen: [mm(r.laenge_mm), mm(r.breite_mm), r.flaeche_m2 ? `${Number(r.flaeche_m2).toLocaleString("de-DE")} m²` : "–"] }))}
            leer={<Leer groesse="karte" titel="Noch keine Räume erfasst." />} />
          <Tabelle className="md:col-span-7" titel="Maße" testid="aufmass-masse" spalten={[{ titel: "Bezeichnung" }, { titel: "Art" }, { titel: "Wert", rechts: true }]}
            zeilen={(a.masse || []).map((x) => ({ key: x.name, titel: x.bezeichnung, unter: x.raum, zellen: [statusText("*", x.art || "").replace("Wandlaenge", "Wandlänge").replace("Schraege", "Schräge").replace("Tuer", "Tür").replace("Heizkoerper", "Heizkörper"), `${mm(x.wert_mm)}${x.toleranz_mm ? ` ± ${x.toleranz_mm}` : ""}`] }))}
            leer={<Leer groesse="karte" titel="Noch keine Maße." />} />
          <Tabelle className="md:col-span-5" titel="Anschlüsse" testid="aufmass-anschluesse" spalten={[{ titel: "Art" }, { titel: "Zustand" }, { titel: "Höhe", rechts: true }]}
            zeilen={(a.anschluesse || []).map((x) => ({ key: x.name, titel: x.art, unter: x.raum, zellen: [x.zustand || "–", mm(x.hoehe_mm)] }))}
            leer={<Leer groesse="karte" titel="Keine Anschlüsse erfasst." />} />
        </Bento>
      </div>
    </Shell>
  );
}
