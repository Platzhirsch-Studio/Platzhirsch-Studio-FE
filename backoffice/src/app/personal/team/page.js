import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Fehler from "@/components/Backoffice/Fehler";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Knopf, { RundKnopf } from "@/components/Backoffice/Knopf";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { TeamKalender, AntraegeListe, PersonenListe, BuchungenListe, TeamNeu } from "@/components/Backoffice/Personal/Team";
import { params, seitenStart, KRUMEN_BASIS, monatAus, monatSchluessel } from "@/lib/backoffice/personal/seite";
import { ladeTeam, ladeAntraege, ladeBuchungen, ladeMitarbeiterListe, ladeHeuteImHaus, sicher } from "@/lib/backoffice/personal/daten";
import { darfTeam, istLeitung, darfEntscheiden, darfArtSehen } from "@/lib/backoffice/personal/rollen";
import { teamsVon } from "@/lib/backoffice/personal/regeln";
import { T } from "@/lib/backoffice/personal/texte";
import { kw, plusTage, wochenStartIso, monatsTage, kurzDatum, monatName, tageVonBis } from "@/lib/backoffice/personal/zeit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team · Personal" };

const ANSICHTEN = ["kalender", "personen", "buchungen", "antraege"];

// T4 Team (Konzept § 5.8, E10): Kalender · Personen · Buchungen · Anträge. Alte Routen leiten hierher (307).
export default async function Team({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/team", sp, darfTeam);
  const ansicht = ANSICHTEN.includes(sp.ansicht) ? sp.ansicht : "kalender";
  const monatAnsicht = sp.zeitraum === "monat";
  const basisTag = /^\d{4}-\d{2}-\d{2}$/.test(sp.datum || "") ? sp.datum : ctx.heute;
  const { jahr, monat } = monatAus(sp, ctx.heute);
  const leitung = istLeitung(ctx.rolle);
  const antraege = darfEntscheiden(ctx.rolle) ? await sicher(() => ladeAntraege(ctx)) : { ok: true, daten: [] };
  const offen = antraege.ok ? antraege.daten.filter((a) => a.status === "Beantragt" || a.typ === "krank").length : 0;
  const href = (o) => {
    const p = new URLSearchParams(Object.entries({ ansicht, ...o }).filter(([, v]) => v && v !== "kalender"));
    return `/personal/team${p.toString() ? `?${p}` : ""}`;
  };
  const alleMa = await ladeMitarbeiterListe(ctx).catch(() => []);
  const personenAuswahl = alleMa.filter((m) => m.status === "Aktiv").map((m) => ({ name: m.name, titel: m.titel }));

  let inhalt;
  let werkzeuge = null;
  if (ansicht === "kalender") {
    const von = monatAnsicht ? `${basisTag.slice(0, 7)}-01` : wochenStartIso(basisTag);
    const tage = monatAnsicht ? monatsTage(Number(basisTag.slice(0, 4)), Number(basisTag.slice(5, 7))) : tageVonBis(von, plusTage(von, 6));
    const r = await sicher(() => ladeTeam(ctx, { von: tage[0], bis: tage.at(-1) }));
    const b = await sicher(() => ladeBuchungen(ctx, { von: tage[0], bis: tage.at(-1) }));
    const jeTag = {};
    if (b.ok) for (const x of b.daten) (jeTag[`${x.mitarbeiter}|${x.datum}`] ||= []).push(x);
    const vor = monatAnsicht ? monatSchluessel(Number(basisTag.slice(0, 4)), Number(basisTag.slice(5, 7)), -1) + "-01" : plusTage(von, -7);
    const nach = monatAnsicht ? monatSchluessel(Number(basisTag.slice(0, 4)), Number(basisTag.slice(5, 7)), 1) + "-01" : plusTage(von, 7);
    werkzeuge = (
      <div className="flex flex-wrap items-center gap-2">
        <Segment label="Zeitraum" aktiv={monatAnsicht ? "monat" : "woche"} groesse="s" optionen={[{ wert: "woche", titel: T.team.woche, href: href({ datum: basisTag }) }, { wert: "monat", titel: T.team.monat, href: href({ zeitraum: "monat", datum: basisTag }) }]} />
        <RundKnopf icon="ChevronLeft" label={T.team.zurueck} groesse="s" href={href({ zeitraum: monatAnsicht ? "monat" : "", datum: vor })} />
        <span className="min-w-36 text-center text-[14px] font-semibold">{monatAnsicht ? `${monatName(Number(basisTag.slice(5, 7)))} ${basisTag.slice(0, 4)}` : `KW ${kw(von)} · ${kurzDatum(tage[0])}–${kurzDatum(tage[6])}`}</span>
        <RundKnopf icon="ChevronRight" label={T.team.vor} groesse="s" href={href({ zeitraum: monatAnsicht ? "monat" : "", datum: nach })} />
        <Knopf size="s" variant="ghost" href={href({ zeitraum: monatAnsicht ? "monat" : "" })}>{T.team.heute}</Knopf>
      </div>
    );
    inhalt = !r.ok ? <Fehler code={r.fehler.code} /> : (
      <>
        {leitung && <p className="bo-per-band-hinweis mb-4">{T.team.feiertage}</p>}
        <TeamKalender zeilen={r.daten.zeilen} tage={tage} heute={ctx.heute} monat={monatAnsicht} leitung={leitung} staerke={r.daten.staerke} buchungenJeTag={jeTag} />
      </>
    );
  } else if (ansicht === "antraege") {
    inhalt = !darfEntscheiden(ctx.rolle) ? <Fehler code="forbidden" /> : !antraege.ok ? <Fehler code={antraege.fehler.code} /> : <AntraegeListe antraege={antraege.daten} heute={ctx.heute} leitung={leitung} />;
  } else if (ansicht === "personen") {
    const h = darfArtSehen(ctx.rolle) ? await sicher(() => ladeHeuteImHaus(ctx)) : { ok: false };
    const zust = new Map(h.ok ? h.daten.map((x) => [x.name, x.zustand === "imHaus" ? T.uebersicht.imHaus : x.zustand === "abwesend" ? T.zeiten.abwesend : "–"]) : []);
    inhalt = <PersonenListe personen={alleMa.map((m) => ({ ...m, teams: teamsVon(m), heute: zust.get(m.name) || "–" }))} heute={ctx.heute} />;
  } else {
    const tageM = monatsTage(jahr, monat);
    const status = ["Offen", "Erfasst", "Korrigiert"].includes(sp.status) ? [sp.status] : null;
    const r = await sicher(() => ladeBuchungen(ctx, { von: tageM[0], bis: tageM.at(-1), status }));
    werkzeuge = (
      <div className="flex flex-wrap items-center gap-2">
        <RundKnopf icon="ChevronLeft" label="Voriger Monat" groesse="s" href={href({ monat: monatSchluessel(jahr, monat, -1), status: sp.status })} />
        <span className="min-w-28 text-center text-[14px] font-semibold">{`${monatName(monat)} ${jahr}`}</span>
        <RundKnopf icon="ChevronRight" label="Nächster Monat" groesse="s" href={href({ monat: monatSchluessel(jahr, monat, 1), status: sp.status })} />
        <Segment label="Status" aktiv={sp.status || "alle"} groesse="s" optionen={[{ wert: "alle", titel: T.alle, href: href({ monat: sp.monat }) }, ...["Offen", "Erfasst", "Korrigiert"].map((s) => ({ wert: s, titel: s, href: href({ monat: sp.monat, status: s }) }))]} />
      </div>
    );
    inhalt = !r.ok ? <Fehler code={r.fehler.code} /> : <BuchungenListe buchungen={r.daten} leitung={leitung} leerText={status ? T.team.buchungenGefiltert : T.team.buchungenLeer(monatName(monat))} />;
  }

  return (
    <PersonalHuelle ctx={ctx} breit>
      <Seitenkopf
        titel={T.team.titel}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.team.titel }]}
        aktionen={<TeamNeu personen={personenAuswahl} heute={ctx.heute} start={sp.neu === "abwesenheit" ? "abwesenheit" : sp.neu === "buchung" ? "buchung" : sp.neu === "mitarbeiter" ? "mitarbeiter" : null} leitung={leitung} darfMitarbeiter={leitung || ctx.rolle === "admin"} />}
        unternav={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "kalender", titel: T.team.ansichten.kalender, href: "/personal/team" }, { wert: "personen", titel: T.team.ansichten.personen, href: "/personal/team?ansicht=personen" }, { wert: "buchungen", titel: T.team.ansichten.buchungen, href: "/personal/team?ansicht=buchungen" }, ...(darfEntscheiden(ctx.rolle) ? [{ wert: "antraege", titel: T.team.ansichten.antraege, href: "/personal/team?ansicht=antraege", anzahl: offen }] : [])]} testid="per-team-ansicht" />
            {werkzeuge}
          </div>
        }
      />
      <Erstbesuch text={T.erstbesuch.team} route="/personal/team" />
      {inhalt}
    </PersonalHuelle>
  );
}
