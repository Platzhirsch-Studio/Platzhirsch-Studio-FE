import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import FilterForm from "@/components/Backoffice/Sortiment/FilterForm";
import { ListenKachel, ProduktBild, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { markenListe, sortimentKontext } from "@/lib/backoffice/sortiment/daten";
import { GLOSSAR, LEER, MARKEN, PRODUKTE } from "@/lib/backoffice/sortiment/texte";
import { mitParametern } from "@/lib/backoffice/listen";
import { datum } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marken · Sortiment" };

export default async function MarkenPage({ searchParams }) {
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const { session, client } = await sortimentKontext({ pfad: "/sortiment/marken", doctype: "PH Marke" });
  const marken = await markenListe(client, sp);
  const ansicht = sp.ansicht === "logos" ? "logos" : "liste";
  const basis = "/sortiment/marken";
  const href = (a) => mitParametern(basis, sp, a);
  const ohneStatus = marken.filter((m) => ["Keiner", "Anfrage laeuft"].includes(m.haendlerstatus) && m.status === "Aktiv").length;
  const ohneBeleg = marken.filter((m) => m.bildfreigabe_status !== "schriftlich erteilt").length;
  const kopf = [{ titel: MARKEN.spalten.marke }, { titel: MARKEN.spalten.status }, { titel: MARKEN.spalten.bildfreigabe, klasse: "max-lg:hidden" }, { titel: MARKEN.spalten.lieferant, klasse: "max-xl:hidden" }, { titel: MARKEN.spalten.vertrag, rechts: true, klasse: "max-lg:hidden" }, { titel: MARKEN.spalten.produkte, rechts: true }];
  const zeilen = marken.map((m) => {
    const h = `${basis}/${encodeURIComponent(m.name)}`;
    return {
      key: m.name,
      zellen: [
        <div key="t" className="flex min-w-0 items-center gap-3">
          <ProduktBild src={m.bild_anhagen} alt="" groesse={48} />
          <div className="min-w-0">
            <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
              {m.marke || m.name}
            </Link>
            <p className="bo-sor-unter truncate">{[GLOSSAR.welt[m.welt], m.land, m.status !== "Aktiv" ? GLOSSAR.markeStatus[m.status] : null].filter(Boolean).join(" · ")}</p>
          </div>
        </div>,
        <Status key="s" gruppe="haendler" wert={m.haendlerstatus} />,
        <span key="b" className={m.bildfreigabe_status === "schriftlich erteilt" ? "bo-sor-unter bo-sor-ok" : "bo-sor-unter bo-sor-warn"}>{GLOSSAR.bildfreigabeMarke[m.bildfreigabe_status] || "–"}</span>,
        <span key="l" className="bo-sor-unter">{m.lieferant || MARKEN.ohneLieferant}</span>,
        <span key="v" className="bo-sor-zahl">{datum(m.vertrag_gueltig_bis)}</span>,
        <span key="p" className="bo-sor-zahl">{m.produkte_anzahl || 0}</span>,
      ],
      karte: (
        <>
          <ProduktBild src={m.bild_anhagen} alt="" groesse={48} />
          <div className="min-w-0 flex-1">
            <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
              {m.marke || m.name}
            </Link>
            <p className="bo-sor-unter">{MARKEN.produkte(m.produkte_anzahl || 0)}</p>
          </div>
          <Status gruppe="haendler" wert={m.haendlerstatus} groesse="sm" />
        </>
      ),
    };
  });
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={MARKEN.titel}
        untertitel={MARKEN.untertitel}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: MARKEN.titel }]}
        kennzahlen={[
          { wert: marken.length, text: "Marken" },
          { wert: ohneStatus, text: "ohne Händlerstatus" },
          { wert: ohneBeleg, text: "ohne Bildfreigabe" },
        ]}
        aktionen={<Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "liste", titel: PRODUKTE.liste, icon: "Rows3", href: href({ ansicht: null }) }, { wert: "logos", titel: MARKEN.logos, icon: "LayoutDashboard", href: href({ ansicht: "logos" }) }]} />}
      />
      <div className="bo-sor-werkzeuge">
        <Segment label="Händlerstatus" aktiv={sp.haendler || "alle"} groesse="s" optionen={[{ wert: "alle", titel: "Alle", href: href({ haendler: null }) }, ...["Keiner", "Anfrage laeuft", "Haendler", "Vertragshaendler"].map((w) => ({ wert: w, titel: GLOSSAR.haendlerstatus[w], href: href({ haendler: w }) }))]} />
        <FilterForm basis={basis} params={sp} behalten={["ansicht", "haendler"]} suche={{ name: "q", platzhalter: MARKEN.suche }} zuruecksetzen={href({ q: null })} />
      </div>
      {marken.length === 0 ? (
        sp.q || sp.haendler ? <Leer art="gefiltert" titel={LEER.gefiltert} zuruecksetzenHref={basis} /> : <Leer titel={MARKEN.leer} icon="Tag" />
      ) : ansicht === "logos" ? (
        <ul className="bo-sor-raster" aria-label={MARKEN.titel}>
          {marken.map((m) => (
            <li key={m.name} className="bo-sor-produktkarte">
              <ProduktBild src={m.bild_anhagen} alt="" fuellen />
              <div className="bo-sor-produktkarte__text">
                <Link href={`${basis}/${encodeURIComponent(m.name)}`} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
                  {m.marke || m.name}
                </Link>
                <span className="bo-sor-unter">{MARKEN.produkte(m.produkte_anzahl || 0)}</span>
              </div>
              <div className="bo-sor-produktkarte__fuss">
                <Status gruppe="haendler" wert={m.haendlerstatus} groesse="sm" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ListenKachel label={MARKEN.titel} kopf={kopf} zeilen={zeilen} oben={`${marken.length} Marken`} />
      )}
    </Shell>
  );
}
