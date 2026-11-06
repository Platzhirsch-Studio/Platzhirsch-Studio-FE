// Ersatzteile und Bestellungen (T2/T3, 10-konzept-service §2.6, §2.7). Verkaufsware (mit Produkt / Pflegemittel)
// führt hier keinen Bestand (B-06) – Kennzeichen „Bestand in Logistik“, keine Bewegung.
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { isoDatum } from "@/lib/backoffice/format";
import { serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { BESTELLUNG_STATUS } from "@/lib/backoffice/service/labels";
import { datumLang, euro } from "@/lib/backoffice/service/anzeige";
import { tageBis } from "@/lib/backoffice/service/fristen";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import NurIntern from "@/components/Backoffice/Kundenmodus/NurIntern";
import ListeKachel from "@/components/Backoffice/Service/ListeKachel";
import ServiceKanban from "@/components/Backoffice/Service/ServiceKanban";
import { Status } from "@/components/Backoffice/Service/Teile";
import { BewegungKnopf } from "@/components/Backoffice/Service/TeileAktionen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ersatzteile · Service" };

const ohneBestand = (t) => !Number(t.bestand_fuehren) || !!t.produkt || t.kategorie === "Pflegemittel";

export default async function Ersatzteile({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("service", "read", "/service/ersatzteile");
  const client = serviceClient(session);
  const s = sicht(session);
  const ansicht = sp.ansicht === "bestellungen" ? "bestellungen" : "teile";
  const heute = isoDatum();
  const href = (a) => {
    const q = new URLSearchParams(Object.entries({ ansicht: ansicht === "teile" ? "" : ansicht, reiter: sp.reiter || "", kanban: sp.kanban || "", ...a }).filter(([, v]) => v));
    return `/service/ersatzteile${q.toString() ? `?${q}` : ""}`;
  };
  let inhalt;
  let kennzahlen = [];
  let aktion = null;

  if (ansicht === "teile") {
    const teile = await client.getList("PH Ersatzteil", { fields: ["name", "bezeichnung", "hersteller_nr", "marke", "lieferant", "kategorie", "bestand", "reserviert", "verfuegbar", "mindestbestand", "lagerplatz", "status", "produkt", "bestand_fuehren", "ek_cent", "vk_cent", "bild"], orderBy: "bezeichnung asc", limit: 500 });
    const reiter = ["alle", "unter", "reserviert", "auslaufend", "ohne"].includes(sp.reiter) ? sp.reiter : "alle";
    const unter = (t) => !ohneBestand(t) && Number(t.verfuegbar) < Number(t.mindestbestand);
    const gefiltert = teile.filter((t) => (reiter === "unter" ? unter(t) : reiter === "reserviert" ? Number(t.reserviert) > 0 : reiter === "auslaufend" ? t.status === "Auslaufend" : reiter === "ohne" ? ohneBestand(t) : true));
    kennzahlen = [{ wert: teile.filter(unter).length, text: T.ersatzteile.reiter.unter }];
    aktion = s.schreiben ? <BewegungKnopf primaer teile={teile.filter((t) => !ohneBestand(t)).map((t) => ({ name: t.name, titel: `${t.bezeichnung} · ${t.hersteller_nr}`, bestand: t.bestand }))} /> : null;
    inhalt = (
      <>
        <div className="mb-4">
          <Segment label="Reiter" aktiv={reiter} groesse="s" optionen={Object.entries(T.ersatzteile.reiter).map(([k, t]) => ({ wert: k, titel: t, href: href({ reiter: k === "alle" ? "" : k }), anzahl: k === "unter" ? teile.filter(unter).length || undefined : undefined }))} />
        </div>
        {gefiltert.length ? (
          <ListeKachel
            spalten={[{ titel: "Ersatzteil" }, { titel: "Marke", nurAb: "lg" }, { titel: "Bestand", rechts: true }, { titel: "Reserviert", rechts: true, nurAb: "lg" }, { titel: "Verfügbar" }, { titel: "Mindest", rechts: true, nurAb: "lg" }, { titel: "Lagerplatz", nurAb: "xl" }, ...(s.kosten ? [{ titel: "EK", rechts: true, nurAb: "xl" }] : [])]}
            zeilen={gefiltert.map((t) => ({
              key: t.name,
              href: `/service/ersatzteile/${encodeURIComponent(t.name)}`,
              titel: t.bezeichnung,
              unter: `${t.hersteller_nr || "–"} · ${t.kategorie || ""}`,
              icon: "Package",
              zellen: [
                t.marke || "–",
                ohneBestand(t) ? "–" : t.bestand,
                ohneBestand(t) ? "–" : t.reserviert,
                ohneBestand(t) ? <Pille key="l" material="stein">{T.ersatzteile.bestandLogistik}</Pille> : unter(t) ? <span key="u" className="bo-svc-gwl" data-ton="abgelaufen">{t.verfuegbar} · {T.ersatzteile.unterMindest}</span> : <span key="v" className="tabular-nums">{t.verfuegbar}</span>,
                ohneBestand(t) ? "–" : t.mindestbestand,
                t.lagerplatz || "–",
                ...(s.kosten ? [<NurIntern key="ek">{euro(t.ek_cent)}</NurIntern>] : []),
              ],
            }))}
            fuss={<span>{gefiltert.length} Ersatzteile</span>}
            testid="ersatzteile-liste"
          />
        ) : reiter === "unter" ? (
          <Leer art="erledigt" text={T.ersatzteile.leerUnter} />
        ) : (
          <Leer text={T.ersatzteile.leer} />
        )}
      </>
    );
  } else {
    const best = await client.getList("PH Ersatzteilbestellung", { fields: ["name", "titel", "status", "lieferant", "servicefall", "kommission", "datum", "erwartet_am", "lieferant_referenz", "ueberfaellig", "summe_ek_cent", "kostentraeger"], orderBy: "datum desc", limit: 300 });
    const reiter = ["offen", "erwartet", "ueberfaellig", "lager", "alle"].includes(sp.reiter) ? sp.reiter : "offen";
    const ueberf = (b) => ["Gesendet", "Bestaetigt", "Teilgeliefert"].includes(b.status) && b.erwartet_am && b.erwartet_am < heute;
    const gefiltert = best.filter((b) => (reiter === "offen" ? !["Geliefert", "Storniert"].includes(b.status) : reiter === "erwartet" ? ["Bestaetigt", "Teilgeliefert"].includes(b.status) : reiter === "ueberfaellig" ? ueberf(b) : reiter === "lager" ? !b.servicefall : true));
    kennzahlen = [{ wert: best.filter(ueberf).length, text: T.ersatzteile.breiter.ueberfaellig }];
    if (sp.kanban === "1") {
      const karte = (b) => ({ name: b.name, titel: b.lieferant, unter: b.name, href: `/service/ersatzteile/bestellungen/${encodeURIComponent(b.name)}`, chips: [ueberf(b) ? { text: T.ersatzteile.ueberfaelligSeit(-tageBis(b.erwartet_am, heute)), ton: "gefahr" } : b.erwartet_am ? { text: `erwartet ${datumLang(b.erwartet_am)}` } : null, b.kommission ? { text: "Kommission" } : null].filter(Boolean), hinweis: b.titel?.split(": ")[1] });
      inhalt = <ServiceKanban art="bestellung" spalten={["Entwurf", "Gesendet", "Bestaetigt", "Teilgeliefert"].map((st) => ({ status: st, titel: BESTELLUNG_STATUS[st].text, ton: BESTELLUNG_STATUS[st].ton, karten: best.filter((b) => b.status === st).map(karte) }))} ziele={{ Entwurf: ["Gesendet"], Gesendet: ["Bestaetigt"], Bestaetigt: ["Teilgeliefert"] }} nurLesen={!s.schreiben} />;
    } else
      inhalt = (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segment label="Reiter" aktiv={reiter} groesse="s" optionen={Object.entries(T.ersatzteile.breiter).map(([k, t]) => ({ wert: k, titel: t, href: href({ reiter: k === "offen" ? "" : k }), anzahl: k === "ueberfaellig" ? best.filter(ueberf).length || undefined : undefined }))} />
            <Segment label="Darstellung" aktiv="liste" groesse="s" optionen={[{ wert: "liste", titel: "Liste", href: href({}) }, { wert: "kanban", titel: "Kanban", href: href({ kanban: "1" }) }]} />
          </div>
          {gefiltert.length ? (
            <ListeKachel
              spalten={[{ titel: "Bestellung" }, { titel: "Status" }, { titel: "Fall", nurAb: "lg" }, { titel: "Datum", nurAb: "xl" }, { titel: "Erwartet" }, { titel: "AB-Referenz", nurAb: "xl" }, ...(s.kosten ? [{ titel: "Summe EK", rechts: true, nurAb: "lg" }] : [])]}
              zeilen={gefiltert.map((b) => ({ key: b.name, href: `/service/ersatzteile/bestellungen/${encodeURIComponent(b.name)}`, titel: b.lieferant, unter: `${b.name} · ${b.titel?.split(": ")[1] || ""}`, icon: "Truck", zellen: [<Status key="s" wert={b.status} map={BESTELLUNG_STATUS} groesse="sm" />, b.servicefall || "Lager", datumLang(b.datum), ueberf(b) ? <span key="e" className="bo-svc-gwl" data-ton="abgelaufen">{T.ersatzteile.ueberfaelligSeit(-tageBis(b.erwartet_am, heute))}</span> : datumLang(b.erwartet_am), b.lieferant_referenz || "–", ...(s.kosten ? [<NurIntern key="k">{euro(b.summe_ek_cent)}</NurIntern>] : [])] }))}
              fuss={<span>{gefiltert.length} Bestellungen</span>}
              testid="bestellungen-liste"
            />
          ) : reiter === "ueberfaellig" ? (
            <Leer art="erledigt" text={T.ersatzteile.leerUeberfaellig} />
          ) : (
            <Leer text={T.ersatzteile.leerBestellungen} />
          )}
        </>
      );
  }

  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.ersatzteile.titel}
        krumen={[{ titel: "Service", href: "/service" }, { titel: T.ersatzteile.titel }]}
        kennzahlen={kennzahlen}
        aktionen={
          <>
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "teile", titel: T.ersatzteile.ansicht.teile, href: "/service/ersatzteile" }, { wert: "bestellungen", titel: T.ersatzteile.ansicht.bestellungen, href: "/service/ersatzteile?ansicht=bestellungen" }]} />
            {aktion}
          </>
        }
      />
      {inhalt}
    </Shell>
  );
}
