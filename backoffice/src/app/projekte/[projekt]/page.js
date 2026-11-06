import { notFound, redirect } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { faehigkeit } from "@/lib/backoffice/faehigkeiten";
import { mockUeberschreibung } from "@/components/Backoffice/Faehigkeit";
import Shell from "@/components/Backoffice/Shell/Shell";
import { AkteGeruest, AkteHero, AkteKopf, AkteTabs, Band, GlasKnopf, RechteSpalte, Vorgangsleiste } from "@/components/Backoffice/Akte";
import Segment from "@/components/Backoffice/Segment";
import AkteSlots from "@/components/Backoffice/Akte/Slots";
import { Pille } from "@/components/Backoffice/StatusBadge";
import Avatar from "@/components/Backoffice/Avatar";
import MappeAktionen from "@/components/Backoffice/Projekte/MappeAktionen";
import PhaseAnpassen from "@/components/Backoffice/Projekte/PhaseAnpassen";
import Aktivitaet from "@/components/Backoffice/Projekte/Aktivitaet";
import Nachkalkulation from "@/components/Backoffice/Projekte/Nachkalkulation";
import { EmpfehlungListe, ProjektStatus } from "@/components/Backoffice/Projekte/Teile";
import { TabBelege, TabDateien, TabMontage, TabPlanung, TabPositionen, TabUebersicht } from "@/components/Backoffice/Projekte/MappeTabs";
import { informierenVersand } from "@/components/Backoffice/Informieren/server";
import { heuteIso, istLeitung, ladeEinstellungen, ladeKalkulation, ladeMappe, ladeVerlauf, personen, projekteClient } from "@/lib/backoffice/projekte/lesen";
import { planenDaten } from "@/lib/backoffice/projekte/planen";
import { empfehlungen, primaerEmpfehlung } from "@/lib/backoffice/projekte/empfohlen";
import { aktivitaetsStrom, kwText, naechsterTermin, phasenSchritte } from "@/lib/backoffice/projekte/mappe";
import { phaseSchieben } from "@/lib/backoffice/projekte/phase";
import { abschlussPruefliste } from "@/lib/backoffice/projekte/regeln";
import { PROJEKTE } from "@/lib/backoffice/projekte/faehigkeiten";
import { datumKurz, terminText } from "@/lib/backoffice/projekte/anzeige";
import { fertigstellungsgrad } from "@/lib/backoffice/projekte/kalkulation";
import { PHASEN, TEXTE, statusText } from "@/lib/backoffice/projekte/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { projekt } = await params;
  return { title: `${decodeURIComponent(projekt)} · Projekte` };
}

const M = TEXTE.mappe;

/** Karten je Phase (Kundenreise): bis zu zwei Belege der Phase, sonst „erreicht“ mit Person bzw. die Empfehlung. */
function stufenKarten(st, { primaer, leute }) {
  const z = st.zustand === "aktuell" || st.zustand === "teilweise" ? "aktuell" : st.zustand === "erledigt" ? "erledigt" : "offen";
  const aus = (st.objekte || []).slice(0, 2).map((o, i) => ({ id: `${st.id}-${i}`, titel: o.titel, datum: o.info, href: o.href, zustand: z === "aktuell" && i === 0 ? "aktuell" : z === "offen" ? "offen" : "erledigt" }));
  if (aus.length) return aus;
  if (z === "erledigt") return [{ id: st.id, titel: `${st.titel} erreicht`, datum: st.datum, person: leute[st.von]?.name, zustand: "erledigt" }];
  if (z === "aktuell") return [{ id: st.id, titel: primaer?.titel || st.titel, datum: st.datum ? `seit ${st.datum}` : "", person: leute[st.von]?.name, zustand: "aktuell" }];
  return [];
}
const enc = encodeURIComponent;

/** Auftragsmappe (T5, 10-konzept-projekte.md § 4): Kopf, Hero mit Glas-Kacheln, Phasenleiste, Empfohlen, 6 Reiter, rechte Spalte. */
export default async function Auftragsmappe({ params, searchParams }) {
  const { projekt: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const session = await requireRecht("projekte", "read", `/projekte/${roh}`);
  const client = projekteClient(session);
  const leitung = istLeitung(session);
  const heute = heuteIso();

  let m;
  try {
    m = await ladeMappe(client, name, { leitung });
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    if (istBackofficeError(err) && err.code === "forbidden") redirect(`/kein-zugriff?bereich=projekte`);
    throw err;
  }
  const p = m.projekt;
  const readonly = ["Abgeschlossen", "Abgebrochen"].includes(p.status) && !leitung;
  const tabs = [
    { id: "uebersicht", titel: M.tabs.uebersicht },
    { id: "positionen", titel: M.tabs.positionen, anzahl: (m.positionen || []).length || undefined },
    { id: "planung", titel: M.tabs.planung, anzahl: (m.planungen || []).length + (m.renderings || []).length || undefined },
    { id: "belege-lieferung", titel: M.tabs.belege },
    { id: "montage", titel: M.tabs.montage, anzahl: (m.montagen || []).length || undefined },
    { id: "dateien", titel: M.tabs.dateien, anzahl: (m.dokumente || []).length || undefined },
  ];
  const tab = sp.tab === "kalkulation" || sp.tab === "belege" ? "belege-lieferung" : aktiverTab(tabs, sp.tab);
  const kalkAnsicht = (sp.tab === "kalkulation" || sp.ansicht === "kalkulation") && leitung;

  const [liste, transitions, kommentare, einst, versand, kalkStatus] = await Promise.all([
    Promise.resolve(empfehlungen(m, { heute, leitung })),
    client.getTransitions("PH Projekt", name).catch(() => []),
    ladeVerlauf(client, name),
    ladeEinstellungen(client),
    informierenVersand(session).catch(() => ({ exchange: false })),
    leitung ? faehigkeit(session, "projekte.kalkulation", { katalog: PROJEKTE, client, ueberschreibung: await mockUeberschreibung() }) : null,
  ]);
  const primaer = primaerEmpfehlung(liste);
  const leute = await personen(client, [p.berater, p.planer, p.montageleiter, ...(m.team || []).map((t) => t.user), ...(m.aufgaben || []).map((a) => a.zugewiesen_an), ...(m.montagen || []).flatMap((x) => (x.team || []).map((t) => t.user))]);
  const termin = naechsterTermin(m, heute);
  const bild = (m.fotos || []).find((f) => f.bild)?.bild || (m.renderings || []).find((r) => r.bild)?.bild || "";
  const schieben = phaseSchieben(m);
  const strom = aktivitaetsStrom(m, { kommentare });
  const rueckOffen = (m.feedback_offen || []).length + (m.nachrichten || []).filter((n) => n.richtung === "eingehend" && n.status === "Ungelesen").length;
  const kontakt = m.kontakt || {};
  const montageZeit = p.montage_von ? `${datumKurz(p.montage_von)}${p.montage_bis && p.montage_bis !== p.montage_von ? `–${datumKurz(p.montage_bis)}` : ""}` : null;
  const kalk = tab === "belege-lieferung" && kalkAnsicht && kalkStatus?.an ? await ladeKalkulation(client, m, { heute }).catch(() => null) : null;
  const planen = await planenDaten(client, m, { heute });

  const band = p.status === "Abgebrochen"
    ? <Band ton="neutral" titel={M.abgebrochenAm(datumKurz((m.phasen || []).at(-1)?.datum, { jahr: true }))} text={p.abgebrochen_grund} />
    : schieben
      ? <Band ton="warnung" titel={M.bandPhase(schieben.fakt, statusText("PH Projekt", p.status))} text={schieben.grund} aktion={transitions.some((t) => t.action === schieben.aktion) ? <PhaseAnpassen projekt={name} /> : null} />
      : null;

  const grad = fertigstellungsgrad({ phase: p.status, positionen: (m.positionen || []).filter((x) => x.lieferstatus !== "storniert"), montage_h_ist: (m.zeiten || []).filter((z) => z.taetigkeit === "Montage").reduce((s2, z) => s2 + Number(z.dauer_min || 0) / 60, 0), montage_h_plan: (m.montagen || []).filter((x) => x.status !== "Abgebrochen").reduce((s2, x) => s2 + Number(x.stunden_geplant || 0), 0) }).grad;
  const kacheln = [
    termin ? { titel: M.naechsterTermin, wert: terminText(termin.start, heute, { mitZeit: !termin.ganztag }), unter: termin.titel, mittel: true, person: leute[p.montageleiter]?.name } : { titel: M.naechsterTermin, wert: M.keinTermin, mittel: true },
    { titel: M.lieferung, wert: p.liefertermin_geplant ? kwText(p.liefertermin_geplant) : M.keinLiefertermin, unter: p.liefertermin_geplant ? datumKurz(p.liefertermin_geplant, { jahr: true }) : undefined, mittel: !p.liefertermin_geplant },
    { titel: M.montage, wert: montageZeit || "–", unter: (m.montagen || []).length ? `${m.montagen.length} Aufträge` : "noch nicht geplant", mittel: true },
    { titel: M.fertigstellung, wert: `${grad} %`, balken: { anteil: grad / 100, label: `Fortschritt ${grad} %` } },
  ];

  const informieren = {
    empfaenger: { name: p.kunde_name, email: kontakt.email || "", telefon: kontakt.telefon || p.baustelle_telefon || "", bevorzugt: kontakt.kommunikation_bevorzugt || "E-Mail" },
    vorlagen: Object.entries(TEXTE.informieren.vorlagen).map(([id, v]) => ({ id, ...v, methode: { name: "portal_status_senden", felder: { nachricht: "text" } } })),
    werte: { anrede: p.kunde_name, titel: p.titel, stand: `Phase ${statusText("PH Projekt", p.status)}`, liefertermin: p.liefertermin_geplant ? `${kwText(p.liefertermin_geplant)} (${datumKurz(p.liefertermin_geplant, { jahr: true })})` : "", montage: montageZeit || "" },
    versand,
  };

  const segmentBelege = leitung && kalkStatus && kalkStatus.an !== false ? (
    <Segment label="Ansicht" groesse="s" aktiv={kalkAnsicht ? "kalkulation" : "belege"} optionen={[{ wert: "belege", titel: TEXTE.kalkulation.segment.belege, href: `/projekte/${enc(name)}?tab=belege-lieferung` }, { wert: "kalkulation", titel: TEXTE.kalkulation.segment.kalkulation, href: `/projekte/${enc(name)}?tab=belege-lieferung&ansicht=kalkulation`, testid: "segment-kalkulation" }]} />
  ) : null;

  let inhalt;
  if (tab === "positionen") inhalt = <TabPositionen m={m} heute={heute} />;
  else if (tab === "planung") inhalt = <TabPlanung m={m} heute={heute} />;
  else if (tab === "belege-lieferung") inhalt = (
    <div className="flex flex-col gap-6">
      {segmentBelege && <div>{segmentBelege}</div>}
      {kalkAnsicht ? <Nachkalkulation k={kalk} fehler={!kalk} /> : <TabBelege m={m} heute={heute} />}
    </div>
  );
  else if (tab === "montage") inhalt = <TabMontage m={m} heute={heute} personen={leute} />;
  else if (tab === "dateien") inhalt = (
    <TabDateien m={m} ansicht={sp.ansicht === "fotos" ? "fotos" : "dokumente"} einstellungen={einst}
      Umschalter={<Segment label="Dateien" groesse="s" aktiv={sp.ansicht === "fotos" ? "fotos" : "dokumente"} optionen={[{ wert: "dokumente", titel: TEXTE.dokumente.dokumente, href: `/projekte/${enc(name)}?tab=dateien` }, { wert: "fotos", titel: TEXTE.dokumente.fotos, href: `/projekte/${enc(name)}?tab=dateien&ansicht=fotos` }]} />} />
  );
  else inhalt = <TabUebersicht m={m} heute={heute} empfehlungen={liste} personen={leute} EmpfehlungListe={<EmpfehlungListe liste={liste} />} />;

  const details = (
    <dl className="bo-prj-fakten" data-testid="details">
      <div><dt>Nummer</dt><dd className="tabular-nums">{p.name}</dd></div>
      <div><dt>Eingang</dt><dd>{datumKurz(p.eingang, { jahr: true })}</dd></div>
      <div><dt>Kunde</dt><dd>{p.kunde_name}</dd></div>
      <div><dt>Projektart</dt><dd>{statusText("PH Projekt", p.projektart)}</dd></div>
      <div className="col-span-2"><dt>Objekt</dt><dd>{[p.objekt_strasse, [p.objekt_plz, p.objekt_ort].filter(Boolean).join(" "), p.objekt_land && p.objekt_land !== "Österreich" ? p.objekt_land : ""].filter(Boolean).join(", ")}</dd></div>
      {p.objekt_hinweis && <div className="col-span-2"><dt>Hinweis</dt><dd>{p.objekt_hinweis}</dd></div>}
      <div><dt>Berater</dt><dd className="flex items-center gap-2">{p.berater && <Avatar name={leute[p.berater]?.name} groesse={24} dekorativ />}{leute[p.berater]?.name || "–"}</dd></div>
      <div><dt>Planung</dt><dd className="flex items-center gap-2">{p.planer && <Avatar name={leute[p.planer]?.name} groesse={24} dekorativ />}{leute[p.planer]?.name || "–"}</dd></div>
      <div><dt>Montageleitung</dt><dd className="flex items-center gap-2">{p.montageleiter && <Avatar name={leute[p.montageleiter]?.name} groesse={24} dekorativ />}{leute[p.montageleiter]?.name || "–"}</dd></div>
      <div><dt>Übergabe</dt><dd title={p.uebergabe_am ? M.uebergabeQuelle(p.abnahme) : undefined}>{p.uebergabe_am ? `${datumKurz(p.uebergabe_am, { jahr: true })} · ${M.uebergabeQuelle(p.abnahme)}` : "–"}</dd></div>
      <div><dt>Kundenportal</dt><dd>{Number(p.portal_sichtbar) ? (kontakt.email ? M.kundeSieht : M.keinPortal) : M.intern}</dd></div>
      {leitung && p.notiz_intern && <div className="col-span-2"><dt>Interne Notiz</dt><dd>{p.notiz_intern}</dd></div>}
    </dl>
  );

  return (
    <Shell session={session}>
      <AkteGeruest
        kopf={
          <AkteKopf
            zurueck={{ href: "/projekte/liste", titel: "Projekte" }}
            krumen={[{ titel: "Projekte", href: "/projekte" }, { titel: p.titel }]}
            rechts={
              <MappeAktionen
                projekt={{ name: p.name, titel: p.titel, status: p.status }}
                primaer={primaer}
                leitung={leitung}
                transitions={transitions}
                informieren={informieren}
                pruefliste={leitung ? abschlussPruefliste(m) : []}
                planen={planen}
                phasen={PHASEN}
                readonly={readonly}
              />
            }
          />
        }
        hero={
          <AkteHero
            bild={bild ? { src: bild, alt: p.titel } : undefined}
            ueber={p.kunde_name}
            titel={p.titel}
            unter={[...new Set([statusText("PH Projekt", p.projektart), ...(m.raeume || []).map((r) => r.raum)])].filter(Boolean).slice(0, 5).join(" · ")}
            chips={[{ icon: "FileText", text: p.name }, { icon: "MapPin", text: [p.objekt_strasse, p.objekt_ort].filter(Boolean).join(", ") }, ...(p.objekt_land && p.objekt_land !== "Österreich" ? [{ icon: "Info", text: `Montage in ${p.objekt_land}` }] : [])]}
            aktionen={
              <>
                {(kontakt.telefon || p.baustelle_telefon) && <GlasKnopf icon="Phone" href={`tel:${(kontakt.telefon || p.baustelle_telefon).replace(/\s/g, "")}`}>{M.anrufen}</GlasKnopf>}
                {kontakt.email && <GlasKnopf icon="Mail" href={`mailto:${kontakt.email}`}>{M.email}</GlasKnopf>}
                <GlasKnopf icon="MapPin" hell href={`https://www.openstreetmap.org/search?query=${enc([p.objekt_strasse, p.objekt_plz, p.objekt_ort].filter(Boolean).join(" "))}`}>{M.karte}</GlasKnopf>
              </>
            }
            kacheln={kacheln}
            testid="mappe-hero"
          />
        }
        band={band}
        vorgang={
          <Vorgangsleiste
            titel={M.kundenreise}
            schritte={phasenSchritte(m).map((st) => ({ ...st, aufgaben: stufenKarten(st, { primaer, leute }) }))}
            personen={[p.berater, p.planer, p.montageleiter].filter(Boolean).map((u) => leute[u]?.name || u)}
            naechster={primaer ? { titel: `${primaer.titel} – ${M.empfohlenWeil.toLowerCase()} ${primaer.weil}` } : liste[0] ? { titel: liste[0].titel } : undefined}
            testid="phasenleiste"
          />
        }
        vorgangOben
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={`/projekte/${enc(name)}`} params={{}} mitSeite rechts={<span className="flex items-center gap-2"><ProjektStatus wert={p.status} groesse="m" />{readonly && <Pille material="stein" punkt={false} groesse="sm">{M.readonly}</Pille>}{rueckOffen ? <Pille material="cognac" groesse="sm">{`${rueckOffen} ${M.rueckmeldungen}`}</Pille> : null}</span>} />}
        rechts={
          <RechteSpalte
            aktivitaet={<Aktivitaet projekt={name} kunde={p.kunde_name} email={kontakt.email || ""} eintraege={strom} />}
            details={details}
          />
        }
        seiteAktiv={sp.tab === "seite"}
        testid="mappe"
      >
        <div className="flex flex-col gap-6">
          {inhalt}
          <AkteSlots akte="projekt" tab={tab} id={name} session={session} ctx={{ client }} />
        </div>
      </AkteGeruest>
    </Shell>
  );
}
