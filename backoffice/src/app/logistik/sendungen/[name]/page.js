import { notFound } from "next/navigation";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { MehrMenue, VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Chip, Fakten, Zeile, datumLang } from "@/components/Backoffice/Logistik/ui";
import { sendungAction, sendungKlaerenAction } from "@/lib/backoffice/logistik/actions";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { cent } from "@/lib/backoffice/format";
import { SENDUNG as T, LEER } from "@/lib/backoffice/logistik/texte";
import { AkteSeite, Verlauf, seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

// Sendungs-Akte (§ 4.5): Primär je Zustand, „Klären“ mit vier Wegen, Tracking-Zeitstrahl, Kosten.
export default async function SendungAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/sendungen/${encodeURIComponent(name)}`);
  const { doc, docinfo } = await client.getDocMitInfo("PH Sendung", name).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  const a = { name };
  let primaer = null;
  if (doc.status === "Angelegt" && doc.dienstleister === "LetMeShip") primaer = <VorgangKnopf variant="primary" icon="Printer" aktion={sendungAction} args={{ ...a, methode: "buchen" }} titel={T.primaer.buchen} erfolg="Etikett gebucht" testid="primaer" />;
  else if (doc.status === "Angelegt") primaer = <VorgangKnopf variant="primary" icon="Pencil" aktion={sendungAction} args={{ ...a, methode: "buchen" }} titel={T.primaer.trackingNr} erfolg="Gespeichert" testid="primaer" />;
  else if (doc.status === "Etikett") primaer = <Knopf variant="primary" icon="Printer" href={`/api/datei?url=${encodeURIComponent(doc.etikett || "")}`} data-testid="primaer">{T.primaer.drucken}</Knopf>;
  else if (doc.status === "Unterwegs") primaer = <VorgangKnopf variant="primary" icon="RefreshCw" aktion={sendungAction} args={{ ...a, methode: "tracking_aktualisieren" }} titel={T.primaer.tracking} erfolg="Abgeglichen" testid="primaer" />;
  else if (doc.status === "Problem")
    primaer = (
      <VorgangKnopf variant="primary" icon="TriangleAlert" aktion={sendungKlaerenAction} args={a} titel={T.primaer.klaeren} dialogTitel={T.klaeren.titel} dialogText={doc.fehler}
        felder={[{ name: "weg", label: "Weg", typ: "auswahl", pflicht: true, start: "abwarten", optionen: [{ wert: "abwarten", titel: T.klaeren.wege.abwarten }, { wert: "zugestellt", titel: T.klaeren.wege.zugestellt, deaktiviert: !leitung }, { wert: "zurueck", titel: T.klaeren.wege.zurueck }, { wert: "neu", titel: T.klaeren.wege.neu }] }, { name: "notiz", label: "Notiz", typ: "text", hinweis: T.klaeren.neuHinweis }]}
        erfolg="Geklärt" testid="primaer" />
    );
  const tabs = [{ id: "tracking", titel: T.tabs.tracking, anzahl: (doc.tracking_verlauf || []).length }, { id: "daten", titel: T.tabs.daten }, { id: "kosten", titel: T.tabs.kosten }, { id: "verlauf", titel: T.tabs.verlauf }];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "tracking";
  const stornierbar = doc.status === "Angelegt" || (leitung && ["Etikett", "Problem"].includes(doc.status));
  return (
    <AkteSeite session={session} doctype="PH Sendung" doc={doc} liste={{ href: "/logistik/sendungen", titel: T.liste }}
      titel={`${doc.richtung} · ${[doc.carrier, doc.service_name].filter(Boolean).join(" ") || "ohne Dienst"} → ${doc.empf_ort || "–"}`}
      nummer={<span className="inline-flex items-center gap-2"><span className="bo-log-mono">{name}</span>{doc.env !== "live" ? <Chip ton="special">{T.test}</Chip> : null}</span>}
      band={doc.fehler ? { ton: doc.status === "Problem" ? "gefahr" : "warnung", titel: `Letzter Fehler: ${doc.fehler}`, text: doc.letzter_abgleich ? `Abgleich ${datumLang(doc.letzter_abgleich)}` : undefined } : null}
      aktionen={<>
        <MehrMenue eintraege={[
          doc.lieferschein ? { titel: "Lieferschein öffnen", icon: "FileText", href: `/logistik/lieferscheine/${encodeURIComponent(doc.lieferschein)}` } : null,
          ["Etikett", "Unterwegs", "Zugestellt"].includes(doc.status) && doc.richtung === "Ausgang" ? { titel: "Retourenlabel", icon: "Undo2", aktion: sendungAction, args: { ...a, methode: "retourenlabel" }, erfolg: "Retourenlabel angelegt" } : null,
          doc.status === "Unterwegs" ? { titel: "Problem melden", icon: "TriangleAlert", aktion: sendungAction, args: { ...a, methode: "problem_melden", args: { text: "Problem gemeldet" } }, erfolg: "Gemeldet" } : null,
          stornierbar ? { titel: "Stornieren", icon: "X", gefaehrlich: true, aktion: sendungAction, args: { ...a, methode: "stornieren" }, frage: { titel: `${name} stornieren?`, gefaehrlich: true } } : doc.status === "Unterwegs" ? { titel: "Stornieren", icon: "X", deaktiviert: true, grund: T.unterwegsStorno } : null,
        ]} />
        {primaer}
      </>}
      tabs={tabs} tab={tab} basis={`/logistik/sendungen/${encodeURIComponent(name)}`} params={sp}
      details={[{ label: T.felder.tracking, wert: doc.tracking_nr ? <span className="bo-log-mono">{doc.tracking_nr}</span> : "–" }, { label: "Gebucht", wert: datumLang(doc.gebucht_am) }, { label: T.felder.seit, wert: datumLang(doc.unterwegs_seit) }, { label: T.felder.abgleich, wert: datumLang(doc.letzter_abgleich) }]}
    >
      {tab === "tracking" && (
        <Kachel titel={T.tabs.tracking} werkzeuge={doc.tracking_url ? <Knopf size="s" href={doc.tracking_url} iconRechts="ArrowUpRight">Beim Carrier</Knopf> : null}>
          {(doc.tracking_verlauf || []).length ? (
            <ol className="bo-log-zeilen" data-testid="tracking">
              {[...doc.tracking_verlauf].sort((x, y) => String(y.zeit).localeCompare(String(x.zeit))).map((t) => (
                <li key={t.name || t.zeit}><Zeile as="div" titel={t.text || t.status} unter={`${datumLang(t.zeit)} · ${t.ort || ""}`} rechts={t.code ? <span className="bo-log-mono">{t.code}</span> : null} /></li>
              ))}
            </ol>
          ) : <p className="bo-log-cap">{LEER.tracking}</p>}
        </Kachel>
      )}
      {tab === "daten" && (
        <Kachel titel="Empfänger">
          <Fakten eintraege={[{ label: "Name", wert: doc.empf_name }, { label: "Firma", wert: doc.empf_firma }, { label: "Adresse", wert: [doc.empf_strasse, doc.empf_hausnr].filter(Boolean).join(" ") }, { label: "Ort", wert: [doc.empf_plz, doc.empf_ort, doc.empf_land].filter(Boolean).join(" ") }, { label: "Pakete", wert: doc.anzahl_pakete }, { label: "Inhalt", wert: doc.inhalt }]} />
        </Kachel>
      )}
      {tab === "kosten" && (
        <Kachel titel={T.tabs.kosten}>
          <Fakten eintraege={[{ label: T.felder.preis, wert: cent(doc.preis_brutto_cent) }, { label: T.felder.berechnet, wert: cent(doc.berechnet_cent) }, leitung ? { label: T.felder.differenz, wert: cent(Number(doc.berechnet_cent || 0) - Number(doc.preis_brutto_cent || 0)) } : null]} />
        </Kachel>
      )}
      {tab === "verlauf" && <Kachel titel={T.tabs.verlauf}><Verlauf doctype="PH Sendung" name={name} docinfo={docinfo} /></Kachel>}
    </AkteSeite>
  );
}
