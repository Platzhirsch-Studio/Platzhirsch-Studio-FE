import { notFound } from "next/navigation";
import Link from "next/link";
import { fakturaKontext, ladeBeleg, kontaktVon, alle } from "@/lib/backoffice/faktura/daten";
import { auftragStand, zahlungsplanPruefen } from "@/lib/backoffice/faktura/betraege";
import { auftragZeile, auftragAktion, stellDaten } from "@/lib/backoffice/faktura/zeilen";
import { belegkette } from "@/lib/backoffice/faktura/akte";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { AKTE, AKTION, AUFTRAG, LEER, KASSA, wertLabel } from "@/lib/backoffice/faktura/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { cent, datum } from "@/lib/backoffice/format";
import { AkteGeruest, AkteKopf, AkteTabs, Band, Vorgangsleiste, RechteSpalte } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { DruckKnopf } from "@/components/Backoffice/Druck/DruckPanel";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import { StandBand, PositionenLesend } from "@/components/Backoffice/Faktura/Bausteine";
import { AkteAktionen } from "@/components/Backoffice/Faktura/AkteTeile";
import { Status, Fakten, Hinweis } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Aufträge · Faktura` };
}

// Auftragsakte (T5, § 4.3): Stand-Band (bezahlt · abgerechnet · geliefert) mit Satz + <dl>, nächster Schritt als einziger
// Primärknopf, Blocker „Anzahlung offen … – Bestellung erst nach Zahlung“, Kassa-Datenfehler als einziges Band.
export default async function AuftragAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/auftraege/${roh}`);
  const { client, rolle, heute } = ctx;
  const beleg = await ladeBeleg(client, "PH Auftragsbestaetigung", name, rolle);
  if (!beleg) notFound();
  const { doc: a, docinfo } = beleg;
  const [kontakt, rechnungen, gutschriften, angebot] = await Promise.all([
    kontaktVon(client, a.kontakt),
    alle(client, "PH Rechnung", { fields: ["name", "art", "status", "docstatus", "datum", "brutto_cent", "bezahlt_cent", "offen_cent"], filters: [["auftrag", "=", a.name]] }),
    alle(client, "PH Gutschrift", { fields: ["name", "art", "status", "brutto_cent", "datum"], filters: [["auftrag", "=", a.name]] }),
    a.angebot ? client.getDoc("PH Angebot", a.angebot).catch(() => null) : null,
  ]);
  const zeile = auftragZeile(a, { heute, rolle });
  const stand = auftragStand(a);
  const st = statusAnzeige("PH Auftragsbestaetigung", a.status);
  const tabs = AKTE.tabs.auftrag.map((t) => ({ ...t, anzahl: t.id === "zahlungsplan" ? rechnungen.length || undefined : t.id === "positionen" ? (a.positionen || []).length : undefined }));
  const tab = aktiverTab(tabs, sp?.tab);
  const primaer = auftragAktion(a, rolle);
  const ziel = { name: a.name, doctype: "PH Auftragsbestaetigung", titel: a.kunde_name, daten: { ...zeile.daten, ...stellDaten({ ...a, email: kontakt.email }, kontakt.email || ""), zeilen: zeile.daten.zeilen, vertragsort: a.vertragsort, kunde: a.kunde_name } };
  const menue = rolle.schreibt
    ? [
        zeile.daten.anzahlung_offen_cent > 0 ? { id: "anzahlung", titel: AKTION.anzahlungAnfordern, icon: "Receipt" } : null,
        a.status === "Teilgeliefert" || a.status === "In Bestellung" ? { id: "teilrechnung", titel: AKTION.teilrechnung, icon: "FileText", href: `/faktura/auftraege/${encodeURIComponent(a.name)}/abrechnen?art=teil` } : null,
        a.status === "Geliefert" ? { id: "schlussrechnung", titel: AKTION.schlussrechnung, icon: "FileText", href: `/faktura/auftraege/${encodeURIComponent(a.name)}/abrechnen?art=schluss` } : null,
        a.status === "In Bestellung" || a.status === "Teilgeliefert" ? { id: "lieferung", titel: AKTION.lieferungMelden, icon: "Truck" } : null,
        { id: "senden", titel: AKTION.senden, icon: "Mail" },
        { trenner: true, id: "t1" },
        !["Storniert", "Abgerechnet"].includes(a.status) && a.vertragsort && a.vertragsort !== "Showroom" ? { id: "ruecktritt", titel: `${AKTION.ruecktritt} (FAGG)`, icon: "Undo2" } : null,
        !["Storniert", "Abgerechnet"].includes(a.status) ? { id: "storno-auftrag", titel: AKTION.auftragStornieren, icon: "CircleX", gefaehrlich: true, ...(rolle.leitung ? {} : { deaktiviert: true, grund: "Nur Faktura-Leitung" }) } : null,
        { trenner: true, id: "t2" },
        a.angebot ? { id: "angebot", titel: "Angebot", icon: "FileText", href: `/faktura/angebote/${encodeURIComponent(a.angebot)}` } : null,
        a.kontakt ? { id: "kunde", titel: AKTION.kundenakte, icon: "Contact", href: `/d/ph-kontakt/${encodeURIComponent(a.kontakt)}` } : null,
      ].filter(Boolean)
    : [];
  const band = a.status === "Storniert" ? { ton: "gefahr", titel: `Storniert am ${datum(a.storniert_am)} · ${a.storno_grund || ""}` } : a.kassa_datenfehler ? { ton: "gefahr", titel: KASSA.datenfehler } : null;
  const plan = zahlungsplanPruefen(a.zahlungsplan || [], a.auftragswert_cent || a.brutto_cent);
  const blocker = a.status === "Offen" && !stand.anzahlungErfuellt && Number(a.anzahlung_soll_cent) > 0 ? AUFTRAG.blocker(cent(Number(a.anzahlung_soll_cent) - Number(a.anzahlung_ist_cent || 0))) : null;

  return (
    <FakturaSeite ctx={ctx} titel={a.name} ohneKopf auftragRechnungen={rechnungen}>
      <AkteGeruest
        testid="auftrag-akte"
        vorgangOben
        kopf={
          <AkteKopf
            zurueck={{ href: "/faktura/auftraege", titel: "Aufträge" }}
            krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Aufträge", href: "/faktura/auftraege" }, { titel: a.name }]}
            titel={a.name}
            nummer={`${a.titel || ""} · ${a.kunde_name || "–"}`}
            status={<Status status={st} />}
            betrag={{ cent: a.auftragswert_cent, unter: AKTE.offen(cent(a.offen_cent)) }}
            aktionen={
              <span className="flex items-center gap-2">
                <DruckKnopf doctype="PH Auftragsbestaetigung" name={a.name} titel={`Auftrag ${a.name}`} pdf={client.modus === "frappe"} />
                <AkteAktionen ziel={ziel} primaer={primaer} menue={menue} rolle={rolle} />
              </span>
            }
          />
        }
        band={band && <Band ton={band.ton} titel={band.titel} testid="auftrag-band" />}
        vorgang={
          <div className="flex flex-col gap-3">
            <StandBand stand={stand} />
            <Vorgangsleiste titel={AKTE.belegkette} kompakt mitText schritte={belegkette({ angebot, auftrag: a, rechnungen, aktuell: "auftrag" })} />
            {blocker && <Hinweis ton="warnung" testid="auftrag-blocker">{blocker}</Hinweis>}
          </div>
        }
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={`/faktura/auftraege/${encodeURIComponent(a.name)}`} params={sp || {}} />}
        rechts={<RechteSpalte details={<Fakten eintraege={[{ label: "Kunde", wert: a.kunde_name }, { label: "Projekt", wert: a.projekt || null }, { label: "Angebot", wert: a.angebot || null }, { label: "Vertragsort", wert: a.vertragsort || "Showroom" }, { label: "Berater", wert: String(a.zugewiesen_an || "").split("@")[0] || null }]} />} />}
      >
        {tab === "uebersicht" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <Kachel titel="Summen" titelId="h-s">
              <Fakten eintraege={[{ label: "Auftragswert", wert: cent(a.auftragswert_cent) }, { label: "Anzahlung", wert: `${cent(a.anzahlung_ist_cent || 0)} von ${cent(a.anzahlung_soll_cent || 0)}${stand.anzahlungErfuellt ? " ✓" : ""}` }, { label: "Abgerechnet", wert: cent(a.abgerechnet_cent || 0) }, { label: "Bezahlt", wert: cent(a.bezahlt_cent || 0) }, { label: "Offen", wert: cent(a.offen_cent) }]} />
            </Kachel>
            <Kachel titel="Konditionen" titelId="h-k">
              <Fakten eintraege={[{ label: "Zahlungsbedingung", wert: a.zahlungsbedingung || "–" }, { label: "Steuerfall", wert: wertLabel(a.ust_fall) || "Inland" }, { label: "Rücktritt", wert: a.vertragsort && a.vertragsort !== "Showroom" ? AUFTRAG.faggOhne : "Vertrag im Showroom" }]} />
            </Kachel>
          </div>
        )}
        {tab === "positionen" && (
          <Kachel titel="Positionen" titelId="h-p">
            <PositionenLesend positionen={a.positionen || []} mitEinkauf={rolle.permlevel1} mengenInfo />
          </Kachel>
        )}
        {tab === "zahlungsplan" && (
          <div className="flex flex-col gap-4 xl:gap-6">
            <Kachel titel={AUFTRAG.zahlungsplan} titelId="h-zp">
              {!plan.ok && <p className="bo-fk-fehler mb-3">{AUFTRAG.planFehler(cent(plan.summe_cent), cent(a.auftragswert_cent))}</p>}
              <ul className="flex flex-col gap-2 text-[14px]" data-testid="zahlungsplan">
                {(a.zahlungsplan || []).map((z, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-bo-zeile bg-bo-surface-2 px-3.5 py-2.5">
                    <span>
                      {z.art} {z.prozent} % · bei {z.faellig_bei}
                      {z.rechnung ? (
                        <>
                          {" · "}
                          <Link className="font-medium hover:underline" href={`/faktura/rechnungen/${encodeURIComponent(z.rechnung)}`}>
                            {z.rechnung}
                          </Link>
                        </>
                      ) : null}
                    </span>
                    <span className="tabular-nums">
                      {cent(z.betrag_cent)}
                      {Number(z.bezahlt_cent) ? <span className="text-bo-text-faint"> · bezahlt {cent(z.bezahlt_cent)}</span> : null}
                    </span>
                    <span className="text-[13px] text-bo-text-soft">{z.status}</span>
                  </li>
                ))}
              </ul>
            </Kachel>
            <Kachel titel="Rechnungen und Gutschriften" titelId="h-re">
              {rechnungen.length + gutschriften.length === 0 ? (
                <p className="text-[14px] text-bo-text-soft">{LEER.auftragRechnungen}</p>
              ) : (
                <ul className="flex flex-col gap-1 text-[14px]">
                  {rechnungen.map((r) => (
                    <li key={r.name} className="flex justify-between gap-3 py-1.5">
                      <Link className="hover:underline" href={`/faktura/rechnungen/${encodeURIComponent(r.name)}`}>
                        {Number(r.docstatus) === 0 ? "Entwurf" : r.name} · {r.art}
                      </Link>
                      <span className="tabular-nums">
                        {cent(r.brutto_cent)} · {wertLabel(r.status)}
                      </span>
                    </li>
                  ))}
                  {gutschriften.map((g) => (
                    <li key={g.name} className="flex justify-between gap-3 py-1.5">
                      <Link className="hover:underline" href={`/faktura/gutschriften/${encodeURIComponent(g.name)}`}>
                        {g.name} · {g.art}
                      </Link>
                      <span className="tabular-nums">−{cent(g.brutto_cent)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Kachel>
          </div>
        )}
        {tab === "lieferung" && (
          <Kachel titel="Lieferung & Montage" titelId="h-l">
            <Fakten eintraege={[{ label: "Liefertermin", wert: a.liefertermin_bestaetigt ? `${datum(a.liefertermin_bestaetigt)} · bestätigt` : a.liefertermin_geplant ? `${datum(a.liefertermin_geplant)} (geplant)` : "–" }, { label: "Liefer-KW", wert: a.liefer_kw || "–" }, { label: "Montage", wert: a.montage ? `ja${a.montage_termin ? ` · ${datum(a.montage_termin)}` : ""}` : "nein" }, { label: "Lieferadresse", wert: a.lieferadresse || "wie Rechnungsadresse" }, { label: "Lieferhinweis", wert: a.lieferhinweis || "–" }]} />
            {Number(a.geliefert_cent || 0) === 0 && <p className="mt-3 text-[14px] text-bo-text-soft">{LEER.lieferung}</p>}
          </Kachel>
        )}
        {tab === "verlauf" && (
          <Kachel titel="Verlauf" titelId="h-v">
            <Zeitleiste doctype="PH Auftragsbestaetigung" name={a.name} docinfo={docinfo} darfSchreiben={rolle.schreibt} />
          </Kachel>
        )}
      </AkteGeruest>
    </FakturaSeite>
  );
}
