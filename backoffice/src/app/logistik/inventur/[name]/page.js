import { notFound } from "next/navigation";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { MehrMenue, VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Zaehlliste } from "@/components/Backoffice/Logistik/Inventur";
import { Balken, datumLang } from "@/components/Backoffice/Logistik/ui";
import { inventurAction, inventurFreigebenAction, inventurGrundAction } from "@/lib/backoffice/logistik/actions";
import { inventurAkte } from "@/lib/backoffice/logistik/daten";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { druckHref } from "@/lib/backoffice/druck";
import { INVENTUR as T } from "@/lib/backoffice/logistik/texte";
import { AkteSeite, Verlauf, seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

// Inventur-Akte (§ 4.13, § 5.12): Primär je Zustand; Freigabe nur Leitung mit Vier-Augen, Grund je Differenz,
// Bewegungen seit Zählbeginn sperren (Liste). Zählliste inline, Differenzen, Zählmodus fürs iPhone.
export default async function InventurAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/inventur/${encodeURIComponent(name)}`);
  const a = await inventurAkte(client, name, { session, leitung }).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  const { doc, fortschritt: f, freigabe } = a;
  const pos = doc.positionen || [];
  const b = { name };
  let primaer = null;
  if (doc.status === "Geplant" && !pos.length) primaer = <VorgangKnopf variant="primary" icon="Rows3" aktion={inventurAction} args={{ ...b, methode: "zaehlliste_erzeugen" }} titel={T.primaer.zaehlliste} erfolg="Zählliste erzeugt" testid="primaer" />;
  else if (doc.status === "Geplant") primaer = <VorgangKnopf variant="primary" icon="Play" aktion={inventurAction} args={{ ...b, methode: "starten" }} titel={T.primaer.starten} frage={{ titel: "Zählung starten?", text: T.hinweisAnlegen }} erfolg="Zählung gestartet" testid="primaer" />;
  else if (doc.status === "Laufend" && leitung) primaer = <VorgangKnopf variant="primary" icon="CircleCheck" aktion={inventurFreigebenAction} args={b} titel={T.primaer.freigeben} disabled={!freigabe.darf} grund={freigabe.gruende.map((g) => g.text).join(" ") || undefined} frage={{ titel: "Inventur freigeben und buchen?", text: freigabe.zusammenfassung, bestaetigen: "Freigeben und buchen" }} erfolg="Inventur abgeschlossen" testid="primaer" />;
  else if (doc.status === "Laufend") primaer = <Knopf variant="primary" icon="ScanLine" href={`/logistik/inventur/${encodeURIComponent(name)}/zaehlen`} data-testid="primaer">{T.primaer.zaehlmodus}</Knopf>;
  else if (doc.status === "Abgeschlossen") primaer = <Knopf variant="primary" icon="Printer" href={druckHref("PH Inventur", name, "PH Inventur Zaehlliste")} data-testid="primaer">Zählliste drucken</Knopf>;
  const tabs = [{ id: "zaehlliste", titel: T.tabs.zaehlliste, anzahl: pos.length }, { id: "differenzen", titel: T.tabs.differenzen, anzahl: f.differenzen }, { id: "verlauf", titel: T.tabs.verlauf }];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "zaehlliste";
  const band = doc.status === "Laufend" && a.bewegungenSeitStart.length
    ? { ton: "gefahr", titel: `${a.bewegungenSeitStart.length} ${a.bewegungenSeitStart.length === 1 ? "Bewegung" : "Bewegungen"} seit Zählbeginn – betroffene Positionen nachzählen`, text: a.bewegungenSeitStart.map((x) => x.name).join(", ") }
    : doc.status === "Laufend" && f.ohneGrund ? { ton: "warnung", titel: `${f.ohneGrund} ${f.ohneGrund === 1 ? "Differenz" : "Differenzen"} ohne Grund`, aktion: <Knopf size="s" href={`/logistik/inventur/${encodeURIComponent(name)}?tab=differenzen`}>Zeigen</Knopf> } : null;
  return (
    <AkteSeite session={session} doctype="PH Inventur" doc={doc} liste={{ href: "/logistik/inventur", titel: T.titel }}
      titel={doc.titel || name} nummer={<span className="bo-log-mono" style={{ whiteSpace: "normal" }}>{name} · {doc.lagerort} · {doc.inventur_art}{doc.gezaehlt_von ? ` · zählt ${doc.gezaehlt_von.split("@")[0]}` : ""}</span>}
      band={band}
      aktionen={<>
        <MehrMenue eintraege={[
          { titel: "Zählliste drucken", icon: "Printer", href: druckHref("PH Inventur", name, "PH Inventur Zaehlliste") },
          doc.status === "Laufend" ? { titel: T.primaer.zaehlmodus, icon: "ScanLine", href: `/logistik/inventur/${encodeURIComponent(name)}/zaehlen` } : null,
          doc.status === "Geplant" && pos.length ? { titel: T.neuErzeugen, icon: "RotateCcw", aktion: inventurAction, args: { ...b, methode: "zaehlliste_erzeugen" }, frage: { titel: T.neuErzeugenFrage(f.gezaehlt), gefaehrlich: true } } : null,
          ["Geplant", "Laufend"].includes(doc.status) && (doc.status === "Geplant" || leitung) ? { titel: "Verwerfen", icon: "X", gefaehrlich: true, aktion: inventurAction, args: { ...b, methode: "verwerfen" }, frage: { titel: "Inventur verwerfen?", text: "Gezählte Werte werden nicht gebucht.", gefaehrlich: true } } : null,
        ]} />
        {primaer}
      </>}
      tabs={tabs} tab={tab} basis={`/logistik/inventur/${encodeURIComponent(name)}`} params={sp}
      details={[{ label: "Stichtag", wert: datumLang(doc.datum) }, { label: "Gezählt", wert: <span className="flex flex-col gap-1">{`${f.gezaehlt}/${f.positionen}`}<Balken anteil={f.anteil} label={`${f.gezaehlt} von ${f.positionen}`} /></span> }, { label: "Differenzen", wert: `${f.differenzen} · netto ${f.summeDifferenz > 0 ? "+" : ""}${f.summeDifferenz}` }, doc.plaetze ? { label: "Plätze", wert: doc.plaetze.split("\n").join(", ") } : null, { label: "Freigegeben", wert: doc.freigegeben_von ? `${doc.freigegeben_von.split("@")[0]} · ${datumLang(doc.freigegeben_am)}` : "–" }]}
    >
      {doc.status === "Laufend" && leitung && !freigabe.darf ? (
        <Kachel className="mb-6" titel="Freigabe noch nicht möglich" testid="freigabe-gruende"><ul className="flex flex-col gap-1 text-[14px]">{freigabe.gruende.map((g) => <li key={g.code}>· {g.text}</li>)}</ul></Kachel>
      ) : null}
      {tab === "zaehlliste" && <Kachel titel={T.tabs.zaehlliste} werkzeuge={doc.status === "Laufend" ? <Knopf size="s" icon="ScanLine" href={`/logistik/inventur/${encodeURIComponent(name)}/zaehlen`}>{T.primaer.zaehlmodus}</Knopf> : null}><Zaehlliste inventur={name} positionen={pos} laufend={doc.status === "Laufend"} sollAusblenden={a.sollAusblenden} aktion={inventurAction} grundAktion={inventurGrundAction} /></Kachel>}
      {tab === "differenzen" && <Kachel titel={T.tabs.differenzen} unter="Grund ist Pflicht vor der Freigabe"><Zaehlliste inventur={name} positionen={pos} laufend={doc.status === "Laufend"} sollAusblenden={false} aktion={inventurAction} grundAktion={inventurGrundAction} nurDifferenzen /></Kachel>}
      {tab === "verlauf" && <Kachel titel={T.tabs.verlauf}><Verlauf doctype="PH Inventur" name={name} docinfo={a.docinfo} /></Kachel>}
    </AkteSeite>
  );
}
