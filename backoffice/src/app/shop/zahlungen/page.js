// /shop/zahlungen – Zahlungen (T2; 10-konzept-shop § 4.5): Eingänge, Erstattungen, Freigabe nötig, ohne Auszahlung,
// Zahlungsstreit (Leitung). Erstattung mit Minus in Tinte – nie rot. Bar und Karte laufen über die Kassa.
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle } from "@/lib/backoffice/shop/daten";
import { wendeAn } from "@/lib/backoffice/shop/ansichten";
import { zahlungZeile } from "@/lib/backoffice/shop/zeilen";
import { statusListe } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import { cent } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import ListenSeite from "@/components/Backoffice/Shop/ListenSeite";
import Knopf from "@/components/Backoffice/Knopf";

export const metadata = { title: "Zahlungen · Shop" };
export const dynamic = "force-dynamic";

const SPALTEN = [
  { id: "objekt", titel: "Art · Kanal", art: "objekt" },
  { id: "zeit", titel: "Zeitpunkt", art: "text" },
  { id: "bezug", titel: "Bezug", art: "link" },
  { id: "betrag", titel: "Betrag", art: "betrag", rechts: true },
  { id: "status", titel: "Status", art: "status" },
  { id: "auszahlung", titel: "Auszahlung", art: "text", nurBreit: true },
];

export default async function Zahlungen({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await zugang("/shop/zahlungen");
  const { client, session, leitung, geld } = ctx;
  const { zeilen: roh, fehler } = await alle(client, "PH Zahlung");
  const r = wendeAn("zahlungen", roh, params, { leitung: leitung || ctx.gf, user: session.user });
  const ein = r.alleGefiltert.filter((z) => z.art !== "Erstattung").reduce((s, z) => s + Number(z.betrag_cent || 0), 0);
  const aus = r.alleGefiltert.filter((z) => z.art === "Erstattung").reduce((s, z) => s + Math.abs(Number(z.betrag_cent || 0)), 0);
  const leer = { alle: T.leer.zahlungenNie, erstattungen: T.leer.zahlungenFilter, freigabe: T.leer.freigabeLeer, streit: T.leer.streitLeer, "ohne-auszahlung": T.leer.ohneAuszahlungLeer };
  return (
    <Rahmen session={session} modus={client.modus}>
      <ListenSeite titel="Zahlungen" basis="/shop/zahlungen" params={params} r={r} liste="zahlungen" spalten={SPALTEN} zeilen={r.zeilen.map(zahlungZeile)} fehler={fehler}
        kennzahlen={[{ wert: cent(ein), text: "Eingang" }, { wert: cent(aus), text: "Erstattet" }, { wert: cent(ein - aus), text: "Netto" }]}
        aktionen={ctx.schreiben ? <Knopf variant="primary" icon="Plus" href="/shop/bestellungen?ansicht=alle&status=offen,reserviert" data-testid="zahlung-erfassen-liste">Zahlung erfassen</Knopf> : null}
        erstbesuch={T.erstbesuch.zahlungen} suche="Nummer, Bezug, Referenz, Betrag €"
        status={statusListe("PH Zahlung").map((s) => ({ wert: s.wert, anzeige: s.anzeige }))}
        chips={[{ param: "kanal", wert: "Stripe Checkout", titel: "Stripe" }, { param: "kanal", wert: "Ueberweisung", titel: "Überweisung" }, { param: "kanal", wert: "Gutschein", titel: "Gutschein" }]}
        leer={{ nie: T.leer.zahlungenNie, filter: T.leer.zahlungenFilter, erledigt: leer[r.ansicht] }} darfExport={geld || ctx.schreiben} summe={`Eingang ${cent(ein)} · Erstattet ${cent(aus)}`} />
    </Rahmen>
  );
}
