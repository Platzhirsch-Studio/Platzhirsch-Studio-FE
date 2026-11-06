import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { Pille } from "@/components/Backoffice/StatusBadge";
import FilterForm from "@/components/Backoffice/Sortiment/FilterForm";
import ProduktListe from "@/components/Backoffice/Sortiment/ProduktListe";
import ProduktKanban from "@/components/Backoffice/Sortiment/ProduktKanban";
import Schnellanlage from "@/components/Backoffice/Sortiment/Schnellanlage";
import { Blaettern, PreisZelle, ProduktBild, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { produktAnsichtZaehler, produkteListe, produktKanban, sortimentKontext, stammAuswahl } from "@/lib/backoffice/sortiment/daten";
import { bilderZustand } from "@/lib/backoffice/sortiment/regeln";
import { GLOSSAR, LEER, PRODUKTE } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { mitParametern } from "@/lib/backoffice/listen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produkte · Sortiment" };

const ANSICHTEN = ["liste", "kacheln", "kanban"];

export default async function ProduktePage({ searchParams }) {
  const roh = await searchParams;
  const sp = Object.fromEntries(Object.entries(roh).map(([k, v]) => [k, String(Array.isArray(v) ? v[0] : v)]));
  const { session, client, meta, leitung } = await sortimentKontext({ pfad: "/sortiment/produkte", doctype: "PH Produkt" });
  const ansicht = ANSICHTEN.includes(sp.ansicht) ? sp.ansicht : "liste";
  const sicht = sp.sicht || "alle";
  const darfSchreiben = darfDoc(session, meta, "write");
  const darfAnlegen = darfDoc(session, meta, "create");
  const [zaehler, auswahl, daten, kanban] = await Promise.all([
    produktAnsichtZaehler(client),
    stammAuswahl(client),
    ansicht !== "kanban" ? produkteListe(client, { ...sp, sicht }, { limit: ansicht === "kacheln" ? 48 : 25 }) : null,
    ansicht === "kanban" ? produktKanban(client, sp) : null,
  ]);
  const basis = "/sortiment/produkte";
  const href = (aenderung) => mitParametern(basis, sp, aenderung);
  const gefiltert = !!(sp.q || sp.marke || sp.kategorie || sp.welt || sp.status || (sicht && sicht !== "alle"));

  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={PRODUKTE.titel}
        untertitel={PRODUKTE.untertitel}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: PRODUKTE.titel }]}
        kennzahlen={[
          { wert: zaehler.alle, text: "ohne Ausgelaufene" },
          { wert: zaehler.wartet, text: PRODUKTE.ansichten.wartet },
        ]}
        aktionen={
          <>
            <Segment
              label={PRODUKTE.ansicht}
              aktiv={ansicht}
              optionen={[
                { wert: "liste", titel: PRODUKTE.liste, icon: "Rows3", href: href({ ansicht: null, seite: null }) },
                { wert: "kacheln", titel: PRODUKTE.kacheln, icon: "LayoutDashboard", href: href({ ansicht: "kacheln", seite: null }) },
                { wert: "kanban", titel: PRODUKTE.kanban, icon: "Columns3", href: href({ ansicht: "kanban", seite: null }) },
              ]}
            />
            {darfAnlegen && <Schnellanlage marken={auswahl.marken} kategorien={auswahl.kategorien} />}
          </>
        }
      />
      <div className="bo-sor-werkzeuge">
        {ansicht !== "kanban" ? (
          <Segment
            label={PRODUKTE.systemansichten}
            aktiv={sicht}
            groesse="s"
            optionen={Object.entries(PRODUKTE.ansichten).map(([wert, titel]) => ({ wert, titel, anzahl: zaehler[wert], href: href({ sicht: wert === "alle" ? null : wert, seite: null, status: null }) }))}
          />
        ) : (
          <span />
        )}
        <FilterForm
          basis={basis}
          params={sp}
          behalten={["ansicht", "sicht"]}
          zuruecksetzen={href({ q: null, marke: null, kategorie: null, welt: null, status: null, seite: null })}
          suche={{ name: "q", platzhalter: PRODUKTE.suche }}
          auswahl={[
            { name: "marke", label: PRODUKTE.marke, alle: PRODUKTE.alleMarken, optionen: auswahl.marken.map((m) => ({ wert: m.name, titel: m.name })) },
            { name: "kategorie", label: PRODUKTE.kategorie, alle: PRODUKTE.alleKategorien, optionen: auswahl.kategorien.map((k) => ({ wert: k.name, titel: k.label_de || k.name })) },
            { name: "welt", label: PRODUKTE.welt, alle: PRODUKTE.alleWelten, optionen: Object.entries(GLOSSAR.welt).map(([wert, titel]) => ({ wert, titel })) },
          ]}
        />
      </div>

      {ansicht === "kanban" ? (
        <ProduktKanban spalten={kanban} leitung={leitung} darfSchreiben={darfSchreiben} />
      ) : daten.zeilen.length === 0 ? (
        gefiltert ? (
          <Leer art="gefiltert" titel={LEER.gefiltert} zuruecksetzenHref={basis} />
        ) : (
          <Leer titel="Noch keine Produkte" text="Produkte entstehen aus dem Katalog-Import oder hier über „Produkt“." icon="Package" aktion={<Knopf href="/sortiment/import">Import öffnen</Knopf>} />
        )
      ) : ansicht === "kacheln" ? (
        <>
          <ul className="bo-sor-raster" aria-label={PRODUKTE.titel} data-testid="produkt-kacheln">
            {daten.zeilen.map((p) => (
              <li key={p.name} className="bo-sor-produktkarte">
                <ProduktBild src={p.bild_hauptbild} alt="" fuellen zustand={bilderZustand(p).art} />
                {(p.verkauf_online || p.abverkauf) && (
                  <span className="bo-sor-produktkarte__chips">
                    {p.verkauf_online ? <span className="bo-sor-glaschip">{PRODUKTE.imShop}</span> : null}
                    {p.abverkauf ? <span className="bo-sor-glaschip">{PRODUKTE.abverkauf}</span> : null}
                  </span>
                )}
                <div className="bo-sor-produktkarte__text">
                  <Link href={`/sortiment/produkte/${encodeURIComponent(p.name)}`} className="bo-sor-link bo-sor-link--zeile bo-sor-titel line-clamp-1">
                    {p.titel}
                  </Link>
                  <span className="bo-sor-unter truncate">{[p.marke, p.kategorie].filter(Boolean).join(" · ")}</span>
                </div>
                <div className="bo-sor-produktkarte__fuss">
                  <Status gruppe="produkt" wert={p.status} groesse="sm" />
                  <span className="text-[14px]">
                    <PreisZelle produkt={p} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="bo-sor-liste__fuss">
            <Blaettern seite={daten.seite} limit={daten.limit} gesamt={daten.gesamt} href={(s) => href({ seite: s > 1 ? s : null })} />
          </div>
        </>
      ) : (
        <>
          <ProduktListe zeilen={daten.zeilen} leitung={leitung} darfSchreiben={darfSchreiben} kopfzeile={PRODUKTE.eintraege(daten.gesamt)} />
          <div className="bo-sor-liste__fuss">
            <Blaettern seite={daten.seite} limit={daten.limit} gesamt={daten.gesamt} href={(s) => href({ seite: s > 1 ? s : null })} />
            {sicht === "alle" && !sp.status && <Pille material="stein" groesse="sm">{PRODUKTE.ohneAusgelaufen}</Pille>}
          </div>
        </>
      )}
    </Shell>
  );
}
