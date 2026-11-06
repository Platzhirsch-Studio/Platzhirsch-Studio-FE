// /shop/bestellungen/[name] – Bestellungsakte (T5; 10-konzept-shop § 5.1): Kopf mit Primäraktion je Status ×
// Zahlungsweg × Geld (primaer.js), höchstens ein Band (+ n Hinweise), Hero mit Glas-Kacheln, Phasenleiste,
// fünf feste Reiter (Alt+1…5), rechte Spalte Beträge · Nächster Schritt · Bezüge. Kein Löschen.
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte, bestellBezuege, einstellungen } from "@/lib/backoffice/shop/daten";
import { bestellAktionen, bestellBaender, AKTIONEN } from "@/lib/backoffice/shop/primaer";
import { naechsterSchritt, steuerfallOffen } from "@/lib/backoffice/shop/naechsterSchritt";
import { statusInfo, zusatzChips, kanalText, mailStatusText, risikoStufe } from "@/lib/backoffice/shop/status";
import { offen, erstattungGesperrt, satzText } from "@/lib/backoffice/shop/geld";
import { zustellung, abschliessenAb, belehrungNachweisbar } from "@/lib/backoffice/shop/fristen";
import { docFuerAktion } from "@/lib/backoffice/shop/zeilen";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, AkteHero, GlasKachel, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge, { Pille } from "@/components/Backoffice/StatusBadge";
import { AktenAktionen, SperrGruende } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { BandKnopf } from "@/components/Backoffice/Shop/Teile";
import { Phasenleiste, bestellPhasen, Verlauf, Betraege, Fakten, BezugListe } from "@/components/Backoffice/Shop/Akteteile";
import { Thumb } from "@/components/Backoffice/Shop/Dialoge";
import BestellFelder from "@/components/Backoffice/Shop/BestellFelder";
import ShopIcon from "@/components/Backoffice/Shop/ShopIcon";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Shop` };
}

const TABS = [
  { id: "uebersicht", titel: "Übersicht" },
  { id: "positionen", titel: "Positionen" },
  { id: "kunde", titel: "Kunde & Lieferung" },
  { id: "zahlung", titel: "Zahlung" },
  { id: "verlauf", titel: "Verlauf" },
];

export default async function BestellAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/bestellungen/${roh}`);
  const { client, session, leitung, heute } = ctx;
  const a = await akte(client, "PH Bestellung", name);
  if (!a?.doc) notFound();
  const b = a.doc;
  const [bez, eins] = await Promise.all([bestellBezuege(client, name), einstellungen(client)]);
  const fctx = { leitung, zahlungen: bez.zahlungen, rechnungen: bez.rechnungen, lieferscheine: bez.lieferscheine, heute, faehigkeiten: ctx.faehigkeiten, schreiben: ctx.schreiben, cent };
  const ak = bestellAktionen(b, fctx);
  const baender = bestellBaender(b, fctx);
  const schritt = naechsterSchritt(b, fctx);
  const st = statusInfo("PH Bestellung", b.status, b);
  const sperre = erstattungGesperrt(b, { zahlungen: bez.zahlungen, rechnungen: bez.rechnungen, gutschriftHook: ctx.faehigkeiten.gutschrift });
  const doc = docFuerAktion(b, { sperre: sperre?.code || null, vierAugenCent: Number(eins.stripe?.vier_augen_ab_cent ?? 100000), abholungFristTage: Number(eins.shop?.abholung_frist_tage) || 7, lieferschein: bez.lieferscheine[0]?.name || "" });
  const tabs = TABS.map((t) => (t.id === "positionen" ? { ...t, anzahl: (b.positionen || []).length } : t.id === "zahlung" ? { ...t, anzahl: bez.zahlungen.length } : t));
  const tab = aktiverTab(tabs, sp.tab);
  const zust = zustellung(b, bez.lieferscheine);
  const o = offen(b);
  const bild = (b.positionen || []).find((p) => p.bild)?.bild;
  const band = baender[0];
  const basis = `/shop/bestellungen/${roh}`;

  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest
        testid="bestellakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/bestellungen", titel: "Bestellungen" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Bestellungen", href: "/shop/bestellungen" }, { titel: name }]} rechts={<AktenAktionen primaer={ak.primaer} sekundaer={ak.sekundaer} menue={ak.menue} doc={doc} />} />}
        hero={
          <AkteHero
            bild={bild ? { src: bild, alt: "" } : undefined}
            ueber={name}
            titel={b.kunde_name}
            unter={`${b.bestellart === "Showroom" ? "Showroom-Reservierung" : b.bestellart === "Telefon" ? "Telefonbestellung" : b.bestellart === "Ersatz" ? "Ersatzlieferung" : "Website"} · ${b.lieferart === "abholung" ? "Abholung" : `Versand ${b.adresse_land || ""}`} · ${(b.positionen || []).length} Pos.`}
            chips={[{ icon: st.icon === "Bookmark" || st.icon === "CircleSlash" || st.icon === "Circle" ? "Info" : st.icon, text: st.anzeige }, ...zusatzChips(b, { zahlungen: bez.zahlungen }).map((c) => ({ icon: c.id === "test" ? "Sparkles" : "TriangleAlert", text: c.text }))]}
            kacheln={[
              { titel: "Gesamt", wert: cent(b.gesamt_cent), unter: `enth. ${cent(b.ust_cent)} USt` },
              { titel: "Bezahlt", wert: cent(b.betrag_bezahlt_cent), balken: { anteil: Number(b.gesamt_cent) ? Math.min(Number(b.betrag_bezahlt_cent) / Number(b.gesamt_cent), 1) : 1, label: o ? `offen ${cent(o)}` : "voll bezahlt" } },
              { titel: "Nächster Schritt", wert: schritt.titel, mittel: true, unter: schritt.faellig ? `bis ${datum(schritt.faellig)}` : "" },
              b.lieferart === "abholung"
                ? { titel: "Abholung", wert: b.abholcode || "–", mittel: true, unter: b.abholung_bis ? `bis ${datum(b.abholung_bis)}` : "noch kein Code" }
                : { titel: "Versand", wert: b.versendet_am ? datum(b.versendet_am) : "offen", mittel: true, unter: zust.datum ? `zugestellt ${datum(zust.datum)}${zust.geschaetzt ? " (geschätzt)" : ""}` : b.carrier || "" },
            ]}
          />
        }
        band={
          band ? (
            <div className="mb-6">
              <Band ton={band.ton} text={band.text} testid="akte-band" aktion={band.aktion && AKTIONEN[band.aktion] && band.aktion !== ak.primaer?.id ? <BandKnopf id={band.aktion} titel={AKTIONEN[band.aktion].titel} doc={doc} /> : null} />
              {baender.length > 1 && <p className="mt-2 text-[12px] text-bo-text-soft" data-testid="weitere-hinweise">+{baender.length - 1} {baender.length === 2 ? "Hinweis" : "Hinweise"}: {baender.slice(1).map((x) => x.text).join(" · ")}</p>}
            </div>
          ) : null
        }
        vorgang={<><SperrGruende aktionen={[ak.primaer, ...ak.sekundaer]} /><Phasenleiste schritte={bestellPhasen(b)} label="Bestellablauf" /></>}
        vorgangOben
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
        rechts={
          <RechteSpalte
            bezuege={<BezugListe eintraege={[
              b.kontakt ? { titel: "Kundenakte", wert: b.kunde_name, href: `/d/ph-kontakt/${encodeURIComponent(b.kontakt)}`, icon: "User" } : { titel: "Kunde", wert: "nicht verknüpft", icon: "User" },
              ...bez.zahlungen.map((z) => ({ titel: `Zahlung ${z.name}`, wert: `${kanalText(z.kanal)} · ${cent(z.betrag_cent)}`, href: `/shop/zahlungen/${encodeURIComponent(z.name)}`, icon: "Wallet" })),
              ...bez.lieferscheine.map((l) => ({ titel: `Lieferschein ${l.name}`, wert: l.zugestellt_am ? `zugestellt ${datum(l.zugestellt_am)}` : l.status, href: `/d/ph-lieferschein/${encodeURIComponent(l.name)}`, icon: "Truck" })),
              ...(bez.rechnungen.length ? bez.rechnungen.map((r) => ({ titel: `Rechnung ${r.name}`, wert: r.status || "", href: `/d/ph-rechnung/${encodeURIComponent(r.name)}`, icon: "FileText" })) : [{ titel: "Rechnung", wert: "noch keine", icon: "FileText" }]),
              ...bez.widerrufe.map((w) => ({ titel: `Widerruf ${w.name}`, wert: statusInfo("PH Widerruf", w.status).anzeige, href: `/shop/widerrufe/${encodeURIComponent(w.name)}`, icon: "Undo2" })),
              ...bez.retouren.map((r) => ({ titel: `Retoure ${r.name}`, wert: statusInfo("PH Retoure", r.status).anzeige, href: `/shop/retouren/${encodeURIComponent(r.name)}`, icon: "PackageCheck" })),
              b.ersatz_fuer ? { titel: `Ersatz für ${b.ersatz_fuer}`, wert: b.ersatz_grund, href: `/shop/bestellungen/${encodeURIComponent(b.ersatz_fuer)}`, icon: "RotateCcw" } : null,
            ].filter(Boolean)} />}
          >
            <Kachel titel="Beträge" unter={b.waehrung !== "EUR" ? "Fremdwährung" : undefined}>
              <Betraege gesamt={Number(b.gesamt_cent)} bezahlt={Number(b.betrag_bezahlt_cent)} erstattet={Number(b.erstattet_cent) || 0} posten={[{ label: "Waren", wert: cent(b.waren_cent) }, { label: "Versand", wert: cent(b.versand_cent) }]} />
            </Kachel>
          </RechteSpalte>
        }
      >
        {tab === "uebersicht" && (
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            <Kachel titel="Zahlung" werkzeuge={<a href={`${basis}?tab=zahlung`} className="text-[13px] font-medium text-bo-text-soft hover:text-bo-text">Bearbeiten →</a>}>
              <Fakten eintraege={[{ label: "Gesamt", wert: cent(b.gesamt_cent) }, { label: "Bezahlt", wert: cent(b.betrag_bezahlt_cent) }, { label: "Offen", wert: cent(o) }, { label: "Weg", wert: b.zahlung === "vorort" ? "vor Ort (Kassa)" : "online (Stripe)" }]} />
            </Kachel>
            {b.lieferart === "abholung" ? (
              <Kachel titel="Abholung">
                {b.abholcode ? <p className="bo-shop-code mb-3" data-testid="abholcode">{b.abholcode}</p> : <p className="mb-3 text-[14px] text-bo-text-soft">Der Abholcode entsteht beim Melden „Abholbereit“.</p>}
                <Fakten eintraege={[{ label: "Abholung bis", wert: b.abholung_bis ? datum(b.abholung_bis) : "–" }, { label: "Abholbereit seit", wert: b.abholbereit_am ? datumZeit(b.abholbereit_am) : "–" }, { label: "Abgeholt", wert: b.abgeholt_am ? datumZeit(b.abgeholt_am) : "–" }]} />
              </Kachel>
            ) : (
              <Kachel titel="Versand">
                <Fakten eintraege={[{ label: "Versanddienst", wert: [b.carrier, b.dienst].filter(Boolean).join(" ") || "–" }, { label: "Adresse", wert: `${b.adresse_strasse} ${b.adresse_hausnr}, ${b.adresse_plz} ${b.adresse_ort}` }, { label: "Sendungsnr.", wert: b.awb || "–", mono: !!b.awb }, { label: "Zugestellt", wert: zust.datum && !zust.geschaetzt ? datum(zust.datum) : "–" }]} />
              </Kachel>
            )}
            <Kachel titel="Positionen" className="lg:col-span-2" werkzeuge={<a href={`${basis}?tab=positionen`} className="text-[13px] font-medium text-bo-text-soft hover:text-bo-text">Alle →</a>}>
              <ul className="bo-shop-zeilen">
                {(b.positionen || []).map((p) => (
                  <li key={p.idx} className="bo-shop-zeile" style={{ gridTemplateColumns: "48px minmax(0,1fr) auto" }}>
                    <Thumb bild={p.bild} />
                    <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{p.bezeichnung}</span><span className="bo-shop-unter">{p.marke} · {p.menge} × {cent(p.einzel_cent)}</span></span>
                    <span className="bo-shop-betrag">{cent(p.summe_cent)}</span>
                  </li>
                ))}
              </ul>
            </Kachel>
            <Kachel titel="Intern" className="lg:col-span-2">
              <BestellFelder name={name} ich={session.user} zugewiesen={b.zugewiesen_an || ""} notiz={b.notiz_intern || ""} abholungBis={["reserviert", "abholbereit"].includes(b.status) ? b.abholung_bis || "" : null} schreiben={ctx.schreiben} />
            </Kachel>
          </div>
        )}
        {tab === "positionen" && (
          <Kachel titel="Positionen" unter={["offen", "reserviert"].includes(b.status) ? "Änderung nur über „Teilstorno …“" : "Nach dem Anlegen nicht mehr frei bearbeitbar"}>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead><tr className="text-left text-[12px] text-bo-text-soft"><th className="pb-3 font-medium">Artikel</th><th className="pb-3 text-right font-medium">Menge</th><th className="pb-3 text-right font-medium">Einzel</th><th className="pb-3 text-right font-medium">Summe</th><th className="pb-3 text-right font-medium">USt</th><th className="pb-3 text-right font-medium">zurück</th></tr></thead>
                <tbody>
                  {(b.positionen || []).map((p) => (
                    <tr key={p.idx} className="align-middle">
                      <td className="py-2"><span className="flex items-center gap-3"><Thumb bild={p.bild} /><span><span className="block font-semibold">{p.bezeichnung}</span><span className="bo-shop-unter">{[p.marke, p.variante_name].filter(Boolean).join(" · ")}</span></span></span></td>
                      <td className="py-2 text-right tabular-nums">{p.menge}</td>
                      <td className="py-2 text-right tabular-nums">{cent(p.einzel_cent)}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{cent(p.summe_cent)}</td>
                      <td className="py-2 text-right tabular-nums">{satzText(p.ust_satz_promille || 2000)}</td>
                      <td className="py-2 text-right tabular-nums">{Number(p.zurueck_menge) || Number(p.storniert_menge) ? `${p.zurueck_menge || 0} / ${cent(p.erstattet_cent || 0)}` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="bo-shop-posten mt-4">
              <li><span>Waren</span><span className="tabular-nums">{cent(b.waren_cent)}</span></li>
              <li><span>Versand</span><span className="tabular-nums">{cent(b.versand_cent)}</span></li>
              {(b.ust_aufteilung || []).map((u) => <li key={u.idx}><span className="text-bo-text-soft">enth. USt {satzText(u.satz_promille)}</span><span className="tabular-nums">{cent(u.ust_cent)}</span></li>)}
              <li><strong>Gesamt</strong><strong className="tabular-nums">{cent(b.gesamt_cent)}</strong></li>
            </ul>
          </Kachel>
        )}
        {tab === "kunde" && (
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            <Kachel titel="Kunde">
              <Fakten eintraege={[{ label: "Name", wert: b.kunde_name, href: b.kontakt ? `/d/ph-kontakt/${encodeURIComponent(b.kontakt)}` : undefined }, { label: "E-Mail", wert: b.kunde_email }, { label: "Telefon", wert: b.kunde_telefon || "–" }, { label: "Sprache", wert: { de: "Deutsch", en: "Englisch", fr: "Französisch", it: "Italienisch" }[b.sprache] || "Deutsch" }, { label: "Bestellart", wert: b.bestellart || "Online" }, { label: "Bestätigung", wert: mailStatusText(b.mail_status) }]} />
              {!b.kontakt && <p className="mt-4 text-[13px] text-bo-text-soft">Kein Kontakt verknüpft – Kontakt aus den Bestelldaten in der Kundenakte anlegen.</p>}
            </Kachel>
            <Kachel titel={b.lieferart === "abholung" ? "Abholung" : "Lieferadresse"}>
              <Fakten eins eintraege={[{ label: "Adresse", wert: b.lieferart === "abholung" ? "Showroom Lochau" : `${b.adresse_strasse} ${b.adresse_hausnr}, ${b.adresse_plz} ${b.adresse_ort}, ${b.adresse_land}` }, { label: "Rechnung an", wert: b.rechnung_name || b.kunde_name }, { label: "UID", wert: b.rechnung_uid || "–" }, { label: "Rechnung gewünscht", wert: Number(b.rechnungswunsch) ? "ja" : "nein" }]} />
              {b.status !== "offen" && b.status !== "bezahlt" && b.lieferart === "versand" && <p className="mt-4 text-[13px] text-bo-text-soft">Lieferschein bereits erzeugt – Versanddetails dort anpassen.</p>}
              {steuerfallOffen(b) && <p className="mt-4 text-[13px] font-medium text-bo-eiche-text">Firmenkunde mit UID, Lieferung DE – Steuerfall klären (Leitung).</p>}
            </Kachel>
            <Kachel titel="Nachweis" className="lg:col-span-2">
              <details>
                <summary className="cursor-pointer text-[14px] font-medium">AGB, Belehrung und Einwilligung anzeigen</summary>
                <div className="mt-4"><Fakten eintraege={[{ label: "AGB-Stand", wert: b.agb_stand ? datum(b.agb_stand) : "–" }, { label: "Widerrufsbelehrung", wert: b.widerrufsbelehrung_stand ? datum(b.widerrufsbelehrung_stand) : "–" }, { label: "Belehrung nachweisbar", wert: belehrungNachweisbar(b) ? "ja (Bestätigung zugestellt)" : "nein" }, { label: "Einwilligung", wert: b.einwilligung_zeit ? datumZeit(b.einwilligung_zeit) : "–" }, { label: "Kunden-Token", wert: b.kunden_token_hash ? "vorhanden" : "–" }, { label: "Abschließen ab", wert: abschliessenAb(b, bez.lieferscheine) ? datum(abschliessenAb(b, bez.lieferscheine)) : "–" }]} /></div>
              </details>
            </Kachel>
          </div>
        )}
        {tab === "zahlung" && (
          <div className="flex min-w-0 flex-col gap-6">
            <Kachel titel="Zahlungen" unter={`offen ${cent(o)}`} testid="zahlungen-tab">
              {bez.zahlungen.length ? (
                <ul className="bo-shop-zeilen">
                  {bez.zahlungen.map((z) => (
                    <li key={z.name} className="bo-shop-zeile">
                      <span className="bo-shop-zeile__ico" aria-hidden="true"><ShopIcon name={z.art === "Erstattung" ? "Undo2" : z.kanal === "Gutschein" ? "Ticket" : "CreditCard"} /></span>
                      <span className="min-w-0"><a href={`/shop/zahlungen/${encodeURIComponent(z.name)}`} className="block truncate text-[15px] font-semibold hover:underline">{z.art === "Erstattung" ? "Erstattung" : "Eingang"} · {kanalText(z.kanal)}</a><span className="bo-shop-unter">{z.name} · {datumZeit(z.zeitpunkt)}</span></span>
                      <span className="flex items-center gap-3"><StatusBadge wert={z.status} text={statusInfo("PH Zahlung", z.status).anzeige} ton={statusInfo("PH Zahlung", z.status).ton} gebucht={Number(z.docstatus) === 1} /><span className="bo-shop-betrag w-24">{z.art === "Erstattung" ? "−" : ""}{cent(Math.abs(Number(z.betrag_cent)))}</span></span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-[15px] text-bo-text-soft">Noch keine Zahlung. Offen {cent(o)}.</p>
              )}
            </Kachel>
            {b.zahlungslink_url && (
              <Kachel titel="Zahlungslink" unter={Number(b.zahlungslink_simuliert) ? "simuliert" : undefined}>
                <Fakten eintraege={[{ label: "Gültig bis", wert: b.zahlungslink_gueltig_bis ? datumZeit(b.zahlungslink_gueltig_bis) : "–" }, { label: "Gesendet", wert: b.zahlungslink_gesendet_am ? datumZeit(b.zahlungslink_gesendet_am) : "noch nicht" }, { label: "Link", wert: b.zahlungslink_url, mono: true }]} />
              </Kachel>
            )}
            {(b.erstattungen || []).length > 0 && (
              <Kachel titel="Erstattungen">
                <ul className="bo-shop-posten">
                  {b.erstattungen.map((e) => <li key={e.idx}><span>{e.art} · {datum(e.datum)} · {e.grund}<span className="bo-shop-unter">{e.status === "angefordert" ? "wartet auf Freigabe" : e.status === "nur_forderung" ? "nur Forderung" : `enth. ${cent(e.ust_cent)} USt`}{e.gutschrift ? ` · Gutschrift ${e.gutschrift}` : ""}</span></span><strong className="tabular-nums">{cent(e.betrag_cent)}</strong></li>)}
                </ul>
              </Kachel>
            )}
            {b.radar_markiert ? (
              <Kachel titel="Risiko (Stripe-Prüfung)">
                <Fakten eintraege={[{ label: "Stufe", wert: risikoStufe(b.radar_risk_level) }, { label: "Wert", wert: String(b.radar_risk_score ?? "–") }, { label: "Hinweis", wert: b.radar_hinweis || "–" }, { label: "Geprüft", wert: b.radar_geprueft_am ? `${datumZeit(b.radar_geprueft_am)}` : "offen" }]} />
              </Kachel>
            ) : null}
          </div>
        )}
        {tab === "verlauf" && (
          <Kachel titel="Verlauf">
            <Verlauf verlauf={b.verlauf} docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} />
          </Kachel>
        )}
      </AkteGeruest>
    </Rahmen>
  );
}
