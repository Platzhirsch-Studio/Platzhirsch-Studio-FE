import { notFound } from "next/navigation";
import Link from "next/link";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { MehrMenue, VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Fakten, datumLang, kgText } from "@/components/Backoffice/Logistik/ui";
import { speditionAction } from "@/lib/backoffice/logistik/actions";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { druckHref } from "@/lib/backoffice/druck";
import { cent } from "@/lib/backoffice/format";
import { SPEDITION as T } from "@/lib/backoffice/logistik/texte";
import { AkteSeite, Verlauf, seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

// Speditionsauftrag (§ 4.8): Senden (Mail + PDF) · Bestätigung erfassen · Abgeholt · Zustellung (Empfänger Pflicht).
export default async function SpeditionAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/speditionen/${encodeURIComponent(name)}`);
  const { doc, docinfo } = await client.getDocMitInfo("PH Speditionsauftrag", name).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  const pk = doc.packstuecke || [];
  const a = { name };
  let primaer = null;
  if (doc.status === "Entwurf") {
    const grund = !doc.spediteur_email ? T.ohneMail : !pk.length ? T.ohnePackstuecke : undefined;
    primaer = <VorgangKnopf variant="primary" icon="Mail" aktion={speditionAction} args={{ ...a, methode: "per_email_senden" }} titel={T.primaer.senden} frage={{ titel: `Auftrag an ${doc.spediteur_email || "–"} senden?`, text: "Mit PDF „Speditionsauftrag Standard“.", bestaetigen: "Senden" }} disabled={!!grund} grund={grund} erfolg="Gesendet" testid="primaer" />;
  } else if (doc.status === "Gesendet") primaer = <VorgangKnopf variant="primary" icon="CircleCheck" aktion={speditionAction} args={{ ...a, methode: "bestaetigen" }} feldPfad="args" titel={T.primaer.bestaetigen} felder={[{ name: "preis_cent", label: "Preis (Cent)", typ: "zahl" }, { name: "abhol_datum", label: "Abholung (JJJJ-MM-TT)", start: doc.abhol_datum || "" }, { name: "zustell_datum", label: "Zustellung (JJJJ-MM-TT)", start: doc.zustell_datum || "" }, { name: "referenz", label: "Referenz der Spedition" }]} erfolg="Bestätigt" testid="primaer" />;
  else if (doc.status === "Bestaetigt") primaer = <VorgangKnopf variant="primary" icon="Truck" aktion={speditionAction} args={{ ...a, methode: "abgeholt" }} titel={T.primaer.abgeholt} frage={{ titel: "Abholung melden?", text: doc.lieferschein ? `Lieferschein ${doc.lieferschein} geht an die Spedition über.` : undefined }} erfolg="Abgeholt" testid="primaer" />;
  else if (doc.status === "Abgeholt") primaer = <VorgangKnopf variant="primary" icon="CircleCheck" aktion={speditionAction} args={{ ...a, methode: "zugestellt" }} feldPfad="args" titel={T.primaer.zugestellt} felder={[{ name: "empfaenger_name", label: "Empfangen von", pflicht: true }]} erfolg="Zugestellt" testid="primaer" />;
  const tabs = [{ id: "adressen", titel: T.tabs.adressen }, { id: "leistungen", titel: T.tabs.leistungen }, { id: "packstuecke", titel: T.tabs.packstuecke, anzahl: pk.length }, leitung ? { id: "kosten", titel: T.tabs.kosten } : null, { id: "verlauf", titel: T.tabs.verlauf }].filter(Boolean);
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "adressen";
  const gewicht = pk.reduce((s, p) => s + Number(p.anzahl || 1) * Number(p.gewicht_g || 0), 0);
  const ja = (x) => (Number(x) ? "ja" : "nein");
  return (
    <AkteSeite session={session} doctype="PH Speditionsauftrag" doc={doc} liste={{ href: "/logistik/speditionen", titel: T.liste }}
      titel={`${doc.richtung} · ${doc.spediteur || "Spedition offen"} → ${doc.ziel_ort || "–"}`} nummer={<span className="bo-log-mono">{name}</span>}
      aktionen={<>
        <MehrMenue eintraege={[
          { titel: "PDF drucken", icon: "Printer", href: druckHref("PH Speditionsauftrag", name, "PH Speditionsauftrag Standard") },
          doc.lieferschein ? { titel: "Lieferschein öffnen", icon: "FileText", href: `/logistik/lieferscheine/${encodeURIComponent(doc.lieferschein)}` } : null,
        ]} />
        {doc.status !== "Storniert" && doc.status !== "Zugestellt" && (doc.status === "Entwurf" || leitung) ? <VorgangKnopf variant="ghost" icon="X" aktion={speditionAction} args={{ ...a, methode: "stornieren" }} feldPfad="args" titel="Stornieren" frage={{ gefaehrlich: true, bestaetigen: "Stornieren" }} felder={[{ name: "grund", label: "Grund", typ: "text", pflicht: true }]} erfolg="Storniert" /> : null}
        {primaer}
      </>}
      tabs={tabs} tab={tab} basis={`/logistik/speditionen/${encodeURIComponent(name)}`} params={sp}
      details={[{ label: "Abholung", wert: `${datumLang(doc.abhol_datum)}${doc.abhol_von ? ` · ${String(doc.abhol_von).slice(0, 5)}–${String(doc.abhol_bis).slice(0, 5)}` : ""}` }, { label: "Zustellung", wert: `${datumLang(doc.zustell_datum)} · ${doc.zustellart || ""}` }, { label: "Packstücke", wert: pk.reduce((s, p) => s + Number(p.anzahl || 1), 0) }, { label: "Gewicht", wert: kgText(gewicht) }, { label: T.lademeter, wert: doc.lademeter ?? "–" }]}
      bezuege={doc.lieferschein ? <Link className="bo-log-zeile" href={`/logistik/lieferscheine/${encodeURIComponent(doc.lieferschein)}`}><span className="bo-log-zeile__titel">{doc.lieferschein}</span></Link> : null}
    >
      {tab === "adressen" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Kachel titel="Abholung"><Fakten eintraege={[{ label: "Name", wert: doc.abhol_name }, { label: "Adresse", wert: [doc.abhol_strasse, doc.abhol_plz, doc.abhol_ort, doc.abhol_land].filter(Boolean).join(" ") }, { label: "Telefon", wert: doc.abhol_telefon }]} /></Kachel>
          <Kachel titel="Ziel"><Fakten eintraege={[{ label: "Name", wert: doc.ziel_name }, { label: "Adresse", wert: [doc.ziel_strasse, doc.ziel_plz, doc.ziel_ort, doc.ziel_land].filter(Boolean).join(" ") }, { label: "Telefon", wert: doc.ziel_telefon }]} /></Kachel>
        </div>
      )}
      {tab === "leistungen" && <Kachel titel={T.tabs.leistungen}><Fakten eintraege={[{ label: "Etage", wert: doc.etage }, { label: "Aufzug", wert: ja(doc.aufzug) }, { label: "Hebebühne", wert: ja(doc.hebebuehne) }, { label: "Trageservice", wert: ja(doc.trageservice) }, { label: "Montage", wert: ja(doc.montage) }, { label: "Verpackung entsorgen", wert: ja(doc.verpackung_entsorgen) }, { label: "Avis", wert: ja(doc.avis_noetig) }]} /></Kachel>}
      {tab === "packstuecke" && (
        <Kachel titel={T.tabs.packstuecke}>
          {pk.length ? (
            <table className="bo-log-tab"><thead><tr><th>Art</th><th className="r">Anzahl</th><th>Maße</th><th className="r">Gewicht</th></tr></thead>
              <tbody>{pk.map((p) => <tr key={p.name || p.idx}><td>{p.art}</td><td className="r">{p.anzahl}</td><td>{p.laenge_cm} × {p.breite_cm} × {p.hoehe_cm} cm</td><td className="r">{kgText(p.gewicht_g)}</td></tr>)}</tbody></table>
          ) : <p className="bo-log-cap">Noch keine Packstücke – ohne Packstücke ist der Auftrag nicht sendbar.</p>}
        </Kachel>
      )}
      {tab === "kosten" && <Kachel titel={T.tabs.kosten}><Fakten eintraege={[{ label: "Angefragt", wert: cent(doc.preis_angefragt_cent) }, { label: "Bestätigt", wert: cent(doc.preis_bestaetigt_cent) }]} /></Kachel>}
      {tab === "verlauf" && <Kachel titel={T.tabs.verlauf}><Verlauf doctype="PH Speditionsauftrag" name={name} docinfo={docinfo} /></Kachel>}
      {doc.status === "Storniert" ? <Knopf href="/logistik/speditionen">Zur Liste</Knopf> : null}
    </AkteSeite>
  );
}
