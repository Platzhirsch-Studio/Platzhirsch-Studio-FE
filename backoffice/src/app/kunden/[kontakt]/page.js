import { notFound } from "next/navigation";
import Link from "next/link";
import { requireDocRecht, requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darf } from "@/lib/backoffice/auth/rechte";
import { faehigkeit } from "@/lib/backoffice/faehigkeiten";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Knopf, { PfeilKnopf } from "@/components/Backoffice/Knopf";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import PersonZelle from "@/components/Backoffice/PersonZelle";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { Icon } from "@/components/Backoffice/icons";
import { AkteGeruest, AkteHero, AkteKopf, AkteTabs, Band, RechteSpalte, Vorgangsleiste } from "@/components/Backoffice/Akte";
import { CrmStatus, KontaktKnoepfe, Symbol } from "@/components/Backoffice/Crm/Teile";
import { Composer, KontaktDetails, KundenakteAktionen } from "@/components/Backoffice/Crm/KundenakteTeile";
import { beraterListe, istLeitung, ladeKundenakte } from "@/lib/backoffice/crm/daten";
import { istMock } from "@/lib/backoffice/crm/backend";
import { CRM_FAEHIGKEITEN } from "@/lib/backoffice/crm/faehigkeiten";
import { CRM_TEXTE as T } from "@/lib/backoffice/crm/texte";
import { aktuelleStufe, kundenreise, kurzDatum, terminZeit } from "@/lib/backoffice/crm/vorgang";
import { gruppiereZeitleiste, zeitleisteEintraege, FILTER } from "@/lib/backoffice/crm/zeitleiste";
import { hrefFuer } from "@/lib/backoffice/crm/zuErledigen";
import { raumBild, bildFuerName } from "@/lib/backoffice/crm/bilder";
import { aktiverTab, waehleBand } from "@/lib/backoffice/akte/geruest";
import { cent, datum } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import "@/components/Backoffice/Crm/crm.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { kontakt } = await params;
  return { title: `${decodeURIComponent(kontakt)} · Kundenakte` };
}

const TABS = ["uebersicht", "aktivitaet", "vorgaenge", "belege", "service", "mehr"];
const FILTER_TEXT = { alles: T.akte.filter.alles, mails: T.akte.filter.mails, status: T.akte.filter.status, geld: T.akte.filter.geld, service: T.akte.filter.service, kommentare: T.akte.filter.kommentare };
const jahr = (d) => (d ? String(d).slice(0, 4) : "");
const rund = (c) => cent(c).replace(",00", "");

function Zeitleiste({ gruppen, leerText }) {
  if (!gruppen.length) return <Leer groesse="karte" text={leerText} />;
  return (
    <div className="bo-crm-zeitleiste" data-testid="crm-zeitleiste">
      {gruppen.map((g) => (
        <section key={g.titel} aria-label={g.titel}>
          <p className="bo-crm-zeitleiste__tag">{g.titel}</p>
          <ol className="grid gap-1">
            {g.eintraege.map((e) => (
              <li key={e.id} className="bo-crm-eintrag">
                <Symbol icon={e.icon} ton={e.ton} />
                <p className="bo-crm-eintrag__titel">{e.href ? <Link href={e.href} className="hover:underline">{e.titel}</Link> : e.titel}</p>
                <p className="bo-crm-eintrag__zeit">{e.uhr}</p>
                {e.zitat && <p className="bo-crm-eintrag__zitat">„{e.zitat}“</p>}
                {e.text && <p className="bo-crm-eintrag__text">{e.text}</p>}
                {e.beleg && (
                  <p className="col-start-2 mt-1 inline-flex w-fit items-center gap-3 rounded-[14px] bg-bo-surface-2 px-3 py-2 text-[13px]">
                    <Icon name="FileText" className="size-4 text-bo-text-soft" />
                    <span className="font-semibold">{e.beleg}.pdf</span>
                  </p>
                )}
                {e.wer && <p className="col-start-2 mt-1"><PersonZelle person={e.wer} groesse={24} /></p>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function Liste({ titel, eintraege, leer, href }) {
  return (
    <Kachel titel={titel} unter={eintraege ? `${eintraege.length}` : "kein Zugriff"} werkzeuge={href ? <Knopf size="s" variant="ghost" href={href}>Alle</Knopf> : null}>
      {!eintraege ? <p className="text-[14px] text-bo-text-faint">Kein Zugriff auf diesen Bereich.</p> : eintraege.length === 0 ? <Leer groesse="karte" text={leer} /> : (
        <ul className="grid gap-1">
          {eintraege.slice(0, 8).map((e) => (
            <li key={e.key}>
              <Link href={e.href} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] px-3 py-2.5 hover:bg-bo-surface-2">
                <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{e.titel}</span><span className="block truncate text-[13px] text-bo-text-soft">{e.unter}</span></span>
                {e.rechts}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Kachel>
  );
}

export default async function Kundenakte({ params, searchParams }) {
  const { kontakt: roh } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(roh);
  const session = await requireSession(`/kunden/${roh}`);
  const client = backoffice(session);
  const meta = await ladeMeta(client, "PH Kontakt");
  await requireDocRecht(meta, "read", `/kunden/${roh}`);

  let a;
  try {
    a = await ladeKundenakte(session, client, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return <Shell session={session}><Fehler code={istBackofficeError(err) ? err.code : "unavailable"} message={T.akte.nichtGefunden} zurueckHref="/crm/kontakte" /></Shell>;
  }
  const k = a.doc;
  const leitung = istLeitung(session);
  const geldSicht = leitung || darf(session, "faktura", "read");
  const [berater, mailF] = await Promise.all([beraterListe(client), faehigkeit(session, "crm.mail-senden", { katalog: CRM_FAEHIGKEITEN, client })]);
  const pname = (u) => a.personen[u]?.name || u;
  const mock = istMock(client);
  const tab = aktiverTab([...TABS.map((id) => ({ id })), { id: "seite" }], sp?.tab);
  const filter = FILTER.includes(sp?.zl) ? sp.zl : "alles";

  const reise = kundenreise(a, { person: (u) => (u ? { name: pname(u) } : undefined), href: hrefFuer });
  const stufe = aktuelleStufe(reise);
  const erledigt = reise.flatMap((s) => s.aufgaben).filter((x) => x.zustand === "erledigt").length;
  const alleSchritte = reise.flatMap((s) => s.aufgaben).length;
  const naechster = (a.termine || []).filter((t) => ["Unbestaetigt", "Bestaetigt"].includes(t.status) && String(t.start) >= new Date().toISOString().slice(0, 10)).sort((x, y) => String(x.start).localeCompare(String(y.start)))[0];
  const ab = a.groessterAuftrag;
  const projekt = (a.projekte || [])[0];
  const bild = raumBild(projekt?.projektart || a.anfragen?.[0]?.projektart || "", { mock }) || bildFuerName(k.name, { mock });
  const eintraege = zeitleisteEintraege(a, { name: pname });
  const zeitleiste = gruppiereZeitleiste(eintraege, { filter });
  const offeneAufgaben = (a.aufgaben || []).filter((x) => ["Offen", "In Arbeit"].includes(x.status));
  const offeneRechnungen = (a.rechnungen || []).filter((r) => ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"].includes(r.status));
  const offenSumme = offeneRechnungen.reduce((s, r) => s + (Number(r.offen_cent) || 0), 0);
  const gespraech = (a.gespraeche || [])[0];

  const band = waehleBand([
    k.anonymisiert_am && { rang: 1, ton: "neutral", titel: T.akte.bandAnonym(datum(k.anonymisiert_am)) },
    Number(k.nicht_kontaktieren) && { rang: 2, ton: "gefahr", titel: T.akte.bandWiderspruch(datum(k.widerspruchshinweis_am)) },
    k.status === "Gesperrt" && { rang: 3, ton: "warnung", titel: T.akte.bandGesperrt },
    k.loeschung_angefordert_am && { rang: 5, ton: "info", titel: T.akte.bandLoeschung(datum(k.loeschung_angefordert_am)) },
  ].filter(Boolean));

  const seit = k.kunde_seit ? T.akte.kundeSeit(jahr(k.kunde_seit)) : T.akte.angelegt(datum(k.creation));
  const tabs = [
    { id: "uebersicht", titel: T.akte.tabs.uebersicht },
    { id: "aktivitaet", titel: T.akte.tabs.aktivitaet, anzahl: eintraege.length },
    { id: "vorgaenge", titel: T.akte.tabs.vorgaenge, anzahl: a.anfragen.length + a.termine.length + a.gespraeche.length },
    { id: "belege", titel: T.akte.tabs.belege, anzahl: (a.angebote?.length || 0) + (a.auftraege?.length || 0) + (a.rechnungen?.length || 0) },
    { id: "service", titel: T.akte.tabs.service, anzahl: a.servicefaelle?.length || 0 },
    { id: "mehr", titel: T.akte.tabs.mehr },
  ];

  const offenJetzt = [
    ...offeneRechnungen.map((r) => ({ key: r.name, titel: `${r.name} offen`, unter: `fällig ${datum(r.faellig)} · ${cent(r.offen_cent)} brutto`, href: `/d/ph-rechnung/${encodeURIComponent(r.name)}`, icon: "Receipt", ton: "eiche" })),
    ...(a.termine || []).filter((t) => ["Unbestaetigt", "Bestaetigt"].includes(t.status)).map((t) => ({ key: t.name, titel: `Termin ${terminZeit(t.start)}`, unter: `${T.modus[t.modus]} · ${T.status.termin[t.status]}`, href: hrefFuer("PH Termin", t.name), icon: "CalendarDays", ton: "see" })),
    ...offeneAufgaben.map((x) => ({ key: x.name, titel: x.titel, unter: `bis ${datum(x.faellig)} · ${pname(x.zugewiesen_an)}`, href: x.referenz_doctype && x.referenz_name ? hrefFuer(x.referenz_doctype, x.referenz_name) : `/aufgaben/${encodeURIComponent(x.name)}`, icon: "CheckSquare", ton: "cognac" })),
    ...(a.anfragen || []).filter((x) => x.status === "Neu").map((x) => ({ key: x.name, titel: "Neue Anfrage", unter: `${x.name} · ${kurzDatum(x.eingang)}`, href: hrefFuer("PH Anfrage", x.name), icon: "Inbox", ton: "cognac" })),
  ].slice(0, 8);

  return (
    <Shell session={session}>
      <AkteGeruest
        testid="crm-kundenakte"
        seiteAktiv={tab === "seite"}
        kopf={
          <AkteKopf
            zurueck={{ href: "/crm/kontakte", titel: T.seiten.kontakte }}
            krumen={[{ titel: T.seiten.kontakte, href: "/crm/kontakte" }, { titel: k.titel || k.name }]}
            rechts={
              a.kundenkarte ? (
                <Pille material="cognac" testid="crm-kundenkarte-stufe">{a.kundenkarte.stufe || "Kundenkarte"} <span className="font-normal">· {seit}</span></Pille>
              ) : (
                <span className="flex items-center gap-2"><CrmStatus objekt="kontakt" wert={k.status} /><span className="text-[13px] text-bo-text-soft">{seit}</span></span>
              )
            }
          />
        }
        hero={
          <AkteHero
            bild={bild || undefined}
            ueber={[T.kontaktart[k.kontaktart] || k.kontaktart, a.firma ? `gehört zu ${a.firma.titel}` : ""].filter(Boolean).join(" · ")}
            titel={k.titel || k.name}
            unter={[k.ort, projekt?.titel, k.kommunikation_bevorzugt ? `${T.akte.bevorzugt} ${k.kommunikation_bevorzugt}` : ""].filter(Boolean).join(" · ")}
            chips={[{ icon: "IdCard", text: k.name }, ...(k.ort ? [{ icon: "MapPin", text: [k.plz, k.ort].filter(Boolean).join(" ") }] : [])]}
            aktionen={<KundenakteAktionen kontakt={{ name: k.name, titel: k.titel, email: k.email, telefon: k.telefon, mobil: k.mobil, status: k.status, nicht_kontaktieren: k.nicht_kontaktieren }} berater={berater} ich={session.user} mailFaehig={mailF.an || mock} mailGrund={mailF.grund} />}
            kacheln={[
              geldSicht && ab ? { titel: T.akte.glas.auftrag, wert: rund(ab.brutto_cent || ab.netto_cent), unter: `${ab.brutto_cent ? "brutto" : "netto"} · ${ab.name}` } : { titel: "Offene Vorgänge", wert: String(a.anfragen.filter((x) => ["Neu", "Qualifiziert", "Termin vereinbart", "Angebot"].includes(x.status)).length), unter: "Anfragen" },
              geldSicht && ab ? { titel: T.akte.glas.bezahlt, wert: rund(ab.bezahlt_cent || 0), balken: { anteil: (ab.brutto_cent ? (ab.bezahlt_cent || 0) / ab.brutto_cent : 0), label: "Anteil bezahlt" } } : { titel: "Letzter Kontakt", wert: k.letzter_kontakt ? kurzDatum(k.letzter_kontakt) : "–", unter: k.letzter_kontakt_art || "", mittel: true },
              { titel: T.akte.glas.termin, wert: naechster ? terminZeit(naechster.start) : T.akte.keinTermin, unter: naechster ? `${T.modus[naechster.modus]}${naechster.thema ? ` · ${naechster.thema}` : ""}` : "", mittel: true, person: naechster?.berater ? { name: pname(naechster.berater) } : undefined },
              { titel: T.akte.glas.stand, wert: reise[stufe]?.titel || "–", unter: `Stufe ${stufe + 1} von ${reise.length}`, mittel: true },
            ]}
          />
        }
        band={band && <Band ton={band.ton} titel={band.titel} testid="crm-kundenakte-band" />}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={`/kunden/${roh}`} params={{}} mitSeite rechts={<Pille material="eiche">Stufe {stufe + 1} von {reise.length} · {reise[stufe]?.titel}</Pille>} />}
        vorgang={
          tab === "uebersicht" ? (
            <Vorgangsleiste
              titel={T.akte.reise}
              schritte={reise}
              personen={[...new Set([k.berater, ...a.termine.map((t) => t.berater)].filter(Boolean))].slice(0, 5).map((u) => ({ name: pname(u) }))}
              naechster={offenJetzt[0] ? { titel: offenJetzt[0].titel, aktion: { titel: T.knopf.oeffnen, href: offenJetzt[0].href } } : undefined}
            />
          ) : null
        }
        rechts={
          <RechteSpalte
            details={<KontaktDetails kontakt={k} berater={berater} leitung={leitung} />}
            bezuege={
              <div className="grid gap-2" data-testid="crm-bezuege">
                {a.firma && <Bezug icon="Building2" titel={a.firma.titel} unter="Firma" href={`/kunden/${encodeURIComponent(a.firma.name)}`} />}
                {(a.firmenPersonen || []).map((p) => <Bezug key={p.name} icon="User" titel={p.titel} unter={p.funktion || "Person"} href={`/kunden/${encodeURIComponent(p.name)}`} />)}
                {(a.projekte || []).slice(0, 3).map((p) => <Bezug key={p.name} icon="FolderKanban" titel={p.titel || p.name} unter={`Projekt · ${p.status}`} href={`/d/ph-projekt/${encodeURIComponent(p.name)}`} />)}
                {a.kundenkarte && <Bezug icon="IdCard" titel={`Kundenkarte ${a.kundenkarte.kartennummer || ""}`} unter={a.kundenkarte.stufe || "aktiv"} href={`/d/ph-kundenkarte/${encodeURIComponent(a.kundenkarte.name)}`} />}
                {(a.dsa || []).slice(0, 2).map((s) => <Bezug key={s.name} icon="Shield" titel={`Datenschutz: ${T.dsaArt[s.art] || s.art}`} unter={`${s.status} · Frist ${datum(s.frist)}`} href={hrefFuer("PH Datenschutzanfrage", s.name)} />)}
                {!a.firma && !a.firmenPersonen?.length && !a.projekte?.length && !a.kundenkarte && !a.dsa?.length && <p className="text-[14px] text-bo-text-faint">Keine weiteren Bezüge.</p>}
              </div>
            }
            kachel={{ details: { titel: T.akte.details }, bezuege: { titel: T.akte.bezuege } }}
          >
            {geldSicht && (
              <Kachel titel={T.akte.betraege} unter={T.akte.betraegeUnter} testid="crm-betraege">
                {!a.auftraege && !a.rechnungen ? <p className="text-[14px] text-bo-text-faint">{T.akte.fakturaFehlt}</p> : !ab && !offeneRechnungen.length ? <Leer groesse="karte" text={T.akte.keineBetraege} /> : (
                  <>
                    <p className="text-[40px] font-normal leading-[44px] tracking-[-0.035em] tabular-nums">{rund(ab?.brutto_cent || offenSumme)}</p>
                    <p className="mt-1 text-[13px] text-bo-text-soft">{ab ? `Auftrag ${ab.name} · brutto` : "offen · brutto"}</p>
                    {ab?.brutto_cent ? (
                      <div className="bo-crm-zahlbalken mt-5" role="img" aria-label={`${Math.round(((ab.bezahlt_cent || 0) / ab.brutto_cent) * 100)} Prozent bezahlt`}>
                        <span className="bg-bo-salbei" style={{ flex: Math.max(ab.bezahlt_cent || 0, 1) }} />
                        <span className="bg-bo-eiche" style={{ flex: Math.max(ab.offen_cent || ab.brutto_cent - (ab.bezahlt_cent || 0), 1) }} />
                      </div>
                    ) : null}
                    <dl className="mt-4 grid gap-2 text-[14px]">
                      {ab && <div className="flex justify-between gap-3"><dt className="flex items-center gap-2"><span className="size-2 rounded-pill bg-bo-salbei" />{T.akte.bezahlt}</dt><dd className="font-semibold tabular-nums">{cent(ab.bezahlt_cent || 0)}</dd></div>}
                      <div className="flex justify-between gap-3"><dt className="flex items-center gap-2"><span className="size-2 rounded-pill bg-bo-eiche" />{T.akte.offenBrutto}</dt><dd className="font-semibold tabular-nums">{cent(offenSumme)}</dd></div>
                      {ab?.netto_cent ? <div className="flex justify-between gap-3"><dt className="flex items-center gap-2"><span className="size-2 rounded-pill bg-bo-line-strong" />{T.akte.auftragseingang}</dt><dd className="font-semibold tabular-nums">{cent(ab.netto_cent)}</dd></div> : null}
                    </dl>
                  </>
                )}
              </Kachel>
            )}
            {geldSicht && a.positionen?.length > 0 && (
              <Kachel titel={T.akte.positionen} unter="Auftrag">
                <ul className="grid">
                  {[...a.positionen].sort((x, y) => (y.betrag_cent || y.netto_cent || 0) - (x.betrag_cent || x.netto_cent || 0)).slice(0, 4).map((p, i) => (
                    <li key={p.name || i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                      <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{p.bezeichnung || p.titel || p.artikel || "Position"}</span><span className="block truncate text-[13px] text-bo-text-soft">{[p.marke, p.menge ? `${p.menge} ×` : ""].filter(Boolean).join(" · ")}</span></span>
                      <span className="text-[15px] font-semibold tabular-nums">{cent(p.betrag_cent || p.netto_cent || p.gesamt_cent || 0)}</span>
                    </li>
                  ))}
                </ul>
              </Kachel>
            )}
          </RechteSpalte>
        }
      >
        {tab === "uebersicht" && (
          <div className="grid gap-6">
            <Kachel titel={T.akte.verlauf} unter={T.akte.verlaufUnter} werkzeuge={<PfeilKnopf href={`/kunden/${roh}?tab=aktivitaet`} label="Ganzen Verlauf öffnen" />}>
              <Zeitleiste gruppen={gruppiereZeitleiste(eintraege.slice(0, 6), { filter: "alles" }).gruppen} leerText={T.akte.verlaufLeer} />
            </Kachel>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Kachel titel={T.akte.offenJetzt} unter={offenJetzt.length ? `${offenJetzt.length} Punkte` : ""} testid="crm-offen-jetzt">
                {offenJetzt.length === 0 ? <Leer groesse="karte" art="erledigt" text={T.akte.nichtsOffen} /> : (
                  <ul className="grid gap-1">
                    {offenJetzt.map((o) => (
                      <li key={o.key}>
                        <Link href={o.href} className="bo-crm-zeile" style={{ gridTemplateColumns: "36px minmax(0,1fr) auto" }}>
                          <Symbol icon={o.icon} ton={o.ton} />
                          <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{o.titel}</span><span className="block truncate text-[13px] text-bo-text-soft">{o.unter}</span></span>
                          <Icon name="ChevronRight" className="size-4 text-bo-text-faint" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Kachel>
              <Kachel titel={T.akte.gespraechsstand} unter={gespraech ? datum(gespraech.datum) : ""} href={gespraech ? hrefFuer("PH Beratungsgespraech", gespraech.name) : undefined}>
                {!gespraech ? <Leer groesse="karte" text={T.akte.keinGespraech} /> : (
                  <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2">{(gespraech.raeume || []).map((r) => <Pille key={r.name || r.raum} material={r.prioritaet === "Hoch" ? "cognac" : "stein"}>{T.raum[r.raum] || r.raum}</Pille>)}</div>
                    {geldSicht && gespraech.budget_gesamt_cent ? <p className="text-[15px]">Budget {cent(gespraech.budget_gesamt_cent)} brutto (Kundenangabe)</p> : null}
                    {gespraech.zeitrahmen && <p className="text-[14px] text-bo-text-soft">Zeitrahmen {gespraech.zeitrahmen}</p>}
                    {gespraech.naechster_schritt && <p className="text-[14px]">Vereinbart: {gespraech.naechster_schritt}{gespraech.naechster_schritt_bis ? ` · bis ${datum(gespraech.naechster_schritt_bis)}` : ""}</p>}
                  </div>
                )}
              </Kachel>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <KontaktKnoepfe email={k.email} telefon={k.telefon} mobil={k.mobil} wer={k.titel} mitMobil />
              <span className="text-[14px] text-bo-text-soft">{[k.email, k.telefon, k.mobil].filter(Boolean).join(" · ") || "Keine Kontaktwege hinterlegt"}</span>
            </div>
          </div>
        )}
        {tab === "aktivitaet" && (
          <Kachel titel={T.akte.verlauf} unter={T.akte.verlaufUnter}>
            <nav aria-label="Filter" className="mb-4 flex flex-wrap gap-2">
              {FILTER.map((f) => (
                <Link key={f} href={`/kunden/${roh}?tab=aktivitaet${f === "alles" ? "" : `&zl=${f}`}`} aria-current={filter === f ? "true" : undefined} className={`rounded-pill px-3.5 py-1.5 text-[13px] font-medium ${filter === f ? "bg-bo-action text-bo-ink-inverse" : "bg-bo-fill text-bo-text-soft hover:bg-bo-fill-2"}`}>{FILTER_TEXT[f]}</Link>
              ))}
            </nav>
            <Zeitleiste gruppen={zeitleiste.gruppen} leerText={filter === "alles" ? T.akte.verlaufLeer : T.akte.gefiltertLeer(FILTER_TEXT[filter])} />
            <div className="mt-5"><Composer kontakt={k.name} /></div>
          </Kachel>
        )}
        {tab === "vorgaenge" && (
          <div className="grid gap-6">
            <Liste titel={T.seiten.anfragen} eintraege={a.anfragen.map((x) => ({ key: x.name, titel: String(x.titel || x.name).replace(/^[^:]+:\s*/, "") || x.name, unter: `${x.name} · ${kurzDatum(x.eingang)}`, href: hrefFuer("PH Anfrage", x.name), rechts: <CrmStatus objekt="anfrage" wert={x.status} groesse="sm" /> }))} leer={T.akte.vorgaengeLeer} />
            <Liste titel={T.seiten.termine} eintraege={a.termine.map((t) => ({ key: t.name, titel: `${terminZeit(t.start)} · ${T.modus[t.modus]}`, unter: [t.thema, pname(t.berater)].filter(Boolean).join(" · "), href: hrefFuer("PH Termin", t.name), rechts: <CrmStatus objekt="termin" doc={t} groesse="sm" /> }))} leer="Noch keine Termine." />
            <Liste titel={T.seiten.gespraeche} eintraege={a.gespraeche.map((g) => ({ key: g.name, titel: g.titel || g.name, unter: (g.raeume || []).map((r) => T.raum[r.raum] || r.raum).join(", ") || "ohne Raum", href: hrefFuer("PH Beratungsgespraech", g.name), rechts: <CrmStatus objekt="gespraech" wert={g.status} groesse="sm" /> }))} leer="Noch keine Gesprächsprotokolle." />
            <Liste titel={T.seiten.aufgaben} eintraege={a.aufgaben.map((x) => ({ key: x.name, titel: x.titel, unter: `bis ${datum(x.faellig)} · ${pname(x.zugewiesen_an)}`, href: x.referenz_doctype && x.referenz_name ? hrefFuer(x.referenz_doctype, x.referenz_name) : `/aufgaben/${encodeURIComponent(x.name)}`, rechts: <CrmStatus objekt="aufgabe" wert={x.status} groesse="sm" /> }))} leer="Keine Aufgaben." />
          </div>
        )}
        {tab === "belege" && (
          <div className="grid gap-6">
            <Liste titel="Projekte" eintraege={a.projekte?.map((p) => ({ key: p.name, titel: p.titel || p.name, unter: `${p.status}${p.objekt_ort ? ` · ${p.objekt_ort}` : ""}`, href: `/d/ph-projekt/${encodeURIComponent(p.name)}`, rechts: geldSicht && p.auftragswert_cent ? <span className="tabular-nums">{rund(p.auftragswert_cent)}</span> : null }))} leer="Kein Projekt." />
            <Liste titel="Angebote" eintraege={a.angebote?.filter((x) => x.status !== "Ersetzt").map((x) => ({ key: x.name, titel: x.name, unter: `${x.status} · ${datum(x.datum || x.creation)}`, href: `/d/ph-angebot/${encodeURIComponent(x.name)}`, rechts: geldSicht ? <span className="tabular-nums">{cent(x.netto_cent)} netto</span> : null }))} leer={T.akte.belegeLeer} />
            <Liste titel="Aufträge" eintraege={a.auftraege?.map((x) => ({ key: x.name, titel: x.name, unter: `${x.status} · ${datum(x.datum || x.creation)}`, href: `/d/ph-auftragsbestaetigung/${encodeURIComponent(x.name)}`, rechts: geldSicht ? <span className="tabular-nums">{cent(x.netto_cent)} netto</span> : null }))} leer={T.akte.belegeLeer} />
            <Liste titel="Rechnungen" eintraege={a.rechnungen?.map((x) => ({ key: x.name, titel: `${x.art || "Rechnung"} ${x.name}`, unter: `${x.status} · fällig ${datum(x.faellig)}`, href: `/d/ph-rechnung/${encodeURIComponent(x.name)}`, rechts: geldSicht ? <span className="tabular-nums">{cent(x.offen_cent)} offen</span> : null }))} leer={T.akte.belegeLeer} />
            <Liste titel="Lieferungen" eintraege={a.lieferungen?.map((x) => ({ key: x.name, titel: x.name, unter: `${x.status} · ${datum(x.datum)}`, href: `/d/ph-lieferschein/${encodeURIComponent(x.name)}` }))} leer="Keine Lieferungen." />
          </div>
        )}
        {tab === "service" && (
          <Liste titel="Servicefälle" eintraege={a.servicefaelle?.map((x) => ({ key: x.name, titel: x.titel || x.name, unter: `${x.status} · ${datum(x.gemeldet_am || x.creation)}`, href: `/d/ph-servicefall/${encodeURIComponent(x.name)}` }))} leer={T.akte.serviceLeer} />
        )}
        {tab === "mehr" && (
          <div className="grid gap-6">
            <Kachel titel="Datenschutz">
              <dl className="bo-crm-fakten">
                <div><dt>Widerspruch</dt><dd>{Number(k.nicht_kontaktieren) ? `seit ${datum(k.widerspruchshinweis_am)} (${k.widerspruchshinweis_quelle || "–"})` : "nein"}</dd></div>
                <div><dt>Portal</dt><dd>{Number(k.portal_aktiv) ? `aktiv${k.portal_letzter_login ? ` · zuletzt ${datum(k.portal_letzter_login)}` : ""}` : "nicht eingerichtet"}</dd></div>
                <div><dt>Herkunft</dt><dd>{T.quelle[k.quelle] || k.quelle || "–"}</dd></div>
                <div><dt>Aufbewahren bis</dt><dd>{k.aufbewahren_bis ? datum(k.aufbewahren_bis) : "–"}</dd></div>
              </dl>
            </Kachel>
            <Liste titel="Datenschutzanfragen" eintraege={(a.dsa || []).map((s) => ({ key: s.name, titel: T.dsaArt[s.art] || s.art, unter: `Frist ${datum(s.frist)}`, href: hrefFuer("PH Datenschutzanfrage", s.name), rechts: <CrmStatus objekt="datenschutz" wert={s.status} groesse="sm" /> }))} leer="Keine Datenschutzanfragen." />
            <Kachel titel="Dateien" unter="Anhänge am Kontakt">
              {(a.docinfo?.attachments || []).length === 0 ? <Leer groesse="karte" text="Keine Dateien." /> : <ul className="grid gap-2">{a.docinfo.attachments.map((f) => <li key={f.name} className="rounded-[14px] bg-bo-surface-2 px-4 py-3 text-[14px]">{f.file_name}</li>)}</ul>}
            </Kachel>
          </div>
        )}
        <p className="sr-only" aria-live="polite">{`${erledigt} von ${alleSchritte} Schritten erledigt`}</p>
      </AkteGeruest>
    </Shell>
  );
}

function Bezug({ icon, titel, unter, href }) {
  return (
    <Link href={href} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] px-2 py-2 hover:bg-bo-surface-2">
      <span className="grid size-10 place-items-center rounded-pill bg-bo-fill text-bo-text-soft"><Icon name={icon} className="size-4" /></span>
      <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{titel}</span><span className="block truncate text-[13px] text-bo-text-soft">{unter}</span></span>
      <Icon name="ChevronRight" className="size-4 text-bo-text-faint" />
    </Link>
  );
}
