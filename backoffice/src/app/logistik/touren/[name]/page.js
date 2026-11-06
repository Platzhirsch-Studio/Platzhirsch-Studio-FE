import { notFound } from "next/navigation";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf from "@/components/Backoffice/Knopf";
import StoppListe from "@/components/Backoffice/Logistik/StoppListe";
import { MehrMenue, VerzoegertKnopf, VorgangKnopf } from "@/components/Backoffice/Logistik/Aktionen";
import { Balken, Fakten, datumLang } from "@/components/Backoffice/Logistik/ui";
import { avisAction, ausTourAction, reihenfolgeAction, stoppStatusAction, tourAbbrechenAction, tourAbschliessenAction, tourDuplizierenAction, tourFreigebenPlanenAction, tourStartenAction } from "@/lib/backoffice/logistik/actions";
import { tourAkte } from "@/lib/backoffice/logistik/daten";
import { tourAuslastung } from "@/lib/backoffice/logistik/auslastung";
import { tagKopf } from "@/lib/backoffice/logistik/plantafel";
import { schalter } from "@/lib/backoffice/logistik/schalter";
import { druckHref } from "@/lib/backoffice/druck";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { TOUR as T } from "@/lib/backoffice/logistik/texte";
import { AkteSeite, Verlauf, seite, werte } from "../../_teile";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: decodeURIComponent((await params).name) };
}

// Tour-Akte (§ 4.7, E14): Primär je Zustand (Freigeben nur Leitung, verzögert; Starten mit km; Abschließen),
// Stopps mit Reihenfolge und Rückgängig, Team & Fahrzeug, kein „Live ansehen“, Zeitstempel nur mit Schalter.
export default async function TourAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = werte(await searchParams);
  const { session, client, leitung } = await seite(`/logistik/touren/${encodeURIComponent(name)}`);
  const a = await tourAkte(client, name).catch((err) => {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    throw err;
  });
  const { doc } = a;
  const stopps = doc.stopps || [];
  const aus = tourAuslastung(a.lieferscheine, a.fahrzeug);
  const fahrerName = a.fahrerName;
  const entwurfLs = a.lieferscheine.some((l) => l.status === "Entwurf");
  const freigabeGrund = !leitung ? T.gruende.leitung : !doc.fahrer ? T.gruende.fahrer : !stopps.length ? T.gruende.stopps : entwurfLs ? T.gruende.entwurf : undefined;
  const offen = stopps.filter((s) => ["offen", "unterwegs"].includes(s.status));

  let primaer = null;
  if (doc.status === "Geplant")
    primaer = <VerzoegertKnopf planen={tourFreigebenPlanenAction} args={{ name }} titel={T.freigeben} text="Freigegeben" icon="CircleCheck" disabled={!!freigabeGrund} grund={freigabeGrund} testid="primaer" felder={a.anzahlung.length && leitung ? [{ name: "override", label: "Grund (Anzahlung offen)", typ: "text", pflicht: true }] : undefined} />;
  else if (doc.status === "Freigegeben") primaer = <VorgangKnopf variant="primary" icon="Play" aktion={tourStartenAction} args={{ name }} titel={a.kmVorschlag ? `${T.starten} · ${a.kmVorschlag} km` : T.starten} felder={[{ name: "kmStart", label: "km-Stand", typ: "zahl", start: a.kmVorschlag ? String(a.kmVorschlag) : "", hinweis: a.kmVorschlag ? T.kmVorschlag(a.kmVorschlag) : undefined }]} erfolg="Tour gestartet" testid="primaer" />;
  else if (doc.status === "Unterwegs" && !offen.length) primaer = <VorgangKnopf variant="primary" icon="CircleCheck" aktion={tourAbschliessenAction} args={{ name }} titel={T.abschliessen} felder={[{ name: "kmEnde", label: "km-Stand", typ: "zahl" }]} erfolg="Abgeschlossen" testid="primaer" />;
  else if (doc.status === "Unterwegs") primaer = <Knopf variant="primary" icon="RefreshCw" href={`/logistik/touren/${encodeURIComponent(name)}`} data-testid="primaer">{T.aktualisieren}</Knopf>;
  else if (doc.status === "Abgeschlossen") primaer = <Knopf variant="primary" icon="Printer" href={druckHref("PH Tour", name, "PH Tour Tourenblatt")} data-testid="primaer">{T.tourenblatt}</Knopf>;

  const tabs = [{ id: "stopps", titel: T.tabs.stopps, anzahl: stopps.length }, { id: "team", titel: T.tabs.team }, { id: "fotos", titel: T.tabs.fotos }, { id: "verlauf", titel: T.tabs.verlauf }];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab : "stopps";
  const bearbeitbar = ["Geplant", "Freigegeben"].includes(doc.status);
  return (
    <AkteSeite session={session} doctype="PH Tour" doc={doc} liste={{ href: "/logistik/touren", titel: "Touren" }}
      titel={`${tagKopf(doc.datum)} · ${a.fahrzeug?.bezeichnung || doc.fahrzeug || "ohne Fahrzeug"}`}
      nummer={<span className="bo-log-mono" style={{ whiteSpace: "normal" }}>{name} · {fahrerName || "kein Fahrer"}{(doc.team || []).length ? ` + ${doc.team.length}` : ""}</span>}
      band={a.anzahlung.length && doc.status === "Geplant" ? { ton: "warnung", titel: `Anzahlung offen: ${a.anzahlung.join(", ")}`, text: "Freigabe nur Leitung mit Grund" } : doc.fahrzeug && a.fahrzeug?.naechster_service && a.fahrzeug.naechster_service <= doc.datum ? { ton: "warnung", titel: `Fahrzeug-Service fällig am ${datumLang(a.fahrzeug.naechster_service)}` } : null}
      aktionen={<>
        <MehrMenue eintraege={[
          { titel: T.tourenblatt, icon: "Printer", href: druckHref("PH Tour", name, "PH Tour Tourenblatt") },
          doc.route_url ? { titel: T.route, icon: "MapPin", href: doc.route_url } : null,
          bearbeitbar ? { titel: T.avis.replace(" …", ""), icon: "Mail", aktion: avisAction, args: { tour: name, kanal: "mail" }, frage: { titel: "Avis per E-Mail an alle Stopps senden?", text: "Stopps ohne E-Mail bleiben offen und erscheinen in der Telefonliste." }, erfolg: "Avis gesendet" } : null,
          { titel: T.duplizieren, icon: "Layers", aktion: tourDuplizierenAction, args: { name, datum: doc.datum }, ziel: "/logistik/touren/", zielFeld: "name" },
        ]} />
        {leitung && !["Abgeschlossen", "Abgebrochen"].includes(doc.status) ? <VorgangKnopf variant="ghost" icon="X" aktion={tourAbbrechenAction} args={{ name }} titel="Abbrechen" dialogTitel={`${name} abbrechen?`} frage={{ gefaehrlich: true, bestaetigen: "Tour abbrechen" }} dialogText={a.lieferscheine.some((l) => l.status === "Uebergeben") ? T.abbrechenFolge(a.lieferscheine.filter((l) => l.status === "Uebergeben").length) : undefined} felder={[{ name: "grund", label: "Grund", typ: "text", pflicht: true }]} erfolg="Abgebrochen" testid="abbrechen" /> : null}
        {primaer}
      </>}
      tabs={tabs} tab={tab} basis={`/logistik/touren/${encodeURIComponent(name)}`} params={sp}
      details={[{ label: "Stopps", wert: `${stopps.length} · ${stopps.filter((s) => s.status === "erledigt").length} erledigt` }, { label: "Auslastung", wert: <span className="flex flex-col gap-1"><span className={aus.ueber ? "text-bo-ziegel-text" : undefined}>{aus.text}</span><Balken anteil={aus.anteil} ueber={aus.ueber} label={aus.text} /></span> }, { label: "Volumen", wert: aus.volumenText }, { label: T.kopf.abfahrt, wert: doc.start_zeit ? `${String(doc.start_zeit).slice(0, 5)} · ${doc.start_lagerort || ""}` : "–" }]}
    >
      {tab === "stopps" && (
        <Kachel titel={T.tabs.stopps}>
          <StoppListe tour={name} stopps={stopps} bearbeitbar={bearbeitbar} mobil={doc.status === "Unterwegs"} reihenfolge={reihenfolgeAction} ausTour={ausTourAction} stoppStatus={stoppStatusAction} zeitstempel={schalter().zeitstempelAnzeigen} ohneTour={a.ohneTour} />
        </Kachel>
      )}
      {tab === "team" && (
        <Kachel titel={T.tabs.team}>
          <Fakten eintraege={[
            { label: T.kopf.fahrzeug, wert: a.fahrzeug ? `${a.fahrzeug.bezeichnung} · ${a.fahrzeug.name}` : "–" },
            { label: "Zuladung", wert: a.fahrzeug ? `${a.fahrzeug.zuladung_kg} kg` : "–" },
            { label: "Ladevolumen", wert: a.fahrzeug ? `${a.fahrzeug.ladevolumen_m3} m³` : "–" },
            { label: "Nächster Service", wert: datumLang(a.fahrzeug?.naechster_service) },
            { label: T.kopf.fahrer, wert: fahrerName },
            { label: T.kopf.team, wert: (doc.team || []).map((m) => `${m.user.split("@")[0]} (${m.rolle})`).join(", ") },
            { label: "km Start / Ende", wert: [doc.km_start, doc.km_ende].filter(Boolean).join(" / ") },
            { label: T.kopf.notiz, wert: doc.notiz_fahrer },
          ]} />
        </Kachel>
      )}
      {tab === "fotos" && <Kachel titel={T.tabs.fotos}><p className="bo-log-cap">{(doc.fotos || []).length ? `${doc.fotos.length} Fotos` : "Fotos der Fahrer erscheinen hier nach Stopp-Nummer."}</p></Kachel>}
      {tab === "verlauf" && <Kachel titel={T.tabs.verlauf}><Verlauf doctype="PH Tour" name={name} docinfo={a.docinfo} /></Kachel>}
    </AkteSeite>
  );
}
