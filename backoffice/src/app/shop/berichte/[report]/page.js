// /shop/berichte/[report] – Berichte des Shops (T8; 10-konzept-shop § 4.11, § 7). Zählen nur Live-Daten.
// „uebersicht“ trägt die Charts der Bereichsseite (MASTER Q-B4). Die Werte rechnet das Backoffice aus den Listen
// (gleiche Regeln wie Kennzahlen); die Frappe-Reports (PH Shop Umsatz …) lösen das ab, sobald sie geprüft sind.
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { alle } from "@/lib/backoffice/shop/daten";
import { istTest } from "@/lib/backoffice/shop/ansichten";
import { eingaengeJeWoche, zahlungenNachKanal, euVersand, EU_SCHWELLE_CENT } from "@/lib/backoffice/shop/kennzahlen";
import { siehtGeld } from "@/lib/backoffice/shop/rechte";
import { kanalText, statusInfo } from "@/lib/backoffice/shop/status";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum } from "@/lib/backoffice/format";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import BerichtSeite, { ladeBericht } from "@/components/Backoffice/Bericht/BerichtSeite";
import { Balken, Linie, Donut } from "@/components/Backoffice/Charts";
import Segment from "@/components/Backoffice/Segment";
import { Band } from "@/components/Backoffice/Akte";

export const dynamic = "force-dynamic";

const BERICHTE = {
  uebersicht: "Übersicht",
  umsatz: "Eingänge Shop",
  "umsatz-ust": "Eingänge nach USt-Satz",
  "gutschein-bestand": "Gutschein-Bestand",
  rueckerstattungen: "Rückerstattungen",
  "stripe-abgleich": "Stripe-Abgleich",
  "ohne-rechnung": "Bestellungen ohne Rechnung",
  "eu-versand": "EU-Versand",
  freigaben: "Freigaben",
};
const GELD = new Set(["umsatz", "umsatz-ust", "eu-versand", "freigaben", "stripe-abgleich"]);

export async function generateMetadata({ params }) {
  const { report } = await params;
  return { title: `${BERICHTE[report] || "Bericht"} · Shop` };
}

const monat = (iso) => String(iso || "").slice(0, 7);

export default async function ShopBericht({ params, searchParams }) {
  const { report } = await params;
  if (!BERICHTE[report]) notFound();
  const sp = await searchParams;
  const p = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, String(v)]));
  const ctx = await zugang(`/shop/berichte/${report}`, (s) => !GELD.has(report) || siehtGeld(s));
  const { client, session, heute } = ctx;
  const von = p.von || `${heute.slice(0, 4)}-01-01`;
  const bis = p.bis || heute;
  const imZeitraum = (iso) => String(iso || "").slice(0, 10) >= von && String(iso || "").slice(0, 10) <= bis;
  const aus = { spalten: [], diagramme: null, hinweis: null };
  const ergebnis = await ladeBericht(async () => {
    const [b, z, g] = await Promise.all([alle(client, "PH Bestellung"), alle(client, "PH Zahlung"), alle(client, "PH Gutschein")]);
    const zahl = z.zeilen.filter((x) => !istTest("PH Zahlung", x));
    const best = b.zeilen.filter((x) => !istTest("PH Bestellung", x));
    switch (report) {
      case "uebersicht": {
        const wochen = eingaengeJeWoche(z.zeilen, { heute });
        const kanal = siehtGeld(session) ? zahlungenNachKanal(z.zeilen) : [];
        const lief = [["Versand", best.filter((x) => x.lieferart === "versand").length], ["Abholung", best.filter((x) => x.lieferart === "abholung").length]];
        aus.diagramme = (
          <>
            {siehtGeld(session) && <Balken className="md:col-span-8" titel="Eingänge je Woche" untertitel="Shop ohne Kassa, letzte 13 Wochen" punkte={wochen} format="cent-rund" hervorheben={wochen.length - 2} laufend="letzter" />}
            <Donut className="md:col-span-4" titel="Bestellungen nach Lieferart" punkte={lief.map(([label, wert]) => ({ label, wert }))} />
          </>
        );
        aus.spalten = [{ fieldname: "kanal", label: "Kanal" }, { fieldname: "betrag_cent", label: "Eingänge", cent: true }];
        return kanal.map((k) => ({ kanal: k.label, betrag_cent: k.wert }));
      }
      case "umsatz":
      case "umsatz-ust": {
        const m = new Map();
        for (const x of zahl.filter((y) => imZeitraum(y.zeitpunkt) && y.quelle !== "kassa")) {
          const k = monat(x.zeitpunkt);
          const e = m.get(k) || { monat: k, eingang_cent: 0, erstattet_cent: 0 };
          if (x.art === "Erstattung") e.erstattet_cent += Math.abs(Number(x.betrag_cent));
          else if (x.status !== "Fehlgeschlagen" && x.status !== "Angekuendigt") e.eingang_cent += Number(x.betrag_cent);
          m.set(k, e);
        }
        const zeilen = [...m.values()].sort((a, c) => a.monat.localeCompare(c.monat)).map((e) => ({ ...e, netto_cent: e.eingang_cent - e.erstattet_cent, ust20_cent: Math.round(((e.eingang_cent - e.erstattet_cent) * 0.2) / 1.2) }));
        aus.spalten = [{ fieldname: "monat", label: "Monat" }, { fieldname: "eingang_cent", label: "Eingang", cent: true }, { fieldname: "erstattet_cent", label: "Erstattet", cent: true }, { fieldname: "netto_cent", label: "Netto", cent: true }, ...(report === "umsatz-ust" ? [{ fieldname: "ust20_cent", label: "darin USt 20 %", cent: true }] : [])];
        aus.diagramme = <Balken className="md:col-span-12" titel="Eingänge je Monat" punkte={zeilen.map((e) => ({ label: e.monat.slice(5) + "/" + e.monat.slice(2, 4), wert: e.netto_cent }))} format="cent-rund" hervorheben="letzter" />;
        if (report === "umsatz-ust" && !ctx.faehigkeiten["uva-freigabe"]) aus.hinweis = <Band ton="warnung" text={T.baender.uva} testid="band-uva" />;
        return zeilen;
      }
      case "gutschein-bestand": {
        const m = new Map();
        for (const x of g.zeilen.filter((y) => !istTest("PH Gutschein", y))) {
          const k = monat(x.ausgegeben_am);
          const e = m.get(k) || { monat: k, anzahl: 0, wert_cent: 0, rest_cent: 0 };
          e.anzahl += 1;
          e.wert_cent += Number(x.wert_cent);
          if (!["Eingeloest", "Erstattet"].includes(x.status) && x.sperrgrund_art !== "Ersetzt") e.rest_cent += Number(x.rest_cent);
          m.set(k, e);
        }
        aus.spalten = [{ fieldname: "monat", label: "Ausgabemonat" }, { fieldname: "anzahl", label: "Anzahl" }, { fieldname: "wert_cent", label: "Wert", cent: true }, { fieldname: "rest_cent", label: "Rest", cent: true }];
        aus.hinweis = <Band ton="info" text="Abgelaufene Gutscheine mit Rest zählen hier mit – wie in der Kennzahl der Übersicht." />;
        return [...m.values()].sort((a, c) => c.monat.localeCompare(a.monat));
      }
      case "rueckerstattungen": {
        const zeilen = zahl.filter((x) => x.art === "Erstattung" && imZeitraum(x.zeitpunkt)).map((x) => ({ datum: datum(x.zeitpunkt), name: x.name, kanal: kanalText(x.kanal), bezug: x.bezug, betrag_cent: Math.abs(Number(x.betrag_cent)) }));
        aus.spalten = [{ fieldname: "datum", label: "Datum" }, { fieldname: "name", label: "Nummer" }, { fieldname: "kanal", label: "Kanal" }, { fieldname: "bezug", label: "Bezug" }, { fieldname: "betrag_cent", label: "Betrag", cent: true }];
        const je = new Map();
        for (const x of zahl.filter((y) => y.art === "Erstattung")) je.set(monat(x.zeitpunkt), (je.get(monat(x.zeitpunkt)) || 0) + Math.abs(Number(x.betrag_cent)));
        aus.diagramme = <Linie className="md:col-span-12" titel="Erstattungen je Monat" punkte={[...je.entries()].sort().map(([label, wert]) => ({ label, wert }))} format="cent-rund" />;
        return zeilen;
      }
      case "stripe-abgleich": {
        const zeilen = zahl.filter((x) => String(x.kanal).startsWith("Stripe") && x.art === "Eingang" && imZeitraum(x.zeitpunkt)).map((x) => ({ name: x.name, datum: datum(x.zeitpunkt), betrag_cent: Number(x.betrag_cent), gebuehr_cent: Number(x.stripe_gebuehr_cent) || 0, auszahlung: x.stripe_auszahlung || "ohne Auszahlung" }));
        aus.spalten = [{ fieldname: "name", label: "Zahlung" }, { fieldname: "datum", label: "Datum" }, { fieldname: "betrag_cent", label: "Betrag", cent: true }, { fieldname: "gebuehr_cent", label: "Gebühr", cent: true }, { fieldname: "auszahlung", label: "Auszahlung" }];
        return zeilen;
      }
      case "ohne-rechnung": {
        const zeilen = best.filter((x) => ["versendet", "abgeholt", "abgeschlossen"].includes(x.status) && (x.rechnung_uid || Number(x.rechnungswunsch))).sort((a, c) => (c.rechnung_uid ? 1 : 0) - (a.rechnung_uid ? 1 : 0)).map((x) => ({ name: x.name, kunde: x.rechnung_name || x.kunde_name, uid: x.rechnung_uid || "–", status: statusInfo("PH Bestellung", x.status).anzeige, gesamt_cent: Number(x.gesamt_cent) }));
        aus.spalten = [{ fieldname: "name", label: "Bestellung" }, { fieldname: "kunde", label: "Kunde" }, { fieldname: "uid", label: "UID" }, { fieldname: "status", label: "Status" }, { fieldname: "gesamt_cent", label: "Gesamt", cent: true }];
        if (!ctx.faehigkeiten.rechnung) aus.hinweis = <Band ton="info" text="Rechnungen erstellen: noch nicht verfügbar – in Faktura erstellen." />;
        return zeilen;
      }
      case "eu-versand": {
        const r = euVersand(b.zeilen, { jahr: heute.slice(0, 4) });
        aus.hinweis = <Band ton={r.warnung ? "warnung" : "info"} text={`${cent(r.netto)} netto von ${cent(EU_SCHWELLE_CENT)} Schwelle (${Math.round(r.anteil * 100)} %) · ${T.euSchwelleHinweis}`} testid="band-eu" />;
        aus.spalten = [{ fieldname: "name", label: "Bestellung" }, { fieldname: "land", label: "Land" }, { fieldname: "netto_cent", label: "Netto", cent: true }];
        return r.zeilen.map((x) => ({ name: x.name, land: x.adresse_land, netto_cent: Number(x.gesamt_cent) - Number(x.ust_cent || 0) }));
      }
      case "freigaben": {
        aus.spalten = [{ fieldname: "name", label: "Zahlung" }, { fieldname: "von", label: "Angefordert von" }, { fieldname: "grund", label: "Grund" }, { fieldname: "betrag_cent", label: "Betrag", cent: true }];
        return z.zeilen.filter((x) => x.status === "Erstattung angefordert").map((x) => ({ name: x.name, von: String(x.erstattung_angefordert_von || "").split("@")[0], grund: x.erstattung_grund || "–", betrag_cent: Number(x.erstattung_angefordert_cent) }));
      }
      default:
        return [];
    }
  });
  const unternav = <Segment label="Bericht" aktiv={report} groesse="s" optionen={Object.entries(BERICHTE).filter(([k]) => !GELD.has(k) || siehtGeld(session)).map(([k, t]) => ({ wert: k, titel: t, href: `/shop/berichte/${k}` }))} />;
  return (
    <Rahmen session={session} modus={client.modus}>
      <BerichtSeite bericht={`shop-${report}`} bereich="shop" titel={BERICHTE[report]} krumen={[{ titel: "Zentrale", href: "/" }, { titel: "Shop", href: "/shop" }, { titel: BERICHTE[report] }]} unternav={unternav}
        untertitel={T.erstbesuch.berichte}
        filter={report === "uebersicht" || report === "gutschein-bestand" || report === "freigaben" ? undefined : { basis: `/shop/berichte/${report}`, params: { von, bis }, zeitraum: true }}
        ergebnis={ergebnis} spalten={aus.spalten} diagramme={aus.diagramme} darfExport={siehtGeld(session) || ctx.schreiben} />
      {aus.hinweis && <div className="mt-6">{aus.hinweis}</div>}
    </Rahmen>
  );
}
