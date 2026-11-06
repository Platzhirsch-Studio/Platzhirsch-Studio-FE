import { requireRecht } from "@/lib/backoffice/auth/dal";
import { darfUebergang } from "@/lib/backoffice/auth/rechte";
import { ladeWorkflow } from "@/lib/backoffice/frappe";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { AvatarReihe } from "@/components/Backoffice/Avatar";
import Tabelle from "@/components/Backoffice/Projekte/Tabelle";
import { ProjektBild, ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { MontageKalender, MontageKanban } from "@/components/Backoffice/Projekte/MontageKalender";
import { heuteIso, ladeEinstellungen, ladeMontagen, personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { doppelbuchungen, kapazitaet } from "@/lib/backoffice/projekte/montage";
import { tonKarte } from "@/lib/backoffice/projekte/status";
import { terminText } from "@/lib/backoffice/projekte/anzeige";
import { TEXTE, fmtH, statusText } from "@/lib/backoffice/projekte/texte";
import { kwText } from "@/lib/backoffice/projekte/mappe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Montagen · Projekte" };
const T = TEXTE.montagen;
const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/** Montagen (T4, § 5.8): Kalender (Standard) · Kanban · Liste, Kapazität je Tag, Nicht eingeplant. */
export default async function Montagen({ searchParams }) {
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", "/projekte/montagen");
  const client = projekteClient(session);
  const heute = heuteIso();
  const ansicht = ["kalender", "kanban", "liste"].includes(sp.ansicht) ? sp.ansicht : "kalender";
  const d = new Date(`${heute}T12:00:00`);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const woche = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
  const [alle, einst, projekte, gewerke] = await Promise.all([
    ladeMontagen(client, {}),
    ladeEinstellungen(client),
    client.getList("PH Projekt", { fields: ["name", "titel", "status", "kunde_name", "objekt_ort", "liefertermin_geplant"], limit: 500 }).catch(() => []),
    client.getList("PH Fremdgewerk", { fields: ["name", "projekt", "gewerk", "partner_text", "status", "termin_von", "termin_bis"], filters: [["status", "in", ["Geplant", "In Arbeit", "Angefragt"]]], limit: 300 }).catch(() => []),
  ]);
  const projekt = Object.fromEntries(projekte.map((p) => [p.name, p]));
  const leute = await personen(client, alle.flatMap((m) => [m.montageleiter, ...(m.team || []).map((t) => t.user)]));
  const kap = kapazitaet(alle, woche, { monteure: 2, tagesstunden: Number(einst.montage_tagesstunden) || 8 });
  const doppelt = doppelbuchungen(alle.filter((m) => woche.includes(String(m.start).slice(0, 10))));
  const mitMontage = new Set(alle.filter((m) => m.status !== "Abgebrochen").map((m) => m.projekt));
  const nichtEingeplant = projekte.filter((p) => p.status === "Lieferung" && !mitMontage.has(p.name));
  const basis = (a) => (a === "kalender" ? "/projekte/montagen" : `/projekte/montagen?ansicht=${a}`);

  let inhalt;
  if (ansicht === "kalender") {
    const eintraege = [
      ...alle.filter((m) => m.status !== "Abgebrochen").map((m) => ({
        id: m.name,
        quelle: "montage",
        titel: `${projekt[m.projekt]?.titel || m.titel} · ${statusText("PH Montageauftrag", m.status)}`,
        unter: (m.team || []).map((t) => leute[t.user]?.name).filter(Boolean).join(", "),
        start: String(m.start).slice(0, 16),
        ende: String(m.ende || "").slice(0, 16),
        personen: (m.team || []).map((t) => leute[t.user]?.name || t.user),
        ort: m.ort,
        href: `/projekte/montagen/${encodeURIComponent(m.name)}`,
        verschiebbar: ["Geplant", "Unterwegs"].includes(m.status),
      })),
      ...gewerke.filter((g) => g.termin_von).map((g) => ({ id: g.name, quelle: "termin", ganztag: true, titel: `${g.gewerk} · ${projekt[g.projekt]?.titel || ""}`, unter: g.partner_text, start: String(g.termin_von).slice(0, 10), ende: String(g.termin_bis || g.termin_von).slice(0, 10), href: `/projekte/fremdgewerke?gewerk=${encodeURIComponent(g.name)}` })),
    ];
    inhalt = (
      <div className="flex flex-col gap-6">
        <Kachel titel={T.kapazitaet} unter={`${kwText(woche[0])} · 2 Monteure × ${fmtH(Number(einst.montage_tagesstunden) || 8)} h · ${T.abwesenheiten}`} testid="kapazitaet">
          <div className="bo-prj-kap">
            {kap.map((k) => {
              const dt = new Date(`${k.tag}T12:00:00`);
              return (
                <div key={k.tag} className="bo-prj-kap__tag" data-heute={k.tag === heute ? "" : undefined} data-ueber={k.ueber ? "" : undefined}>
                  <span className="text-[13px] font-semibold">{WT[dt.getDay()]} {k.tag.slice(8, 10)}.{k.tag.slice(5, 7)}.</span>
                  <span className={`text-[12px] tabular-nums ${k.ueber ? "font-medium text-bo-warning-text" : "text-bo-text-soft"}`}>{k.ueber ? T.ueber(k.ist, k.soll) : T.tag(k.ist, k.soll)}</span>
                  <span className="bo-prj-kap__balken" role="img" aria-label={`${k.prozent} % ausgelastet`}>
                    <span style={{ width: `${Math.min(100, k.prozent)}%` }} />
                  </span>
                </div>
              );
            })}
          </div>
          {doppelt.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 text-[13px] text-bo-warning-text" role="status">
              {doppelt.map((x) => (
                <li key={`${x.user}-${x.a}-${x.b}`}>{T.doppelt(leute[x.user]?.name || x.user, `${x.a} und ${x.b}`)}</li>
              ))}
            </ul>
          )}
        </Kachel>
        <MontageKalender eintraege={eintraege} datum={heute} />
        <Kachel titel={T.nichtEingeplant} unter={T.nichtEingeplantUnter} id="nicht-eingeplant" testid="nicht-eingeplant">
          {nichtEingeplant.length ? (
            <ul className="bo-prj-liste">
              {nichtEingeplant.map((p) => (
                <li key={p.name}>
                  <ProjektBild klein art="Kueche" />
                  <span className="min-w-0 flex-1">
                    <span className="bo-prj-titel block truncate">{p.titel}</span>
                    <span className="bo-prj-unter block">{[p.kunde_name, p.objekt_ort, p.liefertermin_geplant ? `Lieferung ${kwText(p.liefertermin_geplant)}` : ""].filter(Boolean).join(" · ")}</span>
                  </span>
                  <Knopf size="s" href={`/projekte/${encodeURIComponent(p.name)}`}>{TEXTE.planenSheet.anlegen.replace("anlegen", "planen")}</Knopf>
                </li>
              ))}
            </ul>
          ) : (
            <Leer art="erledigt" groesse="karte" titel={T.nichtEingeplantLeer} />
          )}
        </Kachel>
      </div>
    );
  } else if (ansicht === "kanban") {
    const wf = await ladeWorkflow(client, "PH Montageauftrag");
    const zuStatus = Object.fromEntries((wf?.states || []).map((s) => [s.state, s.updateValue]));
    const uebergaenge = {};
    for (const t of wf?.transitions || []) {
      if (!darfUebergang(session, t) || t.action === "Zurück" || t.action === "Abbrechen") continue;
      const von = zuStatus[t.state];
      const liste = (uebergaenge[von] ||= []);
      if (!liste.some((x) => x.action === t.action)) liste.push({ action: t.action, nachStatus: zuStatus[t.nextState] });
    }
    const status = ["Geplant", "Unterwegs", "In Arbeit", "Erledigt", "Abgenommen"];
    inhalt = <MontageKanban statusTon={tonKarte("PH Montageauftrag")} uebergaenge={uebergaenge} spalten={status.map((s) => ({ status: s, karten: alle.filter((m) => m.status === s).map((m) => ({ name: m.name, titel: projekt[m.projekt]?.titel || m.titel, status: m.status, termin: terminText(m.start, heute), ort: m.ort, montageleiter: leute[m.montageleiter]?.name || m.montageleiter })) }))} />;
  } else {
    const filter = sp.status ? alle.filter((m) => m.status === sp.status) : alle;
    inhalt = (
      <Tabelle titel="Montageaufträge" unter={`${filter.length} Aufträge`} testid="montage-liste"
        spalten={[{ titel: "Projekt" }, { titel: "Termin" }, { titel: "Team", versteckt: "max-lg:hidden" }, { titel: "Leistungen", rechts: true }, { titel: "Status" }]}
        zeilen={filter.map((m) => ({
          key: m.name,
          href: `/projekte/montagen/${encodeURIComponent(m.name)}`,
          titel: projekt[m.projekt]?.titel || m.titel,
          unter: `${m.name} · ${m.ort || ""}`,
          zellen: [terminText(m.start, heute), <AvatarReihe key="t" personen={(m.team || []).map((t) => leute[t.user]?.name || t.user)} max={3} />, `${(m.leistungen || []).filter((l) => Number(l.erledigt)).length}/${(m.leistungen || []).length}`, <ProjektStatus key="s" doctype="PH Montageauftrag" wert={m.status} />],
        }))}
        leer={<Leer groesse="karte" art={sp.status ? "gefiltert" : "leer"} titel={sp.status ? `Keine Montagen mit Status „${statusText("PH Montageauftrag", sp.status)}“.` : T.leer} zuruecksetzenHref="/projekte/montagen?ansicht=liste" />}
      />
    );
  }

  return (
    <Shell session={session} breit={ansicht !== "liste"}>
      <Seitenkopf
        titel={T.titel}
        untertitel={T.unter}
        krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: T.titel }]}
        kennzahlen={[{ wert: alle.filter((m) => woche.includes(String(m.start).slice(0, 10)) && m.status !== "Abgebrochen").length, text: `Montagen ${kwText(heute)}` }, { wert: nichtEingeplant.length, text: TEXTE.kennzahl.nichtEingeplant }]}
        aktionen={<Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "kalender", titel: T.kalender, icon: "CalendarDays", href: basis("kalender") }, { wert: "kanban", titel: T.kanban, icon: "Columns3", href: basis("kanban") }, { wert: "liste", titel: T.liste, icon: "Rows3", href: basis("liste") }]} testid="montage-ansicht" />}
      />
      {inhalt}
    </Shell>
  );
}
