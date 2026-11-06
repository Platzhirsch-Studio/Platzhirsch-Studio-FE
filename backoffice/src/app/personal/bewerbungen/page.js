import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Fehler from "@/components/Backoffice/Fehler";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import { BewerbungsBoard, BewerbungsListe, BewerbungNeuKnopf, BewerbungenLeer } from "@/components/Backoffice/Personal/Bewerbungen";
import { AllesGesichtet } from "@/components/Backoffice/Personal/Bewerberakte";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeBewerbungen, ladePersonen, ladeStellen, sicher } from "@/lib/backoffice/personal/daten";
import { darfBewerbungen, darfBearbeiten } from "@/lib/backoffice/personal/rollen";
import { T } from "@/lib/backoffice/personal/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bewerbungen · Personal" };

// T3 Kanban (Standard) | T2 Liste (Konzept § 5.5). Filter Stelle/Zuständig/Quelle/Suche in der URL.
export default async function Bewerbungen({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/bewerbungen", sp, darfBewerbungen);
  const ansicht = sp.ansicht === "liste" ? "liste" : "kanban";
  const filter = { stelle: sp.stelle || "", zustaendig: sp.zustaendig || "", quelle: sp.quelle || "", q: sp.q || "" };
  const [r, personen, st] = await Promise.all([sicher(() => ladeBewerbungen(ctx, filter)), ladePersonen(ctx).catch(() => []), sicher(() => ladeStellen(ctx, { status: ["Entwurf", "Aktiv", "Pausiert"] }))]);
  const stellen = st.ok ? st.daten.zeilen.map((s) => ({ name: s.name, titel: s.titel })) : [];
  const gefiltert = Boolean(filter.stelle || filter.zustaendig || filter.quelle || filter.q);
  const href = (o) => {
    const p = new URLSearchParams(Object.entries({ ...filter, ansicht: ansicht === "liste" ? "liste" : "", ...o }).filter(([, v]) => v));
    return `/personal/bewerbungen${p.toString() ? `?${p}` : ""}`;
  };
  const offen = r.ok ? r.daten.filter((b) => ["Eingegangen", "Gesichtet", "Gespraech", "Angebot"].includes(b.status)).length : 0;
  return (
    <PersonalHuelle ctx={ctx} breit>
      <Seitenkopf
        titel={T.bewerbung.titel}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.bewerbung.titel }]}
        kennzahlen={r.ok ? [{ wert: r.daten.filter((b) => b.status === "Eingegangen").length, text: "neu" }, { wert: offen, text: "offen" }] : []}
        aktionen={
          <div className="flex flex-wrap items-center gap-2">
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "kanban", titel: T.bewerbung.board, href: href({ ansicht: "" }), icon: "Columns3" }, { wert: "liste", titel: T.bewerbung.liste, href: href({ ansicht: "liste" }), icon: "Rows3" }]} testid="per-bewerbungen-ansicht" />
            {darfBearbeiten(ctx.rolle) && <BewerbungNeuKnopf stellen={stellen} startOffen={sp.neu === "1"} vorbelegtStelle={filter.stelle} />}
          </div>
        }
        unternav={
          <form className="bo-per-filter" action="/personal/bewerbungen" data-testid="per-bewerbungen-filter">
            {ansicht === "liste" && <input type="hidden" name="ansicht" value="liste" />}
            <label className="bo-per-filter__suche">
              <span className="bo-per-sr">Suche</span>
              <input name="q" defaultValue={filter.q} placeholder="Name, E-Mail, Nummer" />
            </label>
            <select name="stelle" defaultValue={filter.stelle} className="bo-per-auswahl bo-per-auswahl--pille" aria-label={T.bewerbung.stelle}>
              <option value="">{`${T.bewerbung.stelle}: ${T.bewerbung.alle}`}</option>
              <option value="initiativ">Initiativbewerbungen</option>
              {stellen.map((s) => <option key={s.name} value={s.name}>{s.titel}</option>)}
            </select>
            <select name="zustaendig" defaultValue={filter.zustaendig} className="bo-per-auswahl bo-per-auswahl--pille" aria-label={T.bewerbung.zustaendig}>
              <option value="">{`${T.bewerbung.zustaendig}: ${T.bewerbung.alle}`}</option>
              <option value="ich">Meine</option>
              {personen.map((p) => <option key={p.wert} value={p.wert}>{p.titel}</option>)}
            </select>
            <button type="submit" className="bo-knopf bo-knopf--secondary inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold">Filtern</button>
            {gefiltert && <a href={ansicht === "liste" ? "/personal/bewerbungen?ansicht=liste" : "/personal/bewerbungen"} className="bo-per-link text-[13px]">Zurücksetzen</a>}
          </form>
        }
      />
      <Erstbesuch text={T.erstbesuch.bewerbungen} route="/personal/bewerbungen" />
      {sp.gesichtet === "1" && <AllesGesichtet />}
      {!r.ok ? (
        <Fehler code={r.fehler.code} />
      ) : r.daten.length === 0 ? (
        <BewerbungenLeer gefiltert={gefiltert} zuruecksetzenHref="/personal/bewerbungen" />
      ) : ansicht === "liste" ? (
        <BewerbungsListe bewerbungen={r.daten} heute={ctx.heute} />
      ) : (
        <BewerbungsBoard bewerbungen={r.daten} heute={ctx.heute} rolle={ctx.rolle} personen={personen} standardFuehrung={ctx.user} />
      )}
    </PersonalHuelle>
  );
}
