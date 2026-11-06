// /marketing/empfehlungen – „Unter Freunden“ (10-konzept-marketing § 2.10, T2, unter „Mehr“). „Gutschein fällig“ oben.
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import FilterForm from "@/components/Backoffice/Marketing/FilterForm";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel } from "@/components/Backoffice/Marketing/Bausteine";
import { EmpfehlungenListe, EmpfehlungscodeKnopf } from "@/components/Backoffice/Marketing/Empfehlungen";
import { empfehlungenListe, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { CHIP_REIHE } from "@/lib/backoffice/marketing/status";
import { EMPFEHLUNGEN, STATUS_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Empfehlungen") };

export default async function EmpfehlungenSeite({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await marketingKontext({ pfad: "/marketing/empfehlungen", doctype: "PH Empfehlung" });
  const status = params.status ? params.status.split(",").filter(Boolean) : [];
  const { zeilen, zaehler, gesamt } = await empfehlungenListe(ctx.client, { status, q: params.q });
  const link = (s) => `/marketing/empfehlungen${s ? `?status=${encodeURIComponent(s)}` : ""}`;
  return (
    <Rahmen ctx={ctx}>
      <Seitenkopf titel={EMPFEHLUNGEN.titel} untertitel={EMPFEHLUNGEN.untertitel} krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: EMPFEHLUNGEN.titel }]} kennzahlen={[{ wert: zaehler["Gutschein faellig"] || 0, text: STATUS_TEXT.empfehlung["Gutschein faellig"] }]} aktionen={ctx.team ? <EmpfehlungscodeKnopf auto={params.neu === "code"} /> : null} />
      <div className="bo-mar-werkzeuge">
        <StatusChips aktiv={status.length === 1 ? status[0] : status.length ? null : "alle"} optionen={[{ wert: "alle", titel: "Alle", anzahl: gesamt, href: link("") }, ...CHIP_REIHE.empfehlung.map((s) => ({ wert: s, titel: STATUS_TEXT.empfehlung[s], anzahl: zaehler[s] || 0, href: link(s) }))]} />
        <FilterForm basis="/marketing/empfehlungen" params={params} behalten={["status"]} suche={{ name: "q", platzhalter: "Code oder Name" }} zuruecksetzen="/marketing/empfehlungen" />
      </div>
      {gesamt === 0 ? (
        <Leer titel="Noch keine Empfehlung" text={EMPFEHLUNGEN.leer} />
      ) : zeilen.length === 0 ? (
        status.includes("Gutschein faellig") ? <Leer art="erledigt" titel="Kein Gutschein fällig" text={EMPFEHLUNGEN.leerFaellig} /> : <Leer art="gefiltert" text={EMPFEHLUNGEN.gefiltert} zuruecksetzenHref="/marketing/empfehlungen" />
      ) : (
        <ListeKachel label={EMPFEHLUNGEN.titel}>
          <EmpfehlungenListe zeilen={zeilen} darf={ctx.team} />
        </ListeKachel>
      )}
    </Rahmen>
  );
}
