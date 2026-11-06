import Shell from "@/components/Backoffice/Shell/Shell";
import Seitenkopf from "@/components/Backoffice/Seitenkopf";
import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Kennzahl from "@/components/Backoffice/Kennzahl";
import Segment from "@/components/Backoffice/Segment";
import Leer from "@/components/Backoffice/Leer";
import BerichtTabelle from "@/components/Backoffice/Kassa/BerichtTabelle";
import { KRUMEN, V, verwaltungsZugang } from "@/components/Backoffice/Kassa/Verwaltung";
import { kassenbuch, personenNamen } from "@/lib/backoffice/kassa/daten";
import { kassaFaehigkeiten } from "@/lib/backoffice/kassa/faehigkeiten";
import { MONATE } from "@/lib/backoffice/datum";

export const metadata = { title: "Kassenbuch · Kassa" };
export const dynamic = "force-dynamic";

const NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;

function tageAus(zeilen) {
  const m = {};
  for (const z of zeilen) {
    const t = (m[z.datum] ||= { datum: z.datum, buchungen: 0, ein_cent: 0, aus_cent: 0, saldo_cent: 0 });
    t.buchungen += 1;
    if (z.bewegung_cent > 0) t.ein_cent += z.bewegung_cent;
    else t.aus_cent += -z.bewegung_cent;
    t.saldo_cent += z.bewegung_cent;
  }
  return Object.values(m).sort((a, b) => b.datum.localeCompare(a.datum));
}

// Kassenbuch (Team B-KAS, Konzept §4.3): Buchungen | Tage, je Kasse und Monat. Bestand je Zeile nur, wenn der
// Server jeden Barbeleg im Kassenbuch führt (Fähigkeit `kassenbuch_barbelege`, E7).
export default async function Kassenbuch({ searchParams }) {
  const sp = await searchParams;
  const { session, client } = await verwaltungsZugang(`${V}/kassenbuch`);
  const kassen = await client.getList("PH Kasse", { fields: ["name", "bezeichnung"], limit: 20, orderBy: "name asc" }).catch(() => []);
  const kasse = NAME.test(sp?.kasse || "") ? sp.kasse : kassen[0]?.name;
  const d = new Date();
  const ms = Array.from({ length: 3 }, (_, i) => {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    return { wert: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`, titel: `${MONATE[x.getMonth()].slice(0, 3)} ${x.getFullYear()}` };
  }).reverse();
  const monat = ms.some((m) => m.wert === sp?.monat) ? sp.monat : ms.at(-1).wert;
  const ansicht = sp?.ansicht === "tage" ? "tage" : "buchungen";
  const [zeilen, faehig] = await Promise.all([kassenbuch(session, { kasse, monat }).catch(() => []), kassaFaehigkeiten(session, { client })]);
  const namen = await personenNamen(client, zeilen.map((z) => z.bediener));
  const gebucht = zeilen.filter((z) => z.status === "Gebucht").map((z) => ({ ...z, bediener: namen[z.bediener] || z.bediener }));
  const ein = gebucht.filter((z) => z.bewegung_cent > 0).reduce((a, z) => a + z.bewegung_cent, 0);
  const aus = gebucht.filter((z) => z.bewegung_cent < 0).reduce((a, z) => a - z.bewegung_cent, 0);
  const bestand = gebucht[0]?.bestand_danach_cent ?? null;
  const basis = (x) => `${V}/kassenbuch?kasse=${encodeURIComponent(kasse || "")}&monat=${x.monat || monat}&ansicht=${x.ansicht || ansicht}`;
  const spalten = [
    { feld: "zeitpunkt", titel: "Zeitpunkt", art: "zeit" },
    { feld: "art", titel: "Art" },
    { feld: "grund", titel: "Grund" },
    { feld: "bediener", titel: "Bediener" },
    { feld: "bewegung_cent", titel: "Betrag", art: "cent" },
    ...(faehig.kassenbuch_barbelege?.an ? [{ feld: "bestand_danach_cent", titel: "Bestand danach", art: "cent" }] : []),
  ];
  return (
    <Shell session={session} breit>
      <Seitenkopf
        titel="Kassenbuch"
        untertitel="Ein- und Auszahlungen, Bareinnahmen und Differenzen"
        krumen={[...KRUMEN, { titel: "Kassenbuch" }]}
        aktionen={
          <>
            {kassen.length > 1 && <Segment label="Kasse" aktiv={kasse} optionen={kassen.map((k) => ({ wert: k.name, titel: k.bezeichnung || k.name, href: `${V}/kassenbuch?kasse=${encodeURIComponent(k.name)}&monat=${monat}&ansicht=${ansicht}` }))} />}
            <Segment label="Monat" aktiv={monat} optionen={ms.map((m) => ({ ...m, href: basis({ monat: m.wert }) }))} />
            <Segment label="Ansicht" aktiv={ansicht} optionen={[{ wert: "buchungen", titel: "Buchungen", href: basis({ ansicht: "buchungen" }) }, { wert: "tage", titel: "Tage", href: basis({ ansicht: "tage" }) }]} />
          </>
        }
      />
      <Bento>
        <Kennzahl className="col-span-12 md:col-span-4" titel="Bestand" wert={bestand} format="cent" zusatz="nach der letzten Buchung" />
        <Kennzahl className="col-span-6 md:col-span-4" titel="Eingänge im Monat" wert={ein} format="cent" />
        <Kennzahl className="col-span-6 md:col-span-4" titel="Ausgänge im Monat" wert={aus} format="cent" />
        <Kachel className="col-span-12" titel={ansicht === "tage" ? "Tage" : "Buchungen"} unter={`${gebucht.length} Buchungen`}>
          {gebucht.length === 0 ? (
            <Leer titel="Keine Buchungen in diesem Monat" groesse="karte" />
          ) : ansicht === "tage" ? (
            <BerichtTabelle spalten={[{ feld: "datum", titel: "Tag", art: "datum" }, { feld: "buchungen", titel: "Buchungen", art: "zahl" }, { feld: "ein_cent", titel: "Eingänge", art: "cent" }, { feld: "aus_cent", titel: "Ausgänge", art: "cent" }, { feld: "saldo_cent", titel: "Saldo", art: "cent" }]} zeilen={tageAus(gebucht)} />
          ) : (
            <BerichtTabelle spalten={spalten} zeilen={gebucht} summe={false} testid="kassenbuch-tabelle" />
          )}
          {!faehig.kassenbuch_zweck?.an && <p className="mt-3 text-[13px] text-bo-text-soft">Zweck und Projekt einer Barausgabe stehen bis zum nächsten Backend-Stand im Grund.</p>}
        </Kachel>
      </Bento>
    </Shell>
  );
}
