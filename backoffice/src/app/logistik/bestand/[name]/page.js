import { notFound } from "next/navigation";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Chip, Fakten, StatusPille, Zeile, datumLang } from "@/components/Backoffice/Logistik/ui";
import { bestandAction } from "@/lib/backoffice/logistik/actions";
import { bestandAkte, lagerorte } from "@/lib/backoffice/logistik/daten";
import { BEWEGUNGSART } from "@/lib/backoffice/logistik/status";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { druckHref } from "@/lib/backoffice/druck";
import { cent } from "@/lib/backoffice/format";
import { BESTAND as T } from "@/lib/backoffice/logistik/texte";
import { AkteSeite, Verlauf, seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

// Bestand-Akte (§ 4.10): Primär Umlagern; Reservieren · Freigeben · Sperren (Grund) · Entsperren/Ausbuchen (Leitung).
// Mengenfelder nie direkt – nur über Methoden. Ausstellungsstück: Kassa-Hinweis, kein „An Kassa verkaufen“ (E6).
export default async function BestandAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/bestand/${encodeURIComponent(name)}`);
  const [a, orte] = await Promise.all([
    bestandAkte(client, name).catch((err) => {
      if (istBackofficeError(err) && err.code === "not_found") notFound();
      throw err;
    }),
    lagerorte(client),
  ]);
  const { doc } = a;
  const b = { name };
  const gesperrt = Number(doc.gesperrt) || doc.status === "Gesperrt";
  const ortOptionen = orte.filter((o) => o.art !== "Fahrzeug").map((o) => ({ wert: o.name, titel: o.name }));
  const tabs = [{ id: "uebersicht", titel: "Übersicht" }, { id: "bewegungen", titel: "Bewegungen", anzahl: a.journal.length }, { id: "andere", titel: T.andereOrte, anzahl: a.andere.length }, { id: "verlauf", titel: "Verlauf" }];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "uebersicht";
  return (
    <AkteSeite session={session} doctype="PH Lagerbestand" doc={doc} liste={{ href: "/logistik/bestand", titel: T.titel }} phasen={false}
      titel={doc.produkt_name || name}
      nummer={<span className="inline-flex flex-wrap items-center gap-2"><span className="bo-log-mono" style={{ whiteSpace: "normal" }}>{name}</span><span className="bo-log-cap">{doc.lagerort} · {doc.platz || "ohne Platz"}{doc.seriennummer ? ` · SN ${doc.seriennummer}` : ""}</span>{Number(doc.ausstellungsstueck) ? <Chip ton="messing">Ausstellungsstück</Chip> : null}{doc.zustand === "B-Ware" ? <Chip ton="eiche">B-Ware</Chip> : null}{doc.kommission ? <Chip ton="see">Kommission</Chip> : null}</span>}
      band={gesperrt ? { ton: "warnung", titel: `Gesperrt: ${doc.sperrgrund || "ohne Grund"}`, text: "Entsperren darf die Leitung" } : Number(doc.ausstellungsstueck) ? { ton: "info", titel: T.kassaHinweis } : null}
      aktionen={<>
        <Knopf variant="ghost" icon="Tag" href={druckHref("PH Lagerbestand", name, "PH Lagerbestand Etikett")}>{T.aktionen.etikett}</Knopf>
        {!gesperrt ? <VorgangKnopf variant="ghost" icon="Lock" aktion={bestandAction} args={{ ...b, methode: "sperren" }} feldPfad="args" titel={T.aktionen.sperren} felder={[{ name: "grund", label: "Grund", typ: "auswahl", pflicht: true, optionen: T.sperrGruende }]} erfolg="Gesperrt" testid="sperren" /> : leitung ? <VorgangKnopf variant="ghost" icon="Lock" aktion={bestandAction} args={{ ...b, methode: "entsperren" }} titel={T.aktionen.entsperren} frage={{ titel: "Bestand entsperren?" }} erfolg="Entsperrt" /> : null}
        {Number(doc.reserviert) > 0 ? <VorgangKnopf variant="ghost" icon="Undo2" aktion={bestandAction} args={{ ...b, methode: "freigeben" }} titel={T.aktionen.freigeben} frage={{ titel: `Reservierung für ${doc.reserviert_kunde_name || "–"} freigeben?` }} erfolg="Freigegeben" /> : null}
        {!gesperrt && doc.status !== "Kommission" && Number(doc.verfuegbar) > 0 ? <VorgangKnopf variant="ghost" icon="CalendarPlus" aktion={bestandAction} args={{ ...b, methode: "reservieren" }} feldPfad="args" titel={T.aktionen.reservieren} felder={[{ name: "bezug_doctype", label: "Bezug", typ: "auswahl", start: "PH Auftragsbestaetigung", optionen: [{ wert: "PH Auftragsbestaetigung", titel: "AB" }, { wert: "PH Bestellung", titel: "Bestellung" }] }, { name: "bezug", label: "Nummer", pflicht: true }, { name: "kunde_name", label: "Kunde" }, { name: "bis", label: "bis (JJJJ-MM-TT)" }, { name: "menge", label: "Menge", typ: "zahl", start: "1" }]} erfolg="Reserviert" /> : null}
        {leitung && Number(doc.verfuegbar) > 0 ? <VorgangKnopf variant="ghost" icon="Trash2" aktion={bestandAction} args={{ ...b, methode: "ausbuchen" }} feldPfad="args" titel={T.aktionen.ausbuchen} frage={{ gefaehrlich: true, bestaetigen: "Ausbuchen", fakten: [T.ausbuchFrage(doc.verfuegbar, doc.produkt_name), Number(doc.reserviert) ? T.reserviertHinweis : null].filter(Boolean) }} felder={[{ name: "grund", label: "Grund", typ: "auswahl", pflicht: true, optionen: T.ausbuchGruende }, { name: "menge", label: "Menge", typ: "zahl", start: String(doc.verfuegbar) }]} erfolg="Ausgebucht" /> : null}
        {doc.status !== "Ausgeschieden" ? <VorgangKnopf variant="primary" icon="ArrowRight" aktion={bestandAction} args={{ ...b, methode: "umlagern" }} feldPfad="args" titel={T.aktionen.umlagern} felder={[{ name: "lagerort_nach", label: "Lagerort", typ: "auswahl", optionen: ortOptionen, start: doc.lagerort, pflicht: true }, { name: "platz_nach", label: "Platz", start: doc.platz || "" }, { name: "menge", label: "Menge", typ: "zahl", start: String(doc.menge) }]} erfolg="Umgelagert" testid="primaer" /> : null}
      </>}
      tabs={tabs} tab={tab} basis={`/logistik/bestand/${encodeURIComponent(name)}`} params={sp}
      details={[{ label: "Menge", wert: doc.menge }, { label: "Reserviert", wert: doc.reserviert || 0 }, { label: "Verfügbar", wert: doc.verfuegbar }, leitung ? { label: "EK", wert: cent(doc.ek_cent) } : null, Number(doc.ausstellungsstueck) ? { label: "VK Ausstellung", wert: doc.vk_cent_ausstellung ? cent(doc.vk_cent_ausstellung) : "auf Anfrage" } : null]}
    >
      {tab === "uebersicht" && (
        <Kachel titel="Übersicht">
          <Fakten eintraege={[{ label: "Status", wert: <StatusPille doctype="PH Lagerbestand" status={doc.status} /> }, { label: "Zustand", wert: doc.zustand }, { label: "EAN", wert: doc.ean }, { label: "Eingang", wert: datumLang(doc.eingang_am) }, { label: "Letzte Inventur", wert: datumLang(doc.inventur_am) }, { label: "Reserviert für", wert: doc.reserviert_fuer ? `${doc.reserviert_kunde_name || ""} · ${doc.reserviert_fuer} bis ${datumLang(doc.reserviert_bis)}` : "–" }]} />
        </Kachel>
      )}
      {tab === "bewegungen" && (
        <Kachel titel="Bewegungen">
          <div className="bo-log-tabhuelle">
            <table className="bo-log-tab"><thead><tr><th>Datum</th><th>Art</th><th className="r">Menge</th><th>Von → Nach</th><th className="r">Saldo</th></tr></thead>
              <tbody>{a.journal.map((j) => <tr key={j.name} data-storniert={j.status === "Storniert" ? "true" : undefined}><td>{datumLang(j.datum)}</td><td>{BEWEGUNGSART[j.art]?.zeichen} {j.art}</td><td className="r">{j.menge}</td><td>{[j.lagerort_von && `${j.lagerort_von} ${j.platz_von || ""}`, j.lagerort_nach && `${j.lagerort_nach} ${j.platz_nach || ""}`].filter(Boolean).join(" → ") || "–"}</td><td className="r">{j.saldo}</td></tr>)}</tbody>
            </table>
          </div>
        </Kachel>
      )}
      {tab === "andere" && <Kachel titel={T.andereOrte}><div className="bo-log-zeilen">{a.andere.length ? a.andere.map((x) => <Zeile key={x.name} href={`/logistik/bestand/${encodeURIComponent(x.name)}`} titel={`${x.lagerort} · ${x.platz || "–"}`} unter={`${x.menge} Stück · ${x.verfuegbar} verfügbar`} rechts={<StatusPille doctype="PH Lagerbestand" status={x.status} />} />) : <p className="bo-log-cap">Keine weiteren Bestände.</p>}</div></Kachel>}
      {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf doctype="PH Lagerbestand" name={name} docinfo={a.docinfo} /></Kachel>}
    </AkteSeite>
  );
}
