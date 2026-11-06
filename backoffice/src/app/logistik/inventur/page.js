import Kachel, { Bento } from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Balken } from "@/components/Backoffice/Logistik/ui";
import { inventurAnlegenAction, teilinventurAction } from "@/lib/backoffice/logistik/actions";
import { heute, inventurAbdeckung, lagerorte } from "@/lib/backoffice/logistik/daten";
import { INVENTUR as T, LEER } from "@/lib/backoffice/logistik/texte";
import { ListenSeite, seite, werte } from "../_teile";

export const metadata = { title: "Inventur" };
export const dynamic = "force-dynamic";

// Inventur (§ 4.13 + Lager & Inventur Ergänzung): Liste mit Fortschritt, Abdeckung je Lagerort („jeder Platz 1× je
// Geschäftsjahr“), Inventur anlegen (Dialog, 3 Felder) und Teilinventur (nächste Plätze), Inventurbewertung.
export default async function Inventur({ searchParams }) {
  const params = werte(await searchParams);
  const { client, leitung } = await seite("/logistik/inventur");
  const [orte, abdeckung] = await Promise.all([lagerorte(client), inventurAbdeckung(client)]);
  const ortOptionen = orte.filter((o) => o.art !== "Fahrzeug").map((o) => ({ wert: o.name, titel: o.name }));
  const h = heute(client);
  return ListenSeite({
    params, pfad: "/logistik/inventur", titel: T.titel, doctype: "PH Inventur", statusWerte: ["Geplant", "Laufend", "Abgeschlossen", "Verworfen"], standardSort: "datum desc",
    aktionen: <>
      {leitung ? <Knopf href="/logistik/inventur/bewertung" icon="Banknote">{T.bewertung.titel}</Knopf> : null}
      <VorgangKnopf icon="Layers" aktion={teilinventurAction} titel={T.teilinventur} felder={[{ name: "lagerort", label: "Lagerort", typ: "auswahl", pflicht: true, optionen: ortOptionen, start: ortOptionen[0]?.wert }, { name: "anzahl", label: "Plätze je Lauf", typ: "zahl", start: "8" }]} dialogText={T.hinweisAnlegen} ziel="/logistik/inventur/" zielFeld="name" testid="teilinventur" />
      <VorgangKnopf variant="primary" icon="Plus" aktion={inventurAnlegenAction} titel={T.anlegen} felder={[{ name: "lagerort", label: "Lagerort", typ: "auswahl", pflicht: true, optionen: ortOptionen, start: ortOptionen[0]?.wert }, { name: "datum", label: "Stichtag (JJJJ-MM-TT)", pflicht: true, start: h }, { name: "art", label: "Art", typ: "auswahl", start: "Stichtag", optionen: ["Stichtag", "Anlass"] }]} dialogText={T.hinweisAnlegen} ziel="/logistik/inventur/" zielFeld="name" testid="inventur-anlegen" />
    </>,
    kopfZusatz: abdeckung.length ? (
      <Bento className="mb-6" testid="abdeckung">
        {abdeckung.map((a) => (
          <Kachel key={a.lagerort} className="md:col-span-4" titel={a.lagerort} unter={T.abdeckung} dicht>
            <p className="bo-zahl-gross">{Math.round(a.quotePromille / 10)} %</p>
            <Balken anteil={a.quotePromille / 1000} label={T.abdeckungText(a.gezaehlt, a.gesamt, Math.round(a.sollPromille / 10))} />
            <p className="bo-log-cap mt-2">{T.abdeckungText(a.gezaehlt, a.gesamt, Math.round(a.sollPromille / 10))}{a.rueckstand ? ` · ${T.rueckstand(a.rueckstand)}` : ""} · {T.jeWoche(a.jeWoche)}</p>
          </Kachel>
        ))}
      </Bento>
    ) : null,
    felder: ["name", "titel", "lagerort", "datum", "inventur_art", "gezaehlt_von", "anzahl_positionen", "anzahl_gezaehlt", "differenz_positionen", "differenz_summe", "status"],
    spalten: [{ fieldname: "titel", label: "Inventur" }, { fieldname: "art_text", label: "Art" }, { fieldname: "datum", label: "Stichtag", fieldtype: "Date" }, { fieldname: "fortschritt", label: "Gezählt" }, { fieldname: "diff_text", label: "Differenzen" }, { fieldname: "status", label: "Status", fieldtype: "Select" }],
    titelFeld: "titel", unterFelder: ["lagerort"], zeilenBasis: "/logistik/inventur",
    mapZeile: (z) => ({ ...z, art_text: z.inventur_art || "Stichtag", fortschritt: `${z.anzahl_gezaehlt || 0}/${z.anzahl_positionen || 0}`, diff_text: z.differenz_positionen ? `${z.differenz_positionen} · ${z.differenz_summe > 0 ? "+" : ""}${z.differenz_summe}` : "–" }),
    leerText: LEER.inventur,
  });
}
