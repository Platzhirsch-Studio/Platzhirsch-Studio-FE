// /shop/widerrufe/[name] – Widerrufsakte (T5; 10-konzept-shop § 5.6, E10, E11): Fristen ab Zustellung lt.
// Sendungsverfolgung (Quelle sichtbar), „Zustelldatum übernehmen“, Belehrung nachweisbar?, Tabs Erklärung ·
// Zuordnung · Abwicklung · Verlauf; Erstatten erst ab Wareneingang oder Absendenachweis.
import { notFound } from "next/navigation";
import { zugang } from "@/lib/backoffice/shop/zugang";
import { akte, sicher, bestellBezuege } from "@/lib/backoffice/shop/daten";
import { widerrufAktionen } from "@/lib/backoffice/shop/aktenAktionen";
import { statusInfo, mailStatusText } from "@/lib/backoffice/shop/status";
import { zustellung, widerrufsFristen, ampel, belehrungNachweisbar, tagVon, hinsendekosten } from "@/lib/backoffice/shop/fristen";
import { erstattungRechnen, satzText } from "@/lib/backoffice/shop/geld";
import { docFuerAktion } from "@/lib/backoffice/shop/zeilen";
import { T } from "@/lib/backoffice/shop/texte";
import { cent, datum, datumZeit } from "@/lib/backoffice/format";
import { aktiverTab } from "@/lib/backoffice/akte/geruest";
import Rahmen from "@/components/Backoffice/Shop/Rahmen";
import { AkteGeruest, AkteKopf, Band, RechteSpalte, AkteTabs } from "@/components/Backoffice/Akte";
import Kachel from "@/components/Backoffice/Kachel";
import StatusBadge from "@/components/Backoffice/StatusBadge";
import { AktenAktionen, SperrGruende } from "@/components/Backoffice/Shop/AktionsKnoepfe";
import { BandKnopf } from "@/components/Backoffice/Shop/Teile";
import NachweisUpload from "@/components/Backoffice/Shop/NachweisUpload";
import { Phasenleiste, Verlauf, Fakten, BezugListe } from "@/components/Backoffice/Shop/Akteteile";
import { Thumb } from "@/components/Backoffice/Shop/Dialoge";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return { title: `${decodeURIComponent((await params).name)} · Widerruf` };
}

const FLUSS = ["Eingegangen", "Bestaetigt", "Ware erwartet", "Ware erhalten", "Erstattet"];

export default async function WiderrufAkte({ params, searchParams }) {
  const { name: roh } = await params;
  const name = decodeURIComponent(roh);
  const sp = await searchParams;
  const ctx = await zugang(`/shop/widerrufe/${roh}`);
  const { client, session, leitung, heute } = ctx;
  const a = await akte(client, "PH Widerruf", name);
  if (!a?.doc) notFound();
  const w = a.doc;
  const b = w.bestellung ? await sicher(() => client.getDoc("PH Bestellung", w.bestellung), null) : null;
  const bez = b ? await bestellBezuege(client, b.name) : { lieferscheine: [], zahlungen: [], rechnungen: [] };
  const zust = b ? zustellung(b, bez.lieferscheine) : { datum: null, quelle: null, geschaetzt: true };
  const fr = widerrufsFristen(w, zust);
  const nachweis = (a.docinfo?.attachments || []).length > 0 || (a.docinfo?.comments || []).some((k) => /Absendenachweis/.test(k.content || ""));
  const ak = widerrufAktionen(w, { leitung, bestellung: b, zust, nachweis });
  const st = statusInfo("PH Widerruf", w.status);
  const erledigt = ["Erstattet", "Abgelehnt"].includes(w.status);
  const tabs = [{ id: "erklaerung", titel: "Erklärung" }, { id: "zuordnung", titel: "Zuordnung" }, { id: "abwicklung", titel: "Abwicklung" }, { id: "verlauf", titel: "Verlauf" }];
  const tab = aktiverTab(tabs, sp.tab);
  const basis = `/shop/widerrufe/${roh}`;
  const doc = { doctype: "PH Widerruf", name, status: w.status, retoure: w.retoure, positionen: w.positionen || [] };
  const extraBestellung = b ? docFuerAktion(b) : null;
  // Aktionen mit Bestellbezug (E10-Dialog) bekommen die Bestellung mit
  const mitBestellung = (x) => (x && x.id === "widerruf-erstatten" ? { ...x, extra: { ...(x.extra || {}), bestellung: extraBestellung } } : x);
  const aktionen = { primaer: mitBestellung(ak.primaer), sekundaer: ak.sekundaer.map(mitBestellung), menue: ak.menue };
  const abw = zust.datum && w.erhalten_am && !zust.geschaetzt && tagVon(w.erhalten_am) !== zust.datum;
  const baender = [
    abw ? { id: "erhalt", ton: "info", text: T.baender.erhaltAbweichung(datum(w.erhalten_am), datum(zust.datum)), aktion: <BandKnopf id="zustelldatum" titel={`Zustelldatum ${datum(zust.datum)} übernehmen`} doc={doc} /> } : null,
    !w.bestellung && !w.gutschein_bestellung ? { id: "zuordnung", ton: "gefahr", text: T.baender.nichtZugeordnet } : null,
    w.mail_status === "limit" || w.mail_status === "fehlgeschlagen" ? { id: "limit", ton: "warnung", text: T.baender.limit } : null,
    b && !belehrungNachweisbar(b) ? { id: "belehrung", ton: "warnung", text: T.baender.belehrung } : null,
    Number(w.fristgerecht) === 0 && zust.datum && !zust.geschaetzt ? { id: "frist", ton: "warnung", text: T.baender.nachFrist } : null,
  ].filter(Boolean);
  const amp = (bis) => ampel(bis, heute, { erledigt });
  const pos = b?.positionen || [];
  const auswahl = Object.fromEntries(pos.map((p) => [String(p.idx), (w.positionen || []).some((x) => x.slug === p.slug || x.bezeichnung === p.bezeichnung) ? Number(p.menge) - Number(p.zurueck_menge || 0) : 0]));
  const versand = b ? hinsendekosten(b, auswahl) : 0;
  const v = erstattungRechnen(pos, auswahl, { versand_cent: versand });
  return (
    <Rahmen session={session} modus={client.modus}>
      <AkteGeruest testid="widerrufsakte"
        kopf={<AkteKopf zurueck={{ href: "/shop/widerrufe", titel: "Widerruf & Retouren" }} krumen={[{ titel: "Shop", href: "/shop" }, { titel: "Widerruf & Retouren", href: "/shop/widerrufe" }, { titel: name }]} titel={w.kunde_name} nummer={<span className="bo-shop-zelle-nr mr-2">{name} · {w.bestellung ? `Widerruf ${w.bestellung}` : w.gutschein_bestellung ? `Gutscheinkauf ${w.gutschein_bestellung}` : "nicht zugeordnet"}</span>} status={<StatusBadge wert={w.status} text={st.anzeige} ton={st.ton} groesse="m" />} betrag={Number(w.erstattungsbetrag_cent) ? { cent: Number(w.erstattungsbetrag_cent), unter: "Erstattung" } : undefined} aktionen={<AktenAktionen primaer={aktionen.primaer} sekundaer={aktionen.sekundaer} menue={aktionen.menue} doc={doc} />} />}
        band={baender[0] ? <div className="mb-6"><Band ton={baender[0].ton} text={baender[0].text} aktion={baender[0].aktion} testid={`band-${baender[0].id}`} />{baender.length > 1 && <p className="mt-2 text-[12px] text-bo-text-soft" data-testid="weitere-hinweise">+{baender.length - 1}: {baender.slice(1).map((x) => x.text).join(" · ")}</p>}</div> : null}
        vorgang={
          <>
            <SperrGruende aktionen={[ak.primaer, ...ak.sekundaer]} />
            <Phasenleiste label="Widerruf" schritte={FLUSS.map((s, i) => ({ id: s, titel: statusInfo("PH Widerruf", s).anzeige, zustand: w.status === "Abgelehnt" ? (i === 0 ? "erledigt" : "offen") : i < FLUSS.indexOf(w.status) ? "erledigt" : i === FLUSS.indexOf(w.status) ? "aktuell" : "offen" }))} />
            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3" data-testid="fristen">
              {[["Widerruf bis", fr.widerrufBis, zust.datum ? `ab ${zust.geschaetzt ? "Versand (geschätzt)" : "Zustellung"} ${datum(zust.datum)}${zust.geschaetzt ? "" : `, ${zust.quelle}`}` : "Zustellung unbekannt"], ["Rücksendung bis", fr.ruecksendungBis, "ab Eingang des Widerrufs"], ["Rückzahlung bis", w.erstattung_bis || fr.rueckzahlungBis, "zurückbehalten bis Ware oder Absendenachweis"]].map(([t, bis, q]) => {
                const x = amp(bis);
                return (
                  <div key={t} className="bo-shop-flaeche">
                    <p className="text-[13px] text-bo-text-soft">{t}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[17px] font-semibold tabular-nums">{bis ? datum(bis) : "–"}<StatusBadge wert={x.ton} text={t === "Widerruf bis" && fr.fristgerecht !== null ? (fr.fristgerecht ? "fristgerecht" : "nach Fristende") : x.text} ton={t === "Widerruf bis" && fr.fristgerecht !== null ? (fr.fristgerecht ? "gruen" : "orange") : x.ton === "rot" ? "rot" : x.ton === "orange" ? "orange" : x.ton === "gruen" ? "gruen" : "grau"} /></p>
                    <p className="mt-1 text-[12px] text-bo-text-soft">{q}</p>
                  </div>
                );
              })}
            </div>
          </>
        }
        vorgangOben
        reiter={<AkteTabs tabs={tabs} aktiv={tab} basis={basis} params={{}} />}
        rechts={<RechteSpalte bezuege={<BezugListe eintraege={[b ? { titel: `Bestellung ${b.name}`, wert: statusInfo("PH Bestellung", b.status, b).anzeige, href: `/shop/bestellungen/${encodeURIComponent(b.name)}`, icon: "ShoppingBag" } : null, w.retoure ? { titel: `Retoure ${w.retoure}`, wert: "Rücksendung", href: `/shop/retouren/${encodeURIComponent(w.retoure)}`, icon: "PackageCheck" } : null, ...bez.lieferscheine.map((l) => ({ titel: `Lieferschein ${l.name}`, wert: l.zugestellt_am ? `zugestellt ${datum(l.zugestellt_am)}` : l.status, icon: "Truck" })), w.erstattung ? { titel: `Erstattung ${w.erstattung}`, wert: "Zahlung", href: `/shop/zahlungen/${encodeURIComponent(w.erstattung)}`, icon: "Undo2" } : null].filter(Boolean)} />} />}
      >
        {tab === "erklaerung" && <Kachel titel="Erklärung"><Fakten eintraege={[{ label: "Name", wert: w.kunde_name }, { label: "E-Mail", wert: w.kunde_email }, { label: "Anschrift", wert: w.anschrift || "–" }, { label: "Eingang", wert: `${datumZeit(w.eingegangen_am)} · ${w.kanal}` }, { label: "Bestellt am", wert: w.bestellt_am ? datum(w.bestellt_am) : "–" }, { label: "Erhalten am (Server)", wert: w.erhalten_am ? datum(w.erhalten_am) : "–" }, { label: "Artikel", wert: w.artikel || "–" }, { label: "Nachricht", wert: w.nachricht || "–" }, { label: "Eingangsbestätigung", wert: mailStatusText(w.mail_status) }]} /></Kachel>}
        {tab === "zuordnung" && (
          <Kachel titel="Zuordnung">
            {w.bestellung || w.gutschein_bestellung ? <Fakten eintraege={[{ label: w.bestellung ? "Bestellung" : "Gutscheinkauf", wert: w.bestellung || w.gutschein_bestellung, href: w.bestellung ? `/shop/bestellungen/${encodeURIComponent(w.bestellung)}` : `/shop/gutscheinkaeufe/${encodeURIComponent(w.gutschein_bestellung)}` }, { label: "Angabe des Kunden", wert: w.angabe || "–" }]} /> : <div className="flex flex-col gap-3"><p className="font-semibold text-bo-ziegel-text">nicht zugeordnet</p><p className="text-[14px] text-bo-text-soft">Angabe des Kunden: {w.angabe || "–"}</p><BandKnopf id="widerruf-zuordnen" titel="Bestellung zuordnen" doc={doc} variant="primary" /></div>}
          </Kachel>
        )}
        {tab === "abwicklung" && (
          <div className="flex min-w-0 flex-col gap-6">
            <Kachel titel="Positionen" unter="Vorschlag aus der Erklärung – positionsgenau im Dialog „Erstatten …“">
              {pos.length ? (
                <ul className="bo-shop-zeilen">{pos.map((p) => <li key={p.idx} className="bo-shop-zeile" style={{ gridTemplateColumns: "48px minmax(0,1fr) auto" }}><Thumb bild={p.bild} /><span className="min-w-0"><span className="block truncate font-semibold">{p.bezeichnung}</span><span className="bo-shop-unter">{p.menge} × {cent(p.einzel_cent)}</span></span><span className="tabular-nums">zurück {auswahl[String(p.idx)] || 0}</span></li>)}</ul>
              ) : <p className="text-[14px] text-bo-text-soft">Keine Bestellung zugeordnet.</p>}
              <ul className="bo-shop-posten mt-4">
                <li><span>Hinsendekosten {versand ? "(Vollwiderruf)" : "(Teilwiderruf)"}</span><span className="tabular-nums">{cent(versand)}</span></li>
                <li><span>Rücksendekosten trägt Kunde</span><span>{b && belehrungNachweisbar(b) ? "ja (belehrt)" : "nein – Belehrung nicht nachweisbar"}</span></li>
                <li><strong>Erstattung</strong><strong className="tabular-nums">{cent(v.betrag_cent)} {(v.posten || []).map((x) => `(enth. ${cent(x.ust_cent)} USt ${satzText(x.satz_promille)})`).join(" ")}</strong></li>
              </ul>
            </Kachel>
            <Kachel titel="Absendenachweis" unter="PDF oder JPG, höchstens 10 MB">
              <NachweisUpload widerruf={name} vorhanden={nachweis} schreiben={ctx.schreiben} />
            </Kachel>
            {w.ablehnungsgrund && <Kachel titel="Ablehnung"><p className="text-[15px]">{w.ablehnungsgrund}</p></Kachel>}
          </div>
        )}
        {tab === "verlauf" && <Kachel titel="Verlauf"><Verlauf docinfo={a.docinfo} filter={sp.verlauf || "alle"} basis={`${basis}?tab=verlauf`} /></Kachel>}
      </AkteGeruest>
    </Rahmen>
  );
}
