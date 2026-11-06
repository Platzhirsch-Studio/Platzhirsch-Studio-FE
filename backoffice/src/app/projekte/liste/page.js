import { requireRecht } from "@/lib/backoffice/auth/dal";
import { darfUebergang } from "@/lib/backoffice/auth/rechte";
import { ladeWorkflow } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Knopf from "@/components/Backoffice/Knopf";
import Leer from "@/components/Backoffice/Leer";
import Kachel from "@/components/Backoffice/Kachel";
import { AvatarReihe } from "@/components/Backoffice/Avatar";
import { Icon } from "@/components/Backoffice/icons";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import ProjektKanban from "@/components/Backoffice/Projekte/ProjektKanban";
import { Fortschritt, ProjektBild, ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { MiniGantt } from "@/components/Backoffice/Projekte/MappeTabs";
import { heuteIso, ladeProjektZeilen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { LAUFEND, tonKarte } from "@/lib/backoffice/projekte/status";
import { phasenFortschritt, terminText } from "@/lib/backoffice/projekte/anzeige";
import { miniGantt } from "@/lib/backoffice/projekte/mappe";
import { gewerkKonflikte } from "@/lib/backoffice/projekte/regeln";
import { PHASEN, TEXTE, statusText } from "@/lib/backoffice/projekte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projekte · Liste" };

const L = TEXTE.liste;
const ALLE_STATUS = [...PHASEN, "Abgebrochen"];

/** Projekte (T2, § 5.2): Liste · Kanban · Zeitplan, Filter in der URL. */
export default async function ProjektListe({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/liste");
  const client = projekteClient(session);
  const heute = heuteIso();
  const ansicht = ["liste", "kanban", "zeitplan"].includes(sp.ansicht) ? sp.ansicht : "liste";
  const status = sp.status && ALLE_STATUS.includes(sp.status) ? sp.status : sp.status === "alle" ? "alle" : "laufend";
  const q = String(sp.q || "").trim().slice(0, 60).toLowerCase();
  const alle = await ladeProjektZeilen(client, session, { heute });
  const zahl = (s) => alle.filter((p) => p.status === s).length;
  let zeilen = alle.filter((p) => (status === "alle" ? true : status === "laufend" ? LAUFEND.includes(p.status) : p.status === status));
  if (q) zeilen = zeilen.filter((p) => [p.titel, p.kunde_name, p.name, p.objekt_ort].some((x) => String(x || "").toLowerCase().includes(q)));
  if (sp.projekt) zeilen = zeilen.filter((p) => p.name === sp.projekt);
  const basis = (extra = {}) => {
    const u = new URLSearchParams({ ...(ansicht !== "liste" ? { ansicht } : {}), ...(status !== "laufend" ? { status } : {}), ...(q ? { q } : {}), ...extra });
    for (const [k, v] of [...u.entries()]) if (!v) u.delete(k);
    const s = u.toString();
    return `/projekte/liste${s ? `?${s}` : ""}`;
  };

  const statusOptionen = [
    { wert: "laufend", titel: L.laufend, anzahl: alle.filter((p) => LAUFEND.includes(p.status)).length, href: basis({ status: "" }) },
    ...PHASEN.filter((s) => zahl(s)).map((s) => ({ wert: s, titel: statusText("PH Projekt", s), anzahl: zahl(s), href: basis({ status: s }) })),
    ...(zahl("Abgebrochen") ? [{ wert: "Abgebrochen", titel: "Abgebrochen", anzahl: zahl("Abgebrochen"), href: basis({ status: "Abgebrochen" }) }] : []),
    { wert: "alle", titel: TEXTE.uebersicht.umfangAlle, anzahl: alle.length, href: basis({ status: "alle" }) },
  ];

  let inhalt;
  if (ansicht === "kanban") {
    const wf = await ladeWorkflow(client, "PH Projekt");
    const zuStatus = Object.fromEntries((wf?.states || []).map((s) => [s.state, s.updateValue]));
    const uebergaenge = {};
    for (const t of wf?.transitions || []) {
      if (!darfUebergang(session, t) || t.action === "Zurück" || t.action === "Zurück auf Neu") continue;
      const von = zuStatus[t.state];
      (uebergaenge[von] ||= []).push({ action: t.action, nachStatus: zuStatus[t.nextState] });
    }
    const spalten = ALLE_STATUS.map((s) => ({ status: s, karten: zeilen.filter((p) => p.status === s).map((p) => ({ ...p, berater: p.team?.[0]?.name || p.berater, kunde: p.kunde_name, termin: p.termin ? terminText(p.termin.start, heute) : "" })) })).filter((s) => status !== "laufend" || LAUFEND.includes(s.status));
    inhalt = <ProjektKanban spalten={spalten} uebergaenge={uebergaenge} statusTon={tonKarte("PH Projekt")} kartenFelder={[{ fieldname: "kunde", label: "Kunde" }, { fieldname: "termin", label: "Nächster Termin" }, { fieldname: "berater", label: "Berater" }]} />;
  } else if (ansicht === "zeitplan") {
    const [montagen, gewerke, abnahmen] = await Promise.all([
      client.getList("PH Montageauftrag", { fields: ["name", "projekt", "start", "ende", "status"], filters: [["status", "!=", "Abgebrochen"]], limit: 500 }).catch(() => []),
      client.getList("PH Fremdgewerk", { fields: ["name", "projekt", "gewerk", "status", "termin_von", "termin_bis"], limit: 500 }).catch(() => []),
      client.getList("PH Abnahme", { fields: ["name", "projekt", "datum", "status"], limit: 200 }).catch(() => []),
    ]);
    const konflikte = gewerkKonflikte(gewerke, montagen);
    const reihen = zeilen
      .map((p) => ({ p, g: miniGantt({ projekt: p, montagen: montagen.filter((x) => x.projekt === p.name), gewerke: gewerke.filter((x) => x.projekt === p.name), abnahmen: abnahmen.filter((x) => x.projekt === p.name) }, heute, 12) }))
      .filter((r) => r.g.zeilen.length);
    inhalt = reihen.length ? (
      <div className="flex flex-col gap-4">
        {konflikte.length > 0 && (
          <div className="rounded-[20px] bg-bo-warning-soft px-5 py-4 text-[14px] leading-5 text-bo-warning-text" role="status">
            {konflikte.map((k) => (
              <p key={`${k.gewerk}-${k.montage}`} className="flex items-start gap-2">
                <Icon name="TriangleAlert" className="mt-0.5 size-4 shrink-0" />
                {TEXTE.fremdgewerke.konflikt(k.gewerkName, terminText(k.ende, heute), terminText(k.start, heute))}
              </p>
            ))}
          </div>
        )}
        {reihen.map(({ p, g }) => (
          <Kachel key={p.name} titel={<a href={`/projekte/${encodeURIComponent(p.name)}`} className="hover:underline">{p.titel}</a>} unter={`${p.kunde_name || ""} · ${statusText("PH Projekt", p.status)}`} dicht testid="zeitplan-reihe">
            <MiniGantt g={g} />
          </Kachel>
        ))}
      </div>
    ) : (
      <Leer titel={L.zeitplanLeer} />
    );
  } else {
    inhalt = (
      <Tabelle
        titel={L.titel}
        unter={L.gesamt(zeilen.length, alle.length)}
        testid="projekt-liste"
        spalten={[{ titel: L.spalten.projekt }, { titel: L.spalten.phase }, { titel: L.spalten.team, versteckt: "max-xl:hidden" }, { titel: L.spalten.termin }, { titel: L.spalten.rueck, rechts: true, versteckt: "max-lg:hidden" }, { titel: L.spalten.maengel, rechts: true, versteckt: "max-lg:hidden" }]}
        zeilen={zeilen.map((p) => ({
          key: p.name,
          href: `/projekte/${encodeURIComponent(p.name)}`,
          vorne: <ProjektBild src={p.bild} art={p.projektart} />,
          titel: p.titel,
          unter: [p.kunde_name, p.objekt_ort, p.name].filter(Boolean).join(" · "),
          zellen: [
            <div key="s" className="flex flex-col items-start"><ProjektStatus wert={p.status} /><Fortschritt prozent={phasenFortschritt(p.status)} label={`Fortschritt ${phasenFortschritt(p.status)} %`} /></div>,
            p.team?.length ? <AvatarReihe key="t" personen={p.team} max={3} /> : null,
            p.termin ? <span key="d" className="block"><span className="block tabular-nums">{terminText(p.termin.start, heute)}</span><span className="bo-prj-unter block">{p.termin.titel}</span></span> : <span key="d" className="text-[13px] text-bo-text-soft">{TEXTE.mappe.keinTermin}</span>,
            p.rueckmeldungen || "–",
            p.maengel || "–",
          ],
        }))}
        leer={alle.length ? <Leer art="gefiltert" groesse="karte" titel={L.leerFilter} zuruecksetzenHref="/projekte/liste" /> : <Leer groesse="karte" titel={TEXTE.uebersicht.leer} aktion={<Knopf variant="primary" href="/projekte/neu">{TEXTE.uebersicht.neu}</Knopf>} />}
      />
    );
  }

  return (
    <Shell session={session} breit={ansicht === "kanban"}>
      <Seitenkopf
        titel={L.titel}
        krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: L.titel }]}
        aktionen={
          <>
            <Segment label={L.ansicht} aktiv={ansicht} optionen={[{ wert: "liste", titel: L.liste, icon: "Rows3", href: basis({ ansicht: "" }) }, { wert: "kanban", titel: L.kanban, icon: "Columns3", href: basis({ ansicht: "kanban" }) }, { wert: "zeitplan", titel: L.zeitplan, icon: "CalendarDays", href: basis({ ansicht: "zeitplan" }) }]} testid="ansicht" />
            <Knopf variant="primary" icon="Plus" href="/projekte/neu">{TEXTE.uebersicht.neu}</Knopf>
          </>
        }
        unternav={
          <div className="bo-prj-filter w-full">
            <Segment label="Phase" groesse="s" aktiv={status} optionen={statusOptionen} testid="status-filter" />
            <form action="/projekte/liste" className="bo-prj-suche ml-auto" role="search">
              {ansicht !== "liste" && <input type="hidden" name="ansicht" value={ansicht} />}
              {status !== "laufend" && <input type="hidden" name="status" value={status} />}
              <Icon name="Search" className="size-4 shrink-0" />
              <input name="q" defaultValue={q} placeholder={L.suche} aria-label={L.suche} />
            </form>
          </div>
        }
      />
      {inhalt}
    </Shell>
  );
}
