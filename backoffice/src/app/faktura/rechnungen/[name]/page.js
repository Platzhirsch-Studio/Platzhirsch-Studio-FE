import { notFound } from "next/navigation";
import Link from "next/link";
import { fakturaKontext, ladeBeleg, kontaktVon, firma, einstellungen, alle, mahnbare, mahnEinstellungen } from "@/lib/backoffice/faktura/daten";
import { summenblock } from "@/lib/backoffice/faktura/betraege";
import { pruefePflichtangaben, leistungsQuelle } from "@/lib/backoffice/faktura/pflichtangaben";
import { rechnungPrimaer, rechnungMenue, rechnungBand, belegkette } from "@/lib/backoffice/faktura/akte";
import { stellDaten, rechnungSignal } from "@/lib/backoffice/faktura/zeilen";
import { statusAnzeige } from "@/lib/backoffice/faktura/status";
import { naechsteMahnungAb } from "@/lib/backoffice/faktura/regeln";
import { AKTE, ART_LANG, LEER, wertLabel, ZAHLUNG } from "@/lib/backoffice/faktura/texte";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { AkteGeruest, AkteKopf, AkteTabs, Band, Vorgangsleiste, RechteSpalte } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import AnDieKassa from "@/components/Backoffice/AnDieKassa";
import { DruckKnopf } from "@/components/Backoffice/Druck/DruckPanel";
import FakturaSeite from "@/components/Backoffice/Faktura/FakturaSeite";
import { Summenblock, PflichtListe, PositionenLesend } from "@/components/Backoffice/Faktura/Bausteine";
import { AkteAktionen, PositionenEditor, UnternehmerSchalter } from "@/components/Backoffice/Faktura/AkteTeile";
import { Status, Signal, Hinweis } from "@/components/Backoffice/Faktura/teile";
import { Fakten } from "@/components/Backoffice/Faktura/teile";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Faktura` };
}

// Rechnungsakte (T5, 10-konzept-faktura § 4.1): Kopf (Nummer, Art, Kunde, Status, Betrag + „offen …“), Vorgangsleiste
// mit Belegkette, höchstens ein Band, 5 Reiter (Alt+1…5), Hängemappe rechts ab 1280 px. Summenblock bei 1280 × 800
// ohne Scrollen sichtbar (U-16).
export default async function RechnungAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await fakturaKontext(`/faktura/rechnungen/${roh}`);
  const { client, rolle, schalter, heute } = ctx;
  const beleg = await ladeBeleg(client, "PH Rechnung", name, rolle);
  if (!beleg) notFound();
  const { doc: r, docinfo } = beleg;
  const [kontakt, fa, fe, me] = await Promise.all([kontaktVon(client, r.kontakt), firma(client), einstellungen(client), mahnEinstellungen(client)]);
  const [auftrag, angebot, rechnungenAuftrag, mahnungen, gutschriften, mahn] = await Promise.all([
    r.auftrag ? client.getDoc("PH Auftragsbestaetigung", r.auftrag).catch(() => null) : null,
    r.angebot ? client.getDoc("PH Angebot", r.angebot).catch(() => null) : null,
    r.auftrag ? alle(client, "PH Rechnung", { fields: ["name", "art", "status", "docstatus", "brutto_cent", "bezahlt_cent"], filters: [["auftrag", "=", r.auftrag]] }) : [],
    alle(client, "PH Mahnung", { fields: ["name", "stufe", "status", "datum", "gesamt_cent"], filters: [["rechnung", "=", r.name]] }),
    alle(client, "PH Gutschrift", { fields: ["name", "art", "status", "brutto_cent", "docstatus"], filters: [["rechnung", "=", r.name]] }),
    mahnbare(client, heute),
  ]);
  const entwurf = Number(r.docstatus) === 0;
  const pruefung = entwurf ? pruefePflichtangaben(r, kontakt, fa, fe) : null;
  const s = summenblock(r);
  const st = statusAnzeige("PH Rechnung", r.status, { mahnstufe: r.mahnstufe });
  const tabs = AKTE.tabs.rechnung.map((t) => ({ ...t, anzahl: t.id === "positionen" ? (r.positionen || []).length : t.id === "zahlung" ? (r.zahlungen || []).length || undefined : undefined }));
  const tab = aktiverTab(tabs, sp?.tab);
  const band = rechnungBand(r, { gesperrtBis: fe.gesperrt_bis });
  const ziel = { name: r.name, doctype: "PH Rechnung", titel: r.kunde_name, daten: stellDaten({ ...r, email: r.email ?? kontakt.email }, r.email ?? kontakt.email ?? "") };
  const lq = leistungsQuelle(r);
  const offeneAnzahlungen = r.auftrag && entwurf && ["Schlussrechnung", "Teilrechnung"].includes(r.art) ? rechnungenAuftrag.filter((x) => x.art === "Anzahlungsrechnung" && Number(x.docstatus) === 1 && !(r.anzahlungen_verrechnet || []).some((a) => a.anzahlungsrechnung === x.name)) : [];
  const basis = `/faktura/rechnungen/${encodeURIComponent(r.name)}`;
  const signal = rechnungSignal(r, heute);

  return (
    <FakturaSeite ctx={ctx} titel={r.name} ohneKopf mahnvorschlag={mahn}>
      <AkteGeruest
        testid="rechnung-akte"
        vorgangOben
        kopf={
          <AkteKopf
            zurueck={{ href: "/faktura/rechnungen", titel: "Rechnungen" }}
            krumen={[{ titel: "Faktura", href: "/faktura" }, { titel: "Rechnungen", href: "/faktura/rechnungen" }, { titel: entwurf ? AKTE.rechnungsentwurf : r.name }]}
            titel={<span className={r.status === "Storniert" ? "line-through decoration-1" : undefined}>{entwurf ? AKTE.rechnungsentwurf : r.name}</span>}
            nummer={`${ART_LANG[r.art] || r.art} · ${r.kunde_name || "–"}`}
            status={
              <span className="flex flex-wrap items-center gap-2">
                <Status status={{ ...st, gebucht: !entwurf, storniert: r.status === "Storniert" }} />
                <Signal signal={signal} />
              </span>
            }
            betrag={{ cent: r.brutto_cent, unter: Number(r.offen_cent) > 0 ? AKTE.offen(cent(r.offen_cent)) : undefined }}
            aktionen={
              <span className="flex items-center gap-2">
                <DruckKnopf doctype="PH Rechnung" name={r.name} titel={`Rechnung ${r.name}`} pdf={client.modus === "frappe"} knopf={{ label: "Drucken", children: "Drucken" }} />
                <AkteAktionen ziel={ziel} primaer={rechnungPrimaer(r, rolle)} menue={rechnungMenue(r, rolle, schalter)} rolle={rolle} leitungBitten={!rolle.leitung && rolle.schreibt ? { aktion: "uneinbringlich", aktionTitel: "Rechnung als uneinbringlich buchen" } : null} />
              </span>
            }
          />
        }
        band={band && <Band ton={band.ton} titel={band.titel} testid="rechnung-band" />}
        vorgang={<Vorgangsleiste titel={AKTE.belegkette} kompakt mitText schritte={belegkette({ angebot, auftrag, rechnungen: rechnungenAuftrag.length ? rechnungenAuftrag : [r], aktuell: "rechnung" })} />}
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={sp || {}} />}
        rechts={
          <RechteSpalte
            details={
              <Fakten
                eintraege={[
                  { label: "Kunde", wert: r.kontakt ? <Link className="hover:underline" href={`/d/ph-kontakt/${encodeURIComponent(r.kontakt)}`}>{r.kunde_name}</Link> : r.kunde_name },
                  { label: "Auftrag", wert: r.auftrag ? <Link className="hover:underline" href={`/faktura/auftraege/${encodeURIComponent(r.auftrag)}`}>{r.auftrag}</Link> : null },
                  { label: "Projekt", wert: r.projekt || null },
                  { label: "Mahnungen", wert: mahnungen.length ? mahnungen.map((x) => `${x.name} (Stufe ${x.stufe})`).join(", ") : null },
                  { label: "Gutschriften", wert: gutschriften.length ? gutschriften.map((g) => g.name).join(", ") : null },
                  { label: "Export", wert: r.export_lauf || null },
                  { label: "PDF", wert: r.pdf_fixiert_am ? AKTE.pdfFixiert(datumZeit(r.pdf_fixiert_am)) : entwurf ? "Entwurf – Wasserzeichen" : null },
                ]}
              />
            }
          />
        }
      >
        {tab === "uebersicht" && (
          <div className="grid grid-cols-1 gap-4 xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Kachel titel="Beträge" titelId="h-betraege">
              <Summenblock s={s} />
            </Kachel>
            <Kachel titel={AKTE.adresse} titelId="h-adresse">
              <div className="flex flex-col gap-4">
                <p className="text-[15px] leading-6">
                  {[r.firma, r.kunde_name !== r.firma ? r.kunde_name : null].filter(Boolean).join(" · ")}
                  <br />
                  {r.strasse}
                  <br />
                  {[r.plz, r.ort].filter(Boolean).join(" ")} {r.land && r.land !== "AT" ? `· ${r.land}` : ""}
                </p>
                <Fakten
                  eintraege={[
                    { label: AKTE.leistung, wert: r.leistungsdatum ? `${datum(r.leistungsdatum)} · ${lq.quelle || "ohne Quelle"}` : "–" },
                    { label: AKTE.zahlungsziel, wert: r.faellig ? `${datum(r.faellig)} (${r.zahlungsziel_tage || 14} Tage)` : `${r.zahlungsziel_tage || 14} Tage ab Stellen` },
                    { label: "Rechnungsdatum", wert: entwurf ? "Tag des Stellens" : datum(r.datum) },
                  ]}
                />
                {entwurf && <UnternehmerSchalter doctype="PH Rechnung" name={r.name} an={pruefung?.unternehmer} modified={r.modified} />}
                {entwurf && (
                  <section>
                    <h3 className="mb-2 text-[13px] font-medium text-bo-text-soft">{AKTE.pflicht}</h3>
                    <PflichtListe pruefung={pruefung} basis={basis} />
                  </section>
                )}
                {offeneAnzahlungen.length > 0 && <Hinweis ton="warnung">{AKTE.offeneAnzahlungen(offeneAnzahlungen.length)}</Hinweis>}
              </div>
            </Kachel>
          </div>
        )}
        {tab === "positionen" && (
          <Kachel titel="Positionen" titelId="h-pos">
            {entwurf && rolle.schreibt ? <PositionenEditor doctype="PH Rechnung" name={r.name} positionen={r.positionen || []} modified={r.modified} /> : <PositionenLesend positionen={r.positionen || []} mitEinkauf={rolle.permlevel1} mengenInfo={["Teilrechnung", "Schlussrechnung"].includes(r.art)} />}
          </Kachel>
        )}
        {tab === "zahlung" && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <Kachel titel={AKTE.zahlungen} titelId="h-zahl">
              {(r.anzahlungen_verrechnet || []).length > 0 && (
                <section className="mb-4">
                  <h3 className="mb-2 text-[13px] font-medium text-bo-text-soft">{AKTE.anzahlungenAbgezogen}</h3>
                  <ul className="flex flex-col gap-1 text-[14px]">
                    {r.anzahlungen_verrechnet.map((a) => (
                      <li key={a.anzahlungsrechnung} className="flex justify-between gap-3 tabular-nums">
                        <span>{a.anzahlungsrechnung} · vereinnahmt</span>
                        <span>−{cent(a.brutto_cent)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {(r.zahlungen || []).length === 0 ? (
                <p className="text-[14px] text-bo-text-soft">{LEER.zahlungen}</p>
              ) : (
                <ul className="flex flex-col gap-2" data-testid="zahlungen">
                  {r.zahlungen.map((z, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 rounded-bo-zeile bg-bo-surface-2 px-3.5 py-2.5 text-[14px]">
                      <span>
                        {datum(z.datum)} · {wertLabel(z.kanal)}
                        {z.hinweis ? <span className="text-bo-text-faint"> · {z.hinweis}</span> : null}
                      </span>
                      <span className="font-medium tabular-nums">{cent(z.betrag_cent)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-[13px] text-bo-text-soft">
                Zahlungsreferenz {r.zahlungsreferenz || "–"} · Zahl-QR-Code {r.qr_code_girocode ? "✓" : "–"} · {schalter.stripeLink ? "Zahlungslink möglich" : ZAHLUNG.stripeAus}
              </p>
              {!entwurf && Number(r.offen_cent) > 0 && (
                <div className="mt-3">
                  <AnDieKassa session={ctx.session} kunde={r.kontakt} beleg={r.name} />
                </div>
              )}
            </Kachel>
            <Kachel titel={AKTE.mahnung} titelId="h-mahn">
              <Fakten
                eintraege={[
                  { label: "Stufe", wert: Number(r.mahnstufe) ? `Stufe ${r.mahnstufe}` : "–" },
                  { label: "Letzte Mahnung", wert: r.letzte_mahnung ? datum(r.letzte_mahnung) : "–" },
                  { label: "Mahnsperre", wert: r.mahnsperre ? `ja · ${r.mahnsperre_grund || ""}` : "nein" },
                ]}
              />
              {!mahnungen.length && <p className="mt-3 text-[14px] text-bo-text-soft">{LEER.nichtGemahnt(naechsteMahnungAb(r, { karenzTage: Number(me.karenz_tage) || 7, abstandTage: Number(me.abstand_tage) || 14 }) ? datum(naechsteMahnungAb(r, { karenzTage: Number(me.karenz_tage) || 7 })) : null)}</p>}
              {mahnungen.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1 text-[14px]">
                  {mahnungen.map((x) => (
                    <li key={x.name}>
                      <Link className="hover:underline" href={`/faktura/mahnungen/${encodeURIComponent(x.name)}`}>
                        {x.name}
                      </Link>{" "}
                      · Stufe {x.stufe} · {wertLabel(x.status)} · {datum(x.datum)}
                    </li>
                  ))}
                </ul>
              )}
            </Kachel>
          </div>
        )}
        {tab === "steuer" && (
          <Kachel titel="Steuer & Texte" titelId="h-steuer">
            <Fakten
              eintraege={[
                { label: AKTE.steuerfall, wert: wertLabel(r.ust_fall) || "Inland" },
                { label: "Hinweistext", wert: r.ust_hinweistext || "–" },
                { label: "Kleinbetrag", wert: r.kleinbetragsrechnung ? "✓" : "–" },
                { label: "Umsatzsteuer fällig", wert: r.art === "Anzahlungsrechnung" ? (r.ust_faelligkeit === "faellig" ? "mit Vereinnahmung – fällig" : "fällig mit Vereinnahmung") : "mit Rechnung" },
                { label: AKTE.uvaMonat, wert: r.uva_monat || String(r.datum || "").slice(0, 7) || "–" },
                { label: AKTE.waehrung, wert: "EUR" },
                { label: AKTE.uid, wert: r.uid_empfaenger ? `${r.uid_empfaenger}${r.uid_geprueft_am ? ` · geprüft ${datum(r.uid_geprueft_am)}` : " · nicht geprüft"}` : "–" },
                { label: AKTE.versand, wert: r.gesendet_am ? `${datum(r.gesendet_am)} · ${wertLabel(r.versandkanal) || "E-Mail"}` : "nicht versandt" },
                { label: "Export", wert: r.export_status === "exportiert" ? `exportiert · ${r.export_lauf}` : "offen" },
              ]}
            />
          </Kachel>
        )}
        {tab === "verlauf" && (
          <Kachel titel="Verlauf" titelId="h-verlauf">
            <Zeitleiste doctype="PH Rechnung" name={r.name} docinfo={docinfo} darfSchreiben={rolle.schreibt} />
          </Kachel>
        )}
      </AkteGeruest>
    </FakturaSeite>
  );
}
