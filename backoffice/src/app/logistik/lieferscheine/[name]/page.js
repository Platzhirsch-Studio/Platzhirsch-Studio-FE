import { notFound } from "next/navigation";
import Link from "next/link";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import { MehrMenue, VerzoegertKnopf, VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Chip, Fakten, Lieferart, StatusPille, Zeile, datumLang, kgText } from "@/components/Backoffice/Logistik/ui";
import { druckHref } from "@/lib/backoffice/druck";
import { lieferscheinAkte } from "@/lib/backoffice/logistik/daten";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { darfFaktura } from "@/lib/backoffice/logistik/rechte";
import { lieferartText } from "@/lib/backoffice/logistik/status";
import { LIEFERSCHEIN as T, LEER } from "@/lib/backoffice/logistik/texte";
import { cent } from "@/lib/backoffice/format";
import {
  ausTourAction, gepacktPlanenAction, lsMethodeAction, paketeVorschlagenAction, problemAction, ruecknahmeAnlegenAction, speditionAnlegenAction, stornoAction,
  uebergebenPlanenAction, zurueckAufEntwurfAction, zustellungAction,
} from "@/lib/backoffice/logistik/actions";
import { AkteSeite, Verlauf, seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

const GRUENDE = [{ wert: "Beschaedigt", titel: "Beschädigt" }, { wert: "Fehlt", titel: "Fehlt" }, { wert: "Falscher Artikel", titel: "Falscher Artikel" }, { wert: "Adresse unklar", titel: "Adresse unklar" }, { wert: "Sonstiges", titel: "Sonstiges" }];

// Lieferschein-Akte (§ 4.3): Kopf mit max. 2 Kennzeichen, Bänder (eines), Primäraktion je Zustand, ⋯, 5 Reiter, Bezüge.
export default async function LieferscheinAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/lieferscheine/${encodeURIComponent(name)}`);
  const a = await lieferscheinAkte(client, name, { session, leitung }).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  const { doc } = a;
  const pos = doc.positionen || [];
  const allesGepackt = pos.length > 0 && pos.every((p) => Number(p.menge_gepackt || 0) >= Number(p.menge || 0));
  const gepacktStueck = pos.reduce((s, p) => s + Math.min(Number(p.menge_gepackt || 0), Number(p.menge || 0)), 0);
  const stueck = pos.reduce((s, p) => s + Number(p.menge || 0), 0);
  const spedition = a.speditionen.find((s) => s.status !== "Storniert");
  const ueberschreiben = a.sperre.gesperrt && a.sperre.art === "anzahlung" && leitung ? [{ name: "override", label: "Grund (Leitung)", pflicht: true, typ: "text", hinweis: "Der Grund wird als Kommentar am Beleg gespeichert." }] : undefined;
  const sperreGrund = a.sperre.gesperrt && !leitung ? a.sperre.text : undefined;

  // ---------------------------------------------------------- Primäraktion je Zustand (§ 4.3)
  let primaer = null;
  const ls = { lieferschein: name };
  if (doc.status === "Entwurf" && !allesGepackt) primaer = <Knopf variant="primary" icon="PackageCheck" href={`/logistik/packen/${encodeURIComponent(name)}`} data-testid="primaer">{T.primaer.packAnsicht}</Knopf>;
  else if (doc.status === "Entwurf" && ["Versand", "Spedition"].includes(doc.lieferart) && !(doc.pakete || []).length) primaer = <VorgangKnopf variant="primary" icon="Package" aktion={paketeVorschlagenAction} args={ls} titel={T.primaer.paketeVorschlagen} erfolg="Pakete vorgeschlagen" testid="primaer" />;
  else if (doc.status === "Entwurf") primaer = <VerzoegertKnopf planen={gepacktPlanenAction} args={ls} titel={T.primaer.gepackt} text="Gepackt" icon="PackageCheck" testid="primaer" />;
  else if (doc.status === "Gepackt" && doc.lieferart === "Versand" && !a.aktiveSendung) primaer = <Knopf variant="primary" icon="Printer" href={`/logistik/packen/${encodeURIComponent(name)}`} data-testid="primaer">{T.primaer.etikett}</Knopf>;
  else if (doc.status === "Gepackt" && doc.lieferart === "Versand" && a.aktiveSendung?.status === "Etikett") primaer = <Knopf variant="primary" icon="Printer" href={`/logistik/sendungen/${encodeURIComponent(a.aktiveSendung.name)}`} data-testid="primaer">{T.primaer.etikettDrucken}</Knopf>;
  else if (doc.status === "Gepackt" && doc.lieferart === "Abholung") primaer = <Knopf variant="primary" icon="Store" href={`/logistik/packen/${encodeURIComponent(name)}`} data-testid="primaer">{T.primaer.ausgeben}</Knopf>;
  else if (doc.status === "Gepackt" && doc.lieferart === "Eigenlieferung" && !doc.tour) primaer = <Knopf variant="primary" icon="Truck" href={`/logistik/touren?ansicht=plantafel&ls=${encodeURIComponent(name)}`} data-testid="primaer">{T.primaer.zurTour}</Knopf>;
  else if (doc.status === "Gepackt" && doc.lieferart === "Spedition") primaer = spedition ? <Knopf variant="primary" icon="Truck" href={`/logistik/speditionen/${encodeURIComponent(spedition.name)}`} data-testid="primaer">{T.primaer.speditionOeffnen}</Knopf> : <VorgangKnopf variant="primary" icon="Truck" aktion={speditionAnlegenAction} args={ls} titel={T.primaer.spedition} erfolg="Speditionsauftrag angelegt" ziel="/logistik/speditionen/" zielFeld="name" testid="primaer" />;
  else if (doc.status === "Gepackt" && doc.tour) primaer = <Knopf variant="primary" icon="Truck" href={`/logistik/touren/${encodeURIComponent(doc.tour)}`} data-testid="primaer">{T.primaer.tourOeffnen}</Knopf>;
  else if (doc.status === "Uebergeben" && doc.lieferart === "Versand" && a.aktiveSendung) primaer = <Knopf variant="primary" icon="MapPin" href={`/logistik/sendungen/${encodeURIComponent(a.aktiveSendung.name)}`} data-testid="primaer">{T.primaer.tracking}</Knopf>;
  else if (doc.status === "Uebergeben") primaer = <VorgangKnopf variant="primary" icon="CircleCheck" aktion={zustellungAction} args={{ name }} titel={T.primaer.zustellung} felder={[{ name: "empfaengerName", label: "Empfangen von" }, { name: "notiz", label: "Notiz", typ: "text" }]} dialogText={a.ab && /ausfuhr|innergemeinschaft|steuerfrei/i.test(a.ab.ust_fall || "") ? "Empfangsbestätigung mit Ort, Datum, Menge für Faktura beilegen." : undefined} erfolg="Zugestellt" testid="primaer" />;
  else if (doc.status === "Zugestellt" && doc.kunde_email && !doc.lieferbestaetigung_gesendet_am) primaer = <VorgangKnopf variant="primary" icon="Mail" aktion={lsMethodeAction} args={{ namen: [name], methode: "lieferbestaetigung_senden" }} titel={T.primaer.lieferbestaetigung} frage={{ titel: `Lieferbestätigung an ${doc.kunde_email} senden?`, bestaetigen: "Senden" }} erfolg="Lieferbestätigung gesendet" testid="primaer" />;
  else if (doc.status === "Zugestellt" && !doc.kunde_email) primaer = <Knopf variant="primary" icon="Printer" href={druckHref("PH Lieferschein", name, "PH Lieferschein Standard")} data-testid="primaer">{T.primaer.drucken}</Knopf>;

  const mehr = [
    { titel: T.mehr.packliste, icon: "Rows3", href: druckHref("PH Lieferschein", name, "PH Lieferschein Packliste") },
    { titel: T.mehr.lieferschein, icon: "FileText", href: druckHref("PH Lieferschein", name, "PH Lieferschein Standard") },
    doc.status === "Gepackt" && ["Versand", "Spedition"].includes(doc.lieferart) && !a.sperre.gesperrt ? { titel: T.mehr.uebergeben, icon: "Truck", aktion: uebergebenPlanenAction, args: { namen: [name], an: doc.lieferart === "Spedition" ? "Spedition" : "Dienstleister" }, erfolg: "Übergeben" } : null,
    doc.status === "Gepackt" && doc.tour ? { titel: T.mehr.ausTour, icon: "Undo2", aktion: ausTourAction, args: { tour: doc.tour, stopp: name }, erfolg: "Aus der Tour entfernt" } : null,
    doc.status === "Gepackt" && doc.lieferart === "Abholung" ? { titel: T.mehr.abholbereitErneut, icon: "Mail", aktion: lsMethodeAction, args: { namen: [name], methode: "abholbereit_melden" }, erfolg: "Abholbereit gemeldet" } : null,
    doc.status === "Gepackt" && leitung ? { titel: T.mehr.zurueckEntwurf, icon: "RotateCcw", aktion: zurueckAufEntwurfAction, args: { name }, frage: { titel: "Zurück auf Entwurf setzen?" } } : null,
    doc.status === "Zugestellt" ? { titel: T.mehr.ruecknahme, icon: "Undo2", aktion: ruecknahmeAnlegenAction, args: { lieferschein: name }, ziel: "/logistik/ruecknahmen/", zielFeld: "name" } : null,
    doc.status === "Zugestellt" && darfFaktura(session) ? { titel: T.mehr.teilrechnung, icon: "Receipt", aktion: lsMethodeAction, args: { namen: [name], methode: "teilrechnung_erstellen" }, frage: { titel: "Teilrechnung erstellen?", text: T.mehr.teilrechnungHinweis } } : null,
  ];

  // ---------------------------------------------------------- Band (eines, nach Wichtigkeit)
  const b = a.baender[0];
  const BAND = {
    storniert: { ton: "gefahr", titel: T.baender.storniert(datumLang(doc.modified), doc.storno_grund) },
    ab: { ton: "gefahr", titel: T.baender.abNichtGemeldet(doc.auftrag) },
    bestand: { ton: "gefahr", titel: T.baender.bestandNichtGebucht(b?.n || 0) },
    anzahlung: { ton: "warnung", titel: T.baender.anzahlung(cent(b?.anz?.fehltCent), cent(b?.anz?.sollCent), doc.auftrag), aktion: doc.auftrag ? <Knopf size="s" href={`/d/ph-auftragsbestaetigung/${encodeURIComponent(doc.auftrag)}`}>Zur AB</Knopf> : null },
    steuer: { ton: "warnung", titel: T.baender.steuernachweis },
    problem: { ton: "neutral", titel: T.baender.problem(doc.problem_grund === "Beschaedigt" ? "Beschädigt" : doc.problem_grund, datumLang(doc.problem_am)), text: doc.problem_text },
    zurueckgestellt: { ton: "warnung", titel: T.baender.zurueckgestellt(doc.zurueckgestellt_grund), text: doc.zurueckgestellt_text },
  };

  const tabs = [
    { id: "uebersicht", titel: T.tabs.uebersicht },
    { id: "positionen", titel: T.tabs.positionen, anzahl: pos.length },
    { id: "pakete", titel: T.tabs.pakete, anzahl: (doc.pakete || []).length },
    { id: "uebergabe", titel: T.tabs.uebergabe },
    { id: "verlauf", titel: T.tabs.verlauf },
  ];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "uebersicht";
  const kennzeichen = [Number(doc.teillieferung) ? T.teil : null, Number(doc.zerbrechlich) ? T.zerbrechlich : null, Number(doc.versichern) ? T.versichert : null].filter(Boolean);

  return (
    <AkteSeite
      session={session}
      doctype="PH Lieferschein"
      doc={doc}
      liste={{ href: "/logistik/lieferscheine", titel: T.liste }}
      titel={`${doc.kunde_name} · ${lieferartText(doc.lieferart)}`}
      nummer={<span className="inline-flex flex-wrap items-center gap-2"><span className="bo-log-mono" style={{ whiteSpace: "normal" }}>{name}</span>{kennzeichen.slice(0, 2).map((k) => <Chip key={k} ton="messing">{k}</Chip>)}{kennzeichen.length > 2 ? <Chip>+{kennzeichen.length - 2}</Chip> : null}{doc.status === "Entwurf" ? <span className="bo-log-cap">{gepacktStueck}/{stueck} gepackt</span> : null}</span>}
      aktionen={<>
        {doc.status !== "Storniert" && doc.status !== "Zugestellt" && doc.status !== "Uebergeben" ? (
          <VorgangKnopf variant="ghost" icon="TriangleAlert" aktion={problemAction} args={ls} titel={T.mehr.problem.replace(" …", "")} felder={[{ name: "grund", label: "Grund", typ: "auswahl", optionen: GRUENDE, start: "Fehlt", pflicht: true }, { name: "text", label: "Beschreibung", typ: "text" }]} erfolg="Gemeldet · Aufgabe an Leitung" testid="problem" />
        ) : null}
        {a.storno.moeglich ? <VorgangKnopf variant="ghost" icon="X" aktion={stornoAction} args={{ name }} titel="Stornieren" frage={{ gefaehrlich: true, bestaetigen: "Stornieren", fakten: [a.aktiveSendung ? T.stornoFolgen.sendung(a.aktiveSendung.name) : null, a.bewegungen.length ? T.stornoFolgen.bewegungen(a.bewegungen.filter((x) => x.art === "Verkauf").length) : null, doc.tour ? T.stornoFolgen.stopp(doc.tour) : null].filter(Boolean) }} felder={[{ name: "grund", label: "Grund", typ: "text", pflicht: true }]} dialogTitel={`${name} stornieren?`} erfolg="Storniert" testid="storno" /> : null}
        <MehrMenue eintraege={mehr} testid="mehr" />
        {primaer}
      </>}
      band={b ? BAND[b.id] : null}
      tabs={tabs}
      tab={tab}
      basis={`/logistik/lieferscheine/${encodeURIComponent(name)}`}
      params={sp}
      details={[
        { label: T.felder.lieferart, wert: <Lieferart wert={doc.lieferart} /> },
        { label: T.felder.wunsch, wert: datumLang(doc.wunschtermin) },
        { label: T.felder.tour, wert: doc.tour ? <Link className="underline" href={`/logistik/touren/${encodeURIComponent(doc.tour)}`}>{doc.tour}</Link> : "–" },
        { label: T.felder.gewicht, wert: kgText(doc.gesamtgewicht_g) },
        leitung ? { label: T.felder.warenwert, wert: a.warenwert.text || cent(a.warenwert.cent) } : null,
      ]}
      bezuege={
        <div className="bo-log-zeilen">
          {doc.kontakt ? <Zeile href={`/d/ph-kontakt/${encodeURIComponent(doc.kontakt)}`} titel="Kunde" unter={doc.kunde_name} /> : null}
          {doc.auftrag ? <Zeile href={`/d/ph-auftragsbestaetigung/${encodeURIComponent(doc.auftrag)}`} titel={doc.auftrag} unter={a.ab ? `Auftragsbestätigung · ${a.ab.status}` : "Auftragsbestätigung"} /> : null}
          {doc.bestellung ? <Zeile href={`/d/ph-bestellung/${encodeURIComponent(doc.bestellung)}`} titel={doc.bestellung} unter="Shop-Bestellung" /> : null}
          {doc.projekt ? <Zeile href={`/d/ph-projekt/${encodeURIComponent(doc.projekt)}`} titel={doc.projekt} unter="Projekt · Phase Lieferung" /> : null}
          {a.sendungen.map((s) => <Zeile key={s.name} href={`/logistik/sendungen/${encodeURIComponent(s.name)}`} titel={s.name} rechts={<StatusPille doctype="PH Sendung" status={s.status} />} />)}
          {a.speditionen.map((s) => <Zeile key={s.name} href={`/logistik/speditionen/${encodeURIComponent(s.name)}`} titel={s.name} rechts={<StatusPille doctype="PH Speditionsauftrag" status={s.status} />} />)}
          {a.ruecknahmen.map((s) => <Zeile key={s.name} href={`/logistik/ruecknahmen/${encodeURIComponent(s.name)}`} titel={s.name} rechts={<StatusPille doctype="PH Warenruecknahme" status={s.status} />} />)}
          {a.bewegungen.length ? <Zeile href={`/logistik/bewegungen?q=${encodeURIComponent(name)}`} titel="Bewegungen" unter={`${a.bewegungen.length} gebucht`} /> : null}
        </div>
      }
    >
      {tab === "uebersicht" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Kachel titel="Lieferung">
            <Fakten eintraege={[
              { label: T.felder.lieferart, wert: <Lieferart wert={doc.lieferart} /> },
              { label: T.felder.datum, wert: datumLang(doc.datum) },
              { label: T.felder.wunsch, wert: datumLang(doc.wunschtermin) },
              { label: T.felder.sprache, wert: doc.sprache },
              { label: T.felder.gewicht, wert: `${kgText(doc.gesamtgewicht_g)}${Number(doc.zerbrechlich) ? " · zerbrechlich" : ""}` },
              { label: T.felder.uebergebenAm, wert: datumLang(doc.uebergeben_am) },
              { label: T.felder.zugestelltAm, wert: datumLang(doc.zugestellt_am) },
            ]} />
            <p className="bo-log-cap mt-4">{T.liefertermine}</p>
          </Kachel>
          <Kachel titel={T.felder.empfaenger}>
            <address className="bo-log-adresse">
              {[doc.liefer_name || doc.kunde_name, doc.liefer_firma, [doc.liefer_strasse, doc.liefer_hausnr].filter(Boolean).join(" "), [doc.liefer_plz, doc.liefer_ort].filter(Boolean).join(" "), doc.liefer_land].filter(Boolean).map((z) => <span key={z} className="block">{z}</span>)}
            </address>
            {doc.lieferhinweis ? <p className="bo-log-hinweis mt-4" data-ton="eiche">{doc.lieferhinweis}</p> : null}
            {doc.notiz_intern ? <p className="bo-log-cap mt-4">{T.felder.notiz}: {doc.notiz_intern}</p> : null}
          </Kachel>
        </div>
      )}
      {tab === "positionen" && (
        <Kachel titel={T.tabs.positionen} unter={doc.auftrag || doc.bestellung ? T.baender.quelleHinweis(doc.auftrag || doc.bestellung) : undefined}>
          <div className="bo-log-tabhuelle">
            <table className="bo-log-tab" data-testid="positionen">
              <thead><tr><th>Bezeichnung</th><th>Bereich</th><th className="r">Menge</th><th className="r">Gepackt</th><th>Paket</th><th>Entnahme</th></tr></thead>
              <tbody>
                {pos.map((p) => (
                  <tr key={p.name}>
                    <td><b className="font-semibold">{p.beschreibung}</b><span className="bo-log-cap block">{[p.marke, p.ean || (p.seriennummer ? `SN ${p.seriennummer}` : "ohne Barcode")].filter(Boolean).join(" · ")}</span></td>
                    <td>{p.bereich || "–"}</td>
                    <td className="r">{p.menge}</td>
                    <td className="r">{p.menge_gepackt || 0}</td>
                    <td>{p.paket_nr || "–"}</td>
                    <td>{p.lagerbestand ? <Link className="underline" href={`/logistik/bestand/${encodeURIComponent(p.lagerbestand)}`}>{p.lagerbestand}</Link> : "Ort unbekannt"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kachel>
      )}
      {tab === "pakete" && (
        <div className="flex flex-col gap-6">
          <Kachel titel={T.tabs.pakete}>
            {(doc.pakete || []).length ? (
              <div className="bo-log-zeilen">
                {doc.pakete.map((p) => <Zeile key={p.paket_nr} titel={`Paket ${p.paket_nr} · ${p.paketprofil || p.art || "Paket"}`} unter={`${p.laenge_cm || "–"} × ${p.breite_cm || "–"} × ${p.hoehe_cm || "–"} cm · ${kgText(p.gewicht_g)}`} rechts={p.inhalt ? <span className="bo-log-cap">{p.inhalt}</span> : null} />)}
              </div>
            ) : <p className="bo-log-cap">{LEER.pakete}</p>}
          </Kachel>
          <Kachel titel="Sendungen">
            {a.sendungen.length ? (
              <div className="bo-log-zeilen">
                {a.sendungen.map((s) => <Zeile key={s.name} href={`/logistik/sendungen/${encodeURIComponent(s.name)}`} titel={`${s.carrier || "–"} ${s.service_name || ""}`} unter={<span className="bo-log-mono">{s.tracking_nr || s.name}</span>} rechts={<>{s.env !== "live" ? <Chip ton="special">Test</Chip> : null}<StatusPille doctype="PH Sendung" status={s.status} /></>} />)}
              </div>
            ) : <p className="bo-log-cap">{LEER.sendungen}</p>}
          </Kachel>
        </div>
      )}
      {tab === "uebergabe" && (
        <Kachel titel={T.tabs.uebergabe}>
          <Fakten eintraege={[
            { label: T.felder.uebergebenAn, wert: doc.uebergeben_an },
            { label: T.felder.uebergebenAm, wert: datumLang(doc.uebergeben_am) },
            { label: T.felder.zugestelltAm, wert: datumLang(doc.zugestellt_am) },
            { label: T.felder.empfangenVon, wert: doc.empfaenger_name },
            { label: "Unterschrift", wert: doc.unterschrift_empfaenger ? "vorhanden" : "–" },
            { label: T.felder.bestaetigung, wert: datumLang(doc.lieferbestaetigung_gesendet_am) },
            leitung && doc.abholcode ? { label: T.felder.abholcode, wert: <span className="bo-log-mono">{doc.abholcode}</span> } : null,
          ]} />
          <p className="bo-log-cap mt-6">{(doc.fotos || []).length ? `${doc.fotos.length} Fotos` : LEER.fotos}</p>
        </Kachel>
      )}
      {tab === "verlauf" && (
        <Kachel titel={T.tabs.verlauf}>
          <Verlauf doctype="PH Lieferschein" name={name} docinfo={a.docinfo} />
        </Kachel>
      )}
    </AkteSeite>
  );
}
