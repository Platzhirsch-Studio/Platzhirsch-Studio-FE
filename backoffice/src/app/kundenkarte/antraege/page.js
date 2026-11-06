import { redirect } from "next/navigation";
import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Knopf from "@/components/Backoffice/Knopf";
import Segment from "@/components/Backoffice/Segment";
import Erstbesuch from "@/components/Backoffice/Erstbesuch";
import Fehler from "@/components/Backoffice/Fehler";
import { AntraegeListe } from "@/components/Backoffice/Kundenkarte/Antraege";
import Filter from "@/components/Backoffice/Kundenkarte/Filter";
import Suchfeld from "@/components/Backoffice/Kundenkarte/Suchfeld";
import { params, seitenStart, KRUMEN_BASIS } from "@/lib/backoffice/kundenkarte/seite";
import { ladeAntraege, sicher } from "@/lib/backoffice/kundenkarte/daten";
import { darfSchreiben } from "@/lib/backoffice/kundenkarte/regeln";
import { QUELLE } from "@/lib/backoffice/kundenkarte/labels";
import { T } from "@/lib/backoffice/kundenkarte/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anträge · Kundenkarte" };

const REITER = ["entscheiden", "mail", "erledigt"];

export default async function AntraegeSeite({ searchParams }) {
  const sp = params(await searchParams);
  if (sp.ansicht === "kanban") redirect("/kundenkarte/antraege"); // Kein Kanban (K4)
  const ctx = await seitenStart("/kundenkarte/antraege", sp);
  const reiter = REITER.includes(sp.reiter) ? sp.reiter : "entscheiden";
  const r = await sicher(() => ladeAntraege(ctx, { reiter, q: sp.q || "", quelle: sp.quelle || "", seite: Number(sp.seite) || 1 }));
  const z = r.ok ? r.daten.zaehler : {};
  const href = (x) => {
    const p = new URLSearchParams(Object.fromEntries(Object.entries(sp).filter(([k]) => !["reiter", "seite"].includes(k))));
    if (x !== "entscheiden") p.set("reiter", x);
    const s = p.toString();
    return s ? `/kundenkarte/antraege?${s}` : "/kundenkarte/antraege";
  };
  return (
    <Shell session={ctx.session}>
      <Seitenkopf
        titel={T.seiten.antraege}
        krumen={[...KRUMEN_BASIS, { titel: T.seiten.antraege }]}
        kennzahlen={r.ok ? [{ wert: z.entscheiden, text: "zu entscheiden" }, { wert: z.mail, text: "warten auf Mail" }] : []}
        aktionen={
          darfSchreiben(ctx.rolle) ? (
            <Knopf variant="primary" icon="Plus" href="/kundenkarte/karten/neu" data-testid="kk-showroom-antrag">
              {T.antraege.showroom}
            </Knopf>
          ) : null
        }
      />
      <Erstbesuch text={T.erstbesuch.antraege} route="/kundenkarte/antraege" />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segment
          label="Reiter"
          aktiv={reiter}
          testid="kk-antraege-reiter"
          optionen={[
            { wert: "entscheiden", titel: T.antraege.reiter.entscheiden, href: href("entscheiden"), anzahl: z.entscheiden },
            { wert: "mail", titel: T.antraege.reiter.mail, href: href("mail"), anzahl: z.mail },
            { wert: "erledigt", titel: T.antraege.reiter.erledigt, href: href("erledigt") },
          ]}
        />
        <span className="flex-1" />
        <Suchfeld basis="/kundenkarte/antraege" params={sp} platzhalter={T.antraege.suche} />
        <Filter basis="/kundenkarte/antraege" params={sp} felder={[{ name: "quelle", label: "Quelle", optionen: Object.entries(QUELLE).filter(([k]) => k !== "import").map(([wert, titel]) => ({ wert, titel })) }]} />
      </div>
      {r.ok ? <AntraegeListe zeilen={r.daten.zeilen} gesamt={r.daten.gesamt} gesamtAlle={r.daten.gesamtAlle} reiter={reiter} darfSchreiben={darfSchreiben(ctx.rolle)} params={sp} jetzt={ctx.jetzt.toISOString()} /> : <Fehler code={r.fehler.code} message={r.fehler.message} />}
    </Shell>
  );
}
