// /marketing/empfaenger/[email] – Personen-Akte (10-konzept-marketing § 2.4, T5): Abo, alle Einwilligungen,
// Zustellungen (Newsletter + Kundenreisen), Event-Anmeldungen und Empfehlungen einer Adresse. Rechte Spalte Bezüge.
import { notFound } from "next/navigation";
import Link from "next/link";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Knopf from "@/components/Backoffice/Knopf";
import { AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import Rahmen from "@/components/Backoffice/Marketing/Rahmen";
import { Status } from "@/components/Backoffice/Marketing/Bausteine";
import { AboFelder, PersonAktionen, WiderrufKnopf } from "@/components/Backoffice/Marketing/PersonAktionen";
import { interessenListe, marketingKontext, personAkte } from "@/lib/backoffice/marketing/daten";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import { kurzDatum, langDatum, monatAusSlug } from "@/lib/backoffice/marketing/regeln";
import { KANAL_TEXT, PERSON, QUELLE_TEXT, SPRACHE_TEXT, STATUS_TEXT, ZWECK_TEXT, seitentitel } from "@/lib/backoffice/marketing/texte";
import { druckHref } from "@/lib/backoffice/druck/index";
import { Icon } from "@/components/Backoffice/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: seitentitel("Person") };

export default async function PersonSeite({ params, searchParams }) {
  const { email: roh } = await params;
  const email = decodeURIComponent(roh).toLowerCase();
  const sp = await searchParams;
  const ctx = await marketingKontext({ pfad: `/marketing/empfaenger/${roh}`, doctype: "PH Newsletter Abo" });
  const [p, interessen] = await Promise.all([personAkte(ctx.client, email), interessenListe(ctx.client)]);
  if (!p) notFound();
  const abo = p.abo;
  const titel = abo?.anrede_name || abo?.titel || p.kontakt?.titel || email;
  const gesperrt = !!Number(p.kontakt?.nicht_kontaktieren || 0);
  const tabs = [
    { id: "uebersicht", titel: PERSON.tabs.uebersicht },
    { id: "einwilligungen", titel: PERSON.tabs.einwilligungen, anzahl: p.einwilligungen.length || undefined },
    { id: "zustellungen", titel: PERSON.tabs.zustellungen, anzahl: p.versand.length + p.reise.length || undefined },
    { id: "verlauf", titel: PERSON.tabs.verlauf },
  ];
  const tab = aktiverTab(tabs, sp.tab);

  const einwListe = (
    <ul className="flex flex-col gap-2" data-testid="person-einwilligungen">
      {p.einwilligungen.map((w) => (
        <li key={w.name} className="flex flex-wrap items-center gap-3 rounded-[16px] bg-(--color-bo-surface-2) px-4 py-3">
          <Status gruppe="einwilligung" wert={w.status} />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium">{ZWECK_TEXT[w.zweck] || w.zweck}</span>
            <span className="bo-mar-klein inline-flex items-center gap-1" title={PERSON.nachweisfeld}>
              <Icon name="Lock" className="size-3" />
              {KANAL_TEXT[w.kanal]} · Textversion {w.textversion} · {kurzDatum(w.zeitpunkt, { jahr: true })}
              {w.erteilung_beleg ? " · Formular" : ""}
              {w.widerrufen_am ? ` · widerrufen ${kurzDatum(w.widerrufen_am, { jahr: true })}` : ""}
            </span>
          </span>
          <Knopf size="s" variant="ghost" icon="Printer" href={druckHref("PH Einwilligung", w.name, "PH Einwilligung Nachweis")}>
            {PERSON.nachweis}
          </Knopf>
          {ctx.team && ["Offen", "Bestaetigt"].includes(w.status) && <WiderrufKnopf name={w.name} zweck={w.zweck} />}
        </li>
      ))}
    </ul>
  );

  return (
    <Rahmen ctx={ctx}>
      <AkteKopf
        zurueck={{ href: "/marketing/empfaenger", titel: "Empfänger" }}
        krumen={[{ titel: "Marketing", href: "/marketing" }, { titel: "Empfänger", href: "/marketing/empfaenger" }, { titel }]}
        titel={titel}
        nummer={
          <span className="bo-mar-kopfzeile mt-0">
            <span>{email}</span>
            {abo ? <Status gruppe="abo" wert={abo.status} testid="abo-status" /> : <span className="bo-mar-klein">kein Newsletter</span>}
            {abo && <span>{QUELLE_TEXT[abo.quelle] || abo.quelle} · {SPRACHE_TEXT[abo.sprache] || abo.sprache}</span>}
          </span>
        }
        aktionen={<PersonAktionen email={email} abo={abo} einwilligungen={p.einwilligungen} leitung={ctx.leitung} team={ctx.team} faehig={ctx.an} gesperrt={false} textversion={ctx.einst.einwilligung_textversion} dsgvoHref={p.kontakt ? `/kunden/${encodeURIComponent(p.kontakt.name)}?tab=mehr` : "/datenschutz"} />}
      />
      {gesperrt && (
        <div className="mb-6">
          <Band ton="gefahr" titel={PERSON.sperreKontakt} />
        </div>
      )}
      <div className="mb-6">
        <AkteTabs tabs={tabs} aktiv={tab} basis={`/marketing/empfaenger/${roh}`} params={{}} />
      </div>
      <div className="bo-mar-akte">
        <div className="bo-mar-stapel">
          {tab === "uebersicht" && (
            <>
              <Kachel titel={PERSON.newsletter} unter={abo ? null : "Diese Adresse hat kein Newsletter-Abo."}>
                {abo && (
                  <>
                    <ol className="bo-mar-schritte mt-3" aria-label="Weg der Anmeldung">
                      <li className="bo-mar-schritt" data-zustand="erledigt">
                        <span className="bo-mar-schritt__punkt"><Icon name="Check" className="size-3.5" /></span>
                        <span className="bo-mar-schritt__text">{PERSON.angemeldet} {kurzDatum(abo.angemeldet_am, { zeit: true })}</span>
                      </li>
                      <li className="bo-mar-schritt" data-zustand={abo.doi_gesendet_am ? "erledigt" : "offen"}>
                        <span className="bo-mar-schritt__punkt"><Icon name="Mail" className="size-3.5" /></span>
                        <span className="bo-mar-schritt__text">{PERSON.bestaetigungsmail} {abo.doi_gesendet_am ? kurzDatum(abo.doi_erinnert_am || abo.doi_gesendet_am, { zeit: true }) : "–"}</span>
                      </li>
                      <li className="bo-mar-schritt" data-zustand={abo.doi_bestaetigt_am ? "erledigt" : "aktuell"}>
                        <span className="bo-mar-schritt__punkt"><Icon name={abo.doi_bestaetigt_am ? "Check" : "Clock"} className="size-3.5" /></span>
                        <span className="bo-mar-schritt__text">{abo.doi_bestaetigt_am ? `${PERSON.bestaetigt} ${kurzDatum(abo.doi_bestaetigt_am, { zeit: true })}` : STATUS_TEXT.abo[abo.status]}</span>
                      </li>
                    </ol>
                    <p className="bo-mar-klein mt-2" title={PERSON.statusNurUeber}>{PERSON.statusNurUeber}</p>
                    <AboFelder email={email} abo={abo} interessen={interessen} nurLesen={!ctx.team} />
                  </>
                )}
              </Kachel>
              <Kachel titel="Einwilligungen" unter={PERSON.korrektur}>
                <div className="mt-3">{p.einwilligungen.length ? einwListe : <p className="bo-mar-unter">{PERSON.einwilligungenLeer}</p>}</div>
              </Kachel>
            </>
          )}
          {tab === "einwilligungen" && (
            <Kachel titel="Einwilligungen" unter={PERSON.korrektur}>
              <div className="mt-3">{p.einwilligungen.length ? einwListe : <Leer groesse="karte" text={PERSON.einwilligungenLeer} />}</div>
            </Kachel>
          )}
          {tab === "zustellungen" && (
            <Kachel titel="Zustellungen" unter="Newsletter und Kundenreisen">
              {p.versand.length + p.reise.length === 0 ? (
                <p className="bo-mar-unter mt-2">{PERSON.zustellungenLeer}</p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="bo-mar-tabelle">
                    <thead>
                      <tr>
                        <th scope="col">Mail</th>
                        <th scope="col">Status</th>
                        <th scope="col">Gesendet</th>
                        <th scope="col">Grund</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.versand.map((v) => (
                        <tr key={v.name}>
                          <td>
                            <Link className="bo-mar-link" href={`/marketing/newsletter/${encodeURIComponent(v.ausgabe)}`}>
                              Newsletter {v.ausgabe}
                            </Link>
                          </td>
                          <td><Status gruppe="versand" wert={v.status} /></td>
                          <td title={langDatum(v.gesendet_am)}>{kurzDatum(v.gesendet_am, { jahr: true })}</td>
                          <td className="bo-mar-unter">{v.grund || "–"}</td>
                        </tr>
                      ))}
                      {p.reise.map((v) => (
                        <tr key={v.name}>
                          <td>
                            <Link className="bo-mar-link" href={`/marketing/kundenreisen/${encodeURIComponent(v.reise)}`}>
                              Kundenreise {v.reise}
                            </Link>
                          </td>
                          <td><Status gruppe="reiseVersand" wert={v.status} /></td>
                          <td>{kurzDatum(v.gesendet_am || v.geplant_am, { jahr: true })}</td>
                          <td className="bo-mar-unter">{v.grund || "–"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Kachel>
          )}
          {tab === "verlauf" && (abo ? <Zeitleiste doctype="PH Newsletter Abo" name={abo.name} docinfo={p.docinfo} darfSchreiben={ctx.team} /> : <p className="bo-mar-unter">Kein Verlauf ohne Abo.</p>)}
        </div>
        <aside className="bo-mar-akte__rechts">
          <Kachel titel={PERSON.bezuege}>
            <ul className="mt-2 flex flex-col gap-2 text-[14px]" data-testid="bezuege">
              <li>{p.kontakt ? <Link className="bo-mar-link font-medium" href={`/kunden/${encodeURIComponent(p.kontakt.name)}`}>{PERSON.kundenakte} {p.kontakt.titel}</Link> : <span className="bo-mar-unter">{PERSON.kundenakte}: {PERSON.nichtVerknuepft}</span>}</li>
              {p.events.map((e) => (
                <li key={e.event}>
                  <Link className="bo-mar-link" href={`/marketing/events/${encodeURIComponent(e.event)}`}>
                    Event {e.titel}
                  </Link>{" "}
                  <span className="bo-mar-klein">({STATUS_TEXT.anmeldung[e.status] || e.status})</span>
                </li>
              ))}
              {p.empfehlungen.map((e) => (
                <li key={e.name}>
                  <Link className="bo-mar-link" href={`/marketing/empfehlungen/${encodeURIComponent(e.name)}`}>
                    Empfehlung {e.code}
                  </Link>
                </li>
              ))}
              {abo?.einwilligung && <li className="bo-mar-klein">Abo seit {monatAusSlug(String(abo.angemeldet_am || "").slice(0, 7))}</li>}
            </ul>
          </Kachel>
        </aside>
      </div>
    </Rahmen>
  );
}
