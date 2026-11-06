import { notFound } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Leer from "@/components/Backoffice/Leer";
import Fehler from "@/components/Backoffice/Fehler";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { AkteGeruest, AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Zeitleiste from "@/components/Backoffice/Formular/Zeitleiste";
import { Fakten, ProduktBild, Schritte, Status } from "@/components/Backoffice/Sortiment/Bausteine";
import BestellAktionen from "@/components/Backoffice/Sortiment/BestellAktionen";
import AbgleichTabelle from "@/components/Backoffice/Sortiment/AbgleichTabelle";
import Uebermittlung from "@/components/Backoffice/Sortiment/Uebermittlung";
import { bestellAkte, sortimentKontext, stammAuswahl } from "@/lib/backoffice/sortiment/daten";
import { abUeberfaellig, bestellKette, restmengen } from "@/lib/backoffice/sortiment/regeln";
import { abVollstaendig, merkerAlle } from "@/lib/backoffice/sortiment/uebermittlung";
import { BESTELLAKTE, GLOSSAR } from "@/lib/backoffice/sortiment/texte";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istSortiment } from "@/lib/backoffice/sortiment/rollen";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Bestellungen · Sortiment` };
}

const TABS = ["positionen", "ab", "uebermittlung", "lieferung", "verlauf"];

export default async function BestellAkte({ params, searchParams }) {
  const name = decodeURIComponent((await params).name);
  const sp = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, String(v)]));
  const pfad = `/sortiment/bestellungen/${encodeURIComponent(name)}`;
  const { session, client, meta, leitung, ek } = await sortimentKontext({ pfad, doctype: "PH Herstellerbestellung" });
  let a;
  try {
    a = await bestellAkte(client, session, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={err?.code || "unavailable"} zurueckHref="/sortiment/bestellungen" />
      </Shell>
    );
  }
  const b = a.doc;
  const tab = TABS.includes(sp.tab) ? sp.tab : "positionen";
  const darfSchreiben = darfDoc(session, meta, "write") && istSortiment(session); // Projekte: nur lesen + anfragen (§ 1.2)
  const lieferanten = darfSchreiben && b.status === "Entwurf" ? (await stammAuswahl(client)).lieferanten : [];
  const merker = merkerAlle(b);
  const merkerVon = Object.fromEntries(merker.map((m) => [m.idx, m.merker]));
  const fertig = merker.filter((m) => ["bestaetigt", "geklaert"].includes(m.merker)).length;
  const rest = Object.fromEntries(restmengen(b).map((r) => [r.idx, r]));
  const schritte = bestellKette(b).map((s) => ({ ...s, titel: BESTELLAKTE.schritte[s.id] }));
  const ab = abUeberfaellig(b, { frist: a.lieferant?.ab_erwartet_tage || 5 });
  const stueck = (b.positionen || []).reduce((x, p) => x + (Number(p.menge) || 0), 0);

  const band =
    b.status === "Storniert"
      ? { ton: "neutral", titel: "Storniert", text: "Diese Bestellung ist storniert und wird aufbewahrt." }
      : !b.lieferant
        ? { ton: "warnung", titel: "Ohne Lieferant", text: "Erst einen Lieferanten zuordnen, dann senden." }
        : ab.ueberfaellig
          ? { ton: "warnung", titel: "AB ausständig", text: `Gesendet vor ${ab.tage} Tagen – Frist ${a.lieferant?.ab_erwartet_tage || 5} Tage.` }
          : Number(b.abweichungen_offen) > 0
            ? { ton: "warnung", titel: BESTELLAKTE.abweichungenTitel, text: `${b.abweichungen_offen} offen – vor dem Bestätigen klären.` }
            : null;

  return (
    <Shell session={session}>
      <AkteGeruest
        vorgangOben
        kopf={
          <AkteKopf className="bo-sor-kopf"
            zurueck={{ href: "/sortiment/bestellungen", titel: "Bestellungen" }}
            krumen={[{ titel: "Sortiment", href: "/sortiment" }, { titel: "Bestellungen", href: "/sortiment/bestellungen" }, { titel: b.name }]}
            titel={b.titel || b.name}
            nummer={[b.name, b.lieferant || "ohne Lieferant", b.kommission || "Lagerbestellung"].join(" · ")}
            status={<Status gruppe="bestellung" wert={b.status} />}
            betrag={ek && b.summe_ek_cent ? { cent: b.summe_ek_cent, unter: BESTELLAKTE.sumNetto } : { text: `${stueck} Stk.`, unter: `${(b.positionen || []).length} Positionen` }}
            aktionen={<BestellAktionen b={b} lieferant={a.lieferant} lieferanten={lieferanten.map((l) => ({ name: l.name, marke: l.marke }))} leitung={leitung} darfSchreiben={darfSchreiben} />}
          />
        }
        vorgang={
          <div className="bo-kachel bo-kachel--dicht">
            <Schritte schritte={schritte} label={BESTELLAKTE.kette} />
          </div>
        }
        band={band ? <Band ton={band.ton} titel={band.titel} text={band.text} /> : null}
        reiter={
          <AkteTabs
            basis={pfad}
            params={sp}
            aktiv={tab}
            tabs={[
              { id: "positionen", titel: BESTELLAKTE.tabs.positionen, anzahl: (b.positionen || []).length },
              { id: "ab", titel: BESTELLAKTE.tabs.ab, anzahl: Number(b.abweichungen_offen) || undefined },
              { id: "uebermittlung", titel: BESTELLAKTE.tabs.uebermittlung },
              { id: "lieferung", titel: BESTELLAKTE.tabs.lieferung, anzahl: a.eingaenge.length || undefined },
              { id: "verlauf", titel: BESTELLAKTE.tabs.verlauf },
            ]}
          />
        }
        rechts={
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel={BESTELLAKTE.abMerker} unter={b.ab_nummer ? BESTELLAKTE.abMerkerUnter(fertig, merker.length) : BESTELLAKTE.abFehlt}>
              <div className="flex flex-col gap-3">
                <Pille material={b.ab_nummer ? (abVollstaendig(merker.map((m) => m.merker)) ? "salbei" : "eiche") : "stein"}>{b.ab_nummer ? (abVollstaendig(merker.map((m) => m.merker)) ? BESTELLAKTE.abVollstaendig : BESTELLAKTE.abUnvollstaendig) : GLOSSAR.abMerker.offen}</Pille>
                <Fakten
                  eintraege={[
                    { label: "AB-Nummer", wert: b.ab_nummer || "–" },
                    { label: "AB-Datum", wert: datum(b.ab_datum) },
                    { label: BESTELLAKTE.wunschtermin, wert: datum(b.wunschtermin) },
                    { label: BESTELLAKTE.bestaetigterTermin, wert: datum(b.bestaetigter_termin) },
                  ]}
                />
              </div>
            </Kachel>
            <Kachel titel="Details">
              <Fakten
                spalten={1}
                eintraege={[
                  { label: "Lieferant", wert: b.lieferant ? <Link className="underline-offset-2 hover:underline" href={`/sortiment/lieferanten/${encodeURIComponent(b.lieferant)}`}>{b.lieferant}</Link> : "–" },
                  { label: "Bestellweg", wert: GLOSSAR.bestellweg[a.lieferant?.bestellweg || b.bestellweg] || "–" },
                  { label: BESTELLAKTE.lieferadresse, wert: GLOSSAR.lieferadresse[b.lieferadresse] || b.lieferadresse },
                  { label: "Bestellt am", wert: datum(b.datum) },
                  { label: "Gesendet", wert: b.gesendet_am ? `${datumZeit(b.gesendet_am)}${b.gesendet_an ? ` · ${b.gesendet_an}` : ""}` : "–" },
                  b.bezug_name ? { label: BESTELLAKTE.bezug, wert: `Auftrag ${b.bezug_name}` } : null,
                ]}
              />
            </Kachel>
          </div>
        }
      >
        {tab === "positionen" && (
          <Kachel titel={BESTELLAKTE.positionen} unter={BESTELLAKTE.positionenUnter((b.positionen || []).length, stueck)} flach>
            <div className="overflow-x-auto px-4 pb-4">
              <table className="bo-sor-tabelle" data-testid="positionen">
                <thead>
                  <tr>
                    <th scope="col">Pos.</th>
                    <th scope="col">Position</th>
                    <th scope="col" className="r">{BESTELLAKTE.bestellt}</th>
                    <th scope="col" className="r">{BESTELLAKTE.bestaetigt}</th>
                    <th scope="col" className="r">{BESTELLAKTE.erhalten}</th>
                    {ek && <th scope="col" className="r">EK netto</th>}
                    <th scope="col">{BESTELLAKTE.abMerker}</th>
                  </tr>
                </thead>
                <tbody>
                  {(b.positionen || []).map((p, i) => {
                    const idx = p.idx || i + 1;
                    return (
                      <tr key={idx}>
                        <td className="bo-sor-nr">{idx}</td>
                        <td>
                          <div className="flex min-w-0 items-center gap-3">
                            <ProduktBild src={a.bilder[p.produkt] || ""} alt="" groesse={44} />
                            <div className="min-w-0">
                              {p.produkt ? (
                                <Link href={`/sortiment/produkte/${encodeURIComponent(p.produkt)}`} className="bo-sor-titel line-clamp-1 hover:underline">
                                  {p.bezeichnung}
                                </Link>
                              ) : (
                                <span className="bo-sor-titel line-clamp-1">{p.bezeichnung}</span>
                              )}
                              <p className="bo-sor-unter truncate">{[p.hersteller_artikelnr, p.ausfuehrung_text].filter(Boolean).join(" · ") || "–"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="r bo-sor-zahl">
                          {p.menge} Stk.
                          <span className="bo-sor-klein block">{datum(p.wunschtermin)}</span>
                        </td>
                        <td className="r bo-sor-zahl">
                          {p.ab_menge !== undefined && p.ab_menge !== "" && p.ab_menge !== null ? `${p.ab_menge} Stk.` : "–"}
                          <span className="bo-sor-klein block">{datum(p.bestaetigter_termin)}</span>
                        </td>
                        <td className="r bo-sor-zahl">
                          {p.menge_erhalten || 0} Stk.
                          {rest[idx]?.rest > 0 && ["AB geprueft", "Teilgeliefert"].includes(b.status) ? <span className="bo-sor-klein block">Rest {rest[idx].rest}</span> : null}
                        </td>
                        {ek && <td className="r bo-sor-zahl">{p.ek_cent ? cent(p.ek_cent) : "–"}</td>}
                        <td>
                          <Status gruppe="abMerker" wert={merkerVon[idx] || "offen"} groesse="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Kachel>
        )}

        {tab === "ab" && (
          <Kachel titel={BESTELLAKTE.abweichungenTitel} unter={b.ab_nummer ? BESTELLAKTE.abweichungenUnter(b.abweichungen_anzahl || 0, b.abweichungen_offen || 0) : BESTELLAKTE.abFehlt}>
            {!b.ab_nummer ? (
              <Leer groesse="karte" titel={BESTELLAKTE.abFehlt} text="Sobald die Auftragsbestätigung da ist: „AB einlesen“." icon="ScrollText" />
            ) : !(b.ab_abgleich || []).length ? (
              <Leer art="erledigt" groesse="karte" titel={BESTELLAKTE.abweichungenLeer} />
            ) : (
              <AbgleichTabelle name={b.name} abNummer={b.ab_nummer} zeilen={b.ab_abgleich} leitung={leitung} darfSchreiben={darfSchreiben && ["AB erhalten", "AB geprueft"].includes(b.status)} />
            )}
          </Kachel>
        )}

        {tab === "uebermittlung" && (
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel={BESTELLAKTE.uebermittlungTitel} unter={BESTELLAKTE.uebermittlungUnter}>
              <Uebermittlung b={b} lieferant={a.lieferant ? { firmenname: a.lieferant.firmenname, gln: a.lieferant.gln, kundennummer_bei_lieferant: a.lieferant.kundennummer_bei_lieferant, bestellweg: a.lieferant.bestellweg } : null} eigeneGln={a.einst.eigene_gln} darfSchreiben={darfSchreiben} />
            </Kachel>
            <Kachel titel={BESTELLAKTE.uebermittlungProtokoll}>
              {!(b.uebermittlungen || []).length ? (
                <p className="bo-sor-unter">{BESTELLAKTE.uebermittlungLeer}</p>
              ) : (
                <ol className="flex flex-col gap-1">
                  {[...b.uebermittlungen].reverse().map((u, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 hover:bg-bo-fill">
                      <span className="min-w-0">
                        <span className="block text-[14px] font-medium">
                          {GLOSSAR.uebermittlungWeg[u.weg] || u.weg} · {GLOSSAR.uebermittlungStatus[u.status] || u.status}
                        </span>
                        <span className="bo-sor-klein block">{[datumZeit(u.zeitpunkt), u.hinweis].filter(Boolean).join(" · ")}</span>
                      </span>
                      <Status gruppe="uebermittlung" wert={u.status} groesse="sm" />
                    </li>
                  ))}
                </ol>
              )}
            </Kachel>
          </div>
        )}

        {tab === "lieferung" && (
          <div className="flex flex-col gap-(--bo-bento-gap)">
            <Kachel titel={BESTELLAKTE.wareneingaenge}>
              {!a.eingaenge.length ? (
                <p className="bo-sor-unter">{BESTELLAKTE.keinWareneingang}</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {a.eingaenge.map((w) => (
                    <li key={w.name}>
                      <Link href={`/sortiment/wareneingang/${encodeURIComponent(w.name)}`} className="flex items-center justify-between gap-3 rounded-[14px] px-3 py-2.5 hover:bg-bo-fill">
                        <span>
                          <span className="block text-[14px] font-medium tabular-nums">{w.name}</span>
                          <span className="bo-sor-klein">{[datum(w.datum), w.lieferschein_nr_lieferant, w.spediteur].filter(Boolean).join(" · ")}</span>
                        </span>
                        <Status gruppe="we" wert={w.status} groesse="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Kachel>
            <Kachel titel={BESTELLAKTE.terminaenderungen}>
              {!(b.terminaenderungen || []).length ? (
                <p className="bo-sor-unter">Keine Terminänderungen.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {b.terminaenderungen.map((t, i) => (
                    <li key={i} className="rounded-[14px] bg-bo-fill px-4 py-3 text-[14px]">
                      <span className="font-medium tabular-nums">
                        {datum(t.termin_alt)} → {datum(t.termin_neu)}
                      </span>
                      <span className="bo-sor-klein block">{[t.grund, t.quelle, datum(t.datum)].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Kachel>
          </div>
        )}

        {tab === "verlauf" && (
          <Kachel titel={BESTELLAKTE.tabs.verlauf}>
            <Zeitleiste doctype="PH Herstellerbestellung" name={b.name} docinfo={a.docinfo} darfSchreiben={darfSchreiben} />
          </Kachel>
        )}
      </AkteGeruest>
    </Shell>
  );
}
