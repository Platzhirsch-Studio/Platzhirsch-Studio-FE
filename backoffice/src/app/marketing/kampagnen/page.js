// /marketing/kampagnen – Kampagnen (10-konzept-marketing § 2.7, T2, nur Liste – kein Kanban, E7).
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Leer from "@/components/Backoffice/Leer";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import FilterForm from "@/components/Backoffice/Marketing/FilterForm";
import { StatusChips } from "@/components/Backoffice/Marketing/Kleinteile";
import { ListeKachel } from "@/components/Backoffice/Marketing/Bausteine";
import { KampagneAnlegenKnopf, KampagnenListe } from "@/components/Backoffice/Marketing/Kampagnen";
import { kampagnenListe, marketingKontext } from "@/lib/backoffice/marketing/daten";
import { CHIP_REIHE } from "@/lib/backoffice/marketing/status";
import { ERSTBESUCH, KAMPAGNEN, KAMPAGNE_KANAL, STATUS_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Kampagnen") };

export default async function KampagnenSeite({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await marketingKontext({ pfad: "/marketing/kampagnen", doctype: "PH Kampagne" });
  const status = params.status ? params.status.split(",").filter(Boolean) : [];
  const { zeilen, zaehler, jahre } = await kampagnenListe(ctx.client, { status, kanal: params.kanal, jahr: params.jahr, q: params.q });
  const gesamt = Object.values(zaehler).reduce((a, b) => a + b, 0);
  const link = (s) => `/marketing/kampagnen${s ? `?status=${encodeURIComponent(s)}` : ""}`;
  return (
    <Rahmen ctx={ctx} erstbesuch={{ text: ERSTBESUCH.kampagnen, route: "/marketing/kampagnen" }}>
      <Seitenkopf
        titel={KAMPAGNEN.titel}
        untertitel={KAMPAGNEN.untertitel}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: KAMPAGNEN.titel }]}
        kennzahlen={[{ wert: zaehler.Aktiv || 0, text: "Aktiv" }, { wert: zaehler.Pausiert || 0, text: "Pausiert" }]}
        aktionen={ctx.team ? <KampagneAnlegenKnopf auto={params.neu === "kampagne"} /> : null}
      />
      <div className="bo-mar-werkzeuge">
        <StatusChips aktiv={status.length === 1 ? status[0] : status.length ? null : "alle"} optionen={[{ wert: "alle", titel: "Alle", anzahl: gesamt, href: link("") }, ...CHIP_REIHE.kampagne.map((s) => ({ wert: s, titel: STATUS_TEXT.kampagne[s], anzahl: zaehler[s] || 0, href: link(s) }))]} />
        <FilterForm basis="/marketing/kampagnen" params={params} behalten={["status"]} suche={{ name: "q", platzhalter: "Titel" }} auswahl={[{ name: "kanal", label: "Kanal", alle: "Alle Kanäle", optionen: KAMPAGNE_KANAL.map((k) => ({ wert: k, titel: k })) }, { name: "jahr", label: "Jahr", alle: "Alle Jahre", optionen: jahre.map((j) => ({ wert: j, titel: j })) }]} zuruecksetzen="/marketing/kampagnen" />
      </div>
      {gesamt === 0 ? (
        <Leer titel="Noch keine Kampagne" text={KAMPAGNEN.leer} />
      ) : zeilen.length === 0 ? (
        <Leer art="gefiltert" text={KAMPAGNEN.gefiltert} zuruecksetzenHref="/marketing/kampagnen" />
      ) : (
        <ListeKachel label={KAMPAGNEN.titel} kopf={<span className="tabular-nums">{zeilen.length} Kampagnen · Kennzahl über den Knopf in der Zeile</span>}>
          <KampagnenListe zeilen={zeilen.map(({ beschreibung: _b, auswertung_notiz: _a, ...k }) => k)} darf={ctx.team} leitung={ctx.leitung} />
        </ListeKachel>
      )}
    </Rahmen>
  );
}
