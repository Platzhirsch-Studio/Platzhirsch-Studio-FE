import { notFound } from "next/navigation";
import Kachel from "@/components/Backoffice/Kachel";
import Pruefung from "@/components/Backoffice/Logistik/Pruefung";
import { MehrMenue, VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Fakten, datumLang } from "@/components/Backoffice/Logistik/ui";
import { ruecknahmeAction } from "@/lib/backoffice/logistik/actions";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { druckHref } from "@/lib/backoffice/druck";
import { wertText } from "@/lib/backoffice/logistik/status";
import { RUECKNAHME as T } from "@/lib/backoffice/logistik/texte";
import { AkteSeite, Verlauf, seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

// Warenrücknahme (§ 4.9): Annehmen (Name/Unterschrift) · Prüfung buchen (Pflichtfelder je Position) · Abschließen (Leitung).
export default async function RuecknahmeAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/ruecknahmen/${encodeURIComponent(name)}`);
  const { doc, docinfo } = await client.getDocMitInfo("PH Warenruecknahme", name).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  const a = { name };
  let primaer = null;
  if (doc.status === "Angemeldet") primaer = <VorgangKnopf variant="primary" icon="CircleCheck" aktion={ruecknahmeAction} args={{ ...a, methode: "annehmen" }} feldPfad="args" titel={T.primaer.annehmen} felder={[{ name: "unterschrift_name", label: "Übergeben von (Name)", pflicht: true }]} dialogText="Fotos der Ware hängen Fahrer oder Lager am Beleg an." erfolg="Angenommen" testid="primaer" />;
  else if (doc.status === "Geprueft" && leitung) primaer = <VorgangKnopf variant="primary" icon="CircleCheck" aktion={ruecknahmeAction} args={{ ...a, methode: "abschliessen" }} titel={T.primaer.abschliessen} frage={{ titel: "Rücknahme abschließen?" }} erfolg="Abgeschlossen" testid="primaer" />;
  const tabs = [{ id: "positionen", titel: "Positionen", anzahl: (doc.positionen || []).length }, { id: "verlauf", titel: "Verlauf" }];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "positionen";
  return (
    <AkteSeite session={session} doctype="PH Warenruecknahme" doc={doc} liste={{ href: "/logistik/ruecknahmen", titel: T.liste }}
      titel={`${wertText(doc.anlass)} · ${doc.kunde_name || "–"}`} nummer={<span className="bo-log-mono">{name}</span>}
      band={["Geprueft", "Abgeschlossen"].includes(doc.status) ? { ton: "info", titel: T.gutschrift, text: doc.gutschrift ? `Gutschrift ${doc.gutschrift}` : doc.gutschrift_hinweis || undefined } : null}
      aktionen={<>
        <MehrMenue eintraege={[
          { titel: "Protokoll drucken", icon: "Printer", href: druckHref("PH Warenruecknahme", name, "PH Warenruecknahme Protokoll") },
          ["Angenommen", "Geprueft"].includes(doc.status) ? { titel: "Servicefall anlegen", icon: "Wrench", aktion: ruecknahmeAction, args: { ...a, methode: "servicefall_anlegen" }, erfolg: "Servicefall angelegt" } : null,
          doc.lieferschein ? { titel: "Lieferschein öffnen", icon: "FileText", href: `/logistik/lieferscheine/${encodeURIComponent(doc.lieferschein)}` } : null,
        ]} />
        {!["Abgeschlossen", "Storniert"].includes(doc.status) ? <VorgangKnopf variant="ghost" icon="X" aktion={ruecknahmeAction} args={{ ...a, methode: "stornieren" }} feldPfad="args" titel="Stornieren" frage={{ gefaehrlich: true, bestaetigen: "Stornieren" }} felder={[{ name: "grund", label: "Grund", typ: "text", pflicht: true }]} erfolg="Storniert" /> : null}
        {primaer}
      </>}
      tabs={tabs} tab={tab} basis={`/logistik/ruecknahmen/${encodeURIComponent(name)}`} params={sp}
      details={[{ label: "Grund", wert: doc.grund }, { label: "Abholung", wert: datumLang(doc.abhol_datum) }, { label: "Eingegangen", wert: datumLang(doc.eingegangen_am) }, { label: "Geprüft", wert: datumLang(doc.geprueft_am) }, { label: "Lagerort", wert: doc.lagerort }]}
    >
      {tab === "positionen" && <Kachel titel={doc.status === "Angenommen" ? "Prüfung" : "Positionen"}><Pruefung name={name} positionen={doc.positionen || []} buchen={ruecknahmeAction} bearbeitbar={doc.status === "Angenommen"} /></Kachel>}
      {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf doctype="PH Warenruecknahme" name={name} docinfo={docinfo} /></Kachel>}
      {tab === "positionen" && doc.status !== "Angenommen" ? <Kachel className="mt-6" titel="Hinweis"><Fakten eintraege={[{ label: "Alle gebucht", wert: Number(doc.alle_gebucht) ? "ja" : "nein" }]} /></Kachel> : null}
    </AkteSeite>
  );
}
