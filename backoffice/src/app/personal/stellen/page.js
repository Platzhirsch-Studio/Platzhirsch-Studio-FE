import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Segment from "@/components/Backoffice/Segment";
import Fehler from "@/components/Backoffice/Fehler";
import PersonalHuelle from "@/components/Backoffice/Personal/Huelle";
import StellenAnsicht, { StelleAnlegenKnopf } from "@/components/Backoffice/Personal/Stellen";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/personal/seite";
import { ladeStellen, sicher, istLeer } from "@/lib/backoffice/personal/daten";
import { darfStellen, darfBearbeiten } from "@/lib/backoffice/personal/rollen";
import { statusText } from "@/lib/backoffice/personal/status";
import { T } from "@/lib/backoffice/personal/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stellen · Personal" };

const STATUS = ["Entwurf", "Aktiv", "Pausiert", "Besetzt", "Archiviert"];
const STANDARD = ["Entwurf", "Aktiv", "Pausiert"];

// T2 Stellen (Konzept § 5.3): Liste | Kanban, Standardfilter Entwurf · Aktiv · Pausiert, Filter in der URL.
export default async function Stellen({ searchParams }) {
  const sp = params(await searchParams);
  const ctx = await seitenStart("/personal/stellen", sp, darfStellen);
  const ansicht = sp.ansicht === "kanban" ? "kanban" : "liste";
  const status = STATUS.includes(sp.status) ? [sp.status] : sp.status === "alle" ? null : STANDARD;
  const r = await sicher(() => ladeStellen(ctx, { status: ansicht === "kanban" ? ["Entwurf", "Aktiv", "Pausiert", "Besetzt"] : status }));
  const darfAnlegen = darfBearbeiten(ctx.rolle) || ctx.rolle === "admin";
  const z = r.ok ? r.daten.zaehler : {};
  const q = (o) => {
    const p = new URLSearchParams({ ...(ansicht === "kanban" ? { ansicht } : {}), ...o });
    return `/personal/stellen${p.toString() ? `?${p}` : ""}`;
  };
  const vorlagen = r.ok ? r.daten.zeilen.map((s) => ({ name: s.name, titel: s.titel })) : [];
  return (
    <PersonalHuelle ctx={ctx}>
      <Seitenkopf
        titel={T.stellen.titel}
        krumen={[KRUMEN_BASIS[0], KRUMEN_BASIS[1], { titel: T.stellen.titel }]}
        kennzahlen={[{ wert: z.Aktiv || 0, text: statusText("stelle", "Aktiv") }, { wert: z.Entwurf || 0, text: statusText("stelle", "Entwurf") }]}
        aktionen={
          <div className="flex flex-wrap items-center gap-2">
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "liste", titel: "Liste", href: "/personal/stellen", icon: "Rows3" }, { wert: "kanban", titel: "Kanban", href: "/personal/stellen?ansicht=kanban", icon: "Columns3" }]} testid="per-stellen-ansicht" />
            {darfAnlegen && <StelleAnlegenKnopf vorlagen={vorlagen} startOffen={sp.neu === "1"} />}
          </div>
        }
        unternav={
          ansicht === "liste" ? (
            <Segment
              label="Status"
              aktiv={sp.status || "standard"}
              groesse="s"
              optionen={[{ wert: "standard", titel: "Offen", href: q({}), anzahl: STANDARD.reduce((n, s) => n + (z[s] || 0), 0) }, ...STATUS.map((s) => ({ wert: s, titel: statusText("stelle", s), href: q({ status: s }), anzahl: z[s] || 0 })), { wert: "alle", titel: T.alle, href: q({ status: "alle" }) }]}
              testid="per-stellen-status"
            />
          ) : null
        }
      />
      {!r.ok ? (
        <Fehler code={r.fehler.code} />
      ) : (
        <StellenAnsicht zeilen={r.daten.zeilen} ansicht={ansicht} heute={ctx.heute} rolle={ctx.rolle} darfAnlegen={false} vorlagen={vorlagen} gefiltert={!istLeer(ctx) && STATUS.includes(sp.status) ? statusText("stelle", sp.status) : null} zuruecksetzenHref="/personal/stellen" />
      )}
    </PersonalHuelle>
  );
}
