// Verträge (10-konzept-service §2.9, §2.10): Pflege und Wartung (Liste nach nächstem Termin) und Serviceaufträge (Kanban).
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { isoDatum } from "@/lib/backoffice/format";
import { personen, serviceClient, sicht } from "@/lib/backoffice/service/daten";
import { AUFTRAG_STATUS, PFLEGE_STATUS } from "@/lib/backoffice/service/labels";
import { datumLang, euro, personName } from "@/lib/backoffice/service/anzeige";
import { tageBis } from "@/lib/backoffice/service/fristen";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import { Pille } from "@/components/Backoffice/StatusBadge";
import ListeKachel from "@/components/Backoffice/Service/ListeKachel";
import ServiceKanban from "@/components/Backoffice/Service/ServiceKanban";
import { Status } from "@/components/Backoffice/Service/Teile";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verträge · Service" };

export default async function Vertraege({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("service", "read", "/service/vertraege");
  const client = serviceClient(session);
  const s = sicht(session);
  const art = sp.art === "auftraege" ? "auftraege" : "pflege";
  const heute = isoDatum();
  const p = await personen(client);
  let inhalt;
  let kennzahlen = [];
  if (art === "pflege") {
    const alle = await client.getList("PH Pflege Abo", { fields: ["name", "titel", "status", "art", "bereich", "kunde_name", "kontakt_email", "naechster_termin", "letzte_wartung", "ueberfaellig", "techniker", "nachkauf_einwilligung", "erinnerung_tage_vorher", "preis_cent", "intervall_monate"], orderBy: "naechster_termin asc", limit: 300 });
    const reiter = ["aktiv", "faellig", "ueberfaellig", "angebote", "ruhend"].includes(sp.reiter) ? sp.reiter : "aktiv";
    const faellig = (a) => a.status === "Aktiv" && a.naechster_termin && tageBis(a.naechster_termin, heute) <= Number(a.erinnerung_tage_vorher || 42) && !Number(a.ueberfaellig);
    const f = { aktiv: (a) => a.status === "Aktiv", faellig, ueberfaellig: (a) => a.status === "Aktiv" && !!Number(a.ueberfaellig), angebote: (a) => ["Angefragt", "Angeboten"].includes(a.status), ruhend: (a) => ["Pausiert", "Gekuendigt", "Beendet"].includes(a.status) };
    const liste = alle.filter(f[reiter]);
    kennzahlen = [{ wert: alle.filter(f.ueberfaellig).length, text: "Wartung überfällig" }, { wert: alle.filter(f.aktiv).length, text: "aktiv" }];
    inhalt = (
      <>
        <div className="mb-4">
          <Segment label="Reiter" aktiv={reiter} groesse="s" optionen={Object.entries(T.vertraege.preReiter).map(([k, t]) => ({ wert: k, titel: t, href: `/service/vertraege?art=pflege${k === "aktiv" ? "" : `&reiter=${k}`}`, anzahl: k === "ueberfaellig" ? alle.filter(f.ueberfaellig).length || undefined : undefined }))} />
        </div>
        {liste.length ? (
          <ListeKachel
            spalten={[{ titel: "Vertrag" }, { titel: "Status" }, { titel: "Nächste Wartung" }, { titel: "Letzte Wartung", nurAb: "lg" }, { titel: "Techniker", nurAb: "xl" }, { titel: "Nachkauf-Hinweise", nurAb: "xl" }]}
            zeilen={liste.map((a) => ({
              key: a.name,
              href: `/service/vertraege/pflege/${encodeURIComponent(a.name)}`,
              titel: a.kunde_name,
              unter: `${a.name} · ${a.art} · ${a.bereich}`,
              icon: "Sparkles",
              zellen: [
                <Status key="s" wert={a.status} map={PFLEGE_STATUS} groesse="sm" />,
                Number(a.ueberfaellig) ? <span key="n" className="bo-svc-gwl" data-ton="abgelaufen">überfällig seit {datumLang(a.naechster_termin)}</span> : a.naechster_termin ? <span key="n" className="bo-svc-gwl" data-ton={faellig(a) ? "warn" : "ok"}>{datumLang(a.naechster_termin)}</span> : "–",
                datumLang(a.letzte_wartung),
                personName(a.techniker, p),
                Number(a.nachkauf_einwilligung) ? <Pille key="e" material="salbei">eingewilligt</Pille> : <Pille key="e" material="stein">keine</Pille>,
              ],
            }))}
            fuss={<span>{liste.length} Verträge</span>}
            testid="pflege-liste"
          />
        ) : reiter === "ueberfaellig" ? (
          <Leer art="erledigt" text={T.vertraege.leerUeberfaellig} />
        ) : (
          <Leer text={T.vertraege.leerPflege} />
        )}
      </>
    );
  } else {
    const alle = await client.getList("PH Serviceauftrag", { fields: ["name", "titel", "status", "art", "kunde_name", "abholung_am", "rueckgabe_am", "lagerort", "preis_cent"], orderBy: "modified desc", limit: 300 });
    kennzahlen = [{ wert: alle.filter((a) => a.status === "Eingelagert").length, text: "eingelagert" }];
    const karte = (a) => ({ name: a.name, titel: a.kunde_name, unter: a.name, href: `/service/vertraege/auftraege/${encodeURIComponent(a.name)}`, chips: [{ text: a.art }, a.abholung_am ? { text: `Abholung ${datumLang(a.abholung_am)}` } : null, a.rueckgabe_am && a.status === "Eingelagert" ? { text: `Rückgabe ${datumLang(a.rueckgabe_am)}`, ton: tageBis(a.rueckgabe_am, heute) <= 14 ? "warn" : undefined } : null].filter(Boolean), hinweis: a.preis_cent ? euro(a.preis_cent) : "Preis auf Anfrage" });
    const spalten = ["Angefragt", "Angeboten", "Beauftragt", "Abgeholt", "Eingelagert", "In Arbeit", "Zurueckgebracht"].map((st) => ({ status: st, titel: AUFTRAG_STATUS[st].text, ton: AUFTRAG_STATUS[st].ton, eingeklappt: st === "Zurueckgebracht", karten: alle.filter((a) => a.status === st).map(karte) }));
    inhalt = alle.length ? <ServiceKanban art="auftrag" spalten={spalten} ziele={{}} nurLesen /> : <Leer text={T.vertraege.leerAuftraege} />;
  }
  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.vertraege.titel}
        krumen={[{ titel: "Service", href: "/service" }, { titel: T.vertraege.titel }]}
        kennzahlen={kennzahlen}
        aktionen={<Segment label="Art" aktiv={art} optionen={[{ wert: "pflege", titel: T.vertraege.art.pflege, href: "/service/vertraege" }, { wert: "auftraege", titel: T.vertraege.art.auftraege, href: "/service/vertraege?art=auftraege" }]} />}
        untertitel={!s.schreiben ? "Nur lesen" : undefined}
      />
      {inhalt}
    </Shell>
  );
}
