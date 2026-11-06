import { notFound, redirect } from "next/navigation";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { MehrMenue, VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { datumLang } from "@/components/Backoffice/Logistik/ui";
import { bewertungAction } from "@/lib/backoffice/logistik/actions";
import { summen } from "@/lib/backoffice/logistik/inventur";
import { wertText } from "@/lib/backoffice/logistik/status";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { druckHref } from "@/lib/backoffice/druck";
import { cent } from "@/lib/backoffice/format";
import { INVENTUR as T } from "@/lib/backoffice/logistik/texte";
import { AkteSeite, seite, werte } from "../../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

// Inventurbewertung (Beleg): Summen je Lagerort/Bewertungsart, Positionen mit Einstandspreis, Abwertung, Niederstwert.
export default async function BewertungAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/inventur/bewertung/${encodeURIComponent(name)}`);
  if (!leitung) redirect("/kein-zugriff?bereich=logistik&aktion=bewertung");
  const doc = await client.getDoc("PH Inventurbewertung", name).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  const pos = doc.positionen || [];
  const tabs = [{ id: "summen", titel: T.bewertung.summen }, { id: "positionen", titel: "Positionen", anzahl: pos.length }];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "summen";
  const entwurf = doc.status === "Entwurf";
  return (
    <AkteSeite session={session} doctype="PH Inventurbewertung" doc={doc} liste={{ href: "/logistik/inventur/bewertung", titel: T.bewertung.titel }}
      titel={`${T.bewertung.titel} ${datumLang(doc.stichtag)}`} nummer={<span className="bo-log-mono">{name} · {doc.methode}</span>}
      band={Number(doc.abwertung_platzhalter) ? { ton: "warnung", titel: T.bewertung.platzhalter } : !entwurf ? { ton: "info", titel: T.bewertung.unveraenderlich } : null}
      aktionen={<>
        <Knopf variant="ghost" icon="Printer" label="Drucken" href={druckHref("PH Inventurbewertung", name, "PH Inventurbewertung")} />
        <MehrMenue eintraege={entwurf ? [{ titel: "Neu berechnen", icon: "RefreshCw", aktion: bewertungAction, args: { name, methode: "berechnen" }, erfolg: "Berechnet" }, { titel: "Verwerfen", icon: "X", gefaehrlich: true, aktion: bewertungAction, args: { name, methode: "verwerfen" }, frage: { titel: "Bewertung verwerfen?", gefaehrlich: true } }] : []} />
        {entwurf ? <VorgangKnopf variant="primary" icon="Lock" aktion={bewertungAction} args={{ name, methode: "festschreiben" }} titel={T.bewertung.festschreiben} frage={{ titel: "Bewertung festschreiben?", text: "Danach unveränderlich; Faktura übernimmt die Bestandsveränderung in den Export.", bestaetigen: "Festschreiben" }} erfolg="Festgeschrieben" testid="primaer" /> : null}
      </>}
      tabs={tabs} tab={tab} basis={`/logistik/inventur/bewertung/${encodeURIComponent(name)}`} params={sp}
      details={[{ label: T.bewertung.wertAk, wert: cent(doc.wert_ak_cent) }, { label: T.bewertung.abwertung, wert: cent(doc.abwertung_cent) }, { label: T.bewertung.wert, wert: cent(doc.wert_cent) }, { label: "Positionen", wert: doc.anzahl_positionen }, { label: "Berechnet", wert: datumLang(doc.berechnet_am) }]}
    >
      {tab === "summen" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[["lagerort", "Je Lagerort"], ["bewertungsart", "Je Bewertungsart"]].map(([k, titel]) => (
            <Kachel key={k} titel={titel}>
              <div className="bo-log-tabhuelle"><table className="bo-log-tab"><thead><tr><th>Gruppe</th><th className="r">Menge</th><th className="r">{T.bewertung.wertAk}</th><th className="r">{T.bewertung.wert}</th></tr></thead>
                <tbody>{summen(pos, k).map((s) => <tr key={s.gruppe}><td>{wertText(s.gruppe)}</td><td className="r">{s.menge}</td><td className="r">{cent(s.wert_ak_cent)}</td><td className="r">{cent(s.wert_cent)}</td></tr>)}</tbody></table></div>
            </Kachel>
          ))}
          <Kachel className="md:col-span-2" titel="Methode"><p className="text-[15px]">{doc.methode_beschreibung}</p></Kachel>
        </div>
      )}
      {tab === "positionen" && (
        <Kachel titel="Positionen">
          <div className="bo-log-tabhuelle">
            <table className="bo-log-tab"><thead><tr><th>Artikel</th><th>Lagerort</th><th>Art</th><th className="r">Menge</th><th className="r">EK</th><th className="r">Alter</th><th className="r">Abwertung</th><th className="r">Wert</th></tr></thead>
              <tbody>{pos.map((p) => <tr key={p.name || p.idx}><td>{p.produkt_name}<span className="bo-log-mono block">{p.seriennummer}</span></td><td>{p.lagerort} {p.platz}</td><td>{wertText(p.bewertungsart)}</td><td className="r">{p.menge}</td><td className="r">{cent(p.einstandspreis_cent)}</td><td className="r">{p.alter_monate} M.</td><td className="r">{(p.abwertung_promille / 10).toLocaleString("de-AT")} %</td><td className="r">{cent(p.wert_cent)}</td></tr>)}</tbody></table>
          </div>
        </Kachel>
      )}
    </AkteSeite>
  );
}
