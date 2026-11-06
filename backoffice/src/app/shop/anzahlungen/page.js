// /shop/anzahlungen – Kontroll- und Linkansicht (T2; 10-konzept-shop § 4.8, E14). Kein „Neu“: Anzahlungen
// entstehen am Auftrag in Faktura.
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle } from "@/lib/backoffice/shop/daten";
import { wendeAn } from "@/lib/backoffice/shop/ansichten";
import { anzahlungZeile } from "@/lib/backoffice/shop/zeilen";
import { statusListe } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import { cent } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import ListenSeite from "@/components/Backoffice/Shop/ListenSeite";
import Knopf from "@/components/Backoffice/Knopf";

export const metadata = { title: "Anzahlungen · Shop" };
export const dynamic = "force-dynamic";

const SPALTEN = [
  { id: "objekt", titel: "Auftrag", art: "objekt" },
  { id: "betrag", titel: "Betrag", art: "betrag", rechts: true },
  { id: "status", titel: "Status", art: "status" },
  { id: "link", titel: "Link gültig bis", art: "text" },
  { id: "bezahlt", titel: "Bezahlt am", art: "text", nurBreit: true },
];

export default async function Anzahlungen({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await zugang("/shop/anzahlungen");
  const { client, session, heute } = ctx;
  const { zeilen: roh, fehler } = await alle(client, "PH Anzahlung");
  const r = wendeAn("anzahlungen", roh, params, { heute });
  return (
    <Rahmen session={session} modus={client.modus}>
      <ListenSeite titel="Anzahlungen" basis="/shop/anzahlungen" params={params} r={r} liste="anzahlungen" spalten={SPALTEN} zeilen={r.zeilen.map((a) => anzahlungZeile(a, heute))} fehler={fehler}
        kennzahlen={[{ wert: cent(r.summe || 0), text: "Summe gefiltert" }]}
        aktionen={<Knopf variant="secondary" iconRechts="ArrowUpRight" href="/faktura">Neue Anzahlung am Auftrag in Faktura</Knopf>}
        erstbesuch={T.erstbesuch.anzahlungen} suche="Auftrag, Nummer, E-Mail"
        status={statusListe("PH Anzahlung").map((s) => ({ wert: s.wert, anzeige: s.anzeige }))}
        massen={ctx.schreiben ? [{ id: "anzahlung-link", titel: "Zahlungslink senden", icon: "Mail" }] : []}
        leer={{ nie: T.leer.anzahlungenNie, filter: T.leer.anzahlungenFilter }} darfExport />
    </Rahmen>
  );
}
