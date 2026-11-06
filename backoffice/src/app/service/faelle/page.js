// Servicefälle (T2/T3, 10-konzept-service §2.2): Reiter, Pillen-Suche, Liste oder Kanban; Sortierung nach Server-Rang.
import Link from "next/link";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { isoDatum } from "@/lib/backoffice/format";
import { ladeFaelle, ladeKatalog, ladeEinstellungen, personen, serviceClient, sicht, zaehleReaktion } from "@/lib/backoffice/service/daten";
import { naechsteSchritte } from "@/lib/backoffice/service/dienst";
import { fallZeile } from "@/lib/backoffice/service/zeilen";
import { FALL_STATUS } from "@/lib/backoffice/service/labels";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import { Icon } from "@/components/Backoffice/icons";
import { MeldenKnopf } from "@/components/Backoffice/Service/Melden";
import FaelleTabelle from "@/components/Backoffice/Service/FaelleTabelle";
import ServiceKanban from "@/components/Backoffice/Service/ServiceKanban";

export const dynamic = "force-dynamic";
export const metadata = { title: "Servicefälle · Service" };

const REITER = ["alle", "meine", "neu", "reaktion", "gewaehrleistung", "eskaliert", "erledigt"];

function link(basis, params, aenderung) {
  const p = new URLSearchParams(Object.entries({ ...params, ...aenderung }).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  const qs = p.toString();
  return qs ? `${basis}?${qs}` : basis;
}

export default async function Faelle({ searchParams }) {
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
  const session = await requireRecht("service", "read", "/service/faelle");
  const client = serviceClient(session);
  const s = sicht(session);
  const reiter = REITER.includes(sp.reiter) ? sp.reiter : "alle";
  const ansicht = sp.ansicht === "kanban" ? "kanban" : "liste";
  const params = { reiter: reiter === "alle" ? "" : reiter, ansicht: ansicht === "liste" ? "" : ansicht, q: sp.q || "", status: sp.status || "", art: sp.art || "" };
  const [katalog, einst, p, reaktion] = await Promise.all([ladeKatalog(client).catch(() => ({ bereiche: [], codes: [] })), ladeEinstellungen(client), personen(client), zaehleReaktion(client, isoDatum())]);
  const heute = new Date();
  const warn = Number(einst.fristwarnung_tage) || 60;

  let inhalt;
  let gesamt = 0;
  if (ansicht === "kanban") {
    const liste = await client.getList("PH Servicefall", { fields: ["name", "titel", "status", "kunde_name", "produkt_name", "fehlercode", "fehlercode_bezeichnung", "art", "verantwortlich", "letzte_bewegung", "gewaehrleistung_bis", "gemeldet_am", "erstreaktion_am", "frist_reaktion", "frist_loesung", "entscheidung", "kulanz_freigabe_status", "lieferantenrelevant", "kunde_informiert_am", "abnahme_bestaetigt", "regress_frist_bis", "kunde_email", "einsatz_ort", "sla_status", "eskalationsstufe", "sla_eskalationsstufe", "erstauftreten", "beweislast_bis", "kundentyp", "sla_reaktion_verletzt", "sla_loesung_verletzt"], filters: [["status", "in", ["Gemeldet", "Geprueft", "Entscheidung", "In Bearbeitung", "Einsatz geplant", "Erledigt"]]], orderBy: "gemeldet_am desc", limit: 300 });
    const schritte = await naechsteSchritte(client, liste.map((f) => f.name));
    gesamt = liste.length;
    const eskTage = Number(einst.eskalation_tage) || 5;
    const karte = (f) => {
      const z = fallZeile({ ...f, schritt: schritte[f.name] }, { heute, warnTage: warn, personen: p, leitung: s.leitung });
      return {
        name: f.name,
        titel: z.titel,
        unter: [f.name, f.fehlercode].filter(Boolean).join(" · "),
        href: `/service/faelle/${encodeURIComponent(f.name)}`,
        chips: [z.signal ? { text: z.signal.text, ton: "gefahr" } : z.gwl.text ? { text: z.gwl.text, ton: z.gwl.ton === "warn" ? "warn" : undefined } : null, f.status === "Einsatz geplant" ? { text: "Einsatz geplant" } : null, z.ruhtTage !== null && z.ruhtTage >= eskTage - 1 ? { text: T.faelle.ruht(z.ruhtTage) } : null].filter(Boolean),
        hinweis: z.knopf.titel,
        person: z.verantwortlichName,
      };
    };
    const spalten = [
      { status: "Gemeldet", titel: "Gemeldet", ton: FALL_STATUS.Gemeldet.ton, karten: liste.filter((f) => f.status === "Gemeldet").map(karte) },
      { status: "Geprueft", titel: "Geprüft", ton: FALL_STATUS.Geprueft.ton, karten: liste.filter((f) => f.status === "Geprueft").map(karte) },
      { status: "Entscheidung", titel: "Entschieden", ton: FALL_STATUS.Entscheidung.ton, karten: liste.filter((f) => f.status === "Entscheidung").map(karte) },
      { status: "In Bearbeitung", titel: "In Bearbeitung", ton: FALL_STATUS["In Bearbeitung"].ton, karten: liste.filter((f) => ["In Bearbeitung", "Einsatz geplant"].includes(f.status)).map(karte) },
      { status: "Erledigt", titel: "Erledigt", ton: FALL_STATUS.Erledigt.ton, eingeklappt: true, karten: liste.filter((f) => f.status === "Erledigt").map(karte) },
      { status: "Geschlossen", titel: "Geschlossen", ton: FALL_STATUS.Geschlossen.ton, eingeklappt: true, karten: [] },
    ];
    const ziele = { Gemeldet: ["Geprueft"], Geprueft: ["Entscheidung"], Entscheidung: ["In Bearbeitung"], "In Bearbeitung": ["Erledigt"], Erledigt: ["Geschlossen"] };
    inhalt = <ServiceKanban art="fall" spalten={spalten} ziele={ziele} nurLesen={!s.schreiben || s.techniker} />;
  } else {
    const seite = Math.max(1, Number(sp.seite) || 1);
    const d = await ladeFaelle(client, session, { ...params, seite });
    gesamt = d.gesamt;
    const zeilen = d.zeilen.map((f) => fallZeile(f, { heute, warnTage: warn, personen: p, leitung: s.leitung }));
    const von = d.gesamt ? (seite - 1) * d.groesse + 1 : 0;
    const bis = Math.min(d.gesamt, seite * d.groesse);
    const gefiltert = !!(params.q || params.status || params.art);
    inhalt = zeilen.length ? (
      <FaelleTabelle zeilen={zeilen} gesamt={d.gesamt} von={von} bis={bis} weiter={bis < d.gesamt ? link("/service/faelle", params, { seite: seite + 1 }) : null} zurueck={seite > 1 ? link("/service/faelle", params, { seite: seite - 1 }) : null} ich={session.user} darfSchreiben={s.schreiben && !s.techniker} />
    ) : gefiltert ? (
      <Leer art="gefiltert" text={T.faelle.leerFilter(params.q ? `„${params.q}“` : "diesem Filter")} zuruecksetzenHref={link("/service/faelle", { reiter: params.reiter }, {})} testid="faelle-leer" />
    ) : reiter === "meine" ? (
      <Leer art="erledigt" text={T.faelle.leerMeine} testid="faelle-leer" />
    ) : reiter === "reaktion" ? (
      <Leer art="erledigt" text={T.faelle.leerReaktion} testid="faelle-leer" />
    ) : (
      <Leer text={T.faelle.leerAlle} testid="faelle-leer" />
    );
  }

  const reiterOptionen = REITER.map((r) => ({
    wert: r,
    titel: T.faelle.reiter[r].replace("60", String(warn)),
    href: link("/service/faelle", { ...params, seite: "" }, { reiter: r === "alle" ? "" : r }),
    anzahl: r === "reaktion" ? reaktion || undefined : r === reiter && ansicht === "liste" ? gesamt : undefined,
  }));

  return (
    <Shell session={session}>
      <Seitenkopf
        titel={T.faelle.titel}
        krumen={[{ titel: "Service", href: "/service" }, { titel: T.faelle.titel }]}
        kennzahlen={[{ wert: reaktion, text: T.faelle.reiter.reaktion }]}
        aktionen={
          <>
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "liste", titel: T.faelle.ansicht.liste, href: link("/service/faelle", params, { ansicht: "" }), icon: "Rows3" }, { wert: "kanban", titel: T.faelle.ansicht.kanban, href: link("/service/faelle", params, { ansicht: "kanban" }), icon: "Columns3" }]} />
            {s.schreiben && !s.techniker && <MeldenKnopf katalog={katalog} telefonIstErstreaktion={!!Number(einst.telefon_ist_erstreaktion)} />}
          </>
        }
        unternav={
          ansicht === "liste" ? (
            <>
              <div className="bo-scroll-x min-w-0 max-w-full overflow-x-auto">
                <Segment label="Reiter" aktiv={reiter} optionen={reiterOptionen} groesse="s" />
              </div>
              <form action="/service/faelle" className="bo-suche w-full sm:w-80" role="search">
                <Icon name="Search" className="size-4 shrink-0" />
                {params.reiter && <input type="hidden" name="reiter" value={params.reiter} />}
                <input name="q" defaultValue={params.q} placeholder={T.faelle.suche} aria-label={T.faelle.suche} data-testid="faelle-suche" />
              </form>
            </>
          ) : (
            <p className="text-[14px] text-bo-text-soft">
              {gesamt} offene und erledigte Fälle · Abgelehnt und Geschlossen über die <Link className="underline" href="/service/faelle?reiter=erledigt">Liste</Link>
            </p>
          )
        }
      />
      {inhalt}
    </Shell>
  );
}
