import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import FilterForm from "@/components/Backoffice/Sortiment/FilterForm";
import { Blaettern, ListenKachel, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { erwarteteLieferungen, sortimentKontext, wareneingangListe } from "@/lib/backoffice/sortiment/daten";
import { GLOSSAR, LEER, WARENEINGANG } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { mitParametern } from "@/lib/backoffice/listen";
import { datum } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wareneingang · Sortiment" };

export default async function WareneingangListe({ searchParams }) {
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const { session, client, meta } = await sortimentKontext({ pfad: "/sortiment/wareneingang", doctype: "PH Wareneingang" });
  const [daten, erwartet] = await Promise.all([wareneingangListe(client, sp), erwarteteLieferungen(client).catch(() => [])]);
  const basis = "/sortiment/wareneingang";
  const href = (a) => mitParametern(basis, sp, a);
  const darfAnlegen = darfDoc(session, meta, "create");
  const kopf = [{ titel: WARENEINGANG.spalten.eingang }, { titel: WARENEINGANG.spalten.status }, { titel: WARENEINGANG.spalten.bestellung, klasse: "max-lg:hidden" }, { titel: "Lieferschein", klasse: "max-xl:hidden" }, { titel: WARENEINGANG.spalten.datum, rechts: true }];
  const zeilen = daten.zeilen.map((w) => {
    const h = `${basis}/${encodeURIComponent(w.name)}`;
    return {
      key: w.name,
      warn: w.status === "Reklamiert" && !w.servicefall_ref,
      zellen: [
        <div key="t" className="min-w-0">
          <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
            {w.lieferant || "–"}
          </Link>
          <p className="bo-sor-unter truncate">
            <span className="tabular-nums">{w.name}</span> · {w.kommission || "Lager"}
          </p>
        </div>,
        <Status key="s" gruppe="we" wert={w.status} />,
        <span key="b" className="bo-sor-nr bo-sor-unter">
          {w.herstellerbestellung}
        </span>,
        <span key="l" className="bo-sor-unter">
          {[w.lieferschein_nr_lieferant, w.packstuecke ? `${w.packstuecke} Packst.` : null].filter(Boolean).join(" · ") || "–"}
        </span>,
        <span key="d" className="bo-sor-zahl">
          {datum(w.datum)}
        </span>,
      ],
      karte: (
        <>
          <div className="min-w-0 flex-1">
            <Link href={h} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
              {w.lieferant}
            </Link>
            <p className="bo-sor-unter truncate">
              {w.name} · {datum(w.datum)}
            </p>
          </div>
          <Status gruppe="we" wert={w.status} groesse="sm" />
        </>
      ),
    };
  });
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={WARENEINGANG.titel}
        untertitel={WARENEINGANG.untertitel}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: WARENEINGANG.titel }]}
        kennzahlen={[{ wert: erwartet.length, text: "erwartet (7 Tage)" }]}
        aktionen={
          <>
            <Knopf href={`${basis}/kiosk`} icon="Monitor">
              {WARENEINGANG.kiosk}
            </Knopf>
            {darfAnlegen && (
              <Knopf variant="primary" icon="PackageCheck" href={`${basis}/neu`} data-testid="we-neu">
                {WARENEINGANG.neu}
              </Knopf>
            )}
          </>
        }
      />
      <div className="bo-sor-werkzeuge">
        <Segment label="Status" aktiv={sp.status || "alle"} groesse="s" optionen={[{ wert: "alle", titel: "Alle", href: href({ status: null, seite: null }) }, ...Object.entries(GLOSSAR.weStatus).map(([wert, titel]) => ({ wert, titel: titel.charAt(0).toUpperCase() + titel.slice(1), href: href({ status: wert, seite: null }) }))]} />
        <FilterForm basis={basis} params={sp} behalten={["status"]} suche={{ name: "q", platzhalter: WARENEINGANG.suche }} zuruecksetzen={href({ q: null })} />
      </div>
      {zeilen.length === 0 ? (
        sp.q || sp.status ? (
          <Leer art="gefiltert" titel={LEER.gefiltert} zuruecksetzenHref={basis} />
        ) : (
          <Leer titel={WARENEINGANG.leer} text="Wareneingänge entstehen aus bestätigten Bestellungen." icon="PackageCheck" aktion={darfAnlegen ? <Knopf href={`${basis}/neu`}>{WARENEINGANG.neu}</Knopf> : null} />
        )
      ) : (
        <ListenKachel label={WARENEINGANG.titel} kopf={kopf} zeilen={zeilen} oben={`${daten.gesamt} Wareneingänge`} fuss={<Blaettern seite={daten.seite} limit={daten.limit} gesamt={daten.gesamt} href={(s) => href({ seite: s > 1 ? s : null })} />} />
      )}
    </Shell>
  );
}
