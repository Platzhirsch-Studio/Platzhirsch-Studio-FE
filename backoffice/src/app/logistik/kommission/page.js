import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import { VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { StatusPille, Zeile, datumKurz } from "@/components/Backoffice/Logistik/ui";
import { kommissionLieferscheinAction } from "@/lib/backoffice/logistik/actions";
import { kommission } from "@/lib/backoffice/logistik/daten";
import { LEER } from "@/lib/backoffice/logistik/texte";
import { seite, werte } from "../_teile";

export const metadata = { title: "Kommission" };
export const dynamic = "force-dynamic";

// Kommission (§ 4.11): Suche Projekt/AB → „Im Lager“ und „Noch erwartet“; Primär „Lieferschein aus Kommission“.
export default async function Kommission({ searchParams }) {
  const params = werte(await searchParams);
  const { session, client } = await seite("/logistik/kommission");
  const k = params.k || "";
  const daten = k ? await kommission(client, k) : null;
  const vorschlaege = !k ? [...new Set((await client.getList("PH Lagerbestand", { fields: ["kommission"], filters: [["kommission", "!=", ""], ["menge", ">", 0]], limit: 200 })).map((b) => b.kommission).filter(Boolean))] : [];
  const frei = (daten?.im_lager || []).filter((b) => !Number(b.gesperrt)).length;
  return (
    <Shell session={session}>
      <Seitenkopf titel="Kommission" krumen={[{ titel: "Logistik", href: "/logistik" }, { titel: "Kommission" }]}
        aktionen={k && frei ? <VorgangKnopf variant="primary" icon="FileText" aktion={kommissionLieferscheinAction} args={{ kommission: k, idempotency: `kom-${k}` }} titel="Lieferschein aus Kommission" felder={[{ name: "lieferart", label: "Lieferart", typ: "auswahl", start: "Eigenlieferung", optionen: ["Eigenlieferung", "Spedition", "Abholung"] }, { name: "wunschtermin", label: "Wunschtermin (JJJJ-MM-TT)" }]} dialogText={daten?.erwartet?.length ? `${daten.erwartet.length} Positionen noch nicht eingegangen – Teillieferung oder warten?` : undefined} ziel="/logistik/lieferscheine/" zielFeld="name" testid="primaer" /> : null}
        unternav={<form action="/logistik/kommission" className="w-full max-w-md"><label className="bo-suche"><span className="sr-only">Kommission</span><input name="k" defaultValue={k} placeholder="Projekt- oder Auftragsnummer" /></label></form>} />
      {!k ? (
        vorschlaege.length ? (
          <Kachel titel="Kommissionen im Lager"><div className="bo-log-zeilen">{vorschlaege.map((v) => <Zeile key={v} href={`/logistik/kommission?k=${encodeURIComponent(v)}`} titel={v} />)}</div></Kachel>
        ) : <Leer text={LEER.kommission} />
      ) : !daten?.im_lager?.length && !daten?.erwartet?.length ? (
        <Leer art="gefiltert" text={LEER.kommissionLeer} zuruecksetzenHref="/logistik/kommission" />
      ) : (
        <Bento>
          <Kachel className="md:col-span-7" titel="Im Lager" unter={`${daten.summe_stueck} Stück`}>
            <div className="bo-log-zeilen">{daten.im_lager.map((b) => <Zeile key={b.name} href={`/logistik/bestand/${encodeURIComponent(b.name)}`} titel={b.produkt_name} unter={`${b.lagerort} · ${b.platz || "–"} · ${b.menge} Stück`} rechts={<StatusPille doctype="PH Lagerbestand" status={b.status} />} />)}</div>
          </Kachel>
          <Kachel className="md:col-span-5" titel="Noch erwartet">
            {daten.erwartet.length ? <div className="bo-log-zeilen">{daten.erwartet.map((e, i) => <Zeile key={i} titel={e.bezeichnung} unter={`${e.menge} · ${e.herstellerbestellung} · ${e.liefertermin ? datumKurz(e.liefertermin) : "ohne Termin"}`} />)}</div> : <p className="bo-log-cap">Alles eingegangen.</p>}
          </Kachel>
        </Bento>
      )}
    </Shell>
  );
}
