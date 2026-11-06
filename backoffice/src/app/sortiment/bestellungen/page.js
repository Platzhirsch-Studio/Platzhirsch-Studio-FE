import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { Pille } from "@/components/Backoffice/StatusBadge";
import FilterForm from "@/components/Backoffice/Sortiment/FilterForm";
import { Blaettern, ListenKachel, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import { bestellKanban, bestellSegmentZaehler, bestellungenListe, sortimentKontext, stammAuswahl } from "@/lib/backoffice/sortiment/daten";
import { abUeberfaellig } from "@/lib/backoffice/sortiment/regeln";
import { BESTELLUNGEN, GLOSSAR, LEER, PRODUKTE } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istSortiment } from "@/lib/backoffice/sortiment/rollen";
import { mitParametern } from "@/lib/backoffice/listen";
import { cent, datum } from "@/lib/backoffice/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bestellungen · Sortiment" };

function AbZelle({ b }) {
  if (!b.ab_nummer) {
    if (b.status === "Gesendet") {
      const u = abUeberfaellig(b);
      return <span className={u.ueberfaellig ? "bo-sor-unter bo-sor-warn" : "bo-sor-unter"}>{BESTELLUNGEN.abAusstaendig}{u.tage !== null ? ` · ${u.tage} T.` : ""}</span>;
    }
    return <span className="text-bo-text-faint">–</span>;
  }
  if (Number(b.abweichungen_offen) > 0) return <Pille material="eiche" groesse="sm">{BESTELLUNGEN.abMitAbweichung(b.abweichungen_offen)}</Pille>;
  return <span className="bo-sor-unter">{b.ab_nummer}</span>;
}

export default async function BestellungenPage({ searchParams }) {
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(Array.isArray(v) ? v[0] : v)]));
  const { session, client, meta, ek } = await sortimentKontext({ pfad: "/sortiment/bestellungen", doctype: "PH Herstellerbestellung" });
  const ansicht = sp.ansicht === "kanban" ? "kanban" : "liste";
  const segment = sp.segment || "alle";
  const [zaehler, auswahl, daten, kanban] = await Promise.all([bestellSegmentZaehler(client), stammAuswahl(client), ansicht === "liste" ? bestellungenListe(client, session, sp) : null, ansicht === "kanban" ? bestellKanban(client, session, sp) : null]);
  const basis = "/sortiment/bestellungen";
  const href = (a) => mitParametern(basis, sp, a);
  const darfAnlegen = darfDoc(session, meta, "create") && istSortiment(session);

  const kopf = [{ titel: BESTELLUNGEN.spalten.bestellung }, { titel: BESTELLUNGEN.spalten.status }, { titel: BESTELLUNGEN.spalten.ab }, { titel: BESTELLUNGEN.spalten.uebermittlung, klasse: "max-xl:hidden" }, { titel: BESTELLUNGEN.spalten.termin, rechts: true }, ...(ek ? [{ titel: BESTELLUNGEN.spalten.summe, rechts: true, klasse: "max-lg:hidden" }] : [])];
  const zeilen = (daten?.zeilen || []).map((b) => {
    const hrefB = `${basis}/${encodeURIComponent(b.name)}`;
    const ueberfaellig = b.bestaetigter_termin && ["AB geprueft", "Teilgeliefert"].includes(b.status) && b.bestaetigter_termin < new Date().toISOString().slice(0, 10);
    const titel = (
      <div className="min-w-0">
        <Link href={hrefB} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
          {b.lieferant || BESTELLUNGEN.ohneLieferant}
        </Link>
        <p className="bo-sor-unter truncate">
          <span className="tabular-nums">{b.name}</span> · {b.kommission || BESTELLUNGEN.lagerbestellung}
        </p>
      </div>
    );
    return {
      key: b.name,
      warn: !b.lieferant || ueberfaellig,
      zellen: [
        titel,
        <Status key="s" gruppe="bestellung" wert={b.status} />,
        <AbZelle key="a" b={b} />,
        b.uebermittlung_status ? <span key="u" className="bo-sor-unter">{GLOSSAR.uebermittlungWeg[b.uebermittlung_weg] || b.uebermittlung_weg} · {GLOSSAR.uebermittlungStatus[b.uebermittlung_status]}</span> : <span key="u" className="text-bo-text-faint">–</span>,
        <span key="t" className={`bo-sor-zahl ${ueberfaellig ? "bo-sor-gefahr" : ""}`}>{datum(b.bestaetigter_termin || b.wunschtermin)}<span className="bo-sor-klein block">{b.bestaetigter_termin ? "bestätigt" : b.wunschtermin ? "Wunsch" : ""}</span></span>,
        ...(ek ? [<span key="e" className="bo-sor-zahl">{cent(b.summe_ek_cent)}</span>] : []),
      ],
      karte: (
        <>
          <div className="min-w-0 flex-1">
            <Link href={hrefB} className="bo-sor-link bo-sor-link--zeile bo-sor-titel">
              {b.lieferant || BESTELLUNGEN.ohneLieferant}
            </Link>
            <p className="bo-sor-unter truncate">{b.name} · {b.kommission || BESTELLUNGEN.lagerbestellung}</p>
          </div>
          <Status gruppe="bestellung" wert={b.status} groesse="sm" />
        </>
      ),
    };
  });

  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel={BESTELLUNGEN.titel}
        untertitel={BESTELLUNGEN.untertitel}
        krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Sortiment", href: "/sortiment" }, { titel: BESTELLUNGEN.kurz }]}
        kennzahlen={[
          { wert: zaehler.unterwegs, text: BESTELLUNGEN.abAusstaendig },
          { wert: zaehler.ab, text: "AB zu klären" },
        ]}
        aktionen={
          <>
            <Segment
              label="Ansicht"
              aktiv={ansicht}
              optionen={[
                { wert: "liste", titel: PRODUKTE.liste, icon: "Rows3", href: href({ ansicht: null }) },
                { wert: "kanban", titel: PRODUKTE.kanban, icon: "Columns3", href: href({ ansicht: "kanban", seite: null }) },
              ]}
            />
            <Knopf href="/sortiment/bestellvorschlaege" icon="RefreshCw">Bestellvorschläge</Knopf>
            {darfAnlegen && <Knopf variant="primary" icon="Plus" href={`${basis}/neu`} data-testid="bestellung-neu">{BESTELLUNGEN.neu}</Knopf>}
          </>
        }
      />
      <div className="bo-sor-werkzeuge">
        {ansicht === "liste" ? <Segment label="Schritt" aktiv={segment} groesse="s" optionen={Object.entries(BESTELLUNGEN.segment).map(([wert, titel]) => ({ wert, titel, anzahl: zaehler[wert], href: href({ segment: wert === "alle" ? null : wert, seite: null }) }))} /> : <span />}
        <FilterForm basis={basis} params={sp} behalten={["ansicht", "segment"]} zuruecksetzen={href({ q: null, lieferant: null, seite: null, ohneLieferant: null })} suche={{ name: "q", platzhalter: BESTELLUNGEN.suche }} auswahl={[{ name: "lieferant", label: "Lieferant", alle: BESTELLUNGEN.alleLieferanten, optionen: auswahl.lieferanten.map((l) => ({ wert: l.name, titel: l.name })) }]} />
      </div>

      {ansicht === "kanban" ? (
        <div className="bo-sor-kanban" data-testid="bestell-kanban">
          {kanban.map((s) => (
            <section key={s.status} className="bo-sor-kanban__spalte" aria-label={GLOSSAR.bestellStatus[s.status]}>
              <header className="bo-sor-kanban__kopf">
                <h2 className="text-[14px] font-semibold">{GLOSSAR.bestellStatus[s.status]}</h2>
                <span className="bo-sor-zutun__zahl">{s.karten.length}</span>
              </header>
              <ul className="flex flex-col gap-2.5">
                {s.karten.length === 0 && <li className="bo-sor-kanban__leer">Keine Bestellungen</li>}
                {s.karten.map((b) => (
                  <li key={b.name} className="bo-sor-kanban__karte">
                    <div className="min-w-0 flex-1">
                      <Link href={`${basis}/${encodeURIComponent(b.name)}`} className="bo-sor-link bo-sor-link--zeile line-clamp-1 text-[14px] font-semibold">
                        {b.lieferant || BESTELLUNGEN.ohneLieferant}
                      </Link>
                      <p className="bo-sor-klein truncate">{b.name} · {b.kommission || BESTELLUNGEN.lagerbestellung}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <AbZelle b={b} />
                        {b.bestaetigter_termin && <span className="bo-sor-klein">Termin {datum(b.bestaetigter_termin)}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : zeilen.length === 0 ? (
        sp.q || sp.lieferant || segment !== "alle" ? <Leer art="gefiltert" titel={LEER.gefiltert} zuruecksetzenHref={basis} /> : <Leer titel={BESTELLUNGEN.leer} text={BESTELLUNGEN.leerText} icon="ScrollText" aktion={darfAnlegen ? <Knopf href={`${basis}/neu`}>{BESTELLUNGEN.neu}</Knopf> : null} />
      ) : (
        <ListenKachel label={BESTELLUNGEN.titel} kopf={kopf} zeilen={zeilen} oben={<span className="tabular-nums">{BESTELLUNGEN.eintraege(daten.gesamt)}</span>} fuss={<Blaettern seite={daten.seite} limit={daten.limit} gesamt={daten.gesamt} href={(s) => href({ seite: s > 1 ? s : null })} />} />
      )}
    </Shell>
  );
}
