// /shop/stripe – Ereignisse | Auszahlungen (T2; 10-konzept-shop § 4.9; Leitung, Buchhaltung extern Auszahlungen lesend).
// Ereignisart in Klartext, „Erneut verarbeiten“ nur bei Fehler/ignoriert, Abgleich je Auszahlung.
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle, einstellungen } from "@/lib/backoffice/shop/daten";
import { wendeAn } from "@/lib/backoffice/shop/ansichten";
import { ereignisZeile, auszahlungZeile } from "@/lib/backoffice/shop/zeilen";
import { statusListe } from "@/lib/backoffice/shop/status";
import { darfStripe } from "@/lib/backoffice/shop/rechte";
import { T } from "@/lib/backoffice/shop/texte";
import { datumZeit } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import ListenSeite from "@/components/Backoffice/Shop/ListenSeite";
import Segment from "@/components/Backoffice/Segment";
import { Band } from "@/components/Backoffice/Akte";
import { BandKnopf } from "@/components/Backoffice/Shop/Teile";

export const metadata = { title: "Stripe · Shop" };
export const dynamic = "force-dynamic";

const SP_E = [
  { id: "objekt", titel: "Ereignis", art: "objekt" },
  { id: "zeit", titel: "Empfangen", art: "text" },
  { id: "bezug", titel: "Bezug", art: "link" },
  { id: "status", titel: "Status", art: "status" },
  { id: "versuche", titel: "Versuche", art: "text", nurBreit: true },
];
const SP_A = [
  { id: "objekt", titel: "Auszahlung", art: "objekt" },
  { id: "betrag", titel: "Netto", art: "betrag", rechts: true },
  { id: "brutto", titel: "Brutto", art: "betrag", rechts: true, nurBreit: true },
  { id: "gebuehren", titel: "Gebühren", art: "betrag", rechts: true, nurBreit: true },
  { id: "differenz", titel: "Differenz", art: "text" },
  { id: "status", titel: "Status", art: "status" },
];

export default async function Stripe({ searchParams }) {
  const sp = await searchParams;
  const params = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await zugang("/shop/stripe", darfStripe);
  const { client, session, leitung } = ctx;
  const nurAuszahlungen = !leitung && !ctx.gf;
  const aus = params.tab === "auszahlungen" || nurAuszahlungen;
  const [{ zeilen: roh, fehler }, eins] = await Promise.all([alle(client, aus ? "PH Stripe Auszahlung" : "PH Stripe Ereignis"), einstellungen(client)]);
  const r = wendeAn(aus ? "auszahlungen" : "ereignisse", roh, params, {});
  const st = eins.stripe || {};
  const tabs = nurAuszahlungen ? null : <Segment label="Bereich" aktiv={aus ? "auszahlungen" : "ereignisse"} optionen={[{ wert: "ereignisse", titel: "Ereignisse", href: "/shop/stripe" }, { wert: "auszahlungen", titel: "Auszahlungen", href: "/shop/stripe?tab=auszahlungen" }]} />;
  return (
    <Rahmen session={session} modus={client.modus}>
      <ListenSeite titel="Stripe" basis="/shop/stripe" params={params} r={r} liste={aus ? "auszahlungen" : "ereignisse"} spalten={aus ? SP_A : SP_E} zeilen={r.zeilen.map(aus ? auszahlungZeile : ereignisZeile)} fehler={fehler}
        unternav={tabs}
        kennzahlen={[{ wert: st.letzter_abgleich ? datumZeit(st.letzter_abgleich) : "–", text: "Letzter Abgleich" }]}
        aktionen={leitung ? <BandKnopf id="schluessel-pruefen" titel="Schlüssel prüfen" doc={{ name: "PH Stripe Einstellungen", doctype: "PH Stripe Einstellungen" }} /> : null}
        erstbesuch={T.erstbesuch.stripe} suche={aus ? "Kennung" : "Ereignis, Bezug"}
        status={statusListe(aus ? "PH Stripe Auszahlung" : "PH Stripe Ereignis").map((s) => ({ wert: s.wert, anzeige: s.anzeige }))}
        massen={leitung ? (aus ? [{ id: "abgleichen", titel: "Abgleichen", icon: "RefreshCw" }] : [{ id: "ereignis-erneut", titel: "Erneut verarbeiten", icon: "RefreshCw" }]) : []}
        leer={aus ? { nie: T.leer.auszahlungenNie, filter: T.leer.differenzLeer, erledigt: T.leer.differenzLeer } : { nie: T.leer.ereignisseNie, filter: T.leer.fehlerLeer, erledigt: T.leer.fehlerLeer }} darfExport />
      {Number(st.simulation) === 1 && <div className="mt-6"><Band ton={Number(st.testmodus) ? "info" : "gefahr"} text={Number(st.testmodus) ? T.baender.simulation : T.baender.liveSimulation} testid="band-simulation" /></div>}
      {aus && <p className="mt-4 text-[13px] text-bo-text-soft">Gebührenrechnung monatlich aus Stripe als Anhang an der Auszahlung ablegen.</p>}
    </Rahmen>
  );
}
