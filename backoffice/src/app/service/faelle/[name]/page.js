// Akte Servicefall (T5, 10-konzept-service §3): Kopf mit Status und genau einem Primärknopf (Server-Schritt),
// Phasenleiste, SLA-Zeile, höchstens ein Hinweisband, fünf Reiter, rechte Spalte (Kunde, Bezüge, Verlauf).
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRecht } from "@/lib/backoffice/auth/dal";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { ladeAkte, ladeKatalog, serviceClient } from "@/lib/backoffice/service/daten";
import { knopfFuer } from "@/lib/backoffice/service/naechsterSchritt";
import { abschlussMitgeteilt, bannerKandidaten, lieferantHaftet, maengelanzeigeOffen, meldezustand, schliessbar } from "@/lib/backoffice/service/regeln";
import { EINSATZ_STATUS, ERSATZTEIL_ZEILE, REGRESS_STATUS, ABGLEICH, text as anzeigeText } from "@/lib/backoffice/service/labels";
import { datumLang, euro, personName, spanne, tagKurz, tagMonat, zeitpunkt } from "@/lib/backoffice/service/anzeige";
import { fallTitel } from "@/lib/backoffice/service/zeilen";
import { T } from "@/lib/backoffice/service/texte";
import Shell from "@/components/Backoffice/Shell/Shell";
import Kachel from "@/components/Backoffice/Kachel";
import Fehler from "@/components/Backoffice/Fehler";
import { AkteKopf, AkteTabs, Band } from "@/components/Backoffice/Akte";
import Avatar from "@/components/Backoffice/Avatar";
import { Pille } from "@/components/Backoffice/StatusBadge";
import { Icon } from "@/components/Backoffice/icons";
import Knopf from "@/components/Backoffice/Knopf";
import NurIntern from "@/components/Backoffice/Kundenmodus/NurIntern";
import { FallStatus, Fakten, Status } from "@/components/Backoffice/Service/Teile";
import { Fristband, Phasenleiste, SlaZeile, Zeitleiste } from "@/components/Backoffice/Service/AkteTeile";
import FallAktionen, { AktionKnopf } from "@/components/Backoffice/Service/FallAktionen";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Service` };
}

const TABS = ["uebersicht", "mangel", "bearbeitung", "regress", "verlauf"];

export default async function FallAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const sp = await searchParams;
  const name = decodeURIComponent(roh);
  const session = await requireRecht("service", "read", `/service/faelle/${roh}`);
  const client = serviceClient(session);
  let d;
  try {
    d = await ladeAkte(client, session, name);
  } catch (err) {
    if (istBackofficeError(err) && err.code === "not_found") notFound();
    return (
      <Shell session={session}>
        <Fehler code={istBackofficeError(err) ? err.code : "unavailable"} message={err?.message} zurueckHref="/service/faelle" />
      </Shell>
    );
  }
  const katalog = await ladeKatalog(client).catch(() => ({ bereiche: [], codes: [] }));
  const { fall, sicht: s, personen: p } = d;
  const heute = new Date();
  const tab = TABS.includes(sp.tab) ? sp.tab : "uebersicht";
  const offenerEinsatz = d.einsaetze.find((e) => ["Geplant", "Bestaetigt", "Unterwegs", "In Arbeit"].includes(e.status));
  const einsatzText = offenerEinsatz ? `Einsatz ${tagKurz(offenerEinsatz.datum)}, ${personName(offenerEinsatz.techniker, p)}` : "";
  const knopf = knopfFuer(fall, d.naechsterSchritt, { leitung: s.leitung, einsatzText });
  const kommentare = d.docinfo?.comments || [];
  const sch = schliessbar(fall, { leitung: s.leitung, regresse: d.regresse, kommentare });
  const mitgeteilt = abschlussMitgeteilt(fall, { kommentare });
  const banner = bannerKandidaten(fall, { regresse: d.regresse, leitung: s.leitung, heute });
  const letzterEinsatz = d.einsaetze.find((e) => e.status === "Erledigt") || null;
  const teile = (fall.ersatzteile || []).map((t, i) => ({ ...t, name: t.name || String(t.idx || i + 1) }));
  const mz = meldezustand(fall);
  const kennzeichen = [lieferantHaftet(fall) && T.akte.lieferantHaftet, fall.prioritaet === "Dringend" && "Dringend", fall.quelle === "website" && "Website", fall.quelle === "portal" && "Portal"].filter(Boolean);
  const basis = `/service/faelle/${encodeURIComponent(name)}`;
  const bannerAktion = (b) =>
    b.aktion === "erstreaktion" ? (
      <AktionKnopf aktion="telefonat" variant="secondary">{T.aktionen.telefonat}</AktionKnopf>
    ) : b.aktion === "maengelanzeige" ? (
      <AktionKnopf aktion="maengelanzeige">{T.aktionen.maengelanzeige}</AktionKnopf>
    ) : b.aktion === "kulanz-erneut" || b.aktion === "kulanz-freigeben" ? (
      <AktionKnopf aktion="kulanz">{b.aktion === "kulanz-freigeben" ? T.aktionen.kulanzFreigeben : T.aktionen.kulanzErneut}</AktionKnopf>
    ) : b.aktion === "entscheidung-aendern" ? (
      <AktionKnopf aktion="pruefen">Entscheidung ändern</AktionKnopf>
    ) : b.aktion === "regress" ? (
      <Knopf size="s" href="/service/regress">Regress</Knopf>
    ) : null;

  // --------------------------------------------------------------- Reiter --
  let inhalt;
  if (tab === "uebersicht") {
    inhalt = (
      <div className="grid gap-(--bo-bento-gap)">
        <Kachel titel="Gewährleistung" unter={fall.kundentyp} werkzeuge={<Knopf size="s" variant="ghost" href={`${basis}?tab=mangel`} iconRechts="ArrowRight">{T.akte.bearbeiten}</Knopf>}>
          <Fristband fall={fall} kompakt heute={heute} />
        </Kachel>
        <div className="grid gap-(--bo-bento-gap) lg:grid-cols-2">
          <Kachel titel={T.akte.mangel} unter={fall.fehlercode ? `${fall.fehlercode} ${fall.fehlercode_bezeichnung || ""}` : "Fehlercode fehlt"} werkzeuge={<Knopf size="s" variant="ghost" href={`${basis}?tab=mangel`} iconRechts="ArrowRight">{T.akte.bearbeiten}</Knopf>}>
            <p className="bo-svc-zitat">{String(fall.beschreibung || "").replace(/<[^>]+>/g, "")}</p>
            <Fakten className="mt-4" eintraege={[{ label: T.melden.stelle, wert: fall.ort_am_stueck }, { label: T.melden.seit, wert: fall.erstauftreten ? datumLang(fall.erstauftreten) : null }, { label: T.melden.wunsch, wert: fall.kundenwunsch }, { label: T.melden.produkt, wert: [fall.produkt_name, fall.marke].filter(Boolean).join(" · ") }]} />
            {(fall.fotos || []).length > 0 && (
              <div className="bo-svc-galerie mt-4">
                {fall.fotos.slice(0, 3).map((f, i) => (
                  <span key={i} className="bo-svc-foto">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Fotos des Falls */}
                    <img src={f.bild} alt={f.hinweis || `Foto ${i + 1}`} loading="lazy" />
                  </span>
                ))}
              </div>
            )}
          </Kachel>
          <div className="grid content-start gap-(--bo-bento-gap)">
            <Kachel titel={T.akte.kontaktiert} unter={fall.erstreaktion_am ? `${fall.erstreaktion_kanal || "–"} · ${zeitpunkt(fall.erstreaktion_am)}` : T.akte.nochNicht}>
              <p className="text-[14px] text-bo-text-soft">
                Reaktionsfrist {datumLang(fall.frist_reaktion)}
                {fall.erstreaktion_am ? (String(fall.erstreaktion_am).slice(0, 10) <= String(fall.frist_reaktion) ? " · eingehalten" : " · überschritten") : ""}
              </p>
              <p className="mt-2 text-[14px] text-bo-text-soft">
                Kanal {fall.kanal} · Quelle {fall.quelle || "–"}
                {Number(fall.portal_sichtbar) ? " · im Portal sichtbar" : ""}
              </p>
            </Kachel>
            {s.kosten && (
              <NurIntern>
                <Kachel titel={T.akte.kosten} unter={T.akte.kostenLeitung}>
                  <Fakten eintraege={[{ label: "Intern", wert: euro(fall.kosten_intern_cent) }, { label: "Extern", wert: euro(fall.kosten_extern_cent) }, { label: "Kulanz/Minderung (brutto an Kunden)", wert: euro(Number(fall.kulanz_cent || 0) + Number(fall.preisminderung_cent || 0)) }, { label: "Regress erhalten", wert: euro(fall.regress_erhalten_cent) }]} />
                </Kachel>
              </NurIntern>
            )}
          </div>
        </div>
      </div>
    );
  } else if (tab === "mangel") {
    inhalt = (
      <div className="grid gap-(--bo-bento-gap)">
        <Kachel titel="Fristen" unter={`${mz.paragraf || ""} · Übergabe ${datumLang(fall.uebergabe_datum)}`}>
          <Fristband fall={fall} heute={heute} />
          <Fakten spalten={3} className="mt-5" eintraege={[{ label: "Kaufdatum", wert: datumLang(fall.kaufdatum) }, { label: "Übergabe", wert: datumLang(fall.uebergabe_datum) }, { label: "Sache", wert: fall.sachart === "Unbeweglich" ? "fest eingebaut" : "beweglich" }, { label: "Lieferung an Händler", wert: datumLang(fall.lieferung_an_haendler) }, { label: "Garantie", wert: Number(fall.garantie_monate) ? `${fall.garantie_monate} Monate` : "keine" }, { label: "Übergabequelle", wert: fall.uebergabe_quelle }]} />
        </Kachel>
        <Kachel titel={T.akte.mangel} unter={fall.fehlercode ? `${fall.fehlercode} · ${fall.fehlercode_bezeichnung}` : "Fehlercode fehlt"} werkzeuge={s.schreiben && ["Gemeldet", "Geprueft"].includes(fall.status) ? <AktionKnopf aktion="pruefen">{T.aktionen.pruefen}</AktionKnopf> : null}>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid content-start gap-4">
              <p className="bo-svc-zitat">{String(fall.beschreibung || "").replace(/<[^>]+>/g, "")}</p>
              <Fakten eintraege={[{ label: T.melden.stelle, wert: fall.ort_am_stueck }, { label: T.melden.seit, wert: datumLang(fall.erstauftreten) }, { label: "Reproduzierbar", wert: Number(fall.reproduzierbar) ? "ja" : "nein" }, { label: T.melden.seriennummer, wert: fall.seriennummer }, { label: "Mangel bestätigt", wert: fall.mangel_bestaetigt }, { label: "Ursache", wert: anzeigeText(fall.ursache) }]} />
            </div>
            <div className="bo-svc-karte bo-svc-wissen">
              <p>
                <b>{T.melden.pruefhinweis}</b>
                {d.code?.pruefhinweis || "–"}
              </p>
              <p>
                <b>{T.melden.standardloesung}</b>
                {d.code?.standardloesung || fall.standardloesung || "–"}
              </p>
              <p>
                <b>{T.katalog.felder.ursache}</b>
                {d.code?.typische_ursache || "–"}
              </p>
            </div>
          </div>
        </Kachel>
        <Kachel titel={T.akte.fotos} unter={`${(fall.fotos || []).length} Dateien · an den Lieferanten nur einzeln freigegeben`}>
          {(fall.fotos || []).length ? (
            <div className="bo-svc-galerie">
              {fall.fotos.map((f, i) => (
                <figure key={i} className="bo-svc-foto">
                  {/* eslint-disable-next-line @next/next/no-img-element -- Fotos des Falls */}
                  <img src={f.bild} alt={f.hinweis || `Foto ${i + 1}`} loading="lazy" />
                  <figcaption className="bo-svc-foto__fuss">
                    <span className="rounded-pill bg-bo-glass px-2 py-0.5 text-[12px] font-medium backdrop-blur">{f.quelle}</span>
                    {Number(f.an_lieferant) ? <span className="rounded-pill bg-bo-glass px-2 py-0.5 text-[12px] font-medium backdrop-blur">an Lieferant</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{T.akte.keineFotos}</p>
          )}
        </Kachel>
      </div>
    );
  } else if (tab === "bearbeitung") {
    inhalt = (
      <div className="grid gap-(--bo-bento-gap) lg:grid-cols-2">
        <Kachel titel={T.akte.entscheidung} unter={fall.entscheidung ? `${fall.entschieden_von ? personName(fall.entschieden_von, p) : ""} · ${zeitpunkt(fall.entschieden_am)}` : T.akte.keineEntscheidung} werkzeuge={s.schreiben && ["Gemeldet", "Geprueft", "Entscheidung"].includes(fall.status) ? <AktionKnopf aktion="pruefen">{fall.entscheidung ? "Entscheidung ändern" : T.aktionen.pruefen}</AktionKnopf> : null}>
          {fall.entscheidung ? (
            <>
              <p className="bo-zahl-gross">{fall.entscheidung}</p>
              {Number(fall.kulanz_cent) > 0 && (
                <p className="mt-1 text-[14px] text-bo-text-soft">
                  Kulanz {euro(fall.kulanz_cent)} brutto · Freigabe {anzeigeText(fall.kulanz_freigabe_status)}
                </p>
              )}
              <p className="bo-svc-zitat mt-4">{fall.entscheidung_begruendung}</p>
            </>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{T.akte.keineEntscheidung}</p>
          )}
        </Kachel>
        <Kachel titel={T.akte.einsaetze} unter={`${d.einsaetze.length} Einsätze`} werkzeuge={s.schreiben && !["Gemeldet", "Geschlossen", "Abgelehnt"].includes(fall.status) ? <Knopf size="s" href={`/service/einsaetze/neu?fall=${encodeURIComponent(name)}`} icon="CalendarPlus">{T.aktionen.einsatz}</Knopf> : null}>
          {d.einsaetze.length ? (
            <ul className="bo-svc-zeilen -mx-3">
              {d.einsaetze.map((e) => (
                <li key={e.name} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                  <span className="min-w-0">
                    <Link href={`/service/einsaetze/${encodeURIComponent(e.name)}`} className="bo-svc-zeile__link">
                      <span className="bo-svc-zeile__titel">{tagKurz(e.datum)} · {spanne(e.zeit_von, e.zeit_bis)}</span>
                    </Link>
                    <span className="bo-svc-zeile__unter">{[personName(e.techniker, p), e.ergebnis].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="bo-svc-zeile__rechts">
                    <Status wert={e.status} map={EINSATZ_STATUS} groesse="sm" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{T.akte.keinEinsatz}</p>
          )}
        </Kachel>
        <Kachel titel={T.akte.ersatzteile} unter={`${teile.length} Zeilen`} werkzeuge={s.schreiben && !["Geschlossen", "Abgelehnt"].includes(fall.status) ? <AktionKnopf aktion="teil" icon="Plus">{T.aktionen.teil}</AktionKnopf> : null}>
          {teile.length ? (
            <ul className="bo-svc-zeilen -mx-3">
              {teile.map((t) => (
                <li key={t.name} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                  <span className="min-w-0">
                    <span className="bo-svc-zeile__titel">{t.bezeichnung}</span>
                    <span className="bo-svc-zeile__unter">{[`${t.menge} ×`, t.hersteller_nr, anzeigeText(t.kostentraeger), t.bestellung].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="bo-svc-zeile__rechts">
                    <Pille material={ERSATZTEIL_ZEILE[t.status]?.material}>{ERSATZTEIL_ZEILE[t.status]?.text || t.status}</Pille>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{T.akte.keineTeile}</p>
          )}
          {d.ersatzteilbestellungen.length > 0 && (
            <p className="mt-3 text-[13px] text-bo-text-soft">
              Bestellungen:{" "}
              {d.ersatzteilbestellungen.map((b, i) => (
                <span key={b.name}>
                  {i > 0 && ", "}
                  <Link className="underline" href={`/service/ersatzteile/bestellungen/${encodeURIComponent(b.name)}`}>
                    {b.name}
                  </Link>{" "}
                  ({anzeigeText(b.status)})
                </span>
              ))}
            </p>
          )}
        </Kachel>
        <Kachel titel={T.akte.geld} unter="Gutschrift und Mahnsperre laufen über Faktura">
          {["Preisminderung", "Kulanz"].includes(fall.entscheidung) && fall.rechnung ? (
            <div className="grid gap-3">
              <p className="text-[14px]">
                {fall.entscheidung} {euro(fall.preisminderung_cent || fall.kulanz_cent)} brutto zu {fall.rechnung}. Positionen und USt kommen aus der Rechnung – Entwurf in Faktura prüfen.
              </p>
              <Knopf size="s" href={`/d/ph-rechnung/${encodeURIComponent(fall.rechnung)}`} iconRechts="ArrowUpRight">
                {T.aktionen.gutschrift}
              </Knopf>
              <p className="bo-svc-hinweis">Die Service-Methode „Gutschrift“ bucht ohne USt und wird deshalb nicht verwendet (E4).</p>
            </div>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{fall.rechnung ? `Rechnung ${fall.rechnung} · keine Gutschrift nötig.` : "Noch keine Rechnung – Minderung in der Schlussrechnung abziehen."}</p>
          )}
        </Kachel>
      </div>
    );
  } else if (tab === "regress") {
    const offenAnzeige = maengelanzeigeOffen(fall, { regresse: d.regresse });
    inhalt = (
      <div className="grid gap-(--bo-bento-gap)">
        <Kachel titel={T.akte.lieferant} unter={[fall.lieferant, fall.marke].filter(Boolean).join(" · ") || "Kein Lieferant hinterlegt"} testid="lieferanten-leiste">
          {!lieferantHaftet(fall) ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] text-bo-text-soft">{T.akte.lieferantHaftetNicht}</p>
              {s.schreiben && fall.lieferant && fall.status !== "Gemeldet" && <AktionKnopf aktion="maengelanzeige" variant="ghost">{T.akte.trotzdemAnzeige}</AktionKnopf>}
            </div>
          ) : offenAnzeige ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] font-medium text-bo-eiche-text">{T.akte.maengelanzeigeOffen(fall.lieferant)}</p>
              {s.schreiben && <AktionKnopf aktion="maengelanzeige">{T.aktionen.maengelanzeige}</AktionKnopf>}
            </div>
          ) : fall.status === "Erledigt" && !d.regresse.length ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] font-medium">{fall.kundentyp === "Unternehmer" || fall.entscheidung === "Kulanz" ? T.akte.keinRegress933b : T.akte.forderungOffen(datumLang(fall.regress_frist_bis))}</p>
              {s.schreiben && <AktionKnopf aktion="forderung">{T.aktionen.forderung}</AktionKnopf>}
            </div>
          ) : d.regresse.length ? (
            <ul className="bo-svc-zeilen -mx-3">
              {d.regresse.map((r) => (
                <li key={r.name} className="bo-svc-zeile bo-svc-zeile--ohne-bild">
                  <span className="min-w-0">
                    <Link href={`/service/regress/${encodeURIComponent(r.name)}`} className="bo-svc-zeile__link">
                      <span className="bo-svc-zeile__titel">{r.name}</span>
                    </Link>
                    <span className="bo-svc-zeile__unter">
                      {r.status === "Gemeldet" ? T.akte.gemeldetNichtGewahrt(tagMonat(r.gemeldet_am), datumLang(r.frist_bis)) : ["Anerkannt", "Verrechnet"].includes(r.status) ? T.akte.gewahrt() : `Frist ${datumLang(r.frist_bis)}`}
                    </span>
                  </span>
                  <span className="bo-svc-zeile__rechts flex-col items-end">
                    <Status wert={r.status} map={REGRESS_STATUS} groesse="sm" />
                    <span className="text-[13px] tabular-nums text-bo-text-soft">
                      {euro(r.betrag_gefordert_cent)} · {ABGLEICH[r.abgleich_status]?.text || "–"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-bo-text-soft">Mängelanzeige folgt nach der Prüfung, die Forderung nach Erledigung.</p>
          )}
        </Kachel>
        <Kachel titel={T.akte.abschluss} unter={fall.erledigt_am ? `Erledigt ${zeitpunkt(fall.erledigt_am)} · ${fall.dauer_tage} Tage` : T.akte.abschlussVorher}>
          {fall.erledigt_am || fall.status === "Abgelehnt" ? (
            <div className="grid gap-4">
              <p className="bo-svc-zitat">{fall.abschlussbericht || "–"}</p>
              <Fakten eintraege={[{ label: T.akte.mitgeteilt, wert: mitgeteilt ? "ja" : T.akte.nichtMitgeteilt }, { label: "Abnahme", wert: Number(fall.abnahme_bestaetigt) ? `bestätigt ${zeitpunkt(fall.abnahme_am)} · ${fall.abnahme_name}` : "nein" }, { label: "Geschlossen", wert: fall.geschlossen_am ? zeitpunkt(fall.geschlossen_am) : null }, { label: "Ablehnungsgrund", wert: fall.ablehnungsgrund }]} />
              {fall.status === "Erledigt" && !mitgeteilt && s.schreiben && (
                <div>
                  <AktionKnopf aktion="informieren">Abschluss mitteilen</AktionKnopf>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[14px] text-bo-text-soft">{T.akte.abschlussVorher}</p>
          )}
        </Kachel>
      </div>
    );
  } else {
    inhalt = (
      <Kachel titel={T.akte.tabs.verlauf} unter="Status, Kommunikation, Einsätze und Kommentare">
        <Zeitleiste verlauf={fall.verlauf || []} kommentare={kommentare} personen={p} />
      </Kachel>
    );
  }

  const tabs = [
    { id: "uebersicht", titel: T.akte.tabs.uebersicht },
    { id: "mangel", titel: T.akte.tabs.mangel },
    { id: "bearbeitung", titel: T.akte.tabs.bearbeitung, anzahl: d.einsaetze.length + teile.length || undefined },
    { id: "regress", titel: T.akte.tabs.regress },
    { id: "verlauf", titel: T.akte.tabs.verlauf, anzahl: (fall.verlauf || []).length + kommentare.length || undefined },
  ];
  const lieferantEmail = "";

  return (
    <Shell session={session}>
      <div className="grid gap-6">
        <AkteKopf
          zurueck={{ href: "/service/faelle", titel: T.akte.zurueck }}
          krumen={[{ titel: "Service", href: "/service" }, { titel: "Servicefälle", href: "/service/faelle" }, { titel: name }]}
          titel={fallTitel(fall)}
          nummer={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="tabular-nums">{name} · {fall.art}</span>
              <FallStatus fall={fall} />
              {kennzeichen.slice(0, 2).map((k) => (
                <Pille key={k} material={k === "Dringend" ? "eiche" : "stein"} groesse="s">
                  {k}
                </Pille>
              ))}
              {kennzeichen.length > 2 && <span className="text-[13px] text-bo-text-soft">+{kennzeichen.length - 2}</span>}
            </span>
          }
          aktionen={<FallAktionen fall={fall} knopf={knopf} regresse={d.regresse} einsaetze={d.einsaetze} katalog={katalog} code={d.code} sicht={{ ...s, user: session.user }} schwelleCent={Number(d.einst.kulanz_schwelle_cent) || 0} schliessbar={sch} mitgeteilt={mitgeteilt} teile={teile} letzterEinsatz={letzterEinsatz} lieferantEmail={lieferantEmail} />}
          testid="akte-kopf"
        />

        <Kachel dicht>
          {fall.status === "Abgelehnt" ? (
            <Band ton="neutral" titel={T.akte.abgelehnt(zeitpunkt(fall.modified), fall.ablehnungsgrund)} text={fall.entscheidung_begruendung} aktion={s.leitung ? <AktionKnopf aktion="oeffnen">{T.aktionen.oeffnen}</AktionKnopf> : null} />
          ) : (
            <div className="grid gap-4">
              <Phasenleiste fall={fall} einsatzText={einsatzText} />
              <SlaZeile fall={fall} />
            </div>
          )}
        </Kachel>

        {banner.length > 0 && (
          <div className="grid gap-2">
            <Band ton={banner[0].ton} titel={banner[0].titel} text={banner[0].text} aktion={s.schreiben ? bannerAktion(banner[0]) : null} testid="akte-band" />
            {banner.length > 1 && (
              <details className="group">
                <summary className="cursor-pointer px-2 text-[13px] font-medium text-bo-text-soft">{T.akte.weitereHinweise(banner.length - 1)}</summary>
                <div className="mt-2 grid gap-2">
                  {banner.slice(1).map((b) => (
                    <Band key={b.id} ton={b.ton} titel={b.titel} text={b.text} aktion={s.schreiben ? bannerAktion(b) : null} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />

        <div className="grid min-w-0 gap-(--bo-bento-gap) xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">{inhalt}</div>
          <aside className="grid min-w-0 content-start gap-(--bo-bento-gap)">
            <Kachel titel={T.akte.kunde} unter={fall.kundentyp}>
              <div className="flex items-center gap-3">
                <Avatar name={fall.kunde_name} groesse={44} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{fall.kunde_name}</span>
                  <span className="block truncate text-[13px] text-bo-text-soft">{[fall.einsatz_strasse, [fall.einsatz_plz, fall.einsatz_ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</span>
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {fall.kunde_telefon && (
                  <Knopf size="s" href={`tel:${fall.kunde_telefon.replace(/\s/g, "")}`} icon="Phone">
                    {fall.kunde_telefon}
                  </Knopf>
                )}
                {fall.kunde_email && s.schreiben && <AktionKnopf aktion="informieren" icon="Mail">{T.akte.email}</AktionKnopf>}
                {fall.kontakt && (
                  <Knopf size="s" variant="ghost" href={`/d/ph-kontakt/${encodeURIComponent(fall.kontakt)}`} iconRechts="ArrowUpRight">
                    {T.akte.kundenakte}
                  </Knopf>
                )}
              </div>
            </Kachel>
            <Kachel titel={T.akte.bezuege}>
              <Fakten
                spalten={1}
                eintraege={[
                  fall.projekt && { label: T.akte.projekt, wert: <Link className="underline" href={`/d/ph-projekt/${encodeURIComponent(fall.projekt)}`}>{fall.projekt}</Link> },
                  fall.rechnung && { label: "Rechnung", wert: <Link className="underline" href={`/d/ph-rechnung/${encodeURIComponent(fall.rechnung)}`}>{fall.rechnung}</Link> },
                  fall.lieferschein && { label: "Lieferschein", wert: <Link className="underline" href={`/d/ph-lieferschein/${encodeURIComponent(fall.lieferschein)}`}>{fall.lieferschein}</Link> },
                  { label: T.akte.stueck, wert: [fall.produkt_name, fall.marke, fall.seriennummer].filter(Boolean).join(" · ") },
                  { label: T.akte.lieferant, wert: fall.lieferant },
                  { label: "Verantwortlich", wert: personName(fall.verantwortlich, p) },
                ]}
              />
            </Kachel>
            <Kachel titel={T.akte.tabs.verlauf} unter="Letzte Einträge" werkzeuge={<Knopf size="s" variant="ghost" href={`${basis}?tab=verlauf`}>Alle</Knopf>}>
              <Zeitleiste verlauf={fall.verlauf || []} kommentare={kommentare} personen={p} max={5} testid="zeitleiste-kurz" />
            </Kachel>
            {s.kosten && fall.notiz_intern && (
              <NurIntern>
                <Kachel titel={T.akte.notizIntern} werkzeuge={<Icon name="Lock" className="size-4 text-bo-text-soft" />}>
                  <p className="text-[14px]">{fall.notiz_intern}</p>
                </Kachel>
              </NurIntern>
            )}
          </aside>
        </div>
      </div>
    </Shell>
  );
}
