// /shop/gutscheine – Gutscheine | Gutscheinkäufe (T2; 10-konzept-shop § 4.6). Code nie im Klartext (····-XXXX),
// Restwert = Verbindlichkeit. „Gutschein ohne Verkauf“ (S5) nur Leitung über ?neu=1; Verkauf an der Kassa.
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle, einstellungen } from "@/lib/backoffice/shop/daten";
import { wendeAn } from "@/lib/backoffice/shop/ansichten";
import { gutscheinZeile, kaufZeile } from "@/lib/backoffice/shop/zeilen";
import { statusListe } from "@/lib/backoffice/shop/status";
import { shopKennzahlen } from "@/lib/backoffice/shop/kennzahlen";
import { T } from "@/lib/backoffice/shop/texte";
import { cent } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import ListenSeite from "@/components/Backoffice/Shop/ListenSeite";
import Segment from "@/components/Backoffice/Segment";
import Knopf from "@/components/Backoffice/Knopf";
import GutscheinOhneVerkauf from "@/components/Backoffice/Shop/GutscheinOhneVerkauf";

export const metadata = { title: "Gutscheine · Shop" };
export const dynamic = "force-dynamic";

const SP_G = [
  { id: "objekt", titel: "Code", art: "objekt" },
  { id: "wert", titel: "Wert", art: "betrag", rechts: true },
  { id: "rest", titel: "Rest", art: "rest", rechts: true },
  { id: "status", titel: "Status", art: "status" },
  { id: "ausgabe", titel: "Ausgabe", art: "text" },
  { id: "person", titel: "Käufer → Empfänger", art: "text", nurBreit: true },
  { id: "gueltig", titel: "Gültig bis", art: "text", nurBreit: true },
];
const SP_K = [
  { id: "objekt", titel: "Käufer", art: "objekt" },
  { id: "wert", titel: "Anzahl × Wert", art: "betrag", rechts: true },
  { id: "status", titel: "Status", art: "status" },
  { id: "zeit", titel: "Gekauft", art: "text" },
  { id: "mail", titel: "Mail gesendet", art: "text", nurBreit: true },
];

export default async function Gutscheine({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await zugang("/shop/gutscheine");
  const { client, session, leitung, heute, geld } = ctx;
  const kaeufe = params.tab === "kaeufe";
  const [{ zeilen: roh, fehler }, eins] = await Promise.all([alle(client, kaeufe ? "PH Gutschein Bestellung" : "PH Gutschein"), einstellungen(client)]);
  const r = wendeAn(kaeufe ? "kaeufe" : "gutscheine", roh, params, { heute });
  const kz = kaeufe ? null : shopKennzahlen({ gutscheine: roh }, { heute });
  const tabs = <Segment label="Bereich" aktiv={kaeufe ? "kaeufe" : "gutscheine"} optionen={[{ wert: "gutscheine", titel: "Gutscheine", href: "/shop/gutscheine" }, { wert: "kaeufe", titel: "Gutscheinkäufe (online)", href: "/shop/gutscheine?tab=kaeufe" }]} />;
  return (
    <Rahmen session={session} modus={client.modus}>
      <ListenSeite titel="Gutscheine" basis="/shop/gutscheine" params={params} r={r} liste={kaeufe ? "kaeufe" : "gutscheine"} spalten={kaeufe ? SP_K : SP_G} zeilen={r.zeilen.map(kaeufe ? kaufZeile : gutscheinZeile)} fehler={fehler}
        unternav={tabs}
        kennzahlen={kz && geld ? [{ wert: cent(kz.gutscheinRest), text: "Restwert (Verbindlichkeit)" }, { wert: cent(kz.gutscheinOhneVerkauf), text: "davon ohne Verkauf" }] : []}
        aktionen={ctx.schreiben && !kaeufe ? <Knopf variant="primary" icon="Plus" href={leitung ? "/shop/gutscheine?neu=1" : undefined} disabled={!leitung} grund={leitung ? undefined : T.nurLeitungVerkauf} data-testid="s5-oeffnen">Gutschein ohne Verkauf</Knopf> : null}
        erstbesuch={T.erstbesuch.gutscheine} suche={kaeufe ? "Käufer, Nummer" : "letzte 4 Zeichen, Käufer, Empfänger"}
        status={statusListe(kaeufe ? "PH Gutschein Bestellung" : "PH Gutschein").map((s) => ({ wert: s.wert, anzeige: s.anzeige }))}
        massen={ctx.schreiben ? (kaeufe ? [{ id: "gutschein-mail", titel: "Gutschein-Mail erneut senden", icon: "Mail" }] : [{ id: "pdf-senden", titel: "PDF senden", icon: "Mail" }]) : []}
        leer={kaeufe ? { nie: T.leer.kaeufeNie, filter: T.leer.gutscheineFilter } : { nie: T.leer.gutscheineNie, filter: T.leer.gutscheineFilter, erledigt: r.ansicht === "laeuft-ab" ? T.leer.laeuftAbLeer : T.leer.gutscheineFilter }} darfExport />
      {params.neu === "1" && leitung && <GutscheinOhneVerkauf min={Number(eins.shop?.gutschein_min_cent) || 1000} max={Number(eins.shop?.gutschein_max_cent) || 100000} />}
    </Rahmen>
  );
}
